/**
 * Performance monitoring utility for BOQ Builder
 * Tracks runtime performance metrics and provides alerts for performance regressions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.thresholds = {
      renderTime: 16, // 60fps target
      searchTime: 200, // Search should complete within 200ms
      loadTime: 3000, // Initial load should complete within 3s
      memoryUsage: 100 * 1024 * 1024, // 100MB memory limit
      bundleSize: 500 * 1024 // 500KB bundle size limit
    };
    
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('performance-monitoring') === 'true';
    
    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  initializeMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('longTask', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
            
            if (entry.duration > 50) {
              this.alertPerformanceIssue('Long task detected', {
                duration: entry.duration,
                threshold: 50
              });
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }

      // Monitor layout shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              this.recordMetric('layoutShift', {
                value: entry.value,
                startTime: entry.startTime
              });
            }
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }

      // Monitor largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.recordMetric('largestContentfulPaint', {
            value: lastEntry.startTime,
            element: lastEntry.element?.tagName
          });
          
          if (lastEntry.startTime > 2500) {
            this.alertPerformanceIssue('Slow LCP detected', {
              value: lastEntry.startTime,
              threshold: 2500
            });
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }
    }

    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor bundle performance
    this.monitorBundleMetrics();
  }

  startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        this.recordMetric('memory', {
          used: memInfo.usedJSHeapSize,
          total: memInfo.totalJSHeapSize,
          limit: memInfo.jsHeapSizeLimit,
          timestamp: Date.now()
        });

        if (memInfo.usedJSHeapSize > this.thresholds.memoryUsage) {
          this.alertPerformanceIssue('High memory usage detected', {
            used: memInfo.usedJSHeapSize,
            threshold: this.thresholds.memoryUsage
          });
        }
      }, 10000); // Check every 10 seconds
    }
  }

  monitorBundleMetrics() {
    // Monitor initial bundle load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.recordMetric('initialLoad', {
        duration: loadTime,
        timestamp: Date.now()
      });

      if (loadTime > this.thresholds.loadTime) {
        this.alertPerformanceIssue('Slow initial load detected', {
          duration: loadTime,
          threshold: this.thresholds.loadTime
        });
      }
    });

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('.js') || entry.name.includes('.css')) {
              this.recordMetric('resourceLoad', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.name.includes('.js') ? 'javascript' : 'css'
              });
            }
          }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }

  // Public API methods
  startTiming(label) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric('customTiming', {
          label,
          duration,
          timestamp: Date.now()
        });
        return duration;
      }
    };
  }

  measureRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();
    
    const timer = this.startTiming(`render-${componentName}`);
    const result = renderFn();
    const duration = timer.end();
    
    if (duration > this.thresholds.renderTime) {
      this.alertPerformanceIssue(`Slow render: ${componentName}`, {
        duration,
        threshold: this.thresholds.renderTime
      });
    }
    
    return result;
  }

  measureAsync(label, asyncFn) {
    if (!this.isEnabled) return asyncFn();
    
    const timer = this.startTiming(label);
    
    if (asyncFn.then) {
      return asyncFn.then(result => {
        timer.end();
        return result;
      }).catch(error => {
        timer.end();
        throw error;
      });
    }
    
    return asyncFn();
  }

  recordMetric(type, data) {
    if (!this.isEnabled) return;
    
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type);
    metrics.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });
    
    // Keep only last 100 entries per metric type
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  alertPerformanceIssue(message, data) {
    if (!this.isEnabled) return;
    
    console.warn(`🚨 Performance Alert: ${message}`, data);
    
    // Store alert for later analysis
    this.recordMetric('performanceAlert', {
      message,
      data,
      severity: this.calculateSeverity(data)
    });
    
    // In development, show toast notification
    if (process.env.NODE_ENV === 'development' && window.toast) {
      window.toast.error(`Performance: ${message}`);
    }
  }

  calculateSeverity(data) {
    if (data.duration) {
      const ratio = data.duration / data.threshold;
      if (ratio > 3) return 'critical';
      if (ratio > 2) return 'high';
      if (ratio > 1.5) return 'medium';
      return 'low';
    }
    return 'medium';
  }

  getMetrics(type) {
    return this.metrics.get(type) || [];
  }

  getAllMetrics() {
    const result = {};
    for (const [type, metrics] of this.metrics.entries()) {
      result[type] = metrics;
    }
    return result;
  }

  getPerformanceReport() {
    const metrics = this.getAllMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      alerts: metrics.performanceAlert || [],
      recommendations: []
    };

    // Calculate summary statistics
    if (metrics.customTiming) {
      const renderMetrics = metrics.customTiming.filter(m => m.label.startsWith('render-'));
      if (renderMetrics.length > 0) {
        const avgRenderTime = renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length;
        report.summary.averageRenderTime = avgRenderTime;
        
        if (avgRenderTime > this.thresholds.renderTime) {
          report.recommendations.push('Consider optimizing component renders with React.memo');
        }
      }
    }

    if (metrics.memory && metrics.memory.length > 0) {
      const latestMemory = metrics.memory[metrics.memory.length - 1];
      report.summary.memoryUsage = latestMemory.used;
      
      if (latestMemory.used > this.thresholds.memoryUsage * 0.8) {
        report.recommendations.push('Memory usage is high. Consider implementing cleanup in useEffect hooks');
      }
    }

    if (metrics.longTask && metrics.longTask.length > 0) {
      report.summary.longTaskCount = metrics.longTask.length;
      report.recommendations.push('Long tasks detected. Consider breaking up heavy computations');
    }

    return report;
  }

  exportMetrics() {
    const report = this.getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearMetrics() {
    this.metrics.clear();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export both the class and the singleton
export { PerformanceMonitor, performanceMonitor };
export default performanceMonitor;
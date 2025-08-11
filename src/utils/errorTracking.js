/**
 * Error tracking and logging utility for BOQ Builder
 * Provides comprehensive error logging, reporting, and debugging capabilities
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.isEnabled = true;
    this.sessionId = this.generateSessionId();
    
    // Initialize error tracking
    this.initializeErrorTracking();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeErrorTracking() {
    // Global error handler for unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // React error boundary integration
    this.setupReactErrorBoundary();
  }

  setupReactErrorBoundary() {
    // This will be called by ErrorBoundary components
    window.reportReactError = (error, errorInfo) => {
      this.logError({
        type: 'react_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    };
  }

  logError(errorData) {
    if (!this.isEnabled) return;

    const enrichedError = {
      id: this.generateErrorId(),
      sessionId: this.sessionId,
      ...errorData,
      context: this.getContextInfo(),
      performance: this.getPerformanceContext(),
      severity: this.calculateSeverity(errorData)
    };

    this.errors.push(enrichedError);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Tracked: ${enrichedError.type}`);
      console.error('Message:', enrichedError.message);
      console.error('Stack:', enrichedError.stack);
      console.error('Context:', enrichedError.context);
      console.error('Full Error:', enrichedError);
      console.groupEnd();
    }

    // Store in localStorage for persistence
    this.persistErrors();

    // Trigger error reporting if configured
    this.reportError(enrichedError);
  }

  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getContextInfo() {
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  getPerformanceContext() {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint()
    };
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  getLargestContentfulPaint() {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : null;
  }

  calculateSeverity(errorData) {
    // Determine error severity based on type and content
    if (errorData.type === 'javascript_error') {
      if (errorData.message.includes('ChunkLoadError') || 
          errorData.message.includes('Loading chunk')) {
        return 'medium';
      }
      if (errorData.message.includes('Network Error') || 
          errorData.message.includes('fetch')) {
        return 'medium';
      }
      return 'high';
    }
    
    if (errorData.type === 'react_error') {
      return 'high';
    }
    
    if (errorData.type === 'unhandled_promise_rejection') {
      return 'medium';
    }
    
    return 'low';
  }

  persistErrors() {
    try {
      const errorData = {
        sessionId: this.sessionId,
        errors: this.errors.slice(-20), // Keep last 20 errors
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('boq_error_log', JSON.stringify(errorData));
    } catch (error) {
      console.warn('Failed to persist errors to localStorage:', error);
    }
  }

  loadPersistedErrors() {
    try {
      const stored = localStorage.getItem('boq_error_log');
      if (stored) {
        const data = JSON.parse(stored);
        return data.errors || [];
      }
    } catch (error) {
      console.warn('Failed to load persisted errors:', error);
    }
    return [];
  }

  reportError(errorData) {
    // In a production environment, this would send errors to a logging service
    // For now, we'll just store them locally and provide export functionality
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // this.sendToErrorService(errorData);
    }
  }

  // Public API methods
  logCustomError(message, context = {}) {
    this.logError({
      type: 'custom_error',
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  logWarning(message, context = {}) {
    this.logError({
      type: 'warning',
      message,
      context,
      timestamp: new Date().toISOString(),
      severity: 'low'
    });
  }

  logInfo(message, context = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.info('ℹ️ Info:', message, context);
    }
  }

  getErrors(filter = {}) {
    let filteredErrors = [...this.errors];

    if (filter.type) {
      filteredErrors = filteredErrors.filter(error => error.type === filter.type);
    }

    if (filter.severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === filter.severity);
    }

    if (filter.since) {
      const sinceDate = new Date(filter.since);
      filteredErrors = filteredErrors.filter(error => 
        new Date(error.timestamp) >= sinceDate
      );
    }

    return filteredErrors.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      recent: this.errors.filter(error => 
        new Date() - new Date(error.timestamp) < 24 * 60 * 60 * 1000
      ).length
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  exportErrorReport() {
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      stats: this.getErrorStats(),
      errors: this.errors,
      context: this.getContextInfo(),
      performance: this.getPerformanceContext()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('boq_error_log');
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Integration with performance monitoring
  integrateWithPerformanceMonitor(performanceMonitor) {
    // Log performance alerts as warnings
    const originalAlert = performanceMonitor.alertPerformanceIssue.bind(performanceMonitor);
    performanceMonitor.alertPerformanceIssue = (message, data) => {
      this.logWarning(`Performance Alert: ${message}`, data);
      return originalAlert(message, data);
    };
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

// Export both the class and the singleton
export { ErrorTracker, errorTracker };
export default errorTracker;
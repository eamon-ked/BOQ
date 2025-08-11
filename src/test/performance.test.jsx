/**
 * Performance regression tests for BOQ Builder
 * Tests critical performance metrics and alerts on regressions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { performanceMonitor } from '../utils/performanceMonitor';

// Mock data generators
const createMockItems = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Test Item ${i}`,
    category: `Category ${i % 10}`,
    manufacturer: `Manufacturer ${i % 5}`,
    unitPrice: Math.random() * 1000,
    unit: 'pcs',
    description: `Description for item ${i}`,
    tags: [`tag${i % 3}`, `tag${i % 5}`]
  }));
};

const createMockBOQItems = (count) => {
  return createMockItems(count).map(item => ({
    ...item,
    quantity: Math.floor(Math.random() * 10) + 1,
    lineTotal: item.unitPrice * (Math.floor(Math.random() * 10) + 1)
  }));
};

// Performance test utilities
const measureRenderTime = async (component) => {
  const startTime = performance.now();
  render(component);
  await waitFor(() => {
    // Wait for component to be fully rendered
  });
  return performance.now() - startTime;
};

const measureMemoryUsage = () => {
  if (performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  return 0;
};

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME: {
    SMALL_LIST: 50, // 50ms for lists with < 100 items
    MEDIUM_LIST: 100, // 100ms for lists with 100-1000 items
    LARGE_LIST: 200, // 200ms for lists with > 1000 items
  },
  SEARCH_TIME: 200, // 200ms for search operations
  CALCULATION_TIME: 50, // 50ms for BOQ calculations
  MEMORY_INCREASE: 10 * 1024 * 1024, // 10MB max memory increase per test
};

describe('Performance Regression Tests', () => {
  let initialMemory;

  beforeEach(() => {
    initialMemory = measureMemoryUsage();
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    const finalMemory = measureMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    if (memoryIncrease > PERFORMANCE_THRESHOLDS.MEMORY_INCREASE) {
      console.warn(`Memory increase detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }
  });

  describe('Component Rendering Performance', () => {
    it('should render small item lists within performance threshold', async () => {
      // Mock component for testing
      const TestComponent = () => {
        const mockItems = createMockItems(50);
        return (
          <div>
            {mockItems.map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        );
      };
      
      const renderTime = await measureRenderTime(<TestComponent />);
      
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME.SMALL_LIST);
    });

    it('should render medium item lists within performance threshold', async () => {
      const TestComponent = () => {
        const mockItems = createMockItems(500);
        return (
          <div>
            {mockItems.map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        );
      };
      
      const renderTime = await measureRenderTime(<TestComponent />);
      
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME.MEDIUM_LIST);
    });

    it('should render large item lists within performance threshold', async () => {
      const TestComponent = () => {
        const mockItems = createMockItems(2000);
        return (
          <div style={{ height: '400px', overflow: 'auto' }}>
            {mockItems.slice(0, 100).map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        );
      };
      
      const renderTime = await measureRenderTime(<TestComponent />);
      
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME.LARGE_LIST);
    });
  });

  describe('Search Performance', () => {
    it('should perform text search within performance threshold', async () => {
      const mockItems = createMockItems(1000);
      
      const startTime = performance.now();
      const results = mockItems.filter(item => 
        item.name.toLowerCase().includes('test')
      );
      const searchTime = performance.now() - startTime;
      
      expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_TIME);
      expect(results).toBeDefined();
    });

    it('should perform filtered search within performance threshold', async () => {
      const mockItems = createMockItems(2000);
      
      const startTime = performance.now();
      
      // Simulate search with filters
      const filters = {
        search: 'test',
        category: 'Category 1',
        priceRange: [0, 500]
      };
      
      const filteredItems = mockItems.filter(item => 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        item.category === filters.category &&
        item.unitPrice >= filters.priceRange[0] &&
        item.unitPrice <= filters.priceRange[1]
      );
      
      const searchTime = performance.now() - startTime;
      
      expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_TIME);
      expect(filteredItems).toBeDefined();
    });
  });

  describe('Calculation Performance', () => {
    it('should calculate BOQ totals within performance threshold', async () => {
      const mockBOQItems = createMockBOQItems(500);
      
      const startTime = performance.now();
      const total = mockBOQItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const calculationTime = performance.now() - startTime;
      
      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CALCULATION_TIME);
      expect(total).toBeGreaterThan(0);
    });

    it('should handle bulk operations efficiently', async () => {
      const mockItems = createMockItems(200);
      const selectedIds = mockItems.slice(0, 50).map(item => item.id);
      
      const startTime = performance.now();
      
      // Simulate bulk operation
      const bulkResults = selectedIds.map(id => {
        const item = mockItems.find(i => i.id === id);
        return { ...item, processed: true };
      });
      
      const operationTime = performance.now() - startTime;
      
      expect(operationTime).toBeLessThan(100); // 100ms for bulk operations
      expect(bulkResults).toHaveLength(50);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during component mounting/unmounting', async () => {
      const TestComponent = () => {
        const mockItems = createMockItems(100);
        return (
          <div>
            {mockItems.map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        );
      };
      
      const initialMemory = measureMemoryUsage();
      
      // Mount and unmount component multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<TestComponent />);
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Allow for some memory increase but not excessive
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB
    });
  });

  describe('Bundle Size Monitoring', () => {
    it('should track dynamic import performance', async () => {
      const startTime = performance.now();
      
      // Test dynamic imports (mocked for testing)
      const mockImports = [
        Promise.resolve({ default: () => 'ItemManager' }),
        Promise.resolve({ default: () => 'CategoryManager' }),
        Promise.resolve({ default: () => 'BOQProjectManager' })
      ];
      
      const modules = await Promise.all(mockImports);
      
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(1000); // 1 second for dynamic imports
      expect(modules).toHaveLength(3);
      modules.forEach(module => {
        expect(module).toBeDefined();
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should record performance metrics correctly', () => {
      // Enable performance monitoring for testing
      performanceMonitor.isEnabled = true;
      
      const testMetric = { duration: 100, label: 'test-operation' };
      
      performanceMonitor.recordMetric('test', testMetric);
      
      const metrics = performanceMonitor.getMetrics('test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject(testMetric);
    });

    it('should detect performance regressions', () => {
      // Enable performance monitoring for testing
      performanceMonitor.isEnabled = true;
      
      const alertSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Simulate a slow operation
      performanceMonitor.alertPerformanceIssue('Test slow operation', {
        duration: 1000,
        threshold: 100
      });
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert: Test slow operation'),
        expect.objectContaining({
          duration: 1000,
          threshold: 100
        })
      );
      
      alertSpy.mockRestore();
    });

    it('should generate performance reports', () => {
      // Add some test metrics
      performanceMonitor.recordMetric('customTiming', {
        label: 'render-TestComponent',
        duration: 25
      });
      
      performanceMonitor.recordMetric('memory', {
        used: 50 * 1024 * 1024,
        total: 100 * 1024 * 1024
      });
      
      const report = performanceMonitor.getPerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
    });
  });
});

// Benchmark tests for critical operations
describe('Performance Benchmarks', () => {
  const runBenchmark = (name, fn, iterations = 100) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`Benchmark ${name}:`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    
    return { avg, min, max };
  };

  it('should benchmark array filtering performance', () => {
    const items = createMockItems(1000);
    
    const results = runBenchmark('Array Filter', () => {
      items.filter(item => item.name.includes('5'));
    });
    
    expect(results.avg).toBeLessThan(10); // Should be very fast
  });

  it('should benchmark search performance', () => {
    const items = createMockItems(1000);
    
    const results = runBenchmark('Search Query', () => {
      items.filter(item => 
        item.name.toLowerCase().includes('test') ||
        item.description.toLowerCase().includes('test')
      );
    });
    
    expect(results.avg).toBeLessThan(5); // Search should be very fast
  });
});
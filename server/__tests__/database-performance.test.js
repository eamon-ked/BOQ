const DatabaseService = require('../database');

describe('Database Performance Optimizations', () => {
  let db;

  beforeAll(() => {
    db = new DatabaseService();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.resetQueryStats();
  });

  describe('Query Performance Monitoring', () => {
    test('should track query statistics', () => {
      // Execute some queries
      db.getCategories();
      db.getItems();
      
      const stats = db.getQueryStats();
      
      expect(stats).toHaveProperty('getCategories');
      expect(stats).toHaveProperty('getItems');
      expect(stats.getCategories.count).toBe(1);
      expect(stats.getItems.count).toBe(1);
      expect(stats.getCategories.avgTime).toBeGreaterThan(0);
      expect(stats.getItems.avgTime).toBeGreaterThan(0);
    });

    test('should calculate average query times correctly', () => {
      // Execute the same query multiple times
      db.getCategories();
      db.getCategories();
      db.getCategories();
      
      const stats = db.getQueryStats();
      
      expect(stats.getCategories.count).toBe(3);
      expect(stats.getCategories.avgTime).toBe(stats.getCategories.totalTime / 3);
      expect(stats.getCategories.minTime).toBeLessThanOrEqual(stats.getCategories.avgTime);
      expect(stats.getCategories.maxTime).toBeGreaterThanOrEqual(stats.getCategories.avgTime);
    });

    test('should reset query statistics', () => {
      db.getCategories();
      db.getItems();
      
      let stats = db.getQueryStats();
      expect(Object.keys(stats)).toHaveLength(2);
      
      db.resetQueryStats();
      stats = db.getQueryStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('Prepared Statement Caching', () => {
    test('should cache prepared statements', () => {
      const stmt1 = db.getPreparedStatement('test1', 'SELECT 1');
      const stmt2 = db.getPreparedStatement('test1', 'SELECT 1');
      
      // Should return the same cached statement
      expect(stmt1).toBe(stmt2);
    });

    test('should create different statements for different keys', () => {
      const stmt1 = db.getPreparedStatement('test1', 'SELECT 1');
      const stmt2 = db.getPreparedStatement('test2', 'SELECT 2');
      
      expect(stmt1).not.toBe(stmt2);
    });
  });

  describe('Optimized Search Methods', () => {
    test('should perform fast category-based searches', () => {
      const startTime = performance.now();
      const items = db.getItemsByCategory('CCTV');
      const endTime = performance.now();
      
      expect(Array.isArray(items)).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be under 50ms
    });

    test('should perform fast text searches', () => {
      const startTime = performance.now();
      const items = db.searchItems('camera');
      const endTime = performance.now();
      
      expect(Array.isArray(items)).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be under 50ms
    });

    test('should handle search with multiple filters', () => {
      const startTime = performance.now();
      const items = db.searchItems('camera', 'CCTV', [100, 300], 10, 0);
      const endTime = performance.now();
      
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeLessThanOrEqual(10);
      expect(endTime - startTime).toBeLessThan(50); // Should be under 50ms
      
      // Verify filtering works
      items.forEach(item => {
        expect(item.category).toBe('CCTV');
        expect(item.unitPrice).toBeGreaterThanOrEqual(100);
        expect(item.unitPrice).toBeLessThanOrEqual(300);
      });
    });
  });

  describe('Performance Requirements Compliance', () => {
    test('getItems should complete within 100ms', () => {
      const startTime = performance.now();
      const items = db.getItems();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      expect(Array.isArray(items)).toBe(true);
    });

    test('getBOQProjects should complete within 100ms', () => {
      const startTime = performance.now();
      const projects = db.getBOQProjects();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      expect(Array.isArray(projects)).toBe(true);
    });

    test('search operations should complete within 200ms', () => {
      const searchTerms = ['camera', 'cable', 'power', 'network'];
      
      searchTerms.forEach(term => {
        const startTime = performance.now();
        const results = db.searchItems(term);
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(200);
        expect(Array.isArray(results)).toBe(true);
      });
    });
  });

  describe('Database Optimization', () => {
    test('should optimize database connection without errors', () => {
      expect(() => {
        db.optimizeConnection();
      }).not.toThrow();
    });

    test('should handle performance test runner', () => {
      const testResult = db.runPerformanceTest(
        'Test Query',
        () => db.getCategories(),
        5
      );
      
      expect(testResult).toHaveProperty('testName', 'Test Query');
      expect(testResult).toHaveProperty('iterations', 5);
      expect(testResult).toHaveProperty('avgTime');
      expect(testResult).toHaveProperty('minTime');
      expect(testResult).toHaveProperty('maxTime');
      expect(testResult).toHaveProperty('results');
      expect(testResult.results).toHaveLength(5);
    });
  });

  describe('Index Effectiveness', () => {
    test('should use indexes for category queries', () => {
      // This test verifies that category queries are fast, indicating index usage
      const iterations = 100;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        db.getItemsByCategory('CCTV');
        const endTime = performance.now();
        results.push(endTime - startTime);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / iterations;
      
      // With proper indexing, category queries should be very fast
      expect(avgTime).toBeLessThan(10); // Should average under 10ms
    });

    test('should use indexes for price range queries', () => {
      const startTime = performance.now();
      const items = db.searchItems(null, null, [100, 500]);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
      expect(Array.isArray(items)).toBe(true);
      
      // Verify price filtering
      items.forEach(item => {
        expect(item.unitPrice).toBeGreaterThanOrEqual(100);
        expect(item.unitPrice).toBeLessThanOrEqual(500);
      });
    });
  });
});
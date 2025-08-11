import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { optimizedSearch } from '../optimizedSearch.js';
import { searchCache } from '../searchCache.js';
import { searchIndex } from '../searchIndex.js';
import { searchAnalytics } from '../searchAnalytics.js';

// Mock data generators
const generateMockItem = (id, overrides = {}) => ({
  id: `item-${id}`,
  name: `Test Item ${id}`,
  description: `This is a test description for item ${id}`,
  category: `Category ${Math.floor(id / 10) + 1}`,
  manufacturer: `Manufacturer ${Math.floor(id / 20) + 1}`,
  unitPrice: Math.random() * 1000 + 10,
  unit: 'piece',
  tags: [`tag${id % 5}`, `feature${id % 3}`],
  metadata: {
    stockLevel: Math.floor(Math.random() * 100),
    isActive: true
  },
  ...overrides
});

const generateLargeDataset = (size) => {
  return Array.from({ length: size }, (_, i) => generateMockItem(i));
};

const generateSearchTerms = () => [
  'Test',
  'Item',
  'description',
  'Category 1',
  'Manufacturer',
  'test item 100',
  'nonexistent term',
  'a', // single character
  'very long search term that should match nothing',
  '123' // numeric
];

describe('Search Performance Tests', () => {
  let smallDataset, mediumDataset, largeDataset;

  beforeEach(() => {
    // Generate test datasets
    smallDataset = generateLargeDataset(100);
    mediumDataset = generateLargeDataset(1000);
    largeDataset = generateLargeDataset(10000);

    // Clear all caches and indexes
    searchCache.clear();
    searchIndex.clear();
    searchAnalytics.clear();
  });

  afterEach(() => {
    // Clean up
    searchCache.clear();
    searchIndex.clear();
    searchAnalytics.clear();
  });

  describe('Linear Search Performance', () => {
    it('should perform linear search within acceptable time for small dataset', async () => {
      const startTime = performance.now();
      
      const result = await optimizedSearch.search(
        smallDataset,
        'Test Item',
        {},
        { enableIndex: false, enableCache: false }
      );
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(50); // Should complete within 50ms
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.source).toBe('linear');
    });

    it('should perform linear search within acceptable time for medium dataset', async () => {
      const startTime = performance.now();
      
      const result = await optimizedSearch.search(
        mediumDataset,
        'Test Item',
        {},
        { enableIndex: false, enableCache: false }
      );
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(200); // Should complete within 200ms
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.source).toBe('linear');
    });

    it('should handle large dataset linear search', async () => {
      const startTime = performance.now();
      
      const result = await optimizedSearch.search(
        largeDataset,
        'Test Item',
        {},
        { enableIndex: false, enableCache: false }
      );
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.source).toBe('linear');
    });
  });

  describe('Indexed Search Performance', () => {
    it('should build index within acceptable time', async () => {
      const startTime = performance.now();
      
      await optimizedSearch.initializeIndex(largeDataset);
      
      const endTime = performance.now();
      const indexTime = endTime - startTime;

      expect(indexTime).toBeLessThan(500); // Index should build within 500ms
      
      const stats = searchIndex.getIndexStats();
      expect(stats.isBuilt).toBe(true);
      expect(stats.totalItems).toBe(largeDataset.length);
      expect(stats.totalWords).toBeGreaterThan(0);
    });

    it('should perform indexed search faster than linear for large dataset', async () => {
      // Build index first
      await optimizedSearch.initializeIndex(largeDataset);

      // Test indexed search
      const indexedStartTime = performance.now();
      const indexedResult = await optimizedSearch.search(
        largeDataset,
        'Test Item',
        {},
        { enableIndex: true, enableCache: false }
      );
      const indexedEndTime = performance.now();
      const indexedTime = indexedEndTime - indexedStartTime;

      // Test linear search
      const linearStartTime = performance.now();
      const linearResult = await optimizedSearch.search(
        largeDataset,
        'Test Item',
        {},
        { enableIndex: false, enableCache: false }
      );
      const linearEndTime = performance.now();
      const linearTime = linearEndTime - linearStartTime;

      // Indexed search should be faster for large datasets
      expect(indexedTime).toBeLessThan(linearTime);
      expect(indexedResult.indexUsed).toBe(true);
      expect(linearResult.source).toBe('linear');
      
      // Results should be comparable
      expect(indexedResult.results.length).toBeGreaterThan(0);
      expect(linearResult.results.length).toBeGreaterThan(0);
    });

    it('should handle complex queries efficiently with index', async () => {
      await optimizedSearch.initializeIndex(largeDataset);

      const complexQueries = [
        'Test Item 100',
        'Category 1 Manufacturer',
        'description test',
        'item category manufacturer'
      ];

      for (const query of complexQueries) {
        const startTime = performance.now();
        
        const result = await optimizedSearch.search(
          largeDataset,
          query,
          {},
          { enableIndex: true, enableCache: false }
        );
        
        const endTime = performance.now();
        const searchTime = endTime - startTime;

        expect(searchTime).toBeLessThan(100); // Should complete within 100ms
        expect(result.indexUsed).toBe(true);
      }
    });
  });

  describe('Cache Performance', () => {
    it('should cache search results and improve subsequent performance', async () => {
      const query = 'Test Item';
      const filters = { category: 'Category 1' };

      // First search (cache miss)
      const firstStartTime = performance.now();
      const firstResult = await optimizedSearch.search(
        mediumDataset,
        query,
        filters,
        { enableCache: true, enableIndex: false }
      );
      const firstEndTime = performance.now();
      const firstTime = firstEndTime - firstStartTime;

      expect(firstResult.cacheHit).toBe(false);

      // Second search (cache hit)
      const secondStartTime = performance.now();
      const secondResult = await optimizedSearch.search(
        mediumDataset,
        query,
        filters,
        { enableCache: true, enableIndex: false }
      );
      const secondEndTime = performance.now();
      const secondTime = secondEndTime - secondStartTime;

      expect(secondResult.cacheHit).toBe(true);
      expect(secondTime).toBeLessThan(firstTime); // Cache should be faster
      expect(secondResult.results.length).toBe(firstResult.results.length);
    });

    it('should handle cache eviction properly', async () => {
      // Configure small cache for testing
      searchCache.maxSize = 5;

      const queries = Array.from({ length: 10 }, (_, i) => `query ${i}`);

      // Fill cache beyond capacity
      for (const query of queries) {
        await optimizedSearch.search(
          smallDataset,
          query,
          {},
          { enableCache: true, enableIndex: false }
        );
      }

      const stats = searchCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(5); // Should not exceed max size
      expect(stats.hitCount + stats.missCount).toBe(queries.length);
    });

    it('should invalidate cache when items change', async () => {
      const query = 'Test Item';
      
      // Initial search
      const firstResult = await optimizedSearch.search(
        smallDataset,
        query,
        {},
        { enableCache: true }
      );
      expect(firstResult.cacheHit).toBe(false);

      // Second search (should hit cache)
      const secondResult = await optimizedSearch.search(
        smallDataset,
        query,
        {},
        { enableCache: true }
      );
      expect(secondResult.cacheHit).toBe(true);

      // Update an item (should invalidate cache)
      const updatedItem = { ...smallDataset[0], name: 'Updated Item' };
      optimizedSearch.updateItem(updatedItem);

      // Third search (should miss cache due to invalidation)
      const thirdResult = await optimizedSearch.search(
        smallDataset,
        query,
        {},
        { enableCache: true }
      );
      expect(thirdResult.cacheHit).toBe(false);
    });
  });

  describe('Search Analytics Performance', () => {
    it('should record search analytics without significant performance impact', async () => {
      const queries = generateSearchTerms();
      
      // Test with analytics enabled
      const analyticsStartTime = performance.now();
      for (const query of queries) {
        await optimizedSearch.search(
          mediumDataset,
          query,
          {},
          { enableAnalytics: true, enableCache: false, enableIndex: false }
        );
      }
      const analyticsEndTime = performance.now();
      const analyticsTime = analyticsEndTime - analyticsStartTime;

      // Test with analytics disabled
      searchAnalytics.clear();
      const noAnalyticsStartTime = performance.now();
      for (const query of queries) {
        await optimizedSearch.search(
          mediumDataset,
          query,
          {},
          { enableAnalytics: false, enableCache: false, enableIndex: false }
        );
      }
      const noAnalyticsEndTime = performance.now();
      const noAnalyticsTime = noAnalyticsEndTime - noAnalyticsStartTime;

      // Analytics should not add more than 20% overhead
      const overhead = (analyticsTime - noAnalyticsTime) / noAnalyticsTime;
      expect(overhead).toBeLessThan(0.2);

      // Verify analytics were recorded
      const report = searchAnalytics.getPerformanceReport();
      expect(report.overview.totalSearches).toBe(queries.length);
    });

    it('should provide accurate performance metrics', async () => {
      const queries = ['fast query', 'slow complex query with many terms'];
      
      for (const query of queries) {
        await optimizedSearch.search(
          largeDataset,
          query,
          {},
          { enableAnalytics: true }
        );
      }

      const report = searchAnalytics.getPerformanceReport();
      
      expect(report.overview.totalSearches).toBe(2);
      expect(report.overview.averageSearchTime).toBeGreaterThan(0);
      expect(report.popularQueries).toHaveLength(2);
      expect(report.recentSearches).toHaveLength(2);
    });
  });

  describe('Combined Optimization Performance', () => {
    it('should achieve optimal performance with all optimizations enabled', async () => {
      // Initialize with all optimizations
      await optimizedSearch.initializeIndex(largeDataset);
      
      const query = 'Test Item';
      const filters = { category: 'Category 1' };

      // First search (index + cache miss)
      const firstResult = await optimizedSearch.search(
        largeDataset,
        query,
        filters,
        { enableCache: true, enableIndex: true, enableAnalytics: true }
      );

      expect(firstResult.indexUsed).toBe(true);
      expect(firstResult.cacheHit).toBe(false);

      // Second search (cache hit)
      const secondStartTime = performance.now();
      const secondResult = await optimizedSearch.search(
        largeDataset,
        query,
        filters,
        { enableCache: true, enableIndex: true, enableAnalytics: true }
      );
      const secondEndTime = performance.now();
      const secondTime = secondEndTime - secondStartTime;

      expect(secondResult.cacheHit).toBe(true);
      expect(secondTime).toBeLessThan(10); // Cache hit should be very fast
    });

    it('should handle stress test with multiple concurrent searches', async () => {
      await optimizedSearch.initializeIndex(largeDataset);
      
      const queries = generateSearchTerms();
      const searchPromises = queries.map(query => 
        optimizedSearch.search(
          largeDataset,
          query,
          {},
          { enableCache: true, enableIndex: true, enableAnalytics: true }
        )
      );

      const startTime = performance.now();
      const results = await Promise.all(searchPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // All searches within 1 second
      expect(results).toHaveLength(queries.length);
      
      // Verify all searches completed successfully
      results.forEach(result => {
        expect(result).toHaveProperty('results');
        expect(result).toHaveProperty('searchTime');
        expect(result.searchTime).toBeGreaterThan(0);
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('should maintain reasonable memory usage with large datasets', async () => {
      const veryLargeDataset = generateLargeDataset(50000);
      
      // Build index
      await optimizedSearch.initializeIndex(veryLargeDataset);
      
      // Perform multiple searches to populate cache
      const queries = generateSearchTerms();
      for (const query of queries) {
        await optimizedSearch.search(veryLargeDataset, query, {});
      }

      const stats = optimizedSearch.getPerformanceStats();
      
      // Index memory usage should be reasonable (less than 10MB for 50k items)
      if (stats.index) {
        expect(stats.index.memoryUsage).toBeLessThan(10 * 1024); // 10MB in KB
      }
      
      // Cache should not exceed configured limits
      if (stats.cache) {
        expect(stats.cache.size).toBeLessThanOrEqual(stats.cache.maxSize);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty datasets gracefully', async () => {
      const result = await optimizedSearch.search([], 'test query', {});
      
      expect(result.results).toHaveLength(0);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed items gracefully', async () => {
      const malformedDataset = [
        { id: '1', name: 'Valid Item' },
        { name: 'No ID' }, // Missing ID
        { id: '3' }, // Missing name
        null, // Null item
        undefined, // Undefined item
        { id: '6', name: 'Another Valid Item' }
      ].filter(Boolean); // Remove null/undefined

      const result = await optimizedSearch.search(malformedDataset, 'Valid', {});
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      
      const startTime = performance.now();
      const result = await optimizedSearch.search(mediumDataset, longQuery, {});
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should not hang
      expect(result.results).toBeDefined();
    });

    it('should handle special characters in search queries', async () => {
      const specialQueries = [
        'test@item.com',
        'item-with-dashes',
        'item_with_underscores',
        'item (with parentheses)',
        'item [with brackets]',
        'item {with braces}',
        'item/with/slashes',
        'item\\with\\backslashes',
        'item "with quotes"',
        "item 'with apostrophes'",
        'item & with & ampersands',
        'item + with + plus',
        'item * with * asterisks'
      ];

      for (const query of specialQueries) {
        const result = await optimizedSearch.search(smallDataset, query, {});
        expect(result).toHaveProperty('results');
        expect(result.searchTime).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// Benchmark utility for manual performance testing
export const runSearchBenchmark = async (datasetSize = 10000, iterations = 100) => {
  console.log(`Running search benchmark with ${datasetSize} items, ${iterations} iterations`);
  
  const dataset = generateLargeDataset(datasetSize);
  const queries = generateSearchTerms();
  
  // Test configurations
  const configs = [
    { name: 'Linear Only', enableIndex: false, enableCache: false },
    { name: 'Index Only', enableIndex: true, enableCache: false },
    { name: 'Cache Only', enableIndex: false, enableCache: true },
    { name: 'All Optimizations', enableIndex: true, enableCache: true }
  ];

  const results = {};

  for (const config of configs) {
    console.log(`Testing ${config.name}...`);
    
    // Reset state
    searchCache.clear();
    searchIndex.clear();
    
    if (config.enableIndex) {
      await optimizedSearch.initializeIndex(dataset);
    }

    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const query = queries[i % queries.length];
      const startTime = performance.now();
      
      await optimizedSearch.search(dataset, query, {}, config);
      
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    results[config.name] = {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    };
  }

  console.table(results);
  return results;
};
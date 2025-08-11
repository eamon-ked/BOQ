import { describe, it, expect, beforeEach } from 'vitest';
import { optimizedSearch } from '../optimizedSearch.js';
import { searchCache } from '../searchCache.js';
import { searchIndex } from '../searchIndex.js';
import { searchAnalytics } from '../searchAnalytics.js';

// Simple test data
const testItems = [
  {
    id: '1',
    name: 'Camera',
    description: 'Digital camera for photography',
    category: 'Electronics',
    manufacturer: 'Canon',
    unitPrice: 500,
    tags: ['photo', 'digital']
  },
  {
    id: '2',
    name: 'Lens',
    description: 'Camera lens for professional photography',
    category: 'Electronics',
    manufacturer: 'Canon',
    unitPrice: 300,
    tags: ['photo', 'professional']
  },
  {
    id: '3',
    name: 'Tripod',
    description: 'Sturdy tripod for camera support',
    category: 'Accessories',
    manufacturer: 'Manfrotto',
    unitPrice: 150,
    tags: ['support', 'stable']
  }
];

describe('Search Optimization Basic Tests', () => {
  beforeEach(() => {
    // Clear all caches and indexes
    searchCache.clear();
    searchIndex.clear();
    searchAnalytics.clear();
  });

  describe('Cache Functionality', () => {
    it('should cache search results', async () => {
      const query = 'camera';
      
      // First search (cache miss)
      const firstResult = await optimizedSearch.search(
        testItems,
        query,
        {},
        { enableCache: true, enableIndex: false, enableAnalytics: false }
      );
      
      expect(firstResult.cacheHit).toBe(false);
      expect(firstResult.results.length).toBeGreaterThan(0);
      
      // Second search (cache hit)
      const secondResult = await optimizedSearch.search(
        testItems,
        query,
        {},
        { enableCache: true, enableIndex: false, enableAnalytics: false }
      );
      
      expect(secondResult.cacheHit).toBe(true);
      expect(secondResult.results.length).toBe(firstResult.results.length);
    });

    it('should generate different cache keys for different queries', () => {
      const key1 = searchCache.generateKey('camera', {}, {});
      const key2 = searchCache.generateKey('lens', {}, {});
      const key3 = searchCache.generateKey('camera', { category: 'Electronics' }, {});
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('Index Functionality', () => {
    it('should build search index', async () => {
      await optimizedSearch.initializeIndex(testItems);
      
      const stats = searchIndex.getIndexStats();
      expect(stats.isBuilt).toBe(true);
      expect(stats.totalItems).toBe(testItems.length);
      expect(stats.totalWords).toBeGreaterThan(0);
    });

    it('should perform indexed search', async () => {
      await optimizedSearch.initializeIndex(testItems);
      
      const result = await optimizedSearch.search(
        testItems,
        'camera',
        {},
        { enableIndex: true, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.indexUsed).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].item.name.toLowerCase()).toContain('camera');
    });
  });

  describe('Analytics Functionality', () => {
    it('should record search analytics', async () => {
      await optimizedSearch.search(
        testItems,
        'camera',
        {},
        { enableAnalytics: true, enableCache: false, enableIndex: false }
      );
      
      const report = searchAnalytics.getPerformanceReport();
      expect(report.overview.totalSearches).toBe(1);
      expect(report.popularQueries.length).toBe(1);
      expect(report.popularQueries[0].query).toBe('camera');
    });
  });

  describe('Linear Search Fallback', () => {
    it('should perform linear search when index is disabled', async () => {
      const result = await optimizedSearch.search(
        testItems,
        'camera',
        {},
        { enableIndex: false, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.source).toBe('linear');
      expect(result.indexUsed).toBe(false);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should handle empty search queries', async () => {
      const result = await optimizedSearch.search(
        testItems,
        '',
        {},
        { enableIndex: false, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.results.length).toBe(testItems.length);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Filter Functionality', () => {
    it('should apply category filters', async () => {
      const result = await optimizedSearch.search(
        testItems,
        '',
        { category: 'Electronics' },
        { enableIndex: false, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.results.length).toBe(2); // Camera and Lens
      result.results.forEach(r => {
        expect(r.item.category).toBe('Electronics');
      });
    });

    it('should apply price range filters', async () => {
      const result = await optimizedSearch.search(
        testItems,
        '',
        { priceRange: [200, 400] },
        { enableIndex: false, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.results.length).toBe(1); // Only Lens (300)
      expect(result.results[0].item.name).toBe('Lens');
    });
  });

  describe('Performance Stats', () => {
    it('should provide performance statistics', async () => {
      // Perform some searches
      await optimizedSearch.search(testItems, 'camera', {}, { enableAnalytics: true });
      await optimizedSearch.search(testItems, 'lens', {}, { enableAnalytics: true });
      
      const stats = optimizedSearch.getPerformanceStats();
      
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('analytics');
      expect(stats.analytics.overview.totalSearches).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed items gracefully', async () => {
      const malformedItems = [
        { id: '1', name: 'Valid Item' },
        { name: 'No ID' }, // Missing ID
        { id: '3' }, // Missing name
        { id: '4', name: 'Another Valid Item' }
      ];
      
      const result = await optimizedSearch.search(
        malformedItems,
        'Valid',
        {},
        { enableIndex: false, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty datasets', async () => {
      const result = await optimizedSearch.search(
        [],
        'test',
        {},
        { enableIndex: false, enableCache: false, enableAnalytics: false }
      );
      
      expect(result.results).toHaveLength(0);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });
  });
});
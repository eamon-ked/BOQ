import { searchCache } from './searchCache.js';
import { searchIndex } from './searchIndex.js';
import { searchAnalytics } from './searchAnalytics.js';

/**
 * Optimized search algorithm with caching, indexing, and performance monitoring
 */
class OptimizedSearch {
  constructor(options = {}) {
    this.options = {
      enableCache: options.enableCache !== false,
      enableIndex: options.enableIndex !== false,
      enableAnalytics: options.enableAnalytics !== false,
      fallbackToLinear: options.fallbackToLinear !== false,
      maxResults: options.maxResults || 1000,
      ...options
    };
    this.isIndexReady = false;
    this.lastIndexUpdate = 0;
    this.indexUpdateThreshold = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize or update search index
   */
  async initializeIndex(items, searchFields = ['name', 'description', 'manufacturer']) {
    if (!this.options.enableIndex) return;

    const now = Date.now();
    const shouldUpdate = !this.isIndexReady || 
                        (now - this.lastIndexUpdate) > this.indexUpdateThreshold;

    if (shouldUpdate && items && items.length > 0) {
      try {
        await new Promise(resolve => {
          // Use setTimeout to avoid blocking the main thread
          setTimeout(() => {
            searchIndex.buildIndex(items, searchFields);
            this.isIndexReady = searchIndex.isBuilt;
            this.lastIndexUpdate = now;
            resolve();
          }, 0);
        });
      } catch (error) {
        console.warn('Failed to build search index:', error);
        this.isIndexReady = false;
      }
    }
  }

  /**
   * Perform optimized search
   */
  async search(items, query, filters = {}, options = {}) {
    const startTime = performance.now();
    const searchOptions = { ...this.options, ...options };
    
    // Generate cache key
    const cacheKey = this.options.enableCache ? 
      searchCache.generateKey(query, filters, searchOptions) : null;

    // Try cache first
    let cacheHit = false;
    if (this.options.enableCache && cacheKey) {
      const cachedResult = searchCache.get(cacheKey);
      if (cachedResult) {
        cacheHit = true;
        const searchTime = performance.now() - startTime;
        
        // Record analytics
        if (this.options.enableAnalytics) {
          searchAnalytics.recordSearch({
            query,
            filters,
            resultCount: cachedResult.results.length,
            searchTime,
            cacheHit: true,
            indexUsed: false
          });
        }

        return {
          ...cachedResult,
          searchTime,
          cacheHit: true,
          source: 'cache'
        };
      }
    }

    // Ensure index is ready for large datasets
    if (this.options.enableIndex && items.length > 100) {
      await this.initializeIndex(items, searchOptions.searchFields);
    }

    let searchResult;
    let indexUsed = false;

    try {
      // Use indexed search for large datasets and complex queries
      if (this.isIndexReady && this.shouldUseIndexedSearch(items, query, filters)) {
        searchResult = await this.performIndexedSearch(query, filters, searchOptions);
        indexUsed = true;
      } else {
        // Fall back to linear search
        searchResult = await this.performLinearSearch(items, query, filters, searchOptions);
      }
    } catch (error) {
      console.warn('Search error, falling back to linear search:', error);
      searchResult = await this.performLinearSearch(items, query, filters, searchOptions);
      indexUsed = false;
    }

    const searchTime = performance.now() - startTime;

    // Apply result limit
    if (searchResult.results.length > searchOptions.maxResults) {
      searchResult.results = searchResult.results.slice(0, searchOptions.maxResults);
      searchResult.truncated = true;
      searchResult.totalMatches = searchResult.results.length;
    }

    // Cache the result
    if (this.options.enableCache && cacheKey && searchResult.results.length > 0) {
      searchCache.set(cacheKey, {
        ...searchResult,
        searchTime,
        source: indexUsed ? 'index' : 'linear'
      });
    }

    // Record analytics
    if (this.options.enableAnalytics) {
      searchAnalytics.recordSearch({
        query,
        filters,
        resultCount: searchResult.results.length,
        searchTime,
        cacheHit: false,
        indexUsed
      });
    }

    return {
      ...searchResult,
      searchTime,
      cacheHit: false,
      indexUsed,
      source: indexUsed ? 'index' : 'linear'
    };
  }

  /**
   * Determine if indexed search should be used
   */
  shouldUseIndexedSearch(items, query, filters) {
    // Don't use index if it's not ready
    if (!this.isIndexReady) return false;
    
    // Use index for any non-empty query when available
    if (query && query.trim().length > 0) return true;
    
    // Use index for large datasets
    if (items.length > 500) return true;
    
    // Use index when multiple filters are active
    const activeFilters = Object.values(filters).filter(v => 
      v !== null && v !== undefined && v !== '' && 
      (Array.isArray(v) ? v.length > 0 : true)
    ).length;
    
    if (activeFilters > 1) return true;
    
    return false;
  }

  /**
   * Perform indexed search
   */
  async performIndexedSearch(query, filters, options) {
    if (!searchIndex.isBuilt) {
      throw new Error('Search index not ready');
    }
    
    const indexResult = searchIndex.search(query, {
      fuzzy: options.enableFuzzy || false
    });

    // Apply additional filters to index results
    let filteredResults = indexResult.results;

    // Category filter
    if (filters.category) {
      filteredResults = filteredResults.filter(result => 
        result.item.category === filters.category
      );
    }

    // Price range filter
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < Infinity)) {
      filteredResults = filteredResults.filter(result => {
        const price = result.item.unitPrice || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    // Manufacturer filter
    if (filters.manufacturer) {
      filteredResults = filteredResults.filter(result =>
        result.item.manufacturer &&
        result.item.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase())
      );
    }

    // Stock filter
    if (filters.inStock !== null && filters.inStock !== undefined) {
      filteredResults = filteredResults.filter(result => {
        const stockLevel = result.item.metadata?.stockLevel;
        return filters.inStock ? (stockLevel && stockLevel > 0) : (stockLevel === 0 || !stockLevel);
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(result => {
        const itemTags = result.item.tags || [];
        return filters.tags.every(tag => itemTags.includes(tag));
      });
    }

    return {
      results: filteredResults,
      totalMatches: filteredResults.length,
      indexStats: indexResult.indexStats,
      appliedFilters: this.getAppliedFilters(filters)
    };
  }

  /**
   * Perform linear search (fallback)
   */
  async performLinearSearch(items, query, filters, options) {
    return new Promise(resolve => {
      // Use setTimeout to avoid blocking the main thread for large datasets
      setTimeout(() => {
        const result = this.linearSearchSync(items, query, filters, options);
        resolve(result);
      }, 0);
    });
  }

  /**
   * Synchronous linear search implementation
   */
  linearSearchSync(items, query, filters, options) {
    const searchFields = options.searchFields || ['name', 'description', 'manufacturer'];
    const caseSensitive = options.caseSensitive || false;
    const enableRanking = options.enableRanking !== false;
    
    let results = [];

    // Text search
    if (query && query.trim().length > 0) {
      const searchTerm = caseSensitive ? query.trim() : query.trim().toLowerCase();
      const searchWords = searchTerm.split(/\s+/);

      results = items.map(item => {
        let score = 0;
        const matches = [];

        searchFields.forEach(field => {
          const fieldValue = item[field];
          if (!fieldValue) return;

          const value = caseSensitive ? fieldValue : fieldValue.toLowerCase();
          
          searchWords.forEach(word => {
            if (value.includes(word)) {
              // Calculate relevance score
              const exactMatch = value === word;
              const startsWithMatch = value.startsWith(word);
              const wordBoundaryMatch = new RegExp(`\\b${word}`, caseSensitive ? 'g' : 'gi').test(value);
              
              let fieldScore = 1; // Base score for any match
              
              if (exactMatch) fieldScore += 10;
              else if (startsWithMatch) fieldScore += 5;
              else if (wordBoundaryMatch) fieldScore += 3;
              
              // Boost score for name field matches
              if (field === 'name') fieldScore *= 2;
              
              score += fieldScore;
              
              // Store match information
              matches.push({
                field,
                word,
                value: fieldValue,
                score: fieldScore
              });
            }
          });
        });

        return score > 0 ? { item, score, matches } : null;
      }).filter(result => result !== null);

      // Sort by relevance score if ranking is enabled
      if (enableRanking) {
        results.sort((a, b) => b.score - a.score);
      }
    } else {
      // No search query, return all items
      results = items.map(item => ({ item, score: 0, matches: [] }));
    }

    // Apply filters
    let filtered = results;

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(result => result.item.category === filters.category);
    }

    // Price range filter
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < Infinity)) {
      filtered = filtered.filter(result => {
        const price = result.item.unitPrice || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    // Manufacturer filter
    if (filters.manufacturer) {
      filtered = filtered.filter(result =>
        result.item.manufacturer &&
        result.item.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase())
      );
    }

    // Stock filter
    if (filters.inStock !== null && filters.inStock !== undefined) {
      filtered = filtered.filter(result => {
        const stockLevel = result.item.metadata?.stockLevel;
        return filters.inStock ? (stockLevel && stockLevel > 0) : (stockLevel === 0 || !stockLevel);
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(result => {
        const itemTags = result.item.tags || [];
        return filters.tags.every(tag => itemTags.includes(tag));
      });
    }

    return {
      results: filtered,
      totalMatches: filtered.length,
      appliedFilters: this.getAppliedFilters(filters)
    };
  }

  /**
   * Get list of applied filters for display
   */
  getAppliedFilters(filters) {
    const applied = [];

    if (filters.category) {
      applied.push(`Category: ${filters.category}`);
    }

    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < Infinity)) {
      applied.push(`Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}`);
    }

    if (filters.manufacturer) {
      applied.push(`Manufacturer: ${filters.manufacturer}`);
    }

    if (filters.inStock !== null && filters.inStock !== undefined) {
      applied.push(`In Stock: ${filters.inStock ? 'Yes' : 'No'}`);
    }

    if (filters.tags && filters.tags.length > 0) {
      applied.push(`Tags: ${filters.tags.join(', ')}`);
    }

    return applied;
  }

  /**
   * Update item in search index
   */
  updateItem(item, searchFields = ['name', 'description', 'manufacturer']) {
    if (this.options.enableIndex && this.isIndexReady) {
      searchIndex.updateItem(item, searchFields);
    }

    // Clear entire cache when items change to ensure consistency
    if (this.options.enableCache) {
      searchCache.clear();
    }
  }

  /**
   * Remove item from search index
   */
  removeItem(itemId) {
    if (this.options.enableIndex && this.isIndexReady) {
      searchIndex.removeItem(itemId);
    }

    // Clear cache to ensure consistency
    if (this.options.enableCache) {
      searchCache.clear();
    }
  }

  /**
   * Get search performance statistics
   */
  getPerformanceStats() {
    const stats = {
      cache: this.options.enableCache ? searchCache.getStats() : null,
      index: this.options.enableIndex && this.isIndexReady ? searchIndex.getIndexStats() : null,
      analytics: this.options.enableAnalytics ? searchAnalytics.getPerformanceReport() : null
    };

    return stats;
  }

  /**
   * Clear all caches and rebuild index
   */
  async reset(items, searchFields) {
    if (this.options.enableCache) {
      searchCache.clear();
    }

    if (this.options.enableIndex) {
      searchIndex.clear();
      this.isIndexReady = false;
      this.lastIndexUpdate = 0;
      
      if (items && items.length > 0) {
        await this.initializeIndex(items, searchFields);
      }
    }

    if (this.options.enableAnalytics) {
      searchAnalytics.clear();
    }
  }

  /**
   * Configure optimization options
   */
  configure(options) {
    this.options = { ...this.options, ...options };
    
    // Update component configurations
    if (this.options.enableCache !== undefined) {
      searchCache.setEnabled(this.options.enableCache);
    }
    
    if (this.options.enableAnalytics !== undefined) {
      searchAnalytics.setEnabled(this.options.enableAnalytics);
    }
  }
}

// Create singleton instance
export const optimizedSearch = new OptimizedSearch({
  enableCache: true,
  enableIndex: true,
  enableAnalytics: true,
  fallbackToLinear: true,
  maxResults: 1000
});

export default OptimizedSearch;
/**
 * Search result caching system for improved performance
 */
class SearchCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default TTL
    this.hitCount = 0;
    this.missCount = 0;
    this.enabled = options.enabled !== false;
  }

  /**
   * Generate cache key from search parameters
   */
  generateKey(searchTerm, filters, options = {}) {
    const keyData = {
      search: searchTerm?.toLowerCase() || '',
      category: filters?.category || '',
      priceRange: filters?.priceRange || [0, Infinity],
      manufacturer: filters?.manufacturer || '',
      inStock: filters?.inStock,
      tags: filters?.tags || [],
      caseSensitive: options.caseSensitive || false,
      searchFields: options.searchFields || ['name']
    };
    
    return JSON.stringify(keyData);
  }

  /**
   * Get cached search results
   */
  get(key) {
    if (!this.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) {
      this.missCount++;
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    // Update access time for LRU behavior
    cached.lastAccessed = Date.now();
    return cached.data;
  }

  /**
   * Store search results in cache
   */
  set(key, data) {
    if (!this.enabled) return;

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });
  }

  /**
   * Evict least recently used entries
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      totalRequests,
      enabled: this.enabled
    };
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Invalidate cache entries that might be affected by data changes
   */
  invalidateByPattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      try {
        const keyData = JSON.parse(key);
        if (this.matchesPattern(keyData, pattern)) {
          keysToDelete.push(key);
        }
      } catch (error) {
        // Invalid key format, delete it
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Check if key data matches invalidation pattern
   */
  matchesPattern(keyData, pattern) {
    if (pattern.category && keyData.category === pattern.category) {
      return true;
    }
    if (pattern.manufacturer && keyData.manufacturer === pattern.manufacturer) {
      return true;
    }
    if (pattern.searchTerm && keyData.search.includes(pattern.searchTerm.toLowerCase())) {
      return true;
    }
    return false;
  }
}

// Create singleton instance
export const searchCache = new SearchCache({
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
  enabled: true
});

export default SearchCache;
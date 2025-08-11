/**
 * Search analytics and performance monitoring system
 */
class SearchAnalytics {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.searchHistory = [];
    this.performanceMetrics = {
      totalSearches: 0,
      totalSearchTime: 0,
      averageSearchTime: 0,
      slowSearchThreshold: options.slowSearchThreshold || 100, // ms
      slowSearches: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.popularQueries = new Map();
    this.searchPatterns = {
      byHour: new Array(24).fill(0),
      byDayOfWeek: new Array(7).fill(0),
      byCategory: new Map(),
      byResultCount: {
        noResults: 0,
        fewResults: 0, // 1-10
        manyResults: 0 // 10+
      }
    };
    this.startTime = Date.now();
  }

  /**
   * Record a search operation
   */
  recordSearch(searchData) {
    if (!this.enabled) return;

    const {
      query,
      filters,
      resultCount,
      searchTime,
      cacheHit = false,
      indexUsed = false,
      userId = null
    } = searchData;

    const searchRecord = {
      id: this.generateSearchId(),
      timestamp: Date.now(),
      query: query?.trim() || '',
      filters: { ...filters },
      resultCount,
      searchTime,
      cacheHit,
      indexUsed,
      userId,
      sessionId: this.getSessionId()
    };

    // Add to history (with size limit)
    this.searchHistory.unshift(searchRecord);
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }

    // Update performance metrics
    this.updatePerformanceMetrics(searchRecord);

    // Update search patterns
    this.updateSearchPatterns(searchRecord);

    // Track popular queries
    this.updatePopularQueries(searchRecord);

    return searchRecord.id;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(searchRecord) {
    const { searchTime, cacheHit } = searchRecord;

    this.performanceMetrics.totalSearches++;
    this.performanceMetrics.totalSearchTime += searchTime;
    this.performanceMetrics.averageSearchTime = 
      this.performanceMetrics.totalSearchTime / this.performanceMetrics.totalSearches;

    if (searchTime > this.performanceMetrics.slowSearchThreshold) {
      this.performanceMetrics.slowSearches++;
    }

    if (cacheHit) {
      this.performanceMetrics.cacheHits++;
    } else {
      this.performanceMetrics.cacheMisses++;
    }
  }

  /**
   * Update search patterns
   */
  updateSearchPatterns(searchRecord) {
    const date = new Date(searchRecord.timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Track by time patterns
    this.searchPatterns.byHour[hour]++;
    this.searchPatterns.byDayOfWeek[dayOfWeek]++;

    // Track by category
    if (searchRecord.filters.category) {
      const category = searchRecord.filters.category;
      this.searchPatterns.byCategory.set(
        category,
        (this.searchPatterns.byCategory.get(category) || 0) + 1
      );
    }

    // Track by result count
    const { resultCount } = searchRecord;
    if (resultCount === 0) {
      this.searchPatterns.byResultCount.noResults++;
    } else if (resultCount <= 10) {
      this.searchPatterns.byResultCount.fewResults++;
    } else {
      this.searchPatterns.byResultCount.manyResults++;
    }
  }

  /**
   * Update popular queries tracking
   */
  updatePopularQueries(searchRecord) {
    const { query } = searchRecord;
    if (!query || query.length < 2) return;

    const normalizedQuery = query.toLowerCase().trim();
    const current = this.popularQueries.get(normalizedQuery) || {
      count: 0,
      firstSeen: searchRecord.timestamp,
      lastSeen: searchRecord.timestamp,
      avgResultCount: 0,
      avgSearchTime: 0
    };

    current.count++;
    current.lastSeen = searchRecord.timestamp;
    current.avgResultCount = (current.avgResultCount * (current.count - 1) + searchRecord.resultCount) / current.count;
    current.avgSearchTime = (current.avgSearchTime * (current.count - 1) + searchRecord.searchTime) / current.count;

    this.popularQueries.set(normalizedQuery, current);
  }

  /**
   * Get search performance report
   */
  getPerformanceReport() {
    const cacheHitRate = this.performanceMetrics.totalSearches > 0 
      ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalSearches) * 100 
      : 0;

    const slowSearchRate = this.performanceMetrics.totalSearches > 0
      ? (this.performanceMetrics.slowSearches / this.performanceMetrics.totalSearches) * 100
      : 0;

    return {
      overview: {
        totalSearches: this.performanceMetrics.totalSearches,
        averageSearchTime: Math.round(this.performanceMetrics.averageSearchTime * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        slowSearchRate: Math.round(slowSearchRate * 100) / 100,
        uptime: Date.now() - this.startTime
      },
      performance: {
        ...this.performanceMetrics,
        cacheHitRate,
        slowSearchRate
      },
      patterns: this.getSearchPatterns(),
      popularQueries: this.getPopularQueries(10),
      recentSearches: this.getRecentSearches(20)
    };
  }

  /**
   * Get search patterns analysis
   */
  getSearchPatterns() {
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return {
      byHour: {
        labels: hourLabels,
        data: this.searchPatterns.byHour,
        peak: this.findPeakHour()
      },
      byDayOfWeek: {
        labels: dayLabels,
        data: this.searchPatterns.byDayOfWeek,
        peak: this.findPeakDay()
      },
      byCategory: Array.from(this.searchPatterns.byCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      byResultCount: this.searchPatterns.byResultCount
    };
  }

  /**
   * Find peak search hour
   */
  findPeakHour() {
    const maxSearches = Math.max(...this.searchPatterns.byHour);
    const peakHour = this.searchPatterns.byHour.indexOf(maxSearches);
    return {
      hour: peakHour,
      searches: maxSearches,
      label: `${peakHour}:00`
    };
  }

  /**
   * Find peak search day
   */
  findPeakDay() {
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxSearches = Math.max(...this.searchPatterns.byDayOfWeek);
    const peakDay = this.searchPatterns.byDayOfWeek.indexOf(maxSearches);
    return {
      day: peakDay,
      searches: maxSearches,
      label: dayLabels[peakDay]
    };
  }

  /**
   * Get most popular queries
   */
  getPopularQueries(limit = 10) {
    return Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([query, data]) => ({
        query,
        ...data,
        avgResultCount: Math.round(data.avgResultCount * 100) / 100,
        avgSearchTime: Math.round(data.avgSearchTime * 100) / 100
      }));
  }

  /**
   * Get recent searches
   */
  getRecentSearches(limit = 20) {
    return this.searchHistory
      .slice(0, limit)
      .map(search => ({
        ...search,
        timeAgo: this.getTimeAgo(search.timestamp)
      }));
  }

  /**
   * Get searches with no results (for optimization)
   */
  getNoResultSearches(limit = 50) {
    return this.searchHistory
      .filter(search => search.resultCount === 0)
      .slice(0, limit)
      .map(search => ({
        query: search.query,
        filters: search.filters,
        timestamp: search.timestamp,
        timeAgo: this.getTimeAgo(search.timestamp)
      }));
  }

  /**
   * Get slow searches (for optimization)
   */
  getSlowSearches(limit = 50) {
    return this.searchHistory
      .filter(search => search.searchTime > this.performanceMetrics.slowSearchThreshold)
      .sort((a, b) => b.searchTime - a.searchTime)
      .slice(0, limit)
      .map(search => ({
        query: search.query,
        filters: search.filters,
        searchTime: search.searchTime,
        resultCount: search.resultCount,
        timestamp: search.timestamp,
        timeAgo: this.getTimeAgo(search.timestamp)
      }));
  }

  /**
   * Generate unique search ID
   */
  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Get human-readable time ago
   */
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }

  /**
   * Export analytics data
   */
  exportData() {
    return {
      metadata: {
        exportTime: Date.now(),
        version: '1.0',
        totalSearches: this.performanceMetrics.totalSearches,
        dataRange: {
          start: this.startTime,
          end: Date.now()
        }
      },
      performanceMetrics: this.performanceMetrics,
      searchPatterns: this.searchPatterns,
      popularQueries: Object.fromEntries(this.popularQueries),
      searchHistory: this.searchHistory
    };
  }

  /**
   * Import analytics data
   */
  importData(data) {
    if (data.performanceMetrics) {
      this.performanceMetrics = { ...this.performanceMetrics, ...data.performanceMetrics };
    }
    if (data.searchPatterns) {
      this.searchPatterns = { ...this.searchPatterns, ...data.searchPatterns };
    }
    if (data.popularQueries) {
      this.popularQueries = new Map(Object.entries(data.popularQueries));
    }
    if (data.searchHistory) {
      this.searchHistory = [...data.searchHistory, ...this.searchHistory]
        .slice(0, this.maxHistorySize);
    }
  }

  /**
   * Clear all analytics data
   */
  clear() {
    this.searchHistory = [];
    this.performanceMetrics = {
      totalSearches: 0,
      totalSearchTime: 0,
      averageSearchTime: 0,
      slowSearchThreshold: this.performanceMetrics.slowSearchThreshold,
      slowSearches: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.popularQueries.clear();
    this.searchPatterns = {
      byHour: new Array(24).fill(0),
      byDayOfWeek: new Array(7).fill(0),
      byCategory: new Map(),
      byResultCount: {
        noResults: 0,
        fewResults: 0,
        manyResults: 0
      }
    };
    this.startTime = Date.now();
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Create singleton instance
export const searchAnalytics = new SearchAnalytics({
  enabled: true,
  maxHistorySize: 1000,
  slowSearchThreshold: 100
});

export default SearchAnalytics;
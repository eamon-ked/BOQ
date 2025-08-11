import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Clock, Database, Zap, TrendingUp, Settings, RefreshCw } from 'lucide-react';
import { optimizedSearch } from '../utils/optimizedSearch.js';
import { searchAnalytics } from '../utils/searchAnalytics.js';

/**
 * Search Performance Monitor Component
 * Displays real-time search performance metrics and analytics
 */
const SearchPerformanceMonitor = ({ isOpen, onClose }) => {
  const [performanceStats, setPerformanceStats] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh performance stats
  const refreshStats = useCallback(() => {
    const stats = optimizedSearch.getPerformanceStats();
    setPerformanceStats(stats);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    refreshStats(); // Initial load
    const interval = setInterval(refreshStats, refreshInterval);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, refreshInterval, refreshStats]);

  // Manual refresh
  const handleManualRefresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  // Clear all caches and analytics
  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all search caches and analytics? This action cannot be undone.')) {
      await optimizedSearch.reset();
      refreshStats();
    }
  }, [refreshStats]);

  // Format time in milliseconds
  const formatTime = (ms) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format bytes
  const formatBytes = (kb) => {
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Format percentage
  const formatPercent = (value) => `${value.toFixed(1)}%`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={24} />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Search Performance Monitor</h2>
                <p className="text-sm text-gray-600">Real-time search optimization metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Auto-refresh:</label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                disabled={!autoRefresh}
              >
                <option value={1000}>1s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh Now"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!performanceStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading performance data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceStats.analytics && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-blue-600" size={24} />
                        <h3 className="font-semibold text-gray-800">Average Search Time</h3>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatTime(performanceStats.analytics.overview.averageSearchTime)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {performanceStats.analytics.overview.totalSearches} total searches
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="text-green-600" size={24} />
                        <h3 className="font-semibold text-gray-800">Cache Hit Rate</h3>
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {formatPercent(performanceStats.analytics.overview.cacheHitRate)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {performanceStats.cache?.hitCount || 0} hits / {performanceStats.cache?.totalRequests || 0} requests
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Database className="text-purple-600" size={24} />
                        <h3 className="font-semibold text-gray-800">Index Status</h3>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        {performanceStats.index?.isBuilt ? 'Ready' : 'Not Built'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {performanceStats.index?.totalItems || 0} items indexed
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-orange-600" size={24} />
                        <h3 className="font-semibold text-gray-800">Slow Searches</h3>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">
                        {formatPercent(performanceStats.analytics.overview.slowSearchRate)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {performanceStats.analytics.performance.slowSearches} slow searches
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Cache Statistics */}
              {performanceStats.cache && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="text-blue-600" size={20} />
                    Cache Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Cache Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Size:</span>
                          <span className="text-sm font-medium">{performanceStats.cache.size} / {performanceStats.cache.maxSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Hit Rate:</span>
                          <span className="text-sm font-medium">{formatPercent(performanceStats.cache.hitRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`text-sm font-medium ${performanceStats.cache.enabled ? 'text-green-600' : 'text-red-600'}`}>
                            {performanceStats.cache.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Request Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Requests:</span>
                          <span className="text-sm font-medium">{performanceStats.cache.totalRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cache Hits:</span>
                          <span className="text-sm font-medium text-green-600">{performanceStats.cache.hitCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cache Misses:</span>
                          <span className="text-sm font-medium text-red-600">{performanceStats.cache.missCount}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Cache Health</h4>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(performanceStats.cache.size / performanceStats.cache.maxSize) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {((performanceStats.cache.size / performanceStats.cache.maxSize) * 100).toFixed(1)}% full
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Index Statistics */}
              {performanceStats.index && performanceStats.index.isBuilt && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Database className="text-purple-600" size={20} />
                    Search Index
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Index Size</h4>
                      <p className="text-2xl font-bold text-purple-600">{performanceStats.index.totalItems}</p>
                      <p className="text-sm text-gray-600">items indexed</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Vocabulary</h4>
                      <p className="text-2xl font-bold text-purple-600">{performanceStats.index.totalWords}</p>
                      <p className="text-sm text-gray-600">unique words</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Build Time</h4>
                      <p className="text-2xl font-bold text-purple-600">{formatTime(performanceStats.index.buildTime)}</p>
                      <p className="text-sm text-gray-600">to build index</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Memory Usage</h4>
                      <p className="text-2xl font-bold text-purple-600">{formatBytes(performanceStats.index.memoryUsage)}</p>
                      <p className="text-sm text-gray-600">estimated</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Data */}
              {performanceStats.analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Queries */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Popular Search Queries</h3>
                    <div className="space-y-3">
                      {performanceStats.analytics.popularQueries.slice(0, 10).map((query, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 truncate">{query.query || '(empty)'}</p>
                            <p className="text-sm text-gray-600">
                              {query.count} searches • Avg: {formatTime(query.avgSearchTime)} • {query.avgResultCount.toFixed(1)} results
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                        </div>
                      ))}
                      {performanceStats.analytics.popularQueries.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No search queries recorded yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Searches</h3>
                    <div className="space-y-3">
                      {performanceStats.analytics.recentSearches.slice(0, 10).map((search, index) => (
                        <div key={search.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 truncate">{search.query || '(empty)'}</p>
                            <p className="text-sm text-gray-600">
                              {formatTime(search.searchTime)} • {search.resultCount} results
                              {search.cacheHit && <span className="text-green-600 ml-2">• cached</span>}
                              {search.indexUsed && <span className="text-purple-600 ml-2">• indexed</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">{search.timeAgo}</span>
                          </div>
                        </div>
                      ))}
                      {performanceStats.analytics.recentSearches.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No recent searches</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Patterns */}
              {performanceStats.analytics && performanceStats.analytics.patterns && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Search Patterns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Peak Search Hour</h4>
                      <p className="text-2xl font-bold text-blue-600">{performanceStats.analytics.patterns.byHour.peak.label}</p>
                      <p className="text-sm text-gray-600">{performanceStats.analytics.patterns.byHour.peak.searches} searches</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Peak Search Day</h4>
                      <p className="text-2xl font-bold text-blue-600">{performanceStats.analytics.patterns.byDayOfWeek.peak.label}</p>
                      <p className="text-sm text-gray-600">{performanceStats.analytics.patterns.byDayOfWeek.peak.searches} searches</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Result Distribution</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>No results:</span>
                          <span>{performanceStats.analytics.patterns.byResultCount.noResults}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Few results (1-10):</span>
                          <span>{performanceStats.analytics.patterns.byResultCount.fewResults}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Many results (10+):</span>
                          <span>{performanceStats.analytics.patterns.byResultCount.manyResults}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings className="text-gray-600" size={20} />
                  Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleManualRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh Data
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear All Caches
                  </button>
                  <button
                    onClick={() => {
                      const data = performanceStats.analytics ? 
                        searchAnalytics.exportData() : 
                        { message: 'No analytics data available' };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Export Analytics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPerformanceMonitor;
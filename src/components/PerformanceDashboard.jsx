/**
 * Performance Dashboard Component
 * Provides real-time performance monitoring and debugging tools
 * Only available in development mode
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, BarChart3, Clock, HardDrive, Zap } from 'lucide-react';
import performanceMonitor from '../utils/performanceMonitor';
import errorTracker from '../utils/errorTracking';

const PerformanceDashboard = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState({});
  const [errors, setErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Start auto-refresh
      const interval = setInterval(() => {
        setMetrics(performanceMonitor.getAllMetrics());
        setErrors(errorTracker.getErrors({ since: Date.now() - 24 * 60 * 60 * 1000 }));
      }, 1000);
      
      setRefreshInterval(interval);
      
      // Initial load
      setMetrics(performanceMonitor.getAllMetrics());
      setErrors(errorTracker.getErrors({ since: Date.now() - 24 * 60 * 60 * 1000 }));
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceScore = () => {
    const report = performanceMonitor.getPerformanceReport();
    let score = 100;
    
    // Deduct points for issues
    score -= (report.alerts?.length || 0) * 10;
    
    // Check memory usage
    if (metrics.memory && metrics.memory.length > 0) {
      const latestMemory = metrics.memory[metrics.memory.length - 1];
      if (latestMemory.used > 100 * 1024 * 1024) { // 100MB
        score -= 20;
      }
    }
    
    // Check render times
    if (metrics.customTiming) {
      const renderMetrics = metrics.customTiming.filter(m => m.label.startsWith('render-'));
      const avgRenderTime = renderMetrics.length > 0 
        ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length 
        : 0;
      
      if (avgRenderTime > 16) { // 60fps threshold
        score -= 15;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const OverviewTab = () => {
    const score = getPerformanceScore();
    const errorStats = errorTracker.getErrorStats();
    const latestMemory = metrics.memory?.[metrics.memory.length - 1];
    
    return (
      <div className="space-y-6">
        {/* Performance Score */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Performance Score</h3>
            <div className={`text-2xl font-bold ${
              score >= 90 ? 'text-green-600' : 
              score >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {score}/100
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                score >= 90 ? 'bg-green-600' : 
                score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="text-lg font-semibold">
                  {latestMemory ? formatBytes(latestMemory.used) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Errors (24h)</p>
                <p className="text-lg font-semibold">{errorStats.recent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Render Time</p>
                <p className="text-lg font-semibold">
                  {metrics.customTiming ? 
                    formatTime(
                      metrics.customTiming
                        .filter(m => m.label.startsWith('render-'))
                        .reduce((sum, m, _, arr) => sum + m.duration / arr.length, 0)
                    ) : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        {metrics.performanceAlert && metrics.performanceAlert.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Performance Alerts</h3>
            <div className="space-y-2">
              {metrics.performanceAlert.slice(-5).map((alert, index) => (
                <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const MetricsTab = () => (
    <div className="space-y-6">
      {Object.entries(metrics).map(([type, data]) => (
        <div key={type} className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
            {type.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Timestamp</th>
                  <th className="text-left py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-10).map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2">
                      <pre className="text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  const ErrorsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Error Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(errorTracker.getErrorStats().byType).map(([type, count]) => (
            <div key={type} className="text-center">
              <p className="text-2xl font-bold text-red-600">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{type.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Errors</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {errors.slice(0, 20).map((error, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  error.severity === 'high' ? 'bg-red-100 text-red-800' :
                  error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {error.severity} - {error.type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-2">{error.message}</p>
              {error.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600">Stack Trace</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Performance Dashboard</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => performanceMonitor.exportMetrics()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Export Performance
            </button>
            <button
              onClick={() => errorTracker.exportErrorReport()}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Export Errors
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'metrics', label: 'Metrics', icon: Activity },
            { id: 'errors', label: 'Errors', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'metrics' && <MetricsTab />}
          {activeTab === 'errors' && <ErrorsTab />}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
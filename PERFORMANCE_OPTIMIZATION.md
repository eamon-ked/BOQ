# Performance Optimization and Monitoring

This document outlines the comprehensive performance optimization and monitoring system implemented for the BOQ Builder application.

## Overview

The performance optimization system includes:
- **Bundle Analysis**: Enhanced bundle size monitoring with regression detection
- **Runtime Performance Monitoring**: Real-time performance tracking and alerting
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Testing**: Automated regression tests for critical performance metrics
- **Production Optimizations**: Advanced build configurations for optimal performance

## Features Implemented

### 1. Enhanced Bundle Analysis (`scripts/analyze-bundle.js`)

**Capabilities:**
- Detailed chunk size analysis with gzip compression ratios
- Performance regression detection across builds
- Bundle history tracking (last 10 builds)
- Performance scoring system (0-100)
- Actionable optimization recommendations
- Critical issue detection with build failure on errors

**Usage:**
```bash
npm run build:analyze    # Build and analyze bundle
npm run analyze:bundle   # Analyze existing build
```

**Thresholds:**
- Total bundle size warning: 500KB
- Total bundle size error: 1MB
- Individual chunk warning: 100KB
- Individual chunk error: 250KB
- Poor compression ratio: >30%

### 2. Runtime Performance Monitor (`src/utils/performanceMonitor.js`)

**Capabilities:**
- Long task detection (>50ms)
- Layout shift monitoring
- Largest Contentful Paint (LCP) tracking
- Memory usage monitoring
- Custom timing measurements
- Performance alerts and notifications

**API:**
```javascript
// Start timing an operation
const timer = performanceMonitor.startTiming('operation-name');
const duration = timer.end();

// Measure render performance
performanceMonitor.measureRender('ComponentName', () => {
  return <Component />;
});

// Measure async operations
await performanceMonitor.measureAsync('api-call', () => fetchData());

// Get performance report
const report = performanceMonitor.getPerformanceReport();
```

**Development Tools:**
```javascript
// Available in browser console (development only)
window.performanceMonitor.exportMetrics()
window.exportPerformanceReport()
```

### 3. Error Tracking System (`src/utils/errorTracking.js`)

**Capabilities:**
- Global JavaScript error handling
- Unhandled promise rejection tracking
- React error boundary integration
- Context-aware error logging
- Performance correlation
- Error export and reporting

**Features:**
- Session-based error tracking
- Error severity classification
- Context information (viewport, memory, connection)
- Performance metrics correlation
- Local storage persistence

**API:**
```javascript
// Log custom errors
errorTracker.logCustomError('Operation failed', { context: data });

// Log warnings
errorTracker.logWarning('Performance degradation detected');

// Get error statistics
const stats = errorTracker.getErrorStats();

// Export error report
errorTracker.exportErrorReport();
```

### 4. Performance Testing (`src/test/performance.test.jsx`)

**Test Categories:**
- Component rendering performance
- Search operation performance
- Calculation performance
- Memory leak detection
- Bundle loading performance
- Performance monitoring integration

**Thresholds:**
- Small list rendering: <50ms
- Medium list rendering: <100ms
- Large list rendering: <200ms
- Search operations: <200ms
- BOQ calculations: <50ms
- Memory increase per test: <10MB

**Usage:**
```bash
npm run test:performance
```

### 5. Production Build Optimizations

**Vite Configuration Enhancements:**
- Advanced chunk splitting strategy
- Tree shaking optimizations
- Asset optimization and compression
- Source map configuration
- Modern browser targeting (ES2020)
- CSS code splitting

**Manual Chunks Strategy:**
- `vendor-react`: React ecosystem
- `state-management`: Zustand and Immer
- `ui-components`: UI libraries
- `data-processing`: Excel/PDF libraries
- `validation`: Zod validation
- `virtualization`: React Window
- `database`: SQL.js and related
- `vendor-utils`: Other vendor libraries

### 6. Performance Dashboard (Development Only)

**Features:**
- Real-time performance metrics display
- Error tracking and visualization
- Performance score calculation
- Metric export functionality
- Interactive debugging tools

**Access:**
- Click the 📊 button in development mode
- Or use `window.showPerformanceDashboard()` in console

## Performance Monitoring Integration

### App Component Integration

The main App component includes:
- Performance monitoring initialization
- Error tracking integration
- Development debugging tools
- Performance dashboard access

### Error Boundary Integration

Error boundaries automatically report to the error tracking system:
```javascript
// In ErrorBoundary component
componentDidCatch(error, errorInfo) {
  window.reportReactError?.(error, errorInfo);
}
```

## Build Scripts

### Available Scripts

```bash
# Standard build
npm run build

# Production optimized build
npm run build:production

# Build with analysis
npm run build:analyze

# Profile build performance
npm run build:profile

# Analyze existing bundle
npm run analyze:bundle

# Run performance tests
npm run test:performance

# Run server performance tests
npm run test:performance-server
```

### Performance Metrics Files

The system generates several monitoring files:
- `performance-metrics.json`: Latest performance metrics
- `bundle-history.json`: Bundle size history (last 10 builds)
- Error reports: Exported on demand

## Performance Thresholds and Alerts

### Bundle Size Thresholds
- **Warning**: Total bundle >500KB, chunks >100KB
- **Error**: Total bundle >1MB, chunks >250KB
- **Regression**: >10% size increase between builds

### Runtime Performance Thresholds
- **Render Time**: <16ms (60fps target)
- **Search Time**: <200ms
- **Memory Usage**: <100MB
- **Long Tasks**: <50ms

### Performance Score Calculation
- Base score: 100 points
- Deductions:
  - Critical issues: -20 points each
  - Warnings: -10 points each
  - Regressions: -15 points (critical), -5 points (warning)

## Optimization Recommendations

### Based on Current Analysis

1. **Data Processing Chunk (808KB)**
   - Consider lazy loading Excel/PDF functionality
   - Implement dynamic imports for export features
   - Use lighter alternatives where possible

2. **Vendor Utils Chunk (392KB)**
   - Audit dependencies for unused code
   - Enable tree shaking for all libraries
   - Consider CDN loading for large libraries

3. **Bundle Splitting**
   - Further split large chunks
   - Implement route-based code splitting
   - Use React.lazy for more components

### General Recommendations

1. **Enable Compression**
   - Configure gzip/Brotli on server
   - Target <30% compression ratio

2. **Optimize Assets**
   - Compress images and fonts
   - Use modern image formats (WebP, AVIF)
   - Implement asset caching strategies

3. **Runtime Optimizations**
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists
   - Optimize re-render patterns

## Monitoring in Production

### Error Tracking
- Errors are logged locally and can be exported
- Consider integrating with external error tracking service
- Monitor error trends and patterns

### Performance Monitoring
- Performance metrics available in development
- Consider implementing production performance monitoring
- Track Core Web Vitals and user experience metrics

### Bundle Monitoring
- Run bundle analysis on each build
- Monitor bundle size trends
- Set up CI/CD alerts for performance regressions

## Development Workflow

### Performance-First Development
1. Run performance tests before committing
2. Monitor bundle size changes
3. Use performance dashboard for debugging
4. Export and analyze performance reports

### Debugging Performance Issues
1. Open performance dashboard in development
2. Monitor real-time metrics
3. Export performance and error reports
4. Analyze bundle composition and optimization opportunities

This comprehensive performance optimization system ensures the BOQ Builder maintains excellent performance while providing detailed insights for continuous improvement.
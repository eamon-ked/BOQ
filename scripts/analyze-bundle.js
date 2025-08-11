#!/usr/bin/env node

/**
 * Enhanced Bundle analysis script for BOQ Builder
 * Analyzes the built bundle and provides insights on chunk sizes and optimization opportunities
 * Includes performance monitoring, regression detection, and detailed optimization recommendations
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

const DIST_DIR = 'dist';
const ASSETS_DIR = join(DIST_DIR, 'assets');
const JS_ASSETS_DIR = join(ASSETS_DIR, 'js');
const PERFORMANCE_LOG = 'performance-metrics.json';
const BUNDLE_HISTORY = 'bundle-history.json';

// Performance thresholds
const THRESHOLDS = {
  TOTAL_SIZE_WARNING: 500 * 1024, // 500KB
  TOTAL_SIZE_ERROR: 1024 * 1024, // 1MB
  CHUNK_SIZE_WARNING: 100 * 1024, // 100KB
  CHUNK_SIZE_ERROR: 250 * 1024, // 250KB
  GZIP_RATIO_WARNING: 0.3, // Less than 30% compression
  MAX_CHUNKS: 15
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateGzipSize(filePath) {
  try {
    const content = readFileSync(filePath);
    const gzipped = gzipSync(content);
    return gzipped.length;
  } catch (error) {
    return 0;
  }
}

function loadBundleHistory() {
  try {
    if (existsSync(BUNDLE_HISTORY)) {
      return JSON.parse(readFileSync(BUNDLE_HISTORY, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not load bundle history:', error.message);
  }
  return { builds: [] };
}

function saveBundleHistory(data) {
  try {
    writeFileSync(BUNDLE_HISTORY, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Could not save bundle history:', error.message);
  }
}

function detectRegressions(currentBuild, history) {
  const regressions = [];
  const lastBuild = history.builds[history.builds.length - 1];
  
  if (!lastBuild) return regressions;

  // Check total size regression
  const sizeIncrease = currentBuild.totalSize - lastBuild.totalSize;
  const sizeIncreasePercent = (sizeIncrease / lastBuild.totalSize) * 100;
  
  if (sizeIncreasePercent > 10) {
    regressions.push({
      type: 'size_regression',
      message: `Total bundle size increased by ${formatBytes(sizeIncrease)} (${sizeIncreasePercent.toFixed(1)}%)`,
      severity: sizeIncreasePercent > 25 ? 'error' : 'warning'
    });
  }

  // Check chunk count regression
  const chunkIncrease = currentBuild.chunkCount - lastBuild.chunkCount;
  if (chunkIncrease > 3) {
    regressions.push({
      type: 'chunk_regression',
      message: `Number of chunks increased by ${chunkIncrease}`,
      severity: 'warning'
    });
  }

  return regressions;
}

function generateOptimizationReport(chunks, totalSize, gzipSize) {
  const report = {
    summary: {
      totalSize,
      gzipSize,
      compressionRatio: gzipSize / totalSize,
      chunkCount: chunks.length
    },
    issues: [],
    recommendations: []
  };

  // Check total size
  if (totalSize > THRESHOLDS.TOTAL_SIZE_ERROR) {
    report.issues.push({
      type: 'error',
      message: `Total bundle size (${formatBytes(totalSize)}) exceeds error threshold (${formatBytes(THRESHOLDS.TOTAL_SIZE_ERROR)})`
    });
  } else if (totalSize > THRESHOLDS.TOTAL_SIZE_WARNING) {
    report.issues.push({
      type: 'warning',
      message: `Total bundle size (${formatBytes(totalSize)}) exceeds warning threshold (${formatBytes(THRESHOLDS.TOTAL_SIZE_WARNING)})`
    });
  }

  // Check compression ratio
  if (report.summary.compressionRatio > THRESHOLDS.GZIP_RATIO_WARNING) {
    report.issues.push({
      type: 'warning',
      message: `Poor compression ratio (${(report.summary.compressionRatio * 100).toFixed(1)}%). Consider optimizing assets.`
    });
  }

  // Check chunk count
  if (chunks.length > THRESHOLDS.MAX_CHUNKS) {
    report.issues.push({
      type: 'warning',
      message: `Too many chunks (${chunks.length}). Consider consolidating related chunks.`
    });
  }

  // Check individual chunk sizes
  const largeChunks = chunks.filter(chunk => chunk.size > THRESHOLDS.CHUNK_SIZE_ERROR);
  const warningChunks = chunks.filter(chunk => 
    chunk.size > THRESHOLDS.CHUNK_SIZE_WARNING && chunk.size <= THRESHOLDS.CHUNK_SIZE_ERROR
  );

  largeChunks.forEach(chunk => {
    report.issues.push({
      type: 'error',
      message: `Chunk ${chunk.name} is too large (${formatBytes(chunk.size)})`
    });
  });

  warningChunks.forEach(chunk => {
    report.issues.push({
      type: 'warning',
      message: `Chunk ${chunk.name} is large (${formatBytes(chunk.size)})`
    });
  });

  // Generate recommendations
  if (largeChunks.length > 0) {
    report.recommendations.push('Consider code splitting for large chunks');
    report.recommendations.push('Use dynamic imports for heavy libraries');
  }

  if (totalSize > THRESHOLDS.TOTAL_SIZE_WARNING) {
    report.recommendations.push('Enable tree shaking for unused code');
    report.recommendations.push('Implement lazy loading for more components');
    report.recommendations.push('Consider using lighter alternatives for heavy dependencies');
  }

  if (report.summary.compressionRatio > 0.4) {
    report.recommendations.push('Enable gzip compression on your server');
    report.recommendations.push('Consider using Brotli compression for better results');
  }

  return report;
}

function analyzeBundle() {
  console.log('🔍 Analyzing bundle with enhanced performance monitoring...\n');

  try {
    // Check if dist directory exists
    const distExists = readdirSync('.').includes(DIST_DIR);
    if (!distExists) {
      console.log('❌ No dist directory found. Run "npm run build" first.');
      return;
    }

    // Analyze assets directory
    const chunks = [];
    let totalSize = 0;
    let totalGzipSize = 0;

    // Analyze CSS files in assets directory
    const cssAssets = readdirSync(ASSETS_DIR).filter(file => extname(file) === '.css');
    cssAssets.forEach(file => {
      const filePath = join(ASSETS_DIR, file);
      const stats = statSync(filePath);
      const gzipSize = calculateGzipSize(filePath);
      
      chunks.push({
        name: file,
        size: stats.size,
        gzipSize,
        type: 'CSS',
        compressionRatio: gzipSize / stats.size
      });
      totalSize += stats.size;
      totalGzipSize += gzipSize;
    });

    // Analyze JS files in assets/js directory
    if (existsSync(JS_ASSETS_DIR)) {
      const jsAssets = readdirSync(JS_ASSETS_DIR).filter(file => 
        extname(file) === '.js' && !file.endsWith('.map')
      );
      
      jsAssets.forEach(file => {
        const filePath = join(JS_ASSETS_DIR, file);
        const stats = statSync(filePath);
        const gzipSize = calculateGzipSize(filePath);
        
        chunks.push({
          name: file,
          size: stats.size,
          gzipSize,
          type: 'JavaScript',
          compressionRatio: gzipSize / stats.size
        });
        totalSize += stats.size;
        totalGzipSize += gzipSize;
      });
    }

    // Sort by size (largest first)
    chunks.sort((a, b) => b.size - a.size);

    // Load bundle history
    const history = loadBundleHistory();
    
    // Create current build record
    const currentBuild = {
      timestamp: new Date().toISOString(),
      totalSize,
      totalGzipSize,
      chunkCount: chunks.length,
      chunks: chunks.map(chunk => ({
        name: chunk.name,
        size: chunk.size,
        gzipSize: chunk.gzipSize,
        type: chunk.type
      }))
    };

    // Detect regressions
    const regressions = detectRegressions(currentBuild, history);

    // Generate optimization report
    const report = generateOptimizationReport(chunks, totalSize, totalGzipSize);

    // Display results
    console.log('📊 Enhanced Bundle Analysis Results:');
    console.log('=' .repeat(60));
    console.log(`Total bundle size: ${formatBytes(totalSize)} (${formatBytes(totalGzipSize)} gzipped)`);
    console.log(`Compression ratio: ${(report.summary.compressionRatio * 100).toFixed(1)}%`);
    console.log(`Number of chunks: ${chunks.length}\n`);

    // Show regressions if any
    if (regressions.length > 0) {
      console.log('⚠️  Performance Regressions Detected:');
      console.log('-'.repeat(40));
      regressions.forEach(regression => {
        const icon = regression.severity === 'error' ? '❌' : '⚠️';
        console.log(`${icon} ${regression.message}`);
      });
      console.log();
    }

    // Show issues
    if (report.issues.length > 0) {
      console.log('🚨 Performance Issues:');
      console.log('-'.repeat(30));
      report.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : '⚠️';
        console.log(`${icon} ${issue.message}`);
      });
      console.log();
    }

    console.log('📦 Detailed Chunk Analysis:');
    console.log('-'.repeat(40));
    chunks.forEach((chunk, index) => {
      const percentage = ((chunk.size / totalSize) * 100).toFixed(1);
      const compressionPercent = (chunk.compressionRatio * 100).toFixed(1);
      
      console.log(`${index + 1}. ${chunk.name}`);
      console.log(`   Size: ${formatBytes(chunk.size)} (${percentage}%)`);
      console.log(`   Gzipped: ${formatBytes(chunk.gzipSize)} (${compressionPercent}% compression)`);
      console.log(`   Type: ${chunk.type}`);
      
      // Add warnings for individual chunks
      if (chunk.size > THRESHOLDS.CHUNK_SIZE_ERROR) {
        console.log(`   ❌ Chunk is too large!`);
      } else if (chunk.size > THRESHOLDS.CHUNK_SIZE_WARNING) {
        console.log(`   ⚠️  Chunk is large`);
      }
      
      if (chunk.compressionRatio > 0.4) {
        console.log(`   ⚠️  Poor compression ratio`);
      }
      
      console.log();
    });

    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 Optimization Recommendations:');
      console.log('-'.repeat(40));
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log();
    }

    // Performance score
    let score = 100;
    score -= report.issues.filter(i => i.type === 'error').length * 20;
    score -= report.issues.filter(i => i.type === 'warning').length * 10;
    score -= regressions.filter(r => r.severity === 'error').length * 15;
    score -= regressions.filter(r => r.severity === 'warning').length * 5;
    score = Math.max(0, score);

    console.log(`📈 Performance Score: ${score}/100`);
    if (score >= 90) {
      console.log('🎉 Excellent performance!');
    } else if (score >= 70) {
      console.log('👍 Good performance with room for improvement');
    } else if (score >= 50) {
      console.log('⚠️  Performance needs attention');
    } else {
      console.log('🚨 Critical performance issues detected');
    }

    // Save current build to history
    history.builds.push(currentBuild);
    // Keep only last 10 builds
    if (history.builds.length > 10) {
      history.builds = history.builds.slice(-10);
    }
    saveBundleHistory(history);

    // Save performance metrics
    const performanceMetrics = {
      timestamp: currentBuild.timestamp,
      score,
      totalSize,
      totalGzipSize,
      chunkCount: chunks.length,
      issues: report.issues.length,
      regressions: regressions.length
    };

    try {
      writeFileSync(PERFORMANCE_LOG, JSON.stringify(performanceMetrics, null, 2));
    } catch (error) {
      console.warn('Could not save performance metrics:', error.message);
    }

    console.log('\n✅ Enhanced analysis complete!');
    console.log(`📄 Performance metrics saved to ${PERFORMANCE_LOG}`);
    console.log(`📈 Bundle history saved to ${BUNDLE_HISTORY}`);

    // Exit with error code if critical issues found
    const criticalIssues = report.issues.filter(i => i.type === 'error').length + 
                          regressions.filter(r => r.severity === 'error').length;
    
    if (criticalIssues > 0) {
      console.log(`\n❌ ${criticalIssues} critical performance issue(s) detected. Build should be reviewed.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

// Run the analysis
analyzeBundle();
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('Lazy Loading Implementation', () => {
  it('should have React.lazy imports in App.jsx', async () => {
    // Read the App.jsx file to verify lazy imports are present
    const fs = await import('fs');
    const path = await import('path');
    
    const appPath = path.resolve('src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Check for lazy imports
    expect(appContent).toContain('React.lazy');
    expect(appContent).toContain('Suspense');
    expect(appContent).toContain('LoadingFallback');
    
    // Check that specific components are lazy loaded
    expect(appContent).toContain("React.lazy(() => import('./components/ItemManager'))");
    expect(appContent).toContain("React.lazy(() => import('./components/CategoryManager'))");
    expect(appContent).toContain("React.lazy(() => import('./components/BOQProjectManager'))");
    expect(appContent).toContain("React.lazy(() => import('./components/ProjectTemplate'))");
    expect(appContent).toContain("React.lazy(() => import('./components/BOQExport'))");
  });

  it('should have Vite configuration for code splitting', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const viteConfigPath = path.resolve('vite.config.js');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
    
    // Check for manual chunks configuration
    expect(viteConfig).toContain('manualChunks');
    expect(viteConfig).toContain('vendor');
    expect(viteConfig).toContain('ui');
    expect(viteConfig).toContain('data');
    expect(viteConfig).toContain('state');
    expect(viteConfig).toContain('validation');
    expect(viteConfig).toContain('virtualization');
  });

  it('should have chunk preloader utilities', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Check that chunk preloader exists
    const chunkPreloaderPath = path.resolve('src/utils/chunkPreloader.js');
    expect(fs.existsSync(chunkPreloaderPath)).toBe(true);
    
    // Check that hook exists
    const hookPath = path.resolve('src/hooks/useChunkPreloader.js');
    expect(fs.existsSync(hookPath)).toBe(true);
    
    // Check that LoadingFallback component exists
    const loadingFallbackPath = path.resolve('src/components/LoadingFallback.jsx');
    expect(fs.existsSync(loadingFallbackPath)).toBe(true);
  });

  it('should have bundle analysis script', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const bundleAnalysisPath = path.resolve('scripts/analyze-bundle.js');
    expect(fs.existsSync(bundleAnalysisPath)).toBe(true);
    
    // Check package.json has the build:analyze script
    const packageJsonPath = path.resolve('package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts).toHaveProperty('build:analyze');
  });
});
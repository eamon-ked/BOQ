import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ChunkPreloader', () => {
  let ChunkPreloader;
  let chunkPreloader;

  beforeEach(async () => {
    vi.resetModules();
    
    // Import the class and create a fresh instance
    const module = await import('../chunkPreloader');
    const ChunkPreloaderClass = module.default.constructor;
    chunkPreloader = new ChunkPreloaderClass();
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('initializes with empty state', () => {
      expect(chunkPreloader.preloadedChunks.size).toBe(0);
      expect(chunkPreloader.preloadQueue.length).toBe(0);
      expect(chunkPreloader.isPreloading).toBe(false);
    });

    it('does not preload already preloaded chunks', async () => {
      const mockImport = vi.fn().mockResolvedValue({ default: {} });
      chunkPreloader.preloadedChunks.add('TestChunk');
      
      const result = await chunkPreloader.preload(mockImport, 'TestChunk');
      
      expect(mockImport).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('returns current preloader statistics', () => {
      chunkPreloader.preloadedChunks.add('TestChunk');
      chunkPreloader.preloadQueue.push({ chunkName: 'QueuedChunk' });
      chunkPreloader.isPreloading = true;
      
      const stats = chunkPreloader.getStats();
      
      expect(stats).toEqual({
        preloadedChunks: ['TestChunk'],
        queueLength: 1,
        isPreloading: true
      });
    });
  });

  describe('preloadOnHover', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
    });

    it('sets up hover event listeners', () => {
      const mockImport = vi.fn().mockResolvedValue({ default: {} });
      
      chunkPreloader.preloadOnHover(mockElement, mockImport, 'HoverChunk');
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      );
    });

    it('returns cleanup function', () => {
      const mockImport = vi.fn().mockResolvedValue({ default: {} });
      
      const cleanup = chunkPreloader.preloadOnHover(
        mockElement,
        mockImport,
        'HoverChunk'
      );
      
      expect(typeof cleanup).toBe('function');
      
      cleanup();
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      );
    });
  });

  describe('preloadCriticalChunks', () => {
    it('calls preload for critical chunks', () => {
      const preloadSpy = vi.spyOn(chunkPreloader, 'preload').mockResolvedValue();
      
      chunkPreloader.preloadCriticalChunks();
      
      expect(preloadSpy).toHaveBeenCalledWith(
        expect.any(Function),
        'ItemManager',
        1
      );
      expect(preloadSpy).toHaveBeenCalledWith(
        expect.any(Function),
        'BOQExport',
        2
      );
      
      preloadSpy.mockRestore();
    });
  });

  describe('waitForIdle', () => {
    it('uses requestIdleCallback when available', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback();
      });
      
      global.window = { requestIdleCallback: mockRequestIdleCallback };
      
      await chunkPreloader.waitForIdle();
      
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 2000 }
      );
      
      delete global.window;
    });

    it('falls back to setTimeout when requestIdleCallback is not available', async () => {
      delete global.window;
      
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback();
        return 1;
      });
      
      await chunkPreloader.waitForIdle();
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);
      
      setTimeoutSpy.mockRestore();
    });
  });
});
/**
 * Chunk preloader utility for optimizing lazy loading performance
 * Preloads critical chunks based on user interaction patterns
 */

class ChunkPreloader {
  constructor() {
    this.preloadedChunks = new Set();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  /**
   * Preload a component chunk
   * @param {Function} importFunction - The dynamic import function
   * @param {string} chunkName - Name for tracking
   * @param {number} priority - Priority level (1-5, 1 being highest)
   */
  preload(importFunction, chunkName, priority = 3) {
    if (this.preloadedChunks.has(chunkName)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.preloadQueue.push({
        importFunction,
        chunkName,
        priority,
        resolve,
        reject
      });

      this.preloadQueue.sort((a, b) => a.priority - b.priority);
      this.processQueue();
    });
  }

  /**
   * Process the preload queue
   */
  async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const { importFunction, chunkName, resolve, reject } = this.preloadQueue.shift();

      try {
        // Use requestIdleCallback if available, otherwise use setTimeout
        await this.waitForIdle();
        
        const module = await importFunction();
        this.preloadedChunks.add(chunkName);
        resolve(module);
      } catch (error) {
        console.warn(`Failed to preload chunk ${chunkName}:`, error);
        reject(error);
      }
    }

    this.isPreloading = false;
  }

  /**
   * Wait for browser idle time
   */
  waitForIdle() {
    return new Promise(resolve => {
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(resolve, { timeout: 2000 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Preload chunks based on user interaction hints
   */
  preloadOnHover(element, importFunction, chunkName) {
    let timeoutId;

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preload(importFunction, chunkName, 2);
      }, 100); // Small delay to avoid preloading on quick hovers
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  /**
   * Preload chunks when user is likely to need them
   */
  preloadCriticalChunks() {
    // Preload modal components that are commonly used
    const criticalChunks = [
      {
        name: 'ItemManager',
        import: () => import('../components/ItemManager'),
        priority: 1
      },
      {
        name: 'BOQExport',
        import: () => import('../components/BOQExport'),
        priority: 2
      }
    ];

    criticalChunks.forEach(({ name, import: importFn, priority }) => {
      this.preload(importFn, name, priority);
    });
  }

  /**
   * Get preload statistics
   */
  getStats() {
    return {
      preloadedChunks: Array.from(this.preloadedChunks),
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading
    };
  }
}

// Create singleton instance
const chunkPreloader = new ChunkPreloader();

export default chunkPreloader;
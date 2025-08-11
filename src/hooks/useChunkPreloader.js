import { useEffect, useRef } from 'react';
import chunkPreloader from '../utils/chunkPreloader';

/**
 * Hook for preloading chunks based on user interactions
 */
export const useChunkPreloader = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // Preload critical chunks after initial render
      setTimeout(() => {
        chunkPreloader.preloadCriticalChunks();
      }, 1000);
      
      initialized.current = true;
    }
  }, []);

  return {
    preload: chunkPreloader.preload.bind(chunkPreloader),
    preloadOnHover: chunkPreloader.preloadOnHover.bind(chunkPreloader),
    getStats: chunkPreloader.getStats.bind(chunkPreloader)
  };
};

/**
 * Hook for preloading a component on hover
 */
export const useHoverPreload = (importFunction, chunkName) => {
  const elementRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (elementRef.current && !cleanupRef.current) {
      cleanupRef.current = chunkPreloader.preloadOnHover(
        elementRef.current,
        importFunction,
        chunkName
      );
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [importFunction, chunkName]);

  return elementRef;
};
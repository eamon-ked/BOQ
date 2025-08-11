import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChunkPreloader } from '../useChunkPreloader';
import chunkPreloader from '../../utils/chunkPreloader';

// Mock the chunk preloader
vi.mock('../../utils/chunkPreloader', () => ({
  default: {
    preloadCriticalChunks: vi.fn(),
    preload: vi.fn(),
    preloadOnHover: vi.fn(() => vi.fn()), // Returns cleanup function
    getStats: vi.fn(() => ({
      preloadedChunks: [],
      queueLength: 0,
      isPreloading: false
    }))
  }
}));

describe('useChunkPreloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes and preloads critical chunks', () => {
    renderHook(() => useChunkPreloader());

    // Fast-forward past the setTimeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(chunkPreloader.preloadCriticalChunks).toHaveBeenCalledOnce();
  });

  it('only initializes once on multiple renders', () => {
    const { rerender } = renderHook(() => useChunkPreloader());
    
    rerender();
    rerender();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(chunkPreloader.preloadCriticalChunks).toHaveBeenCalledOnce();
  });

  it('returns preloader methods', () => {
    const { result } = renderHook(() => useChunkPreloader());

    expect(result.current).toHaveProperty('preload');
    expect(result.current).toHaveProperty('preloadOnHover');
    expect(result.current).toHaveProperty('getStats');
    expect(typeof result.current.preload).toBe('function');
    expect(typeof result.current.preloadOnHover).toBe('function');
    expect(typeof result.current.getStats).toBe('function');
  });
});
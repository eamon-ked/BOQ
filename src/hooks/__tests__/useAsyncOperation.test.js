import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAsyncOperation, useMultipleAsyncOperations } from '../useAsyncOperation';

describe('useAsyncOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAsyncOperation());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
    });

    it('should handle successful async operation', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

      let executePromise;
      act(() => {
        executePromise = result.current.execute(mockAsyncFunction);
      });

      // Should be loading during execution
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);

      // Wait for completion
      const resultData = await act(async () => {
        return await executePromise;
      });

      expect(resultData).toBe('success data');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('success data');
      expect(result.current.error).toBe(null);
    });

    it('should handle failed async operation', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockError = new Error('Test error');
      const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

      let executePromise;
      act(() => {
        executePromise = result.current.execute(mockAsyncFunction);
      });

      // Should be loading during execution
      expect(result.current.isLoading).toBe(true);

      // Wait for completion and expect error
      await act(async () => {
        await expect(executePromise).rejects.toThrow('Test error');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Test error');
      expect(result.current.data).toBe(null);
    });

    it('should call success callback on successful operation', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAsyncOperation({ onSuccess }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      expect(onSuccess).toHaveBeenCalledWith('success data');
    });

    it('should call error callback on failed operation', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useAsyncOperation({ onError }));
      const mockError = new Error('Test error');
      const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

      await act(async () => {
        try {
          await result.current.execute(mockAsyncFunction);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('loading state persistence', () => {
    it('should persist loading state when persistLoading is true', async () => {
      const { result } = renderHook(() => useAsyncOperation({ persistLoading: true }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      // Loading should still be true with persistLoading enabled
      expect(result.current.isLoading).toBe(true);
    });

    it('should clear loading state when persistLoading is false', async () => {
      const { result } = renderHook(() => useAsyncOperation({ persistLoading: false }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      // Loading should be false with persistLoading disabled
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('retry functionality', () => {
    it('should retry failed operations', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockAsyncFunction = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success data');

      await act(async () => {
        const resultData = await result.current.executeWithRetry(mockAsyncFunction, 3, 10);
        expect(resultData).toBe('success data');
      });

      expect(mockAsyncFunction).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockError = new Error('Persistent error');
      const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

      await act(async () => {
        await expect(
          result.current.executeWithRetry(mockAsyncFunction, 2, 10)
        ).rejects.toThrow('Persistent error');
      });

      expect(mockAsyncFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancellation', () => {
    it('should cancel ongoing operation', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockAsyncFunction = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('data'), 1000))
      );

      act(() => {
        result.current.execute(mockAsyncFunction);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        try {
          await result.current.execute(vi.fn().mockRejectedValue(new Error('Test error')));
        } catch (error) {
          // Expected to throw
        }
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should clear data', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockAsyncFunction = vi.fn().mockResolvedValue('test data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      expect(result.current.data).toBe('test data');

      act(() => {
        result.current.clearData();
      });

      expect(result.current.data).toBe(null);
    });

    it('should reset all state', async () => {
      const { result } = renderHook(() => useAsyncOperation());
      const mockAsyncFunction = vi.fn().mockResolvedValue('test data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
    });
  });
});

describe('useMultipleAsyncOperations', () => {
  it('should initialize with correct state for multiple operations', () => {
    const operationKeys = ['operation1', 'operation2', 'operation3'];
    const { result } = renderHook(() => useMultipleAsyncOperations(operationKeys));

    expect(result.current.loadingStates).toEqual({
      operation1: false,
      operation2: false,
      operation3: false
    });
    expect(result.current.errors).toEqual({
      operation1: null,
      operation2: null,
      operation3: null
    });
    expect(result.current.isAnyLoading).toBe(false);
    expect(result.current.hasAnyError).toBe(false);
  });

  it('should handle multiple operations independently', async () => {
    const operationKeys = ['op1', 'op2'];
    const { result } = renderHook(() => useMultipleAsyncOperations(operationKeys));

    const mockAsyncFunction1 = vi.fn().mockResolvedValue('data1');
    const mockAsyncFunction2 = vi.fn().mockRejectedValue(new Error('error2'));

    await act(async () => {
      await result.current.execute('op1', mockAsyncFunction1);
    });

    await act(async () => {
      try {
        await result.current.execute('op2', mockAsyncFunction2);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.data.op1).toBe('data1');
    expect(result.current.errors.op2).toBe('error2');
    expect(result.current.loadingStates.op1).toBe(false);
    expect(result.current.loadingStates.op2).toBe(false);
  });

  it('should track any loading state correctly', async () => {
    const operationKeys = ['op1', 'op2'];
    const { result } = renderHook(() => useMultipleAsyncOperations(operationKeys));

    const mockAsyncFunction = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
    );

    act(() => {
      result.current.execute('op1', mockAsyncFunction);
    });

    expect(result.current.isAnyLoading).toBe(true);
    expect(result.current.loadingStates.op1).toBe(true);

    await waitFor(() => {
      expect(result.current.isAnyLoading).toBe(false);
    });
  });
});
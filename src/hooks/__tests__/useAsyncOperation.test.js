import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import toast from 'react-hot-toast';
import { useAsyncOperation } from '../useAsyncOperation.js';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  }
}));

vi.mock('../../store/index.js', () => ({
  useAppStore: vi.fn()
}));

vi.mock('../../utils/errorLogger.js', () => ({
  errorLogger: {
    logError: vi.fn()
  },
  ErrorType: {
    COMPONENT_ERROR: 'component_error'
  },
  ErrorSeverity: {
    MEDIUM: 'medium'
  }
}));

describe('useAsyncOperation', () => {
  let mockSetLoading, mockSetError, mockClearError;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockSetLoading = vi.fn();
    mockSetError = vi.fn();
    mockClearError = vi.fn();

    const { useAppStore } = await import('../../store/index.js');
    useAppStore.mockImplementation((selector) => {
      const mockState = {
        setLoading: mockSetLoading,
        setError: mockSetError,
        clearError: mockClearError
      };
      return selector ? selector(mockState) : mockState;
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAsyncOperation());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.hasError).toBe(false);
      expect(result.current.hasData).toBe(false);
      expect(result.current.canRetry).toBeFalsy();
      expect(result.current.isRetrying).toBe(false);
    });

    it('should execute async operation successfully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success result');
      const { result } = renderHook(() => useAsyncOperation({ preventFlickering: false }));

      await act(async () => {
        await result.current.execute(mockOperation);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('success result');
      expect(result.current.error).toBe(null);
      expect(result.current.hasData).toBe(true);
      expect(result.current.hasError).toBe(false);
      expect(mockOperation).toHaveBeenCalledWith({ signal: expect.any(AbortSignal), context: {} });
    });

    it('should handle operation failure', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(mockError);
      const { result } = renderHook(() => useAsyncOperation({ 
        retryAttempts: 0,
        preventFlickering: false
      }));

      let caughtError;
      await act(async () => {
        try {
          await result.current.execute(mockOperation);
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
      expect(result.current.hasError).toBe(true);
      expect(result.current.hasData).toBe(false);
    });

    it('should call success callback on successful operation', async () => {
      const mockOnSuccess = vi.fn();
      const mockOperation = vi.fn().mockResolvedValue('success result');
      const { result } = renderHook(() => useAsyncOperation({ 
        onSuccess: mockOnSuccess,
        preventFlickering: false
      }));

      await act(async () => {
        await result.current.execute(mockOperation);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('success result', {});
    });

    it('should call error callback on failed operation', async () => {
      const mockOnError = vi.fn();
      const mockError = new Error('Test error');
      const mockOperation = vi.fn().mockRejectedValue(mockError);
      const { result } = renderHook(() => useAsyncOperation({ 
        onError: mockOnError,
        retryAttempts: 0,
        preventFlickering: false
      }));

      await act(async () => {
        try {
          await result.current.execute(mockOperation);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError, expect.objectContaining({ finalAttempt: true }));
    });
  });

  describe('Loading State Persistence', () => {
    it('should persist loading state in store when persistLoading is true and key is provided', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        persistLoading: true, 
        key: 'test-operation',
        preventFlickering: false
      }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      expect(mockSetLoading).toHaveBeenCalledWith('test-operation', true);
      expect(mockSetLoading).toHaveBeenCalledWith('test-operation', false);
    });

    it('should not persist loading state when persistLoading is false', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        persistLoading: false, 
        key: 'test-operation',
        preventFlickering: false
      }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      expect(mockSetLoading).not.toHaveBeenCalled();
    });

    it('should handle minimum loading time to prevent flickering', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        preventFlickering: true,
        minLoadingTime: 100
      }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('success data');
      
      await act(async () => {
        const promise = result.current.execute(mockAsyncFunction);
        await vi.runAllTimersAsync();
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('success data');
    });
  });

  describe('Retry Functionality', () => {
    it('should retry failed operations automatically', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        retryAttempts: 2,
        retryDelay: 10,
        exponentialBackoff: false,
        preventFlickering: false
      }));
      const mockAsyncFunction = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success data');

      await act(async () => {
        const promise = result.current.execute(mockAsyncFunction);
        await vi.runAllTimersAsync();
        const resultData = await promise;
        expect(resultData).toBe('success data');
      });

      expect(mockAsyncFunction).toHaveBeenCalledTimes(3);
      expect(result.current.retryCount).toBe(0); // Reset after success
    });

    it('should not retry non-retryable errors', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        retryAttempts: 2,
        preventFlickering: false
      }));
      const mockError = new Error('Validation error');
      mockError.status = 400; // Client error - not retryable
      const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

      let caughtError;
      await act(async () => {
        try {
          await result.current.execute(mockAsyncFunction);
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBe(mockError);
      expect(mockAsyncFunction).toHaveBeenCalledTimes(1); // No retries
      expect(result.current.retryCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should show toast notifications for errors when enabled', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        showToast: true,
        retryAttempts: 0,
        preventFlickering: false
      }));
      const mockError = new Error('Test error');
      const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

      let caughtError;
      await act(async () => {
        try {
          await result.current.execute(mockAsyncFunction);
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBe(mockError);
      expect(toast.error).toHaveBeenCalledWith('Test error', expect.any(Object));
    });

    it('should not show toast notifications when disabled', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        showToast: false,
        retryAttempts: 0,
        preventFlickering: false
      }));
      const mockError = new Error('Test error');
      const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

      let caughtError;
      await act(async () => {
        try {
          await result.current.execute(mockAsyncFunction);
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBe(mockError);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should determine retryable errors correctly', () => {
      const { result } = renderHook(() => useAsyncOperation());

      // Network errors should be retryable
      const networkError = new Error('fetch failed');
      networkError.name = 'TypeError';
      expect(result.current.isRetryableError(networkError)).toBe(true);

      // Server errors should be retryable
      const serverError = new Error('Internal server error');
      serverError.status = 500;
      expect(result.current.isRetryableError(serverError)).toBe(true);

      // Client errors should not be retryable
      const clientError = new Error('Bad request');
      clientError.status = 400;
      expect(result.current.isRetryableError(clientError)).toBe(false);

      // Rate limiting should be retryable
      const rateLimitError = new Error('Too many requests');
      rateLimitError.status = 429;
      expect(result.current.isRetryableError(rateLimitError)).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        key: 'test-op',
        retryAttempts: 0,
        preventFlickering: false
      }));

      let caughtError;
      await act(async () => {
        try {
          await result.current.execute(vi.fn().mockRejectedValue(new Error('Test error')));
        } catch (error) {
          caughtError = error;
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(caughtError).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(mockClearError).toHaveBeenCalledWith('test-op');
    });

    it('should reset all state', async () => {
      const { result } = renderHook(() => useAsyncOperation({ 
        key: 'test-op',
        preventFlickering: false
      }));
      const mockAsyncFunction = vi.fn().mockResolvedValue('test data');

      await act(async () => {
        await result.current.execute(mockAsyncFunction);
      });

      expect(result.current.data).toBe('test data');

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.lastExecutionTime).toBe(null);
      expect(mockClearError).toHaveBeenCalledWith('test-op');
    });
  });
});
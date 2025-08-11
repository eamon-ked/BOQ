import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/index.js';
import { errorLogger, ErrorType, ErrorSeverity } from '../utils/errorLogger.js';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing async operations with loading states, error handling, and retry mechanisms
 * @param {Object} options - Configuration options
 * @param {string} options.key - Unique key for the operation (used for loading state persistence)
 * @param {Function} options.onSuccess - Callback function called on successful operation
 * @param {Function} options.onError - Callback function called on operation error
 * @param {boolean} options.showToast - Whether to show toast notifications (default: true)
 * @param {boolean} options.persistLoading - Whether to persist loading state in store (default: true)
 * @param {number} options.retryAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Base delay between retries in ms (default: 1000)
 * @param {boolean} options.exponentialBackoff - Whether to use exponential backoff for retries (default: true)
 * @param {number} options.timeout - Operation timeout in ms (default: 30000)
 * @param {boolean} options.preventFlickering - Whether to add minimum loading time to prevent flickering (default: true)
 * @param {number} options.minLoadingTime - Minimum loading time in ms (default: 300)
 * @returns {Object} Async operation state and methods
 */
export const useAsyncOperation = (options = {}) => {
  const {
    key,
    onSuccess,
    onError,
    showToast = true,
    persistLoading = true,
    retryAttempts = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    timeout = 30000,
    preventFlickering = true,
    minLoadingTime = 300
  } = options;

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastExecutionTime, setLastExecutionTime] = useState(null);

  // Store actions for global loading state
  const setStoreLoading = useAppStore((state) => state.setLoading);
  const setStoreError = useAppStore((state) => state.setError);
  const clearStoreError = useAppStore((state) => state.clearError);

  // Refs for cleanup and state management
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const loadingStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
    if (key) {
      clearStoreError(key);
    }
  }, [key, clearStoreError]);

  /**
   * Sets loading state with optional store persistence
   * @param {boolean} loading - Loading state
   */
  const setLoadingState = useCallback((loading) => {
    if (!isMountedRef.current) return;

    setIsLoading(loading);
    
    if (persistLoading && key) {
      setStoreLoading(key, loading);
    }

    if (loading) {
      loadingStartTimeRef.current = Date.now();
    }
  }, [persistLoading, key, setStoreLoading]);

  /**
   * Sets error state with optional store persistence and logging
   * @param {Error} errorObj - Error object
   * @param {Object} context - Additional context for error logging
   */
  const setErrorState = useCallback((errorObj, context = {}) => {
    if (!isMountedRef.current) return;

    const errorMessage = errorObj?.message || 'An unexpected error occurred';
    setError(errorObj);

    // Log error for debugging
    errorLogger.logError(errorObj, {
      ...context,
      key,
      retryCount,
      timestamp: new Date().toISOString()
    }, ErrorType.COMPONENT_ERROR, ErrorSeverity.MEDIUM);

    // Set store error if key is provided
    if (key) {
      setStoreError(key, errorMessage);
    }

    // Show error toast if enabled
    if (showToast) {
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
        id: `error-${key || 'async-op'}-${Date.now()}`
      });
    }

    // Call error callback
    if (onError) {
      onError(errorObj, context);
    }
  }, [key, retryCount, setStoreError, showToast, onError]);

  /**
   * Handles successful operation completion
   * @param {*} result - Operation result
   * @param {Object} context - Additional context
   */
  const handleSuccess = useCallback((result, context = {}) => {
    if (!isMountedRef.current) return;

    setData(result);
    setError(null);
    setRetryCount(0);
    setLastExecutionTime(Date.now());

    // Clear store error if it exists
    if (key) {
      clearStoreError(key);
    }

    // Show success toast if enabled and result is meaningful
    if (showToast && context.showSuccessToast !== false) {
      const message = context.successMessage || 'Operation completed successfully';
      toast.success(message, {
        duration: 3000,
        icon: '✅',
        id: `success-${key || 'async-op'}-${Date.now()}`
      });
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(result, context);
    }
  }, [key, clearStoreError, showToast, onSuccess]);

  /**
   * Calculates delay for retry with optional exponential backoff
   * @param {number} attempt - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  const calculateRetryDelay = useCallback((attempt) => {
    if (!exponentialBackoff) {
      return retryDelay;
    }
    
    // Exponential backoff with jitter
    const baseDelay = retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
  }, [retryDelay, exponentialBackoff]);

  /**
   * Determines if an error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether the error is retryable
   */
  const isRetryableError = useCallback((error) => {
    // Network errors are generally retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Timeout errors are retryable
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Rate limiting (429) is retryable
    if (error.status === 429) {
      return true;
    }

    // Connection errors are retryable
    if (error.message.includes('connection') || error.message.includes('network')) {
      return true;
    }

    // Client errors (4xx) are generally not retryable
    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    // Default to retryable for unknown errors
    return true;
  }, []);

  /**
   * Executes an async operation with retry logic and error handling
   * @param {Function} operation - Async function to execute
   * @param {Object} context - Additional context for the operation
   * @returns {Promise} Promise that resolves with the operation result
   */
  const execute = useCallback(async (operation, context = {}) => {
    if (!operation || typeof operation !== 'function') {
      throw new Error('Operation must be a function');
    }

    // Clear previous error
    clearError();

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Set loading state
    setLoadingState(true);

    try {
      // Set up timeout
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, timeout);
      }

      // Execute the operation with abort signal
      const result = await operation({ signal, context });

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Handle minimum loading time to prevent flickering
      if (preventFlickering && loadingStartTimeRef.current) {
        const elapsedTime = Date.now() - loadingStartTimeRef.current;
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
      }

      // Set loading to false before handling success
      setLoadingState(false);

      // Handle success
      handleSuccess(result, context);

      return result;
    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Handle abort/cancellation
      if (error.name === 'AbortError' || signal.aborted) {
        setLoadingState(false);
        return null; // Don't treat cancellation as an error
      }

      // Handle minimum loading time even for errors
      if (preventFlickering && loadingStartTimeRef.current) {
        const elapsedTime = Date.now() - loadingStartTimeRef.current;
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
      }

      // Set loading to false before handling error
      setLoadingState(false);

      // Handle error and potential retry
      if (retryCount < retryAttempts && isRetryableError(error)) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);

        const delay = calculateRetryDelay(nextRetryCount);
        
        // Show retry toast if enabled
        if (showToast) {
          toast.loading(`Retrying... (${nextRetryCount}/${retryAttempts})`, {
            duration: delay,
            icon: '🔄',
            id: `retry-${key || 'async-op'}-${nextRetryCount}`
          });
        }

        // Wait for retry delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the operation
        return execute(operation, context);
      } else {
        // Max retries reached or non-retryable error
        setErrorState(error, { ...context, finalAttempt: true });
        throw error;
      }
    }
  }, [
    clearError,
    setLoadingState,
    timeout,
    preventFlickering,
    minLoadingTime,
    handleSuccess,
    retryCount,
    retryAttempts,
    isRetryableError,
    calculateRetryDelay,
    showToast,
    key,
    setErrorState
  ]);

  /**
   * Cancels the current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoadingState(false);
    setRetryCount(0);
  }, [setLoadingState]);

  /**
   * Resets the operation state
   */
  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
    setRetryCount(0);
    setLastExecutionTime(null);
    
    if (key) {
      clearStoreError(key);
    }
  }, [cancel, key, clearStoreError]);

  /**
   * Retries the last operation (if available)
   * @param {Function} operation - Operation to retry (required if no previous operation)
   * @param {Object} context - Additional context
   */
  const retry = useCallback(async (operation, context = {}) => {
    if (!operation) {
      throw new Error('No operation provided for retry');
    }

    setRetryCount(0); // Reset retry count for manual retry
    return execute(operation, { ...context, isManualRetry: true });
  }, [execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  // Computed state
  const isRetrying = retryCount > 0;
  const canRetry = error && retryCount < retryAttempts;
  const hasError = !!error;
  const hasData = data !== null;

  return {
    // State
    isLoading,
    error,
    data,
    retryCount,
    lastExecutionTime,

    // Computed state
    isRetrying,
    canRetry,
    hasError,
    hasData,

    // Methods
    execute,
    cancel,
    reset,
    retry,
    clearError,

    // Utilities
    isRetryableError
  };
};

/**
 * Hook for managing multiple async operations with shared loading state
 * @param {Object} options - Configuration options
 * @param {string} options.key - Unique key for the operations group
 * @param {boolean} options.showToast - Whether to show toast notifications
 * @param {boolean} options.persistLoading - Whether to persist loading state in store
 * @returns {Object} Multi-operation state and methods
 */
export const useMultiAsyncOperation = (options = {}) => {
  const {
    key,
    showToast = true,
    persistLoading = true
  } = options;

  const [operations, setOperations] = useState(new Map());
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Store actions
  const setStoreLoading = useAppStore((state) => state.setLoading);
  const setStoreError = useAppStore((state) => state.setError);
  const clearStoreError = useAppStore((state) => state.clearError);

  /**
   * Adds or updates an operation
   * @param {string} operationKey - Unique key for the operation
   * @param {Object} operationState - Operation state
   */
  const updateOperation = useCallback((operationKey, operationState) => {
    setOperations(prev => {
      const newOperations = new Map(prev);
      newOperations.set(operationKey, operationState);
      return newOperations;
    });
  }, []);

  /**
   * Removes an operation
   * @param {string} operationKey - Key of operation to remove
   */
  const removeOperation = useCallback((operationKey) => {
    setOperations(prev => {
      const newOperations = new Map(prev);
      newOperations.delete(operationKey);
      return newOperations;
    });
  }, []);

  /**
   * Creates a new async operation hook tied to this multi-operation manager
   * @param {string} operationKey - Unique key for the operation
   * @param {Object} operationOptions - Options for the individual operation
   * @returns {Object} Async operation hook result
   */
  const createOperation = useCallback((operationKey, operationOptions = {}) => {
    const operation = useAsyncOperation({
      ...operationOptions,
      key: `${key}-${operationKey}`,
      persistLoading: false, // We'll handle global loading state
      onSuccess: (result, context) => {
        updateOperation(operationKey, { isLoading: false, error: null, data: result });
        if (operationOptions.onSuccess) {
          operationOptions.onSuccess(result, context);
        }
      },
      onError: (error, context) => {
        updateOperation(operationKey, { isLoading: false, error, data: null });
        if (operationOptions.onError) {
          operationOptions.onError(error, context);
        }
      }
    });

    // Update operation state when loading changes
    useEffect(() => {
      updateOperation(operationKey, {
        isLoading: operation.isLoading,
        error: operation.error,
        data: operation.data
      });
    }, [operation.isLoading, operation.error, operation.data, operationKey]);

    return operation;
  }, [key, updateOperation]);

  // Update global loading state based on individual operations
  useEffect(() => {
    const anyLoading = Array.from(operations.values()).some(op => op.isLoading);
    setGlobalLoading(anyLoading);
    
    if (persistLoading && key) {
      setStoreLoading(key, anyLoading);
    }
  }, [operations, persistLoading, key, setStoreLoading]);

  // Update global error state
  useEffect(() => {
    const errors = Array.from(operations.values())
      .map(op => op.error)
      .filter(Boolean);
    
    const firstError = errors[0] || null;
    setGlobalError(firstError);
    
    if (key) {
      if (firstError) {
        setStoreError(key, firstError.message);
      } else {
        clearStoreError(key);
      }
    }
  }, [operations, key, setStoreError, clearStoreError]);

  /**
   * Cancels all operations
   */
  const cancelAll = useCallback(() => {
    operations.forEach((_, operationKey) => {
      // Individual operations will handle their own cancellation
    });
  }, [operations]);

  /**
   * Resets all operations
   */
  const resetAll = useCallback(() => {
    setOperations(new Map());
    setGlobalLoading(false);
    setGlobalError(null);
    
    if (key) {
      clearStoreError(key);
      setStoreLoading(key, false);
    }
  }, [key, clearStoreError, setStoreLoading]);

  return {
    // Global state
    isLoading: globalLoading,
    error: globalError,
    operations: Object.fromEntries(operations),
    operationCount: operations.size,

    // Methods
    createOperation,
    removeOperation,
    cancelAll,
    resetAll
  };
};

export default useAsyncOperation;
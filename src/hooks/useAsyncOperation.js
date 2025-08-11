import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing async operations with loading states and error handling
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback for successful operations
 * @param {Function} options.onError - Callback for failed operations
 * @param {boolean} options.persistLoading - Whether to persist loading state across operations
 * @returns {Object} Hook state and methods
 */
export const useAsyncOperation = (options = {}) => {
  const {
    onSuccess,
    onError,
    persistLoading = false
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const execute = useCallback(async (asyncFunction, ...args) => {
    try {
      // Clear previous error
      setError(null);
      
      // Set loading state
      setIsLoading(true);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Execute the async function
      const result = await asyncFunction(...args, abortControllerRef.current.signal);
      
      // Set the result data
      setData(result);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Clear loading state unless persistence is enabled
      if (!persistLoading) {
        setIsLoading(false);
      }

      return result;
    } catch (err) {
      // Don't set error if operation was aborted
      if (err.name === 'AbortError') {
        return null;
      }

      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);

      // Call error callback if provided
      if (onError) {
        onError(err);
      }

      // Clear loading state unless persistence is enabled
      if (!persistLoading) {
        setIsLoading(false);
      }

      throw err;
    } finally {
      // Clear abort controller
      abortControllerRef.current = null;
    }
  }, [onSuccess, onError, persistLoading]);

  const executeWithRetry = useCallback(async (asyncFunction, maxRetries = 3, delay = 1000, ...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await execute(asyncFunction, ...args);
      } catch (err) {
        lastError = err;
        
        // Don't retry if it's an abort error or on the last attempt
        if (err.name === 'AbortError' || attempt === maxRetries) {
          throw err;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  }, [execute]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    executeWithRetry,
    cancel,
    clearError,
    clearData,
    reset,
    cleanup
  };
};

/**
 * Hook for managing multiple async operations
 * @param {Array<string>} operationKeys - Array of operation identifiers
 * @returns {Object} State and methods for multiple operations
 */
export const useMultipleAsyncOperations = (operationKeys = []) => {
  const [loadingStates, setLoadingStates] = useState(
    operationKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );
  const [errors, setErrors] = useState(
    operationKeys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
  );
  const [data, setData] = useState(
    operationKeys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
  );

  const setLoading = useCallback((key, loading) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const setOperationData = useCallback((key, operationData) => {
    setData(prev => ({ ...prev, [key]: operationData }));
  }, []);

  const clearError = useCallback((key) => {
    setErrors(prev => ({ ...prev, [key]: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors(operationKeys.reduce((acc, key) => ({ ...acc, [key]: null }), {}));
  }, [operationKeys]);

  const execute = useCallback(async (key, asyncFunction, ...args) => {
    try {
      setError(key, null);
      setLoading(key, true);

      const result = await asyncFunction(...args);
      setOperationData(key, result);
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(key, errorMessage);
      throw err;
    } finally {
      setLoading(key, false);
    }
  }, [setError, setLoading, setOperationData]);

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);
  const hasAnyError = Object.values(errors).some(error => error !== null);

  return {
    loadingStates,
    errors,
    data,
    isAnyLoading,
    hasAnyError,
    execute,
    setLoading,
    setError: setError,
    clearError,
    clearAllErrors
  };
};
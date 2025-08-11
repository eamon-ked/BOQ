import React, { createContext, useContext, useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [persistentStates, setPersistentStates] = useState(new Set());

  const setLoading = useCallback((key, isLoading, message = '', persistent = false) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading ? { isLoading: true, message } : undefined
    }));

    if (persistent && isLoading) {
      setPersistentStates(prev => new Set([...prev, key]));
    } else if (!isLoading) {
      setPersistentStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, []);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setPersistentStates(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    setPersistentStates(new Set());
  }, []);

  const isLoading = useCallback((key) => {
    return Boolean(loadingStates[key]?.isLoading);
  }, [loadingStates]);

  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || '';
  }, [loadingStates]);

  const isAnyLoading = Object.keys(loadingStates).length > 0;
  const hasGlobalLoading = Object.values(loadingStates).some(state => 
    state?.isLoading && persistentStates.has(Object.keys(loadingStates).find(key => 
      loadingStates[key] === state
    ))
  );

  const value = {
    setLoading,
    clearLoading,
    clearAllLoading,
    isLoading,
    getLoadingMessage,
    isAnyLoading,
    hasGlobalLoading,
    loadingStates
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {hasGlobalLoading && (
        <LoadingSpinner 
          fullScreen 
          message={Object.entries(loadingStates)
            .find(([key, state]) => state?.isLoading && persistentStates.has(key))?.[1]?.message || 'Loading...'
          }
        />
      )}
    </LoadingContext.Provider>
  );
};

export default LoadingProvider;
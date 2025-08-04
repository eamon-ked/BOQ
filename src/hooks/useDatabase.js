import { useState, useEffect, useCallback } from 'react';
import databaseService from '../services/database';

export const useDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await databaseService.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
        console.error('Database initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Categories
  const getCategories = useCallback(async () => {
    if (!isInitialized) return [];
    try {
      return await databaseService.getCategories();
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [isInitialized]);

  const addCategory = useCallback(async (name) => {
    if (!isInitialized) return false;
    try {
      await databaseService.addCategory(name);
      return true;
    } catch (err) {
      // Handle specific error types
      if (err.message.includes('UNIQUE constraint failed')) {
        setError('Category already exists. Please use a unique name.');
      } else {
        setError(err.message);
      }
      return false;
    }
  }, [isInitialized]);

  const updateCategory = useCallback(async (oldName, newName) => {
    if (!isInitialized) return false;
    try {
      await databaseService.updateCategory(oldName, newName);
      return true;
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        setError('Category name already exists. Please use a unique name.');
      } else {
        setError(err.message);
      }
      return false;
    }
  }, [isInitialized]);

  const deleteCategory = useCallback(async (name) => {
    if (!isInitialized) return false;
    try {
      const result = databaseService.deleteCategory(name);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isInitialized]);

  // Items
  const getItems = useCallback(async () => {
    if (!isInitialized) return [];
    try {
      return await databaseService.getItems();
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [isInitialized]);

  const addItem = useCallback(async (item) => {
    if (!isInitialized) return false;
    try {
      await databaseService.addItem(item);
      return true;
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        setError('Item with this ID already exists. Please use a unique ID.');
      } else {
        setError(err.message);
      }
      return false;
    }
  }, [isInitialized]);

  const updateItem = useCallback(async (itemId, item) => {
    if (!isInitialized) return false;
    try {
      await databaseService.updateItem(itemId, item);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [isInitialized]);

  const deleteItem = useCallback(async (itemId) => {
    if (!isInitialized) return false;
    try {
      const result = databaseService.deleteItem(itemId);
      if (!result) {
        setError('Failed to delete item');
      }
      return result;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [isInitialized]);

  // Database management
  const exportDatabase = useCallback(() => {
    if (!isInitialized) return null;
    try {
      return databaseService.exportDatabase();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [isInitialized]);

  const importDatabase = useCallback(async (data) => {
    try {
      setIsLoading(true);
      const result = await databaseService.importDatabase(data);
      if (result) {
        setIsInitialized(true);
      } else {
        setError('Failed to import database');
      }
      return result;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // BOQ Projects
  const getBOQProjects = useCallback(async () => {
    if (!isInitialized) return [];
    try {
      return await databaseService.getBOQProjects();
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [isInitialized]);

  const createBOQProject = useCallback(async (name, description = '') => {
    if (!isInitialized) return null;
    try {
      const result = await databaseService.createBOQProject(name, description);
      return result.projectId;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [isInitialized]);

  const updateBOQProject = useCallback(async (projectId, name, description = '') => {
    if (!isInitialized) return false;
    try {
      await databaseService.updateBOQProject(projectId, name, description);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [isInitialized]);

  const deleteBOQProject = useCallback(async (projectId) => {
    if (!isInitialized) return false;
    try {
      await databaseService.deleteBOQProject(projectId);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [isInitialized]);

  const getBOQItems = useCallback(async (projectId) => {
    if (!isInitialized) return [];
    try {
      return await databaseService.getBOQItems(projectId);
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [isInitialized]);

  const saveBOQItems = useCallback(async (projectId, items) => {
    if (!isInitialized) return false;
    try {
      await databaseService.saveBOQItems(projectId, items);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [isInitialized]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    isInitialized,
    clearError,
    // Categories
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    // Items
    getItems,
    addItem,
    updateItem,
    deleteItem,
    // BOQ Projects
    getBOQProjects,
    createBOQProject,
    updateBOQProject,
    deleteBOQProject,
    getBOQItems,
    saveBOQItems,
    // Database management
    exportDatabase,
    importDatabase
  };
};
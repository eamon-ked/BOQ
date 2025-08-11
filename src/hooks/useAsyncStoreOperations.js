import { useCallback } from 'react';
import { useAsyncOperation } from './useAsyncOperation.js';
import { useAppStore } from '../store/index.js';
import * as asyncActions from '../store/asyncActions.js';

/**
 * Custom hook that integrates useAsyncOperation with store operations
 * This provides a bridge between the async operation hook and the existing store
 */
export const useAsyncStoreOperations = () => {
  // Get store actions
  const setMasterDatabase = useAppStore((state) => state.setMasterDatabase);
  const setCategories = useAppStore((state) => state.setCategories);
  const setBOQProjects = useAppStore((state) => state.setBOQProjects);
  const setTemplates = useAppStore((state) => state.setTemplates);

  // Initialize async operations for different store operations
  const initializeOp = useAsyncOperation({
    key: 'store-initialize',
    persistLoading: true,
    showToast: true,
    retryAttempts: 2,
    retryDelay: 1000
  });

  const loadItemsOp = useAsyncOperation({
    key: 'store-load-items',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1,
    onSuccess: (items) => {
      // Update store with loaded items
      setMasterDatabase(items);
    }
  });

  const loadCategoriesOp = useAsyncOperation({
    key: 'store-load-categories',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1,
    onSuccess: (categories) => {
      // Update store with loaded categories
      setCategories(categories);
    }
  });

  const loadProjectsOp = useAsyncOperation({
    key: 'store-load-projects',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1,
    onSuccess: (projects) => {
      // Update store with loaded projects
      setBOQProjects(projects);
    }
  });

  const loadTemplatesOp = useAsyncOperation({
    key: 'store-load-templates',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1,
    onSuccess: (templates) => {
      // Update store with loaded templates
      setTemplates(templates);
    }
  });

  const addItemOp = useAsyncOperation({
    key: 'store-add-item',
    showToast: true,
    retryAttempts: 1,
    onSuccess: (result) => {
      // Refresh items after successful add
      loadItems();
    }
  });

  const updateItemOp = useAsyncOperation({
    key: 'store-update-item',
    showToast: true,
    retryAttempts: 1,
    onSuccess: (result) => {
      // Refresh items after successful update
      loadItems();
    }
  });

  const deleteItemOp = useAsyncOperation({
    key: 'store-delete-item',
    showToast: true,
    retryAttempts: 0,
    onSuccess: (result) => {
      // Refresh items after successful delete
      loadItems();
    }
  });

  // Initialize database
  const initialize = useCallback(async () => {
    return initializeOp.execute(asyncActions.initializeDatabase);
  }, [initializeOp]);

  // Load items from database and update store
  const loadItems = useCallback(async () => {
    return loadItemsOp.execute(asyncActions.loadItems);
  }, [loadItemsOp]);

  // Load categories from database and update store
  const loadCategories = useCallback(async () => {
    return loadCategoriesOp.execute(asyncActions.loadCategories);
  }, [loadCategoriesOp]);

  // Load projects from database and update store
  const loadProjects = useCallback(async () => {
    return loadProjectsOp.execute(asyncActions.loadBOQProjects);
  }, [loadProjectsOp]);

  // Load templates from database and update store
  const loadTemplates = useCallback(async (category = null) => {
    return loadTemplatesOp.execute((params) => asyncActions.loadProjectTemplates(category, params));
  }, [loadTemplatesOp]);

  // Add item to database and refresh store
  const addItem = useCallback(async (item) => {
    return addItemOp.execute(
      (params) => asyncActions.addItemToDatabase(item, params),
      {
        successMessage: `Item "${item.name}" added successfully`
      }
    );
  }, [addItemOp]);

  // Update item in database and refresh store
  const updateItem = useCallback(async (itemId, updates) => {
    return updateItemOp.execute(
      (params) => asyncActions.updateItemInDatabase(itemId, updates, params),
      {
        successMessage: `Item "${updates.name || 'item'}" updated successfully`
      }
    );
  }, [updateItemOp]);

  // Delete item from database and refresh store
  const deleteItem = useCallback(async (itemId) => {
    return deleteItemOp.execute(
      (params) => asyncActions.deleteItemFromDatabase(itemId, params),
      {
        successMessage: 'Item deleted successfully'
      }
    );
  }, [deleteItemOp]);

  // Add category to database and refresh store
  const addCategory = useCallback(async (name) => {
    const addCategoryOp = useAsyncOperation({
      key: 'store-add-category',
      showToast: true,
      retryAttempts: 1,
      onSuccess: () => {
        loadCategories();
      }
    });

    return addCategoryOp.execute(
      (params) => asyncActions.addCategoryToDatabase(name, params),
      {
        successMessage: `Category "${name}" added successfully`
      }
    );
  }, [loadCategories]);

  // Update category in database and refresh store
  const updateCategory = useCallback(async (oldName, newName) => {
    const updateCategoryOp = useAsyncOperation({
      key: 'store-update-category',
      showToast: true,
      retryAttempts: 1,
      onSuccess: () => {
        loadCategories();
      }
    });

    return updateCategoryOp.execute(
      (params) => asyncActions.updateCategoryInDatabase(oldName, newName, params),
      {
        successMessage: `Category updated to "${newName}"`
      }
    );
  }, [loadCategories]);

  // Delete category from database and refresh store
  const deleteCategory = useCallback(async (name) => {
    const deleteCategoryOp = useAsyncOperation({
      key: 'store-delete-category',
      showToast: true,
      retryAttempts: 0,
      onSuccess: () => {
        loadCategories();
      }
    });

    return deleteCategoryOp.execute(
      (params) => asyncActions.deleteCategoryFromDatabase(name, params),
      {
        successMessage: `Category "${name}" deleted successfully`
      }
    );
  }, [loadCategories]);

  // Load all data (items, categories, projects, templates)
  const loadAllData = useCallback(async () => {
    try {
      await Promise.all([
        loadItems(),
        loadCategories(),
        loadProjects(),
        loadTemplates()
      ]);
    } catch (error) {
      console.error('Failed to load all data:', error);
      throw error;
    }
  }, [loadItems, loadCategories, loadProjects, loadTemplates]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    initializeOp.clearError();
    loadItemsOp.clearError();
    loadCategoriesOp.clearError();
    loadProjectsOp.clearError();
    loadTemplatesOp.clearError();
    addItemOp.clearError();
    updateItemOp.clearError();
    deleteItemOp.clearError();
  }, [
    initializeOp,
    loadItemsOp,
    loadCategoriesOp,
    loadProjectsOp,
    loadTemplatesOp,
    addItemOp,
    updateItemOp,
    deleteItemOp
  ]);

  // Reset all operations
  const resetAllOperations = useCallback(() => {
    initializeOp.reset();
    loadItemsOp.reset();
    loadCategoriesOp.reset();
    loadProjectsOp.reset();
    loadTemplatesOp.reset();
    addItemOp.reset();
    updateItemOp.reset();
    deleteItemOp.reset();
  }, [
    initializeOp,
    loadItemsOp,
    loadCategoriesOp,
    loadProjectsOp,
    loadTemplatesOp,
    addItemOp,
    updateItemOp,
    deleteItemOp
  ]);

  return {
    // Loading states
    isInitializing: initializeOp.isLoading,
    isLoadingItems: loadItemsOp.isLoading,
    isLoadingCategories: loadCategoriesOp.isLoading,
    isLoadingProjects: loadProjectsOp.isLoading,
    isLoadingTemplates: loadTemplatesOp.isLoading,
    isAddingItem: addItemOp.isLoading,
    isUpdatingItem: updateItemOp.isLoading,
    isDeletingItem: deleteItemOp.isLoading,

    // Error states
    initializeError: initializeOp.error,
    loadItemsError: loadItemsOp.error,
    loadCategoriesError: loadCategoriesOp.error,
    loadProjectsError: loadProjectsOp.error,
    loadTemplatesError: loadTemplatesOp.error,
    addItemError: addItemOp.error,
    updateItemError: updateItemOp.error,
    deleteItemError: deleteItemOp.error,

    // Data states
    itemsData: loadItemsOp.data,
    categoriesData: loadCategoriesOp.data,
    projectsData: loadProjectsOp.data,
    templatesData: loadTemplatesOp.data,

    // Operations
    initialize,
    loadItems,
    loadCategories,
    loadProjects,
    loadTemplates,
    loadAllData,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    updateCategory,
    deleteCategory,

    // Utility methods
    clearAllErrors,
    resetAllOperations,

    // Individual operation objects for advanced usage
    operations: {
      initialize: initializeOp,
      loadItems: loadItemsOp,
      loadCategories: loadCategoriesOp,
      loadProjects: loadProjectsOp,
      loadTemplates: loadTemplatesOp,
      addItem: addItemOp,
      updateItem: updateItemOp,
      deleteItem: deleteItemOp
    }
  };
};

export default useAsyncStoreOperations;
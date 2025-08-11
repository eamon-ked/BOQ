import { useCallback } from 'react';
import databaseService from './database.js';
import { useAsyncOperation } from '../hooks/useAsyncOperation.js';

/**
 * Enhanced database service that uses useAsyncOperation hook for better loading states and error handling
 * This provides a React hook-based interface to the database service
 */
export const useDatabaseOperations = () => {
  // Initialize async operations for different database operations
  const initializeOp = useAsyncOperation({
    key: 'database-initialize',
    persistLoading: true,
    showToast: true,
    retryAttempts: 2,
    retryDelay: 1000
  });

  const categoriesOp = useAsyncOperation({
    key: 'database-categories',
    persistLoading: true,
    showToast: false, // Categories are loaded frequently, don't show toast
    retryAttempts: 1
  });

  const itemsOp = useAsyncOperation({
    key: 'database-items',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1
  });

  const projectsOp = useAsyncOperation({
    key: 'database-projects',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1
  });

  const templatesOp = useAsyncOperation({
    key: 'database-templates',
    persistLoading: true,
    showToast: false,
    retryAttempts: 1
  });

  // Database initialization
  const initialize = useCallback(async () => {
    return initializeOp.execute(async ({ signal }) => {
      return await databaseService.initialize();
    });
  }, [initializeOp]);

  // Category operations
  const getCategories = useCallback(async () => {
    return categoriesOp.execute(async ({ signal }) => {
      return await databaseService.getCategories();
    });
  }, [categoriesOp]);

  const addCategory = useCallback(async (name) => {
    return initializeOp.execute(async ({ signal }) => {
      return await databaseService.addCategory(name);
    }, {
      successMessage: `Category "${name}" added successfully`
    });
  }, [initializeOp]);

  const updateCategory = useCallback(async (oldName, newName) => {
    return initializeOp.execute(async ({ signal }) => {
      return await databaseService.updateCategory(oldName, newName);
    }, {
      successMessage: `Category updated to "${newName}"`
    });
  }, [initializeOp]);

  const deleteCategory = useCallback(async (name) => {
    return initializeOp.execute(async ({ signal }) => {
      return await databaseService.deleteCategory(name);
    }, {
      successMessage: `Category "${name}" deleted successfully`
    });
  }, [initializeOp]);

  // Item operations
  const getItems = useCallback(async () => {
    return itemsOp.execute(async ({ signal }) => {
      return await databaseService.getItems();
    });
  }, [itemsOp]);

  const addItem = useCallback(async (item) => {
    return itemsOp.execute(async ({ signal }) => {
      return await databaseService.addItem(item);
    }, {
      successMessage: `Item "${item.name}" added successfully`
    });
  }, [itemsOp]);

  const updateItem = useCallback(async (itemId, item) => {
    return itemsOp.execute(async ({ signal }) => {
      return await databaseService.updateItem(itemId, item);
    }, {
      successMessage: `Item "${item.name}" updated successfully`
    });
  }, [itemsOp]);

  const deleteItem = useCallback(async (itemId) => {
    return itemsOp.execute(async ({ signal }) => {
      return await databaseService.deleteItem(itemId);
    }, {
      successMessage: 'Item deleted successfully'
    });
  }, [itemsOp]);

  // BOQ Project operations
  const getBOQProjects = useCallback(async () => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.getBOQProjects();
    });
  }, [projectsOp]);

  const createBOQProject = useCallback(async (projectData) => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.createBOQProject(projectData);
    }, {
      successMessage: `Project "${projectData.name || projectData}" created successfully`
    });
  }, [projectsOp]);

  const updateBOQProject = useCallback(async (projectId, projectData) => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.updateBOQProject(projectId, projectData);
    }, {
      successMessage: `Project "${projectData.name || projectData}" updated successfully`
    });
  }, [projectsOp]);

  const deleteBOQProject = useCallback(async (projectId) => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.deleteBOQProject(projectId);
    }, {
      successMessage: 'Project deleted successfully'
    });
  }, [projectsOp]);

  const getBOQItems = useCallback(async (projectId) => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.getBOQItems(projectId);
    });
  }, [projectsOp]);

  const saveBOQItems = useCallback(async (projectId, items) => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.saveBOQItems(projectId, items);
    }, {
      successMessage: 'BOQ items saved successfully'
    });
  }, [projectsOp]);

  // Project Template operations
  const getProjectTemplates = useCallback(async (category = null) => {
    return templatesOp.execute(async ({ signal }) => {
      return await databaseService.getProjectTemplates(category);
    });
  }, [templatesOp]);

  const createProjectTemplate = useCallback(async (templateData) => {
    return templatesOp.execute(async ({ signal }) => {
      return await databaseService.createProjectTemplate(templateData);
    }, {
      successMessage: `Template "${templateData.name}" created successfully`
    });
  }, [templatesOp]);

  const updateProjectTemplate = useCallback(async (templateId, templateData) => {
    return templatesOp.execute(async ({ signal }) => {
      return await databaseService.updateProjectTemplate(templateId, templateData);
    }, {
      successMessage: `Template "${templateData.name}" updated successfully`
    });
  }, [templatesOp]);

  const deleteProjectTemplate = useCallback(async (templateId) => {
    return templatesOp.execute(async ({ signal }) => {
      return await databaseService.deleteProjectTemplate(templateId);
    }, {
      successMessage: 'Template deleted successfully'
    });
  }, [templatesOp]);

  const cloneBOQProject = useCallback(async (sourceProjectId, newProjectData) => {
    return projectsOp.execute(async ({ signal }) => {
      return await databaseService.cloneBOQProject(sourceProjectId, newProjectData);
    }, {
      successMessage: `Project cloned as "${newProjectData.name}"`
    });
  }, [projectsOp]);

  // Database backup/restore
  const exportDatabase = useCallback(async () => {
    return initializeOp.execute(async ({ signal }) => {
      return await databaseService.exportDatabase();
    }, {
      successMessage: 'Database exported successfully'
    });
  }, [initializeOp]);

  const importDatabase = useCallback(async (backupData) => {
    return initializeOp.execute(async ({ signal }) => {
      return await databaseService.importDatabase(backupData);
    }, {
      successMessage: 'Database imported successfully'
    });
  }, [initializeOp]);

  // Utility methods
  const clearErrors = useCallback(() => {
    initializeOp.clearError();
    categoriesOp.clearError();
    itemsOp.clearError();
    projectsOp.clearError();
    templatesOp.clearError();
  }, [initializeOp, categoriesOp, itemsOp, projectsOp, templatesOp]);

  const resetAll = useCallback(() => {
    initializeOp.reset();
    categoriesOp.reset();
    itemsOp.reset();
    projectsOp.reset();
    templatesOp.reset();
  }, [initializeOp, categoriesOp, itemsOp, projectsOp, templatesOp]);

  return {
    // Loading states
    isInitializing: initializeOp.isLoading,
    isCategoriesLoading: categoriesOp.isLoading,
    isItemsLoading: itemsOp.isLoading,
    isProjectsLoading: projectsOp.isLoading,
    isTemplatesLoading: templatesOp.isLoading,

    // Error states
    initializeError: initializeOp.error,
    categoriesError: categoriesOp.error,
    itemsError: itemsOp.error,
    projectsError: projectsOp.error,
    templatesError: templatesOp.error,

    // Data
    categoriesData: categoriesOp.data,
    itemsData: itemsOp.data,
    projectsData: projectsOp.data,
    templatesData: templatesOp.data,

    // Operations
    initialize,
    
    // Category operations
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Item operations
    getItems,
    addItem,
    updateItem,
    deleteItem,
    
    // Project operations
    getBOQProjects,
    createBOQProject,
    updateBOQProject,
    deleteBOQProject,
    getBOQItems,
    saveBOQItems,
    
    // Template operations
    getProjectTemplates,
    createProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    cloneBOQProject,
    
    // Backup operations
    exportDatabase,
    importDatabase,

    // Utility methods
    clearErrors,
    resetAll
  };
};

export default useDatabaseOperations;
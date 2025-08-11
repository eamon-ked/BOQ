import databaseService from '../services/database.js';
import toast from 'react-hot-toast';

/**
 * Enhanced store actions that can be used with useAsyncOperation hook
 * These functions return promises and can be wrapped with the async operation hook
 */

/**
 * Initialize database connection
 */
export const initializeDatabase = async ({ signal } = {}) => {
  try {
    await databaseService.initialize();
    return { success: true };
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

/**
 * Load all items from database
 */
export const loadItems = async ({ signal } = {}) => {
  try {
    const items = await databaseService.getItems();
    return items;
  } catch (error) {
    console.error('Failed to load items:', error);
    throw error;
  }
};

/**
 * Load all categories from database
 */
export const loadCategories = async ({ signal } = {}) => {
  try {
    const categories = await databaseService.getCategories();
    return categories;
  } catch (error) {
    console.error('Failed to load categories:', error);
    throw error;
  }
};

/**
 * Add a new item to database
 */
export const addItemToDatabase = async (item, { signal } = {}) => {
  try {
    const result = await databaseService.addItem(item);
    return { success: true, item, result };
  } catch (error) {
    console.error('Failed to add item:', error);
    throw error;
  }
};

/**
 * Update an existing item in database
 */
export const updateItemInDatabase = async (itemId, updates, { signal } = {}) => {
  try {
    const result = await databaseService.updateItem(itemId, updates);
    return { success: true, itemId, updates, result };
  } catch (error) {
    console.error('Failed to update item:', error);
    throw error;
  }
};

/**
 * Delete an item from database
 */
export const deleteItemFromDatabase = async (itemId, { signal } = {}) => {
  try {
    const result = await databaseService.deleteItem(itemId);
    return { success: true, itemId, result };
  } catch (error) {
    console.error('Failed to delete item:', error);
    throw error;
  }
};

/**
 * Load all BOQ projects from database
 */
export const loadBOQProjects = async ({ signal } = {}) => {
  try {
    const projects = await databaseService.getBOQProjects();
    return projects;
  } catch (error) {
    console.error('Failed to load BOQ projects:', error);
    throw error;
  }
};

/**
 * Create a new BOQ project
 */
export const createBOQProjectInDatabase = async (projectData, { signal } = {}) => {
  try {
    const result = await databaseService.createBOQProject(projectData);
    return { success: true, projectData, result };
  } catch (error) {
    console.error('Failed to create BOQ project:', error);
    throw error;
  }
};

/**
 * Update an existing BOQ project
 */
export const updateBOQProjectInDatabase = async (projectId, projectData, { signal } = {}) => {
  try {
    const result = await databaseService.updateBOQProject(projectId, projectData);
    return { success: true, projectId, projectData, result };
  } catch (error) {
    console.error('Failed to update BOQ project:', error);
    throw error;
  }
};

/**
 * Delete a BOQ project
 */
export const deleteBOQProjectFromDatabase = async (projectId, { signal } = {}) => {
  try {
    const result = await databaseService.deleteBOQProject(projectId);
    return { success: true, projectId, result };
  } catch (error) {
    console.error('Failed to delete BOQ project:', error);
    throw error;
  }
};

/**
 * Load BOQ items for a specific project
 */
export const loadBOQItems = async (projectId, { signal } = {}) => {
  try {
    const items = await databaseService.getBOQItems(projectId);
    return items;
  } catch (error) {
    console.error('Failed to load BOQ items:', error);
    throw error;
  }
};

/**
 * Save BOQ items for a specific project
 */
export const saveBOQItemsToDatabase = async (projectId, items, { signal } = {}) => {
  try {
    const result = await databaseService.saveBOQItems(projectId, items);
    return { success: true, projectId, items, result };
  } catch (error) {
    console.error('Failed to save BOQ items:', error);
    throw error;
  }
};

/**
 * Load project templates
 */
export const loadProjectTemplates = async (category = null, { signal } = {}) => {
  try {
    const templates = await databaseService.getProjectTemplates(category);
    return templates;
  } catch (error) {
    console.error('Failed to load project templates:', error);
    throw error;
  }
};

/**
 * Create a new project template
 */
export const createProjectTemplateInDatabase = async (templateData, { signal } = {}) => {
  try {
    const result = await databaseService.createProjectTemplate(templateData);
    return { success: true, templateData, result };
  } catch (error) {
    console.error('Failed to create project template:', error);
    throw error;
  }
};

/**
 * Clone a BOQ project
 */
export const cloneBOQProjectInDatabase = async (sourceProjectId, newProjectData, { signal } = {}) => {
  try {
    const result = await databaseService.cloneBOQProject(sourceProjectId, newProjectData);
    return { success: true, sourceProjectId, newProjectData, result };
  } catch (error) {
    console.error('Failed to clone BOQ project:', error);
    throw error;
  }
};

/**
 * Export database
 */
export const exportDatabaseData = async ({ signal } = {}) => {
  try {
    const data = await databaseService.exportDatabase();
    return data;
  } catch (error) {
    console.error('Failed to export database:', error);
    throw error;
  }
};

/**
 * Import database
 */
export const importDatabaseData = async (backupData, { signal } = {}) => {
  try {
    const result = await databaseService.importDatabase(backupData);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to import database:', error);
    throw error;
  }
};

/**
 * Add a new category to database
 */
export const addCategoryToDatabase = async (name, { signal } = {}) => {
  try {
    const result = await databaseService.addCategory(name);
    return { success: true, name, result };
  } catch (error) {
    console.error('Failed to add category:', error);
    throw error;
  }
};

/**
 * Update an existing category in database
 */
export const updateCategoryInDatabase = async (oldName, newName, { signal } = {}) => {
  try {
    const result = await databaseService.updateCategory(oldName, newName);
    return { success: true, oldName, newName, result };
  } catch (error) {
    console.error('Failed to update category:', error);
    throw error;
  }
};

/**
 * Delete a category from database
 */
export const deleteCategoryFromDatabase = async (name, { signal } = {}) => {
  try {
    const result = await databaseService.deleteCategory(name);
    return { success: true, name, result };
  } catch (error) {
    console.error('Failed to delete category:', error);
    throw error;
  }
};

export default {
  initializeDatabase,
  loadItems,
  loadCategories,
  addItemToDatabase,
  updateItemInDatabase,
  deleteItemFromDatabase,
  loadBOQProjects,
  createBOQProjectInDatabase,
  updateBOQProjectInDatabase,
  deleteBOQProjectFromDatabase,
  loadBOQItems,
  saveBOQItemsToDatabase,
  loadProjectTemplates,
  createProjectTemplateInDatabase,
  cloneBOQProjectInDatabase,
  exportDatabaseData,
  importDatabaseData,
  addCategoryToDatabase,
  updateCategoryInDatabase,
  deleteCategoryFromDatabase
};
import toast from 'react-hot-toast';

// API client for better-sqlite3 backend
class DatabaseService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Test connection to backend
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) {
        throw new Error('Backend server is not running');
      }

      this.isInitialized = true;
      console.log('Database connection initialized successfully');
      toast.success('Database connected successfully', {
        duration: 2000,
        icon: '🔗',
      });
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      toast.error('Failed to connect to database. Please start the server.', {
        duration: 6000,
        icon: '🔌',
      });
      throw new Error('Backend server is not running. Please start the server with: node server/server.js');
    }
  }

  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Categories methods
  async getCategories() {
    const response = await this.apiCall('/categories');
    return response.data;
  }

  async addCategory(name) {
    try {
      await this.apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return true;
    } catch (error) {
      console.error('Failed to add category:', error);
      // Re-throw the error so the UI can handle it properly
      throw error;
    }
  }

  async updateCategory(oldName, newName) {
    try {
      await this.apiCall(`/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        body: JSON.stringify({ newName }),
      });
      return true;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  async deleteCategory(name) {
    try {
      await this.apiCall(`/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  // Items methods
  async getItems() {
    const response = await this.apiCall('/items');
    return response.data;
  }

  async addItem(item) {
    try {
      await this.apiCall('/items', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      return true;
    } catch (error) {
      console.error('Failed to add item:', error);
      throw error;
    }
  }

  async updateItem(itemId, item) {
    try {
      await this.apiCall(`/items/${encodeURIComponent(itemId)}`, {
        method: 'PUT',
        body: JSON.stringify(item),
      });
      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  }

  async deleteItem(itemId) {
    try {
      await this.apiCall(`/items/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      return false;
    }
  }

  // BOQ Projects methods
  async getBOQProjects() {
    const response = await this.apiCall('/boq-projects');
    return response.data;
  }

  async createBOQProject(projectData) {
    try {
      // Support both old and new API formats
      const payload = typeof projectData === 'string' 
        ? { name: projectData, description: arguments[1] || '' }
        : projectData;

      const response = await this.apiCall('/boq-projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, projectId: response.projectId };
    } catch (error) {
      console.error('Failed to create BOQ project:', error);
      throw error;
    }
  }

  async updateBOQProject(projectId, projectData) {
    try {
      // Support both old and new API formats
      const payload = typeof projectData === 'string' 
        ? { name: projectData, description: arguments[2] || '' }
        : projectData;

      await this.apiCall(`/boq-projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (error) {
      console.error('Failed to update BOQ project:', error);
      throw error;
    }
  }

  async deleteBOQProject(projectId) {
    try {
      await this.apiCall(`/boq-projects/${projectId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete BOQ project:', error);
      throw error;
    }
  }

  async getBOQItems(projectId) {
    const response = await this.apiCall(`/boq-projects/${projectId}/items`);
    return response.data;
  }

  async saveBOQItems(projectId, items) {
    try {
      await this.apiCall(`/boq-projects/${projectId}/items`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      return true;
    } catch (error) {
      console.error('Failed to save BOQ items:', error);
      throw error;
    }
  }

  // Project Templates methods
  async getProjectTemplates(category = null) {
    try {
      const endpoint = category ? `/project-templates?category=${encodeURIComponent(category)}` : '/project-templates';
      const response = await this.apiCall(endpoint);
      return response.data;
    } catch (error) {
      console.error('Failed to get project templates:', error);
      throw error;
    }
  }

  async createProjectTemplate(templateData) {
    try {
      const response = await this.apiCall('/project-templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      return { success: true, projectId: response.projectId };
    } catch (error) {
      console.error('Failed to create project template:', error);
      throw error;
    }
  }

  async updateProjectTemplate(templateId, templateData) {
    try {
      await this.apiCall(`/project-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to update project template:', error);
      throw error;
    }
  }

  async deleteProjectTemplate(templateId) {
    try {
      await this.apiCall(`/project-templates/${templateId}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to delete project template:', error);
      throw error;
    }
  }

  async cloneBOQProject(sourceProjectId, newProjectData) {
    try {
      const response = await this.apiCall(`/boq-projects/${sourceProjectId}/clone`, {
        method: 'POST',
        body: JSON.stringify(newProjectData),
      });
      return { success: true, projectId: response.projectId };
    } catch (error) {
      console.error('Failed to clone BOQ project:', error);
      throw error;
    }
  }

  // Database backup/restore
  async exportDatabase() {
    try {
      const response = await fetch(`${this.baseURL}/database/backup`);
      if (!response.ok) {
        throw new Error('Failed to export database');
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to export database:', error);
      return null;
    }
  }

  async importDatabase(backupData) {
    try {
      await this.apiCall('/database/restore', {
        method: 'POST',
        body: JSON.stringify({ backupData }),
      });
      return true;
    } catch (error) {
      console.error('Failed to import database:', error);
      return false;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
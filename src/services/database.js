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
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
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
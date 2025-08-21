const express = require('express');
const cors = require('cors');
const DatabaseService = require('./database');

const app = express();
const port = process.env.PORT || 3001;

// Initialize database
const db = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json());

// Error handler middleware
const handleError = (res, error) => {
  console.error('API Error:', error);
  res.status(500).json({ success: false, error: error.message });
};

// Categories routes
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    
    const result = db.addCategory(name);
    if (result.success) {
      res.json({ success: true, message: 'Category added successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/api/categories/:oldName', (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({ success: false, error: 'New category name is required' });
    }
    
    const result = db.updateCategory(oldName, newName);
    if (result.success) {
      res.json({ success: true, message: 'Category updated successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/api/categories/:name', (req, res) => {
  try {
    const { name } = req.params;
    const result = db.deleteCategory(name);
    
    if (result.success) {
      res.json({ success: true, message: 'Category deleted successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Items routes
app.get('/api/items', (req, res) => {
  try {
    const items = db.getItems();
    res.json({ success: true, data: items });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/items', (req, res) => {
  try {
    const item = req.body;
    
    // Validate required fields
    if (!item.id || !item.name || !item.category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item ID, name, and category are required' 
      });
    }
    
    const result = db.addItem(item);
    if (result.success) {
      res.json({ success: true, message: 'Item added successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    
    // Validate required fields
    if (!item.name || !item.category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item name and category are required' 
      });
    }
    
    const result = db.updateItem(id, item);
    if (result.success) {
      res.json({ success: true, message: 'Item updated successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.deleteItem(id);
    
    if (result.success) {
      res.json({ success: true, message: 'Item deleted successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Bulk import items
app.post('/api/items/import', (req, res) => {
  console.log("Received import request:", req.body);
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Items array is required' });
    }
    const results = [];
    for (const item of items) {
      if (!item.name || !item.category) {
        results.push({ success: false, error: 'Missing name or category', item });
        continue;
      }
      // Generate ID if missing
      if (!item.id) {
        const cleanName = item.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 20);
        const cleanCategory = item.category.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 10);
        const timestamp = Date.now().toString().slice(-4);
        item.id = `${cleanCategory}-${cleanName}-${timestamp}`;
      }
      const result = db.addItem(item);
      results.push(result);
    }
    res.json({ success: true, results });
  } catch (error) {
    handleError(res, error);
  }
});

// BOQ Projects routes
app.get('/api/boq-projects', (req, res) => {
  try {
    const projects = db.getBOQProjects();
    res.json({ success: true, data: projects });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/boq-projects', (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }
    
    const result = db.createBOQProject(name, description);
    if (result.success) {
      res.json({ success: true, projectId: result.projectId });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/api/boq-projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }
    
    const result = db.updateBOQProject(id, name, description);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/api/boq-projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.deleteBOQProject(id);
    
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// BOQ Items routes
app.get('/api/boq-projects/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const items = db.getBOQItems(id);
    res.json({ success: true, data: items });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/boq-projects/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Items array is required' });
    }
    
    const result = db.saveBOQItems(id, items);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Database backup/restore routes
app.get('/api/database/backup', (req, res) => {
  try {
    const result = db.backup();
    if (result.success) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="boq_backup_${new Date().toISOString().split('T')[0]}.db"`);
      res.send(result.data);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/database/restore', (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ success: false, error: 'Backup data is required' });
    }
    
    const result = db.restore(backupData);
    if (result.success) {
      res.json({ success: true, message: 'Database restored successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Base API route
app.get('/api', (req, res) => {
  res.json({ 
    success: true, 
    message: 'BOQ API Server', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      items: '/api/items',
      backup: '/api/database/backup',
      restore: '/api/database/restore'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Performance monitoring endpoints
app.get('/api/performance/stats', (req, res) => {
  try {
    const stats = db.getQueryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/performance/reset', (req, res) => {
  try {
    db.resetQueryStats();
    res.json({ success: true, message: 'Query statistics reset' });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/performance/optimize', (req, res) => {
  try {
    db.optimizeConnection();
    res.json({ success: true, message: 'Database connection optimized' });
  } catch (error) {
    handleError(res, error);
  }
});

// Enhanced search endpoint
app.get('/api/items/search', (req, res) => {
  try {
    const { 
      q: searchTerm, 
      category, 
      minPrice, 
      maxPrice, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    const priceRange = (minPrice !== undefined && maxPrice !== undefined) 
      ? [parseFloat(minPrice), parseFloat(maxPrice)] 
      : null;
    
    const items = db.searchItems(
      searchTerm, 
      category, 
      priceRange, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({ success: true, data: items });
  } catch (error) {
    handleError(res, error);
  }
});

// Category-specific items endpoint
app.get('/api/categories/:category/items', (req, res) => {
  try {
    const { category } = req.params;
    const items = db.getItemsByCategory(category);
    res.json({ success: true, data: items });
  } catch (error) {
    handleError(res, error);
  }
});

// Project Templates routes
app.get('/api/project-templates', (req, res) => {
  try {
    const { category } = req.query;
    const templates = db.getProjectTemplates(category);
    res.json({ success: true, data: templates });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/project-templates', (req, res) => {
  try {
    const templateData = req.body;
    const result = db.createProjectTemplate(templateData);
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/api/project-templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    const result = db.updateProjectTemplate(parseInt(id), templateData);
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/api/project-templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.deleteProjectTemplate(parseInt(id));
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Clone BOQ Project (used for template application)
app.post('/api/boq-projects/:id/clone', (req, res) => {
  try {
    const { id } = req.params;
    const cloneData = req.body;
    const result = db.cloneBOQProject(parseInt(id), cloneData);
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Clear database endpoint
app.post('/api/database/clear', (req, res) => {
  try {
    const result = db.clearDatabase();
    if (result.success) {
      res.json({ success: true, message: 'Database cleared successfully' });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`BOQ Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
});
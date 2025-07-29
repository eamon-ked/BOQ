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
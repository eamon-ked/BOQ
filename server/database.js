const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    // Create database file in server directory
    const dbPath = path.join(__dirname, 'boq.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.initializeTables();
    this.seedInitialData();
  }

  initializeTables() {
    // Create categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        manufacturer TEXT,
        unit TEXT NOT NULL DEFAULT 'pcs',
        unit_price REAL NOT NULL DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category) REFERENCES categories(name)
      )
    `);

    // Create dependencies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        dependency_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (dependency_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE(item_id, dependency_id)
      )
    `);

    // Create BOQ projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS boq_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create BOQ items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS boq_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        is_dependency BOOLEAN DEFAULT FALSE,
        required_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES boq_projects(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (required_by) REFERENCES items(id)
      )
    `);

    console.log('Database tables initialized');
  }

  seedInitialData() {
    // Check if data already exists
    const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (categoryCount.count > 0) {
      return; // Data already seeded
    }

    // Insert initial categories
    const insertCategory = this.db.prepare('INSERT INTO categories (name) VALUES (?)');
    const categories = [
      'CCTV', 'Access Control', 'PAVA', 'Cabling', 'Network', 
      'Power', 'Storage', 'Accessories'
    ];

    const insertCategories = this.db.transaction((categories) => {
      for (const category of categories) {
        insertCategory.run(category);
      }
    });

    insertCategories(categories);

    // Insert initial items
    const insertItem = this.db.prepare(`
      INSERT INTO items (id, name, category, manufacturer, unit, unit_price, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const items = [
      {
        id: 'cam-dome-2mp',
        name: 'Dome Camera 2MP',
        category: 'CCTV',
        manufacturer: 'Hikvision',
        unit: 'pcs',
        unit_price: 150,
        description: 'Indoor/Outdoor dome camera with night vision'
      },
      {
        id: 'cam-bullet-4mp',
        name: 'Bullet Camera 4MP',
        category: 'CCTV',
        manufacturer: 'Dahua',
        unit: 'pcs',
        unit_price: 200,
        description: 'Outdoor bullet camera with IR illumination'
      },
      {
        id: 'nvr-16ch',
        name: 'NVR 16 Channel',
        category: 'CCTV',
        manufacturer: 'Hikvision',
        unit: 'pcs',
        unit_price: 800,
        description: '16 channel network video recorder'
      },
      {
        id: 'cat6-cable',
        name: 'CAT6 Cable',
        category: 'Cabling',
        manufacturer: 'Belden',
        unit: 'meters',
        unit_price: 2.5,
        description: 'Category 6 ethernet cable'
      },
      {
        id: 'rj45-connector',
        name: 'RJ45 Connector',
        category: 'Network',
        manufacturer: 'Panduit',
        unit: 'pcs',
        unit_price: 1.5,
        description: 'CAT6 RJ45 connector'
      },
      {
        id: 'network-switch-24p',
        name: 'Network Switch 24 Port',
        category: 'Network',
        manufacturer: 'Cisco',
        unit: 'pcs',
        unit_price: 300,
        description: '24 port managed switch'
      },
      {
        id: 'power-adapter-12v',
        name: 'Power Adapter 12V 2A',
        category: 'Power',
        manufacturer: 'Mean Well',
        unit: 'pcs',
        unit_price: 25,
        description: '12V 2A power adapter'
      },
      {
        id: 'camera-bracket',
        name: 'Camera Mounting Bracket',
        category: 'Accessories',
        manufacturer: 'Generic',
        unit: 'pcs',
        unit_price: 15,
        description: 'Universal camera mounting bracket'
      },
      {
        id: 'hdd-2tb',
        name: 'Hard Drive 2TB',
        category: 'Storage',
        manufacturer: 'Western Digital',
        unit: 'pcs',
        unit_price: 120,
        description: '2TB surveillance hard drive'
      },
      {
        id: 'power-cord',
        name: 'Power Cord',
        category: 'Power',
        manufacturer: 'Generic',
        unit: 'pcs',
        unit_price: 8,
        description: 'Standard power cord'
      },
      {
        id: 'card-reader',
        name: 'RFID Card Reader',
        category: 'Access Control',
        manufacturer: 'HID Global',
        unit: 'pcs',
        unit_price: 180,
        description: 'Proximity card reader'
      },
      {
        id: 'access-controller',
        name: 'Access Control Panel',
        category: 'Access Control',
        manufacturer: 'Honeywell',
        unit: 'pcs',
        unit_price: 450,
        description: '4-door access control panel'
      },
      {
        id: 'speaker-ceiling',
        name: 'Ceiling Speaker 6W',
        category: 'PAVA',
        manufacturer: 'Bosch',
        unit: 'pcs',
        unit_price: 85,
        description: 'Fire-rated ceiling speaker'
      },
      {
        id: 'pava-amplifier',
        name: 'PAVA Amplifier 240W',
        category: 'PAVA',
        manufacturer: 'Bosch',
        unit: 'pcs',
        unit_price: 1200,
        description: 'Public address amplifier'
      },
      {
        id: 'speaker-cable',
        name: 'Speaker Cable 2x1.5mm',
        category: 'Cabling',
        manufacturer: 'Draka',
        unit: 'meters',
        unit_price: 3.2,
        description: 'Fire-rated speaker cable'
      }
    ];

    const insertItems = this.db.transaction((items) => {
      for (const item of items) {
        insertItem.run(item.id, item.name, item.category, item.manufacturer, item.unit, item.unit_price, item.description);
      }
    });

    insertItems(items);

    // Insert initial dependencies
    const insertDependency = this.db.prepare(`
      INSERT INTO dependencies (item_id, dependency_id, quantity) 
      VALUES (?, ?, ?)
    `);

    const dependencies = [
      { item_id: 'cam-dome-2mp', dependency_id: 'rj45-connector', quantity: 1 },
      { item_id: 'cam-dome-2mp', dependency_id: 'camera-bracket', quantity: 1 },
      { item_id: 'cam-dome-2mp', dependency_id: 'power-adapter-12v', quantity: 1 },
      { item_id: 'cam-bullet-4mp', dependency_id: 'rj45-connector', quantity: 1 },
      { item_id: 'cam-bullet-4mp', dependency_id: 'camera-bracket', quantity: 1 },
      { item_id: 'cam-bullet-4mp', dependency_id: 'power-adapter-12v', quantity: 1 },
      { item_id: 'nvr-16ch', dependency_id: 'hdd-2tb', quantity: 1 },
      { item_id: 'nvr-16ch', dependency_id: 'power-cord', quantity: 1 },
      { item_id: 'network-switch-24p', dependency_id: 'power-cord', quantity: 1 },
      { item_id: 'card-reader', dependency_id: 'cat6-cable', quantity: 10 },
      { item_id: 'card-reader', dependency_id: 'power-adapter-12v', quantity: 1 },
      { item_id: 'access-controller', dependency_id: 'power-adapter-12v', quantity: 1 },
      { item_id: 'speaker-ceiling', dependency_id: 'speaker-cable', quantity: 20 },
      { item_id: 'pava-amplifier', dependency_id: 'power-cord', quantity: 1 }
    ];

    const insertDependencies = this.db.transaction((dependencies) => {
      for (const dep of dependencies) {
        insertDependency.run(dep.item_id, dep.dependency_id, dep.quantity);
      }
    });

    insertDependencies(dependencies);

    console.log('Initial data seeded');
  }

  // Categories methods
  getCategories() {
    const stmt = this.db.prepare('SELECT name FROM categories ORDER BY name');
    return stmt.all().map(row => row.name);
  }

  addCategory(name) {
    try {
      const stmt = this.db.prepare('INSERT INTO categories (name) VALUES (?)');
      stmt.run(name);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateCategory(oldName, newName) {
    const transaction = this.db.transaction(() => {
      const updateCategory = this.db.prepare('UPDATE categories SET name = ? WHERE name = ?');
      const updateItems = this.db.prepare('UPDATE items SET category = ? WHERE category = ?');
      
      updateCategory.run(newName, oldName);
      updateItems.run(newName, oldName);
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteCategory(name) {
    try {
      // Check if category is in use
      const itemCount = this.db.prepare('SELECT COUNT(*) as count FROM items WHERE category = ?').get(name);
      if (itemCount.count > 0) {
        throw new Error(`Cannot delete category "${name}" because ${itemCount.count} items are using it.`);
      }

      const stmt = this.db.prepare('DELETE FROM categories WHERE name = ?');
      stmt.run(name);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Items methods
  getItems() {
    const stmt = this.db.prepare(`
      SELECT i.*, 
             GROUP_CONCAT(d.dependency_id || ':' || d.quantity) as dependencies_str
      FROM items i
      LEFT JOIN dependencies d ON i.id = d.item_id
      GROUP BY i.id
      ORDER BY i.name
    `);
    
    const items = stmt.all().map(row => {
      const item = {
        id: row.id,
        name: row.name,
        category: row.category,
        manufacturer: row.manufacturer,
        unit: row.unit,
        unitPrice: row.unit_price,
        description: row.description,
        dependencies: []
      };

      if (row.dependencies_str) {
        item.dependencies = row.dependencies_str.split(',').map(dep => {
          const [itemId, quantity] = dep.split(':');
          return { itemId, quantity: parseInt(quantity) };
        });
      }

      return item;
    });

    return items;
  }

  addItem(item) {
    const transaction = this.db.transaction(() => {
      // Insert item
      const insertItem = this.db.prepare(`
        INSERT INTO items (id, name, category, manufacturer, unit, unit_price, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertItem.run(item.id, item.name, item.category, item.manufacturer, item.unit, item.unitPrice, item.description);

      // Insert dependencies
      if (item.dependencies && item.dependencies.length > 0) {
        const insertDep = this.db.prepare(`
          INSERT INTO dependencies (item_id, dependency_id, quantity) 
          VALUES (?, ?, ?)
        `);
        
        for (const dep of item.dependencies) {
          insertDep.run(item.id, dep.itemId, dep.quantity);
        }
      }
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateItem(itemId, item) {
    const transaction = this.db.transaction(() => {
      // Update item
      const updateItem = this.db.prepare(`
        UPDATE items 
        SET name = ?, category = ?, manufacturer = ?, unit = ?, unit_price = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateItem.run(item.name, item.category, item.manufacturer, item.unit, item.unitPrice, item.description, itemId);

      // Delete existing dependencies
      const deleteDeps = this.db.prepare('DELETE FROM dependencies WHERE item_id = ?');
      deleteDeps.run(itemId);

      // Insert new dependencies
      if (item.dependencies && item.dependencies.length > 0) {
        const insertDep = this.db.prepare(`
          INSERT INTO dependencies (item_id, dependency_id, quantity) 
          VALUES (?, ?, ?)
        `);
        
        for (const dep of item.dependencies) {
          insertDep.run(itemId, dep.itemId, dep.quantity);
        }
      }
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteItem(itemId) {
    const transaction = this.db.transaction(() => {
      // Delete dependencies where this item is a dependency
      const deleteDepsAsChild = this.db.prepare('DELETE FROM dependencies WHERE dependency_id = ?');
      deleteDepsAsChild.run(itemId);
      
      // Delete dependencies of this item
      const deleteDepsAsParent = this.db.prepare('DELETE FROM dependencies WHERE item_id = ?');
      deleteDepsAsParent.run(itemId);
      
      // Delete the item
      const deleteItem = this.db.prepare('DELETE FROM items WHERE id = ?');
      deleteItem.run(itemId);
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Database backup/restore
  backup() {
    try {
      const backup = this.db.backup();
      return { success: true, data: backup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  restore(backupData) {
    try {
      this.db.restore(backupData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
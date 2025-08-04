const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    let dbPath;
    try {
      // Try to use Electron's userData path if available
      const electron = require('electron');
      const userData = (electron.app || electron.remote.app).getPath('userData');
      dbPath = path.join(userData, 'boq.db');
    } catch (e) {
      // Fallback for dev/server mode
      dbPath = path.join(__dirname, 'boq.db');
    }
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

    // Create items table with enhanced BOQ fields
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        manufacturer TEXT,
        part_number TEXT,
        unit TEXT NOT NULL DEFAULT 'pcs',
        unit_price REAL NOT NULL DEFAULT 0,
        unit_net_price REAL,
        service_duration INTEGER DEFAULT 0,
        estimated_lead_time INTEGER DEFAULT 0,
        pricing_term TEXT DEFAULT 'Each',
        discount REAL DEFAULT 0,
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
      INSERT INTO items (id, name, category, manufacturer, part_number, unit, unit_price, unit_net_price, service_duration, estimated_lead_time, pricing_term, discount, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const items = [
      {
        id: 'cam-dome-2mp',
        name: 'Dome Camera 2MP',
        category: 'CCTV',
        manufacturer: 'Hikvision',
        part_number: 'DS-2CD2123G0-I',
        unit: 'pcs',
        unit_price: 150,
        unit_net_price: 135,
        service_duration: 36,
        estimated_lead_time: 14,
        pricing_term: 'Each',
        discount: 10,
        description: 'Indoor/Outdoor dome camera with night vision'
      },
      {
        id: 'cam-bullet-4mp',
        name: 'Bullet Camera 4MP',
        category: 'CCTV',
        manufacturer: 'Dahua',
        part_number: 'IPC-HFW4431T-ASE',
        unit: 'pcs',
        unit_price: 200,
        unit_net_price: 180,
        service_duration: 36,
        estimated_lead_time: 10,
        pricing_term: 'Each',
        discount: 10,
        description: 'Outdoor bullet camera with IR illumination'
      },
      {
        id: 'nvr-16ch',
        name: 'NVR 16 Channel',
        category: 'CCTV',
        manufacturer: 'Hikvision',
        part_number: 'DS-7616NI-K2/16P',
        unit: 'pcs',
        unit_price: 800,
        unit_net_price: 720,
        service_duration: 60,
        estimated_lead_time: 21,
        pricing_term: 'Each',
        discount: 10,
        description: '16 channel network video recorder'
      },
      {
        id: 'cat6-cable',
        name: 'CAT6 Cable',
        category: 'Cabling',
        manufacturer: 'Belden',
        part_number: '2413-006-1000',
        unit: 'meters',
        unit_price: 2.5,
        unit_net_price: 2.25,
        service_duration: 300,
        estimated_lead_time: 7,
        pricing_term: 'Per Meter',
        discount: 10,
        description: 'Category 6 ethernet cable'
      },
      {
        id: 'rj45-connector',
        name: 'RJ45 Connector',
        category: 'Network',
        manufacturer: 'Panduit',
        part_number: 'CJ688TGBU',
        unit: 'pcs',
        unit_price: 1.5,
        unit_net_price: 1.35,
        service_duration: 120,
        estimated_lead_time: 5,
        pricing_term: 'Each',
        discount: 10,
        description: 'CAT6 RJ45 connector'
      },
      {
        id: 'network-switch-24p',
        name: 'Network Switch 24 Port',
        category: 'Network',
        manufacturer: 'Cisco',
        part_number: 'SG350-28P-K9',
        unit: 'pcs',
        unit_price: 300,
        unit_net_price: 270,
        service_duration: 60,
        estimated_lead_time: 14,
        pricing_term: 'Each',
        discount: 10,
        description: '24 port managed switch'
      },
      {
        id: 'power-adapter-12v',
        name: 'Power Adapter 12V 2A',
        category: 'Power',
        manufacturer: 'Mean Well',
        part_number: 'GST25A12-P1J',
        unit: 'pcs',
        unit_price: 25,
        unit_net_price: 22.5,
        service_duration: 36,
        estimated_lead_time: 7,
        pricing_term: 'Each',
        discount: 10,
        description: '12V 2A power adapter'
      },
      {
        id: 'camera-bracket',
        name: 'Camera Mounting Bracket',
        category: 'Accessories',
        manufacturer: 'Generic',
        part_number: 'CMB-001',
        unit: 'pcs',
        unit_price: 15,
        unit_net_price: 13.5,
        service_duration: 60,
        estimated_lead_time: 3,
        pricing_term: 'Each',
        discount: 10,
        description: 'Universal camera mounting bracket'
      },
      {
        id: 'hdd-2tb',
        name: 'Hard Drive 2TB',
        category: 'Storage',
        manufacturer: 'Western Digital',
        part_number: 'WD20PURZ',
        unit: 'pcs',
        unit_price: 120,
        unit_net_price: 108,
        service_duration: 36,
        estimated_lead_time: 10,
        pricing_term: 'Each',
        discount: 10,
        description: '2TB surveillance hard drive'
      },
      {
        id: 'power-cord',
        name: 'Power Cord',
        category: 'Power',
        manufacturer: 'Generic',
        part_number: 'PC-STD-001',
        unit: 'pcs',
        unit_price: 8,
        unit_net_price: 7.2,
        service_duration: 120,
        estimated_lead_time: 2,
        pricing_term: 'Each',
        discount: 10,
        description: 'Standard power cord'
      },
      {
        id: 'card-reader',
        name: 'RFID Card Reader',
        category: 'Access Control',
        manufacturer: 'HID Global',
        part_number: 'HID-5355AGK00',
        unit: 'pcs',
        unit_price: 180,
        unit_net_price: 162,
        service_duration: 60,
        estimated_lead_time: 14,
        pricing_term: 'Each',
        discount: 10,
        description: 'Proximity card reader'
      },
      {
        id: 'access-controller',
        name: 'Access Control Panel',
        category: 'Access Control',
        manufacturer: 'Honeywell',
        part_number: 'WIN-PAK-SE',
        unit: 'pcs',
        unit_price: 450,
        unit_net_price: 405,
        service_duration: 60,
        estimated_lead_time: 21,
        pricing_term: 'Each',
        discount: 10,
        description: '4-door access control panel'
      },
      {
        id: 'speaker-ceiling',
        name: 'Ceiling Speaker 6W',
        category: 'PAVA',
        manufacturer: 'Bosch',
        part_number: 'LBC3099/41',
        unit: 'pcs',
        unit_price: 85,
        unit_net_price: 76.5,
        service_duration: 120,
        estimated_lead_time: 10,
        pricing_term: 'Each',
        discount: 10,
        description: 'Fire-rated ceiling speaker'
      },
      {
        id: 'pava-amplifier',
        name: 'PAVA Amplifier 240W',
        category: 'PAVA',
        manufacturer: 'Bosch',
        part_number: 'PLE-2MA240-EU',
        unit: 'pcs',
        unit_price: 1200,
        unit_net_price: 1080,
        service_duration: 60,
        estimated_lead_time: 28,
        pricing_term: 'Each',
        discount: 10,
        description: 'Public address amplifier'
      },
      {
        id: 'speaker-cable',
        name: 'Speaker Cable 2x1.5mm',
        category: 'Cabling',
        manufacturer: 'Draka',
        part_number: 'UC900-HS23',
        unit: 'meters',
        unit_price: 3.2,
        unit_net_price: 2.88,
        service_duration: 300,
        estimated_lead_time: 7,
        pricing_term: 'Per Meter',
        discount: 10,
        description: 'Fire-rated speaker cable'
      }
    ];

    const insertItems = this.db.transaction((items) => {
      for (const item of items) {
        insertItem.run(
          item.id, 
          item.name, 
          item.category, 
          item.manufacturer, 
          item.part_number,
          item.unit, 
          item.unit_price, 
          item.unit_net_price,
          item.service_duration,
          item.estimated_lead_time,
          item.pricing_term,
          item.discount,
          item.description
        );
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
        partNumber: row.part_number,
        unit: row.unit,
        unitPrice: row.unit_price,
        unitNetPrice: row.unit_net_price,
        serviceDuration: row.service_duration,
        estimatedLeadTime: row.estimated_lead_time,
        pricingTerm: row.pricing_term,
        discount: row.discount,
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
        INSERT INTO items (id, name, category, manufacturer, part_number, unit, unit_price, unit_net_price, service_duration, estimated_lead_time, pricing_term, discount, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertItem.run(
        item.id, 
        item.name, 
        item.category, 
        item.manufacturer, 
        item.partNumber || '',
        item.unit, 
        item.unitPrice, 
        item.unitNetPrice || item.unitPrice,
        item.serviceDuration || 0,
        item.estimatedLeadTime || 0,
        item.pricingTerm || 'Each',
        item.discount || 0,
        item.description
      );

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
        SET name = ?, category = ?, manufacturer = ?, part_number = ?, unit = ?, unit_price = ?, unit_net_price = ?, service_duration = ?, estimated_lead_time = ?, pricing_term = ?, discount = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateItem.run(
        item.name, 
        item.category, 
        item.manufacturer, 
        item.partNumber || '',
        item.unit, 
        item.unitPrice, 
        item.unitNetPrice || item.unitPrice,
        item.serviceDuration || 0,
        item.estimatedLeadTime || 0,
        item.pricingTerm || 'Each',
        item.discount || 0,
        item.description, 
        itemId
      );

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

  // BOQ Projects methods
  getBOQProjects() {
    const stmt = this.db.prepare(`
      SELECT p.*, 
             COUNT(bi.id) as item_count,
             COALESCE(SUM(i.unit_net_price * bi.quantity), 0) as total_value
      FROM boq_projects p
      LEFT JOIN boq_items bi ON p.id = bi.project_id
      LEFT JOIN items i ON bi.item_id = i.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `);
    return stmt.all();
  }

  createBOQProject(name, description = '') {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO boq_projects (name, description) 
        VALUES (?, ?)
      `);
      const result = stmt.run(name, description);
      return { success: true, projectId: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateBOQProject(projectId, name, description = '') {
    try {
      const stmt = this.db.prepare(`
        UPDATE boq_projects 
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(name, description, projectId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteBOQProject(projectId) {
    try {
      const stmt = this.db.prepare('DELETE FROM boq_projects WHERE id = ?');
      stmt.run(projectId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // BOQ Items methods
  getBOQItems(projectId) {
    const stmt = this.db.prepare(`
      SELECT bi.*, i.name, i.category, i.manufacturer, i.part_number, 
             i.unit, i.unit_price, i.unit_net_price, i.service_duration,
             i.estimated_lead_time, i.pricing_term, i.discount, i.description,
             req.name as required_by_name
      FROM boq_items bi
      JOIN items i ON bi.item_id = i.id
      LEFT JOIN items req ON bi.required_by = req.id
      WHERE bi.project_id = ?
      ORDER BY bi.is_dependency ASC, bi.id ASC
    `);
    
    return stmt.all(projectId).map(row => ({
      id: row.item_id,
      name: row.name,
      category: row.category,
      manufacturer: row.manufacturer,
      partNumber: row.part_number,
      unit: row.unit,
      unitPrice: row.unit_price,
      unitNetPrice: row.unit_net_price,
      serviceDuration: row.service_duration,
      estimatedLeadTime: row.estimated_lead_time,
      pricingTerm: row.pricing_term,
      discount: row.discount,
      description: row.description,
      quantity: row.quantity,
      isDependency: Boolean(row.is_dependency),
      requiredBy: row.required_by,
      requiredByName: row.required_by_name
    }));
  }

  saveBOQItems(projectId, boqItems) {
    const transaction = this.db.transaction(() => {
      // Clear existing BOQ items for this project
      const deleteStmt = this.db.prepare('DELETE FROM boq_items WHERE project_id = ?');
      deleteStmt.run(projectId);

      // Insert new BOQ items
      const insertStmt = this.db.prepare(`
        INSERT INTO boq_items (project_id, item_id, quantity, is_dependency, required_by)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of boqItems) {
        insertStmt.run(
          projectId,
          item.id,
          parseInt(item.quantity) || 1,
          item.isDependency ? 1 : 0, // Convert boolean to integer for SQLite
          item.requiredBy || null
        );
      }

      // Update project timestamp
      const updateProjectStmt = this.db.prepare(`
        UPDATE boq_projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);
      updateProjectStmt.run(projectId);
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
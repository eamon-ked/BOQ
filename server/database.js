const Database = require('better-sqlite3');
const path = require('path');
const MigrationRunner = require('./migration-runner');

class DatabaseService {
  constructor() {
    let dbPath;
    try {
      // Try to use Electron's userData path if available
      const electron = require('electron');
      const userData = (electron.app || electron.remote.app).getPath('userData');
      dbPath = path.join(userData, 'boq.db');
      console.log('Using Electron userData path for database:', dbPath);
    } catch (e) {
      // Fallback for dev/server mode
      dbPath = path.join(__dirname, 'boq.db');
      console.log('Using fallback path for database:', dbPath);
    }

    // Check if database file exists before creating
    const fs = require('fs');
    const dbExists = fs.existsSync(dbPath);
    console.log('Database file exists:', dbExists);

    this.db = new Database(dbPath);
    console.log('Database connection established to:', dbPath);

    // Database optimization settings
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 268435456'); // 256MB

    // Performance monitoring
    this.queryStats = new Map();
    this.preparedStatements = new Map();

    this.initializeTables();
    this.runMigrations();
    this.createIndexes();
    this.seedInitialData();
  }

  /**
   * Run database migrations
   */
  runMigrations() {
    try {
      const migrationRunner = new MigrationRunner(this.db);
      migrationRunner.runPendingMigrations();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
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

  createIndexes() {
    // Performance indexes for frequently queried columns
    const indexes = [
      // Items table indexes
      'CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)',
      'CREATE INDEX IF NOT EXISTS idx_items_name ON items(name)',
      'CREATE INDEX IF NOT EXISTS idx_items_manufacturer ON items(manufacturer)',
      'CREATE INDEX IF NOT EXISTS idx_items_unit_price ON items(unit_price)',
      'CREATE INDEX IF NOT EXISTS idx_items_part_number ON items(part_number)',
      'CREATE INDEX IF NOT EXISTS idx_items_name_category ON items(name, category)',
      'CREATE INDEX IF NOT EXISTS idx_items_price_category ON items(unit_price, category)',

      // Dependencies table indexes (foreign key relationships)
      'CREATE INDEX IF NOT EXISTS idx_dependencies_item_id ON dependencies(item_id)',
      'CREATE INDEX IF NOT EXISTS idx_dependencies_dependency_id ON dependencies(dependency_id)',
      'CREATE INDEX IF NOT EXISTS idx_dependencies_composite ON dependencies(item_id, dependency_id)',

      // BOQ items table indexes (foreign key relationships)
      'CREATE INDEX IF NOT EXISTS idx_boq_items_project_id ON boq_items(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_boq_items_item_id ON boq_items(item_id)',
      'CREATE INDEX IF NOT EXISTS idx_boq_items_required_by ON boq_items(required_by)',
      'CREATE INDEX IF NOT EXISTS idx_boq_items_is_dependency ON boq_items(is_dependency)',
      'CREATE INDEX IF NOT EXISTS idx_boq_items_project_item ON boq_items(project_id, item_id)',

      // BOQ projects table indexes
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_name ON boq_projects(name)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_updated_at ON boq_projects(updated_at)',

      // Categories table indexes
      'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)',

      // Full-text search indexes for text fields
      'CREATE INDEX IF NOT EXISTS idx_items_description ON items(description)',
      'CREATE INDEX IF NOT EXISTS idx_items_search_composite ON items(name, description, manufacturer, part_number)'
    ];

    indexes.forEach(indexSQL => {
      try {
        this.db.exec(indexSQL);
      } catch (error) {
        console.warn(`Index creation warning: ${error.message}`);
      }
    });

    console.log('Database indexes created');
  }

  seedInitialData() {
    // Check if data already exists
    const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get();
    console.log('Categories count on startup:', categoryCount.count);

    const itemCount = this.db.prepare('SELECT COUNT(*) as count FROM items').get();
    console.log('Items count on startup:', itemCount.count);

    if (categoryCount.count > 0) {
      console.log('Data already exists, skipping seed');
      return; // Data already seeded
    }

    console.log('Seeding initial data...');

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
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getCategories', 'SELECT name FROM categories ORDER BY name');
    const result = stmt.all().map(row => row.name);
    const endTime = performance.now();

    this.logQuery('getCategories', startTime, endTime, result.length);
    return result;
  }

  addCategory(name) {
    try {
      const startTime = performance.now();
      const stmt = this.getPreparedStatement('addCategory', 'INSERT INTO categories (name) VALUES (?)');
      stmt.run(name);
      const endTime = performance.now();

      this.logQuery('addCategory', startTime, endTime, 1);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateCategory(oldName, newName) {
    const transaction = this.db.transaction(() => {
      const startTime = performance.now();
      const updateCategory = this.getPreparedStatement('updateCategory', 'UPDATE categories SET name = ? WHERE name = ?');
      const updateItems = this.getPreparedStatement('updateCategoryItems', 'UPDATE items SET category = ? WHERE category = ?');

      updateCategory.run(newName, oldName);
      updateItems.run(newName, oldName);
      const endTime = performance.now();

      this.logQuery('updateCategory', startTime, endTime, 2);
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
      const startTime = performance.now();

      // Check if category is in use
      const checkStmt = this.getPreparedStatement('checkCategoryUsage', 'SELECT COUNT(*) as count FROM items WHERE category = ?');
      const itemCount = checkStmt.get(name);
      if (itemCount.count > 0) {
        throw new Error(`Cannot delete category "${name}" because ${itemCount.count} items are using it.`);
      }

      const deleteStmt = this.getPreparedStatement('deleteCategory', 'DELETE FROM categories WHERE name = ?');
      deleteStmt.run(name);
      const endTime = performance.now();

      this.logQuery('deleteCategory', startTime, endTime, 1);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Items methods
  getItems() {
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getItems', `
      SELECT i.*, 
             GROUP_CONCAT(d.dependency_id || ':' || d.quantity) as dependencies_str
      FROM items i
      LEFT JOIN dependencies d ON i.id = d.item_id
      GROUP BY i.id
      ORDER BY i.name
    `);

    const rawItems = stmt.all();
    const items = rawItems.map(row => {
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

    const endTime = performance.now();
    this.logQuery('getItems', startTime, endTime, items.length);
    return items;
  }

  // Optimized search methods
  searchItems(searchTerm, category = null, priceRange = null, limit = 100, offset = 0) {
    const startTime = performance.now();
    let sql = `
      SELECT i.*, 
             GROUP_CONCAT(d.dependency_id || ':' || d.quantity) as dependencies_str
      FROM items i
      LEFT JOIN dependencies d ON i.id = d.item_id
      WHERE 1=1
    `;
    const params = [];

    if (searchTerm) {
      sql += ` AND (i.name LIKE ? OR i.description LIKE ? OR i.manufacturer LIKE ? OR i.part_number LIKE ?)`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (category) {
      sql += ` AND i.category = ?`;
      params.push(category);
    }

    if (priceRange && priceRange.length === 2) {
      sql += ` AND i.unit_price BETWEEN ? AND ?`;
      params.push(priceRange[0], priceRange[1]);
    }

    sql += ` GROUP BY i.id ORDER BY i.name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.getPreparedStatement(`searchItems_${searchTerm}_${category}_${priceRange}`, sql);
    const rawItems = stmt.all(...params);

    const items = rawItems.map(row => ({
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
      dependencies: row.dependencies_str ? row.dependencies_str.split(',').map(dep => {
        const [itemId, quantity] = dep.split(':');
        return { itemId, quantity: parseInt(quantity) };
      }) : []
    }));

    const endTime = performance.now();
    this.logQuery('searchItems', startTime, endTime, items.length);
    return items;
  }

  getItemsByCategory(category) {
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getItemsByCategory', `
      SELECT i.*, 
             GROUP_CONCAT(d.dependency_id || ':' || d.quantity) as dependencies_str
      FROM items i
      LEFT JOIN dependencies d ON i.id = d.item_id
      WHERE i.category = ?
      GROUP BY i.id
      ORDER BY i.name
    `);

    const rawItems = stmt.all(category);
    const items = rawItems.map(row => ({
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
      dependencies: row.dependencies_str ? row.dependencies_str.split(',').map(dep => {
        const [itemId, quantity] = dep.split(':');
        return { itemId, quantity: parseInt(quantity) };
      }) : []
    }));

    const endTime = performance.now();
    this.logQuery('getItemsByCategory', startTime, endTime, items.length);
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

  clearDatabase() {
    const transaction = this.db.transaction(() => {
      // Clear all data in the correct order to respect foreign key constraints
      this.db.prepare('DELETE FROM boq_items').run();
      this.db.prepare('DELETE FROM boq_projects').run();
      this.db.prepare('DELETE FROM project_templates').run();
      this.db.prepare('DELETE FROM dependencies').run();
      this.db.prepare('DELETE FROM items').run();
      this.db.prepare('DELETE FROM categories').run();

      console.log('Database cleared successfully');
    });

    try {
      transaction();
      // Don't re-seed initial data after clearing - leave database empty
      return { success: true };
    } catch (error) {
      console.error('Failed to clear database:', error);
      return { success: false, error: error.message };
    }
  }

  // BOQ Projects methods
  getBOQProjects() {
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getBOQProjects', `
      SELECT p.*, 
             COUNT(bi.id) as item_count,
             COALESCE(SUM(i.unit_net_price * bi.quantity), 0) as total_value
      FROM boq_projects p
      LEFT JOIN boq_items bi ON p.id = bi.project_id
      LEFT JOIN items i ON bi.item_id = i.id
      WHERE p.is_template = FALSE OR p.is_template IS NULL
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `);
    const result = stmt.all().map(this.mapProjectFromDb.bind(this));
    const endTime = performance.now();

    this.logQuery('getBOQProjects', startTime, endTime, result.length);
    return result;
  }

  createBOQProject(projectData) {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO boq_projects (
          name, description, status, client_name, client_contact, client_email,
          location, estimated_value, deadline, is_template, template_category,
          template_description, created_from_template, tags, project_settings,
          notes, priority, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        projectData.name,
        projectData.description || '',
        projectData.status || 'draft',
        projectData.clientName || null,
        projectData.clientContact || null,
        projectData.clientEmail || null,
        projectData.location || null,
        projectData.estimatedValue || 0,
        projectData.deadline || null,
        projectData.isTemplate ? 1 : 0, // Convert boolean to integer for SQLite
        projectData.templateCategory || null,
        projectData.templateDescription || null,
        projectData.createdFromTemplate || null,
        projectData.tags ? JSON.stringify(projectData.tags) : null,
        projectData.projectSettings ? JSON.stringify(projectData.projectSettings) : null,
        projectData.notes || null,
        projectData.priority || 1,
        projectData.createdBy || null
      );

      // Log project creation
      this.logProjectHistory(result.lastInsertRowid, 'created', null, null, JSON.stringify(projectData), projectData.createdBy);

      return result.lastInsertRowid;
    });

    try {
      const projectId = transaction();
      return { success: true, projectId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateBOQProject(projectId, projectData, updatedBy = null) {
    const transaction = this.db.transaction(() => {
      // Get current project data for history logging
      const currentProject = this.getBOQProjectById(projectId);
      if (!currentProject.success) {
        throw new Error('Project not found');
      }

      const stmt = this.db.prepare(`
        UPDATE boq_projects 
        SET name = ?, description = ?, status = ?, client_name = ?, client_contact = ?,
            client_email = ?, location = ?, estimated_value = ?, deadline = ?,
            template_category = ?, template_description = ?, tags = ?,
            project_settings = ?, notes = ?, priority = ?, last_modified_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        projectData.name,
        projectData.description || '',
        projectData.status || 'draft',
        projectData.clientName || null,
        projectData.clientContact || null,
        projectData.clientEmail || null,
        projectData.location || null,
        projectData.estimatedValue || 0,
        projectData.deadline || null,
        projectData.templateCategory || null,
        projectData.templateDescription || null,
        projectData.tags ? JSON.stringify(projectData.tags) : null,
        projectData.projectSettings ? JSON.stringify(projectData.projectSettings) : null,
        projectData.notes || null,
        projectData.priority || 1,
        updatedBy,
        projectId
      );

      // Log significant changes
      const current = currentProject.project;
      if (current.status !== projectData.status) {
        this.logProjectHistory(projectId, 'status_changed', 'status', current.status, projectData.status, updatedBy);
      }
      if (current.name !== projectData.name) {
        this.logProjectHistory(projectId, 'updated', 'name', current.name, projectData.name, updatedBy);
      }
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getBOQProjectById(projectId) {
    try {
      const startTime = performance.now();
      const stmt = this.getPreparedStatement('getBOQProjectById', `
        SELECT p.*, 
               COUNT(bi.id) as item_count,
               COALESCE(SUM(i.unit_net_price * bi.quantity), 0) as total_value
        FROM boq_projects p
        LEFT JOIN boq_items bi ON p.id = bi.project_id
        LEFT JOIN items i ON bi.item_id = i.id
        WHERE p.id = ?
        GROUP BY p.id
      `);

      const result = stmt.get(projectId);
      const endTime = performance.now();

      this.logQuery('getBOQProjectById', startTime, endTime, result ? 1 : 0);

      if (!result) {
        return { success: false, error: 'Project not found' };
      }

      return { success: true, project: this.mapProjectFromDb(result) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteBOQProject(projectId, deletedBy = null) {
    const transaction = this.db.transaction(() => {
      // Log deletion before deleting
      this.logProjectHistory(projectId, 'deleted', null, null, null, deletedBy);

      const stmt = this.db.prepare('DELETE FROM boq_projects WHERE id = ?');
      stmt.run(projectId);
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Enhanced project methods for new functionality

  /**
   * Clone an existing project
   */
  cloneBOQProject(sourceProjectId, newProjectData, clonedBy = null) {
    const transaction = this.db.transaction(() => {
      // Get source project
      const sourceResult = this.getBOQProjectById(sourceProjectId);
      if (!sourceResult.success) {
        throw new Error('Source project not found');
      }

      const sourceProject = sourceResult.project;

      // Create new project with cloned data
      const clonedProject = {
        ...sourceProject,
        ...newProjectData,
        name: newProjectData.name || `${sourceProject.name} (Copy)`,
        createdFromTemplate: sourceProject.isTemplate ? sourceProjectId : sourceProject.createdFromTemplate,
        createdBy: clonedBy,
        isTemplate: false // Cloned projects are not templates by default
      };

      const createResult = this.createBOQProject(clonedProject);
      if (!createResult.success) {
        throw new Error(createResult.error);
      }

      const newProjectId = createResult.projectId;

      // Clone BOQ items
      const boqItems = this.getBOQItems(sourceProjectId);
      if (boqItems.length > 0) {
        this.saveBOQItems(newProjectId, boqItems);
      }

      // If source is a template, increment usage count
      if (sourceProject.isTemplate) {
        try {
          const updateUsageStmt = this.db.prepare(`
            UPDATE project_templates 
            SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE template_data LIKE '%"projectId":' || ? || '%'
          `);
          updateUsageStmt.run(sourceProjectId);
        } catch (error) {
          console.warn('Could not update template usage count:', error.message);
        }
      }

      // Log cloning action
      this.logProjectHistory(newProjectId, 'cloned', 'source_project_id', null, sourceProjectId.toString(), clonedBy);

      return newProjectId;
    });

    try {
      const projectId = transaction();
      return { success: true, projectId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate template data
   */
  validateTemplateData(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (templateData.name && templateData.name.length > 255) {
      errors.push('Template name must be less than 255 characters');
    }

    if (templateData.templateDescription && templateData.templateDescription.length > 2000) {
      errors.push('Template description must be less than 2000 characters');
    }

    if (templateData.templateCategory && templateData.templateCategory.length > 100) {
      errors.push('Template category must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a project template
   */
  createProjectTemplate(templateData, createdBy = null) {
    try {
      // Validate template data
      const validation = this.validateTemplateData(templateData);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      const projectData = {
        ...templateData,
        isTemplate: true,
        status: 'active',
        createdBy
      };

      const result = this.createBOQProject(projectData);
      if (result.success) {
        // Also create entry in project_templates table for better management
        const templateStmt = this.db.prepare(`
          INSERT INTO project_templates (name, description, category, template_data, created_by)
          VALUES (?, ?, ?, ?, ?)
        `);

        templateStmt.run(
          templateData.name,
          templateData.templateDescription || templateData.description,
          templateData.templateCategory,
          JSON.stringify({ projectId: result.projectId, ...templateData }),
          createdBy
        );
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get project templates
   */
  getProjectTemplates(category = null) {
    const startTime = performance.now();
    let sql = `
      SELECT p.*, 
             COUNT(bi.id) as item_count,
             COALESCE(SUM(i.unit_net_price * bi.quantity), 0) as template_value
      FROM boq_projects p
      LEFT JOIN boq_items bi ON p.id = bi.project_id
      LEFT JOIN items i ON bi.item_id = i.id
      WHERE p.is_template = TRUE
    `;

    const params = [];
    if (category) {
      sql += ' AND p.template_category = ?';
      params.push(category);
    }

    sql += ' GROUP BY p.id ORDER BY p.name';

    const stmt = this.getPreparedStatement(`getProjectTemplates_${category}`, sql);
    const result = stmt.all(...params).map(this.mapProjectFromDb.bind(this));
    const endTime = performance.now();

    this.logQuery('getProjectTemplates', startTime, endTime, result.length);
    return result;
  }

  /**
   * Update a project template
   * @param {number} templateId - Template ID to update
   * @param {Object} templateData - Updated template data
   * @param {string} updatedBy - User making the update
   */
  updateProjectTemplate(templateId, templateData, updatedBy = null) {
    const startTime = performance.now();

    try {
      // Validate template data
      const validation = this.validateTemplateData(templateData);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // First verify the template exists and is actually a template
      const existingTemplate = this.db.prepare(`
        SELECT id, name FROM boq_projects WHERE id = ? AND is_template = TRUE
      `).get(templateId);

      if (!existingTemplate) {
        throw new Error('Template not found or is not a template');
      }

      // Update the template project
      const updateResult = this.updateBOQProject(templateId, {
        ...templateData,
        isTemplate: true, // Ensure it remains a template
        lastModifiedBy: updatedBy
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update template');
      }

      // Also update the project_templates table if it exists
      try {
        const templateTableStmt = this.db.prepare(`
          UPDATE project_templates 
          SET name = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP
          WHERE template_data LIKE '%"projectId":' || ? || '%'
        `);

        templateTableStmt.run(
          templateData.name,
          templateData.templateDescription || templateData.description,
          templateData.templateCategory,
          templateId
        );
      } catch (error) {
        // project_templates table might not exist or have entries, continue anyway
        console.warn('Could not update project_templates table:', error.message);
      }

      // Log the update
      this.logProjectHistory(templateId, 'template_updated', null, null, null, updatedBy);

      const endTime = performance.now();
      this.logQuery('updateProjectTemplate', startTime, endTime, 1);

      return {
        success: true,
        templateId: templateId,
        message: 'Template updated successfully'
      };

    } catch (error) {
      console.error('Error updating project template:', error);
      const endTime = performance.now();
      this.logQuery('updateProjectTemplate', startTime, endTime, 0);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a project template
   * @param {number} templateId - Template ID to delete
   * @param {string} deletedBy - User performing the deletion
   */
  deleteProjectTemplate(templateId, deletedBy = null) {
    const startTime = performance.now();

    try {
      // First verify the template exists and is actually a template
      const existingTemplate = this.db.prepare(`
        SELECT id, name FROM boq_projects WHERE id = ? AND is_template = TRUE
      `).get(templateId);

      if (!existingTemplate) {
        throw new Error('Template not found or is not a template');
      }

      // Log the deletion before actually deleting
      this.logProjectHistory(templateId, 'template_deleted', null, null, null, deletedBy);

      // Delete from project_templates table first (if exists)
      try {
        const deleteTemplateTableStmt = this.db.prepare(`
          DELETE FROM project_templates 
          WHERE template_data LIKE '%"projectId":' || ? || '%'
        `);
        deleteTemplateTableStmt.run(templateId);
      } catch (error) {
        // project_templates table might not exist, continue anyway
        console.warn('Could not delete from project_templates table:', error.message);
      }

      // Delete the template project (this will cascade to delete BOQ items)
      const deleteResult = this.deleteBOQProject(templateId);

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete template');
      }

      const endTime = performance.now();
      this.logQuery('deleteProjectTemplate', startTime, endTime, 1);

      return {
        success: true,
        templateId: templateId,
        message: 'Template deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting project template:', error);
      const endTime = performance.now();
      this.logQuery('deleteProjectTemplate', startTime, endTime, 0);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get project history
   */
  getProjectHistory(projectId, limit = 50) {
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getProjectHistory', `
      SELECT * FROM project_history 
      WHERE project_id = ? 
      ORDER BY changed_at DESC 
      LIMIT ?
    `);

    const result = stmt.all(projectId, limit);
    const endTime = performance.now();

    this.logQuery('getProjectHistory', startTime, endTime, result.length);
    return result;
  }

  /**
   * Search projects with advanced filters
   */
  searchProjects(filters = {}) {
    const startTime = performance.now();
    let sql = `
      SELECT p.*, 
             COUNT(bi.id) as item_count,
             COALESCE(SUM(i.unit_net_price * bi.quantity), 0) as total_value
      FROM boq_projects p
      LEFT JOIN boq_items bi ON p.id = bi.project_id
      LEFT JOIN items i ON bi.item_id = i.id
      WHERE (p.is_template = FALSE OR p.is_template IS NULL)
    `;

    const params = [];

    if (filters.search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.client_name LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters.status) {
      sql += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.clientName) {
      sql += ' AND p.client_name LIKE ?';
      params.push(`%${filters.clientName}%`);
    }

    if (filters.priority) {
      sql += ' AND p.priority = ?';
      params.push(filters.priority);
    }

    if (filters.deadlineFrom) {
      sql += ' AND p.deadline >= ?';
      params.push(filters.deadlineFrom);
    }

    if (filters.deadlineTo) {
      sql += ' AND p.deadline <= ?';
      params.push(filters.deadlineTo);
    }

    if (filters.valueMin) {
      sql += ' AND p.estimated_value >= ?';
      params.push(filters.valueMin);
    }

    if (filters.valueMax) {
      sql += ' AND p.estimated_value <= ?';
      params.push(filters.valueMax);
    }

    sql += ' GROUP BY p.id ORDER BY p.updated_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.getPreparedStatement(`searchProjects_${JSON.stringify(filters)}`, sql);
    const result = stmt.all(...params).map(this.mapProjectFromDb.bind(this));
    const endTime = performance.now();

    this.logQuery('searchProjects', startTime, endTime, result.length);
    return result;
  }

  /**
   * Get project statistics
   */
  getProjectStatistics() {
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getProjectStatistics', `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
        COUNT(CASE WHEN is_template = TRUE THEN 1 END) as template_count,
        AVG(estimated_value) as avg_project_value,
        SUM(estimated_value) as total_portfolio_value,
        COUNT(CASE WHEN deadline < date('now') AND status NOT IN ('completed', 'archived') THEN 1 END) as overdue_count
      FROM boq_projects
      WHERE is_template = FALSE OR is_template IS NULL
    `);

    const result = stmt.get();
    const endTime = performance.now();

    this.logQuery('getProjectStatistics', startTime, endTime, 1);
    return result;
  }

  /**
   * Helper method to map database row to project object
   */
  mapProjectFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status || 'draft',
      clientName: row.client_name,
      clientContact: row.client_contact,
      clientEmail: row.client_email,
      location: row.location,
      estimatedValue: row.estimated_value || 0,
      deadline: row.deadline,
      isTemplate: Boolean(row.is_template),
      templateCategory: row.template_category,
      templateDescription: row.template_description,
      createdFromTemplate: row.created_from_template,
      tags: row.tags ? JSON.parse(row.tags) : [],
      projectSettings: row.project_settings ? JSON.parse(row.project_settings) : {},
      notes: row.notes,
      priority: row.priority || 1,
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Ensure compatibility with frontend expectations
      item_count: row.item_count || 0,
      total_value: Number(row.total_value) || 0,
      // Also provide camelCase versions for new code
      itemCount: row.item_count || 0,
      totalValue: Number(row.total_value) || 0
    };
  }

  /**
   * Helper method to log project history
   */
  logProjectHistory(projectId, action, fieldName = null, oldValue = null, newValue = null, changedBy = null) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO project_history (project_id, action, field_name, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(projectId, action, fieldName, oldValue, newValue, changedBy);
    } catch (error) {
      console.warn('Failed to log project history:', error.message);
    }
  }

  // BOQ Items methods
  getBOQItems(projectId) {
    const startTime = performance.now();
    const stmt = this.getPreparedStatement('getBOQItems', `
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

    const rawItems = stmt.all(projectId);
    const items = rawItems.map(row => ({
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

    const endTime = performance.now();
    this.logQuery('getBOQItems', startTime, endTime, items.length);
    return items;
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

  // Performance monitoring methods
  logQuery(queryName, startTime, endTime, rowCount = 0) {
    const duration = endTime - startTime;

    if (!this.queryStats.has(queryName)) {
      this.queryStats.set(queryName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        totalRows: 0
      });
    }

    const stats = this.queryStats.get(queryName);
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.totalRows += rowCount;

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
  }

  getQueryStats() {
    const stats = {};
    for (const [queryName, data] of this.queryStats.entries()) {
      stats[queryName] = {
        ...data,
        avgRowsPerQuery: data.totalRows / data.count || 0
      };
    }
    return stats;
  }

  resetQueryStats() {
    this.queryStats.clear();
  }

  // Prepared statement caching
  getPreparedStatement(key, sql) {
    if (!this.preparedStatements.has(key)) {
      this.preparedStatements.set(key, this.db.prepare(sql));
    }
    return this.preparedStatements.get(key);
  }

  // Database connection optimization
  optimizeConnection() {
    // Analyze database for query optimization
    this.db.exec('ANALYZE');

    // Update table statistics
    this.db.exec('PRAGMA optimize');

    console.log('Database connection optimized');
  }

  // Performance testing methods
  runPerformanceTest(testName, testFunction, iterations = 100) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const result = testFunction();
      const endTime = performance.now();

      results.push({
        iteration: i + 1,
        duration: endTime - startTime,
        rowCount: Array.isArray(result) ? result.length : result ? 1 : 0
      });
    }

    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...results.map(r => r.duration));
    const maxTime = Math.max(...results.map(r => r.duration));

    return {
      testName,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      results
    };
  }

  close() {
    // Clear prepared statements cache
    this.preparedStatements.clear();
    this.db.close();
  }
}

module.exports = DatabaseService;
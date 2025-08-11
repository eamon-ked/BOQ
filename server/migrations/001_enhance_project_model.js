/**
 * Database Migration: Enhance Project Data Model
 * 
 * This migration adds enhanced project metadata, status tracking,
 * client information, deadlines, and template functionality to the
 * existing boq_projects table.
 * 
 * Requirements: 9.1, 9.2, 9.4
 */

class ProjectModelMigration {
  constructor(db) {
    this.db = db;
  }

  /**
   * Apply the migration - add new columns and tables
   */
  up() {
    console.log('Starting project model enhancement migration...');

    // Add new columns to boq_projects table one by one
    const alterProjectsTable = [
      // Project status and metadata
      { sql: 'ALTER TABLE boq_projects ADD COLUMN status TEXT DEFAULT "draft"', column: 'status' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN client_name TEXT', column: 'client_name' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN client_contact TEXT', column: 'client_contact' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN client_email TEXT', column: 'client_email' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN location TEXT', column: 'location' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN estimated_value REAL DEFAULT 0', column: 'estimated_value' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN deadline DATE', column: 'deadline' },

      // Template functionality
      { sql: 'ALTER TABLE boq_projects ADD COLUMN is_template BOOLEAN DEFAULT FALSE', column: 'is_template' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN template_category TEXT', column: 'template_category' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN template_description TEXT', column: 'template_description' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN created_from_template INTEGER', column: 'created_from_template' },

      // Additional metadata
      { sql: 'ALTER TABLE boq_projects ADD COLUMN tags TEXT', column: 'tags' }, // JSON array of tags
      { sql: 'ALTER TABLE boq_projects ADD COLUMN project_settings TEXT', column: 'project_settings' }, // JSON object for project-specific settings
      { sql: 'ALTER TABLE boq_projects ADD COLUMN notes TEXT', column: 'notes' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN priority INTEGER DEFAULT 1', column: 'priority' },

      // Audit fields
      { sql: 'ALTER TABLE boq_projects ADD COLUMN created_by TEXT', column: 'created_by' },
      { sql: 'ALTER TABLE boq_projects ADD COLUMN last_modified_by TEXT', column: 'last_modified_by' }
    ];

    // Execute ALTER TABLE statements
    alterProjectsTable.forEach(({ sql, column }) => {
      try {
        // Check if column already exists
        const columnExists = this.db.prepare(`
          SELECT COUNT(*) as count 
          FROM pragma_table_info('boq_projects') 
          WHERE name = ?
        `).get(column);

        if (columnExists.count === 0) {
          this.db.exec(sql);
          console.log(`Added column: ${column}`);
        } else {
          console.log(`Column ${column} already exists, skipping`);
        }
      } catch (error) {
        console.warn(`Migration warning for ${column}: ${error.message}`);
      }
    });

    // Create project templates table for better template management
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        template_data TEXT, -- JSON containing project structure and default items
        usage_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT FALSE,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create project history table for audit trail
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'cloned', etc.
        field_name TEXT, -- which field was changed
        old_value TEXT,
        new_value TEXT,
        changed_by TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES boq_projects(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for new columns
    const newIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_status ON boq_projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_client_name ON boq_projects(client_name)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_deadline ON boq_projects(deadline)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_is_template ON boq_projects(is_template)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_template_category ON boq_projects(template_category)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_priority ON boq_projects(priority)',
      'CREATE INDEX IF NOT EXISTS idx_boq_projects_estimated_value ON boq_projects(estimated_value)',
      'CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category)',
      'CREATE INDEX IF NOT EXISTS idx_project_templates_is_public ON project_templates(is_public)',
      'CREATE INDEX IF NOT EXISTS idx_project_history_project_id ON project_history(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_history_action ON project_history(action)',
      'CREATE INDEX IF NOT EXISTS idx_project_history_changed_at ON project_history(changed_at)'
    ];

    newIndexes.forEach(indexSQL => {
      try {
        this.db.exec(indexSQL);
      } catch (error) {
        console.warn(`Index creation warning: ${error.message}`);
      }
    });

    // Add constraints after columns are created
    try {
      // Note: SQLite doesn't support adding CHECK constraints to existing columns
      // We'll handle validation in the application layer
      console.log('Column constraints will be enforced at application level');
    } catch (error) {
      console.warn(`Constraint warning: ${error.message}`);
    }

    console.log('Project model enhancement migration completed successfully');
  }

  /**
   * Rollback the migration - remove added columns and tables
   */
  down() {
    console.log('Rolling back project model enhancement migration...');

    // SQLite doesn't support DROP COLUMN, so we need to recreate the table
    // First, backup existing data
    this.db.exec(`
      CREATE TABLE boq_projects_backup AS 
      SELECT id, name, description, created_at, updated_at 
      FROM boq_projects
    `);

    // Drop the enhanced table
    this.db.exec('DROP TABLE boq_projects');

    // Recreate original table
    this.db.exec(`
      CREATE TABLE boq_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Restore data
    this.db.exec(`
      INSERT INTO boq_projects (id, name, description, created_at, updated_at)
      SELECT id, name, description, created_at, updated_at
      FROM boq_projects_backup
    `);

    // Drop backup table
    this.db.exec('DROP TABLE boq_projects_backup');

    // Drop new tables
    this.db.exec('DROP TABLE IF EXISTS project_templates');
    this.db.exec('DROP TABLE IF EXISTS project_history');

    console.log('Project model enhancement migration rolled back successfully');
  }

  /**
   * Check if migration has been applied
   */
  isApplied() {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM pragma_table_info('boq_projects') 
        WHERE name = 'status'
      `).get();
      return result.count > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ProjectModelMigration;
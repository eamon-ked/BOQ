/**
 * Database Migration Runner
 * 
 * Handles running database migrations in order and tracking
 * which migrations have been applied.
 */

const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(db) {
    this.db = db;
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.initializeMigrationsTable();
  }

  /**
   * Initialize the migrations tracking table
   */
  initializeMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get list of available migration files
   */
  getAvailableMigrations() {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort(); // Ensure migrations run in order
  }

  /**
   * Get list of applied migrations
   */
  getAppliedMigrations() {
    const stmt = this.db.prepare('SELECT filename FROM migrations ORDER BY filename');
    return stmt.all().map(row => row.filename);
  }

  /**
   * Get pending migrations that need to be applied
   */
  getPendingMigrations() {
    const available = this.getAvailableMigrations();
    const applied = new Set(this.getAppliedMigrations());
    return available.filter(migration => !applied.has(migration));
  }

  /**
   * Run a specific migration
   */
  runMigration(filename) {
    const migrationPath = path.join(this.migrationsPath, filename);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }

    console.log(`Running migration: ${filename}`);

    try {
      // Load the migration class
      const MigrationClass = require(migrationPath);
      const migration = new MigrationClass(this.db);

      // Check if already applied
      if (migration.isApplied && migration.isApplied()) {
        console.log(`Migration ${filename} already applied, skipping`);
        this.markAsApplied(filename);
        return;
      }

      // Run the migration
      migration.up();

      // Mark as applied
      this.markAsApplied(filename);

      console.log(`Migration ${filename} completed successfully`);
    } catch (error) {
      console.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  /**
   * Mark a migration as applied
   */
  markAsApplied(filename) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO migrations (filename) VALUES (?)
    `);
    stmt.run(filename);
  }

  /**
   * Run all pending migrations
   */
  runPendingMigrations() {
    const pending = this.getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pending.length} pending migrations`);

    for (const migration of pending) {
      this.runMigration(migration);
    }

    console.log('All migrations completed');
  }

  /**
   * Rollback the last migration
   */
  rollbackLastMigration() {
    const applied = this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = applied[applied.length - 1];
    const migrationPath = path.join(this.migrationsPath, lastMigration);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${lastMigration}`);
    }

    console.log(`Rolling back migration: ${lastMigration}`);

    try {
      // Load the migration class
      const MigrationClass = require(migrationPath);
      const migration = new MigrationClass(this.db);

      // Run the rollback
      if (migration.down) {
        migration.down();
      } else {
        console.warn(`Migration ${lastMigration} does not support rollback`);
        return;
      }

      // Remove from applied migrations
      const stmt = this.db.prepare('DELETE FROM migrations WHERE filename = ?');
      stmt.run(lastMigration);

      console.log(`Migration ${lastMigration} rolled back successfully`);
    } catch (error) {
      console.error(`Rollback of ${lastMigration} failed:`, error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  getStatus() {
    const available = this.getAvailableMigrations();
    const applied = new Set(this.getAppliedMigrations());
    const pending = this.getPendingMigrations();

    return {
      total: available.length,
      applied: applied.size,
      pending: pending.length,
      migrations: available.map(filename => ({
        filename,
        applied: applied.has(filename)
      }))
    };
  }
}

module.exports = MigrationRunner;
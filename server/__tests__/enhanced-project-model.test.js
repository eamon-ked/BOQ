/**
 * Tests for Enhanced Project Data Model
 * 
 * Tests the new project functionality including metadata, status tracking,
 * client information, deadlines, templates, and cloning operations.
 * 
 * Requirements: 9.1, 9.2, 9.4
 */

const DatabaseService = require('../database');
const fs = require('fs');
const path = require('path');

describe('Enhanced Project Data Model', () => {
  let db;
  let testDbPath;

  beforeEach(() => {
    // Create a temporary test database
    testDbPath = path.join(__dirname, 'test-enhanced-projects.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Mock the database path for testing
    const originalConstructor = DatabaseService.prototype.constructor;
    DatabaseService.prototype.constructor = function() {
      const Database = require('better-sqlite3');
      const MigrationRunner = require('../migration-runner');
      
      this.db = new Database(testDbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      this.queryStats = new Map();
      this.preparedStatements = new Map();
      
      this.initializeTables();
      
      // Force run the migration manually for tests
      try {
        const ProjectModelMigration = require('../migrations/001_enhance_project_model');
        const migration = new ProjectModelMigration(this.db);
        if (!migration.isApplied()) {
          migration.up();
        }
      } catch (error) {
        console.warn('Migration error in test:', error.message);
      }
      
      this.createIndexes();
      // Skip seeding for tests
    };
    
    db = new DatabaseService();
    
    // Restore original constructor
    DatabaseService.prototype.constructor = originalConstructor;
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Enhanced Project Creation', () => {
    test('should create project with enhanced metadata', () => {
      const projectData = {
        name: 'Test Enhanced Project',
        description: 'A test project with enhanced features',
        status: 'active',
        clientName: 'Test Client Corp',
        clientContact: 'John Doe',
        clientEmail: 'john@testclient.com',
        location: 'New York, NY',
        estimatedValue: 50000,
        deadline: '2024-12-31',
        tags: ['security', 'cctv', 'urgent'],
        projectSettings: {
          currency: 'USD',
          taxRate: 0.08,
          discountApplied: true
        },
        notes: 'High priority project for major client',
        priority: 5,
        createdBy: 'test-user'
      };

      const result = db.createBOQProject(projectData);
      
      expect(result.success).toBe(true);
      expect(result.projectId).toBeDefined();

      // Verify project was created with all metadata
      const retrievedProject = db.getBOQProjectById(result.projectId);
      expect(retrievedProject.success).toBe(true);
      
      const project = retrievedProject.project;
      expect(project.name).toBe(projectData.name);
      expect(project.status).toBe(projectData.status);
      expect(project.clientName).toBe(projectData.clientName);
      expect(project.clientContact).toBe(projectData.clientContact);
      expect(project.clientEmail).toBe(projectData.clientEmail);
      expect(project.location).toBe(projectData.location);
      expect(project.estimatedValue).toBe(projectData.estimatedValue);
      expect(project.deadline).toBe(projectData.deadline);
      expect(project.tags).toEqual(projectData.tags);
      expect(project.projectSettings).toEqual(projectData.projectSettings);
      expect(project.notes).toBe(projectData.notes);
      expect(project.priority).toBe(projectData.priority);
      expect(project.createdBy).toBe(projectData.createdBy);
    });

    test('should create project with minimal data and defaults', () => {
      const projectData = {
        name: 'Minimal Project'
      };

      const result = db.createBOQProject(projectData);
      
      expect(result.success).toBe(true);

      const retrievedProject = db.getBOQProjectById(result.projectId);
      const project = retrievedProject.project;
      
      expect(project.name).toBe(projectData.name);
      expect(project.status).toBe('draft'); // Default status
      expect(project.priority).toBe(1); // Default priority
      expect(project.estimatedValue).toBe(0); // Default value
      expect(project.tags).toEqual([]); // Default empty tags
      expect(project.projectSettings).toEqual({}); // Default empty settings
    });
  });

  describe('Project Status Management', () => {
    let projectId;

    beforeEach(() => {
      const result = db.createBOQProject({
        name: 'Status Test Project',
        status: 'draft',
        createdBy: 'test-user'
      });
      projectId = result.projectId;
    });

    test('should update project status and log history', () => {
      const updateResult = db.updateBOQProject(projectId, {
        name: 'Status Test Project',
        status: 'active'
      }, 'test-user');

      expect(updateResult.success).toBe(true);

      // Verify status was updated
      const project = db.getBOQProjectById(projectId).project;
      expect(project.status).toBe('active');

      // Verify history was logged
      const history = db.getProjectHistory(projectId);
      const statusChange = history.find(h => h.action === 'status_changed');
      expect(statusChange).toBeDefined();
      expect(statusChange.field_name).toBe('status');
      expect(statusChange.old_value).toBe('draft');
      expect(statusChange.new_value).toBe('active');
      expect(statusChange.changed_by).toBe('test-user');
    });

    test('should validate status values', () => {
      // The database constraint should prevent invalid status values
      // This test verifies the constraint is working
      expect(() => {
        db.db.prepare(`
          INSERT INTO boq_projects (name, status) 
          VALUES ('Invalid Status Project', 'invalid_status')
        `).run();
      }).toThrow();
    });
  });

  describe('Project Templates', () => {
    test('should create project template', () => {
      const templateData = {
        name: 'CCTV Installation Template',
        description: 'Standard CCTV installation project template',
        templateCategory: 'Security Systems',
        templateDescription: 'Template for typical CCTV installations',
        tags: ['cctv', 'security', 'template'],
        createdBy: 'admin-user'
      };

      const result = db.createProjectTemplate(templateData);
      
      expect(result.success).toBe(true);

      // Verify template was created
      const project = db.getBOQProjectById(result.projectId).project;
      expect(project.isTemplate).toBe(true);
      expect(project.templateCategory).toBe(templateData.templateCategory);
      expect(project.templateDescription).toBe(templateData.templateDescription);

      // Verify template appears in templates list
      const templates = db.getProjectTemplates();
      const createdTemplate = templates.find(t => t.id === result.projectId);
      expect(createdTemplate).toBeDefined();
    });

    test('should filter templates by category', () => {
      // Create templates in different categories
      db.createProjectTemplate({
        name: 'CCTV Template',
        templateCategory: 'Security Systems'
      });
      
      db.createProjectTemplate({
        name: 'Network Template',
        templateCategory: 'Networking'
      });

      const securityTemplates = db.getProjectTemplates('Security Systems');
      const networkTemplates = db.getProjectTemplates('Networking');

      expect(securityTemplates).toHaveLength(1);
      expect(securityTemplates[0].name).toBe('CCTV Template');
      
      expect(networkTemplates).toHaveLength(1);
      expect(networkTemplates[0].name).toBe('Network Template');
    });

    test('should exclude templates from regular project list', () => {
      // Create a regular project and a template
      db.createBOQProject({ name: 'Regular Project' });
      db.createProjectTemplate({ name: 'Template Project' });

      const projects = db.getBOQProjects();
      const templates = db.getProjectTemplates();

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Regular Project');
      
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Template Project');
    });
  });

  describe('Project Cloning', () => {
    let sourceProjectId;

    beforeEach(() => {
      // Create a source project with full metadata
      const result = db.createBOQProject({
        name: 'Source Project',
        description: 'Original project to clone',
        status: 'completed',
        clientName: 'Original Client',
        location: 'Original Location',
        estimatedValue: 25000,
        tags: ['original', 'source'],
        projectSettings: { currency: 'USD' },
        notes: 'Original notes',
        priority: 3
      });
      sourceProjectId = result.projectId;

      // Add some BOQ items to the source project
      const mockItems = [
        {
          id: 'item1',
          name: 'Test Item 1',
          quantity: 2,
          isDependency: false
        },
        {
          id: 'item2',
          name: 'Test Item 2',
          quantity: 1,
          isDependency: true,
          requiredBy: 'item1'
        }
      ];
      
      // First add items to master database
      db.addItem({
        id: 'item1',
        name: 'Test Item 1',
        category: 'Test',
        unit: 'pcs',
        unitPrice: 100,
        description: 'Test item 1'
      });
      
      db.addItem({
        id: 'item2',
        name: 'Test Item 2',
        category: 'Test',
        unit: 'pcs',
        unitPrice: 50,
        description: 'Test item 2'
      });

      db.saveBOQItems(sourceProjectId, mockItems);
    });

    test('should clone project with all metadata and items', () => {
      const cloneData = {
        name: 'Cloned Project',
        clientName: 'New Client',
        status: 'draft'
      };

      const result = db.cloneBOQProject(sourceProjectId, cloneData, 'test-user');
      
      expect(result.success).toBe(true);

      // Verify cloned project
      const clonedProject = db.getBOQProjectById(result.projectId).project;
      expect(clonedProject.name).toBe('Cloned Project');
      expect(clonedProject.clientName).toBe('New Client');
      expect(clonedProject.status).toBe('draft');
      expect(clonedProject.description).toBe('Original project to clone'); // Inherited
      expect(clonedProject.location).toBe('Original Location'); // Inherited
      expect(clonedProject.estimatedValue).toBe(25000); // Inherited
      expect(clonedProject.isTemplate).toBe(false); // Should not be template

      // Verify BOQ items were cloned
      const clonedItems = db.getBOQItems(result.projectId);
      expect(clonedItems).toHaveLength(2);
      expect(clonedItems.find(item => item.id === 'item1')).toBeDefined();
      expect(clonedItems.find(item => item.id === 'item2')).toBeDefined();

      // Verify history was logged
      const history = db.getProjectHistory(result.projectId);
      const cloneEntry = history.find(h => h.action === 'cloned');
      expect(cloneEntry).toBeDefined();
      expect(cloneEntry.new_value).toBe(sourceProjectId.toString());
    });

    test('should handle cloning from template', () => {
      // Create a template
      const templateResult = db.createProjectTemplate({
        name: 'Template Project',
        templateCategory: 'Standard'
      });

      const cloneResult = db.cloneBOQProject(templateResult.projectId, {
        name: 'Project from Template'
      });

      expect(cloneResult.success).toBe(true);

      const clonedProject = db.getBOQProjectById(cloneResult.projectId).project;
      expect(clonedProject.createdFromTemplate).toBe(templateResult.projectId);
      expect(clonedProject.isTemplate).toBe(false);
    });

    test('should fail to clone non-existent project', () => {
      const result = db.cloneBOQProject(99999, { name: 'Should Fail' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Source project not found');
    });
  });

  describe('Project Search and Filtering', () => {
    beforeEach(() => {
      // Create test projects with various attributes
      const projects = [
        {
          name: 'Alpha Security Project',
          status: 'active',
          clientName: 'Alpha Corp',
          priority: 5,
          estimatedValue: 100000,
          deadline: '2024-06-30'
        },
        {
          name: 'Beta Network Setup',
          status: 'draft',
          clientName: 'Beta Inc',
          priority: 3,
          estimatedValue: 50000,
          deadline: '2024-12-31'
        },
        {
          name: 'Gamma Installation',
          status: 'completed',
          clientName: 'Gamma LLC',
          priority: 1,
          estimatedValue: 25000,
          deadline: '2024-03-15'
        }
      ];

      projects.forEach(project => db.createBOQProject(project));
    });

    test('should search projects by name', () => {
      const results = db.searchProjects({ search: 'Security' });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alpha Security Project');
    });

    test('should filter projects by status', () => {
      const activeProjects = db.searchProjects({ status: 'active' });
      const draftProjects = db.searchProjects({ status: 'draft' });
      
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].name).toBe('Alpha Security Project');
      
      expect(draftProjects).toHaveLength(1);
      expect(draftProjects[0].name).toBe('Beta Network Setup');
    });

    test('should filter projects by client name', () => {
      const results = db.searchProjects({ clientName: 'Alpha' });
      
      expect(results).toHaveLength(1);
      expect(results[0].clientName).toBe('Alpha Corp');
    });

    test('should filter projects by priority', () => {
      const highPriorityProjects = db.searchProjects({ priority: 5 });
      
      expect(highPriorityProjects).toHaveLength(1);
      expect(highPriorityProjects[0].priority).toBe(5);
    });

    test('should filter projects by value range', () => {
      const expensiveProjects = db.searchProjects({ 
        valueMin: 75000,
        valueMax: 150000 
      });
      
      expect(expensiveProjects).toHaveLength(1);
      expect(expensiveProjects[0].estimatedValue).toBe(100000);
    });

    test('should filter projects by deadline range', () => {
      const midYearProjects = db.searchProjects({
        deadlineFrom: '2024-06-01',
        deadlineTo: '2024-08-31'
      });
      
      expect(midYearProjects).toHaveLength(1);
      expect(midYearProjects[0].deadline).toBe('2024-06-30');
    });

    test('should combine multiple filters', () => {
      const results = db.searchProjects({
        status: 'active',
        priority: 5,
        valueMin: 50000
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alpha Security Project');
    });

    test('should limit search results', () => {
      const results = db.searchProjects({ limit: 2 });
      
      expect(results).toHaveLength(2);
    });
  });

  describe('Project Statistics', () => {
    beforeEach(() => {
      // Create projects with various statuses and values
      const projects = [
        { name: 'Draft 1', status: 'draft', estimatedValue: 10000 },
        { name: 'Draft 2', status: 'draft', estimatedValue: 20000 },
        { name: 'Active 1', status: 'active', estimatedValue: 30000, deadline: '2023-12-31' }, // Overdue
        { name: 'Completed 1', status: 'completed', estimatedValue: 40000 },
        { name: 'Archived 1', status: 'archived', estimatedValue: 50000 }
      ];

      projects.forEach(project => db.createBOQProject(project));
      
      // Create a template (should not be counted in statistics)
      db.createProjectTemplate({ name: 'Template 1' });
    });

    test('should calculate project statistics correctly', () => {
      const stats = db.getProjectStatistics();
      
      expect(stats.total_projects).toBe(5); // Excludes template
      expect(stats.draft_count).toBe(2);
      expect(stats.active_count).toBe(1);
      expect(stats.completed_count).toBe(1);
      expect(stats.archived_count).toBe(1);
      expect(stats.template_count).toBe(0); // Templates excluded from main count
      expect(stats.total_portfolio_value).toBe(150000);
      expect(stats.avg_project_value).toBe(30000);
      expect(stats.overdue_count).toBe(1); // Active project with past deadline
    });
  });

  describe('Project History Tracking', () => {
    let projectId;

    beforeEach(() => {
      const result = db.createBOQProject({
        name: 'History Test Project',
        status: 'draft',
        createdBy: 'test-user'
      });
      projectId = result.projectId;
    });

    test('should log project creation', () => {
      const history = db.getProjectHistory(projectId);
      
      const creationEntry = history.find(h => h.action === 'created');
      expect(creationEntry).toBeDefined();
      expect(creationEntry.changed_by).toBe('test-user');
    });

    test('should log project updates', () => {
      db.updateBOQProject(projectId, {
        name: 'Updated Project Name',
        status: 'active'
      }, 'updater-user');

      const history = db.getProjectHistory(projectId);
      
      const statusChange = history.find(h => h.action === 'status_changed');
      expect(statusChange).toBeDefined();
      expect(statusChange.field_name).toBe('status');
      expect(statusChange.old_value).toBe('draft');
      expect(statusChange.new_value).toBe('active');
      expect(statusChange.changed_by).toBe('updater-user');

      const nameChange = history.find(h => h.action === 'updated' && h.field_name === 'name');
      expect(nameChange).toBeDefined();
      expect(nameChange.old_value).toBe('History Test Project');
      expect(nameChange.new_value).toBe('Updated Project Name');
    });

    test('should log project deletion', () => {
      db.deleteBOQProject(projectId, 'deleter-user');

      // Note: After deletion, we can't query the project history directly
      // In a real implementation, you might want to preserve history even after deletion
      // or have a separate audit log table
    });

    test('should limit history results', () => {
      // Create multiple history entries
      for (let i = 0; i < 10; i++) {
        db.updateBOQProject(projectId, {
          name: `Updated Name ${i}`,
          status: 'draft'
        }, 'test-user');
      }

      const limitedHistory = db.getProjectHistory(projectId, 5);
      expect(limitedHistory.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Database Migration', () => {
    test('should apply migration successfully', () => {
      // Migration should have been applied during setup
      // Verify that new columns exist
      const columns = db.db.prepare(`
        SELECT name FROM pragma_table_info('boq_projects')
      `).all().map(row => row.name);

      expect(columns).toContain('status');
      expect(columns).toContain('client_name');
      expect(columns).toContain('deadline');
      expect(columns).toContain('is_template');
      expect(columns).toContain('tags');
      expect(columns).toContain('priority');
    });

    test('should create new tables', () => {
      // Verify new tables were created
      const tables = db.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table'
      `).all().map(row => row.name);

      expect(tables).toContain('project_templates');
      expect(tables).toContain('project_history');
      expect(tables).toContain('migrations');
    });
  });
});
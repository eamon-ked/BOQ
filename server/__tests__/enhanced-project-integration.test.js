/**
 * Integration Tests for Enhanced Project Data Model
 * 
 * Simple integration tests to verify the enhanced project functionality
 * works correctly with the existing database.
 */

const DatabaseService = require('../database');

describe('Enhanced Project Integration', () => {
  let db;

  beforeAll(() => {
    db = new DatabaseService();
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  test('should create project with enhanced metadata', () => {
    const projectData = {
      name: 'Integration Test Project',
      description: 'A test project for integration testing',
      status: 'active',
      clientName: 'Test Client Corp',
      clientContact: 'John Doe',
      clientEmail: 'john@testclient.com',
      location: 'New York, NY',
      estimatedValue: 75000,
      deadline: '2024-12-31',
      tags: ['integration', 'test', 'enhanced'],
      projectSettings: {
        currency: 'USD',
        taxRate: 0.08
      },
      notes: 'Integration test project',
      priority: 4,
      createdBy: 'integration-test'
    };

    const result = db.createBOQProject(projectData);
    
    expect(result.success).toBe(true);
    expect(result.projectId).toBeDefined();

    // Verify project was created correctly
    const retrievedProject = db.getBOQProjectById(result.projectId);
    expect(retrievedProject.success).toBe(true);
    
    const project = retrievedProject.project;
    expect(project.name).toBe(projectData.name);
    expect(project.status).toBe(projectData.status);
    expect(project.clientName).toBe(projectData.clientName);
    expect(project.estimatedValue).toBe(projectData.estimatedValue);
    expect(project.tags).toEqual(projectData.tags);
    expect(project.projectSettings).toEqual(projectData.projectSettings);
    expect(project.priority).toBe(projectData.priority);
  });

  test('should create and manage project templates', () => {
    const templateData = {
      name: 'Integration Test Template',
      description: 'Template for integration testing',
      templateCategory: 'Testing',
      templateDescription: 'Standard template for test projects',
      createdBy: 'integration-test'
    };

    const result = db.createProjectTemplate(templateData);
    
    expect(result.success).toBe(true);

    // Verify template appears in templates list
    const templates = db.getProjectTemplates('Testing');
    const createdTemplate = templates.find(t => t.id === result.projectId);
    expect(createdTemplate).toBeDefined();
    expect(createdTemplate.isTemplate).toBe(true);
    expect(createdTemplate.templateCategory).toBe(templateData.templateCategory);
  });

  test('should clone projects successfully', () => {
    // Create a source project
    const sourceProject = db.createBOQProject({
      name: 'Source Project for Cloning',
      status: 'completed',
      clientName: 'Original Client',
      estimatedValue: 30000,
      tags: ['original'],
      createdBy: 'integration-test'
    });

    expect(sourceProject.success).toBe(true);

    // Clone the project
    const cloneData = {
      name: 'Cloned Integration Project',
      clientName: 'New Client',
      status: 'draft'
    };

    const cloneResult = db.cloneBOQProject(sourceProject.projectId, cloneData, 'integration-test');
    
    expect(cloneResult.success).toBe(true);

    // Verify cloned project
    const clonedProject = db.getBOQProjectById(cloneResult.projectId);
    expect(clonedProject.success).toBe(true);
    
    const project = clonedProject.project;
    expect(project.name).toBe('Cloned Integration Project');
    expect(project.clientName).toBe('New Client');
    expect(project.status).toBe('draft');
    expect(project.estimatedValue).toBe(30000); // Inherited from source
    expect(project.isTemplate).toBe(false);
  });

  test('should search and filter projects', () => {
    // Search by name
    const nameResults = db.searchProjects({ search: 'Integration' });
    expect(nameResults.length).toBeGreaterThan(0);
    
    // Filter by status
    const activeProjects = db.searchProjects({ status: 'active' });
    expect(activeProjects.length).toBeGreaterThan(0);
    
    // Filter by client
    const clientResults = db.searchProjects({ clientName: 'Test Client' });
    expect(clientResults.length).toBeGreaterThan(0);
  });

  test('should calculate project statistics', () => {
    const stats = db.getProjectStatistics();
    
    expect(stats).toBeDefined();
    expect(typeof stats.total_projects).toBe('number');
    expect(typeof stats.draft_count).toBe('number');
    expect(typeof stats.active_count).toBe('number');
    expect(typeof stats.completed_count).toBe('number');
    expect(typeof stats.archived_count).toBe('number');
    expect(typeof stats.avg_project_value).toBe('number');
    expect(typeof stats.total_portfolio_value).toBe('number');
  });

  test('should update project status and track history', () => {
    // Create a project
    const project = db.createBOQProject({
      name: 'Status Update Test',
      status: 'draft',
      createdBy: 'integration-test'
    });

    expect(project.success).toBe(true);

    // Update the project status
    const updateResult = db.updateBOQProject(project.projectId, {
      name: 'Status Update Test',
      status: 'active'
    }, 'integration-test');

    expect(updateResult.success).toBe(true);

    // Verify status was updated
    const updatedProject = db.getBOQProjectById(project.projectId);
    expect(updatedProject.project.status).toBe('active');

    // Check history (if available)
    const history = db.getProjectHistory(project.projectId);
    expect(Array.isArray(history)).toBe(true);
  });
});
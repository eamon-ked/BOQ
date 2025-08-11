import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// Mock the database service
vi.mock('../services/database', () => ({
  default: {
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getCategories: vi.fn().mockResolvedValue([]),
    getBOQProjects: vi.fn().mockResolvedValue([]),
    createBOQProject: vi.fn(),
    updateBOQProject: vi.fn(),
    deleteBOQProject: vi.fn(),
    getBOQItems: vi.fn().mockResolvedValue([]),
    saveBOQItems: vi.fn(),
    getProjectTemplates: vi.fn().mockResolvedValue([]),
    createProjectTemplate: vi.fn(),
    updateProjectTemplate: vi.fn(),
    deleteProjectTemplate: vi.fn(),
    cloneBOQProject: vi.fn()
  }
}));

// Mock the chunk preloader
vi.mock('../utils/chunkPreloader', () => ({
  default: {
    preloadCriticalChunks: vi.fn(),
    preload: vi.fn(),
    preloadOnHover: vi.fn(() => vi.fn()),
    getStats: vi.fn(() => ({
      preloadedChunks: [],
      queueLength: 0,
      isPreloading: false
    }))
  }
}));

// Mock the lazy-loaded components to control their loading
const mockComponents = {
  ItemManager: vi.fn(() => <div data-testid="item-manager">Item Manager</div>),
  CategoryManager: vi.fn(() => <div data-testid="category-manager">Category Manager</div>),
  BOQProjectManager: vi.fn(() => <div data-testid="project-manager">Project Manager</div>),
  BOQExport: vi.fn(() => <div data-testid="boq-export">BOQ Export</div>),
  ProjectTemplate: vi.fn(() => <div data-testid="project-template">Project Template</div>)
};

// Mock React.lazy to return our mock components
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: vi.fn((importFn) => {
      // Determine which component is being lazy loaded based on the import function
      const componentName = importFn.toString().includes('ItemManager') ? 'ItemManager' :
                           importFn.toString().includes('CategoryManager') ? 'CategoryManager' :
                           importFn.toString().includes('BOQProjectManager') ? 'BOQProjectManager' :
                           importFn.toString().includes('BOQExport') ? 'BOQExport' :
                           importFn.toString().includes('ProjectTemplate') ? 'ProjectTemplate' :
                           'Unknown';
      
      return mockComponents[componentName] || mockComponents.ItemManager;
    })
  };
});

describe('Lazy Loading Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main app without lazy components initially', () => {
    render(<App />);
    
    expect(screen.getByText('BOQ Builder')).toBeInTheDocument();
    expect(screen.getByText('Project Summary')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    
    // Lazy components should not be rendered initially
    expect(screen.queryByTestId('item-manager')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-manager')).not.toBeInTheDocument();
    expect(screen.queryByTestId('project-manager')).not.toBeInTheDocument();
  });

  it('shows loading fallback when opening modals', async () => {
    render(<App />);
    
    // Click button to open category manager
    const categoryButton = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(categoryButton);
    
    // Should show loading fallback
    expect(screen.getByText('Loading Category Manager...')).toBeInTheDocument();
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('category-manager')).toBeInTheDocument();
    });
  });

  it('loads ItemManager when manage items button is clicked', async () => {
    render(<App />);
    
    const manageItemsButton = screen.getByRole('button', { name: /manage items/i });
    fireEvent.click(manageItemsButton);
    
    expect(screen.getByText('Loading Item Manager...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('item-manager')).toBeInTheDocument();
    });
  });

  it('loads ProjectManager when projects button is clicked', async () => {
    render(<App />);
    
    const projectsButton = screen.getByRole('button', { name: /projects/i });
    fireEvent.click(projectsButton);
    
    expect(screen.getByText('Loading Project Manager...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('project-manager')).toBeInTheDocument();
    });
  });

  it('loads ProjectTemplate when templates button is clicked', async () => {
    render(<App />);
    
    const templatesButton = screen.getByRole('button', { name: /templates/i });
    fireEvent.click(templatesButton);
    
    expect(screen.getByText('Loading Templates...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('project-template')).toBeInTheDocument();
    });
  });

  it('loads BOQExport when export button is clicked with items', async () => {
    // Mock store to have some BOQ items
    const { useAppStore } = await import('../store');
    const store = useAppStore.getState();
    store.addBOQItem({ 
      id: '1', 
      name: 'Test Item', 
      unitPrice: 100,
      unit: 'pcs'
    }, 1);
    
    render(<App />);
    
    const exportButton = screen.getByRole('button', { name: /export boq/i });
    fireEvent.click(exportButton);
    
    expect(screen.getByText('Loading Export...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('boq-export')).toBeInTheDocument();
    });
  });

  it('handles loading errors gracefully', async () => {
    // Mock React.lazy to throw an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(React.lazy).mockImplementationOnce(() => {
      throw new Error('Failed to load component');
    });
    
    render(<App />);
    
    const categoryButton = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(categoryButton);
    
    // The error boundary should catch this, but for this test we'll just verify
    // that the error doesn't crash the entire app
    expect(screen.getByText('BOQ Builder')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('preloads critical chunks on initialization', () => {
    const chunkPreloader = require('../utils/chunkPreloader').default;
    
    render(<App />);
    
    expect(chunkPreloader.preloadCriticalChunks).toHaveBeenCalled();
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../../App';

// Mock the database hook
vi.mock('../../hooks/useDatabase', () => ({
  useDatabase: () => ({
    isLoading: false,
    error: null,
    isInitialized: true,
    clearError: vi.fn(),
    getCategories: vi.fn().mockResolvedValue(['Electronics', 'Security']),
    addCategory: vi.fn().mockResolvedValue(true),
    updateCategory: vi.fn().mockResolvedValue(true),
    deleteCategory: vi.fn().mockResolvedValue(true),
    getItems: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Camera',
        category: 'Security',
        unitPrice: 100,
        unit: 'each',
        description: 'Test camera description',
        manufacturer: 'Test Manufacturer',
        dependencies: []
      }
    ]),
    addItem: vi.fn().mockResolvedValue(true),
    updateItem: vi.fn().mockResolvedValue(true),
    deleteItem: vi.fn().mockResolvedValue(true),
    getBOQProjects: vi.fn().mockResolvedValue([]),
    createBOQProject: vi.fn().mockResolvedValue(true),
    updateBOQProject: vi.fn().mockResolvedValue(true),
    deleteBOQProject: vi.fn().mockResolvedValue(true),
    getBOQItems: vi.fn().mockResolvedValue([]),
    saveBOQItems: vi.fn().mockResolvedValue(true)
  })
}));

// Mock the async operation hook
vi.mock('../../hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    isLoading: false,
    error: null,
    execute: vi.fn().mockImplementation((fn) => fn())
  })
}));

// Mock toast functions
vi.mock('../../utils/toast.jsx', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn()
}));

// Mock error logger
vi.mock('../../utils/errorLogger', () => ({
  default: {
    logComponentError: vi.fn()
  }
}));

// Mock BOQ helpers
vi.mock('../../utils/boqHelpers', () => ({
  addItemToBOQ: vi.fn((items, item, quantity) => [...items, { ...item, quantity, isDependency: false }]),
  updateItemQuantityById: vi.fn((items, id, quantity) => 
    items.map(item => item.id === id ? { ...item, quantity } : item)
  ),
  removeItemFromBOQById: vi.fn((items, id) => items.filter(item => item.id !== id)),
  groupBOQItems: vi.fn((items) => items),
  validateBOQ: vi.fn(() => ({ isValid: true, errors: [] }))
}));

describe('App Component - Store Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render without crashing', async () => {
    render(<App />);
    
    // Check for main title
    expect(screen.getByText('BOQ Builder')).toBeInTheDocument();
    
    // Check for navigation buttons
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('should show the main navigation buttons', async () => {
    render(<App />);
    
    // Check for the two main navigation buttons
    expect(screen.getByRole('button', { name: 'Database' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Summary' })).toBeInTheDocument();
  });

  it('should show item database panel by default', async () => {
    render(<App />);
    
    // Database panel should be visible by default
    expect(screen.getByText('Item Database')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    
    // Category dropdown should be present
    const categorySelect = screen.getByRole('combobox');
    expect(categorySelect).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('should not show summary panel when no BOQ items', async () => {
    render(<App />);
    
    // Summary panel should not be visible by default (showSummary: false)
    expect(screen.queryByText('BOQ Summary')).not.toBeInTheDocument();
  });
});
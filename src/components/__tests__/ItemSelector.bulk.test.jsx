import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ItemSelector from '../ItemSelector';
import { useAppStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn()
}));

// Mock the advanced search hook
vi.mock('../../hooks/useAdvancedSearch', () => ({
  useAdvancedSearch: vi.fn(() => ({
    filteredItems: [
      { id: '1', name: 'Item 1', category: 'Category A', unitPrice: 100, description: 'Test item 1' },
      { id: '2', name: 'Item 2', category: 'Category B', unitPrice: 200, description: 'Test item 2' },
      { id: '3', name: 'Item 3', category: 'Category A', unitPrice: 300, description: 'Test item 3' }
    ],
    filters: { search: '', category: '', priceRange: [0, Infinity], manufacturer: '', inStock: null, tags: [] },
    hasActiveFilters: false,
    isSearching: false,
    searchStats: { searchTime: 0, appliedFilters: [] },
    resultCount: 3,
    setSearchTerm: vi.fn(),
    setCategory: vi.fn(),
    setPriceRange: vi.fn(),
    setManufacturer: vi.fn(),
    setInStock: vi.fn(),
    setTags: vi.fn(),
    clearFilters: vi.fn(),
    getHighlightedText: vi.fn(),
    getSearchSuggestions: vi.fn(),
    getFilterOptions: vi.fn(),
    filterOptions: { categories: ['Category A', 'Category B'], manufacturers: [] }
  }))
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ItemSelector Bulk Operations', () => {
  const mockStore = {
    ui: {
      modals: { itemSelector: true }
    },
    data: {
      masterDatabase: [
        { id: '1', name: 'Item 1', category: 'Category A', unitPrice: 100, description: 'Test item 1' },
        { id: '2', name: 'Item 2', category: 'Category B', unitPrice: 200, description: 'Test item 2' },
        { id: '3', name: 'Item 3', category: 'Category A', unitPrice: 300, description: 'Test item 3' }
      ],
      categories: ['Category A', 'Category B']
    }
  };

  const mockActions = {
    closeModal: vi.fn(),
    addBOQItem: vi.fn(),
    addMultipleBOQItems: vi.fn(),
    updateMultipleMasterItems: vi.fn(),
    deleteMultipleMasterItems: vi.fn(),
    duplicateMultipleMasterItems: vi.fn()
  };

  beforeEach(() => {
    useAppStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, ...mockActions });
      }
      return { ...mockStore, ...mockActions };
    });
    
    // Clear all mocks
    Object.values(mockActions).forEach(mock => mock.mockClear());
  });

  it('should toggle bulk mode', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('Add Item to BOQ')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    expect(screen.getByText('Exit Bulk Mode')).toBeInTheDocument();
  });

  it('should show checkboxes in bulk mode', () => {
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    
    // Should show checkboxes for each item
    const checkboxes = screen.getAllByRole('button');
    const itemCheckboxes = checkboxes.filter(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg').getAttribute('class')?.includes('text-gray-400') ||
       button.querySelector('svg').getAttribute('class')?.includes('text-blue-600'))
    );
    
    expect(itemCheckboxes.length).toBeGreaterThan(0);
  });

  it('should select items and show bulk operations toolbar', async () => {
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    
    // Click on first item to select it
    const itemCards = screen.getAllByText(/Item \d/);
    fireEvent.click(itemCards[0].closest('div'));
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('item selected')).toBeInTheDocument();
    });
    
    // Should show bulk operations toolbar
    expect(screen.getByTitle('Add to BOQ 1 selected items')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should select all items', async () => {
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
  });

  it('should perform bulk add to BOQ operation', async () => {
    mockActions.addMultipleBOQItems.mockResolvedValue({ successful: ['1', '2'], failed: [] });
    
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTitle('Add to BOQ 3 selected items'));
    
    await waitFor(() => {
      expect(mockActions.addMultipleBOQItems).toHaveBeenCalled();
    });
  });

  it('should show confirmation for delete operation', async () => {
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Delete'));
    
    expect(screen.getByText(/Are you sure you want to delete 3 selected items/)).toBeInTheDocument();
  });

  it('should clear selection when exiting bulk mode', async () => {
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Exit Bulk Mode'));
    
    expect(screen.getByText('Add Item to BOQ')).toBeInTheDocument();
    expect(screen.queryByText('items selected')).not.toBeInTheDocument();
  });

  it('should handle bulk operation errors gracefully', async () => {
    const error = new Error('Bulk operation failed');
    mockActions.addMultipleBOQItems.mockRejectedValue(error);
    
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTitle('Add to BOQ 3 selected items'));
    
    await waitFor(() => {
      expect(mockActions.addMultipleBOQItems).toHaveBeenCalled();
    });
    
    // Should handle error gracefully without crashing
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
  });

  it('should provide detailed feedback for partial operation failures', async () => {
    // Mock partial failure scenario
    mockActions.addMultipleBOQItems.mockImplementation(() => {
      throw new Error('Some items failed to add');
    });
    
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    
    // Select first two items
    const itemCards = screen.getAllByText(/Item \d/);
    fireEvent.click(itemCards[0].closest('div'));
    fireEvent.click(itemCards[1].closest('div'));
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTitle('Add to BOQ 2 selected items'));
    
    await waitFor(() => {
      expect(mockActions.addMultipleBOQItems).toHaveBeenCalled();
    });
    
    // Should still show bulk operations interface after error
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
  });

  it('should handle duplicate operation correctly', async () => {
    mockActions.duplicateMultipleMasterItems.mockResolvedValue({ successful: ['1', '2'], failed: [] });
    
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Duplicate'));
    
    await waitFor(() => {
      expect(mockActions.duplicateMultipleMasterItems).toHaveBeenCalledWith(['1', '2', '3']);
    });
  });

  it('should provide additional feedback for delete operations affecting BOQ', async () => {
    // Mock store state with items in BOQ
    const mockStoreWithBOQ = {
      ...mockStore,
      data: {
        ...mockStore.data,
        boqItems: [
          { id: '1', name: 'Item 1', quantity: 2 },
          { id: '2', name: 'Item 2', quantity: 1 }
        ]
      }
    };

    useAppStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStoreWithBOQ, ...mockActions });
      }
      return { ...mockStoreWithBOQ, ...mockActions };
    });

    // Mock getState for the enhanced delete operation
    useAppStore.getState = vi.fn(() => mockStoreWithBOQ);
    
    mockActions.deleteMultipleMasterItems.mockResolvedValue({ successful: ['1', '2'], failed: [] });
    
    render(<ItemSelector />);
    
    fireEvent.click(screen.getByText('Bulk Mode'));
    
    // Select first two items
    const itemCards = screen.getAllByText(/Item \d/);
    fireEvent.click(itemCards[0].closest('div'));
    fireEvent.click(itemCards[1].closest('div'));
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('items selected')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Delete'));
    
    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete 2 selected items/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Confirm Delete/i }));
    
    await waitFor(() => {
      expect(mockActions.deleteMultipleMasterItems).toHaveBeenCalledWith(['1', '2']);
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ItemSelector from '../ItemSelector';
import { useAppStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

const mockStoreState = {
  ui: {
    modals: {
      itemSelector: true,
    },
  },
  data: {
    masterDatabase: [
      {
        id: 'item-1',
        name: 'Test Camera',
        category: 'CCTV',
        unitPrice: 100,
        unit: 'pcs',
        description: 'HD Security Camera',
        manufacturer: 'TestBrand',
        dependencies: [],
      },
      {
        id: 'item-2',
        name: 'Power Supply',
        category: 'Power',
        unitPrice: 25,
        unit: 'pcs',
        description: 'Power adapter',
        manufacturer: 'PowerCorp',
        dependencies: [],
      },
      {
        id: 'item-3',
        name: 'Network Switch',
        category: 'Network',
        unitPrice: 150,
        unit: 'pcs',
        description: 'Managed switch',
        manufacturer: 'NetBrand',
        dependencies: [{ itemId: 'item-2', quantity: 1 }],
      },
    ],
    categories: ['CCTV', 'Power', 'Network'],
  },
};

const mockActions = {
  closeModal: vi.fn(),
  addBOQItem: vi.fn(),
};

describe('ItemSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const state = {
          ...mockStoreState,
          ...mockActions,
        };
        return selector(state);
      }
      return mockStoreState;
    });
  });

  it('renders when modal is open', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('Add Item to BOQ')).toBeInTheDocument();
    expect(screen.getByText('3 items available')).toBeInTheDocument();
  });

  it('does not render when modal is closed', () => {
    useAppStore.mockImplementation((selector) => {
      const state = {
        ...mockStoreState,
        ui: { modals: { itemSelector: false } },
        ...mockActions,
      };
      return selector(state);
    });

    const { container } = render(<ItemSelector />);
    expect(container.firstChild).toBeNull();
  });

  it('displays all items initially', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('Test Camera')).toBeInTheDocument();
    expect(screen.getByText('Power Supply')).toBeInTheDocument();
    expect(screen.getByText('Network Switch')).toBeInTheDocument();
  });

  it('filters items by search term', async () => {
    render(<ItemSelector />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, description, or manufacturer...');
    fireEvent.change(searchInput, { target: { value: 'camera' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.queryByText('Power Supply')).not.toBeInTheDocument();
      expect(screen.queryByText('Network Switch')).not.toBeInTheDocument();
    });
  });

  it('filters items by category', async () => {
    render(<ItemSelector />);
    
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'CCTV' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.queryByText('Power Supply')).not.toBeInTheDocument();
      expect(screen.queryByText('Network Switch')).not.toBeInTheDocument();
    });
  });

  it('shows dependencies information', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('+1 auto-deps')).toBeInTheDocument();
    expect(screen.getByText('Will automatically add:')).toBeInTheDocument();
  });

  it('adds item to BOQ with correct quantity', async () => {
    render(<ItemSelector />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '3' } });
    
    const addButton = screen.getAllByText('Add to BOQ')[0];
    fireEvent.click(addButton);
    
    expect(mockActions.addBOQItem).toHaveBeenCalledWith(
      mockStoreState.data.masterDatabase[0],
      3
    );
  });

  it('resets quantity after adding item', async () => {
    render(<ItemSelector />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const addButton = screen.getAllByText('Add to BOQ')[0];
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(quantityInput.value).toBe('1');
    });
  });

  it('closes modal when close button is clicked', () => {
    render(<ItemSelector />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);
    
    expect(mockActions.closeModal).toHaveBeenCalledWith('itemSelector');
  });

  it('shows no results message when no items match filter', async () => {
    render(<ItemSelector />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, description, or manufacturer...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  it('calculates total price correctly', () => {
    render(<ItemSelector />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    // Should show Total: $200.00 for Test Camera (100 * 2)
    expect(screen.getByText('Total: $200.00')).toBeInTheDocument();
  });

  it('shows manufacturer information', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
    expect(screen.getByText('PowerCorp')).toBeInTheDocument();
    expect(screen.getByText('NetBrand')).toBeInTheDocument();
  });
});
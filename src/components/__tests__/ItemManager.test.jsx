import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ItemManager from '../ItemManager';
import { useAppStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

const mockStoreState = {
  ui: {
    modals: {
      itemEditor: true,
    },
  },
  data: {
    masterDatabase: [
      {
        id: 'item-1',
        name: 'Test Camera',
        category: 'CCTV',
        unitPrice: 100,
        unitNetPrice: 90,
        unit: 'pcs',
        description: 'HD Security Camera',
        manufacturer: 'TestBrand',
        partNumber: 'CAM001',
        serviceDuration: 12,
        estimatedLeadTime: 5,
        pricingTerm: 'Each',
        discount: 10,
        dependencies: [],
      },
    ],
    categories: ['CCTV', 'Power', 'Network'],
  },
};

const mockActions = {
  closeModal: vi.fn(),
  addMasterItem: vi.fn(),
  updateMasterItem: vi.fn(),
  deleteMasterItem: vi.fn(),
};

describe('ItemManager', () => {
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
    render(<ItemManager />);
    
    expect(screen.getByText('Item Database Manager')).toBeInTheDocument();
    expect(screen.getByText('1 items in database')).toBeInTheDocument();
  });

  it('does not render when modal is closed', () => {
    useAppStore.mockImplementation((selector) => {
      const state = {
        ...mockStoreState,
        ui: { modals: { itemEditor: false } },
        ...mockActions,
      };
      return selector(state);
    });

    const { container } = render(<ItemManager />);
    expect(container.firstChild).toBeNull();
  });

  it('displays existing items', () => {
    render(<ItemManager />);
    
    expect(screen.getByText('Test Camera')).toBeInTheDocument();
    expect(screen.getByText('$100/pcs')).toBeInTheDocument();
    expect(screen.getByText('HD Security Camera')).toBeInTheDocument();
  });

  it('opens add item form', () => {
    render(<ItemManager />);
    
    const addButton = screen.getByRole('button', { name: /add new item/i });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Fill in the details to create a new item')).toBeInTheDocument();
  });

  it('opens edit item form', () => {
    render(<ItemManager />);
    
    const editButton = screen.getByTitle('Edit item');
    fireEvent.click(editButton);
    
    expect(screen.getByText('Edit Item')).toBeInTheDocument();
    expect(screen.getByText('Modify item details below')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Camera')).toBeInTheDocument();
  });

  it('deletes item when delete button is clicked', () => {
    render(<ItemManager />);
    
    const deleteButton = screen.getByTitle('Delete item');
    fireEvent.click(deleteButton);
    
    expect(mockActions.deleteMasterItem).toHaveBeenCalledWith('item-1');
  });

  it('adds new item with generated ID', async () => {
    render(<ItemManager />);
    
    const addButton = screen.getByText('Add New Item');
    fireEvent.click(addButton);
    
    // Fill in required fields
    const nameInput = screen.getByPlaceholderText('Item name');
    fireEvent.change(nameInput, { target: { value: 'New Camera' } });
    
    const categorySelect = screen.getByDisplayValue('Select category');
    fireEvent.change(categorySelect, { target: { value: 'CCTV' } });
    
    const priceInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(priceInput, { target: { value: '150' } });
    
    const submitButton = screen.getByText('Add Item');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockActions.addMasterItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Camera',
          category: 'CCTV',
          unitPrice: 150,
          id: expect.stringMatching(/^cctv-new-camera-\d+$/),
        })
      );
    });
  });

  it('updates existing item', async () => {
    render(<ItemManager />);
    
    const editButton = screen.getByTitle('Edit item');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('Test Camera');
    fireEvent.change(nameInput, { target: { value: 'Updated Camera' } });
    
    const submitButton = screen.getByText('Update Item');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockActions.updateMasterItem).toHaveBeenCalledWith(
        'item-1',
        expect.objectContaining({
          name: 'Updated Camera',
        })
      );
    });
  });

  it('validates required fields', async () => {
    render(<ItemManager />);
    
    const addButton = screen.getByText('Add New Item');
    fireEvent.click(addButton);
    
    const submitButton = screen.getByText('Add Item');
    fireEvent.click(submitButton);
    
    // Should show alert for missing required fields
    // Note: In a real test, you might want to mock window.alert
    // or use a proper notification system
  });

  it('calculates net price from discount', async () => {
    render(<ItemManager />);
    
    const addButton = screen.getByText('Add New Item');
    fireEvent.click(addButton);
    
    const priceInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(priceInput, { target: { value: '100' } });
    
    const discountInput = screen.getByPlaceholderText('0.0');
    fireEvent.change(discountInput, { target: { value: '10' } });
    
    const netPriceInput = screen.getByPlaceholderText('Auto-calculated');
    expect(netPriceInput.value).toBe('90.00');
  });

  it('shows generated ID preview for new items', async () => {
    render(<ItemManager />);
    
    const addButton = screen.getByText('Add New Item');
    fireEvent.click(addButton);
    
    const nameInput = screen.getByPlaceholderText('Item name');
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    
    const categorySelect = screen.getByDisplayValue('Select category');
    fireEvent.change(categorySelect, { target: { value: 'CCTV' } });
    
    await waitFor(() => {
      expect(screen.getByText('Generated ID Preview:')).toBeInTheDocument();
      expect(screen.getByText(/cctv-test-item-\d+/)).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', () => {
    render(<ItemManager />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);
    
    expect(mockActions.closeModal).toHaveBeenCalledWith('itemEditor');
  });

  it('cancels form and resets state', () => {
    render(<ItemManager />);
    
    const addButton = screen.getByRole('button', { name: /add new item/i });
    fireEvent.click(addButton);
    
    const nameInput = screen.getByPlaceholderText('Item name');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Form should be hidden - check for form-specific text
    expect(screen.queryByText('Fill in the details to create a new item')).not.toBeInTheDocument();
  });

  it('shows progress indicator for form completion', () => {
    render(<ItemManager />);
    
    const addButton = screen.getByText('Add New Item');
    fireEvent.click(addButton);
    
    expect(screen.getByText('0/3 required fields')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('Item name');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    
    expect(screen.getByText('1/3 required fields')).toBeInTheDocument();
  });
});
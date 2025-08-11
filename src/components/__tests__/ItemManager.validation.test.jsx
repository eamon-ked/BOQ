import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import ItemManager from '../ItemManager';
import { useAppStore } from '../../store';

// Mock dependencies
vi.mock('react-hot-toast');
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

describe('ItemManager Form Validation', () => {
  const mockStore = {
    ui: { modals: { itemEditor: true } },
    data: { 
      masterDatabase: [],
      categories: ['CCTV', 'Access Control', 'Network']
    },
    closeModal: vi.fn(),
    setMasterDatabase: vi.fn(),
    addMasterItem: vi.fn().mockResolvedValue(true),
    updateMasterItem: vi.fn().mockResolvedValue(true),
    deleteMasterItem: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Add Item');
    expect(submitButton).toBeDisabled(); // Should be disabled due to validation

    // Fill name but not category
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Item');

    // Submit button should still be disabled
    expect(submitButton).toBeDisabled();

    // Fill category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Now submit button should be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should validate price fields correctly', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Item');

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Test negative price validation
    const priceInput = screen.getByLabelText(/unit list price/i);
    await user.type(priceInput, '-10');

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument();
    });

    // Clear and enter valid price
    await user.clear(priceInput);
    await user.type(priceInput, '100');

    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText(/must be a positive number/i)).not.toBeInTheDocument();
    });
  });

  it('should validate string length limits', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Test name length validation
    const nameInput = screen.getByLabelText(/name/i);
    const longName = 'a'.repeat(300); // Exceeds 255 character limit
    await user.type(nameInput, longName);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be less than 255 characters/i)).toBeInTheDocument();
    });
  });

  it('should prevent form submission with validation errors', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Fill name with invalid data
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'a'.repeat(300)); // Too long

    // Fill category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Submit button should be disabled due to validation errors
    const submitButton = screen.getByText('Add Item');
    expect(submitButton).toBeDisabled();

    // Fix the validation error
    await user.clear(nameInput);
    await user.type(nameInput, 'Valid Name');

    // Submit button should now be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should show real-time validation feedback', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Start typing in name field
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'T');

    // Should not show error yet (field is valid)
    expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument();

    // Clear the field
    await user.clear(nameInput);

    // Should show validation error after clearing
    await waitFor(() => {
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });
  });

  it('should validate discount calculation', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Item');

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Set unit price
    const priceInput = screen.getByLabelText(/unit list price/i);
    await user.type(priceInput, '100');

    // Set discount
    const discountInput = screen.getByLabelText(/discount/i);
    await user.type(discountInput, '10');

    // Net price should be automatically calculated
    const netPriceInput = screen.getByLabelText(/unit net price/i);
    await waitFor(() => {
      expect(netPriceInput.value).toBe('90.00');
    });
  });

  it('should successfully submit valid form data', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Fill all required fields with valid data
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Camera');

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    const priceInput = screen.getByLabelText(/unit list price/i);
    await user.type(priceInput, '150');

    // Submit the form
    const submitButton = screen.getByText('Add Item');
    await user.click(submitButton);

    // Should call addMasterItem
    await waitFor(() => {
      expect(mockStore.addMasterItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Camera',
          category: 'CCTV',
          unitPrice: 150
        })
      );
    });

    // Should show success toast
    expect(toast.success).toHaveBeenCalledWith(
      'Added item "Test Camera"',
      expect.any(Object)
    );
  });

  it('should validate dependencies correctly', async () => {
    const user = userEvent.setup();
    
    // Add some items to the store for dependency selection
    mockStore.data.masterDatabase = [
      { id: 'item1', name: 'Camera 1', category: 'CCTV' },
      { id: 'item2', name: 'Cable 1', category: 'Cabling' }
    ];

    render(<ItemManager />);

    // Click "Add New Item" button
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Item');

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Add a dependency
    const addDependencyButton = screen.getByText('Add Dependency');
    await user.click(addDependencyButton);

    // Should show dependency form
    expect(screen.getByText('Select item')).toBeInTheDocument();

    // Select a dependency item
    const dependencySelect = screen.getByDisplayValue('');
    await user.selectOptions(dependencySelect, 'item1');

    // Set quantity
    const quantityInput = screen.getByDisplayValue('1');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Form should still be valid
    const submitButton = screen.getByText('Add Item');
    expect(submitButton).not.toBeDisabled();
  });
});
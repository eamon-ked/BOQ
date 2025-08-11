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

describe('ItemManager Form Validation Integration', () => {
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

  it('should have comprehensive form validation integrated', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Open the form
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Verify form is displayed
    expect(screen.getByText('Fill in the details to create a new item')).toBeInTheDocument();

    // Verify submit button is initially disabled (form validation prevents submission)
    const submitButton = screen.getByRole('button', { name: /add item/i });
    expect(submitButton).toBeDisabled();

    // Test real-time validation by filling required fields
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Camera');

    // Submit should still be disabled (missing category)
    expect(submitButton).toBeDisabled();

    // Fill category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Fill required price field
    const priceInput = screen.getByLabelText(/unit list price/i);
    await user.type(priceInput, '100');

    // Now submit should be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Test validation error highlighting by entering invalid data
    await user.clear(nameInput);
    
    // Submit should be disabled again due to validation
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    // Fix the validation error
    await user.type(nameInput, 'Valid Camera Name');

    // Submit should be enabled again (all required fields are filled)
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Test successful form submission
    await user.click(submitButton);

    // Verify the form was submitted with validated data
    await waitFor(() => {
      expect(mockStore.addMasterItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ValidCameraName', // Sanitized name (spaces removed)
          category: 'CCTV',
          unitPrice: 100,
          unitNetPrice: 100,
          unit: 'pcs',
          pricingTerm: 'Each'
        })
      );
    });
  });

  it('should validate numeric fields correctly', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Open the form
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Item');

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'CCTV');

    // Test price validation
    const priceInput = screen.getByLabelText(/unit list price/i);
    await user.type(priceInput, '-10');

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument();
    });

    // Submit should be disabled
    const submitButton = screen.getByRole('button', { name: /add item/i });
    expect(submitButton).toBeDisabled();

    // Fix the price
    await user.clear(priceInput);
    await user.type(priceInput, '100');

    // Error should disappear and submit should be enabled
    await waitFor(() => {
      expect(screen.queryByText(/must be a positive number/i)).not.toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should provide user guidance through validation messages', async () => {
    const user = userEvent.setup();
    render(<ItemManager />);

    // Open the form
    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    // Test that required field indicators are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getAllByText('*')).toHaveLength(2); // Required field indicators for Name and Category

    // Test that validation provides clear guidance
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'a'.repeat(300)); // Exceeds max length

    await waitFor(() => {
      expect(screen.getByText(/must be less than 255 characters/i)).toBeInTheDocument();
    });
  });
});
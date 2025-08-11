import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import CategoryManager from '../CategoryManager';

// Mock dependencies
vi.mock('react-hot-toast');

describe('CategoryManager Form Validation', () => {
    const mockProps = {
        isOpen: true,
        onClose: vi.fn(),
        categories: ['CCTV', 'Access Control', 'Network'],
        onAddCategory: vi.fn().mockResolvedValue(true),
        onUpdateCategory: vi.fn().mockResolvedValue(true),
        onDeleteCategory: vi.fn().mockResolvedValue(true),
        error: null,
        clearError: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show validation errors for empty category name', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Submit button should be disabled initially
        const submitButton = screen.getByText('Add Category', { selector: 'button[type="submit"]' });
        expect(submitButton).toBeDisabled();

        // Try to type and then clear the field
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'Test');
        await user.clear(nameInput);

        // Should show validation error
        await waitFor(() => {
            expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
        });

        // Submit button should remain disabled
        expect(submitButton).toBeDisabled();
    });

    it('should validate category name length', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter a name that's too long
        const nameInput = screen.getByLabelText(/category name/i);
        const longName = 'a'.repeat(150); // Exceeds 100 character limit
        await user.type(nameInput, longName);

        // Should show validation error
        await waitFor(() => {
            expect(screen.getByText(/must be less than 100 characters/i)).toBeInTheDocument();
        });

        // Submit button should be disabled
        const submitButton = screen.getByText('Add Category', { selector: 'button[type="submit"]' });
        expect(submitButton).toBeDisabled();
    });

    it('should prevent duplicate category creation', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter an existing category name
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'CCTV'); // This already exists in mockProps.categories

        // Submit the form
        const submitButton = screen.getByText('Add Category', { selector: 'button[type="submit"]' });
        await user.click(submitButton);

        // Should show duplicate error toast
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                'Category already exists. Please use a unique name.',
                expect.any(Object)
            );
        });

        // Should not call onAddCategory
        expect(mockProps.onAddCategory).not.toHaveBeenCalled();
    });

    it('should enable submit button with valid input', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter a valid category name
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'New Category');

        // Submit button should be enabled
        const submitButton = screen.getByText('Add Category', { selector: 'button[type="submit"]' });
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });

    it('should successfully submit valid category', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter a valid category name
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'New Category');

        // Submit the form
        const submitButton = screen.getByText('Add Category', { selector: 'button[type="submit"]' });
        await user.click(submitButton);

        // Should call onAddCategory with the correct name
        await waitFor(() => {
            expect(mockProps.onAddCategory).toHaveBeenCalledWith('New Category');
        });

        // Should show success toast
        expect(toast.success).toHaveBeenCalledWith(
            'Added category "New Category"',
            expect.any(Object)
        );
    });

    it('should handle edit mode correctly', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click edit button for existing category
        const editButtons = screen.getAllByTitle('Edit category');
        await user.click(editButtons[0]);

        // Should populate form with existing category name
        const nameInput = screen.getByLabelText(/category name/i);
        expect(nameInput.value).toBe('CCTV');

        // Change the name
        await user.clear(nameInput);
        await user.type(nameInput, 'Updated CCTV');

        // Submit the form
        const submitButton = screen.getByText('Update Category');
        await user.click(submitButton);

        // Should call onUpdateCategory
        await waitFor(() => {
            expect(mockProps.onUpdateCategory).toHaveBeenCalledWith('CCTV', 'Updated CCTV');
        });

        // Should show success toast
        expect(toast.success).toHaveBeenCalledWith(
            'Updated category "Updated CCTV"',
            expect.any(Object)
        );
    });

    it('should show real-time validation feedback', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        const nameInput = screen.getByLabelText(/category name/i);

        // Type a valid name
        await user.type(nameInput, 'Valid Name');

        // Should not show any errors
        expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/must be less than 100 characters/i)).not.toBeInTheDocument();

        // Clear and type invalid long name
        await user.clear(nameInput);
        await user.type(nameInput, 'a'.repeat(150));

        // Should show length validation error
        await waitFor(() => {
            expect(screen.getByText(/must be less than 100 characters/i)).toBeInTheDocument();
        });
    });

    it('should disable form during submission', async () => {
        const user = userEvent.setup();

        // Make onAddCategory return a pending promise
        const pendingPromise = new Promise(() => { }); // Never resolves
        mockProps.onAddCategory.mockReturnValue(pendingPromise);

        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter a valid category name
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'New Category');

        // Submit the form
        const submitButton = screen.getByText('Add Category', { selector: 'button[type="submit"]' });
        await user.click(submitButton);

        // Button should show loading state and be disabled
        await waitFor(() => {
            expect(screen.getByText('Adding...')).toBeInTheDocument();
        });

        const loadingButton = screen.getByText('Adding...');
        expect(loadingButton).toBeDisabled();

        // Cancel button should also be disabled
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeDisabled();
    });

    it('should show validation error count', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter invalid data
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'a'.repeat(150)); // Too long

        // Should show validation error count
        await waitFor(() => {
            expect(screen.getByText(/1 validation error/i)).toBeInTheDocument();
        });
    });

    it('should handle form reset correctly', async () => {
        const user = userEvent.setup();
        render(<CategoryManager {...mockProps} />);

        // Click "Add Category" button
        const addButton = screen.getByText('Add Category');
        await user.click(addButton);

        // Enter some data
        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'Test Category');

        // Click cancel
        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        // Form should be hidden
        expect(screen.queryByLabelText(/category name/i)).not.toBeInTheDocument();

        // Click "Add Category" again
        await user.click(addButton);

        // Form should be reset
        const newNameInput = screen.getByLabelText(/category name/i);
        expect(newNameInput.value).toBe('');
    });
});
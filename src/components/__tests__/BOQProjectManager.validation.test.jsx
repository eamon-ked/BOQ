import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import BOQProjectManager from '../BOQProjectManager';

// Mock dependencies
vi.mock('react-hot-toast');

describe('BOQProjectManager Form Validation', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentBOQItems: [],
    onLoadBOQ: vi.fn(),
    onSaveBOQ: vi.fn(),
    getBOQProjects: vi.fn().mockResolvedValue([
      {
        id: 'project1',
        name: 'Test Project 1',
        description: 'Test description',
        updated_at: '2024-01-01T00:00:00Z',
        item_count: 5,
        total_value: 1000
      }
    ]),
    createBOQProject: vi.fn().mockResolvedValue('new-project-id'),
    updateBOQProject: vi.fn().mockResolvedValue(true),
    deleteBOQProject: vi.fn().mockResolvedValue(true),
    getBOQItems: vi.fn().mockResolvedValue([]),
    saveBOQItems: vi.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show validation errors for empty project name', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Submit button should be disabled initially
    const submitButton = screen.getByText('Create Project');
    expect(submitButton).toBeDisabled();

    // Try to type and then clear the field
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test');
    await user.clear(nameInput);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });

    // Submit button should remain disabled
    expect(submitButton).toBeDisabled();
  });

  it('should validate project name length', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter a name that's too long
    const nameInput = screen.getByLabelText(/project name/i);
    const longName = 'a'.repeat(300); // Exceeds 255 character limit
    await user.type(nameInput, longName);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be less than 255 characters/i)).toBeInTheDocument();
    });

    // Submit button should be disabled
    const submitButton = screen.getByText('Create Project');
    expect(submitButton).toBeDisabled();
  });

  it('should validate description length', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter valid name
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Valid Project Name');

    // Enter description that's too long
    const descriptionInput = screen.getByLabelText(/description/i);
    const longDescription = 'a'.repeat(2500); // Exceeds 2000 character limit
    await user.type(descriptionInput, longDescription);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be less than 2000 characters/i)).toBeInTheDocument();
    });

    // Submit button should be disabled
    const submitButton = screen.getByText('Create Project');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button with valid input', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter a valid project name
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'New Project');

    // Submit button should be enabled
    const submitButton = screen.getByText('Create Project');
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should successfully create new project', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter valid project data
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'New Test Project');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'This is a test project description');

    // Submit the form
    const submitButton = screen.getByText('Create Project');
    await user.click(submitButton);

    // Should call createBOQProject with the correct data
    await waitFor(() => {
      expect(mockProps.createBOQProject).toHaveBeenCalledWith(
        'New Test Project',
        'This is a test project description'
      );
    });

    // Should show success toast
    expect(toast.success).toHaveBeenCalledWith(
      'Created project "New Test Project"',
      expect.any(Object)
    );
  });

  it('should handle edit mode correctly', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click edit button for existing project
    const editButton = screen.getByTitle('Edit project');
    await user.click(editButton);

    // Should populate form with existing project data
    const nameInput = screen.getByLabelText(/project name/i);
    expect(nameInput.value).toBe('Test Project 1');

    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput.value).toBe('Test description');

    // Change the name
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Test Project');

    // Submit the form
    const submitButton = screen.getByText('Update Project');
    await user.click(submitButton);

    // Should call updateBOQProject
    await waitFor(() => {
      expect(mockProps.updateBOQProject).toHaveBeenCalledWith(
        'project1',
        'Updated Test Project',
        'Test description'
      );
    });

    // Should show success toast
    expect(toast.success).toHaveBeenCalledWith(
      'Updated project "Updated Test Project"',
      expect.any(Object)
    );
  });

  it('should show real-time validation feedback', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    const nameInput = screen.getByLabelText(/project name/i);

    // Type a valid name
    await user.type(nameInput, 'Valid Name');

    // Should not show any errors
    expect(screen.queryByText(/this field is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/must be less than 255 characters/i)).not.toBeInTheDocument();

    // Clear and type invalid long name
    await user.clear(nameInput);
    await user.type(nameInput, 'a'.repeat(300));

    // Should show length validation error
    await waitFor(() => {
      expect(screen.getByText(/must be less than 255 characters/i)).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    
    // Make createBOQProject return a pending promise
    const pendingPromise = new Promise(() => {}); // Never resolves
    mockProps.createBOQProject.mockReturnValue(pendingPromise);

    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter a valid project name
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'New Project');

    // Submit the form
    const submitButton = screen.getByText('Create Project');
    await user.click(submitButton);

    // Button should show loading state and be disabled
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    const loadingButton = screen.getByText('Creating...');
    expect(loadingButton).toBeDisabled();

    // Cancel button should also be disabled
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('should show validation error count', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter invalid data (too long name and description)
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'a'.repeat(300));

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'a'.repeat(2500));

    // Should show validation error count
    await waitFor(() => {
      expect(screen.getByText(/2 validation error/i)).toBeInTheDocument();
    });
  });

  it('should handle form reset correctly', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Enter some data
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test Project');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test description');

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Form should be hidden
    expect(screen.queryByLabelText(/project name/i)).not.toBeInTheDocument();

    // Click "New Project" again
    await user.click(newProjectButton);

    // Form should be reset
    const newNameInput = screen.getByLabelText(/project name/i);
    expect(newNameInput.value).toBe('');

    const newDescriptionInput = screen.getByLabelText(/description/i);
    expect(newDescriptionInput.value).toBe('');
  });

  it('should show note about current BOQ items when creating project', async () => {
    const user = userEvent.setup();
    
    // Set up props with current BOQ items
    const propsWithItems = {
      ...mockProps,
      currentBOQItems: [
        { id: 'item1', name: 'Test Item 1' },
        { id: 'item2', name: 'Test Item 2' }
      ]
    };

    render(<BOQProjectManager {...propsWithItems} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Click "New Project" button
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Should show note about current BOQ items
    expect(screen.getByText(/your current boq with 2 items will be saved/i)).toBeInTheDocument();
  });
});
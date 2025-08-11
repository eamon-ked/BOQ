import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import BOQProjectManager from '../BOQProjectManager';

// Mock dependencies
vi.mock('react-hot-toast');

describe('BOQProjectManager Form Validation Integration', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentBOQItems: [],
    onLoadBOQ: vi.fn(),
    onSaveBOQ: vi.fn(),
    getBOQProjects: vi.fn().mockResolvedValue([]),
    createBOQProject: vi.fn().mockResolvedValue({ projectId: 'test-id' }),
    updateBOQProject: vi.fn().mockResolvedValue(true),
    deleteBOQProject: vi.fn().mockResolvedValue(true),
    getBOQItems: vi.fn().mockResolvedValue([]),
    saveBOQItems: vi.fn().mockResolvedValue(true),
    cloneBOQProject: vi.fn().mockResolvedValue({ projectId: 'clone-id' })
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have comprehensive form validation integrated', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    // Open the form
    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Verify form is displayed
    expect(screen.getByText('Create New Project')).toBeInTheDocument();

    // Verify submit button is initially disabled (form validation prevents submission)
    const submitButton = screen.getByRole('button', { name: /create project/i });
    expect(submitButton).toBeDisabled();

    // Test real-time validation by filling required field
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test Project');

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
    await user.type(nameInput, 'Valid Project Name');

    // Submit should be enabled again
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Test successful form submission
    await user.click(submitButton);

    // Verify the form was submitted with validated data
    await waitFor(() => {
      expect(mockProps.createBOQProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Valid Project Name',
          status: 'draft'
        })
      );
    });
  });

  it('should validate email field correctly', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load and open form
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Fill required field
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test Project');

    // Test email validation
    const emailInput = screen.getByLabelText(/client email/i);
    await user.type(emailInput, 'invalid-email');

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Submit should be disabled
    const submitButton = screen.getByRole('button', { name: /create project/i });
    expect(submitButton).toBeDisabled();

    // Fix the email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');

    // Error should disappear and submit should be enabled
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should validate numeric fields correctly', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load and open form
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Fill required field
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test Project');

    // Test estimated value validation
    const valueInput = screen.getByLabelText(/estimated value/i);
    await user.type(valueInput, '-100');

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be a valid number/i)).toBeInTheDocument();
    });

    // Submit should be disabled
    const submitButton = screen.getByRole('button', { name: /create project/i });
    expect(submitButton).toBeDisabled();

    // Fix the value
    await user.clear(valueInput);
    await user.type(valueInput, '50000');

    // Error should disappear and submit should be enabled
    await waitFor(() => {
      expect(screen.queryByText(/must be a valid number/i)).not.toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should provide user guidance through validation messages', async () => {
    const user = userEvent.setup();
    render(<BOQProjectManager {...mockProps} />);

    // Wait for projects to load and open form
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('New Project');
    await user.click(newProjectButton);

    // Test that required field indicators are present
    expect(screen.getByText('Project Name')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument(); // Required field indicator

    // Test that validation provides clear guidance
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'a'.repeat(300)); // Exceeds max length

    await waitFor(() => {
      expect(screen.getByText(/must be less than 255 characters/i)).toBeInTheDocument();
    });
  });

  it('should handle edit mode validation correctly', async () => {
    // Mock a project for editing
    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      description: 'Test Description',
      status: 'active',
      client_name: 'Test Client',
      client_email: 'test@example.com',
      location: 'Test Location',
      estimated_value: 10000,
      priority: 2
    };

    const propsWithProject = {
      ...mockProps,
      getBOQProjects: vi.fn().mockResolvedValue([mockProject])
    };

    const user = userEvent.setup();
    render(<BOQProjectManager {...propsWithProject} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click edit on the project
    const editButton = screen.getByTitle('Edit project');
    await user.click(editButton);

    // Verify edit form is displayed
    expect(screen.getByText('Edit Project')).toBeInTheDocument();

    // The form should be pre-filled and valid
    const submitButton = screen.getByRole('button', { name: /update project/i });
    expect(submitButton).not.toBeDisabled();

    // Clear the name to test validation
    const nameInput = screen.getByLabelText(/project name/i);
    await user.clear(nameInput);

    // Submit should be disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Fill valid name
    await user.type(nameInput, 'Updated Project');

    // Submit should be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Test successful update
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProps.updateBOQProject).toHaveBeenCalledWith(
        'test-project',
        expect.objectContaining({
          name: 'Updated Project'
        })
      );
    });
  });
});
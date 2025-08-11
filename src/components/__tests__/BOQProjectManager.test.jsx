import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BOQProjectManager from '../BOQProjectManager';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the validation hook
let mockSubmitCallback = null;
vi.mock('../../hooks/useValidatedForm', () => ({
  useValidatedForm: vi.fn((config) => {
    mockSubmitCallback = config.onSubmit;
    return {
      values: {
        name: '',
        description: '',
        status: 'draft',
        clientName: '',
        clientContact: '',
        clientEmail: '',
        location: '',
        estimatedValue: '',
        deadline: '',
        priority: 1,
        notes: ''
      },
      errors: {},
      warnings: {},
      touched: {},
      isValid: true,
      isSubmitting: false,
      setValue: vi.fn(),
      setValues: vi.fn(),
      handleSubmit: vi.fn((callback) => async (e) => {
        e.preventDefault();
        await callback({
          name: 'Test Project',
          description: 'Test Description',
          status: 'draft',
          clientName: 'Test Client',
          clientContact: 'John Doe',
          clientEmail: 'john@test.com',
          location: 'Test Location',
          estimatedValue: '10000',
          deadline: '2024-12-31',
          priority: 2,
          notes: 'Test notes'
        });
      }),
      reset: vi.fn(),
      getFieldProps: vi.fn((field) => ({
        name: field,
        value: '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        'aria-invalid': false,
        'aria-describedby': `${field}-error`
      })),
      getFieldState: vi.fn(() => ({
        error: null,
        warning: null,
        touched: false
      }))
    };
  })
}));

describe('BOQProjectManager Enhanced Features', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentBOQItems: [
      { id: '1', name: 'Test Item', quantity: 2, unitPrice: 100 }
    ],
    onLoadBOQ: vi.fn(),
    onSaveBOQ: vi.fn(),
    getBOQProjects: vi.fn(),
    createBOQProject: vi.fn(),
    updateBOQProject: vi.fn(),
    deleteBOQProject: vi.fn(),
    getBOQItems: vi.fn(),
    saveBOQItems: vi.fn(),
    cloneBOQProject: vi.fn()
  };

  const mockProjects = [
    {
      id: 1,
      name: 'Test Project 1',
      description: 'Test Description 1',
      status: 'active',
      client_name: 'Client A',
      client_contact: 'John Doe',
      client_email: 'john@clienta.com',
      location: 'New York',
      estimated_value: 15000,
      deadline: '2024-12-31',
      priority: 2,
      notes: 'Important project',
      item_count: 5,
      total_value: 12500,
      updated_at: '2024-01-15T10:30:00Z',
      created_at: '2024-01-01T09:00:00Z'
    },
    {
      id: 2,
      name: 'Test Project 2',
      description: 'Test Description 2',
      status: 'draft',
      client_name: 'Client B',
      location: 'Los Angeles',
      estimated_value: 8000,
      priority: 1,
      item_count: 3,
      total_value: 7500,
      updated_at: '2024-01-10T14:20:00Z',
      created_at: '2024-01-05T11:15:00Z'
    },
    {
      id: 3,
      name: 'Overdue Project',
      description: 'This project is overdue',
      status: 'active',
      deadline: '2023-12-01',
      priority: 3,
      item_count: 8,
      total_value: 25000,
      updated_at: '2023-11-15T16:45:00Z',
      created_at: '2023-11-01T08:30:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps.getBOQProjects.mockResolvedValue(mockProjects);
    mockProps.createBOQProject.mockResolvedValue({ projectId: 4 });
    mockProps.updateBOQProject.mockResolvedValue(true);
    mockProps.deleteBOQProject.mockResolvedValue(true);
    mockProps.cloneBOQProject.mockResolvedValue({ projectId: 5 });
    mockProps.getBOQItems.mockResolvedValue([]);
  });

  describe('Project Statistics Dashboard', () => {
    it('should display project statistics correctly', async () => {
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total projects
        expect(screen.getByText('$45000.00')).toBeInTheDocument(); // Total value
        expect(screen.getByText('2')).toBeInTheDocument(); // Active projects
        expect(screen.getByText('1')).toBeInTheDocument(); // Overdue projects
      });
    });

    it('should not display statistics when no projects exist', async () => {
      mockProps.getBOQProjects.mockResolvedValue([]);
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Total Projects')).not.toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Project Display', () => {
    it('should display project metadata correctly', async () => {
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        // Check project names and status badges
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('draft')).toBeInTheDocument();

        // Check client information
        expect(screen.getByText('Client A')).toBeInTheDocument();
        expect(screen.getByText('New York')).toBeInTheDocument();

        // Check overdue indicator
        expect(screen.getByText('OVERDUE')).toBeInTheDocument();
      });
    });

    it('should show priority indicators', async () => {
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        // Priority icons should be rendered as Star icons
        const starIcons = document.querySelectorAll('.lucide-star');
        expect(starIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Project Filtering and Sorting', () => {
    it('should filter projects by status', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      });

      // Filter by active status
      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, 'active');

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
      });
    });

    it('should sort projects correctly', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      // Change sort to name
      const sortSelect = screen.getByDisplayValue('Last Updated');
      await user.selectOptions(sortSelect, 'name');

      // Projects should be sorted by name
      await waitFor(() => {
        const projectNames = screen.getAllByText(/Test Project/);
        expect(projectNames[0]).toHaveTextContent('Overdue Project');
        expect(projectNames[1]).toHaveTextContent('Test Project 1');
      });
    });

    it('should toggle sort order', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      const sortOrderButton = screen.getByText('↓');
      await user.click(sortOrderButton);

      expect(screen.getByText('↑')).toBeInTheDocument();
    });
  });

  describe('Project Cloning', () => {
    it('should clone a project successfully', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      // Click clone button for first project
      const cloneButtons = screen.getAllByTitle('Clone project');
      await user.click(cloneButtons[0]);

      await waitFor(() => {
        expect(mockProps.cloneBOQProject).toHaveBeenCalledWith(1, {
          name: 'Test Project 1 (Copy)',
          description: 'Test Description 1',
          status: 'draft',
          clientName: 'Client A',
          clientContact: 'John Doe',
          clientEmail: 'john@clienta.com',
          location: 'New York',
          estimatedValue: 15000,
          priority: 2,
          notes: 'Cloned from: Test Project 1\n\nImportant project'
        });
        expect(toast.success).toHaveBeenCalledWith(
          'Cloned project "Test Project 1" as "Test Project 1 (Copy)"',
          expect.any(Object)
        );
      });
    });

    it('should handle clone errors gracefully', async () => {
      const user = userEvent.setup();
      mockProps.cloneBOQProject.mockRejectedValue(new Error('Clone failed'));
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const cloneButtons = screen.getAllByTitle('Clone project');
      await user.click(cloneButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to clone project: Clone failed',
          expect.any(Object)
        );
      });
    });
  });

  describe('Enhanced Project Deletion', () => {
    it('should show delete confirmation modal', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByTitle('Delete project');
      await user.click(deleteButtons[0]);

      // Confirmation modal should appear
      expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete "Test Project 1"?')).toBeInTheDocument();
      expect(screen.getByText('A backup will be created for recovery purposes')).toBeInTheDocument();
    });

    it('should cancel deletion when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete project');
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
      expect(mockProps.deleteBOQProject).not.toHaveBeenCalled();
    });

    it('should delete project with backup when confirmed', async () => {
      const user = userEvent.setup();
      const localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete project');
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /Delete Project/ });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockProps.getBOQItems).toHaveBeenCalledWith(1);
        expect(localStorageSetItemSpy).toHaveBeenCalled();
        expect(mockProps.deleteBOQProject).toHaveBeenCalledWith(1);
        expect(toast.success).toHaveBeenCalled();
      });

      localStorageSetItemSpy.mockRestore();
    });
  });

  describe('Enhanced Project Form', () => {
    it('should display all enhanced form fields when creating', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Check for enhanced form sections
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Client Information')).toBeInTheDocument();
      expect(screen.getByText('Project Details')).toBeInTheDocument();

      // Check for specific fields by text content since the form uses mocked validation hook
      expect(screen.getByText('Project Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Client Name')).toBeInTheDocument();
      expect(screen.getByText('Contact Person')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Estimated Value')).toBeInTheDocument();
      expect(screen.getByText('Deadline')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should populate form fields when editing', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit project');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    it('should submit enhanced project data', async () => {
      const user = userEvent.setup();
      render(<BOQProjectManager {...mockProps} />);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Simulate form submission by calling the onSubmit callback directly
      if (mockSubmitCallback) {
        await mockSubmitCallback({
          name: 'Test Project',
          description: 'Test Description',
          status: 'draft',
          clientName: 'Test Client',
          clientContact: 'John Doe',
          clientEmail: 'john@test.com',
          location: 'Test Location',
          estimatedValue: '10000',
          deadline: '2024-12-31',
          priority: 2,
          notes: 'Test notes'
        });
      }

      await waitFor(() => {
        expect(mockProps.createBOQProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: 'Test Description',
          status: 'draft',
          clientName: 'Test Client',
          clientContact: 'John Doe',
          clientEmail: 'john@test.com',
          location: 'Test Location',
          estimatedValue: 10000,
          deadline: '2024-12-31',
          priority: 2,
          notes: 'Test notes'
        });
      });
    });
  });

  describe('Project Value Calculations', () => {
    it('should display correct project values', async () => {
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('$12500.00')).toBeInTheDocument();
        expect(screen.getByText('$7500.00')).toBeInTheDocument();
        expect(screen.getByText('$25000.00')).toBeInTheDocument();
      });
    });

    it('should calculate statistics correctly', async () => {
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        // Total value should be sum of all project values
        expect(screen.getByText('$45000.00')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle project loading errors', async () => {
      mockProps.getBOQProjects.mockRejectedValue(new Error('Failed to load'));
      render(<BOQProjectManager {...mockProps} />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to load projects. Please try again.',
          expect.any(Object)
        );
      });
    });

    it('should handle project creation errors', async () => {
      const user = userEvent.setup();
      mockProps.createBOQProject.mockRejectedValue(new Error('Creation failed'));
      render(<BOQProjectManager {...mockProps} />);

      const newProjectButton = screen.getByText('New Project');
      await user.click(newProjectButton);

      // Simulate form submission with error
      if (mockSubmitCallback) {
        try {
          await mockSubmitCallback({
            name: 'Test Project',
            description: 'Test Description',
            status: 'draft',
            clientName: 'Test Client',
            clientContact: 'John Doe',
            clientEmail: 'john@test.com',
            location: 'Test Location',
            estimatedValue: '10000',
            deadline: '2024-12-31',
            priority: 2,
            notes: 'Test notes'
          });
        } catch (error) {
          // Expected to throw
        }
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create project: Creation failed',
          expect.any(Object)
        );
      });
    });
  });
});
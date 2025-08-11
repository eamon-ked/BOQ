import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectTemplate from '../ProjectTemplate';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the validation hook
vi.mock('../../hooks/useValidatedForm', () => ({
  useValidatedForm: vi.fn((options) => ({
    values: {
      name: '',
      templateDescription: '',
      templateCategory: '',
      isPublic: false
    },
    errors: {},
    warnings: {},
    touched: {},
    isValid: true,
    isSubmitting: false,
    setValue: vi.fn(),
    setValues: vi.fn(),
    handleSubmit: vi.fn(async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      // Call the onSubmit callback if provided
      if (options && options.onSubmit) {
        await options.onSubmit({
          name: 'Test Template',
          templateDescription: 'Test Description',
          templateCategory: 'security',
          isPublic: false
        });
      }
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
  }))
}));

describe('ProjectTemplate', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentBOQItems: [
      {
        id: '1',
        name: 'Test Item 1',
        unitPrice: 100,
        quantity: 2
      },
      {
        id: '2',
        name: 'Test Item 2',
        unitPrice: 200,
        quantity: 1
      }
    ],
    onApplyTemplate: vi.fn(),
    getProjectTemplates: vi.fn(),
    createProjectTemplate: vi.fn(),
    updateProjectTemplate: vi.fn(),
    deleteProjectTemplate: vi.fn(),
    cloneBOQProject: vi.fn()
  };

  const mockTemplates = [
    {
      id: 1,
      name: 'Security System Template',
      templateDescription: 'Complete security system setup',
      templateCategory: 'security',
      itemCount: 5,
      templateValue: 2500,
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 3,
      isPublic: true
    },
    {
      id: 2,
      name: 'Network Setup Template',
      templateDescription: 'Basic network infrastructure',
      templateCategory: 'networking',
      itemCount: 8,
      templateValue: 1800,
      updatedAt: '2024-01-10T15:30:00Z',
      usageCount: 1,
      isPublic: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps.getProjectTemplates.mockResolvedValue(mockTemplates);
  });

  describe('Rendering', () => {
    it('should render the component when open', () => {
      render(<ProjectTemplate {...mockProps} />);
      
      expect(screen.getByText('Project Templates')).toBeInTheDocument();
      expect(screen.getByText('Create, manage, and apply reusable project templates')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ProjectTemplate {...mockProps} isOpen={false} />);
      
      expect(screen.queryByText('Project Templates')).not.toBeInTheDocument();
    });

    it('should load and display templates on open', async () => {
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(mockProps.getProjectTemplates).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
        expect(screen.getByText('Network Setup Template')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching templates', () => {
      mockProps.getProjectTemplates.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ProjectTemplate {...mockProps} />);
      
      expect(screen.getByText('Project Templates')).toBeInTheDocument();
      // Check for loading spinner by class instead of role
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show empty state when no templates exist', async () => {
      mockProps.getProjectTemplates.mockResolvedValue([]);
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No templates available')).toBeInTheDocument();
        expect(screen.getByText('Create your first template from a BOQ project')).toBeInTheDocument();
      });
    });
  });

  describe('Template Display', () => {
    it('should display template information correctly', async () => {
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      // Check template details
      expect(screen.getByText('Complete security system setup')).toBeInTheDocument();
      expect(screen.getByText('5 items')).toBeInTheDocument();
      expect(screen.getByText('$2500.00')).toBeInTheDocument();
      expect(screen.getByText('Used 3 times')).toBeInTheDocument();
    });

    it('should show public template indicator', async () => {
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByTitle('Public template')).toBeInTheDocument();
      });
    });

    it('should display template categories as tags', async () => {
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        // Use getAllByText since categories appear in both dropdown and tags
        expect(screen.getAllByText('security')).toHaveLength(2); // One in dropdown, one as tag
        expect(screen.getAllByText('networking')).toHaveLength(2);
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter templates by search term', async () => {
      const user = userEvent.setup();
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      await user.type(searchInput, 'security');
      
      expect(screen.getByText('Security System Template')).toBeInTheDocument();
      expect(screen.queryByText('Network Setup Template')).not.toBeInTheDocument();
    });

    it('should filter templates by category', async () => {
      const user = userEvent.setup();
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('All Categories');
      await user.selectOptions(categorySelect, 'security');
      
      expect(screen.getByText('Security System Template')).toBeInTheDocument();
      expect(screen.queryByText('Network Setup Template')).not.toBeInTheDocument();
    });

    it('should show filtered count', async () => {
      const user = userEvent.setup();
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 2 templates')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      await user.type(searchInput, 'security');
      
      await waitFor(() => {
        expect(screen.getByText('1 of 2 templates')).toBeInTheDocument();
      });
    });
  });

  describe('Template Actions', () => {
    it('should apply template when Apply Template button is clicked', async () => {
      const user = userEvent.setup();
      mockProps.cloneBOQProject.mockResolvedValue({ success: true, projectId: 123 });
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const applyButtons = screen.getAllByText('Apply Template');
      await user.click(applyButtons[0]);
      
      expect(mockProps.cloneBOQProject).toHaveBeenCalledWith(1, {
        name: 'New Project from Security System Template',
        status: 'draft',
        isTemplate: false
      });
      
      await waitFor(() => {
        expect(mockProps.onApplyTemplate).toHaveBeenCalledWith(123, mockTemplates[0]);
      });
    });

    it('should show loading state when applying template', async () => {
      const user = userEvent.setup();
      mockProps.cloneBOQProject.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const applyButtons = screen.getAllByText('Apply Template');
      await user.click(applyButtons[0]);
      
      expect(screen.getByText('Applying...')).toBeInTheDocument();
    });

    it('should clone template when clone button is clicked', async () => {
      const user = userEvent.setup();
      mockProps.cloneBOQProject.mockResolvedValue({ success: true, projectId: 124 });
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const cloneButtons = screen.getAllByTitle('Clone template');
      await user.click(cloneButtons[0]);
      
      expect(mockProps.cloneBOQProject).toHaveBeenCalledWith(1, {
        name: 'Security System Template (Copy)',
        templateDescription: 'Complete security system setup',
        templateCategory: 'security',
        isPublic: false
      });
    });

    it('should delete template when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      mockProps.deleteProjectTemplate.mockResolvedValue({ success: true });
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await user.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete template "Security System Template"? This action cannot be undone.'
      );
      expect(mockProps.deleteProjectTemplate).toHaveBeenCalledWith(1);
    });

    it('should not delete template when deletion is cancelled', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete template');
      await user.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockProps.deleteProjectTemplate).not.toHaveBeenCalled();
    });
  });

  describe('Template Creation', () => {
    it('should show create form when New Template button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProjectTemplate {...mockProps} />);
      
      const newTemplateButton = screen.getByText('New Template');
      await user.click(newTemplateButton);
      
      expect(screen.getByText('Create New Template')).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
    });

    it('should disable New Template button when BOQ is empty', () => {
      render(<ProjectTemplate {...mockProps} currentBOQItems={[]} />);
      
      const newTemplateButton = screen.getByText('New Template');
      expect(newTemplateButton).toBeDisabled();
      expect(newTemplateButton).toHaveAttribute('title', 'Add items to BOQ first');
    });

    it('should show template preview when creating from BOQ', async () => {
      const user = userEvent.setup();
      
      render(<ProjectTemplate {...mockProps} />);
      
      const newTemplateButton = screen.getByText('New Template');
      await user.click(newTemplateButton);
      
      expect(screen.getByText('Template Preview')).toBeInTheDocument();
      expect(screen.getByText('2 items • $400.00 total value')).toBeInTheDocument();
    });

    it('should create template when form is submitted', async () => {
      const user = userEvent.setup();
      mockProps.createProjectTemplate.mockResolvedValue({ success: true });
      
      render(<ProjectTemplate {...mockProps} />);
      
      const newTemplateButton = screen.getByText('New Template');
      await user.click(newTemplateButton);
      
      const createButton = screen.getByText('Create Template');
      await user.click(createButton);
      
      expect(mockProps.createProjectTemplate).toHaveBeenCalled();
    });

    it('should close form when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProjectTemplate {...mockProps} />);
      
      const newTemplateButton = screen.getByText('New Template');
      await user.click(newTemplateButton);
      
      expect(screen.getByText('Create New Template')).toBeInTheDocument();
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(screen.queryByText('Create New Template')).not.toBeInTheDocument();
    });
  });

  describe('Template Editing', () => {
    it('should show edit form when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit template');
      await user.click(editButtons[0]);
      
      expect(screen.getByText('Edit Template')).toBeInTheDocument();
    });

    it('should update template when edit form is submitted', async () => {
      const user = userEvent.setup();
      mockProps.updateProjectTemplate.mockResolvedValue({ success: true });
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit template');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByText('Update Template');
      await user.click(updateButton);
      
      expect(mockProps.updateProjectTemplate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle template loading errors', async () => {
      mockProps.getProjectTemplates.mockRejectedValue(new Error('Failed to load templates'));
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(mockProps.getProjectTemplates).toHaveBeenCalled();
      });
      
      // Error should be handled gracefully (component should still render)
      expect(screen.getByText('Project Templates')).toBeInTheDocument();
    });

    it('should handle template creation errors', async () => {
      const user = userEvent.setup();
      mockProps.createProjectTemplate.mockRejectedValue(new Error('Failed to create template'));
      
      render(<ProjectTemplate {...mockProps} />);
      
      const newTemplateButton = screen.getByText('New Template');
      await user.click(newTemplateButton);
      
      const createButton = screen.getByText('Create Template');
      await user.click(createButton);
      
      // Error should be handled (form should remain open)
      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });

    it('should handle template application errors', async () => {
      const user = userEvent.setup();
      mockProps.cloneBOQProject.mockRejectedValue(new Error('Failed to apply template'));
      
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      const applyButtons = screen.getAllByText('Apply Template');
      await user.click(applyButtons[0]);
      
      await waitFor(() => {
        expect(mockProps.cloneBOQProject).toHaveBeenCalled();
      });
      
      // Component should handle error gracefully
      expect(screen.getByText('Security System Template')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      // Check for proper form labels
      const newTemplateButton = screen.getByText('New Template');
      await userEvent.click(newTemplateButton);
      
      expect(screen.getByLabelText(/Template Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<ProjectTemplate {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Security System Template')).toBeInTheDocument();
      });

      // Test tab navigation
      const searchInput = screen.getByPlaceholderText('Search templates...');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });
});
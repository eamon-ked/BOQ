import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '../../store/index.js';
import App from '../../App.jsx';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock database service
vi.mock('../../services/database.js', () => ({
  loadDatabase: vi.fn(() => Promise.resolve([])),
  saveDatabase: vi.fn(() => Promise.resolve()),
  loadCategories: vi.fn(() => Promise.resolve([])),
  saveCategories: vi.fn(() => Promise.resolve()),
}));

describe('User Workflows Integration Tests', () => {
  const mockItems = [
    {
      id: 'item1',
      name: 'Security Camera',
      category: 'Security',
      unitPrice: 150,
      unit: 'each',
      pricingTerm: 'fixed',
      description: 'HD Security Camera',
      dependencies: []
    },
    {
      id: 'item2',
      name: 'Network Cable',
      category: 'Network',
      unitPrice: 25,
      unit: 'meter',
      pricingTerm: 'fixed',
      description: 'Cat6 Network Cable',
      dependencies: []
    },
    {
      id: 'item3',
      name: 'Power Supply',
      category: 'Power',
      unitPrice: 75,
      unit: 'each',
      pricingTerm: 'fixed',
      description: '12V Power Supply',
      dependencies: []
    }
  ];

  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      ui: {
        panels: { showDatabase: true, showSummary: false },
        searchTerm: '',
        selectedCategory: '',
        modals: {
          itemSelector: false,
          categoryManager: false,
          itemEditor: false,
          projectManager: false,
          projectTemplate: false,
          settings: false,
          boqExport: false,
        },
        loading: { items: false, categories: false, saving: false },
      },
      data: {
        masterDatabase: mockItems,
        categories: ['Security', 'Network', 'Power'],
        boqItems: [],
        currentProject: { id: null, name: '' },
        templates: [],
        filters: { search: '', category: '' },
        selectedItems: new Set(),
      },
      errors: {},
    });

    vi.clearAllMocks();
  });

  describe('Item Search and Selection Workflow', () => {
    it('should allow user to search for items and add them to BOQ', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Search for security items
      const searchInput = screen.getByPlaceholderText(/search items/i);
      await user.type(searchInput, 'security');

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
        expect(screen.queryByText('Network Cable')).not.toBeInTheDocument();
      });

      // Add item to BOQ
      const addButton = screen.getByRole('button', { name: /add to boq/i });
      await user.click(addButton);

      // Verify item was added to BOQ
      await waitFor(() => {
        expect(screen.getByText(/added.*security camera.*to boq/i)).toBeInTheDocument();
      });

      // Check BOQ summary is shown
      expect(screen.getByText(/boq summary/i)).toBeInTheDocument();
    });

    it('should allow filtering by category', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Select category filter
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await user.selectOptions(categorySelect, 'Network');

      // Verify only network items are shown
      await waitFor(() => {
        expect(screen.getByText('Network Cable')).toBeInTheDocument();
        expect(screen.queryByText('Security Camera')).not.toBeInTheDocument();
      });
    });
  });

  describe('BOQ Management Workflow', () => {
    it('should allow user to add multiple items and manage quantities', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Add first item
      const cameraAddButton = screen.getAllByRole('button', { name: /add to boq/i })[0];
      await user.click(cameraAddButton);

      // Add second item
      const cableAddButton = screen.getAllByRole('button', { name: /add to boq/i })[1];
      await user.click(cableAddButton);

      // Wait for BOQ to update
      await waitFor(() => {
        expect(screen.getByText(/boq summary/i)).toBeInTheDocument();
      });

      // Update quantity of first item
      const quantityInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Verify quantity was updated
      await waitFor(() => {
        expect(quantityInput).toHaveValue(5);
      });

      // Remove an item from BOQ
      const removeButton = screen.getAllByRole('button', { name: /remove/i })[0];
      await user.click(removeButton);

      // Verify item was removed
      await waitFor(() => {
        expect(screen.getByText(/removed.*from boq/i)).toBeInTheDocument();
      });
    });

    it('should calculate BOQ totals correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Add items with specific quantities
      const addButtons = screen.getAllByRole('button', { name: /add to boq/i });
      
      // Add 2 cameras at $150 each = $300
      await user.click(addButtons[0]);
      const quantityInput1 = screen.getAllByRole('spinbutton')[0];
      await user.clear(quantityInput1);
      await user.type(quantityInput1, '2');

      // Add 10 meters of cable at $25 each = $250
      await user.click(addButtons[1]);
      const quantityInput2 = screen.getAllByRole('spinbutton')[1];
      await user.clear(quantityInput2);
      await user.type(quantityInput2, '10');

      // Verify total calculation
      await waitFor(() => {
        expect(screen.getByText(/total.*550/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Management Workflow', () => {
    it('should allow user to create and manage projects', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Open project manager
      const projectButton = screen.getByRole('button', { name: /project/i });
      await user.click(projectButton);

      // Create new project
      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      await user.click(newProjectButton);

      // Fill project form
      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, 'Test Project');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'A test project for integration testing');

      // Save project
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify project was created
      await waitFor(() => {
        expect(screen.getByText(/project.*created/i)).toBeInTheDocument();
      });

      // Verify project is now current
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should save BOQ items with project', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Create a project first
      const projectButton = screen.getByRole('button', { name: /project/i });
      await user.click(projectButton);

      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      await user.click(newProjectButton);

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, 'BOQ Test Project');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Add items to BOQ
      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      const addButton = screen.getAllByRole('button', { name: /add to boq/i })[0];
      await user.click(addButton);

      // Save project with BOQ
      const saveProjectButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveProjectButton);

      // Verify project was saved
      await waitFor(() => {
        expect(screen.getByText(/project.*saved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Workflow', () => {
    it('should allow user to export BOQ in different formats', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Add items to BOQ first
      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      const addButton = screen.getAllByRole('button', { name: /add to boq/i })[0];
      await user.click(addButton);

      // Open export modal
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      // Select export format
      const formatSelect = screen.getByRole('combobox', { name: /format/i });
      await user.selectOptions(formatSelect, 'pdf');

      // Select fields to export
      const nameCheckbox = screen.getByRole('checkbox', { name: /name/i });
      const priceCheckbox = screen.getByRole('checkbox', { name: /price/i });
      
      expect(nameCheckbox).toBeChecked();
      await user.click(priceCheckbox);

      // Start export
      const exportStartButton = screen.getByRole('button', { name: /export boq/i });
      await user.click(exportStartButton);

      // Verify export started
      await waitFor(() => {
        expect(screen.getByText(/export.*started/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations Workflow', () => {
    it('should allow user to perform bulk operations on items', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Security Camera
      await user.click(checkboxes[1]); // Network Cable

      // Open bulk operations menu
      const bulkButton = screen.getByRole('button', { name: /bulk operations/i });
      await user.click(bulkButton);

      // Select bulk add to BOQ
      const addToBOQButton = screen.getByRole('button', { name: /add selected to boq/i });
      await user.click(addToBOQButton);

      // Verify bulk operation completed
      await waitFor(() => {
        expect(screen.getByText(/added.*items.*to boq/i)).toBeInTheDocument();
      });

      // Verify both items are in BOQ
      expect(screen.getByText(/2.*items.*in boq/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      vi.mocked(require('../../services/database.js').saveDatabase)
        .mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Add item to BOQ
      const addButton = screen.getAllByRole('button', { name: /add to boq/i })[0];
      await user.click(addButton);

      // Try to save (which will fail)
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should validate form inputs and show errors', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Open item editor
      const addItemButton = screen.getByRole('button', { name: /add new item/i });
      await user.click(addItemButton);

      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /save item/i });
      await user.click(saveButton);

      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      });

      // Fill required fields
      const nameInput = screen.getByLabelText(/item name/i);
      await user.type(nameInput, 'New Test Item');

      const categoryInput = screen.getByLabelText(/category/i);
      await user.type(categoryInput, 'Test Category');

      const unitInput = screen.getByLabelText(/unit/i);
      await user.type(unitInput, 'each');

      const priceInput = screen.getByLabelText(/unit price/i);
      await user.type(priceInput, '100');

      const pricingTermInput = screen.getByLabelText(/pricing term/i);
      await user.type(pricingTermInput, 'fixed');

      // Save again
      await user.click(saveButton);

      // Verify item was saved
      await waitFor(() => {
        expect(screen.getByText(/item.*saved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Search Workflow', () => {
    it('should allow user to use advanced search features', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      // Open advanced search
      const advancedSearchButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(advancedSearchButton);

      // Set price range filter
      const minPriceInput = screen.getByLabelText(/minimum price/i);
      await user.type(minPriceInput, '50');

      const maxPriceInput = screen.getByLabelText(/maximum price/i);
      await user.type(maxPriceInput, '100');

      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Power Supply')).toBeInTheDocument(); // $75
        expect(screen.queryByText('Security Camera')).not.toBeInTheDocument(); // $150
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // Verify all items are shown again
      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
        expect(screen.getByText('Network Cable')).toBeInTheDocument();
        expect(screen.getByText('Power Supply')).toBeInTheDocument();
      });
    });
  });

  describe('Template Management Workflow', () => {
    it('should allow user to create and use templates', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Add items to BOQ first
      await waitFor(() => {
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });

      const addButton = screen.getAllByRole('button', { name: /add to boq/i })[0];
      await user.click(addButton);

      // Create template from current BOQ
      const templateButton = screen.getByRole('button', { name: /save as template/i });
      await user.click(templateButton);

      // Fill template form
      const templateNameInput = screen.getByLabelText(/template name/i);
      await user.type(templateNameInput, 'Security Setup Template');

      const templateDescInput = screen.getByLabelText(/description/i);
      await user.type(templateDescInput, 'Basic security camera setup');

      // Save template
      const saveTemplateButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveTemplateButton);

      // Verify template was created
      await waitFor(() => {
        expect(screen.getByText(/template.*created/i)).toBeInTheDocument();
      });

      // Clear BOQ
      const clearBOQButton = screen.getByRole('button', { name: /clear boq/i });
      await user.click(clearBOQButton);

      // Load template
      const loadTemplateButton = screen.getByRole('button', { name: /load template/i });
      await user.click(loadTemplateButton);

      const templateOption = screen.getByText('Security Setup Template');
      await user.click(templateOption);

      // Verify template was loaded
      await waitFor(() => {
        expect(screen.getByText(/template.*loaded/i)).toBeInTheDocument();
        expect(screen.getByText('Security Camera')).toBeInTheDocument();
      });
    });
  });
});
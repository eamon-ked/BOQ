import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../../App';
import { useAppStore } from '../../store';

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      ui: {
        panels: {
          showDatabase: true,
          showSummary: false,
        },
        searchTerm: '',
        selectedCategory: '',
        modals: {
          itemSelector: false,
          categoryManager: false,
          itemEditor: false,
          projectManager: false,
          settings: false,
        },
      },
      data: {
        masterDatabase: [
          {
            id: '1',
            name: 'Test Camera',
            category: 'Security',
            unitPrice: 100,
            description: 'Test camera description'
          },
          {
            id: '2',
            name: 'Network Switch',
            category: 'Networking',
            unitPrice: 200,
            description: 'Network switch description'
          }
        ],
        categories: ['Security', 'Networking'],
        boqItems: [],
        currentProject: { id: null, name: '' },
      },
    });
  });

  describe('Basic Rendering', () => {
    it('should render main components', () => {
      render(<App />);

      expect(screen.getByText('BOQ Builder')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Item Database')).toBeInTheDocument();
    });

    it('should show database panel by default', () => {
      render(<App />);

      expect(screen.getByText('Item Database')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });
  });

  describe('Panel Toggle', () => {
    it('should toggle database panel visibility', () => {
      render(<App />);

      // Database panel should be visible initially
      expect(screen.getByText('Item Database')).toBeInTheDocument();

      // Click database button to hide panel
      fireEvent.click(screen.getByText('Database'));

      // Database panel should be hidden
      expect(screen.queryByText('Item Database')).not.toBeInTheDocument();

      // Click database button to show panel again
      fireEvent.click(screen.getByText('Database'));

      // Database panel should be visible again
      expect(screen.getByText('Item Database')).toBeInTheDocument();
    });

    it('should toggle summary panel visibility', () => {
      render(<App />);

      // Summary panel should be hidden initially
      expect(screen.queryByText('BOQ Summary')).not.toBeInTheDocument();

      // Click summary button to show panel
      fireEvent.click(screen.getByText('Summary'));

      // Summary panel should be visible
      expect(screen.getByText('BOQ Summary')).toBeInTheDocument();

      // Click summary button to hide panel
      fireEvent.click(screen.getByText('Summary'));

      // Summary panel should be hidden
      expect(screen.queryByText('BOQ Summary')).not.toBeInTheDocument();
    });
  });

  describe('Item Display', () => {
    it('should display items from master database', () => {
      render(<App />);

      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.getByText('Test camera description')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();

      expect(screen.getByText('Network Switch')).toBeInTheDocument();
      expect(screen.getByText('Network switch description')).toBeInTheDocument();
      expect(screen.getByText('$200')).toBeInTheDocument();
    });

    it('should show add to BOQ buttons for each item', () => {
      render(<App />);

      const addButtons = screen.getAllByText('Add to BOQ');
      expect(addButtons).toHaveLength(2);
    });
  });

  describe('Search Functionality', () => {
    it('should filter items by search term', async () => {
      render(<App />);

      const searchInput = screen.getByPlaceholderText('Search items...');

      // Search for "camera"
      fireEvent.change(searchInput, { target: { value: 'camera' } });

      await waitFor(() => {
        expect(screen.getByText('Test Camera')).toBeInTheDocument();
        expect(screen.queryByText('Network Switch')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Test Camera')).toBeInTheDocument();
        expect(screen.getByText('Network Switch')).toBeInTheDocument();
      });
    });

    it('should update store search term', async () => {
      render(<App />);

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.ui.searchTerm).toBe('test search');
      });
    });
  });

  describe('Category Filtering', () => {
    it('should filter items by category', async () => {
      render(<App />);

      const categorySelect = screen.getByDisplayValue('All Categories');

      // Filter by Security category
      fireEvent.change(categorySelect, { target: { value: 'Security' } });

      await waitFor(() => {
        expect(screen.getByText('Test Camera')).toBeInTheDocument();
        expect(screen.queryByText('Network Switch')).not.toBeInTheDocument();
      });

      // Filter by Networking category
      fireEvent.change(categorySelect, { target: { value: 'Networking' } });

      await waitFor(() => {
        expect(screen.queryByText('Test Camera')).not.toBeInTheDocument();
        expect(screen.getByText('Network Switch')).toBeInTheDocument();
      });
    });

    it('should update store selected category', async () => {
      render(<App />);

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'Security' } });

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.ui.selectedCategory).toBe('Security');
      });
    });
  });

  describe('BOQ Management', () => {
    it('should add items to BOQ', async () => {
      render(<App />);

      // Add item to BOQ
      const addButtons = screen.getAllByText('Add to BOQ');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.data.boqItems).toHaveLength(1);
        expect(store.data.boqItems[0].name).toBe('Test Camera');
        expect(store.data.boqItems[0].quantity).toBe(1);
        // Adding BOQ item should automatically show summary panel
        expect(store.ui.panels.showSummary).toBe(true);
      });

      // Summary panel should now be visible automatically
      await waitFor(() => {
        expect(screen.getByText('BOQ Summary')).toBeInTheDocument();
        expect(screen.getByText('Qty: 1')).toBeInTheDocument();
      });
    });

    it('should update item quantities in BOQ', async () => {
      // Pre-populate BOQ with an item (this automatically shows summary panel)
      useAppStore.getState().addBOQItem({
        id: '1',
        name: 'Test Camera',
        category: 'Security',
        unitPrice: 100,
        description: 'Test camera description'
      });

      render(<App />);

      // Summary panel should already be visible due to addBOQItem
      await waitFor(() => {
        expect(screen.getByText('BOQ Summary')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
      });

      // Increase quantity
      const increaseButton = screen.getByText('+');
      fireEvent.click(increaseButton);

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.data.boqItems[0].quantity).toBe(2);
      });

      expect(screen.getByText('Qty: 2')).toBeInTheDocument();

      // Decrease quantity
      const decreaseButton = screen.getByText('-');
      fireEvent.click(decreaseButton);

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.data.boqItems[0].quantity).toBe(1);
      });

      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
    });

    it('should remove items from BOQ', async () => {
      // Pre-populate BOQ with an item (this automatically shows summary panel)
      useAppStore.getState().addBOQItem({
        id: '1',
        name: 'Test Camera',
        category: 'Security',
        unitPrice: 100,
        description: 'Test camera description'
      });

      render(<App />);

      // Summary panel should already be visible due to addBOQItem
      await waitFor(() => {
        expect(screen.getByText('BOQ Summary')).toBeInTheDocument();
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });

      // Remove item
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.data.boqItems).toHaveLength(0);
      });
    });

    it('should calculate totals correctly', async () => {
      // Pre-populate BOQ with items (this automatically shows summary panel)
      const store = useAppStore.getState();
      store.addBOQItem({
        id: '1',
        name: 'Test Camera',
        category: 'Security',
        unitPrice: 100,
        description: 'Test camera description'
      });
      store.addBOQItem({
        id: '2',
        name: 'Network Switch',
        category: 'Networking',
        unitPrice: 200,
        description: 'Network switch description'
      });

      render(<App />);

      // Summary panel should already be visible due to addBOQItem
      await waitFor(() => {
        expect(screen.getByText('BOQ Summary')).toBeInTheDocument();
        expect(screen.getByText(/Total Items:\s*2/)).toBeInTheDocument();
        expect(screen.getByText(/Total Value:\s*\$300\.00/)).toBeInTheDocument();
      });
    });
  });

  describe('Store Integration', () => {
    it('should maintain consistent state across components', async () => {
      render(<App />);

      // Change search term
      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'camera' } });

      // Change category
      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'Security' } });

      // Add item to BOQ (this automatically shows summary panel)
      const addButton = screen.getByText('Add to BOQ');
      fireEvent.click(addButton);

      await waitFor(() => {
        const store = useAppStore.getState();
        expect(store.ui.searchTerm).toBe('camera');
        expect(store.ui.selectedCategory).toBe('Security');
        expect(store.data.boqItems).toHaveLength(1);
        // Adding BOQ item should automatically show summary panel
        expect(store.ui.panels.showSummary).toBe(true);
      });
    });
  });
});
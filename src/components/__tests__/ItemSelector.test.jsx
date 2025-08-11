import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ItemSelector from '../ItemSelector';
import { useAppStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

// Mock the advanced search hook
vi.mock('../../hooks/useAdvancedSearch', () => ({
  useAdvancedSearch: vi.fn(),
}));

// Import the mocked hook for easier reference
import { useAdvancedSearch as mockUseAdvancedSearch } from '../../hooks/useAdvancedSearch';

const mockItems = [
  {
    id: 'item-1',
    name: 'Test Camera',
    category: 'CCTV',
    unitPrice: 100,
    unit: 'pcs',
    description: 'HD Security Camera',
    manufacturer: 'TestBrand',
    dependencies: [],
    tags: ['security', 'surveillance'],
    metadata: { stockLevel: 10 }
  },
  {
    id: 'item-2',
    name: 'Power Supply',
    category: 'Power',
    unitPrice: 25,
    unit: 'pcs',
    description: 'Power adapter',
    manufacturer: 'PowerCorp',
    dependencies: [],
    tags: ['power', 'adapter'],
    metadata: { stockLevel: 0 }
  },
  {
    id: 'item-3',
    name: 'Network Switch',
    category: 'Network',
    unitPrice: 150,
    unit: 'pcs',
    description: 'Managed switch',
    manufacturer: 'NetBrand',
    dependencies: [{ itemId: 'item-2', quantity: 1 }],
    tags: ['network', 'managed'],
    metadata: { stockLevel: 5 }
  },
  {
    id: 'item-4',
    name: 'Wireless Camera',
    category: 'CCTV',
    unitPrice: 200,
    unit: 'pcs',
    description: 'WiFi Security Camera',
    manufacturer: 'TestBrand',
    dependencies: [],
    tags: ['security', 'wireless'],
    metadata: { stockLevel: 3 }
  },
];

const mockStoreState = {
  ui: {
    modals: {
      itemSelector: true,
    },
  },
  data: {
    masterDatabase: mockItems,
    categories: ['CCTV', 'Power', 'Network'],
  },
};

const mockActions = {
  closeModal: vi.fn(),
  addBOQItem: vi.fn(),
};

// Mock advanced search hook return value
const mockAdvancedSearchReturn = {
  filteredItems: mockItems,
  filters: {
    search: '',
    category: '',
    priceRange: [0, Infinity],
    manufacturer: '',
    inStock: null,
    tags: []
  },
  hasActiveFilters: false,
  isSearching: false,
  searchStats: {
    totalResults: 4,
    searchTime: 1.5,
    appliedFilters: []
  },
  resultCount: 4,
  setSearchTerm: vi.fn(),
  setCategory: vi.fn(),
  setPriceRange: vi.fn(),
  setManufacturer: vi.fn(),
  setInStock: vi.fn(),
  setTags: vi.fn(),
  clearFilters: vi.fn(),
  getHighlightedText: vi.fn((item, field) => item[field]),
  getSearchSuggestions: vi.fn(() => []),
  getFilterOptions: vi.fn(),
  filterOptions: {
    categories: ['CCTV', 'Power', 'Network'],
    manufacturers: ['TestBrand', 'PowerCorp', 'NetBrand'],
    tags: ['security', 'surveillance', 'power', 'adapter', 'network', 'managed', 'wireless'],
    priceRange: [25, 200]
  }
};

describe('ItemSelector', () => {
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
    
    mockUseAdvancedSearch.mockReturnValue(mockAdvancedSearchReturn);
  });

  it('renders when modal is open', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('Add Item to BOQ')).toBeInTheDocument();
    expect(screen.getByText('4 items available')).toBeInTheDocument();
  });

  it('does not render when modal is closed', () => {
    useAppStore.mockImplementation((selector) => {
      const state = {
        ...mockStoreState,
        ui: { modals: { itemSelector: false } },
        ...mockActions,
      };
      return selector(state);
    });

    const { container } = render(<ItemSelector />);
    expect(container.firstChild).toBeNull();
  });

  it('displays all items initially', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('Test Camera')).toBeInTheDocument();
    expect(screen.getByText('Power Supply')).toBeInTheDocument();
    expect(screen.getByText('Network Switch')).toBeInTheDocument();
    expect(screen.getByText('Wireless Camera')).toBeInTheDocument();
  });

  it('filters items by search term', async () => {
    render(<ItemSelector />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, description, or manufacturer...');
    fireEvent.change(searchInput, { target: { value: 'camera' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.queryByText('Power Supply')).not.toBeInTheDocument();
      expect(screen.queryByText('Network Switch')).not.toBeInTheDocument();
    });
  });

  it('filters items by category', async () => {
    render(<ItemSelector />);
    
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'CCTV' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.queryByText('Power Supply')).not.toBeInTheDocument();
      expect(screen.queryByText('Network Switch')).not.toBeInTheDocument();
    });
  });

  it('shows dependencies information', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('+1 auto-deps')).toBeInTheDocument();
    expect(screen.getByText('Will automatically add:')).toBeInTheDocument();
  });

  it('adds item to BOQ with correct quantity', async () => {
    render(<ItemSelector />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '3' } });
    
    const addButton = screen.getAllByText('Add to BOQ')[0];
    fireEvent.click(addButton);
    
    expect(mockActions.addBOQItem).toHaveBeenCalledWith(
      mockStoreState.data.masterDatabase[0],
      3
    );
  });

  it('resets quantity after adding item', async () => {
    render(<ItemSelector />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    const addButton = screen.getAllByText('Add to BOQ')[0];
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(quantityInput.value).toBe('1');
    });
  });

  it('closes modal when close button is clicked', () => {
    render(<ItemSelector />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);
    
    expect(mockActions.closeModal).toHaveBeenCalledWith('itemSelector');
  });

  it('shows no results message when no items match filter', async () => {
    render(<ItemSelector />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, description, or manufacturer...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  it('calculates total price correctly', () => {
    render(<ItemSelector />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    // Should show Total: $200.00 for Test Camera (100 * 2)
    expect(screen.getByText('Total: $200.00')).toBeInTheDocument();
  });

  it('shows manufacturer information', () => {
    render(<ItemSelector />);
    
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
    expect(screen.getByText('PowerCorp')).toBeInTheDocument();
    expect(screen.getByText('NetBrand')).toBeInTheDocument();
  });

  describe('Advanced Search Integration', () => {
    it('calls setSearchTerm when search input changes', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      const searchInput = screen.getByPlaceholderText('Search by name, description, or manufacturer...');
      await user.type(searchInput, 'camera');
      
      await waitFor(() => {
        expect(mockAdvancedSearchReturn.setSearchTerm).toHaveBeenCalledWith('camera');
      });
    });

    it('calls setCategory when category filter changes', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      await user.selectOptions(categorySelect, 'CCTV');
      
      expect(mockAdvancedSearchReturn.setCategory).toHaveBeenCalledWith('CCTV');
    });

    it('shows loading indicator when searching', () => {
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        isSearching: true
      });
      
      render(<ItemSelector />);
      
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin');
    });

    it('displays search statistics', () => {
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        searchStats: {
          totalResults: 2,
          searchTime: 5.2,
          appliedFilters: ['Category: CCTV']
        },
        resultCount: 2,
        hasActiveFilters: true
      });
      
      render(<ItemSelector />);
      
      expect(screen.getByText('2 items found in 5.2ms')).toBeInTheDocument();
      expect(screen.getByText('1 filter active')).toBeInTheDocument();
    });

    it('shows advanced filters when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Manufacturer')).toBeInTheDocument();
      expect(screen.getByText('Stock Status')).toBeInTheDocument();
    });

    it('calls setPriceRange when price filters change', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const minPriceInput = screen.getByPlaceholderText('Min');
      await user.type(minPriceInput, '50');
      
      expect(mockAdvancedSearchReturn.setPriceRange).toHaveBeenCalledWith([50, Infinity]);
    });

    it('calls setManufacturer when manufacturer filter changes', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const manufacturerSelect = screen.getByDisplayValue('All Manufacturers');
      await user.selectOptions(manufacturerSelect, 'TestBrand');
      
      expect(mockAdvancedSearchReturn.setManufacturer).toHaveBeenCalledWith('TestBrand');
    });

    it('calls setInStock when stock filter changes', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const stockSelect = screen.getByDisplayValue('All Items');
      await user.selectOptions(stockSelect, 'true');
      
      expect(mockAdvancedSearchReturn.setInStock).toHaveBeenCalledWith(true);
    });

    it('calls clearFilters when clear filters button is clicked', async () => {
      const user = userEvent.setup();
      useAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        hasActiveFilters: true,
        searchStats: {
          ...mockAdvancedSearchReturn.searchStats,
          appliedFilters: ['Category: CCTV', 'Price: 50 - Infinity']
        }
      });
      
      render(<ItemSelector />);
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const clearButton = screen.getByText('Clear All Filters');
      await user.click(clearButton);
      
      expect(mockAdvancedSearchReturn.clearFilters).toHaveBeenCalled();
    });

    it('shows active filter count on filter button', () => {
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        hasActiveFilters: true,
        searchStats: {
          ...mockAdvancedSearchReturn.searchStats,
          appliedFilters: ['Category: CCTV', 'Manufacturer: TestBrand']
        }
      });
      
      render(<ItemSelector />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays applied filters in advanced filter section', async () => {
      const user = userEvent.setup();
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        hasActiveFilters: true,
        searchStats: {
          ...mockAdvancedSearchReturn.searchStats,
          appliedFilters: ['Category: CCTV', 'Price: 50 - 200']
        }
      });
      
      render(<ItemSelector />);
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Active filters: Category: CCTV, Price: 50 - 200')).toBeInTheDocument();
    });
  });

  describe('Search Result Highlighting', () => {
    it('calls getHighlightedText for item names', () => {
      const mockGetHighlightedText = vi.fn((item, field) => 
        field === 'name' && item.name === 'Test Camera' 
          ? 'Test <mark>Camera</mark>' 
          : item[field]
      );
      
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        getHighlightedText: mockGetHighlightedText
      });
      
      render(<ItemSelector />);
      
      expect(mockGetHighlightedText).toHaveBeenCalledWith(mockItems[0], 'name');
      expect(mockGetHighlightedText).toHaveBeenCalledWith(mockItems[0], 'description');
      expect(mockGetHighlightedText).toHaveBeenCalledWith(mockItems[0], 'manufacturer');
    });

    it('renders highlighted text with HTML markup', () => {
      const mockGetHighlightedText = vi.fn((item, field) => 
        field === 'name' && item.name === 'Test Camera' 
          ? 'Test <mark>Camera</mark>' 
          : item[field]
      );
      
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        getHighlightedText: mockGetHighlightedText
      });
      
      render(<ItemSelector />);
      
      const highlightedElement = screen.getByText('Test Camera').closest('h3');
      expect(highlightedElement).toBeInTheDocument();
    });
  });

  describe('No Results State', () => {
    it('shows no results message when filteredItems is empty', () => {
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        filteredItems: [],
        resultCount: 0
      });
      
      render(<ItemSelector />);
      
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Start typing to search for items')).toBeInTheDocument();
    });

    it('shows different message when filters are active but no results', () => {
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        filteredItems: [],
        resultCount: 0,
        hasActiveFilters: true
      });
      
      render(<ItemSelector />);
      
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });

    it('shows clear filters button in no results state when filters are active', async () => {
      const user = userEvent.setup();
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        filteredItems: [],
        resultCount: 0,
        hasActiveFilters: true
      });
      
      render(<ItemSelector />);
      
      const clearButton = screen.getByText('Clear all filters');
      await user.click(clearButton);
      
      expect(mockAdvancedSearchReturn.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Filter Persistence', () => {
    it('maintains filter state across component re-renders', () => {
      const { rerender } = render(<ItemSelector />);
      
      // Simulate filter state change
      mockUseAdvancedSearch.mockReturnValue({
        ...mockAdvancedSearchReturn,
        filters: {
          ...mockAdvancedSearchReturn.filters,
          search: 'camera',
          category: 'CCTV'
        },
        hasActiveFilters: true
      });
      
      rerender(<ItemSelector />);
      
      expect(screen.getByDisplayValue('camera')).toBeInTheDocument();
      expect(screen.getByDisplayValue('CCTV')).toBeInTheDocument();
    });

    it('shows filter options from filterOptions', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      await user.click(categorySelect);
      
      expect(screen.getByRole('option', { name: 'CCTV' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Power' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Network' })).toBeInTheDocument();
    });

    it('shows manufacturer options in advanced filters', async () => {
      const user = userEvent.setup();
      render(<ItemSelector />);
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const manufacturerSelect = screen.getByDisplayValue('All Manufacturers');
      await user.click(manufacturerSelect);
      
      expect(screen.getByRole('option', { name: 'TestBrand' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'PowerCorp' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'NetBrand' })).toBeInTheDocument();
    });
  });
});
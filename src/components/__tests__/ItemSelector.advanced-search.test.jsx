import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ItemSelector from '../ItemSelector';
import { useAppStore } from '../../store';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

// Mock the advanced search hook
vi.mock('../../hooks/useAdvancedSearch');

// Mock the multi-select hook
vi.mock('../../hooks/useMultiSelect', () => ({
  useMultiSelect: vi.fn(() => ({
    selectedItems: new Set(),
    selectedArray: [],
    selectedCount: 0,
    hasSelection: false,
    isSelected: () => false,
    toggleItem: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    areAllSelected: () => false,
    areSomeSelected: () => false
  }))
}));

const mockItems = [
  {
    id: 'item-1',
    name: 'HD Security Camera',
    category: 'CCTV',
    unitPrice: 150,
    unit: 'pcs',
    description: 'High definition security camera with night vision',
    manufacturer: 'SecureTech',
    dependencies: [],
    tags: ['security', 'surveillance']
  },
  {
    id: 'item-2',
    name: 'Wireless Router',
    category: 'Network',
    unitPrice: 80,
    unit: 'pcs',
    description: 'High-speed wireless router for network connectivity',
    manufacturer: 'NetGear',
    dependencies: [],
    tags: ['network', 'wireless']
  }
];

const mockStore = {
  masterDatabase: mockItems,
  boqItems: [],
  addBOQItem: vi.fn(),
  showItemDB: true,
  toggleItemDB: vi.fn(),
  categories: ['CCTV', 'Network'],
  loading: {},
  errors: {}
};

const mockAdvancedSearch = {
  filteredItems: mockItems,
  searchResults: mockItems.map(item => ({ item, score: 1, matches: [] })),
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
    totalResults: mockItems.length,
    searchTime: 5,
    appliedFilters: []
  },
  resultCount: mockItems.length,
  updateFilters: vi.fn(),
  setSearchTerm: vi.fn(),
  setCategory: vi.fn(),
  setPriceRange: vi.fn(),
  setManufacturer: vi.fn(),
  setInStock: vi.fn(),
  setTags: vi.fn(),
  clearFilters: vi.fn(),
  clearSearchTerm: vi.fn(),
  getHighlightedText: vi.fn((item, field) => item[field]),
  getSearchSuggestions: vi.fn(() => []),
  getFilterOptions: vi.fn(() => ({
    categories: ['CCTV', 'Network'],
    manufacturers: ['SecureTech', 'NetGear'],
    tags: ['security', 'surveillance', 'network', 'wireless'],
    priceRange: [80, 300]
  })),
  filterOptions: {
    categories: ['CCTV', 'Network'],
    manufacturers: ['SecureTech', 'NetGear'],
    tags: ['security', 'surveillance', 'network', 'wireless'],
    priceRange: [80, 300]
  }
};

describe('ItemSelector Advanced Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.mockReturnValue({
      ...mockStore,
      ui: { modals: { itemSelector: true } }
    });
    useAdvancedSearch.mockReturnValue(mockAdvancedSearch);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('should render search input and call setSearchTerm on input change', async () => {
    const user = userEvent.setup();
    render(<ItemSelector />);
    
    const searchInput = screen.getByPlaceholderText(/search by name, description, or manufacturer/i);
    expect(searchInput).toBeInTheDocument();
    
    await user.type(searchInput, 'camera');
    
    // Check that setSearchTerm was called with the final value
    expect(mockAdvancedSearch.setSearchTerm).toHaveBeenLastCalledWith('a');
    // Or check that it was called multiple times (once per character)
    expect(mockAdvancedSearch.setSearchTerm).toHaveBeenCalledTimes(6);
  });

  it('should display filtered items from advanced search', () => {
    const filteredItems = [mockItems[0]]; // Only first item
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      filteredItems,
      resultCount: 1
    });

    render(<ItemSelector />);
    
    expect(screen.getByText('HD Security Camera')).toBeInTheDocument();
    expect(screen.queryByText('Wireless Router')).not.toBeInTheDocument();
  });

  it('should display search statistics with timing', () => {
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      searchStats: {
        totalResults: 2,
        searchTime: 12.5,
        appliedFilters: ['Category: CCTV']
      },
      hasActiveFilters: true,
      resultCount: 2
    });

    render(<ItemSelector />);
    
    expect(screen.getByText(/2 items found in 12.5ms/i)).toBeInTheDocument();
  });

  it('should show category filter dropdown and call setCategory', async () => {
    const user = userEvent.setup();
    render(<ItemSelector />);
    
    const categorySelect = screen.getByDisplayValue('All Categories');
    expect(categorySelect).toBeInTheDocument();
    
    await user.selectOptions(categorySelect, 'CCTV');
    
    expect(mockAdvancedSearch.setCategory).toHaveBeenCalledWith('CCTV');
  });

  it('should show no results message when no items match search', () => {
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      filteredItems: [],
      resultCount: 0,
      hasActiveFilters: true,
      filters: { ...mockAdvancedSearch.filters, search: 'nonexistent' }
    });

    render(<ItemSelector />);
    
    expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
    expect(screen.getByText(/check your spelling/i)).toBeInTheDocument();
  });

  it('should show search suggestions when typing', async () => {
    const user = userEvent.setup();
    const mockGetSearchSuggestions = vi.fn(() => ['Camera System', 'Security Camera']);
    
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      getSearchSuggestions: mockGetSearchSuggestions,
      filters: { ...mockAdvancedSearch.filters, search: 'cam' }
    });

    render(<ItemSelector />);
    
    const searchInput = screen.getByPlaceholderText(/search by name, description, or manufacturer/i);
    await user.click(searchInput);
    
    // Should show suggestions dropdown
    expect(screen.getByText('Suggestions:')).toBeInTheDocument();
    expect(screen.getByText('Camera System')).toBeInTheDocument();
    expect(screen.getByText('Security Camera')).toBeInTheDocument();
  });

  it('should show active filter indicators with clear buttons', () => {
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      hasActiveFilters: true,
      searchStats: {
        totalResults: 5,
        searchTime: 8.2,
        appliedFilters: ['Category: CCTV', 'Price: 100 - 200']
      }
    });

    render(<ItemSelector />);
    
    expect(screen.getByText(/2 filters active:/i)).toBeInTheDocument();
    expect(screen.getByText('Category: CCTV')).toBeInTheDocument();
    expect(screen.getByText('Price: 100 - 200')).toBeInTheDocument();
    
    // Should have clear buttons for each filter
    const clearButtons = screen.getAllByRole('button');
    const filterClearButtons = clearButtons.filter(button => 
      button.querySelector('svg') && button.closest('.bg-blue-100')
    );
    expect(filterClearButtons).toHaveLength(2);
  });

  it('should show category suggestions when no search is active', () => {
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      filteredItems: [],
      resultCount: 0,
      hasActiveFilters: false,
      filters: { ...mockAdvancedSearch.filters, search: '' }
    });

    render(<ItemSelector />);
    
    expect(screen.getByText(/browse by category:/i)).toBeInTheDocument();
    
    // Use getAllByText to handle multiple elements with same text
    const cctvButtons = screen.getAllByText('CCTV');
    const networkButtons = screen.getAllByText('Network');
    
    // Check that at least one of each exists (one in dropdown, one in suggestions)
    expect(cctvButtons.length).toBeGreaterThan(0);
    expect(networkButtons.length).toBeGreaterThan(0);
    
    // Specifically check for the suggestion button (not the dropdown option)
    const cctvSuggestionButton = cctvButtons.find(el => 
      el.tagName === 'BUTTON' && el.classList.contains('rounded-full')
    );
    expect(cctvSuggestionButton).toBeInTheDocument();
  });

  it('should highlight search results in item cards', () => {
    const mockGetHighlightedText = vi.fn((item, field) => {
      if (field === 'name' && item.name.includes('Camera')) {
        return 'HD Security <mark>Camera</mark>';
      }
      return item[field];
    });

    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      getHighlightedText: mockGetHighlightedText,
      filters: { ...mockAdvancedSearch.filters, search: 'camera' }
    });

    render(<ItemSelector />);
    
    expect(mockGetHighlightedText).toHaveBeenCalledWith(mockItems[0], 'name');
    expect(mockGetHighlightedText).toHaveBeenCalledWith(mockItems[0], 'description');
    expect(mockGetHighlightedText).toHaveBeenCalledWith(mockItems[0], 'manufacturer');
  });

  it('should persist filters to localStorage', () => {
    const mockSetItem = vi.fn();
    window.localStorage.setItem = mockSetItem;

    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      hasActiveFilters: true,
      filters: {
        ...mockAdvancedSearch.filters,
        category: 'CCTV',
        manufacturer: 'SecureTech'
      }
    });

    render(<ItemSelector />);
    
    expect(mockSetItem).toHaveBeenCalledWith(
      'itemSelector-filters',
      JSON.stringify({
        category: 'CCTV',
        manufacturer: 'SecureTech',
        priceRange: [0, Infinity],
        inStock: null
      })
    );
  });

  it('should restore filters from localStorage on open', () => {
    const mockGetItem = vi.fn(() => JSON.stringify({
      category: 'Network',
      manufacturer: 'NetGear',
      priceRange: [50, 150],
      inStock: true
    }));
    window.localStorage.getItem = mockGetItem;

    render(<ItemSelector />);
    
    expect(mockGetItem).toHaveBeenCalledWith('itemSelector-filters');
    expect(mockAdvancedSearch.setCategory).toHaveBeenCalledWith('Network');
    expect(mockAdvancedSearch.setManufacturer).toHaveBeenCalledWith('NetGear');
    expect(mockAdvancedSearch.setPriceRange).toHaveBeenCalledWith([50, 150]);
    expect(mockAdvancedSearch.setInStock).toHaveBeenCalledWith(true);
  });

  it('should clear individual filters when clicking filter clear buttons', async () => {
    const user = userEvent.setup();
    
    useAdvancedSearch.mockReturnValue({
      ...mockAdvancedSearch,
      hasActiveFilters: true,
      searchStats: {
        totalResults: 5,
        searchTime: 8.2,
        appliedFilters: ['Category: CCTV']
      }
    });

    render(<ItemSelector />);
    
    const categoryFilterTag = screen.getByText('Category: CCTV').closest('.bg-blue-100');
    const clearButton = categoryFilterTag.querySelector('button');
    
    await user.click(clearButton);
    
    expect(mockAdvancedSearch.setCategory).toHaveBeenCalledWith('');
  });
});
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAdvancedSearch, useSimpleSearch } from '../useAdvancedSearch';

// Mock data for testing
const mockItems = [
  {
    id: '1',
    name: 'Professional Camera',
    description: 'High-quality digital camera for professional photography',
    manufacturer: 'Canon',
    category: 'Electronics',
    unitPrice: 1200,
    tags: ['photography', 'professional'],
    metadata: { stockLevel: 5 }
  },
  {
    id: '2',
    name: 'Camera Lens',
    description: 'Wide-angle lens for landscape photography',
    manufacturer: 'Canon',
    category: 'Electronics',
    unitPrice: 800,
    tags: ['photography', 'lens'],
    metadata: { stockLevel: 0 }
  },
  {
    id: '3',
    name: 'Tripod Stand',
    description: 'Sturdy tripod for camera stabilization',
    manufacturer: 'Manfrotto',
    category: 'Accessories',
    unitPrice: 150,
    tags: ['support', 'stability'],
    metadata: { stockLevel: 10 }
  },
  {
    id: '4',
    name: 'Professional Microphone',
    description: 'High-quality microphone for audio recording',
    manufacturer: 'Shure',
    category: 'Audio',
    unitPrice: 300,
    tags: ['audio', 'professional'],
    metadata: { stockLevel: 3 }
  },
  {
    id: '5',
    name: 'Camera Battery',
    description: 'Rechargeable battery for Canon cameras',
    manufacturer: 'Canon',
    category: 'Accessories',
    unitPrice: 50,
    tags: ['power', 'battery'],
    metadata: { stockLevel: 20 }
  }
];

describe('useAdvancedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Search Functionality', () => {
    it('should return all items when no search term is provided', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      expect(result.current.filteredItems).toHaveLength(5);
      expect(result.current.resultCount).toBe(5);
    });

    it('should filter items based on search term', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
      });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.filteredItems).toHaveLength(3);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['1', '2', '5']);
    });

    it('should search across multiple fields', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('Canon');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.filteredItems).toHaveLength(3);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['1', '2', '5']);
    });

    it('should be case insensitive by default', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('CAMERA');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.filteredItems).toHaveLength(3);
    });

    it('should respect minimum search length', async () => {
      const { result } = renderHook(() => 
        useAdvancedSearch(mockItems, { minSearchLength: 3 })
      );
      
      act(() => {
        result.current.setSearchTerm('ca');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.filteredItems).toHaveLength(5); // Should return all items
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by category', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setCategory('Electronics');
      });

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['1', '2']);
    });

    it('should filter by price range', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setPriceRange([100, 500]);
      });

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['3', '4']);
    });

    it('should filter by manufacturer', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setManufacturer('Canon');
      });

      expect(result.current.filteredItems).toHaveLength(3);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['1', '2', '5']);
    });

    it('should filter by stock status', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setInStock(true);
      });

      expect(result.current.filteredItems).toHaveLength(4);
      expect(result.current.filteredItems.find(item => item.id === '2')).toBeUndefined();
    });

    it('should filter by tags', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setTags(['professional']);
      });

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['1', '4']);
    });

    it('should combine multiple filters', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
        result.current.setCategory('Electronics');
        result.current.setManufacturer('Canon');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.filteredItems).toHaveLength(2);
      expect(result.current.filteredItems.map(item => item.id)).toEqual(['1', '2']);
    });
  });

  describe('Search Ranking', () => {
    it('should rank exact matches higher', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('Camera');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      // Professional Camera should rank higher than Camera Lens or Camera Battery
      expect(result.current.searchResults[0].item.name).toBe('Professional Camera');
    });

    it('should rank name matches higher than description matches', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('professional');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      // Items with 'professional' in name should rank higher
      expect(result.current.searchResults[0].item.name).toBe('Professional Camera');
      expect(result.current.searchResults[1].item.name).toBe('Professional Microphone');
    });
  });

  describe('Search Highlighting', () => {
    it('should provide highlighted text for matches', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      const highlightedName = result.current.getHighlightedText(mockItems[0], 'name');
      expect(highlightedName).toContain('<mark>');
      expect(highlightedName).toContain('Camera');
    });

    it('should return original text when no highlighting is needed', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      const highlightedName = result.current.getHighlightedText(mockItems[0], 'name');
      expect(highlightedName).toBe('Professional Camera');
      expect(highlightedName).not.toContain('<mark>');
    });
  });

  describe('Search Statistics', () => {
    it('should provide search statistics', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
        result.current.setCategory('Electronics');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.searchStats.totalResults).toBe(2);
      expect(result.current.searchStats.searchTime).toBeGreaterThan(0);
      expect(result.current.searchStats.appliedFilters).toContain('Category: Electronics');
    });

    it('should track active filters', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setCategory('Electronics');
        result.current.setPriceRange([100, 1000]);
      });

      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.searchStats.appliedFilters).toHaveLength(2);
    });
  });

  describe('Filter Options', () => {
    it('should provide available filter options', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      const filterOptions = result.current.getFilterOptions();
      
      expect(filterOptions.categories).toEqual(['Accessories', 'Audio', 'Electronics']);
      expect(filterOptions.manufacturers).toEqual(['Canon', 'Manfrotto', 'Shure']);
      expect(filterOptions.tags).toEqual(['audio', 'battery', 'lens', 'photography', 'power', 'professional', 'stability', 'support']);
      expect(filterOptions.priceRange).toEqual([50, 1200]);
    });
  });

  describe('Search Suggestions', () => {
    it('should provide search suggestions', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('cam');
      });

      const suggestions = result.current.getSearchSuggestions();
      expect(suggestions).toContain('Camera');
      expect(suggestions).toContain('cameras');
    });

    it('should limit suggestions to specified maximum', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('a');
      });

      const suggestions = result.current.getSearchSuggestions(3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Clear Functions', () => {
    it('should clear all filters', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
        result.current.setCategory('Electronics');
        result.current.setPriceRange([100, 500]);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.category).toBe('');
      expect(result.current.filters.priceRange).toEqual([0, Infinity]);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should clear only search term', () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
        result.current.setCategory('Electronics');
      });

      act(() => {
        result.current.clearSearchTerm();
      });

      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.category).toBe('Electronics');
    });
  });

  describe('Performance', () => {
    it('should debounce search input', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems, { debounceMs: 100 }));
      
      expect(result.current.isSearching).toBe(false);
      
      act(() => {
        result.current.setSearchTerm('c');
      });
      
      expect(result.current.isSearching).toBe(true);
      
      act(() => {
        result.current.setSearchTerm('ca');
      });
      
      act(() => {
        result.current.setSearchTerm('cam');
      });
      
      expect(result.current.isSearching).toBe(true);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      
      expect(result.current.isSearching).toBe(false);
    });

    it('should measure search time', async () => {
      const { result } = renderHook(() => useAdvancedSearch(mockItems));
      
      act(() => {
        result.current.setSearchTerm('camera');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      expect(result.current.searchStats.searchTime).toBeGreaterThan(0);
    });
  });
});

describe('useSimpleSearch', () => {
  it('should filter items based on search term', () => {
    const { result } = renderHook(() => 
      useSimpleSearch(mockItems, 'camera', ['name', 'description'])
    );
    
    // Should find: Professional Camera, Camera Lens, Camera Battery, Tripod Stand (has "camera" in description)
    expect(result.current).toHaveLength(4);
    expect(result.current.map(item => item.id)).toEqual(['1', '2', '3', '5']);
  });

  it('should return all items when search term is empty', () => {
    const { result } = renderHook(() => 
      useSimpleSearch(mockItems, '', ['name'])
    );
    
    expect(result.current).toHaveLength(5);
  });

  it('should search only in specified fields', () => {
    const { result } = renderHook(() => 
      useSimpleSearch(mockItems, 'Canon', ['manufacturer'])
    );
    
    expect(result.current).toHaveLength(3);
    expect(result.current.map(item => item.id)).toEqual(['1', '2', '5']);
  });

  it('should be case insensitive', () => {
    const { result } = renderHook(() => 
      useSimpleSearch(mockItems, 'CAMERA', ['name'])
    );
    
    // Should find: Professional Camera, Camera Lens, Camera Battery
    expect(result.current).toHaveLength(3);
    expect(result.current.map(item => item.id)).toEqual(['1', '2', '5']);
  });
});
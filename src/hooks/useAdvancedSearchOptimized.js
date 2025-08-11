import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { optimizedSearch } from '../utils/optimizedSearch.js';

/**
 * Advanced search hook with performance optimizations
 * Enhanced with caching, indexing, and performance monitoring
 * @param {Array} items - Array of items to search through
 * @param {Object} options - Search configuration options
 * @returns {Object} Search state and methods
 */
export const useAdvancedSearchOptimized = (items = [], options = {}) => {
  const {
    debounceMs = 300,
    minSearchLength = 1,
    searchFields = ['name', 'description', 'manufacturer'],
    caseSensitive = false,
    enableHighlighting = true,
    enableRanking = true,
    enableCache = true,
    enableIndex = true,
    enableAnalytics = true
  } = options;

  // Search state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: [0, Infinity],
    manufacturer: '',
    inStock: null,
    tags: []
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState({
    filtered: [],
    stats: {
      totalResults: 0,
      searchTime: 0,
      appliedFilters: [],
      cacheHit: false,
      indexUsed: false,
      source: 'initial'
    }
  });

  const debounceTimeoutRef = useRef(null);
  const searchAbortControllerRef = useRef(null);

  // Initialize optimized search when items change
  useEffect(() => {
    if (items.length > 0 && enableIndex) {
      optimizedSearch.initializeIndex(items, searchFields);
    }
  }, [items, searchFields, enableIndex]);

  // Configure optimized search options
  useEffect(() => {
    optimizedSearch.configure({
      enableCache,
      enableIndex,
      enableAnalytics,
      searchFields,
      caseSensitive,
      enableRanking
    });
  }, [enableCache, enableIndex, enableAnalytics, searchFields, caseSensitive, enableRanking]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsSearching(true);

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters.search, debounceMs]);

  // Perform search when debounced search or filters change
  useEffect(() => {
    const performSearch = async () => {
      // Abort previous search if still running
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      searchAbortControllerRef.current = abortController;

      try {
        setIsSearching(true);

        const result = await optimizedSearch.search(
          items,
          debouncedSearch,
          filters,
          {
            searchFields,
            caseSensitive,
            enableRanking,
            enableHighlighting,
            minSearchLength,
            signal: abortController.signal
          }
        );

        // Check if search was aborted
        if (abortController.signal.aborted) {
          return;
        }

        setSearchResult({
          filtered: result.results,
          stats: {
            totalResults: result.totalMatches,
            searchTime: Math.round(result.searchTime * 100) / 100,
            appliedFilters: result.appliedFilters || [],
            cacheHit: result.cacheHit,
            indexUsed: result.indexUsed,
            source: result.source,
            truncated: result.truncated
          }
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return; // Search was aborted, ignore
        }

        console.warn('Optimized search failed, using fallback:', error);
        
        // Fallback to synchronous search
        const fallbackResult = performFallbackSearch();
        setSearchResult(fallbackResult);
      } finally {
        setIsSearching(false);
        searchAbortControllerRef.current = null;
      }
    };

    performSearch();

    return () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, [items, debouncedSearch, filters, searchFields, caseSensitive, minSearchLength, enableHighlighting, enableRanking]);

  // Fallback search function
  const performFallbackSearch = useCallback(() => {
    const startTime = performance.now();

    // Search logic
    let searchResults;
    if (!debouncedSearch || debouncedSearch.length < minSearchLength) {
      searchResults = items.map(item => ({ item, score: 0, matches: [] }));
    } else {
      const term = caseSensitive ? debouncedSearch : debouncedSearch.toLowerCase();
      const results = [];

      items.forEach(item => {
        let score = 0;
        const matches = [];

        searchFields.forEach(field => {
          const fieldValue = item[field];
          if (!fieldValue) return;

          const value = caseSensitive ? fieldValue : fieldValue.toLowerCase();
          
          if (value.includes(term)) {
            // Calculate relevance score
            const exactMatch = value === term;
            const startsWithMatch = value.startsWith(term);
            const wordBoundaryMatch = new RegExp(`\\b${term}`, caseSensitive ? 'g' : 'gi').test(value);
            
            let fieldScore = 1; // Base score for any match
            
            if (exactMatch) fieldScore += 10;
            else if (startsWithMatch) fieldScore += 5;
            else if (wordBoundaryMatch) fieldScore += 3;
            
            // Boost score for name field matches
            if (field === 'name') fieldScore *= 2;
            
            score += fieldScore;
            
            // Store match information for highlighting
            if (enableHighlighting) {
              const regex = new RegExp(`(${term})`, caseSensitive ? 'g' : 'gi');
              const highlightedValue = value.replace(regex, '<mark>$1</mark>');
              matches.push({
                field,
                value: fieldValue,
                highlighted: highlightedValue,
                originalValue: fieldValue
              });
            }
          }
        });

        if (score > 0) {
          results.push({ item, score, matches });
        }
      });

      // Sort by relevance score if ranking is enabled
      if (enableRanking) {
        results.sort((a, b) => b.score - a.score);
      }

      searchResults = results;
    }
    
    // Filter logic
    let filtered = searchResults;
    const appliedFilters = [];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(result => result.item.category === filters.category);
      appliedFilters.push(`Category: ${filters.category}`);
    }

    // Price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < Infinity) {
      filtered = filtered.filter(result => {
        const price = result.item.unitPrice || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
      appliedFilters.push(`Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}`);
    }

    // Manufacturer filter
    if (filters.manufacturer) {
      filtered = filtered.filter(result => 
        result.item.manufacturer && 
        result.item.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase())
      );
      appliedFilters.push(`Manufacturer: ${filters.manufacturer}`);
    }

    // Stock filter
    if (filters.inStock !== null) {
      filtered = filtered.filter(result => {
        const stockLevel = result.item.metadata?.stockLevel;
        return filters.inStock ? (stockLevel && stockLevel > 0) : (stockLevel === 0 || !stockLevel);
      });
      appliedFilters.push(`In Stock: ${filters.inStock ? 'Yes' : 'No'}`);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(result => {
        const itemTags = result.item.tags || [];
        return filters.tags.every(tag => itemTags.includes(tag));
      });
      appliedFilters.push(`Tags: ${filters.tags.join(', ')}`);
    }

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    return {
      filtered,
      stats: {
        totalResults: filtered.length,
        searchTime: Math.round(searchTime * 100) / 100,
        appliedFilters,
        cacheHit: false,
        indexUsed: false,
        source: 'fallback'
      }
    };
  }, [items, debouncedSearch, filters, searchFields, caseSensitive, minSearchLength, enableHighlighting, enableRanking]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Set individual filter values
  const setSearchTerm = useCallback((search) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setCategory = useCallback((category) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const setPriceRange = useCallback((priceRange) => {
    setFilters(prev => ({ ...prev, priceRange }));
  }, []);

  const setManufacturer = useCallback((manufacturer) => {
    setFilters(prev => ({ ...prev, manufacturer }));
  }, []);

  const setInStock = useCallback((inStock) => {
    setFilters(prev => ({ ...prev, inStock }));
  }, []);

  const setTags = useCallback((tags) => {
    setFilters(prev => ({ ...prev, tags }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      priceRange: [0, Infinity],
      manufacturer: '',
      inStock: null,
      tags: []
    });
  }, []);

  const clearSearchTerm = useCallback(() => {
    setFilters(prev => ({ ...prev, search: '' }));
  }, []);

  // Get highlighted text for a specific item and field
  const getHighlightedText = useCallback((item, field) => {
    if (!enableHighlighting || !debouncedSearch || debouncedSearch.length < minSearchLength) {
      return item[field] || '';
    }

    const fieldValue = item[field];
    if (!fieldValue) return '';

    const term = caseSensitive ? debouncedSearch : debouncedSearch.toLowerCase();
    const value = caseSensitive ? fieldValue : fieldValue.toLowerCase();
    
    if (value.includes(term)) {
      const regex = new RegExp(`(${term})`, caseSensitive ? 'g' : 'gi');
      return fieldValue.replace(regex, '<mark>$1</mark>');
    }

    return fieldValue;
  }, [debouncedSearch, enableHighlighting, minSearchLength, caseSensitive]);

  // Get search suggestions based on current input
  const getSearchSuggestions = useCallback((maxSuggestions = 5) => {
    if (!filters.search || filters.search.length < 2) {
      return [];
    }

    const suggestions = new Set();
    const term = filters.search.toLowerCase();

    items.forEach(item => {
      searchFields.forEach(field => {
        const value = item[field];
        if (value && value.toLowerCase().includes(term)) {
          // Extract words that contain the search term
          const words = value.split(/\s+/);
          words.forEach(word => {
            if (word.toLowerCase().includes(term) && word.length > term.length) {
              suggestions.add(word);
            }
          });
        }
      });
    });

    return Array.from(suggestions).slice(0, maxSuggestions);
  }, [items, filters.search, searchFields]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' ||
           filters.category !== '' ||
           filters.priceRange[0] > 0 ||
           filters.priceRange[1] < Infinity ||
           filters.manufacturer !== '' ||
           filters.inStock !== null ||
           filters.tags.length > 0;
  }, [filters]);

  // Memoize filter options to prevent recalculation
  const filterOptions = useMemo(() => {
    const categories = new Set();
    const manufacturers = new Set();
    const tags = new Set();
    let minPrice = Infinity;
    let maxPrice = 0;

    items.forEach(item => {
      if (item.category) categories.add(item.category);
      if (item.manufacturer) manufacturers.add(item.manufacturer);
      if (item.tags) item.tags.forEach(tag => tags.add(tag));
      
      const price = item.unitPrice || 0;
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });

    return {
      categories: Array.from(categories).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      tags: Array.from(tags).sort(),
      priceRange: minPrice === Infinity ? [0, 0] : [minPrice, maxPrice]
    };
  }, [items]);

  // Get performance statistics
  const getPerformanceStats = useCallback(() => {
    return optimizedSearch.getPerformanceStats();
  }, []);

  return {
    // Filtered results
    filteredItems: searchResult.filtered.map(result => result.item),
    searchResults: searchResult.filtered, // Includes score and matches
    
    // Filter state
    filters,
    hasActiveFilters,
    
    // Search state
    isSearching,
    searchStats: searchResult.stats,
    resultCount: searchResult.filtered.length,
    
    // Filter methods
    updateFilters,
    setSearchTerm,
    setCategory,
    setPriceRange,
    setManufacturer,
    setInStock,
    setTags,
    clearFilters,
    clearSearchTerm,
    
    // Utility methods
    getHighlightedText,
    getSearchSuggestions,
    filterOptions,
    getPerformanceStats
  };
};

export default useAdvancedSearchOptimized;
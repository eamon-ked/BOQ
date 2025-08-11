import React, { useState, memo, useCallback, useEffect, useRef } from 'react';
import { Search, Plus, X, Filter, Tag, Square, CheckSquare } from 'lucide-react';
import { useAppStore } from '../store';
import toast from 'react-hot-toast';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { useMultiSelect } from '../hooks/useMultiSelect';
import BulkOperations from './BulkOperations';
import VirtualizedList from './VirtualizedList';

// Memoized item card component with search highlighting and selection
const ItemCard = memo(({ 
  item, 
  quantity, 
  onAddItem, 
  masterDatabase, 
  getHighlightedText, 
  searchStats,
  isSelected,
  onToggleSelect,
  showCheckbox = false
}) => {
  const handleAddClick = useCallback(() => {
    onAddItem(item);
  }, [item, onAddItem]);

  const handleCheckboxClick = useCallback((e) => {
    e.stopPropagation();
    onToggleSelect(item.id);
  }, [item.id, onToggleSelect]);

  const handleCardClick = useCallback(() => {
    if (showCheckbox) {
      onToggleSelect(item.id);
    }
  }, [item.id, onToggleSelect, showCheckbox]);

  // Helper function to render highlighted text
  const renderHighlightedText = useCallback((text, field) => {
    if (!getHighlightedText) return text;
    const highlighted = getHighlightedText(item, field);
    return highlighted ? (
      <span dangerouslySetInnerHTML={{ __html: highlighted }} />
    ) : text;
  }, [item, getHighlightedText]);

  return (
    <div 
      className={`
        border rounded-xl p-5 transition-all duration-200 hover-lift cursor-pointer
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
          : 'border-gray-200 dark:border-gray-700 hover:bg-blue-25 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          {/* Selection checkbox */}
          {showCheckbox && (
            <button
              onClick={handleCheckboxClick}
              className="mt-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-blue-600" />
              ) : (
                <Square size={20} className="text-gray-400" />
              )}
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                {renderHighlightedText(item.name, 'name')}
              </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
              {item.category}
            </span>
            {item.dependencies && item.dependencies.length > 0 && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-medium">
                +{item.dependencies.length} auto-deps
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {renderHighlightedText(item.description, 'description')}
          </p>
          
          {item.manufacturer && (
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
              <span className="text-gray-500 dark:text-gray-400">by</span> {renderHighlightedText(item.manufacturer, 'manufacturer')}
            </p>
          )}
          
          <div className="flex items-center gap-6 text-sm mb-3">
            <span className="font-bold text-green-600 dark:text-green-400 text-lg">
              ${Number(item.unitPrice) || 0} / {item.unit}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Total: ${((Number(item.unitPrice) || 0) * quantity).toFixed(2)}
            </span>
          </div>
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  <Tag size={10} className="inline mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {item.dependencies && item.dependencies.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mt-3">
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1">
                Will automatically add:
              </p>
              <div className="text-xs text-orange-700">
                {item.dependencies.map(dep => {
                  const depItem = masterDatabase.find(dbItem => dbItem.id === dep.itemId);
                  return depItem ? `${depItem.name} (${dep.quantity * quantity}x)` : dep.itemId;
                }).join(', ')}
              </div>
            </div>
          )}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddClick();
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ml-4"
        >
          <Plus size={18} />
          Add to BOQ
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.quantity === nextProps.quantity &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showCheckbox === nextProps.showCheckbox
  );
});

ItemCard.displayName = 'ItemCard';

const ItemSelector = memo(() => {
  // Get data from store with proper selectors
  const isOpen = useAppStore((state) => state.ui.modals.itemSelector);
  const masterDatabase = useAppStore((state) => state.data.masterDatabase);
  
  // Get actions from store
  const closeModal = useAppStore((state) => state.closeModal);
  const addBOQItem = useAppStore((state) => state.addBOQItem);
  const addMultipleBOQItems = useAppStore((state) => state.addMultipleBOQItems);
  const deleteMultipleMasterItems = useAppStore((state) => state.deleteMultipleMasterItems);
  const duplicateMultipleMasterItems = useAppStore((state) => state.duplicateMultipleMasterItems);
  
  // Local state for form inputs
  const [quantity, setQuantity] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Ref for virtual list
  const virtualListRef = useRef(null);

  // Initialize advanced search hook with filter persistence
  const {
    filteredItems,
    filters,
    hasActiveFilters,
    isSearching,
    searchStats,
    resultCount,
    setSearchTerm,
    setCategory,
    setPriceRange,
    setManufacturer,
    setInStock,
    clearFilters,
    getHighlightedText,
    getSearchSuggestions,
    filterOptions
  } = useAdvancedSearch(masterDatabase, {
    debounceMs: 300,
    minSearchLength: 1,
    searchFields: ['name', 'description', 'manufacturer'],
    caseSensitive: false,
    enableHighlighting: true,
    enableRanking: true
  });

  // Get search suggestions for current input
  const suggestions = getSearchSuggestions(5);

  // Initialize multi-select hook
  const {
    selectedArray,
    selectedCount,
    hasSelection,
    isSelected,
    toggleItem,
    selectAll,
    clearSelection,
    areAllSelected,
    areSomeSelected
  } = useMultiSelect({
    selectMode: 'checkbox',
    maxSelections: 100
  });

  // Filter persistence - save/restore filters from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedFilters = localStorage.getItem('itemSelector-filters');
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          // Restore filters except search term (to avoid confusion)
          if (parsed.category) setCategory(parsed.category);
          if (parsed.manufacturer) setManufacturer(parsed.manufacturer);
          if (parsed.priceRange && Array.isArray(parsed.priceRange)) {
            setPriceRange(parsed.priceRange);
          }
          if (parsed.inStock !== null && parsed.inStock !== undefined) {
            setInStock(parsed.inStock);
          }
        } catch (error) {
          console.warn('Failed to restore saved filters:', error);
        }
      }
    }
  }, [isOpen, setCategory, setManufacturer, setPriceRange, setInStock]);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (isOpen && hasActiveFilters) {
      const filtersToSave = {
        category: filters.category,
        manufacturer: filters.manufacturer,
        priceRange: filters.priceRange,
        inStock: filters.inStock
      };
      localStorage.setItem('itemSelector-filters', JSON.stringify(filtersToSave));
    }
  }, [isOpen, hasActiveFilters, filters]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleAddItem = useCallback((item) => {
    addBOQItem(item, parseInt(quantity));
    setQuantity(1);
  }, [addBOQItem, quantity]);

  const handleClose = useCallback(() => {
    closeModal('itemSelector');
    setShowBulkMode(false);
    clearSelection();
  }, [closeModal, clearSelection]);

  // Handle bulk operations with enhanced error handling and result reporting
  const handleBulkOperation = useCallback(async (operationId, itemIds) => {
    const items = masterDatabase.filter(item => itemIds.includes(item.id));
    const results = { successful: [], failed: [] };
    
    try {
      switch (operationId) {
        case 'addToBOQ':
          try {
            const itemsWithQuantity = items.map(item => ({ item, quantity: parseInt(quantity) }));
            addMultipleBOQItems(itemsWithQuantity);
            results.successful = itemIds;
            clearSelection();
          } catch (error) {
            console.error('Add to BOQ operation failed:', error);
            results.failed = itemIds.map(id => ({ 
              item: id, 
              itemName: items.find(item => item.id === id)?.name || id,
              error: error.message 
            }));
          }
          break;
          
        case 'bulkEdit':
          // For now, just return success - actual bulk edit would need a form
          // In a real implementation, this would validate each item before editing
          try {
            results.successful = itemIds;
          } catch (error) {
            results.failed = itemIds.map(id => ({ 
              item: id, 
              itemName: items.find(item => item.id === id)?.name || id,
              error: error.message 
            }));
          }
          break;
          
        case 'duplicate':
          try {
            duplicateMultipleMasterItems(itemIds);
            results.successful = itemIds;
            clearSelection();
          } catch (error) {
            console.error('Duplicate operation failed:', error);
            results.failed = itemIds.map(id => ({ 
              item: id, 
              itemName: items.find(item => item.id === id)?.name || id,
              error: error.message 
            }));
          }
          break;
          
        case 'delete':
          try {
            // Check if any items are currently in BOQ before deletion
            const currentBOQItems = useAppStore.getState().data.boqItems;
            const itemsInBOQ = itemIds.filter(id => 
              currentBOQItems.some(boqItem => boqItem.id === id)
            );
            
            deleteMultipleMasterItems(itemIds);
            results.successful = itemIds;
            clearSelection();
            
            // Provide additional feedback about BOQ impact
            if (itemsInBOQ.length > 0) {
              toast.info(`${itemsInBOQ.length} deleted items were also removed from BOQ`, {
                duration: 4000,
                icon: 'ℹ️'
              });
            }
          } catch (error) {
            console.error('Delete operation failed:', error);
            results.failed = itemIds.map(id => ({ 
              item: id, 
              itemName: items.find(item => item.id === id)?.name || id,
              error: error.message 
            }));
          }
          break;
          
        default:
          throw new Error(`Unknown operation: ${operationId}`);
      }
      
      // Enhanced result reporting with detailed feedback
      if (results.successful.length > 0 && results.failed.length === 0) {
        // All operations successful
        const operationNames = {
          'addToBOQ': 'added to BOQ',
          'bulkEdit': 'edited',
          'duplicate': 'duplicated',
          'delete': 'deleted'
        };
        
        toast.success(`Successfully ${operationNames[operationId]} ${results.successful.length} items`, {
          duration: 4000,
          icon: '✅'
        });
      } else if (results.successful.length > 0 && results.failed.length > 0) {
        // Partial success
        toast.success(`Operation completed: ${results.successful.length} successful, ${results.failed.length} failed`, {
          duration: 6000,
          icon: '⚠️'
        });
        
        // Show details about failed items
        const failedItemNames = results.failed.slice(0, 3).map(f => f.itemName).join(', ');
        const moreFailures = results.failed.length > 3 ? ` and ${results.failed.length - 3} more` : '';
        
        toast.error(`Failed items: ${failedItemNames}${moreFailures}`, {
          duration: 8000,
          icon: '❌'
        });
      } else if (results.failed.length > 0) {
        // All operations failed
        toast.error(`Operation failed for all ${results.failed.length} items`, {
          duration: 6000,
          icon: '❌'
        });
        
        // Show first few error details
        const firstError = results.failed[0];
        if (firstError && firstError.error) {
          toast.error(`Error: ${firstError.error}`, {
            duration: 8000,
            icon: '🔍'
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Bulk operation failed:', error);
      const failedResults = itemIds.map(id => ({ 
        item: id, 
        itemName: items.find(item => item.id === id)?.name || id,
        error: error.message 
      }));
      
      toast.error(`Bulk operation failed: ${error.message}`, {
        duration: 6000,
        icon: '❌'
      });
      
      return { successful: [], failed: failedResults };
    }
  }, [masterDatabase, quantity, addMultipleBOQItems, duplicateMultipleMasterItems, deleteMultipleMasterItems, clearSelection]);

  // Handle select all toggle
  const handleSelectAllToggle = useCallback(() => {
    const currentPageItemIds = filteredItems.map(item => item.id);
    if (areAllSelected(currentPageItemIds)) {
      clearSelection();
    } else {
      selectAll(currentPageItemIds);
    }
  }, [filteredItems, areAllSelected, clearSelection, selectAll]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {showBulkMode ? 'Bulk Operations' : 'Add Item to BOQ'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredItems.length} items available
                {showBulkMode && selectedCount > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                    • {selectedCount} selected
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowBulkMode(!showBulkMode);
                  if (showBulkMode) {
                    clearSelection();
                  }
                }}
                className={`
                  px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium
                  ${showBulkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {showBulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
              </button>
              <button 
                onClick={handleClose} 
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          {/* Main search row */}
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, description, or manufacturer..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={filters.search}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
                
                {/* Search suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && filters.search.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                    <div className="p-2 text-xs text-gray-500 border-b border-gray-200">
                      Suggestions:
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm transition-colors"
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={filters.category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                className="w-24 px-3 py-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 border rounded-lg transition-all duration-200 flex items-center gap-2 ${
                showAdvancedFilters || hasActiveFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {searchStats.appliedFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price range filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.priceRange[0] === 0 ? '' : filters.priceRange[0]}
                      onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, filters.priceRange[1]])}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.priceRange[1] === Infinity ? '' : filters.priceRange[1]}
                      onChange={(e) => setPriceRange([filters.priceRange[0], parseFloat(e.target.value) || Infinity])}
                    />
                  </div>
                </div>

                {/* Manufacturer filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  >
                    <option value="">All Manufacturers</option>
                    {filterOptions.manufacturers.map(manufacturer => (
                      <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                    ))}
                  </select>
                </div>

                {/* Stock filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.inStock === null ? '' : filters.inStock.toString() || ''}
                    onChange={(e) => setInStock(e.target.value === '' ? null : e.target.value === 'true')}
                  >
                    <option value="">All Items</option>
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {searchStats.appliedFilters.length > 0 && (
                    <span>Active filters: {searchStats.appliedFilters.join(', ')}</span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={!hasActiveFilters}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Search stats and bulk selection */}
          <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-4">
              <span>
                {resultCount} items found
                {searchStats.searchTime > 0 && ` in ${searchStats.searchTime}ms`}
              </span>
              {showBulkMode && filteredItems.length > 0 && (
                <button
                  onClick={handleSelectAllToggle}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {areAllSelected(filteredItems.map(item => item.id)) ? (
                    <CheckSquare size={16} />
                  ) : areSomeSelected(filteredItems.map(item => item.id)) ? (
                    <div className="w-4 h-4 border-2 border-blue-600 bg-blue-600 rounded-sm flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-white"></div>
                    </div>
                  ) : (
                    <Square size={16} />
                  )}
                  {areAllSelected(filteredItems.map(item => item.id)) ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            
            {/* Active filter indicators */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600">
                  {searchStats.appliedFilters.length} filter{searchStats.appliedFilters.length !== 1 ? 's' : ''} active:
                </span>
                <div className="flex flex-wrap gap-1">
                  {searchStats.appliedFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {filter}
                      <button
                        onClick={() => {
                          // Clear specific filter based on its type
                          if (filter.startsWith('Category:')) setCategory('');
                          else if (filter.startsWith('Manufacturer:')) setManufacturer('');
                          else if (filter.startsWith('Price:')) setPriceRange([0, Infinity]);
                          else if (filter.startsWith('In Stock:')) setInStock(null);
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Operations Toolbar */}
        {showBulkMode && hasSelection && (
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <BulkOperations
              selectedItems={selectedArray}
              onOperation={handleBulkOperation}
              availableOperations={[
                {
                  id: 'addToBOQ',
                  label: 'Add to BOQ',
                  icon: Plus,
                  color: 'bg-blue-600 hover:bg-blue-700',
                  requiresConfirmation: false,
                  batchSize: 50
                },
                {
                  id: 'duplicate',
                  label: 'Duplicate',
                  icon: Plus,
                  color: 'bg-purple-600 hover:bg-purple-700',
                  requiresConfirmation: false,
                  batchSize: 20
                },
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: X,
                  color: 'bg-red-600 hover:bg-red-700',
                  requiresConfirmation: true,
                  batchSize: 50
                }
              ]}
            />
          </div>
        )}

        {/* Items List */}
        <div className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No items found</p>
              <p className="text-sm text-gray-400 mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your search or filters' 
                  : 'Start typing to search for items'
                }
              </p>
              
              {/* Helpful suggestions */}
              {hasActiveFilters && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Try these suggestions:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Check your spelling</li>
                    <li>• Use fewer or different keywords</li>
                    <li>• Expand your price range</li>
                    <li>• Try a different category</li>
                  </ul>
                </div>
              )}
              
              {/* Popular categories when no search */}
              {!hasActiveFilters && filterOptions.categories.length > 0 && (
                <div className="max-w-md mx-auto">
                  <p className="text-sm text-gray-600 mb-3">Browse by category:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {filterOptions.categories.slice(0, 6).map(category => (
                      <button
                        key={category}
                        onClick={() => setCategory(category)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <VirtualizedList
              ref={virtualListRef}
              items={filteredItems}
              height={400}
              width="100%"
              getItemHeight={(item) => {
                // Calculate dynamic height based on item content
                let baseHeight = 180; // Base card height
                
                // Add height for dependencies
                if (item.dependencies && item.dependencies.length > 0) {
                  baseHeight += 60; // Dependencies section
                }
                
                // Add height for tags
                if (item.tags && item.tags.length > 0) {
                  baseHeight += 30; // Tags section
                }
                
                // Add height for long descriptions
                if (item.description && item.description.length > 100) {
                  baseHeight += 20; // Extra line for long description
                }
                
                return baseHeight;
              }}
              renderItem={(item, index) => (
                <div className="px-1 py-2">
                  <ItemCard
                    key={item.id}
                    item={item}
                    quantity={quantity}
                    onAddItem={handleAddItem}
                    masterDatabase={masterDatabase}
                    getHighlightedText={getHighlightedText}
                    searchStats={searchStats}
                    isSelected={isSelected(item.id)}
                    onToggleSelect={toggleItem}
                    showCheckbox={showBulkMode}
                  />
                </div>
              )}
              overscan={3}
              estimatedItemSize={180}
              className="custom-scrollbar"
            />
          )}
        </div>
      </div>
    </div>
  );
});

ItemSelector.displayName = 'ItemSelector';

export default ItemSelector;
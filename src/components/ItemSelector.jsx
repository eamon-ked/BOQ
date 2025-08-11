import React, { useState, memo, useMemo, useCallback } from 'react';
import { Search, Plus, X, Filter, Tag } from 'lucide-react';
import { useAppStore } from '../store';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';

// Memoized item card component with search highlighting
const ItemCard = memo(({ item, quantity, onAddItem, masterDatabase, getHighlightedText, searchStats }) => {
  const handleAddClick = useCallback(() => {
    onAddItem(item);
  }, [item, onAddItem]);

  // Helper function to render highlighted text
  const renderHighlightedText = useCallback((text, field) => {
    if (!getHighlightedText) return text;
    const highlighted = getHighlightedText(item, field);
    return highlighted ? (
      <span dangerouslySetInnerHTML={{ __html: highlighted }} />
    ) : text;
  }, [item, getHighlightedText]);

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:bg-blue-25 hover:border-blue-300 transition-all duration-200 hover-lift">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg text-gray-800">
              {renderHighlightedText(item.name, 'name')}
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {item.category}
            </span>
            {item.dependencies && item.dependencies.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                +{item.dependencies.length} auto-deps
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {renderHighlightedText(item.description, 'description')}
          </p>
          
          {item.manufacturer && (
            <p className="text-sm text-blue-600 font-medium mb-2">
              <span className="text-gray-500">by</span> {renderHighlightedText(item.manufacturer, 'manufacturer')}
            </p>
          )}
          
          <div className="flex items-center gap-6 text-sm mb-3">
            <span className="font-bold text-green-600 text-lg">
              ${item.unitPrice} / {item.unit}
            </span>
            <span className="text-gray-500">
              Total: ${(item.unitPrice * quantity).toFixed(2)}
            </span>
          </div>
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  <Tag size={10} className="inline mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {item.dependencies && item.dependencies.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-xs font-semibold text-orange-800 mb-1">
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
        
        <button
          onClick={handleAddClick}
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
    prevProps.quantity === nextProps.quantity
  );
});

ItemCard.displayName = 'ItemCard';

const ItemSelector = memo(() => {
  // Get data from store with proper selectors
  const isOpen = useAppStore((state) => state.ui.modals.itemSelector);
  const masterDatabase = useAppStore((state) => state.data.masterDatabase);
  const categories = useAppStore((state) => state.data.categories);
  
  // Get actions from store
  const closeModal = useAppStore((state) => state.closeModal);
  const addBOQItem = useAppStore((state) => state.addBOQItem);
  
  // Local state for form inputs
  const [quantity, setQuantity] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Initialize advanced search hook
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
    setTags,
    clearFilters,
    getHighlightedText,
    getSearchSuggestions,
    getFilterOptions,
    filterOptions
  } = useAdvancedSearch(masterDatabase, {
    debounceMs: 300,
    minSearchLength: 1,
    searchFields: ['name', 'description', 'manufacturer'],
    caseSensitive: false,
    enableHighlighting: true,
    enableRanking: true
  });

  // Memoize callback functions to prevent unnecessary re-renders
  const handleAddItem = useCallback((item) => {
    addBOQItem(item, parseInt(quantity));
    setQuantity(1);
  }, [addBOQItem, quantity]);

  const handleClose = useCallback(() => {
    closeModal('itemSelector');
  }, [closeModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add Item to BOQ</h2>
              <p className="text-sm text-gray-600 mt-1">{filteredItems.length} items available</p>
            </div>
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
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
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
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

          {/* Search stats */}
          <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
            <span>
              {resultCount} items found
              {searchStats.searchTime > 0 && ` in ${searchStats.searchTime}ms`}
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600">
                {searchStats.appliedFilters.length} filter{searchStats.appliedFilters.length !== 1 ? 's' : ''} active
              </span>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto max-h-96 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No items found</p>
              <p className="text-sm text-gray-400">
                {hasActiveFilters 
                  ? 'Try adjusting your search or filters' 
                  : 'Start typing to search for items'
                }
              </p>
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
            <div className="grid gap-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={quantity}
                  onAddItem={handleAddItem}
                  masterDatabase={masterDatabase}
                  getHighlightedText={getHighlightedText}
                  searchStats={searchStats}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ItemSelector.displayName = 'ItemSelector';

export default ItemSelector;
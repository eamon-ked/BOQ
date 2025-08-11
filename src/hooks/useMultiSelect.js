import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing multi-select functionality with checkbox and row selection support
 * 
 * Features:
 * - Toggle individual item selection
 * - Select all items from a list
 * - Clear all selections
 * - Range selection (shift+click functionality)
 * - Maximum selection limits
 * - Selection persistence across re-renders
 * - Callback notifications for selection changes
 * 
 * @param {Object} options - Configuration options
 * @param {('checkbox'|'row'|'both')} [options.selectMode='checkbox'] - Selection mode
 * @param {number|null} [options.maxSelections=null] - Maximum number of items that can be selected
 * @param {Function|null} [options.onSelectionChange=null] - Callback when selection changes (receives array of selected IDs)
 * 
 * @returns {Object} Multi-select state and actions
 * @returns {Set} returns.selectedItems - Set of selected item IDs
 * @returns {string[]} returns.selectedArray - Array of selected item IDs
 * @returns {number} returns.selectedCount - Number of selected items
 * @returns {boolean} returns.hasSelection - Whether any items are selected
 * @returns {boolean} returns.isAtMaxLimit - Whether maximum selection limit is reached
 * @returns {Function} returns.isSelected - Check if an item is selected
 * @returns {Function} returns.toggleItem - Toggle selection of a single item
 * @returns {Function} returns.selectAll - Select all items from a given list
 * @returns {Function} returns.clearSelection - Clear all selections
 * @returns {Function} returns.selectRange - Select a range of items (for shift+click)
 * @returns {Function} returns.selectItems - Select specific items by IDs
 * @returns {Function} returns.deselectItems - Deselect specific items by IDs
 * @returns {Function} returns.areAllSelected - Check if all items from a list are selected
 * @returns {Function} returns.areSomeSelected - Check if some (but not all) items from a list are selected
 * @returns {string} returns.selectMode - Current selection mode
 * @returns {number|null} returns.maxSelections - Maximum selection limit
 * 
 * @example
 * // Basic usage
 * const multiSelect = useMultiSelect();
 * 
 * // With configuration
 * const multiSelect = useMultiSelect({
 *   selectMode: 'both',
 *   maxSelections: 10,
 *   onSelectionChange: (selectedIds) => console.log('Selected:', selectedIds)
 * });
 * 
 * // Usage in component
 * const handleItemClick = (itemId) => {
 *   multiSelect.toggleItem(itemId);
 * };
 * 
 * const handleSelectAll = () => {
 *   multiSelect.selectAll(allItemIds);
 * };
 */
export const useMultiSelect = (options = {}) => {
  const {
    selectMode = 'checkbox',
    maxSelections = null,
    onSelectionChange = null
  } = options;

  const [selectedItems, setSelectedItems] = useState(new Set());

  // Check if an item is selected
  const isSelected = useCallback((id) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  // Toggle selection of a single item
  const toggleItem = useCallback((id) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        // Check max selections limit
        if (maxSelections && newSelection.size >= maxSelections) {
          return prev; // Don't add if at max limit
        }
        newSelection.add(id);
      }
      
      // Call onChange callback if provided
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      }
      
      return newSelection;
    });
  }, [maxSelections, onSelectionChange]);

  // Select all items from a given list
  const selectAll = useCallback((itemIds = []) => {
    setSelectedItems(prev => {
      let newSelection;
      
      if (maxSelections) {
        // If there's a max limit, only select up to that limit
        newSelection = new Set([...prev, ...itemIds.slice(0, maxSelections - prev.size)]);
      } else {
        // Select all items
        newSelection = new Set([...prev, ...itemIds]);
      }
      
      // Call onChange callback if provided
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      }
      
      return newSelection;
    });
  }, [maxSelections, onSelectionChange]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    
    // Call onChange callback if provided
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  }, [onSelectionChange]);

  // Select a range of items (for shift+click functionality)
  const selectRange = useCallback((startId, endId, itemIds = []) => {
    const startIndex = itemIds.indexOf(startId);
    const endIndex = itemIds.indexOf(endId);
    
    if (startIndex === -1 || endIndex === -1) {
      return; // Invalid range
    }
    
    const rangeStart = Math.min(startIndex, endIndex);
    const rangeEnd = Math.max(startIndex, endIndex);
    const rangeItems = itemIds.slice(rangeStart, rangeEnd + 1);
    
    setSelectedItems(prev => {
      let newSelection = new Set(prev);
      
      // Add all items in range
      rangeItems.forEach(id => {
        if (!maxSelections || newSelection.size < maxSelections) {
          newSelection.add(id);
        }
      });
      
      // Call onChange callback if provided
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      }
      
      return newSelection;
    });
  }, [maxSelections, onSelectionChange]);

  // Select specific items by IDs
  const selectItems = useCallback((itemIds) => {
    setSelectedItems(prev => {
      let newSelection = new Set(prev);
      
      itemIds.forEach(id => {
        if (!maxSelections || newSelection.size < maxSelections) {
          newSelection.add(id);
        }
      });
      
      // Call onChange callback if provided
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      }
      
      return newSelection;
    });
  }, [maxSelections, onSelectionChange]);

  // Deselect specific items by IDs
  const deselectItems = useCallback((itemIds) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      
      itemIds.forEach(id => {
        newSelection.delete(id);
      });
      
      // Call onChange callback if provided
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      }
      
      return newSelection;
    });
  }, [onSelectionChange]);

  // Computed values
  const selectedCount = useMemo(() => selectedItems.size, [selectedItems]);
  const hasSelection = useMemo(() => selectedItems.size > 0, [selectedItems]);
  const selectedArray = useMemo(() => Array.from(selectedItems), [selectedItems]);
  const isAtMaxLimit = useMemo(() => {
    return maxSelections ? selectedItems.size >= maxSelections : false;
  }, [selectedItems.size, maxSelections]);

  // Check if all items from a list are selected
  const areAllSelected = useCallback((itemIds = []) => {
    return itemIds.length > 0 && itemIds.every(id => selectedItems.has(id));
  }, [selectedItems]);

  // Check if some (but not all) items from a list are selected
  const areSomeSelected = useCallback((itemIds = []) => {
    return itemIds.some(id => selectedItems.has(id)) && !areAllSelected(itemIds);
  }, [selectedItems, areAllSelected]);

  // Get selection statistics
  const getSelectionStats = useCallback((totalItems = 0) => {
    return {
      selectedCount: selectedItems.size,
      totalCount: totalItems,
      selectedPercentage: totalItems > 0 ? Math.round((selectedItems.size / totalItems) * 100) : 0,
      remainingSelections: maxSelections ? Math.max(0, maxSelections - selectedItems.size) : null,
      isAtLimit: maxSelections ? selectedItems.size >= maxSelections : false
    };
  }, [selectedItems.size, maxSelections]);

  // Toggle selection for all items in a list (select all if none/some selected, deselect all if all selected)
  const toggleSelectAll = useCallback((itemIds = []) => {
    if (areAllSelected(itemIds)) {
      deselectItems(itemIds);
    } else {
      selectAll(itemIds);
    }
  }, [areAllSelected, deselectItems, selectAll]);

  // Get items that can still be selected (respecting max limit)
  const getSelectableItems = useCallback((itemIds = []) => {
    if (!maxSelections) {
      return itemIds.filter(id => !selectedItems.has(id));
    }
    
    const unselectedItems = itemIds.filter(id => !selectedItems.has(id));
    const remainingSlots = maxSelections - selectedItems.size;
    
    return unselectedItems.slice(0, remainingSlots);
  }, [selectedItems, maxSelections]);

  // Reset selection state (useful for component unmounting or data changes)
  const resetSelection = useCallback(() => {
    setSelectedItems(new Set());
    
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  }, [onSelectionChange]);

  return {
    // State
    selectedItems,
    selectedArray,
    selectedCount,
    hasSelection,
    isAtMaxLimit,
    
    // Actions
    isSelected,
    toggleItem,
    selectAll,
    clearSelection,
    selectRange,
    selectItems,
    deselectItems,
    toggleSelectAll,
    resetSelection,
    
    // Utilities
    areAllSelected,
    areSomeSelected,
    getSelectionStats,
    getSelectableItems,
    
    // Configuration
    selectMode,
    maxSelections
  };
};

export default useMultiSelect;
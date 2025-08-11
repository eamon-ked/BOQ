import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useMultiSelect } from '../useMultiSelect';

describe('useMultiSelect', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useMultiSelect());
    
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.hasSelection).toBe(false);
    expect(result.current.selectedArray).toEqual([]);
  });

  it('should toggle item selection', () => {
    const { result } = renderHook(() => useMultiSelect());
    
    act(() => {
      result.current.toggleItem('item1');
    });
    
    expect(result.current.isSelected('item1')).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.hasSelection).toBe(true);
    
    act(() => {
      result.current.toggleItem('item1');
    });
    
    expect(result.current.isSelected('item1')).toBe(false);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.hasSelection).toBe(false);
  });

  it('should select multiple items', () => {
    const { result } = renderHook(() => useMultiSelect());
    
    act(() => {
      result.current.toggleItem('item1');
      result.current.toggleItem('item2');
      result.current.toggleItem('item3');
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.selectedArray).toEqual(expect.arrayContaining(['item1', 'item2', 'item3']));
  });

  it('should select all items from a list', () => {
    const { result } = renderHook(() => useMultiSelect());
    const itemIds = ['item1', 'item2', 'item3', 'item4'];
    
    act(() => {
      result.current.selectAll(itemIds);
    });
    
    expect(result.current.selectedCount).toBe(4);
    expect(result.current.areAllSelected(itemIds)).toBe(true);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => useMultiSelect());
    
    act(() => {
      result.current.toggleItem('item1');
      result.current.toggleItem('item2');
    });
    
    expect(result.current.selectedCount).toBe(2);
    
    act(() => {
      result.current.clearSelection();
    });
    
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.hasSelection).toBe(false);
  });

  it('should respect max selections limit', () => {
    const { result } = renderHook(() => useMultiSelect({ maxSelections: 2 }));
    
    act(() => {
      result.current.toggleItem('item1');
      result.current.toggleItem('item2');
      result.current.toggleItem('item3'); // Should not be added
    });
    
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isSelected('item3')).toBe(false);
    expect(result.current.isAtMaxLimit).toBe(true);
  });

  it('should handle range selection', () => {
    const { result } = renderHook(() => useMultiSelect());
    const itemIds = ['item1', 'item2', 'item3', 'item4', 'item5'];
    
    act(() => {
      result.current.selectRange('item2', 'item4', itemIds);
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected('item2')).toBe(true);
    expect(result.current.isSelected('item3')).toBe(true);
    expect(result.current.isSelected('item4')).toBe(true);
    expect(result.current.isSelected('item1')).toBe(false);
    expect(result.current.isSelected('item5')).toBe(false);
  });

  it('should call onSelectionChange callback', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() => useMultiSelect({ onSelectionChange }));
    
    act(() => {
      result.current.toggleItem('item1');
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith(['item1']);
    
    act(() => {
      result.current.toggleItem('item2');
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith(expect.arrayContaining(['item1', 'item2']));
  });

  it('should check if some items are selected', () => {
    const { result } = renderHook(() => useMultiSelect());
    const itemIds = ['item1', 'item2', 'item3'];
    
    act(() => {
      result.current.toggleItem('item1');
    });
    
    expect(result.current.areSomeSelected(itemIds)).toBe(true);
    expect(result.current.areAllSelected(itemIds)).toBe(false);
    
    act(() => {
      result.current.selectAll(itemIds);
    });
    
    expect(result.current.areSomeSelected(itemIds)).toBe(false);
    expect(result.current.areAllSelected(itemIds)).toBe(true);
  });

  it('should select and deselect specific items', () => {
    const { result } = renderHook(() => useMultiSelect());
    
    act(() => {
      result.current.selectItems(['item1', 'item2', 'item3']);
    });
    
    expect(result.current.selectedCount).toBe(3);
    
    act(() => {
      result.current.deselectItems(['item1', 'item3']);
    });
    
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('item2')).toBe(true);
    expect(result.current.isSelected('item1')).toBe(false);
    expect(result.current.isSelected('item3')).toBe(false);
  });

  describe('Edge Cases', () => {
    it('should handle empty item lists gracefully', () => {
      const { result } = renderHook(() => useMultiSelect());
      
      act(() => {
        result.current.selectAll([]);
      });
      
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.areAllSelected([])).toBe(false);
      expect(result.current.areSomeSelected([])).toBe(false);
    });

    it('should handle invalid range selection gracefully', () => {
      const { result } = renderHook(() => useMultiSelect());
      const itemIds = ['item1', 'item2', 'item3'];
      
      // Test with non-existent start item
      act(() => {
        result.current.selectRange('nonexistent', 'item2', itemIds);
      });
      
      expect(result.current.selectedCount).toBe(0);
      
      // Test with non-existent end item
      act(() => {
        result.current.selectRange('item1', 'nonexistent', itemIds);
      });
      
      expect(result.current.selectedCount).toBe(0);
    });

    it('should handle duplicate item IDs in selection', () => {
      const { result } = renderHook(() => useMultiSelect());
      
      act(() => {
        result.current.selectItems(['item1', 'item1', 'item2', 'item2']);
      });
      
      expect(result.current.selectedCount).toBe(2);
      expect(result.current.selectedArray).toEqual(expect.arrayContaining(['item1', 'item2']));
    });

    it('should maintain selection state across re-renders', () => {
      const { result, rerender } = renderHook(() => useMultiSelect());
      
      act(() => {
        result.current.toggleItem('item1');
        result.current.toggleItem('item2');
      });
      
      expect(result.current.selectedCount).toBe(2);
      
      // Force re-render
      rerender();
      
      expect(result.current.selectedCount).toBe(2);
      expect(result.current.isSelected('item1')).toBe(true);
      expect(result.current.isSelected('item2')).toBe(true);
    });

    it('should handle max selections with selectAll correctly', () => {
      const { result } = renderHook(() => useMultiSelect({ maxSelections: 3 }));
      const itemIds = ['item1', 'item2', 'item3', 'item4', 'item5'];
      
      act(() => {
        result.current.selectAll(itemIds);
      });
      
      expect(result.current.selectedCount).toBe(3);
      expect(result.current.isAtMaxLimit).toBe(true);
    });

    it('should handle max selections with range selection correctly', () => {
      const { result } = renderHook(() => useMultiSelect({ maxSelections: 2 }));
      const itemIds = ['item1', 'item2', 'item3', 'item4'];
      
      act(() => {
        result.current.selectRange('item1', 'item4', itemIds);
      });
      
      expect(result.current.selectedCount).toBe(2);
      expect(result.current.isAtMaxLimit).toBe(true);
    });

    it('should handle reverse range selection', () => {
      const { result } = renderHook(() => useMultiSelect());
      const itemIds = ['item1', 'item2', 'item3', 'item4', 'item5'];
      
      // Select range from end to start
      act(() => {
        result.current.selectRange('item4', 'item2', itemIds);
      });
      
      expect(result.current.selectedCount).toBe(3);
      expect(result.current.isSelected('item2')).toBe(true);
      expect(result.current.isSelected('item3')).toBe(true);
      expect(result.current.isSelected('item4')).toBe(true);
    });

    it('should handle single item range selection', () => {
      const { result } = renderHook(() => useMultiSelect());
      const itemIds = ['item1', 'item2', 'item3'];
      
      act(() => {
        result.current.selectRange('item2', 'item2', itemIds);
      });
      
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.isSelected('item2')).toBe(true);
    });
  });

  describe('Selection Mode Configuration', () => {
    it('should store and return the correct select mode', () => {
      const { result: checkboxResult } = renderHook(() => useMultiSelect({ selectMode: 'checkbox' }));
      const { result: rowResult } = renderHook(() => useMultiSelect({ selectMode: 'row' }));
      const { result: bothResult } = renderHook(() => useMultiSelect({ selectMode: 'both' }));
      
      expect(checkboxResult.current.selectMode).toBe('checkbox');
      expect(rowResult.current.selectMode).toBe('row');
      expect(bothResult.current.selectMode).toBe('both');
    });

    it('should default to checkbox mode when no mode specified', () => {
      const { result } = renderHook(() => useMultiSelect());
      
      expect(result.current.selectMode).toBe('checkbox');
    });
  });

  describe('Callback Behavior', () => {
    it('should not call onSelectionChange when selection does not change', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() => useMultiSelect({ 
        maxSelections: 1, 
        onSelectionChange 
      }));
      
      act(() => {
        result.current.toggleItem('item1');
      });
      
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      
      // Try to add another item when at max limit
      act(() => {
        result.current.toggleItem('item2');
      });
      
      // Should not call callback again since selection didn't change
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectionChange with correct parameters for all operations', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() => useMultiSelect({ onSelectionChange }));
      const itemIds = ['item1', 'item2', 'item3'];
      
      // Test selectAll
      act(() => {
        result.current.selectAll(itemIds);
      });
      
      expect(onSelectionChange).toHaveBeenLastCalledWith(expect.arrayContaining(itemIds));
      
      // Test clearSelection
      act(() => {
        result.current.clearSelection();
      });
      
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
      
      // Test selectItems
      act(() => {
        result.current.selectItems(['item1', 'item2']);
      });
      
      expect(onSelectionChange).toHaveBeenLastCalledWith(expect.arrayContaining(['item1', 'item2']));
      
      // Test deselectItems
      act(() => {
        result.current.deselectItems(['item1']);
      });
      
      expect(onSelectionChange).toHaveBeenLastCalledWith(['item2']);
    });
  });

  describe('Additional Utility Methods', () => {
    it('should provide selection statistics', () => {
      const { result } = renderHook(() => useMultiSelect({ maxSelections: 5 }));
      
      act(() => {
        result.current.selectItems(['item1', 'item2']);
      });
      
      const stats = result.current.getSelectionStats(10);
      
      expect(stats).toEqual({
        selectedCount: 2,
        totalCount: 10,
        selectedPercentage: 20,
        remainingSelections: 3,
        isAtLimit: false
      });
    });

    it('should handle selection statistics without max limit', () => {
      const { result } = renderHook(() => useMultiSelect());
      
      act(() => {
        result.current.selectItems(['item1', 'item2', 'item3']);
      });
      
      const stats = result.current.getSelectionStats(10);
      
      expect(stats).toEqual({
        selectedCount: 3,
        totalCount: 10,
        selectedPercentage: 30,
        remainingSelections: null,
        isAtLimit: false
      });
    });

    it('should toggle select all correctly', () => {
      const { result } = renderHook(() => useMultiSelect());
      const itemIds = ['item1', 'item2', 'item3'];
      
      // First toggle should select all
      act(() => {
        result.current.toggleSelectAll(itemIds);
      });
      
      expect(result.current.areAllSelected(itemIds)).toBe(true);
      
      // Second toggle should deselect all
      act(() => {
        result.current.toggleSelectAll(itemIds);
      });
      
      expect(result.current.selectedCount).toBe(0);
      
      // Select some items, then toggle should select all
      act(() => {
        result.current.selectItems(['item1']);
        result.current.toggleSelectAll(itemIds);
      });
      
      expect(result.current.areAllSelected(itemIds)).toBe(true);
    });

    it('should get selectable items correctly', () => {
      const { result } = renderHook(() => useMultiSelect({ maxSelections: 3 }));
      const itemIds = ['item1', 'item2', 'item3', 'item4', 'item5'];
      
      act(() => {
        result.current.selectItems(['item1', 'item2']);
      });
      
      const selectableItems = result.current.getSelectableItems(itemIds);
      
      expect(selectableItems).toHaveLength(1); // Only 1 more can be selected
      expect(selectableItems).not.toContain('item1');
      expect(selectableItems).not.toContain('item2');
    });

    it('should get selectable items without max limit', () => {
      const { result } = renderHook(() => useMultiSelect());
      const itemIds = ['item1', 'item2', 'item3', 'item4'];
      
      act(() => {
        result.current.selectItems(['item1', 'item3']);
      });
      
      const selectableItems = result.current.getSelectableItems(itemIds);
      
      expect(selectableItems).toEqual(['item2', 'item4']);
    });

    it('should reset selection correctly', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() => useMultiSelect({ onSelectionChange }));
      
      act(() => {
        result.current.selectItems(['item1', 'item2', 'item3']);
      });
      
      expect(result.current.selectedCount).toBe(3);
      
      act(() => {
        result.current.resetSelection();
      });
      
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.hasSelection).toBe(false);
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });
  });
});
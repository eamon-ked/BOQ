import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAppStore, useDataActions } from '../index';

// Mock localStorage with more detailed implementation
const createMockStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
};

// Mock BOQ helpers
vi.mock('../../utils/boqHelpers', () => ({
  addItemToBOQ: vi.fn((items, item, quantity) => [...items, { ...item, quantity, isDependency: false }]),
  updateItemQuantityById: vi.fn((items, id, quantity) => 
    items.map(item => item.id === id ? { ...item, quantity } : item)
  ),
  removeItemFromBOQById: vi.fn((items, id) => items.filter(item => item.id !== id)),
  groupBOQItems: vi.fn((items) => items),
  validateBOQ: vi.fn(() => ({ isValid: true, errors: [] })),
}));

describe('Store Persistence', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    global.localStorage = mockStorage;
    vi.clearAllMocks();
  });

  describe('State Persistence', () => {
    it('should persist BOQ items to localStorage', async () => {
      const { result } = renderHook(() => useDataActions());
      const mockItem = {
        id: '1',
        name: 'Test Camera',
        category: 'Security',
        unitPrice: 100,
        unit: 'each',
      };

      act(() => {
        result.current.addBOQItem(mockItem, 2);
      });

      // Wait for persistence to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'boq-app-store',
        expect.stringContaining('"boqItems"')
      );

      // Check that the stored data contains our item
      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      expect(storedData.state.data.boqItems).toHaveLength(1);
      expect(storedData.state.data.boqItems[0].name).toBe('Test Camera');
    });

    it('should persist current project information', async () => {
      const { result } = renderHook(() => useDataActions());
      const project = { id: 'proj-123', name: 'Office Building Security' };

      act(() => {
        result.current.setCurrentProject(project);
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      expect(storedData.state.data.currentProject.id).toBe('proj-123');
      expect(storedData.state.data.currentProject.name).toBe('Office Building Security');
    });

    it('should persist UI panel states', async () => {
      const store = useAppStore.getState();
      
      act(() => {
        store.ui.actions.setPanel('showItemDB', false);
        store.ui.actions.setPanel('showSummary', true);
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      expect(storedData.state.ui.panels.showItemDB).toBe(false);
      expect(storedData.state.ui.panels.showSummary).toBe(true);
    });

    it('should persist search and filter states', async () => {
      const store = useAppStore.getState();
      
      act(() => {
        store.ui.actions.setSearchTerm('camera');
        store.ui.actions.setSelectedCategory('Security');
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      expect(storedData.state.ui.searchTerm).toBe('camera');
      expect(storedData.state.ui.selectedCategory).toBe('Security');
    });

    it('should NOT persist temporary states like modals and loading', async () => {
      const store = useAppStore.getState();
      
      act(() => {
        store.ui.actions.openModal('itemSelector');
        store.ui.actions.setLoading('items', true);
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      
      // These should not be in persisted data
      expect(storedData.state.ui.modals).toBeUndefined();
      expect(storedData.state.ui.loading).toBeUndefined();
    });

    it('should NOT persist master database and categories', async () => {
      const { result } = renderHook(() => useDataActions());
      const items = [
        { id: '1', name: 'Camera', category: 'Security' },
        { id: '2', name: 'Switch', category: 'Network' },
      ];
      const categories = ['Security', 'Network', 'Audio'];

      act(() => {
        result.current.setMasterDatabase(items);
        result.current.setCategories(categories);
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      
      // These should not be persisted as they're loaded fresh from database
      expect(storedData.state.data.masterDatabase).toBeUndefined();
      expect(storedData.state.data.categories).toBeUndefined();
    });
  });

  describe('State Hydration', () => {
    it('should restore persisted BOQ items on initialization', () => {
      const persistedData = {
        state: {
          data: {
            boqItems: [
              { id: '1', name: 'Restored Camera', quantity: 3, unitPrice: 150 }
            ],
            currentProject: {
              id: 'restored-proj',
              name: 'Restored Project'
            }
          },
          ui: {
            panels: {
              showItemDB: false,
              showSummary: true
            },
            searchTerm: 'restored search',
            selectedCategory: 'Restored Category'
          }
        },
        version: 0
      };

      mockStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      // Create a new store instance to trigger hydration
      const { result } = renderHook(() => useAppStore());

      const state = result.current;
      expect(state.data.boqItems).toHaveLength(1);
      expect(state.data.boqItems[0].name).toBe('Restored Camera');
      expect(state.data.currentProject.id).toBe('restored-proj');
      expect(state.ui.panels.showItemDB).toBe(false);
      expect(state.ui.panels.showSummary).toBe(true);
      expect(state.ui.searchTerm).toBe('restored search');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockStorage.getItem.mockReturnValue('invalid json data');

      // Should not throw an error
      expect(() => {
        renderHook(() => useAppStore());
      }).not.toThrow();

      // Should initialize with default state
      const state = useAppStore.getState();
      expect(state.data.boqItems).toEqual([]);
      expect(state.data.currentProject.id).toBeNull();
    });

    it('should handle missing localStorage data gracefully', () => {
      mockStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAppStore());
      const state = result.current;

      // Should initialize with default state
      expect(state.data.boqItems).toEqual([]);
      expect(state.data.currentProject.id).toBeNull();
      expect(state.ui.panels.showItemDB).toBe(true);
      expect(state.ui.panels.showSummary).toBe(false);
    });

    it('should merge persisted state with current state correctly', () => {
      const persistedData = {
        state: {
          data: {
            boqItems: [{ id: '1', name: 'Persisted Item' }],
            currentProject: { id: 'persisted-proj', name: 'Persisted Project' }
          },
          ui: {
            panels: { showItemDB: false, showSummary: true }
          }
        },
        version: 0
      };

      mockStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      const { result } = renderHook(() => useAppStore());
      const state = result.current;

      // Should have persisted data
      expect(state.data.boqItems[0].name).toBe('Persisted Item');
      expect(state.ui.panels.showItemDB).toBe(false);

      // Should have default values for non-persisted data
      expect(state.data.masterDatabase).toEqual([]);
      expect(state.data.categories).toEqual([]);
      expect(state.ui.modals.itemSelector).toBe(false);
      expect(Object.keys(state.ui.loading)).toHaveLength(0);
    });
  });

  describe('Persistence Edge Cases', () => {
    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useDataActions());
      const mockItem = { id: '1', name: 'Test Item', unitPrice: 100 };

      // Should not throw an error even if localStorage fails
      expect(() => {
        act(() => {
          result.current.addBOQItem(mockItem, 1);
        });
      }).not.toThrow();
    });

    it('should handle localStorage being disabled', async () => {
      // Mock localStorage to be undefined
      global.localStorage = undefined;

      // Should not throw an error
      expect(() => {
        renderHook(() => useAppStore());
      }).not.toThrow();
    });

    it('should handle partial persistence data', () => {
      const partialData = {
        state: {
          data: {
            boqItems: [{ id: '1', name: 'Partial Item' }]
            // Missing currentProject
          }
          // Missing ui section
        },
        version: 0
      };

      mockStorage.getItem.mockReturnValue(JSON.stringify(partialData));

      const { result } = renderHook(() => useAppStore());
      const state = result.current;

      // Should have the partial data that exists
      expect(state.data.boqItems[0].name).toBe('Partial Item');
      
      // Should have defaults for missing data
      expect(state.data.currentProject.id).toBeNull();
      expect(state.ui.panels.showItemDB).toBe(true);
    });
  });

  describe('Performance Considerations', () => {
    it('should debounce persistence writes', async () => {
      const { result } = renderHook(() => useDataActions());
      
      // Make multiple rapid changes
      act(() => {
        result.current.addBOQItem({ id: '1', name: 'Item 1', unitPrice: 100 }, 1);
        result.current.addBOQItem({ id: '2', name: 'Item 2', unitPrice: 200 }, 1);
        result.current.addBOQItem({ id: '3', name: 'Item 3', unitPrice: 300 }, 1);
      });

      // Should not call setItem for every change immediately
      expect(mockStorage.setItem.mock.calls.length).toBeLessThan(3);

      // Wait for debounced write
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have persisted the final state
      expect(mockStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockStorage.store['boq-app-store']);
      expect(storedData.state.data.boqItems).toHaveLength(3);
    });

    it('should only persist when relevant data changes', async () => {
      const store = useAppStore.getState();
      
      // Change non-persisted data
      act(() => {
        store.ui.actions.openModal('itemSelector');
        store.ui.actions.setLoading('test', true);
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not trigger persistence for non-persisted changes
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // Now change persisted data
      act(() => {
        store.ui.actions.setSearchTerm('test search');
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should trigger persistence
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
  });
});
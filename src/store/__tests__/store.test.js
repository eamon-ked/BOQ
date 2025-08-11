import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { 
  useAppStore, 
  useUIActions, 
  useDataActions, 
  useErrorActions,
  useBOQState,
  useItemDatabase,
  useModalState,
  useSearchState
} from '../index';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

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

describe('Zustand Store', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset store state
    useAppStore.setState({
      ui: {
        modals: {
          itemSelector: false,
          export: false,
          itemManager: false,
          categoryManager: false,
          databaseManager: false,
          boqProjectManager: false,
        },
        panels: {
          showItemDB: true,
          showSummary: false,
        },
        loading: {},
        searchTerm: '',
        selectedCategory: '',
      },
      data: {
        boqItems: [],
        masterDatabase: [],
        categories: [],
        currentProject: {
          id: null,
          name: '',
        },
        filters: {
          search: '',
          category: '',
          priceRange: [0, 10000],
          manufacturer: '',
          inStock: null,
          tags: [],
        },
      },
      errors: {},
    });
  });

  describe('UI Actions', () => {
    it('should toggle modal state', () => {
      const { result } = renderHook(() => useUIActions());
      
      act(() => {
        result.current.toggleModal('itemSelector');
      });
      
      const state = useAppStore.getState();
      expect(state.ui.modals.itemSelector).toBe(true);
      
      act(() => {
        result.current.toggleModal('itemSelector');
      });
      
      const updatedState = useAppStore.getState();
      expect(updatedState.ui.modals.itemSelector).toBe(false);
    });

    it('should open and close modals', () => {
      const { result } = renderHook(() => useUIActions());
      
      act(() => {
        result.current.openModal('export');
      });
      
      let state = useAppStore.getState();
      expect(state.ui.modals.export).toBe(true);
      
      act(() => {
        result.current.closeModal('export');
      });
      
      state = useAppStore.getState();
      expect(state.ui.modals.export).toBe(false);
    });

    it('should close all modals', () => {
      const { result } = renderHook(() => useUIActions());
      
      // Open multiple modals
      act(() => {
        result.current.openModal('itemSelector');
        result.current.openModal('export');
        result.current.openModal('itemManager');
      });
      
      let state = useAppStore.getState();
      expect(state.ui.modals.itemSelector).toBe(true);
      expect(state.ui.modals.export).toBe(true);
      expect(state.ui.modals.itemManager).toBe(true);
      
      act(() => {
        result.current.closeAllModals();
      });
      
      state = useAppStore.getState();
      expect(state.ui.modals.itemSelector).toBe(false);
      expect(state.ui.modals.export).toBe(false);
      expect(state.ui.modals.itemManager).toBe(false);
    });

    it('should manage panel visibility', () => {
      const { result } = renderHook(() => useUIActions());
      
      act(() => {
        result.current.togglePanel('showItemDB');
      });
      
      let state = useAppStore.getState();
      expect(state.ui.panels.showItemDB).toBe(false);
      
      act(() => {
        result.current.setPanel('showSummary', true);
      });
      
      state = useAppStore.getState();
      expect(state.ui.panels.showSummary).toBe(true);
    });

    it('should manage loading states', () => {
      const { result } = renderHook(() => useUIActions());
      
      act(() => {
        result.current.setLoading('items', true);
      });
      
      let state = useAppStore.getState();
      expect(state.ui.loading.items).toBe(true);
      
      act(() => {
        result.current.clearLoading('items');
      });
      
      state = useAppStore.getState();
      expect(state.ui.loading.items).toBeUndefined();
    });

    it('should update search term and sync with filters', () => {
      const { result } = renderHook(() => useUIActions());
      
      act(() => {
        result.current.setSearchTerm('camera');
      });
      
      const state = useAppStore.getState();
      expect(state.ui.searchTerm).toBe('camera');
      expect(state.data.filters.search).toBe('camera');
    });

    it('should update selected category and sync with filters', () => {
      const { result } = renderHook(() => useUIActions());
      
      act(() => {
        result.current.setSelectedCategory('Security');
      });
      
      const state = useAppStore.getState();
      expect(state.ui.selectedCategory).toBe('Security');
      expect(state.data.filters.category).toBe('Security');
    });
  });

  describe('Data Actions', () => {
    const mockItem = {
      id: '1',
      name: 'Test Camera',
      category: 'Security',
      unitPrice: 100,
      unit: 'each',
      description: 'Test camera description',
    };

    it('should add BOQ item and show summary', () => {
      const { result } = renderHook(() => useDataActions());
      
      act(() => {
        result.current.addBOQItem(mockItem, 2);
      });
      
      const state = useAppStore.getState();
      expect(state.data.boqItems).toHaveLength(1);
      expect(state.ui.panels.showSummary).toBe(true);
    });

    it('should update BOQ item quantity', () => {
      const { result } = renderHook(() => useDataActions());
      
      // First add an item
      act(() => {
        result.current.addBOQItem(mockItem, 1);
      });
      
      // Then update its quantity
      act(() => {
        result.current.updateBOQItemQuantity('1', 5);
      });
      
      const state = useAppStore.getState();
      expect(state.data.boqItems[0].quantity).toBe(5);
    });

    it('should remove BOQ item and hide summary when empty', () => {
      const { result } = renderHook(() => useDataActions());
      
      // Add an item first
      act(() => {
        result.current.addBOQItem(mockItem, 1);
      });
      
      let state = useAppStore.getState();
      expect(state.data.boqItems).toHaveLength(1);
      expect(state.ui.panels.showSummary).toBe(true);
      
      // Remove the item
      act(() => {
        result.current.removeBOQItem('1');
      });
      
      state = useAppStore.getState();
      expect(state.data.boqItems).toHaveLength(0);
      expect(state.ui.panels.showSummary).toBe(false);
    });

    it('should clear BOQ and reset project', () => {
      const { result } = renderHook(() => useDataActions());
      
      // Add item and set project
      act(() => {
        result.current.addBOQItem(mockItem, 1);
        result.current.setCurrentProject({ id: 'proj1', name: 'Test Project' });
      });
      
      let state = useAppStore.getState();
      expect(state.data.boqItems).toHaveLength(1);
      expect(state.data.currentProject.id).toBe('proj1');
      
      act(() => {
        result.current.clearBOQ();
      });
      
      state = useAppStore.getState();
      expect(state.data.boqItems).toHaveLength(0);
      expect(state.data.currentProject.id).toBeNull();
      expect(state.data.currentProject.name).toBe('');
      expect(state.ui.panels.showSummary).toBe(false);
    });

    it('should manage master database', () => {
      const { result } = renderHook(() => useDataActions());
      const items = [mockItem, { ...mockItem, id: '2', name: 'Test Switch' }];
      
      act(() => {
        result.current.setMasterDatabase(items);
      });
      
      let state = useAppStore.getState();
      expect(state.data.masterDatabase).toHaveLength(2);
      
      act(() => {
        result.current.addItemToDatabase({ ...mockItem, id: '3', name: 'Test Sensor' });
      });
      
      state = useAppStore.getState();
      expect(state.data.masterDatabase).toHaveLength(3);
      
      act(() => {
        result.current.updateItemInDatabase('1', { name: 'Updated Camera' });
      });
      
      state = useAppStore.getState();
      expect(state.data.masterDatabase[0].name).toBe('Updated Camera');
      
      act(() => {
        result.current.removeItemFromDatabase('2');
      });
      
      state = useAppStore.getState();
      expect(state.data.masterDatabase).toHaveLength(2);
      expect(state.data.masterDatabase.find(item => item.id === '2')).toBeUndefined();
    });

    it('should manage categories', () => {
      const { result } = renderHook(() => useDataActions());
      
      act(() => {
        result.current.setCategories(['Security', 'Network']);
      });
      
      let state = useAppStore.getState();
      expect(state.data.categories).toEqual(['Security', 'Network']);
      
      act(() => {
        result.current.addCategory('Audio');
      });
      
      state = useAppStore.getState();
      expect(state.data.categories).toContain('Audio');
      
      act(() => {
        result.current.updateCategory('Security', 'CCTV');
      });
      
      state = useAppStore.getState();
      expect(state.data.categories).toContain('CCTV');
      expect(state.data.categories).not.toContain('Security');
      
      act(() => {
        result.current.removeCategory('Network');
      });
      
      state = useAppStore.getState();
      expect(state.data.categories).not.toContain('Network');
    });

    it('should manage project state', () => {
      const { result } = renderHook(() => useDataActions());
      const project = { id: 'proj1', name: 'Test Project' };
      
      act(() => {
        result.current.setCurrentProject(project);
      });
      
      let state = useAppStore.getState();
      expect(state.data.currentProject.id).toBe('proj1');
      expect(state.data.currentProject.name).toBe('Test Project');
      
      act(() => {
        result.current.clearCurrentProject();
      });
      
      state = useAppStore.getState();
      expect(state.data.currentProject.id).toBeNull();
      expect(state.data.currentProject.name).toBe('');
    });

    it('should manage filters', () => {
      const { result } = renderHook(() => useDataActions());
      
      act(() => {
        result.current.setFilters({ 
          search: 'camera', 
          category: 'Security',
          priceRange: [50, 500]
        });
      });
      
      let state = useAppStore.getState();
      expect(state.data.filters.search).toBe('camera');
      expect(state.data.filters.category).toBe('Security');
      expect(state.data.filters.priceRange).toEqual([50, 500]);
      expect(state.ui.searchTerm).toBe('camera');
      expect(state.ui.selectedCategory).toBe('Security');
      
      act(() => {
        result.current.clearFilters();
      });
      
      state = useAppStore.getState();
      expect(state.data.filters.search).toBe('');
      expect(state.data.filters.category).toBe('');
      expect(state.ui.searchTerm).toBe('');
      expect(state.ui.selectedCategory).toBe('');
    });
  });

  describe('Error Actions', () => {
    it('should manage error states', () => {
      const { result } = renderHook(() => useErrorActions());
      
      act(() => {
        result.current.setError('database', 'Connection failed');
      });
      
      let state = useAppStore.getState();
      expect(state.errors.database).toBe('Connection failed');
      
      act(() => {
        result.current.clearError('database');
      });
      
      state = useAppStore.getState();
      expect(state.errors.database).toBeUndefined();
      
      // Set multiple errors
      act(() => {
        result.current.setError('api', 'API Error');
        result.current.setError('validation', 'Validation Error');
      });
      
      state = useAppStore.getState();
      expect(state.errors.api).toBe('API Error');
      expect(state.errors.validation).toBe('Validation Error');
      
      act(() => {
        result.current.clearAllErrors();
      });
      
      state = useAppStore.getState();
      expect(Object.keys(state.errors)).toHaveLength(0);
    });
  });

  describe('Computed Getters', () => {
    beforeEach(() => {
      const items = [
        { id: '1', name: 'Security Camera', category: 'Security', unitPrice: 100, description: 'HD Camera' },
        { id: '2', name: 'Network Switch', category: 'Network', unitPrice: 200, description: 'Managed Switch' },
        { id: '3', name: 'IP Camera', category: 'Security', unitPrice: 150, description: 'IP Security Camera' },
      ];
      
      useAppStore.setState(state => ({
        ...state,
        data: {
          ...state.data,
          masterDatabase: items,
        },
        ui: {
          ...state.ui,
          searchTerm: '',
          selectedCategory: '',
        },
      }));
    });

    it('should filter database items by search term', () => {
      const { result } = renderHook(() => useAppStore((state) => state.getters.getFilteredDatabase()));
      
      // No filters - should return all items
      expect(result.current).toHaveLength(3);
      
      // Set search term
      act(() => {
        useAppStore.setState(state => ({
          ...state,
          ui: { ...state.ui, searchTerm: 'camera' },
        }));
      });
      
      const filteredResult = useAppStore.getState().getters.getFilteredDatabase();
      expect(filteredResult).toHaveLength(2);
      expect(filteredResult.every(item => 
        item.name.toLowerCase().includes('camera') || 
        item.description.toLowerCase().includes('camera')
      )).toBe(true);
    });

    it('should filter database items by category', () => {
      act(() => {
        useAppStore.setState(state => ({
          ...state,
          ui: { ...state.ui, selectedCategory: 'Security' },
        }));
      });
      
      const filteredResult = useAppStore.getState().getters.getFilteredDatabase();
      expect(filteredResult).toHaveLength(2);
      expect(filteredResult.every(item => item.category === 'Security')).toBe(true);
    });

    it('should calculate BOQ totals correctly', () => {
      const boqItems = [
        { id: '1', name: 'Camera', unitPrice: 100, quantity: 2, isDependency: false },
        { id: '2', name: 'Cable', unitPrice: 50, quantity: 1, isDependency: true },
        { id: '3', name: 'Switch', unitPrice: 200, quantity: 1, isDependency: false, customPrice: 180 },
      ];
      
      act(() => {
        useAppStore.setState(state => ({
          ...state,
          data: { ...state.data, boqItems },
        }));
      });
      
      const totals = useAppStore.getState().getters.getBOQTotals();
      
      expect(totals.totalItems).toBe(3);
      expect(totals.mainItems).toBe(2);
      expect(totals.dependencies).toBe(1);
      expect(totals.totalValue).toBe(430); // (100*2) + (50*1) + (180*1)
    });

    it('should detect loading states', () => {
      act(() => {
        useAppStore.setState(state => ({
          ...state,
          ui: { 
            ...state.ui, 
            loading: { items: true, categories: false } 
          },
        }));
      });
      
      const isLoading = useAppStore.getState().getters.isAnyLoading();
      expect(isLoading).toBe(true);
      
      act(() => {
        useAppStore.setState(state => ({
          ...state,
          ui: { 
            ...state.ui, 
            loading: { items: false, categories: false } 
          },
        }));
      });
      
      const isNotLoading = useAppStore.getState().getters.isAnyLoading();
      expect(isNotLoading).toBe(false);
    });
  });

  describe('Selector Hooks', () => {
    it('should provide BOQ state and actions', () => {
      const { result } = renderHook(() => useBOQState());
      
      expect(result.current.items).toEqual([]);
      expect(result.current.currentProject.id).toBeNull();
      expect(typeof result.current.actions.addItem).toBe('function');
      expect(typeof result.current.actions.updateQuantity).toBe('function');
      expect(typeof result.current.actions.removeItem).toBe('function');
    });

    it('should provide item database state and actions', () => {
      const { result } = renderHook(() => useItemDatabase());
      
      expect(result.current.items).toEqual([]);
      expect(result.current.categories).toEqual([]);
      expect(result.current.filteredItems).toEqual([]);
      expect(typeof result.current.actions.setItems).toBe('function');
      expect(typeof result.current.actions.addItem).toBe('function');
    });

    it('should provide modal state and actions', () => {
      const { result } = renderHook(() => useModalState());
      
      expect(result.current.modals.itemSelector).toBe(false);
      expect(typeof result.current.actions.toggle).toBe('function');
      expect(typeof result.current.actions.open).toBe('function');
      expect(typeof result.current.actions.close).toBe('function');
    });

    it('should provide search state and actions', () => {
      const { result } = renderHook(() => useSearchState());
      
      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedCategory).toBe('');
      expect(typeof result.current.actions.setSearchTerm).toBe('function');
      expect(typeof result.current.actions.setSelectedCategory).toBe('function');
    });
  });

  describe('Persistence', () => {
    it('should persist critical data to localStorage', () => {
      const mockItem = { id: '1', name: 'Test Item', unitPrice: 100 };
      const { result } = renderHook(() => useDataActions());
      
      act(() => {
        result.current.addBOQItem(mockItem, 1);
        result.current.setCurrentProject({ id: 'proj1', name: 'Test Project' });
      });
      
      // The persist middleware should have been called
      // Note: In a real test environment, you might need to wait for the persistence to complete
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw an error when initializing with invalid data
      expect(() => {
        renderHook(() => useAppStore());
      }).not.toThrow();
    });
  });
});
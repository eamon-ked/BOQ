import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAppStore, useUIActions, useDataActions } from '../index';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('Basic Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with default state', () => {
    const state = useAppStore.getState();
    
    expect(state.ui.modals.itemSelector).toBe(false);
    expect(state.ui.panels.showItemDB).toBe(true);
    expect(state.data.boqItems).toEqual([]);
    expect(state.data.masterDatabase).toEqual([]);
    expect(state.errors).toEqual({});
  });

  it('should toggle modal state', () => {
    const store = useAppStore.getState();
    
    // Initial state
    expect(store.ui.modals.itemSelector).toBe(false);
    
    // Toggle modal
    act(() => {
      store.toggleModal('itemSelector');
    });
    
    const updatedState = useAppStore.getState();
    expect(updatedState.ui.modals.itemSelector).toBe(true);
  });

  it('should add BOQ item', () => {
    const store = useAppStore.getState();
    const mockItem = {
      id: '1',
      name: 'Test Camera',
      category: 'Security',
      unitPrice: 100,
      unit: 'each',
    };
    
    act(() => {
      store.addBOQItem(mockItem, 2);
    });
    
    const updatedState = useAppStore.getState();
    expect(updatedState.data.boqItems).toHaveLength(1);
    expect(updatedState.data.boqItems[0].quantity).toBe(2);
    expect(updatedState.ui.panels.showSummary).toBe(true);
  });

  it('should manage master database', () => {
    const store = useAppStore.getState();
    const items = [
      { id: '1', name: 'Camera', category: 'Security' },
      { id: '2', name: 'Switch', category: 'Network' },
    ];
    
    act(() => {
      store.setMasterDatabase(items);
    });
    
    const updatedState = useAppStore.getState();
    expect(updatedState.data.masterDatabase).toHaveLength(2);
  });

  it('should provide UI actions hook', () => {
    const { result } = renderHook(() => useUIActions());
    
    expect(typeof result.current.toggleModal).toBe('function');
    expect(typeof result.current.openModal).toBe('function');
    expect(typeof result.current.setLoading).toBe('function');
  });

  it('should provide data actions hook', () => {
    const { result } = renderHook(() => useDataActions());
    
    expect(typeof result.current.addBOQItem).toBe('function');
    expect(typeof result.current.setMasterDatabase).toBe('function');
    expect(typeof result.current.setCategories).toBe('function');
  });
});
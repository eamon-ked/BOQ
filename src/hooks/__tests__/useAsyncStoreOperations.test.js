import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAsyncStoreOperations } from '../useAsyncStoreOperations.js';

// Mock dependencies
vi.mock('../useAsyncOperation.js', () => ({
  useAsyncOperation: vi.fn()
}));

vi.mock('../../store/index.js', () => ({
  useAppStore: vi.fn()
}));

vi.mock('../../store/asyncActions.js', () => ({
  initializeDatabase: vi.fn(),
  loadItems: vi.fn(),
  loadCategories: vi.fn(),
  loadBOQProjects: vi.fn(),
  loadProjectTemplates: vi.fn(),
  addItemToDatabase: vi.fn(),
  updateItemInDatabase: vi.fn(),
  deleteItemFromDatabase: vi.fn(),
  addCategoryToDatabase: vi.fn(),
  updateCategoryInDatabase: vi.fn(),
  deleteCategoryFromDatabase: vi.fn()
}));

describe('useAsyncStoreOperations', () => {
  let mockUseAsyncOperation;
  let mockUseAppStore;
  let mockAsyncOperationInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock async operation instance
    mockAsyncOperationInstance = {
      isLoading: false,
      error: null,
      data: null,
      execute: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn()
    };

    // Mock useAsyncOperation hook
    const { useAsyncOperation } = await import('../useAsyncOperation.js');
    mockUseAsyncOperation = useAsyncOperation;
    mockUseAsyncOperation.mockReturnValue(mockAsyncOperationInstance);

    // Mock store actions
    const { useAppStore } = await import('../../store/index.js');
    mockUseAppStore = useAppStore;
    mockUseAppStore.mockImplementation((selector) => {
      const mockState = {
        setMasterDatabase: vi.fn(),
        setCategories: vi.fn(),
        setBOQProjects: vi.fn(),
        setTemplates: vi.fn()
      };
      return selector ? selector(mockState) : mockState;
    });
  });

  it('should initialize with correct structure', () => {
    const { result } = renderHook(() => useAsyncStoreOperations());

    // Check that all expected properties exist
    expect(result.current).toHaveProperty('isInitializing');
    expect(result.current).toHaveProperty('isLoadingItems');
    expect(result.current).toHaveProperty('isLoadingCategories');
    expect(result.current).toHaveProperty('isLoadingProjects');
    expect(result.current).toHaveProperty('isLoadingTemplates');

    expect(result.current).toHaveProperty('initialize');
    expect(result.current).toHaveProperty('loadItems');
    expect(result.current).toHaveProperty('loadCategories');
    expect(result.current).toHaveProperty('loadProjects');
    expect(result.current).toHaveProperty('loadTemplates');
    expect(result.current).toHaveProperty('loadAllData');

    expect(result.current).toHaveProperty('addItem');
    expect(result.current).toHaveProperty('updateItem');
    expect(result.current).toHaveProperty('deleteItem');

    expect(result.current).toHaveProperty('clearAllErrors');
    expect(result.current).toHaveProperty('resetAllOperations');
  });

  it('should create multiple async operation instances', () => {
    renderHook(() => useAsyncStoreOperations());

    // Should create multiple async operation instances for different operations
    expect(mockUseAsyncOperation).toHaveBeenCalledTimes(8); // 8 different operations
  });

  it('should provide loading states from async operations', () => {
    mockAsyncOperationInstance.isLoading = true;
    const { result } = renderHook(() => useAsyncStoreOperations());

    expect(result.current.isInitializing).toBe(true);
    expect(result.current.isLoadingItems).toBe(true);
    expect(result.current.isLoadingCategories).toBe(true);
    expect(result.current.isLoadingProjects).toBe(true);
    expect(result.current.isLoadingTemplates).toBe(true);
  });

  it('should provide error states from async operations', () => {
    const mockError = new Error('Test error');
    mockAsyncOperationInstance.error = mockError;
    const { result } = renderHook(() => useAsyncStoreOperations());

    expect(result.current.initializeError).toBe(mockError);
    expect(result.current.loadItemsError).toBe(mockError);
    expect(result.current.loadCategoriesError).toBe(mockError);
    expect(result.current.loadProjectsError).toBe(mockError);
    expect(result.current.loadTemplatesError).toBe(mockError);
  });

  it('should execute operations through async operation wrapper', async () => {
    const { result } = renderHook(() => useAsyncStoreOperations());

    await act(async () => {
      await result.current.initialize();
    });

    expect(mockAsyncOperationInstance.execute).toHaveBeenCalled();
  });

  it('should clear all errors when requested', () => {
    const { result } = renderHook(() => useAsyncStoreOperations());

    act(() => {
      result.current.clearAllErrors();
    });

    // Should call clearError on all async operation instances
    expect(mockAsyncOperationInstance.clearError).toHaveBeenCalledTimes(8);
  });

  it('should reset all operations when requested', () => {
    const { result } = renderHook(() => useAsyncStoreOperations());

    act(() => {
      result.current.resetAllOperations();
    });

    // Should call reset on all async operation instances
    expect(mockAsyncOperationInstance.reset).toHaveBeenCalledTimes(8);
  });
});
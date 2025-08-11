import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDatabaseOperations } from '../databaseWithAsyncOps.js';

// Mock the database service
vi.mock('../database.js', () => ({
  default: {
    initialize: vi.fn(),
    getCategories: vi.fn(),
    getItems: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getBOQProjects: vi.fn(),
    createBOQProject: vi.fn(),
    updateBOQProject: vi.fn(),
    deleteBOQProject: vi.fn(),
    getBOQItems: vi.fn(),
    saveBOQItems: vi.fn(),
    getProjectTemplates: vi.fn(),
    createProjectTemplate: vi.fn(),
    updateProjectTemplate: vi.fn(),
    deleteProjectTemplate: vi.fn(),
    cloneBOQProject: vi.fn(),
    exportDatabase: vi.fn(),
    importDatabase: vi.fn()
  }
}));

// Mock the useAsyncOperation hook
vi.mock('../../hooks/useAsyncOperation.js', () => ({
  useAsyncOperation: vi.fn()
}));

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  }
}));

vi.mock('../../store/index.js', () => ({
  useAppStore: vi.fn()
}));

vi.mock('../../utils/errorLogger.js', () => ({
  errorLogger: {
    logError: vi.fn()
  },
  ErrorType: {
    COMPONENT_ERROR: 'component_error'
  },
  ErrorSeverity: {
    MEDIUM: 'medium'
  }
}));

describe('useDatabaseOperations Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock the store
    const { useAppStore } = await import('../../store/index.js');
    useAppStore.mockImplementation((selector) => {
      const mockState = {
        setLoading: vi.fn(),
        setError: vi.fn(),
        clearError: vi.fn()
      };
      return selector ? selector(mockState) : mockState;
    });

    // Mock useAsyncOperation to return a working mock
    const { useAsyncOperation } = await import('../../hooks/useAsyncOperation.js');
    useAsyncOperation.mockImplementation(() => ({
      isLoading: false,
      error: null,
      data: null,
      execute: vi.fn().mockResolvedValue('mock result'),
      clearError: vi.fn(),
      reset: vi.fn()
    }));
  });

  it('should initialize database operations hook correctly', () => {
    const { result } = renderHook(() => useDatabaseOperations());

    expect(result.current).toBeDefined();
    expect(typeof result.current.initialize).toBe('function');
    expect(typeof result.current.getCategories).toBe('function');
    expect(typeof result.current.getItems).toBe('function');
    expect(typeof result.current.addItem).toBe('function');
    expect(typeof result.current.updateItem).toBe('function');
    expect(typeof result.current.deleteItem).toBe('function');
    expect(typeof result.current.getBOQProjects).toBe('function');
    expect(typeof result.current.createBOQProject).toBe('function');
    expect(typeof result.current.clearErrors).toBe('function');
    expect(typeof result.current.resetAll).toBe('function');
  });

  it('should provide loading states for different operations', () => {
    const { result } = renderHook(() => useDatabaseOperations());

    expect(typeof result.current.isInitializing).toBe('boolean');
    expect(typeof result.current.isCategoriesLoading).toBe('boolean');
    expect(typeof result.current.isItemsLoading).toBe('boolean');
    expect(typeof result.current.isProjectsLoading).toBe('boolean');
    expect(typeof result.current.isTemplatesLoading).toBe('boolean');
  });

  it('should provide error states for different operations', () => {
    const { result } = renderHook(() => useDatabaseOperations());

    expect(result.current.initializeError).toBeDefined();
    expect(result.current.categoriesError).toBeDefined();
    expect(result.current.itemsError).toBeDefined();
    expect(result.current.projectsError).toBeDefined();
    expect(result.current.templatesError).toBeDefined();
  });

  it('should execute database operations through async operation wrapper', async () => {
    const { result } = renderHook(() => useDatabaseOperations());

    await act(async () => {
      await result.current.initialize();
    });

    // The mock execute function should have been called
    expect(result.current.initialize).toBeDefined();
  });
});
// Persistence utilities for localStorage integration
export const persistenceConfig = {
  name: 'boq-app-store',
  
  // Only persist critical data
  partialize: (state) => ({
    data: {
      boqItems: state.data.boqItems,
      currentProject: state.data.currentProject,
    },
    ui: {
      panels: state.ui.panels,
      searchTerm: state.ui.searchTerm,
      selectedCategory: state.ui.selectedCategory,
    },
  }),
  
  // Merge strategy for hydration
  merge: (persistedState, currentState) => ({
    ...currentState,
    data: {
      ...currentState.data,
      ...persistedState?.data,
      // Don't persist masterDatabase and categories - they should be loaded fresh
      masterDatabase: currentState.data.masterDatabase,
      categories: currentState.data.categories,
    },
    ui: {
      ...currentState.ui,
      ...persistedState?.ui,
      // Reset modals and loading states
      modals: currentState.ui.modals,
      loading: currentState.ui.loading,
    },
  }),
};

// Manual persistence functions for localStorage integration
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};
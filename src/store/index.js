import { create } from 'zustand';
import toast from 'react-hot-toast';
import { addItemToBOQ, updateItemQuantityById, removeItemFromBOQById } from '../utils/boqHelpers.js';

export const useAppStore = create((set, get) => ({
  ui: {
    panels: {
      showDatabase: true,
      showSummary: false,
    },
    searchTerm: '',
    selectedCategory: '',
    modals: {
      itemSelector: false,
      categoryManager: false,
      itemEditor: false,
      projectManager: false,
      projectTemplate: false,
      settings: false,
      boqExport: false,
    },
    loading: {
      items: false,
      categories: false,
      saving: false,
    },
  },
  data: {
    masterDatabase: [],
    categories: [],
    boqItems: [],
    currentProject: { id: null, name: '' },
    templates: [],
    filters: {
      search: '',
      category: '',
    },
    selectedItems: new Set(),
  },
  errors: {},

  // UI Actions
  setPanel: (panelKey, value) =>
    set((state) => ({
      ui: {
        ...state.ui,
        panels: {
          ...state.ui.panels,
          [panelKey]: value,
        },
      },
    })),

  setSearchTerm: (term) =>
    set((state) => ({
      ui: {
        ...state.ui,
        searchTerm: term,
      },
      data: {
        ...state.data,
        filters: {
          ...state.data.filters,
          search: term,
        },
      },
    })),

  setSelectedCategory: (category) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedCategory: category,
      },
      data: {
        ...state.data,
        filters: {
          ...state.data.filters,
          category: category,
        },
      },
    })),

  openModal: (modalName) =>
    set((state) => ({
      ui: {
        ...state.ui,
        modals: {
          ...state.ui.modals,
          [modalName]: true,
        },
      },
    })),

  closeModal: (modalName) =>
    set((state) => ({
      ui: {
        ...state.ui,
        modals: {
          ...state.ui.modals,
          [modalName]: false,
        },
      },
    })),

  closeAllModals: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        modals: {
          itemSelector: false,
          categoryManager: false,
          itemEditor: false,
          projectManager: false,
          projectTemplate: false,
          settings: false,
          boqExport: false,
        },
      },
    })),

  setLoading: (key, isLoading) =>
    set((state) => ({
      ui: {
        ...state.ui,
        loading: {
          ...state.ui.loading,
          [key]: isLoading,
        },
      },
    })),

  // Data Actions
  addBOQItem: (item, quantity = 1) =>
    set((state) => {
      try {
        const updatedBOQItems = addItemToBOQ(
          state.data.boqItems,
          item,
          quantity,
          state.data.masterDatabase
        );

        // Show success toast
        const dependencyCount = item.dependencies?.length || 0;
        const message = dependencyCount > 0 
          ? `Added "${item.name}" with ${dependencyCount} dependencies to BOQ`
          : `Added "${item.name}" to BOQ`;
        
        toast.success(message, {
          duration: 3000,
          icon: '✅',
        });

        return {
          data: {
            ...state.data,
            boqItems: updatedBOQItems,
          },
          ui: {
            ...state.ui,
            panels: {
              ...state.ui.panels,
              showSummary: true,
            },
          },
        };
      } catch (error) {
        toast.error(`Failed to add item: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  // Bulk Operations
  addMultipleBOQItems: (items) =>
    set((state) => {
      try {
        let updatedBOQItems = [...state.data.boqItems];
        let totalDependencies = 0;
        
        items.forEach(({ item, quantity = 1 }) => {
          updatedBOQItems = addItemToBOQ(
            updatedBOQItems,
            item,
            quantity,
            state.data.masterDatabase
          );
          totalDependencies += item.dependencies?.length || 0;
        });

        const message = totalDependencies > 0 
          ? `Added ${items.length} items with ${totalDependencies} dependencies to BOQ`
          : `Added ${items.length} items to BOQ`;
        
        toast.success(message, {
          duration: 4000,
          icon: '✅',
        });

        return {
          data: {
            ...state.data,
            boqItems: updatedBOQItems,
          },
          ui: {
            ...state.ui,
            panels: {
              ...state.ui.panels,
              showSummary: true,
            },
          },
        };
      } catch (error) {
        toast.error(`Failed to add items: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  updateMultipleMasterItems: (updates) =>
    set((state) => {
      try {
        let updatedDatabase = [...state.data.masterDatabase];
        
        updates.forEach(({ itemId, changes }) => {
          const index = updatedDatabase.findIndex(item => item.id === itemId);
          if (index !== -1) {
            updatedDatabase[index] = { ...updatedDatabase[index], ...changes };
          }
        });

        toast.success(`Updated ${updates.length} items in database`, {
          duration: 3000,
          icon: '✏️',
        });

        return {
          data: {
            ...state.data,
            masterDatabase: updatedDatabase,
          },
        };
      } catch (error) {
        toast.error(`Failed to update items: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  deleteMultipleMasterItems: (itemIds) =>
    set((state) => {
      try {
        const itemsToDelete = state.data.masterDatabase.filter(item => itemIds.includes(item.id));
        const itemsInBOQ = state.data.boqItems.filter(item => itemIds.includes(item.id));
        
        toast.success(`Deleted ${itemIds.length} items from database${itemsInBOQ.length > 0 ? ` and ${itemsInBOQ.length} from BOQ` : ''}`, {
          duration: 4000,
          icon: '🗑️',
        });

        return {
          data: {
            ...state.data,
            masterDatabase: state.data.masterDatabase.filter(item => !itemIds.includes(item.id)),
            boqItems: state.data.boqItems.filter(item => !itemIds.includes(item.id)),
          },
        };
      } catch (error) {
        toast.error(`Failed to delete items: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  duplicateMultipleMasterItems: (itemIds) =>
    set((state) => {
      try {
        const itemsToDuplicate = state.data.masterDatabase.filter(item => itemIds.includes(item.id));
        const duplicatedItems = itemsToDuplicate.map(item => ({
          ...item,
          id: `${item.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${item.name} (Copy)`,
        }));

        toast.success(`Duplicated ${itemIds.length} items in database`, {
          duration: 3000,
          icon: '📋',
        });

        return {
          data: {
            ...state.data,
            masterDatabase: [...state.data.masterDatabase, ...duplicatedItems],
          },
        };
      } catch (error) {
        toast.error(`Failed to duplicate items: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  updateBOQItemQuantity: (itemId, newQty) =>
    set((state) => {
      try {
        const item = state.data.boqItems.find(item => item.id === itemId);
        if (!item) {
          toast.error('Item not found in BOQ', { duration: 4000 });
          return state;
        }

        const updatedBOQItems = updateItemQuantityById(
          state.data.boqItems,
          itemId,
          newQty,
          state.data.masterDatabase
        );

        toast.success(`Updated quantity for "${item.name}" to ${newQty}`, {
          duration: 2000,
          icon: '📝',
        });

        return {
          data: {
            ...state.data,
            boqItems: updatedBOQItems,
          },
        };
      } catch (error) {
        toast.error(`Failed to update quantity: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  removeBOQItem: (itemId) =>
    set((state) => {
      try {
        const item = state.data.boqItems.find(item => item.id === itemId);
        if (!item) {
          toast.error('Item not found in BOQ', { duration: 4000 });
          return state;
        }

        const updatedBOQItems = removeItemFromBOQById(state.data.boqItems, itemId);

        toast.success(`Removed "${item.name}" from BOQ`, {
          duration: 3000,
          icon: '🗑️',
        });

        return {
          data: {
            ...state.data,
            boqItems: updatedBOQItems,
          },
          ui: {
            ...state.ui,
            panels: {
              ...state.ui.panels,
              showSummary: updatedBOQItems.length > 0,
            },
          },
        };
      } catch (error) {
        toast.error(`Failed to remove item: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  clearBOQ: () =>
    set((state) => {
      const itemCount = state.data.boqItems.length;
      if (itemCount > 0) {
        toast.success(`Cleared ${itemCount} items from BOQ`, {
          duration: 3000,
          icon: '🧹',
        });
      }

      return {
        data: {
          ...state.data,
          boqItems: [],
          currentProject: { id: null, name: '' },
        },
      };
    }),

  setMasterDatabase: (items) =>
    set((state) => ({
      data: {
        ...state.data,
        masterDatabase: items,
      },
    })),

  setCategories: (categories) =>
    set((state) => ({
      data: {
        ...state.data,
        categories: categories,
      },
    })),

  setCurrentProject: (project) =>
    set((state) => ({
      data: {
        ...state.data,
        currentProject: project,
      },
    })),

  setTemplates: (templates) =>
    set((state) => ({
      data: {
        ...state.data,
        templates: templates,
      },
    })),

  addTemplate: (template) =>
    set((state) => {
      try {
        toast.success(`Created template "${template.name}"`, {
          duration: 3000,
          icon: '📋',
        });

        return {
          data: {
            ...state.data,
            templates: [...state.data.templates, template],
          },
        };
      } catch (error) {
        toast.error(`Failed to add template: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  updateTemplate: (templateId, updates) =>
    set((state) => {
      try {
        const template = state.data.templates.find(t => t.id === templateId);
        if (!template) {
          toast.error('Template not found', { duration: 4000 });
          return state;
        }

        toast.success(`Updated template "${updates.name || template.name}"`, {
          duration: 3000,
          icon: '✏️',
        });

        return {
          data: {
            ...state.data,
            templates: state.data.templates.map((template) =>
              template.id === templateId ? { ...template, ...updates } : template
            ),
          },
        };
      } catch (error) {
        toast.error(`Failed to update template: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  deleteTemplate: (templateId) =>
    set((state) => {
      try {
        const template = state.data.templates.find(t => t.id === templateId);
        if (!template) {
          toast.error('Template not found', { duration: 4000 });
          return state;
        }

        toast.success(`Deleted template "${template.name}"`, {
          duration: 4000,
          icon: '🗑️',
        });

        return {
          data: {
            ...state.data,
            templates: state.data.templates.filter((template) => template.id !== templateId),
          },
        };
      } catch (error) {
        toast.error(`Failed to delete template: ${error.message}`, {
          duration: 5000,
          icon: '❌',
        });
        return state;
      }
    }),

  addMasterItem: async (item) => {
    try {
      // Make API call to add to server
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add item to server');
      }

      // Update local state only after successful server addition
      set((state) => ({
        data: {
          ...state.data,
          masterDatabase: [...state.data.masterDatabase, item],
        },
      }));

      toast.success(`Added "${item.name}" to database`, {
        duration: 3000,
        icon: '➕',
      });
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error(`Failed to add item: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
      throw error; // Re-throw so the UI can handle it
    }
  },

  updateMasterItem: async (itemId, updates) => {
    const state = get();
    const item = state.data.masterDatabase.find(item => item.id === itemId);
    if (!item) {
      toast.error('Item not found in database', { duration: 4000 });
      return;
    }

    try {
      // Make API call to update on server
      const response = await fetch(`http://localhost:3001/api/items/${encodeURIComponent(itemId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update item on server');
      }

      // Update local state only after successful server update
      set((state) => ({
        data: {
          ...state.data,
          masterDatabase: state.data.masterDatabase.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        },
      }));

      toast.success(`Updated "${updates.name || item.name}" in database`, {
        duration: 3000,
        icon: '✏️',
      });
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error(`Failed to update item: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
      throw error; // Re-throw so the UI can handle it
    }
  },

  deleteMasterItem: async (itemId) => {
    const state = get();
    const item = state.data.masterDatabase.find(item => item.id === itemId);
    if (!item) {
      toast.error('Item not found in database', { duration: 4000 });
      return;
    }

    try {
      // Make API call to delete from server
      const response = await fetch(`http://localhost:3001/api/items/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete item from server');
      }

      // Update local state only after successful server deletion
      const wasInBOQ = state.data.boqItems.some(boqItem => boqItem.id === itemId);
      
      set((state) => ({
        data: {
          ...state.data,
          masterDatabase: state.data.masterDatabase.filter((item) => item.id !== itemId),
          boqItems: state.data.boqItems.filter((item) => item.id !== itemId),
        },
      }));

      toast.success(`Deleted "${item.name}" from database${wasInBOQ ? ' and BOQ' : ''}`, {
        duration: 4000,
        icon: '🗑️',
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error(`Failed to delete item: ${error.message}`, {
        duration: 5000,
        icon: '❌',
      });
      throw error; // Re-throw so the UI can handle it
    }
  },

  setFilters: (filters) =>
    set((state) => ({
      data: {
        ...state.data,
        filters: filters,
      },
    })),

  // Error Actions
  setError: (key, message) =>
    set((state) => ({
      errors: {
        ...state.errors,
        [key]: message,
      },
    })),

  clearError: (key) =>
    set((state) => {
      const newErrors = { ...state.errors };
      delete newErrors[key];
      return {
        errors: newErrors,
      };
    }),

  clearAllErrors: () =>
    set(() => ({
      errors: {},
    })),

  // Computed getters (safe implementation)
  getters: {
    getFilteredDatabase: () => {
      const state = get();
      const { masterDatabase } = state.data;
      const { searchTerm, selectedCategory } = state.ui;

      let filtered = masterDatabase;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          item.category.toLowerCase().includes(term)
        );
      }

      if (selectedCategory) {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }

      return filtered;
    },

    getBOQTotals: () => {
      const state = get();
      const { boqItems } = state.data;

      const totals = {
        totalItems: boqItems.length,
        mainItems: boqItems.filter(item => !item.isDependency).length,
        dependencies: boqItems.filter(item => item.isDependency).length,
        totalValue: 0,
      };

      totals.totalValue = boqItems.reduce((sum, item) => {
        const price = item.customPrice || item.unitPrice;
        return sum + (price * item.quantity);
      }, 0);

      return totals;
    },

    isAnyLoading: () => {
      const state = get();
      const { loading } = state.ui;
      return Object.values(loading).some(isLoading => isLoading);
    },
  },
}));

// Selector hooks for testing
export const useUIActions = () => useAppStore((state) => ({
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
  setPanel: state.setPanel,
  setLoading: state.setLoading,
  setSearchTerm: state.setSearchTerm,
  setSelectedCategory: state.setSelectedCategory,
}));

export const useDataActions = () => useAppStore((state) => ({
  addBOQItem: state.addBOQItem,
  updateBOQItemQuantity: state.updateBOQItemQuantity,
  removeBOQItem: state.removeBOQItem,
  clearBOQ: state.clearBOQ,
  setMasterDatabase: state.setMasterDatabase,
  setCategories: state.setCategories,
  setCurrentProject: state.setCurrentProject,
  setTemplates: state.setTemplates,
  addTemplate: state.addTemplate,
  updateTemplate: state.updateTemplate,
  deleteTemplate: state.deleteTemplate,
  setFilters: state.setFilters,
  addMasterItem: state.addMasterItem,
  updateMasterItem: state.updateMasterItem,
  deleteMasterItem: state.deleteMasterItem,
  // Bulk operations
  addMultipleBOQItems: state.addMultipleBOQItems,
  updateMultipleMasterItems: state.updateMultipleMasterItems,
  deleteMultipleMasterItems: state.deleteMultipleMasterItems,
  duplicateMultipleMasterItems: state.duplicateMultipleMasterItems,
}));

export const useErrorActions = () => useAppStore((state) => ({
  setError: state.setError,
  clearError: state.clearError,
  clearAllErrors: state.clearAllErrors,
}));

export const useBOQState = () => useAppStore((state) => ({
  items: state.data.boqItems,
  showSummary: state.ui.panels.showSummary,
  addItem: state.addBOQItem,
  updateQuantity: state.updateBOQItemQuantity,
  removeItem: state.removeBOQItem,
  clear: state.clearBOQ,
}));

export const useItemDatabase = () => useAppStore((state) => ({
  items: state.data.masterDatabase,
  categories: state.data.categories,
  setItems: state.setMasterDatabase,
  setCategories: state.setCategories,
}));

export const useModalState = () => useAppStore((state) => ({
  modals: state.ui.modals,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
}));

export const useSearchState = () => useAppStore((state) => ({
  searchTerm: state.ui.searchTerm,
  selectedCategory: state.ui.selectedCategory,
  setSearchTerm: state.setSearchTerm,
  setSelectedCategory: state.setSelectedCategory,
}));

export const useTemplateState = () => useAppStore((state) => ({
  templates: state.data.templates,
  setTemplates: state.setTemplates,
  addTemplate: state.addTemplate,
  updateTemplate: state.updateTemplate,
  deleteTemplate: state.deleteTemplate,
}));

// Utility functions for computed values (to be used by components)
export const getFilteredDatabase = (masterDatabase, searchTerm, selectedCategory) => {
  let filtered = masterDatabase;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term)
    );
  }

  if (selectedCategory) {
    filtered = filtered.filter(item => item.category === selectedCategory);
  }

  return filtered;
};

export const getBOQTotals = (boqItems) => {
  const totals = {
    totalItems: boqItems.length,
    mainItems: boqItems.filter(item => !item.isDependency).length,
    dependencies: boqItems.filter(item => item.isDependency).length,
    totalValue: 0,
  };

  totals.totalValue = boqItems.reduce((sum, item) => {
    const price = item.customPrice || item.unitPrice;
    return sum + (price * item.quantity);
  }, 0);

  return totals;
};

export const isAnyLoading = (loading) => {
  return Object.values(loading).some(isLoading => isLoading);
};
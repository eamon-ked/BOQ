import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Settings, Tags, Loader2, AlertCircle, Database } from 'lucide-react';
import BOQTable from './components/BOQTable';
import ItemSelector from './components/ItemSelector';
import BOQExport from './components/BOQExport';
import ItemManager from './components/ItemManager';
import CategoryManager from './components/CategoryManager';
import DatabaseManager from './components/DatabaseManager';
import { useDatabase } from './hooks/useDatabase';
import { 
  addItemToBOQ as addItemToBOQHelper, 
  updateItemQuantity as updateItemQuantityHelper, 
  updateItemQuantityById,
  removeItemFromBOQ as removeItemFromBOQHelper,
  removeItemFromBOQById,
  groupBOQItems,
  validateBOQ
} from './utils/boqHelpers';

function App() {
  const [boqItems, setBOQItems] = useState([]);
  const [masterDatabase, setMasterDatabase] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isItemManagerOpen, setIsItemManagerOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Database hook
  const {
    isLoading: dbLoading,
    error: dbError,
    isInitialized: dbInitialized,
    clearError,
    getCategories,
    addCategory: addCategoryToDB,
    updateCategory: updateCategoryInDB,
    deleteCategory: deleteCategoryFromDB,
    getItems,
    addItem: addItemToDB,
    updateItem: updateItemInDB,
    deleteItem: deleteItemFromDB
  } = useDatabase();

  // Load data from database when initialized
  useEffect(() => {
    const loadData = async () => {
      if (dbInitialized) {
        try {
          const dbCategories = await getCategories();
          const dbItems = await getItems();
          setCategories(Array.isArray(dbCategories) ? dbCategories : []);
          setMasterDatabase(Array.isArray(dbItems) ? dbItems : []);
        } catch (error) {
          console.error('Failed to load data from database:', error);
          setCategories([]);
          setMasterDatabase([]);
        }
      }
    };
    
    loadData();
  }, [dbInitialized, getCategories, getItems]);

  const addItemToBOQ = (item, quantity = 1) => {
    setBOQItems(prev => addItemToBOQHelper(prev, item, quantity, masterDatabase));
    setIsItemSelectorOpen(false);
  };

  const addDependencyToBOQ = (item, quantity = 1) => {
    setBOQItems(prev => addItemToBOQHelper(prev, item, quantity, masterDatabase));
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setBOQItems(prev => updateItemQuantityById(prev, itemId, newQuantity, masterDatabase));
  };

  const removeItemFromBOQ = (itemId) => {
    setBOQItems(prev => removeItemFromBOQById(prev, itemId));
  };

  const addItemToDatabase = async (item) => {
    const success = await addItemToDB(item);
    if (success) {
      const items = await getItems();
      setMasterDatabase(Array.isArray(items) ? items : []);
    }
    return success;
  };

  const updateItemInDatabase = async (itemId, updatedItem) => {
    const success = await updateItemInDB(itemId, updatedItem);
    if (success) {
      const items = await getItems();
      setMasterDatabase(Array.isArray(items) ? items : []);
      // Update BOQ items if they exist
      setBOQItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updatedItem } : item
      ));
    }
    return success;
  };

  const deleteItemFromDatabase = async (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const success = await deleteItemFromDB(itemId);
      if (success) {
        const items = await getItems();
        setMasterDatabase(Array.isArray(items) ? items : []);
        // Also remove from BOQ if present
        setBOQItems(prev => prev.filter(item => item.id !== itemId));
      }
      return success;
    }
    return false;
  };

  // Category management functions
  const addCategory = async (categoryName) => {
    const success = await addCategoryToDB(categoryName);
    if (success) {
      const categories = await getCategories();
      setCategories(Array.isArray(categories) ? categories : []);
    }
    return success;
  };

  const updateCategory = async (oldCategory, newCategory) => {
    const success = await updateCategoryInDB(oldCategory, newCategory);
    if (success) {
      const categories = await getCategories();
      const items = await getItems();
      setCategories(Array.isArray(categories) ? categories : []);
      setMasterDatabase(Array.isArray(items) ? items : []);
      // Update BOQ items as well
      setBOQItems(prev => prev.map(item => 
        item.category === oldCategory ? { ...item, category: newCategory } : item
      ));
      // Update selected category filter if it matches
      if (selectedCategory === oldCategory) {
        setSelectedCategory(newCategory);
      }
    }
    return success;
  };

  const deleteCategory = async (categoryName) => {
    try {
      await deleteCategoryFromDB(categoryName);
      const categories = await getCategories();
      setCategories(Array.isArray(categories) ? categories : []);
      // Clear selected category if it was deleted
      if (selectedCategory === categoryName) {
        setSelectedCategory('');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredDatabase = Array.isArray(masterDatabase) ? masterDatabase.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  // Show loading screen while database initializes
  if (dbLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="text-white animate-spin" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Initializing Database</h2>
          <p className="text-gray-600">Setting up your BOQ workspace...</p>
        </div>
      </div>
    );
  }

  // Show error screen if database failed to initialize
  if (dbError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Database Error</h2>
          <p className="text-gray-600 mb-6">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="text-white" size={26} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  BOQ Builder
                </h1>
                <p className="text-sm text-gray-500 font-medium">Professional Low Voltage Systems</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDatabaseManagerOpen(true)}
                className="group bg-gradient-to-r from-slate-500 to-gray-600 text-white px-5 py-2.5 rounded-xl hover:from-slate-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <Database size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">Database</span>
              </button>
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="group bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <Tags size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">Categories</span>
              </button>
              <button
                onClick={() => setIsItemManagerOpen(true)}
                className="group bg-gradient-to-r from-purple-500 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">Manage Items</span>
              </button>
              <button
                onClick={() => setIsItemSelectorOpen(true)}
                className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">Add Item</span>
              </button>
              <button
                onClick={() => setIsExportOpen(true)}
                disabled={boqItems.length === 0}
                className="group bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 disabled:transform-none disabled:shadow-lg disabled:hover:scale-100"
              >
                <FileText size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">Create BOQ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Item Database */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Search className="text-white" size={16} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Item Database</h2>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {filteredDatabase.length} items available
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" size={18} />
                    <input
                      type="text"
                      placeholder="Search items, manufacturers..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-gray-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {filteredDatabase.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-300" />
                      </div>
                      <p className="text-lg font-medium mb-1">No items found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredDatabase.map(item => (
                      <div 
                        key={item.id} 
                        className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                        onClick={() => addItemToBOQ(item, 1)}
                      >
                        <div className="font-semibold text-gray-800 mb-2 group-hover:text-blue-900 transition-colors duration-200">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {item.category}
                          </span>
                          {item.dependencies && item.dependencies.length > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                              +{item.dependencies.length} deps
                            </span>
                          )}
                        </div>
                        {item.manufacturer && (
                          <div className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                            {item.manufacturer}
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-bold text-emerald-600">
                            ${item.unitPrice}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            per {item.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - BOQ Table */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <BOQTable
                items={groupBOQItems(boqItems)}
                onUpdateQuantity={updateItemQuantity}
                onRemoveItem={removeItemFromBOQ}
                masterDatabase={Array.isArray(masterDatabase) ? masterDatabase : []}
              />
            </div>
          </div>

          {/* Right Panel - BOQ Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="text-white" size={16} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">BOQ Summary</h3>
                </div>
                <p className="text-sm text-gray-600">Project overview & totals</p>
              </div>
              
              <div className="p-6">
                {boqItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText size={36} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium mb-2">No items in BOQ yet</p>
                    <p className="text-sm text-gray-400">Add items to see your project summary</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 text-center border border-blue-200/50">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {boqItems.filter(item => !item.isDependency).length}
                        </div>
                        <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Main Items</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 text-center border border-orange-200/50">
                        <div className="text-3xl font-bold text-orange-600 mb-1">
                          {boqItems.filter(item => item.isDependency).length}
                        </div>
                        <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">Dependencies</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-xl p-6 border border-emerald-200/50 shadow-inner">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Total Project Value</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-emerald-600">Live</span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-emerald-700">
                        ${boqItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                      </div>
                    </div>
                    
                    {(() => {
                      const validation = validateBOQ(boqItems, Array.isArray(masterDatabase) ? masterDatabase : []);
                      return (
                        <div className="space-y-3">
                          {validation.isValid ? (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4">
                              <div className="text-green-700 text-sm flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                                <span className="font-medium">All dependencies satisfied</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-4">
                              <div className="text-red-700 text-sm">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                                  <span className="font-medium">{validation.errors.length} issues found</span>
                                </div>
                                <div className="space-y-1 ml-6">
                                  {validation.errors.slice(0, 2).map((error, index) => (
                                    <div key={index} className="text-xs text-red-600 flex items-center gap-2">
                                      <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                                      {error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DatabaseManager
        isOpen={isDatabaseManagerOpen}
        onClose={() => setIsDatabaseManagerOpen(false)}
      />

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        error={dbError}
        clearError={clearError}
      />

      <ItemManager
        isOpen={isItemManagerOpen}
        onClose={() => setIsItemManagerOpen(false)}
        items={masterDatabase}
        categories={categories}
        onAddItem={addItemToDatabase}
        onUpdateItem={updateItemInDatabase}
        onDeleteItem={deleteItemFromDatabase}
      />

      <ItemSelector
        isOpen={isItemSelectorOpen}
        onClose={() => setIsItemSelectorOpen(false)}
        onAddItem={(item, quantity) => addItemToBOQ(item, quantity)}
        masterDatabase={masterDatabase}
        categories={categories}
      />

      <BOQExport
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        boqItems={boqItems}
      />
    </div>
  );
}

export default App;
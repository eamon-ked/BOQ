import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react';

const ItemManager = ({ isOpen, onClose, items, categories, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    manufacturer: '',
    unit: 'pcs',
    unitPrice: 0,
    description: '',
    dependencies: []
  });

  const units = ['pcs', 'meters', 'rolls', 'kg', 'liters'];

  // Generate unique ID based on name and category
  const generateItemId = (name, category) => {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 20); // Limit length
    
    const cleanCategory = category.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 10);
    
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    return `${cleanCategory}-${cleanName}-${timestamp}`;
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      category: '',
      manufacturer: '',
      unit: 'pcs',
      unitPrice: 0,
      description: '',
      dependencies: []
    });
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    let itemData = {
      ...formData,
      unitPrice: parseFloat(formData.unitPrice) || 0
    };

    if (editingItem) {
      // Keep existing ID when editing
      onUpdateItem(editingItem.id, itemData);
    } else {
      // Generate new ID for new items
      const generatedId = generateItemId(formData.name, formData.category);
      
      // Ensure ID is unique by adding a counter if needed
      let finalId = generatedId;
      let counter = 1;
      while (items.some(item => item.id === finalId)) {
        finalId = `${generatedId}-${counter}`;
        counter++;
      }
      
      itemData.id = finalId;
      onAddItem(itemData);
    }

    resetForm();
  };

  const startEdit = (item) => {
    setFormData({ ...item });
    setEditingItem(item);
    setIsAddingItem(true);
  };

  const addDependency = () => {
    setFormData(prev => ({
      ...prev,
      dependencies: [...prev.dependencies, { itemId: '', quantity: 1 }]
    }));
  };

  const updateDependency = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.map((dep, i) => 
        i === index ? { ...dep, [field]: value } : dep
      )
    }));
  };

  const removeDependency = (index) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Item Database Manager</h2>
              <p className="text-sm text-gray-600 mt-1">{items.length} items in database</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex gap-6 h-full max-h-[calc(90vh-80px)]">
          {/* Item List */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Current Items</h3>
                  <p className="text-sm text-gray-600">{items.length} items available</p>
                </div>
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  Add New Item
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Plus size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No items yet</p>
                  <p className="text-sm text-gray-400">Add your first item to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map(item => (
                    <div key={item.id} className="p-4 hover:bg-blue-25 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
                          <p className="text-xs text-gray-400 mb-2">ID: {item.id}</p>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                              {item.category}
                            </span>
                            {item.manufacturer && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {item.manufacturer}
                              </span>
                            )}
                            {item.dependencies.length > 0 && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                {item.dependencies.length} deps
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-1">${item.unitPrice}/{item.unit}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Edit item"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Delete item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add/Edit Form */}
          {isAddingItem && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200 sticky top-0 z-10">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {editingItem ? 'Modify item details below' : 'Fill in the details to create a new item'}
                </p>
              </div>

              <div 
                className="flex-1 overflow-y-auto custom-scrollbar"
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.target;
                  setShowFloatingButton(scrollTop > 100 && scrollTop < scrollHeight - clientHeight - 100);
                }}
              >
                <form id="item-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                {editingItem ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Item ID:</strong> {formData.id}
                    </p>
                  </div>
                ) : (
                  formData.name && formData.category && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>Generated ID Preview:</strong> {generateItemId(formData.name, formData.category)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        ID will be automatically generated and made unique when you save
                      </p>
                    </div>
                  )
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Manufacturer name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg h-20"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Item description"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Dependencies</label>
                    <button
                      type="button"
                      onClick={addDependency}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Dependency
                    </button>
                  </div>
                  
                  {formData.dependencies.map((dep, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        value={dep.itemId}
                        onChange={(e) => updateDependency(index, 'itemId', e.target.value)}
                      >
                        <option value="">Select item</option>
                        {items.filter(item => item.id !== formData.id).map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        className="w-20 px-3 py-2 border rounded-lg text-sm"
                        value={dep.quantity}
                        onChange={(e) => updateDependency(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                      <button
                        type="button"
                        onClick={() => removeDependency(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                </form>
              </div>

              {/* Floating Action Button */}
              {showFloatingButton && (
                <button
                  type="submit"
                  form="item-form"
                  className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 z-30 animate-fadeIn"
                  title={editingItem ? 'Update Item' : 'Add Item'}
                >
                  <Save size={24} />
                </button>
              )}

              {/* Sticky Action Buttons */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 rounded-b-lg sticky bottom-0 z-10 shadow-lg">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="item-form"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Save size={18} />
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
                
                {/* Progress indicator */}
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${formData.name ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${formData.category ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${formData.unitPrice > 0 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  <span className="ml-2">
                    {[formData.name, formData.category, formData.unitPrice > 0].filter(Boolean).length}/3 required fields
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemManager;
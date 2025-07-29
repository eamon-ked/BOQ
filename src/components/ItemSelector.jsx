import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';

const ItemSelector = ({ isOpen, onClose, onAddItem, masterDatabase, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantity, setQuantity] = useState(1);

  const filteredItems = masterDatabase.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (item) => {
    onAddItem(item, parseInt(quantity));
    setQuantity(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add Item to BOQ</h2>
              <p className="text-sm text-gray-600 mt-1">{filteredItems.length} items available</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, description, or manufacturer..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                className="w-24 px-3 py-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto max-h-96 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No items found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-xl p-5 hover:bg-blue-25 hover:border-blue-300 transition-all duration-200 hover-lift"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          {item.category}
                        </span>
                        {item.dependencies && item.dependencies.length > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                            +{item.dependencies.length} auto-deps
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      
                      {item.manufacturer && (
                        <p className="text-sm text-blue-600 font-medium mb-2">
                          <span className="text-gray-500">by</span> {item.manufacturer}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm mb-3">
                        <span className="font-bold text-green-600 text-lg">
                          ${item.unitPrice} / {item.unit}
                        </span>
                        <span className="text-gray-500">
                          Total: ${(item.unitPrice * quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.dependencies && item.dependencies.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                          <p className="text-xs font-semibold text-orange-800 mb-1">
                            Will automatically add:
                          </p>
                          <div className="text-xs text-orange-700">
                            {item.dependencies.map(dep => {
                              const depItem = masterDatabase.find(dbItem => dbItem.id === dep.itemId);
                              return depItem ? `${depItem.name} (${dep.quantity * quantity}x)` : dep.itemId;
                            }).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleAddItem(item)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ml-4"
                    >
                      <Plus size={18} />
                      Add to BOQ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemSelector;
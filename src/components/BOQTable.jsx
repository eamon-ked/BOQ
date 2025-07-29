import React from 'react';
import { Trash2, ArrowRight, Lock, Package, Layers } from 'lucide-react';

const BOQTable = ({ items, onUpdateQuantity, onRemoveItem, masterDatabase }) => {
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const mainItems = items.filter(item => !item.isDependency);
  const dependencies = items.filter(item => item.isDependency);

  return (
    <>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bill of Quantities</h2>
              <p className="text-sm text-gray-600 mt-1">Project items and dependencies</p>
            </div>
          </div>
          
          {items.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md">
              <div className="text-2xl font-bold text-indigo-600">${totalValue.toFixed(2)}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Value</div>
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-blue-100/50 rounded-lg px-3 py-2">
              <Package size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{mainItems.length} Main Items</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-100/50 rounded-lg px-3 py-2">
              <Layers size={16} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-800">{dependencies.length} Dependencies</span>
            </div>
          </div>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float">
            <Package size={48} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-gray-700">Your BOQ is Empty</h3>
          <p className="text-lg text-gray-500 mb-6 max-w-md mx-auto">Start building your Bill of Quantities by adding items from the database</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Click items in database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              <span>Use "Add Item" button</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Items Section */}
          {mainItems.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="text-white" size={14} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Main Items</h3>
                <span className="text-sm text-gray-500">({mainItems.length} items)</span>
              </div>
              
              <div className="space-y-3">
                {mainItems.map((item, index) => (
                  <div key={`main-${item.id}-${index}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {item.category}
                          </span>
                          {item.manufacturer && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                              {item.manufacturer}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-gray-600">Unit Price: <span className="font-semibold text-gray-800">${item.unitPrice.toFixed(2)}</span></span>
                          <span className="text-gray-600">Unit: <span className="font-semibold text-gray-800">{item.unit}</span></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <label className="block text-xs text-gray-500 mb-1 font-medium">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1 font-medium">Total</div>
                          <div className="text-xl font-bold text-green-600">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Remove item and its dependencies"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies Section */}
          {dependencies.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Layers className="text-white" size={14} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Auto-Added Dependencies</h3>
                <span className="text-sm text-gray-500">({dependencies.length} items)</span>
              </div>
              
              <div className="space-y-2">
                {dependencies.map((item, index) => (
                  <div key={`dep-${item.id}-${index}`} className="bg-orange-25 border border-orange-200 rounded-lg p-4 ml-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowRight size={16} className="text-orange-500" />
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            Required by: {item.requiredByName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 ml-6">
                          <span>{item.category}</span>
                          {item.manufacturer && <span>• {item.manufacturer}</span>}
                          <span>• ${item.unitPrice.toFixed(2)}/{item.unit}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                          <span className="text-sm font-semibold text-gray-700">{item.quantity}</span>
                          <Lock size={14} className="text-gray-500" title="Quantity managed automatically" />
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                        <div className="w-10 flex justify-center">
                          <Lock size={16} className="text-gray-400" title="Cannot remove dependency directly" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Footer */}
          {items.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-t-2 border-emerald-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold">Project Summary:</div>
                    <div className="flex items-center gap-4 mt-1">
                      <span>{mainItems.length} main items</span>
                      <span>•</span>
                      <span>{dependencies.length} dependencies</span>
                      <span>•</span>
                      <span>{items.reduce((sum, item) => sum + item.quantity, 0)} total units</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Total Project Value</div>
                  <div className="text-3xl font-bold text-emerald-700 bg-white/70 rounded-xl px-6 py-3 shadow-inner">
                    ${totalValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </>
  );
};

export default BOQTable;
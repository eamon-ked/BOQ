import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const ItemManager = ({ isOpen, onClose, items, categories, onAddItem, onUpdateItem, onDeleteItem, onItemsChanged }) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    manufacturer: '',
    partNumber: '',
    unit: 'pcs',
    unitPrice: 0,
    unitNetPrice: 0,
    serviceDuration: 0,
    estimatedLeadTime: 0,
    pricingTerm: 'Each',
    discount: 0,
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
      partNumber: '',
      unit: 'pcs',
      unitPrice: 0,
      unitNetPrice: 0,
      serviceDuration: 0,
      estimatedLeadTime: 0,
      pricingTerm: 'Each',
      discount: 0,
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
      unitPrice: parseFloat(formData.unitPrice) || 0,
      unitNetPrice: parseFloat(formData.unitNetPrice) || parseFloat(formData.unitPrice) || 0,
      serviceDuration: parseInt(formData.serviceDuration) || 0,
      estimatedLeadTime: parseInt(formData.estimatedLeadTime) || 0,
      discount: parseFloat(formData.discount) || 0
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

  const [showImportModal, setShowImportModal] = useState(false);
  const [importedItems, setImportedItems] = useState([]);
  const [importError, setImportError] = useState('');

  const templateHeaders = [
    "name", "category", "manufacturer", "partNumber", "unit", "unitPrice", "unitNetPrice", "serviceDuration", "estimatedLeadTime", "pricingTerm", "discount", "description"
  ];
  const exampleRow = {
    name: "Sample Camera",
    category: "CCTV",
    manufacturer: "BrandX",
    partNumber: "ABC123",
    unit: "pcs",
    unitPrice: 100,
    unitNetPrice: 90,
    serviceDuration: 12,
    estimatedLeadTime: 4,
    pricingTerm: "Each",
    discount: 5,
    description: "HD Camera"
  };

  function downloadCSVTemplate() {
    const csv = Papa.unparse([exampleRow], { columns: templateHeaders });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "boq_items_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadXLSXTemplate() {
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: templateHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "boq_items_template.xlsx");
  }

  function handleImportFile(e) {
    setImportError('');
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            setImportError("CSV parsing error: " + results.errors[0].message);
          } else {
            setImportedItems(results.data);
          }
        }
      });
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        setImportedItems(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setImportError("Unsupported file type. Please upload CSV or XLSX.");
    }
  }

  async function handleImportSubmit() {
    if (!importedItems.length) return;
    setImportError("");
    try {
      const response = await fetch("http://localhost:3001/api/items/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: importedItems })
      });
      const result = await response.json();
      if (result.success) {
        setShowImportModal(false);
        setImportedItems([]);
        alert(`Imported ${importedItems.length} items successfully!`);
        if (onItemsChanged) onItemsChanged();
      } else {
        setImportError(result.error || "Import failed. Please check your data.");
      }
    } catch (err) {
      setImportError("Import failed: " + err.message);
    }
  }

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Item Database Manager</h2>
              <p className="text-sm text-gray-600 mt-1">{items.length} items in database</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-200"
              >
                Import Items
              </button>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Part Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                      value={formData.partNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
                      placeholder="Part/Model number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Pricing Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-800 mb-3">Pricing Information</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit List Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit Net Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.unitNetPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, unitNetPrice: e.target.value }))}
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.discount}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          const listPrice = parseFloat(formData.unitPrice) || 0;
                          const netPrice = listPrice * (1 - discount / 100);
                          setFormData(prev => ({ 
                            ...prev, 
                            discount: e.target.value,
                            unitNetPrice: netPrice.toFixed(2)
                          }));
                        }}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Pricing Term</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.pricingTerm}
                      onChange={(e) => setFormData(prev => ({ ...prev, pricingTerm: e.target.value }))}
                    >
                      <option value="Each">Each</option>
                      <option value="Per Meter">Per Meter</option>
                      <option value="Per Roll">Per Roll</option>
                      <option value="Per Kg">Per Kg</option>
                      <option value="Per Liter">Per Liter</option>
                      <option value="Per Set">Per Set</option>
                    </select>
                  </div>
                </div>

                {/* Service & Lead Time Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Service & Delivery Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Service Duration (Months)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.serviceDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceDuration: e.target.value }))}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Warranty/service period in months</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Lead Time (Days)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.estimatedLeadTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedLeadTime: e.target.value }))}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Expected delivery time in days</p>
                    </div>
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

    {showImportModal && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={() => { setShowImportModal(false); setImportedItems([]); setImportError(''); }}
        >
          <X size={24} />
        </button>
        <h3 className="text-xl font-bold mb-4">Import Items from CSV/XLSX</h3>
        <div className="flex gap-4 mb-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
            onClick={downloadCSVTemplate}
          >
            Download CSV Template
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
            onClick={downloadXLSXTemplate}
          >
            Download XLSX Template
          </button>
        </div>
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleImportFile}
          className="mb-4"
        />
        {importError && <div className="text-red-600 mb-2">{importError}</div>}
        {importedItems.length > 0 && (
          <div className="mb-4 max-h-40 overflow-auto border rounded">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(importedItems[0]).map((key) => (
                    <th key={key} className="p-1 border">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedItems.map((item, idx) => (
                  <tr key={idx}>
                    {Object.values(item).map((val, i) => (
                      <td key={i} className="p-1 border">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded mt-2"
          disabled={!importedItems.length}
          onClick={handleImportSubmit}
        >
          Import {importedItems.length} Items
        </button>
      </div>
    </div>
  )}
    </>
  );

  
};

export default ItemManager;
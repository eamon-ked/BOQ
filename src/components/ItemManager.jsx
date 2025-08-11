import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Save, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { createItemFormSchema, updateItemFormSchema } from '../validation/schemas';

// Field Error Display Component
const FieldError = memo(({ error, warning, touched, fieldName }) => {
  if (!touched) return null;
  
  const errorId = fieldName ? `field-${fieldName}-error` : undefined;
  
  if (error) {
    return (
      <div id={errorId} className="flex items-center gap-1 mt-1 text-red-600" role="alert">
        <AlertCircle size={12} />
        <span className="text-xs">{error}</span>
      </div>
    );
  }
  
  if (warning) {
    return (
      <div id={errorId} className="flex items-center gap-1 mt-1 text-yellow-600" role="alert">
        <AlertCircle size={12} />
        <span className="text-xs">{warning}</span>
      </div>
    );
  }
  
  return null;
});

// Validated Input Component
const ValidatedInput = memo(({ 
  label, 
  required = false, 
  type = 'text', 
  placeholder, 
  fieldProps, 
  fieldState,
  className = '',
  children,
  ...props 
}) => {
  const { error, warning, touched } = fieldState;
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  
  // Generate unique ID for accessibility
  const fieldId = `field-${fieldProps.name}`;
  const errorId = hasError ? `${fieldId}-error` : undefined;
  
  // Filter out non-DOM properties from fieldProps
  const { error: _, warning: __, touched: ___, ...domProps } = fieldProps;
  
  const inputClassName = `w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
    hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
      : hasWarning
      ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
  } focus:ring-2 focus:ring-opacity-50 ${className}`;

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select 
          {...domProps} 
          {...props} 
          id={fieldId}
          className={inputClassName}
          aria-invalid={hasError}
          aria-describedby={errorId}
        >
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea 
          {...domProps} 
          {...props} 
          id={fieldId}
          className={inputClassName} 
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={errorId}
        />
      ) : (
        <input 
          {...domProps} 
          {...props} 
          id={fieldId}
          type={type} 
          className={inputClassName} 
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={errorId}
        />
      )}
      <FieldError error={error} warning={warning} touched={touched} fieldName={fieldProps.name} />
    </div>
  );
});

const ItemManager = memo(() => {
  // Get data from store with proper selectors
  const isOpen = useAppStore((state) => state.ui.modals.itemEditor);
  const items = useAppStore((state) => state.data.masterDatabase);
  const categories = useAppStore((state) => state.data.categories);
  
  // Get actions from store
  const closeModal = useAppStore((state) => state.closeModal);
  const setMasterDatabase = useAppStore((state) => state.setMasterDatabase);
  
  // Local state for form management
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  
  // Default form values
  const defaultFormValues = {
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
    tags: [],
    dependencies: [],
    metadata: {
      isActive: true,
      stockLevel: undefined,
      lastPriceUpdate: undefined,
      supplierInfo: undefined
    }
  };

  // Initialize validated form
  const {
    values: formData,
    errors: formErrors,
    warnings: formWarnings,
    touched,
    isValid: isFormValid,
    isSubmitting,
    setValue,
    setValues,
    handleSubmit: handleFormSubmit,
    reset: resetForm,
    getFieldProps,
    getFieldState
  } = useValidatedForm({
    schema: editingItem ? updateItemFormSchema : createItemFormSchema,
    defaultValues: defaultFormValues,
    mode: 'onChange',
    revalidateMode: 'onChange',
    sanitizeOnChange: true,
    sanitizeType: 'item',
    onSubmit: async (validatedData) => {
      return await submitForm(validatedData);
    }
  });

  const units = ['pcs', 'meters', 'rolls', 'kg', 'liters'];

  // Ensure form is properly initialized
  useEffect(() => {
    if (!isAddingItem && !editingItem) {
      resetForm(defaultFormValues);
    }
  }, [isAddingItem, editingItem, resetForm]);

  // Generate unique ID based on name and category
  const generateItemId = (name, category) => {
    // Ensure name and category are strings and not empty
    let safeName = '';
    let safeCategory = '';
    
    try {
      safeName = (name || '').toString().trim();
      safeCategory = (category || '').toString().trim();
    } catch (error) {
      console.warn('Error converting name/category to string:', error);
      safeName = '';
      safeCategory = '';
    }
    
    if (!safeName || !safeCategory) {
      return 'incomplete-item-' + Date.now().toString().slice(-4);
    }
    
    const cleanName = safeName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 20); // Limit length
    
    const cleanCategory = safeCategory.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 10);
    
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    return `${cleanCategory}-${cleanName}-${timestamp}`;
  };

  // Get actions from store
  const addMasterItem = useAppStore((state) => state.addMasterItem);
  const updateMasterItem = useAppStore((state) => state.updateMasterItem);
  const deleteMasterItem = useAppStore((state) => state.deleteMasterItem);

  // Utility function to clean up malformed items
  const cleanupMalformedItems = useCallback(() => {
    const cleanedItems = items.map(item => {
      const cleanedItem = { ...item };
      
      // Fix string fields that might be objects
      const stringFields = ['name', 'category', 'manufacturer', 'partNumber', 'unit', 'pricingTerm', 'description'];
      stringFields.forEach(field => {
        if (typeof cleanedItem[field] === 'object' && cleanedItem[field] !== null) {
          console.log(`Cleaning malformed field ${field} in item ${item.id}:`, cleanedItem[field]);
          cleanedItem[field] = '';
        }
      });
      
      // Fix numeric fields
      const numericFields = ['unitPrice', 'unitNetPrice', 'serviceDuration', 'estimatedLeadTime', 'discount'];
      numericFields.forEach(field => {
        if (typeof cleanedItem[field] === 'object' && cleanedItem[field] !== null) {
          console.log(`Cleaning malformed numeric field ${field} in item ${item.id}:`, cleanedItem[field]);
          cleanedItem[field] = 0;
        }
      });
      
      // Fix array fields
      if (!Array.isArray(cleanedItem.tags)) {
        cleanedItem.tags = [];
      }
      if (!Array.isArray(cleanedItem.dependencies)) {
        cleanedItem.dependencies = [];
      }
      
      // Fix metadata
      if (typeof cleanedItem.metadata !== 'object' || cleanedItem.metadata === null) {
        cleanedItem.metadata = { isActive: true };
      }
      
      return cleanedItem;
    });
    
    setMasterDatabase(cleanedItems);
    toast.success('Database cleaned up successfully!', {
      duration: 3000,
      icon: '🧹',
    });
  }, [items, setMasterDatabase]);

  const resetFormState = useCallback(() => {
    resetForm(defaultFormValues);
    setIsAddingItem(false);
    setEditingItem(null);
  }, [resetForm]);

  const submitForm = useCallback(async (validatedData) => {
    try {
      let itemData = {
        ...validatedData,
        // Ensure numeric fields are properly converted
        unitPrice: parseFloat(validatedData.unitPrice) || 0,
        unitNetPrice: parseFloat(validatedData.unitNetPrice) || parseFloat(validatedData.unitPrice) || 0,
        serviceDuration: parseInt(validatedData.serviceDuration) || 0,
        estimatedLeadTime: parseInt(validatedData.estimatedLeadTime) || 0,
        discount: parseFloat(validatedData.discount) || 0
      };

      if (editingItem) {
        // Keep existing ID when editing
        itemData.id = editingItem.id;
        await updateMasterItem(editingItem.id, itemData);
        toast.success(`Updated item "${itemData.name}"`, {
          duration: 3000,
          icon: '✏️',
        });
      } else {
        // Generate new ID for new items
        const generatedId = generateItemId(itemData.name, itemData.category);
        
        // Ensure ID is unique by adding a counter if needed
        let finalId = generatedId;
        let counter = 1;
        while (items.some(item => item.id === finalId)) {
          finalId = `${generatedId}-${counter}`;
          counter++;
        }
        
        itemData.id = finalId;
        await addMasterItem(itemData);
        toast.success(`Added item "${itemData.name}"`, {
          duration: 3000,
          icon: '➕',
        });
      }

      resetFormState();
      return itemData;
    } catch (error) {
      const errorMessage = `Failed to ${editingItem ? 'update' : 'add'} item: ${error.message}`;
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
      throw new Error(errorMessage);
    }
  }, [editingItem, items, updateMasterItem, addMasterItem, resetFormState]);

  const startEdit = useCallback((item) => {
    // Debug: Log the raw item data to see what we're working with
    console.log('startEdit - Raw item data:', item);
    console.log('startEdit - Item keys:', Object.keys(item));
    console.log('startEdit - Item.name:', item.name, 'type:', typeof item.name);
    console.log('startEdit - Item.category:', item.category, 'type:', typeof item.category);
    console.log('startEdit - Item.id:', item.id, 'type:', typeof item.id);
    
    // Prepare item data for form, ensuring all required fields exist and properly typed
    const itemForForm = {
      // Start with default values to ensure structure
      ...defaultFormValues,
      // Override with item data, but ensure proper types
      id: item.id || '',
      name: typeof item.name === 'object' ? '' : String(item.name || ''),
      category: typeof item.category === 'object' ? '' : String(item.category || ''),
      manufacturer: typeof item.manufacturer === 'object' ? '' : String(item.manufacturer || ''),
      partNumber: typeof item.partNumber === 'object' ? '' : String(item.partNumber || ''),
      unit: typeof item.unit === 'object' ? 'pcs' : String(item.unit || 'pcs'),
      pricingTerm: typeof item.pricingTerm === 'object' ? 'Each' : String(item.pricingTerm || 'Each'),
      description: typeof item.description === 'object' ? '' : String(item.description || ''),
      // Ensure numeric fields are numbers
      unitPrice: Number(item.unitPrice) || 0,
      unitNetPrice: Number(item.unitNetPrice) || 0,
      serviceDuration: Number(item.serviceDuration) || 0,
      estimatedLeadTime: Number(item.estimatedLeadTime) || 0,
      discount: Number(item.discount) || 0,
      // Ensure arrays exist and are arrays
      tags: Array.isArray(item.tags) ? item.tags : [],
      dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
      // Ensure metadata is an object with proper structure
      metadata: {
        ...defaultFormValues.metadata,
        ...(typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {})
      }
    };
    
    console.log('startEdit - Processed item data:', itemForForm);
    console.log('startEdit - Processed name:', itemForForm.name, 'type:', typeof itemForForm.name);
    console.log('startEdit - Processed category:', itemForForm.category, 'type:', typeof itemForForm.category);
    
    setValues(itemForForm, false); // Don't validate immediately when loading
    setEditingItem(item);
    setIsAddingItem(true);
  }, [setValues]);

  const addDependency = useCallback(() => {
    const newDependencies = [...formData.dependencies, { itemId: '', quantity: 1, isOptional: false }];
    setValue('dependencies', newDependencies);
  }, [formData.dependencies, setValue]);

  const updateDependency = useCallback((index, field, value) => {
    const updatedDependencies = formData.dependencies.map((dep, i) => 
      i === index ? { ...dep, [field]: value } : dep
    );
    setValue('dependencies', updatedDependencies);
  }, [formData.dependencies, setValue]);

  const removeDependency = useCallback((index) => {
    const filteredDependencies = formData.dependencies.filter((_, i) => i !== index);
    setValue('dependencies', filteredDependencies);
  }, [formData.dependencies, setValue]);

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

  const handleImportSubmit = useCallback(async () => {
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
        toast.success(`Imported ${importedItems.length} items successfully!`, {
          duration: 4000,
          icon: '📥',
        });
        // Refresh the master database from server
        // This would typically trigger a refetch of data
      } else {
        setImportError(result.error || "Import failed. Please check your data.");
      }
    } catch (err) {
      setImportError("Import failed: " + err.message);
    }
  }, [importedItems]);

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
                onClick={cleanupMalformedItems}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200"
                title="Clean up any malformed items in the database"
              >
                🧹 Cleanup DB
              </button>
              <button 
                onClick={() => closeModal('itemEditor')} 
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
                  onClick={() => {
                    setEditingItem(null);
                    resetForm(defaultFormValues);
                    setIsAddingItem(true);
                  }}
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
                          
                          <p className="text-sm text-gray-600 mb-1">${Number(item.unitPrice) || 0}/{item.unit}</p>
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
                            onClick={() => deleteMasterItem(item.id)}
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
                <form id="item-form" onSubmit={handleFormSubmit} className="p-4 space-y-4">
                {editingItem ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Item ID:</strong> {String(formData.id || '')}
                    </p>
                  </div>
                ) : (
                  formData.name && formData.category && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>Generated ID Preview:</strong> {generateItemId(String(formData.name), String(formData.category))}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        ID will be automatically generated and made unique when you save
                      </p>
                    </div>
                  )
                )}

                <ValidatedInput
                  label="Name"
                  required
                  placeholder="Item name"
                  fieldProps={getFieldProps('name')}
                  fieldState={getFieldState('name')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Manufacturer"
                    placeholder="Manufacturer name"
                    fieldProps={getFieldProps('manufacturer')}
                    fieldState={getFieldState('manufacturer')}
                  />
                  <ValidatedInput
                    label="Part Number"
                    placeholder="Part/Model number"
                    className="font-mono"
                    fieldProps={getFieldProps('partNumber')}
                    fieldState={getFieldState('partNumber')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Category"
                    required
                    type="select"
                    fieldProps={getFieldProps('category')}
                    fieldState={getFieldState('category')}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </ValidatedInput>
                  <ValidatedInput
                    label="Unit"
                    type="select"
                    fieldProps={getFieldProps('unit')}
                    fieldState={getFieldState('unit')}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </ValidatedInput>
                </div>

                {/* Pricing Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-800 mb-3">Pricing Information</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <ValidatedInput
                      label="Unit List Price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      fieldProps={getFieldProps('unitPrice', { type: 'number' })}
                      fieldState={getFieldState('unitPrice')}
                    />
                    <ValidatedInput
                      label="Unit Net Price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Auto-calculated"
                      fieldProps={getFieldProps('unitNetPrice', { type: 'number' })}
                      fieldState={getFieldState('unitNetPrice')}
                    />
                    <ValidatedInput
                      label="Discount (%)"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0"
                      fieldProps={{
                        ...getFieldProps('discount', { type: 'number' }),
                        onChange: (e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          const listPrice = parseFloat(formData.unitPrice) || 0;
                          const netPrice = listPrice * (1 - discount / 100);
                          setValue('discount', e.target.value);
                          setValue('unitNetPrice', netPrice.toFixed(2));
                        }
                      }}
                      fieldState={getFieldState('discount')}
                    />
                  </div>
                  <div className="mt-3">
                    <ValidatedInput
                      label="Pricing Term"
                      type="select"
                      fieldProps={getFieldProps('pricingTerm')}
                      fieldState={getFieldState('pricingTerm')}
                    >
                      <option value="Each">Each</option>
                      <option value="Per Meter">Per Meter</option>
                      <option value="Per Roll">Per Roll</option>
                      <option value="Per Kg">Per Kg</option>
                      <option value="Per Liter">Per Liter</option>
                      <option value="Per Set">Per Set</option>
                    </ValidatedInput>
                  </div>
                </div>

                {/* Service & Lead Time Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Service & Delivery Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <ValidatedInput
                        label="Service Duration (Months)"
                        type="number"
                        min="0"
                        placeholder="0"
                        fieldProps={getFieldProps('serviceDuration', { type: 'number' })}
                        fieldState={getFieldState('serviceDuration')}
                      />
                      <p className="text-xs text-gray-500 mt-1">Warranty/service period in months</p>
                    </div>
                    <div>
                      <ValidatedInput
                        label="Estimated Lead Time (Days)"
                        type="number"
                        min="0"
                        placeholder="0"
                        fieldProps={getFieldProps('estimatedLeadTime', { type: 'number' })}
                        fieldState={getFieldState('estimatedLeadTime')}
                      />
                      <p className="text-xs text-gray-500 mt-1">Expected delivery time in days</p>
                    </div>
                  </div>
                </div>

                <ValidatedInput
                  label="Description"
                  type="textarea"
                  className="h-20"
                  placeholder="Item description"
                  fieldProps={getFieldProps('description')}
                  fieldState={getFieldState('description')}
                />

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
                        {items.filter(item => item.id !== String(formData.id || '')).map(item => (
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
                  disabled={!isFormValid || isSubmitting || !formData.name?.trim() || !formData.category?.trim()}
                  className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 z-30 animate-fadeIn ${
                    !isFormValid || isSubmitting || !formData.name?.trim() || !formData.category?.trim()
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                  title={
                    !isFormValid || !formData.name?.trim() || !formData.category?.trim()
                      ? 'Please fix validation errors' 
                      : isSubmitting 
                      ? 'Submitting...' 
                      : (editingItem ? 'Update Item' : 'Add Item')
                  }
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
                    disabled={!isFormValid || isSubmitting || !formData.name?.trim() || !formData.category?.trim()}
                    className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                      !isFormValid || isSubmitting || !formData.name?.trim() || !formData.category?.trim()
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    <Save size={18} />
                    {isSubmitting 
                      ? (editingItem ? 'Updating...' : 'Adding...') 
                      : (editingItem ? 'Update Item' : 'Add Item')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={resetFormState}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
                
                {/* Progress indicator */}
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${String(formData.name || '').trim() && !formErrors.name ? 'bg-green-400' : formErrors.name ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${String(formData.category || '').trim() && !formErrors.category ? 'bg-green-400' : formErrors.category ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${(Number(formData.unitPrice) || 0) >= 0 && !formErrors.unitPrice ? 'bg-green-400' : formErrors.unitPrice ? 'bg-red-400' : 'bg-gray-300'}`}></div>
                  <span className="ml-2">
                    {isFormValid && formData.name?.trim() && formData.category?.trim() ? 'Form is valid' : `${Object.keys(formErrors).length} validation errors`}
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

  
});

ItemManager.displayName = 'ItemManager';

export default ItemManager;
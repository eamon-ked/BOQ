import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useValidatedForm } from '../hooks/useValidatedForm';
import { simpleCategoryFormSchema } from '../validation/schemas';

// Field Error Display Component
const FieldError = ({ error, warning, touched }) => {
  if (!touched) return null;
  
  if (error) {
    return (
      <div className="flex items-center gap-1 mt-1 text-red-600">
        <AlertCircle size={12} />
        <span className="text-xs">{error}</span>
      </div>
    );
  }
  
  if (warning) {
    return (
      <div className="flex items-center gap-1 mt-1 text-yellow-600">
        <AlertCircle size={12} />
        <span className="text-xs">{warning}</span>
      </div>
    );
  }
  
  return null;
};

// Validated Input Component
const ValidatedInput = ({ 
  label, 
  required = false, 
  type = 'text', 
  placeholder, 
  fieldProps, 
  fieldState,
  className = '',
  autoFocus = false,
  ...props 
}) => {
  const { error, warning, touched } = fieldState;
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  
  const inputClassName = `w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
    hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
      : hasWarning
      ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
  } focus:ring-2 focus:ring-opacity-50 ${className}`;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        name={fieldProps.name}
        value={fieldProps.value}
        onChange={fieldProps.onChange}
        onBlur={fieldProps.onBlur}
        aria-invalid={fieldProps['aria-invalid']}
        aria-describedby={fieldProps['aria-describedby']}
        {...props} 
        type={type} 
        className={inputClassName} 
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <FieldError error={error} warning={warning} touched={touched} />
    </div>
  );
};

const CategoryManager = ({ isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory, error, clearError }) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Default form values - simplified for the form fields actually being used
  const defaultFormValues = {
    name: ''
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
    schema: simpleCategoryFormSchema,
    defaultValues: defaultFormValues,
    mode: 'onChange',
    revalidateMode: 'onChange',
    sanitizeOnChange: true,
    sanitizeType: 'category',
    onSubmit: async (validatedData) => {
      return await submitForm(validatedData);
    }
  });

  const submitForm = async (validatedData) => {
    try {
      // Clear any previous errors
      if (clearError) clearError();

      // Check for duplicate category (except when editing)
      if (!editingCategory && categories.includes(validatedData.name.trim())) {
        toast.error('Category already exists. Please use a unique name.', {
          duration: 4000,
          icon: '⚠️',
        });
        throw new Error('Category already exists');
      }

      let success = false;
      if (editingCategory) {
        success = await onUpdateCategory(editingCategory, validatedData.name.trim());
        if (success) {
          toast.success(`Updated category "${validatedData.name.trim()}"`, {
            duration: 3000,
            icon: '✏️',
          });
        }
      } else {
        success = await onAddCategory(validatedData.name.trim());
        if (success) {
          toast.success(`Added category "${validatedData.name.trim()}"`, {
            duration: 3000,
            icon: '➕',
          });
        }
      }

      if (success) {
        resetFormState();
        return validatedData;
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      const errorMessage = `Failed to ${editingCategory ? 'update' : 'add'} category: ${error.message}`;
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
      throw new Error(errorMessage);
    }
  };

  const resetFormState = () => {
    resetForm(defaultFormValues);
    setIsAddingCategory(false);
    setEditingCategory(null);
  };

  const startEdit = (category) => {
    // For simple category manager, we only have the name
    const categoryForForm = {
      name: category
    };
    
    setValues(categoryForForm, false); // Don't validate immediately when loading
    setEditingCategory(category);
    setIsAddingCategory(true);
  };

  const handleDelete = async (category) => {
    // Use toast.promise for confirmation-like behavior
    toast.promise(
      new Promise((resolve, reject) => {
        const confirmed = confirm(`Are you sure you want to delete the "${category}" category? This action cannot be undone.`);
        if (confirmed) {
          onDeleteCategory(category)
            .then(() => resolve())
            .catch(reject);
        } else {
          reject(new Error('Cancelled'));
        }
      }),
      {
        loading: `Deleting category "${category}"...`,
        success: `Deleted category "${category}"`,
        error: (err) => err.message === 'Cancelled' ? null : `Failed to delete category: ${err.message}`,
      },
      {
        success: { duration: 3000, icon: '🗑️' },
        error: { duration: 5000, icon: '❌' },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Category Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-6">
          {/* Category List */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Current Categories</h3>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map(category => (
                <div key={category} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <span className="font-medium">{category}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit category"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add/Edit Form */}
          {isAddingCategory && (
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <ValidatedInput
                  label="Category Name"
                  required
                  placeholder="Enter category name"
                  autoFocus
                  fieldProps={getFieldProps('name')}
                  fieldState={getFieldState('name')}
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      !isFormValid || isSubmitting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <Save size={16} />
                    {isSubmitting 
                      ? (editingCategory ? 'Updating...' : 'Adding...') 
                      : (editingCategory ? 'Update' : 'Add')
                    } Category
                  </button>
                  <button
                    type="button"
                    onClick={resetFormState}
                    disabled={isSubmitting}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>

                {/* Validation Status */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{Object.keys(formErrors).length} validation error(s)</span>
                  </div>
                )}
              </form>

              {editingCategory && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Editing this category will update all items that use it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Category Management Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Categories help organize your items in the database</li>
            <li>• Deleting a category will affect all items using it</li>
            <li>• Common categories: CCTV, Access Control, PAVA, Network, Cabling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react';

const CategoryManager = ({ isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory, error, clearError }) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    // Clear any previous errors
    if (clearError) clearError();

    // Check for duplicate category (except when editing)
    if (!editingCategory && categories.includes(newCategoryName.trim())) {
      alert('Category already exists. Please use a unique name.');
      return;
    }

    let success = false;
    if (editingCategory) {
      success = await onUpdateCategory(editingCategory, newCategoryName.trim());
    } else {
      success = await onAddCategory(newCategoryName.trim());
    }

    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setNewCategoryName('');
    setIsAddingCategory(false);
    setEditingCategory(null);
  };

  const startEdit = (category) => {
    setNewCategoryName(category);
    setEditingCategory(category);
    setIsAddingCategory(true);
  };

  const handleDelete = (category) => {
    if (confirm(`Are you sure you want to delete the "${category}" category? This action cannot be undone.`)) {
      onDeleteCategory(category);
    }
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {editingCategory ? 'Update' : 'Add'} Category
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
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
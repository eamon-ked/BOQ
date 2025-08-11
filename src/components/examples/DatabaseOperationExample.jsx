import React, { useEffect } from 'react';
import { useAsyncOperation } from '../../hooks/useAsyncOperation.js';
import databaseService from '../../services/database.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

/**
 * Example component demonstrating how to integrate useAsyncOperation hook
 * with database operations for better loading states and error handling
 */
const DatabaseOperationExample = () => {
  // Initialize async operations for different database operations
  const itemsOperation = useAsyncOperation({
    key: 'items-fetch',
    persistLoading: true,
    showToast: true,
    retryAttempts: 2,
    retryDelay: 1000,
    onSuccess: (data) => {
      console.log('Items loaded successfully:', data.length, 'items');
    },
    onError: (error) => {
      console.error('Failed to load items:', error);
    }
  });

  const addItemOperation = useAsyncOperation({
    key: 'item-add',
    showToast: true,
    retryAttempts: 1,
    onSuccess: (result, context) => {
      console.log('Item added successfully:', context.itemName);
      // Refresh items list after successful add
      loadItems();
    }
  });

  const deleteItemOperation = useAsyncOperation({
    key: 'item-delete',
    showToast: true,
    retryAttempts: 0, // Don't retry delete operations
    onSuccess: (result, context) => {
      console.log('Item deleted successfully:', context.itemId);
      // Refresh items list after successful delete
      loadItems();
    }
  });

  // Load items function using async operation
  const loadItems = async () => {
    try {
      const items = await itemsOperation.execute(async ({ signal }) => {
        // The signal can be used for cancellation
        return await databaseService.getItems();
      });
      return items;
    } catch (error) {
      // Error is already handled by the hook
      console.error('Load items failed:', error);
    }
  };

  // Add item function using async operation
  const addItem = async (itemData) => {
    try {
      const result = await addItemOperation.execute(async ({ signal }) => {
        return await databaseService.addItem(itemData);
      }, {
        // Context data for success/error callbacks
        itemName: itemData.name,
        successMessage: `Item "${itemData.name}" added successfully`
      });
      return result;
    } catch (error) {
      console.error('Add item failed:', error);
    }
  };

  // Delete item function using async operation
  const deleteItem = async (itemId) => {
    try {
      const result = await deleteItemOperation.execute(async ({ signal }) => {
        return await databaseService.deleteItem(itemId);
      }, {
        itemId,
        successMessage: 'Item deleted successfully'
      });
      return result;
    } catch (error) {
      console.error('Delete item failed:', error);
    }
  };

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, []);

  // Example item data for demonstration
  const handleAddExampleItem = () => {
    const exampleItem = {
      id: `item-${Date.now()}`,
      name: `Example Item ${Date.now()}`,
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: 99.99,
      description: 'An example item created for demonstration'
    };
    addItem(exampleItem);
  };

  const handleDeleteFirstItem = () => {
    if (itemsOperation.data && itemsOperation.data.length > 0) {
      deleteItem(itemsOperation.data[0].id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Database Operations with useAsyncOperation</h2>
      
      {/* Loading States Display */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Loading States</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Items Loading</div>
            <div className={`text-lg font-bold ${itemsOperation.isLoading ? 'text-blue-600' : 'text-gray-400'}`}>
              {itemsOperation.isLoading ? 'Loading...' : 'Idle'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Add Item</div>
            <div className={`text-lg font-bold ${addItemOperation.isLoading ? 'text-green-600' : 'text-gray-400'}`}>
              {addItemOperation.isLoading ? 'Adding...' : 'Idle'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Delete Item</div>
            <div className={`text-lg font-bold ${deleteItemOperation.isLoading ? 'text-red-600' : 'text-gray-400'}`}>
              {deleteItemOperation.isLoading ? 'Deleting...' : 'Idle'}
            </div>
          </div>
        </div>
      </div>

      {/* Error States Display */}
      {(itemsOperation.hasError || addItemOperation.hasError || deleteItemOperation.hasError) && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Errors</h3>
          {itemsOperation.hasError && (
            <div className="text-red-700 mb-2">
              <strong>Items Load Error:</strong> {itemsOperation.error?.message}
              <button 
                onClick={() => itemsOperation.clearError()}
                className="ml-2 text-sm underline"
              >
                Clear
              </button>
            </div>
          )}
          {addItemOperation.hasError && (
            <div className="text-red-700 mb-2">
              <strong>Add Item Error:</strong> {addItemOperation.error?.message}
              <button 
                onClick={() => addItemOperation.clearError()}
                className="ml-2 text-sm underline"
              >
                Clear
              </button>
            </div>
          )}
          {deleteItemOperation.hasError && (
            <div className="text-red-700 mb-2">
              <strong>Delete Item Error:</strong> {deleteItemOperation.error?.message}
              <button 
                onClick={() => deleteItemOperation.clearError()}
                className="ml-2 text-sm underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={loadItems}
          disabled={itemsOperation.isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {itemsOperation.isLoading && <LoadingSpinner size="sm" />}
          Reload Items
        </button>
        
        <button
          onClick={handleAddExampleItem}
          disabled={addItemOperation.isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {addItemOperation.isLoading && <LoadingSpinner size="sm" />}
          Add Example Item
        </button>
        
        <button
          onClick={handleDeleteFirstItem}
          disabled={deleteItemOperation.isLoading || !itemsOperation.data?.length}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {deleteItemOperation.isLoading && <LoadingSpinner size="sm" />}
          Delete First Item
        </button>
      </div>

      {/* Retry Information */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">Retry Information</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium">Items Operation</div>
            <div>Retry Count: {itemsOperation.retryCount}</div>
            <div>Can Retry: {itemsOperation.canRetry ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="font-medium">Add Operation</div>
            <div>Retry Count: {addItemOperation.retryCount}</div>
            <div>Can Retry: {addItemOperation.canRetry ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="font-medium">Delete Operation</div>
            <div>Retry Count: {deleteItemOperation.retryCount}</div>
            <div>Can Retry: {deleteItemOperation.canRetry ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Items Data</h3>
        {itemsOperation.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2">Loading items...</span>
          </div>
        ) : itemsOperation.hasError ? (
          <div className="text-red-600 text-center py-8">
            Failed to load items. Please try again.
          </div>
        ) : itemsOperation.hasData ? (
          <div>
            <div className="text-sm text-gray-600 mb-2">
              Loaded {itemsOperation.data.length} items
            </div>
            <div className="max-h-64 overflow-y-auto">
              {itemsOperation.data.slice(0, 10).map((item, index) => (
                <div key={item.id || index} className="border-b border-gray-100 py-2">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.category} - ${item.unitPrice} per {item.unit}
                  </div>
                </div>
              ))}
              {itemsOperation.data.length > 10 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  ... and {itemsOperation.data.length - 10} more items
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No items loaded yet
          </div>
        )}
      </div>

      {/* Manual Operations */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Manual Operations</h3>
        <div className="flex gap-2">
          <button
            onClick={() => itemsOperation.cancel()}
            disabled={!itemsOperation.isLoading}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel Items Load
          </button>
          <button
            onClick={() => itemsOperation.reset()}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Reset Items State
          </button>
          <button
            onClick={() => {
              itemsOperation.clearError();
              addItemOperation.clearError();
              deleteItemOperation.clearError();
            }}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Clear All Errors
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseOperationExample;
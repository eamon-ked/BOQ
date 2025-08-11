import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Tag, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * BulkOperations component for performing operations on multiple selected items
 */
const BulkOperations = ({ 
  selectedItems = [], 
  availableOperations = [], 
  onOperation,
  maxBatchSize = 100,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOperation, setPendingOperation] = useState(null);
  const [operationProgress, setOperationProgress] = useState(null);

  // Default operations if none provided
  const defaultOperations = [
    {
      id: 'addToBOQ',
      label: 'Add to BOQ',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      requiresConfirmation: false,
      batchSize: 50
    },
    {
      id: 'bulkEdit',
      label: 'Bulk Edit',
      icon: Edit3,
      color: 'bg-green-600 hover:bg-green-700',
      requiresConfirmation: false,
      batchSize: 25
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresConfirmation: false,
      batchSize: 20
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'bg-red-600 hover:bg-red-700',
      requiresConfirmation: true,
      batchSize: 50
    }
  ];

  const operations = availableOperations.length > 0 ? availableOperations : defaultOperations;

  // Handle operation click
  const handleOperationClick = useCallback(async (operation) => {
    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }

    if (operation.requiresConfirmation) {
      setPendingOperation(operation);
      setShowConfirmDialog(true);
    } else {
      await executeOperation(operation);
    }
  }, [selectedItems]);

  // Execute the operation
  const executeOperation = useCallback(async (operation) => {
    if (!onOperation) {
      toast.error('No operation handler provided');
      return;
    }

    setIsProcessing(true);
    setOperationProgress({ current: 0, total: selectedItems.length });

    try {
      const batchSize = operation.batchSize || maxBatchSize;
      const batches = [];
      
      // Split items into batches
      for (let i = 0; i < selectedItems.length; i += batchSize) {
        batches.push(selectedItems.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const results = {
        successful: [],
        failed: []
      };

      // Process each batch
      for (const batch of batches) {
        try {
          const batchResult = await onOperation(operation.id, batch);
          
          if (batchResult && batchResult.successful) {
            results.successful.push(...batchResult.successful);
          } else {
            results.successful.push(...batch);
          }
          
          if (batchResult && batchResult.failed) {
            results.failed.push(...batchResult.failed);
          }
          
          processedCount += batch.length;
          setOperationProgress({ current: processedCount, total: selectedItems.length });
          
          // Small delay between batches to prevent overwhelming the system
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Batch operation failed:`, error);
          results.failed.push(...batch.map(item => ({ item, error: error.message })));
          processedCount += batch.length;
          setOperationProgress({ current: processedCount, total: selectedItems.length });
        }
      }

      // Show results
      const successCount = results.successful.length;
      const failCount = results.failed.length;

      if (successCount > 0 && failCount === 0) {
        toast.success(`${operation.label} completed successfully for ${successCount} items`, {
          duration: 4000,
          icon: '✅'
        });
      } else if (successCount > 0 && failCount > 0) {
        toast.success(`${operation.label} completed: ${successCount} successful, ${failCount} failed`, {
          duration: 5000,
          icon: '⚠️'
        });
      } else if (failCount > 0) {
        toast.error(`${operation.label} failed for all ${failCount} items`, {
          duration: 5000,
          icon: '❌'
        });
      }

    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error(`${operation.label} failed: ${error.message}`, {
        duration: 5000,
        icon: '❌'
      });
    } finally {
      setIsProcessing(false);
      setOperationProgress(null);
      setShowConfirmDialog(false);
      setPendingOperation(null);
    }
  }, [selectedItems, onOperation, maxBatchSize]);

  // Handle confirmation dialog
  const handleConfirm = useCallback(async () => {
    if (pendingOperation) {
      await executeOperation(pendingOperation);
    }
  }, [pendingOperation, executeOperation]);

  const handleCancel = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingOperation(null);
  }, []);

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Operations Toolbar */}
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-blue-500" />
              <span className="font-medium">{selectedItems.length}</span>
              <span>item{selectedItems.length !== 1 ? 's' : ''} selected</span>
            </div>
            
            {operationProgress && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 size={16} className="animate-spin" />
                <span>
                  Processing {operationProgress.current} of {operationProgress.total}...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {operations.map((operation) => {
              const IconComponent = operation.icon;
              return (
                <button
                  key={operation.id}
                  onClick={() => handleOperationClick(operation)}
                  disabled={isProcessing}
                  className={`
                    ${operation.color} text-white px-4 py-2 rounded-lg 
                    transition-all duration-200 flex items-center gap-2 text-sm font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:shadow-md transform hover:-translate-y-0.5
                  `}
                  title={`${operation.label} ${selectedItems.length} selected items`}
                >
                  <IconComponent size={16} />
                  {operation.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        {operationProgress && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(operationProgress.current / operationProgress.total) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm {pendingOperation.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to {pendingOperation.label.toLowerCase()} {selectedItems.length} selected item{selectedItems.length !== 1 ? 's' : ''}?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={`
                    px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50
                    ${pendingOperation.color}
                  `}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Confirm ${pendingOperation.label}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperations;
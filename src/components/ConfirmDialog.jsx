import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning, danger, info
  requiresTextConfirmation = false,
  confirmationText = "DELETE"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requiresTextConfirmation && inputValue !== confirmationText) {
      return;
    }
    
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '🚨',
          iconColor: 'text-red-500',
          buttonColor: 'bg-red-500 hover:bg-red-600',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconColor: 'text-yellow-500',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
          borderColor: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconColor: 'text-blue-500',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: '⚠️',
          iconColor: 'text-yellow-500',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const styles = getTypeStyles();
  const canConfirm = !requiresTextConfirmation || inputValue === confirmationText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border-2 ${styles.borderColor} transform transition-all duration-300`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            disabled={isConfirming}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            {typeof message === 'string' ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
            ) : (
              message
            )}
          </div>

          {requiresTextConfirmation && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{confirmationText}" to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
                  inputValue === confirmationText 
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:ring-2 focus:ring-opacity-50`}
                placeholder={confirmationText}
                disabled={isConfirming}
                autoFocus
              />
              {inputValue && inputValue !== confirmationText && (
                <p className="text-red-600 text-sm mt-1">
                  Please type "{confirmationText}" exactly as shown
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
              disabled={isConfirming}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || isConfirming}
              className={`px-4 py-2 text-white rounded-lg transition-all duration-200 font-medium ${
                canConfirm && !isConfirming
                  ? styles.buttonColor
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isConfirming ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
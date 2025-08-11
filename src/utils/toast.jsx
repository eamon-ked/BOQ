import toast from 'react-hot-toast';
import { SuccessToast, ErrorToast, InfoToast, WarningToast } from '../components/Toast/CustomToast';

/**
 * Toast utility functions with consistent API for different message types
 * Provides a centralized way to display notifications throughout the application
 */

// Default toast options
const defaultOptions = {
  duration: 4000,
  position: 'top-right',
};

/**
 * Display a success toast notification
 * @param {string} message - The success message to display
 * @param {object} options - Optional configuration for the toast
 * @returns {string} Toast ID for programmatic dismissal
 */
export const showSuccess = (message, options = {}) => {
  const config = { ...defaultOptions, duration: 3000, ...options };
  
  return toast.custom(
    (t) => (
      <SuccessToast 
        message={message} 
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    config
  );
};

/**
 * Display an error toast notification
 * @param {string} message - The error message to display
 * @param {object} options - Optional configuration for the toast
 * @returns {string} Toast ID for programmatic dismissal
 */
export const showError = (message, options = {}) => {
  const config = { ...defaultOptions, duration: 5000, ...options };
  
  return toast.custom(
    (t) => (
      <ErrorToast 
        message={message} 
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    config
  );
};

/**
 * Display an info toast notification
 * @param {string} message - The info message to display
 * @param {object} options - Optional configuration for the toast
 * @returns {string} Toast ID for programmatic dismissal
 */
export const showInfo = (message, options = {}) => {
  const config = { ...defaultOptions, ...options };
  
  return toast.custom(
    (t) => (
      <InfoToast 
        message={message} 
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    config
  );
};

/**
 * Display a warning toast notification
 * @param {string} message - The warning message to display
 * @param {object} options - Optional configuration for the toast
 * @returns {string} Toast ID for programmatic dismissal
 */
export const showWarning = (message, options = {}) => {
  const config = { ...defaultOptions, ...options };
  
  return toast.custom(
    (t) => (
      <WarningToast 
        message={message} 
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    config
  );
};

/**
 * Display a loading toast notification
 * @param {string} message - The loading message to display
 * @param {object} options - Optional configuration for the toast
 * @returns {string} Toast ID for programmatic dismissal
 */
export const showLoading = (message, options = {}) => {
  const config = { ...defaultOptions, duration: Infinity, ...options };
  return toast.loading(message, config);
};

/**
 * Handle promise-based operations with toast notifications
 * @param {Promise} promise - The promise to handle
 * @param {object} messages - Messages for different states
 * @param {object} options - Optional configuration for the toasts
 * @returns {Promise} The original promise
 */
export const showPromise = (promise, messages, options = {}) => {
  const config = { ...defaultOptions, ...options };
  
  const defaultMessages = {
    loading: 'Loading...',
    success: 'Operation completed successfully',
    error: 'Operation failed',
  };
  
  const toastMessages = { ...defaultMessages, ...messages };
  
  return toast.promise(promise, toastMessages, config);
};

/**
 * Dismiss a specific toast by ID
 * @param {string} toastId - The ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all active toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Update an existing toast with new content
 * @param {string} toastId - The ID of the toast to update
 * @param {string} message - The new message
 * @param {string} type - The new toast type ('success', 'error', 'info', 'warning')
 */
export const updateToast = (toastId, message, type = 'info') => {
  const toastFunctions = {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
  };
  
  toast.dismiss(toastId);
  return toastFunctions[type]?.(message) || showInfo(message);
};

/**
 * Utility object with all toast functions for easy importing
 */
export const toastUtils = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  promise: showPromise,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  update: updateToast,
};

// Default export for convenience
export default toastUtils;
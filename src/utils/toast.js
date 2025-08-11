import toast from 'react-hot-toast';

/**
 * Utility functions for consistent toast notifications across the application
 */

export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    icon: '✅',
    ...options,
  });
};

export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    icon: '❌',
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    icon: 'ℹ️',
    ...options,
  });
};

export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
    ...options,
  });
};

export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...options,
  });
};

export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(promise, messages, {
    success: { duration: 3000, icon: '✅' },
    error: { duration: 5000, icon: '❌' },
    loading: { icon: '⏳' },
    ...options,
  });
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

// Dismiss specific toast
export const dismiss = (toastId) => {
  toast.dismiss(toastId);
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  promise: showPromise,
  dismiss,
  dismissAll,
};
import React from 'react';
import { Toaster } from 'react-hot-toast';

/**
 * ToastContainer component that provides the toast notification system
 * Supports success, error, info, and warning variants with consistent styling
 */
const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
        },
        // Success toast styling
        success: {
          duration: 3000,
          style: {
            background: '#f0f9ff',
            color: '#0c4a6e',
            border: '1px solid #7dd3fc',
          },
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#f0f9ff',
          },
        },
        // Error toast styling
        error: {
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
        // Loading toast styling
        loading: {
          duration: Infinity,
          style: {
            background: '#f8fafc',
            color: '#475569',
            border: '1px solid #cbd5e1',
          },
          iconTheme: {
            primary: '#64748b',
            secondary: '#f8fafc',
          },
        },
      }}
    />
  );
};

export default ToastContainer;
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'default', 
  message = '', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  const spinnerSizes = {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48
  };

  const variantClasses = {
    default: 'text-blue-600',
    primary: 'text-indigo-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className={`${sizeClasses.xlarge} bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse`}>
            <Loader2 className="text-white animate-spin" size={spinnerSizes.xlarge} />
          </div>
          {message && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{message}</h2>
              <p className="text-gray-600">Please wait...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2">
        <Loader2 
          className={`animate-spin ${variantClasses[variant]}`} 
          size={spinnerSizes[size]} 
        />
        {message && (
          <span className={`text-sm font-medium ${variantClasses[variant]}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
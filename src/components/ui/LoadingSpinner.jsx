import React from 'react';

/**
 * LoadingSpinner component with different sizes and variants
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    white: 'text-white'
  };

  return (
    <div 
      className={`inline-block animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <svg 
        className="w-full h-full" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

/**
 * FullScreenLoader component for full-screen loading states
 */
export const FullScreenLoader = ({ 
  message = 'Loading...', 
  variant = 'primary',
  backdrop = true 
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backdrop ? 'bg-black bg-opacity-50' : ''}`}>
      <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center">
        <LoadingSpinner size="lg" variant={variant} />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

/**
 * InlineLoader component for inline loading states
 */
export const InlineLoader = ({ 
  message = 'Loading...', 
  size = 'sm',
  variant = 'primary',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={size} variant={variant} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({
  isLoading = false,
  message = 'Loading...',
  children,
  className = '',
  overlayClassName = '',
  spinnerSize = 'medium',
  blur = true
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className={`
          absolute inset-0 
          ${blur ? 'backdrop-blur-sm' : ''} 
          bg-white/80 
          flex items-center justify-center 
          z-10 
          ${overlayClassName}
        `}>
          <div className="text-center">
            <LoadingSpinner 
              size={spinnerSize} 
              message={message}
              variant="primary"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
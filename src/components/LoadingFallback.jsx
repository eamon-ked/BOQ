import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * Enhanced loading fallback component for lazy-loaded components
 * Provides a consistent and visually appealing loading experience
 */
const LoadingFallback = ({ 
  message = 'Loading...', 
  size = 'medium',
  overlay = false,
  variant = 'default'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const getLoadingIcon = () => {
    switch (variant) {
      case 'sparkles':
        return <Sparkles className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} />;
      case 'pulse':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        );
      case 'gradient':
        return (
          <div className={`${sizeClasses[size]} animate-spin`}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full"></div>
            </div>
          </div>
        );
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} />;
    }
  };

  const containerClasses = overlay 
    ? 'modal-backdrop'
    : 'flex items-center justify-center p-8';

  const contentClasses = overlay
    ? 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 animate-scaleIn'
    : '';

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className="flex flex-col items-center space-y-4 animate-fadeIn">
          {/* Enhanced loading icon */}
          <div className="mb-2">
            {getLoadingIcon()}
          </div>
          
          {/* Loading message */}
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium text-center">
            {message}
          </p>
          
          {/* Progress indicator */}
          <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Optional loading dots */}
          {variant === 'dots' && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping"></div>
              <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
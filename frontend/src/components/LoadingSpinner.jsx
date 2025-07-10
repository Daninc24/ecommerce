import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-orange-600`}></div>
      {text && (
        <p className={`mt-2 text-gray-600 ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Full page loading spinner
export const FullPageSpinner = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// Inline loading spinner
export const InlineSpinner = ({ size = 'sm', className = '' }) => (
  <LoadingSpinner size={size} text="" className={className} />
);

// Button loading spinner
export const ButtonSpinner = ({ size = 'sm' }) => (
  <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} animate-spin rounded-full border-2 border-white border-t-transparent`}></div>
);

export default LoadingSpinner; 
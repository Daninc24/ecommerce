import React from 'react';

const IconWrapper = ({ icon: Icon, className = "h-6 w-6", fallback = null, ...props }) => {
  if (!Icon) {
    return fallback || <div className={`${className} bg-gray-300 rounded`} />;
  }

  return <Icon className={className} {...props} />;
};

export default IconWrapper; 
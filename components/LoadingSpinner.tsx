import React from 'react';

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = 'w-8 h-8' }) => {
  return (
    <div className={`animate-spin rounded-full ${size} border-t-4 border-b-4 border-teal-500 dark:border-teal-400 border-r-4 border-l-4 border-r-transparent border-l-transparent`}></div>
  );
};

export default LoadingSpinner;
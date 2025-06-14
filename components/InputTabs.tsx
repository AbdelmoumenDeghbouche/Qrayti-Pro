import React from 'react';
import { InputType } from '../types';

interface InputTabsProps {
  activeInputType: InputType;
  onTabChange: (type: InputType) => void;
}

const InputTabs: React.FC<InputTabsProps> = ({ activeInputType, onTabChange }) => {
  const getTabStyle = (isActive: boolean) =>
    `px-5 sm:px-8 py-4 font-semibold text-lg sm:text-xl focus:outline-none transition-all duration-300 ease-in-out -mb-px 
     ${isActive 
        ? 'border-b-4 border-teal-500 dark:border-teal-400 text-teal-600 dark:text-teal-300' 
        : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 hover:border-slate-300 dark:hover:border-slate-600'
      }`;

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8 sm:mb-10">
      <button
        onClick={() => onTabChange('image')}
        className={getTabStyle(activeInputType === 'image')}
        aria-pressed={activeInputType === 'image'}
      >
        رفع الصور
      </button>
      <button
        onClick={() => onTabChange('text')}
        className={getTabStyle(activeInputType === 'text')}
        aria-pressed={activeInputType === 'text'}
      >
        لصق النص
      </button>
    </div>
  );
};

export default InputTabs;
import React from 'react';
import { ActiveResultTab } from '../types';

interface ResultTabsProps {
  activeTab: ActiveResultTab;
  onTabChange: (tab: ActiveResultTab) => void;
  disabled: boolean;
}

const tabOptions: { key: ActiveResultTab; label: string }[] = [
  { key: 'summary', label: 'الملخص' },
  { key: 'explanation', label: 'الشرح' },
  { key: 'quiz', label: 'الاختبار' },
  { key: 'flashcards', label: 'البطاقات التعليمية' },
  { key: 'mindmap', label: 'الخريطة الذهنية' },
];

const ResultTabs: React.FC<ResultTabsProps> = ({ activeTab, onTabChange, disabled }) => {
  const getTabStyle = (isActive: boolean) =>
    `px-4 sm:px-6 py-4 font-semibold text-lg sm:text-xl focus:outline-none transition-all duration-300 ease-in-out whitespace-nowrap -mb-px 
     ${isActive 
        ? 'border-b-4 border-teal-500 dark:border-teal-400 text-teal-600 dark:text-teal-300' 
        : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 hover:border-slate-300 dark:hover:border-slate-600'
      }
     ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`;

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-1 sm:space-x-2 overflow-x-auto pb-px"> {/* pb-px to prevent border cutoff on overflow */}
      {tabOptions.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !disabled && onTabChange(tab.key)}
          className={getTabStyle(activeTab === tab.key)}
          disabled={disabled}
          aria-pressed={activeTab === tab.key}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ResultTabs;
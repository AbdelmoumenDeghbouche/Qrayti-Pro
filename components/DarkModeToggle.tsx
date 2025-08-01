import React from 'react';

interface DarkModeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

export default DarkModeToggle;
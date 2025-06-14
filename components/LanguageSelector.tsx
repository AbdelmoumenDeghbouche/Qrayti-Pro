import React from 'react';

export interface LanguageOption {
  value: string; // Used as key and for display if label not enough
  label: string; // Displayed in dropdown
  code: string;  // BCP 47 code for TTS
}

export const LANGUAGES: LanguageOption[] = [
  { value: 'English', label: 'English', code: 'en-US' },
  { value: 'Spanish', label: 'Español (Spanish)', code: 'es-ES' },
  { value: 'French', label: 'Français (French)', code: 'fr-FR' },
  { value: 'German', label: 'Deutsch (German)', code: 'de-DE' },
  { value: 'Arabic', label: 'العربية (Arabic)', code: 'ar-SA' },
  { value: 'Chinese', label: '中文 (简体) (Chinese Simplified)', code: 'zh-CN' },
  { value: 'Japanese', label: '日本語 (Japanese)', code: 'ja-JP' },
  { value: 'Hindi', label: 'हिन्दी (Hindi)', code: 'hi-IN' },
  { value: 'Russian', label: 'Русский (Russian)', code: 'ru-RU' },
  { value: 'Italian', label: 'Italiano (Italian)', code: 'it-IT' },
  // Add more languages as needed
];

interface LanguageSelectorProps {
  selectedLanguage: string; // This is the 'value' from LanguageOption
  onLanguageChange: (languageValue: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="language-select" className="block text-xl font-medium text-slate-700 dark:text-slate-300">
        اختر لغة النتائج
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="block w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-teal-500 dark:focus:border-teal-500 text-lg sm:text-xl transition-colors bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        aria-label="Select output language for generated content"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value} className="py-2.5 text-lg dark:bg-slate-800 dark:text-slate-200">
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
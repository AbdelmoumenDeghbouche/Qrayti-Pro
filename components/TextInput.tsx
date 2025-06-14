import React from 'react';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ text, onTextChange }) => {
  return (
    <div className="space-y-3">
      <label htmlFor="text-input" className="block text-xl font-medium text-slate-700 dark:text-slate-300">
        الصق أو اكتب محتوى الدرس هنا
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={10}
        placeholder="ابدأ بالكتابة أو الصق نص الدرس من مستنداتك..."
        className="block w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-teal-500 dark:focus:border-teal-500 text-lg sm:text-xl transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
      />
      <p className="text-lg text-slate-500 dark:text-slate-400">
        نصيحة: انسخ والصق النص من مواد الدرس الخاصة بك (مثل PDF أو مستند) لتحليل سريع ودقيق.
      </p>
    </div>
  );
};

export default TextInput;
import React from 'react';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-rose-50 dark:bg-rose-900/50 border-l-4 border-rose-500 dark:border-rose-700/70 text-rose-700 dark:text-rose-300 p-5 my-8 rounded-lg shadow-md dark:shadow-rose-900/30" role="alert"> {/* Increased rounding and padding */}
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-7 w-7 text-rose-500 dark:text-rose-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-.002-5c-.552 0-1-.447-1-1V8c0-.553.448-1 1-1s1 .447 1 1v4c0 .553-.448 1-1 1zm0-6c-.552 0-1-.447-1-1V5c0-.553.448-1 1-1s1 .447 1 1v1c0 .553-.448 1-1 1z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-xl text-rose-800 dark:text-rose-200">عفوًا، حدث خطأ:</p> {/* Updated text color and size */}
          <p className="text-lg whitespace-pre-wrap mt-1 text-rose-700 dark:text-rose-300">{message}</p> {/* Updated text color and size */}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
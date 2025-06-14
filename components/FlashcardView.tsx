import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { downloadContentAsPdf } from '../utils/downloadUtils';

interface FlashcardViewProps {
  flashcards: Flashcard[] | null;
  isLoading: boolean;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcards, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flashcardContentId = "flashcards-content-area";

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (flashcards && currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleDownloadFlashcards = () => {
    const container = document.createElement('div');
    container.id = flashcardContentId + "-printable";
    // Check if current theme is dark to apply appropriate PDF styling
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    container.style.padding = '25px'; 
    container.style.fontFamily = 'Inter, Arial, sans-serif';
    // Base PDF styling should be light for printability
    // container.style.backgroundColor = isDarkMode ? '#1e293b' : '#ffffff'; // slate-800 or white
    // container.style.color = isDarkMode ? '#e2e8f0' : '#1e293b'; // slate-200 or slate-800

    const titleElement = document.createElement('h2');
    titleElement.innerText = "البطاقات التعليمية التفاعلية";
    titleElement.style.textAlign = 'center';
    titleElement.style.fontSize = '30px'; 
    titleElement.style.fontWeight = '700'; // bolder
    titleElement.style.color = '#1e293b'; // slate-800, fixed for PDF
    titleElement.style.marginBottom = '35px';
    container.appendChild(titleElement);

    flashcards?.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.style.border = '1.5px solid #cbd5e1'; // slate-300
      cardElement.style.borderRadius = '16px'; // rounded-2xl
      cardElement.style.padding = '30px'; 
      cardElement.style.marginBottom = '30px'; 
      cardElement.style.backgroundColor = '#f8fafc'; // slate-50, fixed for PDF
      cardElement.style.pageBreakInside = 'avoid'; 
      cardElement.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)';


      const frontElement = document.createElement('div');
      frontElement.style.marginBottom = '20px';
      frontElement.innerHTML = `<strong style="color: #0f766e; font-size: 1.5em; display: block; margin-bottom: 8px;">الوجه (${index + 1}):</strong><p style="margin-top: 10px; white-space: pre-wrap; color: #334155; line-height: 1.75; font-size: 1.25em;">${card.front}</p>`;
      
      const backElement = document.createElement('div');
      backElement.innerHTML = `<strong style="color: #0369a1; font-size: 1.5em; display: block; margin-bottom: 8px;">الخلف (${index + 1}):</strong><p style="margin-top: 10px; white-space: pre-wrap; color: #334155; line-height: 1.75; font-size: 1.25em;">${card.back}</p>`;
      
      cardElement.appendChild(frontElement);
      cardElement.appendChild(backElement);
      container.appendChild(cardElement);
    });
    
    document.body.appendChild(container);
    downloadContentAsPdf(container.id, "Flashcards", "البطاقات التعليمية التفاعلية")
      .finally(() => {
         if (document.body.contains(container)) {
            document.body.removeChild(container);
         }
      });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[350px] flex items-center justify-center">
        <LoadingSpinner size="w-14 h-14" />
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[350px] flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 italic text-xl">ستظهر البطاقات السحرية هنا عند الطلب!</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100">بطاقاتك التعليمية</h3>
        {flashcards && flashcards.length > 0 && !isLoading && (
          <button
            onClick={handleDownloadFlashcards}
            className="px-6 py-3 text-lg font-semibold text-white bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-all duration-200 ease-in-out flex items-center space-x-2.5 transform hover:scale-105"
            aria-label="تحميل البطاقات التعليمية كملف PDF"
          >
            <span role="img" aria-hidden="true" className="text-2xl">📄</span>
            <span>تحميل PDF</span>
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <div 
          id={flashcardContentId}
          className="w-full max-w-xl h-80 sm:h-96 p-1 sm:p-1.5 bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-500 dark:from-sky-700 dark:via-cyan-700 dark:to-teal-700 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center cursor-pointer transition-transform duration-700 ease-in-out group"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-live="polite"
          onKeyPress={(e) => e.key === ' ' || e.key === 'Enter' ? handleFlip() : null}
          style={{ perspective: '1500px' }} 
        >
          <div 
            className="relative w-full h-full transition-transform duration-700 ease-in-out"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front of the card */}
            <div className="absolute w-full h-full p-6 sm:p-8 flex justify-center items-center bg-white dark:bg-slate-700/80 rounded-[calc(0.9rem)] shadow-inner whitespace-pre-wrap overflow-y-auto" style={{ backfaceVisibility: 'hidden' }}>
              <p className="text-slate-800 dark:text-slate-100 text-2xl sm:text-3xl lg:text-4xl font-semibold">{currentCard.front}</p>
            </div>
            {/* Back of the card */}
            <div className="absolute w-full h-full p-6 sm:p-8 flex justify-center items-center bg-white dark:bg-slate-700/80 rounded-[calc(0.9rem)] shadow-inner whitespace-pre-wrap overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <p className="text-slate-700 dark:text-slate-200 text-xl sm:text-2xl lg:text-3xl leading-relaxed">{currentCard.back}</p>
            </div>
          </div>
        </div>
        <button
            onClick={handleFlip}
            className="mt-8 px-8 py-3.5 text-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 dark:from-teal-600 dark:to-sky-600 dark:hover:from-teal-700 dark:hover:to-sky-700 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
            {isFlipped ? 'أظهر السؤال' : 'أظهر الإجابة'} 
            <span role="img" aria-label="flip" className="ml-2 text-xl">🔄</span>
        </button>

        <div className="flex items-center justify-between w-full max-w-lg mt-10">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-3 text-lg font-medium text-white bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-xl shadow-md disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 transform hover:scale-105 disabled:transform-none"
          >
            &larr; السابق
          </button>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
            البطاقة {currentIndex + 1} / {flashcards.length}
          </p>
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="px-6 py-3 text-lg font-medium text-white bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-xl shadow-md disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 transform hover:scale-105 disabled:transform-none"
          >
            التالي &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardView;
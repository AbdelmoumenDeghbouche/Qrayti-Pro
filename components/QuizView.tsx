import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { downloadContentAsPdf } from '../utils/downloadUtils';

interface QuizViewProps {
  questions: QuizQuestion[] | null;
  isLoading: boolean;
}

const QuizView: React.FC<QuizViewProps> = ({ questions: initialQuestions, isLoading }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState<boolean[]>([]);
  const quizContentId = "quiz-content-area";

  useEffect(() => {
    if (initialQuestions) {
      setQuestions(initialQuestions.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined })));
      setShowAnswers(new Array(initialQuestions.length).fill(false));
    } else {
      setQuestions([]);
      setShowAnswers([]);
    }
  }, [initialQuestions]);

  const handleOptionSelect = (questionIndex: number, option: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].userAnswer = option;
    newQuestions[questionIndex].isCorrect = option === newQuestions[questionIndex].correctAnswer;
    setQuestions(newQuestions);
  };

  const toggleShowAnswer = (questionIndex: number) => {
    const newShowAnswers = [...showAnswers];
    newShowAnswers[questionIndex] = !newShowAnswers[questionIndex];
    setShowAnswers(newShowAnswers);
  };
  
  const getOptionClasses = (question: QuizQuestion, option: string, qIndex: number) => {
    let baseClasses = "w-full text-left p-4 border rounded-xl transition-all duration-200 ease-in-out flex items-center space-x-4 text-slate-700 dark:text-slate-300 text-lg sm:text-xl ";
    const isSelected = question.userAnswer === option;
    const isRevealed = showAnswers[qIndex];

    if (isSelected && !isRevealed) { 
      baseClasses += question.isCorrect 
        ? "bg-emerald-50 dark:bg-emerald-700/30 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-600 text-emerald-700 dark:text-emerald-200 " 
        : "bg-rose-50 dark:bg-rose-700/30 border-rose-400 dark:border-rose-500 ring-2 ring-rose-300 dark:ring-rose-600 text-rose-700 dark:text-rose-200 ";
    } else if (isRevealed) { 
        if (option === question.correctAnswer) {
            baseClasses += "bg-emerald-100 dark:bg-emerald-600/40 border-emerald-500 dark:border-emerald-400 text-emerald-800 dark:text-emerald-100 font-semibold ring-2 ring-emerald-500 dark:ring-emerald-400 ";
        } else if (isSelected && option !== question.correctAnswer) { 
            baseClasses += "bg-rose-100 dark:bg-rose-600/40 border-rose-500 dark:border-rose-400 text-rose-800 dark:text-rose-100 ring-2 ring-rose-500 dark:ring-rose-400 ";
        } else { 
            baseClasses += "border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/40 opacity-70 dark:opacity-60 ";
        }
    } else { 
      baseClasses += "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-700/40 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm ";
    }
    
    if (isRevealed || question.userAnswer) {
        baseClasses += "cursor-default ";
    } else {
        baseClasses += "cursor-pointer ";
    }
    return baseClasses;
  };

  const getOptionLetterClasses = (question: QuizQuestion, option: string, qIndex: number) => {
    let letterClasses = "w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-bold flex-shrink-0 transition-all duration-200 ";
    const isSelected = question.userAnswer === option;
    const isRevealed = showAnswers[qIndex];

    if (isSelected && !isRevealed) {
        letterClasses += question.isCorrect 
            ? "bg-emerald-500 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-500 " 
            : "bg-rose-500 border-rose-600 text-white dark:bg-rose-600 dark:border-rose-500 ";
    } else if (isRevealed) {
        if (option === question.correctAnswer) {
            letterClasses += "bg-emerald-600 border-emerald-700 text-white dark:bg-emerald-500 dark:border-emerald-400 ";
        } else if (isSelected && option !== question.correctAnswer) {
            letterClasses += "bg-rose-600 border-rose-700 text-white dark:bg-rose-500 dark:border-rose-400 ";
        } else {
            letterClasses += "border-slate-400 dark:border-slate-500 text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 opacity-70 dark:opacity-60 ";
        }
    } else {
        letterClasses += "border-slate-400 dark:border-slate-500 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-600 group-hover:bg-sky-100 dark:group-hover:bg-sky-600/50 group-hover:border-sky-500 dark:group-hover:border-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 ";
    }
    return letterClasses;
  };


  const handleDownloadQuiz = () => {
    downloadContentAsPdf(quizContentId, "Quiz", "الاختبار");
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[300px] flex items-center justify-center">
        <LoadingSpinner size="w-14 h-14" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[300px] flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 italic text-xl">الاختبار السحري سيظهر هنا عند الطلب!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100">اختبر معلوماتك!</h3>
        {questions && questions.length > 0 && !isLoading && (
          <button
            onClick={handleDownloadQuiz}
            className="px-6 py-3 text-lg font-semibold text-white bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-all duration-200 ease-in-out flex items-center space-x-2.5 transform hover:scale-105"
            aria-label="تحميل الاختبار كملف PDF"
          >
            <span role="img" aria-hidden="true" className="text-2xl">📄</span>
            <span>تحميل PDF</span>
          </button>
        )}
      </div>
      <div id={quizContentId} className="space-y-12">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="p-6 border border-slate-200 dark:border-slate-600/80 rounded-2xl shadow-lg bg-slate-50/70 dark:bg-slate-700/60">
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-6 text-xl sm:text-2xl">{qIndex + 1}. {q.question}</p>
            <div className="space-y-4">
              {q.options.map((option, oIndex) => (
                <button
                  key={oIndex}
                  onClick={() => handleOptionSelect(qIndex, option)}
                  className={`${getOptionClasses(q, option, qIndex)} group`}
                  disabled={showAnswers[qIndex] || !!q.userAnswer}
                >
                  <span className={getOptionLetterClasses(q, option, qIndex)}>
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <span className="flex-grow text-left">{option}</span>
                  {showAnswers[qIndex] && option === q.correctAnswer && q.userAnswer !== option && (
                     <span className="text-emerald-600 dark:text-emerald-400 text-base font-semibold ml-auto">(الإجابة الصحيحة)</span>
                  )}
                   {showAnswers[qIndex] && option === q.userAnswer && option !== q.correctAnswer && (
                     <span className="text-rose-600 dark:text-rose-400 text-base font-semibold ml-auto">(إجابتك)</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-8 text-right">
              <button
                onClick={() => toggleShowAnswer(qIndex)}
                className="text-lg text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200 font-medium py-2 px-5 rounded-lg bg-sky-100 dark:bg-sky-700/30 hover:bg-sky-200 dark:hover:bg-sky-600/40 transition-colors duration-150 transform hover:scale-105"
              >
                {showAnswers[qIndex] ? 'أخفِ' : 'أظهر'} الإجابة
              </button>
              {showAnswers[qIndex] && (
                <div className={`mt-4 text-lg p-4 rounded-lg text-right border dark:border-slate-600
                  ${q.correctAnswer === q.userAnswer && q.userAnswer !== undefined ? 'bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500' : 
                   (q.userAnswer === undefined ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200' : 'bg-rose-50 dark:bg-slate-700 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500')}`}>
                  <p className="font-semibold">الإجابة الصحيحة: <span className="font-bold text-emerald-700 dark:text-emerald-300">{q.correctAnswer}</span></p>
                  {q.userAnswer !== undefined && q.userAnswer !== q.correctAnswer && (
                      <p className="mt-1">إجابتك: <span className="font-bold text-rose-700 dark:text-rose-300">{q.userAnswer}</span></p>
                  )}
                   {q.userAnswer !== undefined && q.userAnswer === q.correctAnswer && (
                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-300">أحسنت، إجابة صحيحة!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizView;
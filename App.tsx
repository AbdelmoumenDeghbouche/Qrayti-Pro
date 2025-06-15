

import React, { useState, useCallback, useEffect } from 'react';
import { InputType, ActiveResultTab, QuizQuestion, GeneratedContent, LoadingStates, Flashcard } from './types';
import { Part } from "@google/genai";
import * as geminiService from './services/geminiService';
import InputTabs from './components/InputTabs';
import ImageUpload from './components/ImageUpload';
import TextInput from './components/TextInput';
import ResultTabs from './components/ResultTabs';
import ContentDisplayCard from './components/ContentDisplayCard';
import QuizView from './components/QuizView';
import FlashcardView from './components/FlashcardView';
import MindMapView from './components/MindMapView'; // Import the new MindMapView
import ErrorMessage from './components/ErrorMessage';
import LoadingSpinner from './components/LoadingSpinner';
import LanguageSelector, { LANGUAGES } from './components/LanguageSelector';
import * as ttsService from './services/ttsService'; 
import DarkModeToggle from './components/DarkModeToggle'; // Import DarkModeToggle

// Helper to convert base64 Data URL to Gemini Part
const fileToGenerativePart = (dataUrl: string, mimeType: string): Part => {
  return {
    inlineData: {
      data: dataUrl.split(',')[1], // Remove the "data:mime/type;base64," prefix
      mimeType
    }
  };
};

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light'); // Default to light

  // Effect 1: Initialize theme from localStorage/system preference (runs once on mount)
  useEffect(() => {
    console.log("Theme Init: Starting theme initialization...");
    let determinedTheme: Theme = 'light'; // Ultimate default
    const LStheme = localStorage.getItem('theme');
    console.log(`Theme Init: localStorage 'theme' value: "${LStheme}"`);

    if (LStheme === 'dark') {
      determinedTheme = 'dark';
      console.log(`Theme Init: Using 'dark' from localStorage.`);
    } else if (LStheme === 'light') {
      determinedTheme = 'light';
      console.log(`Theme Init: Using 'light' from localStorage.`);
    } else {
      // No valid theme in localStorage (either null or an invalid string)
      if (LStheme) { // If there was an invalid string
        console.warn(`Theme Init: Invalid theme value "${LStheme}" in localStorage. Removing it.`);
        localStorage.removeItem('theme');
      }
      
      const prefersDarkQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      const systemPrefersDark = prefersDarkQuery.matches;
      console.log(`Theme Init: System prefers dark mode: ${systemPrefersDark}`);
      
      if (systemPrefersDark) {
        determinedTheme = 'dark';
        console.log(`Theme Init: No valid localStorage theme. Using system preference: 'dark'.`);
      } else {
        determinedTheme = 'light';
        console.log(`Theme Init: No valid localStorage theme, system doesn't prefer dark. Defaulting to 'light'.`);
      }
    }
    
    setTheme(determinedTheme);
    console.log(`Theme Init: Final determined theme set to: ${determinedTheme}`);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Effect 2: Apply theme to HTML and save to localStorage (runs when theme state changes)
  useEffect(() => {
    console.log(`Theme Apply: Theme state changed to: ${theme}. Applying to HTML and localStorage.`);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    console.log(`Theme Apply: Current <html> classList: ${document.documentElement.classList.toString()}`);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log(`ToggleTheme: Changing theme from ${prevTheme} to ${newTheme}`);
      return newTheme;
    });
  };
  
  const [inputType, setInputType] = useState<InputType>('image');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('en-US'); // BCP 47 code

  const [activeResultTab, setActiveResultTab] = useState<ActiveResultTab>('summary');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({
    summary: '',
    explanation: '',
    quiz: [],
    mindMap: '',
    flashcards: [],
  });
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    generating: false, summary: false, explanation: false, quiz: false, mindMap: false, flashcards: false,
  });
  const [error, setError] = useState<string | null>(null);

  const resetResults = () => {
    setGeneratedContent({ summary: '', explanation: '', quiz: [], mindMap: '', flashcards: [] });
    setError(null);
    ttsService.stopGeneratingSpeech();
  };

  const handleImagesChange = useCallback((files: File[], dataUrls: string[]) => {
    setUploadedFiles(files);
    setImageUrls(dataUrls);
    resetResults();
  }, []);

  const handleClearImages = useCallback(() => {
    setUploadedFiles([]);
    setImageUrls([]);
    resetResults();
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if(uploadedFiles.length > 0 || imageUrls.length > 0) { 
        setUploadedFiles([]);
        setImageUrls([]);
    }
    resetResults();
  }, [uploadedFiles, imageUrls]);

  const handleInputTabChange = (type: InputType) => {
    setInputType(type);
    resetResults(); 
    if (type === 'text') {
        setUploadedFiles([]);
        setImageUrls([]);
    } else {
        setInputText('');
    }
    ttsService.stopGeneratingSpeech();
  };

  const handleLanguageChange = (languageValue: string) => {
    setSelectedLanguage(languageValue);
    // Language code update will be handled by the useEffect below
  };

  useEffect(() => {
    const langOption = LANGUAGES.find(l => l.value === selectedLanguage);
    if (langOption) {
      setSelectedLanguageCode(langOption.code);
    }
  }, [selectedLanguage]);

  const processContent = useCallback(async () => {
    setError(null);
    ttsService.stopGeneratingSpeech();
    let currentContentInput: string | Part[] | null = null;

    if (inputType === 'image' && uploadedFiles.length > 0 && imageUrls.length > 0) {
      currentContentInput = uploadedFiles.map((file, index) => 
        fileToGenerativePart(imageUrls[index], file.type)
      );
    } else if (inputType === 'text' && inputText.trim()) {
      currentContentInput = inputText.trim();
    } else {
      setError("Please upload image(s) or enter some text content.");
      return;
    }

    if (!currentContentInput || (Array.isArray(currentContentInput) && currentContentInput.length === 0)) {
        setError("No content provided to process.");
        return;
    }

    setLoadingStates({ generating: true, summary: true, explanation: true, quiz: true, mindMap: true, flashcards: true });
    setGeneratedContent({ summary: '', explanation: '', quiz: [], mindMap: '', flashcards: [] });


    try {
      const summary = await geminiService.generateSummary(currentContentInput, selectedLanguage);
      setGeneratedContent(prev => ({ ...prev, summary }));
    } catch (e: any) {
      setError(prev => prev ? `${prev}\nSummary failed: ${e.message}` : `Summary failed: ${e.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }

    try {
      const explanation = await geminiService.generateExplanation(currentContentInput, selectedLanguage);
      setGeneratedContent(prev => ({ ...prev, explanation }));
    } catch (e: any) {
      setError(prev => prev ? `${prev}\nExplanation failed: ${e.message}` : `Explanation failed: ${e.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, explanation: false }));
    }

    try {
      const quiz = await geminiService.generateQuiz(currentContentInput, selectedLanguage);
      setGeneratedContent(prev => ({ ...prev, quiz }));
    } catch (e: any) {
      setError(prev => prev ? `${prev}\nQuiz generation failed: ${e.message}` : `Quiz generation failed: ${e.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, quiz: false }));
    }
    
    try {
      const flashcards = await geminiService.generateFlashcards(currentContentInput, selectedLanguage);
      setGeneratedContent(prev => ({ ...prev, flashcards }));
    } catch (e: any) {
      setError(prev => prev ? `${prev}\nFlashcard generation failed: ${e.message}` : `Flashcard generation failed: ${e.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, flashcards: false }));
    }

    try {
      const mindMap = await geminiService.generateMindMap(currentContentInput, selectedLanguage);
      setGeneratedContent(prev => ({ ...prev, mindMap }));
    } catch (e: any) {
      setError(prev => prev ? `${prev}\nMind map generation failed: ${e.message}` : `Mind map generation failed: ${e.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, mindMap: false }));
    }

  }, [inputType, uploadedFiles, imageUrls, inputText, selectedLanguage]);

  useEffect(() => {
    if (!loadingStates.summary && !loadingStates.explanation && !loadingStates.quiz && !loadingStates.mindMap && !loadingStates.flashcards) {
      setLoadingStates(prev => ({ ...prev, generating: false }));
    }
  }, [loadingStates.summary, loadingStates.explanation, loadingStates.quiz, loadingStates.mindMap, loadingStates.flashcards]);


  const canGenerate = (inputType === 'image' && uploadedFiles.length > 0) || (inputType === 'text' && inputText.trim().length > 0);

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 text-center relative">
          <div className="absolute top-0 right-0 pt-2 pr-2 sm:pt-0 sm:pr-0"> {/* Adjusted padding for mobile */}
             <DarkModeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <img 
            src="https://iili.io/FBxH7cl.png" 
            alt="شعار قرايتي برو" 
            className="mx-auto h-40 w-auto mb-6" 
          />
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-500 to-cyan-400 dark:from-teal-300 dark:via-sky-400 dark:to-cyan-300 pb-2">
            قرايتي برو
          </h1>
          <p className="mt-5 text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            درس تاع ساعة تفهمو في دقيقة
          </p>
        </header>

        <section className="bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-2xl shadow-xl mb-16 dark:border dark:border-slate-700/50">
          <InputTabs activeInputType={inputType} onTabChange={handleInputTabChange} />
          {inputType === 'image' ? (
            <ImageUpload 
              onImagesChange={handleImagesChange} 
              currentImageUrls={imageUrls}
              onClearImages={handleClearImages} 
            />
          ) : (
            <TextInput text={inputText} onTextChange={handleTextChange} />
          )}

          <div className="mt-10">
            <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={handleLanguageChange} />
          </div>
          
          <button
            onClick={processContent}
            disabled={!canGenerate || loadingStates.generating}
            className="mt-10 w-full flex items-center justify-center px-8 py-4 border border-transparent text-xl font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-700 dark:hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:from-slate-400 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105"
            aria-live="polite"
          >
            {loadingStates.generating ? (
              <>
                <LoadingSpinner size="w-7 h-7 mr-3" />
                لحظات ونُنشئ لك الفهم...
              </>
            ) : (
              <>
                <span role="img" aria-label="magic wand" className="mr-2 text-2xl">✨</span>
                حوّل دروسك إلى معرفة!
              </>
            )}
          </button>
          <ErrorMessage message={error} />
        </section>
        
        {(generatedContent.summary || generatedContent.explanation || generatedContent.quiz.length > 0 || generatedContent.flashcards.length > 0 || generatedContent.mindMap || loadingStates.generating) && (
          <section className="mt-16">
             <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center">نتائج التحليل</h2>
            <ResultTabs 
                activeTab={activeResultTab} 
                onTabChange={(tab) => { setActiveResultTab(tab); ttsService.stopGeneratingSpeech();}} 
                disabled={loadingStates.generating && !Object.values(generatedContent).some(v => Array.isArray(v) ? v.length > 0 : !!v)} 
            />
            <div className="mt-4">
              {activeResultTab === 'summary' && (
                <ContentDisplayCard 
                  title="الملخص" 
                  content={generatedContent.summary} 
                  isLoading={loadingStates.summary} 
                  elementId="summary-content" 
                />
              )}
              {activeResultTab === 'explanation' && (
                <ContentDisplayCard 
                  title="الشرح" 
                  content={generatedContent.explanation} 
                  isLoading={loadingStates.explanation} 
                  elementId="explanation-content"
                  languageCode={selectedLanguageCode}
                />
              )}
              {activeResultTab === 'quiz' && (
                <QuizView questions={generatedContent.quiz} isLoading={loadingStates.quiz} />
              )}
              {activeResultTab === 'flashcards' && (
                <FlashcardView flashcards={generatedContent.flashcards} isLoading={loadingStates.flashcards} />
              )}
              {activeResultTab === 'mindmap' && (
                <MindMapView 
                  title="الخريطة الذهنية"
                  mindMapText={generatedContent.mindMap}
                  isLoading={loadingStates.mindMap}
                />
              )}
            </div>
          </section>
        )}
         <footer className="mt-20 py-10 border-t border-slate-200 dark:border-slate-700/50 text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg">&copy; {new Date().getFullYear()} قرايتي برو. كل الإبداع يبدأ بفهم أعمق.</p>


        </footer>
      </div>
    </div>
  );
};

export default App;
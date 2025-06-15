import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { downloadContentAsPdf } from '../utils/downloadUtils';
import * as ttsService from '../services/ttsService';

interface ContentDisplayCardProps {
  title: string;
  content: string | null;
  isLoading: boolean;
  elementId: string;
  languageCode?: string; 
}

const ContentDisplayCard: React.FC<ContentDisplayCardProps> = ({ title, content, isLoading, elementId, languageCode }) => {
  const [isSpeechOperationActive, setIsSpeechOperationActive] = useState(false);
  const [isPausedByApp, setIsPausedByApp] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [audioDownloadError, setAudioDownloadError] = useState<string | null>(null);
  
  // Voice loading state
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  const prevContentRef = useRef(content);
  const prevTitleRef = useRef(title);
  const prevLanguageCodeRef = useRef(languageCode);
  const voiceCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check and load voices
  const checkVoicesAvailability = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return false;
    }

    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices.length, voices.map(v => `${v.name} (${v.lang})`));
    
    if (voices.length > 0) {
      setVoicesLoaded(true);
      setIsLoadingVoices(false);
      return true;
    }
    return false;
  };

  // Wait for voices to load
  const waitForVoices = () => {
    if (checkVoicesAvailability()) {
      return;
    }

    setIsLoadingVoices(true);
    
    // Set up voice loading listener
    const handleVoicesChanged = () => {
      if (checkVoicesAvailability()) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Fallback timeout for voice loading
    voiceCheckTimeoutRef.current = setTimeout(() => {
      setIsLoadingVoices(false);
      if (!voicesLoaded) {
        console.warn('Voices did not load within timeout period');
        // Still allow TTS to proceed, it might work anyway
        setVoicesLoaded(true);
      }
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    }, 3000); // 3 second timeout
  };

  useEffect(() => {
    if (ttsService.isTTSSupported()) {
      waitForVoices();
    }

    return () => {
      if (voiceCheckTimeoutRef.current) {
        clearTimeout(voiceCheckTimeoutRef.current);
      }
      ttsService.stopGeneratingSpeech();
    };
  }, []);

  useEffect(() => {
    return () => {
      ttsService.stopGeneratingSpeech();
    };
  }, [title]); 

  useEffect(() => {
    const hasRelevantPropChanged = prevContentRef.current !== content || 
                                   prevTitleRef.current !== title || 
                                   prevLanguageCodeRef.current !== languageCode;

    if (isSpeechOperationActive && title === "الشرح") { 
        if (hasRelevantPropChanged || !content) {
            ttsService.stopGeneratingSpeech();
            setIsSpeechOperationActive(false);
            setIsPausedByApp(false);
        }
    }
    
    prevContentRef.current = content;
    prevTitleRef.current = title;
    prevLanguageCodeRef.current = languageCode;

  }, [content, title, languageCode, isSpeechOperationActive]);

  const handleDownloadPdf = () => {
    downloadContentAsPdf(elementId, title, title);
  };

  const handlePlayPauseResumeAudio = async () => {
    if (!content || !languageCode || title !== "الشرح" || isDownloadingAudio) return;
    
    setTtsError(null);

    // Check if voices are still loading
    if (isLoadingVoices) {
      setTtsError("جارٍ تحميل الأصوات، يرجى المحاولة خلال لحظات...");
      return;
    }

    // Force voice check before speaking
    if (!voicesLoaded && !checkVoicesAvailability()) {
      setTtsError("الأصوات غير متاحة. جرب إعادة تحميل الصفحة أو استخدم متصفح آخر.");
      return;
    }

    if (isSpeechOperationActive) { 
      if (isPausedByApp) { 
        ttsService.resumeSpeechTTS();
        setIsPausedByApp(false);
      } else { 
        ttsService.pauseSpeechTTS();
        setIsPausedByApp(true);
      }
    } else { 
      setIsSpeechOperationActive(true);
      setIsPausedByApp(false);
      
      try {
        // Additional check for mobile devices - trigger user interaction
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        await ttsService.generateSpeech(content, languageCode);
      } catch (err: any) { 
        console.error(`TTS Error in component (generateSpeech for ${title}):`, err);
        
        let errorMessage = "فشل في إنشاء أو تشغيل الصوت.";
        
        if (err.message) {
          if (err.message.includes('interrupted') || err.message.includes('canceled')) {
            errorMessage = "";
          } else if (err.message.includes('synthesis') || err.message.includes('voice')) {
            errorMessage = "خطأ في تشغيل الصوت. جرب الضغط على الزر مرة أخرى أو إعادة تحميل الصفحة.";
          } else if (err.message.includes('network') || err.message.includes('connection')) {
            errorMessage = "خطأ في الاتصال. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
          } else if (err.message.includes('not allowed') || err.message.includes('permission')) {
            errorMessage = "مطلوب إذن للوصول للصوت. تأكد من السماح للمتصفح بتشغيل الصوت.";
          }
        }
        
        if (errorMessage) {
          setTtsError(errorMessage);
        }
      } finally {
        setIsSpeechOperationActive(false);
        setIsPausedByApp(false);
      }
    }
  };

  const handleDownloadAudio = async () => {
    if (!content || !languageCode || !ttsService.isTTSSupported() || isDownloadingAudio || title !== "الشرح") return;

    // Check if voices are available before downloading
    if (isLoadingVoices) {
      setAudioDownloadError("جارٍ تحميل الأصوات، يرجى المحاولة خلال لحظات...");
      return;
    }

    if (!voicesLoaded && !checkVoicesAvailability()) {
      setAudioDownloadError("الأصوات غير متاحة. جرب إعادة تحميل الصفحة أو استخدم متصفح آخر.");
      return;
    }

    setIsDownloadingAudio(true);
    setAudioDownloadError(null);
    setTtsError(null);
    
    try {
      // Stop any ongoing speech before recording
      ttsService.stopGeneratingSpeech();
      
      // Reset speech operation state
      setIsSpeechOperationActive(false);
      setIsPausedByApp(false);
      
      // Add a small delay to ensure speech is fully stopped
      await new Promise(resolve => setTimeout(resolve, 200));

      // Additional mobile device preparation
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const audioBlob = await ttsService.generateSpeechAndRecord(content, languageCode);
      
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("تم استلام كائن صوتي فارغ. قد يكون التسجيل فشل أو كان الكلام صامتاً.");
      }

      const filenameExtension = (audioBlob.type.split('/')[1] || 'webm').split(';')[0];
      const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_audio.${filenameExtension}`;
      
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) {
              document.body.removeChild(a);
          }
      }, 100);

    } catch (err: any) {
      console.error("Audio Download Error in component:", err);
      
      let errorMessage = "فشل في تسجيل أو تحميل الصوت.";
      
      if (err.message) {
        if (err.message.includes('MediaRecorder')) {
          errorMessage = "خطأ في تسجيل الصوت. متصفحك قد لا يدعم تحميل الملفات الصوتية.";
        } else if (err.message.includes('synthesis') || err.message.includes('voice')) {
          errorMessage = "خطأ في تشغيل الصوت أثناء التسجيل. جرب الضغط على الزر مرة أخرى.";
        } else if (err.message.includes('not allowed') || err.message.includes('permission')) {
          errorMessage = "مطلوب إذن للوصول للميكروفون أو الصوت.";
        }
      }
      
      setAudioDownloadError(errorMessage);
    } finally {
      setIsDownloadingAudio(false);
    }
  };
  
  const canUseTTS = title === 'الشرح' && content && !isLoading && languageCode && ttsService.isTTSSupported() && (voicesLoaded || !isLoadingVoices);
  const canDownloadAudio = canUseTTS && typeof MediaRecorder !== 'undefined';
  const showTtsDisabledMessage = title === 'الشرح' && !isLoading && content && !ttsService.isTTSSupported();
  const showMediaRecorderDisabledMessage = title === 'الشرح' && !isLoading && content && ttsService.isTTSSupported() && typeof MediaRecorder === 'undefined';
  const showVoicesLoadingMessage = title === 'الشرح' && !isLoading && content && ttsService.isTTSSupported() && isLoadingVoices;

  let playButtonIcon = <span role="img" aria-hidden="true" className="text-2xl">🔊</span>;
  let playButtonText = "تشغيل الشرح";

  if (isLoadingVoices) {
    playButtonIcon = <LoadingSpinner size="w-5 h-5" />;
    playButtonText = "جارٍ تحميل الأصوات...";
  } else if (isSpeechOperationActive) {
    if (isPausedByApp) {
      playButtonIcon = <span role="img" aria-hidden="true" className="text-2xl">▶️</span>;
      playButtonText = "استئناف الشرح";
    } else {
      playButtonIcon = <span role="img" aria-hidden="true" className="text-2xl">⏸️</span>;
      playButtonText = "إيقاف مؤقت";
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      
      <div className="min-h-[250px] flex-grow mb-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-12">
            <LoadingSpinner size="w-14 h-14" />
          </div>
        ) : content ? (
          <div id={elementId} className="text-slate-700 dark:text-slate-300 prose prose-xl dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 italic flex items-center justify-center h-full py-12 text-xl">
            سيظهر المحتوى السحري هنا قريباً!
          </p>
        )}
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 space-y-5">
        {canUseTTS && (
          <div className="flex flex-col items-start">
            <button
              onClick={handlePlayPauseResumeAudio}
              disabled={isDownloadingAudio || !content || isLoadingVoices} 
              className="w-full sm:w-auto px-6 py-3 text-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-700 transition-all duration-200 ease-in-out flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105"
              aria-label={playButtonText}
            >
              {isSpeechOperationActive && !isPausedByApp && typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused ? ( 
                <>
                  <LoadingSpinner size="w-5 h-5" /> 
                  <span className="italic">جارٍ التشغيل...</span>
                </>
              ) : (
                <>
                  {playButtonIcon}
                  <span>{playButtonText}</span>
                </>
              )}
            </button>
            {ttsError && <p className="text-rose-600 dark:text-rose-400 text-base mt-2">{ttsError}</p>}
          </div>
        )}

        {canDownloadAudio && (
          <div className="flex flex-col items-start">
            <button
              onClick={handleDownloadAudio}
              disabled={isDownloadingAudio || !content || isLoadingVoices} 
              className="w-full sm:w-auto px-6 py-3 text-lg font-semibold text-white bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-700 transition-all duration-200 ease-in-out flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105"
              aria-label="تحميل صوت الشرح"
            >
              {isDownloadingAudio ? (
                <>
                  <LoadingSpinner size="w-5 h-5" />
                  <span className="italic">جارٍ التسجيل...</span>
                </>
              ) : isLoadingVoices ? (
                <>
                  <LoadingSpinner size="w-5 h-5" />
                  <span className="italic">جارٍ تحميل الأصوات...</span>
                </>
              ) : (
                <>
                  <span role="img" aria-hidden="true" className="text-2xl">💾</span>
                  <span>تحميل الصوت</span>
                </>
              )}
            </button>
            {audioDownloadError && <p className="text-rose-600 dark:text-rose-400 text-base mt-2">{audioDownloadError}</p>}
          </div>
        )}
        
        {showVoicesLoadingMessage && (
            <p className="text-base text-blue-500 dark:text-blue-400 mt-2 italic">
                جارٍ تحميل الأصوات المتاحة...
            </p>
        )}
        
        {showTtsDisabledMessage && (
            <p className="text-base text-orange-500 dark:text-orange-400 mt-2 italic">
                (ميزة تحويل النص إلى كلام غير مدعومة حاليًا في متصفحك)
            </p>
        )}
        {showMediaRecorderDisabledMessage && (
             <p className="text-base text-orange-500 dark:text-orange-400 mt-2 italic">
                (تحميل الصوت غير مدعوم من متصفحك - MediaRecorder غير متوفر)
            </p>
        )}

        {content && !isLoading && (
          <button
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto px-6 py-3 text-lg font-semibold text-white bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-all duration-200 ease-in-out flex items-center justify-center space-x-3 transform hover:scale-105"
            aria-label={`تحميل ${title} كملف PDF`}
          >
             <span role="img" aria-hidden="true" className="text-2xl">📄</span>
            <span>تحميل كـ PDF</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentDisplayCard;
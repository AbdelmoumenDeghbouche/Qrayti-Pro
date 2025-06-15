import {
  speakText as speakTextUtil,
  stopSpeech as stopSpeechUtil,
  isSpeechSynthesisSupported as isSupportedUtil,
  speakAndRecord as recordUtil,
  pauseSpeech as pauseSpeechUtil,
  resumeSpeech as resumeSpeechUtil
} from '../utils/speechSynthesisUtils';

export const isTTSSupported = (): boolean => {
  return isSupportedUtil();
};

// Enhanced voice loading function
export const waitForVoicesLoaded = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.length, 'voices available');
        resolve();
        return true;
      }
      return false;
    };

    // Check if voices are already loaded
    if (checkVoices()) {
      return;
    }

    // Set up event listener for voice loading
    const handleVoicesChanged = () => {
      if (checkVoices()) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Fallback timeout
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      console.warn('Voice loading timeout - proceeding anyway');
      resolve();
    }, 5000);
  });
};

// Enhanced speech generation with voice loading
export const generateSpeech = async (text: string, languageCode: string): Promise<void> => {
  if (!isTTSSupported()) {
    throw new Error("Text-to-Speech is not supported by your browser.");
  }
  
  if (!text.trim()) {
    throw new Error("Input text cannot be empty for speech generation.");
  }

  // Wait for voices to be loaded
  await waitForVoicesLoaded();

  return new Promise((resolve, reject) => {
    try {
      // Additional preparation for mobile devices
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Check if synthesis is busy and cancel if needed
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Small delay to ensure cancellation is processed
        setTimeout(() => {
          startSpeech();
        }, 100);
      } else {
        startSpeech();
      }

      function startSpeech() {
        speakTextUtil(
          text,
          languageCode,
          () => {
            console.log('Speech completed successfully');
            resolve();
          },
          (event) => {
            console.error("Speech synthesis error in service:", event);
            
            // Enhanced error handling
            let errorMessage = 'Unknown error';
            if (event.error) {
              switch (event.error) {
                case 'audio-busy':
                  errorMessage = 'Audio system is busy';
                  break;
                case 'audio-hardware':
                  errorMessage = 'Audio hardware error';
                  break;
                case 'network':
                  errorMessage = 'Network error';
                  break;
                case 'synthesis-unavailable':
                  errorMessage = 'Speech synthesis unavailable';
                  break;
                case 'synthesis-failed':
                  errorMessage = 'Speech synthesis failed';
                  break;
                case 'language-unavailable':
                  errorMessage = 'Language not supported';
                  break;
                case 'voice-unavailable':
                  errorMessage = 'Voice not available';
                  break;
                case 'text-too-long':
                  errorMessage = 'Text too long for synthesis';
                  break;
                case 'invalid-argument':
                  errorMessage = 'Invalid argument provided';
                  break;
                case 'not-allowed':
                  errorMessage = 'Speech synthesis not allowed';
                  break;
                default:
                  errorMessage = event.error;
              }
            }
            
            reject(new Error(`Speech synthesis error: ${errorMessage}`));
          }
        );
      }
    } catch (error: any) {
      console.error("Error initiating speech in service:", error);
      reject(new Error(`Failed to initiate speech: ${error.message}`));
    }
  });
};

export const pauseSpeechTTS = (): void => {
  if (isTTSSupported()) {
    pauseSpeechUtil();
  }
};

export const resumeSpeechTTS = (): void => {
  if (isTTSSupported()) {
    resumeSpeechUtil();
  }
};

export const stopGeneratingSpeech = (): void => {
  stopSpeechUtil();
};

// Enhanced speech recording with voice loading
export const generateSpeechAndRecord = async (text: string, languageCode: string): Promise<Blob> => {
  if (!isTTSSupported()) {
    throw new Error("Text-to-Speech is not supported by your browser.");
  }
  
  if (!text.trim()) {
    throw new Error("Input text cannot be empty for speech generation.");
  }

  if (typeof MediaRecorder === 'undefined') {
    throw new Error("Audio recording (MediaRecorder) is not supported by your browser.");
  }

  // Wait for voices to be loaded
  await waitForVoicesLoaded();

  return new Promise((resolve, reject) => {
    try {
      // Additional preparation for mobile devices
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Check if synthesis is busy and cancel if needed
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Small delay to ensure cancellation is processed
        setTimeout(() => {
          startRecording();
        }, 200);
      } else {
        startRecording();
      }

      function startRecording() {
        recordUtil(
          text,
          languageCode,
          (audioBlob) => {
            console.log('Speech recording completed successfully');
            resolve(audioBlob);
          },
          (error) => {
            console.error("Speech synthesis/recording error in service:", error);
            
            let errorMessage = 'Unknown error';
            if (error.message) {
              errorMessage = error.message;
            } else if (error.name) {
              errorMessage = error.name;
            }
            
            reject(new Error(`Speech synthesis or recording error: ${errorMessage}`));
          }
        );
      }
    } catch (error: any) {
      console.error("Error initiating speech recording in service:", error);
      reject(new Error(`Failed to initiate speech recording: ${error.message}`));
    }
  });
};

// Utility function to get available voices for debugging
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!isTTSSupported()) {
    return [];
  }
  
  return window.speechSynthesis.getVoices();
};

// Utility function to find the best voice for a language
export const findBestVoiceForLanguage = (languageCode: string): SpeechSynthesisVoice | null => {
  if (!isTTSSupported()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  
  // First, try to find an exact match
  let bestVoice = voices.find(voice => voice.lang === languageCode);
  
  // If no exact match, try to find a voice that starts with the language code
  if (!bestVoice) {
    bestVoice = voices.find(voice => voice.lang.startsWith(languageCode.split('-')[0]));
  }
  
  // If still no match, try to find any Arabic voice for Arabic language codes
  if (!bestVoice && languageCode.startsWith('ar')) {
    bestVoice = voices.find(voice => voice.lang.startsWith('ar'));
  }
  
  return bestVoice || null;
};
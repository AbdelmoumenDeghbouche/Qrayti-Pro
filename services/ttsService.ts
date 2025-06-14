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

export const generateSpeech = (text: string, languageCode: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error("Text-to-Speech is not supported by your browser."));
      return;
    }
    if (!text.trim()) {
      reject(new Error("Input text cannot be empty for speech generation."));
      return;
    }

    try {
      speakTextUtil(
        text,
        languageCode,
        () => resolve(), // onEnd: Speech completed or was stopped successfully
        (event) => { // onError
            console.error("Speech synthesis error in service:", event);
            reject(new Error(`Speech synthesis error: ${event.error || 'Unknown error'}`));
        }
      );
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
  // No need to check isTTSSupported here, stopSpeechUtil will handle synth availability.
  stopSpeechUtil();
};

export const generateSpeechAndRecord = (text: string, languageCode: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error("Text-to-Speech is not supported by your browser."));
      return;
    }
    if (!text.trim()) {
      reject(new Error("Input text cannot be empty for speech generation."));
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      reject(new Error("Audio recording (MediaRecorder) is not supported by your browser."));
      return;
    }
    
    try {
      recordUtil(
        text,
        languageCode,
        (audioBlob) => resolve(audioBlob), 
        (error) => { 
            console.error("Speech synthesis/recording error in service:", error);
            reject(new Error(`Speech synthesis or recording error: ${error.message || error.name || 'Unknown error'}`));
        }
      );
    } catch (error: any) {
      console.error("Error initiating speech recording in service:", error);
      reject(new Error(`Failed to initiate speech recording: ${error.message}`));
    }
  });
};

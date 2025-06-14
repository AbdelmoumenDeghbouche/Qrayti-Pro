
// utils/speechSynthesisUtils.ts

let currentUtterance: SpeechSynthesisUtterance | null = null;
let voicesLoaded = false;
let voiceLoadInitiated = false;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let mediaStream: MediaStream | null = null; // To keep track of the stream from getDisplayMedia

let currentOnEndCallback: (() => void) | null = null;
let currentOnErrorCallback: ((event: SpeechSynthesisErrorEvent) => void) | null = null;


const getSpeechSynthesis = (): SpeechSynthesis | null => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis;
  }
  return null;
};

// Attempt to load voices early.
const synthForEarlyLoad = getSpeechSynthesis();
if (synthForEarlyLoad && !voiceLoadInitiated) {
    voiceLoadInitiated = true;
    if (synthForEarlyLoad.getVoices().length === 0) {
        synthForEarlyLoad.onvoiceschanged = () => {
            voicesLoaded = true;
            // synthForEarlyLoad.onvoiceschanged = null; // Keep it, as voices can change dynamically
        };
    } else {
        voicesLoaded = true;
    }
}

const setVoiceForUtterance = (utterance: SpeechSynthesisUtterance, lang: string) => {
    const synth = getSpeechSynthesis();
    if (!synth) return;

    const voices = synth.getVoices();
    if (voices.length === 0 && !voicesLoaded) {
        // Voices might not be loaded yet
        return;
    }

    let selectedVoice = voices.find(voice => voice.lang === lang && voice.localService);
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang === lang);
    }

    if (!selectedVoice) {
        const langPrefix = lang.split('-')[0];
        selectedVoice = voices.find(voice => voice.lang.startsWith(langPrefix) && voice.localService);
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith(langPrefix));
        }
    }
    if (!selectedVoice) { // Fallback to a default English voice if no match
        selectedVoice = voices.find(voice => voice.lang.startsWith('en') && voice.default);
    }
    if (!selectedVoice) { // Broader fallback to any English voice
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }


    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
};


export const isSpeechSynthesisSupported = (): boolean => {
  // A test comment
  return getSpeechSynthesis() !== null;
};

export const speakText = (
  text: string,
  lang: string, // BCP 47 language code
  onEnd: () => void,
  onError: (event: SpeechSynthesisErrorEvent) => void
): void => {
  const synth = getSpeechSynthesis();
  if (!synth) {
    const dummyUtterance = new SpeechSynthesisUtterance(text);
    dummyUtterance.lang = lang;

    const errorEvent = {
      // SpeechSynthesisErrorEvent specific
      error: 'synthesis-unavailable' as SpeechSynthesisErrorCode,
      // SpeechSynthesisEvent specific
      charIndex: 0,
      charLength: 0, 
      elapsedTime: 0,
      name: '',
      utterance: dummyUtterance,
      
      // Standard Event properties
      type: 'error',
      bubbles: false,
      cancelable: false,
      composed: false,
      currentTarget: null,
      defaultPrevented: false,
      eventPhase: 0, // Event.NONE
      isTrusted: false, // Synthetic event
      target: null,
      timeStamp: performance.now(),
      
      // Properties explicitly listed in the TS error
      cancelBubble: false,
      returnValue: true, // Default for Event.returnValue
      srcElement: null,  // Legacy alias for target
      
      // Deprecated method, but TS seems to want it for full Event compatibility
      initEvent: (typeArg: string, bubblesArg?: boolean, cancelableArg?: boolean): void => {
        // This is a no-op for a synthetically created event.
      },
      // The missing method from the error message
      initSpeechSynthesisEvent: (
        typeArg: string, 
        canBubbleArg: boolean, 
        cancelableArg: boolean, 
        charIndexArg: number, 
        elapsedTimeArg: number, 
        nameArg: string
      ): void => {
        // This is a no-op for a synthetically created event.
        // We are primarily setting properties directly.
      },
      
      // Non-standard instance properties that TS seems to require (these are usually static on Event)
      NONE: 0,
      CAPTURING_PHASE: 1,
      AT_TARGET: 2,
      BUBBLING_PHASE: 3,
      
      // Standard Event methods
      composedPath: () => [],
      preventDefault: () => {},
      stopImmediatePropagation: () => {},
      stopPropagation: () => {},
      
    } as SpeechSynthesisErrorEvent; // Use type assertion

    onError(errorEvent);
    return;
  }

  stopSpeech(); // Cancel any ongoing speech AND recording. This also clears old callbacks.

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = lang;

  currentOnEndCallback = onEnd;
  currentOnErrorCallback = onError;

  currentUtterance.onend = () => {
    if (currentOnEndCallback) {
        currentOnEndCallback();
    }
    currentUtterance = null;
    currentOnEndCallback = null;
    currentOnErrorCallback = null;
  };

  currentUtterance.onerror = (event) => {
    console.error('SpeechSynthesisUtterance error:', event.error, event);
    if (currentOnErrorCallback) {
        currentOnErrorCallback(event);
    }
    currentUtterance = null;
    currentOnEndCallback = null;
    currentOnErrorCallback = null;
  };

  const tryToSpeak = () => {
      if (currentUtterance) {
        setVoiceForUtterance(currentUtterance, lang);
        synth.speak(currentUtterance);
      }
  };

  if (synth.getVoices().length === 0 && !voicesLoaded) {
    synth.onvoiceschanged = () => {
      voicesLoaded = true;
      if (currentUtterance && (synth.pending || !synth.speaking)) {
        tryToSpeak();
      }
    };
  } else {
    voicesLoaded = true;
    tryToSpeak();
  }
};

export const pauseSpeech = (): void => {
    const synth = getSpeechSynthesis();
    // Check synth.speaking because synth.pause() only works if speech is active.
    // synth.paused will be false if it's actively sounding.
    if (synth && synth.speaking && !synth.paused) {
        synth.pause();
    }
};

export const resumeSpeech = (): void => {
    const synth = getSpeechSynthesis();
    // Check synth.paused because synth.resume() only works if speech is paused.
    if (synth && synth.paused) {
        synth.resume();
    }
};


export const speakAndRecord = (
  text: string,
  lang: string,
  onRecordingCompleteCallback: (audioBlob: Blob) => void,
  onErrorCallback: (error: Error) => void // Changed to expect Error type
): void => {
  const synth = getSpeechSynthesis();
  if (!synth) {
    onErrorCallback(new Error('Speech synthesis not supported.'));
    return;
  }

  if (typeof MediaRecorder === 'undefined') {
    onErrorCallback(new Error('MediaRecorder API not supported.'));
    return;
  }

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    onErrorCallback(new Error('Audio recording requires a secure context (HTTPS). Please ensure the application is served over HTTPS.'));
    return;
  }

  stopSpeech(); // Crucial: Stop any existing speech AND recording, clear callbacks.

  navigator.mediaDevices.getDisplayMedia({
    video: false,
    audio: true,
  })
  .then(stream => {
    mediaStream = stream;

    if (mediaStream.getAudioTracks().length === 0) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        onErrorCallback(new Error('No audio track found. Please ensure you share tab/system audio when prompted.'));
        return;
    }

    let mimeType = '';
    if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
    } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        mimeType = 'audio/webm; codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
        mimeType = 'audio/ogg; codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
    } else {
        console.warn("No preferred audio MIME type supported for recording by MediaRecorder. Using browser default.");
    }

    try {
        mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
    } catch (e: any) {
         onErrorCallback(new Error(`Failed to create MediaRecorder: ${e.message}. Attempted MimeType: ${mimeType || 'default'}`));
         mediaStream.getTracks().forEach(track => track.stop());
         mediaStream = null;
         mediaRecorder = null; // Ensure recorder is nulled
         return;
    }

    audioChunks = []; // Clear previous chunks

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (audioChunks.length > 0) {
        const firstChunkType = audioChunks[0].type;
        const blobMimeType = firstChunkType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: blobMimeType });
        onRecordingCompleteCallback(audioBlob);
      } else {
        onErrorCallback(new Error('No audio data was recorded. The speech might have been silent, too short, or an issue occurred during recording.'));
      }
      audioChunks = [];
      if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          mediaStream = null;
      }
      mediaRecorder = null; // Release MediaRecorder instance
    };

    mediaRecorder.onerror = (event: Event) => {
        const recError = event instanceof ErrorEvent ? event.error : ((event as any).error || {name: "MediaRecorderError", message: "Unknown MediaRecorder error"});
        onErrorCallback(new Error(`MediaRecorder error: ${recError.name} - ${recError.message}`));
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (synth.speaking || synth.pending) { synth.cancel(); }
        mediaRecorder = null;
    };

    // Setup utterance AFTER MediaRecorder is ready
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = lang;

    currentOnEndCallback = () => { // This onEnd is for the speech utterance itself
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        } else if (mediaRecorder && mediaRecorder.state === "inactive") {
             if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
            mediaRecorder = null; // Clean up recorder
        }
        currentUtterance = null;
        currentOnEndCallback = null;
        currentOnErrorCallback = null;
    };
    currentOnErrorCallback = (speechErrorEvent) => { // This onError is for the SpeechSynthesisUtterance
        // We pass this as an Error object to the main onErrorCallback
        onErrorCallback(new Error(`SpeechSynthesisUtterance error during recording: ${speechErrorEvent.error}`));
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        } else {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
            mediaRecorder = null;
        }
        currentUtterance = null;
        currentOnEndCallback = null;
        currentOnErrorCallback = null;
    };

    currentUtterance.onstart = () => {
        if (mediaRecorder && mediaRecorder.state === "inactive") {
            try {
                mediaRecorder.start();
            } catch (e: any) {
                console.error("Failed to start MediaRecorder within utterance.onstart:", e);
                // Ensure the main onErrorCallback is called with an Error object
                onErrorCallback(new Error(`Failed to start MediaRecorder: ${e.message}. Original error: ${e.name}`));
                stopSpeech(); // Stop everything if recorder fails to start
            }
        }
    };
    currentUtterance.onend = currentOnEndCallback;
    currentUtterance.onerror = currentOnErrorCallback;

    const tryToSpeakAndRecord = () => {
        if (currentUtterance) {
            setVoiceForUtterance(currentUtterance, lang);
            synth.speak(currentUtterance);
        }
    };

    if (synth.getVoices().length === 0 && !voicesLoaded) {
        synth.onvoiceschanged = () => {
            voicesLoaded = true;
            if (currentUtterance && (synth.pending || !synth.speaking)) {
                tryToSpeakAndRecord();
            }
        };
    } else {
        voicesLoaded = true;
        tryToSpeakAndRecord();
    }

  })
  .catch(err => {
    console.error('getDisplayMedia error:', err);
    onErrorCallback(new Error(`Could not start screen/tab capture for recording: ${err.message}. Please grant permission and select a source with audio.`));
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop(); // This should trigger onstop which will nullify mediaRecorder
    } else {
        mediaRecorder = null; // Ensure it's nulled if it never started or failed before onstop
    }
    audioChunks = [];
  });
};

export const stopSpeech = (): void => {
  const synth = getSpeechSynthesis();
  if (synth) {
    synth.cancel();
  }

  if (!currentUtterance) {
      currentOnEndCallback = null;
      currentOnErrorCallback = null;
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    try {
        mediaRecorder.stop(); // This will trigger its onstop handler.
    } catch(e) {
        console.warn("Error stopping media recorder during stopSpeech:", e);
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        audioChunks = [];
        mediaRecorder = null;
    }
  } else {
      if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          mediaStream = null;
      }
      audioChunks = [];
      mediaRecorder = null;
  }
};

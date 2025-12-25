import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, RefreshCw, MessageCircle, Save } from 'lucide-react';
import { getImageUrls } from '../utils/imageStorage';

const TeacherToStudent = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [recognition, setRecognition] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const [hasTranslator, setHasTranslator] = useState(false);
  const [translateTo, setTranslateTo] = useState<string>(''); // Target language for translation
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [, setAudioChunks] = useState<Blob[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeRafRef = useRef<number | null>(null);
  const audioMimeTypeRef = useRef<string>('');
  const audioFileExtRef = useRef<string>('webm');
  const audioChunksRef = useRef<Blob[]>([]);

  type SavedRecording = {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    createdAt: string;
  };

  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>(() => {
    try {
      const raw = localStorage.getItem('savedRecordings');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [letterToUrl, setLetterToUrl] = useState<Record<string, string>>({});
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Fetch alphabet images from Supabase
  useEffect(() => {
    const fetchAlphabetImages = async () => {
      setIsLoadingImages(true);
      try {
        // Generate file names for A-Z
        const alphabetFileNames = Array.from({ length: 26 }, (_, i) => 
          `alphabets/${String.fromCharCode(65 + i)}.png`
        );
        
        const results = await getImageUrls(alphabetFileNames);
        
        const newLetterToUrl: Record<string, string> = {};
        results.forEach(result => {
          if (result.url) {
            const fileName = result.fileName.split('/').pop(); // Extract filename
            if (fileName) {
              const letter = fileName.replace('.png', '').toUpperCase();
              newLetterToUrl[letter] = result.url;
            }
          }
        });
        
        setLetterToUrl(newLetterToUrl);
      } catch (error) {
        console.error('Error fetching alphabet images:', error);
      } finally {
        setIsLoadingImages(false);
      }
    };
    
    fetchAlphabetImages();
  }, []);

  // Preload images when they are available
  useEffect(() => {
    if (Object.keys(letterToUrl).length > 0) {
      // Preload all alphabet images
      Object.values(letterToUrl).forEach(url => {
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [letterToUrl]);

  const getLastWordLettersAsUrls = (): string[] => {
    const combined = `${speechText} ${interimText}`.trim();
    if (!combined) return [];
    const lastWord = combined.split(/\s+/).pop() || '';
    return lastWord
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .split('')
      .map((ch) => letterToUrl[ch])
      .filter((u): u is string => Boolean(u));
  };

  useEffect(() => {
    try {
      localStorage.setItem('savedRecordings', JSON.stringify(savedRecordings));
    } catch {}
  }, [savedRecordings]);

  const languageOptions = [
    { code: 'auto', name: 'Auto Detect', flag: '🌐' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  ];
  
  interface TranslationOption {
    code: string;
    name: string;
    flag: string;
  }
  
  const translationOptions: TranslationOption[] = [
    { code: '', name: 'None', flag: '❌' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  ];

  const languageNames: { [key: string]: string } = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
  };

  useEffect(() => {
    // Check if speech recognition is supported
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    
    // Check if browser supports translation API
    try {
      // In a real implementation, we would check for translation API availability
      // For now, we'll simulate this check
      const hasTranslationSupport = 'fetch' in window; // Basic check if fetch is available for API calls
      setHasTranslator(hasTranslationSupport);
      console.log('Translation support:', hasTranslationSupport);
    } catch (error) {
      console.error('Error checking translation support:', error);
      setHasTranslator(false);
    }
    
    // TTS availability is handled implicitly where used
  }, []);

  useEffect(() => {
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error cleaning up speech recognition:', error);
        }
      }
      
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        } catch (error) {
          console.error('Error cleaning up audio stream:', error);
        }
      }
      
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          mediaRecorderRef.current = null;
        } catch (error) {
          console.error('Error cleaning up media recorder:', error);
        }
      }
      
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
          audioContextRef.current = null;
        } catch (error) {
          console.error('Error cleaning up audio context:', error);
        }
      }
      if (volumeRafRef.current) {
        cancelAnimationFrame(volumeRafRef.current);
        volumeRafRef.current = null;
      }
    };
  }, [recognition]);

  const startAudioRecording = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media devices API not supported');
        setErrorMessage('Microphone is not supported in this browser. Try Chrome or Edge.');
        return false;
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Choose a supported MIME type for audio recording
      let chosenMime = '';
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      for (const m of candidates) {
        // @ts-ignore
        if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }
      audioMimeTypeRef.current = chosenMime || '';
      audioFileExtRef.current = chosenMime.includes('ogg') ? 'ogg' : 'webm';

      // Create media recorder
      const mediaRecorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Prepare for new session: clear previous preview
      try {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
      } catch {}
      setAudioUrl(null);
      setAudioBlob(null);
      setAudioChunks([]);
      audioChunksRef.current = [];

      // Set up data handling
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          // Keep an imperative buffer to avoid stale state issues
          audioChunksRef.current.push(event.data);
          setAudioChunks([...audioChunksRef.current]);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('Media recorder stopped');
        const parts = audioChunksRef.current && audioChunksRef.current.length ? audioChunksRef.current : [];
        const blobType = audioMimeTypeRef.current || 'audio/webm';
        const audioBlob = new Blob(parts, { type: blobType });
        if (!audioBlob || audioBlob.size === 0) {
          console.warn('No audio captured');
          setErrorMessage('No audio captured. Please try again.');
          setIsRecordingAudio(false);
          return;
        }
        setAudioBlob(audioBlob);
        try {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
        } catch {}
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecordingAudio(false);
        // reset chunks ref after creating blob
        audioChunksRef.current = [];
      };
      
      // Setup AudioContext + Analyser for live volume meter
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          analyserRef.current = analyser;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const v = (dataArray[i] - 128) / 128;
              sumSquares += v * v;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            const level = Math.min(100, Math.max(0, Math.round(rms * 200)));
            setVolumeLevel(level);
            volumeRafRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (err) {
        console.warn('AudioContext/Analyser not available:', err);
      }

      // Start recording (no timeslice to ensure full blob in some browsers)
      mediaRecorder.start();
      setIsRecordingAudio(true);
      console.log('Audio recording started');
      return true;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      setErrorMessage('Could not access microphone. Please allow mic permissions and reload.');
      return false;
    }
  };
  
  const stopAudioRecording = (): boolean => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.requestData();
        } catch {}
        mediaRecorderRef.current.stop();
        console.log('Audio recording stopped');
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Stop volume meter
        if (volumeRafRef.current) {
          cancelAnimationFrame(volumeRafRef.current);
          volumeRafRef.current = null;
        }
        setVolumeLevel(0);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping audio recording:', error);
      return false;
    }
  };

  // Keep original save logic for Saved Recordings list via programmatic calls as needed
  const saveAudio = (): boolean => {
    if (!audioBlob) {
      console.log('No audio to save');
      return false;
    }
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = audioFileExtRef.current || 'webm';
      const filename = `lecture_audio_${timestamp}.${ext}`;

      // Persist a separate object URL for saved list (do NOT revoke until deletion)
      const persistentUrl = URL.createObjectURL(audioBlob);

      const record: SavedRecording = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: filename,
        url: persistentUrl,
        type: audioBlob.type || `audio/${ext}`,
        size: audioBlob.size,
        createdAt: new Date().toISOString(),
      };

      setSavedRecordings(prev => [record, ...prev]);

      // Trigger a download for the user using a separate ephemeral URL
      const downloadUrl = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // Auto-play the saved recording
      try {
        const player = new Audio(persistentUrl);
        // Some browsers require user gesture; ignore errors
        player.play().catch(() => {});
      } catch {}

      console.log('Audio saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving audio:', error);
      return false;
    }
  };

  // MP3 export removed

  const deleteRecording = (id: string) => {
    setSavedRecordings(prev => {
      const rec = prev.find(r => r.id === id);
      if (rec) {
        try { URL.revokeObjectURL(rec.url); } catch {}
      }
      return prev.filter(r => r.id !== id);
    });
  };

  // kept for potential future use (programmatic playback)

  const saveTranscript = (): boolean => {
    if (!speechText) {
      console.log('No transcript to save');
      return false;
    }
    try {
      const blob = new Blob([speechText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `lecture_transcript_${timestamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Transcript saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving transcript:', error);
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const doTranslate = async () => {
      if (!translateTo || !hasTranslator) {
        setTranslatedText('');
        return;
      }
      const base = speechText.trim();
      if (!base) {
        setTranslatedText('');
        return;
      }
      const t = await translateText(base);
      if (!cancelled) setTranslatedText(t || '');
    };
    doTranslate();
    return () => {
      cancelled = true;
    };
  }, [translateTo, speechText, hasTranslator]);

  const startListening = async () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      console.log('Already listening, stopping first...');
      stopListening();
      return;
    }

    // reset any previous error
    setErrorMessage('');

    // Start audio recording if enabled
    let audioStarted = true;
    try {
      audioStarted = await startAudioRecording();
      if (audioStarted) {
        console.log('Audio recording started successfully');
      }
    } catch (error) {
      console.error('Error starting audio recording:', error);
      audioStarted = false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const newRecognition = new SpeechRecognition();
    
    newRecognition.continuous = true;
    newRecognition.interimResults = true;
    
    // Set language based on selection with enhanced configuration
    if (selectedLanguage === 'auto') {
      // For auto-detect, use a broader language setting that can handle multiple languages
      newRecognition.lang = 'en-US'; // Default fallback
      console.log('Using auto-detect mode with fallback to English');
    } else {
      newRecognition.lang = selectedLanguage;
      console.log('Setting speech recognition language to:', selectedLanguage);
    }

    // Enhanced configuration for better accuracy
    newRecognition.maxAlternatives = 3; // Get multiple recognition alternatives
    newRecognition.continuous = true; // Keep listening continuously
    newRecognition.interimResults = true; // Show interim results for real-time feedback

    newRecognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setDetectedLanguage('');
      setInterimText('');
      
      // Set up auto-save interval if not already set
      if (!lastAutoSaveTime) {
        setLastAutoSaveTime(new Date());
      }
    };

    newRecognition.onresult = (event) => {
      console.log('Speech recognition result:', event);
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        console.log(`Result ${i}: "${transcript}" (confidence: ${confidence})`);
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update interim text for real-time feedback
      if (interimTranscript) {
        setInterimText(interimTranscript);
        console.log('Interim text:', interimTranscript);
      }
      
      // Update final text when speech is complete
      if (finalTranscript) {
        setSpeechText(prev => (prev ? prev + ' ' : '') + finalTranscript);
        setInterimText('');
        console.log('Final text:', finalTranscript);
        
        // Try to detect language if auto-detect is enabled
        if (selectedLanguage === 'auto') {
          detectLanguage(finalTranscript);
        } else {
          // Set detected language based on selection
          const langCode = selectedLanguage.split('-')[0];
          setDetectedLanguage(languageNames[langCode] || 'Unknown');
          console.log('Detected language from selection:', languageNames[langCode]);
        }
        
        // Translate text if translation is enabled
        if (translateTo && hasTranslator) {
          translateText(finalTranscript).then(t => {
            if (t) {
              setTranslatedText(prev => (prev ? prev + ' ' : '') + t);
            }
          });
        }
      }
    };

    newRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setRecognition(null);
      
      // Stop audio recording if there's an error
      if (isRecordingAudio) {
        stopAudioRecording();
      }
      
      // Show user-friendly error messages
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'no-speech') {
        alert('No speech detected. Please speak clearly and try again.');
      } else if (event.error === 'network') {
        alert('Network error. Please check your internet connection and try again.');
      }
    };

    newRecognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      setRecognition(null);
      // make sure audio recording is stopped
      if (isRecordingAudio) {
        stopAudioRecording();
      }
    };

    try {
      newRecognition.start();
      setRecognition(newRecognition);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Error starting speech recognition. Please try again.');
      
      // Stop audio recording if speech recognition fails
      if (isRecordingAudio) {
        stopAudioRecording();
      }
    }
  };

  // Enhanced language detection (restricted to English, Hindi, Tamil)
  const detectLanguage = (text: string) => {
    console.log('Detecting language for text:', text);
    
    // Remove extra spaces and normalize (kept for potential future use)
    
    // Tamil detection - check for Tamil characters
    if (/[\u0B80-\u0BFF]/.test(text)) {
      console.log('Detected Tamil');
      setDetectedLanguage('Tamil');
      return;
    }
    
    // Hindi detection - check for Devanagari characters
    if (/[\u0900-\u097F]/.test(text)) {
      console.log('Detected Hindi');
      setDetectedLanguage('Hindi');
      return;
    }
    
    // Default to English for Latin characters
    if (/[a-zA-Z]/.test(text)) {
      console.log('Detected English');
      setDetectedLanguage('English');
      return;
    }
    
    // If no language detected, show unknown
    console.log('Language unknown');
    setDetectedLanguage('Unknown');
  };
  
  // Translate text function for speech recognition
  const translateText = async (text: string): Promise<string | null> => {
    if (!text || !translateTo || !hasTranslator) {
      console.log('Translation skipped: missing text, target language, or translator');
      return null;
    }
    // Skip translation when offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return text;
    }
    
    try {
      console.log(`Translating text to ${translateTo}...`);
      const langCode = translateTo.split('-')[0].toLowerCase();
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        const t = data[0].map((sentence: any) => sentence[0]).join(' ');
        console.log('Translation completed successfully');
        return t;
      } else {
        throw new Error('Unexpected translation response format');
      }
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  };

  const stopListening = () => {
    console.log('Stopping speech recognition...');
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
    setRecognition(null);
    setInterimText(''); // Clear interim text when stopping
    
    // Stop audio recording if active
    if (isRecordingAudio) {
      const audioStopped = stopAudioRecording();
      if (audioStopped) {
        console.log('Audio recording stopped successfully');
      } else {
        console.log('Audio recording stopped with speech recognition');
      }
    }
    
    // No auto-save on stop; user chooses when to download
  };

  const clearResults = () => {
    console.log('Clearing all results...');
    // Stop listening if currently listening
    if (isListening && recognition) {
      stopListening();
    }
    setSpeechText('');
    setInterimText('');
    setDetectedLanguage('');
    setTranslatedText('');
    
    // Clear audio recording data
    setAudioChunks([]);
    setAudioBlob(null);
    setLastAutoSaveTime(null);
  };

  const speakText = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        console.error('Text-to-speech not supported in this browser');
        alert('Text-to-speech is not supported in your browser. Please try Chrome, Firefox, or Edge.');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice properties
      utterance.rate = 0.9;  // Slightly slower than normal
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find a voice that matches the detected language
      if (detectedLanguage) {
        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(voice => 
          voice.lang.toLowerCase().includes(selectedLanguage.toLowerCase()) ||
          voice.name.toLowerCase().includes(detectedLanguage.toLowerCase())
        );
        
        if (targetVoice) {
          utterance.voice = targetVoice;
          console.log('Using voice:', targetVoice.name, targetVoice.lang);
        } else {
          console.warn('No matching voice found, using default');
        }
      }

      // Set the language code if available
      if (selectedLanguage && selectedLanguage !== 'auto') {
        utterance.lang = selectedLanguage;
      }

      // Add error handling
      utterance.onerror = (event) => {
        console.error('SpeechSynthesis error:', event);
        alert('Error occurred during speech synthesis. Please try again.');
      };

      utterance.onend = () => {
        console.log('Speech finished');
      };

      // Speak the text
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error in speakText:', error);
      alert('Failed to read text. Please check console for details.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-emerald-800 mb-2">
          🎤 Teacher to Student Communication
        </h2>
        <p className="text-emerald-600 text-lg">
          Speak into the microphone and see your words converted to text
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Speech Input Panel */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100 relative">
            {/* Guide Icon */}
            <button
              onClick={() => setShowGuide(true)}
              className="absolute top-4 right-4 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
              title="Guide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center">
              <Mic className="mr-2" size={24} />
              🎙️ Speech Input
            </h3>

            {/* Microphone Visualization */}
            <div className="aspect-square max-w-48 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening ? 'bg-gradient-to-r from-red-400 to-red-500 animate-pulse shadow-lg shadow-red-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}>
                <Mic size={32} className="text-white" />
              </div>
              
              {/* Sound waves animation */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-2 border-red-300 animate-ping"></div>
                  <div className="absolute w-40 h-40 rounded-full border-2 border-red-200 animate-ping delay-75"></div>
                </div>
              )}
            </div>

            {/* Listening Bar (live volume meter) */}
            <div className="mb-4">
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-100"
                  style={{ width: `${isListening ? volumeLevel : 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">{isListening ? 'Listening...' : 'Idle'}</div>
            </div>

            {/* Audio Preview removed */}

            {/* Status Indicator */}
            <div className="text-center mb-4">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                isListening 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span>{isListening ? 'Recording...' : 'Ready to Record'}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={!isSupported}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic size={18} />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <MicOff size={18} />
                  <span>Stop Recording</span>
                </button>
              )}

              <button
                onClick={clearResults}
                disabled={!speechText && !interimText && !isListening}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} />
                <span>Clear All</span>
              </button>
              
              {/* Save transcript button */}
              <button
                onClick={saveTranscript}
                disabled={!speechText}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                <span>Download Transcript</span>
              </button>
              
              {/* MP3 export removed */}
            </div>

            {/* Language Selector */}
            <div className="mt-6">
              <h4 className="text-lg font-bold text-emerald-800 mb-3 flex items-center">
                🌍 Language Selection
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedLanguage === lang.code
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Translation Target Selector */}
              {hasTranslator && (
                <div className="mt-4">
                  <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                    🔄 Translate To
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                    {translationOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setTranslateTo(lang.code)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                          translateTo === lang.code
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(errorMessage || !isSupported) && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-orange-800 text-sm font-medium">
                  {errorMessage || '⚠️ Speech recognition is not supported in your browser. Please use Chrome or Edge.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Text Display */}
        <div className="space-y-6">
          {/* Live Text Display */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-800 flex items-center">
                  <MessageCircle className="mr-2" size={24} />
                📝 Live Text Display
                </h3>
              {speechText && (
                <button
                  onClick={() => speakText(speechText)}
                  className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-300"
                >
                  <Volume2 size={14} />
                  <span>Repeat</span>
                </button>
              )}
            </div>
            
            {/* Real-time Text Box */}
            <div className="relative">
              <div className="w-full h-64 p-4 text-lg text-emerald-800 font-medium bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 overflow-y-auto">
                {/* Final text */}
                <div className="text-emerald-800">
                  {speechText}
                </div>
                
                {/* Interim text (real-time) */}
                {interimText && (
                  <div className="text-emerald-600 italic mt-2">
                    <span className="text-emerald-500">[Live: </span>
                    {interimText}
                    <span className="text-emerald-500">]</span>
                  </div>
                )}
                
                {/* Empty state */}
                {!speechText && !interimText && (
                  <div className="text-emerald-400 italic">
                    Start recording to see your speech appear here in real-time...
                  </div>
                )}
              </div>
              
              {/* Language indicator */}
              {detectedLanguage && (
                <div className="absolute top-2 left-2 flex items-center space-x-1">
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                    {detectedLanguage}
                  </span>
                </div>
              )}
              
              {/* Recording indicator */}
              {isListening && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 font-medium">Recording</span>
              </div>
              )}
              
              {/* Character count */}
              <div className="absolute bottom-2 right-2 text-xs text-emerald-600">
                {(speechText + interimText).length} characters
              </div>
          </div>

            {/* Translation Box */}
            {translateTo && (
              <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-blue-800">Translation ({translateTo.toUpperCase()})</h4>
                </div>
                <div className="w-full min-h-[64px] p-3 text-base text-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  {translatedText || (
                    <span className="text-blue-400 italic">Translation will appear here...</span>
                  )}
                </div>
              </div>
            )}

            {/* ISL Gesture Output (below Live Text Display) */}
            <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow border border-emerald-100">
              <h4 className="text-lg font-bold text-emerald-800 mb-2">🤟 ISL Gesture Output</h4>
              {isLoadingImages ? (
                <div className="text-emerald-500 italic">Loading alphabet images...</div>
              ) : getLastWordLettersAsUrls().length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {getLastWordLettersAsUrls().map((url, idx) => (
                    <img key={`${url}-${idx}`} src={url} alt="ISL letter" className="h-16 w-16 object-contain rounded-lg border border-emerald-200 bg-emerald-50" />
                  ))}
                </div>
              ) : (
                <div className="text-emerald-500 italic">Speak to see the last word rendered as ISL alphabet images.</div>
              )}
            </div>

            {/* Clear text button */}
            {(speechText || interimText) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setSpeechText('');
                    setInterimText('');
                    setDetectedLanguage('');
                    setTranslatedText('');
                  }}
                  className="flex items-center space-x-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-300"
                >
                  <RefreshCw size={14} />
                  <span>Clear Text</span>
                </button>
            </div>
            )}
          </div>

          {/* Removed ISL Translations and Quick Phrases sections */}
        </div>
      </div>

      {/* Saved Recordings List */}
      {savedRecordings.length > 0 && (
        <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
          <h3 className="text-xl font-bold text-emerald-800 mb-4">🎧 Saved Recordings</h3>
          <ul className="space-y-3">
            {savedRecordings.map(r => (
              <li key={r.id} className="flex flex-col gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="text-sm text-emerald-900">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-emerald-700 text-xs">{(r.size/1024).toFixed(1)} KB • {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <audio controls src={r.url} className="w-full" />
                <div className="flex items-center gap-2">
                  <a href={r.url} download={r.name} className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600">Download</a>
                  <button onClick={() => deleteRecording(r.id)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600">Delete</button>
                </div>
              </li>) )}
          </ul>
        </div>
      )}

      {/* Guide Popup Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-emerald-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Use
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Select Language</h4>
                  <p className="text-gray-600 text-sm">Choose your language from the dropdown or use "Auto Detect" for automatic recognition.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Start Recording</h4>
                  <p className="text-gray-600 text-sm">Click the "Start Recording" button and allow microphone access when prompted.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Speak Clearly</h4>
                  <p className="text-gray-600 text-sm">Speak in your chosen language. Your text will appear in real-time on the right side.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Stop Recording</h4>
                  <p className="text-gray-600 text-sm">Click "Stop Recording" when finished. Use "Repeat" to hear your text spoken back.</p>
                </div>
              </div>

              {/* Supported Languages */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <span className="text-lg mr-2">🌍</span>
                  Supported Languages
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>• English</div>
                  <div>• Tamil</div>
                  <div>• Hindi</div>
                  <div>• Telugu</div>
                  <div>• Kannada</div>
                  <div>• Malayalam</div>
                  <div>• Bengali</div>
                  <div>• Gujarati</div>
                  <div>• Marathi</div>
                  <div>• Punjabi</div>
                  <div>• Urdu</div>
                  <div>• Spanish</div>
                  <div>• French</div>
                  <div>• German</div>
                  <div>• Italian</div>
                  <div>• Portuguese</div>
                  <div>• Russian</div>
                  <div>• Japanese</div>
                  <div>• Korean</div>
                  <div>• Chinese</div>
                  <div>• Arabic</div>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <span className="text-lg mr-2">💡</span>
                  Pro Tips
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Use in a quiet environment for better accuracy</li>
                  <li>• Choose specific language for better recognition</li>
                  <li>• Use Chrome or Edge for best performance</li>
        </ul>
      </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherToStudent;
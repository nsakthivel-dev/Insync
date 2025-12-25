import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  RotateCcw,
  History,
  Trash2,
  HelpCircle,
  Hand,
  Eye,
  Play,
  Pause,
} from 'lucide-react';
import { useGestureRecognition, GestureResult } from '../hooks/useGestureRecognition';

const StudentToTeacher = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [voiceEnabled] = useState(true);
  const [recognizedText, setRecognizedText] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTopic, setHelpTopic] = useState<'camera' | 'text' | 'quick' | 'isl-guide' | null>(null);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [isGestureDetecting, setIsGestureDetecting] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);

  const openHelp = (topic: 'camera' | 'text' | 'quick' | 'isl-guide') => {
    setHelpTopic(topic);
    setShowHelpModal(true);
  };
  const closeHelp = () => {
    setShowHelpModal(false);
    setHelpTopic(null);
  };
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);


  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [lastUtterance, setLastUtterance] = useState<{ text: string; voice: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Gesture recognition hook
  const { startRecognition: startGestureRecognition, stopRecognition: stopGestureRecognition } = useGestureRecognition({
    onGestureDetected: (result: GestureResult) => {
      setCurrentGesture(result.gesture);
      setGestureConfidence(result.confidence);
      setRecognizedText(result.text);
      
      // Add to history
      setHistory(prev => [...prev, result.text]);
      
      // Auto-speak if voice is enabled
      if (voiceEnabled && 'speechSynthesis' in window) {
        speak(result.text, true);
      }
    },
    isActive: isRecognitionActive
  });


  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const startCamera = async () => {
    try {
      // Request camera access with specific constraints for better performance
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraEnabled(true);
        
        // Show success message
        console.log('Camera access granted successfully');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Camera access denied. Please allow camera access to use this feature.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Please close other applications using the camera.';
        }
      }
      
      alert(errorMessage);
    }
  };

  const stopCamera = () => {
    // Stop recognition first
    stopRecognition();
    
    // Stop all camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    // Reset all camera-related states
    setCameraEnabled(false);
    setIsRecording(false);
    setIsRecognitionActive(false);
    setCurrentGesture('');
    setGestureConfidence(0);
    
    console.log('Camera stopped successfully');
  };

  const startRecognition = () => {
    if (!cameraEnabled) {
      alert('Please enable camera first');
      return;
    }

    if (!videoRef.current || !videoRef.current.srcObject) {
      alert('Camera is not properly initialized. Please try enabling the camera again.');
      return;
    }

    setIsRecording(true);
    setIsGestureDetecting(true);
    setIsRecognitionActive(true);
    
    // Start the gesture recognition system
    startGestureRecognition();
    
    console.log('ISL Recognition started successfully');
  };

  const stopRecognition = () => {
    setIsRecording(false);
    setIsGestureDetecting(false);
    setIsRecognitionActive(false);
    
    // Stop the gesture recognition system
    stopGestureRecognition();
    
    // Clear current gesture data but keep recognized text
    setCurrentGesture('');
    setGestureConfidence(0);
    
    console.log('ISL Recognition stopped successfully');
  };

  const resetSession = () => {
    stopRecognition();
    setRecognizedText('');
    setCurrentGesture('');
    setGestureConfidence(0);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);


  const translateText = async (text: string, targetLang: string) => {
    try {
      // Skip translation when offline
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return text;
      }
      // Extract language code from voice name (e.g., "Microsoft Pallavi Online (Natural) - Tamil (India) (ta-IN)" -> "ta")
      const langCode = targetLang.split('-')[0].toLowerCase();
      
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract translated text from response
      if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        return data[0].map((sentence: any) => sentence[0]).join(' ');
      } else {
        throw new Error('Unexpected translation response format');
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  const speak = async (text: string, fromQuickPhrase = false) => {
    if (!text.trim()) return;
    
    try {
      // Get the language code from the selected voice
      const voiceLang = voices[selectedVoice]?.lang || 'en-US';
      
      // Only translate if the selected voice is not English
      let translatedText = text;
      if (!voiceLang.startsWith('en')) {
        // Extract the language code from the voice language
        const langCode = voiceLang.split('-')[0];
        translatedText = await translateText(text, langCode);
      }
      
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.voice = voices[selectedVoice];
      speechSynthesis.speak(utterance);
      
      setLastUtterance({ text: translatedText, voice: selectedVoice });
      localStorage.setItem('lastTTS', JSON.stringify({ text: translatedText, voice: selectedVoice }));
      setHistory(prev => [...prev, translatedText]); // add translated text to history
      
      // Only update recognizedText if not from quick phrase
      if (!fromQuickPhrase) {
        setRecognizedText(text); // Keep original text in the input field
      }
      
      // ISL conversion removed
    } catch (error) {
      console.error('Error in speak function:', error);
      // Fallback to original behavior if translation fails
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voices[selectedVoice];
      speechSynthesis.speak(utterance);
      
      setLastUtterance({ text, voice: selectedVoice });
      localStorage.setItem('lastTTS', JSON.stringify({ text, voice: selectedVoice }));
      setHistory(prev => [...prev, text]);
      
      if (!fromQuickPhrase) {
        setRecognizedText(text);
      }
      
      // ISL conversion removed
    }
  };

  const repeatLast = () => {
    const last = lastUtterance || JSON.parse(localStorage.getItem('lastTTS') || 'null');
    if (!last) return;
    const utterance = new SpeechSynthesisUtterance(last.text);
    utterance.voice = voices[last.voice];
    speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
  };

  const previewVoice = async () => {
    const previewText = 'Hello, this is a preview.';
    const voiceLang = voices[selectedVoice]?.lang || 'en-US';
    
    try {
      // Only translate preview text if the selected voice is not English
      let translatedPreview = previewText;
      if (!voiceLang.startsWith('en')) {
        // Extract the language code from the voice language
        const langCode = voiceLang.split('-')[0];
        translatedPreview = await translateText(previewText, langCode);
      }
      
      const utterance = new SpeechSynthesisUtterance(translatedPreview);
      utterance.voice = voices[selectedVoice];
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in preview voice:', error);
      // Fallback to original behavior
      const utterance = new SpeechSynthesisUtterance(previewText);
      utterance.voice = voices[selectedVoice];
      speechSynthesis.speak(utterance);
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-emerald-800 mb-2">
           Student to Teacher Communication
        </h2>
        <p className="text-emerald-600 text-lg mb-4">
          Perform signs in front of the camera and let AI convert them to text and speech
        </p>
        <button
          onClick={() => openHelp('isl-guide')}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <HelpCircle size={20} />
          <span>How to Use ISL Recognition</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
            <div className="mb-4 flex items-center justify-between relative">
              <h3 className="text-xl font-bold text-emerald-800 flex items-center">
                <Camera className="mr-2" size={24} />
                 Camera Feed
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openHelp('isl-guide')}
                  className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full font-medium hover:scale-105 transition-all duration-300"
                  aria-label="ISL Guide"
                >
                  📖 ISL Guide
                </button>
                <button
                  onClick={() => openHelp('camera')}
                  className="rounded-full p-3 bg-[#1E88E5] hover:bg-[#1976D2] text-white shadow-lg transition-colors"
                  aria-label="How to use"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
            </div>

            <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl overflow-hidden mb-4 relative">
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-emerald-600">
                  <div className="text-center">
                    <CameraOff size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Camera not enabled</p>
                    <p className="text-sm opacity-75">Click "Enable Camera" to start</p>
                  </div>
                </div>
              )}

              {/* Camera Status Indicator */}
              {cameraEnabled && (
                <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Camera Active</span>
                </div>
              )}

              {/* ISL Gesture Detection Overlay */}
              {isGestureDetecting && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <Hand size={16} />
                    <span className="text-sm font-medium">Analyzing ISL Gestures</span>
                  </div>
                </div>
              )}

              {/* Current Gesture Display */}
              {currentGesture && (
                <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye size={16} />
                      <span className="font-medium">Detected: {currentGesture}</span>
                    </div>
                    <div className="text-sm opacity-90">
                      {gestureConfidence}% confidence
                    </div>
                  </div>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Recording</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-between">
              <div className="flex gap-3">
                {!cameraEnabled ? (
                  <button
                    onClick={startCamera}
                    className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <Camera size={18} />
                    <span>Enable Camera</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopCamera}
                      className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      <CameraOff size={18} />
                      <span>Stop Camera</span>
                    </button>
                    
                    {!isRecording && (
                      <button
                        onClick={startRecognition}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                      >
                        <Play size={18} />
                        <span>Start Recognition</span>
                      </button>
                    )}

                    {isRecording && (
                      <button
                        onClick={stopRecognition}
                        className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                      >
                        <Pause size={18} />
                        <span>Stop Recognition</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={resetSession}
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <RotateCcw size={18} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recognition Results + TTS */}
        <div className="space-y-6">
          {/* ISL Gesture Text Output */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-emerald-800 flex items-center">
                <Hand className="mr-2" size={24} />
                🤟 ISL Gesture Output
              </h3>
              <div className="flex items-center space-x-2">
                {currentGesture && (
                  <div className="flex items-center space-x-2 bg-emerald-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-700">Live Detection</span>
                  </div>
                )}
                <button
                  onClick={() => openHelp('isl-guide')}
                  className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full font-medium hover:scale-105 transition-all duration-300"
                  aria-label="ISL Guide"
                >
                  📖 Guide
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 min-h-[120px] border-2 border-emerald-200">
              {currentGesture ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-emerald-800">Detected Gesture:</h4>
                    <span className="text-sm bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                      {gestureConfidence}% confidence
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-900">{currentGesture}</div>
                  <div className="text-lg text-emerald-700">
                    <strong>Text Output:</strong> {recognizedText}
                  </div>
                  {isGestureDetecting && (
                    <div className="flex items-center space-x-2 text-sm text-emerald-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Live detection active</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-emerald-500">
                  <div className="text-center">
                    <Hand size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No gesture detected</p>
                    <p className="text-sm opacity-75">
                      {isGestureDetecting 
                        ? "Perform ISL gestures in front of the camera" 
                        : "Start ISL Recognition to see gestures"
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Box with TTS Control Buttons */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
            <div className="mb-4 flex items-center justify-between relative">
              <h3 className="text-xl font-bold text-emerald-800 flex items-center">
                📝 Text Input & Controls
              </h3>
              <div className="relative">
                <button
                  onClick={() => openHelp('text')}
                  className="rounded-full p-3 bg-[#1E88E5] hover:bg-[#1976D2] text-white shadow-lg transition-colors"
                  aria-label="How to use text controls"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
            </div>

            {/* Text Input Area */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 min-h-[100px]">
              <textarea
                className="w-full h-full min-h-[80px] bg-transparent border-none outline-none resize-none text-gray-700 placeholder-gray-400"
                placeholder="Type your message here or recognized text will appear..."
                value={recognizedText}
                onChange={e => setRecognizedText(e.target.value)}
              />
            </div>

            {/* Voice Selection Dropdown */}
            <select
              className="w-full border border-gray-300 rounded-lg p-2 mb-3"
              value={selectedVoice}
              onChange={e => setSelectedVoice(Number(e.target.value))}
            >
              {voices.map((voice, i) => (
                <option key={i} value={i}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>

            {/* TTS Control Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={previewVoice}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span>🔊 Preview</span>
              </button>

              <button
                onClick={() => speak(recognizedText, false)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span>▶ Speak</span>
              </button>

              <button
                onClick={repeatLast}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span>🔁 Repeat</span>
              </button>

              <button
                onClick={stopSpeech}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span>⏹ Stop</span>
              </button>
            </div>
          </div>

          {/* 🆕 History Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-emerald-800 flex items-center">📜 History</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <History size={18} />
                  <span>{showHistory ? 'Hide' : 'Show'} History</span>
                </button>
                <button
                  onClick={clearHistory}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <Trash2 size={18} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {showHistory && (
              <ul className="space-y-2 max-h-40 overflow-y-auto text-gray-700">
                {history.length === 0 ? (
                  <li className="text-gray-400 italic">No history yet...</li>
                ) : (
                  history.map((item, i) => (
                    <li key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                      {item}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* ISL Translation section removed as requested */}

          {/* Quick Phrases - Extended Layout */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100">
            <div className="mb-4 flex items-center justify-between gap-2 relative">
              <h4 className="text-lg font-bold text-emerald-800 flex items-center">⚡ Quick Phrases</h4>
              <div className="relative ml-auto">
                <button
                  onClick={() => openHelp('quick')}
                  className="rounded-full p-3 bg-[#1E88E5] hover:bg-[#1976D2] text-white shadow-lg transition-colors"
                  aria-label="How to use quick phrases"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[
                { phrase: 'Excuse me mam, I have a doubt.', emoji: '🙋' },
                { phrase: 'Thank you, mam', emoji: '🙏' },
                { phrase: 'May I go out for a minute mam?', emoji: '🚶' },
                { phrase: 'Sorry, I forgot to bring my homework.', emoji: '😔' },
                { phrase: 'Will you give us extra time to finish?', emoji: '⏳' },
                { phrase: 'Can I answer this question mam?', emoji: '❓' },
                { phrase: 'I need help with this problem.', emoji: '🤔' },
                { phrase: 'Can you repeat that please?', emoji: '🔄' },
                { phrase: 'I don\'t understand.', emoji: '😕' },
                { phrase: 'Can I use the restroom?', emoji: '🚻' },
                { phrase: 'I finished my work.', emoji: '✅' },
                { phrase: 'What is the homework?', emoji: '📝' }
              ].map((item) => (
                <button
                  key={item.phrase}
                  onClick={() => {
                    speak(item.phrase, true);
                  }}
                  className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-lg p-3 transition-all duration-300 hover:scale-105"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <div className="text-left">
                    <p className="font-medium text-emerald-800 capitalize">{item.phrase}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeHelp}></div>
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1E88E5] text-white shadow">
                  <HelpCircle size={18} />
                </span>
                <span>How to Use</span>
              </div>
              <button onClick={closeHelp} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
              {helpTopic === 'camera' && (
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Enable Camera</span>
                    <p className="text-sm text-gray-600">Click "Enable Camera" and grant browser permission.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Start ISL Recognition</span>
                    <p className="text-sm text-gray-600">Press "Start ISL Recognition" to begin analyzing your Indian Sign Language gestures.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Perform ISL Gestures</span>
                    <p className="text-sm text-gray-600">Stay centered in front of the camera and perform clear ISL gestures for best recognition.</p>
                  </li>
                  <li>
                    <span className="font-semibold">View Results</span>
                    <p className="text-sm text-gray-600">Detected gestures will appear in the ISL Gesture Output section with confidence scores.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Stop or Reset</span>
                    <p className="text-sm text-gray-600">Use Stop to pause recognition, Reset to clear and start fresh.</p>
                  </li>
                </ol>
              )}

              {helpTopic === 'text' && (
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Type Text</span>
                    <p className="text-sm text-gray-600">Enter your message in the textbox.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Choose Voice</span>
                    <p className="text-sm text-gray-600">Pick a voice from the dropdown.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Preview</span>
                    <p className="text-sm text-gray-600">Tap Preview to sample the selected voice.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Speak</span>
                    <p className="text-sm text-gray-600">Press Speak to play your typed text aloud.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Repeat / Stop</span>
                    <p className="text-sm text-gray-600">Use Repeat to replay last speech, Stop to halt.</p>
                  </li>
                </ol>
              )}

              {helpTopic === 'quick' && (
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Pick a Phrase</span>
                    <p className="text-sm text-gray-600">Click any phrase from the list.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Auto Speak</span>
                    <p className="text-sm text-gray-600">The phrase will be spoken automatically in the selected voice.</p>
                  </li>
                  <li>
                    <span className="font-semibold">Control Playback</span>
                    <p className="text-sm text-gray-600">Use Speak/Repeat/Stop from Text Controls as needed.</p>
                  </li>
                </ol>
              )}

              {helpTopic === 'isl-guide' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-emerald-800 mb-2">ISL Recognition Guide</h3>
                    <p className="text-gray-600">Follow these steps to use the Indian Sign Language recognition system</p>
                  </div>
                  
                  <ol className="space-y-4">
                    <li className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">Enable Camera</h4>
                        <p className="text-sm text-gray-700">Click 'Enable Camera' and grant browser permission.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800 mb-1">Start ISL Recognition</h4>
                        <p className="text-sm text-gray-700">Press 'Start ISL Recognition' to begin analyzing your Indian Sign Language gestures.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-1">Perform ISL Gestures</h4>
                        <p className="text-sm text-gray-700">Stay centered in front of the camera and perform clear ISL gestures for best recognition.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-1">View Results</h4>
                        <p className="text-sm text-gray-700">Detected gestures will appear in the ISL Gesture Output section with confidence scores.</p>
                      </div>
                    </li>
                    
                    <li className="flex items-start space-x-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        5
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-800 mb-1">Stop or Reset</h4>
                        <p className="text-sm text-gray-700">Use Stop to pause recognition, Reset to clear and start fresh.</p>
                      </div>
                    </li>
                  </ol>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-2">💡 Tips for Best Results:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Ensure good lighting for clear gesture visibility</li>
                      <li>• Keep your hands within the camera frame</li>
                      <li>• Perform gestures slowly and clearly</li>
                      <li>• Wait for the system to process each gesture</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentToTeacher;

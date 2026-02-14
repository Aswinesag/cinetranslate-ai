import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Globe, Loader2, Copy, Check, Download, Sparkles } from "lucide-react";

export default function App() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [english, setEnglish] = useState("");
  const [malayalam, setMalayalam] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState({ english: false, malayalam: false });
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformActive, setWaveformActive] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    if (recording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setWaveformActive(true);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
      setWaveformActive(false);
    }
    
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [recording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to find a supported MIME type, fallback to webm
      let mimeType = 'audio/webm';
      const possibleTypes = [
        'audio/webm;codecs=opus',
        'audio/webm;codecs=vorbis',
        'audio/ogg;codecs=opus',
        'audio/wav',
        'audio/webm'
      ];
      
      for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioURL(URL.createObjectURL(blob));
        uploadAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAudio = async (blob) => {
    setIsProcessing(true);
    setEnglish("Processing...");
    setMalayalam("");

    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");

      const res = await fetch("http://127.0.0.1:8000/voice-translate", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error('Translation failed');
      }

      const data = await res.json();
      setEnglish(data.english || "No speech detected");
      setMalayalam(data.malayalam || "Translation not available");
    } catch (error) {
      console.error("Error:", error);
      setEnglish("Error: Could not process audio");
      setMalayalam("Please try again");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => {
      setCopied({ ...copied, [type]: false });
    }, 2000);
  };

  const downloadTranslation = () => {
    const content = `English: ${english}\nMalayalam: ${malayalam}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-6000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              CineTranslate AI
            </h1>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="p-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full shadow-lg shadow-pink-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          </div>
          <p className="text-xl text-gray-300 font-medium drop-shadow">Transform Your Voice into Any Language</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Powered by Advanced AI</span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
            
            {/* Recording Section */}
            <div className="text-center mb-10">
              <motion.div 
                className="inline-flex flex-col items-center gap-8"
                animate={{ scale: recording ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 1, repeat: recording ? Infinity : 0 }}
              >
                {/* Recording Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={recording ? stopRecording : startRecording}
                  className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
                    recording 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-2xl shadow-red-500/40' 
                      : 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60'
                  }`}
                >
                  {recording ? (
                    <>
                      <MicOff className="w-14 h-14 text-white" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-300"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-pink-300"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      />
                    </>
                  ) : (
                    <Mic className="w-14 h-14 text-white" />
                  )}
                </motion.button>

                {/* Recording Status */}
                <div className="text-center">
                  <p className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
                    {recording ? "🎙️ Recording..." : isProcessing ? "⚡ Processing..." : "🎯 Click to Start"}
                  </p>
                  {recording && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-4xl font-mono font-bold text-red-400 drop-shadow-lg"
                    >
                      {formatTime(recordingTime)}
                    </motion.div>
                  )}
                </div>

                {/* Animated Waveform */}
                <AnimatePresence>
                  {waveformActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center gap-1 h-16"
                    >
                      {[...Array(25)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-cyan-400 via-purple-400 to-pink-400 rounded-full shadow-lg"
                          animate={{ 
                            height: [Math.random() * 15 + 8, Math.random() * 35 + 25, Math.random() * 15 + 8] 
                          }}
                          transition={{ 
                            duration: 0.6, 
                            repeat: Infinity, 
                            delay: i * 0.08 
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Audio Player */}
            <AnimatePresence>
              {audioURL && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-10"
                >
                  <div className="bg-gradient-to-r from-white/8 to-white/4 rounded-2xl p-6 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg shadow-cyan-500/30">
                        <Volume2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-lg bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">Your Recording</span>
                    </div>
                    <audio controls src={audioURL} className="w-full h-12 rounded-lg" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Translation Results */}
            <AnimatePresence>
              {(english || malayalam) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* English Translation */}
                  <motion.div 
                    className="bg-gradient-to-r from-white/8 to-white/4 rounded-2xl p-8 border border-white/10 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/30">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">English</span>
                          <p className="text-xs text-gray-400 mt-1">Original Speech</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(english, 'english')}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/10"
                      >
                        {copied.english ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-300" />}
                      </motion.button>
                    </div>
                    <p className="text-gray-100 text-xl leading-relaxed font-medium">
                      {isProcessing ? (
                        <span className="flex items-center gap-3 text-cyan-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing your speech...</span>
                        </span>
                      ) : (
                        english
                      )}
                    </p>
                  </motion.div>

                  {/* Malayalam Translation */}
                  <motion.div 
                    className="bg-gradient-to-r from-white/8 to-white/4 rounded-2xl p-8 border border-white/10 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/30">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">മലയാളം</span>
                          <p className="text-xs text-gray-400 mt-1">Malayalam Translation</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(malayalam, 'malayalam')}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/10"
                      >
                        {copied.malayalam ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-300" />}
                      </motion.button>
                    </div>
                    <p className="text-gray-100 text-xl leading-relaxed font-medium">
                      {isProcessing ? (
                        <span className="flex items-center gap-3 text-purple-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Translating to Malayalam...</span>
                        </span>
                      ) : (
                        malayalam
                      )}
                    </p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-4 justify-center pt-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(english, 'english')}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 flex items-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Copy English
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(malayalam, 'malayalam')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 flex items-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Copy Malayalam
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={downloadTranslation}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-200 flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Translation
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>AI Powered</span>
            </div>
            <span>•</span>
            <span>Real-time Translation</span>
            <span>•</span>
            <span>High Accuracy</span>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Made with ❤️ using Advanced AI Technology
          </p>
        </motion.div>
      </div>
    </div>
  );
}
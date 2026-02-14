import { motion } from "framer-motion";
import { ArrowRightLeft, Copy, Languages, Mic, Sparkles, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function App() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [english, setEnglish] = useState("");
  const [malayalam, setMalayalam] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState({ english: false, malayalam: false });
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const mimeTypeRef = useRef(null);

  useEffect(() => {
    if (recording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      const possibleTypes = [
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm;codecs=vorbis',
        'audio/ogg;codecs=opus',
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
      // Store the mimeType for later use
      mimeTypeRef.current = mimeType;

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mimeTypeRef.current;
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioURL(URL.createObjectURL(blob));
        uploadAudio(blob, mimeType);
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

  const uploadAudio = async (blob, mimeType) => {
    setIsProcessing(true);
    setEnglish("Processing...");
    setMalayalam("");

    try {
      const formData = new FormData();
      // Determine extension based on mimeType
      const extension = mimeType.includes('wav') ? 'audio.wav' : 'audio.webm';
      formData.append("file", blob, extension);

      const res = await fetch("http://127.0.0.1:8000/voice-translate", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error('Translation failed');

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

  // Optional: Text to speech function (mockup for now as backend might not support it yet)
  const playAudio = (text) => {
    // Implement standard browser TTS if desired, or just log
    console.log("Playing audio:", text);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-vox-dark bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent text-gray-100 font-sans selection:bg-cyan-500/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <header className="flex flex-col items-center justify-center gap-4 mb-12 pt-8">
          <div className="p-3 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-2xl border border-white/5 backdrop-blur-sm">
            <Languages className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
            CineTranslate AI
          </h1>
        </header>

        {/* Language "Selectors" (Visual only as requested) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16 px-4">
          <div className="bg-vox-card border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 w-full md:w-64 cursor-default transition-all hover:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">FROM</span>
              <span className="font-medium text-gray-200">US English</span>
            </div>
          </div>

          <div className="p-3 rounded-full bg-gray-800/50 text-gray-400 border border-white/5">
            <ArrowRightLeft className="w-5 h-5" />
          </div>

          <div className="bg-vox-card border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 w-full md:w-64 cursor-default transition-all hover:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TO</span>
              <span className="font-medium text-gray-200">Malayalam</span>
            </div>
          </div>
        </div>

        {/* Main Interaction Area */}
        <div className="relative mb-20">
          <div className="flex flex-col items-center justify-center">

            {/* Audio Wave Visualization (Decorative) */}
            <div className="h-8 flex items-center gap-1 mb-8 opacity-50">
              {recording ? [...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full"
                  animate={{ height: [4, 16 + Math.random() * 16, 4] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                />
              )) : (
                <div className="flex gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-gray-700 rounded-full" />
                  ))}
                </div>
              )}
            </div>

            {/* Microphone Button */}
            <div className="relative group">
              {/* Pulse Rings */}
              {recording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse-ring" />
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse-ring animation-delay-2000" />
                </>
              )}

              <button
                onClick={recording ? stopRecording : startRecording}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)]
                  ${recording
                    ? 'bg-gradient-to-br from-red-500 to-pink-600 scale-110 shadow-[0_0_60px_-10px_rgba(239,68,68,0.5)]'
                    : 'bg-gradient-to-br from-cyan-400 to-blue-500 hover:scale-105 group-hover:shadow-[0_0_60px_-10px_rgba(34,211,238,0.5)]'
                  }`}
              >
                {recording ? (
                  <Square className="w-8 h-8 text-white fill-current" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>
            </div>

            <p className="mt-8 text-gray-400 font-medium tracking-wide">
              {recording ? "Listening..." : isProcessing ? "Processing..." : "Tap to start speaking"}
            </p>
          </div>
        </div>

        {/* Translation Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Source Card (English) */}
          <div className="bg-vox-card border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col h-[280px] group transition-all hover:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider">ORIGINAL</span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(english, 'english')}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  {copied.english ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => playAudio(english)}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={english}
              placeholder="Your speech will appear here..."
              className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed text-gray-300 placeholder-gray-600/50 scrollbar-thin outline-none"
            />
          </div>

          {/* Target Card (Malayalam) */}
          <div className="bg-vox-card border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col h-[280px] group transition-all hover:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider">TRANSLATION</span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(malayalam, 'malayalam')}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  {copied.malayalam ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => playAudio(malayalam)}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-vox-card/50 backdrop-blur-sm z-10 rounded-lg">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce animation-delay-200" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce animation-delay-400" />
                  </div>
                </div>
              )}
              <textarea
                readOnly
                value={malayalam}
                placeholder="Translation will appear here..."
                className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed text-gray-300 placeholder-gray-600/50 scrollbar-thin outline-none"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Power, 
  Minimize2, 
  Maximize2, 
  Send, 
  Sparkles, 
  Stethoscope, 
  Bot, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Navigation as NavIcon
} from 'lucide-react';
import ThreeDoctorHead from './ThreeDoctorHead';
import { resolveDoctorInstruction } from './clinicalDentalBrain';
import aiVoice from '../../utils/aiVoiceAssistant';

export default function Doctor3DAssistantWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Master Enable / Disable Toggle (Persisted in localStorage)
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('dentia_3d_doctor_active');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // UI States
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [mood, setMood] = useState('neutral'); // 'neutral' | 'alert' | 'success'
  const [inputText, setInputText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready for doctor voice instruction');

  // Conversation history
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: 'Greetings Doctor! I am your 3D Dental Operatory Copilot. Speak your clinical questions, check contraindications, or instruct me to navigate.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Persist Enabled state
  const toggleEnabled = () => {
    const nextVal = !isEnabled;
    setIsEnabled(nextVal);
    try {
      localStorage.setItem('dentia_3d_doctor_active', String(nextVal));
    } catch {}
    if (!nextVal) {
      stopListening();
      aiVoice.stop();
      setIsSpeaking(false);
    }
  };

  // Sync with global aiVoiceAssistant for validation alerts
  useEffect(() => {
    const unsubscribe = aiVoice.subscribe((voiceState) => {
      setIsSpeaking(voiceState.speaking);
      if (voiceState.speaking && voiceState.currentText) {
        setMood(voiceState.currentText.includes('Doctor, please check') ? 'alert' : 'success');
        setStatusMessage(voiceState.currentText);
      } else if (!voiceState.speaking) {
        setMood('neutral');
        setStatusMessage(isListening ? 'Listening to Doctor...' : 'Ready for doctor voice instruction');
      }
    });

    return () => unsubscribe();
  }, [isListening]);

  // 2. Web Speech Recognition Setup (Doctor Speaks)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening to doctor speech...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleDoctorSpokenCommand(transcript);
        }
      };

      recognition.onerror = (err) => {
        console.warn('[Doctor3DAssistant] Speech Recognition Error:', err);
        setIsListening(false);
        setStatusMessage('Microphone error or permission denied');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('[Doctor3DAssistant] Recognition start error:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // 3. Process Doctor Command, Speak Reply & Execute Website Action
  const handleDoctorSpokenCommand = (transcript) => {
    if (!transcript.trim()) return;

    // Add Doctor's instruction to chat
    const doctorMsg = {
      sender: 'doctor',
      text: transcript,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, doctorMsg]);

    // Resolve clinical intent and actions
    const resolution = resolveDoctorInstruction(transcript);

    const aiMsg = {
      sender: 'ai',
      title: resolution.title,
      text: resolution.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, aiMsg]);
    setStatusMessage(resolution.text);

    // If website navigation is instructed, navigate smoothly
    if (resolution.action && resolution.action.type === 'NAVIGATE') {
      setTimeout(() => {
        navigate(resolution.action.path);
      }, 1000);
    }

    // Speak answer back through 3D Avatar (Lip-sync activates)
    if (!isAudioMuted) {
      aiVoice.speak(resolution.text, { rate: 1.0, pitch: 1.05 });
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleDoctorSpokenCommand(inputText);
      setInputText('');
    }
  };

  // Quick Action Prompts
  const quickActions = [
    { label: 'Explain Bone Graft', cmd: 'Explain dental bone graft procedure' },
    { label: 'Check Penicillin Allergy', cmd: 'Check penicillin allergy contraindications' },
    { label: 'Go to New Patient', cmd: 'Go to new patient' },
    { label: 'Go to Appointments', cmd: 'Go to appointments' },
    { label: 'Tooth 16 Anatomy', cmd: 'Tell me about tooth 16 anatomy' }
  ];

  // =========================================================================
  // RENDER 1: DISABLED STATE (Non-intrusive floating medical pill)
  // =========================================================================
  if (!isEnabled) {
    return (
      <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50">
        <button
          onClick={toggleEnabled}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-teal-500/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 group cursor-pointer"
          title="Enable 3D Talking Doctor Assistant"
        >
          <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/30">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none text-white">3D AI Doctor</p>
            <p className="text-[10px] text-teal-400/80 font-medium">Click to Enable</p>
          </div>
          <Power className="w-4 h-4 text-slate-400 group-hover:text-teal-400 ml-1" />
        </button>
      </aside>
    );
  }

  // =========================================================================
  // RENDER 2: MINIMIZED FLOATING BUBBLE
  // =========================================================================
  if (isMinimized) {
    return (
      <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <div 
          onClick={() => setIsMinimized(false)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-teal-400 shadow-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          title="Expand 3D Doctor Copilot"
        >
          <ThreeDoctorHead 
            isSpeaking={isSpeaking} 
            isListening={isListening} 
            mood={mood}
            className="w-full h-full"
          />
          {isListening && (
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
          {isSpeaking && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-slate-900 animate-ping" />
          )}
        </div>
        <button
          onClick={toggleEnabled}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-red-400 transition"
          title="Turn OFF 3D Doctor"
        >
          <Power className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // =========================================================================
  // RENDER 3: FULL ACTIVE 3D TALKING DOCTOR ASSISTANT
  // =========================================================================
  return (
    <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-2.5rem)] rounded-2xl bg-slate-950/95 border border-teal-500/40 shadow-2xl shadow-teal-950/30 backdrop-blur-2xl text-white flex flex-col overflow-hidden font-sans transition-all duration-300 ring-1 ring-white/10">
      
      {/* Top Header Bar with Enable/Disable & Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Bot className="w-4 h-4" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-wide text-white">Dr. Sarah (3D Copilot)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                100% FREE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Speech-Driven Operatory Assistant</p>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button 
            onClick={() => setIsAudioMuted(!isAudioMuted)} 
            className={`p-1.5 rounded-lg transition ${isAudioMuted ? 'text-amber-400 bg-amber-500/10' : 'hover:text-white hover:bg-slate-800'}`}
            title={isAudioMuted ? "Unmute Voice Audio" : "Mute Voice Audio"}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
            title="Minimize to Bubble"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Explicit Disable Toggle Button */}
          <button 
            onClick={toggleEnabled} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Disable / Turn OFF 3D Doctor"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Doctor Canvas Stage */}
      <div className="relative w-full h-52 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
        <ThreeDoctorHead 
          isSpeaking={isSpeaking} 
          isListening={isListening} 
          mood={mood} 
          className="w-full h-full"
        />

        {/* Live Status Overlay Pill */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border ${
            isListening 
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
              : isSpeaking 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
              : 'bg-slate-800/80 text-teal-300 border-teal-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isListening ? 'bg-red-400 animate-ping' : isSpeaking ? 'bg-cyan-400' : 'bg-teal-400'
            }`} />
            {isListening ? 'Listening to Doctor...' : isSpeaking ? 'Speaking Advice...' : 'Watching Operatory'}
          </span>

          <span className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800">
            {location.pathname}
          </span>
        </div>

        {/* Spoken Status Caption */}
        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 truncate">
          {statusMessage}
        </div>
      </div>

      {/* Quick Clinical Action Chips */}
      <div className="px-3 py-2 bg-slate-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800/80">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleDoctorSpokenCommand(action.cmd)}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-teal-500/20 text-[10px] text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 transition cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Transcript Area */}
      <div className="h-32 overflow-y-auto px-3 py-2 space-y-2 text-xs bg-slate-950/60">
        {chatLog.map((msg, index) => (
          <div 
            key={index}
            className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed ${
              msg.sender === 'doctor'
                ? 'bg-teal-600 text-white rounded-br-none shadow-md'
                : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
            }`}>
              {msg.title && (
                <p className="text-[10px] font-bold text-teal-400 mb-0.5">{msg.title}</p>
              )}
              <p className="text-xs">{msg.text}</p>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input & Voice Controls Footer */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        {/* Main Microphone Button */}
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            isListening 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105 animate-pulse' 
              : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20'
          }`}
          title={isListening ? "Stop Listening" : "Speak to 3D Doctor"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input Fallback */}
        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Speak or type clinical instruction..."}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-teal-600 disabled:opacity-40 text-white transition cursor-pointer"
            title="Send Instruction"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </aside>
  );
}

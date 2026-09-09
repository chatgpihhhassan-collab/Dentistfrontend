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
  Navigation as NavIcon,
  Copy,
  Check,
  Compass,
  ShieldAlert,
  FileCode2,
  Layers,
  Activity
} from 'lucide-react';
import ThreeDoctorHead from './ThreeDoctorHead';
import { resolveDoctorInstruction, PLATFORM_SECTIONS, API_CATALOG } from './clinicalDentalBrain';
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
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Clinical' | 'Actions' | 'Safety' | 'Navigation'
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Extract route context
  const getRouteContext = () => {
    const path = location.pathname;
    if (path.startsWith('/chart/')) {
      const pId = path.split('/')[2];
      return {
        label: `Chart Mode: Patient #${pId}`,
        badge: '3D Odontogram Active',
        color: 'text-teal-300 border-teal-500/30 bg-teal-500/10'
      };
    }
    if (path === '/new-patient') {
      return {
        label: 'Smart Intake Mode',
        badge: 'Validation & Arch Sync',
        color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
      };
    }
    if (path === '/appointments') {
      return {
        label: 'Schedule Mode',
        badge: 'Operatory Calendar',
        color: 'text-blue-300 border-blue-500/30 bg-blue-500/10'
      };
    }
    if (path === '/book') {
      return {
        label: 'Booking Mode',
        badge: 'Conflict Checking',
        color: 'text-amber-300 border-amber-500/30 bg-amber-500/10'
      };
    }
    if (path === '/directory') {
      return {
        label: 'Records Mode',
        badge: '17-Table Master Directory',
        color: 'text-purple-300 border-purple-500/30 bg-purple-500/10'
      };
    }
    if (path === '/ai-notes') {
      return {
        label: 'SOAP Notes Mode',
        badge: 'Ambient Scribe Archive',
        color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      };
    }
    return {
      label: 'Workspace Mode',
      badge: 'All Systems Ready',
      color: 'text-slate-300 border-slate-700 bg-slate-800/40'
    };
  };

  const routeCtx = getRouteContext();

  // Conversation history
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      category: 'System',
      title: '3D Clinical Copilot Online',
      text: 'Greetings Doctor! I am your 3D Dental Operatory Copilot. I have full knowledge of all platform sections, 17 API tables, tooth actions, and clinical safety contraindications. How may I assist you today?',
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

  // Web Speech Recognition Setup
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

  // Process Doctor Command, Speak Reply & Execute Website Action
  const handleDoctorSpokenCommand = (transcript) => {
    if (!transcript.trim()) return;

    const doctorMsg = {
      sender: 'doctor',
      text: transcript,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, doctorMsg]);

    // Extract patientId if on chart page
    let activePatientId = null;
    if (location.pathname.startsWith('/chart/')) {
      activePatientId = location.pathname.split('/')[2];
    }

    // Resolve clinical intent with full platform context
    const resolution = resolveDoctorInstruction(transcript, {
      pathname: location.pathname,
      patientId: activePatientId
    });

    const aiMsg = {
      sender: 'ai',
      category: resolution.category,
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
      }, 900);
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

  const copyToClipboard = (text, index) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Categorized Quick Action Prompts
  const promptTabs = ['All', 'Clinical', 'Actions', 'Safety', 'Navigation'];
  const allPrompts = [
    { cat: 'Clinical', label: 'Explain Bone Graft (D7953)', cmd: 'Explain dental bone graft procedure' },
    { cat: 'Safety', label: 'Penicillin Allergy Protocol', cmd: 'Check penicillin allergy contraindications' },
    { cat: 'Safety', label: 'Hypertension & Anesthesia', cmd: 'What anesthesia to use for hypertensive patient?' },
    { cat: 'Actions', label: 'Root Canal vs Extraction', cmd: 'When should I do root canal vs extraction?' },
    { cat: 'Actions', label: 'Crown Ferrule Rule', cmd: 'What are the crown preparation ferrule rules?' },
    { cat: 'Clinical', label: 'Tooth 16 Anatomy (MB2)', cmd: 'Tell me about tooth 16 anatomy' },
    { cat: 'Clinical', label: 'New Patient Intake Rules', cmd: 'What are the rules for new patient registration and arch classification?' },
    { cat: 'Navigation', label: 'Go to Samra Chart', cmd: 'Open patient chart for Samra' },
    { cat: 'Navigation', label: 'Go to New Patient', cmd: 'Go to new patient' },
    { cat: 'Navigation', label: 'Go to Appointments', cmd: 'Go to appointments' },
    { cat: 'Navigation', label: 'Go to Directory', cmd: 'Go to patient directory' }
  ];

  const filteredPrompts = activeTab === 'All' 
    ? allPrompts 
    : allPrompts.filter(p => p.cat === activeTab);

  // =========================================================================
  // RENDER 1: DISABLED STATE (Discrete floating medical pill)
  // =========================================================================
  if (!isEnabled) {
    return (
      <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50">
        <button
          onClick={toggleEnabled}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-950/90 hover:bg-slate-900 text-white rounded-full shadow-2xl border border-teal-500/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 group cursor-pointer ring-1 ring-teal-500/20"
          title="Enable 3D Talking Doctor Assistant"
        >
          <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/30">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none text-white">3D AI Doctor</p>
            <p className="text-[10px] text-teal-400 font-medium">Click to Enable</p>
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
          className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 border-2 border-teal-400 shadow-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-110 flex items-center justify-center group ring-4 ring-teal-500/10"
          title="Expand 3D Doctor Copilot"
        >
          <ThreeDoctorHead 
            isSpeaking={isSpeaking} 
            isListening={isListening} 
            mood={mood}
            className="w-full h-full"
          />
          {isListening && (
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse" />
          )}
          {isSpeaking && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping" />
          )}
        </div>
        <button
          onClick={toggleEnabled}
          className="p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
          title="Turn OFF 3D Doctor"
        >
          <Power className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // =========================================================================
  // RENDER 3: FULL ULTRA-PREMIUM 3D TALKING DOCTOR COPILOT
  // =========================================================================
  return (
    <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50 w-[410px] max-w-[calc(100vw-2rem)] rounded-3xl bg-slate-950/95 border border-teal-500/30 shadow-2xl shadow-teal-950/50 backdrop-blur-2xl text-white flex flex-col overflow-hidden font-sans transition-all duration-300 ring-1 ring-white/10">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-inner">
              <Bot className="w-4 h-4" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
            {isListening && (
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-white">Dr. Sarah (3D Copilot)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                100% FREE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Clinical Brain & 17 SQL Schemas Synced
            </p>
          </div>
        </div>

        {/* Window Action Buttons */}
        <div className="flex items-center gap-1 text-slate-400">
          <button 
            onClick={() => setIsAudioMuted(!isAudioMuted)} 
            className={`p-1.5 rounded-xl transition cursor-pointer ${isAudioMuted ? 'text-amber-400 bg-amber-500/10' : 'hover:text-white hover:bg-slate-800'}`}
            title={isAudioMuted ? "Unmute Voice Audio" : "Mute Voice Audio"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-1.5 rounded-xl hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Minimize to Bubble"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button 
            onClick={toggleEnabled} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            title="Disable / Turn OFF 3D Doctor"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Stage */}
      <div className="relative w-full h-48 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-800/80">
        <ThreeDoctorHead 
          isSpeaking={isSpeaking} 
          isListening={isListening} 
          mood={mood} 
          className="w-full h-full"
        />

        {/* Dynamic Context Header Badges */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border ${
            isListening 
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
              : isSpeaking 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
              : 'bg-slate-900/80 text-teal-300 border-teal-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isListening ? 'bg-red-400 animate-ping' : isSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-teal-400'
            }`} />
            {isListening ? 'Listening to Doctor...' : isSpeaking ? 'Speaking Dental Advice...' : 'Watching Operatory'}
          </span>

          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border backdrop-blur-md font-medium ${routeCtx.color}`}>
            {routeCtx.label}
          </span>
        </div>

        {/* Live Audio Visualizer Wave Effect */}
        {(isSpeaking || isListening) && (
          <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none">
            {[0.4, 0.8, 1.2, 0.7, 1.4, 0.9, 0.5].map((h, i) => (
              <span 
                key={i} 
                className={`w-1 rounded-full transition-all duration-150 ${isListening ? 'bg-red-400' : 'bg-teal-400'}`}
                style={{
                  height: `${Math.max(6, h * 16)}px`,
                  animation: 'pulse 0.6s infinite alternate',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Status Message Caption */}
        <div className="absolute bottom-2 left-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 truncate">
          {statusMessage}
        </div>
      </div>

      {/* Categorized Filter Tabs */}
      <div className="px-3 pt-2 pb-1.5 bg-slate-950 flex items-center gap-1 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
        {promptTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
              activeTab === tab
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Quick Clinical Action Chips */}
      <div className="px-3 py-2 bg-slate-950/90 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800/80">
        {filteredPrompts.map((action, i) => (
          <button
            key={i}
            onClick={() => handleDoctorSpokenCommand(action.cmd)}
            className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-teal-500/20 text-[10px] text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 transition cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-2.5 h-2.5 text-teal-400" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Transcript Area */}
      <div className="h-36 overflow-y-auto px-3.5 py-2.5 space-y-2.5 text-xs bg-slate-950/60">
        {chatLog.map((msg, index) => (
          <div 
            key={index}
            className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed relative group ${
              msg.sender === 'doctor'
                ? 'bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-900/30'
                : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
            }`}>
              {msg.title && (
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-teal-400 tracking-wide">{msg.title}</span>
                  {msg.category && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {msg.category}
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs">{msg.text}</p>
              
              {/* Copy Advice Button */}
              {msg.sender === 'ai' && (
                <button
                  onClick={() => copyToClipboard(msg.text, index)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Copy clinical advice"
                >
                  {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input & Voice Controls Footer */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        {/* Main Microphone Button */}
        <button
          onClick={toggleListening}
          className={`p-3 rounded-2xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            isListening 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-105 animate-pulse' 
              : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30'
          }`}
          title={isListening ? "Stop Listening" : "Speak to 3D Doctor Copilot"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input Fallback */}
        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Ask clinical question, tooth action, ADA code..."}
            className="w-full bg-slate-950 border border-slate-700/70 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-teal-600 disabled:opacity-40 text-white transition cursor-pointer"
            title="Send Instruction"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </aside>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Power, 
  Minimize2, 
  Send, 
  Sparkles, 
  Stethoscope, 
  Copy, 
  Check
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
  const [mood, setMood] = useState('neutral');
  const [inputText, setInputText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready for doctor voice instruction');
  const [activeTab, setActiveTab] = useState('All');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Dynamic Route Context Detection
  const getRouteContext = () => {
    const path = location.pathname;
    if (path.startsWith('/chart/')) {
      const pId = path.split('/')[2];
      return { label: `Chart # ${pId}`, tag: '3D Odontogram' };
    }
    if (path === '/new-patient') {
      return { label: 'New Intake', tag: 'Arch Auto-Sync' };
    }
    if (path === '/appointments') {
      return { label: 'Schedule', tag: 'Operatory Cal' };
    }
    if (path === '/book') {
      return { label: 'Booking', tag: 'Conflict Guard' };
    }
    if (path === '/directory') {
      return { label: 'Directory', tag: '17 SQL Tables' };
    }
    if (path === '/ai-notes') {
      return { label: 'SOAP Notes', tag: 'Voice Scribe' };
    }
    return { label: 'Workspace', tag: 'Copilot Synced' };
  };

  const routeCtx = getRouteContext();

  // Conversation history
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      category: 'System',
      title: 'Dr. Sarah — Clinical Copilot Online',
      text: 'Greetings Doctor! I am your 3D Dental Operatory Copilot. Speak clinical questions, check drug contraindications, or ask me to navigate.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

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

  // Web Speech Recognition
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

  const handleDoctorSpokenCommand = (transcript) => {
    if (!transcript.trim()) return;

    const doctorMsg = {
      sender: 'doctor',
      text: transcript,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, doctorMsg]);

    let activePatientId = null;
    if (location.pathname.startsWith('/chart/')) {
      activePatientId = location.pathname.split('/')[2];
    }

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

    if (resolution.action && resolution.action.type === 'NAVIGATE') {
      setTimeout(() => {
        navigate(resolution.action.path);
      }, 900);
    }

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
  const promptTabs = ['All', 'Clinical', 'Actions', 'Safety', 'Nav'];
  const allPrompts = [
    { cat: 'Clinical', label: 'Bone Graft (D7953)', cmd: 'Explain dental bone graft procedure' },
    { cat: 'Safety', label: 'Penicillin Allergy', cmd: 'Check penicillin allergy contraindications' },
    { cat: 'Safety', label: 'Hypertension & Anesthesia', cmd: 'What anesthesia to use for hypertensive patient?' },
    { cat: 'Actions', label: 'RCT vs Extraction', cmd: 'When should I do root canal vs extraction?' },
    { cat: 'Actions', label: 'Crown Ferrule Rule', cmd: 'What are the crown preparation ferrule rules?' },
    { cat: 'Clinical', label: 'Tooth 16 (MB2)', cmd: 'Tell me about tooth 16 anatomy' },
    { cat: 'Clinical', label: 'Intake & Arch Rules', cmd: 'What are the rules for new patient registration and arch classification?' },
    { cat: 'Nav', label: 'Samra Chart', cmd: 'Open patient chart for Samra' },
    { cat: 'Nav', label: 'New Patient', cmd: 'Go to new patient' },
    { cat: 'Nav', label: 'Appointments', cmd: 'Go to appointments' }
  ];

  const filteredPrompts = activeTab === 'All' 
    ? allPrompts 
    : allPrompts.filter(p => p.cat === activeTab);

  // =========================================================================
  // RENDER 1: DISABLED STATE (Floating Sleek Pill)
  // =========================================================================
  if (!isEnabled) {
    return (
      <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50">
        <button
          onClick={toggleEnabled}
          className="flex items-center gap-3 px-4 py-2 bg-slate-950/90 hover:bg-slate-900 text-white rounded-full shadow-2xl border border-teal-500/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 group cursor-pointer ring-1 ring-teal-500/20"
          title="Enable 3D Talking Doctor Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/30">
            <Stethoscope className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold leading-none text-white">3D AI Doctor</p>
            <p className="text-[10px] text-teal-400">Click to Enable</p>
          </div>
          <Power className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400 ml-0.5" />
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
          className="relative w-15 h-15 rounded-full bg-slate-950 border-2 border-teal-400 shadow-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-110 flex items-center justify-center group ring-4 ring-teal-500/10"
          title="Expand 3D Doctor Copilot"
        >
          <ThreeDoctorHead 
            isSpeaking={isSpeaking} 
            isListening={isListening} 
            mood={mood}
            className="w-full h-full"
          />
          {isListening && (
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse" />
          )}
          {isSpeaking && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping" />
          )}
        </div>
        <button
          onClick={toggleEnabled}
          className="p-2 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-red-400 transition cursor-pointer"
          title="Turn OFF 3D Doctor"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  // =========================================================================
  // RENDER 3: ULTRA-PREMIUM APPLE-STYLE CLINICAL 3D COPILOT
  // =========================================================================
  return (
    <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50 w-[370px] max-w-[calc(100vw-2rem)] rounded-[26px] bg-slate-950/92 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] backdrop-blur-2xl text-white flex flex-col overflow-hidden font-sans transition-all duration-300 ring-1 ring-teal-500/20">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-white">Dr. Sarah</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-teal-500/15 text-teal-300 border border-teal-500/25">
              3D AI
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button 
            onClick={() => setIsAudioMuted(!isAudioMuted)} 
            className={`p-1.5 rounded-lg transition cursor-pointer ${isAudioMuted ? 'text-amber-400 bg-amber-500/10' : 'hover:text-white hover:bg-white/[0.06]'}`}
            title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={toggleEnabled} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            title="Turn Off"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Holographic 3D Viewport Stage */}
      <div className="relative w-full h-[155px] bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 overflow-hidden flex items-center justify-center border-b border-white/[0.06]">
        {/* Soft Radial Ambient Backlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.12)_0%,transparent_70%)] pointer-events-none" />

        <ThreeDoctorHead 
          isSpeaking={isSpeaking} 
          isListening={isListening} 
          mood={mood} 
          className="w-full h-full"
        />

        {/* Floating Top Status Badges */}
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none text-[10px]">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium backdrop-blur-md border ${
            isListening 
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
              : isSpeaking 
              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
              : 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isListening ? 'bg-red-400 animate-ping' : isSpeaking ? 'bg-teal-400 animate-pulse' : 'bg-teal-400'
            }`} />
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Operatory Synced'}
          </span>

          <span className="text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full backdrop-blur-md">
            {routeCtx.label}
          </span>
        </div>

        {/* Floating Bottom Status Pill */}
        <div className="absolute bottom-2 left-3 right-3 text-center pointer-events-none">
          <p className="text-[11px] text-slate-300/90 font-medium px-2.5 py-1 rounded-full bg-slate-950/70 border border-white/[0.08] backdrop-blur-md truncate inline-block max-w-full">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* 3. Segmented Control Tabs */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between bg-slate-950">
        <div className="w-full flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {promptTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 rounded-md text-[10px] font-medium transition cursor-pointer text-center ${
                activeTab === tab
                  ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Quick Action Chips (No ugly scrollbar) */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-white/[0.06]">
        {filteredPrompts.map((action, i) => (
          <button
            key={i}
            onClick={() => handleDoctorSpokenCommand(action.cmd)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-teal-500/15 text-[10px] text-slate-300 hover:text-teal-300 border border-white/[0.08] hover:border-teal-500/30 transition cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-teal-400/80" />
            {action.label}
          </button>
        ))}
      </div>

      {/* 5. Chat Transcript Area (Sleek dark custom scrollbar) */}
      <div className="h-[140px] overflow-y-auto px-3.5 py-2.5 space-y-2 text-xs bg-slate-950/40 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {chatLog.map((msg, index) => (
          <div 
            key={index}
            className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[90%] rounded-2xl px-3 py-2 leading-relaxed relative group ${
              msg.sender === 'doctor'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-br-none shadow-sm'
                : 'bg-white/[0.04] text-slate-200 border border-white/[0.08] rounded-bl-none shadow-sm'
            }`}>
              {msg.title && (
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-teal-300">{msg.title}</span>
                  {msg.category && (
                    <span className="text-[8px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                      {msg.category}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-200 leading-normal">{msg.text}</p>
              
              {/* Copy Advice Button */}
              {msg.sender === 'ai' && (
                <button
                  onClick={() => copyToClipboard(msg.text, index)}
                  className="absolute top-1.5 right-1.5 p-1 rounded bg-black/40 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Copy"
                >
                  {copiedIndex === index ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              )}
            </div>
            <span className="text-[8px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 6. Input Footer */}
      <div className="p-2.5 bg-white/[0.02] border-t border-white/[0.06] flex items-center gap-2">
        {/* Main Microphone Button */}
        <button
          onClick={toggleListening}
          className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
            isListening 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse' 
              : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
          }`}
          title={isListening ? "Stop" : "Speak"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input */}
        <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask clinical question or action..."}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-teal-500 hover:text-slate-950 disabled:opacity-30 text-white transition cursor-pointer"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </aside>
  );
}

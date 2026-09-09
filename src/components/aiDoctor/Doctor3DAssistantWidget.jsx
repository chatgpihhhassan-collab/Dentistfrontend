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
  Paperclip, 
  Sparkles, 
  Copy, 
  Check, 
  X,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  Calendar,
  ExternalLink
} from 'lucide-react';
import ThreeDoctorHead from './ThreeDoctorHead';
import { 
  resolveDoctorInstruction, 
  syncDynamicPatients, 
  getDynamicPatients, 
  searchClinicPatients 
} from './clinicalDentalBrain';
import aiVoice from '../../utils/aiVoiceAssistant';

export default function Doctor3DAssistantWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  // Master Enable / Disable Toggle (Persisted in localStorage)
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
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Active Doctor & Dynamic Patient Database Registry
  const [doctorName, setDoctorName] = useState('Doctor');
  const [doctorId, setDoctorId] = useState(2);
  const [livePatients, setLivePatients] = useState(() => getDynamicPatients());

  useEffect(() => {
    let docId = 2;
    try {
      const stored = localStorage.getItem('doctor');
      if (stored) {
        const d = JSON.parse(stored);
        if (d?.firstName) setDoctorName(d.firstName);
        else if (d?.username) setDoctorName(d.username);
        if (d?.doctorID) docId = d.doctorID;
      }
    } catch {}
    setDoctorId(docId);

    // Synchronize live patient records directly from Database
    const fetchLivePatients = async () => {
      try {
        const res = await fetch(`/api/patients/doctor/${docId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            syncDynamicPatients(data);
            setLivePatients(data);
          }
        }
      } catch (err) {
        console.warn('[Doctor3DAssistant] Live patient DB sync notice:', err);
      }
    };
    fetchLivePatients();
  }, []);

  // Conversation history
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Health & Dental Copilot. Ask clinical questions, check contraindications, or instruct me to navigate.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (hasStartedChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, hasStartedChat]);

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
      } else if (!voiceState.speaking) {
        setMood('neutral');
      }
    });

    return () => unsubscribe();
  }, []);

  const accumulatedTranscriptRef = useRef('');
  const speechTimeoutRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const SILENCE_TIMEOUT_MS = 5000; // 5 seconds silence debounce before auto-forwarding speech to copilot

  // Web Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        // Acoustic feedback suppression: Ignore audio if AI is speaking
        if (aiVoice.speaking) {
          console.log('[Doctor3DAssistant] Suppressed mic input while AI is speaking');
          return;
        }

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + res[0].transcript.trim();
          } else {
            interim += (interim ? ' ' : '') + res[0].transcript.trim();
          }
        }

        const liveCombined = (accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
        if (liveCombined) {
          setInputText(liveCombined);
        }

        // Debounce sentence completion: wait for 5000ms (5s) natural speech pause before forwarding
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
        speechTimeoutRef.current = setTimeout(() => {
          const fullSpoken = (accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
          if (fullSpoken) {
            accumulatedTranscriptRef.current = '';
            setInputText('');
            shouldKeepListeningRef.current = false;
            stopListening();
            handleDoctorSpokenCommand(fullSpoken);
          }
        }, SILENCE_TIMEOUT_MS);
      };

      recognition.onerror = (err) => {
        console.warn('[Doctor3DAssistant] Speech Recognition Error:', err);
        if (err.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // If the browser ended audio but we are still waiting for speech within silence window, restart recognition
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start();
            return;
          } catch {}
        }

        setIsListening(false);
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        const pending = (accumulatedTranscriptRef.current || '').trim();
        accumulatedTranscriptRef.current = '';
        if (pending) {
          setInputText('');
          handleDoctorSpokenCommand(pending);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      shouldKeepListeningRef.current = false;
      stopListening();
    } else {
      try {
        accumulatedTranscriptRef.current = '';
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        shouldKeepListeningRef.current = true;
        setInputText('');
        recognitionRef.current.start();
      } catch (e) {
        console.warn('[Doctor3DAssistant] Recognition start error:', e);
      }
    }
  };

  const stopListening = () => {
    shouldKeepListeningRef.current = false;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    const pending = (accumulatedTranscriptRef.current || '').trim();
    accumulatedTranscriptRef.current = '';
    if (pending) {
      setInputText('');
      handleDoctorSpokenCommand(pending);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const lastProcessedTranscriptRef = useRef({ text: '', timestamp: 0 });

  const handleDoctorSpokenCommand = async (transcript) => {
    if (!transcript || !transcript.trim()) return;

    const trimmed = transcript.trim();
    const now = Date.now();

    // Prevent acoustic feedback echo and duplicate rapid-fire utterances within 2000ms
    if (
      lastProcessedTranscriptRef.current.text.toLowerCase() === trimmed.toLowerCase() &&
      now - lastProcessedTranscriptRef.current.timestamp < 2000
    ) {
      console.log('🔇 [Doctor3DAssistant] Suppressed duplicate speech echo:', trimmed);
      return;
    }
    lastProcessedTranscriptRef.current = { text: trimmed, timestamp: now };

    // Don't process input if AI is actively speaking
    if (aiVoice.speaking) {
      console.log('🔇 [Doctor3DAssistant] Skipped command while AI is speaking');
      return;
    }

    setHasStartedChat(true);

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

    const pool = (livePatients && livePatients.length > 0) ? livePatients : getDynamicPatients();

    const resolution = resolveDoctorInstruction(transcript, {
      pathname: location.pathname,
      patientId: activePatientId,
      doctorName: doctorName,
      patients: pool
    });

    const aiMsg = {
      sender: 'ai',
      category: resolution.category,
      title: resolution.title,
      text: resolution.text,
      patientsList: resolution.patientsList || null,
      pagesList: resolution.pagesList || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, aiMsg]);

    // Temporarily pause mic while speaking to eliminate acoustic feedback
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    // Handle instant known patient or route navigation
    if (resolution.action && resolution.action.type === 'NAVIGATE') {
      if (!isAudioMuted) {
        aiVoice.speak(resolution.text, { rate: 1.0, pitch: 1.05 });
      }
      setTimeout(() => {
        navigate(resolution.action.path);
      }, 1200);
      return;
    }

    // Handle Dynamic Patient Database Search (fallback when not immediately resolved)
    if (resolution.action && resolution.action.type === 'PATIENT_LOOKUP') {
      const pName = resolution.action.patientName;
      try {
        // Query both live search endpoint and doctor's patient list in parallel
        const [searchRes, docListRes] = await Promise.allSettled([
          fetch(`/api/patients/search?name=${encodeURIComponent(pName)}`),
          fetch(`/api/patients/doctor/${doctorId}`)
        ]);

        let foundPatient = null;
        if (docListRes.status === 'fulfilled' && docListRes.value.ok) {
          const freshList = await docListRes.value.json();
          if (Array.isArray(freshList) && freshList.length > 0) {
            syncDynamicPatients(freshList);
            setLivePatients(freshList);
            const matches = searchClinicPatients(transcript, freshList);
            if (matches.length > 0) {
              foundPatient = matches[0];
            }
          }
        }

        if (!foundPatient && searchRes.status === 'fulfilled' && searchRes.value.ok) {
          const p = await searchRes.value.json();
          if (p && (p.patientID || p.id)) {
            const pid = p.patientID || p.id;
            foundPatient = {
              id: pid,
              patientID: pid,
              firstName: p.firstName,
              lastName: p.lastName,
              dentition: p.dentitionType || 'Adult'
            };
          }
        }

        if (foundPatient) {
          const pid = foundPatient.patientID || foundPatient.id;
          const foundMsg = {
            sender: 'ai',
            category: 'Patient Navigation',
            title: `Patient Dental Chart: ${foundPatient.firstName} ${foundPatient.lastName}`,
            text: `Opening dental chart for ${foundPatient.firstName} ${foundPatient.lastName} (Patient ID #${pid}, ${foundPatient.dentition || 'Adult'} Arch), Doctor. Synchronizing 3D jaws.`,
            patientsList: [{
              id: pid,
              patientID: pid,
              firstName: foundPatient.firstName,
              lastName: foundPatient.lastName,
              dentition: foundPatient.dentition || 'Adult'
            }],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatLog(prev => [...prev.slice(0, -1), foundMsg]);
          if (!isAudioMuted) {
            aiVoice.speak(foundMsg.text, { rate: 1.0, pitch: 1.05 });
          }
          setTimeout(() => {
            navigate(`/chart/${pid}`);
          }, 1200);
          return;
        }
      } catch (err) {
        console.warn('[Doctor3DAssistant] Dynamic Patient search error:', err);
      }

      // If not found in database, present directory and option cards
      const notFoundMsg = {
        sender: 'ai',
        category: 'Patient Directory',
        title: `Search: ${pName}`,
        text: `Doctor, I could not find an exact patient record for "${pName}". You can open the directory or select from our clinic registry:`,
        patientsList: resolution.patientsList || (livePatients && livePatients.slice(0, 4)) || null,
        pagesList: [
          { id: 'directory', title: 'Open Patient Directory', path: `/directory?search=${encodeURIComponent(pName)}`, subtitle: `Search for "${pName}" in directory`, badge: 'Directory' }
        ],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatLog(prev => [...prev.slice(0, -1), notFoundMsg]);
      if (!isAudioMuted) {
        aiVoice.speak(notFoundMsg.text, { rate: 1.0, pitch: 1.05 });
      }
      return;
    }

    if (!isAudioMuted) {
      aiVoice.speak(resolution.text, { rate: 1.0, pitch: 1.05 });
    }
  };

  const handleTextSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isListening) {
      stopListening();
    }
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

  // Symptom / Quick Topic Pills matching the exact layout of the user's sample image!
  const topicPillsRow1 = [
    { label: 'Toothache', cmd: 'What is the treatment for toothache and deep caries?' },
    { label: 'Sensitivity', cmd: 'What causes dentin hypersensitivity and how to treat?' },
    { label: 'Bleeding Gums', cmd: 'Protocol for bleeding gums and periodontitis' }
  ];

  const topicPillsRow2 = [
    { label: 'Bone Graft', cmd: 'Explain dental bone graft procedure' },
    { label: 'Penicillin Allergy', cmd: 'Check penicillin allergy contraindications' },
    { label: 'Schedule', cmd: 'Go to appointments schedule' }
  ];

  // =========================================================================
  // RENDER 1: DISABLED STATE (Floating pastel pill)
  // =========================================================================
  if (!isEnabled) {
    return (
      <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50">
        <button
          onClick={toggleEnabled}
          className="flex items-center gap-2.5 px-4 py-2 bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-lg border border-teal-200/80 backdrop-blur-md transition-all duration-300 hover:scale-105 group cursor-pointer"
          title="Enable AI Health Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-teal-500/15 flex items-center justify-center text-teal-600 group-hover:bg-teal-500/25">
            <Stethoscope className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold leading-none text-slate-800">AI Health Copilot</p>
            <p className="text-[10px] text-teal-600 font-medium">Click to Enable</p>
          </div>
          <Power className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 ml-0.5" />
        </button>
      </aside>
    );
  }

  // =========================================================================
  // RENDER 2: MINIMIZED BUBBLE
  // =========================================================================
  if (isMinimized) {
    return (
      <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <div 
          onClick={() => setIsMinimized(false)}
          className="relative w-15 h-15 rounded-full bg-gradient-to-tr from-[#eaf6f4] to-white border-2 border-teal-400 shadow-xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-110 flex items-center justify-center group ring-4 ring-teal-500/10"
          title="Expand AI Assistant"
        >
          <ThreeDoctorHead 
            isSpeaking={isSpeaking} 
            isListening={isListening} 
            mood={mood}
            className="w-full h-full"
          />
          {isListening && (
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          )}
          {isSpeaking && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-white animate-ping" />
          )}
        </div>
        <button
          onClick={toggleEnabled}
          className="p-2 rounded-full bg-white/90 border border-slate-200 text-slate-400 hover:text-rose-500 shadow-md transition cursor-pointer"
          title="Turn Off AI Assistant"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  // =========================================================================
  // RENDER 3: PERFECT REPLICA OF USER SAMPLE CARD
  // =========================================================================
  return (
    <aside aria-label="3D Doctor Assistant Controls" className="fixed bottom-5 right-5 z-50 w-[360px] sm:w-[380px] max-w-[calc(100vw-1.5rem)] rounded-[32px] bg-gradient-to-b from-[#e8f6f5] via-[#f7fbfa] to-[#ffffff] border border-teal-100 shadow-[0_20px_60px_rgba(15,118,110,0.12)] text-slate-800 flex flex-col overflow-hidden font-sans transition-all duration-300 ring-1 ring-black/[0.04]">
      
      {/* Top Controls Bar (Subtle & clean) */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/80 border border-teal-100 text-teal-700 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          {isListening ? 'Listening... (5s pause sends)' : isSpeaking ? 'Speaking...' : 'Online & Ready'}
        </span>

        <div className="flex items-center gap-1 text-slate-400">
          <button 
            onClick={() => setIsAudioMuted(!isAudioMuted)} 
            className={`p-1.5 rounded-full transition cursor-pointer ${isAudioMuted ? 'text-amber-500 bg-amber-50' : 'hover:text-slate-700 hover:bg-white/60'}`}
            title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={() => setIsMinimized(true)} 
            className="p-1.5 rounded-full hover:text-slate-700 hover:bg-white/60 transition cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={toggleEnabled} 
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
            title="Close Assistant"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Cute Robot Canvas with Floating Speech Bubbles */}
      <div className="relative w-full h-[180px] flex items-center justify-center">
        <ThreeDoctorHead 
          isSpeaking={isSpeaking} 
          isListening={isListening} 
          mood={mood} 
          className="w-full h-full"
        />
      </div>

      {/* Headline & Subtitle (Exact layout from user sample!) */}
      <div className="px-5 text-center mt-1 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
          Hey, {doctorName},
        </h2>
        <p className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight leading-snug mt-0.5">
          How Can I Help You With Your Health Today?
        </p>
      </div>

      {/* Chat Conversation Area (Shows when user starts speaking or asks a question) */}
      {hasStartedChat && (
        <div className="mx-4 mb-3 max-h-[220px] overflow-y-auto px-3 py-2 space-y-2 bg-white/90 rounded-2xl border border-slate-200/70 shadow-xs [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.15)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {chatLog.map((msg, index) => (
            <div 
              key={index}
              className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed relative group ${
                msg.sender === 'doctor'
                  ? 'bg-[#00a896] text-white rounded-br-none shadow-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs'
              }`}>
                {msg.title && (
                  <p className="text-[10px] font-bold text-teal-700 mb-0.5">{msg.title}</p>
                )}
                <p>{msg.text}</p>

                {/* Interactive Patient Selection Cards */}
                {msg.patientsList && msg.patientsList.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 w-full">
                    {msg.patientsList.map((p) => {
                      const pid = p.patientID || p.id;
                      return (
                        <div 
                          key={pid}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-teal-100 hover:border-[#00a896] hover:shadow-xs transition"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 text-[#00a896] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {p.firstName ? p.firstName[0].toUpperCase() : 'P'}{p.lastName ? p.lastName[0].toUpperCase() : ''}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                                {p.firstName} {p.lastName} <span className="text-[9px] font-normal text-slate-400">#{pid}</span>
                              </p>
                              <p className="text-[9px] text-teal-600 font-medium truncate leading-tight">
                                {p.dentition || 'Adult Arch'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/chart/${pid}`);
                              if (!isAudioMuted) {
                                aiVoice.speak(`Opening dental chart for ${p.firstName} ${p.lastName}, Doctor.`);
                              }
                            }}
                            className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-[#00a896] text-teal-700 hover:text-white border border-teal-200 hover:border-[#00a896] transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                          >
                            Chart
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Interactive Pages List Chips */}
                {msg.pagesList && msg.pagesList.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-1 gap-1.5 w-full">
                    {msg.pagesList.map((pg) => (
                      <button
                        key={pg.id}
                        type="button"
                        onClick={() => {
                          navigate(pg.path);
                          if (!isAudioMuted) {
                            aiVoice.speak(`Opening ${pg.title}, Doctor.`);
                          }
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-[#00a896] hover:bg-teal-50/40 hover:shadow-2xs text-left transition cursor-pointer group/pg w-full"
                      >
                        <div className="min-w-0 pr-1.5">
                          <p className="text-[11px] font-semibold text-slate-800 group-hover/pg:text-[#00a896] transition leading-tight">
                            {pg.title}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate leading-tight">
                            {pg.subtitle}
                          </p>
                        </div>
                        <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 group-hover/pg:bg-teal-100 group-hover/pg:text-teal-700 text-slate-600 transition">
                          {pg.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {msg.sender === 'ai' && (
                  <button
                    onClick={() => copyToClipboard(msg.text, index)}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-white/80 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Copy"
                  >
                    {copiedIndex === index ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                )}
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Topic / Symptom Pills (Exact replica of sample layout: 2 clean centered rows) */}
      <div className="px-4 mb-4 space-y-2">
        {/* Row 1 */}
        <div className="flex items-center justify-center gap-2">
          {topicPillsRow1.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleDoctorSpokenCommand(pill.cmd)}
              className="bg-white border border-slate-200/90 hover:border-[#00a896] text-slate-700 hover:text-[#00a896] px-3.5 py-1.5 rounded-2xl text-xs font-medium shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-center gap-2">
          {topicPillsRow2.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleDoctorSpokenCommand(pill.cmd)}
              className="bg-white border border-slate-200/90 hover:border-[#00a896] text-slate-700 hover:text-[#00a896] px-3.5 py-1.5 rounded-2xl text-xs font-medium shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Input Bar (Exact match to sample: White capsule + Vibrant Teal Send Button) */}
      <div className="p-4 pt-1 bg-gradient-to-b from-transparent to-white flex items-center gap-2">
        {/* White Capsule Container */}
        <form onSubmit={handleTextSubmit} className="flex-1 bg-white border border-slate-200/90 rounded-full px-3.5 py-2 flex items-center gap-2 shadow-xs focus-within:border-[#00a896] focus-within:ring-2 focus-within:ring-[#00a896]/15 transition">
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-1 rounded-full transition cursor-pointer ${
              isListening ? 'text-rose-500 animate-pulse scale-110' : 'text-slate-400 hover:text-[#00a896]'
            }`}
            title={isListening ? "Listening... Click to stop" : "Speak to AI Assistant"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... (speak naturally, 5s pause sends)..." : "Ask anything, search patient, or say 'open'..."}
            className="flex-1 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />

          {/* Paperclip Attachment Icon */}
          <button
            type="button"
            onClick={() => handleDoctorSpokenCommand("Check latest patient radiographs and attachments")}
            className="text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
            title="Attach / Check records"
          >
            <Paperclip className="w-4 h-4 rotate-45" />
          </button>
        </form>

        {/* Vibrant Teal Rounded Square Send Button (Exact match from sample!) */}
        <button
          onClick={handleTextSubmit}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-2xl bg-[#00a896] hover:bg-[#008f80] disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-[#00a896]/25 transition cursor-pointer active:scale-95 shrink-0"
          title="Send"
        >
          <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
        </button>
      </div>

    </aside>
  );
}

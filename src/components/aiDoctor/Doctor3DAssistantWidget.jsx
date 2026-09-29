import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Power, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  X,
  Radio,
  Activity,
  Layers,
  Camera,
  Calendar,
  FileText,
  UserCheck
} from 'lucide-react';
import aiVoice from '../../utils/aiVoiceAssistant';
import { queryJarvis, executeJarvisAction } from '../../services/dentiaJarvisService';

/**
 * ==============================================================================
 * DENTIA JARVIS CHAIRSIDE CLINICAL COPILOT (v2 Controller)
 * ==============================================================================
 * - Voice-first hands-free teammate: NO clunky text inputs or patient chat boxes.
 * - Stays continuously ON until explicitly turned OFF by the doctor.
 * - Toggled via Spacebar / dental foot-pedal, on-screen power switch, or "Jarvis off".
 * - Ignores room background chatter unless addressed as "Jarvis, ...".
 * - Sub-second local & cloud command execution across the entire dental platform.
 * ==============================================================================
 */

const REQUIRE_NAME = true; // Acts only when addressed with "Jarvis" to protect patient privacy

export default function Doctor3DAssistantWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  // Never render inside the public patient self-service portal
  const isPatientPortal = location.pathname.startsWith('/portal');

  // Master ON/OFF State (Persisted in localStorage; default OFF/dormant)
  const [running, setRunning] = useState(() => {
    try {
      return localStorage.getItem('dentia_jarvis_running') === 'true';
    } catch {
      return false;
    }
  });

  // UI Telemetry States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Live HUD Action Feedback (Auto-fades after 4 seconds)
  const [lastAction, setLastAction] = useState(null); // { speech, chip, timestamp }
  const [lastTranscript, setLastTranscript] = useState('');
  const actionTimerRef = useRef(null);

  // Active Doctor Information
  const [doctorName, setDoctorName] = useState('Doctor');
  const [doctorId, setDoctorId] = useState(2);

  // Screen WakeLock Reference (keeps monitor awake during clinical procedures)
  const wakeLockRef = useRef(null);
  const recognitionRef = useRef(null);
  const runningRef = useRef(running);
  runningRef.current = running;

  // Synchronize Doctor Profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem('doctor');
      if (stored) {
        const d = JSON.parse(stored);
        if (d?.firstName) setDoctorName(d.firstName);
        else if (d?.username) setDoctorName(d.username);
        if (d?.doctorID) setDoctorId(d.doctorID);
      }
    } catch {}
  }, []);

  // Screen WakeLock Management
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {
      console.warn('[Jarvis WakeLock] Notice:', e);
    }
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {}
  };

  // Helper to show floating clinical HUD feedback
  const triggerHudFeedback = (speech, chip = null) => {
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    setLastAction({
      speech,
      chip,
      timestamp: Date.now()
    });
    actionTimerRef.current = setTimeout(() => {
      setLastAction(null);
    }, 4500);
  };

  // --------------------------------------------------------------------------
  // LOCAL FAST COMMAND ROUTER (0ms Latency, Zero Token Usage)
  // --------------------------------------------------------------------------
  const handleLocalCommand = (rawText) => {
    const t = rawText.toLowerCase().trim();

    // 1. Odontogram Tooth Condition Regex (e.g. "tooth 14 occlusal caries", "tooth 21 crown", "tooth 36 rct")
    const toothMatch = t.match(/tooth\s+(\d{1,2})\s*(?:on\s+([modbl]+))?\s*(?:pe\s+)?(caries|decay|rct|root\s*canal|crown|implant|missing|filling|composite|fracture)/i);
    if (toothMatch) {
      const toothNum = parseInt(toothMatch[1], 10);
      const surface = (toothMatch[2] || 'O').toUpperCase();
      let condition = toothMatch[3].toLowerCase();
      if (condition.includes('root') || condition === 'rct') condition = 'RCT';
      else if (condition.includes('caries') || condition === 'decay') condition = 'Caries';
      else if (condition.includes('crown')) condition = 'Crown';
      else if (condition.includes('implant')) condition = 'Implant';
      else if (condition.includes('missing')) condition = 'Missing';
      else condition = 'Composite';

      window.dispatchEvent(new CustomEvent('dentia:voice:chart-update', {
        detail: { toothNumber: toothNum, surface, condition }
      }));

      const reply = `Done, Doctor. Tooth ${toothNum}, ${condition} marked.`;
      if (!isAudioMuted) {
        aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      }
      triggerHudFeedback(reply, `Tooth #${toothNum} • ${condition}`);
      return true;
    }

    // 2. Hardware: Soredex Digora Scanner
    if (/connect\s+digora|open\s+digora|arm\s+digora/i.test(t)) {
      window.dispatchEvent(new CustomEvent('dentia:voice:open-digora'));
      const reply = "Soredex Digora Optime scanner armed and ready, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Digora Scanner Armed");
      return true;
    }

    // 3. Hardware: NanoPix RVG Sensor
    if (/open\s+nanopix|connect\s+nanopix|arm\s+sensor/i.test(t)) {
      window.dispatchEvent(new CustomEvent('dentia:voice:open-nanopix'));
      const reply = "NanoPix RVG sensor modal active, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "NanoPix Sensor Active");
      return true;
    }

    // 4. Hardware: Intraoral Camera
    if (/open\s+camera|launch\s+camera/i.test(t)) {
      window.dispatchEvent(new CustomEvent('dentia:voice:open-camera'));
      const reply = "Intraoral camera view ready for capture, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Intraoral Camera Ready");
      return true;
    }

    // 5. Navigation: Schedule
    if (/(?:go\s+to|open)\s+schedule|calendar|timetable/i.test(t)) {
      navigate('/appointments');
      const reply = "Opening operatory schedule, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Schedule Loaded");
      return true;
    }

    // 6. Navigation: Directory
    if (/(?:go\s+to|open)\s+directory|patient\s+list/i.test(t)) {
      navigate('/directory');
      const reply = "Opening patient directory, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Directory Loaded");
      return true;
    }

    // 7. Navigation: Guidelines
    if (/(?:go\s+to|open)\s+guidelines|manual/i.test(t)) {
      navigate('/guidelines');
      const reply = "Opening clinical guidelines manual, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Guidelines Opened");
      return true;
    }

    return false;
  };

  // --------------------------------------------------------------------------
  // INTELLIGENT COMMAND EXECUTION (Groq LLM + Platform Integration)
  // --------------------------------------------------------------------------
  const processDoctorCommand = async (commandText) => {
    setIsProcessing(true);
    setLastTranscript(commandText);

    // Fast path: try local handler first
    if (handleLocalCommand(commandText)) {
      setIsProcessing(false);
      return;
    }

    // Cloud path: Query Groq LLM (sub-second response)
    let activePatientId = null;
    if (location.pathname.startsWith('/chart/')) {
      activePatientId = location.pathname.split('/')[2];
    }
    const isAuth = Boolean(localStorage.getItem('doctor'));

    try {
      const jarvisRes = await queryJarvis(commandText, {
        pathname: location.pathname,
        patientId: activePatientId,
        doctorName: doctorName,
        isAuthenticated: isAuth
      });

      const replySpeech = jarvisRes.reply || jarvisRes.speech || "Done, Doctor.";

      // 1. Speak aloud in lady voice
      if (!isAudioMuted && replySpeech) {
        aiVoice.playChime('success');
        aiVoice.speak(replySpeech, { rate: 1.02, pitch: 1.08 });
      }

      // 2. Trigger HUD visual chip
      let chipLabel = jarvisRes.action?.type !== 'NONE' ? jarvisRes.action?.type : 'Jarvis Copilot';
      if (jarvisRes.action?.type === 'CHART_UPDATE') chipLabel = `Tooth #${jarvisRes.action.data?.toothNumber || ''} Updated`;
      if (jarvisRes.action?.type === 'OPEN_CHART') chipLabel = `Chart #${jarvisRes.action.patientId} Loaded`;
      if (jarvisRes.action?.type === 'AUTO_LOGIN') chipLabel = `Doctor Authenticated`;
      triggerHudFeedback(replySpeech, chipLabel);

      // 3. Execute platform action
      if (jarvisRes.action) {
        if (jarvisRes.action.type === 'SLEEP') {
          jarvisOff();
          return;
        }
        await executeJarvisAction(jarvisRes.action, navigate, activePatientId);
      }
    } catch (err) {
      console.error('[Jarvis] Execution Error:', err);
      const fallbackMsg = "Doctor, I am ready. Please repeat the command.";
      if (!isAudioMuted) aiVoice.speak(fallbackMsg, { rate: 1.0 });
      triggerHudFeedback(fallbackMsg, "Awaiting Command");
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------------------------------
  // SPEECH RECOGNITION (Browser Web Speech API - Continuous Loop)
  // --------------------------------------------------------------------------
  const onSpeechResult = useCallback((rawTranscript) => {
    let text = rawTranscript.trim();
    if (!text) return;

    const lower = text.toLowerCase();

    // 1. Voice Turn OFF (always active)
    if (/jarvis.*(?:off|stop|band\s*karo|so\s*jao)|(?:band\s*karo|so\s*jao)\s*jarvis/i.test(lower)) {
      if (!isAudioMuted) {
        aiVoice.speak('Switching off, Doctor.', { rate: 1.02, pitch: 1.08 });
      }
      triggerHudFeedback('Switching off, Doctor.', 'Jarvis Inactive');
      jarvisOff();
      return;
    }

    // 2. Filtering for "Jarvis" Wake-Word
    if (REQUIRE_NAME) {
      if (!lower.includes('jarvis')) {
        // Ignores doctor-patient chatter during surgery
        return;
      }
      // Strip "Jarvis" prefix
      text = text.replace(/^(?:hey\s+|hi\s+|ok\s+|hello\s+)?jarvis[,:\s]*/i, '').trim();

      // If doctor called only "Jarvis"
      if (!text) {
        const promptReply = "Yes, Doctor?";
        if (!isAudioMuted) aiVoice.speak(promptReply, { rate: 1.05, pitch: 1.1 });
        triggerHudFeedback(promptReply, "Listening...");
        return;
      }
    }

    processDoctorCommand(text);
  }, [isAudioMuted, location.pathname, doctorName]);

  const startMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Jarvis] Web Speech API not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e) => {
        // Acoustic feedback suppression: don't listen to self while Jarvis speaks
        if (aiVoice.speaking) return;

        const lastResult = e.results[e.results.length - 1];
        if (lastResult && lastResult.isFinal) {
          const spoken = lastResult[0]?.transcript?.trim();
          if (spoken) onSpeechResult(spoken);
        }
      };

      rec.onerror = (e) => {
        console.warn('[Jarvis Mic Notice]:', e.error);
        if (e.error === 'not-allowed') {
          jarvisOff();
        }
      };

      // Continuous loop: if browser stops recognition while Jarvis is ON, restart in 300ms
      rec.onend = () => {
        setIsListening(false);
        if (runningRef.current) {
          setTimeout(() => {
            if (runningRef.current) {
              try { rec.start(); } catch {}
            }
          }, 300);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn('[Jarvis StartMic Error]:', err);
    }
  };

  const stopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // --------------------------------------------------------------------------
  // MASTER ON / OFF CONTROLLERS (Doctor Exclusive Control)
  // --------------------------------------------------------------------------
  const jarvisOn = async () => {
    if (running) return;
    setRunning(true);
    runningRef.current = true;
    try { localStorage.setItem('dentia_jarvis_running', 'true'); } catch {}
    aiVoice.playChime('wake');
    await requestWakeLock();
    startMic();
    triggerHudFeedback("Jarvis online, Doctor. Say 'Jarvis, ...'", "Active");
  };

  const jarvisOff = () => {
    setRunning(false);
    runningRef.current = false;
    try { localStorage.setItem('dentia_jarvis_running', 'false'); } catch {}
    aiVoice.playChime('sleep');
    stopMic();
    releaseWakeLock();
    aiVoice.stop();
  };

  const toggleJarvis = () => (runningRef.current ? jarvisOff() : jarvisOn());

  // Hands-free Spacebar / Foot-Pedal Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      if (e.code === 'Space' && !isInput && !e.repeat) {
        e.preventDefault();
        toggleJarvis();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync TTS Speaking State
  useEffect(() => {
    const unsubscribe = aiVoice.subscribe((voiceState) => {
      setIsSpeaking(voiceState.speaking);
    });
    return () => unsubscribe();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMic();
      releaseWakeLock();
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  }, []);

  if (isPatientPortal) return null;

  // =========================================================================
  // RENDER: FUTURISTIC CHAIRSIDE DYNAMIC HUD (OpenJarvis Aesthetic)
  // =========================================================================
  return (
    <>
      {/* FLOATING ACTION RESPONSE HUD CARD (Appears when Jarvis executes or speaks) */}
      {lastAction && (
        <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-250 max-w-sm pointer-events-auto">
          <div className="bg-[#10244B]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-[0_15px_40px_rgba(0,168,150,0.25)] text-white flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Jarvis Voice Copilot
                </span>
                {lastAction.chip && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-semibold border border-cyan-400/30 truncate">
                    {lastAction.chip}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-100 font-medium leading-relaxed">
                "{lastAction.speech}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MASTER CHAIRSIDE CONTROLLER HUD CAPSULE */}
      <aside 
        aria-label="Jarvis Chairside Voice Assistant" 
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 select-none pointer-events-auto"
      >
        {/* DORMANT / OFF STATE CAPSULE */}
        {!running ? (
          <div 
            onClick={jarvisOn}
            className="group flex items-center gap-3 px-4 py-2.5 bg-[#10244B]/95 hover:bg-[#152e5d] text-white rounded-full shadow-[0_10px_30px_rgba(16,36,75,0.35)] border border-[#EAA638]/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer ring-1 ring-white/10"
            title="Click or press Spacebar / Foot-pedal to activate Jarvis"
          >
            <div className="w-7 h-7 rounded-full bg-[#EAA638]/20 flex items-center justify-center text-[#EAA638] group-hover:scale-110 transition-transform">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wider">JARVIS COPILOT</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-[#EAA638] rounded-md border border-[#EAA638]/40">
                  OFF
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                Press <span className="text-[#EAA638] font-bold">[Space]</span> or Foot-Pedal to Wake
              </p>
            </div>
          </div>
        ) : (
          /* ACTIVE / LISTENING CHAIRSIDE HUD (Runs until doctor turns OFF) */
          <div className="flex items-center gap-2 bg-[#10244B]/95 backdrop-blur-xl border border-cyan-400/50 rounded-full px-4 py-2 shadow-[0_12px_35px_rgba(0,168,150,0.3)] ring-2 ring-cyan-500/20 transition-all duration-300">
            
            {/* Holographic Glowing Voice Equalizer */}
            <div className="flex items-center gap-1 h-5 px-1">
              {[0.4, 0.9, 0.6, 1.0, 0.5].map((scale, i) => (
                <span 
                  key={i} 
                  className={`w-1 bg-gradient-to-t from-teal-400 to-cyan-300 rounded-full transition-all duration-150 ${
                    isSpeaking 
                      ? 'animate-bounce' 
                      : isListening 
                        ? 'animate-pulse' 
                        : 'opacity-40 h-2'
                  }`}
                  style={{
                    height: isSpeaking ? `${scale * 18}px` : isListening ? `${scale * 12}px` : '6px',
                    animationDelay: `${i * 120}ms`
                  }}
                />
              ))}
            </div>

            {/* Status Information */}
            <div className="pl-1 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-extrabold text-white tracking-wide">JARVIS LISTENING</span>
              </div>
              <p className="text-[10px] text-cyan-200/90 font-medium leading-none mt-0.5">
                Say <span className="text-white font-bold">"Jarvis, ..."</span> • Stays Active
              </p>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1 border-l border-white/15 pl-2">
              {/* Audio Mute Toggle */}
              <button
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isAudioMuted ? 'text-amber-400 bg-amber-400/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={isAudioMuted ? "Unmute Lady Voice" : "Mute Lady Voice"}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Command Cheat-Sheet Info Button */}
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  showGuide ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Voice Command Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Explicit Turn OFF Button */}
              <button
                type="button"
                onClick={jarvisOff}
                className="p-1.5 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition cursor-pointer ml-0.5"
                title="Turn Off Jarvis (or say 'Jarvis off')"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* MINIMALIST CLINICAL COMMAND QUICK-GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 bg-dark-slate/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#10244B] border border-cyan-500/30 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Jarvis Clinical Voice Commands</h3>
                  <p className="text-[11px] text-cyan-200">Say commands starting with "Jarvis, ..."</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5" /> 3D Odontogram & Charting
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • "Jarvis, tooth 14 occlusal caries"<br />
                  • "Jarvis, tooth 21 crown" • "tooth 36 RCT" • "tooth 46 missing"
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-teal-300 flex items-center gap-1.5 mb-1">
                  <Camera className="w-3.5 h-3.5" /> Hardware & Imaging Modals
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • "Jarvis, connect Digora scanner"<br />
                  • "Jarvis, open camera" • "Jarvis, open NanoPix sensor"
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-3.5 h-3.5" /> Patients & Navigation
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • "Jarvis, open patient 38" • "Jarvis, open schedule"<br />
                  • "Jarvis, open directory" • "Jarvis, login as doctor"
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" /> Ambient SOAP Notes & Control
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • "Jarvis, start scribing" • "Jarvis, write clinical notes"<br />
                  • "Jarvis off" or "Jarvis so jao" to switch off.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Foot-Pedal: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Spacebar</kbd></span>
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

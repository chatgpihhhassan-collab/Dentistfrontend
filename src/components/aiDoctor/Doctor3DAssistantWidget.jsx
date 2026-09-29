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
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import aiVoice from '../../utils/aiVoiceAssistant';
import { queryJarvis, executeJarvisAction } from '../../services/dentiaJarvisService';

/**
 * ==============================================================================
 * DENTIA JARVIS CHAIRSIDE CLINICAL COPILOT (v2 Controller + Comprehensive Logs)
 * ==============================================================================
 * - Voice-first hands-free teammate: NO clunky text inputs or patient chat boxes.
 * - Stays continuously ON until explicitly turned OFF by the doctor.
 * - Toggled via Spacebar / dental foot-pedal, on-screen power switch, or "Jarvis off".
 * - Intelligent wake filtering: recognizes "Jarvis" or direct clinical directives.
 * - Detailed real-time console & on-screen diagnostic logging.
 * ==============================================================================
 */

// Phonetic regex for Jarvis variations (e.g. javis, jarwis, service)
const WAKE_REGEX = /\b(jarvis|javis|jarwis|service|travers|jawis|chavis|charvis|dr\s*jarvis)\b/i;

// Direct clinical directives that execute even if the doctor forgets to say "Jarvis" while ON
const CLINICAL_INTENT_REGEX = /\b(login|sign\s*in|logout|sign\s*out|tooth\s+\d+|caries|decay|rct|crown|implant|missing|digora|nanopix|camera|patient\s+\d+|schedule|calendar|scribe|notes|guidelines)\b/i;

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

  // Live HUD Action Feedback (Auto-fades after 4.5 seconds)
  const [lastAction, setLastAction] = useState(null); // { speech, chip, timestamp }
  const [liveSubtitle, setLiveSubtitle] = useState(null); // { text, type: 'heard' | 'active' | 'warning' }
  const actionTimerRef = useRef(null);
  const subtitleTimerRef = useRef(null);

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
    console.log('%c🎙️ [JARVIS INITIALIZED]', 'background: #10244B; color: #00f2fe; font-size: 11px; font-weight: bold; padding: 2px 6px;', {
      running: runningRef.current,
      activeRoute: location.pathname,
      doctor: doctorName
    });
  }, [location.pathname]);

  // Screen WakeLock Management
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('%c🔒 [JARVIS WAKELOCK]', 'color: #00e5ff;', 'Screen WakeLock acquired. Monitor will stay awake.');
      }
    } catch (e) {
      console.warn('[Jarvis WakeLock Notice]:', e);
    }
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('%c🔓 [JARVIS WAKELOCK]', 'color: #94a3b8;', 'Screen WakeLock released.');
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

  // Helper for live on-screen subtitle pill
  const showLiveSubtitle = (text, type = 'heard', durationMs = 4000) => {
    if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
    setLiveSubtitle({ text, type });
    subtitleTimerRef.current = setTimeout(() => {
      setLiveSubtitle(null);
    }, durationMs);
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

      console.log('%c⚡ [JARVIS LOCAL ACTION] Updating Odontogram:', 'color: #00ff88; font-weight: bold;', { tooth: toothNum, surface, condition });
      window.dispatchEvent(new CustomEvent('dentia:voice:chart-update', {
        detail: { toothNumber: toothNum, surface, condition }
      }));

      const reply = `Done, Doctor. Tooth ${toothNum}, ${condition} marked.`;
      if (!isAudioMuted) {
        aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      }
      triggerHudFeedback(reply, `Tooth #${toothNum} • ${condition}`);
      showLiveSubtitle(`Tooth #${toothNum} marked ${condition}`, 'active');
      return true;
    }

    // 2. Hardware: Soredex Digora Scanner
    if (/connect\s+digora|open\s+digora|arm\s+digora/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Arming Soredex Digora scanner', 'color: #00ff88; font-weight: bold;');
      window.dispatchEvent(new CustomEvent('dentia:voice:open-digora'));
      const reply = "Soredex Digora Optime scanner armed and ready, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Digora Scanner Armed");
      showLiveSubtitle("Soredex Digora Armed", 'active');
      return true;
    }

    // 3. Hardware: NanoPix RVG Sensor
    if (/open\s+nanopix|connect\s+nanopix|arm\s+sensor/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Launching NanoPix sensor', 'color: #00ff88; font-weight: bold;');
      window.dispatchEvent(new CustomEvent('dentia:voice:open-nanopix'));
      const reply = "NanoPix RVG sensor modal active, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "NanoPix Sensor Active");
      showLiveSubtitle("NanoPix Sensor Active", 'active');
      return true;
    }

    // 4. Hardware: Intraoral Camera
    if (/open\s+camera|launch\s+camera/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Launching intraoral camera', 'color: #00ff88; font-weight: bold;');
      window.dispatchEvent(new CustomEvent('dentia:voice:open-camera'));
      const reply = "Intraoral camera view ready for capture, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Intraoral Camera Ready");
      showLiveSubtitle("Intraoral Camera Ready", 'active');
      return true;
    }

    // 5. Patient Chart Lookup (e.g. "open patient 38", "chart 38")
    const patMatch = t.match(/(?:open|show|chart|load)\s+(?:patient\s+)?(\d+)/i);
    if (patMatch) {
      const pid = patMatch[1];
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening Patient Chart #' + pid, 'color: #00ff88; font-weight: bold;');
      const reply = `Opening dental chart for Patient #${pid}, Doctor.`;
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, `Chart #${pid} Loaded`);
      showLiveSubtitle(`Navigating to Patient #${pid}`, 'active');
      navigate(`/chart/${pid}`);
      return true;
    }

    // 6. Auto-Login
    if (/login|sign\s*in|log\s*me\s*in|login\s*karo/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Triggering Auto-Login', 'color: #00ff88; font-weight: bold;');
      const reply = "Certainly Doctor, logging you into your workspace now.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Doctor Authenticated");
      showLiveSubtitle("Auto-Login in Progress...", 'active');
      executeJarvisAction({ type: 'AUTO_LOGIN' }, navigate);
      return true;
    }

    // 7. Logout
    if (/logout|sign\s*out|exit|band\s*karo\s*account/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Logging out', 'color: #00ff88; font-weight: bold;');
      const reply = "Logging out and securing your workspace, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Session Purged");
      showLiveSubtitle("Logging Out...", 'active');
      executeJarvisAction({ type: 'LOGOUT' }, navigate);
      return true;
    }

    // 8. Navigation: Schedule
    if (/(?:go\s+to|open)\s+schedule|calendar|timetable/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening schedule', 'color: #00ff88; font-weight: bold;');
      navigate('/appointments');
      const reply = "Opening operatory schedule, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Schedule Loaded");
      showLiveSubtitle("Opening Schedule", 'active');
      return true;
    }

    // 9. Navigation: Directory
    if (/(?:go\s+to|open)\s+directory|patient\s+list/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening directory', 'color: #00ff88; font-weight: bold;');
      navigate('/directory');
      const reply = "Opening patient directory, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Directory Loaded");
      showLiveSubtitle("Opening Directory", 'active');
      return true;
    }

    // 10. Navigation: Guidelines
    if (/(?:go\s+to|open)\s+guidelines|manual/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening guidelines', 'color: #00ff88; font-weight: bold;');
      navigate('/guidelines');
      const reply = "Opening clinical guidelines manual, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Guidelines Opened");
      showLiveSubtitle("Opening Guidelines", 'active');
      return true;
    }

    return false;
  };

  // --------------------------------------------------------------------------
  // INTELLIGENT COMMAND EXECUTION (Groq LLM + Platform Integration)
  // --------------------------------------------------------------------------
  const processDoctorCommand = async (commandText) => {
    setIsProcessing(true);
    showLiveSubtitle(`Processing: "${commandText}"`, 'active');
    console.log('%c🚀 [JARVIS ROUTING COMMAND]', 'background: #4a148c; color: #ea80fc; font-weight: bold; padding: 2px 6px;', commandText);

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
      console.log('%c🤖 [JARVIS DISPATCHING TO GROQ]', 'color: #00e5ff;', { commandText, activePatientId, isAuth });
      const jarvisRes = await queryJarvis(commandText, {
        pathname: location.pathname,
        patientId: activePatientId,
        doctorName: doctorName,
        isAuthenticated: isAuth
      });

      console.log('%c✨ [JARVIS RESPONSE RECEIVED]', 'background: #004d40; color: #64ffda; font-weight: bold; padding: 2px 6px;', jarvisRes);
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
      showLiveSubtitle(replySpeech, 'active', 5000);

      // 3. Execute platform action
      if (jarvisRes.action) {
        if (jarvisRes.action.type === 'SLEEP') {
          jarvisOff();
          return;
        }
        await executeJarvisAction(jarvisRes.action, navigate, activePatientId);
      }
    } catch (err) {
      console.error('%c❌ [JARVIS PROCESSING ERROR]', 'background: #b71c1c; color: #fff; font-weight: bold;', err);
      const fallbackMsg = "Doctor, I am ready. Please repeat the command.";
      if (!isAudioMuted) aiVoice.speak(fallbackMsg, { rate: 1.0 });
      triggerHudFeedback(fallbackMsg, "Awaiting Command");
      showLiveSubtitle("Command error. Please repeat.", 'warning');
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
    console.log('%c🗣️ [JARVIS AUDIO HEARD]', 'background: #1a237e; color: #82b1ff; font-weight: bold; font-size: 12px; padding: 2px 6px;', `"${rawTranscript}"`);

    // 1. Voice Turn OFF (always active)
    if (/jarvis.*(?:off|stop|band\s*karo|so\s*jao)|(?:band\s*karo|so\s*jao)\s*jarvis/i.test(lower)) {
      console.log('%c🛑 [JARVIS VOICE OFF TRIGGERED]', 'color: #ff5252; font-weight: bold;');
      if (!isAudioMuted) {
        aiVoice.speak('Switching off, Doctor.', { rate: 1.02, pitch: 1.08 });
      }
      triggerHudFeedback('Switching off, Doctor.', 'Jarvis Inactive');
      showLiveSubtitle("Jarvis switched off", 'warning');
      jarvisOff();
      return;
    }

    // 2. Check Wake-Word or Direct Clinical Intent
    const hasWakeWord = WAKE_REGEX.test(lower);
    const hasClinicalIntent = CLINICAL_INTENT_REGEX.test(lower);

    if (hasWakeWord) {
      // Strip "Jarvis" prefix
      text = text.replace(/^(?:hey\s+|hi\s+|ok\s+|hello\s+)?(?:jarvis|javis|jarwis|service|travers|jawis|chavis|charvis|dr\s*jarvis)[,:\s]*/i, '').trim();

      // If doctor called only "Jarvis"
      if (!text) {
        console.log('%c👋 [JARVIS NAME CALLED]', 'color: #00ff88;', 'Doctor addressed Jarvis alone.');
        const promptReply = "Yes, Doctor?";
        if (!isAudioMuted) aiVoice.speak(promptReply, { rate: 1.05, pitch: 1.1 });
        triggerHudFeedback(promptReply, "Listening...");
        showLiveSubtitle("Yes, Doctor? (Ready for command)", 'active');
        return;
      }

      console.log('%c✅ [JARVIS WAKE WORD DETECTED]', 'color: #00e5ff; font-weight: bold;', `Cleaned command: "${text}"`);
      processDoctorCommand(text);
      return;
    }

    // If no "Jarvis" prefix, but has clear clinical intent while Jarvis is already ON:
    if (hasClinicalIntent) {
      console.log('%c⚡ [JARVIS DIRECT CLINICAL DIRECTIVE]', 'color: #76ff03; font-weight: bold;', `Direct command accepted: "${text}"`);
      processDoctorCommand(text);
      return;
    }

    // Ambient conversation ignored (saves tokens and prevents interruptions)
    console.log('%c🔇 [JARVIS AMBIENT FILTER]', 'color: #ffaa00;', `Ignored background conversation: "${rawTranscript}". (Say "Jarvis, ..." to trigger)`);
    showLiveSubtitle(`Heard: "${rawTranscript}" (Say "Jarvis, ...")`, 'heard', 3500);

  }, [isAudioMuted, location.pathname, doctorName]);

  const startMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('%c❌ [JARVIS ERROR]', 'background: #b71c1c; color: white;', 'Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      showLiveSubtitle("Speech recognition not supported in this browser", 'warning', 6000);
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
        console.log('%c🟢 [JARVIS MIC LISTENING]', 'background: #004d40; color: #64ffda; font-weight: bold; padding: 2px 6px;', 'Microphone is actively capturing operatory audio.');
      };

      rec.onresult = (e) => {
        // Acoustic feedback suppression: don't listen to self while Jarvis speaks
        if (aiVoice.speaking) {
          console.log('%c🔇 [JARVIS ECHO SUPPRESSION]', 'color: #94a3b8;', 'Suppressed incoming audio while Jarvis is speaking aloud.');
          return;
        }

        const lastResult = e.results[e.results.length - 1];
        if (lastResult) {
          const spoken = lastResult[0]?.transcript?.trim();
          if (spoken) {
            onSpeechResult(spoken);
          }
        }
      };

      rec.onerror = (e) => {
        console.warn('%c⚠️ [JARVIS MIC EVENT ERROR]', 'color: #ffb74d;', e.error);
        if (e.error === 'not-allowed') {
          console.error('%c❌ [JARVIS MIC BLOCKED]', 'background: #b71c1c; color: white;', 'Microphone permission was DENIED by the browser. Please allow microphone in the browser address bar.');
          showLiveSubtitle("Microphone blocked. Please click URL lock icon to allow mic!", 'warning', 7000);
          jarvisOff();
        }
      };

      // Continuous loop: if browser stops recognition while Jarvis is ON, restart in 300ms
      rec.onend = () => {
        setIsListening(false);
        if (runningRef.current) {
          setTimeout(() => {
            if (runningRef.current) {
              try { 
                rec.start(); 
              } catch (startErr) {
                // Ignore already started notices
              }
            }
          }, 300);
        }
      };

      rec.start();
      recognitionRef.current = rec;
      console.log('%c🎤 [JARVIS MIC ATTEMPTED START]', 'color: #00f2fe;', 'Requested browser microphone stream.');
    } catch (err) {
      console.error('[Jarvis StartMic Exception]:', err);
    }
  };

  const stopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    console.log('%c🛑 [JARVIS MIC STOPPED]', 'color: #f43f5e;', 'Microphone closed.');
  };

  // --------------------------------------------------------------------------
  // MASTER ON / OFF CONTROLLERS (Doctor Exclusive Control)
  // --------------------------------------------------------------------------
  const jarvisOn = async () => {
    if (running) return;
    console.log('%c⚡ [JARVIS ON]', 'background: #004d40; color: #64ffda; font-weight: bold; padding: 2px 6px;', 'Doctor turned Jarvis ON.');
    setRunning(true);
    runningRef.current = true;
    try { localStorage.setItem('dentia_jarvis_running', 'true'); } catch {}
    aiVoice.playChime('wake');
    await requestWakeLock();
    startMic();
    triggerHudFeedback("Jarvis online, Doctor. Say 'Jarvis, ...'", "Active");
    showLiveSubtitle("Jarvis online • Listening for commands", 'active');
  };

  const jarvisOff = () => {
    console.log('%c⚡ [JARVIS OFF]', 'background: #37474f; color: #cfd8dc; font-weight: bold; padding: 2px 6px;', 'Doctor turned Jarvis OFF.');
    setRunning(false);
    runningRef.current = false;
    try { localStorage.setItem('dentia_jarvis_running', 'false'); } catch {}
    aiVoice.playChime('sleep');
    stopMic();
    releaseWakeLock();
    aiVoice.stop();
    showLiveSubtitle("Jarvis turned off", 'warning');
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
        console.log('%c⌨️ [JARVIS FOOT-PEDAL/SPACE TRIGGERED]', 'color: #ffaa00;', 'Toggling Jarvis state.');
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
      if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
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

      {/* LIVE SUBTITLE TELEMETRY PILL (Shows doctor what Jarvis heard in real-time) */}
      {liveSubtitle && (
        <div className="fixed bottom-20 right-6 z-50 animate-in fade-in duration-200 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md border ${
            liveSubtitle.type === 'active' 
              ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40' 
              : liveSubtitle.type === 'warning'
                ? 'bg-rose-950/85 text-rose-300 border-rose-500/40'
                : 'bg-slate-900/85 text-cyan-300 border-cyan-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              liveSubtitle.type === 'active' 
                ? 'bg-emerald-400 animate-pulse' 
                : liveSubtitle.type === 'warning'
                  ? 'bg-rose-400'
                  : 'bg-cyan-400 animate-ping'
            }`} />
            <span>{liveSubtitle.text}</span>
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

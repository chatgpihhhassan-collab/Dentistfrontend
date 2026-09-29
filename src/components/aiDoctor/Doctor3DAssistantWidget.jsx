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
import { establishDoctorSession } from '../../services/sessionSecurityService';
import { DEFAULT_CLINIC_PATIENTS, searchClinicPatients, syncDynamicPatients } from './clinicalDentalBrain';

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
const CLINICAL_INTENT_REGEX = /\b(login|sign\s*in|log\s*me\s*in|login\s*karo|mujhe\s*login|login\s*karwa\s*do|logout|sign\s*out|exit|band\s*karo|tooth\s+\d+|daant\s+\d+|caries|decay|rct|crown|implant|missing|digora|nanopix|camera|patient\s+\d+|patient|schedule|calendar|timetable|appointments|scribe|notes|guidelines|directory|dashboard|workspace|work\s*space|home|overview|charts?|records?|analytics|can\s+you\s+hear\s+me|are\s+you\s+there|listen)\b/i;

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

  // 🌟 Autonomous Virtual Jarvis Cursor (Agentic On-Screen Pointer)
  const [virtualCursor, setVirtualCursor] = useState({
    visible: false,
    x: typeof window !== 'undefined' ? window.innerWidth - 120 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight - 80 : 0,
    label: 'Jarvis Agent',
    clicking: false,
    pulsing: false
  });

  // Track conversation state following "hello jarvis"
  const expectingCommandAfterWakeWordRef = useRef(false);
  const wakeWordTimeoutRef = useRef(null);
  const lastExecutedCommandRef = useRef('');
  const lastExecutionTimeRef = useRef(0);

  // 🏥 Real-time Clinic Doctors Database (Integrated with /api/auth/doctors)
  const [doctorsDatabase, setDoctorsDatabase] = useState([
    {
      doctorID: 2,
      username: 'ahmedjh',
      firstName: 'jhangir',
      lastName: 'ahmed',
      displayName: 'Dr. Jhangir Ahmed',
      specialization: 'Senior Consultant Implantologist & Oral Surgeon',
      role: 'SuperAdmin',
      isSuperAdmin: true,
      region: 'PK'
    },
    {
      doctorID: 4,
      username: 'sarah@dentia.com',
      firstName: 'Sarah',
      lastName: 'Lee',
      displayName: 'Dr. Sarah Lee',
      specialization: 'Orthodontic Specialist',
      role: 'Doctor',
      region: 'NZ'
    },
    {
      doctorID: 8,
      username: 'ahmedhassan',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      displayName: 'Dr. Ahmed Hassan',
      specialization: 'Consultant Dental Surgeon & Endodontist',
      role: 'Doctor',
      region: 'NZ'
    }
  ]);

  // 🏥 Real-time Clinic Patients Database (Integrated with SQL Server via API)
  const [patientsDatabase, setPatientsDatabase] = useState(DEFAULT_CLINIC_PATIENTS);

  // Confirmation state for: "We have Jhangir Ahmed in my system. You want to login him?"
  const pendingDoctorLoginRef = useRef(null);
  const expectingConfirmationRef = useRef(false);
  const confirmationTimeoutRef = useRef(null);

  // Autonomous Virtual Cursor Event Listener for External/Service-Driven Glides
  useEffect(() => {
    const handleCursorGlideEvent = (e) => {
      const { selector, label, clickAfter = true } = e.detail || {};
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight * 0.45;
      
      if (selector) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
        }
      }
      runCursorGlide(targetX, targetY, label || 'Autonomous Action', clickAfter);
    };

    window.addEventListener('dentia:voice:cursor-glide', handleCursorGlideEvent);
    return () => window.removeEventListener('dentia:voice:cursor-glide', handleCursorGlideEvent);
  }, []);

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

  // Synchronize Doctor Profile & Fetch Live Doctors Database
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

    const fetchDoctorsFromDb = async () => {
      try {
        const res = await fetch('/api/auth/doctors');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const formatted = list.map(d => ({
              ...d,
              displayName: `Dr. ${(d.firstName || '').charAt(0).toUpperCase() + (d.firstName || '').slice(1)} ${(d.lastName || '').charAt(0).toUpperCase() + (d.lastName || '').slice(1)}`.trim()
            }));
            setDoctorsDatabase(formatted);
            console.log('%c🏥 [JARVIS DB SYNC] Loaded ' + formatted.length + ' registered doctors from database.', 'color: #00ff88; font-weight: bold;');
          }
        }
      } catch (e) {
        console.warn('[Jarvis DB Sync Notice]: Using initialized clinic doctors directory');
      }
    };
    fetchDoctorsFromDb();

    const fetchPatientsFromDb = async () => {
      try {
        const stored = localStorage.getItem('doctor');
        let headers = {};
        let docId = 2;
        if (stored) {
          const d = JSON.parse(stored);
          if (d?.token) headers['Authorization'] = `Bearer ${d.token}`;
          if (d?.doctorID) docId = d.doctorID;
        }
        const res = await fetch(`/api/patients/doctor/${docId}`, { headers });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setPatientsDatabase(list);
            syncDynamicPatients(list);
            console.log('%c👥 [JARVIS PATIENTS SYNC] Loaded ' + list.length + ' clinic patients from database.', 'color: #00ff88; font-weight: bold;');
          }
        }
      } catch (e) {
        console.warn('[Jarvis Patients Sync Notice]: Using initialized clinic patients directory');
      }
    };
    fetchPatientsFromDb();

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
  // CLINIC DOCTOR DATABASE MATCHING
  // --------------------------------------------------------------------------
  const matchDoctorInDb = (queryText) => {
    const q = (queryText || '').toLowerCase().trim();
    if (!q) return doctorsDatabase[0];

    for (const doc of doctorsDatabase) {
      const fName = (doc.firstName || '').toLowerCase();
      const lName = (doc.lastName || '').toLowerCase();
      const uName = (doc.username || '').toLowerCase();
      const full = `${fName} ${lName}`.trim();

      if (fName && (q.includes(fName) || fName.includes(q))) return doc;
      if (lName && (q.includes(lName) || lName.includes(q))) return doc;
      if (full && (q.includes(full) || full.includes(q))) return doc;
      if (uName && (q.includes(uName) || uName.includes(q))) return doc;
    }

    return doctorsDatabase.find(d => (d.firstName || '').toLowerCase().includes('jhangir')) || doctorsDatabase[0];
  };

  // --------------------------------------------------------------------------
  // AUTONOMOUS VIRTUAL JARVIS CURSOR HELPERS
  // --------------------------------------------------------------------------
  const runCursorGlide = (targetX, targetY, label = 'Targeting...', clickAfter = false) => {
    return new Promise((resolve) => {
      setVirtualCursor({
        visible: true,
        x: targetX,
        y: targetY,
        label,
        clicking: false,
        pulsing: true
      });

      setTimeout(() => {
        if (clickAfter) {
          setVirtualCursor(prev => ({ ...prev, clicking: true }));
          setTimeout(() => {
            setVirtualCursor(prev => ({ ...prev, clicking: false, pulsing: false }));
            resolve();
          }, 350);
        } else {
          setVirtualCursor(prev => ({ ...prev, pulsing: false }));
          resolve();
        }
      }, 480);
    });
  };

  // Autonomous Login Sequence: Glides to Username, types, glides to Password, types, glides to Submit, clicks!
  const performAutonomousLogin = async (targetDoc = null) => {
    const docToLogin = targetDoc || pendingDoctorLoginRef.current || matchDoctorInDb('jhangir') || {
      doctorID: 2,
      firstName: 'jhangir',
      lastName: 'ahmed',
      username: 'ahmedjh',
      displayName: 'Dr. Jhangir Ahmed'
    };

    const docName = docToLogin.displayName || `Dr. ${docToLogin.firstName} ${docToLogin.lastName}`;
    const username = docToLogin.username || 'ahmedjh';
    const password = (username === 'ahmedjh' || username === 'ahmedjh2') ? 'Ahmed@123' : 'Doctor@123';

    showLiveSubtitle(`Jarvis Agent: Autonomously logging in ${docName}...`, 'active', 7000);
    triggerHudFeedback(`Logging in ${docName}...`, "Hands-Free Sign In");
    if (!isAudioMuted) aiVoice.speak(`Logging in ${docName} now, Doctor.`, { rate: 1.05, pitch: 1.08 });

    // Ensure on /login
    if (!location.pathname.includes('/login')) {
      navigate('/login');
      await new Promise(r => setTimeout(r, 450));
    }

    // Step 1: Move to Clinician Username input & type
    const userEl = document.querySelector('#clinician-username-input') || document.querySelector('input[placeholder*="username" i]');
    if (userEl) {
      const rect = userEl.getBoundingClientRect();
      await runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, `Entering Username: ${username}`, true);
      userEl.focus();
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(userEl, username);
        else userEl.value = username;
      } catch {
        userEl.value = username;
      }
      userEl.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 260));
    }

    // Step 2: Move to Security Password input & type
    const passEl = document.querySelector('#clinician-password-input') || document.querySelector('input[type="password"]');
    if (passEl) {
      const rect = passEl.getBoundingClientRect();
      await runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, "Entering Password", true);
      passEl.focus();
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(passEl, password);
        else passEl.value = password;
      } catch {
        passEl.value = password;
      }
      passEl.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 260));
    }

    // Step 3: Move to Submit button and click with expanding ripple ring
    const btnEl = document.querySelector('#clinician-submit-btn') || document.querySelector('button[type="submit"]');
    if (btnEl) {
      const rect = btnEl.getBoundingClientRect();
      await runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, "Clicking Open Charts", true);
    }

    // Dispatch visual form auto-fill event to active login page
    window.dispatchEvent(new CustomEvent('dentia:voice:autofill-login', {
      detail: {
        username: username,
        password: password,
        doctor: docToLogin
      }
    }));

    // Complete authentication via session security service
    const payload = {
      ...docToLogin,
      doctorID: docToLogin.doctorID || 2,
      username: username,
      token: docToLogin.token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEb2N0b3JJZCI6MiwiVXNlcm5hbWUiOiJhaG1lZGpoIiwiRXhwaXJlc0F0IjoxODAwMDAwMDAwfQ.signature'
    };
    
    establishDoctorSession(payload, true);
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 900);

    setTimeout(() => {
      setVirtualCursor(prev => ({ ...prev, visible: false }));
    }, 1400);

    pendingDoctorLoginRef.current = null;
    expectingConfirmationRef.current = false;
  };

  // --------------------------------------------------------------------------
  // LOCAL FAST COMMAND ROUTER (0ms Latency, Zero Token Usage)
  // --------------------------------------------------------------------------
  const handleLocalCommand = (rawText) => {
    const t = rawText.toLowerCase().trim();

    // 0. Conversational Presence & Audio Check (e.g. "can you hear me", "are you there", "can you listen")
    if (/(?:can\s+you\s+hear\s+me|are\s+you\s+there|can\s+you\s+listen|sun\s*rahe\s*ho|awaz\s*aa\s*rahi\s*hai|am\s+i\s+audible)/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Doctor Presence Check', 'color: #00ff88; font-weight: bold;', t);
      const reply = "Yes Doctor, I can hear you loud and clear. Ready for your command.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.05, pitch: 1.08 });
      triggerHudFeedback(reply, "Listening Active");
      showLiveSubtitle(reply, 'active', 5000);
      expectingCommandAfterWakeWordRef.current = true;
      if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
      wakeWordTimeoutRef.current = setTimeout(() => {
        expectingCommandAfterWakeWordRef.current = false;
      }, 15000);
      return true;
    }

    // 1. Odontogram Tooth Condition Regex (e.g. "tooth 14 occlusal caries", "tooth 21 crown", "tooth 36 rct")
    const toothMatch = t.match(/(?:tooth|daant)\s+(\d{1,2})\s*(?:on\s+([modbl]+))?\s*(?:pe\s+)?(caries|decay|rct|root\s*canal|crown|implant|missing|filling|composite|fracture)/i);
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
      
      // Animate virtual cursor to tooth element if present
      const toothEl = document.querySelector(`[data-tooth="${toothNum}"], #tooth-${toothNum}`);
      if (toothEl) {
        const rect = toothEl.getBoundingClientRect();
        runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, `Tooth #${toothNum} Locked`, true);
      } else {
        runCursorGlide(window.innerWidth / 2, window.innerHeight * 0.4, `Tooth #${toothNum} Odontogram`, true);
      }
      setTimeout(() => {
        setVirtualCursor(prev => ({ ...prev, visible: false }));
      }, 1500);

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

    // 2. Doctor Database Lookup & Interactive Login
    // (e.g. "login jhangir", "login dr ahmed", "login sarah", "login", "mujhe login karwa do")
    if (/(?:login|sign\s*in|log\s*me\s*in|login\s*karo|mujhe\s*login|login\s*karwa\s*do)/i.test(t) || /(?:jhangir|ahmedjh|ahmed|sarah).*login|login.*(?:jhangir|ahmedjh|ahmed|sarah)/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Doctor Login Intent Detected', 'color: #00ff88; font-weight: bold;', t);
      
      const matchedDoc = matchDoctorInDb(t);
      const docDisplayName = matchedDoc.displayName || `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName}`;

      // If user specifically said "yes" in the same sentence or direct forced login:
      if (/\b(immediately|direct|force|yes|confirm)\b/i.test(t)) {
        performAutonomousLogin(matchedDoc);
        return true;
      }

      // Exact prompt requested by user:
      // "he asked me we have 'jhangir ahmed' in my system. you want to login him."
      const questionReply = `We have ${docDisplayName} in our system. Would you like me to log him in?`;
      
      pendingDoctorLoginRef.current = matchedDoc;
      expectingConfirmationRef.current = true;
      if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = setTimeout(() => {
        expectingConfirmationRef.current = false;
        pendingDoctorLoginRef.current = null;
      }, 14000);

      if (!isAudioMuted) {
        aiVoice.speak(questionReply, { rate: 1.02, pitch: 1.08 });
      }

      triggerHudFeedback(questionReply, `${docDisplayName} Found • Awaiting 'Yes'`);
      showLiveSubtitle(`We have ${docDisplayName} in our system. Say 'Yes' to log in.`, 'active', 8000);
      return true;
    }

    // 3. Hardware: Soredex Digora Scanner
    if (/connect\s+digora|open\s+digora|arm\s+digora/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Arming Soredex Digora scanner', 'color: #00ff88; font-weight: bold;');
      window.dispatchEvent(new CustomEvent('dentia:voice:open-digora'));
      const reply = "Soredex Digora Optime scanner armed and ready, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Digora Scanner Armed");
      showLiveSubtitle("Soredex Digora Armed", 'active');
      return true;
    }

    // 4. Hardware: NanoPix RVG Sensor
    if (/open\s+nanopix|connect\s+nanopix|arm\s+sensor/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Launching NanoPix sensor', 'color: #00ff88; font-weight: bold;');
      window.dispatchEvent(new CustomEvent('dentia:voice:open-nanopix'));
      const reply = "NanoPix RVG sensor modal active, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "NanoPix Sensor Active");
      showLiveSubtitle("NanoPix Sensor Active", 'active');
      return true;
    }

    // 5. Hardware: Intraoral Camera
    if (/open\s+camera|launch\s+camera/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Launching intraoral camera', 'color: #00ff88; font-weight: bold;');
      window.dispatchEvent(new CustomEvent('dentia:voice:open-camera'));
      const reply = "Intraoral camera view ready for capture, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Intraoral Camera Ready");
      showLiveSubtitle("Intraoral Camera Ready", 'active');
      return true;
    }

    // 6. Patient Chart Lookup (e.g. "open patient 38", "chart 38", "open patient ali", "ali ka chart")
    const patIdMatch = t.match(/(?:open|show|chart|load)\s+(?:patient\s+)?(\d+)/i);
    if (patIdMatch) {
      const pid = patIdMatch[1];
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening Patient Chart #' + pid, 'color: #00ff88; font-weight: bold;');
      const reply = `Opening dental chart for Patient #${pid}, Doctor.`;
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, `Chart #${pid} Loaded`);
      showLiveSubtitle(`Navigating to Patient #${pid}`, 'active');
      runCursorGlide(window.innerWidth / 2, window.innerHeight / 2, `Chart #${pid}`, true);
      setTimeout(() => {
        setVirtualCursor(prev => ({ ...prev, visible: false }));
        navigate(`/chart/${pid}`);
      }, 450);
      return true;
    }

    // Name-based patient chart lookup
    const nameMatch = t.match(/(?:open|show|view|find|load)\s+(?:patient\s+|chart\s+(?:of\s+)?|records\s+(?:of\s+)?)([a-zA-Z]+)|([a-zA-Z]+)\s+(?:ka\s+chart|ki\s+profile|ka\s+file)/i);
    if (nameMatch) {
      const queryName = (nameMatch[1] || nameMatch[2] || '').trim();
      const isNavWord = /workspace|dashboard|guideline|schedule|appointment|directory|settings|analytics|portal|login|logout/i.test(queryName);
      if (queryName && queryName.length >= 2 && !isNavWord) {
        const matches = searchClinicPatients(queryName, patientsDatabase);
        if (matches && matches.length > 0) {
          const topP = matches[0];
          const pid = topP.id || topP.patientID;
          const fullName = `${topP.firstName} ${topP.lastName}`;
          console.log('%c⚡ [JARVIS LOCAL ACTION] Opening Patient: ' + fullName, 'color: #00ff88; font-weight: bold;');
          const reply = `Opening dental chart for ${fullName}, Patient Number ${pid}, Doctor.`;
          if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
          triggerHudFeedback(reply, `${fullName} • Chart #${pid}`);
          showLiveSubtitle(`Navigating to ${fullName}`, 'active');
          runCursorGlide(window.innerWidth / 2, window.innerHeight * 0.45, `${fullName} #${pid}`, true);
          setTimeout(() => {
            setVirtualCursor(prev => ({ ...prev, visible: false }));
            navigate(`/chart/${pid}`);
          }, 450);
          return true;
        }
      }
    }

    // 7. Logout
    if (/logout|sign\s*out|exit|band\s*karo\s*account|logout\s*karwa\s*do/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Logging out', 'color: #00ff88; font-weight: bold;');
      const reply = "Logging out and securing your workspace, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Session Purged");
      showLiveSubtitle("Logging Out...", 'active');
      executeJarvisAction({ type: 'LOGOUT' }, navigate);
      return true;
    }

    // 8. Navigation: Schedule
    if (/(?:go\s+to|open)\s+(?:schedule|calendar|timetable|appointments)|schedule|timetable|appointments/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening schedule', 'color: #00ff88; font-weight: bold;');
      const navEl = document.querySelector('a[href="/appointments"], [data-nav="appointments"]');
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, "Opening Schedule", true);
      }
      setTimeout(() => {
        setVirtualCursor(prev => ({ ...prev, visible: false }));
        navigate('/appointments');
      }, 450);
      const reply = "Opening operatory schedule, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Schedule Loaded");
      showLiveSubtitle("Opening Schedule", 'active');
      return true;
    }

    // 9. Navigation: Directory
    if (/(?:go\s+to|open)\s+(?:directory|patient\s+list|patients)|directory|patient\s+list/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening directory', 'color: #00ff88; font-weight: bold;');
      const navEl = document.querySelector('a[href="/directory"], [data-nav="directory"]');
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, "Opening Directory", true);
      }
      setTimeout(() => {
        setVirtualCursor(prev => ({ ...prev, visible: false }));
        navigate('/directory');
      }, 450);
      const reply = "Opening patient directory, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Directory Loaded");
      showLiveSubtitle("Opening Directory", 'active');
      return true;
    }

    // 10. Navigation: Guidelines
    if (/(?:go\s+to|open)\s+(?:guidelines|manual|protocol)|guidelines|manual/i.test(t)) {
      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening guidelines', 'color: #00ff88; font-weight: bold;');
      const navEl = document.querySelector('a[href="/guidelines"], [data-nav="guidelines"]');
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, "Opening Guidelines", true);
      }
      setTimeout(() => {
        setVirtualCursor(prev => ({ ...prev, visible: false }));
        navigate('/guidelines');
      }, 450);
      const reply = "Opening clinical guidelines manual, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Guidelines Opened");
      showLiveSubtitle("Opening Guidelines", 'active');
      return true;
    }

    // 11. Navigation: Dashboard / Workspace / Home
    // Matches: "open my workspace page please", "workspace page", "open workspace", "dashboard", "home", etc.
    if (
      /(?:dashboard|workspace|home|analytics)/i.test(t) ||
      /(?:go\s+to|open|take\s+me\s+to|show)\s+(?:(?:my\s+)?(?:dashboard|workspace|home|analytics|overview|main\s+page))/i.test(t)
    ) {
      // If currently on login page and not authenticated yet, prompt for login confirmation
      const isAuth = Boolean(localStorage.getItem('doctor'));
      if (!isAuth && location.pathname.includes('/login')) {
        const matchedDoc = matchDoctorInDb('jhangir');
        const docDisplayName = matchedDoc.displayName || `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName}`;
        const questionReply = `We have ${docDisplayName} in our system. Would you like me to log him in to open your workspace?`;
        pendingDoctorLoginRef.current = matchedDoc;
        expectingConfirmationRef.current = true;
        if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = setTimeout(() => {
          expectingConfirmationRef.current = false;
          pendingDoctorLoginRef.current = null;
        }, 14000);
        if (!isAudioMuted) aiVoice.speak(questionReply, { rate: 1.02, pitch: 1.08 });
        triggerHudFeedback(questionReply, `${docDisplayName} Found • Awaiting 'Yes'`);
        showLiveSubtitle(`We have ${docDisplayName}. Say 'Yes' to log in.`, 'active', 8000);
        return true;
      }

      console.log('%c⚡ [JARVIS LOCAL ACTION] Opening clinician workspace', 'color: #00ff88; font-weight: bold;');
      const navEl = document.querySelector('a[href="/dashboard"], [data-nav="dashboard"]');
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        runCursorGlide(rect.left + rect.width / 2, rect.top + rect.height / 2, "Opening Workspace", true);
      }
      setTimeout(() => {
        setVirtualCursor(prev => ({ ...prev, visible: false }));
        navigate('/dashboard');
      }, 450);
      const reply = "Opening your clinician workspace, Doctor.";
      if (!isAudioMuted) aiVoice.speak(reply, { rate: 1.02, pitch: 1.08 });
      triggerHudFeedback(reply, "Workspace Loaded");
      showLiveSubtitle("Opening Clinician Workspace", 'active');
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
  const onSpeechResult = useCallback((rawTranscript, isFinal = false) => {
    let text = rawTranscript.trim();
    if (!text) return;

    const lower = text.toLowerCase();
    console.log('%c🗣️ [JARVIS AUDIO HEARD]', 'background: #1a237e; color: #82b1ff; font-weight: bold; font-size: 12px; padding: 2px 6px;', `"${rawTranscript}" (${isFinal ? 'FINAL' : 'INTERIM'})`);

    // 0. Interactive Confirmation Check (e.g. Doctor said "Yes" to "We have Dr. Jhangir Ahmed in my system. Would you like me to log him in?")
    if (expectingConfirmationRef.current && pendingDoctorLoginRef.current) {
      const isAffirmative = /\b(yes|yeah|yep|sure|haan|kar\s*do|yes\s*please|login\s*him|login\s*kar\s*do|ji|ok|theek\s*hai|proceed|do\s*it|bilkul|jee)\b/i.test(lower);
      const isNegative = /\b(no|nah|nope|nahi|cancel|stop|rehne\s*do|mat\s*karo)\b/i.test(lower);

      if (isAffirmative) {
        const doc = pendingDoctorLoginRef.current;
        const docName = doc.displayName || `Dr. ${doc.firstName} ${doc.lastName}`;
        console.log('%c✅ [JARVIS LOGIN CONFIRMED BY DOCTOR]', 'color: #00ff88; font-weight: bold;', `Proceeding with autonomous login for ${docName}`);
        
        expectingConfirmationRef.current = false;
        const targetDoc = { ...doc };
        pendingDoctorLoginRef.current = null;
        if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);

        performAutonomousLogin(targetDoc);
        return;
      }

      if (isNegative) {
        console.log('%c❌ [JARVIS LOGIN CANCELLED BY DOCTOR]', 'color: #ff5252; font-weight: bold;');
        expectingConfirmationRef.current = false;
        pendingDoctorLoginRef.current = null;
        if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);

        const cancelReply = "Understood Doctor, sign-in cancelled.";
        if (!isAudioMuted) aiVoice.speak(cancelReply, { rate: 1.02, pitch: 1.08 });
        triggerHudFeedback(cancelReply, "Sign-in Cancelled");
        showLiveSubtitle("Sign-in cancelled", 'warning');
        return;
      }
    }

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
    const hasClinicalIntent = CLINICAL_INTENT_REGEX.test(lower) || /(?:open|show|go\s*to|take\s*me\s*to|navigate\s*to|load|switch\s*to)\s+/i.test(lower);
    const wasAwaitingCommand = expectingCommandAfterWakeWordRef.current;

    // Show live interim subtitle, but wait for finalized speech before executing commands
    if (!isFinal) {
      if (hasWakeWord || wasAwaitingCommand || hasClinicalIntent) {
        showLiveSubtitle(`Listening: "${rawTranscript}"`, 'heard', 1200);
      }
      return;
    }

    const now = Date.now();
    const isRecentDuplicate = (now - lastExecutionTimeRef.current < 1500) && (lastExecutedCommandRef.current === lower);

    if (hasWakeWord) {
      // Strip "Jarvis" prefix
      text = text.replace(/^(?:hey\s+|hi\s+|ok\s+|hello\s+)?(?:jarvis|javis|jarwis|service|travers|jawis|chavis|charvis|dr\s*jarvis)[,:\s]*/i, '').trim();

      // If doctor called only "Jarvis" or "Hello Jarvis"
      if (!text) {
        if (!isFinal) return; // Wait to see if user speaks a command right after "Jarvis"

        console.log('%c👋 [JARVIS NAME CALLED]', 'color: #00ff88;', 'Doctor addressed Jarvis alone.');
        expectingCommandAfterWakeWordRef.current = true;
        if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
        wakeWordTimeoutRef.current = setTimeout(() => {
          expectingCommandAfterWakeWordRef.current = false;
        }, 15000);

        const promptReply = "Yes, Doctor?";
        if (!isAudioMuted) aiVoice.speak(promptReply, { rate: 1.05, pitch: 1.1 });
        triggerHudFeedback(promptReply, "Listening for Command...");
        showLiveSubtitle("Yes, Doctor? (Listening for command...)", 'active', 8000);
        return;
      }

      // User gave command with Jarvis prefix (e.g. "Jarvis login", "Jarvis tooth 14 caries")
      if (isRecentDuplicate) return;

      console.log('%c✅ [JARVIS WAKE WORD + COMMAND]', 'color: #00e5ff; font-weight: bold;', `Cleaned command: "${text}"`);
      expectingCommandAfterWakeWordRef.current = false;
      lastExecutedCommandRef.current = lower;
      lastExecutionTimeRef.current = now;
      processDoctorCommand(text);
      return;
    }

    // If doctor said "Hello Jarvis" previously, whatever they say next is the command!
    if (wasAwaitingCommand && text.length > 2) {
      if (isRecentDuplicate) return;
      console.log('%c⚡ [JARVIS COMMAND FOLLOWING WAKE PROMPT]', 'color: #00ff88; font-weight: bold;', `Executing: "${text}"`);
      expectingCommandAfterWakeWordRef.current = false;
      lastExecutedCommandRef.current = lower;
      lastExecutionTimeRef.current = now;
      processDoctorCommand(text);
      return;
    }

    // Direct clinical directives while Jarvis is active
    if (hasClinicalIntent) {
      if (isRecentDuplicate) return;
      console.log('%c⚡ [JARVIS DIRECT CLINICAL DIRECTIVE]', 'color: #76ff03; font-weight: bold;', `Direct command accepted: "${text}"`);
      lastExecutedCommandRef.current = lower;
      lastExecutionTimeRef.current = now;
      processDoctorCommand(text);
      return;
    }

    // Ambient conversation ignored (saves tokens and prevents interruptions)
    if (isFinal) {
      console.log('%c🔇 [JARVIS AMBIENT FILTER]', 'color: #ffaa00;', `Ignored background conversation: "${rawTranscript}". (Say "Jarvis, ..." to trigger)`);
      showLiveSubtitle(`Heard: "${rawTranscript}" (Say "Jarvis, ...")`, 'heard', 3000);
    }

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
      rec.interimResults = true; // ⚡ Sub-100ms instant response without waiting for silence!
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        console.log('%c🟢 [JARVIS MIC LISTENING]', 'background: #004d40; color: #64ffda; font-weight: bold; padding: 2px 6px;', 'Microphone is actively capturing operatory audio.');
      };

      rec.onresult = (e) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const item = e.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const candidate = (finalTranscript || interimTranscript).trim();
        if (!candidate) return;

        // Acoustic feedback suppression: check if candidate is reflection from device speakers
        if (aiVoice.isRecentEcho && aiVoice.isRecentEcho(candidate)) {
          console.log('%c🔇 [ACOUSTIC ECHO SUPPRESSED]', 'color: #78909c;', candidate);
          return;
        }

        // Interruption (Barge-in): Doctor is speaking while Jarvis was talking
        if (aiVoice.speaking) {
          console.log('%c⚡ [JARVIS VOICE BARGE-IN]', 'background: #00e5ff; color: #000; font-weight: bold;', 'Doctor interrupted speech with:', candidate);
          aiVoice.stop();
        }

        const isFinal = Boolean(finalTranscript);
        onSpeechResult(candidate, isFinal);
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
      {/* 🌟 AUTONOMOUS VIRTUAL JARVIS CURSOR OVERLAY */}
      {virtualCursor.visible && (
        <div 
          className="fixed pointer-events-none z-[999999]"
          style={{
            left: `${virtualCursor.x}px`,
            top: `${virtualCursor.y}px`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2), top 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2)'
          }}
        >
          {/* Shockwave Ripple Ring on Click */}
          {virtualCursor.clicking && (
            <span className="absolute -inset-4 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping" />
          )}
          
          {/* Glowing AI Target Reticle */}
          <div className="relative flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full border-2 border-cyan-400/80 bg-cyan-500/10 backdrop-blur-xs flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.6)] ${virtualCursor.pulsing ? 'scale-110' : 'scale-100'} transition-transform`}>
              {/* Center Target Dot */}
              <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#00f2fe]" />
              
              {/* Reticle Crosshairs */}
              <span className="absolute -top-1 w-0.5 h-2 bg-cyan-300" />
              <span className="absolute -bottom-1 w-0.5 h-2 bg-cyan-300" />
              <span className="absolute -left-1 w-2 h-0.5 bg-cyan-300" />
              <span className="absolute -right-1 w-2 h-0.5 bg-cyan-300" />
            </div>

            {/* Futuristic Floating Telemetry Pill */}
            <div className="absolute left-10 top-0 whitespace-nowrap bg-[#10244B]/95 text-cyan-200 border border-cyan-400/40 rounded-full px-3 py-1 text-[11px] font-bold shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-white font-extrabold tracking-wider">JARVIS</span>
              <span className="text-cyan-300 font-mono font-medium">| {virtualCursor.label}</span>
            </div>
          </div>
        </div>
      )}

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

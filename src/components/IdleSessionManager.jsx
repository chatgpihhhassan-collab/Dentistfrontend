import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';

// ⏱️ 10 Minutes Inactivity Timeout (600,000 milliseconds)
export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
// ⚠️ 60 Seconds Warning Window before expiration
export const WARNING_THRESHOLD_MS = 60 * 1000;
export const STORAGE_LAST_ACTIVE_KEY = 'dentia_last_active';
export const SESSION_CHANNEL_NAME = 'dentia_session_channel';

/**
 * Programmatically records clinician activity from anywhere in the application
 * (e.g. from background fetch/axios interceptors).
 */
export function recordDoctorActivity() {
    try {
        const now = Date.now();
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(now));
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
            channel.postMessage({ type: 'ACTIVITY', timestamp: now });
            channel.close();
        }
    } catch {
        // Safe fallback for private browsing or restricted environments
    }
}

export default function IdleSessionManager() {
    const navigate = useNavigate();
    const location = useLocation();

    const [showWarning, setShowWarning] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(60);

    const lastEventThrottleRef = useRef(Date.now());
    const channelRef = useRef(null);

    // Reset sliding session timer
    const resetTimer = useCallback(() => {
        const now = Date.now();
        lastEventThrottleRef.current = now;
        try {
            localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(now));
            if (channelRef.current) {
                channelRef.current.postMessage({ type: 'ACTIVITY', timestamp: now });
            }
        } catch {}
        setShowWarning(false);
    }, []);

    // Expire session immediately
    const expireSession = useCallback(() => {
        try {
            localStorage.removeItem('doctor');
            localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
            if (channelRef.current) {
                channelRef.current.postMessage({ type: 'SESSION_EXPIRED' });
            }
        } catch {}
        setShowWarning(false);
        navigate('/login?expired=true', { replace: true, state: { sessionExpired: true } });
    }, [navigate]);

    useEffect(() => {
        // Setup Cross-Tab Broadcast Channel
        if (typeof BroadcastChannel !== 'undefined') {
            channelRef.current = new BroadcastChannel(SESSION_CHANNEL_NAME);
            channelRef.current.onmessage = (event) => {
                const data = event.data;
                if (!data) return;
                if (data.type === 'ACTIVITY') {
                    setShowWarning(false);
                } else if (data.type === 'SESSION_EXPIRED') {
                    try {
                        localStorage.removeItem('doctor');
                        localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
                    } catch {}
                    setShowWarning(false);
                    navigate('/login?expired=true', { replace: true, state: { sessionExpired: true } });
                }
            };
        }

        // Multi-tab storage sync
        const handleStorageChange = (e) => {
            if (e.key === STORAGE_LAST_ACTIVE_KEY && e.newValue) {
                setShowWarning(false);
            } else if (e.key === 'doctor' && !e.newValue) {
                // Doctor logged out in another tab
                navigate('/login?expired=true', { replace: true, state: { sessionExpired: true } });
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // High-frequency event throttling: Max 1 localStorage write per 2.5 seconds
        const handleUserInteraction = () => {
            const stored = localStorage.getItem('doctor');
            if (!stored) return;

            const now = Date.now();
            if (now - lastEventThrottleRef.current >= 2500) {
                resetTimer();
            } else if (showWarning) {
                // If warning is already displayed, any interaction immediately dismisses it
                resetTimer();
            }
        };

        const eventOptions = { passive: true, capture: true };
        const monitoredEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown', 'wheel'];
        monitoredEvents.forEach(evt => window.addEventListener(evt, handleUserInteraction, eventOptions));

        // Initialize active timestamp if logged in
        const storedDoc = localStorage.getItem('doctor');
        if (storedDoc) {
            const currentActive = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
            if (!currentActive) {
                localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(Date.now()));
            }
        }

        // Precision 1-second heartbeat loop
        const intervalId = setInterval(() => {
            const doctor = localStorage.getItem('doctor');
            // Only monitor if clinician is actively logged in
            if (!doctor) {
                setShowWarning(false);
                return;
            }

            const lastActiveStr = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
            const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
            const elapsed = Date.now() - lastActive;
            const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;

            if (remainingMs <= 0) {
                expireSession();
            } else if (remainingMs <= WARNING_THRESHOLD_MS) {
                setShowWarning(true);
                setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
            } else {
                setShowWarning(false);
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
            monitoredEvents.forEach(evt => window.removeEventListener(evt, handleUserInteraction, eventOptions));
            window.removeEventListener('storage', handleStorageChange);
            if (channelRef.current) {
                channelRef.current.close();
            }
        };
    }, [navigate, resetTimer, expireSession, showWarning]);

    // Do not render warning banner on login/public auth pages
    if (!showWarning || location.pathname === '/login') {
        return null;
    }

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92%] sm:w-auto animate-bounce-short">
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Inactivity Lock Warning</span>
                            <span className="bg-rose-500/30 text-rose-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-rose-400/40">
                                {secondsRemaining}s
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                            Session expires in <strong className="text-white font-bold">{secondsRemaining} seconds</strong> due to inactivity.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={resetTimer}
                    className="flex-shrink-0 bg-gradient-to-r from-[#4A7CD2] to-[#00C5A0] hover:from-[#3665B7] hover:to-[#00a886] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Stay Signed In</span>
                </button>
            </div>
        </div>
    );
}

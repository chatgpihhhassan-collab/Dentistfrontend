import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Usb, X } from 'lucide-react';
import nanoPixService from '../services/nanoPixDeviceService';

/**
 * GlobalNanoPixHardwareSyncManager
 * 
 * Background hardware watcher for Eighteeth Nano-Pix 1 & 2 USB intraoral sensors.
 * - Only active for authenticated clinicians.
 * - If on an active patient chart (/chart/:id), synchronizes capture session.
 * - Never displays intrusive modals outside the chart.
 */
export const GlobalNanoPixHardwareSyncManager = () => {
  const location = useLocation();
  const [toastNotification, setToastNotification] = useState(null);
  const toastTimeoutRef = useRef(null);

  const isDoctorLoggedIn = () => {
    try {
      const stored = localStorage.getItem('doctor');
      if (!stored) return false;
      const doctor = JSON.parse(stored);
      return Boolean(doctor && doctor.token);
    } catch {
      return false;
    }
  };

  const showToast = (message, type = 'success') => {
    if (!isDoctorLoggedIn()) return; // Do not show toasts to unauthenticated visitors
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotification({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  };

  useEffect(() => {
    const handleConnected = (deviceInfo) => {
      // Do nothing if not logged in
      if (!isDoctorLoggedIn()) return;

      const isChart = location.pathname.startsWith('/chart');
      const devName = deviceInfo?.model || 'Eighteeth Nano-Pix 2 (HD CMOS)';

      console.log(`%c[GLOBAL HARDWARE SYNC] Eighteeth Nano-Pix Plugged In via USB!%c Path: ${location.pathname} | Device: ${devName}`,
        'background: #0B4F4A; color: #4ADE80; font-weight: 800; padding: 3px 8px; border-radius: 4px;',
        'color: #0B4F4A; font-weight: 600;'
      );

      // On active patient chart, trigger chart sync
      if (isChart) {
        window.dispatchEvent(new CustomEvent('dentia:voice:open-nanopix'));
      }
    };

    const handleDisconnected = () => {
      if (!isDoctorLoggedIn()) return;
      console.log('[GLOBAL HARDWARE SYNC] Eighteeth Nano-Pix Unplugged from USB');
      showToast('🔌 Eighteeth Nano-Pix USB Sensor Disconnected', 'warn');
    };

    // 1. Subscribe to NanoPix Service
    const unsubConnect = nanoPixService.subscribe('connected', handleConnected);
    const unsubDisconnect = nanoPixService.subscribe('disconnected', handleDisconnected);

    // 2. Global CustomEvent listener
    const onCustomConnect = (e) => handleConnected(e.detail);
    const onCustomDisconnect = () => handleDisconnected();
    window.addEventListener('nanopix:connected', onCustomConnect);
    window.addEventListener('nanopix:disconnected', onCustomDisconnect);

    return () => {
      if (typeof unsubConnect === 'function') unsubConnect();
      if (typeof unsubDisconnect === 'function') unsubDisconnect();
      window.removeEventListener('nanopix:connected', onCustomConnect);
      window.removeEventListener('nanopix:disconnected', onCustomDisconnect);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [location.pathname]);

  return (
    <>
      {/* Floating Hardware Plug & Play Notification Banner (Authenticated Clinicians Only) */}
      {toastNotification && isDoctorLoggedIn() && (
        <div className="fixed top-5 right-5 z-[99999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all select-none ${
            toastNotification.type === 'success'
              ? 'bg-[#0B4F4A]/95 text-white border-emerald-400/40 shadow-emerald-950/20'
              : 'bg-slate-900/95 text-white border-slate-700/60 shadow-black/20'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toastNotification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Usb className="w-4 h-4 animate-pulse" />
            </div>

            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>{toastNotification.type === 'success' ? 'Hardware Sync Active' : 'Hardware Notification'}</span>
                {toastNotification.type === 'success' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                )}
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 max-w-xs">{toastNotification.message}</p>
            </div>

            <button
              onClick={() => setToastNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalNanoPixHardwareSyncManager;

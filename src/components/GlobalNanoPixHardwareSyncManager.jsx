import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Usb, Activity, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';
import nanoPixService from '../services/nanoPixDeviceService';
import NanoPixPatientPromptModal from './NanoPixPatientPromptModal';

/**
 * GlobalNanoPixHardwareSyncManager
 * 
 * Global hardware watcher for Eighteeth Nano-Pix 1 & 2 USB intraoral sensors.
 * Automatically synchronizes with the application as soon as the physical USB
 * device is plugged in:
 * - If on an active patient chart (/chart/:id): auto-arms and opens the capture modal.
 * - If outside a chart: prompts doctor to select which clinic patient to assign the scan to.
 */
export const GlobalNanoPixHardwareSyncManager = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [promptOpen, setPromptOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotification({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  useEffect(() => {
    const handleConnected = (deviceInfo) => {
      const isChart = location.pathname.startsWith('/chart');
      const devName = deviceInfo?.model || 'Eighteeth Nano-Pix 2 (HD CMOS)';

      console.log(`%c[GLOBAL HARDWARE SYNC] Eighteeth Nano-Pix Plugged In via USB!%c Path: ${location.pathname} | Device: ${devName}`,
        'background: #0B4F4A; color: #4ADE80; font-weight: 800; padding: 3px 8px; border-radius: 4px;',
        'color: #0B4F4A; font-weight: 600;'
      );

      showToast(`⚡ ${devName} Connected via USB & Synced with Application!`, 'success');

      if (isChart) {
        // Dispatch event to active chart
        window.dispatchEvent(new CustomEvent('dentia:voice:open-nanopix'));
      } else {
        // Outside chart -> Prompt doctor which patient to assign
        setPromptOpen(true);
      }
    };

    const handleDisconnected = () => {
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

  const handleSelectPatient = (patient) => {
    const pId = patient.patientID || patient.id;
    setPromptOpen(false);
    if (pId) {
      navigate(`/chart/${pId}?nanopix=open`);
    }
  };

  return (
    <>
      {/* 🌟 Floating Real-time Hardware Plug & Play Notification Banner */}
      {toastNotification && (
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

      {/* 🌟 Patient Selection Modal when USB is plugged in outside of Chart */}
      <NanoPixPatientPromptModal
        isOpen={promptOpen}
        onClose={() => setPromptOpen(false)}
        onSelectPatient={handleSelectPatient}
      />
    </>
  );
};

export default GlobalNanoPixHardwareSyncManager;

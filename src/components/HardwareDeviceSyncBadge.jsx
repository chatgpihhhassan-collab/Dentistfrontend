import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, CheckCircle2, HardDrive, RefreshCw, Sparkles, X, Usb, Activity, Radio, AlertCircle, Video } from 'lucide-react';
import { useHardwareDeviceWatcher } from '../hooks/useHardwareDeviceWatcher';
import { CameraCapturePanel } from './CameraCapturePanel';

export const HardwareDeviceSyncBadge = ({ onOpenCapturePanel }) => {
  const { isConnected, deviceName, deviceBrand, deviceType, deviceList, hasBuiltInCamera, status, refreshDevices } = useHardwareDeviceWatcher();
  const [showModal, setShowModal] = useState(false);
  const [showCapturePanel, setShowCapturePanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleRescan = async () => {
    setIsScanning(true);
    await refreshDevices();
    setTimeout(() => setIsScanning(false), 600);
  };

  const modalContent = showModal && mounted ? (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Chairside Hardware Diagnostics</h3>
              <p className="text-xs text-slate-500">Auto-Detect USB Intraoral Cameras & Digital Sensors</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(false)} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Connection State</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isConnected 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isConnected ? 'Active & Synced' : 'Offline / Standby'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Hardware Brand</span>
              <span className="text-xs font-bold text-slate-800">{deviceBrand || 'Generic UVC'}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Pipeline Protocol</span>
              <span className="text-xs font-medium text-teal-700">
                {deviceType === 'intraoral_camera' ? 'UVC MediaStream' : 'TWAIN / Hot Folder'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-0.5">Primary Active Device</span>
            <span className="text-xs font-mono text-slate-700 block truncate bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
              {deviceName || 'No USB camera connected'}
            </span>
          </div>
        </div>

        {/* Detected Devices List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700">Connected Hardware ({deviceList.length})</h4>
            <span className="text-[11px] text-slate-600">Plug & Play Live</span>
          </div>

          {deviceList.length > 0 ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {deviceList.map((d, i) => (
                <div key={d.deviceId || i} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Usb className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate text-slate-800 font-medium">{d.label || `USB Video Camera ${i + 1}`}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
              <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-amber-900">No USB dental cameras detected.</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Connect your intraoral camera or digital sensor to any USB port.</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-600' : ''}`} />
            {isScanning ? 'Scanning...' : 'Rescan USB'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={() => {
                setShowModal(false);
                if (onOpenCapturePanel) {
                  onOpenCapturePanel();
                } else {
                  setShowCapturePanel(true);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-700 to-[#0B4F4A] hover:from-teal-800 hover:to-[#083c38] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" /> Open Live Camera Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const capturePanelPortal = showCapturePanel && mounted ? (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setShowCapturePanel(false)}
    >
      <div 
        className="w-full max-w-2xl relative animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CameraCapturePanel 
          patientId={1} 
          onClose={() => setShowCapturePanel(false)}
          onUploadSuccess={(data) => {
            alert('Capture saved & analyzed successfully with AI Groq Vision!');
            setShowCapturePanel(false);
          }}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Interactive Sync Pill in Navbar */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border cursor-pointer select-none ${
          isConnected
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 hover:bg-emerald-500/25 hover:border-emerald-600/50'
            : 'bg-slate-100/90 border-slate-300 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
        }`}
        title="Click to view Chairside Hardware Connection Details"
      >
        {isConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Usb className="w-3.5 h-3.5 text-emerald-700" />
            <span className="truncate max-w-[130px] font-semibold text-emerald-900">{deviceBrand}: Synced</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            <Usb className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Hardware: Offline</span>
          </>
        )}
      </button>

      {/* Render via Portal so it is never constrained by parent backdrop-filter */}
      {modalContent && createPortal(modalContent, document.body)}
      {capturePanelPortal && createPortal(capturePanelPortal, document.body)}
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, CheckCircle2, HardDrive, RefreshCw, Sparkles, X, Usb, Activity, Radio, AlertCircle, Video } from 'lucide-react';
import { useHardwareDeviceWatcher } from '../hooks/useHardwareDeviceWatcher';
import { CameraCapturePanel } from './CameraCapturePanel';
import nanoPixService from '../services/nanoPixDeviceService';

export const HardwareDeviceSyncBadge = ({ onOpenCapturePanel }) => {
  const { isConnected, deviceName, deviceBrand, deviceType, deviceList, hasBuiltInCamera, status, refreshDevices } = useHardwareDeviceWatcher();
  const [nanoPixStatus, setNanoPixStatus] = useState(() => nanoPixService.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [showCapturePanel, setShowCapturePanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState(() => nanoPixService.getLogs());

  useEffect(() => {
    setMounted(true);

    const onConnect = (info) => setNanoPixStatus({ isConnected: true, deviceInfo: info });
    const onDisconnect = () => setNanoPixStatus({ isConnected: false, deviceInfo: null });
    const onLog = () => setLogs(nanoPixService.getLogs());
    
    const unsubC = nanoPixService.subscribe('connected', onConnect);
    const unsubD = nanoPixService.subscribe('disconnected', onDisconnect);
    const unsubL = nanoPixService.subscribe('log', onLog);

    return () => {
      if (typeof unsubC === 'function') unsubC();
      if (typeof unsubD === 'function') unsubD();
      if (typeof unsubL === 'function') unsubL();
    };
  }, []);

  const isHardwareActive = isConnected || Boolean(nanoPixStatus?.isConnected);
  const activeBrand = nanoPixStatus?.isConnected ? 'Eighteeth NanoPix' : (deviceBrand || 'Generic UVC');
  const activeName = nanoPixStatus?.isConnected ? (nanoPixStatus?.deviceInfo?.model || 'Eighteeth Nano-Pix 2') : (deviceName || 'No USB camera connected');
  const activeProtocol = nanoPixStatus?.isConnected ? 'Direct USB 2.0 (RVG WebUSB)' : (deviceType === 'intraoral_camera' ? 'UVC MediaStream' : 'TWAIN / Hot Folder');

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

  const [testStream, setTestStream] = useState(null);
  const [testError, setTestError] = useState(null);
  const testVideoRef = useRef(null);

  // Stop test stream when modal closes
  useEffect(() => {
    if (!showModal && testStream) {
      testStream.getTracks().forEach((t) => t.stop());
      setTestStream(null);
      setTestError(null);
    }
  }, [showModal, testStream]);

  const toggleTestStream = async () => {
    if (testStream) {
      testStream.getTracks().forEach((t) => t.stop());
      setTestStream(null);
      setTestError(null);
      return;
    }

    try {
      setTestError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setTestStream(stream);
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      setTestError('Camera access denied or device busy: ' + err.message);
    }
  };

  useEffect(() => {
    if (testStream && testVideoRef.current) {
      testVideoRef.current.srcObject = testStream;
    }
  }, [testStream]);

  const modalContent = showModal && mounted ? (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => {
        if (testStream) testStream.getTracks().forEach((t) => t.stop());
        setTestStream(null);
        setShowModal(false);
      }}
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
            onClick={() => {
              if (testStream) testStream.getTracks().forEach((t) => t.stop());
              setTestStream(null);
              setShowModal(false);
            }} 
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
              isHardwareActive 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isHardwareActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isHardwareActive ? 'Active & Synced' : 'Offline / Standby'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Hardware Brand</span>
              <span className="text-xs font-bold text-slate-800">{activeBrand}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Pipeline Protocol</span>
              <span className="text-xs font-medium text-teal-700">
                {activeProtocol}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-0.5">Primary Active Device</span>
            <span className="text-xs font-mono text-slate-700 block truncate bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
              {activeName}
            </span>
          </div>
        </div>

        {/* Live Built-in Webcam Self-Test Feed */}
        <div className="mt-4 p-3 bg-slate-900 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${testStream ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span className="text-xs font-bold">Webcam Hardware Test</span>
            </div>
            <button
              onClick={toggleTestStream}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                testStream
                  ? 'bg-rose-500/80 hover:bg-rose-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              {testStream ? 'Stop Test' : 'Test Live Webcam'}
            </button>
          </div>

          {testStream ? (
            <div className="relative rounded-lg overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-800">
              <video ref={testVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                ● Live Feed: Operational & Ready
              </div>
            </div>
          ) : testError ? (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{testError}</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Click &ldquo;Test Live Webcam&rdquo; above to verify your laptop camera stream directly from this window.
            </p>
          )}
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

        {/* NanoPix API Logs Viewer & Stepper */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-500" />
                Diagnostic Backend Pipeline
              </h4>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  showLogs 
                    ? 'bg-slate-100 text-slate-700 border-slate-300' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {showLogs ? 'Hide Logs' : 'View Live Logs'}
              </button>
            </div>

            {/* Visual Stepper */}
            <div className="flex items-center justify-between px-2 mt-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const isReached = logs.some(l => l.message.includes(`[STEP ${step}]`));
                
                // Step 1: Manual Trigger Button
                if (step === 1) {
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={async () => {
                          setShowLogs(true);
                          try {
                            const res = await fetch('http://127.0.0.1:5066/nanopix/test-hardware-exposure', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ toothKey: "19", patientId: "Test" })
                            });
                            const data = await res.json();
                            if (!data.success) {
                              alert(data.message || 'Hardware Error: Device not detected');
                            }
                          } catch (e) {
                            console.error("Simulation failed:", e);
                            alert("Cannot connect to local NanoPix Agent. Please ensure node nanopix_usb_bridge.cjs is running.");
                          }
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 cursor-pointer ${isReached ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30 hover:bg-fuchsia-700 hover:scale-105 active:scale-95 animate-pulse ring-4 ring-fuchsia-100'}`}
                        title="Click to Start Step 1"
                      >
                        {isReached ? <CheckCircle2 className="w-5 h-5" /> : 'START'}
                      </button>
                      <span className={`text-[9px] text-center leading-tight ${isReached ? 'text-emerald-700 font-bold' : 'text-fuchsia-700 font-bold'}`}>
                        Step 1<br/>Connect
                      </span>
                    </div>
                  );
                }

                // Step 4: Manual Apply Button
                if (step === 4) {
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5 relative">
                      <div className={`absolute top-4 -left-[calc(50vw/4)] w-[calc(50vw/4)] h-[2px] -z-10 transition-all duration-700 ${isReached ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                      
                      <button
                        onClick={async () => {
                          try {
                            await fetch('http://127.0.0.1:5066/nanopix/test-hardware-exposure', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ phase: 2 })
                            });
                          } catch (e) {
                            console.error("Simulation failed:", e);
                          }
                        }}
                        disabled={!logs.some(l => l.message.includes(`[STEP 3]`))}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 cursor-pointer ${isReached ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : logs.some(l => l.message.includes(`[STEP 3]`)) ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 hover:bg-sky-700 hover:scale-105 active:scale-95 animate-pulse ring-4 ring-sky-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'}`}
                        title="Click to Apply Image (Step 4)"
                      >
                        {isReached ? <CheckCircle2 className="w-5 h-5" /> : 'APPLY'}
                      </button>
                      <span className={`text-[9px] text-center leading-tight ${isReached ? 'text-emerald-700 font-bold' : logs.some(l => l.message.includes(`[STEP 3]`)) ? 'text-sky-700 font-bold' : 'text-slate-400'}`}>
                        Step 4<br/>Chart
                      </span>
                    </div>
                  );
                }

                // Steps 2, 3, 5: Auto visual indicators
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5 relative">
                    {/* Connecting Line */}
                    <div className={`absolute top-4 -left-[calc(50vw/4)] w-[calc(50vw/4)] h-[2px] -z-10 transition-all duration-700 ${isReached ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 z-10 ${isReached ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-110 ring-2 ring-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {isReached ? <CheckCircle2 className="w-4 h-4" /> : step}
                    </div>
                    <span className={`text-[9px] font-medium text-center leading-tight ${isReached ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {step === 2 ? 'Step 2\nTimer' : step === 3 ? 'Step 3\nData Rx' : 'Step 5\nAI Gen'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {showLogs && (
            <div className="bg-slate-900 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-1.5 border border-slate-800 shadow-inner">
              {logs.length > 0 ? logs.map((log, i) => {
                let colorClass = 'text-slate-300';
                if (log.type === 'API') colorClass = 'text-sky-300';
                else if (log.type === 'WARN') colorClass = 'text-amber-400';
                else if (log.type === 'SUCCESS') colorClass = 'text-emerald-400';
                else if (log.type === 'EXPOSURE') colorClass = 'text-fuchsia-400';
                
                return (
                  <div key={log.id || i} className="border-b border-slate-800/50 pb-1 mb-1">
                    <span className="text-slate-500 mr-2">[{log.time}]</span>
                    <span className={`font-semibold ${colorClass}`}>[{log.type}]</span>
                    <span className="text-slate-300 ml-2">{log.message}</span>
                  </div>
                );
              }) : (
                <div className="text-slate-500 text-center py-6">No logs available yet...</div>
              )}
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
          isHardwareActive
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 hover:bg-emerald-500/25 hover:border-emerald-600/50'
            : 'bg-slate-100/90 border-slate-300 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
        }`}
        title="Click to view Chairside Hardware Connection Details"
      >
        {isHardwareActive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Usb className="w-3.5 h-3.5 text-emerald-700" />
            <span className="truncate max-w-[130px] font-semibold text-emerald-900">{activeBrand}: Synced</span>
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

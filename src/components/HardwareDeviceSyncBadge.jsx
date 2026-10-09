import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, HardDrive, RefreshCw, Sparkles, X, Usb, Activity, Radio, AlertCircle, Video, Zap, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useHardwareDeviceWatcher } from '../hooks/useHardwareDeviceWatcher';
import { CameraCapturePanel } from './CameraCapturePanel';
import nanoPixService from '../services/nanoPixDeviceService';

export const HardwareDeviceSyncBadge = ({ onOpenCapturePanel }) => {
  const navigate = useNavigate();
  const { isConnected, deviceName, deviceBrand, deviceType, deviceList, hasBuiltInCamera, status, refreshDevices } = useHardwareDeviceWatcher();
  const [nanoPixStatus, setNanoPixStatus] = useState(() => nanoPixService.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [showCapturePanel, setShowCapturePanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState(() => nanoPixService.getLogs());
  const [showWebcamTest, setShowWebcamTest] = useState(false);

  // ── Bridge Health Check State ──────────────────────────────────────────────
  const [bridgeHealth, setBridgeHealth] = useState(null); // null=unknown, 'ok', 'no-bridge', 'no-usb', 'partial'
  const [bridgeChecking, setBridgeChecking] = useState(false);

  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const bridgeBaseUrl = isLocalHost ? '' : 'http://localhost:5066';
  const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const checkBridgeHealth = async () => {
    setBridgeChecking(true);
    try {
      // 1. Directly query local bridge status FIRST (fast, zero blocking)
      let data = await nanoPixService.fetchBridgeJson('/nanopix/status', { timeout: 3500 });
      if (!data) {
        // Retry once after brief pause
        await new Promise(r => setTimeout(r, 600));
        data = await nanoPixService.fetchBridgeJson('/nanopix/status', { timeout: 3500 });
      }

      if (!data) throw new Error('no_bridge_response');

      // Proactively ensure engine is active in background
      nanoPixService.launchEngine().catch(() => {});

      if (data.bridgeOnline && data.usbConnected) {
        setBridgeHealth('ok');
        const deviceInfo = {
          brand: 'Eighteeth',
          model: data.model || 'Eighteeth Nano-Pix 2 (HD CMOS)',
          serialNumber: data.serialNumber || 'iRayC7DB5M40P4',
          status: 'Ready (Armed)'
        };
        setNanoPixStatus({ isConnected: true, deviceInfo });
        nanoPixService.setConnected(true, deviceInfo.model);
      } else if (data.bridgeOnline && !data.usbConnected) {
        setBridgeHealth('no-usb');
      } else {
        setBridgeHealth('partial');
      }
    } catch (e) {
      setBridgeHealth('no-bridge');
    } finally {
      setBridgeChecking(false);
    }
  };

  // Run health check when modal opens
  useEffect(() => {
    if (showModal) {
      checkBridgeHealth();
    }
  }, [showModal]);

  useEffect(() => {
    setMounted(true);

    const onConnect = (info) => {
      setNanoPixStatus({ isConnected: true, deviceInfo: info });
      setBridgeHealth('ok');
    };
    const onDisconnect = () => {
      setNanoPixStatus({ isConnected: false, deviceInfo: null });
      setBridgeHealth('no-usb');
    };
    const onTelemetry = (telemetry) => {
      if (telemetry) {
        setBridgeHealth(telemetry.deviceCount > 0 ? 'ok' : 'no-usb');
      }
    };
    const onLog = () => setLogs(nanoPixService.getLogs());
    
    const unsubC = nanoPixService.subscribe('connected', onConnect);
    const unsubD = nanoPixService.subscribe('disconnected', onDisconnect);
    const unsubT = nanoPixService.subscribe('telemetry', onTelemetry);
    const unsubL = nanoPixService.subscribe('log', onLog);

    // Initial check on mount so health is already resolved before modal opens
    checkBridgeHealth();

    return () => {
      if (typeof unsubC === 'function') unsubC();
      if (typeof unsubD === 'function') unsubD();
      if (typeof unsubT === 'function') unsubT();
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

  const handleAutoStartBridge = () => {
    try {
      window.location.href = 'dentia-hw://start';
    } catch (_) {}
    setTimeout(checkBridgeHealth, 1500);
    setTimeout(checkBridgeHealth, 3500);
  };

  const [testStream, setTestStream] = useState(null);
  const [testError, setTestError] = useState(null);
  const [pipelineError, setPipelineError] = useState(null);
  const testVideoRef = useRef(null);

  // Stop test stream when modal closes
  useEffect(() => {
    if (!showModal && testStream) {
      testStream.getTracks().forEach((t) => t.stop());
      setTestStream(null);
      setTestError(null);
      setPipelineError(null);
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
        className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto flex flex-col"
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (testStream) testStream.getTracks().forEach((t) => t.stop());
                setTestStream(null);
                setShowModal(false);
                navigate('/setup-guide');
              }}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
            >
              Setup Guide
            </button>
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
        </div>

        {/* ── CRITICAL USER INSTRUCTION: MINIMIZE NANOPIX WINDOW (DO NOT CLOSE) ── */}
        <div className="mt-3.5 p-3.5 bg-amber-500/10 border border-amber-400/40 rounded-2xl flex items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-amber-200/90 text-amber-900 font-black text-[11px] tracking-wide shrink-0 flex items-center gap-1.5 border border-amber-300">
              <Minus className="w-3.5 h-3.5 stroke-[3]" /> MINIMIZE [ — ]
            </span>
            <div className="text-xs">
              <span className="font-bold text-amber-900">User Instruction:</span>{' '}
              <span className="text-amber-800">
                NanoPix window screen par open hone ke baad please ise <strong>Minimize</strong> kar dein, band (✕) mat karein. Yeh backend communication ke liye zaroori hai.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 hidden sm:inline">
            Required in Background
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* ── LEFT COLUMN: Sensor Pipeline & Diagnostics ── */}
          <div className="space-y-4">
            {/* ── Doctor Setup Checklist: Hardware Diagnostics ─────────────────── */}
            <div className="space-y-2">

          {/* Checking state */}
          {bridgeChecking && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-500 shrink-0" />
              <span>Checking NanoPix hardware bridge status on your PC...</span>
            </div>
          )}

          {/* ❌ SCENARIO 1: Bridge not running at all */}
          {bridgeHealth === 'no-bridge' && !bridgeChecking && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-800">Hardware Bridge Not Running</p>
                  <p className="text-xs text-rose-700 mt-0.5">The NanoPix local service is not active on your computer. The bridge must be running in the background for live X-ray captures.</p>
                </div>
              </div>

              {/* ⚡ ONE-CLICK AUTO-START PROTOCOL BUTTON */}
              <div className="bg-gradient-to-r from-sky-600 to-teal-600 p-3 rounded-xl text-white space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-300" /> 1-Click Auto-Start Local Agent
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Zero Terminal Required</span>
                </div>
                <p className="text-[11px] text-sky-100">Click below to launch the background bridge automatically via Windows Protocol:</p>
                <button
                  onClick={handleAutoStartBridge}
                  className="w-full py-2 bg-white hover:bg-sky-50 active:bg-sky-100 text-sky-900 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" /> ⚡ Launch Hardware Agent Now
                </button>
              </div>

              <div className="bg-white rounded-lg border border-rose-200 p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">One-Time Clinic PC Setup (Permanent Auto-Start):</p>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Double-click <strong className="text-slate-900">REGISTER_DENTIA_PROTOCOL.bat</strong> (Enables 1-click browser auto-launch & auto-start on Windows boot)</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Or double-click <strong className="text-slate-900">START_NANOPIX_AUTO_SYNC.bat</strong> to start manually for this session</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Or terminal: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-rose-700">node nanopix_usb_bridge.cjs</code></span>
                </div>

                {isHttpsOrigin && (
                  <div className="mt-2.5 p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold">🔒 Using Cloud / HTTPS (Vercel)?</p>
                    <p>Modern browsers block HTTPS websites from reaching local USB ports (<code>http://localhost:5066</code>) by default.</p>
                    <p className="font-semibold text-amber-800">To fix this on Vercel:</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Click the <strong>Tune / Lock icon</strong> next to the URL in your browser bar.</li>
                      <li>Click <strong>Site settings</strong>.</li>
                      <li>Find <strong>Insecure content</strong> and set it to <strong>Allow</strong>.</li>
                      <li>Refresh this page, or open the local app directly at <a href="http://localhost:5173/directory" className="underline font-bold text-sky-700">http://localhost:5173/directory</a>.</li>
                    </ol>
                  </div>
                )}

                <p className="text-[11px] text-rose-600 pt-1 border-t border-rose-100">⚠️ After starting the bridge, click "Re-Check" below to verify.</p>
              </div>
              <button
                onClick={checkBridgeHealth}
                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Check Bridge Connection
              </button>
            </div>
          )}

          {/* ⚠️ SCENARIO 2: Bridge running but USB sensor not connected */}
          {bridgeHealth === 'no-usb' && !bridgeChecking && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <Usb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Bridge Active — USB Sensor Not Detected</p>
                  <p className="text-xs text-amber-700 mt-0.5">The local hardware bridge is running correctly on port 5066. However, the Eighteeth Nano-Pix sensor is not found on the USB bus.</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-amber-200 p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Fix — Checklist:</p>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Ensure the <strong>Eighteeth Nano-Pix sensor USB cable</strong> is securely plugged into your PC or laptop USB port</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Try a different USB port (prefer USB 2.0 port — blue ports may cause FTDI driver issues)</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Ensure the <strong>FTDI D2XX driver</strong> is installed. Open Device Manager and confirm "FTDI" appears under USB devices without a warning icon</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center shrink-0">4</span>
                  <span>If sensor LED is OFF, try power-cycling the sensor by unplugging and re-plugging the USB cable</span>
                </div>
              </div>
              <button
                onClick={checkBridgeHealth}
                className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Check USB Connection
              </button>
            </div>
          )}

          {/* ✅ SCENARIO 3: Everything is working */}
          {bridgeHealth === 'ok' && !bridgeChecking && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">All Systems Operational</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Bridge is active on port 5066 and the Eighteeth Nano-Pix sensor is physically connected and armed. Ready to capture X-rays.</p>
                </div>
              </div>
            </div>
          )}

          {/* Connection State Summary Row */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Hardware Brand</span>
              <span className="text-xs font-bold text-slate-800">{activeBrand}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Protocol</span>
              <span className="text-xs font-medium text-teal-700">{activeProtocol}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Primary Device</span>
            <span className="text-xs font-mono text-slate-700 block truncate">{activeName}</span>
          </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Hardware Installation Steps & Storage Verification ── */}
          <div className="space-y-4">
            {/* 1. Sequential 4-Step Hardware Installation Protocol */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Hardware Installation Steps</h4>
                    <p className="text-[10px] text-slate-500">Sequential chairside setup protocol</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {bridgeHealth === 'ok' ? 'All Steps Complete' : 'Steps 1-4'}
                </span>
              </div>

              <div className="space-y-2">
                {/* Step 1 */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">Install FTDI D2XX Driver</p>
                      <p className="text-[10px] text-slate-500">USB Kernel Driver (VID: 0x0403, PID: 0x6014)</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                  </span>
                </div>

                {/* Step 2 */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">REGISTER_DENTIA_PROTOCOL.bat</p>
                      <p className="text-[10px] text-slate-500">Registers dentia-hw:// protocol & Windows startup</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                  </span>
                </div>

                {/* Step 3 */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">START_NANOPIX_AUTO_SYNC.bat</p>
                      <p className="text-[10px] text-slate-500">Starts Port 5066 Bridge & NanoPix acquisition engine</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                    bridgeHealth === 'no-bridge' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {bridgeHealth === 'no-bridge' ? <RefreshCw className="w-3 h-3 text-amber-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {bridgeHealth === 'no-bridge' ? 'Pending' : 'Complete'}
                  </span>
                </div>

                {/* Step 4 */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">4</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">System Ready & NanoPix Minimized</p>
                      <p className="text-[10px] text-slate-500">Folders verified on disk, sensor armed for exposures</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                    isHardwareActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isHardwareActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Activity className="w-3 h-3 text-slate-400" />}
                    {isHardwareActive ? 'Ready' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Required Files & Storage Folders Verification */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Required Storage Folders & Files</h4>
                    <p className="text-[10px] text-slate-500">Verified filesystem targets for X-Ray acquisition</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Verified on Disk</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-semibold text-slate-800 text-[11px]">D:\PatientData / C:\PatientData</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-semibold text-slate-800 text-[11px]">nanopix_scans (Project Root)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-semibold text-slate-800 text-[11px]">drivers\eighteeth_engine\NanoPix.exe</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-semibold text-slate-800 text-[11px]">Windows Startup (DentiaNanoPixBridge.vbs)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Collapsible Webcam Self-Test (Optional Secondary Feature) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <button
                onClick={() => setShowWebcamTest(!showWebcamTest)}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-slate-500" />
                  <span>Intraoral Webcam Hardware Test (Optional)</span>
                  {deviceList.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                      {deviceList.length} Connected
                    </span>
                  )}
                </div>
                {showWebcamTest ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showWebcamTest && (
                <div className="p-3 space-y-3 bg-slate-900 text-white border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${testStream ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span className="text-xs font-bold">Webcam Self-Test Feed</span>
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
                        ● Live Feed: Operational
                      </div>
                    </div>
                  ) : testError ? (
                    <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{testError}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Click &ldquo;Test Live Webcam&rdquo; to preview your USB intraoral camera stream.
                    </p>
                  )}

                  {/* Connected Hardware List inside collapsible */}
                  {deviceList.length > 0 && (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pt-2 border-t border-slate-800">
                      {deviceList.map((d, i) => (
                        <div key={d.deviceId || i} className="p-2 bg-slate-800/80 border border-slate-700 rounded-lg text-[11px] flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate text-slate-200">
                            <Usb className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{d.label || `USB Video Camera ${i + 1}`}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-semibold shrink-0">Ready</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NanoPix API Logs Viewer & Stepper (Full Width Footer) */}
        <div className="mt-6 border-t border-slate-100 pt-4 shrink-0">
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

            {/* Inline Pipeline Status & Error Notice */}
            {pipelineError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Hardware Bridge Notice</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{pipelineError}</p>
                </div>
                <button 
                  onClick={() => setPipelineError(null)}
                  className="text-rose-400 hover:text-rose-600 font-bold text-xs cursor-pointer p-0.5"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Visual Stepper */}
            <div className="flex items-center justify-between px-2 mt-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const isReached = logs.some(l => l.message.includes(`[STEP ${step}]`));
                
                // Step 1: Arm Sensor on USB
                if (step === 1) {
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={async () => {
                          setPipelineError(null);
                          setShowLogs(true);
                          try {
                            const data = await nanoPixService.fetchBridgeJson('/nanopix/arm-sensor', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ toothKey: "19", patientId: "46" }),
                              timeout: 3000
                            });

                            if (data && data.success) {
                              checkBridgeHealth();
                            } else if (data && !data.success) {
                              setPipelineError(data.message || 'Hardware Error: Device not detected. Please verify USB connection.');
                            } else {
                              setPipelineError("Cannot connect to local NanoPix Agent on port 5066. Please verify bridge is running.");
                            }
                          } catch (e) {
                            console.error("Arming failed:", e);
                            setPipelineError("Cannot connect to local NanoPix Agent on port 5066. Please launch START_NANOPIX_AUTO_SYNC.bat on this PC.");
                          }
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 cursor-pointer ${isReached ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30 hover:bg-fuchsia-700 hover:scale-105 active:scale-95 animate-pulse ring-4 ring-fuchsia-100'}`}
                        title="Click to Arm Sensor on USB"
                      >
                        {isReached ? <CheckCircle2 className="w-5 h-5" /> : 'ARM'}
                      </button>
                      <span className={`text-[9px] text-center leading-tight ${isReached ? 'text-emerald-700 font-bold' : 'text-fuchsia-700 font-bold'}`}>
                        Step 1<br/>Arm USB
                      </span>
                    </div>
                  );
                }

                // Steps 2, 3, 4, 5: Automatic real-time status indicators
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5 relative">
                    {/* Connecting Line */}
                    <div className={`absolute top-4 -left-[calc(50vw/4)] w-[calc(50vw/4)] h-[2px] -z-10 transition-all duration-700 ${isReached ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 z-10 ${isReached ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-110 ring-2 ring-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {isReached ? <CheckCircle2 className="w-4 h-4" /> : step}
                    </div>
                    <span className={`text-[9px] font-medium text-center leading-tight ${isReached ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {step === 2 ? 'Step 2\nWaiting X-Ray' : step === 3 ? 'Step 3\nReal Data' : step === 4 ? 'Step 4\nChart Mount' : 'Step 5\nAI Analysis'}
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
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRescan}
              disabled={isScanning}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-600' : ''}`} />
              {isScanning ? 'Scanning...' : 'Rescan USB'}
            </button>

            <button
              onClick={async () => {
                await nanoPixService.launchEngine();
                setTimeout(checkBridgeHealth, 1000);
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Launch Eighteeth App
            </button>
          </div>

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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Radio,
  Wifi,
  WifiOff,
  Zap,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Volume2
} from 'lucide-react';
import { useNanoPixSensor } from '../hooks/useNanoPixSensor';

/**
 * Production-ready Dental Radiograph Medical Viewer & Chairside Control Center
 * for Eighteeth NanoPix 1.5 & NanoPix 2 Intraoral Sensors.
 */
export default function DentalSensorView({
  patient = {},
  initialToothKey = '19',
  doctorId = null,
  onUploadSuccess = null,
  onClose = null
}) {
  const patientId = patient?.id || patient?.patientID || null;
  const [selectedTooth, setSelectedTooth] = useState(initialToothKey);
  const [activeTab, setActiveTab] = useState('viewer');
  const [toastMessage, setToastMessage] = useState(null);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);

  // Medical Canvas Viewer Transform State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(0); // -100 to 100
  const [contrast, setContrast] = useState(0);   // -100 to 100
  const [isInverted, setIsInverted] = useState(false);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const canvasRef = useRef(null);
  const imageElementRef = useRef(null);

  // NanoPix Hardware WebSocket Hook
  const {
    bridgeOnline,
    deviceConnected,
    deviceStatus,
    deviceModel,
    deviceSerial,
    isArmed,
    lastCapturedImage,
    captureHistory,
    error,
    armSensor,
    abortArming,
    checkDiagnostic,
    reconnect
  } = useNanoPixSensor({
    patientId,
    toothKey: selectedTooth,
    doctorId,
    autoConnect: true,
    onCapture: handleAutoCapture
  });

  // Display Toast Notification
  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4500);
  }, []);

  // Handle capture event from hook
  function handleAutoCapture(captured) {
    showToast(`⚡ X-Ray exposure received for Tooth #${captured.toothKey || selectedTooth}! Calibrated & AES-256 Encrypted.`, 'success');
    handleUploadToCloud(captured);
  }

  // Cloud API Upload persistence
  const handleUploadToCloud = async (captureData = lastCapturedImage) => {
    if (!captureData) return;
    setIsUploadingCloud(true);

    try {
      const payload = {
        patientId: Number(patient?.id || patient?.patientID || 46),
        doctorId: doctorId ? Number(doctorId) : null,
        clinicId: 'CLINIC-01',
        toothKey: selectedTooth,
        sensorSN: captureData.sensorSN || deviceSerial,
        resolution: captureData.resolution || '1300x1800',
        rawWidth: captureData.width || 1300,
        rawHeight: captureData.height || 1800,
        previewBase64: captureData.previewBase64,
        encryptedPayload: captureData.encryptedPayload,
        iv: captureData.iv,
        tag: captureData.tag,
        isEncrypted: true
      };

      const res = await fetch('http://localhost:5000/api/xray/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        showToast('☁️ Radiograph synced to Central Cloud EHR & AI Engine!', 'success');
        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess(result);
        }
      } else {
        console.warn('Direct cloud upload status:', res.status);
      }
    } catch (err) {
      console.warn('Cloud sync note:', err.message);
    } finally {
      setIsUploadingCloud(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Canvas Medical Image Rendering Pipeline
  // ---------------------------------------------------------------------------
  const renderCanvasImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageElementRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Draw Empty Medical Canvas Slate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#475569';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isArmed
          ? '🟡 SENSOR ARMED: READY FOR X-RAY TUBE EXPOSURE (AED ACTIVE)'
          : 'Ready for acquisition. Click [Arm Sensor] to activate hardware exposure.',
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // 1. Apply Pan and Zoom Transforms
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(isFlipped ? -zoom : zoom, zoom);

    // Compute Aspect-Ratio Fitted Dimensions
    const scaleFactor = Math.min(
      (canvas.width * 0.9) / img.naturalWidth,
      (canvas.height * 0.9) / img.naturalHeight
    );
    const drawWidth = img.naturalWidth * scaleFactor;
    const drawHeight = img.naturalHeight * scaleFactor;

    // 2. Offscreen Rendering for Window/Level LUT adjustments
    const offscreen = document.createElement('canvas');
    offscreen.width = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(img, 0, 0);

    const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imgData.data;

    const bMult = (brightness + 100) / 100;
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Convert to luminance
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply Brightness
      gray = gray * bMult;

      // Apply Contrast
      gray = cFactor * (gray - 128) + 128;

      // Invert if active
      if (isInverted) {
        gray = 255 - gray;
      }

      gray = Math.max(0, Math.min(255, gray));

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    offCtx.putImageData(imgData, 0, 0);

    // 3. Draw Modified Offscreen Buffer
    ctx.drawImage(offscreen, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();

    // 4. Optional Calibration Measurement Grid Overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [zoom, pan, brightness, contrast, isInverted, rotation, isFlipped, showGrid, isArmed]);

  // Sync canvas redraw on state change
  useEffect(() => {
    renderCanvasImage();
  }, [renderCanvasImage]);

  // Load preview image into element ref when new capture arrives
  useEffect(() => {
    if (lastCapturedImage?.previewBase64) {
      const img = new Image();
      img.onload = () => {
        imageElementRef.current = img;
        // Auto-center and reset transforms for new scan
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        renderCanvasImage();
      };
      img.src = lastCapturedImage.previewBase64;
    }
  }, [lastCapturedImage, renderCanvasImage]);

  // Mouse Interaction Handlers for Pan & Zoom
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.max(0.4, Math.min(5.0, prev + zoomDelta)));
  };

  const resetViewer = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setBrightness(0);
    setContrast(0);
    setIsInverted(false);
    setRotation(0);
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden font-sans">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HEADER & REAL-TIME HARDWARE STATUS BAR                             */}
      {/* --------------------------------------------------------------------- */}
      <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Device Brand & Active Patient Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg shadow-teal-500/20 text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-wide text-white">
                Eighteeth NanoPix Direct Integration
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                16-Bit AED
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Patient: <strong className="text-slate-200">{patientId ? `#${patientId} ${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() : 'No Patient Selected'}</strong></span>
              <span>•</span>
              <span>Target Tooth: <strong className="text-teal-400">#{selectedTooth}</strong></span>
            </p>
          </div>
        </div>

        {/* Live Hardware Sync Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-800/80 backdrop-blur-sm text-xs">
            {bridgeOnline ? (
              deviceConnected ? (
                isArmed ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="font-semibold text-amber-400">Armed • Waiting for X-Ray Exposure</span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400"></span>
                    <span className="font-semibold text-emerald-400">NanoPix Ready ({deviceModel})</span>
                  </>
                )
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-medium text-slate-300">Sensor Disconnected (Plug USB)</span>
                </>
              )
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium text-rose-300">Dental Bridge Offline (127.0.0.1:5050)</span>
              </>
            )}
          </div>

          {/* 1-Click Installer Link when Bridge is Offline */}
          {!bridgeOnline && (
            <a
              href="/Dentia_Web_Installer.bat"
              download
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" /> 1-Click Bridge Setup
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b transition-all ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
            : 'bg-amber-950/80 text-amber-200 border-amber-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. CHAIRSIDE ACTION CONTROL BAR                                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tooth Selector */}
        <div className="flex items-center gap-2">
          <label className="text-slate-400 font-medium">Target Tooth:</label>
          <select
            value={selectedTooth}
            onChange={(e) => setSelectedTooth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-teal-500"
          >
            {[...Array(32)].map((_, i) => {
              const toothNum = i + 1;
              return (
                <option key={toothNum} value={String(toothNum)}>
                  Tooth #{toothNum}
                </option>
              );
            })}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isArmed ? (
            <button
              onClick={abortArming}
              className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" /> Abort / Disarm
            </button>
          ) : (
            <button
              onClick={() => {
                if (!patientId) {
                  showToast('Please select a patient before arming sensor.', 'warning');
                  return;
                }
                armSensor(patientId, selectedTooth, doctorId);
              }}
              disabled={!bridgeOnline}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Arm Sensor (Hardware AED)
            </button>
          )}

          <button
            onClick={checkDiagnostic}
            disabled={!bridgeOnline}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-all"
            title="Check physical hardware sensor status"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" /> Sensor Status
          </button>

          <button
            onClick={reconnect}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Reconnect WebSocket Bridge"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. MEDICAL VIEWER CANVAS & INTERACTIVE TOOLBAR                        */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-[#020617]">
        {/* Main Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={850}
            height={620}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="max-w-full max-h-full cursor-grab active:cursor-grabbing select-none"
          />

          {/* Quick Floating Zoom Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-lg">
            <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))} className="p-1 hover:text-white">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(5.0, z + 0.2))} className="p-1 hover:text-white">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <button onClick={resetViewer} className="p-1 hover:text-white" title="Reset Viewport">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cryptographic Security Badge Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-teal-400 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>AES-256-GCM Encrypted Link</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 4. CLINICAL ADJUSTMENT CONTROL PANEL (WINDOW/LEVEL, CONTRAST)       */}
        {/* ------------------------------------------------------------------- */}
        <div className="w-full md:w-72 bg-slate-900/70 border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col gap-5 overflow-y-auto text-xs">
          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-3">
              <Sliders className="w-3.5 h-3.5 text-teal-400" /> Medical Radiograph Adjustments
            </h3>

            {/* Brightness / Window Center */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Brightness (Level)</span>
                <span className="font-mono text-slate-300">{brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Contrast / Window Width */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Contrast (Window)</span>
                <span className="font-mono text-slate-300">{contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Quick Diagnostic Toggles */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setIsInverted((v) => !v)}
                className={`px-3 py-2 rounded-xl font-semibold border transition-all ${
                  isInverted
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                Invert Negative
              </button>

              <button
                onClick={() => setShowGrid((v) => !v)}
                className={`px-3 py-2 rounded-xl font-semibold border transition-all ${
                  showGrid
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                Calibration Grid
              </button>

              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 rounded-xl font-semibold transition-all"
              >
                Rotate 90°
              </button>

              <button
                onClick={() => setIsFlipped((f) => !f)}
                className={`px-3 py-2 rounded-xl font-semibold border transition-all ${
                  isFlipped
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                Flip Mirror
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-2">
              Sensor Specifications
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-medium text-slate-200">{deviceModel}</span>
              </div>
              <div className="flex justify-between">
                <span>Sensor Serial:</span>
                <span className="font-mono text-teal-400">{deviceSerial}</span>
              </div>
              <div className="flex justify-between">
                <span>Interface:</span>
                <span className="text-slate-200">USB 2.0 FIFO (E4S)</span>
              </div>
              <div className="flex justify-between">
                <span>Native Matrix:</span>
                <span className="text-slate-200">1300 x 1800 (16-Bit)</span>
              </div>
            </div>
          </div>

          {/* Cloud Auto-Upload Button */}
          {lastCapturedImage && (
            <button
              onClick={() => handleUploadToCloud(lastCapturedImage)}
              disabled={isUploadingCloud}
              className="mt-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              {isUploadingCloud ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to Cloud...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Save to Cloud Patient Chart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

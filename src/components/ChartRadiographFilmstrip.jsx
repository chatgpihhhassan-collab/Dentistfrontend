import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Upload, 
  Maximize2, 
  X, 
  Layers, 
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Contrast,
  Sun,
  FileText,
  Sliders,
  CheckCircle2,
  Check,
  Play,
  Pause,
  Square,
  ArrowDownCircle,
  Activity,
  Radio,
  Eye,
  Trash2
} from 'lucide-react';
import { extractAiFindingsFromReport, isTestRadiograph } from '../utils/aiRadiologyUtils.js';
import DigoraScannerModal from './DigoraScannerModal';

/**
 * ChartRadiographFilmstrip (Interactive Radiograph Diagnostic Console)
 * 
 * A comprehensive clinical radiology workstation embedded directly alongside the Dental Chart.
 * Clean, modern, high-end Apple / Linear aesthetic with zero clutter and 100% functionality preserved.
 * 
 * Key Features:
 * - Clean dual-row Header with Hardware Status Capsule & Segmented Modality Filter
 * - One-click DIGORA Optime Ethernet Arming (120s lease) & Sensor Ingestion
 * - In-place High-Definition Diagnostic Viewer with floating precision tool palette
 * - Grayscale Invert (Negative Mode) for apical/caries examination
 * - Contrast & Brightness adjustments with quick diagnostic presets (Normal, High Contrast, Bone Density)
 * - In-place Zoom & Pan (100% - 300%)
 * - Interactive Diagnosed Tooth Chips with 1-click chart synchronization
 * - 1-Click "Apply to Chart" and "AI SOAP Note" triggers
 * - Scans Carousel Filmstrip with Modality Filters (All, OPG, RVG, Diagnosed)
 */
export default function ChartRadiographFilmstrip({
  radiographs = [],
  selectedScanId = null,
  selectedRadiograph = null,
  activeScanImpact = null,
  onSelectScan,
  onInspectScan,
  onTriggerSensorCapture,
  onUploadFile,
  onDeleteRadiograph,
  onClearScanImpact,
  onApplyAiFindings,
  onSyncAiNotes,
  onSelectTooth,
  detailedTooth = null,
  isAnalyzing = false,
  workspaceMode = 'split',
  onWorkspaceModeChange = null,
  digoraSync = null,
  patientId = null,
  patientName = 'Active Patient',
  isDigoraModalOpen = null,
  onOpenDigoraModal = null,
  onCloseDigoraModal = null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTestScans, setShowTestScans] = useState(false);
  const [internalShowDigoraModal, setInternalShowDigoraModal] = useState(false);

  const showDigoraModal = (isDigoraModalOpen !== null && isDigoraModalOpen !== undefined)
    ? isDigoraModalOpen
    : internalShowDigoraModal;

  const openDigoraModal = () => {
    if (onOpenDigoraModal) onOpenDigoraModal();
    else setInternalShowDigoraModal(true);
  };

  const closeDigoraModal = () => {
    if (onCloseDigoraModal) onCloseDigoraModal();
    else setInternalShowDigoraModal(false);
  };

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'opg' | 'rvg' | 'diagnosed'
  const [zoom, setZoom] = useState(1);
  const [isInverted, setIsInverted] = useState(false);
  const [contrastPreset, setContrastPreset] = useState('normal'); // 'normal' | 'high' | 'bone'
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showAdjustmentSliders, setShowAdjustmentSliders] = useState(false);

  const fileInputRef = useRef(null);
  const carouselContainerRef = useRef(null);

  // Filter test scans unless explicitly enabled
  const testScansCount = useMemo(() => radiographs.filter(r => isTestRadiograph(r)).length, [radiographs]);
  const activeRadiographs = useMemo(() => {
    const base = showTestScans ? radiographs : radiographs.filter(r => !isTestRadiograph(r));
    if (activeFilter === 'opg') {
      return base.filter(r => {
        const name = (r.imageName || r.ImageName || '').toLowerCase();
        const summary = (r.analysisSummary || r.AnalysisSummary || '').toLowerCase();
        return name.includes('pano') || name.includes('opg') || summary.includes('panoramic') || summary.includes('opg');
      });
    }
    if (activeFilter === 'rvg') {
      return base.filter(r => {
        const name = (r.imageName || r.ImageName || '').toLowerCase();
        const summary = (r.analysisSummary || r.AnalysisSummary || '').toLowerCase();
        return !name.includes('pano') && !name.includes('opg') && !summary.includes('panoramic') && !summary.includes('opg');
      });
    }
    if (activeFilter === 'diagnosed') {
      return base.filter(r => {
        const findings = extractAiFindingsFromReport(r.analysisSummary || r.AnalysisSummary);
        return findings.length > 0;
      });
    }
    return base;
  }, [radiographs, showTestScans, activeFilter]);

  // Determine current active radiograph
  const currentRadiograph = useMemo(() => {
    if (activeScanImpact?.radiograph) return activeScanImpact.radiograph;
    if (selectedRadiograph) return selectedRadiograph;
    if (selectedScanId) {
      const match = radiographs.find(r => (r.radiographID || r.RadiographID) === selectedScanId);
      if (match) return match;
    }
    return activeRadiographs[0] || radiographs[0] || null;
  }, [activeScanImpact, selectedRadiograph, selectedScanId, activeRadiographs, radiographs]);

  // Extract AI findings for current active radiograph
  const activeFindings = useMemo(() => {
    if (activeScanImpact?.findings?.length > 0) return activeScanImpact.findings;
    if (currentRadiograph) {
      return extractAiFindingsFromReport(currentRadiograph.analysisSummary || currentRadiograph.AnalysisSummary);
    }
    return [];
  }, [activeScanImpact, currentRadiograph]);

  // Doctor-centric findings triage
  const [findingsFilter, setFindingsFilter] = useState('all'); // 'all' | 'pathology' | 'restorations' | 'missing'

  const pathologyFindings = useMemo(() => {
    return activeFindings.filter(f => {
      const c = (f.condition || '').toLowerCase();
      return c.includes('caries') || c.includes('decay') || c.includes('bone loss') || c.includes('periodont') || 
             c.includes('radiolucen') || c.includes('abscess') || c.includes('lesion') || c.includes('defective') || 
             c.includes('impaction') || c.includes('calculus') || c.includes('pulpitis');
    });
  }, [activeFindings]);

  const restorationFindings = useMemo(() => {
    return activeFindings.filter(f => {
      const c = (f.condition || '').toLowerCase();
      return (c.includes('bridge') || c.includes('abutment') || c.includes('crown') || c.includes('fill') || 
             c.includes('composite') || c.includes('implant') || c.includes('prosthesis') || c.includes('fpd') ||
             c.includes('rct') || c.includes('canal')) &&
             !c.includes('defective') && !c.includes('caries');
    });
  }, [activeFindings]);

  const missingFindings = useMemo(() => {
    return activeFindings.filter(f => {
      const c = (f.condition || '').toLowerCase();
      return c.includes('missing') || c.includes('extract') || c.includes('lost') || c.includes('absent') || c.includes('edentul');
    });
  }, [activeFindings]);

  const displayedFindings = useMemo(() => {
    if (findingsFilter === 'pathology') return pathologyFindings;
    if (findingsFilter === 'restorations') return restorationFindings;
    if (findingsFilter === 'missing') return missingFindings;
    return activeFindings;
  }, [findingsFilter, activeFindings, pathologyFindings, restorationFindings, missingFindings]);

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const getScanMetadata = (r) => {
    if (!r) return { modality: 'Radiograph', shortModality: 'X-RAY', device: 'Digital RVG' };
    const name = (r.imageName || r.ImageName || '').toLowerCase();
    const summary = (r.analysisSummary || r.AnalysisSummary || '').toLowerCase();

    let modality = 'Periapical RVG';
    let shortModality = 'RVG';
    if (name.includes('pano') || name.includes('opg') || summary.includes('panoramic') || summary.includes('opg')) {
      modality = 'Panoramic (OPG)';
      shortModality = 'OPG';
    } else if (name.includes('bite') || name.includes('bwx') || summary.includes('bitewing')) {
      modality = 'Bitewing (BWX)';
      shortModality = 'BWX';
    } else if (name.includes('cam') || name.includes('photo') || summary.includes('photograph')) {
      modality = 'Intraoral Photo';
      shortModality = 'PHOTO';
    }

    let device = 'Eighteeth Nano-Pix';
    if (name.includes('digora') || summary.includes('digora') || name.includes('soredex') || summary.includes('soredex')) {
      device = 'Soredex DIGORA Optime (Ethernet)';
    } else if (name.includes('dicora') || summary.includes('dicora')) {
      device = 'Dicora USB RVG';
    } else if (name.includes('dexis') || summary.includes('dexis')) {
      device = 'Dexis Platinum';
    } else if (name.includes('nano') || summary.includes('nano-pix')) {
      device = 'Eighteeth Nano-Pix';
    } else if (modality.includes('Panoramic')) {
      device = 'Digital Panoramic OPG';
    }

    return { modality, shortModality, device };
  };

  const getImageUrl = (r) => {
    if (!r) return '';
    if (r.dataUrl) return r.dataUrl;
    if (r.imageUrl && (r.imageUrl.startsWith('data:') || r.imageUrl.startsWith('blob:'))) return r.imageUrl;
    if (r.imageData && r.imageData.length > 50) {
      return r.imageData.startsWith('data:') 
        ? r.imageData 
        : `data:${r.mimeType || 'image/png'};base64,${r.imageData}`;
    }
    const id = r.radiographID || r.RadiographID;
    if (id && typeof window !== 'undefined') {
      const cached = localStorage.getItem(`dentia_radiograph_${id}`);
      if (cached) return cached;
    }
    if (r.imageUrl) return r.imageUrl;
    if (!id) return '';
    return `https://dentist-api-dev.vitonta.com/api/radiographs/${id}/image`;
  };

  // Image Adjustment Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setIsInverted(false);
    setContrastPreset('normal');
    setBrightness(100);
    setContrast(100);
  };

  const applyContrastPreset = (preset) => {
    setContrastPreset(preset);
    if (preset === 'normal') {
      setBrightness(100);
      setContrast(100);
    } else if (preset === 'high') {
      setBrightness(105);
      setContrast(135);
    } else if (preset === 'bone') {
      setBrightness(95);
      setContrast(155);
    }
  };

  const currentMeta = getScanMetadata(currentRadiograph);
  const currentImageUrl = getImageUrl(currentRadiograph);
  const currentScanId = currentRadiograph?.radiographID || currentRadiograph?.RadiographID;
  const isCurrentlySpotlighted = activeScanImpact?.scanId === currentScanId;

  // Filter counts
  const opgCount = radiographs.filter(r => {
    const name = (r.imageName || r.ImageName || '').toLowerCase();
    const summary = (r.analysisSummary || r.AnalysisSummary || '').toLowerCase();
    return name.includes('pano') || name.includes('opg') || summary.includes('panoramic') || summary.includes('opg');
  }).length;

  const diagnosedCount = radiographs.filter(r => {
    const f = extractAiFindingsFromReport(r.analysisSummary || r.AnalysisSummary);
    return f.length > 0;
  }).length;

  const isRadiologyFullMode = workspaceMode === 'radiology';

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
      isRadiologyFullMode ? 'ring-2 ring-blue-500/30' : ''
    }`}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*,.dcm,.tif,.bmp" 
        className="hidden" 
      />

      {/* ========================================================================= */}
      {/* 1. REFINED CONSOLE HEADER (Sleek Apple/Linear Architecture)               */}
      {/* ========================================================================= */}
      <div className="p-3.5 bg-gradient-to-b from-[#F8FAFC] to-white text-slate-800 flex flex-col gap-3 select-none border-b border-slate-200/70">
        
        {/* ROW 1: Identity & Hardware Status & Window Controls */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          {/* Console Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10244B] to-[#2563EB] flex items-center justify-center text-white shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#10244B] tracking-tight">
                Radiograph Diagnostic Console
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#2563EB] border border-blue-200/80 shadow-2xs">
                {activeRadiographs.length} Scans
              </span>
              {isCurrentlySpotlighted && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2563EB] text-white flex items-center gap-1 shadow-2xs animate-pulse">
                  <Zap className="w-3 h-3 fill-current" /> Live Chart Sync
                </span>
              )}
            </div>
          </div>

          {/* Right Header Capsule: DIGORA Live Status + Maximize/Collapse */}
          <div className="flex items-center gap-2 shrink-0">
            {/* DIGORA Hardware Capsule */}
            {digoraSync && (
              <div className="flex items-center">
                {digoraSync.isArmed ? (
                  <button
                    type="button"
                    onClick={openDigoraModal}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                    title="DIGORA Optime is armed over Ethernet. Click to open hardware console."
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-black text-[10.5px]">Armed ({digoraSync.formattedRemainingTime})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openDigoraModal}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                    title="DIGORA Optime Ethernet Link Active. Click to view console."
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-extrabold text-[10.5px] text-slate-700">DIGORA: Ready</span>
                    <span className="text-[9.5px] text-slate-400 font-mono hidden sm:inline">(LAN)</span>
                  </button>
                )}
              </div>
            )}

            {/* Waiting Scans Pill */}
            {digoraSync?.unassignedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (digoraSync.unassignedScans[0]?.id) {
                    digoraSync.assignScan(digoraSync.unassignedScans[0].id);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-[#1D4ED8] border border-blue-300 hover:bg-blue-200 text-[10px] font-black animate-pulse cursor-pointer shadow-2xs"
                title="Click to assign waiting scan to current patient"
              >
                <span>🔔 {digoraSync.unassignedCount} Waiting</span>
              </button>
            )}

            {/* Maximize to Full Radiology Studio */}
            {onWorkspaceModeChange && (
              <button
                type="button"
                onClick={() => onWorkspaceModeChange(workspaceMode === 'radiology' ? 'split' : 'radiology')}
                className="p-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-[#2563EB] border border-slate-200 shadow-2xs transition cursor-pointer hidden sm:flex items-center justify-center"
                title={workspaceMode === 'radiology' ? "Switch to Split View" : "Maximize Radiology Studio"}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Collapse/Expand */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition cursor-pointer"
              title={isCollapsed ? "Expand Console" : "Collapse Console"}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ROW 2: Primary Action Bar & Segmented Filter Hub */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 flex-wrap">
          {/* Left: Unified Capture Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary DIGORA Trigger */}
            {digoraSync && (
              <>
                {digoraSync.isArmed ? (
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 p-0.5 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={openDigoraModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-xs"
                      title="DIGORA Optime is active. Click to view console."
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Active ({digoraSync.formattedRemainingTime})</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await digoraSync.disarmScanner();
                        closeDigoraModal();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px] transition cursor-pointer"
                      title="Stop DIGORA Optime session and return device to standby"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      digoraSync?.armScanner('Op-1', 2);
                      openDigoraModal();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
                    title="Activate Soredex DIGORA Optime Ethernet Scanner (2-Minute Window for Plate Insertion)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>▶ Arm DIGORA (2m)</span>
                  </button>
                )}

                {/* Quick Hardware Beep Pulse */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    digoraSync?.triggerHardwareBeep?.();
                  }}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs shadow-2xs active:scale-95 transition cursor-pointer flex items-center gap-1"
                  title="Trigger physical scanner acoustic BEEP pulse"
                >
                  <span>🔔</span>
                  <span className="hidden sm:inline text-[11px]">Beep</span>
                </button>
              </>
            )}

            {/* RVG Sensor Capture */}
            <button
              type="button"
              onClick={onTriggerSensorCapture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 hover:border-teal-400 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer"
              title="Acquire intraoral frame from Eighteeth Nano-Pix or Dicora USB Sensor"
            >
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>Sensor</span>
            </button>

            {/* Upload File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#2563EB] border border-slate-200 hover:border-blue-300 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
              title="Upload dental radiograph (OPG, Bitewing, Periapical, DICOM)"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload</span>
            </button>

            {/* Test Scans Filter Toggle */}
            {testScansCount > 0 && (
              <button
                type="button"
                onClick={() => setShowTestScans(!showTestScans)}
                className={`px-2 py-1 rounded-xl text-[10.5px] font-bold transition cursor-pointer border ${
                  showTestScans 
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title={showTestScans ? "Hide test images" : `Include ${testScansCount} test images`}
              >
                <span>🧪 {showTestScans ? `Tests (${testScansCount})` : `+${testScansCount}`}</span>
              </button>
            )}
          </div>

          {/* Right: Modern Segmented Filter Track */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All', count: radiographs.length },
              { id: 'opg', label: 'OPG', count: opgCount },
              { id: 'rvg', label: 'RVG', count: radiographs.length - opgCount },
              { id: 'diagnosed', label: 'Diagnosed', count: diagnosedCount }
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-[#10244B] shadow-2xs font-extrabold border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-50 text-[#2563EB] font-bold' : 'bg-slate-200/60 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONSOLE BODY & ACTIVE STAGE                                            */}
      {/* ========================================================================= */}
      {!isCollapsed && (
        <div className="p-3.5 bg-[#F8FAFC] flex flex-col gap-3.5">
          {activeRadiographs.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] mb-3 shadow-2xs">
                <ImageIcon className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-sm font-black text-slate-800">No Patient Radiographs Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Arm the DIGORA Optime to scan intraoral phosphor plates, acquire frames with your RVG sensor, or upload image files.
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => {
                    digoraSync?.armScanner('Op-1', 2);
                    openDigoraModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Arm DIGORA Optime
                </button>
                <button
                  type="button"
                  onClick={onTriggerSensorCapture}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-teal-600" /> Sensor Capture
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" /> Upload Scan
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* 2A. ACTIVE RADIOGRAPH DIAGNOSTIC STAGE (IN-PLACE VIEWER)                 */}
              {/* ========================================================================= */}
              {currentRadiograph && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  {/* Stage Top Bar: Active Scan Metadata & Quick Tools Palette */}
                  <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-100/90 via-white to-slate-100/90 border-b border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                    {/* Active Modality & Scan Title */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#10244B] text-cyan-300 tracking-wider">
                        {currentMeta.modality}
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate max-w-[200px]" title={currentRadiograph.imageName}>
                        {currentRadiograph.imageName || `Scan #${currentScanId}`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        • {currentMeta.device}
                      </span>
                    </div>

                    {/* Integrated Medical Imaging Tool Palette */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {/* Negative / Invert Greyscale Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsInverted(!isInverted)}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer border ${
                          isInverted 
                            ? 'bg-purple-700 text-white border-purple-800 shadow-2xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                        }`}
                        title="Invert Greyscale (Negative Mode) — Essential for examining pulp & caries"
                      >
                        <Contrast className="w-3 h-3" />
                        <span>Invert</span>
                      </button>

                      {/* Diagnostic Contrast Presets */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                        {[
                          { id: 'normal', label: 'Norm' },
                          { id: 'high', label: 'Hi-Con' },
                          { id: 'bone', label: 'Bone' }
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyContrastPreset(p.id)}
                            className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                              contrastPreset === p.id 
                                ? 'bg-white text-[#10244B] shadow-2xs font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Zoom Controls */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded cursor-pointer transition"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-mono font-bold px-1 text-slate-700 min-w-[32px] text-center">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={handleZoomIn}
                          className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded cursor-pointer transition"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                        {zoom !== 1 && (
                          <button
                            type="button"
                            onClick={handleResetZoom}
                            className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded cursor-pointer transition"
                            title="Reset Zoom"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Fine Tune Slider Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAdjustmentSliders(!showAdjustmentSliders)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          showAdjustmentSliders 
                            ? 'bg-blue-100 text-[#2563EB] border-blue-300' 
                            : 'bg-white text-slate-600 hover:text-slate-900 border-slate-300 shadow-2xs'
                        }`}
                        title="Fine-tune Brightness & Contrast"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>

                      {/* Deep PiP Inspector */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onInspectScan) onInspectScan(currentRadiograph, activeFindings);
                        }}
                        className="p-1.5 rounded-lg bg-[#10244B] hover:bg-[#1E3A8A] text-white shadow-2xs transition cursor-pointer"
                        title="Open Deep Zoom Inspector (Picture-in-Picture)"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>

                      {/* Delete Active Radiograph */}
                      {onDeleteRadiograph && currentScanId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRadiograph(currentScanId, e);
                          }}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-300 hover:border-rose-300 shadow-2xs transition cursor-pointer"
                          title="Permanently delete active radiograph"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fine-tune Sliders Row */}
                  {showAdjustmentSliders && (
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 flex-1">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-600 w-16">Bright: {brightness}%</span>
                        <input
                          type="range"
                          min="50"
                          max="160"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-600 w-16">Contrast: {contrast}%</span>
                        <input
                          type="range"
                          min="50"
                          max="180"
                          value={contrast}
                          onChange={(e) => setContrast(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleResetZoom}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {/* High-Definition Optical Radiograph Viewport */}
                  <div className={`relative w-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${
                    isRadiologyFullMode ? 'h-[440px]' : 'h-[250px] sm:h-[280px]'
                  }`}>
                    <img
                      src={currentImageUrl}
                      alt={currentRadiograph.imageName || 'Active Radiograph'}
                      style={{
                        transform: `scale(${zoom})`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? 'invert(100%)' : ''}`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out, filter 0.1s ease-out'
                      }}
                      className="max-w-full max-h-full object-contain pointer-events-none"
                      onError={(e) => {
                        const cached = (typeof window !== 'undefined' && currentScanId) 
                          ? localStorage.getItem(`dentia_radiograph_${currentScanId}`)
                          : null;
                        if (cached && e.currentTarget.src !== cached) {
                          e.currentTarget.src = cached;
                        } else {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.stage-fallback');
                          if (fallback) fallback.classList.remove('hidden');
                        }
                      }}
                    />

                    {/* Fallback placeholder if image load fails */}
                    <div className="stage-fallback hidden absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 p-4">
                      <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                      <p className="text-xs font-mono text-slate-300">{currentRadiograph.imageName}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Image preview unavailable or processing.</p>
                    </div>

                    {/* Floating Spotlight Action Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {isCurrentlySpotlighted ? (
                        <div className="px-3 py-1 rounded-xl text-[10.5px] font-black bg-[#2563EB] text-white flex items-center gap-1.5 shadow-lg border border-blue-400/40 backdrop-blur-xs animate-pulse">
                          <Zap className="w-3.5 h-3.5 fill-current text-cyan-300" />
                          <span>Live Synced on 3D Arch & Chart</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectScan) onSelectScan(currentRadiograph, activeFindings);
                          }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-900/80 hover:bg-[#2563EB] text-white flex items-center gap-1.5 shadow-lg border border-white/20 hover:border-blue-400 backdrop-blur-xs cursor-pointer transition active:scale-95"
                          title="Spotlight diagnosed teeth on 3D Jaw Arch & 2D Chart"
                        >
                          <Zap className="w-3.5 h-3.5 text-blue-300" />
                          <span>Spotlight on Chart</span>
                        </button>
                      )}
                    </div>

                    {/* Modality & Date Tag */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/85 text-slate-300 text-[9.5px] font-mono border border-slate-700 shadow-sm">
                      {currentRadiograph.uploadedAt ? new Date(currentRadiograph.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Scan'}
                    </div>
                  </div>

                  {/* Diagnosed Findings Tray & Clinical Actions Bar */}
                  <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col gap-3">
                    {/* Findings Header & Filter Tabs */}
                    {activeFindings.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                              <span>⚡</span>
                              <span>{activeFindings.length} AI Findings Detected</span>
                            </span>
                            {isCurrentlySpotlighted && (
                              <span className="text-[10px] font-black text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                Live Chart Sync Active
                              </span>
                            )}
                          </div>

                          {/* Category Filter Tabs */}
                          <div className="flex items-center gap-1 text-[10px] bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            {[
                              { id: 'all', label: `All (${activeFindings.length})` },
                              { id: 'pathology', label: `Pathology (${pathologyFindings.length})` },
                              { id: 'restorations', label: `Restorations (${restorationFindings.length})` },
                              { id: 'missing', label: `Missing (${missingFindings.length})` }
                            ].map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFindingsFilter(cat.id)}
                                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                                  findingsFilter === cat.id
                                    ? 'bg-white text-[#10244B] shadow-2xs font-black'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Tooth Chips Tray */}
                        <div className="max-h-[85px] overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                          {displayedFindings.length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic py-1">
                              No findings in this category.
                            </div>
                          ) : (
                            displayedFindings.map(f => {
                              const isThisToothActive = detailedTooth === parseInt(f.toothNumber, 10);
                              return (
                                <button
                                  key={f.toothKey || f.toothNumber}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectTooth) onSelectTooth(parseInt(f.toothNumber, 10));
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                    isThisToothActive 
                                      ? 'ring-2 ring-[#2563EB] ring-offset-1 scale-105 shadow-xs bg-blue-50 font-black' 
                                      : 'hover:scale-102 hover:shadow-xs bg-white'
                                  }`}
                                  style={{
                                    borderColor: isThisToothActive ? '#2563EB' : `${f.color || '#2563EB'}50`
                                  }}
                                  title={`Click to focus Tooth #${f.toothNumber}: ${f.condition} (${f.severity})`}
                                >
                                  <span 
                                    className="font-mono font-black text-[10.5px] px-1 py-0.2 rounded"
                                    style={{
                                      backgroundColor: `${f.color || '#2563EB'}20`,
                                      color: f.color || '#10244B'
                                    }}
                                  >
                                    #{f.toothNumber}
                                  </span>
                                  <span className="font-semibold text-[11px] text-slate-800 truncate max-w-[155px]">
                                    {f.condition}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Normal Radiographic Presentation — No active caries, bone loss, or lesions detected.</span>
                      </div>
                    )}

                    {/* Direct Clinical Action Buttons Row */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeFindings.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onApplyAiFindings) onApplyAiFindings(activeFindings, currentRadiograph);
                            }}
                            disabled={isAnalyzing}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-95"
                            title="Apply detected conditions to Dental Chart and Treatment Ledger"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Apply to Chart</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (onSyncAiNotes) onSyncAiNotes(currentRadiograph, activeFindings);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10244B] hover:bg-[#1E3A8A] text-white text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
                          title="Generate and persist AI SOAP Progress Note"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>AI SOAP Note</span>
                        </button>

                        {activeFindings.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectScan) onSelectScan(currentRadiograph, activeFindings);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-bold transition cursor-pointer"
                            title="Spotlight all diagnosed teeth on 3D Arch and 2D Chart"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Spotlight All ({activeFindings.length})</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onDeleteRadiograph && currentScanId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRadiograph(currentScanId, e);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold transition cursor-pointer"
                            title="Delete this radiograph"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete Scan</span>
                          </button>
                        )}

                        {isCurrentlySpotlighted && (
                          <button
                            type="button"
                            onClick={onClearScanImpact}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                            title="Clear chart highlights"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear Spotlight</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2B. SMART SCANS CAROUSEL / FILMSTRIP DOCK                                */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Patient Imaging Archive
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {activeRadiographs.length} Available
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Click any thumbnail to inspect
                  </span>
                </div>

                {/* Horizontal Scrolling Thumbnails Tray */}
                <div 
                  ref={carouselContainerRef}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 overflow-y-auto max-h-[190px] pr-1"
                >
                  {activeRadiographs.map((r) => {
                    const rId = r.radiographID || r.RadiographID;
                    const isSelected = (currentScanId === rId);
                    const { shortModality } = getScanMetadata(r);
                    const findings = extractAiFindingsFromReport(r.analysisSummary || r.AnalysisSummary);
                    const imageUrl = getImageUrl(r);

                    return (
                      <div
                        key={rId}
                        onClick={() => {
                          if (onSelectScan) onSelectScan(r, findings);
                          setZoom(1);
                        }}
                        className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group bg-white ${
                          isSelected 
                            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30 shadow-xs bg-blue-50/20' 
                            : 'border-slate-200 hover:border-[#2563EB]/70 hover:shadow-2xs'
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative h-20 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={r.imageName || 'Scan'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const ph = e.currentTarget.parentElement?.querySelector('.thumb-ph');
                              if (ph) ph.classList.remove('hidden');
                            }}
                          />
                          <div className="thumb-ph hidden absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900 p-1">
                            <ImageIcon className="w-5 h-5 opacity-40 mb-0.5" />
                            <span className="text-[9px] font-mono text-center truncate w-full text-slate-400">{r.imageName}</span>
                          </div>

                          {/* Modality Tag */}
                          <div className="absolute top-1 left-1">
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-slate-950/80 text-blue-200 border border-blue-400/30 shadow-2xs">
                              {shortModality}
                            </span>
                          </div>

                          {/* Diagnosed Teeth Count Badge */}
                          {findings.length > 0 ? (
                            <div className="absolute top-1 right-1">
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-rose-600 text-white shadow-2xs">
                                ⚡ {findings.length}
                              </span>
                            </div>
                          ) : (
                            <div className="absolute top-1 right-1">
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-600/90 text-white shadow-2xs">
                                ✓ Normal
                              </span>
                            </div>
                          )}

                          {/* Selected Active Ring */}
                          {isSelected && (
                            <div className="absolute inset-0 border-2 border-[#2563EB] rounded-xl pointer-events-none flex items-end justify-end p-1">
                              <span className="p-0.5 rounded-full bg-[#2563EB] text-white shadow-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            </div>
                          )}

                          {/* Hover Overlay Delete Button */}
                          {onDeleteRadiograph && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRadiograph(rId, e);
                              }}
                              className="absolute top-1 right-1 p-1 rounded-md bg-slate-950/80 hover:bg-rose-600 text-white/70 hover:text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer shadow-xs z-20"
                              title={`Delete ${r.imageName || 'scan'}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Thumbnail Footer Info */}
                        <div className="p-1.5 bg-white flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10.5px] font-bold text-slate-900 truncate flex-1" title={r.imageName}>
                              {r.imageName || `Scan #${rId}`}
                            </span>
                            {onDeleteRadiograph && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRadiograph(rId, e);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                                title={`Delete ${r.imageName || 'scan'}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                            <span className="font-sans font-bold text-[#2563EB]">
                              {isSelected ? 'Active' : 'Inspect'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Soredex DIGORA Optime Hardware Console Modal */}
      {!onOpenDigoraModal && (
        <DigoraScannerModal
          isOpen={showDigoraModal}
          onClose={closeDigoraModal}
          patientId={patientId}
          patientName={patientName}
          operatoryId="Op-1"
          digoraSync={digoraSync}
        />
      )}
    </div>
  );
}

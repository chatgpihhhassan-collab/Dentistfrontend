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
  ArrowDownCircle
} from 'lucide-react';
import { extractAiFindingsFromReport, isTestRadiograph } from '../utils/aiRadiologyUtils.js';
import DigoraScannerModal from './DigoraScannerModal';

/**
 * ChartRadiographFilmstrip (Interactive Radiograph Diagnostic Console)
 * 
 * A comprehensive clinical radiology workstation embedded directly alongside the Dental Chart.
 * Key Features:
 * - In-place High-Definition Diagnostic Viewer (no modal required to inspect scans)
 * - Greyscale Invert (Negative Mode) for apical/caries examination
 * - Contrast & Brightness adjustments with quick diagnostic presets (Normal, High Contrast, Bone Density)
 * - In-place Zoom & Pan (100% - 300%)
 * - Interactive Diagnosed Tooth Chips (#14, #19, #30) with 1-click chart synchronization
 * - 1-Click "Apply to Chart" and "AI SOAP Note" triggers
 * - Scans Carousel Filmstrip with Modality Filters (All, OPG, RVG, Diagnosed)
 * - Hardware Sensor Acquisition (Nano-Pix / Dicora USB RVG) and File Upload
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

  // When DIGORA is disarmed, stopped, or 5-minute lease expires, auto-close scanner strip modal
  const wasArmedRef = useRef(digoraSync?.isArmed);
  useEffect(() => {
    if (wasArmedRef.current && !digoraSync?.isArmed && showDigoraModal) {
      closeDigoraModal();
    }
    wasArmedRef.current = digoraSync?.isArmed;
  }, [digoraSync?.isArmed, showDigoraModal]);

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
    <div className={`w-full bg-white rounded-3xl border border-light-teal/50 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
      isRadiologyFullMode ? 'ring-2 ring-cyan-500/30' : ''
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
      {/* 1. CONSOLE HEADER BAR (Harmonized with website theme: luminous white/light-teal gradient) */}
      {/* ========================================================================= */}
      <div className="p-3 bg-gradient-to-r from-white via-[#F8FAFC] to-[#EAF0FC]/80 text-slate-800 flex flex-col gap-2.5 select-none border-b border-light-teal/50 shadow-2xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Title & Hardware Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A7CD2] to-[#3665B7] flex items-center justify-center text-white shadow-xs shadow-blue-500/15 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-[#10244B] tracking-wider uppercase">
                  Radiograph Diagnostic Console
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#4A7CD2] border border-blue-200 shadow-2xs">
                  {activeRadiographs.length} Scans
                </span>
                {isCurrentlySpotlighted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#4A7CD2] text-white flex items-center gap-1 shadow-xs animate-pulse">
                    <Zap className="w-3 h-3 fill-current" /> Live Chart Sync
                  </span>
                )}
              </div>
              
              {/* Soredex DIGORA Optime & Sensor Status Line */}
              <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5 flex-wrap">
                {digoraSync?.isArmed ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await digoraSync.disarmScanner();
                      closeDigoraModal();
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                    title={`Soredex DIGORA Optime is armed over Ethernet. Click to disarm, reset hardware, and close window.`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-extrabold text-[10px]">DIGORA Optime: Armed ({digoraSync.formattedRemainingTime})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      digoraSync?.armScanner('Op-1', 5);
                      openDigoraModal();
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                    title="Click to activate Soredex DIGORA Optime Ethernet scanner (5-minute lease) and open scanner window"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="font-bold text-[10px]">DIGORA Optime: Ready (Click to Arm 5m)</span>
                  </button>
                )}

                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 font-semibold text-[10px]">Ethernet LAN (Zero-Install)</span>
                </span>

                {digoraSync?.unassignedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (digoraSync.unassignedScans[0]?.id) {
                        digoraSync.assignScan(digoraSync.unassignedScans[0].id);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 text-[10px] font-black animate-pulse cursor-pointer"
                    title="Click to assign waiting scan to current patient"
                  >
                    <span>🔔 {digoraSync.unassignedCount} Waiting (Assign)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions (DIGORA Play & Accept Chip / Sensor / Upload / Tests) */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {digoraSync && (
              <>
                {digoraSync.isArmed ? (
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 p-0.5 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => openDigoraModal()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition cursor-pointer"
                      title="Soredex DIGORA Optime is armed. Click to open chairside console."
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
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10.5px] transition cursor-pointer"
                      title="Stop DIGORA Optime session, reset device to standby, and close scanner window"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      digoraSync?.armScanner('Op-1', 5);
                      openDigoraModal();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] shadow-sm active:scale-95 transition cursor-pointer"
                    title="Activate Soredex DIGORA Optime Ethernet Scanner (5-Minute Window)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>▶ Play DIGORA (5m)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => digoraSync?.triggerHardwareBeep?.()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[11px] shadow-xs active:scale-95 transition cursor-pointer"
                  title="Test physical Soredex DIGORA Optime hardware beep sound"
                >
                  <span>🔔 Beep</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onTriggerSensorCapture}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-black shadow-xs active:scale-95 transition cursor-pointer"
              title="Acquire intraoral frame from Eighteeth Nano-Pix or Dicora Sensor"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Sensor</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-[11px] font-black shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
              title="Upload dental radiograph (OPG, Bitewing, Periapical)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            {testScansCount > 0 && (
              <button
                type="button"
                onClick={() => setShowTestScans(!showTestScans)}
                className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer border ${
                  showTestScans 
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                }`}
                title={showTestScans ? "Hide test images" : `Include ${testScansCount} test images`}
              >
                <span>{showTestScans ? `🧪 Tests (${testScansCount})` : `🧪 +${testScansCount}`}</span>
              </button>
            )}

            {onWorkspaceModeChange && (
              <button
                type="button"
                onClick={() => onWorkspaceModeChange(workspaceMode === 'radiology' ? 'split' : 'radiology')}
                className="p-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-[#4A7CD2] border border-slate-200 shadow-2xs transition cursor-pointer hidden sm:flex items-center gap-1 text-[10px] font-bold"
                title={workspaceMode === 'radiology' ? "Switch to Split View" : "Maximize Radiology Studio"}
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#4A7CD2]" />
                <span>{workspaceMode === 'radiology' ? 'Split View' : 'Full Studio'}</span>
              </button>
            )}

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

        {/* Filter Pills Row */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          {[
            { id: 'all', label: `All (${radiographs.length})` },
            { id: 'opg', label: `Panoramic OPG (${opgCount})` },
            { id: 'rvg', label: `RVG / Bitewing (${radiographs.length - opgCount})` },
            { id: 'diagnosed', label: `AI Diagnosed (${diagnosedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer shrink-0 border ${
                activeFilter === tab.id
                  ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200 shadow-2xs font-bold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONSOLE BODY                                                           */}
      {/* ========================================================================= */}
      {!isCollapsed && (
        <div className="p-3 bg-[#F8FAFC] flex flex-col gap-3">
          {activeRadiographs.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#4A7CD2] mb-3 shadow-2xs">
                <ImageIcon className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-sm font-black text-slate-800">No Patient Radiographs Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Capture chairside RVG images using your sensor or upload OPG / Bitewing files to run AI diagnostics.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={onTriggerSensorCapture}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Trigger RVG Sensor
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Scan File
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
                  {/* Stage Top Bar: Active Scan Metadata & Quick Tools */}
                  <div className="px-3.5 py-2 bg-gradient-to-r from-slate-100 via-white to-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#10244B] text-cyan-300">
                        {currentMeta.modality}
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate max-w-[200px]" title={currentRadiograph.imageName}>
                        {currentRadiograph.imageName || `Scan #${currentScanId}`}
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-mono hidden sm:inline">
                        via {currentMeta.device}
                      </span>
                    </div>

                    {/* Stage Diagnostic Toolbar */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Negative / Invert Greyscale Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsInverted(!isInverted)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer border ${
                          isInverted 
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Invert Greyscale (Negative Mode) — Essential for examining pulp & caries"
                      >
                        <Contrast className="w-3 h-3" />
                        <span>Invert</span>
                      </button>

                      {/* Diagnostic Presets */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => applyContrastPreset('normal')}
                          className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                            contrastPreset === 'normal' ? 'bg-white text-[#10244B] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Normal diagnostic contrast"
                        >
                          Norm
                        </button>
                        <button
                          type="button"
                          onClick={() => applyContrastPreset('high')}
                          className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                            contrastPreset === 'high' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="High contrast for caries inspection"
                        >
                          Hi-Con
                        </button>
                        <button
                          type="button"
                          onClick={() => applyContrastPreset('bone')}
                          className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                            contrastPreset === 'bone' ? 'bg-white text-cyan-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Bone & Trabecular density enhancement"
                        >
                          Bone
                        </button>
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
                            : 'bg-white text-slate-600 hover:text-slate-900 border-slate-300'
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
                        className="p-1.5 rounded-lg bg-[#4A7CD2] hover:bg-[#3665B7] text-white shadow-2xs transition cursor-pointer"
                        title="Open Deep Zoom Inspector (PiP)"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fine-tune Sliders Row */}
                  {showAdjustmentSliders && (
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-xs">
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
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline"
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

                    {/* Live Sync Status Overlay Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {isCurrentlySpotlighted ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-[#4A7CD2] text-white flex items-center gap-1 shadow-md">
                          <Zap className="w-3.5 h-3.5 fill-current" /> Live Spotlighted on 3D Arch & 2D Chart
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectScan) onSelectScan(currentRadiograph, activeFindings);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-[#4A7CD2] hover:bg-[#3665B7] text-white flex items-center gap-1 shadow-md cursor-pointer transition active:scale-95"
                          title="Spotlight diagnosed teeth on 3D Jaw & 2D Chart"
                        >
                          <Zap className="w-3.5 h-3.5" /> Click to Spotlight on Chart
                        </button>
                      )}
                    </div>

                    {/* Modality & Date Tag */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-900/85 text-slate-300 text-[9.5px] font-mono border border-slate-700 shadow-sm">
                      {currentRadiograph.uploadedAt ? new Date(currentRadiograph.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Scan'}
                    </div>
                  </div>

                  {/* Diagnosed Teeth & Action Bar */}
                  <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2.5">
                    {/* Diagnosed Teeth Pathology Header & Smart Filter Tabs */}
                    {activeFindings.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-2xs">
                              <span>⚡</span>
                              <span>{activeFindings.length} AI Findings Detected</span>
                            </span>
                            {isCurrentlySpotlighted && (
                              <span className="text-[10px] font-black text-[#4A7CD2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 animate-pulse">
                                Live Chart Sync Active
                              </span>
                            )}
                          </div>

                          {/* Quick Clinical Category Filter Tabs */}
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

                        {/* Interactive Tooth Chips Tray (Compact & Scrollable to prevent screen overflow) */}
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
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                    isThisToothActive 
                                      ? 'ring-2 ring-[#4A7CD2] ring-offset-1 scale-105 shadow-xs bg-blue-50 font-black' 
                                      : 'hover:scale-102 hover:shadow-xs bg-white'
                                  }`}
                                  style={{
                                    borderColor: isThisToothActive ? '#4A7CD2' : `${f.color || '#4A7CD2'}50`
                                  }}
                                  title={`Click to focus Tooth #${f.toothNumber}: ${f.condition} (${f.severity})`}
                                >
                                  <span 
                                    className="font-mono font-black text-[10.5px] px-1 py-0.2 rounded"
                                    style={{
                                      backgroundColor: `${f.color || '#4A7CD2'}20`,
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
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Normal Radiographic Presentation — No active caries, bone loss, or lesions detected.</span>
                      </div>
                    )}

                    {/* Direct Clinical Workflow Actions Row (Permanently visible above the fold) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
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
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#4A7CD2] border border-blue-200 text-xs font-bold transition cursor-pointer"
                            title="Spotlight all diagnosed teeth on 3D Arch and 2D Chart"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Spotlight All ({activeFindings.length})</span>
                          </button>
                        )}
                      </div>

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
              )}

              {/* ========================================================================= */}
              {/* 2B. SMART SCANS CAROUSEL / FILMSTRIP DOCK                                */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 p-2.5 flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Patient Imaging Archive
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.2 rounded-full border border-slate-200">
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
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto max-h-[190px] pr-1"
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
                          // Reset viewport zoom when switching scans
                          setZoom(1);
                        }}
                        className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group bg-white ${
                          isSelected 
                            ? 'border-[#4A7CD2] ring-2 ring-[#4A7CD2]/40 shadow-xs bg-blue-50/20' 
                            : 'border-slate-200 hover:border-[#4A7CD2]/80 hover:shadow-2xs'
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
                            <div className="absolute inset-0 border-2 border-[#4A7CD2] rounded-xl pointer-events-none flex items-end justify-end p-1">
                              <span className="p-0.5 rounded-full bg-[#4A7CD2] text-white shadow-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Thumbnail Footer Info */}
                        <div className="p-1.5 bg-white flex flex-col gap-0.5">
                          <span className="text-[10.5px] font-bold text-slate-900 truncate" title={r.imageName}>
                            {r.imageName || `Scan #${rId}`}
                          </span>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                            <span className="font-sans font-bold text-[#4A7CD2]">
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

      {/* Soredex DIGORA Optime Hardware Console Modal (renders locally only if parent did not provide modal handler) */}
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

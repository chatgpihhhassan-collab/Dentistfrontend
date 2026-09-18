import React, { useState } from 'react';
import { 
  Image, 
  Eye, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Upload, 
  Maximize2, 
  X, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  LayoutGrid,
  Minimize2
} from 'lucide-react';
import { extractAiFindingsFromReport, isTestRadiograph } from '../utils/aiRadiologyUtils.js';

const PAGE_SIZE = 5;

/**
 * ChartRadiographFilmstrip
 * 
 * Doctor-friendly diagnostic imaging dock engineered for ZERO-SCROLL operatory workstations.
 * Features:
 * - Automatically excludes dummy/test scans by default (enables on demand)
 * - Default "Zero-Scroll Compact Mode" (takes < 105px vertical space)
 * - Optional "Detailed Cards Mode" toggleable by doctor
 * - 5-scan pagination with compact in-header navigation
 * - Direct cloud image resolution with base64 failover
 * - Instant 1-click clinical impact spotlighting on 3D jaw and 2D odontogram
 */
export default function ChartRadiographFilmstrip({
  radiographs = [],
  selectedScanId = null,
  activeScanImpact = null,
  onSelectScan,
  onInspectScan,
  onTriggerSensorCapture,
  onUploadFile,
  onClearScanImpact,
  isAnalyzing = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('compact'); // 'compact' (zero-scroll default) | 'expanded'
  const [showTestScans, setShowTestScans] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = React.useRef(null);

  // Exclude test images by default; enable when explicitly requested
  const testScansCount = radiographs.filter(r => isTestRadiograph(r)).length;
  const activeRadiographs = showTestScans ? radiographs : radiographs.filter(r => !isTestRadiograph(r));

  const totalPages = Math.max(1, Math.ceil(activeRadiographs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRadiographs = activeRadiographs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const getScanMetadata = (r) => {
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
    if (name.includes('dicora') || summary.includes('dicora')) {
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
    if (r.imageData && r.imageData.length > 50) {
      return r.imageData.startsWith('data:') 
        ? r.imageData 
        : `data:${r.mimeType || 'image/jpeg'};base64,${r.imageData}`;
    }
    const id = r.radiographID || r.RadiographID;
    return `https://dentist-api-dev.vitonta.com/api/radiographs/${id}/image`;
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-3 transition-all duration-200">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*,.dcm" 
        className="hidden" 
      />

      {/* Dock Compact Header: Zero-Scroll Operatory Bar */}
      <div className="px-3.5 py-2 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Left: Title & Count & Devices */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#4A7CD2] to-[#2563EB] flex items-center justify-center text-white shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[11px] text-[#10244B] tracking-wider uppercase">
              Diagnostic Radiographs
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
              {activeRadiographs.length} {activeRadiographs.length === 1 ? 'Scan' : 'Scans'}
            </span>
            {testScansCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowTestScans(!showTestScans);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold transition cursor-pointer border ${
                  showTestScans 
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs' 
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                }`}
                title={showTestScans ? "Click to hide test scans" : `Click to enable ${testScansCount} excluded test scans`}
              >
                <span>{showTestScans ? `🧪 Tests Active (${testScansCount})` : `🧪 Show Tests (${testScansCount})`}</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] text-slate-500 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-600">Nano-Pix RVG</span>
              <span>•</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span className="font-medium text-slate-600">Dicora USB</span>
            </div>
          </div>
        </div>

        {/* Center: Active Scan Spotlight Pill */}
        {activeScanImpact && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-300 text-cyan-900 text-[11px] shadow-2xs animate-in fade-in">
            <Zap className="w-3 h-3 text-cyan-600 animate-pulse" />
            <span className="font-bold">
              Spotlight: <span className="font-mono text-cyan-800">{activeScanImpact.imageName}</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-600 text-white text-[9.5px] font-extrabold">
              {activeScanImpact.teeth?.length || 0} Teeth
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClearScanImpact && onClearScanImpact();
              }}
              title="Clear Spotlight"
              className="ml-0.5 p-0.5 rounded hover:bg-cyan-200/70 text-cyan-700 hover:text-cyan-950 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Right: Inline Pager, View Mode Toggle & Quick Triggers */}
        <div className="flex items-center gap-2">
          {/* Compact In-Header Paging (Takes ZERO extra vertical space) */}
          {activeRadiographs.length > PAGE_SIZE && (
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs text-[11px]">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous 5 scans"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-slate-700 px-1">
                {safePage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next 5 scans"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View Mode Switcher: Zero-Scroll vs Detailed */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`px-2 py-1 rounded-md font-extrabold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'compact' 
                  ? 'bg-white text-[#2563EB] shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ultra-compact Zero-Scroll operatory mode"
            >
              <span>⚡ Compact</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('expanded')}
              className={`px-2 py-1 rounded-md font-extrabold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'expanded' 
                  ? 'bg-white text-[#2563EB] shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Expanded large-card preview mode"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </button>
          </div>

          {/* Sensor Capture */}
          <button
            type="button"
            onClick={onTriggerSensorCapture}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-2xs active:scale-95 transition cursor-pointer"
            title="Acquire frame from Eighteeth Nano-Pix / Dicora USB RVG"
          >
            <Camera className="w-3 h-3" />
            <span className="hidden sm:inline">Sensor</span>
          </button>

          {/* Upload X-Ray */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold border border-slate-300 shadow-2xs active:scale-95 transition disabled:opacity-50 cursor-pointer"
            title="Upload DICOM, JPEG or PNG X-Ray"
          >
            <Upload className="w-3 h-3 text-[#2563EB]" />
            <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Upload'}</span>
          </button>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
            title={isCollapsed ? 'Expand Filmstrip' : 'Collapse Filmstrip'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Dock Content Body */}
      {!isCollapsed && (
        <div className="p-2.5 bg-[#F8FAFC]/70">
          {activeRadiographs.length === 0 ? (
            /* Empty State */
            <div className="py-4 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#4A7CD2] mb-1.5">
                <Image className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-0.5">
                No Diagnostic Radiographs for this Patient
              </h4>
              <p className="text-[11px] text-slate-500 max-w-sm mb-2.5">
                Capture via Eighteeth Nano-Pix / Dicora USB Sensor or upload DICOM/JPG scans.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTriggerSensorCapture}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-2xs cursor-pointer transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Launch Sensor Capture</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-bold cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Upload Scan</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'compact' ? (
            /* ========================================================================= */
            /* ⚡ ZERO-SCROLL COMPACT OPERATORY MODE (Takes only ~62px height!)          */
            /* ========================================================================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {pagedRadiographs.map((r) => {
                const rId = r.radiographID || r.RadiographID;
                const isSelected = selectedScanId === rId;
                const { shortModality, device } = getScanMetadata(r);
                const findings = extractAiFindingsFromReport(r.analysisSummary || r.AnalysisSummary);
                const hasFindings = findings.length > 0;
                const imageUrl = getImageUrl(r);

                return (
                  <div
                    key={rId}
                    onClick={() => onSelectScan && onSelectScan(r, findings)}
                    className={`h-[58px] rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden flex items-center p-1.5 gap-2 group/compact bg-white select-none ${
                      isSelected 
                        ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-50/50 shadow-xs' 
                        : 'border-slate-200 hover:border-cyan-400 hover:bg-slate-50/80 hover:shadow-2xs'
                    }`}
                    title={`Click to spotlight ${findings.length} teeth diagnosed in ${r.imageName}`}
                  >
                    {/* Compact Image Viewport (Left) */}
                    <div className="relative w-12 h-11 rounded-lg bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                      <img 
                        src={imageUrl} 
                        alt={r.imageName || 'X-Ray'} 
                        className="w-full h-full object-cover group-hover/compact:scale-105 transition-transform"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = e.currentTarget.parentElement?.querySelector('.compact-fallback');
                          if (placeholder) placeholder.classList.remove('hidden');
                        }}
                      />
                      <div className="compact-fallback hidden absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900">
                        <Image className="w-4 h-4 opacity-50" />
                      </div>
                      
                      {/* Mini Modality Tag */}
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-cyan-300 text-[8px] font-black text-center tracking-tighter py-0.2">
                        {shortModality}
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between leading-none mb-1">
                        <span className="font-extrabold text-[11px] text-slate-800 truncate" title={r.imageName}>
                          {r.imageName}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      {/* Diagnostic Status Pill */}
                      {hasFindings ? (
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[9.5px] font-extrabold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {findings.length} Teeth
                          </span>
                          <span className="text-[9px] text-slate-400 truncate">
                            #{findings[0]?.toothNumber}
                            {findings.length > 1 ? `, #${findings[1]?.toothNumber}` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                          ✓ Normal
                        </span>
                      )}
                    </div>

                    {/* Right: PiP Button or Spotlight Indicator */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectScan && onInspectScan(r, findings);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition cursor-pointer"
                      title="Inspect scan in PiP Viewer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================================= */
            /* 🖼️ DETAILED CARDS MODE (Optional toggle for in-depth viewing)              */
            /* ========================================================================= */
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {pagedRadiographs.map((r) => {
                  const rId = r.radiographID || r.RadiographID;
                  const isSelected = selectedScanId === rId;
                  const { modality, device } = getScanMetadata(r);
                  const findings = extractAiFindingsFromReport(r.analysisSummary || r.AnalysisSummary);
                  const hasFindings = findings.length > 0;
                  const imageUrl = getImageUrl(r);

                  return (
                    <div
                      key={rId}
                      onClick={() => onSelectScan && onSelectScan(r, findings)}
                      className={`rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden flex flex-col group/card bg-white ${
                        isSelected 
                          ? 'border-cyan-500 ring-2 ring-cyan-500/25 shadow-xs' 
                          : 'border-slate-200 hover:border-cyan-400 hover:shadow-2xs'
                      }`}
                    >
                      <div className="relative h-24 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={r.imageName || 'Radiograph'} 
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.parentElement?.querySelector('.detailed-fallback');
                            if (placeholder) placeholder.classList.remove('hidden');
                          }}
                        />
                        <div className="detailed-fallback hidden absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 p-1">
                          <Image className="w-5 h-5 opacity-40 mb-1" />
                          <span className="text-[9px] font-mono text-center truncate w-full text-slate-300">{r.imageName}</span>
                        </div>

                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-slate-900/85 text-cyan-300 border border-cyan-500/30">
                            {modality}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectScan && onInspectScan(r, findings);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-900/90 text-slate-200 hover:text-white hover:bg-cyan-600 transition cursor-pointer"
                          title="Inspect radiograph in PiP"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>

                        {isSelected && (
                          <div className="absolute bottom-0 inset-x-0 bg-cyan-600/90 px-2 py-0.5 flex items-center justify-between text-white text-[9px] font-bold">
                            <span>⚡ Active Spotlight</span>
                            <span>{findings.length} Teeth</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-[11px] text-slate-800 truncate max-w-[120px]" title={r.imageName}>
                              {r.imageName}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>

                          <div className="text-[9.5px] text-slate-500 mb-1.5 truncate">
                            via {device}
                          </div>

                          <div className="mb-1">
                            {hasFindings ? (
                              <div className="flex flex-wrap gap-1">
                                {findings.slice(0, 4).map(f => (
                                  <span 
                                    key={f.toothKey}
                                    className="px-1 py-0.2 rounded text-[9px] font-extrabold border"
                                    style={{
                                      backgroundColor: `${f.color}15`,
                                      borderColor: `${f.color}40`,
                                      color: f.color
                                    }}
                                  >
                                    #{f.toothNumber}
                                  </span>
                                ))}
                                {findings.length > 4 && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                    +{findings.length - 4}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9.5px] text-emerald-600 font-medium">✓ Normal Anatomy</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
                          <span className={isSelected ? 'text-cyan-700' : 'text-[#4A7CD2]'}>
                            {isSelected ? '✓ Highlighted' : 'Click to Highlight'}
                          </span>
                          <Eye className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

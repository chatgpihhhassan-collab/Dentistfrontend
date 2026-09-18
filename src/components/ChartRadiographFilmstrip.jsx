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
  Zap
} from 'lucide-react';
import { extractAiFindingsFromReport, isTestRadiograph } from '../utils/aiRadiologyUtils.js';

const PAGE_SIZE = 4;

/**
 * ChartRadiographFilmstrip (Vertical Diagnostic Radiographs Panel)
 * 
 * Arranged VERTICALLY alongside the Dental Chart (3D Jaws + 2D Odontogram).
 * Features:
 * - Vertical card layout (cards stacked vertically one under another)
 * - Restores full anatomical size of the 3D jaws
 * - Real-time bi-directional spotlighting on 3D jaw and 2D odontogram
 * - Auto-filters dummy test images with 1-click on-demand toggle
 * - Direct sensor capture & file upload
 * - Deep PiP optical zoom inspector
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
    <div className="w-full bg-white rounded-3xl border border-light-teal/50 shadow-sm overflow-hidden flex flex-col transition-all duration-200">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*,.dcm" 
        className="hidden" 
      />

      {/* Vertical Panel Header */}
      <div className="p-3 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-b border-slate-200/80 flex flex-col gap-2 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#4A7CD2] to-[#2563EB] flex items-center justify-center text-white shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-[#10244B] tracking-wider uppercase">
                  Diagnostic Scans
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-blue-100/70 text-[#2563EB] border border-blue-200">
                  {activeRadiographs.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Nano-Pix</span>
                <span>•</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                <span>Dicora USB</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
              title={isCollapsed ? 'Expand Scans Panel' : 'Collapse Scans Panel'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Action Triggers Row */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={onTriggerSensorCapture}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow-2xs active:scale-95 transition cursor-pointer"
            title="Acquire frame from Eighteeth Nano-Pix / Dicora USB RVG"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Sensor</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white hover:bg-blue-50 text-[#2563EB] border border-blue-200/80 text-[11px] font-extrabold shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
            title="Upload Bitewing, OPG or RVG scan file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          {/* Test Scans Toggle Button */}
          {testScansCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowTestScans(!showTestScans);
                setCurrentPage(1);
              }}
              className={`px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition cursor-pointer border ${
                showTestScans 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs' 
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
              }`}
              title={showTestScans ? "Hide test scans" : `Include ${testScansCount} hidden test scans`}
            >
              <span>{showTestScans ? `🧪 Tests (${testScansCount})` : `🧪 +${testScansCount}`}</span>
            </button>
          )}
        </div>

        {/* Active Scan Spotlight Pill */}
        {activeScanImpact && (
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-950 text-[11px] shadow-2xs animate-in fade-in mt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className="w-3.5 h-3.5 text-cyan-600 animate-pulse shrink-0" />
              <span className="font-bold truncate">
                Spotlight: <span className="font-mono text-cyan-800">{activeScanImpact.imageName}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="px-1.5 py-0.2 rounded bg-cyan-600 text-white text-[9.5px] font-black">
                {activeScanImpact.teeth?.length || 0} Teeth
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClearScanImpact && onClearScanImpact();
                }}
                title="Clear Spotlight"
                className="p-0.5 rounded hover:bg-cyan-200/70 text-cyan-700 hover:text-cyan-950 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vertical Content Body */}
      {!isCollapsed && (
        <div className="p-2.5 bg-[#F8FAFC]/70 flex flex-col gap-2.5 flex-1 min-h-0">
          {activeRadiographs.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#4A7CD2] mb-2 shadow-2xs">
                <Image className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-black text-slate-700">No Patient Scans</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                Acquire with RVG Sensor or upload dental radiographs to view.
              </p>
            </div>
          ) : (
            /* Vertical List of Radiograph Cards */
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[560px] pr-1">
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
                    className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group bg-white shadow-2xs ${
                      isSelected 
                        ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-50/30 shadow-sm' 
                        : 'border-slate-200/90 hover:border-cyan-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Top: Radiograph Image Preview Banner */}
                    <div className="relative h-28 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={r.imageName || 'Radiograph'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = e.currentTarget.parentElement?.querySelector('.vertical-fallback');
                          if (placeholder) placeholder.classList.remove('hidden');
                        }}
                      />
                      <div className="vertical-fallback hidden absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 p-2">
                        <Image className="w-6 h-6 opacity-40 mb-1" />
                        <span className="text-[9.5px] font-mono text-center truncate w-full text-slate-300">{r.imageName}</span>
                      </div>

                      {/* Modality Tag */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-950/80 text-cyan-300 border border-cyan-500/30 shadow-2xs">
                          {modality}
                        </span>
                      </div>

                      {/* PiP Inspector Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectScan && onInspectScan(r, findings);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-slate-200 hover:text-white hover:bg-cyan-600 transition cursor-pointer shadow-2xs"
                        title="Inspect in High-Definition Deep Zoom"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Active Spotlight Stripe */}
                      {isSelected && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-cyan-600 to-blue-600 px-2 py-0.5 flex items-center justify-between text-white text-[9.5px] font-black shadow-xs">
                          <span className="flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-cyan-200" /> Spotlight Active
                          </span>
                          <span>{findings.length} Teeth</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Scan Details & AI Findings */}
                    <div className="p-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 truncate max-w-[170px]" title={r.imageName}>
                          {r.imageName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 truncate">
                        via {device}
                      </div>

                      {/* Diagnosed Teeth Chips */}
                      {hasFindings ? (
                        <div className="flex flex-col gap-1 mt-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              ⚡ {findings.length} Diagnosed Teeth:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                            {findings.slice(0, 7).map(f => (
                              <span 
                                key={f.toothKey}
                                className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold border shadow-2xs"
                                style={{
                                  backgroundColor: `${f.color}15`,
                                  borderColor: `${f.color}40`,
                                  color: f.color
                                }}
                              >
                                #{f.toothNumber}
                              </span>
                            ))}
                            {findings.length > 7 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                +{findings.length - 7}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <span>✓ Normal Anatomy</span>
                        </div>
                      )}

                      {/* Bottom: Highlight Trigger */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between mt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectScan && onSelectScan(r, findings);
                          }}
                          className={`text-[10.5px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                            isSelected 
                              ? 'text-cyan-700 font-black' 
                              : 'text-[#2563EB] hover:text-[#1D4ED8]'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{isSelected ? '✓ Spotlighted on Chart' : 'Click to Highlight'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectScan && onInspectScan(r, findings);
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                          title="Open in deep zoom modal"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {activeRadiographs.length > PAGE_SIZE && (
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10.5px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              
              <span className="text-[10.5px] font-extrabold text-slate-600">
                Page {safePage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10.5px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-0.5"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
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
  Activity
} from 'lucide-react';
import { extractAiFindingsFromReport } from '../utils/aiRadiologyUtils.js';

/**
 * ChartRadiographFilmstrip
 * 
 * Embedded diagnostic dock on the Dental Chart page.
 * Displays patient radiographs, device status (Nano-Pix / Dicora),
 * and provides 1-click active scan clinical impact highlighting on the 3D Jaw Arch and Odontogram.
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
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  // Helper to infer modality and hardware device name
  const getScanMetadata = (r) => {
    const name = (r.imageName || '').toLowerCase();
    const summary = (r.analysisSummary || '').toLowerCase();

    let modality = 'Periapical RVG';
    if (name.includes('pano') || name.includes('opg') || summary.includes('panoramic') || summary.includes('opg')) {
      modality = 'Panoramic (OPG)';
    } else if (name.includes('bite') || name.includes('bwx') || summary.includes('bitewing')) {
      modality = 'Bitewing (BWX)';
    } else if (name.includes('cam') || name.includes('photo') || summary.includes('photograph')) {
      modality = 'Intraoral Photo';
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

    return { modality, device };
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden mb-6 transition-all duration-300">
      {/* Hidden File Input for quick upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*,.dcm" 
        className="hidden" 
      />

      {/* Dock Top Header Bar */}
      <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 tracking-wide">
                DIAGNOSTIC RADIOGRAPHS & SENSORS
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                {radiographs.length} {radiographs.length === 1 ? 'Scan' : 'Scans'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Eighteeth Nano-Pix RVG Ready
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Dicora USB Sensor Ready
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Scan Impact Tag if active */}
        {activeScanImpact && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs shadow-inner animate-in fade-in">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>
              Spotlighting <strong className="text-white font-semibold">{activeScanImpact.imageName}</strong>:
            </span>
            <div className="flex items-center gap-1">
              {(activeScanImpact.teeth || []).slice(0, 5).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-bold text-cyan-300">
                  #{t}
                </span>
              ))}
              {(activeScanImpact.teeth || []).length > 5 && (
                <span className="text-[10px] text-cyan-400 font-bold">
                  +{(activeScanImpact.teeth || []).length - 5} more
                </span>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClearScanImpact && onClearScanImpact();
              }}
              title="Clear Scan Spotlight"
              className="ml-1 p-0.5 rounded-lg hover:bg-cyan-800/50 text-cyan-300 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Action Buttons & Collapse Toggle */}
        <div className="flex items-center gap-2">
          {/* Hardware Sensor Capture */}
          <button
            type="button"
            onClick={onTriggerSensorCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 active:scale-95 transition"
            title="Acquire frame directly from Eighteeth Nano-Pix or Dicora USB RVG"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Sensor Capture</span>
          </button>

          {/* Quick File Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-semibold border border-slate-600 active:scale-95 transition disabled:opacity-50"
            title="Upload DICOM, JPEG or PNG X-Ray"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Upload X-Ray'}</span>
          </button>

          {/* Collapse / Expand Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={isCollapsed ? 'Expand Radiograph Filmstrip' : 'Collapse Filmstrip'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dock Body: Filmstrip Cards */}
      {!isCollapsed && (
        <div className="relative p-4 bg-slate-950/60">
          {radiographs.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <Image className="w-6 h-6 text-slate-500" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                No Diagnostic Radiographs for this Patient
              </h4>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                Capture dental X-rays via USB RVG Sensor (Eighteeth Nano-Pix / Dicora) or upload DICOM/JPG scans to visualize pathologies directly on the Dental Chart.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTriggerSensorCapture}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Sensor Capture</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold transition"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload Radiograph File</span>
                </button>
              </div>
            </div>
          ) : (
            /* Filmstrip Carousel */
            <div className="relative group">
              {/* Left Scroll Arrow */}
              <button
                type="button"
                onClick={() => scroll('left')}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800/90 border border-slate-600 text-slate-200 flex items-center justify-center shadow-xl hover:bg-slate-700 hover:scale-110 active:scale-95 transition opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Scroll Track */}
              <div 
                ref={scrollContainerRef}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent scroll-smooth"
                style={{ scrollbarWidth: 'thin' }}
              >
                {radiographs.map((r) => {
                  const isSelected = selectedScanId === r.radiographID;
                  const { modality, device } = getScanMetadata(r);
                  const findings = extractAiFindingsFromReport(r.analysisSummary);
                  const hasFindings = findings.length > 0;
                  const imageUrl = `/api/radiographs/${r.radiographID}/image`;

                  return (
                    <div
                      key={r.radiographID}
                      onClick={() => onSelectScan && onSelectScan(r, findings)}
                      className={`flex-shrink-0 w-56 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group/card ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20 -translate-y-1' 
                          : 'border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-500 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Card Image Thumbnail */}
                      <div className="relative h-28 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={r.imageName} 
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                        {/* Fallback placeholder if image load errors */}
                        <div className="hidden absolute inset-0 flex-col items-center justify-center text-slate-500 bg-slate-900">
                          <Image className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-[10px] font-mono">{r.imageName}</span>
                        </div>

                        {/* Modality Pill Badge (Top-Left) */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 shadow">
                            {modality}
                          </span>
                        </div>

                        {/* Inspect PiP Button (Top-Right on Hover or Active) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectScan && onInspectScan(r, findings);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white hover:bg-cyan-600 transition shadow ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                          }`}
                          title="Inspect radiograph with Zoom & Invert Greyscale"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Active Selection Indicator Ribbon */}
                        {isSelected && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-600/90 to-transparent px-2 py-1 flex items-center justify-between text-white text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-yellow-300" />
                              Active Spotlight
                            </span>
                            <span>{findings.length} Teeth</span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          {/* File Name & Date */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-slate-200 truncate max-w-[130px]" title={r.imageName}>
                              {r.imageName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>

                          {/* Device Tag */}
                          <div className="text-[10px] text-slate-400 mb-2 truncate">
                            via <span className="text-slate-300 font-medium">{device}</span>
                          </div>

                          {/* Impacted Teeth Findings Preview */}
                          <div className="mb-2">
                            {hasFindings ? (
                              <div>
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  <span>{findings.length} Impacted {findings.length === 1 ? 'Tooth' : 'Teeth'}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {findings.slice(0, 4).map(f => (
                                    <span 
                                      key={f.toothKey}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                                      style={{
                                        backgroundColor: `${f.color}20`,
                                        borderColor: `${f.color}50`,
                                        color: f.color
                                      }}
                                    >
                                      #{f.toothNumber}
                                    </span>
                                  ))}
                                  {findings.length > 4 && (
                                    <span className="px-1 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                                      +{findings.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Normal Radiographic Anatomy</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Footer */}
                        <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                          <span className="text-[10px] text-cyan-400 font-medium group-hover/card:underline">
                            {isSelected ? 'Click to Deselect' : 'Click to Highlight Chart'}
                          </span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/card:text-cyan-400 transition" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Scroll Arrow */}
              <button
                type="button"
                onClick={() => scroll('right')}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800/90 border border-slate-600 text-slate-200 flex items-center justify-center shadow-xl hover:bg-slate-700 hover:scale-110 active:scale-95 transition opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

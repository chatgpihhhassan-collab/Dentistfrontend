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
  Zap 
} from 'lucide-react';
import { extractAiFindingsFromReport } from '../utils/aiRadiologyUtils.js';

const PAGE_SIZE = 5;

/**
 * ChartRadiographFilmstrip
 * 
 * Doctor-friendly diagnostic imaging dock on the Dental Chart page.
 * Features:
 * - Clean, medical clinic aesthetic matching Dentia design system
 * - Pagination (5 scans per page) for high volume scan histories
 * - Direct image loading from API with failover
 * - Hardware device status (Eighteeth Nano-Pix / Dicora USB)
 * - 1-click scan clinical impact spotlighting on 3D jaw and 2D odontogram
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
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = React.useRef(null);

  const totalPages = Math.max(1, Math.ceil(radiographs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRadiographs = radiographs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-5 transition-all duration-300">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*,.dcm" 
        className="hidden" 
      />

      {/* Dock Header Bar: Clean Medical Theme */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#4A7CD2] to-[#2563EB] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-[#10244B] tracking-wider uppercase">
                Diagnostic Radiographs & Sensors
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                {radiographs.length} {radiographs.length === 1 ? 'Scan' : 'Scans'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Eighteeth Nano-Pix RVG Ready
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                Dicora USB Sensor Ready
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Scan Impact Tag */}
        {activeScanImpact && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs shadow-2xs animate-in fade-in">
            <Zap className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span className="font-bold">
              Spotlight: <span className="font-mono text-cyan-800">{activeScanImpact.imageName}</span>
            </span>
            <div className="flex items-center gap-1">
              {(activeScanImpact.teeth || []).slice(0, 5).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-cyan-600 text-white text-[10px] font-bold">
                  #{t}
                </span>
              ))}
              {(activeScanImpact.teeth || []).length > 5 && (
                <span className="text-[10px] text-cyan-700 font-bold">
                  +{(activeScanImpact.teeth || []).length - 5}
                </span>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClearScanImpact && onClearScanImpact();
              }}
              title="Clear Spotlight"
              className="ml-1 p-0.5 rounded-md hover:bg-cyan-200/70 text-cyan-700 hover:text-cyan-950 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Actions & Collapse Button */}
        <div className="flex items-center gap-2">
          {/* Sensor Capture */}
          <button
            type="button"
            onClick={onTriggerSensorCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
            title="Acquire frame from Eighteeth Nano-Pix / Dicora USB RVG"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Sensor Capture</span>
          </button>

          {/* Upload X-Ray */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs active:scale-95 transition disabled:opacity-50 cursor-pointer"
            title="Upload DICOM, JPEG or PNG X-Ray"
          >
            <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Upload X-Ray'}</span>
          </button>

          {/* Collapse / Expand */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
            title={isCollapsed ? 'Expand Filmstrip' : 'Collapse Filmstrip'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dock Body: Paged 5-Card Grid */}
      {!isCollapsed && (
        <div className="p-4 bg-[#F8FAFC]/60">
          {radiographs.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#4A7CD2] mb-3">
                <Image className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                No Diagnostic Radiographs for this Patient
              </h4>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Capture dental X-rays via USB RVG Sensor (Eighteeth Nano-Pix / Dicora) or upload DICOM/JPG scans to visualize pathologies directly on the Dental Chart.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTriggerSensorCapture}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Sensor Capture</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer transition"
                >
                  <Upload className="w-4 h-4 text-[#2563EB]" />
                  <span>Upload Radiograph File</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* 5-Column Responsive Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
                      className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group/card bg-white ${
                        isSelected 
                          ? 'border-cyan-500 ring-3 ring-cyan-500/25 shadow-md shadow-cyan-500/10 -translate-y-1' 
                          : 'border-slate-200 hover:border-cyan-400 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Image Viewport: Dark clinical background to show radiopacity contrast */}
                      <div className="relative h-28 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={r.imageName || 'Dental Radiograph'} 
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.parentElement?.querySelector('.fallback-placeholder');
                            if (placeholder) placeholder.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback placeholder */}
                        <div className="fallback-placeholder hidden absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 p-2">
                          <Image className="w-7 h-7 opacity-40 mb-1" />
                          <span className="text-[10px] font-mono text-center truncate w-full text-slate-300">{r.imageName}</span>
                        </div>

                        {/* Modality Badge (Top-Left) */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-extrabold bg-slate-900/85 backdrop-blur-xs text-cyan-300 border border-cyan-500/30 shadow-xs">
                            {modality}
                          </span>
                        </div>

                        {/* Inspect PiP Button (Top-Right) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectScan && onInspectScan(r, findings);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white hover:bg-cyan-600 transition shadow-xs cursor-pointer ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                          }`}
                          title="Inspect radiograph in high-definition (Zoom & Invert Greyscale)"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Active Selection Ribbon */}
                        {isSelected && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-600/95 to-cyan-600/60 px-2 py-1 flex items-center justify-between text-white text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-yellow-300" />
                              Active Spotlight
                            </span>
                            <span>{findings.length} Teeth</span>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          {/* File Name & Date */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-slate-800 truncate max-w-[125px]" title={r.imageName}>
                              {r.imageName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>

                          {/* Hardware Sensor Device */}
                          <div className="text-[10.5px] text-slate-500 mb-2 truncate">
                            via <span className="text-slate-700 font-semibold">{device}</span>
                          </div>

                          {/* Impacted Teeth Chips */}
                          <div className="mb-2">
                            {hasFindings ? (
                              <div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                                  <span>{findings.length} Impacted {findings.length === 1 ? 'Tooth' : 'Teeth'}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {findings.slice(0, 4).map(f => (
                                    <span 
                                      key={f.toothKey}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border shadow-2xs"
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
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      +{findings.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Normal Anatomy</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom Trigger */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className={`text-[10.5px] font-bold transition ${
                            isSelected ? 'text-cyan-700' : 'text-[#4A7CD2] group-hover/card:underline'
                          }`}>
                            {isSelected ? '✓ Highlighted on Chart' : 'Click to Highlight'}
                          </span>
                          <Eye className={`w-3.5 h-3.5 transition ${
                            isSelected ? 'text-cyan-600' : 'text-slate-400 group-hover/card:text-[#4A7CD2]'
                          }`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls Bar (Shown if scans > 5) */}
              {radiographs.length > PAGE_SIZE && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Left: Summary Count */}
                  <div className="text-slate-500 font-medium">
                    Showing <strong className="text-slate-800 font-bold">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, radiographs.length)}</strong> of <strong className="text-slate-800 font-bold">{radiographs.length}</strong> radiographs
                  </div>

                  {/* Center/Right: Page Navigator */}
                  <div className="flex items-center gap-1.5">
                    {/* Previous Page Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage - 1)}
                      disabled={safePage <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {/* Page Number Pills */}
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, idx) => {
                        const pNum = idx + 1;
                        // Limit visible pills if total pages is large
                        if (
                          pNum === 1 || 
                          pNum === totalPages || 
                          (pNum >= safePage - 1 && pNum <= safePage + 1)
                        ) {
                          const isCurrent = pNum === safePage;
                          return (
                            <button
                              key={pNum}
                              type="button"
                              onClick={() => handlePageChange(pNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                isCurrent 
                                  ? 'bg-[#2563EB] text-white shadow-xs' 
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {pNum}
                            </button>
                          );
                        } else if (pNum === safePage - 2 || pNum === safePage + 2) {
                          return <span key={pNum} className="px-0.5 text-slate-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    {/* Next Page Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

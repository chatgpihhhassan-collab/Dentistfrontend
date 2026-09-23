import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Check, 
  FileText, 
  AlertTriangle, 
  Contrast, 
  Maximize2, 
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { extractAiFindingsFromReport, extractSoapFromReport } from '../utils/aiRadiologyUtils.js';

/**
 * RadiographImpactInspectorModal
 * 
 * High-definition diagnostic viewer providing:
 * - Zoom (100% - 400%)
 * - Greyscale Inversion (Invert radiopacity for apical lesion / trabeculae inspection)
 * - Brightness & Contrast fine-tuning
 * - Interactive tooth finding tags with 1-click apply to Dental Chart and AI-Notes
 */
export default function RadiographImpactInspectorModal({
  radiograph,
  isOpen,
  onClose,
  onApplyFindingsToChart,
  onSyncToAiNotes,
  onSelectTooth,
  isApplying = false
}) {
  const [zoom, setZoom] = useState(1);
  const [isInverted, setIsInverted] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeFindingTab, setActiveFindingTab] = useState('findings'); // 'findings' | 'soap' | 'narrative'
  const [copiedState, setCopiedState] = useState(false);

  if (!isOpen || !radiograph) return null;

  const findings = extractAiFindingsFromReport(radiograph.analysisSummary);
  const rId = radiograph.radiographID || radiograph.RadiographID;
  const imageUrl = radiograph.imageData && radiograph.imageData.length > 50
    ? (radiograph.imageData.startsWith('data:') ? radiograph.imageData : `data:${radiograph.mimeType || 'image/jpeg'};base64,${radiograph.imageData}`)
    : `https://dentist-api-dev.vitonta.com/api/radiographs/${rId}/image`;

  const resetAdjustments = () => {
    setZoom(1);
    setIsInverted(false);
    setBrightness(100);
    setContrast(100);
  };

  const imageFilterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? 'invert(100%)' : ''}`,
    transform: `scale(${zoom})`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease-out, filter 0.15s ease-out'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Diagnostic Radiograph Inspector
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {radiograph.imageName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan ID: #{radiograph.radiographID} • {radiograph.uploadedAt ? new Date(radiograph.uploadedAt).toLocaleString() : 'Recent Scan'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyFindingsToChart && onApplyFindingsToChart(findings, radiograph)}
              disabled={isApplying || findings.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md active:scale-95 transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isApplying ? 'Applying...' : 'Apply Findings to Chart'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSyncToAiNotes && onSyncToAiNotes(radiograph, findings, soapNotes)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sync to AI Notes</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close Inspector (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left / Main: Radiograph Canvas & Controls (7 Cols) */}
          <div className="lg:col-span-7 bg-black flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden relative">
            {/* Viewport Toolbar */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                  className="p-1 text-slate-300 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-cyan-400 font-bold px-1.5 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))))}
                  className="p-1 text-slate-300 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Invert Greyscale Toggle (Crucial for Apical Radiolucencies) */}
              <button
                type="button"
                onClick={() => setIsInverted(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                  isInverted
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Invert Greyscale (reveals periapical lesions and bone trabeculae)"
              >
                <Contrast className="w-3.5 h-3.5" />
                <span>Invert Greyscale</span>
              </button>

              {/* Sliders: Brightness & Contrast */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Bri</span>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Con</span>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Reset Filters */}
              <button
                type="button"
                onClick={resetAdjustments}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Reset Image Adjustments"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Image Canvas Container */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[360px] max-h-[550px] relative select-none">
              <img
                src={imageUrl}
                alt={radiograph.imageName}
                style={imageFilterStyle}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
              />

              {/* Watermark/Modality Overlay */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-slate-300 font-mono">
                {isInverted ? 'INVERTED RADIOPACITY' : 'STANDARD RADIOPACITY'} • {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>

          {/* Right: AI Clinical Findings & Impact Matrix (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col justify-between overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-slate-800 px-4 pt-3 bg-slate-900/60">
              <button
                type="button"
                onClick={() => setActiveFindingTab('findings')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeFindingTab === 'findings'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Tooth Findings ({findings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFindingTab('soap')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeFindingTab === 'soap'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>SOAP Clinical Note</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFindingTab('narrative')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeFindingTab === 'narrative'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Full Report</span>
              </button>
            </div>

            {/* Tab Content Area (Scrollable) */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {activeFindingTab === 'findings' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Diagnosed Tooth Pathologies
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Click tooth to highlight on chart
                    </span>
                  </div>

                  {findings.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-800/40 border border-slate-800">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-200">
                        No Visible Tooth Pathologies Detected
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        AI analysis evaluated bone levels, lamina dura, and crowns with normal radiographic presentation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {findings.map((f) => (
                        <div
                          key={f.toothKey}
                          onClick={() => onSelectTooth && onSelectTooth(f.toothNumber)}
                          className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/50 transition cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm border"
                                style={{
                                  backgroundColor: `${f.color}25`,
                                  borderColor: `${f.color}60`,
                                  color: f.color
                                }}
                              >
                                #{f.toothNumber}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                                  {f.condition}
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  Severity: <strong className="text-slate-300">{f.severity}</strong> • Conf: {f.confidence}%
                                </span>
                              </div>
                            </div>

                            {/* CDT Code Chip */}
                            {f.cdtCode && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {f.cdtCode}
                              </span>
                            )}
                          </div>

                          {/* Recommended Procedure */}
                          <div className="text-[11px] text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                            <span className="truncate">
                              {f.procedure || 'Clinical evaluation required'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeFindingTab === 'soap' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Auto-Generated Clinical SOAP
                    </span>
                    <span className="text-[11px] text-indigo-400 font-semibold">
                      Ready for AI Notes Scribe
                    </span>
                  </div>

                  {soapNotes ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="font-bold text-cyan-400 block mb-1">SUBJECTIVE</span>
                        <p className="text-slate-300 leading-relaxed">{soapNotes.subjective}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="font-bold text-cyan-400 block mb-1">OBJECTIVE</span>
                        <p className="text-slate-300 leading-relaxed">{soapNotes.objective}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="font-bold text-amber-400 block mb-1">ASSESSMENT</span>
                        <p className="text-slate-300 leading-relaxed">{soapNotes.assessment}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="font-bold text-emerald-400 block mb-1">PLAN</span>
                        <p className="text-slate-300 leading-relaxed">{soapNotes.plan}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-800/50 text-center text-slate-400 text-xs">
                      Structured SOAP notes not detected in standard format. View the Full Report tab.
                    </div>
                  )}
                </div>
              )}

              {activeFindingTab === 'narrative' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Radiology Report Narrative
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto">
                    {radiograph.analysisSummary || 'No analysis summary available for this scan.'}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Banner */}
            <div className="p-4 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                <span>Findings: <strong className="text-white">{findings.length} teeth</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onApplyFindingsToChart && onApplyFindingsToChart(findings, radiograph)}
                  disabled={isApplying || findings.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Applying...' : 'Apply to Chart'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

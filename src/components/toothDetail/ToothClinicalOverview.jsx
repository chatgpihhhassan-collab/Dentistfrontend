import React, { useState, useEffect } from 'react';
import { FileText, Microscope, Sparkles, CheckCircle2, ChevronRight, Activity, Clock, ShieldCheck } from 'lucide-react';
import ToothCrossSectionDiagram from './ToothCrossSectionDiagram';
import { API_BASE_URL } from '../../config/apiConfig';

export default function ToothClinicalOverview({
  patientId,
  isPediatric,
  tNum,
  tKey,
  toothData,
  surfaceData,
  activePaletteItem,
  setActivePaletteItem,
  handleToggleZone,
  handleApplyAll5Zones,
  handleClearAllZones,
  editingNotes,
  setEditingNotes,
  isEditingNotes,
  setIsEditingNotes,
  handleSaveObservation,
  saving,
  onOpenImplant,
  onOpenBiopsy,
  onOpenAligner,
  refreshTrigger = 0
}) {
  const [implantPlans, setImplantPlans] = useState([]);
  const [biopsyRecords, setBiopsyRecords] = useState([]);
  const [alignerPlans, setAlignerPlans] = useState([]);

  useEffect(() => {
    if (!patientId) return;

    // Load from cache first
    try {
      const cachedImplants = localStorage.getItem(`dentia_implant_plans_${patientId}`);
      if (cachedImplants) setImplantPlans(JSON.parse(cachedImplants));

      const cachedBiopsies = localStorage.getItem(`dentia_biopsy_records_${patientId}`);
      if (cachedBiopsies) setBiopsyRecords(JSON.parse(cachedBiopsies));

      const cachedAligners = localStorage.getItem(`dentia_aligner_plans_${patientId}`);
      if (cachedAligners) setAlignerPlans(JSON.parse(cachedAligners));
    } catch (e) {}

    // Fetch remote records
    const fetchRecords = async () => {
      try {
        const [impRes, bioRes, aliRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/patients/${patientId}/implant-plans`),
          fetch(`${API_BASE_URL}/api/patients/${patientId}/biopsy-records`),
          fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners`)
        ]);

        if (impRes.status === 'fulfilled' && impRes.value.ok) {
          const data = await impRes.value.json();
          if (Array.isArray(data)) setImplantPlans(data);
        }
        if (bioRes.status === 'fulfilled' && bioRes.value.ok) {
          const data = await bioRes.value.json();
          if (Array.isArray(data)) setBiopsyRecords(data);
        }
        if (aliRes.status === 'fulfilled' && aliRes.value.ok) {
          const data = await aliRes.value.json();
          if (Array.isArray(data)) setAlignerPlans(data);
        }
      } catch (err) {
        console.warn('Error loading specialty records for tooth:', err);
      }
    };

    fetchRecords();
  }, [patientId, tKey, refreshTrigger]);

  // Find relevant records for this tooth
  const toothKeyStr = String(tKey || tNum || '').toLowerCase();
  const toothImplant = implantPlans.find(p => 
    String(p.toothKey || p.toothNumber || '').toLowerCase() === toothKeyStr
  );
  const toothBiopsy = biopsyRecords.find(b => 
    String(b.toothKey || b.toothNumber || '').toLowerCase() === toothKeyStr ||
    (b.siteOfBiopsy && b.siteOfBiopsy.toLowerCase().includes(toothKeyStr))
  ) || biopsyRecords[0];

  const activeAligner = alignerPlans[0];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Doctor Clinical Observation Notes & Dictation Log */}
      <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4A7CD2]" />
            Doctor Clinical Observation Notes & Dictation Log
          </h3>
          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className="text-xs font-bold text-[#4A7CD2] hover:underline cursor-pointer"
          >
            {isEditingNotes ? 'Cancel Edit' : 'Edit Notes ✍️'}
          </button>
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              rows={3}
              className="w-full text-xs font-semibold p-3 rounded-2xl border border-light-teal/50 bg-[#F8FAFC] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#4A7CD2]"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleSaveObservation(toothData?.status, editingNotes, toothData?.color)}
                disabled={saving}
                className="bg-[#4A7CD2] text-white text-xs font-black px-4 py-1.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl p-3.5 space-y-1.5">
            <p className="text-xs text-dark-slate font-semibold leading-relaxed whitespace-pre-line">
              {toothData?.comments || toothData?.comment || 'No abnormal pathology detected. Enamel surface is intact with physiological bone levels.'}
            </p>
          </div>
        )}
      </div>

      {/* Clinical Specialty Protocol & Historical EHR Record for Tooth #{tKey} */}
      <div className="bg-gradient-to-br from-slate-900 via-[#10244B] to-[#1E3A8A] text-white rounded-3xl border border-blue-500/40 p-5 shadow-md space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-sm shadow-inner">
              🩺
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Clinical Specialty History & Protocol</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Tooth #{tKey}
                </span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenImplant && (
              <button
                type="button"
                onClick={onOpenImplant}
                className="text-[10px] font-bold text-blue-200 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                🔩 Implant
              </button>
            )}
            {onOpenBiopsy && (
              <button
                type="button"
                onClick={onOpenBiopsy}
                className="text-[10px] font-bold text-purple-200 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                🔬 Biopsy
              </button>
            )}
            {onOpenAligner && (
              <button
                type="button"
                onClick={onOpenAligner}
                className="text-[10px] font-bold text-emerald-200 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                ✨ Aligners
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Box A: Saved Implant Protocol */}
          {toothImplant ? (
            <div 
              onClick={onOpenImplant}
              className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-3 space-y-2 cursor-pointer transition-all hover:border-blue-400/50 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔩</span>
                  <span className="text-xs font-black text-blue-200">
                    Implant: {toothImplant.implantBrand?.split('(')[0] || 'Straumann'}
                  </span>
                </div>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {toothImplant.planStatus || 'Planned'}
                </span>
              </div>
              <div className="text-[11px] font-bold text-white space-y-0.5">
                <p>Dimensions: <strong className="text-blue-300">{toothImplant.implantLength}mm length × Ø{toothImplant.implantDiameter}mm</strong></p>
                <p>Bone Quality: <strong className="text-blue-200">Class {toothImplant.boneQuality || 'D2'}</strong> (Height: {toothImplant.boneHeightAvailable || 12.5}mm, Width: {toothImplant.boneWidthAvailable || 7}mm)</p>
                <p>Sinus Lift: <span className="text-slate-300">{toothImplant.sinusLiftStatus || 'None'}</span> · Grafting: <span className={toothImplant.graftingRequired ? "text-rose-300 font-black" : "text-slate-300"}>{toothImplant.graftingRequired ? "Required" : "No"}</span></p>
              </div>
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-blue-200">
                <span>{toothImplant.guidedSurgeryFlag ? '✓ 3D Guided Surgery' : 'Freehand Placement'}</span>
                <span className="underline group-hover:translate-x-0.5 transition-transform">Edit Protocol ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenImplant}
              className="bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 mb-1">
                  <span>🔩</span>
                  <span>No Implant Plan for Tooth #{tKey}</span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-semibold">
                  Click to configure fixture dimensions, Lekholm & Zarb bone classification, and 3D CBCT guided surgery.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <span className="text-[10px] font-black text-blue-300 underline">+ Plan Implant ➔</span>
              </div>
            </div>
          )}

          {/* Box B: Saved Pathology / Biopsy Requisition */}
          {toothBiopsy ? (
            <div 
              onClick={onOpenBiopsy}
              className="bg-purple-950/40 hover:bg-purple-950/60 border border-purple-400/30 rounded-2xl p-3 space-y-2 cursor-pointer transition-all hover:border-purple-400/50 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔬</span>
                  <span className="text-xs font-black text-purple-200">
                    Pathology: {toothBiopsy.biopsyType} Biopsy
                  </span>
                </div>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  {toothBiopsy.status || 'Specimen Sent'}
                </span>
              </div>
              <div className="text-[11px] font-bold text-white space-y-0.5">
                <p>Site: <strong className="text-purple-200">{toothBiopsy.siteOfBiopsy || `Tooth #${tKey} Region`}</strong></p>
                <p>Impression: <strong className="text-purple-300">{toothBiopsy.clinicalImpression || 'Oral Pathology'}</strong></p>
                <p>Laboratory: <span className="text-slate-300">{toothBiopsy.pathologyLabName || 'Pathology Lab'}</span> {toothBiopsy.specimenReference ? `· Bottle: ${toothBiopsy.specimenReference}` : ''}</p>
              </div>
              <div className="pt-1.5 border-t border-purple-400/20 flex items-center justify-between text-[10px] font-black text-purple-200">
                <span className="truncate max-w-[160px]">{toothBiopsy.histopathologyDiagnosis ? `Dx: ${toothBiopsy.histopathologyDiagnosis}` : 'Microscopic report pending'}</span>
                <span className="underline group-hover:translate-x-0.5 transition-transform">Inspect Lab Record ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenBiopsy}
              className="bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 mb-1">
                  <span>🔬</span>
                  <span>No Biopsy Recorded at this Site</span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-semibold">
                  Record an incisional or excisional biopsy procedure with anatomical mapping and laboratory requisition tracking.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <span className="text-[10px] font-black text-purple-300 underline">+ Requisition Biopsy ➔</span>
              </div>
            </div>
          )}
        </div>

        {/* Aligner Staging Ribbon if Active */}
        {activeAligner && (
          <div 
            onClick={onOpenAligner}
            className="bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-400/30 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs font-bold text-emerald-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">✨</span>
              <span>Patient Aligner Treatment: <strong className="text-white">{activeAligner.alignerBrand}</strong> (Tray {activeAligner.currentStage} of {activeAligner.totalStages} · {activeAligner.wearSchedule})</span>
            </div>
            <span className="text-[10px] font-black text-emerald-300 underline shrink-0">Open Aligner Suite ➔</span>
          </div>
        )}
      </div>

      {/* 5-Surface Cross-Section Box (Centerpiece) */}
      <ToothCrossSectionDiagram
        patientId={patientId}
        isPediatric={isPediatric}
        tNum={tNum}
        tKey={tKey}
        surfaceData={surfaceData}
        activePaletteItem={activePaletteItem}
        setActivePaletteItem={setActivePaletteItem}
        handleToggleZone={handleToggleZone}
        handleApplyAll5Zones={handleApplyAll5Zones}
        handleClearAllZones={handleClearAllZones}
        toothData={toothData}
      />
    </div>
  );
}

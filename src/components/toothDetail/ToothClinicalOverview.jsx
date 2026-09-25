import React, { useState, useEffect } from 'react';
import { FileText, Microscope, Sparkles, CheckCircle2, ChevronRight, Activity, Clock, ShieldCheck, Tag } from 'lucide-react';
import ToothCrossSectionDiagram from './ToothCrossSectionDiagram';
import { API_BASE_URL } from '../../config/apiConfig';
import { getCustomProcedures } from '../../services/customProceduresService';

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

  // Detect if tooth has an active custom clinic procedure recorded
  const customProcedures = getCustomProcedures();
  const toothStatusStr = String(toothData?.status || '').toLowerCase();
  const toothCommentsStr = String(toothData?.comments || '').toLowerCase();
  const activeCustomProc = customProcedures.find(cp => 
    toothStatusStr.includes(cp.procedureName.toLowerCase()) || 
    toothCommentsStr.includes(cp.procedureName.toLowerCase()) ||
    toothCommentsStr.includes(cp.procedureCode.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Active Custom Procedure Ribbon (if tooth has a custom procedure) */}
      {activeCustomProc && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border border-purple-200/90 rounded-3xl p-4 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center text-lg shrink-0 shadow-2xs">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-purple-950">
                  {activeCustomProc.procedureName}
                </span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Custom Clinic Procedure ({activeCustomProc.procedureCode})
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5 line-clamp-1">
                {activeCustomProc.description || 'Clinic proprietary treatment scheduled and synchronized to patient EHR & billing.'}
              </p>
            </div>
          </div>
          {activeCustomProc.standardFee && (
            <div className="text-right shrink-0 pl-3">
              <span className="text-xs font-black text-emerald-700 block">
                {activeCustomProc.currency || 'PKR'} {Number(activeCustomProc.standardFee).toLocaleString()}
              </span>
              <span className="text-[9.5px] text-slate-500 font-bold block">
                {activeCustomProc.estimatedDuration || '45 mins'}
              </span>
            </div>
          )}
        </div>
      )}

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
      <div className="bg-gradient-to-br from-white via-slate-50/90 to-[#F4F7FC] text-slate-800 rounded-3xl border border-slate-200/90 p-5 shadow-[0_2px_12px_rgba(16,36,75,0.06)] space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#EAF0FC] border border-[#D4E2F9] text-[#4A7CD2] flex items-center justify-center text-sm shadow-2xs">
              🩺
            </div>
            <div>
              <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                <span>Clinical Specialty History & Protocol</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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
                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                🔩 Implant
              </button>
            )}
            {onOpenBiopsy && (
              <button
                type="button"
                onClick={onOpenBiopsy}
                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                🔬 Biopsy
              </button>
            )}
            {onOpenAligner && (
              <button
                type="button"
                onClick={onOpenAligner}
                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
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
              className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 hover:from-teal-50 hover:to-white border border-teal-200/80 hover:border-teal-400 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔩</span>
                  <span className="text-xs font-black text-teal-950">
                    Implant: {toothImplant.implantBrand?.split('(')[0] || 'Straumann'}
                  </span>
                </div>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  {toothImplant.planStatus || 'Planned'}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-800 space-y-0.5">
                <p>Dimensions: <strong className="text-teal-900">{toothImplant.implantLength}mm length × Ø{toothImplant.implantDiameter}mm</strong></p>
                <p>Bone Quality: <strong className="text-teal-800">Class {toothImplant.boneQuality || 'D2'}</strong> (Height: {toothImplant.boneHeightAvailable || 12.5}mm, Width: {toothImplant.boneWidthAvailable || 7}mm)</p>
                <p>Sinus Lift: <span className="text-slate-600">{toothImplant.sinusLiftStatus || 'None'}</span> · Grafting: <span className={toothImplant.graftingRequired ? "text-rose-600 font-black" : "text-slate-600"}>{toothImplant.graftingRequired ? "Required" : "No"}</span></p>
              </div>
              <div className="pt-2 border-t border-teal-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span className={toothImplant.guidedSurgeryFlag ? 'text-teal-700 font-bold' : 'text-slate-500'}>
                  {toothImplant.guidedSurgeryFlag ? '✓ 3D Guided Surgery' : 'Freehand Placement'}
                </span>
                <span className="text-teal-700 underline font-black group-hover:text-teal-900 group-hover:translate-x-0.5 transition-transform">Edit Protocol ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenImplant}
              className="bg-slate-50/70 hover:bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 mb-1">
                  <span>🔩</span>
                  <span>No Implant Plan for Tooth #{tKey}</span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Click to configure fixture dimensions, Lekholm & Zarb bone classification, and 3D CBCT guided surgery.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <span className="text-[10px] font-bold text-[#4A7CD2] hover:underline">+ Plan Implant ➔</span>
              </div>
            </div>
          )}

          {/* Box B: Saved Pathology / Biopsy Requisition */}
          {toothBiopsy ? (
            <div 
              onClick={onOpenBiopsy}
              className="bg-gradient-to-br from-purple-50/70 via-white to-slate-50 hover:from-purple-50 hover:to-white border border-purple-200/80 hover:border-purple-400 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔬</span>
                  <span className="text-xs font-black text-purple-950">
                    Pathology: {toothBiopsy.biopsyType} Biopsy
                  </span>
                </div>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  {toothBiopsy.status || 'Specimen Sent'}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-800 space-y-0.5">
                <p>Site: <strong className="text-purple-900">{toothBiopsy.siteOfBiopsy || `Tooth #${tKey} Region`}</strong></p>
                <p>Impression: <strong className="text-purple-800">{toothBiopsy.clinicalImpression || 'Oral Pathology'}</strong></p>
                <p>Laboratory: <span className="text-slate-600">{toothBiopsy.pathologyLabName || 'Pathology Lab'}</span> {toothBiopsy.specimenReference ? `· Bottle: ${toothBiopsy.specimenReference}` : ''}</p>
              </div>
              <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span className="truncate max-w-[160px]">{toothBiopsy.histopathologyDiagnosis ? `Dx: ${toothBiopsy.histopathologyDiagnosis}` : 'Microscopic report pending'}</span>
                <span className="text-purple-700 underline font-black group-hover:text-purple-900 group-hover:translate-x-0.5 transition-transform">Inspect Lab Record ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenBiopsy}
              className="bg-slate-50/70 hover:bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 mb-1">
                  <span>🔬</span>
                  <span>No Biopsy Recorded at this Site</span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Record an incisional or excisional biopsy procedure with anatomical mapping and laboratory requisition tracking.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <span className="text-[10px] font-bold text-purple-600 hover:underline">+ Requisition Biopsy ➔</span>
              </div>
            </div>
          )}
        </div>

        {/* Aligner Staging Ribbon if Active */}
        {activeAligner && (
          <div 
            onClick={onOpenAligner}
            className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white hover:from-emerald-50 hover:to-slate-50 border border-emerald-200/90 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-colors text-xs font-bold text-slate-800 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">✨</span>
              <span>Patient Aligner Treatment: <strong className="text-emerald-950">{activeAligner.alignerBrand}</strong> (Tray {activeAligner.currentStage} of {activeAligner.totalStages} · {activeAligner.wearSchedule})</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 underline shrink-0 hover:text-emerald-900">Open Aligner Suite ➔</span>
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

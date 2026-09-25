import React, { useState, useEffect } from 'react';
import { Microscope, Sparkles, ChevronRight, Activity, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';

export default function ClinicalSpecialtiesDossierBar({
  patientId,
  onOpenImplant,
  onOpenBiopsy,
  onOpenAligner,
  onOpenOrthoTmj,
  refreshTrigger = 0
}) {
  const [implantPlans, setImplantPlans] = useState([]);
  const [biopsyRecords, setBiopsyRecords] = useState([]);
  const [alignerPlans, setAlignerPlans] = useState([]);
  const [orthoAssessment, setOrthoAssessment] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    // Load from local cache first for instant zero-latency render
    try {
      const cachedImplants = localStorage.getItem(`dentia_implant_plans_${patientId}`);
      if (cachedImplants) setImplantPlans(JSON.parse(cachedImplants));

      const cachedBiopsies = localStorage.getItem(`dentia_biopsy_records_${patientId}`);
      if (cachedBiopsies) setBiopsyRecords(JSON.parse(cachedBiopsies));

      const cachedAligners = localStorage.getItem(`dentia_aligner_plans_${patientId}`);
      if (cachedAligners) setAlignerPlans(JSON.parse(cachedAligners));

      const cachedOrtho = localStorage.getItem(`dentia_ortho_tmj_${patientId}`);
      if (cachedOrtho) setOrthoAssessment(JSON.parse(cachedOrtho));
    } catch (e) {}

    // Load remote DB records asynchronously
    const fetchSpecialties = async () => {
      try {
        const [impRes, bioRes, aliRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/patients/${patientId}/implant-plans`),
          fetch(`${API_BASE_URL}/api/patients/${patientId}/biopsy-records`),
          fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners`)
        ]);

        if (impRes.status === 'fulfilled' && impRes.value.ok) {
          const data = await impRes.value.json();
          if (Array.isArray(data) && data.length > 0) {
            setImplantPlans(data);
            try { localStorage.setItem(`dentia_implant_plans_${patientId}`, JSON.stringify(data)); } catch (e) {}
          }
        }

        if (bioRes.status === 'fulfilled' && bioRes.value.ok) {
          const data = await bioRes.value.json();
          if (Array.isArray(data) && data.length > 0) {
            setBiopsyRecords(data);
            try { localStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(data)); } catch (e) {}
          }
        }

        if (aliRes.status === 'fulfilled' && aliRes.value.ok) {
          const data = await aliRes.value.json();
          if (Array.isArray(data) && data.length > 0) {
            setAlignerPlans(data);
            try { localStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(data)); } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Clinical dossier fetch error:', err);
      }
    };

    fetchSpecialties();
  }, [patientId, refreshTrigger]);

  const hasAnyRecords = implantPlans.length > 0 || biopsyRecords.length > 0 || alignerPlans.length > 0 || Boolean(orthoAssessment);

  if (!hasAnyRecords) {
    return null; // Don't take up space if no specialty sections have been saved yet
  }

  const latestImplant = implantPlans[0];
  const latestBiopsy = biopsyRecords[0];
  const latestAligner = alignerPlans[0];

  return (
    <div className="w-full bg-gradient-to-r from-white via-slate-50/90 to-[#F4F7FC] text-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-[0_2px_12px_rgba(16,36,75,0.06)] border border-slate-200/80 animate-fade-in transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#EAF0FC] border border-[#D4E2F9] flex items-center justify-center text-xs text-[#4A7CD2] shrink-0 shadow-2xs">
            📋
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h4 className="text-xs font-extrabold tracking-wide text-[#10244B] uppercase flex items-center gap-2 shrink-0">
              Patient Specialty Dossier & Active Treatment Protocols
            </h4>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
              Live EHR History
            </span>

            {/* Quick mini-summary pills when collapsed */}
            {collapsed && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {latestImplant && (
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                    <span>🔩</span>
                    <span>#{latestImplant.toothKey || latestImplant.toothNumber}: {latestImplant.implantBrand?.split('(')[0] || 'Implant'}</span>
                  </span>
                )}
                {latestBiopsy && (
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <span>🔬</span>
                    <span>{latestBiopsy.biopsyType} Biopsy</span>
                  </span>
                )}
                {latestAligner && (
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span>✨</span>
                    <span>Tray {latestAligner.currentStage}/{latestAligner.totalStages}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          {collapsed ? 'Expand Dossier ▼' : 'Minimize ▲'}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2.5 mt-2 border-t border-slate-200/60">
          
          {/* Card 1: Active Implant Protocol */}
          {latestImplant ? (
            <div 
              onClick={onOpenImplant}
              className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 hover:from-teal-50 hover:to-white border border-teal-200/80 hover:border-teal-400/80 rounded-xl p-3 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-teal-100/80 border border-teal-200 flex items-center justify-center text-sm shrink-0">
                    🔩
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-teal-950 truncate">
                        Implant Plan #{latestImplant.toothKey || latestImplant.toothNumber}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100/90 text-teal-800 border border-teal-300/80">
                        {latestImplant.planStatus || 'Planned'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                      {latestImplant.implantBrand?.split('(')[0] || 'Straumann'} · {latestImplant.implantLength}mm × Ø{latestImplant.implantDiameter}mm
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-teal-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span>Bone: <strong className="text-teal-900">{latestImplant.boneQuality || 'D2'}</strong></span>
                <span className={latestImplant.guidedSurgeryFlag ? 'text-teal-700 font-bold' : 'text-slate-500'}>
                  {latestImplant.guidedSurgeryFlag ? '✓ 3D Guided' : 'Freehand'}
                </span>
                <span className="text-teal-700 underline font-black group-hover:text-teal-900">Inspect ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenImplant}
              className="bg-slate-50/70 hover:bg-slate-100/70 border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔩</span>
                <span className="text-xs font-semibold text-slate-500">No Implant Planned</span>
              </div>
              <span className="text-[10px] font-bold text-[#4A7CD2] hover:underline">+ Formulate</span>
            </div>
          )}

          {/* Card 2: Active Biopsy & Oral Pathology */}
          {latestBiopsy ? (
            <div 
              onClick={onOpenBiopsy}
              className="bg-gradient-to-br from-purple-50/70 via-white to-slate-50 hover:from-purple-50 hover:to-white border border-purple-200/80 hover:border-purple-400/80 rounded-xl p-3 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-purple-100/80 border border-purple-200 flex items-center justify-center text-sm shrink-0">
                    🔬
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-purple-950 truncate">
                        {latestBiopsy.biopsyType} Biopsy
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100/90 text-purple-800 border border-purple-300/80">
                        {latestBiopsy.status || 'Specimen Sent'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                      {latestBiopsy.siteOfBiopsy || 'Soft Tissue Specimen'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-purple-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span className="truncate max-w-[150px]">Dx: <strong className="text-purple-900">{latestBiopsy.clinicalImpression || 'Pathology'}</strong></span>
                <span className="text-purple-700 underline font-black group-hover:text-purple-900 shrink-0">Lab Requisition ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenBiopsy}
              className="bg-slate-50/70 hover:bg-slate-100/70 border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔬</span>
                <span className="text-xs font-semibold text-slate-500">No Pathology Requisition</span>
              </div>
              <span className="text-[10px] font-bold text-purple-600 hover:underline">+ Requisition</span>
            </div>
          )}

          {/* Card 3: Clear Aligners Progress */}
          {latestAligner ? (
            <div 
              onClick={onOpenAligner}
              className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 hover:from-emerald-50 hover:to-white border border-emerald-200/80 hover:border-emerald-400/80 rounded-xl p-3 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-sm shrink-0">
                    ✨
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-emerald-950 truncate">
                        {latestAligner.alignerBrand?.split('(')[0] || 'Clear Aligners'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/90 text-emerald-800 border border-emerald-300/80">
                        Tray {latestAligner.currentStage}/{latestAligner.totalStages}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                      {latestAligner.wearSchedule?.split('(')[0] || '10 Days/Tray'} · {latestAligner.arch || 'Dual'} Arch
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-emerald-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span>{latestAligner.attachmentsRequired ? 'Attachments: YES' : 'No Attach'}</span>
                <span>{latestAligner.iprRequired ? 'IPR: YES' : 'No IPR'}</span>
                <span className="text-emerald-700 underline font-black group-hover:text-emerald-900">Open Tracker ➔</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenAligner}
              className="bg-slate-50/70 hover:bg-slate-100/70 border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">✨</span>
                <span className="text-xs font-semibold text-slate-500">No Clear Aligner Plan</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 hover:underline">+ Formulate</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

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
    <div className="w-full bg-gradient-to-r from-slate-900 via-[#10244B] to-[#1E3A8A] text-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-blue-500/30 animate-fade-in transition-all">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-xs">
            📋
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-2">
              <span>Patient Specialty Dossier & Active Treatment Protocols</span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live EHR History
              </span>
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] font-black text-blue-200 hover:text-white px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          {collapsed ? 'Expand Dossier ▼' : 'Minimize ▲'}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          
          {/* Card 1: Active Implant Protocol */}
          {latestImplant ? (
            <div 
              onClick={onOpenImplant}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 transition-all cursor-pointer hover:border-blue-400/60 group shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">🔩</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-blue-200 truncate">
                        Implant Plan #{latestImplant.toothKey || latestImplant.toothNumber}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        {latestImplant.planStatus || 'Planned'}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold text-white truncate mt-0.5">
                      {latestImplant.implantBrand?.split('(')[0] || 'Straumann'} · {latestImplant.implantLength}mm × Ø{latestImplant.implantDiameter}mm
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9.5px] font-bold text-blue-100">
                <span>Bone: {latestImplant.boneQuality || 'D2'}</span>
                <span className={latestImplant.guidedSurgeryFlag ? 'text-emerald-300' : 'text-slate-300'}>
                  {latestImplant.guidedSurgeryFlag ? '✓ 3D Guided' : 'Freehand'}
                </span>
                <span className="text-blue-200 underline font-black">Inspect</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenImplant}
              className="bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔩</span>
                <span className="text-xs font-bold text-slate-300">No Implant Planned</span>
              </div>
              <span className="text-[10px] font-black text-blue-300 hover:underline">+ Formulate</span>
            </div>
          )}

          {/* Card 2: Active Biopsy & Oral Pathology */}
          {latestBiopsy ? (
            <div 
              onClick={onOpenBiopsy}
              className="bg-purple-950/40 hover:bg-purple-950/60 backdrop-blur-sm border border-purple-400/30 rounded-xl p-2.5 transition-all cursor-pointer hover:border-purple-400/60 group shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">🔬</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-purple-200 truncate">
                        {latestBiopsy.biopsyType} Biopsy
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                        {latestBiopsy.status || 'Specimen Sent'}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold text-white truncate mt-0.5">
                      {latestBiopsy.siteOfBiopsy || 'Soft Tissue Specimen'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-purple-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>

              <div className="mt-2 pt-1.5 border-t border-purple-400/20 flex items-center justify-between text-[9.5px] font-bold text-purple-200">
                <span className="truncate max-w-[150px]">Dx: {latestBiopsy.clinicalImpression || 'Pathology'}</span>
                <span className="text-purple-300 underline font-black shrink-0">View Lab Requisition</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenBiopsy}
              className="bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔬</span>
                <span className="text-xs font-bold text-slate-300">No Pathology Requisition</span>
              </div>
              <span className="text-[10px] font-black text-purple-300 hover:underline">+ Requisition</span>
            </div>
          )}

          {/* Card 3: Clear Aligners Progress */}
          {latestAligner ? (
            <div 
              onClick={onOpenAligner}
              className="bg-emerald-950/40 hover:bg-emerald-950/60 backdrop-blur-sm border border-emerald-400/30 rounded-xl p-2.5 transition-all cursor-pointer hover:border-emerald-400/60 group shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">✨</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-emerald-200 truncate">
                        {latestAligner.alignerBrand?.split('(')[0] || 'Clear Aligners'}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                        Tray {latestAligner.currentStage}/{latestAligner.totalStages}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold text-white truncate mt-0.5">
                      {latestAligner.wearSchedule?.split('(')[0] || '10 Days/Tray'} · {latestAligner.arch || 'Dual'} Arch
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>

              <div className="mt-2 pt-1.5 border-t border-emerald-400/20 flex items-center justify-between text-[9.5px] font-bold text-emerald-200">
                <span>{latestAligner.attachmentsRequired ? 'Attachments: YES' : 'No Attachments'}</span>
                <span>{latestAligner.iprRequired ? 'IPR: YES' : 'No IPR'}</span>
                <span className="text-emerald-300 underline font-black">Open Tracker</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={onOpenAligner}
              className="bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">✨</span>
                <span className="text-xs font-bold text-slate-300">No Clear Aligner Plan</span>
              </div>
              <span className="text-[10px] font-black text-emerald-300 hover:underline">+ Formulate</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

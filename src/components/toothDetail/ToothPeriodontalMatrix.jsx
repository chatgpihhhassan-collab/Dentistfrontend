import React from 'react';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ToothPeriodontalMatrix({
  probingDepths,
  setProbingDepths,
  toothData,
  handleSaveObservation,
  patientId,
  tKey,
  isPediatric
}) {
  const isPocketPresent = Object.values(probingDepths).some(d => d >= 4);

  const updateDepth = (site, val) => {
    const updated = { ...probingDepths, [site]: val };
    setProbingDepths(updated);
    if (patientId && tKey) {
      try {
        localStorage.setItem(`dentist_perio_depths_patient_${patientId}_tooth_${tKey}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const applyPreset = (presetDepths) => {
    setProbingDepths(presetDepths);
    if (patientId && tKey) {
      try {
        localStorage.setItem(`dentist_perio_depths_patient_${patientId}_tooth_${tKey}`, JSON.stringify(presetDepths));
      } catch (e) {}
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4A7CD2]" />
          <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
            6-Point Periodontal Probing Depths (mm)
          </h3>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
          isPocketPresent 
            ? 'bg-rose-50 text-rose-700 border-rose-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isPocketPresent ? '⚠️ Periodontal Pocket Detected (≥4mm)' : '✓ Physiological Sulcus (1–3mm)'}
        </span>
      </div>

      {/* Facial / Buccal Measurements */}
      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 space-y-2">
        <p className="text-[11px] font-black text-slate-700 uppercase">Facial / Buccal Probing Depths</p>
        <div className="grid grid-cols-3 gap-3">
          {['mesiobuccal', 'midbuccal', 'distobuccal'].map(site => {
            const val = probingDepths[site] ?? 2;
            const isDeep = val >= 4;
            return (
              <div key={site} className={`p-3 rounded-xl border text-center ${isDeep ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] font-bold text-muted-text uppercase">{site.replace('buccal', ' Buccal')}</p>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={probingDepths[site] ?? 2}
                  onChange={(e) => updateDepth(site, parseInt(e.target.value) || 1)}
                  className={`w-16 mx-auto text-center text-lg font-black rounded-lg mt-1 p-1 border ${
                    isDeep 
                      ? 'text-rose-700 bg-white border-rose-300 ring-1 ring-rose-300' 
                      : 'text-[#4A7CD2] bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Lingual / Palatal Measurements */}
      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 space-y-2">
        <p className="text-[11px] font-black text-slate-700 uppercase">Lingual / Palatal Probing Depths</p>
        <div className="grid grid-cols-3 gap-3">
          {['mesiolingual', 'midlingual', 'distolingual'].map(site => {
            const val = probingDepths[site] ?? 2;
            const isDeep = val >= 4;
            return (
              <div key={site} className={`p-3 rounded-xl border text-center ${isDeep ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] font-bold text-muted-text uppercase">{site.replace('lingual', ' Lingual')}</p>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={probingDepths[site] ?? 2}
                  onChange={(e) => updateDepth(site, parseInt(e.target.value) || 1)}
                  className={`w-16 mx-auto text-center text-lg font-black rounded-lg mt-1 p-1 border ${
                    isDeep 
                      ? 'text-rose-700 bg-white border-rose-300 ring-1 ring-rose-300' 
                      : 'text-[#4A7CD2] bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Save to Database & Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset({ mesiobuccal: 2, midbuccal: 2, distobuccal: 3, mesiolingual: 2, midlingual: 2, distolingual: 3 })}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            ✓ Healthy Preset (2-3mm)
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ mesiobuccal: 6, midbuccal: 5, distobuccal: 7, mesiolingual: 6, midlingual: 4, distolingual: 6 })}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            ⚠️ Deep Pockets Preset (5-7mm)
          </button>
        </div>

        {handleSaveObservation && (
          <button
            type="button"
            onClick={() => {
              const maxD = Math.max(...Object.values(probingDepths));
              const isDeep = maxD >= 4;
              const statusToSave = isDeep ? `Periodontal Pocket (${maxD}mm)` : (toothData?.status || 'Healthy');
              const commentToSave = `Periodontal 6-Point Charting: Buccal [MB: ${probingDepths.mesiobuccal}mm, B: ${probingDepths.midbuccal}mm, DB: ${probingDepths.distobuccal}mm] · Lingual [ML: ${probingDepths.mesiolingual}mm, L: ${probingDepths.midlingual}mm, DL: ${probingDepths.distolingual}mm] · Maximum Pocket: ${maxD}mm`;
              
              if (patientId && tKey) {
                try {
                  localStorage.setItem(`dentist_perio_depths_patient_${patientId}_tooth_${tKey}`, JSON.stringify(probingDepths));
                } catch (e) {}
              }
              handleSaveObservation(statusToSave, commentToSave, isDeep ? '#E0665A' : undefined);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-black hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            💾 Save Probing to DB
          </button>
        )}
      </div>

      {/* Radiographic Alveolar Bone Loss & Furcation Alert */}
      {((toothData?.status || '') + ' ' + (toothData?.comments || '')).toLowerCase().includes('bone loss') && (
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-black text-rose-800 uppercase tracking-wide">
              Radiographic Finding: Moderate–Severe Alveolar Bone Loss (CDT D0180 / D4341)
            </span>
          </div>
          <p className="text-[11px] text-rose-700 leading-relaxed">
            Periapical radiograph indicates crestal alveolar resorption extending into the anatomical root furcation. Probing depths of 5–7mm confirmed on buccal and interproximal sites. Indicated for quadrant Scaling & Root Planing (SRP) and subgingival antimicrobial debridement.
          </p>
        </div>
      )}

      {/* Periodontal Clinical Guidelines */}
      <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-[#1D4ED8] space-y-1">
        <span className="font-black text-[#1E40AF]">AAP Periodontal Classification Guidance:</span>
        <p className="text-[11px] text-slate-700">
          • <strong>1–3mm:</strong> Clinically healthy gingival sulcus; regular maintenance & prophylaxis indicated.<br/>
          • <strong>4–5mm:</strong> Early–moderate periodontitis (Gingivitis with pocket formation); localized debridement indicated.<br/>
          • <strong>≥6mm:</strong> Advanced chronic periodontitis with clinical attachment loss; Scaling & Root Planing (SRP D4341) indicated.
        </p>
      </div>
    </div>
  );
}

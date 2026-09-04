import React from 'react';
import { Layers } from 'lucide-react';
import ToothCrossSectionDiagram from './ToothCrossSectionDiagram';

export default function ToothMultiSurfaceMatrix({
  patientId,
  isPediatric,
  tNum,
  tKey,
  surfaceData,
  activePaletteItem,
  setActivePaletteItem,
  handleToggleZone,
  handleApplyAll5Zones,
  handleClearAllZones,
  toothData,
  affectedZone = ''
}) {
  const surfaceList = [
    { key: 'O', name: 'Occlusal (O)', desc: 'Central masticatory fissure table' },
    { key: 'M', name: 'Mesial (M)', desc: 'Anterior interproximal contact' },
    { key: 'D', name: 'Distal (D)', desc: 'Posterior interproximal contact' },
    { key: 'B', name: 'Buccal / Facial (B)', desc: 'Cheek-facing enamel convex' },
    { key: 'L', name: 'Lingual / Palatal (L)', desc: 'Tongue-facing cingulum wall' },
    { key: 'Class V', name: 'Cervical / Class V', desc: 'Gingival cementoenamel junction (CEJ)' }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 5-Surface Cross-Section Box */}
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

      {/* Surface-by-Surface Descriptive Grid */}
      <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#4A7CD2]" />
          Surface Anatomical Status Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {surfaceList.map((s, idx) => {
            const rawVal = surfaceData[s.key];
            const isAff = (rawVal && rawVal !== 'Healthy' && rawVal !== 'Sound') || affectedZone.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]);
            return (
              <div key={idx} className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between">
                <div>
                  <p className="text-xs font-black text-dark-slate">{s.name}</p>
                  <p className="text-[10px] font-semibold text-muted-text mt-0.5">{s.desc}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                  isAff
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isAff ? (rawVal || 'Affected') : 'Sound'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

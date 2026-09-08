import React from 'react';
import { Layers, CheckCircle2, Check } from 'lucide-react';

export default function ToothCrossSectionDiagram({
  patientId,
  isPediatric,
  tNum,
  tKey,
  surfaceData = {},
  activePaletteItem,
  setActivePaletteItem,
  handleToggleZone,
  handleApplyAll5Zones,
  handleClearAllZones,
  toothData
}) {
  const isRightArch = isPediatric 
    ? ['A','B','C','D','E','P','Q','R','S','T'].includes(String(tKey).toUpperCase())
    : (tNum <= 8 || (tNum >= 25 && tNum <= 32));
  const leftKey = isRightArch ? 'D' : 'M';
  const rightKey = isRightArch ? 'M' : 'D';

  const getZoneFill = (zoneKey) => {
    const raw = (surfaceData[zoneKey] || 'Healthy').toLowerCase();
    if (raw === 'healthy' || raw === 'normal / healthy' || raw === 'sound' || raw === 'intact') {
      return '#F8FAFC';
    }
    if (raw.includes('bone loss') || raw.includes('periodont') || raw.includes('furcation') || raw.includes('recession')) {
      return '#E0665A';
    }
    if (raw.includes('resorption') || raw.includes('cyst')) {
      return '#8B5CF6';
    }
    if (raw.includes('attrition') || raw.includes('wear') || raw.includes('erosion') || raw.includes('crack') || raw.includes('gic')) {
      return '#F59E0B';
    }
    if (raw.includes('sensitivity') || raw.includes('exposed root')) {
      return '#3B82F6';
    }
    if (raw.includes('clean') || raw.includes('scaling') || raw.includes('calculus') || raw.includes('tartar') || raw.includes('plaque') || raw.includes('prophylaxis')) {
      return '#3B82F6';
    }
    if (raw.includes('implant')) {
      return '#0E8A80';
    }
    if (raw.includes('crown') || raw.includes('zirconia') || raw.includes('pfm') || raw.includes('gold')) {
      return '#D97706';
    }
    if (raw.includes('caries') || raw.includes('decay') || raw.includes('cavity') || raw.includes('ecc') || raw.includes('abscess')) {
      return '#EF4444';
    }
    if (raw.includes('composite') || raw.includes('resin') || raw.includes('strip crown')) {
      return '#2563EB';
    }
    if (raw.includes('amalgam') || raw.includes('ssc') || raw.includes('stainless')) {
      return '#64748B';
    }
    if (raw.includes('root canal') || /\brct\b/i.test(raw) || raw.includes('pulpotomy') || raw.includes('mta') || (raw.includes('endo') && !raw.includes('endosseous'))) {
      return '#7C3AED';
    }
    if (raw.includes('space')) {
      return '#93C5FD';
    }
    if (raw.includes('fluoride') || raw.includes('varnish') || raw.includes('sealant')) {
      return '#06B6D4';
    }
    if (raw.includes('miss') || raw.includes('extract') || raw.includes('exfoliat') || raw.includes('absent')) {
      return '#CBD5E1';
    }
    return '#2563EB';
  };

  const getZoneStroke = (zoneKey) => {
    const raw = (surfaceData[zoneKey] || 'Healthy').toLowerCase();
    if (raw === 'healthy' || raw === 'normal / healthy' || raw === 'sound' || raw === 'intact') {
      return '#CBD5E1';
    }
    if (raw.includes('implant')) {
      return '#0F766E';
    }
    if (raw.includes('clean') || raw.includes('scaling') || raw.includes('calculus') || raw.includes('tartar') || raw.includes('plaque')) {
      return '#1D4ED8';
    }
    if (raw.includes('caries') || raw.includes('decay') || raw.includes('cavity') || raw.includes('ecc')) {
      return '#991B1B';
    }
    if (raw.includes('composite') || raw.includes('resin')) {
      return '#1D4ED8';
    }
    if (raw.includes('amalgam') || raw.includes('ssc')) {
      return '#334155';
    }
    if (raw.includes('root canal') || /\brct\b/i.test(raw) || raw.includes('pulpotomy') || raw.includes('mta') || (raw.includes('endo') && !raw.includes('endosseous'))) {
      return '#4C1D95';
    }
    if (raw.includes('miss') || raw.includes('extract') || raw.includes('absent')) {
      return '#94A3B8';
    }
    return '#1D4ED8';
  };

  const getZoneTextFill = (zoneKey) => {
    const raw = (surfaceData[zoneKey] || 'Healthy').toLowerCase();
    if (raw === 'healthy' || raw === 'normal / healthy' || raw === 'sound' || raw === 'intact') {
      return '#64748B';
    }
    if (raw.includes('miss') || raw.includes('extract')) {
      return '#475569';
    }
    return '#FFFFFF';
  };

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-light-teal/20 pb-2.5">
        <div>
          <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#4A7CD2]" />
            5 Surface Zones (O, M, D, B, L) Cross-Section Diagram
          </h3>
          <p className="text-[10px] font-bold text-muted-text mt-0.5">
            Standard Anatomical Dental Odontogram 5-Surface Cross-Section Box · Click any zone to apply condition
          </p>
        </div>

        {/* Live DB indicator */}
        <div className="relative group flex items-center">
          <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center cursor-pointer shadow-2xs transition-transform hover:scale-110">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/30" />
          </div>
          <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-1 bg-[#10244B] text-white text-[10px] font-semibold px-3 py-2 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none border border-cyan-400/30 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live DB Connected</span>
            </div>
            <span className="text-slate-300 text-[9.5px]">
              Surface zones synced with Patient #{patientId} EHR Database (Real-Time)
            </span>
          </div>
        </div>
      </div>

      {/* Main 5-Zone Diagram & Palette Area */}
      <div className="bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF]/50 rounded-2xl border border-light-teal/30 p-4 flex flex-wrap items-center justify-around gap-4">
        {/* Geometric 5-Zone Diagram */}
        <div className="flex flex-col items-center select-none">
          <span className="text-[10.5px] font-black text-slate-700 uppercase mb-1.5 tracking-wider">
            {tNum <= 16 ? 'B (BUCCAL)' : 'B (FACIAL / BUCCAL)'}
          </span>

          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-black text-slate-700 w-16 text-right">
              {leftKey === 'D' ? 'D (Distal)' : 'M (Mesial)'}
            </span>

            {/* 5-Zone Trapezoid Box SVG */}
            <svg width="130" height="130" viewBox="0 0 100 100" className="filter drop-shadow-md cursor-pointer">
              {/* Top (B - Buccal) */}
              <polygon
                points="10,10 90,10 70,30 30,30"
                fill={getZoneFill('B')}
                stroke={getZoneStroke('B')}
                strokeWidth="1.6"
                className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                onClick={() => handleToggleZone('B')}
              >
                <title>{`Buccal (B) Surface: ${surfaceData['B'] || 'Healthy'}`}</title>
              </polygon>
              <text x="50" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill('B')} pointerEvents="none">
                B
              </text>

              {/* Bottom (L - Lingual/Palatal) */}
              <polygon
                points="30,70 70,70 90,90 10,90"
                fill={getZoneFill('L')}
                stroke={getZoneStroke('L')}
                strokeWidth="1.6"
                className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                onClick={() => handleToggleZone('L')}
              >
                <title>{`Lingual/Palatal (L) Surface: ${surfaceData['L'] || 'Healthy'}`}</title>
              </polygon>
              <text x="50" y="83" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill('L')} pointerEvents="none">
                L
              </text>

              {/* Left Zone */}
              <polygon
                points="10,10 30,30 30,70 10,90"
                fill={getZoneFill(leftKey)}
                stroke={getZoneStroke(leftKey)}
                strokeWidth="1.6"
                className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                onClick={() => handleToggleZone(leftKey)}
              >
                <title>{`${leftKey} Surface: ${surfaceData[leftKey] || 'Healthy'}`}</title>
              </polygon>
              <text x="21" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill(leftKey)} pointerEvents="none">
                {leftKey}
              </text>

              {/* Right Zone */}
              <polygon
                points="70,30 90,10 90,90 70,70"
                fill={getZoneFill(rightKey)}
                stroke={getZoneStroke(rightKey)}
                strokeWidth="1.6"
                className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                onClick={() => handleToggleZone(rightKey)}
              >
                <title>{`${rightKey} Surface: ${surfaceData[rightKey] || 'Healthy'}`}</title>
              </polygon>
              <text x="79" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill(rightKey)} pointerEvents="none">
                {rightKey}
              </text>

              {/* Center (O - Occlusal) */}
              <polygon
                points="30,30 70,30 70,70 30,70"
                fill={getZoneFill('O')}
                stroke={getZoneStroke('O')}
                strokeWidth="2"
                className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                onClick={() => handleToggleZone('O')}
              >
                <title>{`Occlusal (O) Surface: ${surfaceData['O'] || 'Healthy'}`}</title>
              </polygon>
              <text x="50" y="54" textAnchor="middle" fontSize="10" fontWeight="900" fill={getZoneTextFill('O')} pointerEvents="none">
                O
              </text>
            </svg>

            <span className="text-[10.5px] font-black text-slate-700 w-16 text-left">
              {rightKey === 'M' ? 'M (Mesial)' : 'D (Distal)'}
            </span>
          </div>

          <span className="text-[10.5px] font-black text-slate-700 uppercase mt-1.5 tracking-wider">
            {tNum <= 16 ? 'L (PALATAL)' : 'L (LINGUAL)'}
          </span>
        </div>

        {/* Palette & Batch Actions Card */}
        <div className="space-y-3 min-w-[220px]">
          <div className="bg-white rounded-2xl border border-light-teal/40 p-3 shadow-2xs space-y-1">
            <span className="text-[9.5px] font-bold text-muted-text uppercase block">
              Active Palette Item:
            </span>
            <div className="flex items-center gap-2">
              {(() => {
                const cleanPal = (activePaletteItem || 'Healthy')
                  .replace(/(—\s*All 5 Surfaces.*)+/gi, '')
                  .replace(/(—\s*[OMDBL\s(),]+.*)+/gi, '')
                  .trim() || 'Healthy';

                return (
                  <span className={`text-sm font-black ${
                    cleanPal === 'Healthy' 
                      ? 'text-emerald-600' 
                      : cleanPal.includes('Clean') || cleanPal.includes('Scaling')
                      ? 'text-blue-600'
                      : cleanPal === 'Caries (Decay)' 
                      ? 'text-rose-600' 
                      : cleanPal.includes('Ortho') || cleanPal.includes('Malocclusion')
                      ? 'text-[#2563EB]'
                      : cleanPal.includes('Crown') || cleanPal.includes('Zirconia')
                      ? 'text-amber-600'
                      : cleanPal.includes('Root Canal') || cleanPal.includes('Pulpotomy')
                      ? 'text-purple-600'
                      : cleanPal.includes('Extracted') || cleanPal.includes('Missing')
                      ? 'text-slate-600'
                      : 'text-[#2563EB]'
                  }`}>
                    {cleanPal}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Palette Selector Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {(isPediatric 
              ? ['Healthy', 'Cleaning Needed', 'Ortho Malocclusion', 'Caries (Decay)', 'Composite Filling', 'Pulpotomy (MTA)', 'Stainless Steel Crown (SSC)', 'Space Maintainer', 'Extracted / Missing'] 
              : ['Healthy', 'Cleaning Needed', 'Ortho Malocclusion', 'Crown (Zirconia / PFM)', 'Caries (Decay)', 'Composite Filling', 'Amalgam', 'Root Canal (RCT)', 'Dental Implant', 'Extracted / Missing']
            ).map(pal => {
              const isSel = activePaletteItem === pal;
              const isH = pal === 'Healthy';
              const isClean = pal.includes('Clean') || pal.includes('Scaling');
              const isOrtho = pal.includes('Ortho') || pal.includes('Malocclusion');
              const isCrown = pal.includes('Crown') || pal.includes('Zirconia');
              const isCar = pal.includes('Caries') || pal.includes('Decay');
              const isComp = pal.includes('Composite');
              const isAmal = pal.includes('Amalgam') || pal.includes('SSC');
              const isRct = pal.includes('Root Canal') || pal.includes('Pulpotomy');
              const isImp = pal.includes('Implant');
              const isExt = pal.includes('Extracted') || pal.includes('Missing');

              let activeClass = 'bg-[#4A7CD2] text-white border-[#4A7CD2] font-black shadow-xs';
              if (isH) activeClass = 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs';
              else if (isClean) activeClass = 'bg-blue-600 text-white border-blue-600 font-black shadow-xs';
              else if (isOrtho) activeClass = 'bg-[#2563EB] text-white border-[#2563EB] font-black shadow-xs';
              else if (isCrown) activeClass = 'bg-amber-600 text-white border-amber-600 font-black shadow-xs';
              else if (isCar) activeClass = 'bg-rose-600 text-white border-rose-600 font-black shadow-xs';
              else if (isComp) activeClass = 'bg-[#2563EB] text-white border-[#2563EB] font-black shadow-xs';
              else if (isAmal) activeClass = 'bg-slate-700 text-white border-slate-700 font-black shadow-xs';
              else if (isRct) activeClass = 'bg-purple-700 text-white border-purple-700 font-black shadow-xs';
              else if (isImp) activeClass = 'bg-teal-700 text-white border-teal-700 font-black shadow-xs';
              else if (isExt) activeClass = 'bg-slate-600 text-white border-slate-600 font-black shadow-xs';

              return (
                <button
                  key={pal}
                  type="button"
                  onClick={() => setActivePaletteItem(pal)}
                  className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSel
                      ? activeClass
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pal}
                </button>
              );
            })}
          </div>

          {/* All 5 Zones & Clear Zones Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleApplyAll5Zones}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-black py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              All 5 Zones
            </button>
            <button
              onClick={handleClearAllZones}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
            >
              Clear Zones
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Condition Diagnoses Breakdown */}
      <div className="bg-white rounded-2xl border border-light-teal/30 p-3.5 space-y-2">
        <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
          Active Clinical Findings Breakdown
        </h3>
        <div className="flex flex-wrap gap-2">
          {(toothData?.status || 'Healthy').split(/[·•,]/).map((item, idx) => {
            const clean = item.trim();
            if (!clean) return null;
            const isC = clean.toLowerCase().includes('caries') || clean.toLowerCase().includes('decay');
            const isR = clean.toLowerCase().includes('rct') || clean.toLowerCase().includes('root canal') || clean.toLowerCase().includes('endo') || clean.toLowerCase().includes('pulpotomy') || clean.toLowerCase().includes('already treated') || clean.toLowerCase().includes('treated');
            const isF = clean.toLowerCase().includes('fill') || clean.toLowerCase().includes('composite');
            const isExt = clean.toLowerCase().includes('miss') || clean.toLowerCase().includes('extract') || clean.toLowerCase().includes('absent');
            const isH = clean.toLowerCase() === 'healthy' || clean.toLowerCase() === 'sound';
            const isClean = clean.toLowerCase().includes('clean') || clean.toLowerCase().includes('calculus') || clean.toLowerCase().includes('scaling');

            let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
            if (isH) badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            else if (isClean) badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
            else if (isC) badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
            else if (isR) badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
            else if (isF) badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
            else if (isExt) badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';

            return (
              <div 
                key={idx} 
                className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs flex items-center gap-2 border ${badgeStyle}`}
              >
                <span>{clean}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

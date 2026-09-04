import React from 'react';

// ============================================================================
// 1. Maxilla (Upper Jaw - Teeth 1 to 16) Coordinate, Rotation & Scale Map
// ============================================================================
export const MAXILLA_COORDINATES = {
  1:  { left: "21.5%", top: "74.5%", rotate: "80deg",  width: "11%",   shape: 'molar',    name: 'Maxillary Right 3rd Molar' },
  2:  { left: "19.5%", top: "62%",   rotate: "65deg",  width: "11.5%", shape: 'molar',    name: 'Maxillary Right 2nd Molar' },
  3:  { left: "20.5%", top: "50%",   rotate: "50deg",  width: "11%",   shape: 'molar',    name: 'Maxillary Right 1st Molar' },
  4:  { left: "23.5%", top: "39.5%", rotate: "35deg",  width: "10%",   shape: 'premolar', name: 'Maxillary Right 2nd Premolar' },
  5:  { left: "28.5%", top: "30%",   rotate: "20deg",  width: "9.5%",  shape: 'premolar', name: 'Maxillary Right 1st Premolar' },
  6:  { left: "34.5%", top: "22%",   rotate: "10deg",  width: "8.5%",  shape: 'canine',   name: 'Maxillary Right Canine' },
  7:  { left: "42.5%", top: "15.5%", rotate: "5deg",   width: "7.5%",  shape: 'incisor',  name: 'Maxillary Right Lateral Incisor' },
  8:  { left: "48.5%", top: "13.5%", rotate: "0deg",   width: "7%",    shape: 'incisor',  name: 'Maxillary Right Central Incisor' },
  9:  { left: "53.5%", top: "13.5%", rotate: "0deg",   width: "7%",    shape: 'incisor',  name: 'Maxillary Left Central Incisor' },
  10: { left: "59.5%", top: "15.5%", rotate: "-5deg",  width: "7.5%",  shape: 'incisor',  name: 'Maxillary Left Lateral Incisor' },
  11: { left: "67.5%", top: "22%",   rotate: "-10deg", width: "8.5%",  shape: 'canine',   name: 'Maxillary Left Canine' },
  12: { left: "73.5%", top: "30%",   rotate: "-20deg", width: "9.5%",  shape: 'premolar', name: 'Maxillary Left 1st Premolar' },
  13: { left: "78.5%", top: "39.5%", rotate: "-35deg", width: "10%",   shape: 'premolar', name: 'Maxillary Left 2nd Premolar' },
  14: { left: "81.5%", top: "50%",   rotate: "-50deg", width: "11%",   shape: 'molar',    name: 'Maxillary Left 1st Molar' },
  15: { left: "82.5%", top: "62%",   rotate: "-65deg", width: "11.5%", shape: 'molar',    name: 'Maxillary Left 2nd Molar' },
  16: { left: "80.5%", top: "74.5%", rotate: "-80deg", width: "11%",   shape: 'molar',    name: 'Maxillary Left 3rd Molar' }
};

// ============================================================================
// 2. Mandible (Lower Jaw - Teeth 17 to 32) Coordinate, Rotation & Scale Map
// ============================================================================
export const MANDIBLE_COORDINATES = {
  17: { left: "20%",   top: "76.5%", rotate: "85deg",  width: "10.5%", shape: 'molar',    name: 'Mandibular Left 3rd Molar' },
  18: { left: "18.5%", top: "64.5%", rotate: "70deg",  width: "11%",   shape: 'molar',    name: 'Mandibular Left 2nd Molar' },
  19: { left: "19.5%", top: "53%",   rotate: "55deg",  width: "11%",   shape: 'molar',    name: 'Mandibular Left 1st Molar' },
  20: { left: "22.5%", top: "42.5%", rotate: "40deg",  width: "10%",   shape: 'premolar', name: 'Mandibular Left 2nd Premolar' },
  21: { left: "26.5%", top: "33%",   rotate: "25deg",  width: "9%",    shape: 'premolar', name: 'Mandibular Left 1st Premolar' },
  22: { left: "32.5%", top: "25%",   rotate: "15deg",  width: "8%",    shape: 'canine',   name: 'Mandibular Left Canine' },
  23: { left: "40.5%", top: "18%",   rotate: "5deg",   width: "7%",    shape: 'incisor',  name: 'Mandibular Left Lateral Incisor' },
  24: { left: "47.5%", top: "15.5%", rotate: "0deg",   width: "6.5%",  shape: 'incisor',  name: 'Mandibular Left Central Incisor' },
  25: { left: "53.5%", top: "15.5%", rotate: "0deg",   width: "6.5%",  shape: 'incisor',  name: 'Mandibular Right Central Incisor' },
  26: { left: "60.5%", top: "18%",   rotate: "-5deg",  width: "7%",    shape: 'incisor',  name: 'Mandibular Right Lateral Incisor' },
  27: { left: "68.5%", top: "25%",   rotate: "-15deg", width: "8%",    shape: 'canine',   name: 'Mandibular Right Canine' },
  28: { left: "74.5%", top: "33%",   rotate: "-25deg", width: "9%",    shape: 'premolar', name: 'Mandibular Right 1st Premolar' },
  29: { left: "78.5%", top: "42.5%", rotate: "-40deg", width: "10%",   shape: 'premolar', name: 'Mandibular Right 2nd Premolar' },
  30: { left: "81.5%", top: "53%",   rotate: "-55deg", width: "11%",   shape: 'molar',    name: 'Mandibular Right 1st Molar' },
  31: { left: "82.5%", top: "64.5%", rotate: "-70deg", width: "11%",   shape: 'molar',    name: 'Mandibular Right 2nd Molar' },
  32: { left: "81%",   top: "76.5%", rotate: "-85deg", width: "10.5%", shape: 'molar',    name: 'Mandibular Right 3rd Molar' }
};

/**
 * InteractiveJawArch Component
 * Renders a high-resolution empty jaw template with responsive, perfectly aligned teeth overlays.
 */
export default function InteractiveJawArch({
  jawType = 'maxilla', // 'maxilla' | 'mandible'
  teethState = [],
  highlightedTeeth = [],
  onToothClick = () => {},
  renderToothContent = null,
  customImage = null,
  className = ""
}) {
  const isMaxilla = jawType === 'maxilla';
  const coordsMap = isMaxilla ? MAXILLA_COORDINATES : MANDIBLE_COORDINATES;
  const bgImage = customImage || (isMaxilla ? '/empty_maxilla_jaw.jpg' : '/empty_mandible_jaw.jpg');
  const jawTitle = isMaxilla ? 'MAXILLA (UPPER JAW - 16 TEETH)' : 'MANDIBLE (LOWER JAW - 16 TEETH)';

  return (
    <div className={`relative w-full aspect-square max-w-[440px] mx-auto rounded-3xl overflow-hidden border border-slate-200/70 bg-white shadow-xs select-none p-2 ${className}`}>
      {/* 1. Background Empty Jaw Template */}
      <img
        src={bgImage}
        alt={jawTitle}
        className="w-full h-full object-contain filter contrast-105 pointer-events-none"
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {/* 2. Badge Indicator */}
      <div className="absolute top-2.5 left-3.5 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs pointer-events-none">
        <span className="text-[9.5px] font-black text-dark-slate uppercase tracking-wider">
          {jawTitle}
        </span>
      </div>

      {/* 3. Interactive Sockets & Teeth Overlay Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        {Object.entries(coordsMap).map(([idStr, coord]) => {
          const toothNum = parseInt(idStr, 10);
          const toothData = teethState.find(
            (t) => parseInt(t.toothNumber ?? t.ToothNumber, 10) === toothNum
          );
          const status = toothData?.status || toothData?.conditionStatus || 'Healthy';
          const sLower = status.toLowerCase();

          const isDecay = sLower.includes('decay') || sLower.includes('damag') || sLower === 'cavity' || sLower.includes('keera');
          const isFilled = sLower.includes('treat') || sLower.includes('prosthesis') || sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('filling') || sLower.includes('composite');
          const isRCT = sLower.includes('canal') || sLower.includes('root') || sLower === 'yellow';
          const isMissing = sLower.includes('miss') || sLower.includes('extract');
          const isHighlighted = highlightedTeeth.includes(toothNum);

          return (
            <div
              key={toothNum}
              onClick={() => onToothClick(toothNum, status, coord)}
              style={{
                position: 'absolute',
                left: coord.left,
                top: coord.top,
                width: coord.width,
                aspectRatio: '1 / 1',
                /* Strict Rule 1 & 2: Center anchor + Dynamic Arch Rotation */
                transform: `translate(-50%, -50%) rotate(${coord.rotate})`,
                transformOrigin: 'center center'
              }}
              className={`group flex items-center justify-center cursor-pointer transition-transform duration-250 z-10 ${
                isHighlighted ? 'scale-130 z-30' : 'hover:scale-115'
              }`}
              title={`Tooth #${toothNum} (${coord.shape}) - ${status}`}
            >
              {/* Radar pulse ripple on active highlight */}
              {isHighlighted && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-cyan-400/35 animate-tooth-radar pointer-events-none scale-140" />
              )}

              {/* Tooth Content or Default Vector Render */}
              {renderToothContent ? (
                renderToothContent({ toothNum, coord, status, isHighlighted, isMissing, isDecay, isFilled, isRCT })
              ) : !isMissing ? (
                /* Default Occlusal Top-Down Tooth Surface */
                <div className="w-full h-full relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 40 40"
                    className={`w-full h-full dynamic-tooth ${
                      isHighlighted
                        ? 'drop-shadow-[0_0_10px_rgba(0,210,255,0.9)]'
                        : isDecay
                        ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                        : isFilled
                        ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.65)]'
                        : isRCT
                        ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.65)]'
                        : 'drop-shadow-xs'
                    }`}
                  >
                    <defs>
                      <linearGradient id={`tooth-grad-${toothNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="60%" stopColor="#F8FAFC" />
                        <stop offset="100%" stopColor={isHighlighted ? '#BAE6FD' : isFilled ? '#DBEAFE' : isDecay ? '#FEE2E2' : '#CBD5E1'} />
                      </linearGradient>
                    </defs>

                    {/* Shape Geometry */}
                    {coord.shape === 'molar' ? (
                      <rect x="5" y="5" width="30" height="30" rx="8" fill={`url(#tooth-grad-${toothNum})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth="1" />
                    ) : coord.shape === 'premolar' ? (
                      <ellipse cx="20" cy="20" rx="13" ry="15" fill={`url(#tooth-grad-${toothNum})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth="1" />
                    ) : coord.shape === 'canine' ? (
                      <path d="M 20 7 C 28 12, 31 22, 27 29 C 23 35, 17 35, 13 29 C 9 22, 12 12, 20 7 Z" fill={`url(#tooth-grad-${toothNum})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth="1" />
                    ) : (
                      <rect x="8" y="11" width="24" height="18" rx="6" fill={`url(#tooth-grad-${toothNum})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth="1" />
                    )}

                    {/* Pathology Overlays */}
                    {isDecay && (
                      <circle cx="20" cy="20" r="5" fill="#78350F" stroke="#EF4444" strokeWidth="1.2" />
                    )}
                    {isFilled && (
                      <circle cx="20" cy="20" r="4.5" fill="#60A5FA" stroke="#2563EB" strokeWidth="1" />
                    )}
                    {isRCT && (
                      <circle cx="20" cy="20" r="4" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                    )}
                  </svg>
                </div>
              ) : (
                /* Missing / Extracted Socket Indicator */
                <div className="w-4 h-4 rounded-full border border-dashed border-rose-400/50 bg-rose-500/10 flex items-center justify-center">
                  <span className="text-[6.5px] font-black text-rose-500">✕</span>
                </div>
              )}

              {/* Tooth Number Pill (visible on hover / highlight) */}
              <div
                style={{
                  /* Counter-rotate badge so numbers always stay upright and legible */
                  transform: `rotate(-${coord.rotate})`
                }}
                className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[7.5px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border transition-opacity duration-200 pointer-events-none ${
                  isHighlighted
                    ? 'bg-cyan-500 text-white border-cyan-300 opacity-100 ring-1 ring-cyan-300'
                    : isFilled
                    ? 'bg-blue-600 text-white border-blue-300 opacity-100'
                    : isDecay
                    ? 'bg-rose-600 text-white border-rose-300 opacity-100'
                    : isRCT
                    ? 'bg-amber-500 text-white border-amber-300 opacity-100'
                    : 'bg-white/95 text-slate-700 border-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              >
                {toothNum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

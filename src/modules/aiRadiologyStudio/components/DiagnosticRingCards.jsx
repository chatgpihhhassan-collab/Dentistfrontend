import React from 'react';

// Single Animated SVG Progress Ring Component
const CircularRing = ({ percentage, color = '#3B82F6', size = 52, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[12px] font-extrabold text-slate-800 tracking-tight">
        {percentage}%
      </span>
    </div>
  );
};

// Anatomical Tooth Silhouette Icon
const MiniToothIcon = () => (
  <svg className="w-7 h-9 text-slate-400 shrink-0 drop-shadow-xs" viewBox="0 0 32 40" fill="none">
    <path
      d="M8 6C8 3 10 2 13 2C15 2 16 3.5 16 3.5C16 3.5 17 2 19 2C22 2 24 3 24 6C24 10 24 14 24 18C24 23 23 28 22 34C21.5 37 19.5 38 18 38C17 38 16.5 36.5 16.5 34C16.5 31 16.5 25 16 23C15.5 25 15.5 31 15.5 34C15.5 36.5 15 38 14 38C12.5 38 10.5 37 10 34C9 28 8 23 8 18C8 14 8 10 8 6Z"
      fill="url(#toothCardGradDynamic)"
      stroke="#CBD5E1"
      strokeWidth="1.5"
    />
    <defs>
      <linearGradient id="toothCardGradDynamic" x1="8" y1="2" x2="24" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="0.6" stopColor="#F1F5F9" />
        <stop offset="1" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>
  </svg>
);

export default function DiagnosticRingCards({ findings = [], activeTooth, onSelectTooth }) {
  // If findings is provided from real DB, use them; otherwise fallback gracefully
  const cards = (findings && findings.length > 0)
    ? findings.slice(0, 4).map((f) => ({
        id: `tooth-${f.toothNumber}`,
        toothNo: String(f.toothNumber),
        position: f.position?.arch || (parseInt(f.toothNumber, 10) <= 16 ? 'Upper' : 'Lower'),
        pct: f.ringPct || 65,
        ringColor: f.ringColor || '#3B82F6',
        headline: `${f.position?.arch || (parseInt(f.toothNumber, 10) <= 16 ? 'Upper' : 'Lower')} Panel Tooth No ${f.toothNumber} Need`,
        actionHighlight: f.label || 'Treatment Needed',
        badgeColor: f.labelColor || 'text-blue-600'
      }))
    : [
        {
          id: 'healthy-all',
          toothNo: 'All',
          position: 'Full Arch',
          pct: 100,
          ringColor: '#10B981',
          headline: 'Full Dentition Survey Completed',
          actionHighlight: 'All Sound',
          badgeColor: 'text-emerald-600'
        }
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 w-full">
      {cards.map((card) => {
        const isSelected = activeTooth === card.toothNo;

        return (
          <div
            key={card.id}
            onClick={() => onSelectTooth && onSelectTooth(card.toothNo)}
            className={`bg-white rounded-2xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between select-none shadow-2xs hover:shadow-md ${
              isSelected
                ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/20 shadow-md'
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            {/* Top row: Tooth Icon + Details + Ring Gauge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <MiniToothIcon />
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                    Tooth No
                  </div>
                  <div className="text-[18px] font-black text-slate-900 leading-tight">
                    {card.toothNo}
                  </div>
                </div>
                <div className="ml-2 pl-2 border-l border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                    Position
                  </div>
                  <div className="text-[13px] font-bold text-slate-700 leading-tight">
                    {card.position}
                  </div>
                </div>
              </div>

              {/* Radial Ring */}
              <CircularRing
                percentage={card.pct}
                color={card.ringColor}
              />
            </div>

            {/* Bottom Row: Detailed Clinical Finding */}
            <div className="mt-3 pt-2 border-t border-slate-50 text-[11.5px] text-slate-500 leading-snug">
              <span>{card.headline} To Be </span>
              <strong className={`font-black ${card.badgeColor}`}>
                {card.actionHighlight}
              </strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

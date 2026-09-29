import React from 'react';

// Single Animated SVG Progress Ring Component
const CircularRing = ({ percentage, color = '#3B82F6', gradientId, startColor, endColor, size = 52, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * percentage) / 100;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {gradientId && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor || color} />
              <stop offset="100%" stopColor={endColor || color} />
            </linearGradient>
          </defs>
        )}
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientId ? `url(#${gradientId})` : color}
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

// Anatomical Tooth Silhouette Icon for the cards
const MiniToothIcon = () => (
  <svg className="w-7 h-9 text-slate-400 shrink-0 drop-shadow-xs" viewBox="0 0 32 40" fill="none">
    <path
      d="M8 6C8 3 10 2 13 2C15 2 16 3.5 16 3.5C16 3.5 17 2 19 2C22 2 24 3 24 6C24 10 24 14 24 18C24 23 23 28 22 34C21.5 37 19.5 38 18 38C17 38 16.5 36.5 16.5 34C16.5 31 16.5 25 16 23C15.5 25 15.5 31 15.5 34C15.5 36.5 15 38 14 38C12.5 38 10.5 37 10 34C9 28 8 23 8 18C8 14 8 10 8 6Z"
      fill="url(#toothCardGrad)"
      stroke="#CBD5E1"
      strokeWidth="1.5"
    />
    <defs>
      <linearGradient id="toothCardGrad" x1="8" y1="2" x2="24" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="0.6" stopColor="#F1F5F9" />
        <stop offset="1" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>
  </svg>
);

export default function DiagnosticRingCards({ findings, activeTooth, onSelectTooth }) {
  const cards = findings || [
    {
      id: '7.9',
      toothNo: '7.9',
      position: 'Upper',
      pct: 11,
      ringColor: '#F43F5E', // Red/Coral
      gradientId: 'grad11',
      startColor: '#FB7185',
      endColor: '#E11D48',
      headline: 'Upper Panel Tooth No 7.9 Need',
      actionHighlight: 'Implants',
      badgeColor: 'text-rose-600',
      conditionKey: 'implant'
    },
    {
      id: '12',
      toothNo: '12',
      position: 'Lower',
      pct: 23,
      ringColor: '#2563EB', // Electric Blue
      gradientId: 'grad23',
      startColor: '#60A5FA',
      endColor: '#1D4ED8',
      headline: 'Lower Panel Tooth No 12 Need',
      actionHighlight: 'Gingivitis',
      badgeColor: 'text-blue-600',
      conditionKey: 'gingivitis'
    },
    {
      id: '27',
      toothNo: '27',
      position: 'Upper',
      pct: 67,
      ringColor: '#06B6D4', // Cyan/Sky
      gradientId: 'grad67',
      startColor: '#38BDF8',
      endColor: '#0284C7',
      headline: 'Down Panel Tooth No 27 Need To',
      actionHighlight: 'Root Cavity',
      badgeColor: 'text-cyan-600',
      conditionKey: 'cavity'
    },
    {
      id: '6.17',
      toothNo: '6.17',
      position: 'Lower',
      pct: 76,
      ringColor: '#F59E0B', // Multi-Tone Gradient
      gradientId: 'grad76',
      startColor: '#2DD4BF',
      endColor: '#F43F5E',
      headline: 'Lower Panel Tooth No 6.17 Need',
      actionHighlight: 'Periodontitis',
      badgeColor: 'text-amber-600',
      conditionKey: 'periodontitis'
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
                gradientId={card.gradientId}
                startColor={card.startColor}
                endColor={card.endColor}
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

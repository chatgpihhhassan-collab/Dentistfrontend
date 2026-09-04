import React, { useMemo } from 'react';

// Status colors for premium layout
const STATUS_META = {
  'Healthy': { bg: 'bg-emerald-500', text: 'text-white', label: 'Healthy', border: 'border-emerald-200' },
  'Damaged / Decay': { bg: 'bg-red-500', text: 'text-white', label: 'Decay', border: 'border-red-200' },
  'Damaged/Decay': { bg: 'bg-red-500', text: 'text-white', label: 'Decay', border: 'border-red-200' },
  'Root Canal Needed': { bg: 'bg-amber-500', text: 'text-white', label: 'RCT', border: 'border-amber-200' },
  'Cleaning Needed': { bg: 'bg-blue-500', text: 'text-white', label: 'Clean', border: 'border-blue-200' },
  'Already Treated': { bg: 'bg-purple-500', text: 'text-white', label: 'Treated', border: 'border-purple-200' },
  'Missing / Extracted': { bg: 'bg-slate-400', text: 'text-white', label: 'Missing', border: 'border-slate-300' },
  'Missing': { bg: 'bg-slate-400', text: 'text-white', label: 'Missing', border: 'border-slate-300' }
};

export default function DentalChart({ teethState = [], onToothClick }) {
  const teethMap = useMemo(() => {
    const map = {};
    teethState.forEach((t) => {
      const num = t.toothNumber ?? t.tooth_number;
      if (num != null) map[num] = t;
    });
    return map;
  }, [teethState]);

  // Render teeth 1-16 (Upper Jaw) and 17-32 (Lower Jaw) in grid blocks
  const renderToothBlock = (number) => {
    const state = teethMap[number];
    const status = state?.status || state?.conditionStatus || 'Healthy';
    const meta = STATUS_META[status] || { bg: 'bg-slate-200', text: 'text-dark-slate', label: 'Healthy' };

    return (
      <div 
        key={number}
        onClick={() => onToothClick?.(number)}
        className="bg-white border border-light-teal/50 rounded-2xl p-3 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group relative"
      >
        <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Tooth</span>
        <span className="text-2xl font-serif font-extrabold text-dark-slate my-1 group-hover:text-primary-teal transition-colors">
          #{number}
        </span>
        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text}`}>
          {meta.label}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 bg-light-teal/10 p-6 rounded-[2rem] border border-light-teal/30">
      
      {/* Upper Arch (1 to 16) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-dark-slate uppercase tracking-widest ml-2">Upper Maxillary Arch</h4>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-3">
          {Array.from({ length: 16 }, (_, i) => renderToothBlock(i + 1))}
        </div>
      </div>

      <div className="border-t border-light-teal/20 my-6"></div>

      {/* Lower Arch (17 to 32) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-dark-slate uppercase tracking-widest ml-2">Lower Mandibular Arch</h4>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-3">
          {Array.from({ length: 16 }, (_, i) => renderToothBlock(i + 17))}
        </div>
      </div>

    </div>
  );
}

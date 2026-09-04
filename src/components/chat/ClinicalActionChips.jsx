import React from 'react';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';

/**
 * Interactive Clinical Action & Clarification Chips
 * Displayed below AI responses in the Copilot drawer for 1-click execution
 */
export default function ClinicalActionChips({ chips = [], onSelectChip, disabled = false }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 mt-1 border-t border-slate-100 animate-fadeIn">
      <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-0.5">
        <Sparkles className="w-2.5 h-2.5 text-[#4A7CD2]" />
        <span>Quick Action:</span>
      </span>

      {chips.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelectChip && onSelectChip(chip.command || chip.label)}
          className="group text-[10.5px] font-bold px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/80 hover:from-[#2563EB] hover:to-[#1D4ED8] text-[#1E40AF] hover:text-white border border-blue-200/80 hover:border-blue-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
          title={`Click to execute: ${chip.command || chip.label}`}
        >
          <span>{chip.label}</span>
          <ArrowRight className="w-2.5 h-2.5 text-blue-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      ))}
    </div>
  );
}

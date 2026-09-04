import React from 'react';
import { Activity, Stethoscope, HeartPulse, Sparkles } from 'lucide-react';

export default function ToothAnatomyCard({
  toothMeta,
  isPediatric,
  tNum,
  tKey,
  toothName
}) {
  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4A7CD2]" />
          Anatomical Tooth Dossier
        </h3>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {toothMeta?.shape ? `${toothMeta.shape.toUpperCase()} MORPHOLOGY` : 'ANATOMY'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase block">Dental Arch</span>
          <span className="font-black text-[#10244B]">{toothMeta?.arch || (tNum <= 16 ? 'Maxilla (Upper)' : 'Mandible (Lower)')}</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase block">Quadrant</span>
          <span className="font-black text-[#10244B]">{toothMeta?.quad || 'Dental Quadrant'}</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase block">Roots & Canals</span>
          <span className="font-black text-[#10244B]">{toothMeta?.roots ? `${toothMeta.roots} Root(s)` : 'Single Root'} ({toothMeta?.canals || '1 Canal'})</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-muted-text uppercase block">Occlusal Cusps</span>
          <span className="font-black text-[#10244B]">{toothMeta?.cusps || 'Anatomical Cusps'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
        <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
          <span className="text-[10px] font-bold text-blue-700 uppercase block">Nerve Innervation</span>
          <span className="font-black text-[#1D4ED8]">{toothMeta?.innervation || 'Alveolar Dental Nerve'}</span>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
          <span className="text-[10px] font-bold text-purple-700 uppercase block">Antagonist Tooth</span>
          <span className="font-black text-[#6D28D9]">{toothMeta?.antagonist || 'Opposing Arch'}</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Eruption Timeline</span>
          <span className="font-black text-emerald-800">{toothMeta?.eruption || 'Chronological Age'}</span>
        </div>
      </div>

      {toothMeta?.function && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
          <span className="font-black text-[#10244B]">Primary Masticatory Function:</span>
          <span>{toothMeta.function}</span>
        </div>
      )}
    </div>
  );
}

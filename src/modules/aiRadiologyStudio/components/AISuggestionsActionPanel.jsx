import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HardDrive,
  Upload,
  Layers,
  ChevronRight,
  FileCheck
} from 'lucide-react';

export default function AISuggestionsActionPanel({
  patientId,
  patientName,
  activeTooth,
  onSelectTooth,
  onApplyFindings,
  isApplying,
  onTriggerScanner
}) {
  const suggestions = [
    {
      id: 1,
      title: 'Book Prophylaxis & Cleaning',
      urgency: 'Urgent',
      urgencyClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
      toothRef: 'Tooth #12',
      cdt: 'CDT D1110'
    },
    {
      id: 2,
      title: 'Fill Cavity (Composite Resin)',
      urgency: 'Soon',
      urgencyClass: 'bg-amber-50 text-amber-600 border-amber-200/80',
      toothRef: 'Tooth #27',
      cdt: 'CDT D2391'
    },
    {
      id: 3,
      title: 'Implant Osteotomy Evaluation',
      urgency: 'Planned',
      urgencyClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      toothRef: 'Tooth #7.9',
      cdt: 'CDT D6010'
    },
    {
      id: 4,
      title: 'Periodontal Therapy & Scaling',
      urgency: 'Urgent',
      urgencyClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
      toothRef: 'Tooth #6.17',
      cdt: 'CDT D4341'
    }
  ];

  return (
    <div className="flex flex-col h-full justify-between gap-3 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs select-none">
      {/* Top Header: AI Diagnosis Summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-slate-900 leading-tight">
                AI Diagnostic Summary
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Autonomous Radiographic Findings
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border border-blue-200/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>AI Verified</span>
          </span>
        </div>

        {/* Patient Reference Tag */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[11.5px]">
          <span className="font-semibold text-slate-500">Patient:</span>
          <span className="font-black text-slate-800 truncate max-w-[170px]">
            {patientName || `Patient #${patientId || '38'}`}
          </span>
        </div>
      </div>

      {/* Middle Section: AI Suggests Treatment List */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto pr-0.5 my-1">
        <div className="flex items-center justify-between text-[11.5px] font-black text-slate-700 px-1">
          <span>AI Suggested Procedures</span>
          <span className="text-[10px] font-bold text-slate-400">4 Identified</span>
        </div>

        {suggestions.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (item.toothRef.includes('12')) onSelectTooth('12');
              else if (item.toothRef.includes('27')) onSelectTooth('27');
              else if (item.toothRef.includes('7')) onSelectTooth('7.9');
              else if (item.toothRef.includes('6')) onSelectTooth('6.17');
            }}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-5 h-5 rounded-full bg-white text-[11px] font-black text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/70 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {item.id}
              </span>
              <div className="truncate">
                <div className="text-[11.5px] font-bold text-slate-800 group-hover:text-blue-900 truncate">
                  {item.title}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span className="text-blue-600 font-bold">{item.toothRef}</span>
                  <span>•</span>
                  <span>{item.cdt}</span>
                </div>
              </div>
            </div>

            <span
              className={`text-[9.5px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${item.urgencyClass}`}
            >
              {item.urgency}
            </span>
          </div>
        ))}

        {/* Diagnostic Accuracy Badge */}
        <div className="mt-1 p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center gap-2 text-[11px] text-blue-950">
          <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="leading-snug">
            <strong>Clinical Safety:</strong> Findings reviewed against ADA guidelines. Ready for 1-click chart synchronization.
          </span>
        </div>
      </div>

      {/* Bottom Section: Primary Action Button */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onApplyFindings}
          disabled={isApplying}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-[13.5px] py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group hover:scale-[1.01]"
        >
          {isApplying ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Applying Changes to Chart...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>Done: Apply to Chart & Notes ➔</span>
            </>
          )}
        </button>

        {/* Quick Hardware Sensor Trigger link */}
        <div className="flex items-center justify-center gap-3 text-[10.5px] text-slate-400 font-medium">
          <button
            type="button"
            onClick={() => onTriggerScanner('digora')}
            className="hover:text-blue-600 hover:underline cursor-pointer"
          >
            📡 Digora Scan
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onTriggerScanner('nanopix')}
            className="hover:text-blue-600 hover:underline cursor-pointer"
          >
            📸 NanoPix RVG
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onTriggerScanner('upload')}
            className="hover:text-blue-600 hover:underline cursor-pointer"
          >
            📁 Re-upload
          </button>
        </div>
      </div>
    </div>
  );
}

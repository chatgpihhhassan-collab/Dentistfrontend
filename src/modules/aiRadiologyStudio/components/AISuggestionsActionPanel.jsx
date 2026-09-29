import React from 'react';
import {
  Sparkles,
  FileCheck,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export default function AISuggestionsActionPanel({
  patientId,
  patientName,
  activeTooth,
  onSelectTooth,
  onApplyFindings,
  isApplying,
  onTriggerScanner,
  findings = []
}) {
  // Generate real suggestions dynamically from database findings
  const suggestions = (findings && findings.length > 0)
    ? findings.map((f, idx) => ({
        id: idx + 1,
        title: f.procedureTitle || `${f.label} Management`,
        urgency: f.urgency || 'Soon',
        urgencyClass:
          f.urgency === 'Urgent'
            ? 'bg-rose-50 text-rose-600 border-rose-200/80'
            : f.urgency === 'Planned'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
            : 'bg-amber-50 text-amber-600 border-amber-200/80',
        toothRef: `Tooth #${f.toothNumber}`,
        toothNum: String(f.toothNumber),
        cdt: f.cdtCode || 'CDT D0150'
      }))
    : [
        {
          id: 1,
          title: 'Routine Preventative Recall & Polish',
          urgency: 'Sound',
          urgencyClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
          toothRef: 'Full Dentition',
          toothNum: 'All',
          cdt: 'CDT D1110'
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
                Live Database EHR Findings
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border border-blue-200/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>DB Synchronized</span>
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

      {/* Middle Section: Real Database Suggested Procedures */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto pr-0.5 my-1 max-h-[340px]">
        <div className="flex items-center justify-between text-[11.5px] font-black text-slate-700 px-1">
          <span>Targeted Procedures</span>
          <span className="text-[10px] font-bold text-slate-400">
            {findings.length} Condition{findings.length === 1 ? '' : 's'} in DB
          </span>
        </div>

        {suggestions.map((item) => {
          const isSelected = String(activeTooth) === String(item.toothNum);

          return (
            <div
              key={item.id}
              onClick={() => onSelectTooth && onSelectTooth(item.toothNum)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20'
                  : 'bg-slate-50 hover:bg-blue-50/60 border-slate-100 hover:border-blue-200'
              }`}
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
          );
        })}

        {/* Clinical Safety Banner */}
        <div className="mt-1 p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center gap-2 text-[11px] text-blue-950">
          <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="leading-snug">
            <strong>Real EHR Integration:</strong> Pathologies loaded from database records. Ready for 1-click clinical chart synchronization.
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
              <span>Applying Changes to Database...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>Done: Apply to Chart & Notes ➔</span>
            </>
          )}
        </button>

        {/* Quick Hardware Scan Trigger */}
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

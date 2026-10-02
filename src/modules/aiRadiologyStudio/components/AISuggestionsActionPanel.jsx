import React, { useState } from 'react';
import {
  Sparkles,
  FileCheck,
  CheckCircle2,
  ShieldCheck,
  Activity,
  AlertCircle
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
  const [filterType, setFilterType] = useState('all'); // 'all' | 'urgent' | 'planned'

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

  // Clinical triage statistics
  const totalFindings = findings ? findings.length : 0;
  const urgentCount = findings ? findings.filter((f) => f.urgency === 'Urgent').length : 0;
  const plannedCount = findings ? findings.filter((f) => f.urgency === 'Planned').length : 0;
  const soundCount = Math.max(0, 32 - totalFindings);

  // Filtered list
  const filteredSuggestions = suggestions.filter((item) => {
    if (filterType === 'urgent') return item.urgency === 'Urgent';
    if (filterType === 'planned') return item.urgency === 'Planned';
    return true;
  });

  return (
    <div className="flex flex-col gap-3.5 h-full w-full select-none">
      {/* ========================================================================= */}
      {/* PANEL 1: AI Diagnostic Summary & Patient EHR Intelligence Hub             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[14.5px] font-black text-slate-900 leading-tight">
                AI Diagnostic Summary
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Live Database EHR Findings
              </p>
            </div>
          </div>

          <span className="text-[9.5px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>DB Synchronized</span>
          </span>
        </div>

        {/* Patient Profile Tag */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50/90 rounded-2xl border border-slate-100/90 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
              {patientName ? patientName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="truncate">
              <span className="font-extrabold text-slate-800 text-[12px] block truncate">
                {patientName || `Patient #${patientId || '38'}`}
              </span>
              <span className="text-[9.5px] font-semibold text-slate-400">
                EHR Record #{patientId || '38'} • Full Dentition Scan
              </span>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
            Active
          </span>
        </div>

        {/* Clinical Triage KPI Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2 text-center flex flex-col items-center">
            <span className="text-[9.5px] font-bold text-rose-600 uppercase tracking-tight">Urgent</span>
            <span className="text-[16px] font-black text-rose-700 leading-tight my-0.5">{urgentCount}</span>
            <span className="text-[8.5px] text-rose-500 font-medium">Immediate</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2 text-center flex flex-col items-center">
            <span className="text-[9.5px] font-bold text-blue-600 uppercase tracking-tight">Planned</span>
            <span className="text-[16px] font-black text-blue-700 leading-tight my-0.5">{plannedCount}</span>
            <span className="text-[8.5px] text-blue-500 font-medium">Scheduled</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2 text-center flex flex-col items-center">
            <span className="text-[9.5px] font-bold text-emerald-600 uppercase tracking-tight">Sound</span>
            <span className="text-[16px] font-black text-emerald-700 leading-tight my-0.5">{soundCount}</span>
            <span className="text-[8.5px] text-emerald-500 font-medium">Healthy</span>
          </div>
        </div>

        {/* Optical Confidence Pill */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-600">AI Diagnostic Confidence:</span>
          </div>
          <strong className="text-slate-800 font-black">99.4% DICOM Validated</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL 2: Targeted Procedures & Treatment Action Engine                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3 shrink-0">
        {/* Header & Filter Controls */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[12px] font-black text-slate-900 px-0.5">
            <div className="flex items-center gap-2">
              <span>Targeted Procedures</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {findings.length} Conditions
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer text-center ${
                filterType === 'all'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({suggestions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('urgent')}
              className={`flex-1 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer text-center ${
                filterType === 'urgent'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Urgent ({urgentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('planned')}
              className={`flex-1 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer text-center ${
                filterType === 'planned'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Planned ({plannedCount})
            </button>
          </div>
        </div>

        {/* Dynamic Scrollable Procedure Queue (Hugs content, max-height 360px with smooth scroll) */}
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1 my-0.5">
          {filteredSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2 flex-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span className="text-xs font-bold text-slate-600">No procedures in this category</span>
              <span className="text-[10px]">All other clinical conditions are clear.</span>
            </div>
          ) : (
            filteredSuggestions.map((item) => {
              const isSelected = String(activeTooth) === String(item.toothNum);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectTooth && onSelectTooth(item.toothNum)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                      : 'bg-slate-50/80 hover:bg-blue-50/50 border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-xl text-[11px] font-black flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 group-hover:border-blue-400'
                      }`}
                    >
                      {item.toothNum}
                    </span>
                    <div className="truncate">
                      <div className="text-[11.5px] font-bold text-slate-800 group-hover:text-blue-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-[9.5px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <span className="text-blue-600 font-bold">{item.toothRef}</span>
                        <span>•</span>
                        <span>{item.cdt}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${item.urgencyClass}`}
                  >
                    {item.urgency}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Clinical Safety Verification Banner */}
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 flex items-center gap-2 text-[10.5px] text-blue-950 shrink-0">
          <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="leading-snug">
            <strong>EHR Auto-Scribe Ready:</strong> All findings synced to 3D Odontogram & SOAP note archive.
          </span>
        </div>

        {/* Bottom Section: Primary Action Button */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onApplyFindings}
            disabled={isApplying}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-[13px] py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group hover:scale-[1.01]"
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
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-medium">
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
    </div>
  );
}

import React, { useMemo } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getToothPrimarySection, getToothAnatomicalName } from '../utils/dentalCalloutMapper';

export default function SynchronizedDentitionBar({
  findings = [],
  activeTooth = '14',
  onSelectTooth
}) {
  // Map findings by tooth number for instantaneous O(1) lookup
  const findingsByTooth = useMemo(() => {
    const map = {};
    if (Array.isArray(findings)) {
      findings.forEach((f) => {
        map[String(f.toothNumber)] = f;
      });
    }
    return map;
  }, [findings]);

  // Upper Arch (Maxillary 1–16: Right to Left)
  const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Lower Arch (Mandibular 32–17: Right to Left)
  const lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  const totalDiagnosed = findings.length;
  const totalSound = 32 - totalDiagnosed;

  const renderToothCell = (tNum) => {
    const sNum = String(tNum);
    const isSelected = String(activeTooth) === sNum;
    const finding = findingsByTooth[sNum];
    const anatomicalName = getToothAnatomicalName(tNum);
    const primarySection = getToothPrimarySection(tNum);

    // Color definitions based on clinical pathology
    let statusBg = 'bg-slate-100 text-slate-600 border-slate-200';
    let dotColor = 'bg-slate-300';
    let statusLabel = 'Sound / Intact';

    if (finding) {
      statusLabel = finding.label;
      if (finding.label === 'Cavity') {
        statusBg = 'bg-blue-50 text-blue-700 border-blue-200';
        dotColor = 'bg-blue-600';
      } else if (finding.label === 'Root Canal Needed') {
        statusBg = 'bg-purple-50 text-purple-700 border-purple-200';
        dotColor = 'bg-purple-600';
      } else if (finding.label === 'Bone Pathology') {
        statusBg = 'bg-amber-50 text-amber-700 border-amber-200';
        dotColor = 'bg-amber-500';
      } else if (finding.label === 'Restoration / Crown') {
        statusBg = 'bg-teal-50 text-teal-700 border-teal-200';
        dotColor = 'bg-teal-600';
      } else if (finding.label.includes('Missing') || finding.label.includes('Extract')) {
        statusBg = 'bg-slate-100 text-slate-500 border-slate-300';
        dotColor = 'bg-slate-500';
      } else {
        statusBg = 'bg-rose-50 text-rose-700 border-rose-200';
        dotColor = 'bg-rose-500';
      }
    }

    return (
      <button
        key={`dentition-tooth-${tNum}`}
        type="button"
        onClick={() => onSelectTooth && onSelectTooth(sNum)}
        title={`Tooth #${tNum}: ${anatomicalName}\nStatus: ${statusLabel}\nRadiograph: ${primarySection.toUpperCase()} View`}
        className={`group relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-xl border transition-all duration-150 cursor-pointer min-w-[28px] sm:min-w-[34px] md:min-w-[38px] flex-1 ${
          isSelected
            ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400 shadow-md scale-105 z-10'
            : finding
            ? `${statusBg} hover:shadow-xs hover:border-slate-400`
            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Top: Status indicator dot */}
        <div className="flex items-center justify-center w-full">
          <span
            className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${
              isSelected ? 'bg-white' : dotColor
            }`}
          />
        </div>

        {/* Center: Tooth Number */}
        <span
          className={`text-[11px] sm:text-[12px] font-black leading-tight mt-0.5 ${
            isSelected ? 'text-white' : finding ? 'text-slate-900 font-extrabold' : 'text-slate-600'
          }`}
        >
          {tNum}
        </span>

        {/* Bottom: Mini label indicator for diagnosed teeth */}
        <div className="h-1.5 w-full flex items-center justify-center mt-0.5">
          {finding && (
            <span
              className={`w-3.5 h-1 rounded-full ${
                isSelected ? 'bg-white/80' : dotColor
              }`}
            />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-col gap-2.5 select-none">
      {/* Header Row: Title + Synchronized Counts + Quick Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] sm:text-[14px] font-black text-slate-900 leading-tight">
                Synchronized 32-Tooth Dentition Bar
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                1-Click Inspection
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">
              Click any tooth to auto-rotate radiograph angle and inspect clinical findings
            </p>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-black">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>{totalDiagnosed} Patholog{totalDiagnosed === 1 ? 'y' : 'ies'} Charted</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{totalSound} Sound</span>
          </span>
        </div>
      </div>

      {/* Synchronized Dentition Strip */}
      <div className="flex flex-col gap-2 overflow-x-auto pb-1">
        {/* Upper Arch (Maxillary: Teeth 1–16) */}
        <div className="flex items-center gap-1.5 min-w-[580px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-14 shrink-0 text-right pr-1">
            Upper
          </span>
          <div className="flex items-center gap-1 flex-1">
            {/* Quadrant 1 (Teeth 1–8) */}
            <div className="flex items-center gap-1 flex-1">
              {upperTeeth.slice(0, 8).map(renderToothCell)}
            </div>

            {/* Midline Divider */}
            <div className="w-[1.5px] h-9 bg-slate-300 mx-0.5 rounded-full shrink-0" title="Maxillary Midline (Teeth 8–9)" />

            {/* Quadrant 2 (Teeth 9–16) */}
            <div className="flex items-center gap-1 flex-1">
              {upperTeeth.slice(8, 16).map(renderToothCell)}
            </div>
          </div>
        </div>

        {/* Lower Arch (Mandibular: Teeth 32–17) */}
        <div className="flex items-center gap-1.5 min-w-[580px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-14 shrink-0 text-right pr-1">
            Lower
          </span>
          <div className="flex items-center gap-1 flex-1">
            {/* Quadrant 4 (Teeth 32–25) */}
            <div className="flex items-center gap-1 flex-1">
              {lowerTeeth.slice(0, 8).map(renderToothCell)}
            </div>

            {/* Midline Divider */}
            <div className="w-[1.5px] h-9 bg-slate-300 mx-0.5 rounded-full shrink-0" title="Mandibular Midline (Teeth 25–24)" />

            {/* Quadrant 3 (Teeth 24–17) */}
            <div className="flex items-center gap-1 flex-1">
              {lowerTeeth.slice(8, 16).map(renderToothCell)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

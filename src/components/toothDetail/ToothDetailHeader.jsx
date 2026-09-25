import React from 'react';
import { ArrowLeft, ExternalLink, Printer } from 'lucide-react';
import { OdontogramPrintIcon, ToothDetailAllIcon } from '../DentalReportIcons';

export default function ToothDetailHeader({
  patientId,
  patient,
  tNum,
  tKey,
  isPediatric,
  toothName,
  handleBackToChart,
  handleOpenAllTeeth,
  handlePrintReport,
  onOpenImplant,
  onOpenBiopsy,
  onOpenAligner
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-light-teal/30 shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left: Back button & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToChart}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-light-teal/40 bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#10244B] text-xs font-black transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Back to Chart</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#10244B] tracking-tight">
                {isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                isPediatric 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isPediatric ? 'Pediatric Primary' : 'Adult Permanent'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted-text truncate max-w-[280px]">
              {toothName}
            </p>
          </div>
        </div>

        {/* Right: Actions & Specialties */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Clinical Specialties for this tooth */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs gap-1">
            {onOpenImplant && (
              <button
                type="button"
                onClick={onOpenImplant}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 text-[11px] font-black transition-all cursor-pointer"
                title="Implant Planning & 3D Surgical Guide for this tooth"
              >
                <span className="text-xs">🔩</span>
                <span className="hidden md:inline">Implant</span>
              </button>
            )}

            {onOpenBiopsy && (
              <button
                type="button"
                onClick={onOpenBiopsy}
                className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 text-[11px] font-black transition-all cursor-pointer"
                title="Biopsy & Oral Pathology Requisition for this tooth"
              >
                <span className="text-xs">🔬</span>
                <span className="hidden md:inline">Biopsy</span>
              </button>
            )}

            {onOpenAligner && (
              <button
                type="button"
                onClick={onOpenAligner}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 text-[11px] font-black transition-all cursor-pointer"
                title="Clear Aligner Digital Orthodontics"
              >
                <span className="text-xs">✨</span>
                <span className="hidden md:inline">Aligners</span>
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <button
            onClick={() => window.open('/clinical-guide', '_blank')}
            title="Open Clinical Voice & Charting Guidelines in a new tab"
            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 group"
          >
            <span>📖</span>
            <span className="hidden lg:inline">Guidelines</span>
            <ExternalLink className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button
            onClick={handleOpenAllTeeth}
            title="Open Tooth All Pages"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-light-teal/40 hover:bg-[#EFF6FF] text-[#10244B] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 group"
          >
            <ToothDetailAllIcon className="w-4 h-4 text-[#2563EB] group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-xs font-black">All Teeth</span>
          </button>

          <button
            onClick={handlePrintReport}
            title="Print Odontogram Report"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5 group"
          >
            <OdontogramPrintIcon className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-xs font-black">Print Report</span>
          </button>
        </div>
      </div>
    </header>
  );
}

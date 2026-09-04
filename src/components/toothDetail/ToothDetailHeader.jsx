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
  handlePrintReport
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-light-teal/30 shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
            <span className="text-muted-text">Patient:</span>
            <span className="text-[#10244B] font-black">{`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || patient?.name || `Patient #${patientId}`}</span>
          </div>

          <button
            onClick={handleOpenAllTeeth}
            title="Open Tooth All Pages"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-light-teal/40 hover:bg-[#EFF6FF] text-[#10244B] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 group"
          >
            <ToothDetailAllIcon className="w-4 h-4 text-[#2563EB] group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline text-xs font-black">All Teeth</span>
          </button>

          <button
            onClick={handlePrintReport}
            title="Print Odontogram Report"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5 group"
          >
            <OdontogramPrintIcon className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline text-xs font-black">Print Report</span>
          </button>
        </div>
      </div>
    </header>
  );
}

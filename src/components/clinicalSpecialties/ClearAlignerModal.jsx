import React from 'react';
import { X, Sparkles } from 'lucide-react';
import ClearAlignerOrthoTab from '../orthoTmjSuite/ClearAlignerOrthoTab';

export default function ClearAlignerModal({
  isOpen,
  onClose,
  patientId,
  onPlanSaved,
  initialData = null
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modern Ortho Suite Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#064E3B] via-[#0F766E] to-[#0D9488] text-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-white">Clear Aligner Digital Orthodontics</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 text-emerald-100 px-2.5 py-0.5 rounded-full border border-white/20">
                  Ortho Treatment Suite
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-100/90 mt-0.5">
                Aligner brand, tray staging progression, composite attachments, IPR protocol & refinement scans.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <ClearAlignerOrthoTab
            patientId={patientId}
            initialData={initialData}
            onPlanSaved={(plan) => {
              if (onPlanSaved) onPlanSaved(plan);
              setTimeout(() => {
                if (onClose) onClose();
              }, 700);
            }}
          />
        </div>

      </div>
    </div>
  );
}

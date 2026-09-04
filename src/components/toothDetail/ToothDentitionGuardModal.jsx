import React from 'react';
import { AlertTriangle, AlertCircle, Check, X } from 'lucide-react';
import { formatDOB } from './ToothPatientEhrBanner';

export default function ToothDentitionGuardModal({
  isOpen,
  onClose,
  patient,
  patientAge,
  isPediatric
}) {
  if (!isOpen) return null;

  const activeCategory = isPediatric ? 'Pediatric (Primary A–T)' : 'Adult (Permanent 1–32)';
  const attemptedCategory = isPediatric ? 'Adult Permanent (1–32)' : 'Pediatric Primary (A–T)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase bg-white/25 px-2 py-0.5 rounded-full inline-block mb-1">
                Dentition Category Guard
              </span>
              <h3 className="text-base font-black tracking-tight leading-snug">
                Dentition Mode Mismatch Warning
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-4">
          {/* Patient Dossier Snapshot Pill */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-xs">
                {patient?.firstName ? patient.firstName.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 leading-tight">
                  {patient?.name || `${patient?.firstName || 'Patient'} ${patient?.lastName || ''}`}
                </h4>
                <p className="text-[11px] font-bold text-slate-500">
                  DOB: {formatDOB(patient?.dob)} • <span className="text-blue-600 font-extrabold">{patientAge !== null ? `${patientAge} Years Old` : 'Pediatric'}</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
              {activeCategory}
            </span>
          </div>

          {/* Notice Message */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cannot Navigate Across Incompatible Dentition Categories</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              This patient is designated under <strong>{activeCategory}</strong>. Selecting a tooth from {attemptedCategory} is blocked to prevent charting errors.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-amber-200/60">
              To change dentition mode, update the patient&apos;s dentition classification in the main Patient Profile settings.
            </p>
          </div>

          {/* Clinical Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Understood — Stay in {isPediatric ? 'Pediatric (A–T)' : 'Adult (1–32)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

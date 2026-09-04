import React from 'react';
import { FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import ToothCrossSectionDiagram from './ToothCrossSectionDiagram';

export default function ToothClinicalOverview({
  patientId,
  isPediatric,
  tNum,
  tKey,
  toothData,
  surfaceData,
  activePaletteItem,
  setActivePaletteItem,
  handleToggleZone,
  handleApplyAll5Zones,
  handleClearAllZones,
  editingNotes,
  setEditingNotes,
  isEditingNotes,
  setIsEditingNotes,
  handleSaveObservation,
  saving
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Doctor Clinical Observation Notes & Dictation Log */}
      <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4A7CD2]" />
            Doctor Clinical Observation Notes & Dictation Log
          </h3>
          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className="text-xs font-bold text-[#4A7CD2] hover:underline cursor-pointer"
          >
            {isEditingNotes ? 'Cancel Edit' : 'Edit Notes ✍️'}
          </button>
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              rows={4}
              className="w-full text-xs font-semibold p-3 rounded-2xl border border-light-teal/50 bg-[#F8FAFC] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#4A7CD2]"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleSaveObservation(toothData?.status, editingNotes, toothData?.color)}
                disabled={saving}
                className="bg-[#4A7CD2] text-white text-xs font-black px-4 py-1.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl p-4 space-y-2">
            <p className="text-xs text-dark-slate font-semibold leading-relaxed whitespace-pre-line">
              {toothData?.comments || toothData?.comment || 'No abnormal pathology detected. Enamel surface is intact with physiological bone levels.'}
            </p>
          </div>
        )}
      </div>

      {/* 5-Surface Cross-Section Box (Centerpiece) */}
      <ToothCrossSectionDiagram
        patientId={patientId}
        isPediatric={isPediatric}
        tNum={tNum}
        tKey={tKey}
        surfaceData={surfaceData}
        activePaletteItem={activePaletteItem}
        setActivePaletteItem={setActivePaletteItem}
        handleToggleZone={handleToggleZone}
        handleApplyAll5Zones={handleApplyAll5Zones}
        handleClearAllZones={handleClearAllZones}
        toothData={toothData}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Sparkles, Check, Edit3, X, AlertTriangle, ShieldCheck } from 'lucide-react';

export const PendingOdontogramOverlay = ({
  findings = [],
  confidenceThreshold = 0.6,
  onAcceptFinding,
  onEditAcceptFinding,
  onDismissFinding,
}) => {
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCondition, setEditedCondition] = useState('');
  const [editedCdt, setEditedCdt] = useState('');

  if (!findings || findings.length === 0) return null;

  return (
    <div className="relative">
      {/* Render Markers for Each Pending Finding */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-[#E8934A]/10 border border-[#E8934A]/30 rounded-2xl mb-3">
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-[#E8934A]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pending AI Observations ({findings.length}):</span>
        </div>

        {findings.map((f) => {
          const isLowConfidence = f.confidence < confidenceThreshold;
          return (
            <div
              key={f.id}
              onClick={() => {
                setSelectedFinding(f);
                setEditedCondition(f.suggested_condition || f.suggestedCondition || '');
                setEditedCdt(f.suggested_cdt_code || f.suggestedCdtCode || '');
                setIsEditing(false);
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-dashed border-[#E8934A] bg-white text-[#0F2F2C] hover:bg-[#E8934A]/20 transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#E8934A] animate-ping"></span>
              <span className="text-xs font-bold text-[#E8934A]">AI #{f.tooth_number || f.toothNumber}</span>
              <span className="text-xs font-medium truncate max-w-[100px]">{f.suggested_condition || f.suggestedCondition}</span>
              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono font-bold">
                {((f.confidence || 0.9) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive Review Popover / Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D1E3E0]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#E8934A]/20 text-[#E8934A] rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B4F4A]">AI Observation Review</h3>
                  <p className="text-xs text-gray-500">Tooth #{selectedFinding.tooth_number || selectedFinding.toothNumber} ({selectedFinding.numbering_system || selectedFinding.numberingSystem || 'Universal'})</p>
                </div>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Finding Details */}
            <div className="mt-4 space-y-3 bg-[#F2F7F6] p-4 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-gray-500">Suggested Condition:</span>
                {!isEditing ? (
                  <p className="text-sm font-bold text-[#0B4F4A]">{selectedFinding.suggested_condition || selectedFinding.suggestedCondition}</p>
                ) : (
                  <input
                    type="text"
                    value={editedCondition}
                    onChange={(e) => setEditedCondition(e.target.value)}
                    className="w-full mt-1 bg-white border border-[#D1E3E0] rounded-lg px-2.5 py-1 text-sm text-[#0F2F2C] focus:outline-none focus:ring-2 focus:ring-[#4FB3A9]"
                  />
                )}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-500">CDT Code:</span>
                  {!isEditing ? (
                    <p className="text-xs font-mono font-bold text-gray-700">{selectedFinding.suggested_cdt_code || selectedFinding.suggestedCdtCode || 'N/A'}</p>
                  ) : (
                    <input
                      type="text"
                      value={editedCdt}
                      onChange={(e) => setEditedCdt(e.target.value)}
                      className="w-24 mt-1 bg-white border border-[#D1E3E0] rounded-lg px-2 py-1 text-xs font-mono text-[#0F2F2C] focus:outline-none focus:ring-2 focus:ring-[#4FB3A9]"
                    />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500">Confidence Score:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (selectedFinding.confidence || 0.9) >= 0.75
                          ? 'bg-green-100 text-green-700'
                          : (selectedFinding.confidence || 0.9) >= 0.6
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {((selectedFinding.confidence || 0.9) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {(selectedFinding.confidence || 0.9) < confidenceThreshold && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Low confidence observation. Forced clinical verification required before chart write.</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (onDismissFinding) onDismissFinding(selectedFinding.id);
                  setSelectedFinding(null);
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Dismiss
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit & Adjust'}
                </button>

                {isEditing ? (
                  <button
                    onClick={() => {
                      if (onEditAcceptFinding) {
                        onEditAcceptFinding(selectedFinding.id, {
                          tooth_number: selectedFinding.tooth_number || selectedFinding.toothNumber,
                          suggested_condition: editedCondition,
                          suggested_cdt_code: editedCdt,
                        });
                      }
                      setSelectedFinding(null);
                    }}
                    className="px-4 py-2 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Save & Accept
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (onAcceptFinding) onAcceptFinding(selectedFinding.id);
                      setSelectedFinding(null);
                    }}
                    className="px-4 py-2 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#4FB3A9]" /> Accept to Chart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

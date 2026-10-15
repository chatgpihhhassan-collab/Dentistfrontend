import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  Check, X, Eye, Info, ChevronRight, FileText
} from 'lucide-react';

/**
 * Standard FDI Tooth Names for Plain-Language and Clinical Clarity
 */
const TOOTH_NAMES = {
  11: 'Upper Right Central Incisor (#8)',
  12: 'Upper Right Lateral Incisor (#7)',
  13: 'Upper Right Canine (#6)',
  14: 'Upper Right First Premolar (#5)',
  15: 'Upper Right Second Premolar (#4)',
  16: 'Upper Right First Molar (#3)',
  17: 'Upper Right Second Molar (#2)',
  18: 'Upper Right Third Molar (#1)',
  21: 'Upper Left Central Incisor (#9)',
  22: 'Upper Left Lateral Incisor (#10)',
  23: 'Upper Left Canine (#11)',
  24: 'Upper Left First Premolar (#12)',
  25: 'Upper Left Second Premolar (#13)',
  26: 'Upper Left First Molar (#14)',
  27: 'Upper Left Second Molar (#15)',
  28: 'Upper Left Third Molar (#16)',
  31: 'Lower Left Central Incisor (#24)',
  32: 'Lower Left Lateral Incisor (#23)',
  33: 'Lower Left Canine (#22)',
  34: 'Lower Left First Premolar (#21)',
  35: 'Lower Left Second Premolar (#20)',
  36: 'Lower Left First Molar (#19)',
  37: 'Lower Left Second Molar (#18)',
  38: 'Lower Left Third Molar (#17)',
  41: 'Lower Right Central Incisor (#25)',
  42: 'Lower Right Lateral Incisor (#26)',
  43: 'Lower Right Canine (#27)',
  44: 'Lower Right First Premolar (#28)',
  45: 'Lower Right Second Premolar (#29)',
  46: 'Lower Right First Molar (#30)',
  47: 'Lower Right Second Molar (#31)',
  48: 'Lower Right Third Molar (#32)'
};

/**
 * 🦷 AIFindingsConfirmModal
 * Gated Clinical Review Modal (Principle #4: Trust & Control)
 * Strictly ensures NO AI findings write to the dental chart or patient legal record
 * without explicit, itemized clinician confirmation.
 */
export default function AIFindingsConfirmModal({
  isOpen,
  onClose,
  findings = [],
  onConfirm,
  radiograph = null,
  title = 'Review AI Radiograph Findings'
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Default to selecting all valid findings when opened
  useEffect(() => {
    if (isOpen && findings && findings.length > 0) {
      const allKeys = new Set(findings.map((f, idx) => f.id || `${f.toothKey || f.toothNumber}_${idx}`));
      setSelectedIds(allKeys);
    } else {
      setSelectedIds(new Set());
    }
  }, [isOpen, findings]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === findings.length) {
      setSelectedIds(new Set());
    } else {
      const allKeys = new Set(findings.map((f, idx) => f.id || `${f.toothKey || f.toothNumber}_${idx}`));
      setSelectedIds(allKeys);
    }
  };

  const handleConfirm = () => {
    const approvedFindings = findings.filter((f, idx) => 
      selectedIds.has(f.id || `${f.toothKey || f.toothNumber}_${idx}`)
    );
    onConfirm(approvedFindings);
    onClose();
  };

  const getToothLabel = (toothKey) => {
    const num = parseInt(toothKey, 10);
    return TOOTH_NAMES[num] || `Tooth #${toothKey}`;
  };

  const getSeverityBadge = (condition = '') => {
    const c = condition.toLowerCase();
    if (c.includes('caries') || c.includes('decay') || c.includes('periapical') || c.includes('abscess')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (c.includes('calculus') || c.includes('bone loss') || c.includes('wear') || c.includes('restoration')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const formatConfidence = (conf) => {
    if (conf == null) return null;
    const val = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);
    let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (val < 70) colorClass = 'text-rose-700 bg-rose-50 border-rose-200';
    else if (val < 85) colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    return { val, colorClass };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-findings-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-purple-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ai-findings-modal-title" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {title}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Advisory Only
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Review and approve findings before applying to the patient dental chart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Guardrail Banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Safety Mandate:</strong> AI suggestions are assistive and must be verified chairside by a licensed dental clinician. Unchecked items will NOT be written to the patient record.
          </span>
        </div>

        {/* Body / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {radiograph && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  Source: {radiograph.filename || radiograph.Filename || 'Patient Radiograph'}
                </span>
              </div>
              <span className="text-slate-500">
                {radiograph.createdAt ? new Date(radiograph.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
          )}

          {/* Quick Selection Toolbar */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="font-medium">
              {selectedIds.size} of {findings.length} findings selected for charting
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
            >
              {selectedIds.size === findings.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Findings Checklist */}
          {findings.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-medium text-slate-700">No abnormal pathology detected</p>
              <p className="text-xs text-slate-500 mt-1">The AI analysis did not detect actionable dental conditions requiring charting.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {findings.map((item, index) => {
                const itemId = item.id || `${item.toothKey || item.toothNumber}_${index}`;
                const isChecked = selectedIds.has(itemId);
                const toothKey = item.toothKey || item.toothNumber;
                const confData = formatConfidence(item.confidence);

                return (
                  <div
                    key={itemId}
                    onClick={() => toggleSelect(itemId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked 
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by container onClick
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        aria-label={`Select finding for tooth ${toothKey}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-800 text-white">
                            Tooth {toothKey}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getSeverityBadge(item.condition)}`}>
                            {item.condition || 'Finding'}
                          </span>
                          {item.surface && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Surface: {item.surface}
                            </span>
                          )}
                          {item.cdtCode && (
                            <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              CDT: {item.cdtCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 truncate">
                          {getToothLabel(toothKey)}
                          {item.notes ? ` — ${item.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    {confData && (
                      <span className={`text-xs px-2 py-1 rounded-md font-medium border flex-shrink-0 ${confData.colorClass}`}>
                        {confData.val}% match
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 text-sm transition-colors"
          >
            Cancel (Do Not Apply)
          </button>
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm ${
              selectedIds.size > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Confirm & Apply {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} to Dental Chart
          </button>
        </div>

      </div>
    </div>
  );
}

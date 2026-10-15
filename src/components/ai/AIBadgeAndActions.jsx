import React, { useState } from 'react';
import { 
  Sparkles, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, 
  Edit3, ShieldAlert, CheckCircle2, Loader2, Info, ChevronDown, ChevronUp, Flag
} from 'lucide-react';

/**
 * 🤖 AIBadgeAndActions Component
 * Standard Clinical AI Guardrail and Feedback Header/Footer:
 * 1. Required medical safety disclaimer ("AI-generated suggestion, review before saving.")
 * 2. Visual confidence rating (High / Moderate / Low with % and color badge)
 * 3. Expandable "Based on:" data attribution drawer
 * 4. Clinician action controls: Edit, Copy, Regenerate, Thumbs Up/Down feedback, and Flag
 */
export default function AIBadgeAndActions({
  promptId = 'clinical-copilot-qa',
  version = '2.0.0',
  feature = 'clinical',
  confidence = null, // number e.g. 0.92 or 92
  basedOn = '', // string explanation or array of data sources
  textToCopy = '',
  onRegenerate = null,
  isRegenerating = false,
  isEditing = false,
  onToggleEdit = null,
  showFeedback = true,
  className = ''
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(null); // 'up' | 'down' | 'flag' | null
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showBasedOn, setShowBasedOn] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Normalize confidence (0-1 or 0-100)
  const normalizedConfidence = confidence != null 
    ? (confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence))
    : null;

  const getConfidenceBadge = () => {
    if (normalizedConfidence == null) return null;
    if (normalizedConfidence >= 85) {
      return {
        label: `High Confidence (${normalizedConfidence}%)`,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    }
    if (normalizedConfidence >= 65) {
      return {
        label: `Moderate Confidence (${normalizedConfidence}%)`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    }
    return {
      label: `Low Confidence (${normalizedConfidence}%) — Verify Carefully`,
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
    };
  };

  const confidenceBadge = getConfidenceBadge();

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleFeedback = async (vote, notes = '') => {
    if (feedbackSubmitted || isSubmittingFeedback) return;
    setIsSubmittingFeedback(true);

    try {
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.doctorId || 1;

      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          version,
          feedback: vote,
          notes,
          feature,
          doctorId: docId
        })
      });
      setFeedbackSubmitted(vote);
      setShowReportModal(false);
    } catch (e) {
      console.warn('Feedback submission failed:', e);
      setFeedbackSubmitted(vote); // Optimistic UI
      setShowReportModal(false);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className={`space-y-2 pt-2.5 pb-1 border-t border-slate-100 ${className}`}>
      {/* 🛡️ Primary Guardrail & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left Side: Mandatory Safety Disclaimer + Confidence Badge */}
        <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] font-semibold tracking-tight shadow-2xs"
            title="Clinical Safety Guardrail: This content is AI-assisted. Always inspect and verify before signing or applying to chart."
          >
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />
            <span>AI-generated suggestion, review before saving</span>
            <span className="text-[9.5px] font-bold text-amber-700/60 uppercase">v{version}</span>
          </span>

          {confidenceBadge && (
            <span 
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${confidenceBadge.badgeClass}`}
              title={`Statistical model confidence score: ${normalizedConfidence}%`}
            >
              <span>{confidenceBadge.label}</span>
            </span>
          )}

          {basedOn && (
            <button
              type="button"
              onClick={() => setShowBasedOn(prev => !prev)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Click to view which patient clinical data this suggestion was generated from"
              aria-expanded={showBasedOn}
            >
              <Info className="w-3 h-3 text-[#4A7CD2]" />
              <span>Based on...</span>
              {showBasedOn ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Right Side: Clinician Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Edit Button */}
          {onToggleEdit && (
            <button
              type="button"
              onClick={onToggleEdit}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isEditing 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isEditing ? 'Finish editing' : 'Edit AI output before saving'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit'}</span>
            </button>
          )}

          {/* Copy Button */}
          {textToCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Copy suggestion to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {/* Regenerate Button */}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              title="Regenerate this suggestion with alternative phrasing"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A7CD2]" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </>
              )}
            </button>
          )}

          {/* Feedback Buttons */}
          {showFeedback && (
            <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-200">
              <button
                type="button"
                onClick={() => handleFeedback('up')}
                disabled={feedbackSubmitted !== null}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  feedbackSubmitted === 'up' 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Helpful suggestion (thumbs up)"
                aria-label="Thumbs up"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleFeedback('down')}
                disabled={feedbackSubmitted !== null}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  feedbackSubmitted === 'down' 
                    ? 'text-rose-700 bg-rose-50' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Inaccurate or unhelpful suggestion (thumbs down)"
                aria-label="Thumbs down"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Report a clinical problem with this AI suggestion"
                aria-label="Report clinical issue"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>

              {feedbackSubmitted && (
                <span className="text-[10px] font-bold text-slate-500 ml-1">
                  Thanks!
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 📖 Expandable "Based on:" Attribution Drawer */}
      {showBasedOn && basedOn && (
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-700 space-y-1 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-[#1E3A8A]">
            <Info className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Clinical Source & Attribution Telemetry</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            {typeof basedOn === 'string' ? basedOn : JSON.stringify(basedOn)}
          </p>
        </div>
      )}

      {/* 🚩 Report Clinical Problem Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Report Clinical Accuracy Issue</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Help our clinical engineering team refine model reliability. Please describe what was inaccurate or missing in this AI suggestion.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Tooth number was misidentified; prescribed dose is contraindicated for this patient..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4A7CD2]"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingFeedback || !reportReason.trim()}
                onClick={() => handleFeedback('flag', reportReason)}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

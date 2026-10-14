import React, { useState } from 'react';
import { 
  Sparkles, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, 
  Edit3, ShieldAlert, CheckCircle2, Loader2 
} from 'lucide-react';

/**
 * 🤖 AIBadgeAndActions Component
 * Premium clinical UI control providing:
 * 1. Required clinical safety badge ("AI-generated suggestion, requires dentist review")
 * 2. Edit toggle mode before saving to patient record
 * 3. Copy button with feedback
 * 4. Regenerate button
 * 5. Thumbs up/down prompt quality feedback telemetry (/api/ai/feedback)
 */
export default function AIBadgeAndActions({
  promptId = 'clinical-copilot-qa',
  version = '1.0.0',
  feature = 'clinical',
  textToCopy = '',
  onRegenerate = null,
  isRegenerating = false,
  isEditing = false,
  onToggleEdit = null,
  showFeedback = true,
  className = ''
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(null); // 'up' | 'down' | null
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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

  const handleFeedback = async (vote) => {
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
          feature,
          doctorId: docId
        })
      });
      setFeedbackSubmitted(vote);
    } catch (e) {
      console.warn('Feedback submission failed:', e);
      setFeedbackSubmitted(vote); // Optimistic UI
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-2 pb-1 border-t border-slate-100 ${className}`}>
      {/* 🛡️ Required Medical Safety Badge */}
      <div className="flex items-center gap-1.5" aria-live="polite">
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] font-semibold tracking-tight shadow-2xs"
          title="Clinical Safety Guardrail: This content is AI-assisted. Always inspect and verify before signing or applying to chart."
        >
          <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
          <span>AI-generated suggestion, requires dentist review</span>
          <span className="text-[9.5px] font-bold text-amber-700/60 uppercase">v{version}</span>
        </span>
      </div>

      {/* 🛠️ Action Controls */}
      <div className="flex items-center gap-1">
        {/* Edit Button */}
        {onToggleEdit && (
          <button
            type="button"
            onClick={onToggleEdit}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              isEditing 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isEditing ? 'Finish editing' : 'Edit AI output before saving'}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Editing' : 'Edit'}</span>
          </button>
        )}

        {/* Copy Button */}
        {textToCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Copy text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
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
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Regenerate with fresh AI inference"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>
        )}

        {/* Thumbs Up / Down Feedback */}
        {showFeedback && (
          <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-200">
            {feedbackSubmitted ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Voted
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleFeedback('up')}
                  disabled={isSubmittingFeedback}
                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  title="Accurate & helpful prompt response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback('down')}
                  disabled={isSubmittingFeedback}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Inaccurate or needed corrections"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

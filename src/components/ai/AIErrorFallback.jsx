import React, { useState } from 'react';
import { AlertCircle, RotateCcw, PenTool, Copy, Check, WifiOff, Clock } from 'lucide-react';

/**
 * ⚠️ AIErrorFallback Component
 * Friendly, actionable error display that preserves user input,
 * provides one-click Retry, and guarantees a smooth manual fallback.
 */
export default function AIErrorFallback({
  error = null,
  userMessage = "Couldn't generate the clinical suggestion. Try again or write it manually.",
  errorCode = "AI_UNAVAILABLE",
  onRetry = null,
  onManualFallback = null,
  preservedInput = "",
  className = ""
}) {
  const [copied, setCopied] = useState(false);

  // Derive friendly explanation based on standard error code
  const getErrorMeta = () => {
    switch (errorCode) {
      case 'AI_TIMEOUT':
        return {
          icon: Clock,
          tag: 'Request Timed Out',
          tagClass: 'bg-amber-50 text-amber-800 border-amber-200',
          advice: 'The clinical model was slow to respond. Your input is safely preserved below.'
        };
      case 'NETWORK_OFFLINE':
      case 'OFFLINE':
        return {
          icon: WifiOff,
          tag: 'Network Offline',
          tagClass: 'bg-slate-100 text-slate-800 border-slate-300',
          advice: 'Clinic internet connection dropped. Check your connection or continue with manual charting.'
        };
      case 'RATE_LIMITED':
        return {
          icon: AlertCircle,
          tag: 'Rate Limit Reached',
          tagClass: 'bg-purple-50 text-purple-800 border-purple-200',
          advice: 'Too many concurrent AI requests. Please wait a few seconds before retrying.'
        };
      default:
        return {
          icon: AlertCircle,
          tag: 'Generation Interrupted',
          tagClass: 'bg-rose-50 text-rose-800 border-rose-200',
          advice: 'An unexpected issue occurred. You can retry or complete the record manually without losing work.'
        };
    }
  };

  const meta = getErrorMeta();
  const IconComponent = meta.icon;

  const handleCopyPreserved = async () => {
    if (!preservedInput) return;
    try {
      await navigator.clipboard.writeText(preservedInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy draft failed:', e);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl p-5 border border-rose-200/80 shadow-sm space-y-4 animate-fadeIn select-none ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Header with Icon and Tag */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-100 mt-0.5">
            <IconComponent className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                {userMessage}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.tagClass}`}>
                {meta.tag}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {meta.advice}
            </p>
          </div>
        </div>
      </div>

      {/* Preserved Input Tray so the clinician NEVER loses their dictated words */}
      {preservedInput && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Your Preserved Dictation / Notes:</span>
            <button
              type="button"
              onClick={handleCopyPreserved}
              className="inline-flex items-center gap-1 text-[10.5px] text-[#4A7CD2] hover:underline cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Dictation'}</span>
            </button>
          </div>
          <p className="font-mono text-slate-800 text-[11.5px] max-h-24 overflow-y-auto leading-relaxed">
            {preservedInput}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
        {onManualFallback && (
          <button
            type="button"
            onClick={onManualFallback}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <PenTool className="w-3.5 h-3.5 text-slate-500" />
            <span>Write Manually</span>
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2 rounded-xl bg-[#4A7CD2] hover:bg-[#3b66b2] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
}

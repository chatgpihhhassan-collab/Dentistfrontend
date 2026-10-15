import React, { useState, useEffect } from 'react';
import { Loader2, X, Sparkles, Clock, AlertCircle } from 'lucide-react';

/**
 * ⏳ AILoadingState Component
 * Accessible loading skeleton with streaming text preview, elapsed timer,
 * and a guaranteed Cancel button that aborts the request.
 */
export default function AILoadingState({
  title = "Analyzing clinical data...",
  subtitle = "Our clinical models are formulating dental recommendations.",
  streamingText = "",
  onCancel = null,
  timeoutSeconds = 25,
  className = ""
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(95, Math.round((elapsed / timeoutSeconds) * 100));
  const isNearTimeout = elapsed >= timeoutSeconds - 5;

  return (
    <div 
      className={`bg-white rounded-2xl p-5 border border-blue-100 shadow-sm space-y-4 animate-fadeIn select-none ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4A7CD2] flex items-center justify-center font-bold shrink-0 border border-blue-100">
            <Loader2 className="w-5 h-5 animate-spin text-[#4A7CD2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{title}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Cancel AI generation and continue manually"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Progress Bar & Elapsed Time */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              isNearTimeout ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Elapsed: {elapsed}s</span>
          </span>
          <span>{isNearTimeout ? 'Completing shortly...' : 'Generating...'}</span>
        </div>
      </div>

      {/* Live Streaming Text Preview if available */}
      {streamingText && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono max-h-28 overflow-y-auto leading-relaxed">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Live Generation Stream:
          </span>
          <span className="text-slate-800">{streamingText}</span>
          <span className="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse align-middle" />
        </div>
      )}

      {/* Reassurance Footer */}
      <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1 border-t border-slate-100">
        <span>Never blocked: core chart editing remains unlocked.</span>
        {isNearTimeout && (
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Taking longer than usual
          </span>
        )}
      </div>
    </div>
  );
}

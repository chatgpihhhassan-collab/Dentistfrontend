import React, { useState } from 'react';
import { 
  Mic, MicOff, Sparkles, Volume2, VolumeX, 
  ChevronUp, ChevronDown, X, AlertCircle, Loader2
} from 'lucide-react';

/**
 * 🎙️ VoiceCaptionPill
 * Non-intrusive floating voice caption overlay (Principle #1 & #6)
 * Provides real-time visual feedback for Jarvis copilot, voice commands, and chairside dictation.
 */
export default function VoiceCaptionPill({
  isListening = false,
  isProcessing = false,
  transcript = '',
  statusText = '',
  errorMessage = '',
  onToggleMic = null,
  isMuted = false,
  onDismiss = null,
  position = 'bottom', // 'top' | 'bottom'
  className = ''
}) {
  const [minimized, setMinimized] = useState(false);

  // If completely idle with no transcript and no error, don't obstruct the screen unless listening
  if (!isListening && !isProcessing && !transcript && !errorMessage) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-4 inset-x-0 mx-auto' 
    : 'bottom-6 inset-x-0 mx-auto';

  return (
    <div 
      className={`fixed ${positionClasses} z-40 max-w-lg w-[92%] transition-all duration-300 ease-out flex flex-col items-center ${className}`}
      role="region"
      aria-live="polite"
      aria-label="Voice Assistant Status and Caption"
    >
      <div className="w-full bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/60 shadow-2xl rounded-2xl p-3 px-4 flex flex-col gap-2">
        
        {/* Main Pill Row */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            {isProcessing ? (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
            ) : isListening ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2"></span>
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-4"></span>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
                  {errorMessage 
                    ? 'Voice Error' 
                    : isProcessing 
                    ? 'Analyzing...' 
                    : isListening 
                    ? 'Listening Chairside' 
                    : 'Jarvis Standby'}
                </span>
                {statusText && (
                  <span className="text-[10px] text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700/50">
                    {statusText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleMic && (
              <button
                type="button"
                onClick={onToggleMic}
                className={`p-2 rounded-xl transition-colors ${
                  isMuted 
                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
                aria-label={isMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMinimized(prev => !prev)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label={minimized ? "Expand captions" : "Collapse captions"}
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Dismiss voice bar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Live Caption Text (Collapsed if minimized) */}
        {!minimized && (
          <div className="pt-1 text-xs text-slate-200 border-t border-slate-800">
            {errorMessage ? (
              <p className="text-rose-300 font-medium">{errorMessage}</p>
            ) : transcript ? (
              <p className="font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 leading-relaxed break-words">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : (
              <p className="text-slate-400 italic">
                Speak commands hands-free: &quot;Chart tooth 16 caries&quot;, &quot;Summarize notes&quot;, or &quot;Show radiograph&quot;...
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

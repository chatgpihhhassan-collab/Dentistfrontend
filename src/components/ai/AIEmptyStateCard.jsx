import React from 'react';
import { Sparkles, MessageSquare, Lightbulb, ArrowRight, Stethoscope } from 'lucide-react';

/**
 * 💡 AIEmptyStateCard
 * Empty state card with actionable prompt suggestion chips (Principle #1: Chairside Intuitive & #7: Onboarding)
 */
export default function AIEmptyStateCard({
  icon: CustomIcon = Sparkles,
  title = 'Dentia Clinical AI Assistant',
  description = 'Get instant AI assistance with charting, treatment planning, radiography, and patient explanations.',
  suggestions = [],
  onSelectSuggestion = null,
  actionButton = null,
  className = ''
}) {
  const defaultSuggestions = [
    "Summarize periodontal risk from current chart",
    "Draft SOAP note for composite restoration on tooth 16",
    "Explain root canal procedure in simple patient terms",
    "Generate post-operative care instructions for extraction"
  ];

  const chips = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className={`p-6 sm:p-8 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white rounded-2xl border border-blue-100/80 shadow-sm text-center flex flex-col items-center justify-center ${className}`}>
      
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-in zoom-in-95 duration-200">
        <CustomIcon className="w-7 h-7" />
      </div>

      {/* Heading */}
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {/* Action Button if provided */}
      {actionButton && (
        <div className="mb-6">
          {actionButton}
        </div>
      )}

      {/* Quick Suggestion Chips */}
      {chips.length > 0 && onSelectSuggestion && (
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Try asking or dictating:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectSuggestion(chip)}
                className="group px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs text-slate-700 hover:text-blue-700 font-medium transition-all shadow-xs flex items-center gap-1.5 text-left"
              >
                <span>{chip}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

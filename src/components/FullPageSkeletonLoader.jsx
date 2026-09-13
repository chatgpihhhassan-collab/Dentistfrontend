import React from 'react';

/**
 * FullPageSkeletonLoader
 * Full-page opaque loading cover that replicates the clean dashboard skeleton
 * with a centered percentage card (matching the reference sample).
 * Completely hides the backend (no backdrop-blur).
 */
export default function FullPageSkeletonLoader({
  title = "Getting your dental chart ready.",
  subtitle = "Syncing clinical records, pulling 3D models, warming things up.",
  progress = 100,
  status = "",
  slowConnection = false,
  onContinueAnyway
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#F8F9FA] flex items-center justify-center p-4 overflow-hidden select-none animate-fade-in">
      
      {/* 🌟 Background Skeleton Wireframe (Covering Entire Page — No Backend Blur) 🌟 */}
      <div className="absolute inset-0 pointer-events-none p-6 sm:p-10 flex flex-col gap-6 opacity-40 max-w-[1700px] mx-auto w-full">
        {/* Top Nav Skeleton */}
        <div className="w-full bg-white/80 border border-slate-200/80 rounded-2xl h-16 px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200/70 animate-pulse" />
            <div className="h-3.5 w-28 bg-slate-200/70 rounded-full" />
            <div className="h-2.5 w-16 bg-slate-100 rounded-full hidden sm:block" />
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="h-3 w-20 bg-slate-200/60 rounded-full" />
            <div className="h-3 w-24 bg-slate-200/60 rounded-full" />
            <div className="h-3 w-20 bg-slate-200/60 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-slate-200/60 rounded-xl hidden sm:block" />
            <div className="w-8 h-8 rounded-full bg-slate-200/80" />
          </div>
        </div>

        {/* Dashboard Cards Skeleton Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Main Chart/Odontogram Panel Skeleton */}
          <div className="flex-1 bg-white/80 border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-200/80 rounded-full animate-pulse" />
                <div className="h-2.5 w-72 bg-slate-100 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                <div className="h-8 w-8 bg-slate-100 rounded-xl" />
              </div>
            </div>

            {/* Vertical Bar Chart Skeletons (Matching Reference Image) */}
            <div className="py-12 flex items-end justify-between gap-3 sm:gap-6 px-4 max-w-2xl mx-auto w-full">
              <div className="w-full bg-slate-200/50 rounded-2xl h-32 animate-pulse" />
              <div className="w-full bg-slate-200/60 rounded-2xl h-48 animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-full bg-slate-200/40 rounded-2xl h-24 animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-full bg-slate-200/70 rounded-2xl h-56 animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="w-full bg-slate-200/50 rounded-2xl h-40 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-full bg-slate-200/60 rounded-2xl h-52 animate-pulse" style={{ animationDelay: '250ms' }} />
              <div className="w-full bg-slate-200/40 rounded-2xl h-28 animate-pulse" style={{ animationDelay: '350ms' }} />
            </div>

            {/* Bottom Skeleton Pill Track */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="h-3 w-32 bg-slate-100 rounded-full" />
              <div className="h-3 w-20 bg-slate-100 rounded-full" />
            </div>
          </div>

          {/* Side Panel Skeleton */}
          <div className="w-full lg:w-[38%] bg-white/80 border border-slate-200/80 rounded-3xl p-8 flex flex-col gap-6 shadow-2xs">
            <div className="h-4 w-36 bg-slate-200/80 rounded-full animate-pulse" />
            <div className="space-y-3">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-3/4 bg-slate-200/70 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-2/3 bg-slate-200/70 rounded-full" />
                  <div className="h-2 w-1/3 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-4/5 bg-slate-200/70 rounded-full" />
                  <div className="h-2 w-2/5 bg-slate-100 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Center Floating Card (Exact Match to Reference Sample) 🌟 */}
      <div className="relative z-10 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border border-slate-200/80 max-w-lg w-full mx-4 animate-scale-up">
        <div className="flex items-start gap-4">
          
          {/* Animated 3x3 Dot Matrix (From Reference Sample) */}
          <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100/90 shrink-0 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: '600ms' }} />
          </div>

          {/* Text Content & Clean Percentage Progress */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
              {subtitle}
            </p>

            {/* Clean Progress & Percentage Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] text-slate-400 font-medium truncate pr-2">
                  {status || (progress === 100 ? 'Ready!' : 'Loading...')}
                </span>
                <span className="text-xs font-black text-[#10244B] bg-[#EAF0FC] text-[#4A7CD2] px-2 py-0.5 rounded-md border border-blue-200/60 shrink-0">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/70 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#4A7CD2] via-[#00C5A0] to-[#3665B7] transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            {/* Slow Connection Fallback */}
            {slowConnection && onContinueAnyway && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 animate-fade-in">
                <span className="text-[10px] text-amber-700 font-medium">Slow network detected</span>
                <button
                  type="button"
                  onClick={onContinueAnyway}
                  className="text-[10.5px] font-bold text-[#4A7CD2] hover:text-[#3665B7] underline cursor-pointer"
                >
                  Continue anyway
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

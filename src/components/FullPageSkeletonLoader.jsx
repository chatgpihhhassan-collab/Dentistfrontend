import React from 'react';

/**
 * FullPageSkeletonLoader
 * Exact pixel-faithful implementation of the reference sample UI/UX:
 * - Full page opaque wireframe skeleton covering all screen (zero backend blur)
 * - Centered floating white card with 3x3 dot matrix, clean title, subtitle, and percentage
 */
export default function FullPageSkeletonLoader({
  title = "Getting your dashboard ready.",
  subtitle = "Syncing accounts, pulling insights, warming things up.",
  progress = 100,
  status = "",
  slowConnection = false,
  onContinueAnyway
}) {
  return (
    <div className="fixed inset-0 z-[99999] bg-[#F8F9FA] flex items-center justify-center p-4 overflow-hidden select-none animate-fade-in min-h-screen w-screen">
      
      {/* 🌟 Background Dashboard Skeleton (Exact Layout from Reference Image) 🌟 */}
      <div className="absolute inset-0 pointer-events-none p-6 sm:p-10 flex flex-col gap-6 opacity-35 max-w-[1700px] mx-auto w-full">
        {/* Top Nav Bar Wireframe */}
        <div className="w-full bg-white/90 border border-slate-200/70 rounded-2xl h-14 px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-slate-300/70" />
            <div className="h-3 w-24 bg-slate-200 rounded-full" />
            <div className="h-2 w-16 bg-slate-100 rounded-full hidden sm:block" />
          </div>
          <div className="hidden md:flex items-center gap-5">
            <div className="h-2.5 w-16 bg-slate-200/80 rounded-full" />
            <div className="h-2.5 w-20 bg-slate-200/80 rounded-full" />
            <div className="h-2.5 w-16 bg-slate-200/80 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 bg-slate-200/60 rounded-lg hidden sm:block" />
            <div className="w-7 h-7 rounded-full bg-slate-200" />
          </div>
        </div>

        {/* Main Body Skeleton: Left & Right Cards */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Left Large Card with 7 Vertical Bars */}
          <div className="flex-1 bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col justify-between shadow-2xs">
            {/* Header Lines */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <div className="h-3.5 w-44 bg-slate-200 rounded-full" />
                <div className="h-2 w-64 bg-slate-100 rounded-full" />
              </div>
              <div className="h-7 w-20 bg-slate-100 rounded-lg" />
            </div>

            {/* 7 Vertical Bar Chart Skeletons (Matching Reference Image) */}
            <div className="py-10 flex items-end justify-between gap-4 sm:gap-8 px-6 max-w-2xl mx-auto w-full">
              <div className="w-full bg-slate-200/60 rounded-2xl h-28" />
              <div className="w-full bg-slate-200/80 rounded-2xl h-48" />
              <div className="w-full bg-slate-200/50 rounded-2xl h-64" />
              <div className="w-full bg-slate-200/80 rounded-2xl h-56" />
              <div className="w-full bg-slate-200/40 rounded-2xl h-20" />
              <div className="w-full bg-slate-200/70 rounded-2xl h-36" />
              <div className="w-full bg-slate-200/60 rounded-2xl h-44" />
            </div>

            {/* Bottom Capsule Pill */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="h-3 w-28 bg-slate-100 rounded-full" />
              <div className="h-3 w-16 bg-slate-100 rounded-full" />
            </div>
          </div>

          {/* Right Card with Placeholders */}
          <div className="w-full lg:w-[36%] bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col gap-5 shadow-2xs">
            <div className="h-3.5 w-32 bg-slate-200 rounded-full" />
            <div className="space-y-3 mt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-3/4 bg-slate-200 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-2/3 bg-slate-200 rounded-full" />
                  <div className="h-2 w-1/3 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-4/5 bg-slate-200 rounded-full" />
                  <div className="h-2 w-2/5 bg-slate-100 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Center Floating Card (Exact Match to Reference Sample Image) 🌟 */}
      <div className="relative z-10 bg-white rounded-3xl px-7 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] border border-slate-100 max-w-[480px] w-full mx-4 animate-scale-up">
        <div className="flex items-center gap-5">
          
          {/* 3x3 Dot Matrix (From Reference Sample Image) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0] animate-pulse" style={{ animationDelay: '600ms' }} />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0F172A] tracking-tight leading-snug">
                {title}
              </h3>
              {progress !== undefined && progress !== null && (
                <span className="text-[12px] font-extrabold text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded-md font-mono shrink-0">
                  {progress}%
                </span>
              )}
            </div>
            
            <p className="text-[12px] sm:text-[13px] text-[#64748B] font-normal leading-normal mt-0.5">
              {subtitle}
            </p>

            {/* Slim Progress Bar */}
            {progress !== undefined && progress !== null && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#4A7CD2] to-[#00C5A0] transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            )}

            {/* Slow Connection Action */}
            {slowConnection && onContinueAnyway && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] animate-fade-in">
                <span className="text-amber-600 font-medium">Slow network detected</span>
                <button
                  type="button"
                  onClick={onContinueAnyway}
                  className="font-bold text-[#4A7CD2] hover:underline cursor-pointer"
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

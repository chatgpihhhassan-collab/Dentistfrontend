import React from 'react';

/**
 * Page-Specific Configurations for FullPageSkeletonLoader
 * Each page has unique, relevant title, subtitle, and wireframe representation.
 */
const PAGE_PRESETS = {
  chart: {
    title: "Getting your dental chart ready.",
    subtitle: "Syncing odontogram records, 3D anatomical models, and patient chart.",
    type: "chart"
  },
  directory: {
    title: "Getting your patient directory ready.",
    subtitle: "Syncing patient records, medical history, and clinical appointments.",
    type: "directory"
  },
  dashboard: {
    title: "Getting your clinic dashboard ready.",
    subtitle: "Syncing clinic metrics, pulling practice insights, warming things up.",
    type: "dashboard"
  },
  appointments: {
    title: "Getting your appointments ready.",
    subtitle: "Syncing clinic schedules, calendar bookings, and clinician rosters.",
    type: "appointments"
  },
  notes: {
    title: "Getting clinical notes ready.",
    subtitle: "Syncing audio transcripts, AI summaries, and SOAP records.",
    type: "notes"
  },
  history: {
    title: "Getting patient history ready.",
    subtitle: "Syncing clinical audit logs, past treatments, and procedures.",
    type: "history"
  },
  doctor: {
    title: "Getting doctor workspace ready.",
    subtitle: "Syncing clinician profiles, permissions, and clinic accounts.",
    type: "doctor"
  }
};

/**
 * Auto-detect page preset from current window pathname if variant is not explicitly passed.
 */
function detectPresetFromPath(path = '') {
  const p = path.toLowerCase();
  if (p.includes('/chart')) return 'chart';
  if (p.includes('/directory')) return 'directory';
  if (p.includes('/appointment')) return 'appointments';
  if (p.includes('/note')) return 'notes';
  if (p.includes('/history')) return 'history';
  if (p.includes('/doctor') || p.includes('/admin')) return 'doctor';
  return 'dashboard';
}

/**
 * FullPageSkeletonLoader
 * Exact pixel-faithful implementation of the reference sample UI/UX:
 * - Page-specific dynamic content (Dental Chart vs Directory vs Dashboard vs Appointments)
 * - Page-specific background skeleton wireframe (zero backend blur, 100% opaque cover)
 * - Centered floating white card with 3x3 dot matrix, clean title, subtitle, and optional hairline progress
 */
export default function FullPageSkeletonLoader({
  variant,
  title,
  subtitle,
  progress = null,
  status = "",
  slowConnection = false,
  onContinueAnyway
}) {
  // Resolve preset from prop or current route URL
  const activeKey = variant || (typeof window !== 'undefined' ? detectPresetFromPath(window.location.pathname) : 'dashboard');
  const preset = PAGE_PRESETS[activeKey] || PAGE_PRESETS.dashboard;

  const displayTitle = title || preset.title;
  // If a live status message is available (e.g. from chart loading), use it, otherwise use preset subtitle
  const displaySubtitle = status || subtitle || preset.subtitle;
  const wireframeType = preset.type;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#F8F9FA] flex items-center justify-center p-4 overflow-hidden select-none animate-fade-in min-h-screen w-screen">
      
      {/* 🌟 Background Dashboard Skeleton (Page-Specific Wireframe, Zero Blur) 🌟 */}
      <div className="absolute inset-0 pointer-events-none p-6 sm:p-10 flex flex-col gap-6 opacity-35 max-w-[1700px] mx-auto w-full">
        {/* Top Nav Bar Wireframe (Consistent Across Entire Clinic Platform) */}
        <div className="w-full bg-white/90 border border-slate-200/70 rounded-2xl h-14 px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-slate-300/70" />
            <div className="h-3 w-28 bg-slate-200 rounded-full" />
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

        {/* 🌟 MAIN BODY SKELETON VARIANTS 🌟 */}

        {/* 1. DENTAL CHART SKELETON: Odontogram Jaw Arch & Clinical Scribe Panels */}
        {wireframeType === 'chart' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Left Large Odontogram Workspace */}
            <div className="flex-1 bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col justify-between shadow-2xs">
              {/* Header Info & Tabs */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-48 bg-slate-200 rounded-full" />
                    <div className="h-2 w-32 bg-slate-100 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-24 bg-slate-100 rounded-xl" />
                  <div className="h-7 w-20 bg-slate-200 rounded-xl" />
                </div>
              </div>

              {/* Dental Arch Odontogram Curve Sockets (Upper & Lower 16 Teeth) */}
              <div className="py-8 flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto w-full">
                {/* Maxilla Arch Wireframe */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                  {[...Array(16)].map((_, i) => (
                    <div key={`max-${i}`} className="w-5 sm:w-7 h-8 sm:h-10 rounded-lg bg-slate-200/70 border border-slate-300/40" />
                  ))}
                </div>
                {/* Jaw Center Divider */}
                <div className="w-36 h-2 bg-slate-200/50 rounded-full" />
                {/* Mandible Arch Wireframe */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                  {[...Array(16)].map((_, i) => (
                    <div key={`man-${i}`} className="w-5 sm:w-7 h-8 sm:h-10 rounded-lg bg-slate-200/70 border border-slate-300/40" />
                  ))}
                </div>
              </div>

              {/* Bottom Condition Palette Pills */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                <div className="h-6 w-16 bg-slate-100 rounded-lg" />
              </div>
            </div>

            {/* Right Clinical Copilot Panel */}
            <div className="w-full lg:w-[32%] bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="h-3.5 w-32 bg-slate-200 rounded-full" />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="h-2.5 w-3/4 bg-slate-200 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                </div>
                <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-100 space-y-2">
                  <div className="h-2.5 w-4/5 bg-slate-200 rounded-full" />
                  <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="h-10 w-full bg-slate-100 rounded-2xl" />
            </div>
          </div>
        )}

        {/* 2. PATIENT DIRECTORY SKELETON: Search Bar, Filter Chips & Patient Table Rows */}
        {wireframeType === 'directory' && (
          <div className="flex-1 bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col gap-6 shadow-2xs min-h-0">
            {/* Header: Title & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="h-4 w-44 bg-slate-200 rounded-full" />
                <div className="h-2.5 w-28 bg-slate-100 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-64 bg-slate-100 rounded-xl border border-slate-200/60" />
                <div className="h-10 w-32 bg-slate-200 rounded-xl" />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 bg-slate-200 rounded-lg" />
              <div className="h-7 w-24 bg-slate-100 rounded-lg" />
              <div className="h-7 w-24 bg-slate-100 rounded-lg" />
              <div className="h-7 w-20 bg-slate-100 rounded-lg" />
            </div>

            {/* Patient Table Rows */}
            <div className="flex-1 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={`row-${i}`} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-36 bg-slate-200 rounded-full" />
                      <div className="h-2 w-24 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="h-5 w-16 bg-slate-200/70 rounded-md" />
                    <div className="h-5 w-24 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-8 w-24 bg-slate-200/60 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. APPOINTMENTS SKELETON: Calendar Grid & Schedule Blocks */}
        {wireframeType === 'appointments' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            <div className="flex-1 bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col gap-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="h-4 w-40 bg-slate-200 rounded-full" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                  <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3 flex-1">
                {[...Array(14)].map((_, i) => (
                  <div key={`cal-${i}`} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between">
                    <div className="h-2.5 w-6 bg-slate-200 rounded-full" />
                    {i % 2 === 0 && <div className="h-6 w-full bg-slate-200/60 rounded-lg mt-2" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[32%] bg-white/90 border border-slate-200/70 rounded-3xl p-8 flex flex-col gap-4 shadow-2xs">
              <div className="h-4 w-32 bg-slate-200 rounded-full" />
              {[...Array(3)].map((_, i) => (
                <div key={`side-${i}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="h-3 w-3/4 bg-slate-200 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DASHBOARD SKELETON: Default Layout Matching Reference Sample Image */}
        {(wireframeType === 'dashboard' || wireframeType === 'notes' || wireframeType === 'history' || wireframeType === 'doctor') && (
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
        )}
      </div>

      {/* 🌟 Center Floating Card (Exact 1:1 Match to Reference Sample Image) 🌟 */}
      <div className="relative z-10 bg-white rounded-3xl px-8 py-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 max-w-[500px] w-full mx-4 animate-scale-up">
        <div className="flex items-center gap-5">
          
          {/* 3x3 Dot Matrix (Exact Match to Reference Sample Image) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 shrink-0" aria-label="Loading indicator">
            <span className="w-2.5 h-2.5 rounded-full bg-[#111827] animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0] animate-pulse" style={{ animationDelay: '300ms' }} />
            
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#111827] animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] animate-pulse" style={{ animationDelay: '450ms' }} />
            
            <span className="w-2.5 h-2.5 rounded-full bg-[#111827] animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F1F5F9] animate-pulse" style={{ animationDelay: '600ms' }} />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827] tracking-tight leading-snug">
                {displayTitle}
              </h3>
              {progress !== undefined && progress !== null && progress < 100 && (
                <span className="text-[12px] font-semibold text-slate-400 font-mono shrink-0">
                  {progress}%
                </span>
              )}
            </div>
            
            <p className="text-[13px] text-[#64748B] font-normal leading-normal mt-0.5 truncate">
              {displaySubtitle}
            </p>

            {/* Subtle Hairline Progress Bar */}
            {progress !== undefined && progress !== null && progress < 100 && (
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2.5 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#111827] via-[#4A7CD2] to-[#00C5A0] transition-all duration-300 ease-out"
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

import React from 'react';
import {
  RotateCcw,
  Search,
  Droplet,
  Contrast,
  Sun,
  RefreshCw,
  ArrowLeftRight,
  Box
} from 'lucide-react';

export default function RadiographToolbar({
  viewMode,
  onToggleViewMode,
  onResetFilters,
  magnifierActive,
  onToggleMagnifier,
  isInverted,
  onToggleInvert,
  contrastValue,
  onChangeContrast,
  brightnessValue,
  onChangeBrightness,
  onReloadRawScan,
  isFlipped,
  onToggleFlip
}) {
  return (
    <div className="flex items-center justify-between w-full px-6 py-2.5 bg-white/70 backdrop-blur-xs rounded-2xl border border-slate-100 shadow-2xs select-none overflow-x-auto">
      <div className="flex items-center justify-between w-full min-w-[620px] gap-2">
        {/* 1. 3D View */}
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`flex flex-col items-center gap-1 group py-1 px-3 rounded-xl transition-all cursor-pointer ${
            viewMode === '3d' ? 'text-blue-600 bg-blue-50/80 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Toggle 3D Jaw Mesh or 2D Radiograph"
        >
          <Box className={`w-4 h-4 transition-transform ${viewMode === '3d' ? 'scale-110 text-blue-600' : 'group-hover:scale-110'}`} />
          <span className="text-[11px] font-medium tracking-tight">3D View</span>
        </button>

        {/* 2. Reset Filter */}
        <button
          type="button"
          onClick={onResetFilters}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-800 group py-1 px-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          title="Reset All Image Filters to Default"
        >
          <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Reset Filter</span>
        </button>

        {/* 3. Magnify */}
        <button
          type="button"
          onClick={onToggleMagnifier}
          className={`flex flex-col items-center gap-1 group py-1 px-3 rounded-xl transition-all cursor-pointer ${
            magnifierActive ? 'text-blue-600 bg-blue-50/80 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Chairside 2.5x Loupe Magnifier"
        >
          <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Magnify</span>
        </button>

        {/* 4. Inverter */}
        <button
          type="button"
          onClick={onToggleInvert}
          className={`flex flex-col items-center gap-1 group py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isInverted ? 'text-indigo-600 bg-indigo-50/80 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Invert Optical Radiograph (Film Negative View)"
        >
          <Droplet className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Inverter</span>
        </button>

        {/* 5. Contraste */}
        <button
          type="button"
          onClick={onChangeContrast}
          className={`flex flex-col items-center gap-1 group py-1 px-3 rounded-xl transition-all cursor-pointer ${
            contrastValue !== 100 ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          title={`Contrast (${contrastValue}%) - Click to Cycle`}
        >
          <Contrast className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Contraste</span>
        </button>

        {/* 6. Brightness */}
        <button
          type="button"
          onClick={onChangeBrightness}
          className={`flex flex-col items-center gap-1 group py-1 px-3 rounded-xl transition-all cursor-pointer ${
            brightnessValue !== 100 ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          title={`Brightness (${brightnessValue}%) - Click to Cycle`}
        >
          <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Brightness</span>
        </button>

        {/* 7. Reload */}
        <button
          type="button"
          onClick={onReloadRawScan}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-800 group py-1 px-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          title="Reload Original Scan from DICOM Source"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-[11px] font-medium tracking-tight">Reload</span>
        </button>

        {/* 8. Transform */}
        <button
          type="button"
          onClick={onToggleFlip}
          className={`flex flex-col items-center gap-1 group py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isFlipped ? 'text-purple-600 bg-purple-50/80 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Horizontal Mirror Flip"
        >
          <ArrowLeftRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Transform</span>
        </button>
      </div>
    </div>
  );
}

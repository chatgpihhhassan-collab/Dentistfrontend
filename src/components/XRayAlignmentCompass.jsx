import React from 'react';
import { Compass, Crosshair, Radio, Layers } from 'lucide-react';

export const PROJECTION_ALIGNMENT_SPECS = {
  front: {
    id: 'front',
    label: 'Front (Anterior)',
    teethBadge: '#6–11, #22–27',
    beamAim: '0° Midline (Center Face)',
    verticalAngle: '+40° (Upper) / -15° (Lower)',
    sensorMode: 'Vertical Lingual (Portrait)',
    coneBadge: '0° Frontal Cone',
    coneSide: 'front'
  },
  left: {
    id: 'left',
    label: 'Left (Posterior)',
    teethBadge: '#12–16, #17–21',
    beamAim: '80° Left Cheek (Buccal ⬅️)',
    verticalAngle: '+10° Bitewing / +30° Upper / -5° Lower',
    sensorMode: 'Horizontal Lingual (Landscape)',
    coneBadge: '80° Left Cheek Cone',
    coneSide: 'left'
  },
  right: {
    id: 'right',
    label: 'Right (Posterior)',
    teethBadge: '#1–5, #28–32',
    beamAim: '80° Right Cheek (Buccal ➡️)',
    verticalAngle: '+10° Bitewing / +30° Upper / -5° Lower',
    sensorMode: 'Horizontal Lingual (Landscape)',
    coneBadge: '80° Right Cheek Cone',
    coneSide: 'right'
  }
};

/**
 * XRayAlignmentCompass
 * Ultra-clean, zero-scroll visual compass showing X-Ray tube cone aim & sensor placement.
 * Pure visual indicators with zero paragraph text.
 */
export const XRayAlignmentCompass = ({ activeSlotKey = 'front', selectedTooth = '8' }) => {
  const spec = PROJECTION_ALIGNMENT_SPECS[activeSlotKey] || PROJECTION_ALIGNMENT_SPECS.front;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 select-none">
      
      {/* 2D Patient Head & Dental Arch SVG (Ultra-compact 95x95) */}
      <div className="w-[100px] h-[100px] shrink-0 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative p-1">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <defs>
            <linearGradient id="coneGlowFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="coneGlowLeft" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="coneGlowRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Head contour */}
          <ellipse cx="80" cy="85" rx="58" ry="62" fill="#0B1329" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Nose */}
          <path d="M 75 24 L 80 15 L 85 24 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <text x="80" y="12" textAnchor="middle" fill="#64748B" fontSize="7" fontWeight="bold">NOSE</text>

          {/* Left / Right Ear */}
          <path d="M 22 75 C 17 75, 17 95, 22 95" fill="none" stroke="#475569" strokeWidth="1.5" />
          <text x="12" y="88" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">R</text>
          <path d="M 138 75 C 143 75, 143 95, 138 95" fill="none" stroke="#475569" strokeWidth="1.5" />
          <text x="148" y="88" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">L</text>

          {/* Dental Arch Arc */}
          <path d="M 52 115 C 52 65, 108 65, 108 115" fill="none" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />

          {/* Right Sector */}
          <path 
            d="M 52 115 C 52 82, 60 72, 68 67" 
            fill="none" 
            stroke={activeSlotKey === 'right' ? '#2DD4BF' : '#475569'} 
            strokeWidth={activeSlotKey === 'right' ? '10' : '6'} 
            strokeLinecap="round" 
          />

          {/* Front Sector */}
          <path 
            d="M 68 67 C 74 63, 86 63, 92 67" 
            fill="none" 
            stroke={activeSlotKey === 'front' ? '#2DD4BF' : '#475569'} 
            strokeWidth={activeSlotKey === 'front' ? '10' : '6'} 
            strokeLinecap="round" 
          />

          {/* Left Sector */}
          <path 
            d="M 92 67 C 100 72, 108 82, 108 115" 
            fill="none" 
            stroke={activeSlotKey === 'left' ? '#2DD4BF' : '#475569'} 
            strokeWidth={activeSlotKey === 'left' ? '10' : '6'} 
            strokeLinecap="round" 
          />

          {/* Sensor Rectangles */}
          {activeSlotKey === 'front' && (
            <rect x="73" y="71" width="14" height="4" rx="1.5" fill="#059669" stroke="#34D399" strokeWidth="1" />
          )}
          {activeSlotKey === 'left' && (
            <rect x="94" y="85" width="4" height="18" rx="1.5" fill="#059669" stroke="#34D399" strokeWidth="1" />
          )}
          {activeSlotKey === 'right' && (
            <rect x="62" y="85" width="4" height="18" rx="1.5" fill="#059669" stroke="#34D399" strokeWidth="1" />
          )}

          {/* X-Ray Tube Cone & Beam Direction Arrows */}
          {activeSlotKey === 'front' && (
            <g>
              <polygon points="68,32 92,32 96,62 64,62" fill="url(#coneGlowFront)" />
              <rect x="71" y="20" width="18" height="12" rx="2" fill="#D97706" stroke="#FBBF24" strokeWidth="1" />
              <line x1="80" y1="34" x2="80" y2="56" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
              <polygon points="80,60 77,54 83,54" fill="#F59E0B" />
            </g>
          )}

          {activeSlotKey === 'left' && (
            <g>
              <polygon points="135,85 135,108 105,110 105,82" fill="url(#coneGlowLeft)" />
              <rect x="135" y="88" width="12" height="18" rx="2" fill="#D97706" stroke="#FBBF24" strokeWidth="1" />
              <line x1="133" y1="97" x2="110" y2="97" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
              <polygon points="106,97 111,94 111,100" fill="#F59E0B" />
            </g>
          )}

          {activeSlotKey === 'right' && (
            <g>
              <polygon points="25,85 25,108 55,110 55,82" fill="url(#coneGlowRight)" />
              <rect x="13" y="88" width="12" height="18" rx="2" fill="#D97706" stroke="#FBBF24" strokeWidth="1" />
              <line x1="27" y1="97" x2="50" y2="97" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
              <polygon points="54,97 49,94 49,100" fill="#F59E0B" />
            </g>
          )}
        </svg>

        <span className="absolute bottom-1 right-1 text-[8px] font-mono text-teal-300 bg-slate-900/80 px-1 rounded">
          #{selectedTooth}
        </span>
      </div>

      {/* 3 Compact Clinical Badges (Zero Verbose Text) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        
        {/* Aim */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-500/20">
          <Crosshair className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Aim: {spec.beamAim}</span>
        </div>

        {/* Tilt */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-teal-500/20">
          <Radio className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Tilt: {spec.verticalAngle}</span>
        </div>

        {/* Sensor */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Sensor: {spec.sensorMode}</span>
        </div>

      </div>

    </div>
  );
};

export default XRayAlignmentCompass;

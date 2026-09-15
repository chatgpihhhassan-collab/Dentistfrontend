import React from 'react';
import { Compass, Crosshair, ArrowDown, ArrowLeft, ArrowRight, Layers, ShieldAlert, Radio } from 'lucide-react';

export const PROJECTION_ALIGNMENT_SPECS = {
  front: {
    id: 'front',
    label: 'Front View (Anterior)',
    teethRange: 'Teeth #6–11 (Maxillary) & #22–27 (Mandibular)',
    tubePosition: 'Direct Midline (In Front of Nose & Lips)',
    beamDirection: 'Frontal Sagittal Midline (0° Straight Center)',
    beamAngleDescription: 'Aim X-Ray cone directly at the center of the patient\'s face, perpendicular to the incisors.',
    verticalAngle: 'Maxilla (Upper): +40° to +45° (Down) • Mandible (Lower): -15° (Up)',
    horizontalAngle: '0° (Aligned with median dental plane)',
    sensorOrientation: 'Vertical (Portrait Mode)',
    sensorPosition: 'Lingual / Palatal (Behind incisors & canines)',
    activeFaceRule: 'White active CMOS sensor grid MUST face forward towards the X-Ray cone.',
    coneAngle: 0,
    coneSide: 'front',
    coneBadge: '0° Midline Cone',
    beamArrow: 'arrow-down'
  },
  left: {
    id: 'left',
    label: 'Left View (Left Posterior)',
    teethRange: 'Teeth #12–16 (Maxillary) & #17–21 (Mandibular)',
    tubePosition: 'Patient\'s Left Cheek (Buccal Aspect)',
    beamDirection: 'Left Cheek Inward (80°–90° Left Buccal Angle ⬅️)',
    beamAngleDescription: 'Aim X-Ray cone from the patient\'s left cheek inward, through the contact points of left premolars and molars.',
    verticalAngle: 'Bitewing: +10° (Down) • Upper Molars: +30° (Down) • Lower Molars: 0° to -5°',
    horizontalAngle: '80°–90° (Perpendicular to left molar arch)',
    sensorOrientation: 'Horizontal (Landscape Mode)',
    sensorPosition: 'Lingual side next to tongue along left dental arch',
    activeFaceRule: 'White active CMOS sensor grid MUST face outward towards the patient\'s left cheek.',
    coneAngle: 90,
    coneSide: 'left',
    coneBadge: '80°–90° Left Cheek Cone',
    beamArrow: 'arrow-left'
  },
  right: {
    id: 'right',
    label: 'Right View (Right Posterior)',
    teethRange: 'Teeth #1–5 (Maxillary) & #28–32 (Mandibular)',
    tubePosition: 'Patient\'s Right Cheek (Buccal Aspect)',
    beamDirection: 'Right Cheek Inward (80°–90° Right Buccal Angle ➡️)',
    beamAngleDescription: 'Aim X-Ray cone from the patient\'s right cheek inward, through the contact points of right premolars and molars.',
    verticalAngle: 'Bitewing: +10° (Down) • Upper Molars: +30° (Down) • Lower Molars: 0° to -5°',
    horizontalAngle: '80°–90° (Perpendicular to right molar arch)',
    sensorOrientation: 'Horizontal (Landscape Mode)',
    sensorPosition: 'Lingual side next to tongue along right dental arch',
    activeFaceRule: 'White active CMOS sensor grid MUST face outward towards the patient\'s right cheek.',
    coneAngle: 270,
    coneSide: 'right',
    coneBadge: '80°–90° Right Cheek Cone',
    beamArrow: 'arrow-right'
  }
};

/**
 * XRayAlignmentCompass
 * Visual SVG diagram and clinical positioning metrics showing exactly where the
 * X-Ray Tube Head (Cone/Camera) and the Nano-Pix sensor are positioned for each projection.
 */
export const XRayAlignmentCompass = ({ activeSlotKey = 'front', selectedTooth = '8', compact = false }) => {
  const spec = PROJECTION_ALIGNMENT_SPECS[activeSlotKey] || PROJECTION_ALIGNMENT_SPECS.front;

  return (
    <div className={`bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col ${compact ? 'p-3' : 'p-4'}`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">
              X-Ray Tube Head & Beam Direction
            </span>
            <span className="text-[10px] text-slate-400">
              Camera / Tube Head Angle for {spec.label}
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
          {spec.coneBadge}
        </span>
      </div>

      {/* Main Alignment Layout (Diagram + Specs) */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'} gap-4 items-center`}>
        
        {/* Visual 2D Patient Head & Arch SVG Schematic */}
        <div className={`${compact ? 'w-full' : 'md:col-span-5'} flex flex-col items-center justify-center bg-slate-900/80 rounded-xl p-3 border border-slate-800 relative`}>
          <div className="w-full max-w-[210px] aspect-square relative flex items-center justify-center">
            
            <svg viewBox="0 0 200 200" className="w-full h-full select-none">
              <defs>
                {/* Radiation beam radial glow */}
                <radialGradient id="beamGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="beamConeFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="beamConeLeft" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="beamConeRight" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Patient Head Contour (Top-Down View) */}
              <ellipse 
                cx="100" 
                cy="105" 
                rx="72" 
                ry="78" 
                fill="#0F172A" 
                stroke="#334155" 
                strokeWidth="2" 
                strokeDasharray="4 3" 
              />

              {/* Patient Nose (Top / Anterior indicator) */}
              <path 
                d="M 94 27 L 100 16 L 106 27 Z" 
                fill="#1E293B" 
                stroke="#475569" 
                strokeWidth="1.5" 
              />
              <text x="100" y="12" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">
                NOSE (FRONT)
              </text>

              {/* Patient Ears (Left ear is at top-down right, Right ear is at top-down left) */}
              {/* Patient's Right Ear (viewer left) */}
              <path d="M 28 95 C 22 95, 22 115, 28 115" fill="none" stroke="#475569" strokeWidth="2" />
              <text x="16" y="108" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">
                R
              </text>

              {/* Patient's Left Ear (viewer right) */}
              <path d="M 172 95 C 178 95, 178 115, 172 115" fill="none" stroke="#475569" strokeWidth="2" />
              <text x="184" y="108" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">
                L
              </text>

              {/* Dental Arch (U-Shape curve) */}
              <path 
                d="M 64 140 C 64 80, 136 80, 136 140" 
                fill="none" 
                stroke="#1E293B" 
                strokeWidth="16" 
                strokeLinecap="round" 
              />

              {/* DENTAL ARCH SECTORS */}
              {/* Right Sector (#1-5, #28-32) */}
              <path 
                d="M 64 140 C 64 100, 75 88, 85 82" 
                fill="none" 
                stroke={activeSlotKey === 'right' ? '#2DD4BF' : '#475569'} 
                strokeWidth={activeSlotKey === 'right' ? '12' : '8'} 
                strokeLinecap="round" 
                className={activeSlotKey === 'right' ? 'filter drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]' : ''}
              />

              {/* Front Sector (#6-11, #22-27) */}
              <path 
                d="M 85 82 C 92 78, 108 78, 115 82" 
                fill="none" 
                stroke={activeSlotKey === 'front' ? '#2DD4BF' : '#475569'} 
                strokeWidth={activeSlotKey === 'front' ? '12' : '8'} 
                strokeLinecap="round" 
                className={activeSlotKey === 'front' ? 'filter drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]' : ''}
              />

              {/* Left Sector (#12-16, #17-21) */}
              <path 
                d="M 115 82 C 125 88, 136 100, 136 140" 
                fill="none" 
                stroke={activeSlotKey === 'left' ? '#2DD4BF' : '#475569'} 
                strokeWidth={activeSlotKey === 'left' ? '12' : '8'} 
                strokeLinecap="round" 
                className={activeSlotKey === 'left' ? 'filter drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]' : ''}
              />

              {/* SENSOR PLACEMENT (Lingual side) */}
              {activeSlotKey === 'front' && (
                <g>
                  {/* Lingual Sensor behind anterior teeth */}
                  <rect x="91" y="87" width="18" height="5" rx="2" fill="#047857" stroke="#34D399" strokeWidth="1.5" />
                  <circle cx="100" cy="89.5" r="1.5" fill="#FFFFFF" />
                  <text x="100" y="100" textAnchor="middle" fill="#34D399" fontSize="7" fontWeight="bold">
                    SENSOR
                  </text>
                </g>
              )}

              {activeSlotKey === 'left' && (
                <g>
                  {/* Lingual Sensor on left tongue side */}
                  <rect x="119" y="106" width="6" height="22" rx="2" fill="#047857" stroke="#34D399" strokeWidth="1.5" />
                  <circle cx="122" cy="117" r="1.5" fill="#FFFFFF" />
                  <text x="112" y="120" textAnchor="middle" fill="#34D399" fontSize="7" fontWeight="bold">
                    SENSOR
                  </text>
                </g>
              )}

              {activeSlotKey === 'right' && (
                <g>
                  {/* Lingual Sensor on right tongue side */}
                  <rect x="75" y="106" width="6" height="22" rx="2" fill="#047857" stroke="#34D399" strokeWidth="1.5" />
                  <circle cx="78" cy="117" r="1.5" fill="#FFFFFF" />
                  <text x="88" y="120" textAnchor="middle" fill="#34D399" fontSize="7" fontWeight="bold">
                    SENSOR
                  </text>
                </g>
              )}

              {/* X-RAY TUBE HEAD CONE & RADIATION BEAM */}
              {activeSlotKey === 'front' && (
                <g>
                  {/* Radiation cone beam */}
                  <polygon points="85,38 115,38 120,78 80,78" fill="url(#beamConeFront)" />
                  {/* Tube Head Housing */}
                  <rect x="88" y="22" width="24" height="16" rx="3" fill="#D97706" stroke="#FBBF24" strokeWidth="1.5" />
                  <circle cx="100" cy="30" r="3" fill="#FEF3C7" />
                  {/* Beam arrows */}
                  <line x1="100" y1="40" x2="100" y2="70" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
                  <polygon points="100,74 97,68 103,68" fill="#F59E0B" />
                  <text x="100" y="20" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="black">
                    X-RAY CONE (0°)
                  </text>
                </g>
              )}

              {activeSlotKey === 'left' && (
                <g>
                  {/* Radiation cone beam from left cheek */}
                  <polygon points="168,105 168,135 130,138 130,102" fill="url(#beamConeLeft)" />
                  {/* Tube Head Housing on Patient's Left Cheek (Viewer Right) */}
                  <rect x="168" y="108" width="16" height="24" rx="3" fill="#D97706" stroke="#FBBF24" strokeWidth="1.5" />
                  <circle cx="176" cy="120" r="3" fill="#FEF3C7" />
                  {/* Beam arrows pointing left */}
                  <line x1="166" y1="120" x2="136" y2="120" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
                  <polygon points="132,120 138,117 138,123" fill="#F59E0B" />
                  <text x="176" y="142" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="black">
                    TUBE (LEFT)
                  </text>
                </g>
              )}

              {activeSlotKey === 'right' && (
                <g>
                  {/* Radiation cone beam from right cheek */}
                  <polygon points="32,105 32,135 70,138 70,102" fill="url(#beamConeRight)" />
                  {/* Tube Head Housing on Patient's Right Cheek (Viewer Left) */}
                  <rect x="16" y="108" width="16" height="24" rx="3" fill="#D97706" stroke="#FBBF24" strokeWidth="1.5" />
                  <circle cx="24" cy="120" r="3" fill="#FEF3C7" />
                  {/* Beam arrows pointing right */}
                  <line x1="34" y1="120" x2="64" y2="120" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
                  <polygon points="68,120 62,117 62,123" fill="#F59E0B" />
                  <text x="24" y="142" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="black">
                    TUBE (RIGHT)
                  </text>
                </g>
              )}

            </svg>

            {/* Live Indicator overlay */}
            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-mono text-teal-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              <span>Target: #{selectedTooth}</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 mt-1 text-center">
            Top-down anatomical orientation • Central ray beam path
          </span>
        </div>

        {/* Clinical Positioning Parameters & Rules */}
        <div className={`${compact ? 'w-full' : 'md:col-span-7'} space-y-2.5`}>
          
          {/* 1. Beam Trajectory */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wide text-white">
                1. X-Ray Tube Cone Aim (Horizontal)
              </span>
            </div>
            <p className="text-xs font-bold text-amber-300 ml-5">
              {spec.beamDirection}
            </p>
            <p className="text-[11px] text-slate-400 ml-5 mt-0.5 leading-snug">
              {spec.beamAngleDescription}
            </p>
          </div>

          {/* 2. Vertical Angulation */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px] font-black uppercase tracking-wide text-white">
                2. Tube Head Tilt (Vertical Angulation)
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-teal-300 ml-5">
              {spec.verticalAngle}
            </p>
          </div>

          {/* 3. Sensor Placement & Active Grid Face */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-black uppercase tracking-wide text-white">
                3. Nano-Pix Sensor Placement ({spec.sensorOrientation})
              </span>
            </div>
            <p className="text-[11px] text-slate-300 ml-5">
              📍 <strong className="text-white">Position:</strong> {spec.sensorPosition}
            </p>
            <p className="text-[11px] text-emerald-300 ml-5 mt-0.5 font-medium flex items-start gap-1">
              <span>⚠️</span>
              <span><strong>Active Side:</strong> {spec.activeFaceRule}</span>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default XRayAlignmentCompass;

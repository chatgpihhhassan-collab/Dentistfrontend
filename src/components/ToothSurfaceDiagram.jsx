import React from 'react';

/**
 * CLINICAL COLOR TOKENS & REPRESENTATION TABLE
 */
export const CLINICAL_CONDITIONS = {
  // 1. Restorative
  'Normal / Healthy': {
    category: 'Restorative',
    color: '#F3ECE2',
    borderColor: '#CBD5E1',
    description: 'Clean healthy enamel, no pathology',
    badge: 'Healthy'
  },
  'Filling - Amalgam': {
    category: 'Restorative',
    color: '#9AA5AB',
    borderColor: '#64748B',
    textColor: '#FFFFFF',
    description: 'Solid metallic silver-grey patch',
    badge: 'Amalgam'
  },
  'Filling - Composite': {
    category: 'Restorative',
    color: '#F8FAFC',
    borderColor: '#3B82F6',
    borderWidth: 2.5,
    textColor: '#1D4ED8',
    description: 'Tooth-colored with distinct blue outline',
    badge: 'Composite'
  },
  'Filling - GIC': {
    category: 'Restorative',
    color: '#E8D98A',
    borderColor: '#CA8A04',
    textColor: '#713F12',
    description: 'Pale glass ionomer yellow tint',
    badge: 'GIC'
  },
  'Crown - Metal': {
    category: 'Restorative',
    color: '#B0B0B0',
    borderColor: '#475569',
    textColor: '#FFFFFF',
    description: 'Full metallic silver crown',
    badge: 'Metal Cr.'
  },
  'Crown - PFM': {
    category: 'Restorative',
    color: '#B0B0B0',
    rimColor: '#FFFDF8',
    borderColor: '#475569',
    description: 'Porcelain-Fused-to-Metal (Grey base + white rim)',
    badge: 'PFM Cr.'
  },
  'Crown - Ceramic/Zirconia': {
    category: 'Restorative',
    color: '#FFFDF8',
    borderColor: '#38BDF8',
    textColor: '#0284C7',
    description: 'High-gloss translucent ivory zirconia/ceramic',
    badge: 'Zirconia Cr.'
  },
  'Veneer': {
    category: 'Restorative',
    color: '#CFEFF0',
    borderColor: '#06B6D4',
    textColor: '#0E7490',
    description: 'Facial aesthetic porcelain shell',
    badge: 'Veneer'
  },
  'Bridge / Pontic': {
    category: 'Restorative',
    color: '#8A8A8A',
    borderColor: '#334155',
    isDashed: true,
    badge: 'Pontic'
  },
  'Sealant': {
    category: 'Restorative',
    color: '#D9E8A0',
    borderColor: '#84CC16',
    textColor: '#3F6212',
    description: 'Preventive pit & fissure sealant resin',
    badge: 'Sealant'
  },
  'Post & Core': {
    category: 'Restorative',
    color: '#5A5A5A',
    borderColor: '#1E293B',
    textColor: '#FFFFFF',
    badge: 'Post & Core'
  },

  // 2. Endodontic
  'Root Canal Treated (RCT)': {
    category: 'Endodontic',
    color: '#6B4FA0',
    borderColor: '#4C1D95',
    textColor: '#FFFFFF',
    description: 'Endodontic obturation canal line & apex seal',
    badge: 'RCT'
  },
  'Pulp Exposure': {
    category: 'Endodontic',
    color: '#EF4444',
    borderColor: '#B91C1C',
    textColor: '#FFFFFF',
    description: 'Direct vital pulp exposure point',
    badge: 'Pulp Exp.'
  },
  'Periapical Lesion / Abscess': {
    category: 'Endodontic',
    color: '#3D0A0A',
    borderColor: '#EF4444',
    textColor: '#FCA5A5',
    description: 'Radiolucent apical infection halo',
    badge: 'PA Lesion'
  },

  // 3. Surgical
  'Missing Tooth': {
    category: 'Surgical',
    color: '#4A231A',
    borderColor: '#29140E',
    textColor: '#FED7AA',
    description: 'Empty alveolar socket cavity',
    badge: 'Missing'
  },
  'Extraction Indicated': {
    category: 'Surgical',
    color: '#B5122E',
    borderColor: '#7F1D1D',
    textColor: '#FFFFFF',
    description: 'Scheduled for extraction (Red X cross)',
    badge: 'Ext. Plan'
  },
  'Extracted (History)': {
    category: 'Surgical',
    color: '#C9C9C9',
    borderColor: '#94A3B8',
    isDashed: true,
    description: 'Previously extracted tooth in history',
    badge: 'Extracted'
  },
  'Dental Implant': {
    category: 'Surgical',
    color: '#0E8A80',
    borderColor: '#115E59',
    textColor: '#FFFFFF',
    description: 'Titanium fixture screw + abutment',
    badge: 'Implant'
  },
  'Retained Root': {
    category: 'Surgical',
    color: '#6B4029',
    borderColor: '#451A03',
    textColor: '#FFFFFF',
    description: 'Residual root tip in bone without crown',
    badge: 'Ret. Root'
  },

  // 4. Pathology
  'Caries (Decay)': {
    category: 'Pathology',
    color: '#8B5A2B',
    gradientEnd: '#1C110A',
    borderColor: '#451A03',
    textColor: '#FFFFFF',
    description: 'Active carious lesion (ICDAS 1-6)',
    badge: 'Caries'
  },
  'Fractured / Chipped': {
    category: 'Pathology',
    color: '#7A1626',
    borderColor: '#4C0519',
    textColor: '#FFFFFF',
    description: 'Enamel/dentin fracture crack line',
    badge: 'Fracture'
  },
  'Attrition / Abrasion': {
    category: 'Pathology',
    color: '#C9A66B',
    borderColor: '#78350F',
    textColor: '#451A03',
    description: 'Occlusal wear facet or cervical notch',
    badge: 'Wear Facet'
  },
  'Discoloration / Fluorosis': {
    category: 'Pathology',
    color: '#D8CBAE',
    borderColor: '#A8A29E',
    textColor: '#44403C',
    description: 'Fluorosis mottling or intrinsic stain',
    badge: 'Fluorosis'
  },
  'Root Resorption': {
    category: 'Pathology',
    color: '#EA8C1E',
    borderColor: '#C2410C',
    textColor: '#FFFFFF',
    description: 'Internal or cervical external resorption',
    badge: 'Resorption'
  },

  // 5. Periodontal
  'Mobility Grade I/II/III': {
    category: 'Periodontal',
    color: '#F59E0B',
    borderColor: '#D97706',
    textColor: '#FFFFFF',
    description: 'Clinical tooth mobility index',
    badge: 'Mobility'
  },
  'Gingival Recession': {
    category: 'Periodontal',
    color: '#E0665A',
    borderColor: '#9F1239',
    textColor: '#FFFFFF',
    description: 'Marginal gingival attachment loss',
    badge: 'Recession'
  },
  'Calculus / Plaque': {
    category: 'Periodontal',
    color: '#B08D3E',
    borderColor: '#713F12',
    textColor: '#FFFFFF',
    description: 'Subgingival or supragingival calculus band',
    badge: 'Calculus'
  },

  // 6. Developmental
  'Impacted / Unerupted': {
    category: 'Developmental',
    color: '#2F6FED',
    borderColor: '#1D4ED8',
    isDashed: true,
    textColor: '#FFFFFF',
    badge: 'Impacted'
  },
  'Supernumerary Tooth': {
    category: 'Developmental',
    color: '#D97706',
    borderColor: '#B45309',
    textColor: '#FFFFFF',
    badge: 'Supernumerary'
  },
  'Malposition / Rotation': {
    category: 'Developmental',
    color: '#3B82F6',
    borderColor: '#1D4ED8',
    textColor: '#FFFFFF',
    badge: 'Rotated'
  },
  'Diastema (Gap)': {
    category: 'Developmental',
    color: '#6B7280',
    borderColor: '#374151',
    textColor: '#FFFFFF',
    badge: 'Diastema'
  },

  // 7. Appliance
  'Ortho Bracket': {
    category: 'Appliance',
    color: '#C0C0C0',
    borderColor: '#475569',
    textColor: '#0F172A',
    badge: 'Bracket'
  },
  'Orthodontic Bracket': {
    category: 'Appliance',
    color: '#C0C0C0',
    borderColor: '#475569',
    textColor: '#0F172A',
    badge: 'Bracket'
  },
  'Space Maintainer': {
    category: 'Appliance',
    color: '#93C5FD',
    borderColor: '#2563EB',
    textColor: '#1E40AF',
    badge: 'Space Maint.'
  },
  'Denture Section': {
    category: 'Appliance',
    color: '#D8A9A0',
    borderColor: '#9F1239',
    textColor: '#881337',
    badge: 'Denture'
  },

  // Pediatric & Specific Procedures
  'Pulpotomy (MTA)': {
    category: 'Endodontic',
    color: '#7C3AED',
    borderColor: '#581C87',
    textColor: '#FFFFFF',
    badge: 'Pulpotomy'
  },
  'Stainless Steel Crown (SSC)': {
    category: 'Restorative',
    color: '#94A3B8',
    borderColor: '#475569',
    textColor: '#FFFFFF',
    badge: 'SSC Crown'
  }
};

/**
 * Pediatric (Primary Deciduous Teeth A–T) Clinical Categories
 */
export const PEDIATRIC_CLINICAL_CATEGORIES = [
  { id: 'Restorative', icon: '🛠️', title: 'Restorative', color: 'from-blue-500 to-indigo-600' },
  { id: 'Endodontic',  icon: '⚡', title: 'Endodontic',  color: 'from-purple-500 to-violet-600' },
  { id: 'Appliance',   icon: '🦷', title: 'Appliance',   color: 'from-amber-500 to-orange-600' },
  { id: 'Surgical',    icon: '🩺', title: 'Surgical',    color: 'from-rose-500 to-red-600' },
  { id: 'Pathology',   icon: '🔬', title: 'Pathology',   color: 'from-pink-500 to-rose-600' }
];

/**
 * Pediatric (Primary Deciduous Teeth A–T) Approved Procedures
 */
export const PEDIATRIC_CLINICAL_CONDITIONS = {
  // Restorative
  'Normal / Healthy': {
    category: 'Restorative',
    color: '#F3ECE2',
    borderColor: '#CBD5E1',
    description: 'Clean healthy primary enamel',
    badge: 'Healthy'
  },
  'Stainless Steel Crown (SSC)': {
    category: 'Restorative',
    color: '#94A3B8',
    borderColor: '#475569',
    textColor: '#FFFFFF',
    description: 'Preformed SSC crown for primary molar',
    badge: 'SSC Crown'
  },
  'Pediatric Zirconia Crown': {
    category: 'Restorative',
    color: '#FFFDF8',
    borderColor: '#38BDF8',
    textColor: '#0284C7',
    description: 'Aesthetic white strip/zirconia crown',
    badge: 'Zirconia Cr.'
  },
  'Filling - GIC': {
    category: 'Restorative',
    color: '#E8D98A',
    borderColor: '#CA8A04',
    textColor: '#713F12',
    description: 'Fluoride-releasing glass ionomer cement',
    badge: 'GIC'
  },
  'Filling - Composite': {
    category: 'Restorative',
    color: '#F8FAFC',
    borderColor: '#3B82F6',
    borderWidth: 2.5,
    textColor: '#1D4ED8',
    description: 'Tooth-colored resin restoration',
    badge: 'Composite'
  },
  'Sealant': {
    category: 'Restorative',
    color: '#D9E8A0',
    borderColor: '#84CC16',
    textColor: '#3F6212',
    description: 'Pit & fissure preventive sealant barrier',
    badge: 'Sealant'
  },
  'Fluoride Varnish / SDF': {
    category: 'Restorative',
    color: '#BAE6FD',
    borderColor: '#0284C7',
    textColor: '#0369A1',
    description: 'Topical 5% NaF / Silver Diamine Fluoride',
    badge: 'Fluoride'
  },

  // Endodontic (Pediatric Resorbable Protocols)
  'Pulpotomy (MTA)': {
    category: 'Endodontic',
    color: '#7C3AED',
    borderColor: '#581C87',
    textColor: '#FFFFFF',
    description: 'Coronal pulp amputation with MTA medicament',
    badge: 'Pulpotomy'
  },
  'Pulpectomy (Resorbable)': {
    category: 'Endodontic',
    color: '#9333EA',
    borderColor: '#6B21A8',
    textColor: '#FFFFFF',
    description: 'Complete canal debridement with ZOE / Vitapex paste',
    badge: 'Pulpectomy'
  },
  'Pulp Capping': {
    category: 'Endodontic',
    color: '#C084FC',
    borderColor: '#7E22CE',
    textColor: '#FFFFFF',
    description: 'Direct / Indirect biocompatible pulp cap',
    badge: 'Pulp Cap'
  },
  'Pulp Exposure': {
    category: 'Endodontic',
    color: '#EF4444',
    borderColor: '#B91C1C',
    textColor: '#FFFFFF',
    description: 'Vital pulp exposure point',
    badge: 'Pulp Exp.'
  },
  'Periapical Lesion / Abscess': {
    category: 'Endodontic',
    color: '#3D0A0A',
    borderColor: '#EF4444',
    textColor: '#FCA5A5',
    description: 'Periapical radiolucency / draining sinus',
    badge: 'PA Lesion'
  },

  // Appliance (Space Preservation)
  'Space Maintainer': {
    category: 'Appliance',
    color: '#93C5FD',
    borderColor: '#2563EB',
    textColor: '#1E40AF',
    description: 'Fixed Band & Loop / Distal Shoe space maintainer',
    badge: 'Space Maint.'
  },
  'Habit Appliance': {
    category: 'Appliance',
    color: '#FDE047',
    borderColor: '#CA8A04',
    textColor: '#854D0E',
    description: 'Tongue crib / thumb sucking habit breaker',
    badge: 'Habit App.'
  },

  // Surgical
  'Missing Tooth': {
    category: 'Surgical',
    color: '#4A231A',
    borderColor: '#29140E',
    textColor: '#FED7AA',
    description: 'Naturally exfoliated or absent tooth',
    badge: 'Missing'
  },
  'Extraction Indicated': {
    category: 'Surgical',
    color: '#B5122E',
    borderColor: '#7F1D1D',
    textColor: '#FFFFFF',
    description: 'Scheduled for extraction of unrestorable tooth',
    badge: 'Ext. Plan'
  },
  'Extracted (History)': {
    category: 'Surgical',
    color: '#C9C9C9',
    borderColor: '#94A3B8',
    isDashed: true,
    description: 'Previously extracted primary tooth',
    badge: 'Extracted'
  },

  // Pathology
  'Caries (Decay)': {
    category: 'Pathology',
    color: '#8B5A2B',
    gradientEnd: '#1C110A',
    borderColor: '#451A03',
    textColor: '#FFFFFF',
    description: 'Early Childhood Caries (ECC) or cavitation',
    badge: 'ECC Caries'
  },
  'Fractured / Chipped': {
    category: 'Pathology',
    color: '#7A1626',
    borderColor: '#4C0519',
    textColor: '#FFFFFF',
    description: 'Traumatic incisal enamel fracture',
    badge: 'Fracture'
  }
};

/**
 * Grouped Clinical Categories for Organized Medical EHR Palette
 */
export const CLINICAL_CATEGORIES = [
  { id: 'Restorative',   icon: '🛠️', title: 'Restorative',   color: 'from-blue-500 to-indigo-600' },
  { id: 'Endodontic',    icon: '⚡', title: 'Endodontic',    color: 'from-purple-500 to-violet-600' },
  { id: 'Surgical',      icon: '🩺', title: 'Surgical',      color: 'from-rose-500 to-red-600' },
  { id: 'Pathology',     icon: '🔬', title: 'Pathology',     color: 'from-amber-600 to-stone-700' },
  { id: 'Periodontal',   icon: '🩸', title: 'Periodontal',   color: 'from-emerald-500 to-teal-600' },
  { id: 'Developmental', icon: '📐', title: 'Developmental', color: 'from-cyan-500 to-sky-600' },
  { id: 'Appliance',     icon: '🦷', title: 'Appliance',     color: 'from-slate-500 to-zinc-600' }
];

/**
 * 5-Surface Anatomical Diamond / Cross Diagram Component
 * Allows marking conditions on specific dental surfaces (O, M, D, B/F, L/P)
 */
export default function ToothSurfaceDiagram({
  toothNumber,
  surfaceData = {}, // { O: 'Caries (Decay)', M: 'Filling - Composite', ... }
  onSurfaceClick = () => {},
  selectedCondition = 'Caries (Decay)',
  interactive = true,
  size = 140
}) {
  const isPediatricTooth = typeof toothNumber === 'string' && isNaN(parseInt(toothNumber));
  const tUpper = String(toothNumber).toUpperCase();

  let isUpper = true;
  let isRight = true;

  if (isPediatricTooth) {
    // Upper Maxilla: A-J, Lower Mandible: K-T
    isUpper = ['A','B','C','D','E','F','G','H','I','J'].includes(tUpper);
    // Upper Right (A-E) or Lower Right (P-T)
    isRight = ['A','B','C','D','E','P','Q','R','S','T'].includes(tUpper);
  } else {
    const n = parseInt(toothNumber, 10) || 1;
    isUpper = n <= 16;
    isRight = (n >= 1 && n <= 8) || (n >= 25 && n <= 32);
  }

  // Dental orientation labels:
  // Buccal (outer) is UP for Maxilla, DOWN for Mandible
  // Lingual (inner) is DOWN for Maxilla, UP for Mandible
  // Mesial is TOWARDS midline (left for right quadrant, right for left quadrant)
  const topLabel = isUpper ? 'B (Buccal)' : 'L (Lingual)';
  const bottomLabel = isUpper ? 'L (Palatal)' : 'B (Buccal)';
  const leftLabel = isRight ? 'D (Distal)' : 'M (Mesial)';
  const rightLabel = isRight ? 'M (Mesial)' : 'D (Distal)';

  const topKey = isUpper ? 'B' : 'L';
  const bottomKey = isUpper ? 'L' : 'B';
  const leftKey = isRight ? 'D' : 'M';
  const rightKey = isRight ? 'M' : 'D';

  const getSurfaceColor = (surfKey) => {
    const rawCond = surfaceData[surfKey];
    if (!rawCond || rawCond === 'Normal / Healthy' || rawCond === 'Healthy' || rawCond === 'Sound' || rawCond === 'Intact') {
      return { fill: '#F8FAFC', stroke: '#CBD5E1', textFill: '#64748B', isComposite: false };
    }

    const lower = String(rawCond).toLowerCase();
    if (lower.includes('pulpotomy') || lower.includes('mta')) {
      return { fill: '#7C3AED', stroke: '#4C1D95', textFill: '#FFFFFF' };
    }
    if (lower.includes('ssc') || lower.includes('stainless')) {
      return { fill: '#64748B', stroke: '#334155', textFill: '#FFFFFF' };
    }
    if (lower.includes('space')) {
      return { fill: '#93C5FD', stroke: '#2563EB', textFill: '#1E40AF' };
    }
    if (lower.includes('caries') || lower.includes('decay') || lower.includes('ecc') || lower.includes('cavity') || lower.includes('keera')) {
      return { fill: '#EF4444', stroke: '#991B1B', textFill: '#FFFFFF', isDecay: true };
    }
    if (lower.includes('composite') || lower.includes('fill') || lower.includes('resin')) {
      return { fill: '#2563EB', stroke: '#1D4ED8', textFill: '#FFFFFF', isComposite: true };
    }
    if (lower.includes('amalgam')) {
      return { fill: '#64748B', stroke: '#334155', textFill: '#FFFFFF' };
    }
    if (lower.includes('gic')) {
      return { fill: '#F59E0B', stroke: '#B45309', textFill: '#FFFFFF' };
    }
    if (lower.includes('rct') || lower.includes('canal') || lower.includes('endo') || lower.includes('root canal')) {
      return { fill: '#7C3AED', stroke: '#4C1D95', textFill: '#FFFFFF' };
    }
    if (lower.includes('crown') || lower.includes('bridge') || lower.includes('zirconia')) {
      return { fill: '#D97706', stroke: '#B45309', textFill: '#FFFFFF' };
    }
    if (lower.includes('implant')) {
      return { fill: '#0E8A80', stroke: '#0F766E', textFill: '#FFFFFF' };
    }
    if (lower.includes('bracket') || lower.includes('ortho')) {
      return { fill: '#0284C7', stroke: '#0369A1', textFill: '#FFFFFF' };
    }
    if (lower.includes('varnish') || lower.includes('sealant')) {
      return { fill: '#06B6D4', stroke: '#0891B2', textFill: '#FFFFFF' };
    }
    if (lower.includes('miss') || lower.includes('extract') || lower.includes('exfoliat') || lower.includes('absent')) {
      return { fill: '#DC2626', stroke: '#991B1B', textFill: '#FFFFFF' };
    }

    return { fill: '#2563EB', stroke: '#1D4ED8', textFill: '#FFFFFF' };
  };

  const handleZoneClick = (surfKey) => {
    if (!interactive) return;
    onSurfaceClick(surfKey, selectedCondition);
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
        {topLabel}
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className="text-[10px] font-black text-slate-500 w-16 text-right">
          {leftLabel}
        </span>

        {/* 5-Zone Geometric SVG */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="filter drop-shadow-sm cursor-pointer"
        >
          {/* Top Surface Zone */}
          <polygon
            points="10,10 90,10 70,30 30,30"
            fill={getSurfaceColor(topKey).fill}
            stroke={getSurfaceColor(topKey).stroke}
            strokeWidth={getSurfaceColor(topKey).isComposite ? "2.5" : "1.2"}
            className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
            onClick={() => handleZoneClick(topKey)}
          >
            <title>{`${topKey} Surface: ${surfaceData[topKey] || 'Healthy'}`}</title>
          </polygon>
          <text x="50" y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill={getSurfaceColor(topKey).textFill} pointerEvents="none">
            {topKey}
          </text>

          {/* Bottom Surface Zone */}
          <polygon
            points="30,70 70,70 90,90 10,90"
            fill={getSurfaceColor(bottomKey).fill}
            stroke={getSurfaceColor(bottomKey).stroke}
            strokeWidth={getSurfaceColor(bottomKey).isComposite ? "2.5" : "1.2"}
            className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
            onClick={() => handleZoneClick(bottomKey)}
          >
            <title>{`${bottomKey} Surface: ${surfaceData[bottomKey] || 'Healthy'}`}</title>
          </polygon>
          <text x="50" y="82" textAnchor="middle" fontSize="8" fontWeight="bold" fill={getSurfaceColor(bottomKey).textFill} pointerEvents="none">
            {bottomKey}
          </text>

          {/* Left Surface Zone */}
          <polygon
            points="10,10 30,30 30,70 10,90"
            fill={getSurfaceColor(leftKey).fill}
            stroke={getSurfaceColor(leftKey).stroke}
            strokeWidth={getSurfaceColor(leftKey).isComposite ? "2.5" : "1.2"}
            className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
            onClick={() => handleZoneClick(leftKey)}
          >
            <title>{`${leftKey} Surface: ${surfaceData[leftKey] || 'Healthy'}`}</title>
          </polygon>
          <text x="22" y="53" textAnchor="middle" fontSize="8" fontWeight="bold" fill={getSurfaceColor(leftKey).textFill} pointerEvents="none">
            {leftKey}
          </text>

          {/* Right Surface Zone */}
          <polygon
            points="70,30 90,10 90,90 70,70"
            fill={getSurfaceColor(rightKey).fill}
            stroke={getSurfaceColor(rightKey).stroke}
            strokeWidth={getSurfaceColor(rightKey).isComposite ? "2.5" : "1.2"}
            className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
            onClick={() => handleZoneClick(rightKey)}
          >
            <title>{`${rightKey} Surface: ${surfaceData[rightKey] || 'Healthy'}`}</title>
          </polygon>
          <text x="78" y="53" textAnchor="middle" fontSize="8" fontWeight="bold" fill={getSurfaceColor(rightKey).textFill} pointerEvents="none">
            {rightKey}
          </text>

          {/* Center Occlusal / Incisal Zone */}
          <polygon
            points="30,30 70,30 70,70 30,70"
            fill={getSurfaceColor('O').fill}
            stroke={getSurfaceColor('O').stroke}
            strokeWidth={getSurfaceColor('O').isComposite ? "2.5" : "1.5"}
            className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
            onClick={() => handleZoneClick('O')}
          >
            <title>{`Occlusal (O) Surface: ${surfaceData['O'] || 'Healthy'}`}</title>
          </polygon>
          <text x="50" y="53" textAnchor="middle" fontSize="9" fontWeight="black" fill={getSurfaceColor('O').textFill} pointerEvents="none">
            O
          </text>
        </svg>

        <span className="text-[10px] font-black text-slate-500 w-16 text-left">
          {rightLabel}
        </span>
      </div>

      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1">
        {bottomLabel}
      </div>
    </div>
  );
}

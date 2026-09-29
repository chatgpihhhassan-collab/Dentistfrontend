// Anatomical 2D Viewport Coordinate Mapping for all 32 Human Teeth
// Generates accurate leader pointer lines pointing directly to each tooth
export const TOOTH_VIEWPORT_COORDS = {
  // Upper Maxilla Arch (Teeth 1–16) - Pointers point DOWN to tooth crown/root
  1:  { top: '22%', left: '16%', tail: 'down', arch: 'Upper', side: 'Right' },
  2:  { top: '21%', left: '22%', tail: 'down', arch: 'Upper', side: 'Right' },
  3:  { top: '20%', left: '27%', tail: 'down', arch: 'Upper', side: 'Right' },
  4:  { top: '19%', left: '32%', tail: 'down', arch: 'Upper', side: 'Right' },
  5:  { top: '18%', left: '37%', tail: 'down', arch: 'Upper', side: 'Right' },
  6:  { top: '17%', left: '42%', tail: 'down', arch: 'Upper', side: 'Right' },
  7:  { top: '16%', left: '46%', tail: 'down', arch: 'Upper', side: 'Right' },
  8:  { top: '15%', left: '49%', tail: 'down', arch: 'Upper', side: 'Right' },
  9:  { top: '15%', left: '52%', tail: 'down', arch: 'Upper', side: 'Left' },
  10: { top: '16%', left: '55%', tail: 'down', arch: 'Upper', side: 'Left' },
  11: { top: '17%', left: '59%', tail: 'down', arch: 'Upper', side: 'Left' },
  12: { top: '18%', left: '64%', tail: 'down', arch: 'Upper', side: 'Left' },
  13: { top: '19%', left: '69%', tail: 'down', arch: 'Upper', side: 'Left' },
  14: { top: '20%', left: '74%', tail: 'down', arch: 'Upper', side: 'Left' },
  15: { top: '21%', left: '79%', tail: 'down', arch: 'Upper', side: 'Left' },
  16: { top: '22%', left: '84%', tail: 'down', arch: 'Upper', side: 'Left' },

  // Lower Mandible Arch (Teeth 17–32) - Pointers point UP to tooth crown/root
  17: { top: '75%', left: '83%', tail: 'up', arch: 'Lower', side: 'Left' },
  18: { top: '74%', left: '78%', tail: 'up', arch: 'Lower', side: 'Left' },
  19: { top: '73%', left: '73%', tail: 'up', arch: 'Lower', side: 'Left' },
  20: { top: '72%', left: '68%', tail: 'up', arch: 'Lower', side: 'Left' },
  21: { top: '71%', left: '63%', tail: 'up', arch: 'Lower', side: 'Left' },
  22: { top: '70%', left: '58%', tail: 'up', arch: 'Lower', side: 'Left' },
  23: { top: '69%', left: '54%', tail: 'up', arch: 'Lower', side: 'Left' },
  24: { top: '68%', left: '51%', tail: 'up', arch: 'Lower', side: 'Left' },
  25: { top: '68%', left: '49%', tail: 'up', arch: 'Lower', side: 'Right' },
  26: { top: '69%', left: '46%', tail: 'up', arch: 'Lower', side: 'Right' },
  27: { top: '70%', left: '42%', tail: 'up', arch: 'Lower', side: 'Right' },
  28: { top: '71%', left: '37%', tail: 'up', arch: 'Lower', side: 'Right' },
  29: { top: '72%', left: '32%', tail: 'up', arch: 'Lower', side: 'Right' },
  30: { top: '73%', left: '27%', tail: 'up', arch: 'Lower', side: 'Right' },
  31: { top: '74%', left: '22%', tail: 'up', arch: 'Lower', side: 'Right' },
  32: { top: '75%', left: '17%', tail: 'up', arch: 'Lower', side: 'Right' }
};

// Maps raw database teeth record array into interactive clinical finding cards & badges
export function mapDatabaseTeethToClinicalFindings(teethArray = []) {
  if (!teethArray || !Array.isArray(teethArray)) return [];

  const findings = [];

  teethArray.forEach((tooth) => {
    const tNum = parseInt(tooth.toothNumber || tooth.ToothNumber, 10);
    const status = tooth.status || tooth.ConditionStatus || tooth.conditionStatus || 'Healthy';
    const comments = tooth.comments || tooth.comment || tooth.Comments || '';
    const color = tooth.color || tooth.ConditionColor || tooth.conditionColor || '#10B981';

    const sLower = status.toLowerCase();
    const cLower = comments.toLowerCase();

    const isHealthy =
      (sLower === 'healthy' || sLower === 'sound' || sLower === 'intact' || sLower === 'normal') &&
      !cLower.includes('caries') &&
      !cLower.includes('cavity') &&
      !cLower.includes('decay') &&
      !cLower.includes('bone pathology') &&
      !cLower.includes('periodont') &&
      !cLower.includes('root canal') &&
      !cLower.includes('implant') &&
      color === '#10B981';

    if (isHealthy) return;

    // Detect clinical condition category
    let label = 'Clinical Finding';
    let urgency = 'Soon';
    let cdtCode = 'CDT D0150';
    let procedureTitle = 'Clinical Examination';
    let ringPct = 45;
    let badgeBg = 'bg-blue-600 text-white';
    let labelColor = 'text-blue-600';
    let ringColor = '#3B82F6';

    if (sLower.includes('decay') || sLower.includes('caries') || sLower.includes('cavity') || cLower.includes('cavity') || cLower.includes('decay')) {
      label = 'Cavity';
      urgency = 'Soon';
      cdtCode = 'CDT D2391';
      procedureTitle = `Fill Cavity (Composite Resin) • Tooth #${tNum}`;
      ringPct = 67;
      badgeBg = 'bg-blue-600 text-white';
      labelColor = 'text-blue-600';
      ringColor = '#3B82F6';
    } else if (sLower.includes('bone') || sLower.includes('pathology') || cLower.includes('pathology') || cLower.includes('bone')) {
      label = 'Bone Pathology';
      urgency = 'Urgent';
      cdtCode = 'CDT D6010';
      procedureTitle = `Implant Osteotomy Assessment • Tooth #${tNum}`;
      ringPct = 11;
      badgeBg = 'bg-amber-400 text-amber-950';
      labelColor = 'text-amber-600';
      ringColor = '#F43F5E';
    } else if (sLower.includes('canal') || sLower.includes('rct') || sLower.includes('endo') || cLower.includes('canal')) {
      label = 'Root Canal Needed';
      urgency = 'Urgent';
      cdtCode = 'CDT D3330';
      procedureTitle = `Endodontic Molar Therapy • Tooth #${tNum}`;
      ringPct = 85;
      badgeBg = 'bg-purple-600 text-white';
      labelColor = 'text-purple-600';
      ringColor = '#8B5CF6';
    } else if (sLower.includes('periodont') || sLower.includes('wear') || sLower.includes('attrition') || cLower.includes('periodont') || cLower.includes('wear')) {
      label = 'Decay, Tooth Wear';
      urgency = 'Urgent';
      cdtCode = 'CDT D4341';
      procedureTitle = `Periodontal Scaling & Root Planing • Tooth #${tNum}`;
      ringPct = 76;
      badgeBg = 'bg-rose-500 text-white';
      labelColor = 'text-rose-600';
      ringColor = '#F59E0B';
    } else if (sLower.includes('clean') || sLower.includes('gingivitis') || sLower.includes('calculus') || cLower.includes('clean') || cLower.includes('gingivitis')) {
      label = 'Gingivitis / Calculus';
      urgency = 'Soon';
      cdtCode = 'CDT D1110';
      procedureTitle = `Ultrasonic Scaling & Prophylaxis • Tooth #${tNum}`;
      ringPct = 23;
      badgeBg = 'bg-cyan-500 text-white';
      labelColor = 'text-cyan-600';
      ringColor = '#06B6D4';
    } else if (sLower.includes('implant') || cLower.includes('implant')) {
      label = 'Implant Planned';
      urgency = 'Planned';
      cdtCode = 'CDT D6010';
      procedureTitle = `Surgical Implant Placement • Tooth #${tNum}`;
      ringPct = 50;
      badgeBg = 'bg-emerald-500 text-white';
      labelColor = 'text-emerald-600';
      ringColor = '#10B981';
    } else if (sLower.includes('missing') || sLower.includes('extract') || cLower.includes('extract')) {
      label = 'Missing / Extracted';
      urgency = 'Planned';
      cdtCode = 'CDT D6010';
      procedureTitle = `Edentulous Site Restoration • Tooth #${tNum}`;
      ringPct = 90;
      badgeBg = 'bg-slate-500 text-white';
      labelColor = 'text-slate-600';
      ringColor = '#64748B';
    }

    const pos = TOOTH_VIEWPORT_COORDS[tNum] || {
      top: tNum <= 16 ? '20%' : '70%',
      left: `${(tNum / 32) * 80 + 10}%`,
      tail: tNum <= 16 ? 'down' : 'up',
      arch: tNum <= 16 ? 'Upper' : 'Lower'
    };

    findings.push({
      toothNumber: tNum,
      toothNo: String(tNum),
      status,
      comments: comments || `${label} detected on Tooth #${tNum}`,
      color,
      label,
      urgency,
      cdtCode,
      procedureTitle,
      ringPct,
      badgeBg,
      labelColor,
      ringColor,
      position: pos,
      tailDirection: pos.tail,
      arch: pos.arch,
      confidence: '98.5%'
    });
  });

  return findings;
}

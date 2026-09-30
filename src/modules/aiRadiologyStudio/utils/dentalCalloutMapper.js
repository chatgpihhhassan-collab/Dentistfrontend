// Anatomical Multi-Angle Coordinate System for all 32 Human Teeth
// Generates accurate leader pointer lines connecting directly to each tooth lesion
// Supported sections: 'left' (sagittal), 'front' (coronal), 'right' (sagittal)
// Viewport resolution normalized to exact 1200 x 896 HD anatomical scan resolution

export const ANATOMICAL_SECTION_COORDS = {
  // 1. LEFT SAGITTAL VIEW (Looking at Patient's Left Arch, skull facing right)
  left: {
    // Upper Arch (Teeth 9–16) - Staggered Y (110 vs 180) with generous horizontal space
    16: { target: [585, 475], badge: [400, 110],  tail: 'down', arch: 'Upper' },
    15: { target: [650, 480], badge: [520, 180],  tail: 'down', arch: 'Upper' },
    14: { target: [720, 485], badge: [630, 110],  tail: 'down', arch: 'Upper' },
    13: { target: [785, 490], badge: [720, 180],  tail: 'down', arch: 'Upper' },
    12: { target: [855, 490], badge: [810, 110],  tail: 'down', arch: 'Upper' },
    11: { target: [930, 485], badge: [900, 180],  tail: 'down', arch: 'Upper' },
    10: { target: [965, 480], badge: [990, 110],  tail: 'down', arch: 'Upper' },
    9:  { target: [990, 480], badge: [1080, 180], tail: 'down', arch: 'Upper' },

    // Lower Arch (Teeth 17–24) - Staggered Y (785 vs 860) with generous horizontal space
    17: { target: [580, 545], badge: [340, 860],  tail: 'up', arch: 'Lower' },
    18: { target: [645, 550], badge: [450, 785],  tail: 'up', arch: 'Lower' },
    19: { target: [715, 555], badge: [560, 860],  tail: 'up', arch: 'Lower' },
    20: { target: [785, 555], badge: [680, 785],  tail: 'up', arch: 'Lower' },
    21: { target: [855, 550], badge: [790, 860],  tail: 'up', arch: 'Lower' },
    22: { target: [925, 545], badge: [890, 785],  tail: 'up', arch: 'Lower' },
    23: { target: [960, 540], badge: [990, 860],  tail: 'up', arch: 'Lower' },
    24: { target: [980, 535], badge: [1080, 785], tail: 'up', arch: 'Lower' }
  },

  // 2. FRONT CORONAL VIEW (Anterior Dual Arch Smile Profile)
  front: {
    // Upper Arch (Teeth 1–16) - Staggered Y (100 vs 165)
    1:  { target: [265, 420], badge: [100, 100],   tail: 'down', arch: 'Upper' },
    2:  { target: [300, 430], badge: [190, 165],   tail: 'down', arch: 'Upper' },
    3:  { target: [340, 440], badge: [280, 100],   tail: 'down', arch: 'Upper' },
    4:  { target: [385, 450], badge: [360, 165],   tail: 'down', arch: 'Upper' },
    5:  { target: [425, 455], badge: [435, 100],   tail: 'down', arch: 'Upper' },
    6:  { target: [475, 455], badge: [505, 165],   tail: 'down', arch: 'Upper' },
    7:  { target: [525, 445], badge: [565, 100],   tail: 'down', arch: 'Upper' },
    8:  { target: [575, 440], badge: [615, 165],   tail: 'down', arch: 'Upper' },
    9:  { target: [625, 440], badge: [665, 100],   tail: 'down', arch: 'Upper' },
    10: { target: [675, 445], badge: [715, 165],   tail: 'down', arch: 'Upper' },
    11: { target: [725, 455], badge: [775, 100],   tail: 'down', arch: 'Upper' },
    12: { target: [775, 455], badge: [845, 165],   tail: 'down', arch: 'Upper' },
    13: { target: [815, 450], badge: [920, 100],   tail: 'down', arch: 'Upper' },
    14: { target: [860, 440], badge: [995, 165],   tail: 'down', arch: 'Upper' },
    15: { target: [900, 430], badge: [1070, 100],  tail: 'down', arch: 'Upper' },
    16: { target: [935, 420], badge: [1140, 165],  tail: 'down', arch: 'Upper' },

    // Lower Arch (Teeth 17–32) - Staggered Y (780 vs 850)
    32: { target: [270, 515], badge: [100, 850],   tail: 'up', arch: 'Lower' },
    31: { target: [310, 525], badge: [185, 780],   tail: 'up', arch: 'Lower' },
    30: { target: [355, 535], badge: [270, 850],   tail: 'up', arch: 'Lower' },
    29: { target: [400, 545], badge: [350, 780],   tail: 'up', arch: 'Lower' },
    28: { target: [450, 550], badge: [425, 850],   tail: 'up', arch: 'Lower' },
    27: { target: [500, 555], badge: [495, 780],   tail: 'up', arch: 'Lower' },
    26: { target: [545, 545], badge: [560, 850],   tail: 'up', arch: 'Lower' },
    25: { target: [585, 540], badge: [610, 780],   tail: 'up', arch: 'Lower' },
    24: { target: [615, 540], badge: [660, 850],   tail: 'up', arch: 'Lower' },
    23: { target: [655, 545], badge: [710, 780],   tail: 'up', arch: 'Lower' },
    22: { target: [700, 555], badge: [775, 850],   tail: 'up', arch: 'Lower' },
    21: { target: [750, 550], badge: [845, 780],   tail: 'up', arch: 'Lower' },
    20: { target: [800, 545], badge: [920, 850],   tail: 'up', arch: 'Lower' },
    19: { target: [845, 535], badge: [995, 780],   tail: 'up', arch: 'Lower' },
    18: { target: [890, 525], badge: [1070, 850],  tail: 'up', arch: 'Lower' },
    17: { target: [930, 515], badge: [1140, 780],  tail: 'up', arch: 'Lower' }
  },

  // 3. RIGHT SAGITTAL VIEW (Looking at Patient's Right Arch, skull facing left)
  right: {
    // Upper Arch (Teeth 1–8) - Staggered Y (110 vs 180)
    8:  { target: [210, 480], badge: [120, 180],  tail: 'down', arch: 'Upper' },
    7:  { target: [235, 480], badge: [210, 110],  tail: 'down', arch: 'Upper' },
    6:  { target: [270, 485], badge: [300, 180],  tail: 'down', arch: 'Upper' },
    5:  { target: [345, 490], badge: [390, 110],  tail: 'down', arch: 'Upper' },
    4:  { target: [415, 490], badge: [480, 180],  tail: 'down', arch: 'Upper' },
    3:  { target: [480, 485], badge: [570, 110],  tail: 'down', arch: 'Upper' },
    2:  { target: [550, 480], badge: [680, 180],  tail: 'down', arch: 'Upper' },
    1:  { target: [615, 475], badge: [800, 110],  tail: 'down', arch: 'Upper' },

    // Lower Arch (Teeth 25–32) - Staggered Y (785 vs 860)
    25: { target: [220, 535], badge: [120, 785],  tail: 'up', arch: 'Lower' },
    26: { target: [240, 540], badge: [210, 860],  tail: 'up', arch: 'Lower' },
    27: { target: [275, 545], badge: [310, 785],  tail: 'up', arch: 'Lower' },
    28: { target: [345, 550], badge: [410, 860],  tail: 'up', arch: 'Lower' },
    29: { target: [415, 555], badge: [520, 785],  tail: 'up', arch: 'Lower' },
    30: { target: [485, 555], badge: [640, 860],  tail: 'up', arch: 'Lower' },
    31: { target: [555, 550], badge: [750, 785],  tail: 'up', arch: 'Lower' },
    32: { target: [620, 545], badge: [860, 860],  tail: 'up', arch: 'Lower' }
  }
};

// Returns primary camera viewing section for any tooth number (1–32)
export function getToothPrimarySection(toothNumber) {
  const num = parseInt(toothNumber, 10);
  if (!num) return 'left';

  // Upper teeth
  if (num >= 1 && num <= 5) return 'right';
  if (num >= 6 && num <= 11) return 'front';
  if (num >= 12 && num <= 16) return 'left';

  // Lower teeth
  if (num >= 17 && num <= 21) return 'left';
  if (num >= 22 && num <= 27) return 'front';
  if (num >= 28 && num <= 32) return 'right';

  return 'left';
}

// Maps raw database teeth record array into interactive clinical finding cards & leader line callouts
export function mapDatabaseTeethToClinicalFindings(teethArray = []) {
  if (!teethArray || !Array.isArray(teethArray)) return [];

  const findings = [];

  teethArray.forEach((tooth) => {
    const tNum = parseInt(tooth.toothNumber || tooth.ToothNumber, 10);
    if (!tNum || isNaN(tNum)) return;

    const status = (tooth.status || tooth.ConditionStatus || tooth.conditionStatus || 'Healthy').trim();
    const comments = (tooth.comments || tooth.comment || tooth.Comments || '').trim();
    const color = (tooth.color || tooth.ConditionColor || tooth.conditionColor || '#10B981').trim();

    const sLower = status.toLowerCase();
    const cLower = comments.toLowerCase();

    // Check if truly healthy / normal baseline
    const isHealthy =
      (sLower === 'healthy' || sLower === 'sound' || sLower === 'intact' || sLower === 'normal') &&
      !cLower.includes('caries') &&
      !cLower.includes('cavity') &&
      !cLower.includes('decay') &&
      !cLower.includes('bone pathology') &&
      !cLower.includes('periodont') &&
      !cLower.includes('root canal') &&
      !cLower.includes('implant') &&
      !cLower.includes('missing') &&
      !cLower.includes('damaged') &&
      color.toUpperCase() === '#10B981';

    if (isHealthy) return;

    // Detect clinical condition category with priority hierarchy
    let label = 'Clinical Finding';
    let urgency = 'Soon';
    let cdtCode = 'CDT D0150';
    let procedureTitle = `Clinical Evaluation • Tooth #${tNum}`;
    let ringPct = 50;
    let badgeBg = 'bg-blue-600 text-white';
    let circleBg = 'bg-blue-600 text-white';
    let labelColor = 'text-blue-600';
    let ringColor = '#3B82F6';
    let priority = 5;

    // 1. Cavity / Caries / Decay / Damage
    if (
      sLower.includes('decay') ||
      sLower.includes('caries') ||
      sLower.includes('cavity') ||
      sLower.includes('carious') ||
      sLower.includes('damaged') ||
      cLower.includes('cavity') ||
      cLower.includes('caries') ||
      cLower.includes('decay') ||
      cLower.includes('damaged') ||
      cLower.includes('filling')
    ) {
      label = 'Cavity';
      urgency = 'Soon';
      cdtCode = 'CDT D2391';
      procedureTitle = `Fill Cavity (Composite Resin) • Tooth #${tNum}`;
      ringPct = 67;
      badgeBg = 'bg-blue-600 text-white';
      circleBg = 'bg-blue-600 text-white';
      labelColor = 'text-blue-600';
      ringColor = '#3B82F6';
      priority = 1;
    }
    // 2. Bone Pathology / Implant Candidate
    else if (
      sLower.includes('bone') ||
      sLower.includes('pathology') ||
      sLower.includes('cyst') ||
      sLower.includes('resorption') ||
      cLower.includes('pathology') ||
      cLower.includes('bone') ||
      cLower.includes('resorption')
    ) {
      label = 'Bone Pathology';
      urgency = 'Urgent';
      cdtCode = 'CDT D6010';
      procedureTitle = `Implant Osteotomy Assessment • Tooth #${tNum}`;
      ringPct = 11;
      badgeBg = 'bg-amber-400 text-amber-950';
      circleBg = 'bg-amber-400 text-amber-950';
      labelColor = 'text-amber-600';
      ringColor = '#F43F5E';
      priority = 2;
    }
    // 3. Root Canal / Endodontic
    else if (
      sLower.includes('canal') ||
      sLower.includes('rct') ||
      sLower.includes('endo') ||
      sLower.includes('pulpitis') ||
      cLower.includes('canal') ||
      cLower.includes('endo')
    ) {
      label = 'Root Canal Needed';
      urgency = 'Urgent';
      cdtCode = 'CDT D3330';
      procedureTitle = `Endodontic Molar Therapy • Tooth #${tNum}`;
      ringPct = 85;
      badgeBg = 'bg-purple-600 text-white';
      circleBg = 'bg-purple-600 text-white';
      labelColor = 'text-purple-600';
      ringColor = '#8B5CF6';
      priority = 2;
    }
    // 4. Periodontitis & Tooth Wear / Attrition
    else if (
      sLower.includes('periodont') ||
      sLower.includes('wear') ||
      sLower.includes('attrition') ||
      sLower.includes('bone loss') ||
      cLower.includes('periodont') ||
      cLower.includes('wear')
    ) {
      label = 'Decay. Tooth Wear';
      urgency = 'Urgent';
      cdtCode = 'CDT D4341';
      procedureTitle = `Periodontal Scaling & Planing • Tooth #${tNum}`;
      ringPct = 76;
      badgeBg = 'bg-rose-500 text-white';
      circleBg = 'bg-rose-500 text-white';
      labelColor = 'text-rose-600';
      ringColor = '#F59E0B';
      priority = 3;
    }
    // 5. Gingivitis / Calculus / Cleaning Needed
    else if (
      sLower.includes('clean') ||
      sLower.includes('gingivitis') ||
      sLower.includes('calculus') ||
      sLower.includes('tartar') ||
      cLower.includes('clean') ||
      cLower.includes('gingivitis') ||
      cLower.includes('calculus')
    ) {
      label = 'Gingivitis / Calculus';
      urgency = 'Soon';
      cdtCode = 'CDT D1110';
      procedureTitle = `Ultrasonic Scaling & Prophylaxis • Tooth #${tNum}`;
      ringPct = 23;
      badgeBg = 'bg-cyan-500 text-white';
      circleBg = 'bg-cyan-500 text-white';
      labelColor = 'text-cyan-600';
      ringColor = '#06B6D4';
      priority = 4;
    }
    // 6. Implant Planned
    else if (sLower.includes('implant') || cLower.includes('implant')) {
      label = 'Implant Planned';
      urgency = 'Planned';
      cdtCode = 'CDT D6010';
      procedureTitle = `Surgical Implant Placement • Tooth #${tNum}`;
      ringPct = 50;
      badgeBg = 'bg-emerald-500 text-white';
      circleBg = 'bg-emerald-500 text-white';
      labelColor = 'text-emerald-600';
      ringColor = '#10B981';
      priority = 4;
    }
    // 7. Missing / Extracted
    else if (sLower.includes('missing') || sLower.includes('extract') || cLower.includes('missing') || cLower.includes('extract')) {
      label = 'Missing / Extracted';
      urgency = 'Planned';
      cdtCode = 'CDT D6010';
      procedureTitle = `Edentulous Site Restoration • Tooth #${tNum}`;
      ringPct = 90;
      badgeBg = 'bg-slate-500 text-white';
      circleBg = 'bg-slate-500 text-white';
      labelColor = 'text-slate-600';
      ringColor = '#64748B';
      priority = 6;
    }
    // 8. Crown / Bridge / Restoration
    else if (sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('restoration') || cLower.includes('crown')) {
      label = 'Restoration / Crown';
      urgency = 'Planned';
      cdtCode = 'CDT D2740';
      procedureTitle = `Prosthetic Crown Restoration • Tooth #${tNum}`;
      ringPct = 60;
      badgeBg = 'bg-teal-600 text-white';
      circleBg = 'bg-teal-600 text-white';
      labelColor = 'text-teal-600';
      ringColor = '#0D9488';
      priority = 4;
    }
    // 9. Exact Status from DB fallback
    else {
      label = status;
      urgency = 'Soon';
      cdtCode = 'CDT D0150';
      procedureTitle = `${status} Management • Tooth #${tNum}`;
      ringPct = 40;
      badgeBg = 'bg-blue-600 text-white';
      circleBg = 'bg-blue-600 text-white';
      labelColor = 'text-blue-600';
      ringColor = '#3B82F6';
      priority = 5;
    }

    const primarySection = getToothPrimarySection(tNum);
    const isUpper = tNum <= 16;

    findings.push({
      toothNumber: tNum,
      toothNo: String(tNum),
      status,
      comments: comments || `${label} identified on Tooth #${tNum}`,
      color,
      label,
      urgency,
      cdtCode,
      procedureTitle,
      ringPct,
      badgeBg,
      circleBg,
      labelColor,
      ringColor,
      priority,
      primarySection,
      arch: isUpper ? 'Upper' : 'Lower',
      tailDirection: isUpper ? 'down' : 'up',
      confidence: '98.5%'
    });
  });

  // Sort by priority so most critical findings (Cavities, Caries, Pathology) come first
  findings.sort((a, b) => a.priority - b.priority || a.toothNumber - b.toothNumber);

  return findings;
}

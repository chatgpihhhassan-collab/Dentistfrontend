// ============================================================================
// Anatomical Multi-Angle Coordinate System & Clinical Finding Mapper
// Supports all 32 Human Teeth with Sub-Pixel Socket Accuracy
// Supported sections: 'left' (sagittal), 'front' (coronal), 'right' (sagittal)
// Viewport resolution normalized to exact 1200 x 896 HD anatomical scan
// ============================================================================

export const TOOTH_ANATOMICAL_NAMES = {
  // Maxillary Arch (Upper 1–16)
  1: 'Maxillary Right 3rd Molar',
  2: 'Maxillary Right 2nd Molar',
  3: 'Maxillary Right 1st Molar',
  4: 'Maxillary Right 2nd Premolar',
  5: 'Maxillary Right 1st Premolar',
  6: 'Maxillary Right Canine',
  7: 'Maxillary Right Lateral Incisor',
  8: 'Maxillary Right Central Incisor',
  9: 'Maxillary Left Central Incisor',
  10: 'Maxillary Left Lateral Incisor',
  11: 'Maxillary Left Canine',
  12: 'Maxillary Left 1st Premolar',
  13: 'Maxillary Left 2nd Premolar',
  14: 'Maxillary Left 1st Molar',
  15: 'Maxillary Left 2nd Molar',
  16: 'Maxillary Left 3rd Molar',

  // Mandibular Arch (Lower 17–32)
  17: 'Mandibular Left 3rd Molar',
  18: 'Mandibular Left 2nd Molar',
  19: 'Mandibular Left 1st Molar',
  20: 'Mandibular Left 2nd Premolar',
  21: 'Mandibular Left 1st Premolar',
  22: 'Mandibular Left Canine',
  23: 'Mandibular Left Lateral Incisor',
  24: 'Mandibular Left Central Incisor',
  25: 'Mandibular Right Central Incisor',
  26: 'Mandibular Right Lateral Incisor',
  27: 'Mandibular Right Canine',
  28: 'Mandibular Right 1st Premolar',
  29: 'Mandibular Right 2nd Premolar',
  30: 'Mandibular Right 1st Molar',
  31: 'Mandibular Right 2nd Molar',
  32: 'Mandibular Right 3rd Molar'
};

export function getToothAnatomicalName(toothNumber) {
  const num = parseInt(toothNumber, 10);
  return TOOTH_ANATOMICAL_NAMES[num] || `Permanent Tooth #${num}`;
}

// Coordinate definitions for each angle
export const ANATOMICAL_SECTION_COORDS = {
  // 1. LEFT SAGITTAL VIEW (Looking at Patient's Left Arch, skull facing right)
  left: {
    // Upper Arch (Teeth 9–16)
    16: { target: [585, 475], badge: [370, 95], tail: 'down', arch: 'Upper' },
    15: { target: [650, 480], badge: [500, 165], tail: 'down', arch: 'Upper' },
    14: { target: [720, 485], badge: [630, 95], tail: 'down', arch: 'Upper' },
    13: { target: [785, 490], badge: [730, 165], tail: 'down', arch: 'Upper' },
    12: { target: [855, 490], badge: [830, 95], tail: 'down', arch: 'Upper' },
    11: { target: [930, 485], badge: [920, 165], tail: 'down', arch: 'Upper' },
    10: { target: [965, 480], badge: [1000, 95], tail: 'down', arch: 'Upper' },
    9: { target: [990, 480], badge: [1085, 165], tail: 'down', arch: 'Upper' },

    // Lower Arch (Teeth 17–24)
    17: { target: [580, 545], badge: [340, 860], tail: 'up', arch: 'Lower' },
    18: { target: [645, 550], badge: [450, 785], tail: 'up', arch: 'Lower' },
    19: { target: [715, 555], badge: [565, 860], tail: 'up', arch: 'Lower' },
    20: { target: [785, 555], badge: [675, 785], tail: 'up', arch: 'Lower' },
    21: { target: [855, 550], badge: [785, 860], tail: 'up', arch: 'Lower' },
    22: { target: [925, 545], badge: [890, 785], tail: 'up', arch: 'Lower' },
    23: { target: [960, 540], badge: [990, 860], tail: 'up', arch: 'Lower' },
    24: { target: [980, 535], badge: [1085, 785], tail: 'up', arch: 'Lower' }
  },

  // 2. FRONT CORONAL VIEW (Anterior & Mid-Arch Smile Profile: Teeth 4–13 Upper, 20–29 Lower)
  // Well spaced across 1200px width with generous clearance
  front: {
    // Upper Arch (Teeth 4–13)
    4: { target: [380, 445], badge: [210, 100], tail: 'down', arch: 'Upper' },
    5: { target: [430, 450], badge: [340, 175], tail: 'down', arch: 'Upper' },
    6: { target: [480, 450], badge: [460, 100], tail: 'down', arch: 'Upper' },
    7: { target: [530, 445], badge: [545, 175], tail: 'down', arch: 'Upper' },
    8: { target: [575, 440], badge: [625, 100], tail: 'down', arch: 'Upper' },
    9: { target: [625, 440], badge: [705, 175], tail: 'down', arch: 'Upper' },
    10: { target: [670, 445], badge: [785, 100], tail: 'down', arch: 'Upper' },
    11: { target: [720, 450], badge: [865, 175], tail: 'down', arch: 'Upper' },
    12: { target: [770, 450], badge: [945, 100], tail: 'down', arch: 'Upper' },
    13: { target: [820, 445], badge: [1030, 175], tail: 'down', arch: 'Upper' },

    // Lower Arch (Teeth 20–29)
    29: { target: [385, 545], badge: [210, 855], tail: 'up', arch: 'Lower' },
    28: { target: [435, 550], badge: [340, 785], tail: 'up', arch: 'Lower' },
    27: { target: [485, 555], badge: [460, 855], tail: 'up', arch: 'Lower' },
    26: { target: [535, 550], badge: [545, 785], tail: 'up', arch: 'Lower' },
    25: { target: [575, 540], badge: [625, 855], tail: 'up', arch: 'Lower' },
    24: { target: [625, 540], badge: [705, 785], tail: 'up', arch: 'Lower' },
    23: { target: [665, 550], badge: [785, 855], tail: 'up', arch: 'Lower' },
    22: { target: [715, 555], badge: [865, 785], tail: 'up', arch: 'Lower' },
    21: { target: [765, 550], badge: [945, 855], tail: 'up', arch: 'Lower' },
    20: { target: [815, 545], badge: [1030, 785], tail: 'up', arch: 'Lower' }
  },

  // 3. RIGHT SAGITTAL VIEW (Looking at Patient's Right Arch, skull facing left)
  right: {
    // Upper Arch (Teeth 1–8)
    8: { target: [210, 480], badge: [130, 165], tail: 'down', arch: 'Upper' },
    7: { target: [235, 480], badge: [215, 95], tail: 'down', arch: 'Upper' },
    6: { target: [270, 485], badge: [305, 165], tail: 'down', arch: 'Upper' },
    5: { target: [345, 490], badge: [395, 95], tail: 'down', arch: 'Upper' },
    4: { target: [415, 490], badge: [485, 165], tail: 'down', arch: 'Upper' },
    3: { target: [480, 485], badge: [575, 95], tail: 'down', arch: 'Upper' },
    2: { target: [550, 480], badge: [705, 165], tail: 'down', arch: 'Upper' },
    1: { target: [615, 475], badge: [845, 95], tail: 'down', arch: 'Upper' },

    // Lower Arch (Teeth 25–32)
    25: { target: [220, 535], badge: [130, 785], tail: 'up', arch: 'Lower' },
    26: { target: [240, 540], badge: [225, 860], tail: 'up', arch: 'Lower' },
    27: { target: [275, 545], badge: [330, 785], tail: 'up', arch: 'Lower' },
    28: { target: [345, 550], badge: [440, 860], tail: 'up', arch: 'Lower' },
    29: { target: [415, 555], badge: [550, 785], tail: 'up', arch: 'Lower' },
    30: { target: [485, 555], badge: [665, 860], tail: 'up', arch: 'Lower' },
    31: { target: [555, 550], badge: [775, 785], tail: 'up', arch: 'Lower' },
    32: { target: [620, 545], badge: [885, 860], tail: 'up', arch: 'Lower' }
  }
};

// Returns primary anatomical camera section for any tooth number (1–32)
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

// Checks if a tooth is visible in a given section
export function isToothInSection(toothNumber, section = 'left') {
  const num = parseInt(toothNumber, 10);
  if (!num) return false;
  const sectionCoords = ANATOMICAL_SECTION_COORDS[section];
  return Boolean(sectionCoords && sectionCoords[num]);
}

// Maps raw database teeth record array into interactive clinical findings
// CRITICAL: Strictly DEDUPLICATES by toothNumber and merges multiple conditions
export function mapDatabaseTeethToClinicalFindings(teethArray = []) {
  if (!teethArray || !Array.isArray(teethArray)) return [];

  // 1. Group records by tooth number to eliminate duplicates
  const teethMap = new Map();

  teethArray.forEach((tooth) => {
    const tNum = parseInt(tooth.toothNumber || tooth.ToothNumber, 10);
    if (!tNum || isNaN(tNum) || tNum < 1 || tNum > 32) return;

    const existing = teethMap.get(tNum) || [];
    existing.push(tooth);
    teethMap.set(tNum, existing);
  });

  const findings = [];

  // 2. Evaluate each unique tooth
  teethMap.forEach((toothRecords, tNum) => {
    // Find most severe / active clinical condition among records for this tooth
    let primaryTooth = toothRecords[0];

    // Priority rankings: 1=Cavity, 2=Root Canal, 3=Bone Pathology, 4=Periodontitis, 5=Crown, 6=Missing, 7=Healthy
    let bestPriority = 999;
    let consolidatedStatus = '';
    let consolidatedComments = '';
    let consolidatedColor = '#10B981';

    toothRecords.forEach((tr) => {
      const status = (tr.status || tr.ConditionStatus || tr.conditionStatus || 'Healthy').trim();
      const comments = (tr.comments || tr.comment || tr.Comments || '').trim();
      const color = (tr.color || tr.ConditionColor || tr.conditionColor || '#10B981').trim();

      const sLower = status.toLowerCase();
      const cLower = comments.toLowerCase();

      let p = 50;
      if (sLower.includes('decay') || sLower.includes('caries') || sLower.includes('cavity') || cLower.includes('cavity')) p = 1;
      else if (sLower.includes('canal') || sLower.includes('rct') || sLower.includes('endo') || cLower.includes('canal')) p = 2;
      else if (sLower.includes('bone') || sLower.includes('pathology') || cLower.includes('pathology') || cLower.includes('bone')) p = 3;
      else if (sLower.includes('periodont') || sLower.includes('wear') || cLower.includes('periodont')) p = 4;
      else if (sLower.includes('crown') || sLower.includes('restoration') || cLower.includes('crown')) p = 5;
      else if (sLower.includes('missing') || sLower.includes('extract') || sLower.includes('shedding') || sLower.includes('exfoliat')) p = 6;
      else if (sLower.includes('clean') || sLower.includes('gingivitis')) p = 7;
      else if (sLower === 'healthy' || sLower === 'sound') p = 100;

      if (p < bestPriority) {
        bestPriority = p;
        primaryTooth = tr;
        consolidatedStatus = status;
        consolidatedComments = comments;
        consolidatedColor = color;
      }
    });

    const sLower = consolidatedStatus.toLowerCase();
    const cLower = consolidatedComments.toLowerCase();

    // Check if truly healthy / normal baseline
    const isHealthy =
      (sLower === 'healthy' || sLower === 'sound' || sLower === 'intact' || sLower === 'normal') &&
      !cLower.includes('caries') &&
      !cLower.includes('cavity') &&
      !cLower.includes('decay') &&
      !cLower.includes('bone pathology') &&
      !cLower.includes('periodont') &&
      !cLower.includes('root canal') &&
      !cLower.includes('missing') &&
      !cLower.includes('damaged') &&
      consolidatedColor.toUpperCase() === '#10B981';

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

    // 1. Cavity / Caries / Decay
    if (
      sLower.includes('decay') ||
      sLower.includes('caries') ||
      sLower.includes('cavity') ||
      sLower.includes('carious') ||
      sLower.includes('damaged') ||
      cLower.includes('cavity') ||
      cLower.includes('caries') ||
      cLower.includes('decay') ||
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
    // 2. Root Canal / Endodontic
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
    // 3. Bone Pathology / Implant Candidate
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
      badgeBg = 'bg-amber-500 text-white';
      circleBg = 'bg-amber-500 text-white';
      labelColor = 'text-amber-600';
      ringColor = '#F59E0B';
      priority = 3;
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
      label = 'Decay / Tooth Wear';
      urgency = 'Urgent';
      cdtCode = 'CDT D4341';
      procedureTitle = `Periodontal Scaling & Planing • Tooth #${tNum}`;
      ringPct = 76;
      badgeBg = 'bg-rose-500 text-white';
      circleBg = 'bg-rose-500 text-white';
      labelColor = 'text-rose-600';
      ringColor = '#F43F5E';
      priority = 4;
    }
    // 5. Crown / Bridge / Restoration
    else if (
      sLower.includes('crown') ||
      sLower.includes('bridge') ||
      sLower.includes('restoration') ||
      cLower.includes('crown')
    ) {
      label = 'Restoration / Crown';
      urgency = 'Planned';
      cdtCode = 'CDT D2740';
      procedureTitle = `Prosthetic Crown Restoration • Tooth #${tNum}`;
      ringPct = 60;
      badgeBg = 'bg-teal-600 text-white';
      circleBg = 'bg-teal-600 text-white';
      labelColor = 'text-teal-600';
      ringColor = '#0D9488';
      priority = 5;
    }
    // 6. Missing / Extracted
    else if (
      sLower.includes('missing') ||
      sLower.includes('extract') ||
      sLower.includes('shedding') ||
      sLower.includes('exfoliat') ||
      cLower.includes('missing') ||
      cLower.includes('extract')
    ) {
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
    // 7. Gingivitis / Cleaning Needed
    else if (
      sLower.includes('clean') ||
      sLower.includes('gingivitis') ||
      sLower.includes('calculus') ||
      cLower.includes('clean') ||
      cLower.includes('gingivitis')
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
      priority = 7;
    }
    // 8. Exact Status from DB fallback
    else {
      label = consolidatedStatus;
      urgency = 'Soon';
      cdtCode = 'CDT D0150';
      procedureTitle = `${consolidatedStatus} Management • Tooth #${tNum}`;
      ringPct = 40;
      badgeBg = 'bg-blue-600 text-white';
      circleBg = 'bg-blue-600 text-white';
      labelColor = 'text-blue-600';
      ringColor = '#3B82F6';
      priority = 8;
    }

    const primarySection = getToothPrimarySection(tNum);
    const anatomicalName = getToothAnatomicalName(tNum);
    const isUpper = tNum <= 16;

    findings.push({
      toothNumber: tNum,
      toothNo: String(tNum),
      status: consolidatedStatus,
      comments: consolidatedComments || `${label} identified on Tooth #${tNum}`,
      color: consolidatedColor,
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
      anatomicalName,
      arch: isUpper ? 'Upper' : 'Lower',
      tailDirection: isUpper ? 'down' : 'up',
      confidence: '99.2%'
    });
  });

  // Sort by priority so most critical findings (Cavities, Caries, Root Canals) come first, then toothNumber
  findings.sort((a, b) => a.priority - b.priority || a.toothNumber - b.toothNumber);

  return findings;
}

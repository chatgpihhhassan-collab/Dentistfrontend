/**
 * Clinical Dental NLP Semantic Engine & Adaptive Ambiguity Resolver
 * Supports Natural English, Roman Urdu, FDI/Universal tooth notation, clinical abbreviations & slang
 */

export const DENTAL_VOCABULARY = {
  // Anatomical Group Mappings
  groups: {
    canines: {
      adult: [6, 11, 22, 27],
      pediatric: ['C', 'H', 'M', 'R'],
      name: 'Canine Teeth (Cuspids / Eye Teeth)'
    },
    premolars: {
      adult: [4, 5, 12, 13, 20, 21, 28, 29],
      pediatric: [],
      name: 'Premolars (Bicuspids)'
    },
    molars: {
      adult: [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32],
      pediatric: ['A', 'B', 'I', 'J', 'K', 'L', 'S', 'T'],
      name: 'Molars'
    },
    incisors: {
      adult: [7, 8, 9, 10, 23, 24, 25, 26],
      pediatric: ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'],
      name: 'Incisors'
    },
    wisdom: {
      adult: [1, 16, 17, 32],
      pediatric: [],
      name: 'Wisdom Teeth (3rd Molars)'
    },
    upper: {
      adult: Array.from({ length: 16 }, (_, i) => i + 1),
      pediatric: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      name: 'Maxilla (Upper Jaw)'
    },
    lower: {
      adult: Array.from({ length: 16 }, (_, i) => i + 17),
      pediatric: ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
      name: 'Mandible (Lower Jaw)'
    },
    all: {
      adult: Array.from({ length: 32 }, (_, i) => i + 1),
      pediatric: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'],
      name: 'All Teeth'
    }
  },

  // Roman Urdu to Clinical Medical Dictionary
  urduGlossary: {
    'keera': 'caries',
    'keeda': 'caries',
    'khokhla': 'cavity',
    'saran': 'decay',
    'dharh': 'molar',
    'dharhein': 'molars',
    'nokdar': 'canine',
    'aagay wale dant': 'incisors',
    'peechey wale dant': 'molars',
    'dard': 'pain / pulpitis',
    'shadeed dard': 'acute pulpitis',
    'thanda garam': 'dentin hypersensitivity',
    'hila hua': 'mobility',
    'hil raha hai': 'mobility',
    'nikal do': 'extract',
    'kheencho': 'extract',
    'khol do': 'access cavity / pulpotomy',
    'safai': 'scaling & cleaning',
    'masooray': 'gingiva / periodontal',
    'masooron se khoon': 'gingival bleeding / perio',
    'peep': 'abscess / pus',
    'soojan': 'edema / swelling'
  }
};

/**
 * Normalizes user text, expanding Roman Urdu and clinical slang
 */
export const normalizeClinicalSpeech = (rawText) => {
  if (!rawText) return '';
  let str = rawText.toLowerCase().trim();

  // Replace common Urdu dental terms
  Object.entries(DENTAL_VOCABULARY.urduGlossary).forEach(([urdu, eng]) => {
    const reg = new RegExp(`\\b${urdu}\\b`, 'gi');
    str = str.replace(reg, eng);
  });

  // Common phonetic speech-to-text corrections
  str = str
    .replace(/\btooth number\b|\btooth no\b|\bnumber\b/g, 'tooth')
    .replace(/\bpromolars?\b/g, 'premolar')
    .replace(/\bbicuspids?\b/g, 'premolar')
    .replace(/\bcuspids?\b/g, 'canine')
    .replace(/\beye teeth\b|\beye tooth\b/g, 'canine')
    .replace(/\bwisdoms?\b/g, 'wisdom')
    .replace(/\brct\b|\broot canal\b|\bendo\b/g, 'rct')
    .replace(/\bcomp\b|\bcomposite\b|\bwhite filling\b/g, 'composite')
    .replace(/\bsilver filling\b/g, 'amalgam')
    .replace(/\bpost and core\b|\bpost & core\b|\bpost core\b/g, 'post_and_core')
    .replace(/\bcap\b|\bcrowns?\b|\bzirconia\b/g, 'crown')
    .replace(/\bclean\b|\bhealthy\b|\bsound\b|\btheek\b/g, 'healthy');

  return str;
};

/**
 * Parses multi-turn natural language input, returning structured intent and clarification choices if ambiguous
 */
export const parseDoctorConversationalIntent = (rawText, currentContext = {}, dentitionMode = 'permanent') => {
  const norm = normalizeClinicalSpeech(rawText);
  const isPediatric = dentitionMode === 'pediatric';

  // 1. Detect Explicit Tooth Mentions (Numeric 1-32 or Pediatric A-T)
  const toothMatches = [];
  const numMatches = [...norm.matchAll(/\b(?:tooth|teeth|#|dant)\s*#?(\d{1,2})\b/gi)];
  numMatches.forEach(m => {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 32) toothMatches.push(n);
  });

  const pedMatches = [...norm.matchAll(/\b(?:tooth|letter|primary tooth)\s*([a-tA-T])\b/gi)];
  pedMatches.forEach(m => {
    const l = m[1].toUpperCase();
    if (['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].includes(l)) {
      toothMatches.push(l);
    }
  });

  // Fallback to active context tooth if no explicit tooth mentioned
  const activeTooth = toothMatches.length > 0 ? toothMatches[0] : currentContext.activeTooth || null;

  // 2. Detect Anatomical Groups
  let targetGroup = null;
  if (norm.includes('canine')) targetGroup = isPediatric ? DENTAL_VOCABULARY.groups.canines.pediatric : DENTAL_VOCABULARY.groups.canines.adult;
  else if (norm.includes('premolar')) targetGroup = DENTAL_VOCABULARY.groups.premolars.adult;
  else if (norm.includes('wisdom')) targetGroup = DENTAL_VOCABULARY.groups.wisdom.adult;
  else if (norm.includes('molar')) targetGroup = isPediatric ? DENTAL_VOCABULARY.groups.molars.pediatric : DENTAL_VOCABULARY.groups.molars.adult;
  else if (norm.includes('incisor')) targetGroup = isPediatric ? DENTAL_VOCABULARY.groups.incisors.pediatric : DENTAL_VOCABULARY.groups.incisors.adult;
  else if (norm.includes('upper') || norm.includes('maxilla')) targetGroup = isPediatric ? DENTAL_VOCABULARY.groups.upper.pediatric : DENTAL_VOCABULARY.groups.upper.adult;
  else if (norm.includes('lower') || norm.includes('mandible')) targetGroup = isPediatric ? DENTAL_VOCABULARY.groups.lower.pediatric : DENTAL_VOCABULARY.groups.lower.adult;

  // 3. Detect Clinical Conditions & Procedures
  let condition = null;
  let surface = null;

  // Check surfaces
  if (/\bmod\b|mesio-occlusal-distal/i.test(norm)) surface = 'MOD';
  else if (/\bmo\b|mesio-occlusal/i.test(norm)) surface = 'MO';
  else if (/\bdo\b(?!ctor)|disto-occlusal/i.test(norm)) surface = 'DO';
  else if (/\bocclusal\b|\bo\b/i.test(norm)) surface = 'O';
  else if (/\bbuccal\b|\bfacial\b|\bclass v\b/i.test(norm)) surface = 'B';
  else if (/\blingual\b|\bpalatal\b/i.test(norm)) surface = 'L';

  // Condition mapping
  if (norm.includes('extract') || norm.includes('remove') || norm.includes('missing') || norm.includes('absent')) {
    condition = { status: 'Missing / Extracted', color: '#DC2626', cdt: 'D7140', title: 'Extracted / Missing' };
  } else if (norm.includes('post_and_core') || (norm.includes('post') && norm.includes('core'))) {
    condition = { status: 'Post & Core Build-Up', color: '#475569', cdt: 'D2952', title: 'Post & Core Foundation' };
  } else if (norm.includes('veneer') || norm.includes('laminate')) {
    condition = { status: 'Ceramic Veneer', color: '#8B5CF6', cdt: 'D2962', title: 'Porcelain Veneer' };
  } else if (norm.includes('inlay') || norm.includes('onlay')) {
    condition = { status: 'Inlay / Onlay Restoration', color: '#D97706', cdt: 'D2510', title: 'Inlay / Onlay Cast' };
  } else if (norm.includes('sealant') || norm.includes('pit and fissure') || norm.includes('seal')) {
    condition = { status: 'Pit & Fissure Sealant', color: '#06B6D4', cdt: 'D1351', title: 'Pit & Fissure Sealant' };
  } else if (norm.includes('abscess') || norm.includes('pus') || norm.includes('peep')) {
    condition = { status: 'Periapical Abscess', color: '#EF4444', cdt: 'D0120', title: 'Periapical Abscess' };
  } else if (norm.includes('rct') || norm.includes('root canal') || norm.includes('pulpectomy')) {
    condition = { status: 'Root Canal Treated (RCT)', color: '#7C3AED', cdt: 'D3330', title: 'Root Canal (RCT)' };
  } else if (norm.includes('crown') || norm.includes('zirconia') || norm.includes('pfm')) {
    condition = { status: 'Crown — Monolithic Zirconia', color: '#D97706', cdt: 'D2740', title: 'Zirconia Crown' };
  } else if (norm.includes('composite') || norm.includes('filling') || norm.includes('fill') || norm.includes('resin')) {
    condition = { status: `Filling — Composite (${surface || 'O'})`, color: '#2563EB', cdt: surface === 'MOD' ? 'D2393' : 'D2391', title: `Composite Filling (${surface || 'O'})` };
  } else if (norm.includes('amalgam')) {
    condition = { status: `Filling — Amalgam (${surface || 'O'})`, color: '#64748B', cdt: 'D2140', title: `Amalgam (${surface || 'O'})` };
  } else if (norm.includes('gic')) {
    condition = { status: 'Filling — GIC', color: '#0284C7', cdt: 'D2391', title: 'GIC Restoration' };
  } else if (norm.includes('caries') || norm.includes('decay') || norm.includes('cavity')) {
    condition = { status: `Caries — ${surface || 'O'}`, color: '#EF4444', cdt: 'D2140', title: `Caries (${surface || 'O'})` };
  } else if (norm.includes('healthy') || norm.includes('sound') || norm.includes('normal')) {
    condition = { status: 'Healthy', color: '#10B981', cdt: 'D0120', title: 'Healthy / Sound' };
  }

  // 4. Ambiguity Resolution & Guided Clarification Decision Tree
  
  // Case A: Group Action Detected
  if (targetGroup && condition) {
    return {
      type: 'EXECUTE_GROUP',
      targetTeeth: targetGroup,
      condition,
      confidence: 0.95,
      spokenMessage: `Recorded ${condition.title} on all ${targetGroup.length} teeth.`,
      chips: [
        { label: 'Undo Action', command: 'Undo last action' },
        { label: 'Check Antagonist Arch', command: 'Check opposite arch' },
        { label: 'Start Full Exam', command: 'Start full mouth exam' }
      ]
    };
  }

  // Case B: Complete Single Tooth Action
  if (activeTooth && condition) {
    // If it's a filling/caries without explicit surface, provide quick surface chips
    const needsSurfaceClarification = (condition.title.includes('Filling') || condition.title.includes('Caries')) && !surface;

    return {
      type: 'EXECUTE_SINGLE',
      toothNum: activeTooth,
      condition,
      surface: surface || 'O',
      confidence: needsSurfaceClarification ? 0.85 : 1.0,
      spokenMessage: needsSurfaceClarification
        ? `Charted ${condition.title} on Tooth #${activeTooth}. Which surface was treated?`
        : `Updated Tooth #${activeTooth} to ${condition.title}.`,
      chips: needsSurfaceClarification ? [
        { label: `O (Occlusal Only)`, command: `Tooth ${activeTooth} ${condition.status.split(' ')[0]} O` },
        { label: `MO (Mesial-Occlusal)`, command: `Tooth ${activeTooth} ${condition.status.split(' ')[0]} MO` },
        { label: `DO (Distal-Occlusal)`, command: `Tooth ${activeTooth} ${condition.status.split(' ')[0]} DO` },
        { label: `MOD (Full Table)`, command: `Tooth ${activeTooth} ${condition.status.split(' ')[0]} MOD` },
        { label: `Class V (Buccal)`, command: `Tooth ${activeTooth} ${condition.status.split(' ')[0]} Buccal` }
      ] : [
        { label: `Next Tooth (#${typeof activeTooth === 'number' ? activeTooth + 1 : 'B'})`, command: `Look at tooth ${typeof activeTooth === 'number' ? activeTooth + 1 : 'B'}` },
        { label: 'Add to Treatment Plan', command: `Add Tooth ${activeTooth} to treatment plan` },
        { label: 'Mark Healthy', command: `Tooth ${activeTooth} Healthy` }
      ]
    };
  }

  // Case C: Condition mentioned without Tooth Number
  if (condition && !activeTooth) {
    return {
      type: 'CLARIFY_TOOTH',
      condition,
      confidence: 0.5,
      spokenMessage: `Doctor, which tooth has ${condition.title}? Please say the tooth number or click on the 3D jaw.`,
      chips: [
        { label: 'Tooth #14 (Upper Molar)', command: `Tooth 14 ${condition.title}` },
        { label: 'Tooth #19 (Lower Molar)', command: `Tooth 19 ${condition.title}` },
        { label: 'Tooth #30 (Lower Molar)', command: `Tooth 30 ${condition.title}` },
        { label: 'Upper Canines (6, 11)', command: `Canines ${condition.title}` },
        { label: 'Select on 3D Model', command: 'Interactive 3D model selection' }
      ]
    };
  }

  // Case D: Tooth mentioned without Condition
  if (activeTooth && !condition) {
    return {
      type: 'CLARIFY_CONDITION',
      toothNum: activeTooth,
      confidence: 0.6,
      spokenMessage: `Focusing on Tooth #${activeTooth}. What is your clinical diagnosis?`,
      chips: [
        { label: '🦷 Caries / Cavity (O)', command: `Tooth ${activeTooth} Caries O` },
        { label: '💎 Composite Filling', command: `Tooth ${activeTooth} Composite Filling` },
        { label: '🟣 Root Canal (RCT)', command: `Tooth ${activeTooth} Root Canal RCT` },
        { label: '👑 Zirconia Crown', command: `Tooth ${activeTooth} Zirconia Crown` },
        { label: '✨ Pit & Fissure Sealant', command: `Tooth ${activeTooth} Pit & Fissure Sealant` },
        { label: '✅ Sound & Healthy', command: `Tooth ${activeTooth} Healthy` }
      ]
    };
  }

  // Case E: Unrecognized / Muffled Input (Golden Recovery Protocol)
  return {
    type: 'UNRECOGNIZED',
    confidence: 0.1,
    spokenMessage: `Doctor, I could not catch that clearly. You can speak again or pick an action below.`,
    chips: [
      { label: 'Start Full Mouth Exam', command: 'Start full mouth exam' },
      { label: 'Restore Sound (All Healthy)', command: 'All teeth healthy' },
      { label: 'Remove All Canines', command: 'Remove all canine teeth' },
      { label: 'Fill All Premolars', command: 'Show filling in premolars everywhere' },
      { label: 'Check 3D Model', command: 'Focus 3D jaw model' }
    ]
  };
};

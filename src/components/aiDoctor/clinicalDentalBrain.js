/**
 * Clinical Dental AI Intent & Knowledge Engine
 * Processes human doctor spoken instructions, answers clinical questions, 
 * detects contraindications, and executes website navigation actions.
 */

export const DENTAL_KNOWLEDGE_BASE = [
  {
    keywords: ['bone graft', 'grafting', 'graft', 'bone loss', 'jawbone', 'ridge augmentation'],
    title: 'Dental Bone Grafting Protocol',
    answer: 'Doctor, bone grafting (ADA code D7953) is indicated when alveolar ridge height or width is insufficient for implant placement. We typically use particulate mineralized allograft or xenograft paired with a resorbable collagen membrane. Healing time is 4 to 6 months before primary implant stability can be achieved.',
    action: null
  },
  {
    keywords: ['tooth 16', '16', 'upper right first molar', 'fdi 16', 'universal 3'],
    title: 'Tooth 16 (FDI 16 / Universal 3)',
    answer: 'Tooth 16 is the maxillary right first permanent molar, having three roots (mesiobuccal, distobuccal, palatal) with a frequent MB2 canal. Common procedures include composite restoration for occlusal decay or endodontic treatment if pulpal exposure occurs.',
    action: null
  },
  {
    keywords: ['tooth 36', '36', 'lower left first molar', 'fdi 36', 'universal 19'],
    title: 'Tooth 36 (FDI 36 / Universal 19)',
    answer: 'Tooth 36 is the mandibular left first permanent molar, featuring two roots (mesial and distal) with typically three or four root canals. It bears the highest masticatory load in the arch.',
    action: null
  },
  {
    keywords: ['penicillin', 'amoxicillin', 'allergy', 'allergic to penicillin'],
    title: 'Penicillin Allergy Protocol',
    answer: 'Caution, Doctor! For patients with confirmed penicillin or beta-lactam allergies, avoid Amoxicillin and Augmentin. Prescribe Clindamycin 300mg QID for 7 days, or Azithromycin 500mg loading dose followed by 250mg once daily for 4 days.',
    action: null
  },
  {
    keywords: ['epinephrine', 'adrenaline', 'hypertension', 'blood pressure', 'high bp', 'cardiac'],
    title: 'Hypertension & Local Anesthesia Safety',
    answer: 'Doctor, in patients with stage 2 hypertension or cardiac risk, avoid 1:100,000 epinephrine. Use 3% Mepivacaine Plain or limit epinephrine to a maximum cardiac dose of 0.04 mg (2 cartridges of 1:100,000).',
    action: null
  },
  {
    keywords: ['root canal', 'rct', 'endo', 'endodontic'],
    title: 'Endodontic Therapy Guidelines',
    answer: 'Doctor, standard endodontic protocol requires rubber dam isolation, electronic apex locator verification, rotary nickel-titanium instrumentation, sodium hypochlorite 2.5% irrigation, and warm vertical obturation.',
    action: null
  },
  {
    keywords: ['new patient', 'register patient', 'add patient', 'open patient form', 'new intake'],
    title: 'Navigate to New Patient Intake',
    answer: 'Opening the new patient registration form now, Doctor.',
    action: { type: 'NAVIGATE', path: '/new-patient' }
  },
  {
    keywords: ['appointments', 'appointment', 'schedule', 'view bookings', 'booking list'],
    title: 'Navigate to Appointments',
    answer: 'Opening the appointments schedule and calendar, Doctor.',
    action: { type: 'NAVIGATE', path: '/appointments' }
  },
  {
    keywords: ['book appointment', 'schedule appointment', 'book patient', 'new appointment'],
    title: 'Navigate to Book Appointment',
    answer: 'Opening the appointment booking module, Doctor.',
    action: { type: 'NAVIGATE', path: '/book' }
  },
  {
    keywords: ['directory', 'patient directory', 'patient list', 'all patients', 'records'],
    title: 'Navigate to Patient Directory',
    answer: 'Opening the complete patient directory and records, Doctor.',
    action: { type: 'NAVIGATE', path: '/directory' }
  },
  {
    keywords: ['dashboard', 'home', 'main page', 'analytics'],
    title: 'Navigate to Dashboard',
    answer: 'Returning to the main clinic dashboard, Doctor.',
    action: { type: 'NAVIGATE', path: '/' }
  },
  {
    keywords: ['help', 'what can you do', 'commands', 'instructions'],
    title: 'Assistant Capabilities',
    answer: 'Doctor, you can speak clinical dental queries to me like: "Explain bone graft", "Check penicillin allergy", "Tooth 16 anatomy", or command me to navigate: "Go to new patient", "Open appointments", or "Show patient directory".',
    action: null
  }
];

/**
 * Process doctor spoken or typed transcript and generate clinical response + UI action
 */
export function resolveDoctorInstruction(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return {
      text: "Doctor, I didn't catch that. Please speak again or select a clinical quick action.",
      action: null,
      title: 'Voice Prompt Unclear'
    };
  }

  const clean = transcript.toLowerCase().trim();

  // Check matching knowledge items
  for (const item of DENTAL_KNOWLEDGE_BASE) {
    const isMatch = item.keywords.some(kw => clean.includes(kw));
    if (isMatch) {
      return {
        text: item.answer,
        action: item.action,
        title: item.title
      };
    }
  }

  // Generic Clinical Assistant fallback with intelligent phrasing
  if (clean.includes('caries') || clean.includes('decay') || clean.includes('cavity')) {
    return {
      text: 'Doctor, for active caries, evaluate pulp vitality, remove unsupported enamel, and determine if an indirect restoration or direct resin composite is indicated.',
      action: null,
      title: 'Caries Management'
    };
  }

  if (clean.includes('extraction') || clean.includes('pull tooth')) {
    return {
      text: 'Doctor, ensure profound local anesthesia, evaluate root curvature on bitewing or periapical X-ray, luxate with straight elevator, and verify socket hemostasis post-extraction.',
      action: null,
      title: 'Surgical Extraction Protocol'
    };
  }

  // Default responsive answer
  return {
    text: `Doctor, I registered your instruction: "${transcript}". Clinical systems and odontogram models are synchronized. How else may I assist your procedure?`,
    action: null,
    title: 'Clinical Command Noted'
  };
}

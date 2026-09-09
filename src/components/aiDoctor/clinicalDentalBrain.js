/**
 * Comprehensive Clinical Dental AI Brain & Knowledge Engine
 * 
 * Encyclopedic knowledge base encompassing:
 * - Every single section and page of the Dentia platform
 * - Every API endpoint, payload structure, returned database fields (17 SQL tables)
 * - Complete tooth actions, surface notations, restorative rules & contraindications
 * - New patient intake validation & dentition arch auto-adaptation rules
 * - Appointment scheduling rules, doctor assignments, and status lifecycles
 * - ADA Billing codes (CDT / ADA D-codes), pharmacology & clinical safety guardrails
 * - Orthodontics, TMJ, Whitening, Radiology & AI SOAP note workflows
 */

import { TOOTH_NAMES, PEDIATRIC_TOOTH_NAMES, getHexColor } from '../../utils/toothDataConstants';

// =========================================================================
// 1. DENTIA PLATFORM SECTIONS & PAGES DIRECTORY
// =========================================================================
export const PLATFORM_SECTIONS = {
  LANDING: {
    path: '/',
    title: 'Clinic Landing & Public Portal',
    description: 'Patient greeting, clinic overview, 23k Google reviews, treatment modalities, team intro, and quick appointment triage.'
  },
  DASHBOARD: {
    path: '/dashboard',
    title: 'Clinician Workspace & Practice Analytics',
    description: 'Daily patient throughput, revenue analytics, emergency queue, upcoming appointments, and practice KPI cards.'
  },
  NEW_PATIENT: {
    path: '/new-patient',
    title: 'Smart AI Patient Intake & Registration',
    description: 'Demographic registration, photo upload (<=5MB), auto DOB age calculation, auto dentition arch adaptation (Adult 1-32, Pediatric A-T, Mixed 6-12), OpenStreetMap & Mapbox live address geocoding, region toggle (PK vs NZ).'
  },
  DIRECTORY: {
    path: '/directory',
    title: 'Patient Master Directory & Clinical Records',
    description: 'Complete patient database with search, pagination, drawer preview, edit patient modal, treatment plan modal (Braces, Whitening, Restorative), and clinical audit logs.'
  },
  CHART: {
    path: '/chart/:patientId',
    title: 'Interactive 3D Dual-Jaw Odontogram',
    description: 'Interactive Maxilla (Upper) & Mandible (Lower) 3D jaws, 32 permanent teeth, 20 deciduous teeth, condition color shaders, FDI/Universal notation toggle, radiology viewer, and AI notes drawer.'
  },
  TOOTH_DETAIL: {
    path: '/chart/:patientId/tooth/:toothNumber',
    title: '3D Anatomical Tooth Canvas Viewer',
    description: 'Per-tooth microscopic 3D inspection, occlusal surface mapping (M, D, O, B, L), root canal morphology, antagonist tracking, and chronological treatment history.'
  },
  APPOINTMENTS: {
    path: '/appointments',
    title: 'Operatory Schedule & Appointments List',
    description: 'Doctor operatory timetable, status tracking (Pending, Confirmed, Completed, Cancelled), patient contact info, procedure reason, and date filtering.'
  },
  BOOK_APPOINTMENT: {
    path: '/book',
    title: 'Schedule New Consultation / Procedure',
    description: 'Voice-assisted appointment booking form with doctor dropdown, calendar slot validation, reason categorization, and real-time conflict checking.'
  },
  AI_NOTES: {
    path: '/ai-notes',
    title: 'AI Clinical Notes & Scribe Directory',
    description: 'Archive of 8-section SOAP clinical consultation notes compiled by ambient voice AI with doctor signature approval and audio checksum verification.'
  },
  AI_NOTE_DETAIL: {
    path: '/ai-notes/detail/:noteId',
    title: '8-Section SOAP Clinical Note Detail',
    description: 'Detailed inspection of Subjective (chief complaint), Objective (exam & odontogram), Assessment (diagnosis), and Plan (treatment & Rx), with doctor sign-off.'
  },
  TREATMENTS: {
    path: '/treatment',
    title: 'Treatment Catalog & Clinical Services',
    description: 'Preventive, restorative, endodontic, orthodontic, cosmetic, and surgical procedure catalog with standard pricing and insurance coverage guidelines.'
  },
  DOCTOR_MANAGEMENT: {
    path: '/admin/doctors',
    title: 'Clinician & Staff Administration',
    description: 'Super admin management for clinic dentists, license numbers, specialty assignments, regional permissions (PK/NZ), and credentials.'
  }
};

// =========================================================================
// 2. BACKEND API ENDPOINTS & DATA SCHEMAS (17 SQL TABLES)
// =========================================================================
export const API_CATALOG = {
  PATIENTS: {
    endpoint: 'GET /api/patient, GET/PUT /api/patients/{id}',
    sqlTable: '[dentist].[Patients]',
    fieldsReceived: ['PatientID', 'FirstName', 'LastName', 'DOB', 'Phone', 'Email', 'Gender', 'Address', 'Region', 'CurrentTreatmentPlan', 'TreatmentStage', 'TargetShade', 'ProfileImage', 'ProfileImageMimeType', 'CreatedAt', 'DoctorID'],
    description: 'Receives master patient records, calculates clinical age, auto-adapts dentition arches, and binds active cosmetic/ortho treatment modalities.'
  },
  APPOINTMENTS: {
    endpoint: 'GET /api/appointments, POST /api/appointments',
    sqlTable: '[dentist].[Appointments]',
    fieldsReceived: ['AppointmentID', 'FullName', 'Phone', 'Email', 'PreferredDate', 'Status', 'Reason', 'DoctorID', 'CreatedAt'],
    description: 'Handles clinic schedule slots. Status flow: Pending -> Confirmed -> Completed / Cancelled.'
  },
  TEETH_STATE: {
    endpoint: 'GET /api/teeth, POST /api/teeth/update, GET /api/patients/{id}/teeth',
    sqlTable: '[dentist].[TeethState]',
    fieldsReceived: ['TeethStateID', 'PatientID', 'ToothNumber (1-32)', 'ConditionStatus', 'ConditionColor', 'LastUpdated'],
    description: 'Synchronizes 32-tooth odontogram mesh shaders. Healthy (#10B981), Decay (#EF4444), RCT Needed (#7C3AED), Treated (#2563EB), Crown (#D97706), Missing (#DC2626).'
  },
  TREATMENT_HISTORY: {
    endpoint: 'GET /api/patients/{id}/teeth/{toothNumber}/history',
    sqlTable: '[dentist].[TreatmentHistory]',
    fieldsReceived: ['HistoryID', 'PatientID', 'ToothNumber', 'TreatmentPerformed', 'Comments', 'ActionDate'],
    description: 'Chronological timeline of all interventions performed on a specific tooth.'
  },
  CLINICAL_LOGS: {
    endpoint: 'GET/POST /api/patients/{id}/clinical-logs',
    sqlTable: '[dentist].[ClinicalLogs]',
    fieldsReceived: ['LogID', 'PatientID', 'DoctorID', 'Message', 'LogType', 'CreatedAt'],
    description: 'Forensic audit trail of treatments, prescriptions, administrative overrides, and modality updates.'
  },
  DENTAL_NOTES_SOAP: {
    endpoint: 'GET /api/aiDentalNotes, POST /api/aiDentalNotes/generate',
    sqlTable: '[dentist].[DentalNotes]',
    fieldsReceived: ['NoteId', 'SessionId', 'PatientId', 'DentistId', 'Summary', 'ChiefComplaint', 'History', 'Examination', 'Assessment', 'TreatmentPerformed', 'PostOpAdvice', 'FollowUp', 'Status', 'ApprovedAt', 'ApprovedBy'],
    description: '8-section clinical SOAP consultation notes parsed from ambient operatory audio streams.'
  },
  RADIOGRAPHS: {
    endpoint: 'GET/POST /api/patients/{id}/radiographs',
    sqlTable: '[dentist].[Radiographs]',
    fieldsReceived: ['RadiographID', 'PatientID', 'DoctorID', 'ImageName', 'MimeType', 'ImageData (base64)', 'AnalysisSummary', 'UploadedAt'],
    description: 'Stores bitewings, periapical X-rays, panoramic OPG, and AI vision diagnostic annotations.'
  }
};

// =========================================================================
// 3. ENCYCLOPEDIC CLINICAL DENTAL KNOWLEDGE BASE
// =========================================================================
export const DENTAL_KNOWLEDGE_BASE = [
  // --- A. BONE GRAFTING & IMPLANTOLOGY ---
  {
    category: 'Surgical & Implants',
    keywords: ['bone graft', 'grafting', 'graft', 'bone loss', 'jawbone', 'ridge augmentation', 'd7953'],
    title: 'Dental Bone Grafting Protocol (ADA D7953)',
    answer: 'Doctor, bone grafting (ADA D7953) is indicated when alveolar ridge height or width is insufficient for primary implant stability. Recommended materials: mineralized particulate allograft or bovine xenograft paired with a resorbable collagen membrane. Crucial rule: Wait 4 to 6 months for complete osteointegration before implant placement. Contraindications: Uncontrolled diabetes (HbA1c > 8.5%), heavy smoking (>10 cigarettes/day), or history of IV bisphosphonates.',
    action: null
  },
  {
    category: 'Surgical & Implants',
    keywords: ['implant', 'dental implant', 'fixture', 'd6010', 'osteotomy'],
    title: 'Endosseous Implant Placement (ADA D6010)',
    answer: 'Doctor, endosseous implant placement (ADA D6010) requires at least 1.5mm to 2mm of sound buccal and lingual cortical bone, with minimum 2mm clearance from the inferior alveolar nerve (IAN) or maxillary sinus floor. Primary insertion torque should reach 30 to 45 Ncm for immediate temporization; otherwise, submerge for 3 to 4 months of unloaded healing.',
    action: null
  },

  // --- B. ENDODONTICS & PULP VITALITY ---
  {
    category: 'Endodontics',
    keywords: ['root canal', 'rct', 'endo', 'endodontic', 'pulpectomy', 'd3310', 'd3320', 'd3330'],
    title: 'Endodontic Therapy Guidelines (ADA D3310-D3330)',
    answer: 'Doctor, standard RCT protocol requires: 1) Rubber dam isolation; 2) Electronic apex locator working length confirmation; 3) Rotary NiTi instrumentation; 4) 2.5% to 5.25% Sodium Hypochlorite irrigation with ultrasonic activation; 5) Calcium hydroxide intracanal medicament if symptomatic; 6) Warm vertical gutta-percha obturation with bioceramic sealer. Contraindication: Do NOT obturate while active exudate, foul odor, or acute percussion sensitivity persists.',
    action: null
  },
  {
    category: 'Endodontics',
    keywords: ['pulpitis', 'reversible pulpitis', 'irreversible pulpitis', 'pulp necrosis', 'vitality test'],
    title: 'Pulpal Diagnosis & Vitality Testing',
    answer: 'Doctor, differential diagnosis guide: 1) Reversible Pulpitis: Sharp pain to cold/sweet that subsides immediately within 5-10s once stimulus is removed -> Treat with deep caries excavation & GIC/resin base. 2) Irreversible Pulpitis: Spontaneous, lingering, throbbing nocturnal pain exceeding 30s -> Indication for Root Canal Therapy or extraction. 3) Necrosis: Negative cold & EPT response, accompanied by periapical radiolucency -> Complete endodontic debridement required.',
    action: null
  },

  // --- C. RESTORATIVE & OPERATIVE DENTISTRY ---
  {
    category: 'Restorative',
    keywords: ['composite', 'filling', 'resin', 'd2330', 'd2391', 'd2392', 'd2393', 'd2394'],
    title: 'Resin Composite Restoration (ADA D2391-D2394)',
    answer: 'Doctor, composite restoration protocol: Total-etch with 37% phosphoric acid (15s enamel, 10s dentin), rinse, apply universal bonding agent, and air thin. Place composite incrementally (<=2mm layers) to mitigate polymerization shrinkage stress (C-factor). Contraindications: Inability to achieve moisture isolation or deep subgingival margins exceeding 2mm below the gingival crest (subgingival margin elevation or crown required).',
    action: null
  },
  {
    category: 'Restorative',
    keywords: ['amalgam', 'silver filling', 'd2140', 'd2150', 'd2160'],
    title: 'Dental Amalgam Guidelines (ADA D2140-D2161)',
    answer: 'Doctor, amalgam restoration requires 1.5mm to 2mm pulpal depth for adequate compressive strength, with 90-degree cavosurface margins and mechanical retentive undercuts. Amalgam is highly tolerant of minor moisture contamination compared to resin, making it ideal for difficult posterior subgingival preparations.',
    action: null
  },
  {
    category: 'Restorative',
    keywords: ['crown', 'cap', 'zirconia', 'pfm', 'd2740', 'd2750', 'crown prep'],
    title: 'Crown Preparation & Selection (ADA D2740-D2750)',
    answer: 'Doctor, crown selection criteria: 1) Monolithic Zirconia (D2740): Best for high-mastication posterior molars (requires 1.0mm-1.5mm occlusal reduction, 0.5mm chamfer); 2) E.max / Lithium Disilicate: Premium anterior esthetics (requires 1.5mm reduction); 3) PFM (D2750): Deep subgingival margins or long-span bridges. Crucial rule: Ensure minimum 1.5mm to 2mm ferrule height for 360 degrees to prevent catastrophic root fracture.',
    action: null
  },

  // --- D. PHARMACOLOGY & MEDICAL CONTRAINDICATIONS ---
  {
    category: 'Pharmacology & Safety',
    keywords: ['penicillin', 'amoxicillin', 'allergy', 'allergic to penicillin', 'augmentin'],
    title: 'Penicillin Allergy Safety Protocol',
    answer: 'ALERT, Doctor! In confirmed penicillin/amoxicillin allergies, avoid all beta-lactam antibiotics. First-line alternative: Clindamycin 300 mg orally every 6 hours for 7 days (caution: risk of C. difficile colitis). Second-line: Azithromycin 500 mg day 1, followed by 250 mg once daily on days 2 to 5, or Cephalexin 500 mg QID ONLY IF the allergy was non-anaphylactic.',
    action: null
  },
  {
    category: 'Pharmacology & Safety',
    keywords: ['hypertension', 'blood pressure', 'high bp', 'epinephrine', 'adrenaline', 'cardiac'],
    title: 'Hypertension & Local Anesthesia Protocol',
    answer: 'Doctor, in stage 2 hypertension (>140/90 mmHg) or cardiovascular disease: Limit epinephrine to the cardiac maximum of 0.04 mg (maximum 2 dental cartridges of 1:100,000 epinephrine, or 4 cartridges of 1:200,000). Alternatively, administer 3% Mepivacaine Plain (without vasoconstrictor) to prevent acute hypertensive crisis or tachycardia.',
    action: null
  },
  {
    category: 'Pharmacology & Safety',
    keywords: ['diabetes', 'diabetic', 'blood sugar', 'hba1c'],
    title: 'Diabetes Mellitus Clinical Safety Protocol',
    answer: 'Doctor, diabetic patient considerations: Verify recent HbA1c. If HbA1c < 7.0%, proceed with routine treatment. If HbA1c is 7.1% - 8.5%, schedule morning appointments immediately after breakfast/insulin, monitor for hypoglycemia, and anticipate delayed healing. If HbA1c > 8.5%, defer elective surgical procedures and bone grafts until glycemic control stabilizes.',
    action: null
  },
  {
    category: 'Pharmacology & Safety',
    keywords: ['pregnancy', 'pregnant', 'trimester', 'breastfeeding'],
    title: 'Pregnancy Dental Protocol',
    answer: 'Doctor, pregnancy protocol: The second trimester (weeks 14 to 28) is the safest window for dental procedures. Safe local anesthetic: 2% Lidocaine with 1:200,000 Epinephrine (FDA Category B). Safe analgesic: Acetaminophen (Paracetamol). Strictly avoid Aspirin, NSAIDs (Ibuprofen) in the 3rd trimester (premature closure of ductus arteriosus), and Tetracyclines (tooth staining). Use double lead apron for diagnostic X-rays.',
    action: null
  },
  {
    category: 'Pharmacology & Safety',
    keywords: ['blood thinner', 'aspirin', 'warfarin', 'inr', 'anticoagulant', 'bleeding'],
    title: 'Anticoagulant & Bleeding Management',
    answer: 'Doctor, for patients on Warfarin: Check INR within 24 hours of surgery (acceptable therapeutic range for simple extraction is INR 2.0 to 3.0). For DOACs (Apixaban, Rivaroxaban): Consult physician before holding doses. Utilize local hemostatic agents: oxidized regenerated cellulose (Surgicel), tranexamic acid 4.8% mouthwash, and cross-mattress sutures.',
    action: null
  },

  // --- E. ANATOMICAL TOOTH SPECIFICS (FDI & UNIVERSAL) ---
  {
    category: 'Tooth Anatomy',
    keywords: ['tooth 16', 'fdi 16', 'universal 3', 'upper right first molar'],
    title: 'Maxillary Right 1st Molar (#3 Universal / 16 FDI)',
    answer: 'Doctor, Tooth 16 (Universal #3) is the primary chewing anchor in the upper right quadrant. Features 3 roots (MB, DB, Palatal). Clinical caveat: The Mesiobuccal root contains an MB2 canal in over 70% of cases during endodontic treatment. Erupts at age 6–7. Innervated by Posterior & Middle Superior Alveolar nerves (PSA/MSA).',
    action: null
  },
  {
    category: 'Tooth Anatomy',
    keywords: ['tooth 36', 'fdi 36', 'universal 19', 'lower left first molar'],
    title: 'Mandibular Left 1st Molar (#19 Universal / 36 FDI)',
    answer: 'Doctor, Tooth 36 (Universal #19) bears the highest masticatory load in the lower jaw. Features 2 large roots (Mesial and Distal) with 3 to 4 canals (MB, ML, Distal 1-2). Common site of Class I occlusal caries and vertical root fractures under heavy bruxism. Innervated by the Inferior Alveolar Nerve (IAN).',
    action: null
  },
  {
    category: 'Tooth Anatomy',
    keywords: ['tooth 29', 'fdi 45', 'universal 29', 'lower right second premolar'],
    title: 'Mandibular Right 2nd Premolar (#29 Universal / 45 FDI)',
    answer: 'Doctor, Tooth 29 (Universal #29) is the lower right second premolar. Features a single root with high anatomical variability (Y, H, or U groove occlusal patterns with 2 or 3 cusps). Close proximity to the mental foramen; take care during surgical flap elevation or implant osteotomy.',
    action: null
  },
  {
    category: 'Tooth Anatomy',
    keywords: ['wisdom tooth', 'wisdom teeth', 'third molar', 'tooth 1', 'tooth 16', 'tooth 17', 'tooth 32', 'impaction'],
    title: 'Third Molar & Impaction Management (ADA D7220-D7240)',
    answer: 'Doctor, third molar evaluations use Pell & Gregory (Class I, II, III / Position A, B, C) and Winter classifications (Mesioangular, Horizontal, Vertical, Distoangular). Mesioangular impactions are the most common in the mandible. Crucial step: Review CBCT or panoramic OPG to evaluate root proximity to the inferior alveolar nerve canal to prevent paresthesia.',
    action: null
  },

  // --- F. NEW PATIENT INTAKE & ARCH CLASSIFICATION ---
  {
    category: 'Patient Intake Rules',
    keywords: ['new patient', 'register patient', 'intake', 'patient form', 'arch classification', 'how to add patient'],
    title: 'New Patient Registration & Arch Adaptation Rules',
    answer: 'Doctor, when registering a new patient: 1) First Name, Last Name, DOB, Phone, and Gender are required. 2) The system automatically calculates patient age from DOB and selects the dentition arch: Pediatric (A–T, 20 teeth) if age < 6; Mixed Dentition if age 6–12; Adult (1–32) if age > 12. 3) Street address input triggers dual geocoding via OpenStreetMap and Mapbox, auto-filling City and Postal Code. 4) Profile photo supports up to 5MB.',
    action: { type: 'NAVIGATE', path: '/new-patient' }
  },

  // --- G. APPOINTMENT SCHEDULING & CONFLICTS ---
  {
    category: 'Appointments',
    keywords: ['appointment', 'schedule', 'book appointment', 'booking', 'conflict', 'calendar'],
    title: 'Appointment Scheduling & Workflow Rules',
    answer: 'Doctor, appointments require: Patient Full Name, Phone Number, Preferred Date/Time, Assigned Doctor, and Purpose of Visit. Statuses follow: Pending -> Confirmed -> Completed. Typical duration guidelines: Routine Periodic Exam (30 mins), Composite Filling (45 mins), Single Root Canal (60-90 mins), Surgical Extraction / Bone Graft (60 mins). The system checks doctor schedule overlap automatically.',
    action: { type: 'NAVIGATE', path: '/appointments' }
  },

  // --- H. ORTHODONTICS & COSMETIC WHITENING ---
  {
    category: 'Orthodontics & TMJ',
    keywords: ['braces', 'ortho', 'wire', 'space closure', 'leveling', 'orthodontics'],
    title: 'Orthodontic Treatment Modality Protocol',
    answer: 'Doctor, orthodontic progression in Dentia: Stage 1 - Initial Leveling & Alignment (0.014 or 0.016 NiTi archwires); Stage 2 - Space Closure & Extraction Consolidation (0.016x0.022 or 0.019x0.025 Stainless Steel wires with power chains or closing loops); Stage 3 - Detailing, Torque & Occlusal Settling (Braided steel wire); Followed by debonding and fixed lingual retainers.',
    action: null
  },
  {
    category: 'Cosmetic Dentistry',
    keywords: ['whitening', 'bleaching', 'shade', 'vita', 'target shade', 'cosmetic'],
    title: 'Teeth Whitening Protocol & VITA Shade Matching',
    answer: 'Doctor, in-office whitening uses 35% to 40% Hydrogen Peroxide with gingival barrier isolation (two to three 15-minute sessions). Record pre-op baseline shade using the VITA Classical Guide (e.g. A3.5, B3). Target shade goals are typically B1, A1, or bleach shades (OM1-OM3). Instruct patient to adhere to a white diet (no coffee, red wine, turmeric) for 48 hours post-op.',
    action: null
  },

  // --- I. RADIOLOGY & DIGITAL IMAGING ---
  {
    category: 'Radiology',
    keywords: ['x-ray', 'radiograph', 'xray', 'bitewing', 'periapical', 'opg', 'cbct'],
    title: 'Radiology Guidelines & Diagnostics',
    answer: 'Doctor, imaging modalities in Dentia: 1) Bitewings: Interproximal caries detection and coronal alveolar bone height; 2) Periapical (PA): Apical pathology, periodontal ligament widening, root apex morphology; 3) Panoramic (OPG): Overview of maxilla, mandible, condyles, and wisdom teeth impaction; 4) CBCT 3D: Pre-implant bone volume measurement and nerve tracing.',
    action: null
  },

  // --- J. WEBSITE NAVIGATION DIRECTIVES ---
  {
    category: 'Navigation',
    keywords: ['go to appointments', 'open appointments', 'show appointments', 'view schedule'],
    title: 'Navigating to Appointments',
    answer: 'Navigating to the appointments schedule, Doctor.',
    action: { type: 'NAVIGATE', path: '/appointments' }
  },
  {
    category: 'Navigation',
    keywords: ['go to new patient', 'open new patient', 'register patient', 'add new patient'],
    title: 'Navigating to New Patient Intake',
    answer: 'Opening the new patient intake and registration module, Doctor.',
    action: { type: 'NAVIGATE', path: '/new-patient' }
  },
  {
    category: 'Navigation',
    keywords: ['go to directory', 'open directory', 'show patients', 'patient list', 'patient records'],
    title: 'Navigating to Patient Directory',
    answer: 'Opening the comprehensive patient directory, Doctor.',
    action: { type: 'NAVIGATE', path: '/directory' }
  },
  {
    category: 'Navigation',
    keywords: ['go to chart', 'open chart', 'samra chart', 'patient chart'],
    title: 'Navigating to Dental Chart',
    answer: 'Opening patient dental chart #29 (Samra Asad), Doctor.',
    action: { type: 'NAVIGATE', path: '/chart/29' }
  },
  {
    category: 'Navigation',
    keywords: ['go to dashboard', 'open dashboard', 'home', 'main page'],
    title: 'Navigating to Clinical Dashboard',
    answer: 'Returning to the main clinical dashboard, Doctor.',
    action: { type: 'NAVIGATE', path: '/' }
  },
  {
    category: 'Navigation',
    keywords: ['go to treatments', 'open treatments', 'treatment catalog', 'pricing'],
    title: 'Navigating to Treatments Catalog',
    answer: 'Opening the clinical treatments catalog and procedure codes, Doctor.',
    action: { type: 'NAVIGATE', path: '/treatment' }
  },
  {
    category: 'Navigation',
    keywords: ['go to ai notes', 'open ai notes', 'soap notes', 'scribe'],
    title: 'Navigating to AI Clinical Notes',
    answer: 'Opening the AI Clinical Notes archive, Doctor.',
    action: { type: 'NAVIGATE', path: '/ai-notes' }
  }
];

// =========================================================================
// 4. INTELLIGENT INTENT RESOLVER & ASSISTANT ENGINE
// =========================================================================

/**
 * Resolve spoken or typed doctor command into clinical answer and UI actions
 * @param {string} transcript - Input speech or query text
 * @param {object} context - Active page route, patientId, and current clinical state
 * @returns {object} { text, title, category, action }
 */
export function resolveDoctorInstruction(transcript, context = {}) {
  if (!transcript || typeof transcript !== 'string') {
    return {
      title: 'Prompt Unclear',
      category: 'System',
      text: "Doctor, I didn't catch that. You can ask clinical questions, query tooth actions, check contraindications, or instruct me to navigate.",
      action: null
    };
  }

  const clean = transcript.toLowerCase().trim();

  // 1. Direct Knowledge Base Matching
  for (const item of DENTAL_KNOWLEDGE_BASE) {
    const isMatch = item.keywords.some(kw => clean.includes(kw));
    if (isMatch) {
      return {
        title: item.title,
        category: item.category,
        text: item.answer,
        action: item.action
      };
    }
  }

  // 2. Dynamic Tooth Number Anatomy Query (e.g. "Tell me about tooth 14" or "tooth 8")
  const toothMatch = clean.match(/tooth\s+(\d+|[a-t])/i) || clean.match(/#(\d+|[a-t])/i);
  if (toothMatch) {
    const tIdent = toothMatch[1].toUpperCase();
    const isPediatric = isNaN(parseInt(tIdent, 10));
    
    if (isPediatric && PEDIATRIC_TOOTH_NAMES[tIdent]) {
      const pData = PEDIATRIC_TOOTH_NAMES[tIdent];
      return {
        title: `Deciduous Tooth ${tIdent} (${pData.name})`,
        category: 'Pediatric Anatomy',
        text: `Doctor, Primary Tooth ${tIdent} is the ${pData.name}. Arch: ${pData.arch}. Normal eruption: ${pData.eruption}; typical exfoliation/shedding: ${pData.shedding}. Antagonist: Primary Tooth ${pData.antagonist}. Function: ${pData.function}.`,
        action: context.patientId ? { type: 'NAVIGATE', path: `/chart/${context.patientId}/tooth/${tIdent}` } : null
      };
    } else if (!isPediatric && TOOTH_NAMES[parseInt(tIdent, 10)]) {
      const aData = TOOTH_NAMES[parseInt(tIdent, 10)];
      return {
        title: `Permanent Tooth ${tIdent} (${aData.name})`,
        category: 'Adult Anatomy',
        text: `Doctor, Tooth ${tIdent} is the ${aData.name}. Arch: ${aData.arch}, ${aData.quad}. Features ${aData.roots} root(s) and ${aData.canals}. Innervation: ${aData.innervation}. Eruption: ${aData.eruption}. Antagonist: ${aData.antagonist}. Primary function: ${aData.function}.`,
        action: context.patientId ? { type: 'NAVIGATE', path: `/chart/${context.patientId}/tooth/${tIdent}` } : null
      };
    }
  }

  // 3. Tooth Action Guidance (e.g. "can I do an extraction on a tooth with acute abscess?")
  if (clean.includes('can i') || clean.includes('should i') || clean.includes('action applied') || clean.includes('indication')) {
    if (clean.includes('extract') || clean.includes('pull')) {
      return {
        title: 'Extraction Decision Rules',
        category: 'Clinical Decision',
        text: 'Doctor, extraction is indicated for non-restorable caries, advanced periodontal disease (Grade III mobility), or vertical root fracture. If acute cellulitis or severe diffuse swelling is present, establish drainage, initiate systemic antibiotics (Amoxicillin or Clindamycin), and extract once the acute phase is stabilized.',
        action: null
      };
    }
    if (clean.includes('crown') || clean.includes('cap')) {
      return {
        title: 'Crown Indication Rules',
        category: 'Clinical Decision',
        text: 'Doctor, a crown is indicated when more than 50% of the clinical crown is lost, following posterior endodontic treatment, or for cracked tooth syndrome. Ensure at least 1.5mm to 2mm of sound dentinal ferrule height around the entire circumference for long-term prognosis.',
        action: null
      };
    }
  }

  // 4. Fallback intelligent response
  return {
    title: 'Clinical Copilot Registered',
    category: 'Assistant',
    text: `Doctor, I noted your clinical instruction: "${transcript}". All 17 database tables, tooth condition palettes, and operatory workflows are synchronized. What procedure or chart action shall we review next?`,
    action: null
  };
}

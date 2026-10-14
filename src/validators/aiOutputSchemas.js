import { z } from 'zod';

/**
 * 🦷 DENTIA CLINICAL AI OUTPUT VALIDATION SCHEMAS
 * Single source of truth for frontend AI response validation & type safety.
 */

// 1. Clinical Note Summarizer Schema (v1.0.0 & v2.0.0 compatible)
export const clinicalNoteOutputSchema = z.object({
  status: z.enum(['complete', 'incomplete']),
  missingFields: z.array(z.string()).default([]),
  doctorPrompt: z.string().nullable().optional(),
  flags: z.array(z.string()).default([]),
  teethUpdates: z.array(z.object({
    toothNumber: z.number().int(),
    fdiNumber: z.number().int().optional(),
    status: z.enum([
      'HEALTHY',
      'DAMAGED / DECAY',
      'ROOT CANAL NEEDED',
      'CLEANING NEEDED',
      'ALREADY TREATED',
      'MISSING / EXTRACTED'
    ]),
    condition: z.string().optional(),
    evidence: z.string().optional()
  })).default([]),
  draftNote: z.object({
    summary: z.string().default('insufficient data'),
    chiefComplaint: z.string().default('insufficient data'),
    history: z.string().default('insufficient data'),
    examination: z.string().default('insufficient data'),
    radiographs: z.string().default('insufficient data'),
    assessment: z.string().default('insufficient data'),
    treatmentPerformed: z.string().default('insufficient data'),
    postOpAdvice: z.string().default('insufficient data'),
    followUp: z.string().nullable().optional(),
    prescriptions: z.array(z.object({
      medicationName: z.string(),
      strength: z.string().nullable().optional(),
      dose: z.string().nullable().optional(),
      route: z.string().nullable().optional(),
      frequency: z.string().nullable().optional(),
      duration: z.string().nullable().optional(),
      instructions: z.string().nullable().optional(),
      evidence: z.string().optional()
    })).default([]),
    disclaimer: z.string().default('AI-generated suggestion, requires dentist review')
  })
});

// 2. Radiograph Findings Helper Schema
export const radiographFindingsOutputSchema = z.object({
  modality: z.string(),
  overview: z.string(),
  primaryTooth: z.number().int().nullable().optional(),
  teethFindings: z.array(z.object({
    toothNumber: z.number().int(),
    fdiNumber: z.number().int().optional(),
    condition: z.string(),
    severity: z.enum(['Incipient', 'Moderate', 'Severe', 'Not Applicable']).default('Not Applicable'),
    confidence: z.number().min(0).max(100).default(95),
    cdtCode: z.string().optional(),
    procedure: z.string().optional(),
    color: z.string().default('#EF4444'),
    status: z.string().default('Planned')
  })).default([]),
  radiologySoap: z.object({
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string()
  }),
  disclaimer: z.string().default('AI-generated suggestion, requires dentist review')
});

// 3. Treatment Plan from Odontogram Schema
export const treatmentPlanOutputSchema = z.object({
  clinicalSummary: z.string().min(1),
  medicalAlertWarnings: z.array(z.string()).default([]),
  phases: z.array(z.object({
    phaseNumber: z.number().int(),
    phaseName: z.string(),
    estimatedTimeline: z.string().optional(),
    items: z.array(z.object({
      fdiTooth: z.number().int().nullable().optional(),
      procedure: z.string(),
      cdtCode: z.string().optional(),
      rationale: z.string(),
      urgency: z.enum(['Immediate', 'High', 'Moderate', 'Elective']).default('Moderate')
    }))
  })),
  disclaimer: z.string().default('AI-generated suggestion, requires dentist review')
});

// 4. Patient-Friendly Explanation Schema
export const patientExplanationOutputSchema = z.object({
  language: z.string(),
  headline: z.string(),
  whatIsHappening: z.string(),
  whatWeNeedToDo: z.string(),
  willItHurt: z.string(),
  todayAdvice: z.array(z.string()).default([]),
  disclaimer: z.string().default('AI-generated patient education, verified by clinic dentist')
});

// 5. Clinic Analytics Insights Schema
export const clinicAnalyticsOutputSchema = z.object({
  period: z.string(),
  headlineSummary: z.string(),
  kpiHighlights: z.array(z.object({
    label: z.string(),
    value: z.string(),
    assessment: z.enum(['Positive', 'Neutral', 'Attention Needed']).default('Neutral')
  })),
  clinicalProcedureBreakdown: z.string(),
  operationalRecommendations: z.array(z.string()).default([]),
  disclaimer: z.string().default('Generated from verified practice database metrics')
});

// 6. Voice Command & Intent Parser Schema
export const voiceCommandOutputSchema = z.object({
  intent: z.enum([
    'SET_TOOTH_CONDITION',
    'OPEN_PATIENT',
    'NAVIGATE',
    'OPEN_IMAGING',
    'START_SCRIBE',
    'STOP_SCRIBE',
    'CLINIC_QUERY',
    'JARVIS_SLEEP',
    'DESTRUCTIVE_ACTION',
    'UNKNOWN'
  ]),
  confidence: z.number().min(0).max(1),
  needsConfirmation: z.boolean(),
  spokenReply: z.string(),
  entities: z.object({
    fdiTooth: z.number().int().nullable().optional(),
    surface: z.string().nullable().optional(),
    condition: z.string().nullable().optional(),
    statusColor: z.string().nullable().optional(),
    patientId: z.number().int().nullable().optional(),
    patientName: z.string().nullable().optional(),
    navigationPath: z.string().nullable().optional(),
    modalType: z.string().nullable().optional()
  }).default({})
});

// 7. Patient Intake Extractor Schema
export const patientIntakeOutputSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  estimatedAge: z.number().int().nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().default('PK'),
  nhiNumber: z.string().nullable().optional(),
  currentTreatmentPlan: z.string().default('General Consultation'),
  allergies: z.array(z.string()).default([]),
  medicalNotes: z.string().nullable().optional(),
  extractedFields: z.array(z.string()).default([])
});

// 8. Clinical Copilot Q&A Schema
export const copilotQAOutputSchema = z.object({
  isDentalRelated: z.boolean(),
  answer: z.string(),
  recommendedCdtCodes: z.array(z.string()).default([]),
  relevantFdiTeeth: z.array(z.number().int()).default([]),
  formularyGuidance: z.array(z.object({
    genericDrug: z.string(),
    standardDose: z.string(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    clinicalNote: z.string().optional()
  })).default([]),
  disclaimer: z.string().default('AI-generated clinical suggestion, requires dentist review and independent verification')
});

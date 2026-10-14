import { z } from 'zod';
import { isValidFdiTooth, sanitizeText } from './normalizationUtils.js';

export const VALID_SURFACES = ['M', 'O', 'D', 'B', 'L', 'I', 'V', 'Cervical', 'Root', 'Full'];

export const CLINICAL_CONDITIONS = [
  'Healthy',
  'Caries',
  'Restored',
  'Composite Filling',
  'Amalgam Filling',
  'Crown',
  'Root Canal',
  'Missing',
  'Implant',
  'Fractured',
  'Bridge Abutment',
  'Fixed Partial Denture (Bridge)',
  'Impacted',
  'Decayed',
  'Periapical Abscess',
  'Periodontal Bone Loss'
];

export const OdontogramEntrySchema = z.object({
  toothNumber: z.number({
    required_error: 'Valid FDI tooth number is required.'
  }).int().refine(val => isValidFdiTooth(val), {
    message: 'Tooth number must be a valid FDI notation (Adult: 11-48, Pediatric: 51-85).'
  }),

  toothKey: z.string().trim().max(10).optional(),

  dentitionCategory: z.enum(['Adult', 'Pediatric', 'Mixed']).default('Adult'),

  surface: z.enum(VALID_SURFACES, {
    errorMap: () => ({ message: 'Invalid surface code. Allowed: M, O, D, B, L, I, V, Cervical, Root, Full.' })
  }).optional(),

  conditionStatus: z.string({
    required_error: 'Clinical condition status is required.'
  }).refine(val => CLINICAL_CONDITIONS.some(c => c.toLowerCase() === val.toLowerCase()), {
    message: 'Condition must be selected from the predefined clinical diagnosis catalog.'
  }),

  conditionColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color code.').default('#10b981'),

  comments: z.string().optional().or(z.literal(''))
    .transform(val => sanitizeText(val || '', 1000)),

  fee: z.number().min(0, 'Procedure fee cannot be negative.').max(1000000, 'Fee exceeds maximum threshold.').refine(val => {
    return Number(val.toFixed(2)) === val;
  }, 'Fee must have at most 2 decimal places.').default(0)
});

export const BulkTeethUpdateSchema = z.object({
  patientId: z.number().int().positive('Valid PatientID is required.'),
  teeth: z.array(OdontogramEntrySchema).min(1, 'At least one tooth update is required.')
});

export function validateOdontogramEntry(data) {
  const result = OdontogramEntrySchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {}, data: result.data };
  }

  const errors = {};
  result.error.issues.forEach(issue => {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  });

  return { isValid: false, errors, data: null };
}

import { z } from 'zod';
import { normalizePakistaniPhone, validateCnic, sanitizeText, normalizeEmail } from './normalizationUtils.js';

/**
 * Zod Schema for Patient Intake and Updates.
 * Enforces complete data accuracy across name, phone, email, CNIC, DOB, gender, and clinical history.
 */
export const PatientSchema = z.object({
  firstName: z.string({
    required_error: 'First name is required.'
  })
    .trim()
    .min(2, 'First name must contain at least 2 letters.')
    .max(50, 'First name cannot exceed 50 characters.')
    .regex(/^[a-zA-Z\s.'-]+$/, 'First name should only contain letters, spaces, dots, or hyphens.')
    .transform(val => sanitizeText(val, 50)),

  lastName: z.string({
    required_error: 'Last name is required.'
  })
    .trim()
    .min(2, 'Last name must contain at least 2 letters.')
    .max(50, 'Last name cannot exceed 50 characters.')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Last name should only contain letters, spaces, dots, or hyphens.')
    .transform(val => sanitizeText(val, 50)),

  dob: z.string({
    required_error: 'Date of birth is required.'
  })
    .refine(val => {
      if (!val) return false;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      if (d > now) return false;
      const ageYears = (now - d) / (365.25 * 24 * 3600 * 1000);
      return ageYears >= 0 && ageYears <= 120;
    }, 'Date of birth must be a valid calendar date (age between 0 and 120 years, cannot be in future).'),

  phone: z.string({
    required_error: 'Contact phone number is required.'
  })
    .refine(val => {
      const res = normalizePakistaniPhone(val);
      return res.isValid;
    }, 'Invalid Pakistani mobile number. Must be 11 digits (e.g. 03001234567 or +923001234567).')
    .transform(val => normalizePakistaniPhone(val).normalized),

  email: z.string().optional().or(z.literal(''))
    .refine(val => {
      if (!val || val.trim() === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) && val.trim().length <= 254;
    }, 'Please enter a valid email format (e.g. patient@domain.com, max 254 characters).')
    .transform(val => normalizeEmail(val)),

  cnic: z.string().optional().or(z.literal(''))
    .refine(val => {
      if (!val || val.trim() === '') return true;
      return validateCnic(val).isValid;
    }, 'Invalid CNIC format. Expected 13 digits with hyphens (e.g. 35201-1234567-1).')
    .transform(val => (val ? val.trim() : '')),

  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select patient gender (Male, Female, or Other).' })
  }),

  dentitionType: z.enum(['Adult', 'Pediatric', 'Mixed']).default('Adult'),

  address: z.string().optional().or(z.literal(''))
    .transform(val => sanitizeText(val || '', 250)),

  allergies: z.string().optional().default('None')
    .transform(val => (val && val.trim() ? sanitizeText(val, 500) : 'None')),

  medicalNotes: z.string().optional().or(z.literal(''))
    .transform(val => sanitizeText(val || '', 2000)),

  medications: z.string().optional().or(z.literal(''))
    .transform(val => sanitizeText(val || '', 1000)),

  emergencyContact: z.string().optional().or(z.literal(''))
    .transform(val => sanitizeText(val || '', 100))
});

/**
 * Validates patient form state and returns formatted field errors object.
 */
export function validatePatientForm(data) {
  const result = PatientSchema.safeParse(data);
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

export const patientSchema = PatientSchema;

import { z } from 'zod';
import { normalizePakistaniPhone, sanitizeText, normalizeEmail } from './normalizationUtils.js';

export const APPOINTMENT_STATUSES = ['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

/**
 * Validates allowable state transitions for appointments.
 * Terminal states (completed, cancelled) cannot be reverted without administrative override.
 */
export function isValidStatusTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return true;
  const curr = String(currentStatus).toLowerCase().replace(/\s+/g, '_');
  const next = String(nextStatus).toLowerCase().replace(/\s+/g, '_');

  if (curr === next) return true;

  const transitions = {
    pending: ['scheduled', 'confirmed', 'cancelled', 'no_show'],
    scheduled: ['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    confirmed: ['in_progress', 'completed', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // Terminal
    cancelled: ['scheduled'], // Re-book
    no_show: ['scheduled'] // Re-book
  };

  const allowed = transitions[curr];
  return allowed ? allowed.includes(next) : true;
}

export const AppointmentSchema = z.object({
  patientID: z.number({
    required_error: 'Patient selection is required.'
  }).int().positive('Please select a valid patient.'),

  doctorID: z.number({
    required_error: 'Attending dentist selection is required.'
  }).int().positive('Please choose an attending specialist.'),

  fullName: z.string({
    required_error: 'Patient full name is required.'
  })
    .trim()
    .min(2, 'Full name must contain at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Invalid characters in patient name.')
    .transform(val => sanitizeText(val, 100)),

  phone: z.string({
    required_error: 'Contact phone number is required.'
  })
    .refine(val => normalizePakistaniPhone(val).isValid, 'Invalid Pakistani mobile number (+923XXXXXXXXX or 03XXXXXXXXX).')
    .transform(val => normalizePakistaniPhone(val).normalized),

  email: z.string().optional().or(z.literal(''))
    .refine(val => {
      if (!val || val.trim() === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    }, 'Invalid email address format.')
    .transform(val => normalizeEmail(val)),

  preferredDate: z.string({
    required_error: 'Appointment date and time is required.'
  })
    .refine(val => {
      if (!val) return false;
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      return true;
    }, 'Please choose a valid calendar date and time.')
    .refine(val => {
      const d = new Date(val);
      // Ensure not in past (allow 2-minute clock skew)
      return d.getTime() >= Date.now() - 120000;
    }, 'Appointment date and time cannot be in the past.')
    .refine(val => {
      const d = new Date(val);
      const hours = d.getHours();
      // Clinic operating hours: 08:00 to 20:00 (8 AM to 8 PM)
      return hours >= 8 && hours < 20;
    }, 'Appointment time must be within clinic working hours (08:00 AM - 08:00 PM).'),

  durationMinutes: z.number().int().min(15, 'Minimum appointment duration is 15 minutes.').max(240, 'Maximum duration is 240 minutes (4 hours).').default(30),

  status: z.enum(['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).default('pending'),

  reason: z.string({
    required_error: 'Please enter the primary reason for appointment.'
  })
    .trim()
    .min(3, 'Reason must be at least 3 characters.')
    .max(250, 'Reason cannot exceed 250 characters.')
    .transform(val => sanitizeText(val, 250)),

  notes: z.string().optional().or(z.literal(''))
    .transform(val => sanitizeText(val || '', 1000))
});

export function validateAppointmentForm(data) {
  const result = AppointmentSchema.safeParse(data);
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

export const appointmentSchema = AppointmentSchema;

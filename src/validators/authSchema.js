import { z } from 'zod';
import { normalizePakistaniPhone, sanitizeText } from './normalizationUtils.js';

/**
 * Regex for strong password policy:
 * - At least 8 characters
 * - At least one uppercase letter [A-Z]
 * - At least one lowercase letter [a-z]
 * - At least one numeric digit [0-9]
 * - At least one special symbol [!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]
 * - Maximum 72 characters (BCrypt truncates beyond 72 bytes)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,72}$/;

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(72, 'Password cannot exceed 72 characters.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/\d/, 'Password must contain at least one number.')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character.');

/**
 * Staff / Doctor login schema
 */
export const doctorLoginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .max(254, 'Email must not exceed 254 characters.'),
  password: z.string()
    .min(1, 'Password is required.')
    .max(72, 'Password cannot exceed 72 characters.')
});

/**
 * Staff / Doctor registration schema
 */
export const doctorRegisterSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, hyphens, and periods.')
    .transform(sanitizeText),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .max(254, 'Email cannot exceed 254 characters.'),
  phone: z.string()
    .min(1, 'Phone number is required.')
    .refine((val) => normalizePakistaniPhone(val).isValid, {
      message: 'Invalid Pakistani mobile number. Expected format: 03XXXXXXXXX or +923XXXXXXXXX'
    })
    .transform((val) => normalizePakistaniPhone(val).normalized),
  role: z.enum(['admin', 'dentist', 'staff', 'assistant', 'hygienist'], {
    errorMap: () => ({ message: 'Role must be admin, dentist, staff, assistant, or hygienist.' })
  }).default('dentist'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password.')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

/**
 * Patient portal login schema
 */
export const patientPortalLoginSchema = z.object({
  identifier: z.string()
    .trim()
    .min(1, 'Please enter your Mobile number, CNIC, or MRN.')
    .max(100, 'Identifier is too long.')
    .transform(sanitizeText),
  password: z.string()
    .min(1, 'Password is required.')
    .max(72, 'Password cannot exceed 72 characters.')
});

/**
 * Patient portal registration / activation schema
 */
export const patientPortalRegisterSchema = z.object({
  phone: z.string()
    .min(1, 'Phone number is required.')
    .refine((val) => normalizePakistaniPhone(val).isValid, {
      message: 'Invalid Pakistani mobile number (e.g. 03001234567).'
    })
    .transform((val) => normalizePakistaniPhone(val).normalized),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password.')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

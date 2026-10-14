import { z } from 'zod';
import { isValidFdiToothNumber, sanitizeText } from './normalizationUtils.js';

export const IMAGE_TYPES = [
  'intraoral',
  'panoramic',
  'bitewing',
  'periapical',
  'sensor_capture',
  'cephalometric',
  'cbct',
  'other'
];

/**
 * Validates radiograph / X-ray upload payload.
 * Enforces tooth number validity, payload size limits (max 25MB base64), and sanitized notes.
 */
export const xrayUploadSchema = z.object({
  patientId: z.coerce.number()
    .int('Patient ID must be an integer.')
    .positive('Patient ID must be greater than 0.'),
  toothNumber: z.coerce.number()
    .int()
    .nullable()
    .optional()
    .refine((val) => val == null || isValidFdiToothNumber(val), {
      message: 'Tooth number must be a valid FDI notation number (11-48 for adult, 51-85 for primary).'
    }),
  imageType: z.string()
    .trim()
    .toLowerCase()
    .refine((val) => IMAGE_TYPES.includes(val), {
      message: `Image type must be one of: ${IMAGE_TYPES.join(', ')}`
    })
    .default('periapical'),
  imageData: z.string()
    .min(100, 'Image data is too small or empty.')
    .max(35 * 1024 * 1024, 'Image size exceeds maximum allowed upload size (25MB).')
    .refine((val) => {
      // Must be a data URI or valid base64 representation
      return val.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 500));
    }, {
      message: 'Invalid image format. Expected valid Base64 or Data URI.'
    }),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val, 500) : ''))
});

/**
 * Filter query schema for patient radiographs
 */
export const xrayFilterSchema = z.object({
  patientId: z.coerce.number().int().positive().optional(),
  toothNumber: z.coerce.number().int().optional(),
  imageType: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional()
});

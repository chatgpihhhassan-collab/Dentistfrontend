import { z } from 'zod';
import { sanitizeText, validateLuhnCardNumber } from './normalizationUtils.js';

/**
 * Invoice line item schema
 */
export const invoiceItemSchema = z.object({
  treatmentId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string()
    .trim()
    .min(2, 'Description must be at least 2 characters.')
    .max(200, 'Description cannot exceed 200 characters.')
    .transform((val) => sanitizeText(val, 200)),
  quantity: z.coerce.number()
    .int('Quantity must be an integer.')
    .min(1, 'Quantity must be at least 1.')
    .max(100, 'Quantity cannot exceed 100.'),
  unitPrice: z.coerce.number()
    .min(0, 'Unit price cannot be negative.')
    .max(10000000, 'Unit price exceeds maximum threshold (10,000,000 PKR).')
    .transform((val) => Math.round(val * 100) / 100),
  discount: z.coerce.number()
    .min(0, 'Discount cannot be negative.')
    .default(0)
    .transform((val) => Math.round(val * 100) / 100)
}).refine((item) => item.discount <= item.unitPrice * item.quantity, {
  message: 'Discount cannot be greater than line item subtotal.',
  path: ['discount']
});

/**
 * Invoice creation / update schema
 */
export const invoiceSchema = z.object({
  patientId: z.coerce.number()
    .int('Patient ID must be an integer.')
    .positive('Patient ID must be greater than 0.'),
  appointmentId: z.coerce.number().int().positive().optional().nullable(),
  items: z.array(invoiceItemSchema)
    .min(1, 'Invoice must have at least one line item.'),
  taxRate: z.coerce.number()
    .min(0, 'Tax rate cannot be negative.')
    .max(100, 'Tax rate cannot exceed 100%.')
    .default(0),
  overallDiscount: z.coerce.number()
    .min(0, 'Discount cannot be negative.')
    .default(0),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters.')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val, 500) : ''))
});

/**
 * Payment processing schema
 */
export const paymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive('Invoice ID is required.'),
  amount: z.coerce.number()
    .positive('Payment amount must be greater than 0.')
    .max(10000000, 'Amount exceeds maximum threshold.')
    .transform((val) => Math.round(val * 100) / 100),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'easypaisa', 'jazzcash', 'online'], {
    errorMap: () => ({ message: 'Invalid payment method selected.' })
  }),
  referenceNumber: z.string()
    .max(60, 'Reference number cannot exceed 60 characters.')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val, 60) : '')),
  notes: z.string()
    .max(250, 'Notes cannot exceed 250 characters.')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val, 250) : ''))
});

/**
 * Credit/Debit card online checkout schema
 */
export const cardCheckoutSchema = z.object({
  cardNumber: z.string()
    .min(1, 'Card number is required.')
    .refine((val) => validateLuhnCardNumber(val), {
      message: 'Invalid credit card number (failed Luhn checksum).'
    }),
  cardHolder: z.string()
    .trim()
    .min(3, 'Cardholder name is required.')
    .max(70, 'Cardholder name is too long.')
    .regex(/^[A-Za-z\s.'-]+$/, 'Name can only contain letters, spaces, and hyphens.')
    .transform(sanitizeText),
  expiryMonth: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Invalid expiry month (01-12).'),
  expiryYear: z.string()
    .regex(/^\d{2}$/, 'Expiry year must be 2 digits (e.g. 26).')
    .refine((yy) => {
      const year = 2000 + parseInt(yy, 10);
      const currentYear = new Date().getFullYear();
      return year >= currentYear && year <= currentYear + 20;
    }, {
      message: 'Card has expired or year is too far in future.'
    }),
  cvv: z.string()
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits.')
}).refine((data) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const expYear = 2000 + parseInt(data.expiryYear, 10);
  const expMonth = parseInt(data.expiryMonth, 10);
  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }
  return true;
}, {
  message: 'Card expiration date cannot be in the past.',
  path: ['expiryMonth']
});

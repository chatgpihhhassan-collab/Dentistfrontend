/**
 * Automated test suite for Dentia Data Accuracy and Validation Layer
 */

import {
  normalizePakistaniPhone,
  formatPakistaniPhone,
  formatCnic,
  validateCnic,
  sanitizeText,
  validateLuhnCardNumber,
  isValidFdiToothNumber
} from './normalizationUtils.js';

import { patientSchema } from './patientSchema.js';
import { appointmentSchema } from './appointmentSchema.js';
import { doctorLoginSchema, doctorRegisterSchema } from './authSchema.js';
import { xrayUploadSchema } from './imagingSchema.js';
import { invoiceSchema, cardCheckoutSchema } from './billingSchema.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('--- 1. Testing Normalization Utilities ---');

// Pakistani Phone Normalization
const p1 = normalizePakistaniPhone('03001234567');
assert(p1.isValid && p1.normalized === '+923001234567', 'Normalizes 03001234567 to +923001234567');

const p2 = normalizePakistaniPhone('+92 321-4455667');
assert(p2.isValid && p2.normalized === '+923214455667', 'Normalizes formatted +92 321-4455667 to +923214455667');

const p3 = normalizePakistaniPhone('12345');
assert(!p3.isValid, 'Rejects short invalid phone number 12345');

// CNIC formatting & validation
assert(formatCnic('3520112345671') === '35201-1234567-1', 'Formats 13 digit CNIC with dashes');
assert(validateCnic('35201-1234567-1').isValid, 'Validates properly formatted CNIC');
assert(!validateCnic('35201-123456-1').isValid, 'Rejects malformed CNIC (12 digits)');

// HTML Sanitization
const xss = sanitizeText('<script>alert("hack")</script><b>Ali</b>   Khan');
assert(xss === 'Ali Khan', 'Strips HTML and collapses whitespace');

// FDI Tooth Notation
assert(isValidFdiToothNumber(11), 'Tooth 11 is valid adult FDI');
assert(isValidFdiToothNumber(48), 'Tooth 48 is valid adult FDI');
assert(isValidFdiToothNumber(85), 'Tooth 85 is valid primary FDI');
assert(!isValidFdiToothNumber(49), 'Tooth 49 is invalid FDI');
assert(!isValidFdiToothNumber(99), 'Tooth 99 is invalid FDI');

// Luhn algorithm
assert(validateLuhnCardNumber('4532015112830366'), 'Validates Visa test card with correct Luhn');
assert(!validateLuhnCardNumber('4532015112830367'), 'Rejects card number with bad checksum');

console.log('\n--- 2. Testing Zod Schemas ---');

// Patient Schema
const patientValid = patientSchema.safeParse({
  firstName: 'Haider',
  lastName: 'Ali',
  dob: '1995-05-15',
  gender: 'male',
  phone: '03001234567',
  allergiesConfirmed: true
});
assert(patientValid.success, 'Patient schema passes valid patient');

const patientInvalidPhone = patientSchema.safeParse({
  firstName: 'Haider',
  lastName: 'Ali',
  dob: '1995-05-15',
  gender: 'male',
  phone: '04231234567', // landline without mobile prefix
  allergiesConfirmed: true
});
assert(!patientInvalidPhone.success, 'Patient schema rejects non-mobile phone');

// Doctor Register Schema (Password Complexity)
const regWeak = doctorRegisterSchema.safeParse({
  fullName: 'Dr. Test',
  email: 'test@clinic.com',
  phone: '03001234567',
  role: 'dentist',
  password: 'simplepassword', // missing uppercase, number, symbol
  confirmPassword: 'simplepassword'
});
assert(!regWeak.success, 'Doctor registration rejects weak password lacking complexity');

const regStrong = doctorRegisterSchema.safeParse({
  fullName: 'Dr. Test',
  email: 'test@clinic.com',
  phone: '03001234567',
  role: 'dentist',
  password: 'DentiaSecure2026!',
  confirmPassword: 'DentiaSecure2026!'
});
assert(regStrong.success, 'Doctor registration accepts strong compliant password');

// Radiograph Schema
const xrayValid = xrayUploadSchema.safeParse({
  patientId: 10,
  toothNumber: 14,
  imageType: 'periapical',
  imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
});
assert(xrayValid.success, 'X-Ray schema accepts valid radiograph payload');

console.log(`\n========================================`);
console.log(`Validation Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);

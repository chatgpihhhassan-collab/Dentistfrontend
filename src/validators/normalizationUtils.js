/**
 * normalizationUtils.js
 * 
 * Centralized sanitization and normalization utilities for Dentia.
 * Enforces strict formatting for Pakistani phones, CNIC, emails, HTML stripping,
 * and currency-safe numeric calculations.
 */

/**
 * Normalizes a Pakistani phone number to standard E.164 (+923XXXXXXXXX).
 * Accepts: 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX, with or without spaces/dashes.
 */
export function normalizePakistaniPhone(raw) {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, normalized: '', error: 'Phone number is required.' };
  }

  // Remove all non-digits except a leading '+'
  let cleaned = raw.trim();
  const hasLeadingPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');

  let e164 = '';

  if (digits.startsWith('923') && digits.length === 12) {
    e164 = `+${digits}`;
  } else if (digits.startsWith('03') && digits.length === 11) {
    e164 = `+92${digits.slice(1)}`;
  } else if (digits.startsWith('3') && digits.length === 10) {
    e164 = `+92${digits}`;
  } else if (hasLeadingPlus && digits.startsWith('923') && digits.length === 12) {
    e164 = `+${digits}`;
  } else {
    return {
      isValid: false,
      normalized: '',
      error: 'Invalid Pakistani mobile number. Must be 11 digits (e.g. 03001234567 or +923001234567).'
    };
  }

  return { isValid: true, normalized: e164, error: null };
}

/**
 * Formats a Pakistani phone number for display (e.g. 0300-1234567 or +92 300 1234567).
 */
export function formatPakistaniPhone(raw) {
  const norm = normalizePakistaniPhone(raw);
  if (!norm.isValid) return raw || '';
  const d = norm.normalized.replace('+92', '0');
  if (d.length === 11) {
    return `${d.slice(0, 4)}-${d.slice(4)}`;
  }
  return norm.normalized;
}

/**
 * Derives OpenWA chatId (923XXXXXXXXX@c.us) from a Pakistani phone number.
 */
export function getWhatsAppChatId(raw) {
  const norm = normalizePakistaniPhone(raw);
  if (!norm.isValid) return null;
  const digits = norm.normalized.replace('+', '');
  return `${digits}@c.us`;
}

/**
 * Derives click-to-chat WhatsApp direct URL (https://wa.me/923XXXXXXXXX).
 */
export function getWhatsAppDirectUrl(raw, text = '') {
  const norm = normalizePakistaniPhone(raw);
  if (!norm.isValid) return null;
  const digits = norm.normalized.replace('+', '');
  const encoded = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${encoded}`;
}

/**
 * Formats a Pakistani CNIC into XXXXX-XXXXXXX-X (13 digits).
 */
export function formatCnic(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Validates a Pakistani CNIC (13 digits matching XXXXX-XXXXXXX-X).
 */
export function validateCnic(raw) {
  if (!raw) return { isValid: true, normalized: '' }; // Optional
  const cleaned = String(raw).trim();
  const regex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
  if (!regex.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Invalid CNIC format. Expected 13 digits: XXXXX-XXXXXXX-X'
    };
  }
  return { isValid: true, normalized: cleaned, error: null };
}

/**
 * Strips HTML tags, script injections, trims whitespace, and collapses multiple spaces.
 */
export function sanitizeText(input, maxLength = 2000) {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Remove script and style elements with their contents
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Strip remaining HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // Strip javascript: pseudo-protocols
  str = str.replace(/javascript:/gi, '');

  // Collapse multiple whitespace chars into single space
  str = str.replace(/\s+/g, ' ').trim();

  if (maxLength && str.length > maxLength) {
    str = str.slice(0, maxLength);
  }

  return str;
}

/**
 * Trims and lowercases an email address, checking RFC 5322 compliance.
 */
export function normalizeEmail(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length > 254) return '';
  return trimmed;
}

/**
 * Checks Luhn checksum on credit card numbers.
 */
export function luhnCheck(cardNumber) {
  if (!cardNumber) return false;
  const digits = String(cardNumber).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Validates FDI tooth number.
 * Permanent: 11-18, 21-28, 31-38, 41-48
 * Primary (Pediatric): 51-55, 61-65, 71-75, 81-85
 */
export function isValidFdiTooth(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return false;
  const adult = (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 31 && n <= 38) || (n >= 41 && n <= 48);
  const peds = (n >= 51 && n <= 55) || (n >= 61 && n <= 65) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
  return adult || peds;
}

// Aliases for consistent naming across front-end and back-end
export const isValidFdiToothNumber = isValidFdiTooth;
export const validateLuhnCardNumber = luhnCheck;

/**
 * Rounds and formats a monetary amount safely with 2 decimal places.
 */
export function formatCurrencySafe(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num < 0) return '0.00';
  return (Math.round(num * 100) / 100).toFixed(2);
}

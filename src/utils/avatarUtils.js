/**
 * Avatar Utilities for Dental Clinic Patient Profiles
 * Supports custom photo data URLs, gender-based fallback vector SVGs, and 5MB validation.
 */

export const MALE_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="mGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="60" fill="url(#mGrad)" />
  <path d="M20 106 C 24 82, 42 74, 60 74 C 78 74, 96 82, 100 106 Z" fill="#EFF6FF" />
  <path d="M52 64 L68 64 L68 76 L52 76 Z" fill="#FDBA74" />
  <ellipse cx="60" cy="48" rx="19" ry="22" fill="#FED7AA" />
  <path d="M39 44 C 39 26, 52 20, 68 21 C 78 22, 82 28, 82 38 C 76 34, 68 33, 58 35 C 48 37, 42 41, 39 44 Z" fill="#1E293B" />
</svg>
`)}`;

export const FEMALE_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="fGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#9D174D" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="60" fill="url(#fGrad)" />
  <path d="M34 42 C 32 64, 34 84, 40 92 L80 92 C 86 84, 88 64, 86 42 Z" fill="#331407" />
  <path d="M20 106 C 24 82, 42 74, 60 74 C 78 74, 96 82, 100 106 Z" fill="#FFF1F2" />
  <path d="M53 64 L67 64 L67 76 L53 76 Z" fill="#FDBA74" />
  <ellipse cx="60" cy="48" rx="18" ry="21" fill="#FED7AA" />
  <path d="M38 46 C 36 28, 50 20, 60 20 C 72 20, 84 28, 82 46 C 77 34, 69 31, 60 31 C 51 31, 43 34, 38 46 Z" fill="#451A03" />
</svg>
`)}`;

export const NEUTRAL_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="nGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#0F766E" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="60" fill="url(#nGrad)" />
  <path d="M20 106 C 24 82, 42 74, 60 74 C 78 74, 96 82, 100 106 Z" fill="#F0FDFA" />
  <circle cx="60" cy="48" r="20" fill="#CCFBF1" />
</svg>
`)}`;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

/**
 * Validates selected file size and type
 */
export function validateImageFile(file, maxBytes = MAX_IMAGE_SIZE_BYTES) {
    if (!file) {
        return { valid: false, error: 'No file selected.' };
    }

    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Please upload a valid image file (PNG, JPG, JPEG, WebP, SVG).' };
    }

    if (file.size > maxBytes) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return { 
            valid: false, 
            error: `Image size (${sizeMb} MB) exceeds the maximum allowed limit of 5 MB.` 
        };
    }

    return { valid: true };
}

/**
 * Reads File into Base64 Data URL
 */
export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

/**
 * Resolves patient avatar URL based on custom photo or gender
 */
export function getPatientAvatarUrl(patient, genderOverride = null) {
    if (!patient && !genderOverride) return NEUTRAL_AVATAR_SVG;

    // 1. Direct Data URL or Profile Image property
    if (patient?.profileImageDataUrl) {
        return patient.profileImageDataUrl;
    }

    if (patient?.profileImage) {
        if (typeof patient.profileImage === 'string') {
            if (patient.profileImage.startsWith('data:')) return patient.profileImage;
            const mime = patient.profileImageMimeType || 'image/jpeg';
            return `data:${mime};base64,${patient.profileImage}`;
        }
    }

    // 2. Gender-based fallback
    const g = (genderOverride || patient?.gender || '').toLowerCase().trim();
    if (g === 'male' || g === 'm' || g === 'man' || g === 'boy') {
        return MALE_AVATAR_SVG;
    }
    if (g === 'female' || g === 'f' || g === 'woman' || g === 'girl') {
        return FEMALE_AVATAR_SVG;
    }

    return NEUTRAL_AVATAR_SVG;
}

/**
 * 🛡️ Dentia Clinical Storage Service (SEC-VULN-05)
 * Prevents persistent unencrypted caching of Protected Health Information (PHI)
 * and Personally Identifiable Information (PII) in browser localStorage.
 *
 * Scopes clinical dossiers, radiographs, and patient rosters to ephemeral sessionStorage
 * (automatically wiped on tab/window close) with an in-memory fallback.
 * Provides a single atomic purgeAllClinicalData() routine called on logout.
 */

const memoryFallback = new Map();

const KNOWN_CLINICAL_PREFIXES = [
  'clinic_patients_cache',
  'dentia_synced_patients',
  'dentia_radiograph_',
  'dentia_latest_radiograph',
  'dentia_diagnostic_assessment_',
  'dentia_biopsy_records_',
  'dentia_implant_plans_',
  'dentia_aligner_plans_',
  'dentist_perio_depths_',
  'dentist_surface_zones_',
  'dentia_clinical_notes'
];

function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = '__dentia_sec_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasSessionStorage = typeof window !== 'undefined' && isStorageAvailable('sessionStorage');
const hasLocalStorage = typeof window !== 'undefined' && isStorageAvailable('localStorage');

export const clinicalStorage = {
  /**
   * Set sensitive clinical data in ephemeral session storage
   */
  setItem(key, value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    memoryFallback.set(key, str);

    if (hasSessionStorage) {
      try {
        sessionStorage.setItem(key, str);
      } catch (err) {
        console.warn(`[clinicalStorage] sessionStorage quota or write error for ${key}:`, err);
      }
    }

    // Explicitly purge from persistent localStorage if previously saved there
    if (hasLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }
  },

  /**
   * Get sensitive clinical data from session storage or memory fallback
   */
  getItem(key) {
    if (hasSessionStorage) {
      try {
        const val = sessionStorage.getItem(key);
        if (val !== null) return val;
      } catch (_) {}
    }

    if (memoryFallback.has(key)) {
      return memoryFallback.get(key);
    }

    // Transient legacy migration: check localStorage once, migrate to sessionStorage, then delete from localStorage
    if (hasLocalStorage) {
      try {
        const legacy = localStorage.getItem(key);
        if (legacy !== null) {
          clinicalStorage.setItem(key, legacy);
          localStorage.removeItem(key);
          return legacy;
        }
      } catch (_) {}
    }

    return null;
  },

  /**
   * Remove item from all storage layers
   */
  removeItem(key) {
    memoryFallback.delete(key);
    if (hasSessionStorage) {
      try {
        sessionStorage.removeItem(key);
      } catch (_) {}
    }
    if (hasLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }
  },

  /**
   * Complete purge of all cached PHI / clinical records on user logout
   */
  purgeAllClinicalData() {
    memoryFallback.clear();

    if (hasSessionStorage) {
      try {
        sessionStorage.clear();
      } catch (_) {}
    }

    if (hasLocalStorage) {
      try {
        // Remove all known clinical keys from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && KNOWN_CLINICAL_PREFIXES.some(prefix => k.startsWith(prefix))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    }
  }
};

export default clinicalStorage;

/**
 * Custom Clinic Procedures Service
 * Manages custom treatments defined by clinicians in the Fee Schedule / Clinic Customization studio.
 * Provides real-time synchronization between Doctor Treatment Pricing, ChartPage, and ToothDetailPage.
 */

import API_BASE_URL from '../config/apiConfig';

const CUSTOM_PROCEDURES_STORAGE_KEY = 'dentia_custom_procedures';
const CUSTOM_PROCEDURES_EVENT = 'dentia_custom_procedures_changed';

// Initial default custom clinic procedures for instant out-of-the-box utility
export const DEFAULT_CUSTOM_PROCEDURES = [
  {
    procedureCode: 'CUST-SPLINT',
    procedureName: 'Custom Premium Ceramic Splint / Bleach Tray Combo',
    category: 'Fillings & Restorative Treatment',
    standardFee: 8500,
    estimatedDuration: '45 mins',
    description: 'Custom vacuum-formed thermoformed occlusal splint with high-strength dual-laminate buffer.',
    currency: 'PKR',
    color: '#8B5CF6',
    borderColor: '#7C3AED',
    badge: 'Custom Splint'
  },
  {
    procedureCode: 'CUST-LASER',
    procedureName: 'Aesthetic Laser Gingival Contouring & Smile Recontour',
    category: 'Gum / Periodontal Treatment',
    standardFee: 12000,
    estimatedDuration: '30 mins',
    description: 'Diode soft tissue laser gingivectomy to correct gummy smile aesthetics before anterior restorations.',
    currency: 'PKR',
    color: '#EC4899',
    borderColor: '#DB2777',
    badge: 'Laser Contour'
  },
  {
    procedureCode: 'CUST-VENEER-MOCK',
    procedureName: 'Direct Composite Layering Aesthetic Mock-Up',
    category: 'Cosmetic Dentistry',
    standardFee: 6500,
    estimatedDuration: '40 mins',
    description: 'Diagnostic chairside composite smile preview layering prior to ceramic veneer preparation.',
    currency: 'PKR',
    color: '#3B82F6',
    borderColor: '#2563EB',
    badge: 'Aesthetic Mock'
  }
];

/**
 * Get all active custom clinic procedures
 */
export function getCustomProcedures() {
  try {
    const raw = localStorage.getItem(CUSTOM_PROCEDURES_STORAGE_KEY);
    if (!raw) {
      // Seed with initial defaults so the doctor sees working custom procedures immediately
      localStorage.setItem(CUSTOM_PROCEDURES_STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOM_PROCEDURES));
      return DEFAULT_CUSTOM_PROCEDURES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CUSTOM_PROCEDURES;
  } catch (err) {
    console.warn('Error reading custom procedures from localStorage:', err);
    return DEFAULT_CUSTOM_PROCEDURES;
  }
}

/**
 * Save a newly created or updated custom procedure
 */
export function saveCustomProcedure(procedureData) {
  try {
    const existing = getCustomProcedures();
    const code = procedureData.procedureCode?.trim() || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const formatted = {
      ...procedureData,
      procedureCode: code,
      procedureName: procedureData.procedureName?.trim() || 'Custom Clinic Procedure',
      category: procedureData.category || 'Fillings & Restorative Treatment',
      standardFee: parseFloat(procedureData.standardFee) || 0,
      estimatedDuration: procedureData.estimatedDuration || '45 mins',
      description: procedureData.description || '',
      currency: procedureData.currency || 'PKR',
      color: procedureData.color || '#8B5CF6',
      borderColor: procedureData.borderColor || '#6D28D9',
      badge: 'Custom'
    };

    const idx = existing.findIndex(p => p.procedureCode === code);
    let updated;
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = { ...updated[idx], ...formatted };
    } else {
      updated = [formatted, ...existing];
    }

    localStorage.setItem(CUSTOM_PROCEDURES_STORAGE_KEY, JSON.stringify(updated));

    // Broadcast change event for reactive updates in ChartPage and ToothDetailPage
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CUSTOM_PROCEDURES_EVENT, { detail: updated }));
    }

    return formatted;
  } catch (err) {
    console.error('Error saving custom procedure:', err);
    return null;
  }
}

/**
 * Delete a custom procedure by code
 */
export function deleteCustomProcedure(code) {
  try {
    const existing = getCustomProcedures();
    const updated = existing.filter(p => p.procedureCode !== code);
    localStorage.setItem(CUSTOM_PROCEDURES_STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CUSTOM_PROCEDURES_EVENT, { detail: updated }));
    }
    return true;
  } catch (err) {
    console.error('Error deleting custom procedure:', err);
    return false;
  }
}

/**
 * Subscribe to custom procedure updates
 */
export function subscribeToCustomProcedures(callback) {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e) => {
    callback(e.detail || getCustomProcedures());
  };

  window.addEventListener(CUSTOM_PROCEDURES_EVENT, handler);
  // Also listen to storage events across different browser tabs
  const storageHandler = (e) => {
    if (e.key === CUSTOM_PROCEDURES_STORAGE_KEY) {
      callback(getCustomProcedures());
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(CUSTOM_PROCEDURES_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Sync custom procedures from remote backend fee schedule
 */
export async function syncCustomProceduresFromBackend(doctorId = 1) {
  try {
    const doctorObj = JSON.parse(localStorage.getItem('doctor') || '{}');
    const headers = {
      ...(doctorObj?.token ? { Authorization: `Bearer ${doctorObj.token}` } : {})
    };

    const res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      const remoteProcedures = data.procedures || [];
      
      // Identify custom procedures (codes starting with CUST- or created outside standard catalog)
      const remoteCustoms = remoteProcedures.filter(p => 
        (p.procedureCode && p.procedureCode.startsWith('CUST-')) || p.isCustom
      );

      if (remoteCustoms.length > 0) {
        const local = getCustomProcedures();
        const localCodes = new Set(local.map(l => l.procedureCode));
        
        let merged = [...local];
        remoteCustoms.forEach(rc => {
          if (!localCodes.has(rc.procedureCode)) {
            merged.push({
              procedureCode: rc.procedureCode,
              procedureName: rc.procedureName,
              category: rc.category || 'Fillings & Restorative Treatment',
              standardFee: rc.standardFee || 0,
              estimatedDuration: rc.estimatedDuration || '45 mins',
              description: rc.description || '',
              currency: data.currency || 'PKR',
              color: '#8B5CF6',
              borderColor: '#6D28D9',
              badge: 'Custom'
            });
          }
        });

        localStorage.setItem(CUSTOM_PROCEDURES_STORAGE_KEY, JSON.stringify(merged));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(CUSTOM_PROCEDURES_EVENT, { detail: merged }));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Backend custom procedures sync skipped:', err);
  }
  return getCustomProcedures();
}

/**
 * Format a custom clinic procedure into a CLINICAL_CONDITIONS object
 */
export function formatCustomProcedureAsCondition(proc) {
  return {
    category: 'Custom Clinic Procedures',
    parentCategory: proc.category || 'Fillings & Restorative Treatment',
    color: proc.color || '#8B5CF6',
    borderColor: proc.borderColor || '#6D28D9',
    textColor: '#FFFFFF',
    description: `${proc.procedureCode || 'CUST'} · ${proc.estimatedDuration || '45 mins'} · ${proc.currency || 'PKR'} ${Number(proc.standardFee || 0).toLocaleString()}`,
    badge: 'Custom',
    isCustom: true,
    standardFee: proc.standardFee,
    currency: proc.currency || 'PKR',
    procedureCode: proc.procedureCode,
    rawProcedure: proc
  };
}

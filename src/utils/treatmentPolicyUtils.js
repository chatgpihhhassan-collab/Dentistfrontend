// =========================================================================
// DENTIA TREATMENT POLICY UTILITIES & PERMISSION CLIENT
// Single Source of Truth for frontend permission checks (Rules 1 - 5)
// =========================================================================

import { API_BASE_URL } from '../config/apiConfig';
import { apiFetch } from './apiClient';

const POLICY_CACHE = new Map();

/**
 * Fetch patient treatment policy snapshot from backend
 * @param {number|string} patientId 
 * @param {boolean} forceRefresh 
 * @returns {Promise<PatientPolicy>}
 */
export async function fetchPatientTreatmentPolicy(patientId, forceRefresh = false) {
    const pid = parseInt(patientId, 10);
    if (!pid) return getDefaultPolicy(pid);

    if (!forceRefresh && POLICY_CACHE.has(pid)) {
        return POLICY_CACHE.get(pid);
    }

    try {
        const res = await apiFetch(`/api/patients/${pid}/treatment-policy`);
        if (res.ok) {
            const data = await res.json();
            POLICY_CACHE.set(pid, data);
            return data;
        }
    } catch (err) {
        console.warn(`[TreatmentPolicy] Could not fetch policy for patient #${pid}:`, err);
    }

    return getDefaultPolicy(pid);
}

/**
 * Clear cached policy for patient
 */
export function invalidateTreatmentPolicy(patientId) {
    const pid = parseInt(patientId, 10);
    if (pid) {
        POLICY_CACHE.delete(pid);
    }
}

/**
 * Default fallback policy when offline or loading
 */
export function getDefaultPolicy(patientId) {
    return {
        patientId: patientId || 0,
        hasActiveTreatment: false,
        activeTreatmentItemId: null,
        activeToothNumber: null,
        activeToothKey: null,
        activeTreatmentName: null,
        activeDoctorId: null,
        activeDoctorName: null,
        activeNetPaid: 0,
        canChangeDoctor: true,
        doctorLockReason: null,
        doctorLockReasonUrdu: null,
        canStartNewTreatment: true,
        startLockReason: null,
        startLockReasonUrdu: null,
        lockedToothNumbers: [],
        lockedToothKeys: [],
        totalOutstandingBalance: 0
    };
}

/**
 * Standard bilingual policy alert contents
 */
export function getPolicyBlockedContent(errorCode, { tooth = '', treatment = '' } = {}) {
    const toothLabel = tooth || 'Active';
    const treatLabel = treatment || 'Procedure';

    switch (errorCode) {
        case 'DOCTOR_LOCKED':
            return {
                title: 'Doctor Locked',
                titleUrdu: 'معالج کی تبدیلی مقفل ہے',
                message: `Treatment is already in progress on Tooth #${toothLabel} (${treatLabel}). The doctor cannot be changed until this treatment is completed.`,
                messageUrdu: `دانت نمبر ${toothLabel} پر (${treatLabel}) کا علاج جاری ہے۔ جب تک یہ علاج مکمل نہیں ہو جاتا، ڈاکٹر تبدیل نہیں کیا جا سکتا۔`
            };

        case 'ACTIVE_TREATMENT_EXISTS':
            return {
                title: 'Active Treatment In Progress',
                titleUrdu: 'فعال علاج جاری ہے',
                message: `Treatment on Tooth #${toothLabel} (${treatLabel}) is still in progress. Please complete it before starting a new treatment.`,
                messageUrdu: `دانت نمبر ${toothLabel} پر (${treatLabel}) کا علاج ابھی جاری ہے۔ نیا علاج شروع کرنے سے پہلے براہ کرم اسے مکمل کریں۔`
            };

        case 'CHART_LOCKED':
            return {
                title: 'Dental Chart Locked',
                titleUrdu: 'دانت کا چارٹ مقفل ہے',
                message: `Treatment has started and payment has been received for Tooth #${toothLabel}. The chart cannot be updated until this treatment is completed.`,
                messageUrdu: `دانت نمبر ${toothLabel} کا علاج شروع ہو چکا ہے اور ادائیگی موصول ہو چکی ہے۔ جب تک یہ علاج مکمل نہیں ہو جاتا، چارٹ تبدیل نہیں کیا جا سکتا۔`
            };

        default:
            return {
                title: 'Action Restricted',
                titleUrdu: 'کارروائی ممنوع ہے',
                message: `This action is restricted by clinical treatment workflow policy.`,
                messageUrdu: `یہ عمل کلینیکل ٹریٹمنٹ پالیسی کی رو سے مقفل ہے۔`
            };
    }
}

/**
 * Checks whether a specific tooth chart is locked for editing
 */
export function isToothChartLocked(policy, toothNumber) {
    if (!policy || !policy.lockedToothNumbers) return false;
    return policy.lockedToothNumbers.map(Number).includes(Number(toothNumber));
}

/**
 * Alias for getPolicyBlockedContent
 */
export function getPolicyAlertMessage(errorCode, details = {}) {
    return getPolicyBlockedContent(errorCode, details);
}


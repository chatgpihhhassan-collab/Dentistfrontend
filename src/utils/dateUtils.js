/**
 * 🇵🇰 dateUtils.js - Centralized Pakistan Standard Time & Date Utilities
 * Enforces strict "DD/MM/YYYY" date formatting across all clinical and administrative screens.
 * Eliminates timezone conversion bugs (e.g. 1-day skip / earlier date of birth).
 */

/**
 * Formats a date strictly to Pakistan Standard Date Format: "DD/MM/YYYY".
 * Handles ISO strings, timestamps, Date objects, and YYYY-MM-DD safely without timezone shifting.
 * 
 * @param {string|Date|number} dateInput
 * @returns {string} Formatted string "DD/MM/YYYY" or empty string
 */
export function formatDatePK(dateInput) {
    if (!dateInput) return '';

    // If string matches YYYY-MM-DD directly, extract parts to avoid any timezone shifting
    if (typeof dateInput === 'string') {
        const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, year, month, day] = match;
            return `${day}/${month}/${year}`;
        }
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Formats a datetime strictly to Pakistan Standard Format: "DD/MM/YYYY, hh:mm A".
 * 
 * @param {string|Date|number} dateInput
 * @returns {string} Formatted string "DD/MM/YYYY, hh:mm A"
 */
export function formatDateTimePK(dateInput) {
    if (!dateInput) return '';

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;
}

/**
 * Extracts "YYYY-MM-DD" safely for HTML <input type="date"> value.
 * CRITICAL: Never uses .toISOString() on local dates, preventing the 1-day previous DOB bug.
 * 
 * @param {string|Date} dobInput
 * @returns {string} "YYYY-MM-DD" or empty string
 */
export function parseDobForInput(dobInput) {
    if (!dobInput) return '';

    if (typeof dobInput === 'string') {
        const match = dobInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
    }

    const d = new Date(dobInput);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Prepares date string for backend submission without UTC day shifting.
 * 
 * @param {string} dobStr "YYYY-MM-DD"
 * @returns {string|null} "YYYY-MM-DDT00:00:00"
 */
export function formatDobForSave(dobStr) {
    if (!dobStr) return null;
    const clean = dobStr.split('T')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        return `${clean}T00:00:00`;
    }
    return dobStr;
}

export default {
    formatDatePK,
    formatDateTimePK,
    parseDobForInput,
    formatDobForSave
};

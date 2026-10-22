/**
 * 🦷 Dentia Platform: Dynamic Role & Granular Permission Engine
 * Supports multi-receptionist dynamic access control for pages, sections, and buttons.
 */

export const DEFAULT_RECEPTIONIST_PERMISSIONS = {
    pages: {
        directory: true,
        newPatient: true,
        appointments: true,
        treatmentPricing: true,
        treatmentCatalog: true,
        whatsappHub: true,
        chart: false,
        aiStudio: false,
        aiNotes: false,
        clinicWebsiteStudio: false
    },
    features: {
        canRegisterPatient: true,
        canEditPatientContact: true,
        canDeletePatient: false,
        canBookAppointments: true,
        canCancelAppointments: true,
        canCreateTreatmentPlan: true,
        canApplyDiscount: false,
        canSendWhatsApp: true,
        canView3DChart: false,
        canEdit3DChart: false,
        canExportPDF: true,
        canViewFinancialRevenue: false
    }
};

export const PERMISSION_DEFINITIONS = [
    {
        category: 'Pages & Clinical Modules',
        items: [
            { key: 'directory', label: 'Patient Directory (/directory)', desc: 'Search & view patient demographic dossiers', default: true },
            { key: 'newPatient', label: 'Patient Registration (/new-patient)', desc: 'Onboard and register new patient files', default: true },
            { key: 'appointments', label: 'Appointments Calendar (/appointments)', desc: 'Full calendar schedule & slot management', default: true },
            { key: 'treatmentPricing', label: 'Treatment Plans & Quotes (/treatment-pricing)', desc: 'Build treatment plans & patient quotations', default: true },
            { key: 'whatsappHub', label: 'WhatsApp Messenger (/admin/whatsapp)', desc: 'Send appointment reminders & direct texts', default: true },
            { key: 'treatmentCatalog', label: 'Procedure Fee Catalog (/treatment)', desc: 'View clinic standard dental procedures & pricing', default: true },
            { key: 'chart', label: '3D Odontogram Charting (/chart)', desc: 'Clinical tooth diagnostic charting & anatomy', default: false, clinical: true },
            { key: 'aiStudio', label: 'AI Radiology Studio (/ai-studio)', desc: 'AI dental X-ray diagnostics & pathology', default: false, clinical: true },
            { key: 'aiNotes', label: 'Clinical SOAP Notes & Rx (/ai-notes)', desc: 'Write medical soap notes & prescription orders', default: false, clinical: true }
        ]
    },
    {
        category: 'Buttons & Action Authority',
        items: [
            { key: 'canBookAppointments', label: 'Book & Reschedule Appointments', desc: 'Permit booking patient chair slots', default: true },
            { key: 'canCancelAppointments', label: 'Cancel Appointments', desc: 'Permit cancellation of booked visits', default: true },
            { key: 'canCreateTreatmentPlan', label: 'Generate Treatment Quotes', desc: 'Assemble procedure cost estimates', default: true },
            { key: 'canApplyDiscount', label: 'Authorize Custom Discounts', desc: 'Allow front-desk to apply percentage/cash discounts', default: false },
            { key: 'canSendWhatsApp', label: 'Direct WhatsApp Messages', desc: 'Send manual chat & updates via WhatsApp Web/OpenWA', default: true },
            { key: 'canExportPDF', label: 'Export PDF Estimates & Receipts', desc: 'Download printable quotes and clinical logs', default: true },
            { key: 'canDeletePatient', label: 'Delete Patient Records', desc: 'Permanently archive or remove patient charts', default: false, danger: true },
            { key: 'canEdit3DChart', label: 'Modify Teeth Conditions in 3D Chart', desc: 'Mark decay, fillings, or crowns on dental teeth', default: false, clinical: true }
        ]
    }
];

export const PERMISSION_PRESETS = {
    STANDARD: {
        label: 'Standard Front-Desk',
        desc: 'Patient intake, appointment booking, quotes, and WhatsApp (clinical modules locked)',
        perms: DEFAULT_RECEPTIONIST_PERMISSIONS
    },
    BILLING_ONLY: {
        label: 'Billing & Quotes Only',
        desc: 'Limited to treatment estimates, pricing, and appointment viewing',
        perms: {
            pages: {
                directory: true,
                newPatient: false,
                appointments: true,
                treatmentPricing: true,
                treatmentCatalog: true,
                whatsappHub: false,
                chart: false,
                aiStudio: false,
                aiNotes: false,
                clinicWebsiteStudio: false
            },
            features: {
                canRegisterPatient: false,
                canEditPatientContact: false,
                canDeletePatient: false,
                canBookAppointments: false,
                canCancelAppointments: false,
                canCreateTreatmentPlan: true,
                canApplyDiscount: true,
                canSendWhatsApp: false,
                canView3DChart: false,
                canEdit3DChart: false,
                canExportPDF: true,
                canViewFinancialRevenue: false
            }
        }
    },
    SENIOR_RECEPTIONIST: {
        label: 'Senior Receptionist (With Charting)',
        desc: 'Full front-desk access plus viewing 3D odontogram and applying discounts',
        perms: {
            pages: {
                directory: true,
                newPatient: true,
                appointments: true,
                treatmentPricing: true,
                treatmentCatalog: true,
                whatsappHub: true,
                chart: true,
                aiStudio: false,
                aiNotes: false,
                clinicWebsiteStudio: false
            },
            features: {
                canRegisterPatient: true,
                canEditPatientContact: true,
                canDeletePatient: false,
                canBookAppointments: true,
                canCancelAppointments: true,
                canCreateTreatmentPlan: true,
                canApplyDiscount: true,
                canSendWhatsApp: true,
                canView3DChart: true,
                canEdit3DChart: false,
                canExportPDF: true,
                canViewFinancialRevenue: false
            }
        }
    }
};

/**
 * Checks if a user has permission to access a page or execute an action.
 * @param {Object} user Current logged in doctor/receptionist object from storage
 * @param {string} permissionKey The page name or feature flag to check
 * @returns {boolean} True if authorized
 */
export const hasPermission = (user, permissionKey) => {
    if (!user) return false;

    // SuperAdmin and Doctor always have full authority over clinical operations
    const userRole = (user.role || (user.isSuperAdmin ? 'SuperAdmin' : 'Doctor')).toLowerCase();
    if (userRole === 'doctor' || userRole === 'superadmin') {
        return true;
    }

    if (userRole === 'receptionist') {
        let perms = user.permissions;
        if (!perms && user.permissionsJson) {
            try {
                perms = typeof user.permissionsJson === 'string' 
                    ? JSON.parse(user.permissionsJson) 
                    : user.permissionsJson;
            } catch {
                perms = DEFAULT_RECEPTIONIST_PERMISSIONS;
            }
        }
        if (!perms) perms = DEFAULT_RECEPTIONIST_PERMISSIONS;

        // Check pages
        if (perms.pages && perms.pages[permissionKey] !== undefined) {
            return Boolean(perms.pages[permissionKey]);
        }
        // Check features
        if (perms.features && perms.features[permissionKey] !== undefined) {
            return Boolean(perms.features[permissionKey]);
        }
    }

    return false;
};

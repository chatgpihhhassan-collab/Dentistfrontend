import React, { useState, useEffect, useMemo } from 'react';
import { 
    CreditCard, DollarSign, FileText, CheckCircle2, Clock, AlertCircle, 
    Printer, Download, Plus, Search, Filter, ChevronDown, ChevronUp, 
    ShieldCheck, Calendar, User, Stethoscope, Tag, ArrowUpRight, 
    Layers, RefreshCw, X, Receipt, Check, Banknote, Building, AlertTriangle,
    Edit3, Save, Sparkles, CheckSquare, Square
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export const TOOTH_NAMES = {
    1: 'Maxillary Right 3rd Molar',
    2: 'Maxillary Right 2nd Molar',
    3: 'Maxillary Right 1st Molar',
    4: 'Maxillary Right 2nd Premolar',
    5: 'Maxillary Right 1st Premolar',
    6: 'Maxillary Right Canine',
    7: 'Maxillary Right Lateral Incisor',
    8: 'Maxillary Right Central Incisor',
    9: 'Maxillary Left Central Incisor',
    10: 'Maxillary Left Lateral Incisor',
    11: 'Maxillary Left Canine',
    12: 'Maxillary Left 1st Premolar',
    13: 'Maxillary Left 2nd Premolar',
    14: 'Maxillary Left 1st Molar',
    15: 'Maxillary Left 2nd Molar',
    16: 'Maxillary Left 3rd Molar',
    17: 'Mandibular Left 3rd Molar',
    18: 'Mandibular Left 2nd Molar',
    19: 'Mandibular Left 1st Molar',
    20: 'Mandibular Left 2nd Premolar',
    21: 'Mandibular Left 1st Premolar',
    22: 'Mandibular Left Canine',
    23: 'Mandibular Left Lateral Incisor',
    24: 'Mandibular Left Central Incisor',
    25: 'Mandibular Right Central Incisor',
    26: 'Mandibular Right Lateral Incisor',
    27: 'Mandibular Right Canine',
    28: 'Mandibular Right 1st Premolar',
    29: 'Mandibular Right 2nd Premolar',
    30: 'Mandibular Right 1st Molar',
    31: 'Mandibular Right 2nd Molar',
    32: 'Mandibular Right 3rd Molar',
    'A': 'Maxillary Right 2nd Primary Molar',
    'B': 'Maxillary Right 1st Primary Molar',
    'C': 'Maxillary Right Primary Canine',
    'D': 'Maxillary Right Primary Lateral Incisor',
    'E': 'Maxillary Right Primary Central Incisor',
    'F': 'Maxillary Left Primary Central Incisor',
    'G': 'Maxillary Left Primary Lateral Incisor',
    'H': 'Maxillary Left Primary Canine',
    'I': 'Maxillary Left 1st Primary Molar',
    'J': 'Maxillary Left 2nd Primary Molar',
    'K': 'Mandibular Left 2nd Primary Molar',
    'L': 'Mandibular Left 1st Primary Molar',
    'M': 'Mandibular Left Primary Canine',
    'N': 'Mandibular Left Primary Lateral Incisor',
    'O': 'Mandibular Left Primary Central Incisor',
    'P': 'Mandibular Right Primary Central Incisor',
    'Q': 'Mandibular Right Primary Lateral Incisor',
    'R': 'Mandibular Right Primary Canine',
    'S': 'Mandibular Right 1st Primary Molar',
    'T': 'Mandibular Right 2nd Primary Molar'
};

// Official ADA CDT Procedure Code Reference Catalog with Standard Fees
export const CDT_PROCEDURE_CATALOG = [
    { cdt: 'D6010', name: 'Surgical Implant Placement', category: 'Implantology', feeNZD: 1450, feePKR: 120000, keywords: ['implant placement', 'titanium implant', 'endosseous implant'] },
    { cdt: 'D6058', name: 'Implant Supported Crown (Screw-Retained / Zirconia)', category: 'Implantology', feeNZD: 1250, feePKR: 95000, keywords: ['implant', 'screw-retained', 'zirconia crown', 'fixture crown'] },
    { cdt: 'D3330', name: 'Molar Root Canal Therapy (RCT)', category: 'Endodontics', feeNZD: 680, feePKR: 50000, keywords: ['rct', 'root canal', 'pulpitis', 'irreversible', 'molar endodontic', 'obturation'] },
    { cdt: 'D3320', name: 'Premolar Root Canal Therapy (RCT)', category: 'Endodontics', feeNZD: 550, feePKR: 40000, keywords: ['premolar rct', 'bicuspid rct'] },
    { cdt: 'D3310', name: 'Anterior Root Canal Therapy (RCT)', category: 'Endodontics', feeNZD: 480, feePKR: 35000, keywords: ['anterior rct', 'incisor rct', 'canine rct'] },
    { cdt: 'D3220', name: 'Therapeutic Pulpotomy (MTA / Bioceramic)', category: 'Pediatric Endodontics', feeNZD: 250, feePKR: 20000, keywords: ['pulpotomy', 'mta', 'coronal pulp', 'vital pulp'] },
    { cdt: 'D2930', name: 'Stainless Steel Crown (SSC) — Primary Tooth', category: 'Pediatric Prosthetics', feeNZD: 220, feePKR: 18000, keywords: ['ssc', 'stainless steel crown', 'steel crown', 'preformed crown'] },
    { cdt: 'D1510', name: 'Space Maintainer (Fixed, Unilateral / Band & Loop)', category: 'Pediatric Orthodontics', feeNZD: 260, feePKR: 22000, keywords: ['space maintainer', 'band and loop', 'band & loop', 'appliance'] },
    { cdt: 'D2160', name: 'Amalgam Restoration — 3+ Surfaces (MOD)', category: 'Restorative', feeNZD: 195, feePKR: 15000, keywords: ['amalgam (mod)', 'mod amalgam', 'amalgam restoration', 'silver filling (mod)'] },
    { cdt: 'D2391', name: 'Resin Composite Restoration — 1 Surface Posterior (O)', category: 'Restorative', feeNZD: 145, feePKR: 12000, keywords: ['composite (o)', 'occlusal composite', 'composite restoration', 'composite filling'] },
    { cdt: 'D2392', name: 'Resin Composite Restoration — 2 Surfaces Posterior (MO/DO)', category: 'Restorative', feeNZD: 175, feePKR: 14000, keywords: ['composite (mo)', 'composite (do)', 'mo composite', 'do composite'] },
    { cdt: 'D2393', name: 'Resin Composite Restoration — 3+ Surfaces Posterior (MOD)', category: 'Restorative', feeNZD: 210, feePKR: 17000, keywords: ['composite (mod)', 'mod composite'] },
    { cdt: 'D2140', name: 'Amalgam Restoration — 1 Surface', category: 'Restorative', feeNZD: 135, feePKR: 11000, keywords: ['caries', 'decay', 'cavity', 'ecc', 'early childhood caries'] },
    { cdt: 'D2740', name: 'Crown — Porcelain / Ceramic Substrate', category: 'Prosthodontics', feeNZD: 950, feePKR: 75000, keywords: ['crown', 'porcelain', 'ceramic', 'zirconia full crown'] },
    { cdt: 'D7140', name: 'Extraction — Erupted Tooth / Exposed Root', category: 'Oral Surgery', feeNZD: 150, feePKR: 12000, keywords: ['extraction', 'extracted', 'missing', 'exfoliated', 'absent'] },
    { cdt: 'D1110', name: 'Prophylaxis / Dental Scaling & Calculus Removal', category: 'Preventive', feeNZD: 95, feePKR: 8000, keywords: ['cleaning', 'scaling', 'calculus', 'prophy', 'polish'] },
    { cdt: 'D0120', name: 'Periodic Oral Evaluation', category: 'Diagnostic', feeNZD: 65, feePKR: 5000, keywords: ['exam', 'evaluation', 'checkup', 'consultation'] }
];

export function inferCdtAndFee(conditionStatus, comments, region = 'NZ', billedFee = 0) {
    if (billedFee > 0) {
        return { fee: billedFee, isEstimated: false };
    }
    const text = `${conditionStatus || ''} ${comments || ''}`.toLowerCase();
    const isPkr = region === 'PK';

    // 1. Check for explicit D\d{4} code in comments
    const match = text.match(/\b(d\d{4})\b/i);
    if (match) {
        const explicitCode = match[1].toUpperCase();
        const catalogItem = CDT_PROCEDURE_CATALOG.find(p => p.cdt === explicitCode);
        if (catalogItem) {
            return {
                cdtCode: catalogItem.cdt,
                nomenclature: catalogItem.name,
                fee: isPkr ? catalogItem.feePKR : catalogItem.feeNZD,
                isEstimated: true
            };
        }
        return {
            cdtCode: explicitCode,
            nomenclature: 'Standard Dental Procedure',
            fee: isPkr ? 15000 : 180,
            isEstimated: true
        };
    }

    // 2. Keyword inference from procedure catalog
    for (const item of CDT_PROCEDURE_CATALOG) {
        if (item.keywords.some(kw => text.includes(kw))) {
            return {
                cdtCode: item.cdt,
                nomenclature: item.name,
                fee: isPkr ? item.feePKR : item.feeNZD,
                isEstimated: true
            };
        }
    }

    // 3. Fallback General Assessment
    return {
        cdtCode: 'D0150',
        nomenclature: 'General Dental Assessment',
        fee: isPkr ? 5000 : 85,
        isEstimated: true
    };
}

export default function PatientTreatmentInvoiceTab({ patientId, patient, teethState = [], dentitionMode = 'adult' }) {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('teeth'); // 'teeth' | 'invoices'
    const [toothFilter, setToothFilter] = useState('All'); // 'All' | 'Completed' | 'Planned' | 'In Progress'
    const [toothSearch, setToothSearch] = useState('');
    const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

    // Payment Settlement Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash_Counter');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [recordingPayment, setRecordingPayment] = useState(false);
    const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
    const [paymentError, setPaymentError] = useState('');

    // Edit Tooth Treatment Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState(null);
    const [editForm, setEditForm] = useState({
        status: 'Planned',
        conditionStatus: '',
        cdtCode: '',
        fee: '',
        comments: ''
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editSuccessMsg, setEditSuccessMsg] = useState('');
    const [editErrorMsg, setEditErrorMsg] = useState('');
    const [quickStatusLoading, setQuickStatusLoading] = useState({});

    // Create Invoice from Completed Treatments State
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
    const [selectedTreatmentsForInvoice, setSelectedTreatmentsForInvoice] = useState([]);
    const [invoiceCustomNotes, setInvoiceCustomNotes] = useState('');
    const [creatingInvoice, setCreatingInvoice] = useState(false);
    const [createInvoiceSuccess, setCreateInvoiceSuccess] = useState('');
    const [createInvoiceError, setCreateInvoiceError] = useState('');

    const patientRegion = (patient?.doctorID === 2 || patient?.region === 'PK') ? 'PK' : 'NZ';

    // Fetch the unified patient clinical & financial dossier
    const fetchReport = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            let res = null;
            try {
                res = await fetch(`${API_BASE_URL}/api/billing/patient/${patientId}/treatment-report`);
            } catch {
                res = null;
            }

            if (!res || !res.ok) {
                res = await fetch(`/api/billing/patient/${patientId}/treatment-report`);
            }

            if (res && res.ok) {
                const data = await res.json();
                
                // Enrich teeth treatments with CDT & estimated fee inference if unbilled
                const enrichedTreatments = (data.chartTreatments || []).map(t => {
                    const { cdtCode, nomenclature, fee, isEstimated } = inferCdtAndFee(
                        t.conditionStatus, 
                        t.comments, 
                        data.patient?.currency === 'PKR' ? 'PK' : 'NZ',
                        t.fee
                    );
                    return {
                        ...t,
                        cdtCode: t.cdtCode || cdtCode,
                        cdtNomenclature: nomenclature,
                        fee: (t.fee && t.fee > 0) ? t.fee : fee,
                        isEstimatedFee: !(t.fee && t.fee > 0)
                    };
                });

                data.chartTreatments = enrichedTreatments;

                // Calculate unbilled completed care value
                const unbilledCompleted = enrichedTreatments.filter(t => t.status === 'Completed' && !t.invoiceNumber);
                data.summary = {
                    ...data.summary,
                    unbilledCompletedTotal: unbilledCompleted.reduce((acc, curr) => acc + (curr.fee || 0), 0),
                    unbilledCompletedCount: unbilledCompleted.length
                };

                setReportData(data);
                if (data.invoices && data.invoices.length > 0) {
                    setExpandedInvoiceId(data.invoices[0].invoiceId);
                }
            } else {
                generateFallbackReport();
            }
        } catch (err) {
            console.warn('Could not fetch server treatment report, compiling fallback:', err);
            generateFallbackReport();
        } finally {
            setLoading(false);
        }
    };

    // Client-side fallback compilation
    const generateFallbackReport = () => {
        const currency = patientRegion === 'PK' ? 'PKR' : 'NZD';
        const chartTreatments = (teethState || [])
            .filter(t => {
                const s = (t.conditionStatus || t.status || '').toLowerCase();
                return s && s !== 'healthy' && s !== 'sound';
            })
            .map(t => {
                const s = t.conditionStatus || t.status || 'Treated';
                let status = 'Planned';
                if (s.toLowerCase().includes('treated') || s.toLowerCase().includes('completed') || s.toLowerCase().includes('filled') || s.toLowerCase().includes('crown')) {
                    status = 'Completed';
                }
                const { cdtCode, nomenclature, fee } = inferCdtAndFee(s, t.comments, patientRegion, 0);
                return {
                    toothNumber: t.toothNumber,
                    toothKey: t.toothKey || String(t.toothNumber),
                    conditionStatus: s,
                    conditionColor: t.conditionColor || t.color || '#3B82F6',
                    cdtCode,
                    cdtNomenclature: nomenclature,
                    treatmentName: s,
                    status,
                    fee,
                    isEstimatedFee: true,
                    invoiceNumber: null,
                    date: t.lastUpdated || new Date().toISOString(),
                    comments: t.comments || ''
                };
            });

        const unbilledCompleted = chartTreatments.filter(t => t.status === 'Completed' && !t.invoiceNumber);

        setReportData({
            patient: {
                patientId: patient?.id || patientId,
                referenceNumber: patient?.referenceNumber || `DEN-2026-${patientId}`,
                fullName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient Record',
                phone: patient?.phone || '',
                email: patient?.email || '',
                currentTreatmentPlan: patient?.currentTreatmentPlan || 'General Consultation',
                currency
            },
            summary: {
                totalInvoiced: 0,
                totalPaid: 0,
                balanceDue: 0,
                invoiceCount: 0,
                unpaidCount: 0,
                currency,
                unbilledCompletedTotal: unbilledCompleted.reduce((acc, curr) => acc + curr.fee, 0),
                unbilledCompletedCount: unbilledCompleted.length
            },
            chartTreatments,
            invoices: []
        });
    };

    useEffect(() => {
        fetchReport();
    }, [patientId]);

    // Format Regional Currency
    const formatCurrency = (amount, customCurrency) => {
        const curr = customCurrency || reportData?.summary?.currency || (patientRegion === 'PK' ? 'PKR' : 'NZD');
        const num = Number(amount) || 0;
        if (curr === 'PKR') {
            return `Rs ${num.toLocaleString('en-PK')}`;
        }
        return `$${num.toFixed(2)} ${curr}`;
    };

    // Filtered Tooth Treatments
    const filteredTreatments = useMemo(() => {
        if (!reportData?.chartTreatments) return [];
        let list = reportData.chartTreatments;

        if (toothFilter !== 'All') {
            list = list.filter(t => t.status === toothFilter);
        }

        if (toothSearch.trim()) {
            const q = toothSearch.toLowerCase().trim();
            list = list.filter(t => 
                String(t.toothNumber).includes(q) ||
                (t.toothKey && t.toothKey.toLowerCase().includes(q)) ||
                (t.conditionStatus && t.conditionStatus.toLowerCase().includes(q)) ||
                (t.cdtCode && t.cdtCode.toLowerCase().includes(q)) ||
                (t.comments && t.comments.toLowerCase().includes(q))
            );
        }

        return list;
    }, [reportData, toothFilter, toothSearch]);

    // Quick inline status toggle
    const handleQuickStatusChange = async (treatment, newStatus) => {
        const tNum = treatment.toothNumber;
        setQuickStatusLoading(prev => ({ ...prev, [tNum]: true }));

        try {
            const updatePayload = {
                patientId: Number(patientId),
                updates: [
                    {
                        toothNumber: treatment.toothNumber,
                        toothKey: treatment.toothKey,
                        status: newStatus,
                        conditionStatus: treatment.conditionStatus,
                        color: newStatus === 'Completed' ? '#10B981' : (newStatus === 'Planned' ? '#F59E0B' : '#0EA5E9'),
                        comment: treatment.comments,
                        cdtCode: treatment.cdtCode,
                        doctorId: patient?.doctorID || 2
                    }
                ]
            };

            await fetch(`${API_BASE_URL}/api/Patients/teeth/update-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            }).catch(() => {});

            // Update local state immediately
            setReportData(prev => {
                if (!prev) return prev;
                const updatedList = prev.chartTreatments.map(t => {
                    if (t.toothNumber === treatment.toothNumber && t.toothKey === treatment.toothKey) {
                        return { ...t, status: newStatus };
                    }
                    return t;
                });
                const unbilled = updatedList.filter(t => t.status === 'Completed' && !t.invoiceNumber);
                return {
                    ...prev,
                    chartTreatments: updatedList,
                    summary: {
                        ...prev.summary,
                        unbilledCompletedTotal: unbilled.reduce((acc, curr) => acc + (curr.fee || 0), 0),
                        unbilledCompletedCount: unbilled.length
                    }
                };
            });
        } catch (err) {
            console.error('Quick status change failed:', err);
        } finally {
            setQuickStatusLoading(prev => ({ ...prev, [tNum]: false }));
        }
    };

    // Open Edit Modal for a Treatment
    const handleOpenEditModal = (treatment) => {
        setEditingTreatment(treatment);
        setEditForm({
            status: treatment.status || 'Planned',
            conditionStatus: treatment.conditionStatus || '',
            cdtCode: treatment.cdtCode || '',
            fee: String(treatment.fee || 0),
            comments: treatment.comments || ''
        });
        setEditSuccessMsg('');
        setEditErrorMsg('');
        setShowEditModal(true);
    };

    // Save Treatment Edits
    const handleSaveTreatmentSubmit = async (e) => {
        e.preventDefault();
        if (!editingTreatment) return;
        setSavingEdit(true);
        setEditSuccessMsg('');
        setEditErrorMsg('');

        try {
            const parsedFee = parseFloat(editForm.fee) || 0;
            const updatePayload = {
                patientId: Number(patientId),
                updates: [
                    {
                        toothNumber: editingTreatment.toothNumber,
                        toothKey: editingTreatment.toothKey,
                        status: editForm.status,
                        conditionStatus: editForm.conditionStatus,
                        color: editForm.status === 'Completed' ? '#10B981' : (editForm.status === 'Planned' ? '#F59E0B' : '#0EA5E9'),
                        comment: editForm.comments,
                        cdtCode: editForm.cdtCode,
                        doctorId: patient?.doctorID || 2
                    }
                ]
            };

            await fetch(`${API_BASE_URL}/api/Patients/teeth/update-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            }).catch(() => {});

            // Update in local report data
            setReportData(prev => {
                if (!prev) return prev;
                const updatedList = prev.chartTreatments.map(t => {
                    if (t.toothNumber === editingTreatment.toothNumber && t.toothKey === editingTreatment.toothKey) {
                        return {
                            ...t,
                            status: editForm.status,
                            conditionStatus: editForm.conditionStatus,
                            cdtCode: editForm.cdtCode,
                            fee: parsedFee,
                            comments: editForm.comments,
                            isEstimatedFee: !t.invoiceNumber
                        };
                    }
                    return t;
                });
                const unbilled = updatedList.filter(t => t.status === 'Completed' && !t.invoiceNumber);
                return {
                    ...prev,
                    chartTreatments: updatedList,
                    summary: {
                        ...prev.summary,
                        unbilledCompletedTotal: unbilled.reduce((acc, curr) => acc + (curr.fee || 0), 0),
                        unbilledCompletedCount: unbilled.length
                    }
                };
            });

            setEditSuccessMsg(`Tooth #${editingTreatment.toothNumber} treatment details updated successfully!`);
            setTimeout(() => {
                setShowEditModal(false);
            }, 1000);
        } catch (err) {
            setEditErrorMsg(err.message || 'Failed to update treatment on server.');
        } finally {
            setSavingEdit(false);
        }
    };

    // Open Create Invoice Modal
    const handleOpenCreateInvoice = (singleTreatment = null) => {
        setCreateInvoiceError('');
        setCreateInvoiceSuccess('');
        const unbilledCompleted = (reportData?.chartTreatments || []).filter(t => t.status === 'Completed' && !t.invoiceNumber);
        
        if (singleTreatment) {
            setSelectedTreatmentsForInvoice([singleTreatment]);
        } else {
            setSelectedTreatmentsForInvoice(unbilledCompleted);
        }
        
        setInvoiceCustomNotes(`Clinical treatment invoice issued for chairside procedures.`);
        setShowCreateInvoiceModal(true);
    };

    // Toggle treatment selection for invoice
    const handleToggleTreatmentSelect = (treatment) => {
        setSelectedTreatmentsForInvoice(prev => {
            const exists = prev.some(t => t.toothNumber === treatment.toothNumber && t.toothKey === treatment.toothKey);
            if (exists) {
                return prev.filter(t => !(t.toothNumber === treatment.toothNumber && t.toothKey === treatment.toothKey));
            } else {
                return [...prev, treatment];
            }
        });
    };

    // Submit Create Invoice
    const handleCreateInvoiceSubmit = async (e) => {
        e.preventDefault();
        if (selectedTreatmentsForInvoice.length === 0) {
            setCreateInvoiceError('Please select at least one completed procedure to invoice.');
            return;
        }

        setCreatingInvoice(true);
        setCreateInvoiceError('');
        setCreateInvoiceSuccess('');

        const currency = reportData?.summary?.currency || (patientRegion === 'PK' ? 'PKR' : 'NZD');
        const items = selectedTreatmentsForInvoice.map(t => ({
            toothNumber: t.toothNumber,
            toothKey: t.toothKey,
            procedureCode: t.cdtCode || 'D0150',
            description: `Tooth #${t.toothNumber} (${TOOTH_NAMES[t.toothNumber] || ''}) - ${t.conditionStatus}`,
            unitPrice: t.fee || (currency === 'PKR' ? 12000 : 150)
        }));

        const payload = {
            patientId: Number(patientId),
            doctorId: patient?.doctorID || 2,
            items,
            notes: invoiceCustomNotes,
            currency
        };

        try {
            let res = null;
            try {
                res = await fetch(`${API_BASE_URL}/api/billing/create-invoice`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = null;
            }

            if (!res || !res.ok) {
                res = await fetch(`/api/billing/create-invoice`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            let newInvoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            let createdInvoiceObj = null;

            if (res && res.ok) {
                const data = await res.json();
                createdInvoiceObj = data.invoice;
                newInvoiceNumber = createdInvoiceObj?.invoiceNumber || newInvoiceNumber;
            } else {
                const totalAmt = items.reduce((sum, item) => sum + item.unitPrice, 0);
                createdInvoiceObj = {
                    invoiceId: Date.now(),
                    invoiceNumber: newInvoiceNumber,
                    issueDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
                    doctorName: patient?.doctorName || 'Dr. Attending Surgeon',
                    totalAmount: totalAmt,
                    paidAmount: 0,
                    balanceAmount: totalAmt,
                    status: 'Issued',
                    currency,
                    notes: invoiceCustomNotes,
                    items: items.map(it => ({
                        procedureCode: it.procedureCode,
                        description: it.description,
                        quantity: 1,
                        unitPrice: it.unitPrice,
                        totalPrice: it.unitPrice
                    })),
                    payments: []
                };
            }

            // Link newly issued invoice to the selected tooth treatments
            const selectedKeys = new Set(selectedTreatmentsForInvoice.map(t => `${t.toothNumber}_${t.toothKey}`));
            setReportData(prev => {
                if (!prev) return prev;
                const updatedChart = prev.chartTreatments.map(t => {
                    if (selectedKeys.has(`${t.toothNumber}_${t.toothKey}`)) {
                        return { ...t, invoiceNumber: newInvoiceNumber, isEstimatedFee: false };
                    }
                    return t;
                });
                const updatedInvoices = [createdInvoiceObj, ...(prev.invoices || [])];
                const totalInvoiced = updatedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
                const totalPaid = updatedInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
                const balanceDue = updatedInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);
                const unbilled = updatedChart.filter(t => t.status === 'Completed' && !t.invoiceNumber);

                return {
                    ...prev,
                    chartTreatments: updatedChart,
                    invoices: updatedInvoices,
                    summary: {
                        ...prev.summary,
                        totalInvoiced,
                        totalPaid,
                        balanceDue,
                        invoiceCount: updatedInvoices.length,
                        unpaidCount: updatedInvoices.filter(i => i.balanceAmount > 0).length,
                        unbilledCompletedTotal: unbilled.reduce((acc, curr) => acc + (curr.fee || 0), 0),
                        unbilledCompletedCount: unbilled.length
                    }
                };
            });

            setCreateInvoiceSuccess(`Official invoice ${newInvoiceNumber} generated successfully!`);
            setExpandedInvoiceId(createdInvoiceObj.invoiceId);
            setTimeout(() => {
                setShowCreateInvoiceModal(false);
                setActiveSubTab('invoices');
            }, 1200);
        } catch (err) {
            setCreateInvoiceError(err.message || 'Error communicating with billing server.');
        } finally {
            setCreatingInvoice(false);
        }
    };

    // Open Payment Settlement Modal
    const handleOpenPayment = (invoice = null) => {
        setPaymentError('');
        setPaymentSuccessMsg('');
        const targetInv = invoice || reportData?.invoices?.find(i => i.balanceAmount > 0) || reportData?.invoices?.[0];
        setSelectedInvoiceForPayment(targetInv);
        setPaymentAmount(targetInv ? String(targetInv.balanceAmount > 0 ? targetInv.balanceAmount : targetInv.totalAmount) : '85');
        setPaymentMethod('Cash_Counter');
        setPaymentNotes('Chairside consultation settlement');
        setShowPaymentModal(true);
    };

    // Submit Payment Record
    const handleRecordPaymentSubmit = async (e) => {
        e.preventDefault();
        setPaymentError('');
        setPaymentSuccessMsg('');

        if (!selectedInvoiceForPayment) {
            setPaymentError('Please select a valid patient invoice to settle.');
            return;
        }

        const amt = parseFloat(paymentAmount);
        if (isNaN(amt) || amt <= 0) {
            setPaymentError('Please enter a valid positive payment amount.');
            return;
        }

        setRecordingPayment(true);
        try {
            const payload = {
                amount: amt,
                paymentMethod,
                notes: paymentNotes,
                doctorId: patient?.doctorID || 2
            };

            let res = null;
            try {
                res = await fetch(`${API_BASE_URL}/api/billing/invoices/${selectedInvoiceForPayment.invoiceId}/record-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = null;
            }

            if (!res || !res.ok) {
                res = await fetch(`/api/billing/invoices/${selectedInvoiceForPayment.invoiceId}/record-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res && res.ok) {
                const data = await res.json();
                setPaymentSuccessMsg(`Payment of ${formatCurrency(amt)} recorded successfully! Receipt #${data.receiptNumber}`);
                setTimeout(() => {
                    setShowPaymentModal(false);
                    fetchReport();
                }, 1500);
            } else {
                const errData = await res?.json().catch(() => ({}));
                setPaymentError(errData?.message || 'Failed to record payment on server.');
            }
        } catch (err) {
            setPaymentError(err.message || 'Error communicating with billing service.');
        } finally {
            setRecordingPayment(false);
        }
    };

    // Trigger Print / PDF Statement
    const handlePrintStatement = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-3xl border border-slate-200">
                <RefreshCw className="w-8 h-8 text-[#4A7CD2] animate-spin" />
                <p className="text-xs font-bold text-slate-600">Compiling Patient Treatment & Financial Dossier...</p>
            </div>
        );
    }

    const summary = reportData?.summary || { totalInvoiced: 0, totalPaid: 0, balanceDue: 0, invoiceCount: 0, unbilledCompletedTotal: 0, unbilledCompletedCount: 0 };
    const invoices = reportData?.invoices || [];
    const chartTreatments = reportData?.chartTreatments || [];
    const unbilledCompletedTreatments = chartTreatments.filter(t => t.status === 'Completed' && !t.invoiceNumber);

    return (
        <div className="flex flex-col gap-5 flex-grow animate-fadeIn">
            
            {/* ========================================================================= */}
            {/* 1. FINANCIAL SUMMARY KPI HORIZON BANNER                                    */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 no-print">
                
                {/* Card 1: Total Invoiced */}
                <div className="bg-gradient-to-br from-blue-50/80 to-white p-4 rounded-2xl border border-blue-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-blue-600">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">Total Invoiced</span>
                        <div className="w-7 h-7 rounded-xl bg-blue-100/70 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-[#4A7CD2]" />
                        </div>
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 font-mono">
                        {formatCurrency(summary.totalInvoiced)}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                        {summary.invoiceCount} official clinic invoice{summary.invoiceCount !== 1 ? 's' : ''} issued
                    </p>
                </div>

                {/* Card 2: Total Settled / Paid */}
                <div className="bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-600">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">Total Settled</span>
                        <div className="w-7 h-7 rounded-xl bg-emerald-100/70 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <div className="text-xl font-extrabold text-emerald-700 font-mono">
                        {formatCurrency(summary.totalPaid)}
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span>Paid at front desk & online</span>
                    </p>
                </div>

                {/* Card 3: Outstanding Balance Due */}
                <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
                    summary.balanceDue > 0 
                        ? 'bg-gradient-to-br from-rose-50/80 to-white border-rose-200' 
                        : 'bg-gradient-to-br from-slate-50 to-white border-slate-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">Outstanding Balance</span>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${summary.balanceDue > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                            <CreditCard className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-xl font-extrabold font-mono ${summary.balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatCurrency(summary.balanceDue)}
                    </div>
                    <p className="text-[10px] font-semibold">
                        {summary.balanceDue > 0 ? (
                            <span className="text-rose-600 font-bold">● Balance pending settlement</span>
                        ) : (
                            <span className="text-emerald-600 font-bold">✓ Zero outstanding balance</span>
                        )}
                    </p>
                </div>

                {/* Card 4: Chart Treatments & Unbilled Completed Value */}
                <div className="bg-gradient-to-br from-purple-50/80 to-white p-4 rounded-2xl border border-purple-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between text-purple-600 mb-1">
                            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">Chart Interventions</span>
                            <div className="w-7 h-7 rounded-xl bg-purple-100/70 flex items-center justify-center">
                                <Layers className="w-4 h-4 text-purple-600" />
                            </div>
                        </div>
                        <div className="text-lg font-extrabold text-slate-900">
                            {chartTreatments.length} Procedures Charted
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                            <span className="text-emerald-700 font-bold">{chartTreatments.filter(t => t.status === 'Completed').length} Done</span> • <span className="text-amber-600 font-bold">{chartTreatments.filter(t => t.status === 'Planned').length} Plan</span>
                            {summary.unbilledCompletedTotal > 0 && (
                                <span className="block text-purple-700 font-bold mt-0.5">
                                    Unbilled Done: {formatCurrency(summary.unbilledCompletedTotal)} ({summary.unbilledCompletedCount})
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2">
                        {summary.unbilledCompletedCount > 0 ? (
                            <button
                                type="button"
                                onClick={() => handleOpenCreateInvoice()}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Create official clinic invoice from completed care"
                            >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Bill Completed</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handlePrintStatement}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Print complete patient treatment statement"
                            >
                                <Printer className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                <span>Print PDF</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => handleOpenPayment()}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Payment</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* ========================================================================= */}
            {/* 2. SUB-TAB VIEW SELECTOR & FILTERS                                        */}
            {/* ========================================================================= */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
                
                {/* Tab Pill Buttons */}
                <div className="flex items-center gap-1.5 bg-[#F4F6FA] p-1 rounded-2xl border border-light-teal/30">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('teeth')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeSubTab === 'teeth'
                                ? 'bg-white text-[#4A7CD2] shadow-xs border border-slate-200/80'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Tooth-by-Tooth Treatment Matrix</span>
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-[#4A7CD2] flex items-center justify-center text-[10px] font-mono font-bold">
                            {chartTreatments.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('invoices')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeSubTab === 'invoices'
                                ? 'bg-white text-[#4A7CD2] shadow-xs border border-slate-200/80'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Itemized Invoices & Ledger</span>
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono font-bold">
                            {invoices.length}
                        </span>
                    </button>
                </div>

                {/* Sub-Filters & Batch Bill Action for Tooth Matrix */}
                {activeSubTab === 'teeth' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {unbilledCompletedTreatments.length > 0 && (
                            <button
                                type="button"
                                onClick={() => handleOpenCreateInvoice()}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Issue an official invoice for all completed unbilled procedures"
                            >
                                <Receipt className="w-3.5 h-3.5 text-purple-600" />
                                <span>Bill All Completed ({unbilledCompletedTreatments.length})</span>
                            </button>
                        )}

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={toothSearch}
                                onChange={e => setToothSearch(e.target.value)}
                                placeholder="Search tooth #, code or diagnosis..."
                                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4A7CD2] w-52"
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                            {['All', 'Completed', 'Planned', 'In Progress'].map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setToothFilter(f)}
                                    className={`px-2.5 py-1 rounded-lg transition ${
                                        toothFilter === f 
                                            ? 'bg-white text-slate-900 shadow-2xs' 
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 3. SUB-TAB 1: TOOTH-BY-TOOTH TREATMENT MATRIX                             */}
            {/* ========================================================================= */}
            {activeSubTab === 'teeth' && (
                <div className="space-y-3">
                    {filteredTreatments.length === 0 ? (
                        <div className="py-16 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center mx-auto text-slate-400">
                                <Stethoscope className="w-6 h-6 text-slate-300" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700">No Tooth Interventions Found</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                All 32 anatomical teeth are currently sound or no active treatments match your search filter.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-2xs">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[10.5px] font-extrabold uppercase tracking-wider">
                                        <th className="py-3 px-4">Tooth Identifier</th>
                                        <th className="py-3 px-4">Condition & Pathology</th>
                                        <th className="py-3 px-4">CDT Code</th>
                                        <th className="py-3 px-4">Clinical Status</th>
                                        <th className="py-3 px-4">Billed Invoice</th>
                                        <th className="py-3 px-4 text-right">Fee</th>
                                        <th className="py-3 px-4">Clinical Notes</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTreatments.map((item, idx) => {
                                        const anatomicalName = TOOTH_NAMES?.[item.toothNumber] || `Tooth #${item.toothNumber}`;
                                        const isUnbilled = !item.invoiceNumber;
                                        const isDone = item.status === 'Completed';

                                        return (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                
                                                {/* Tooth Identifier */}
                                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <div 
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-2xs shrink-0"
                                                            style={{ backgroundColor: item.conditionColor || '#4A7CD2' }}
                                                        >
                                                            {item.toothKey || item.toothNumber}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-slate-800">
                                                                {item.toothKey && isNaN(Number(item.toothKey)) ? `Tooth ${item.toothKey} (Primary)` : `Tooth #${item.toothNumber}`}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">{anatomicalName}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Condition & Diagnosis */}
                                                <td className="py-3.5 px-4">
                                                    <span className="font-semibold text-slate-800 block">
                                                        {item.conditionStatus}
                                                    </span>
                                                </td>

                                                {/* CDT Code */}
                                                <td className="py-3.5 px-4">
                                                    {item.cdtCode ? (
                                                        <div className="inline-flex items-center gap-1">
                                                            <span 
                                                                className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200"
                                                                title={item.cdtNomenclature || 'CDT Dental Procedure Code'}
                                                            >
                                                                {item.cdtCode}
                                                            </span>
                                                            {item.isEstimatedFee && (
                                                                <span title="Auto-resolved standard CDT nomenclature">
                                                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px]">General</span>
                                                    )}
                                                </td>

                                                {/* Clinical Status - Interactive Quick Switcher */}
                                                <td className="py-3.5 px-4">
                                                    <div className="relative inline-block">
                                                        <select
                                                            value={item.status}
                                                            disabled={quickStatusLoading[item.toothNumber]}
                                                            onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                                                            className={`appearance-none cursor-pointer pl-6 pr-6 py-1 rounded-full text-[10.5px] font-bold border focus:outline-none transition ${
                                                                item.status === 'Completed'
                                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                                                    : item.status === 'Planned'
                                                                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                                                    : 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
                                                            }`}
                                                        >
                                                            <option value="Completed">✓ Completed</option>
                                                            <option value="In Progress">⟳ In Progress</option>
                                                            <option value="Planned">⏱ Planned</option>
                                                        </select>
                                                        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                                                            {quickStatusLoading[item.toothNumber] ? (
                                                                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
                                                            ) : item.status === 'Completed' ? (
                                                                <Check className="w-3 h-3 text-emerald-600" />
                                                            ) : item.status === 'Planned' ? (
                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                            ) : (
                                                                <RefreshCw className="w-3 h-3 text-sky-600" />
                                                            )}
                                                        </div>
                                                        <ChevronDown className="w-2.5 h-2.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                                                    </div>
                                                </td>

                                                {/* Linked Invoice */}
                                                <td className="py-3.5 px-4 font-mono text-[11px]">
                                                    {item.invoiceNumber ? (
                                                        <span className="font-bold text-[#4A7CD2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                            {item.invoiceNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unbilled / In Plan</span>
                                                    )}
                                                </td>

                                                {/* Fee */}
                                                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                                                    {item.fee > 0 ? (
                                                        <div>
                                                            <span>{formatCurrency(item.fee)}</span>
                                                            {item.isEstimatedFee && (
                                                                <span className="block text-[9px] text-amber-600 font-semibold uppercase">
                                                                    (Est. Plan)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                {/* Clinical Notes */}
                                                <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={item.comments}>
                                                    {item.comments || <span className="text-slate-300 italic">No notes</span>}
                                                </td>

                                                {/* Row Actions: Edit & Bill */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditModal(item)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#4A7CD2] hover:bg-blue-50 transition cursor-pointer border border-transparent hover:border-blue-200"
                                                            title="Edit Clinical Status, CDT Code, Fee, and Notes"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>

                                                        {isDone && isUnbilled && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenCreateInvoice(item)}
                                                                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10.5px] font-bold border border-purple-200 transition cursor-pointer flex items-center gap-1"
                                                                title="Issue invoice for this completed tooth"
                                                            >
                                                                <Receipt className="w-3 h-3" />
                                                                <span>Bill</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* 4. SUB-TAB 2: ITEMIZED INVOICES & FINANCIAL LEDGER                        */}
            {/* ========================================================================= */}
            {activeSubTab === 'invoices' && (
                <div className="space-y-4">
                    {invoices.length === 0 ? (
                        <div className="py-16 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center mx-auto text-slate-400">
                                <Receipt className="w-6 h-6 text-slate-300" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700">No Invoices Issued Yet</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                No official billing records exist for this patient yet. Use "Bill Completed Care" to create an invoice from chairside completed procedures.
                            </p>
                            {unbilledCompletedTreatments.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenCreateInvoice()}
                                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
                                >
                                    <Receipt className="w-4 h-4" />
                                    <span>Bill {unbilledCompletedTreatments.length} Completed Procedures</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        invoices.map((inv) => {
                            const isExpanded = expandedInvoiceId === inv.invoiceId;
                            const isPaid = inv.balanceAmount <= 0 || inv.status === 'Paid';

                            return (
                                <div 
                                    key={inv.invoiceId}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                                >
                                    {/* Invoice Card Header Bar */}
                                    <div 
                                        onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.invoiceId)}
                                        className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                                isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-extrabold text-slate-900 text-sm">{inv.invoiceNumber}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        isPaid 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {isPaid ? 'Paid in Full' : 'Balance Pending'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span>Issued: {new Date(inv.issueDate).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                                                    {inv.doctorName && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-slate-600 font-medium">Attending: {inv.doctorName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-extrabold font-mono text-slate-900">
                                                    {formatCurrency(inv.totalAmount, inv.currency)}
                                                </div>
                                                <div className="text-[10.5px]">
                                                    {isPaid ? (
                                                        <span className="text-emerald-600 font-bold">Settled in Full</span>
                                                    ) : (
                                                        <span className="text-rose-600 font-bold">Due: {formatCurrency(inv.balanceAmount, inv.currency)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {!isPaid && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenPayment(inv);
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    <span>Settle</span>
                                                </button>
                                            )}

                                            <div className="text-slate-400">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Line Items & Payment History */}
                                    {isExpanded && (
                                        <div className="p-5 space-y-4 bg-white">
                                            
                                            {/* Line Items Table */}
                                            <div>
                                                <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <Tag className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                                    Itemized Clinical Procedures ({inv.items?.length || 0})
                                                </h5>
                                                
                                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                                                <th className="py-2.5 px-3">#</th>
                                                                <th className="py-2.5 px-3">Code</th>
                                                                <th className="py-2.5 px-3">Description</th>
                                                                <th className="py-2.5 px-3 text-center">Qty</th>
                                                                <th className="py-2.5 px-3 text-right">Unit Price</th>
                                                                <th className="py-2.5 px-3 text-right">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {(inv.items || []).map((item, iIdx) => (
                                                                <tr key={iIdx} className="hover:bg-slate-50/50">
                                                                    <td className="py-2.5 px-3 font-mono text-slate-400">{iIdx + 1}</td>
                                                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.procedureCode || '011'}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.description}</td>
                                                                    <td className="py-2.5 px-3 text-center font-mono">{item.quantity || 1}</td>
                                                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(item.unitPrice, inv.currency)}</td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.totalPrice || item.unitPrice, inv.currency)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Financial Reconciliation & Payment History */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                                
                                                {/* Left: Payment Receipts */}
                                                <div>
                                                    <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                                                        Payment Receipts & Audit ({inv.payments?.length || 0})
                                                    </h5>

                                                    {(inv.payments || []).length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic">No payments recorded against this invoice yet.</p>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {inv.payments.map((p, pIdx) => (
                                                                <div key={pIdx} className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                                                                    <div>
                                                                        <div className="font-mono font-bold text-emerald-900">{p.receiptNumber}</div>
                                                                        <div className="text-[10px] text-emerald-700">
                                                                            {new Date(p.paymentDate).toLocaleString()} • {p.paymentMethod}
                                                                        </div>
                                                                    </div>
                                                                    <div className="font-mono font-extrabold text-emerald-800">
                                                                        {formatCurrency(p.amount, inv.currency)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Invoice Meta & Actions */}
                                                <div className="space-y-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                                                    <div className="flex justify-between text-slate-500">
                                                        <span>Subtotal:</span>
                                                        <span className="font-mono font-bold text-slate-800">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-500">
                                                        <span>Paid to date:</span>
                                                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(inv.paidAmount, inv.currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-700 font-extrabold border-t border-slate-200 pt-1.5">
                                                        <span>Current Balance Due:</span>
                                                        <span className="font-mono text-rose-600">{formatCurrency(inv.balanceAmount, inv.currency)}</span>
                                                    </div>

                                                    {inv.notes && (
                                                        <div className="pt-2 text-[11px] text-slate-500 italic border-t border-slate-200/60">
                                                            Note: {inv.notes}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* 5. MODAL 1: EDIT TOOTH TREATMENT & BILLING DETAILS                        */}
            {/* ========================================================================= */}
            {showEditModal && editingTreatment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
                        
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-white shadow-sm"
                                    style={{ backgroundColor: editingTreatment.conditionColor || '#4A7CD2' }}
                                >
                                    {editingTreatment.toothKey || editingTreatment.toothNumber}
                                </div>
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                                        <span>Edit Tooth #{editingTreatment.toothNumber}</span>
                                        {editingTreatment.toothKey && isNaN(Number(editingTreatment.toothKey)) && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono font-bold">Primary {editingTreatment.toothKey}</span>
                                        )}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        {TOOTH_NAMES[editingTreatment.toothNumber] || `Tooth #${editingTreatment.toothNumber}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSaveTreatmentSubmit} className="p-6 space-y-4 text-xs">
                            
                            {/* Clinical Status Selector */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Clinical Treatment Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'Completed', label: '✓ Completed', color: 'emerald' },
                                        { id: 'In Progress', label: '⟳ In Progress', color: 'sky' },
                                        { id: 'Planned', label: '⏱ Planned', color: 'amber' }
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setEditForm(prev => ({ ...prev, status: s.id }))}
                                            className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                                                editForm.status === s.id
                                                    ? s.id === 'Completed'
                                                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                                        : s.id === 'Planned'
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                        : 'bg-sky-500 text-white border-sky-600 shadow-xs'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Condition / Procedure Name */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Condition & Pathology Description
                                </label>
                                <input
                                    type="text"
                                    value={editForm.conditionStatus}
                                    onChange={e => setEditForm(prev => ({ ...prev, conditionStatus: e.target.value }))}
                                    placeholder="e.g. Dental Implant (Screw-Retained), Molar RCT"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2]"
                                    required
                                />
                            </div>

                            {/* CDT Code & Fee Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                        ADA CDT Code
                                    </label>
                                    <div className="space-y-1">
                                        <select
                                            value={CDT_PROCEDURE_CATALOG.some(p => p.cdt === editForm.cdtCode) ? editForm.cdtCode : 'custom'}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val !== 'custom') {
                                                    const item = CDT_PROCEDURE_CATALOG.find(p => p.cdt === val);
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        cdtCode: val,
                                                        fee: item ? String(patientRegion === 'PK' ? item.feePKR : item.feeNZD) : prev.fee
                                                    }));
                                                }
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2] bg-white font-mono"
                                        >
                                            <option value="custom">Manual / Custom Code...</option>
                                            {CDT_PROCEDURE_CATALOG.map(p => (
                                                <option key={p.cdt} value={p.cdt}>
                                                    {p.cdt} — {p.name}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            value={editForm.cdtCode}
                                            onChange={e => setEditForm(prev => ({ ...prev, cdtCode: e.target.value.toUpperCase() }))}
                                            placeholder="Code (e.g. D3330, D6058)"
                                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2] font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Procedure Fee ({patientRegion === 'PK' ? 'PKR' : 'NZD'})
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                                            {patientRegion === 'PK' ? 'Rs' : '$'}
                                        </span>
                                        <input
                                            type="number"
                                            step="any"
                                            value={editForm.fee}
                                            onChange={e => setEditForm(prev => ({ ...prev, fee: e.target.value }))}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2] font-mono font-bold"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        Standard reference or agreed patient price
                                    </span>
                                </div>
                            </div>

                            {/* Clinical Comments */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Clinical Operatory Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.comments}
                                    onChange={e => setEditForm(prev => ({ ...prev, comments: e.target.value }))}
                                    placeholder="Doctor notes regarding this tooth intervention..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2]"
                                />
                            </div>

                            {/* Notifications */}
                            {editErrorMsg && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{editErrorMsg}</span>
                                </div>
                            )}

                            {editSuccessMsg && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{editSuccessMsg}</span>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="flex-1 py-2.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Save Treatment Changes</span>
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 6. MODAL 2: CREATE INVOICE FROM COMPLETED TREATMENTS                      */}
            {/* ========================================================================= */}
            {showCreateInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn">
                        
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/60">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Issue Clinic Treatment Invoice</h4>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Select completed clinical procedures to compile into an official bill
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateInvoiceModal(false)}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Invoice Builder Form */}
                        <form onSubmit={handleCreateInvoiceSubmit} className="p-6 space-y-4 text-xs">
                            
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                                        Procedures to Include ({selectedTreatmentsForInvoice.length})
                                    </label>
                                    <span className="text-[10.5px] text-slate-400">
                                        Patient: <strong className="text-slate-700">{reportData?.patient?.fullName}</strong>
                                    </span>
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                                    {unbilledCompletedTreatments.length === 0 && selectedTreatmentsForInvoice.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic text-center py-4">No completed unbilled procedures found.</p>
                                    ) : (
                                        (unbilledCompletedTreatments.length > 0 ? unbilledCompletedTreatments : selectedTreatmentsForInvoice).map((t, idx) => {
                                            const isChecked = selectedTreatmentsForInvoice.some(s => s.toothNumber === t.toothNumber && s.toothKey === t.toothKey);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => handleToggleTreatmentSelect(t)}
                                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                                                        isChecked ? 'bg-white border-purple-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 text-slate-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="text-purple-600">
                                                            {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-slate-800">
                                                                Tooth #{t.toothNumber} {t.toothKey && isNaN(Number(t.toothKey)) ? `(Primary ${t.toothKey})` : ''} — {t.conditionStatus}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-mono">
                                                                CDT: <strong className="text-slate-600">{t.cdtCode || 'D0150'}</strong> • {TOOTH_NAMES[t.toothNumber] || ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="font-mono font-extrabold text-slate-900 text-xs">
                                                        {formatCurrency(t.fee)}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Total Calculation Card */}
                            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900">Total Invoice Amount</span>
                                    <div className="text-[10.5px] text-purple-700">
                                        {selectedTreatmentsForInvoice.length} procedure{selectedTreatmentsForInvoice.length !== 1 ? 's' : ''} included
                                    </div>
                                </div>
                                <div className="text-xl font-extrabold font-mono text-purple-900">
                                    {formatCurrency(selectedTreatmentsForInvoice.reduce((sum, item) => sum + (item.fee || 0), 0))}
                                </div>
                            </div>

                            {/* Invoice Notes */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Invoice Billing Notes / Payment Terms
                                </label>
                                <input
                                    type="text"
                                    value={invoiceCustomNotes}
                                    onChange={e => setInvoiceCustomNotes(e.target.value)}
                                    placeholder="e.g. Completed restoratives & implant crown. Due within 14 days."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            {/* Messages */}
                            {createInvoiceError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{createInvoiceError}</span>
                                </div>
                            )}

                            {createInvoiceSuccess && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{createInvoiceSuccess}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateInvoiceModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingInvoice || selectedTreatmentsForInvoice.length === 0}
                                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {creatingInvoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Receipt className="w-3.5 h-3.5" />}
                                    <span>Issue Official Invoice</span>
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 7. MODAL 3: RECORD PAYMENT SETTLEMENT MODAL                               */}
            {/* ========================================================================= */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-[#4A7CD2] flex items-center justify-center">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Record Patient Settlement</h4>
                                    <p className="text-[11px] text-slate-400 font-medium">Front Desk & Online Payment Reconciliation</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
                            
                            {/* Invoice Target Selection */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Target Patient Invoice
                                </label>
                                <select
                                    value={selectedInvoiceForPayment?.invoiceId || ''}
                                    onChange={(e) => {
                                        const inv = invoices.find(i => String(i.invoiceId) === e.target.value);
                                        setSelectedInvoiceForPayment(inv);
                                        if (inv) {
                                            setPaymentAmount(String(inv.balanceAmount > 0 ? inv.balanceAmount : inv.totalAmount));
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2] bg-white font-mono"
                                >
                                    {invoices.map(inv => (
                                        <option key={inv.invoiceId} value={inv.invoiceId}>
                                            {inv.invoiceNumber} — Total {formatCurrency(inv.totalAmount, inv.currency)} (Due: {formatCurrency(inv.balanceAmount, inv.currency)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Amount Received ({selectedInvoiceForPayment?.currency || reportData?.summary?.currency || 'NZD'})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                                        {selectedInvoiceForPayment?.currency === 'PKR' ? 'Rs' : '$'}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2] font-mono font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Settlement Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'Cash_Counter', label: 'Cash Desk', icon: Banknote },
                                        { id: 'POS_Card', label: 'Card / POS', icon: CreditCard },
                                        { id: 'Bank_Transfer', label: 'Online / Bank', icon: Building }
                                    ].map(m => {
                                        const Icon = m.icon;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(m.id)}
                                                className={`py-2 px-2.5 rounded-xl font-bold border transition flex flex-col items-center gap-1 text-center ${
                                                    paymentMethod === m.id
                                                        ? 'bg-blue-50 border-[#4A7CD2] text-[#4A7CD2] shadow-2xs'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-[10px]">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Settlement Notes / Reference
                                </label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="e.g. Front desk cash receipt, POS auth #1029"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#4A7CD2]"
                                />
                            </div>

                            {/* Messages */}
                            {paymentError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{paymentError}</span>
                                </div>
                            )}

                            {paymentSuccessMsg && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{paymentSuccessMsg}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordingPayment}
                                    className="flex-1 py-2.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    {recordingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    <span>Record Settlement</span>
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 8. PRINT-ONLY CLINICAL STATEMENT LAYOUT                                   */}
            {/* ========================================================================= */}
            <div className="hidden print:block text-slate-900 p-8 space-y-6">
                <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">DENTIA CLINICAL DENTAL MEDICINE</h1>
                        <p className="text-xs text-slate-500">Official Patient Clinical Treatment & Tax Invoice Statement</p>
                    </div>
                    <div className="text-right text-xs font-mono">
                        <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
                        <p>Ref: {reportData?.patient?.referenceNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <p className="font-bold">Patient Name: {reportData?.patient?.fullName}</p>
                        <p>Phone: {reportData?.patient?.phone || 'N/A'}</p>
                        <p>Email: {reportData?.patient?.email || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">Total Invoiced: {formatCurrency(summary.totalInvoiced)}</p>
                        <p className="text-emerald-700 font-bold">Total Settled: {formatCurrency(summary.totalPaid)}</p>
                        <p className="text-rose-700 font-bold">Net Balance Due: {formatCurrency(summary.balanceDue)}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-2">32-Tooth Chart Treatments</h3>
                    <table className="w-full text-xs border border-slate-300">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-2 border border-slate-300">Tooth #</th>
                                <th className="p-2 border border-slate-300">Diagnosis</th>
                                <th className="p-2 border border-slate-300">Status</th>
                                <th className="p-2 border border-slate-300">CDT</th>
                                <th className="p-2 border border-slate-300 text-right">Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartTreatments.map((t, idx) => (
                                <tr key={idx}>
                                    <td className="p-2 border border-slate-300 font-bold">#{t.toothNumber}</td>
                                    <td className="p-2 border border-slate-300">{t.conditionStatus}</td>
                                    <td className="p-2 border border-slate-300">{t.status}</td>
                                    <td className="p-2 border border-slate-300 font-mono">{t.cdtCode || '—'}</td>
                                    <td className="p-2 border border-slate-300 text-right font-mono">{formatCurrency(t.fee)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pt-8 border-t border-slate-300 flex justify-between text-xs">
                    <div>
                        <p>Attending Dental Surgeon Certification</p>
                        <div className="h-10 border-b border-slate-400 w-48 mt-2"></div>
                    </div>
                    <div className="text-right">
                        <p>Patient Signature</p>
                        <div className="h-10 border-b border-slate-400 w-48 mt-2"></div>
                    </div>
                </div>
            </div>

        </div>
    );
}

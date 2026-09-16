import React, { useState, useEffect, useMemo } from 'react';
import { 
    CreditCard, DollarSign, FileText, CheckCircle2, Clock, AlertCircle, 
    Printer, Download, Plus, Search, Filter, ChevronDown, ChevronUp, 
    ShieldCheck, Calendar, User, Stethoscope, Tag, ArrowUpRight, 
    Layers, RefreshCw, X, Receipt, Check, Banknote, Building, AlertTriangle
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

export default function PatientTreatmentInvoiceTab({ patientId, patient, teethState = [], dentitionMode = 'adult' }) {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('teeth'); // 'teeth' | 'invoices'
    const [toothFilter, setToothFilter] = useState('All'); // 'All' | 'Completed' | 'Planned' | 'In Progress'
    const [toothSearch, setToothSearch] = useState('');
    const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

    // Payment Settlement Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash_Counter');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [recordingPayment, setRecordingPayment] = useState(false);
    const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
    const [paymentError, setPaymentError] = useState('');

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
                setReportData(data);
                if (data.invoices && data.invoices.length > 0) {
                    setExpandedInvoiceId(data.invoices[0].invoiceId);
                }
            } else {
                // Fallback compilation from patient + teethState
                generateFallbackReport();
            }
        } catch (err) {
            console.warn('Could not fetch server treatment report, compiling fallback:', err);
            generateFallbackReport();
        } finally {
            setLoading(false);
        }
    };

    // Client-side fallback compilation if offline
    const generateFallbackReport = () => {
        const currency = (patient?.doctorID === 2 || patient?.region === 'PK') ? 'PKR' : 'NZD';
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
                return {
                    toothNumber: t.toothNumber,
                    toothKey: t.toothKey || String(t.toothNumber),
                    conditionStatus: s,
                    conditionColor: t.conditionColor || t.color || '#3B82F6',
                    cdtCode: 'D' + (2000 + (t.toothNumber || 10)),
                    treatmentName: s,
                    status,
                    fee: status === 'Completed' ? 150 : 85,
                    invoiceNumber: null,
                    date: t.lastUpdated || new Date().toISOString(),
                    comments: t.comments || ''
                };
            });

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
                currency
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
        const curr = customCurrency || reportData?.summary?.currency || 'NZD';
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

    const summary = reportData?.summary || { totalInvoiced: 0, totalPaid: 0, balanceDue: 0, invoiceCount: 0 };
    const invoices = reportData?.invoices || [];
    const chartTreatments = reportData?.chartTreatments || [];

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

                {/* Card 4: Active Interventions & Action */}
                <div className="bg-gradient-to-br from-purple-50/80 to-white p-4 rounded-2xl border border-purple-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between text-purple-600 mb-1">
                            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">Chart Treatments</span>
                            <div className="w-7 h-7 rounded-xl bg-purple-100/70 flex items-center justify-center">
                                <Layers className="w-4 h-4 text-purple-600" />
                            </div>
                        </div>
                        <div className="text-lg font-extrabold text-slate-900">
                            {chartTreatments.length} Interventions
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                            {chartTreatments.filter(t => t.status === 'Completed').length} Completed • {chartTreatments.filter(t => t.status === 'Planned').length} Planned
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2">
                        <button
                            type="button"
                            onClick={handlePrintStatement}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Print complete patient treatment statement"
                        >
                            <Printer className="w-3.5 h-3.5 text-[#4A7CD2]" />
                            <span>Print PDF</span>
                        </button>

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

                {/* Sub-Filters for Tooth Matrix */}
                {activeSubTab === 'teeth' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={toothSearch}
                                onChange={e => setToothSearch(e.target.value)}
                                placeholder="Search tooth # or diagnosis..."
                                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4A7CD2] w-48"
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTreatments.map((item, idx) => {
                                        const anatomicalName = TOOTH_NAMES?.[item.toothNumber] || `Tooth #${item.toothNumber}`;
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
                                                            <div className="font-extrabold text-slate-800">Tooth #{item.toothNumber}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">{anatomicalName}</div>
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
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                                                            {item.cdtCode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px]">General</span>
                                                    )}
                                                </td>

                                                {/* Clinical Status */}
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                        item.status === 'Completed'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : item.status === 'Planned'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-sky-50 text-sky-700 border-sky-200'
                                                    }`}>
                                                        {item.status === 'Completed' && <Check className="w-3 h-3" />}
                                                        {item.status === 'Planned' && <Clock className="w-3 h-3" />}
                                                        {item.status === 'In Progress' && <RefreshCw className="w-3 h-3 animate-spin" />}
                                                        <span>{item.status}</span>
                                                    </span>
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
                                                    {item.fee > 0 ? formatCurrency(item.fee) : '—'}
                                                </td>

                                                {/* Clinical Notes */}
                                                <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                                                    {item.comments || <span className="text-slate-300 italic">No notes</span>}
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
                                No official billing records exist for this patient yet. Invoices are created upon booking or chairside checkout.
                            </p>
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
                                        className="p-4 bg-slate-50/60 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-extrabold text-sm text-slate-900 font-mono">{inv.invoiceNumber}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        isPaid
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {inv.status || (isPaid ? 'Paid' : 'Pending Payment')}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                                                    <span>Issued: {new Date(inv.issueDate).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>Doctor: {inv.doctorName || 'Attending Specialist'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 self-end sm:self-center">
                                            <div className="text-right font-mono">
                                                <div className="text-sm font-extrabold text-slate-900">
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

                                                {/* Right: Invoice Balance Box */}
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Subtotal</span>
                                                        <span className="font-mono font-bold">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Amount Paid</span>
                                                        <span className="font-mono font-bold text-emerald-600">-{formatCurrency(inv.paidAmount, inv.currency)}</span>
                                                    </div>
                                                    <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                                                        <span>Net Balance Due</span>
                                                        <span className={`font-mono ${inv.balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {formatCurrency(inv.balanceAmount, inv.currency)}
                                                        </span>
                                                    </div>
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
            {/* 5. RECORD CHAIRSIDE PAYMENT MODAL                                         */}
            {/* ========================================================================= */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-[#4A7CD2] flex items-center justify-center font-bold">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Record Chairside Payment</h3>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                        {selectedInvoiceForPayment?.invoiceNumber || 'Select Invoice'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="w-8 h-8 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4">
                            
                            {/* Invoice Selection if multiple exist */}
                            {invoices.length > 1 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Target Invoice
                                    </label>
                                    <select
                                        value={selectedInvoiceForPayment?.invoiceId || ''}
                                        onChange={e => {
                                            const found = invoices.find(i => String(i.invoiceId) === e.target.value);
                                            setSelectedInvoiceForPayment(found);
                                            if (found) setPaymentAmount(String(found.balanceAmount > 0 ? found.balanceAmount : found.totalAmount));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-[#4A7CD2]"
                                    >
                                        {invoices.map(inv => (
                                            <option key={inv.invoiceId} value={inv.invoiceId}>
                                                {inv.invoiceNumber} — Due: {formatCurrency(inv.balanceAmount, inv.currency)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Payment Amount */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Payment Amount ({reportData?.summary?.currency || 'NZD'})
                                </label>
                                <div className="relative">
                                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:border-[#4A7CD2]"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                                    {[
                                        { id: 'Cash_Counter', label: 'Cash Desk', icon: Banknote },
                                        { id: 'POS_Card', label: 'POS Terminal', icon: CreditCard },
                                        { id: 'Bank_Transfer', label: 'Transfer', icon: Building }
                                    ].map(m => {
                                        const Icon = m.icon;
                                        const isSel = paymentMethod === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(m.id)}
                                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                                                    isSel
                                                        ? 'bg-blue-50 text-[#4A7CD2] border-[#4A7CD2] shadow-2xs font-extrabold'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-[10.5px]">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Payment Notes / Reference
                                </label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    placeholder="e.g., Paid cash at front desk"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#4A7CD2]"
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
            {/* 6. PRINT-ONLY CLINICAL STATEMENT LAYOUT                                   */}
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

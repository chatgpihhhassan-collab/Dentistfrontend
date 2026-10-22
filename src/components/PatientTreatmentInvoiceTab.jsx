import React, { useState, useEffect, useMemo } from 'react';
import { 
    CreditCard, DollarSign, FileText, CheckCircle2, Clock, AlertCircle, 
    Printer, Download, Plus, Search, Filter, ChevronDown, ChevronUp, 
    ShieldCheck, Calendar, User, Stethoscope, Tag, ArrowUpRight, 
    Layers, RefreshCw, X, Receipt, Check, Banknote, Building, AlertTriangle,
    Edit3, Save, Sparkles, CheckSquare, Square, Lock, Ban, ArrowDownRight,
    TrendingUp, Wallet
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';
import { generateInvoicePdf } from '../utils/InvoicePdfGenerator';

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

export default function PatientTreatmentInvoiceTab({ 
    patientId, 
    patient, 
    userRole = 'doctor',
    userId = 1,
    onNavigateToPlan,
    onPaymentChange
}) {
    const [loading, setLoading] = useState(true);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [accountSummary, setAccountSummary] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'

    // Payment Settlement Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentAllocations, setPaymentAllocations] = useState({});
    const [recordingPayment, setRecordingPayment] = useState(false);

    // Allocate Existing Credit Modal State
    const [showAllocateCreditModal, setShowAllocateCreditModal] = useState(false);
    const [creditAllocations, setCreditAllocations] = useState({});
    const [allocatingCredit, setAllocatingCredit] = useState(false);

    // Void / Refund Modal State (Admin Only)
    const [voidModalPayment, setVoidModalPayment] = useState(null);
    const [voidReason, setVoidReason] = useState('');
    const [voidingPayment, setVoidingPayment] = useState(false);

    // Edit Price Modal State (Doctor/Admin with reason)
    const [priceEditItem, setPriceEditItem] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const [priceChangeReason, setPriceChangeReason] = useState('');
    const [savingPrice, setSavingPrice] = useState(false);

    const isAdmin = userRole === 'admin';
    const isDoctorOrAdmin = userRole === 'doctor' || userRole === 'admin' || userRole === 'Dentist';

    // Format Currency
    const formatMoney = (amount) => {
        const num = Number(amount) || 0;
        return `Rs ${num.toLocaleString('en-PK')}`;
    };

    const showToast = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
    };

    // Load Financial Invoices & Account Summary (NO TEETHSTATE DERIVATION!)
    const fetchFinancialDossier = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [itemsRes, summaryRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items?view=invoices`),
                fetch(`${API_BASE_URL}/api/patients/${patientId}/account-summary`)
            ]);

            if (itemsRes.ok) {
                const items = await itemsRes.json();
                const normalized = (Array.isArray(items) ? items : []).map(i => {
                    const finalPrice = i.finalPrice || i.estimatedPrice || (Number(i.fee) || 0);
                    const paid = Number(i.paid) || 0;
                    const balance = i.balance !== undefined ? Number(i.balance) : Math.max(0, finalPrice - paid);
                    const paymentStatus = (i.paymentStatus || (paid >= finalPrice && finalPrice > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid')).toLowerCase();

                    return {
                        ...i,
                        id: i.id || i.treatmentItemID || i.treatmentItemId,
                        treatmentItemID: i.treatmentItemID || i.id || i.treatmentItemId,
                        name: i.name || i.procedureName || 'Treatment',
                        procedureName: i.procedureName || i.name || 'Treatment',
                        toothNo: i.toothNo !== undefined ? i.toothNo : (i.toothNumber || 0),
                        toothNumber: i.toothNumber !== undefined ? i.toothNumber : (i.toothNo || 0),
                        finalPrice,
                        estimatedPrice: i.estimatedPrice || finalPrice,
                        paid,
                        balance,
                        paymentStatus,
                    };
                });
                setInvoiceItems(normalized);
            }
            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                setAccountSummary(summary);
            }
        } catch (err) {
            console.error('Failed to load billing dossier:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialDossier();
    }, [patientId]);

    // Open Receive Payment Dialog with suggested allocations
    const handleOpenPaymentDialog = (preselectedItem = null) => {
        setShowPaymentModal(true);
        setPaymentMethod('cash');
        setPaymentNotes('');

        // Find items that have remaining balance
        const openItems = invoiceItems.filter(i => (i.balance || 0) > 0);
        const suggested = {};

        if (preselectedItem && (preselectedItem.balance || 0) > 0) {
            const pId = preselectedItem.id || preselectedItem.treatmentItemID || preselectedItem.treatmentItemId;
            setPaymentAmount(String(preselectedItem.balance));
            suggested[pId] = preselectedItem.balance;
        } else {
            // Suggest first open item's balance
            const totalDue = openItems.reduce((acc, curr) => acc + (curr.balance || 0), 0);
            setPaymentAmount(totalDue > 0 ? String(totalDue) : '');
            let rem = totalDue;
            openItems.forEach(i => {
                if (rem > 0) {
                    const take = Math.min(rem, i.balance);
                    const iId = i.id || i.treatmentItemID || i.treatmentItemId;
                    suggested[iId] = take;
                    rem -= take;
                }
            });
        }
        setPaymentAllocations(suggested);
    };

    // Recalculate auto-allocation when user changes payment amount
    const handlePaymentAmountChange = (val) => {
        setPaymentAmount(val);
        const total = parseInt(val, 10) || 0;
        let rem = total;
        const newAlloc = {};
        const openItems = invoiceItems.filter(i => (i.balance || 0) > 0);

        openItems.forEach(i => {
            const iId = i.id || i.treatmentItemID || i.treatmentItemId;
            if (rem > 0) {
                const take = Math.min(rem, i.balance);
                newAlloc[iId] = take;
                rem -= take;
            } else {
                newAlloc[iId] = 0;
            }
        });
        setPaymentAllocations(newAlloc);
    };

    // Record Flexible Payment
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const amt = parseInt(paymentAmount, 10);
        if (!amt || amt <= 0) {
            showToast('error', 'Please enter a valid positive payment amount.');
            return;
        }

        const allocList = Object.entries(paymentAllocations)
            .map(([itemId, a]) => ({ treatmentItemId: parseInt(itemId, 10), amount: parseInt(a, 10) || 0 }))
            .filter(a => a.amount > 0);

        setRecordingPayment(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    amount: amt,
                    method: paymentMethod,
                    receivedBy: userId || 1,
                    note: paymentNotes,
                    allocations: allocList
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message || `Payment recorded! Receipt: ${data.receiptNumber}`);
                setShowPaymentModal(false);
                await fetchFinancialDossier();
                if (onPaymentChange) onPaymentChange();
            } else {
                const err = await res.json().catch(() => ({}));
                const errMsg = err.message || (err.errors ? Object.values(err.errors).flat().join(', ') : '') || err.title || 'Failed to record payment.';
                showToast('error', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network error recording payment.');
        } finally {
            setRecordingPayment(false);
        }
    };

    // Open Allocate Advance Credit Dialog
    const handleOpenAllocateCreditDialog = () => {
        setShowAllocateCreditModal(true);
        const openItems = invoiceItems.filter(i => (i.balance || 0) > 0);
        let rem = accountSummary?.unallocatedCredit || 0;
        const alloc = {};
        openItems.forEach(i => {
            if (rem > 0) {
                const take = Math.min(rem, i.balance);
                alloc[i.id] = take;
                rem -= take;
            }
        });
        setCreditAllocations(alloc);
    };

    // Submit Allocate Credit
    const handleAllocateCredit = async (e) => {
        e.preventDefault();
        const allocList = Object.entries(creditAllocations)
            .map(([itemId, a]) => ({ treatmentItemId: parseInt(itemId, 10), amount: parseInt(a, 10) || 0 }))
            .filter(a => a.amount > 0);

        if (allocList.length === 0) {
            showToast('error', 'Please allocate credit to at least one procedure.');
            return;
        }

        setAllocatingCredit(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/payments/allocations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    userId,
                    allocations: allocList
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message || 'Advance credit allocated successfully!');
                setShowAllocateCreditModal(false);
                await fetchFinancialDossier();
                if (onPaymentChange) onPaymentChange();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('error', err.message || 'Failed to allocate credit.');
            }
        } catch (err) {
            showToast('error', 'Network error allocating credit.');
        } finally {
            setAllocatingCredit(false);
        }
    };

    // Void Payment Submit (Admin Only)
    const handleVoidPayment = async () => {
        if (!voidModalPayment || !voidReason.trim()) {
            showToast('error', 'Mandatory void reason is required.');
            return;
        }

        setVoidingPayment(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/payments/void`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: voidModalPayment.paymentId,
                    voidedBy: userId,
                    userRole: userRole,
                    reason: voidReason.trim()
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message || 'Payment has been voided and allocations reversed.');
                setVoidModalPayment(null);
                setVoidReason('');
                await fetchFinancialDossier();
                if (onPaymentChange) onPaymentChange();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('error', err.message || 'Failed to void payment.');
            }
        } catch (err) {
            showToast('error', 'Network error voiding payment.');
        } finally {
            setVoidingPayment(false);
        }
    };

    // Price Update Submit (Doctor/Admin with reason)
    const handleSavePriceEdit = async (e) => {
        e.preventDefault();
        const p = parseInt(newPrice, 10);
        if (isNaN(p) || p < 0 || !priceChangeReason.trim()) {
            showToast('error', 'Please enter a valid price and non-empty reason.');
            return;
        }

        const targetId = priceEditItem?.id || priceEditItem?.treatmentItemID || priceEditItem?.treatmentItemId;
        if (!targetId) {
            showToast('error', 'Invalid treatment item reference.');
            return;
        }

        setSavingPrice(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${targetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || 1,
                    userRole: userRole || 'Doctor',
                    finalPrice: p,
                    priceNote: priceChangeReason.trim()
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message || 'Price updated successfully.');
                setPriceEditItem(null);
                setNewPrice('');
                setPriceChangeReason('');
                await fetchFinancialDossier();
                if (onPaymentChange) onPaymentChange();
            } else {
                const err = await res.json().catch(() => ({}));
                const errMsg = err.message || (err.errors ? Object.values(err.errors).flat().join(', ') : '') || err.title || 'Failed to update price.';
                showToast('error', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network error updating price.');
        } finally {
            setSavingPrice(false);
        }
    };

    // Dynamic counts for financial tabs
    const counts = useMemo(() => {
        let unpaid = 0;
        let partial = 0;
        let paid = 0;
        invoiceItems.forEach(i => {
            const s = (i.paymentStatus || (i.paid >= i.finalPrice && i.finalPrice > 0 ? 'paid' : i.paid > 0 ? 'partial' : 'unpaid')).toLowerCase();
            if (s === 'paid') paid++;
            else if (s === 'partial') partial++;
            else unpaid++;
        });
        return {
            ALL: invoiceItems.length,
            UNPAID: unpaid,
            PARTIAL: partial,
            PAID: paid,
        };
    }, [invoiceItems]);

    // Filter Items
    const filteredItems = useMemo(() => {
        return invoiceItems.filter(item => {
            const pStatus = (item.paymentStatus || (item.paid >= item.finalPrice && item.finalPrice > 0 ? 'paid' : item.paid > 0 ? 'partial' : 'unpaid')).toLowerCase();

            if (statusFilter === 'UNPAID' && pStatus !== 'unpaid') return false;
            if (statusFilter === 'PARTIAL' && pStatus !== 'partial') return false;
            if (statusFilter === 'PAID' && pStatus !== 'paid') return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const name = (item.name || item.procedureName || '').toLowerCase();
                const tooth = String(item.toothNo || item.toothNumber || '');
                const cat = (item.category || '').toLowerCase();
                return name.includes(q) || tooth.includes(q) || cat.includes(q);
            }
            return true;
        });
    }, [invoiceItems, statusFilter, searchQuery]);

    // Print Receipt for an Allocation
    const handlePrintReceipt = (item, alloc) => {
        generateInvoicePdf({
            patient: patient || { firstName: 'Valued', lastName: 'Patient', patientID: patientId },
            doctor: { firstName: 'Dental', lastName: 'Clinic' },
            invoice: {
                invoiceNumber: alloc.receiptNo,
                invoiceDate: alloc.paymentDate || new Date().toISOString(),
                currency: 'PKR',
                subTotal: alloc.amount,
                totalAmount: alloc.amount,
                paidAmount: alloc.amount,
                balanceDue: 0,
                status: 'Paid',
                items: [
                    {
                        cdtCode: item.procedureCode || 'D0150',
                        toothNumber: item.toothNo > 0 ? String(item.toothNo) : 'All',
                        description: item.name,
                        fee: alloc.amount,
                        quantity: 1
                    }
                ]
            },
            payments: [
                {
                    receiptNumber: alloc.receiptNo,
                    amount: alloc.amount,
                    method: alloc.method,
                    date: alloc.paymentDate
                }
            ],
            clinic: {
                name: 'DENTIA DENTAL HEALTHCARE & SURGERY',
                phone: '+92 42 3588 4400',
                email: 'billing@dentia.clinic'
            }
        });
    };

    // Print Account Statement
    const handlePrintStatement = () => {
        const statementItems = invoiceItems.map(i => ({
            cdtCode: i.procedureCode || 'D0150',
            toothNumber: i.toothNo > 0 ? String(i.toothNo) : 'All',
            description: `${i.name} (${i.status === 'completed' ? 'Completed' : 'Prepaid/In Progress'})`,
            fee: i.finalPrice,
            quantity: 1
        }));

        const allPayments = [];
        invoiceItems.forEach(i => {
            (i.allocations || []).forEach(a => {
                allPayments.push({
                    receiptNumber: a.receiptNo,
                    amount: a.amount,
                    method: a.method,
                    date: a.paymentDate
                });
            });
        });

        generateInvoicePdf({
            patient: patient || { firstName: 'Valued', lastName: 'Patient', patientID: patientId },
            doctor: { firstName: 'Dental', lastName: 'Clinic' },
            invoice: {
                invoiceNumber: `STMT-${patientId}-${new Date().getFullYear()}`,
                invoiceDate: new Date().toISOString(),
                currency: 'PKR',
                subTotal: accountSummary?.completedWorkValue || 0,
                totalAmount: (accountSummary?.completedWorkValue || 0),
                paidAmount: accountSummary?.totalPaid || 0,
                balanceDue: accountSummary?.outstandingNow || 0,
                status: (accountSummary?.outstandingNow || 0) === 0 ? 'Settled' : 'Balance Due',
                items: statementItems
            },
            payments: allPayments,
            clinic: {
                name: 'DENTIA DENTAL HEALTHCARE & SURGERY',
                phone: '+92 42 3588 4400',
                email: 'billing@dentia.clinic'
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-16">
            {/* Feedback Alert Toast */}
            {feedback.message && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md animate-fade-in ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                        <p className="text-xs font-bold">{feedback.message}</p>
                    </div>
                    <button onClick={() => setFeedback({ type: '', message: '' })} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Top 5 Financial Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* 1. Completed Work Value */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Completed Value
                    </p>
                    <p className="text-xl font-black text-dark-slate">
                        {formatMoney(accountSummary?.completedWorkValue)}
                    </p>
                    <p className="text-[10px] text-muted-text mt-0.5">Sum of completed items</p>
                </div>

                {/* 2. Total Paid */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Total Paid
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                        {formatMoney(accountSummary?.totalPaid)}
                    </p>
                    <p className="text-[10px] text-muted-text mt-0.5">Active money received</p>
                </div>

                {/* 3. Outstanding Now */}
                <div className={`p-4 rounded-2xl border shadow-2xs ${
                    (accountSummary?.outstandingNow || 0) > 0
                        ? 'bg-rose-50/50 border-rose-200/90'
                        : 'bg-white border-slate-200/80'
                }`}>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1 mb-1">
                        <AlertCircle className={`w-3.5 h-3.5 ${(accountSummary?.outstandingNow || 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                        Outstanding Now
                    </p>
                    <p className={`text-xl font-black ${(accountSummary?.outstandingNow || 0) > 0 ? 'text-rose-600' : 'text-dark-slate'}`}>
                        {formatMoney(accountSummary?.outstandingNow)}
                    </p>
                    <p className="text-[10px] text-muted-text mt-0.5">Due on completed work</p>
                </div>

                {/* 4. Advance Held */}
                <div className={`p-4 rounded-2xl border shadow-2xs ${
                    (accountSummary?.advanceHeld || 0) > 0
                        ? 'bg-emerald-50/40 border-emerald-200/90'
                        : 'bg-white border-slate-200/80'
                }`}>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                        Advance Held
                    </p>
                    <p className={`text-xl font-black ${(accountSummary?.advanceHeld || 0) > 0 ? 'text-emerald-700' : 'text-dark-slate'}`}>
                        {formatMoney(accountSummary?.advanceHeld)}
                    </p>
                    <p className="text-[10px] text-muted-text mt-0.5">
                        Prepaid + Rs {(accountSummary?.unallocatedCredit || 0).toLocaleString()} credit
                    </p>
                </div>

                {/* 5. Planned Value */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 md:col-span-1">
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Planned Care
                    </p>
                    <p className="text-xl font-black text-dark-slate">
                        {formatMoney(accountSummary?.plannedValue)}
                    </p>
                    <p className="text-[10px] text-muted-text mt-0.5">Pending chairside work</p>
                </div>
            </div>

            {/* Advance Credit Notice Banner (When patient has unallocated cash) */}
            {(accountSummary?.unallocatedCredit || 0) > 0 && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black">
                                Advance Credit Balance Available: {formatMoney(accountSummary.unallocatedCredit)}
                            </h4>
                            <p className="text-xs text-white/90">
                                This patient has unallocated advance funds on file that can be applied to completed or open treatments.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenAllocateCreditDialog}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white text-emerald-800 hover:bg-emerald-50 shadow-md transition-all cursor-pointer flex-shrink-0"
                    >
                        Allocate Credit to Procedures
                    </button>
                </div>
            )}

            {/* Table Controls Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                {/* Search & Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative min-w-[220px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search procedure or tooth..."
                            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-[#F4F6FA] p-1 rounded-xl border border-slate-200">
                        {[
                            { id: 'ALL', label: 'ALL', count: counts.ALL },
                            { id: 'UNPAID', label: 'UNPAID', count: counts.UNPAID },
                            { id: 'PARTIAL', label: 'PARTIAL', count: counts.PARTIAL },
                            { id: 'PAID', label: 'PAID', count: counts.PAID }
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setStatusFilter(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    statusFilter === t.id
                                        ? 'bg-white text-[#4A7CD2] shadow-2xs font-extrabold'
                                        : 'text-slate-600 hover:text-dark-slate'
                                }`}
                            >
                                <span>{t.label}</span>
                                <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                                    statusFilter === t.id
                                        ? 'bg-blue-100 text-[#4A7CD2]'
                                        : 'bg-slate-200/80 text-slate-600'
                                }`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Financial Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => handleOpenPaymentDialog()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Receive Payment</span>
                    </button>

                    <button
                        type="button"
                        onClick={handlePrintStatement}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-dark-slate hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                        title="Download official PDF account statement"
                    >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print Statement</span>
                    </button>

                    <button
                        type="button"
                        onClick={fetchFinancialDossier}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#4A7CD2] hover:bg-blue-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                        title="Refresh Invoices"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Invoiced & Billable Items Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-text space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs font-bold">Loading patient financial ledger & invoices...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <Receipt className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-dark-slate">
                            {invoiceItems.length === 0 
                                ? 'No Treatment Procedures or Invoices Found' 
                                : `No ${statusFilter.toLowerCase()} procedures found`}
                        </h3>
                        <p className="text-xs text-muted-text max-w-md mx-auto">
                            {invoiceItems.length === 0
                                ? 'Procedures added in the dental chart or treatment plan will appear here for billing and receipts.'
                                : `There are no procedures currently marked as ${statusFilter.toLowerCase()} (out of ${invoiceItems.length} total procedures).`}
                        </p>
                    </div>
                    {invoiceItems.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] text-white hover:bg-[#3665B7] shadow-xs cursor-pointer"
                        >
                            Show All Procedures ({invoiceItems.length})
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onNavigateToPlan}
                            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] text-white hover:bg-[#3665B7] shadow-xs cursor-pointer"
                        >
                            View Treatment Plan Tab
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Tooth / Modality</th>
                                    <th className="py-3 px-4">Procedure Details</th>
                                    <th className="py-3 px-4">Clinical Status</th>
                                    <th className="py-3 px-4 text-right">Price</th>
                                    <th className="py-3 px-4 text-right">Paid</th>
                                    <th className="py-3 px-4 text-right">Balance Due</th>
                                    <th className="py-3 px-4 text-center">Payment Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map(item => {
                                    const itemId = item.id || item.treatmentItemID || item.treatmentItemId;
                                    const isExpanded = expandedItemId === itemId;
                                    const toothNo = item.toothNo !== undefined ? item.toothNo : (item.toothNumber || 0);
                                    const toothLabel = toothNo > 0 ? (TOOTH_NAMES[toothNo] || `Tooth #${toothNo}`) : 'Full Arch / General';
                                    const itemName = item.name || item.procedureName || 'Treatment';
                                    const price = item.finalPrice || 0;
                                    const paid = item.paid || 0;
                                    const balance = item.balance || 0;
                                    const hasAllocations = item.allocations && item.allocations.length > 0;

                                    return (
                                        <React.Fragment key={itemId}>
                                            <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                                                {/* Tooth */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 h-8 rounded-xl bg-slate-100 text-dark-slate font-black flex items-center justify-center text-xs border border-slate-200">
                                                            {toothNo > 0 ? `#${toothNo}` : 'ALL'}
                                                        </span>
                                                        <span className="text-[11px] text-muted-text font-bold">
                                                            {toothNo > 0 ? `Tooth ${toothNo}` : 'General'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Procedure */}
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <p className="font-extrabold text-dark-slate">{itemName}</p>
                                                        <p className="text-[10px] text-muted-text font-medium flex items-center gap-1.5 mt-0.5">
                                                            <span className="uppercase">{item.category}</span>
                                                            {item.procedureCode && <span>• CDT {item.procedureCode}</span>}
                                                            {item.priceNote && <span className="italic text-slate-500">• {item.priceNote}</span>}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Clinical Status */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {item.status === 'completed' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                                            <Clock className="w-3 h-3 text-blue-600" />
                                                            Prepaid / In Progress
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Price */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <span className="font-black text-dark-slate">{formatMoney(price)}</span>
                                                </td>

                                                {/* Paid */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <span className={`font-black ${paid > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {formatMoney(paid)}
                                                    </span>
                                                </td>

                                                {/* Balance Due */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <span className={`font-black ${balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                        {formatMoney(balance)}
                                                    </span>
                                                </td>

                                                {/* Payment Status Badge */}
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    {item.paymentStatus === 'paid' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-2xs">
                                                            PAID
                                                        </span>
                                                    )}
                                                    {item.paymentStatus === 'partial' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                                                            PARTIAL
                                                        </span>
                                                    )}
                                                    {item.paymentStatus === 'unpaid' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs">
                                                            UNPAID
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {balance > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenPaymentDialog(item)}
                                                                className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                                                title="Collect payment against this item"
                                                            >
                                                                Pay Due
                                                            </button>
                                                        )}

                                                        {isDoctorOrAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPriceEditItem(item);
                                                                    setNewPrice(String(price));
                                                                    setPriceChangeReason('');
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-dark-slate hover:bg-slate-100 transition-colors cursor-pointer"
                                                                title="Override Price (Doctor/Admin)"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedItemId(isExpanded ? null : itemId)}
                                                            className={`p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer ${isExpanded ? 'bg-blue-100 text-[#4A7CD2]' : ''}`}
                                                            title="Toggle Payment Allocation History"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable Payment Allocations Sub-Table */}
                                            {isExpanded && (
                                                <tr className="bg-[#F8FAFC]">
                                                    <td colSpan="8" className="p-4 border-t border-b border-slate-200">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className="text-[11px] font-extrabold text-dark-slate uppercase tracking-wider flex items-center gap-1.5">
                                                                    <Receipt className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                                                    Payment Allocation History ({item.allocations?.length || 0})
                                                                </h5>
                                                                <span className="text-[10px] text-muted-text">
                                                                    Immutable financial receipt ledger
                                                                </span>
                                                            </div>

                                                            {!hasAllocations ? (
                                                                <p className="text-xs text-muted-text italic bg-white p-3 rounded-xl border border-slate-200 text-center">
                                                                    No payments have been allocated to this treatment item yet.
                                                                </p>
                                                            ) : (
                                                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                                                    <table className="w-full text-left text-xs">
                                                                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                                                                            <tr>
                                                                                <th className="py-2 px-3">Receipt #</th>
                                                                                <th className="py-2 px-3">Date & Time</th>
                                                                                <th className="py-2 px-3">Method</th>
                                                                                <th className="py-2 px-3">Received By</th>
                                                                                <th className="py-2 px-3 text-right">Amount</th>
                                                                                <th className="py-2 px-3 text-right">Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {item.allocations.map(alloc => (
                                                                                <tr key={alloc.id} className="hover:bg-slate-50">
                                                                                    <td className="py-2.5 px-3 font-mono font-bold text-[#4A7CD2]">
                                                                                        {alloc.receiptNo}
                                                                                    </td>
                                                                                    <td className="py-2.5 px-3 text-muted-text">
                                                                                        {new Date(alloc.paymentDate).toLocaleDateString('en-GB', {
                                                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                                                            hour: '2-digit', minute: '2-digit'
                                                                                        })}
                                                                                    </td>
                                                                                    <td className="py-2.5 px-3 capitalize font-medium">
                                                                                        {alloc.method}
                                                                                    </td>
                                                                                    <td className="py-2.5 px-3 text-slate-600">
                                                                                        User #{alloc.receivedBy || '1'}
                                                                                    </td>
                                                                                    <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                                                                                        {formatMoney(alloc.amount)}
                                                                                    </td>
                                                                                    <td className="py-2.5 px-3 text-right">
                                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handlePrintReceipt(item, alloc)}
                                                                                                className="p-1 rounded-md text-slate-500 hover:text-dark-slate hover:bg-slate-100 transition-colors cursor-pointer"
                                                                                                title="Print Official PDF Receipt"
                                                                                            >
                                                                                                <Printer className="w-3.5 h-3.5" />
                                                                                            </button>

                                                                                            {isAdmin && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        setVoidModalPayment(alloc);
                                                                                                        setVoidReason('');
                                                                                                    }}
                                                                                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                                                    title="Void / Refund this Payment (Admin Only)"
                                                                                                >
                                                                                                    <Ban className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL: RECEIVE FLEXIBLE PAYMENT */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-dark-slate">Receive Patient Payment</h3>
                                    <p className="text-[11px] text-muted-text">Flexible amount with intelligent procedure allocation</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowPaymentModal(false)} 
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Amount Received (PKR):</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={paymentAmount}
                                        onChange={(e) => handlePaymentAmountChange(e.target.value)}
                                        placeholder="Enter amount"
                                        required
                                        className="w-full text-base font-extrabold p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Payment Method:</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                                    >
                                        <option value="cash">Cash Counter</option>
                                        <option value="card">Credit / Debit Card (POS)</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="easypaisa">EasyPaisa</option>
                                        <option value="jazzcash">JazzCash</option>
                                    </select>
                                </div>
                            </div>

                            {/* Procedure Allocation Matrix */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-dark-slate">
                                    <span>Allocate Across Open Procedures:</span>
                                    <span className="text-muted-text text-[11px]">
                                        Remaining unallocated credit: <strong className="text-emerald-600">
                                            {formatMoney(Math.max(0, (parseInt(paymentAmount, 10) || 0) - Object.values(paymentAllocations).reduce((a, b) => a + (parseInt(b, 10) || 0), 0)))}
                                        </strong>
                                    </span>
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                                    {invoiceItems.filter(i => (i.balance || 0) > 0).length === 0 ? (
                                        <p className="text-xs text-muted-text italic text-center py-2">
                                            All current procedures are fully paid. The entire payment will be saved as Advance Credit.
                                        </p>
                                    ) : (
                                        invoiceItems.filter(i => (i.balance || 0) > 0).map(item => (
                                            <div key={item.id} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-dark-slate truncate">{item.name}</p>
                                                    <p className="text-[10px] text-muted-text">
                                                        {item.toothNo > 0 ? `Tooth #${item.toothNo}` : 'General'} • Due: <strong className="text-rose-600">{formatMoney(item.balance)}</strong>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className="text-xs font-bold text-slate-500">Rs</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.balance}
                                                        value={paymentAllocations[item.id] !== undefined ? paymentAllocations[item.id] : ''}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value, 10) || 0;
                                                            setPaymentAllocations(prev => ({ ...prev, [item.id]: val }));
                                                        }}
                                                        className="w-24 text-xs font-bold p-1.5 rounded-lg border border-slate-200 text-right"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Notes / Reference (Optional):</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="e.g. Consultation fee / Tooth #14 composite downpayment"
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordingPayment}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {recordingPayment ? 'Recording...' : 'Save Payment & Generate Receipt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ALLOCATE ADVANCE CREDIT */}
            {showAllocateCreditModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-dark-slate">Allocate Advance Credit</h3>
                                    <p className="text-[11px] text-muted-text">
                                        Available Credit: <strong className="text-emerald-600">{formatMoney(accountSummary?.unallocatedCredit)}</strong>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAllocateCreditModal(false)} 
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAllocateCredit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-dark-slate block">Specify Credit Allocation per Item:</label>
                                <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                                    {invoiceItems.filter(i => (i.balance || 0) > 0).map(item => (
                                        <div key={item.id} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-dark-slate truncate">{item.name}</p>
                                                <p className="text-[10px] text-muted-text">
                                                    Due: <strong className="text-rose-600">{formatMoney(item.balance)}</strong>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span className="text-xs font-bold text-slate-500">Rs</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={Math.min(item.balance, accountSummary?.unallocatedCredit || 0)}
                                                    value={creditAllocations[item.id] !== undefined ? creditAllocations[item.id] : ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10) || 0;
                                                        setCreditAllocations(prev => ({ ...prev, [item.id]: val }));
                                                    }}
                                                    className="w-24 text-xs font-bold p-1.5 rounded-lg border border-slate-200 text-right"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAllocateCreditModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={allocatingCredit}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {allocatingCredit ? 'Allocating...' : 'Apply Credit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: VOID PAYMENT (Admin Only) */}
            {voidModalPayment && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                                <Ban className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-dark-slate">Void / Refund Payment</h3>
                                <p className="text-[11px] text-muted-text">Receipt #{voidModalPayment.receiptNo} ({formatMoney(voidModalPayment.amount)})</p>
                            </div>
                        </div>

                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                            <p className="font-bold">Audit Trail Notice:</p>
                            <p className="text-[11px]">
                                Voiding reverses all payment allocations and marks the receipt voided. Financial records are never deleted.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark-slate block">Mandatory Void Reason:</label>
                            <textarea
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder="e.g. Wrong entry / Patient refund"
                                rows="3"
                                required
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setVoidModalPayment(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleVoidPayment}
                                disabled={voidingPayment || !voidReason.trim()}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {voidingPayment ? 'Voiding...' : 'Confirm Void'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT PRICE (Doctor/Admin with reason) */}
            {priceEditItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4A7CD2] flex items-center justify-center border border-blue-200">
                                <Edit3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-dark-slate">Edit Treatment Price</h3>
                                <p className="text-[11px] text-muted-text">{priceEditItem.name}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSavePriceEdit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-dark-slate block">New Price (PKR):</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    required
                                    className="w-full text-base font-extrabold p-2.5 rounded-xl border border-slate-200 bg-white"
                                />
                                <span className="text-[10px] text-muted-text">
                                    If new price is lower than amount already paid, the excess will automatically become patient credit.
                                </span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-dark-slate block">Reason for Price Override:</label>
                                <textarea
                                    value={priceChangeReason}
                                    onChange={(e) => setPriceChangeReason(e.target.value)}
                                    placeholder="e.g. Clinical discount approved / Case revision"
                                    rows="2"
                                    required
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPriceEditItem(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPrice}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] hover:bg-[#3665B7] text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {savingPrice ? 'Updating...' : 'Save Price'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

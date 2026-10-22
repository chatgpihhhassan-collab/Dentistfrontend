import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, CheckCircle2, Play, Check, AlertCircle, DollarSign, 
    Calendar, Sparkles, Plus, X, Edit3, Trash2, ShieldCheck, 
    Layers, RefreshCw, Receipt, Banknote, CreditCard, ChevronRight,
    User, ArrowUpRight, AlertTriangle, Filter, Mic, Info, ArrowRight,
    CheckSquare, Lock, Stethoscope
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';
import { TOOTH_NAMES } from './PatientTreatmentInvoiceTab';

export default function TreatmentPlanTab({ 
    patientId, 
    patient, 
    doctorId = 1,
    userRole = 'doctor',
    categoryFilter = null,
    onClearCategoryFilter,
    onTreatmentStatusChange,
    onNavigateToInvoices 
}) {
    const [loading, setLoading] = useState(true);
    const [treatmentItems, setTreatmentItems] = useState([]);
    const [unplannedFindings, setUnplannedFindings] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [actionLoading, setActionLoading] = useState({});
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Category Filter State
    const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'ALL');

    // Modals
    const [showCatalogModal, setShowCatalogModal] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [paymentModalItem, setPaymentModalItem] = useState(null);
    const [cancelModalItem, setCancelModalItem] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [savingItem, setSavingItem] = useState(false);

    // Catalog Form State
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [catalogTooth, setCatalogTooth] = useState('0');
    const [catalogPrice, setCatalogPrice] = useState('');
    const [catalogVisits, setCatalogVisits] = useState('1');
    const [catalogNote, setCatalogNote] = useState('');

    // Custom Form State
    const [customName, setCustomName] = useState('');
    const [customCategory, setCustomCategory] = useState('restorative');
    const [customTooth, setCustomTooth] = useState('0');
    const [customPrice, setCustomPrice] = useState('');
    const [customVisits, setCustomVisits] = useState('1');
    const [customNote, setCustomNote] = useState('');

    // Payment Modal State
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');

    const isDoctorOrAdmin = userRole === 'doctor' || userRole === 'admin' || userRole === 'Dentist';

    // Format Currency
    const formatMoney = (amount) => {
        const num = Number(amount) || 0;
        return `Rs ${num.toLocaleString('en-PK')}`;
    };

    // Update filter when prop changes
    useEffect(() => {
        if (categoryFilter) {
            setSelectedCategory(categoryFilter.toUpperCase());
        }
    }, [categoryFilter]);

    // Fetch Plan Data
    const fetchPlanData = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [itemsRes, findingsRes, catRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items?view=plan`),
                fetch(`${API_BASE_URL}/api/patients/${patientId}/findings/unplanned`),
                fetch(`${API_BASE_URL}/api/treatment-catalog`)
            ]);

            if (itemsRes.ok) {
                const data = await itemsRes.json();
                const normalized = (Array.isArray(data) ? data : []).map(i => ({
                    ...i,
                    id: i.id || i.treatmentItemID || i.treatmentItemId,
                    treatmentItemID: i.treatmentItemID || i.id || i.treatmentItemId,
                    name: i.name || i.procedureName || 'Treatment',
                    procedureName: i.procedureName || i.name || 'Treatment',
                    toothNo: i.toothNo !== undefined ? i.toothNo : (i.toothNumber || 0),
                    toothNumber: i.toothNumber !== undefined ? i.toothNumber : (i.toothNo || 0),
                    finalPrice: i.finalPrice || i.estimatedPrice || 0,
                    estimatedPrice: i.estimatedPrice || i.finalPrice || 0,
                    paid: i.paid || 0,
                    balance: i.balance !== undefined ? i.balance : Math.max(0, (i.finalPrice || i.estimatedPrice || 0) - (i.paid || 0)),
                }));
                setTreatmentItems(normalized);
            }
            if (findingsRes.ok) {
                const data = await findingsRes.json();
                setUnplannedFindings(Array.isArray(data) ? data : []);
            }
            if (catRes.ok) {
                const data = await catRes.json();
                setCatalog(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to load treatment plan:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanData();
    }, [patientId]);

    // Auto-fill catalog modal when catalog selection changes
    const handleCatalogSelect = (e) => {
        const catId = e.target.value;
        setSelectedCatalogId(catId);
        const item = catalog.find(c => String(c.id) === String(catId));
        if (item) {
            setCatalogPrice(item.defaultPrice || '');
            setCatalogVisits(item.defaultVisits || '1');
        }
    };

    // Filter Items by Category
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'ALL') return treatmentItems;
        return treatmentItems.filter(item => 
            (item.category || '').toUpperCase() === selectedCategory ||
            (item.name || item.procedureName || '').toUpperCase().includes(selectedCategory)
        );
    }, [treatmentItems, selectedCategory]);

    // Financial Summaries
    const totalPlannedValue = useMemo(() => {
        return treatmentItems.reduce((acc, curr) => acc + (Number(curr.finalPrice || curr.estimatedPrice) || 0), 0);
    }, [treatmentItems]);

    const totalAdvanceReceived = useMemo(() => {
        return treatmentItems.reduce((acc, curr) => acc + (Number(curr.paid) || 0), 0);
    }, [treatmentItems]);

    const remainingToCollect = Math.max(0, totalPlannedValue - totalAdvanceReceived);

    // Available categories from current items
    const availableCategories = useMemo(() => {
        const set = new Set();
        treatmentItems.forEach(i => {
            if (i.category) set.add(i.category.toUpperCase());
        });
        return Array.from(set);
    }, [treatmentItems]);

    // Action Helpers
    const showToast = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
    };

    // Status Transitions
    const handleStatusTransition = async (rawItemId, newStatus, reason = null) => {
        const itemId = typeof rawItemId === 'object' && rawItemId !== null
            ? (rawItemId.id || rawItemId.treatmentItemID || rawItemId.treatmentItemId)
            : rawItemId;

        if (!itemId) {
            showToast('error', 'Cannot update status: Invalid procedure identifier.');
            return;
        }

        setActionLoading(prev => ({ ...prev, [itemId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: doctorId || 1,
                    userRole: userRole || 'Doctor',
                    status: newStatus,
                    closedReason: reason
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message || `Status updated to ${newStatus}.`);
                await fetchPlanData();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                const errMsg = err.message || (err.errors ? Object.values(err.errors).flat().join(', ') : '') || err.title || `Failed to update status to ${newStatus}.`;
                showToast('error', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network error updating treatment status.');
        } finally {
            setActionLoading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    // Add from Catalog Submit
    const handleAddFromCatalog = async (e) => {
        e.preventDefault();
        const selected = catalog.find(c => String(c.id) === String(selectedCatalogId));
        if (!selected) {
            showToast('error', 'Please select a procedure from the catalog.');
            return;
        }

        setSavingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    catalogId: selected.id,
                    name: selected.name,
                    category: selected.category,
                    toothNo: parseInt(catalogTooth, 10) || 0,
                    source: 'manual',
                    estimatedPrice: parseInt(catalogPrice, 10) || selected.defaultPrice,
                    finalPrice: parseInt(catalogPrice, 10) || selected.defaultPrice,
                    plannedVisits: parseInt(catalogVisits, 10) || selected.defaultVisits || 1,
                    status: 'proposed',
                    priceNote: catalogNote
                })
            });

            if (res.ok) {
                showToast('success', `Added "${selected.name}" to treatment plan.`);
                setShowCatalogModal(false);
                setSelectedCatalogId('');
                setCatalogTooth('0');
                setCatalogPrice('');
                setCatalogNote('');
                await fetchPlanData();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('error', err.message || 'Failed to add procedure.');
            }
        } catch (err) {
            showToast('error', 'Network error adding procedure.');
        } finally {
            setSavingItem(false);
        }
    };

    // Add Custom Procedure Submit
    const handleAddCustom = async (e) => {
        e.preventDefault();
        if (!customName.trim()) {
            showToast('error', 'Procedure name is required.');
            return;
        }

        setSavingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    name: customName.trim(),
                    category: customCategory,
                    toothNo: parseInt(customTooth, 10) || 0,
                    source: 'manual',
                    estimatedPrice: parseInt(customPrice, 10) || 0,
                    finalPrice: parseInt(customPrice, 10) || 0,
                    plannedVisits: parseInt(customVisits, 10) || 1,
                    status: 'proposed',
                    priceNote: customNote
                })
            });

            if (res.ok) {
                showToast('success', `Added custom procedure "${customName}" to treatment plan.`);
                setShowCustomModal(false);
                setCustomName('');
                setCustomTooth('0');
                setCustomPrice('');
                setCustomNote('');
                await fetchPlanData();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('error', err.message || 'Failed to add custom procedure.');
            }
        } catch (err) {
            showToast('error', 'Network error adding custom procedure.');
        } finally {
            setSavingItem(false);
        }
    };

    // Add Unplanned Finding to Plan
    const handleAddFindingToPlan = async (finding) => {
        setActionLoading(prev => ({ ...prev, [`finding_${finding.toothNumber}`]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    name: finding.suggestedProcedureName,
                    category: 'restorative',
                    procedureCode: finding.suggestedProcedureCode,
                    toothNo: finding.toothNumber,
                    source: 'chart_save',
                    sourceRef: `Finding: ${finding.conditionStatus}`,
                    estimatedPrice: finding.estimatedPrice,
                    finalPrice: finding.estimatedPrice,
                    plannedVisits: 1,
                    status: 'proposed',
                    priceNote: finding.comments || `From chart clinical finding: ${finding.conditionStatus}`
                })
            });

            if (res.ok) {
                showToast('success', `Added Tooth #${finding.toothNumber} ${finding.suggestedProcedureName} to treatment plan.`);
                await fetchPlanData();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('error', err.message || 'Failed to add finding.');
            }
        } catch (err) {
            showToast('error', 'Network error adding clinical finding.');
        } finally {
            setActionLoading(prev => ({ ...prev, [`finding_${finding.toothNumber}`]: false }));
        }
    };

    // Record Advance Payment on Item (Auto-accepts proposed item)
    const handleRecordAdvance = async (e) => {
        e.preventDefault();
        const amt = parseInt(paymentAmount, 10);
        if (!paymentModalItem || !amt || amt <= 0) {
            showToast('error', 'Please enter a valid positive payment amount.');
            return;
        }

        const targetId = paymentModalItem.id || paymentModalItem.treatmentItemID || paymentModalItem.treatmentItemId;
        if (!targetId) {
            showToast('error', 'Cannot record payment: Invalid procedure reference.');
            return;
        }

        setSavingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    amount: amt,
                    method: paymentMethod,
                    receivedBy: doctorId || 1,
                    note: paymentNotes || `Advance for ${paymentModalItem.name || paymentModalItem.procedureName || 'treatment'}`,
                    allocations: [
                        {
                            treatmentItemId: targetId,
                            amount: Math.min(amt, paymentModalItem.balance || paymentModalItem.finalPrice)
                        }
                    ]
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message || `Payment recorded! Receipt: ${data.receiptNumber}`);
                setPaymentModalItem(null);
                setPaymentAmount('');
                setPaymentNotes('');
                await fetchPlanData();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                const errMsg = err.message || (err.errors ? Object.values(err.errors).flat().join(', ') : '') || err.title || 'Failed to record advance payment.';
                showToast('error', errMsg);
            }
        } catch (err) {
            showToast('error', 'Network error recording payment.');
        } finally {
            setSavingItem(false);
        }
    };

    // Render Status Badge
    const renderStatusBadge = (status, source) => {
        const s = (status || '').toLowerCase();
        if (s === 'draft') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                    <Mic className="w-3 h-3 text-purple-600 animate-pulse" />
                    <span>Draft (Needs Confirmation)</span>
                </span>
            );
        }
        if (s === 'proposed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Proposed</span>
                </span>
            );
        }
        if (s === 'accepted') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span>Accepted</span>
                </span>
            );
        }
        if (s === 'in_progress') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>In Progress</span>
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {status}
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
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

            {/* Top Toolbar: Action Buttons & Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                {/* Category Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-muted-text flex items-center gap-1 mr-1">
                        <Filter className="w-3 h-3 text-slate-400" /> Category:
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategory('ALL');
                            if (onClearCategoryFilter) onClearCategoryFilter();
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedCategory === 'ALL'
                                ? 'bg-[#4A7CD2] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        All Active ({treatmentItems.length})
                    </button>
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {selectedCategory !== 'ALL' && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCategory('ALL');
                                if (onClearCategoryFilter) onClearCategoryFilter();
                            }}
                            className="text-[10px] text-slate-500 hover:text-rose-600 underline ml-1 cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowCatalogModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] hover:bg-[#3665B7] text-white shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add from Catalog</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCustomModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-dark-slate hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Add Custom</span>
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            setActionLoading(prev => ({ ...prev, sync: true }));
                            try {
                                const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/sync-directory?doctorId=${doctorId}`, { method: 'POST' });
                                if (res.ok) {
                                    const d = await res.json();
                                    showToast('success', d.message);
                                    await fetchPlanData();
                                    if (onTreatmentStatusChange) onTreatmentStatusChange();
                                }
                            } catch (e) {
                                showToast('error', 'Directory sync error');
                            } finally {
                                setActionLoading(prev => ({ ...prev, sync: false }));
                            }
                        }}
                        disabled={actionLoading.sync}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#4A7CD2] hover:bg-blue-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                        title="Auto-sync modalities from Patient Directory (e.g. Whitening, Braces)"
                    >
                        <RefreshCw className={`w-4 h-4 ${actionLoading.sync ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Total Planned Care
                    </p>
                    <p className="text-2xl font-black text-dark-slate">{formatMoney(totalPlannedValue)}</p>
                    <p className="text-[11px] text-muted-text mt-1">{filteredItems.length} active procedure(s) displayed</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Advance Held
                    </p>
                    <p className="text-2xl font-black text-emerald-600">{formatMoney(totalAdvanceReceived)}</p>
                    <p className="text-[11px] text-muted-text mt-1">Prepaid allocations across active items</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        Net Billable on Completion
                    </p>
                    <p className="text-2xl font-black text-dark-slate">{formatMoney(remainingToCollect)}</p>
                    <p className="text-[11px] text-muted-text mt-1">Remaining balance to be settled</p>
                </div>
            </div>

            {/* UNPLANNED CLINICAL FINDINGS PANEL (TeethState with no open items) */}
            {unplannedFindings.length > 0 && (
                <div className="bg-amber-50/70 rounded-2xl border border-amber-300 p-5 space-y-3 shadow-2xs animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-amber-700" />
                                Unplanned Clinical Findings ({unplannedFindings.length})
                            </h3>
                        </div>
                        <span className="text-[11px] text-amber-800">
                            Odontogram findings without an open treatment plan item yet
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unplannedFindings.map((f, idx) => (
                            <div 
                                key={idx}
                                className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                                            Tooth #{f.toothKey || f.toothNumber}
                                        </span>
                                        <span className="text-xs font-bold text-dark-slate truncate">
                                            {f.conditionStatus}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">
                                        Suggest: {f.suggestedProcedureName} ({formatMoney(f.estimatedPrice)})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleAddFindingToPlan(f)}
                                    disabled={actionLoading[`finding_${f.toothNumber}`]}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs flex-shrink-0 transition-colors cursor-pointer"
                                >
                                    + Add to Plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TREATMENT ITEMS TABLE / CARDS */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-text space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#4A7CD2]" />
                    <p className="text-xs font-bold">Loading active patient treatment plan...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#4A7CD2]">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-dark-slate">No Active Treatments in Selected Plan</h3>
                        <p className="text-xs text-muted-text max-w-md mx-auto">
                            Click <strong>Add from Catalog</strong> above, or add findings directly from the Dental Chart or Odontogram to populate this plan immediately!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-dark-slate uppercase tracking-wider">
                            Active Planned & In-Progress Procedures ({filteredItems.length})
                        </h3>
                        <span className="text-[11px] text-muted-text">
                            Single source of truth (dentist.TreatmentItems)
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {filteredItems.map(item => {
                            const itemId = item.id || item.treatmentItemID || item.treatmentItemId;
                            const isBusy = actionLoading[itemId];
                            const toothNo = item.toothNo !== undefined ? item.toothNo : (item.toothNumber || 0);
                            const toothLabel = toothNo > 0 ? (TOOTH_NAMES[toothNo] || `Tooth #${toothNo}`) : 'Full Arch / General';
                            const itemName = item.name || item.procedureName || 'Treatment';
                            const price = item.finalPrice || item.estimatedPrice || 0;
                            const paid = item.paid || 0;
                            const balance = item.balance !== undefined ? item.balance : Math.max(0, price - paid);

                            return (
                                <div 
                                    key={itemId} 
                                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                                        item.status === 'in_progress'
                                            ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                                            : item.status === 'draft'
                                            ? 'bg-purple-50/40 border-purple-200/80 shadow-xs'
                                            : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                                    }`}
                                >
                                    {/* Left: Tooth Badge + Details */}
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black flex-shrink-0 shadow-2xs ${
                                            item.status === 'in_progress'
                                                ? 'bg-blue-600 text-white'
                                                : item.status === 'draft'
                                                ? 'bg-purple-600 text-white'
                                                : item.status === 'accepted'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-amber-500 text-white'
                                        }`}>
                                            <span className="text-[9px] tracking-widest uppercase opacity-80 leading-none">
                                                {toothNo > 0 ? 'TOOTH' : 'ARCH'}
                                            </span>
                                            <span className="text-base font-extrabold leading-tight">
                                                {toothNo > 0 ? toothNo : 'ALL'}
                                            </span>
                                        </div>

                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-dark-slate">{itemName}</h4>
                                                {item.category && (
                                                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                                        {item.category}
                                                    </span>
                                                )}
                                                {renderStatusBadge(item.status, item.source)}
                                                {item.source === 'voice' && (
                                                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 flex items-center gap-0.5">
                                                        <Mic className="w-2.5 h-2.5" /> AI Scribe
                                                    </span>
                                                )}
                                                {item.source === 'directory' && (
                                                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700">
                                                        Directory Modality
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-muted-text">
                                                {toothLabel} • Snapshot Fee: <strong className="text-dark-slate">{formatMoney(price)}</strong>
                                                {item.plannedVisits > 1 && (
                                                    <span className="ml-2 px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                        {item.plannedVisits} Planned Visits
                                                    </span>
                                                )}
                                            </p>

                                            {item.priceNote && (
                                                <p className="text-[11px] text-slate-500 italic mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                    Note: {item.priceNote}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Center: Financial Figures */}
                                    <div className="flex items-center gap-6 sm:px-4">
                                        <div className="space-y-0.5 text-left lg:text-right">
                                            <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Paid Advance</p>
                                            <p className={`text-xs font-black ${paid > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {formatMoney(paid)}
                                            </p>
                                        </div>

                                        <div className="space-y-0.5 text-left lg:text-right">
                                            <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Remaining Balance</p>
                                            <p className="text-xs font-black text-dark-slate">
                                                {formatMoney(balance)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions by Status & Role */}
                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                                        {/* DRAFT (Needs Doctor Confirmation) */}
                                        {item.status === 'draft' && (
                                            <>
                                                {isDoctorOrAdmin ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStatusTransition(itemId, 'proposed')}
                                                        disabled={isBusy}
                                                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer"
                                                        title="Confirm AI Voice Draft into Clinical Treatment Plan"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Confirm Draft</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200">
                                                        Awaiting Doctor Confirmation
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusTransition(itemId, 'declined', 'Declined draft')}
                                                    disabled={isBusy}
                                                    className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}

                                        {/* PROPOSED (Doctor recommended, awaiting patient agreement) */}
                                        {item.status === 'proposed' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusTransition(itemId, 'accepted')}
                                                    disabled={isBusy}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                                                    title="Mark patient agreement"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Accept Plan</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPaymentModalItem(item);
                                                        setPaymentAmount(String(balance > 0 ? balance : price));
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                                                    title="Record advance payment (auto-accepts this item)"
                                                >
                                                    <Banknote className="w-3.5 h-3.5" />
                                                    <span>Pay Advance</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusTransition(itemId, 'declined', 'Patient declined')}
                                                    disabled={isBusy}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Patient declined this proposal"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}

                                        {/* ACCEPTED (Patient agreed) */}
                                        {item.status === 'accepted' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusTransition(itemId, 'in_progress')}
                                                    disabled={isBusy}
                                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] hover:bg-[#3665B7] text-white shadow-xs transition-colors cursor-pointer"
                                                    title="Begin chairside clinical intervention"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                    <span>Start</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPaymentModalItem(item);
                                                        setPaymentAmount(String(balance > 0 ? balance : price));
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                                                    title="Record advance payment against this procedure"
                                                >
                                                    <Banknote className="w-3.5 h-3.5" />
                                                    <span>Add Advance</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCancelModalItem(item);
                                                        setCancelReason('');
                                                    }}
                                                    disabled={isBusy}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Cancel this procedure"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}

                                        {/* IN_PROGRESS (Operatory Active) */}
                                        {item.status === 'in_progress' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPaymentModalItem(item);
                                                        setPaymentAmount(String(balance > 0 ? balance : price));
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                                                    title="Record advance payment against this procedure"
                                                >
                                                    <Banknote className="w-3.5 h-3.5" />
                                                    <span>Add Payment</span>
                                                </button>

                                                {isDoctorOrAdmin ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStatusTransition(itemId, 'completed')}
                                                        disabled={isBusy}
                                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                                        title="Complete procedure — moves to Invoices tab"
                                                    >
                                                        <Check className="w-4 h-4 stroke-[3]" />
                                                        <span>Complete</span>
                                                    </button>
                                                ) : (
                                                    <span 
                                                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1"
                                                        title="Only clinicians with Doctor/Admin role can mark procedures complete"
                                                    >
                                                        <Lock className="w-3 h-3" /> Doctor Only
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCancelModalItem(item);
                                                        setCancelReason('');
                                                    }}
                                                    disabled={isBusy}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Cancel this procedure"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL: ADD FROM CATALOG */}
            {showCatalogModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4A7CD2] flex items-center justify-center border border-blue-200">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-dark-slate">Add Treatment from Clinic Catalog</h3>
                                    <p className="text-[11px] text-muted-text">Select procedure modality from standardized clinic directory</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCatalogModal(false)} 
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddFromCatalog} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Select Modality / Procedure:</label>
                                <select
                                    value={selectedCatalogId}
                                    onChange={handleCatalogSelect}
                                    required
                                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                >
                                    <option value="">-- Choose Standard Procedure --</option>
                                    {catalog.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.category.toUpperCase()}) — Default: Rs {item.defaultPrice.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Tooth Number:</label>
                                    <select
                                        value={catalogTooth}
                                        onChange={(e) => setCatalogTooth(e.target.value)}
                                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                    >
                                        <option value="0">0 — Full Arch / General / Non-tooth</option>
                                        {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                                            <option key={n} value={n}>Tooth #{n} ({TOOTH_NAMES[n] || ''})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Planned Visits:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="36"
                                        value={catalogVisits}
                                        onChange={(e) => setCatalogVisits(e.target.value)}
                                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Snapshot Price (PKR):</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={catalogPrice}
                                    onChange={(e) => setCatalogPrice(e.target.value)}
                                    placeholder="Enter procedure price"
                                    required
                                    className="w-full text-sm font-extrabold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                />
                                <span className="text-[10px] text-muted-text">Snapshot price is frozen on item creation and unaffected by future catalog changes.</span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Clinical Note (Optional):</label>
                                <input
                                    type="text"
                                    value={catalogNote}
                                    onChange={(e) => setCatalogNote(e.target.value)}
                                    placeholder="e.g. In-office 35% HP bleaching protocol"
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCatalogModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingItem}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] hover:bg-[#3665B7] text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {savingItem ? 'Saving...' : 'Add to Treatment Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD CUSTOM PROCEDURE */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-dark-slate">Add Custom Clinical Procedure</h3>
                                    <p className="text-[11px] text-muted-text">Enter custom procedure name, category, and fee</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCustomModal(false)} 
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCustom} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Procedure Name:</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="e.g. Custom Porcelain Onlay / Splint Therapy"
                                    required
                                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Category:</label>
                                    <select
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                    >
                                        <option value="consultation">Consultation</option>
                                        <option value="restorative">Restorative / Fillings</option>
                                        <option value="endo">Endodontics (RCT)</option>
                                        <option value="surgery">Oral Surgery</option>
                                        <option value="ortho">Orthodontics / Braces</option>
                                        <option value="whitening">Cosmetic Whitening</option>
                                        <option value="prosthetics">Prosthetics / Crowns</option>
                                        <option value="preventive">Preventive / Scaling</option>
                                        <option value="general">General / Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Tooth Number:</label>
                                    <select
                                        value={customTooth}
                                        onChange={(e) => setCustomTooth(e.target.value)}
                                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                    >
                                        <option value="0">0 — Full Arch / Non-tooth</option>
                                        {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                                            <option key={n} value={n}>Tooth #{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Price (PKR):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        placeholder="Fee in Rs"
                                        required
                                        className="w-full text-sm font-extrabold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-dark-slate block">Planned Visits:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="36"
                                        value={customVisits}
                                        onChange={(e) => setCustomVisits(e.target.value)}
                                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Notes (Optional):</label>
                                <input
                                    type="text"
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    placeholder="Procedure details..."
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#4A7CD2]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingItem}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {savingItem ? 'Saving...' : 'Add Custom Procedure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: COLLECT ADVANCE PAYMENT */}
            {paymentModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-dark-slate">Record Advance Payment</h3>
                                    <p className="text-[11px] text-muted-text">{paymentModalItem.name} {paymentModalItem.toothNo > 0 ? `• Tooth #${paymentModalItem.toothNo}` : ''}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPaymentModalItem(null)} 
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordAdvance} className="space-y-4">
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-text">Procedure Fee:</span>
                                    <strong className="text-dark-slate">{formatMoney(paymentModalItem.finalPrice || paymentModalItem.estimatedPrice)}</strong>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-text">Already Paid:</span>
                                    <strong className="text-emerald-600">{formatMoney(paymentModalItem.paid || 0)}</strong>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                    <span className="font-bold text-dark-slate">Remaining Balance:</span>
                                    <strong className="text-blue-600">
                                        {formatMoney(paymentModalItem.balance !== undefined ? paymentModalItem.balance : (paymentModalItem.finalPrice - (paymentModalItem.paid || 0)))}
                                    </strong>
                                </div>
                            </div>

                            {paymentModalItem.status === 'proposed' && (
                                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-[11px] text-blue-800 font-medium">
                                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span>Recording payment will automatically advance this proposed item to <strong>Accepted</strong>.</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Payment Amount (PKR):</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter amount in whole Rs"
                                    required
                                    className="w-full text-base font-extrabold p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-emerald-500"
                                />
                                <span className="text-[10px] text-muted-text">Any amount exceeding remaining balance will be credited as Advance Credit.</span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Payment Method:</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                                >
                                    <option value="cash">Cash Counter</option>
                                    <option value="card">Credit / Debit Card (POS)</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="easypaisa">EasyPaisa</option>
                                    <option value="jazzcash">JazzCash</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate block">Note / Reference (Optional):</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="e.g. First installment advance"
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModalItem(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingItem}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {savingItem ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CANCEL TREATMENT */}
            {cancelModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-dark-slate">Cancel Treatment</h3>
                                <p className="text-[11px] text-muted-text">{cancelModalItem.name || cancelModalItem.procedureName || 'Treatment'}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-dark-slate block">Cancellation Reason:</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Why is this procedure being cancelled?"
                                rows="3"
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setCancelModalItem(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const cancelId = cancelModalItem.id || cancelModalItem.treatmentItemID || cancelModalItem.treatmentItemId;
                                    handleStatusTransition(cancelId, 'cancelled', cancelReason);
                                    setCancelModalItem(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                                Cancel Procedure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

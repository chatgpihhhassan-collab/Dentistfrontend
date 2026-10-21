import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, CheckCircle2, Play, Check, AlertCircle, DollarSign, 
    Calendar, Sparkles, Plus, X, Edit3, Trash2, ShieldCheck, 
    Layers, RefreshCw, Receipt, Banknote, CreditCard, ChevronRight,
    User, ArrowUpRight, AlertTriangle
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';
import { TOOTH_NAMES } from './PatientTreatmentInvoiceTab';

export default function TreatmentPlanTab({ 
    patientId, 
    patient, 
    doctorId = 1,
    onTreatmentStatusChange,
    onNavigateToInvoices 
}) {
    const [loading, setLoading] = useState(true);
    const [treatmentItems, setTreatmentItems] = useState([]);
    const [actionLoading, setActionLoading] = useState({});
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Advance Payment Modal State
    const [paymentModalItem, setPaymentModalItem] = useState(null);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advanceMethod, setAdvanceMethod] = useState('cash');
    const [advanceNotes, setAdvanceNotes] = useState('');
    const [savingPayment, setSavingPayment] = useState(false);

    // Cancel Modal State
    const [cancelModalItem, setCancelModalItem] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellingItem, setCancellingItem] = useState(false);

    const currency = 'PKR';

    const fetchTreatmentPlan = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items?status=planned,in_progress`);
            if (res.ok) {
                const data = await res.json();
                setTreatmentItems(data);
            }
        } catch (err) {
            console.error('Failed to load treatment items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreatmentPlan();
    }, [patientId]);

    // Format Currency
    const formatMoney = (amount) => {
        const num = Number(amount) || 0;
        return `Rs ${num.toLocaleString('en-PK')}`;
    };

    // Separate items into "Today's Visit / Active" and "Upcoming"
    const todayItems = useMemo(() => {
        return treatmentItems.filter(item => {
            if (item.status === 'in_progress') return true;
            if (item.scheduledDate) {
                const itemDate = new Date(item.scheduledDate).toDateString();
                const today = new Date().toDateString();
                return itemDate === today;
            }
            return false;
        });
    }, [treatmentItems]);

    const upcomingItems = useMemo(() => {
        return treatmentItems.filter(item => {
            if (item.status === 'in_progress') return false;
            if (item.scheduledDate) {
                const itemDate = new Date(item.scheduledDate).toDateString();
                const today = new Date().toDateString();
                return itemDate !== today;
            }
            return true;
        });
    }, [treatmentItems]);

    // Totals
    const totalPlannedFee = useMemo(() => {
        return treatmentItems.reduce((acc, curr) => acc + (Number(curr.fee) || 0), 0);
    }, [treatmentItems]);

    const totalAdvanceReceived = useMemo(() => {
        return treatmentItems.reduce((acc, curr) => acc + (Number(curr.advancePaidAmount) || 0), 0);
    }, [treatmentItems]);

    const remainingToCollect = Math.max(0, totalPlannedFee - totalAdvanceReceived);

    // Actions
    const handleStart = async (itemId) => {
        setActionLoading(prev => ({ ...prev, [itemId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${itemId}/start?userId=${doctorId}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Treatment procedure started (In Progress).' });
                await fetchTreatmentPlan();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                setFeedback({ type: 'error', message: err.message || 'Failed to start treatment.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Network error starting treatment.' });
        } finally {
            setActionLoading(prev => ({ ...prev, [itemId]: false }));
            setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
        }
    };

    const handleComplete = async (itemId) => {
        setActionLoading(prev => ({ ...prev, [itemId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${itemId}/complete?userId=${doctorId}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Procedure completed! Moved to Treatment & Invoices tab.' });
                await fetchTreatmentPlan();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                setFeedback({ type: 'error', message: err.message || 'Failed to complete treatment.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Network error completing treatment.' });
        } finally {
            setActionLoading(prev => ({ ...prev, [itemId]: false }));
            setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
        }
    };

    const handleRecordAdvancePayment = async (e) => {
        e.preventDefault();
        if (!paymentModalItem || !advanceAmount || Number(advanceAmount) <= 0) return;

        setSavingPayment(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${paymentModalItem.treatmentItemID}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(advanceAmount),
                    paymentMethod: advanceMethod,
                    receivedByUserId: doctorId,
                    notes: advanceNotes
                })
            });

            if (res.ok) {
                const data = await res.json();
                setFeedback({ type: 'success', message: data.message || 'Advance payment recorded successfully!' });
                setPaymentModalItem(null);
                setAdvanceAmount('');
                setAdvanceNotes('');
                await fetchTreatmentPlan();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                setFeedback({ type: 'error', message: err.message || 'Failed to record advance payment.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Network error recording payment.' });
        } finally {
            setSavingPayment(false);
            setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
        }
    };

    const handleCancelItem = async () => {
        if (!cancelModalItem) return;
        setCancellingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${cancelModalItem.treatmentItemID}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: doctorId,
                    reason: cancelReason || 'Cancelled by clinician'
                })
            });

            if (res.ok) {
                setFeedback({ type: 'success', message: 'Treatment procedure cancelled.' });
                setCancelModalItem(null);
                setCancelReason('');
                await fetchTreatmentPlan();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const err = await res.json().catch(() => ({}));
                setFeedback({ type: 'error', message: err.message || 'Failed to cancel treatment.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Network error cancelling item.' });
        } finally {
            setCancellingItem(false);
            setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
        }
    };

    // Render an item row
    const renderItemRow = (item, isTodaySection = false) => {
        const remainingToPayForItem = Math.max(0, item.fee - (item.advancePaidAmount || 0));
        const toothLabel = TOOTH_NAMES[item.toothNumber] || `Tooth #${item.toothNumber}`;
        const isBusy = actionLoading[item.treatmentItemID];

        return (
            <div 
                key={item.treatmentItemID} 
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    item.status === 'in_progress'
                        ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
            >
                {/* Left: Tooth Badge + Details */}
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black flex-shrink-0 shadow-2xs ${
                        item.status === 'in_progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-500 text-white'
                    }`}>
                        <span className="text-[10px] tracking-widest uppercase opacity-80 leading-none">TOOTH</span>
                        <span className="text-base font-extrabold leading-tight">{item.toothKey || item.toothNumber}</span>
                    </div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-dark-slate">{item.procedureName}</h4>
                            <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {item.procedureCode}
                            </span>
                            {item.status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                                    In Progress
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Planned
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-muted-text">
                            {toothLabel} • Snapshot Fee: <strong className="text-dark-slate">{formatMoney(item.fee)}</strong>
                        </p>

                        {item.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                Note: {item.notes}
                            </p>
                        )}
                    </div>
                </div>

                {/* Center / Financial Snapshot */}
                <div className="flex items-center gap-6 sm:px-4">
                    <div className="space-y-0.5 text-left md:text-right">
                        <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Advance Paid</p>
                        <p className={`text-xs font-black ${item.advancePaidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {formatMoney(item.advancePaidAmount)}
                        </p>
                    </div>

                    <div className="space-y-0.5 text-left md:text-right">
                        <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Remaining</p>
                        <p className="text-xs font-black text-dark-slate">
                            {formatMoney(remainingToPayForItem)}
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                    {item.status === 'planned' && (
                        <button
                            type="button"
                            onClick={() => handleStart(item.treatmentItemID)}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#4A7CD2] hover:bg-[#3665B7] text-white shadow-xs transition-colors cursor-pointer"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start</span>
                        </button>
                    )}

                    {item.status === 'in_progress' && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentModalItem(item);
                                    setAdvanceAmount('');
                                }}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                                title="Collect advance payment against this procedure"
                            >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Add Advance</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleComplete(item.treatmentItemID)}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Complete</span>
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setCancelModalItem(item);
                            setCancelReason('');
                        }}
                        disabled={isBusy}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Cancel this treatment item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
            {/* Feedback Alert Toast */}
            {feedback.message && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-fade-in ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
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

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Total Planned Care
                    </p>
                    <p className="text-2xl font-black text-dark-slate">{formatMoney(totalPlannedFee)}</p>
                    <p className="text-[11px] text-muted-text mt-1">{treatmentItems.length} active dental procedures in plan</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Total Advance Collected
                    </p>
                    <p className="text-2xl font-black text-emerald-600">{formatMoney(totalAdvanceReceived)}</p>
                    <p className="text-[11px] text-muted-text mt-1">Paid in advance against in-progress items</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        Net Billable on Completion
                    </p>
                    <p className="text-2xl font-black text-dark-slate">{formatMoney(remainingToCollect)}</p>
                    <p className="text-[11px] text-muted-text mt-1">Balance to be invoiced by receptionist</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-text space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#4A7CD2]" />
                    <p className="text-xs font-bold">Loading active patient treatment plan...</p>
                </div>
            ) : treatmentItems.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-dark-slate">No Active Treatments in Plan</h3>
                        <p className="text-xs text-muted-text max-w-md mx-auto">
                            Switch to the <strong>Dental Chart</strong> tab and save tooth observations (e.g., caries, root canals, or crowns). Each observation automatically creates a planned treatment item here!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* SECTION 1: TODAY'S VISIT & IN-PROGRESS */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                                <h3 className="text-sm font-black text-dark-slate uppercase tracking-wider">
                                    Today's Operatory & In-Progress ({todayItems.length})
                                </h3>
                            </div>
                            <span className="text-[11px] text-muted-text">
                                Chairside interventions for today's appointment
                            </span>
                        </div>

                        {todayItems.length === 0 ? (
                            <div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-muted-text">
                                No procedures are currently marked In Progress for today. Start a procedure below to begin.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {todayItems.map(item => renderItemRow(item, true))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: UPCOMING PLANNED PROCEDURES */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <h3 className="text-sm font-black text-dark-slate uppercase tracking-wider">
                                    Upcoming Treatment Plan ({upcomingItems.length})
                                </h3>
                            </div>
                            <span className="text-[11px] text-muted-text">
                                Planned future care scheduled across appointments
                            </span>
                        </div>

                        {upcomingItems.length === 0 ? (
                            <div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-muted-text">
                                All planned procedures are currently in progress or completed.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {upcomingItems.map(item => renderItemRow(item, false))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: ADD ADVANCE PAYMENT */}
            {paymentModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-dark-slate">Collect Advance Payment</h3>
                                    <p className="text-[11px] text-muted-text">Tooth #{paymentModalItem.toothKey || paymentModalItem.toothNumber} • {paymentModalItem.procedureName}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPaymentModalItem(null)} 
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordAdvancePayment} className="space-y-4">
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-text">Procedure Fee:</span>
                                    <strong className="text-dark-slate">{formatMoney(paymentModalItem.fee)}</strong>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-text">Existing Advance Paid:</span>
                                    <strong className="text-emerald-600">{formatMoney(paymentModalItem.advancePaidAmount)}</strong>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                    <span className="font-bold text-dark-slate">Max Advance Allowed:</span>
                                    <strong className="text-blue-600">{formatMoney(paymentModalItem.fee - (paymentModalItem.advancePaidAmount || 0))}</strong>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate">Advance Amount (Rs):</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={paymentModalItem.fee - (paymentModalItem.advancePaidAmount || 0)}
                                    value={advanceAmount}
                                    onChange={(e) => setAdvanceAmount(e.target.value)}
                                    placeholder="Enter advance payment amount"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4A7CD2] text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate">Payment Method:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cash', 'card', 'online'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setAdvanceMethod(m)}
                                            className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                                                advanceMethod === m 
                                                    ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-2xs' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark-slate">Clinical / Payment Note (Optional):</label>
                                <input
                                    type="text"
                                    value={advanceNotes}
                                    onChange={(e) => setAdvanceNotes(e.target.value)}
                                    placeholder="e.g. Deposit for root canal session 1"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4A7CD2]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModalItem(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPayment}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                >
                                    {savingPayment ? 'Saving...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CANCEL TREATMENT ITEM */}
            {cancelModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-dark-slate">Cancel Treatment</h3>
                                <p className="text-[11px] text-muted-text">Tooth #{cancelModalItem.toothKey || cancelModalItem.toothNumber} • {cancelModalItem.procedureName}</p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-text">
                            Are you sure you want to cancel this treatment procedure? This action will be recorded in the clinic audit log.
                        </p>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-dark-slate">Clinical Reason / Notes:</label>
                            <input
                                type="text"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="e.g. Patient deferred treatment"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-400"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCancelModalItem(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Keep Item
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelItem}
                                disabled={cancellingItem}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                                {cancellingItem ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

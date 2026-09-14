import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    DollarSign, 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Download, 
    Printer, 
    ArrowRight, 
    QrCode, 
    ChevronDown, 
    ChevronUp 
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';
import DualPaymentModal from '../components/DualPaymentModal';

export default function PatientBilling() {
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments'
    const [loading, setLoading] = useState(true);
    const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
    const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

    const fetchBillingData = async () => {
        setLoading(true);
        const token = patient.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Fetch Invoices
            try {
                let iRes;
                try { iRes = await fetch(`${API_BASE_URL}/api/billing/invoices`, { headers }); }
                catch { iRes = await fetch(`/api/billing/invoices`, { headers }); }
                if (iRes.ok) setInvoices(await iRes.json());
            } catch (e) { console.error('Invoices err:', e); }

            // Fetch Payments
            try {
                let pRes;
                try { pRes = await fetch(`${API_BASE_URL}/api/billing/payments`, { headers }); }
                catch { pRes = await fetch(`/api/billing/payments`, { headers }); }
                if (pRes.ok) setPayments(await pRes.json());
            } catch (e) { console.error('Payments err:', e); }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingData();
    }, []);

    const totalIncurred = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalBalance = invoices
        .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
        .reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

    const toggleExpand = (id) => {
        setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">Invoices & Financial Ledger</h2>
                    <p className="text-xs sm:text-sm text-muted-text">
                        Review your itemized treatment procedures, settle balances online, or generate in-clinic cash slips.
                    </p>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-5 border border-light-teal shadow-xs space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Total Incurred Treatments</p>
                    <p className="text-2xl font-serif font-black text-dark-slate">
                        ${totalIncurred.toFixed(2)} <span className="text-xs font-sans text-muted-text font-normal">NZD</span>
                    </p>
                    <p className="text-[11px] text-slate-500">{invoices.length} Invoices Issued</p>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-light-teal shadow-xs space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Total Settled Payments</p>
                    <p className="text-2xl font-serif font-black text-emerald-600">
                        ${totalPaid.toFixed(2)} <span className="text-xs font-sans text-muted-text font-normal">NZD</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold">{payments.length} Processed Transactions</p>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-light-teal shadow-xs space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Outstanding Due Balance</p>
                    <p className={`text-2xl font-serif font-black ${totalBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ${totalBalance.toFixed(2)} <span className="text-xs font-sans text-muted-text font-normal">NZD</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                        {totalBalance > 0 ? 'Action required to clear account' : 'Account in good standing'}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-light-teal pb-2">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'invoices'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Invoices Ledger</span>
                    <span className="w-5 h-5 rounded-full bg-light-teal text-primary-teal flex items-center justify-center text-[10px] font-mono font-bold">
                        {invoices.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'payments'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
                    }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Payment History & Receipts</span>
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono font-bold">
                        {payments.length}
                    </span>
                </button>
            </div>

            {/* Content Body */}
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-36 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-36 bg-white rounded-3xl border border-light-teal" />
                </div>
            ) : activeTab === 'invoices' ? (
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.map((inv) => {
                            const isPaid = inv.status === 'Paid';
                            const isPendingCash = inv.status === 'Pending Cash Settlement';
                            const isExpanded = expandedInvoiceId === inv.invoiceID;

                            return (
                                <div
                                    key={inv.invoiceID}
                                    className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal space-y-4 hover:shadow-md transition-shadow"
                                >
                                    {/* Top Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-teal/70 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center font-mono font-black text-xs shrink-0">
                                                INV
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-bold text-dark-slate">
                                                        Invoice #{inv.invoiceNumber}
                                                    </h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                        isPaid
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : isPendingCash
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-text mt-0.5">
                                                    Issued on {new Date(inv.issueDate).toLocaleDateString()} • Due by {new Date(inv.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Financial Summary & Actions */}
                                        <div className="flex items-center gap-4 sm:self-center justify-between sm:justify-end">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Balance Due</p>
                                                <p className={`text-lg font-serif font-black ${isPaid ? 'text-emerald-600' : 'text-dark-slate'}`}>
                                                    ${(inv.balanceAmount || (inv.totalAmount - inv.paidAmount)).toFixed(2)} NZD
                                                </p>
                                            </div>

                                            {!isPaid && (
                                                <button
                                                    onClick={() => setSelectedInvoiceForPay(inv)}
                                                    className="px-4 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm shadow-primary-teal/20 flex items-center gap-1.5"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    <span>Pay Balance</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Itemized Procedures Breakdown */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-dark-slate">Itemized Procedure Breakdown:</p>
                                            <button
                                                onClick={() => toggleExpand(inv.invoiceID)}
                                                className="text-xs text-primary-hover font-semibold hover:underline flex items-center gap-1"
                                            >
                                                <span>{isExpanded ? 'Hide Lines' : 'Show Breakdown'}</span>
                                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>

                                        {isExpanded && inv.items && inv.items.length > 0 && (
                                            <div className="rounded-2xl border border-light-teal overflow-hidden animate-fadeIn">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-light-teal/50 text-muted-text text-[10px] uppercase font-bold">
                                                        <tr>
                                                            <th className="p-3">Code</th>
                                                            <th className="p-3">Procedure Description</th>
                                                            <th className="p-3">Tooth</th>
                                                            <th className="p-3 text-right">Fee</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-light-teal/60 font-medium text-dark-slate">
                                                        {inv.items.map((it, idx) => (
                                                            <tr key={it.invoiceItemID || idx}>
                                                                <td className="p-3 font-mono text-[11px] text-muted-text">{it.procedureCode || 'ADA'}</td>
                                                                <td className="p-3 font-semibold">{it.description}</td>
                                                                <td className="p-3 text-muted-text">{it.toothNumber ? `#${it.toothNumber}` : '—'}</td>
                                                                <td className="p-3 text-right font-mono font-bold">${it.totalPrice?.toFixed(2) || it.unitPrice?.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {inv.notes && (
                                        <p className="text-xs text-muted-text italic bg-warm-cream/40 p-3 rounded-xl">
                                            Note: {inv.notes}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-16 text-center bg-white rounded-3xl border border-light-teal p-8 space-y-3">
                            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-base font-serif font-black text-dark-slate">No invoices found</h3>
                            <p className="text-xs text-muted-text max-w-sm mx-auto">
                                Itemized bills for completed treatments will appear here automatically.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* PAYMENTS HISTORY TAB */
                <div className="space-y-4">
                    {payments.length > 0 ? (
                        <div className="bg-white rounded-3xl divide-y divide-light-teal/70 border border-light-teal overflow-hidden shadow-xs">
                            {payments.map((p) => (
                                <div key={p.paymentID} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-warm-cream/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-dark-slate">
                                                    Receipt #{p.paymentReceiptNo}
                                                </h4>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-light-teal text-primary-teal">
                                                    {p.paymentMethod.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-text">
                                                Paid on {new Date(p.paymentDate).toLocaleDateString()} at {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {p.notes && <p className="text-[11px] text-slate-500">{p.notes}</p>}
                                        </div>
                                    </div>

                                    <div className="text-right flex items-center gap-3 sm:self-center justify-between sm:justify-end">
                                        <div>
                                            <p className="text-base font-mono font-extrabold text-emerald-600">
                                                +${p.amount.toFixed(2)} NZD
                                            </p>
                                            <p className="text-[10px] text-muted-text uppercase font-semibold">Settled</p>
                                        </div>

                                        <button
                                            onClick={() => window.print()}
                                            className="p-2 rounded-xl border border-light-teal hover:bg-light-teal/50 text-muted-text hover:text-dark-slate transition-colors"
                                            title="Print Official Receipt"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center bg-white rounded-3xl border border-light-teal p-8 space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-base font-serif font-black text-dark-slate">No payment receipts yet</h3>
                            <p className="text-xs text-muted-text max-w-sm mx-auto">
                                Settle an outstanding treatment invoice to generate and view receipts.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Payment Modal */}
            {selectedInvoiceForPay && (
                <DualPaymentModal
                    isOpen={Boolean(selectedInvoiceForPay)}
                    invoice={selectedInvoiceForPay}
                    onClose={() => setSelectedInvoiceForPay(null)}
                    onPaymentSuccess={() => {
                        fetchBillingData();
                    }}
                />
            )}
        </div>
    );
}

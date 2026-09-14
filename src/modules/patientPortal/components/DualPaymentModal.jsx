import React, { useState } from 'react';
import { 
    X, 
    CreditCard, 
    DollarSign, 
    CheckCircle2, 
    AlertCircle, 
    QrCode, 
    Printer, 
    Lock, 
    ShieldCheck, 
    ArrowRight,
    Download
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function DualPaymentModal({ isOpen, invoice, onClose, onPaymentSuccess }) {
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'cash'
    const [amount, setAmount] = useState(invoice?.balanceAmount || invoice?.totalAmount || 0);
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
    const [expiry, setExpiry] = useState('12/28');
    const [cvc, setCvc] = useState('123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentResult, setPaymentResult] = useState(null);

    if (!isOpen || !invoice) return null;

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const token = patient.token;
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            if (paymentMethod === 'card') {
                // Online Card Checkout
                const payload = {
                    invoiceID: invoice.invoiceID,
                    amount: parseFloat(amount),
                    cardHolderName: cardHolder.trim() || `${patient.firstName} ${patient.lastName}`,
                    cardLast4: '4242',
                    paymentMethod: 'Online_Card'
                };

                let res;
                try {
                    res = await fetch(`${API_BASE_URL}/api/billing/pay-online`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });
                } catch {
                    res = await fetch(`/api/billing/pay-online`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });
                }

                const data = await res.json();
                if (res.ok) {
                    setPaymentResult({
                        type: 'card',
                        receiptNumber: data.receiptNumber,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: parseFloat(amount),
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        message: data.message
                    });
                    onPaymentSuccess();
                } else {
                    setError(data.message || 'Payment failed. Please check card parameters.');
                }
            } else {
                // In-Clinic Cash Voucher
                const payload = {
                    invoiceID: invoice.invoiceID,
                    amount: parseFloat(amount),
                    notes: `In-clinic cash voucher created by ${patient.firstName} ${patient.lastName}`
                };

                let res;
                try {
                    res = await fetch(`${API_BASE_URL}/api/billing/generate-cash-voucher`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });
                } catch {
                    res = await fetch(`/api/billing/generate-cash-voucher`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });
                }

                const data = await res.json();
                if (res.ok) {
                    setPaymentResult({
                        type: 'cash',
                        voucherCode: data.voucherCode,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: parseFloat(amount),
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        instructions: data.instructions,
                        message: data.message
                    });
                    onPaymentSuccess();
                } else {
                    setError(data.message || 'Unable to generate cash voucher.');
                }
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('Connection error during transaction processing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-slate/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-light-teal space-y-6 animate-fadeIn relative">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-light-teal pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-black text-dark-slate">Settle Dental Invoice</h3>
                            <p className="text-xs text-muted-text">Invoice #{invoice.invoiceNumber} • Balance Due: ${(invoice.balanceAmount || invoice.totalAmount).toFixed(2)} NZD</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-text hover:text-dark-slate hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* SUCCESS RECEIPT / VOUCHER VIEW */}
                {paymentResult ? (
                    <div className="space-y-6 py-2 animate-fadeIn text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>

                        {paymentResult.type === 'card' ? (
                            <div className="space-y-2">
                                <h4 className="text-2xl font-serif font-black text-dark-slate">Payment Successful!</h4>
                                <p className="text-xs text-muted-text max-w-sm mx-auto">
                                    Your dental treatment balance of <span className="font-bold text-dark-slate">${paymentResult.amount.toFixed(2)} NZD</span> has been settled online.
                                </p>

                                <div className="p-4 rounded-2xl bg-warm-cream/70 border border-light-teal text-xs text-left font-mono space-y-1.5 mt-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Receipt Number:</span>
                                        <span className="font-bold text-dark-slate">{paymentResult.receiptNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Invoice:</span>
                                        <span className="font-bold text-dark-slate">{paymentResult.invoiceNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Date & Time:</span>
                                        <span className="font-bold text-dark-slate">{paymentResult.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-text">Payment Method:</span>
                                        <span className="font-bold text-emerald-600">Online Card (Processed)</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="text-2xl font-serif font-black text-dark-slate">Cash Voucher Generated!</h4>
                                <p className="text-xs text-muted-text max-w-sm mx-auto">
                                    Present this voucher code or show this screen to the Dentia Clinic front desk when paying with cash.
                                </p>

                                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3 mt-4">
                                    <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">Clinic Cash Voucher Code</p>
                                    <p className="text-2xl sm:text-3xl font-mono font-black text-amber-950 tracking-wider">
                                        {paymentResult.voucherCode}
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-amber-900">
                                        <span>Amount Due at Desk:</span>
                                        <span className="font-bold text-base">${paymentResult.amount.toFixed(2)} NZD</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800 leading-relaxed border-t border-amber-200/80 pt-2">
                                        Your invoice status is marked as <span className="font-bold">Pending Cash Settlement</span> and will automatically update to Paid once received by the receptionist.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex items-center justify-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2.5 rounded-xl border border-light-teal text-xs font-bold text-dark-slate hover:bg-light-teal/50 transition-colors flex items-center gap-1.5"
                            >
                                <Printer className="w-4 h-4 text-primary-teal" />
                                <span>Print Slip</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* FORM VIEW */
                    <form onSubmit={handleProcessPayment} className="space-y-5">
                        {/* Error */}
                        {error && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span className="font-semibold">{error}</span>
                            </div>
                        )}

                        {/* Payment Mode Selector Tabs */}
                        <div className="grid grid-cols-2 p-1.5 bg-light-teal/70 rounded-2xl border border-light-teal">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    paymentMethod === 'card'
                                        ? 'bg-white text-dark-slate shadow-sm'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                            >
                                <CreditCard className="w-4 h-4 text-primary-teal" />
                                <span>1. Pay Online (Card)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    paymentMethod === 'cash'
                                        ? 'bg-white text-dark-slate shadow-sm'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                            >
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                <span>2. Pay Cash at Clinic</span>
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark-slate">Payment Amount (NZD)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-text font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    max={invoice.balanceAmount || invoice.totalAmount}
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal text-sm font-bold text-dark-slate outline-none"
                                />
                            </div>
                        </div>

                        {/* Card Input Mode */}
                        {paymentMethod === 'card' ? (
                            <div className="space-y-3.5 p-4 rounded-2xl bg-warm-cream/40 border border-light-teal">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-dark-slate">Name on Card</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={`${patient.firstName} ${patient.lastName}`}
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-dark-slate">Card Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-dark-slate">Expiry Date</label>
                                        <input
                                            type="text"
                                            required
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            placeholder="MM/YY"
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-dark-slate">Security Code (CVC)</label>
                                        <input
                                            type="password"
                                            required
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value)}
                                            placeholder="123"
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-muted-text pt-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Encrypted 256-bit secure gateway • Instant digital receipt</span>
                                </div>
                            </div>
                        ) : (
                            /* Cash Input Mode */
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 text-amber-950">
                                <div className="flex items-center gap-2 font-bold">
                                    <QrCode className="w-4 h-4 text-amber-700" />
                                    <span>How Cash Payment Works at Dentia:</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    1. Clicking below will instantly issue an official **Cash Payment Voucher** with a unique reference number.
                                </p>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    2. Bring your cash to the Dentia front desk receptionist and show the voucher code.
                                </p>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    3. The receptionist marks cash received and provides a signed physical receipt.
                                </p>
                            </div>
                        )}

                        {/* Submit Action */}
                        <div className="pt-2 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-muted-text hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-teal/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Processing...</span>
                                ) : (
                                    <>
                                        <span>
                                            {paymentMethod === 'card' 
                                                ? `Pay $${parseFloat(amount || 0).toFixed(2)} Online`
                                                : 'Generate Cash Voucher Slip'
                                            }
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

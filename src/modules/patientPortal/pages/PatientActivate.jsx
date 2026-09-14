import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Hash, Calendar, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientActivate() {
    const location = useLocation();
    const navigate = useNavigate();

    const [referenceNumber, setReferenceNumber] = useState('');
    const [dob, setDob] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const refParam = params.get('ref');
        if (refParam) setReferenceNumber(refParam);
    }, [location]);

    const handleActivate = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please verify your entries.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters in length.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                referenceNumber: referenceNumber.trim(),
                dob: dob,
                newPassword: newPassword
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-auth/activate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/patient-auth/activate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('patient', JSON.stringify(data));
                navigate('/portal/dashboard', { replace: true });
            } else {
                setError(data.message || 'Verification failed. Please ensure Reference Number and Date of Birth match clinic records.');
            }
        } catch (err) {
            console.error('Activation error:', err);
            setError('Connection error: Unable to reach portal server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-warm-cream flex flex-col justify-center items-center p-4 sm:p-8 font-sans">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-light-teal space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <Link to="/portal/login" className="inline-flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-primary-teal flex items-center justify-center text-white shadow-xs">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-serif font-black text-xl text-dark-slate">DENTIA CLINIC</span>
                    </Link>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">
                        Activate Your Clinic Account
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-text max-w-md mx-auto">
                        If you visited our clinic or scheduled an appointment, enter your Patient Reference Number and Date of Birth to set up your password.
                    </p>
                </div>

                {/* Helper info pill */}
                <div className="p-3.5 rounded-2xl bg-light-teal/60 border border-light-teal text-xs text-dark-slate flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Where do I find my Reference Number?</p>
                        <p className="text-muted-text text-[11px]">
                            Check your printed appointment slip, clinic receipt card, or the SMS reminder sent to your phone (format: <code className="font-bold text-primary-hover">DEN-2026-XXXXX</code>).
                        </p>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleActivate} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-dark-slate">Patient Reference Number *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                <Hash className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                required
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="e.g. DEN-2026-00035"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-mono font-bold text-dark-slate uppercase outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-dark-slate">Date of Birth (Security Verification) *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <input
                                type="date"
                                required
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Choose New Password *</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Confirm Password *</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-type password"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-sm font-extrabold transition-all shadow-md shadow-primary-teal/20 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <span>Verifying & activating...</span>
                        ) : (
                            <>
                                <span>Activate Account & Log In</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2 text-xs text-muted-text">
                    Already activated your portal account?{' '}
                    <Link to="/portal/login" className="font-bold text-primary-teal hover:underline">
                        Sign In with Password
                    </Link>
                </div>
            </div>
        </div>
    );
}

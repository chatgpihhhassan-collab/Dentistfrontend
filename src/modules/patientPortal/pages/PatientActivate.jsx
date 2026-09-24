import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Hash, Calendar, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, Clock } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientActivate() {
    const location = useLocation();
    const navigate = useNavigate();

    const [mode, setMode] = useState('activate'); // 'activate' | 'reset'
    const [referenceNumber, setReferenceNumber] = useState('');
    const [dob, setDob] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Anti-Brute Force Protection
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const refParam = params.get('ref');
        const modeParam = params.get('mode');

        if (refParam) setReferenceNumber(refParam);
        if (modeParam === 'reset' || location.pathname.includes('reset-password')) {
            setMode('reset');
        } else {
            setMode('activate');
        }
    }, [location]);

    // Lockout countdown timer
    useEffect(() => {
        if (lockoutSeconds <= 0) return;
        const timer = setInterval(() => {
            setLockoutSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setFailedAttempts(0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutSeconds]);

    const handleActivateOrReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (lockoutSeconds > 0) {
            setError(`Security Lockout: Too many failed verification attempts. Please wait ${lockoutSeconds} seconds.`);
            return;
        }

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
                setSuccessMessage(
                    mode === 'reset'
                        ? '✅ Password reset successfully! Redirecting to your patient dashboard...'
                        : '✅ Account activated successfully! Logging you in...'
                );
                localStorage.setItem('patient', JSON.stringify(data));
                setTimeout(() => {
                    navigate('/portal/dashboard', { replace: true });
                }, 1500);
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                if (newAttempts >= 5) {
                    setLockoutSeconds(60);
                    setError('⚠️ Security Alert: 5 incorrect verification attempts. Account recovery locked for 60 seconds to prevent unauthorized access.');
                } else {
                    setError(
                        data.message || 
                        `Verification failed. Date of Birth does not match clinic records for Reference Number ${referenceNumber.trim()}. (${5 - newAttempts} attempts remaining)`
                    );
                }
            }
        } catch (err) {
            console.error('Activation/Reset error:', err);
            setError('Connection error: Unable to reach portal server. Please try again.');
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

                    {/* Mode Selector Tabs (Activate vs Reset) */}
                    <div className="pt-2">
                        <div className="inline-grid grid-cols-2 p-1.5 bg-light-teal/70 rounded-2xl border border-light-teal w-full max-w-xs mx-auto">
                            <button
                                type="button"
                                onClick={() => { setMode('reset'); setError(''); setSuccessMessage(''); }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    mode === 'reset'
                                        ? 'bg-white text-dark-slate shadow-sm'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                            >
                                <KeyRound className="w-3.5 h-3.5 text-primary-teal" />
                                <span>Reset Password</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('activate'); setError(''); setSuccessMessage(''); }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    mode === 'activate'
                                        ? 'bg-white text-dark-slate shadow-sm'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                                <span>Activate Account</span>
                            </button>
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate pt-1">
                        {mode === 'reset' ? 'Reset Portal Password' : 'Activate Clinic Account'}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-text max-w-md mx-auto">
                        {mode === 'reset'
                            ? 'Already registered? Enter your Patient Reference Number and Date of Birth to securely reset your password.'
                            : 'If you visited our clinic or scheduled an appointment, enter your Patient Reference Number and Date of Birth to set up your password.'}
                    </p>
                </div>

                {/* Healthcare Multi-Factor Security Badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-dark-slate flex items-start gap-3 shadow-2xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span>Protected by 2-Factor Healthcare PII Verification</span>
                        </p>
                        <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                            To prevent unauthorized password changes, your request is authenticated against both your 
                            <strong className="text-emerald-950"> Reference Number</strong> and your verified 
                            <strong className="text-emerald-950"> Date of Birth</strong> on file.
                        </p>
                    </div>
                </div>

                {/* Helper info pill */}
                <div className="p-3 rounded-xl bg-light-teal/40 border border-light-teal/70 text-xs text-dark-slate flex items-start gap-2.5">
                    <Hash className="w-4 h-4 text-primary-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-[11.5px]">Where do I find my Reference Number?</p>
                        <p className="text-muted-text text-[11px]">
                            Found on your clinic appointment slip, treatment invoice, or SMS reminder (format: <code className="font-bold text-primary-hover">DEN-2026-XXXXX</code>).
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

                {/* Success Banner */}
                {successMessage && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">{successMessage}</span>
                    </div>
                )}

                {/* Lockout Warning */}
                {lockoutSeconds > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                        <span>Security cooldown active. You can retry in <strong>{lockoutSeconds}s</strong>.</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleActivateOrReset} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-dark-slate flex items-center justify-between">
                            <span>Patient Reference Number *</span>
                            <span className="text-[10px] text-muted-text font-normal">e.g. DEN-2026-00040</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                <Hash className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                required
                                disabled={lockoutSeconds > 0 || loading}
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="e.g. DEN-2026-00040"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-mono font-bold text-dark-slate uppercase outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-dark-slate flex items-center justify-between">
                            <span>Date of Birth (Security Verification) *</span>
                            <span className="text-[10px] text-primary-teal font-semibold">Matches Clinic File</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <input
                                type="date"
                                required
                                disabled={lockoutSeconds > 0 || loading}
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Choose New Password *</label>
                            <input
                                type="password"
                                required
                                disabled={lockoutSeconds > 0 || loading}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Confirm Password *</label>
                            <input
                                type="password"
                                required
                                disabled={lockoutSeconds > 0 || loading}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-type password"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || lockoutSeconds > 0}
                        className="w-full py-3.5 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-sm font-extrabold transition-all shadow-md shadow-primary-teal/20 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2 cursor-pointer"
                    >
                        {loading ? (
                            <span>Verifying &amp; updating...</span>
                        ) : (
                            <>
                                <span>{mode === 'reset' ? 'Verify & Reset Password' : 'Activate Account & Log In'}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2 text-xs text-muted-text space-y-2">
                    <div>
                        Remember your password?{' '}
                        <Link to="/portal/login" className="font-bold text-primary-teal hover:underline">
                            Sign In with Password
                        </Link>
                    </div>
                    <div>
                        New patient with no clinic visits yet?{' '}
                        <Link to="/portal/register" className="font-bold text-primary-hover hover:underline">
                            Register an account online
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

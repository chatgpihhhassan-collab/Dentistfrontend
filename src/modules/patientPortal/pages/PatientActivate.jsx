import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    Sparkles, Hash, Calendar, Lock, ArrowRight, AlertCircle, 
    CheckCircle2, ShieldCheck, KeyRound, Eye, EyeOff, User, 
    Stethoscope, Clock, ShieldAlert, FileText
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientActivate() {
    const location = useLocation();
    const navigate = useNavigate();

    const [mode, setMode] = useState('activate'); // 'activate' | 'reset'
    const [referenceNumber, setReferenceNumber] = useState('');
    const [dob, setDob] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            setError(`Security Lockout: Too many failed attempts. Please wait ${lockoutSeconds} seconds.`);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please re-enter.');
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
                        ? '✅ Password updated successfully! Redirecting to portal...'
                        : '✅ Account activated successfully! Logging you in...'
                );
                localStorage.setItem('patient', JSON.stringify(data));
                setTimeout(() => {
                    navigate('/portal/dashboard', { replace: true });
                }, 1400);
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                if (newAttempts >= 5) {
                    setLockoutSeconds(60);
                    setError('⚠️ Security Alert: 5 incorrect verification attempts. Account locked for 60 seconds.');
                } else {
                    setError(
                        data.message || 
                        `Verification failed: Date of Birth does not match clinic records for Reference Number ${referenceNumber.trim()}. (${5 - newAttempts} attempts remaining)`
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
        <div className="min-h-screen bg-warm-cream flex font-sans">
            {/* ========================================================================= */}
            {/* LEFT COLUMN: BRAND HERO & CLINICAL SECURITY SHOWCASE                      */}
            {/* ========================================================================= */}
            {/* ========================================================================= */}
            {/* LEFT COLUMN: BRAND HERO & CLINICAL SECURITY SHOWCASE                      */}
            {/* ========================================================================= */}
            <div 
                className="hidden lg:flex w-[50%] relative flex-col justify-between p-12 overflow-hidden border-r border-light-teal bg-cover bg-center transition-all duration-700"
                style={{ 
                    backgroundImage: `url('${mode === 'reset' ? '/reset_password_bg.jpg' : '/activate_account_bg.jpg'}')` 
                }}
            >
                {/* Gradient Contrast Overlay */}
                <div className={`absolute inset-0 transition-opacity duration-700 ${
                    mode === 'reset' 
                        ? 'bg-gradient-to-b from-dark-slate/85 via-slate-900/70 to-dark-slate/90' 
                        : 'bg-gradient-to-b from-dark-slate/80 via-dark-slate/60 to-dark-slate/90'
                }`} />

                {/* Brand Header */}
                <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-light-teal" />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif font-black tracking-wide text-white">
                            DENTIA <span className="font-sans font-light text-white/80">PATIENT PORTAL</span>
                        </h1>
                        <p className="text-[11px] font-medium tracking-widest text-light-teal uppercase">
                            {mode === 'reset' ? 'Security Recovery & Access Control' : 'Patient Health Hub & Digital Records'}
                        </p>
                    </div>
                </div>

                {/* Hero Description & Security Value Props */}
                <div className="relative z-10 max-w-lg space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Protected by 2-Factor Healthcare PII Verification</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-white leading-tight shadow-sm">
                        {mode === 'reset'
                            ? 'Recover & Update Your Dental Portal Access.'
                            : 'Activate Your Personal Dental Health Portal.'}
                    </h2>

                    <p className="text-white/85 font-medium text-sm leading-relaxed">
                        {mode === 'reset'
                            ? 'Establish a new password using your clinic-issued Reference Number and registered Date of Birth. All cryptographic security tokens are verified against your official clinic file.'
                            : 'Welcome to your clinic self-service portal. Enter your clinic Reference Number and Date of Birth to complete first-time registration and set your secure password.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 text-xs font-medium text-white/90">
                        {mode === 'reset' ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                                    <span>256-Bit PII Security</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                                    <span>Instant Token Recovery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                                    <span>Full Audit-Log Verification</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                                    <span>Automatic Dashboard Login</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal shrink-0" />
                                    <span>Chairside Consultation Notes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal shrink-0" />
                                    <span>Digital Radiographs & X-Rays</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal shrink-0" />
                                    <span>Interactive 32-Tooth Chart</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal shrink-0" />
                                    <span>Online Appointment Scheduling</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Badges */}
                <div className="relative z-10 flex items-center justify-between text-xs text-white/60 font-medium">
                    <span>© 2026 Dentia Clinical Systems</span>
                    <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-light-teal" />
                        <span>256-Bit PII Encrypted</span>
                    </span>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: MODERN SLEEK FORM                                           */}
            {/* ========================================================================= */}
            <div className="w-full lg:w-[50%] flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
                <div className="w-full max-w-md space-y-6">

                    {/* Mobile Brand Header */}
                    <div className="lg:hidden flex items-center space-x-2.5 pb-2">
                        <div className="w-9 h-9 rounded-xl bg-primary-teal flex items-center justify-center text-white shadow-xs">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-serif font-black text-lg text-dark-slate">DENTIA PATIENT PORTAL</span>
                        </div>
                    </div>

                    {/* Mode Segmented Switcher Tabs */}
                    <div className="p-1 bg-slate-100 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                type="button"
                                onClick={() => { setMode('activate'); setError(''); setSuccessMessage(''); }}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    mode === 'activate'
                                        ? 'bg-white text-dark-slate shadow-xs border border-slate-200/80'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                            >
                                <Sparkles className={`w-3.5 h-3.5 ${mode === 'activate' ? 'text-primary-teal' : 'text-slate-400'}`} />
                                <span>Activate Account</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => { setMode('reset'); setError(''); setSuccessMessage(''); }}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    mode === 'reset'
                                        ? 'bg-white text-dark-slate shadow-xs border border-slate-200/80'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                            >
                                <KeyRound className={`w-3.5 h-3.5 ${mode === 'reset' ? 'text-primary-teal' : 'text-slate-400'}`} />
                                <span>Reset Password</span>
                            </button>
                        </div>
                    </div>

                    {/* Form Title */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                            {mode === 'reset' ? 'Reset Portal Password' : 'Activate Clinic Account'}
                        </h2>
                        <p className="text-xs text-muted-text font-medium mt-1">
                            {mode === 'reset'
                                ? 'Verify your Reference Number and Date of Birth to create a new password.'
                                : 'Enter your Reference Number and Date of Birth to set up your password.'}
                        </p>
                    </div>

                    {/* Security Alert / Lockout Banner */}
                    {lockoutSeconds > 0 && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center gap-3 animate-fadeIn">
                            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <p className="font-bold">Security Lockout Active</p>
                                <p className="text-[11px] text-amber-800">
                                    Too many incorrect attempts. Please wait <strong>{lockoutSeconds}s</strong> before retrying.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 animate-fadeIn">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="font-semibold leading-relaxed">{error}</span>
                        </div>
                    )}

                    {/* Success Banner */}
                    {successMessage && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-fadeIn">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold">{successMessage}</span>
                        </div>
                    )}

                    {/* Clean Form */}
                    <form onSubmit={handleActivateOrReset} className="space-y-4">
                        {/* Reference Number Field */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-dark-slate">
                                    Patient Reference Number *
                                </label>
                                <span className="text-[10px] text-muted-text font-medium">e.g. DEN-2026-00040</span>
                            </div>
                            <div className="relative">
                                <Hash className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                                    placeholder="DEN-2026-XXXXX"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-mono font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all uppercase"
                                />
                            </div>
                        </div>

                        {/* Date of Birth Field */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-dark-slate">
                                    Date of Birth (Security Verification) *
                                </label>
                                <span className="text-[10px] text-muted-text font-medium">Matches clinic file</span>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-xs font-bold text-dark-slate mb-1.5">
                                    New Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 6 chars"
                                        className="w-full pl-10 pr-10 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-dark-slate"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-dark-slate mb-1.5">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full pl-10 pr-10 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-dark-slate"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || lockoutSeconds > 0}
                                className="w-full py-3.5 px-4 bg-primary-teal hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <span>Verifying clinic records...</span>
                                ) : (
                                    <>
                                        <span>
                                            {mode === 'reset' ? 'Verify & Reset Password' : 'Activate Account & Log In'}
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Nav Links */}
                    <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-text gap-2">
                        <Link 
                            to="/portal/login" 
                            className="font-bold text-primary-teal hover:text-primary-hover flex items-center gap-1"
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Already have a password? Sign In</span>
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-slate-500 hover:text-dark-slate font-medium flex items-center gap-1"
                        >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Doctor Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

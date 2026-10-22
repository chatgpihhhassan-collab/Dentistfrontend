import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    KeyRound, 
    X, 
    User, 
    Mail, 
    Lock, 
    ShieldCheck, 
    Check, 
    AlertCircle, 
    Sparkles, 
    Eye, 
    EyeOff, 
    Loader2, 
    CheckCircle2, 
    ArrowRight,
    Phone
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export default function DoctorForgotPasswordModal({ 
    isOpen, 
    onClose, 
    initialUsername = '', 
    onPasswordResetSuccess 
}) {
    const [step, setStep] = useState(1); // 1 = Verify, 2 = Set New Password, 3 = Success
    const [username, setUsername] = useState(initialUsername || '');
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [verifiedData, setVerifiedData] = useState(null); // { resetToken, doctorName, username, role }
    
    // Step 2 password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername(initialUsername || '');
            setEmailOrPhone('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setStep(1);
            setVerifiedData(null);
        }
    }, [isOpen, initialUsername]);

    // Handle ESC key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Policy Checklist
    const policy = {
        minLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword),
        matches: Boolean(newPassword && confirmPassword && newPassword === confirmPassword)
    };

    const isPasswordValid = 
        policy.minLength && 
        policy.hasUpper && 
        policy.hasLower && 
        policy.hasNumber && 
        policy.hasSpecial && 
        policy.matches;

    const getStrengthScore = () => {
        let score = 0;
        if (policy.minLength) score++;
        if (policy.hasUpper) score++;
        if (policy.hasLower) score++;
        if (policy.hasNumber) score++;
        if (policy.hasSpecial) score++;
        return score; // 0 to 5
    };

    // Auto-generate strong compliant password
    const handleGenerateStrong = () => {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghijkmnopqrstuvwxyz';
        const numbers = '23456789';
        const symbols = '!@#$%&*';
        const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
        const pass = `Dental#${rand(uppercase)}${rand(numbers)}${rand(symbols)}${rand(numbers)}${rand(lowercase)}`;
        setNewPassword(pass);
        setConfirmPassword(pass);
        setError('');
    };

    // Step 1: Submit Identity Verification
    const handleVerifyIdentity = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !emailOrPhone.trim()) {
            setError('Please enter both your Clinician Username and registered Email or Phone.');
            return;
        }

        setLoading(true);

        try {
            const endpoint = `${API_BASE_URL || ''}/api/auth/forgot-password/verify`;
            let res;
            try {
                res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        emailOrPhone: emailOrPhone.trim()
                    })
                });
            } catch {
                res = await fetch(`/api/auth/forgot-password/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        emailOrPhone: emailOrPhone.trim()
                    })
                });
            }

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setVerifiedData(data);
                setStep(2);
                setError('');
            } else {
                setError(data.message || 'Verification failed. Credentials do not match clinic records.');
            }
        } catch (err) {
            setError('Server connection error. Please verify your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Submit New Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!isPasswordValid) {
            setError('Please ensure your new password satisfies all policy rules and matches the confirmation.');
            return;
        }

        setLoading(true);

        try {
            const endpoint = `${API_BASE_URL || ''}/api/auth/forgot-password/reset`;
            let res;
            try {
                res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        resetToken: verifiedData?.resetToken,
                        newPassword: newPassword.trim()
                    })
                });
            } catch {
                res = await fetch(`/api/auth/forgot-password/reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        resetToken: verifiedData?.resetToken,
                        newPassword: newPassword.trim()
                    })
                });
            }

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setStep(3);
                setError('');
                if (typeof onPasswordResetSuccess === 'function') {
                    onPasswordResetSuccess(username);
                }
            } else {
                setError(data.message || 'Failed to reset password. The recovery session may have expired.');
            }
        } catch (err) {
            setError('Server connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/65 backdrop-blur-sm animate-fade-in p-3 sm:p-5 flex items-center justify-center">
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                {/* 🌟 Header */}
                <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#1e293b] to-[#0f766e] text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner shrink-0">
                            <KeyRound className="w-5 h-5 text-teal-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold tracking-tight">Clinician Account Recovery</h3>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                                    Step {step} of 2
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium">
                                {step === 1 && 'Verify your clinical identity to recover access'}
                                {step === 2 && 'Set a compliant strong password for your account'}
                                {step === 3 && 'Account recovery completed'}
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                        title="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 🌟 Body */}
                <div className="p-6 text-left">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-shake">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{error}</span>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        STEP 1: IDENTITY VERIFICATION
                    ═══════════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <form onSubmit={handleVerifyIdentity} className="space-y-4">
                            <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-2xl text-xs text-teal-900 flex items-start gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-primary-teal shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block font-bold">Clinical Security Verification</strong>
                                    <span className="text-[11px] text-teal-800">
                                        Enter your registered clinician username and either your email address or mobile number on file.
                                    </span>
                                </div>
                            </div>

                            {/* Username Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Clinician / Staff Username</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. admin, dr.smith, receptionist_amina"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs"
                                />
                            </div>

                            {/* Email or Phone Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Registered Email or Phone</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. bajwa.376@gmail.com or +92 334 5081202"
                                    value={emailOrPhone}
                                    onChange={(e) => { setEmailOrPhone(e.target.value); setError(''); }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs"
                                />
                                <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                                    * Receptionist note: Your supervising doctor can also reset your password directly from the clinic Staff Roster.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-primary-teal hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Verify Identity</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        STEP 2: SET NEW PASSWORD
                    ═══════════════════════════════════════════════════════════ */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* Verified User Pill */}
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="font-bold">{verifiedData?.doctorName || username}</div>
                                        <div className="text-[10px] text-emerald-700">Role: {verifiedData?.role || 'Clinician'} (@{username})</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                    Identity Verified
                                </span>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>New Secure Password</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateStrong}
                                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                                        title="Auto-generate a strong password satisfying all criteria"
                                    >
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span>Generate Strong</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter new strong password"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Strength Bar */}
                                {newPassword.length > 0 && (
                                    <div className="pt-1.5">
                                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                            <span className="text-slate-500 uppercase">Strength:</span>
                                            <span className={
                                                getStrengthScore() <= 2 ? 'text-rose-600' :
                                                getStrengthScore() <= 4 ? 'text-amber-600' : 'text-emerald-600'
                                            }>
                                                {getStrengthScore() <= 2 ? 'Weak' : getStrengthScore() <= 4 ? 'Moderate' : 'Very Strong'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1 h-1.5">
                                            {[1, 2, 3, 4, 5].map((step) => (
                                                <div
                                                    key={step}
                                                    className={`h-full rounded-full transition-all ${
                                                        step <= getStrengthScore()
                                                            ? getStrengthScore() <= 2
                                                                ? 'bg-rose-500'
                                                                : getStrengthScore() <= 4
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                            : 'bg-slate-200'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Confirm New Password</span>
                                    </label>
                                    {confirmPassword.length > 0 && (
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                            policy.matches 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {policy.matches ? '✓ Passwords Match' : '✕ Passwords Do Not Match'}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder="Re-enter new password to confirm"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
                                            confirmPassword.length > 0
                                                ? policy.matches
                                                    ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-200 focus:bg-white'
                                                    : 'border-rose-300 focus:ring-2 focus:ring-rose-200 focus:bg-white'
                                                : 'border-slate-200 focus:ring-2 focus:ring-primary-teal/20 focus:bg-white'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Security Policy Checklist */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-semibold space-y-1">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                                    Required Security Standards:
                                </span>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                    <div className={`flex items-center gap-1.5 ${policy.minLength ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${policy.minLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            {policy.minLength ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                        </div>
                                        <span>Min 8 characters</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasUpper ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${policy.hasUpper ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            {policy.hasUpper ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                        </div>
                                        <span>Uppercase (A-Z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasLower ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${policy.hasLower ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            {policy.hasLower ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                        </div>
                                        <span>Lowercase (a-z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasNumber ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${policy.hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            {policy.hasNumber ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                        </div>
                                        <span>Number (0-9)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasSpecial ? 'text-emerald-700' : 'text-slate-500'} col-span-2`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${policy.hasSpecial ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            {policy.hasSpecial ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                        </div>
                                        <span>Special symbol (!@#$%^&*...)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!isPasswordValid || loading}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                                        isPasswordValid && !loading
                                            ? 'bg-primary-teal hover:bg-primary-hover text-white shadow-teal-700/20'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Reset & Save Password</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        STEP 3: SUCCESS
                    ═══════════════════════════════════════════════════════════ */}
                    {step === 3 && (
                        <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-base font-extrabold text-slate-900">Password Reset Successful!</h4>
                                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                                    Your password for <strong>@{username}</strong> has been updated. You can now log into your clinical charts with your new credentials.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3 bg-primary-teal hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                Back to Sign In →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

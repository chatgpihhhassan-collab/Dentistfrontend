import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    KeyRound, 
    X, 
    User, 
    Lock, 
    ShieldCheck, 
    Check, 
    AlertCircle, 
    Sparkles, 
    Eye, 
    EyeOff, 
    Loader2, 
    CheckCircle2, 
    ArrowRight
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export default function DoctorForgotPasswordModal({ 
    isOpen, 
    onClose, 
    initialUsername = '', 
    onPasswordResetSuccess 
}) {
    const [username, setUsername] = useState(initialUsername || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setUsername(initialUsername || '');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setIsSuccess(false);
            setLoading(false);
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

    // Strict Password Policy Rules
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

    // Direct Password Reset Submission
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Please enter your clinician or staff username.');
            return;
        }

        if (!isPasswordValid) {
            setError('Please ensure your new password satisfies all policy rules and matches the confirmation.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                username: username.trim(),
                newPassword: newPassword.trim(),
                confirmPassword: confirmPassword.trim()
            };

            const endpoint = `${API_BASE_URL || ''}/api/auth/forgot-password/reset`;
            let res;
            try {
                res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/auth/forgot-password/reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setIsSuccess(true);
                setError('');
                if (typeof onPasswordResetSuccess === 'function') {
                    onPasswordResetSuccess(newPassword.trim(), username.trim());
                }
            } else {
                setError(data.message || 'Failed to update password. Please verify the clinician username is correct.');
            }
        } catch (err) {
            setError('Server connection error. Please verify your internet connection.');
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
                            <h3 className="text-base font-extrabold tracking-tight">Clinician Password Reset</h3>
                            <p className="text-xs text-slate-300 font-medium">
                                Enter your username and set a new compliant password
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
                <div className="p-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2.5 animate-shake">
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            <span className="leading-relaxed flex-1">{error}</span>
                        </div>
                    )}

                    {isSuccess ? (
                        /* Success View */
                        <div className="py-4 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                                <CheckCircle2 className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black text-dark-slate">Password Updated Successfully!</h4>
                                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                                    Your password for clinician account <strong className="text-dark-slate font-bold">@{username}</strong> has been updated. You can now log in to access patient charts.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full bg-primary-teal hover:bg-primary-hover text-white text-xs font-extrabold py-3.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>Back to Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Single-Step Password Reset Form */
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* 1. Clinician Username */}
                            <div className="space-y-1">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Clinician / Staff Username</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. ahmedjh or dr.smith"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                        className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs font-mono"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 pl-1">
                                    Enter your registered clinician username or staff username.
                                </p>
                            </div>

                            {/* 2. New Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>New Password</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateStrong}
                                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                                        title="Auto-generate a strong password satisfying all policy rules"
                                    >
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span>Generate Strong</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter new password"
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

                            {/* 3. Interactive Password Policy Checklist */}
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                                <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                                    Password Security Rules:
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                                    <div className={`flex items-center gap-1.5 ${policy.minLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                            policy.minLength ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>At least 8 characters</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                            policy.hasUpper ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Uppercase letter (A-Z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                            policy.hasLower ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Lowercase letter (a-z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                            policy.hasNumber ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Numeric digit (0-9)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 col-span-2 ${policy.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                            policy.hasSpecial ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Special character (!@#$%^&*...)</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Confirm Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>Confirm Password</span>
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
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs"
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

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-dark-slate hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !username.trim() || !isPasswordValid}
                                    className="bg-primary-teal hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Updating Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Update Password</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

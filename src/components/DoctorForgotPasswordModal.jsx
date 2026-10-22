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
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0A1A24]/70 backdrop-blur-md animate-fade-in p-4 flex items-center justify-center">
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

            {/* Modal Card - Synced with Dentia Theme 2 (#4A7CD2, #10244B, #EAF0FC) */}
            <div className="relative w-full max-w-[480px] bg-white rounded-[2rem] shadow-2xl border border-[#4A7CD2]/20 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                
                {/* Subtle Decorative Ambient Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#4A7CD2]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#3665B7]/10 rounded-full blur-3xl pointer-events-none" />

                {/* 🌟 Header - Clinical Branding */}
                <div className="pt-7 pb-4 px-7 border-b border-[#EAF0FC] relative bg-gradient-to-b from-[#F4F6FA]/80 to-white">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-[#EAF0FC] text-slate-400 hover:text-[#4A7CD2] flex items-center justify-center transition-all cursor-pointer"
                        title="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#EAF0FC] text-[#4A7CD2] border border-[#4A7CD2]/25 mb-2.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#4A7CD2]" />
                        <span>Clinician Workspace Access</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#10244B] tracking-tight">
                        Reset Clinician Password
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                        Enter your clinician username and set your new credentials to regain workspace access.
                    </p>
                </div>

                {/* 🌟 Body */}
                <div className="p-7">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-start gap-2.5 shadow-2xs">
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            <span className="leading-relaxed flex-1">{error}</span>
                        </div>
                    )}

                    {isSuccess ? (
                        /* Success View */
                        <div className="py-4 text-center space-y-4">
                            <div className="w-16 h-16 bg-[#EAF0FC] text-[#4A7CD2] rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#4A7CD2]/25">
                                <CheckCircle2 className="w-9 h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="text-lg font-bold text-[#10244B]">Password Updated Successfully!</h4>
                                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                                    Your password for clinician account <strong className="text-[#10244B] font-bold">@{username}</strong> has been saved. Your login form is pre-filled and ready.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-md shadow-[#4A7CD2]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>Sign in to Patient Charts</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Single-Step Password Reset Form - Styled Identically to Auth.jsx */
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* 1. Clinician Username */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#10244B]/80">
                                        Clinician / Staff Username
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-medium">e.g. dr.smith</span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter clinician username (e.g. ahmedjh)"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                        className="w-full pl-10 pr-4 py-3 bg-[#F4F6FA] focus:bg-white border border-[#EAF0FC] focus:border-[#4A7CD2] rounded-xl text-xs font-semibold text-[#10244B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/30 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            {/* 2. New Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#10244B]/80">
                                        New Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateStrong}
                                        className="text-[11px] font-bold text-[#4A7CD2] hover:text-[#3665B7] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                        title="Auto-generate a strong password satisfying all policy rules"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Generate Strong</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                        className="w-full pl-10 pr-10 py-3 bg-[#F4F6FA] focus:bg-white border border-[#EAF0FC] focus:border-[#4A7CD2] rounded-xl text-xs font-semibold text-[#10244B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/30 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#10244B] cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Dynamic Strength Bar */}
                                {newPassword.length > 0 && (
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                            <span className="text-slate-400 uppercase tracking-wider">Password Strength:</span>
                                            <span className={
                                                getStrengthScore() <= 2 ? 'text-rose-600' :
                                                getStrengthScore() <= 4 ? 'text-amber-600' : 'text-[#4A7CD2]'
                                            }>
                                                {getStrengthScore() <= 2 ? 'Weak' : getStrengthScore() <= 4 ? 'Moderate' : 'Very Strong (Protected)'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5 h-1.5">
                                            {[1, 2, 3, 4, 5].map((step) => (
                                                <div
                                                    key={step}
                                                    className={`h-full rounded-full transition-all ${
                                                        step <= getStrengthScore()
                                                            ? getStrengthScore() <= 2
                                                                ? 'bg-rose-500'
                                                                : getStrengthScore() <= 4
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-[#4A7CD2]'
                                                            : 'bg-slate-200'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Interactive Password Security Rules Checklist */}
                            <div className="p-3.5 bg-[#EAF0FC]/60 border border-[#4A7CD2]/20 rounded-2xl space-y-2">
                                <div className="text-[10px] font-bold uppercase text-[#4A7CD2] tracking-wider flex items-center justify-between">
                                    <span>Password Security Requirements</span>
                                    <span className="font-semibold text-slate-500">
                                        {getStrengthScore()} of 5 met
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[11px]">
                                    <div className={`flex items-center gap-1.5 ${policy.minLength ? 'text-[#10244B] font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                            policy.minLength ? 'bg-[#4A7CD2] text-white shadow-2xs' : 'bg-white text-slate-300 border border-slate-200'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>8+ characters</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasUpper ? 'text-[#10244B] font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                            policy.hasUpper ? 'bg-[#4A7CD2] text-white shadow-2xs' : 'bg-white text-slate-300 border border-slate-200'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Uppercase (A-Z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasLower ? 'text-[#10244B] font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                            policy.hasLower ? 'bg-[#4A7CD2] text-white shadow-2xs' : 'bg-white text-slate-300 border border-slate-200'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Lowercase (a-z)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${policy.hasNumber ? 'text-[#10244B] font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                            policy.hasNumber ? 'bg-[#4A7CD2] text-white shadow-2xs' : 'bg-white text-slate-300 border border-slate-200'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Numeric digit (0-9)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 col-span-2 ${policy.hasSpecial ? 'text-[#10244B] font-bold' : 'text-slate-500'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                            policy.hasSpecial ? 'bg-[#4A7CD2] text-white shadow-2xs' : 'bg-white text-slate-300 border border-slate-200'
                                        }`}>
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                        <span>Special character (!@#$%^&*...)</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Confirm Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-[#10244B]/80">
                                        Confirm Password
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
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        className="w-full pl-10 pr-10 py-3 bg-[#F4F6FA] focus:bg-white border border-[#EAF0FC] focus:border-[#4A7CD2] rounded-xl text-xs font-semibold text-[#10244B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/30 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#10244B] cursor-pointer"
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
                                    className="px-4 py-3 text-xs font-bold text-slate-600 hover:text-[#10244B] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !username.trim() || !isPasswordValid}
                                    className="flex-1 bg-[#4A7CD2] hover:bg-[#3665B7] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold py-3.5 px-5 rounded-xl shadow-md shadow-[#4A7CD2]/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Updating Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Update Password</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Security Footer Badge */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-[#4A7CD2] font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                <span>Encrypted Session · HIPAA & GDPR Clinical Security</span>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

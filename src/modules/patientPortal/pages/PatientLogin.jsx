import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Lock, Hash, Mail, ArrowRight, AlertCircle, CheckCircle2, UserCheck, KeyRound } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientLogin() {
    const [loginType, setLoginType] = useState('reference'); // 'reference' | 'email'
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [needsActivationRef, setNeedsActivationRef] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setNeedsActivationRef(null);
        setLoading(true);

        try {
            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: identifier.trim(), password })
                });
            } catch {
                res = await fetch(`/api/patient-auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: identifier.trim(), password })
                });
            }

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('patient', JSON.stringify(data));
                const redirectPath = location.state?.from?.pathname || '/portal/dashboard';
                navigate(redirectPath, { replace: true });
            } else {
                if (data.needsActivation) {
                    setNeedsActivationRef(data.referenceNumber || identifier.trim());
                }
                setError(data.message || 'Invalid Reference Number or password. Please verify your credentials.');
            }
        } catch (err) {
            console.error('Patient login error:', err);
            setError('Unable to reach the portal server. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemoPatient = () => {
        setLoginType('reference');
        setIdentifier('DEN-2026-00001');
        setPassword('Dentia2026!');
        setError('');
    };

    return (
        <div className="min-h-screen bg-warm-cream flex font-sans">
            {/* Left Hero Graphic Column */}
            <div 
                className="hidden lg:flex w-[50%] relative flex-col justify-between p-12 overflow-hidden border-r border-light-teal bg-cover bg-center"
                style={{ backgroundImage: `url('/premium_ai_dental_login.png')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-dark-slate/80 via-dark-slate/50 to-dark-slate/90" />

                {/* Brand Header */}
                <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-light-teal" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-black tracking-wide text-white">DENTIA</h1>
                        <p className="text-xs font-medium tracking-widest text-light-teal/90 uppercase">Patient Self-Service Portal</p>
                    </div>
                </div>

                {/* Hero Feature Callouts */}
                <div className="relative z-10 space-y-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>256-Bit Encrypted Healthcare Records</span>
                    </div>

                    <h2 className="text-4xl font-serif font-extrabold text-white leading-tight">
                        Your Complete Dental Health, Right at Your Fingertips.
                    </h2>
                    <p className="text-slate-200 text-sm leading-relaxed">
                        Access detailed clinical consultation reports, track ongoing orthodontic & whitening stages, view digital X-rays, and settle treatment balances online or at clinic.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
                            <p className="text-xs font-bold text-white">📅 Easy Booking</p>
                            <p className="text-[11px] text-slate-300">Choose doctor & instant slot confirmation</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
                            <p className="text-xs font-bold text-white">💳 Dual Payment</p>
                            <p className="text-[11px] text-slate-300">Online Card Checkout or In-Clinic Cash Slip</p>
                        </div>
                    </div>
                </div>

                {/* Clinician Access Link */}
                <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                    <span>Are you a dentist or clinic staff member?</span>
                    <Link to="/login" className="font-bold text-sky-300 hover:text-white transition-colors underline flex items-center gap-1">
                        Dentist Portal ➔
                    </Link>
                </div>
            </div>

            {/* Right Login Form Column */}
            <div className="w-full lg:w-[50%] flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-teal text-primary-teal text-xs font-bold uppercase tracking-wider mb-3">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Patient Portal Sign In</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-serif font-black text-dark-slate tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-sm text-muted-text mt-1 font-medium">
                            Log in with your clinic reference number or registered email.
                        </p>
                    </div>

                    {/* Quick Demo Fill Pill */}
                    <div className="p-3 rounded-2xl bg-primary-teal/5 border border-primary-teal/20 flex items-center justify-between">
                        <div className="text-xs">
                            <p className="font-bold text-dark-slate">Demo Patient Account:</p>
                            <p className="text-muted-text font-mono text-[11px]">DEN-2026-00001 • Dentia2026!</p>
                        </div>
                        <button
                            type="button"
                            onClick={fillDemoPatient}
                            className="px-3 py-1.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs"
                        >
                            Auto-Fill
                        </button>
                    </div>

                    {/* Authentication Type Selector Tabs */}
                    <div className="grid grid-cols-2 p-1.5 bg-light-teal/70 rounded-2xl border border-light-teal">
                        <button
                            type="button"
                            onClick={() => { setLoginType('reference'); setError(''); }}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                loginType === 'reference' 
                                    ? 'bg-white text-dark-slate shadow-sm' 
                                    : 'text-muted-text hover:text-dark-slate'
                            }`}
                        >
                            <Hash className="w-3.5 h-3.5 text-primary-teal" />
                            <span>Reference Number</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLoginType('email'); setError(''); }}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                loginType === 'email' 
                                    ? 'bg-white text-dark-slate shadow-sm' 
                                    : 'text-muted-text hover:text-dark-slate'
                            }`}
                        >
                            <Mail className="w-3.5 h-3.5 text-primary-teal" />
                            <span>Email or Phone</span>
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1.5">
                                <p className="font-semibold">{error}</p>
                                {needsActivationRef && (
                                    <Link
                                        to={`/portal/activate?ref=${encodeURIComponent(needsActivationRef)}`}
                                        className="inline-flex items-center gap-1 font-bold text-primary-hover underline hover:text-dark-slate"
                                    >
                                        Activate Reference #{needsActivationRef} now ➔
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Identifier Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark-slate flex items-center justify-between">
                                <span>{loginType === 'reference' ? 'Patient Reference Number (MRN)' : 'Email Address or Phone'}</span>
                                {loginType === 'reference' && (
                                    <span className="text-[10px] text-muted-text font-normal">e.g. DEN-2026-00035</span>
                                )}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                    {loginType === 'reference' ? <Hash className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                </div>
                                <input
                                    type={loginType === 'reference' ? 'text' : 'text'}
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder={loginType === 'reference' ? 'DEN-2026-XXXXX' : 'name@example.com or phone'}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-primary-teal focus:ring-3 focus:ring-primary-teal/15 text-sm font-medium text-dark-slate transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <label className="font-bold text-dark-slate">Portal Password</label>
                                <Link
                                    to={`/portal/activate?mode=reset${identifier ? `&ref=${encodeURIComponent(identifier.trim())}` : ''}`}
                                    className="text-primary-teal hover:text-primary-hover font-bold hover:underline cursor-pointer"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-primary-teal focus:ring-3 focus:ring-primary-teal/15 text-sm font-medium text-dark-slate transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-sm font-extrabold transition-all shadow-md shadow-primary-teal/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <span>Verifying credentials...</span>
                            ) : (
                                <>
                                    <span>Sign In to Patient Portal</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Secondary Actions: Activation and Registration */}
                    <div className="pt-4 border-t border-light-teal/80 space-y-3 text-center">
                        <div className="p-3.5 rounded-2xl bg-white border border-light-teal text-xs text-dark-slate space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-center gap-1.5 text-primary-teal font-extrabold text-[12px]">
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Already registered at our clinic?</span>
                            </div>
                            <p className="text-muted-text text-[11px]">
                                Use your Reference Number &amp; Date of Birth to activate your portal or reset your password.
                            </p>
                            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                                <Link
                                    to="/portal/activate?mode=activate"
                                    className="px-3 py-1.5 rounded-xl bg-light-teal text-primary-hover text-[11px] font-extrabold hover:bg-primary-teal hover:text-white transition-all shadow-2xs"
                                >
                                    ✨ First-Time Activation
                                </Link>
                                <Link
                                    to="/portal/activate?mode=reset"
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-dark-slate text-[11px] font-extrabold hover:bg-dark-slate hover:text-white transition-all shadow-2xs"
                                >
                                    🔑 Reset Password
                                </Link>
                            </div>
                        </div>

                        <p className="text-xs text-muted-text">
                            New patient with no prior visit?{' '}
                            <Link to="/portal/register" className="font-bold text-primary-teal hover:text-primary-hover underline">
                                Register an account online
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

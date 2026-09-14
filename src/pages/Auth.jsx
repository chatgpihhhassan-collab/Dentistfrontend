import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    Activity, ShieldCheck, Lock, Mail, User, AlertCircle, Sparkles, Clock, 
    Stethoscope, Hash, Eye, EyeOff, ArrowRight, CheckCircle2, KeyRound 
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export default function Auth() {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine initial role from URL query param (?role=patient) or path
    const [activeRole, setActiveRole] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('role') === 'patient' || location.pathname.includes('portal')) {
            return 'patient';
        }
        return 'clinician'; // 'clinician' | 'patient'
    });

    // Clinician Form State
    const [isLogin, setIsLogin] = useState(true);
    const [clinicianData, setClinicianData] = useState({ 
        username: '', 
        password: '', 
        firstName: '', 
        lastName: '', 
        region: 'NZ' 
    });
    const [clinicianLoading, setClinicianLoading] = useState(false);
    const [clinicianError, setClinicianError] = useState('');

    // Patient Form State
    const [patientLoginType, setPatientLoginType] = useState('reference'); // 'reference' | 'email'
    const [patientIdentifier, setPatientIdentifier] = useState('');
    const [patientPassword, setPatientPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [patientLoading, setPatientLoading] = useState(false);
    const [patientError, setPatientError] = useState('');
    const [patientNeedsActivation, setPatientNeedsActivation] = useState(null);

    const isSessionExpired = new URLSearchParams(location.search).get('expired') === 'true' || Boolean(location.state?.sessionExpired);

    // Switch active role and sync URL cleanly
    const handleRoleSwitch = (role) => {
        setActiveRole(role);
        setClinicianError('');
        setPatientError('');
    };

    // --- Clinician Authentication ---
    const handleClinicianSubmit = async (e) => {
        e.preventDefault();
        setClinicianError('');
        setClinicianLoading(true);

        try {
            const endpoint = isLogin ? 'login' : 'register';
            let res;
            try {
                res = await fetch(`/api/auth/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clinicianData)
                });
                if (res.status === 405 || res.status === 404) {
                    throw new Error(`Proxy status ${res.status}`);
                }
            } catch {
                res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clinicianData)
                });
            }

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('doctor', JSON.stringify(data));
                const from = location.state?.from?.pathname || (data.isSuperAdmin ? '/admin/doctors' : '/dashboard');
                navigate(from);
            } else {
                let errMsg = "Invalid username or password. Please check your credentials.";
                try {
                    const raw = await res.text();
                    try {
                        const errData = JSON.parse(raw);
                        if (errData && errData.message) errMsg = errData.message;
                    } catch {
                        if (raw && raw.length < 150 && !raw.includes("<!DOCTYPE")) errMsg = raw;
                    }
                } catch { }
                setClinicianError(errMsg);
            }
        } catch (err) {
            console.error("Clinician auth error:", err);
            setClinicianError("⚠️ Connection Error: Unable to reach authentication server. Please check your connection.");
        } finally {
            setClinicianLoading(false);
        }
    };

    // --- Patient Authentication ---
    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        setPatientError('');
        setPatientNeedsActivation(null);
        setPatientLoading(true);

        const cleanIdentifier = patientIdentifier.trim();
        if (!cleanIdentifier || !patientPassword) {
            setPatientError('Please provide your Reference Number or Email and Password.');
            setPatientLoading(false);
            return;
        }

        try {
            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: cleanIdentifier, password: patientPassword })
                });
                if (res.status === 405 || res.status === 404) {
                    throw new Error(`Proxy status ${res.status}`);
                }
            } catch {
                res = await fetch(`/api/patient-auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: cleanIdentifier, password: patientPassword })
                });
            }

            const data = await res.json();

            if (res.ok && data.token) {
                localStorage.setItem('patient', JSON.stringify(data));
                const redirectPath = location.state?.from?.pathname || '/portal/dashboard';
                navigate(redirectPath, { replace: true });
            } else {
                if (data.needsActivation) {
                    setPatientNeedsActivation(data.referenceNumber || cleanIdentifier);
                }
                setPatientError(data.message || 'Invalid Reference Number or Password. Please check your credentials.');
            }
        } catch (err) {
            console.error('Patient login error:', err);
            setPatientError('⚠️ Connection Error: Unable to reach patient authentication server.');
        } finally {
            setPatientLoading(false);
        }
    };

    // 1-Click Demo Patient Auto-Fill
    const fillDemoPatient = () => {
        setPatientLoginType('reference');
        setPatientIdentifier('DEN-2026-00001');
        setPatientPassword('Dentia2026!');
        setPatientError('');
    };

    return (
        <div className="min-h-screen bg-warm-cream flex font-sans">
            {/* Left Column (Adaptive Brand & Feature Showcase) */}
            <div 
                className="hidden lg:flex w-[52%] relative flex-col justify-between p-12 overflow-hidden border-r border-light-teal bg-cover bg-center"
                style={{ backgroundImage: `url('/premium_ai_dental_login.png')` }}
            >
                {/* Contrast overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-dark-slate/75 via-dark-slate/50 to-dark-slate/85" />
                
                {/* Brand Header */}
                <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-light-teal" />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif font-black tracking-wide text-white">
                            DENTIA <span className="font-sans font-light text-white/75">
                                {activeRole === 'clinician' ? 'CLINICAL WORKSPACE' : 'PATIENT PORTAL'}
                            </span>
                        </h1>
                        <p className="text-[11px] font-medium tracking-widest text-light-teal uppercase">
                            {activeRole === 'clinician' ? 'Dental Practice & AI Scribe Platform' : 'Patient Self-Service Health Hub'}
                        </p>
                    </div>
                </div>

                {/* Adaptive Hero Text & Highlights */}
                <div className="relative z-10 max-w-lg space-y-4">
                    {activeRole === 'clinician' ? (
                        <>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                <span>Clinical Diagnostics & AI Scribe System</span>
                            </div>
                            <h2 className="text-3xl font-serif font-extrabold text-white leading-tight shadow-sm">
                                Intelligent Patient Charting & 3D Imaging.
                            </h2>
                            <p className="text-white/85 font-medium text-sm leading-relaxed">
                                Seamless clinical workflow powered by voice AI documentation, 3D anatomical tooth models, and electronic prescriptions.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-white/90">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal" />
                                    <span>32-Tooth Multi-Condition Chart</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal" />
                                    <span>AI Dental SOAP Note Scribe</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal" />
                                    <span>Digital Rx & Pathology Logs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-light-teal" />
                                    <span>HIPAA & GDPR Clinical Security</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
                                <ShieldCheck className="w-4 h-4 text-sky-300" />
                                <span>256-Bit Encrypted Healthcare Records</span>
                            </div>
                            <h2 className="text-3xl font-serif font-extrabold text-white leading-tight shadow-sm">
                                Your Dental Health Records, Anywhere.
                            </h2>
                            <p className="text-white/85 font-medium text-sm leading-relaxed">
                                Review your 3D tooth health map, track scheduled visits, access dentist summaries and prescriptions, and pay invoices online or at the clinic desk.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-white/90">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300" />
                                    <span>Interactive Tooth Health Map</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300" />
                                    <span>Online Appointment Booking</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300" />
                                    <span>Clinical Reports & X-Rays</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-sky-300" />
                                    <span>Card & In-Clinic Cash Payments</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs text-white/60 font-medium">
                    <span>© 2026 Dentia Clinical Systems</span>
                    <span>v2.6 Secure Protocol</span>
                </div>
            </div>

            {/* Right Column (Dual-Role Authentication Panel) */}
            <div className="w-full lg:w-[48%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative overflow-y-auto">
                <div className="w-full max-w-md">

                    {/* 🌟 TOP SEGMENTED ROLE SWITCHER (DOCTOR VS PATIENT) */}
                    <div className="p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 mb-8 shadow-xs">
                        <div className="text-[11px] font-bold text-muted-text uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                            <span>Select Your Portal</span>
                            <span className="text-primary-teal font-extrabold">{activeRole === 'clinician' ? 'Clinician' : 'Patient'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                            <button
                                type="button"
                                onClick={() => handleRoleSwitch('clinician')}
                                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeRole === 'clinician'
                                        ? 'bg-white text-dark-slate shadow-sm border border-slate-200/90 font-extrabold scale-[1.01]'
                                        : 'text-muted-text hover:text-dark-slate hover:bg-white/50'
                                }`}
                            >
                                <Stethoscope className={`w-4 h-4 ${activeRole === 'clinician' ? 'text-primary-teal' : 'text-slate-400'}`} />
                                <span>Doctor / Staff</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRoleSwitch('patient')}
                                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeRole === 'patient'
                                        ? 'bg-white text-dark-slate shadow-sm border border-slate-200/90 font-extrabold scale-[1.01]'
                                        : 'text-muted-text hover:text-dark-slate hover:bg-white/50'
                                }`}
                            >
                                <User className={`w-4 h-4 ${activeRole === 'patient' ? 'text-sky-600' : 'text-slate-400'}`} />
                                <span>Patient Portal</span>
                            </button>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* ROLE 1: CLINICIAN / DOCTOR LOGIN FORM                                      */}
                    {/* ========================================================================= */}
                    {activeRole === 'clinician' && (
                        <div className="animate-in fade-in duration-200">
                            <div className="mb-7">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-teal/70 text-primary-teal font-bold text-xs uppercase tracking-wider mb-2">
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    <span>Clinician Workspace Access</span>
                                </div>
                                <h2 className="text-3xl font-serif font-extrabold text-dark-slate tracking-tight">
                                    {isLogin ? 'Sign in to Patient Charts' : 'Register Doctor Account'}
                                </h2>
                                <p className="text-muted-text font-medium text-xs mt-1">
                                    Secure clinical workspace for 3D odontograms, diagnoses and treatment planning.
                                </p>
                            </div>

                            {isSessionExpired && (
                                <div className="mb-6 p-4 bg-amber-50/95 border border-amber-300 rounded-2xl shadow-sm flex items-start gap-3 text-amber-950">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Session Locked</h4>
                                        <p className="text-xs text-amber-900/90 font-medium mt-1 leading-relaxed">
                                            For HIPAA/GDPR clinical security, your session was locked after inactivity. Please sign in to resume.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleClinicianSubmit} className="space-y-5">
                                {!isLogin && (
                                    <div className="flex space-x-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-dark-slate/80 mb-1.5">First Name</label>
                                            <input 
                                                type="text" 
                                                value={clinicianData.firstName}
                                                onChange={(e) => setClinicianData({...clinicianData, firstName: e.target.value})}
                                                className="w-full px-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                                placeholder="Sarah"
                                                required={!isLogin}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-dark-slate/80 mb-1.5">Last Name</label>
                                            <input 
                                                type="text" 
                                                value={clinicianData.lastName}
                                                onChange={(e) => setClinicianData({...clinicianData, lastName: e.target.value})}
                                                className="w-full px-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                                placeholder="Lee"
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-dark-slate/80">
                                            {isLogin ? 'Clinician Username' : 'Username or Email'}
                                        </label>
                                        {isLogin && (
                                            <span className="text-[11px] text-muted-text font-medium">
                                                e.g. <strong className="text-primary-teal font-bold">ahmedjh</strong>
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                            {clinicianData.username && clinicianData.username.includes('@') ? (
                                                <Mail className="h-4 w-4" />
                                            ) : (
                                                <User className="h-4 w-4" />
                                            )}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={clinicianData.username}
                                            onChange={(e) => setClinicianData({...clinicianData, username: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                            placeholder="Enter username (e.g. ahmedjh)"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-dark-slate/80 mb-1.5">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input 
                                            type="password" 
                                            value={clinicianData.password}
                                            onChange={(e) => setClinicianData({...clinicianData, password: e.target.value})}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div>
                                        <label className="block text-xs font-bold text-dark-slate/80 mb-1.5">Practice Region</label>
                                        <select 
                                            value={clinicianData.region}
                                            onChange={(e) => setClinicianData({...clinicianData, region: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                        >
                                            <option value="NZ">New Zealand (NZF Guidelines)</option>
                                            <option value="PK">Pakistan (DRAP Guidelines)</option>
                                        </select>
                                    </div>
                                )}

                                {clinicianError && (
                                    <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-start gap-2 shadow-xs">
                                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                        <span className="leading-relaxed">{clinicianError}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={clinicianLoading}
                                    className="w-full bg-primary-teal hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {clinicianLoading ? (
                                        <span className="inline-block animate-spin">⏳</span>
                                    ) : (
                                        <>
                                            <span>{isLogin ? 'Open Patient Charts' : 'Create Clinician Account'}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-5 text-center">
                                <button 
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-xs text-primary-teal hover:text-primary-hover font-bold cursor-pointer"
                                >
                                    {isLogin ? 'Need an account? Register Doctor' : 'Already registered? Sign in'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* ROLE 2: PATIENT PORTAL LOGIN FORM                                         */}
                    {/* ========================================================================= */}
                    {activeRole === 'patient' && (
                        <div className="animate-in fade-in duration-200">
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs uppercase tracking-wider mb-2">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Patient Self-Service Access</span>
                                </div>
                                <h2 className="text-3xl font-serif font-extrabold text-dark-slate tracking-tight">
                                    Sign in to Patient Portal
                                </h2>
                                <p className="text-muted-text font-medium text-xs mt-1">
                                    Enter your clinic Reference Number or registered email to view appointments and records.
                                </p>
                            </div>

                            {/* Demo Quick-Fill Pill Button */}
                            <div className="mb-5 p-3 bg-gradient-to-r from-sky-50 via-teal-50/70 to-emerald-50 rounded-2xl border border-sky-200/80 flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⚡</span>
                                    <div>
                                        <p className="text-[11px] font-extrabold text-dark-slate">Demo Patient Access</p>
                                        <p className="text-[10px] text-muted-text font-medium">Ref # DEN-2026-00001 (Olivia Chen)</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={fillDemoPatient}
                                    className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 font-extrabold text-[11px] rounded-lg border border-sky-300 shadow-xs cursor-pointer transition-all"
                                >
                                    Auto-Fill
                                </button>
                            </div>

                            {/* Sub-Tabs: Reference Number vs Email */}
                            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 mb-5">
                                <button
                                    type="button"
                                    onClick={() => setPatientLoginType('reference')}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                        patientLoginType === 'reference'
                                            ? 'bg-white text-dark-slate shadow-xs'
                                            : 'text-muted-text hover:text-dark-slate'
                                    }`}
                                >
                                    <Hash className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Reference #</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPatientLoginType('email')}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                        patientLoginType === 'email'
                                            ? 'bg-white text-dark-slate shadow-xs'
                                            : 'text-muted-text hover:text-dark-slate'
                                    }`}
                                >
                                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                                    <span>Email</span>
                                </button>
                            </div>

                            <form onSubmit={handlePatientSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-dark-slate/80 mb-1.5">
                                        {patientLoginType === 'reference' ? 'Patient Reference Number' : 'Registered Email Address'}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                            {patientLoginType === 'reference' ? (
                                                <Hash className="w-4 h-4 text-primary-teal" />
                                            ) : (
                                                <Mail className="w-4 h-4 text-sky-600" />
                                            )}
                                        </div>
                                        <input
                                            type={patientLoginType === 'reference' ? 'text' : 'email'}
                                            value={patientIdentifier}
                                            onChange={(e) => setPatientIdentifier(e.target.value)}
                                            placeholder={patientLoginType === 'reference' ? 'e.g. DEN-2026-00001' : 'e.g. olivia.chen@example.com'}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-sky-400/40 font-mono"
                                            required
                                        />
                                    </div>
                                    {patientLoginType === 'reference' && (
                                        <p className="text-[10px] text-muted-text mt-1 pl-1">
                                            Found on your clinic appointment slip, SMS confirmation, or invoice.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-dark-slate/80 mb-1.5">Portal Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={patientPassword}
                                            onChange={(e) => setPatientPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-3 bg-white border border-light-teal rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-text hover:text-dark-slate cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {patientError && (
                                    <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-start gap-2 shadow-xs">
                                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="leading-relaxed">{patientError}</p>
                                            {patientNeedsActivation && (
                                                <Link
                                                    to={`/portal-activate?ref=${encodeURIComponent(patientNeedsActivation)}`}
                                                    className="inline-block mt-2 text-xs font-black text-rose-800 underline hover:text-rose-950"
                                                >
                                                    Activate Account Now with Ref #{patientNeedsActivation} →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={patientLoading}
                                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {patientLoading ? (
                                        <span className="inline-block animate-spin">⏳</span>
                                    ) : (
                                        <>
                                            <span>Sign In to Patient Portal</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Patient Quick Actions */}
                            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <Link
                                    to="/portal-register"
                                    className="text-sky-700 hover:text-sky-900 font-bold hover:underline"
                                >
                                    ✨ New Patient? Register Online
                                </Link>
                                <Link
                                    to="/portal-activate"
                                    className="text-muted-text hover:text-dark-slate font-semibold hover:underline"
                                >
                                    🔑 First time? Activate Account
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Common Security Footer */}
                    <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-primary-teal font-bold bg-light-teal/40 border border-light-teal py-2.5 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-primary-teal" />
                        <span>Encrypted Session · HIPAA & GDPR Compliant</span>
                    </div>

                </div>
            </div>
        </div>
    );
}

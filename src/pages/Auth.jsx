import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, Lock, Mail, User, Sparkles, AlertCircle } from 'lucide-react';
export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', firstName: '', lastName: '', region: 'NZ' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const endpoint = isLogin ? 'login' : 'register';
            let res;
            try {
                res = await fetch(`/api/auth/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } catch (netErr) {
                // Direct fallback to dentist-api-dev.vitonta.com if proxy fails
                res = await fetch(`https://dentist-api-dev.vitonta.com/api/auth/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
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
                    const errData = await res.json();
                    if (errData && errData.message) {
                        errMsg = errData.message;
                    } else if (typeof errData === 'string') {
                        errMsg = errData;
                    }
                } catch {
                    const textErr = await res.text();
                    if (textErr && textErr.length < 150) {
                        errMsg = textErr;
                    }
                }
                setError(errMsg);
            }
        } catch (err) {
            console.error("Auth request error:", err);
            setError("⚠️ Connection Error: Unable to reach authentication server. Please check your connection.");
        }
    };

    return (
        <div className="min-h-screen bg-warm-cream flex font-sans">
            {/* Left Column (Premium High-Res Image Background) */}
            <div 
                className="hidden lg:flex w-[55%] relative flex-col justify-center items-center overflow-hidden border-r border-light-teal bg-cover bg-center"
                style={{ backgroundImage: `url('/premium_ai_dental_login.png')` }}
            >
                {/* Subtle gradient overlay just to ensure text contrast at the top/bottom without dulling the center */}
                <div className="absolute inset-0 bg-gradient-to-b from-dark-slate/50 via-transparent to-dark-slate/70" />
                
                <div className="absolute top-8 left-8 flex items-center space-x-3 z-10">
                    <Sparkles className="w-8 h-8 text-light-teal" />
                    <h1 className="text-xl font-serif font-bold tracking-wide text-white">LUMINA DENTAL <span className="font-sans font-light text-white/70">STUDIO</span></h1>
                </div>

                <div className="absolute bottom-16 left-12 z-10">
                    <h2 className="text-3xl font-serif font-extrabold text-white mb-2 shadow-sm">Intelligent Patient Charting.</h2>
                    <p className="text-white/90 font-medium max-w-md">Modern clinical workflow powered by AI voice assistants and interactive charting.</p>
                </div>
            </div>

            {/* Right Column (Login Form) */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 lg:p-16 relative">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <p className="text-primary-teal font-bold text-xs tracking-widest uppercase mb-2">Clinician Access</p>
                        <h2 className="text-4xl font-serif font-extrabold text-dark-slate mb-3 tracking-tight">
                            {isLogin ? 'Sign in to Patient Charts' : 'Register New Account'}
                        </h2>
                        <p className="text-muted-text font-medium">Secure workspace for diagnostics, 3D charting and prescriptions.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-dark-slate/80 mb-2">First Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-white border border-light-teal rounded-xl shadow-sm text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 font-medium"
                                        placeholder="John"
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-dark-slate/80 mb-2">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-white border border-light-teal rounded-xl shadow-sm text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 font-medium"
                                        placeholder="Doe"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-dark-slate/80">
                                    {isLogin ? 'Username' : 'Username or Email'}
                                </label>
                                {isLogin && (
                                    <span className="text-[11px] text-muted-text font-medium">
                                        Registered username (e.g. <strong className="text-primary-teal font-bold">ahmedjh</strong>)
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {formData.username && formData.username.includes('@') ? (
                                        <Mail className="h-5 w-5 text-muted-text" />
                                    ) : (
                                        <User className="h-5 w-5 text-muted-text" />
                                    )}
                                </div>
                                <input 
                                    type="text" 
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-light-teal rounded-full shadow-sm text-dark-slate placeholder-muted-text/50 focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all font-medium"
                                    placeholder={isLogin ? "Enter username (e.g. ahmedjh)" : "Choose username (e.g. ahmedjh or email)"}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-dark-slate/80 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted-text" />
                                </div>
                                <input 
                                    type="password" 
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-light-teal rounded-full shadow-sm text-dark-slate placeholder-muted-text/50 focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-bold text-dark-slate/80 mb-2">Practice Location (Region)</label>
                                <select 
                                    value={formData.region}
                                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-white border border-light-teal rounded-xl shadow-sm text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 font-medium"
                                >
                                    <option value="NZ">New Zealand (NZF Guidelines)</option>
                                    <option value="PK">Pakistan (DRAP Guidelines)</option>
                                </select>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs font-bold border border-rose-200 flex items-start gap-2.5 shadow-xs animate-in fade-in duration-200">
                                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                <span className="leading-relaxed">{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-primary-teal hover:bg-primary-hover text-white font-bold py-4 px-4 rounded-full shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            {isLogin ? 'Open patient chart' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-primary-teal hover:text-primary-hover font-bold cursor-pointer"
                        >
                            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
                        </button>
                    </div>

                    <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-primary-teal font-bold bg-light-teal/40 border border-light-teal py-3 rounded-full">
                        <ShieldCheck className="w-5 h-5 text-primary-teal" />
                        <span>Encrypted session · HIPAA compliant</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

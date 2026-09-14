import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Mail, Phone, Calendar, Lock, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientRegister() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        phone: '',
        email: '',
        gender: 'Female',
        password: '',
        confirmPassword: '',
        region: 'NZ'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please verify your entries.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters in length.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                dob: formData.dob || null,
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                gender: formData.gender,
                password: formData.password,
                region: formData.region,
                doctorID: 1
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/patient-auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('patient', JSON.stringify(data));
                navigate('/portal/dashboard', { replace: true, state: { isNewRegistration: true } });
            } else {
                setError(data.message || 'Unable to complete registration. Please check your information.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Connection error: Unable to reach portal server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-warm-cream flex flex-col justify-center items-center p-4 sm:p-8 font-sans">
            <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-light-teal space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <Link to="/portal/login" className="inline-flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-primary-teal flex items-center justify-center text-white shadow-xs">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-serif font-black text-xl text-dark-slate">DENTIA CLINIC</span>
                    </Link>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">
                        Register Your Patient Account
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-text max-w-md mx-auto">
                        Create your self-service dental profile. A unique Patient Reference Number will be assigned immediately.
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="e.g. Sarah"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="e.g. Jenkins"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            >
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+64 21 123 4567"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="sarah@example.com"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Create Password *</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min. 6 characters"
                                className="w-full px-4 py-2.5 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-dark-slate">Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                            <span>Creating your account...</span>
                        ) : (
                            <>
                                <span>Complete Registration & Open Portal</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2 text-xs text-muted-text">
                    Already registered or have a clinic reference slip?{' '}
                    <Link to="/portal/login" className="font-bold text-primary-teal hover:underline">
                        Sign In here
                    </Link>
                </div>
            </div>
        </div>
    );
}

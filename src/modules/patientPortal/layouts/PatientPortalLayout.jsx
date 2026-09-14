import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
    Sparkles, 
    Calendar, 
    FileText, 
    CreditCard, 
    Home, 
    LogOut, 
    User, 
    Menu, 
    X, 
    ShieldCheck, 
    Clock, 
    AlertCircle,
    ChevronDown,
    ArrowRight
} from 'lucide-react';

export default function PatientPortalLayout() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('patient');
        navigate('/portal/login');
    };

    const navItems = [
        { path: '/portal/dashboard', label: 'Dashboard', icon: Home },
        { path: '/portal/appointments', label: 'Appointments', icon: Calendar },
        { path: '/portal/reports', label: 'Clinical Reports & X-Rays', icon: FileText },
        { path: '/portal/billing', label: 'Invoices & Payments', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-warm-cream flex flex-col font-sans text-dark-slate">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-light-teal shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Brand Logo */}
                        <Link to="/portal/dashboard" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-teal to-primary-hover flex items-center justify-center shadow-md shadow-primary-teal/25 group-hover:scale-105 transition-transform">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xl font-serif font-black tracking-tight text-dark-slate">DENTIA</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-light-teal text-primary-teal uppercase tracking-widest">PATIENT</span>
                                </div>
                                <p className="text-[10px] text-muted-text font-medium tracking-wide">Personal Dental Health Portal</p>
                            </div>
                        </Link>

                        {/* Desktop Nav Links */}
                        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) => `
                                            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                                            ${isActive 
                                                ? 'bg-primary-teal text-white shadow-sm shadow-primary-teal/30' 
                                                : 'text-muted-text hover:text-dark-slate hover:bg-light-teal/60'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Patient Profile Pill & User Menu */}
                        <div className="hidden sm:flex items-center space-x-4">
                            {/* Patient Reference Number Pill */}
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-light-teal/80 border border-light-teal text-xs font-bold text-dark-slate">
                                <span className="text-[10px] uppercase tracking-wider text-muted-text font-semibold">REF:</span>
                                <span className="font-mono text-primary-hover font-extrabold">{patient.referenceNumber || 'DEN-PATIENT'}</span>
                            </div>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-light-teal/50 border border-transparent hover:border-light-teal transition-all focus:outline-none"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-teal to-dark-slate flex items-center justify-center text-white font-serif font-bold text-sm shadow-xs">
                                        {patient.firstName ? patient.firstName[0].toUpperCase() : 'P'}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold leading-tight text-dark-slate">
                                            {patient.firstName} {patient.lastName}
                                        </p>
                                        <p className="text-[10px] text-muted-text font-medium">Patient</p>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 text-muted-text transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userDropdownOpen && (
                                    <div 
                                        className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-light-teal py-2 z-50 animate-fadeIn"
                                        onMouseLeave={() => setUserDropdownOpen(false)}
                                    >
                                        <div className="px-4 py-3 border-b border-light-teal/60">
                                            <p className="text-xs text-muted-text font-medium">Signed in as</p>
                                            <p className="text-sm font-bold text-dark-slate truncate">{patient.email || `${patient.firstName} ${patient.lastName}`}</p>
                                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-primary-teal font-semibold">
                                                <span>ID: #{patient.patientID}</span>
                                                <span>•</span>
                                                <span>{patient.referenceNumber}</span>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Sign Out from Portal</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center space-x-2">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl text-dark-slate hover:bg-light-teal/60 transition-colors"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-light-teal px-4 pt-3 pb-5 space-y-3">
                        <div className="p-3 bg-light-teal/50 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-dark-slate">{patient.firstName} {patient.lastName}</p>
                                <p className="text-[11px] font-mono text-primary-teal font-semibold">{patient.referenceNumber}</p>
                            </div>
                            <span className="text-[10px] uppercase font-bold bg-white px-2 py-1 rounded-lg text-muted-text">Verified</span>
                        </div>

                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors
                                            ${isActive ? 'bg-primary-teal text-white' : 'text-dark-slate hover:bg-light-teal/50'}
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>

                        <div className="pt-2 border-t border-light-teal/70">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Outlet />
            </main>

            {/* Subtle Footer */}
            <footer className="mt-auto border-t border-light-teal bg-white/60 py-6 text-center text-xs text-muted-text">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 Dentia Dental Clinic Workspace. Patient Portal & Secure Records.</p>
                    <div className="flex items-center gap-4 text-xs font-semibold text-primary-hover">
                        <Link to="/privacy">Privacy Notice</Link>
                        <span>•</span>
                        <Link to="/terms">Terms of Care</Link>
                        <span>•</span>
                        <Link to="/about">Clinic Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    Home, 
    Calendar, 
    FileText, 
    CreditCard, 
    HelpCircle, 
    Settings, 
    LogOut, 
    Search, 
    Bell, 
    Mail, 
    ChevronDown, 
    Menu, 
    X, 
    Sparkles, 
    ShieldCheck, 
    Clock,
    Activity,
    Stethoscope,
    PlusCircle,
    Smile
} from 'lucide-react';

export default function PatientPortalLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');
    const avatarUrl = patient.profileImageDataUrl || '';

    const handleLogout = () => {
        localStorage.removeItem('patient');
        navigate('/portal/login');
    };

    // General navigation matching the main Dentia theme
    const generalNav = [
        { path: '/portal/dashboard', label: 'Overview', icon: Home },
        { path: '/portal/appointments', label: 'Appointments', icon: Calendar },
        { path: '/portal/book', label: 'Book Visit', icon: PlusCircle },
        { path: '/portal/odontogram', label: 'Dental Map', icon: Smile },
        { path: '/portal/reports', label: 'Clinical Reports', icon: FileText },
        { path: '/portal/billing', label: 'Invoices & Billing', icon: CreditCard },
    ];

    const supportNav = [
        { path: '#help', label: 'Help & Support', icon: HelpCircle },
        { path: '#settings', label: 'Settings', icon: Settings },
    ];

    // Greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F4F6FA] via-[#F8FAFD] to-[#EAF0FC] flex font-sans text-dark-slate antialiased selection:bg-primary-teal/20 selection:text-primary-teal">
            {/* Desktop Fixed Sidebar matching Dentia color scheme */}
            <aside className="hidden lg:flex w-64 flex-col justify-between bg-white border-r border-light-teal py-7 px-6 sticky top-0 h-screen z-30 shadow-[4px_0_24px_rgba(16,36,75,0.03)]">
                <div className="space-y-7">
                    {/* Dentia Brand Logo */}
                    <Link to="/portal/dashboard" className="flex items-center gap-3 group px-1">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-teal to-primary-hover flex items-center justify-center shadow-md shadow-primary-teal/25 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-serif font-black tracking-tight text-dark-slate">DENTIA</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-light-teal text-primary-teal uppercase tracking-wider">PORTAL</span>
                            </div>
                            <span className="block text-[10px] font-medium text-muted-text">Patient Health Workspace</span>
                        </div>
                    </Link>

                    {/* Search Bar Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-text">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search records, visits..."
                            className="w-full pl-10 pr-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs font-medium text-dark-slate placeholder:text-muted-text/60 focus:outline-none focus:ring-2 focus:ring-primary-teal/30 transition-all"
                        />
                    </div>

                    {/* General Section */}
                    <div>
                        <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider px-3 mb-2.5">
                            General
                        </p>
                        <nav className="space-y-1.5">
                            {generalNav.map((item) => {
                                const Icon = item.icon;
                                const isOverview = item.label === 'Overview';
                                const isActive = isOverview 
                                    ? location.pathname === '/portal/dashboard' || location.pathname === '/portal'
                                    : location.pathname.startsWith(item.path);

                                return (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-primary-teal text-white shadow-md shadow-primary-teal/25'
                                                : 'text-muted-text hover:text-dark-slate hover:bg-light-teal/60'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary-teal'}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Support Section */}
                    <div>
                        <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider px-3 mb-2.5">
                            Support
                        </p>
                        <nav className="space-y-1.5">
                            {supportNav.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            if (item.label === 'Settings') setUserDropdownOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-muted-text hover:text-dark-slate hover:bg-light-teal/60 transition-all"
                                    >
                                        <Icon className="w-4 h-4 text-muted-text/80" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}

                            {/* Sign Out Button */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer mt-2"
                            >
                                <LogOut className="w-4 h-4 text-rose-500" />
                                <span>Sign Out</span>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Bottom Clinic Reference Badge */}
                <div className="p-3.5 bg-light-teal/70 rounded-2xl border border-light-teal flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs text-primary-teal">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] uppercase font-bold text-muted-text tracking-wider">Patient Ref #</p>
                        <p className="text-xs font-extrabold text-primary-hover font-mono truncate">{patient.referenceNumber || 'DEN-2026-00001'}</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div 
                        className="fixed inset-0 bg-dark-slate/50 backdrop-blur-xs transition-opacity" 
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative w-72 bg-white h-full p-6 shadow-2xl z-10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-6 border-b border-light-teal">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-2xl bg-primary-teal flex items-center justify-center text-white font-bold">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <span className="text-lg font-serif font-black text-dark-slate">DENTIA</span>
                                </div>
                                <button 
                                    onClick={() => setMobileMenuOpen(false)} 
                                    className="p-2 rounded-xl text-muted-text hover:text-dark-slate"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="mt-6 space-y-1.5">
                                {generalNav.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold ${
                                                isActive ? 'bg-primary-teal text-white' : 'text-muted-text hover:bg-light-teal/60'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Application Shell Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                {/* Top Header matching Dentia theme */}
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-6 sm:px-10 py-5 flex items-center justify-between border-b border-light-teal shadow-xs">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl bg-white border border-light-teal text-dark-slate shadow-xs"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Greeting Text */}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-serif font-black text-dark-slate tracking-tight">
                                {getGreeting()}, {patientName}!
                            </h1>
                            <p className="text-xs text-muted-text font-medium">
                                Welcome to your personal Dentia dental workspace and clinical records.
                            </p>
                        </div>
                    </div>

                    {/* Right Header Controls: Notification Bell, Mail, Profile */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="w-10 h-10 rounded-2xl bg-white border border-light-teal flex items-center justify-center text-muted-text hover:text-dark-slate hover:shadow-sm transition-all shadow-xs relative cursor-pointer"
                            >
                                <Bell className="w-4 h-4 text-muted-text" />
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-teal ring-2 ring-white" />
                            </button>

                            {/* Notifications Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl p-4 shadow-xl border border-light-teal z-50 animate-in fade-in zoom-in-95">
                                    <div className="flex items-center justify-between pb-3 border-b border-light-teal">
                                        <h4 className="text-xs font-black text-dark-slate">Clinical Alerts</h4>
                                        <span className="text-[10px] font-bold text-primary-teal">Active</span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <div className="p-3 bg-light-teal/60 rounded-2xl flex items-start gap-2.5">
                                            <Clock className="w-4 h-4 text-primary-teal shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-dark-slate">Patient Portal Active</p>
                                                <p className="text-[11px] text-muted-text mt-0.5">Ref #{patient.referenceNumber || 'DEN-2026-00001'} verified with clinic database.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reports / Messages Icon */}
                        <Link
                            to="/portal/reports"
                            className="w-10 h-10 rounded-2xl bg-white border border-light-teal flex items-center justify-center text-muted-text hover:text-dark-slate hover:shadow-sm transition-all shadow-xs"
                            title="Clinical Reports & Prescriptions"
                        >
                            <Mail className="w-4 h-4" />
                        </Link>

                        {/* Profile Pill Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-3 p-1.5 pr-3.5 bg-white border border-light-teal rounded-2xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={patientName}
                                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-teal/30"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-teal to-dark-slate flex items-center justify-center text-white font-serif font-black text-xs shadow-xs">
                                        {patient.firstName ? patient.firstName[0].toUpperCase() : 'P'}
                                    </div>
                                )}
                                <div className="hidden sm:block text-left">
                                    <span className="block text-xs font-extrabold text-dark-slate leading-tight">
                                        {patientName}
                                    </span>
                                    <span className="block text-[10px] font-mono text-primary-teal font-bold leading-none">
                                        {patient.referenceNumber || 'DEN-PATIENT'}
                                    </span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-text" />
                            </button>

                            {/* User Menu Dropdown */}
                            {userDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl p-3 shadow-xl border border-light-teal z-50 animate-in fade-in zoom-in-95">
                                    <div className="px-3 py-2 border-b border-light-teal mb-2">
                                        <p className="text-xs font-extrabold text-dark-slate truncate">{patientName}</p>
                                        <p className="text-[10px] font-mono text-muted-text">{patient.referenceNumber || 'DEN-2026-00001'}</p>
                                    </div>
                                    <Link
                                        to="/portal/billing"
                                        onClick={() => setUserDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-text hover:text-dark-slate hover:bg-light-teal/60"
                                    >
                                        <CreditCard className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>My Invoices</span>
                                    </Link>
                                    <Link
                                        to="/portal/appointments"
                                        onClick={() => setUserDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-text hover:text-dark-slate hover:bg-light-teal/60"
                                    >
                                        <Calendar className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>My Appointments</span>
                                    </Link>
                                    <div className="my-1 border-t border-light-teal" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Dynamic View Content */}
                <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-[1700px] w-full mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

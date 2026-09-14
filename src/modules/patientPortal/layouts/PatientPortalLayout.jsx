import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
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
    Heart, 
    Activity, 
    BarChart3, 
    LineChart, 
    Sparkles, 
    ShieldCheck, 
    User,
    Clock
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
        : (patient.firstName || 'Jake Vincent');
    const avatarUrl = patient.profileImageDataUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

    const handleLogout = () => {
        localStorage.removeItem('patient');
        navigate('/portal/login');
    };

    // General navigation matching the mockup
    const generalNav = [
        { path: '/portal/dashboard', label: 'Overview', icon: Home },
        { path: '/portal/dashboard#health-status', label: 'Health', icon: Heart },
        { path: '/portal/reports', label: 'Statistics', icon: BarChart3 },
        { path: '/portal/reports#radiographs', label: 'Analytic', icon: LineChart },
        { path: '/portal/appointments', label: 'Appointment', icon: Calendar },
        { path: '/portal/billing', label: 'Billing & Invoices', icon: CreditCard },
    ];

    const supportNav = [
        { path: '#help', label: 'Help Center', icon: HelpCircle },
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
        <div className="min-h-screen bg-[#F4F7F6] flex font-sans text-slate-800 antialiased selection:bg-[#00BFA5]/20 selection:text-[#00BFA5]">
            {/* Desktop Fixed Sidebar matching CareDash mockup */}
            <aside className="hidden lg:flex w-64 flex-col justify-between bg-white border-r border-slate-100/90 py-7 px-6 sticky top-0 h-screen z-30 shadow-[2px_0_15px_rgba(0,0,0,0.015)]">
                <div className="space-y-7">
                    {/* Brand Logo */}
                    <Link to="/portal/dashboard" className="flex items-center gap-3 group px-1">
                        <div className="w-10 h-10 rounded-2xl bg-[#00BFA5] flex items-center justify-center shadow-md shadow-[#00BFA5]/20 group-hover:scale-105 transition-transform">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">CareDash</span>
                            <span className="block text-[10px] font-bold text-[#00BFA5] uppercase tracking-wider">Patient Portal</span>
                        </div>
                    </Link>

                    {/* Search Bar Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7F6] border-none rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 transition-all"
                        />
                    </div>

                    {/* General Section */}
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
                            General
                        </p>
                        <nav className="space-y-1.5">
                            {generalNav.map((item) => {
                                const Icon = item.icon;
                                const isOverview = item.label === 'Overview';
                                const isActive = isOverview 
                                    ? location.pathname === '/portal/dashboard' || location.pathname === '/portal'
                                    : location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/30'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-[#F4F7F6]'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Support Section */}
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
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
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-[#F4F7F6] transition-all"
                                    >
                                        <Icon className="w-4 h-4 text-slate-400" />
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
                <div className="p-3.5 bg-[#F4F7F6] rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs text-[#00BFA5]">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient Ref #</p>
                        <p className="text-xs font-extrabold text-slate-800 font-mono truncate">{patient.referenceNumber || 'DEN-2026-00001'}</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative w-72 bg-white h-full p-6 shadow-2xl z-10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-2xl bg-[#00BFA5] flex items-center justify-center text-white font-bold">
                                        <Heart className="w-4 h-4" />
                                    </div>
                                    <span className="text-lg font-bold text-slate-900">CareDash</span>
                                </div>
                                <button 
                                    onClick={() => setMobileMenuOpen(false)} 
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
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
                                                isActive ? 'bg-[#00BFA5] text-white' : 'text-slate-600 hover:bg-[#F4F7F6]'
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
                {/* Top Header matching CareDash mockup */}
                <header className="sticky top-0 z-20 bg-[#F4F7F6]/90 backdrop-blur-md px-6 sm:px-10 py-5 flex items-center justify-between border-b border-slate-200/40">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 shadow-xs"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Greeting Text */}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                {getGreeting()}
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">
                                Good morning! Hope you feel better today.
                            </p>
                        </div>
                    </div>

                    {/* Right Header Controls: Notification Bell, Mail, Profile */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:shadow-sm transition-all shadow-xs relative cursor-pointer"
                            >
                                <Bell className="w-4 h-4 text-slate-600" />
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00BFA5] ring-2 ring-white" />
                            </button>

                            {/* Notifications Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl p-4 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <h4 className="text-xs font-extrabold text-slate-900">Notifications</h4>
                                        <span className="text-[10px] font-bold text-[#00BFA5]">1 New</span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <div className="p-3 bg-[#F4F7F6] rounded-2xl flex items-start gap-2.5">
                                            <Clock className="w-4 h-4 text-[#00BFA5] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">Upcoming Dentist Checkup</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">8 Dec 2025 at 10:00 AM with Dr. Brodie Duran</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mail / Messages Icon */}
                        <Link
                            to="/portal/reports"
                            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all shadow-xs"
                        >
                            <Mail className="w-4 h-4" />
                        </Link>

                        {/* Profile Pill Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-3 p-1.5 pr-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                            >
                                <img
                                    src={avatarUrl}
                                    alt={patientName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00BFA5]/30"
                                />
                                <span className="hidden sm:inline-block text-xs font-extrabold text-slate-800">
                                    {patientName}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {/* User Menu Dropdown */}
                            {userDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl p-3 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95">
                                    <div className="px-3 py-2 border-b border-slate-100 mb-2">
                                        <p className="text-xs font-extrabold text-slate-900 truncate">{patientName}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{patient.referenceNumber || 'DEN-2026-00001'}</p>
                                    </div>
                                    <Link
                                        to="/portal/billing"
                                        onClick={() => setUserDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#F4F7F6]"
                                    >
                                        <CreditCard className="w-3.5 h-3.5 text-[#00BFA5]" />
                                        <span>My Invoices</span>
                                    </Link>
                                    <Link
                                        to="/portal/appointments"
                                        onClick={() => setUserDropdownOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#F4F7F6]"
                                    >
                                        <Calendar className="w-3.5 h-3.5 text-[#00BFA5]" />
                                        <span>My Appointments</span>
                                    </Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
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

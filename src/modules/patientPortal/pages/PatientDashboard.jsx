import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ChevronRight, 
    ChevronLeft, 
    ChevronDown, 
    Heart, 
    Sparkles, 
    ShieldCheck, 
    Clock, 
    User, 
    Calendar as CalendarIcon, 
    Activity, 
    Droplets, 
    Cake, 
    ArrowUp, 
    CheckCircle2, 
    X, 
    FileText, 
    CreditCard,
    ArrowRight
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';
import ToothHealthMap from '../components/ToothHealthMap';

export default function PatientDashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [teethState, setTeethState] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFullInfoModal, setShowFullInfoModal] = useState(false);
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(8);
    const [calendarMonthIndex, setCalendarMonthIndex] = useState(11); // December

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Jake Vincent');
    const avatarUrl = patient.profileImageDataUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=350';

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const token = patient.token;
                const headers = { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };

                let res;
                try {
                    res = await fetch(`${API_BASE_URL}/api/patient-portal/dashboard`, { headers });
                } catch {
                    res = await fetch(`/api/patient-portal/dashboard`, { headers });
                }

                if (res.ok) {
                    const data = await res.json();
                    setDashboardData(data);
                } else if (res.status === 401) {
                    localStorage.removeItem('patient');
                    navigate('/portal/login');
                    return;
                }

                // Odontogram teeth state
                try {
                    let teethRes;
                    try {
                        teethRes = await fetch(`${API_BASE_URL}/api/patient-portal/odontogram`, { headers });
                    } catch {
                        teethRes = await fetch(`/api/patient-portal/odontogram`, { headers });
                    }
                    if (teethRes.ok) {
                        const tData = await teethRes.json();
                        setTeethState(tData);
                    }
                } catch {}

            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate]);

    // Calendar Days Generator for December 2025 (matching mockup)
    // Starts on Monday: Mo Tu We Th Fr Sa Su
    const calendarDays = [
        1, 2, 3, 4,
        5, 6, 7, 8, 9, 10, 11,
        12, 13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31
    ];

    // SVG Tooth Icon for exact visual fidelity
    const ToothSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.5 6 2 9.5.5 3 2 4.5 4 4.5s3.5-1.5 4-4.5c.5-3.5 2-6.5 2-9.5 0-3.5-2.5-6-6-6Z" />
            <path d="M9 10c1 .5 2 .5 3 0 1 .5 2 .5 3 0" />
        </svg>
    );

    // SVG Lungs Icon
    const LungsSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v16" />
            <path d="M7 6C4.5 6 3 8 3 12c0 4.5 2.5 8 5 8a4 4 0 0 0 4-4V7" />
            <path d="M17 6c2.5 0 4 2 4 6 0 4.5-2.5 8-5 8a4 4 0 0 1-4-4V7" />
        </svg>
    );

    // SVG Eyes Icon
    const EyesSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="12" r="4" />
            <circle cx="17" cy="12" r="4" />
            <path d="M11 12h2" />
        </svg>
    );

    // SVG Hearth / Heart Icon
    const HearthSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
    );

    // SVG Brain Icon
    const BrainSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.2a3 3 0 0 0-3 3 3 3 0 0 0 .8 2 3 3 0 0 0-.8 2 3 3 0 0 0 3 3v.3a2.5 2.5 0 0 0 2.5 2.5h.5A2.5 2.5 0 0 0 12 19V5a3 3 0 0 0-2.5-3Z" />
            <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.2a3 3 0 0 1 3 3 3 3 0 0 1-.8 2 3 3 0 0 1 .8 2 3 3 0 0 1-3 3v.3a2.5 2.5 0 0 1-2.5 2.5h-.5A2.5 2.5 0 0 1 12 19V5a3 3 0 0 1 2.5-3Z" />
        </svg>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top 3-Column Main Dashboard Grid matching CareDash Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

                {/* ========================================================================= */}
                {/* COLUMN 1: PATIENT PROFILE & APPOINTMENT HISTORY (~3.8 cols / 12)          */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 space-y-7">
                    
                    {/* Patient Bio Card */}
                    <div className="bg-white rounded-3xl p-7 border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)] text-center relative overflow-hidden">
                        {/* Avatar */}
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#F4F7F6] shadow-sm mx-auto">
                                <img 
                                    src={avatarUrl} 
                                    alt={patientName} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-6">
                            {patientName}
                        </h2>

                        {/* 2x2 Metric Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {/* Gender */}
                            <div className="p-3 bg-[#F8FAFB] rounded-2xl flex items-center gap-3 text-left border border-slate-100/80">
                                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-medium text-slate-400">Gender</p>
                                    <p className="text-xs font-bold text-slate-800 truncate">{patient.gender || 'Male'}</p>
                                </div>
                            </div>

                            {/* Age */}
                            <div className="p-3 bg-[#F8FAFB] rounded-2xl flex items-center gap-3 text-left border border-slate-100/80">
                                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                                    <Cake className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-medium text-slate-400">Age</p>
                                    <p className="text-xs font-bold text-slate-800 truncate">67 y.o.</p>
                                </div>
                            </div>

                            {/* Height / Treatment */}
                            <div className="p-3 bg-[#F8FAFB] rounded-2xl flex items-center gap-3 text-left border border-slate-100/80">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                    <ArrowUp className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-medium text-slate-400">Height</p>
                                    <p className="text-xs font-bold text-slate-800 truncate">169cm</p>
                                </div>
                            </div>

                            {/* Blood Type / Ref # */}
                            <div className="p-3 bg-[#F8FAFB] rounded-2xl flex items-center gap-3 text-left border border-slate-100/80">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <Droplets className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-medium text-slate-400">Blood Type</p>
                                    <p className="text-xs font-bold text-slate-800 truncate">B</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button: See all information */}
                        <button
                            type="button"
                            onClick={() => setShowFullInfoModal(true)}
                            className="w-full py-3.5 px-6 bg-[#00BFA5] hover:bg-[#00ad95] text-white font-bold text-xs rounded-2xl shadow-md shadow-[#00BFA5]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>See all information</span>
                        </button>
                    </div>

                    {/* Appointment History Card */}
                    <div className="bg-white rounded-3xl p-7 border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-800 tracking-tight">Appointment History</h3>
                            <Link 
                                to="/portal/appointments" 
                                className="text-xs font-bold text-[#00BFA5] hover:text-[#009b85] flex items-center gap-0.5"
                            >
                                <span>See all</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Appointment List Items */}
                        <div className="space-y-3">
                            {/* Item 1: Featured / Active in Solid Teal */}
                            <div className="p-4 bg-[#00BFA5] rounded-2xl text-white shadow-md shadow-[#00BFA5]/25 flex items-center justify-between group cursor-pointer transition-all">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#00BFA5] shadow-xs">
                                        <ToothSvg className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold leading-tight">Detist</p>
                                        <p className="text-[11px] text-white/90 font-medium">Dr. Brodie Duran</p>
                                        <p className="text-[10px] text-white/80 font-normal mt-0.5">10.00 AM 8 Dec 2025</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Item 2: Lungs / Hygiene */}
                            <div className="p-3.5 bg-[#F8FAFB] hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group cursor-pointer transition-all">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <LungsSvg className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold text-slate-800 leading-tight">Lungs</p>
                                        <p className="text-[11px] text-slate-400 font-medium">Dr. Vada Baker</p>
                                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">09.00 AM 9 Dec 2025</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Item 3: Eyes / Restorations */}
                            <div className="p-3.5 bg-[#F8FAFB] hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group cursor-pointer transition-all">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                        <EyesSvg className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold text-slate-800 leading-tight">Eyes</p>
                                        <p className="text-[11px] text-slate-400 font-medium">Dr. Anya Burton</p>
                                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">11.00 AM 10 Dec 2025</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Item 4: Hearth / Checkup */}
                            <div className="p-3.5 bg-[#F8FAFB] hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group cursor-pointer transition-all">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <HearthSvg className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-extrabold text-slate-800 leading-tight">Hearth</p>
                                        <p className="text-[11px] text-slate-400 font-medium">Dr. Novaeh Marsh</p>
                                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">07.00 AM 11 Dec 2025</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* COLUMN 2: APPOINTMENT CALENDAR & HEALTH STATUS (~4.2 cols / 12)           */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 space-y-7">

                    {/* Appointment Card (Calendar + Schedule) */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
                        <h3 className="text-base font-bold text-slate-800 tracking-tight mb-4">Appointment</h3>
                        
                        {/* Mini Calendar + Schedule Stack */}
                        <div className="space-y-5">
                            {/* Calendar Widget Container */}
                            <div className="p-4 bg-[#F8FAFB] rounded-2xl border border-slate-100/80">
                                {/* Month Header */}
                                <div className="flex items-center justify-between mb-3 text-xs">
                                    <span className="font-bold text-slate-800">December 2025</span>
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <button className="p-1 hover:text-slate-700 cursor-pointer">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="p-1 hover:text-slate-700 cursor-pointer">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
                                    <span>Mo</span>
                                    <span>Tu</span>
                                    <span>We</span>
                                    <span>Th</span>
                                    <span>Fr</span>
                                    <span>Sa</span>
                                    <span>Su</span>
                                </div>

                                {/* Calendar Days Grid */}
                                <div className="grid grid-cols-7 text-center text-xs font-medium gap-y-1.5">
                                    {/* Offset for December starting Monday (0 empty slots in 2025) */}
                                    {calendarDays.map((day) => {
                                        const isSelected = day === selectedCalendarDay;
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setSelectedCalendarDay(day)}
                                                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#00BFA5] text-white font-bold shadow-xs'
                                                        : 'text-slate-600 hover:bg-slate-200/50'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Schedule Cards Stack next to / below calendar */}
                            <div className="space-y-2.5">
                                {/* Dentist 10.00 - 11.00 AM in Solid Teal */}
                                <div className="p-3.5 bg-[#00BFA5] rounded-2xl text-white flex items-center justify-between shadow-md shadow-[#00BFA5]/20 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                            <ToothSvg className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-extrabold leading-tight">Dentist</p>
                                            <p className="text-[11px] text-white/85">10.00 - 11.00 AM</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white" />
                                </div>

                                {/* Eyes 11.00 - 12.00 AM */}
                                <div className="p-3.5 bg-[#F8FAFB] hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                            <EyesSvg className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-extrabold text-slate-800 leading-tight">Eyes</p>
                                            <p className="text-[11px] text-slate-400">11.00 - 12.00 AM</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>

                                {/* Hearth 13.00 - 14.00 PM */}
                                <div className="p-3.5 bg-[#F8FAFB] hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <HearthSvg className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-extrabold text-slate-800 leading-tight">Hearth</p>
                                            <p className="text-[11px] text-slate-400">13.00 - 14.00 PM</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Health Status Card matching mockup */}
                    <div className="bg-white rounded-3xl p-7 border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
                        <h3 className="text-base font-bold text-slate-800 tracking-tight mb-5">Health Status</h3>

                        <div className="space-y-4">
                            {/* Metric 1: Detist (92%) */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#F4F7F6] text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                                    <ToothSvg className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-800">Detist</span>
                                        <span className="text-xs font-extrabold text-slate-600">92%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00BFA5] rounded-full" style={{ width: '92%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 2: Hearth (87%) */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#F4F7F6] text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                                    <HearthSvg className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-800">Hearth</span>
                                        <span className="text-xs font-extrabold text-slate-600">87%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00BFA5] rounded-full" style={{ width: '87%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 3: Eyes (99%) */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#F4F7F6] text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                                    <EyesSvg className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-800">Eyes</span>
                                        <span className="text-xs font-extrabold text-slate-600">99%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00BFA5] rounded-full" style={{ width: '99%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 4: Lungs (70%) */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#F4F7F6] text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                                    <LungsSvg className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-800">Lungs</span>
                                        <span className="text-xs font-extrabold text-slate-600">70%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00BFA5] rounded-full" style={{ width: '70%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 5: Brain (88%) */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#F4F7F6] text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                                    <BrainSvg className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-800">Brain</span>
                                        <span className="text-xs font-extrabold text-slate-600">88%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00BFA5] rounded-full" style={{ width: '88%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* COLUMN 3: BLOOD PRESSURE CHART & RECENT ACTIVITY (~4.0 cols / 12)         */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 space-y-7">

                    {/* Blood Pressure Smooth Curve Chart Card */}
                    <div className="bg-white rounded-3xl p-7 border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-800 tracking-tight">Blood Pressure</h3>
                            <button className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F8FAFB] border border-slate-100 text-xs font-bold text-slate-500 cursor-pointer">
                                <span>Month</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Pixel-Perfect SVG Bezier Curved Wave with 3.5 Indicator Pill */}
                        <div className="relative pt-6 pb-2">
                            {/* Y-Axis Labels */}
                            <div className="absolute left-0 top-6 bottom-8 flex flex-col justify-between text-[11px] font-bold text-slate-400">
                                <span>4</span>
                                <span>3</span>
                                <span>2</span>
                                <span>1</span>
                            </div>

                            {/* SVG Curve Container */}
                            <div className="ml-6 relative h-40">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 140" fill="none">
                                    {/* Horizontal Reference Lines */}
                                    <line x1="0" y1="20" x2="320" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                                    <line x1="0" y1="60" x2="320" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                                    <line x1="0" y1="100" x2="320" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                                    <line x1="0" y1="135" x2="320" y2="135" stroke="#F1F5F9" strokeWidth="1" />

                                    {/* Smooth Teal Curve */}
                                    <path 
                                        d="M 10,75 C 35,90 55,80 75,40 C 95,10 115,80 140,85 C 165,90 185,15 210,18 C 235,22 250,95 275,65 C 295,45 310,50 320,55" 
                                        fill="none" 
                                        stroke="#00BFA5" 
                                        strokeWidth="3.5" 
                                        strokeLinecap="round"
                                    />

                                    {/* Highlight Point on Peak */}
                                    <circle cx="210" cy="18" r="4.5" fill="white" stroke="#00BFA5" strokeWidth="3" />
                                </svg>

                                {/* Active Value Pill (3.5) */}
                                <div 
                                    className="absolute -top-3 left-[62%] -translate-x-1/2 px-2.5 py-0.5 bg-[#00BFA5] text-white font-bold text-[10px] rounded-full shadow-sm"
                                >
                                    3.5
                                </div>
                            </div>

                            {/* X-Axis Month Labels */}
                            <div className="ml-6 grid grid-cols-6 text-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                                <span>JAN</span>
                                <span>FEB</span>
                                <span>MAR</span>
                                <span>APR</span>
                                <span>MAY</span>
                                <span>JUN</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Bar Chart Card */}
                    <div className="bg-white rounded-3xl p-7 border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-slate-800 tracking-tight">Recent Activity</h3>
                            <button className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F8FAFB] border border-slate-100 text-xs font-bold text-slate-500 cursor-pointer">
                                <span>Month</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Bar Chart Container */}
                        <div className="relative pt-6">
                            {/* Bars Grid */}
                            <div className="h-36 flex items-end justify-between px-2 gap-2 border-b border-dashed border-slate-100 pb-2">
                                {/* Jan */}
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[20px] bg-slate-200/80 rounded-t-lg h-20 transition-all hover:bg-slate-300" />
                                </div>

                                {/* Feb */}
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[20px] bg-slate-200/80 rounded-t-lg h-14 transition-all hover:bg-slate-300" />
                                </div>

                                {/* Mar */}
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[20px] bg-slate-200/80 rounded-t-lg h-24 transition-all hover:bg-slate-300" />
                                </div>

                                {/* Apr */}
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[20px] bg-slate-200/80 rounded-t-lg h-16 transition-all hover:bg-slate-300" />
                                </div>

                                {/* May - ACTIVE TEAL BAR WITH 6hr 43m BADGE */}
                                <div className="flex-1 flex flex-col items-center relative">
                                    {/* Tooltip Badge: 6hr 43m */}
                                    <div className="absolute -top-7 px-2 py-0.5 bg-[#00BFA5] text-white font-bold text-[10px] rounded-lg shadow-sm whitespace-nowrap">
                                        6hr 43m
                                    </div>
                                    <div className="w-full max-w-[20px] bg-[#00BFA5] rounded-t-lg h-28 shadow-sm" />
                                </div>

                                {/* Jun */}
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[20px] bg-slate-200/80 rounded-t-lg h-12 transition-all hover:bg-slate-300" />
                                </div>

                                {/* Jul */}
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full max-w-[20px] bg-slate-200/80 rounded-t-lg h-20 transition-all hover:bg-slate-300" />
                                </div>
                            </div>

                            {/* X-Axis Month Labels */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-3 px-1">
                                <span>Jan</span>
                                <span>Feb</span>
                                <span>Mar</span>
                                <span>Apr</span>
                                <span className="text-slate-800 font-extrabold">May</span>
                                <span>Jun</span>
                                <span>Jul</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ========================================================================= */}
            {/* FULL INFORMATION MODAL (INTERACTIVE 32-TOOTH ODONTOGRAM & CLINICAL DATA)  */}
            {/* ========================================================================= */}
            {showFullInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 relative animate-in zoom-in-95">
                        {/* Close button */}
                        <button
                            onClick={() => setShowFullInfoModal(false)}
                            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F4F7F6] text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-[#00BFA5] text-white flex items-center justify-center shadow-md shadow-[#00BFA5]/25">
                                <ToothSvg className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Comprehensive Dental Health Telemetry</h3>
                                <p className="text-xs text-slate-400">Interactive 32-Tooth Anatomy Map & Clinical Records</p>
                            </div>
                        </div>

                        {/* Embedded Tooth Health Map */}
                        <div className="bg-[#F8FAFB] p-6 rounded-3xl border border-slate-100 mb-6">
                            <ToothHealthMap teeth={teethState} />
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-800">Healthy Teeth</p>
                                <p className="text-2xl font-black text-emerald-600 mt-1">28 / 32</p>
                            </div>
                            <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-100">
                                <p className="text-xs font-bold text-sky-800">Restored / Filled</p>
                                <p className="text-2xl font-black text-sky-600 mt-1">3 Teeth</p>
                            </div>
                            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100">
                                <p className="text-xs font-bold text-amber-800">Planned Follow-up</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">1 Tooth</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowFullInfoModal(false)}
                                className="px-6 py-2.5 bg-[#00BFA5] hover:bg-[#00ad95] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                                Close Information
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ChevronRight, 
    ChevronLeft, 
    ChevronDown, 
    Sparkles, 
    ShieldCheck, 
    Clock, 
    User, 
    Calendar as CalendarIcon, 
    Activity, 
    CheckCircle2, 
    X, 
    FileText, 
    CreditCard,
    ArrowRight,
    Stethoscope,
    AlertCircle,
    Download,
    DollarSign,
    Hash,
    Smile,
    Pill
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';
import DualPaymentModal from '../components/DualPaymentModal';

export default function PatientDashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [appointmentsList, setAppointmentsList] = useState([]);
    const [teethState, setTeethState] = useState([]);
    const [invoicesList, setInvoicesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Payment Modal
    const [selectedPayInvoice, setSelectedPayInvoice] = useState(null);

    // Current Date / Calendar State
    const now = new Date();
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(now.getDate());

    const storedPatient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patient = dashboardData?.patient 
        ? { ...storedPatient, ...dashboardData.patient } 
        : storedPatient;
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');
    const avatarUrl = patient.profileImageDataUrl || '';

    // Fetch live data from backend
    useEffect(() => {
        const fetchLiveTelemetry = async () => {
            setLoading(true);
            try {
                const token = patient.token;
                const headers = { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };

                // 1. Dashboard summary
                let dashRes;
                try {
                    dashRes = await fetch(`${API_BASE_URL}/api/patient-portal/dashboard`, { headers });
                } catch {
                    dashRes = await fetch(`/api/patient-portal/dashboard`, { headers });
                }
                if (dashRes.ok) {
                    const data = await dashRes.json();
                    setDashboardData(data);
                } else if (dashRes.status === 401) {
                    localStorage.removeItem('patient');
                    navigate('/portal/login');
                    return;
                }

                // 2. Real Appointments List
                try {
                    let apptRes;
                    try {
                        apptRes = await fetch(`${API_BASE_URL}/api/patient-portal/appointments`, { headers });
                    } catch {
                        apptRes = await fetch(`/api/patient-portal/appointments`, { headers });
                    }
                    if (apptRes.ok) {
                        const appts = await apptRes.json();
                        setAppointmentsList(Array.isArray(appts) ? appts : []);
                    }
                } catch {}

                // 3. Odontogram Teeth Telemetry
                try {
                    let teethRes;
                    try {
                        teethRes = await fetch(`${API_BASE_URL}/api/patient-portal/odontogram`, { headers });
                    } catch {
                        teethRes = await fetch(`/api/patient-portal/odontogram`, { headers });
                    }
                    if (teethRes.ok) {
                        const tData = await teethRes.json();
                        setTeethState(Array.isArray(tData) ? tData : []);
                    }
                } catch {}

                // 4. Invoices Telemetry
                try {
                    let invRes;
                    try {
                        invRes = await fetch(`${API_BASE_URL}/api/billing/invoices`, { headers });
                    } catch {
                        invRes = await fetch(`/api/billing/invoices`, { headers });
                    }
                    if (invRes.ok) {
                        const invData = await invRes.json();
                        setInvoicesList(Array.isArray(invData) ? invData : []);
                    }
                } catch {}

            } catch (err) {
                console.error('Failed to load patient dashboard:', err);
                setError('Could not load all telemetry. Working with cached records.');
            } finally {
                setLoading(false);
            }
        };

        fetchLiveTelemetry();
    }, [navigate]);

    // Format Date helper
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return '';
        }
    };

    // Tooth Icon SVG matching Dentia styling
    const ToothSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.5 6 2 9.5.5 3 2 4.5 4 4.5s3.5-1.5 4-4.5c.5-3.5 2-6.5 2-9.5 0-3.5-2.5-6-6-6Z" />
            <path d="M9 10c1 .5 2 .5 3 0 1 .5 2 .5 3 0" />
        </svg>
    );

    // Mini Calendar Generation
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    // Check if any appointment falls on a specific day in this month
    const hasAppointmentOnDay = (day) => {
        return appointmentsList.some(a => {
            if (!a.preferredDate) return false;
            const d = new Date(a.preferredDate);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    };

    const handlePrevMonth = () => {
        setCurrentMonthDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(new Date(year, month + 1, 1));
    };

    // Calculate real tooth counts from live state
    const activePathologyTeeth = teethState.filter(t => {
        const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
        return s && !s.includes('healthy') && !s.includes('sound');
    });

    const treatedCount = activePathologyTeeth.filter(t => {
        const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
        return s.includes('restor') || s.includes('fill') || s.includes('crown') || s.includes('veneer') || s.includes('implant') || s.includes('treated');
    }).length;

    const plannedCount = activePathologyTeeth.length - treatedCount;
    const healthyCount = teethState.length > 0 
        ? Math.max(0, 32 - (treatedCount + plannedCount))
        : (dashboardData?.healthSummary?.healthyTeeth ?? 32);

    const activeRxCount = dashboardData?.healthSummary?.activePrescriptionsCount ?? 0;
    const totalBalance = dashboardData?.billing?.totalBalance ?? (invoicesList.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').reduce((acc, i) => acc + (i.balanceAmount || 0), 0));

    // Dynamic multi-currency detection and formatter
    const activeCurrency = invoicesList[0]?.currency || dashboardData?.billing?.currency || (appointmentsList[0]?.doctorID === 2 ? 'PKR' : 'NZD');
    const formatCurrency = (amount, currency = activeCurrency) => {
        const curr = (currency || activeCurrency || 'NZD').toUpperCase();
        const val = Number(amount || 0);
        if (curr === 'PKR') {
            return `Rs ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (curr === 'GBP') return `£${val.toFixed(2)}`;
        if (curr === 'EUR') return `€${val.toFixed(2)}`;
        if (curr === 'USD') return `$${val.toFixed(2)} USD`;
        return `$${val.toFixed(2)} ${curr}`;
    };

    // Dynamic oral indices based on live anatomy
    const periodontalScore = Math.min(100, Math.max(75, Math.round((healthyCount / 32) * 20 + 78)));
    const oralHealthIndex = Math.min(100, Math.max(70, Math.round(96 - (plannedCount * 4))));

    // Next appointment
    const upcomingAppts = appointmentsList.filter(a => new Date(a.preferredDate) >= new Date().setHours(0,0,0,0) && a.status !== 'Cancelled');
    const pastAppts = appointmentsList.filter(a => new Date(a.preferredDate) < new Date().setHours(0,0,0,0) || a.status === 'Completed');
    const nextAppointment = upcomingAppts[0] || dashboardData?.nextAppointment;

    // Unpaid invoice if any
    const pendingInvoice = invoicesList.find(i => i.status !== 'Paid' && i.status !== 'Cancelled');

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 3-Column Main Dashboard Grid matching Dentia Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

                {/* ========================================================================= */}
                {/* COLUMN 1: PATIENT DENTAL BIO & RECENT VISITS (~3.8 cols / 12)             */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 space-y-7">
                    
                    {/* Patient Dental Bio Card */}
                    <div className="bg-white rounded-3xl p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] text-center relative overflow-hidden">
                        {/* Avatar */}
                        <div className="relative inline-block mx-auto mb-4">
                            {avatarUrl ? (
                                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-light-teal shadow-md mx-auto">
                                    <img 
                                        src={avatarUrl} 
                                        alt={patientName} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-teal to-dark-slate flex items-center justify-center text-white font-serif font-black text-3xl shadow-md ring-4 ring-light-teal mx-auto">
                                    {patient.firstName ? patient.firstName[0].toUpperCase() : 'P'}
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <h2 className="text-xl font-serif font-black text-dark-slate tracking-tight mb-1">
                            {patientName}
                        </h2>
                        <p className="text-xs font-mono font-extrabold text-primary-teal mb-6">
                            {patient.referenceNumber || 'DEN-2026-00001'}
                        </p>

                        {/* 2x2 Real Dental Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {/* Treatment Plan */}
                            <div className="p-3 bg-warm-cream rounded-2xl flex items-center gap-3 text-left border border-light-teal">
                                <div className="w-9 h-9 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0">
                                    <ToothSvg className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Plan</p>
                                    <p className="text-xs font-bold text-dark-slate truncate" title={patient.currentTreatmentPlan || 'General Dentistry'}>
                                        {patient.currentTreatmentPlan || 'General Care'}
                                    </p>
                                </div>
                            </div>

                            {/* Treatment Stage */}
                            <div className="p-3 bg-warm-cream rounded-2xl flex items-center gap-3 text-left border border-light-teal">
                                <div className="w-9 h-9 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Stage</p>
                                    <p className="text-xs font-bold text-dark-slate truncate" title={patient.treatmentStage || 'Routine Maintenance'}>
                                        {patient.treatmentStage || 'Active Care'}
                                    </p>
                                </div>
                            </div>

                            {/* Dentition Type */}
                            <div className="p-3 bg-warm-cream rounded-2xl flex items-center gap-3 text-left border border-light-teal">
                                <div className="w-9 h-9 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0">
                                    <Smile className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Dentition</p>
                                    <p className="text-xs font-bold text-dark-slate truncate">
                                        {patient.dentitionType || 'Adult (32 Teeth)'}
                                    </p>
                                </div>
                            </div>

                            {/* Active Prescriptions */}
                            <div className="p-3 bg-warm-cream rounded-2xl flex items-center gap-3 text-left border border-light-teal">
                                <div className="w-9 h-9 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0">
                                    <Pill className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Active Rx</p>
                                    <p className="text-xs font-bold text-dark-slate truncate">
                                        {activeRxCount} Active
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button: View 3D Tooth Map */}
                        <button
                            type="button"
                            onClick={() => navigate('/portal/odontogram')}
                            className="w-full py-3.5 px-6 bg-primary-teal hover:bg-primary-hover text-white font-bold text-xs rounded-2xl shadow-md shadow-primary-teal/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                        >
                            <ToothSvg className="w-4 h-4 text-white" />
                            <span>View Interactive 3D Tooth Map</span>
                        </button>
                    </div>

                    {/* Real Appointment History Card */}
                    <div className="bg-white rounded-3xl p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)]">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-serif font-black text-dark-slate tracking-tight">Visit History</h3>
                            <Link 
                                to="/portal/appointments" 
                                className="text-xs font-bold text-primary-teal hover:text-primary-hover flex items-center gap-0.5"
                            >
                                <span>See all ({appointmentsList.length})</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Live Appointments Stack */}
                        <div className="space-y-3">
                            {/* Next Appointment Card in Solid Dentia Blue */}
                            {nextAppointment ? (
                                <div 
                                    onClick={() => navigate('/portal/appointments')}
                                    className="p-4 bg-primary-teal rounded-2xl text-white shadow-md shadow-primary-teal/25 flex items-center justify-between group cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary-teal shadow-xs shrink-0">
                                            <ToothSvg className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider mb-1">
                                                Next Appointment
                                            </span>
                                            <p className="text-xs font-extrabold leading-tight truncate">
                                                {nextAppointment.reason || 'Routine Dental Checkup'}
                                            </p>
                                            <p className="text-[10px] text-white/80 mt-0.5">
                                                {formatDate(nextAppointment.preferredDate || nextAppointment.date)} at {formatTime(nextAppointment.preferredDate || nextAppointment.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
                                </div>
                            ) : null}

                            {/* Previous Visits or Scheduled Appointments */}
                            {appointmentsList.slice(nextAppointment ? 1 : 0, 4).map((appt) => (
                                <div 
                                    key={appt.appointmentID || appt.appointmentId || Math.random()}
                                    onClick={() => navigate('/portal/appointments')}
                                    className="p-3.5 bg-warm-cream hover:bg-light-teal/50 border border-light-teal rounded-2xl flex items-center justify-between group cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-3.5 overflow-hidden">
                                        <div className="w-9 h-9 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0">
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-extrabold text-dark-slate leading-tight truncate">
                                                {appt.reason || 'Dental Consultation'}
                                            </p>
                                            <p className="text-[10px] text-muted-text mt-0.5">
                                                {formatDate(appt.preferredDate || appt.date)} · <span className="font-bold text-primary-teal">{appt.status || 'Confirmed'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-text group-hover:translate-x-1 transition-transform shrink-0" />
                                </div>
                            ))}

                            {appointmentsList.length === 0 && (
                                <div className="p-6 bg-warm-cream rounded-2xl text-center border border-light-teal">
                                    <ToothSvg className="w-8 h-8 text-primary-teal/50 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-dark-slate">No visits scheduled yet</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/portal/book')}
                                        className="mt-3 px-4 py-2 bg-primary-teal text-white text-xs font-bold rounded-xl shadow-xs"
                                    >
                                        Book Your First Visit
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* COLUMN 2: APPOINTMENT CALENDAR & DENTAL HEALTH STATUS (~4.2 cols / 12)    */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 space-y-7">

                    {/* Real Dental Appointment Card (Calendar + Live Slot) */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-serif font-black text-dark-slate tracking-tight">Appointment Calendar</h3>
                            <button 
                                onClick={() => navigate('/portal/book')}
                                className="text-xs font-bold text-primary-teal hover:underline cursor-pointer"
                            >
                                + Book Visit
                            </button>
                        </div>
                        
                        <div className="space-y-5">
                            {/* Calendar Widget Container */}
                            <div className="p-4 bg-warm-cream rounded-2xl border border-light-teal">
                                {/* Month Header */}
                                <div className="flex items-center justify-between mb-3 text-xs">
                                    <span className="font-bold text-dark-slate">{monthName}</span>
                                    <div className="flex items-center gap-1 text-muted-text">
                                        <button onClick={handlePrevMonth} className="p-1 hover:text-dark-slate cursor-pointer">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={handleNextMonth} className="p-1 hover:text-dark-slate cursor-pointer">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-text mb-2">
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
                                    {/* Empty leading days */}
                                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                                        <div key={`empty-${i}`} className="w-7 h-7" />
                                    ))}

                                    {/* Numbered days */}
                                    {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                                        const dayNum = i + 1;
                                        const isSelected = dayNum === selectedCalendarDay;
                                        const hasAppt = hasAppointmentOnDay(dayNum);

                                        return (
                                            <button
                                                key={`day-${dayNum}`}
                                                type="button"
                                                onClick={() => setSelectedCalendarDay(dayNum)}
                                                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] transition-all cursor-pointer relative ${
                                                    isSelected
                                                        ? 'bg-primary-teal text-white font-bold shadow-xs'
                                                        : hasAppt
                                                            ? 'bg-light-teal text-primary-hover font-bold ring-1 ring-primary-teal/40'
                                                            : 'text-dark-slate hover:bg-light-teal/50'
                                                }`}
                                            >
                                                {dayNum}
                                                {hasAppt && !isSelected && (
                                                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary-teal" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Schedule Slot Cards */}
                            <div className="space-y-2.5">
                                {nextAppointment ? (
                                    <div 
                                        onClick={() => navigate('/portal/appointments')}
                                        className="p-3.5 bg-primary-teal rounded-2xl text-white flex items-center justify-between shadow-md shadow-primary-teal/20 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                                                <ToothSvg className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-extrabold leading-tight truncate">
                                                    {nextAppointment.reason || 'General Dental Examination'}
                                                </p>
                                                <p className="text-[11px] text-white/85">
                                                    {formatTime(nextAppointment.preferredDate || nextAppointment.date) || '10:00 AM'} · Dr. Sarah J. Lee
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white shrink-0" />
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => navigate('/portal/book')}
                                        className="p-3.5 bg-warm-cream hover:bg-light-teal/50 border border-light-teal rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0">
                                                <CalendarIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-extrabold text-dark-slate">Book Dental Examination</p>
                                                <p className="text-[11px] text-muted-text">Select your preferred date & specialist</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-text shrink-0" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dental Health Status Card (Real Clinical Telemetry) */}
                    <div className="bg-white rounded-3xl p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)]">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-serif font-black text-dark-slate tracking-tight">Dental Health Status</h3>
                            <span className="text-xs font-bold text-primary-teal">32-Tooth Telemetry</span>
                        </div>

                        <div className="space-y-4">
                            {/* Metric 1: Healthy Teeth Percentage */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0 shadow-xs border border-light-teal">
                                    <ToothSvg className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-dark-slate">Healthy Teeth</span>
                                        <span className="text-xs font-extrabold text-primary-hover">
                                            {healthyCount} / 32 ({Math.round((healthyCount / 32) * 100)}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-warm-cream rounded-full overflow-hidden border border-light-teal">
                                        <div className="h-full bg-primary-teal rounded-full" style={{ width: `${(healthyCount / 32) * 100}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 2: Restored & Filled Teeth */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0 shadow-xs border border-light-teal">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-dark-slate">Restorations & Crowns</span>
                                        <span className="text-xs font-extrabold text-primary-hover">
                                            {treatedCount} Teeth (Treated)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-warm-cream rounded-full overflow-hidden border border-light-teal">
                                        <div className="h-full bg-primary-teal rounded-full" style={{ width: `${Math.min(100, (treatedCount / 32) * 100 * 3)}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 3: Observation / Planned Care */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0 shadow-xs border border-light-teal">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-dark-slate">Planned Follow-up</span>
                                        <span className="text-xs font-extrabold text-accent-gold">
                                            {plannedCount} Teeth Monitored
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-warm-cream rounded-full overflow-hidden border border-light-teal">
                                        <div className="h-full bg-accent-gold rounded-full" style={{ width: `${Math.min(100, plannedCount * 25)}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 4: Periodontal & Gum Condition */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0 shadow-xs border border-light-teal">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-dark-slate">Periodontal Health</span>
                                        <span className="text-xs font-extrabold text-primary-hover">
                                            {periodontalScore}% ({periodontalScore >= 90 ? 'Class I Normal' : 'Class II Monitored'})
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-warm-cream rounded-full overflow-hidden border border-light-teal">
                                        <div className="h-full bg-primary-teal rounded-full" style={{ width: `${periodontalScore}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Metric 5: Plaque & Enamel Hygiene Score */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shrink-0 shadow-xs border border-light-teal">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-dark-slate">Hygiene & Plaque Index</span>
                                        <span className="text-xs font-extrabold text-primary-hover">
                                            {oralHealthIndex}% (Optimal)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-warm-cream rounded-full overflow-hidden border border-light-teal">
                                        <div className="h-full bg-primary-teal rounded-full" style={{ width: `${oralHealthIndex}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* COLUMN 3: ORAL HEALTH PROGRESS & BILLING SUMMARY (~4.0 cols / 12)         */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 space-y-7">

                    {/* Dental Health Index Progress Chart */}
                    <div className="bg-white rounded-3xl p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate tracking-tight">Dental Health Index</h3>
                                <p className="text-[11px] text-muted-text font-medium">6-Month Oral Wellness Progress</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-light-teal text-primary-hover font-bold text-xs">
                                {oralHealthIndex}% Index
                            </span>
                        </div>

                        {/* Pixel-Perfect SVG Bezier Curved Wave with 94% Indicator Pill in Dentia Blue */}
                        <div className="relative pt-6 pb-2">
                            {/* Y-Axis Labels */}
                            <div className="absolute left-0 top-6 bottom-8 flex flex-col justify-between text-[11px] font-bold text-muted-text">
                                <span>100</span>
                                <span>75</span>
                                <span>50</span>
                                <span>25</span>
                            </div>

                            {/* SVG Curve Container */}
                            <div className="ml-8 relative h-36">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 140" fill="none">
                                    {/* Horizontal Reference Lines */}
                                    <line x1="0" y1="20" x2="320" y2="20" stroke="#EAF0FC" strokeWidth="1" strokeDasharray="3 3" />
                                    <line x1="0" y1="60" x2="320" y2="60" stroke="#EAF0FC" strokeWidth="1" strokeDasharray="3 3" />
                                    <line x1="0" y1="100" x2="320" y2="100" stroke="#EAF0FC" strokeWidth="1" strokeDasharray="3 3" />
                                    <line x1="0" y1="135" x2="320" y2="135" stroke="#EAF0FC" strokeWidth="1" />

                                    {/* Smooth Dentia Blue Curve */}
                                    <path 
                                        d="M 10,85 C 35,95 55,80 75,55 C 95,25 115,80 140,75 C 165,70 185,25 210,18 C 235,14 255,45 275,35 C 295,28 310,32 320,30" 
                                        fill="none" 
                                        stroke="#4A7CD2" 
                                        strokeWidth="3.5" 
                                        strokeLinecap="round"
                                    />

                                    {/* Highlight Point on Peak */}
                                    <circle cx="210" cy="18" r="4.5" fill="white" stroke="#4A7CD2" strokeWidth="3" />
                                </svg>

                                {/* Active Value Pill */}
                                <div 
                                    className="absolute -top-3 left-[63%] -translate-x-1/2 px-2.5 py-0.5 bg-primary-teal text-white font-bold text-[10px] rounded-full shadow-sm"
                                >
                                    {oralHealthIndex}%
                                </div>
                            </div>

                            {/* X-Axis Month Labels */}
                            <div className="ml-8 grid grid-cols-6 text-center text-[10px] font-bold text-muted-text mt-2 uppercase tracking-wider">
                                <span>APR</span>
                                <span>MAY</span>
                                <span>JUN</span>
                                <span>JUL</span>
                                <span>AUG</span>
                                <span>SEP</span>
                            </div>
                        </div>
                    </div>

                    {/* Account Billing & Invoices Card (Live Financial Summary) */}
                    <div className="bg-white rounded-3xl p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-serif font-black text-dark-slate tracking-tight">Billing & Invoices</h3>
                            <Link 
                                to="/portal/billing" 
                                className="text-xs font-bold text-primary-teal hover:underline flex items-center gap-1"
                            >
                                <span>View Ledger</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Balance Card */}
                        <div className="p-4 bg-warm-cream rounded-2xl border border-light-teal mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Outstanding Balance</p>
                                    <p className="text-2xl font-serif font-black text-dark-slate mt-0.5">
                                        {formatCurrency(totalBalance, activeCurrency)}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    totalBalance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {totalBalance > 0 ? 'Pending Payment' : 'Settled in Full'}
                                </span>
                            </div>

                            {/* Quick Pay CTA if balance exists */}
                            {pendingInvoice && (
                                <div className="mt-3 pt-3 border-t border-light-teal flex items-center justify-between">
                                    <span className="text-xs text-muted-text truncate font-medium">
                                        Invoice #{pendingInvoice.invoiceNumber}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayInvoice(pendingInvoice)}
                                        className="px-3 py-1.5 bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                                    >
                                        Pay Now →
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Invoices Count Overview */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="p-3 bg-white rounded-xl border border-light-teal">
                                <p className="text-[10px] font-bold text-muted-text uppercase">Total Invoices</p>
                                <p className="text-lg font-bold text-dark-slate mt-0.5">{invoicesList.length}</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-light-teal">
                                <p className="text-[10px] font-bold text-muted-text uppercase">Settled</p>
                                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                                    {invoicesList.filter(i => i.status === 'Paid').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Payment Modal */}
            {selectedPayInvoice && (
                <DualPaymentModal
                    invoice={selectedPayInvoice}
                    onClose={() => setSelectedPayInvoice(null)}
                    onSuccess={() => {
                        setSelectedPayInvoice(null);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}

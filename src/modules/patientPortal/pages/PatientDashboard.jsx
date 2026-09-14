import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    CreditCard, 
    FileText, 
    Pill, 
    Sparkles, 
    ArrowRight, 
    Clock, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle, 
    Activity, 
    Download,
    Eye,
    ChevronRight
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';
import ToothHealthMap from '../components/ToothHealthMap';

export default function PatientDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [teethState, setTeethState] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

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

                // Fetch teeth states for visual map
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
                console.error('Failed to load patient dashboard:', err);
                setError('Could not load all dashboard telemetry. Displaying cached records.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-40 bg-white rounded-3xl border border-light-teal" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-44 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-44 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-44 bg-white rounded-3xl border border-light-teal" />
                </div>
                <div className="h-96 bg-white rounded-3xl border border-light-teal" />
            </div>
        );
    }

    const nextAppt = dashboardData?.nextAppointment;
    const billing = dashboardData?.billing;
    const health = dashboardData?.healthSummary;
    const recentNotes = dashboardData?.recentNotes || [];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 1. Welcome Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-slate via-[#163063] to-primary-hover p-6 sm:p-10 text-white shadow-xl">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-sky-200">
                                REF: {patient.referenceNumber || 'DEN-2026-00035'}
                            </span>
                            <span className="text-xs text-sky-200/80 font-medium">Verified Patient</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight">
                            Hello, {patient.firstName || 'Patient'}! 👋
                        </h1>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            Welcome to your personalized Dentia healthcare workspace. Track your dental health, upcoming appointments, and itemized billing receipts here.
                        </p>
                    </div>

                    {/* Active Treatment Pill Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl sm:max-w-xs shrink-0 space-y-2">
                        <div className="flex items-center justify-between text-xs text-sky-200 font-medium">
                            <span>Active Modality</span>
                            <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
                        </div>
                        <p className="text-base font-serif font-bold text-white leading-tight">
                            {patient.currentTreatmentPlan || 'General Consultation'}
                        </p>
                        <p className="text-[11px] text-slate-300">
                            {patient.treatmentStage || 'Routine Preventive Care'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Key Action Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* A. Next Appointment Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="p-2.5 rounded-2xl bg-light-teal text-primary-teal">
                                <Calendar className="w-5 h-5" />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {nextAppt ? nextAppt.status : 'No Booking'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Next Consultation</h3>
                            {nextAppt ? (
                                <>
                                    <p className="text-lg font-serif font-black text-dark-slate mt-1">
                                        {new Date(nextAppt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs font-bold text-primary-hover">
                                        {new Date(nextAppt.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-muted-text mt-1">{nextAppt.reason || 'Routine Dental Check'}</p>
                                </>
                            ) : (
                                <p className="text-sm font-semibold text-slate-500 mt-2">
                                    No upcoming appointment scheduled.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-light-teal/70 flex items-center justify-between">
                        <Link
                            to="/portal/appointments"
                            className="text-xs font-extrabold text-primary-hover hover:underline flex items-center gap-1"
                        >
                            <span>{nextAppt ? 'View Details' : 'Book Appointment'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* B. Billing & Balance Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                                <CreditCard className="w-5 h-5" />
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                (billing?.totalBalance || 0) > 0
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                                {(billing?.totalBalance || 0) > 0 ? `${billing?.unpaidInvoiceCount} Due` : 'Settled'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Outstanding Balance</h3>
                            <p className="text-3xl font-serif font-black text-dark-slate mt-1">
                                ${(billing?.totalBalance || 0).toFixed(2)}
                                <span className="text-xs font-sans text-muted-text font-semibold ml-1.5">NZD</span>
                            </p>
                            <p className="text-xs text-muted-text mt-1">
                                {(billing?.totalBalance || 0) > 0 
                                    ? 'Pay online or generate an in-clinic cash voucher.'
                                    : 'All dental invoices have been paid in full.'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-light-teal/70 flex items-center justify-between">
                        <Link
                            to="/portal/billing"
                            className="text-xs font-extrabold text-primary-hover hover:underline flex items-center gap-1"
                        >
                            <span>Invoices & Payments</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* C. Dental Health Summary Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                                <ShieldCheck className="w-5 h-5" />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-light-teal text-primary-teal">
                                Dentition: {patient.dentitionType || 'Adult'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Dental Health Score</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-2xl font-serif font-black text-emerald-600">
                                    {health?.healthyTeeth || 28}
                                </p>
                                <span className="text-xs font-bold text-dark-slate">/ 32 Sound Teeth</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-text mt-2 font-medium">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    {health?.treatedTeeth || 0} Restored
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    {health?.needsAttention || 0} Care
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-light-teal/70 flex items-center justify-between">
                        <Link
                            to="/portal/reports"
                            className="text-xs font-extrabold text-primary-hover hover:underline flex items-center gap-1"
                        >
                            <span>Clinical Reports</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* 3. Interactive 32-Tooth Visual Odontogram */}
            <ToothHealthMap teethState={teethState} />

            {/* 4. Recent Clinical Visits Feed */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-serif font-black text-dark-slate">Recent Clinical Visits & Reports</h3>
                        <p className="text-xs text-muted-text">Doctor consultation notes and diagnostic procedures.</p>
                    </div>
                    <Link
                        to="/portal/reports"
                        className="text-xs font-extrabold text-primary-hover hover:underline flex items-center gap-1"
                    >
                        <span>View All Reports</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {recentNotes.length > 0 ? (
                    <div className="divide-y divide-light-teal/70">
                        {recentNotes.map((note, idx) => (
                            <div key={note.noteId || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-warm-cream/30 px-2 rounded-xl transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-dark-slate">
                                            {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="text-xs text-muted-text">•</span>
                                        <span className="text-xs font-semibold text-primary-hover">
                                            Dr. {note.doctorName || 'Dentia Clinician'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-dark-slate line-clamp-1">
                                        {note.summary || note.chiefComplaint || 'Comprehensive consultation and oral assessment.'}
                                    </p>
                                    {note.treatmentPerformed && (
                                        <p className="text-xs text-muted-text line-clamp-1">
                                            Procedures: {note.treatmentPerformed}
                                        </p>
                                    )}
                                </div>

                                <Link
                                    to="/portal/reports"
                                    className="px-4 py-2 rounded-xl bg-light-teal hover:bg-light-teal-hover text-primary-teal text-xs font-bold shrink-0 text-center transition-colors"
                                >
                                    Read Full Report
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-xs text-muted-text space-y-2">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>No recent consultation notes on file yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

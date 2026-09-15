import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Calendar, Clock, Plus, XCircle, CheckCircle2, AlertCircle, 
    FileText, Download, ArrowRight, Edit3, Trash2, Search, 
    Check, DollarSign, Stethoscope, RefreshCw, X, Tag
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');
    const [cancellingId, setCancellingId] = useState(null);

    // Edit Treatment Plan Modal State
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [editingProcedures, setEditingProcedures] = useState([]);
    const [editingNotes, setEditingNotes] = useState('');
    const [availableDoctorProcedures, setAvailableDoctorProcedures] = useState([]);
    const [loadingDoctorProcedures, setLoadingDoctorProcedures] = useState(false);
    const [procedureSearch, setProcedureSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [savingPlan, setSavingPlan] = useState(false);
    const [planError, setPlanError] = useState('');

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

    // Currency Formatter
    const formatPrice = (amount, currency = 'NZD') => {
        const num = Number(amount) || 0;
        if (currency === 'PKR') {
            return `Rs ${num.toLocaleString('en-PK')}`;
        }
        return `$${num.toFixed(2)}`;
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = patient.token;
            const headers = { 'Authorization': `Bearer ${token}` };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-portal/appointments`, { headers });
            } catch {
                res = await fetch(`/api/patient-portal/appointments`, { headers });
            }

            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (err) {
            console.error('Failed to load appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load doctors list to display doctor names on appointment cards
    useEffect(() => {
        const loadDoctors = async () => {
            try {
                let res = null;
                try {
                    res = await fetch(`${API_BASE_URL}/api/patient-portal/doctors`);
                } catch {
                    res = null;
                }
                if (!res || !res.ok) {
                    res = await fetch('/api/auth/doctors');
                }
                if (res && res.ok) {
                    const data = await res.json();
                    setDoctors(data);
                }
            } catch (err) {
                console.error('Error fetching doctors:', err);
            }
        };
        loadDoctors();
        fetchAppointments();
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment consultation?')) return;
        setCancellingId(id);

        try {
            const token = patient.token;
            const headers = { 'Authorization': `Bearer ${token}` };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-portal/appointments/${id}/cancel`, {
                    method: 'PUT',
                    headers
                });
            } catch {
                res = await fetch(`/api/patient-portal/appointments/${id}/cancel`, {
                    method: 'PUT',
                    headers
                });
            }

            if (res.ok) {
                setActionMsg('Appointment cancelled successfully.');
                fetchAppointments();
                setTimeout(() => setActionMsg(''), 4000);
            }
        } catch (err) {
            console.error('Cancellation error:', err);
        } finally {
            setCancellingId(null);
        }
    };

    // Open Edit Treatment Plan Modal
    const handleOpenEditPlan = async (appt) => {
        setEditingAppointment(appt);
        setPlanError('');
        setProcedureSearch('');
        setSelectedCategory('All');
        setEditingNotes(appt.reason || '');

        // Map existing items
        if (appt.items && appt.items.length > 0) {
            setEditingProcedures(appt.items.map(item => ({
                procedureCode: item.procedureCode,
                procedureName: item.description,
                price: item.unitPrice
            })));
        } else {
            // Fallback for legacy appointments without structured items
            setEditingProcedures([
                {
                    procedureCode: 'D0120',
                    procedureName: appt.reason || 'General Dental Examination',
                    price: appt.totalAmount || 50
                }
            ]);
        }

        // Fetch doctor's fee schedule
        const docId = appt.doctorID || 2;
        setLoadingDoctorProcedures(true);
        try {
            let res = null;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${docId}`);
            } catch {
                res = null;
            }
            if (!res || !res.ok) {
                res = await fetch(`/api/treatment-pricing/doctor/${docId}`);
            }
            if (res && res.ok) {
                const data = await res.json();
                setAvailableDoctorProcedures(data.procedures || []);
            }
        } catch (err) {
            console.error('Error fetching doctor fee schedule:', err);
        } finally {
            setLoadingDoctorProcedures(false);
        }
    };

    // Add procedure in modal
    const handleAddProcedure = (proc) => {
        const code = proc.procedureCode || proc.code || 'GEN';
        const name = proc.procedureName || proc.name || proc.description;
        const fee = Number(proc.standardFee != null ? proc.standardFee : proc.price) || 0;

        // Check if already added
        if (editingProcedures.some(p => p.procedureCode === code)) {
            setPlanError(`"${name}" is already included in your treatment plan.`);
            setTimeout(() => setPlanError(''), 3000);
            return;
        }

        setEditingProcedures(prev => [
            ...prev,
            {
                procedureCode: code,
                procedureName: name,
                price: fee
            }
        ]);
        setPlanError('');
    };

    // Remove procedure in modal
    const handleRemoveProcedure = (index) => {
        if (editingProcedures.length <= 1) {
            setPlanError('An appointment must have at least one scheduled treatment or consultation.');
            setTimeout(() => setPlanError(''), 3500);
            return;
        }
        setEditingProcedures(prev => prev.filter((_, i) => i !== index));
        setPlanError('');
    };

    // Save updated treatment plan
    const handleSaveTreatmentPlan = async () => {
        if (!editingAppointment) return;
        if (editingProcedures.length === 0) {
            setPlanError('Please select at least one treatment before saving.');
            return;
        }

        setSavingPlan(true);
        setPlanError('');

        try {
            const token = patient.token;
            const headers = { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            };

            const payload = {
                procedures: editingProcedures.map(p => ({
                    procedureCode: p.procedureCode,
                    procedureName: p.procedureName,
                    price: Number(p.price) || 0
                })),
                notes: editingNotes
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-portal/appointments/${editingAppointment.appointmentID}/treatment-plan`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/patient-portal/appointments/${editingAppointment.appointmentID}/treatment-plan`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                setActionMsg('Treatment plan and invoice updated successfully!');
                setEditingAppointment(null);
                fetchAppointments();
                setTimeout(() => setActionMsg(''), 4000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setPlanError(errData.message || 'Failed to update treatment plan. Please try again.');
            }
        } catch (err) {
            console.error('Error updating treatment plan:', err);
            setPlanError('Network error while saving treatment plan.');
        } finally {
            setSavingPlan(false);
        }
    };

    const downloadIcs = (appt) => {
        const start = new Date(appt.preferredDate);
        const end = new Date(start.getTime() + 45 * 60000); // 45 min default

        const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:Dental Appointment - Dentia Clinic`,
            `DESCRIPTION:${appt.reason || 'Dental Consultation'}`,
            `LOCATION:Dentia Dental Clinic`,
            `DTSTART:${formatDate(start)}`,
            `DTEND:${formatDate(end)}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `Dentia_Appointment_${appt.appointmentID}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const now = new Date();
    const upcomingList = appointments.filter(a => new Date(a.preferredDate) >= now && a.status !== 'Cancelled');
    const pastList = appointments.filter(a => new Date(a.preferredDate) < now || a.status === 'Cancelled');
    const displayedList = activeTab === 'upcoming' ? upcomingList : pastList;

    // Doctor helper
    const getDoctorName = (docId) => {
        const found = doctors.find(d => (d.doctorID || d.id) === docId);
        if (found) {
            return found.fullName || `Dr. ${found.firstName} ${found.lastName}`.trim();
        }
        if (docId === 2) return 'Dr. Jhangir Ahmed';
        if (docId === 4) return 'Dr. Sarah Jenkins';
        if (docId === 3) return 'Dr. Ahmed Khan';
        if (docId === 1) return 'Dr. Sarah J. Lee';
        return 'Dentia Specialist';
    };

    // Filter available procedures in modal
    const categories = ['All', ...new Set(availableDoctorProcedures.map(p => p.category).filter(Boolean))];
    const filteredAvailableProcedures = availableDoctorProcedures.filter(p => {
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch = procedureSearch === '' || 
            (p.procedureName && p.procedureName.toLowerCase().includes(procedureSearch.toLowerCase())) ||
            (p.procedureCode && p.procedureCode.toLowerCase().includes(procedureSearch.toLowerCase())) ||
            (p.description && p.description.toLowerCase().includes(procedureSearch.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    const editingTotal = editingProcedures.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with Title and Book Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">Appointments Hub</h2>
                    <p className="text-xs sm:text-sm text-muted-text">Manage your scheduled clinic visits, selected treatment plans, and invoice records.</p>
                </div>
                <Link
                    to="/portal/book"
                    className="px-5 py-3 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-teal/20 flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Book New Appointment</span>
                </Link>
            </div>

            {/* Notification message */}
            {actionMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-light-teal pb-2">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'upcoming'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
                    }`}
                >
                    <span>Upcoming Consultations</span>
                    <span className="w-5 h-5 rounded-full bg-light-teal text-primary-teal flex items-center justify-center text-[10px] font-mono font-bold">
                        {upcomingList.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'past'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
                    }`}
                >
                    <span>Past Consultations</span>
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono font-bold">
                        {pastList.length}
                    </span>
                </button>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-40 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-40 bg-white rounded-3xl border border-light-teal" />
                </div>
            ) : displayedList.length > 0 ? (
                <div className="space-y-5">
                    {displayedList.map((appt) => {
                        const dateObj = new Date(appt.preferredDate);
                        const isCancelled = appt.status === 'Cancelled';
                        const doctorName = getDoctorName(appt.doctorID);
                        const currency = appt.currency || (appt.doctorID === 2 ? 'PKR' : 'NZD');
                        const hasItems = appt.items && appt.items.length > 0;

                        return (
                            <div
                                key={appt.appointmentID}
                                className={`bg-white rounded-3xl p-6 shadow-sm border border-light-teal flex flex-col gap-4 transition-all hover:shadow-md ${
                                    isCancelled ? 'opacity-60 bg-slate-50/50' : ''
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {/* Date Badge */}
                                        <div className="w-14 h-14 rounded-2xl bg-light-teal text-primary-teal flex flex-col items-center justify-center font-serif font-black shrink-0 border border-light-teal">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold">
                                                {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-xl leading-none text-dark-slate font-extrabold">
                                                {dateObj.getDate()}
                                            </span>
                                        </div>

                                        {/* Main Meta Details */}
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-bold text-dark-slate">
                                                    {appt.reason || 'General Dental Consultation'}
                                                </h4>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                    appt.status === 'Confirmed'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : appt.status === 'Cancelled'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {appt.status || 'Pending'}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted-text flex flex-wrap items-center gap-3">
                                                <span className="flex items-center gap-1 font-medium text-dark-slate">
                                                    <Stethoscope className="w-3.5 h-3.5 text-primary-teal" />
                                                    {doctorName}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-primary-teal" />
                                                    {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                </span>
                                                <span>•</span>
                                                <span>Operatory 1, Dentia Clinic</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isCancelled && (
                                        <div className="flex flex-wrap items-center gap-2 sm:self-start">
                                            {activeTab === 'upcoming' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditPlan(appt)}
                                                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-dark-slate transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                    title="Add or remove treatments from this appointment"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-primary-teal" />
                                                    <span>Edit Treatment Plan</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => downloadIcs(appt)}
                                                className="px-3.5 py-2 rounded-xl border border-light-teal hover:bg-light-teal/50 text-xs font-bold text-dark-slate transition-colors flex items-center gap-1.5"
                                                title="Add to Google/Apple Calendar"
                                            >
                                                <Download className="w-3.5 h-3.5 text-primary-teal" />
                                                <span>.ics</span>
                                            </button>

                                            {activeTab === 'upcoming' && (
                                                <button
                                                    type="button"
                                                    disabled={cancellingId === appt.appointmentID}
                                                    onClick={() => handleCancel(appt.appointmentID)}
                                                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                >
                                                    {cancellingId === appt.appointmentID ? 'Cancelling...' : 'Cancel'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Treatments & Pricing Breakdown */}
                                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-primary-teal" />
                                            Selected Procedures & Treatments ({hasItems ? appt.items.length : 1})
                                        </span>
                                        {appt.totalAmount != null && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-text">Total Balance:</span>
                                                <span className="text-sm font-mono font-bold text-primary-teal">
                                                    {formatPrice(appt.totalAmount, currency)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Itemized Procedures Grid/Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {hasItems ? (
                                            appt.items.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-dark-slate shadow-2xs"
                                                >
                                                    <span className="px-1.5 py-0.5 rounded bg-light-teal text-primary-teal font-mono font-bold text-[10px]">
                                                        {item.procedureCode || 'PRC'}
                                                    </span>
                                                    <span className="font-semibold">{item.description}</span>
                                                    <span className="font-mono font-bold text-slate-700">
                                                        {formatPrice(item.unitPrice, currency)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-dark-slate shadow-2xs">
                                                <span className="px-1.5 py-0.5 rounded bg-light-teal text-primary-teal font-mono font-bold text-[10px]">
                                                    D0120
                                                </span>
                                                <span className="font-semibold">{appt.reason || 'General Dental Examination'}</span>
                                                {appt.totalAmount != null && (
                                                    <span className="font-mono font-bold text-slate-700">
                                                        {formatPrice(appt.totalAmount, currency)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Financial / Invoice Bar */}
                                    {(appt.invoiceNumber || appt.totalAmount != null) && (
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                                            <div className="flex items-center gap-2">
                                                {appt.invoiceNumber && (
                                                    <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                        Invoice: #{appt.invoiceNumber}
                                                    </span>
                                                )}
                                                {appt.invoiceStatus && (
                                                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                                                        appt.invoiceStatus === 'Paid'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {appt.invoiceStatus}
                                                    </span>
                                                )}
                                                {appt.paymentMethod && (
                                                    <span className="text-slate-500">
                                                        Method: <strong className="text-slate-700">{appt.paymentMethod}</strong>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-slate-500">
                                                Clinic Currency: <strong className="font-mono text-slate-700">{currency}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-16 text-center bg-white rounded-3xl border border-light-teal p-8 space-y-3">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-serif font-black text-dark-slate">
                        No {activeTab === 'upcoming' ? 'upcoming' : 'past'} consultations found
                    </h3>
                    <p className="text-xs text-muted-text max-w-sm mx-auto">
                        Need to see your dentist? Schedule an appointment in under 2 minutes.
                    </p>
                    {activeTab === 'upcoming' && (
                        <Link
                            to="/portal/book"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-teal text-white text-xs font-bold shadow-sm hover:bg-primary-hover transition-colors mt-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Book Consultation Now</span>
                        </Link>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* EDIT TREATMENT PLAN MODAL                                  */}
            {/* ========================================================= */}
            {editingAppointment && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-6 animate-scale-up my-8">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-light-teal text-primary-teal text-[10px] font-mono font-bold uppercase tracking-wider">
                                        Appointment #{editingAppointment.appointmentID}
                                    </span>
                                    <span className="text-xs text-muted-text">
                                        with {getDoctorName(editingAppointment.doctorID)}
                                    </span>
                                </div>
                                <h3 className="text-xl font-serif font-black text-dark-slate mt-1">
                                    Edit Consultation Treatment Plan
                                </h3>
                                <p className="text-xs text-muted-text">
                                    Add or remove clinical procedures. Your clinic invoice and fee schedule will update dynamically.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingAppointment(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Error Alert */}
                        {planError && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{planError}</span>
                            </div>
                        )}

                        {/* Section 1: Currently Selected Treatments */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                    Selected Treatments ({editingProcedures.length})
                                </h4>
                                <div className="text-xs">
                                    <span className="text-muted-text">Recalculated Fee: </span>
                                    <span className="font-mono font-bold text-primary-teal text-sm">
                                        {formatPrice(editingTotal, editingAppointment.currency || (editingAppointment.doctorID === 2 ? 'PKR' : 'NZD'))}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {editingProcedures.map((proc, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-md bg-light-teal text-primary-teal font-mono font-bold text-xs">
                                                {proc.procedureCode}
                                            </span>
                                            <div>
                                                <div className="text-xs font-bold text-dark-slate">{proc.procedureName}</div>
                                                <div className="text-[11px] font-mono font-semibold text-slate-600">
                                                    {formatPrice(proc.price, editingAppointment.currency || (editingAppointment.doctorID === 2 ? 'PKR' : 'NZD'))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProcedure(index)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Remove treatment"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Add More Procedures from Doctor's Fee Schedule */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                    Add More Procedures from Doctor's Catalog
                                </h4>
                                <span className="text-[11px] text-muted-text">
                                    {availableDoctorProcedures.length} procedures available
                                </span>
                            </div>

                            {/* Search & Category Filter */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search by code, procedure name..."
                                        value={procedureSearch}
                                        onChange={(e) => setProcedureSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-dark-slate focus:outline-none focus:border-primary-teal"
                                    />
                                </div>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-dark-slate focus:outline-none focus:border-primary-teal"
                                >
                                    {categories.map((cat, i) => (
                                        <option key={i} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Procedure Selection List */}
                            <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-100 rounded-2xl p-2 bg-slate-50/40">
                                {loadingDoctorProcedures ? (
                                    <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin text-primary-teal" />
                                        <span>Loading clinic procedure list...</span>
                                    </div>
                                ) : filteredAvailableProcedures.length > 0 ? (
                                    filteredAvailableProcedures.map((proc) => {
                                        const isAlreadySelected = editingProcedures.some(p => p.procedureCode === (proc.procedureCode || proc.code));
                                        return (
                                            <div
                                                key={proc.procedureCode || proc.code}
                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                                                    isAlreadySelected
                                                        ? 'bg-slate-100/80 border-slate-200 opacity-60'
                                                        : 'bg-white border-slate-200 hover:border-primary-teal/60 hover:bg-emerald-50/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px] shrink-0">
                                                        {proc.procedureCode || proc.code}
                                                    </span>
                                                    <div className="truncate">
                                                        <div className="font-bold text-dark-slate truncate">{proc.procedureName}</div>
                                                        <div className="text-[10px] text-muted-text truncate">{proc.category || 'General'}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="font-mono font-bold text-dark-slate">
                                                        {formatPrice(proc.standardFee != null ? proc.standardFee : proc.price, editingAppointment.currency || (editingAppointment.doctorID === 2 ? 'PKR' : 'NZD'))}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={isAlreadySelected}
                                                        onClick={() => handleAddProcedure(proc)}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                                            isAlreadySelected
                                                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                                : 'bg-primary-teal hover:bg-primary-hover text-white cursor-pointer shadow-2xs'
                                                        }`}
                                                    >
                                                        {isAlreadySelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                        <span>{isAlreadySelected ? 'Added' : 'Add'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-6 text-center text-xs text-muted-text">
                                        No matching procedures found in catalog.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Notes / Reason */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-bold text-dark-slate">
                                Patient Consultation Notes / Special Requests
                            </label>
                            <textarea
                                rows={2}
                                value={editingNotes}
                                onChange={(e) => setEditingNotes(e.target.value)}
                                placeholder="Describe any acute symptoms, sensitivity, or preferences..."
                                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-dark-slate focus:outline-none focus:border-primary-teal"
                            />
                        </div>

                        {/* Modal Footer Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingAppointment(null)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={savingPlan}
                                onClick={handleSaveTreatmentPlan}
                                className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {savingPlan ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Save Treatment Plan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


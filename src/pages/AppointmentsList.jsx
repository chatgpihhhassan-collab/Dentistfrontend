import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Calendar, Clock, User, Phone, Mail, CheckCircle2, Search, 
    SlidersHorizontal, AlertCircle, Sparkles, LayoutGrid, Kanban, 
    ListFilter, ChevronLeft, ChevronRight, Download, Plus, 
    ExternalLink, CalendarDays, Eye, RefreshCw, Check, X, ShieldAlert,
    Share2, CalendarCheck, Stethoscope, ArrowRight, UserCheck, 
    FileText, Activity, MapPin
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import jsPDF from 'jspdf';

// Helper: Download .ics calendar event file for Apple / Google / Outlook / Notion Calendar
export const downloadIcsFile = (appointment, clinicName = "DENTIA Dental Care") => {
    if (!appointment || !appointment.preferredDate) return;
    const startDate = new Date(appointment.preferredDate);
    const endDate = new Date(startDate.getTime() + 45 * 60000); // 45 min slot

    const formatIcsDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//DENTIA Clinic//Appointment Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `SUMMARY:Dental Consultation: ${appointment.fullName} - ${appointment.reason || 'Checkup'}`,
        `DESCRIPTION:Patient: ${appointment.fullName}\\nStatus: ${appointment.status}\\nReason: ${appointment.reason || 'General Dental Consultation'}\\nClinic: ${clinicName}`,
        `LOCATION:${clinicName}, Dental Health Centre`,
        `DTSTART:${formatIcsDate(startDate)}`,
        `DTEND:${formatIcsDate(endDate)}`,
        `STATUS:${appointment.status === 'Confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    const cleanName = (appointment.fullName || 'Patient').replace(/\s+/g, '_');
    link.setAttribute("download", `Appointment_${cleanName}_${startDate.toISOString().slice(0,10)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper: Get robust YYYY-MM-DD local key for date matching regardless of client timezone
export const getLocalDateKey = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Get Google Calendar Instant Web URL
export const getGoogleCalendarUrl = (appointment, clinicName = "DENTIA Dental Care") => {
    if (!appointment || !appointment.preferredDate) return '#';
    const startDate = new Date(appointment.preferredDate);
    const endDate = new Date(startDate.getTime() + 45 * 60000);
    const formatGDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    
    const title = encodeURIComponent(`Dental Appointment: ${appointment.fullName}`);
    const details = encodeURIComponent(`Consultation with ${clinicName}\nStatus: ${appointment.status}\nReason: ${appointment.reason || 'Routine Checkup'}\nPhone: ${appointment.phone || 'N/A'}`);
    const location = encodeURIComponent(clinicName);
    const dates = `${formatGDate(startDate)}/${formatGDate(endDate)}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};

export default function AppointmentsList() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [doctorFilter, setDoctorFilter] = useState('All');
    const [activeView, setActiveView] = useState('calendar'); // 'calendar' | 'kanban' | 'timeline' | 'table' | 'patient-lookup'
    const [toastMessage, setToastMessage] = useState('');
    const [error, setError] = useState('');

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Status update modal state
    const [updateModal, setUpdateModal] = useState({ visible: false, appointment: null, newStatus: '', newReason: '' });
    
    // Quick New Appointment Modal
    const [showNewModal, setShowNewModal] = useState(false);
    const [modalPatients, setModalPatients] = useState([]);
    const [loadingModalPatients, setLoadingModalPatients] = useState(false);
    const [showModalPatientDropdown, setShowModalPatientDropdown] = useState(false);
    const [newApptForm, setNewApptForm] = useState({
        fullName: '',
        phone: '',
        email: '',
        preferredDate: new Date().toISOString().slice(0, 16),
        doctorID: '',
        reason: 'General Consultation'
    });
    const [submittingNew, setSubmittingNew] = useState(false);

    // Kanban Drag & Drop State
    const [draggingApptId, setDraggingApptId] = useState(null);
    const [dragOverCol, setDragOverCol] = useState(null);

    const handleDropAppointment = async (newStatus, e) => {
        e.preventDefault();
        setDragOverCol(null);
        const apptIdStr = e.dataTransfer.getData('text/plain') || draggingApptId;
        if (!apptIdStr) return;
        const apptId = parseInt(apptIdStr);
        const targetAppt = appointments.find(a => a.appointmentID === apptId);
        if (!targetAppt || targetAppt.status === newStatus) return;

        // Optimistic UI update
        setAppointments(prev => prev.map(a => a.appointmentID === apptId ? { ...a, status: newStatus } : a));
        setToastMessage(`Moved ${targetAppt.fullName} to ${newStatus}!`);

        try {
            const res = await fetch(`/api/appointments/${apptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    reason: targetAppt.reason || ''
                })
            });
            if (!res.ok) {
                fetchAppointments(); // rollback if error
            }
        } catch (err) {
            console.error("Failed to update status on drop:", err);
            fetchAppointments(); // rollback
        }
    };

    // Patient Self-Lookup Portal State
    const [lookupQuery, setLookupQuery] = useState('');
    const [lookupResults, setLookupResults] = useState(null);

    // Toast Timer
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Load Appointments & Doctors
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
            const doctorId = doctorData.doctorID || doctorData.DoctorID;
            const res = await fetch(`/api/appointments${doctorId ? `?doctorId=${doctorId}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetch('/api/auth/doctors')
            .then(res => res.json())
            .then(data => setDoctors(data))
            .catch(err => console.error("Failed to fetch doctors:", err));
    }, []);

    // Fetch patients for modal doctor
    useEffect(() => {
        if (!showNewModal) return;
        const fetchPatients = async () => {
            try {
                setLoadingModalPatients(true);
                const url = newApptForm.doctorID ? `/api/patients/doctor/${newApptForm.doctorID}` : '/api/patients';
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setModalPatients(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error("Failed to load modal patients:", e);
            } finally {
                setLoadingModalPatients(false);
            }
        };
        fetchPatients();
    }, [newApptForm.doctorID, showNewModal]);

    // Status Update Handler
    const handleUpdateStatus = async () => {
        if (!updateModal.appointment) return;
        try {
            setError('');
            const res = await fetch(`/api/appointments/${updateModal.appointment.appointmentID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: updateModal.newStatus, 
                    reason: updateModal.newReason 
                })
            });
            if (res.ok) {
                setUpdateModal({ visible: false, appointment: null, newStatus: '', newReason: '' });
                setToastMessage(`Appointment marked as ${updateModal.newStatus}!`);
                fetchAppointments();
                if (selectedAppointment && selectedAppointment.appointmentID === updateModal.appointment.appointmentID) {
                    setSelectedAppointment(prev => prev ? { ...prev, status: updateModal.newStatus, reason: updateModal.newReason } : null);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || 'Failed to update status.');
            }
        } catch (err) {
            console.error(err);
            setError('Server connection error.');
        }
    };

    // Quick Book Appointment Handler
    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        setSubmittingNew(true);
        setError('');
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newApptForm,
                    status: 'Confirmed'
                })
            });
            if (res.ok) {
                setShowNewModal(false);
                setToastMessage('New Appointment Scheduled & Confirmed!');
                setNewApptForm({
                    fullName: '',
                    phone: '',
                    email: '',
                    preferredDate: new Date().toISOString().slice(0, 16),
                    doctorID: '',
                    reason: 'General Consultation'
                });
                fetchAppointments();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to schedule appointment.');
            }
        } catch (err) {
            setError('Server error while scheduling.');
        } finally {
            setSubmittingNew(false);
        }
    };

    // Patient Self Lookup Handler
    const handlePatientLookup = (e) => {
        e.preventDefault();
        if (!lookupQuery.trim()) return;
        const q = lookupQuery.trim().toLowerCase();
        const matches = appointments.filter(a => 
            (a.phone && a.phone.includes(q)) || 
            (a.email && a.email.toLowerCase().includes(q)) ||
            (a.fullName && a.fullName.toLowerCase().includes(q))
        );
        setLookupResults(matches);
    };

    // Export PDF Schedule
    const handleExportPdf = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.setFont('helvetica');

        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('DENTIA CLINICAL SUITE - APPOINTMENTS AGENDA', 14, 18);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()} | Total Filtered: ${filteredAppointments.length}`, 14, 25);

        let y = 42;
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, 182, 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('PATIENT NAME', 18, y + 5);
        doc.text('CONTACT INFO', 65, y + 5);
        doc.text('SLOT TIME', 115, y + 5);
        doc.text('STATUS', 155, y + 5);
        doc.text('REASON', 175, y + 5);
        y += 10;

        doc.setFont('helvetica', 'normal');
        filteredAppointments.slice(0, 35).forEach((apt, idx) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const dateStr = apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);
            doc.text(`${idx + 1}. ${apt.fullName || 'Unknown'}`, 18, y);
            doc.setTextColor(100, 116, 139);
            doc.text(apt.phone || apt.email || 'N/A', 65, y);
            doc.setTextColor(30, 58, 138);
            doc.text(dateStr, 115, y);
            
            if (apt.status === 'Confirmed') doc.setTextColor(37, 99, 235);
            else if (apt.status === 'Done') doc.setTextColor(22, 163, 74);
            else doc.setTextColor(217, 119, 6);
            doc.text(apt.status || 'Pending', 155, y);

            doc.setTextColor(100, 116, 139);
            const cleanReason = (apt.reason || 'General').substring(0, 16);
            doc.text(cleanReason, 175, y);

            doc.setDrawColor(241, 245, 249);
            doc.line(14, y + 2, 196, y + 2);
            y += 7;
        });

        doc.save(`DENTIA_Appointments_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    // Filter Logic
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            const matchesSearch = (apt.fullName && apt.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (apt.phone && apt.phone.includes(searchTerm)) ||
                (apt.email && apt.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (apt.reason && apt.reason.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
            const matchesDoctor = doctorFilter === 'All' || (apt.doctorID && apt.doctorID.toString() === doctorFilter);
            
            return matchesSearch && matchesStatus && matchesDoctor;
        });
    }, [appointments, searchTerm, statusFilter, doctorFilter]);

    // Statistics
    const stats = useMemo(() => {
        const todayKey = getLocalDateKey(new Date());
        return {
            total: appointments.length,
            today: appointments.filter(a => getLocalDateKey(a.preferredDate) === todayKey).length,
            confirmed: appointments.filter(a => a.status === 'Confirmed').length,
            pending: appointments.filter(a => a.status === 'Pending').length,
            done: appointments.filter(a => a.status === 'Done').length
        };
    }, [appointments]);

    // Calendar Generation Helpers
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();
        
        const days = [];
        
        // Previous month filler days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }
        
        // Current month days
        for (let d = 1; d <= totalDays; d++) {
            days.push({
                date: new Date(year, month, d),
                isCurrentMonth: true
            });
        }
        
        // Next month filler days to complete 35 or 42 grid
        const remaining = (7 - (days.length % 7)) % 7;
        for (let j = 1; j <= remaining; j++) {
            days.push({
                date: new Date(year, month + 1, j),
                isCurrentMonth: false
            });
        }
        
        return days;
    }, [currentDate]);

    // Selected Date Appointments for Sidebar
    const selectedDateAppointments = useMemo(() => {
        const selectedKey = getLocalDateKey(selectedDate);
        return filteredAppointments.filter(a => getLocalDateKey(a.preferredDate) === selectedKey);
    }, [filteredAppointments, selectedDate]);

    // Formatters
    const formatDate = (dateString) => {
        if (!dateString || dateString.startsWith('0001')) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Confirmed</span>;
            case 'Pending':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
            case 'Done':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
            case 'Rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-24 relative overflow-x-hidden selection:bg-[#4A7CD2]/20 selection:text-[#4A7CD2]">
            
            {/* Floating Notification Toast */}
            {toastMessage && (
                <div className="fixed top-24 right-8 z-50 bg-[#1E293B] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/20 animate-fade-in-up">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs tracking-wide">{toastMessage}</span>
                </div>
            )}
            
            <Navigation />
            
            <main className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
                
                {/* Hero Header & Quick Metrics Bar */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#4A7CD2]/10 text-[#4A7CD2] font-bold text-[11px] uppercase tracking-wider">
                                Clinical Scheduler
                            </span>
                            <span className="text-slate-400 text-xs">• 2-Way Notion & Calendar Sync</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            Appointments & Consultation Board
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-xl">
                            Visual scheduling suite. Manage patient timelines, confirm upcoming visits, and download instant calendar invites.
                        </p>
                    </div>

                    {/* Quick Stats Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl text-center flex flex-col justify-center min-w-[110px]">
                            <span className="text-xl font-bold text-slate-900 block">{stats.total}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Booked</span>
                        </div>
                        <div className="bg-blue-50/60 border border-blue-200/60 p-3.5 rounded-2xl text-center flex flex-col justify-center min-w-[110px]">
                            <span className="text-xl font-bold text-[#4A7CD2] block">{stats.today}</span>
                            <span className="text-[10px] font-bold text-[#4A7CD2]/80 uppercase tracking-wider mt-0.5">Today's Visits</span>
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-200/60 p-3.5 rounded-2xl text-center flex flex-col justify-center min-w-[110px]">
                            <span className="text-xl font-bold text-emerald-600 block">{stats.confirmed}</span>
                            <span className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider mt-0.5">Confirmed</span>
                        </div>
                        <div className="bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-2xl text-center flex flex-col justify-center min-w-[110px]">
                            <span className="text-xl font-bold text-amber-600 block">{stats.pending}</span>
                            <span className="text-[10px] font-bold text-amber-700/80 uppercase tracking-wider mt-0.5">Pending</span>
                        </div>
                    </div>
                </div>

                {/* Notion Control Toolbar: View Switcher, Doctor Filter, Search, & Actions */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
                    
                    {/* View Switcher Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto w-full lg:w-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveView('calendar')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeView === 'calendar' ? 'bg-white text-[#4A7CD2] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Month Calendar</span>
                        </button>
                        <button
                            onClick={() => setActiveView('kanban')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeView === 'kanban' ? 'bg-white text-[#4A7CD2] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Kanban className="w-3.5 h-3.5" />
                            <span>Kanban Pipeline</span>
                        </button>
                        <button
                            onClick={() => setActiveView('timeline')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeView === 'timeline' ? 'bg-white text-[#4A7CD2] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Daily Timeline</span>
                        </button>
                        <button
                            onClick={() => setActiveView('table')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeView === 'table' ? 'bg-white text-[#4A7CD2] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span>Data Ledger</span>
                        </button>
                        <button
                            onClick={() => setActiveView('patient-lookup')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeView === 'patient-lookup' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Patient Lookup</span>
                        </button>
                    </div>

                    {/* Filter & Action Tools */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                        
                        {/* Search Input */}
                        <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search patient, phone, reason..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20"
                            />
                        </div>

                        {/* Specialist Filter */}
                        <select
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Specialists</option>
                            {doctors.map(d => (
                                <option key={d.doctorID} value={d.doctorID}>
                                    Dr. {d.firstName} {d.lastName}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Pending">Pending</option>
                            <option value="Done">Completed</option>
                            <option value="Rejected">Cancelled</option>
                        </select>

                        {/* Export PDF Button */}
                        <button
                            onClick={handleExportPdf}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
                            title="Export PDF Schedule"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>

                        {/* + New Appointment Button */}
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Appointment</span>
                        </button>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 1. ENHANCED PRO CALENDAR VIEW (COMPACT & ERGONOMIC)       */}
                {/* ========================================================= */}
                {activeView === 'calendar' && (
                    <div className="space-y-4">
                        
                        {/* Doctor Specialist Filter Strip (Quick 1-Click Doctor Switching) */}
                        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 pr-3 border-r border-slate-200 flex-shrink-0">
                                <Stethoscope className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                <span>Specialists:</span>
                            </div>

                            <button
                                onClick={() => setDoctorFilter('All')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                                    doctorFilter === 'All'
                                        ? 'bg-[#4A7CD2] text-white shadow-xs'
                                        : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/70'
                                }`}
                            >
                                <span>All Doctors</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                    doctorFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {appointments.length} Appts
                                </span>
                            </button>

                            {doctors.map(d => {
                                const docCount = appointments.filter(a => a.doctorID && a.doctorID.toString() === d.doctorID.toString()).length;
                                const isSelected = doctorFilter === d.doctorID.toString();

                                return (
                                    <button
                                        key={d.doctorID}
                                        onClick={() => setDoctorFilter(d.doctorID.toString())}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                                            isSelected
                                                ? 'bg-[#4A7CD2] text-white shadow-xs'
                                                : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/70'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                            isSelected ? 'bg-white text-[#4A7CD2]' : 'bg-[#4A7CD2]/20 text-[#4A7CD2]'
                                        }`}>
                                            {d.firstName?.charAt(0) || 'D'}
                                        </div>
                                        <span>Dr. {d.firstName} {d.lastName}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {docCount} Appts
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Calendar & Day Focus Split Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                            
                            {/* Left Calendar Stage (8 of 12 columns) */}
                            <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3.5">
                                
                                {/* Calendar Month Navigation Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </h2>
                                        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200/60 p-0.5">
                                            <button
                                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                                className="p-1 hover:bg-white rounded-lg transition text-slate-600 cursor-pointer"
                                                title="Previous Month"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const now = new Date();
                                                    setCurrentDate(now);
                                                    setSelectedDate(now);
                                                }}
                                                className="px-2.5 py-0.5 text-xs font-bold text-[#4A7CD2] hover:bg-white rounded-lg transition cursor-pointer"
                                            >
                                                Today
                                            </button>
                                            <button
                                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                                className="p-1 hover:bg-white rounded-lg transition text-slate-600 cursor-pointer"
                                                title="Next Month"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Legend Dots */}
                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-2xs"></span> Confirmed
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-2xs"></span> Pending
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs"></span> Done
                                        </span>
                                    </div>
                                </div>

                                {/* Calendar Weekday Header */}
                                <div className="grid grid-cols-7 gap-px bg-slate-200/70 rounded-2xl overflow-hidden border border-slate-200/70">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                        <div key={d} className={`py-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${
                                            i === 0 || i === 6 ? 'bg-slate-100/90 text-slate-400' : 'bg-slate-50 text-slate-600'
                                        }`}>
                                            {d}
                                        </div>
                                    ))}

                                    {/* Calendar Day Cells Grid (Compact & Ergonomic Size) */}
                                    {calendarDays.map((cell, idx) => {
                                        const cellKey = getLocalDateKey(cell.date);
                                        const dayAppts = filteredAppointments.filter(a => getLocalDateKey(a.preferredDate) === cellKey);
                                        const isToday = getLocalDateKey(new Date()) === cellKey;
                                        const isSelected = getLocalDateKey(selectedDate) === cellKey;

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedDate(cell.date)}
                                                className={`min-h-[72px] sm:min-h-[82px] p-1.5 transition-all flex flex-col justify-between cursor-pointer relative group ${
                                                    cell.isCurrentMonth ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/60 text-slate-300'
                                                } ${isSelected ? 'ring-2 ring-inset ring-[#4A7CD2] bg-blue-50/50 z-10' : ''}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-all ${
                                                        isToday 
                                                            ? 'bg-[#4A7CD2] text-white shadow-2xs font-extrabold' 
                                                            : isSelected
                                                                ? 'bg-blue-100 text-[#4A7CD2]'
                                                                : cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                                                    }`}>
                                                        {cell.date.getDate()}
                                                    </span>
                                                    
                                                    {dayAppts.length > 0 && (
                                                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                                                            {dayAppts.length}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Day Appointments Stack */}
                                                <div className="space-y-1 my-0.5 overflow-hidden">
                                                    {dayAppts.slice(0, 2).map((apt) => {
                                                        const timeStr = new Date(apt.preferredDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                                        const badgeBorder = apt.status === 'Confirmed' 
                                                            ? 'border-l-blue-500 bg-blue-50/80 text-blue-900' 
                                                            : apt.status === 'Done' 
                                                                ? 'border-l-emerald-500 bg-emerald-50/80 text-emerald-900' 
                                                                : 'border-l-amber-500 bg-amber-50/80 text-amber-900';

                                                        return (
                                                            <div
                                                                key={apt.appointmentID}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedDate(cell.date);
                                                                    setSelectedAppointment(apt);
                                                                }}
                                                                className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border border-slate-200/50 border-l-3 truncate flex items-center justify-between shadow-2xs transition hover:scale-[1.01] ${badgeBorder}`}
                                                                title={`${apt.fullName} - ${timeStr} (${apt.reason || 'Checkup'})`}
                                                            >
                                                                <span className="truncate max-w-[65px] sm:max-w-[78px]">{apt.fullName}</span>
                                                                <span className="text-[8.5px] opacity-75 font-semibold">{timeStr}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayAppts.length > 2 && (
                                                        <span className="text-[8.5px] font-bold text-[#4A7CD2] block text-center bg-blue-50/80 py-0.2 rounded">
                                                            +{dayAppts.length - 2} more
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Hover Quick Add Slot Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const dateIso = getLocalDateKey(cell.date);
                                                        setNewApptForm(prev => ({ ...prev, preferredDate: `${dateIso}T10:00` }));
                                                        setShowNewModal(true);
                                                    }}
                                                    className="text-[9px] font-bold text-slate-400 hover:text-[#4A7CD2] flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition pt-0.5 border-t border-slate-100"
                                                >
                                                    <Plus className="w-2.5 h-2.5" /> Slot
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Day Focus Inspector Panel (4 of 12 columns) - Height Matched */}
                            <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4 max-h-[560px] flex flex-col">
                                
                                {/* Panel Header with Active Date */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Day Focus & Agenda
                                        </span>
                                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#4A7CD2]" />
                                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            const dateIso = getLocalDateKey(selectedDate);
                                            setNewApptForm(prev => ({ ...prev, preferredDate: `${dateIso}T10:00` }));
                                            setShowNewModal(true);
                                        }}
                                        className="px-2.5 py-1.5 bg-blue-50 text-[#4A7CD2] hover:bg-[#4A7CD2] hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Book on this date"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Slot</span>
                                    </button>
                                </div>

                                {/* Schedule List for Selected Date - Internal Smooth Scroll */}
                                <div className="space-y-3 overflow-y-auto pr-1 flex-grow scrollbar-hide">
                                    {selectedDateAppointments.length === 0 ? (
                                        <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
                                            <div className="w-10 h-10 bg-white rounded-2xl shadow-2xs flex items-center justify-center mx-auto text-slate-400">
                                                <CalendarCheck className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-xs font-bold text-slate-700">No Consultations Scheduled</h4>
                                                <p className="text-[10.5px] text-slate-400">No patient visits booked for this date.</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const dateIso = getLocalDateKey(selectedDate);
                                                    setNewApptForm(prev => ({ ...prev, preferredDate: `${dateIso}T10:00` }));
                                                    setShowNewModal(true);
                                                }}
                                                className="px-3.5 py-1.5 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Book This Day</span>
                                            </button>
                                        </div>
                                    ) : (
                                        selectedDateAppointments.map(apt => {
                                            const timeStr = new Date(apt.preferredDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                            return (
                                                <div 
                                                    key={apt.appointmentID}
                                                    className="bg-slate-50/80 hover:bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-2.5"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#4A7CD2] font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                                {apt.fullName?.charAt(0) || 'P'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-xs text-slate-900">{apt.fullName}</h4>
                                                                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-[#4A7CD2]" />
                                                                    {timeStr}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {getStatusBadge(apt.status)}
                                                    </div>

                                                    {apt.reason && (
                                                        <div className="text-[10.5px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 font-medium flex items-start gap-1.5">
                                                            <Activity className="w-3 h-3 text-[#4A7CD2] mt-0.5 flex-shrink-0" />
                                                            <span>{apt.reason}</span>
                                                        </div>
                                                    )}

                                                    {/* Contact & Actions */}
                                                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-0.5">
                                                        <span>📞 {apt.phone || 'No phone'}</span>
                                                        {apt.email && <span className="truncate max-w-[110px]">✉ {apt.email}</span>}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                                                        <button
                                                            onClick={() => downloadIcsFile(apt)}
                                                            className="flex-1 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Add to Phone Calendar"
                                                        >
                                                            <CalendarCheck className="w-3 h-3 text-emerald-600" />
                                                            <span>.ics</span>
                                                        </button>
                                                        <a
                                                            href={getGoogleCalendarUrl(apt)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex-1 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Google Calendar Sync"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span>Google</span>
                                                        </a>
                                                        <button
                                                            onClick={() => setUpdateModal({ visible: true, appointment: apt, newStatus: apt.status || 'Confirmed', newReason: apt.reason || '' })}
                                                            className="px-2 py-1 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                                        >
                                                            Status
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 2. NOTION KANBAN BOARD WITH NATIVE DRAG & DROP           */}
                {/* ========================================================= */}
                {activeView === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { id: 'Pending', label: 'Pending Requests', color: 'amber', icon: AlertCircle },
                            { id: 'Confirmed', label: 'Confirmed Consultations', color: 'blue', icon: CalendarCheck },
                            { id: 'Done', label: 'Completed / Treated', color: 'emerald', icon: CheckCircle2 },
                            { id: 'Rejected', label: 'Cancelled / Rejected', color: 'rose', icon: X }
                        ].map(col => {
                            const colAppts = filteredAppointments.filter(a => a.status === col.id);
                            const isOver = dragOverCol === col.id;

                            return (
                                <div 
                                    key={col.id}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (dragOverCol !== col.id) setDragOverCol(col.id);
                                    }}
                                    onDragLeave={(e) => {
                                        // Only clear if leaving column boundary
                                        if (!e.currentTarget.contains(e.relatedTarget)) {
                                            setDragOverCol(null);
                                        }
                                    }}
                                    onDrop={(e) => handleDropAppointment(col.id, e)}
                                    className={`bg-white rounded-3xl border shadow-xs flex flex-col min-h-[520px] transition-all duration-200 ${
                                        isOver 
                                            ? 'border-[#4A7CD2] ring-2 ring-[#4A7CD2]/40 bg-blue-50/20 scale-[1.01]' 
                                            : 'border-slate-200/80'
                                    }`}
                                >
                                    {/* Column Header */}
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${
                                                col.color === 'blue' ? 'bg-blue-500' :
                                                col.color === 'emerald' ? 'bg-emerald-500' :
                                                col.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}></span>
                                            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">{col.label}</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                            isOver ? 'bg-[#4A7CD2] text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {colAppts.length}
                                        </span>
                                    </div>

                                    {/* Column Drop Zone / Cards List */}
                                    <div className="p-4 space-y-3 flex-grow overflow-y-auto max-h-[600px] scrollbar-hide">
                                        {colAppts.length === 0 ? (
                                            <div className={`text-center py-16 rounded-2xl border-2 border-dashed transition-all ${
                                                isOver 
                                                    ? 'border-[#4A7CD2] bg-blue-50/60 text-[#4A7CD2] font-bold text-xs' 
                                                    : 'border-slate-200 text-slate-400 text-xs font-medium'
                                            }`}>
                                                {isOver ? '✨ Drop card here' : `Drag appointments to ${col.id.toLowerCase()}`}
                                            </div>
                                        ) : (
                                            colAppts.map(apt => {
                                                const isDragging = draggingApptId === apt.appointmentID;
                                                return (
                                                    <div 
                                                        key={apt.appointmentID}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('text/plain', apt.appointmentID.toString());
                                                            e.dataTransfer.effectAllowed = 'move';
                                                            setDraggingApptId(apt.appointmentID);
                                                        }}
                                                        onDragEnd={() => {
                                                            setDraggingApptId(null);
                                                            setDragOverCol(null);
                                                        }}
                                                        className={`p-4 rounded-2xl border transition-all space-y-3 cursor-grab active:cursor-grabbing select-none ${
                                                            isDragging
                                                                ? 'opacity-40 scale-95 border-2 border-dashed border-[#4A7CD2] bg-blue-50'
                                                                : 'bg-slate-50/80 hover:bg-white border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-[#4A7CD2]/40'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-4 rounded-full bg-slate-300 group-hover:bg-[#4A7CD2] flex flex-col justify-between py-0.5 opacity-60">
                                                                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                                                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-xs text-slate-900">{apt.fullName}</h4>
                                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                                        <Clock className="w-3 h-3 text-[#4A7CD2]" />
                                                                        {formatDate(apt.preferredDate)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedAppointment(apt);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-[#4A7CD2] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                                title="Inspect"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {apt.reason && (
                                                            <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 font-medium">
                                                                💡 {apt.reason}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                                                            <span className="text-slate-500 font-medium truncate max-w-[130px]">{apt.phone || apt.email || 'No phone'}</span>
                                                            
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                <span>Drag to move</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ========================================================= */}
                {/* 3. DAILY TIMELINE VIEW                                    */}
                {/* ========================================================= */}
                {activeView === 'timeline' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                        
                        {/* Timeline Day Selector */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-[#4A7CD2]" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                    Day Agenda: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </h2>
                            </div>
                            <input
                                type="date"
                                value={getLocalDateKey(selectedDate)}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                            />
                        </div>

                        {/* Hours Slots from 08:00 to 19:00 */}
                        <div className="space-y-2.5">
                            {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => {
                                const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                                const selectedIso = getLocalDateKey(selectedDate);
                                const hourAppts = filteredAppointments.filter(a => {
                                    if (!a.preferredDate) return false;
                                    const d = new Date(a.preferredDate);
                                    return getLocalDateKey(a.preferredDate) === selectedIso && d.getHours() === hour;
                                });

                                return (
                                    <div key={hour} className="flex items-start gap-4 p-2.5 rounded-2xl hover:bg-slate-50/80 border border-transparent hover:border-slate-200 transition">
                                        <div className="w-20 text-xs font-bold text-slate-400 flex-shrink-0 pt-2">
                                            {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 ${hour === 12 ? 'PM' : 'AM'}`}
                                        </div>

                                        <div className="flex-grow min-h-[46px] rounded-xl bg-slate-50 border border-slate-200/70 p-2 flex flex-wrap gap-2 items-center">
                                            {hourAppts.length === 0 ? (
                                                <span className="text-xs text-slate-400 font-medium px-2">Slot Open</span>
                                            ) : (
                                                hourAppts.map(apt => (
                                                    <div
                                                        key={apt.appointmentID}
                                                        onClick={() => setSelectedAppointment(apt)}
                                                        className="px-3 py-2 rounded-xl bg-white border border-blue-200 shadow-2xs flex items-center gap-3 cursor-pointer hover:border-[#4A7CD2] transition"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-900 block">{apt.fullName}</span>
                                                            <span className="text-[10px] text-slate-500 block">{apt.reason || 'General Consultation'}</span>
                                                        </div>
                                                        {getStatusBadge(apt.status)}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 4. DATA TABLE VIEW                                        */}
                {/* ========================================================= */}
                {activeView === 'table' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        {loading ? (
                            <div className="p-16 text-center text-slate-500 font-medium flex items-center justify-center space-x-2">
                                <RefreshCw className="w-5 h-5 animate-spin text-[#4A7CD2]" />
                                <span>Loading appointments...</span>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="p-16 text-center max-w-sm mx-auto space-y-4">
                                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                                <h3 className="text-base font-bold text-slate-700">No Appointments Found</h3>
                                <p className="text-slate-400 text-xs">No records matched your search or status filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-4 px-6">Patient Name</th>
                                            <th className="py-4 px-6">Contact Phone / Email</th>
                                            <th className="py-4 px-6">Preferred Slot</th>
                                            <th className="py-4 px-6">Clinical Reason</th>
                                            <th className="py-4 px-6">Status</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                        {filteredAppointments.map(apt => (
                                            <tr key={apt.appointmentID} className="hover:bg-slate-50/70 transition">
                                                <td className="py-4 px-6 font-bold text-slate-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-blue-50 text-[#4A7CD2] font-bold flex items-center justify-center text-xs">
                                                            {apt.fullName?.charAt(0) || 'P'}
                                                        </div>
                                                        <span>{apt.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-slate-600">
                                                    <div>{apt.phone || 'N/A'}</div>
                                                    <div className="text-[11px] text-slate-400">{apt.email || ''}</div>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-[#4A7CD2]">
                                                    {formatDate(apt.preferredDate)}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600">
                                                    {apt.reason || 'General Consultation'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getStatusBadge(apt.status)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => downloadIcsFile(apt)}
                                                            className="p-1.5 text-slate-400 hover:text-[#4A7CD2] hover:bg-blue-50 rounded-lg transition"
                                                            title="Download .ics Calendar File"
                                                        >
                                                            <CalendarCheck className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedAppointment(apt)}
                                                            className="p-1.5 text-slate-400 hover:text-[#4A7CD2] hover:bg-blue-50 rounded-lg transition"
                                                            title="Inspect / Update"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* 5. PATIENT SELF-SERVICE LOOKUP PORTAL                     */}
                {/* ========================================================= */}
                {activeView === 'patient-lookup' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 max-w-3xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                                <User className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Patient Appointment Lookup</h2>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Check your booked consultation status, scheduled date, and doctor details anytime using your phone number or email.
                            </p>
                        </div>

                        <form onSubmit={handlePatientLookup} className="flex gap-3 max-w-xl mx-auto">
                            <input
                                type="text"
                                value={lookupQuery}
                                onChange={(e) => setLookupQuery(e.target.value)}
                                placeholder="Enter your Phone number or Email..."
                                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition shadow-md cursor-pointer"
                            >
                                Find My Visit
                            </button>
                        </form>

                        {lookupResults && (
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                                    Found {lookupResults.length} Appointment(s) for "{lookupQuery}":
                                </h3>

                                {lookupResults.length === 0 ? (
                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-bold text-center">
                                        No upcoming appointments found matching your search. Please check your phone/email spelling or book a new session.
                                    </div>
                                ) : (
                                    lookupResults.map(apt => (
                                        <div key={apt.appointmentID} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">{apt.fullName}</span>
                                                    {getStatusBadge(apt.status)}
                                                </div>
                                                <div className="text-xs text-[#4A7CD2] font-bold flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(apt.preferredDate)}
                                                </div>
                                                <p className="text-xs text-slate-500">Reason: {apt.reason || 'General Dental Consultation'}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => downloadIcsFile(apt)}
                                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                                >
                                                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                    Add to Phone (.ics)
                                                </button>
                                                <a
                                                    href={getGoogleCalendarUrl(apt)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Google Calendar
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* ========================================================= */}
            {/* INSPECTION / DETAIL MODAL                                 */}
            {/* ========================================================= */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-scale-up">
                        
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Appointment Summary</span>
                                <h3 className="text-xl font-bold text-slate-900">{selectedAppointment.fullName}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Scheduled Time</span>
                                <span className="font-bold text-slate-800">{formatDate(selectedAppointment.preferredDate)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Contact Phone</span>
                                <span className="font-bold text-slate-800">{selectedAppointment.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Email</span>
                                <span className="font-bold text-slate-800">{selectedAppointment.email || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Current Status</span>
                                <span>{getStatusBadge(selectedAppointment.status)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Clinical Reason</span>
                                <span className="font-bold text-slate-800 max-w-[250px] text-right">{selectedAppointment.reason || 'General Checkup'}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                            <button
                                onClick={() => downloadIcsFile(selectedAppointment)}
                                className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <CalendarCheck className="w-4 h-4 text-[#4A7CD2]" />
                                Download .ics
                            </button>
                            <a
                                href={getGoogleCalendarUrl(selectedAppointment)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Google Cal
                            </a>
                            <button
                                onClick={() => {
                                    setUpdateModal({
                                        visible: true,
                                        appointment: selectedAppointment,
                                        newStatus: selectedAppointment.status || 'Confirmed',
                                        newReason: selectedAppointment.reason || ''
                                    });
                                }}
                                className="flex-1 py-2.5 px-4 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                Change Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* STATUS UPDATE MODAL                                       */}
            {/* ========================================================= */}
            {updateModal.visible && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">Update Appointment Status</h3>
                            <button
                                onClick={() => setUpdateModal({ visible: false, appointment: null, newStatus: '', newReason: '' })}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Select New Status</label>
                                <select
                                    value={updateModal.newStatus}
                                    onChange={(e) => setUpdateModal(prev => ({ ...prev, newStatus: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20 cursor-pointer"
                                >
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Done">Done / Completed</option>
                                    <option value="Rejected">Rejected / Cancelled</option>
                                    <option value="Re-scheduled">Re-scheduled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Clinical Note / Reason</label>
                                <textarea
                                    rows="3"
                                    value={updateModal.newReason}
                                    onChange={(e) => setUpdateModal(prev => ({ ...prev, newReason: e.target.value }))}
                                    placeholder="Add reason for visit or status update note..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 rounded-xl text-xs text-red-600 font-bold">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-2">
                            <button
                                onClick={() => setUpdateModal({ visible: false, appointment: null, newStatus: '', newReason: '' })}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                className="flex-1 py-2.5 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* + NEW APPOINTMENT MODAL                                   */}
            {/* ========================================================= */}
            {showNewModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-[#4A7CD2]" />
                                <h3 className="text-base font-bold text-slate-900">Schedule New Appointment</h3>
                            </div>
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAppointment} className="space-y-4">
                            {/* 1. Attending Doctor */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-600">Attending Specialist</label>
                                    {modalPatients.length > 0 && (
                                        <span className="text-[10px] font-bold text-[#4A7CD2] bg-blue-50 px-2 py-0.5 rounded-md">
                                            {modalPatients.length} registered patients
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={newApptForm.doctorID}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, doctorID: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                                >
                                    <option value="">Any Specialist</option>
                                    {doctors.map(d => (
                                        <option key={d.doctorID} value={d.doctorID}>
                                            Dr. {d.firstName} {d.lastName} ({d.speciality || 'General Dentistry'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Full Name with registered patient dropdown */}
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                    Patient Full Name * <span className="text-[10px] text-slate-400 font-normal">(select from list or type new)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={newApptForm.fullName}
                                        onFocus={() => setShowModalPatientDropdown(true)}
                                        onChange={(e) => {
                                            setNewApptForm(prev => ({ ...prev, fullName: e.target.value }));
                                            setShowModalPatientDropdown(true);
                                        }}
                                        placeholder="Click to pick patient or type..."
                                        className="w-full pl-4 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20"
                                    />
                                    {loadingModalPatients ? (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="w-3.5 h-3.5 border-2 border-[#4A7CD2] border-t-transparent rounded-full animate-spin block"></span>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowModalPatientDropdown(!showModalPatientDropdown)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                                        >
                                            ▼
                                        </button>
                                    )}
                                </div>

                                {showModalPatientDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                        <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                            <span>Doctor's Patients ({modalPatients.length})</span>
                                            <button 
                                                type="button"
                                                onClick={() => setShowModalPatientDropdown(false)}
                                                className="text-slate-400 hover:text-slate-600 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {modalPatients
                                            .filter(p => `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes((newApptForm.fullName || '').toLowerCase()) || (p.phone && p.phone.includes(newApptForm.fullName || '')))
                                            .map(p => (
                                                <div
                                                    key={p.patientID}
                                                    onClick={() => {
                                                        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
                                                        setNewApptForm(prev => ({
                                                            ...prev,
                                                            fullName: name,
                                                            phone: p.phone || prev.phone,
                                                            email: p.email || prev.email
                                                        }));
                                                        setShowModalPatientDropdown(false);
                                                    }}
                                                    className="p-2.5 hover:bg-blue-50/60 transition cursor-pointer flex items-center justify-between"
                                                >
                                                    <div>
                                                        <span className="font-bold text-xs text-slate-900 block">{p.firstName} {p.lastName}</span>
                                                        <span className="text-[10px] text-slate-500 block">ID: #{p.patientID} • {p.phone || 'No phone'}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#4A7CD2] bg-white px-2 py-0.5 rounded border border-blue-100 shadow-2xs">
                                                        Select
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Phone & Email */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newApptForm.phone}
                                        onChange={(e) => setNewApptForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="0300 1234567"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={newApptForm.email}
                                        onChange={(e) => setNewApptForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="patient@gmail.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* 4. Preferred Date & Time */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Preferred Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={newApptForm.preferredDate}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Visit</label>
                                <input
                                    type="text"
                                    value={newApptForm.reason}
                                    onChange={(e) => setNewApptForm(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="e.g. Toothache, Scaling, Root Canal, Whitening"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 rounded-xl text-xs text-red-600 font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingNew}
                                    className="flex-1 py-2.5 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {submittingNew ? 'Scheduling...' : 'Confirm Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

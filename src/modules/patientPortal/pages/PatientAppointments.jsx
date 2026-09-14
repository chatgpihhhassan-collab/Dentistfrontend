import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, XCircle, CheckCircle2, AlertCircle, FileText, Download, ArrowRight } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');
    const [cancellingId, setCancellingId] = useState(null);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

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

    useEffect(() => {
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

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with Title and Book Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">Appointments Hub</h2>
                    <p className="text-xs sm:text-sm text-muted-text">Manage your scheduled clinic visits and view past consultation history.</p>
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
                    <div className="h-32 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-32 bg-white rounded-3xl border border-light-teal" />
                </div>
            ) : displayedList.length > 0 ? (
                <div className="space-y-4">
                    {displayedList.map((appt) => {
                        const dateObj = new Date(appt.preferredDate);
                        const isCancelled = appt.status === 'Cancelled';
                        return (
                            <div
                                key={appt.appointmentID}
                                className={`bg-white rounded-3xl p-6 shadow-sm border border-light-teal flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md ${
                                    isCancelled ? 'opacity-60 bg-slate-50/50' : ''
                                }`}
                            >
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

                                    {/* Details */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
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

                                        <p className="text-xs text-muted-text flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-primary-teal" />
                                                {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                            <span>•</span>
                                            <span>Operatory 1, Dentia Clinic</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!isCancelled && (
                                    <div className="flex items-center gap-2 sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => downloadIcs(appt)}
                                            className="px-3.5 py-2 rounded-xl border border-light-teal hover:bg-light-teal/50 text-xs font-bold text-dark-slate transition-colors flex items-center gap-1.5"
                                            title="Add to Google/Apple Calendar"
                                        >
                                            <Download className="w-3.5 h-3.5 text-primary-teal" />
                                            <span>Calendar (.ics)</span>
                                        </button>

                                        {activeTab === 'upcoming' && (
                                            <button
                                                type="button"
                                                disabled={cancellingId === appt.appointmentID}
                                                onClick={() => handleCancel(appt.appointmentID)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                                {cancellingId === appt.appointmentID ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                )}
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
        </div>
    );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    Sparkles, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle, 
    ArrowLeft, 
    ArrowRight, 
    Stethoscope, 
    Smile, 
    FileText, 
    MapPin, 
    Download, 
    Info 
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientBookAppointment() {
    const navigate = useNavigate();

    // Form states
    const [selectedCategory, setSelectedCategory] = useState('Routine Checkup & Prophylaxis Cleaning');
    const [selectedDoctor, setSelectedDoctor] = useState('Dr. Sarah J. Lee (Lead Dental Surgeon)');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('10:00 AM');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');

    // Dental Service Offerings
    const services = [
        { 
            id: 'Routine Checkup & Prophylaxis Cleaning', 
            label: 'Routine Checkup & Cleaning', 
            duration: '45 mins', 
            badge: 'Most Popular',
            desc: 'Comprehensive oral examination, ultrasonic scaling, plaque removal & polish.',
            icon: Smile 
        },
        { 
            id: 'Toothache or Emergency Consultation', 
            label: 'Emergency & Acute Pain', 
            duration: '30 mins', 
            badge: 'Same-Day Priority',
            desc: 'Emergency diagnostic triage for acute throbbing toothache, trauma, or swelling.',
            icon: AlertCircle 
        },
        { 
            id: 'Restorative Crown or Cavity Filling', 
            label: 'Cavity Filling & Restoration', 
            duration: '60 mins', 
            badge: 'Restorative',
            desc: 'Precision composite resin filling, broken cusp repair, or crown fitting review.',
            icon: ShieldCheck 
        },
        { 
            id: 'Orthodontic Alignment & Braces Review', 
            label: 'Orthodontics & Clear Aligners', 
            duration: '30 mins', 
            badge: 'Alignment',
            desc: 'Clear aligner fitting check, teeth straightening assessment, or wire adjustment.',
            icon: Sparkles 
        },
        { 
            id: 'Periodontal Gum Health & Deep Scaling', 
            label: 'Periodontal Care & Deep Scaling', 
            duration: '60 mins', 
            badge: 'Gum Care',
            desc: 'Subgingival scaling, root planing, and gingival pocket health evaluation.',
            icon: Stethoscope 
        },
        { 
            id: 'Cosmetic Teeth Whitening Evaluation', 
            label: 'Cosmetic Teeth Whitening', 
            duration: '45 mins', 
            badge: 'Aesthetic',
            desc: 'In-clinic laser bleaching consultation and custom-molded take-home tray shade match.',
            icon: Sparkles 
        }
    ];

    // Specialist Doctors
    const doctors = [
        { 
            id: 1, 
            name: 'Dr. Sarah J. Lee', 
            title: 'Lead Dental Surgeon & Cosmetic Clinician', 
            exp: '14 yrs exp', 
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200' 
        },
        { 
            id: 2, 
            name: 'Dr. Michael Chang', 
            title: 'Orthodontist & Aligner Specialist', 
            exp: '11 yrs exp', 
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200' 
        },
        { 
            id: 3, 
            name: 'Dr. Emily Watson', 
            title: 'Periodontist & Oral Rehabilitation', 
            exp: '9 yrs exp', 
            avatar: 'https://images.unsplash.com/photo-1594824813689-ee0840b15798?auto=format&fit=crop&q=80&w=200' 
        }
    ];

    // Time Slots
    const timeSlots = [
        '09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', 
        '12:00 PM', '02:00 PM', '02:45 PM', '03:30 PM', 
        '04:15 PM', '05:00 PM'
    ];

    // Minimum booking date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    // Helper to format 12h time to 24h ISO
    const formatTimeSlotToHours = (slot) => {
        const parts = slot.split(' ');
        const time = parts[0];
        const modifier = parts[1];
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        setError('');

        if (!preferredDate) {
            setError('Please choose your preferred consultation date.');
            return;
        }

        const time24 = formatTimeSlotToHours(preferredTime);
        const combinedDateTime = new Date(`${preferredDate}T${time24}:00`);

        if (combinedDateTime < new Date()) {
            setError('Selected consultation slot cannot be in the past. Please select an upcoming date.');
            return;
        }

        setLoading(true);

        try {
            const token = patient.token;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const fullReason = `${selectedCategory} (${selectedDoctor})${reason ? ` - Notes: ${reason.trim()}` : ''}`;
            const payload = {
                preferredDate: combinedDateTime.toISOString(),
                reason: fullReason,
                doctorID: patient.doctorID || 1
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/patient-portal/appointments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/patient-portal/appointments`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (res.ok) {
                setBookingSuccess({
                    appointmentId: data.appointmentId || Math.floor(1000 + Math.random() * 9000),
                    dateTime: combinedDateTime,
                    service: selectedCategory,
                    doctor: selectedDoctor,
                    message: data.message || 'Appointment successfully confirmed.'
                });
            } else {
                setError(data.message || 'Unable to confirm appointment. That slot may already be reserved.');
            }
        } catch (err) {
            console.error('Booking failed:', err);
            setError('Network error while connecting to clinic scheduling system.');
        } finally {
            setLoading(false);
        }
    };

    // Calendar .ics download
    const downloadIcs = () => {
        if (!bookingSuccess) return;
        const start = new Date(bookingSuccess.dateTime);
        const end = new Date(start.getTime() + 45 * 60000);
        const formatIso = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:Dentia Dental Appointment - ${bookingSuccess.service}`,
            `DESCRIPTION:${bookingSuccess.service} with ${bookingSuccess.doctor}`,
            `LOCATION:Dentia Dental Clinic, Auckland CBD`,
            `DTSTART:${formatIso(start)}`,
            `DTEND:${formatIso(end)}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `Dentia_Appointment_${bookingSuccess.appointmentId}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // =========================================================================
    // SUCCESS VIEW (FULL PAGE CONFIRMATION)
    // =========================================================================
    if (bookingSuccess) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in py-6">
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-light-teal shadow-[0_8px_30px_rgba(16,36,75,0.06)] text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full bg-light-teal text-primary-hover font-mono text-xs font-bold uppercase tracking-wider">
                            Booking Confirmed #{bookingSuccess.appointmentId}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">
                            Your Appointment is Reserved!
                        </h2>
                        <p className="text-sm text-muted-text max-w-md mx-auto">
                            We look forward to welcoming you at Dentia Clinic. A confirmation has been logged to your patient medical profile.
                        </p>
                    </div>

                    {/* Booking Details Card */}
                    <div className="p-6 bg-warm-cream rounded-2xl border border-light-teal text-left max-w-lg mx-auto space-y-4">
                        <div className="flex items-start justify-between border-b border-light-teal/80 pb-3">
                            <div>
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Service</p>
                                <p className="text-sm font-bold text-dark-slate">{bookingSuccess.service}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                Confirmed
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-light-teal/80 pb-3">
                            <div>
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Date & Time</p>
                                <p className="text-xs font-bold text-dark-slate">
                                    {bookingSuccess.dateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-xs font-bold text-primary-teal">
                                    {bookingSuccess.dateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Specialist Clinician</p>
                                <p className="text-xs font-bold text-dark-slate">{bookingSuccess.doctor}</p>
                                <p className="text-[11px] text-muted-text">Dentia Dental Clinic</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-text">
                            <MapPin className="w-4 h-4 text-primary-teal shrink-0" />
                            <span>Dentia Dental Clinic · Auckland CBD Workspace</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            type="button"
                            onClick={downloadIcs}
                            className="w-full sm:w-auto px-6 py-3.5 bg-warm-cream hover:bg-light-teal border border-light-teal text-dark-slate font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                            <Download className="w-4 h-4 text-primary-teal" />
                            <span>Add to Calendar (.ics)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/portal/appointments')}
                            className="w-full sm:w-auto px-6 py-3.5 bg-primary-teal hover:bg-primary-hover text-white font-bold text-xs rounded-2xl shadow-md shadow-primary-teal/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Go to Appointments Hub</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MAIN PAGE VIEW (DEDICATED FULL-PAGE BOOKING EXPERIENCE)
    // =========================================================================
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            {/* Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        to="/portal/appointments"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-teal hover:text-primary-hover transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Appointments</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                        Book a Dental Consultation
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-text mt-0.5">
                        Schedule your routine hygiene visit, specialist consultation, or emergency appointment.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-2xl bg-light-teal text-primary-hover border border-light-teal text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-primary-teal" />
                    <span>Real-time Clinic Schedule</span>
                </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-3 animate-in shake">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* 2-Column Grid: Form (8 cols) + Sticky Summary (4 cols) */}
            <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: FORM SECTIONS (8 COLS) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* STEP 1: SELECT DENTAL SERVICE */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-primary-teal text-white flex items-center justify-center text-xs font-black">
                                    1
                                </span>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    Select Treatment or Dental Service
                                </h3>
                            </div>
                            <span className="text-[11px] text-muted-text font-medium">6 Services Available</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {services.map((svc) => {
                                const Icon = svc.icon;
                                const isSelected = selectedCategory === svc.id;

                                return (
                                    <div
                                        key={svc.id}
                                        onClick={() => setSelectedCategory(svc.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                                            isSelected 
                                                ? 'border-primary-teal bg-light-teal/40 shadow-xs' 
                                                : 'border-light-teal/70 hover:border-primary-teal/40 bg-white hover:bg-warm-cream/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                    isSelected ? 'bg-primary-teal text-white' : 'bg-light-teal text-primary-teal'
                                                }`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-dark-slate leading-tight">
                                                    {svc.label}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-muted-text border border-light-teal shrink-0">
                                                {svc.duration}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-muted-text leading-relaxed">
                                            {svc.desc}
                                        </p>

                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-teal" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* STEP 2: CHOOSE CLINICIAN SPECIALIST */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] space-y-5">
                        <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary-teal text-white flex items-center justify-center text-xs font-black">
                                2
                            </span>
                            <h3 className="text-base font-serif font-black text-dark-slate">
                                Preferred Specialist Clinician
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {doctors.map((doc) => {
                                const isSelected = selectedDoctor.includes(doc.name);

                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDoctor(`${doc.name} (${doc.title})`)}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center relative ${
                                            isSelected 
                                                ? 'border-primary-teal bg-light-teal/40 shadow-xs' 
                                                : 'border-light-teal/70 hover:border-primary-teal/40 bg-white hover:bg-warm-cream/50'
                                        }`}
                                    >
                                        <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2.5 ring-2 ring-light-teal shadow-xs">
                                            <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                                        </div>
                                        <h4 className="text-xs font-black text-dark-slate">{doc.name}</h4>
                                        <p className="text-[10px] text-muted-text leading-tight mt-0.5">{doc.title}</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-warm-cream text-[9px] font-bold text-primary-teal border border-light-teal">
                                            {doc.exp}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* STEP 3: DATE & TIME SLOT */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary-teal text-white flex items-center justify-center text-xs font-black">
                                3
                            </span>
                            <h3 className="text-base font-serif font-black text-dark-slate">
                                Preferred Consultation Date & Time
                            </h3>
                        </div>

                        {/* Date Picker Input */}
                        <div>
                            <label className="block text-xs font-bold text-dark-slate mb-2">
                                Select Consultation Date
                            </label>
                            <div className="relative max-w-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary-teal">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                                <input
                                    type="date"
                                    min={minDateStr}
                                    value={preferredDate}
                                    onChange={(e) => setPreferredDate(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-warm-cream border border-light-teal rounded-2xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Time Slot Chips */}
                        <div>
                            <label className="block text-xs font-bold text-dark-slate mb-2">
                                Select Time Slot (Auckland Timezone)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {timeSlots.map((slot) => {
                                    const isSelected = preferredTime === slot;
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setPreferredTime(slot)}
                                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                isSelected 
                                                    ? 'bg-primary-teal text-white shadow-xs' 
                                                    : 'bg-warm-cream text-dark-slate hover:bg-light-teal border border-light-teal/80'
                                            }`}
                                        >
                                            <Clock className="w-3 h-3 opacity-70" />
                                            <span>{slot}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STEP 4: SYMPTOMS & NOTES */}
                        <div>
                            <label className="block text-xs font-bold text-dark-slate mb-2">
                                Clinical Symptoms or Treatment Notes (Optional)
                            </label>
                            <textarea
                                rows="3"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe any pain, tooth sensitivity, tooth number, or general expectations for this visit..."
                                className="w-full p-3.5 bg-warm-cream border border-light-teal rounded-2xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 transition-all resize-none placeholder:text-muted-text/60"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: STICKY BOOKING SUMMARY (4 COLS) */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] space-y-6 sticky top-28">
                        <div>
                            <h3 className="text-base font-serif font-black text-dark-slate tracking-tight">
                                Booking Summary
                            </h3>
                            <p className="text-[11px] text-muted-text">Real-time scheduling overview</p>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Service */}
                            <div className="p-3.5 bg-warm-cream rounded-2xl border border-light-teal space-y-1">
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Service</p>
                                <p className="font-bold text-dark-slate leading-tight">{selectedCategory}</p>
                            </div>

                            {/* Clinician */}
                            <div className="p-3.5 bg-warm-cream rounded-2xl border border-light-teal space-y-1">
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Clinician</p>
                                <p className="font-bold text-dark-slate leading-tight">{selectedDoctor}</p>
                            </div>

                            {/* Date & Time */}
                            <div className="p-3.5 bg-warm-cream rounded-2xl border border-light-teal space-y-1">
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Appointment Slot</p>
                                <p className="font-bold text-primary-teal">
                                    {preferredDate 
                                        ? new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) 
                                        : 'Select Date Above'} · {preferredTime}
                                </p>
                            </div>

                            {/* Patient Badge */}
                            <div className="p-3.5 bg-light-teal/60 rounded-2xl border border-light-teal space-y-1">
                                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Patient</p>
                                <p className="font-bold text-dark-slate">{patientName}</p>
                                <p className="text-[10px] font-mono text-primary-hover font-bold">{patient.referenceNumber || 'DEN-2026-00001'}</p>
                            </div>
                        </div>

                        {/* Location notice */}
                        <div className="flex items-start gap-2.5 text-[11px] text-muted-text">
                            <MapPin className="w-4 h-4 text-primary-teal shrink-0 mt-0.5" />
                            <span>Dentia Dental Clinic, Level 4 Specialist Center, Auckland CBD.</span>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !preferredDate}
                            className="w-full py-4 px-6 bg-primary-teal hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-primary-teal/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Confirm & Reserve Consultation</span>
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-center text-muted-text">
                            Instant confirmation. Free cancellation up to 24 hours prior to visit.
                        </p>
                    </div>
                </div>

            </form>
        </div>
    );
}

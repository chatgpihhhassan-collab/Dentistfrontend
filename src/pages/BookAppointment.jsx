import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { 
    Calendar, User, Phone, Mail, CheckCircle2, Stethoscope, 
    ChevronRight, CalendarCheck, ExternalLink, ArrowRight, 
    Search, Check, Users, Sparkles, AlertCircle, Volume2, VolumeX
} from 'lucide-react';
import { downloadIcsFile, getGoogleCalendarUrl } from './AppointmentsList';
import { getPatientAvatarUrl } from '../utils/avatarUtils';
import aiVoice from '../utils/aiVoiceAssistant';

export default function BookAppointment() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(() => {
        const doc = JSON.parse(localStorage.getItem('doctor') || '{}');
        return { 
            fullName: '', 
            phone: '', 
            email: '', 
            preferredDate: '', 
            doctorID: doc.doctorID || doc.DoctorID || '', 
            reason: 'General Consultation' 
        };
    });
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    
    const [submitted, setSubmitted] = useState(false);
    const [lastBookedAppointment, setLastBookedAppointment] = useState(null);
    const [error, setError] = useState('');
    const [emailStatus, setEmailStatus] = useState(null);

    // Form Validation & AI Voice Assistant States
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [voiceStatus, setVoiceStatus] = useState({ enabled: true, speaking: false, currentText: '' });

    useEffect(() => {
        const unsubscribe = aiVoice.subscribe(state => setVoiceStatus(state));
        return () => unsubscribe();
    }, []);

    const validateField = (field, value) => {
        const val = typeof value === 'string' ? value.trim() : value;
        switch (field) {
            case 'doctorID':
                if (!val) return 'Please select an attending specialist.';
                return '';
            case 'fullName':
                if (!val) return 'Patient full name is required.';
                if (val.length < 2) return 'Patient name must contain at least 2 letters.';
                if (/[0-9]/.test(val)) return 'Patient name should not contain numbers.';
                if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Invalid characters in patient name.';
                return '';
            case 'phone':
                if (!val) return 'Contact phone number is required.';
                const digits = String(val).replace(/\D/g, '');
                if (digits.length < 10) return 'Phone number must contain at least 10 digits.';
                if (/[a-zA-Z]/.test(val)) return 'Phone number should not contain letters.';
                return '';
            case 'preferredDate':
                if (!val) return 'Appointment date and time is required.';
                const selectedTime = new Date(val).getTime();
                if (isNaN(selectedTime)) return 'Please choose a valid calendar date and time.';
                if (selectedTime < Date.now() - 60000) return 'Appointment date and time cannot be in the past.';
                return '';
            case 'email':
                if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    return 'Please enter a valid email format (e.g. name@domain.com).';
                }
                return '';
            default:
                return '';
        }
    };

    const validateAll = () => {
        const errs = {};
        ['doctorID', 'fullName', 'phone', 'preferredDate'].forEach(k => {
            const e = validateField(k, formData[k]);
            if (e) errs[k] = e;
        });
        if (formData.email) {
            const e = validateField('email', formData.email);
            if (e) errs.email = e;
        }
        return errs;
    };

    const handleFieldBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const fieldError = validateField(field, formData[field]);
        setErrors(prev => {
            const updated = { ...prev };
            if (fieldError) {
                updated[field] = fieldError;
                const labels = {
                    doctorID: 'attending specialist',
                    fullName: 'patient full name',
                    phone: 'contact phone number',
                    preferredDate: 'appointment date and time',
                    email: 'email address'
                };
                aiVoice.speakDoctorError(labels[field] || field, fieldError);
            } else {
                delete updated[field];
            }
            return updated;
        });
    };

    const dropdownRef = useRef(null);

    // Fetch doctors on mount
    useEffect(() => {
        fetch('/api/auth/doctors')
            .then(res => res.json())
            .then(data => {
                setDoctors(data);
                // If no doctor selected yet, default to first doctor or logged-in doctor
                if (!formData.doctorID && data.length > 0) {
                    const doc = JSON.parse(localStorage.getItem('doctor') || '{}');
                    const initialDocId = doc.doctorID || doc.DoctorID || data[0].doctorID;
                    setFormData(prev => ({ ...prev, doctorID: initialDocId }));
                }
            })
            .catch(err => console.error("Failed to fetch doctors:", err));
    }, []);

    // Fetch patients whenever selected doctorID changes
    useEffect(() => {
        let isMounted = true;
        const fetchPatientsForDoctor = async () => {
            try {
                setLoadingPatients(true);
                // 1. If a specific doctor is selected, fetch their patients
                if (formData.doctorID) {
                    const res = await fetch(`/api/patients/doctor/${formData.doctorID}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (isMounted) setPatients(Array.isArray(data) ? data : []);
                        return;
                    }
                }

                // 2. If no specific doctor is selected, fetch patients for all doctors in clinic
                let targetDoctorIds = [];
                if (doctors && doctors.length > 0) {
                    targetDoctorIds = doctors.map(d => d.doctorID);
                } else {
                    const doc = JSON.parse(localStorage.getItem('doctor') || '{}');
                    const loggedInDocId = doc.doctorID || doc.DoctorID;
                    targetDoctorIds = loggedInDocId ? [loggedInDocId] : [2];
                }

                const responses = await Promise.all(
                    targetDoctorIds.map(id =>
                        fetch(`/api/patients/doctor/${id}`)
                            .then(r => (r.ok ? r.json() : []))
                            .catch(() => [])
                    )
                );

                const merged = responses.flat();
                const uniqueMap = new Map();
                for (const p of merged) {
                    if (p && p.patientID && !uniqueMap.has(p.patientID)) {
                        uniqueMap.set(p.patientID, p);
                    }
                }

                if (isMounted) {
                    setPatients(Array.from(uniqueMap.values()));
                }
            } catch (err) {
                console.error("Failed to fetch patients:", err);
                if (isMounted) setPatients([]);
            } finally {
                if (isMounted) setLoadingPatients(false);
            }
        };

        fetchPatientsForDoctor();

        return () => {
            isMounted = false;
        };
    }, [formData.doctorID, doctors]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowPatientDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter patients based on typed text
    const filteredPatients = patients.filter(p => {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const search = (formData.fullName || '').toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        return fullName.includes(search) || phone.includes(search);
    });

    // When an existing patient is selected from the list
    const handleSelectPatient = (patient) => {
        const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        setFormData(prev => ({
            ...prev,
            fullName: fullName,
            phone: patient.phone || prev.phone,
            email: patient.email || prev.email
        }));
        setShowPatientDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Full Form Validation Check
        const validationErrors = validateAll();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            const allT = { doctorID: true, fullName: true, phone: true, preferredDate: true };
            if (formData.email) allT.email = true;
            setTouched(allT);

            const fieldKeys = ['doctorID', 'fullName', 'phone', 'preferredDate', 'email'];
            const firstFailedKey = fieldKeys.find(k => validationErrors[k]);
            const labels = {
                doctorID: 'attending specialist',
                fullName: 'patient full name',
                phone: 'contact phone number',
                preferredDate: 'appointment date and time',
                email: 'email address'
            };

            const spokenAlert = aiVoice.speakDoctorError(labels[firstFailedKey] || firstFailedKey, validationErrors[firstFailedKey]);
            setError(`Doctor, please correct: ${validationErrors[firstFailedKey]}`);

            const el = document.querySelector(`[name="${firstFailedKey}"]`);
            if (el) el.focus();
            return;
        }

        try {
            const payload = {
                fullName: (formData.fullName || '').trim(),
                phone: (formData.phone || '').trim(),
                email: (formData.email || '').trim() || null,
                preferredDate: formData.preferredDate,
                doctorID: formData.doctorID ? parseInt(formData.doctorID, 10) : null,
                reason: formData.reason || 'General Consultation',
                status: 'Confirmed'
            };

            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                setSubmitted(true);
                setLastBookedAppointment({ ...formData, appointmentID: data.appointmentID || Date.now(), status: 'Confirmed' });
                setEmailStatus({ sent: data.emailSent, error: data.emailError });
                setError('');
                setErrors({});
                try {
                    aiVoice.speakDoctorSuccess(`consultation appointment for ${formData.fullName} has been confirmed successfully.`);
                } catch (vErr) {}
            } else {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.message || 'Failed to book appointment. Please try again.';
                setError(msg);
                try {
                    aiVoice.speakDoctorError(null, msg);
                } catch (vErr) {}
            }
        } catch (err) {
            console.error("Booking submit error:", err);
            setError('Server connection error.');
            try {
                aiVoice.speakDoctorError(null, 'Server connection error occurred.');
            } catch (vErr) {}
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FA] text-dark-slate font-sans selection:bg-light-teal selection:text-primary-teal relative flex flex-col">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-[#EAF0FC] overflow-hidden flex flex-col lg:flex-row">
                    
                    {/* Left side - Clinic Banner */}
                    <div className="lg:w-1/2 relative min-h-[420px] lg:min-h-full">
                        <img 
                            src="/images/slider/2.jpg" 
                            alt="Dentia Premium Clinic" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent z-10"></div>
                        <div className="absolute inset-0 z-20 flex flex-col justify-end p-10 lg:p-14 space-y-3">
                            <span className="text-[#4A7CD2] font-bold tracking-widest uppercase text-xs">Direct Clinic Reservation</span>
                            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">Patient Appointment Booking</h2>
                            <p className="text-white/80 text-sm leading-relaxed max-w-sm font-light">
                                Fast scheduling with registered patient directory lookup, doctor assignment, and auto-calendar sync.
                            </p>
                        </div>
                    </div>

                    {/* Right side - Booking Form & Confirmation */}
                    <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 bg-white relative">
                        
                        {submitted && lastBookedAppointment ? (
                            <div className="space-y-6 py-4 animate-scale-up">
                                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3">
                                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Appointment Confirmed!</h3>
                                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                                        Your consultation for <strong>{lastBookedAppointment.fullName}</strong> is scheduled for:
                                    </p>
                                    <div className="text-sm font-bold text-[#4A7CD2] bg-white py-2 px-4 rounded-xl border border-emerald-200 inline-block">
                                        📅 {new Date(lastBookedAppointment.preferredDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </div>
                                    {emailStatus?.sent === true && (
                                        <p className="text-xs text-emerald-700 font-semibold">✓ Confirmation email has been sent.</p>
                                    )}
                                </div>

                                {/* Calendar Sync Buttons */}
                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">Save to Your Calendar</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => downloadIcsFile(lastBookedAppointment)}
                                            className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                        >
                                            <CalendarCheck className="w-4 h-4 text-emerald-600" />
                                            <span>Add to Phone (.ics)</span>
                                        </button>
                                        <a
                                            href={getGoogleCalendarUrl(lastBookedAppointment)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            <span>Google Calendar</span>
                                        </a>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            setSubmitted(false);
                                            setFormData({ fullName: '', phone: '', email: '', preferredDate: '', doctorID: formData.doctorID, reason: 'General Consultation' });
                                        }}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
                                    >
                                        Book Another
                                    </button>
                                    <Link
                                        to="/appointments"
                                        className="flex-1 py-3 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-2xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 shadow-md"
                                    >
                                        <span>View Schedule</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <span className="text-[#4A7CD2] font-bold tracking-widest uppercase text-xs">Direct Clinic Reservation</span>
                                        <h3 className="text-3xl font-bold text-slate-900">Request an Appointment</h3>
                                        <p className="text-slate-500 text-xs font-medium">Select your specialist and pick an existing patient or enter a new one.</p>
                                    </div>

                                    {/* AI Voice Assistant Toggle & Speaking Indicator */}
                                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => aiVoice.toggle()}
                                            title={voiceStatus.enabled ? "Mute AI Voice Assistant" : "Unmute AI Voice Assistant"}
                                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                                voiceStatus.enabled ? 'text-[#4A7CD2]' : 'text-slate-400'
                                            }`}
                                        >
                                            {voiceStatus.enabled ? (
                                                <>
                                                    <Volume2 className={`w-4 h-4 ${voiceStatus.speaking ? 'text-blue-600 animate-bounce' : ''}`} />
                                                    <span className="text-[10.5px] font-black">
                                                        {voiceStatus.speaking ? 'AI Speaking...' : 'AI Voice: Active'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <VolumeX className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[10.5px] font-black text-slate-400">AI Voice: Muted</span>
                                                </>
                                            )}
                                        </button>
                                        {voiceStatus.speaking && (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Live AI Spoken Alert Banner */}
                                {voiceStatus.speaking && voiceStatus.currentText && (
                                    <div className="mb-4 p-2.5 bg-blue-50/95 border-2 border-blue-300 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                                                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                                            </div>
                                            <p className="text-xs font-bold text-blue-950 truncate">
                                                <span className="font-black text-[#2563EB] uppercase text-[10px] mr-1">AI Voice:</span>
                                                {voiceStatus.currentText}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => aiVoice.stop()}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 cursor-pointer flex-shrink-0"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                                
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* 1. Select Doctor field */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-700 block">Attending Specialist *</label>
                                            {patients.length > 0 && (
                                                <span className="text-[11px] font-bold text-[#4A7CD2] bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {patients.length} registered patients
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select
                                                name="doctorID"
                                                value={formData.doctorID}
                                                onBlur={() => handleFieldBlur('doctorID')}
                                                onChange={(e) => {
                                                    setFormData({...formData, doctorID: e.target.value});
                                                    if (errors.doctorID) setErrors(prev => ({ ...prev, doctorID: '' }));
                                                }}
                                                className={`w-full pl-11 pr-8 py-3 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer border transition-all ${
                                                    errors.doctorID && touched.doctorID
                                                        ? 'bg-red-50/40 border-red-500 focus:ring-2 focus:ring-red-400/20'
                                                        : 'bg-[#F8FAFC] border-[#E2E8F0] focus:ring-2 focus:ring-[#4A7CD2]/20'
                                                }`}
                                            >
                                                <option value="" disabled>Choose a Doctor...</option>
                                                {doctors.map(doc => (
                                                    <option key={doc.doctorID} value={doc.doctorID}>
                                                        Dr. {doc.firstName} {doc.lastName} ({doc.speciality || 'General Dentistry'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.doctorID && touched.doctorID && (
                                            <p className="text-[10.5px] font-bold text-red-600 flex items-center gap-1 animate-fade-in">
                                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                <span>{errors.doctorID}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* 2. Full Name field with Loaded Patient List Dropdown */}
                                    <div className="space-y-1.5 relative" ref={dropdownRef}>
                                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                            <span>Full Name *</span>
                                            <span className="text-[10px] text-slate-400 font-normal">Select from doctor's list or type new</span>
                                        </label>
                                        
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                name="fullName"
                                                type="text" 
                                                value={formData.fullName}
                                                onFocus={() => setShowPatientDropdown(true)}
                                                onBlur={() => handleFieldBlur('fullName')}
                                                onChange={(e) => {
                                                    setFormData({...formData, fullName: e.target.value});
                                                    setShowPatientDropdown(true);
                                                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                                                }}
                                                placeholder="Click to select registered patient or type..." 
                                                className={`w-full pl-11 pr-10 py-3 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none border transition-all ${
                                                    errors.fullName && touched.fullName
                                                        ? 'bg-red-50/40 border-red-500 focus:ring-2 focus:ring-red-400/20'
                                                        : 'bg-[#F8FAFC] border-[#E2E8F0] focus:ring-2 focus:ring-[#4A7CD2]/20'
                                                }`}
                                            />
                                            {loadingPatients ? (
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                    <span className="w-4 h-4 border-2 border-[#4A7CD2] border-t-transparent rounded-full animate-spin block"></span>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs"
                                                >
                                                    ▼
                                                </button>
                                            )}
                                        </div>
                                        {errors.fullName && touched.fullName && (
                                            <p className="text-[10.5px] font-bold text-red-600 flex items-center gap-1 animate-fade-in">
                                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                <span>{errors.fullName}</span>
                                            </p>
                                        )}

                                        {/* Dropdown Suggestions List */}
                                        {showPatientDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                                                <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Users className="w-3 h-3 text-[#4A7CD2]" />
                                                    <span>Patients for selected doctor ({filteredPatients.length})</span>
                                                </div>

                                                {filteredPatients.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                                        No existing patient matched "{formData.fullName}". Typing as a new patient.
                                                    </div>
                                                ) : (
                                                    filteredPatients.map(patient => (
                                                        <div
                                                            key={patient.patientID}
                                                            onClick={() => handleSelectPatient(patient)}
                                                            className="p-3 hover:bg-blue-50/60 transition cursor-pointer flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0 bg-white flex items-center justify-center">
                                                                    <img 
                                                                        src={getPatientAvatarUrl(patient)} 
                                                                        alt={`${patient.firstName} ${patient.lastName}`}
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-xs text-slate-900 block">
                                                                        {patient.firstName} {patient.lastName}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-500 block">
                                                                        ID: #{patient.patientID} • {patient.phone || 'No phone'} • {patient.gender || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[#4A7CD2] bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-xs">
                                                                Select
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Contact Details Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 block">Phone Number *</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    name="phone"
                                                    type="tel" 
                                                    value={formData.phone}
                                                    onBlur={() => handleFieldBlur('phone')}
                                                    onChange={(e) => {
                                                        setFormData({...formData, phone: e.target.value});
                                                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                                    }}
                                                    placeholder="0300 1234567" 
                                                    className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none border transition-all ${
                                                        errors.phone && touched.phone
                                                            ? 'bg-red-50/40 border-red-500 focus:ring-2 focus:ring-red-400/20'
                                                            : 'bg-[#F8FAFC] border-[#E2E8F0] focus:ring-2 focus:ring-[#4A7CD2]/20'
                                                    }`}
                                                />
                                            </div>
                                            {errors.phone && touched.phone && (
                                                <p className="text-[10.5px] font-bold text-red-600 flex items-center gap-1 animate-fade-in">
                                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                    <span>{errors.phone}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    name="email"
                                                    type="email" 
                                                    value={formData.email}
                                                    onBlur={() => handleFieldBlur('email')}
                                                    onChange={(e) => {
                                                        setFormData({...formData, email: e.target.value});
                                                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                                    }}
                                                    placeholder="patient@gmail.com" 
                                                    className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none border transition-all ${
                                                        errors.email && touched.email
                                                            ? 'bg-red-50/40 border-red-500 focus:ring-2 focus:ring-red-400/20'
                                                            : 'bg-[#F8FAFC] border-[#E2E8F0] focus:ring-2 focus:ring-[#4A7CD2]/20'
                                                    }`}
                                                />
                                            </div>
                                            {errors.email && touched.email && (
                                                <p className="text-[10.5px] font-bold text-red-600 flex items-center gap-1 animate-fade-in">
                                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                    <span>{errors.email}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4. Preferred Date Field */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">Preferred Date & Time *</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                name="preferredDate"
                                                type="datetime-local" 
                                                value={formData.preferredDate}
                                                onBlur={() => handleFieldBlur('preferredDate')}
                                                onChange={(e) => {
                                                    setFormData({...formData, preferredDate: e.target.value});
                                                    if (errors.preferredDate) setErrors(prev => ({ ...prev, preferredDate: '' }));
                                                }}
                                                className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer border transition-all ${
                                                    errors.preferredDate && touched.preferredDate
                                                        ? 'bg-red-50/40 border-red-500 focus:ring-2 focus:ring-red-400/20'
                                                        : 'bg-[#F8FAFC] border-[#E2E8F0] focus:ring-2 focus:ring-[#4A7CD2]/20'
                                                }`}
                                            />
                                        </div>
                                        {errors.preferredDate && touched.preferredDate && (
                                            <p className="text-[10.5px] font-bold text-red-600 flex items-center gap-1 animate-fade-in">
                                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                <span>{errors.preferredDate}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* 5. Reason for Visit */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 block">Reason for Consultation</label>
                                        <input 
                                            type="text" 
                                            value={formData.reason}
                                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                            placeholder="e.g. Toothache, Pulpotomy MTA & SSC, Space Maintainer, Cleaning" 
                                            className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-xs font-medium text-slate-800 focus:outline-none"
                                        />
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {[
                                                'General Checkup',
                                                '👶 Pediatric Consult',
                                                '🟣 Pulpotomy & SSC',
                                                '🟡 Space Maintainer',
                                                '🛡️ Fluoride Varnish',
                                                '✨ Teeth Cleaning',
                                                '🩹 Toothache / Caries'
                                            ].map(chip => (
                                                <button
                                                    key={chip}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, reason: chip.replace(/^[^\w]+/, '').trim() })}
                                                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#EAF0FC] hover:text-[#4A7CD2] border border-slate-200 transition-colors cursor-pointer"
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        type="submit" 
                                        className="w-full py-4 mt-4 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white font-bold text-sm rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2"
                                    >
                                        <span>Confirm Appointment</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}

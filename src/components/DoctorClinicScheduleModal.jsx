import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Clock, 
    Phone, 
    Mail, 
    Building2, 
    X, 
    Save,
    Check,
    AlertCircle,
    Calendar,
    Sparkles
} from 'lucide-react';
import { getClinicLiveStatus } from '../utils/clinicScheduleUtils';
import API_BASE_URL from '../config/apiConfig';

const SCHEDULE_PRESETS = [
    { label: '3:00 PM - 8:00 PM (Afternoon / Evening)', value: 'Mon - Sat: 03:00 - 20:00' },
    { label: '9:00 AM - 6:00 PM (Full Day Practice)', value: 'Mon - Sat: 09:00 - 18:00' },
    { label: '9:00 AM - 5:00 PM (Weekdays + Half Sat)', value: 'Mon - Fri: 09:00 - 17:00, Sat: 09:00 - 14:00' },
    { label: '10:00 AM - 10:00 PM (7 Days Extended)', value: 'Daily: 10:00 - 22:00' },
    { label: '24/7 Dental Emergency Care', value: 'Daily: 24/7 Emergency Care' }
];

export default function DoctorClinicScheduleModal({ isOpen, onClose, doctor, onDoctorUpdated }) {
    const [phone, setPhone] = useState(doctor?.phone || '+92 334 5081202');
    const [email, setEmail] = useState(doctor?.email || 'bajwa.376@gmail.com');
    const [clinicName, setClinicName] = useState(doctor?.clinicName || 'Bajwa Dental & Oral Surgery Clinic');
    const [operatingHours, setOperatingHours] = useState(doctor?.clinicOperatingHours || 'Mon - Sat: 03:00 - 20:00');
    const [overrideMode, setOverrideMode] = useState(() => {
        if (doctor?.isClinicOpenManualOverride === true || doctor?.isClinicOpenManualOverride === 1) return 'open';
        if (doctor?.isClinicOpenManualOverride === false || doctor?.isClinicOpenManualOverride === 0) return 'closed';
        return 'auto';
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Lock body scroll and listen for Escape key when modal is open
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Sync state whenever doctor changes or modal opens
    useEffect(() => {
        if (isOpen && doctor) {
            setPhone(doctor.phone || '+92 334 5081202');
            setEmail(doctor.email || 'bajwa.376@gmail.com');
            setClinicName(doctor.clinicName || 'Bajwa Dental & Oral Surgery Clinic');
            setOperatingHours(doctor.clinicOperatingHours || 'Mon - Sat: 03:00 - 20:00');
            if (doctor.isClinicOpenManualOverride === true || doctor.isClinicOpenManualOverride === 1) {
                setOverrideMode('open');
            } else if (doctor.isClinicOpenManualOverride === false || doctor.isClinicOpenManualOverride === 0) {
                setOverrideMode('closed');
            } else {
                setOverrideMode('auto');
            }
            setMessage(null);
        }
    }, [isOpen, doctor]);

    if (!isOpen) return null;

    // Compute live status
    const manualVal = overrideMode === 'open' ? true : (overrideMode === 'closed' ? false : null);
    const liveStatus = getClinicLiveStatus(operatingHours, manualVal);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setMessage(null);

        const docId = doctor?.doctorID || doctor?.id;
        const payload = {
            phone: phone.trim(),
            email: email.trim(),
            clinicName: clinicName.trim(),
            clinicOperatingHours: operatingHours.trim(),
            isClinicOpenManualOverride: manualVal
        };

        try {
            let res;
            try {
                res = await fetch(`/api/auth/doctors/${docId}/clinic-profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`${API_BASE_URL}/api/auth/doctors/${docId}/clinic-profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            // Update doctor in local storage
            const updatedDoctor = {
                ...doctor,
                phone: payload.phone,
                email: payload.email,
                clinicName: payload.clinicName,
                clinicOperatingHours: payload.clinicOperatingHours,
                isClinicOpenManualOverride: payload.isClinicOpenManualOverride
            };

            localStorage.setItem('doctor', JSON.stringify(updatedDoctor));
            window.dispatchEvent(new CustomEvent('dentia:doctor-profile-updated', { detail: updatedDoctor }));

            if (onDoctorUpdated) {
                onDoctorUpdated(updatedDoctor);
            }

            setMessage({ type: 'success', text: '✅ Doctor clinic schedule and live operating status published successfully!' });
            setTimeout(() => {
                onClose();
            }, 900);
        } catch (err) {
            const fallbackDoc = {
                ...doctor,
                ...payload
            };
            localStorage.setItem('doctor', JSON.stringify(fallbackDoc));
            window.dispatchEvent(new CustomEvent('dentia:doctor-profile-updated', { detail: fallbackDoc }));
            if (onDoctorUpdated) onDoctorUpdated(fallbackDoc);
            setMessage({ type: 'info', text: 'Updated locally in clinician workspace.' });
            setTimeout(() => {
                onClose();
            }, 900);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/65 backdrop-blur-sm animate-fade-in p-3 sm:p-5">
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

            {/* Centering flex container: guarantees natural top:0 alignment on small screens without negative overflow */}
            <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
                {/* Modal Card - Fixed Max Height, Pinned Header, Scrollable Content & Pinned Footer */}
                <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                    
                    {/* 🌟 1. PINNED HEADER (Always Visible at Top - Never Cut Off) */}
                    <div className="px-5 py-4 bg-gradient-to-r from-[#10244B] via-[#162e5d] to-[#4A7CD2] text-white flex items-center justify-between shrink-0 shadow-sm">
                        <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner shrink-0">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="truncate">
                            <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                                Clinic Profile & Operating Schedule
                            </h3>
                            <p className="text-[11px] text-[#EAF0FC] font-medium truncate">
                                Live hours, phone, email & open/closed indicator
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-2"
                        title="Close Modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 🌟 2. SCROLLABLE FORM BODY (flex-1 min-h-0) */}
                <form id="clinic-schedule-form" onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-700 scrollbar-thin scrollbar-thumb-slate-300">
                    
                    {/* Live Status Pill Ribbon */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Status:</span>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                                liveStatus.isOpen 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                    : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${liveStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                <span>{liveStatus.label}</span>
                                <span className="text-[10px] font-medium opacity-85">({liveStatus.detail})</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                            Updates Top Bar
                        </span>
                    </div>

                    {/* Operating Status Mode (Segmented 3-Way Control) */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                            Clinic Operational State
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setOverrideMode('auto')}
                                className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                    overrideMode === 'auto'
                                        ? 'bg-primary-teal/10 border-primary-teal text-primary-teal shadow-xs ring-1 ring-primary-teal/30 font-extrabold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="text-[11px]">⚙️ Auto Clock</span>
                                <span className="text-[9px] font-normal opacity-75">By weekly hours</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOverrideMode('open')}
                                className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                    overrideMode === 'open'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/30 font-extrabold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="text-[11px] flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Force OPEN
                                </span>
                                <span className="text-[9px] font-normal opacity-75">Emergency slots</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOverrideMode('closed')}
                                className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                    overrideMode === 'closed'
                                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-1 ring-rose-500/30 font-extrabold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="text-[11px] flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Force CLOSED
                                </span>
                                <span className="text-[9px] font-normal opacity-75">Break / Holiday</span>
                            </button>
                        </div>
                    </div>

                    {/* Operating Schedule Input & Presets Dropdown */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                            Clinic Operating Schedule & Hours
                        </label>
                        <div className="relative">
                            <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                value={operatingHours}
                                onChange={(e) => setOperatingHours(e.target.value)}
                                placeholder="e.g. Mon - Sat: 03:00 - 20:00"
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent bg-white shadow-2xs"
                                required
                            />
                        </div>

                        {/* Quick Presets Dropdown */}
                        <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Quick Preset:</span>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) setOperatingHours(e.target.value);
                                }}
                                value={SCHEDULE_PRESETS.some(p => p.value === operatingHours) ? operatingHours : ''}
                                className="flex-1 px-2.5 py-1 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-teal cursor-pointer"
                            >
                                <option value="" disabled>-- Select Standard Dental Timings --</option>
                                {SCHEDULE_PRESETS.map((p, idx) => (
                                    <option key={idx} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Doctor Phone & Email (2-Column Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-800">
                                Doctor / Clinic Phone
                            </label>
                            <div className="relative">
                                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+92 334 5081202"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent bg-white shadow-2xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-800">
                                Doctor / Clinic Email
                            </label>
                            <div className="relative">
                                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="bajwa.376@gmail.com"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent bg-white shadow-2xs"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clinic / Practice Title */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-800">
                            Clinic / Practice Brand Name
                        </label>
                        <div className="relative">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="Bajwa Dental & Oral Surgery Clinic"
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent bg-white shadow-2xs"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-2.5 rounded-xl text-xs font-bold ${
                            message.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                            {message.text}
                        </div>
                    )}
                </form>

                {/* 🌟 3. PINNED FOOTER (Always Visible at Bottom) */}
                <div className="px-5 py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-end space-x-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="clinic-schedule-form"
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save & Publish Schedule'}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>,
    document.body
    );
}

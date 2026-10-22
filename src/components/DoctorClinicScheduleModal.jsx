import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    Phone, 
    Mail, 
    Building2, 
    X, 
    Save
} from 'lucide-react';
import { getClinicLiveStatus } from '../utils/clinicScheduleUtils';
import API_BASE_URL from '../config/apiConfig';

const SCHEDULE_PRESETS = [
    { label: 'Afternoon & Evening (3 PM - 8 PM)', value: 'Mon - Sat: 03:00 - 20:00' },
    { label: 'Full Day Practice (9 AM - 6 PM)', value: 'Mon - Sat: 09:00 - 18:00' },
    { label: 'Weekdays + Half Saturday', value: 'Mon - Fri: 09:00 - 17:00, Sat: 09:00 - 14:00' },
    { label: 'Morning & Evening Shift', value: 'Mon - Sat: 10:00 - 14:00, 17:00 - 21:00' },
    { label: 'All 7 Days (10 AM - 10 PM)', value: 'Daily: 10:00 - 22:00' },
    { label: '24/7 Dental Emergency', value: 'Daily: 24/7 Emergency Care' }
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

    // Compute live preview based on active inputs
    const manualVal = overrideMode === 'open' ? true : (overrideMode === 'closed' ? false : null);
    const liveStatus = getClinicLiveStatus(operatingHours, manualVal);

    const handleSave = async (e) => {
        e.preventDefault();
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

            setMessage({ type: 'success', text: '✅ Doctor clinic timing, contact info and live open/closed status updated!' });
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            // Even if offline, save locally
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
            }, 1200);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-primary-teal to-[#164e63] text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold tracking-tight">Doctor Clinic Profile & Live Hours</h3>
                            <p className="text-xs text-white/80 font-medium">Manage clinic timings, phone, email & live open/closed indicator</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-slate-700">
                    
                    {/* Live Preview Card */}
                    <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Top Bar Live Preview</span>
                            <span className="text-[10px] font-normal text-slate-400">Updates instantly on top bar</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 pt-1">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Phone className="w-3.5 h-3.5 text-primary-teal" />
                                <span>{phone || '+92 334 5081202'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5 text-primary-teal" />
                                <span>{operatingHours || 'Mon - Sat: 03:00 - 20:00'}</span>
                            </div>
                            {/* Live Status Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                liveStatus.isOpen 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                    : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${liveStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                <span>{liveStatus.label}</span>
                                <span className="text-[10px] font-normal opacity-80">({liveStatus.detail})</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Mail className="w-3.5 h-3.5 text-primary-teal" />
                                <span>{email || 'bajwa.376@gmail.com'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Mode Toggle */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800">
                            Clinic Live Open / Closed Status
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setOverrideMode('auto')}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                    overrideMode === 'auto'
                                        ? 'bg-primary-teal/10 border-primary-teal text-primary-teal shadow-xs ring-1 ring-primary-teal/40'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="font-extrabold text-[12px]">⚙️ Auto Schedule</span>
                                <span className="text-[10px] font-normal opacity-75">By operating hours</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOverrideMode('open')}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                    overrideMode === 'open'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/40'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="font-extrabold text-[12px] flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Force OPEN
                                </span>
                                <span className="text-[10px] font-normal opacity-75">Emergency / Extra hours</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setOverrideMode('closed')}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                    overrideMode === 'closed'
                                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-1 ring-rose-500/40'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="font-extrabold text-[12px] flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-rose-500"></span> Force CLOSED
                                </span>
                                <span className="text-[10px] font-normal opacity-75">Break / Holiday / Surgery</span>
                            </button>
                        </div>
                    </div>

                    {/* Operating Hours Input & Presets */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                            Clinic Operating Schedule & Hours
                        </label>
                        <div className="relative">
                            <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                value={operatingHours}
                                onChange={(e) => setOperatingHours(e.target.value)}
                                placeholder="e.g. Mon - Sat: 03:00 - 20:00"
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                                required
                            />
                        </div>
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Presets:</span>
                            {SCHEDULE_PRESETS.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setOperatingHours(p.value)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                                        operatingHours === p.value
                                            ? 'bg-primary-teal text-white border-primary-teal font-bold'
                                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Doctor Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-800">
                                Doctor / Clinic Phone
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+92 334 5081202"
                                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-800">
                                Doctor / Clinic Email
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="bajwa.376@gmail.com"
                                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clinic / Practice Title */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                            Clinic / Practice Name
                        </label>
                        <div className="relative">
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="Bajwa Dental & Oral Surgery Clinic"
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-xl text-xs font-bold ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{saving ? 'Saving...' : 'Save & Publish Schedule'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

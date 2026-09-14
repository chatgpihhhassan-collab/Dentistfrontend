import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function BookAppointmentModal({ isOpen, onClose, onBookingSuccess }) {
    const [selectedCategory, setSelectedCategory] = useState('Routine Checkup & Prophylaxis Cleaning');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('10:00');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

    const categories = [
        { id: 'Routine Checkup & Prophylaxis Cleaning', label: 'Routine Checkup & Cleaning', duration: '45 mins', desc: 'Full mouth scaling, dental hygiene & exam' },
        { id: 'Toothache or Emergency Consultation', label: 'Toothache / Emergency', duration: '30 mins', desc: 'Acute pain, broken tooth, or swelling' },
        { id: 'Orthodontic Alignment & Braces Review', label: 'Orthodontics & Aligners', duration: '30 mins', desc: 'Progress check, aligner delivery, wire change' },
        { id: 'Cosmetic Teeth Whitening Evaluation', label: 'Cosmetic Whitening', duration: '45 mins', desc: 'Shade analysis and laser bleaching consultation' },
        { id: 'Restorative Crown or Cavity Filling', label: 'Restorative Filling / Crown', duration: '60 mins', desc: 'Composite filling, inlay/onlay, or crown check' },
    ];

    const timeSlots = [
        '09:00', '09:45', '10:30', '11:15', '12:00',
        '14:00', '14:45', '15:30', '16:15', '17:00'
    ];

    const handleBook = async (e) => {
        e.preventDefault();
        setError('');

        if (!preferredDate) {
            setError('Please select a preferred date for your consultation.');
            return;
        }

        const combinedDateTime = new Date(`${preferredDate}T${preferredTime}:00`);
        if (combinedDateTime < new Date()) {
            setError('Selected appointment time cannot be in the past.');
            return;
        }

        setLoading(true);

        try {
            const token = patient.token;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const payload = {
                preferredDate: combinedDateTime.toISOString(),
                reason: `${selectedCategory}${reason ? ` - ${reason.trim()}` : ''}`,
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
                onBookingSuccess(data);
                onClose();
            } else {
                setError(data.message || 'Unable to book consultation. Slot might be unavailable.');
            }
        } catch (err) {
            console.error('Booking error:', err);
            setError('Network connection error while reserving appointment.');
        } finally {
            setLoading(false);
        }
    };

    // Minimum date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-slate/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-light-teal space-y-6 animate-fadeIn relative">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-light-teal pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-black text-dark-slate">Book a Dental Consultation</h3>
                            <p className="text-xs text-muted-text">Instant online scheduling with your clinic</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-text hover:text-dark-slate hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleBook} className="space-y-4">
                    {/* 1. Category Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-dark-slate">1. Select Dental Service</label>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                                        selectedCategory === cat.id
                                            ? 'border-primary-teal bg-light-teal/50 font-bold text-dark-slate'
                                            : 'border-slate-200 hover:border-slate-300 text-muted-text'
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-dark-slate">{cat.label}</p>
                                        <p className="text-[11px] text-muted-text">{cat.desc}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-light-teal font-mono">
                                        {cat.duration}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Date Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark-slate">2. Preferred Date</label>
                            <input
                                type="date"
                                required
                                min={minDateStr}
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal text-xs font-medium outline-none"
                            />
                        </div>

                        {/* 3. Time Slot */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark-slate">3. Time Slot</label>
                            <select
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal text-xs font-medium outline-none"
                            >
                                {timeSlots.map(time => (
                                    <option key={time} value={time}>
                                        {time} {parseInt(time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 4. Notes */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-dark-slate">4. Specific Symptoms or Notes (Optional)</label>
                        <textarea
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Sensitivity on upper left tooth when drinking cold water..."
                            className="w-full p-3 rounded-xl bg-warm-cream/50 border border-slate-200 focus:border-primary-teal text-xs font-medium outline-none resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-muted-text hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary-teal/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <span>Reserving slot...</span> : <span>Confirm Booking</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

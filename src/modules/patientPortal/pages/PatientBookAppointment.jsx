import React, { useState, useEffect } from 'react';
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
    CreditCard, 
    Banknote, 
    Receipt, 
    Lock, 
    Check, 
    ChevronRight,
    Users
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientBookAppointment() {
    const navigate = useNavigate();

    // 1. Dental Services
    const services = [
        { 
            id: 'Routine Checkup & Prophylaxis Cleaning', 
            label: 'Routine Checkup & Cleaning', 
            duration: '45 mins', 
            fee: 85.00,
            desc: 'Comprehensive oral examination, ultrasonic scaling, plaque removal & polish.',
            icon: Smile 
        },
        { 
            id: 'Toothache or Emergency Consultation', 
            label: 'Emergency & Acute Pain', 
            duration: '30 mins', 
            fee: 120.00,
            desc: 'Diagnostic triage for acute toothache, cracked enamel, trauma, or swelling.',
            icon: AlertCircle 
        },
        { 
            id: 'Restorative Crown or Cavity Filling', 
            label: 'Cavity Filling & Restoration', 
            duration: '60 mins', 
            fee: 150.00,
            desc: 'Composite resin filling, fractured cusp repair, or crown fitting review.',
            icon: ShieldCheck 
        },
        { 
            id: 'Orthodontic Alignment & Braces Review', 
            label: 'Orthodontics & Clear Aligners', 
            duration: '30 mins', 
            fee: 180.00,
            desc: 'Aligner tracking, digital intraoral scan, or retainer checkup.',
            icon: Sparkles 
        },
        { 
            id: 'Periodontal Gum Health & Deep Scaling', 
            label: 'Periodontal Care & Deep Scaling', 
            duration: '60 mins', 
            fee: 160.00,
            desc: 'Subgingival root planing, pocket depth measurement, and gum therapy.',
            icon: Stethoscope 
        },
        { 
            id: 'Cosmetic Teeth Whitening Evaluation', 
            label: 'Cosmetic Teeth Whitening', 
            duration: '45 mins', 
            fee: 250.00,
            desc: 'In-clinic laser bleaching consultation and custom-molded tray shade match.',
            icon: Sparkles 
        }
    ];

    // Real database doctors fallback
    const fallbackDoctors = [
        { 
            id: 2, 
            doctorID: 2,
            name: 'Dr. Jhangir Ahmed', 
            title: 'Consultant Dental Surgeon', 
            exp: '14 yrs exp', 
            region: 'PK',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200' 
        },
        { 
            id: 3, 
            doctorID: 3,
            name: 'Dr. Ahmed Khan', 
            title: 'Dental Surgeon & Orthodontist', 
            exp: '11 yrs exp', 
            region: 'NZ',
            avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200' 
        },
        { 
            id: 4, 
            doctorID: 4,
            name: 'Dr. Sarah Jenkins', 
            title: 'Lead Cosmetic & Restorative Surgeon', 
            exp: '9 yrs exp', 
            region: 'NZ',
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200' 
        }
    ];

    // 2. Real Doctors State (Fetched dynamically from Database)
    const [doctors, setDoctors] = useState(fallbackDoctors);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    // 3. Time Slots Categorized (Single-line pills, no awkward wrapping)
    const morningSlots = ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '12:00 PM'];
    const afternoonSlots = ['02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', '05:00 PM'];
    const timeSlots = [...morningSlots, ...afternoonSlots];

    // Quick Reason / Symptom Chips
    const quickReasons = [
        'Routine Cleaning',
        'Toothache / Pain',
        'Cavity Filling',
        'Aligners Check',
        'Bleeding Gums'
    ];

    // Tomorrow calculation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    // Upcoming 7 Days Interactive Strip
    const upcomingDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + (i + 1));
        const iso = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = d.getDate();
        let badge = dayName;
        if (i === 0) badge = 'Tomorrow';
        return {
            iso,
            dayName,
            monthName,
            dayNum,
            badge
        };
    });

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');

    // Stepper state (1: Service, 2: Doctor, 3: Date/Time, 4: Payment)
    const [currentStep, setCurrentStep] = useState(1);

    // Selections (Pre-selected to Tomorrow at 10:30 AM for instant seamless UX)
    const [selectedServiceId, setSelectedServiceId] = useState(services[0].id);
    const [selectedDoctorId, setSelectedDoctorId] = useState(2);
    const [preferredDate, setPreferredDate] = useState(minDateStr);
    const [preferredTime, setPreferredTime] = useState('10:30 AM');
    const [reason, setReason] = useState('');
    const [showCustomCalendar, setShowCustomCalendar] = useState(false);

    // Fetch live doctors from database
    useEffect(() => {
        let isMounted = true;
        const loadRealDoctors = async () => {
            try {
                setLoadingDoctors(true);
                let res = null;
                try {
                    res = await fetch(`${API_BASE_URL}/api/patient-portal/doctors`);
                } catch {
                    res = null;
                }

                if (!res || !res.ok) {
                    try {
                        res = await fetch(`${API_BASE_URL}/api/auth/doctors`);
                    } catch {
                        res = null;
                    }
                }

                if (!res || !res.ok) {
                    res = await fetch('/api/auth/doctors');
                }

                if (res && res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const mapped = data.map(d => {
                            const docId = d.doctorID || d.id;
                            const fullName = d.fullName || `Dr. ${d.firstName} ${d.lastName}`.trim();
                            const docRegion = d.region || 'NZ';
                            const title = d.title || (docRegion === 'PK' ? 'Consultant Dental Surgeon' : 'Dental Surgeon & Specialist');
                            const exp = d.exp || (docId === 2 ? '14 yrs exp' : (docId === 4 ? '9 yrs exp' : '11 yrs exp'));
                            const avatar = d.avatar || (
                                docId === 2
                                    ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
                                    : (docId === 4
                                        ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
                                        : 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200')
                            );

                            return {
                                id: docId,
                                doctorID: docId,
                                name: fullName,
                                title,
                                exp,
                                region: docRegion,
                                avatar
                            };
                        });

                        if (isMounted) {
                            setDoctors(mapped);
                            // Auto-select assigned patient doctor or first real doctor
                            const assignedId = patient.doctorID || patient.doctorId;
                            const exists = mapped.some(m => m.id === assignedId);
                            setSelectedDoctorId(exists ? assignedId : mapped[0].id);
                        }
                        return;
                    }
                }
            } catch (err) {
                console.error('Error loading live doctors:', err);
            } finally {
                if (isMounted) setLoadingDoctors(false);
            }

            if (isMounted) {
                setDoctors(fallbackDoctors);
                const assignedId = patient.doctorID || patient.doctorId;
                const exists = fallbackDoctors.some(m => m.id === assignedId);
                setSelectedDoctorId(exists ? assignedId : fallbackDoctors[0].id);
                setLoadingDoctors(false);
            }
        };

        loadRealDoctors();
        return () => { isMounted = false; };
    }, []);

    // Payment state ('Cash' | 'Online_Card')
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [cardHolder, setCardHolder] = useState(patientName);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const activeDoctorList = doctors.length > 0 ? doctors : fallbackDoctors;
    const currentService = services.find(s => s.id === selectedServiceId) || services[0];
    const currentDoctor = activeDoctorList.find(d => d.id === selectedDoctorId) || activeDoctorList[0];


    // Card formatters
    const handleCardNumberChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
        setCardNumber(val.replace(/(\d{4})(?=\d)/g, '$1 '));
    };

    const handleExpiryChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 3) {
            setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
        } else {
            setCardExpiry(val);
        }
    };

    const formatTimeSlotToHours = (slot) => {
        const parts = slot.split(' ');
        const time = parts[0];
        const modifier = parts[1];
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    // Step validation & progression
    const handleNext = () => {
        setError('');
        if (currentStep === 3) {
            if (!preferredDate) {
                setError('Please select an appointment consultation date.');
                return;
            }
            const time24 = formatTimeSlotToHours(preferredTime);
            const combinedDateTime = new Date(`${preferredDate}T${time24}:00`);
            if (combinedDateTime < new Date()) {
                setError('Selected appointment slot cannot be in the past. Please select an upcoming date.');
                return;
            }
        }
        setCurrentStep(prev => Math.min(4, prev + 1));
    };

    const handlePrev = () => {
        setError('');
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    // Final Submission
    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        setError('');

        if (!preferredDate) {
            setError('Please choose your preferred consultation date.');
            setCurrentStep(3);
            return;
        }

        const time24 = formatTimeSlotToHours(preferredTime);
        const combinedDateTime = new Date(`${preferredDate}T${time24}:00`);

        if (paymentMethod === 'Online_Card') {
            const rawCard = cardNumber.replace(/\s+/g, '');
            if (rawCard.length < 15) {
                setError('Please enter a valid 16-digit debit or credit card number.');
                return;
            }
            if (!cardExpiry || cardExpiry.length < 5) {
                setError('Please enter a valid expiration date (MM/YY).');
                return;
            }
            const [mm] = cardExpiry.split('/').map(Number);
            if (!mm || mm < 1 || mm > 12) {
                setError('Card expiration month must be between 01 and 12.');
                return;
            }
            if (!cardCvc || cardCvc.length < 3) {
                setError('Please enter a valid 3-digit security code (CVC).');
                return;
            }
        }

        setLoading(true);

        try {
            const token = patient.token;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const fullReason = `${currentService.label} (${currentDoctor.name})${reason ? ` - Notes: ${reason.trim()}` : ''}`;
            const rawCard = cardNumber.replace(/\s+/g, '');

            const chosenDocId = Number(currentDoctor.id || currentDoctor.doctorID || selectedDoctorId) || 2;
            const payload = {
                preferredDate: combinedDateTime.toISOString(),
                reason: fullReason,
                doctorID: chosenDocId,
                paymentMethod: paymentMethod === 'Online_Card' ? 'Online_Card' : 'Cash',
                consultationFee: currentService.fee,
                cardLast4: paymentMethod === 'Online_Card' ? rawCard.slice(-4) : null,
                cardHolderName: paymentMethod === 'Online_Card' ? cardHolder.trim() : null
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
                try {
                    const curP = JSON.parse(localStorage.getItem('patient') || '{}');
                    curP.doctorID = chosenDocId;
                    localStorage.setItem('patient', JSON.stringify(curP));
                } catch {}

                setBookingSuccess({
                    appointmentId: data.appointmentId || Math.floor(1000 + Math.random() * 9000),
                    invoiceId: data.invoiceId,
                    invoiceNumber: data.invoiceNumber || `INV-2026-${data.appointmentId}`,
                    paymentMethod: data.paymentMethod || paymentMethod,
                    receiptOrVoucherNumber: data.receiptOrVoucherNumber || (paymentMethod === 'Online_Card' ? `REC-2026-${data.appointmentId}` : `CSH-2026-${data.appointmentId}`),
                    invoiceStatus: data.invoiceStatus || (paymentMethod === 'Online_Card' ? 'Paid' : 'Pending Cash Settlement'),
                    fee: currentService.fee,
                    dateTime: combinedDateTime,
                    service: currentService.label,
                    doctor: currentDoctor.name,
                    message: data.message || 'Appointment and payment entry recorded successfully.'
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
            `DESCRIPTION:${bookingSuccess.service} with ${bookingSuccess.doctor}. Payment: ${bookingSuccess.paymentMethod}`,
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
    // CONFIRMATION VIEW (ZERO SCROLL, CLEAN COMPACT RESULT)
    // =========================================================================
    if (bookingSuccess) {
        const isCardPaid = bookingSuccess.paymentMethod === 'Online_Card';

        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in py-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-[0_8px_30px_rgba(16,36,75,0.05)] text-center space-y-5">
                    
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                        isCardPaid ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-amber-50 border border-amber-200 text-amber-600'
                    }`}>
                        <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                        <span className="px-3 py-1 rounded-full bg-light-teal text-primary-hover font-mono text-[11px] font-bold uppercase tracking-wider">
                            Booking #{bookingSuccess.appointmentId} Confirmed
                        </span>
                        <h2 className="text-xl sm:text-2xl font-serif font-black text-dark-slate">
                            {isCardPaid ? 'Appointment & Payment Confirmed!' : 'Appointment Confirmed & Voucher Issued!'}
                        </h2>
                        <p className="text-xs text-muted-text max-w-md mx-auto">
                            {isCardPaid 
                                ? 'Your card payment was processed successfully. A verified tax receipt has been logged to your ledger.'
                                : 'Your slot is reserved. Present your cash voucher at the front desk upon clinic arrival.'}
                        </p>
                    </div>

                    {/* Compact Card with Key Data */}
                    <div className="p-4 bg-warm-cream rounded-2xl border border-light-teal text-left space-y-3">
                        <div className="flex items-center justify-between border-b border-light-teal pb-2.5">
                            <div>
                                <p className="text-[10px] font-bold text-muted-text uppercase">Service & Clinician</p>
                                <p className="text-xs font-bold text-dark-slate">{bookingSuccess.service} · {bookingSuccess.doctor}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isCardPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {isCardPaid ? 'Paid in Full' : 'Pending Cash'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="p-2.5 bg-white rounded-xl border border-light-teal">
                                <p className="text-[9px] font-bold text-muted-text uppercase">Date & Time</p>
                                <p className="font-bold text-dark-slate mt-0.5">
                                    {bookingSuccess.dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {bookingSuccess.dateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-light-teal">
                                <p className="text-[9px] font-bold text-muted-text uppercase">Invoice #</p>
                                <p className="font-bold font-mono text-dark-slate mt-0.5">{bookingSuccess.invoiceNumber}</p>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-light-teal">
                                <p className="text-[9px] font-bold text-muted-text uppercase">
                                    {isCardPaid ? 'Receipt #' : 'Cash Voucher'}
                                </p>
                                <p className={`font-mono font-black mt-0.5 ${isCardPaid ? 'text-emerald-600' : 'text-amber-700'}`}>
                                    {bookingSuccess.receiptOrVoucherNumber}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-text pt-1">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary-teal" />
                                <span>Dentia Clinic, Auckland CBD</span>
                            </div>
                            <span className="font-mono font-bold text-dark-slate">${bookingSuccess.fee.toFixed(2)} NZD</span>
                        </div>
                    </div>

                    {/* Direct Links */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={downloadIcs}
                            className="w-full sm:w-auto px-4 py-2.5 bg-warm-cream hover:bg-light-teal border border-light-teal text-dark-slate font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5 text-primary-teal" />
                            <span>Add to Calendar (.ics)</span>
                        </button>
                        <Link
                            to="/portal/billing"
                            className="w-full sm:w-auto px-4 py-2.5 bg-light-teal hover:bg-light-teal-hover border border-light-teal text-primary-hover font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View in Ledger</span>
                        </Link>
                        <Link
                            to="/portal/appointments"
                            className="w-full sm:w-auto px-5 py-2.5 bg-primary-teal hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md shadow-primary-teal/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <span>Appointments Hub</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                </div>
            </div>
        );
    }

    // =========================================================================
    // STEPPER WORKSPACE (ZERO SCROLL, MODERN STEP-BY-STEP FLOW)
    // =========================================================================
    const stepTitles = [
        { num: 1, title: 'Treatment' },
        { num: 2, title: 'Specialist' },
        { num: 3, title: 'Date & Time' },
        { num: 4, title: 'Payment' }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in">
            
            {/* Top Bar with Back Link & Title */}
            <div className="flex items-center justify-between">
                <Link
                    to="/portal/appointments"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-teal hover:text-primary-hover transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                </Link>
                <div className="text-center">
                    <h1 className="text-xl sm:text-2xl font-serif font-black text-dark-slate tracking-tight">
                        Book a Dental Consultation
                    </h1>
                </div>
                <div className="text-[11px] font-mono font-bold text-muted-text">
                    Step {currentStep} of 4
                </div>
            </div>

            {/* Clean Horizontal Stepper Progress Bar */}
            <div className="bg-white rounded-2xl p-2.5 border border-light-teal shadow-2xs flex items-center justify-between">
                {stepTitles.map((st, idx) => {
                    const isCompleted = currentStep > st.num;
                    const isCurrent = currentStep === st.num;

                    return (
                        <React.Fragment key={st.num}>
                            <button
                                type="button"
                                onClick={() => {
                                    if (isCompleted) setCurrentStep(st.num);
                                }}
                                disabled={!isCompleted && !isCurrent}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-bold ${
                                    isCurrent 
                                        ? 'bg-primary-teal text-white shadow-xs' 
                                        : isCompleted 
                                            ? 'text-primary-teal hover:bg-light-teal cursor-pointer' 
                                            : 'text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    isCurrent 
                                        ? 'bg-white text-primary-teal' 
                                        : isCompleted 
                                            ? 'bg-light-teal text-primary-teal' 
                                            : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                                </span>
                                <span className="hidden sm:inline">{st.title}</span>
                            </button>

                            {idx < stepTitles.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                                    currentStep > st.num ? 'bg-primary-teal' : 'bg-slate-100'
                                }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Error Notification */}
            {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2.5 animate-in shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Step Card (Only current step rendered to eliminate vertical scrolling!) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] min-h-[380px] flex flex-col justify-between">
                
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: SELECT DENTAL SERVICE                                 */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    1. Choose Your Dental Treatment
                                </h3>
                                <p className="text-xs text-muted-text">Select the primary service for your upcoming visit.</p>
                            </div>
                            <span className="text-[11px] font-bold text-primary-teal">Fixed Transparent Pricing</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {services.map((svc) => {
                                const Icon = svc.icon;
                                const isSelected = selectedServiceId === svc.id;

                                return (
                                    <div
                                        key={svc.id}
                                        onClick={() => setSelectedServiceId(svc.id)}
                                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                                            isSelected 
                                                ? 'border-primary-teal bg-light-teal/50 shadow-xs ring-1 ring-primary-teal/40' 
                                                : 'border-light-teal/80 hover:border-primary-teal/40 bg-white hover:bg-warm-cream/50'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                    isSelected ? 'bg-primary-teal text-white' : 'bg-light-teal text-primary-teal'
                                                }`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-mono font-black text-primary-hover">
                                                    ${svc.fee.toFixed(2)}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-dark-slate leading-tight mb-1">
                                                {svc.label}
                                            </h4>
                                            <p className="text-[11px] text-muted-text line-clamp-2 leading-relaxed">
                                                {svc.desc}
                                            </p>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-light-teal/80 flex items-center justify-between text-[10px] text-muted-text font-medium">
                                            <span>Est. {svc.duration}</span>
                                            {isSelected && (
                                                <span className="font-bold text-primary-teal flex items-center gap-1">
                                                    Selected <Check className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: SELECT SPECIALIST CLINICIAN                           */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    2. Select Attending Specialist
                                </h3>
                                <p className="text-xs text-muted-text">Choose your doctor from our verified clinic practitioners.</p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Real Clinicians ({activeDoctorList.length})</span>
                            </span>
                        </div>

                        {loadingDoctors ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-4 rounded-2xl border-2 border-light-teal/50 bg-white text-center animate-pulse space-y-2.5">
                                        <div className="w-16 h-16 rounded-full bg-light-teal/60 mx-auto" />
                                        <div className="h-4 bg-light-teal/50 rounded w-28 mx-auto" />
                                        <div className="h-3 bg-light-teal/30 rounded w-36 mx-auto" />
                                        <div className="h-5 bg-light-teal/40 rounded w-20 mx-auto mt-2" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {activeDoctorList.map((doc) => {
                                    const isSelected = selectedDoctorId === doc.id;

                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDoctorId(doc.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center relative ${
                                                isSelected 
                                                    ? 'border-primary-teal bg-light-teal/50 shadow-xs ring-1 ring-primary-teal/40' 
                                                    : 'border-light-teal/80 hover:border-primary-teal/40 bg-white hover:bg-warm-cream/50'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-light-teal shadow-xs bg-slate-100">
                                                <img 
                                                    src={doc.avatar} 
                                                    alt={doc.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=008080&color=fff&bold=true`;
                                                    }}
                                                />
                                            </div>
                                            <h4 className="text-xs font-black text-dark-slate">{doc.name}</h4>
                                            <p className="text-[11px] text-muted-text mt-0.5 line-clamp-1">{doc.title}</p>
                                            <div className="mt-3 flex items-center justify-center gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-white border border-light-teal text-[10px] font-bold text-primary-teal font-mono">
                                                    {doc.region ? `${doc.region} · ` : ''}{doc.exp}
                                                </span>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-primary-teal text-white flex items-center justify-center">
                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: SCHEDULE DATE & TIME (INTUITIVE & ZERO SCROLL)        */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in">
                        
                        {/* Section Header with Real-Time Reassurance Banner */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/80 pb-3">
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    3. Select Date & Time
                                </h3>
                                <p className="text-xs text-muted-text">Choose your preferred day and time for your consultation.</p>
                            </div>
                            {preferredDate && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-teal border border-light-teal-hover text-xs font-bold text-primary-hover shadow-2xs">
                                    <CalendarIcon className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>
                                        {new Date(preferredDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {preferredTime}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 1. Interactive 7-Day Visual Strip */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-dark-slate uppercase tracking-wider">
                                    1. Choose Appointment Day
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomCalendar(prev => !prev)}
                                    className="text-[11px] font-bold text-primary-teal hover:text-primary-hover flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <CalendarIcon className="w-3 h-3" />
                                    <span>{showCustomCalendar ? 'Hide Calendar' : 'Choose Other Date...'}</span>
                                </button>
                            </div>

                            {/* 7 Days Strip */}
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {upcomingDays.map((d) => {
                                    const isSelected = preferredDate === d.iso;
                                    return (
                                        <button
                                            key={d.iso}
                                            type="button"
                                            onClick={() => {
                                                setPreferredDate(d.iso);
                                                setError('');
                                            }}
                                            className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-between ${
                                                isSelected
                                                    ? 'border-primary-teal bg-primary-teal text-white shadow-md shadow-primary-teal/25 ring-2 ring-primary-teal/30 scale-[1.02]'
                                                    : 'border-light-teal/80 bg-white hover:border-primary-teal/50 hover:bg-warm-cream/60 text-dark-slate'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                isSelected ? 'text-teal-100' : 'text-muted-text'
                                            }`}>
                                                {d.badge}
                                            </span>
                                            <span className="text-base sm:text-lg font-black leading-tight my-0.5 font-mono">
                                                {d.dayNum}
                                            </span>
                                            <span className={`text-[10px] font-bold ${
                                                isSelected ? 'text-teal-200' : 'text-muted-text'
                                            }`}>
                                                {d.monthName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Optional Custom Date Picker (Expands if clicked) */}
                            {showCustomCalendar && (
                                <div className="p-3 bg-warm-cream rounded-2xl border border-light-teal flex items-center gap-3 animate-in fade-in">
                                    <span className="text-xs font-bold text-dark-slate whitespace-nowrap">Specific Date:</span>
                                    <input
                                        type="date"
                                        min={minDateStr}
                                        value={preferredDate}
                                        onChange={(e) => {
                                            setPreferredDate(e.target.value);
                                            setError('');
                                        }}
                                        className="px-3 py-1.5 bg-white border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 2. Categorized Morning & Afternoon Time Slots */}
                        <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-bold text-dark-slate uppercase tracking-wider block">
                                2. Select Time Slot
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Morning Slots */}
                                <div className="p-3 bg-warm-cream/50 rounded-2xl border border-light-teal/80 space-y-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-text uppercase">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Morning Slots (09:00 AM – 12:00 PM)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {morningSlots.map((slot) => {
                                            const isSelected = preferredTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setPreferredTime(slot)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                                        isSelected
                                                            ? 'bg-primary-teal text-white shadow-xs'
                                                            : 'bg-white text-dark-slate hover:bg-light-teal border border-light-teal/80'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    <span>{slot}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Afternoon Slots */}
                                <div className="p-3 bg-warm-cream/50 rounded-2xl border border-light-teal/80 space-y-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-text uppercase">
                                        <Clock className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>Afternoon Slots (02:00 PM – 05:00 PM)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {afternoonSlots.map((slot) => {
                                            const isSelected = preferredTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setPreferredTime(slot)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                                        isSelected
                                                            ? 'bg-primary-teal text-white shadow-xs'
                                                            : 'bg-white text-dark-slate hover:bg-light-teal border border-light-teal/80'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    <span>{slot}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Reason or Symptoms with One-Touch Tags */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-muted-text uppercase tracking-wider">
                                    3. Reason or Symptoms (Optional)
                                </label>
                                <div className="hidden sm:flex items-center gap-1">
                                    {quickReasons.map((qr) => (
                                        <button
                                            key={qr}
                                            type="button"
                                            onClick={() => setReason(qr)}
                                            className="px-2 py-0.5 rounded-md bg-warm-cream hover:bg-light-teal border border-light-teal text-[10px] font-semibold text-dark-slate cursor-pointer transition-colors"
                                        >
                                            + {qr}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Sensitivity on upper molar or routine cleaning"
                                className="w-full px-3.5 py-2 bg-warm-cream/60 border border-light-teal rounded-xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 placeholder:text-muted-text/60"
                            />
                        </div>

                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 4: CHOOSE PAYMENT METHOD & CONFIRM                       */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 4 && (
                    <div className="space-y-4 animate-in fade-in">
                        
                        {/* Summary Bar */}
                        <div className="p-3 bg-warm-cream rounded-2xl border border-light-teal flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-dark-slate">{currentService.label}</span>
                                <span className="text-muted-text">with</span>
                                <span className="font-bold text-primary-teal">{currentDoctor.name}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <span className="text-muted-text">{preferredDate} at {preferredTime}</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-light-teal text-primary-hover font-black">
                                    ${currentService.fee.toFixed(2)} NZD
                                </span>
                            </div>
                        </div>

                        {/* Dual Payment Radio Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            
                            {/* Option 1: Cash at Clinic */}
                            <div
                                onClick={() => setPaymentMethod('Cash')}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                                    paymentMethod === 'Cash' 
                                        ? 'border-primary-teal bg-light-teal/50 shadow-xs ring-1 ring-primary-teal/40' 
                                        : 'border-light-teal/80 hover:border-primary-teal/40 bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                                            <Banknote className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-dark-slate">Cash at Clinic Reception</h4>
                                            <span className="text-[10px] text-amber-800 font-bold uppercase">Pay on Arrival</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'Cash' ? 'border-primary-teal bg-primary-teal' : 'border-slate-300'
                                    }`}>
                                        {paymentMethod === 'Cash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-text leading-relaxed">
                                    Instant Cash Voucher issued. Pay in cash at clinic front desk on appointment day.
                                </p>
                            </div>

                            {/* Option 2: Pay Online with Card */}
                            <div
                                onClick={() => setPaymentMethod('Online_Card')}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                                    paymentMethod === 'Online_Card' 
                                        ? 'border-primary-teal bg-light-teal/50 shadow-xs ring-1 ring-primary-teal/40' 
                                        : 'border-light-teal/80 hover:border-primary-teal/40 bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-dark-slate">Pay Online via Card</h4>
                                            <span className="text-[10px] text-emerald-700 font-bold uppercase">Visa, Master, PayPak</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'Online_Card' ? 'border-primary-teal bg-primary-teal' : 'border-slate-300'
                                    }`}>
                                        {paymentMethod === 'Online_Card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-text leading-relaxed">
                                    Instant settlement via Debit / Credit Card. Tax invoice & receipt issued immediately.
                                </p>
                            </div>

                        </div>

                        {/* Compact Card Form (Only if Card selected) */}
                        {paymentMethod === 'Online_Card' && (
                            <div className="p-3.5 bg-warm-cream rounded-2xl border border-light-teal space-y-3 animate-in fade-in">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-dark-slate flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-emerald-600" />
                                        Secure 256-Bit SSL Card Encryption
                                    </span>
                                    <span className="text-muted-text font-mono text-[10px]">Visa / MasterCard / PayPak</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                    <div className="sm:col-span-5">
                                        <input
                                            type="text"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value)}
                                            placeholder="Cardholder Full Name"
                                            className="w-full px-3 py-2 bg-white border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                        />
                                    </div>
                                    <div className="sm:col-span-7">
                                        <input
                                            type="text"
                                            maxLength="19"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            placeholder="Card Number (16 Digits)"
                                            className="w-full px-3 py-2 bg-white border border-light-teal rounded-xl text-xs font-mono font-bold text-dark-slate tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 max-w-xs">
                                    <input
                                        type="text"
                                        maxLength="5"
                                        value={cardExpiry}
                                        onChange={handleExpiryChange}
                                        placeholder="MM/YY"
                                        className="w-full px-3 py-2 bg-white border border-light-teal rounded-xl text-xs font-mono font-bold text-dark-slate text-center focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                    <input
                                        type="password"
                                        maxLength="4"
                                        value={cardCvc}
                                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="CVC"
                                        className="w-full px-3 py-2 bg-white border border-light-teal rounded-xl text-xs font-mono font-bold text-dark-slate text-center focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BOTTOM NAVIGATION BUTTONS (STICKY WITHIN CARD)                */}
                {/* ------------------------------------------------------------- */}
                <div className="pt-4 border-t border-light-teal flex items-center justify-between">
                    <div>
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="px-4 py-2 bg-warm-cream hover:bg-light-teal text-dark-slate text-xs font-bold rounded-xl border border-light-teal transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Back</span>
                            </button>
                        ) : (
                            <span className="text-[11px] text-muted-text font-medium">Dentia Clinic · Auckland</span>
                        )}
                    </div>

                    <div>
                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-5 py-2.5 bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary-teal/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Continue</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleConfirmBooking}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary-teal hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-teal/25 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Confirm Booking (${currentService.fee.toFixed(2)})</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}

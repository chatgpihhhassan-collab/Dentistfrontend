import React, { useState, useEffect, useMemo } from 'react';
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
    Users,
    Search,
    RefreshCw,
    Layers,
    Tag,
    Info
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

// Color themes tailored for clinical dental procedure categories
const categoryBadgeColors = {
    'Examination & Diagnosis': 'bg-sky-50 text-sky-700 border-sky-200',
    'Preventive Dentistry': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Fillings & Restorative Treatment': 'bg-teal-50 text-teal-700 border-teal-200',
    'Crowns & Bridges': 'bg-amber-50 text-amber-700 border-amber-200',
    'Root Canal Treatment': 'bg-purple-50 text-purple-700 border-purple-200',
    'Extractions & Oral Surgery': 'bg-rose-50 text-rose-700 border-rose-200',
    'Gum / Periodontal Treatment': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Dentures': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Dental Implants': 'bg-blue-50 text-blue-700 border-blue-200',
    'Cosmetic Dentistry': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'Orthodontics': 'bg-violet-50 text-violet-700 border-violet-200',
    'Pediatric Dentistry': 'bg-orange-50 text-orange-700 border-orange-200',
    'Emergency Dental Treatment': 'bg-red-50 text-red-700 border-red-200',
    'Prosthetic / Laboratory Procedures': 'bg-slate-100 text-slate-700 border-slate-300',
    'Other Dental Services': 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
};

export default function PatientBookAppointment() {
    const navigate = useNavigate();

    // Standard fallback services in case API connection is establishing
    const fallbackServices = [
        { 
            procedureCode: '011', 
            procedureName: 'Comprehensive Oral Examination & Consultation', 
            estimatedDuration: '45 mins', 
            standardFee: 85.00,
            category: 'Examination & Diagnosis',
            description: 'Comprehensive dental examination, ultrasonic scaling, plaque removal & polish.'
        },
        { 
            procedureCode: '012', 
            procedureName: 'Periodic Dental Checkup & Cleaning', 
            estimatedDuration: '30 mins', 
            standardFee: 65.00,
            category: 'Preventive Dentistry',
            description: 'Routine six-month clinical oral review, prophylaxis cleaning & fluoride therapy.'
        },
        { 
            procedureCode: '531', 
            procedureName: 'Composite Filling & Tooth Restoration', 
            estimatedDuration: '60 mins', 
            standardFee: 150.00,
            category: 'Fillings & Restorative Treatment',
            description: 'Tooth-colored aesthetic resin restoration for cavities, fractured enamel or decay.'
        },
        { 
            procedureCode: '311', 
            procedureName: 'Tooth Extraction & Oral Surgery', 
            estimatedDuration: '45 mins', 
            standardFee: 160.00,
            category: 'Extractions & Oral Surgery',
            description: 'Gentle surgical or routine tooth removal with local anesthetic and care kit.'
        },
        { 
            procedureCode: '411', 
            procedureName: 'Root Canal Endodontic Therapy', 
            estimatedDuration: '60 mins', 
            standardFee: 350.00,
            category: 'Root Canal Treatment',
            description: 'Complete extirpation, pulp canal disinfection, and sterile root canal filling.'
        },
        { 
            procedureCode: '119', 
            procedureName: 'Cosmetic Teeth Whitening Consultation', 
            estimatedDuration: '45 mins', 
            standardFee: 250.00,
            category: 'Cosmetic Dentistry',
            description: 'Professional chairside power bleaching and custom-molded shade consultation.'
        }
    ];

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');

    // 1. Doctors State (Fetched dynamically from Database)
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [selectedDoctorId, setSelectedDoctorId] = useState(patient.doctorID || patient.doctorId || null);

    // 2. Doctor Treatment Plans / Procedures State (Fetched dynamically based on selectedDoctorId)
    const [doctorProcedures, setDoctorProcedures] = useState([]);
    const [loadingProcedures, setLoadingProcedures] = useState(false);
    const [doctorCurrency, setDoctorCurrency] = useState('NZD');
    const [selectedProcedureKeys, setSelectedProcedureKeys] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [procedureSearch, setProcedureSearch] = useState('');

    // 3. Time Slots Categorized
    const morningSlots = ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '12:00 PM'];
    const afternoonSlots = ['02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', '05:00 PM'];

    // Quick Reason / Symptom Chips
    const quickReasons = [
        'Routine Cleaning',
        'Toothache / Acute Pain',
        'Cavity Filling',
        'Crown / Root Canal Review',
        'Aligners Check'
    ];

    // Date calculations
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
        return { iso, dayName, monthName, dayNum, badge };
    });

    // Stepper state (1: Specialist, 2: Treatment, 3: Date/Time, 4: Payment)
    const [currentStep, setCurrentStep] = useState(1);

    // Date & Time selections
    const [preferredDate, setPreferredDate] = useState(minDateStr);
    const [preferredTime, setPreferredTime] = useState('10:30 AM');
    const [reason, setReason] = useState('');
    const [showCustomCalendar, setShowCustomCalendar] = useState(false);

    // Payment state ('Cash' | 'Online_Card')
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [cardHolder, setCardHolder] = useState(patientName);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(null);

    // =========================================================================
    // 1. FETCH LIVE DOCTORS FROM DATABASE
    // =========================================================================
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
                    if (Array.isArray(data) && data.length > 0 && isMounted) {
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

                        setDoctors(mapped);

                        // Auto-select assigned patient doctor or first doctor in list
                        const assignedId = patient.doctorID || patient.doctorId;
                        const targetDoc = mapped.find(m => m.id === assignedId) || mapped[0];
                        if (targetDoc) {
                            setSelectedDoctorId(targetDoc.id);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading live database doctors:', err);
            } finally {
                if (isMounted) setLoadingDoctors(false);
            }
        };

        loadRealDoctors();
        return () => { isMounted = false; };
    }, []);

    // =========================================================================
    // 2. DYNAMICALLY LOAD TREATMENT PLANS & FEE SCHEDULE FOR SELECTED DOCTOR
    // =========================================================================
    useEffect(() => {
        if (!selectedDoctorId) return;
        let isMounted = true;

        const targetDoc = doctors.find(d => d.id === selectedDoctorId);
        const isPk = selectedDoctorId === 2 || targetDoc?.region === 'PK';
        setDoctorCurrency(isPk ? 'PKR' : 'NZD');

        const loadDoctorFeeSchedule = async () => {
            try {
                setLoadingProcedures(true);
                let res = null;
                try {
                    res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${selectedDoctorId}`);
                } catch {
                    res = null;
                }

                if (!res || !res.ok) {
                    try {
                        res = await fetch(`/api/treatment-pricing/doctor/${selectedDoctorId}`);
                    } catch {
                        res = null;
                    }
                }

                if (res && res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        const procs = (data.procedures || []).filter(p => p.isActive !== false);
                        setDoctorProcedures(procs);
                        const curr = data.currency || (data.region === 'PK' || isPk ? 'PKR' : 'NZD');
                        setDoctorCurrency(curr);

                        // If procedure list loaded, auto-select first or keep existing
                        if (procs.length > 0) {
                            setSelectedProcedureKeys(prev => {
                                if (prev.length > 0) {
                                    const valid = prev.filter(k => procs.some(p => (p.procedureCode || p.procedureName) === k));
                                    return valid.length > 0 ? valid : [procs[0].procedureCode || procs[0].procedureName];
                                }
                                return [procs[0].procedureCode || procs[0].procedureName];
                            });
                        }
                    }
                } else {
                    // Fallback to standard services
                    if (isMounted) {
                        setDoctorCurrency(isPk ? 'PKR' : 'NZD');
                        setDoctorProcedures(fallbackServices);
                        setSelectedProcedureKeys([fallbackServices[0].procedureCode]);
                    }
                }
            } catch (err) {
                console.error(`Failed to load treatments for doctor ${selectedDoctorId}:`, err);
                if (isMounted) {
                    setDoctorCurrency(isPk ? 'PKR' : 'NZD');
                    setDoctorProcedures(fallbackServices);
                    setSelectedProcedureKeys([fallbackServices[0].procedureCode]);
                }
            } finally {
                if (isMounted) setLoadingProcedures(false);
            }
        };

        loadDoctorFeeSchedule();
        return () => { isMounted = false; };
    }, [selectedDoctorId]);

    // Active procedures list (Doctor's procedures or fallback)
    const activeProcedures = doctorProcedures.length > 0 ? doctorProcedures : fallbackServices;

    // Derived Categories
    const categories = useMemo(() => {
        const set = new Set(activeProcedures.map(p => p.category).filter(Boolean));
        return ['All', ...Array.from(set)];
    }, [activeProcedures]);

    // Filtered Procedures based on category and search query
    const filteredProcedures = useMemo(() => {
        let list = activeProcedures;
        if (selectedCategory !== 'All') {
            list = list.filter(p => p.category === selectedCategory);
        }
        if (procedureSearch.trim()) {
            const q = procedureSearch.toLowerCase().trim();
            list = list.filter(p => 
                (p.procedureName && p.procedureName.toLowerCase().includes(q)) ||
                (p.procedureCode && p.procedureCode.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        return list;
    }, [activeProcedures, selectedCategory, procedureSearch]);

    // Toggle a procedure in the multi-select set
    const toggleProcedure = (proc) => {
        const key = proc.procedureCode || proc.procedureName;
        setSelectedProcedureKeys(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
        setError('');
    };

    // Derived selected procedures list
    const selectedProceduresList = useMemo(() => {
        return activeProcedures.filter(p => selectedProcedureKeys.includes(p.procedureCode || p.procedureName));
    }, [activeProcedures, selectedProcedureKeys]);

    // Aggregated Fee & Summary names
    const totalConsultationFee = useMemo(() => {
        if (selectedProceduresList.length === 0) return 0;
        return selectedProceduresList.reduce((sum, p) => sum + Number(p.standardFee || p.fee || 85.00), 0);
    }, [selectedProceduresList]);

    const combinedProceduresName = useMemo(() => {
        if (selectedProceduresList.length === 0) return 'Dental Consultation';
        return selectedProceduresList.map(p => p.procedureName || p.label).join(', ');
    }, [selectedProceduresList]);

    // Current selected doctor & procedure objects
    const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0] || { 
        id: selectedDoctorId || 2, 
        name: 'Dr. Jhangir Ahmed', 
        title: 'Consultant Dental Surgeon' 
    };

    const currentProcedure = selectedProceduresList[0] || activeProcedures[0] || fallbackServices[0];
    const procedureFee = totalConsultationFee > 0 ? totalConsultationFee : Number(currentProcedure?.standardFee || currentProcedure?.fee || 85.00);
    const procedureName = combinedProceduresName;
    const procedureCode = selectedProceduresList.map(p => p.procedureCode).filter(Boolean).join(', ');

    // Currency Formatter
    const formatCurrency = (amount, curr) => {
        const c = curr || doctorCurrency || 'NZD';
        if (c === 'PKR') return `Rs ${Number(amount).toLocaleString()}`;
        if (c === 'GBP') return `£${Number(amount).toFixed(2)}`;
        if (c === 'EUR') return `€${Number(amount).toFixed(2)}`;
        return `$${Number(amount).toFixed(2)} ${c}`;
    };

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
        if (currentStep === 1) {
            if (!selectedDoctorId) {
                setError('Please select an attending specialist to view treatments.');
                return;
            }
        }
        if (currentStep === 2) {
            if (selectedProceduresList.length === 0) {
                setError('Please select at least one dental treatment procedure.');
                return;
            }
        }
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

    // =========================================================================
    // 3. FINAL APPOINTMENT SUBMISSION & BOOKING CONFIRMATION
    // =========================================================================
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
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const codeStr = procedureCode ? ` [Code: ${procedureCode}]` : '';
            const fullReason = `${procedureName}${codeStr} (${currentDoctor.name})${reason ? ` - Notes: ${reason.trim()}` : ''}`;
            const rawCard = cardNumber.replace(/\s+/g, '');
            const chosenDocId = Number(currentDoctor.id || currentDoctor.doctorID || selectedDoctorId) || 2;
            const chosenCurrency = (chosenDocId === 2 || currentDoctor?.region === 'PK') ? 'PKR' : (doctorCurrency || 'NZD');

            const payload = {
                preferredDate: combinedDateTime.toISOString(),
                reason: fullReason,
                doctorID: chosenDocId,
                paymentMethod: paymentMethod === 'Online_Card' ? 'Online_Card' : 'Cash',
                consultationFee: procedureFee,
                currency: chosenCurrency,
                cardLast4: paymentMethod === 'Online_Card' ? rawCard.slice(-4) : null,
                cardHolderName: paymentMethod === 'Online_Card' ? cardHolder.trim() : null,
                procedures: selectedProceduresList.map(p => ({
                    procedureCode: p.procedureCode || '',
                    procedureName: p.procedureName || p.label || 'Dental Treatment',
                    fee: Number(p.standardFee || p.fee || 85.00),
                    category: p.category || 'General',
                    quantity: 1
                }))
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

            // Guard against handled warnings or missing appointmentId
            if (res.ok && data.status !== 'handled_warning' && (data.appointmentId || data.AppointmentId)) {
                const apptId = data.appointmentId || data.AppointmentId;
                const invId = data.invoiceId || data.InvoiceId;
                const invNum = data.invoiceNumber || data.InvoiceNumber || `INV-2026-${String(apptId).padStart(5, '0')}`;
                const rcptVoucher = data.receiptOrVoucherNumber || (paymentMethod === 'Online_Card' ? `REC-2026-${String(apptId).padStart(5, '0')}` : `CSH-2026-${String(apptId).padStart(5, '0')}`);

                try {
                    const curP = JSON.parse(localStorage.getItem('patient') || '{}');
                    curP.doctorID = chosenDocId;
                    localStorage.setItem('patient', JSON.stringify(curP));
                } catch {}

                setBookingSuccess({
                    appointmentId: apptId,
                    invoiceId: invId,
                    invoiceNumber: invNum,
                    paymentMethod: data.paymentMethod || paymentMethod,
                    receiptOrVoucherNumber: rcptVoucher,
                    invoiceStatus: data.invoiceStatus || (paymentMethod === 'Online_Card' ? 'Paid' : 'Pending Cash Settlement'),
                    fee: procedureFee,
                    currency: data.currency || chosenCurrency || doctorCurrency,
                    dateTime: combinedDateTime,
                    service: procedureName,
                    procedures: selectedProceduresList,
                    doctor: currentDoctor.name,
                    message: data.message || 'Appointment and payment entry recorded successfully.'
                });
            } else {
                setError(data.message || 'Unable to confirm appointment with clinic scheduling. Please try again.');
            }
        } catch (err) {
            console.error('Booking failed:', err);
            setError('Network connection error while communicating with clinic booking server.');
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
            `DESCRIPTION:${bookingSuccess.service} with ${bookingSuccess.doctor}. Total Fee: ${formatCurrency(bookingSuccess.fee, bookingSuccess.currency)}. Payment: ${bookingSuccess.paymentMethod}`,
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
    // CONFIRMATION VIEW (CLEAN COMPACT ZERO-SCROLL RECEIPT)
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
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isCardPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {isCardPaid ? 'Paid in Full' : 'Pending Cash Settlement'}
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

                        {/* Booked Procedures Itemized List */}
                        {bookingSuccess.procedures && bookingSuccess.procedures.length > 0 && (
                            <div className="p-3 bg-white rounded-xl border border-light-teal space-y-1.5">
                                <div className="flex items-center justify-between border-b border-light-teal/60 pb-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
                                    <span>Selected Procedures ({bookingSuccess.procedures.length})</span>
                                    <span>Fee</span>
                                </div>
                                <div className="space-y-1">
                                    {bookingSuccess.procedures.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs py-0.5">
                                            <span className="font-medium text-dark-slate flex items-center gap-1.5">
                                                {p.procedureCode && (
                                                    <span className="font-mono text-[9px] font-bold text-primary-teal bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                                        {p.procedureCode}
                                                    </span>
                                                )}
                                                <span>{p.procedureName || p.label}</span>
                                            </span>
                                            <span className="font-mono font-bold text-dark-slate">
                                                {formatCurrency(p.fee || p.standardFee || 85, bookingSuccess.currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-muted-text pt-1">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary-teal" />
                                <span>Dentia Clinic Auckland CBD / Partner Center</span>
                            </div>
                            <span className="font-mono font-bold text-dark-slate text-sm">
                                {formatCurrency(bookingSuccess.fee, bookingSuccess.currency)}
                            </span>
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
    // STEPPER WORKSPACE (Specialist -> Treatment -> Date/Time -> Payment)
    // =========================================================================
    const stepTitles = [
        { num: 1, title: 'Specialist' },
        { num: 2, title: 'Treatment' },
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

            {/* Step Card (Zero vertical scroll design) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] min-h-[420px] flex flex-col justify-between">
                
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: SELECT ATTENDING SPECIALIST CLINICIAN                 */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    1. Select Attending Specialist
                                </h3>
                                <p className="text-xs text-muted-text">
                                    Choose your dentist to load their customized clinical treatment plans and pricing.
                                </p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Clinic Clinicians ({doctors.length})</span>
                            </span>
                        </div>

                        {loadingDoctors ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="p-4 rounded-2xl border-2 border-light-teal/50 bg-white text-center animate-pulse space-y-2.5">
                                        <div className="w-16 h-16 rounded-full bg-light-teal/60 mx-auto" />
                                        <div className="h-4 bg-light-teal/50 rounded w-28 mx-auto" />
                                        <div className="h-3 bg-light-teal/30 rounded w-36 mx-auto" />
                                        <div className="h-5 bg-light-teal/40 rounded w-20 mx-auto mt-2" />
                                    </div>
                                ))}
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-2xl border border-light-teal/80 text-muted-text text-xs font-medium">
                                No active clinicians found in the clinic directory. Please contact reception.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {doctors.map((doc) => {
                                    const isSelected = selectedDoctorId === doc.id;
                                    const isAssigned = (patient.doctorID === doc.id) || (patient.doctorId === doc.id);

                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => {
                                                setSelectedDoctorId(doc.id);
                                                setError('');
                                            }}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center relative flex flex-col justify-between ${
                                                isSelected 
                                                    ? 'border-primary-teal bg-light-teal/40 shadow-sm ring-2 ring-primary-teal/40 scale-[1.01]' 
                                                    : 'border-light-teal/80 hover:border-primary-teal/40 bg-white hover:bg-warm-cream/50'
                                            }`}
                                        >
                                            {isAssigned && (
                                                <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[9px] font-black uppercase tracking-wider">
                                                    Assigned
                                                </span>
                                            )}

                                            <div>
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
                                            </div>

                                            <div className="mt-3 pt-2.5 border-t border-light-teal/80 flex items-center justify-between">
                                                <span className="px-2 py-0.5 rounded-md bg-white border border-light-teal text-[10px] font-bold text-primary-teal font-mono">
                                                    {doc.region ? `${doc.region} · ` : ''}{doc.exp}
                                                </span>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                                    isSelected ? 'bg-primary-teal text-white' : 'border border-slate-300'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: CHOOSE DOCTOR'S TREATMENT PLANS & PROCEDURES           */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                    <div className="space-y-3.5 animate-in fade-in">
                        
                        {/* Selected Doctor Summary Header + Quick Switch */}
                        <div className="p-3 bg-warm-cream rounded-2xl border border-light-teal flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-light-teal shrink-0 bg-slate-100">
                                    <img 
                                        src={currentDoctor.avatar} 
                                        alt={currentDoctor.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDoctor.name)}&background=008080&color=fff&bold=true`;
                                        }}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-dark-slate">{currentDoctor.name}</h3>
                                        <span className="px-1.5 py-0.2 rounded bg-light-teal text-primary-hover font-mono text-[10px] font-bold">
                                            {doctorCurrency} Fee Schedule
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-text">
                                        {activeProcedures.length} clinical treatment procedures available
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-2.5 py-1 text-[11px] font-bold text-primary-teal hover:text-primary-hover bg-white hover:bg-light-teal border border-light-teal rounded-lg transition-colors cursor-pointer"
                            >
                                Change Specialist
                            </button>
                        </div>

                        {/* Search & Category Filter Strip */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-muted-text absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={procedureSearch}
                                    onChange={(e) => setProcedureSearch(e.target.value)}
                                    placeholder="Search treatments or procedure code (e.g. Cleaning, Root Canal, Crown, 011)..."
                                    className="w-full pl-8.5 pr-4 py-2 bg-warm-cream/50 border border-light-teal rounded-xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 placeholder:text-muted-text/60"
                                />
                                {procedureSearch && (
                                    <button 
                                        type="button" 
                                        onClick={() => setProcedureSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-text hover:text-dark-slate cursor-pointer"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                                {categories.map((cat) => {
                                    const isCatSelected = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                                                isCatSelected
                                                    ? 'bg-primary-teal text-white shadow-2xs'
                                                    : 'bg-white hover:bg-light-teal text-dark-slate border border-light-teal/80'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Treatments Summary Tray (Multi-treatment indicator) */}
                        {selectedProceduresList.length > 0 && (
                            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary-teal animate-pulse" />
                                        <span className="text-xs font-bold text-dark-slate">
                                            Selected Treatments ({selectedProceduresList.length})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-black text-primary-hover">
                                            Total: {formatCurrency(totalConsultationFee, doctorCurrency)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProcedureKeys([])}
                                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-thin">
                                    {selectedProceduresList.map((proc) => {
                                        const key = proc.procedureCode || proc.procedureName;
                                        return (
                                            <span
                                                key={key}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-teal-200/80 rounded-xl text-[11px] font-bold text-dark-slate shadow-2xs"
                                            >
                                                {proc.procedureCode && (
                                                    <span className="px-1 py-0.2 bg-teal-50 text-primary-teal font-mono text-[9px] rounded">
                                                        {proc.procedureCode}
                                                    </span>
                                                )}
                                                <span className="truncate max-w-[170px]">{proc.procedureName || proc.label}</span>
                                                <span className="font-mono text-primary-teal font-bold">
                                                    {formatCurrency(Number(proc.standardFee || proc.fee || 85), doctorCurrency)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleProcedure(proc);
                                                    }}
                                                    className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer font-bold text-xs"
                                                    title="Remove treatment"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Procedures Grid (Scrollable container to maintain zero-page scroll) */}
                        {loadingProcedures ? (
                            <div className="p-8 text-center bg-warm-cream/30 rounded-2xl border border-light-teal/60 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-5 h-5 text-primary-teal animate-spin" />
                                <span className="text-xs text-muted-text font-medium">Loading {currentDoctor.name}'s treatment plans...</span>
                            </div>
                        ) : filteredProcedures.length === 0 ? (
                            <div className="p-6 text-center bg-white rounded-2xl border border-light-teal text-muted-text text-xs">
                                No procedures found matching "{procedureSearch}". Try clearing search or selecting "All".
                            </div>
                        ) : (
                            <div className="max-h-[290px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {filteredProcedures.map((proc) => {
                                        const pId = proc.procedureCode || proc.procedureName;
                                        const isSelected = selectedProcedureKeys.includes(pId);
                                        const fee = Number(proc.standardFee || proc.fee || 85.00);
                                        const badgeClass = categoryBadgeColors[proc.category] || 'bg-slate-100 text-slate-700 border-slate-300';

                                        return (
                                            <div
                                                key={pId}
                                                onClick={() => toggleProcedure(proc)}
                                                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
                                                    isSelected
                                                        ? 'border-primary-teal bg-teal-50/50 shadow-xs ring-2 ring-primary-teal/30 scale-[1.008]'
                                                        : 'border-light-teal/80 hover:border-primary-teal/40 bg-white hover:bg-warm-cream/40'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {proc.procedureCode && (
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-dark-slate font-mono text-[10px] font-bold">
                                                                    {proc.procedureCode}
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${badgeClass}`}>
                                                                {proc.category || 'General'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-mono font-black text-primary-hover whitespace-nowrap">
                                                            {formatCurrency(fee, doctorCurrency)}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-xs font-bold text-dark-slate leading-snug">
                                                        {proc.procedureName || proc.label}
                                                    </h4>
                                                    {proc.description && (
                                                        <p className="text-[10px] text-muted-text line-clamp-1 mt-0.5 leading-relaxed">
                                                            {proc.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-2 pt-1.5 border-t border-light-teal/70 flex items-center justify-between text-[10px] text-muted-text font-medium">
                                                    <span>Est. {proc.estimatedDuration || '45 mins'}</span>
                                                    <div className="flex items-center gap-1">
                                                        {isSelected ? (
                                                            <span className="font-bold text-primary-teal flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-primary-teal/30 shadow-2xs">
                                                                <Check className="w-3 h-3 stroke-[3]" /> Added to Plan
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 hover:text-dark-slate flex items-center gap-0.5">
                                                                + Add Treatment
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: SCHEDULE DATE & TIME                                  */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in">
                        
                        {/* Header with Slot Reassurance Banner */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/80 pb-3">
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    3. Select Date & Time
                                </h3>
                                <p className="text-xs text-muted-text">
                                    Booking consultation with {currentDoctor.name}.
                                </p>
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

                            {/* Optional Custom Date Picker */}
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

                        {/* 2. Morning & Afternoon Time Slots */}
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
                                placeholder="e.g. Tooth sensitivity on molar or scheduled checkup review"
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
                        
                        {/* Summary Header */}
                        <div className="p-3.5 bg-warm-cream rounded-2xl border border-light-teal flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-dark-slate">{currentDoctor.name}</span>
                                <span className="text-muted-text">({currentDoctor.title})</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                                <span className="text-muted-text">{preferredDate} at {preferredTime}</span>
                            </div>
                        </div>

                        {/* Itemized Treatment Plan Breakdown */}
                        <div className="bg-white rounded-2xl border border-light-teal p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between border-b border-light-teal pb-2">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                                    <span className="text-[11px] font-bold text-dark-slate uppercase tracking-wider">
                                        Selected Treatments ({selectedProceduresList.length})
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-primary-teal">
                                    {doctorCurrency} Fee Schedule
                                </span>
                            </div>
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                                {selectedProceduresList.map((proc, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-dashed border-light-teal/60 last:border-0">
                                        <div className="flex items-center gap-2">
                                            {proc.procedureCode && (
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-dark-slate">
                                                    {proc.procedureCode}
                                                </span>
                                            )}
                                            <span className="font-semibold text-dark-slate">{proc.procedureName || proc.label}</span>
                                        </div>
                                        <span className="font-mono font-bold text-dark-slate">
                                            {formatCurrency(Number(proc.standardFee || proc.fee || 85), doctorCurrency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-light-teal flex items-center justify-between text-xs font-black">
                                <span className="text-dark-slate">Total Consultation Fee</span>
                                <span className="text-base font-mono text-primary-hover">{formatCurrency(totalConsultationFee, doctorCurrency)}</span>
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
                                    Instant Cash Voucher issued. Settle the fee in cash at clinic front desk upon arrival.
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
                            <span className="text-[11px] text-muted-text font-medium">Dentia Clinic Workspace</span>
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
                                        <span>Confirm Booking ({formatCurrency(procedureFee, doctorCurrency)})</span>
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

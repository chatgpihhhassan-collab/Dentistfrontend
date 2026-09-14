import React, { useState, useEffect, useMemo } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { 
    DollarSign, 
    Save, 
    Plus, 
    Search, 
    Sparkles, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Edit3, 
    Trash2, 
    RefreshCw, 
    Globe, 
    Stethoscope, 
    Filter,
    Layers,
    RotateCcw,
    Zap,
    BookOpen,
    Check,
    ArrowRight,
    TrendingUp,
    Sliders,
    HelpCircle,
    FileText,
    Activity,
    ChevronRight,
    X
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';
import { STANDARD_DENTAL_PROCEDURES, DENTAL_CATEGORIES } from '../data/standardProcedures';

// Color themes tailored for the 15 clinical categories
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

export default function DoctorTreatmentPricing() {
    const [doctor, setDoctor] = useState(() => JSON.parse(localStorage.getItem('doctor') || '{}'));
    const doctorId = doctor.doctorID || doctor.DoctorID || doctor.id || 1;
    const doctorName = doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : (doctor.username || 'Attending Clinician');

    const [currency, setCurrency] = useState('NZD');
    const [procedures, setProcedures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Main in-page active view: 'schedule' (My Active Fee Schedule), 'library' (Browse Standard Catalog), 'custom' (Create Custom)
    const [activeView, setActiveView] = useState('schedule');

    // Filter states for Active Schedule
    const [scheduleCategory, setScheduleCategory] = useState('All');
    const [scheduleSearch, setScheduleSearch] = useState('');

    // Filter states for Standard Library
    const [libraryCategory, setLibraryCategory] = useState('All');
    const [librarySearch, setLibrarySearch] = useState('');

    // Inline custom procedure creation state
    const [newCustomProc, setNewCustomProc] = useState({
        procedureCode: '',
        procedureName: '',
        category: 'Examination & Diagnosis',
        estimatedDuration: '45 mins',
        standardFee: '',
        description: ''
    });

    const currencyOptions = [
        { code: 'NZD', symbol: '$', label: 'New Zealand Dollar (NZD $)', multiplier: 1.0 },
        { code: 'PKR', symbol: 'Rs', label: 'Pakistani Rupee (PKR Rs)', multiplier: 65.0 },
        { code: 'USD', symbol: '$', label: 'US Dollar (USD $)', multiplier: 0.62 },
        { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)', multiplier: 0.48 },
        { code: 'EUR', symbol: '€', label: 'Euro (EUR €)', multiplier: 0.56 },
        { code: 'AUD', symbol: '$', label: 'Australian Dollar (AUD $)', multiplier: 0.92 }
    ];

    const currentCurrencySymbol = currencyOptions.find(c => c.code === currency)?.symbol || '$';

    // Calculate benchmark fee for any procedure in the active currency
    const getBenchmarkFee = (proc) => {
        if (currency === 'PKR') return proc.feePKR;
        if (currency === 'NZD') return proc.feeNZD;
        const mult = currencyOptions.find(c => c.code === currency)?.multiplier || 1.0;
        return Math.round(proc.feeNZD * mult);
    };

    // Fetch Fee Schedule from Backend
    const fetchFeeSchedule = async () => {
        try {
            setLoading(true);
            setFeedback({ type: '', message: '' });

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}`);
            } catch {
                res = await fetch(`/api/treatment-pricing/doctor/${doctorId}`);
            }

            if (res.ok) {
                const data = await res.json();
                setCurrency(data.currency || (doctor.region === 'PK' ? 'PKR' : 'NZD'));
                setProcedures(data.procedures || []);
            } else {
                setFeedback({ type: 'error', message: 'Failed to load clinic fee schedule.' });
            }
        } catch (err) {
            console.error('Error fetching fee schedule:', err);
            setFeedback({ type: 'error', message: 'Network connection error.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeeSchedule();
    }, [doctorId]);

    // Handle inline fee change
    const handleFeeChange = (feeScheduleID, newFee) => {
        const parsed = parseFloat(newFee) || 0;
        setProcedures(prev => prev.map(p => 
            p.feeScheduleID === feeScheduleID ? { ...p, standardFee: parsed } : p
        ));
    };

    // Handle inline duration change
    const handleDurationChange = (feeScheduleID, newDuration) => {
        setProcedures(prev => prev.map(p => 
            p.feeScheduleID === feeScheduleID ? { ...p, estimatedDuration: newDuration } : p
        ));
    };

    // Handle inline name change
    const handleNameChange = (feeScheduleID, newName) => {
        setProcedures(prev => prev.map(p => 
            p.feeScheduleID === feeScheduleID ? { ...p, procedureName: newName } : p
        ));
    };

    // Remove procedure from schedule
    const handleRemoveProcedure = (code) => {
        setProcedures(prev => prev.filter(p => p.procedureCode !== code));
        setFeedback({
            type: 'info',
            message: `Removed procedure [${code}]. Click "Save Fee Schedule" to commit changes.`
        });
    };

    // Save Fee Schedule to Backend
    const handleSaveSchedule = async () => {
        try {
            setSaving(true);
            setFeedback({ type: '', message: '' });

            const payload = {
                currency,
                procedures
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/treatment-pricing/doctor/${doctorId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                setFeedback({ 
                    type: 'success', 
                    message: `Fee schedule saved successfully! All consultation bookings and patient invoices are now active in ${currency}.` 
                });
                fetchFeeSchedule();
            } else {
                const errData = await res.json();
                setFeedback({ type: 'error', message: errData.message || 'Failed to save changes.' });
            }
        } catch (err) {
            console.error('Error saving fee schedule:', err);
            setFeedback({ type: 'error', message: 'Failed to connect to server.' });
        } finally {
            setSaving(false);
        }
    };

    // Reset/Sync with Master Database Catalog
    const handleSyncWithMaster = async () => {
        if (!window.confirm('Synchronize fee schedule with the master catalog (141 procedures across 15 categories)? Existing procedures will be refreshed with standardized benchmarks.')) {
            return;
        }

        try {
            setSyncing(true);
            setFeedback({ type: '', message: '' });

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}/reset-master?currency=${currency}`, {
                    method: 'POST'
                });
            } catch {
                res = await fetch(`/api/treatment-pricing/doctor/${doctorId}/reset-master?currency=${currency}`, {
                    method: 'POST'
                });
            }

            if (res.ok) {
                const data = await res.json();
                setCurrency(data.currency || currency);
                setProcedures(data.procedures || []);
                setActiveView('schedule');
                setFeedback({
                    type: 'success',
                    message: 'Successfully synchronized 141 procedures across all 15 clinical categories!'
                });
            } else {
                setFeedback({ type: 'error', message: 'Failed to synchronize with master catalog.' });
            }
        } catch (err) {
            console.error('Sync error:', err);
            setFeedback({ type: 'error', message: 'Network error synchronizing catalog.' });
        } finally {
            setSyncing(false);
        }
    };

    // Add a single procedure from Library into Active Schedule
    const handleAddFromLibrary = (item) => {
        const exists = procedures.some(p => p.procedureCode === item.code);
        if (exists) {
            setFeedback({ type: 'info', message: `'${item.name}' is already in your active schedule.` });
            return;
        }

        const fee = getBenchmarkFee(item);
        const newItem = {
            feeScheduleID: 0,
            doctorID: doctorId,
            currency,
            procedureCode: item.code,
            procedureName: item.name,
            category: item.category,
            estimatedDuration: item.duration,
            standardFee: fee,
            description: item.description,
            isActive: true
        };

        setProcedures(prev => [...prev, newItem]);
        setFeedback({
            type: 'success',
            message: `Added '${item.name}' (${currentCurrencySymbol} ${fee}) to your schedule. Remember to Save Changes!`
        });
    };

    // Add all procedures in a specific category from Library
    const handleAddCategoryFromLibrary = (catName) => {
        const catItems = STANDARD_DENTAL_PROCEDURES.filter(p => p.category === catName);
        const existingCodes = new Set(procedures.map(p => p.procedureCode));
        const toAdd = [];

        catItems.forEach(item => {
            if (!existingCodes.has(item.code)) {
                toAdd.push({
                    feeScheduleID: 0,
                    doctorID: doctorId,
                    currency,
                    procedureCode: item.code,
                    procedureName: item.name,
                    category: item.category,
                    estimatedDuration: item.duration,
                    standardFee: getBenchmarkFee(item),
                    description: item.description,
                    isActive: true
                });
            }
        });

        if (toAdd.length === 0) {
            setFeedback({ type: 'info', message: `All procedures in '${catName}' are already in your schedule.` });
            return;
        }

        setProcedures(prev => [...prev, ...toAdd]);
        setFeedback({
            type: 'success',
            message: `Added ${toAdd.length} procedures from '${catName}' to your active schedule!`
        });
    };

    // Add All 141 Procedures from Library into Schedule
    const handleAddAllFromLibrary = () => {
        const existingCodes = new Set(procedures.map(p => p.procedureCode));
        const toAdd = [];

        STANDARD_DENTAL_PROCEDURES.forEach(item => {
            if (!existingCodes.has(item.code)) {
                toAdd.push({
                    feeScheduleID: 0,
                    doctorID: doctorId,
                    currency,
                    procedureCode: item.code,
                    procedureName: item.name,
                    category: item.category,
                    estimatedDuration: item.duration,
                    standardFee: getBenchmarkFee(item),
                    description: item.description,
                    isActive: true
                });
            }
        });

        if (toAdd.length === 0) {
            setFeedback({ type: 'info', message: 'All 141 standard procedures are already in your fee schedule!' });
            return;
        }

        setProcedures(prev => [...prev, ...toAdd]);
        setActiveView('schedule');
        setFeedback({
            type: 'success',
            message: `Added ${toAdd.length} procedures to your fee schedule! Click "Save Fee Schedule" to commit to database.`
        });
    };

    // Inline custom procedure submit handler
    const handleCreateCustomProcedure = (e) => {
        e.preventDefault();
        if (!newCustomProc.procedureName || !newCustomProc.standardFee) {
            alert('Please enter a procedure name and standard fee.');
            return;
        }

        const fee = parseFloat(newCustomProc.standardFee) || 0;
        const code = newCustomProc.procedureCode.trim() || `CUST-${Math.floor(100 + Math.random() * 900)}`;

        const created = {
            feeScheduleID: 0,
            doctorID: doctorId,
            currency,
            procedureCode: code,
            procedureName: newCustomProc.procedureName.trim(),
            category: newCustomProc.category,
            estimatedDuration: newCustomProc.estimatedDuration || '45 mins',
            standardFee: fee,
            description: newCustomProc.description.trim() || null,
            isActive: true
        };

        setProcedures(prev => [created, ...prev]);
        setActiveView('schedule');
        setNewCustomProc({
            procedureCode: '',
            procedureName: '',
            category: 'Examination & Diagnosis',
            estimatedDuration: '45 mins',
            standardFee: '',
            description: ''
        });

        setFeedback({
            type: 'success',
            message: `Created custom procedure '${created.procedureName}'! Click "Save Fee Schedule" to persist.`
        });
    };

    // Set of active procedure codes in doctor's schedule for fast lookup
    const activeProcedureCodeSet = useMemo(() => {
        return new Set(procedures.map(p => p.procedureCode));
    }, [procedures]);

    // Counters for Active Schedule
    const scheduleCategoryCounts = useMemo(() => {
        const counts = { All: procedures.length };
        procedures.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return counts;
    }, [procedures]);

    // Active Schedule Filtered List
    const filteredScheduleProcedures = useMemo(() => {
        return procedures.filter(p => {
            const matchesCat = scheduleCategory === 'All' || p.category === scheduleCategory;
            const q = scheduleSearch.toLowerCase().trim();
            const matchesSearch = !q || 
                                  p.procedureName.toLowerCase().includes(q) || 
                                  p.procedureCode.toLowerCase().includes(q) ||
                                  (p.category && p.category.toLowerCase().includes(q)) ||
                                  (p.description && p.description.toLowerCase().includes(q));
            return matchesCat && matchesSearch;
        });
    }, [procedures, scheduleCategory, scheduleSearch]);

    // Standard Library Filtered List
    const filteredLibraryProcedures = useMemo(() => {
        return STANDARD_DENTAL_PROCEDURES.filter(p => {
            const matchesCat = libraryCategory === 'All' || p.category === libraryCategory;
            const q = librarySearch.toLowerCase().trim();
            const matchesSearch = !q || 
                                  p.name.toLowerCase().includes(q) || 
                                  p.code.toLowerCase().includes(q) ||
                                  p.category.toLowerCase().includes(q) ||
                                  p.description.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });
    }, [libraryCategory, librarySearch]);

    // Active Category List (Only categories that actually have procedures in doctor's schedule)
    const activeScheduleCategories = useMemo(() => {
        const setCats = new Set(procedures.map(p => p.category));
        const list = ['All'];
        DENTAL_CATEGORIES.forEach(c => {
            if (setCats.has(c)) list.push(c);
        });
        setCats.forEach(c => {
            if (!list.includes(c)) list.push(c);
        });
        return list;
    }, [procedures]);

    return (
        <div className="min-h-screen bg-[#FBFBFA] text-dark-slate font-sans flex flex-col selection:bg-light-teal selection:text-primary-teal">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-6">
                
                {/* Header Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-teal text-primary-hover text-xs font-bold font-mono uppercase tracking-wider">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Clinical Procedure & Fee Studio</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                            Dental Treatment Pricing & Currency
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-text max-w-2xl leading-relaxed">
                            Manage your clinical catalog across 15 standard dental specialties for <span className="font-bold text-dark-slate">{doctorName}</span>. 
                            Active rates propagate in real-time to patient consultation bookings and itemized billing ledgers.
                        </p>
                    </div>

                    {/* Controls: Currency Switcher & Save Schedule */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-warm-cream px-3.5 py-2.5 rounded-2xl border border-light-teal">
                            <Globe className="w-4 h-4 text-primary-teal shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-text uppercase">Billing Currency</span>
                                <select 
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="bg-transparent text-xs font-black text-dark-slate focus:outline-none cursor-pointer"
                                >
                                    {currencyOptions.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveSchedule}
                            disabled={saving}
                            className="px-6 py-3 bg-primary-teal hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-primary-teal/25 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{saving ? 'Saving...' : 'Save Fee Schedule'}</span>
                        </button>
                    </div>
                </div>

                {/* Feedback Toast */}
                {feedback.message && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in text-xs font-bold ${
                        feedback.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : feedback.type === 'error'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-sky-50 border-sky-200 text-sky-800'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {feedback.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{feedback.message}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setFeedback({ type: '', message: '' })} 
                            className="text-muted-text hover:text-dark-slate cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* IN-PAGE WORKSPACE NAVIGATION (Zero Popups) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-light-teal/80 pb-4">
                    <div className="flex items-center gap-2 bg-warm-cream p-1.5 rounded-2xl border border-light-teal/70 w-full sm:w-auto">
                        
                        {/* Tab 1: My Active Schedule */}
                        <button
                            type="button"
                            onClick={() => setActiveView('schedule')}
                            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeView === 'schedule'
                                    ? 'bg-primary-teal text-white shadow-xs'
                                    : 'text-dark-slate hover:bg-light-teal'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>My Fee Schedule</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                activeView === 'schedule' ? 'bg-white/20 text-white' : 'bg-white text-dark-slate'
                            }`}>
                                {procedures.length}
                            </span>
                        </button>

                        {/* Tab 2: Standard Library (100% In-Page) */}
                        <button
                            type="button"
                            onClick={() => setActiveView('library')}
                            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeView === 'library'
                                    ? 'bg-primary-teal text-white shadow-xs'
                                    : 'text-dark-slate hover:bg-light-teal'
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Standard Procedure Library</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                activeView === 'library' ? 'bg-white/20 text-white' : 'bg-white text-dark-slate'
                            }`}>
                                141
                            </span>
                        </button>

                        {/* Tab 3: Create Custom Procedure (100% In-Page) */}
                        <button
                            type="button"
                            onClick={() => setActiveView('custom')}
                            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeView === 'custom'
                                    ? 'bg-primary-teal text-white shadow-xs'
                                    : 'text-dark-slate hover:bg-light-teal'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Custom</span>
                        </button>
                    </div>

                    {/* Quick Batch Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={handleAddAllFromLibrary}
                            className="px-3.5 py-2 bg-white hover:bg-light-teal text-primary-hover border border-light-teal rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Load all 141 procedures into your active schedule"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                            <span>Add All 141 to Schedule</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSyncWithMaster}
                            disabled={syncing || loading}
                            className="px-3.5 py-2 bg-white hover:bg-light-teal text-dark-slate border border-light-teal rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            title="Refresh pricing benchmarks from master database"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 text-primary-teal ${syncing ? 'animate-spin' : ''}`} />
                            <span>{syncing ? 'Syncing...' : 'Sync Master'}</span>
                        </button>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* VIEW 1: MY ACTIVE CLINIC FEE SCHEDULE (Inline Editable)                   */}
                {/* ========================================================================= */}
                {activeView === 'schedule' && (
                    <div className="space-y-5 animate-in fade-in">
                        
                        {/* Search & Active Category Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                                <input
                                    type="text"
                                    value={scheduleSearch}
                                    onChange={(e) => setScheduleSearch(e.target.value)}
                                    placeholder="Search active procedures by code, name, or keywords..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-light-teal rounded-2xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 shadow-xs"
                                />
                                {scheduleSearch && (
                                    <button 
                                        type="button" 
                                        onClick={() => setScheduleSearch('')} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-slate text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-muted-text">
                                    Displaying <span className="text-dark-slate font-black">{filteredScheduleProcedures.length}</span> of {procedures.length} Procedures
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setActiveView('library')}
                                    className="px-3.5 py-2 bg-light-teal hover:bg-light-teal-hover text-primary-hover border border-light-teal rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Browse Library to Add More</span>
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                            {activeScheduleCategories.map((cat) => {
                                const count = scheduleCategoryCounts[cat] || 0;
                                const isSelected = scheduleCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setScheduleCategory(cat)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-primary-teal text-white shadow-xs'
                                                : 'bg-white text-dark-slate hover:bg-light-teal border border-light-teal/70'
                                        }`}
                                    >
                                        <span>{cat}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-warm-cream text-muted-text'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Fee Schedule Table */}
                        <div className="bg-white rounded-3xl border border-light-teal shadow-xs overflow-hidden">
                            {loading ? (
                                <div className="p-16 text-center space-y-3">
                                    <div className="w-8 h-8 border-3 border-primary-teal/30 border-t-primary-teal rounded-full animate-spin mx-auto" />
                                    <p className="text-xs text-muted-text font-bold">Loading your active clinic fee schedule...</p>
                                </div>
                            ) : filteredScheduleProcedures.length === 0 ? (
                                <div className="p-16 text-center space-y-4">
                                    <Stethoscope className="w-12 h-12 text-muted-text/40 mx-auto" />
                                    <h3 className="text-base font-bold text-dark-slate">No procedures in your active fee schedule</h3>
                                    <p className="text-xs text-muted-text max-w-md mx-auto">
                                        {procedures.length === 0
                                            ? 'Your clinic fee schedule is currently unpopulated. Click below to load all 141 standard procedures or browse the library.'
                                            : 'No procedures match your current search query or category filter.'}
                                    </p>
                                    <div className="flex items-center justify-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleAddAllFromLibrary}
                                            className="px-5 py-2.5 bg-primary-teal text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer shadow-md shadow-primary-teal/20 flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Load All 141 Procedures</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveView('library')}
                                            className="px-5 py-2.5 bg-warm-cream text-dark-slate border border-light-teal rounded-xl text-xs font-bold hover:bg-light-teal transition-all cursor-pointer"
                                        >
                                            <span>Browse Standard Library</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-warm-cream/80 border-b border-light-teal text-[11px] font-bold text-muted-text uppercase tracking-wider">
                                                <th className="py-3.5 px-5">Code</th>
                                                <th className="py-3.5 px-5">Procedure Name</th>
                                                <th className="py-3.5 px-5">Category</th>
                                                <th className="py-3.5 px-5">Duration</th>
                                                <th className="py-3.5 px-5">Fee ({currentCurrencySymbol})</th>
                                                <th className="py-3.5 px-5">Clinical Description</th>
                                                <th className="py-3.5 px-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-light-teal/50">
                                            {filteredScheduleProcedures.map((proc) => {
                                                const badgeColor = categoryBadgeColors[proc.category] || 'bg-slate-100 text-slate-700 border-slate-200';
                                                return (
                                                    <tr key={proc.feeScheduleID || proc.procedureCode} className="hover:bg-warm-cream/30 transition-colors">
                                                        
                                                        {/* Code */}
                                                        <td className="py-3.5 px-5">
                                                            <span className="px-2.5 py-1 rounded-lg bg-light-teal text-primary-hover font-mono font-bold text-[11px] border border-light-teal/50 whitespace-nowrap">
                                                                {proc.procedureCode}
                                                            </span>
                                                        </td>

                                                        {/* Procedure Name (Inline Editable) */}
                                                        <td className="py-3.5 px-5">
                                                            <input 
                                                                type="text"
                                                                value={proc.procedureName}
                                                                onChange={(e) => handleNameChange(proc.feeScheduleID, e.target.value)}
                                                                className="w-full font-bold text-dark-slate bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-light-teal focus:border-primary-teal rounded-lg px-2 py-1 text-xs transition-colors"
                                                            />
                                                        </td>

                                                        {/* Category */}
                                                        <td className="py-3.5 px-5">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor} whitespace-nowrap`}>
                                                                {proc.category}
                                                            </span>
                                                        </td>

                                                        {/* Duration */}
                                                        <td className="py-3.5 px-5">
                                                            <div className="flex items-center gap-1 text-muted-text">
                                                                <Clock className="w-3 h-3 text-primary-teal shrink-0" />
                                                                <input 
                                                                    type="text"
                                                                    value={proc.estimatedDuration}
                                                                    onChange={(e) => handleDurationChange(proc.feeScheduleID, e.target.value)}
                                                                    className="w-20 font-medium text-dark-slate bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-light-teal focus:border-primary-teal rounded-lg px-1.5 py-0.5 text-xs transition-colors"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Standard Fee (Inline Editable with Live Currency Prefix) */}
                                                        <td className="py-3.5 px-5">
                                                            <div className="flex items-center gap-1 font-mono font-black text-dark-slate bg-warm-cream px-2 py-1 rounded-xl border border-light-teal w-32 focus-within:ring-2 focus-within:ring-primary-teal/40">
                                                                <span className="text-primary-teal text-xs">{currentCurrencySymbol}</span>
                                                                <input 
                                                                    type="number"
                                                                    step="any"
                                                                    value={proc.standardFee}
                                                                    onChange={(e) => handleFeeChange(proc.feeScheduleID, e.target.value)}
                                                                    className="w-full bg-transparent text-xs font-mono font-black text-dark-slate focus:outline-none"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Description */}
                                                        <td className="py-3.5 px-5 text-muted-text text-[11px] max-w-xs truncate" title={proc.description}>
                                                            {proc.description || 'Standard clinic procedure'}
                                                        </td>

                                                        {/* Remove Action */}
                                                        <td className="py-3.5 px-4 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveProcedure(proc.procedureCode)}
                                                                className="p-1.5 text-muted-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Remove from schedule"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>

                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 2: STANDARD PROCEDURE LIBRARY (100% In-Page, Browsable, Searchable) */}
                {/* ========================================================================= */}
                {activeView === 'library' && (
                    <div className="space-y-6 animate-in fade-in">
                        
                        {/* Library Header & Search Bar */}
                        <div className="bg-white rounded-3xl p-6 border border-light-teal shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-serif font-black text-dark-slate flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary-teal" />
                                        <span>Standard Dental Procedure Catalog (141 Procedures)</span>
                                    </h2>
                                    <p className="text-xs text-muted-text">
                                        Browse all 15 clinical dental specialties. Click <span className="font-bold text-primary-teal">+ Add to My Schedule</span> to activate any procedure in your clinic.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddAllFromLibrary}
                                    className="px-4 py-2.5 bg-primary-teal hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-teal/20 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Add All 141 to My Schedule</span>
                                </button>
                            </div>

                            {/* Live Search Filter */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                                <input
                                    type="text"
                                    value={librarySearch}
                                    onChange={(e) => setLibrarySearch(e.target.value)}
                                    placeholder="Type procedure name, CDT code (e.g. D0120, D3330), category, or keyword..."
                                    className="w-full pl-10 pr-10 py-3 bg-warm-cream border border-light-teal rounded-2xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 font-medium shadow-xs"
                                />
                                {librarySearch && (
                                    <button 
                                        type="button" 
                                        onClick={() => setLibrarySearch('')} 
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-slate text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 15 Category Nav Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                            <button
                                type="button"
                                onClick={() => setLibraryCategory('All')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                    libraryCategory === 'All'
                                        ? 'bg-primary-teal text-white shadow-xs'
                                        : 'bg-white text-dark-slate hover:bg-light-teal border border-light-teal/70'
                                }`}
                            >
                                <span>All Specialties</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                    libraryCategory === 'All' ? 'bg-white/20 text-white' : 'bg-warm-cream text-muted-text'
                                }`}>
                                    141
                                </span>
                            </button>

                            {DENTAL_CATEGORIES.map((cat, idx) => {
                                const catCount = STANDARD_DENTAL_PROCEDURES.filter(p => p.category === cat).length;
                                const isSelected = libraryCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setLibraryCategory(cat)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-primary-teal text-white shadow-xs'
                                                : 'bg-white text-dark-slate hover:bg-light-teal border border-light-teal/70'
                                        }`}
                                    >
                                        <span>{idx + 1}. {cat}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-warm-cream text-muted-text'
                                        }`}>
                                            {catCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Category Bulk Action Banner (when a specific category is filtered) */}
                        {libraryCategory !== 'All' && (
                            <div className="p-4 rounded-2xl bg-white border border-light-teal flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${categoryBadgeColors[libraryCategory] || 'bg-slate-100'}`}>
                                        {libraryCategory}
                                    </span>
                                    <span className="text-xs text-muted-text font-bold">
                                        {filteredLibraryProcedures.length} standard procedures in this specialty
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleAddCategoryFromLibrary(libraryCategory)}
                                    className="px-4 py-2 bg-light-teal hover:bg-light-teal-hover text-primary-hover border border-light-teal rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add All {libraryCategory} Procedures</span>
                                </button>
                            </div>
                        )}

                        {/* Standard Procedures Grid / List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLibraryProcedures.map((item) => {
                                const isAdded = activeProcedureCodeSet.has(item.code);
                                const fee = getBenchmarkFee(item);
                                const badgeColor = categoryBadgeColors[item.category] || 'bg-slate-100 text-slate-700 border-slate-200';

                                return (
                                    <div 
                                        key={item.code} 
                                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                                            isAdded 
                                                ? 'bg-white border-emerald-200 shadow-xs' 
                                                : 'bg-white border-light-teal hover:border-primary-teal/50 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            {/* Header Tags */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="px-2.5 py-0.5 rounded-lg bg-light-teal text-primary-hover font-mono font-bold text-[11px] border border-light-teal/50">
                                                    {item.code}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor} truncate max-w-[170px]`}>
                                                    {item.category}
                                                </span>
                                            </div>

                                            {/* Procedure Name */}
                                            <h3 className="text-sm font-serif font-black text-dark-slate tracking-tight">
                                                {item.name}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-[11px] text-muted-text leading-relaxed line-clamp-2" title={item.description}>
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Meta & Add Action */}
                                        <div className="pt-3 border-t border-light-teal/50 flex items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-text">
                                                    <Clock className="w-3 h-3 text-primary-teal" />
                                                    <span>{item.duration}</span>
                                                </div>
                                                <div className="font-mono font-black text-xs text-dark-slate">
                                                    {currentCurrencySymbol} {fee.toLocaleString()}
                                                </div>
                                            </div>

                                            {isAdded ? (
                                                <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>In Schedule</span>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddFromLibrary(item)}
                                                    className="px-3.5 py-1.5 bg-primary-teal hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Add</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 3: CREATE CUSTOM PROCEDURE (100% In-Page, Zero Popups)              */}
                {/* ========================================================================= */}
                {activeView === 'custom' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-xs max-w-2xl mx-auto space-y-6 animate-in fade-in">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-teal text-primary-hover text-xs font-bold font-mono uppercase tracking-wider mb-2">
                                <Plus className="w-3.5 h-3.5" />
                                <span>Clinic Customization</span>
                            </div>
                            <h2 className="text-xl font-serif font-black text-dark-slate tracking-tight">
                                Create Custom Clinic Procedure
                            </h2>
                            <p className="text-xs text-muted-text">
                                Define proprietary treatments, customized bundles, or clinic-specific fees to incorporate into your fee schedule.
                            </p>
                        </div>

                        <form onSubmit={handleCreateCustomProcedure} className="space-y-4">
                            
                            {/* Procedure Name */}
                            <div>
                                <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                    Procedure Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomProc.procedureName}
                                    onChange={(e) => setNewCustomProc({ ...newCustomProc, procedureName: e.target.value })}
                                    placeholder="e.g. Custom Premium Ceramic Splint / Bleach Tray Combo"
                                    className="w-full px-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                />
                            </div>

                            {/* Procedure Code & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Procedure Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newCustomProc.procedureCode}
                                        onChange={(e) => setNewCustomProc({ ...newCustomProc, procedureCode: e.target.value })}
                                        placeholder="e.g. CUST-9901 (Auto-generates if empty)"
                                        className="w-full px-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs font-mono font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Clinical Category *
                                    </label>
                                    <select
                                        value={newCustomProc.category}
                                        onChange={(e) => setNewCustomProc({ ...newCustomProc, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 cursor-pointer"
                                    >
                                        {DENTAL_CATEGORIES.map((cat, idx) => (
                                            <option key={cat} value={cat}>
                                                {idx + 1}. {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Standard Fee & Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Standard Fee ({currentCurrencySymbol}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={newCustomProc.standardFee}
                                        onChange={(e) => setNewCustomProc({ ...newCustomProc, standardFee: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs font-mono font-black text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Chair Duration
                                    </label>
                                    <input
                                        type="text"
                                        value={newCustomProc.estimatedDuration}
                                        onChange={(e) => setNewCustomProc({ ...newCustomProc, estimatedDuration: e.target.value })}
                                        placeholder="e.g. 45 mins"
                                        className="w-full px-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                            </div>

                            {/* Clinical Description */}
                            <div>
                                <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                    Clinical Description / Notes
                                </label>
                                <textarea
                                    rows="3"
                                    value={newCustomProc.description}
                                    onChange={(e) => setNewCustomProc({ ...newCustomProc, description: e.target.value })}
                                    placeholder="Clinical indications, steps, or patient pre-requisites..."
                                    className="w-full px-4 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-teal/50">
                                <button
                                    type="button"
                                    onClick={() => setActiveView('schedule')}
                                    className="px-5 py-2.5 bg-warm-cream hover:bg-light-teal text-dark-slate text-xs font-bold rounded-2xl border border-light-teal transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold rounded-2xl shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                                >
                                    Add to My Fee Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
}

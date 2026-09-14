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
    X,
    ChevronDown,
    Info,
    Calendar
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

// Friendly subtitle descriptions for each specialty
const categoryDescriptions = {
    'Examination & Diagnosis': 'Consultations, comprehensive checkups, digital radiographs (OPG & intraoral), CBCT scans, and diagnostic evaluations.',
    'Preventive Dentistry': 'Prophylactic teeth cleaning, ultrasonic scaling, polishing, topical fluoride therapy, and preventive sealants.',
    'Fillings & Restorative Treatment': 'Direct composite resin restorations, tooth-colored bonding, glass ionomer fillings, and custom inlays/onlays.',
    'Crowns & Bridges': 'Monolithic zirconia crowns, porcelain-fused-to-metal (PFM), e.max ceramic units, and fixed prosthetic bridges.',
    'Root Canal Treatment': 'Endodontic therapies, pulpectomy, root canal retreatment, fiber-post foundation, and endodontic restoration.',
    'Extractions & Oral Surgery': 'Routine & complex exodontia, surgical impactions, wisdom tooth management, and pre-prosthetic ridge preparation.',
    'Gum / Periodontal Treatment': 'Deep subgingival scaling, root planing, periodontal debridement, gingival surgery, and regenerative procedures.',
    'Dentures': 'Complete precision prosthetics, flexible partials, cast metal frameworks, relining, and immediate temporary dentures.',
    'Dental Implants': 'Titanium fixture surgical placement, all-on-4/6 full arch rehabilitation, sinus elevation, and custom abutment restoration.',
    'Cosmetic Dentistry': 'Porcelain & composite veneers, chairside power whitening, smile design, aesthetic contouring, and composite layering.',
    'Orthodontics': 'Clear aligner therapy, fixed ceramic & metallic brackets, orthodontic retention systems, and palatal expansion.',
    'Pediatric Dentistry': 'Pediatric consultations, pulpotomy, stainless steel crowns, space maintainers, and child preventive care.',
    'Emergency Dental Treatment': 'Urgent odontalgia alleviation, acute dental trauma stabilization, tooth replantation, and pulp extirpation.',
    'Prosthetic / Laboratory Procedures': 'Diagnostic aesthetic wax-ups, custom surgical splints, 3D study models, and custom laboratory appliances.',
    'Other Dental Services': 'TMJ / TMD therapy, sleep apnea splints, custom athletic mouthguards, and specialized sedation dental care.'
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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Main workspace view: 'schedule' (My Active Fee Studio), 'library' (Browse Standard Catalog), 'custom' (Create Custom)
    const [activeView, setActiveView] = useState('schedule');

    // Active Specialty Category selection in the left sidebar
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [scheduleSearch, setScheduleSearch] = useState('');

    // Toggle for inline custom procedure drawer right inside the workspace
    const [showInlineAdd, setShowInlineAdd] = useState(false);

    // State for row-level editing
    const [editingId, setEditingId] = useState(null); // FeeScheduleID or ProcedureCode of currently edited row
    const [editFormData, setEditFormData] = useState({});
    const [savingRowId, setSavingRowId] = useState(null);
    const [justSavedId, setJustSavedId] = useState(null);

    // Filter states for Standard Library tab
    const [libraryCategory, setLibraryCategory] = useState('All');
    const [librarySearch, setLibrarySearch] = useState('');

    // State for creating new custom procedure
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

            const headers = {
                ...(doctor?.token ? { 'Authorization': `Bearer ${doctor.token}` } : {})
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}`, { headers });
            } catch {
                res = await fetch(`/api/treatment-pricing/doctor/${doctorId}`, { headers });
            }

            if (res.ok) {
                const data = await res.json();
                setCurrency(data.currency || (doctor.region === 'PK' ? 'PKR' : 'NZD'));
                setProcedures(data.procedures || []);
                setHasUnsavedChanges(false);
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
        setHasUnsavedChanges(true);
    };

    // Handle inline duration change
    const handleDurationChange = (feeScheduleID, newDuration) => {
        setProcedures(prev => prev.map(p => 
            p.feeScheduleID === feeScheduleID ? { ...p, estimatedDuration: newDuration } : p
        ));
        setHasUnsavedChanges(true);
    };

    // Handle inline name change
    const handleNameChange = (feeScheduleID, newName) => {
        setProcedures(prev => prev.map(p => 
            p.feeScheduleID === feeScheduleID ? { ...p, procedureName: newName } : p
        ));
        setHasUnsavedChanges(true);
    };

    // Remove procedure from schedule
    const handleRemoveProcedure = (code, name) => {
        if (!window.confirm(`Are you sure you want to remove '${name || code}' from your active fee schedule?`)) {
            return;
        }
        setProcedures(prev => prev.filter(p => p.procedureCode !== code));
        setHasUnsavedChanges(true);
        setFeedback({
            type: 'info',
            message: `Removed procedure [${code}]. Click "Save Fee Schedule" to commit changes.`
        });
    };

    // Row-level Edit: start editing a specific procedure
    const handleStartEdit = (proc) => {
        const key = proc.feeScheduleID || proc.procedureCode;
        setEditingId(key);
        setEditFormData({
            feeScheduleID: proc.feeScheduleID || 0,
            doctorID: proc.doctorID || doctorId,
            currency: proc.currency || currency,
            procedureCode: proc.procedureCode,
            procedureName: proc.procedureName,
            category: proc.category,
            estimatedDuration: proc.estimatedDuration,
            standardFee: proc.standardFee,
            description: proc.description || '',
            isActive: proc.isActive !== false
        });
    };

    // Row-level Edit: cancel editing
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    // Row-level Edit: SAVE directly to Database
    const handleSaveRowToDb = async () => {
        if (!editFormData || !editFormData.procedureCode) return;
        const rowKey = editFormData.feeScheduleID || editFormData.procedureCode;

        try {
            setSavingRowId(rowKey);
            setFeedback({ type: '', message: '' });

            const updatedFee = parseFloat(editFormData.standardFee) || 0;
            const updatedItem = {
                ...editFormData,
                standardFee: updatedFee,
                doctorID: doctorId,
                currency
            };

            // Construct updated list
            const updatedList = procedures.map(p => {
                const isMatch = (p.feeScheduleID && p.feeScheduleID === editFormData.feeScheduleID) ||
                                (p.procedureCode === editFormData.procedureCode);
                return isMatch ? updatedItem : p;
            });

            const payload = {
                currency,
                procedures: updatedList
            };

            const headers = {
                'Content-Type': 'application/json',
                ...(doctor?.token ? { 'Authorization': `Bearer ${doctor.token}` } : {})
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/treatment-pricing/doctor/${doctorId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (res.ok && data.status !== 'handled_warning') {
                setProcedures(updatedList);
                setEditingId(null);
                setEditFormData({});
                setHasUnsavedChanges(false);
                setJustSavedId(rowKey);
                setTimeout(() => setJustSavedId(null), 3500);

                setFeedback({
                    type: 'success',
                    message: `✓ Saved '${updatedItem.procedureName}' (${currentCurrencySymbol} ${updatedFee.toLocaleString()}) to database successfully!`
                });
            } else {
                setFeedback({ type: 'error', message: data.message || 'Failed to save changes to database.' });
            }
        } catch (err) {
            console.error('Save row error:', err);
            setFeedback({ type: 'error', message: 'Network error saving procedure to database.' });
        } finally {
            setSavingRowId(null);
        }
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

            const headers = {
                'Content-Type': 'application/json',
                ...(doctor?.token ? { 'Authorization': `Bearer ${doctor.token}` } : {})
            };

            let res;
            try {
                res = await fetch(`${API_BASE_URL}/api/treatment-pricing/doctor/${doctorId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } catch {
                res = await fetch(`/api/treatment-pricing/doctor/${doctorId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (res.ok && data.status !== 'handled_warning') {
                setHasUnsavedChanges(false);
                setFeedback({ 
                    type: 'success', 
                    message: `Fee schedule saved successfully! All consultation bookings and patient invoices are now active in ${currency}.` 
                });
                fetchFeeSchedule();
            } else {
                setFeedback({ type: 'error', message: data.message || 'Failed to save changes.' });
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
                setHasUnsavedChanges(false);
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
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
        setShowInlineAdd(false);
        setActiveView('schedule');
        setSelectedCategory(created.category);

        setNewCustomProc({
            procedureCode: '',
            procedureName: '',
            category: selectedCategory !== 'All' ? selectedCategory : 'Examination & Diagnosis',
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

    // Counters for Active Schedule per category
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
            const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
            const q = scheduleSearch.toLowerCase().trim();
            const matchesSearch = !q || 
                                  p.procedureName.toLowerCase().includes(q) || 
                                  p.procedureCode.toLowerCase().includes(q) ||
                                  (p.category && p.category.toLowerCase().includes(q)) ||
                                  (p.description && p.description.toLowerCase().includes(q));
            return matchesCat && matchesSearch;
        });
    }, [procedures, selectedCategory, scheduleSearch]);

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

    // Calculate category summary statistics
    const activeCategoryStats = useMemo(() => {
        if (filteredScheduleProcedures.length === 0) return { count: 0, avgFee: 0 };
        const total = filteredScheduleProcedures.reduce((acc, p) => acc + (parseFloat(p.standardFee) || 0), 0);
        return {
            count: filteredScheduleProcedures.length,
            avgFee: Math.round(total / filteredScheduleProcedures.length)
        };
    }, [filteredScheduleProcedures]);

    return (
        <div className="min-h-screen bg-[#FBFBFA] text-dark-slate font-sans flex flex-col selection:bg-light-teal selection:text-primary-teal">
            <Navigation />

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-5">
                
                {/* Header Banner & Studio Command Bar */}
                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-light-teal shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-teal text-primary-hover text-xs font-bold font-mono uppercase tracking-wider">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Clinical Procedure & Fee Studio</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                            Dental Treatment Pricing & Currency
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-text max-w-2xl leading-relaxed">
                            Manage your active clinical fee catalog across 15 dental specialties for <span className="font-bold text-dark-slate">{doctorName}</span>. 
                            Rates automatically propagate to consultation bookings and patient billing ledgers.
                        </p>
                    </div>

                    {/* Controls: Currency Switcher & Save Button */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        
                        {/* Currency Selector */}
                        <div className="flex items-center gap-2 bg-warm-cream px-3 py-2 rounded-2xl border border-light-teal">
                            <Globe className="w-4 h-4 text-primary-teal shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-text uppercase">Active Currency</span>
                                <select 
                                    value={currency}
                                    onChange={(e) => {
                                        setCurrency(e.target.value);
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="bg-transparent font-bold text-xs text-dark-slate focus:outline-none cursor-pointer pr-2"
                                >
                                    {currencyOptions.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} ({c.symbol}) — {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Save Schedule Primary Button */}
                        <button
                            type="button"
                            onClick={handleSaveSchedule}
                            disabled={saving}
                            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                                hasUnsavedChanges 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 ring-2 ring-amber-400/40 animate-pulse'
                                    : 'bg-primary-teal hover:bg-primary-hover text-white shadow-primary-teal/20'
                            } disabled:opacity-50`}
                        >
                            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                            <span>{saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Fee Schedule'}</span>
                        </button>
                    </div>
                </div>

                {/* Feedback Notification Banner */}
                {feedback.message && (
                    <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 transition-all ${
                        feedback.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : feedback.type === 'info'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            {feedback.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : feedback.type === 'info' ? (
                                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
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

                {/* WORKSPACE TOP NAVIGATION TABS (Zero Popups) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-light-teal/80 pb-3">
                    <div className="flex items-center gap-2 bg-warm-cream p-1.5 rounded-2xl border border-light-teal/70 w-full sm:w-auto">
                        
                        {/* Tab 1: My Active Schedule Studio */}
                        <button
                            type="button"
                            onClick={() => setActiveView('schedule')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeView === 'schedule'
                                    ? 'bg-primary-teal text-white shadow-xs'
                                    : 'text-dark-slate hover:bg-light-teal'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>My Fee Studio</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                activeView === 'schedule' ? 'bg-white/20 text-white' : 'bg-white text-dark-slate'
                            }`}>
                                {procedures.length}
                            </span>
                        </button>

                        {/* Tab 2: Standard Library (141 Procedures) */}
                        <button
                            type="button"
                            onClick={() => setActiveView('library')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeView === 'library'
                                    ? 'bg-primary-teal text-white shadow-xs'
                                    : 'text-dark-slate hover:bg-light-teal'
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Standard Library</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                activeView === 'library' ? 'bg-white/20 text-white' : 'bg-white text-dark-slate'
                            }`}>
                                141
                            </span>
                        </button>

                        {/* Tab 3: Create Custom Procedure */}
                        <button
                            type="button"
                            onClick={() => setActiveView('custom')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeView === 'custom'
                                    ? 'bg-primary-teal text-white shadow-xs'
                                    : 'text-dark-slate hover:bg-light-teal'
                            }`}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Custom</span>
                        </button>
                    </div>

                    {/* Quick Studio Actions */}
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
                {/* VIEW 1: MASTER-DETAIL CLINICAL FEE STUDIO (Clean, Friendly, Organized)    */}
                {/* ========================================================================= */}
                {activeView === 'schedule' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in">
                        
                        {/* ------------------------------------------------------------- */}
                        {/* LEFT COLUMN: 15 CLINICAL SPECIALTIES NAVIGATOR (SIDEBAR)      */}
                        {/* ------------------------------------------------------------- */}
                        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
                            <div className="bg-white rounded-3xl p-4 border border-light-teal shadow-xs space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-light-teal/60">
                                    <div className="flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-primary-teal" />
                                        <span className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                            Specialties ({DENTAL_CATEGORIES.length})
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono font-bold text-muted-text">
                                        {procedures.length} Total
                                    </span>
                                </div>

                                {/* "All Procedures" Master Selector */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('All')}
                                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                        selectedCategory === 'All'
                                            ? 'bg-primary-teal text-white shadow-sm'
                                            : 'bg-warm-cream hover:bg-light-teal text-dark-slate border border-light-teal/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        <span>All Dental Procedures</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                        selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-white text-dark-slate'
                                    }`}>
                                        {procedures.length}
                                    </span>
                                </button>

                                {/* 15 Clinical Specialty List with live counters */}
                                <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                                    {DENTAL_CATEGORIES.map((cat, idx) => {
                                        const count = scheduleCategoryCounts[cat] || 0;
                                        const isSelected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer text-left ${
                                                    isSelected
                                                        ? 'bg-primary-teal text-white shadow-xs'
                                                        : 'hover:bg-warm-cream text-dark-slate'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 font-mono ${
                                                        isSelected ? 'bg-white/20 text-white' : 'bg-warm-cream text-muted-text border border-light-teal'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="truncate">{cat}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ml-2 ${
                                                    isSelected ? 'bg-white/20 text-white' : count > 0 ? 'bg-light-teal text-primary-hover font-bold' : 'bg-warm-cream text-muted-text'
                                                }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Specialty Action Card */}
                            <div className="p-4 rounded-3xl bg-warm-cream/70 border border-light-teal/80 text-xs space-y-2">
                                <div className="flex items-center gap-1.5 font-bold text-dark-slate">
                                    <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Specialty Management</span>
                                </div>
                                <p className="text-muted-text text-[11px] leading-relaxed">
                                    Select any specialty on the left to isolate and update chair times and fees without scrolling through 141 rows.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveView('library')}
                                    className="w-full mt-1 py-2 px-3 bg-white hover:bg-light-teal text-primary-teal border border-light-teal rounded-xl font-bold transition-all text-center block cursor-pointer"
                                >
                                    Browse Standard Catalog →
                                </button>
                            </div>
                        </div>

                        {/* ------------------------------------------------------------- */}
                        {/* RIGHT COLUMN: ACTIVE PROCEDURES WORKSPACE & TABLE             */}
                        {/* ------------------------------------------------------------- */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                            
                            {/* Active Category Header Card */}
                            <div className="bg-white rounded-3xl p-5 border border-light-teal shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-light-teal/60">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryBadgeColors[selectedCategory] || 'bg-slate-100 text-slate-700'}`}>
                                                {selectedCategory === 'All' ? 'All 15 Specialties' : selectedCategory}
                                            </span>
                                            <span className="text-xs font-bold text-muted-text">
                                                {activeCategoryStats.count} procedures
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-text mt-1 max-w-xl">
                                            {categoryDescriptions[selectedCategory] || 'Comprehensive dental procedures across all 15 clinical departments.'}
                                        </p>
                                    </div>

                                    {/* Action Buttons: Add Custom & Save */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowInlineAdd(!showInlineAdd);
                                                if (!showInlineAdd) {
                                                    setNewCustomProc(prev => ({
                                                        ...prev,
                                                        category: selectedCategory !== 'All' ? selectedCategory : 'Examination & Diagnosis'
                                                    }));
                                                }
                                            }}
                                            className="px-3.5 py-2 bg-light-teal hover:bg-light-teal-hover text-primary-hover border border-light-teal rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>{showInlineAdd ? 'Close Add Form' : '+ Custom Procedure'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Real-time Search Input */}
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                                    <input
                                        type="text"
                                        value={scheduleSearch}
                                        onChange={(e) => setScheduleSearch(e.target.value)}
                                        placeholder={`Search ${selectedCategory === 'All' ? 'all 141 procedures' : selectedCategory} by code (e.g. D0120), name, or keyword...`}
                                        className="w-full pl-10 pr-9 py-2.5 bg-warm-cream border border-light-teal rounded-2xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 font-medium shadow-xs"
                                    />
                                    {scheduleSearch && (
                                        <button 
                                            type="button" 
                                            onClick={() => setScheduleSearch('')} 
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-slate text-xs cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* INLINE CUSTOM PROCEDURE CREATION DRAWER (Zero Popups) */}
                                {showInlineAdd && (
                                    <form onSubmit={handleCreateCustomProcedure} className="p-4 rounded-2xl bg-warm-cream/80 border border-light-teal space-y-3 animate-in fade-in">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-bold text-xs text-dark-slate">
                                                <Plus className="w-3.5 h-3.5 text-primary-teal" />
                                                <span>Add Custom Clinic Procedure</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowInlineAdd(false)}
                                                className="text-muted-text hover:text-dark-slate text-xs cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-slate uppercase mb-1">Procedure Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newCustomProc.procedureName}
                                                    onChange={(e) => setNewCustomProc({ ...newCustomProc, procedureName: e.target.value })}
                                                    placeholder="e.g. Custom Bleach Tray"
                                                    className="w-full px-3 py-1.5 bg-white border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-slate uppercase mb-1">Clinical Specialty</label>
                                                <select
                                                    value={newCustomProc.category}
                                                    onChange={(e) => setNewCustomProc({ ...newCustomProc, category: e.target.value })}
                                                    className="w-full px-3 py-1.5 bg-white border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none cursor-pointer"
                                                >
                                                    {DENTAL_CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-slate uppercase mb-1">Standard Fee ({currentCurrencySymbol}) *</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    required
                                                    value={newCustomProc.standardFee}
                                                    onChange={(e) => setNewCustomProc({ ...newCustomProc, standardFee: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-3 py-1.5 bg-white border border-light-teal rounded-xl text-xs font-mono font-black text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-dark-slate uppercase mb-1">Duration</label>
                                                <input
                                                    type="text"
                                                    value={newCustomProc.estimatedDuration}
                                                    onChange={(e) => setNewCustomProc({ ...newCustomProc, estimatedDuration: e.target.value })}
                                                    placeholder="e.g. 45 mins"
                                                    className="w-full px-3 py-1.5 bg-white border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInlineAdd(false)}
                                                className="px-3 py-1.5 bg-white hover:bg-light-teal text-dark-slate text-xs font-bold rounded-xl border border-light-teal cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                                            >
                                                Add to Fee Schedule
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* CONTAINED BOUNDED PROCEDURE TABLE */}
                            <div className="bg-white rounded-3xl border border-light-teal shadow-xs overflow-hidden">
                                {loading ? (
                                    <div className="p-16 text-center space-y-3">
                                        <div className="w-8 h-8 border-3 border-primary-teal/30 border-t-primary-teal rounded-full animate-spin mx-auto" />
                                        <p className="text-xs text-muted-text font-bold">Loading your active clinical fee schedule...</p>
                                    </div>
                                ) : filteredScheduleProcedures.length === 0 ? (
                                    <div className="p-16 text-center space-y-4">
                                        <Stethoscope className="w-12 h-12 text-muted-text/40 mx-auto" />
                                        <h3 className="text-base font-bold text-dark-slate">No procedures in this selection</h3>
                                        <p className="text-xs text-muted-text max-w-md mx-auto">
                                            {procedures.length === 0
                                                ? 'Your clinic fee schedule is currently unpopulated. Click below to load all 141 standard procedures.'
                                                : `No active procedures found matching "${scheduleSearch}" in ${selectedCategory}.`}
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
                                    /* Bounded Scroll Container with Sticky Header */
                                    <div className="max-h-[580px] overflow-y-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="sticky top-0 bg-warm-cream/95 backdrop-blur-xs border-b border-light-teal z-10 text-[11px] font-bold text-muted-text uppercase tracking-wider">
                                                <tr>
                                                    <th className="py-3 px-4 w-24">Code</th>
                                                    <th className="py-3 px-4 min-w-[200px]">Procedure Name</th>
                                                    <th className="py-3 px-4 hidden sm:table-cell">Specialty</th>
                                                    <th className="py-3 px-4 w-28">Duration</th>
                                                    <th className="py-3 px-4 w-36">Standard Fee ({currentCurrencySymbol})</th>
                                                    <th className="py-3 px-4 hidden md:table-cell">Clinical Notes</th>
                                                    <th className="py-3 px-3 text-center min-w-[140px]">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-light-teal/50">
                                                {filteredScheduleProcedures.map((proc) => {
                                                    const rowKey = proc.feeScheduleID || proc.procedureCode;
                                                    const isEditing = editingId === rowKey;
                                                    const isSaving = savingRowId === rowKey;
                                                    const isJustSaved = justSavedId === rowKey;
                                                    const badgeColor = categoryBadgeColors[proc.category] || 'bg-slate-100 text-slate-700 border-slate-200';

                                                    if (isEditing) {
                                                        return (
                                                            <tr key={rowKey} className="bg-sky-50/70 ring-2 ring-primary-teal/50 transition-all">
                                                                {/* Code */}
                                                                <td className="py-3 px-4 font-mono font-bold align-top pt-3.5">
                                                                    <span className="px-2 py-0.5 rounded-lg bg-primary-teal text-white font-bold text-[11px] whitespace-nowrap shadow-xs">
                                                                        {proc.procedureCode}
                                                                    </span>
                                                                </td>

                                                                {/* Procedure Name & Inline Description Editor */}
                                                                <td className="py-3 px-4 align-top">
                                                                    <input 
                                                                        type="text"
                                                                        value={editFormData.procedureName || ''}
                                                                        onChange={(e) => setEditFormData({ ...editFormData, procedureName: e.target.value })}
                                                                        className="w-full font-bold text-dark-slate bg-white border border-primary-teal rounded-lg px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-teal/30"
                                                                        placeholder="Procedure name"
                                                                    />
                                                                    <div className="mt-1.5">
                                                                        <textarea
                                                                            rows="2"
                                                                            value={editFormData.description || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                                            placeholder="Clinical description / patient indications..."
                                                                            className="w-full text-[11px] text-dark-slate bg-white border border-light-teal rounded-lg p-1.5 focus:outline-none focus:border-primary-teal resize-none"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                {/* Specialty Category Selector */}
                                                                <td className="py-3 px-4 hidden sm:table-cell align-top pt-3.5">
                                                                    <select
                                                                        value={editFormData.category || ''}
                                                                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                                                        className="px-2 py-1 bg-white border border-primary-teal/50 rounded-lg text-[11px] font-bold text-dark-slate cursor-pointer focus:outline-none focus:border-primary-teal"
                                                                    >
                                                                        {DENTAL_CATEGORIES.map(cat => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>

                                                                {/* Duration */}
                                                                <td className="py-3 px-4 align-top pt-3.5">
                                                                    <div className="flex items-center gap-1 text-muted-text">
                                                                        <Clock className="w-3 h-3 text-primary-teal shrink-0" />
                                                                        <input 
                                                                            type="text"
                                                                            value={editFormData.estimatedDuration || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, estimatedDuration: e.target.value })}
                                                                            className="w-22 font-medium text-dark-slate bg-white border border-primary-teal/50 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary-teal"
                                                                            placeholder="45 mins"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                {/* Standard Fee */}
                                                                <td className="py-3 px-4 align-top pt-3.5">
                                                                    <div className="flex items-center gap-1 font-mono font-black text-dark-slate bg-white px-2 py-1 rounded-xl border-2 border-primary-teal w-36 shadow-xs">
                                                                        <span className="text-primary-teal text-xs shrink-0 font-bold">{currentCurrencySymbol}</span>
                                                                        <input 
                                                                            type="number"
                                                                            step="any"
                                                                            value={editFormData.standardFee ?? ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, standardFee: e.target.value })}
                                                                            className="w-full bg-transparent text-xs font-mono font-black text-dark-slate focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                {/* Clinical Notes (Cell indicator) */}
                                                                <td className="py-3 px-4 hidden md:table-cell align-top text-[11px] text-muted-text italic pt-3.5">
                                                                    (Editing note below name)
                                                                </td>

                                                                {/* Action: SAVE TO DB / CANCEL */}
                                                                <td className="py-3 px-3 align-top pt-3">
                                                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleSaveRowToDb}
                                                                            disabled={isSaving}
                                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                                                            title="Save changes directly to database"
                                                                        >
                                                                            {isSaving ? (
                                                                                <>
                                                                                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                                                                    <span>Saving...</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Save className="w-3.5 h-3.5" />
                                                                                    <span>Save to DB</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleCancelEdit}
                                                                            disabled={isSaving}
                                                                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-dark-slate rounded-xl text-xs font-bold transition-all border border-light-teal flex items-center gap-1 cursor-pointer"
                                                                            title="Cancel editing"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                            <span>Cancel</span>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    // Default Viewing Row with explicit "Edit" and "Delete" buttons
                                                    return (
                                                        <tr key={rowKey} className="hover:bg-warm-cream/40 transition-colors group">
                                                            
                                                            {/* Code Badge */}
                                                            <td className="py-3 px-4 font-mono font-bold">
                                                                <span className="px-2 py-0.5 rounded-lg bg-light-teal text-primary-hover font-bold text-[11px] border border-light-teal/60 whitespace-nowrap">
                                                                    {proc.procedureCode}
                                                                </span>
                                                            </td>

                                                            {/* Procedure Name */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span 
                                                                        onClick={() => handleStartEdit(proc)}
                                                                        className="font-bold text-dark-slate text-xs hover:text-primary-teal cursor-pointer transition-colors"
                                                                        title="Click to edit procedure"
                                                                    >
                                                                        {proc.procedureName}
                                                                    </span>
                                                                    {isJustSaved && (
                                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold animate-pulse whitespace-nowrap">
                                                                            <Check className="w-3 h-3" />
                                                                            <span>Saved to DB</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Specialty Category Badge */}
                                                            <td className="py-3 px-4 hidden sm:table-cell">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor} whitespace-nowrap`}>
                                                                    {proc.category}
                                                                </span>
                                                            </td>

                                                            {/* Duration */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-1 text-muted-text">
                                                                    <Clock className="w-3 h-3 text-primary-teal shrink-0" />
                                                                    <span className="font-medium text-dark-slate text-xs">{proc.estimatedDuration}</span>
                                                                </div>
                                                            </td>

                                                            {/* Standard Fee */}
                                                            <td className="py-3 px-4">
                                                                <div 
                                                                    onClick={() => handleStartEdit(proc)}
                                                                    className="font-mono font-black text-xs text-dark-slate bg-warm-cream hover:bg-light-teal/60 px-2.5 py-1 rounded-xl border border-light-teal w-fit cursor-pointer transition-colors"
                                                                    title="Click to edit fee"
                                                                >
                                                                    {currentCurrencySymbol} {Number(proc.standardFee).toLocaleString()}
                                                                </div>
                                                            </td>

                                                            {/* Description */}
                                                            <td className="py-3 px-4 hidden md:table-cell text-muted-text text-[11px] max-w-xs truncate" title={proc.description}>
                                                                {proc.description || 'Standard clinic procedure'}
                                                            </td>

                                                            {/* Actions: EDIT & DELETE BUTTONS */}
                                                            <td className="py-3 px-3 text-center">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleStartEdit(proc)}
                                                                        className="px-2.5 py-1.5 rounded-xl bg-light-teal hover:bg-primary-teal text-primary-hover hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-2xs border border-light-teal-hover"
                                                                        title="Edit procedure and save to database"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                        <span>Edit</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveProcedure(proc.procedureCode, proc.procedureName)}
                                                                        className="p-1.5 text-muted-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                        title="Remove from schedule"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>

                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Bottom Table Summary Bar */}
                                <div className="p-3 bg-warm-cream/80 border-t border-light-teal flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                                    <span className="text-muted-text font-medium">
                                        Showing <span className="font-bold text-dark-slate">{filteredScheduleProcedures.length}</span> of {procedures.length} procedures in your clinic schedule
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {hasUnsavedChanges && (
                                            <span className="text-amber-600 font-bold text-[11px] flex items-center gap-1">
                                                ● Unsaved edits
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleSaveSchedule}
                                            disabled={saving}
                                            className="px-4 py-1.5 bg-primary-teal hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* VIEW 2: STANDARD PROCEDURE LIBRARY (141 Procedures Browsable)             */}
                {/* ========================================================================= */}
                {activeView === 'library' && (
                    <div className="space-y-5 animate-in fade-in">
                        
                        {/* Library Header & Search Bar */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-light-teal shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-serif font-black text-dark-slate flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary-teal" />
                                        <span>Standard Dental Procedure Catalog (141 Procedures)</span>
                                    </h2>
                                    <p className="text-xs text-muted-text">
                                        Browse all 15 clinical dental specialties. Click <span className="font-bold text-primary-teal">+ Add</span> to activate any procedure in your clinic.
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
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-slate text-xs cursor-pointer"
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

                        {/* Category Bulk Action Banner */}
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

                        {/* Standard Procedures Grid */}
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
                {/* VIEW 3: CREATE CUSTOM PROCEDURE (Dedicated Tab View)                      */}
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

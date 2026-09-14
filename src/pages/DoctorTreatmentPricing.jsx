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
    BookOpen
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';
import { STANDARD_DENTAL_PROCEDURES, DENTAL_CATEGORIES } from '../data/standardProcedures';

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
    const [resetting, setResetting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Add new custom procedure modal/drawer
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProc, setNewProc] = useState({
        procedureCode: '',
        procedureName: '',
        category: 'Examination & Diagnosis',
        estimatedDuration: '45 mins',
        standardFee: '',
        description: ''
    });

    const currencyOptions = [
        { code: 'NZD', symbol: '$', label: 'New Zealand Dollar (NZD $)' },
        { code: 'PKR', symbol: 'Rs', label: 'Pakistani Rupee (PKR Rs)' },
        { code: 'USD', symbol: '$', label: 'US Dollar (USD $)' },
        { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)' },
        { code: 'EUR', symbol: '€', label: 'Euro (EUR €)' },
        { code: 'AUD', symbol: '$', label: 'Australian Dollar (AUD $)' }
    ];

    const currentCurrencySymbol = currencyOptions.find(c => c.code === currency)?.symbol || '$';

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
                setFeedback({ type: 'error', message: 'Failed to load treatment fee schedule.' });
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
                    message: `Fee schedule saved! All consultation bookings and patient invoices are now active in ${currency}.` 
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

    // Reset to full 15-category master procedure catalog from backend
    const handleResetToMaster = async () => {
        if (!window.confirm('Reload all 15 clinical categories (140+ standard procedures) from the Dentia master catalog? Custom edits will be synchronized.')) {
            return;
        }

        try {
            setResetting(true);
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
                setFeedback({
                    type: 'success',
                    message: 'Successfully loaded 140+ procedures across all 15 clinical categories!'
                });
            } else {
                setFeedback({ type: 'error', message: 'Failed to reload master catalog.' });
            }
        } catch (err) {
            console.error('Error resetting to master:', err);
            setFeedback({ type: 'error', message: 'Network error resetting catalog.' });
        } finally {
            setResetting(false);
        }
    };

    // Load All 141 Procedures locally into current state
    const handleLoadAllStandardProcedures = () => {
        const existingCodes = new Set(procedures.map(p => p.procedureCode));
        const newItems = [];
        
        STANDARD_DENTAL_PROCEDURES.forEach(sp => {
            if (!existingCodes.has(sp.code)) {
                let fee = currency === 'PKR' ? sp.feePKR : sp.feeNZD;
                if (currency === 'USD') fee = Math.round(sp.feeNZD * 0.62);
                else if (currency === 'GBP') fee = Math.round(sp.feeNZD * 0.48);
                else if (currency === 'EUR') fee = Math.round(sp.feeNZD * 0.56);
                else if (currency === 'AUD') fee = Math.round(sp.feeNZD * 0.92);

                newItems.push({
                    feeScheduleID: 0,
                    doctorID: doctorId,
                    currency,
                    procedureCode: sp.code,
                    procedureName: sp.name,
                    category: sp.category,
                    estimatedDuration: sp.duration,
                    standardFee: fee,
                    description: sp.description,
                    isActive: true
                });
            }
        });

        if (newItems.length === 0) {
            setFeedback({ type: 'info', message: 'All 141 standard procedures are already loaded in your schedule!' });
            return;
        }

        setProcedures(prev => [...prev, ...newItems]);
        setShowAddModal(false);
        setFeedback({
            type: 'success',
            message: `Loaded ${newItems.length} procedure names into your schedule! Click "Save Fee Schedule" to commit changes to database.`
        });
    };

    // Select standard procedure in modal to auto-populate all fields
    const handleSelectStandardProcedure = (procName) => {
        if (!procName) return;
        const match = STANDARD_DENTAL_PROCEDURES.find(
            p => p.name.toLowerCase() === procName.trim().toLowerCase()
        );

        if (match) {
            let fee = currency === 'PKR' ? match.feePKR : match.feeNZD;
            if (currency === 'USD') fee = Math.round(match.feeNZD * 0.62);
            else if (currency === 'GBP') fee = Math.round(match.feeNZD * 0.48);
            else if (currency === 'EUR') fee = Math.round(match.feeNZD * 0.56);
            else if (currency === 'AUD') fee = Math.round(match.feeNZD * 0.92);

            setNewProc({
                procedureCode: match.code,
                procedureName: match.name,
                category: match.category,
                estimatedDuration: match.duration,
                standardFee: fee.toFixed(2),
                description: match.description
            });
        } else {
            setNewProc(prev => ({ ...prev, procedureName: procName }));
        }
    };

    // Add custom procedure
    const handleAddProcedure = (e) => {
        e.preventDefault();
        if (!newProc.procedureName || !newProc.standardFee) {
            alert('Please enter a procedure name and fee.');
            return;
        }

        const fee = parseFloat(newProc.standardFee) || 0;
        const code = newProc.procedureCode.trim() || `CUST-${Math.floor(100 + Math.random() * 900)}`;

        const created = {
            feeScheduleID: 0, // indicates new insert
            doctorID: doctorId,
            currency,
            procedureCode: code,
            procedureName: newProc.procedureName.trim(),
            category: newProc.category,
            estimatedDuration: newProc.estimatedDuration || '45 mins',
            standardFee: fee,
            description: newProc.description.trim() || null,
            isActive: true
        };

        setProcedures(prev => [...prev, created]);
        setShowAddModal(false);
        setNewProc({
            procedureCode: '',
            procedureName: '',
            category: 'Examination & Diagnosis',
            estimatedDuration: '45 mins',
            standardFee: '',
            description: ''
        });

        setFeedback({
            type: 'info',
            message: `Added '${created.procedureName}'. Click "Save Fee Schedule" to commit changes to database.`
        });
    };

    // Filter procedures
    const categoryCounts = useMemo(() => {
        const counts = { All: procedures.length };
        procedures.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return counts;
    }, [procedures]);

    const activeCategories = useMemo(() => {
        const setCats = new Set(procedures.map(p => p.category));
        const list = ['All'];
        DENTAL_CATEGORIES.forEach(c => {
            if (setCats.has(c)) list.push(c);
        });
        // Include any custom categories not in default list
        setCats.forEach(c => {
            if (!list.includes(c)) list.push(c);
        });
        return list;
    }, [procedures]);

    const filteredProcedures = procedures.filter(p => {
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || 
                              p.procedureName.toLowerCase().includes(q) || 
                              p.procedureCode.toLowerCase().includes(q) ||
                              (p.category && p.category.toLowerCase().includes(q)) ||
                              (p.description && p.description.toLowerCase().includes(q));
        return matchesCat && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans flex flex-col selection:bg-light-teal selection:text-primary-teal">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-10 flex-grow w-full space-y-8">
                
                {/* Header Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-teal text-primary-hover text-xs font-bold font-mono uppercase tracking-wider">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Clinician Fee Schedule</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                            Dental Procedure Pricing & Currency
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-text max-w-xl leading-relaxed">
                            Configure standard procedure rates, chair times, and currency for <span className="font-bold text-dark-slate">{doctorName}</span>. 
                            Managing 15 standard clinical categories with live patient ledger synchronization.
                        </p>
                    </div>

                    {/* Actions: Currency Selector, Load All Procedures, Reload & Save CTA */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        {/* Currency Selector */}
                        <div className="flex items-center gap-2 bg-warm-cream px-3 py-2 rounded-2xl border border-light-teal">
                            <Globe className="w-4 h-4 text-primary-teal shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-text uppercase">Currency</span>
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

                        {/* Load All 141 Procedures Button */}
                        <button
                            type="button"
                            onClick={handleLoadAllStandardProcedures}
                            className="px-3.5 py-2.5 bg-warm-cream hover:bg-light-teal text-primary-hover border border-light-teal rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Add all 141 standard procedures to your active schedule"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                            <span>Load All 141 Procedures</span>
                        </button>

                        {/* Reload Master Catalog Button */}
                        <button
                            type="button"
                            onClick={handleResetToMaster}
                            disabled={resetting || loading}
                            title="Reset all 15 categories to standard master catalog"
                            className="px-3.5 py-2.5 bg-white hover:bg-light-teal text-dark-slate border border-light-teal rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 text-primary-teal ${resetting ? 'animate-spin' : ''}`} />
                            <span>{resetting ? 'Loading...' : 'Sync Master'}</span>
                        </button>

                        {/* Save Button */}
                        <button
                            type="button"
                            onClick={handleSaveSchedule}
                            disabled={saving}
                            className="px-5 py-2.5 bg-primary-teal hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-primary-teal/25 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
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

                {/* Feedback Toast Banner */}
                {feedback.message && (
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 text-xs font-bold ${
                        feedback.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : feedback.type === 'error'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-sky-50 border-sky-200 text-sky-800'
                    }`}>
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by code, procedure name, or category..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-light-teal rounded-2xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 shadow-xs"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-text">
                            Showing <span className="text-dark-slate font-black">{filteredProcedures.length}</span> of {procedures.length} Procedures
                        </span>

                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2.5 bg-light-teal hover:bg-light-teal-hover text-primary-hover border border-light-teal rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Procedure</span>
                        </button>
                    </div>
                </div>

                {/* 15 Category Filter Pills (Scrollable Bar) */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                        {activeCategories.map((cat) => {
                            const count = categoryCounts[cat] || 0;
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
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
                </div>

                {/* Procedure Fee Schedule Table / Grid */}
                <div className="bg-white rounded-3xl border border-light-teal shadow-xs overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center space-y-3">
                            <div className="w-8 h-8 border-3 border-primary-teal/30 border-t-primary-teal rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-muted-text font-bold">Loading clinic fee schedule...</p>
                        </div>
                    ) : filteredProcedures.length === 0 ? (
                        <div className="p-16 text-center space-y-4">
                            <Stethoscope className="w-10 h-10 text-muted-text/40 mx-auto" />
                            <h3 className="text-sm font-bold text-dark-slate">No procedures found</h3>
                            <p className="text-xs text-muted-text max-w-sm mx-auto">
                                {procedures.length === 0 
                                    ? 'Your schedule is currently empty. Click below to load all 141 standard procedures.' 
                                    : 'Try adjusting your search query or category filter.'}
                            </p>
                            {procedures.length === 0 && (
                                <button
                                    type="button"
                                    onClick={handleLoadAllStandardProcedures}
                                    className="px-5 py-2.5 bg-primary-teal text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer shadow-md shadow-primary-teal/20 flex items-center gap-2 mx-auto"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Load All 141 Standard Procedures</span>
                                </button>
                            )}
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
                                        <th className="py-3.5 px-5">Standard Fee ({currentCurrencySymbol})</th>
                                        <th className="py-3.5 px-5">Clinical Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-teal/50">
                                    {filteredProcedures.map((proc) => {
                                        const badgeColor = categoryBadgeColors[proc.category] || 'bg-slate-100 text-slate-700 border-slate-200';
                                        return (
                                            <tr key={proc.feeScheduleID || proc.procedureCode} className="hover:bg-warm-cream/30 transition-colors">
                                                
                                                {/* Code */}
                                                <td className="py-4 px-5">
                                                    <span className="px-2.5 py-1 rounded-lg bg-light-teal text-primary-hover font-mono font-bold text-[11px] border border-light-teal/50">
                                                        {proc.procedureCode}
                                                    </span>
                                                </td>

                                                {/* Procedure Name (Inline Editable) */}
                                                <td className="py-4 px-5">
                                                    <input 
                                                        type="text"
                                                        value={proc.procedureName}
                                                        onChange={(e) => handleNameChange(proc.feeScheduleID, e.target.value)}
                                                        className="w-full font-bold text-dark-slate bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-light-teal focus:border-primary-teal rounded-lg px-2 py-1 text-xs transition-colors"
                                                    />
                                                </td>

                                                {/* Category */}
                                                <td className="py-4 px-5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor} whitespace-nowrap`}>
                                                        {proc.category}
                                                    </span>
                                                </td>

                                                {/* Duration */}
                                                <td className="py-4 px-5">
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
                                                <td className="py-4 px-5">
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
                                                <td className="py-4 px-5 text-muted-text text-[11px] max-w-xs truncate" title={proc.description}>
                                                    {proc.description || 'Standard clinic procedure'}
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>

            {/* Modal: Add Clinic Procedure with Standard Procedure Library Dropdown & Autocomplete */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-slate/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl border border-light-teal shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-5">
                        <div className="flex items-center justify-between border-b border-light-teal pb-3">
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary-teal" />
                                <h3 className="text-base font-serif font-black text-dark-slate">Add Clinic Procedure</h3>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowAddModal(false)}
                                className="text-muted-text hover:text-dark-slate p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddProcedure} className="space-y-4">
                            
                            {/* Procedure Name Field with Preloaded Standard Library */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase">
                                        Procedure Name *
                                    </label>
                                    <span className="text-[10px] font-bold text-primary-teal">
                                        141 Standard Procedures Preloaded
                                    </span>
                                </div>

                                {/* Quick-Select Dropdown from Library */}
                                <div className="mb-2">
                                    <select
                                        onChange={(e) => handleSelectStandardProcedure(e.target.value)}
                                        className="w-full px-3 py-2 bg-light-teal/50 hover:bg-light-teal border border-primary-teal/40 rounded-xl text-xs font-bold text-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-teal cursor-pointer"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- ⚡ Select from 141 Standard Procedures (Auto-Fills Details) --</option>
                                        {DENTAL_CATEGORIES.map(cat => {
                                            const procsInCat = STANDARD_DENTAL_PROCEDURES.filter(p => p.category === cat);
                                            return (
                                                <optgroup key={cat} label={`📂 ${cat} (${procsInCat.length})`}>
                                                    {procsInCat.map(p => (
                                                        <option key={p.code} value={p.name}>
                                                            {p.name} — [{p.code}] ({p.duration})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Custom Input with Datalist Autocomplete */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        list="standard-procedure-names-list"
                                        value={newProc.procedureName}
                                        onChange={(e) => handleSelectStandardProcedure(e.target.value)}
                                        placeholder="Or type custom procedure name..."
                                        className="w-full px-3 py-2.5 bg-warm-cream border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                    <datalist id="standard-procedure-names-list">
                                        {STANDARD_DENTAL_PROCEDURES.map(p => (
                                            <option key={p.code} value={p.name}>
                                                {p.category} • {p.code}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>
                                <p className="text-[10px] text-muted-text mt-1">
                                    Selecting any standard procedure automatically pre-fills the Code, Category, Duration, and Fee ({currentCurrencySymbol}).
                                </p>
                            </div>

                            {/* Procedure Code & Category */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Procedure Code
                                    </label>
                                    <input
                                        type="text"
                                        value={newProc.procedureCode}
                                        onChange={(e) => setNewProc({ ...newProc, procedureCode: e.target.value })}
                                        placeholder="e.g. D0120"
                                        className="w-full px-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs font-mono font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={newProc.category}
                                        onChange={(e) => setNewProc({ ...newProc, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 cursor-pointer"
                                    >
                                        {DENTAL_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Standard Fee & Duration */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Standard Fee ({currentCurrencySymbol}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={newProc.standardFee}
                                        onChange={(e) => setNewProc({ ...newProc, standardFee: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs font-mono font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Duration
                                    </label>
                                    <input
                                        type="text"
                                        value={newProc.estimatedDuration}
                                        onChange={(e) => setNewProc({ ...newProc, estimatedDuration: e.target.value })}
                                        placeholder="e.g. 45 mins"
                                        className="w-full px-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                    />
                                </div>
                            </div>

                            {/* Clinical Description */}
                            <div>
                                <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                    Clinical Description
                                </label>
                                <textarea
                                    rows="2"
                                    value={newProc.description}
                                    onChange={(e) => setNewProc({ ...newProc, description: e.target.value })}
                                    placeholder="Procedure notes or clinical indications..."
                                    className="w-full px-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40 resize-none"
                                />
                            </div>

                            {/* Modal Bottom Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleLoadAllStandardProcedures}
                                    className="text-xs text-primary-hover hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Or Load All 141 Procedures at Once</span>
                                </button>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 bg-warm-cream hover:bg-light-teal text-dark-slate text-xs font-bold rounded-xl border border-light-teal transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                                    >
                                        Add to Schedule
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

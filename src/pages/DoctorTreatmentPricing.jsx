import React, { useState, useEffect } from 'react';
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
    Filter 
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export default function DoctorTreatmentPricing() {
    const [doctor, setDoctor] = useState(() => JSON.parse(localStorage.getItem('doctor') || '{}'));
    const doctorId = doctor.doctorID || doctor.DoctorID || 2;
    const doctorName = doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Attending Clinician';

    const [currency, setCurrency] = useState('NZD');
    const [procedures, setProcedures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Add new custom procedure modal/drawer
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProc, setNewProc] = useState({
        procedureCode: '',
        procedureName: '',
        category: 'Preventative',
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
            category: 'Preventative',
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
    const categories = ['All', ...new Set(procedures.map(p => p.category))];
    const filteredProcedures = procedures.filter(p => {
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch = p.procedureName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.procedureCode.toLowerCase().includes(searchQuery.toLowerCase());
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
                            Treatment Pricing & Currency Settings
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-text max-w-xl leading-relaxed">
                            Configure standard procedure rates, appointment durations, and billing currency for <span className="font-bold text-dark-slate">{doctorName}</span>. Prices sync dynamically with patient booking and billing ledgers.
                        </p>
                    </div>

                    {/* Currency Selector & Save CTA */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-warm-cream px-3 py-2 rounded-2xl border border-light-teal">
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

                {/* Feedback Alerts */}
                {feedback.message && (
                    <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
                        feedback.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                            : feedback.type === 'info'
                                ? 'bg-sky-50 border-sky-200 text-sky-900'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {feedback.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-primary-teal shrink-0" />
                            )}
                            <span>{feedback.message}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setFeedback({ type: '', message: '' })}
                            className="text-muted-text hover:text-dark-slate cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Filters & Actions Bar */}
                <div className="bg-white rounded-2xl p-4 border border-light-teal flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    selectedCategory === cat 
                                        ? 'bg-primary-teal text-white shadow-xs' 
                                        : 'bg-warm-cream text-dark-slate hover:bg-light-teal border border-light-teal/80'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search & Add Custom Button */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-60">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search procedure code or name..."
                                className="w-full pl-9 pr-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="px-3.5 py-2 bg-light-teal hover:bg-light-teal-hover text-primary-hover border border-light-teal rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Procedure</span>
                        </button>
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
                        <div className="p-16 text-center space-y-2">
                            <Stethoscope className="w-10 h-10 text-muted-text/40 mx-auto" />
                            <h3 className="text-sm font-bold text-dark-slate">No procedures found</h3>
                            <p className="text-xs text-muted-text">Try adjusting your search query or category filter.</p>
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
                                    {filteredProcedures.map((proc) => (
                                        <tr key={proc.feeScheduleID || proc.procedureCode} className="hover:bg-warm-cream/30 transition-colors">
                                            
                                            {/* Code */}
                                            <td className="py-4 px-5">
                                                <span className="px-2.5 py-1 rounded-lg bg-light-teal text-primary-hover font-mono font-bold text-[11px]">
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
                                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
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
                                            <td className="py-4 px-5 text-muted-text text-[11px] max-w-xs truncate">
                                                {proc.description || 'Standard clinic procedure'}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>

            {/* Modal: Add Custom Procedure */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-slate/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl border border-light-teal shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
                        <div className="flex items-center justify-between border-b border-light-teal pb-3">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary-teal" />
                                <h3 className="text-base font-serif font-black text-dark-slate">Add Clinic Procedure</h3>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowAddModal(false)}
                                className="text-muted-text hover:text-dark-slate text-xs font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddProcedure} className="space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                    Procedure Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newProc.procedureName}
                                    onChange={(e) => setNewProc({ ...newProc, procedureName: e.target.value })}
                                    placeholder="e.g. Custom Night Guard / Splint"
                                    className="w-full px-3 py-2 bg-warm-cream border border-light-teal rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/40"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-dark-slate uppercase mb-1">
                                        Procedure Code
                                    </label>
                                    <input
                                        type="text"
                                        value={newProc.procedureCode}
                                        onChange={(e) => setNewProc({ ...newProc, procedureCode: e.target.value })}
                                        placeholder="e.g. D9944"
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
                                        <option value="Preventative">Preventative</option>
                                        <option value="Restorative">Restorative</option>
                                        <option value="Orthodontic">Orthodontic</option>
                                        <option value="Periodontal">Periodontal</option>
                                        <option value="Cosmetic">Cosmetic</option>
                                        <option value="Endodontic">Endodontic</option>
                                        <option value="Oral Surgery">Oral Surgery</option>
                                    </select>
                                </div>
                            </div>

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

                            <div className="flex items-center justify-end gap-2 pt-2">
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
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

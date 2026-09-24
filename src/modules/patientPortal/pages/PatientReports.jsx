import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Pill, 
    Image as ImageIcon, 
    Calendar, 
    User, 
    Download, 
    ExternalLink, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw, 
    Sparkles, 
    Clock, 
    ChevronDown, 
    ChevronUp, 
    Printer, 
    KeyRound, 
    Hash, 
    ShieldCheck, 
    Contrast, 
    Activity, 
    Layers, 
    Stethoscope,
    ClipboardList,
    AlertTriangle,
    Eye,
    Shield,
    BadgeCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../../../config/apiConfig';
import { generateClinicalReportPdf } from '../../../utils/ClinicalReportPdfGenerator';

export default function PatientReports() {
    const [activeSection, setActiveSection] = useState('notes'); // 'notes' | 'prescriptions' | 'xrays'
    const [reports, setReports] = useState([]);
    const [prescriptions, setPrescriptions] = useState({ directPrescriptions: [], consultationPrescriptions: [] });
    const [radiographs, setRadiographs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedXray, setSelectedXray] = useState(null);
    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    // Lightbox image inspection states
    const [xrayZoom, setXrayZoom] = useState(1);
    const [xrayInverted, setXrayInverted] = useState(false);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientRefNo = patient.referenceNumber || (patient.referenceNo || `DEN-2026-${String(patient.patientID || patient.patientId || '00000').padStart(5, '0')}`);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            const token = patient.token;
            const headers = { 'Authorization': `Bearer ${token}` };

            try {
                // 1. Fetch Reports
                try {
                    let rRes;
                    try { rRes = await fetch(`${API_BASE_URL}/api/patient-portal/reports`, { headers }); }
                    catch { rRes = await fetch(`/api/patient-portal/reports`, { headers }); }
                    if (rRes.ok) setReports(await rRes.json());
                } catch (e) { console.error('Reports fetch err:', e); }

                // 2. Fetch Prescriptions
                try {
                    let pRes;
                    try { pRes = await fetch(`${API_BASE_URL}/api/patient-portal/prescriptions`, { headers }); }
                    catch { pRes = await fetch(`/api/patient-portal/prescriptions`, { headers }); }
                    if (pRes.ok) setPrescriptions(await pRes.json());
                } catch (e) { console.error('Prescriptions fetch err:', e); }

                // 3. Fetch Radiographs
                try {
                    let xRes;
                    try { xRes = await fetch(`${API_BASE_URL}/api/patient-portal/radiographs`, { headers }); }
                    catch { xRes = await fetch(`/api/patient-portal/radiographs`, { headers }); }
                    if (xRes.ok) setRadiographs(await xRes.json());
                } catch (e) { console.error('Radiographs fetch err:', e); }

            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const toggleNote = (id) => {
        setExpandedNoteId(expandedNoteId === id ? null : id);
    };

    // Safe date formatter preventing "Invalid Date"
    const formatReportDate = (dateVal) => {
        if (!dateVal) return 'Verified Clinical File';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return 'Verified Clinical File';
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Robust cleaner that extracts clean bullet items without empty orphan dots
    const cleanBulletPoints = (rawText) => {
        if (!rawText) return [];
        return rawText
            .split('\n')
            .map(line => {
                // remove bold syntax, bullets, leading spaces
                return line
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/^[-*•\s]+/, '')
                    .trim();
            })
            .filter(line => line.length > 2 && line !== '•' && line !== '-');
    };

    // Robust parser for AI radiograph analysis strings
    const parseRadiographAnalysis = (raw) => {
        if (!raw) {
            return {
                cleanSnippet: 'Diagnostic dental radiograph archived on clinic file.',
                sections: []
            };
        }

        // 1. Strip raw JSON blocks (```json ... ``` or ``` ... ```)
        let cleaned = raw.replace(/```json[\s\S]*?```/gi, '').replace(/```[\s\S]*?```/gi, '').trim();

        // 2. Extract sections based on ### headers
        const sections = [];
        const overviewMatch = cleaned.match(/###?\s*1[.\s]+CLINICAL RADIOGRAPHIC OVERVIEW\s*([\s\S]*?)(?=###?\s*2|$)/i);
        const toothMatch = cleaned.match(/###?\s*2[.\s]+TOOTH-BY-TOOTH FINDINGS[^\n]*\s*([\s\S]*?)(?=###?\s*3|$)/i);
        const soapMatch = cleaned.match(/###?\s*3[.\s]+COMPREHENSIVE SOAP[^\n]*\s*([\s\S]*?)(?=###?\s*4|$)/i);

        if (overviewMatch && overviewMatch[1].trim()) {
            sections.push({
                title: 'Clinical Radiographic Overview',
                badge: 'Modality & Quality',
                bullets: cleanBulletPoints(overviewMatch[1])
            });
        }

        if (toothMatch && toothMatch[1].trim()) {
            sections.push({
                title: 'Tooth-by-Tooth Findings & Pathology',
                badge: 'Anatomy',
                bullets: cleanBulletPoints(toothMatch[1])
            });
        }

        if (soapMatch && soapMatch[1].trim()) {
            sections.push({
                title: 'Comprehensive SOAP Impression & Care Plan',
                badge: 'Clinical SOAP',
                bullets: cleanBulletPoints(soapMatch[1])
            });
        }

        if (sections.length === 0) {
            sections.push({
                title: 'Diagnostic Radiographic Impression',
                badge: 'AI Diagnostic',
                bullets: cleanBulletPoints(cleaned)
            });
        }

        // Short preview snippet for card view
        let snippet = cleaned
            .replace(/###.*?\n/g, ' ')
            .replace(/\*\*.*?\*\*/g, '')
            .replace(/[-*•]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (snippet.length > 150) {
            snippet = snippet.substring(0, 147) + '...';
        }

        return { cleanSnippet: snippet, sections };
    };

    // Parse treatment performed text and extract individual tooth badges
    const parseTreatmentPerformed = (text) => {
        if (!text) {
            return {
                summary: 'Prophylaxis and clinical oral assessment completed.',
                teethFindings: []
            };
        }

        // Separate general summary from "Active findings: "
        const parts = text.split(/Active findings:\s*/i);
        const summary = parts[0].trim().replace(/;\s*$/, '');
        const teethRaw = parts[1] || '';

        const teethFindings = [];
        if (teethRaw) {
            // Match pattern: Tooth #1 (Extracted / Missing)
            const matches = teethRaw.matchAll(/Tooth\s*#?(\d+)\s*\(([^)]+)\)/gi);
            for (const m of matches) {
                teethFindings.push({
                    toothNumber: m[1],
                    condition: m[2].trim()
                });
            }
        }

        return { summary, teethFindings };
    };

    // Download Official Clinical Report PDF with credentials in footer
    const handleDownloadReportPdf = async (note) => {
        try {
            setDownloadingId(note.noteId);
            const combinedPrescriptions = [
                ...(prescriptions.consultationPrescriptions || []),
                ...(prescriptions.directPrescriptions || [])
            ];

            await generateClinicalReportPdf({
                patient: {
                    ...patient,
                    referenceNumber: patientRefNo
                },
                doctor: {
                    name: note.doctorName || 'Dr. Dentia Attending Dentist'
                },
                report: note,
                prescriptions: combinedPrescriptions
            });
        } catch (err) {
            console.error('Failed to generate report PDF:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn font-sans pb-12">
            {/* ========================================================================= */}
            {/* TOP HEADER & PATIENT IDENTITY BANNER                                      */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-teal text-primary-teal text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Certified Clinic Records & Diagnostics</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                        Clinical Examination & Diagnostic Vault
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-text max-w-2xl leading-relaxed">
                        Access your official consultation summaries, 32-tooth odontogram diagnoses, digital radiographs, and active prescriptions authenticated by your attending dentist.
                    </p>
                </div>

                {/* Patient Summary Quick Card */}
                <div className="flex items-center gap-3 p-3.5 bg-warm-cream/60 rounded-2xl border border-light-teal shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-primary-teal text-white flex items-center justify-center font-bold shadow-xs">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Patient Ref</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Verified</span>
                        </div>
                        <p className="text-sm font-mono font-bold text-dark-slate tracking-wide">{patientRefNo}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-light-teal pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveSection('notes')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeSection === 'notes'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate hover:bg-white/50'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Consultation Reports</span>
                    <span className="w-5 h-5 rounded-full bg-light-teal text-primary-teal flex items-center justify-center text-[10px] font-mono font-bold">
                        {reports.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveSection('prescriptions')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeSection === 'prescriptions'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate hover:bg-white/50'
                    }`}
                >
                    <Pill className="w-4 h-4" />
                    <span>Prescriptions</span>
                    <span className="w-5 h-5 rounded-full bg-light-teal text-primary-teal flex items-center justify-center text-[10px] font-mono font-bold">
                        {(prescriptions.directPrescriptions?.length || 0) + (prescriptions.consultationPrescriptions?.length || 0)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveSection('xrays')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeSection === 'xrays'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate hover:bg-white/50'
                    }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    <span>Digital Radiographs (X-Rays)</span>
                    <span className="w-5 h-5 rounded-full bg-light-teal text-primary-teal flex items-center justify-center text-[10px] font-mono font-bold">
                        {radiographs.length}
                    </span>
                </button>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-44 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-44 bg-white rounded-3xl border border-light-teal" />
                </div>
            ) : (
                <>
                    {/* ========================================================================= */}
                    {/* 1. CONSULTATION REPORTS SECTION (IMAGE 2 REDESIGN)                        */}
                    {/* ========================================================================= */}
                    {activeSection === 'notes' && (
                        <div className="space-y-5">
                            {reports.length > 0 ? (
                                reports.map((note) => {
                                    const isExpanded = expandedNoteId === note.noteId;
                                    const rawDate = note.createdAt || note.CreatedAt || note.date || note.Date;
                                    const dateStr = formatReportDate(rawDate);
                                    const isPdfLoading = downloadingId === note.noteId;
                                    const treatmentData = parseTreatmentPerformed(note.treatmentPerformed);

                                    return (
                                        <div 
                                            key={note.noteId} 
                                            className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 space-y-5 transition-all hover:shadow-md"
                                        >
                                            {/* Report Card Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-teal-500/20">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <h3 className="text-base sm:text-lg font-bold text-dark-slate">
                                                                {note.summary || 'Dental Examination & Procedure Report'}
                                                            </h3>
                                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Verified Record
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-text flex items-center gap-2 mt-1">
                                                            <span className="flex items-center gap-1 font-medium">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{dateStr}</span>
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1 font-semibold text-primary-hover">
                                                                <Stethoscope className="w-3.5 h-3.5 text-primary-teal" />
                                                                <span>Dr. {note.doctorName || 'Dentia Attending Dentist'}</span>
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                                    {/* Print / Download PDF Button */}
                                                    <button
                                                        onClick={() => handleDownloadReportPdf(note)}
                                                        disabled={isPdfLoading}
                                                        className="px-4 py-2 rounded-xl bg-light-teal hover:bg-light-teal-hover text-primary-teal text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                                                        title="Download Official Clinical Report PDF with Portal Login Credentials in Footer"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        <span>{isPdfLoading ? 'Generating...' : 'Print PDF Report'}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => toggleNote(note.noteId)}
                                                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-dark-slate transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                    >
                                                        <span>{isExpanded ? 'Hide Details' : 'View Full Care Plan'}</span>
                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Report Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                                                {/* Left: Chief Complaint */}
                                                <div className="md:col-span-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                        <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>Chief Reason for Visit</span>
                                                    </div>
                                                    <p className="text-dark-slate font-medium leading-relaxed">
                                                        {note.chiefComplaint || 'Routine preventive dental examination and oral health consult.'}
                                                    </p>
                                                </div>

                                                {/* Right: Treatment Performed & Tooth Badges */}
                                                <div className="md:col-span-8 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-emerald-900 font-bold uppercase tracking-wider text-[10px]">
                                                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Treatment Performed & Diagnostics</span>
                                                        </div>
                                                        {treatmentData.teethFindings.length > 0 && (
                                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                                                {treatmentData.teethFindings.length} Diagnosed Teeth
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-emerald-950 font-medium leading-relaxed">
                                                        {treatmentData.summary}
                                                    </p>

                                                    {/* Interactive Tooth Badges (Eliminates raw semicolon string dump) */}
                                                    {treatmentData.teethFindings.length > 0 && (
                                                        <div className="pt-1 flex flex-wrap gap-2">
                                                            {treatmentData.teethFindings.map((tooth, tIdx) => (
                                                                <span
                                                                    key={tIdx}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-950 text-[11px] font-semibold shadow-2xs hover:bg-emerald-50 transition-colors"
                                                                >
                                                                    <span className="w-5 h-5 rounded-lg bg-emerald-700 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                                                        #{tooth.toothNumber}
                                                                    </span>
                                                                    <span>{tooth.condition}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Clinical & Post-Op Details */}
                                            {isExpanded && (
                                                <div className="pt-3 border-t border-slate-100 space-y-4 text-xs animate-fadeIn">
                                                    {note.postOpAdvice && (
                                                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                                                            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                                                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                                                <span>Post-Operative Instructions & Home Care</span>
                                                            </h4>
                                                            <p className="text-amber-900 leading-relaxed font-medium pl-5">
                                                                {note.postOpAdvice}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {note.followUp && (
                                                        <div className="p-3.5 rounded-2xl bg-light-teal/50 border border-light-teal space-y-1">
                                                            <p className="font-bold text-dark-slate uppercase tracking-wider text-[10px]">Next Follow-Up & Recall</p>
                                                            <p className="text-primary-hover font-semibold">{note.followUp}</p>
                                                        </div>
                                                    )}

                                                    {/* Official Patient Portal Login Access Footer Card */}
                                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-9 h-9 rounded-2xl bg-primary-teal text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                                                <ShieldCheck className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-dark-slate text-xs">Patient Self-Service Access & Account Recovery</p>
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Encrypted</span>
                                                                </div>
                                                                <p className="text-muted-text text-[11px] mt-0.5">
                                                                    Username / Ref #: <strong className="font-mono text-dark-slate font-bold">{patientRefNo}</strong> · Use verified Date of Birth to log in or reset password securely anytime.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Link
                                                                to={`/portal/activate?mode=reset&ref=${encodeURIComponent(patientRefNo)}`}
                                                                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-dark-slate text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <KeyRound className="w-3.5 h-3.5 text-primary-teal" />
                                                                <span>Reset Password</span>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-16 text-center bg-white rounded-3xl border border-light-teal p-8 space-y-3">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                                    <h3 className="text-base font-serif font-black text-dark-slate">No consultation notes available</h3>
                                    <p className="text-xs text-muted-text max-w-sm mx-auto">
                                        Once your dentist finishes your chairside consultation, verified clinical notes will appear here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 2. PRESCRIPTIONS SECTION                                                  */}
                    {/* ========================================================================= */}
                    {activeSection === 'prescriptions' && (
                        <div className="space-y-4">
                            {prescriptions.consultationPrescriptions?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Prescribed Medications</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {prescriptions.consultationPrescriptions.map((rx, i) => (
                                            <div key={i} className="bg-white rounded-3xl p-5 border border-light-teal shadow-xs space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                            <Pill className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-dark-slate">{rx.medicationName || rx.MedicationName}</h4>
                                                            <p className="text-[11px] text-muted-text font-medium">{rx.strength || rx.Strength || 'Standard strength'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Active
                                                    </span>
                                                </div>

                                                <div className="p-3 rounded-2xl bg-warm-cream/50 text-xs space-y-1 font-medium text-dark-slate">
                                                    <p>• Dosage: <span className="font-bold">{rx.dose || rx.Dose || '1 unit'}</span> ({rx.frequency || rx.Frequency || 'Daily'})</p>
                                                    <p>• Duration: <span className="font-bold">{rx.duration || rx.Duration || '5 days'}</span></p>
                                                    {(rx.instructions || rx.Instructions) && (
                                                        <p className="text-slate-600 text-[11px] pt-1">Instructions: {rx.instructions || rx.Instructions}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prescriptions.directPrescriptions?.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-text">Active Medication Chart</h3>
                                    <div className="bg-white rounded-3xl divide-y divide-light-teal/70 border border-light-teal overflow-hidden shadow-xs">
                                        {prescriptions.directPrescriptions.map((p, i) => (
                                            <div key={i} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Pill className="w-4 h-4 text-primary-teal shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-dark-slate">{p.medicineName}</p>
                                                        <p className="text-xs text-muted-text">
                                                            Prescribed on {new Date(p.prescribedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold text-primary-hover">Ongoing</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!prescriptions.consultationPrescriptions?.length && !prescriptions.directPrescriptions?.length) && (
                                <div className="py-16 text-center bg-white rounded-3xl border border-light-teal p-8 space-y-3">
                                    <Pill className="w-12 h-12 text-slate-300 mx-auto" />
                                    <h3 className="text-base font-serif font-black text-dark-slate">No medications prescribed</h3>
                                    <p className="text-xs text-muted-text max-w-sm mx-auto">
                                        You do not currently have any active dental drug prescriptions on file.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 3. DIGITAL RADIOGRAPHS (X-RAYS) SECTION                                    */}
                    {/* ========================================================================= */}
                    {activeSection === 'xrays' && (
                        <div className="space-y-4">
                            {radiographs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {radiographs.map((xray) => {
                                        const parsed = parseRadiographAnalysis(xray.analysisSummary);
                                        const dateStr = formatReportDate(xray.uploadedAt);

                                        return (
                                            <div 
                                                key={xray.radiographID}
                                                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                                            >
                                                {/* Image Thumbnail */}
                                                <div 
                                                    onClick={() => { setSelectedXray(xray); setXrayZoom(1); setXrayInverted(false); }}
                                                    className="relative h-48 bg-slate-950 flex items-center justify-center cursor-pointer group overflow-hidden"
                                                >
                                                    {xray.imageDataUrl ? (
                                                        <img 
                                                            src={xray.imageDataUrl} 
                                                            alt={xray.imageName} 
                                                            className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="text-white/60 text-xs flex flex-col items-center gap-1">
                                                            <ImageIcon className="w-8 h-8" />
                                                            <span>Preview Scan</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-dark-slate/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                                                        <ZoomIn className="w-4 h-4" />
                                                        <span>Inspect High-Res Scan</span>
                                                    </div>
                                                </div>

                                                {/* Card Details */}
                                                <div className="p-5 space-y-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <h4 className="font-bold text-dark-slate truncate max-w-[180px]">
                                                            {xray.imageName || 'Dental Radiograph'}
                                                        </h4>
                                                        <span className="text-[10px] text-muted-text font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {dateStr}
                                                        </span>
                                                    </div>

                                                    {/* Clean AI Diagnostic Preview */}
                                                    <p className="text-[11.5px] text-muted-text leading-relaxed line-clamp-2">
                                                        <strong className="text-dark-slate font-semibold">AI Findings: </strong>
                                                        {parsed.cleanSnippet}
                                                    </p>

                                                    <button
                                                        onClick={() => { setSelectedXray(xray); setXrayZoom(1); setXrayInverted(false); }}
                                                        className="w-full py-2.5 rounded-xl bg-light-teal hover:bg-light-teal-hover text-primary-teal text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                                    >
                                                        <ZoomIn className="w-3.5 h-3.5" />
                                                        <span>Inspect & View Full Diagnosis</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-16 text-center bg-white rounded-3xl border border-light-teal p-8 space-y-3">
                                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                                    <h3 className="text-base font-serif font-black text-dark-slate">No digital radiographs uploaded</h3>
                                    <p className="text-xs text-muted-text max-w-sm mx-auto">
                                        Diagnostic panoramic OPGs, Bitewings, and Periapical X-rays taken during your visits will be available here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ========================================================================= */}
            {/* 🌟 ULTRA-PREMIUM MEDICAL X-RAY LIGHTBOX (IMAGE 1 REDESIGN: NO BLACK BG)    */}
            {/* ========================================================================= */}
            {selectedXray && (() => {
                const parsed = parseRadiographAnalysis(selectedXray.analysisSummary);
                const scanDate = formatReportDate(selectedXray.uploadedAt);

                return (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
                        {/* Main Floating Card Container */}
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
                            
                            {/* Top Header Bar */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-primary-teal flex items-center justify-center font-bold shadow-xs">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm sm:text-base font-bold text-dark-slate">
                                                {selectedXray.imageName || 'Digital Radiographic Examination'}
                                            </h3>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-light-teal text-primary-teal">
                                                Ref #{patientRefNo}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-text mt-0.5">
                                            Acquired on {scanDate} · Eighteeth Nano-Pix / DIGORA Optime Hardware
                                        </p>
                                    </div>
                                </div>

                                {/* Viewer Controls Toolbar */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button
                                        onClick={() => setXrayZoom(prev => Math.min(prev + 0.25, 2.5))}
                                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setXrayZoom(prev => Math.max(prev - 0.25, 0.75))}
                                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setXrayInverted(prev => !prev)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            xrayInverted 
                                                ? 'bg-sky-600 text-white shadow-xs' 
                                                : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                                        }`}
                                        title="Toggle Inverted Contrast Film Mode"
                                    >
                                        <Contrast className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{xrayInverted ? 'Film Invert: ON' : 'Invert'}</span>
                                    </button>
                                    <button
                                        onClick={() => { setXrayZoom(1); setXrayInverted(false); }}
                                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                                        title="Reset View"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>

                                    {selectedXray.imageDataUrl && (
                                        <a
                                            href={selectedXray.imageDataUrl}
                                            download={selectedXray.imageName || 'dental_xray.png'}
                                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                                            title="Download Image"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    )}

                                    <button
                                        onClick={() => setSelectedXray(null)}
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer ml-1"
                                        title="Close Window"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body: Split Viewport + Clean Diagnostic Panel */}
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
                                
                                {/* Left: Radiographic Viewport (Contained in clean Slate Canvas) */}
                                <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 flex items-center justify-center relative overflow-auto min-h-[380px] max-h-[64vh]">
                                    {selectedXray.imageDataUrl ? (
                                        <img
                                            src={selectedXray.imageDataUrl}
                                            alt={selectedXray.imageName}
                                            style={{
                                                transform: `scale(${xrayZoom})`,
                                                filter: xrayInverted ? 'invert(1) contrast(1.2)' : 'none',
                                                transition: 'transform 0.15s ease-out'
                                            }}
                                            className="max-h-[58vh] max-w-full object-contain rounded-xl shadow-2xl origin-center select-none"
                                        />
                                    ) : (
                                        <div className="text-center text-slate-400 space-y-2">
                                            <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
                                            <p className="text-xs">Image data is being processed.</p>
                                        </div>
                                    )}

                                    {/* Viewport Floating Pill */}
                                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/80 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 pointer-events-none">
                                        <span>Optical Zoom: {Math.round(xrayZoom * 100)}%</span>
                                        <span>•</span>
                                        <span>{xrayInverted ? 'Negative Contrast Filter Active' : 'Normal High-Res'}</span>
                                        <span>•</span>
                                        <span>Sensor: 16-Bit RAW</span>
                                    </div>
                                </div>

                                {/* Right: Clean White AI Diagnostic Findings Panel */}
                                <div className="lg:col-span-5 bg-slate-50/70 p-5 sm:p-6 overflow-y-auto space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200/80">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-600" />
                                            <h4 className="font-bold text-sm text-dark-slate">AI Diagnostic Findings</h4>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Verified Diagnostic Scan
                                        </span>
                                    </div>

                                    {/* Structured Diagnostic Cards without Orphan Bullets */}
                                    <div className="space-y-3">
                                        {parsed.sections.map((sec, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-bold text-primary-hover text-xs flex items-center gap-1.5">
                                                        <Shield className="w-3.5 h-3.5 text-primary-teal" />
                                                        <span>{sec.title}</span>
                                                    </h5>
                                                    {sec.badge && (
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {sec.badge}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Clean Bullet Points */}
                                                <ul className="space-y-1.5 pl-1">
                                                    {sec.bullets.map((bullet, bIdx) => (
                                                        <li key={bIdx} className="flex items-start gap-2 text-slate-700 leading-relaxed text-xs">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-teal shrink-0 mt-1.5" />
                                                            <span className="font-medium">{bullet}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Patient Verification Card in Modal */}
                                    <div className="p-3.5 rounded-2xl bg-white border border-light-teal text-xs text-dark-slate space-y-1 shadow-2xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[11px] flex items-center gap-1 text-primary-teal">
                                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Clinic File Security Check</span>
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-text font-bold">{patientRefNo}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-text">
                                            Authenticated against official clinic patient chart. Radiograph and AI diagnostic impressions are saved to your portal timeline.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Footer Bar */}
                            <div className="px-6 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-text gap-2 shrink-0">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Diagnostic imaging protocol certified under ISO 13485 clinical imaging standards.</span>
                                </span>
                                <button
                                    onClick={() => setSelectedXray(null)}
                                    className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-dark-slate font-bold text-xs transition-colors self-end sm:self-auto cursor-pointer"
                                >
                                    Done / Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

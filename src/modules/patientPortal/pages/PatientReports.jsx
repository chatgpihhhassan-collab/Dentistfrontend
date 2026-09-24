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
    Stethoscope
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

    // Robust cleaner and parser for AI radiograph markdown and JSON dumps
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

        const cleanText = (text) => {
            if (!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '$1') // strip markdown bold syntax
                .replace(/^[-\s*]+/gm, '• ')      // normalize bullets
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        };

        if (overviewMatch && overviewMatch[1].trim()) {
            sections.push({
                title: 'Clinical Radiographic Overview',
                badge: 'Modality & Quality',
                content: cleanText(overviewMatch[1])
            });
        }

        if (toothMatch && toothMatch[1].trim()) {
            sections.push({
                title: 'Tooth-by-Tooth Findings & Pathology',
                badge: 'Anatomy',
                content: cleanText(toothMatch[1])
            });
        }

        if (soapMatch && soapMatch[1].trim()) {
            sections.push({
                title: 'Comprehensive SOAP Impression & Care Plan',
                badge: 'Clinical SOAP',
                content: cleanText(soapMatch[1])
            });
        }

        if (sections.length === 0) {
            sections.push({
                title: 'Diagnostic Radiographic Impression',
                badge: 'AI Diagnostic',
                content: cleanText(cleaned)
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
        <div className="space-y-6 animate-fadeIn font-sans">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">
                        Clinical Records & Diagnostics
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-text mt-0.5">
                        Review your doctor consultation summaries, active medication chart, and digital radiographic scans.
                    </p>
                </div>

                {/* Patient Portal Access Quick-Badge */}
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-light-teal shadow-xs text-xs self-start sm:self-auto">
                    <div className="w-8 h-8 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center font-bold">
                        <Hash className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Patient Reference #</p>
                        <p className="text-xs font-mono font-bold text-dark-slate">{patientRefNo}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-light-teal pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveSection('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeSection === 'notes'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeSection === 'prescriptions'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeSection === 'xrays'
                            ? 'bg-white text-primary-teal shadow-xs border border-light-teal'
                            : 'text-muted-text hover:text-dark-slate'
                    }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    <span>Digital X-Rays</span>
                    <span className="w-5 h-5 rounded-full bg-light-teal text-primary-teal flex items-center justify-center text-[10px] font-mono font-bold">
                        {radiographs.length}
                    </span>
                </button>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-36 bg-white rounded-3xl border border-light-teal" />
                    <div className="h-36 bg-white rounded-3xl border border-light-teal" />
                </div>
            ) : (
                <>
                    {/* ========================================================================= */}
                    {/* 1. CONSULTATION REPORTS SECTION                                           */}
                    {/* ========================================================================= */}
                    {activeSection === 'notes' && (
                        <div className="space-y-4">
                            {reports.length > 0 ? (
                                reports.map((note) => {
                                    const isExpanded = expandedNoteId === note.noteId;
                                    const rawDate = note.createdAt || note.CreatedAt || note.date || note.Date;
                                    const dateStr = formatReportDate(rawDate);
                                    const isPdfLoading = downloadingId === note.noteId;

                                    return (
                                        <div 
                                            key={note.noteId} 
                                            className="bg-white rounded-3xl p-6 shadow-xs border border-light-teal space-y-4 transition-all hover:shadow-md"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-light-teal/70 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center font-bold shrink-0">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-dark-slate">
                                                            {note.summary || 'Dental Examination & Procedure Report'}
                                                        </h3>
                                                        <p className="text-xs text-muted-text flex items-center gap-2 mt-0.5">
                                                            <span>{dateStr}</span>
                                                            <span>•</span>
                                                            <span className="font-semibold text-primary-hover">Dr. {note.doctorName || 'Dentia Attending Dentist'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-center">
                                                    {/* Download PDF Button */}
                                                    <button
                                                        onClick={() => handleDownloadReportPdf(note)}
                                                        disabled={isPdfLoading}
                                                        className="px-3 py-1.5 rounded-xl bg-light-teal hover:bg-light-teal-hover text-primary-teal text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        title="Download Official Clinical Report PDF with Portal Login Credentials in Footer"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        <span>{isPdfLoading ? 'Generating...' : 'Print PDF Report'}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => toggleNote(note.noteId)}
                                                        className="px-3 py-1.5 rounded-xl border border-light-teal hover:bg-light-teal/50 text-xs font-bold text-dark-slate transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <span>{isExpanded ? 'Hide Details' : 'View Full Care Plan'}</span>
                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Summary Snapshot */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                <div className="p-3.5 rounded-2xl bg-warm-cream/50 space-y-1">
                                                    <p className="font-bold text-dark-slate uppercase tracking-wider text-[10px]">Chief Reason for Visit</p>
                                                    <p className="text-muted-text font-medium">{note.chiefComplaint || 'Routine preventive dental examination'}</p>
                                                </div>
                                                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                                                    <p className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Treatment Performed</p>
                                                    <p className="text-emerald-800 font-medium">{note.treatmentPerformed || 'Prophylaxis and clinical assessment completed'}</p>
                                                </div>
                                            </div>

                                            {/* Expanded Clinical & Post-Op Details */}
                                            {isExpanded && (
                                                <div className="pt-2 border-t border-light-teal/70 space-y-4 text-xs animate-fadeIn">
                                                    {note.postOpAdvice && (
                                                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                                                            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                                                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                <span>Post-Operative Instructions & Home Care</span>
                                                            </h4>
                                                            <p className="text-amber-800 leading-relaxed pl-5 font-medium">
                                                                {note.postOpAdvice}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {note.followUp && (
                                                        <div className="p-3.5 rounded-2xl bg-light-teal/40 space-y-1">
                                                            <p className="font-bold text-dark-slate uppercase tracking-wider text-[10px]">Next Follow-Up & Recall</p>
                                                            <p className="text-primary-hover font-semibold">{note.followUp}</p>
                                                        </div>
                                                    )}

                                                    {/* Official Patient Portal Login Access Footer Card */}
                                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-primary-teal text-white flex items-center justify-center shrink-0 mt-0.5">
                                                                <ShieldCheck className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-dark-slate text-xs flex items-center gap-2">
                                                                    <span>Patient Portal Login & Account Recovery</span>
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Active</span>
                                                                </p>
                                                                <p className="text-muted-text text-[11px] mt-0.5">
                                                                    Username / Ref: <strong className="font-mono text-dark-slate">{patientRefNo}</strong> · Use verified Date of Birth to log in or reset password anytime.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                to={`/portal/activate?mode=reset&ref=${encodeURIComponent(patientRefNo)}`}
                                                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-dark-slate text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1.5"
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
                            {/* Consultation Note Prescriptions */}
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

                            {/* Direct Prescriptions */}
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
                                                className="bg-white rounded-3xl overflow-hidden border border-light-teal shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
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
                                                        <span>Click to Inspect Scan</span>
                                                    </div>
                                                </div>

                                                {/* Card Details */}
                                                <div className="p-4 space-y-2.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <h4 className="font-bold text-dark-slate truncate max-w-[180px]">
                                                            {xray.imageName || 'Dental Radiograph'}
                                                        </h4>
                                                        <span className="text-[10px] text-muted-text font-mono">
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
                                                        className="w-full py-2 rounded-xl bg-light-teal hover:bg-light-teal-hover text-primary-teal text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
            {/* ENHANCED MEDICAL X-RAY LIGHTBOX & DIAGNOSTIC MODAL                        */}
            {/* ========================================================================= */}
            {selectedXray && (() => {
                const parsed = parseRadiographAnalysis(selectedXray.analysisSummary);
                const scanDate = formatReportDate(selectedXray.uploadedAt);

                return (
                    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
                        {/* Top Control Bar */}
                        <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                                    <ImageIcon className="w-5 h-5 text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                        <span>{selectedXray.imageName || 'Digital Dental Radiograph'}</span>
                                        <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-white/10 text-sky-300">
                                            Ref #{patientRefNo}
                                        </span>
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Acquired on {scanDate} · Eighteeth Nano-Pix / DIGORA Optime Scanner
                                    </p>
                                </div>
                            </div>

                            {/* Viewer Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setXrayZoom(prev => Math.min(prev + 0.25, 2.5))}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setXrayZoom(prev => Math.max(prev - 0.25, 0.75))}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setXrayInverted(prev => !prev)}
                                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                        xrayInverted ? 'bg-sky-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                                    title="Invert Contrast (Negative / X-Ray Film Mode)"
                                >
                                    <Contrast className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setXrayZoom(1); setXrayInverted(false); }}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                    title="Reset View"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                {selectedXray.imageDataUrl && (
                                    <a
                                        href={selectedXray.imageDataUrl}
                                        download={selectedXray.imageName || 'dental_xray.png'}
                                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                        title="Download Image"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}

                                <button
                                    onClick={() => setSelectedXray(null)}
                                    className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-2"
                                    title="Close View"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Main Modal Body: Split Image + Clinical Breakdown */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-hidden min-h-0">
                            {/* Left/Center: Radiology Image Viewport */}
                            <div className="lg:col-span-7 bg-slate-950/80 rounded-3xl border border-white/10 p-4 flex items-center justify-center overflow-auto relative">
                                {selectedXray.imageDataUrl ? (
                                    <img
                                        src={selectedXray.imageDataUrl}
                                        alt={selectedXray.imageName}
                                        style={{
                                            transform: `scale(${xrayZoom})`,
                                            filter: xrayInverted ? 'invert(1) contrast(1.2)' : 'none',
                                            transition: 'transform 0.15s ease-out'
                                        }}
                                        className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-2xl origin-center select-none"
                                    />
                                ) : (
                                    <p className="text-slate-400 text-xs">Image data unavailable.</p>
                                )}

                                {xrayInverted && (
                                    <span className="absolute top-4 left-4 px-2 py-1 rounded-md bg-sky-500/80 text-white text-[10px] font-bold">
                                        Negative Contrast Active
                                    </span>
                                )}
                            </div>

                            {/* Right: Structured Clinical Diagnostics Panel */}
                            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-5 overflow-y-auto space-y-4 text-xs text-white">
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        <h4 className="font-bold text-sm text-white">AI Diagnostic Assessment</h4>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Verified
                                    </span>
                                </div>

                                {/* Structured Findings Cards */}
                                <div className="space-y-3">
                                    {parsed.sections.map((sec, idx) => (
                                        <div 
                                            key={idx} 
                                            className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-bold text-sky-300 text-xs">
                                                    {sec.title}
                                                </h5>
                                                {sec.badge && (
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {sec.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11.5px] text-slate-300 leading-relaxed whitespace-pre-line font-medium pl-1">
                                                {sec.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Patient Portal Credentials Footer in Modal */}
                                <div className="pt-3 border-t border-white/10">
                                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300 space-y-1">
                                        <p className="font-bold text-white flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-light-teal" />
                                            <span>Patient Self-Service Access</span>
                                        </p>
                                        <p className="text-slate-400 text-[10.5px]">
                                            Patient Reference: <strong className="text-white font-mono">{patientRefNo}</strong> · Log in at <code className="text-sky-300">dentistfrontend.vercel.app/portal/login</code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Metadata Ribbon */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-3 gap-2">
                            <span>Diagnostic imaging certified under ISO 13485 clinical imaging protocol.</span>
                            <div className="flex items-center gap-3">
                                <span>Zoom: {Math.round(xrayZoom * 100)}%</span>
                                <span>•</span>
                                <span>Negative Contrast: {xrayInverted ? 'On' : 'Off'}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

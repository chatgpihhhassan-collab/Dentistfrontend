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
    Sparkles, 
    Clock, 
    ChevronDown, 
    ChevronUp 
} from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';

export default function PatientReports() {
    const [activeSection, setActiveSection] = useState('notes'); // 'notes' | 'prescriptions' | 'xrays'
    const [reports, setReports] = useState([]);
    const [prescriptions, setPrescriptions] = useState({ directPrescriptions: [], consultationPrescriptions: [] });
    const [radiographs, setRadiographs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedXray, setSelectedXray] = useState(null);
    const [expandedNoteId, setExpandedNoteId] = useState(null);

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');

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

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate">
                    Clinical Records & Diagnostics
                </h2>
                <p className="text-xs sm:text-sm text-muted-text">
                    Review your doctor consultation summaries, active medication chart, and digital radiographic scans.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-light-teal pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveSection('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
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
                    {/* 1. CONSULTATION REPORTS SECTION */}
                    {activeSection === 'notes' && (
                        <div className="space-y-4">
                            {reports.length > 0 ? (
                                reports.map((note) => {
                                    const isExpanded = expandedNoteId === note.noteId;
                                    const dateStr = new Date(note.createdAt).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });

                                    return (
                                        <div 
                                            key={note.noteId} 
                                            className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal space-y-4 transition-all hover:shadow-md"
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
                                                        <p className="text-xs text-muted-text flex items-center gap-2">
                                                            <span>{dateStr}</span>
                                                            <span>•</span>
                                                            <span className="font-semibold text-primary-hover">Dr. {note.doctorName || 'Dentia Attending Dentist'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleNote(note.noteId)}
                                                    className="px-3 py-1.5 rounded-xl border border-light-teal hover:bg-light-teal/50 text-xs font-bold text-dark-slate transition-colors flex items-center gap-1.5 self-start sm:self-center"
                                                >
                                                    <span>{isExpanded ? 'Hide Details' : 'View Full Care Plan'}</span>
                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
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

                    {/* 2. PRESCRIPTIONS SECTION */}
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

                    {/* 3. DIGITAL RADIOGRAPHS (X-RAYS) SECTION */}
                    {activeSection === 'xrays' && (
                        <div className="space-y-4">
                            {radiographs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {radiographs.map((xray) => (
                                        <div 
                                            key={xray.radiographID}
                                            className="bg-white rounded-3xl overflow-hidden border border-light-teal shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                                        >
                                            {/* Image Thumbnail */}
                                            <div 
                                                onClick={() => setSelectedXray(xray)}
                                                className="relative h-48 bg-black flex items-center justify-center cursor-pointer group overflow-hidden"
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
                                                    <span>Click to Inspect</span>
                                                </div>
                                            </div>

                                            {/* Card Details */}
                                            <div className="p-4 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <h4 className="font-bold text-dark-slate truncate max-w-[180px]">{xray.imageName || 'Dental Radiograph'}</h4>
                                                    <span className="text-[10px] text-muted-text font-mono">
                                                        {new Date(xray.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                {xray.analysisSummary && (
                                                    <p className="text-[11px] text-muted-text line-clamp-2 leading-relaxed">
                                                        <span className="font-bold text-dark-slate">AI Diagnostic: </span>
                                                        {xray.analysisSummary}
                                                    </p>
                                                )}

                                                <button
                                                    onClick={() => setSelectedXray(xray)}
                                                    className="w-full py-2 rounded-xl bg-light-teal hover:bg-light-teal-hover text-primary-teal text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <ZoomIn className="w-3.5 h-3.5" />
                                                    <span>View High-Res Scan</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
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

            {/* X-RAY LIGHTBOX MODAL */}
            {selectedXray && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <div className="absolute top-4 right-4 z-50">
                        <button
                            onClick={() => setSelectedXray(null)}
                            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center space-y-4">
                        <div className="max-h-[70vh] w-full flex items-center justify-center overflow-auto">
                            {selectedXray.imageDataUrl ? (
                                <img
                                    src={selectedXray.imageDataUrl}
                                    alt={selectedXray.imageName}
                                    className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
                                />
                            ) : (
                                <p className="text-white text-sm">Image data unavailable.</p>
                            )}
                        </div>

                        {/* Scan telemetry banner */}
                        <div className="w-full bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-white text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold">
                                <span>{selectedXray.imageName}</span>
                                <span className="text-sky-300 font-mono">
                                    {new Date(selectedXray.uploadedAt).toLocaleDateString()}
                                </span>
                            </div>
                            {selectedXray.analysisSummary && (
                                <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
                                    <span className="text-white font-semibold">Diagnostic Findings: </span>
                                    {selectedXray.analysisSummary}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  User, 
  Shield, 
  Stethoscope, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FileText, 
  Pill, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import Navigation from '../../../components/Navigation';

const AIDentalNoteDetailPage = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const calculateAge = (dobString) => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff); 
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    useEffect(() => {
        const fetchNoteAndDoctor = async () => {
            try {
                // Fetch the note details
                const resNote = await fetch(`/api/ai-dental-notes/${noteId}`);
                if (!resNote.ok) throw new Error("Failed to load note.");
                const noteData = await resNote.json();
                
                // Clean lists if they come back null
                noteData.prescriptions = noteData.prescriptions || [];
                noteData.treatmentPlans = noteData.treatmentPlans || [];
                noteData.aiWarnings = noteData.aiWarnings || [];
                
                setNote(noteData);

                // Fetch the doctor details using Note's DentistId
                const dentistId = noteData.dentistId || noteData.DentistId;
                if (dentistId) {
                    const resDoc = await fetch(`/api/auth/doctors/${dentistId}`);
                    if (resDoc.ok) {
                        const docData = await resDoc.json();
                        setDoctor(docData);
                    }
                }

                // Fetch the patient details using Note's PatientId
                const patId = noteData.patientId || noteData.PatientId;
                if (patId) {
                    const resPat = await fetch(`/api/patients/${patId}`);
                    if (resPat.ok) {
                        const patData = await resPat.json();
                        setPatient(patData);
                    }
                }
            } catch (err) {
                console.error("Error loading note/doctor details:", err);
                alert("Failed to load clinical details.");
            } finally {
                setLoading(false);
            }
        };

        fetchNoteAndDoctor();
    }, [noteId]);

    const handleFieldChange = (field, value) => {
        setNote(prev => ({ ...prev, [field]: value }));
    };

    const handlePrescriptionChange = (index, field, value) => {
        setNote(prev => {
            const updated = [...prev.prescriptions];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, prescriptions: updated };
        });
    };

    const addPrescription = () => {
        setNote(prev => ({
            ...prev,
            prescriptions: [
                ...prev.prescriptions,
                { medicationName: '', strength: '', dose: '', route: '', frequency: '', duration: '', instructions: '', confidence: 1.0 }
            ]
        }));
    };

    const removePrescription = (index) => {
        setNote(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage('');
        try {
            // Save edits
            const res = await fetch(`/api/ai-dental-notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note)
            });
            if (!res.ok) throw new Error("Failed to save changes.");
            
            // Also approve note
            const approveRes = await fetch(`/api/ai-dental-notes/${noteId}/approve`, {
                method: 'POST'
            });
            if (!approveRes.ok) throw new Error("Failed to approve note.");

            setSuccessMessage("Clinical note saved and approved in record successfully!");
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            console.error("Save/Approve error:", err);
            alert("Failed to save clinical note changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col font-sans">
                <Navigation />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600 font-bold">Loading clinical records...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col font-sans">
                <Navigation />
                <div className="flex-grow flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <p className="text-slate-800 font-bold text-lg mb-2">Record Not Found</p>
                        <p className="text-slate-500 text-sm">The requested AI dental note does not exist or has been removed.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 flex flex-col font-sans overflow-y-auto relative pb-12">
            <Navigation />

            {/* Content Container */}
            <div className="max-w-7xl mx-auto w-full px-8 py-6 space-y-6">
                
                {/* Back button and page title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full shadow-sm transition-all"
                            title="Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-2xs font-extrabold uppercase rounded border border-teal-200">AI Scribe</span>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Clinical AI Note Detail</h1>
                            </div>
                            <p className="text-slate-500 text-xs font-semibold mt-0.5">
                                Note ID: #{noteId} &bull; Generated on {new Date(note.createdAt || note.CreatedAt).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-full shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? "Saving..." : "Save & Approve Note"}
                        </button>
                    </div>
                </div>

                {/* Success Alert Banner */}
                {successMessage && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-emerald-800">{successMessage}</span>
                    </div>
                )}

                {/* Patient Profile Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
                        <div className="bg-teal-50 p-3 rounded-xl text-teal-600">
                            <User size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</h3>
                            {patient ? (
                                <>
                                    <p className="text-slate-800 font-extrabold text-base">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-slate-500 text-xs font-semibold">
                                        DOB: {formatDate(patient.dob)} &bull; Age: {calculateAge(patient.dob)} years
                                    </p>
                                </>
                            ) : (
                                <p className="text-slate-800 font-extrabold text-base">Patient ID: #{note.patientId || note.PatientId}</p>
                            )}
                            <span className="inline-block text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Verified Profile</span>
                        </div>
                    </div>

                    {/* Doctor Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                            <Stethoscope size={24} />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor Details</h3>
                            {doctor ? (
                                <>
                                    <p className="text-slate-800 font-extrabold text-base">Dr. {doctor.firstName} {doctor.lastName}</p>
                                    <p className="text-slate-500 text-xs font-semibold">Region: {doctor.region} &bull; Practice Username: {doctor.username}</p>
                                </>
                            ) : (
                                <p className="text-slate-500 text-xs font-semibold">Doctor ID: #{note.dentistId || note.DentistId}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scribing Documentation Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                            <FileText className="text-teal-600" size={20} />
                            <h2 className="text-base font-bold text-slate-800">Clinical Documentation</h2>
                        </div>
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider">
                            Interactive Scribe Draft
                        </span>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Summary / Consultation Final Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Consultation Summary / Final Notes</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[100px] transition-all font-sans"
                                value={note.summary || ''} 
                                onChange={(e) => handleFieldChange('summary', e.target.value)}
                            />
                        </div>

                        {/* Chief Complaint & History Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chief Complaint</label>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[80px]"
                                    value={note.chiefComplaint || ''} 
                                    onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">History of Present Illness</label>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[80px]"
                                    value={note.history || ''} 
                                    onChange={(e) => handleFieldChange('history', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Exam Findings & Assessment (Diagnosis) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Clinical Examination Findings</label>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[100px]"
                                    value={note.examination || ''} 
                                    onChange={(e) => handleFieldChange('examination', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Clinical Assessment / Diagnosis</label>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[100px]"
                                    value={note.assessment || ''} 
                                    onChange={(e) => handleFieldChange('assessment', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Treatment Rendered & Follow Up */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Treatment Rendered Today</label>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[80px]"
                                    value={note.treatmentPerformed || ''} 
                                    onChange={(e) => handleFieldChange('treatmentPerformed', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Follow-Up Plan</label>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[80px]"
                                    value={note.followUp || ''} 
                                    onChange={(e) => handleFieldChange('followUp', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Post-Op Advice */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Post-Operative Instructions / Supportive Care</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 min-h-[80px]"
                                value={note.postOpAdvice || ''} 
                                onChange={(e) => handleFieldChange('postOpAdvice', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Prescriptions and supportive medications */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                            <Pill className="text-teal-600" size={20} />
                            <h2 className="text-base font-bold text-slate-800">Supportive Medications & Prescriptions</h2>
                        </div>
                        <button 
                            onClick={addPrescription}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 border border-teal-200/50"
                        >
                            <Plus size={14} /> Add Medication
                        </button>
                    </div>

                    <div className="p-6">
                        {note.prescriptions.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic text-sm">
                                No medications prescribed during this consultation.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {note.prescriptions.map((pres, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 relative group transition-all hover:bg-slate-50">
                                        <button 
                                            onClick={() => removePrescription(idx)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors p-1"
                                            title="Delete Medication"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Medication Name</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.medicationName || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'medicationName', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Strength</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.strength || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'strength', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dose</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.dose || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Frequency</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.frequency || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Route</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.route || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'route', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duration</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.duration || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'duration', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Instructions</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-teal-500"
                                                    value={pres.instructions || ''}
                                                    onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIDentalNoteDetailPage;

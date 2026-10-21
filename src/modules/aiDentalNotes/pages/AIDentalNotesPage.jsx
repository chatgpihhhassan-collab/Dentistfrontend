import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Activity, 
  User, 
  Mic, 
  MicOff, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  FileText,
  FileCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { submitTranscript, updateNote, approveNote } from '../services/aiDentalNotesApi';

const AIDentalNotesPage = () => {
    const [patient, setPatient] = useState(null);
    const [dentist, setDentist] = useState({ id: 2, firstName: 'Bishan', lastName: 'Hussain' });
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [dentalNote, setDentalNote] = useState(null);
    const [noteId, setNoteId] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [checklistStatus, setChecklistStatus] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    
    // Voice Booking States
    const [bookingMode, setBookingMode] = useState(false);
    const [bookingResponse, setBookingResponse] = useState(null);
    const [bookingText, setBookingText] = useState('');

    const recognitionRef = useRef(null);

    // Load active patient from Query Params or default to 5
    useEffect(() => {
        const fetchPatient = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const patientId = searchParams.get('patientId') || '5';
            try {
                const res = await axios.get(`/api/patients/${patientId}`);
                setPatient(res.data);
            } catch (err) {
                console.error("Failed to load patient details:", err);
                // Fallback details
                setPatient({
                    patientID: 5,
                    firstName: 'Sara',
                    lastName: 'Hussain',
                    dob: '1985-05-12T00:00:00',
                    phone: '021-1234567'
                });
            }
        };
        fetchPatient();
    }, []);

    // Load dentist from local storage if available
    useEffect(() => {
        try {
            const stored = localStorage.getItem('doctor');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.doctorID) {
                    setDentist({
                        id: parsed.doctorID,
                        firstName: parsed.firstName || 'Bishan',
                        lastName: parsed.lastName || 'Hussain'
                    });
                }
            }
        } catch (e) {
            console.error("Error parsing logged doctor:", e);
        }
    }, []);

    // Personalised Spoken Greeting on page load/patient load
    useEffect(() => {
        if (patient && dentist && !isAudioMuted) {
            const speakGreeting = () => {
                window.speechSynthesis.cancel();
                const text = `Hello Dr. ${dentist.lastName}. I am ready to transcribe your consultation for ${patient.firstName}. Press the microphone to begin.`;
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
            };
            // Delay slightly to bypass browser interaction block
            const timer = setTimeout(speakGreeting, 1200);
            return () => clearTimeout(timer);
        }
    }, [patient, dentist]);

    // Setup Web Speech API for transcription
    const startSpeechRecognition = () => {
        window.speechSynthesis.cancel();
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Web Speech API is not supported in this browser. Please use Chrome.");
            return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + ' ' + finalTranscript);
            }
        };

        rec.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
        };

        rec.onend = () => {
            if (isRecording) {
                rec.start(); // Keep running until explicitly stopped
            }
        };

        recognitionRef.current = rec;
        rec.start();
        setIsRecording(true);
    };

    const stopSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    };

    // Calculate Age
    const getAge = (dobString) => {
        if (!dobString) return '';
        const birth = new Date(dobString);
        const diff = Date.now() - birth.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Format DOB string
    const formatDOB = (dobString) => {
        if (!dobString) return '';
        const d = new Date(dobString);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleMicClick = () => {
        if (isRecording) {
            stopSpeechRecognition();
        } else {
            startSpeechRecognition();
        }
    };

    const handleProcessNotes = async () => {
        if (!transcript.trim()) {
            alert("Please speak or write some transcript before processing.");
            return;
        }
        stopSpeechRecognition();
        setIsProcessing(true);

        try {
            const res = await submitTranscript(transcript, patient.patientID, dentist.id);
            setNoteId(res.noteId || res.NoteId);
            setSessionId(res.sessionId || res.SessionId);
            
            // Map keys appropriately depending on backend letter casing
            const noteObj = res.note || res.Note || res.draftNote || res.DraftNote;
            setDentalNote(noteObj);

            const status = res.status || res.Status;
            const missing = res.missingFields || res.MissingFields || [];
            const prompt = res.doctorPrompt || res.DoctorPrompt || "";

            setChecklistStatus({
                status,
                missingFields: missing,
                prompt
            });

            // Speak gap prompt aloud
            if (status === 'incomplete' && prompt && !isAudioMuted) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(prompt);
                window.speechSynthesis.speak(utterance);
            }

            // If complete, check if the follow-up planning prompt needs voice activation
            if (status === 'complete' && !isAudioMuted) {
                window.speechSynthesis.cancel();
                const text = `Clinical note is complete. Would you like to schedule a follow up appointment for ${patient.firstName}?`;
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
                setBookingMode(true);
            }

        } catch (err) {
            console.error("Failed processing notes:", err);
            alert("Error processing clinical notes. Make sure the backend is active.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!bookingText.trim()) return;
        setIsProcessing(true);
        try {
            const res = await axios.post('/api/appointments/book-voice', {
                patientId: patient.patientID,
                doctorId: dentist.id,
                voiceDateText: bookingText
            });
            setBookingResponse(res.data);
            setBookingMode(false);

            if (!isAudioMuted) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(res.data.message);
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            console.error("Voice booking failed:", err);
            const errMsg = err.response?.data?.message || "Failed to book appointment. Please try another slot.";
            alert(errMsg);
            if (!isAudioMuted) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(errMsg);
                window.speechSynthesis.speak(utterance);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveAndApprove = async () => {
        if (!noteId) return;
        try {
            // 1. Save edits to DB
            await updateNote(noteId, dentalNote);
            // 2. Approve
            await approveNote(noteId);
            
            alert("Clinical note saved and approved in DB successfully!");
            // Reset page
            setDentalNote(null);
            setTranscript('');
            setChecklistStatus(null);
            setBookingResponse(null);
            setBookingMode(false);
            setBookingText('');
        } catch (err) {
            console.error("Approve failed:", err);
            alert("Failed to save and approve note.");
        }
    };

    const handleEditField = (field, value) => {
        setDentalNote(prev => ({ ...prev, [field]: value }));
    };

    const checklistItems = [
        { key: 'Patient Name', label: 'Patient Name' },
        { key: 'Chief Complaint', label: 'Chief Complaint' },
        { key: 'Objective Exam', label: 'Objective Exam' },
        { key: 'Radiographic Findings', label: 'Radiographic Findings' },
        { key: 'Clinical Assessment', label: 'Clinical Assessment' },
        { key: 'Treatment Rendered Today', label: 'Treatment Rendered Today' },
        { key: 'Prescriptions/Medications', label: 'Prescriptions / Medications' },
        { key: 'Follow-up Plan', label: 'Follow-up Plan' }
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Visual background accents */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                
                {/* Header Section */}
                <header className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
                            <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                Ambient Clinical Scribe
                            </h1>
                            <p className="text-slate-400 text-sm">Interactive voice DentalGPT scribing system</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        {patient && (
                            <div className="flex items-center gap-3 bg-slate-700/40 px-4 py-2.5 rounded-xl border border-slate-600/50">
                                <User className="text-teal-400 w-5 h-5" />
                                <div className="text-left text-xs">
                                    <p className="font-semibold text-slate-200">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-slate-400">Age: {getAge(patient.dob)} | DOB: {formatDOB(patient.dob)}</p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsAudioMuted(!isAudioMuted)} 
                            className={`p-2.5 rounded-xl border transition-all ${isAudioMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-700/40 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'}`}
                            title={isAudioMuted ? "Unmute AI Speech" : "Mute AI Speech"}
                        >
                            {isAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </div>
                </header>

                {/* Scribing Core Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Recording Controls and Gap Checklist */}
                    <div className="space-y-8 lg:col-span-1">
                        
                        {/* Recording Panel */}
                        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Mic className="text-teal-400" />
                                Dictate Consultation
                            </h3>
                            
                            <div className="flex flex-col items-center py-6 justify-center bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden min-h-[160px]">
                                {isRecording && (
                                    <div className="flex items-center gap-1.5 mb-6 justify-center">
                                        <span className="w-1.5 h-6 bg-teal-400 rounded-full animate-bounce delay-100" />
                                        <span className="w-1.5 h-10 bg-teal-300 rounded-full animate-bounce delay-200" />
                                        <span className="w-1.5 h-8 bg-cyan-400 rounded-full animate-bounce delay-300" />
                                        <span className="w-1.5 h-12 bg-teal-400 rounded-full animate-bounce delay-400" />
                                        <span className="w-1.5 h-6 bg-cyan-300 rounded-full animate-bounce delay-500" />
                                    </div>
                                )}

                                <button
                                    onClick={handleMicClick}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/20' : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105'}`}
                                >
                                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                                </button>
                                <p className="text-xs text-slate-400 mt-4">
                                    {isRecording ? "Listening active... Click to pause" : "Click to activate mic"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Live Transcript</label>
                                <textarea
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    placeholder="Consultation transcript will appear here. You can also edit this text manually..."
                                    className="w-full h-32 p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-sans"
                                />
                            </div>

                            <button
                                onClick={handleProcessNotes}
                                disabled={isProcessing || !transcript.trim()}
                                className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/10 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                        Analyzing Scribing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Process Consultation
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Gap Detection Checklist Panel */}
                        {checklistStatus && (
                            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-md font-bold text-white flex items-center gap-2">
                                        <FileCheck className="text-teal-400" />
                                        Clinical Scribe Checklist
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider ${checklistStatus.status === 'complete' ? 'bg-teal-500/20 text-teal-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                        {checklistStatus.status}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {checklistItems.map((item) => {
                                        const isMissing = checklistStatus.missingFields.some(
                                            m => m.toLowerCase().replace(/[^a-z]/g, '') === item.key.toLowerCase().replace(/[^a-z]/g, '')
                                        );
                                        return (
                                            <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-800/50">
                                                <span className="text-xs text-slate-300">{item.label}</span>
                                                {isMissing ? (
                                                    <span className="flex items-center gap-1 text-2xs font-medium text-amber-400">
                                                        <AlertCircle size={12} />
                                                        Missing
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-2xs font-medium text-teal-400">
                                                        <CheckCircle2 size={12} />
                                                        Detected
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {checklistStatus.status === 'incomplete' && (
                                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-2">
                                        <p className="text-2xs text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                                            <Volume2 size={12} />
                                            AI Voice Feedback
                                        </p>
                                        <p className="text-xs italic text-slate-300">"{checklistStatus.prompt}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Note Editor and Booking Loop */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Voice Booking Overlay Dialog */}
                        {bookingMode && (
                            <div className="bg-gradient-to-br from-teal-950/60 to-slate-900/60 border border-teal-500/30 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-teal-400 w-6 h-6" />
                                    <div>
                                        <h4 className="text-md font-bold text-white">AI Voice Booking Assistant</h4>
                                        <p className="text-xs text-slate-400">Tell the scribe what date and time to allocate for follow-up.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={bookingText}
                                        onChange={(e) => setBookingText(e.target.value)}
                                        placeholder='e.g., "Next Tuesday at 3 PM" or "25 August 11 AM"' 
                                        className="flex-1 px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-slate-100"
                                    />
                                    <button 
                                        onClick={handleConfirmBooking}
                                        className="px-5 py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-teal-400 transition-colors"
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Booking Success Output Card */}
                        {bookingResponse && (
                            <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-teal-400 w-6 h-6 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Follow-up Slot Booked</p>
                                        <p className="text-xs text-slate-300 mt-0.5">{bookingResponse.message}</p>
                                    </div>
                                </div>
                                <div className="text-right text-2xs text-slate-400">
                                    <p className="font-mono">ID: #{bookingResponse.appointmentId}</p>
                                    <p className="mt-1">{new Date(bookingResponse.preferredDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}

                        {/* Editor Draft Panel */}
                        {dentalNote ? (
                            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                                <div className="bg-gradient-to-r from-teal-900/80 to-cyan-950/80 px-6 py-4 flex justify-between items-center border-b border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <FileText className="text-teal-400" />
                                        <h2 className="text-lg font-bold text-white">AI Dental Clinical Record</h2>
                                    </div>
                                    <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
                                        Draft Review
                                    </span>
                                </div>

                                <div className="p-6 space-y-6">
                                    
                                    {/* Warnings list */}
                                    {dentalNote.aiWarnings && dentalNote.aiWarnings.length > 0 && (
                                        <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl space-y-1">
                                            <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                                <AlertCircle size={14} />
                                                Engine Warnings
                                            </p>
                                            <ul className="list-disc pl-4 text-xs text-slate-300 space-y-0.5">
                                                {dentalNote.aiWarnings.map((w, idx) => (
                                                    <li key={idx}><span className="font-semibold text-slate-200">{w.fieldName}:</span> {w.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Editable Notes Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Clinical Summary</label>
                                                <textarea 
                                                    value={dentalNote.summary || ''} 
                                                    onChange={(e) => handleEditField('summary', e.target.value)}
                                                    className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-28"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Chief Complaint</label>
                                                <textarea 
                                                    value={dentalNote.chiefComplaint || ''} 
                                                    onChange={(e) => handleEditField('chiefComplaint', e.target.value)}
                                                    className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">History</label>
                                                <textarea 
                                                    value={dentalNote.history || ''} 
                                                    onChange={(e) => handleEditField('history', e.target.value)}
                                                    className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Examination & Finding</label>
                                                <textarea 
                                                    value={dentalNote.examination || ''} 
                                                    onChange={(e) => handleEditField('examination', e.target.value)}
                                                    className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-28"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Clinical Diagnosis</label>
                                                <textarea 
                                                    value={dentalNote.assessment || ''} 
                                                    onChange={(e) => handleEditField('assessment', e.target.value)}
                                                    className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Treatment Performed</label>
                                                <textarea 
                                                    value={dentalNote.treatmentPerformed || ''} 
                                                    onChange={(e) => handleEditField('treatmentPerformed', e.target.value)}
                                                    className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supportive Advice & Follow-Up */}
                                    <div className="border-t border-slate-700/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Post-Op Advice</label>
                                            <textarea 
                                                value={dentalNote.postOpAdvice || ''} 
                                                onChange={(e) => handleEditField('postOpAdvice', e.target.value)}
                                                className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Follow-Up Plan</label>
                                            <textarea 
                                                value={dentalNote.followUp || ''} 
                                                onChange={(e) => handleEditField('followUp', e.target.value)}
                                                className="w-full p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 h-20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800/60 px-6 py-4 flex justify-end gap-3 border-t border-slate-700/50">
                                    <button 
                                        onClick={handleSaveAndApprove}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-all shadow-md shadow-teal-500/10 text-sm"
                                    >
                                        <Save size={18} />
                                        Save & Approve Clinical Note
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800/20 border border-dashed border-slate-700/60 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                                <Sparkles className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
                                <h4 className="text-md font-bold text-slate-300">No Note Generated</h4>
                                <p className="text-xs text-slate-500 max-w-sm mt-1">Dictate your dentist-patient consultation on the left to instantly populate clinical notes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDentalNotesPage;

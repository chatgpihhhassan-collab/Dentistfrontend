import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, UserPlus, ShieldCheck, Sparkles, Mic, MicOff, 
    Loader2, CheckCircle2, Zap, Check, AlertCircle, Search,
    User, Calendar, Phone, MapPin, Globe, Mail, FileText, Send, RefreshCw, Bot, UserCheck,
    Camera, UploadCloud, Trash2, Image as ImageIcon, HeartPulse, Stethoscope, Activity, BadgeCheck,
    Volume2, VolumeX
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { getPatientAvatarUrl, validateImageFile, fileToDataUrl } from '../utils/avatarUtils';
import aiVoice from '../utils/aiVoiceAssistant';

export default function NewPatientPage() {
    const [doctor, setDoctor] = useState(null);
    const [newPatient, setNewPatient] = useState({ 
        firstName: '', 
        lastName: '', 
        dob: '', 
        phone: '', 
        email: '',
        address: '', 
        city: '', 
        postcode: '', 
        gender: '', 
        region: 'PK',
        nhiNumber: '',
        dentitionType: 'Permanent', // 'Permanent' | 'Pediatric' | 'Mixed'
        guardianName: '',
        guardianRelationship: '',
        currentTreatmentPlan: 'General Consultation',
        selectedAllergies: [],
        medicalNotes: '',
        profileImageDataUrl: null,
        profileImageMimeType: null
    });

    const calculateAge = (dobString) => {
        if (!dobString) return null;
        const birth = new Date(dobString);
        if (isNaN(birth.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age >= 0 ? age : 0;
    };

    const handleDobChange = (dobVal) => {
        let detectedDentition = 'Permanent';
        if (dobVal) {
            const age = calculateAge(dobVal);
            if (age !== null) {
                if (age < 6) detectedDentition = 'Pediatric';
                else if (age <= 12) detectedDentition = 'Mixed';
                else detectedDentition = 'Permanent';
            }
        }
        setNewPatient(prev => ({
            ...prev,
            dob: dobVal,
            dentitionType: detectedDentition
        }));
    };
    
    // AI Chatbot States
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [recentlySyncedField, setRecentlySyncedField] = useState({});
    const [askedClinicalDetails, setAskedClinicalDetails] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Validation & AI Voice Assistant States
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [voiceStatus, setVoiceStatus] = useState({ enabled: true, speaking: false, currentText: '' });

    // Listen to AI voice assistant state changes
    useEffect(() => {
        const unsubscribe = aiVoice.subscribe(state => {
            setVoiceStatus(state);
        });
        return () => unsubscribe();
    }, []);

    // Address Search & Mapbox Autocomplete States
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const addressDropdownRef = useRef(null);
    const addressSelectedRef = useRef(false);

    // Close address suggestions dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (addressDropdownRef.current && !addressDropdownRef.current.contains(e.target)) {
                setShowAddressDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced Mapbox Geocoding Places Lookup
    useEffect(() => {
        const query = (newPatient.address || '').trim();
        if (!query || query.length < 2) {
            setAddressSuggestions([]);
            return;
        }
        if (addressSelectedRef.current) {
            addressSelectedRef.current = false;
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoadingAddressSuggestions(true);
                const countryCode = newPatient.region === 'PK' ? 'pk' : 'nz';
                const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || (typeof atob === 'function' ? atob('cGsuZXlKMUlqb2lhR0ZwWkdWeVlXeHBPRFVpTENKaElqb2lZMjF6ZDNwMU5IbHFNVzFvTURKM2NubDZOMlJ0Wm00MFlpSjkubWROOXJLWkUycWk2WEtCaDZ6amtnZw==') : '');
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=${countryCode}&language=en&autocomplete=true&limit=6`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const feats = data.features || [];
                    setAddressSuggestions(feats);
                    if (feats.length > 0) {
                        setShowAddressDropdown(true);
                    }
                }
            } catch (err) {
                console.error("Mapbox address search error:", err);
            } finally {
                setLoadingAddressSuggestions(false);
            }
        }, 280);

        return () => clearTimeout(timer);
    }, [newPatient.address, newPatient.region]);

    const handleSelectAddressSuggestion = (feature) => {
        addressSelectedRef.current = true;
        const fullAddress = feature.place_name || feature.text || '';
        const context = feature.context || [];

        let foundCity = '';
        let foundPostcode = '';

        for (const item of context) {
            if (item.id.startsWith('place') || item.id.startsWith('locality') || item.id.startsWith('district')) {
                if (!foundCity) foundCity = item.text;
            } else if (item.id.startsWith('region') && !foundCity) {
                foundCity = item.text;
            } else if (item.id.startsWith('postcode')) {
                foundPostcode = item.text;
            }
        }

        if (!foundCity && feature.place_type && feature.place_type.includes('place')) {
            foundCity = feature.text;
        }

        setNewPatient(prev => ({
            ...prev,
            address: fullAddress,
            city: foundCity || prev.city,
            postcode: foundPostcode || prev.postcode
        }));

        setRecentlySyncedField(prev => ({
            ...prev,
            address: true,
            city: Boolean(foundCity),
            postcode: Boolean(foundPostcode)
        }));

        setTimeout(() => {
            setRecentlySyncedField(prev => ({
                ...prev,
                address: false,
                city: false,
                postcode: false
            }));
        }, 3000);

        setShowAddressDropdown(false);
    };

    const validateField = (field, value) => {
        const val = typeof value === 'string' ? value.trim() : value;
        switch (field) {
            case 'firstName':
                if (!val) return 'First name is required.';
                if (val.length < 2) return 'First name must contain at least 2 letters.';
                if (/[0-9]/.test(val)) return 'First name should only contain letters.';
                if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Invalid characters in first name.';
                return '';
            case 'lastName':
                if (!val) return 'Last name is required.';
                if (val.length < 2) return 'Last name must contain at least 2 letters.';
                if (/[0-9]/.test(val)) return 'Last name should only contain letters.';
                if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Invalid characters in last name.';
                return '';
            case 'dob':
                if (!val) return 'Date of birth is required.';
                const birthDate = new Date(val);
                if (isNaN(birthDate.getTime())) return 'Please enter a valid calendar date.';
                const now = new Date();
                if (birthDate > now) return 'Date of birth cannot be in the future.';
                if (birthDate.getFullYear() < 1900) return 'Date of birth year is too far in past.';
                return '';
            case 'gender':
                if (!val || val === '') return 'Please select patient gender.';
                return '';
            case 'phone':
                if (!val) return 'Contact phone number is required.';
                const digits = String(val).replace(/\D/g, '');
                if (digits.length < 10) return 'Phone number must contain at least 10 digits.';
                if (/[a-zA-Z]/.test(val)) return 'Phone number should not contain letters.';
                return '';
            case 'email':
                if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    return 'Please enter a valid email format (e.g. name@domain.com).';
                }
                return '';
            default:
                return '';
        }
    };

    const validateAll = () => {
        const newErrors = {};
        const fieldsToValidate = ['firstName', 'lastName', 'dob', 'gender', 'phone'];
        if (newPatient.email) fieldsToValidate.push('email');

        fieldsToValidate.forEach(field => {
            const err = validateField(field, newPatient[field]);
            if (err) newErrors[field] = err;
        });

        return newErrors;
    };

    const handleFieldBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const fieldError = validateField(field, newPatient[field]);
        setErrors(prev => {
            const updated = { ...prev };
            if (fieldError) {
                updated[field] = fieldError;
                // AI Assistant alerts the doctor aloud if wrong entry
                const labels = {
                    firstName: 'first name',
                    lastName: 'last name',
                    dob: 'date of birth',
                    gender: 'gender',
                    phone: 'contact phone number',
                    email: 'email address'
                };
                aiVoice.speakDoctorError(labels[field] || field, fieldError);
            } else {
                delete updated[field];
            }
            return updated;
        });
    };
    
    const chatScrollContainerRef = useRef(null);
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            showToast(validation.error, 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            const dataUrl = await fileToDataUrl(file);
            setNewPatient(prev => ({
                ...prev,
                profileImageDataUrl: dataUrl,
                profileImageMimeType: file.type || 'image/jpeg'
            }));
            showToast("📸 Patient profile image attached (<= 5MB verified)", "success");
        } catch (err) {
            console.error("Failed to read image:", err);
            showToast("Could not process image file.", "error");
        }
    };

    const handleRemoveImage = () => {
        setNewPatient(prev => ({
            ...prev,
            profileImageDataUrl: null,
            profileImageMimeType: null
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        showToast("Profile image removed. Reverted to default avatar.", "info");
    };

    useEffect(() => {
        const stored = localStorage.getItem('doctor');
        if (!stored) {
            navigate('/');
            return;
        }
        const doc = JSON.parse(stored);
        setDoctor(doc);

        // Initial AI greeting message
        setMessages([
            {
                id: 1,
                sender: 'ai',
                text: `Hello Dr. ${doc.name || 'Doctor'}! 👋 I will help you register a new patient.\n\nYou can speak using the microphone or type below. Let's start with the patient's full name.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                suggestions: ["Tariq Mehmood", "Sarah Connor", "Ali Khan"]
            }
        ]);

        // Check Web Speech API availability
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
        }
    }, [navigate]);

    // Auto-scroll chat messages internally
    useEffect(() => {
        if (chatScrollContainerRef.current) {
            chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
        }
    }, [messages, aiLoading]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
    };

    const startRecording = async () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            showToast("Voice recognition is not supported in this browser. Please use Chrome or Edge!", "info");
            return;
        }

        try {
            // Request mic permissions explicitly if supported
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch (micErr) {
                    console.warn("Microphone permission prompt note:", micErr);
                }
            }

            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
            }

            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                const combined = (finalTranscript + interimTranscript).trim();
                if (combined) {
                    setChatInput(combined);
                }
            };

            rec.onerror = (err) => {
                console.error("Speech recognition error:", err);
                if (err.error === 'not-allowed') {
                    showToast("⚠️ Microphone access is Blocked by your browser. Click the Padlock / Settings icon next to the URL in your address bar and set Microphone to 'Allow'.", "error");
                } else if (err.error !== 'no-speech') {
                    showToast(`Voice input notice: ${err.error}`, "info");
                }
                setIsRecording(false);
            };

            rec.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = rec;
            rec.start();
            setIsRecording(true);
            showToast("🎙️ Listening... Speak patient details now", "info");
        } catch (err) {
            console.error("Failed to start speech recognition:", err);
            showToast("Could not start microphone. Please grant mic permissions.", "error");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.warn(err);
            }
        }
        setIsRecording(false);
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Process message through AI Intake Engine
    const handleSendMessage = async (e, textOverride = null, autoSaveDirect = false) => {
        if (e) e.preventDefault();
        const text = (textOverride || chatInput).trim();
        if (!text && !autoSaveDirect) return;

        // Append doctor's message to chat ledger
        const userMsg = {
            id: Date.now(),
            sender: 'doctor',
            text: text || "Confirm & Create Patient Profile",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');

        // Check if user sent a casual greeting - respond instantly without network latency
        const cleanText = text.toLowerCase().trim();
        const cleanNormalized = cleanText.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        
        const isGreeting = [
            'hi', 'hello', 'hey', 'greetings', 'hi there', 'hello there', 
            'salam', 'aoa', 'assalam o alaikum', 'good morning', 'good afternoon', 'good evening'
        ].includes(cleanNormalized);

        if (isGreeting) {
            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: `Hello Dr. ${doctor?.name || 'Doctor'}! 😊 How can I assist you with patient registration today? You can dictate or type the patient's full name, age, gender, phone, and address anytime.`,
                suggestions: ["Tariq Mehmood, 35yo Male", "Sarah Connor, 28yo Female", "Ali Khan, 42yo Male"],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            return;
        }

        // Comprehensive Matcher for all variations of "add patient for me" / "register a patient"
        const isPureIntakeCommand = (() => {
            const hasDataIndicators = /\d+/.test(cleanNormalized) || /\b(male|female|street|road|f-8|f-7|lahore|islamabad|karachi|auckland|wellington|years|yo|saal)\b/.test(cleanNormalized);
            if (hasDataIndicators) return false;

            const intakePattern = /^(?:i\s*want|i\s*need|can\s*you|please|help\s*me|let\s*us|let's)?\s*(?:to\s*)?(?:add|register|create|enroll|input|nayi|naya)?\s*(?:a\s*|an\s*|the\s*|my\s*|our\s*|new\s*)?(?:patient|profile|record|mariz|entry)(?:\s*for\s*me)?$/i;
            if (intakePattern.test(cleanNormalized)) return true;

            const intakePhrases = [
                'add patient', 'add a patient', 'add patient for me', 'add a patient for me', 
                'add new patient', 'add a new patient', 'add new patient for me', 'add someone',
                'register patient', 'register a patient', 'register new patient', 'register a new patient',
                'register patient for me', 'register a patient for me', 'start registration', 'start patient registration',
                'create patient', 'create a patient', 'create new patient', 'create a new patient',
                'create patient profile', 'create a patient profile', 'new patient', 'new patient intake',
                'new patient registration', 'new patient profile', 'new intake', 'new registration',
                'patient registration', 'patient intake', 'enroll patient', 'enroll a patient',
                'i want register', 'i want register my patient', 'i want to register my patient',
                'i want to add a patient', 'i need to add a patient', 'i want to register a patient',
                'i need to register a patient', 'i want to create a patient', 'i need to create a patient',
                'can you add a patient', 'can you add a patient for me', 'can you help me add a patient',
                'can you help me register a patient', 'please add a patient', 'please register a patient',
                'help me add a patient', 'help me register a patient', 'let us add a patient', "let's add a patient",
                'patient add karo', 'mariz add karo', 'nayi entry karo', 'naya patient add karo'
            ];

            return intakePhrases.some(p => cleanNormalized === p || cleanNormalized.startsWith(p) || cleanNormalized.endsWith(p));
        })();

        if (isPureIntakeCommand && !newPatient.firstName) {
            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: `Sure Dr. ${doctor?.name || 'Doctor'}! 📋 Let's register your new patient.\n\nWhat is the patient's **full name**? (You can also speak into the mic or type name, age, phone, and city together).`,
                suggestions: ["Tariq Mehmood", "Sarah Connor", "Ali Khan"],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            return;
        }

        setAiLoading(true);

        try {
            const docId = doctor?.doctorID || doctor?.doctorId || doctor?.id || 1;
            const res = await fetch('/api/patients/ai-intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: text,
                    doctorId: docId,
                    region: newPatient.region || 'PK',
                    autoSave: autoSaveDirect
                })
            });

            if (!res.ok) throw new Error("AI Intake parsing failed.");
            const data = await res.json();

            // Populate form fields with extracted details (Strict stopword protection)
            const invalidNames = ['my', 'a', 'an', 'the', 'new', 'this', 'patient', 'profile', 'record', 'someone', 'user', 'entry', 'mariz'];
            const updated = { ...newPatient };
            const syncedMap = {};

            if (data.firstName && !invalidNames.includes(data.firstName.toLowerCase().trim())) { 
                updated.firstName = data.firstName; 
                syncedMap.firstName = true; 
            }
            if (data.lastName && !invalidNames.includes(data.lastName.toLowerCase().trim())) { 
                updated.lastName = data.lastName; 
                syncedMap.lastName = true; 
            }
            if (data.dob) { updated.dob = data.dob; syncedMap.dob = true; }
            if (data.phone) { updated.phone = data.phone; syncedMap.phone = true; }
            if (data.email) { updated.email = data.email; syncedMap.email = true; }
            if (data.gender) { updated.gender = data.gender; syncedMap.gender = true; }
            if (data.region) { updated.region = data.region; syncedMap.region = true; }
            if (data.address) { updated.address = data.address; syncedMap.address = true; }
            if (data.city) { updated.city = data.city; syncedMap.city = true; }
            if (data.postcode) { updated.postcode = data.postcode; syncedMap.postcode = true; }
            if (data.nhiNumber) { updated.nhiNumber = data.nhiNumber; syncedMap.nhiNumber = true; }
            if (data.currentTreatmentPlan) { updated.currentTreatmentPlan = data.currentTreatmentPlan; syncedMap.currentTreatmentPlan = true; }
            if (data.allergies && Array.isArray(data.allergies) && data.allergies.length > 0) {
                updated.selectedAllergies = Array.from(new Set([...(updated.selectedAllergies || []), ...data.allergies]));
                syncedMap.selectedAllergies = true;
            }
            if (data.medicalNotes) { 
                updated.medicalNotes = updated.medicalNotes ? `${updated.medicalNotes} | ${data.medicalNotes}` : data.medicalNotes; 
                syncedMap.medicalNotes = true; 
            }

            setNewPatient(updated);
            setRecentlySyncedField(syncedMap);
            // Determine next conversational step / response
            let aiReplyText = "";
            let actionType = null;
            let nextSuggestions = null;
            let existingPatientId = null;

            if (data.isDuplicate) {
                aiReplyText = `⚠️ **Duplicate Patient Notice**:\nPatient **${updated.firstName} ${updated.lastName}** is already registered in your clinic database (Patient ID #${data.existingPatientId}).\n\nWould you like to open their existing dental chart?`;
                actionType = 'view_existing';
                existingPatientId = data.existingPatientId;
            } else if (autoSaveDirect && data.savedPatient) {
                aiReplyText = `🎉 Success! Patient **${data.savedPatient.firstName} ${data.savedPatient.lastName}** (ID #${data.savedPatient.patientID}) has been successfully registered! Opening their dental chart now...`;
                showToast(`✅ Patient registered with ID #${data.savedPatient.patientID}`, "success");
                setTimeout(() => {
                    navigate(`/chart/${data.savedPatient.patientID}`);
                }, 1400);
            } else if (!updated.firstName) {
                aiReplyText = `I didn't quite catch the name. What is the patient's full name?`;
                nextSuggestions = ["Tariq Mehmood", "Sarah Connor", "Ali Khan"];
            } else if (!updated.dob && !updated.gender) {
                aiReplyText = `Got it, **${updated.firstName} ${updated.lastName}**! What is the patient's **age or date of birth**, and **gender**?`;
                nextSuggestions = ["25 years old, Male", "38 saal, Female", "32yo, Male"];
            } else if (!updated.dob) {
                aiReplyText = `Got it! What is the patient's **age or date of birth**?`;
                nextSuggestions = ["25 years old", "38 saal", "1995-05-14"];
            } else if (!updated.gender) {
                aiReplyText = `Understood! What is the patient's **gender** (Male / Female / Other)?`;
                nextSuggestions = ["Male", "Female", "Other"];
            } else if (!updated.phone && !updated.city) {
                aiReplyText = `Great! What is the patient's **phone number** and **city / address**?`;
                nextSuggestions = ["0321 4455667, F-8 Islamabad", "0300 1234567, Lahore", "021 555 1234, Auckland NZ"];
            } else if (!updated.phone) {
                aiReplyText = `Great! What is the patient's **phone number**?`;
                nextSuggestions = [updated.region === 'PK' ? "0321 4455667" : "021 555 1234"];
            } else if (!updated.city) {
                aiReplyText = `Almost there! What is the patient's **city or address**?`;
                nextSuggestions = [updated.region === 'PK' ? "Islamabad" : "Auckland"];
            } else if (!askedClinicalDetails && (!updated.selectedAllergies?.length && (!updated.medicalNotes && (!data.extractedFields || !data.extractedFields.includes('currentTreatmentPlan'))))) {
                aiReplyText = `Got it! What is the patient's **visit purpose / treatment plan** (e.g. Routine Checkup, Teeth Whitening, Braces, Toothache) and do they have any **medical alerts or allergies**?`;
                nextSuggestions = ["Routine Checkup, No Allergies", "Teeth Whitening", "Braces (Orthodontics)", "Severe Toothache", "Penicillin Allergy", "Diabetic / Hypertension"];
                setAskedClinicalDetails(true);
            } else {
                const allergyList = updated.selectedAllergies?.length ? updated.selectedAllergies.join(', ') : 'No Known Allergies';
                aiReplyText = `✨ All patient details captured for **${updated.firstName} ${updated.lastName}**!\n\n• **DOB:** ${updated.dob} (${updated.gender})\n• **Phone:** ${updated.phone}\n• **City:** ${updated.city} (${updated.region})\n• **Visit Purpose / Plan:** ${updated.currentTreatmentPlan || 'General Consultation'}\n• **Medical Alerts & Allergies:** ${allergyList}\n• **Intake Notes:** ${updated.medicalNotes || 'None'}\n\nWould you like to complete registration and open their dental chart now?`;
                actionType = 'confirm_save';
            }

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiReplyText,
                actionType: actionType,
                existingPatientId: existingPatientId,
                suggestions: nextSuggestions,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (err) {
            console.error("AI Intake error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I had trouble processing that. You can try speaking again or type patient details directly.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleCreatePatient = async (e) => {
        if (e) e.preventDefault();

        // 1. Run Complete Form Validation
        const validationErrors = validateAll();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            const allTouched = { firstName: true, lastName: true, dob: true, gender: true, phone: true };
            if (newPatient.email) allTouched.email = true;
            setTouched(allTouched);

            const fieldKeys = ['firstName', 'lastName', 'dob', 'gender', 'phone', 'email'];
            const firstFailedKey = fieldKeys.find(k => validationErrors[k]);
            const labels = {
                firstName: 'first name',
                lastName: 'last name',
                dob: 'date of birth',
                gender: 'gender selection',
                phone: 'contact phone number',
                email: 'email address'
            };

            const spokenAlert = aiVoice.speakDoctorError(labels[firstFailedKey] || firstFailedKey, validationErrors[firstFailedKey]);
            showToast(`⚠️ ${validationErrors[firstFailedKey]}`, 'error');

            // Log diagnostic guidance in AI chatbot ledger
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: `⚠️ **Registration Validation Notice**\n\nDoctor, please complete the required patient fields:\n${Object.entries(validationErrors).map(([k, v]) => `• **${labels[k] || k}**: ${v}`).join('\n')}\n\n*AI Voice Assistant advised: "${spokenAlert}"*`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

            // Scroll or focus the invalid input
            const inputEl = document.querySelector(`[name="${firstFailedKey}"]`);
            if (inputEl) inputEl.focus();
            return;
        }

        try {
            const city = newPatient.city;
            const postcode = newPatient.postcode;
            const fullAddress = [newPatient.address, city, postcode].filter(Boolean).join(', ');
            const docId = doctor?.doctorID || doctor?.doctorId || doctor?.id || 1;
            
            const combinedNotes = [
                newPatient.selectedAllergies?.length ? `Medical Alerts: ${newPatient.selectedAllergies.join(', ')}` : '',
                newPatient.medicalNotes
            ].filter(Boolean).join(' | ');

            const payload = { 
                ...newPatient, 
                address: fullAddress, 
                doctorID: docId,
                email: newPatient.email || `${newPatient.firstName.toLowerCase()}.${newPatient.lastName.toLowerCase()}@dentiaclinic.com`,
                profileImageDataUrl: newPatient.profileImageDataUrl,
                profileImageMimeType: newPatient.profileImageMimeType,
                nhiNumber: newPatient.nhiNumber,
                currentTreatmentPlan: newPatient.currentTreatmentPlan || 'General Consultation'
            };
            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const created = await res.json();

                // Save intake note to clinical logs if provided
                if (combinedNotes && created.patientID) {
                    try {
                        await fetch(`/api/patients/${created.patientID}/clinical-logs`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                doctorID: docId,
                                message: `Intake Notes: ${combinedNotes}`,
                                logType: 'Intake Note'
                            })
                        });
                    } catch (logErr) {
                        console.warn("Could not save initial clinical log:", logErr);
                    }
                }

                showToast(`Patient ${created.firstName} registered successfully!`, "success");
                aiVoice.speak(`Doctor, patient ${created.firstName} ${created.lastName} has been registered successfully.`);
                setTimeout(() => {
                    navigate(`/chart/${created.patientID}`);
                }, 1000);
            } else if (res.status === 409) {
                const errData = await res.json();
                showToast(`⚠️ ${errData.message}`, "error");
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: `⚠️ **Duplicate Patient Detected**\n\nPatient **${errData.firstName} ${errData.lastName}** is already registered in your clinic (Patient ID #${errData.existingPatientId}).`,
                    actionType: 'view_existing',
                    existingPatientId: errData.existingPatientId,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            } else {
                const errMsg = await res.text().catch(() => "");
                showToast(errMsg || "Failed to create patient. Check required fields.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Error connecting to server.", "error");
        }
    };

    // Calculate filled percentage
    const filledFieldsCount = [
        newPatient.firstName,
        newPatient.lastName,
        newPatient.dob,
        newPatient.gender,
        newPatient.phone,
        newPatient.city,
        newPatient.region
    ].filter(Boolean).length;
    const progressPct = Math.round((filledFieldsCount / 7) * 100);

    if (!doctor) return null;

    return (
        <div className="min-h-screen bg-[#F4F6FA] text-dark-slate flex flex-col justify-between font-sans selection:bg-light-teal selection:text-primary-teal relative">
            <div className="flex-shrink-0">
                <Navigation />
            </div>

            {/* Hidden File Input for Profile Image Upload */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" 
                className="hidden" 
            />

            {/* Toast Notification */}
            {toast.visible && (
                <div className={`fixed top-20 right-8 z-[100] bg-white border-l-4 ${toast.type === 'error' ? 'border-red-500 text-red-600' : 'border-[#4A7CD2] text-[#10244B]'} px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fade-in`}>
                    <Sparkles className="w-4 h-4 text-[#4A7CD2]" />
                    <span className="font-extrabold text-xs">{toast.message}</span>
                </div>
            )}

            {/* Top Sub-Header Bar (Compact) */}
            <div className="max-w-[1750px] w-full mx-auto px-4 lg:px-6 pt-2 pb-1.5 flex-shrink-0">
                <div className="flex justify-between items-center bg-white rounded-[1.5rem] px-5 py-2.5 shadow-xs border border-light-teal/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#EAF0FC] border border-[#4A7CD2]/30 flex items-center justify-center text-[#4A7CD2]">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-[#4A7CD2] uppercase tracking-widest block leading-none">Smart Patient Intake</span>
                            <h2 className="text-sm font-sans font-black text-[#10244B] leading-tight mt-0.5">AI-Assisted Registration</h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* AI Voice Assistant Toggle & Speaking Indicator */}
                        <div className="flex items-center gap-1.5 bg-[#EAF0FC]/80 border border-[#4A7CD2]/40 rounded-xl px-2.5 py-1.5 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => aiVoice.toggle()}
                                title={voiceStatus.enabled ? "Mute AI Voice Assistant" : "Unmute AI Voice Assistant"}
                                className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                    voiceStatus.enabled ? 'text-[#4A7CD2]' : 'text-slate-400'
                                }`}
                            >
                                {voiceStatus.enabled ? (
                                    <>
                                        <Volume2 className={`w-4 h-4 ${voiceStatus.speaking ? 'text-blue-600 animate-bounce' : ''}`} />
                                        <span className="text-[10px] font-black hidden sm:inline">
                                            {voiceStatus.speaking ? 'AI Speaking...' : 'AI Voice: Active'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX className="w-4 h-4 text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 hidden sm:inline">AI Voice: Muted</span>
                                    </>
                                )}
                            </button>
                            {voiceStatus.speaking && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                            )}
                        </div>

                        <button 
                            onClick={() => navigate('/directory')} 
                            className="text-[#4A7CD2] hover:text-[#3665B7] bg-[#EAF0FC] border border-light-teal/50 hover:bg-[#D5E1F7] px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center font-bold text-xs transition-all cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Directory
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Side-by-Side Dashboard Layout */}
            <main className="max-w-[1750px] w-full mx-auto px-4 lg:px-6 pb-6 pt-1 flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-140px)] min-h-[580px] items-stretch">
                
                {/* ============================================================ */}
                {/* LEFT PANEL (~58%): LIVE-SYNCING PATIENT PROFILE & FORM CARD */}
                {/* ============================================================ */}
                <div className="flex-1 lg:w-[58%] xl:w-[60%] bg-white rounded-[2rem] p-5 shadow-xl border border-light-teal/30 flex flex-col overflow-hidden min-h-0 justify-between">
                    
                    <div className="flex flex-col flex-1 overflow-hidden min-h-0 space-y-3">
                        {/* Patient Header Summary Bar with Profile Image Upload */}
                        <div className="bg-[#EAF0FC]/50 rounded-2xl p-3 border border-light-teal/45 flex items-center justify-between gap-3 shadow-2xs flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {/* Interactive Profile Photo Upload Circle */}
                                <div className="relative group flex-shrink-0">
                                    <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
                                        <img 
                                            src={newPatient.profileImageDataUrl || getPatientAvatarUrl(newPatient)} 
                                            alt="Patient Profile" 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    
                                    {/* Upload Camera Overlay Button */}
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Upload Patient Photo (Max 5MB - Optional)"
                                        className="absolute -bottom-1 -right-1 bg-[#4A7CD2] hover:bg-[#3665B7] text-white p-1 rounded-full shadow-md transition-transform transform hover:scale-110 cursor-pointer border border-white"
                                    >
                                        <Camera className="w-2.5 h-2.5" />
                                    </button>

                                    {/* Remove Custom Photo Button if Attached */}
                                    {newPatient.profileImageDataUrl && (
                                        <button 
                                            type="button"
                                            onClick={handleRemoveImage}
                                            title="Remove Custom Photo (Reset to Default Avatar)"
                                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow-md transition-transform transform hover:scale-110 cursor-pointer border border-white"
                                        >
                                            <Trash2 className="w-2 h-2" />
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-sans font-black text-[#10244B] capitalize leading-tight">
                                            {newPatient.firstName ? `${newPatient.firstName} ${newPatient.lastName}` : 'New Patient Profile'}
                                        </h3>
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-[9.5px] font-extrabold text-[#4A7CD2] bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-[#4A7CD2]/30 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                        >
                                            <UploadCloud className="w-2.5 h-2.5" />
                                            {newPatient.profileImageDataUrl ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-muted-text font-black uppercase tracking-wider mt-0.5">
                                        {newPatient.dob ? `DOB: ${newPatient.dob}` : 'Awaiting DOB'} • {newPatient.gender ? `${newPatient.gender} Avatar` : 'Auto Gender Avatar'} • <span className="text-slate-400 font-bold">Max 5MB</span>
                                    </p>
                                </div>
                            </div>

                            {/* Progress Status */}
                            <div className="text-right">
                                <div className="text-[9px] font-black text-[#4A7CD2] uppercase tracking-wider mb-0.5">
                                    {progressPct}% Completed
                                </div>
                                <div className="w-20 bg-white h-1.5 rounded-full border border-light-teal/40 overflow-hidden">
                                    <div className="bg-[#4A7CD2] h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Live AI Spoken Alert Banner */}
                        {voiceStatus.speaking && voiceStatus.currentText && (
                            <div className="p-2.5 bg-blue-50/95 border-2 border-blue-300 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in flex-shrink-0">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                                        <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                                    </div>
                                    <p className="text-xs font-bold text-blue-950 truncate">
                                        <span className="font-black text-[#2563EB] uppercase text-[10px] mr-1">AI Voice:</span>
                                        {voiceStatus.currentText}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => aiVoice.stop()}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 cursor-pointer flex-shrink-0"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {/* Zero-Scroll Optimized Form Grid */}
                        <form onSubmit={handleCreatePatient} className="flex-1 flex flex-col justify-between space-y-2 min-h-0 overflow-hidden">
                            
                            {/* Row 1: First & Last Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">First Name *</label>
                                        {recentlySyncedField.firstName && (
                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                                <Check className="w-2.5 h-2.5" /> Synced
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        name="firstName"
                                        type="text" 
                                        value={newPatient.firstName} 
                                        onBlur={() => handleFieldBlur('firstName')}
                                        onChange={e => {
                                            setNewPatient({...newPatient, firstName: e.target.value});
                                            if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                                        }} 
                                        className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 font-bold transition-all ${
                                            errors.firstName && touched.firstName
                                                ? 'bg-red-50/50 border-red-500 focus:ring-red-400/30 text-red-900 ring-2 ring-red-400/20'
                                                : recentlySyncedField.firstName 
                                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:ring-[#4A7CD2]/25'
                                        }`} 
                                        placeholder="Waiting for AI or manual input..." 
                                    />
                                    {errors.firstName && touched.firstName && (
                                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 animate-fade-in">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{errors.firstName}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Last Name *</label>
                                        {recentlySyncedField.lastName && (
                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                                <Check className="w-2.5 h-2.5" /> Synced
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        name="lastName"
                                        type="text" 
                                        value={newPatient.lastName} 
                                        onBlur={() => handleFieldBlur('lastName')}
                                        onChange={e => {
                                            setNewPatient({...newPatient, lastName: e.target.value});
                                            if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                                        }} 
                                        className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 font-bold transition-all ${
                                            errors.lastName && touched.lastName
                                                ? 'bg-red-50/50 border-red-500 focus:ring-red-400/30 text-red-900 ring-2 ring-red-400/20'
                                                : recentlySyncedField.lastName 
                                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:ring-[#4A7CD2]/25'
                                        }`} 
                                        placeholder="Waiting for AI or manual input..." 
                                    />
                                    {errors.lastName && touched.lastName && (
                                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 animate-fade-in">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{errors.lastName}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: DOB & Gender */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Date of Birth *</label>
                                        {recentlySyncedField.dob && (
                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                                <Check className="w-2.5 h-2.5" /> Synced
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        name="dob"
                                        type="date" 
                                        value={newPatient.dob} 
                                        onBlur={() => handleFieldBlur('dob')}
                                        onChange={e => {
                                            handleDobChange(e.target.value);
                                            if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                                        }} 
                                        className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 font-bold transition-all cursor-pointer ${
                                            errors.dob && touched.dob
                                                ? 'bg-red-50/50 border-red-500 focus:ring-red-400/30 text-red-900 ring-2 ring-red-400/20'
                                                : recentlySyncedField.dob 
                                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:ring-[#4A7CD2]/25'
                                        }`} 
                                    />
                                    {errors.dob && touched.dob && (
                                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 animate-fade-in">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{errors.dob}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Gender *</label>
                                        {recentlySyncedField.gender && (
                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                                <Check className="w-2.5 h-2.5" /> Synced
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <select 
                                            name="gender"
                                            value={newPatient.gender} 
                                            onBlur={() => handleFieldBlur('gender')}
                                            onChange={e => {
                                                setNewPatient({...newPatient, gender: e.target.value});
                                                if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                                            }} 
                                            className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 font-bold transition-all appearance-none cursor-pointer ${
                                                errors.gender && touched.gender
                                                    ? 'bg-red-50/50 border-red-500 focus:ring-red-400/30 text-red-900 ring-2 ring-red-400/20'
                                                    : recentlySyncedField.gender 
                                                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                    : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:ring-[#4A7CD2]/25'
                                            }`}
                                        >
                                            <option value="" disabled>Select Gender...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-text">
                                            ▼
                                        </div>
                                    </div>
                                    {errors.gender && touched.gender && (
                                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 animate-fade-in">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{errors.gender}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 👶 Dentition Classification & Pediatric Guardian Card */}
                            <div className="bg-[#F8FAFC] border border-light-teal/45 rounded-2xl p-3 space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider flex items-center gap-1.5">
                                        <span>{newPatient.dentitionType === 'Pediatric' ? '👶' : newPatient.dentitionType === 'Mixed' ? '🔀' : '🦷'}</span>
                                        Dentition Arch Classification
                                        {calculateAge(newPatient.dob) !== null && (
                                            <span className="text-[10px] font-bold text-slate-500 normal-case">
                                                (Calculated Age: {calculateAge(newPatient.dob)} {calculateAge(newPatient.dob) === 1 ? 'Year' : 'Years'})
                                            </span>
                                        )}
                                    </label>
                                    <span className="text-[9px] font-black text-[#4A7CD2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                        Auto-Adapted
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewPatient(prev => ({ ...prev, dentitionType: 'Permanent' }))}
                                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center border ${
                                            newPatient.dentitionType === 'Permanent'
                                                ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        🦷 Adult (1–32)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewPatient(prev => ({ ...prev, dentitionType: 'Pediatric' }))}
                                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center border ${
                                            newPatient.dentitionType === 'Pediatric'
                                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                                        }`}
                                    >
                                        👶 Pediatric (A–T)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewPatient(prev => ({ ...prev, dentitionType: 'Mixed' }))}
                                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center border ${
                                            newPatient.dentitionType === 'Mixed'
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                                        }`}
                                    >
                                        🔀 Mixed (6–12 Yrs)
                                    </button>
                                </div>

                                {/* Pediatric Parent / Guardian Details if Pediatric or Child */}
                                {(newPatient.dentitionType === 'Pediatric' || (calculateAge(newPatient.dob) !== null && calculateAge(newPatient.dob) < 16)) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80 animate-fade-in">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase">Guardian / Parent Name</label>
                                            <input
                                                type="text"
                                                value={newPatient.guardianName || ''}
                                                onChange={e => setNewPatient({ ...newPatient, guardianName: e.target.value })}
                                                placeholder="e.g. Fatima Khan (Mother)"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-dark-slate focus:outline-none focus:border-[#4A7CD2] mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase">Parent Relationship</label>
                                            <input
                                                type="text"
                                                value={newPatient.guardianRelationship || ''}
                                                onChange={e => setNewPatient({ ...newPatient, guardianRelationship: e.target.value })}
                                                placeholder="e.g. Mother / Father / Guardian"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-dark-slate focus:outline-none focus:border-[#4A7CD2] mt-0.5"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Phone & Healthcare Region */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Phone Number *</label>
                                        {recentlySyncedField.phone && (
                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                                <Check className="w-2.5 h-2.5" /> Synced
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        name="phone"
                                        type="tel" 
                                        value={newPatient.phone} 
                                        onBlur={() => handleFieldBlur('phone')}
                                        onChange={e => {
                                            setNewPatient({...newPatient, phone: e.target.value});
                                            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                        }} 
                                        className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 font-bold transition-all ${
                                            errors.phone && touched.phone
                                                ? 'bg-red-50/50 border-red-500 focus:ring-red-400/30 text-red-900 ring-2 ring-red-400/20'
                                                : recentlySyncedField.phone 
                                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:ring-[#4A7CD2]/25'
                                        }`} 
                                        placeholder={newPatient.region === 'PK' ? "e.g. 0321 4455667" : "e.g. 021 123 4567"} 
                                    />
                                    {errors.phone && touched.phone && (
                                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1 animate-fade-in">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{errors.phone}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Healthcare Region *</label>
                                        {recentlySyncedField.region && (
                                            <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                                <Check className="w-2.5 h-2.5" /> Synced
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewPatient({...newPatient, region: 'PK'})}
                                            className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                newPatient.region === 'PK'
                                                    ? 'bg-[#EAF0FC] border-[#4A7CD2] text-[#4A7CD2] shadow-xs'
                                                    : 'bg-[#F8FAFC] border-light-teal/50 text-muted-text hover:text-dark-slate'
                                            }`}
                                        >
                                            <Globe className="w-3 h-3" /> Pakistan (PK)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewPatient({...newPatient, region: 'NZ'})}
                                            className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                newPatient.region === 'NZ'
                                                    ? 'bg-[#EAF0FC] border-[#4A7CD2] text-[#4A7CD2] shadow-xs'
                                                    : 'bg-[#F8FAFC] border-light-teal/50 text-muted-text hover:text-dark-slate'
                                            }`}
                                        >
                                            <Globe className="w-3 h-3" /> New Zealand (NZ)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Street Address Lookup & Autocomplete */}
                            <div className="relative" ref={addressDropdownRef}>
                                <div className="flex justify-between items-center mb-0.5 ml-1">
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Street Address</label>
                                        <span className="text-[9px] font-bold text-[#4A7CD2] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                            Mapbox Search
                                        </span>
                                    </div>
                                    {recentlySyncedField.address && (
                                        <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                                            <Check className="w-2.5 h-2.5" /> Synced
                                        </span>
                                    )}
                                </div>
                                <div className="relative flex items-center">
                                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder={newPatient.region === 'PK' ? "Search street/area (e.g. F-7 Islamabad, Gulberg Lahore) or type address..." : "Search street, suburb, Auckland or type address..."}
                                        value={newPatient.address}
                                        onFocus={() => {
                                            if (addressSuggestions.length > 0) setShowAddressDropdown(true);
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewPatient(prev => ({ ...prev, address: val }));
                                            addressSelectedRef.current = false;
                                            if (!val.trim()) {
                                                setAddressSuggestions([]);
                                                setShowAddressDropdown(false);
                                            }
                                        }}
                                        className="w-full pl-9 pr-14 py-2.5 bg-[#F8FAFC] border border-light-teal/50 focus:border-[#4A7CD2] rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20 transition-all placeholder:font-normal placeholder:text-slate-400"
                                    />
                                    <div className="absolute right-2.5 flex items-center gap-1">
                                        {loadingAddressSuggestions ? (
                                            <Loader2 className="w-3.5 h-3.5 text-[#4A7CD2] animate-spin" />
                                        ) : newPatient.address ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewPatient(prev => ({ ...prev, address: '' }));
                                                    setAddressSuggestions([]);
                                                    setShowAddressDropdown(false);
                                                }}
                                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs cursor-pointer"
                                                title="Clear address"
                                            >
                                                ✕
                                            </button>
                                        ) : (
                                            <Search className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Autocomplete Dropdown Popover */}
                                {showAddressDropdown && addressSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-scale-up">
                                        <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3 h-3 text-[#4A7CD2]" />
                                                <span>Mapbox Location Matches ({addressSuggestions.length})</span>
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setShowAddressDropdown(false)}
                                                className="text-slate-400 hover:text-slate-600 font-bold p-0.5 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {addressSuggestions.map(feat => {
                                            const mainName = feat.text || (feat.place_name ? feat.place_name.split(',')[0] : '');
                                            const subContext = feat.place_name ? feat.place_name.replace(mainName, '').replace(/^,\s*/, '') : '';
                                            return (
                                                <div
                                                    key={feat.id}
                                                    onClick={() => handleSelectAddressSuggestion(feat)}
                                                    className="p-3 hover:bg-blue-50/70 transition cursor-pointer flex items-start gap-2.5"
                                                >
                                                    <MapPin className="w-4 h-4 text-[#4A7CD2] shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-xs text-slate-900 block truncate">{mainName}</span>
                                                        {subContext && (
                                                            <span className="text-[10.5px] text-slate-500 block truncate">{subContext}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9.5px] font-bold text-[#4A7CD2] bg-white px-2 py-0.5 rounded-md border border-blue-100 shrink-0 shadow-2xs">
                                                        Select
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Quick Region City Helpers */}
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className="text-[9.5px] font-bold text-slate-400">Quick Cities:</span>
                                    {(newPatient.region === 'PK'
                                        ? ['Islamabad', 'Lahore', 'Rawalpindi', 'Karachi', 'Peshawar', 'Rawalakot']
                                        : ['Auckland', 'Wellington', 'Christchurch', 'Hamilton']
                                    ).map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                setNewPatient(prev => ({
                                                    ...prev,
                                                    city: c,
                                                    address: prev.address ? prev.address : `${c}, ${newPatient.region === 'PK' ? 'Pakistan' : 'New Zealand'}`
                                                }));
                                            }}
                                            className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-[#4A7CD2] text-slate-600 rounded-md border border-slate-200 transition cursor-pointer"
                                        >
                                            + {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Row 5: City, Postcode & Treatment Modality (Integrated Clean Row) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="flex justify-between items-center mb-0.5 ml-1">
                                            <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">City</label>
                                            {recentlySyncedField.city && (
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">Synced</span>
                                            )}
                                        </div>
                                        <input 
                                            name="city" 
                                            placeholder="City" 
                                            type="text" 
                                            value={newPatient.city} 
                                            onChange={(e) => setNewPatient({...newPatient, city: e.target.value})} 
                                            className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 font-bold transition-all ${
                                                recentlySyncedField.city 
                                                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                    : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2]'
                                            }`} 
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-0.5 ml-1">
                                            <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Postcode</label>
                                            {recentlySyncedField.postcode && (
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">Synced</span>
                                            )}
                                        </div>
                                        <input 
                                            name="postcode" 
                                            placeholder="Code" 
                                            type="text" 
                                            value={newPatient.postcode} 
                                            onChange={(e) => setNewPatient({...newPatient, postcode: e.target.value})} 
                                            className={`w-full border rounded-xl px-3 py-2 text-xs text-dark-slate focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 font-bold transition-all ${
                                                recentlySyncedField.postcode 
                                                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20' 
                                                    : 'bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2]'
                                            }`} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 ml-1">
                                        <label className="text-[10.5px] font-black text-dark-slate uppercase tracking-wider">Visit Purpose / Plan</label>
                                        <span className="text-[8.5px] text-[#4A7CD2] font-bold">Modality</span>
                                    </div>
                                    <div className="relative">
                                        <select 
                                            value={newPatient.currentTreatmentPlan} 
                                            onChange={e => setNewPatient({...newPatient, currentTreatmentPlan: e.target.value})} 
                                            className="w-full border rounded-xl px-3 py-2 text-xs text-dark-slate bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 font-bold transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="General Consultation">General Consultation & Routine Checkup</option>
                                            <option value="Toothache & Emergency">Toothache & Emergency Relief</option>
                                            <option value="Teeth Whitening (Cosmetic)">Teeth Whitening (Cosmetic)</option>
                                            <option value="Braces (Orthodontics)">Braces (Orthodontics)</option>
                                            <option value="Cavity Restorative">Cavity Restorative & Filling</option>
                                            <option value="Root Canal Treatment (RCT)">Root Canal Treatment (RCT)</option>
                                            <option value="Scaling & Deep Cleaning">Scaling & Deep Cleaning</option>
                                            <option value="Crown & Bridge Prosthesis">Crown & Bridge Prosthesis</option>
                                        </select>
                                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-text">
                                            ▼
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 6: Medical Alerts & Allergy Quick Tags (Compact Pill Strip) */}
                            <div className="bg-[#FAFBFD] border border-light-teal/40 rounded-xl px-3 py-2 space-y-1">
                                <div className="flex justify-between items-center ml-0.5">
                                    <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider flex items-center gap-1">
                                        <HeartPulse className="w-3 h-3 text-rose-500" /> Medical Alerts & Allergies
                                    </label>
                                    <span className="text-[8.5px] text-muted-text font-bold">Click to tag</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {["No Known Allergies", "Penicillin Allergy", "Latex Sensitive", "Hypertension", "Diabetic", "Local Anesthetic", "Aspirin/NSAID"].map(tag => {
                                        const isSelected = newPatient.selectedAllergies?.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    const cur = newPatient.selectedAllergies || [];
                                                    const updated = isSelected ? cur.filter(t => t !== tag) : [...cur, tag];
                                                    setNewPatient({ ...newPatient, selectedAllergies: updated });
                                                }}
                                                className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-rose-500 text-white border-rose-600 shadow-2xs scale-102' 
                                                        : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Row 7: Clinical Intake Notes / Chief Complaint */}
                            <div>
                                <div className="flex justify-between items-center mb-0.5 ml-1">
                                    <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-[#4A7CD2]" /> Chief Complaint / Intake Clinical Notes
                                    </label>
                                    <span className="text-[8.5px] text-muted-text font-bold">Optional</span>
                                </div>
                                <input
                                    type="text"
                                    value={newPatient.medicalNotes}
                                    onChange={e => setNewPatient({ ...newPatient, medicalNotes: e.target.value })}
                                    placeholder="e.g. Patient experiencing sensitivity on upper molar with cold drinks..."
                                    className="w-full border rounded-xl px-3 py-2 text-xs text-dark-slate bg-[#F8FAFC] border-light-teal/50 focus:border-[#4A7CD2] focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 font-medium transition-all"
                                />
                            </div>

                        </form>
                    </div>

                    {/* Bottom Action Row (Fixed at bottom of Left Card) */}
                    <div className="pt-2.5 border-t border-light-teal/20 flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-text">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="text-[11px]">HIPAA & GDPR Encrypted Registry</span>
                        </div>

                        <button 
                            type="button" 
                            onClick={handleCreatePatient}
                            className="px-5 py-2 bg-[#4A7CD2] hover:bg-[#3665B7] text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer flex items-center gap-1.5 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Create Patient Profile</span>
                        </button>
                    </div>

                </div>

                {/* ============================================================ */}
                {/* RIGHT PANEL (~40%): INTERACTIVE AI INTAKE CHATBOT LEDGER */}
                {/* ============================================================ */}
                <div className="w-full lg:w-[42%] xl:w-[40%] bg-white rounded-[2rem] p-5 shadow-xl border border-light-teal/30 flex flex-col h-full overflow-hidden min-h-0 justify-between">
                    
                    {/* Header (Fixed at top of Right Card) */}
                    <div className="border-b border-light-teal/20 pb-3 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#4A7CD2] text-white flex items-center justify-center shadow-xs">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-xs font-extrabold text-[#10244B] uppercase tracking-wider block">Intake AI Assistant</span>
                                <span className="text-[9.5px] text-emerald-600 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Conversational Sync
                                </span>
                            </div>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={toggleRecording}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                isRecording 
                                    ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' 
                                    : 'bg-[#EAF0FC] text-[#4A7CD2] border-light-teal hover:bg-light-teal/30'
                            }`}
                        >
                            {isRecording ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                            <span>{isRecording ? 'Listening...' : 'Voice Mic'}</span>
                        </button>
                    </div>

                    {/* Chat Messages List (Internally Scrollable Feed) */}
                    <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto pr-1 py-2.5 space-y-2.5 min-h-0">
                        {messages.map((m) => {
                            const isDoc = m.sender === 'doctor';
                            return (
                                <div key={m.id} className={`flex items-start gap-2.5 ${isDoc ? 'justify-end' : ''}`}>
                                    {!isDoc && (
                                        <div className="w-7 h-7 rounded-full bg-[#4A7CD2] text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-xs">
                                            AI
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                                        isDoc 
                                            ? 'bg-[#EAF0FC] text-[#10244B] rounded-tr-none font-bold' 
                                            : 'bg-[#F4F6FA] text-dark-slate rounded-tl-none font-semibold'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{m.text}</p>
                                        
                                        {/* Suggestions Pill Chips */}
                                        {m.suggestions && (
                                            <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                                                {m.suggestions.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSendMessage(null, s)}
                                                        className="text-[10px] bg-white border border-[#4A7CD2]/30 text-[#4A7CD2] px-2.5 py-1 rounded-lg font-bold hover:bg-[#EAF0FC] transition-colors cursor-pointer"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quick Confirm & Save Action in Chat */}
                                        {m.actionType === 'confirm_save' && (
                                            <div className="mt-2.5 bg-white p-2.5 rounded-xl border border-emerald-200 space-y-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleCreatePatient()}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-2 rounded-lg font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Open Dental Chart
                                                </button>
                                            </div>
                                        )}

                                        {/* View Existing Duplicate Patient Action */}
                                        {m.actionType === 'view_existing' && m.existingPatientId && (
                                            <div className="mt-2.5 bg-white p-2.5 rounded-xl border border-amber-200 space-y-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => navigate(`/chart/${m.existingPatientId}`)}
                                                    className="w-full bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-[11px] py-2 rounded-lg font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" /> View Existing Dental Chart (#{m.existingPatientId})
                                                </button>
                                            </div>
                                        )}

                                        <span className="text-[8px] text-muted-text block mt-1 text-right">{m.time}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* AI Typing Indicator */}
                        {aiLoading && (
                            <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#4A7CD2] text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                    AI
                                </div>
                                <div className="p-2.5 bg-[#F4F6FA] text-dark-slate rounded-2xl rounded-tl-none text-xs flex items-center gap-2 font-bold">
                                    <Loader2 className="w-3.5 h-3.5 text-[#4A7CD2] animate-spin" />
                                    <span>AI is syncing patient fields...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Voice Dictation Stream Bar */}
                    {isRecording && (
                        <div className="bg-[#EAF0FC] border border-[#4A7CD2]/40 p-2 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-2xs mb-2 flex-shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                                <p className="text-[10.5px] font-black text-[#10244B] truncate">
                                    {chatInput ? `🎙️ "${chatInput}"` : "🎙️ Listening... Speak patient details now"}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="w-1 bg-[#4A7CD2] rounded-full animate-pulse" style={{ height: `${5 + (i % 3) * 5}px`, animationDelay: `${i * 120}ms` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat Input Form (Always Anchored at Bottom of Card, 100% visible) */}
                    <form onSubmit={handleSendMessage} className="pt-2.5 border-t border-light-teal/20 flex gap-2 items-center flex-shrink-0 bg-white">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Type patient name, DOB, phone, address..."
                            className="flex-grow bg-[#F4F6FA] border border-[#EAF0FC] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 text-dark-slate font-bold placeholder-muted-text/70 shadow-inner"
                        />
                        
                        <button 
                            type="button" 
                            onClick={toggleRecording}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center ${
                                isRecording 
                                    ? 'bg-rose-500 border-rose-600 text-white shadow-md animate-pulse ring-2 ring-rose-300' 
                                    : 'bg-[#EAF0FC] border-[#4A7CD2]/30 text-[#4A7CD2] hover:bg-[#D5E1F7] hover:border-[#4A7CD2]'
                            }`}
                            title={isRecording ? "Listening... Click to stop recording" : "Click to dictate patient details using microphone"}
                        >
                            {isRecording ? (
                                <Mic className="w-4 h-4 animate-pulse text-white" />
                            ) : (
                                <Mic className="w-4 h-4 text-[#4A7CD2]" />
                            )}
                        </button>

                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || aiLoading}
                            className="p-2.5 bg-[#4A7CD2] hover:bg-[#3665B7] disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
                            title="Send message to AI"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                </div>

            </main>

            <div className="flex-shrink-0">
                <Footer />
            </div>
        </div>
    );
}

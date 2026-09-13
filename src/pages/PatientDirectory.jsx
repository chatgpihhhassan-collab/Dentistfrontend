import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { 
    Search, ChevronLeft, ChevronRight, Plus, Calendar, Clock, 
    Sparkles, Activity, CheckCircle2, Save, Loader2, Smile, ShieldAlert, Check, X, RotateCcw,
    Download, FileText, Filter, Eye, ChevronDown, RefreshCw, Pencil, Camera, UploadCloud, Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import '../index.css';
import { getPatientAvatarUrl, validateImageFile, fileToDataUrl } from '../utils/avatarUtils';
import { preloadJawImages, preloadPatientJawTemplates } from '../utils/jawImagePreloader';
import { fetchWithCache, prefetchApi, invalidateCache, setCachedData } from '../utils/apiCache';
import FullPageSkeletonLoader from '../components/FullPageSkeletonLoader';

export default function PatientDirectory() {
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [doctor, setDoctor] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const navigate = useNavigate();
    const editFileInputRef = useRef(null);

    // 🌟 100% Coordinated Full-Page Loading & Synchronization States
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(15);
    const [loadStatusMessage, setLoadStatusMessage] = useState('Initializing clinician security session...');
    const [isReadyBadgeVisible, setIsReadyBadgeVisible] = useState(false);
    const [isSlowConnection, setIsSlowConnection] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const patientsPerPage = 5;

    const [upcomingPage, setUpcomingPage] = useState(1);
    const upcomingPerPage = 5;

    const [pastPage, setPastPage] = useState(1);
    const pastPerPage = 5;

    const [selectedTeethState, setSelectedTeethState] = useState([]);
    const [clinicalLogs, setClinicalLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
    const [logsSearchFilter, setLogsSearchFilter] = useState('');
    const [logsTypeFilter, setLogsTypeFilter] = useState('ALL');
    const [dentitionFilter, setDentitionFilter] = useState('ALL'); // 'ALL' | 'ADULT' | 'PEDIATRIC' | 'MIXED'

    // Consultation Treatment Modality Tagger States
    const [activeTreatmentTag, setActiveTreatmentTag] = useState(null); // 'braces' | 'whitening' | 'cavity' | null
    const [isTreatmentDrawerOpen, setIsTreatmentDrawerOpen] = useState(false);
    const autoHideTimerRef = useRef(null);

    const [bracesStage, setBracesStage] = useState('Stage 2 - Space Closure');
    const [bracesWire, setBracesWire] = useState('0.016x0.022 SS');
    const [whiteningPreShade, setWhiteningPreShade] = useState('A3.5');
    const [whiteningTargetShade, setWhiteningTargetShade] = useState('B1');
    const [whiteningSession, setWhiteningSession] = useState('Session 1 of 3');
    const [cavityTooth, setCavityTooth] = useState('14');
    const [cavityMaterial, setCavityMaterial] = useState('Composite Resin');
    const [savingTreatment, setSavingTreatment] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Edit Patient Info Modal States
    const [editPatientModal, setEditPatientModal] = useState({ visible: false, patient: null });
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        phone: '',
        email: '',
        gender: 'Male',
        address: '',
        region: 'South Region',
        profileImageDataUrl: null,
        profileImageMimeType: null
    });
    const [savingEdit, setSavingEdit] = useState(false);

    const handleEditImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            showToast(validation.error, 'error');
            if (editFileInputRef.current) editFileInputRef.current.value = '';
            return;
        }

        try {
            const dataUrl = await fileToDataUrl(file);
            setEditForm(prev => ({
                ...prev,
                profileImageDataUrl: dataUrl,
                profileImageMimeType: file.type || 'image/jpeg'
            }));
            showToast("📸 Profile photo attached (<= 5MB verified)", "success");
        } catch (err) {
            console.error("Failed to read image:", err);
            showToast("Could not process image file.", "error");
        }
    };

    const handleEditImageRemove = () => {
        setEditForm(prev => ({
            ...prev,
            profileImageDataUrl: null,
            profileImageMimeType: null
        }));
        if (editFileInputRef.current) editFileInputRef.current.value = '';
        showToast("Profile image removed. Reverted to default avatar.", "info");
    };

    const handleOpenEditPatient = (p) => {
        if (!p) return;
        const dobStr = p.dob ? new Date(p.dob).toISOString().slice(0, 10) : '';
        setEditForm({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            dob: dobStr,
            phone: p.phone || '',
            email: p.email || '',
            gender: p.gender || 'Male',
            address: p.address || '',
            region: p.region || 'South Region',
            profileImageDataUrl: p.profileImageDataUrl || (p.profileImage ? `data:${p.profileImageMimeType || 'image/jpeg'};base64,${p.profileImage}` : null),
            profileImageMimeType: p.profileImageMimeType || null
        });
        setEditPatientModal({ visible: true, patient: p });
    };

    const handleSavePatientEdit = async (e) => {
        e.preventDefault();
        if (!editPatientModal.patient) return;
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/patients/${editPatientModal.patient.patientID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editPatientModal.patient,
                    ...editForm,
                    dob: editForm.dob ? new Date(editForm.dob).toISOString() : null
                })
            });
            if (res.ok) {
                const updated = {
                    ...editPatientModal.patient,
                    ...editForm,
                    dob: editForm.dob ? new Date(editForm.dob).toISOString() : null
                };
                setPatients(prev => prev.map(p => p.patientID === updated.patientID ? updated : p));
                if (selectedPatient && selectedPatient.patientID === updated.patientID) {
                    setSelectedPatient(prev => ({ ...prev, ...updated }));
                }
                invalidateCache('doctor_' + (doctor?.doctorID || '') + '_patients');
                invalidateCache(`patient_${updated.patientID}`);
                setCachedData(`patient_${updated.patientID}`, updated);
                setEditPatientModal({ visible: false, patient: null });
                showToast('Patient information updated successfully!');
            } else {
                const errMsg = await res.text().catch(() => "");
                showToast(errMsg || 'Failed to update patient info', 'error');
            }
        } catch (err) {
            showToast('Network error while updating patient', 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3200);
    };

    const resetAutoHideTimer = () => {
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = setTimeout(() => {
            setIsTreatmentDrawerOpen(false);
        }, 15000); // 15 seconds of inactivity auto-hide
    };

    const handleSelectModality = (tag) => {
        if (activeTreatmentTag === tag) {
            if (isTreatmentDrawerOpen) {
                setIsTreatmentDrawerOpen(false);
                if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
            } else {
                setIsTreatmentDrawerOpen(true);
                resetAutoHideTimer();
            }
        } else {
            setActiveTreatmentTag(tag);
            setIsTreatmentDrawerOpen(true);
            resetAutoHideTimer();
        }
    };

    const handleUnselectModality = () => {
        setActiveTreatmentTag(null);
        setIsTreatmentDrawerOpen(false);
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };

    const handleResetTreatmentPlanInDB = async () => {
        if (!selectedPatient) return;
        setSavingTreatment(true);
        try {
            const docId = doctor?.doctorID || 1;
            // 1. Reset treatment plan in Patients table to empty / NULL
            await fetch(`/api/patients/${selectedPatient.patientID}/treatment-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    treatmentPlan: '',
                    treatmentStage: '',
                    targetShade: ''
                })
            });

            // 2. Insert clinical log entry documenting the revert
            await fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorID: docId,
                    message: `Active treatment plan reverted and cleared to standard consultation.`,
                    logType: 'Administrative'
                })
            });

            // 3. Update React states immediately
            setSelectedPatient(prev => ({
                ...prev,
                currentTreatmentPlan: null,
                treatmentStage: null,
                targetShade: null
            }));
            setPatients(prev => prev.map(p => p.patientID === selectedPatient.patientID ? {
                ...p,
                currentTreatmentPlan: null,
                treatmentStage: null,
                targetShade: null
            } : p));

            invalidateCache('doctor_' + (doctor?.doctorID || '') + '_patients');
            invalidateCache(`patient_${selectedPatient.patientID}`);

            setActiveTreatmentTag(null);
            setIsTreatmentDrawerOpen(false);
            if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
            showToast('Treatment plan reverted & reset in database!');
        } catch (err) {
            console.error(err);
            showToast('Failed to revert treatment plan', 'error');
        } finally {
            setSavingTreatment(false);
        }
    };

    const handleRevertToothCavity = async (toothNum) => {
        if (!selectedPatient) return;
        setSavingTreatment(true);
        try {
            const docId = doctor?.doctorID || 1;
            // Revert tooth state to Healthy in DB
            await fetch('/api/patients/teeth/update-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: selectedPatient.patientID,
                    updates: [{
                        toothNumber: parseInt(toothNum),
                        color: '#FFFFFF',
                        status: 'Healthy',
                        comment: 'Restored / Cavity cleared by doctor'
                    }]
                })
            });

            await fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorID: docId,
                    message: `Tooth #${toothNum} cavity mark reverted to healthy.`,
                    logType: 'Restorative'
                })
            });

            fetchPatientChart(selectedPatient.patientID);
            showToast(`Tooth #${toothNum} cavity removed & chart reverted!`);
        } catch (err) {
            console.error(err);
            showToast('Failed to revert tooth cavity', 'error');
        } finally {
            setSavingTreatment(false);
        }
    };

    useEffect(() => {
        // Speculatively preload jaw arch templates in background during idle moments
        const preloadTimer = setTimeout(() => {
            preloadJawImages();
        }, 1200);

        return () => {
            clearTimeout(preloadTimer);
            if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        };
    }, []);

    const patientChartsCacheRef = useRef({});
    const fetchPatientChart = (pId) => {
        if (!pId) return;
        if (patientChartsCacheRef.current[pId]) {
            setSelectedTeethState(patientChartsCacheRef.current[pId]);
            return;
        }
        fetch(`/api/patients/${pId}/chart`)
            .then(res => res.json())
            .then(data => {
                const safeData = Array.isArray(data) ? data : [];
                patientChartsCacheRef.current[pId] = safeData;
                setSelectedTeethState(safeData);
            })
            .catch(err => console.error(err));
    };

    const handleExportLogsPDF = async () => {
        if (!selectedPatient) {
            showToast('Please select a patient first', 'error');
            return;
        }

        let exportLogs = clinicalLogs;
        if (!exportLogs || exportLogs.length === 0) {
            try {
                const res = await fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        exportLogs = data;
                        setClinicalLogs(data);
                    }
                }
            } catch (e) {}
        }
        exportLogs = Array.isArray(exportLogs) ? exportLogs : [];

        const pName = `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() || 'Patient';
        const pId = selectedPatient.patientID || 'N/A';
        const docName = `Dr. ${doctor?.firstName || doctor?.name || 'Ahmed'}`;
        const exportDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const exportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);

            const drawHeader = (pageNumber) => {
                pdf.setFillColor(16, 36, 75); // Dark Navy #10244B
                pdf.rect(0, 0, pageWidth, 18, 'F');
                
                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(11);
                pdf.text('DENTIA CLINICAL ACTIVITY & AUDIT LOGS', margin, 12);

                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`PATIENT #${pId} · Page ${pageNumber}`, pageWidth - margin, 12, { align: 'right' });
            };

            const drawFooter = () => {
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(148, 163, 184);
                pdf.text('Confidential Clinical Audit Record · Generated by Dentia Dental Practice Management', margin, pageHeight - 8);
            };

            let pageNumber = 1;
            drawHeader(pageNumber);
            drawFooter();

            // Patient Metadata Box
            pdf.setFillColor(248, 250, 252);
            pdf.setDrawColor(213, 225, 247);
            pdf.roundedRect(margin, 23, contentWidth, 24, 2, 2, 'FD');

            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PATIENT NAME:', margin + 4, 30);
            pdf.text('ATTENDING DENTIST:', margin + 96, 30);
            pdf.text('AGE / GENDER:', margin + 4, 38);
            pdf.text('REPORT GENERATED:', margin + 96, 38);
            pdf.text('TOTAL LOG RECORDS:', margin + 4, 44);

            pdf.setTextColor(16, 36, 75);
            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${pName} (ID #${pId})`, margin + 32, 30);
            pdf.text(docName, margin + 128, 30);
            pdf.text(`${getAge(selectedPatient.dob)} yrs · ${selectedPatient.gender || 'Unspecified'}`, margin + 32, 38);
            pdf.text(`${exportDate} ${exportTime}`, margin + 128, 38);
            pdf.text(`${exportLogs.length} Entries`, margin + 32, 44);

            let currentY = 54;

            if (exportLogs.length === 0) {
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(9);
                pdf.setTextColor(148, 163, 184);
                pdf.text('No clinical activity logs recorded for this patient yet.', margin + 4, currentY + 10);
            } else {
                exportLogs.forEach((log, index) => {
                    if (currentY > pageHeight - 35) {
                        pdf.addPage();
                        pageNumber++;
                        drawHeader(pageNumber);
                        drawFooter();
                        currentY = 26;
                    }

                    const logType = (log.logType || log.LogType || 'General').toUpperCase();
                    const msg = log.message || log.Message || '';
                    const dt = log.createdAt || log.CreatedAt;
                    const d = dt ? new Date(dt) : null;
                    const timeString = d 
                        ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Recent';

                    // Section Card Background
                    pdf.setFillColor(248, 250, 252);
                    pdf.setDrawColor(226, 232, 240);
                    pdf.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'FD');

                    // Left Type Accent Line
                    pdf.setFillColor(74, 124, 210);
                    pdf.rect(margin, currentY, 2.5, 16, 'F');

                    // Badge
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7.5);
                    pdf.setTextColor(74, 124, 210);
                    pdf.text(`[ ${logType} ]`, margin + 6, currentY + 5.5);

                    // Timestamp
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(7);
                    pdf.setTextColor(148, 163, 184);
                    pdf.text(timeString, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

                    // Message Content
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(30, 41, 59);
                    const wrappedMsg = pdf.splitTextToSize(msg, contentWidth - 10);
                    pdf.text(wrappedMsg, margin + 6, currentY + 11);

                    currentY += Math.max(18, 11 + (wrappedMsg.length * 4));
                });
            }

            // Doctor Sign-off
            if (currentY > pageHeight - 28) {
                pdf.addPage();
                pageNumber++;
                drawHeader(pageNumber);
                drawFooter();
                currentY = 26;
            } else {
                currentY = Math.max(currentY + 8, pageHeight - 26);
            }

            pdf.setDrawColor(148, 163, 184);
            pdf.setLineDashPattern([1.5, 1.5], 0);
            pdf.line(pageWidth - margin - 60, currentY, pageWidth - margin, currentY);
            pdf.setLineDashPattern([], 0);

            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(16, 36, 75);
            pdf.text(docName, pageWidth - margin - 30, currentY + 4, { align: 'center' });

            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139);
            pdf.text('Authorizing Dental Practitioner', pageWidth - margin - 30, currentY + 7.5, { align: 'center' });

            // Open in new tab and download
            const pdfBlob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            window.open(blobUrl, '_blank');
            pdf.save(`Clinical_Logs_${pName.replace(/\s+/g, '_')}_#${pId}.pdf`);

            showToast('Clinical Logs PDF generated & opened successfully!');
        } catch (err) {
            console.error('PDF export failed:', err);
            showToast('Failed to export PDF', 'error');
        }
    };

    useEffect(() => {
        if (!selectedPatient) {
            setSelectedTeethState([]);
            setActiveTreatmentTag(null);
            setIsTreatmentDrawerOpen(false);
            return;
        }

        // Speculatively preload jaw templates for patient's dentition type (adult vs pediatric)
        const pAge = selectedPatient.dob ? (new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()) : null;
        const isPed = (pAge !== null && pAge < 6) || (selectedPatient.dentitionType || '').toLowerCase() === 'pediatric';
        preloadPatientJawTemplates(isPed ? 'pediatric' : 'adult');

        fetchPatientChart(selectedPatient.patientID);
        setIsTreatmentDrawerOpen(false);
        
        // Auto-select patient's saved treatment and restore stage/wire if available
        const plan = selectedPatient.currentTreatmentPlan?.toLowerCase() || '';
        const stage = selectedPatient.treatmentStage || '';
        const shade = selectedPatient.targetShade || '';

        if (plan.includes('brace')) {
            setActiveTreatmentTag('braces');
            if (stage) {
                if (stage.includes('Stage 1')) setBracesStage('Stage 1 (Leveling)');
                else if (stage.includes('Stage 2')) setBracesStage('Stage 2 (Closure)');
                else if (stage.includes('Stage 3')) setBracesStage('Stage 3 (Finishing)');
                else setBracesStage(stage);
            }
            if (shade) {
                setBracesWire(shade);
            }
        } else if (plan.includes('whiten')) {
            setActiveTreatmentTag('whitening');
            if (stage) setWhiteningSession(stage);
            if (shade && shade.includes('Initial:')) {
                // Parse pre and target shade
                const parts = shade.split('➔');
                if (parts[0]) setWhiteningPreShade(parts[0].replace('Initial:', '').trim());
                if (parts[1]) setWhiteningTargetShade(parts[1].replace('Target:', '').trim());
            }
        } else if (plan.includes('cavit')) {
            setActiveTreatmentTag('cavity');
        } else {
            setActiveTreatmentTag(null);
        }
    }, [selectedPatient]);

    useEffect(() => {
        const stored = localStorage.getItem('doctor');
        if (!stored) {
            navigate('/');
            return;
        }
        const docInfo = JSON.parse(stored);
        setDoctor(docInfo);

        let isCancelled = false;
        setIsPageLoading(true);
        setLoadProgress(20);
        setLoadStatusMessage('Doctor authenticated. Requesting patient directory...');

        // Timeout guard: If network takes > 7s on slow connection, provide status & bypass
        const slowTimer = setTimeout(() => {
            if (!isCancelled) setIsSlowConnection(true);
        }, 7000);

        const fetchPatients = fetchWithCache(
            `doctor_${docInfo.doctorID}_patients`,
            () => fetch(`/api/patients/doctor/${docInfo.doctorID}`).then(res => res.ok ? res.json() : [])
        ).then(({ data, fromCache }) => {
            if (isCancelled) return [];
            setPatients(data || []);
            if (data && data.length > 0) {
                setSelectedPatient(prev => prev || data[0]);
                // Speculatively prefetch top patient chart & prescriptions for instant click-through
                const topP = data[0];
                prefetchApi(`patient_${topP.patientID}`, () => fetch(`/api/patients/${topP.patientID}`).then(r => r.json()));
                prefetchApi(`patient_${topP.patientID}_chart`, () => fetch(`/api/patients/${topP.patientID}/chart`).then(r => r.json()));
                prefetchApi(`patient_${topP.patientID}_prescriptions`, () => fetch(`/api/patients/${topP.patientID}/prescriptions`).then(r => r.json()));
            }
            if (fromCache) {
                setLoadProgress(prev => Math.max(prev, 85));
            } else {
                setLoadProgress(prev => Math.max(prev, 55));
            }
            setLoadStatusMessage('Patient profiles loaded. Retrieving clinic schedule...');
            return data;
        }).catch(err => {
            console.error("Patients load error:", err);
            return [];
        });

        const fetchAppts = fetchWithCache(
            `doctor_${docInfo.doctorID}_appointments`,
            () => fetch(`/api/appointments?doctorId=${docInfo.doctorID}`).then(res => res.ok ? res.json() : [])
        ).then(({ data, fromCache }) => {
            if (isCancelled) return [];
            setAppointments(data || []);
            if (fromCache) {
                setLoadProgress(prev => Math.max(prev, 100));
            } else {
                setLoadProgress(prev => Math.max(prev, 80));
            }
            setLoadStatusMessage('Appointments synchronized. Finalizing clinic database...');
            return data;
        }).catch(err => {
            console.error("Appointments load error:", err);
            return [];
        });

        Promise.allSettled([fetchPatients, fetchAppts]).then(([pRes, aRes]) => {
            if (isCancelled) return;
            clearTimeout(slowTimer);
            setLoadProgress(100);
            setLoadStatusMessage('✓ Clinic Records 100% Ready — All Systems Synchronized');
            
            const isInstant = pRes?.status === 'fulfilled' && aRes?.status === 'fulfilled';
            setTimeout(() => {
                if (isCancelled) return;
                setIsPageLoading(false);
                setIsReadyBadgeVisible(true);
                setTimeout(() => {
                    if (!isCancelled) setIsReadyBadgeVisible(false);
                }, 2800);
            }, isInstant ? 150 : 350);
        });

        return () => {
            isCancelled = true;
            clearTimeout(slowTimer);
        };
    }, [navigate]);

    useEffect(() => {
        if (!selectedPatient?.patientID) {
            setClinicalLogs([]);
            return;
        }
        // Defer clinical logs fetching: Only fetch if clinical logs drawer is actually open
        if (!isLogsDrawerOpen) return;

        setLoadingLogs(true);
        fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                setClinicalLogs(Array.isArray(data) ? data : []);
                setLoadingLogs(false);
            })
            .catch(err => {
                console.error("Clinical logs fetch failed:", err);
                setLoadingLogs(false);
            });
    }, [selectedPatient, isLogsDrawerOpen]);

    const cleanSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

    // Calculate age from date of birth
    const getAge = (dobString) => {
        if (!dobString) return null;
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return null;
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference); 
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const getFilteredPatientsByTab = useCallback((tabId, searchStr = '') => {
        const cSearch = (searchStr || '').trim().toLowerCase();
        return patients.filter(p => {
            const matchesQuery = !cSearch || (
                (p.firstName && p.firstName.toLowerCase().includes(cSearch)) || 
                (p.lastName && p.lastName.toLowerCase().includes(cSearch)) || 
                (`${p.firstName} ${p.lastName}`.toLowerCase().includes(cSearch)) ||
                (p.patientID && p.patientID.toString().includes(cSearch.replace('#', ''))) ||
                (p.phone && p.phone.includes(cSearch)) ||
                (p.nhiNumber && p.nhiNumber.toLowerCase().includes(cSearch)) ||
                (p.currentTreatmentPlan && p.currentTreatmentPlan.toLowerCase().includes(cSearch)) ||
                (p.city && p.city.toLowerCase().includes(cSearch))
            );
            if (!matchesQuery) return false;

            const age = getAge(p.dob);
            const pType = (p.dentitionType || '').toLowerCase();
            if (tabId === 'PEDIATRIC') {
                return (age !== null && age < 6) || pType === 'pediatric';
            }
            if (tabId === 'MIXED') {
                return (age !== null && age >= 6 && age <= 12) || pType === 'mixed';
            }
            if (tabId === 'ADULT') {
                return (age !== null && age > 12) || pType === 'permanent' || (!p.dob && !p.dentitionType);
            }
            return true;
        });
    }, [patients]);

    const filteredPatients = useMemo(() => {
        return getFilteredPatientsByTab(dentitionFilter, cleanSearch);
    }, [getFilteredPatientsByTab, dentitionFilter, cleanSearch]);

    // Automatically select the top first patient whenever dentitionFilter tab changes
    useEffect(() => {
        if (!patients || patients.length === 0) return;
        const topList = getFilteredPatientsByTab(dentitionFilter, cleanSearch);
        if (topList.length > 0) {
            setSelectedPatient(topList[0]);
        } else {
            setSelectedPatient(null);
        }
    }, [dentitionFilter]);

    // Automatically select the top matching patient when search term changes
    useEffect(() => {
        if (!patients || patients.length === 0) return;
        if (!cleanSearch) return;
        const topList = getFilteredPatientsByTab(dentitionFilter, cleanSearch);
        if (topList.length > 0) {
            const isCurrentInList = topList.some(p => p.patientID === selectedPatient?.patientID);
            if (!isCurrentInList) {
                setSelectedPatient(topList[0]);
            }
        } else {
            setSelectedPatient(null);
        }
    }, [cleanSearch]);

    // Pagination Logic
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = useMemo(() => {
        return filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
    }, [filteredPatients, indexOfFirstPatient, indexOfLastPatient]);
    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

    // Helper: Search match across appointment properties
    const matchesSearchAppt = useCallback((app) => {
        if (!cleanSearch) return true;
        return (
            (app.fullName && app.fullName.toLowerCase().includes(cleanSearch)) ||
            (app.reason && app.reason.toLowerCase().includes(cleanSearch)) ||
            (app.status && app.status.toLowerCase().includes(cleanSearch)) ||
            (app.phone && app.phone.includes(cleanSearch)) ||
            (app.appointmentID && app.appointmentID.toString().includes(cleanSearch.replace('#', ''))) ||
            (app.notes && app.notes.toLowerCase().includes(cleanSearch))
        );
    }, [cleanSearch]);

    // Filter appointments into old (completed/past) and new (upcoming: Pending & Confirmed only) - with live search memoized
    const newAppointments = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(app => new Date(app.preferredDate) >= now && (app.status === 'Pending' || app.status === 'Confirmed'))
            .filter(matchesSearchAppt)
            .sort((a, b) => new Date(b.preferredDate) - new Date(a.preferredDate) || b.appointmentID - a.appointmentID);
    }, [appointments, matchesSearchAppt]);

    const oldAppointments = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(app => new Date(app.preferredDate) < now && app.status !== 'Rejected' && app.status !== 'Cancelled')
            .filter(matchesSearchAppt)
            .sort((a, b) => new Date(b.preferredDate) - new Date(a.preferredDate) || b.appointmentID - a.appointmentID);
    }, [appointments, matchesSearchAppt]);

    // Paginate upcoming appointments (5 per page)
    const indexOfLastUpcoming = upcomingPage * upcomingPerPage;
    const indexOfFirstUpcoming = indexOfLastUpcoming - upcomingPerPage;
    const currentUpcoming = useMemo(() => {
        return newAppointments.slice(indexOfFirstUpcoming, indexOfLastUpcoming);
    }, [newAppointments, indexOfFirstUpcoming, indexOfLastUpcoming]);
    const totalUpcomingPages = Math.ceil(newAppointments.length / upcomingPerPage);

    // Paginate past sessions (5 per page)
    const indexOfLastPast = pastPage * pastPerPage;
    const indexOfFirstPast = indexOfLastPast - pastPerPage;
    const currentPast = useMemo(() => {
        return oldAppointments.slice(indexOfFirstPast, indexOfLastPast);
    }, [oldAppointments, indexOfFirstPast, indexOfLastPast]);
    const totalPastPages = Math.ceil(oldAppointments.length / pastPerPage);

    return (
        <div className="min-h-screen bg-[#F4F6FA] text-dark-slate flex flex-col font-sans selection:bg-light-teal selection:text-primary-teal relative overflow-x-hidden">
            <Navigation />

            {/* 🌟 100% CLINICAL FULL-PAGE SKELETON LOADING (NO BACKEND BLUR) 🌟 */}
            {isPageLoading && (
                <FullPageSkeletonLoader 
                    title="Getting your patient directory ready."
                    subtitle="Syncing patient records, appointments, and diagnostic logs..."
                    progress={loadProgress}
                    status={loadStatusMessage}
                    slowConnection={isSlowConnection}
                    onContinueAnyway={() => setIsPageLoading(false)}
                />
            )}

            {/* 🌟 100% READY FLOATING CONFIRMATION BADGE 🌟 */}
            {isReadyBadgeVisible && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-emerald-400/40">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Clinic Directory 100% Ready — All Records Synchronized</span>
                </div>
            )}

            {/* Main Dashboard Layout matching reference image */}
            <main className="flex-grow max-w-[1800px] w-full mx-auto px-4 py-8 space-y-6">
                
                {/* Search Header and Greeting */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-dark-slate flex items-center gap-1.5">
                            Good Morning <span className="text-[#4A7CD2]">Dr. {doctor?.lastName || 'Doctor'} 👋</span>
                        </h2>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Find Patients or Appointments..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAF0FC] rounded-full text-xs font-bold text-dark-slate placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 shadow-sm" 
                        />
                    </div>
                </div>

                {/* Dashboard Grid blocks split: Left Content Panel & Right Schedule Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Side Content Blocks (Stats + Split Patient List & Consultation Card) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* 1. Today's Patient Visits Stats Card (Modernized Pro Clinical Showcase) */}
                        <div className="bg-white rounded-[2rem] border border-[#EAF0FC] p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-end overflow-hidden relative">
                            {/* Left Metrics */}
                            <div className="md:col-span-7 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-muted-text uppercase tracking-widest block">Today's Patient Visits</span>
                                </div>
                                <h3 className="text-5xl font-extrabold text-dark-slate tracking-tight">
                                    {patients.length} <span className="text-xs text-muted-text font-bold">/person</span>
                                </h3>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div className="bg-[#EAF0FC] border border-light-teal/55 p-3 rounded-2xl flex-1 min-w-[120px] transition hover:shadow-xs">
                                        <span className="text-[10px] font-bold text-[#4A7CD2] block">New Patients</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xl font-bold text-dark-slate">{patients.length}</span>
                                            <span className="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">51% ↗</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#FDF2F4] border border-red-50 p-3 rounded-2xl flex-1 min-w-[120px] transition hover:shadow-xs">
                                        <span className="text-[10px] font-bold text-pink-600 block">Returning Patients</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xl font-bold text-dark-slate">0</span>
                                            <span className="bg-pink-50/50 text-pink-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-pink-100">0% ↘</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Animated 3D Holographic AI Dental Hub (Aligned Flush with Returning Patient Block) */}
                            <div className="md:col-span-5 flex flex-col justify-end w-full">
                                <div className="w-full bg-gradient-to-l from-[#BFDBFE] via-[#DBEAFE] to-[#F0F6FF] rounded-3xl py-2.5 px-4 sm:px-5 border border-[#4A7CD2]/30 shadow-xs relative overflow-hidden group hover:border-[#4A7CD2]/50 transition-all duration-500">
                                    {/* Tech Mesh Background Grid */}
                                    <div className="absolute inset-0 bg-[radial-gradient(#4A7CD2_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none"></div>
                                    
                                    {/* Glowing Ambient Radial Cones */}
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#3B82F6]/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all duration-700"></div>
                                    <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-[#6366F1]/15 rounded-full blur-2xl pointer-events-none"></div>

                                    <div className="flex items-center justify-between gap-3 relative z-10">
                                        {/* Left AI Telemetry Info */}
                                        <div className="space-y-1.5">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/90 shadow-2xs border border-[#4A7CD2]/25">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">AI SCANNER LIVE</span>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>Enamel Density</span>
                                                    <span className="text-[#2563EB] font-extrabold text-xs">99.4%</span>
                                                </h4>
                                                <p className="text-[9.5px] text-slate-600 font-medium">Precision Health Diagnostic</p>
                                            </div>

                                            <div className="pt-0">
                                                <span className="inline-flex items-center gap-1 text-[8.5px] font-extrabold text-[#2563EB] bg-white/85 border border-[#3B82F6]/30 px-2 py-0.5 rounded-lg shadow-2xs">
                                                    <Activity className="w-2.5 h-2.5 text-[#2563EB] animate-pulse" />
                                                    <span>Zero Pathology</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Pure Animated 3D Holographic Dental Scanner (Compact Height) */}
                                        <div className="relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center flex-shrink-0">
                                            
                                            {/* Outer Rotating Gyroscopic Orbit Ring 1 */}
                                            <div className="absolute inset-0 rounded-full border border-dashed border-[#2563EB]/40 animate-orbit-spin pointer-events-none"></div>
                                            
                                            {/* Inner Counter-Rotating Orbit Ring 2 */}
                                            <div className="absolute inset-1.5 rounded-full border border-blue-500/30 animate-orbit-spin-reverse pointer-events-none">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shadow-[0_0_6px_#2563EB] absolute -top-1 left-1/2 -translate-x-1/2"></div>
                                            </div>

                                            {/* Scanning Laser Beam */}
                                            <div className="absolute left-1.5 right-1.5 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent shadow-[0_0_8px_#2563EB] animate-scan-laser pointer-events-none z-20"></div>

                                            {/* 3D Glossy Holographic Tooth Model */}
                                            <div className="relative z-10 animate-float-tooth drop-shadow-[0_6px_14px_rgba(37,99,235,0.3)] cursor-pointer">
                                                <svg 
                                                    className="w-12 h-12 sm:w-13 sm:h-13" 
                                                    viewBox="0 0 100 100" 
                                                    fill="none" 
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <defs>
                                                        {/* 3D Enamel Gradient */}
                                                        <linearGradient id="tooth3DGradLight" x1="20%" y1="0%" x2="80%" y2="100%">
                                                            <stop offset="0%" stopColor="#FFFFFF" />
                                                            <stop offset="35%" stopColor="#F0F7FF" />
                                                            <stop offset="70%" stopColor="#BAE6FD" />
                                                            <stop offset="100%" stopColor="#3B82F6" />
                                                        </linearGradient>

                                                        {/* Specular Highlight Gradient */}
                                                        <linearGradient id="toothGleamLight" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                                                        </linearGradient>

                                                        {/* Ambient Shadow Filter */}
                                                        <filter id="glowShadowLight" x="-20%" y="-20%" width="140%" height="140%">
                                                            <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#2563EB" floodOpacity="0.4"/>
                                                        </filter>
                                                    </defs>

                                                    {/* Anatomical 3D Tooth Body */}
                                                    <path 
                                                        d="M26 24 C 20 34, 18 48, 24 64 C 28 74, 34 86, 38 88 C 42 90, 46 84, 48 70 C 50 62, 50 62, 52 70 C 54 84, 58 90, 62 88 C 66 86, 72 74, 76 64 C 82 48, 80 34, 74 24 C 68 14, 58 16, 50 20 C 42 16, 32 14, 26 24 Z" 
                                                        fill="url(#tooth3DGradLight)" 
                                                        filter="url(#glowShadowLight)"
                                                    />

                                                    {/* Specular 3D Gloss Highlight */}
                                                    <path 
                                                        d="M30 26 C 26 34, 25 44, 28 54 C 27 42, 30 32, 36 26 C 42 20, 48 22, 50 24 C 44 20, 35 20, 30 26 Z" 
                                                        fill="url(#toothGleamLight)"
                                                    />

                                                    {/* Enamel Crown Contour Line */}
                                                    <path 
                                                        d="M36 28 C 42 33, 58 33, 64 28" 
                                                        stroke="#FFFFFF" 
                                                        strokeWidth="2.5" 
                                                        strokeLinecap="round" 
                                                        opacity="0.9"
                                                    />

                                                    {/* Floating Hologram Sparkles */}
                                                    <circle cx="20" cy="20" r="2" fill="#2563EB" className="animate-ping" />
                                                    <circle cx="80" cy="28" r="2.5" fill="#60A5FA" />
                                                    <circle cx="78" cy="74" r="1.5" fill="#2563EB" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Side-By-Side Patient List and Consultation detail */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Patient List Card Container */}
                            <div className="bg-white rounded-[2rem] border border-[#EAF0FC] p-6 shadow-sm space-y-4">
                                <div className="flex flex-col gap-2 border-b border-light-teal/20 pb-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-dark-slate flex items-center gap-2">
                                            <span>Patient List</span>
                                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {filteredPatients.length} Active
                                            </span>
                                        </h4>
                                        <span className="text-[10px] font-bold text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded border border-light-teal">Today</span>
                                    </div>

                                    {/* Dentition Classification Filter Tabs */}
                                    <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#EAF0FC]">
                                        {[
                                            { id: 'ALL', label: 'All' },
                                            { id: 'ADULT', label: '🦷 Adult' },
                                            { id: 'PEDIATRIC', label: '👶 Pediatric' },
                                            { id: 'MIXED', label: '🔀 Mixed' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => {
                                                    setDentitionFilter(tab.id);
                                                    setCurrentPage(1);
                                                    const tabList = getFilteredPatientsByTab(tab.id, cleanSearch);
                                                    if (tabList.length > 0) {
                                                        setSelectedPatient(tabList[0]);
                                                    } else {
                                                        setSelectedPatient(null);
                                                    }
                                                }}
                                                className={`flex-1 py-1 rounded-lg text-[9.5px] font-black transition-all cursor-pointer text-center ${
                                                    dentitionFilter === tab.id
                                                        ? 'bg-[#4A7CD2] text-white shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 h-[360px] flex flex-col justify-between">
                                    <div className="space-y-3 flex-grow">
                                        {currentPatients.length === 0 ? (
                                            <p className="text-xs text-muted-text italic text-center py-6">No patient files found.</p>
                                        ) : (
                                            currentPatients.map((p) => {
                                                const isSelected = selectedPatient?.patientID === p.patientID;
                                                const patientAppt = appointments.find(app => app.patientID === p.patientID);
                                                const appTime = patientAppt 
                                                    ? new Date(patientAppt.preferredDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : null;
                                                const pAge = getAge(p.dob);
                                                const isPed = (pAge !== null && pAge < 6) || (p.dentitionType || '').toLowerCase() === 'pediatric';
                                                const isMix = (pAge !== null && pAge >= 6 && pAge <= 12) || (p.dentitionType || '').toLowerCase() === 'mixed';

                                                return (
                                                    <div 
                                                        key={p.patientID}
                                                        onClick={() => setSelectedPatient(p)}
                                                        onPointerEnter={() => {
                                                            preloadPatientJawTemplates(isPed ? 'pediatric' : 'adult');
                                                            prefetchApi(`patient_${p.patientID}`, () => fetch(`/api/patients/${p.patientID}`).then(r => r.json()));
                                                            prefetchApi(`patient_${p.patientID}_chart`, () => fetch(`/api/patients/${p.patientID}/chart`).then(r => r.json()));
                                                            prefetchApi(`patient_${p.patientID}_prescriptions`, () => fetch(`/api/patients/${p.patientID}/prescriptions`).then(r => r.json()));
                                                        }}
                                                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'bg-[#EAF0FC] border-[#4A7CD2] shadow-sm scale-[1.01]' : 'bg-white border-[#EAF0FC] hover:bg-light-teal/10'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[#4A7CD2]/25 shadow-xs flex-shrink-0 bg-white flex items-center justify-center">
                                                                <img 
                                                                    src={getPatientAvatarUrl(p)} 
                                                                    alt={`${p.firstName} ${p.lastName}`}
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-sm font-extrabold text-[#10244B] flex items-center gap-1.5">
                                                                    <span>{p.firstName} {p.lastName}</span>
                                                                    {isPed ? (
                                                                        <span className="text-[8.5px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                                            👶 Pediatric {pAge !== null ? `(${pAge}y)` : ''}
                                                                        </span>
                                                                    ) : isMix ? (
                                                                        <span className="text-[8.5px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                                                            🔀 Mixed {pAge !== null ? `(${pAge}y)` : ''}
                                                                        </span>
                                                                    ) : pAge !== null ? (
                                                                        <span className="text-[8.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                            Age: {pAge}
                                                                        </span>
                                                                    ) : null}
                                                                </h5>
                                                                <span className="text-[10px] text-muted-text font-black uppercase tracking-wider">Patient ID: #{p.patientID}</span>
                                                            </div>
                                                        </div>
                                                        {appTime ? (
                                                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full transition-all ${
                                                                isSelected 
                                                                    ? 'font-black text-white bg-[#4A7CD2] border border-[#4A7CD2] shadow-xs' 
                                                                    : 'font-bold text-[#4A7CD2] bg-[#EAF0FC] border border-[#4A7CD2]/30'
                                                            }`}>
                                                                {appTime}
                                                            </span>
                                                        ) : (
                                                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full transition-all ${
                                                                isSelected 
                                                                    ? 'font-black text-white bg-[#4A7CD2] border border-[#4A7CD2] shadow-xs' 
                                                                    : 'font-bold text-[#4A7CD2] bg-[#EAF0FC] border border-[#4A7CD2]/25'
                                                            }`}>
                                                                Record
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-between items-center pt-4 border-t border-[#EAF0FC]">
                                            <span className="text-[11px] font-extrabold text-[#4A7CD2] bg-[#EAF0FC] px-2.5 py-1 rounded-full border border-light-teal/65">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    className="p-1.5 rounded-lg border border-[#EAF0FC] disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    className="p-1.5 rounded-lg border border-[#EAF0FC] disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active Consultation Info Block */}
                            <div className="bg-white rounded-[2rem] border border-[#EAF0FC] p-6 shadow-sm space-y-4">
                                <div className="border-b border-light-teal/20 pb-3">
                                    <h4 className="text-sm font-bold text-dark-slate">Consultation</h4>
                                </div>

                                {selectedPatient ? (() => {
                                     const teethList = Array.isArray(selectedTeethState) ? selectedTeethState : [];
                                     
                                     const getSelectedCount = (keywords) => teethList.filter(t => {
                                         const s = ((t.conditionStatus || t.ConditionStatus || t.status || t.Status || t.treatment || t.Treatment || '') + ' ' + (t.comments || t.Comments || '')).toLowerCase();
                                         const c = (t.conditionColor || t.ConditionColor || t.color || t.Color || '').toUpperCase();
                                         return keywords.some(k => {
                                             const lowerK = k.toLowerCase();
                                             if (lowerK.startsWith('#')) {
                                                 return c === k.toUpperCase();
                                             }
                                             return s.includes(lowerK);
                                         });
                                     }).length;

                                     const cariesCount = getSelectedCount(['decay', 'caries', 'damaged', '#EF4444', '#F87171']);
                                     const prosthesisCount = getSelectedCount(['treated', 'prosthesis', 'crown', 'bridge', 'implant', 'filling', '#8B5CF6']);
                                     const cleaningCount = getSelectedCount(['cleaning', 'calculus', 'scaling', 'plaque', '#3B82F6']);
                                     const rctCount = getSelectedCount(['root canal', 'rct', 'endo', 'pulpotomy', '#F59E0B']);
                                     const missingCount = getSelectedCount(['missing', 'extract', '#94A3B8', '#CBD5E1']);
                                     const healthyCount = Math.max(0, 32 - (cariesCount + prosthesisCount + cleaningCount + rctCount + missingCount));

                                     const cariesPct = Math.round((cariesCount / 32) * 100) || 0;
                                     const prosthesisPct = Math.round((prosthesisCount / 32) * 100) || 0;
                                     const cleaningPct = Math.round((cleaningCount / 32) * 100) || 0;
                                     const rctPct = Math.round((rctCount / 32) * 100) || 0;
                                     const missingPct = Math.round((missingCount / 32) * 100) || 0;
                                     const healthyPct = Math.round((healthyCount / 32) * 100) || 0;

                                     return (
                                         <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                   <div className="flex items-center gap-3">
                                                       <div className="w-11 h-11 rounded-2xl overflow-hidden border border-light-teal/50 shadow-xs flex-shrink-0 bg-white flex items-center justify-center">
                                                           <img 
                                                               src={getPatientAvatarUrl(selectedPatient)} 
                                                               alt={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                                                               className="w-full h-full object-cover" 
                                                           />
                                                       </div>
                                                       <div>
                                                           <h5 className="text-sm font-black text-[#10244B]">{selectedPatient.firstName} {selectedPatient.lastName}</h5>
                                                           <span className="text-[10px] text-muted-text font-black uppercase tracking-wider">Age: {getAge(selectedPatient.dob)} • {selectedPatient.gender || 'Male'} • {selectedPatient.phone || 'No Phone'}</span>
                                                       </div>
                                                   </div>
                                                   <button
                                                       type="button"
                                                       onClick={() => handleOpenEditPatient(selectedPatient)}
                                                       className="p-2 bg-blue-50 hover:bg-[#4A7CD2] text-[#4A7CD2] hover:text-white rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                                                       title="Edit Patient Information"
                                                   >
                                                       <Pencil className="w-3.5 h-3.5" />
                                                       <span>Edit</span>
                                                   </button>
                                               </div>

                                             {/* Interactive Treatment Modality Buttons */}
                                             <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black text-muted-text py-1">
                                                 <button
                                                     type="button"
                                                     onClick={() => handleSelectModality('braces')}
                                                     className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 relative ${
                                                         activeTreatmentTag === 'braces'
                                                             ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-200 scale-102 ring-2 ring-sky-300/60'
                                                             : 'bg-light-teal/20 text-dark-slate border-light-teal/30 hover:bg-sky-50 hover:border-sky-300'
                                                     }`}
                                                 >
                                                     <Smile className={`w-3.5 h-3.5 ${activeTreatmentTag === 'braces' ? 'text-white' : 'text-sky-600'}`} />
                                                     <span className="font-extrabold tracking-wide">Braces</span>
                                                     {activeTreatmentTag === 'braces' && (
                                                         <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white rounded-full border-2 border-sky-500"></span>
                                                     )}
                                                 </button>

                                                 <button
                                                     type="button"
                                                     onClick={() => handleSelectModality('whitening')}
                                                     className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 relative ${
                                                         activeTreatmentTag === 'whitening'
                                                             ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200 scale-102 ring-2 ring-amber-300/60'
                                                             : 'bg-light-teal/20 text-dark-slate border-light-teal/30 hover:bg-amber-50 hover:border-amber-300'
                                                     }`}
                                                 >
                                                     <Sparkles className={`w-3.5 h-3.5 ${activeTreatmentTag === 'whitening' ? 'text-white' : 'text-amber-600'}`} />
                                                     <span className="font-extrabold tracking-wide">Whitening</span>
                                                     {activeTreatmentTag === 'whitening' && (
                                                         <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white rounded-full border-2 border-amber-500"></span>
                                                     )}
                                                 </button>

                                                 <button
                                                     type="button"
                                                     onClick={() => handleSelectModality('cavity')}
                                                     className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 relative ${
                                                         activeTreatmentTag === 'cavity'
                                                             ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-200 scale-102 ring-2 ring-rose-300/60'
                                                             : 'bg-light-teal/20 text-dark-slate border-light-teal/30 hover:bg-rose-50 hover:border-rose-300'
                                                     }`}
                                                 >
                                                     <ShieldAlert className={`w-3.5 h-3.5 ${activeTreatmentTag === 'cavity' ? 'text-white' : 'text-rose-600'}`} />
                                                     <span className="font-extrabold tracking-wide">Cavity</span>
                                                     {activeTreatmentTag === 'cavity' && (
                                                         <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white rounded-full border-2 border-rose-500"></span>
                                                     )}
                                                 </button>
                                             </div>

                                             {/* Active Treatment Status Badge with Clean Icon Reset Action */}
                                             {selectedPatient.currentTreatmentPlan && (
                                                 <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl text-[10px] animate-fade-in shadow-2xs">
                                                     <div className="flex items-center gap-1.5 overflow-hidden">
                                                         <span className="font-bold text-muted-text uppercase tracking-wider text-[9px]">Active:</span>
                                                         <span className="font-extrabold text-[#10244B] truncate">{selectedPatient.currentTreatmentPlan}</span>
                                                     </div>
                                                     <div className="flex items-center gap-1.5 flex-shrink-0">
                                                         {selectedPatient.treatmentStage && (
                                                             <span className="bg-sky-100 text-sky-800 font-extrabold px-2 py-0.5 rounded-md text-[9px]">
                                                                 {selectedPatient.treatmentStage}
                                                             </span>
                                                         )}
                                                         <button
                                                             type="button"
                                                             onClick={handleResetTreatmentPlanInDB}
                                                             disabled={savingTreatment}
                                                             className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 cursor-pointer transition-all disabled:opacity-50"
                                                             title="Reset and clear this treatment plan from database"
                                                         >
                                                             <RotateCcw className="w-3 h-3" />
                                                         </button>
                                                     </div>
                                                 </div>
                                             )}

                                             {/* Dynamic Context Mini-Drawers (Auto-hides on Save or after 8s of inactivity) */}
                                             {isTreatmentDrawerOpen && activeTreatmentTag === 'braces' && (
                                                 <div 
                                                     onMouseDown={resetAutoHideTimer}
                                                     onClick={resetAutoHideTimer}
                                                     className="bg-sky-50/70 border border-sky-200 p-3.5 rounded-2xl space-y-3 animate-fade-in transition-all"
                                                 >
                                                     <div className="flex items-center justify-between">
                                                         <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider flex items-center gap-1">
                                                             <Smile className="w-3 h-3 text-sky-600" /> Orthodontic Protocol
                                                         </span>
                                                         <button
                                                             type="button"
                                                             onClick={handleUnselectModality}
                                                             className="text-[9px] font-extrabold text-slate-500 hover:text-rose-600 flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition-colors shadow-2xs"
                                                             title="Close drawer"
                                                         >
                                                             <X className="w-2.5 h-2.5" /> Close
                                                         </button>
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9.5px] font-bold text-sky-900 block">Stage:</label>
                                                         <div className="grid grid-cols-2 gap-1.5">
                                                             {['Stage 1 (Leveling)', 'Stage 2 (Closure)', 'Stage 3 (Finishing)'].map(st => (
                                                                 <button
                                                                     key={st}
                                                                     type="button"
                                                                     onClick={() => { setBracesStage(st); resetAutoHideTimer(); }}
                                                                     className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                                                         bracesStage === st 
                                                                             ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                                                                             : 'bg-white text-dark-slate border-sky-200 hover:bg-sky-100/50'
                                                                     }`}
                                                                 >
                                                                     {st}
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9.5px] font-bold text-sky-900 block">Archwire:</label>
                                                         <div className="flex gap-1.5 flex-wrap">
                                                             {['0.014 NiTi', '0.016 NiTi', '0.016x0.022 SS', 'TMA Wire'].map(w => (
                                                                 <button
                                                                     key={w}
                                                                     type="button"
                                                                     onClick={() => { setBracesWire(w); resetAutoHideTimer(); }}
                                                                     className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                                                         bracesWire === w 
                                                                             ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                                                                             : 'bg-white text-dark-slate border-sky-200 hover:bg-sky-100/50'
                                                                     }`}
                                                                 >
                                                                     {w}
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>
                                                     <button
                                                         type="button"
                                                         disabled={savingTreatment}
                                                         onClick={async () => {
                                                             setSavingTreatment(true);
                                                             try {
                                                                 const docId = doctor?.doctorID || 1;
                                                                 // 1. Update treatment plan in Patients table
                                                                 await fetch(`/api/patients/${selectedPatient.patientID}/treatment-plan`, {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json' },
                                                                     body: JSON.stringify({
                                                                         treatmentPlan: 'Braces (Orthodontics)',
                                                                         treatmentStage: bracesStage,
                                                                         targetShade: bracesWire
                                                                     })
                                                                 });
                                                                 // 2. Insert clinical log entry
                                                                 await fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json' },
                                                                     body: JSON.stringify({
                                                                         doctorID: docId,
                                                                         message: `Orthodontic Adjustment: ${bracesStage}. Archwire engaged: ${bracesWire}. Elastics adjusted.`,
                                                                         logType: 'Orthodontics'
                                                                     })
                                                                 });
                                                                 
                                                                 // 3. Update React state so Stage appears immediately!
                                                                 setSelectedPatient(prev => ({
                                                                     ...prev,
                                                                     currentTreatmentPlan: 'Braces (Orthodontics)',
                                                                     treatmentStage: bracesStage,
                                                                     targetShade: bracesWire
                                                                 }));
                                                                 setPatients(prev => prev.map(p => p.patientID === selectedPatient.patientID ? {
                                                                     ...p,
                                                                     currentTreatmentPlan: 'Braces (Orthodontics)',
                                                                     treatmentStage: bracesStage,
                                                                     targetShade: bracesWire
                                                                 } : p));

                                                                 showToast(`Orthodontic plan updated: ${bracesStage}`);
                                                                 // Automatically hide drawer on save
                                                                 setIsTreatmentDrawerOpen(false);
                                                                 if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
                                                             } catch (err) {
                                                                 console.error(err);
                                                                 showToast('Failed to save treatment note', 'error');
                                                             } finally {
                                                                 setSavingTreatment(false);
                                                             }
                                                         }}
                                                         className="w-full bg-sky-600 hover:bg-sky-700 text-white py-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                                     >
                                                         {savingTreatment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                         Save & Update Orthodontic Plan
                                                     </button>
                                                 </div>
                                             )}

                                             {isTreatmentDrawerOpen && activeTreatmentTag === 'whitening' && (
                                                 <div 
                                                     onMouseDown={resetAutoHideTimer}
                                                     onClick={resetAutoHideTimer}
                                                     className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-3 animate-fade-in transition-all"
                                                 >
                                                     <div className="flex items-center justify-between">
                                                         <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                                             <Sparkles className="w-3 h-3 text-amber-600" /> Cosmetic Shade Guide
                                                         </span>
                                                         <button
                                                             type="button"
                                                             onClick={handleUnselectModality}
                                                             className="text-[9px] font-extrabold text-slate-500 hover:text-rose-600 flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition-colors shadow-2xs"
                                                             title="Close drawer"
                                                         >
                                                             <X className="w-2.5 h-2.5" /> Close
                                                         </button>
                                                     </div>
                                                     <div className="grid grid-cols-2 gap-2">
                                                         <div className="space-y-1">
                                                             <label className="text-[9px] font-bold text-amber-900 block">Pre-Shade:</label>
                                                             <select 
                                                                 value={whiteningPreShade} 
                                                                 onChange={e => { setWhiteningPreShade(e.target.value); resetAutoHideTimer(); }}
                                                                 className="w-full bg-white border border-amber-200 rounded-lg text-[10px] font-bold p-1 text-dark-slate cursor-pointer"
                                                             >
                                                                 {['A4', 'A3.5', 'A3', 'A2', 'B3', 'C2'].map(s => <option key={s} value={s}>{s}</option>)}
                                                             </select>
                                                         </div>
                                                         <div className="space-y-1">
                                                             <label className="text-[9px] font-bold text-amber-900 block">Target Shade:</label>
                                                             <select 
                                                                 value={whiteningTargetShade} 
                                                                 onChange={e => { setWhiteningTargetShade(e.target.value); resetAutoHideTimer(); }}
                                                                 className="w-full bg-white border border-amber-200 rounded-lg text-[10px] font-bold p-1 text-dark-slate cursor-pointer"
                                                             >
                                                                 {['B1', 'BL1', 'BL2', 'A1', 'B2'].map(s => <option key={s} value={s}>{s}</option>)}
                                                             </select>
                                                         </div>
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9.5px] font-bold text-amber-900 block">Session:</label>
                                                         <div className="flex gap-1.5">
                                                             {['Session 1/3', 'Session 2/3', 'Session 3/3'].map(ses => (
                                                                 <button
                                                                     key={ses}
                                                                     type="button"
                                                                     onClick={() => { setWhiteningSession(ses); resetAutoHideTimer(); }}
                                                                     className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex-1 transition-all cursor-pointer ${
                                                                         whiteningSession === ses 
                                                                             ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                                                                             : 'bg-white text-dark-slate border-amber-200 hover:bg-amber-100/50'
                                                                     }`}
                                                                 >
                                                                     {ses}
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>
                                                     <button
                                                         type="button"
                                                         disabled={savingTreatment}
                                                         onClick={async () => {
                                                             setSavingTreatment(true);
                                                             try {
                                                                 const docId = doctor?.doctorID || 1;
                                                                 // 1. Update treatment plan in Patients table
                                                                 await fetch(`/api/patients/${selectedPatient.patientID}/treatment-plan`, {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json' },
                                                                     body: JSON.stringify({
                                                                         treatmentPlan: 'Teeth Whitening',
                                                                         treatmentStage: whiteningSession,
                                                                         targetShade: `Initial: ${whiteningPreShade} ➔ Target: ${whiteningTargetShade}`
                                                                     })
                                                                 });
                                                                 // 2. Insert clinical log entry
                                                                 await fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json' },
                                                                     body: JSON.stringify({
                                                                         doctorID: docId,
                                                                         message: `Cosmetic Whitening (${whiteningSession}): Shade improved from ${whiteningPreShade} towards ${whiteningTargetShade}. 35% HP protocol completed.`,
                                                                         logType: 'Cosmetic'
                                                                     })
                                                                 });

                                                                 // 3. Update React state immediately!
                                                                 setSelectedPatient(prev => ({
                                                                     ...prev,
                                                                     currentTreatmentPlan: 'Teeth Whitening',
                                                                     treatmentStage: whiteningSession,
                                                                     targetShade: `Initial: ${whiteningPreShade} ➔ Target: ${whiteningTargetShade}`
                                                                 }));
                                                                 setPatients(prev => prev.map(p => p.patientID === selectedPatient.patientID ? {
                                                                     ...p,
                                                                     currentTreatmentPlan: 'Teeth Whitening',
                                                                     treatmentStage: whiteningSession,
                                                                     targetShade: `Initial: ${whiteningPreShade} ➔ Target: ${whiteningTargetShade}`
                                                                 } : p));

                                                                 showToast(`Whitening progress updated: ${whiteningSession}`);
                                                                 // Automatically hide drawer on save
                                                                 setIsTreatmentDrawerOpen(false);
                                                                 if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
                                                             } catch (err) {
                                                                 console.error(err);
                                                                 showToast('Failed to save whitening note', 'error');
                                                             } finally {
                                                                 setSavingTreatment(false);
                                                             }
                                                         }}
                                                         className="w-full bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                                     >
                                                         {savingTreatment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                         Save & Update Whitening Record
                                                     </button>
                                                 </div>
                                             )}

                                             {isTreatmentDrawerOpen && activeTreatmentTag === 'cavity' && (
                                                 <div 
                                                     onMouseDown={resetAutoHideTimer}
                                                     onClick={resetAutoHideTimer}
                                                     className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl space-y-3 animate-fade-in transition-all"
                                                 >
                                                     <div className="flex items-center justify-between">
                                                         <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                                                             <ShieldAlert className="w-3 h-3 text-rose-600" /> Restorative & Caries Spotter
                                                         </span>
                                                         <button
                                                             type="button"
                                                             onClick={handleUnselectModality}
                                                             className="text-[9px] font-extrabold text-slate-500 hover:text-rose-600 flex items-center gap-0.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition-colors shadow-2xs"
                                                             title="Close drawer"
                                                         >
                                                             <X className="w-2.5 h-2.5" /> Close
                                                         </button>
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9.5px] font-bold text-rose-900 block">Select Affected Tooth #:</label>
                                                         <div className="flex gap-1.5 flex-wrap">
                                                             {['3', '8', '9', '14', '19', '30', '31'].map(tNum => (
                                                                 <button
                                                                     key={tNum}
                                                                     type="button"
                                                                     onClick={() => { setCavityTooth(tNum); resetAutoHideTimer(); }}
                                                                     className={`text-[9.5px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                                                         cavityTooth === tNum 
                                                                             ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                                                                             : 'bg-white text-dark-slate border-rose-200 hover:bg-rose-100/50'
                                                                     }`}
                                                                 >
                                                                     #{tNum}
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-[9.5px] font-bold text-rose-900 block">Restorative Material:</label>
                                                         <div className="flex gap-1.5">
                                                             {['Composite Resin', 'Glass Ionomer (GIC)'].map(mat => (
                                                                 <button
                                                                     key={mat}
                                                                     type="button"
                                                                     onClick={() => { setCavityMaterial(mat); resetAutoHideTimer(); }}
                                                                     className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex-1 transition-all cursor-pointer ${
                                                                         cavityMaterial === mat 
                                                                             ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                                                                             : 'bg-white text-dark-slate border-rose-200 hover:bg-rose-100/50'
                                                                     }`}
                                                                 >
                                                                     {mat}
                                                                 </button>
                                                             ))}
                                                         </div>
                                                     </div>
                                                     <div className="flex gap-2">
                                                         <button
                                                             type="button"
                                                             disabled={savingTreatment}
                                                             onClick={async () => {
                                                                 setSavingTreatment(true);
                                                                 try {
                                                                     const docId = doctor?.doctorID || 1;
                                                                     // 1. Mark tooth as Damaged / Decay in TeethState (bulk update endpoint)
                                                                     await fetch('/api/patients/teeth/update-bulk', {
                                                                         method: 'POST',
                                                                         headers: { 'Content-Type': 'application/json' },
                                                                         body: JSON.stringify({
                                                                             patientId: selectedPatient.patientID,
                                                                             updates: [{
                                                                                 toothNumber: parseInt(cavityTooth),
                                                                                 color: '#EF4444',
                                                                                 status: 'Damaged / Decay',
                                                                                 comment: `${cavityMaterial} restoration planned for caries`
                                                                             }]
                                                                         })
                                                                     });
                                                                     // 2. Insert clinical log entry
                                                                     await fetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
                                                                         method: 'POST',
                                                                         headers: { 'Content-Type': 'application/json' },
                                                                         body: JSON.stringify({
                                                                             doctorID: docId,
                                                                             message: `Caries identified on Tooth #${cavityTooth}. Marked for ${cavityMaterial} restoration.`,
                                                                             logType: 'Restorative'
                                                                         })
                                                                     });
                                                                     // 3. Re-fetch chart so Health Overview bars update live!
                                                                     fetchPatientChart(selectedPatient.patientID);

                                                                     // 4. Update React state immediately!
                                                                     setSelectedPatient(prev => ({
                                                                         ...prev,
                                                                         currentTreatmentPlan: 'Cavity Restorative',
                                                                         treatmentStage: `Tooth #${cavityTooth} (${cavityMaterial})`,
                                                                         targetShade: ''
                                                                     }));
                                                                     setPatients(prev => prev.map(p => p.patientID === selectedPatient.patientID ? {
                                                                         ...p,
                                                                         currentTreatmentPlan: 'Cavity Restorative',
                                                                         treatmentStage: `Tooth #${cavityTooth} (${cavityMaterial})`,
                                                                         targetShade: ''
                                                                     } : p));

                                                                     showToast(`Tooth #${cavityTooth} caries logged & chart updated!`);
                                                                     // Automatically hide drawer on save
                                                                     setIsTreatmentDrawerOpen(false);
                                                                     if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
                                                                 } catch (err) {
                                                                     console.error(err);
                                                                     showToast('Failed to mark tooth cavity', 'error');
                                                                 } finally {
                                                                     setSavingTreatment(false);
                                                                 }
                                                             }}
                                                             className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                                         >
                                                             {savingTreatment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                             Mark Tooth #{cavityTooth}
                                                         </button>

                                                         <button
                                                             type="button"
                                                             disabled={savingTreatment}
                                                             onClick={() => handleRevertToothCavity(cavityTooth)}
                                                             className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 py-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                                             title={`Clear cavity on Tooth #${cavityTooth} and set back to Healthy`}
                                                         >
                                                             <RotateCcw className="w-3 h-3 text-rose-500" /> Revert Tooth #{cavityTooth}
                                                         </button>
                                                     </div>
                                                 </div>
                                             )}

                                             {/* Percentage Detail (Infographic Stacked Horizontally) */}
                                             <div className="pt-2 border-t border-light-teal/20 space-y-3">
                                                 <span className="text-[10px] font-black text-muted-text uppercase tracking-widest block mb-1">Health Overview</span>
                                                 <div className="space-y-2.5">
                                                     {/* 1. Health */}
                                                     <div className="space-y-1">
                                                         <div className="flex justify-between items-center text-[10px] font-black text-dark-slate uppercase tracking-wider">
                                                             <span>Health</span>
                                                             <span className="text-[#4A7CD2] font-black">{healthyPct}%</span>
                                                         </div>
                                                         <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                                                             <div className="bg-[#4A7CD2] h-full rounded-full" style={{ width: `${healthyPct}%` }}></div>
                                                         </div>
                                                     </div>
                                                     {/* 2. Caries */}
                                                     <div className="space-y-1">
                                                         <div className="flex justify-between items-center text-[10px] font-black text-dark-slate uppercase tracking-wider">
                                                             <span>Caries</span>
                                                             <span className="text-[#EF4444] font-black">{cariesPct}%</span>
                                                         </div>
                                                         <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                                                             <div className="bg-[#EF4444] h-full rounded-full" style={{ width: `${cariesPct}%` }}></div>
                                                         </div>
                                                     </div>
                                                     {/* 3. RCT */}
                                                     <div className="space-y-1">
                                                         <div className="flex justify-between items-center text-[10px] font-black text-dark-slate uppercase tracking-wider">
                                                             <span>RCT (Root Canal)</span>
                                                             <span className="text-[#F59E0B] font-black">{rctPct}%</span>
                                                         </div>
                                                         <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                                                             <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: `${rctPct}%` }}></div>
                                                         </div>
                                                     </div>
                                                     {/* 4. Cleaning */}
                                                     <div className="space-y-1">
                                                         <div className="flex justify-between items-center text-[10px] font-black text-dark-slate uppercase tracking-wider">
                                                             <span>Cleaning</span>
                                                             <span className="text-[#3B82F6] font-black">{cleaningPct}%</span>
                                                         </div>
                                                         <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                                                             <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: `${cleaningPct}%` }}></div>
                                                         </div>
                                                     </div>
                                                     {/* 5. Treated */}
                                                     <div className="space-y-1">
                                                         <div className="flex justify-between items-center text-[10px] font-black text-dark-slate uppercase tracking-wider">
                                                             <span>Treated</span>
                                                             <span className="text-[#8B5CF6] font-black">{prosthesisPct}%</span>
                                                         </div>
                                                         <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                                                             <div className="bg-[#8B5CF6] h-full rounded-full" style={{ width: `${prosthesisPct}%` }}></div>
                                                         </div>
                                                     </div>
                                                     {/* 6. Missing */}
                                                     <div className="space-y-1">
                                                         <div className="flex justify-between items-center text-[10px] font-black text-dark-slate uppercase tracking-wider">
                                                             <span>Missing</span>
                                                             <span className="text-[#64748B] font-black">{missingPct}%</span>
                                                         </div>
                                                         <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                                                             <div className="bg-[#64748B] h-full rounded-full" style={{ width: `${missingPct}%` }}></div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>

                                             {/* Diagnostic Details list */}
                                             <div className="space-y-2.5 text-[11px] border-t border-light-teal/20 pt-3">
                                                 <div className="flex justify-between items-center">
                                                     <span className="font-extrabold text-muted-text uppercase tracking-wider">Email:</span>
                                                     <span className="font-black text-dark-slate">{selectedPatient.email || 'N/A'}</span>
                                                 </div>
                                                 <div className="flex justify-between items-center">
                                                     <span className="font-extrabold text-muted-text uppercase tracking-wider">Address:</span>
                                                     <span className="font-black text-dark-slate text-right">{selectedPatient.address || 'N/A'}</span>
                                                 </div>
                                             </div>

                                             <button 
                                                 onClick={() => navigate(`/chart/${selectedPatient.patientID}${activeTreatmentTag ? `?treatment=${activeTreatmentTag}` : ''}`)}
                                                 onPointerEnter={() => {
                                                     preloadJawImages({ immediate: true });
                                                     if (selectedPatient?.patientID) {
                                                         prefetchApi(`patient_${selectedPatient.patientID}`, () => fetch(`/api/patients/${selectedPatient.patientID}`).then(r => r.json()));
                                                         prefetchApi(`patient_${selectedPatient.patientID}_chart`, () => fetch(`/api/patients/${selectedPatient.patientID}/chart`).then(r => r.json()));
                                                         prefetchApi(`patient_${selectedPatient.patientID}_prescriptions`, () => fetch(`/api/patients/${selectedPatient.patientID}/prescriptions`).then(r => r.json()));
                                                         prefetchApi(`patient_${selectedPatient.patientID}_diagnostic`, () => fetch(`/api/patients/${selectedPatient.patientID}/diagnostic-assessment`).then(r => r.ok && r.status !== 204 ? r.json() : null));
                                                     }
                                                 }}
                                                 className="w-full bg-[#4A7CD2] hover:bg-[#3665B7] text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all mt-4 cursor-pointer flex items-center justify-center gap-1.5"
                                             >
                                                 View Odontogram Chart
                                             </button>
                                         </div>
                                     );
                                 })() : (
                                    <p className="text-xs text-muted-text italic text-center py-10">Select a patient to load details.</p>
                                )}
                            </div>

                        </div>

                    </div>

                    {/* Right Side Schedule Sidebar (Calendar + dentist notes) */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Schedule Calendar widget */}
                        <div className="bg-white rounded-[2rem] border border-[#EAF0FC] p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-dark-slate flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-primary-teal" /> Your Schedule
                                </h4>
                                <div className="flex gap-1">
                                    <ChevronLeft className="w-4 h-4 text-muted-text hover:text-dark-slate cursor-pointer" />
                                    <ChevronRight className="w-4 h-4 text-muted-text hover:text-dark-slate cursor-pointer" />
                                </div>
                            </div>

                            {/* New Schedule (Upcoming) */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-primary-teal uppercase tracking-widest block">Upcoming Appointments</span>
                                    {totalUpcomingPages > 1 && (
                                        <div className="flex gap-1 items-center">
                                            <button 
                                                disabled={upcomingPage === 1}
                                                onClick={() => setUpcomingPage(prev => Math.max(prev - 1, 1))}
                                                className="p-1 rounded-md border border-[#EAF0FC] disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer flex items-center justify-center"
                                            >
                                                <ChevronLeft className="w-3 h-3 text-dark-slate" />
                                            </button>
                                            <span className="text-[8px] font-bold text-muted-text min-w-[20px] text-center">
                                                {upcomingPage}/{totalUpcomingPages}
                                            </span>
                                            <button 
                                                disabled={upcomingPage === totalUpcomingPages}
                                                onClick={() => setUpcomingPage(prev => Math.min(prev + 1, totalUpcomingPages))}
                                                className="p-1 rounded-md border border-[#EAF0FC] disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer flex items-center justify-center"
                                            >
                                                <ChevronRight className="w-3 h-3 text-dark-slate" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 pr-1 min-h-[258px] flex flex-col justify-start">
                                    {currentUpcoming.length === 0 ? (
                                        <p className="text-[10px] text-muted-text italic py-2">No upcoming schedule logs.</p>
                                    ) : (
                                        currentUpcoming.map((app) => (
                                            <div key={app.appointmentID} className="p-3 bg-[#EAF0FC]/40 border border-light-teal/50 rounded-xl flex justify-between items-center text-xs font-normal text-dark-slate">
                                                <span>{app.fullName}</span>
                                                <span className="bg-[#4A7CD2] text-white px-2 py-0.5 rounded-md flex items-center gap-1 font-normal text-[10px]">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(app.preferredDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Old Schedule (Completed / Past) */}
                            <div className="space-y-3 border-t border-light-teal/20 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block">Past Sessions</span>
                                    {totalPastPages > 1 && (
                                        <div className="flex gap-1 items-center">
                                            <button 
                                                disabled={pastPage === 1}
                                                onClick={() => setPastPage(prev => Math.max(prev - 1, 1))}
                                                className="p-1 rounded-md border border-[#EAF0FC] disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer flex items-center justify-center"
                                            >
                                                <ChevronLeft className="w-3 h-3 text-dark-slate" />
                                            </button>
                                            <span className="text-[8px] font-bold text-muted-text min-w-[20px] text-center">
                                                {pastPage}/{totalPastPages}
                                            </span>
                                            <button 
                                                disabled={pastPage === totalPastPages}
                                                onClick={() => setPastPage(prev => Math.min(prev + 1, totalPastPages))}
                                                className="p-1 rounded-md border border-[#EAF0FC] disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer flex items-center justify-center"
                                            >
                                                <ChevronRight className="w-3 h-3 text-dark-slate" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 min-h-[258px] flex flex-col justify-start pr-1">
                                    {currentPast.length === 0 ? (
                                        <p className="text-[10px] text-muted-text italic py-2">No completed session logs.</p>
                                    ) : (
                                        currentPast.map((app) => (
                                            <div key={app.appointmentID} className="p-3 bg-red-50/30 border border-red-100/50 rounded-xl flex justify-between items-center text-xs font-normal text-dark-slate">
                                                <span>{app.fullName}</span>
                                                <span className="bg-pink-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 font-normal text-[10px]">
                                                    {new Date(app.preferredDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dentist notes cute cartoon card */}
                        <div className="bg-gradient-to-r from-[#4A7CD2] to-[#6366F1] rounded-[2rem] border border-[#4A7CD2]/20 p-6 shadow-lg shadow-[#4A7CD2]/10 flex items-center justify-between overflow-hidden relative hover:scale-[1.02] transition-all duration-300">
                            {/* Decorative background circle */}
                            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                            
                            <div className="space-y-2.5 relative z-10">
                                <h4 className="text-base font-extrabold text-white">New Patient</h4>
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest block font-sans">Register a new profile</span>
                                <button 
                                    onClick={() => navigate('/new-patient')} 
                                    className="bg-white hover:bg-slate-50 text-[#4A7CD2] font-black py-2 px-5 rounded-xl text-[10px] flex items-center shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1 text-[#4A7CD2] stroke-[3]" /> Add Patient
                                </button>
                            </div>
                            
                            <div className="w-20 h-20 rounded-full bg-white/20 border border-white/30 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0 relative z-10">
                                <img src="/dentist_cartoon_notes_icon.png" alt="ToothIcon" className="w-full h-full object-cover scale-110" />
                            </div>
                        </div>

                    </div>

                </div>

            </main>

            {/* Floating Right Tab Trigger: Opens Clinical Notes Drawer */}
            <button
                type="button"
                onClick={() => setIsLogsDrawerOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#10244B] hover:bg-[#4A7CD2] text-white py-3.5 px-2 rounded-l-2xl shadow-2xl flex flex-col items-center gap-2 border-l border-t border-b border-white/20 transition-all duration-300 group cursor-pointer hover:pl-3"
                title="Open Clinical Notes & Download PDF"
            >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs"></div>
                <Activity className="w-4 h-4 text-sky-300 group-hover:scale-110 transition-transform" />
                <span className="[writing-mode:vertical-rl] text-[10.5px] font-black tracking-widest uppercase font-sans">
                    Clinical Notes
                </span>
                <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[9px] font-black flex items-center justify-center border border-white/30">
                    {clinicalLogs.length}
                </span>
            </button>

            {/* Slide-out Clinical Notes & Audit Drawer Panel */}
            {isLogsDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
                    {/* Backdrop overlay */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
                        onClick={() => setIsLogsDrawerOpen(false)}
                    />

                    <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left z-10">
                        {/* Drawer Header */}
                        <div className="p-5 bg-gradient-to-r from-[#10244B] to-[#1E3A8A] text-white flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                    <Activity className="w-5 h-5 text-sky-300" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black tracking-tight">Clinical Activity Logs</h3>
                                    <p className="text-[10px] text-white/80 font-bold">
                                        {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName} (ID #${selectedPatient.patientID})` : 'Select a Patient'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleExportLogsPDF}
                                    disabled={!selectedPatient}
                                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-md transition-all cursor-pointer"
                                    title="Download PDF Report"
                                >
                                    <Download className="w-3 h-3" /> PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLogsDrawerOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Patient Summary Header inside Drawer */}
                        {selectedPatient && (
                            <div className="bg-[#F8FAFC] border-b border-slate-200 px-5 py-3 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0 bg-white flex items-center justify-center">
                                        <img 
                                            src={getPatientAvatarUrl(selectedPatient)} 
                                            alt={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-dark-slate leading-tight">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                        <p className="text-[9.5px] text-muted-text font-bold uppercase">{selectedPatient.gender || 'Unspecified'} · Age: {getAge(selectedPatient.dob)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                                        {clinicalLogs.length} Total Logs
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Filter & Search Toolbar */}
                        <div className="p-3 border-b border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                            <div className="relative flex-grow">
                                <Search className="w-3.5 h-3.5 text-muted-text absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={logsSearchFilter}
                                    onChange={e => setLogsSearchFilter(e.target.value)}
                                    placeholder="Search logs..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-[#F4F6FA] rounded-xl text-xs text-dark-slate placeholder-muted-text border border-transparent focus:border-[#4A7CD2] focus:bg-white focus:outline-none transition-all font-sans"
                                />
                                {logsSearchFilter && (
                                    <button 
                                        onClick={() => setLogsSearchFilter('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-slate"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Logs List Container */}
                        <div className="p-4 overflow-y-auto flex-grow space-y-2.5">
                            {loadingLogs ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#4A7CD2]" />
                                    <p className="text-xs font-semibold text-muted-text">Fetching clinical audit logs...</p>
                                </div>
                            ) : (() => {
                                const filtered = clinicalLogs.filter(l => {
                                    const msg = (l.message || l.Message || '').toLowerCase();
                                    const type = (l.logType || l.LogType || '').toLowerCase();
                                    const search = logsSearchFilter.toLowerCase();
                                    return msg.includes(search) || type.includes(search);
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="text-center py-16 space-y-2">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-bold text-dark-slate">No Clinical Logs Found</p>
                                            <p className="text-[10px] text-muted-text">
                                                {logsSearchFilter ? 'No matching logs for this search query.' : 'Clinical logs will appear here when procedures, treatments, or notes are recorded.'}
                                            </p>
                                        </div>
                                    );
                                }

                                return filtered.map((log, lIdx) => {
                                    const logType = log.logType || log.LogType || 'General';
                                    const msg = log.message || log.Message || '';
                                    const dt = log.createdAt || log.CreatedAt;
                                    const d = dt ? new Date(dt) : null;
                                    const timeStr = d 
                                        ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                                        : 'Recent';

                                    const typeColor = 
                                        logType.toLowerCase().includes('prescrip') ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                        logType.toLowerCase().includes('ortho') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                        logType.toLowerCase().includes('whiten') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        logType.toLowerCase().includes('voice') || logType.toLowerCase().includes('scribe') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        logType.toLowerCase().includes('appoint') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        'bg-slate-100 text-slate-700 border-slate-200';

                                    return (
                                        <div key={lIdx} className="bg-white border border-slate-200/80 hover:border-[#4A7CD2]/50 p-3.5 rounded-2xl text-xs space-y-2 shadow-2xs transition-all">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${typeColor} uppercase tracking-wider`}>
                                                    {logType}
                                                </span>
                                                <span className="text-[9.5px] font-bold text-muted-text">
                                                    {timeStr}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-dark-slate leading-relaxed">
                                                {msg}
                                            </p>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Drawer Bottom Actions */}
                        <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between flex-shrink-0">
                            <span className="text-[10px] font-bold text-muted-text">
                                {clinicalLogs.length} Total Logs Recorded
                            </span>
                            <button
                                type="button"
                                onClick={handleExportLogsPDF}
                                disabled={!selectedPatient}
                                className="bg-[#4A7CD2] hover:bg-[#3665B7] disabled:opacity-50 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" /> Download Full PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Patient Information Modal */}
            {editPatientModal.visible && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#4A7CD2] flex items-center justify-center">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Edit Patient Information</h3>
                                    <span className="text-[10px] text-slate-500 font-bold">Patient ID: #{editPatientModal.patient?.patientID}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditPatientModal({ visible: false, patient: null })}
                                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Hidden File Input for Modal Photo Upload */}
                        <input 
                            type="file" 
                            ref={editFileInputRef} 
                            onChange={handleEditImageSelect} 
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" 
                            className="hidden" 
                        />

                        {/* Profile Photo Editor Box */}
                        <div className="bg-[#EAF0FC]/70 border border-light-teal/50 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="relative w-13 h-13 rounded-2xl overflow-hidden border-2 border-white shadow-xs bg-white flex-shrink-0 flex items-center justify-center">
                                    <img 
                                        src={editForm.profileImageDataUrl || getPatientAvatarUrl(editPatientModal.patient, editForm.gender)} 
                                        alt="Patient Photo" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div>
                                    <span className="text-xs font-black text-dark-slate block">Patient Profile Photo</span>
                                    <span className="text-[10px] text-muted-text font-bold">Max 5MB • Optional custom image</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => editFileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>{editForm.profileImageDataUrl ? 'Change' : 'Upload'}</span>
                                </button>
                                {editForm.profileImageDataUrl && (
                                    <button
                                        type="button"
                                        onClick={handleEditImageRemove}
                                        title="Reset to default avatar"
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer border border-red-200"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSavePatientEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={editForm.dob}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                                    <select
                                        value={editForm.gender}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="0300 1234567"
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="patient@example.com"
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Address / Clinic Region</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="e.g. House #12, Street 4, Lahore"
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditPatientModal({ visible: false, patient: null })}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="flex-1 py-2.5 bg-[#4A7CD2] hover:bg-[#3b66b2] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Save Profile</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Toast Notification (Top Right Corner - UI/UX Optimized) */}
            {toast.visible && (
                <div 
                    role="status"
                    aria-live="polite"
                    className={`fixed top-24 right-6 sm:right-8 z-[100] animate-bounce-in flex items-center gap-3 bg-[#10244B]/95 backdrop-blur-md text-white pl-4 pr-3 py-3 rounded-2xl shadow-[0_20px_50px_rgba(16,36,75,0.35)] border ${
                        toast.type === 'error' 
                            ? 'border-rose-500/50 text-rose-100 ring-1 ring-rose-500/30' 
                            : toast.type === 'info'
                            ? 'border-cyan-400/50 text-cyan-100 ring-1 ring-cyan-400/30'
                            : 'border-emerald-500/50 text-emerald-50 ring-1 ring-emerald-500/30'
                    }`}
                >
                    {toast.type === 'error' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : toast.type === 'info' ? (
                        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-bold font-sans tracking-wide">{toast.message}</span>
                    <button 
                        type="button"
                        onClick={() => setToast({ visible: false, message: '', type: 'success' })}
                        className="ml-1 text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                        title="Dismiss notification"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <Footer />
        </div>
    );
}

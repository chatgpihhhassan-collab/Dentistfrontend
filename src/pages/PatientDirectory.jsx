import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { 
    Search, ChevronLeft, ChevronRight, Plus, Calendar, Clock, 
    Sparkles, Activity, CheckCircle2, Save, Loader2, Smile, ShieldAlert, Check, X, RotateCcw,
    Download, FileText, Filter, Eye, ChevronDown, RefreshCw, Pencil, Camera, UploadCloud, Trash2,
    CreditCard, Stethoscope, MessageCircle, MessageCircleOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import '../index.css';
import { getPatientAvatarUrl, validateImageFile, fileToDataUrl } from '../utils/avatarUtils';
import { preloadJawImages, preloadPatientJawTemplates } from '../utils/jawImagePreloader';
import { fetchWithCache, prefetchApi, invalidateCache, setCachedData } from '../utils/apiCache';
import FullPageSkeletonLoader from '../components/FullPageSkeletonLoader';
import WhatsAppOptInToggle from '../components/whatsapp/WhatsAppOptInToggle';
import apiFetch from '../utils/apiClient';
import { updatePatientWhatsAppOptIn } from '../services/whatsappService';

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
    const [pageSize, setPageSize] = useState(6);
    const [sortBy, setSortBy] = useState('NEWEST');

    const [upcomingPage, setUpcomingPage] = useState(1);
    const upcomingPerPage = 6;

    const [pastPage, setPastPage] = useState(1);
    const pastPerPage = 6;

    const [scheduleTab, setScheduleTab] = useState('UPCOMING'); // 'UPCOMING' | 'PAST'

    const [selectedTeethState, setSelectedTeethState] = useState([]);
    const [clinicalLogs, setClinicalLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
    const [logsSearchFilter, setLogsSearchFilter] = useState('');
    const [logsTypeFilter, setLogsTypeFilter] = useState('ALL');
    const [dentitionFilter, setDentitionFilter] = useState('ALL'); // 'ALL' | 'ADULT' | 'PEDIATRIC' | 'MIXED'
    const [patientVisitTab, setPatientVisitTab] = useState('ALL'); // 'TODAY' | 'ALL'
    const [hasInitializedVisitTab, setHasInitializedVisitTab] = useState(false);

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
        profileImageMimeType: null,
        whatsAppOptIn: false
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
            profileImageMimeType: p.profileImageMimeType || null,
            whatsAppOptIn: p.whatsAppOptIn !== undefined ? Boolean(p.whatsAppOptIn) : false
        });
        setEditPatientModal({ visible: true, patient: p });
    };

    const handleTogglePatientWhatsApp = async (newVal) => {
        if (!selectedPatient) return;
        console.log('[PatientDirectory] Toggling WhatsApp consent for Patient ID:', selectedPatient.patientID, 'New value:', newVal);
        try {
            const res = await updatePatientWhatsAppOptIn(selectedPatient.patientID, newVal);
            console.log('[PatientDirectory] updatePatientWhatsAppOptIn API response:', res);
            
            const nowIso = new Date().toISOString();
            setSelectedPatient(prev => ({
                ...prev,
                whatsAppOptIn: newVal,
                whatsAppOptInAt: newVal ? nowIso : prev.whatsAppOptInAt
            }));
            
            setPatients(prev => prev.map(p => p.patientID === selectedPatient.patientID ? {
                ...p,
                whatsAppOptIn: newVal,
                whatsAppOptInAt: newVal ? nowIso : p.whatsAppOptInAt
            } : p));

            invalidateCache('doctor_' + (doctor?.doctorID || '') + '_patients');
            invalidateCache(`patient_${selectedPatient.patientID}`);

            if (res.upcomingAppointmentQueued) {
                const dateStr = res.queuedAppointmentDate 
                    ? new Date(res.queuedAppointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    : 'upcoming appointment';
                showToast(`WhatsApp activated! Upcoming appointment reminder for ${dateStr} has been queued.`, 'success');
            } else {
                showToast(newVal ? 'WhatsApp activated for patient.' : 'WhatsApp deactivated for patient.', 'info');
            }
        } catch (err) {
            console.error('[PatientDirectory] Error toggling WhatsApp status:', err);
            showToast(err.message || 'Failed to update WhatsApp consent status', 'error');
        }
    };

    const handleSavePatientEdit = async (e) => {
        e.preventDefault();
        if (!editPatientModal.patient) return;

        // Prevent future DOB submission
        if (editForm.dob) {
            const birthDate = new Date(editForm.dob);
            if (birthDate > new Date()) {
                showToast("Date of Birth cannot be in the future.", "error");
                return;
            }
        }

        const sanitizedFirstName = (editForm.firstName || '').slice(0, 50).trim();
        const sanitizedLastName = (editForm.lastName || '').slice(0, 50).trim();

        setSavingEdit(true);
        console.log('[PatientDirectory] Saving edited patient:', editPatientModal.patient.patientID, editForm);
        try {
            const res = await apiFetch(`/api/patients/${editPatientModal.patient.patientID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editPatientModal.patient,
                    ...editForm,
                    firstName: sanitizedFirstName,
                    lastName: sanitizedLastName,
                    whatsAppOptIn: editForm.whatsAppOptIn,
                    dob: editForm.dob ? new Date(editForm.dob).toISOString() : null
                })
            });
            if (res.ok) {
                const updated = {
                    ...editPatientModal.patient,
                    ...editForm,
                    firstName: sanitizedFirstName,
                    lastName: sanitizedLastName,
                    whatsAppOptIn: editForm.whatsAppOptIn,
                    dob: editForm.dob ? new Date(editForm.dob).toISOString() : null
                };

                // If WhatsApp was just activated, trigger opt-in service to check retroactive appointment dispatch
                if (editForm.whatsAppOptIn && !editPatientModal.patient.whatsAppOptIn) {
                    console.log('[PatientDirectory] WhatsApp newly activated during edit. Triggering retroactive check...');
                    updatePatientWhatsAppOptIn(updated.patientID, true)
                        .then(waRes => {
                            console.log('[PatientDirectory] Retroactive dispatch check completed:', waRes);
                            if (waRes.upcomingAppointmentQueued) {
                                const dateStr = waRes.queuedAppointmentDate 
                                    ? new Date(waRes.queuedAppointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                    : 'upcoming appointment';
                                showToast(`WhatsApp activated! Upcoming appointment reminder for ${dateStr} has been queued.`, 'success');
                            }
                        })
                        .catch(err => console.error('[PatientDirectory] Retroactive check error:', err));
                }

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
                const errData = await res.json().catch(() => null);
                const errMsg = errData?.message || await res.text().catch(() => "");
                showToast(errMsg || 'Failed to update patient info', 'error');
            }
        } catch (err) {
            console.error('[PatientDirectory] Error saving patient edit:', err);
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
            await apiFetch(`/api/patients/${selectedPatient.patientID}/treatment-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    treatmentPlan: '',
                    treatmentStage: '',
                    targetShade: ''
                })
            });

            // 2. Insert clinical log entry documenting the revert
            await apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
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
            await apiFetch('/api/patients/teeth/update-bulk', {
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

            await apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
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
        // Speculatively preload jaw arch templates only during long idle moments (15s) off the critical render path
        const preloadTimer = setTimeout(() => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    preloadJawImages({ urls: ['/empty_maxilla_jaw.webp', '/empty_mandible_jaw.webp'] });
                });
            }
        }, 15000);

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
        apiFetch(`/api/patients/${pId}/chart`)
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
                const res = await apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`);
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
                // Patient Portal Credentials Slip in Footer
                pdf.setFillColor(240, 253, 250); // teal-50
                pdf.setDrawColor(153, 246, 228); // teal-200
                pdf.roundedRect(margin, pageHeight - 24, contentWidth, 16, 1.5, 1.5, 'FD');

                const pRefNo = selectedPatient?.referenceNumber || ('DEN-2026-' + (selectedPatient?.patientID || '00000'));
                const pDob = selectedPatient?.dob ? new Date(selectedPatient.dob).toLocaleDateString('en-GB') : 'Verified DOB on file';

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(7.2);
                pdf.setTextColor(11, 79, 74);
                pdf.text('PATIENT SELF-SERVICE HEALTH PORTAL ACCESS CREDENTIALS', margin + 3, pageHeight - 19.5);

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(6.5);
                pdf.setTextColor(15, 23, 42);
                pdf.text(`• Portal URL: https://dentistfrontend.vercel.app/portal/login    • Username / Ref #: ${pRefNo}`, margin + 3, pageHeight - 15);

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(6.2);
                pdf.setTextColor(100, 116, 139);
                pdf.text(`• Password / Access Key: Initial password is verified DOB (${pDob}) or your chosen password. Reset anytime at portal/activate.`, margin + 3, pageHeight - 10.5);

                pdf.setFontSize(5.8);
                pdf.setTextColor(148, 163, 184);
                pdf.text('Confidential Clinical Audit Record · Generated by Dentia Dental Practice Management', margin, pageHeight - 4);
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

        // 🌟 INSTANT SWR RENDER: Check sessionStorage cache immediately (0ms instant display)
        let hasCachedData = false;
        try {
            const cachedStr = sessionStorage.getItem('clinic_patients_cache');
            if (cachedStr) {
                const cachedPatients = JSON.parse(cachedStr);
                if (Array.isArray(cachedPatients) && cachedPatients.length > 0) {
                    hasCachedData = true;
                    setPatients(cachedPatients);
                    setSelectedPatient(prev => prev || cachedPatients[0]);
                    setIsPageLoading(false); // Instant render without waiting for network!
                    setLoadProgress(100);
                }
            }
        } catch (e) {}

        if (!hasCachedData) {
            setIsPageLoading(true);
            setLoadProgress(25);
            setLoadStatusMessage('Doctor authenticated. Requesting patient directory...');
        }

        // Timeout guard: If network takes > 3.5s, unblock screen immediately so clinician is never trapped
        const slowTimer = setTimeout(() => {
            if (!isCancelled) {
                setIsSlowConnection(true);
                setIsPageLoading(false);
            }
        }, 2000);

        const fetchPatients = apiFetch(`/api/patients/doctor/${docInfo.doctorID}`)
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                if (isCancelled) return [];
                const patientList = Array.isArray(data) ? data : [];
                setPatients(patientList);
                if (patientList.length > 0) {
                    try {
                        sessionStorage.setItem('clinic_patients_cache', JSON.stringify(patientList));
                    } catch (e) {}
                    setSelectedPatient(prev => prev || patientList[0]);
                }
                setLoadProgress(prev => Math.max(prev, 70));
                setLoadStatusMessage('Patient profiles loaded. Retrieving clinic schedule...');
                // Instant dismissal of full-screen loader as soon as patient list arrives!
                setIsPageLoading(false);
                return patientList;
            }).catch(err => {
                console.error("Patients load error:", err);
                setIsPageLoading(false);
                return [];
            });

        const fetchAppts = apiFetch(`/api/appointments?doctorId=${docInfo.doctorID}`)
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                if (isCancelled) return [];
                const apptList = Array.isArray(data) ? data : [];
                setAppointments(apptList);
                setLoadProgress(prev => Math.max(prev, 90));
                return apptList;
            }).catch(err => {
                console.error("Appointments load error:", err);
                return [];
            });

        Promise.allSettled([fetchPatients, fetchAppts]).then(([pRes, aRes]) => {
            if (isCancelled) return;
            clearTimeout(slowTimer);
            setLoadProgress(100);
            setLoadStatusMessage('✓ Clinic Records 100% Ready — All Systems Synchronized');
            setIsPageLoading(false);
            setIsReadyBadgeVisible(true);
            setTimeout(() => {
                if (!isCancelled) setIsReadyBadgeVisible(false);
            }, 2200);
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
        apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`)
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

    // Dynamic Time-of-Day Greeting (Morning < 12, Afternoon 12-17, Evening >= 17)
    const getDynamicGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Format patient name to Title Case & clean symbols (PAT-001)
    const formatPatientName = (firstName, lastName) => {
        const full = `${firstName || ''} ${lastName || ''}`.trim();
        if (!full) return 'Unnamed Patient';
        const cleaned = full.replace(/[^a-zA-Z\s.'-]/g, '').replace(/\s+/g, ' ').trim();
        return cleaned
            .split(' ')
            .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
            .join(' ');
    };

    // Calculate age from date of birth (PAT-003)
    const getAge = (dobString) => {
        if (!dobString) return null;
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return null;
        const year = birthDate.getFullYear();
        if (year <= 1900 || year > new Date().getFullYear()) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age >= 0 && age <= 130 ? age : null;
        // clean
        // clean2 
        // clean3
    };

    // Helper to check if a date string matches today in local date
    const isToday = (dateInput) => {
        if (!dateInput) return false;
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return false;
        const today = new Date();
        return d.getFullYear() === today.getFullYear() &&
               d.getMonth() === today.getMonth() &&
               d.getDate() === today.getDate();
    };

    // 1. Appointments scheduled for today
    const todayAppointments = useMemo(() => {
        return appointments.filter(app => 
            isToday(app.preferredDate) && 
            app.status !== 'Cancelled' && 
            app.status !== 'Rejected'
        );
    }, [appointments]);

    // Set of patient IDs that have appointments scheduled today
    const todayPatientIds = useMemo(() => {
        const ids = new Set();
        todayAppointments.forEach(app => {
            if (app.patientID) ids.add(app.patientID);
            const matched = patients.find(p => 
                (p.phone && app.phone && p.phone === app.phone) ||
                (`${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase() === (app.fullName || '').trim().toLowerCase())
            );
            if (matched) ids.add(matched.patientID);
        });
        return ids;
    }, [todayAppointments, patients]);

    // 2. Today's Visited Patients
    const todayVisitedPatients = useMemo(() => {
        return patients.filter(p => todayPatientIds.has(p.patientID));
    }, [patients, todayPatientIds]);

    const todayVisitedCount = todayVisitedPatients.length;

    // 3. Today Registered Patients (New patient intake registered today)
    const todayRegisteredPatients = useMemo(() => {
        return patients.filter(p => {
            const regDate = p.createdAt || p.CreatedAt || p.createdDate || p.dateAdded;
            return isToday(regDate);
        });
    }, [patients]);

    const todayRegisteredCount = todayRegisteredPatients.length;

    // 4. Revisited Patients (Patients visiting today who had previous visits or registered before today)
    const revisitedPatients = useMemo(() => {
        return todayVisitedPatients.filter(p => {
            const regDate = p.createdAt || p.CreatedAt || p.createdDate || p.dateAdded;
            if (regDate && !isToday(regDate)) return true;
            const priorAppts = appointments.filter(a => 
                (a.patientID === p.patientID || (a.phone && a.phone === p.phone)) &&
                new Date(a.preferredDate) < new Date(new Date().setHours(0, 0, 0, 0))
            );
            return priorAppts.length > 0;
        });
    }, [todayVisitedPatients, appointments]);

    const revisitedPatientCount = revisitedPatients.length;

    // By default select "Today's Patients" if count > 0, else fallback to "All Patients"
    useEffect(() => {
        if (!hasInitializedVisitTab && (patients.length > 0 || appointments.length > 0)) {
            if (todayVisitedCount > 0) {
                setPatientVisitTab('TODAY');
            } else {
                setPatientVisitTab('ALL');
            }
            setHasInitializedVisitTab(true);
        }
    }, [todayVisitedCount, patients.length, appointments.length, hasInitializedVisitTab]);

    const getFilteredPatientsByTab = useCallback((tabId, searchStr = '', visitTab = patientVisitTab) => {
        const cSearch = (searchStr || '').trim().toLowerCase();
        return patients.filter(p => {
            // 1. Visit Scope Check (Today's Patients vs All Patients)
            if (visitTab === 'TODAY' && !todayPatientIds.has(p.patientID)) {
                return false;
            }

            // 2. Text Search Query Matching
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

            // 3. Dentition Classification Matching
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
    }, [patients, todayPatientIds, patientVisitTab]);

    const filteredPatients = useMemo(() => {
        const result = getFilteredPatientsByTab(dentitionFilter, cleanSearch, patientVisitTab);
        return result;
    }, [getFilteredPatientsByTab, dentitionFilter, cleanSearch, patientVisitTab]);

    // Automatically select the top first patient whenever dentitionFilter or patientVisitTab changes
    useEffect(() => {
        if (!patients || patients.length === 0) return;
        const topList = getFilteredPatientsByTab(dentitionFilter, cleanSearch, patientVisitTab);
        if (topList.length > 0) {
            setSelectedPatient(topList[0]);
        } else {
            setSelectedPatient(null);
        }
    }, [dentitionFilter, patientVisitTab]);

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
    // Sorting & Pagination Logic (PAT-002)
    const sortedFilteredPatients = useMemo(() => {
        const list = [...filteredPatients];
        switch (sortBy) {
            case 'NAME_ASC':
                return list.sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));
            case 'NAME_DESC':
                return list.sort((a, b) => `${b.firstName || ''} ${b.lastName || ''}`.localeCompare(`${a.firstName || ''} ${a.lastName || ''}`));
            case 'AGE_ASC':
                return list.sort((a, b) => (getAge(a.dob) ?? 999) - (getAge(b.dob) ?? 999));
            case 'AGE_DESC':
                return list.sort((a, b) => (getAge(b.dob) ?? -1) - (getAge(a.dob) ?? -1));
            case 'OLDEST':
                return list.sort((a, b) => (a.patientID || 0) - (b.patientID || 0));
            case 'NEWEST':
            default:
                return list.sort((a, b) => (b.patientID || 0) - (a.patientID || 0));
        }
    }, [filteredPatients, sortBy]);

    const indexOfLastPatient = currentPage * pageSize;
    const indexOfFirstPatient = indexOfLastPatient - pageSize;
    const currentPatients = useMemo(() => {
        return sortedFilteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
    }, [sortedFilteredPatients, indexOfFirstPatient, indexOfLastPatient]);
    const totalPages = Math.ceil(sortedFilteredPatients.length / pageSize);

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
            .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate) || a.appointmentID - b.appointmentID);
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

    // 🌟 100% CLINICAL FULL-PAGE SKELETON LOADING (NO BACKEND BLUR - SKELETON COVERS ALL) 🌟
    if (isPageLoading) {
        return (
            <FullPageSkeletonLoader 
                variant="directory"
                title="Getting your patient directory ready."
                subtitle="Syncing patient records, medical history, and clinical appointments."
                progress={loadProgress}
                status={loadStatusMessage}
                slowConnection={isSlowConnection}
                onContinueAnyway={() => setIsPageLoading(false)}
            />
        );
    }

    return (
        <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F4F6FA] text-dark-slate flex flex-col font-sans selection:bg-light-teal selection:text-primary-teal relative">
            <div className="flex-shrink-0">
                <Navigation />
            </div>

            {/* 🌟 100% READY FLOATING CONFIRMATION BADGE 🌟 */}
            {isReadyBadgeVisible && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-emerald-400/40">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Clinic Directory 100% Ready — All Records Synchronized</span>
                </div>
            )}

            {/* Main Clinical Command Center (Scroll-Less Single-Viewport Layout) */}
            <main className="flex-1 min-h-0 max-w-[1920px] w-full mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-2.5 overflow-hidden">
                
                {/* 1. Ultra-Compact Top Clinical Ribbon (Header + Stats + Actions) */}
                <div className="flex-shrink-0 bg-white rounded-2xl border border-[#EAF0FC] px-3.5 py-2 shadow-2xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
                    
                    {/* Left: Doctor Greeting & Live Telemetry Pill */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-dark-slate flex items-center gap-1.5 whitespace-nowrap">
                                {getDynamicGreeting()}, <span className="text-[#4A7CD2]">Dr. {doctor?.lastName || 'Doctor'}</span>
                            </h2>
                        </div>

                        {/* Vertical Divider */}
                        <div className="hidden xl:block h-4 w-px bg-slate-200"></div>

                        {/* 4 Live Clinical Metric Badges */}
                        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                            <div className="bg-[#EAF0FC] border border-[#4A7CD2]/25 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 text-xs font-bold text-[#4A7CD2]">
                                <Calendar className="w-3 h-3 text-[#4A7CD2]" />
                                <span className="text-[10px] text-slate-600 font-semibold">Visited Today:</span>
                                <span className="text-xs font-black text-[#10244B]">{todayVisitedCount}</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                <Plus className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] text-emerald-800 font-semibold">New Today:</span>
                                <span className="text-xs font-black text-emerald-950">{todayRegisteredCount}</span>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                <RotateCcw className="w-3 h-3 text-indigo-600" />
                                <span className="text-[10px] text-indigo-800 font-semibold">Revisited:</span>
                                <span className="text-xs font-black text-indigo-950">{revisitedPatientCount}</span>
                            </div>
                            <div className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <span className="text-[10px] text-slate-500 font-semibold">Total Active:</span>
                                <span className="text-xs font-black text-slate-800">{patients.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search + Quick Add Patient + Activity Notes */}
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search patient, phone, notes..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25 focus:bg-white transition-all shadow-2xs" 
                            />
                            {searchTerm && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchTerm('')} 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <button 
                            type="button"
                            onClick={() => navigate('/new-patient')}
                            className="bg-[#4A7CD2] hover:bg-[#3665B7] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs hover:shadow-sm transition-all whitespace-nowrap cursor-pointer flex-shrink-0"
                            title="Register a new patient"
                        >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span className="hidden sm:inline">Add Patient</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsLogsDrawerOpen(true)}
                            className="p-1.5 bg-slate-100 hover:bg-[#EAF0FC] text-slate-700 hover:text-[#4A7CD2] border border-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
                            title="Open Clinical Notes & PDF Export"
                        >
                            <Activity className="w-4 h-4 text-[#4A7CD2]" />
                        </button>
                    </div>
                </div>

                {/* 2. Three-Column Clinical Cockpit Grid (Zero Page Scroll) */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
                    
                    {/* COLUMN 1: Patient Directory & Filter Pane */}
                    <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-2xl border border-[#EAF0FC] shadow-2xs overflow-hidden">
                        
                        {/* Column 1 Header */}
                        <div className="p-2.5 sm:p-3 border-b border-[#EAF0FC] flex flex-col gap-2 flex-shrink-0 bg-white">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs sm:text-sm font-extrabold text-[#10244B] flex items-center gap-2">
                                    <span>Patient Directory</span>
                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {filteredPatients.length} Active
                                    </span>
                                </h4>
                                <span className="text-[10px] font-bold text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded border border-[#BFDBFE]">Today</span>
                            </div>

                            {/* Patient Visit Scope Filter Tabs (Today's Patients vs All Patients) */}
                            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-slate-200/80">
                                {[
                                    { id: 'TODAY', label: `Today's (${todayVisitedCount})` },
                                    { id: 'ALL', label: `All (${patients.length})` }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setPatientVisitTab(tab.id);
                                            setCurrentPage(1);
                                            const list = getFilteredPatientsByTab(dentitionFilter, cleanSearch, tab.id);
                                            if (list.length > 0) {
                                                setSelectedPatient(list[0]);
                                            } else {
                                                setSelectedPatient(null);
                                            }
                                        }}
                                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                                            patientVisitTab === tab.id
                                                ? 'bg-[#4A7CD2] text-white shadow-2xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Dentition Classification Filter Tabs */}
                            <div className="flex items-center gap-1 bg-[#F8FAFC] p-0.5 rounded-xl border border-[#EAF0FC]">
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
                                            const tabList = getFilteredPatientsByTab(tab.id, cleanSearch, patientVisitTab);
                                            if (tabList.length > 0) {
                                                setSelectedPatient(tabList[0]);
                                            } else {
                                                setSelectedPatient(null);
                                            }
                                        }}
                                        className={`flex-1 py-0.5 rounded-lg text-[9.5px] font-black transition-all cursor-pointer text-center ${
                                            dentitionFilter === tab.id
                                                ? 'bg-[#4A7CD2] text-white shadow-2xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort & Page Size Controls (PAT-002) */}
                            <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-slate-500 font-bold border-t border-slate-100 mt-1">
                                <div className="flex items-center gap-1">
                                    <span>Sort:</span>
                                    <select
                                        aria-label="Sort patients"
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4A7CD2]"
                                    >
                                        <option value="NEWEST">Newest First</option>
                                        <option value="OLDEST">Oldest First</option>
                                        <option value="NAME_ASC">Name (A-Z)</option>
                                        <option value="NAME_DESC">Name (Z-A)</option>
                                        <option value="AGE_ASC">Age (Youngest)</option>
                                        <option value="AGE_DESC">Age (Oldest)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>Per Page:</span>
                                    <select
                                        aria-label="Patients per page"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4A7CD2]"
                                    >
                                        <option value={6}>6</option>
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Patient List Container */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                                        {currentPatients.length === 0 ? (
                                            <div className="text-center py-8 space-y-2">
                                                <p className="text-xs text-muted-text font-semibold">
                                                    {patientVisitTab === 'TODAY' 
                                                        ? "No patient visits scheduled for today yet." 
                                                        : "No patient files found."}
                                                </p>
                                                {patientVisitTab === 'TODAY' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPatientVisitTab('ALL')}
                                                        className="text-[11px] font-bold text-[#4A7CD2] hover:underline cursor-pointer"
                                                    >
                                                        View All Patients ({patients.length}) →
                                                    </button>
                                                )}
                                            </div>
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
                                                            prefetchApi(`patient_${p.patientID}`, () => apiFetch(`/api/patients/${p.patientID}`).then(r => r.json()));
                                                            prefetchApi(`patient_${p.patientID}_chart`, () => apiFetch(`/api/patients/${p.patientID}/chart`).then(r => r.json()));
                                                            prefetchApi(`patient_${p.patientID}_prescriptions`, () => apiFetch(`/api/patients/${p.patientID}/prescriptions`).then(r => r.json()));
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
                                                                <h5 className="text-sm font-extrabold text-[#10244B] flex items-center gap-1.5 flex-wrap">
                                                                    <span>{formatPatientName(p.firstName, p.lastName)}</span>
                                                                    {isPed ? (
                                                                        <span className="text-[8.5px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                                            👶 Pediatric {pAge !== null ? `(${pAge}y)` : ''}
                                                                        </span>
                                                                    ) : isMix ? (
                                                                        <span className="text-[8.5px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                                                            🔀 Mixed {pAge !== null ? `(${pAge}y)` : ''}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[8.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                            {pAge !== null ? `Age: ${pAge} Yrs` : 'DOB not set'}
                                                                        </span>
                                                                    )}
                                                                    {/* WhatsApp Active / Inactive Badge Pill */}
                                                                    {Boolean(p.whatsAppOptIn) ? (
                                                                        p.phone ? (
                                                                            <span 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const clean = (p.phone || '').replace(/[^\d]/g, '');
                                                                                    const num = clean.startsWith('0') ? '92' + clean.slice(1) : clean.startsWith('3') ? '92' + clean : clean;
                                                                                    window.open(`https://wa.me/${num}`, '_blank');
                                                                                }}
                                                                                className="text-[8px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 transition shadow-2xs"
                                                                                title={`WhatsApp Active: Click to open chat with ${p.phone}`}
                                                                            >
                                                                                <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                                                                                <span>WhatsApp Active</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span 
                                                                                className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1"
                                                                                title="WhatsApp Active but no phone number provided"
                                                                            >
                                                                                <MessageCircle className="w-2.5 h-2.5 text-amber-600" />
                                                                                <span>Active (No Phone)</span>
                                                                            </span>
                                                                        )
                                                                    ) : (
                                                                        <span 
                                                                            className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1"
                                                                            title="WhatsApp Inactive / Not Opted-in"
                                                                        >
                                                                            <MessageCircleOff className="w-2.5 h-2.5 text-slate-400" />
                                                                            <span>WhatsApp Inactive</span>
                                                                        </span>
                                                                    )}
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

                        {/* Column 1 Pagination Footer */}
                        <div className="flex-shrink-0 px-3 py-1.5 sm:py-2 border-t border-[#EAF0FC] bg-slate-50/70 flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded-md border border-[#BFDBFE]">
                                Page {currentPage} of {Math.max(totalPages, 1)}
                            </span>
                            <div className="flex gap-1.5">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer text-slate-700 transition"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer text-slate-700 transition"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 2: Active Consultation Dossier & Clinical Actions */}
                    <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-2xl border border-[#EAF0FC] shadow-2xs overflow-hidden">
                                {/* Card Header: Title & Action Controls */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                                        <h4 className="text-sm font-extrabold text-[#10244B] tracking-tight">Active Consultation</h4>
                                    </div>

                                    {selectedPatient && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Modern WhatsApp Notification Toggle Switch */}
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePatientWhatsApp(!Boolean(selectedPatient.whatsAppOptIn))}
                                                className={`group px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center gap-2 text-xs font-bold whitespace-nowrap select-none ${
                                                    Boolean(selectedPatient.whatsAppOptIn)
                                                        ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-300/80 ring-1 ring-emerald-400/20'
                                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                                }`}
                                                title={Boolean(selectedPatient.whatsAppOptIn) ? "WhatsApp Notifications are ON. Click to turn OFF." : "WhatsApp Notifications are OFF. Click to turn ON."}
                                            >
                                                <MessageCircle className={`w-3.5 h-3.5 ${Boolean(selectedPatient.whatsAppOptIn) ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                <span className="text-[11px] font-extrabold tracking-tight">WhatsApp</span>
                                                
                                                {/* Sleek Mini Switch Pill */}
                                                <div className={`w-7 h-3.5 rounded-full transition-colors flex items-center p-0.5 ${
                                                    Boolean(selectedPatient.whatsAppOptIn) ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                                                }`}>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform" />
                                                </div>
                                            </button>

                                            {/* Direct WhatsApp Web Chat Button */}
                                            {selectedPatient.phone && Boolean(selectedPatient.whatsAppOptIn) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const clean = (selectedPatient.phone || '').replace(/[^\d]/g, '');
                                                        const num = clean.startsWith('0') ? '92' + clean.slice(1) : clean.startsWith('3') ? '92' + clean : clean;
                                                        window.open(`https://wa.me/${num}`, "_blank");
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                                                    title={`Open Direct WhatsApp Web Chat with ${selectedPatient.firstName}`}
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span className="hidden sm:inline">Chat</span>
                                                </button>
                                            )}

                                            {/* Edit Patient Info */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditPatient(selectedPatient)}
                                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-[#4A7CD2] text-slate-700 hover:text-white border border-slate-200 hover:border-[#4A7CD2] rounded-xl transition-all shadow-2xs flex items-center gap-1.5 text-xs font-bold whitespace-nowrap cursor-pointer"
                                                title="Edit Patient Information"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </button>
                                        </div>
                                    )}
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
                                         <>
                                              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 space-y-2">
                                                {/* Patient Profile Dossier Banner */}
                                                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-slate-50/80 via-blue-50/20 to-white border border-slate-200/70 shadow-2xs">
                                                    <div className="w-13 h-13 rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0 bg-white ring-2 ring-white flex items-center justify-center">
                                                        <img 
                                                            src={getPatientAvatarUrl(selectedPatient)} 
                                                            alt={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-base font-extrabold text-[#10244B] tracking-tight">
                                                                {formatPatientName(selectedPatient.firstName, selectedPatient.lastName)}
                                                            </h4>
                                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#EAF0FC] text-[#4A7CD2] border border-[#BFDBFE]">
                                                                ID #{selectedPatient.patientID}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                                                            <span className="font-bold text-slate-700">{getAge(selectedPatient.dob) !== null ? `Age: ${getAge(selectedPatient.dob)} Yrs` : "DOB not set"}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="capitalize">{selectedPatient.gender || 'Male'}</span>
                                                            {selectedPatient.phone ? (
                                                                <>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span className="font-mono text-slate-700 font-bold">{selectedPatient.phone}</span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Interactive Treatment Modality Buttons */}
                                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2 mb-1 px-0.5">
                                                    <span>Treatment Plan Presets:</span>
                                                    <span className="text-[9px] font-medium lowercase text-slate-400">(click to assign)</span>
                                                </div>
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
                                                                 await apiFetch(`/api/patients/${selectedPatient.patientID}/treatment-plan`, {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json' },
                                                                     body: JSON.stringify({
                                                                         treatmentPlan: 'Braces (Orthodontics)',
                                                                         treatmentStage: bracesStage,
                                                                         targetShade: bracesWire
                                                                     })
                                                                 });
                                                                 // 2. Insert clinical log entry
                                                                 await apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
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
                                                                 await apiFetch(`/api/patients/${selectedPatient.patientID}/treatment-plan`, {
                                                                     method: 'POST',
                                                                     headers: { 'Content-Type': 'application/json' },
                                                                     body: JSON.stringify({
                                                                         treatmentPlan: 'Teeth Whitening',
                                                                         treatmentStage: whiteningSession,
                                                                         targetShade: `Initial: ${whiteningPreShade} ➔ Target: ${whiteningTargetShade}`
                                                                     })
                                                                 });
                                                                 // 2. Insert clinical log entry
                                                                 await apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
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
                                                                     await apiFetch('/api/patients/teeth/update-bulk', {
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
                                                                     await apiFetch(`/api/patients/${selectedPatient.patientID}/clinical-logs`, {
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

                                             {/* Percentage Detail (Infographic 2-Column Grid for Ultra-Compact Heights) */}
                                                <div className="pt-2 border-t border-[#EAF0FC] space-y-1.5">
                                                    <span className="text-[9.5px] font-black text-muted-text uppercase tracking-widest block">Health Overview</span>
                                                    {teethList.length === 0 ? (
                                                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center space-y-1">
                                                            <span className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Initial Clinical Exam
                                                            </span>
                                                            <p className="text-[10px] text-amber-700/80 font-medium">
                                                                No tooth findings or diagnostic records have been logged yet for this patient.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                                        {/* 1. Health */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-dark-slate uppercase tracking-wider">
                                                                <span>Health</span>
                                                                <span className="text-[#4A7CD2] font-black">{healthyPct}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#EAF0FC] h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-[#4A7CD2] h-full rounded-full" style={{ width: `${healthyPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                        {/* 2. Caries */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-dark-slate uppercase tracking-wider">
                                                                <span>Caries</span>
                                                                <span className="text-[#EF4444] font-black">{cariesPct}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#EAF0FC] h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-[#EF4444] h-full rounded-full" style={{ width: `${cariesPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                        {/* 3. RCT */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-dark-slate uppercase tracking-wider">
                                                                <span>RCT (Endo)</span>
                                                                <span className="text-[#F59E0B] font-black">{rctPct}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#EAF0FC] h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: `${rctPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                        {/* 4. Cleaning */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-dark-slate uppercase tracking-wider">
                                                                <span>Cleaning</span>
                                                                <span className="text-[#3B82F6] font-black">{cleaningPct}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#EAF0FC] h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: `${cleaningPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                        {/* 5. Treated */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-dark-slate uppercase tracking-wider">
                                                                <span>Treated</span>
                                                                <span className="text-[#8B5CF6] font-black">{prosthesisPct}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#EAF0FC] h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-[#8B5CF6] h-full rounded-full" style={{ width: `${prosthesisPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                        {/* 6. Missing */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-dark-slate uppercase tracking-wider">
                                                                <span>Missing</span>
                                                                <span className="text-[#64748B] font-black">{missingPct}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#EAF0FC] h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-[#64748B] h-full rounded-full" style={{ width: `${missingPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    )}
                                                </div>

                                                {/* Diagnostic Details list */}
                                                <div className="space-y-1 text-[10px] border-t border-[#EAF0FC] pt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-extrabold text-muted-text uppercase tracking-wider">Email:</span>
                                                        <span className="font-black text-dark-slate truncate max-w-[200px]">{selectedPatient.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-extrabold text-muted-text uppercase tracking-wider">Address:</span>
                                                        <span className="font-black text-dark-slate text-right truncate max-w-[200px]">{selectedPatient.address || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Primary Action Buttons Footer */}
                                            <div className="flex-shrink-0 p-2 sm:p-2.5 border-t border-[#EAF0FC] bg-slate-50/70 grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => navigate(`/chart/${selectedPatient.patientID}${activeTreatmentTag ? `?treatment=${activeTreatmentTag}` : ''}`)}
                                                    onPointerEnter={() => {
                                                        preloadJawImages({ immediate: true });
                                                        if (selectedPatient?.patientID) {
                                                            prefetchApi(`patient_${selectedPatient.patientID}`, () => apiFetch(`/api/patients/${selectedPatient.patientID}`).then(r => r.json()));
                                                            prefetchApi(`patient_${selectedPatient.patientID}_chart`, () => apiFetch(`/api/patients/${selectedPatient.patientID}/chart`).then(r => r.json()));
                                                            prefetchApi(`patient_${selectedPatient.patientID}_prescriptions`, () => apiFetch(`/api/patients/${selectedPatient.patientID}/prescriptions`).then(r => r.json()));
                                                            prefetchApi(`patient_${selectedPatient.patientID}_diagnostic`, () => apiFetch(`/api/patients/${selectedPatient.patientID}/diagnostic-assessment`).then(r => r.ok && r.status !== 204 ? r.json() : null));
                                                        }
                                                    }}
                                                    className="w-full bg-[#4A7CD2] hover:bg-[#3665B7] text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <Stethoscope className="w-3.5 h-3.5" />
                                                    <span>Odontogram</span>
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/chart/${selectedPatient.patientID}?tab=billing`)}
                                                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Plans & Invoices</span>
                                                </button>
                                            </div>
                                        </>
                                    );
                                })() : (
                                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                                        <p className="text-xs text-muted-text italic">Select a patient from the directory to review dossier.</p>
                                    </div>
                                )}
                    </div>

                    {/* COLUMN 3: Clinic Schedule & Appointments Panel */}
                    <div className="lg:col-span-3 flex flex-col h-full bg-white rounded-2xl border border-[#EAF0FC] shadow-2xs overflow-hidden">
                        
                        {/* Column 3 Header: Schedule Title & Segmented Tab Switch */}
                        <div className="p-2.5 sm:p-3 border-b border-[#EAF0FC] flex flex-col gap-2 flex-shrink-0 bg-white">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs sm:text-sm font-extrabold text-[#10244B] flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                    <span>Clinic Schedule</span>
                                </h4>
                                
                                {/* Pagination Controls for Active Tab */}
                                {scheduleTab === 'UPCOMING' && totalUpcomingPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button 
                                            disabled={upcomingPage === 1}
                                            onClick={() => setUpcomingPage(prev => Math.max(prev - 1, 1))}
                                            className="p-0.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer"
                                        >
                                            <ChevronLeft className="w-3 h-3 text-dark-slate" />
                                        </button>
                                        <span className="text-[8px] font-bold text-muted-text min-w-[24px] text-center">
                                            {upcomingPage}/{totalUpcomingPages}
                                        </span>
                                        <button 
                                            disabled={upcomingPage === totalUpcomingPages}
                                            onClick={() => setUpcomingPage(prev => Math.min(prev + 1, totalUpcomingPages))}
                                            className="p-0.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer"
                                        >
                                            <ChevronRight className="w-3 h-3 text-dark-slate" />
                                        </button>
                                    </div>
                                )}

                                {scheduleTab === 'PAST' && totalPastPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button 
                                            disabled={pastPage === 1}
                                            onClick={() => setPastPage(prev => Math.max(prev - 1, 1))}
                                            className="p-0.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer"
                                        >
                                            <ChevronLeft className="w-3 h-3 text-dark-slate" />
                                        </button>
                                        <span className="text-[8px] font-bold text-muted-text min-w-[24px] text-center">
                                            {pastPage}/{totalPastPages}
                                        </span>
                                        <button 
                                            disabled={pastPage === totalPastPages}
                                            onClick={() => setPastPage(prev => Math.min(prev + 1, totalPastPages))}
                                            className="p-0.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-[#EAF0FC]/40 cursor-pointer"
                                        >
                                            <ChevronRight className="w-3 h-3 text-dark-slate" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Segmented Switch: Upcoming vs Past Sessions */}
                            <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-xl border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setScheduleTab('UPCOMING')}
                                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                                        scheduleTab === 'UPCOMING'
                                            ? 'bg-[#4A7CD2] text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                    }`}
                                >
                                    Upcoming ({newAppointments.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScheduleTab('PAST')}
                                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                                        scheduleTab === 'PAST'
                                            ? 'bg-rose-500 text-white shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                    }`}
                                >
                                    Past ({oldAppointments.length})
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Appointment List */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                            {scheduleTab === 'UPCOMING' ? (
                                currentUpcoming.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-xs text-muted-text italic">No upcoming appointments scheduled.</p>
                                    </div>
                                ) : (
                                    currentUpcoming.map((app) => {
                                        const matchedPatient = patients.find(p => p.patientID === app.patientID);
                                        const isSelected = selectedPatient?.patientID === app.patientID;
                                        return (
                                            <div 
                                                key={app.appointmentID} 
                                                onClick={() => {
                                                    if (matchedPatient) setSelectedPatient(matchedPatient);
                                                }}
                                                className={`p-2 rounded-xl border flex justify-between items-center text-xs transition cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-[#EAF0FC] border-[#4A7CD2] shadow-2xs' 
                                                        : 'bg-white border-[#EAF0FC] hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-1">
                                                    <p className="font-extrabold text-[#10244B] text-xs truncate">{app.fullName}</p>
                                                    <span className="text-[9px] text-slate-500 font-semibold truncate block">{app.reason || 'General Checkup'}</span>
                                                </div>
                                                <span className="bg-[#4A7CD2] text-white px-2 py-0.5 rounded-md flex items-center gap-1 font-bold text-[9px] flex-shrink-0">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(app.preferredDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                currentPast.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-xs text-muted-text italic">No past sessions on record.</p>
                                    </div>
                                ) : (
                                    currentPast.map((app) => {
                                        const matchedPatient = patients.find(p => p.patientID === app.patientID);
                                        const isSelected = selectedPatient?.patientID === app.patientID;
                                        return (
                                            <div 
                                                key={app.appointmentID} 
                                                onClick={() => {
                                                    if (matchedPatient) setSelectedPatient(matchedPatient);
                                                }}
                                                className={`p-2 rounded-xl border flex justify-between items-center text-xs transition cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-rose-50 border-rose-300 shadow-2xs' 
                                                        : 'bg-white border-[#EAF0FC] hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-1">
                                                    <p className="font-extrabold text-[#10244B] text-xs truncate">{app.fullName}</p>
                                                    <span className="text-[9px] text-slate-500 font-semibold truncate block">{app.reason || 'Completed Visit'}</span>
                                                </div>
                                                <span className="bg-rose-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 font-bold text-[9px] flex-shrink-0">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(app.preferredDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>

                        {/* Compact Registration Callout at Bottom of Col 3 */}
                        <div className="flex-shrink-0 p-2 sm:p-2.5 border-t border-[#EAF0FC] bg-gradient-to-r from-[#4A7CD2] to-[#6366F1] text-white flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-black leading-tight">Fast Registration</p>
                                <p className="text-[9px] text-white/80 font-medium">Create a digital chart file</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => navigate('/new-patient')}
                                className="bg-white hover:bg-slate-50 text-[#4A7CD2] px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm transition cursor-pointer"
                            >
                                <Plus className="w-3 h-3 stroke-[3]" />
                                <span>Add</span>
                            </button>
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
                                        maxLength={50}
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
                                        maxLength={50}
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
                                        max={new Date().toISOString().split('T')[0]}
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

                            {/* WhatsApp Opt-In Consent Toggle */}
                            <div className="pt-1">
                                <WhatsAppOptInToggle 
                                    checked={editForm.whatsAppOptIn ?? true}
                                    onChange={(checked) => setEditForm(prev => ({ ...prev, whatsAppOptIn: checked }))}
                                    phone={editForm.phone}
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

            {/* Desktop Slim Clinical Status Bar (Zero Page Scroll) */}
            <div className="hidden lg:flex flex-shrink-0 h-6 bg-white border-t border-[#EAF0FC] px-4 items-center justify-between text-[10px] text-slate-500 font-medium select-none z-10">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        Cloud EHR Live
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>Directory: <strong className="text-slate-700">{patients.length} records</strong></span>
                    <span className="text-slate-300">|</span>
                    <span>Appointments: <strong className="text-slate-700">{appointments.length} total</strong></span>
                </div>
                <div className="flex items-center gap-3">
                    <span>Odontogram & NanoPix: <strong className="text-[#4A7CD2]">Ready</strong></span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400 font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Mobile Standard Footer (Shown only on small screens) */}
            <div className="block lg:hidden flex-shrink-0">
                <Footer />
            </div>
        </div>
    );
}

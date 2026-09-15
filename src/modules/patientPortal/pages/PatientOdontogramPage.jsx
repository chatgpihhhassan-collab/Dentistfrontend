import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, Printer, FileDown, ShieldCheck, AlertCircle, CheckCircle2, 
    Calendar, Stethoscope, Clock, FileText, Sparkles, Layers, Eye, 
    Info, Tag, RefreshCw, ChevronDown, ChevronUp, Check, ExternalLink
} from 'lucide-react';
import * as THREE from 'three';
import API_BASE_URL from '../../../config/apiConfig';
import ThreeDentalJawArch from '../../../components/ThreeDentalJawArch';
import { handlePrintCompletePatientReport, getAttendingDoctorName } from '../../../utils/printReportUtils';

// ============================================================================
// 1. Anatomical Tooth Metadata & FDI Cross-Reference Database (Teeth 1–32)
// ============================================================================
export const TOOTH_METADATA = {
    // Upper Jaw - Maxilla (Teeth 1 to 16)
    1:  { fdi: 18, shape: 'molar',    type: '3rd Molar (Wisdom)',     quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right 3rd Molar' },
    2:  { fdi: 17, shape: 'molar',    type: '2nd Molar',              quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right 2nd Molar' },
    3:  { fdi: 16, shape: 'molar',    type: '1st Molar (6-Yr)',       quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right 1st Molar' },
    4:  { fdi: 15, shape: 'premolar', type: '2nd Premolar (Bicuspid)',quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right 2nd Premolar' },
    5:  { fdi: 14, shape: 'premolar', type: '1st Premolar (Bicuspid)',quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right 1st Premolar' },
    6:  { fdi: 13, shape: 'canine',   type: 'Canine (Eyetooth)',      quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right Canine' },
    7:  { fdi: 12, shape: 'incisor',  type: 'Lateral Incisor',        quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right Lateral Incisor' },
    8:  { fdi: 11, shape: 'incisor',  type: 'Central Incisor',        quadrant: 'Maxillary Right (Q1)', jaw: 'maxilla', name: 'Upper Right Central Incisor' },
    9:  { fdi: 21, shape: 'incisor',  type: 'Central Incisor',        quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left Central Incisor' },
    10: { fdi: 22, shape: 'incisor',  type: 'Lateral Incisor',        quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left Lateral Incisor' },
    11: { fdi: 23, shape: 'canine',   type: 'Canine (Eyetooth)',      quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left Canine' },
    12: { fdi: 24, shape: 'premolar', type: '1st Premolar (Bicuspid)',quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left 1st Premolar' },
    13: { fdi: 25, shape: 'premolar', type: '2nd Premolar (Bicuspid)',quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left 2nd Premolar' },
    14: { fdi: 26, shape: 'molar',    type: '1st Molar (6-Yr)',       quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left 1st Molar' },
    15: { fdi: 27, shape: 'molar',    type: '2nd Molar',              quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left 2nd Molar' },
    16: { fdi: 28, shape: 'molar',    type: '3rd Molar (Wisdom)',     quadrant: 'Maxillary Left (Q2)',  jaw: 'maxilla', name: 'Upper Left 3rd Molar' },

    // Lower Jaw - Mandible (Teeth 17 to 32)
    17: { fdi: 38, shape: 'molar',    type: '3rd Molar (Wisdom)',     quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left 3rd Molar' },
    18: { fdi: 37, shape: 'molar',    type: '2nd Molar',              quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left 2nd Molar' },
    19: { fdi: 36, shape: 'molar',    type: '1st Molar (6-Yr)',       quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left 1st Molar' },
    20: { fdi: 35, shape: 'premolar', type: '2nd Premolar (Bicuspid)',quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left 2nd Premolar' },
    21: { fdi: 34, shape: 'premolar', type: '1st Premolar (Bicuspid)',quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left 1st Premolar' },
    22: { fdi: 33, shape: 'canine',   type: 'Canine',                 quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left Canine' },
    23: { fdi: 32, shape: 'incisor',  type: 'Lateral Incisor',        quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left Lateral Incisor' },
    24: { fdi: 31, shape: 'incisor',  type: 'Central Incisor',        quadrant: 'Mandibular Left (Q3)', jaw: 'mandible', name: 'Lower Left Central Incisor' },
    25: { fdi: 41, shape: 'incisor',  type: 'Central Incisor',        quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right Central Incisor' },
    26: { fdi: 42, shape: 'incisor',  type: 'Lateral Incisor',        quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right Lateral Incisor' },
    27: { fdi: 43, shape: 'canine',   type: 'Canine',                 quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right Canine' },
    28: { fdi: 44, shape: 'premolar', type: '1st Premolar (Bicuspid)',quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right 1st Premolar' },
    29: { fdi: 45, shape: 'premolar', type: '2nd Premolar (Bicuspid)',quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right 2nd Premolar' },
    30: { fdi: 46, shape: 'molar',    type: '1st Molar (6-Yr)',       quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right 1st Molar' },
    31: { fdi: 47, shape: 'molar',    type: '2nd Molar',              quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right 2nd Molar' },
    32: { fdi: 48, shape: 'molar',    type: '3rd Molar (Wisdom)',     quadrant: 'Mandibular Right (Q4)',jaw: 'mandible', name: 'Lower Right 3rd Molar' }
};

// ============================================================================
// 2. Single Tooth 3D Rotating Three.js Canvas Inspector Preview
// ============================================================================
function SingleTooth3DCanvas({ toothNum, shape, color }) {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const container = mountRef.current;
        const width = 110;
        const height = 110;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(0, 0, 3.4);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
        dirLight.position.set(2, 3, 4);
        scene.add(dirLight);

        const texLoader = new THREE.TextureLoader();
        const texturePath = `/tooth_textures/${shape || 'molar'}.png`;
        const texture = texLoader.load(texturePath);
        texture.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.PlaneGeometry(2.1, 2.1);
        const resolvedColor = color ? new THREE.Color(color) : new THREE.Color(0xffffff);
        const mat = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            roughness: 0.25,
            metalness: 0.1,
            color: resolvedColor
        });

        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        let reqId;
        let angle = 0;
        const animate = () => {
            reqId = requestAnimationFrame(animate);
            angle += 0.015;
            mesh.rotation.y = Math.sin(angle) * 0.35;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(reqId);
            renderer.dispose();
            geo.dispose();
            mat.dispose();
            if (texture?.dispose) texture.dispose();
            if (container) container.innerHTML = '';
        };
    }, [toothNum, shape, color]);

    return (
        <div ref={mountRef} className="w-[110px] h-[110px] flex items-center justify-center relative cursor-grab shrink-0" />
    );
}

// ============================================================================
// 3. Anatomical 2D Tooth Shape Silhouette Component
// ============================================================================
function AnatomicalToothShape({ shape, color, isSelected }) {
    const strokeColor = isSelected ? '#0D9488' : '#CBD5E1';
    const fillColor = color || '#10B981';

    if (shape === 'molar') {
        // Multi-cusped broad occlusal profile
        return (
            <svg viewBox="0 0 40 46" className="w-6 h-7 transition-transform drop-shadow-2xs">
                <path 
                    d="M6 10 C6 5, 14 3, 20 3 C26 3, 34 5, 34 10 C35 18, 36 28, 32 38 C28 44, 25 43, 23 35 C22 30, 18 30, 17 35 C15 43, 12 44, 8 38 C4 28, 5 18, 6 10 Z" 
                    fill={fillColor} 
                    stroke={strokeColor} 
                    strokeWidth={isSelected ? "2.5" : "1.5"} 
                />
                <circle cx="16" cy="14" r="2" fill="white" opacity="0.4" />
                <circle cx="24" cy="14" r="2" fill="white" opacity="0.4" />
                <path d="M14 20 Q20 23 26 20" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" />
            </svg>
        );
    }
    if (shape === 'premolar') {
        // Bicuspid dual cusps profile
        return (
            <svg viewBox="0 0 34 44" className="w-5 h-6 transition-transform drop-shadow-2xs">
                <path 
                    d="M6 10 C6 5, 12 3, 17 3 C22 3, 28 5, 28 10 C29 18, 29 28, 26 36 C24 41, 21 41, 19 33 C18 29, 16 29, 15 33 C13 41, 10 41, 8 36 C5 28, 5 18, 6 10 Z" 
                    fill={fillColor} 
                    stroke={strokeColor} 
                    strokeWidth={isSelected ? "2.5" : "1.5"} 
                />
                <circle cx="17" cy="13" r="2" fill="white" opacity="0.4" />
                <path d="M12 18 Q17 21 22 18" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" />
            </svg>
        );
    }
    if (shape === 'canine') {
        // Pointed cusp diamond profile
        return (
            <svg viewBox="0 0 30 46" className="w-4 h-6 transition-transform drop-shadow-2xs">
                <path 
                    d="M15 2 C18 5, 25 10, 26 18 C27 26, 24 35, 20 40 C17 44, 13 44, 10 40 C6 35, 3 26, 4 18 C5 10, 12 5, 15 2 Z" 
                    fill={fillColor} 
                    stroke={strokeColor} 
                    strokeWidth={isSelected ? "2.5" : "1.5"} 
                />
                <circle cx="15" cy="15" r="1.5" fill="white" opacity="0.45" />
            </svg>
        );
    }
    // Incisor: spatulate straight incisal edge
    return (
        <svg viewBox="0 0 28 44" className="w-4 h-6 transition-transform drop-shadow-2xs">
            <path 
                d="M4 6 C8 4, 20 4, 24 6 C25 16, 24 28, 21 37 C18 43, 10 43, 7 37 C4 28, 3 16, 4 6 Z" 
                fill={fillColor} 
                stroke={strokeColor} 
                strokeWidth={isSelected ? "2.5" : "1.5"} 
            />
            <line x1="7" y1="8" x2="21" y2="8" stroke="white" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
        </svg>
    );
}

// ============================================================================
// 4. Main Patient Odontogram Page Component
// ============================================================================
export default function PatientOdontogramPage() {
    const [teethState, setTeethState] = useState([]);
    const [diagnosticAssessment, setDiagnosticAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cockpit View Modes & Selected Tooth
    const [selectedToothNum, setSelectedToothNum] = useState(1);
    const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
    const [activeJawTab, setActiveJawTab] = useState('both'); // 'both' | 'maxilla' | 'mandible'
    const [showDiagBanner, setShowDiagBanner] = useState(true);

    const patient = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('patient') || '{}');
        } catch {
            return {};
        }
    }, []);

    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');

    const doctorName = useMemo(() => getAttendingDoctorName(null, patient), [patient]);

    // Fetch verified chairside teeth telemetry and doctor assessment
    useEffect(() => {
        const fetchOdontogramAndAssessment = async () => {
            setLoading(true);
            try {
                const token = patient.token;
                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Fetch Odontogram Teeth States
                try {
                    let res;
                    try {
                        res = await fetch(`${API_BASE_URL}/api/patient-portal/odontogram`, { headers });
                    } catch {
                        res = await fetch(`/api/patient-portal/odontogram`, { headers });
                    }

                    if (res && res.ok) {
                        const data = await res.json();
                        const teethArray = Array.isArray(data) ? data : [];
                        setTeethState(teethArray);

                        // Auto-select first pathology tooth if available, else tooth #14 or #1
                        const flagged = teethArray.find(t => {
                            const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
                            return s && !s.includes('healthy') && !s.includes('sound');
                        });
                        if (flagged) {
                            const num = flagged.toothNumber ?? flagged.ToothNumber ?? parseInt(flagged.toothKey, 10);
                            if (num) setSelectedToothNum(num);
                        } else {
                            setSelectedToothNum(14); // Default to molar #14
                        }
                    }
                } catch (e) {
                    console.error('Failed to load odontogram teeth:', e);
                }

                // 2. Fetch Doctor's Diagnostic Assessment
                try {
                    let diagRes;
                    try {
                        diagRes = await fetch(`${API_BASE_URL}/api/patient-portal/diagnostic-assessment`, { headers });
                    } catch {
                        diagRes = await fetch(`/api/patient-portal/diagnostic-assessment`, { headers });
                    }

                    if (diagRes && diagRes.ok) {
                        const diagData = await diagRes.json();
                        setDiagnosticAssessment(diagData);
                    }
                } catch (e) {
                    console.error('Failed to load diagnostic assessment:', e);
                }

            } catch (err) {
                console.error('Failed to load odontogram telemetry:', err);
                setError('Could not load real-time tooth chart.');
            } finally {
                setLoading(false);
            }
        };

        fetchOdontogramAndAssessment();
    }, [patient.token]);

    // Fast indexed teeth dictionary
    const teethMap = useMemo(() => {
        const map = {};
        teethState.forEach(t => {
            const num = t.toothNumber ?? t.ToothNumber ?? parseInt(t.toothKey || t.ToothKey, 10);
            if (num) map[num] = t;
        });
        return map;
    }, [teethState]);

    // Resolver for any tooth status & color
    const getResolvedTooth = (num) => {
        const meta = TOOTH_METADATA[num] || {
            fdi: num,
            shape: 'molar',
            type: 'Permanent Tooth',
            quadrant: 'Dental Arch',
            jaw: num <= 16 ? 'maxilla' : 'mandible',
            name: `Tooth #${num}`
        };

        const rec = teethMap[num];
        if (!rec) {
            return {
                num,
                ...meta,
                status: 'Sound & Healthy',
                category: 'healthy',
                color: '#10B981',
                bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                comments: 'Intact anatomical enamel, physiological baseline.',
                surfaces: 'Sound',
                cdtCode: 'D0120'
            };
        }

        const raw = (rec.conditionStatus || rec.ConditionStatus || rec.status || '').trim();
        const sLower = raw.toLowerCase();
        const savedColor = rec.conditionColor || rec.ConditionColor || rec.color;

        // Healthy
        if (!raw || sLower.includes('healthy') || sLower.includes('sound') || sLower.includes('intact')) {
            return {
                num,
                ...meta,
                status: raw || 'Sound & Healthy',
                category: 'healthy',
                color: '#10B981',
                bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                comments: rec.comments || rec.Comments || 'Intact anatomical enamel, physiological baseline.',
                surfaces: rec.affectedSurfaces || rec.surfaces || 'Sound',
                cdtCode: rec.procedureCode || rec.cdtCode || 'D0120'
            };
        }

        // Restored
        if (sLower.includes('restor') || sLower.includes('fill') || sLower.includes('crown') || sLower.includes('veneer') || sLower.includes('implant') || sLower.includes('bridge') || sLower.includes('treat')) {
            return {
                num,
                ...meta,
                status: raw || 'Restored / Treated',
                category: 'restored',
                color: (savedColor && savedColor !== '#10B981') ? savedColor : '#3B82F6',
                bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
                comments: rec.comments || rec.Comments || 'Clinical restoration verified.',
                surfaces: rec.affectedSurfaces || rec.surfaces || 'Occlusal',
                cdtCode: rec.procedureCode || rec.cdtCode || (sLower.includes('crown') ? 'D2740' : 'D2391')
            };
        }

        // Attention / Caries / RCT / Pathology
        const resolvedColor = (savedColor && savedColor !== '#10B981') ? savedColor : '#EF4444';
        return {
            num,
            ...meta,
            status: raw || 'Active Pathology / Care Needed',
            category: 'attention',
            color: resolvedColor,
            bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
            comments: rec.comments || rec.Comments || 'Chairside diagnostic findings recorded. Observation recommended.',
            surfaces: rec.affectedSurfaces || rec.surfaces || 'Occlusal',
            cdtCode: rec.procedureCode || rec.cdtCode || (sLower.includes('canal') ? 'D3330' : 'D2140')
        };
    };

    // Calculate accurate clinical counts
    const activePathologyTeeth = useMemo(() => {
        return teethState.filter(t => {
            const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
            return s && !s.includes('healthy') && !s.includes('sound');
        });
    }, [teethState]);

    const treatedCount = useMemo(() => {
        return activePathologyTeeth.filter(t => {
            const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
            return s.includes('restor') || s.includes('fill') || s.includes('crown') || s.includes('veneer') || s.includes('implant') || s.includes('treated');
        }).length;
    }, [activePathologyTeeth]);

    const plannedCount = Math.max(0, activePathologyTeeth.length - treatedCount);
    const healthyCount = Math.max(0, 32 - (treatedCount + plannedCount));

    // Currently inspected tooth details
    const activeTooth = useMemo(() => {
        return getResolvedTooth(selectedToothNum);
    }, [selectedToothNum, teethMap]);

    // Print & PDF Handler
    const handlePrintOrPdf = () => {
        handlePrintCompletePatientReport(patient, teethState, { name: doctorName });
    };

    // Tooth Arch Sets
    const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

    return (
        <div className="max-w-[1440px] mx-auto space-y-5 animate-in fade-in pb-12">
            
            {/* =========================================================================
                1. TOP CONTROL BAR: TITLE, PATIENT DEMOGRAPHICS, KPI BADGES, ACTIONS
                ========================================================================= */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-light-teal shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/portal/dashboard"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-teal hover:text-primary-hover transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Portal Dashboard</span>
                        </Link>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-mono font-bold text-muted-text">
                            Ref: {patient.referenceNumber || 'DEN-2026-66596'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                            32-Tooth Dental Odontogram & 3D Anatomy
                        </h1>
                        <span className="px-3 py-0.5 rounded-full bg-light-teal text-primary-teal text-xs font-bold font-mono">
                            {patientName}
                        </span>
                    </div>

                    <p className="text-xs text-muted-text flex flex-wrap items-center gap-2">
                        <span>Attending Surgeon: <strong className="text-dark-slate font-bold">{doctorName}</strong></span>
                        <span>•</span>
                        <span>ADA / FDI Unified Charting Protocol</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Telemetry Synchronized
                        </span>
                    </p>
                </div>

                {/* Right Header Actions: HUD Score Badges + Print/PDF Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* HUD Counters */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
                        <div className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{healthyCount} Sound</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>{treatedCount} Restored</span>
                        </div>
                        {plannedCount > 0 && (
                            <div className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span>{plannedCount} Monitored</span>
                            </div>
                        )}
                    </div>

                    {/* View Switcher: 3D Three.js vs 2D Chart */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setViewMode('3d')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === '3d'
                                    ? 'bg-white text-primary-teal shadow-xs font-black'
                                    : 'text-slate-600 hover:text-dark-slate'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary-teal" />
                            <span>3D Three.js</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('2d')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                viewMode === '2d'
                                    ? 'bg-white text-primary-teal shadow-xs font-black'
                                    : 'text-slate-600 hover:text-dark-slate'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            <span>2D Chart</span>
                        </button>
                    </div>

                    {/* Print & PDF Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrintOrPdf}
                            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-dark-slate text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title="Print complete official dental odontogram report"
                        >
                            <Printer className="w-4 h-4 text-primary-teal" />
                            <span className="hidden sm:inline">Print Odontogram</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrintOrPdf}
                            className="px-4 py-2 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-primary-teal/20 cursor-pointer"
                            title="Export PDF of clinical record"
                        >
                            <FileDown className="w-4 h-4" />
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                2. COMPACT COLLAPSIBLE DIAGNOSTIC ASSESSMENT BANNER
                ========================================================================= */}
            {diagnosticAssessment && (
                <div className="rounded-3xl bg-gradient-to-r from-[#10244B] via-[#1E3A8A] to-primary-teal text-white shadow-md p-4 sm:p-5 transition-all">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                                        Verified Clinical Examination
                                    </span>
                                    {diagnosticAssessment.cdtCode && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-mono font-bold">
                                            Procedure: {diagnosticAssessment.cdtCode}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">
                                    {diagnosticAssessment.diagnosisSummary || 'Chairside diagnostic findings recorded.'}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDiagBanner(prev => !prev)}
                                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                                <span>{showDiagBanner ? 'Hide Details' : 'View Details'}</span>
                                {showDiagBanner ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {showDiagBanner && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 mt-3 border-t border-white/15 text-xs animate-in fade-in">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Clinical Suite Category</span>
                                <span className="font-semibold text-white mt-0.5 block">{diagnosticAssessment.suiteCategory || 'Comprehensive Dental Diagnostics'}</span>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Examination Date & Time</span>
                                <span className="font-semibold text-white mt-0.5 block">
                                    {new Date(diagnosticAssessment.updatedAt || diagnosticAssessment.createdAt || Date.now()).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">Attending Practitioner</span>
                                <span className="font-semibold text-white mt-0.5 block">{doctorName}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* =========================================================================
                3. MAIN UNIFIED COCKPIT: DENTAL ARCH (LEFT) & INSTANT TOOTH INSPECTOR (RIGHT)
                ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                {/* ---------------------------------------------------------------------
                    LEFT PANEL (lg:col-span-7 xl:col-span-8): DENTAL ARCH VISUALIZER
                    --------------------------------------------------------------------- */}
                <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-light-teal shadow-xs space-y-4">
                    
                    {/* Visualizer Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-light-teal">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-light-teal text-primary-teal flex items-center justify-center font-bold">
                                {viewMode === '3d' ? <Sparkles className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                            </div>
                            <div>
                                <h3 className="text-base font-serif font-black text-dark-slate">
                                    {viewMode === '3d' ? 'Three.js 3D Anatomical Jaw Arches' : '2D Clinical Odontogram Chart'}
                                </h3>
                                <p className="text-[11px] text-muted-text">
                                    Click any tooth to inspect verified chairside findings in the right panel.
                                </p>
                            </div>
                        </div>

                        {/* Jaw Filter (for 3D Mode) */}
                        {viewMode === '3d' && (
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setActiveJawTab('both')}
                                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                        activeJawTab === 'both' ? 'bg-white text-primary-teal shadow-2xs' : 'text-slate-600 hover:text-dark-slate'
                                    }`}
                                >
                                    Both Jaws
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveJawTab('maxilla')}
                                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                        activeJawTab === 'maxilla' ? 'bg-white text-primary-teal shadow-2xs' : 'text-slate-600 hover:text-dark-slate'
                                    }`}
                                >
                                    Maxilla (Upper)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveJawTab('mandible')}
                                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                        activeJawTab === 'mandible' ? 'bg-white text-primary-teal shadow-2xs' : 'text-slate-600 hover:text-dark-slate'
                                    }`}
                                >
                                    Mandible (Lower)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* VIEW MODE A: THREE.JS 3D ANATOMICAL JAW ARCHES */}
                    {viewMode === '3d' ? (
                        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] border border-light-teal/70 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Maxilla (Upper Jaw) */}
                                {(activeJawTab === 'both' || activeJawTab === 'maxilla') && (
                                    <div className="flex flex-col items-center bg-white rounded-2xl p-3 border border-light-teal/50 shadow-2xs">
                                        <div className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl mb-2 text-xs font-bold text-dark-slate">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-primary-teal" />
                                                <span>Upper Jaw (Maxilla)</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-text">Teeth #1 – #16</span>
                                        </div>

                                        <div className="w-full h-[280px] flex items-center justify-center overflow-hidden">
                                            <ThreeDentalJawArch
                                                key={`portal_maxilla_${activeTooth.num}`}
                                                jawType="maxilla"
                                                isPediatric={false}
                                                teethState={teethState}
                                                highlightedTeeth={[selectedToothNum]}
                                                className="w-full max-w-[280px] h-[270px] aspect-square"
                                                onToothClick={(toothNum) => setSelectedToothNum(Number(toothNum))}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Mandible (Lower Jaw) */}
                                {(activeJawTab === 'both' || activeJawTab === 'mandible') && (
                                    <div className="flex flex-col items-center bg-white rounded-2xl p-3 border border-light-teal/50 shadow-2xs">
                                        <div className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl mb-2 text-xs font-bold text-dark-slate">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-[#4A7CD2]" />
                                                <span>Lower Jaw (Mandible)</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-text">Teeth #17 – #32</span>
                                        </div>

                                        <div className="w-full h-[280px] flex items-center justify-center overflow-hidden">
                                            <ThreeDentalJawArch
                                                key={`portal_mandible_${activeTooth.num}`}
                                                jawType="mandible"
                                                isPediatric={false}
                                                teethState={teethState}
                                                highlightedTeeth={[selectedToothNum]}
                                                className="w-full max-w-[280px] h-[270px] aspect-square"
                                                onToothClick={(toothNum) => setSelectedToothNum(Number(toothNum))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3D Legend Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-white rounded-xl border border-light-teal/60 text-xs font-semibold">
                                <span className="text-[11px] text-muted-text font-bold">3D Crown Shader Key:</span>
                                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-2xs" />
                                        <span>Healthy Physiological Enamel</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-md bg-blue-500 shadow-2xs" />
                                        <span>Restored / Crown / Filling</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-md bg-rose-500 shadow-2xs" />
                                        <span>Caries / Pathology / Monitored</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* VIEW MODE B: 2D ANATOMICAL CHART WITH CONTOURED SHAPES */
                        <div className="p-4 sm:p-5 rounded-2xl bg-warm-cream/50 border border-light-teal space-y-5">
                            
                            {/* Upper Jaw (Maxilla) Teeth 1 to 16 */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-muted-text uppercase tracking-wider px-1">
                                    <span>Maxillary Right (Q1)</span>
                                    <span className="text-dark-slate font-black">Upper Jaw (Maxilla)</span>
                                    <span>Maxillary Left (Q2)</span>
                                </div>

                                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 sm:gap-1.5 justify-items-center">
                                    {upperTeeth.map(num => {
                                        const tooth = getResolvedTooth(num);
                                        const isSelected = selectedToothNum === num;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setSelectedToothNum(num)}
                                                className={`w-9 h-14 sm:w-10 sm:h-16 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'ring-2 ring-primary-teal bg-white shadow-md scale-105' 
                                                        : 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs hover:scale-105'
                                                }`}
                                                title={`#${num} - ${tooth.name} (${tooth.status})`}
                                            >
                                                <span className="text-[9px] font-mono font-bold text-slate-500">#{num}</span>
                                                <AnatomicalToothShape 
                                                    shape={tooth.shape} 
                                                    color={tooth.color} 
                                                    isSelected={isSelected} 
                                                />
                                                <span 
                                                    className="w-2 h-2 rounded-full shadow-2xs"
                                                    style={{ backgroundColor: tooth.color }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Occlusal Bite Plane Divider */}
                            <div className="relative flex items-center justify-center">
                                <div className="w-full border-t border-dashed border-light-teal" />
                                <span className="absolute px-3 py-0.5 rounded-full bg-white text-[9px] font-bold text-muted-text tracking-wider uppercase border border-light-teal shadow-2xs">
                                    Occlusal Bite Line · 32 Permanent Teeth
                                </span>
                            </div>

                            {/* Lower Jaw (Mandible) Teeth 32 to 17 */}
                            <div className="space-y-1.5">
                                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 sm:gap-1.5 justify-items-center">
                                    {lowerTeeth.map(num => {
                                        const tooth = getResolvedTooth(num);
                                        const isSelected = selectedToothNum === num;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setSelectedToothNum(num)}
                                                className={`w-9 h-14 sm:w-10 sm:h-16 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'ring-2 ring-primary-teal bg-white shadow-md scale-105' 
                                                        : 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs hover:scale-105'
                                                }`}
                                                title={`#${num} - ${tooth.name} (${tooth.status})`}
                                            >
                                                <span 
                                                    className="w-2 h-2 rounded-full shadow-2xs"
                                                    style={{ backgroundColor: tooth.color }}
                                                />
                                                <AnatomicalToothShape 
                                                    shape={tooth.shape} 
                                                    color={tooth.color} 
                                                    isSelected={isSelected} 
                                                />
                                                <span className="text-[9px] font-mono font-bold text-slate-500">#{num}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-bold text-muted-text uppercase tracking-wider px-1 pt-1">
                                    <span>Mandibular Right (Q4)</span>
                                    <span className="text-dark-slate font-black">Lower Jaw (Mandible)</span>
                                    <span>Mandibular Left (Q3)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Quick-Flagged Watchlist Selector: Zero-Scroll Navigation! */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Active Clinical Watchlist ({activePathologyTeeth.length} Teeth Diagnosed)</span>
                            </span>
                            <span className="text-[11px] text-muted-text">Click any tooth below for instant inspection</span>
                        </div>

                        {activePathologyTeeth.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {activePathologyTeeth.map((t, idx) => {
                                    const num = t.toothNumber ?? t.ToothNumber ?? parseInt(t.toothKey, 10);
                                    const toothInfo = getResolvedTooth(num);
                                    const isSelected = selectedToothNum === num;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedToothNum(num)}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                                                isSelected
                                                    ? 'bg-primary-teal text-white border-primary-teal ring-2 ring-primary-teal/30 scale-105'
                                                    : 'bg-white hover:bg-slate-50 text-dark-slate border-slate-200'
                                            }`}
                                        >
                                            <span 
                                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                style={{ backgroundColor: isSelected ? '#FFFFFF' : toothInfo.color }}
                                            />
                                            <span>Tooth #{num}</span>
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {toothInfo.status.split('—')[0].trim()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>All 32 teeth are clinically sound and free of active pathological watchpoints.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ---------------------------------------------------------------------
                    RIGHT PANEL (lg:col-span-5 xl:col-span-4): INSTANT TOOTH INSPECTOR
                    ZERO PAGE SCROLLING REQUIRED TO INSPECT ANY TOOTH!
                    --------------------------------------------------------------------- */}
                <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-light-teal shadow-md space-y-5 sticky top-4">
                    
                    {/* Inspector Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-light-teal">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-teal" />
                            <h3 className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                Instant Tooth Inspector
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            FDI: {activeTooth.fdi} · Universal: #{activeTooth.num}
                        </span>
                    </div>

                    {/* Tooth 3D Canvas Preview & Meta Badge */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border border-slate-200 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                                {activeTooth.quadrant}
                            </span>
                            <h4 className="text-lg font-serif font-black text-dark-slate leading-snug">
                                {activeTooth.name}
                            </h4>
                            <p className="text-xs text-muted-text font-medium">
                                Anatomical Type: <strong className="text-dark-slate">{activeTooth.type}</strong>
                            </p>
                            <div className="pt-1">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${activeTooth.bgClass}`}>
                                    {activeTooth.status}
                                </span>
                            </div>
                        </div>

                        {/* Rotating 3D Tooth Crown Three.js Component */}
                        <div className="flex flex-col items-center shrink-0">
                            <SingleTooth3DCanvas 
                                toothNum={activeTooth.num} 
                                shape={activeTooth.shape} 
                                color={activeTooth.color} 
                            />
                            <span className="text-[9px] text-slate-400 font-mono">3D Rotating Crown</span>
                        </div>
                    </div>

                    {/* Clinical Details & CDT Code Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">CDT Code</span>
                            <span className="font-mono font-black text-dark-slate text-sm">{activeTooth.cdtCode}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Surfaces</span>
                            <span className="font-mono font-bold text-primary-teal text-sm">{activeTooth.surfaces}</span>
                        </div>
                    </div>

                    {/* Doctor's Chairside Findings & Clinical Notes */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-primary-teal" />
                                <span>Chairside Clinical Findings</span>
                            </label>
                            <span className="text-[10px] text-muted-text font-mono">EHR Verified</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-dark-slate space-y-1.5">
                            <p className="font-medium italic leading-relaxed text-slate-700">
                                "{activeTooth.comments}"
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-muted-text border-t border-amber-200/60 pt-1.5">
                                <span>Attending Practitioner: <strong>{doctorName}</strong></span>
                                <span>Record Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handlePrintOrPdf}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-dark-slate text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5 text-primary-teal" />
                            <span>Print Record</span>
                        </button>

                        <Link
                            to="/portal/book"
                            className="flex-1 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book Visit</span>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

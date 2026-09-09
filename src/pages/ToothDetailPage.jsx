import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Activity, Layers, CheckCircle2, Stethoscope, RotateCcw, Sparkles
} from 'lucide-react';
import { handlePrintCompletePatientReport } from '../utils/printReportUtils';
import { 
  calculatePatientAge, 
  getHexColor, 
  TOOTH_NAMES, 
  PEDIATRIC_TOOTH_NAMES, 
  parseSurfacesFromRecord 
} from '../utils/toothDataConstants';

// Modular Section Components
import ToothDetailHeader from '../components/toothDetail/ToothDetailHeader';
import ToothPatientEhrBanner from '../components/toothDetail/ToothPatientEhrBanner';
import ToothOdontogramNavigator from '../components/toothDetail/ToothOdontogramNavigator';
import Tooth3DCanvasViewer from '../components/toothDetail/Tooth3DCanvasViewer';
import ToothQuickPresetSelector from '../components/toothDetail/ToothQuickPresetSelector';
import ToothAnatomyCard from '../components/toothDetail/ToothAnatomyCard';
import ToothCrossSectionDiagram from '../components/toothDetail/ToothCrossSectionDiagram';
import ToothPeriodontalMatrix from '../components/toothDetail/ToothPeriodontalMatrix';
import ToothMultiSurfaceMatrix from '../components/toothDetail/ToothMultiSurfaceMatrix';
import ToothClinicalOverview from '../components/toothDetail/ToothClinicalOverview';
import ToothDentitionGuardModal from '../components/toothDetail/ToothDentitionGuardModal';
import OrthoTmjDiagnosticSuite from '../components/orthoTmjSuite/OrthoTmjDiagnosticSuite';

// Re-export for compatibility with other pages
export { parseSurfacesFromRecord, calculatePatientAge, TOOTH_NAMES, PEDIATRIC_TOOTH_NAMES };

export default function ToothDetailPage() {
  const { patientId, toothNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [allTeeth, setAllTeeth] = useState([]);
  const [toothData, setToothData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [liveOrthoAssessment, setLiveOrthoAssessment] = useState(null);

  // Surface Matrix State
  const [surfaceData, setSurfaceData] = useState({
    O: 'Healthy',
    M: 'Healthy',
    D: 'Healthy',
    B: 'Healthy',
    L: 'Healthy'
  });
  const [activePaletteItem, setActivePaletteItem] = useState('Healthy');

  // Notes & Periodontal state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [probingDepths, setProbingDepths] = useState({
    mesiobuccal: 2,
    midbuccal: 2,
    distobuccal: 3,
    mesiolingual: 2,
    midlingual: 2,
    distolingual: 3
  });

  // Determine Tooth Characteristics
  const tKey = toothNumber ? String(toothNumber).toUpperCase() : '1';
  const isPediatric = typeof toothNumber === 'string' && isNaN(parseInt(toothNumber, 10));
  const tNum = parseInt(tKey, 10) || 1;

  const toothMeta = isPediatric 
    ? (PEDIATRIC_TOOTH_NAMES[tKey] || { name: `Primary Tooth ${tKey}`, shape: 'primary', arch: 'Primary Arch', quad: 'Pediatric' }) 
    : (TOOTH_NAMES[tNum] || { name: `Tooth #${tNum}`, shape: 'molar', arch: tNum <= 16 ? 'Maxilla (Upper)' : 'Mandible (Lower)', quad: 'Adult' });

  const toothName = toothMeta.name;
  const patientAge = calculatePatientAge(patient?.dob);

  // Synchronize surfaceData & activePaletteItem with toothData
  // Synchronize surfaceData, activePaletteItem & probingDepths with toothData
  useEffect(() => {
    if (!toothData) return;
    const parsed = parseSurfacesFromRecord(toothData.status, toothData.comments, toothData.surfaces);
    setSurfaceData(parsed);

    // Auto-detect and set activePaletteItem from tooth condition
    const s = (toothData.status || '').toLowerCase();
    const c = (toothData.comments || '').toLowerCase();
    const full = `${s} ${c}`;

    // 1. Synchronize Periodontal Probing Depths for THIS EXACT TOOTH
    const pid = parseInt(patientId) || 17;
    const savedPerio = localStorage.getItem(`dentist_perio_depths_patient_${pid}_tooth_${tKey}`);
    if (savedPerio) {
      try {
        setProbingDepths(JSON.parse(savedPerio));
      } catch (e) {}
    } else if (full.includes('bone loss') || full.includes('periodont') || full.includes('furcation')) {
      setProbingDepths({
        mesiobuccal: 6,
        midbuccal: 5,
        distobuccal: 7,
        mesiolingual: 6,
        midlingual: 4,
        distolingual: 6
      });
    } else if (full.includes('abscess')) {
      setProbingDepths({
        mesiobuccal: 5,
        midbuccal: 4,
        distobuccal: 6,
        mesiolingual: 5,
        midlingual: 4,
        distolingual: 5
      });
    } else if (full.includes('gum recession') || full.includes('recession')) {
      setProbingDepths({
        mesiobuccal: 4,
        midbuccal: 4,
        distobuccal: 4,
        mesiolingual: 3,
        midlingual: 3,
        distolingual: 3
      });
    } else {
      // Healthy Physiological Sulcus Baseline (1–3mm)
      const isAnterior = isPediatric 
        ? ['C','D','E','F','G','H','M','N','O','P','Q','R'].includes(tKey) 
        : (tNum >= 6 && tNum <= 11) || (tNum >= 22 && tNum <= 27);

      setProbingDepths({
        mesiobuccal: isAnterior ? 2 : 2,
        midbuccal: isAnterior ? 1 : 2,
        distobuccal: isAnterior ? 2 : 3,
        mesiolingual: isAnterior ? 2 : 2,
        midlingual: isAnterior ? 1 : 2,
        distolingual: isAnterior ? 2 : 3
      });
    }

    // 2. Synchronize Active Palette Selection
    if (full.includes('bone loss') || full.includes('periodont') || full.includes('furcation')) {
      setActivePaletteItem('Periodontal Bone Loss');
    } else if (full.includes('root resorption') || full.includes('resorption')) {
      setActivePaletteItem('Root Resorption');
    } else if (full.includes('cyst')) {
      setActivePaletteItem('Periapical Cyst');
    } else if (full.includes('abscess')) {
      setActivePaletteItem('Periapical Abscess');
    } else if (full.includes('post and core') || full.includes('post & core') || full.includes('post build') || (full.includes('post') && full.includes('core'))) {
      setActivePaletteItem('Post and core');
    } else if (full.includes('veneer') || full.includes('laminate')) {
      setActivePaletteItem('Veneer');
    } else if (full.includes('inlay') || full.includes('onlay')) {
      setActivePaletteItem('Inlay / onlay');
    } else if (full.includes('sealant') || full.includes('pit and fissure') || full.includes('pit & fissure')) {
      setActivePaletteItem('Sealant');
    } else if (full.includes('crowding') || full.includes('crowded')) {
      setActivePaletteItem('Crowding');
    } else if (full.includes('diastema') || full.includes('spacing')) {
      setActivePaletteItem('Diastema');
    } else if (full.includes('rotat') || full.includes('axial rotation')) {
      setActivePaletteItem('Rotation');
    } else if (full.includes('impacted') || full.includes('impaction')) {
      setActivePaletteItem('Impacted tooth');
    } else if (full.includes('attrition') || full.includes('grinding wear') || full.includes('bruxism') || full.includes('wear facet') || full.includes('flattened tip')) {
      setActivePaletteItem('Bruxism attrition');
    } else if (full.includes('enamel erosion') || full.includes('erosion')) {
      setActivePaletteItem('Enamel Erosion');
    } else if (full.includes('gum recession') || full.includes('recession')) {
      setActivePaletteItem('Gum recession');
    } else if (full.includes('crack') || full.includes('craze line')) {
      setActivePaletteItem('Cracked tooth');
    } else if (full.includes('chipped') || full.includes('fracture')) {
      setActivePaletteItem('Chipped / fractured');
    } else if (full.includes('sensitivity') || full.includes('exposed root')) {
      setActivePaletteItem('Sensitivity (no cavity)');
    } else if (full.includes('implant')) {
      setActivePaletteItem('Dental implant');
    } else if (full.includes('crown') || full.includes('zirconia') || full.includes('pfm') || full.includes('cap') || full.includes('bridge') || full.includes('gold')) {
      setActivePaletteItem('Crown (zirconia / PFM)');
    } else if (full.includes('already treated') || full.includes('treated') || full.includes('rct') || full.includes('root canal') || (full.includes('endo') && !full.includes('endosseous'))) {
      setActivePaletteItem('RCT endo');
    } else if (full.includes('pulpotomy') || full.includes('mta')) {
      setActivePaletteItem('Pulpotomy');
    } else if (full.includes('ssc') || full.includes('stainless')) {
      setActivePaletteItem('Stainless Steel Crown (SSC)');
    } else if (full.includes('space') || full.includes('maintainer')) {
      setActivePaletteItem('Space Maintainer');
    } else if (full.includes('ortho') || full.includes('overbite') || full.includes('crossbite') || full.includes('underbite') || full.includes('open bite') || full.includes('malocclusion')) {
      setActivePaletteItem('Ortho malocclusion');
    } else if (full.includes('amalgam')) {
      setActivePaletteItem('Amalgam');
    } else if (full.includes('gic')) {
      setActivePaletteItem('GIC');
    } else if (full.includes('composite') || full.includes('resin') || full.includes('broken')) {
      setActivePaletteItem('Composite');
    } else if (full.includes('caries (mod)') || full.includes('mod')) {
      setActivePaletteItem('Caries (MOD)');
    } else if (full.includes('caries (do)') || full.includes('do')) {
      setActivePaletteItem('Caries (DO)');
    } else if (full.includes('caries (o)') || full.includes('caries') || full.includes('decay') || full.includes('cavity') || full.includes('ecc') || full.includes('damaged')) {
      setActivePaletteItem('Caries (O)');
    } else if (s === 'healthy' || s === 'sound' || (!toothData.status && !toothData.comments)) {
      setActivePaletteItem('Healthy');
    } else if (s.includes('cleaning') || s.includes('scaling') || s.includes('calculus') || s.includes('tartar') || s.includes('plaque') || s.includes('prophylaxis')) {
      setActivePaletteItem('Cleaning Needed');
    } else {
      setActivePaletteItem(toothData.status || 'Healthy');
    }
  }, [toothData, tKey, patientId]);

  // Helper to extract and format specific tooth record from in-memory chart
  const applyToothSelection = (teethArray, targetKey, pid) => {
    const isPed = typeof targetKey === 'string' && isNaN(parseInt(targetKey, 10));
    const tNumeric = parseInt(targetKey, 10) || 1;
    const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
    const pIdx = PEDIATRIC_KEYS.indexOf(String(targetKey).toUpperCase());

    const current = (teethArray || []).find(t => {
      const cat = (t.dentitionCategory || t.DentitionCategory || 'Adult').trim().toLowerCase();
      const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
      const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();

      if (isPed) {
        if (cat === 'pediatric') {
          return tk === String(targetKey).toUpperCase() || (pIdx >= 0 && parseInt(tn, 10) === (pIdx + 1));
        }
        return tk === String(targetKey).toUpperCase();
      } else {
        if (cat === 'adult') {
          return tk === String(targetKey).toUpperCase() || parseInt(tn, 10) === tNumeric;
        }
        return !/^[A-T]$/i.test(tk) && parseInt(tn, 10) === tNumeric;
      }
    });

    if (current) {
      let status = current.conditionStatus || current.status || 'Healthy';
      if (status.includes('All 5 Surfaces') && status.includes('All 5 Surfaces (MODBL) — All 5 Surfaces')) {
        const base = status.split('—')[0].trim() || 'Healthy Enamel';
        status = `${base} — All 5 Surfaces (MODBL)`;
      }
      let comments = current.comments || current.Comments || current.comment || (isPed ? `Intact primary deciduous enamel, physiological baseline` : 'Intact enamel, physiological mobility (Grade 0)');
      if (comments.includes('All 5 Surfaces (MODBL) — All 5 Surfaces')) {
        comments = `Clinical diagnosis: ${status} recorded on ${isPed ? `Primary Tooth ${targetKey}` : `Tooth #${tNumeric}`} via 5-Zone Odontogram`;
      }
      const color = current.conditionColor || current.color || getHexColor(status);
      const rotationDeg = current.rotationDeg || 0;

      setToothData({
        toothNumber: targetKey,
        status,
        comments,
        comment: comments,
        color,
        rotationDeg,
        isPediatric: isPed
      });
      setEditingNotes(comments);

      // Restore persistent surface zones from localStorage or derive from status
      try {
        const savedZones = localStorage.getItem(`dentist_surface_zones_patient_${pid}_tooth_${targetKey}`);
        if (savedZones) {
          setSurfaceData(JSON.parse(savedZones));
        } else if (status.includes('MODBL') || status.includes('All 5 Surfaces')) {
          const base = status.split('—')[0].trim() || 'Healthy';
          setSurfaceData({ O: base, M: base, D: base, B: base, L: base });
        } else {
          setSurfaceData({ O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' });
        }
      } catch (e) {
        setSurfaceData({ O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' });
      }
    } else {
      const defaultComments = isPed ? `Intact primary deciduous enamel on Tooth ${targetKey}` : `Intact enamel on Tooth #${tNumeric}`;
      setToothData({
        toothNumber: targetKey,
        status: 'Healthy',
        comments: defaultComments,
        comment: defaultComments,
        color: '#10B981',
        rotationDeg: 0,
        isPediatric: isPed
      });
      setEditingNotes(defaultComments);
      setSurfaceData({ O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' });
    }
  };

  // Fetch Patient & Accurate Teeth Data from API (Parallelized & Cached)
  const lastLoadedPatientIdRef = React.useRef(null);

  useEffect(() => {
    const pid = parseInt(patientId) || 17;

    // Fast Path: If patient and teeth chart are already in memory, switch tooth in 0ms!
    if (patient && lastLoadedPatientIdRef.current === pid && allTeeth && allTeeth.length > 0) {
      applyToothSelection(allTeeth, tKey, pid);
      return;
    }

    // Initial / Full Fetch Path: Fetch profile, teeth chart, and diagnostic assessments concurrently
    let isCancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        console.log(`🧭 [ToothDetailPage:TMJ] Starting parallel load for Patient #${pid}, tooth: ${tKey}`);

        const [pRes, teethRes, diagRes] = await Promise.all([
          fetch(`/api/patients/${pid}`).catch(err => {
            console.error("[ToothDetailPage] Patient fetch error:", err);
            return null;
          }),
          fetch(`/api/patients/${pid}/chart`).catch(err => {
            console.error("[ToothDetailPage] Chart fetch error:", err);
            return null;
          }),
          fetch(`/api/patients/${pid}/diagnostic-assessment`).catch(err => {
            console.warn("[ToothDetailPage:TMJ] Diagnostic assessment fetch error:", err);
            return null;
          })
        ]);

        if (isCancelled) return;

        let pData = null;
        if (pRes && pRes.ok) {
          pData = await pRes.json();
          setPatient(pData);
          lastLoadedPatientIdRef.current = pid;

          // If no tooth specified in URL, redirect to default
          if (!toothNumber) {
            const dType = (pData?.dentitionType || '').toLowerCase();
            const isMixed = dType.includes('mixed');
            const isStrictPed = dType === 'pediatric';
            const targetTooth = (isStrictPed && !isMixed) ? 'A' : '1';
            navigate(`/chart/${pid}/tooth/${targetTooth}`, { replace: true });
            return;
          }
        }

        let teethArray = [];
        let safeArray = [];
        if (teethRes && teethRes.ok) {
          teethArray = await teethRes.json();
          safeArray = Array.isArray(teethArray) ? teethArray : [];
          setAllTeeth(safeArray);
          applyToothSelection(safeArray, tKey, pid);
        } else {
          applyToothSelection([], tKey, pid);
        }

        // --- Restore Diagnostic Suite (TMJ, Occlusion, Impactions) from DB Table or Teeth Chart ---
        try {
          let preloadedAssessment = null;

          // Tier 1: Check patient-level DiagnosticAssessments table
          if (diagRes && diagRes.ok && diagRes.status !== 204) {
            try {
              const diagRecord = await diagRes.json();
              if (diagRecord && diagRecord.assessmentJson) {
                preloadedAssessment = typeof diagRecord.assessmentJson === 'string'
                  ? JSON.parse(diagRecord.assessmentJson)
                  : diagRecord.assessmentJson;
                console.log(`📋 [ToothDetailPage:TMJ] Diagnostic Suite Record Loaded from DB Table for Patient #${pid}:`, preloadedAssessment);
              }
            } catch (jsonErr) {
              console.warn("[ToothDetailPage:TMJ] Error parsing DB diagnostic assessment JSON:", jsonErr);
            }
          }

          // Tier 2: If not in DiagnosticAssessments table or missing, detect from teeth chart records
          if (!preloadedAssessment || !preloadedAssessment.suite_category) {
            let detectedAssessment = null;

            // 1. Check for Occlusion / Deep Overbite
            const overbiteRecord = safeArray.find(t => {
              const stat = (t.conditionStatus || t.ConditionStatus || t.status || t.Status || '');
              const comm = (t.comments || t.Comments || t.comment || t.Comment || '');
              return /DEEP OVERBITE/i.test(stat) || (/overbite/i.test(stat) && /overlap/i.test(comm));
            });
            if (overbiteRecord) {
              const comm = (overbiteRecord.comments || overbiteRecord.Comments || overbiteRecord.comment || overbiteRecord.Comment || '');
              const match = comm.match(/(\d{1,3})%\s*overlap/i);
              const pct = match ? parseInt(match[1], 10) : 70;
              detectedAssessment = {
                suite_category: 'occlusion',
                bite_type: 'overbite',
                overbite_percent: pct,
                cdt_code: 'D8080',
                clinical_indication: `Deep overbite: ${pct}% overlap. Orthodontic leveling indicated.`
              };
            }

            // 2. Check for TMJ Articulation
            if (!detectedAssessment) {
              const tmjRecord = safeArray.find(t => {
                const comm = (t.comments || t.Comments || t.comment || t.Comment || '');
                const stat = (t.conditionStatus || t.ConditionStatus || t.status || t.Status || '');
                return /TMJ Articulation|TMJ Closed Lock|TMJ Disc Reduction|Trismus/i.test(comm) || /TMJ/i.test(stat);
              });
              if (tmjRecord) {
                const comm = (tmjRecord.comments || tmjRecord.Comments || tmjRecord.comment || tmjRecord.Comment || '');
                const stat = (tmjRecord.conditionStatus || tmjRecord.ConditionStatus || tmjRecord.status || tmjRecord.Status || '');
                let detectedState = 'normal';
                if (/closed.?lock|trismus/i.test(stat) || /closed.?lock|trismus/i.test(comm)) {
                  detectedState = 'closed_lock';
                } else if (/click|reduction/i.test(stat) || /click|reduction/i.test(comm)) {
                  detectedState = 'clicking';
                }

                let detectedOpening = 42.0;
                const openMatch = comm.match(/Opening:\s*([\d\.]+)mm/i);
                if (openMatch) {
                  detectedOpening = parseFloat(openMatch[1]);
                } else if (detectedState === 'closed_lock') {
                  detectedOpening = 24.0;
                } else if (detectedState === 'clicking') {
                  detectedOpening = 35.0;
                }

                detectedAssessment = {
                  suite_category: 'tmj',
                  tmj_state: detectedState,
                  mouth_opening_mm: detectedOpening,
                  cdt_code: detectedState === 'normal' ? 'D0140' : 'D7880'
                };
                console.log(`🦴 [ToothDetailPage:TMJ] Detected TMJ diagnosis from teeth chart:`, detectedAssessment);
              }
            }

            // 3. Check for Impactions
            if (!detectedAssessment) {
              const impactionRecord = safeArray.find(t => /Impacted|Trapped Canine|Erupted Premolar/i.test(t.conditionStatus || t.ConditionStatus || t.status || t.Status || ''));
              if (impactionRecord) {
                const stat = (impactionRecord.conditionStatus || impactionRecord.ConditionStatus || impactionRecord.status || impactionRecord.Status || '');
                const comm = (impactionRecord.comments || impactionRecord.Comments || impactionRecord.comment || impactionRecord.Comment || '');
                const isHorizontal = /Horizontal/i.test(stat) || /Horizontal/i.test(comm);
                const isCanine = /Canine/i.test(stat) || /Canine/i.test(comm);
                const isPremolar = /Premolar/i.test(stat) || /Premolar/i.test(comm);
                const impType = isHorizontal ? 'horizontal' : isCanine ? 'canine' : isPremolar ? 'premolar' : 'mesioangular';
                const degMatch = comm.match(/(\d{1,3})°/);
                const angDeg = degMatch ? parseInt(degMatch[1], 10) : (isHorizontal ? 90 : isCanine ? 35 : 45);
                detectedAssessment = {
                  suite_category: 'impactions',
                  impaction_type: impType,
                  angulation_degrees: angDeg,
                  canine_angulation: isCanine ? angDeg : 35,
                  cdt_code: isHorizontal ? 'D7240' : isCanine ? 'D7280' : isPremolar ? 'D7220' : 'D7230'
                };
              }
            }

            // Tier 3: LocalStorage fallback cache
            if (!detectedAssessment) {
              try {
                const cached = localStorage.getItem(`dentia_diagnostic_assessment_${pid}`);
                if (cached) {
                  detectedAssessment = JSON.parse(cached);
                  console.log(`💾 [ToothDetailPage:TMJ] Restored from LocalStorage Cache for Patient #${pid}:`, detectedAssessment);
                }
              } catch (e) {}
            }

            if (detectedAssessment) {
              preloadedAssessment = detectedAssessment;
            }
          }

          if (preloadedAssessment) {
            setLiveOrthoAssessment(preloadedAssessment);
            try {
              localStorage.setItem(`dentia_diagnostic_assessment_${pid}`, JSON.stringify(preloadedAssessment));
            } catch (e) {}
            console.log(`✅ [ToothDetailPage:TMJ] Live diagnostic assessment set to:`, preloadedAssessment);
          }
        } catch (diagLoadErr) {
          console.warn("[ToothDetailPage:TMJ] Error loading diagnostic assessment:", diagLoadErr);
        }
      } catch (err) {
        console.error("[ToothDetailPage] General fetch error:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [patientId, toothNumber]);

  const orthoSaveTimeoutRef = React.useRef(null);
  const pendingOrthoSaveRef = React.useRef(null);

  // Flush pending debounced saves immediately when switching teeth
  useEffect(() => {
    if (pendingOrthoSaveRef.current) {
      const doSave = pendingOrthoSaveRef.current;
      pendingOrthoSaveRef.current = null;
      if (orthoSaveTimeoutRef.current) {
        clearTimeout(orthoSaveTimeoutRef.current);
        orthoSaveTimeoutRef.current = null;
      }
      doSave();
    }
  }, [tKey, toothNumber]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pendingOrthoSaveRef.current) {
        pendingOrthoSaveRef.current();
        pendingOrthoSaveRef.current = null;
      }
      if (orthoSaveTimeoutRef.current) {
        clearTimeout(orthoSaveTimeoutRef.current);
        orthoSaveTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle Save / Update Observation
  const handleSaveObservation = async (newStatus, newComment, newColor, customSurfaces = null) => {
    try {
      setSaving(true);
      const pid = parseInt(patientId) || 17;
      const statusToSave = newStatus || toothData?.status || 'Healthy';
      const commentToSave = newComment !== undefined ? newComment : (toothData?.comments || '');
      const colorToSave = newColor || getHexColor(statusToSave);
      const surfacesToSave = customSurfaces || surfaceData;

      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.DoctorID || 2;

      const updates = [{
        toothNumber: isPediatric ? tKey : tNum,
        toothKey: String(tKey),
        dentitionCategory: isPediatric ? 'Pediatric' : 'Adult',
        doctorId: docId,
        status: statusToSave,
        conditionStatus: statusToSave,
        color: colorToSave,
        comment: commentToSave,
        comments: commentToSave
      }];

      // 1. Bulk Update API to persist in SQL Server TeethState table
      const res = await fetch('/api/patients/teeth/update-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pid,
          updates
        })
      });

      // 2. Clinical Log entry to persist in Patient Clinical History
      try {
        await fetch(`/api/patients/${pid}/clinical-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId: docId,
            message: `Tooth ${isPediatric ? `Primary ${tKey}` : `#${tNum}`} Diagnosis: ${statusToSave}. ${commentToSave}`,
            logType: 'ToothObservation'
          })
        }).catch(() => {});
      } catch (logErr) {
        // Safe fallback
      }

      if (res.ok) {
        // Update local toothData state
        setToothData(prev => ({
          ...prev,
          status: statusToSave,
          comments: commentToSave,
          comment: commentToSave,
          color: colorToSave
        }));

        // Update allTeeth in memory with robust UPSERT so odontogram arch navigator syncs immediately
        setAllTeeth(prevTeeth => {
          const nextList = Array.isArray(prevTeeth) ? [...prevTeeth] : [];
          const itemStr = String(tKey).trim().toUpperCase();
          const itemNum = parseInt(tKey, 10) || tNum;
          const idx = nextList.findIndex(t => {
            const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
            const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
            return isPediatric
              ? tk === itemStr
              : (tk === itemStr || (!isNaN(itemNum) && parseInt(tn, 10) === itemNum));
          });

          const toothRecord = {
            patientId: pid,
            toothNumber: isPediatric ? itemStr : itemNum,
            toothKey: String(tKey),
            dentitionCategory: isPediatric ? 'Pediatric' : 'Adult',
            status: statusToSave,
            conditionStatus: statusToSave,
            condition: statusToSave,
            color: colorToSave,
            conditionColor: colorToSave,
            comment: commentToSave,
            comments: commentToSave,
            updatedAt: new Date().toISOString()
          };

          if (idx >= 0) {
            nextList[idx] = { ...nextList[idx], ...toothRecord };
          } else {
            nextList.push(toothRecord);
          }
          return nextList;
        });

        // Persist surface zones to localStorage
        try {
          localStorage.setItem(`dentist_surface_zones_patient_${pid}_tooth_${tKey}`, JSON.stringify(surfacesToSave));
        } catch (e) {}

        setIsEditingNotes(false);
        setToast({ visible: true, message: `Saved & Synced: ${statusToSave} on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}` });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
      } else {
        const errTxt = await res.text();
        console.error("Save failed with status:", res.status, errTxt);
        setToast({ visible: true, message: `Database save status: ${res.status}` });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
      }
    } catch (err) {
      console.error("Save observation failed:", err);
      setToast({ visible: true, message: `Failed to save observation to database.` });
      setTimeout(() => setToast({ visible: false, message: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Helper to clean compound status strings
  const cleanConditionName = (str) => {
    if (!str) return 'Healthy';
    return str
      .replace(/(—\s*All 5 Surfaces.*)+/gi, '')
      .replace(/(—\s*[OMDBL\s(),]+.*)+/gi, '')
      .trim() || 'Healthy';
  };

  // Surface Zone Click Handlers
  const handleToggleZone = (zoneKey) => {
    const cleanPalette = cleanConditionName(activePaletteItem);
    const currentVal = surfaceData[zoneKey] || 'Healthy';
    const nextVal = currentVal === cleanPalette ? 'Healthy' : cleanPalette;
    const updated = { ...surfaceData, [zoneKey]: nextVal };
    setSurfaceData(updated);

    const affectedZones = Object.entries(updated)
      .filter(([_, v]) => v && v !== 'Healthy' && v !== 'Sound')
      .map(([k, v]) => `${k} (${v})`);

    const newStatus = affectedZones.length > 0 ? `${cleanPalette} — ${affectedZones.join(', ')}` : 'Healthy';
    const newComment = affectedZones.length > 0
      ? `Clinical diagnosis: ${newStatus} recorded on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}`
      : (isPediatric ? `Intact primary deciduous enamel on Tooth ${tKey}` : 'Intact anatomical enamel, sound baseline');

    setActivePaletteItem(cleanPalette);
    handleSaveObservation(newStatus, newComment, getHexColor(newStatus), updated);
  };

  const handleApplyAll5Zones = () => {
    const cleanBase = cleanConditionName(activePaletteItem);
    const baseName = cleanBase === 'Healthy' ? 'Healthy Enamel' : cleanBase;
    const newStatus = `${baseName} — All 5 Surfaces (MODBL)`;
    const newComment = `Clinical diagnosis: ${newStatus} recorded on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`} via 5-Zone Odontogram`;
    
    const updated = {
      O: cleanBase,
      M: cleanBase,
      D: cleanBase,
      B: cleanBase,
      L: cleanBase
    };
    setSurfaceData(updated);
    setActivePaletteItem(cleanBase);
    handleSaveObservation(newStatus, newComment, getHexColor(newStatus), updated);
  };

  const handleClearAllZones = () => {
    const updated = { O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' };
    setSurfaceData(updated);
    setActivePaletteItem('Healthy');
    handleSaveObservation('Healthy', isPediatric ? `Intact primary deciduous enamel on Tooth ${tKey}` : 'Intact anatomical enamel, sound baseline', '#10B981', updated);
  };

  // Ortho & TMJ Diagnostic Assessment Handler (Synchronized across all teeth and patient DB table)
  const handleSaveOrthoTmjAssessment = (assessmentData) => {
    if (!assessmentData) return;
    const { 
      suite_category, bite_type, impaction_type, tmj_state, cdt_code, 
      overbite_percent, overjet_mm, open_bite_gap_mm, crossbite_side, wear_severity, 
      angulation_degrees, canine_angulation, nerve_distance_mm, eruption_percent, mouth_opening_mm 
    } = assessmentData;

    const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 30);
    const categoryKey = suite_category || (bite_type ? 'occlusion' : impaction_type ? 'impactions' : 'tmj');

    console.log(`💾 [ToothDetailPage:TMJ] Saving Diagnostic Assessment for Patient #${pid} (${categoryKey}):`, assessmentData);

    // Merge with previous assessment so all suites (Occlusion, Impactions, TMJ) coexist without overwriting each other
    let mergedAssessment = { ...assessmentData, suite_category: categoryKey };
    setLiveOrthoAssessment(prev => {
      const merged = {
        ...(prev || {}),
        ...assessmentData,
        suite_category: categoryKey,
        [categoryKey]: assessmentData
      };
      mergedAssessment = merged;
      try {
        localStorage.setItem(`dentia_diagnostic_assessment_${pid}`, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });

    const isPatientPediatric = (patient?.dentitionType || '').toLowerCase().includes('pediatric') || isPediatric;
    let targetTeeth = [];
    let statusLabel = 'Ortho Malocclusion';
    let conditionColor = '#2563EB';
    let commentText = `Assessment saved (${cdt_code || 'D8080'})`;

    // 1. Occlusion Suite
    if (categoryKey === 'occlusion' || bite_type) {
      const type = bite_type || 'overbite';
      if (type === 'overbite') {
        targetTeeth = isPatientPediatric ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
        statusLabel = 'Ortho Malocclusion — DEEP OVERBITE';
        conditionColor = '#2563EB';
        commentText = `Deep overbite: ${overbite_percent ?? 50}% overlap. Orthodontic leveling indicated (CDT D8080).`;
      } else if (type === 'underbite') {
        targetTeeth = isPatientPediatric ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
        statusLabel = 'Ortho Malocclusion — CLASS III UNDERBITE';
        conditionColor = '#EF4444';
        commentText = `Class III underbite: ${overjet_mm ?? -3.5}mm negative overjet (CDT D8080).`;
      } else if (type === 'crossbite') {
        targetTeeth = isPatientPediatric ? ['B', 'I', 'L', 'S'] : [3, 14, 19, 30];
        statusLabel = 'Ortho Malocclusion — CROSSBITE';
        conditionColor = '#F59E0B';
        commentText = `Posterior crossbite (${crossbite_side || 'right'}). RPE expander indicated (CDT D8080).`;
      } else if (type === 'openbite') {
        targetTeeth = isPatientPediatric ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
        statusLabel = 'Ortho Malocclusion — OPEN BITE';
        conditionColor = '#EC4899';
        commentText = `Anterior vertical open bite: ${open_bite_gap_mm ?? 4.0}mm gap (CDT D8080).`;
      } else if (type === 'molarwear') {
        targetTeeth = isPatientPediatric ? ['A', 'B', 'I', 'J', 'K', 'L', 'S', 'T'] : [2, 3, 14, 15, 18, 19, 30, 31];
        statusLabel = 'Bruxism — OCCLUSAL ATTRITION';
        conditionColor = '#D97706';
        commentText = `Severe bruxism wear facets (${wear_severity || 'moderate'}). Nightguard indicated (CDT D9944).`;
      }
    }
    // 2. Impaction Suite
    else if (categoryKey === 'impactions' || impaction_type) {
      const impType = impaction_type || 'mesioangular';
      if (impType === 'mesioangular' || impType === 'horizontal') {
        targetTeeth = isPatientPediatric ? ['A', 'J', 'K', 'T'] : [17, 32];
        statusLabel = impType === 'horizontal' ? 'Impacted Tooth (Horizontal 90°)' : `Impacted Tooth (Mesioangular ${angulation_degrees ?? 45}°)`;
        conditionColor = '#7C3AED';
        commentText = impType === 'horizontal' ? `Horizontally impacted tooth (IAN distance: ${nerve_distance_mm ?? 0.5}mm) (CDT D7240).` : `Mesioangular ${angulation_degrees ?? 45}° impacted tooth (CDT D7230).`;
      } else if (impType === 'canine') {
        targetTeeth = isPatientPediatric ? ['C', 'H'] : [6, 11];
        statusLabel = 'Palatally Impacted Canine';
        conditionColor = '#DC2626';
        commentText = `Palatally trapped canine (${canine_angulation ?? angulation_degrees ?? 35}°). Surgical exposure & gold chain (CDT D7280).`;
      } else if (impType === 'premolar') {
        targetTeeth = isPatientPediatric ? ['B', 'I', 'L', 'S'] : [20, 29];
        statusLabel = 'Partially Erupted Premolar';
        conditionColor = '#BE123C';
        commentText = `Partially erupted premolar (${eruption_percent ?? 35}% emergence). Operculectomy (CDT D7220/D7971).`;
      }
    }
    // 3. TMJ Suite
    else if (categoryKey === 'tmj' || tmj_state) {
      targetTeeth = isPatientPediatric ? ['A', 'J', 'K', 'T'] : [1, 16, 17, 32];
      statusLabel = tmj_state === 'closed_lock' ? 'TMJ Closed Lock / Trismus' : tmj_state === 'clicking' ? 'TMJ Disc Reduction (Clicking)' : 'Normal TMJ Articulation';
      conditionColor = tmj_state === 'closed_lock' ? '#EF4444' : tmj_state === 'clicking' ? '#F59E0B' : '#10B981';
      commentText = `TMJ Articulation: ${statusLabel} (Opening: ${mouth_opening_mm ?? 42}mm) (CDT ${cdt_code || 'D7880'}).`;
    }

    // Crucial: ALWAYS include the current active tooth so the tooth currently open in the editor is immediately updated!
    const activeCurrentTooth = isPatientPediatric ? String(tKey).toUpperCase() : (parseInt(tKey, 10) || tNum);
    if (activeCurrentTooth && !targetTeeth.some(x => String(x).toUpperCase() === String(activeCurrentTooth).toUpperCase())) {
      targetTeeth.unshift(activeCurrentTooth);
    }

    // Step A: Update all teeth in local state immediately (with robust UPSERT)
    setAllTeeth(prev => {
      const nextList = Array.isArray(prev) ? [...prev] : [];
      targetTeeth.forEach(toothItem => {
        const itemStr = String(toothItem).trim().toUpperCase();
        const itemNum = parseInt(toothItem, 10);
        const idx = nextList.findIndex(t => {
          const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
          const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
          if (isPatientPediatric) {
            return tk === itemStr;
          } else {
            return tk === itemStr || (!isNaN(itemNum) && parseInt(tn, 10) === itemNum);
          }
        });

        const toothRecord = {
          patientId: pid,
          toothNumber: !isNaN(itemNum) ? itemNum : toothItem,
          toothKey: String(toothItem),
          dentitionCategory: isPatientPediatric ? 'Pediatric' : 'Adult',
          status: statusLabel,
          conditionStatus: statusLabel,
          condition: statusLabel,
          cdtCode: cdt_code || (categoryKey === 'tmj' ? 'D7880' : 'D8080'),
          color: conditionColor,
          conditionColor: conditionColor,
          comment: commentText,
          comments: commentText,
          updatedAt: new Date().toISOString()
        };

        if (idx >= 0) {
          nextList[idx] = { ...nextList[idx], ...toothRecord };
        } else {
          nextList.push(toothRecord);
        }
      });
      return nextList;
    });

    // Step B: Update toothData immediately for the currently active tooth
    setToothData(prev => ({
      ...(prev || {}),
      status: statusLabel,
      conditionStatus: statusLabel,
      condition: statusLabel,
      cdtCode: cdt_code || (categoryKey === 'tmj' ? 'D7880' : 'D8080'),
      color: conditionColor,
      conditionColor: conditionColor,
      comment: commentText,
      comments: commentText,
      updatedAt: new Date().toISOString()
    }));

    // Step C: Debounce backend DB writes to avoid spamming network while dragging sliders
    if (orthoSaveTimeoutRef.current) {
      clearTimeout(orthoSaveTimeoutRef.current);
    }

    const executeDbSave = async () => {
      pendingOrthoSaveRef.current = null;
      const storedDoc = localStorage.getItem('doctor');
      const docObj = storedDoc ? JSON.parse(storedDoc) : null;
      const docId = docObj?.doctorID || docObj?.DoctorID || 2;

      const dbUpdates = targetTeeth.map(tN => ({
        toothNumber: tN,
        conditionStatus: statusLabel,
        cdtCode: cdt_code || (categoryKey === 'tmj' ? 'D7880' : 'D8080'),
        color: conditionColor,
        comment: commentText,
        comments: commentText
      }));

      // 1. Bulk update Teeth in Database
      try {
        console.log(`📡 [ToothDetailPage:TMJ] Updating DB bulk teeth for patient #${pid}:`, targetTeeth);
        const res = await fetch('/api/patients/teeth/update-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: pid,
            updates: dbUpdates
          })
        });
        if (res.ok) {
          console.log(`✅ [ToothDetailPage:TMJ] DB Bulk Saved Successfully for teeth:`, targetTeeth);
        } else {
          console.warn(`⚠️ [ToothDetailPage:TMJ] DB Bulk response status:`, res.status);
        }
      } catch (err) {
        console.error("[ToothDetailPage:TMJ] Error saving assessment to DB teeth:", err);
      }

      // 2. Persist to DiagnosticAssessments Table in Database with merged JSON
      try {
        let mergedJson = JSON.stringify(mergedAssessment);
        const diagPayload = {
          doctorId: docId,
          suiteCategory: categoryKey,
          assessmentJson: mergedJson,
          cdtCode: cdt_code || (categoryKey === 'tmj' ? 'D7880' : 'D8080'),
          diagnosisSummary: `${statusLabel}: ${commentText}`
        };
        console.log(`📡 [ToothDetailPage:TMJ] Saving to DiagnosticAssessments table:`, diagPayload);
        const diagRes = await fetch(`/api/patients/${pid}/diagnostic-assessment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagPayload)
        });
        if (diagRes.ok) {
          console.log(`✅ [ToothDetailPage:TMJ] DB Diagnostic Assessment Table Saved Successfully!`);
        } else {
          console.warn(`⚠️ [ToothDetailPage:TMJ] Diagnostic assessment response status:`, diagRes.status);
        }
      } catch (diagErr) {
        console.error("[ToothDetailPage:TMJ] Error saving assessment to DB table:", diagErr);
      }

      // 3. Add Clinical Log entry
      try {
        await fetch(`/api/patients/${pid}/clinical-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorID: docId,
            message: `Clinical Assessment Saved: ${statusLabel} for teeth [${targetTeeth.join(', ')}]. ${commentText}`,
            action: `Diagnostic Suite: ${statusLabel}`
          })
        });
      } catch (logErr) {}

      setToast({ visible: true, message: `Saved ${statusLabel} to Patient Record & Teeth [${targetTeeth.join(', ')}]` });
      setTimeout(() => setToast({ visible: false, message: '' }), 3000);
    };

    pendingOrthoSaveRef.current = executeDbSave;
    if (assessmentData.isManualSave) {
      executeDbSave();
    } else {
      orthoSaveTimeoutRef.current = setTimeout(executeDbSave, 300);
    }
  };

  // Navigation handlers
  const handleBackToChart = () => navigate(`/chart/${patientId}`);
  const handleOpenAllTeeth = () => navigate(`/chart/${patientId}`);
  const handlePrintReport = () => {
    if (patient) {
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      handlePrintCompletePatientReport(patient, allTeeth, doctorData);
    }
  };

  // Summary statistics calculation
  const overallSummary = React.useMemo(() => {
    let healthyCount = 0;
    let decayCount = 0;
    let rctCount = 0;
    let restoredCount = 0;

    for (const t of allTeeth) {
      const st = (t.conditionStatus || t.status || '').toLowerCase();
      if (st.includes('caries') || st.includes('decay') || st.includes('cavity')) decayCount++;
      else if (st.includes('already treated') || st.includes('treated') || st.includes('rct') || st.includes('canal') || st.includes('endo') || st.includes('pulpotomy')) rctCount++;
      else if (st.includes('fill') || st.includes('composite') || st.includes('amalgam') || st.includes('ssc')) restoredCount++;
      else healthyCount++;
    }
    return { healthyCount, decayCount, rctCount, restoredCount };
  }, [allTeeth]);

  const fdiNum = isPediatric ? tKey : (tNum <= 8 ? 10 + tNum : tNum <= 16 ? 20 + (tNum - 8) : tNum <= 24 ? 30 + (tNum - 16) : 40 + (tNum - 24));
  const specialty = toothMeta?.roots >= 2 ? 'Endodontics & Prosthodontics' : 'Restorative Dentistry';

  return (
    <div className="min-h-screen bg-[#F4F8FA] text-dark-slate font-sans pb-16">
      {/* Header */}
      <ToothDetailHeader
        patientId={patientId}
        patient={patient}
        tNum={tNum}
        tKey={tKey}
        isPediatric={isPediatric}
        toothName={toothName}
        handleBackToChart={handleBackToChart}
        handleOpenAllTeeth={handleOpenAllTeeth}
        handlePrintReport={handlePrintReport}
      />

      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Patient Demographics & EHR Card */}
        <ToothPatientEhrBanner
          patient={patient}
          patientId={patientId}
          patientAge={patientAge}
          isPediatric={isPediatric}
          overallSummary={overallSummary}
        />

        {/* 32-Tooth / 20-Tooth Interactive Arch Navigator */}
        <ToothOdontogramNavigator
          patientId={patientId}
          patient={patient}
          isPediatric={isPediatric}
          tNum={tNum}
          tKey={tKey}
          teethState={allTeeth}
          navigate={navigate}
          setShowGuardModal={setShowGuardModal}
        />

        {/* Two-Column Clinical Core Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols): 3D Canvas, Presets & Anatomy */}
          <div className="lg:col-span-5 space-y-6">
            {/* 3D Anatomical Occlusal Canvas */}
            <Tooth3DCanvasViewer
              toothNumber={tKey}
              toothData={toothData}
              patient={patient}
              surfaceData={surfaceData}
              isPediatric={isPediatric}
              toothName={toothName}
              tNum={tNum}
              tKey={tKey}
            />

            {/* Quick Condition Preset Selector */}
            <ToothQuickPresetSelector
              isPediatric={isPediatric}
              tNum={tNum}
              tKey={tKey}
              toothData={toothData}
              handleSaveObservation={handleSaveObservation}
              setActivePaletteItem={setActivePaletteItem}
            />

            {/* Anatomical Tooth Dossier */}
            <ToothAnatomyCard
              toothMeta={toothMeta}
              isPediatric={isPediatric}
              tNum={tNum}
              tKey={tKey}
              toothName={toothName}
            />
          </div>

          {/* Right Column (7 Cols): Tabs, 5 Surface Zones, Periodontal & Clinical Overview */}
          <div className="lg:col-span-7 space-y-6">
            {/* Executive Clinical Header Banner */}
            <div className="bg-gradient-to-r from-white via-white to-[#EFF6FF] rounded-3xl border border-light-teal/50 p-5 shadow-sm space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Specialty: {specialty}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-[#2563EB] border border-blue-200">
                    Universal #{tKey}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                    FDI #{fdiNum}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-500">
                  Last Evaluated: Today, 2026
                </span>
              </div>

              {/* Explicit Affected Zone Display */}
              <div className="bg-white border-2 border-[#4A7CD2]/30 rounded-2xl p-3.5 shadow-2xs flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">
                    Diagnosed Condition Status & Surface
                  </p>
                  <p className="text-sm font-black text-[#10244B] mt-0.5">
                    {toothData?.status || 'Healthy Enamel'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs — 4-Column Responsive Segmented Dock (Zero Scrolling) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs">
              {[
                { id: 'overview', label: 'Overview & Notes', icon: FileText },
                { id: 'periodontal', label: 'Periodontal Matrix', icon: Activity },
                { id: 'surfaces', label: 'Multi-Surface Zones', icon: Layers },
                { id: 'orthotmj', label: 'Ortho & TMJ Suite', icon: Sparkles }
              ].map(tab => {
                const Icon = tab.icon;
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                      isSel
                        ? 'bg-[#2563EB] text-white shadow-xs scale-[1.01]'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-transparent shadow-2xs'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Clinical Overview & Notes */}
            {activeTab === 'overview' && (
              <ToothClinicalOverview
                patientId={patientId}
                isPediatric={isPediatric}
                tNum={tNum}
                tKey={tKey}
                toothData={toothData}
                surfaceData={surfaceData}
                activePaletteItem={activePaletteItem}
                setActivePaletteItem={setActivePaletteItem}
                handleToggleZone={handleToggleZone}
                handleApplyAll5Zones={handleApplyAll5Zones}
                handleClearAllZones={handleClearAllZones}
                editingNotes={editingNotes}
                setEditingNotes={setEditingNotes}
                isEditingNotes={isEditingNotes}
                setIsEditingNotes={setIsEditingNotes}
                handleSaveObservation={handleSaveObservation}
                saving={saving}
              />
            )}

            {/* Tab 2: Periodontal Probing Matrix */}
            {activeTab === 'periodontal' && (
              <ToothPeriodontalMatrix
                probingDepths={probingDepths}
                setProbingDepths={setProbingDepths}
                toothData={toothData}
                handleSaveObservation={handleSaveObservation}
                patientId={patientId}
                tKey={tKey}
                isPediatric={isPediatric}
              />
            )}

            {/* Tab 3: Multi-Surface Zone Matrix */}
            {activeTab === 'surfaces' && (
              <ToothMultiSurfaceMatrix
                patientId={patientId}
                isPediatric={isPediatric}
                tNum={tNum}
                tKey={tKey}
                surfaceData={surfaceData}
                activePaletteItem={activePaletteItem}
                setActivePaletteItem={setActivePaletteItem}
                handleToggleZone={handleToggleZone}
                handleApplyAll5Zones={handleApplyAll5Zones}
                handleClearAllZones={handleClearAllZones}
                toothData={toothData}
                affectedZone={toothData?.status || ''}
              />
            )}

            {/* Tab 4: Ortho, Occlusion, Wisdom Impaction & TMJ Diagnostic Suite */}
            {activeTab === 'orthotmj' && (
              <OrthoTmjDiagnosticSuite
                patientId={patientId}
                patient={patient}
                patientAge={patientAge}
                liveOrthoAssessment={liveOrthoAssessment}
                onSaveAssessment={handleSaveOrthoTmjAssessment}
              />
            )}
          </div>
        </div>
      </main>

      {/* Dentition Guard Modal */}
      <ToothDentitionGuardModal
        isOpen={showGuardModal}
        onClose={() => setShowGuardModal(false)}
        patient={patient}
        patientAge={patientAge}
        isPediatric={isPediatric}
      />

      {/* Floating Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 bg-[#10244B] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-slide-up z-50 border border-cyan-400/40">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Layers, Activity, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Save, Check } from 'lucide-react';

export default function OcclusionBiteVisualizer({
  patientId,
  liveOrthoAssessment = null,
  onSaveAssessment
}) {
  // Pure Dynamic States — Driven directly by DB, Main Chat / Voice Assistant or Doctor manual adjustment
  const [selectedBiteType, setSelectedBiteType] = useState(() => liveOrthoAssessment?.bite_type || 'overbite');
  const [overbitePercent, setOverbitePercent] = useState(() => {
    if (liveOrthoAssessment?.overbite_percent !== undefined && liveOrthoAssessment?.overbite_percent !== null) {
      const parsed = parseInt(liveOrthoAssessment.overbite_percent, 10);
      return !isNaN(parsed) ? parsed : 50;
    }
    return 50;
  });
  const [overjetMm, setOverjetMm] = useState(() => {
    if (liveOrthoAssessment?.overjet_mm !== undefined && liveOrthoAssessment?.overjet_mm !== null) {
      const parsed = parseFloat(liveOrthoAssessment.overjet_mm);
      return !isNaN(parsed) ? parsed : -3.5;
    }
    return -3.5;
  });
  const [openBiteGapMm, setOpenBiteGapMm] = useState(() => {
    if (liveOrthoAssessment?.open_bite_gap_mm !== undefined && liveOrthoAssessment?.open_bite_gap_mm !== null) {
      const parsed = parseFloat(liveOrthoAssessment.open_bite_gap_mm);
      return !isNaN(parsed) ? parsed : 4.0;
    }
    return 4.0;
  });
  const [crossbiteSide, setCrossbiteSide] = useState(() => liveOrthoAssessment?.crossbite_side || 'right');
  const [wearSeverity, setWearSeverity] = useState(() => liveOrthoAssessment?.wear_severity || 'moderate');
  const [palatalImpingement, setPalatalImpingement] = useState(() => Boolean(liveOrthoAssessment?.palatal_impingement));
  const [cdtCode, setCdtCode] = useState(() => liveOrthoAssessment?.cdt_code || 'D8080');
  const [clinicalIndication, setClinicalIndication] = useState(() => liveOrthoAssessment?.clinical_indication || 'Diagnostic evaluation active');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // React to DB loaded assessment or Gemini AI output from Main Chat / Voice Assistant
  useEffect(() => {
    if (!liveOrthoAssessment) return;
    
    console.log('⚡ [OcclusionBiteVisualizer:Sync] Applying dynamic assessment from DB/Voice:', liveOrthoAssessment);

    if (liveOrthoAssessment.bite_type) {
      setSelectedBiteType(liveOrthoAssessment.bite_type);
    }
    if (liveOrthoAssessment.overbite_percent !== undefined && liveOrthoAssessment.overbite_percent !== null) {
      const dynamicPct = parseInt(liveOrthoAssessment.overbite_percent, 10);
      if (!isNaN(dynamicPct)) {
        setOverbitePercent(dynamicPct);
        console.log(`📐 [OcclusionBiteVisualizer] Synchronized Overbite Percentage to ${dynamicPct}%`);
      }
    }
    if (liveOrthoAssessment.overjet_mm !== undefined && liveOrthoAssessment.overjet_mm !== null) {
      const dynamicOverjet = parseFloat(liveOrthoAssessment.overjet_mm);
      if (!isNaN(dynamicOverjet)) {
        setOverjetMm(dynamicOverjet);
      }
    }
    if (liveOrthoAssessment.open_bite_gap_mm !== undefined && liveOrthoAssessment.open_bite_gap_mm !== null) {
      const dynamicGap = parseFloat(liveOrthoAssessment.open_bite_gap_mm);
      if (!isNaN(dynamicGap)) {
        setOpenBiteGapMm(dynamicGap);
      }
    }
    if (liveOrthoAssessment.crossbite_side) {
      setCrossbiteSide(liveOrthoAssessment.crossbite_side);
    }
    if (liveOrthoAssessment.wear_severity) {
      setWearSeverity(liveOrthoAssessment.wear_severity);
    }
    if (liveOrthoAssessment.palatal_impingement !== undefined) {
      setPalatalImpingement(Boolean(liveOrthoAssessment.palatal_impingement));
    }
    if (liveOrthoAssessment.cdt_code) {
      setCdtCode(liveOrthoAssessment.cdt_code);
    }
    if (liveOrthoAssessment.clinical_indication) {
      setClinicalIndication(liveOrthoAssessment.clinical_indication);
    }
  }, [liveOrthoAssessment]);

  const biteTypes = [
    { id: 'overbite', label: 'Overbite (Deep Bite)', icon: '📐', cdt: 'D8080', badge: 'Class II Pattern' },
    { id: 'underbite', label: 'Underbite (Class III)', icon: '🔻', cdt: 'D8080', badge: 'Mandibular Prognathism' },
    { id: 'crossbite', label: 'Crossbite (Posterior/Anterior)', icon: '↔️', cdt: 'D8080', badge: 'Arch Discrepancy' },
    { id: 'openbite', label: 'Anterior Open Bite', icon: '⭕', cdt: 'D8080', badge: 'Vertical Gap' },
    { id: 'molarwear', label: 'Uneven Molar Wear Facets', icon: '🦷', cdt: 'D9944', badge: 'Bruxism / Attrition' }
  ];

  const handleSelectBite = (biteId) => {
    setSelectedBiteType(biteId);
    const newCdt = biteId === 'molarwear' ? 'D9944' : 'D8080';
    setCdtCode(newCdt);

    if (onSaveAssessment) {
      onSaveAssessment({
        suite_category: 'occlusion',
        bite_type: biteId,
        overbite_percent: overbitePercent,
        overjet_mm: overjetMm,
        open_bite_gap_mm: openBiteGapMm,
        crossbite_side: crossbiteSide,
        wear_severity: wearSeverity,
        cdt_code: newCdt
      });
    }
  };

  const handleSaveToPatientRecord = () => {
    const currentObj = biteTypes.find(x => x.id === selectedBiteType);
    const cdt = currentObj?.cdt || 'D8080';
    const title = currentObj?.label || 'Occlusal Assessment';

    if (onSaveAssessment) {
      onSaveAssessment({
        suite_category: 'occlusion',
        bite_type: selectedBiteType,
        overbite_percent: overbitePercent,
        overjet_mm: overjetMm,
        open_bite_gap_mm: openBiteGapMm,
        crossbite_side: crossbiteSide,
        wear_severity: wearSeverity,
        palatal_impingement: palatalImpingement,
        cdt_code: cdt,
        isManualSave: true
      });
    }

    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(`${title} (${cdt}) saved to patient dental chart.`);
      utt.rate = 1.05;
      window.speechSynthesis.speak(utt);
    } catch (e) {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/20 pb-3">
        <div>
          <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
            <span className="text-base">📐</span>
            Teens & Young Adults Occlusion & Bite Malocclusion Suite
          </h3>
          <p className="text-[10.5px] font-bold text-muted-text mt-0.5">
            Sagittal & coronal orthodontic vector simulations dynamically synced with Voice, Chat & Manual Doctor Controls
          </p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200">
          CDT Orthodontic {cdtCode}
        </span>
      </div>

      {/* 5 Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {biteTypes.map((b) => {
          const isSel = selectedBiteType === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => handleSelectBite(b.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSel
                  ? 'bg-gradient-to-br from-[#1E40AF] to-[#2563EB] text-white border-[#1E40AF] shadow-md scale-[1.02] ring-2 ring-blue-400/30'
                  : 'bg-[#F8FAFC] text-dark-slate border-slate-200 hover:bg-[#EFF6FF] hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{b.icon}</span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  {b.cdt}
                </span>
              </div>
              <div>
                <p className="text-xs font-black leading-snug">{b.label}</p>
                <span className={`text-[9px] font-bold block mt-0.5 ${isSel ? 'text-blue-100' : 'text-muted-text'}`}>
                  {b.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Diagram Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-5">
        {/* Left Side (7 Cols): Vector Sagittal Cross Section Diagram */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-white rounded-2xl border border-slate-200 p-4 shadow-inner relative overflow-hidden min-h-[380px]">
          {/* Top Live Parameter HUD */}
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-black text-[#10244B]">
                {selectedBiteType === 'overbite' && `Deep Overbite: ${overbitePercent}% Vertical Overlap`}
                {selectedBiteType === 'underbite' && `Class III Underbite: ${overjetMm} mm Negative Overjet`}
                {selectedBiteType === 'crossbite' && `Posterior Crossbite (${crossbiteSide.toUpperCase()})`}
                {selectedBiteType === 'openbite' && `Anterior Open Bite: ${openBiteGapMm} mm Gap`}
                {selectedBiteType === 'molarwear' && `Molar Attrition & Bruxism (${wearSeverity.toUpperCase()})`}
              </span>
            </div>
            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Sagittal Cross-Section
            </span>
          </div>

          {/* DIAGRAM 1: OVERBITE (DEEP BITE) */}
          {selectedBiteType === 'overbite' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-[#1E40AF] uppercase tracking-wider mb-1">
                Sagittal Incisor Cross-Section: Overbite ({overbitePercent}%)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Maxillary Alveolar Bone */}
                <path d="M 40 40 Q 170 30 300 40 L 300 80 Q 170 70 40 80 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                <text x="50" y="32" fontSize="8" fontWeight="bold" fill="#64748B">Maxillary Bone</text>

                {/* Upper Central Incisor (#8 / #9) */}
                <g transform="translate(130, 45)">
                  <path d="M 0 0 C 15 25, 20 60, 10 95 C 0 100, -15 100, -20 95 C -30 60, -25 25, 0 0 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
                  <text x="-25" y="-6" fontSize="8" fontWeight="bold" fill="#1E40AF">Upper Incisor (#8/#9)</text>
                </g>

                {/* Mandibular Central Incisor (#24 / #25) - Overlap changes with overbitePercent */}
                <g transform={`translate(152, ${110 - (overbitePercent / 100) * 35})`}>
                  <path d="M 0 95 C 10 70, 15 35, 5 0 C 0 -5, -10 -5, -15 0 C -25 35, -20 70, 0 95 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="3" />
                  <text x="12" y="55" fontSize="8" fontWeight="bold" fill="#DC2626">Lower Incisor</text>
                </g>

                {/* Overlap Measurement Caliber */}
                <line x1="185" y1="95" x2="185" y2={95 + (overbitePercent / 100) * 35} stroke="#2563EB" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="185" cy="95" r="3" fill="#2563EB" />
                <circle cx="185" cy={95 + (overbitePercent / 100) * 35} r="3" fill="#2563EB" />
                <text x="192" y={105} fontSize="8" fontWeight="900" fill="#1D4ED8">
                  {overbitePercent}% Overlap
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 2: UNDERBITE (CLASS III NEGATIVE OVERJET) */}
          {selectedBiteType === 'underbite' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-rose-700 uppercase tracking-wider mb-1">
                Class III Prognathism: Reverse Overjet ({overjetMm} mm)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                <path d="M 40 40 Q 170 30 300 40 L 300 80 Q 170 70 40 80 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />

                {/* Upper Incisor Retroclined */}
                <g transform="translate(160, 45)">
                  <path d="M 0 0 C 15 25, 20 60, 10 95 C 0 100, -15 100, -20 95 C -30 60, -25 25, 0 0 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
                  <text x="-25" y="-6" fontSize="8" fontWeight="bold" fill="#1E40AF">Upper Incisor</text>
                </g>

                {/* Lower Incisor Shifted Anteriorly (Reverse Overjet) */}
                <g transform={`translate(${115 + (overjetMm < 0 ? overjetMm * 4 : -10)}, 85)`}>
                  <path d="M 0 95 C 10 70, 15 35, 5 0 C 0 -5, -10 -5, -15 0 C -25 35, -20 70, 0 95 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="3" />
                  <text x="-35" y="55" fontSize="8" fontWeight="bold" fill="#DC2626">Lower Incisor</text>
                </g>

                {/* Negative Overjet Indicator */}
                <line x1={115 + (overjetMm < 0 ? overjetMm * 4 : -10)} y1="90" x2="160" y2="90" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="3 3" />
                <text x="110" y="115" fontSize="8" fontWeight="900" fill="#DC2626">
                  {overjetMm} mm Reverse Overjet
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 3: CROSSBITE */}
          {selectedBiteType === 'crossbite' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-amber-700 uppercase tracking-wider mb-1">
                Coronal Molar Cross-Section: Posterior Crossbite ({crossbiteSide.toUpperCase()})
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Maxillary Constricted Arch */}
                <g transform="translate(120, 50)">
                  <rect x="0" y="0" width="45" height="40" rx="8" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
                  <text x="-5" y="-8" fontSize="8" fontWeight="bold" fill="#1E40AF">Upper Molar (Palatal)</text>
                </g>

                {/* Mandibular Buccal Flared Molar */}
                <g transform={`translate(${crossbiteSide === 'left' ? 100 : 145}, 95)`}>
                  <rect x="0" y="0" width="45" height="40" rx="8" fill="#FFFFFF" stroke="#EF4444" strokeWidth="3" />
                  <text x="-5" y="55" fontSize="8" fontWeight="bold" fill="#DC2626">Lower Molar (Buccal)</text>
                </g>

                <text x="80" y="180" fontSize="8.5" fontWeight="bold" fill="#B45309">
                  ⚠️ Arch Width Mismatch: RPE Expander Indicated
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 4: ANTERIOR OPEN BITE */}
          {selectedBiteType === 'openbite' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-rose-700 uppercase tracking-wider mb-1">
                Sagittal Open Bite: Vertical Gap ({openBiteGapMm} mm)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Upper Incisor */}
                <g transform="translate(140, 40)">
                  <path d="M 0 0 C 15 25, 20 60, 10 95 C 0 100, -15 100, -20 95 C -30 60, -25 25, 0 0 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
                </g>

                {/* Lower Incisor with Vertical Gap */}
                <g transform={`translate(150, ${110 + openBiteGapMm * 6})`}>
                  <path d="M 0 95 C 10 70, 15 35, 5 0 C 0 -5, -10 -5, -15 0 C -25 35, -20 70, 0 95 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="3" />
                </g>

                {/* Vertical Gap Measurement Ruler */}
                <line x1="175" y1="135" x2="175" y2={135 + openBiteGapMm * 6} stroke="#EF4444" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="175" cy="135" r="3" fill="#EF4444" />
                <circle cx="175" cy={135 + openBiteGapMm * 6} r="3" fill="#EF4444" />
                <text x="185" y={145 + openBiteGapMm * 3} fontSize="8" fontWeight="900" fill="#DC2626">
                  {openBiteGapMm} mm Gap
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 5: MOLAR WEAR & BRUXISM */}
          {selectedBiteType === 'molarwear' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-amber-700 uppercase tracking-wider mb-1">
                Occlusal Surface Attrition & Exposed Dentin ({wearSeverity.toUpperCase()})
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Upper Molar with Flattened Cusps */}
                <g transform="translate(130, 45)">
                  <rect x="0" y="0" width="65" height="42" rx="6" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="3" />
                  {/* Exposed Dentin Island */}
                  <rect x="15" y="32" width="35" height="8" rx="2" fill="#D97706" />
                  <text x="-5" y="-8" fontSize="8" fontWeight="bold" fill="#B45309">Upper Molar Attrition</text>
                </g>

                {/* Lower Molar with Flattened Enamel Facets */}
                <g transform="translate(130, 95)">
                  <rect x="0" y="0" width="65" height="42" rx="6" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="3" />
                  <rect x="15" y="2" width="35" height="8" rx="2" fill="#D97706" />
                  <text x="-5" y="55" fontSize="8" fontWeight="bold" fill="#B45309">Lower Molar Wear Facet</text>
                </g>
              </svg>
            </div>
          )}

          {/* Dynamic Bottom Status Bar */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[10px] mt-2">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span>Diagnosis:</span>
              <span className="px-2 py-0.5 rounded-md font-black bg-blue-100 text-blue-800">
                {selectedBiteType === 'overbite' ? `Deep Bite (${overbitePercent}%)` : selectedBiteType === 'underbite' ? `Class III Underbite (${overjetMm}mm)` : selectedBiteType === 'crossbite' ? `Posterior Crossbite (${crossbiteSide})` : selectedBiteType === 'openbite' ? `Open Bite (${openBiteGapMm}mm)` : `Bruxism Attrition (${wearSeverity})`}
              </span>
            </div>
            <span className="font-extrabold text-slate-500">
              CDT {cdtCode}
            </span>
          </div>
        </div>

        {/* Right Side (5 Cols): Clinical Adjustments & Save Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-light-teal/40 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase">Clinical Parameters</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                CDT {cdtCode}
              </span>
            </div>

            {/* Slider for Overbite */}
            {selectedBiteType === 'overbite' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Incisal Overlap Percentage:</span>
                  <span className="text-blue-700 text-sm font-black">{overbitePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={overbitePercent}
                  onChange={(e) => setOverbitePercent(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>0% (Edge-to-Edge)</span>
                  <span>50% (Moderate)</span>
                  <span>100% (Impinging)</span>
                </div>
              </div>
            )}

            {/* Slider for Underbite */}
            {selectedBiteType === 'underbite' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Reverse Overjet Value:</span>
                  <span className="text-rose-600 text-sm font-black">{overjetMm} mm</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="0"
                  step="0.5"
                  value={overjetMm}
                  onChange={(e) => setOverjetMm(parseFloat(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>-8mm (Severe)</span>
                  <span>-4mm</span>
                  <span>0mm (Edge-to-Edge)</span>
                </div>
              </div>
            )}

            {/* Crossbite Selector */}
            {selectedBiteType === 'crossbite' && (
              <div className="space-y-2">
                <span className="text-xs font-black block">Crossbite Location:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['right', 'left', 'bilateral'].map(side => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setCrossbiteSide(side)}
                      className={`text-[10px] font-black py-1.5 rounded-xl border transition-all cursor-pointer ${
                        crossbiteSide === side
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {side.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Slider for Open Bite */}
            {selectedBiteType === 'openbite' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Vertical Interincisal Gap:</span>
                  <span className="text-rose-600 text-sm font-black">{openBiteGapMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={openBiteGapMm}
                  onChange={(e) => setOpenBiteGapMm(parseFloat(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>0mm (Closed)</span>
                  <span>4mm (Moderate)</span>
                  <span>10mm (Severe)</span>
                </div>
              </div>
            )}

            {/* Wear Severity Selector */}
            {selectedBiteType === 'molarwear' && (
              <div className="space-y-2">
                <span className="text-xs font-black block">Attrition & Wear Severity:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['mild', 'moderate', 'severe'].map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setWearSeverity(sev)}
                      className={`text-[10px] font-black py-1.5 rounded-xl border transition-all cursor-pointer ${
                        wearSeverity === sev
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sev.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save & Sync to Database Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveToPatientRecord}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'Saved & Synced to DB!' : 'Save & Update Chart Diagnosis'}</span>
              </button>
            </div>
          </div>

          {/* Protocol & Action Banner */}
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-1.5">
            <span className="font-black text-[#1E40AF]">Treatment Plan & Protocol ({cdtCode}):</span>
            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
              Synchronized to Patient EHR #{patientId}, 3D Dental Arch, and printable odontogram records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

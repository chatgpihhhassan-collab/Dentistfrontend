import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Check, Sparkles, Layers, Eye, Save, Volume2 } from 'lucide-react';

export default function ImpactedTeethXRayVisualizer({
  patientId,
  liveOrthoAssessment = null,
  initialImpaction = 'mesioangular',
  initialAngulation = 45,
  initialCanineAngulation = 35,
  initialNerveDistance = 0.5,
  initialEruptionPercent = 35,
  onSaveAssessment
}) {
  const [selectedImpaction, setSelectedImpaction] = useState(() => liveOrthoAssessment?.impaction_type || initialImpaction || 'mesioangular');
  const [angulationDegrees, setAngulationDegrees] = useState(() => liveOrthoAssessment?.angulation_degrees || initialAngulation || 45);
  const [nerveDistanceMm, setNerveDistanceMm] = useState(() => liveOrthoAssessment?.nerve_distance_mm ?? initialNerveDistance ?? 0.5);
  const [canineAngulation, setCanineAngulation] = useState(() => liveOrthoAssessment?.canine_angulation || (liveOrthoAssessment?.impaction_type === 'canine' ? liveOrthoAssessment?.angulation_degrees : null) || initialCanineAngulation || 35);
  const [eruptionCoveragePct, setEruptionCoveragePct] = useState(() => liveOrthoAssessment?.eruption_percent ?? initialEruptionPercent ?? 35);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with live assessment and props
  useEffect(() => {
    if (liveOrthoAssessment) {
      console.log('⚡ [ImpactedTeethXRayVisualizer:Sync] Received assessment:', liveOrthoAssessment);
      if (liveOrthoAssessment.impaction_type) setSelectedImpaction(liveOrthoAssessment.impaction_type);
      if (liveOrthoAssessment.angulation_degrees !== undefined && liveOrthoAssessment.angulation_degrees !== null) {
        setAngulationDegrees(liveOrthoAssessment.angulation_degrees);
      }
      if (liveOrthoAssessment.canine_angulation !== undefined && liveOrthoAssessment.canine_angulation !== null) {
        setCanineAngulation(liveOrthoAssessment.canine_angulation);
      } else if (liveOrthoAssessment.impaction_type === 'canine' && liveOrthoAssessment.angulation_degrees) {
        setCanineAngulation(liveOrthoAssessment.angulation_degrees);
      }
      if (liveOrthoAssessment.nerve_distance_mm !== undefined && liveOrthoAssessment.nerve_distance_mm !== null) {
        setNerveDistanceMm(liveOrthoAssessment.nerve_distance_mm);
      }
      if (liveOrthoAssessment.eruption_percent !== undefined && liveOrthoAssessment.eruption_percent !== null) {
        setEruptionCoveragePct(liveOrthoAssessment.eruption_percent);
      }
    } else {
      if (initialImpaction) setSelectedImpaction(initialImpaction);
      if (initialAngulation) setAngulationDegrees(initialAngulation);
    }
  }, [liveOrthoAssessment, initialImpaction, initialAngulation]);

  const impactionTypes = [
    { id: 'mesioangular', label: 'Mesioangular Wisdom Molar', icon: '📐', cdt: 'D7230', badge: 'Angled Under Gum 45°', defaultTeeth: [17, 32] },
    { id: 'horizontal', label: 'Horizontally Impacted Molar', icon: '🩻', cdt: 'D7240', badge: 'X-Ray Style 90°', defaultTeeth: [17, 32] },
    { id: 'canine', label: 'Palatally Trapped Canine', icon: '🦷', cdt: 'D7280', badge: 'Maxillary Impaction', defaultTeeth: [6, 11] },
    { id: 'premolar', label: 'Partially Erupted Premolar', icon: '🔴', cdt: 'D7220', badge: 'Pericoronal Flap', defaultTeeth: [4, 5, 12, 13, 20, 21, 28, 29] }
  ];

  const notifyAssessmentChange = (overrides = {}) => {
    if (!onSaveAssessment) return;
    const type = overrides.impaction_type || selectedImpaction;
    const ang = overrides.angulation_degrees !== undefined ? overrides.angulation_degrees : (type === 'horizontal' ? 90 : (type === 'canine' ? canineAngulation : angulationDegrees));
    const canAng = overrides.canine_angulation !== undefined ? overrides.canine_angulation : canineAngulation;
    const nDist = overrides.nerve_distance_mm !== undefined ? overrides.nerve_distance_mm : nerveDistanceMm;
    const erupt = overrides.eruption_percent !== undefined ? overrides.eruption_percent : eruptionCoveragePct;
    const cdt = type === 'horizontal' ? 'D7240' : type === 'canine' ? 'D7280' : type === 'premolar' ? 'D7220' : 'D7230';

    onSaveAssessment({
      suite_category: 'impactions',
      impaction_type: type,
      angulation_degrees: ang,
      canine_angulation: canAng,
      nerve_distance_mm: nDist,
      eruption_percent: erupt,
      cdt_code: cdt,
      ...overrides
    });
  };

  const handleSelectType = (typeId) => {
    setSelectedImpaction(typeId);
    let targetAngulation = angulationDegrees;
    if (typeId === 'horizontal') targetAngulation = 90;
    else if (typeId === 'mesioangular') targetAngulation = 45;
    else if (typeId === 'canine') targetAngulation = canineAngulation;
    setAngulationDegrees(targetAngulation);

    notifyAssessmentChange({
      impaction_type: typeId,
      angulation_degrees: targetAngulation
    });
  };

  const handleAngulationChange = (val) => {
    const num = parseInt(val, 10);
    setAngulationDegrees(num);
    notifyAssessmentChange({ angulation_degrees: num });
  };

  const handleNerveDistanceChange = (val) => {
    const num = parseFloat(val);
    setNerveDistanceMm(num);
    notifyAssessmentChange({ nerve_distance_mm: num });
  };

  const handleCanineAngulationChange = (val) => {
    const num = parseInt(val, 10);
    setCanineAngulation(num);
    notifyAssessmentChange({ canine_angulation: num });
  };

  const handleEruptionPercentChange = (val) => {
    const num = parseInt(val, 10);
    setEruptionCoveragePct(num);
    notifyAssessmentChange({ eruption_percent: num });
  };

  const handleSaveToPatientRecord = () => {
    const currentObj = impactionTypes.find(x => x.id === selectedImpaction);
    const cdt = currentObj?.cdt || 'D7230';
    const title = currentObj?.label || 'Impacted Tooth';

    notifyAssessmentChange({
      isManualSave: true
    });

    // Audible confirmation
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(`${title} (${cdt}) updated in patient chart.`);
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
            <span className="text-base">🩻</span>
            Impacted & Supernumerary Teeth Diagnostic Visualizer
          </h3>
          <p className="text-[10.5px] font-bold text-muted-text mt-0.5">
            Wisdom teeth (#1, #16, #17, #32), Canines (#6, #11) & Premolars impaction analysis (Teens / Young Adults)
          </p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
          Oral & Maxillofacial Surgery D7230 / D7240
        </span>
      </div>

      {/* 4 Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {impactionTypes.map((t) => {
          const isSel = selectedImpaction === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectType(t.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSel
                  ? 'bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] text-white border-[#4C1D95] shadow-md scale-[1.02] ring-2 ring-purple-400/30'
                  : 'bg-[#F8FAFC] text-dark-slate border-slate-200 hover:bg-[#F3E8FF] hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{t.icon}</span>
                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  {t.cdt}
                </span>
              </div>
              <div>
                <p className="text-xs font-black leading-snug">{t.label}</p>
                <span className={`text-[9px] font-bold block mt-0.5 ${isSel ? 'text-purple-200' : 'text-muted-text'}`}>
                  {t.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Diagram Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-5">
        {/* Left Side (7 Cols): Dynamic Vector / X-Ray Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden min-h-[380px]">
          {/* Top Live Parameter HUD */}
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-black text-cyan-200">
                {selectedImpaction === 'mesioangular' && `Mesioangular Tilted 3rd Molar (${angulationDegrees}°)`}
                {selectedImpaction === 'horizontal' && `Horizontally Impacted Molar (IAN Dist: ${nerveDistanceMm.toFixed(1)}mm)`}
                {selectedImpaction === 'canine' && `Palatally Impacted Canine (Angle: ${canineAngulation}°)`}
                {selectedImpaction === 'premolar' && `Partially Erupted Premolar (Emergence: ${eruptionCoveragePct}%)`}
              </span>
            </div>
            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 border border-purple-700">
              Live Cross-Section
            </span>
          </div>

          {/* DIAGRAM 1: MESIOANGULAR WISDOM TOOTH */}
          {selectedImpaction === 'mesioangular' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-wider mb-1">
                Mandibular Bone Cross-Section: Mesioangular 3rd Molar (#17 / #32)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-lg">
                {/* Alveolar Bone Texture */}
                <path d="M 20 75 Q 170 80 320 75 L 320 220 L 20 220 Z" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                {/* Gingival Margin */}
                <path d="M 20 65 Q 170 70 320 60 L 320 75 Q 170 80 20 75 Z" fill="#F43F5E" opacity="0.8" />

                {/* 2nd Molar (Erupted & Normal) */}
                <g transform="translate(90, 35)">
                  <rect x="0" y="20" width="45" height="40" rx="8" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                  <path d="M 5 60 C 5 110, 15 130, 20 130 C 25 130, 22 100, 22 60" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                  <path d="M 25 60 C 25 100, 28 130, 35 130 C 40 130, 42 110, 42 60" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                  <text x="-5" y="10" fontSize="8" fontWeight="bold" fill="#CBD5E1">2nd Molar (#18/#31)</text>
                </g>

                {/* 3rd Molar (Dynamically Tilted into 2nd Molar Root based on angulationDegrees) */}
                <g transform={`translate(${210 - (angulationDegrees - 45) * 0.8}, ${105 + (angulationDegrees - 45) * 0.4}) rotate(-${angulationDegrees})`}>
                  <rect x="-25" y="-20" width="50" height="42" rx="8" fill="#F8FAFC" stroke="#EF4444" strokeWidth="2.5" />
                  <path d="M -18 22 C -18 60, -10 80, -5 80 C 0 80, 0 50, 0 22" fill="#E2E8F0" stroke="#EF4444" strokeWidth="2" />
                  <path d="M 2 22 C 2 50, 5 80, 12 80 C 18 80, 18 60, 18 22" fill="#E2E8F0" stroke="#EF4444" strokeWidth="2" />
                  <text x="-20" y="-26" fontSize="8" fontWeight="900" fill="#FCA5A5">3rd Molar</text>
                </g>

                {/* Dynamic Contact Point Warning */}
                <g transform={`translate(${140 - (angulationDegrees - 45) * 0.5}, ${110 + (angulationDegrees - 45) * 0.3})`}>
                  <circle cx="0" cy="0" r="8" fill="#EF4444" opacity="0.6" className="animate-ping" />
                  <circle cx="0" cy="0" r="5" fill="#DC2626" />
                  <text x="-2" y="25" fontSize="7.5" fontWeight="bold" fill="#FCA5A5">Resorption Danger</text>
                </g>

                {/* Inferior Alveolar Nerve Canal (IAN) */}
                <path d="M 20 195 Q 170 190 320 195" fill="none" stroke="#F59E0B" strokeWidth="6" strokeDasharray="6,3" />
                <text x="30" y="185" fontSize="8" fontWeight="bold" fill="#FCD34D">⚡ Inferior Alveolar Nerve (IAN)</text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 2: HORIZONTALLY IMPACTED MOLAR */}
          {selectedImpaction === 'horizontal' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-wider mb-1">
                Panoramic Radiograph (X-Ray View): Horizontal Impaction (90°)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-2xl">
                <rect x="10" y="10" width="320" height="210" rx="12" fill="#090D16" stroke="#1E293B" strokeWidth="2" />
                <path d="M 20 65 Q 170 75 320 60 L 320 210 L 20 210 Z" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />

                {/* 2nd Molar (Radiopaque White / Gray) */}
                <g transform="translate(80, 45)">
                  <rect x="0" y="15" width="48" height="42" rx="8" fill="#E2E8F0" opacity="0.9" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M 5 57 C 5 110, 15 130, 20 130 C 25 130, 22 100, 22 57" fill="#CBD5E1" opacity="0.85" />
                  <path d="M 26 57 C 26 100, 30 130, 38 130 C 44 130, 44 110, 44 57" fill="#CBD5E1" opacity="0.85" />
                  <text x="0" y="5" fontSize="8" fontWeight="bold" fill="#94A3B8">2nd Molar</text>
                </g>

                {/* Horizontal 3rd Molar - Shifts vertically based on nerveDistanceMm */}
                <g transform={`translate(195, ${145 - nerveDistanceMm * 8})`}>
                  <rect x="-30" y="-22" width="46" height="44" rx="8" fill="#F1F5F9" stroke="#38BDF8" strokeWidth="2" />
                  <path d="M 16 -12 C 45 -12, 70 -8, 70 0 C 70 8, 45 5, 16 5" fill="#CBD5E1" opacity="0.9" stroke="#38BDF8" strokeWidth="1" />
                  <path d="M 16 5 C 45 5, 70 8, 70 16 C 70 24, 45 20, 16 20" fill="#CBD5E1" opacity="0.9" stroke="#38BDF8" strokeWidth="1" />
                  <line x1="-15" y1="0" x2="50" y2="0" stroke="#090D16" strokeWidth="2.5" />
                  <text x="-25" y="-28" fontSize="8" fontWeight="bold" fill="#7DD3FC">Horizontally Impacted 90°</text>
                </g>

                {/* IAN Nerve Canal in Direct Proximity */}
                <path d="M 20 180 Q 170 170 320 180" fill="none" stroke="#F59E0B" strokeWidth="7" opacity="0.85" />
                <text x="30" y="200" fontSize="8" fontWeight="bold" fill="#FCD34D">
                  ⚡ IAN Nerve Canal: {nerveDistanceMm <= 1.0 ? 'Direct Contact (High Risk)' : `${nerveDistanceMm.toFixed(1)}mm Clearance`}
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 3: PALATALLY TRAPPED CANINE */}
          {selectedImpaction === 'canine' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-wider mb-1">
                Maxillary Alveolar Bone: Palatally Trapped Canine (#6 / #11)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-md">
                <path d="M 30 45 Q 170 25 310 45 L 310 195 Q 170 185 30 195 Z" fill="#1E293B" stroke="#334155" strokeWidth="2" />

                {/* Lateral Incisor Root */}
                <path d="M 80 45 C 90 85, 95 125, 90 165 C 85 165, 80 165, 75 165 C 70 125, 70 85, 75 45 Z" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
                <text x="45" y="35" fontSize="8" fontWeight="bold" fill="#94A3B8">Lateral Incisor (#7/#10)</text>

                {/* Trapped Canine (Dynamically Angled based on canineAngulation) */}
                <g transform={`translate(${170 - (canineAngulation - 35) * 0.8}, ${75 + (canineAngulation - 35) * 0.6}) rotate(-${canineAngulation})`}>
                  <path d="M 0 0 C 15 25, 20 60, 10 95 C 0 100, -10 100, -15 95 C -25 60, -20 25, 0 0 Z" fill="#FFFFFF" stroke="#EF4444" strokeWidth="3" />
                  <text x="-15" y="-8" fontSize="8" fontWeight="900" fill="#EF4444">Impacted Canine #{canineAngulation}°</text>
                </g>

                {/* 1st Premolar Root */}
                <path d="M 260 45 C 270 85, 275 125, 270 165 C 265 165, 260 165, 255 165 C 250 125, 250 85, 255 45 Z" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
                <text x="240" y="35" fontSize="8" fontWeight="bold" fill="#94A3B8">Premolar (#5/#12)</text>

                <text x="55" y="210" fontSize="8" fontWeight="bold" fill="#F87171">
                  Orthodontic Surgical Exposure & Gold Chain Traction Required
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 4: PARTIALLY ERUPTED PREMOLAR */}
          {selectedImpaction === 'premolar' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-cyan-400 uppercase tracking-wider mb-1">
                Soft-Tissue Impaction: Premolar with Inflamed Pericoronal Operculum
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-md">
                <rect x="30" y="105" width="280" height="110" fill="#1E293B" stroke="#334155" strokeWidth="2" />

                {/* Premolar Crown Emerging - Height moves with eruptionCoveragePct */}
                <g transform={`translate(145, ${80 - (eruptionCoveragePct - 35) * 0.8})`}>
                  <rect x="0" y="0" width="50" height="55" rx="10" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
                  <path d="M 10 55 C 10 95, 20 120, 25 120 C 30 120, 40 95, 40 55" fill="#CBD5E1" stroke="#2563EB" strokeWidth="2" />
                  <text x="0" y="-8" fontSize="8" fontWeight="900" fill="#60A5FA">Eruption: {eruptionCoveragePct}%</text>
                </g>

                {/* Overlying Inflamed Gingival Operculum */}
                <path
                  d="M 120 65 Q 170 40 210 65 Q 200 90 160 85 Q 130 90 120 65 Z"
                  fill="#E11D48"
                  opacity="0.9"
                  stroke="#BE123C"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <text x="130" y="50" fontSize="8.5" fontWeight="900" fill="#FFE4E6">
                  ⚠️ Inflamed Opercular Flap
                </text>
                <text x="60" y="195" fontSize="8" fontWeight="bold" fill="#FDA4AF">
                  Food impaction & pericoronitis. Indicated for Operculectomy (CDT D7971).
                </text>
              </svg>
            </div>
          )}

          {/* Dynamic Footer Status HUD */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[10px] mt-2">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <span>Surgical Status:</span>
              <span className="px-2 py-0.5 rounded-md font-black bg-purple-900/80 text-purple-200 border border-purple-700">
                {selectedImpaction === 'horizontal' ? 'Class II Position C (Deep Sub-Alveolar)' : selectedImpaction === 'canine' ? 'Palatal Impaction (Gold Chain)' : selectedImpaction === 'premolar' ? 'Opercular Flap (D7971)' : 'Mesioangular (D7230)'}
              </span>
            </div>
            <span className="font-extrabold text-cyan-400">
              CBCT Correlated
            </span>
          </div>
        </div>

        {/* Right Side (5 Cols): Interactive Clinical Parameter Controls & Save Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-light-teal/40 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase">Surgical Adjustment Controls</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                Pell & Gregory Classification
              </span>
            </div>

            {/* Mesioangular angle controls */}
            {selectedImpaction === 'mesioangular' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Mesial Tilt Angulation:</span>
                  <span className="text-purple-700 font-extrabold">{angulationDegrees}°</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="75"
                  value={angulationDegrees}
                  onChange={(e) => handleAngulationChange(e.target.value)}
                  className="w-full accent-purple-700 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>20° (Mild)</span>
                  <span>45° (Standard)</span>
                  <span>75° (Severe)</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Slider changes the tilt angle of the 3rd molar into the adjacent 2nd molar root in real-time.
                </p>
              </div>
            )}

            {/* Horizontal impaction details & Nerve proximity slider */}
            {selectedImpaction === 'horizontal' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>IAN Nerve Canal Proximity:</span>
                  <span className={nerveDistanceMm <= 1.0 ? 'text-rose-600 font-black' : 'text-purple-700 font-black'}>
                    {nerveDistanceMm.toFixed(1)} mm {nerveDistanceMm <= 1.0 ? '(Direct Contact)' : '(Clear)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.1"
                  value={nerveDistanceMm}
                  onChange={(e) => handleNerveDistanceChange(e.target.value)}
                  className="w-full accent-purple-700 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>0.0mm (Contact)</span>
                  <span>2.5mm</span>
                  <span>5.0mm (Safe)</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Adjusting distance moves the horizontal 3rd molar relative to the inferior alveolar nerve canal.
                </p>
              </div>
            )}

            {/* Canine Palatal Angulation Slider */}
            {selectedImpaction === 'canine' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Palatal Inclination:</span>
                  <span className="text-purple-700 font-extrabold">{canineAngulation}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="65"
                  value={canineAngulation}
                  onChange={(e) => handleCanineAngulationChange(e.target.value)}
                  className="w-full accent-purple-700 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>15° (Shallow)</span>
                  <span>35° (Standard)</span>
                  <span>65° (High Palatal)</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Changes the rotation and palatal depth of the unerupted maxillary canine.
                </p>
              </div>
            )}

            {/* Premolar Emergence Slider */}
            {selectedImpaction === 'premolar' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Eruption Emergence:</span>
                  <span className="text-purple-700 font-extrabold">{eruptionCoveragePct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={eruptionCoveragePct}
                  onChange={(e) => handleEruptionPercentChange(e.target.value)}
                  className="w-full accent-purple-700 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>10% (Submerged)</span>
                  <span>35% (Partial)</span>
                  <span>80% (Near Erupted)</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Slider emerges the premolar crown through the alveolar bone and pericoronal flap.
                </p>
              </div>
            )}

            {/* Save Button to permanently sync into Chart */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveToPatientRecord}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'Saved & Synced to Chart!' : 'Save & Update Chart Diagnosis'}</span>
              </button>
            </div>
          </div>

          {/* Maxillofacial Surgery Protocol Note */}
          <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs space-y-1.5">
            <span className="font-black text-purple-900">Maxillofacial Surgery Protocol:</span>
            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
              Synchronized with 3D CBCT imaging records. Automatic cross-linking to Patient Treatment Plan & Radiograph records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

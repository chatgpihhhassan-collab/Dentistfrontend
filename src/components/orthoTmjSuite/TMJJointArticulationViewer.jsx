import React, { useState, useEffect, useRef } from 'react';
import { Activity, Volume2, ShieldCheck, Check, Sparkles, AlertCircle, RefreshCw, Save } from 'lucide-react';

export default function TMJJointArticulationViewer({
  patientId,
  liveOrthoAssessment = null,
  initialJointState = 'clicking',
  initialMouthOpening = 42.0,
  onSaveAssessment
}) {
  const [selectedJointState, setSelectedJointState] = useState(() => liveOrthoAssessment?.tmj_state || initialJointState || 'clicking');
  const [mouthOpeningMm, setMouthOpeningMm] = useState(() => {
    if (liveOrthoAssessment?.mouth_opening_mm !== undefined && liveOrthoAssessment?.mouth_opening_mm !== null) {
      const parsed = parseFloat(liveOrthoAssessment.mouth_opening_mm);
      return !isNaN(parsed) ? parsed : 42.0;
    }
    return initialMouthOpening || 42.0;
  });
  const [showAcousticClick, setShowAcousticClick] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const debounceTimerRef = useRef(null);

  // Sync with live assessment and initial props
  useEffect(() => {
    if (liveOrthoAssessment) {
      console.log('⚡ [TMJJointArticulationViewer:Sync] Received assessment:', liveOrthoAssessment);
      if (liveOrthoAssessment.tmj_state) setSelectedJointState(liveOrthoAssessment.tmj_state);
      if (liveOrthoAssessment.mouth_opening_mm !== undefined && liveOrthoAssessment.mouth_opening_mm !== null) {
        const parsed = parseFloat(liveOrthoAssessment.mouth_opening_mm);
        if (!isNaN(parsed)) setMouthOpeningMm(parsed);
      }
    } else {
      if (initialJointState) setSelectedJointState(initialJointState);
      if (initialMouthOpening) setMouthOpeningMm(initialMouthOpening);
    }
  }, [liveOrthoAssessment, initialJointState, initialMouthOpening]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Save assessment to patient record & DB
  const commitAssessment = (jointState = selectedJointState, opening = mouthOpeningMm, isManual = false) => {
    if (onSaveAssessment) {
      onSaveAssessment({
        suite_category: 'tmj',
        tmj_state: jointState,
        mouth_opening_mm: opening,
        cdt_code: jointState === 'normal' ? 'D0140' : 'D7880',
        isManualSave: isManual
      });
    }
    if (isManual) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Handle Tab Change with Intelligent Physiological Snap (UI simulation only, auto-save disabled)
  const handleSelectJointState = (stateId) => {
    setSelectedJointState(stateId);
    let targetOpening = mouthOpeningMm;
    if (stateId === 'normal') {
      targetOpening = 44.0;
    } else if (stateId === 'clicking') {
      targetOpening = 35.0;
    } else if (stateId === 'closed_lock') {
      targetOpening = 24.0;
    }
    setMouthOpeningMm(targetOpening);
  };

  // Ultra-Smooth 60fps Slider Dragging (Simulation only, auto-save disabled)
  const handleOpeningChange = (val) => {
    setMouthOpeningMm(val);
  };

  const handleSliderRelease = () => {
    // Slider released: keeps dynamic position, auto-save disabled
  };

  const jointStates = [
    { id: 'normal', label: 'Normal TMJ Articulation', icon: '🟢', cdt: 'D0140', badge: 'Disc Seated in Fossa', color: '#10B981' },
    { id: 'clicking', label: 'TMJ Clicking (Disc Reduction)', icon: '🔊', cdt: 'D7880', badge: 'Anterior Displacement', color: '#F59E0B' },
    { id: 'closed_lock', label: 'Closed Lock (Non-Reducing)', icon: '🔒', cdt: 'D7880', badge: 'Trismus / Limited Opening', color: '#EF4444' }
  ];

  // Dynamic Transformation Calculations based on mouthOpeningMm (18mm to 55mm)
  const normOpening = Math.max(0, Math.min(1, (mouthOpeningMm - 18) / (55 - 18)));

  // 1. Normal Articulation
  const normalCondyleX = 120 + normOpening * 55;
  const normalCondyleY = 120 + normOpening * 30;
  const normalCondyleRot = normOpening * 15;
  const normalDiscX = 115 + normOpening * 48;
  const normalDiscY = 88 + normOpening * 24;

  // 2. Clicking (Disc Reduction) - Snapping threshold at 32mm
  const isClickReduced = mouthOpeningMm >= 32.0;
  const clickingCondyleX = 125 + normOpening * 58;
  const clickingCondyleY = 120 + normOpening * 32;
  const clickingCondyleRot = normOpening * 16;
  const clickingDiscX = isClickReduced ? (185 + (normOpening - 0.4) * 45) : 210;
  const clickingDiscY = isClickReduced ? (98 + (normOpening - 0.4) * 22) : 92;

  // 3. Closed Lock (Non-reducing) - Blocked translation past 28mm
  const lockNorm = Math.min(0.28, normOpening);
  const lockCondyleX = 108 + lockNorm * 35;
  const lockCondyleY = 120 + lockNorm * 22;
  const lockCondyleRot = lockNorm * 8;
  const isLockCollided = mouthOpeningMm >= 26.0;

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/20 pb-3">
        <div>
          <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
            <span className="text-base">🦴</span>
            Temporomandibular Joint (TMJ) & Jaw Articulation Suite
          </h3>
          <p className="text-[10.5px] font-bold text-muted-text mt-0.5">
            Sagittal joint dynamic functional simulation, disc derangement & clicking acoustics (Teens / Young Adults stress/bruxism)
          </p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
          Orofacial Pain & TMJ D7880
        </span>
      </div>

      {/* 3 Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {jointStates.map((j) => {
          const isSel = selectedJointState === j.id;
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => handleSelectJointState(j.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSel
                  ? 'bg-gradient-to-br from-[#0F766E] to-[#0E8A80] text-white border-[#0F766E] shadow-md scale-[1.02] ring-2 ring-teal-400/30'
                  : 'bg-[#F8FAFC] text-dark-slate border-slate-200 hover:bg-[#F0FDFA] hover:border-teal-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{j.icon}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  {j.cdt}
                </span>
              </div>
              <div>
                <p className="text-xs font-black leading-snug">{j.label}</p>
                <span className={`text-[9.5px] font-bold block mt-0.5 ${isSel ? 'text-teal-100' : 'text-muted-text'}`}>
                  {j.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Diagram & Interactive Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-5">
        {/* Left Side (7 Cols): Vector TMJ Articulation Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-white rounded-2xl border border-slate-200 p-4 shadow-inner relative overflow-hidden min-h-[380px]">
          {/* Live Caliber HUD Top Banner */}
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                mouthOpeningMm >= 40 ? 'bg-emerald-500 animate-pulse' : mouthOpeningMm >= 32 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
              }`} />
              <span className="text-[11px] font-black text-[#10244B]">
                {selectedJointState === 'normal' 
                  ? 'Normal TMJ Condyle Translation' 
                  : selectedJointState === 'clicking' 
                  ? 'Anterior Disc Derangement with Click' 
                  : 'Closed Lock / Severe Trismus'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500">Mouth Opening:</span>
              <span className={`text-xs font-black ${
                mouthOpeningMm >= 40 ? 'text-emerald-700' : mouthOpeningMm >= 32 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {mouthOpeningMm.toFixed(1)} mm
              </span>
            </div>
          </div>

          {/* DIAGRAM 1: NORMAL TMJ ARTICULATION */}
          {selectedJointState === 'normal' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-emerald-700 uppercase tracking-wider mb-1">
                Physiological Disc Translation (Seated in Glenoid Fossa)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Temporal Bone & Fossa */}
                <path
                  d="M 40 55 Q 110 50 160 75 Q 210 105 270 95 L 320 85 L 320 35 L 40 35 Z"
                  fill="#F1F5F9"
                  stroke="#64748B"
                  strokeWidth="3"
                />
                <text x="50" y="48" fontSize="8.5" fontWeight="bold" fill="#475569">Glenoid Fossa</text>
                <text x="200" y="65" fontSize="8" fontWeight="bold" fill="#475569">Articular Eminence</text>

                {/* Bilaminar Zone / Retrodiscal Tissue */}
                <path 
                  d={`M 50 78 Q 90 82 ${normalDiscX} ${normalDiscY} Q ${normalCondyleX} ${normalCondyleY} 50 78 Z`} 
                  fill="#FECDD3" 
                  stroke="#F43F5E" 
                  strokeWidth="1" 
                  opacity="0.75"
                />

                {/* Dynamic Articular Disc */}
                <g transform={`translate(${normalDiscX - 115}, ${normalDiscY - 88})`}>
                  <path
                    d="M 115 88 Q 165 80 205 105 Q 195 120 155 102 Q 125 102 115 88 Z"
                    fill="#0D9488"
                    stroke="#0F766E"
                    strokeWidth="2.5"
                  />
                  <text x="125" y="80" fontSize="8" fontWeight="900" fill="#0F766E">✓ Seated Disc</text>
                </g>

                {/* Dynamic Mandibular Condyle Head */}
                <g transform={`translate(${normalCondyleX - 120}, ${normalCondyleY - 120}) rotate(${normalCondyleRot} 155 120)`}>
                  <path
                    d="M 120 120 C 135 90, 185 90, 195 120 C 200 150, 190 200, 175 220 L 140 220 C 125 200, 115 150, 120 120 Z"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="3"
                  />
                  <text x="135" y="160" fontSize="8.5" fontWeight="900" fill="#1D4ED8">Condyle Head</text>
                </g>

                {/* Vertical Interincisal Opening Caliber */}
                <line x1="290" y1="95" x2="290" y2={95 + normOpening * 70} stroke="#10B981" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="290" cy="95" r="3" fill="#10B981" />
                <circle cx="290" cy={95 + normOpening * 70} r="3" fill="#10B981" />
                <text x="298" y={95 + (normOpening * 35)} fontSize="8" fontWeight="900" fill="#059669">
                  {mouthOpeningMm.toFixed(1)}mm
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 2: TMJ CLICKING / DISC DISPLACEMENT WITH REDUCTION */}
          {selectedJointState === 'clicking' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-amber-700 uppercase tracking-wider mb-1">
                Internal Derangement: Anterior Disc Displacement with Reduction (Clicking)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Temporal Bone */}
                <path
                  d="M 40 55 Q 110 50 160 75 Q 210 105 270 95 L 320 85 L 320 35 L 40 35 Z"
                  fill="#F1F5F9"
                  stroke="#64748B"
                  strokeWidth="3"
                />
                <text x="50" y="48" fontSize="8.5" fontWeight="bold" fill="#475569">Glenoid Fossa</text>

                {/* Bilaminar Zone */}
                <path 
                  d={`M 50 78 Q 90 82 ${clickingDiscX} ${clickingDiscY} Q ${clickingCondyleX} ${clickingCondyleY} 50 78 Z`} 
                  fill="#FECDD3" 
                  stroke="#F43F5E" 
                  strokeWidth="1" 
                  opacity="0.65"
                />

                {/* Anteriorly Displaced Disc */}
                <g transform={`translate(${clickingDiscX - 195}, ${clickingDiscY - 95})`}>
                  <path
                    d="M 195 95 Q 235 90 265 115 Q 255 130 225 118 Q 200 118 195 95 Z"
                    fill={isClickReduced ? '#10B981' : '#F59E0B'}
                    stroke={isClickReduced ? '#059669' : '#D97706'}
                    strokeWidth="2.5"
                  />
                  <text x="200" y="86" fontSize="7.5" fontWeight="900" fill={isClickReduced ? '#047857' : '#B45309'}>
                    {isClickReduced ? '✓ Disc Reduced' : '⚠️ Displaced Disc'}
                  </text>
                </g>

                {/* Translating Mandibular Condyle */}
                <g transform={`translate(${clickingCondyleX - 120}, ${clickingCondyleY - 120}) rotate(${clickingCondyleRot} 155 120)`}>
                  <path
                    d="M 120 120 C 135 90, 185 90, 195 120 C 200 150, 190 200, 175 220 L 140 220 C 125 200, 115 150, 120 120 Z"
                    fill="#FFFFFF"
                    stroke={isClickReduced ? '#2563EB' : '#EF4444'}
                    strokeWidth="3"
                  />
                  <text x="135" y="160" fontSize="8.5" fontWeight="900" fill={isClickReduced ? '#1D4ED8' : '#DC2626'}>Condyle Head</text>
                </g>

                {/* Acoustic Sound Click Waves Indicator */}
                {isClickReduced && showAcousticClick && (
                  <g transform={`translate(${clickingCondyleX + 25}, ${clickingCondyleY - 15})`}>
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#DC2626" strokeWidth="2" className="animate-ping" />
                    <circle cx="0" cy="0" r="18" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="5" fill="#DC2626" />
                    <text x="8" y="4" fontSize="10" fontWeight="900" fill="#DC2626">🔊 CLICK!</text>
                  </g>
                )}

                {/* Real-time Vertical Caliber */}
                <line x1="290" y1="95" x2="290" y2={95 + normOpening * 70} stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="290" cy="95" r="3" fill="#F59E0B" />
                <circle cx="290" cy={95 + normOpening * 70} r="3" fill="#F59E0B" />
                <text x="298" y={95 + (normOpening * 35)} fontSize="8" fontWeight="900" fill="#D97706">
                  {mouthOpeningMm.toFixed(1)}mm
                </text>
              </svg>
            </div>
          )}

          {/* DIAGRAM 3: CLOSED LOCK (NON-REDUCING DISPLACEMENT) */}
          {selectedJointState === 'closed_lock' && (
            <div className="w-full flex flex-col items-center animate-fade-in relative">
              <span className="text-[9.5px] font-black text-rose-700 uppercase tracking-wider mb-1">
                Severe Trismus: Anterior Disc Displacement Without Reduction (Closed Lock)
              </span>
              <svg width="340" height="230" viewBox="0 0 340 230" className="filter drop-shadow-sm">
                {/* Temporal Bone */}
                <path
                  d="M 40 55 Q 110 50 160 75 Q 210 105 270 95 L 320 85 L 320 35 L 40 35 Z"
                  fill="#F1F5F9"
                  stroke="#64748B"
                  strokeWidth="3"
                />
                <text x="50" y="48" fontSize="8.5" fontWeight="bold" fill="#475569">Glenoid Fossa</text>

                {/* Jammed Anterior Disc */}
                <g transform="translate(145, 12)">
                  <path
                    d="M 60 90 Q 95 85 115 110 Q 105 125 75 115 Q 50 115 60 90 Z"
                    fill="#EF4444"
                    stroke="#B91C1C"
                    strokeWidth="2.5"
                  />
                  <text x="55" y="82" fontSize="7.5" fontWeight="900" fill="#B91C1C">🔒 Obstruction Disc</text>
                </g>

                {/* Blocked Translating Mandibular Condyle */}
                <g transform={`translate(${lockCondyleX - 120}, ${lockCondyleY - 120}) rotate(${lockCondyleRot} 155 120)`}>
                  <path
                    d="M 120 120 C 135 90, 185 90, 195 120 C 200 150, 190 200, 175 220 L 140 220 C 125 200, 115 150, 120 120 Z"
                    fill="#FFFFFF"
                    stroke="#EF4444"
                    strokeWidth="3"
                  />
                  <text x="135" y="160" fontSize="8.5" fontWeight="900" fill="#B91C1C">Blocked Condyle</text>
                </g>

                {/* Collision & Physical Pain Wave */}
                {isLockCollided && (
                  <g transform={`translate(${lockCondyleX + 75}, ${lockCondyleY - 15})`}>
                    <line x1="-10" y1="-10" x2="10" y2="10" stroke="#DC2626" strokeWidth="2.5" />
                    <line x1="10" y1="-10" x2="-10" y2="10" stroke="#DC2626" strokeWidth="2.5" />
                    <text x="-35" y="-14" fontSize="8.5" fontWeight="900" fill="#DC2626">PHYSICAL BLOCK (&lt;28mm)</text>
                  </g>
                )}

                {/* Restricted Opening Caliber */}
                <line x1="290" y1="95" x2="290" y2={95 + (Math.min(0.35, normOpening) * 70)} stroke="#EF4444" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="290" cy="95" r="3" fill="#EF4444" />
                <circle cx="290" cy={95 + (Math.min(0.35, normOpening) * 70)} r="3" fill="#EF4444" />
                <text x="298" y={95 + (Math.min(0.35, normOpening) * 35)} fontSize="8" fontWeight="900" fill="#DC2626">
                  {mouthOpeningMm.toFixed(1)}mm
                </text>
              </svg>
            </div>
          )}

          {/* Dynamic Live Status Bar Footer */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[10px] mt-2">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span>Dynamic Articulation:</span>
              <span className={`px-2 py-0.5 rounded-md font-black ${
                mouthOpeningMm >= 40 ? 'bg-emerald-100 text-emerald-800' : mouthOpeningMm >= 32 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {mouthOpeningMm >= 40 ? 'Normal Translation (Physiological)' : mouthOpeningMm >= 32 ? 'Clicking Reduction Zone' : 'Restricted Trismus (<30mm)'}
              </span>
            </div>
            <span className="font-extrabold text-slate-500">
              Max Caliber: 55mm
            </span>
          </div>
        </div>

        {/* Right Side (5 Cols): Clinical Criteria, Opening Range & Splint Therapy */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-light-teal/40 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase">Jaw Range of Motion</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-50 text-teal-800">
                AAP Classification
              </span>
            </div>

            {/* Range of Motion Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span>Max Interincisal Opening:</span>
                <span className={mouthOpeningMm < 35 ? 'text-rose-600 font-black' : 'text-teal-700 font-black'}>
                  {mouthOpeningMm.toFixed(1)} mm {mouthOpeningMm < 35 ? '(Restricted)' : '(Normal)'}
                </span>
              </div>
              <input
                type="range"
                min="18"
                max="55"
                step="0.5"
                value={mouthOpeningMm}
                onChange={(e) => handleOpeningChange(parseFloat(e.target.value))}
                onPointerUp={handleSliderRelease}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-teal-700 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-500">
                <span>18mm (Locked)</span>
                <span>35mm (Threshold)</span>
                <span>55mm (Maximum)</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Normal physiological interincisal opening is 40–50mm. Values &lt;35mm indicate severe muscular spasm or intra-articular disc locking.
              </p>
            </div>

            {/* Acoustic Click Sound Toggle */}
            {selectedJointState === 'clicking' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-700" />
                  <span className="text-[11px] font-bold text-amber-900">Clicking Acoustic Wave</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAcousticClick(!showAcousticClick)}
                  className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 cursor-pointer"
                >
                  {showAcousticClick ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            )}

            {/* Save to DB Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => commitAssessment(selectedJointState, mouthOpeningMm, true)}
                className={`w-full py-2 px-3 rounded-xl active:scale-98 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0F766E] hover:bg-[#0D9488]'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    <span>Saved Assessment to DB!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save TMJ Assessment to DB</span>
                  </>
                )}
              </button>
            </div>

            {/* Splint Therapy Protocol */}
            <div className="space-y-1.5 text-slate-700 text-[11px] pt-1 border-t border-slate-100">
              <p><strong>Etiology in Cohort:</strong> Stress, academic exams clenching, bruxism, high impact</p>
              <p><strong>Prescribed Splint:</strong> Maxillary Flat-Plane Occlusal Stabilization Splint (Michigan Splint - CDT D7880)</p>
            </div>
          </div>

          {/* Action guidance */}
          <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-200 text-xs space-y-1.5">
            <span className="font-black text-teal-900">TMJ & Orofacial Pain Protocol:</span>
            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
              Combine with soft diet recommendations, warm compresses, NSAIDs, and bilateral palpation of masseter & temporalis muscles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

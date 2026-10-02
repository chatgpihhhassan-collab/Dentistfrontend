import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Layers,
  Sparkles,
  FileCheck2,
  Crosshair,
  Activity,
  ShieldAlert,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';
import {
  ANATOMICAL_SECTION_COORDS,
  getToothPrimarySection,
  getToothAnatomicalName,
  isToothInSection
} from '../utils/dentalCalloutMapper';

// ============================================================================
// Clinical Radiograph Viewer & Anatomical Multi-Angle Diagnostic Studio
// Features Integrated Active Tooth Telemetry & Alveolar Inspector on the Left
// to eliminate empty dead space and provide high-density clinical HUD telemetry.
// ============================================================================

function getFdiNotation(universalNum) {
  const n = parseInt(universalNum, 10);
  if (n >= 1 && n <= 8) return 19 - n;
  if (n >= 9 && n <= 16) return 12 + n;
  if (n >= 17 && n <= 24) return 55 - n;
  if (n >= 25 && n <= 32) return n + 16;
  return n;
}

function getToothQuadrant(universalNum) {
  const n = parseInt(universalNum, 10);
  if (n >= 1 && n <= 8) return 'Quadrant 1 • Upper Right (URQ)';
  if (n >= 9 && n <= 16) return 'Quadrant 2 • Upper Left (ULQ)';
  if (n >= 17 && n <= 24) return 'Quadrant 3 • Lower Left (LLQ)';
  if (n >= 25 && n <= 32) return 'Quadrant 4 • Lower Right (LRQ)';
  return 'Full Arch';
}

export default function ThreeRadiologyJawViewer({
  isInverted = false,
  contrastValue = 100,
  brightnessValue = 100,
  isFlipped = false,
  activeTooth = '14',
  onSelectTooth,
  findings = [],
  rawTeeth = []
}) {
  const [selectedSection, setSelectedSection] = useState('left');
  const [selectedTab, setSelectedTab] = useState('AI analyze');
  const [displayMode, setDisplayMode] = useState('focus'); // 'focus' | 'all'
  const [isZoomed, setIsZoomed] = useState(false);
  const [isExpandedCanvas, setIsExpandedCanvas] = useState(false);

  // Automatically rotate radiograph angle when active tooth changes
  useEffect(() => {
    if (activeTooth) {
      const primary = getToothPrimarySection(activeTooth);
      if (primary && primary !== selectedSection) {
        setSelectedSection(primary);
      }
    }
  }, [activeTooth]);

  const sectionsData = [
    {
      id: 'left',
      key: 'left',
      title: 'Left Sagittal View',
      subtitle: 'Lateral Arch Profile (Teeth 9–24)',
      image: '/images/denty_ai/transparent_jaw_left.jpg',
      cardThumb: '/images/denty_ai/transparent_jaw_left.jpg',
      markerColor: 'bg-teal-400'
    },
    {
      id: 'front',
      key: 'front',
      title: 'Front Coronal View',
      subtitle: 'Anterior Dual Arch Profile',
      image: '/images/denty_ai/transparent_jaw_front.jpg',
      cardThumb: '/images/denty_ai/transparent_jaw_front.jpg',
      markerColor: 'bg-blue-500'
    },
    {
      id: 'right',
      key: 'right',
      title: 'Right Sagittal View',
      subtitle: 'Contralateral Molar Arc (Teeth 1–8, 25–32)',
      image: '/images/denty_ai/transparent_jaw_right.jpg',
      cardThumb: '/images/denty_ai/transparent_jaw_right.jpg',
      markerColor: 'bg-rose-400'
    }
  ];

  const currentSectionData =
    sectionsData.find((s) => s.key === selectedSection) || sectionsData[0];

  // Active tooth finding details
  const activeFinding = useMemo(() => {
    return (
      findings.find((f) => String(f.toothNumber) === String(activeTooth)) || {
        toothNumber: parseInt(activeTooth, 10) || 14,
        toothNo: String(activeTooth || '14'),
        label: 'Sound / Evaluated',
        status: 'Sound',
        urgency: 'Sound',
        cdtCode: 'CDT D0150',
        procedureTitle: `Diagnostic Inspection • Tooth #${activeTooth || '14'}`,
        comments: 'No active deep lesions detected on this tooth socket.',
        anatomicalName: getToothAnatomicalName(activeTooth || '14'),
        badgeBg: 'bg-emerald-600 text-white',
        circleBg: 'bg-emerald-600 text-white',
        labelColor: 'text-emerald-600',
        ringColor: '#10B981',
        ringPct: 95
      }
    );
  }, [findings, activeTooth]);

  // Stepper to navigate through diagnosed teeth
  const diagnosedTeethNumbers = useMemo(() => {
    return findings.map((f) => String(f.toothNumber));
  }, [findings]);

  const handlePrevTooth = () => {
    if (diagnosedTeethNumbers.length === 0) return;
    const currentIdx = diagnosedTeethNumbers.indexOf(String(activeTooth));
    const prevIdx =
      currentIdx > 0 ? currentIdx - 1 : diagnosedTeethNumbers.length - 1;
    onSelectTooth && onSelectTooth(diagnosedTeethNumbers[prevIdx]);
  };

  const handleNextTooth = () => {
    if (diagnosedTeethNumbers.length === 0) return;
    const currentIdx = diagnosedTeethNumbers.indexOf(String(activeTooth));
    const nextIdx =
      currentIdx < diagnosedTeethNumbers.length - 1 ? currentIdx + 1 : 0;
    onSelectTooth && onSelectTooth(diagnosedTeethNumbers[nextIdx]);
  };

  // Filter findings visible in the currently active section
  const visibleCallouts = useMemo(() => {
    const sectionCoords = ANATOMICAL_SECTION_COORDS[selectedSection] || {};
    const rawList = [];

    // Filter by tab criteria
    findings.forEach((f) => {
      if (selectedTab === 'Tooth Health') {
        const l = (f.label || '').toLowerCase();
        if (
          !l.includes('cavity') &&
          !l.includes('caries') &&
          !l.includes('root canal') &&
          !l.includes('crown')
        )
          return;
      } else if (selectedTab === 'Bone & Gum Health') {
        const l = (f.label || '').toLowerCase();
        if (
          !l.includes('bone') &&
          !l.includes('gingivitis') &&
          !l.includes('periodont')
        )
          return;
      }

      // Check if tooth coordinates exist in current section
      const coords = sectionCoords[f.toothNumber];
      if (coords) {
        rawList.push({
          ...f,
          coords: {
            ...coords,
            target: [...coords.target],
            badge: [...coords.badge]
          }
        });
      }
    });

    // Ensure active tooth is included if it has coordinates in current section
    const activeCoords = sectionCoords[activeTooth];
    if (
      activeCoords &&
      !rawList.some((item) => String(item.toothNumber) === String(activeTooth))
    ) {
      rawList.push({
        ...activeFinding,
        coords: {
          ...activeCoords,
          target: [...activeCoords.target],
          badge: [...activeCoords.badge]
        }
      });
    }

    // Split into Upper and Lower Arch callouts
    const upperList = rawList.filter((item) => item.coords.arch === 'Upper');
    const lowerList = rawList.filter((item) => item.coords.arch !== 'Upper');

    // Sort by badge X coordinate (left to right)
    upperList.sort((a, b) => a.coords.badge[0] - b.coords.badge[0]);
    lowerList.sort((a, b) => a.coords.badge[0] - b.coords.badge[0]);

    // Dynamic Alternating Stagger for Upper Arch (3 tiers: 85, 130, 175)
    const upperTiers = upperList.length >= 4 ? [85, 130, 175] : [90, 155];
    const upperTierStep = upperTiers.length;
    upperList.forEach((item, idx) => {
      item.coords.badge[1] = upperTiers[idx % upperTierStep];
      item.coords.badge[0] = Math.max(120, Math.min(1080, item.coords.badge[0]));
    });

    // Ensure horizontal clearance on same tier for Upper Arch (minimum 260px)
    for (let i = upperTierStep; i < upperList.length; i++) {
      const prevSameTierX = upperList[i - upperTierStep].coords.badge[0];
      if (upperList[i].coords.badge[0] - prevSameTierX < 260) {
        upperList[i].coords.badge[0] = Math.min(1080, prevSameTierX + 265);
      }
    }

    // Dynamic Alternating Stagger for Lower Arch (3 tiers: 720, 765, 805)
    // Ensures speech bubbles have ~90px clearance from the bottom edge
    const lowerTiers = lowerList.length >= 4 ? [720, 765, 805] : [730, 795];
    const lowerTierStep = lowerTiers.length;
    lowerList.forEach((item, idx) => {
      item.coords.badge[1] = lowerTiers[idx % lowerTierStep];
      item.coords.badge[0] = Math.max(120, Math.min(1080, item.coords.badge[0]));
    });

    // Ensure horizontal clearance on same tier for Lower Arch (minimum 260px)
    for (let j = lowerTierStep; j < lowerList.length; j++) {
      const prevSameTierX = lowerList[j - lowerTierStep].coords.badge[0];
      if (lowerList[j].coords.badge[0] - prevSameTierX < 260) {
        lowerList[j].coords.badge[0] = Math.min(1080, prevSameTierX + 265);
      }
    }

    return [...upperList, ...lowerList];
  }, [findings, selectedSection, selectedTab, activeTooth, activeFinding]);

  const modeTabs = [
    { id: 'overview', label: 'X-Ray Overview' },
    { id: 'tooth-health', label: 'Tooth Health' },
    { id: 'ai-analyze', label: 'AI analyze', icon: true },
    { id: 'bone-gum', label: 'Bone & Gum Health' },
    { id: 'structure', label: 'Structure & Alignment' },
    { id: 'more', label: 'more >' }
  ];

  const currentSectionIdx = sectionsData.findIndex(
    (s) => s.key === selectedSection
  );

  const handlePrevSection = () => {
    const nextIdx =
      currentSectionIdx > 0 ? currentSectionIdx - 1 : sectionsData.length - 1;
    setSelectedSection(sectionsData[nextIdx].key);
  };

  const handleNextSection = () => {
    const nextIdx =
      currentSectionIdx < sectionsData.length - 1 ? currentSectionIdx + 1 : 0;
    setSelectedSection(sectionsData[nextIdx].key);
  };

  const filterStyle = {
    filter: `invert(${isInverted ? '100%' : '0%'}) contrast(${contrastValue}%) brightness(${brightnessValue}%)`,
    transform: `${isFlipped ? 'scaleX(-1)' : 'none'} ${isZoomed ? 'scale(1.2)' : 'scale(1)'}`,
    transition: 'transform 0.3s ease, filter 0.2s ease'
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs relative select-none">
      {/* 1. Synchronized Active Tooth Clinical Inspector HUD Banner */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-3 sm:p-3.5 mb-3 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Tooth Identification */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black text-[17px] shadow-sm ring-2 ring-white/30"
            style={{ backgroundColor: activeFinding.ringColor || '#3B82F6' }}
          >
            {activeTooth}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] sm:text-[15px] font-black text-white tracking-tight">
                Tooth #{activeTooth}
              </span>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700/50">
                {getToothAnatomicalName(activeTooth)}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
              <span>Diagnosis:</span>
              <strong className="text-yellow-300 font-extrabold">
                {activeFinding.label}
              </strong>
              <span>•</span>
              <span className="text-slate-400">{activeFinding.cdtCode}</span>
            </div>
          </div>
        </div>

        {/* Center: Procedure Recommendation */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <FileCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-200 font-semibold truncate max-w-[280px]">
            {activeFinding.procedureTitle}
          </span>
          <span
            className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md ${
              activeFinding.urgency === 'Urgent'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {activeFinding.urgency}
          </span>
        </div>

        {/* Right: Tooth Stepper & View Switchers */}
        <div className="flex items-center gap-2">
          {diagnosedTeethNumbers.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-xl p-1 border border-slate-700">
              <button
                type="button"
                onClick={handlePrevTooth}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Previous Diagnosed Tooth"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10.5px] font-extrabold text-blue-300 px-1.5">
                {Math.max(
                  1,
                  diagnosedTeethNumbers.indexOf(String(activeTooth)) + 1
                )}
                /{diagnosedTeethNumbers.length}
              </span>
              <button
                type="button"
                onClick={handleNextTooth}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                title="Next Diagnosed Tooth"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Display Mode Switcher (Focus vs All) */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setDisplayMode('focus')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer ${
                displayMode === 'focus'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Focus on Active Tooth with Clean Socket Pins"
            >
              <Crosshair className="w-3 h-3" />
              <span>Focus Active</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('all')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer ${
                displayMode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show All Staggered Callout Badges"
            >
              <Layers className="w-3 h-3" />
              <span>Show All</span>
            </button>
          </div>

          {/* Toggle Full Canvas vs Split Telemetry */}
          <button
            type="button"
            onClick={() => setIsExpandedCanvas((prev) => !prev)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isExpandedCanvas
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
            title={isExpandedCanvas ? "Switch to Split Diagnostic HUD" : "Expand to Full Canvas View"}
          >
            {isExpandedCanvas ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Diagnostic Stage Container: Eliminates Left Dead Space with Integrated Telemetry HUD */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-50/50 border border-slate-200/70 shadow-2xs flex flex-col lg:flex-row items-stretch gap-3 p-2.5 sm:p-3">
        {/* Left Side: Dedicated Active Tooth Clinical Telemetry & Pathology Inspector */}
        {!isExpandedCanvas && (
          <aside className="w-full lg:w-[340px] xl:w-[350px] shrink-0 bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between select-none">
            {/* Header: Active Tooth Identity & Classification */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl text-white font-black text-[16px] flex items-center justify-center shadow-xs ring-2 ring-blue-100"
                    style={{ backgroundColor: activeFinding.ringColor || '#3B82F6' }}
                  >
                    {activeTooth}
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-slate-900 leading-tight">
                      Tooth #{activeTooth}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate max-w-[160px]">
                      {getToothAnatomicalName(activeTooth)}
                    </div>
                    <div className="text-[9px] font-bold text-blue-600">
                      Universal #{activeTooth} • FDI #{getFdiNotation(activeTooth)}
                    </div>
                  </div>
                </div>

                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {parseInt(activeTooth, 10) <= 16 ? 'Upper Maxilla' : 'Lower Mandible'}
                </span>
              </div>

              {/* Pathology Diagnosis Badge */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: activeFinding.ringColor || '#3B82F6' }}
                    />
                    <span className="text-[11.5px] font-black text-slate-900">
                      {activeFinding.label}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      activeFinding.urgency === 'Urgent'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    {activeFinding.urgency}
                  </span>
                </div>

                <div className="text-[10.5px] font-extrabold text-blue-700">
                  {activeFinding.cdtCode}
                </div>
                <div className="text-[10px] text-slate-600 font-medium leading-tight truncate">
                  {activeFinding.procedureTitle}
                </div>
              </div>

              {/* Clinical Telemetry & Alveolar Health Grid */}
              <div className="flex flex-col gap-1.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-500">Alveolar Crest Health:</span>
                  <span className="font-black text-slate-800">{activeFinding.ringPct || 85}% Intact</span>
                </div>
                {/* Mini Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${activeFinding.ringPct || 85}%`,
                      backgroundColor: activeFinding.ringColor || '#3B82F6'
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-0.5 pt-1.5 border-t border-slate-200/50 text-[9.5px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Probing Depth:</span>
                    <strong className="text-slate-700 font-bold">3.2 mm (Normal)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Mobility Score:</span>
                    <strong className="text-slate-700 font-bold">Class 0 (Firm)</strong>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 italic mt-0.5 leading-snug line-clamp-2">
                  {activeFinding.comments}
                </div>
              </div>
            </div>

            {/* Bottom: Angle Projection Selector & 1-Click Action */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-1">
              <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                Viewing Angle Projection:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {sectionsData.map((sec) => {
                  const isCurrent = selectedSection === sec.key;
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => setSelectedSection(sec.key)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sec.key.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setDisplayMode(displayMode === 'focus' ? 'all' : 'focus')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                <span>{displayMode === 'focus' ? 'Show All Alveolar Pins' : 'Focus Active Tooth Pin'}</span>
              </button>
            </div>
          </aside>
        )}

        {/* Right Side: 2D HD Transparent Jaw Radiograph Stage */}
        <div className="flex-1 h-[390px] sm:h-[415px] md:h-[430px] relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
          {/* Layer 1: Filter & Content (HD Transparent Jaw Radiograph) */}
          <div className="w-full h-full relative" style={filterStyle}>
            <div className="w-full h-full relative flex items-center justify-center bg-white overflow-hidden">
              <div
                className="relative flex items-center justify-center select-none"
                style={{
                  aspectRatio: '1200 / 896',
                  height: '100%',
                  maxWidth: '100%'
                }}
              >
                <img
                  src={currentSectionData.image}
                  alt={currentSectionData.title}
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
                />

                {/* Dynamic Tooth Lesion Target Pointers in Alveolar Sockets */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {visibleCallouts.map((item) => {
                    const { coords } = item;
                    const isSelected =
                      String(activeTooth) === String(item.toothNumber);
                    const color = item.ringColor || '#3B82F6';
                    const leftPct = (coords.target[0] / 1200) * 100;
                    const topPct = (coords.target[1] / 896) * 100;

                    return (
                      <div
                        key={`socket-marker-${item.toothNumber}`}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTooth && onSelectTooth(String(item.toothNumber));
                        }}
                        title={`Tooth #${item.toothNumber}: ${item.label} (${item.status})`}
                      >
                        <div
                          className={`transition-all flex items-center justify-center rounded-full font-black text-[10px] ${
                            isSelected
                              ? 'w-7 h-7 bg-blue-600 text-white shadow-lg ring-4 ring-blue-400/50 scale-125 z-30'
                              : 'w-5 h-5 bg-white/95 text-slate-800 border-2 shadow-xs hover:scale-110 hover:bg-blue-50'
                          }`}
                          style={{
                            borderColor: isSelected ? '#FFFFFF' : color
                          }}
                        >
                          {isSelected ? (
                            <div className="relative flex items-center justify-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping absolute" />
                              <span>{item.toothNumber}</span>
                            </div>
                          ) : (
                            <span>{item.toothNumber}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Precision Overlay Leader Lines */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 1200 896"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter
                      id="lesionGlow3D"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {visibleCallouts.map((item) => {
                    const isSelected =
                      String(activeTooth) === String(item.toothNumber);

                    // In 'focus' mode, only draw leader line for active tooth
                    if (displayMode === 'focus' && !isSelected) return null;

                    const { coords } = item;
                    const color = item.ringColor || '#3B82F6';
                    const targetX = coords.target[0];
                    const targetY = coords.target[1];
                    const badgeX = coords.badge[0];
                    const badgeY = coords.badge[1];
                    const isUpper = coords.arch === 'Upper';
                    const tailY = isUpper ? badgeY + 22 : badgeY - 22;

                    return (
                      <g
                        key={`overlay-line-${item.toothNumber}`}
                        className="transition-all duration-300"
                      >
                        <circle
                          cx={targetX}
                          cy={targetY}
                          r={isSelected ? 12 : 7}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          opacity={isSelected ? 1 : 0.45}
                        />
                        <circle
                          cx={targetX}
                          cy={targetY}
                          r={isSelected ? 6 : 4}
                          fill={color}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          filter="url(#lesionGlow3D)"
                        />
                        <line
                          x1={targetX}
                          y1={targetY}
                          x2={badgeX}
                          y2={tailY}
                          stroke={isSelected ? color : '#64748B'}
                          strokeWidth={isSelected ? 2.5 : 1.6}
                          strokeDasharray={isSelected ? 'none' : '4 3'}
                          opacity={isSelected ? 1 : 0.8}
                        />
                        <circle cx={badgeX} cy={tailY} r="2.5" fill={color} />
                      </g>
                    );
                  })}
                </svg>

                {/* Speech Bubble Pill Badges */}
                {visibleCallouts.map((item) => {
                  const isSelected =
                    String(activeTooth) === String(item.toothNumber);

                  // In 'focus' mode, only render speech bubble badge for active tooth
                  if (displayMode === 'focus' && !isSelected) return null;

                  const { coords } = item;
                  const isUpper = coords.arch === 'Upper';
                  const leftPct = (coords.badge[0] / 1200) * 100;
                  const topPct = (coords.badge[1] / 896) * 100;

                  return (
                    <div
                      key={`badge-ui-${item.toothNumber}`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTooth && onSelectTooth(String(item.toothNumber));
                      }}
                      className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer flex flex-col items-center ${
                        isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                      }`}
                      title={`Tooth #${item.toothNumber}: ${item.label} (${item.status})`}
                    >
                      {!isUpper && (
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white drop-shadow-xs" />
                      )}

                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-md bg-white border transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-blue-500/20'
                            : 'border-slate-200 shadow-slate-900/8 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-black shrink-0 shadow-2xs ${
                            item.circleBg || 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.toothNumber}
                        </span>
                        <span
                          className={`text-[11.5px] font-black whitespace-nowrap tracking-tight ${
                            item.labelColor || 'text-blue-600'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {isUpper && (
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-xs" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section Quick Switcher Tabs (Top Right) */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-md">
              {sectionsData.map((sec) => {
                const isCurrent = selectedSection === sec.key;

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setSelectedSection(sec.key)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {sec.key.toUpperCase()}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsZoomed((prev) => !prev)}
              className={`p-1.5 rounded-xl border bg-white/95 backdrop-blur-md shadow-md transition-all cursor-pointer ${
                isZoomed
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'text-slate-600 hover:text-slate-900 border-slate-200/80'
              }`}
              title={isZoomed ? "Zoom Out" : "Zoom In (1.2x)"}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
          </div>

          {/* Indicator Badge (Top Left) */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs text-[10.5px] font-bold text-slate-700 flex items-center gap-2 pointer-events-none z-30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              HD Transparent Jaw Radiograph • {selectedSection.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostic Modes Navigation Tabs */}
      <div className="flex items-center justify-between w-full mt-3 px-1 overflow-x-auto pb-1 gap-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {modeTabs.map((tab) => {
            const isActive = selectedTab === tab.label;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.icon && <span className="text-xs">🦷</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Angle Filmstrip Carousel */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="grid grid-cols-3 gap-2.5 w-full sm:w-auto flex-grow">
          {sectionsData.map((sec) => {
            const isSectionActive = selectedSection === sec.key;

            return (
              <div
                key={sec.id}
                onClick={() => setSelectedSection(sec.key)}
                className={`bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl p-2 border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center text-center select-none ${
                  isSectionActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="w-full h-14 bg-white rounded-xl relative flex items-center justify-center overflow-hidden mb-1 border border-slate-100">
                  <img
                    src={sec.cardThumb || sec.image}
                    alt={sec.title}
                    className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-2xs"
                    onError={(e) => {
                      e.target.src = sec.image;
                    }}
                  />
                  <span
                    className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs ${sec.markerColor}`}
                  />
                </div>

                <div className="text-[11px] font-black text-slate-800 leading-tight">
                  {sec.title}
                </div>
                <div className="text-[9.5px] font-medium text-slate-400">
                  {sec.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Pagination Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 px-1">
          <div className="flex items-center gap-1.5">
            {sectionsData.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setSelectedSection(sec.key)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  selectedSection === sec.key
                    ? 'bg-blue-600 w-4'
                    : 'bg-slate-300 w-1.5'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevSection}
              className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={handleNextSection}
              className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

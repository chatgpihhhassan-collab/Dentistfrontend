import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ANATOMICAL_SECTION_COORDS, getToothPrimarySection } from '../utils/dentalCalloutMapper';

// ============================================================================
// Clinical Radiograph Viewer & Anatomical Multi-Angle Diagnostic Studio
// Dedicated exclusively to 2D HD Transparent Jaw Radiographs with Sub-Pixel
// Target Pointers, Adaptive 3-Tier Staggering, and Multi-Angle Carousel
// ============================================================================
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
  const [isZoomed, setIsZoomed] = useState(false);

  // Automatically switch section when active tooth changes
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
      subtitle: 'Lateral Arch Profile',
      image: '/images/denty_ai/transparent_jaw_left.jpg',
      cardThumb: '/images/denty_ai/transparent_jaw_left.jpg',
      markerColor: 'bg-teal-400'
    },
    {
      id: 'front',
      key: 'front',
      title: 'Front Coronal View',
      subtitle: 'Anterior Dual Arch',
      image: '/images/denty_ai/transparent_jaw_front.jpg',
      cardThumb: '/images/denty_ai/transparent_jaw_front.jpg',
      markerColor: 'bg-blue-500'
    },
    {
      id: 'right',
      key: 'right',
      title: 'Right Sagittal View',
      subtitle: 'Contralateral Molar Arc',
      image: '/images/denty_ai/transparent_jaw_right.jpg',
      cardThumb: '/images/denty_ai/transparent_jaw_right.jpg',
      markerColor: 'bg-rose-400'
    }
  ];

  const currentSectionData = sectionsData.find((s) => s.key === selectedSection) || sectionsData[0];

  // Quick lookup dictionary for findings by tooth number
  const findingsMap = useMemo(() => {
    const map = {};
    if (Array.isArray(findings)) {
      findings.forEach((f) => {
        map[f.toothNumber] = f;
      });
    }
    return map;
  }, [findings]);

  // Filter findings visible in the currently active section & dynamically stagger callouts to eliminate collisions
  const visibleCallouts = useMemo(() => {
    if (!findings || findings.length === 0) return [];

    const sectionCoords = ANATOMICAL_SECTION_COORDS[selectedSection] || {};
    const rawList = [];

    findings.forEach((f) => {
      if (selectedTab === 'Tooth Health') {
        const l = (f.label || '').toLowerCase();
        if (!l.includes('cavity') && !l.includes('caries') && !l.includes('root canal') && !l.includes('crown')) return;
      } else if (selectedTab === 'Bone & Gum Health') {
        const l = (f.label || '').toLowerCase();
        if (!l.includes('bone') && !l.includes('gingivitis') && !l.includes('periodont')) return;
      }

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

    if (rawList.length === 0 && activeTooth && sectionCoords[activeTooth]) {
      const coords = sectionCoords[activeTooth];
      rawList.push({
        toothNumber: parseInt(activeTooth, 10),
        toothNo: String(activeTooth),
        label: 'Clinical Finding',
        ringColor: '#3B82F6',
        badgeBg: 'bg-blue-600 text-white',
        circleBg: 'bg-blue-600 text-white',
        labelColor: 'text-blue-600',
        coords: {
          ...coords,
          target: [...coords.target],
          badge: [...coords.badge]
        }
      });
    }

    // Split into Upper and Lower Arch callouts
    const upperList = rawList.filter((item) => item.coords.arch === 'Upper');
    const lowerList = rawList.filter((item) => item.coords.arch !== 'Upper');

    // Sort by badge X coordinate (left to right)
    upperList.sort((a, b) => a.coords.badge[0] - b.coords.badge[0]);
    lowerList.sort((a, b) => a.coords.badge[0] - b.coords.badge[0]);

    // Dynamic Alternating Stagger for Upper Arch:
    // If 4+ items, use 3 cascading tiers (85, 135, 185) so 3 consecutive items never share a tier.
    // If 1-3 items, use 2 alternating tiers (95, 170).
    const upperTiers = upperList.length >= 4 ? [85, 135, 185] : [95, 170];
    const upperTierStep = upperTiers.length;
    upperList.forEach((item, idx) => {
      item.coords.badge[1] = upperTiers[idx % upperTierStep];
      item.coords.badge[0] = Math.max(90, Math.min(1110, item.coords.badge[0]));
    });

    // Ensure horizontal clearance on same tier for Upper Arch (minimum 250px)
    for (let i = upperTierStep; i < upperList.length; i++) {
      const prevSameTierX = upperList[i - upperTierStep].coords.badge[0];
      if (upperList[i].coords.badge[0] - prevSameTierX < 250) {
        upperList[i].coords.badge[0] = Math.min(1110, prevSameTierX + 255);
      }
    }

    // Dynamic Alternating Stagger for Lower Arch:
    // If 4+ items, use 3 cascading tiers (775, 820, 865).
    // If 1-3 items, use 2 alternating tiers (785, 860).
    const lowerTiers = lowerList.length >= 4 ? [775, 820, 865] : [785, 860];
    const lowerTierStep = lowerTiers.length;
    lowerList.forEach((item, idx) => {
      item.coords.badge[1] = lowerTiers[idx % lowerTierStep];
      item.coords.badge[0] = Math.max(90, Math.min(1110, item.coords.badge[0]));
    });

    // Ensure horizontal clearance on same tier for Lower Arch (minimum 250px)
    for (let j = lowerTierStep; j < lowerList.length; j++) {
      const prevSameTierX = lowerList[j - lowerTierStep].coords.badge[0];
      if (lowerList[j].coords.badge[0] - prevSameTierX < 250) {
        lowerList[j].coords.badge[0] = Math.min(1110, prevSameTierX + 255);
      }
    }

    return [...upperList, ...lowerList];
  }, [findings, selectedSection, selectedTab, activeTooth]);

  const modeTabs = [
    { id: 'overview', label: 'X-Ray Overview' },
    { id: 'tooth-health', label: 'Tooth Health' },
    { id: 'ai-analyze', label: 'AI analyze', icon: true },
    { id: 'bone-gum', label: 'Bone & Gum Health' },
    { id: 'structure', label: 'Structure & Alignment' },
    { id: 'more', label: 'more >' }
  ];

  const currentSectionIdx = sectionsData.findIndex((s) => s.key === selectedSection);

  const handlePrevSection = () => {
    const nextIdx = currentSectionIdx > 0 ? currentSectionIdx - 1 : sectionsData.length - 1;
    setSelectedSection(sectionsData[nextIdx].key);
  };

  const handleNextSection = () => {
    const nextIdx = currentSectionIdx < sectionsData.length - 1 ? currentSectionIdx + 1 : 0;
    setSelectedSection(sectionsData[nextIdx].key);
  };

  const filterStyle = {
    filter: `invert(${isInverted ? '100%' : '0%'}) contrast(${contrastValue}%) brightness(${brightnessValue}%)`,
    transform: `${isFlipped ? 'scaleX(-1)' : 'none'} ${isZoomed ? 'scale(1.15)' : 'scale(1)'}`,
    transition: 'transform 0.3s ease, filter 0.2s ease'
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs relative select-none">
      {/* Main Viewport Container */}
      <div className="relative w-full h-[400px] sm:h-[450px] md:h-[490px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#F2F6FA] via-[#F8FAFC] to-[#EEF3F8] border border-slate-100/90 flex items-center justify-center">
        {/* Layer 1: Content (HD Transparent Jaw Radiograph with aspect-ratio locked alignment) */}
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
              <div className="absolute inset-0 pointer-events-none z-15">
                {visibleCallouts.map((item) => {
                  const { coords } = item;
                  const isSelected = String(activeTooth) === String(item.toothNumber);
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
                      title={`Tooth #${item.toothNumber}: ${item.label}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                          isSelected ? 'scale-125 ring-4 ring-blue-400/40 shadow-lg' : 'hover:scale-110 shadow-sm'
                        }`}
                        style={{
                          borderColor: color,
                          backgroundColor: `${color}25`
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full animate-ping"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Precision Overlay Leader Lines - Mathematically Locked to 1200 x 896 */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 1200 896"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="lesionGlow3D" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {visibleCallouts.map((item) => {
                  const { coords } = item;
                  const isSelected = String(activeTooth) === String(item.toothNumber);
                  const color = item.ringColor || '#3B82F6';
                  const targetX = coords.target[0];
                  const targetY = coords.target[1];
                  const badgeX = coords.badge[0];
                  const badgeY = coords.badge[1];
                  const isUpper = coords.arch === 'Upper';
                  const tailY = isUpper ? badgeY + 22 : badgeY - 22;

                  return (
                    <g key={`overlay-line-${item.toothNumber}`} className="transition-all duration-300">
                      <circle
                        cx={targetX}
                        cy={targetY}
                        r={isSelected ? 11 : 7}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.8"
                        opacity={isSelected ? 0.95 : 0.45}
                      />
                      <circle
                        cx={targetX}
                        cy={targetY}
                        r={isSelected ? 5.5 : 4.0}
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
                        strokeWidth={isSelected ? 2.4 : 1.6}
                        strokeDasharray={isSelected ? 'none' : '4 3'}
                        opacity={isSelected ? 1 : 0.8}
                      />
                      <circle cx={badgeX} cy={tailY} r="2.5" fill={color} />
                    </g>
                  );
                })}
              </svg>

              {/* Speech Bubble Pill Badges - Locked to aspect ratio container */}
              {visibleCallouts.map((item) => {
                const { coords } = item;
                const isSelected = String(activeTooth) === String(item.toothNumber);
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
                          ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-blue-500/15'
                          : 'border-slate-200 shadow-slate-900/8 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-black shrink-0 shadow-2xs ${item.circleBg || 'bg-blue-600 text-white'}`}
                      >
                        {item.toothNumber}
                      </span>
                      <span className={`text-[11.5px] font-black whitespace-nowrap tracking-tight ${item.labelColor || 'text-blue-600'}`}>
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
        </div>

        {/* Indicator Badge (Top Left) */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs text-[10.5px] font-bold text-slate-700 flex items-center gap-2 pointer-events-none z-30">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            HD Transparent Jaw Radiograph • {selectedSection.toUpperCase()}
          </span>
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
                  selectedSection === sec.key ? 'bg-blue-600 w-4' : 'bg-slate-300 w-1.5'
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

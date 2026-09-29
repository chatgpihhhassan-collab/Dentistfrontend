import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, ChevronLeft, Sparkles, ZoomIn } from 'lucide-react';

// Procedural 3D Enamel Tooth for 3D View Mode
function RealisticEnamelTooth({
  toothNumber,
  shape = 'molar',
  position,
  rotation,
  hasPathology,
  pathologyColor,
  isSelected,
  onClick
}) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && (isSelected || hasPathology)) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + toothNumber) * 0.03;
    }
  });

  const materialProps = useMemo(() => ({
    color: '#F8FAFC',
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: 0.08,
    ior: 1.55
  }), []);

  const rootMaterialProps = useMemo(() => ({
    color: '#D8DEE4',
    roughness: 0.42,
    metalness: 0.02,
    opacity: 0.92,
    transparent: true
  }), []);

  const pathologyGlowProps = useMemo(() => {
    if (!hasPathology) return null;
    return {
      color: pathologyColor || '#3B82F6',
      emissive: pathologyColor || '#3B82F6',
      emissiveIntensity: 0.65,
      roughness: 0.2,
      clearcoat: 1.0
    };
  }, [hasPathology, pathologyColor]);

  if (shape === 'molar') {
    return (
      <group ref={meshRef} position={position} rotation={rotation} onClick={onClick}>
        <RoundedBox args={[0.72, 0.52, 0.72]} radius={0.14} smoothness={8} position={[0, 0.18, 0]}>
          <meshPhysicalMaterial {...(pathologyGlowProps || materialProps)} />
        </RoundedBox>
        <mesh position={[-0.2, 0.42, -0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.2, 0.42, -0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[-0.2, 0.42, 0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.2, 0.42, 0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[-0.16, -0.28, 0]} rotation={[0, 0, 0.16]}>
          <cylinderGeometry args={[0.12, 0.03, 0.56, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
        <mesh position={[0.16, -0.28, 0]} rotation={[0, 0, -0.16]}>
          <cylinderGeometry args={[0.12, 0.03, 0.56, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={meshRef} position={position} rotation={rotation} onClick={onClick}>
      <RoundedBox args={[0.56, 0.48, 0.26]} radius={0.06} smoothness={8} position={[0, 0.16, 0]}>
        <meshPhysicalMaterial {...(pathologyGlowProps || materialProps)} />
      </RoundedBox>
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.1, 0.025, 0.58, 16]} />
        <meshPhysicalMaterial {...rootMaterialProps} />
      </mesh>
    </group>
  );
}

// 3D Full Dental Arch Model
function FullDentalArch({ activeTooth, onSelectTooth }) {
  const upperTeeth = useMemo(() => {
    const teeth = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.85 - Math.PI * 0.425;
      const x = Math.sin(angle) * 3.1;
      const z = -Math.cos(angle) * 2.8 + 1.2;
      const rotY = -angle;
      let shape = (i >= 5 && i <= 10) ? 'incisor' : 'molar';
      teeth.push({ id: `upper-${i + 1}`, toothNumber: i + 1, shape, position: [x, 0.5, z], rotation: [0, rotY, 0] });
    }
    return teeth;
  }, []);

  const lowerTeeth = useMemo(() => {
    const teeth = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.82 - Math.PI * 0.41;
      const x = Math.sin(angle) * 2.95;
      const z = -Math.cos(angle) * 2.65 + 1.2;
      const rotY = -angle;
      let shape = (i >= 5 && i <= 10) ? 'incisor' : 'molar';
      teeth.push({ id: `lower-${i + 17}`, toothNumber: i + 17, shape, position: [x, -0.4, z], rotation: [Math.PI, rotY, 0] });
    }
    return teeth;
  }, []);

  return (
    <group position={[0, 0, 0]} rotation={[0.15, 0.45, 0]}>
      {upperTeeth.map((t) => (
        <RealisticEnamelTooth
          key={t.id}
          {...t}
          hasPathology={t.toothNumber === 8 || t.toothNumber === 9}
          pathologyColor="#F59E0B"
          isSelected={activeTooth === '7.9'}
          onClick={() => onSelectTooth && onSelectTooth('7.9')}
        />
      ))}
      {lowerTeeth.map((t) => {
        const isCavity = t.toothNumber === 27;
        const isWear = t.toothNumber === 17;
        return (
          <RealisticEnamelTooth
            key={t.id}
            {...t}
            hasPathology={isCavity || isWear}
            pathologyColor={isCavity ? '#3B82F6' : '#EF4444'}
            isSelected={(isCavity && activeTooth === '27') || (isWear && activeTooth === '6.17')}
            onClick={() => onSelectTooth && onSelectTooth(isCavity ? '27' : '6.17')}
          />
        );
      })}
    </group>
  );
}

export default function ThreeRadiologyJawViewer({
  viewMode = '3d',
  isInverted = false,
  contrastValue = 100,
  brightnessValue = 100,
  isFlipped = false,
  activeTooth = '27',
  onSelectTooth
}) {
  const [selectedTab, setSelectedTab] = useState('AI analyze');
  const [activeAngleIndex, setActiveAngleIndex] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  // Exact Callout Speech-Bubble Badges Matching the Attached Image
  const calloutBadges = [
    {
      id: 'badge-7-9',
      toothNo: '7.9',
      label: 'Bone Pathology',
      labelColor: 'text-[#2563EB]', // Bold blue
      circleBg: 'bg-[#FEF08A] text-[#854D0E]', // Yellow
      position: { top: '15%', left: '38%' },
      tailDirection: 'down',
      confidence: '98.2%',
      severity: '11% Implantation Risk'
    },
    {
      id: 'badge-27-cavity',
      toothNo: '27',
      label: 'Cavity',
      labelColor: 'text-[#2563EB]', // Bold blue
      circleBg: 'bg-[#3B82F6] text-white', // Electric Blue
      position: { top: '18%', left: '62%' },
      tailDirection: 'down',
      confidence: '99.4%',
      severity: '67% Active Dentinal Caries'
    },
    {
      id: 'badge-27-implant',
      toothNo: '27',
      label: 'Implant',
      labelColor: 'text-[#0D9488]', // Teal
      circleBg: 'bg-[#99F6E4] text-[#0F766E]', // Light Teal
      position: { top: '75%', left: '35%' },
      tailDirection: 'up',
      confidence: '96.5%',
      severity: 'Planned Endosseous Site'
    },
    {
      id: 'badge-6-17',
      toothNo: '6.17',
      label: 'Decay, Tooth Wear',
      labelColor: 'text-[#2563EB]', // Bold blue
      circleBg: 'bg-[#FECDD3] text-[#9F1239]', // Pink/Coral
      position: { top: '74%', left: '72%' },
      tailDirection: 'up',
      confidence: '97.8%',
      severity: '76% Periodontal Attachment Loss'
    }
  ];

  // Diagnostic Modes Tabs
  const modeTabs = [
    { id: 'overview', label: 'X-Ray Overview' },
    { id: 'tooth-health', label: 'Tooth Health' },
    { id: 'ai-analyze', label: 'AI analyze', icon: true },
    { id: 'bone-gum', label: 'Bone & Gum Health' },
    { id: 'structure', label: 'Structure & Alignment' },
    { id: 'more', label: 'more >' }
  ];

  // 3 Multi-Angle Perspectives
  const angleCards = [
    {
      id: 'left-sagittal',
      title: 'Left Sagittal Angle',
      subtitle: 'Posterior Molar Arc',
      markerColor: 'bg-teal-400'
    },
    {
      id: 'coronal-arch',
      title: 'Coronal Arch Spotlight',
      subtitle: 'Dual Arch Anterior View',
      markerColor: 'bg-blue-500'
    },
    {
      id: 'right-sagittal',
      title: 'Right Sagittal Angle',
      subtitle: 'Occlusal Attrition View',
      markerColor: 'bg-rose-400'
    }
  ];

  const handlePrevAngle = () => {
    setActiveAngleIndex((prev) => (prev > 0 ? prev - 1 : angleCards.length - 1));
  };

  const handleNextAngle = () => {
    setActiveAngleIndex((prev) => (prev < angleCards.length - 1 ? prev + 1 : 0));
  };

  const filterStyle = {
    filter: `invert(${isInverted ? '100%' : '0%'}) contrast(${contrastValue}%) brightness(${brightnessValue}%)`,
    transform: `${isFlipped ? 'scaleX(-1)' : 'none'} ${isZoomed ? 'scale(1.18)' : 'scale(1)'}`,
    transition: 'transform 0.3s ease, filter 0.2s ease'
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs relative select-none">
      {/* Main Viewport Container */}
      <div className="relative w-full h-[360px] sm:h-[400px] md:h-[420px] rounded-2xl overflow-hidden bg-[#FAFCFE] border border-slate-100/90 flex items-center justify-center">
        {/* Layer 1: High-Definition Anatomical Dental Arch Render (Image matching reference) */}
        {viewMode === '2d' ? (
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
            <img
              src="/images/denty_ai/jaw_lateral_hd.png"
              alt="3D Anatomical Dental Arch"
              className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md select-none"
              style={filterStyle}
              onError={(e) => {
                // Fallback to internal jaw image if not loaded
                e.target.src = '/full_jaw_model.png';
              }}
            />
          </div>
        ) : (
          /* Layer 2: Interactive Three.js 3D WebGL Canvas */
          <div className="w-full h-full relative" style={filterStyle}>
            <Canvas camera={{ position: [0, 1.2, 5.8], fov: 46 }}>
              <ambientLight intensity={1.3} />
              <directionalLight position={[6, 8, 5]} intensity={1.8} />
              <directionalLight position={[-6, 4, 3]} intensity={0.9} />
              <pointLight position={[0, -2, 2]} intensity={0.6} color="#B0CDFF" />
              <FullDentalArch activeTooth={activeTooth} onSelectTooth={onSelectTooth} />
              <OrbitControls enablePan={true} enableZoom={true} minDistance={3.2} maxDistance={8.5} />
            </Canvas>
          </div>
        )}

        {/* Floating Callout Badges with Tail Pointers (Exact replica of attached image) */}
        <div className="absolute inset-0 pointer-events-none">
          {calloutBadges.map((badge) => {
            const isSelected = activeTooth === badge.toothNo;

            return (
              <div
                key={badge.id}
                style={{ top: badge.position.top, left: badge.position.left }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTooth && onSelectTooth(badge.toothNo);
                }}
                className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer flex flex-col items-center ${
                  isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                }`}
                title={`Tooth ${badge.toothNo}: ${badge.label} (${badge.confidence} AI Confidence)`}
              >
                {/* Upward Tail (if tailDirection is up) */}
                {badge.tailDirection === 'up' && (
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white drop-shadow-xs" />
                )}

                {/* Speech Bubble Pill Card */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-lg backdrop-blur-md bg-white border transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-blue-500/10'
                      : 'border-slate-200/90 shadow-slate-900/5'
                  }`}
                >
                  {/* Tooth Number Circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-black shrink-0 shadow-2xs ${badge.circleBg}`}
                  >
                    {badge.toothNo}
                  </span>

                  {/* Clinical Finding Title */}
                  <span className={`text-[12px] font-black whitespace-nowrap tracking-tight ${badge.labelColor}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Downward Tail (if tailDirection is down) */}
                {badge.tailDirection === 'down' && (
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-xs" />
                )}
              </div>
            );
          })}
        </div>

        {/* View Mode Toggle Switch (Top-Right inside Viewport) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full border border-slate-200/80 shadow-2xs text-[11px] font-bold text-slate-700">
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-1 hover:text-blue-600 transition cursor-pointer"
            title="Toggle View Zoom"
          >
            <ZoomIn className={`w-3.5 h-3.5 ${isZoomed ? 'text-blue-600' : ''}`} />
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            {viewMode === '3d' ? '3D WebGL' : 'HD Scan'}
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

      {/* Multi-Angle Mini Filmstrip Carousel */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* 3 Thumbnail Angle Cards */}
        <div className="grid grid-cols-3 gap-2.5 w-full sm:w-auto flex-grow">
          {angleCards.map((card, idx) => {
            const isAngleActive = activeAngleIndex === idx;

            return (
              <div
                key={card.id}
                onClick={() => setActiveAngleIndex(idx)}
                className={`bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl p-2 border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center text-center select-none ${
                  isAngleActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Visual Glow Spotlight Marker */}
                <div className="w-full h-12 bg-gradient-to-b from-slate-200/60 to-slate-100/40 rounded-xl relative flex items-center justify-center overflow-hidden mb-1">
                  <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center opacity-90">
                    <span className="text-base">🦷</span>
                  </div>
                  <span
                    className={`absolute bottom-1 w-2 h-2 rounded-full ring-2 ring-white shadow-xs ${card.markerColor}`}
                  />
                </div>

                <div className="text-[10.5px] font-black text-slate-800 leading-tight">
                  {card.title}
                </div>
                <div className="text-[9px] font-medium text-slate-400">
                  {card.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Pagination Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 px-1">
          {/* Navigation Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  dot === activeAngleIndex ? 'bg-blue-600 w-3' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevAngle}
              className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={handleNextAngle}
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

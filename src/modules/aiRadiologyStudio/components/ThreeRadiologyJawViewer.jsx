import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

// Single 3D Anatomical Tooth Model with Enamel Clearcoat Finish
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

  // Gentle idle breathing animation for selected/pathology tooth
  useFrame((state) => {
    if (meshRef.current && (isSelected || hasPathology)) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + toothNumber) * 0.04;
    }
  });

  const materialProps = useMemo(() => ({
    color: '#F8FAFC',
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: 0.08, // Subtle enamel translucency
    ior: 1.55 // Porcelain refractive index
  }), []);

  const rootMaterialProps = useMemo(() => ({
    color: '#D8DEE4',
    roughness: 0.42,
    metalness: 0.02,
    opacity: 0.92,
    transparent: true
  }), []);

  // Hotspot emissive glow for affected teeth
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
        {/* Crown Body */}
        <RoundedBox args={[0.72, 0.52, 0.72]} radius={0.14} smoothness={8} position={[0, 0.18, 0]}>
          <meshPhysicalMaterial {...(pathologyGlowProps || materialProps)} />
        </RoundedBox>

        {/* 4 Occlusal Cusps */}
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

        {/* Bifurcated Anatomical Roots */}
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

  if (shape === 'premolar') {
    return (
      <group ref={meshRef} position={position} rotation={rotation} onClick={onClick}>
        <RoundedBox args={[0.56, 0.48, 0.56]} radius={0.12} smoothness={8} position={[0, 0.16, 0]}>
          <meshPhysicalMaterial {...(pathologyGlowProps || materialProps)} />
        </RoundedBox>
        <mesh position={[-0.14, 0.38, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.14, 0.38, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0, -0.26, 0]} rotation={[0.06, 0, -0.04]}>
          <cylinderGeometry args={[0.1, 0.025, 0.54, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
      </group>
    );
  }

  if (shape === 'canine') {
    return (
      <group ref={meshRef} position={position} rotation={rotation} onClick={onClick}>
        <mesh position={[0, 0.18, 0]} scale={[0.58, 0.92, 0.58]}>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshPhysicalMaterial {...(pathologyGlowProps || materialProps)} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0, -0.32, 0]} rotation={[0.05, 0, -0.05]}>
          <cylinderGeometry args={[0.12, 0.03, 0.68, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
      </group>
    );
  }

  // Incisor
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

// Procedural Semi-Translucent Alveolar Bone Mesh
function AlveolarBoneCurve({ arch = 'upper' }) {
  const isUpper = arch === 'upper';
  const yOffset = isUpper ? 0.35 : -0.35;

  return (
    <mesh position={[0, yOffset, 0]} rotation={[isUpper ? Math.PI : 0, 0, 0]}>
      <torusGeometry args={[3.2, 0.42, 16, 64, Math.PI * 0.9]} />
      <meshPhysicalMaterial
        color="#E2E8F0"
        roughness={0.4}
        metalness={0.01}
        transmission={0.45} // Semi-translucent cortical bone
        opacity={0.7}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

// Full Dual-Arch 3D Dental Model
function FullDentalArch({ activeTooth, onSelectTooth }) {
  // Generate 16 upper teeth along a parabolic dental curve
  const upperTeeth = useMemo(() => {
    const teeth = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.85 - Math.PI * 0.425;
      const x = Math.sin(angle) * 3.1;
      const z = -Math.cos(angle) * 2.8 + 1.2;
      const rotY = -angle;

      let shape = 'molar';
      if (i >= 5 && i <= 10) shape = i === 5 || i === 10 ? 'canine' : 'incisor';
      else if (i === 3 || i === 4 || i === 11 || i === 12) shape = 'premolar';

      teeth.push({
        id: `upper-${i + 1}`,
        toothNumber: i + 1,
        shape,
        position: [x, 0.5, z],
        rotation: [0, rotY, 0]
      });
    }
    return teeth;
  }, []);

  // Generate 16 lower teeth along the mandibular curve
  const lowerTeeth = useMemo(() => {
    const teeth = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.82 - Math.PI * 0.41;
      const x = Math.sin(angle) * 2.95;
      const z = -Math.cos(angle) * 2.65 + 1.2;
      const rotY = -angle;

      let shape = 'molar';
      if (i >= 5 && i <= 10) shape = i === 5 || i === 10 ? 'canine' : 'incisor';
      else if (i === 3 || i === 4 || i === 11 || i === 12) shape = 'premolar';

      teeth.push({
        id: `lower-${i + 17}`,
        toothNumber: i + 17,
        shape,
        position: [x, -0.4, z],
        rotation: [Math.PI, rotY, 0] // Inverted for lower arch
      });
    }
    return teeth;
  }, []);

  return (
    <group position={[0, 0, 0]} rotation={[0.2, 0.4, 0]}>
      {/* Alveolar Bone Arches */}
      <AlveolarBoneCurve arch="upper" />
      <AlveolarBoneCurve arch="lower" />

      {/* Upper Arch Teeth */}
      {upperTeeth.map((tooth) => {
        const isPathology = tooth.toothNumber === 8 || tooth.toothNumber === 9; // 7.9 Bone Pathology
        return (
          <RealisticEnamelTooth
            key={tooth.id}
            {...tooth}
            hasPathology={isPathology}
            pathologyColor="#F59E0B"
            isSelected={activeTooth === '7.9'}
            onClick={() => onSelectTooth && onSelectTooth('7.9')}
          />
        );
      })}

      {/* Lower Arch Teeth */}
      {lowerTeeth.map((tooth) => {
        const isCavity = tooth.toothNumber === 27; // Tooth 27 Cavity & Implant
        const isWear = tooth.toothNumber === 17 || tooth.toothNumber === 18; // Tooth 6.17
        const hasPathology = isCavity || isWear;
        const color = isCavity ? '#3B82F6' : '#EF4444';

        return (
          <RealisticEnamelTooth
            key={tooth.id}
            {...tooth}
            hasPathology={hasPathology}
            pathologyColor={color}
            isSelected={
              (isCavity && activeTooth === '27') ||
              (isWear && activeTooth === '6.17')
            }
            onClick={() => {
              if (isCavity) onSelectTooth && onSelectTooth('27');
              else if (isWear) onSelectTooth && onSelectTooth('6.17');
            }}
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
  const controlsRef = useRef();
  const [selectedTab, setSelectedTab] = useState('AI analyze');
  const [activeAngleIndex, setActiveAngleIndex] = useState(1);

  // Floating AI Pinpoint Badges Data (Matching Image Callouts)
  const pinBadges = [
    {
      id: 'pin-bone-pathology',
      toothNo: '7.9',
      label: 'Bone Pathology',
      circleBg: 'bg-amber-400 text-amber-950',
      pillBg: 'bg-white/95 text-slate-800',
      leaderDot: 'bg-amber-400',
      top: '18%',
      left: '32%',
      confidence: '97.2%'
    },
    {
      id: 'pin-cavity',
      toothNo: '27',
      label: 'Cavity',
      circleBg: 'bg-blue-600 text-white',
      pillBg: 'bg-white/95 text-slate-800',
      leaderDot: 'bg-blue-500',
      top: '20%',
      left: '46%',
      confidence: '99.1%'
    },
    {
      id: 'pin-implant',
      toothNo: '27',
      label: 'Implant',
      circleBg: 'bg-emerald-500 text-white',
      pillBg: 'bg-white/95 text-slate-800',
      leaderDot: 'bg-emerald-400',
      top: '58%',
      left: '31%',
      confidence: '95.8%'
    },
    {
      id: 'pin-decay-wear',
      toothNo: '6.17',
      label: 'Decay, Tooth Wear',
      circleBg: 'bg-rose-500 text-white',
      pillBg: 'bg-white/95 text-slate-800',
      leaderDot: 'bg-rose-500',
      top: '57%',
      left: '49%',
      confidence: '98.4%'
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

  // Multi-Angle Thumbnail Filmstrip Data
  const angleCards = [
    {
      id: 'left-sagittal',
      title: 'Left Sagittal Angle',
      subtitle: 'Posterior Molar Arc',
      markerColor: 'bg-teal-400',
      badgeColor: 'border-teal-400',
      viewAngle: [-0.6, 0.4, 0]
    },
    {
      id: 'coronal-arch',
      title: 'Coronal Arch Spotlight',
      subtitle: 'Dual Arch Anterior View',
      markerColor: 'bg-blue-500',
      badgeColor: 'border-blue-500',
      viewAngle: [0, 0, 0]
    },
    {
      id: 'right-sagittal',
      title: 'Right Sagittal Angle',
      subtitle: 'Occlusal Attrition View',
      markerColor: 'bg-rose-400',
      badgeColor: 'border-rose-400',
      viewAngle: [0.6, 0.4, 0]
    }
  ];

  const handlePrevAngle = () => {
    setActiveAngleIndex((prev) => (prev > 0 ? prev - 1 : angleCards.length - 1));
  };

  const handleNextAngle = () => {
    setActiveAngleIndex((prev) => (prev < angleCards.length - 1 ? prev + 1 : 0));
  };

  // Image filter styles for 2D/Canvas manipulation
  const filterStyle = {
    filter: `invert(${isInverted ? '100%' : '0%'}) contrast(${contrastValue}%) brightness(${brightnessValue}%)`,
    transform: isFlipped ? 'scaleX(-1)' : 'none'
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-3xl p-5 border border-slate-100 shadow-xs relative select-none">
      {/* Main 3D Dental Viewport */}
      <div
        className="w-full h-[380px] sm:h-[420px] rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#F3F6FA] via-[#F8FAFC] to-[#EEF2F6] border border-slate-100 flex items-center justify-center"
        style={filterStyle}
      >
        {/* Three.js 3D WebGL Canvas */}
        <Canvas
          camera={{ position: [0, 1.2, 5.8], fov: 46 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Lighting */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[6, 8, 5]} intensity={1.8} castShadow />
          <directionalLight position={[-6, 4, 3]} intensity={0.9} />
          <pointLight position={[0, -2, 2]} intensity={0.6} color="#B0CDFF" />

          {/* Dual Arch Teeth & Bone Model */}
          <FullDentalArch activeTooth={activeTooth} onSelectTooth={onSelectTooth} />

          {/* Smooth Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            minDistance={3.5}
            maxDistance={8.5}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 3.5}
          />
        </Canvas>

        {/* Floating AI Pinpoint Leader Badges (Overlay Anchored) */}
        <div className="absolute inset-0 pointer-events-none">
          {pinBadges.map((pin) => {
            const isSelected = activeTooth === pin.toothNo;

            return (
              <div
                key={pin.id}
                style={{ top: pin.top, left: pin.left }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTooth && onSelectTooth(pin.toothNo);
                }}
                className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border ${
                  isSelected
                    ? 'scale-110 ring-2 ring-blue-500 bg-white border-blue-400 z-30 shadow-lg'
                    : 'hover:scale-105 bg-white/95 border-slate-200/90 z-20'
                }`}
                title={`Tooth ${pin.toothNo}: ${pin.label} (${pin.confidence} AI Confidence)`}
              >
                {/* Tooth Number Pill */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${pin.circleBg}`}
                >
                  {pin.toothNo}
                </span>

                {/* Finding Label */}
                <span className="text-[11px] font-black text-slate-800 whitespace-nowrap">
                  {pin.label}
                </span>

                {/* Tiny Status Dot */}
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pin.leaderDot}`} />
              </div>
            );
          })}
        </div>

        {/* Subtle Watermark Badge */}
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/60 shadow-2xs text-[10px] font-bold text-slate-600 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive 3D Odontogram Engine</span>
        </div>
      </div>

      {/* Diagnostic Modes Navigation Tabs */}
      <div className="flex items-center justify-between w-full mt-4 px-2 overflow-x-auto pb-1 gap-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {modeTabs.map((tab) => {
            const isActive = selectedTab === tab.label;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.label)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.icon && (
                  <span className="text-xs">🦷</span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Angle Mini Filmstrip Carousel (3 Bottom Angle Cards) */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* 3 Thumbnail Angle Cards */}
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto flex-grow">
          {angleCards.map((card, idx) => {
            const isAngleActive = activeAngleIndex === idx;

            return (
              <div
                key={card.id}
                onClick={() => setActiveAngleIndex(idx)}
                className={`bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl p-2.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center text-center select-none ${
                  isAngleActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Visual Glow Spotlight Marker */}
                <div className="w-full h-14 bg-gradient-to-b from-slate-200/60 to-slate-100/40 rounded-xl relative flex items-center justify-center overflow-hidden mb-1.5">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center opacity-90">
                    <span className="text-lg">🦷</span>
                  </div>
                  {/* Color Glow Indicator */}
                  <span
                    className={`absolute bottom-1 w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs animate-ping ${card.markerColor}`}
                  />
                  <span
                    className={`absolute bottom-1 w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs ${card.markerColor}`}
                  />
                </div>

                <div className="text-[11px] font-black text-slate-800 leading-tight">
                  {card.title}
                </div>
                <div className="text-[9.5px] font-medium text-slate-400">
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

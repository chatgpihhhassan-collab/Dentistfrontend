import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, ChevronLeft, ZoomIn, Eye, Sparkles } from 'lucide-react';

// ============================================================================
// 1. Procedural 3D Anatomical Tooth (Enamel Crown + Roots Anchored in Bone)
// ============================================================================
function DynamicEnamelTooth({
  toothNumber,
  shape = 'molar',
  position,
  rotation,
  hasPathology,
  pathologyColor,
  isSelected,
  onClick,
  arch = 'upper'
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected || hovered) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4 + toothNumber) * 0.04;
      } else {
        meshRef.current.position.y = position[1];
      }
    }
  });

  const enamelMaterial = useMemo(() => {
    if (hasPathology) {
      return (
        <meshPhysicalMaterial
          color={pathologyColor || '#3B82F6'}
          emissive={pathologyColor || '#3B82F6'}
          emissiveIntensity={0.65}
          roughness={0.16}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      );
    }
    return (
      <meshPhysicalMaterial
        color={hovered ? '#E0F2FE' : '#FCFCFE'}
        roughness={0.12}
        metalness={0.02}
        clearcoat={1.0}
        clearcoatRoughness={0.04}
        transmission={0.06}
        ior={1.55}
      />
    );
  }, [hasPathology, pathologyColor, hovered]);

  const rootMaterial = useMemo(() => (
    <meshPhysicalMaterial
      color={hasPathology ? pathologyColor : '#D5DDE4'}
      roughness={0.35}
      metalness={0.02}
      opacity={0.9}
      transparent={true}
    />
  ), [hasPathology, pathologyColor]);

  const isUpper = arch === 'upper';
  const rootDir = isUpper ? 1 : -1;

  if (shape === 'molar') {
    return (
      <group
        ref={meshRef}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={isSelected ? [1.14, 1.14, 1.14] : [1, 1, 1]}
      >
        <RoundedBox args={[0.76, 0.48, 0.76]} radius={0.14} smoothness={8} position={[0, 0, 0]}>
          {enamelMaterial}
        </RoundedBox>
        {/* Cusps */}
        <mesh position={[-0.2, 0.24 * (isUpper ? -1 : 1), -0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          {enamelMaterial}
        </mesh>
        <mesh position={[0.2, 0.24 * (isUpper ? -1 : 1), -0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          {enamelMaterial}
        </mesh>
        <mesh position={[-0.2, 0.24 * (isUpper ? -1 : 1), 0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          {enamelMaterial}
        </mesh>
        <mesh position={[0.2, 0.24 * (isUpper ? -1 : 1), 0.2]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          {enamelMaterial}
        </mesh>
        {/* Bifurcated Roots */}
        <mesh position={[-0.18, 0.38 * rootDir, 0]} rotation={[0, 0, 0.16 * rootDir]}>
          <cylinderGeometry args={[0.11, 0.02, 0.64, 16]} />
          {rootMaterial}
        </mesh>
        <mesh position={[0.18, 0.38 * rootDir, 0]} rotation={[0, 0, -0.16 * rootDir]}>
          <cylinderGeometry args={[0.11, 0.02, 0.64, 16]} />
          {rootMaterial}
        </mesh>
      </group>
    );
  }

  if (shape === 'premolar') {
    return (
      <group
        ref={meshRef}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={isSelected ? [1.14, 1.14, 1.14] : [1, 1, 1]}
      >
        <RoundedBox args={[0.58, 0.44, 0.58]} radius={0.12} smoothness={8} position={[0, 0, 0]}>
          {enamelMaterial}
        </RoundedBox>
        <mesh position={[0, 0.35 * rootDir, 0]} rotation={[0.06, 0, -0.05]}>
          <cylinderGeometry args={[0.1, 0.02, 0.58, 16]} />
          {rootMaterial}
        </mesh>
      </group>
    );
  }

  if (shape === 'canine') {
    return (
      <group
        ref={meshRef}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={isSelected ? [1.14, 1.14, 1.14] : [1, 1, 1]}
      >
        <mesh position={[0, 0, 0]} scale={[0.56, 0.92, 0.56]}>
          <sphereGeometry args={[0.34, 32, 32]} />
          {enamelMaterial}
        </mesh>
        <mesh position={[0, 0.42 * rootDir, 0]} rotation={[0.05, 0, -0.05]}>
          <cylinderGeometry args={[0.12, 0.025, 0.76, 16]} />
          {rootMaterial}
        </mesh>
      </group>
    );
  }

  // Incisor
  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      scale={isSelected ? [1.14, 1.14, 1.14] : [1, 1, 1]}
    >
      <RoundedBox args={[0.56, 0.44, 0.24]} radius={0.06} smoothness={8} position={[0, 0, 0]}>
        {enamelMaterial}
      </RoundedBox>
      <mesh position={[0, 0.38 * rootDir, 0]}>
        <cylinderGeometry args={[0.1, 0.02, 0.64, 16]} />
        {rootMaterial}
      </mesh>
    </group>
  );
}

// ============================================================================
// 2. Transparent Anatomical Jawbone Volumes (Glassmorphic X-Ray Bone)
// ============================================================================
function TransparentJawBoneVolume({ arch = 'mandible' }) {
  const isUpper = arch === 'maxilla';

  const transparentBoneMaterial = useMemo(() => (
    <meshPhysicalMaterial
      color="#E5ECF2"
      transmission={0.76}
      opacity={0.34}
      roughness={0.28}
      metalness={0.02}
      ior={1.42}
      transparent={true}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  ), []);

  if (isUpper) {
    return (
      <group position={[0, 0.62, 0]}>
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]}>
          <torusGeometry args={[3.15, 0.54, 16, 64, Math.PI * 0.95]} />
          {transparentBoneMaterial}
        </mesh>
        <mesh position={[0, 0.48, -0.6]} scale={[2.6, 0.7, 2.2]}>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          {transparentBoneMaterial}
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, -0.62, 0]}>
      <mesh position={[0, -0.1, 0]}>
        <torusGeometry args={[3.0, 0.52, 16, 64, Math.PI * 0.92]} />
        {transparentBoneMaterial}
      </mesh>
      {/* Ascending Ramus Wings */}
      <mesh position={[-2.85, 0.65, -1.8]} rotation={[0.2, 0.3, 0.1]} scale={[0.3, 1.45, 0.9]}>
        <boxGeometry args={[1, 1, 1]} />
        {transparentBoneMaterial}
      </mesh>
      <mesh position={[2.85, 0.65, -1.8]} rotation={[0.2, -0.3, -0.1]} scale={[0.3, 1.45, 0.9]}>
        <boxGeometry args={[1, 1, 1]} />
        {transparentBoneMaterial}
      </mesh>
    </group>
  );
}

// ============================================================================
// 3. Full Dual Arch Dental Model (32 Dynamic Teeth in Transparent Jaws)
// ============================================================================
function DualArchDentalModel({ activeTooth, onSelectTooth }) {
  const upperTeeth = useMemo(() => {
    const list = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.86 - Math.PI * 0.43;
      const x = Math.sin(angle) * 3.1;
      const z = -Math.cos(angle) * 2.85 + 1.25;
      const rotY = -angle;

      let shape = 'molar';
      if (i >= 5 && i <= 10) shape = (i === 5 || i === 10) ? 'canine' : 'incisor';
      else if (i === 3 || i === 4 || i === 11 || i === 12) shape = 'premolar';

      list.push({
        id: `upper-${i + 1}`,
        toothNumber: i + 1,
        shape,
        position: [x, 0.38, z],
        rotation: [0, rotY, 0]
      });
    }
    return list;
  }, []);

  const lowerTeeth = useMemo(() => {
    const list = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.83 - Math.PI * 0.415;
      const x = Math.sin(angle) * 2.95;
      const z = -Math.cos(angle) * 2.7 + 1.25;
      const rotY = -angle;

      let shape = 'molar';
      if (i >= 5 && i <= 10) shape = (i === 5 || i === 10) ? 'canine' : 'incisor';
      else if (i === 3 || i === 4 || i === 11 || i === 12) shape = 'premolar';

      list.push({
        id: `lower-${i + 17}`,
        toothNumber: i + 17,
        shape,
        position: [x, -0.38, z],
        rotation: [0, rotY, 0]
      });
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <TransparentJawBoneVolume arch="maxilla" />
      <TransparentJawBoneVolume arch="mandible" />

      {upperTeeth.map((tooth) => {
        const isBonePathology = tooth.toothNumber === 7 || tooth.toothNumber === 9;
        const isSelected = activeTooth === '7.9' && isBonePathology;
        return (
          <DynamicEnamelTooth
            key={tooth.id}
            {...tooth}
            arch="upper"
            hasPathology={isBonePathology}
            pathologyColor="#F59E0B"
            isSelected={isSelected}
            onClick={() => onSelectTooth && onSelectTooth('7.9')}
          />
        );
      })}

      {lowerTeeth.map((tooth) => {
        const isCavity = tooth.toothNumber === 27;
        const isPeriodontitis = tooth.toothNumber === 17;
        const hasPathology = isCavity || isPeriodontitis;
        const color = isCavity ? '#3B82F6' : '#EF4444';
        const isSelected =
          (isCavity && activeTooth === '27') ||
          (isPeriodontitis && activeTooth === '6.17');

        return (
          <DynamicEnamelTooth
            key={tooth.id}
            {...tooth}
            arch="lower"
            hasPathology={hasPathology}
            pathologyColor={color}
            isSelected={isSelected}
            onClick={() => onSelectTooth && onSelectTooth(isCavity ? '27' : '6.17')}
          />
        );
      })}
    </group>
  );
}

// ============================================================================
// 4. Smooth Camera Section Controller (Left, Front, Right)
// ============================================================================
function CameraSectionController({ section = 'left', controlsRef }) {
  const cameraPresets = useMemo(() => ({
    left: { pos: [-5.4, 0.35, 2.6], target: [-0.6, 0.05, 0.4] },
    front: { pos: [0, 0.15, 6.0], target: [0, 0, 0.8] },
    right: { pos: [5.4, 0.35, 2.6], target: [0.6, 0.05, 0.4] }
  }), []);

  useFrame((state) => {
    const preset = cameraPresets[section] || cameraPresets.left;
    const targetPos = new THREE.Vector3(...preset.pos);
    const targetLookAt = new THREE.Vector3(...preset.target);

    state.camera.position.lerp(targetPos, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, 0.08);
      controlsRef.current.update();
    }
  });

  return null;
}

// ============================================================================
// 5. Main Component: ThreeRadiologyJawViewer
// ============================================================================
export default function ThreeRadiologyJawViewer({
  viewMode = '3d', // '3d' for WebGL, '2d' for HD Scan render
  isInverted = false,
  contrastValue = 100,
  brightnessValue = 100,
  isFlipped = false,
  activeTooth = '27',
  onSelectTooth
}) {
  const controlsRef = useRef();
  const [selectedSection, setSelectedSection] = useState('left'); // 'left' | 'front' | 'right'
  const [selectedTab, setSelectedTab] = useState('AI analyze');
  const [isZoomed, setIsZoomed] = useState(false);

  // Transparent Jaw Images generated for each section
  const sectionImages = {
    left: '/images/denty_ai/transparent_jaw_left.jpg',
    front: '/images/denty_ai/transparent_jaw_front.jpg',
    right: '/images/denty_ai/transparent_jaw_right.jpg'
  };

  // Section details
  const sectionsData = [
    {
      id: 'left',
      key: 'left',
      title: 'Left Sagittal View',
      subtitle: 'Lateral Arch Profile',
      image: '/images/denty_ai/transparent_jaw_left.jpg',
      cardThumb: '/images/denty_ai/card_jaw_left.png',
      markerColor: 'bg-teal-400',
      activeHotspot: 'Teal Implant Root'
    },
    {
      id: 'front',
      key: 'front',
      title: 'Front Coronal View',
      subtitle: 'Anterior Dual Arch',
      image: '/images/denty_ai/transparent_jaw_front.jpg',
      cardThumb: '/images/denty_ai/card_jaw_front.png',
      markerColor: 'bg-blue-500',
      activeHotspot: 'Blue Cavity Crown'
    },
    {
      id: 'right',
      key: 'right',
      title: 'Right Sagittal View',
      subtitle: 'Contralateral Molar Arc',
      image: '/images/denty_ai/transparent_jaw_right.jpg',
      cardThumb: '/images/denty_ai/card_jaw_right.png',
      markerColor: 'bg-rose-400',
      activeHotspot: 'Yellow & Red Pathology'
    }
  ];

  // Callout Badges with Speech-Bubble Pointer Tails
  const calloutBadges = [
    {
      id: 'badge-7-9',
      toothNo: '7.9',
      label: 'Bone Pathology',
      labelColor: 'text-[#2563EB]',
      circleBg: 'bg-[#FEF08A] text-[#854D0E]',
      position: { top: '16%', left: '38%' },
      tailDirection: 'down',
      visibleSections: ['left', 'front']
    },
    {
      id: 'badge-27-cavity',
      toothNo: '27',
      label: 'Cavity',
      labelColor: 'text-[#2563EB]',
      circleBg: 'bg-[#3B82F6] text-white',
      position: { top: '19%', left: '62%' },
      tailDirection: 'down',
      visibleSections: ['left', 'front', 'right']
    },
    {
      id: 'badge-27-implant',
      toothNo: '27',
      label: 'Implant',
      labelColor: 'text-[#0D9488]',
      circleBg: 'bg-[#99F6E4] text-[#0F766E]',
      position: { top: '75%', left: '35%' },
      tailDirection: 'up',
      visibleSections: ['left', 'front']
    },
    {
      id: 'badge-6-17',
      toothNo: '6.17',
      label: 'Decay, Tooth Wear',
      labelColor: 'text-[#2563EB]',
      circleBg: 'bg-[#FECDD3] text-[#9F1239]',
      position: { top: '74%', left: '72%' },
      tailDirection: 'up',
      visibleSections: ['left', 'right']
    }
  ];

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
      <div className="relative w-full h-[380px] sm:h-[420px] md:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#F2F6FA] via-[#F8FAFC] to-[#EEF3F8] border border-slate-100/90 flex items-center justify-center">
        {/* Layer A: HD Transparent Jaw Scan Mode */}
        {viewMode === '2d' ? (
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={filterStyle}>
            <img
              src={sectionImages[selectedSection] || sectionImages.left}
              alt={`Transparent Jaw ${selectedSection} view`}
              className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md select-none transition-all duration-500"
              onError={(e) => {
                e.target.src = '/images/denty_ai/jaw_lateral_hd.png';
              }}
            />
          </div>
        ) : (
          /* Layer B: Interactive 3D WebGL Canvas with Transparent Jawbone & Dynamic Teeth */
          <div className="w-full h-full relative" style={filterStyle}>
            <Canvas
              camera={{ position: [-5.4, 0.35, 2.6], fov: 44 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <ambientLight intensity={1.4} />
              <directionalLight position={[6, 8, 5]} intensity={1.9} />
              <directionalLight position={[-6, 4, 3]} intensity={1.1} />
              <pointLight position={[0, -2, 2]} intensity={0.7} color="#B0CDFF" />
              <pointLight position={[0, 3, -1]} intensity={0.5} color="#FFFFFF" />

              {/* Transparent Jawbone + 32 Dynamic Teeth */}
              <DualArchDentalModel
                activeTooth={activeTooth}
                onSelectTooth={onSelectTooth}
              />

              {/* Section Camera Director (Left, Front, Right) */}
              <CameraSectionController
                section={selectedSection}
                controlsRef={controlsRef}
              />

              <OrbitControls
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                minDistance={3.0}
                maxDistance={9.0}
                maxPolarAngle={Math.PI / 1.7}
                minPolarAngle={Math.PI / 3.6}
              />
            </Canvas>
          </div>
        )}

        {/* Floating Speech-Bubble Callout Badges */}
        <div className="absolute inset-0 pointer-events-none">
          {calloutBadges
            .filter((b) => b.visibleSections.includes(selectedSection))
            .map((badge) => {
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
                  title={`Tooth ${badge.toothNo}: ${badge.label}`}
                >
                  {badge.tailDirection === 'up' && (
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white drop-shadow-xs" />
                  )}

                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-lg backdrop-blur-md bg-white border transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-blue-500/10'
                        : 'border-slate-200/90 shadow-slate-900/5'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-black shrink-0 shadow-2xs ${badge.circleBg}`}
                    >
                      {badge.toothNo}
                    </span>
                    <span className={`text-[12px] font-black whitespace-nowrap tracking-tight ${badge.labelColor}`}>
                      {badge.label}
                    </span>
                  </div>

                  {badge.tailDirection === 'down' && (
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-xs" />
                  )}
                </div>
              );
            })}
        </div>

        {/* Section Quick Switcher Tabs (Top Right of Viewport) */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-md">
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

        {/* Transparent Jawbone Indicator Badge (Top Left of Viewport) */}
        <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs text-[10.5px] font-bold text-slate-700 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            {viewMode === '3d' ? '3D WebGL Transparent Jaw' : 'HD Transparent Jaw Scan'} • {selectedSection.toUpperCase()}
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

      {/* Multi-Angle Mini Filmstrip Carousel (Displaying actual transparent jaw images) */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* 3 Section Perspective Cards with Real Transparent Jaw Images */}
        <div className="grid grid-cols-3 gap-2.5 w-full sm:w-auto flex-grow">
          {sectionsData.map((sec, idx) => {
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
                {/* Real Transparent Jaw Image Thumbnail */}
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
          {/* Navigation Dots */}
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

          {/* Prev / Next Buttons */}
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

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, ChevronLeft, RotateCcw, Box } from 'lucide-react';
import { ANATOMICAL_SECTION_COORDS, getToothPrimarySection } from '../utils/dentalCalloutMapper';

// ============================================================================
// 1. Realistic 3D Anatomical Tooth Geometries & Components
// ============================================================================

// 1A. Molar: 4 distinct anatomical cusps, central fissure, cervical neck, multi-rooted
function AnatomicalMolar({ isUpper = true, enamelMaterial, rootMaterial, lesionMaterial, hasPathology }) {
  const rootDir = isUpper ? 1 : -1;

  return (
    <group>
      {/* Crown Cervical Base (CEJ) with natural curvature */}
      <mesh position={[0, 0.04 * (isUpper ? -1 : 1), 0]} scale={[1.15, 1, 0.95]}>
        <cylinderGeometry args={[0.34, 0.28, 0.22, 28]} />
        {enamelMaterial}
      </mesh>

      {/* Occlusal Table with 4 Distinct Anatomical Cusps */}
      <group position={[0, 0.14 * (isUpper ? -1 : 1), 0]}>
        {/* Mesiobuccal Cusp */}
        <mesh position={[-0.14, 0, -0.13]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          {enamelMaterial}
        </mesh>
        {/* Distobuccal Cusp */}
        <mesh position={[0.14, 0, -0.13]} scale={[1, 0.65, 1]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          {enamelMaterial}
        </mesh>
        {/* Mesiolingual Cusp (Major Lingual Cusp) */}
        <mesh position={[-0.14, 0, 0.13]} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          {enamelMaterial}
        </mesh>
        {/* Distolingual Cusp */}
        <mesh position={[0.14, 0, 0.13]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.10, 16, 16]} />
          {enamelMaterial}
        </mesh>

        {/* Central Occlusal Fossa / Lesion Spot */}
        <mesh position={[0, 0.01 * (isUpper ? -1 : 1), 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.04, 16]} />
          {hasPathology ? lesionMaterial : enamelMaterial}
        </mesh>
      </group>

      {/* Multi-Rooted System Embedded inside Alveolar Bone */}
      {isUpper ? (
        // Upper Molar: Trifurcated Roots (2 Buccal, 1 Palatal)
        <group position={[0, 0.14 * rootDir, 0]}>
          {/* Palatal Root */}
          <mesh position={[0, 0.24 * rootDir, 0.11]} rotation={[0.15 * rootDir, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.025, 0.44, 16]} />
            {rootMaterial}
          </mesh>
          {/* Mesiobuccal Root */}
          <mesh position={[-0.13, 0.22 * rootDir, -0.09]} rotation={[-0.10 * rootDir, 0, 0.12 * rootDir]}>
            <cylinderGeometry args={[0.08, 0.02, 0.40, 16]} />
            {rootMaterial}
          </mesh>
          {/* Distobuccal Root */}
          <mesh position={[0.13, 0.22 * rootDir, -0.09]} rotation={[-0.10 * rootDir, 0, -0.12 * rootDir]}>
            <cylinderGeometry args={[0.07, 0.02, 0.38, 16]} />
            {rootMaterial}
          </mesh>
        </group>
      ) : (
        // Lower Molar: Bifurcated Curved Roots (Mesial & Distal)
        <group position={[0, 0.14 * rootDir, 0]}>
          {/* Mesial Root */}
          <mesh position={[-0.13, 0.24 * rootDir, 0]} rotation={[0, 0, 0.12 * rootDir]}>
            <cylinderGeometry args={[0.10, 0.025, 0.44, 16]} />
            {rootMaterial}
          </mesh>
          {/* Distal Root */}
          <mesh position={[0.13, 0.24 * rootDir, 0]} rotation={[0, 0, -0.12 * rootDir]}>
            <cylinderGeometry args={[0.09, 0.025, 0.42, 16]} />
            {rootMaterial}
          </mesh>
        </group>
      )}
    </group>
  );
}

// 1B. Premolar: Bicuspid crown (buccal & lingual cusps, central developmental groove)
function AnatomicalPremolar({ isUpper = true, enamelMaterial, rootMaterial, lesionMaterial, hasPathology }) {
  const rootDir = isUpper ? 1 : -1;

  return (
    <group>
      {/* Crown Cervical Base */}
      <mesh position={[0, 0.03 * (isUpper ? -1 : 1), 0]} scale={[1.1, 1, 0.9]}>
        <cylinderGeometry args={[0.24, 0.20, 0.22, 24]} />
        {enamelMaterial}
      </mesh>

      {/* Bicuspid Occlusal Table */}
      <group position={[0, 0.13 * (isUpper ? -1 : 1), 0]}>
        {/* Buccal Cusp */}
        <mesh position={[0, 0, -0.08]} scale={[1.1, 0.8, 1]}>
          <coneGeometry args={[0.12, 0.15, 16]} />
          {enamelMaterial}
        </mesh>
        {/* Lingual Cusp */}
        <mesh position={[0, -0.02 * (isUpper ? -1 : 1), 0.08]} scale={[1.05, 0.7, 1]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          {enamelMaterial}
        </mesh>
        {/* Central Sulcus */}
        <mesh position={[0, -0.01 * (isUpper ? -1 : 1), 0]}>
          <boxGeometry args={[0.16, 0.03, 0.06]} />
          {hasPathology ? lesionMaterial : enamelMaterial}
        </mesh>
      </group>

      {/* Single Tapered Root inside Alveolar Bone */}
      <mesh position={[0, 0.28 * rootDir, 0]} rotation={[0.03 * rootDir, 0, -0.04 * rootDir]}>
        <cylinderGeometry args={[0.085, 0.02, 0.44, 16]} />
        {rootMaterial}
      </mesh>
    </group>
  );
}

// 1C. Canine: Diamond spearhead crown with pointed cusp tip, labial ridge, robust root
function AnatomicalCanine({ isUpper = true, enamelMaterial, rootMaterial, lesionMaterial, hasPathology }) {
  const rootDir = isUpper ? 1 : -1;

  return (
    <group>
      {/* Crown Cervical Neck */}
      <mesh position={[0, 0.02 * (isUpper ? -1 : 1), 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.18, 24]} />
        {enamelMaterial}
      </mesh>
      {/* Pointed Spearhead Cusp Crown */}
      <mesh position={[0, 0.15 * (isUpper ? -1 : 1), 0]} scale={[0.50, 0.90, 0.50]}>
        <coneGeometry args={[0.26, 0.44, 24]} />
        {hasPathology ? lesionMaterial : enamelMaterial}
      </mesh>
      {/* Lingual Cingulum */}
      <mesh position={[0, 0.02 * (isUpper ? -1 : 1), 0.07]} scale={[0.65, 0.5, 0.65]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        {enamelMaterial}
      </mesh>
      {/* Tapered Root inside Bone */}
      <mesh position={[0, 0.32 * rootDir, 0]} rotation={[0.03 * rootDir, 0, -0.03 * rootDir]}>
        <cylinderGeometry args={[0.10, 0.025, 0.50, 16]} />
        {rootMaterial}
      </mesh>
    </group>
  );
}

// 1D. Incisor: Chisel-shaped incisal edge, curved labial face, cingulum, tapered root
function AnatomicalIncisor({ isUpper = true, isCentral = true, enamelMaterial, rootMaterial, lesionMaterial, hasPathology }) {
  const rootDir = isUpper ? 1 : -1;
  const width = isCentral ? 0.44 : 0.36;

  return (
    <group>
      {/* Chisel Incisal Crown Body */}
      <mesh position={[0, 0.08 * (isUpper ? -1 : 1), 0]} scale={[1.25, 1, 0.55]}>
        <cylinderGeometry args={[width * 0.42, width * 0.34, 0.32, 24]} />
        {hasPathology ? lesionMaterial : enamelMaterial}
      </mesh>
      {/* Rounded Incisal Edge */}
      <mesh position={[0, 0.22 * (isUpper ? -1 : 1), 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, width * 0.88, 16]} />
        {enamelMaterial}
      </mesh>
      {/* Lingual Cingulum */}
      <mesh position={[0, -0.02 * (isUpper ? -1 : 1), 0.05]} scale={[0.9, 0.5, 0.7]}>
        <sphereGeometry args={[0.10, 16, 16]} />
        {enamelMaterial}
      </mesh>
      {/* Conical Root inside Bone */}
      <mesh position={[0, 0.28 * rootDir, 0]}>
        <cylinderGeometry args={[0.08, 0.02, 0.44, 16]} />
        {rootMaterial}
      </mesh>
    </group>
  );
}

// ============================================================================
// 2. Dynamic 3D Tooth Component with Real Anatomy, Shader & Leader Callout
// ============================================================================
function DynamicEnamelTooth({
  toothNumber,
  shape = 'molar',
  position,
  rotation,
  hasPathology,
  pathologyColor = '#3B82F6',
  pathologyLabel = 'Cavity',
  isSelected,
  onClick,
  arch = 'upper'
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const isUpper = arch === 'upper';

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected || hovered) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4 + toothNumber) * 0.04;
      } else {
        meshRef.current.position.y = position[1];
      }
    }
  });

  // Natural Human Dental Enamel Material
  const enamelMaterial = useMemo(() => (
    <meshPhysicalMaterial
      color={hovered ? '#E0F2FE' : '#F8F9FA'}
      roughness={0.12}
      metalness={0.01}
      clearcoat={1.0}
      clearcoatRoughness={0.04}
      transmission={0.14}
      ior={1.62}
    />
  ), [hovered]);

  // Translucent Root Cementum Material
  const rootMaterial = useMemo(() => (
    <meshPhysicalMaterial
      color="#E6DEC8"
      roughness={0.38}
      metalness={0.02}
      opacity={0.88}
      transparent={true}
    />
  ), []);

  // Glowing Lesion Material for Cavities & Pathologies
  const lesionMaterial = useMemo(() => (
    <meshPhysicalMaterial
      color={pathologyColor}
      emissive={pathologyColor}
      emissiveIntensity={0.85}
      roughness={0.20}
      clearcoat={1.0}
    />
  ), [pathologyColor]);

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
      {shape === 'molar' && (
        <AnatomicalMolar
          isUpper={isUpper}
          enamelMaterial={enamelMaterial}
          rootMaterial={rootMaterial}
          lesionMaterial={lesionMaterial}
          hasPathology={hasPathology}
        />
      )}

      {shape === 'premolar' && (
        <AnatomicalPremolar
          isUpper={isUpper}
          enamelMaterial={enamelMaterial}
          rootMaterial={rootMaterial}
          lesionMaterial={lesionMaterial}
          hasPathology={hasPathology}
        />
      )}

      {shape === 'canine' && (
        <AnatomicalCanine
          isUpper={isUpper}
          enamelMaterial={enamelMaterial}
          rootMaterial={rootMaterial}
          lesionMaterial={lesionMaterial}
          hasPathology={hasPathology}
        />
      )}

      {shape === 'incisor' && (
        <AnatomicalIncisor
          isUpper={isUpper}
          isCentral={toothNumber === 8 || toothNumber === 9 || toothNumber === 24 || toothNumber === 25}
          enamelMaterial={enamelMaterial}
          rootMaterial={rootMaterial}
          lesionMaterial={lesionMaterial}
          hasPathology={hasPathology}
        />
      )}

      {/* 3D Floating Speech Bubble with Leader Line for Active / Pathological Tooth */}
      {hasPathology && isSelected && (
        <Html
          position={[0, isUpper ? 0.95 : -0.95, 0]}
          center
          distanceFactor={16}
          zIndexRange={[100, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick();
            }}
            className="flex flex-col items-center cursor-pointer pointer-events-auto transition-transform hover:scale-105"
            style={{ minWidth: '120px' }}
          >
            {!isUpper && (
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white drop-shadow-xs" />
            )}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-2xl shadow-xl backdrop-blur-md bg-white border border-blue-500 ring-2 ring-blue-400/30"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: pathologyColor }}
              >
                {toothNumber}
              </span>
              <span
                className="text-[11.5px] font-black whitespace-nowrap tracking-tight"
                style={{ color: pathologyColor }}
              >
                {pathologyLabel}
              </span>
            </div>
            {isUpper && (
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-xs" />
            )}
            <div
              className="w-[2px] transition-colors"
              style={{
                height: '14px',
                backgroundColor: pathologyColor
              }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: pathologyColor }}
            />
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 3. Anatomical Transparent Jawbone Volumes (Glassmorphic Medical Bone)
// ============================================================================
function ProceduralTransparentJaw({ arch = 'mandible' }) {
  const isUpper = arch === 'maxilla';

  const transparentGlassBone = useMemo(() => (
    <meshPhysicalMaterial
      color="#EEF6FC"
      transmission={0.96}
      opacity={0.32}
      roughness={0.12}
      metalness={0.02}
      clearcoat={1.0}
      clearcoatRoughness={0.04}
      ior={1.48}
      transparent={true}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  ), []);

  // Alveolar Ridge Arc that follows the horizontal dental curve (XZ plane)
  const alveolarCurve = useMemo(() => {
    const points = [];
    const count = 16;
    const rX = isUpper ? 3.12 : 2.96;
    const rZ = isUpper ? 2.86 : 2.72;
    const zOffset = 1.25;
    const yLevel = isUpper ? 0.28 : -0.28;

    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * (isUpper ? 0.86 : 0.83) - Math.PI * (isUpper ? 0.43 : 0.415);
      const x = Math.sin(angle) * rX;
      const z = -Math.cos(angle) * rZ + zOffset;
      points.push(new THREE.Vector3(x, yLevel, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [isUpper]);

  if (isUpper) {
    // Maxilla: Upper Dental Arch Alveolar Process
    return (
      <group position={[0, 0, 0]}>
        {/* Alveolar Ridge Housing Upper Teeth Roots */}
        <mesh>
          <tubeGeometry args={[alveolarCurve, 48, 0.38, 16, false]} />
          {transparentGlassBone}
        </mesh>
        {/* Anterior Nasal Spine & Premaxilla */}
        <mesh position={[0, 0.40, -1.65]} scale={[0.75, 0.35, 0.50]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          {transparentGlassBone}
        </mesh>
      </group>
    );
  }

  // Mandible: Lower Dental Arch Alveolar Ridge + Chin + Bilateral Ascending Rami
  return (
    <group position={[0, 0, 0]}>
      {/* Alveolar Ridge Housing Lower Teeth Roots */}
      <mesh>
        <tubeGeometry args={[alveolarCurve, 48, 0.35, 16, false]} />
        {transparentGlassBone}
      </mesh>
      {/* Mental Protuberance (Chin) */}
      <mesh position={[0, -0.45, -1.55]} scale={[1.2, 0.55, 0.70]}>
        <sphereGeometry args={[0.38, 20, 16]} />
        {transparentGlassBone}
      </mesh>
      {/* Left Ascending Ramus & Condyle */}
      <group position={[-2.95, 0.25, 0.70]}>
        <mesh rotation={[0.20, 0.15, -0.05]} scale={[0.22, 1.15, 0.65]}>
          <boxGeometry args={[1, 1, 1]} />
          {transparentGlassBone}
        </mesh>
        <mesh position={[-0.05, 0.65, -0.15]} scale={[0.24, 0.18, 0.28]}>
          <sphereGeometry args={[0.45, 16, 16]} />
          {transparentGlassBone}
        </mesh>
      </group>
      {/* Right Ascending Ramus & Condyle */}
      <group position={[2.95, 0.25, 0.70]}>
        <mesh rotation={[0.20, -0.15, 0.05]} scale={[0.22, 1.15, 0.65]}>
          <boxGeometry args={[1, 1, 1]} />
          {transparentGlassBone}
        </mesh>
        <mesh position={[0.05, 0.65, -0.15]} scale={[0.24, 0.18, 0.28]}>
          <sphereGeometry args={[0.45, 16, 16]} />
          {transparentGlassBone}
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 4. Full 32 Teeth Dual Arch Model
// ============================================================================
function DualArchDentalModel({ teethState = [], activeTooth, onSelectTooth, findingsMap = {} }) {
  const teethMap = useMemo(() => {
    const map = {};
    if (Array.isArray(teethState)) {
      teethState.forEach((t) => {
        const num = parseInt(t.toothNumber || t.ToothNumber, 10);
        if (num) map[num] = t;
      });
    }
    return map;
  }, [teethState]);

  // 16 Upper Teeth along anatomical curve
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
        position: [x, 0.18, z],
        rotation: [0, rotY, 0]
      });
    }
    return list;
  }, []);

  // 16 Lower Teeth along anatomical curve
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
        position: [x, -0.18, z],
        rotation: [0, rotY, 0]
      });
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <ProceduralTransparentJaw arch="maxilla" />
      <ProceduralTransparentJaw arch="mandible" />

      {/* 16 Upper Teeth with Real Anatomy */}
      {upperTeeth.map((tooth) => {
        const dbTooth = teethMap[tooth.toothNumber];
        const finding = findingsMap[tooth.toothNumber];
        const status = (dbTooth?.status || dbTooth?.ConditionStatus || '').toLowerCase();
        const hasPathology = Boolean(finding) || (status !== '' && status !== 'healthy' && status !== 'sound');
        const color = finding?.ringColor || dbTooth?.color || dbTooth?.ConditionColor || (hasPathology ? '#EF4444' : '#10B981');
        const isSelected = String(activeTooth) === String(tooth.toothNumber);

        return (
          <DynamicEnamelTooth
            key={tooth.id}
            {...tooth}
            arch="upper"
            hasPathology={hasPathology}
            pathologyColor={color}
            pathologyLabel={finding?.label || 'Pathology'}
            isSelected={isSelected}
            onClick={() => onSelectTooth && onSelectTooth(String(tooth.toothNumber))}
          />
        );
      })}

      {/* 16 Lower Teeth with Real Anatomy */}
      {lowerTeeth.map((tooth) => {
        const dbTooth = teethMap[tooth.toothNumber];
        const finding = findingsMap[tooth.toothNumber];
        const status = (dbTooth?.status || dbTooth?.ConditionStatus || '').toLowerCase();
        const hasPathology = Boolean(finding) || (status !== '' && status !== 'healthy' && status !== 'sound');
        const color = finding?.ringColor || dbTooth?.color || dbTooth?.ConditionColor || (hasPathology ? '#EF4444' : '#10B981');
        const isSelected = String(activeTooth) === String(tooth.toothNumber);

        return (
          <DynamicEnamelTooth
            key={tooth.id}
            {...tooth}
            arch="lower"
            hasPathology={hasPathology}
            pathologyColor={color}
            pathologyLabel={finding?.label || 'Pathology'}
            isSelected={isSelected}
            onClick={() => onSelectTooth && onSelectTooth(String(tooth.toothNumber))}
          />
        );
      })}
    </group>
  );
}

// ============================================================================
// 5. Smooth Camera Section Controller
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
// 6. Main Component: ThreeRadiologyJawViewer
// ============================================================================
export default function ThreeRadiologyJawViewer({
  viewMode = '2d',
  isInverted = false,
  contrastValue = 100,
  brightnessValue = 100,
  isFlipped = false,
  activeTooth = '14',
  onSelectTooth,
  findings = [],
  rawTeeth = []
}) {
  const controlsRef = useRef();
  const [selectedSection, setSelectedSection] = useState('left');
  const [selectedTab, setSelectedTab] = useState('AI analyze');
  const [isZoomed, setIsZoomed] = useState(false);
  const [localViewMode, setLocalViewMode] = useState(viewMode || '2d');

  // Synchronize with external viewMode prop
  useEffect(() => {
    if (viewMode) {
      setLocalViewMode(viewMode);
    }
  }, [viewMode]);

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
        {/* Layer 1: Content (2D Transparent Jaw Scan or 3D WebGL Mesh) */}
        <div className="w-full h-full relative" style={filterStyle}>
          {localViewMode === '2d' ? (
            /* 2D Mode: Crystal Clear Transparent Edentulous Jaw Radiograph with aspect-ratio locked alignment */
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
          ) : (
            /* 3D Mode: Interactive Three.js WebGL Canvas with Real Anatomical Teeth inside Transparent Jaw */
            <Canvas
              camera={{ position: [-5.4, 0.35, 2.6], fov: 44 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <ambientLight intensity={1.6} />
              <directionalLight position={[6, 8, 5]} intensity={2.0} />
              <directionalLight position={[-6, 4, 3]} intensity={1.2} />
              <pointLight position={[0, -2, 2]} intensity={0.8} color="#B0CDFF" />
              <pointLight position={[0, 3, -1]} intensity={0.6} color="#FFFFFF" />

              {/* Procedural Glassmorphic Jawbone + 32 Realistic Anatomical Teeth */}
              <DualArchDentalModel
                teethState={rawTeeth}
                activeTooth={activeTooth}
                onSelectTooth={onSelectTooth}
                findingsMap={findingsMap}
              />

              {/* Smooth Camera Director for Section Switching */}
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
          )}
        </div>

        {/* View Controls & Section Tabs (Top Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-white/95 backdrop-blur-md p-0.5 rounded-xl border border-slate-200/80 shadow-md">
            <button
              type="button"
              onClick={() => setLocalViewMode('2d')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                localViewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              2D X-Ray HD
            </button>
            <button
              type="button"
              onClick={() => setLocalViewMode('3d')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                localViewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              3D Interactive Jaw
            </button>
          </div>

          {/* Section Quick Switcher Tabs */}
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
            {localViewMode === '3d' ? 'Three.js 3D Interactive Model' : 'HD Transparent Jaw Radiograph'} • {selectedSection.toUpperCase()}
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

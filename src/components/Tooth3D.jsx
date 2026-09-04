import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';

// Procedural 3D tooth geometry builder that looks organic and realistic
const ToothModel = ({ type, color, opacity = 1, transparent = false }) => {
  const materialProps = {
    color,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    opacity,
    transparent
  };

  const rootMaterialProps = {
    color: '#d6dee2',
    roughness: 0.45,
    metalness: 0.01,
    opacity: opacity * 0.95,
    transparent
  };

  if (type === 'molar') {
    return (
      <group>
        {/* Crown - smooth rounded box */}
        <RoundedBox args={[0.66, 0.44, 0.66]} radius={0.12} smoothness={8} position={[0, 0.15, 0]}>
          <meshPhysicalMaterial {...materialProps} />
        </RoundedBox>
        {/* 4 Occlusal Cusps */}
        <mesh position={[-0.18, 0.36, -0.18]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.18, 0.36, -0.18]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[-0.18, 0.36, 0.18]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.18, 0.36, 0.18]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        {/* Seamless Bifurcated Roots */}
        <mesh position={[-0.15, -0.22, 0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.12, 0.03, 0.5, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
        <mesh position={[0.15, -0.22, 0]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.12, 0.03, 0.5, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
      </group>
    );
  }

  if (type === 'premolar') {
    return (
      <group>
        {/* Crown - smooth rounded box */}
        <RoundedBox args={[0.54, 0.44, 0.54]} radius={0.1} smoothness={8} position={[0, 0.14, 0]}>
          <meshPhysicalMaterial {...materialProps} />
        </RoundedBox>
        {/* 2 Occlusal Cusps */}
        <mesh position={[-0.13, 0.34, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.13, 0.34, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        {/* Single Tapering Root */}
        <mesh position={[0, -0.22, 0]} rotation={[0.08, 0, -0.05]}>
          <cylinderGeometry args={[0.11, 0.03, 0.5, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
      </group>
    );
  }

  if (type === 'canine') {
    return (
      <group>
        {/* Crown - pointed bullet shape using a stretched sphere */}
        <mesh position={[0, 0.15, 0]} scale={[0.56, 0.88, 0.56]}>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        {/* Cusp tip */}
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        {/* Long single thick root */}
        <mesh position={[0, -0.28, 0]} rotation={[0.05, 0, -0.05]}>
          <cylinderGeometry args={[0.12, 0.03, 0.65, 16]} />
          <meshPhysicalMaterial {...rootMaterialProps} />
        </mesh>
      </group>
    );
  }

  // Incisor
  return (
    <group>
      {/* Crown - thin flat rounded box */}
      <RoundedBox args={[0.54, 0.44, 0.24]} radius={0.06} smoothness={8} position={[0, 0.14, 0]}>
        <meshPhysicalMaterial {...materialProps} />
      </RoundedBox>
      {/* Single straight root */}
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.1, 0.025, 0.55, 16]} />
        <meshPhysicalMaterial {...rootMaterialProps} />
      </mesh>
    </group>
  );
};

export default function Tooth3D({ position, rotation, status, onClick, animated = false, id }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (animated && groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + id) * 0.08;
    }
  });

  const getStatusColor = () => {
    switch (status) {
      case 'Healthy': return '#f6f8fa'; // Porcelain white
      case 'Damaged / Decay': case 'Damaged/Decay': return '#ef4444';
      case 'Root Canal Needed': return '#f59e0b';
      case 'Cleaning Needed': return '#3b82f6';
      case 'Already Treated': return '#a855f7';
      case 'Missing / Extracted': case 'Missing': return '#94a3b8';
      default: return '#f6f8fa';
    }
  };

  const getToothType = (toothId) => {
    if (!toothId) return 'molar';
    const num = parseInt(toothId);
    if ([7, 8, 9, 10, 23, 24, 25, 26].includes(num)) return 'incisor';
    if ([6, 11, 22, 27].includes(num)) return 'canine';
    if ([4, 5, 12, 13, 20, 21, 28, 29].includes(num)) return 'premolar';
    return 'molar';
  };

  const isMissing = status === 'Missing / Extracted' || status === 'Missing';
  const color = getStatusColor();
  const type = getToothType(id);

  if (isMissing) {
    return (
      <group position={position} rotation={rotation} onClick={onClick}>
        <ToothModel type={type} color={color} opacity={0.35} transparent={true} />
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation} onClick={onClick}>
      <ToothModel type={type} color={color} />
    </group>
  );
}

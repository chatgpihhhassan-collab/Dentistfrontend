import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeDoctorHead: Ultra-Friendly Cute Healthcare AI Robot
 * Faithfully matches the user's reference sample:
 * - Rounded mint/porcelain friendly medical robot
 * - Curved dark visor with expressive glowing cyan LED eyes & smile
 * - Medical cross on chest
 * - Floating 3D speech bubbles (Left: Heartbeat pulse, Right: Chat bubble with 3 dots)
 * - Gentle floating hover animation, head tracking, and real-time voice reactivity
 */
export default function ThreeDoctorHead({
  isSpeaking = false,
  isListening = false,
  mood = 'neutral',
  className = 'w-full h-full'
}) {
  const mountRef = useRef(null);
  const propsRef = useRef({ isSpeaking, isListening, mood });
  propsRef.current = { isSpeaking, isListening, mood };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 230;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 3.8);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Soft Studio & Pastel Healthcare Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2.5, 4.0, 3.5);
    scene.add(keyLight);

    const softTealLight = new THREE.DirectionalLight(0x99f6e4, 1.6);
    softTealLight.position.set(-3.0, 2.0, 1.5);
    scene.add(softTealLight);

    const bottomFillLight = new THREE.DirectionalLight(0xccfbf1, 0.8);
    bottomFillLight.position.set(0, -2.5, 2.0);
    scene.add(bottomFillLight);

    // Robot Root Group
    const robotRoot = new THREE.Group();
    scene.add(robotRoot);

    // 4. Materials (Porcelain Mint, Clean White, Emerald & Glowing Cyan)
    const mintBodyMat = new THREE.MeshStandardMaterial({
      color: 0xa7f3d0, // Soft pastel mint
      roughness: 0.28,
      metalness: 0.05
    });

    const whiteShellMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.02
    });

    const deepTealMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488, // Clinic teal
      roughness: 0.3,
      metalness: 0.1
    });

    const darkVisorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8
    });

    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });

    const redGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });

    // 5. Build Cute Healthcare Robot Body
    const bodyGroup = new THREE.Group();
    robotRoot.add(bodyGroup);

    // Torso (Egg-shaped soft mint body)
    const torsoGeo = new THREE.SphereGeometry(0.55, 36, 36);
    torsoGeo.scale(1.0, 1.15, 0.85);
    const torsoMesh = new THREE.Mesh(torsoGeo, mintBodyMat);
    torsoMesh.position.set(0, -0.75, 0);
    bodyGroup.add(torsoMesh);

    // White belly shield plate
    const bellyGeo = new THREE.SphereGeometry(0.44, 32, 32);
    bellyGeo.scale(0.9, 0.95, 0.5);
    const bellyMesh = new THREE.Mesh(bellyGeo, whiteShellMat);
    bellyMesh.position.set(0, -0.72, 0.28);
    bodyGroup.add(bellyMesh);

    // Deep Teal Medical Cross on Belly
    const crossGroup = new THREE.Group();
    crossGroup.position.set(0, -0.72, 0.52);
    bodyGroup.add(crossGroup);

    const crossHGeo = new THREE.BoxGeometry(0.2, 0.07, 0.02);
    const crossVGeo = new THREE.BoxGeometry(0.07, 0.2, 0.02);
    const crossH = new THREE.Mesh(crossHGeo, deepTealMat);
    const crossV = new THREE.Mesh(crossVGeo, deepTealMat);
    crossGroup.add(crossH);
    crossGroup.add(crossV);

    // Arms
    // Left Arm (Friendly, relaxed)
    const leftArmGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.45, 20);
    const leftArm = new THREE.Mesh(leftArmGeo, mintBodyMat);
    leftArm.position.set(-0.62, -0.7, 0.05);
    leftArm.rotation.z = 0.55;
    bodyGroup.add(leftArm);

    const leftHandGeo = new THREE.SphereGeometry(0.1, 20, 20);
    const leftHand = new THREE.Mesh(leftHandGeo, mintBodyMat);
    leftHand.position.set(-0.76, -0.92, 0.08);
    bodyGroup.add(leftHand);

    // Right Arm (Gesturing up towards chat bubble as in sample image!)
    const rightArmGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.45, 20);
    const rightArm = new THREE.Mesh(rightArmGeo, mintBodyMat);
    rightArm.position.set(0.62, -0.58, 0.05);
    rightArm.rotation.z = -1.15;
    bodyGroup.add(rightArm);

    const rightHandGeo = new THREE.SphereGeometry(0.1, 20, 20);
    const rightHand = new THREE.Mesh(rightHandGeo, mintBodyMat);
    rightHand.position.set(0.85, -0.42, 0.08);
    bodyGroup.add(rightHand);

    // Head Pivot Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.22, 0);
    bodyGroup.add(headGroup);

    // Neck ring
    const neckGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.18, 24);
    const neckMesh = new THREE.Mesh(neckGeo, deepTealMat);
    neckMesh.position.set(0, -0.22, 0);
    headGroup.add(neckMesh);

    // Cute Rounded Robot Head
    const skullGeo = new THREE.SphereGeometry(0.64, 40, 40);
    skullGeo.scale(1.22, 0.95, 0.9);
    const skullMesh = new THREE.Mesh(skullGeo, mintBodyMat);
    headGroup.add(skullMesh);

    // Ears / Side Knobs
    const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 24);
    const leftEar = new THREE.Mesh(earGeo, deepTealMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.8, 0.02, 0);
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.8, 0.02, 0);
    headGroup.add(rightEar);

    // Top Cute Antenna
    const antennaStemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.2, 16);
    const antennaStem = new THREE.Mesh(antennaStemGeo, deepTealMat);
    antennaStem.position.set(0, 0.62, 0);
    headGroup.add(antennaStem);

    const antennaTipGeo = new THREE.SphereGeometry(0.07, 20, 20);
    const antennaTip = new THREE.Mesh(antennaTipGeo, cyanGlowMat);
    antennaTip.position.set(0, 0.74, 0);
    headGroup.add(antennaTip);

    // Curved Dark Visor Screen
    const visorGeo = new THREE.SphereGeometry(0.58, 32, 24, 0, Math.PI, 0, Math.PI * 0.45);
    visorGeo.scale(1.08, 0.65, 0.75);
    const visorMesh = new THREE.Mesh(visorGeo, darkVisorMat);
    visorMesh.rotation.x = 1.38;
    visorMesh.position.set(0, 0.02, 0.28);
    headGroup.add(visorMesh);

    // Visor Expressive Glowing LED Eyes (Cute oval capsules)
    const eyeGeo = new THREE.CapsuleGeometry(0.08, 0.09, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, cyanGlowMat);
    leftEye.position.set(-0.25, 0.05, 0.65);
    leftEye.scale.set(1.1, 0.9, 0.3);
    headGroup.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.set(0.25, 0.05, 0.65);
    headGroup.add(rightEye);

    // Cute LED Smile / Mouth Wave inside Visor
    const mouthGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16);
    const mouthMesh = new THREE.Mesh(mouthGeo, cyanGlowMat);
    mouthMesh.rotation.z = Math.PI / 2;
    mouthMesh.position.set(0, -0.14, 0.66);
    headGroup.add(mouthMesh);

    // 6. Floating 3D Speech Bubbles (Exact Match to Sample Image!)
    // Left Bubble: White thought bubble with Heartbeat
    const leftBubbleGroup = new THREE.Group();
    leftBubbleGroup.position.set(-1.15, 0.38, 0.2);
    robotRoot.add(leftBubbleGroup);

    const bubbleBodyGeo = new THREE.SphereGeometry(0.35, 24, 24);
    bubbleBodyGeo.scale(1.15, 0.95, 0.6);
    const leftBubbleMesh = new THREE.Mesh(bubbleBodyGeo, whiteShellMat);
    leftBubbleGroup.add(leftBubbleMesh);

    // Green Heart inside left bubble
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.08, -0.1, 0.12, -0.1, 0.04);
    heartShape.bezierCurveTo(-0.1, -0.04, 0, -0.1, 0, -0.14);
    heartShape.bezierCurveTo(0, -0.1, 0.1, -0.04, 0.1, 0.04);
    heartShape.bezierCurveTo(0.1, 0.12, 0, 0.08, 0, 0);
    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const heartMesh = new THREE.Mesh(heartGeo, deepTealMat);
    heartMesh.scale.set(1.4, 1.4, 1.4);
    heartMesh.position.set(0, 0.06, 0.22);
    leftBubbleGroup.add(heartMesh);

    // Right Bubble: Teal thought bubble with 3 white chat dots
    const rightBubbleGroup = new THREE.Group();
    rightBubbleGroup.position.set(1.12, 0.85, 0.2);
    robotRoot.add(rightBubbleGroup);

    const rightBubbleMesh = new THREE.Mesh(bubbleBodyGeo, deepTealMat);
    rightBubbleGroup.add(rightBubbleMesh);

    // 3 White Chat Dots
    const dotGeo = new THREE.SphereGeometry(0.04, 16, 16);
    for (let i = -1; i <= 1; i++) {
      const dot = new THREE.Mesh(dotGeo, whiteShellMat);
      dot.position.set(i * 0.11, 0, 0.22);
      rightBubbleGroup.add(dot);
    }

    // 7. Mouse Tracking Setup
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-0.35, Math.min(0.35, x * 0.35));
      mouse.targetY = Math.max(-0.2, Math.min(0.2, y * 0.2));
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Smooth Animation Loop
    let animationFrameId;
    const startTime = performance.now();
    let nextBlinkTime = 2.5;
    let isBlinking = false;
    let blinkProgress = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const { isSpeaking, isListening } = propsRef.current;

      // Mouse tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Gentle floating hover animation (matching sample illustration)
      const hoverFloat = Math.sin(elapsedTime * 2.2) * 0.04;
      bodyGroup.position.y = hoverFloat;

      // Floating Bubbles gentle independent oscillation
      leftBubbleGroup.position.y = 0.38 + Math.sin(elapsedTime * 2.5 + 1.0) * 0.05;
      rightBubbleGroup.position.y = 0.85 + Math.sin(elapsedTime * 2.0 + 2.0) * 0.05;

      // Head & Eye Tracking
      headGroup.rotation.y = mouse.x + Math.sin(elapsedTime * 0.9) * 0.03;
      headGroup.rotation.x = -mouse.y + Math.cos(elapsedTime * 1.1) * 0.02;
      headGroup.rotation.z = -mouse.x * 0.15;

      // Antenna Tip Glow Pulse
      antennaTip.material.emissiveIntensity = 1.2 + Math.sin(elapsedTime * 4.0) * 0.6;

      // Natural Eye Blinking Logic
      if (elapsedTime > nextBlinkTime) {
        isBlinking = true;
        blinkProgress = 0;
        nextBlinkTime = elapsedTime + 3.0 + Math.random() * 3.0;
      }

      if (isBlinking) {
        blinkProgress += 0.18;
        const blinkScaleY = Math.max(0.08, 1.0 - Math.sin(blinkProgress * Math.PI));
        leftEye.scale.y = blinkScaleY * 0.9;
        rightEye.scale.y = blinkScaleY * 0.9;
        if (blinkProgress >= 1.0) {
          isBlinking = false;
          leftEye.scale.y = 0.9;
          rightEye.scale.y = 0.9;
        }
      }

      // Voice Activity Reactivity (Talking & Listening)
      if (isSpeaking) {
        // Mouth opens and smiles with voice wave
        const mouthWave = Math.abs(Math.sin(elapsedTime * 14)) * 0.12 + 0.04;
        mouthMesh.scale.x = 1.0 + mouthWave * 2.0;
        mouthMesh.scale.y = 1.0 + mouthWave * 4.0;
        cyanGlowMat.emissiveIntensity = 2.0;
      } else if (isListening) {
        // Attentive wide eyes & red/rose alert pulse
        leftEye.scale.y = 1.2;
        rightEye.scale.y = 1.2;
        antennaTip.material = redGlowMat;
        mouthMesh.scale.set(1.0, 1.0, 1.0);
      } else {
        // Normal state
        antennaTip.material = cyanGlowMat;
        mouthMesh.scale.set(1.0, 1.0, 1.0);
        cyanGlowMat.emissiveIntensity = 1.4;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      try {
        renderer.forceContextLoss();
      } catch {}
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}

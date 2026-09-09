import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeDoctorHead: Real-Time 3D Interactive Doctor Avatar with Lip-Sync, Eye Blinks & Head Tracking
 * Built purely in Three.js without external heavy assets for 100% reliability and instant loading.
 */
export default function ThreeDoctorHead({
  isSpeaking = false,
  isListening = false,
  mood = 'neutral', // 'neutral' | 'alert' | 'success'
  className = 'w-full h-full'
}) {
  const mountRef = useRef(null);
  const propsRef = useRef({ isSpeaking, isListening, mood });
  propsRef.current = { isSpeaking, isListening, mood };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup (Clinical Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 1.4); // Clinical teal rim light
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8); // Soft cyan fill
    fillLight.position.set(0, -2, 2);
    scene.add(fillLight);

    // 4. Character Root Group
    const doctorGroup = new THREE.Group();
    scene.add(doctorGroup);

    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5cfb3,
      roughness: 0.55,
      metalness: 0.05
    });

    const scrubsMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f766e, // Deep clinical teal
      roughness: 0.7,
      metalness: 0.1
    });

    const whiteCoatMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2
    });

    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1
    });

    const irisMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Professional deep blue iris
      roughness: 0.2
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const teethMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1
    });

    // 5. Build Doctor Avatar Geometry
    // Neck & Torso (Lab Coat / Scrubs)
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.85, 1.2, 32);
    const torsoMesh = new THREE.Mesh(torsoGeo, scrubsMaterial);
    torsoMesh.position.set(0, -1.05, 0);
    doctorGroup.add(torsoMesh);

    const labCoatCollarGeo = new THREE.TorusGeometry(0.58, 0.08, 16, 32, Math.PI);
    const labCoatCollar = new THREE.Mesh(labCoatCollarGeo, whiteCoatMaterial);
    labCoatCollar.rotation.x = Math.PI / 2;
    labCoatCollar.position.set(0, -0.65, 0.1);
    doctorGroup.add(labCoatCollar);

    // Stethoscope around neck
    const stethGeo = new THREE.TorusGeometry(0.52, 0.035, 16, 32, Math.PI * 1.2);
    const stethMesh = new THREE.Mesh(stethGeo, metalMaterial);
    stethMesh.rotation.x = 1.35;
    stethMesh.rotation.z = -0.3;
    stethMesh.position.set(0, -0.6, 0.15);
    doctorGroup.add(stethMesh);

    const stethBellGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 24);
    const stethBellMesh = new THREE.Mesh(stethBellGeo, metalMaterial);
    stethBellMesh.rotation.x = Math.PI / 2;
    stethBellMesh.position.set(0.12, -0.92, 0.45);
    doctorGroup.add(stethBellMesh);

    // Head Pivot Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.1, 0);
    doctorGroup.add(headGroup);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.45, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -0.3, 0);
    headGroup.add(neckMesh);

    // Head / Skull Base
    const skullGeo = new THREE.SphereGeometry(0.58, 32, 32);
    skullGeo.scale(1.0, 1.15, 1.05);
    const skullMesh = new THREE.Mesh(skullGeo, skinMaterial);
    headGroup.add(skullMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.12, 16, 16);
    earGeo.scale(0.5, 1.0, 0.6);
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-0.6, 0.02, 0);
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.6, 0.02, 0);
    headGroup.add(rightEar);

    // Surgical Scrub Cap
    const capGeo = new THREE.SphereGeometry(0.62, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const capMesh = new THREE.Mesh(capGeo, scrubsMaterial);
    capMesh.position.set(0, 0.18, -0.02);
    headGroup.add(capMesh);

    // Medical Cross Badge on Cap
    const badgeBgGeo = new THREE.CircleGeometry(0.12, 24);
    const badgeBgMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const badgeBg = new THREE.Mesh(badgeBgGeo, badgeBgMat);
    badgeBg.position.set(0, 0.48, 0.58);
    headGroup.add(badgeBg);

    const crossHGeo = new THREE.PlaneGeometry(0.14, 0.04);
    const crossVGeo = new THREE.PlaneGeometry(0.04, 0.14);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red Cross
    const crossH = new THREE.Mesh(crossHGeo, crossMat);
    crossH.position.set(0, 0.48, 0.585);
    headGroup.add(crossH);
    const crossV = new THREE.Mesh(crossVGeo, crossMat);
    crossV.position.set(0, 0.48, 0.585);
    headGroup.add(crossV);

    // Clinical Headlamp / Loupes Visor
    const headbandGeo = new THREE.TorusGeometry(0.61, 0.03, 16, 32, Math.PI);
    const headband = new THREE.Mesh(headbandGeo, metalMaterial);
    headband.rotation.x = Math.PI / 2;
    headband.position.set(0, 0.32, 0.05);
    headGroup.add(headband);

    const lampGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.12, 24);
    const lampMesh = new THREE.Mesh(lampGeo, metalMaterial);
    lampMesh.rotation.x = Math.PI / 2;
    lampMesh.position.set(0, 0.34, 0.65);
    headGroup.add(lampMesh);

    const lampLensGeo = new THREE.CircleGeometry(0.065, 24);
    const lampLensMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8
    });
    const lampLens = new THREE.Mesh(lampLensGeo, lampLensMat);
    lampLens.position.set(0, 0.34, 0.715);
    headGroup.add(lampLens);

    // Eyes Setup
    const createEye = (isLeft) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(isLeft ? -0.22 : 0.22, 0.08, 0.48);

      // White Sclera
      const scleraGeo = new THREE.SphereGeometry(0.11, 24, 24);
      const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMaterial);
      eyeGroup.add(sclera);

      // Iris
      const irisGeo = new THREE.SphereGeometry(0.065, 20, 20);
      const iris = new THREE.Mesh(irisGeo, irisMaterial);
      iris.position.set(0, 0, 0.06);
      eyeGroup.add(iris);

      // Pupil
      const pupilGeo = new THREE.SphereGeometry(0.035, 16, 16);
      const pupil = new THREE.Mesh(pupilGeo, pupilMaterial);
      pupil.position.set(0, 0, 0.09);
      eyeGroup.add(pupil);

      // Eyelid for Blinking Animation
      const eyelidGeo = new THREE.SphereGeometry(0.116, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const eyelid = new THREE.Mesh(eyelidGeo, skinMaterial);
      eyelid.rotation.x = Math.PI * 0.1;
      eyelid.position.set(0, 0.02, 0);
      eyelid.scale.set(1, 0.01, 1); // Opened by default
      eyeGroup.add(eyelid);

      return { group: eyeGroup, eyelid };
    };

    const leftEye = createEye(true);
    const rightEye = createEye(false);
    headGroup.add(leftEye.group);
    headGroup.add(rightEye.group);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.18, 0.03, 0.04);
    const browMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.22, 0.23, 0.53);
    leftBrow.rotation.z = -0.05;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.22, 0.23, 0.53);
    rightBrow.rotation.z = 0.05;
    headGroup.add(rightBrow);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.07, 0.2, 16);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.rotation.x = 0.2;
    noseMesh.position.set(0, -0.04, 0.62);
    headGroup.add(noseMesh);

    // Upper Lip
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xd97768, roughness: 0.6 });
    const upperLipGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.22, 16);
    upperLipGeo.scale(1, 1, 0.4);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.rotation.z = Math.PI / 2;
    upperLip.position.set(0, -0.22, 0.55);
    headGroup.add(upperLip);

    // Lower Jaw Group (Animates for Lip-Sync)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.25, 0.45);
    headGroup.add(jawGroup);

    // Lower Lip
    const lowerLip = new THREE.Mesh(upperLipGeo, lipMat);
    lowerLip.rotation.z = Math.PI / 2;
    lowerLip.position.set(0, -0.04, 0.09);
    jawGroup.add(lowerLip);

    // Chin
    const chinGeo = new THREE.SphereGeometry(0.18, 20, 20);
    chinGeo.scale(1.0, 0.7, 1.0);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, -0.15, 0.05);
    jawGroup.add(chinMesh);

    // Inside Mouth Teeth (Upper & Lower Row)
    const teethGeo = new THREE.BoxGeometry(0.18, 0.04, 0.08);
    const upperTeeth = new THREE.Mesh(teethGeo, teethMaterial);
    upperTeeth.position.set(0, -0.24, 0.52);
    headGroup.add(upperTeeth);

    const lowerTeeth = new THREE.Mesh(teethGeo, teethMaterial);
    lowerTeeth.position.set(0, -0.02, 0.06);
    jawGroup.add(lowerTeeth);

    // Holographic Base Ring
    const holoRingGeo = new THREE.TorusGeometry(1.05, 0.02, 16, 64);
    const holoRingMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.6
    });
    const holoRing = new THREE.Mesh(holoRingGeo, holoRingMat);
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, -1.5, 0);
    scene.add(holoRing);

    // Mouse Tracking Setup
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-0.4, Math.min(0.4, x * 0.4));
      mouse.targetY = Math.max(-0.25, Math.min(0.25, y * 0.25));
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Animation Loop
    let animationFrameId;
    const startTime = performance.now();
    let nextBlinkTime = 2.0;
    let isBlinking = false;
    let blinkProgress = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const { isSpeaking, isListening, mood } = propsRef.current;

      // Smooth mouse tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Subtle Breathing Idle Movement
      const breath = Math.sin(elapsedTime * 2.2) * 0.02;
      torsoMesh.position.y = -1.05 + breath * 0.5;

      // Head Tilt & Looking Movement
      headGroup.rotation.y = mouse.x + Math.sin(elapsedTime * 0.8) * 0.04;
      headGroup.rotation.x = -mouse.y + Math.cos(elapsedTime * 1.1) * 0.03;
      headGroup.rotation.z = -mouse.x * 0.2;

      // Active Holographic Ring Spin
      holoRing.rotation.z += isListening ? 0.04 : 0.01;
      holoRingMat.color.setHex(isListening ? 0x10b981 : isSpeaking ? 0x38bdf8 : 0x2dd4bf);
      holoRingMat.opacity = isListening ? 0.9 : 0.45;

      // Dynamic Eye Blinking Logic
      if (elapsedTime > nextBlinkTime) {
        isBlinking = true;
        blinkProgress = 0;
        nextBlinkTime = elapsedTime + 3.0 + Math.random() * 3.5;
      }

      if (isBlinking) {
        blinkProgress += 0.16;
        const blinkScale = Math.sin(blinkProgress * Math.PI);
        if (blinkProgress >= 1.0) {
          isBlinking = false;
          leftEye.eyelid.scale.y = 0.01;
          rightEye.eyelid.scale.y = 0.01;
        } else {
          const scaleVal = Math.max(0.01, blinkScale * 1.0);
          leftEye.eyelid.scale.y = scaleVal;
          rightEye.eyelid.scale.y = scaleVal;
        }
      }

      // Dynamic Lip-Sync & Jaw Articulation
      if (isSpeaking) {
        // Natural varied speech cadence
        const speechWave = Math.abs(Math.sin(elapsedTime * 14)) * 0.6 +
                           Math.abs(Math.cos(elapsedTime * 9)) * 0.4;
        jawGroup.position.y = -0.25 - speechWave * 0.12;
        jawGroup.rotation.x = speechWave * 0.18;
        
        // Emphatic nod while speaking
        headGroup.position.y = 0.1 + Math.sin(elapsedTime * 8) * 0.015;
      } else {
        // Rest position
        jawGroup.position.y += (-0.25 - jawGroup.position.y) * 0.2;
        jawGroup.rotation.x += (0 - jawGroup.rotation.x) * 0.2;
        headGroup.position.y += (0.1 - headGroup.position.y) * 0.1;
      }

      // Listening Animation: Nods attentively
      if (isListening) {
        headGroup.position.z = 0.06;
        lampLensMat.emissiveIntensity = 1.6 + Math.sin(elapsedTime * 6) * 0.6;
      } else {
        headGroup.position.z = 0;
        lampLensMat.emissiveIntensity = 0.8;
      }

      // Mood Shifting
      if (mood === 'alert') {
        leftBrow.rotation.z = 0.15;
        rightBrow.rotation.z = -0.15;
      } else if (mood === 'success') {
        leftBrow.rotation.z = -0.08;
        rightBrow.rotation.z = 0.08;
      } else {
        leftBrow.rotation.z = -0.05;
        rightBrow.rotation.z = 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. Cleanup
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

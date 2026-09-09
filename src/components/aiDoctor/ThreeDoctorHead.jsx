import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeDoctorHead: Ultra-Premium Futuristic Medical AI Copilot Hologram
 * Replaces primitive shapes with a sleek, high-tech cyber-clinical medical specialist ("Dr. Sarah").
 * Features:
 * - Ceramic matte medical shell with soft subsurface lighting
 * - Curved tinted glass visor with animated audio-reactive LED waveforms
 * - Orbiting holographic diagnostic gyroscope rings and particle field
 * - Chrome stethoscope and glowing medical cross beacon
 * - Smooth hover-float breathing idle animation and voice reactivity
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

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 200;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 3.4);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Studio & Holographic Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2.5, 3.5, 3.0);
    scene.add(keyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x14b8a6, 2.5); // Clinical teal rim
    cyanRimLight.position.set(-3.0, 2.0, -2.0);
    scene.add(cyanRimLight);

    const blueFillLight = new THREE.DirectionalLight(0x38bdf8, 1.4); // High-tech blue fill
    blueFillLight.position.set(2.0, -2.0, 2.0);
    scene.add(blueFillLight);

    // Hologram Core Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 4. Materials (High-Tech Porcelain, Brushed Titanium & Emissive Glass)
    const ceramicShellMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1
    });

    const medicalTealMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e, // Deep clinic teal
      roughness: 0.35,
      metalness: 0.2
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.9
    });

    const visorGlassMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.05,
      metalness: 0.8
    });

    const glowCyanMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x2dd4bf,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    const glowRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });

    // 5. Build Futuristic Android Doctor Head & Bust
    const bustGroup = new THREE.Group();
    rootGroup.add(bustGroup);

    // Torso / Medical Scrubs Shoulders
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.92, 1.1, 32);
    torsoGeo.scale(1.1, 1.0, 0.7);
    const torsoMesh = new THREE.Mesh(torsoGeo, medicalTealMat);
    torsoMesh.position.set(0, -1.0, 0);
    bustGroup.add(torsoMesh);

    // Lab Coat Lapels (Porcelain white side panels)
    const lapelGeo = new THREE.BoxGeometry(0.28, 0.8, 0.08);
    const leftLapel = new THREE.Mesh(lapelGeo, ceramicShellMat);
    leftLapel.position.set(-0.42, -0.9, 0.32);
    leftLapel.rotation.y = 0.25;
    bustGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, ceramicShellMat);
    rightLapel.position.set(0.42, -0.9, 0.32);
    rightLapel.rotation.y = -0.25;
    bustGroup.add(rightLapel);

    // Titanium Stethoscope around neck
    const stethTorusGeo = new THREE.TorusGeometry(0.54, 0.035, 16, 48, Math.PI * 1.15);
    const stethTorus = new THREE.Mesh(stethTorusGeo, titaniumMat);
    stethTorus.rotation.x = 1.35;
    stethTorus.rotation.z = -0.25;
    stethTorus.position.set(0, -0.58, 0.18);
    bustGroup.add(stethTorus);

    const stethChestBellGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.04, 24);
    const stethBell = new THREE.Mesh(stethChestBellGeo, titaniumMat);
    stethBell.rotation.x = Math.PI / 2;
    stethBell.position.set(0.18, -0.95, 0.42);
    bustGroup.add(stethBell);

    const stethDiaphragmGeo = new THREE.CircleGeometry(0.08, 24);
    const stethDiaphragm = new THREE.Mesh(stethDiaphragmGeo, glowCyanMat);
    stethDiaphragm.position.set(0.18, -0.95, 0.445);
    bustGroup.add(stethDiaphragm);

    // Head Pivot Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.12, 0);
    bustGroup.add(headGroup);

    // Sleek Neck Pillar
    const neckGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.4, 32);
    const neckMesh = new THREE.Mesh(neckGeo, titaniumMat);
    neckMesh.position.set(0, -0.3, 0);
    headGroup.add(neckMesh);

    // Sleek White Ceramic Helmet / Skull
    const skullGeo = new THREE.SphereGeometry(0.62, 36, 36);
    skullGeo.scale(1.0, 1.14, 1.06);
    const skullMesh = new THREE.Mesh(skullGeo, ceramicShellMat);
    headGroup.add(skullMesh);

    // Medical Cap Upper Dome (Teal Accent Band)
    const capBandGeo = new THREE.TorusGeometry(0.63, 0.04, 16, 48);
    const capBand = new THREE.Mesh(capBandGeo, medicalTealMat);
    capBand.rotation.x = Math.PI / 2;
    capBand.position.set(0, 0.28, 0.02);
    headGroup.add(capBand);

    // Glowing Medical Cross Beacon
    const crossBaseGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24);
    const crossBase = new THREE.Mesh(crossBaseGeo, titaniumMat);
    crossBase.rotation.x = Math.PI / 2;
    crossBase.position.set(0, 0.52, 0.61);
    headGroup.add(crossBase);

    const crossHGeo = new THREE.PlaneGeometry(0.13, 0.04);
    const crossVGeo = new THREE.PlaneGeometry(0.04, 0.13);
    const crossH = new THREE.Mesh(crossHGeo, glowRedMat);
    crossH.position.set(0, 0.52, 0.635);
    headGroup.add(crossH);

    const crossV = new THREE.Mesh(crossVGeo, glowRedMat);
    crossV.position.set(0, 0.52, 0.635);
    headGroup.add(crossV);

    // Curved High-Tech Tinted Visor
    const visorGeo = new THREE.SphereGeometry(0.58, 32, 24, 0, Math.PI, 0, Math.PI * 0.45);
    visorGeo.scale(1.02, 0.65, 0.95);
    const visor = new THREE.Mesh(visorGeo, visorGlassMat);
    visor.rotation.x = 1.35;
    visor.position.set(0, 0.06, 0.18);
    headGroup.add(visor);

    // LED HUD Waveform inside Visor (Simulates Eye Display & Voice Cadence)
    const hudGroup = new THREE.Group();
    hudGroup.position.set(0, 0.08, 0.66);
    headGroup.add(hudGroup);

    // 5 Horizontal Waveform Bars for Audio Reactivity
    const waveBars = [];
    const barMat = glowCyanMat.clone();
    for (let i = -2; i <= 2; i++) {
      const barGeo = new THREE.BoxGeometry(0.045, 0.08, 0.02);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(i * 0.075, 0, 0);
      hudGroup.add(bar);
      waveBars.push(bar);
    }

    // Surgical Loupes / Forehead Sensor Node
    const sensorGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.08, 24);
    const sensor = new THREE.Mesh(sensorGeo, titaniumMat);
    sensor.rotation.x = Math.PI / 2;
    sensor.position.set(0, 0.35, 0.65);
    headGroup.add(sensor);

    const sensorLensGeo = new THREE.CircleGeometry(0.05, 24);
    const sensorLens = new THREE.Mesh(sensorLensGeo, glowCyanMat);
    sensorLens.position.set(0, 0.35, 0.695);
    headGroup.add(sensorLens);

    // 6. Holographic Orbiting Gyroscope Diagnostic Rings
    const ring1Geo = new THREE.TorusGeometry(1.15, 0.012, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.45 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = 1.2;
    rootGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.25, 0.009, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = 1.1;
    rootGroup.add(ring2);

    // Glowing Holographic Floor Disc
    const floorDiscGeo = new THREE.RingGeometry(0.6, 1.1, 48);
    const floorDiscMat = new THREE.MeshBasicMaterial({
      color: 0x0f766e,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const floorDisc = new THREE.Mesh(floorDiscGeo, floorDiscMat);
    floorDisc.rotation.x = Math.PI / 2;
    floorDisc.position.set(0, -1.5, 0);
    rootGroup.add(floorDisc);

    // 7. Mouse Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-0.35, Math.min(0.35, x * 0.35));
      mouse.targetY = Math.max(-0.2, Math.min(0.2, y * 0.2));
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Animation Loop
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const { isSpeaking, isListening } = propsRef.current;

      // Mouse tracking interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Floating hover-breathing effect
      const hoverFloat = Math.sin(elapsedTime * 2.0) * 0.035;
      bustGroup.position.y = hoverFloat;

      // Head tracking
      headGroup.rotation.y = mouse.x + Math.sin(elapsedTime * 0.9) * 0.03;
      headGroup.rotation.x = -mouse.y + Math.cos(elapsedTime * 1.2) * 0.02;
      headGroup.rotation.z = -mouse.x * 0.15;

      // Holographic Gyroscope Rotation
      ring1.rotation.z += isListening ? 0.04 : 0.012;
      ring2.rotation.x += isListening ? 0.035 : 0.009;
      floorDisc.rotation.z += 0.008;

      // Audio-Reactive LED Waveform Bars inside Visor
      waveBars.forEach((bar, idx) => {
        if (isSpeaking) {
          // Dynamic sound wave articulation
          const waveHeight = Math.abs(Math.sin(elapsedTime * 16 + idx * 1.2)) * 2.4 + 0.5;
          bar.scale.y = waveHeight;
          bar.material.color.setHex(0x2dd4bf);
          bar.material.emissive.setHex(0x2dd4bf);
          bar.material.emissiveIntensity = 2.0;
        } else if (isListening) {
          // Attentive listening pulse (Ruby/Cyan alert)
          const listenPulse = Math.sin(elapsedTime * 8 + idx * 0.8) * 1.5 + 1.2;
          bar.scale.y = listenPulse;
          bar.material.color.setHex(0xef4444);
          bar.material.emissive.setHex(0xef4444);
          bar.material.emissiveIntensity = 2.2;
        } else {
          // Idle calm status
          bar.scale.y = 0.8 + Math.sin(elapsedTime * 2.5 + idx) * 0.3;
          bar.material.color.setHex(0x0d9488);
          bar.material.emissive.setHex(0x0d9488);
          bar.material.emissiveIntensity = 0.9;
        }
      });

      // Lighting reactivity
      if (isListening) {
        sensorLens.material.emissiveIntensity = 2.2 + Math.sin(elapsedTime * 10) * 0.8;
        ring1Mat.color.setHex(0xef4444);
        ring1Mat.opacity = 0.8;
      } else if (isSpeaking) {
        sensorLens.material.emissiveIntensity = 1.8 + Math.sin(elapsedTime * 8) * 0.5;
        ring1Mat.color.setHex(0x2dd4bf);
        ring1Mat.opacity = 0.7;
      } else {
        sensorLens.material.emissiveIntensity = 1.0;
        ring1Mat.color.setHex(0x2dd4bf);
        ring1Mat.opacity = 0.4;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
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

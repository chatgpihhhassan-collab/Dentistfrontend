import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// ============================================================================
// 1. Millimeter-Calibrated 32 Sockets Coordinate & Rotation Database
// ============================================================================
export const THREE_MAXILLA_SOCKETS = {
  // Upper Right Quadrant (1 to 8)
  1:  { texture: 'molar.png',    xPercent: 20.0, yPercent: 75.5, rotDeg: 90,  scale: 0.90, shape: 'molar',    name: 'Maxillary Right 3rd Molar' },
  2:  { texture: 'molar.png',    xPercent: 20.5, yPercent: 64.5, rotDeg: 86,  scale: 0.96, shape: 'molar',    name: 'Maxillary Right 2nd Molar' },
  3:  { texture: 'molar.png',    xPercent: 22.5, yPercent: 53.5, rotDeg: 78,  scale: 0.98, shape: 'molar',    name: 'Maxillary Right 1st Molar' },
  4:  { texture: 'premolar.png', xPercent: 25.5, yPercent: 43.0, rotDeg: 68,  scale: 0.86, shape: 'premolar', name: 'Maxillary Right 2nd Premolar' },
  5:  { texture: 'premolar.png', xPercent: 28.5, yPercent: 34.5, rotDeg: 55,  scale: 0.82, shape: 'premolar', name: 'Maxillary Right 1st Premolar' },
  6:  { texture: 'canine.png',   xPercent: 32.5, yPercent: 27.0, rotDeg: 40,  scale: 0.76, shape: 'canine',   name: 'Maxillary Right Canine' },
  7:  { texture: 'incisor.png',  xPercent: 38.0, yPercent: 20.5, rotDeg: 22,  scale: 0.70, shape: 'incisor',  name: 'Maxillary Right Lateral Incisor' },
  8:  { texture: 'incisor.png',  xPercent: 45.0, yPercent: 17.0, rotDeg: 8,   scale: 0.68, shape: 'incisor',  name: 'Maxillary Right Central Incisor' },

  // Upper Left Quadrant (9 to 16)
  9:  { texture: 'incisor.png',  xPercent: 55.0, yPercent: 17.0, rotDeg: -8,  scale: 0.68, shape: 'incisor',  name: 'Maxillary Left Central Incisor' },
  10: { texture: 'incisor.png',  xPercent: 62.0, yPercent: 20.5, rotDeg: -22, scale: 0.70, shape: 'incisor',  name: 'Maxillary Left Lateral Incisor' },
  11: { texture: 'canine.png',   xPercent: 67.5, yPercent: 27.0, rotDeg: -40, scale: 0.76, shape: 'canine',   name: 'Maxillary Left Canine' },
  12: { texture: 'premolar.png', xPercent: 71.5, yPercent: 34.5, rotDeg: -55, scale: 0.82, shape: 'premolar', name: 'Maxillary Left 1st Premolar' },
  13: { texture: 'premolar.png', xPercent: 74.5, yPercent: 43.0, rotDeg: -68, scale: 0.86, shape: 'premolar', name: 'Maxillary Left 2nd Premolar' },
  14: { texture: 'molar.png',    xPercent: 77.5, yPercent: 53.5, rotDeg: -78, scale: 0.98, shape: 'molar',    name: 'Maxillary Left 1st Molar' },
  15: { texture: 'molar.png',    xPercent: 79.5, yPercent: 64.5, rotDeg: -86, scale: 0.96, shape: 'molar',    name: 'Maxillary Left 2nd Molar' },
  16: { texture: 'molar.png',    xPercent: 80.0, yPercent: 75.5, rotDeg: -90, scale: 0.90, shape: 'molar',    name: 'Maxillary Left 3rd Molar' }
};

export const THREE_MANDIBLE_SOCKETS = {
  // Lower Left Quadrant (17 to 24)
  17: { texture: 'molar.png',    xPercent: 18.5, yPercent: 83.5, rotDeg: 90,  scale: 0.92, shape: 'molar',    name: 'Mandibular Left 3rd Molar' },
  18: { texture: 'molar.png',    xPercent: 18.0, yPercent: 70.5, rotDeg: 86,  scale: 0.98, shape: 'molar',    name: 'Mandibular Left 2nd Molar' },
  19: { texture: 'molar.png',    xPercent: 19.8, yPercent: 57.0, rotDeg: 78,  scale: 0.98, shape: 'molar',    name: 'Mandibular Left 1st Molar' },
  20: { texture: 'premolar.png', xPercent: 22.8, yPercent: 45.0, rotDeg: 68,  scale: 0.86, shape: 'premolar', name: 'Mandibular Left 2nd Premolar' },
  21: { texture: 'premolar.png', xPercent: 26.2, yPercent: 35.0, rotDeg: 54,  scale: 0.82, shape: 'premolar', name: 'Mandibular Left 1st Premolar' },
  22: { texture: 'canine.png',   xPercent: 31.2, yPercent: 26.5, rotDeg: 40,  scale: 0.76, shape: 'canine',   name: 'Mandibular Left Canine' },
  23: { texture: 'incisor.png',  xPercent: 37.5, yPercent: 19.5, rotDeg: 22,  scale: 0.70, shape: 'incisor',  name: 'Mandibular Left Lateral Incisor' },
  24: { texture: 'incisor.png',  xPercent: 45.0, yPercent: 15.5, rotDeg: 8,   scale: 0.68, shape: 'incisor',  name: 'Mandibular Left Central Incisor' },

  // Lower Right Quadrant (25 to 32)
  25: { texture: 'incisor.png',  xPercent: 55.0, yPercent: 15.5, rotDeg: -8,  scale: 0.68, shape: 'incisor',  name: 'Mandibular Right Central Incisor' },
  26: { texture: 'incisor.png',  xPercent: 62.5, yPercent: 19.5, rotDeg: -22, scale: 0.70, shape: 'incisor',  name: 'Mandibular Right Lateral Incisor' },
  27: { texture: 'canine.png',   xPercent: 68.8, yPercent: 26.5, rotDeg: -40, scale: 0.76, shape: 'canine',   name: 'Mandibular Right Canine' },
  28: { texture: 'premolar.png', xPercent: 73.8, yPercent: 35.0, rotDeg: -54, scale: 0.82, shape: 'premolar', name: 'Mandibular Right 1st Premolar' },
  29: { texture: 'premolar.png', xPercent: 77.2, yPercent: 45.0, rotDeg: -68, scale: 0.86, shape: 'premolar', name: 'Mandibular Right 2nd Premolar' },
  30: { texture: 'molar.png',    xPercent: 80.2, yPercent: 57.0, rotDeg: -78, scale: 0.98, shape: 'molar',    name: 'Mandibular Right 1st Molar' },
  31: { texture: 'molar.png',    xPercent: 82.0, yPercent: 70.5, rotDeg: -86, scale: 0.98, shape: 'molar',    name: 'Mandibular Right 2nd Molar' },
  32: { texture: 'molar.png',    xPercent: 81.5, yPercent: 83.5, rotDeg: -90, scale: 0.92, shape: 'molar',    name: 'Mandibular Right 3rd Molar' }
};

export const THREE_PRIMARY_MAXILLA_SOCKETS = {
  'A': { texture: 'molar.png',   xPercent: 20.7, yPercent: 61.5, rotDeg: 82,  scale: 0.94, shape: 'molar',   name: 'Maxillary Right Primary 2nd Molar (A)',    label: 'A', toothNumber: 'A' },
  'B': { texture: 'molar.png',   xPercent: 23.4, yPercent: 49.3, rotDeg: 70,  scale: 0.90, shape: 'molar',   name: 'Maxillary Right Primary 1st Molar (B)',    label: 'B', toothNumber: 'B' },
  'C': { texture: 'canine.png',  xPercent: 27.8, yPercent: 37.9, rotDeg: 52,  scale: 0.82, shape: 'canine',  name: 'Maxillary Right Primary Canine (C)',       label: 'C', toothNumber: 'C' },
  'D': { texture: 'incisor.png', xPercent: 35.7, yPercent: 25.9, rotDeg: 30,  scale: 0.74, shape: 'incisor', name: 'Maxillary Right Primary Lateral Incisor (D)', label: 'D', toothNumber: 'D' },
  'E': { texture: 'incisor.png', xPercent: 44.4, yPercent: 21.1, rotDeg: 10,  scale: 0.74, shape: 'incisor', name: 'Maxillary Right Primary Central Incisor (E)', label: 'E', toothNumber: 'E' },
  'F': { texture: 'incisor.png', xPercent: 55.6, yPercent: 21.1, rotDeg: -10, scale: 0.74, shape: 'incisor', name: 'Maxillary Left Primary Central Incisor (F)',  label: 'F', toothNumber: 'F' },
  'G': { texture: 'incisor.png', xPercent: 64.3, yPercent: 25.9, rotDeg: -30, scale: 0.74, shape: 'incisor', name: 'Maxillary Left Primary Lateral Incisor (G)',  label: 'G', toothNumber: 'G' },
  'H': { texture: 'canine.png',  xPercent: 72.2, yPercent: 37.9, rotDeg: -52, scale: 0.82, shape: 'canine',  name: 'Maxillary Left Primary Canine (H)',        label: 'H', toothNumber: 'H' },
  'I': { texture: 'molar.png',   xPercent: 76.6, yPercent: 49.3, rotDeg: -70, scale: 0.90, shape: 'molar',   name: 'Maxillary Left Primary 1st Molar (I)',     label: 'I', toothNumber: 'I' },
  'J': { texture: 'molar.png',   xPercent: 79.3, yPercent: 61.5, rotDeg: -82, scale: 0.94, shape: 'molar',   name: 'Maxillary Left Primary 2nd Molar (J)',     label: 'J', toothNumber: 'J' }
};

export const THREE_PRIMARY_MANDIBLE_SOCKETS = {
  'K': { texture: 'molar.png',   xPercent: 18.6, yPercent: 61.0, rotDeg: 82,  scale: 0.94, shape: 'molar',   name: 'Mandibular Left Primary 2nd Molar (K)',    label: 'K', toothNumber: 'K' },
  'L': { texture: 'molar.png',   xPercent: 22.5, yPercent: 48.3, rotDeg: 68,  scale: 0.90, shape: 'molar',   name: 'Mandibular Left Primary 1st Molar (L)',    label: 'L', toothNumber: 'L' },
  'M': { texture: 'canine.png',  xPercent: 27.8, yPercent: 37.1, rotDeg: 50,  scale: 0.82, shape: 'canine',  name: 'Mandibular Left Primary Canine (M)',       label: 'M', toothNumber: 'M' },
  'N': { texture: 'incisor.png', xPercent: 36.1, yPercent: 25.4, rotDeg: 28,  scale: 0.72, shape: 'incisor', name: 'Mandibular Left Primary Lateral Incisor (N)', label: 'N', toothNumber: 'N' },
  'O': { texture: 'incisor.png', xPercent: 44.4, yPercent: 20.5, rotDeg: 9,   scale: 0.72, shape: 'incisor', name: 'Mandibular Left Primary Central Incisor (O)', label: 'O', toothNumber: 'O' },
  'P': { texture: 'incisor.png', xPercent: 55.6, yPercent: 20.5, rotDeg: -9,  scale: 0.72, shape: 'incisor', name: 'Mandibular Right Primary Central Incisor (P)', label: 'P', toothNumber: 'P' },
  'Q': { texture: 'incisor.png', xPercent: 63.9, yPercent: 25.4, rotDeg: -28, scale: 0.72, shape: 'incisor', name: 'Mandibular Right Primary Lateral Incisor (Q)', label: 'Q', toothNumber: 'Q' },
  'R': { texture: 'canine.png',  xPercent: 72.2, yPercent: 37.1, rotDeg: -50, scale: 0.82, shape: 'canine',  name: 'Mandibular Right Primary Canine (R)',      label: 'R', toothNumber: 'R' },
  'S': { texture: 'molar.png',   xPercent: 77.5, yPercent: 48.3, rotDeg: -68, scale: 0.90, shape: 'molar',   name: 'Mandibular Right Primary 1st Molar (S)',    label: 'S', toothNumber: 'S' },
  'T': { texture: 'molar.png',   xPercent: 81.4, yPercent: 61.0, rotDeg: -82, scale: 0.94, shape: 'molar',   name: 'Mandibular Right Primary 2nd Molar (T)',    label: 'T', toothNumber: 'T' }
};

// Texture Loader Cache
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

function getToothTexture(textureFileName) {
  const path = `/tooth_textures/${textureFileName}`;
  if (!textureCache.has(path)) {
    const tex = textureLoader.load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textureCache.set(path, tex);
  }
  return textureCache.get(path);
}

/**
 * ThreeDentalJawArch Component
 * Renders anatomical 3D tooth crowns seated inside empty jaw sockets
 */
export default function ThreeDentalJawArch({
  jawType = 'maxilla', // 'maxilla' | 'mandible'
  isPediatric = false,
  teethState = [],
  highlightedTeeth = [],
  onToothClick = () => {},
  className = ""
}) {
  const mountRef = useRef(null);
  const isMaxilla = jawType === 'maxilla';
  const socketsMap = isPediatric 
    ? (isMaxilla ? THREE_PRIMARY_MAXILLA_SOCKETS : THREE_PRIMARY_MANDIBLE_SOCKETS)
    : (isMaxilla ? THREE_MAXILLA_SOCKETS : THREE_MANDIBLE_SOCKETS);
  const bgImage = isPediatric
    ? (isMaxilla ? '/empty_pediatric_maxilla_jaw.jpg' : '/empty_pediatric_mandible_jaw.jpg')
    : (isMaxilla ? '/empty_maxilla_jaw.jpg' : '/empty_mandible_jaw.jpg');
  const jawTitle = isPediatric
    ? (isMaxilla ? 'PRIMARY MAXILLA (10 TEETH A–J)' : 'PRIMARY MANDIBLE (10 TEETH K–T)')
    : (isMaxilla ? 'MAXILLA (UPPER JAW - 16 TEETH)' : 'MANDIBLE (LOWER JAW - 16 TEETH)');

  const [hoveredTooth, setHoveredTooth] = useState(null);
  const highlightedTeethRef = useRef(highlightedTeeth);
  useEffect(() => {
    highlightedTeethRef.current = highlightedTeeth;
  }, [highlightedTeeth]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isMounted = true;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Three.js Scene & Orthographic Camera
    const scene = new THREE.Scene();
    const aspect = width / height;
    const frustumSize = 10;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.replaceChildren(renderer.domElement);

    // 2. Realistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(2, 6, 10);
    scene.add(directionalLight);

    // 3. Build & Seat Teeth Inside Sockets
    const clickableObjects = [];

    Object.entries(socketsMap).forEach(([idStr, socket], idx) => {
      const toothNum = isNaN(parseInt(idStr, 10)) ? idStr : parseInt(idStr, 10);
      const toothData = teethState.find(
        (t) => {
          const tVal = t.toothNumber ?? t.ToothNumber;
          return tVal === toothNum || String(tVal).toUpperCase() === String(toothNum).toUpperCase();
        }
      );
      const status = toothData?.status || toothData?.conditionStatus || 'Healthy';
      const sLower = status.toLowerCase();
      const isMissing = sLower.includes('miss') || sLower.includes('extract') || sLower.includes('absent') || sLower.includes('lost') || sLower.includes('exfoliat');
      const isDecay = sLower.includes('decay') || sLower.includes('damag') || sLower === 'cavity' || sLower.includes('keera');
      const isFilled = sLower.includes('treat') || sLower.includes('prosthesis') || sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('filling') || sLower.includes('composite');
      const isRCT = sLower.includes('canal') || sLower.includes('root') || sLower === 'yellow' || sLower.includes('pulp');
      const isHighlighted = highlightedTeeth.includes(toothNum) || highlightedTeeth.includes(String(toothNum));

      // If missing, socket remains empty!
      if (isMissing) return;

      const worldX = ((socket.xPercent - 50) / 100) * frustumSize;
      const worldY = -((socket.yPercent - 50) / 100) * frustumSize;

      // Realistic Occlusal Crown Texture
      const texture = getToothTexture(socket.texture);

      // Clinical Dynamic Rotation (e.g. 45° mesiopalatal rotation)
      let clinicalRotOffset = 0;
      if (typeof toothData?.rotationDeg === 'number' && toothData.rotationDeg !== 0) {
        clinicalRotOffset = toothData.rotationDeg;
      } else if (typeof toothData?.rotationOffset === 'number' && toothData.rotationOffset !== 0) {
        clinicalRotOffset = toothData.rotationOffset;
      }
      
      if (sLower.includes('rotat') || (toothData?.comments || '').toLowerCase().includes('rotat')) {
        const fullTxt = sLower + ' ' + (toothData?.comments || '').toLowerCase();
        const degMatch = fullTxt.match(/(\d{1,3})\s*(?:deg|°|degrees|degree)/i);
        if (degMatch) {
          clinicalRotOffset = parseInt(degMatch[1], 10);
        } else if (clinicalRotOffset === 0 || Math.abs(clinicalRotOffset) < 15) {
          clinicalRotOffset = 45;
        }
        if (Math.abs(clinicalRotOffset) < 15) clinicalRotOffset = 45;
        if (fullTxt.includes('mesio') || fullTxt.includes('inward') || fullTxt.includes('palatal')) {
          clinicalRotOffset = (isMaxilla ? 1 : -1) * Math.abs(clinicalRotOffset);
        }
      }

// Procedural Clinical Restoration Overlay Generator (Zone & Material Specific)
function createClinicalOverlayCanvas(status, comments, toothNum, isMaxilla) {
  const sLower = (status || '').toLowerCase();
  const cLower = (comments || '').toLowerCase();
  const full = `${sLower} ${cLower}`;

  const isComposite = full.includes('composite') || full.includes('resin') || (full.includes('fill') && !full.includes('amalgam') && !full.includes('gic')) || (full.includes('treated') && !full.includes('crown'));
  const isAmalgam = full.includes('amalgam') || full.includes('silver');
  const isGIC = full.includes('gic') || full.includes('glass ionomer');
  const isCaries = full.includes('caries') || full.includes('decay') || full.includes('cavity') || full.includes('keera') || full.includes('damag');
  const isRCT = full.includes('canal') || full.includes('rct') || full.includes('pulpotomy') || full.includes('obturation');
  const isSealant = full.includes('sealant');
  const isCrown = (full.includes('crown') || full.includes('bridge') || full.includes('prosthesis')) && !full.includes('implant');
  const isImplant = full.includes('implant');
  const isVeneer = full.includes('veneer');
  const isMobility = (full.includes('mobility') && !full.includes('grade 0') && !full.includes('physiological')) || (full.includes('bone loss') && !full.includes('no bone loss'));
  const isRecession = full.includes('recession');
  const isFractured = full.includes('fractur') || full.includes('chipped') || full.includes('crack');
  const isOrthodontic = full.includes('orthodontic') || full.includes('bracket') || full.includes('braces') || full.includes('malocclusion') || full.includes('crowding') || full.includes('rotation') || full.includes('diastema');
  const isAbscess = full.includes('abscess') || full.includes('lesion') || full.includes('periapical') || full.includes('pus') || full.includes('swelling');
  const isInlay = full.includes('inlay') || full.includes('onlay');
  const isPostCore = full.includes('post and core') || full.includes('post & core') || full.includes('post build');
  const isImpacted = full.includes('impacted') || full.includes('impaction');
  const isCyst = full.includes('cyst') || full.includes('resorption');
  const isSensitivity = full.includes('sensitivity') || full.includes('sensitive');
  const isSpaceMaintainer = full.includes('space maintainer') || full.includes('band and loop') || full.includes('space');
  const isPulpotomy = full.includes('pulpotomy') || full.includes('mta');
  const isSSC = full.includes('ssc') || full.includes('stainless steel crown');

  if (!isComposite && !isAmalgam && !isGIC && !isCaries && !isRCT && !isSealant && !isCrown && !isImplant && !isVeneer && !isMobility && !isRecession && !isFractured && !isOrthodontic && !isAbscess && !isInlay && !isPostCore && !isImpacted && !isCyst && !isSensitivity && !isSpaceMaintainer && !isPulpotomy && !isSSC) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Surface detection (MO, DO, MOD, O, M, D, B, L)
  const isMO = full.includes('mo') || full.includes('mesio-occlusal');
  const isDO = full.includes('do') || full.includes('disto-occlusal');
  const isMOD = full.includes('mod') || full.includes('mesio-occlusal-distal');

  const isRightQuad = (toothNum >= 1 && toothNum <= 8) || (toothNum >= 25 && toothNum <= 32);
  const mesialDir = isRightQuad ? 1 : -1;

  ctx.clearRect(0, 0, 128, 128);

  if (isImplant) {
    // 1. DENTAL IMPLANT WITH SCREW-RETAINED ZIRCONIA CROWN
    ctx.save();
    // A. Full Coverage Monolithic Zirconia Crown Porcelain Base (Covers socket background)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.fill();

    // B. Outer Glowing Medical Teal Aura Ring (#0E8A80)
    ctx.strokeStyle = '#0E8A80';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(14, 138, 128, 0.9)';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // C. Outer Titanium Abutment Collar
    ctx.shadowBlur = 0;
    const abutmentGrad = ctx.createRadialGradient(64, 64, 6, 64, 64, 28);
    abutmentGrad.addColorStop(0, '#CBD5E1');
    abutmentGrad.addColorStop(0.7, '#64748B');
    abutmentGrad.addColorStop(1, '#334155');
    ctx.fillStyle = abutmentGrad;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 64, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // D. Central Titanium Screw-Access Channel (Dark Socket)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(64, 64, 16, 0, Math.PI * 2);
    ctx.fill();

    // E. Golden Hexagonal Internal Drive Socket
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = 64 + 10 * Math.cos(a);
      const hy = 64 + 10 * Math.sin(a);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // F. 4 Radial Precision Laser Antirotation Grooves
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(38, 64); ctx.lineTo(48, 64);
    ctx.moveTo(80, 64); ctx.lineTo(90, 64);
    ctx.moveTo(64, 38); ctx.lineTo(64, 48);
    ctx.moveTo(64, 80); ctx.lineTo(64, 90);
    ctx.stroke();

    ctx.restore();
  } else if (isOrthodontic) {
    // 2. ORTHODONTIC BRACKET & ARCHWIRE: Metallic titanium slot with sky ligature
    ctx.save();
    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(2, 132, 199, 0.5)';
    ctx.shadowBlur = 6;

    // Bracket body
    ctx.fillRect(44, 44, 40, 40);
    ctx.strokeRect(44, 44, 40, 40);

    // Twin tie wings
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(38, 36, 14, 12);
    ctx.fillRect(76, 36, 14, 12);
    ctx.fillRect(38, 80, 14, 12);
    ctx.fillRect(76, 80, 14, 12);

    // Horizontal Archwire Slot (Sky Blue #0284C7)
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(30, 60, 68, 8);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 60, 68, 8);

    // Elastomeric ligature ring (Cyan #06B6D4)
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(64, 64, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  } else if (isCaries) {
    // 3. CARIES / DECAY: Dark brown / black cavity crater (#5C2C16)
    ctx.save();
    const isLingual = full.includes('lingual') || full.includes('palatal');
    const isBuccal = full.includes('buccal') || full.includes('facial');
    const isPit = full.includes('pit');

    const cGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 28);
    cGrad.addColorStop(0, '#1C110A');
    cGrad.addColorStop(0.6, '#5C2C16');
    cGrad.addColorStop(1, '#92400E');
    ctx.fillStyle = cGrad;
    ctx.strokeStyle = '#1C110A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isLingual) {
      const cy = isMaxilla ? 42 : 84;
      ctx.ellipse(64, cy, isPit ? 16 : 28, isPit ? 14 : 16, 0, 0, Math.PI * 2);
    } else if (isBuccal) {
      const cy = isMaxilla ? 84 : 42;
      ctx.ellipse(64, cy, isPit ? 16 : 28, isPit ? 14 : 16, 0, 0, Math.PI * 2);
    } else if (isMO) {
      ctx.ellipse(64 + (mesialDir * 16), 64, 34, 18, 0, 0, Math.PI * 2);
    } else if (isDO) {
      ctx.ellipse(64 - (mesialDir * 16), 64, 34, 18, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(64, 64, 24, 18, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isRCT) {
    // 4. ROOT CANAL (RCT): Purple canal access with golden gutta-percha core (#7C3AED / #F59E0B)
    ctx.save();
    ctx.fillStyle = '#7C3AED';
    ctx.strokeStyle = '#5B21B6';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(64, 64, 20, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(64, 64, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isMobility) {
    // 5. MOBILITY / BONE LOSS: Amber periodontal mobility rings (#F59E0B)
    ctx.save();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(64, 64, 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#D97706';
    ctx.fillRect(40, 60, 48, 8);
    ctx.restore();
  } else if (isComposite) {
    // 6. COMPOSITE FILLING: Tooth-colored inner fill with crisp Medical Blue outline (#2563EB)
    ctx.save();
    ctx.fillStyle = '#F4EFEA';
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 5.5;
    ctx.shadowColor = 'rgba(37, 99, 235, 0.4)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    if (isMOD) {
      ctx.ellipse(64, 64, 46, 24, 0, 0, Math.PI * 2);
    } else if (isMO) {
      const cx = 64 + (mesialDir * 18);
      ctx.ellipse(cx, 64, 38, 22, (mesialDir * 0.15), 0, Math.PI * 2);
    } else if (isDO) {
      const cx = 64 - (mesialDir * 18);
      ctx.ellipse(cx, 64, 38, 22, (-mesialDir * 0.15), 0, Math.PI * 2);
    } else {
      ctx.ellipse(64, 64, 28, 22, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Gloss highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(60, 58, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isAmalgam) {
    // 7. AMALGAM FILLING: Solid metallic silver-grey (#8E9AAF)
    ctx.save();
    const grad = ctx.createRadialGradient(60, 60, 4, 64, 64, 32);
    grad.addColorStop(0, '#B0BCC5');
    grad.addColorStop(0.7, '#7B8893');
    grad.addColorStop(1, '#475569');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;

    ctx.beginPath();
    if (isMOD) ctx.ellipse(64, 64, 44, 22, 0, 0, Math.PI * 2);
    else if (isMO) ctx.ellipse(64 + (mesialDir * 16), 64, 36, 20, 0, 0, Math.PI * 2);
    else ctx.ellipse(64, 64, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isGIC) {
    // 8. GIC FILLING: Pale warm yellow patch (#E8D98A)
    ctx.save();
    ctx.fillStyle = '#E8D98A';
    ctx.strokeStyle = '#CA8A04';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(64, 64, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isSealant) {
    // 9. SEALANT: Sky blue fissure sealant lines (#38BDF8)
    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(34, 64);
    ctx.lineTo(94, 64);
    ctx.moveTo(64, 40);
    ctx.lineTo(64, 88);
    ctx.stroke();
    ctx.restore();
  } else if (isCrown) {
    // 10. CROWN: Golden or zirconia crown frame
    ctx.save();
    ctx.strokeStyle = full.includes('gold') ? '#D97706' : '#94A3B8';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, 92, 92);
    ctx.restore();
  } else if (isRecession) {
    // 11. GINGIVAL RECESSION: Coral/pink cervical attachment loss arch (#E0665A)
    ctx.save();
    ctx.strokeStyle = '#E0665A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const cy = isMaxilla ? 36 : 92;
    ctx.arc(64, cy, 32, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  } else if (isAbscess) {
    // 13. PERIAPICAL ABSCESS / LESION: Glowing red suppurative halo with yellow center focus
    ctx.save();
    const abscessGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 38);
    abscessGrad.addColorStop(0, '#FEF08A');
    abscessGrad.addColorStop(0.4, '#EF4444');
    abscessGrad.addColorStop(0.85, 'rgba(185, 28, 28, 0.8)');
    abscessGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = abscessGrad;
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();
  } else if (isInlay) {
    // 14. INLAY / ONLAY: Precision gold / amber restoration border (#D97706)
    ctx.save();
    ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(42, 42, 44, 44, [8, 8, 8, 8]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isPostCore) {
    // 15. POST & CORE: Dark titanium center core + post circle (#334155 / #94A3B8)
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(52, 34, 24, 60, [6, 6, 6, 6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(64, 64, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isImpacted) {
    // 16. IMPACTED TOOTH: Purple surgical impaction bracket (#7C3AED)
    ctx.save();
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 4.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(24, 24, 80, 80);
    ctx.setLineDash([]);
    ctx.restore();
  } else if (isCyst) {
    // 17. PERIAPICAL CYST / RESORPTION: Deep violet osteolytic radiolucency (#991B1B)
    ctx.save();
    const cystGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 30);
    cystGrad.addColorStop(0, '#581C87');
    cystGrad.addColorStop(0.7, '#7C3AED');
    cystGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cystGrad;
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isSensitivity) {
    // 18. DENTIN SENSITIVITY: Desensitizing cyan cervical crescent (#06B6D4)
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const cy = isMaxilla ? 36 : 92;
    ctx.arc(64, cy, 26, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isVeneer) {
    // 19. PORCELAIN VENEER: Labial aesthetic ceramic veneer outline (#8B5CF6)
    ctx.save();
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(26, 26, 76, 76, [12, 12, 12, 12]);
    ctx.stroke();
    ctx.restore();
  } else if (isSpaceMaintainer) {
    // 20. PEDIATRIC SPACE MAINTAINER: Blue metallic band collar + loop (#2563EB / #93C5FD)
    ctx.save();
    // Glowing Blue Metallic Band around tooth
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 7;
    ctx.shadowColor = 'rgba(37, 99, 235, 0.9)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.stroke();

    // Inner translucent blue band fill
    ctx.fillStyle = 'rgba(147, 197, 253, 0.55)';
    ctx.beginPath();
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    ctx.fill();

    // Wire loop extension
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(64, 25);
    ctx.quadraticCurveTo(18, 25, 18, 64);
    ctx.quadraticCurveTo(18, 103, 64, 103);
    ctx.stroke();

    // Center appliance node
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.arc(64, 64, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isSSC) {
    // 21. STAINLESS STEEL CROWN: Full preformed metallic crown
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isPulpotomy) {
    // 22. PULPOTOMY (MTA): Purple coronal pulp cap
    ctx.save();
    ctx.fillStyle = '#7C3AED';
    ctx.strokeStyle = '#581C87';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

      const isRotated = clinicalRotOffset !== 0 || sLower.includes('rotat');
      const isSpaceMaintainer = sLower.includes('space maintainer') || sLower.includes('band and loop') || sLower.includes('space') || (toothData?.comments || '').toLowerCase().includes('space');

      // Base Tooth Enamel Color (Natural Anatomical Enamel base)
      let toothColor = new THREE.Color(0xffffff);
      let opacity = 1.0;

      if (isHighlighted) {
        toothColor = new THREE.Color(0x7dd3fc); // Glowing cyan highlight
      } else if (isSpaceMaintainer) {
        toothColor = new THREE.Color(0xdbeafe); // Soft pediatric sky blue base
      } else if (isRotated) {
        toothColor = new THREE.Color(0x93c5fd); // Light blue tint for rotated tooth
      }

      // Create Plane Geometry tailored to socket size
      const geoSize = 1.25 * socket.scale;
      const toothGeo = new THREE.PlaneGeometry(geoSize, geoSize);

      const toothMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        color: toothColor,
        roughness: 0.15,
        metalness: 0.05,
        opacity: opacity
      });

      const toothMesh = new THREE.Mesh(toothGeo, toothMat);
      toothMesh.position.set(worldX, worldY, 0.5);
      toothMesh.rotation.z = -THREE.MathUtils.degToRad(socket.rotDeg + clinicalRotOffset);

      let toothComments = (toothData?.comments || toothData?.Comments || toothData?.comment || toothData?.Comment || '').trim();
      if ((!toothComments || toothComments === "Saved via Save Chart command") && status && status !== 'Healthy') {
        if (status.toLowerCase().includes('fill') || status.toLowerCase().includes('composite') || status.toLowerCase().includes('amalgam') || status.toLowerCase().includes('gic')) {
          toothComments = `Restorative: Composite restoration placed on Tooth #${toothNum}`;
        } else if (status.toLowerCase().includes('caries') || status.toLowerCase().includes('decay') || status.toLowerCase().includes('damag') || status.toLowerCase().includes('cavity')) {
          toothComments = `Pathology: Active caries enamel demineralization on Tooth #${toothNum}`;
        } else if (status.toLowerCase().includes('canal') || status.toLowerCase().includes('rct')) {
          toothComments = `Endodontics: Root canal therapy and obturation on Tooth #${toothNum}`;
        } else if (status.toLowerCase().includes('mobility')) {
          toothComments = `Periodontal: Pathologic tooth mobility on Tooth #${toothNum}`;
        } else if (status.toLowerCase().includes('rotat')) {
          toothComments = `Developmental: ${clinicalRotOffset || 45}° axial rotation diagnosed on odontogram`;
        } else {
          toothComments = `Clinical Observation: ${status} placed on Tooth #${toothNum}`;
        }
      }

      // Attach Surface-Specific Clinical Restoration Overlay (e.g. MO Composite / Amalgam / GIC / Caries / Implant / Bracket / Space Maintainer)
      const overlayTexture = createClinicalOverlayCanvas(status, toothComments, toothNum, isMaxilla);
      if (overlayTexture) {
        const overlayGeo = new THREE.PlaneGeometry(geoSize * 0.98, geoSize * 0.98);
        const overlayMat = new THREE.MeshBasicMaterial({
          map: overlayTexture,
          transparent: true,
          depthWrite: false
        });
        const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
        overlayMesh.position.set(0, 0, 0.05);
        overlayMesh.renderOrder = 5;
        overlayMesh.raycast = () => {}; // Ignore raycaster on cosmetic overlay
        toothMesh.add(overlayMesh);
      }

      // Space Maintainer Prominent 3D Appliance Ring
      if (isSpaceMaintainer) {
        const ringGeo = new THREE.RingGeometry(geoSize * 0.44, geoSize * 0.58, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 0, 0.08);
        ringMesh.renderOrder = 6;
        toothMesh.add(ringMesh);
      }      toothMesh.userData = {
        toothNum,
        socket,
        socketIndex: idx,
        status,
        comments: toothComments,
        rotationDeg: clinicalRotOffset,
        baseRotationZ: -THREE.MathUtils.degToRad(socket.rotDeg + clinicalRotOffset),
        baseScale: 1.0,
        baseX: worldX,
        baseY: worldY,
        baseZ: 0.5,
        defaultColor: toothColor,
        isMobility: (
          ((status || '').toLowerCase().includes('mobility') && !(status || '').toLowerCase().includes('grade 0')) ||
          (toothComments || '').toLowerCase().includes('mobility grade i') ||
          (toothComments || '').toLowerCase().includes('mobility grade ii') ||
          (toothComments || '').toLowerCase().includes('mobility grade iii') ||
          (toothComments || '').toLowerCase().includes('pathologic tooth mobility') ||
          ((toothComments || '').toLowerCase().includes('bone loss') && !(toothComments || '').toLowerCase().includes('no bone loss'))
        ) && !(toothComments || '').toLowerCase().includes('physiological mobility') && !(status || '').toLowerCase().includes('grade 0'),
        isDecay: (status || '').toLowerCase().includes('decay') || (status || '').toLowerCase().includes('caries') || (status || '').toLowerCase().includes('cavity') || (toothComments || '').toLowerCase().includes('caries'),
        isRootCanal: (status || '').toLowerCase().includes('canal') || (status || '').toLowerCase().includes('rct') || (status || '').toLowerCase().includes('pulpitis'),
        isMissing: (status || '').toLowerCase().includes('missing') || (status || '').toLowerCase().includes('extracted')
      };

      toothMesh.name = `tooth_${toothNum}`;
      scene.add(toothMesh);
      clickableObjects.push(toothMesh);
    });

    // 4. Raycaster & Interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredNum = null;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj && !hitObj.userData?.toothNum && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData?.toothNum) {
          container.style.cursor = 'pointer';
          currentHoveredNum = hitObj.userData.toothNum;
          setHoveredTooth({
            toothNum: hitObj.userData.toothNum,
            status: hitObj.userData.status,
            name: hitObj.userData.socket.name,
            comments: hitObj.userData.comments,
            rotationDeg: hitObj.userData.rotationDeg,
            clientX: e.clientX,
            clientY: e.clientY,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
          return;
        }
      }
      currentHoveredNum = null;
      container.style.cursor = 'default';
      setHoveredTooth(null);
    };

    const handlePointerLeave = () => {
      currentHoveredNum = null;
      if (container) container.style.cursor = 'default';
      setHoveredTooth(null);
    };

    const handleClick = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj && !hitObj.userData?.toothNum && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData?.toothNum) {
          if (onToothClick) onToothClick(hitObj.userData.toothNum, hitObj.userData.status, hitObj.userData.socket);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('click', handleClick);

    // 5. Render Loop — Cinematic Entrance Wave & Idle Clinical Attraction Animations
    let animationFrameId;
    const startTime = performance.now();

    const animate = (time) => {
      animationFrameId = requestAnimationFrame(animate);
      const currentTime = time || performance.now();
      const elapsed = (currentTime - startTime) * 0.001;

      clickableObjects.forEach((mesh, idx) => {
        const tNum = mesh.userData.toothNum;
        const isHovered = currentHoveredNum === tNum;
        const curHighlights = highlightedTeethRef.current || [];
        const isHighlighted = curHighlights.includes(tNum) || curHighlights.includes(String(tNum));
        const hasRotation = mesh.userData.rotationDeg !== 0;
        const toothDelay = idx * 0.045;

        // 🌟 A. SMOOTH CINEMATIC ENTRANCE WAVE
        let entranceElevation = 0;
        let entranceScaleMult = 1.0;

        if (elapsed < 2.2) {
          const waveProgress = Math.max(0, Math.min(1, (elapsed - toothDelay) / 0.7));
          if (waveProgress > 0 && waveProgress < 1) {
            // Smooth sine wave pop up & soft settle into socket
            entranceElevation = Math.sin(waveProgress * Math.PI) * 0.25;
            entranceScaleMult = 1.0 + (Math.sin(waveProgress * Math.PI) * 0.12);
          }
        }

        // 🌟 B. IDLE CLINICAL ATTRACTION EFFECTS (Continuous after entrance)
        let idleOffsetZ = 0;
        let idleScaleMult = 1.0;

        // 1. Caries / Decay: Subtle micro-vibration on Y-axis
        if (mesh.userData?.isDecay) {
          mesh.position.y = mesh.userData.baseY + (Math.sin(elapsed * 10) * 0.012);
        } else {
          mesh.position.y = mesh.userData.baseY;
        }

        // 2. Root Canal Needed: Gentle breathing scale pulse (1.0 to 1.045)
        if (mesh.userData?.isRootCanal) {
          idleScaleMult = 1.0 + (Math.sin(elapsed * 2.5) * 0.04);
          idleOffsetZ = 0.05 + (Math.sin(elapsed * 2.5) * 0.04);
        }

        // 3. Pathologic Mobility: Gentle lateral periodontal wobble
        if (mesh.userData?.isMobility) {
          mesh.position.x = mesh.userData.baseX + (Math.sin(elapsed * 4) * 0.025);
        } else {
          mesh.position.x = mesh.userData.baseX;
        }

        // 4. Missing / Extracted: Ghosting opacity pulse
        if (mesh.userData?.isMissing && mesh.material) {
          mesh.material.opacity = 0.22 + (Math.sin(elapsed * 2) + 1) * 0.15;
        }

        // 🌟 C. INTERACTIVE HOVER / HIGHLIGHT OVERRIDES
        if (isHovered && hasRotation) {
          const rotWobble = Math.sin(elapsed * 6) * THREE.MathUtils.degToRad(14);
          mesh.rotation.z = mesh.userData.baseRotationZ + rotWobble;
          mesh.scale.set(1.16, 1.16, 1.0);
          mesh.position.z = mesh.userData.baseZ + 0.22;
          if (mesh.material && mesh.material.color) mesh.material.color.setHex(0x7dd3fc);
        } else if (isHovered) {
          const hoverPulse = 1.12 + Math.sin(elapsed * 6) * 0.03;
          mesh.scale.set(hoverPulse, hoverPulse, 1.0);
          mesh.position.z = mesh.userData.baseZ + 0.18;
          mesh.rotation.z = mesh.userData.baseRotationZ;
          if (mesh.material && mesh.material.color) mesh.material.color.setHex(0x7dd3fc);
        } else if (isHighlighted && curHighlights.length <= 4) {
          mesh.scale.set(1.08, 1.08, 1.0);
          mesh.position.z = mesh.userData.baseZ + 0.08;
          mesh.rotation.z = mesh.userData.baseRotationZ;
          if (mesh.material && mesh.material.color) mesh.material.color.setHex(0x7dd3fc);
        } else {
          // Combined Entrance Wave + Idle Clinical state
          const finalScale = mesh.userData.baseScale * entranceScaleMult * idleScaleMult;
          mesh.scale.set(finalScale, finalScale, 1.0);
          mesh.position.z = mesh.userData.baseZ + entranceElevation + idleOffsetZ;
          if (hasRotation) {
            const rotIdleSway = Math.sin(elapsed * 2.5) * THREE.MathUtils.degToRad(5);
            mesh.rotation.z = mesh.userData.baseRotationZ + rotIdleSway;
          } else {
            mesh.rotation.z = mesh.userData.baseRotationZ;
          }
          if (mesh.material && mesh.material.color && mesh.userData.defaultColor) {
            mesh.material.color.copy(mesh.userData.defaultColor);
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const updateSize = (nw, nh) => {
      if (!isMounted || nw <= 0 || nh <= 0) return;
      const nAspect = nw / nh;
      camera.left = (-frustumSize * nAspect) / 2;
      camera.right = (frustumSize * nAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (nw > 0 && nh > 0) {
          updateSize(nw, nh);
        }
      }
    });

    resizeObserver.observe(container);

    // Initial micro-task & frame resize safety check
    requestAnimationFrame(() => {
      if (container) {
        updateSize(container.clientWidth, container.clientHeight);
      }
    });

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container) {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerleave', handlePointerLeave);
        container.removeEventListener('click', handleClick);
      }
      try {
        renderer.forceContextLoss();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (e) {}
    };
  }, [jawType, teethState]);

  return (
    <div className={`relative w-full aspect-square select-none flex items-center justify-center ${className}`}>
      {/* 1. Empty Jaw Clinical Background Template (Equalized & Calibrated Proportions) */}
      <img
        src={bgImage}
        alt={jawTitle}
        className={`w-full h-full object-contain filter contrast-105 pointer-events-none absolute inset-0 transition-transform ${
          isMaxilla ? 'scale-[1.12] -translate-y-1' : 'scale-[1.06] translate-y-0.5'
        }`}
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {/* 2. Three.js Canvas Layer (Synchronized 1:1 with Arch Scale) */}
      <div 
        ref={mountRef} 
        className={`absolute inset-0 w-full h-full z-10 pointer-events-auto transition-transform ${
          isMaxilla ? 'scale-[1.12] -translate-y-1' : 'scale-[1.06] translate-y-0.5'
        }`} 
      />

      {/* 3. 🌟 ULTRA-SMART FLOATING CLINICAL HUD (Unclipped, Screen-Clamped, Doctor-Intuitive) 🌟 */}
      {hoveredTooth && (() => {
        const cardWidth = 280;
        const cardHeight = 175;
        const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

        const isRightSide = (hoveredTooth.clientX || 400) < (winW / 2);
        const cardLeft = isRightSide 
          ? Math.min((hoveredTooth.clientX || 400) + 20, winW - cardWidth - 16)
          : Math.max((hoveredTooth.clientX || 400) - cardWidth - 20, 16);
        const cardTop = Math.max(16, Math.min((hoveredTooth.clientY || 300) - 40, winH - cardHeight - 20));

        // Dynamic Status Badge Theme Colors
        const sLower = (hoveredTooth.status || '').toLowerCase();
        let badgeBg = 'bg-sky-500/20 text-sky-700 border-sky-300';
        let statusDot = 'bg-sky-500';

        if (sLower.includes('caries') || sLower.includes('decay') || sLower.includes('damag') || sLower.includes('cavity')) {
          badgeBg = 'bg-red-50 text-red-700 border-red-300 shadow-xs';
          statusDot = 'bg-red-500';
        } else if (sLower.includes('canal') || sLower.includes('rct') || sLower.includes('pulpitis') || sLower.includes('abscess')) {
          badgeBg = 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs';
          statusDot = 'bg-purple-500';
        } else if (sLower.includes('mobility') || sLower.includes('bone loss')) {
          badgeBg = 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs';
          statusDot = 'bg-amber-500';
        } else if (sLower.includes('rotat') || sLower.includes('malposition')) {
          badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs';
          statusDot = 'bg-indigo-500';
        } else if (sLower.includes('fill') || sLower.includes('composite') || sLower.includes('amalgam') || sLower.includes('gic')) {
          badgeBg = 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-xs';
          statusDot = 'bg-cyan-500';
        } else if (sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('veneer')) {
          badgeBg = 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs';
          statusDot = 'bg-amber-500';
        } else if (sLower.includes('healthy')) {
          badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
          statusDot = 'bg-emerald-500';
        }

        return (
          <div
            style={{
              left: `${cardLeft}px`,
              top: `${cardTop}px`
            }}
            className="fixed z-50 pointer-events-none bg-white/98 text-dark-slate p-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] border-2 border-[#4A7CD2] ring-4 ring-[#4A7CD2]/15 backdrop-blur-2xl flex flex-col gap-2.5 w-[280px] animate-fade-in"
          >
            {/* Top Header Row */}
            <div className="flex items-center justify-between border-b border-light-teal/30 pb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusDot} animate-pulse shadow-[0_0_8px_currentColor]`} />
                <span className="font-black text-[#10244B] text-sm tracking-wide">
                  Tooth #{hoveredTooth.toothNum}
                </span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border ${badgeBg} truncate max-w-[135px]`}>
                {hoveredTooth.status || 'Healthy'}
              </span>
            </div>

            {/* Anatomical Name & Position */}
            <div className="flex items-center justify-between text-[11px] text-dark-slate font-extrabold px-0.5">
              <span className="truncate">{hoveredTooth.name}</span>
              <span className="text-[9.5px] font-black text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded-md border border-light-teal/50 shrink-0">
                FDI: #{hoveredTooth.toothNum}
              </span>
            </div>

            {/* Special Rotation Badge (if applicable) */}
            {hoveredTooth.rotationDeg !== 0 && (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-2 shadow-2xs">
                <span className="text-xs">🔄</span>
                <span>Rotation: {hoveredTooth.rotationDeg}° Axial Malposition</span>
              </div>
            )}

            {/* Saved Doctor Observations from DB or Live Chart */}
            <div className="bg-[#F8FAFC] border-l-4 border-[#4A7CD2] border-y border-r border-light-teal/40 rounded-r-xl p-2.5 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#4A7CD2] text-[11px]">📋</span>
                <span className="text-[9.5px] font-black text-[#4A7CD2] uppercase tracking-wider">
                  DOCTOR CLINICAL OBSERVATION
                </span>
              </div>
              <p className="text-[#10244B] font-bold text-[11px] leading-relaxed break-words pl-0.5">
                {(!hoveredTooth.comments || hoveredTooth.comments === "Saved via Save Chart command") ? (
                  hoveredTooth.status && hoveredTooth.status !== 'Healthy'
                    ? `Clinical Record: ${hoveredTooth.status} recorded on Tooth #${hoveredTooth.toothNum}`
                    : 'Intact natural enamel, physiological mobility (Grade 0)'
                ) : (
                  hoveredTooth.comments
                )}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';
import { isNonHealthySurf, getHexColor } from '../../utils/toothDataConstants';

export default function Tooth3DCanvasViewer({
  toothNumber,
  toothData,
  patient,
  surfaceData = {},
  isPediatric,
  toothName,
  tNum,
  tKey
}) {
  const canvasRef = useRef(null);

  // Generate High-Definition Anatomical & Clinical Occlusal Canvas
  const createDetailedToothOcclusalCanvas = (toothIdentifier, currentToothData, patientData, activeSurfaces = {}) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const status = (currentToothData?.status || 'Healthy').toLowerCase();
    const comments = (currentToothData?.comments || currentToothData?.comment || '').toLowerCase();
    const fullDiag = `${status} ${comments}`;

    const isPediatricTooth = typeof toothIdentifier === 'string' && isNaN(parseInt(toothIdentifier, 10));
    const tUpper = String(toothIdentifier).toUpperCase();

    const isImplant = fullDiag.includes('implant');
    const isSSC = !isImplant && (fullDiag.includes('ssc') || fullDiag.includes('stainless'));
    const isCrown = (fullDiag.includes('crown') || fullDiag.includes('bridge') || fullDiag.includes('zirconia') || isSSC) && !isImplant;
    const isRCT = !isImplant && (fullDiag.includes('root canal') || /\brct\b/i.test(fullDiag) || (fullDiag.includes('endo') && !fullDiag.includes('endosseous')));
    const isCaries = !isImplant && !isCrown && (fullDiag.includes('caries') || fullDiag.includes('decay') || fullDiag.includes('cavity') || fullDiag.includes('cavitation') || fullDiag.includes('ecc') || Object.values(activeSurfaces).some(v => v && (v.toLowerCase().includes('caries') || v.toLowerCase().includes('decay'))));
    const isComposite = !isImplant && !isCrown && ((fullDiag.includes('composite') || fullDiag.includes('fill') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('composite'))) && !fullDiag.includes('amalgam'));
    const isAmalgam = !isImplant && !isCrown && (fullDiag.includes('amalgam') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('amalgam')));
    const isPulpotomy = !isImplant && (fullDiag.includes('pulpotomy') || fullDiag.includes('mta'));
    const isOrthodonticBracket = fullDiag.includes('bracket') || fullDiag.includes('orthodontic') || fullDiag.includes('ortho') || fullDiag.includes('brace');
    const isSpaceMaintainer = fullDiag.includes('space') || fullDiag.includes('maintainer') || fullDiag.includes('band');
    const isFluorideVarnish = fullDiag.includes('fluoride') || fullDiag.includes('varnish');
    
    const isMOD = /\bmod\b|mesio-occlusal-distal/i.test(fullDiag) || (isNonHealthySurf(activeSurfaces['M']) && isNonHealthySurf(activeSurfaces['O']) && isNonHealthySurf(activeSurfaces['D']));
    const isDO = (/\bdo\b(?!ctor)/i.test(status) || (/\bdo\b(?!ctor)/i.test(fullDiag) && !/\bdoctor\b|\bdob\b/i.test(fullDiag.replace(/\bdo\b/gi, ''))) || fullDiag.includes('disto-occlusal')) || (isNonHealthySurf(activeSurfaces['D']) && isNonHealthySurf(activeSurfaces['O']) && !isNonHealthySurf(activeSurfaces['M']));
    const isMO = (/\bmo\b/i.test(status) || (/\bmo\b/i.test(fullDiag) && !/\bmolar\b|\bmobility\b/i.test(fullDiag.replace(/\bmo\b/gi, ''))) || fullDiag.includes('mesio-occlusal')) || (isNonHealthySurf(activeSurfaces['M']) && isNonHealthySurf(activeSurfaces['O']) && !isNonHealthySurf(activeSurfaces['D']));
    const isClassV = fullDiag.includes('class v') || fullDiag.includes('cervical') || isNonHealthySurf(activeSurfaces['B']);
    const isMissing = fullDiag.includes('miss') || 
                      fullDiag.includes('extract') || 
                      fullDiag.includes('absent') || 
                      fullDiag.includes('lost') || 
                      fullDiag.includes('exfoliat') || 
                      fullDiag.includes('clinically absent') ||
                      (currentToothData?.color === '#94A3B8' || currentToothData?.color === '#64748B' || (currentToothData?.color === '#DC2626' && fullDiag.includes('extract')));

    // Determine Tooth Category
    let isMolar = false;
    let isPremolar = false;
    let isCanine = false;
    let isIncisor = false;
    let isMaxillary = true;

    if (isPediatricTooth) {
      isMaxillary = ['A','B','C','D','E','F','G','H','I','J'].includes(tUpper);
      isMolar = ['A','B','I','J','K','L','S','T'].includes(tUpper);
      isCanine = ['C','H','M','R'].includes(tUpper);
      isIncisor = ['D','E','F','G','N','O','P','Q'].includes(tUpper);
      isPremolar = false;
    } else {
      const n = parseInt(toothIdentifier, 10) || 1;
      isMolar = n <= 3 || (n >= 14 && n <= 19) || n >= 30;
      isPremolar = n === 4 || n === 5 || n === 12 || n === 13 || n === 20 || n === 21 || n === 28 || n === 29;
      isCanine = n === 6 || n === 11 || n === 22 || n === 27;
      isIncisor = (n >= 7 && n <= 10) || (n >= 23 && n <= 26);
      isMaxillary = n <= 16;
    }

    ctx.clearRect(0, 0, 512, 512);

    // 0. CLINICALLY ABSENT / EXTRACTED EMPTY ALVEOLAR SOCKET RENDERING
    if (isMissing) {
      ctx.save();
      const gumGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 230);
      gumGrad.addColorStop(0, '#FFF1F2');
      gumGrad.addColorStop(0.5, '#FEE2E2');
      gumGrad.addColorStop(1, '#F1F5F9');
      ctx.fillStyle = gumGrad;
      ctx.beginPath();
      ctx.arc(256, 256, 215, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      const socketGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 140);
      socketGrad.addColorStop(0, '#1E293B');
      socketGrad.addColorStop(0.4, '#334155');
      socketGrad.addColorStop(0.8, '#64748B');
      socketGrad.addColorStop(1, '#94A3B8');
      ctx.fillStyle = socketGrad;
      ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      if (isCanine) {
        ctx.moveTo(256, 110);
        ctx.bezierCurveTo(360, 180, 360, 320, 256, 390);
        ctx.bezierCurveTo(152, 320, 152, 180, 256, 110);
      } else if (isMolar) {
        ctx.roundRect(115, 125, 282, 262, [45, 45, 45, 45]);
      } else if (isPremolar) {
        ctx.ellipse(256, 256, 125, 145, 0, 0, Math.PI * 2);
      } else {
        ctx.roundRect(135, 135, 242, 242, [30, 30, 30, 30]);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(isPediatricTooth ? `Primary Tooth ${tUpper}` : `Tooth #${toothIdentifier}`, 25, 485);
      ctx.font = 'normal 12px sans-serif';
      ctx.fillStyle = 'rgba(71, 85, 105, 0.85)';
      ctx.fillText(`${patientData?.firstName || 'Patient'} ${patientData?.lastName || ''}`, 25, 502);
      ctx.restore();
      return canvas;
    }

    // 1. ANATOMICAL TOOTH CROWN BACKGROUND & MARGINAL RIDGES
    ctx.save();
    const toothGrad = ctx.createRadialGradient(256, 256, 20, 256, 256, 210);
    if (isSSC) {
      toothGrad.addColorStop(0, '#FFFFFF');
      toothGrad.addColorStop(0.3, '#E2E8F0');
      toothGrad.addColorStop(0.6, '#94A3B8');
      toothGrad.addColorStop(0.85, '#64748B');
      toothGrad.addColorStop(1, '#475569');
    } else {
      toothGrad.addColorStop(0, '#FFFFFF');
      toothGrad.addColorStop(0.4, '#FDFEFE');
      toothGrad.addColorStop(0.75, '#F4F7FB');
      toothGrad.addColorStop(0.92, '#E2E8F0');
      toothGrad.addColorStop(1, '#CBD5E1');
    }
    ctx.fillStyle = toothGrad;
    ctx.strokeStyle = isSSC ? '#334155' : 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = isSSC ? 8 : 4;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    if (isCanine) {
      ctx.moveTo(256, 85);
      ctx.bezierCurveTo(385, 160, 395, 340, 256, 425);
      ctx.bezierCurveTo(117, 340, 127, 160, 256, 85);
    } else if (isMolar) {
      ctx.roundRect(85, 95, 342, 322, [55, 55, 55, 55]);
    } else if (isPremolar) {
      ctx.ellipse(256, 256, 145, 170, 0, 0, Math.PI * 2);
    } else {
      ctx.roundRect(110, 110, 292, 292, [40, 40, 40, 40]);
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 2. OCCLUSAL TABLE & FISSURE GROOVES ANATOMY
    ctx.save();
    ctx.strokeStyle = isSSC ? 'rgba(71, 85, 105, 0.45)' : 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (isMolar) {
      ctx.moveTo(150, 256);
      ctx.lineTo(362, 256);
      ctx.moveTo(256, 150);
      ctx.lineTo(256, 362);
      ctx.moveTo(180, 180);
      ctx.lineTo(332, 332);
      ctx.moveTo(332, 180);
      ctx.lineTo(180, 332);
      ctx.stroke();
    } else if (isPremolar) {
      // Premolar central developmental groove with triangular fossae
      ctx.moveTo(165, 256);
      ctx.lineTo(347, 256);
      ctx.moveTo(180, 235);
      ctx.lineTo(165, 256);
      ctx.lineTo(180, 277);
      ctx.moveTo(332, 235);
      ctx.lineTo(347, 256);
      ctx.lineTo(332, 277);
      ctx.stroke();
    } else if (isIncisor || isCanine) {
      ctx.moveTo(160, 256);
      ctx.lineTo(352, 256);
      ctx.stroke();
    }
    ctx.restore();

    // 3. CLINICAL DIAGNOSES & SURFACES PAINTING
    // 3A. DENTAL IMPLANT: Titanium Fixture & Screw-Retained Zirconia Crown
    if (isImplant) {
      ctx.save();
      // Outer Surgical Teal Abutment Collar
      const implantRing = ctx.createRadialGradient(256, 256, 30, 256, 256, 125);
      implantRing.addColorStop(0, '#0E8A80');
      implantRing.addColorStop(0.6, '#0F766E');
      implantRing.addColorStop(1, '#134E4A');
      ctx.fillStyle = implantRing;
      ctx.beginPath();
      if (isPremolar) ctx.ellipse(256, 256, 130, 150, 0, 0, Math.PI * 2);
      else if (isMolar) ctx.roundRect(100, 110, 312, 292, [40, 40, 40, 40]);
      else ctx.arc(256, 256, 120, 0, Math.PI * 2);
      ctx.fill();

      // Precision Machined Titanium Collar
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 7;
      ctx.stroke();

      // Screw-Retained Channel Access Hole (Center Chimney)
      const holeGrad = ctx.createRadialGradient(256, 256, 5, 256, 256, 45);
      holeGrad.addColorStop(0, '#020617');
      holeGrad.addColorStop(0.8, '#0F172A');
      holeGrad.addColorStop(1, '#334155');
      ctx.fillStyle = holeGrad;
      ctx.beginPath();
      ctx.arc(256, 256, 44, 0, Math.PI * 2);
      ctx.fill();

      // Internal Hexagonal Titanium Driver Socket (Hex Head)
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 * Math.PI) / 180;
        const hx = 256 + 22 * Math.cos(angle);
        const hy = 256 + 22 * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    } else if (isCrown && !isSSC) {
      // 3B. Full-Coverage Monolithic Ceramic / Zirconia Crown
      ctx.save();
      const crownShine = ctx.createLinearGradient(100, 100, 400, 400);
      crownShine.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      crownShine.addColorStop(0.5, 'rgba(217, 119, 6, 0.25)');
      crownShine.addColorStop(1, 'rgba(245, 158, 11, 0.5)');
      ctx.fillStyle = crownShine;
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 6;
      ctx.beginPath();
      if (isPremolar) ctx.ellipse(256, 256, 140, 165, 0, 0, Math.PI * 2);
      else if (isMolar) ctx.roundRect(90, 100, 332, 312, [50, 50, 50, 50]);
      else ctx.roundRect(115, 115, 282, 282, [38, 38, 38, 38]);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (isPulpotomy && !isSSC) {
      ctx.save();
      const mtaGrad = ctx.createRadialGradient(256, 256, 5, 256, 256, 65);
      mtaGrad.addColorStop(0, '#A855F7');
      mtaGrad.addColorStop(0.5, '#7C3AED');
      mtaGrad.addColorStop(1, '#581C87');
      ctx.fillStyle = mtaGrad;
      ctx.strokeStyle = '#E9D5FF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(256, 256, 68, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F3E8FF';
      ctx.beginPath();
      ctx.arc(245, 248, 6, 0, Math.PI * 2);
      ctx.arc(268, 255, 5, 0, Math.PI * 2);
      ctx.arc(254, 270, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (!isSSC && !isImplant && !isCrown) {
      const getZoneType = (zone) => {
        if (isImplant || isCrown || isSSC) return null;
        const direct = (activeSurfaces[zone] || '').toLowerCase();
        if (direct === 'healthy' || direct === 'normal / healthy' || direct === 'sound' || direct === 'intact' || direct.includes('implant')) return null;
        if (status === 'healthy' || comments.includes('intact primary deciduous enamel') || comments.includes('intact anatomical enamel')) {
          if (!direct || direct === 'healthy') return null;
        }
        if (direct) {
          if (direct.includes('amalgam')) return 'amalgam';
          if (direct.includes('composite') || direct.includes('fill')) return 'composite';
          if (direct.includes('gic')) return 'gic';
          if (direct.includes('caries') || direct.includes('decay') || direct.includes('cavity') || direct.includes('ecc')) return 'caries';
        }
        if (status === 'healthy') return null;

        const s = fullDiag;
        if (s.includes('amalgam')) {
          if (s.includes('mod') && (zone === 'M' || zone === 'O' || zone === 'D')) return 'amalgam';
          if (s.includes('mo') && (zone === 'M' || zone === 'O')) return 'amalgam';
          if (s.includes('do') && (zone === 'D' || zone === 'O')) return 'amalgam';
          if (zone === 'O') return 'amalgam';
        }

        if (s.includes('composite') || s.includes('fill')) {
          if (s.includes('mod') && (zone === 'M' || zone === 'O' || zone === 'D') && !s.includes('amalgam')) return 'composite';
          if (s.includes('mo') && (zone === 'M' || zone === 'O') && !s.includes('amalgam')) return 'composite';
          if (s.includes('do') && (zone === 'D' || zone === 'O') && !s.includes('amalgam')) return 'composite';
          if (zone === 'O') return 'composite';
        }

        if (s.includes('caries') || s.includes('decay') || s.includes('cavity') || s.includes('ecc')) {
          if (s.includes('mod') && (zone === 'M' || zone === 'O' || zone === 'D')) return 'caries';
          if (s.includes('mo') && (zone === 'M' || zone === 'O')) return 'caries';
          if (s.includes('do') && (zone === 'D' || zone === 'O')) return 'caries';
          if (s.includes('class v') && zone === 'B') return 'caries';
          if (zone === 'O') return 'caries';
        }

        return null;
      };

      // Draw Mesial Zone (Left)
      const mType = getZoneType('M');
      if (mType) {
        ctx.save();
        if (mType === 'amalgam') {
          const g = ctx.createRadialGradient(185, 256, 5, 185, 256, 55);
          g.addColorStop(0, '#CBD5E1'); g.addColorStop(0.6, '#64748B'); g.addColorStop(1, '#334155');
          ctx.fillStyle = g; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 4;
        } else if (mType === 'composite') {
          const g = ctx.createRadialGradient(185, 256, 5, 185, 256, 55);
          g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#EFF6FF'); g.addColorStop(1, '#DBEAFE');
          ctx.fillStyle = g; ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 5;
        } else {
          ctx.fillStyle = '#8B5A2B'; ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4;
        }
        ctx.beginPath();
        ctx.ellipse(190, 256, 68, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Distal Zone (Right)
      const dType = getZoneType('D');
      if (dType) {
        ctx.save();
        if (dType === 'amalgam') {
          const g = ctx.createRadialGradient(325, 256, 5, 325, 256, 55);
          g.addColorStop(0, '#CBD5E1'); g.addColorStop(0.6, '#64748B'); g.addColorStop(1, '#334155');
          ctx.fillStyle = g; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 4;
        } else if (dType === 'composite') {
          const g = ctx.createRadialGradient(325, 256, 5, 325, 256, 55);
          g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#EFF6FF'); g.addColorStop(1, '#DBEAFE');
          ctx.fillStyle = g; ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 5;
        } else {
          ctx.fillStyle = '#8B5A2B'; ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4;
        }
        ctx.beginPath();
        ctx.ellipse(322, 256, 68, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Occlusal Central Zone (Center)
      const oType = getZoneType('O');
      if (oType) {
        ctx.save();
        if (oType === 'amalgam') {
          const g = ctx.createRadialGradient(256, 256, 5, 256, 256, 60);
          g.addColorStop(0, '#CBD5E1'); g.addColorStop(0.6, '#64748B'); g.addColorStop(1, '#334155');
          ctx.fillStyle = g; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 4;
        } else if (oType === 'composite') {
          const g = ctx.createRadialGradient(256, 256, 5, 256, 256, 60);
          g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#EFF6FF'); g.addColorStop(1, '#DBEAFE');
          ctx.fillStyle = g; ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 5;
        } else {
          ctx.fillStyle = '#8B5A2B'; ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4;
        }
        ctx.beginPath();
        ctx.ellipse(256, 256, 62, 46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Buccal / Facial / Class V Zone
      const bType = getZoneType('B');
      if (bType) {
        ctx.save();
        if (bType === 'amalgam') {
          ctx.fillStyle = '#64748B'; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 4;
        } else if (bType === 'composite') {
          ctx.fillStyle = '#DBEAFE'; ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 5;
        } else {
          ctx.fillStyle = '#8B5A2B'; ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4;
        }
        ctx.beginPath();
        ctx.ellipse(256, 145, 80, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // D. Adult RCT Endodontic Obturation
    if (isRCT && !isSSC && !isPulpotomy && !isImplant && !isCrown) {
      ctx.save();
      ctx.fillStyle = '#7C3AED';
      ctx.strokeStyle = '#4C1D95';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(256, 256, 56, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(235, 240, 10, 0, Math.PI * 2);
      ctx.arc(277, 240, 10, 0, Math.PI * 2);
      ctx.arc(256, 275, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (isSpaceMaintainer) {
      ctx.save();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 14;
      ctx.beginPath();
      if (isCanine) {
        ctx.moveTo(256, 85);
        ctx.bezierCurveTo(385, 160, 395, 340, 256, 425);
        ctx.bezierCurveTo(117, 340, 127, 160, 256, 85);
      } else if (isMolar) {
        ctx.roundRect(85, 95, 342, 322, [55, 55, 55, 55]);
      } else if (isPremolar) {
        ctx.ellipse(256, 256, 145, 170, 0, 0, Math.PI * 2);
      } else {
        ctx.roundRect(110, 110, 292, 292, [40, 40, 40, 40]);
      }
      ctx.stroke();

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(350, 200);
      ctx.bezierCurveTo(470, 200, 470, 310, 350, 310);
      ctx.stroke();
      ctx.restore();
    } else if (isOrthodonticBracket) {
      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(80, 256);
      ctx.lineTo(432, 256);
      ctx.stroke();

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(80, 256);
      ctx.lineTo(432, 256);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(196, 196, 120, 120, [12, 12, 12, 12]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(206, 206, 46, 100);
      ctx.fillRect(260, 206, 46, 100);

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(196, 246, 120, 20);

      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(201, 201, 110, 110, [10, 10, 10, 10]);
      ctx.stroke();
      ctx.restore();
    }

    const isBoneLoss = fullDiag.includes('bone loss') || fullDiag.includes('periodont') || fullDiag.includes('furcation') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('bone loss'));
    const isResorption = fullDiag.includes('resorption') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('resorption'));
    const isCyst = fullDiag.includes('cyst') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('cyst'));
    const isAbscess = fullDiag.includes('abscess') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('abscess'));
    const isAttrition = fullDiag.includes('attrition') || fullDiag.includes('grinding wear') || fullDiag.includes('bruxism') || fullDiag.includes('flattened') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('attrition'));
    const isErosion = fullDiag.includes('erosion') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('erosion'));
    const isRecession = fullDiag.includes('recession') || fullDiag.includes('exposed root') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('recession'));
    const isCrack = fullDiag.includes('crack') || fullDiag.includes('craze') || fullDiag.includes('microcrack') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('crack'));
    const isSensitivity = fullDiag.includes('sensitivity') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('sensitivity'));

    // Periodontal Alveolar Bone Loss / Furcation Defect Collar
    if (isBoneLoss) {
      ctx.save();
      const boneLossGrad = ctx.createRadialGradient(256, 256, 120, 256, 256, 225);
      boneLossGrad.addColorStop(0, 'rgba(224, 102, 90, 0.1)');
      boneLossGrad.addColorStop(0.65, 'rgba(239, 68, 68, 0.35)');
      boneLossGrad.addColorStop(1, 'rgba(185, 28, 28, 0.7)');
      ctx.fillStyle = boneLossGrad;
      ctx.beginPath();
      ctx.arc(256, 256, 210, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 6;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(256, 256, 195, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Root Resorption / Cyst / Radiolucency Defect
    if (isResorption || isCyst) {
      ctx.save();
      const resorbGrad = ctx.createRadialGradient(256, 256, 5, 256, 256, 75);
      resorbGrad.addColorStop(0, '#581C87');
      resorbGrad.addColorStop(0.5, '#7C3AED');
      resorbGrad.addColorStop(0.85, 'rgba(139, 92, 246, 0.4)');
      resorbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = resorbGrad;
      ctx.beginPath();
      ctx.ellipse(256, 256, 80, 65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(256, 256, 80, 65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Bruxism / Severe Occlusal Attrition (Exposed Dentin)
    if (isAttrition) {
      ctx.save();
      const dentinGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 70);
      dentinGrad.addColorStop(0, '#B45309');
      dentinGrad.addColorStop(0.6, '#D97706');
      dentinGrad.addColorStop(1, '#F59E0B');
      ctx.fillStyle = dentinGrad;
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(180, 190, 152, 132, [25, 25, 25, 25]);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Enamel Chemical Erosion (Translucent cupping)
    if (isErosion) {
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(256, 256, 95, 75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Cervical Gum Recession & Dentin Sensitivity
    if (isRecession || isSensitivity) {
      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(256, 140, 90, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Cracked Enamel Line
    if (isCrack) {
      ctx.save();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(256, 120);
      ctx.lineTo(252, 190);
      ctx.lineTo(260, 260);
      ctx.lineTo(254, 330);
      ctx.lineTo(256, 390);
      ctx.stroke();

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Traumatic Chipped / Fractured Enamel Fragment
    const isChipped = fullDiag.includes('chipped') || fullDiag.includes('fractur') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('chipped'));
    if (isChipped) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 360);
      ctx.lineTo(200, 420);
      ctx.lineTo(280, 400);
      ctx.lineTo(310, 370);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Pit & Fissure Sealant Layer (Cyan glossy resin flowing in grooves)
    const isSealant = fullDiag.includes('sealant') || fullDiag.includes('varnish');
    if (isSealant) {
      ctx.save();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(180, 256);
      ctx.lineTo(332, 256);
      ctx.moveTo(256, 180);
      ctx.lineTo(256, 332);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // Inlay / Onlay Restoration (Precision Gold/Ceramic Margin)
    const isInlay = fullDiag.includes('inlay') || fullDiag.includes('onlay');
    if (isInlay) {
      ctx.save();
      ctx.fillStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(175, 175, 162, 162, [20, 20, 20, 20]);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Porcelain Veneer (Labial Facial Layer)
    const isVeneer = fullDiag.includes('veneer');
    if (isVeneer) {
      ctx.save();
      const veneerGrad = ctx.createLinearGradient(120, 100, 120, 400);
      veneerGrad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
      veneerGrad.addColorStop(1, 'rgba(192, 132, 252, 0.15)');
      ctx.fillStyle = veneerGrad;
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(100, 100, 312, 312, [35, 35, 35, 35]);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Post & Core Foundation (Central titanium/fiber post)
    const isPostCore = fullDiag.includes('post and core') || fullDiag.includes('post & core') || fullDiag.includes('post build');
    if (isPostCore) {
      ctx.save();
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(226, 176, 60, 160, [10, 10, 10, 10]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(256, 256, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Acute Periapical Abscess (Purulent focus)
    if (isAbscess) {
      ctx.save();
      const abscessGrad = ctx.createRadialGradient(256, 360, 5, 256, 360, 60);
      abscessGrad.addColorStop(0, '#FEF08A');
      abscessGrad.addColorStop(0.5, '#EF4444');
      abscessGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = abscessGrad;
      ctx.beginPath();
      ctx.arc(256, 360, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Impacted Tooth Angulation Frame
    const isImpacted = fullDiag.includes('impacted') || fullDiag.includes('impaction');
    if (isImpacted) {
      ctx.save();
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(60, 60, 392, 392);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Dental Arch Crowding
    const isCrowding = fullDiag.includes('crowding') || fullDiag.includes('crowded');
    if (isCrowding) {
      ctx.save();
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(80, 256);
      ctx.lineTo(160, 210);
      ctx.moveTo(432, 256);
      ctx.lineTo(352, 302);
      ctx.stroke();
      ctx.restore();
    }

    // Axial Rotation / Orthodontic Torque Indicator Overlay
    const isRotation = fullDiag.includes('rotation') || fullDiag.includes('rotated') || fullDiag.includes('axial rotation');
    if (isRotation) {
      ctx.save();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(256, 256, 215, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotational arrow heads
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.moveTo(420, 290);
      ctx.lineTo(445, 330);
      ctx.lineTo(405, 325);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(92, 222);
      ctx.lineTo(67, 182);
      ctx.lineTo(107, 187);
      ctx.closePath();
      ctx.fill();

      // Rotation angle badge
      ctx.fillStyle = '#1E40AF';
      ctx.beginPath();
      ctx.roundRect(148, 236, 216, 40, [12, 12, 12, 12]);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔄 35° AXIAL ROTATION', 256, 256);
      ctx.restore();
    }

    return canvas;
  };

  // Refs to persist Three.js scene across tooth navigations (Zero WebGL teardowns)
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const crownMeshRef = useRef(null);
  const textureMapRef = useRef(null);
  const animIdRef = useRef(null);

  // 1. Initialize Three.js Scene, Camera, Renderer & Mesh (Only once on mount)
  useEffect(() => {
    if (!canvasRef.current) return;

    let isDisposed = false;
    let renderer, scene, camera, crownMesh, textureMap, crownGeo, crownMat;
    let animId;

    try {
      const container = canvasRef.current;
      const width = container.clientWidth || 340;
      const height = container.clientHeight || 300;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xF8FAFC);
      sceneRef.current = scene;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 4.6);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      const backLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
      backLight.position.set(-5, -5, -5);
      scene.add(backLight);

      // Initial Canvas & Texture
      const initialCanvas = createDetailedToothOcclusalCanvas(isPediatric ? tKey : tNum, toothData, patient, surfaceData);
      textureMap = new THREE.CanvasTexture(initialCanvas);
      textureMap.colorSpace = THREE.SRGBColorSpace;
      textureMapRef.current = textureMap;

      crownGeo = new THREE.PlaneGeometry(2.35, 2.35);
      crownMat = new THREE.MeshStandardMaterial({
        map: textureMap,
        transparent: true,
        roughness: 0.2,
        metalness: 0.05
      });

      crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.set(0, 0, 0);

      const toothDiagStr = `${toothData?.status || ''} ${toothData?.comments || ''}`.toLowerCase();
      if (toothData?.rotationDeg) {
        crownMesh.rotation.z = (toothData.rotationDeg * Math.PI) / 180;
      } else if (toothDiagStr.includes('rotation') || toothDiagStr.includes('rotated')) {
        crownMesh.rotation.z = (35 * Math.PI) / 180;
      }
      crownMeshRef.current = crownMesh;
      scene.add(crownMesh);

      // Drag / Orbit Rotation
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      const onMouseDown = (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseMove = (e) => {
        if (!isDragging || !crownMesh) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        crownMesh.rotation.y += deltaX * 0.01;
        crownMesh.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      container.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Animation Loop with gentle 3D perspective yaw
      let startTime = Date.now();
      const animate = () => {
        if (isDisposed) return;
        animId = requestAnimationFrame(animate);
        animIdRef.current = animId;
        if (!isDragging && crownMesh) {
          const elapsed = (Date.now() - startTime) * 0.001;
          crownMesh.rotation.y = Math.sin(elapsed * 0.8) * 0.15;
          crownMesh.rotation.x = Math.cos(elapsed * 0.6) * 0.08;
        }
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        isDisposed = true;
        if (animId) cancelAnimationFrame(animId);
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        try {
          crownGeo?.dispose();
          crownMat?.dispose();
          textureMap?.dispose();
          scene?.clear();
          renderer?.dispose();
          renderer?.forceContextLoss();
          if (renderer?.domElement?.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        } catch (cleanupErr) {}
      };
    } catch (threeErr) {
      console.error("[ToothDetailPage] Error initializing Three.js canvas:", threeErr);
    }
  }, []);

  // 2. High-Speed Texture & Rotation Update (Zero WebGL Rebuild, < 2ms instant update)
  useEffect(() => {
    if (!crownMeshRef.current || !textureMapRef.current || !toothData) return;

    try {
      const updatedCanvas = createDetailedToothOcclusalCanvas(isPediatric ? tKey : tNum, toothData, patient, surfaceData);
      textureMapRef.current.image = updatedCanvas;
      textureMapRef.current.needsUpdate = true;

      const toothDiagStr = `${toothData?.status || ''} ${toothData?.comments || ''}`.toLowerCase();
      if (toothData?.rotationDeg) {
        crownMeshRef.current.rotation.z = (toothData.rotationDeg * Math.PI) / 180;
      } else if (toothDiagStr.includes('rotation') || toothDiagStr.includes('rotated')) {
        crownMeshRef.current.rotation.z = (35 * Math.PI) / 180;
      } else {
        crownMeshRef.current.rotation.z = 0;
      }
    } catch (updateErr) {
      console.warn("[Tooth3DCanvasViewer] Error updating texture:", updateErr);
    }
  }, [toothNumber, tNum, tKey, toothData, surfaceData, isPediatric, patient]);

  const fullDiagnosisText = `${toothData?.status || ''} ${toothData?.comments || ''} ${toothData?.comment || ''}`.toLowerCase();
  const isImplantDiag = fullDiagnosisText.includes('implant');
  const isCrownDiag = (fullDiagnosisText.includes('crown') || fullDiagnosisText.includes('zirconia') || fullDiagnosisText.includes('pfm') || fullDiagnosisText.includes('ceramic')) && !isImplantDiag && !fullDiagnosisText.includes('ssc');
  const isBoneLossDiag = fullDiagnosisText.includes('bone loss') || fullDiagnosisText.includes('periodont') || fullDiagnosisText.includes('furcation');
  const isResorptionDiag = fullDiagnosisText.includes('resorption') || fullDiagnosisText.includes('cyst');
  const isAttritionDiag = fullDiagnosisText.includes('attrition') || fullDiagnosisText.includes('grinding wear') || fullDiagnosisText.includes('bruxism');
  const isErosionDiag = fullDiagnosisText.includes('erosion');
  const isSensitivityDiag = fullDiagnosisText.includes('sensitivity') || fullDiagnosisText.includes('recession');
  const isCrackDiag = fullDiagnosisText.includes('crack');
  const isChippedDiag = fullDiagnosisText.includes('chipped') || fullDiagnosisText.includes('fractur');
  const isRotationDiag = fullDiagnosisText.includes('rotation') || fullDiagnosisText.includes('rotated');
  const isDiastemaDiag = fullDiagnosisText.includes('diastema') || fullDiagnosisText.includes('spacing') || fullDiagnosisText.includes('gap');
  const isCrowdingDiag = fullDiagnosisText.includes('crowding') || fullDiagnosisText.includes('crowded');
  const isPulpotomyDiag = fullDiagnosisText.includes('pulpotomy') || fullDiagnosisText.includes('mta');
  const isAbscessDiag = fullDiagnosisText.includes('abscess');
  const isRctDiag = !isImplantDiag && (fullDiagnosisText.includes('rct') || fullDiagnosisText.includes('root canal') || (fullDiagnosisText.includes('endo') && !fullDiagnosisText.includes('endosseous')));
  const isSpaceDiag = fullDiagnosisText.includes('space') || fullDiagnosisText.includes('maintainer');
  const isFoodImpactionDiag = fullDiagnosisText.includes('food impaction') || fullDiagnosisText.includes('open contact');

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-2.5 border-b border-light-teal/20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-xs font-black text-[#10244B] uppercase tracking-wider">
            Interactive 3D Occlusal Model
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500">
            360° Drag Orbit View
          </span>
        </div>
      </div>

      {/* 3D Canvas Viewport with High-Contrast Floating Badges */}
      <div className="w-full h-[320px] flex items-center justify-center my-2 relative bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200/80 overflow-hidden shadow-inner">
        {/* Three.js Canvas Element */}
        <div ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center" />

        {/* PROMINENT TOP DIAGNOSTIC BADGE (Always Upright & Highly Readable) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {isRotationDiag ? (
            <div className="bg-blue-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-blue-400 flex items-center gap-2 animate-pulse">
              <span className="text-xs">🔄</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                AXIAL ROTATION MALPOSITION (35° Mesio-Lingual Torque · CDT D8080)
              </span>
            </div>
          ) : isChippedDiag ? (
            <div className="bg-orange-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-orange-400 flex items-center gap-2">
              <span className="text-xs">💥</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                CHIPPED / TRAUMATIC INCISAL FRACTURE (CDT D2999)
              </span>
            </div>
          ) : isDiastemaDiag ? (
            <div className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-indigo-400 flex items-center gap-2">
              <span className="text-xs">↔️</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                INTERDENTAL DIASTEMA / MIDLINE GAP (CDT D8080)
              </span>
            </div>
          ) : isCrowdingDiag ? (
            <div className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-indigo-400 flex items-center gap-2">
              <span className="text-xs">🔀</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                DENTAL ARCH CROWDING & OVERLAP (CDT D8080)
              </span>
            </div>
          ) : isAbscessDiag ? (
            <div className="bg-rose-700 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-rose-400 flex items-center gap-2 animate-bounce">
              <span className="text-xs">🔴</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                ACUTE PERIAPICAL ABSCESS · SUPPURATION (CDT D7510)
              </span>
            </div>
          ) : isImplantDiag ? (
            <div className="bg-teal-700 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-teal-400/50 flex items-center gap-2">
              <span className="text-xs">🔩</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                TITANIUM IMPLANT · SCREW-RETAINED ZIRCONIA CROWN (CDT D6010 / D6058)
              </span>
            </div>
          ) : isCrownDiag ? (
            <div className="bg-amber-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-amber-400 flex items-center gap-2">
              <span className="text-xs">👑</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                FULL-COVERAGE MONOLITHIC ZIRCONIA CROWN (CDT D2740)
              </span>
            </div>
          ) : isBoneLossDiag ? (
            <div className="bg-rose-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-rose-400/50 flex items-center gap-2 animate-bounce">
              <span className="text-xs">⚠️</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                BONE LOSS (6–7mm Deep Pockets · Furcation Defect)
              </span>
            </div>
          ) : isResorptionDiag ? (
            <div className="bg-purple-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-purple-400/50 flex items-center gap-2">
              <span className="text-xs">🟣</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                ROOT RESORPTION DEFECT (CDT D3450)
              </span>
            </div>
          ) : isAttritionDiag ? (
            <div className="bg-amber-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-amber-400/50 flex items-center gap-2">
              <span className="text-xs">🟡</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                SEVERE OCCLUSAL ATTRITION · EXPOSED DENTIN
              </span>
            </div>
          ) : isErosionDiag ? (
            <div className="bg-amber-500 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-amber-300 flex items-center gap-2">
              <span className="text-xs">🧪</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                ENAMEL CHEMICAL ACID EROSION
              </span>
            </div>
          ) : isSensitivityDiag ? (
            <div className="bg-blue-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-blue-400/50 flex items-center gap-2">
              <span className="text-xs">⚡</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                CERVICAL ROOT SENSITIVITY ZONE (CDT D9910)
              </span>
            </div>
          ) : isCrackDiag ? (
            <div className="bg-orange-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-orange-400 flex items-center gap-2">
              <span className="text-xs">⚡</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                ENAMEL MICRO-CRACK LINE (CDT D2740)
              </span>
            </div>
          ) : isFoodImpactionDiag ? (
            <div className="bg-blue-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-blue-400/50 flex items-center gap-2">
              <span className="text-xs">🔵</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                INTERPROXIMAL RESTORATION · TIGHT CONTACT (CDT D2392)
              </span>
            </div>
          ) : isPulpotomyDiag ? (
            <div className="bg-purple-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-purple-400/50 flex items-center gap-2">
              <span className="text-xs">🟣</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                CORONAL PULPOTOMY MTA BARRIER (CDT D3220)
              </span>
            </div>
          ) : isRctDiag ? (
            <div className="bg-purple-700 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-purple-500 flex items-center gap-2">
              <span className="text-xs">🟣</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                ROOT CANAL OBTURATED (CDT D3330)
              </span>
            </div>
          ) : isSpaceDiag ? (
            <div className="bg-sky-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-sky-400 flex items-center gap-2">
              <span className="text-xs">🟡</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                FIXED SPACE MAINTAINER (CDT D1510)
              </span>
            </div>
          ) : (
            <div className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl shadow-md border border-emerald-400/50 flex items-center gap-2">
              <span className="text-xs">✓</span>
              <span className="text-[11px] font-black tracking-wide uppercase">
                INTACT SOUND ANATOMICAL ENAMEL
              </span>
            </div>
          )}

          <div className="bg-white/95 text-slate-800 px-3 py-1 rounded-xl shadow-md border border-slate-300 text-[11px] font-black pointer-events-auto">
            {isPediatric ? `Primary ${tKey}` : `Tooth #${tNum}`}
          </div>
        </div>

        {/* PROMINENT BOTTOM PATIENT & TOOTH IDENTITY BANNER (Always Upright & Clear) */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-300 shadow-md flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isPediatric ? 'Pediatric Dentition' : 'Adult Permanent Dentition'}
            </p>
            <p className="text-xs font-black text-[#10244B]">
              {isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`} · {patient?.firstName || 'Patient'} {patient?.lastName || ''}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Interactive 3D View
            </span>
          </div>
        </div>
      </div>

      {/* Active Status Badge Bar */}
      <div className="w-full bg-[#F8FAFC] border border-light-teal/30 rounded-2xl p-3.5 flex items-center justify-between mt-1">
        <div>
          <p className="text-[10px] font-extrabold uppercase text-muted-text">Primary Clinical Status</p>
          <p className="text-xs font-black text-[#4A7CD2] mt-0.5">{toothData?.status || 'Healthy'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-extrabold uppercase text-muted-text">Condition Color</p>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: toothData?.color || getHexColor(toothData?.status) }} />
            <span className="text-xs font-black text-slate-800">{toothData?.color || getHexColor(toothData?.status)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

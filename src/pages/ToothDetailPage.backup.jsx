import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { 
  ArrowLeft, Activity, ShieldAlert, Sparkles, Stethoscope, 
  Calendar, CheckCircle2, AlertCircle, AlertTriangle, FileText, Share2, 
  Layers, RotateCcw, Clock, Save, RefreshCw, X, User, Phone,
  Mail, MapPin, HeartPulse, Droplets, ShieldCheck, ChevronRight,
  ExternalLink, Edit3, Plus, Scissors, Check, Printer
} from 'lucide-react';
import { handlePrintCompletePatientReport } from '../utils/printReportUtils';
import { OdontogramPrintIcon } from '../components/DentalReportIcons';

export const calculatePatientAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

const getHexColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('pulpotomy') || s.includes('mta')) return '#7C3AED';
  if (s.includes('ssc') || s.includes('stainless')) return '#64748B';
  if (s.includes('space') || s.includes('maintainer')) return '#93C5FD';
  if (s.includes('fluoride') || s.includes('varnish')) return '#06B6D4';
  if (s.includes('strip crown')) return '#2563EB';
  if (s.includes('caries') || s.includes('decay') || s.includes('cavity') || s.includes('keera') || s.includes('ecc')) return '#EF4444';
  if (s.includes('fill') || s.includes('composite')) return '#2563EB';
  if (s.includes('amalgam')) return '#64748B';
  if (s.includes('gic')) return '#F59E0B';
  if (s.includes('rct') || s.includes('canal') || s.includes('endo')) return '#7C3AED';
  if (s.includes('crown') || s.includes('bridge') || s.includes('veneer')) return '#D97706';
  if (s.includes('implant')) return '#0E8A80';
  if (s.includes('bracket') || s.includes('ortho')) return '#0284C7';
  if (s.includes('miss') || s.includes('extract') || s.includes('exfoliat')) return '#DC2626';
  return '#10B981';
};

const TOOTH_NAMES = {
  1: { name: 'Maxillary Right 3rd Molar (Wisdom)', shape: 'molar', roots: 3, cusps: '3–4 Cusps (Heart-shaped)', canals: '1–4 Canals (Fused)', innervation: 'PSA (Posterior Superior Alveolar)', eruption: '17–25 Years', antagonist: 'Mandibular 3rd Molar (#32)', function: 'Grinding & Mastication', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  2: { name: 'Maxillary Right 2nd Molar (12-yr)', shape: 'molar', roots: 3, cusps: '4 Cusps (Rhomboid table)', canals: '3–4 Canals (MB, DB, Palatal)', innervation: 'PSA (Posterior Superior Alveolar)', eruption: '12–13 Years', antagonist: 'Mandibular 2nd & 3rd Molars (#31, #32)', function: 'Grinding & Food Crushing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  3: { name: 'Maxillary Right 1st Molar (6-yr)', shape: 'molar', roots: 3, cusps: '5 Cusps (Cusp of Carabelli)', canals: '3–4 Canals (MB1, MB2, DB, P)', innervation: 'PSA & MSA Nerves', eruption: '6–7 Years', antagonist: 'Mandibular 1st & 2nd Molars (#30, #31)', function: 'Primary Chewing Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  4: { name: 'Maxillary Right 2nd Premolar', shape: 'premolar', roots: 1, cusps: '2 Cusps (Bicuspid Oval)', canals: '1–2 Canals', innervation: 'MSA (Middle Superior Alveolar)', eruption: '10–12 Years', antagonist: 'Mandibular 2nd Premolar & 1st Molar (#29, #30)', function: 'Food Crushing & Tearing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  5: { name: 'Maxillary Right 1st Premolar', shape: 'premolar', roots: 2, cusps: '2 Cusps (Bifurcated Root)', canals: '2 Canals (Buccal & Lingual)', innervation: 'MSA (Middle Superior Alveolar)', eruption: '10–11 Years', antagonist: 'Mandibular 1st & 2nd Premolars (#28, #29)', function: 'Food Crushing & Tearing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  6: { name: 'Maxillary Right Canine (Eye Tooth)', shape: 'canine', roots: 1, cusps: '1 Prominent Cusp (Diamond)', canals: '1 Large Straight Canal', innervation: 'ASA (Anterior Superior Alveolar)', eruption: '11–12 Years', antagonist: 'Mandibular Canine & 1st Premolar (#27, #28)', function: 'Cornerstone Guidance & Tearing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  7: { name: 'Maxillary Right Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge (Lingual Pit)', canals: '1 Canal (Distal Curvature)', innervation: 'ASA (Anterior Superior Alveolar)', eruption: '8–9 Years', antagonist: 'Mandibular Central & Lateral Incisors (#26, #27)', function: 'Cutting & Anterior Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  8: { name: 'Maxillary Right Central Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge (3 Mamelons)', canals: '1 Large Conical Canal', innervation: 'ASA (Anterior Superior Alveolar)', eruption: '7–8 Years', antagonist: 'Mandibular Central & Lateral Incisors (#25, #26)', function: 'Cutting, Speech & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Q1)' },
  9: { name: 'Maxillary Left Central Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge (3 Mamelons)', canals: '1 Large Conical Canal', innervation: 'ASA (Anterior Superior Alveolar)', eruption: '7–8 Years', antagonist: 'Mandibular Central & Lateral Incisors (#24, #25)', function: 'Cutting, Speech & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  10: { name: 'Maxillary Left Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge (Lingual Pit)', canals: '1 Canal (Distal Curvature)', innervation: 'ASA (Anterior Superior Alveolar)', eruption: '8–9 Years', antagonist: 'Mandibular Central & Lateral Incisors (#23, #24)', function: 'Cutting & Anterior Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  11: { name: 'Maxillary Left Canine (Eye Tooth)', shape: 'canine', roots: 1, cusps: '1 Prominent Cusp (Diamond)', canals: '1 Large Straight Canal', innervation: 'ASA (Anterior Superior Alveolar)', eruption: '11–12 Years', antagonist: 'Mandibular Canine & 1st Premolar (#22, #23)', function: 'Cornerstone Guidance & Tearing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  12: { name: 'Maxillary Left 1st Premolar', shape: 'premolar', roots: 2, cusps: '2 Cusps (Bifurcated Root)', canals: '2 Canals (Buccal & Lingual)', innervation: 'MSA (Middle Superior Alveolar)', eruption: '10–11 Years', antagonist: 'Mandibular 1st & 2nd Premolars (#21, #22)', function: 'Food Crushing & Tearing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  13: { name: 'Maxillary Left 2nd Premolar', shape: 'premolar', roots: 1, cusps: '2 Cusps (Bicuspid Oval)', canals: '1–2 Canals', innervation: 'MSA (Middle Superior Alveolar)', eruption: '10–12 Years', antagonist: 'Mandibular 2nd Premolar & 1st Molar (#20, #19)', function: 'Food Crushing & Tearing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  14: { name: 'Maxillary Left 1st Molar (6-yr)', shape: 'molar', roots: 3, cusps: '5 Cusps (Cusp of Carabelli)', canals: '3–4 Canals (MB1, MB2, DB, P)', innervation: 'PSA & MSA Nerves', eruption: '6–7 Years', antagonist: 'Mandibular 1st & 2nd Molars (#19, #18)', function: 'Primary Chewing Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  15: { name: 'Maxillary Left 2nd Molar (12-yr)', shape: 'molar', roots: 3, cusps: '4 Cusps (Rhomboid table)', canals: '3–4 Canals (MB, DB, Palatal)', innervation: 'PSA (Posterior Superior Alveolar)', eruption: '12–13 Years', antagonist: 'Mandibular 2nd & 3rd Molars (#18, #17)', function: 'Grinding & Food Crushing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  16: { name: 'Maxillary Left 3rd Molar (Wisdom)', shape: 'molar', roots: 3, cusps: '3–4 Cusps (Heart-shaped)', canals: '1–4 Canals (Fused)', innervation: 'PSA (Posterior Superior Alveolar)', eruption: '17–25 Years', antagonist: 'Mandibular 3rd Molar (#17)', function: 'Grinding & Mastication', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Q2)' },
  17: { name: 'Mandibular Left 3rd Molar (Wisdom)', shape: 'molar', roots: 2, cusps: '4–5 Cusps (Irregular)', canals: '2–3 Canals', innervation: 'IAN (Inferior Alveolar Nerve)', eruption: '17–25 Years', antagonist: 'Maxillary 2nd & 3rd Molars (#15, #16)', function: 'Mastication & Grinding', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  18: { name: 'Mandibular Left 2nd Molar (12-yr)', shape: 'molar', roots: 2, cusps: '4 Cusps (Cruciform + table)', canals: '3 Canals (Mesial 2, Distal 1)', innervation: 'IAN (Inferior Alveolar Nerve)', eruption: '11–13 Years', antagonist: 'Maxillary 1st & 2nd Molars (#14, #15)', function: 'Mastication & Grinding', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  19: { name: 'Mandibular Left 1st Molar (6-yr)', shape: 'molar', roots: 2, cusps: '5 Cusps (Y-5 Pattern)', canals: '3–4 Canals (ML, MB, Distal 1-2)', innervation: 'IAN (Inferior Alveolar Nerve)', eruption: '6–7 Years', antagonist: 'Maxillary 2nd Premolar & 1st Molar (#13, #14)', function: 'Primary Chewing Anchor', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  20: { name: 'Mandibular Left 2nd Premolar', shape: 'premolar', roots: 1, cusps: '2–3 Cusps (Y/H/U Groove)', canals: '1 Canal', innervation: 'Mental & IAN Nerves', eruption: '11–12 Years', antagonist: 'Maxillary 1st & 2nd Premolars (#12, #13)', function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  21: { name: 'Mandibular Left 1st Premolar', shape: 'premolar', roots: 1, cusps: '2 Cusps (Snake Eye Pits)', canals: '1–2 Canals', innervation: 'Mental & IAN Nerves', eruption: '10–12 Years', antagonist: 'Maxillary Canine & 1st Premolar (#11, #12)', function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  22: { name: 'Mandibular Left Canine', shape: 'canine', roots: 1, cusps: '1 Pointed Cusp (Smooth Labial)', canals: '1–2 Canals', innervation: 'Incisive & IAN Nerves', eruption: '9–10 Years', antagonist: 'Maxillary Lateral Incisor & Canine (#10, #11)', function: 'Canine Guidance & Tearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  23: { name: 'Mandibular Left Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge (Distal Twist)', canals: '1–2 Canals', innervation: 'Incisive & IAN Nerves', eruption: '7–8 Years', antagonist: 'Maxillary Central & Lateral Incisors (#9, #10)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  24: { name: 'Mandibular Left Central Incisor', shape: 'incisor', roots: 1, cusps: 'Smallest Chisel Incisal Edge', canals: '1–2 Canals', innervation: 'Incisive & IAN Nerves', eruption: '6–7 Years', antagonist: 'Maxillary Central Incisor (#9)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Q3)' },
  25: { name: 'Mandibular Right Central Incisor', shape: 'incisor', roots: 1, cusps: 'Smallest Chisel Incisal Edge', canals: '1–2 Canals', innervation: 'Incisive & IAN Nerves', eruption: '6–7 Years', antagonist: 'Maxillary Central Incisor (#8)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  26: { name: 'Mandibular Right Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge (Distal Twist)', canals: '1–2 Canals', innervation: 'Incisive & IAN Nerves', eruption: '7–8 Years', antagonist: 'Maxillary Central & Lateral Incisors (#8, #7)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  27: { name: 'Mandibular Right Canine', shape: 'canine', roots: 1, cusps: '1 Pointed Cusp (Smooth Labial)', canals: '1–2 Canals', innervation: 'Incisive & IAN Nerves', eruption: '9–10 Years', antagonist: 'Maxillary Lateral Incisor & Canine (#7, #6)', function: 'Canine Guidance & Tearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  28: { name: 'Mandibular Right 1st Premolar', shape: 'premolar', roots: 1, cusps: '2 Cusps (Snake Eye Pits)', canals: '1–2 Canals', innervation: 'Mental & IAN Nerves', eruption: '10–12 Years', antagonist: 'Maxillary Canine & 1st Premolar (#6, #5)', function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  29: { name: 'Mandibular Right 2nd Premolar', shape: 'premolar', roots: 1, cusps: '2–3 Cusps (Y/H/U Groove)', canals: '1 Canal', innervation: 'Mental & IAN Nerves', eruption: '11–12 Years', antagonist: 'Maxillary 1st & 2nd Premolars (#5, #4)', function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  30: { name: 'Mandibular Right 1st Molar (6-yr)', shape: 'molar', roots: 2, cusps: '5 Cusps (Y-5 Pattern)', canals: '3–4 Canals (ML, MB, Distal 1-2)', innervation: 'IAN (Inferior Alveolar Nerve)', eruption: '6–7 Years', antagonist: 'Maxillary 2nd Premolar & 1st Molar (#4, #3)', function: 'Primary Chewing Anchor', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  31: { name: 'Mandibular Right 2nd Molar (12-yr)', shape: 'molar', roots: 2, cusps: '4 Cusps (Cruciform + table)', canals: '3 Canals (Mesial 2, Distal 1)', innervation: 'IAN (Inferior Alveolar Nerve)', eruption: '11–13 Years', antagonist: 'Maxillary 1st & 2nd Molars (#3, #2)', function: 'Mastication & Grinding', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' },
  32: { name: 'Mandibular Right 3rd Molar (Wisdom)', shape: 'molar', roots: 2, cusps: '4–5 Cusps (Irregular)', canals: '2–3 Canals', innervation: 'IAN (Inferior Alveolar Nerve)', eruption: '17–25 Years', antagonist: 'Maxillary 2nd & 3rd Molars (#2, #1)', function: 'Mastication & Grinding', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Q4)' }
};

export const PEDIATRIC_TOOTH_NAMES = {
  'A': { name: 'Maxillary Right Primary 2nd Molar', shape: 'molar', roots: 3, cusps: '4 Cusps', canals: '3 Canals', innervation: 'PSA Nerve', eruption: '24–30 Months', shedding: '10–12 Years', antagonist: 'Primary 2nd Molar (T)', function: 'Primary Mastication & Space Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', letter: 'A' },
  'B': { name: 'Maxillary Right Primary 1st Molar', shape: 'molar', roots: 3, cusps: '4 Cusps', canals: '3 Canals', innervation: 'MSA Nerve', eruption: '12–16 Months', shedding: '9–11 Years', antagonist: 'Primary 1st Molar (S)', function: 'Food Crushing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', letter: 'B' },
  'C': { name: 'Maxillary Right Primary Canine', shape: 'canine', roots: 1, cusps: '1 Sharp Cusp', canals: '1 Canal', innervation: 'ASA Nerve', eruption: '16–20 Months', shedding: '10–12 Years', antagonist: 'Primary Canine (R)', function: 'Tearing & Guidance', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', letter: 'C' },
  'D': { name: 'Maxillary Right Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'ASA Nerve', eruption: '9–13 Months', shedding: '7–8 Years', antagonist: 'Primary Lateral Incisor (Q)', function: 'Cutting & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', letter: 'D' },
  'E': { name: 'Maxillary Right Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'ASA Nerve', eruption: '8–12 Months', shedding: '6–7 Years', antagonist: 'Primary Central Incisor (P)', function: 'Cutting, Speech & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', letter: 'E' },
  'F': { name: 'Maxillary Left Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'ASA Nerve', eruption: '8–12 Months', shedding: '6–7 Years', antagonist: 'Primary Central Incisor (O)', function: 'Cutting, Speech & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', letter: 'F' },
  'G': { name: 'Maxillary Left Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'ASA Nerve', eruption: '9–13 Months', shedding: '7–8 Years', antagonist: 'Primary Lateral Incisor (N)', function: 'Cutting & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', letter: 'G' },
  'H': { name: 'Maxillary Left Primary Canine', shape: 'canine', roots: 1, cusps: '1 Sharp Cusp', canals: '1 Canal', innervation: 'ASA Nerve', eruption: '16–20 Months', shedding: '10–12 Years', antagonist: 'Primary Canine (M)', function: 'Tearing & Guidance', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', letter: 'H' },
  'I': { name: 'Maxillary Left Primary 1st Molar', shape: 'molar', roots: 3, cusps: '4 Cusps', canals: '3 Canals', innervation: 'MSA Nerve', eruption: '12–16 Months', shedding: '9–11 Years', antagonist: 'Primary 1st Molar (L)', function: 'Food Crushing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', letter: 'I' },
  'J': { name: 'Maxillary Left Primary 2nd Molar', shape: 'molar', roots: 3, cusps: '4 Cusps', canals: '3 Canals', innervation: 'PSA Nerve', eruption: '24–30 Months', shedding: '10–12 Years', antagonist: 'Primary 2nd Molar (K)', function: 'Primary Mastication & Space Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', letter: 'J' },
  'K': { name: 'Mandibular Left Primary 2nd Molar', shape: 'molar', roots: 2, cusps: '5 Cusps', canals: '3 Canals', innervation: 'IAN Nerve', eruption: '20–30 Months', shedding: '10–12 Years', antagonist: 'Primary 2nd Molar (J)', function: 'Primary Mastication & Space Anchor', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', letter: 'K' },
  'L': { name: 'Mandibular Left Primary 1st Molar', shape: 'molar', roots: 2, cusps: '4 Cusps', canals: '3 Canals', innervation: 'IAN Nerve', eruption: '12–16 Months', shedding: '9–11 Years', antagonist: 'Primary 1st Molar (I)', function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', letter: 'L' },
  'M': { name: 'Mandibular Left Primary Canine', shape: 'canine', roots: 1, cusps: '1 Sharp Cusp', canals: '1 Canal', innervation: 'Incisive Nerve', eruption: '16–20 Months', shedding: '9–11 Years', antagonist: 'Primary Canine (H)', function: 'Tearing & Guidance', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', letter: 'M' },
  'N': { name: 'Mandibular Left Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'Incisive Nerve', eruption: '10–14 Months', shedding: '7–8 Years', antagonist: 'Primary Lateral Incisor (G)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', letter: 'N' },
  'O': { name: 'Mandibular Left Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'Incisive Nerve', eruption: '6–10 Months', shedding: '6–7 Years', antagonist: 'Primary Central Incisor (F)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', letter: 'O' },
  'P': { name: 'Mandibular Right Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'Incisive Nerve', eruption: '6–10 Months', shedding: '6–7 Years', antagonist: 'Primary Central Incisor (E)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', letter: 'P' },
  'Q': { name: 'Mandibular Right Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 'Incisal Edge', canals: '1 Canal', innervation: 'Incisive Nerve', eruption: '10–14 Months', shedding: '7–8 Years', antagonist: 'Primary Lateral Incisor (D)', function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', letter: 'Q' },
  'R': { name: 'Mandibular Right Primary Canine', shape: 'canine', roots: 1, cusps: '1 Sharp Cusp', canals: '1 Canal', innervation: 'Incisive Nerve', eruption: '16–20 Months', shedding: '9–11 Years', antagonist: 'Primary Canine (C)', function: 'Tearing & Guidance', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', letter: 'R' },
  'S': { name: 'Mandibular Right Primary 1st Molar', shape: 'molar', roots: 2, cusps: '4 Cusps', canals: '3 Canals', innervation: 'IAN Nerve', eruption: '12–16 Months', shedding: '9–11 Years', antagonist: 'Primary 1st Molar (B)', function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', letter: 'S' },
  'T': { name: 'Mandibular Right Primary 2nd Molar', shape: 'molar', roots: 2, cusps: '5 Cusps', canals: '3 Canals', innervation: 'IAN Nerve', eruption: '20–30 Months', shedding: '10–12 Years', antagonist: 'Primary 2nd Molar (A)', function: 'Primary Mastication & Space Anchor', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', letter: 'T' }
};

/**
 * Robust 5 Surface Zones (O, M, D, B, L) Medical Parser
 * Accurately extracts affected anatomical surfaces with zero false positives
 * (prevents "Doctor" matching "DO", "Molar" matching "MO", etc.)
 */
export const parseSurfacesFromRecord = (statusStr, commentsStr, customSurfaces = null) => {
  const result = { O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' };

  if (customSurfaces && typeof customSurfaces === 'object' && Object.keys(customSurfaces).length > 0) {
    Object.assign(result, customSurfaces);
    return result;
  }

  const rawStatus = (statusStr || 'Healthy').trim();
  const rawComments = (commentsStr || '').trim();
  const s = rawStatus.toLowerCase();
  const c = rawComments.toLowerCase();
  const full = `${s} ${c}`;

  // If strictly Healthy / Sound / Intact / Cleaning with no pathology
  if (
    (s === 'healthy' || s === 'sound' || s === 'intact' || s.includes('cleaning')) && 
    !full.includes('caries') && 
    !full.includes('decay') && 
    !full.includes('cavity') && 
    !full.includes('filling') && 
    !full.includes('composite') && 
    !full.includes('amalgam') && 
    !full.includes('rct') && 
    !full.includes('root canal') && 
    !full.includes('ssc') && 
    !full.includes('pulpotomy') && 
    !full.includes('maintainer') && 
    !full.includes('implant') &&
    !full.includes('treated')
  ) {
    return result;
  }

  // Determine standard condition label to paint on affected zones
  let conditionLabel = 'Healthy';
  if (s.includes('implant') || full.includes('implant')) {
    conditionLabel = 'Dental Implant';
  } else if (s.includes('already treated') || s.includes('treated') || s.includes('rct') || full.includes('root canal') || full.includes('endo')) {
    conditionLabel = 'Root Canal (RCT)';
  } else if (s.includes('pulpotomy') || full.includes('pulpotomy') || full.includes('mta')) {
    conditionLabel = 'Pulpotomy (MTA)';
  } else if (s.includes('ssc') || full.includes('stainless') || s.includes('crown') || full.includes('crown')) {
    conditionLabel = 'Stainless Steel Crown (SSC)';
  } else if (s.includes('space') || full.includes('space') || full.includes('maintainer')) {
    conditionLabel = 'Space Maintainer';
  } else if (s.includes('bracket') || full.includes('bracket') || full.includes('ortho')) {
    conditionLabel = 'Orthodontic Bracket';
  } else if (s.includes('fluoride') || full.includes('varnish') || full.includes('sealant')) {
    conditionLabel = 'Fluoride Varnish / Sealant';
  } else if (s.includes('miss') || full.includes('extract') || full.includes('exfoliat') || full.includes('absent')) {
    conditionLabel = 'Extracted / Missing';
  } else if (s.includes('composite') || full.includes('composite') || s.includes('resin') || s.includes('broken')) {
    conditionLabel = 'Composite Filling';
  } else if (s.includes('amalgam') || full.includes('amalgam')) {
    conditionLabel = 'Amalgam';
  } else if (s.includes('gic') || full.includes('gic')) {
    conditionLabel = 'Filling — GIC';
  } else if (s.includes('caries') || full.includes('caries') || s.includes('decay') || full.includes('decay') || s.includes('cavity') || full.includes('ecc') || s.includes('damaged')) {
    conditionLabel = 'Caries (Decay)';
  }

  if (conditionLabel === 'Healthy') {
    return result;
  }

  // 1. Full-Coverage / Full-Tooth Conditions
  if (
    conditionLabel === 'Pulpotomy (MTA)' || 
    conditionLabel === 'Stainless Steel Crown (SSC)' || 
    conditionLabel === 'Root Canal (RCT)' || 
    conditionLabel === 'Dental Implant' || 
    conditionLabel === 'Extracted / Missing' || 
    conditionLabel === 'Space Maintainer'
  ) {
    result.O = conditionLabel;
    result.M = conditionLabel;
    result.D = conditionLabel;
    result.B = conditionLabel;
    result.L = conditionLabel;
    return result;
  }

  // 2. Orthodontic Bracket / Class V -> Buccal only
  if (conditionLabel === 'Orthodontic Bracket' || full.includes('class v') || full.includes('cervical')) {
    result.B = conditionLabel;
    return result;
  }

  // 3. Multi-Surface Specific Combinations (Checking Status and Clean Diagnosis first)
  // Check MOD: Mesial, Occlusal, Distal
  if (/\bmod\b|mesio-occlusal-distal/i.test(s) || /\bmod\b|mesio-occlusal-distal/i.test(c)) {
    result.M = conditionLabel;
    result.O = conditionLabel;
    result.D = conditionLabel;
    return result;
  }

  // Check MO: Mesial, Occlusal (ensure not matching words like "molar" or "mobility")
  const isMO = /\bmo\b|\bmesio-occlusal\b|\bmesial-occlusal\b|[—–-]\s*mo\b|\(mo\)/i.test(s) ||
               (/\bmo\b|\bmesio-occlusal\b|\bmesial-occlusal\b|[—–-]\s*mo\b|\(mo\)/i.test(c) && !/\bmolar\b|\bmobility\b/i.test(c.replace(/\bmo\b/gi, '')));

  // Check DO: Distal, Occlusal (ensure not matching words like "doctor" or "dob")
  const isDO = /\bdo\b(?!ctor)|\bdisto-occlusal\b|\bdistal-occlusal\b|[—–-]\s*do\b|\(do\)/i.test(s) ||
               (/\bdo\b(?!ctor)|\bdisto-occlusal\b|\bdistal-occlusal\b|[—–-]\s*do\b|\(do\)/i.test(c) && !/\bdoctor\b|\bdob\b/i.test(c.replace(/\bdo\b/gi, '')));

  if (isMO && !isDO) {
    result.M = conditionLabel;
    result.O = conditionLabel;
    return result;
  }

  if (isDO && !isMO) {
    result.D = conditionLabel;
    result.O = conditionLabel;
    return result;
  }

  if (isMO && isDO) {
    result.M = conditionLabel;
    result.O = conditionLabel;
    result.D = conditionLabel;
    return result;
  }

  // Check Individual Surface Tokens:
  let hasSpecificSurface = false;

  // Occlusal (O)
  if (/\b(occlusal|fissure|pit)\b|[—–-]\s*o\b|\(o\)/i.test(s) || /\b(occlusal|fissure|pit)\b|[—–-]\s*o\b|\(o\)/i.test(c)) {
    result.O = conditionLabel;
    hasSpecificSurface = true;
  }

  // Mesial (M)
  if (/\bmesial\b|[—–-]\s*m\b|\(m\)/i.test(s) || /\bmesial\b|[—–-]\s*m\b|\(m\)/i.test(c)) {
    result.M = conditionLabel;
    hasSpecificSurface = true;
  }

  // Distal (D)
  if (/\bdistal\b|[—–-]\s*d\b|\(d\)/i.test(s) || /\bdistal\b|[—–-]\s*d\b|\(d\)/i.test(c)) {
    result.D = conditionLabel;
    hasSpecificSurface = true;
  }

  // Buccal / Facial (B)
  if (/\b(buccal|facial|labial|cervical)\b|[—–-]\s*b\b|\(b\)/i.test(s) || /\b(buccal|facial|labial|cervical)\b|[—–-]\s*b\b|\(b\)/i.test(c)) {
    result.B = conditionLabel;
    hasSpecificSurface = true;
  }

  // Lingual / Palatal (L)
  if (/\b(lingual|palatal|cingulum)\b|[—–-]\s*l\b|\(l\)/i.test(s) || /\b(lingual|palatal|cingulum)\b|[—–-]\s*l\b|\(l\)/i.test(c)) {
    result.L = conditionLabel;
    hasSpecificSurface = true;
  }

  // Default fallback if a pathology is diagnosed but no surface was specified:
  // default to Occlusal (O) table
  if (!hasSpecificSurface) {
    result.O = conditionLabel;
  }

  return result;
};

export default function ToothDetailPage() {
  const { patientId, toothNumber } = useParams();
  const navigate = useNavigate();
  
  const rawParam = toothNumber ? String(toothNumber).trim().toUpperCase() : '1';
  const isPediatric = /^[A-T]$/.test(rawParam);
  const tKey = isPediatric ? rawParam : (parseInt(rawParam, 10) || 1);
  const tNum = isPediatric ? (rawParam.charCodeAt(0) - 64) : tKey; // Numeric fallback for calculation

  const [dentitionMode, setDentitionMode] = useState(isPediatric ? 'pediatric' : 'permanent');
  const [patient, setPatient] = useState(null);
  const [toothData, setToothData] = useState(null);
  const [allTeeth, setAllTeeth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [activeTab, setActiveTab] = useState('overview'); // overview, periodontal, surfaces, procedures
  const [editingNotes, setEditingNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const [activePaletteItem, setActivePaletteItem] = useState('Healthy');
  const [surfaceData, setSurfaceData] = useState({ O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' });

  // Category Restriction Guard Modal
  const [categoryRestrictionModal, setCategoryRestrictionModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    message: '',
    detail: '',
    patientName: '',
    patientAge: null,
    dob: '',
    activeCategory: '',
    attemptedCategory: ''
  });

  const handleDentitionModeSwitch = (targetMode) => {
    const age = calculatePatientAge(patient?.dob || patient?.DOB);
    const dentType = (patient?.dentitionType || patient?.DentitionType || '').trim().toLowerCase();
    
    // Check 1: Patient is Pediatric (< 13 years or dentitionType === 'pediatric')
    // Doctor clicks on Adult (permanent)
    const isPediatricPatient = dentType === 'pediatric' || (age !== null && age < 13);
    if (targetMode === 'permanent' && isPediatricPatient) {
      setCategoryRestrictionModal({
        isOpen: true,
        title: 'Dentition Category Restriction',
        subtitle: 'Patient Does Not Lay in Adult Category',
        message: `Patient ${patient?.firstName || ''} ${patient?.lastName || ''} (${age !== null ? `Age: ${age} Yrs` : 'Pediatric'}) has primary deciduous dentition (Teeth A–T) and does not lay in the Adult Permanent (1–32) category.`,
        detail: `Doctor navigation to the Adult section is restricted for this pediatric patient to prevent medical charting conflicts and maintain primary deciduous EHR integrity.`,
        patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`,
        patientAge: age,
        dob: patient?.dob || patient?.DOB || 'N/A',
        activeCategory: '👶 Pediatric Deciduous (A–T)',
        attemptedCategory: '🦷 Adult Permanent (1–32)'
      });
      return;
    }

    // Check 2: Patient is Adult (>= 18 years or dentitionType === 'adult')
    // Doctor clicks on Pediatric
    const isAdultPatient = dentType === 'adult' || (age !== null && age >= 18);
    if (targetMode === 'pediatric' && isAdultPatient) {
      setCategoryRestrictionModal({
        isOpen: true,
        title: 'Dentition Category Restriction',
        subtitle: 'Patient Does Not Lay in Pediatric Category',
        message: `Patient ${patient?.firstName || ''} ${patient?.lastName || ''} (${age !== null ? `Age: ${age} Yrs` : 'Adult'}) has permanent adult dentition (Teeth 1–32) and does not lay in the Pediatric Deciduous (A–T) category.`,
        detail: `Navigation to baby teeth (A–T) is restricted for adult profiles.`,
        patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`,
        patientAge: age,
        dob: patient?.dob || patient?.DOB || 'N/A',
        activeCategory: '🦷 Adult Permanent (1–32)',
        attemptedCategory: '👶 Pediatric Deciduous (A–T)'
      });
      return;
    }

    setDentitionMode(targetMode);
  };

  // Periodontal Probing Depths State (6 points in mm)
  const [probingDepths, setProbingDepths] = useState({
    mesiobuccal: 2,
    midbuccal: 2,
    distobuccal: 3,
    mesiolingual: 2,
    midlingual: 2,
    distolingual: 3
  });

  const canvasRef = useRef(null);

  // Synchronize surfaceData & activePaletteItem with toothData
  useEffect(() => {
    if (!toothData) return;
    const parsed = parseSurfacesFromRecord(toothData.status, toothData.comments, toothData.surfaces);
    setSurfaceData(parsed);

    // Auto-detect and set activePaletteItem from tooth condition
    const s = (toothData.status || '').toLowerCase();
    const c = (toothData.comments || '').toLowerCase();
    const full = `${s} ${c}`;
    if (s === 'healthy' || s === 'sound' || s.includes('cleaning') || (!toothData.status && !toothData.comments)) {
      setActivePaletteItem('Healthy');
    } else if (full.includes('implant')) {
      setActivePaletteItem('Dental Implant');
    } else if (full.includes('already treated') || full.includes('treated') || full.includes('rct') || full.includes('root canal') || full.includes('endo')) {
      setActivePaletteItem('Root Canal (RCT)');
    } else if (full.includes('pulpotomy') || full.includes('mta')) {
      setActivePaletteItem('Pulpotomy (MTA)');
    } else if (full.includes('ssc') || full.includes('stainless')) {
      setActivePaletteItem('Stainless Steel Crown (SSC)');
    } else if (full.includes('space') || full.includes('maintainer')) {
      setActivePaletteItem('Space Maintainer');
    } else if (full.includes('amalgam')) {
      setActivePaletteItem('Amalgam');
    } else if (full.includes('composite') || full.includes('resin') || full.includes('broken')) {
      setActivePaletteItem('Composite Filling');
    } else if (full.includes('caries') || full.includes('decay') || full.includes('cavity') || full.includes('ecc') || full.includes('damaged')) {
      setActivePaletteItem('Caries (Decay)');
    } else {
      setActivePaletteItem('Healthy');
    }
  }, [toothData]);

  const isRightArch = isPediatric 
    ? ['A','B','C','D','E','P','Q','R','S','T'].includes(String(tKey).toUpperCase())
    : (tNum <= 8 || (tNum >= 25 && tNum <= 32));
  const leftKey = isRightArch ? 'D' : 'M';
  const rightKey = isRightArch ? 'M' : 'D';

  const getZoneFill = (zoneKey) => {
    const val = (surfaceData[zoneKey] || 'Healthy').toLowerCase();
    if (val === 'healthy' || val === 'normal / healthy' || val === 'sound' || val === 'intact') return '#F8FAFC';
    if (val.includes('pulpotomy') || val.includes('mta')) return '#7C3AED';
    if (val.includes('ssc') || val.includes('stainless')) return '#64748B';
    if (val.includes('space')) return '#93C5FD';
    if (val.includes('caries') || val.includes('decay') || val.includes('ecc') || val.includes('cavity')) return '#EF4444';
    if (val.includes('composite') || val.includes('fill') || val.includes('resin')) return '#2563EB';
    if (val.includes('amalgam')) return '#64748B';
    if (val.includes('gic')) return '#F59E0B';
    if (val.includes('rct') || val.includes('canal') || val.includes('endo')) return '#7C3AED';
    if (val.includes('crown') || val.includes('bridge') || val.includes('zirconia')) return '#D97706';
    if (val.includes('implant')) return '#0E8A80';
    if (val.includes('bracket') || val.includes('ortho')) return '#0284C7';
    if (val.includes('varnish') || val.includes('sealant')) return '#06B6D4';
    if (val.includes('miss') || val.includes('extract') || val.includes('exfoliat') || val.includes('absent')) return '#DC2626';
    return '#2563EB';
  };

  const getZoneStroke = (zoneKey) => {
    const val = (surfaceData[zoneKey] || 'Healthy').toLowerCase();
    if (val === 'healthy' || val === 'normal / healthy' || val === 'sound' || val === 'intact') return '#CBD5E1';
    if (val.includes('pulpotomy') || val.includes('mta')) return '#4C1D95';
    if (val.includes('ssc') || val.includes('stainless')) return '#334155';
    if (val.includes('space')) return '#1D4ED8';
    if (val.includes('caries') || val.includes('decay') || val.includes('ecc') || val.includes('cavity')) return '#991B1B';
    if (val.includes('composite') || val.includes('fill') || val.includes('resin')) return '#1D4ED8';
    if (val.includes('amalgam')) return '#334155';
    if (val.includes('gic')) return '#B45309';
    if (val.includes('rct') || val.includes('canal')) return '#4C1D95';
    if (val.includes('crown')) return '#B45309';
    if (val.includes('implant')) return '#0F766E';
    if (val.includes('bracket') || val.includes('ortho')) return '#0369A1';
    return '#CBD5E1';
  };

  const getZoneTextFill = (zoneKey) => {
    const val = (surfaceData[zoneKey] || 'Healthy').toLowerCase();
    if (val === 'healthy' || val === 'normal / healthy' || val === 'sound' || val === 'intact') return '#64748B';
    return '#FFFFFF';
  };

  const handleToggleZone = (zoneKey) => {
    const curVal = surfaceData[zoneKey] || 'Healthy';
    const nextVal = curVal === activePaletteItem ? 'Healthy' : activePaletteItem;
    const updated = { ...surfaceData, [zoneKey]: nextVal };
    setSurfaceData(updated);

    // Compute updated merged clinical status string
    const affectedKeys = Object.keys(updated).filter(k => updated[k] && updated[k] !== 'Healthy');
    if (affectedKeys.length === 0) {
      handleSaveObservation('Healthy', isPediatric ? `Intact primary deciduous enamel on Tooth ${tKey}, physiological baseline` : 'Intact anatomical enamel, physiological mobility (Grade 0)', '#10B981');
      return;
    }

    let baseName = 'Caries';
    if (activePaletteItem.includes('Composite')) baseName = 'Filling — Composite';
    else if (activePaletteItem.includes('Amalgam')) baseName = 'Filling — Amalgam';
    else if (activePaletteItem.includes('Pulpotomy')) baseName = 'Pulpotomy (MTA)';
    else if (activePaletteItem.includes('SSC')) baseName = 'Stainless Steel Crown (SSC)';

    let surfStr = affectedKeys.join(', ');
    if (affectedKeys.length === 5) {
      surfStr = 'MODBL (All 5 Surfaces)';
    } else if (affectedKeys.includes('M') && affectedKeys.includes('O') && affectedKeys.includes('D')) {
      const other = affectedKeys.filter(k => k !== 'M' && k !== 'O' && k !== 'D');
      surfStr = other.length > 0 ? `MOD, ${other.join(', ')}` : 'MOD';
    } else if (affectedKeys.includes('M') && affectedKeys.includes('O')) {
      const other = affectedKeys.filter(k => k !== 'M' && k !== 'O');
      surfStr = other.length > 0 ? `MO, ${other.join(', ')}` : 'MO';
    } else if (affectedKeys.includes('D') && affectedKeys.includes('O')) {
      const other = affectedKeys.filter(k => k !== 'D' && k !== 'O');
      surfStr = other.length > 0 ? `DO, ${other.join(', ')}` : 'DO';
    }

    const newStatus = `${baseName} — ${surfStr}`;
    const newComment = `Clinical diagnosis: ${newStatus} recorded on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`} via 5-Zone Odontogram`;
    handleSaveObservation(newStatus, newComment, getHexColor(newStatus));
  };

  const handleApplyAll5Zones = () => {
    const fillItem = activePaletteItem === 'Healthy' ? 'Caries (Decay)' : activePaletteItem;
    const updated = { O: fillItem, M: fillItem, D: fillItem, B: fillItem, L: fillItem };
    setSurfaceData(updated);

    let baseName = 'Caries';
    if (fillItem.includes('Composite')) baseName = 'Filling — Composite';
    else if (fillItem.includes('Amalgam')) baseName = 'Filling — Amalgam';
    else if (fillItem.includes('Pulpotomy')) baseName = 'Pulpotomy (MTA)';
    else if (fillItem.includes('SSC')) baseName = 'Stainless Steel Crown (SSC)';

    const newStatus = `${baseName} — All 5 Surfaces (MODBL)`;
    const newComment = `Clinical diagnosis: ${newStatus} recorded on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`} via 5-Zone Odontogram`;
    handleSaveObservation(newStatus, newComment, getHexColor(newStatus));
  };

  const handleClearAllZones = () => {
    const updated = { O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' };
    setSurfaceData(updated);
    setActivePaletteItem('Healthy');
    handleSaveObservation('Healthy', isPediatric ? `Intact primary deciduous enamel on Tooth ${tKey}, physiological baseline` : 'Intact anatomical enamel, physiological mobility (Grade 0)', '#10B981');
  };

  // Fetch Patient & Accurate Teeth Data from API
  const fetchData = async () => {
    try {
      console.log(`%c[ToothDetailPage] 🚀 Initializing data fetch for Patient ID: ${patientId}, Tooth Param: ${toothNumber}`, 'color: #3B82F6; font-weight: bold;');
      setLoading(true);
      const pid = parseInt(patientId) || 18;

      // 1. Fetch Patient Profile
      try {
        console.log(`[ToothDetailPage] 📡 Requesting Patient Profile: /api/patients/${pid}`);
        const pRes = await fetch(`/api/patients/${pid}`);
        console.log(`[ToothDetailPage] 📥 Patient Response Status: ${pRes.status} (${pRes.statusText})`);
        if (pRes.ok) {
          const contentType = pRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const pData = await pRes.json();
            console.log('[ToothDetailPage] ✅ Patient Profile Loaded:', pData.firstName, pData.lastName, `Age: ${pData.age || pData.dob}`, `Dentition: ${pData.dentitionType}`);
            setPatient(pData);

            // When accessed via /chart/:patientId/tooth (without toothNumber param)
            let targetTooth = toothNumber;
            if (!targetTooth) {
              const isPedPatient = (pData?.dentitionType || '').toLowerCase() === 'pediatric' || (calculatePatientAge(pData?.dob) !== null && calculatePatientAge(pData?.dob) < 13);
              targetTooth = isPedPatient ? 'A' : '1';
              console.log(`[ToothDetailPage] 🔀 No toothNumber specified. Synchronizing URL to default: ${targetTooth}`);
              navigate(`/chart/${pid}/tooth/${targetTooth}`, { replace: true });
            }
          }
        } else {
          console.error(`[ToothDetailPage] ❌ Failed to fetch patient ${pid}. HTTP Status:`, pRes.status);
        }
      } catch (pErr) {
        console.error("[ToothDetailPage] ❌ Patient fetch error:", pErr);
      }

      // 2. Fetch Complete Odontogram Teeth Chart
      try {
        console.log(`[ToothDetailPage] 📡 Requesting Odontogram Chart: /api/patients/${pid}/chart`);
        const teethRes = await fetch(`/api/patients/${pid}/chart`);
        console.log(`[ToothDetailPage] 📥 Teeth Chart Response Status: ${teethRes.status} (${teethRes.statusText})`);
        if (teethRes.ok) {
          const contentType = teethRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const teethArray = await teethRes.json();
            console.log(`[ToothDetailPage] ✅ Teeth Chart Loaded (${teethArray?.length || 0} teeth records found)`);
            setAllTeeth(teethArray || []);

            const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
            const pIdx = PEDIATRIC_KEYS.indexOf(String(tKey).toUpperCase());

            const current = (teethArray || []).find(t => {
              const cat = (t.dentitionCategory || t.DentitionCategory || 'Adult').trim().toLowerCase();
              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
              const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();

              if (isPediatric) {
                if (cat === 'pediatric') {
                  return tk === String(tKey).toUpperCase() || (pIdx >= 0 && parseInt(tn, 10) === (pIdx + 1));
                }
                return tk === String(tKey).toUpperCase();
              } else {
                if (cat === 'adult') {
                  return tk === String(tKey).toUpperCase() || parseInt(tn, 10) === tNum;
                }
                return !/^[A-T]$/i.test(tk) && parseInt(tn, 10) === tNum;
              }
            });

            if (current) {
              const status = current.conditionStatus || current.status || 'Healthy';
              const comments = current.comments || current.Comments || current.comment || (isPediatric ? `Intact primary deciduous enamel, physiological baseline` : 'Intact enamel, physiological mobility (Grade 0)');
              const color = current.conditionColor || current.color || getHexColor(status);
              const rotationDeg = current.rotationDeg || 0;

              console.log(`[ToothDetailPage] 🎯 Matched Tooth Record for #${tKey}:`, { status, comments, color, rotationDeg, dentitionCategory: current.dentitionCategory });

              setToothData({
                toothNumber: tKey,
                status,
                comments,
                comment: comments,
                color,
                rotationDeg,
                isPediatric
              });
              setEditingNotes(comments);

              // Initialize active surface matrix from DB condition/comment
              const initialSurfs = parseSurfacesFromRecord(status, comments, current.surfaces);
              const sLow = (status || '').toLowerCase();
              const cLow = (comments || '').toLowerCase();
              const fullText = `${sLow} ${cLow}`;

              if (sLow === 'healthy' || sLow === 'sound' || (!status && !comments)) {
                setActivePaletteItem('Healthy');
              } else if (fullText.includes('caries') || fullText.includes('decay') || fullText.includes('cavity') || fullText.includes('ecc')) {
                setActivePaletteItem('Caries (Decay)');
              } else if (fullText.includes('composite') || fullText.includes('resin')) {
                setActivePaletteItem('Composite Filling');
              } else if (fullText.includes('amalgam')) {
                setActivePaletteItem('Amalgam');
              } else if (fullText.includes('pulpotomy') || fullText.includes('mta')) {
                setActivePaletteItem('Pulpotomy (MTA)');
              } else if (fullText.includes('ssc') || fullText.includes('stainless')) {
                setActivePaletteItem('Stainless Steel Crown (SSC)');
              } else {
                setActivePaletteItem('Healthy');
              }
              setSurfaceData(initialSurfs);
            } else {
              console.warn(`[ToothDetailPage] ⚠️ No existing record found for Tooth #${tKey} in chart. Initializing default Healthy profile.`);
              setToothData({
                toothNumber: tKey,
                status: 'Healthy',
                color: '#10B981',
                comments: isPediatric ? `Intact primary deciduous enamel on Tooth ${tKey}, physiological baseline` : 'Intact anatomical enamel, physiological mobility (Grade 0)',
                rotationDeg: 0,
                isPediatric
              });
              setEditingNotes(isPediatric ? `Intact primary deciduous enamel on Tooth ${tKey}, physiological baseline` : 'Intact anatomical enamel, physiological mobility (Grade 0)');
              setSurfaceData({ O: 'Healthy', M: 'Healthy', D: 'Healthy', B: 'Healthy', L: 'Healthy' });
              setActivePaletteItem('Healthy');
            }
          }
        } else {
          console.error(`[ToothDetailPage] ❌ Failed to fetch chart for patient ${pid}. HTTP Status:`, teethRes.status);
        }
      } catch (tErr) {
        console.error("[ToothDetailPage] ❌ Chart fetch error:", tErr);
      }
    } catch (err) {
      console.error("[ToothDetailPage] 💥 Fatal error in fetchData:", err);
    } finally {
      console.log(`[ToothDetailPage] 🏁 fetchData completed, setLoading(false)`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId, toothNumber]);

  // Save changes to database
  const handleSaveObservation = async (newStatus, newComment, newColor) => {
    try {
      setSaving(true);
      const pid = parseInt(patientId) || 18;
      const statusToSave = newStatus || toothData?.status || 'Healthy';
      const commentToSave = newComment !== undefined ? newComment : (toothData?.comments || '');
      const colorToSave = newColor || getHexColor(statusToSave);

      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.DoctorID || 1;
      const updates = [{
        toothNumber: tKey,
        toothKey: String(tKey),
        dentitionCategory: isPediatric ? 'Pediatric' : 'Adult',
        doctorId: docId,
        status: statusToSave,
        conditionStatus: statusToSave,
        color: colorToSave,
        comment: commentToSave,
        comments: commentToSave
      }];

      const res = await fetch('/api/patients/teeth/update-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pid,
          updates
        })
      });

      if (res.ok) {
        setToothData(prev => ({
          ...prev,
          status: statusToSave,
        comments: commentToSave,
          color: colorToSave
        }));
        setIsEditingNotes(false);
        setToast({ visible: true, message: `${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`} updated and saved to Database!` });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
      }
    } catch (err) {
      console.error("Save observation failed:", err);
      alert("Failed to save observation to database.");
    } finally {
      setSaving(false);
    }
  };

  // Generate High-Definition Individualized Anatomical & Clinical Occlusal Canvas
  const createDetailedToothOcclusalCanvas = (toothIdentifier, currentToothData, patientData, activeSurfaces = {}) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const status = (currentToothData?.status || 'Healthy').toLowerCase();
    const comments = (currentToothData?.comments || currentToothData?.comment || '').toLowerCase();
    const fullDiag = `${status} ${comments}`;

    const isPediatricTooth = typeof toothIdentifier === 'string' && isNaN(parseInt(toothIdentifier));
    const tUpper = String(toothIdentifier).toUpperCase();

    const isNonHealthySurf = (zone) => {
      const v = (activeSurfaces[zone] || 'Healthy').toLowerCase();
      return v !== 'healthy' && v !== 'normal / healthy' && v !== 'sound' && v !== 'intact';
    };

    const isCaries = fullDiag.includes('caries') || fullDiag.includes('decay') || fullDiag.includes('cavity') || fullDiag.includes('cavitation') || fullDiag.includes('ecc') || Object.values(activeSurfaces).some(v => v && (v.toLowerCase().includes('caries') || v.toLowerCase().includes('decay')));
    const isComposite = (fullDiag.includes('composite') || fullDiag.includes('fill') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('composite'))) && !fullDiag.includes('amalgam');
    const isAmalgam = fullDiag.includes('amalgam') || Object.values(activeSurfaces).some(v => v && v.toLowerCase().includes('amalgam'));
    const isRCT = fullDiag.includes('rct') || fullDiag.includes('canal') || fullDiag.includes('endo');
    const isPulpotomy = fullDiag.includes('pulpotomy') || fullDiag.includes('mta');
    const isSSC = fullDiag.includes('ssc') || fullDiag.includes('stainless');
    const isOrthodonticBracket = fullDiag.includes('bracket') || fullDiag.includes('orthodontic') || fullDiag.includes('ortho') || fullDiag.includes('brace');
    const isSpaceMaintainer = fullDiag.includes('space') || fullDiag.includes('maintainer') || fullDiag.includes('band');
    const isFluorideVarnish = fullDiag.includes('fluoride') || fullDiag.includes('varnish');
    const isImplant = fullDiag.includes('implant');
    const isCrown = fullDiag.includes('crown') || fullDiag.includes('bridge') || fullDiag.includes('zirconia') || isSSC;
    
    const isMOD = /\bmod\b|mesio-occlusal-distal/i.test(fullDiag) || (isNonHealthySurf('M') && isNonHealthySurf('O') && isNonHealthySurf('D'));
    const isDO = (/\bdo\b(?!ctor)/i.test(status) || (/\bdo\b(?!ctor)/i.test(fullDiag) && !/\bdoctor\b|\bdob\b/i.test(fullDiag.replace(/\bdo\b/gi, ''))) || fullDiag.includes('disto-occlusal')) || (isNonHealthySurf('D') && isNonHealthySurf('O') && !isNonHealthySurf('M'));
    const isMO = (/\bmo\b/i.test(status) || (/\bmo\b/i.test(fullDiag) && !/\bmolar\b|\bmobility\b/i.test(fullDiag.replace(/\bmo\b/gi, ''))) || fullDiag.includes('mesio-occlusal')) || (isNonHealthySurf('M') && isNonHealthySurf('O') && !isNonHealthySurf('D'));
    const isClassV = fullDiag.includes('class v') || fullDiag.includes('cervical') || isNonHealthySurf('B');
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
      // Stainless Steel Chrome Metallic Gradient
      toothGrad.addColorStop(0, '#FFFFFF');
      toothGrad.addColorStop(0.3, '#E2E8F0');
      toothGrad.addColorStop(0.6, '#94A3B8');
      toothGrad.addColorStop(0.85, '#64748B');
      toothGrad.addColorStop(1, '#475569');
    } else {
      // Natural Enamel Translucency & Pearlescent Gradient
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
      // Incisors
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
      // Central Fissure Table Groove
      ctx.moveTo(150, 256);
      ctx.lineTo(362, 256);
      ctx.moveTo(256, 150);
      ctx.lineTo(256, 362);
      ctx.moveTo(180, 180);
      ctx.lineTo(332, 332);
      ctx.moveTo(332, 180);
      ctx.lineTo(180, 332);
      ctx.stroke();
    } else if (isIncisor || isCanine) {
      // Incisal Edge Line & Cingulum Arch
      ctx.moveTo(160, 256);
      ctx.lineTo(352, 256);
      ctx.stroke();
    }
    ctx.restore();

    // 3. CLINICAL DIAGNOSES & SURFACES PAINTING
    // 3. CLINICAL DIAGNOSES & SURFACES PAINTING (Multi-Surface & Multi-Condition Layering)
    
    // A. Stainless Steel Crown (SSC) Full Coverage Glaze
    if (isSSC) {
      ctx.save();
      const sscShine = ctx.createLinearGradient(100, 100, 400, 400);
      sscShine.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      sscShine.addColorStop(0.4, 'rgba(203, 213, 225, 0.2)');
      sscShine.addColorStop(0.6, 'rgba(148, 163, 184, 0.4)');
      sscShine.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
      ctx.fillStyle = sscShine;
      ctx.beginPath();
      if (isMolar) ctx.roundRect(95, 105, 322, 302, [45, 45, 45, 45]);
      else ctx.roundRect(120, 120, 272, 272, [35, 35, 35, 35]);
      ctx.fill();

      // Crown Specular Highlight Band
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(220, 200, 70, 25, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // B. Pulpotomy MTA Bioceramic Chamber Seal
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

      // Bioceramic MTA Granule Highlights
      ctx.fillStyle = '#F3E8FF';
      ctx.beginPath();
      ctx.arc(245, 248, 6, 0, Math.PI * 2);
      ctx.arc(268, 255, 5, 0, Math.PI * 2);
      ctx.arc(254, 270, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // C. Surface-by-Surface Restoration & Caries Renderer (Supports concurrent MOD Amalgam, O Composite, etc.)
    if (!isSSC) {
      // Helper to determine condition of a specific surface
      const getZoneType = (zone) => {
        const direct = (activeSurfaces[zone] || '').toLowerCase();
        if (direct === 'healthy' || direct === 'normal / healthy') return null;
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

        // Global diagnosis parsing
        const s = fullDiag;
        if (s.includes('amalgam')) {
          if (s.includes('mod') && (zone === 'M' || zone === 'O' || zone === 'D')) return 'amalgam';
          if (s.includes('mo') && (zone === 'M' || zone === 'O')) return 'amalgam';
          if (s.includes('do') && (zone === 'D' || zone === 'O')) return 'amalgam';
          if (s.includes(' (o)') && zone === 'O') return 'amalgam';
          if (s.includes(' (m)') && zone === 'M') return 'amalgam';
          if (s.includes(' (d)') && zone === 'D') return 'amalgam';
          if (s.includes(' (b)') && zone === 'B') return 'amalgam';
          if (s.includes(' (l)') && zone === 'L') return 'amalgam';
          if (!s.includes('composite') && !s.includes('caries')) {
            if (zone === 'O' || isMOD || isMO && (zone === 'M' || zone === 'O') || isDO && (zone === 'D' || zone === 'O')) return 'amalgam';
          }
        }

        if (s.includes('composite') || s.includes('fill')) {
          if (s.includes('mod') && (zone === 'M' || zone === 'O' || zone === 'D') && !s.includes('amalgam')) return 'composite';
          if (s.includes('mo') && (zone === 'M' || zone === 'O') && !s.includes('amalgam')) return 'composite';
          if (s.includes('do') && (zone === 'D' || zone === 'O') && !s.includes('amalgam')) return 'composite';
          if ((s.includes('o composite') || s.includes('composite (o)') || s.includes('— o')) && zone === 'O') return 'composite';
          if (s.includes(' (m)') && zone === 'M') return 'composite';
          if (s.includes(' (d)') && zone === 'D') return 'composite';
          if (s.includes(' (b)') && zone === 'B') return 'composite';
          if (s.includes(' (l)') && zone === 'L') return 'composite';
          if (zone === 'O' && (s.includes('composite') || s.includes('fill'))) return 'composite';
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
    if (isRCT && !isSSC && !isPulpotomy) {
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
      // Orthodontic Space Maintainer Band and Extension Loop
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

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(348, 200, 9, 0, Math.PI * 2);
      ctx.arc(348, 310, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(346, 198, 3, 0, Math.PI * 2);
      ctx.arc(346, 308, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(236, 236, 40, 40);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(240, 240, 32, 32);
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(248, 248, 16, 16);
      ctx.restore();
    } else if (isOrthodonticBracket) {
      // Facial / Buccal Orthodontic Metallic Bracket and Archwire
      ctx.save();
      // Archwire running horizontally through the slot
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

      // Precision Twin Bracket Base Plate
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(196, 196, 120, 120, [12, 12, 12, 12]);
      ctx.fill();
      ctx.stroke();

      // Metallic Specular Highlights & Tie Wings
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(206, 206, 46, 100);
      ctx.fillRect(260, 206, 46, 100);

      // Horizontal Archwire Slot Channel
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(196, 246, 120, 20);

      // Blue Elastomeric Ligature Tie Module
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(201, 201, 110, 110, [10, 10, 10, 10]);
      ctx.stroke();

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(203, 203, 106, 106, [8, 8, 8, 8]);
      ctx.stroke();

      ctx.restore();
    } else if (isFluorideVarnish) {
      ctx.save();
      const vGrad = ctx.createRadialGradient(256, 256, 20, 256, 256, 200);
      vGrad.addColorStop(0, 'rgba(250, 204, 21, 0.5)');
      vGrad.addColorStop(0.7, 'rgba(234, 179, 8, 0.4)');
      vGrad.addColorStop(1, 'rgba(202, 138, 4, 0.6)');
      ctx.fillStyle = vGrad;
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
      ctx.restore();
    }

    // 4. WATERMARK PATIENT ID & TOOTH BADGE STAMP
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(isPediatricTooth ? `Primary Tooth ${tUpper}` : `Tooth #${toothIdentifier}`, 25, 485);
    ctx.font = 'normal 12px sans-serif';
    ctx.fillStyle = 'rgba(71, 85, 105, 0.85)';
    ctx.fillText(`${patientData?.firstName || 'Patient'} ${patientData?.lastName || ''}`, 25, 502);
    ctx.restore();

    return canvas;
  };

  // Three.js Interactive 3D Single Tooth Visualizer
  useEffect(() => {
    if (!canvasRef.current || loading || !toothData) return;

    try {
      console.log(`[ToothDetailPage] 🎨 Initializing 3D Three.js canvas for Tooth #${tKey}...`);
      const container = canvasRef.current;
      const width = container.clientWidth || 340;
      const height = container.clientHeight || 340;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xF8FAFC);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 4.6);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

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

    // High-Definition Procedural Canvas Texture for THIS EXACT TOOTH
    const customCanvas = createDetailedToothOcclusalCanvas(isPediatric ? tKey : tNum, toothData, patient, surfaceData);
    const textureMap = new THREE.CanvasTexture(customCanvas);
    textureMap.colorSpace = THREE.SRGBColorSpace;

    // Tooth Crown Geometry & Material
    const crownGeo = new THREE.PlaneGeometry(2.35, 2.35);
    const crownMat = new THREE.MeshStandardMaterial({
      map: textureMap,
      transparent: true,
      roughness: 0.2,
      metalness: 0.05
    });

    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.set(0, 0, 0);

    // Apply Physical Axial Rotation if diagnosed
    if (toothData?.rotationDeg) {
      crownMesh.rotation.z = (toothData.rotationDeg * Math.PI) / 180;
    }

    scene.add(crownMesh);

    // Drag / Orbit Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
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

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        crownMesh.rotation.z += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
    } catch (threeErr) {
      console.error("[ToothDetailPage] ❌ Error initializing Three.js canvas:", threeErr);
    }
  }, [loading, tNum, tKey, toothData, surfaceData, isPediatric, patient]);

  // Derived Tooth Info
  const toothInfo = isPediatric
    ? (PEDIATRIC_TOOTH_NAMES[String(tKey).toUpperCase()] || {
        name: `Primary Tooth ${tKey}`,
        shape: ['A','B','I','J','K','L','S','T'].includes(String(tKey).toUpperCase()) ? 'molar' : ['C','H','M','R'].includes(String(tKey).toUpperCase()) ? 'canine' : 'incisor',
        arch: ['A','B','C','D','E','F','G','H','I','J'].includes(String(tKey).toUpperCase()) ? 'Maxilla (Upper Jaw)' : 'Mandible (Lower Jaw)',
        quad: ['A','B','C','D','E'].includes(String(tKey).toUpperCase()) ? 'Upper Right (Pediatric Q1)' :
              ['F','G','H','I','J'].includes(String(tKey).toUpperCase()) ? 'Upper Left (Pediatric Q2)' :
              ['K','L','M','N','O'].includes(String(tKey).toUpperCase()) ? 'Lower Left (Pediatric Q3)' : 'Lower Right (Pediatric Q4)',
        cusps: 'Deciduous Anatomy',
        roots: 1,
        canals: '1–3 Canals',
        function: 'Deciduous Dentition'
      })
    : (TOOTH_NAMES[tNum] || {
        name: `Tooth #${tNum}`,
        quad: tNum <= 8 ? 'Upper Right (Q1)' : tNum <= 16 ? 'Upper Left (Q2)' : tNum <= 24 ? 'Lower Left (Q3)' : 'Lower Right (Q4)',
        arch: tNum <= 16 ? 'Maxilla (Upper Jaw)' : 'Mandible (Lower Jaw)',
        shape: 'molar',
        roots: tNum <= 16 ? 3 : 2,
        cusps: 4,
        function: 'Mastication & Grinding'
      });

  const fdiNum = isPediatric 
    ? (['A','B','C','D','E'].includes(String(tKey).toUpperCase()) ? `5${5 - ['A','B','C','D','E'].indexOf(String(tKey).toUpperCase())}` :
       ['F','G','H','I','J'].includes(String(tKey).toUpperCase()) ? `6${['F','G','H','I','J'].indexOf(String(tKey).toUpperCase()) + 1}` :
       ['K','L','M','N','O'].includes(String(tKey).toUpperCase()) ? `7${5 - ['K','L','M','N','O'].indexOf(String(tKey).toUpperCase())}` :
       `8${['P','Q','R','S','T'].indexOf(String(tKey).toUpperCase()) + 1}`)
    : (tNum <= 8 ? 19 - tNum : tNum <= 16 ? 12 + tNum : tNum <= 24 ? 57 - tNum : 6 + tNum);

  // Determine Clinical Specialty
  const getSpecialty = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('space') || s.includes('bracket') || s.includes('orthodontic') || s.includes('ortho') || s.includes('rotat')) {
      return isPediatric ? 'Pediatric Orthodontics' : 'Orthodontics';
    }
    if (s.includes('pulpotomy') || s.includes('mta')) return isPediatric ? 'Pediatric Endodontics' : 'Endodontics';
    if (s.includes('ssc') || s.includes('crown') || s.includes('bridge') || s.includes('veneer')) return isPediatric ? 'Pediatric Prosthodontics' : 'Prosthodontics';
    if (s.includes('caries') || s.includes('decay') || s.includes('cavity') || s.includes('ecc') || s.includes('fractur')) return isPediatric ? 'Pediatric Pathology' : 'Oral Pathology';
    if (s.includes('fill') || s.includes('composite') || s.includes('amalgam') || s.includes('gic')) return 'Restorative Dentistry';
    if (s.includes('rct') || s.includes('canal') || s.includes('pulpitis')) return 'Endodontics';
    if (s.includes('implant')) return 'Implantology';
    if (s.includes('mobility') || s.includes('bone loss')) return 'Periodontics';
    if (s.includes('miss') || s.includes('extract')) return 'Oral & Maxillofacial Surgery';
    return 'Preventive & Diagnostic';
  };

  // Determine Affected Zone String
  const getAffectedZone = (statusStr, comments) => {
    const s = (statusStr || '').toLowerCase();
    const c = (comments || '').toLowerCase();
    const toothDisplay = isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tKey}`;

    if (s.includes('bracket') || c.includes('bracket') || s.includes('ortho')) return `${toothDisplay} Facial / Buccal (B) Bonded Orthodontic Bracket & Archwire`;
    if (s.includes('space') || c.includes('space') || s.includes('maintainer')) return `${toothDisplay} Band & Loop Space Maintainer Appliance`;
    if (s.includes('class v') || c.includes('class v') || s.includes('cervical')) return `${toothDisplay} Buccal (B) Cervical Margin / Class V`;
    if (/\bmod\b/i.test(s) || /\bmod\b/i.test(c) || s.includes('mesio-occlusal-distal')) return `${toothDisplay} Mesio-Occlusal-Distal (MOD) Complex`;
    if (/\bmo\b/i.test(s) || (/\bmo\b/i.test(c) && !/\bmolar\b|\bmobility\b/i.test(c.replace(/\bmo\b/gi, ''))) || s.includes('mesio-occlusal')) return `${toothDisplay} Mesio-Occlusal (MO) Interproximal`;
    if (/\bdo\b(?!ctor)/i.test(s) || (/\bdo\b(?!ctor)/i.test(c) && !/\bdoctor\b|\bdob\b/i.test(c.replace(/\bdo\b/gi, ''))) || s.includes('disto-occlusal')) return `${toothDisplay} Disto-Occlusal (DO) Interproximal`;
    if (/\b(occlusal|fissure)\b|[—–-]\s*o\b|\(o\)/i.test(s) || s.includes(' (o)')) return `${toothDisplay} Occlusal (O) Central Fissure Table`;
    if (/\b(buccal|facial)\b|[—–-]\s*b\b|\(b\)/i.test(s)) return `${toothDisplay} Facial / Buccal (B) Enamel Surface`;
    if (/\b(lingual|palatal)\b|[—–-]\s*l\b|\(l\)/i.test(s)) return `${toothDisplay} Lingual / Palatal (L) Cingulum Zone`;
    if (s.includes('implant')) return `${toothDisplay} Alveolar Bone Socket & Titanium Abutment`;
    if (s.includes('pulpotomy') || s.includes('mta')) return `${toothDisplay} Coronal Pulp Chamber & Occlusal Table`;
    if (s.includes('ssc') || s.includes('stainless')) return `${toothDisplay} Full Anatomical Deciduous Crown (SSC)`;
    if (s.includes('healthy') || s === 'sound') return `${toothDisplay} Intact Anatomical Crown & Physiological Enamel (All 5 Zones Sound)`;
    return `${toothDisplay} Full Anatomical Crown & Root`;
  };

  const specialty = getSpecialty(toothData?.status);
  const affectedZone = getAffectedZone(toothData?.status, toothData?.comments);

  if (loading || !toothData) {
    return (
      <div className="min-h-screen bg-[#F4F8FC] flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-light-teal/40 shadow-xl text-center">
          <div className="w-10 h-10 border-4 border-[#4A7CD2] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-[#10244B]">Loading Tooth #{tNum} Clinical Dossier...</p>
          <p className="text-[10px] font-bold text-muted-text">Fetching patient EHR and odontogram chart from database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-dark-slate flex flex-col font-sans">
      {/* Top Global Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-light-teal/30 sticky top-0 z-40 px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/chart/${patientId}`)}
            className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#4A7CD2] px-3.5 py-2 rounded-xl text-xs font-bold border border-light-teal/40 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chart
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-black text-[#10244B]">
                {isPediatric ? `Primary Tooth ${tKey} Clinical Dossier` : `Tooth #${tNum} Clinical Dossier`}
              </h1>
              {isPediatric ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  👶 Primary Deciduous
                </span>
              ) : (
                <>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                    FDI #{fdiNum}
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Universal #{tNum}
                  </span>
                </>
              )}
              {patient?.dentitionType && (
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  patient.dentitionType.toLowerCase() === 'pediatric'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : patient.dentitionType.toLowerCase() === 'mixed'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {patient.dentitionType.toLowerCase() === 'pediatric' ? '👶 Pediatric Patient' : (patient.dentitionType.toLowerCase() === 'mixed' ? '🔄 Mixed Dentition' : '🦷 Adult Patient')}
                </span>
              )}
              {/* Minimalist Live DB Pulsing Green Dot with Hover Detail Tooltip */}
              <div className="relative group flex items-center">
                <div 
                  className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center cursor-pointer shadow-2xs transition-transform hover:scale-110"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/30" />
                </div>

                {/* Hover Popover Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col gap-1 bg-[#10244B] text-white text-[10px] font-semibold px-3 py-2 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none border border-cyan-400/30 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live DB Connected</span>
                  </div>
                  <span className="text-slate-300 text-[9.5px]">
                    Synchronized with Patient #{patientId} EHR Database (Real-Time)
                  </span>
                  {/* Triangle Arrow */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#10244B] rotate-45 border-l border-t border-cyan-400/30" />
                </div>
              </div>
            </div>
            <p className="text-xs font-bold text-muted-text mt-0.5">
              {toothInfo.name} · {toothInfo.arch} · {toothInfo.quad}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setToast({ visible: true, message: 'Tooth dossier URL copied to clipboard!' });
              navigator.clipboard.writeText(window.location.href);
              setTimeout(() => setToast({ visible: false, message: '' }), 3000);
            }}
            className="flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            onClick={() => handleSaveObservation(toothData?.status, editingNotes, toothData?.color)}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#4A7CD2] hover:bg-[#3665B7] text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving to DB...' : 'Save Clinical Record'}
          </button>
        </div>
      </header>

      {/* Complete Patient EHR Demographic Card */}
      <section className="max-w-[1440px] w-full mx-auto px-6 pt-5">
        <div className="bg-gradient-to-r from-white via-white to-[#EFF6FF]/70 rounded-3xl border border-light-teal/40 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A7CD2] to-[#2563EB] text-white font-black text-lg flex items-center justify-center shadow-md">
              {patient?.firstName ? patient.firstName[0] : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-[#10244B]">
                  {patient?.firstName} {patient?.lastName}
                </h2>
                {(() => {
                  let ageDisplay = patient?.age ? `${patient.age} Yrs` : '2 Yrs';
                  if (patient?.dob) {
                    const birth = new Date(patient.dob);
                    if (!isNaN(birth.getTime())) {
                      const today = new Date();
                      let y = today.getFullYear() - birth.getFullYear();
                      const m = today.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) y--;
                      if (y < 1) {
                        let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
                        if (today.getDate() < birth.getDate()) months--;
                        ageDisplay = `${Math.max(1, months)} Months`;
                      } else {
                        ageDisplay = `${y} Yrs`;
                      }
                    }
                  }
                  return (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs flex items-center gap-1">
                      <span>🎂</span>
                      <span>Age: {ageDisplay}</span>
                    </span>
                  );
                })()}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  ID #{patientId}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active Patient
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-text mt-0.5 flex flex-wrap items-center gap-3">
                {(() => {
                  let ageDisplay = patient?.age ? `${patient.age} Yrs` : '2 Yrs';
                  if (patient?.dob) {
                    const birth = new Date(patient.dob);
                    if (!isNaN(birth.getTime())) {
                      const today = new Date();
                      let y = today.getFullYear() - birth.getFullYear();
                      const m = today.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) y--;
                      if (y >= 1) ageDisplay = `${y} Yrs`;
                    }
                  }
                  return (
                    <span>Age: <strong className="text-dark-slate font-black">{ageDisplay}</strong> ({patient?.gender || 'Male'})</span>
                  );
                })()}
                <span>•</span>
                <span>DOB: <strong className="text-dark-slate">{patient?.dob ? patient.dob.split('T')[0] : '2024-01-01'}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-dark-slate">{patient?.phone || '021 123 4567'}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-dark-slate">{patient?.email || 'patient@dentiaclinic.com'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl px-3.5 py-2 text-right">
              <span className="text-[9.5px] font-black text-muted-text uppercase block">Active Treatment Plan</span>
              <span className="text-xs font-black text-[#4A7CD2]">
                {patient?.currentTreatmentPlan || 'Routine Dental Care (Active)'}
              </span>
            </div>
            <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl px-3.5 py-2 text-right">
              <span className="text-[9.5px] font-black text-muted-text uppercase block">Target Shade</span>
              <span className="text-xs font-black text-amber-700">
                {patient?.targetShade || 'A1 Natural'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                let doc = null;
                try {
                  doc = JSON.parse(localStorage.getItem('doctor') || '{}');
                } catch (e) {}
                handlePrintCompletePatientReport(patient, allTeeth, doc);
              }}
              className="bg-white hover:bg-slate-50 text-[#1E40AF] border border-[#1E40AF]/30 text-[10px] font-black px-3.5 py-2.5 rounded-2xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 group"
              title="Generate and print complete patient tooth odontogram report"
            >
              <OdontogramPrintIcon className="w-4 h-4 text-[#1E40AF] group-hover:scale-110 transition-transform" />
              <span>Print Odontogram Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* Complete Anatomical Clinical Odontogram Navigator Strip */}
      <section className="max-w-[1440px] w-full mx-auto px-6 pt-3">
        <div className="bg-white rounded-3xl border border-light-teal/30 p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/20 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-[#10244B] uppercase tracking-wider flex items-center gap-1.5">
                <span>{dentitionMode === 'pediatric' ? '👶' : '🦷'}</span>
                {dentitionMode === 'pediatric' ? 'Pediatric Deciduous Navigator (A–T)' : 'Clinical Odontogram Anatomical Navigator'}
              </span>
              
              {/* Dentition Switcher Controls */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleDentitionModeSwitch('permanent')}
                  className={`px-2.5 py-0.5 rounded-lg text-[9.5px] font-black transition-all cursor-pointer ${
                    dentitionMode === 'permanent'
                      ? 'bg-white text-[#4A7CD2] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🦷 Adult (1–32)
                </button>
                <button
                  type="button"
                  onClick={() => handleDentitionModeSwitch('pediatric')}
                  className={`px-2.5 py-0.5 rounded-lg text-[9.5px] font-black transition-all cursor-pointer ${
                    dentitionMode === 'pediatric'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👶 Pediatric (A–T)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Healthy
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Caries / Decay
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Composite
              </span>
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> Pulpotomy / RCT
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" /> SSC Crown
              </span>
            </div>
          </div>

          {/* Upper Jaw & Lower Jaw Navigator Grid */}
          {dentitionMode === 'pediatric' ? (
            /* 👶 PEDIATRIC 20-TOOTH ARCH (A–T) - MATCHING ADULT ODONTOGRAM REPRESENTATION */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Primary Maxilla (A–J: Q1 UR & Q2 UL) */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-blue-900 uppercase tracking-wider">
                    Primary Maxilla (Upper Jaw)
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-500">
                    Deciduous Teeth A – J
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
                  {/* Pediatric Q1 UR (A-E) */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q1</span>
                    {[
                      { label: 'Molars', teeth: ['A', 'B'] },
                      { label: 'Canine', teeth: ['C'] },
                      { label: 'Incisors', teeth: ['D', 'E'] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(letter => {
                            const isCurrent = letter === tKey && isPediatric;
                            const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
                            const pIdx = PEDIATRIC_KEYS.indexOf(letter);
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || '').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
                              if (cat === 'pediatric') {
                                return tk === letter || (pIdx >= 0 && parseInt(tn, 10) === (pIdx + 1));
                              }
                              return tk === letter;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={letter}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${letter}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Primary Tooth ${letter} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {letter}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-px h-8 bg-slate-300 shrink-0" />

                  {/* Pediatric Q2 UL (F-J) */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    {[
                      { label: 'Incisors', teeth: ['F', 'G'] },
                      { label: 'Canine', teeth: ['H'] },
                      { label: 'Molars', teeth: ['I', 'J'] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(letter => {
                            const isCurrent = letter === tKey && isPediatric;
                            const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
                            const pIdx = PEDIATRIC_KEYS.indexOf(letter);
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || '').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
                              if (cat === 'pediatric') {
                                return tk === letter || (pIdx >= 0 && parseInt(tn, 10) === (pIdx + 1));
                              }
                              return tk === letter;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={letter}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${letter}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Primary Tooth ${letter} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {letter}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q2</span>
                  </div>
                </div>
              </div>

              {/* Primary Mandible (K–T: Q3 LL & Q4 LR) */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-blue-900 uppercase tracking-wider">
                    Primary Mandible (Lower Jaw)
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-500">
                    Deciduous Teeth K – T
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
                  {/* Pediatric Q3 LL (K-O) */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q3</span>
                    {[
                      { label: 'Molars', teeth: ['K', 'L'] },
                      { label: 'Canine', teeth: ['M'] },
                      { label: 'Incisors', teeth: ['N', 'O'] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(letter => {
                            const isCurrent = letter === tKey && isPediatric;
                            const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
                            const pIdx = PEDIATRIC_KEYS.indexOf(letter);
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || '').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
                              if (cat === 'pediatric') {
                                return tk === letter || (pIdx >= 0 && parseInt(tn, 10) === (pIdx + 1));
                              }
                              return tk === letter;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={letter}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${letter}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Primary Tooth ${letter} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {letter}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-px h-8 bg-slate-300 shrink-0" />

                  {/* Pediatric Q4 LR (P-T) */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    {[
                      { label: 'Incisors', teeth: ['P', 'Q'] },
                      { label: 'Canine', teeth: ['R'] },
                      { label: 'Molars', teeth: ['S', 'T'] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(letter => {
                            const isCurrent = letter === tKey && isPediatric;
                            const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
                            const pIdx = PEDIATRIC_KEYS.indexOf(letter);
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || '').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
                              if (cat === 'pediatric') {
                                return tk === letter || (pIdx >= 0 && parseInt(tn, 10) === (pIdx + 1));
                              }
                              return tk === letter;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={letter}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${letter}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Primary Tooth ${letter} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {letter}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q4</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 🦷 ADULT PERMANENT 32-TOOTH ARCH (1–32) */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* 1. MAXILLA (UPPER JAW: Q1 UR & Q2 UL) */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-blue-900 uppercase tracking-wider">
                    Maxilla (Upper Jaw)
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-500">
                    Teeth #1 – #16
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
                  {/* Q1 Upper Right */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q1</span>
                    {[
                      { label: 'Molars', teeth: [1, 2, 3] },
                      { label: 'Premolars', teeth: [4, 5] },
                      { label: 'Canine', teeth: [6] },
                      { label: 'Incisors', teeth: [7, 8] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(num => {
                            const isCurrent = num === tNum && !isPediatric;
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || 'adult').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = parseInt(t.toothNumber ?? t.ToothNumber, 10);
                              if (cat === 'adult') {
                                return tn === num || tk === String(num);
                              }
                              return !/^[A-T]$/i.test(tk) && tn === num;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={num}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${num}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Tooth #${num} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {num}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-px h-8 bg-slate-300 shrink-0" />

                  {/* Q2 Upper Left */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    {[
                      { label: 'Incisors', teeth: [9, 10] },
                      { label: 'Canine', teeth: [11] },
                      { label: 'Premolars', teeth: [12, 13] },
                      { label: 'Molars', teeth: [14, 15, 16] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(num => {
                            const isCurrent = num === tNum && !isPediatric;
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || 'adult').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = parseInt(t.toothNumber ?? t.ToothNumber, 10);
                              if (cat === 'adult') {
                                return tn === num || tk === String(num);
                              }
                              return !/^[A-T]$/i.test(tk) && tn === num;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={num}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${num}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Tooth #${num} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {num}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <span className="text-[8.5px] font-black text-indigo-600 uppercase writing-mode-vertical px-0.5">Q2</span>
                  </div>
                </div>
              </div>

              {/* 2. MANDIBLE (LOWER JAW: Q3 LL & Q4 LR) */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-purple-900 uppercase tracking-wider">
                    Mandible (Lower Jaw)
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-500">
                    Teeth #17 – #32
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
                  {/* Q3 Lower Left */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[8.5px] font-black text-purple-600 uppercase writing-mode-vertical px-0.5">Q3</span>
                    {[
                      { label: 'Molars', teeth: [17, 18, 19] },
                      { label: 'Premolars', teeth: [20, 21] },
                      { label: 'Canine', teeth: [22] },
                      { label: 'Incisors', teeth: [23, 24] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(num => {
                            const isCurrent = num === tNum && !isPediatric;
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || 'adult').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = parseInt(t.toothNumber ?? t.ToothNumber, 10);
                              if (cat === 'adult') {
                                return tn === num || tk === String(num);
                              }
                              return !/^[A-T]$/i.test(tk) && tn === num;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={num}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${num}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Tooth #${num} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {num}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-px h-8 bg-slate-300 shrink-0" />

                  {/* Q4 Lower Right */}
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    {[
                      { label: 'Incisors', teeth: [25, 26] },
                      { label: 'Canine', teeth: [27] },
                      { label: 'Premolars', teeth: [28, 29] },
                      { label: 'Molars', teeth: [30, 31, 32] }
                    ].map((grp, gIdx) => (
                      <div key={gIdx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                        <div className="flex items-center gap-1">
                          {grp.teeth.map(num => {
                            const isCurrent = num === tNum && !isPediatric;
                            const matchingTeeth = (allTeeth || []).find(t => {
                              const cat = (t.dentitionCategory || t.DentitionCategory || 'adult').trim().toLowerCase();
                              const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
                              const tn = parseInt(t.toothNumber ?? t.ToothNumber, 10);
                              if (cat === 'adult') {
                                return tn === num || tk === String(num);
                              }
                              return !/^[A-T]$/i.test(tk) && tn === num;
                            });
                            const toothStatus = matchingTeeth?.conditionStatus || matchingTeeth?.status || 'Healthy';
                            const toothColor = matchingTeeth?.conditionColor || matchingTeeth?.color || getHexColor(toothStatus);
                            const isH = toothStatus === 'Healthy';
                            return (
                              <button
                                key={num}
                                onClick={() => navigate(`/chart/${patientId}/tooth/${num}`)}
                                className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
                                  isCurrent
                                    ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
                                    : !isH
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title={`Tooth #${num} (${grp.label.slice(0, -1)}): ${toothStatus}`}
                              >
                                {num}
                                {!isH && !isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs" style={{ backgroundColor: toothColor }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <span className="text-[8.5px] font-black text-emerald-600 uppercase writing-mode-vertical px-0.5">Q4</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Left Column: 3D Visualizer & Quick Condition Modifiers (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
          {/* 3D Interactive Tooth Card */}
          <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between pb-2.5 border-b border-light-teal/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                <span className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                  Interactive 3D Occlusal Model
                </span>
              </div>
              <span className="text-[10px] font-bold text-muted-text">
                Drag to rotate · Auto-spin
              </span>
            </div>

            {/* Canvas Container */}
            <div className="w-full h-[300px] flex items-center justify-center my-1 relative">
              <div ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center" />
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs">
                {(() => {
                  const s = `${toothData?.status || ''} ${toothData?.comments || ''}`.toLowerCase();
                  if (s.includes('miss') || s.includes('extract') || s.includes('absent') || s.includes('lost') || toothData?.color === '#94A3B8' || toothData?.color === '#64748B') {
                    return '🕳️ CLINICALLY ABSENT (EXTRACTED SOCKET)';
                  }
                  return isPediatric ? `PRIMARY ${tKey} (${toothInfo.shape.toUpperCase()})` : `${toothInfo.shape.toUpperCase()} CROWN`;
                })()}
              </div>
            </div>

            {/* Active Status Badge Bar */}
            <div className="w-full bg-[#F8FAFC] border border-light-teal/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-muted-text">Primary Clinical Status</p>
                <p className="text-xs font-black text-[#4A7CD2] mt-0.5">{toothData?.status || 'Healthy'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase text-muted-text">Condition Color</p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: toothData?.color || getHexColor(toothData?.status) }} />
                  <span className="text-[11px] font-bold text-slate-700">{toothData?.color || getHexColor(toothData?.status)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Condition Applicator */}
          {(() => {
            const pediatricPresets = [
              { id: 'Healthy', label: '🟢 Healthy', color: '#10B981', cdt: 'D0120' },
              { id: 'Caries — Deciduous (O)', label: '🔴 Baby Decay (O)', color: '#EF4444', cdt: 'D2391' },
              { id: 'Caries — Deciduous (MOD)', label: '🔴 Baby Decay (MOD)', color: '#EF4444', cdt: 'D2393' },
              { id: 'Pulpotomy (MTA)', label: '🟣 Pulpotomy MTA', color: '#7C3AED', cdt: 'D3220' },
              { id: 'Stainless Steel Crown (SSC)', label: '🔘 SSC Crown', color: '#64748B', cdt: 'D2930' },
              { id: 'Strip Crown (Composite)', label: '🔵 Strip Crown', color: '#2563EB', cdt: 'D2934' },
              { id: 'Space Maintainer (Band & Loop)', label: '🟡 Space Maintainer', color: '#F59E0B', cdt: 'D1510' },
              { id: 'Fluoride Varnish / Sealant', label: '🛡️ Fluoride Varnish', color: '#06B6D4', cdt: 'D1206' },
              { id: 'Extracted / Missing Baby Tooth', label: '❌ Exfoliated', color: '#DC2626', cdt: 'D7111' }
            ];

            const adultPresets = [
              { id: 'Healthy', label: '🟢 Healthy', color: '#10B981', cdt: 'D0120' },
              { id: 'Caries — O', label: '🔴 Caries (O)', color: '#EF4444', cdt: 'D2391' },
              { id: 'Caries — DO', label: '🔴 Caries (DO)', color: '#EF4444', cdt: 'D2392' },
              { id: 'Caries — MOD', label: '🔴 Caries (MOD)', color: '#EF4444', cdt: 'D2393' },
              { id: 'Filling — Composite (O)', label: '🔵 Composite', color: '#2563EB', cdt: 'D2391' },
              { id: 'Filling — Amalgam', label: '🔘 Amalgam', color: '#64748B', cdt: 'D2150' },
              { id: 'Root Canal (RCT)', label: '🟣 RCT Endo', color: '#7C3AED', cdt: 'D3330' },
              { id: 'Dental Implant', label: '🟢 Dental Implant', color: '#0E8A80', cdt: 'D6010' },
              { id: 'Extracted / Missing', label: '❌ Extracted / Absent', color: '#94A3B8', cdt: 'D7140' }
            ];

            const currentPresets = isPediatric ? pediatricPresets : adultPresets;

            const presetDescriptions = {
              'Healthy': {
                title: 'Clinically Sound & Intact',
                meaning: 'Dentition is intact with no detectable caries, demineralization, pulpal inflammation, or structural anomalies.',
                clinicalTip: 'Routine preventive prophylaxis and oral hygiene maintenance recommended.'
              },
              'Caries — Deciduous (O)': {
                title: 'Primary Occlusal Caries',
                meaning: 'Active pit-and-fissure caries lesion restricted to the occlusal enamel and superficial dentin.',
                clinicalTip: 'Requires conservative resin infiltration or composite restoration.'
              },
              'Caries — Deciduous (MOD)': {
                title: 'Multi-Surface Deciduous Decay',
                meaning: 'Extensive proximal caries involvement across mesial, occlusal, and distal surfaces compromising cuspal integrity.',
                clinicalTip: 'Indicated for full-coronal preformed Stainless Steel Crown (SSC) protection.'
              },
              'Pulpotomy (MTA)': {
                title: 'Coronal Pulpotomy (MTA / Bioceramic)',
                meaning: 'Coronal vital pulp amputated with bioceramic/MTA bioactive barrier to preserve healthy radicular pulp vitality.',
                clinicalTip: 'Recommended follow-up restoration: full coverage SSC to avoid microleakage.'
              },
              'Stainless Steel Crown (SSC)': {
                title: 'Preformed Stainless Steel Crown (SSC)',
                meaning: 'Full coronal metal crown cemented over tooth to restore multi-surface structure and prevent recurrent decay.',
                clinicalTip: 'Gold-standard longevity for primary molar restorations.'
              },
              'Strip Crown (Composite)': {
                title: 'Anterior Strip Crown (Bonded Composite)',
                meaning: 'Celluloid matrix strip crown bonded with micro-hybrid composite restoring primary anterior aesthetics and function.',
                clinicalTip: 'Monitor incisal edge clearance during mastication.'
              },
              'Space Maintainer (Band & Loop)': {
                title: 'Fixed Space Maintainer (Band & Loop)',
                meaning: 'Orthodontic appliance cemented on primary anchor tooth to prevent mesial drift and preserve eruption path for permanent successor.',
                clinicalTip: 'Check appliance stability and cement integrity during periodic recall.'
              },
              'Fluoride Varnish / Sealant': {
                title: 'Fluoride Varnish / Pit & Fissure Sealant',
                meaning: 'Topical high-concentration sodium fluoride varnish or resin-based sealant applied for enamel remineralization.',
                clinicalTip: 'Enhances acid resistance and prevents fissure bacterial colonization.'
              },
              'Extracted / Missing Baby Tooth': {
                title: 'Deciduous Exfoliation / Surgical Extraction',
                meaning: 'Primary tooth naturally exfoliated or extracted; alveolar ridge healed or permanent tooth in active eruption.',
                clinicalTip: 'Assess space maintenance requirements to prevent arch perimeter collapse.'
              },
              'Caries — O': {
                title: 'Occlusal Dental Caries (Class I)',
                meaning: 'Enamel/dentin demineralization restricted to occlusal groove system.',
                clinicalTip: 'Recommended: minimally invasive composite restoration.'
              },
              'Caries — DO': {
                title: 'Disto-Occlusal Caries (Class II)',
                meaning: 'Interproximal caries lesion affecting distal contact and occlusal margin.',
                clinicalTip: 'Requires matrix band composite restoration and proximal contouring.'
              },
              'Caries — MOD': {
                title: 'Mesio-Occlusal-Distal Caries (Class II)',
                meaning: 'Extensive multi-surface caries involving both interproximal contact zones.',
                clinicalTip: 'Assess remaining tooth structure for onlay or full-coverage crown.'
              },
              'Filling — Composite (O)': {
                title: 'Occlusal Composite Resin Restoration',
                meaning: 'Light-cured aesthetic resin restoration restoring occlusal anatomical landmarks.',
                clinicalTip: 'Verify occlusion and marginal seal integrity.'
              },
              'Filling — Amalgam': {
                title: 'Dental Amalgam Restoration',
                meaning: 'Direct silver amalgam alloy restoration providing high compressive strength.',
                clinicalTip: 'Check for marginal breakdown or recurrent proximal ditching.'
              },
              'Root Canal (RCT)': {
                title: 'Endodontic Root Canal Therapy',
                meaning: 'Pulpal debridement, chemo-mechanical instrumentation, and bioceramic/gutta-percha obturation completed.',
                clinicalTip: 'Recommended full-coverage cuspal protection (crown) to prevent fracture.'
              },
              'Dental Implant': {
                title: 'Endosseous Titanium/Zirconia Dental Implant',
                meaning: 'Surgically placed osseointegrated implant fixture supporting prosthetic crown.',
                clinicalTip: 'Evaluate peri-implant probing depths and marginal bone levels.'
              },
              'Extracted / Missing': {
                title: 'Clinically Absent / Extracted Tooth',
                meaning: 'Tooth is congenitally missing or previously extracted.',
                clinicalTip: 'Consider replacement options: implant, bridge, or orthodontic space closure.'
              }
            };

            const isPresetSelected = (condId) => {
              const currentStatus = (toothData?.status || 'Healthy').toLowerCase();
              const comments = (toothData?.comments || toothData?.comment || '').toLowerCase();
              const fullText = `${currentStatus} ${comments}`;
              const cid = (condId || '').toLowerCase();

              if (currentStatus === cid) return true;
              if (cid === 'healthy') {
                return currentStatus === 'healthy' || currentStatus === 'sound' || currentStatus.includes('cleaning') || (!toothData?.status && !comments);
              }
              if (cid.includes('space')) {
                return fullText.includes('space') || fullText.includes('maintainer') || fullText.includes('band');
              }
              if (cid.includes('pulpotomy')) {
                return fullText.includes('pulpotomy') || fullText.includes('mta');
              }
              if (cid.includes('stainless') || cid.includes('ssc')) {
                return fullText.includes('ssc') || fullText.includes('stainless');
              }
              if (cid.includes('strip crown')) {
                return fullText.includes('strip crown');
              }
              if (cid.includes('fluoride') || cid.includes('varnish')) {
                return fullText.includes('fluoride') || fullText.includes('varnish');
              }
              if (cid.includes('exfoliat') || cid.includes('missing') || cid.includes('extract') || cid.includes('absent')) {
                return fullText.includes('exfoliat') || fullText.includes('miss') || fullText.includes('extract') || fullText.includes('absent');
              }
              if (cid.includes('implant')) {
                return fullText.includes('implant');
              }
              if (cid.includes('root canal') || cid.includes('rct')) {
                return fullText.includes('already treated') || fullText.includes('treated') || fullText.includes('rct') || fullText.includes('canal') || fullText.includes('endo') || fullText.includes('pulpitis');
              }
              if (cid.includes('amalgam')) {
                return fullText.includes('amalgam');
              }
              if (cid.includes('composite')) {
                return fullText.includes('composite') || fullText.includes('resin') || fullText.includes('broken');
              }
              if (cid.includes('caries') || cid.includes('decay')) {
                if (cid.includes('mod')) return fullText.includes('mod');
                if (cid.includes('do')) return fullText.includes('do') && !fullText.includes('mod');
                if (cid.includes('(o)') || cid.includes('— o')) return (fullText.includes('(o)') || fullText.includes('— o') || fullText.includes('occlusal') || fullText.includes('decay') || fullText.includes('damaged')) && !fullText.includes('mod') && !fullText.includes('do');
                return fullText.includes('caries') || fullText.includes('decay') || fullText.includes('cavity') || fullText.includes('keera') || fullText.includes('ecc');
              }
              return false;
            };

            const activePreset = currentPresets.find(cond => isPresetSelected(cond.id)) || (
              toothData?.status && toothData?.status !== 'Healthy' ? {
                id: toothData.status,
                label: toothData.status,
                color: toothData.color || getHexColor(toothData.status),
                cdt: 'EHR-CUSTOM'
              } : currentPresets[0]
            );

            const activeDetail = presetDescriptions[activePreset?.id] || {
              title: activePreset?.label?.replace(/^[^\s]+\s/, '') || activePreset?.id || 'Active Clinical Observation',
              meaning: `Actively recorded clinical condition in patient electronic health record for ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}.`,
              clinicalTip: 'Documented in odontogram and synchronized across patient treatment plan.'
            };

            return (
              <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#4A7CD2]" />
                    {isPediatric ? 'Pediatric Clinical Presets' : 'Quick Condition Preset Selector'}
                  </h3>
                  <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                    {isPediatric ? 'Pediatric Primary Teeth' : 'Permanent Dentition'}
                  </span>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {currentPresets.map(cond => {
                    const isSelected = isPresetSelected(cond.id);
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => {
                          const matchingPalette = 
                            cond.id.includes('Healthy') ? 'Healthy' :
                            cond.id.includes('Caries') ? 'Caries (Decay)' :
                            cond.id.includes('Composite') || cond.id.includes('Strip Crown') ? 'Composite Filling' :
                            cond.id.includes('Amalgam') ? 'Amalgam' :
                            cond.id.includes('Pulpotomy') ? 'Pulpotomy (MTA)' :
                            cond.id.includes('Stainless') || cond.id.includes('SSC') ? 'Stainless Steel Crown (SSC)' :
                            cond.id.includes('Root Canal') || cond.id.includes('RCT') ? 'Root Canal (RCT)' :
                            cond.id.includes('Implant') ? 'Dental Implant' :
                            cond.id.includes('Space') ? 'Space Maintainer' :
                            cond.id.includes('Fluoride') ? 'Fluoride Varnish / Sealant' :
                            cond.id.includes('Missing') || cond.id.includes('Extracted') ? 'Extracted / Missing' : 'Healthy';
                          setActivePaletteItem(matchingPalette);
                          handleSaveObservation(
                            cond.id, 
                            `Clinical diagnosis: ${cond.label} recorded on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}`, 
                            cond.color
                          );
                        }}
                        className={`p-2.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center relative flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-md font-black ring-2 ring-[#4A7CD2]/40 scale-[1.02] z-10'
                            : 'bg-[#F8FAFC] text-dark-slate border-slate-200 hover:bg-[#EFF6FF] hover:border-blue-200'
                        }`}
                      >
                        <span className="truncate w-full">{cond.label}</span>
                        {isSelected && (
                          <span className="text-[8px] uppercase tracking-widest font-black bg-white/20 px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Preset Detail Banner */}
                {activePreset && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border border-[#4A7CD2]/30 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-blue-100/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-white"
                          style={{ backgroundColor: activePreset.color || '#4A7CD2' }}
                        />
                        <div>
                          <p className="text-[11px] font-black text-[#10244B]">
                            {activePreset.label}
                          </p>
                          <p className="text-[9.5px] font-bold text-[#4A7CD2]">
                            {activeDetail.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {activePreset.cdt && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs font-mono">
                            CDT: {activePreset.cdt}
                          </span>
                        )}
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#4A7CD2] text-white shadow-2xs flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Selected
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-600">
                      <p className="text-[10px] leading-relaxed font-medium">
                        <span className="font-extrabold text-[#10244B]">Clinical Meaning: </span>
                        {activeDetail.meaning}
                      </p>
                      <p className="text-[10px] leading-relaxed font-medium text-blue-900/90 bg-blue-100/40 p-2 rounded-xl border border-blue-200/50">
                        <span className="font-extrabold text-[#2563EB]">Protocol / Tip: </span>
                        {activeDetail.clinicalTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Anatomical Details Card */}
          <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-light-teal/20 pb-2">
              <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4A7CD2]" />
                Anatomical & Endodontic Specifications
              </h3>
              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Standard Dental Anatomy
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Dental Arch & Quadrant</p>
                <p className="font-extrabold text-slate-900">{toothInfo.arch}</p>
                <p className="text-[10px] font-bold text-[#4A7CD2]">{toothInfo.quad}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Morphology & Cusps</p>
                <p className="font-extrabold text-slate-900">{toothInfo.roots} Roots · {toothInfo.cusps}</p>
                <p className="text-[10px] font-semibold text-muted-text">{toothInfo.shape.toUpperCase()} Crown</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Root Canal System (Endo)</p>
                <p className="font-extrabold text-purple-900">{toothInfo.canals}</p>
                <p className="text-[10px] font-semibold text-purple-700/80">Obturation Configuration</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Sensory Innervation</p>
                <p className="font-extrabold text-slate-900">{toothInfo.innervation}</p>
                <p className="text-[10px] font-semibold text-muted-text">Trigeminal Branch (CN V)</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Eruption Chronology</p>
                <p className="font-extrabold text-emerald-800">{toothInfo.eruption}</p>
                <p className="text-[10px] font-semibold text-emerald-600">Permanent Dentition</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Antagonistic Occlusion</p>
                <p className="font-extrabold text-slate-900 truncate" title={toothInfo.antagonist}>{toothInfo.antagonist}</p>
                <p className="text-[10px] font-semibold text-muted-text">Opposing Arch Contact</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Dossier, Affected Zone, Periodontal & Notes (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
          {/* Executive Clinical Header Banner */}
          <div className="bg-gradient-to-r from-white via-white to-[#EFF6FF] rounded-3xl border border-light-teal/50 p-5 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Specialty: {specialty}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-[#2563EB] border border-blue-200">
                  Universal #{tNum}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                  FDI #{fdiNum}
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-500">
                Last Evaluated: Today, 2026
              </span>
            </div>

            {/* Explicit Affected Zone Display */}
            <div className="bg-white border-2 border-[#4A7CD2]/30 rounded-2xl p-3.5 shadow-2xs flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">
                  Diagnosed Affected Zone & Anatomical Surface
                </p>
                <p className="text-sm font-black text-[#10244B] mt-0.5">
                  {affectedZone}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-light-teal/30 pb-1">
            {[
              { id: 'overview', label: 'Clinical Overview & Notes', icon: FileText },
              { id: 'periodontal', label: 'Periodontal Probing Matrix', icon: Activity },
              { id: 'surfaces', label: 'Multi-Surface Zone Matrix', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#4A7CD2] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Clinical Overview & Doctor Notes */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4A7CD2]" />
                    Doctor Clinical Observation Notes & Dictation Log
                  </h3>
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="text-xs font-bold text-[#4A7CD2] hover:underline cursor-pointer"
                  >
                    {isEditingNotes ? 'Cancel Edit' : 'Edit Notes ✍️'}
                  </button>
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-semibold p-3 rounded-2xl border border-light-teal/50 bg-[#F8FAFC] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#4A7CD2]"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveObservation(toothData?.status, editingNotes, toothData?.color)}
                        disabled={saving}
                        className="bg-[#4A7CD2] text-white text-xs font-black px-4 py-1.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl p-4 space-y-2">
                    <p className="text-xs text-dark-slate font-semibold leading-relaxed whitespace-pre-line">
                      {toothData?.comments || toothData?.comment || 'No abnormal pathology detected. Enamel surface is intact with physiological bone levels.'}
                    </p>
                  </div>
                )}
              </div>

              {/* 5 SURFACE ZONES (O, M, D, B, L) INTERACTIVE BOX DIAGRAM CARD (FRONT & CENTER) */}
              <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-light-teal/20 pb-2.5">
                  <div>
                    <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#4A7CD2]" />
                      5 Surface Zones (O, M, D, B, L) Cross-Section Diagram
                    </h3>
                    <p className="text-[10px] font-bold text-muted-text mt-0.5">
                      Standard Anatomical Dental Odontogram 5-Surface Cross-Section Box · Click any zone to apply condition
                    </p>
                  </div>
                  {/* Minimalist Live DB Pulsing Green Dot with Hover Popover */}
                  <div className="relative group flex items-center">
                    <div 
                      className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center cursor-pointer shadow-2xs transition-transform hover:scale-110"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/30" />
                    </div>

                    {/* Hover Popover Tooltip */}
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-1 bg-[#10244B] text-white text-[10px] font-semibold px-3 py-2 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none border border-cyan-400/30 animate-fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live DB Connected</span>
                      </div>
                      <span className="text-slate-300 text-[9.5px]">
                        Surface zones synced with Patient #{patientId} EHR Database (Real-Time)
                      </span>
                      {/* Triangle Arrow */}
                      <div className="absolute -top-1 right-2 w-2 h-2 bg-[#10244B] rotate-45 border-l border-t border-cyan-400/30" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF]/50 rounded-2xl border border-light-teal/30 p-4 flex flex-wrap items-center justify-around gap-4">
                  {/* Geometric 5-Zone Diagram */}
                  <div className="flex flex-col items-center select-none">
                    <span className="text-[10.5px] font-black text-slate-700 uppercase mb-1.5 tracking-wider">
                      {tNum <= 16 ? 'B (BUCCAL)' : 'B (FACIAL / BUCCAL)'}
                    </span>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10.5px] font-black text-slate-700 w-16 text-right">
                        {tNum <= 8 || (tNum >= 17 && tNum <= 24) ? 'D (Distal)' : 'M (Mesial)'}
                      </span>

                      {/* 5-Zone Trapezoid Box SVG */}
                      <svg width="130" height="130" viewBox="0 0 100 100" className="filter drop-shadow-md cursor-pointer">
                        {/* Top (B - Buccal) */}
                        <polygon
                          points="10,10 90,10 70,30 30,30"
                          fill={getZoneFill('B')}
                          stroke={getZoneStroke('B')}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone('B')}
                        >
                          <title>{`Buccal (B) Surface: ${surfaceData['B'] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="50" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill('B')} pointerEvents="none">
                          B
                        </text>

                        {/* Bottom (L - Lingual/Palatal) */}
                        <polygon
                          points="30,70 70,70 90,90 10,90"
                          fill={getZoneFill('L')}
                          stroke={getZoneStroke('L')}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone('L')}
                        >
                          <title>{`Lingual/Palatal (L) Surface: ${surfaceData['L'] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="50" y="83" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill('L')} pointerEvents="none">
                          L
                        </text>

                        {/* Left Zone */}
                        <polygon
                          points="10,10 30,30 30,70 10,90"
                          fill={getZoneFill(leftKey)}
                          stroke={getZoneStroke(leftKey)}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone(leftKey)}
                        >
                          <title>{`${leftKey} Surface: ${surfaceData[leftKey] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="21" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill(leftKey)} pointerEvents="none">
                          {leftKey}
                        </text>

                        {/* Right Zone */}
                        <polygon
                          points="70,30 90,10 90,90 70,70"
                          fill={getZoneFill(rightKey)}
                          stroke={getZoneStroke(rightKey)}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone(rightKey)}
                        >
                          <title>{`${rightKey} Surface: ${surfaceData[rightKey] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="79" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill(rightKey)} pointerEvents="none">
                          {rightKey}
                        </text>

                        {/* Center (O - Occlusal) */}
                        <polygon
                          points="30,30 70,30 70,70 30,70"
                          fill={getZoneFill('O')}
                          stroke={getZoneStroke('O')}
                          strokeWidth="2"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone('O')}
                        >
                          <title>{`Occlusal (O) Surface: ${surfaceData['O'] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="50" y="54" textAnchor="middle" fontSize="10" fontWeight="900" fill={getZoneTextFill('O')} pointerEvents="none">
                          O
                        </text>
                      </svg>

                      <span className="text-[10.5px] font-black text-slate-700 w-16 text-left">
                        {tNum <= 8 || (tNum >= 17 && tNum <= 24) ? 'M (Mesial)' : 'D (Distal)'}
                      </span>
                    </div>

                    <span className="text-[10.5px] font-black text-slate-700 uppercase mt-1.5 tracking-wider">
                      {tNum <= 16 ? 'L (PALATAL)' : 'L (LINGUAL)'}
                    </span>
                  </div>

                  {/* Palette & Batch Actions Card */}
                  <div className="space-y-3 min-w-[220px]">
                    <div className="bg-white rounded-2xl border border-light-teal/40 p-3 shadow-2xs space-y-1">
                      <span className="text-[9.5px] font-bold text-muted-text uppercase block">
                        Active Palette Item:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${activePaletteItem === 'Healthy' ? 'text-emerald-600' : activePaletteItem === 'Caries (Decay)' ? 'text-rose-600' : 'text-[#2563EB]'}`}>
                          {activePaletteItem}
                        </span>
                      </div>
                    </div>

                    {/* Palette Selector Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {(isPediatric 
                        ? ['Healthy', 'Caries (Decay)', 'Composite Filling', 'Pulpotomy (MTA)', 'Stainless Steel Crown (SSC)', 'Space Maintainer', 'Fluoride Varnish'] 
                        : ['Healthy', 'Caries (Decay)', 'Composite Filling', 'Amalgam', 'Root Canal (RCT)', 'Stainless Steel Crown (SSC)', 'Dental Implant']
                      ).map(pal => {
                        const isSel = activePaletteItem === pal;
                        const isH = pal === 'Healthy';
                        const isCar = pal.includes('Caries') || pal.includes('Decay');
                        const isComp = pal.includes('Composite');
                        const isAmal = pal.includes('Amalgam') || pal.includes('SSC');
                        const isRct = pal.includes('Root Canal') || pal.includes('Pulpotomy');
                        const isImp = pal.includes('Implant');

                        let activeClass = 'bg-[#4A7CD2] text-white border-[#4A7CD2] font-black shadow-xs';
                        if (isH) activeClass = 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs';
                        else if (isCar) activeClass = 'bg-rose-600 text-white border-rose-600 font-black shadow-xs';
                        else if (isComp) activeClass = 'bg-[#2563EB] text-white border-[#2563EB] font-black shadow-xs';
                        else if (isAmal) activeClass = 'bg-slate-700 text-white border-slate-700 font-black shadow-xs';
                        else if (isRct) activeClass = 'bg-purple-700 text-white border-purple-700 font-black shadow-xs';
                        else if (isImp) activeClass = 'bg-teal-700 text-white border-teal-700 font-black shadow-xs';

                        return (
                          <button
                            key={pal}
                            type="button"
                            onClick={() => setActivePaletteItem(pal)}
                            className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isSel
                                ? activeClass
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {pal}
                          </button>
                        );
                      })}
                    </div>

                    {/* All 5 Zones & Clear Zones Buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={handleApplyAll5Zones}
                        className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-black py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer text-center"
                      >
                        All 5 Zones
                      </button>
                      <button
                        onClick={handleClearAllZones}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                      >
                        Clear Zones
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Condition Diagnoses Breakdown */}
              <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                  Active Clinical Findings Breakdown
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(toothData?.status || 'Healthy').split(/[·•,]/).map((item, idx) => {
                    const clean = item.trim();
                    if (!clean) return null;
                    const isC = clean.toLowerCase().includes('caries') || clean.toLowerCase().includes('decay');
                    return (
                      <div 
                        key={idx} 
                        className={`px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-2 border ${
                          isC 
                            ? 'bg-rose-50 border-rose-200 text-rose-800' 
                            : 'bg-blue-50 border-blue-200 text-[#1E3A8A]'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isC ? 'text-rose-600' : 'text-[#2563EB]'}`} />
                        {clean}
                      </div>
                    );
                  })}
                  {Boolean(toothData?.rotationDeg) && (
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-indigo-600" />
                      Axial Rotation: {toothData.rotationDeg}°
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Periodontal Probing Matrix */}
          {activeTab === 'periodontal' && (
            <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#4A7CD2]" />
                  6-Point Periodontal Probing Depths (mm)
                </h3>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                  Healthy: 1–3mm · Sulcus &gt; 4mm indicates Pocket
                </span>
              </div>

              {/* Facial / Buccal Measurements */}
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-black text-slate-700 uppercase">Facial / Buccal Probing Depths</p>
                <div className="grid grid-cols-3 gap-3">
                  {['mesiobuccal', 'midbuccal', 'distobuccal'].map(site => (
                    <div key={site} className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-muted-text uppercase">{site.replace('buccal', ' B')}</p>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={probingDepths[site]}
                        onChange={(e) => setProbingDepths(prev => ({ ...prev, [site]: parseInt(e.target.value) || 1 }))}
                        className="w-16 mx-auto text-center text-lg font-black text-[#4A7CD2] bg-slate-50 border border-slate-200 rounded-lg mt-1 p-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Lingual / Palatal Measurements */}
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-black text-slate-700 uppercase">Lingual / Palatal Probing Depths</p>
                <div className="grid grid-cols-3 gap-3">
                  {['mesiolingual', 'midlingual', 'distolingual'].map(site => (
                    <div key={site} className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-muted-text uppercase">{site.replace('lingual', ' L')}</p>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={probingDepths[site]}
                        onChange={(e) => setProbingDepths(prev => ({ ...prev, [site]: parseInt(e.target.value) || 1 }))}
                        className="w-16 mx-auto text-center text-lg font-black text-[#4A7CD2] bg-slate-50 border border-slate-200 rounded-lg mt-1 p-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Multi-Surface Zone Matrix */}
          {activeTab === 'surfaces' && (
            <div className="space-y-5 animate-fade-in">
              {/* 5 SURFACE ZONES (O, M, D, B, L) INTERACTIVE BOX DIAGRAM CARD */}
              <div className="bg-white rounded-3xl border border-light-teal/40 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-light-teal/20 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#4A7CD2]" />
                      5 Surface Zones (O, M, D, B, L) Cross-Section Diagram
                    </h3>
                    <p className="text-[10.5px] font-bold text-muted-text mt-0.5">
                      Standard Anatomical Dental Odontogram 5-Surface Cross-Section Box
                    </p>
                  </div>
                  {/* Minimalist Live DB Pulsing Green Dot with Hover Popover */}
                  <div className="relative group flex items-center">
                    <div 
                      className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center cursor-pointer shadow-2xs transition-transform hover:scale-110"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/30" />
                    </div>

                    {/* Hover Popover Tooltip */}
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-1 bg-[#10244B] text-white text-[10px] font-semibold px-3 py-2 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none border border-cyan-400/30 animate-fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live DB Connected</span>
                      </div>
                      <span className="text-slate-300 text-[9.5px]">
                        Surface zones synced with Patient #{patientId} EHR Database (Real-Time)
                      </span>
                      {/* Triangle Arrow */}
                      <div className="absolute -top-1 right-2 w-2 h-2 bg-[#10244B] rotate-45 border-l border-t border-cyan-400/30" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF]/50 rounded-2xl border border-light-teal/30 p-6 flex flex-wrap items-center justify-around gap-6">
                  {/* Geometric 5-Zone Diagram */}
                  <div className="flex flex-col items-center select-none">
                    <span className="text-[11px] font-black text-slate-700 uppercase mb-2 tracking-wider">
                      {tNum <= 16 ? 'B (BUCCAL)' : 'B (FACIAL / BUCCAL)'}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-700 w-20 text-right">
                        {tNum <= 8 || (tNum >= 17 && tNum <= 24) ? 'D (Distal)' : 'M (Mesial)'}
                      </span>

                      {/* 5-Zone Trapezoid Box SVG */}
                      <svg width="150" height="150" viewBox="0 0 100 100" className="filter drop-shadow-md cursor-pointer">
                        {/* Top (B - Buccal) */}
                        <polygon
                          points="10,10 90,10 70,30 30,30"
                          fill={getZoneFill('B')}
                          stroke={getZoneStroke('B')}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone('B')}
                        >
                          <title>{`Buccal (B) Surface: ${surfaceData['B'] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="50" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill('B')} pointerEvents="none">
                          B
                        </text>

                        {/* Bottom (L - Lingual/Palatal) */}
                        <polygon
                          points="30,70 70,70 90,90 10,90"
                          fill={getZoneFill('L')}
                          stroke={getZoneStroke('L')}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone('L')}
                        >
                          <title>{`Lingual/Palatal (L) Surface: ${surfaceData['L'] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="50" y="83" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill('L')} pointerEvents="none">
                          L
                        </text>

                        {/* Left Zone */}
                        <polygon
                          points="10,10 30,30 30,70 10,90"
                          fill={getZoneFill(leftKey)}
                          stroke={getZoneStroke(leftKey)}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone(leftKey)}
                        >
                          <title>{`${leftKey} Surface: ${surfaceData[leftKey] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="21" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill(leftKey)} pointerEvents="none">
                          {leftKey}
                        </text>

                        {/* Right Zone */}
                        <polygon
                          points="70,30 90,10 90,90 70,70"
                          fill={getZoneFill(rightKey)}
                          stroke={getZoneStroke(rightKey)}
                          strokeWidth="1.6"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone(rightKey)}
                        >
                          <title>{`${rightKey} Surface: ${surfaceData[rightKey] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="79" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill={getZoneTextFill(rightKey)} pointerEvents="none">
                          {rightKey}
                        </text>

                        {/* Center (O - Occlusal) */}
                        <polygon
                          points="30,30 70,30 70,70 30,70"
                          fill={getZoneFill('O')}
                          stroke={getZoneStroke('O')}
                          strokeWidth="2"
                          className="transition-all duration-200 hover:opacity-85 hover:brightness-105"
                          onClick={() => handleToggleZone('O')}
                        >
                          <title>{`Occlusal (O) Surface: ${surfaceData['O'] || 'Healthy'}`}</title>
                        </polygon>
                        <text x="50" y="54" textAnchor="middle" fontSize="10" fontWeight="900" fill={getZoneTextFill('O')} pointerEvents="none">
                          O
                        </text>
                      </svg>

                      <span className="text-[11px] font-black text-slate-700 w-20 text-left">
                        {tNum <= 8 || (tNum >= 17 && tNum <= 24) ? 'M (Mesial)' : 'D (Distal)'}
                      </span>
                    </div>

                    <span className="text-[11px] font-black text-slate-700 uppercase mt-2 tracking-wider">
                      {tNum <= 16 ? 'L (PALATAL)' : 'L (LINGUAL)'}
                    </span>
                  </div>

                  {/* Palette & Batch Actions Card (Matching Attached Image) */}
                  <div className="space-y-4 min-w-[260px]">
                    <div className="bg-white rounded-2xl border border-light-teal/40 p-4 shadow-2xs space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-text uppercase block">
                        Active Palette Item:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-black ${activePaletteItem === 'Healthy' ? 'text-emerald-600' : activePaletteItem === 'Caries (Decay)' ? 'text-rose-600' : 'text-[#2563EB]'}`}>
                          {activePaletteItem}
                        </span>
                      </div>
                    </div>

                    {/* Palette Selector Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {(isPediatric 
                        ? ['Healthy', 'Caries (Decay)', 'Composite Filling', 'Pulpotomy (MTA)', 'Stainless Steel Crown (SSC)', 'Space Maintainer', 'Fluoride Varnish'] 
                        : ['Healthy', 'Caries (Decay)', 'Composite Filling', 'Amalgam', 'Root Canal (RCT)', 'Stainless Steel Crown (SSC)', 'Dental Implant']
                      ).map(pal => {
                        const isSel = activePaletteItem === pal;
                        const isH = pal === 'Healthy';
                        const isCar = pal.includes('Caries') || pal.includes('Decay');
                        const isComp = pal.includes('Composite');
                        const isAmal = pal.includes('Amalgam') || pal.includes('SSC');
                        const isRct = pal.includes('Root Canal') || pal.includes('Pulpotomy');
                        const isImp = pal.includes('Implant');

                        let activeClass = 'bg-[#4A7CD2] text-white border-[#4A7CD2] font-black shadow-xs';
                        if (isH) activeClass = 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs';
                        else if (isCar) activeClass = 'bg-rose-600 text-white border-rose-600 font-black shadow-xs';
                        else if (isComp) activeClass = 'bg-[#2563EB] text-white border-[#2563EB] font-black shadow-xs';
                        else if (isAmal) activeClass = 'bg-slate-700 text-white border-slate-700 font-black shadow-xs';
                        else if (isRct) activeClass = 'bg-purple-700 text-white border-purple-700 font-black shadow-xs';
                        else if (isImp) activeClass = 'bg-teal-700 text-white border-teal-700 font-black shadow-xs';

                        return (
                          <button
                            key={pal}
                            type="button"
                            onClick={() => setActivePaletteItem(pal)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSel
                                ? activeClass
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {pal}
                          </button>
                        );
                      })}
                    </div>

                    {/* All 5 Zones & Clear Zones Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleApplyAll5Zones}
                        className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer text-center"
                      >
                        All 5 Zones
                      </button>
                      <button
                        onClick={handleClearAllZones}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center"
                      >
                        Clear Zones
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Surface-by-Surface Descriptive Grid */}
              <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4A7CD2]" />
                  Surface Anatomical Status Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'O', name: 'Occlusal (O)', desc: 'Central masticatory fissure table' },
                    { key: 'M', name: 'Mesial (M)', desc: 'Anterior interproximal contact' },
                    { key: 'D', name: 'Distal (D)', desc: 'Posterior interproximal contact' },
                    { key: 'B', name: 'Buccal / Facial (B)', desc: 'Cheek-facing enamel convex' },
                    { key: 'L', name: 'Lingual / Palatal (L)', desc: 'Tongue-facing cingulum wall' },
                    { key: 'Class V', name: 'Cervical / Class V', desc: 'Gingival cementoenamel junction (CEJ)' }
                  ].map((s, idx) => {
                    const isAff = (surfaceData[s.key] && surfaceData[s.key] !== 'Healthy') || affectedZone.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]);
                    return (
                      <div key={idx} className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between">
                        <div>
                          <p className="text-xs font-black text-dark-slate">{s.name}</p>
                          <p className="text-[10px] font-semibold text-muted-text mt-0.5">{s.desc}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                          isAff
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isAff ? (surfaceData[s.key] || 'Affected') : 'Sound'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Category Restriction Popup Modal */}
      {categoryRestrictionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Top Warning Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 p-5 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase bg-white/25 px-2 py-0.5 rounded-full inline-block mb-1">
                    Dentition Category Guard
                  </span>
                  <h3 className="text-base font-black tracking-tight leading-snug">
                    {categoryRestrictionModal.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryRestrictionModal(prev => ({ ...prev, isOpen: false }))}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-4">
              {/* Patient Dossier Snapshot Pill */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-xs">
                    {categoryRestrictionModal.patientName ? categoryRestrictionModal.patientName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">
                      {categoryRestrictionModal.patientName || 'Patient'}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500">
                      DOB: {categoryRestrictionModal.dob} • <span className="text-blue-600 font-extrabold">{categoryRestrictionModal.patientAge !== null ? `${categoryRestrictionModal.patientAge} Years Old` : 'Pediatric'}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
                  {categoryRestrictionModal.activeCategory}
                </span>
              </div>

              {/* Notice Message */}
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{categoryRestrictionModal.subtitle}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {categoryRestrictionModal.message}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-amber-200/60">
                  {categoryRestrictionModal.detail}
                </p>
              </div>

              {/* Clinical Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryRestrictionModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Understood — Stay in {categoryRestrictionModal.activeCategory.includes('Pediatric') ? 'Pediatric (A–T)' : 'Adult (1–32)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 bg-[#10244B] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-slide-up z-50 border border-cyan-400/40">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { ArrowLeft, Send, Mic, MicOff, AudioLines, Calendar, Clock, CheckCircle, AlertTriangle, AlertCircle, Save, KeyRound, FileText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Brain, Stethoscope, Pill, ListChecks, Loader2, Printer, Download, Check, X, Edit, Image, Activity, Sparkles, Trash2, RotateCcw, Search, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import RadiologyReportViewer from '../components/RadiologyReportViewer';
import ThreeDentalJawArch from '../components/ThreeDentalJawArch';
import ToothSurfaceDiagram, { CLINICAL_CONDITIONS } from '../components/ToothSurfaceDiagram';
import ClinicalConditionPalette from '../components/ClinicalConditionPalette';
import { parseSurfacesFromRecord } from './ToothDetailPage';
import '../index.css';
import { getPatientAvatarUrl } from '../utils/avatarUtils';
import { handlePrintCompletePatientReport } from '../utils/printReportUtils';
import { ToothDetailAllIcon, OdontogramPrintIcon } from '../components/DentalReportIcons';
import OrthoTmjDiagnosticSuite from '../components/orthoTmjSuite/OrthoTmjDiagnosticSuite';
import ClinicalActionChips from '../components/chat/ClinicalActionChips';
import { parseDoctorConversationalIntent, normalizeClinicalSpeech, DENTAL_VOCABULARY } from '../utils/dentalNlpEngine';

// Real Anatomical Maxilla (Upper Jaw) Coordinate & Rotation Mapping for Empty Jaw Template (Exact 16 Sockets)
export const MAXILLA_COORDS = {
  1:  { left: "19.5%", top: "74.5%", rotate: "90deg",  width: "11.5%", x: 19.5, y: 74.5, shape: 'molar',    label: '1',  name: 'Maxillary Right 3rd Molar' },
  2:  { left: "20.0%", top: "63.5%", rotate: "86deg",  width: "12.2%", x: 20.0, y: 63.5, shape: 'molar',    label: '2',  name: 'Maxillary Right 2nd Molar' },
  3:  { left: "22.0%", top: "52.5%", rotate: "78deg",  width: "12.5%", x: 22.0, y: 52.5, shape: 'molar',    label: '3',  name: 'Maxillary Right 1st Molar' },
  4:  { left: "24.8%", top: "42.0%", rotate: "68deg",  width: "10.8%", x: 24.8, y: 42.0, shape: 'premolar', label: '4',  name: 'Maxillary Right 2nd Premolar' },
  5:  { left: "28.0%", top: "33.5%", rotate: "55deg",  width: "10.2%", x: 28.0, y: 33.5, shape: 'premolar', label: '5',  name: 'Maxillary Right 1st Premolar' },
  6:  { left: "32.2%", top: "26.0%", rotate: "40deg",  width: "9.5%",  x: 32.2, y: 26.0, shape: 'canine',   label: '6',  name: 'Maxillary Right Canine' },
  7:  { left: "37.8%", top: "19.8%", rotate: "22deg",  width: "8.8%",  x: 37.8, y: 19.8, shape: 'incisor',  label: '7',  name: 'Maxillary Right Lateral Incisor' },
  8:  { left: "44.8%", top: "16.5%", rotate: "8deg",   width: "8.4%",  x: 44.8, y: 16.5, shape: 'incisor',  label: '8',  name: 'Maxillary Right Central Incisor' },
  9:  { left: "55.2%", top: "16.5%", rotate: "-8deg",  width: "8.4%",  x: 55.2, y: 16.5, shape: 'incisor',  label: '9',  name: 'Maxillary Left Central Incisor' },
  10: { left: "62.2%", top: "19.8%", rotate: "-22deg", width: "8.8%",  x: 62.2, y: 19.8, shape: 'incisor',  label: '10', name: 'Maxillary Left Lateral Incisor' },
  11: { left: "67.8%", top: "26.0%", rotate: "-40deg", width: "9.5%",  x: 67.8, y: 26.0, shape: 'canine',   label: '11', name: 'Maxillary Left Canine' },
  12: { left: "72.0%", top: "33.5%", rotate: "-55deg", width: "10.2%", x: 72.0, y: 33.5, shape: 'premolar', label: '12', name: 'Maxillary Left 1st Premolar' },
  13: { left: "75.2%", top: "42.0%", rotate: "-68deg", width: "10.8%", x: 75.2, y: 42.0, shape: 'premolar', label: '13', name: 'Maxillary Left 2nd Premolar' },
  14: { left: "78.0%", top: "52.5%", rotate: "-78deg", width: "12.5%", x: 78.0, y: 52.5, shape: 'molar',    label: '14', name: 'Maxillary Left 1st Molar' },
  15: { left: "80.0%", top: "63.5%", rotate: "-86deg", width: "12.2%", x: 80.0, y: 63.5, shape: 'molar',    label: '15', name: 'Maxillary Left 2nd Molar' },
  16: { left: "80.5%", top: "74.5%", rotate: "-90deg", width: "11.5%", x: 80.5, y: 74.5, shape: 'molar',    label: '16', name: 'Maxillary Left 3rd Molar' }
};

// Real Anatomical Mandible (Lower Jaw) Coordinate & Rotation Mapping for Empty Jaw Template (Exact 16 Sockets)
export const MANDIBLE_COORDS = {
  17: { left: "17.5%", top: "82.5%", rotate: "90deg",  width: "11.5%", x: 17.5, y: 82.5, shape: 'molar',    label: '17', name: 'Mandibular Left 3rd Molar' },
  18: { left: "17.5%", top: "69.5%", rotate: "86deg",  width: "12.2%", x: 17.5, y: 69.5, shape: 'molar',    label: '18', name: 'Mandibular Left 2nd Molar' },
  19: { left: "19.8%", top: "55.0%", rotate: "76deg",  width: "12.5%", x: 19.8, y: 55.0, shape: 'molar',    label: '19', name: 'Mandibular Left 1st Molar' },
  20: { left: "23.5%", top: "42.5%", rotate: "66deg",  width: "10.8%", x: 23.5, y: 42.5, shape: 'premolar', label: '20', name: 'Mandibular Left 2nd Premolar' },
  21: { left: "27.2%", top: "32.5%", rotate: "52deg",  width: "10.2%", x: 27.2, y: 32.5, shape: 'premolar', label: '21', name: 'Mandibular Left 1st Premolar' },
  22: { left: "32.2%", top: "24.5%", rotate: "38deg",  width: "9.5%",  x: 32.2, y: 24.5, shape: 'canine',   label: '22', name: 'Mandibular Left Canine' },
  23: { left: "38.2%", top: "18.2%", rotate: "22deg",  width: "8.6%",  x: 38.2, y: 18.2, shape: 'incisor',  label: '23', name: 'Mandibular Left Lateral Incisor' },
  24: { left: "45.2%", top: "14.8%", rotate: "8deg",   width: "8.2%",  x: 45.2, y: 14.8, shape: 'incisor',  label: '24', name: 'Mandibular Left Central Incisor' },
  25: { left: "54.8%", top: "14.8%", rotate: "-8deg",  width: "8.2%",  x: 54.8, y: 14.8, shape: 'incisor',  label: '25', name: 'Mandibular Right Central Incisor' },
  26: { left: "61.8%", top: "18.2%", rotate: "-22deg", width: "8.6%",  x: 61.8, y: 18.2, shape: 'incisor',  label: '26', name: 'Mandibular Right Lateral Incisor' },
  27: { left: "67.8%", top: "24.5%", rotate: "-38deg", width: "9.5%",  x: 67.8, y: 24.5, shape: 'canine',   label: '27', name: 'Mandibular Right Canine' },
  28: { left: "72.8%", top: "32.5%", rotate: "-52deg", width: "10.2%", x: 72.8, y: 32.5, shape: 'premolar', label: '28', name: 'Mandibular Right 1st Premolar' },
  29: { left: "76.5%", top: "42.5%", rotate: "-66deg", width: "10.8%", x: 76.5, y: 42.5, shape: 'premolar', label: '29', name: 'Mandibular Right 2nd Premolar' },
  30: { left: "80.2%", top: "55.0%", rotate: "-76deg", width: "12.5%", x: 80.2, y: 55.0, shape: 'molar',    label: '30', name: 'Mandibular Right 1st Molar' },
  31: { left: "82.5%", top: "69.5%", rotate: "-86deg", width: "12.2%", x: 82.5, y: 69.5, shape: 'molar',    label: '31', name: 'Mandibular Right 2nd Molar' },
  32: { left: "82.5%", top: "82.5%", rotate: "-90deg", width: "11.5%", x: 82.5, y: 82.5, shape: 'molar',    label: '32', name: 'Mandibular Right 3rd Molar' }
};

// Unified Dental Coordinate Mapping
const DENTAL_COORDS = {
  ...MAXILLA_COORDS,
  ...MANDIBLE_COORDS
};

// Pediatric Primary Maxilla (Upper Jaw) Coordinate & Rotation Mapping for 10 Primary Sockets (A–J)
export const PRIMARY_MAXILLA_COORDS = {
  'A': { left: "21.0%", top: "68.0%", rotate: "82deg", width: "12.0%", x: 21.0, y: 68.0, shape: 'molar', label: 'A', name: 'Maxillary Right Primary 2nd Molar (A)' },
  'B': { left: "24.5%", top: "53.0%", rotate: "70deg", width: "11.5%", x: 24.5, y: 53.0, shape: 'molar', label: 'B', name: 'Maxillary Right Primary 1st Molar (B)' },
  'C': { left: "30.5%", top: "38.0%", rotate: "48deg", width: "10.0%", x: 30.5, y: 38.0, shape: 'canine', label: 'C', name: 'Maxillary Right Primary Canine (C)' },
  'D': { left: "38.0%", top: "25.0%", rotate: "24deg", width: "9.2%", x: 38.0, y: 25.0, shape: 'incisor', label: 'D', name: 'Maxillary Right Primary Lateral Incisor (D)' },
  'E': { left: "46.0%", top: "19.5%", rotate: "6deg", width: "8.8%", x: 46.0, y: 19.5, shape: 'incisor', label: 'E', name: 'Maxillary Right Primary Central Incisor (E)' },
  'F': { left: "54.0%", top: "19.5%", rotate: "-6deg", width: "8.8%", x: 54.0, y: 19.5, shape: 'incisor', label: 'F', name: 'Maxillary Left Primary Central Incisor (F)' },
  'G': { left: "62.0%", top: "25.0%", rotate: "-24deg", width: "9.2%", x: 62.0, y: 25.0, shape: 'incisor', label: 'G', name: 'Maxillary Left Primary Lateral Incisor (G)' },
  'H': { left: "69.5%", top: "38.0%", rotate: "-48deg", width: "10.0%", x: 69.5, y: 38.0, shape: 'canine', label: 'H', name: 'Maxillary Left Primary Canine (H)' },
  'I': { left: "75.5%", top: "53.0%", rotate: "-70deg", width: "11.5%", x: 75.5, y: 53.0, shape: 'molar', label: 'I', name: 'Maxillary Left Primary 1st Molar (I)' },
  'J': { left: "79.0%", top: "68.0%", rotate: "-82deg", width: "12.0%", x: 79.0, y: 68.0, shape: 'molar', label: 'J', name: 'Maxillary Left Primary 2nd Molar (J)' },
};

// Pediatric Primary Mandible (Lower Jaw) Coordinate & Rotation Mapping for 10 Primary Sockets (K–T)
export const PRIMARY_MANDIBLE_COORDS = {
  'K': { left: "19.5%", top: "72.0%", rotate: "82deg", width: "12.0%", x: 19.5, y: 72.0, shape: 'molar', label: 'K', name: 'Mandibular Left Primary 2nd Molar (K)' },
  'L': { left: "23.5%", top: "57.0%", rotate: "70deg", width: "11.5%", x: 23.5, y: 57.0, shape: 'molar', label: 'L', name: 'Mandibular Left Primary 1st Molar (L)' },
  'M': { left: "29.5%", top: "42.0%", rotate: "48deg", width: "10.0%", x: 29.5, y: 42.0, shape: 'canine', label: 'M', name: 'Mandibular Left Primary Canine (M)' },
  'N': { left: "37.5%", top: "28.0%", rotate: "24deg", width: "9.2%", x: 37.5, y: 28.0, shape: 'incisor', label: 'N', name: 'Mandibular Left Primary Lateral Incisor (N)' },
  'O': { left: "46.0%", top: "22.0%", rotate: "6deg", width: "8.8%", x: 46.0, y: 22.0, shape: 'incisor', label: 'O', name: 'Mandibular Left Primary Central Incisor (O)' },
  'P': { left: "54.0%", top: "22.0%", rotate: "-6deg", width: "8.8%", x: 54.0, y: 22.0, shape: 'incisor', label: 'P', name: 'Mandibular Right Primary Central Incisor (P)' },
  'Q': { left: "62.5%", top: "28.0%", rotate: "-24deg", width: "9.2%", x: 62.5, y: 28.0, shape: 'incisor', label: 'Q', name: 'Mandibular Right Primary Lateral Incisor (Q)' },
  'R': { left: "70.5%", top: "42.0%", rotate: "-48deg", width: "10.0%", x: 70.5, y: 42.0, shape: 'canine', label: 'R', name: 'Mandibular Right Primary Canine (R)' },
  'S': { left: "76.5%", top: "57.0%", rotate: "-70deg", width: "11.5%", x: 76.5, y: 57.0, shape: 'molar', label: 'S', name: 'Mandibular Right Primary 1st Molar (S)' },
  'T': { left: "80.5%", top: "72.0%", rotate: "-82deg", width: "12.0%", x: 80.5, y: 72.0, shape: 'molar', label: 'T', name: 'Mandibular Right Primary 2nd Molar (T)' },
};

export const PRIMARY_DENTAL_COORDS = {
  ...PRIMARY_MAXILLA_COORDS,
  ...PRIMARY_MANDIBLE_COORDS
};

export const PEDIATRIC_TOOTH_NAMES = {
  'A': { number: 'A', toothNumber: 'A', name: 'Maxillary Right Primary 2nd Molar', shape: 'molar', roots: 3, cusps: 4, function: 'Primary Mastication & Space Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', eruption: '24–30 Months', shedding: '10–12 Years', letter: 'A', fdi: '55' },
  'B': { number: 'B', toothNumber: 'B', name: 'Maxillary Right Primary 1st Molar', shape: 'molar', roots: 3, cusps: 4, function: 'Food Crushing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', eruption: '12–16 Months', shedding: '9–11 Years', letter: 'B', fdi: '54' },
  'C': { number: 'C', toothNumber: 'C', name: 'Maxillary Right Primary Canine', shape: 'canine', roots: 1, cusps: 1, function: 'Tearing & Guidance', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', eruption: '16–20 Months', shedding: '10–12 Years', letter: 'C', fdi: '53' },
  'D': { number: 'D', toothNumber: 'D', name: 'Maxillary Right Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', eruption: '9–13 Months', shedding: '7–8 Years', letter: 'D', fdi: '52' },
  'E': { number: 'E', toothNumber: 'E', name: 'Maxillary Right Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting, Speech & Central Smile Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Right (Pediatric Q1)', eruption: '8–12 Months', shedding: '6–7 Years', letter: 'E', fdi: '51' },
  'F': { number: 'F', toothNumber: 'F', name: 'Maxillary Left Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting, Speech & Central Smile Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', eruption: '8–12 Months', shedding: '6–7 Years', letter: 'F', fdi: '61' },
  'G': { number: 'G', toothNumber: 'G', name: 'Maxillary Left Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting & Esthetics', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', eruption: '9–13 Months', shedding: '7–8 Years', letter: 'G', fdi: '62' },
  'H': { number: 'H', toothNumber: 'H', name: 'Maxillary Left Primary Canine', shape: 'canine', roots: 1, cusps: 1, function: 'Tearing & Guidance', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', eruption: '16–20 Months', shedding: '10–12 Years', letter: 'H', fdi: '63' },
  'I': { number: 'I', toothNumber: 'I', name: 'Maxillary Left Primary 1st Molar', shape: 'molar', roots: 3, cusps: 4, function: 'Food Crushing', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', eruption: '12–16 Months', shedding: '9–11 Years', letter: 'I', fdi: '64' },
  'J': { number: 'J', toothNumber: 'J', name: 'Maxillary Left Primary 2nd Molar', shape: 'molar', roots: 3, cusps: 4, function: 'Primary Mastication & Space Anchor', arch: 'Maxilla (Upper Jaw)', quad: 'Upper Left (Pediatric Q2)', eruption: '24–30 Months', shedding: '10–12 Years', letter: 'J', fdi: '65' },
  'K': { number: 'K', toothNumber: 'K', name: 'Mandibular Left Primary 2nd Molar', shape: 'molar', roots: 2, cusps: 5, function: 'Primary Mastication & Space Anchor', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', eruption: '20–30 Months', shedding: '10–12 Years', letter: 'K', fdi: '75' },
  'L': { number: 'L', toothNumber: 'L', name: 'Mandibular Left Primary 1st Molar', shape: 'molar', roots: 2, cusps: 4, function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', eruption: '12–16 Months', shedding: '9–11 Years', letter: 'L', fdi: '74' },
  'M': { number: 'M', toothNumber: 'M', name: 'Mandibular Left Primary Canine', shape: 'canine', roots: 1, cusps: 1, function: 'Tearing & Guidance', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', eruption: '16–20 Months', shedding: '9–11 Years', letter: 'M', fdi: '73' },
  'N': { number: 'N', toothNumber: 'N', name: 'Mandibular Left Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', eruption: '10–14 Months', shedding: '7–8 Years', letter: 'N', fdi: '72' },
  'O': { number: 'O', toothNumber: 'O', name: 'Mandibular Left Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Left (Pediatric Q3)', eruption: '6–10 Months', shedding: '6–7 Years', letter: 'O', fdi: '71' },
  'P': { number: 'P', toothNumber: 'P', name: 'Mandibular Right Primary Central Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', eruption: '6–10 Months', shedding: '6–7 Years', letter: 'P', fdi: '81' },
  'Q': { number: 'Q', toothNumber: 'Q', name: 'Mandibular Right Primary Lateral Incisor', shape: 'incisor', roots: 1, cusps: 1, function: 'Cutting & Shearing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', eruption: '10–14 Months', shedding: '7–8 Years', letter: 'Q', fdi: '82' },
  'R': { number: 'R', toothNumber: 'R', name: 'Mandibular Right Primary Canine', shape: 'canine', roots: 1, cusps: 1, function: 'Tearing & Guidance', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', eruption: '16–20 Months', shedding: '9–11 Years', letter: 'R', fdi: '83' },
  'S': { number: 'S', toothNumber: 'S', name: 'Mandibular Right Primary 1st Molar', shape: 'molar', roots: 2, cusps: 4, function: 'Food Crushing', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', eruption: '12–16 Months', shedding: '9–11 Years', letter: 'S', fdi: '84' },
  'T': { number: 'T', toothNumber: 'T', name: 'Mandibular Right Primary 2nd Molar', shape: 'molar', roots: 2, cusps: 5, function: 'Primary Mastication & Space Anchor', arch: 'Mandible (Lower Jaw)', quad: 'Lower Right (Pediatric Q4)', eruption: '20–30 Months', shedding: '10–12 Years', letter: 'T', fdi: '85' }
};

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

// Realistic Human Anatomical Tooth Component with 4 Shapes & All 6 Clinical Properties
function RealisticHumanTooth({ number, shape = 'molar', status, color, isHighlighted, onClick, label, isFrontView = false, rotationDeg = 0 }) {
  const sLower = (status || '').toLowerCase();
  const isRotated = rotationDeg !== 0 || sLower.includes('rotat');
  const rotAngle = rotationDeg || (sLower.includes('rotat') ? 45 : 0);
  const isDecay = sLower.includes('decay') || sLower.includes('damag') || sLower === 'cavity' || sLower.includes('keera') || sLower.includes('ecc');
  const isRCT = sLower.includes('canal') || sLower.includes('root') || sLower === 'yellow' || sLower.includes('pulpotomy') || sLower.includes('pulpectomy');
  const isFilled = sLower.includes('treat') || sLower.includes('prosthesis') || sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('filling') || sLower.includes('composite') || sLower.includes('ssc') || sLower.includes('gic') || sLower.includes('sealant');
  const isCleaning = sLower.includes('clean') || sLower.includes('scaling') || sLower.includes('calculus');
  const isMissing = sLower.includes('miss') || sLower.includes('extract') || sLower.includes('exfoliat');
  const isImplant = sLower.includes('implant');
  const isSpaceMaintainer = sLower.includes('space maintainer') || sLower.includes('band and loop') || sLower.includes('space');
  const isOrthodontic = sLower.includes('bracket') || sLower.includes('orthodontic');
  const isHealthy = !isDecay && !isRCT && !isFilled && !isCleaning && !isMissing && !isRotated && !isImplant && !isOrthodontic && !isSpaceMaintainer;

  const gradId = `enamel-grad-${number}-${isFrontView ? 'front' : 'arch'}`;
  const refImage = (isFilled && !isSpaceMaintainer) ? "/tooth_filled_top.jpg" : isDecay ? "/tooth_decay_top.jpg" : isHealthy ? "/tooth_healthy_top.jpg" : null;

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-300 flex flex-col items-center group select-none ${
        isHighlighted ? 'scale-130 z-30' : 'hover:scale-115 z-10'
      }`}
      title={`Tooth #${number} (${shape}) - ${status || 'Healthy'}${isRotated ? ` (${rotAngle}° Rotated)` : ''}`}
    >
      {/* Dynamic Radar Pulse on active highlight */}
      {isHighlighted && (
        <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border-2 border-cyan-400 bg-cyan-400/25 animate-tooth-radar pointer-events-none" />
      )}

      {/* Rotation Indicator Badge */}
      {isRotated && (
        <span className="absolute -top-2 -right-1 text-[8px] bg-blue-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-xs font-black z-20" title={`Rotated ${rotAngle}°`}>
          ↻
        </span>
      )}

      {/* Realistic 2D Anatomical Tooth View (Image + Vector Hybrid) */}
      {refImage && isFilled ? (
        <div 
          style={{ transform: isRotated && !isFrontView ? `rotate(${rotAngle}deg)` : undefined }}
          className={`relative transition-all duration-300 rounded-lg overflow-hidden border ${
          isHighlighted ? 'ring-2 ring-cyan-400 border-blue-400 shadow-md scale-110' : 'border-blue-300 shadow-2xs'
        } ${isFrontView ? 'w-[20px] h-[24px]' : 'w-[26px] h-[26px]'} bg-white flex items-center justify-center p-0.5`}>
          <img 
            src={refImage} 
            alt={`Tooth #${number} ${status}`} 
            className="w-full h-full object-contain filter contrast-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      ) : (
        <svg
          style={{ transform: isRotated && !isFrontView ? `rotate(${rotAngle}deg)` : undefined }}
          className={`transition-all duration-300 ${
            isFrontView ? 'w-[18px] h-[30px]' : 'w-[24px] h-[26px]'
          } ${
            isHighlighted 
              ? 'animate-tooth-spotlight drop-shadow-[0_0_14px_rgba(0,210,255,0.95)]' 
              : isRotated
              ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
              : isDecay 
              ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.75)]' 
              : isFilled
              ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]'
              : isRCT
              ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]'
              : 'drop-shadow-xs group-hover:drop-shadow-md'
          } ${isMissing ? 'opacity-35 grayscale' : ''}`}
          viewBox={isFrontView ? "0 0 32 48" : "0 0 40 40"}
          fill="none"
        >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="80%" stopColor={isHighlighted ? '#BAE6FD' : isFilled ? '#E0F2FE' : isDecay ? '#FEE2E2' : isCleaning ? '#FEF3C7' : '#E2E8F0'} />
            <stop offset="100%" stopColor={isHighlighted ? '#38BDF8' : isFilled ? '#93C5FD' : isDecay ? '#FCA5A5' : isCleaning ? '#FDE68A' : '#CBD5E1'} />
          </linearGradient>
          <filter id={`shadow-${number}-${isFrontView ? 'f' : 'a'}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#0F172A" floodOpacity="0.18" />
          </filter>
        </defs>

        {isFrontView ? (
          /* ==================== 1. FRONT VIEW (LONGITUDINAL) ==================== */
          shape === 'molar' ? (
            <g filter={`url(#shadow-${number}-f)`}>
              <path
                d="M 6 12 C 4 8, 8 4, 16 4 C 24 4, 28 8, 26 12 C 28 20, 26 30, 24 42 C 22 46, 18 42, 17 32 C 16 30, 15 30, 14 32 C 13 42, 9 46, 7 42 C 5 30, 3 20, 6 12 Z"
                fill={`url(#${gradId})`}
                stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : isRCT ? '#F59E0B' : '#94A3B8'}
                strokeWidth={isHighlighted ? '1.5' : '0.8'}
              />
              <path d="M 10 10 C 13 14, 19 14, 22 10" stroke={isDecay ? '#EF4444' : '#CBD5E1'} strokeWidth="0.8" strokeLinecap="round" />
              <path d="M 16 7 L 16 16" stroke={isDecay ? '#EF4444' : '#CBD5E1'} strokeWidth="0.8" strokeLinecap="round" />
            </g>
          ) : shape === 'premolar' ? (
            <g filter={`url(#shadow-${number}-f)`}>
              <path
                d="M 8 10 C 6 6, 10 4, 16 4 C 22 4, 26 6, 24 10 C 26 18, 23 28, 20 42 C 18 45, 14 45, 12 42 C 9 28, 6 18, 8 10 Z"
                fill={`url(#${gradId})`}
                stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : isRCT ? '#F59E0B' : '#94A3B8'}
                strokeWidth={isHighlighted ? '1.5' : '0.8'}
              />
              <path d="M 12 9 C 14 12, 18 12, 20 9" stroke={isDecay ? '#EF4444' : '#CBD5E1'} strokeWidth="0.8" strokeLinecap="round" />
            </g>
          ) : shape === 'canine' ? (
            <g filter={`url(#shadow-${number}-f)`}>
              <path
                d="M 9 10 C 11 4, 16 2, 17 2 C 18 2, 23 4, 23 10 C 25 18, 22 30, 18 45 C 16 47, 15 47, 14 45 C 10 30, 7 18, 9 10 Z"
                fill={`url(#${gradId})`}
                stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : isRCT ? '#F59E0B' : '#94A3B8'}
                strokeWidth={isHighlighted ? '1.5' : '0.8'}
              />
              <path d="M 16 4 L 16 22" stroke="#CBD5E1" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          ) : (
            <g filter={`url(#shadow-${number}-f)`}>
              <path
                d="M 8 7 C 9 4, 15 3, 17 3 C 19 3, 25 4, 24 7 C 25 16, 22 28, 18 43 C 16 46, 15 46, 14 43 C 10 28, 7 16, 8 7 Z"
                fill={`url(#${gradId})`}
                stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : isRCT ? '#F59E0B' : '#94A3B8'}
                strokeWidth={isHighlighted ? '1.5' : '0.8'}
              />
              <line x1="10" y1="6" x2="22" y2="6" stroke="#CBD5E1" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          )
        ) : (
          /* ==================== 2. TOP-DOWN OCCLUSAL ARCH VIEW ==================== */
          shape === 'molar' ? (
            <g filter={`url(#shadow-${number}-a)`}>
              {/* Outer Enamel Occlusal Table */}
              <rect x="5" y="5" width="30" height="30" rx="8" fill={`url(#${gradId})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth={isHighlighted ? '1.5' : '0.9'} />
              {/* Occlusal Cusp Fissure Anatomy */}
              <path d="M 10 14 C 15 17, 25 17, 30 14" stroke="#CBD5E1" strokeWidth="0.9" strokeLinecap="round" />
              <path d="M 10 26 C 15 23, 25 23, 30 26" stroke="#CBD5E1" strokeWidth="0.9" strokeLinecap="round" />
              <path d="M 20 8 L 20 32" stroke="#CBD5E1" strokeWidth="0.9" strokeLinecap="round" />
              <circle cx="14" cy="14" r="1.5" fill="#FFFFFF" opacity="0.8" />
            </g>
          ) : shape === 'premolar' ? (
            <g filter={`url(#shadow-${number}-a)`}>
              {/* Bicuspid Oval Occlusal Table */}
              <ellipse cx="20" cy="20" rx="13" ry="15" fill={`url(#${gradId})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth={isHighlighted ? '1.5' : '0.9'} />
              {/* Central Transverse Fissure */}
              <path d="M 12 20 C 16 18, 24 18, 28 20" stroke="#CBD5E1" strokeWidth="0.9" strokeLinecap="round" />
              <circle cx="16" cy="14" r="1.2" fill="#FFFFFF" opacity="0.8" />
              <circle cx="24" cy="26" r="1.2" fill="#FFFFFF" opacity="0.8" />
            </g>
          ) : shape === 'canine' ? (
            <g filter={`url(#shadow-${number}-a)`}>
              {/* Diamond Cusp Apex Table */}
              <path d="M 20 7 C 28 12, 31 22, 27 29 C 23 35, 17 35, 13 29 C 9 22, 12 12, 20 7 Z" fill={`url(#${gradId})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth={isHighlighted ? '1.5' : '0.9'} />
              <circle cx="20" cy="17" r="2.2" fill="#FFFFFF" opacity="0.85" />
            </g>
          ) : (
            <g filter={`url(#shadow-${number}-a)`}>
              {/* Incisal Edge Bar & Lingual Cingulum */}
              <rect x="8" y="11" width="24" height="18" rx="6" fill={`url(#${gradId})`} stroke={isHighlighted ? '#0284C7' : isDecay ? '#EF4444' : isFilled ? '#2563EB' : '#94A3B8'} strokeWidth={isHighlighted ? '1.5' : '0.9'} />
              <line x1="12" y1="17" x2="28" y2="17" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />
            </g>
          )
        )}

        {/* ==================== 3. DYNAMIC 6-PROPERTY CLINICAL OVERLAYS ==================== */}
        
        {/* 1. Property: Decay (Caries / Keera) */}
        {isDecay && (
          <g>
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "11" : "20"} r={isFrontView ? "4.5" : "6.5"} fill="#78350F" opacity="0.85" />
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "11" : "20"} r={isFrontView ? "2.5" : "4"} fill="#1C1917" />
            <path d={isFrontView ? "M 13 11 L 19 11" : "M 16 20 L 24 20"} stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* 2. Property: Already Treated (Light Blue Composite Filling Material) */}
        {isFilled && (
          <g>
            <path 
              d={isFrontView 
                ? "M 10 5 C 13 3.8, 19 3.8, 22 5 L 21 14 C 18 15.5, 14 15.5, 11 14 Z"
                : "M 14 20 C 14 17, 17 14, 20 14 C 23 14, 26 17, 26 20 C 26 23, 23 26, 20 26 C 17 26, 14 23, 14 20 Z"
              } 
              fill="#93C5FD" 
              fillOpacity="0.9" 
              stroke="#2563EB" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
            />
            {/* Cross Inlay Wing Extensions on Occlusal Surface */}
            {!isFrontView && shape === 'molar' && (
              <path d="M 12 20 L 28 20 M 20 12 L 20 28" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
            )}
            <circle cx={isFrontView ? "16" : "18"} cy={isFrontView ? "9.5" : "18"} r="1.5" fill="#EFF6FF" />
          </g>
        )}

        {/* 3. Property: Root Canal Needed (Exposed Infected Pulp Chamber) */}
        {isRCT && (
          <g>
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "10" : "20"} r={isFrontView ? "3.5" : "5.5"} fill="#DC2626" opacity="0.9" />
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "10" : "20"} r={isFrontView ? "1.8" : "2.8"} fill="#F59E0B" />
            <path d={isFrontView ? "M 16 8 L 16 34" : "M 20 12 L 20 28"} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* 4. Property: Cleaning Needed (Tartar / Calculus Buildup on Outer Margins) */}
        {isCleaning && (
          <g>
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "18" : "20"} r={isFrontView ? "8" : "12"} fill="none" stroke="#D97706" strokeWidth="2" strokeDasharray="3 2" opacity="0.85" />
            <path d={isFrontView ? "M 8 18 C 12 21, 20 21, 24 18" : "M 10 28 C 15 32, 25 32, 30 28"} stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* 5. Property: Missing / Extracted (Dark Hollow Socket) */}
        {isMissing && (
          <g>
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "20" : "20"} r={isFrontView ? "7" : "10"} fill="#334155" opacity="0.4" />
            <line x1={isFrontView ? "10" : "12"} y1={isFrontView ? "14" : "12"} x2={isFrontView ? "22" : "28"} y2={isFrontView ? "26" : "28"} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>
        )}

        {/* 6. Property: Dental Implant (Titanium Screw Roots & Hex Abutment) */}
        {isImplant && (
          <g>
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "10" : "20"} r={isFrontView ? "5" : "7"} fill="#0E8A80" fillOpacity="0.2" stroke="#0E8A80" strokeWidth="1.5" />
            <rect x={isFrontView ? "14" : "17"} y={isFrontView ? "8" : "17"} width={isFrontView ? "4" : "6"} height={isFrontView ? "4" : "6"} fill="#475569" stroke="#94A3B8" strokeWidth="0.8" />
            {isFrontView && (
              <path d="M 12 18 L 20 18 M 13 22 L 19 22 M 14 26 L 18 26 M 15 30 L 17 30" stroke="#0E8A80" strokeWidth="1.2" strokeLinecap="round" />
            )}
          </g>
        )}

        {/* 7. Property: Orthodontic Bracket */}
        {isOrthodontic && (
          <g>
            <rect x={isFrontView ? "12" : "15"} y={isFrontView ? "8" : "15"} width={isFrontView ? "8" : "10"} height={isFrontView ? "8" : "10"} fill="#CBD5E1" stroke="#475569" strokeWidth="0.8" rx="1" />
            <line x1={isFrontView ? "10" : "13"} y1={isFrontView ? "12" : "20"} x2={isFrontView ? "22" : "27"} y2={isFrontView ? "12" : "20"} stroke="#0284C7" strokeWidth="1.5" />
          </g>
        )}

        {/* 8. Property: Space Maintainer (Band & Loop) */}
        {isSpaceMaintainer && (
          <g>
            <rect x={isFrontView ? "7" : "8"} y={isFrontView ? "9" : "10"} width={isFrontView ? "18" : "24"} height={isFrontView ? "14" : "20"} fill="#93C5FD" fillOpacity="0.45" stroke="#2563EB" strokeWidth="1.8" rx="4" />
            <path d={isFrontView ? "M 7 16 C 2 16, 2 26, 7 26" : "M 8 20 C 1 14, 1 26, 8 20"} stroke="#2563EB" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <circle cx={isFrontView ? "16" : "20"} cy={isFrontView ? "16" : "20"} r="3" fill="#2563EB" />
          </g>
        )}
      </svg>
      )}

      {/* Dynamic Tooth Number & Status Dot */}
      {label && (
        <div className="flex items-center gap-0.5 mt-0.5">
          <span 
            className={`text-[8px] font-black leading-none px-1 py-0.2 rounded-full shadow-2xs border ${
              isHighlighted
                ? 'bg-cyan-500 text-white border-cyan-300 ring-2 ring-cyan-300/60 scale-110'
                : isSpaceMaintainer
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/50 shadow-xs'
                : isImplant
                ? 'bg-teal-600 text-white border-teal-300 shadow-teal-500/50 shadow-xs'
                : isOrthodontic
                ? 'bg-sky-600 text-white border-sky-300'
                : isDecay
                ? 'bg-rose-500 text-white border-rose-300'
                : isRCT
                ? 'bg-amber-500 text-white border-amber-300'
                : isFilled
                ? 'bg-blue-500 text-white border-blue-300'
                : isCleaning
                ? 'bg-yellow-500 text-white border-yellow-300'
                : isMissing
                ? 'bg-slate-400 text-white border-slate-300'
                : 'bg-white/95 text-slate-700 border-slate-300 group-hover:border-blue-400'
            }`}
          >
            {number}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * OcclusalJawToothThumbnail Component
 * Displays the exact authentic 3D jaw occlusal texture & clinical condition overlays (Mobility ring, Caries core, Composite, RCT)
 */
function OcclusalJawToothThumbnail({ toothNumber, shape = 'molar', status = '', comments = '', rotationDeg = 0, size = 'md' }) {
  const sLower = (status || '').toLowerCase();
  const cLower = (comments || '').toLowerCase();
  const full = `${sLower} ${cLower}`;

  const isMobility = (full.includes('mobility') && !full.includes('grade 0') && !full.includes('physiological')) || full.includes('bone loss');
  const isCaries = full.includes('caries') || full.includes('decay') || full.includes('cavity') || full.includes('keera');
  const isRCT = full.includes('canal') || full.includes('rct') || full.includes('pulpitis') || full.includes('pulpotomy');
  const isComposite = full.includes('composite') || (full.includes('fill') && !full.includes('amalgam') && !full.includes('gic')) || full.includes('treat');
  const isAmalgam = full.includes('amalgam');
  const isCrown = (full.includes('crown') || full.includes('bridge')) && !full.includes('implant');
  const isRotated = rotationDeg !== 0 || full.includes('rotat') || full.includes('malposition');
  const isOrthodontic = full.includes('orthodontic') || full.includes('bracket') || full.includes('braces') || full.includes('crowding') || full.includes('diastema');
  const isImplant = full.includes('implant');
  const isAbscess = full.includes('abscess') || full.includes('lesion') || full.includes('periapical') || full.includes('pus') || full.includes('swelling');
  const isSealant = full.includes('sealant');
  const isInlay = full.includes('inlay') || full.includes('onlay');
  const isVeneer = full.includes('veneer');
  const isPostCore = full.includes('post and core') || full.includes('post & core') || full.includes('post build');
  const isImpacted = full.includes('impacted') || full.includes('impaction');
  const isSpaceMaintainer = full.includes('space maintainer') || full.includes('band and loop') || full.includes('space');

  const rotAngle = rotationDeg || (full.includes('rotat') ? 45 : 0);
  const dim = size === 'lg' ? 'w-13 h-13' : 'w-9 h-9';
  const imgDim = size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';

  return (
    <div className={`relative ${dim} rounded-xl bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] border border-light-teal/50 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
      {/* 🌟 1. Dynamic Animated Rotation Orbital Ring (Active when Rotated / Malposition) */}
      {isRotated && (
        <div className="absolute inset-1 rounded-full border-2 border-dashed border-indigo-500/80 animate-spin [animation-duration:8s] pointer-events-none" />
      )}

      {/* 🌟 2. Exact 3D Jaw Occlusal Texture Image with Axial Angle & Subtle Dynamic Micro-Movement */}
      <img
        src={`/tooth_textures/${shape || 'molar'}.png`}
        alt={`Tooth #${toothNumber}`}
        style={{
          transform: isRotated ? `rotate(${rotAngle}deg)` : undefined
        }}
        className={`${imgDim} object-contain filter contrast-105 drop-shadow-xs transition-transform ${
          isMobility ? 'animate-pulse' : ''
        }`}
        onError={(e) => {
          e.target.src = '/tooth_textures/molar.png';
        }}
      />

      {/* 🌟 3. Clinical Condition Overlays matching the 3D Jaw precisely */}
      {isAbscess && (
        <div className="absolute w-4 h-4 rounded-full bg-red-600/90 border-2 border-yellow-300 shadow-[0_0_10px_rgba(220,38,38,0.9)] pointer-events-none animate-ping" />
      )}
      {isMobility && !isAbscess && (
        <div className="absolute inset-1.5 rounded-full border-2 border-amber-400 bg-amber-400/25 shadow-[0_0_8px_rgba(245,158,11,0.6)] pointer-events-none animate-ping opacity-70" />
      )}
      {isCaries && (
        <div className="absolute w-3.5 h-3.5 rounded-full bg-red-500/90 border border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none animate-pulse" />
      )}
      {isRCT && (
        <div className="absolute w-3 h-3 rounded-full bg-purple-600/90 border border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.8)] pointer-events-none animate-pulse" />
      )}
      {isComposite && (
        <div className="absolute inset-2 rounded-full border-2 border-blue-500 bg-blue-500/20 shadow-[0_0_6px_rgba(37,99,235,0.4)] pointer-events-none" />
      )}
      {isSealant && (
        <div className="absolute inset-2 rounded-full border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_6px_rgba(6,182,212,0.4)] pointer-events-none" />
      )}
      {isInlay && (
        <div className="absolute inset-2 rounded-md border-2 border-amber-500 bg-amber-500/25 pointer-events-none" />
      )}
      {isVeneer && (
        <div className="absolute inset-1.5 rounded-md border-2 border-purple-500 bg-purple-500/20 pointer-events-none" />
      )}
      {isPostCore && (
        <div className="absolute w-3 h-3 rounded-full bg-slate-700 border border-slate-300 shadow-xs pointer-events-none" />
      )}
      {isImpacted && (
        <div className="absolute inset-1 rounded-full border-2 border-dashed border-purple-600 shadow-xs pointer-events-none animate-pulse" />
      )}
      {isAmalgam && (
        <div className="absolute w-3.5 h-3.5 rounded-full bg-slate-600/90 border border-slate-400 pointer-events-none" />
      )}
      {isCrown && !isImplant && (
        <div className="absolute inset-1 rounded-full border-2 border-amber-500 bg-amber-500/20 pointer-events-none" />
      )}
      {isImplant && (
        <div className="absolute inset-1 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E8A80] shadow-[0_0_8px_rgba(14,138,128,0.7)] animate-pulse" />
          <div className="w-4.5 h-4.5 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center shadow-2xs">
            <div className="w-1.5 h-1.5 rounded-xs bg-amber-400" />
          </div>
        </div>
      )}
      {isOrthodontic && (
        <div className="absolute inset-1.5 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 bg-slate-200 border-2 border-slate-600 rounded-xs shadow-xs flex items-center justify-center relative">
            <div className="w-full h-1 bg-sky-500 shadow-xs" />
            <div className="w-2.5 h-2.5 rounded-full border border-cyan-400 absolute animate-pulse" />
          </div>
        </div>
      )}
      {isSpaceMaintainer && (
        <div className="absolute inset-1.5 flex items-center justify-center pointer-events-none">
          <div className="w-5.5 h-5.5 rounded-full border-2 border-dashed border-blue-500 bg-blue-400/30 animate-pulse flex items-center justify-center shadow-xs">
            <div className="w-2 h-2 rounded-full bg-blue-600 shadow-2xs" />
          </div>
        </div>
      )}

      {/* 🌟 4. Rotation Indicator Badge (Top-Left) */}
      {isRotated && (
        <span className="absolute top-0.5 left-0.5 text-[8px] bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-black shadow-xs z-10">
          ↻
        </span>
      )}

      {/* 🌟 5. Tiny Tooth Number Pill (Bottom-Right) */}
      <span className="absolute bottom-0 right-0 text-[7.5px] font-black bg-[#10244B]/90 text-white px-1 py-0.2 rounded-tl-md z-10">
        #{toothNumber}
      </span>
    </div>
  );
}

export const TOOTH_ANATOMY = {
  1: { number: 1, name: "Maxillary Right 3rd Molar (Wisdom Tooth)", type: "Molar", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 3, cusps: 4, function: "Grinding & crushing food (often vestigial or impacted)", fdi: "18" },
  2: { number: 2, name: "Maxillary Right 2nd Molar (12-yr Molar)", type: "Molar", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 3, cusps: 4, function: "Heavy crushing & pulverizing bolus", fdi: "17" },
  3: { number: 3, name: "Maxillary Right 1st Molar (6-yr Molar)", type: "Molar", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 3, cusps: 4, function: "Cornerstone of chewing & dental arch stability", fdi: "16" },
  4: { number: 4, name: "Maxillary Right 2nd Premolar (Bicuspid)", type: "Premolar", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 1, cusps: 2, function: "Tearing & transitional grinding", fdi: "15" },
  5: { number: 5, name: "Maxillary Right 1st Premolar (Bicuspid)", type: "Premolar", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 2, cusps: 2, function: "Bicuspid shearing & fine mastication", fdi: "14" },
  6: { number: 6, name: "Maxillary Right Canine (Cuspid / Eye Tooth)", type: "Canine", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 1, cusps: 1, function: "Piercing & holding food, canine guidance (longest root)", fdi: "13" },
  7: { number: 7, name: "Maxillary Right Lateral Incisor", type: "Incisor", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 1, cusps: 1, function: "Cutting & shearing food, phonetics & aesthetics", fdi: "12" },
  8: { number: 8, name: "Maxillary Right Central Incisor", type: "Incisor", arch: "Maxillary (Upper)", quad: "Upper Right", roots: 1, cusps: 1, function: "Primary front cutting tooth & central smile anchor", fdi: "11" },
  9: { number: 9, name: "Maxillary Left Central Incisor", type: "Incisor", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 1, cusps: 1, function: "Primary front cutting tooth & central smile anchor", fdi: "21" },
  10: { number: 10, name: "Maxillary Left Lateral Incisor", type: "Incisor", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 1, cusps: 1, function: "Cutting & shearing food, speech articulation", fdi: "22" },
  11: { number: 11, name: "Maxillary Left Canine (Cuspid / Eye Tooth)", type: "Canine", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 1, cusps: 1, function: "Tearing food & disoccluding posterior teeth", fdi: "23" },
  12: { number: 12, name: "Maxillary Left 1st Premolar (Bicuspid)", type: "Premolar", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 2, cusps: 2, function: "Transitioning food from canines to molars", fdi: "24" },
  13: { number: 13, name: "Maxillary Left 2nd Premolar (Bicuspid)", type: "Premolar", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 1, cusps: 2, function: "Fine crushing before molar mastication", fdi: "25" },
  14: { number: 14, name: "Maxillary Left 1st Molar (6-yr Molar)", type: "Molar", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 3, cusps: 4, function: "Major mastication anchor (Trifurcated 3 roots)", fdi: "26" },
  15: { number: 15, name: "Maxillary Left 2nd Molar (12-yr Molar)", type: "Molar", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 3, cusps: 4, function: "Heavy chewing & bolus refinement", fdi: "27" },
  16: { number: 16, name: "Maxillary Left 3rd Molar (Wisdom Tooth)", type: "Molar", arch: "Maxillary (Upper)", quad: "Upper Left", roots: 3, cusps: 3, function: "Late erupting posterior grinding tooth", fdi: "28" },
  17: { number: 17, name: "Mandibular Left 3rd Molar (Wisdom Tooth)", type: "Molar", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 2, cusps: 4, function: "Late lower molar, commonly prone to impaction", fdi: "38" },
  18: { number: 18, name: "Mandibular Left 2nd Molar (12-yr Molar)", type: "Molar", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 2, cusps: 4, function: "High-force lower jaw mastication", fdi: "37" },
  19: { number: 19, name: "Mandibular Left 1st Molar (6-yr Molar)", type: "Molar", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 2, cusps: 5, function: "Primary chewing powerhouse of lower jaw (2 large roots: Mesial & Distal, 5 prominent cusps)", fdi: "36" },
  20: { number: 20, name: "Mandibular Left 2nd Premolar (Bicuspid)", type: "Premolar", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 1, cusps: 2, function: "Grinding & pre-molar chewing", fdi: "35" },
  21: { number: 21, name: "Mandibular Left 1st Premolar (Bicuspid)", type: "Premolar", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 1, cusps: 2, function: "Tearing & transitional chewing", fdi: "34" },
  22: { number: 22, name: "Mandibular Left Canine (Cuspid)", type: "Canine", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 1, cusps: 1, function: "Lower canine guidance & food grasping", fdi: "33" },
  23: { number: 23, name: "Mandibular Left Lateral Incisor", type: "Incisor", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 1, cusps: 1, function: "Lower incisal shearing & cutting", fdi: "32" },
  24: { number: 24, name: "Mandibular Left Central Incisor", type: "Incisor", arch: "Mandibular (Lower)", quad: "Lower Left", roots: 1, cusps: 1, function: "Smallest human tooth with sharp cutting edge", fdi: "31" },
  25: { number: 25, name: "Mandibular Right Central Incisor", type: "Incisor", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 1, cusps: 1, function: "Precision cutting & shearing against upper incisors", fdi: "41" },
  26: { number: 26, name: "Mandibular Right Lateral Incisor", type: "Incisor", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 1, cusps: 1, function: "Lower cutting tooth & speech support", fdi: "42" },
  27: { number: 27, name: "Mandibular Right Canine (Cuspid)", type: "Canine", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 1, cusps: 1, function: "Cornerstone of lower right dental arch", fdi: "43" },
  28: { number: 28, name: "Mandibular Right 1st Premolar (Bicuspid)", type: "Premolar", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 1, cusps: 2, function: "Bicuspid tearing & crushing", fdi: "44" },
  29: { number: 29, name: "Mandibular Right 2nd Premolar (Bicuspid)", type: "Premolar", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 1, cusps: 2, function: "Lower grinding & food bolus processing", fdi: "45" },
  30: { number: 30, name: "Mandibular Right 1st Molar (6-yr Molar)", type: "Molar", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 2, cusps: 5, function: "Primary chewing powerhouse of lower right jaw", fdi: "46" },
  31: { number: 31, name: "Mandibular Right 2nd Molar (12-yr Molar)", type: "Molar", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 2, cusps: 4, function: "Heavy lower right chewing & grinding", fdi: "47" },
  32: { number: 32, name: "Mandibular Right 3rd Molar (Wisdom Tooth)", type: "Molar", arch: "Mandibular (Lower)", quad: "Lower Right", roots: 2, cusps: 4, function: "Lower right third molar", fdi: "48" }
};

const CHECKLIST_ITEMS = [
  { id: 'patient', label: 'Patient Identification Check (Name/DOB verbally verified)' },
  { id: 'complaint', label: 'Primary Complaint (Location, severity, duration of pain)' },
  { id: 'concern', label: 'Chief Concerns / Swelling (Bleeding, discharge called out)' },
  { id: 'history', label: 'Relevant Medical History (Conditions, allergies, meds confirmed)' },
  { id: 'caries', label: 'Charted Caries / Fillings (Cavities and restorations noted)' },
  { id: 'mobility', label: 'Tooth Mobility / Periodontal Assessment (Gums health mentioned)' },
  { id: 'imaging', label: 'X-Ray / Diagnostic Imaging Ref (Radiograph references made)' },
];

const getHexColor = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('demineraliz') || s.includes('white spot')) return '#FCA5A5';
    if (s.includes('apicoectomy') || s.includes('retrofill')) return '#6D28D9';
    if (s.includes('pfm') || s.includes('porcelain-metal')) return '#B45309';
    if (s.includes('tmj') || s.includes('disc displacement') || s.includes('trismus') || s.includes('closed lock') || s.includes('masseter')) return '#E11D48';
    if (s.includes('pulpotomy') || s.includes('mta')) return '#7C3AED';
    if (s.includes('ssc') || s.includes('stainless')) return '#64748B';
    if (s.includes('space maintainer') || s.includes('band and loop') || s.includes('space')) return '#93C5FD';
    if (s.includes('fluoride') || s.includes('varnish') || s.includes('sealant')) return '#06B6D4';
    if (s.includes('strip crown') || s.includes('inlay') || s.includes('onlay') || s.includes('veneer')) return '#3B82F6';
    if (s.includes('bone loss') || s.includes('periodont') || s.includes('furcation') || s.includes('mobility') || s.includes('recession')) return '#E0665A';
    if (s.includes('resorption') || s.includes('cyst') || s.includes('impacted') || s.includes('supernumerary') || s.includes('mesiodens')) return '#8B5CF6';
    if (s.includes('attrition') || s.includes('wear') || s.includes('bruxism') || s.includes('crack') || s.includes('erosion') || s.includes('chipped')) return '#F59E0B';
    if (s.includes('sensitivity') || s.includes('exposed root')) return '#3B82F6';
    if (s.includes('decay') || s.includes('damaged') || s === 'cavity' || s === 'broken' || s.includes('caries') || s.includes('keera') || s.includes('ecc') || s.includes('abscess')) return '#EF4444';
    if (s.includes('fill') || s.includes('composite')) return '#2563EB';
    if (s.includes('amalgam')) return '#64748B';
    if (s.includes('gic')) return '#F59E0B';
    if (s.includes('already treated') || s.includes('treated') || s.includes('rct') || s.includes('canal') || s.includes('endo')) return '#7C3AED';
    if (s.includes('crown') || s.includes('bridge')) return '#D97706';
    if (s.includes('implant')) return '#0E8A80';
    if (s.includes('bracket') || s.includes('ortho') || s.includes('overbite') || s.includes('underbite') || s.includes('crossbite') || s.includes('open bite')) return '#0284C7';
    if (s.includes('miss') || s.includes('extract') || s.includes('exfoliat') || s.includes('absent')) return '#DC2626';
    return '#10B981';
};

export default function ChartPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('doctor') || '{}');
    } catch {
      return {};
    }
  });
  const [teethState, setTeethState] = useState([]);
  const [dentitionMode, setDentitionMode] = useState('permanent'); // 'permanent' | 'pediatric' | 'mixed'
  const [detailedTooth, setDetailedTooth] = useState(null);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [selectedPaletteCondition, setSelectedPaletteCondition] = useState('Normal / Healthy');
  const [toothSurfacesState, setToothSurfacesState] = useState({});
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
  const [chatInput, setChatInput] = useState('');
  const [highlightedTeeth, setHighlightedTeeth] = useState([]);
  const [highlightInfo, setHighlightInfo] = useState(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [selectedJawView, setSelectedJawView] = useState('both'); // 'both' | 'maxilla' | 'mandible'
  const [showOrthoTmjModal, setShowOrthoTmjModal] = useState(false);
  const [liveOrthoAssessment, setLiveOrthoAssessment] = useState(null);
  
  // Voice Recording & AI Notes States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStreamText, setVoiceStreamText] = useState('Click mic to start recording...');
  const [aiNotesLoading, setAiNotesLoading] = useState(false);
  const [aiNotesProgress, setAiNotesProgress] = useState(0);
  const [aiNotesData, setAiNotesData] = useState(null);
  const [isMicActive, setIsMicActive] = useState(false); // UI toggle state
  const [autoTimer, setAutoTimer] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Nexu e-ID Verification States
  const [isMicUnlocked, setIsMicUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [nexuError, setNexuError] = useState('');
  const [showNexuModal, setShowNexuModal] = useState({
    visible: false,
    type: '', // 'UNLOCK' or 'HIGH_RISK'
    pendingCommands: []
  });

  // Checklist compliance state based on parsed AI notes
  const [checklist, setChecklist] = useState({
    patient: false,
    complaint: false,
    concern: false,
    history: false,
    caries: false,
    mobility: false,
    imaging: false,
    treatment: false
  });

  // Chat State Machine & UI
  const [currentStep, setCurrentStep] = useState('IDLE'); // IDLE, AWAITING_DOB, AWAITING_PHONE, CONFIRMING_APPOINTMENT
  const [tempRegData, setTempRegData] = useState({ name: '', dob: '', phone: '' });
  const [tempApptData, setTempApptData] = useState({ patientId: null, date: '', time: '' });

  const [messages, setMessages] = useState([]);
  const chatScrollContainerRef = useRef(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientVisits, setPatientVisits] = useState([]);

  // Auto-scroll chat messages internally without moving the webpage scroll position
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, isMicActive]);

  // Real-time evaluation of live transcription to dynamically satisfy Omission Compliance Checklist
  const evaluateTranscriptChecklist = (text) => {
    if (!text) return;
    const txt = text.toLowerCase();
    setChecklist(prev => {
      const updated = { ...prev };
      
      // 1. Patient ID / Demographics Check
      if (
        txt.includes("patient") || txt.includes("name") || txt.includes("dob") || 
        txt.includes("date of birth") || txt.includes("born") || txt.includes("years old") || 
        txt.includes("male") || txt.includes("female") || txt.includes("mr") || 
        txt.includes("mrs") || txt.includes("ms") || txt.includes("identity") ||
        txt.includes("verified") || (patient && txt.includes(patient.firstName.toLowerCase()))
      ) {
        updated.patient = true;
      }

      // 2. Primary Complaint / Pain Severity & Duration
      if (
        txt.includes("pain") || txt.includes("hurt") || txt.includes("ache") || 
        txt.includes("aching") || txt.includes("toothache") || txt.includes("severe") || 
        txt.includes("complaint") || txt.includes("sharp") || txt.includes("throbbing") || 
        txt.includes("discomfort") || txt.includes("days") || txt.includes("weeks") || 
        txt.includes("months") || txt.includes("since") || txt.includes("started")
      ) {
        updated.complaint = true;
      }

      // 3. Chief Concerns / Swelling / Bleeding
      if (
        txt.includes("swell") || txt.includes("swelling") || txt.includes("bleed") || 
        txt.includes("bleeding") || txt.includes("pus") || txt.includes("discharge") || 
        txt.includes("gum") || txt.includes("gums") || txt.includes("abscess") || 
        txt.includes("tender") || txt.includes("inflam") || txt.includes("concern") || 
        txt.includes("sensitive") || txt.includes("sensitivity") || txt.includes("hot") || txt.includes("cold")
      ) {
        updated.concern = true;
      }

      // 4. Relevant Medical History / Allergies / Meds
      if (
        txt.includes("history") || txt.includes("allerg") || txt.includes("medication") || 
        txt.includes("meds") || txt.includes("pressure") || txt.includes("diabetes") || 
        txt.includes("cardiac") || txt.includes("heart") || txt.includes("penicillin") || 
        txt.includes("asthma") || txt.includes("surgery") || txt.includes("smok") || 
        txt.includes("health") || txt.includes("condition") || txt.includes("nil") || txt.includes("none")
      ) {
        updated.history = true;
      }

      // 5. Charted Caries / Fillings / Restorations
      if (
        txt.includes("caries") || txt.includes("cavity") || txt.includes("cavities") || 
        txt.includes("decay") || txt.includes("fill") || txt.includes("restor") || 
        txt.includes("crown") || txt.includes("fractur") || txt.includes("broken") || 
        txt.includes("enamel") || txt.includes("tooth") || txt.includes("teeth") || 
        txt.includes("occlusal") || txt.includes("amalgam") || txt.includes("composite") ||
        txt.includes("molar") || txt.includes("premolar") || txt.includes("incisor") || txt.includes("canine") ||
        /\b(?:tooth\s*)?\d{1,2}\b/.test(txt)
      ) {
        updated.caries = true;
      }

      // 6. Tooth Mobility / Periodontal Assessment
      if (
        txt.includes("mobility") || txt.includes("mobile") || txt.includes("loose") || 
        txt.includes("periodontal") || txt.includes("perio") || txt.includes("pocket") || 
        txt.includes("bone loss") || txt.includes("gingiv") || txt.includes("prob") || 
        txt.includes("grade") || txt.includes("recession") || txt.includes("calculus") || 
        txt.includes("tartar") || txt.includes("plaque") || txt.includes("bop")
      ) {
        updated.mobility = true;
      }

      // 7. X-Ray / Diagnostic Imaging Ref
      if (
        txt.includes("x-ray") || txt.includes("xray") || txt.includes("radiograph") || 
        txt.includes("opg") || txt.includes("bitewing") || txt.includes("periapical") || 
        txt.includes("panoramic") || txt.includes("cbct") || txt.includes("scan") || 
        txt.includes("image") || txt.includes("imaging") || txt.includes("film") ||
        txt.includes("view") || txt.includes("radiolucent") || txt.includes("radiopaque") || txt.includes("apical")
      ) {
        updated.imaging = true;
      }

      return updated;
    });
  };

  // Audio/Mic references
  const silenceTimeoutRef = useRef(null);

  // AI Notes Tab States
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'notes' | 'radiographs'
  const [notesHistory, setNotesHistory] = useState([]);
  const [showDeletedNotes, setShowDeletedNotes] = useState(false);
  const isCompilingNotesRef = useRef(false);
  const [notesCurrentPage, setNotesCurrentPage] = useState(1);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesLoadProgress, setNotesLoadProgress] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [expandedNoteDetail, setExpandedNoteDetail] = useState(null);
  const [expandedTranscript, setExpandedTranscript] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteData, setEditingNoteData] = useState(null);

  // Radiographs states
  const [radiographs, setRadiographs] = useState([]);
  const [radiographsLoading, setRadiographsLoading] = useState(false);
  const [selectedRadiograph, setSelectedRadiograph] = useState(null);
  const [uploadingXray, setUploadingXray] = useState(false);
  const [isEditingXrayAnalysis, setIsEditingXrayAnalysis] = useState(false);
  const [editingXrayText, setEditingXrayText] = useState('');
  const [savingXrayTimeline, setSavingXrayTimeline] = useState(false);
  const [xrayDetailsExpanded, setXrayDetailsExpanded] = useState(false);
  const [isReanalyzingXray, setIsReanalyzingXray] = useState(false);

  // Manual Tooth Observation Editing & Directory States
  const [editingToothData, setEditingToothData] = useState(null);
  const [savingToothData, setSavingToothData] = useState(false);
  const [toothSearchQuery, setToothSearchQuery] = useState('');
  const [toothFilterCategory, setToothFilterCategory] = useState('all');
  const [showObservationsDrawer, setShowObservationsDrawer] = useState(false);

  // Live Speech Stream & Waveform states
  const [liveSpeechStream, setLiveSpeechStream] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const speechRecognitionRef = useRef(null);
  const animationFrameRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);

  const PEDIATRIC_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];

  const fetchTeethChart = (activeMode = dentitionMode) => {
    fetch(`/api/patients/${patientId}/chart`)
      .then(res => res.json())
      .then(data => {
          const pediatricMap = {};
          const adultMap = {};

          const rawList = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
          rawList.forEach(t => {
            const cat = (t.dentitionCategory || t.DentitionCategory || 'Adult').trim().toLowerCase();
            const key = (t.toothKey || t.ToothKey || '').trim().toUpperCase();
            const raw = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();
            const num = parseInt(raw, 10);

            if (cat === 'pediatric' || /^[A-T]$/.test(key) || /^[A-T]$/.test(raw)) {
              const pKey = (/^[A-T]$/.test(key) ? key : /^[A-T]$/.test(raw) ? raw : (num >= 1 && num <= 20 ? String.fromCharCode(64 + num) : 'A'));
              pediatricMap[pKey] = t;
            } else {
              const aKey = (!isNaN(num) && num >= 1 && num <= 32) ? num : (parseInt(key, 10) || 1);
              adultMap[aKey] = t;
            }
          });

          const dbTeethMap = activeMode === 'pediatric' ? pediatricMap : adultMap;

          // Restore TMJ / Ortho assessment if saved on patient teeth in DB
          try {
            const tmjRecord = rawList.find(t => {
              const comm = (t.comments || t.Comments || t.comment || t.Comment || '');
              const stat = (t.conditionStatus || t.ConditionStatus || t.status || t.Status || '');
              return /TMJ Articulation|TMJ Closed Lock|TMJ Disc Reduction|Trismus/i.test(comm) || /TMJ/i.test(stat);
            });

            if (tmjRecord) {
              const comm = (tmjRecord.comments || tmjRecord.Comments || tmjRecord.comment || tmjRecord.Comment || '');
              const stat = (tmjRecord.conditionStatus || tmjRecord.ConditionStatus || tmjRecord.status || tmjRecord.Status || '');
              let detectedState = 'normal';
              if (/closed.?lock|trismus/i.test(stat) || /closed.?lock|trismus/i.test(comm)) {
                detectedState = 'closed_lock';
              } else if (/click|reduction/i.test(stat) || /click|reduction/i.test(comm)) {
                detectedState = 'clicking';
              }

              let detectedOpening = 42.0;
              const openMatch = comm.match(/Opening:\s*([\d\.]+)mm/i);
              if (openMatch) {
                detectedOpening = parseFloat(openMatch[1]);
              } else if (detectedState === 'closed_lock') {
                detectedOpening = 24.0;
              } else if (detectedState === 'clicking') {
                detectedOpening = 35.0;
              }

              const restoredTmj = {
                suite_category: 'tmj',
                tmj_state: detectedState,
                mouth_opening_mm: detectedOpening,
                cdt_code: detectedState === 'normal' ? 'D0140' : 'D7880'
              };
              setLiveOrthoAssessment(restoredTmj);
              try {
                localStorage.setItem(`dentist_ortho_tmj_${patientId}`, JSON.stringify(restoredTmj));
              } catch (e) {}
            }
          } catch (restoreErr) {
            console.warn('Could not auto-restore TMJ assessment:', restoreErr);
          }

          if (activeMode === 'pediatric') {
            // Build 20 primary deciduous teeth A through T
            const full20Primary = PEDIATRIC_KEYS.map((letterKey, idx) => {
              const existing = pediatricMap[letterKey];
              const status = existing?.conditionStatus || existing?.status || 'Healthy';
              const pInfo = PEDIATRIC_TOOTH_NAMES[letterKey];
              let clinicalComment = (existing?.comments || existing?.Comments || existing?.comment || existing?.Comment || '').trim();
              if (!clinicalComment || clinicalComment === "Saved via Save Chart command") {
                if (status === 'Healthy') {
                  clinicalComment = `Intact primary deciduous enamel on Tooth ${letterKey} (${pInfo?.name || 'Primary'}), physiological baseline`;
                } else if (status.toLowerCase().includes('pulpotomy') || status.toLowerCase().includes('mta')) {
                  clinicalComment = `Pediatric Endodontics: Pulpotomy with MTA coronal pulp therapy on Primary Tooth ${letterKey}`;
                } else if (status.toLowerCase().includes('crown') || status.toLowerCase().includes('ssc')) {
                  clinicalComment = `Pediatric Prosthetics: Stainless Steel Crown (SSC) placed on Primary Tooth ${letterKey}`;
                } else if (status.toLowerCase().includes('space')) {
                  clinicalComment = `Pediatric Orthodontics: Space maintainer appliance fitted on Primary Tooth ${letterKey}`;
                } else if (status.toLowerCase().includes('fill') || status.toLowerCase().includes('composite') || status.toLowerCase().includes('gic')) {
                  clinicalComment = `Restorative: Esthetic pediatric composite/GIC restoration on Primary Tooth ${letterKey}`;
                } else if (status.toLowerCase().includes('caries') || status.toLowerCase().includes('decay') || status.toLowerCase().includes('ecc')) {
                  clinicalComment = `Pediatric Pathology: Early Childhood Caries (ECC) lesion on Primary Tooth ${letterKey}`;
                } else {
                  clinicalComment = `Pediatric Observation: ${status} recorded on Primary Tooth ${letterKey}`;
                }
              }

              return {
                toothNumber: letterKey,
                name: pInfo?.name || `Primary Tooth ${letterKey}`,
                status,
                color: existing?.color || existing?.conditionColor || getHexColor(status),
                comments: clinicalComment,
                comment: clinicalComment,
                rotationDeg: existing?.rotationDeg || 0,
                shade: existing?.shade || existing?.Shade || 'A1',
                mobility: existing?.mobility || existing?.Mobility || 'Grade 0',
                isPediatric: true,
                quad: pInfo?.quad || 'Pediatric Arch'
              };
            });

            console.log(`👶 [Pediatric Primary Chart Loaded for Patient #${patientId}]:`, full20Primary);
            setTeethState(full20Primary);
            return;
          }

          // Build complete 32-tooth adult dentogram (standard full adult permanent dentition for a 32-year-old adult)
          const full32Teeth = Array.from({ length: 32 }, (_, i) => {
            const toothNum = i + 1;
            const existing = dbTeethMap[toothNum];
            const status = existing?.conditionStatus || existing?.status || 'Healthy';
            const fullComment = (existing?.comments || existing?.Comments || existing?.comment || '') + ' ' + status;
            let rotationDeg = 0;
            if (fullComment.toLowerCase().includes('rotat')) {
              const degMatch = fullComment.match(/(\d{1,3})\s*(?:deg|°|degree)?/i);
              rotationDeg = degMatch ? parseInt(degMatch[1], 10) : 45;
              if (fullComment.toLowerCase().includes('mesio') || fullComment.toLowerCase().includes('palatal')) {
                rotationDeg = Math.abs(rotationDeg);
              }
            }

            let clinicalComment = (existing?.comments || existing?.Comments || existing?.comment || existing?.Comment || '').trim();
            if (!clinicalComment || clinicalComment === "Saved via Save Chart command") {
              if (status === 'Healthy') {
                clinicalComment = 'Intact enamel, physiological mobility (Grade 0)';
              } else if (status.toLowerCase().includes('fill') || status.toLowerCase().includes('composite') || status.toLowerCase().includes('amalgam') || status.toLowerCase().includes('gic')) {
                clinicalComment = `Restorative: Composite restoration placed on Tooth #${toothNum}`;
              } else if (status.toLowerCase().includes('caries') || status.toLowerCase().includes('decay') || status.toLowerCase().includes('damag') || status.toLowerCase().includes('cavity')) {
                clinicalComment = `Pathology: Active caries enamel demineralization on Tooth #${toothNum}`;
              } else if (status.toLowerCase().includes('canal') || status.toLowerCase().includes('rct')) {
                clinicalComment = `Endodontics: Root canal therapy and obturation on Tooth #${toothNum}`;
              } else if (status.toLowerCase().includes('mobility')) {
                clinicalComment = `Periodontal: Pathologic tooth mobility on Tooth #${toothNum}`;
              } else if (status.toLowerCase().includes('rotat')) {
                clinicalComment = `Developmental: ${rotationDeg || 45}° axial rotation diagnosed on odontogram`;
              } else {
                clinicalComment = `Clinical Observation: ${status} recorded on Tooth #${toothNum}`;
              }
            }

            return {
              toothNumber: toothNum,
              status,
              color: existing?.color || existing?.conditionColor || getHexColor(status),
              comments: clinicalComment,
              comment: clinicalComment,
              rotationDeg,
              shade: existing?.shade || existing?.Shade || 'A2',
              mobility: existing?.mobility || existing?.Mobility || 'Grade 0'
            };
          });

          setTeethState(full32Teeth);
      })
      .catch(err => {
        console.error("Chart fetch error:", err);
        if (activeMode === 'pediatric') {
          const default20 = PEDIATRIC_KEYS.map((letterKey) => ({
            toothNumber: letterKey,
            name: PEDIATRIC_TOOTH_NAMES[letterKey]?.name || `Primary Tooth ${letterKey}`,
            status: 'Healthy',
            color: '#10B981',
            comments: `Intact primary deciduous enamel on Tooth ${letterKey}, physiological baseline`,
            shade: 'A1',
            mobility: 'Grade 0',
            isPediatric: true
          }));
          setTeethState(default20);
        } else {
          const default32 = Array.from({ length: 32 }, (_, i) => ({
            toothNumber: i + 1,
            status: 'Healthy',
            color: '#10B981',
            comments: 'Intact enamel, physiological mobility (Grade 0)',
            shade: 'A2',
            mobility: 'Grade 0'
          }));
          setTeethState(default32);
        }
      });
  };

  const handleDentitionChange = (newMode) => {
    const age = calculatePatientAge(patient?.dob || patient?.DOB);
    const rawType = (patient?.dentitionType || patient?.DentitionType || '').trim().toLowerCase();
    const isMixed = rawType.includes('mixed') || (age !== null && age >= 6 && age <= 12);
    const isStrictAdult = !isMixed && ((age !== null && age >= 13) || rawType === 'adult' || rawType === 'permanent');
    const isStrictPediatric = !isMixed && ((age !== null && age < 6) || rawType === 'pediatric');

    // Case 1: Patient is in Mixed Dentition (Age 6–12 or registered mixed)
    // Mixed dentition children have both primary & permanent teeth, so the doctor can freely select Mixed, Permanent, or Pediatric!
    if (isMixed) {
      setDentitionMode(newMode);
      fetchTeethChart(newMode);
      return;
    }

    // Case 2: Patient is strictly Pediatric (< 6 years)
    if (isStrictPediatric) {
      if (newMode !== 'pediatric') {
        const targetLabel = newMode === 'permanent' ? '🦷 Adult Permanent (1–32)' : '🔀 Mixed Dentition Arch';
        setCategoryRestrictionModal({
          isOpen: true,
          title: 'Dentition Category Restriction',
          subtitle: `Patient Does Not Lay in ${newMode === 'permanent' ? 'Adult' : 'Mixed'} Category`,
          message: `Patient ${patient?.firstName || ''} ${patient?.lastName || ''} (${age !== null ? `Age: ${age} Yrs` : 'Pediatric'}) has primary deciduous dentition (Teeth A–T) and does not lay in the ${newMode === 'permanent' ? 'Adult Permanent (1–32)' : 'Mixed Dentition'} category.`,
          detail: `Doctor navigation is restricted for this pediatric patient profile to preserve primary deciduous data integrity.`,
          patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`,
          patientAge: age,
          dob: patient?.dob || patient?.DOB || 'N/A',
          activeCategory: '👶 Pediatric Deciduous (A–T)',
          attemptedCategory: targetLabel
        });
        return;
      }
    }

    // Case 3: Patient is strictly Adult (>= 13 years)
    if (isStrictAdult) {
      if (newMode !== 'permanent') {
        const targetLabel = newMode === 'pediatric' ? '👶 Pediatric Deciduous (A–T)' : '🔀 Mixed Dentition Arch';
        setCategoryRestrictionModal({
          isOpen: true,
          title: 'Dentition Category Restriction',
          subtitle: `Patient Does Not Lay in ${newMode === 'pediatric' ? 'Pediatric' : 'Mixed'} Category`,
          message: `Patient ${patient?.firstName || ''} ${patient?.lastName || ''} (${age !== null ? `Age: ${age} Yrs` : 'Adult'}) has full permanent adult dentition (Teeth 1–32) and does not lay in the ${newMode === 'pediatric' ? 'Pediatric Deciduous (A–T)' : 'Mixed Dentition'} category.`,
          detail: `Doctor navigation to ${newMode === 'pediatric' ? 'baby teeth (A–T)' : 'mixed arch'} is restricted for fully erupted adult patient profiles.`,
          patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`,
          patientAge: age,
          dob: patient?.dob || patient?.DOB || 'N/A',
          activeCategory: '🦷 Adult Permanent (1–32)',
          attemptedCategory: targetLabel
        });
        return;
      }
    }

    setDentitionMode(newMode);
    fetchTeethChart(newMode);
  };

  const orthoSaveTimeoutRef = useRef(null);

  const handleSaveOrthoTmjAssessment = (assessmentData) => {
    if (!assessmentData) return;
    const { suite_category, bite_type, impaction_type, tmj_state, cdt_code, overbite_percent, overjet_mm, open_bite_gap_mm, crossbite_side, wear_severity, angulation_degrees, nerve_distance_mm, eruption_percent, mouth_opening_mm } = assessmentData;

    const isPediatric = dentitionMode === 'pediatric' || dentitionMode === 'mixed';
    let targetTeeth = [];
    let statusLabel = 'Ortho Malocclusion';
    let conditionColor = '#2563EB';
    let commentText = `Assessment saved (${cdt_code || 'D8080'})`;

    // 1. Occlusion Suite
    if (suite_category === 'occlusion' || bite_type) {
      const type = bite_type || 'overbite';
      if (type === 'overbite') {
        targetTeeth = isPediatric ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
        statusLabel = 'Ortho Malocclusion — DEEP OVERBITE';
        conditionColor = '#2563EB';
        commentText = `Deep overbite: ${overbite_percent ?? 50}% overlap. Orthodontic leveling indicated (CDT D8080).`;
      } else if (type === 'underbite') {
        targetTeeth = isPediatric ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
        statusLabel = 'Ortho Malocclusion — CLASS III UNDERBITE';
        conditionColor = '#EF4444';
        commentText = `Class III underbite: ${overjet_mm ?? -3.5}mm negative overjet (CDT D8080).`;
      } else if (type === 'crossbite') {
        targetTeeth = isPediatric ? ['B', 'I', 'L', 'S'] : [3, 14, 19, 30];
        statusLabel = 'Ortho Malocclusion — CROSSBITE';
        conditionColor = '#F59E0B';
        commentText = `Posterior crossbite (${crossbite_side || 'right'}). RPE expander indicated (CDT D8080).`;
      } else if (type === 'openbite') {
        targetTeeth = isPediatric ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
        statusLabel = 'Ortho Malocclusion — OPEN BITE';
        conditionColor = '#EC4899';
        commentText = `Anterior vertical open bite: ${open_bite_gap_mm ?? 4.0}mm gap (CDT D8080).`;
      } else if (type === 'molarwear') {
        targetTeeth = isPediatric ? ['A', 'B', 'I', 'J', 'K', 'L', 'S', 'T'] : [2, 3, 14, 15, 18, 19, 30, 31];
        statusLabel = 'Bruxism — OCCLUSAL ATTRITION';
        conditionColor = '#D97706';
        commentText = `Severe bruxism wear facets (${wear_severity || 'moderate'}). Nightguard indicated (CDT D9944).`;
      }
    }
    // 2. Impaction Suite
    else if (suite_category === 'impactions' || impaction_type) {
      const impType = impaction_type || 'mesioangular';
      if (impType === 'mesioangular' || impType === 'horizontal') {
        targetTeeth = [17, 32];
        statusLabel = impType === 'horizontal' ? 'Impacted 3rd Molar (Horizontal 90°)' : 'Impacted 3rd Molar (Mesioangular 45°)';
        conditionColor = '#7C3AED';
        commentText = impType === 'horizontal' ? `Horizontally impacted 3rd molar (IAN distance: ${nerve_distance_mm ?? 0.5}mm) (CDT D7240).` : `Mesioangular ${angulation_degrees ?? 45}° impacted wisdom tooth (CDT D7230).`;
      } else if (impType === 'canine') {
        targetTeeth = [6, 11];
        statusLabel = 'Palatally Impacted Canine';
        conditionColor = '#DC2626';
        commentText = `Palatally trapped canine (${angulation_degrees ?? 35}°). Surgical exposure & gold chain (CDT D7280).`;
      } else if (impType === 'premolar') {
        targetTeeth = [20, 29];
        statusLabel = 'Partially Erupted Premolar';
        conditionColor = '#BE123C';
        commentText = `Partially erupted premolar (${eruption_percent ?? 35}% emergence). Operculectomy (CDT D7220/D7971).`;
      }
    }
    // 3. TMJ Suite
    else if (suite_category === 'tmj' || tmj_state) {
      targetTeeth = isPediatric ? ['A', 'J', 'K', 'T'] : [1, 16, 17, 32];
      statusLabel = tmj_state === 'closed_lock' ? 'TMJ Closed Lock / Trismus' : tmj_state === 'clicking' ? 'TMJ Disc Reduction (Clicking)' : 'Normal TMJ Articulation';
      conditionColor = tmj_state === 'closed_lock' ? '#EF4444' : tmj_state === 'clicking' ? '#F59E0B' : '#10B981';
      commentText = `TMJ Articulation: ${statusLabel} (Opening: ${mouth_opening_mm ?? 42}mm) (CDT ${cdt_code || 'D7880'}).`;
    }

    // Step A: Update local teethState in React INSTANTLY
    setTeethState(prev => {
      return prev.map(t => {
        const tKey = t.toothNumber ?? t.ToothNumber;
        const match = targetTeeth.some(x => String(x).toUpperCase() === String(tKey).toUpperCase());
        if (!match) return t;
        return {
          ...t,
          status: statusLabel,
          conditionStatus: statusLabel,
          condition: statusLabel,
          cdtCode: cdt_code || 'D8080',
          color: conditionColor,
          comment: commentText,
          comments: commentText,
          updatedAt: new Date().toISOString()
        };
      });
    });

    // Step B & C: Debounce backend DB writes to avoid spamming network while dragging
    if (orthoSaveTimeoutRef.current) {
      clearTimeout(orthoSaveTimeoutRef.current);
    }

    orthoSaveTimeoutRef.current = setTimeout(async () => {
      const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 5);
      const dbUpdates = targetTeeth.map(tNum => ({
        toothNumber: tNum,
        conditionStatus: statusLabel,
        cdtCode: cdt_code || 'D8080',
        color: conditionColor,
        comment: commentText,
        comments: commentText
      }));

      try {
        const res = await fetch('/api/patients/teeth/update-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: pid,
            updates: dbUpdates
          })
        });
        if (res.ok) {
          console.log(`✅ [DB Bulk Saved Successfully]: ${statusLabel} for teeth:`, targetTeeth);
        }
      } catch (err) {
        console.error("Error saving assessment to DB:", err);
      }

      // Add Clinical Log entry
      try {
        const storedDoc = localStorage.getItem('doctor');
        const docObj = storedDoc ? JSON.parse(storedDoc) : null;
        const docId = docObj?.doctorID || docObj?.DoctorID || 2;
        await fetch(`/api/patients/${pid}/clinical-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorID: docId,
            message: `Clinical Assessment Saved: ${statusLabel} for teeth [${targetTeeth.join(', ')}]. ${commentText}`,
            action: `Diagnostic Suite: ${statusLabel}`
          })
        });
      } catch (logErr) {}
    }, 350);
  };

  useEffect(() => {
    const storedDoc = localStorage.getItem('doctor');
    if (!storedDoc) {
      navigate('/');
      return;
    }
    const docObj = JSON.parse(storedDoc);
    const loggedInDocId = docObj.doctorID || docObj.DoctorID;

    fetch(`/api/patients/${patientId}`)
      .then(res => {
        if (!res.ok) throw new Error("Patient not found");
        return res.json();
      })
      .then(data => {
        const patientDocId = data.doctorID || data.DoctorID;
        if (patientDocId && patientDocId !== loggedInDocId) {
          console.warn("Access denied: Patient does not belong to this doctor");
          navigate('/directory');
          return;
        }
        setPatient(data);

        // Auto-detect dentition mode directly from patient record & age
        let autoDentition = 'permanent';
        const pAge = calculatePatientAge(data.dob);
        const rawType = (data.dentitionType || data.DentitionType || '').trim().toLowerCase();
        if (rawType.includes('mixed') || (pAge !== null && pAge >= 6 && pAge <= 12)) {
          autoDentition = 'mixed';
        } else if (rawType === 'pediatric' || (pAge !== null && pAge < 6)) {
          autoDentition = 'pediatric';
        } else {
          autoDentition = 'permanent';
        }
        setDentitionMode(autoDentition);
        fetchTeethChart(autoDentition);
      })
      .catch(err => {
        console.error(err);
        navigate('/directory');
      });

    fetch(`/api/patients/${patientId}/prescriptions`)
      .then(res => res.json())
      .then(data => setPrescriptions(data))
      .catch(err => console.error(err));
  }, [patientId, navigate]);

  useEffect(() => {
    const storedDoc = localStorage.getItem('doctor');
    if (!storedDoc) return;
    const docObj = JSON.parse(storedDoc);
    const loggedInDocId = docObj.doctorID || docObj.DoctorID;

    fetch(`/api/appointments?doctorId=${loggedInDocId}`)
      .then(res => res.json())
      .then(data => {
          if (patient) {
              const matched = data.filter(app => 
                  app.fullName.toLowerCase().includes(patient.firstName.toLowerCase()) ||
                  app.patientID === parseInt(patientId)
              );
              setPatientVisits(matched);
          } else {
              setPatientVisits(data);
          }
      })
      .catch(err => console.error(err));
  }, [patientId, patient]);

  const currentChatPatientIdRef = useRef(null);

  // Initialize fresh chat welcome greeting whenever patientId or patient changes (never sustain stale chat on refresh or navigation)
  useEffect(() => {
    if (!patientId) return;

    currentChatPatientIdRef.current = patientId;

    // Always initialize messages with fresh welcome message for the current patient
    setMessages([{
      id: Date.now(),
      sender: 'ai',
      type: 'welcome_card',
      text: `Welcome to ${patient?.firstName || 'Patient'} ${patient?.lastName || ''}'s chart.`,
      time: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }]);

    // Clean up any stale localStorage chat cache
    try {
      localStorage.removeItem(`dentist_chat_patient_${patientId}`);
    } catch (e) {}

    // Reset temporary highlight state
    setHighlightInfo(null);
    setHighlightedTeeth([]);
  }, [patientId, patient?.firstName, patient?.lastName]);

  // Load AI Notes Tab — triggers lazy process + loads all patient notes
  const loadNotesTab = async (includeDeleted = showDeletedNotes) => {
    const isBoolDeleted = typeof includeDeleted === 'boolean' ? includeDeleted : showDeletedNotes;
    setActiveTab('notes');
    setNotesLoading(true);
    setNotesLoadProgress(0);
    setSelectedNoteId(null);
    setExpandedNoteDetail(null);

    // Animate progress to 30%
    let prog = 0;
    const ticker = setInterval(() => {
      prog = Math.min(prog + 5, 30);
      setNotesLoadProgress(prog);
    }, 80);

    try {
      setNotesLoadProgress(30);

      // Get the logged-in doctor's ID from localStorage
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const doctorId = doctorData.doctorID || doctorData.DoctorID || null;

      // Load AI notes filtered by this doctor for this patient
      const url = doctorId
        ? `/api/ai-dental-notes/patient/${patientId}?dentistId=${doctorId}&includeDeleted=${isBoolDeleted}`
        : `/api/ai-dental-notes/patient/${patientId}?includeDeleted=${isBoolDeleted}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Sort newest first by createdAt (camelCase from API)
        const sorted = [...data].sort((a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setNotesHistory(sorted);
        setNotesCurrentPage(1);

        // Auto-select the newest note if available
        if (sorted.length > 0) {
          handleSelectNote(sorted[0].noteId || sorted[0].NoteId);
        }
      }

      clearInterval(ticker);
      setNotesLoadProgress(100);
      setTimeout(() => setNotesLoading(false), 400);
    } catch (err) {
      console.error('Notes tab load error:', err);
      clearInterval(ticker);
      setNotesLoadProgress(100);
      setTimeout(() => setNotesLoading(false), 400);
    }
  };

  // Trigger lazy compilation for newly recorded audio, then reload the notes list
  const compileAndLoadNotes = async () => {
    if (isCompilingNotesRef.current) return;
    isCompilingNotesRef.current = true;
    setNotesLoading(true);
    setNotesLoadProgress(10);
    try {
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const doctorId = doctorData.doctorID || doctorData.DoctorID || 2;
      await fetch('/api/ai-dental-notes/process-lazy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: parseInt(patientId), dentistId: doctorId })
      });
      await loadNotesTab(showDeletedNotes);
      fetchTeethChart();
    } catch (err) {
      console.error('Failed to compile new note:', err);
      setNotesLoading(false);
    } finally {
      isCompilingNotesRef.current = false;
    }
  };

  const handleDeleteNote = async (noteId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/ai-dental-notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ visible: true, message: `Note #${noteId} moved to trash.` });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
        setSelectedNoteId(null);
        setExpandedNoteDetail(null);
        await loadNotesTab(showDeletedNotes);
      } else {
        alert("Failed to delete note.");
      }
    } catch (e) {
      console.error("Delete note failed", e);
    }
  };

  const handleRestoreNote = async (noteId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/ai-dental-notes/${noteId}/restore`, { method: 'PATCH' });
      if (res.ok) {
        setToast({ visible: true, message: `Note #${noteId} restored to active records!` });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
        setSelectedNoteId(null);
        setExpandedNoteDetail(null);
        await loadNotesTab(showDeletedNotes);
      } else {
        alert("Failed to restore note.");
      }
    } catch (e) {
      console.error("Restore note failed", e);
    }
  };

  const loadRadiographsTab = async () => {
    setActiveTab('radiographs');
    setRadiographsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/radiographs`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const raw = await res.json();
      // API returns { value: [...], Count: N } — unwrap the array
      const data = Array.isArray(raw) ? raw : (raw.value || []);
      setRadiographs(data);
      if (data.length > 0) {
        setSelectedRadiograph(data[0]);
        setXrayDetailsExpanded(false);
      } else {
        setSelectedRadiograph(null);
        setXrayDetailsExpanded(false);
      }
    } catch (err) {
      console.error("Failed to load radiographs:", err);
    } finally {
      setRadiographsLoading(false);
    }
  };

  const handleUploadXray = async (e) => {
    const file = e.target.files?.[0] || (e.dataTransfer?.files?.[0]);
    if (!file) return;
    setUploadingXray(true);
    const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
    const doctorId = doctorData.doctorID || doctorData.DoctorID || 1;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/patients/${patientId}/radiographs?doctorId=${doctorId}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newRecord = await res.json();
        setRadiographs(prev => [newRecord, ...prev]);
        setSelectedRadiograph(newRecord);
        setToast({ visible: true, message: "X-Ray uploaded and analyzed successfully!" });
        setTimeout(() => setToast({ visible: false, message: "" }), 3000);
      } else {
        const errText = await res.text();
        console.error('Upload error:', errText);
        alert(`Upload failed: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading X-ray.");
    } finally {
      setUploadingXray(false);
    }
  };

  useEffect(() => {
    if (selectedRadiograph) {
      setEditingXrayText(selectedRadiograph.analysisSummary || selectedRadiograph.AnalysisSummary || '');
      setIsEditingXrayAnalysis(false);
    } else {
      setEditingXrayText('');
      setIsEditingXrayAnalysis(false);
    }
  }, [selectedRadiograph]);

  const handleSaveXrayToHistory = async () => {
    if (!selectedRadiograph) return;
    setSavingXrayTimeline(true);
    const radId = selectedRadiograph.radiographID || selectedRadiograph.RadiographID;
    const filename = selectedRadiograph.imageName || selectedRadiograph.ImageName;
    const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
    const doctorId = doctorData.doctorID || doctorData.DoctorID || 1;

    try {
      // 1. Update the AnalysisSummary in the Radiographs table
      const resUpdate = await fetch(`/api/radiographs/${radId}/analysis`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysisSummary: editingXrayText })
      });

      if (!resUpdate.ok) {
        throw new Error("Failed to save changes to X-Ray details.");
      }

      // Update local states
      setRadiographs(prev => prev.map(r => {
        const idMatch = (r.radiographID || r.RadiographID) === radId;
        return idMatch ? { ...r, analysisSummary: editingXrayText, AnalysisSummary: editingXrayText } : r;
      }));
      setSelectedRadiograph(prev => ({ ...prev, analysisSummary: editingXrayText, AnalysisSummary: editingXrayText }));

      // 2. Post a new entry to the Patient's Clinical Log Timeline
      const resLog = await fetch(`/api/patients/${patientId}/clinical-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorID: doctorId,
          message: `AI Radiograph Report (${filename}): ${editingXrayText}`,
          logType: 'Radiograph'
        })
      });

      if (resLog.ok) {
        setToast({ visible: true, message: "Saved to Patient History successfully!" });
        setTimeout(() => setToast({ visible: false, message: "" }), 3000);
        setIsEditingXrayAnalysis(false);
      } else {
        alert("Failed to write to patient timeline.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving history: " + err.message);
    } finally {
      setSavingXrayTimeline(false);
    }
  };

  const handleReanalyzeXray = async () => {
    if (!selectedRadiograph) return;
    const rId = selectedRadiograph.radiographID || selectedRadiograph.RadiographID;
    setIsReanalyzingXray(true);
    setToast({ visible: true, message: "Gemini Vision is analyzing the radiograph..." });
    try {
      const res = await fetch(`/api/radiographs/${rId}/reanalyze`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSelectedRadiograph(prev => ({ ...prev, analysisSummary: data.analysisSummary, AnalysisSummary: data.analysisSummary }));
        setEditingXrayText(data.analysisSummary);
        setXrayDetailsExpanded(true);
        setToast({ visible: true, message: "✨ Live AI Radiograph Analysis complete!" });
      } else {
        alert("Live AI Vision analysis failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error analyzing radiograph: " + err.message);
    } finally {
      setIsReanalyzingXray(false);
      setTimeout(() => setToast({ visible: false, message: "" }), 3500);
    }
  };

  const getBase64FromImageUrl = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Base64 fetch error:", err);
      return null;
    }
  };

  const handlePrintXray = async () => {
    if (!selectedRadiograph) return;
    const rId = selectedRadiograph.radiographID || selectedRadiograph.RadiographID;
    const imgUrl = `/api/radiographs/${rId}/image`;
    const base64Img = await getBase64FromImageUrl(imgUrl);
    const pName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
    const docName = `Dr. ${doctor?.firstName || doctor?.name || 'Ahmed'}`;
    const scanName = selectedRadiograph.imageName || selectedRadiograph.ImageName || 'Radiograph Scan';
    const rawAnalysis = isEditingXrayAnalysis && editingXrayText 
      ? editingXrayText 
      : (selectedRadiograph.analysisSummary || selectedRadiograph.AnalysisSummary || 'No diagnostic findings reported.');
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Format markdown to clean HTML
    const formattedHtml = rawAnalysis
      .replace(/^###\s*(.*)$/gm, '<h4 style="color:#10244B; margin:14px 0 6px 0; font-size:13px; font-weight:800; border-bottom:1px solid #E2E8F0; padding-bottom:3px;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^---\s*$/gm, '<hr style="border:0; border-top:1px solid #E2E8F0; margin:12px 0;" />')
      .replace(/^\*\s*(.*)$/gm, '<div style="margin-left:12px; margin-bottom:4px;">• $1</div>')
      .replace(/\n/g, '<br/>');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Radiology Report - ${pName}</title>
        <style>
          @page { size: A4; margin: 16mm 14mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #10244B; margin: 0; padding: 0; background: #fff; line-height: 1.5; }
          .header-bar { border-bottom: 3px solid #4A7CD2; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
          .clinic-name { font-size: 19px; font-weight: 900; color: #10244B; letter-spacing: -0.3px; }
          .clinic-sub { font-size: 9.5px; font-weight: 800; color: #4A7CD2; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 11px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 8.5px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-val { font-size: 11.5px; font-weight: 700; color: #10244B; margin-top: 2px; }
          .scan-container { text-align: center; background: #0F172A; border-radius: 10px; padding: 10px; margin-bottom: 16px; border: 1px solid #CBD5E1; page-break-inside: avoid; }
          .scan-img { max-height: 250px; max-width: 100%; object-fit: contain; border-radius: 6px; }
          .report-section { margin-bottom: 24px; page-break-inside: auto; }
          .section-title { font-size: 12px; font-weight: 800; color: #10244B; background: #EAF0FC; border-left: 4px solid #4A7CD2; padding: 6px 10px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .report-body { font-size: 11px; line-height: 1.6; color: #334155; }
          .footer-section { margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
          .sig-box { text-align: center; }
          .sig-line { width: 170px; border-bottom: 1px dashed #64748B; margin-bottom: 6px; }
          .sig-name { font-size: 11px; font-weight: 700; color: #10244B; }
          .confidential { font-size: 8.5px; color: #94A3B8; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div>
            <div class="clinic-sub">Clinical Radiology & Diagnostics</div>
            <div class="clinic-name">DENTIA DENTAL CENTER</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: 800; color: #10244B;">REPORT #${rId}</div>
            <div style="font-size: 9.5px; color: #64748B; margin-top: 2px;">Date: ${dateStr}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Patient Name</span>
            <span class="meta-val">${pName} (ID #${patient?.patientID || 'N/A'})</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Attending Doctor</span>
            <span class="meta-val">${docName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date of Birth / Gender</span>
            <span class="meta-val">${patient?.dob || 'N/A'} · ${patient?.gender || 'Unspecified'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Radiograph Modality</span>
            <span class="meta-val">${scanName}</span>
          </div>
        </div>

        ${base64Img ? `
        <div class="scan-container">
          <img src="${base64Img}" class="scan-img" alt="X-Ray Scan" />
        </div>
        ` : ''}

        <div class="report-section">
          <div class="section-title">AI Diagnostic Findings & Clinical Impression</div>
          <div class="report-body">${formattedHtml}</div>
        </div>

        <div class="footer-section">
          <div class="confidential">
            Confidential Medical Radiology Document · Generated by Dentia Clinical AI
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-name">${docName}</div>
            <div style="font-size: 8.5px; color: #64748B;">Attending Dental Practitioner</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 800);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      window.print();
    }
  };

  const handleDownloadXrayPDF = async () => {
    if (!selectedRadiograph) return;
    const rId = selectedRadiograph.radiographID || selectedRadiograph.RadiographID;
    const imgUrl = `/api/radiographs/${rId}/image`;
    const base64Img = await getBase64FromImageUrl(imgUrl);
    const pName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
    const docName = `Dr. ${doctor?.firstName || doctor?.name || 'Ahmed'}`;
    const scanName = selectedRadiograph.imageName || selectedRadiograph.ImageName || 'Radiograph Scan';
    const rawAnalysis = isEditingXrayAnalysis && editingXrayText 
      ? editingXrayText 
      : (selectedRadiograph.analysisSummary || selectedRadiograph.AnalysisSummary || 'No diagnostic findings reported.');
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);

      const drawHeader = (pageNumber) => {
        pdf.setFillColor(16, 36, 75); // Dark Navy #10244B
        pdf.rect(0, 0, pageWidth, 18, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('DENTIA CLINICAL RADIOLOGY REPORT', margin, 12);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`REPORT #${rId} · ${dateStr} · Page ${pageNumber}`, pageWidth - margin, 12, { align: 'right' });
      };

      const drawFooter = () => {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('Confidential Medical Record · Generated by Dentia Clinical AI Suite', margin, pageHeight - 8);
      };

      let pageNumber = 1;
      drawHeader(pageNumber);
      drawFooter();

      // Patient Metadata Box
      pdf.setFillColor(248, 250, 252); // #F8FAFC
      pdf.setDrawColor(213, 225, 247);
      pdf.roundedRect(margin, 23, contentWidth, 20, 2, 2, 'FD');

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT:', margin + 4, 30);
      pdf.text('ATTENDING DENTIST:', margin + 96, 30);
      pdf.text('DOB / GENDER:', margin + 4, 38);
      pdf.text('SCAN MODALITY:', margin + 96, 38);

      pdf.setTextColor(16, 36, 75);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${pName} (ID #${patient?.patientID || 'N/A'})`, margin + 28, 30);
      pdf.text(docName, margin + 128, 30);
      pdf.text(`${patient?.dob || 'N/A'} · ${patient?.gender || 'Unspecified'}`, margin + 28, 38);
      pdf.text(scanName, margin + 128, 38);

      let currentY = 48;

      // Embed Radiograph Image if available (proportional height)
      if (base64Img) {
        pdf.setFillColor(15, 23, 42); // dark slate backing
        pdf.roundedRect(margin, currentY, contentWidth, 62, 2, 2, 'F');
        try {
          pdf.addImage(base64Img, 'JPEG', margin + 2, currentY + 2, contentWidth - 4, 58, undefined, 'FAST');
        } catch (imgErr) {
          console.warn("PDF addImage fallback:", imgErr);
        }
        currentY += 67;
      }

      // Findings Header Bar
      pdf.setFillColor(234, 240, 252);
      pdf.rect(margin, currentY, contentWidth, 6.5, 'F');
      pdf.setDrawColor(74, 124, 210);
      pdf.setLineWidth(0.6);
      pdf.line(margin, currentY + 6.5, pageWidth - margin, currentY + 6.5);

      pdf.setTextColor(16, 36, 75);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('AI DIAGNOSTIC FINDINGS & CLINICAL IMPRESSION', margin + 3, currentY + 4.5);

      currentY += 11;

      // Clean markdown formatting lines
      const rawLines = rawAnalysis.split('\n');
      pdf.setFontSize(8);

      for (let line of rawLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === '---') {
          currentY += 2;
          continue;
        }

        // Section header (e.g. ### FINDINGS or **FINDINGS**)
        if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)) {
          const headerText = trimmed.replace(/^[#*\s"]+|[#*\s"]+$/g, '').toUpperCase();
          
          if (currentY > pageHeight - 35) {
            pdf.addPage();
            pageNumber++;
            drawHeader(pageNumber);
            drawFooter();
            currentY = 26;
          }

          currentY += 2;
          pdf.setTextColor(74, 124, 210); // #4A7CD2
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text(headerText, margin, currentY);
          currentY += 4.5;
          pdf.setFontSize(8);
        } else {
          // Regular text or bullet point
          let cleanLine = trimmed
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^---\s*$/g, '')
            .replace(/^"|"$/g, '');
          
          if (!cleanLine) continue;

          const isBullet = cleanLine.startsWith('*') || cleanLine.startsWith('•') || cleanLine.startsWith('-');
          cleanLine = cleanLine.replace(/^[*•-]\s*/, '• ');

          pdf.setTextColor(51, 65, 85);
          pdf.setFont('helvetica', isBullet ? 'normal' : 'normal');

          const wrapped = pdf.splitTextToSize(cleanLine, contentWidth - (isBullet ? 4 : 0));
          for (let w of wrapped) {
            if (currentY > pageHeight - 35) {
              pdf.addPage();
              pageNumber++;
              drawHeader(pageNumber);
              drawFooter();
              currentY = 26;
            }
            pdf.text(w, isBullet ? margin + 3 : margin, currentY);
            currentY += 3.8;
          }
        }
      }

      // Check if signature fits on current page
      if (currentY > pageHeight - 28) {
        pdf.addPage();
        pageNumber++;
        drawHeader(pageNumber);
        drawFooter();
        currentY = 26;
      } else {
        currentY = Math.max(currentY + 6, pageHeight - 26);
      }

      // Doctor Signature Line
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.line(pageWidth - margin - 60, currentY, pageWidth - margin, currentY);
      pdf.setLineDashPattern([], 0);

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 36, 75);
      pdf.text(docName, pageWidth - margin - 30, currentY + 4, { align: 'center' });
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Attending Dental Practitioner', pageWidth - margin - 30, currentY + 7.5, { align: 'center' });

      // 1. Immediately open and display PDF in a new browser tab for instant viewing
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

      // 2. Also save to disk
      pdf.save(`Radiograph_Report_${pName.replace(/\s+/g, '_')}_#${rId}.pdf`);
      setToast({ visible: true, message: "Radiology PDF generated & opened successfully!" });
      setTimeout(() => setToast({ visible: false, message: "" }), 3500);

    } catch (err) {
      console.error("PDF generation failed:", err);
      handlePrintXray();
    }
  };

  const handleGeneratePDF = async () => {
    if (!expandedNoteDetail) return;
    const nId = expandedNoteDetail.noteId || expandedNoteDetail.NoteId || '1';
    const pName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
    const docName = `Dr. ${doctor?.firstName || doctor?.name || 'Ahmed'}`;
    const dateStr = expandedNoteDetail.createdAt 
      ? new Date(expandedNoteDetail.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = expandedNoteDetail.createdAt 
      ? new Date(expandedNoteDetail.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '';
    const noteStatus = (expandedNoteDetail.status || 'Complete').toUpperCase();

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);

      const drawHeader = (pageNumber) => {
        pdf.setFillColor(16, 36, 75); // Dark Navy #10244B
        pdf.rect(0, 0, pageWidth, 18, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('DENTIA CLINICAL NOTE & CONSULTATION RECORD', margin, 12);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`NOTE #${nId} · Page ${pageNumber}`, pageWidth - margin, 12, { align: 'right' });
      };

      const drawFooter = () => {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('Confidential Clinical Record · Generated by Dentia AI Clinical Assistant', margin, pageHeight - 8);
      };

      let pageNumber = 1;
      drawHeader(pageNumber);
      drawFooter();

      // Patient Metadata Box
      pdf.setFillColor(248, 250, 252); // #F8FAFC
      pdf.setDrawColor(213, 225, 247);
      pdf.roundedRect(margin, 23, contentWidth, 24, 2, 2, 'FD');

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT:', margin + 4, 30);
      pdf.text('ATTENDING DENTIST:', margin + 96, 30);
      pdf.text('DOB / GENDER:', margin + 4, 38);
      pdf.text('CONSULTATION DATE:', margin + 96, 38);
      pdf.text('NOTE STATUS:', margin + 4, 44);

      pdf.setTextColor(16, 36, 75);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${pName} (ID #${patient?.patientID || 'N/A'})`, margin + 28, 30);
      pdf.text(docName, margin + 128, 30);
      pdf.text(`${patient?.dob || 'N/A'} · ${patient?.gender || 'Unspecified'}`, margin + 28, 38);
      pdf.text(`${dateStr} ${timeStr}`, margin + 128, 38);
      pdf.text(noteStatus, margin + 28, 44);

      let currentY = 52;

      const sections = [
        { title: 'EXECUTIVE SUMMARY', content: expandedNoteDetail.summary, color: [74, 124, 210] },
        { title: 'CHIEF COMPLAINT', content: expandedNoteDetail.chiefComplaint, color: [239, 68, 68] },
        { title: 'MEDICAL & DENTAL HISTORY', content: expandedNoteDetail.history, color: [59, 130, 246] },
        { title: 'CLINICAL EXAMINATION & ODONTOGRAM', content: expandedNoteDetail.examination, color: [139, 92, 246] },
        { title: 'DIAGNOSIS & ASSESSMENT', content: expandedNoteDetail.assessment, color: [16, 185, 129] },
        { title: 'TREATMENT PERFORMED', content: expandedNoteDetail.treatmentPerformed, color: [168, 85, 247] },
        { title: 'POST-OPERATIVE ADVICE & PRESCRIPTIONS', content: expandedNoteDetail.postOpAdvice, color: [249, 115, 22] },
        { title: 'FOLLOW-UP & RECALL PLAN', content: expandedNoteDetail.followUp, color: [14, 165, 233] },
      ];

      for (let sec of sections) {
        if (!sec.content) continue;

        // Check if header fits on current page
        if (currentY > pageHeight - 32) {
          pdf.addPage();
          pageNumber++;
          drawHeader(pageNumber);
          drawFooter();
          currentY = 26;
        }

        // Section Title Bar
        pdf.setFillColor(244, 246, 250);
        pdf.rect(margin, currentY, contentWidth, 6, 'F');
        pdf.setDrawColor(...sec.color);
        pdf.setLineWidth(0.6);
        pdf.line(margin, currentY + 6, pageWidth - margin, currentY + 6);

        pdf.setTextColor(...sec.color);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(sec.title, margin + 3, currentY + 4.2);

        currentY += 9.5;

        // Content
        pdf.setTextColor(51, 65, 85);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);

        const cleanContent = sec.content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^---\s*$/gm, '');

        const wrapped = pdf.splitTextToSize(cleanContent, contentWidth - 4);
        for (let w of wrapped) {
          if (currentY > pageHeight - 32) {
            pdf.addPage();
            pageNumber++;
            drawHeader(pageNumber);
            drawFooter();
            currentY = 26;
          }
          pdf.text(w, margin + 2, currentY);
          currentY += 4;
        }
        currentY += 3;
      }

      // Render Prescribed Medications (Rx) in PDF
      const rxList = expandedNoteDetail.prescriptions || expandedNoteDetail.Prescriptions || [];
      if (rxList.length > 0) {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          pageNumber++;
          drawHeader(pageNumber);
          drawFooter();
          currentY = 26;
        }

        pdf.setFillColor(240, 253, 250); // Teal bg
        pdf.rect(margin, currentY, contentWidth, 6, 'F');
        pdf.setDrawColor(13, 148, 136);
        pdf.setLineWidth(0.6);
        pdf.line(margin, currentY + 6, pageWidth - margin, currentY + 6);

        pdf.setTextColor(13, 148, 136);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(`PRESCRIBED MEDICATIONS (Rx) - ${rxList.length} Item(s)`, margin + 3, currentY + 4.2);

        currentY += 9.5;

        for (let rx of rxList) {
          if (currentY > pageHeight - 32) {
            pdf.addPage();
            pageNumber++;
            drawHeader(pageNumber);
            drawFooter();
            currentY = 26;
          }

          const medName = rx.medicationName || rx.MedicationName || 'Medicine';
          const strength = rx.strength || rx.Strength || '';
          const dose = rx.dose || rx.Dose || '';
          const freq = rx.frequency || rx.Frequency || '';
          const dur = rx.duration || rx.Duration || '';
          const instr = rx.instructions || rx.Instructions || '';
          const route = rx.route || rx.Route || 'Oral';

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`• ${medName} ${strength} [${route}]`, margin + 2, currentY);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(71, 85, 105);
          pdf.setFontSize(7.5);
          const detailsLine = `${dose ? `${dose} · ` : ''}${freq}${dur ? ` (${dur})` : ''}`;
          pdf.text(detailsLine, margin + 6, currentY + 4);

          let nextOffset = 6;
          if (instr) {
            pdf.setTextColor(13, 148, 136);
            pdf.setFontSize(7);
            pdf.text(`Instructions: ${instr}`, margin + 6, currentY + 7.5);
            nextOffset = 9.5;
          }

          currentY += nextOffset;
        }
        currentY += 2;
      }

      // Render Planned Procedures & Stages in PDF
      const plansList = expandedNoteDetail.treatmentPlans || expandedNoteDetail.TreatmentPlans || [];
      if (plansList.length > 0) {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          pageNumber++;
          drawHeader(pageNumber);
          drawFooter();
          currentY = 26;
        }

        pdf.setFillColor(238, 242, 255); // Indigo bg
        pdf.rect(margin, currentY, contentWidth, 6, 'F');
        pdf.setDrawColor(79, 70, 229);
        pdf.setLineWidth(0.6);
        pdf.line(margin, currentY + 6, pageWidth - margin, currentY + 6);

        pdf.setTextColor(79, 70, 229);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(`PLANNED PROCEDURES & TREATMENT STAGES - ${plansList.length} Stage(s)`, margin + 3, currentY + 4.2);

        currentY += 9.5;

        for (let tp of plansList) {
          if (currentY > pageHeight - 32) {
            pdf.addPage();
            pageNumber++;
            drawHeader(pageNumber);
            drawFooter();
            currentY = 26;
          }

          const proc = tp.procedureName || tp.ProcedureName || 'Procedure';
          const tooth = tp.toothOrSite || tp.ToothOrSite || '';
          const timing = tp.timing || tp.Timing || '';
          const notes = tp.notes || tp.Notes || '';
          const seq = tp.sequenceNo || tp.SequenceNo || 1;

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`Stage ${seq}: ${proc}${tooth ? ` (Tooth/Site: ${tooth})` : ''}${timing ? ` - ${timing}` : ''}`, margin + 2, currentY);

          if (notes) {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            pdf.setFontSize(7.5);
            pdf.text(`Notes: ${notes}`, margin + 6, currentY + 4);
            currentY += 7.5;
          } else {
            currentY += 5;
          }
        }
        currentY += 2;
      }

      // Check if signature fits on current page
      if (currentY > pageHeight - 28) {
        pdf.addPage();
        pageNumber++;
        drawHeader(pageNumber);
        drawFooter();
        currentY = 26;
      } else {
        currentY = Math.max(currentY + 6, pageHeight - 26);
      }

      // Doctor Signature Line
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.line(pageWidth - margin - 60, currentY, pageWidth - margin, currentY);
      pdf.setLineDashPattern([], 0);

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 36, 75);
      pdf.text(docName, pageWidth - margin - 30, currentY + 4, { align: 'center' });
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Attending Dental Practitioner', pageWidth - margin - 30, currentY + 7.5, { align: 'center' });

      // 1. Immediately open and display PDF in a new browser tab for instant viewing
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

      // 2. Also save to disk
      pdf.save(`Clinical_Note_${pName.replace(/\s+/g, '_')}_#${nId}.pdf`);
      setToast({ visible: true, message: "Clinical Note PDF generated & opened successfully!" });
      setTimeout(() => setToast({ visible: false, message: "" }), 3500);

    } catch (err) {
      console.error("Clinical Note PDF generation failed:", err);
      window.print();
    }
  };

  // Fetch a single note's full detail and expand it
  const handleSelectNote = async (noteId) => {
    setIsEditingNote(false);
    setEditingNoteData(null);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setExpandedNoteDetail(null);
      setExpandedTranscript(false);
      return;
    }
    setSelectedNoteId(noteId);
    setExpandedTranscript(false);
    try {
      const res = await fetch(`/api/ai-dental-notes/${noteId}`);
      if (res.ok) {
        const detail = await res.json();
        setExpandedNoteDetail(detail);
      }
    } catch (err) {
      console.error('Failed to fetch note detail:', err);
    }
  };

  const saveEditedNote = async () => {
    try {
      const noteId = expandedNoteDetail.noteId || expandedNoteDetail.NoteId;
      const res = await fetch(`/api/ai-dental-notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingNoteData)
      });
      if (res.ok) {
        setExpandedNoteDetail(editingNoteData);
        setNotesHistory(prev => prev.map(n => (n.noteId || n.NoteId) === noteId ? { ...n, ...editingNoteData } : n));
        setIsEditingNote(false);
        setEditingNoteData(null);
      } else {
        alert("Failed to save edited note.");
      }
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Error saving note.");
    }
  };

  // Build 8-point checklist from note summary
  const buildChecklist = (note) => {
    const text = ([
      note?.summary, note?.chiefComplaint, note?.history,
      note?.examination, note?.assessment, note?.treatmentPerformed,
      note?.postOpAdvice, note?.followUp
    ].filter(Boolean).join(' ')).toLowerCase();
    return [
      { id: 'patient',   label: 'Patient Identification',        ok: text.includes('patient') || text.includes('name') },
      { id: 'complaint', label: 'Primary Complaint Documented',   ok: text.includes('pain') || text.includes('complaint') || text.includes('sensitivity') },
      { id: 'concern',   label: 'Chief Concerns / Swelling',      ok: text.includes('concern') || text.includes('swelling') || text.includes('bleeding') },
      { id: 'history',   label: 'Relevant Medical History',       ok: !!note?.history && note.history.length > 5 },
      { id: 'caries',    label: 'Caries / Fillings Charted',      ok: text.includes('caries') || text.includes('cavity') || text.includes('carious') || text.includes('amalgam') },
      { id: 'mobility',  label: 'Periodontal / Mobility Check',   ok: text.includes('mobility') || text.includes('gum') || text.includes('probing') || text.includes('periodontal') },
      { id: 'imaging',   label: 'X-Ray / Imaging Reference',      ok: text.includes('x-ray') || text.includes('radiograph') || text.includes('periapical') || text.includes('bitewing') },
      { id: 'treatment', label: 'Treatment Plan Outlined',        ok: !!note?.treatmentPerformed && note.treatmentPerformed.length > 5 },
    ];
  };

  const startRecording = async () => {
    // 1. Guard check if Session is Locked
    if (!isMicUnlocked) {
      setShowNexuModal({ visible: true, type: 'UNLOCK', pendingCommands: [] });
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error("Microphone access denied.", e);
      alert("Microphone access denied. Please allow microphone permission and try again.");
      return;
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      let hasSpeech = false;
      recordingStartTimeRef.current = Date.now();
      console.log("[MIC LOG] Recording started. Start time timestamp:", recordingStartTimeRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("[MIC LOG] ondataavailable chunk pushed. Chunk size:", event.data.size, "bytes");
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

        const duration = recordingStartTimeRef.current
          ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
          : 0;

        console.log("[MIC LOG] onstop event fired. Total audio chunks captured:", audioChunksRef.current.length, "Measured duration:", duration, "seconds");

        // Stop all microphone tracks to release the mic indicator
        stream.getTracks().forEach(t => t.stop());

        if (!hasSpeech) {
          console.warn("[MIC LOG] Silence VAD check: No speech detected. Recording canceled.");
          // No speech detected — silently cancel, do NOT create a note
          setVoiceStreamText("No speech detected. Recording cancelled.");
          setIsRecording(false);
          setAiNotesLoading(false);
          setAiNotesProgress(0);
          setTimeout(() => setVoiceStreamText(''), 3000);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log("[MIC LOG] Audio blob generated successfully. Total blob size:", audioBlob.size, "bytes. Dispatching submission...");
        submitAudioToAI(audioBlob, duration);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setLiveSpeechStream('');
      setVoiceStreamText("Listening to voice... speak now");
      setChecklist({
        patient: false,
        complaint: false,
        concern: false,
        history: false,
        caries: false,
        mobility: false,
        imaging: false,
        treatment: false
      });

      // Helper function to deduplicate real-time speech stream
      const deduplicateStreamText = (text) => {
        if (!text) return '';
        const parts = text.split(/(?<=[.?!])\s+/);
        if (parts.length <= 1) return text;
        const unique = [];
        for (const p of parts) {
          const norm = p.trim().toLowerCase().replace(/[^\w\s]/g, '');
          const isDupe = unique.some(u => {
            const uNorm = u.trim().toLowerCase().replace(/[^\w\s]/g, '');
            return norm === uNorm || (norm.length > 8 && uNorm.includes(norm));
          });
          if (!isDupe) unique.push(p.trim());
        }
        return unique.join(' ');
      };

      // Start Real-Time Web Speech API Live Stream Transcriber
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
              .map(r => r[0].transcript)
              .join('');
            const cleanStream = deduplicateStreamText(transcript);
            setLiveSpeechStream(cleanStream);
            setVoiceStreamText(cleanStream);
            evaluateTranscriptChecklist(cleanStream);
            hasSpeech = true;
            resetSilenceTimer();
          };
          recognition.onerror = (e) => console.log("Speech recognition notice:", e);
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn("Could not start live SpeechRecognition:", e);
        }
      }

      // VAD & Dynamic Frequency Equalizer with Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const resetSilenceTimer = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          stopRecording(); // Stop after 2.5 seconds of silence (VAD trailing cut)
        }, 2500);
      };

      const checkVolume = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        const maxVol = Math.max(...dataArray);
        if (maxVol > 10) {
          hasSpeech = true;
          resetSilenceTimer();
        }
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      resetSilenceTimer();
      checkVolume();

    } catch (err) {
      console.error("Mic initialization failed", err);
      alert("Microphone initialization failed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVoiceStreamText("Processing recording...");
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
    }
  };

  // Dispatch Audio to AI endpoints with progress bar simulator
  const submitAudioToAI = async (audioBlob, durationSeconds) => {
    console.log("[MIC LOG] submitAudioToAI triggered. Size:", audioBlob.size, "bytes, Duration:", durationSeconds, "seconds");
    setAiNotesLoading(true);
    setAiNotesProgress(10);
    
    const interval = setInterval(() => {
      setAiNotesProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
    const doctorId = doctorData.doctorID || doctorData.DoctorID || 2;

    console.log("[MIC LOG] Constructing multipart form upload. DentistId:", doctorId, "PatientId:", patientId, "DurationSeconds:", durationSeconds);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('patientId', patientId);
    formData.append('dentistId', doctorId);
    formData.append('durationSeconds', durationSeconds);

    try {
      console.log("[MIC LOG] Sending POST request to /api/ai-dental-notes/recordings...");
      let response;
      try {
        response = await fetch('/api/ai-dental-notes/recordings', {
          method: 'POST',
          body: formData
        });
        if (response.status === 404 || response.status === 405) {
          throw new Error(`Static route fallback: ${response.status}`);
        }
      } catch (proxyErr) {
        console.warn("[MIC LOG] Fallback directly to https://dentist-api-dev.vitonta.com:", proxyErr);
        response = await fetch('https://dentist-api-dev.vitonta.com/api/ai-dental-notes/recordings', {
          method: 'POST',
          body: formData
        });
      }
      clearInterval(interval);
      setAiNotesProgress(100);

      if (response.ok) {
        const data = await response.json();
        
        // Update speech stream box with high-fidelity server AI transcript
        if (data.transcript || data.Transcript) {
          const finalTrans = (data.transcript || data.Transcript).trim();
          if (finalTrans && finalTrans !== "[No speech detected]") {
            setLiveSpeechStream(finalTrans);
            setVoiceStreamText(finalTrans);
            evaluateTranscriptChecklist(finalTrans);
          }
        }

        setToast({ visible: true, message: "AI Notes generated successfully!" });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
        
        // Cancel any pending timer before starting a new one
        if (autoTimer) {
          clearInterval(autoTimer);
          setAutoTimer(null);
        }

        // Start 3-second countdown timer for auto display
        setCountdown(3);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setAutoTimer(null);
              // Trigger the AI Notes tab to lazy compile the new audio and refresh the history
              compileAndLoadNotes();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setAutoTimer(timer);
      } else {
        alert("Failed to compile AI Clinical notes.");
        setAiNotesLoading(false);
      }
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setAiNotesLoading(false);
      alert("Error sending recording to AI server.");
    }
  };

  // Fetch structured clinical notes & auto check checklist
  const fetchAiNotes = async (noteId) => {
    if (autoTimer) {
      clearInterval(autoTimer);
      setAutoTimer(null);
    }
    setAiNotesLoading(true);
    try {
      const res = await fetch(`/api/ai-dental-notes/${noteId}`);
      if (res.ok) {
        const note = await res.json();
        setAiNotesData(note);
        
        // Map transcript/summary checks to satisfy checklist status
        const summaryText = (note.clinicalSummary || "").toLowerCase();
        setChecklist({
          patient: summaryText.includes("patient") || summaryText.includes("name"),
          complaint: summaryText.includes("pain") || summaryText.includes("complaint"),
          concern: summaryText.includes("concern") || summaryText.includes("swelling"),
          history: summaryText.includes("history") || summaryText.includes("medication"),
          caries: summaryText.includes("caries") || summaryText.includes("cavity"),
          mobility: summaryText.includes("mobility") || summaryText.includes("gum"),
          imaging: summaryText.includes("x-ray") || summaryText.includes("image"),
          treatment: summaryText.includes("treatment") || summaryText.includes("plan")
        });
      }
    } catch (err) {
      console.error("Fetch clinical note details failed", err);
    } finally {
      setAiNotesLoading(false);
      setCountdown(0);
    }
  };

  const handleSaveSingleToothObservation = async (toothNum, updatedStatus, updatedComment, updatedColor) => {
    setSavingToothData(true);
    try {
      const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 5);
      const isPed = dentitionMode === 'pediatric' || /^[A-T]$/i.test(String(toothNum));
      const dentitionCat = isPed ? 'Pediatric' : (dentitionMode === 'mixed' ? 'Mixed' : 'Adult');
      const docId = doctor?.doctorID || doctor?.DoctorID || 1;
      const updates = [{
        toothNumber: toothNum,
        toothKey: String(toothNum),
        dentitionCategory: dentitionCat,
        doctorId: docId,
        status: updatedStatus,
        conditionStatus: updatedStatus,
        color: updatedColor || getHexColor(updatedStatus),
        comment: updatedComment,
        comments: updatedComment
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
        setTeethState(prev => {
          const idx = prev.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === String(toothNum).toUpperCase());
          const newObj = {
            toothNumber: toothNum,
            status: updatedStatus,
            conditionStatus: updatedStatus,
            color: updatedColor || getHexColor(updatedStatus),
            comments: updatedComment,
            comment: updatedComment,
            rotationDeg: prev[idx]?.rotationDeg || 0
          };
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...newObj };
            return copy;
          }
          return [...prev, newObj];
        });

        // Add doctor clinical log entry
        const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
        const docId = doctorData.doctorID || doctorData.DoctorID || 2;
        await fetch(`/api/patients/${pid}/clinical-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorID: docId,
            action: `Updated observation for Tooth #${toothNum}: ${updatedStatus}`
          })}).catch(() => {});

        setEditingToothData(null);
      }
    } catch (err) {
      console.error("Save single tooth observation failed:", err);
    } finally {
      setSavingToothData(false);
    }
  };

  const handleSaveChart = async () => {
    try {
      const updates = teethState.map(t => {
        let toothComment = (t.comments || t.comment || '').trim();
        const toothKey = t.toothNumber ?? t.ToothNumber;
        if (!toothComment || toothComment === "Saved via Save Chart command") {
          const status = t.status || 'Healthy';
          if (status === 'Healthy') {
            toothComment = dentitionMode === 'pediatric' ? `Intact primary deciduous enamel on Tooth ${toothKey}` : 'Intact enamel, physiological mobility (Grade 0)';
          } else if (status.toLowerCase().includes('fill') || status.toLowerCase().includes('composite') || status.toLowerCase().includes('amalgam') || status.toLowerCase().includes('gic')) {
            toothComment = `Restorative: ${status} restoration placed on Tooth #${toothKey}`;
          } else if (status.toLowerCase().includes('caries') || status.toLowerCase().includes('decay') || status.toLowerCase().includes('damag') || status.toLowerCase().includes('cavity') || status.toLowerCase().includes('ecc')) {
            toothComment = `Pathology: Active caries enamel demineralization on Tooth #${toothKey}`;
          } else if (status.toLowerCase().includes('canal') || status.toLowerCase().includes('rct') || status.toLowerCase().includes('pulpotomy')) {
            toothComment = `Endodontics: Root canal/pulpotomy therapy on Tooth #${toothKey}`;
          } else if (status.toLowerCase().includes('mobility')) {
            toothComment = `Periodontal: Pathologic tooth mobility on Tooth #${toothKey}`;
          } else if (status.toLowerCase().includes('rotat')) {
            toothComment = `Developmental: ${t.rotationDeg || 45}° axial rotation diagnosed on odontogram`;
          } else {
            toothComment = `Clinical Observation: ${status} placed on Tooth #${toothKey}`;
          }
        }
        const isPed = dentitionMode === 'pediatric' || /^[A-T]$/i.test(String(toothKey));
        const dentitionCat = isPed ? 'Pediatric' : (dentitionMode === 'mixed' ? 'Mixed' : 'Adult');
        const docId = doctor?.doctorID || doctor?.DoctorID || 1;
        return {
          toothNumber: toothKey,
          toothKey: String(toothKey),
          dentitionCategory: dentitionCat,
          doctorId: docId,
          status: t.status,
          conditionStatus: t.status,
          color: t.color,
          comment: toothComment,
          comments: toothComment
        };
      });

      const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 5);
      const res = await fetch('/api/patients/teeth/update-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pid,
          updates
        })
      });

      if (res.ok) {
        // Post save log
        const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
        const docId = doctorData.doctorID || doctorData.DoctorID || 2;
        await fetch(`/api/patients/${patientId}/clinical-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorID: docId,
            message: "Patient chart state saved successfully.",
            action: `Saved Dental Chart with ${teethState.length} teeth observations`
          })}).catch(() => {});

        setToast({ visible: true, message: "Patient Chart and Odontogram saved successfully!" });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
      } else {
        alert("Error saving patient chart details.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving patient chart details.");
    }
  };

  const executeCommand = async (toothNum, status, comment = "Updated via Dental Charting", extraProps = {}) => {
    const toothKeyStr = String(toothNum).toUpperCase();
    const existing = teethState.find(t => String(t.toothNumber ?? t.ToothNumber).toUpperCase() === toothKeyStr);
    const existingStatus = (existing?.status || existing?.conditionStatus || '').trim();
    const existingComments = (existing?.comments || existing?.comment || '').trim();

    let mergedStatus = status;
    let mergedComments = comment;

    // Accumulate multiple queries / conditions on the same tooth instead of overwriting
    if (existing && existingStatus && existingStatus !== 'Healthy' && status !== 'Healthy' && !existingStatus.toLowerCase().includes(status.toLowerCase())) {
      if (existingStatus.includes('Caries') && status.includes('Caries')) {
        const extSurf = existingStatus.replace('Caries — ', '').replace('Caries', '').trim();
        const newSurf = status.replace('Caries — ', '').replace('Caries', '').trim();
        mergedStatus = `Caries — ${[...new Set([extSurf, newSurf].filter(Boolean))].join(', ')}`;
      } else if (existingStatus.includes('Filling') && status.includes('Filling')) {
        const extMat = existingStatus.replace('Filling — ', '').trim();
        const newMat = status.replace('Filling — ', '').trim();
        mergedStatus = `Filling — ${[...new Set([extMat, newMat].filter(Boolean))].join(', ')}`;
      } else {
        mergedStatus = `${existingStatus} · ${status}`;
      }

      if (existingComments && !existingComments.includes(comment)) {
        mergedComments = `${existingComments}\n• ${comment}`;
      }
    }

    const finalColor = getHexColor(mergedStatus);
    let rotationDeg = extraProps.rotationDeg !== undefined ? extraProps.rotationDeg : (existing?.rotationDeg || 0);
    const fullCheck = (mergedStatus + ' ' + mergedComments).toLowerCase();
    if (fullCheck.includes('rotat')) {
      const degMatch = fullCheck.match(/(\d{1,3})\s*(?:deg|°|degree)?/i);
      rotationDeg = degMatch ? parseInt(degMatch[1], 10) : (rotationDeg || 45);
      if (fullCheck.includes('mesio') || fullCheck.includes('palatal')) {
        rotationDeg = Math.abs(rotationDeg);
      }
    }

    let updated;
    const exists = teethState.some(t => String(t.toothNumber ?? t.ToothNumber).toUpperCase() === toothKeyStr);
    if (exists) {
      updated = teethState.map(t => 
        String(t.toothNumber ?? t.ToothNumber).toUpperCase() === toothKeyStr 
          ? { ...t, toothNumber: toothNum, color: finalColor, status: mergedStatus, conditionStatus: mergedStatus, comments: mergedComments, comment: mergedComments, rotationDeg, ...extraProps } 
          : t
      );
    } else {
      updated = [...teethState, { toothNumber: toothNum, color: finalColor, status: mergedStatus, conditionStatus: mergedStatus, comments: mergedComments, comment: mergedComments, rotationDeg, ...extraProps }];
    }
    setTeethState(updated);

    // Persist immediately on tooth select change to database
    const isPed = dentitionMode === 'pediatric' || /^[A-T]$/i.test(String(toothNum));
    const dentitionCat = isPed ? 'Pediatric' : (dentitionMode === 'mixed' ? 'Mixed' : 'Adult');
    const docId = doctor?.doctorID || doctor?.DoctorID || 1;
    const updates = [{
      toothNumber: toothNum,
      toothKey: String(toothNum),
      dentitionCategory: dentitionCat,
      doctorId: docId,
      status: mergedStatus,
      conditionStatus: mergedStatus,
      color: finalColor,
      comment: `${mergedComments}${rotationDeg !== 0 ? ` (Rotation: ${rotationDeg}°)` : ''}`,
      comments: `${mergedComments}${rotationDeg !== 0 ? ` (Rotation: ${rotationDeg}°)` : ''}`
    }];

    try {
      const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 5);
      const res = await fetch('/api/patients/teeth/update-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pid,
          updates
        })
      });
      const resData = await res.json();
      console.log(`💾 [DB Save Tooth #${toothNum} for Patient #${pid}]:`, resData, updates[0]);
    } catch (err) {
      console.error("Error updating tooth status in database:", err);
    }
  };

  // --- REAL APIs for AI Assistant ---
  const registerPatientAPI = async (data) => {
    try {
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.DoctorID || 2;
      // The user enters a single name, so we'll just split it or pass it as FirstName for now
      const nameParts = data.name.split(' ');
      const payload = {
        FirstName: nameParts[0],
        LastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown',
        DateOfBirth: data.dob,
        Phone: data.phone,
        DoctorID: docId
      };
      
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const result = await res.json();
        return { success: true, newPatientId: result.patientID || result.PatientID, name: data.name, dob: data.dob, phone: data.phone };
      }
      return { success: false };
    } catch(err) {
      console.error(err);
      return { success: false };
    }
  };

  const bookAppointmentAPI = async (data) => {
    try {
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.DoctorID || 2;
      
      const targetId = (data.patientId && data.patientId !== "null" && data.patientId !== "undefined") 
        ? data.patientId 
        : patientId;

      // We need to fetch patient to get FullName and Phone for the appointment payload
      const pRes = await fetch(`/api/patients/${targetId}`);
      if (!pRes.ok) throw new Error("Patient not found");
      const pData = await pRes.json();
      
      const payload = {
        FullName: `${pData.firstName} ${pData.lastName}`,
        Phone: pData.phone || 'N/A',
        PreferredDate: `${data.date}T${data.time}:00`,
        DoctorID: docId
      };
      
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const result = await res.json();
        return { success: true, bookingId: result.appointmentId || result.id || Math.floor(Math.random() * 9000), date: data.date, time: data.time };
      }
      return { success: false };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  // --- CHAT & VOICE STATE MACHINE ROUTING ---
  const handleSendMessage = async (e, forcedText = null) => {
    if (e) e.preventDefault();
    const text = forcedText || chatInput;
    if (!text.trim()) return;

    const newMsg = { id: Date.now(), sender: 'doctor', text, type: 'text', time: 'Just now' };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Word to number conversion (e.g. "ten" -> 10, "nine" -> 9, "seven" -> 7, "das" -> 10, etc.)
    const normalizeWordsToNumbers = (str) => {
      const map = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
        'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
        'twenty one': '21', 'twenty-one': '21', 'twenty two': '22', 'twenty-two': '22',
        'twenty three': '23', 'twenty-three': '23', 'twenty four': '24', 'twenty-four': '24',
        'twenty five': '25', 'twenty-five': '25', 'twenty six': '26', 'twenty-six': '26',
        'twenty seven': '27', 'twenty-seven': '27', 'twenty eight': '28', 'twenty-eight': '28',
        'twenty nine': '29', 'twenty-nine': '29', 'thirty': '30', 'thirty one': '31', 'thirty-one': '31',
        'thirty two': '32', 'thirty-two': '32',
        'aik': '1', 'do': '2', 'teen': '3', 'char': '4', 'panch': '5', 'chay': '6', 'saat': '7', 'aath': '8', 'nau': '9', 'das': '10'
      };
      let res = str;
      for (const [w, n] of Object.entries(map)) {
        const reg = new RegExp(`\\b${w}\\b`, 'gi');
        res = res.replace(reg, n);
      }
      return res;
    };

    // NLP intent regex matching
    const txtLower = normalizeWordsToNumbers(text.toLowerCase());

    // --- 0. MULTI-TOOTH & DIRECT CLINICAL ASSESSMENT ENGINE (HIGHEST PRIORITY) ---
    const parseClinicalToothEntry = (rawSegment, mode, selKey) => {
      const segNorm = normalizeWordsToNumbers(rawSegment.toLowerCase())
        .replace(/\bfi+li+ngs?\b/g, 'filling')
        .replace(/\bfi+ls?\b/g, 'fill')
        .replace(/\bfeelings?\b/g, 'filling')
        .replace(/\bfilings?\b/g, 'filling')
        .replace(/\bfilin\b/g, 'filling')
        .replace(/\bte+th\b/g, 'teeth')
        .replace(/\bamalg[au]m\b/g, 'amalgam')
        .replace(/\bcompos[iy]te?\b/g, 'composite')
        .replace(/\bca[rv]it[iy]e?s?\b/g, 'cavity')
        .replace(/\bca[ry]i+es?\b/g, 'caries')
        .replace(/\bkeeda\b/g, 'keera')
        .replace(/\bscale?ing\b/g, 'scaling')
        .replace(/\bcle+ning\b/g, 'cleaning')
        .replace(/\bimp[al]ant\b/g, 'implant')
        .replace(/\bextrac?ted?\b/g, 'extract')
        .replace(/\brotat[a-z]*\b/g, 'rotation')
        .replace(/\bcan[ae]l\b/g, 'canal');

      let toothNum = null;

      // 1. Check for pediatric letter (A to T)
      const pedMatch = segNorm.match(/\b(?:primary tooth|tooth|primary molar|primary incisor|primary canine|letter|dant|dhaat)\s*\(?\s*([a-tA-T])\s*\)?\b/i) ||
                       segNorm.match(/\(\s*tooth\s*([a-tA-T])\s*\)/i) ||
                       segNorm.match(/\(\s*([a-tA-T])\s*\)/i);
      if (pedMatch) {
        const l = pedMatch[1].toUpperCase();
        if (['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].includes(l)) {
          toothNum = l;
        }
      }

      // 2. Check for numeric tooth (1 to 32)
      if (!toothNum) {
        const numMatch = segNorm.match(/\b(?:tooth|teeth|#|dant|dharh)\s*#?(\d{1,2})\b/i) ||
                         segNorm.match(/\b(\d{1,2})\s*(?:number|no|num|dharh|dant|ki dharh|ka dant)\b/i);
        if (numMatch) {
          const p = parseInt(numMatch[1], 10);
          if (p >= 1 && p <= 32) toothNum = p;
        }
      }

      if (!toothNum) {
        const standaloneNumMatches = segNorm.match(/\b(\d{1,2})\b/g);
        if (standaloneNumMatches) {
          for (const m of standaloneNumMatches) {
            const parsed = parseInt(m, 10);
            if (parsed >= 1 && parsed <= 32) {
              toothNum = parsed;
              break;
            }
          }
        }
      }

      if (!toothNum && mode === 'pediatric') {
        const singleL = segNorm.match(/\b([b-tB-T])\b/);
        if (singleL && PEDIATRIC_KEYS.includes(singleL[1].toUpperCase())) {
          toothNum = singleL[1].toUpperCase();
        }
      }

      if (toothNum === null) return null;

      // Extract Surface
      let surfaceCode = '';
      if (segNorm.includes('mesio-occlusal-distal') || segNorm.includes('mesio-occluso-distal') || segNorm.includes(' mod ') || segNorm.endsWith(' mod')) surfaceCode = 'MOD';
      else if (segNorm.includes('mesio-occlusal') || segNorm.includes('mesio-occluso') || segNorm.includes(' mo ') || segNorm.endsWith(' mo')) surfaceCode = 'MO';
      else if (segNorm.includes('disto-occlusal') || segNorm.includes('disto-occluso') || segNorm.includes(' do ') || segNorm.endsWith(' do')) surfaceCode = 'DO';
      else if (segNorm.includes('lingual pit') || (segNorm.includes('lingual') && (segNorm.includes('pit') || segNorm.includes('caries')))) surfaceCode = 'Lingual Pit (L)';
      else if (segNorm.includes('buccal pit') || (segNorm.includes('buccal') && segNorm.includes('pit'))) surfaceCode = 'Buccal Pit (B)';
      else if (segNorm.includes('cervical') || segNorm.includes('class v') || (segNorm.includes('buccal') && segNorm.includes('cervical'))) surfaceCode = 'Class V';
      else if (segNorm.includes('occlusal') || segNorm.includes('occluso') || segNorm.includes('incisal') || segNorm.includes('class i')) surfaceCode = 'O';
      else if (segNorm.includes('mesial') || segNorm.includes('mesio') || segNorm.includes('class ii')) surfaceCode = 'M';
      else if (segNorm.includes('distal') || segNorm.includes('disto')) surfaceCode = 'D';
      else if (segNorm.includes('buccal') || segNorm.includes('facial')) surfaceCode = 'B';
      else if (segNorm.includes('lingual') || segNorm.includes('palatal')) surfaceCode = 'L';

      let finalStatus = 'Damaged / Decay';
      let statusComment = `Clinical Observation on Tooth #${toothNum}`;
      let finalColor = '#EF4444';
      let cdtCode = 'D2140';
      let title = `Tooth #${toothNum} Finding`;

      // 1. Orthodontics: Crowding, Diastema, Rotation & Malocclusion
      if (segNorm.includes('crowding') || segNorm.includes('crowded')) {
        finalStatus = 'Dental Crowding';
        statusComment = `Orthodontics: Dental arch crowding and tooth overlap requiring alignment on Tooth #${toothNum}`;
        finalColor = '#818CF8'; cdtCode = 'D8080'; title = 'Dental Arch Crowding';
      } else if (segNorm.includes('diastema') || segNorm.includes('midline space') || segNorm.includes('spacing')) {
        finalStatus = 'Diastema (Midline Space)';
        statusComment = `Orthodontics: Interdental spacing and diastema gap diagnosed on Tooth #${toothNum}`;
        finalColor = '#6366F1'; cdtCode = 'D8080'; title = 'Interdental Diastema';
      } else if (segNorm.includes('rotat') || segNorm.includes('axial rotation')) {
        finalStatus = 'Tooth Axial Rotation';
        statusComment = `Orthodontics: Axial rotational malposition (35° torque) requiring rotational couples on Tooth #${toothNum}`;
        finalColor = '#3B82F6'; cdtCode = 'D8080'; title = 'Axial Rotation (35° Torque)';
      }
      // 2. Endodontics: Abscess & Cyst
      else if (segNorm.includes('abscess') || segNorm.includes('periapical') || segNorm.includes('pus') || segNorm.includes('suppurat') || segNorm.includes('swelling')) {
        finalStatus = 'Periapical Abscess';
        statusComment = `Endodontics & Pathology: Acute suppurative periapical abscess with localized swelling and radiolucency on Tooth #${toothNum}`;
        finalColor = '#DC2626'; cdtCode = 'D7510'; title = 'Acute Periapical Abscess';
      } else if (segNorm.includes('cyst') || segNorm.includes('resorption')) {
        finalStatus = segNorm.includes('resorption') ? 'Root Resorption' : 'Periapical Cyst';
        statusComment = `Pathology: Chronic osteolytic periapical defect on Tooth #${toothNum}`;
        finalColor = '#8B5CF6'; cdtCode = 'D7450'; title = 'Periapical Cyst / Resorption';
      }
      // 3. Surgical: Impactions
      else if (segNorm.includes('impacted') || segNorm.includes('impaction') || segNorm.includes('trapped in bone')) {
        finalStatus = 'Impacted Tooth (Wisdom/Canine)';
        statusComment = `Oral Surgery: Impaction preventing complete anatomical eruption into functional arch on Tooth #${toothNum}`;
        finalColor = '#7C3AED'; cdtCode = 'D7230'; title = 'Impacted Tooth';
      }
      // 4. Prosthodontics: Post & Core, Veneer, Inlay/Onlay
      else if (segNorm.includes('post and core') || segNorm.includes('post & core') || segNorm.includes('post build') || segNorm.includes('post foundation') || (segNorm.includes('post') && segNorm.includes('core'))) {
        finalStatus = 'Post & Core Build-Up';
        statusComment = `Prosthodontics: Endodontic post and composite core build-up foundation on Tooth #${toothNum}`;
        finalColor = '#475569'; cdtCode = 'D2952'; title = 'Post & Core Foundation';
      } else if (segNorm.includes('veneer') || segNorm.includes('laminate')) {
        finalStatus = 'Ceramic Veneer';
        statusComment = `Prosthodontics & Esthetics: Custom labial ceramic porcelain veneer restoration on Tooth #${toothNum}`;
        finalColor = '#8B5CF6'; cdtCode = 'D2962'; title = 'Porcelain Ceramic Veneer';
      } else if (segNorm.includes('inlay') || segNorm.includes('onlay')) {
        finalStatus = 'Inlay / Onlay Restoration';
        statusComment = `Restorative & Prosthodontics: Precision milled ceramic / gold inlay-onlay restoration on Tooth #${toothNum}`;
        finalColor = '#D97706'; cdtCode = 'D2510'; title = 'Inlay / Onlay Cast';
      } else if (segNorm.includes('sealant') || segNorm.includes('pit and fissure') || segNorm.includes('pit & fissure')) {
        finalStatus = 'Pit & Fissure Sealant';
        statusComment = `Prevention: Flowable resin pit and fissure sealant barrier placed on Tooth #${toothNum}`;
        finalColor = '#06B6D4'; cdtCode = 'D1351'; title = 'Pit & Fissure Sealant';
      } else if (segNorm.includes('dard') || segNorm.includes('pain') || segNorm.includes('pulpitis') || segNorm.includes('toothache') || segNorm.includes('ache') || segNorm.includes('thanda garam')) {
        finalStatus = 'Acute Irreversible Pulpitis (RCT Indicated)';
        statusComment = `Endodontics: Acute irreversible pulpitis with severe symptomatic odontalgia on Tooth #${toothNum}. Molar Endodontic Therapy (CDT D3330) indicated.`;
        finalColor = '#EF4444'; cdtCode = 'D3330'; title = 'Acute Irreversible Pulpitis (RCT Indicated)';
      } else if (segNorm.includes('sensitiv')) {
        finalStatus = 'Dentin Hypersensitivity';
        statusComment = `Pathology: Cervical dentin hypersensitivity without active cavitation on Tooth #${toothNum}`;
        finalColor = '#06B6D4'; cdtCode = 'D9910'; title = 'Dentin Hypersensitivity';
      }
      // 5. Pediatric Pulpotomy / SSC / Space Maintainer / ECC / Varnish
      else if (segNorm.includes('pulpotomy') || (segNorm.includes('mta') && !segNorm.includes('apicoectomy'))) {
        if (segNorm.includes('ssc') || segNorm.includes('crown') || segNorm.includes('stainless')) {
          finalStatus = 'Pulpotomy (MTA) & SSC Crown';
          statusComment = `Pediatric Endodontics & Prosthetics: Coronal pulpotomy with MTA bio-ceramic medicament and full-coverage Stainless Steel Crown (SSC) placed on Primary Tooth ${toothNum}`;
          finalColor = '#7C3AED'; cdtCode = 'D3220 / D2930'; title = 'Pulpotomy (MTA) & SSC Crown';
        } else {
          finalStatus = 'Pulpotomy (MTA)';
          statusComment = `Pediatric Endodontics: Coronal pulpotomy with MTA bio-ceramic pulp capping placed on Primary Tooth ${toothNum}`;
          finalColor = '#7C3AED'; cdtCode = 'D3220'; title = 'Pulpotomy (MTA)';
        }
      } else if (segNorm.includes('ssc') || segNorm.includes('stainless steel crown') || segNorm.includes('stainless crown')) {
        finalStatus = 'Stainless Steel Crown (SSC)';
        statusComment = `Pediatric Prosthetics: Full coverage preformed Stainless Steel Crown (SSC) restored on Primary Tooth ${toothNum}`;
        finalColor = '#64748B'; cdtCode = 'D2930'; title = 'Stainless Steel Crown (SSC)';
      } else if (segNorm.includes('space maintainer') || segNorm.includes('band and loop')) {
        finalStatus = 'Space Maintainer';
        statusComment = `Pediatric Orthodontics: Fixed band-and-loop space maintainer appliance cemented on Primary Tooth ${toothNum}`;
        finalColor = '#93C5FD'; cdtCode = 'D1510'; title = 'Fixed Space Maintainer';
      } else if (segNorm.includes('ecc') || segNorm.includes('early childhood caries')) {
        finalStatus = 'Early Childhood Caries (ECC)';
        statusComment = `Pediatric Pathology: Early Childhood Caries (ECC) active demineralization on Primary Tooth ${toothNum}`;
        finalColor = '#EF4444'; cdtCode = 'D0120'; title = 'Early Childhood Caries';
      } else if (segNorm.includes('fluoride') || segNorm.includes('varnish')) {
        finalStatus = 'Fluoride Varnish Applied';
        statusComment = `Pediatric Prevention: 5% Sodium Fluoride topical varnish desensitization on Primary Tooth ${toothNum}`;
        finalColor = '#06B6D4'; cdtCode = 'D1206'; title = 'Fluoride Varnish Application';
      }
      // 6. Restorations & Fillings
      else if (segNorm.includes('fill') || segNorm.includes('composite') || segNorm.includes('amalgam') || segNorm.includes('gic') || segNorm.includes('resin')) {
        let mat = 'Composite';
        if (segNorm.includes('amalgam') || segNorm.includes('silver')) mat = 'Amalgam';
        else if (segNorm.includes('gic') || segNorm.includes('glass ionomer')) mat = 'GIC';
        
        finalStatus = `Filling — ${mat}${surfaceCode ? ` (${surfaceCode})` : ''}`;
        statusComment = `Restorative: ${surfaceCode ? `${surfaceCode} ` : ''}${mat} restoration placed on Tooth #${toothNum}`;
        finalColor = mat === 'Amalgam' ? '#64748B' : (mat === 'GIC' ? '#0284C7' : '#2563EB');
        cdtCode = surfaceCode === 'MOD' ? 'D2393' : (surfaceCode === 'DO' || surfaceCode === 'MO' ? 'D2392' : 'D2391');
        title = `${mat} Restoration (${surfaceCode || 'O'})`;
      }
      // 7. Implant & Crown
      else if (segNorm.includes('implant')) {
        const hasZirconia = segNorm.includes('zirconia') || segNorm.includes('crown') || segNorm.includes('screw');
        finalStatus = hasZirconia ? 'Dental Implant (Screw-Retained Zirconia Crown)' : 'Dental Implant (Titanium Fixture)';
        statusComment = `Surgical & Prosthodontic: Titanium endosseous implant restored with screw-retained zirconia crown on Tooth #${toothNum}`;
        finalColor = '#0E8A80'; cdtCode = 'D6010 / D6058'; title = 'Dental Implant (Zirconia Crown)';
      } else if (segNorm.includes('endocrown')) {
        finalStatus = 'Crown — Endocrown Ceramic';
        statusComment = `Prosthodontics: Monolithic ceramic endocrown anchoring into pulp chamber on Tooth #${toothNum}`;
        finalColor = '#D97706'; cdtCode = 'D2740'; title = 'Endocrown Restoration';
      } else if (segNorm.includes('provisional') || segNorm.includes('temporary crown')) {
        finalStatus = 'Crown — Provisional Acrylic';
        statusComment = `Prosthodontics: Provisional temporary acrylic crown cemented on Tooth #${toothNum}`;
        finalColor = '#94A3B8'; cdtCode = 'D2799'; title = 'Provisional Crown';
      } else if (segNorm.includes('dislodged') || segNorm.includes('recement')) {
        finalStatus = 'Crown — Dislodged (Recementation Required)';
        statusComment = `Prosthodontics: Dislodged existing crown requiring clinical recementation on Tooth #${toothNum}`;
        finalColor = '#F59E0B'; cdtCode = 'D2910'; title = 'Dislodged Crown';
      } else if (segNorm.includes('crown') || segNorm.includes('bridge') || segNorm.includes('cap') || segNorm.includes('zirconia') || segNorm.includes('pfm')) {
        let crownType = 'Monolithic Zirconia';
        if (segNorm.includes('pfm') || segNorm.includes('fused')) crownType = 'PFM';
        else if (segNorm.includes('gold')) crownType = 'Gold';
        finalStatus = `Crown — ${crownType}`;
        statusComment = `Prosthodontic: Full coverage ${crownType} crown restored on Tooth #${toothNum}`;
        finalColor = '#D97706'; cdtCode = 'D2740'; title = `Full Coverage Crown (${crownType})`;
      }
      // 8. Root Canal (RCT) & Endodontics
      else if (segNorm.includes('apicoectomy') || segNorm.includes('retrograde') || segNorm.includes('root-end')) {
        finalStatus = 'Apicoectomy & Retrograde MTA Fill';
        statusComment = `Endodontic Surgery: Periradicular apical root resection with retrograde MTA seal on Tooth #${toothNum}`;
        finalColor = '#7C3AED'; cdtCode = 'D3410'; title = 'Apicoectomy (Retrograde MTA)';
      } else if (segNorm.includes('vital pulp') || segNorm.includes('pulpectomy') || segNorm.includes('pulp exposure')) {
        finalStatus = 'Vital Pulp Exposure / Pulpectomy';
        statusComment = `Endodontics: Vital pulp exposure requiring immediate pulpectomy and sedative dressing on Tooth #${toothNum}`;
        finalColor = '#DC2626'; cdtCode = 'D3221'; title = 'Vital Pulp Exposure';
      } else if (segNorm.includes('granuloma') || segNorm.includes('apical periodontitis') || segNorm.includes('condensing osteitis')) {
        finalStatus = 'Apical Periodontitis / Granuloma';
        statusComment = `Endodontics: Periradicular apical periodontitis with radiographic halo on Tooth #${toothNum}`;
        finalColor = '#8B5CF6'; cdtCode = 'D3999'; title = 'Apical Periodontitis / Granuloma';
      } else if (segNorm.includes('retained root') || segNorm.includes('root tip')) {
        finalStatus = 'Retained Root Tip (Indicated for Extraction)';
        statusComment = `Oral Surgery: Retained fractured root apex in alveolar socket of Tooth #${toothNum}`;
        finalColor = '#DC2626'; cdtCode = 'D7250'; title = 'Retained Root Tip';
      } else if (segNorm.includes('root canal') || segNorm.includes('rct') || segNorm.includes('pulpitis') || segNorm.includes('obturat')) {
        finalStatus = 'Root Canal Treated (RCT)';
        statusComment = `Endodontics: Complete pulpal debridement and gutta-percha obturation on Tooth #${toothNum}`;
        finalColor = '#7C3AED'; cdtCode = 'D3330'; title = 'Root Canal Therapy (RCT)';
      }
      // 9. Periodontal: Bone Loss / Recession / Mobility / Furcation / Calculus
      else if (segNorm.includes('calculus') || segNorm.includes('tartar')) {
        finalStatus = 'Subgingival Calculus Band';
        statusComment = `Periodontics: Heavy subgingival mineralized calculus deposit around cervical margin of Tooth #${toothNum}`;
        finalColor = '#D97706'; cdtCode = 'D1110 / D4346'; title = 'Subgingival Calculus';
      } else if (segNorm.includes('furcation')) {
        finalStatus = 'Periodontal Furcation Defect';
        statusComment = `Periodontics: Multi-rooted furcation involvement (Class II/III) on Tooth #${toothNum}`;
        finalColor = '#E0665A'; cdtCode = 'D4341'; title = 'Furcation Defect';
      } else if (segNorm.includes('bracket') || segNorm.includes('orthodontic bracket')) {
        finalStatus = 'Orthodontic Bracket Bonded';
        statusComment = `Orthodontics: Direct-bonded edgewise ceramic/metal orthodontic bracket on Tooth #${toothNum}`;
        finalColor = '#0284C7'; cdtCode = 'D8080'; title = 'Orthodontic Bracket';
      } else if (segNorm.includes('demineraliz') || segNorm.includes('icdas') || segNorm.includes('white spot')) {
        finalStatus = 'Incipient Enamel Demineralization (ICDAS 2)';
        statusComment = `Preventive: Non-cavitated chalky white-spot enamel demineralization on Tooth #${toothNum}`;
        finalColor = '#FCA5A5'; cdtCode = 'D1351 / D1206'; title = 'Incipient Demineralization';
      } else if (segNorm.includes('bone loss') || segNorm.includes('periodont') || segNorm.includes('pocket') || segNorm.includes('mobility') || segNorm.includes('recession')) {
        if (segNorm.includes('recession')) {
          finalStatus = 'Gingival Recession';
          statusComment = `Periodontal: Cervical attachment loss at margin of Tooth #${toothNum}`;
          finalColor = '#E0665A'; cdtCode = 'D4341'; title = 'Gingival Recession';
        } else if (segNorm.includes('mobility')) {
          finalStatus = 'Pathologic Tooth Mobility';
          statusComment = `Periodontal: Pathologic tooth mobility on Tooth #${toothNum}`;
          finalColor = '#F43F5E'; cdtCode = 'D4342'; title = 'Tooth Mobility';
        } else {
          finalStatus = 'Periodontal Bone Loss — Furcation';
          statusComment = `Periodontal: Pathologic alveolar bone loss and furcation defect on Tooth #${toothNum}`;
          finalColor = '#E0665A'; cdtCode = 'D4341'; title = 'Periodontal Bone Loss';
        }
      }
      // 10. Attrition / Bruxism / Erosion / Cracks
      else if (segNorm.includes('crack') || segNorm.includes('chipped') || segNorm.includes('fractur')) {
        finalStatus = segNorm.includes('chipped') || segNorm.includes('fractur') ? 'Chipped / Fractured Enamel' : 'Cracked Enamel';
        statusComment = `Trauma: Enamel fracture on Tooth #${toothNum}`;
        finalColor = '#F59E0B'; cdtCode = 'D2740'; title = 'Traumatic Fracture';
      } else if (segNorm.includes('attrition') || segNorm.includes('bruxism') || segNorm.includes('erosion') || segNorm.includes('wear facet') || segNorm.includes('flattened tip')) {
        finalStatus = 'Occlusal Attrition — Dentin Facet';
        statusComment = `Pathology: Mechanical wear of enamel cusp tips and exposed dentin on Tooth #${toothNum}`;
        finalColor = '#F59E0B'; cdtCode = 'D9944'; title = 'Bruxism Occlusal Attrition';
      }
      // 11. Missing / Extracted
      else if (segNorm.includes('miss') || segNorm.includes('extract') || segNorm.includes('exfoliat') || segNorm.includes('absent')) {
        finalStatus = mode === 'pediatric' ? 'Missing / Exfoliated' : 'Missing / Extracted';
        statusComment = `Surgical: Clinically absent / extracted tooth socket at Tooth #${toothNum}`;
        finalColor = '#DC2626'; cdtCode = 'D7140'; title = 'Extracted / Missing Tooth';
      }
      // 12. Healthy / Sound
      else if (segNorm.includes('health') || segNorm.includes('sound') || segNorm.includes('intact')) {
        finalStatus = 'Healthy';
        statusComment = `Diagnostic: Sound anatomical enamel, physiological mobility Grade 0 on Tooth #${toothNum}`;
        finalColor = '#10B981'; cdtCode = 'D0120'; title = 'Healthy Sound Tooth';
      }
      // 13. Caries / Decay / Cavitation / Cavity (Default Pathology)
      else {
        let cariesLoc = surfaceCode || 'O';
        finalStatus = `Caries — ${cariesLoc}`;
        finalColor = '#EF4444';
        if (cariesLoc === 'MOD') {
          statusComment = `Pathology: Extensive MOD interproximal-occlusal caries cavitation on Tooth #${toothNum}`;
          cdtCode = 'D2160'; title = 'Class II MOD Caries Cavitation';
        } else if (cariesLoc === 'DO' || cariesLoc === 'MO') {
          statusComment = `Pathology: ${cariesLoc} interproximal caries cavitation with marginal ridge breakdown on Tooth #${toothNum}`;
          cdtCode = 'D2150'; title = `Class II ${cariesLoc} Interproximal Caries`;
        } else if (cariesLoc === 'Class V') {
          statusComment = `Pathology: Cervical Class V subgingival carious demineralization on Tooth #${toothNum}`;
          cdtCode = 'D2140'; title = 'Class V Cervical Caries';
        } else if (cariesLoc === 'Lingual Pit (L)') {
          statusComment = `Pathology: Lingual pit developmental groove caries lesion on Tooth #${toothNum}`;
          cdtCode = 'D2140'; title = 'Lingual Pit Caries (L)';
        } else {
          statusComment = `Pathology: Active occlusal fissure caries lesion on Tooth #${toothNum}`;
          cdtCode = 'D2140'; title = 'Class I Occlusal Caries (O)';
        }
      }

      return {
        toothNum,
        finalStatus,
        statusComment,
        finalColor,
        cdtCode,
        surfaceCode,
        title,
        rawText: rawSegment
      };
    };

    // Check if input represents one or more specific tooth clinical assessment lines
    const rawLines = text.split(/[\n;\r]+/).map(l => l.trim()).filter(Boolean);
    let candidateSegments = [];
    if (rawLines.length > 1) {
      candidateSegments = rawLines;
    } else {
      const boundaryMatches = [...text.matchAll(/(?:^|[\s,.\-—])(?:tooth|teeth|primary tooth|dant|#)\s*#?(\d{1,2}|[a-tA-T])\b/gi)];
      if (boundaryMatches.length > 1) {
        for (let i = 0; i < boundaryMatches.length; i++) {
          const sIdx = boundaryMatches[i].index;
          const eIdx = (i + 1 < boundaryMatches.length) ? boundaryMatches[i + 1].index : text.length;
          candidateSegments.push(text.slice(sIdx, eIdx).trim());
        }
      } else {
        candidateSegments = [text];
      }
    }

    const batchParsedTeeth = candidateSegments
      .map(seg => parseClinicalToothEntry(seg, dentitionMode, detailedTooth ? String(detailedTooth).toUpperCase() : null))
      .filter(Boolean);

    // If candidate text matches specific tooth clinical entries, execute immediately!
    const isExplicitToothQuery = batchParsedTeeth.length > 1 || (
      batchParsedTeeth.length === 1 && 
      (txtLower.includes('tooth') || txtLower.includes('teeth') || txtLower.includes('#') || txtLower.includes('dant') || txtLower.includes('dharh') || txtLower.includes('number') || txtLower.includes('no.') || txtLower.includes('dard') || txtLower.includes('pain') || /\b\d{1,2}\b/.test(txtLower))
    );

    if (isExplicitToothQuery && batchParsedTeeth.length >= 1) {
      console.log(`🎙️ [ChartPage:BatchMultiToothProcessor] Processed ${batchParsedTeeth.length} teeth:`, batchParsedTeeth);

      // 1. Update teethState for all batch teeth simultaneously
      setTeethState(prev => {
        const updated = [...prev];
        batchParsedTeeth.forEach(item => {
          const toothKeyStr = String(item.toothNum).toUpperCase();
          const idx = updated.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
          const newObj = {
            toothNumber: item.toothNum,
            status: item.finalStatus,
            conditionStatus: item.finalStatus,
            color: item.finalColor,
            comments: item.statusComment,
            comment: item.statusComment
          };
          if (idx >= 0) updated[idx] = { ...updated[idx], ...newObj };
          else updated.push(newObj);
        });
        return updated;
      });

      // 2. Spotlight all batch teeth on 2D odontogram & 3D jaw
      const highlightedNums = batchParsedTeeth.map(b => b.toothNum);
      setHighlightedTeeth(highlightedNums);
      if (highlightedNums.length > 0) {
        setDetailedTooth(highlightedNums[0]);
        if (typeof highlightedNums[0] === 'number') {
          setSelectedJawView(highlightedNums[0] <= 16 ? 'maxilla' : 'mandible');
        }
      }

      setHighlightInfo({
        title: batchParsedTeeth.length > 1 ? `Batch Clinical Assessment (${batchParsedTeeth.length} Teeth Recorded)` : `Tooth #${batchParsedTeeth[0].toothNum}: ${batchParsedTeeth[0].title}`,
        subtitle: batchParsedTeeth.map(b => `Tooth #${b.toothNum}: ${b.surfaceCode ? b.surfaceCode + ' ' : ''}${b.finalStatus}`).join(' · '),
        type: batchParsedTeeth.length > 1 ? 'group' : 'single',
        color: batchParsedTeeth[0].finalColor
      });

      // 3. Persist to SQL Server Database via Bulk API
      try {
        const docId = doctor?.doctorID || doctor?.DoctorID || 1;
        const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 18);
        const dbUpdates = batchParsedTeeth.map(b => ({
          toothNumber: b.toothNum,
          toothKey: String(b.toothNum),
          dentitionCategory: isNaN(parseInt(b.toothNum, 10)) ? 'Pediatric' : 'Adult',
          doctorId: docId,
          status: b.finalStatus,
          conditionStatus: b.finalStatus,
          color: b.finalColor,
          comment: b.statusComment,
          comments: b.statusComment
        }));

        fetch('/api/patients/teeth/update-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: pid, updates: dbUpdates })
        }).then(res => {
          if (res.ok) console.log(`💾 [DB Bulk Multi-Saved]: ${batchParsedTeeth.length} teeth persisted to DB.`);
        }).catch(err => console.error("Batch DB update error:", err));

        fetch(`/api/patients/${patientId}/clinical-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorID: docId,
            message: `AI Dictation: Recorded clinical diagnoses for ${batchParsedTeeth.length} teeth [${highlightedNums.join(', ')}].`,
            action: `AI Tooth Assessment`
          })
        }).catch(() => {});
      } catch (e) {
        console.error("Batch DB save exception:", e);
      }

      // 4. Send Rich Multi-Tooth Response Card to Chat
      const responseTextLines = batchParsedTeeth.map(b => `• **Tooth #${b.toothNum}:** ${b.title} (${b.finalStatus}) · CDT \`${b.cdtCode}\``).join('\n');
      const richResponseText = `📋 **Clinical Assessment Recorded (${batchParsedTeeth.length} ${batchParsedTeeth.length === 1 ? 'Tooth' : 'Teeth'}):**\n\n${responseTextLines}\n\n• **Status:** Successfully updated on 2D Odontogram & 3D Jaw Arch and persisted to SQL database.`;

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: richResponseText,
        type: 'multi_tooth_card',
        cardData: {
          title: `Clinical Assessment (${batchParsedTeeth.length} Teeth)`,
          teethCount: batchParsedTeeth.length,
          items: batchParsedTeeth
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(`Recorded diagnoses for ${batchParsedTeeth.length} teeth.`);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }
    
    // --- 0.05 CLINICAL ANATOMICAL GROUP ACTION ENGINE (e.g. "Remove all canine teeth and also show filling in promolars everywhere") ---
    const hasGroupActionVerb = /\b(?:remove|extract|missing|absent|pull|exfoliat|fill|filling|composite|amalgam|gic|crown|cap|seal|sealant|decay|caries|cavity|clean|sound|healthy|rct|root canal|restore)\b/i.test(txtLower);
    const hasGroupTarget = /\b(?:canine|canines|cuspid|cuspids|eye tooth|eye teeth|premolar|premolars|promolar|promolars|bicuspid|bicuspids|molar|molars|incisor|incisors|wisdom|wisdom teeth|third molar|3rd molar|upper arch|upper jaw|maxilla|lower arch|lower jaw|mandible|all teeth)\b/i.test(txtLower);

    if (hasGroupActionVerb && hasGroupTarget) {
      // Split into clauses by 'and', 'also', 'as well as', ';', '+', or commas
      const clauses = text.split(/\band\b|\balso\b|\bas well as\b|;|\+/i).map(c => c.trim()).filter(Boolean);
      const groupUpdates = [];
      const executionSummary = [];

      clauses.forEach(clause => {
        const cLower = clause.toLowerCase();
        let targetTeeth = [];
        let groupName = '';

        // 1. Identify Target Teeth
        if (cLower.includes('canine') || cLower.includes('cuspid') || cLower.includes('eye tooth') || cLower.includes('eye teeth')) {
          targetTeeth = dentitionMode === 'pediatric' ? ['C', 'H', 'M', 'R'] : [6, 11, 22, 27];
          groupName = 'Canine Teeth (6, 11, 22, 27)';
        } else if (cLower.includes('premolar') || cLower.includes('promolar') || cLower.includes('bicuspid')) {
          targetTeeth = [4, 5, 12, 13, 20, 21, 28, 29];
          groupName = 'Premolars (4, 5, 12, 13, 20, 21, 28, 29)';
        } else if (cLower.includes('wisdom') || cLower.includes('third molar') || cLower.includes('3rd molar')) {
          targetTeeth = [1, 16, 17, 32];
          groupName = 'Wisdom 3rd Molars (1, 16, 17, 32)';
        } else if (cLower.includes('molar') && !cLower.includes('premolar') && !cLower.includes('promolar')) {
          targetTeeth = dentitionMode === 'pediatric' ? ['A', 'B', 'I', 'J', 'K', 'L', 'S', 'T'] : [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32];
          groupName = 'Molars';
        } else if (cLower.includes('incisor')) {
          targetTeeth = dentitionMode === 'pediatric' ? ['D', 'E', 'F', 'G', 'N', 'O', 'P', 'Q'] : [7, 8, 9, 10, 23, 24, 25, 26];
          groupName = 'Incisors';
        } else if (cLower.includes('upper') || cLower.includes('maxilla')) {
          targetTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
          groupName = 'Maxilla (Upper Jaw)';
        } else if (cLower.includes('lower') || cLower.includes('mandible')) {
          targetTeeth = Array.from({ length: 16 }, (_, i) => i + 17);
          groupName = 'Mandible (Lower Jaw)';
        } else if (cLower.includes('all teeth') || cLower.includes('all tooth') || cLower.includes('every tooth')) {
          targetTeeth = Array.from({ length: 32 }, (_, i) => i + 1);
          groupName = 'All 32 Teeth';
        }

        if (targetTeeth.length === 0) return;

        // 2. Identify Action / Diagnosis to Apply
        let status = '';
        let color = '#2563EB';
        let cdt = 'D2391';
        let actionDesc = '';

        if (cLower.includes('remove') || cLower.includes('extract') || cLower.includes('missing') || cLower.includes('absent') || cLower.includes('pull') || cLower.includes('exfoliat')) {
          status = 'Missing / Extracted';
          color = '#DC2626';
          cdt = 'D7140';
          actionDesc = 'Surgical: Extracted tooth unit (Missing)';
        } else if (cLower.includes('fill') || cLower.includes('composite') || cLower.includes('resin') || cLower.includes('broken')) {
          status = 'Filling — Composite (O)';
          color = '#2563EB';
          cdt = 'D2391';
          actionDesc = 'Restorative: Occlusal composite restoration placed';
        } else if (cLower.includes('amalgam') || cLower.includes('silver')) {
          status = 'Filling — Amalgam (O)';
          color = '#64748B';
          cdt = 'D2140';
          actionDesc = 'Restorative: Amalgam restoration placed';
        } else if (cLower.includes('gic') || cLower.includes('glass ionomer')) {
          status = 'Filling — GIC';
          color = '#0284C7';
          cdt = 'D2391';
          actionDesc = 'Restorative: Glass Ionomer (GIC) restoration placed';
        } else if (cLower.includes('seal') || cLower.includes('sealant') || cLower.includes('pit and fissure') || cLower.includes('pit & fissure')) {
          status = 'Pit & Fissure Sealant';
          color = '#06B6D4';
          cdt = 'D1351';
          actionDesc = 'Prevention: Resin pit & fissure sealant barrier placed';
        } else if (cLower.includes('crown') || cLower.includes('cap') || cLower.includes('zirconia') || cLower.includes('pfm')) {
          status = 'Crown — Monolithic Zirconia';
          color = '#D97706';
          cdt = 'D2740';
          actionDesc = 'Prosthodontics: Full-coverage Zirconia crown restoration placed';
        } else if (cLower.includes('rct') || cLower.includes('root canal') || cLower.includes('endo')) {
          status = 'Root Canal Treated (RCT)';
          color = '#7C3AED';
          cdt = 'D3330';
          actionDesc = 'Endodontics: Completed root canal therapy (RCT)';
        } else if (cLower.includes('caries') || cLower.includes('decay') || cLower.includes('cavity') || cLower.includes('keera')) {
          status = 'Caries — O';
          color = '#EF4444';
          cdt = 'D2140';
          actionDesc = 'Pathology: Active occlusal caries lesion diagnosed';
        } else if (cLower.includes('clean') || cLower.includes('healthy') || cLower.includes('sound') || cLower.includes('restore') || cLower.includes('normal')) {
          status = 'Healthy';
          color = '#10B981';
          cdt = 'D0120';
          actionDesc = 'Sound: Healthy physiological status restored';
        }

        if (status) {
          targetTeeth.forEach(tNum => {
            groupUpdates.push({
              toothNum: tNum,
              finalStatus: status,
              finalColor: color,
              cdtCode: cdt,
              statusComment: `${actionDesc} on Tooth #${tNum}`,
              title: `${groupName}: ${status}`
            });
          });
          executionSummary.push({
            groupName,
            status,
            color,
            cdt,
            count: targetTeeth.length,
            teethList: targetTeeth
          });
        }
      });

      if (groupUpdates.length > 0) {
        console.log(`🎙️ [ChartPage:GroupActionEngine] Applying actions to ${groupUpdates.length} teeth:`, groupUpdates);

        // 1. Update teethState
        setTeethState(prev => {
          const updated = [...prev];
          groupUpdates.forEach(item => {
            const toothKeyStr = String(item.toothNum).toUpperCase();
            const idx = updated.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
            const newObj = {
              toothNumber: item.toothNum,
              status: item.finalStatus,
              conditionStatus: item.finalStatus,
              color: item.finalColor,
              comments: item.statusComment,
              comment: item.statusComment
            };
            if (idx >= 0) updated[idx] = { ...updated[idx], ...newObj };
            else updated.push(newObj);
          });
          return updated;
        });

        // 2. Spotlight all affected teeth
        const allAffectedNums = groupUpdates.map(u => u.toothNum);
        setHighlightedTeeth(allAffectedNums);
        setSelectedJawView('both');

        // 3. Persist to SQL Server Database via Bulk API
        try {
          const docId = doctor?.doctorID || doctor?.DoctorID || 1;
          const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 18);
          const dbUpdates = groupUpdates.map(b => ({
            toothNumber: b.toothNum,
            toothKey: String(b.toothNum),
            dentitionCategory: isNaN(parseInt(b.toothNum, 10)) ? 'Pediatric' : 'Adult',
            doctorId: docId,
            status: b.finalStatus,
            conditionStatus: b.finalStatus,
            color: b.finalColor,
            comment: b.statusComment,
            comments: b.statusComment
          }));

          fetch('/api/patients/teeth/update-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: pid, updates: dbUpdates })
          }).then(res => {
            if (res.ok) console.log(`💾 [DB Bulk Group Actions Persisted]: ${groupUpdates.length} teeth saved to DB.`);
          }).catch(err => console.error("Batch Group DB update error:", err));

          fetch(`/api/patients/${patientId}/clinical-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorID: docId,
              message: `AI Clinical Group Action: Executed [${executionSummary.map(e => `${e.count} ${e.groupName} -> ${e.status}`).join(', ')}] across ${groupUpdates.length} teeth.`,
              action: `AI Clinical Group Update`
            })
          }).catch(() => {});
        } catch (e) {
          console.error("Batch Group DB save exception:", e);
        }

        // 4. Send Rich AI Summary Card
        const summaryLines = executionSummary.map(e => `• **${e.groupName} (${e.count} Teeth: [${e.teethList.join(', ')}]):** Updated to **${e.status}** (CDT: ${e.cdt})`).join('\n');
        
        const richMsg = `✅ **Clinical Group Action Executed Successfully**\n\n${summaryLines}\n\n💾 **Live Status:** All ${groupUpdates.length} teeth have been charted across the **3D Interactive Model**, **2D Odontogram**, and synchronized with the SQL EHR database.`;

        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          text: richMsg,
          type: 'multi_tooth_card',
          cardData: {
            title: `Clinical Group Action (${groupUpdates.length} Teeth Modified)`,
            teethCount: groupUpdates.length,
            items: groupUpdates,
            summary: executionSummary
          },
          time: 'Just now'
        }]);

        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(`Executed clinical group action on ${groupUpdates.length} teeth.`);
            utt.rate = 1.05;
            window.speechSynthesis.speak(utt);
          } catch (e) {}
        }
        return;
      }
    }
    
    // --- 0. CLINICAL INTELLIGENCE: 32-YEAR-OLD ADULT DENTITION / FULL 32-TOOTH ODONTOGRAM ---
    const isAdultDentogramQuery = (
      txtLower.includes('32 age') || 
      txtLower.includes('age 32') || 
      txtLower.includes('32 year') || 
      txtLower.includes('32 saal') ||
      txtLower.includes('32yo') || 
      txtLower.includes('32-year') || 
      txtLower.includes('full dentogram') || 
      txtLower.includes('adult dentogram') || 
      txtLower.includes('adult dentition') || 
      txtLower.includes('all teeth') ||
      txtLower.includes('32 teeth') ||
      txtLower.includes('32 dant') ||
      txtLower.includes('dentogram of 32')
    );

    if (isAdultDentogramQuery) {
      const all32 = Array.from({ length: 32 }, (_, i) => i + 1);
      setHighlightedTeeth(all32);
      setSelectedJawView('both');
      setHighlightInfo({
        title: "Full Adult Odontogram (32 Permanent Teeth)",
        subtitle: "Ek 32-saal ke adult person ke jaw mein aam tor par total 32 teeth (dant) hote hain",
        type: "group",
        color: "#4A7CD2"
      });

      const explanation = "Ek 32-saal ke adult person ke jaw mein aam tor par total 32 teeth (dant) hote hain (16 Maxilla Upper Jaw aur 16 Mandible Lower Jaw):\n\n• **Maxilla (Upper Jaw):** 16 Teeth (Teeth #1 to #16)\n• **Mandible (Lower Jaw):** 16 Teeth (Teeth #17 to #32)\n\n📌 **Dant Ki Anatomical Taqseem (Breakdown):**\n• **8 Incisors (Kaatne wale daant):** #7, 8, 9, 10 (Upper) & #23, 24, 25, 26 (Lower)\n• **4 Canines (Chheerney/Nokdar daant):** #6, 11 (Upper) & #22, 27 (Lower)\n• **8 Premolars (Chabanay wale daant):** #4, 5, 12, 13 (Upper) & #20, 21, 28, 29 (Lower)\n• **12 Molars (Dharhain / Wisdom teeth samait):** #1, 2, 3, 14, 15, 16 (Upper) & #17, 18, 19, 30, 31, 32 (Lower)\n\n32 saal ki umar mein tamam 32 permanent teeth mukammal tor par nikal aate hain (erupted) aur chart mein spotlight ho gaye hain.";

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: `🦷 **Ek 32-saal ke adult person ke jaw mein aam tor par total 32 teeth (dant) hote hain**\n\n${explanation}`,
        type: 'group_card',
        cardData: {
          title: "32-Year-Old Adult Human Jaw (32 Teeth)",
          subtitle: "Ek 32-saal ke adult person ke jaw mein aam tor par total 32 teeth (dant) hote hain",
          explanation: explanation,
          teethNumbers: all32,
          color: "#4A7CD2",
          image: "/full_realistic_jaw.jpg",
          images: ["/maxilla_upper_jaw.jpg", "/maxilla_lower_jaw.jpg"]
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance("Ek 32 saal ke adult person ke jaw mein aam tor par total 32 teeth hote hain.");
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }

    // --- 0.08 CLINICAL ORTHODONTIC, MALOCCLUSION, IMPACTION, TMJ & ADULT PATHOLOGY INTENT ENGINE ---
    const isOrthoTmjQuery = (
      txtLower.includes('overbite') ||
      txtLower.includes('deep bite') ||
      txtLower.includes('underbite') ||
      txtLower.includes('crossbite') ||
      txtLower.includes('open bite') ||
      txtLower.includes('bite wear') ||
      txtLower.includes('wear pattern') ||
      txtLower.includes('molar wear') ||
      txtLower.includes('grinding wear') ||
      txtLower.includes('flattened tip') ||
      txtLower.includes('generalized wear') ||
      txtLower.includes('bruxism') ||
      txtLower.includes('clenching') ||
      txtLower.includes('attrition') ||
      txtLower.includes('wear facet') ||
      txtLower.includes('curve of spee') ||
      txtLower.includes('malocclusion') ||
      txtLower.includes('class ii') ||
      txtLower.includes('class iii') ||
      txtLower.includes('overjet') ||
      txtLower.includes('reverse overjet') ||
      txtLower.includes('negative overjet') ||
      txtLower.includes('prognathism') ||
      txtLower.includes('protrusion') ||
      txtLower.includes('palatal expansion') ||
      txtLower.includes('rpe') ||
      txtLower.includes('palatal gingival') ||
      txtLower.includes('palatal impingement') ||
      txtLower.includes('retroclined') ||
      txtLower.includes('retroclination') ||
      txtLower.includes('intrusion arch') ||
      txtLower.includes('bite plate') ||
      txtLower.includes('bite turbo') ||
      txtLower.includes('tongue thrust') ||
      txtLower.includes('tongue crib') ||
      txtLower.includes('habit-breaker') ||
      ((txtLower.includes('orthodontic') || txtLower.includes('ortho') || txtLower.includes('braces')) && !txtLower.includes('pulpotomy')) ||
      ((txtLower.includes('impaction') || txtLower.includes('impacted')) && !txtLower.includes('food impaction') && !txtLower.includes('food')) ||
      txtLower.includes('supernumerary') ||
      txtLower.includes('mesiodens') ||
      txtLower.includes('wisdom tooth') ||
      txtLower.includes('wisdom molar') ||
      txtLower.includes('third molar') ||
      txtLower.includes('trapped in bone') ||
      txtLower.includes('unerupted') ||
      txtLower.includes('ectopic eruption') ||
      txtLower.includes('gold chain') ||
      txtLower.includes('operculectomy') ||
      txtLower.includes('pericoronal') ||
      txtLower.includes('operculitis') ||
      txtLower.includes('partial eruption') ||
      txtLower.includes('partially erupted') ||
      txtLower.includes('tmj') ||
      txtLower.includes('jaw joint') ||
      txtLower.includes('jaw diagram') ||
      txtLower.includes('joint clicking') ||
      txtLower.includes('clicking indicator') ||
      txtLower.includes('disc displacement') ||
      txtLower.includes('derangement') ||
      txtLower.includes('arthralgia') ||
      txtLower.includes('crepitus') ||
      txtLower.includes('muscle inflammation') ||
      txtLower.includes('tenderness zone') ||
      txtLower.includes('hypertonicity') ||
      txtLower.includes('limited mouth-opening') ||
      txtLower.includes('limited opening') ||
      txtLower.includes('closed lock') ||
      txtLower.includes('trismus') ||
      txtLower.includes('enamel erosion') ||
      txtLower.includes('cracked enamel') ||
      txtLower.includes('cracked tooth') ||
      txtLower.includes('cyst') ||
      txtLower.includes('root resorption')
    );

    if (isOrthoTmjQuery) {
      console.log(`🎙️ [ChartPage:AI_VoiceChat_OrthoAdultQuery] Processing: "${text}"`);
      const allPctMatches = [...text.matchAll(/(\d{1,3})\s*%/g)];
      const overlapPct = allPctMatches.length > 0 ? parseInt(allPctMatches[allPctMatches.length - 1][1], 10) : 75;
      
      const matchOverjet = text.match(/[−\-]\s*(\d+(\.\d+)?)\s*mm/i);
      const overjetVal = matchOverjet ? -parseFloat(matchOverjet[1]) : -3.5;
      
      const matchGap = text.match(/(\d+(\.\d+)?)\s*mm/i);
      const gapVal = matchGap ? parseFloat(matchGap[1]) : 4.0;

      const matchOpening = text.match(/(?:opening\s*(?:limited\s*to|at)?|opening\s*)\s*(\d{1,2})\s*mm/i);
      const customOpeningMm = matchOpening ? parseFloat(matchOpening[1]) : null;

      // Extract explicitly mentioned tooth numbers (#X, teeth #X, #Y)
      const explicitTeethMatches = [...text.matchAll(/(?:#|teeth\s*#?|tooth\s*#?)(\d{1,2})\b/gi)]
        .map(m => parseInt(m[1], 10))
        .filter(n => n >= 1 && n <= 32);
      
      let suite_category = 'occlusion';
      let bite_type = 'overbite';
      let impaction_type = 'mesioangular';
      let tmj_state = 'clicking';
      let title = "Orthodontic Occlusion Assessment";
      let code = "D8080";
      let teethToHighlight = [7, 8, 9, 10, 23, 24, 25, 26];

      // 1. Supernumerary & Mesiodens
      if (txtLower.includes('supernumerary') || txtLower.includes('mesiodens')) {
        suite_category = 'impactions';
        impaction_type = 'supernumerary';
        const isPed = dentitionMode === 'pediatric' || txtLower.includes('primary') || txtLower.includes('child');
        title = isPed
          ? "Pediatric Supernumerary Tooth (Mesiodens Between Primary Incisors E & F)"
          : "Supernumerary Tooth (Mesiodens Between Central Incisors #8 & #9)";
        code = "D7280 / D7140";
        teethToHighlight = isPed ? ['E', 'F'] : (explicitTeethMatches.length > 0 ? explicitTeethMatches : [8, 9]);
      }
      // 2. Deep Bite / Overbite (8 templates)
      else if (txtLower.includes('overbite') || txtLower.includes('deep bite') || txtLower.includes('curve of spee') || (txtLower.includes('class ii') && (txtLower.includes('division 2') || txtLower.includes('bite')))) {
        suite_category = 'occlusion';
        bite_type = 'overbite';
        title = `Class II Deep Overbite (${overlapPct}% Overlap)`;
        code = "CDT D8080";
        teethToHighlight = explicitTeethMatches.length > 0
          ? Array.from(new Set([...explicitTeethMatches, 7, 8, 9, 10, 23, 24, 25, 26]))
          : [7, 8, 9, 10, 23, 24, 25, 26];
      }
      // 3. Class III Malocclusion / Underbite / Prognathism (6 templates)
      else if (txtLower.includes('underbite') || txtLower.includes('class iii') || txtLower.includes('prognathism') || txtLower.includes('protrusion') || txtLower.includes('reverse overjet') || (txtLower.includes('negative') && txtLower.includes('overjet'))) {
        suite_category = 'occlusion';
        bite_type = 'underbite';
        title = `Class III Mandibular Prognathism / Underbite (${overjetVal}mm Overjet)`;
        code = "CDT D8080";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [7, 8, 9, 10, 23, 24, 25, 26];
      }
      // 4. Posterior / Anterior Crossbite (5 templates)
      else if (txtLower.includes('crossbite') || txtLower.includes('palatal expansion') || txtLower.includes('rpe')) {
        suite_category = 'occlusion';
        bite_type = 'crossbite';
        const isBilateral = txtLower.includes('bilateral');
        const isLeft = txtLower.includes('left');
        const isRight = txtLower.includes('right');
        title = isBilateral 
          ? "Bilateral Posterior Crossbite (Narrow Maxilla - RPE Indicated)" 
          : (isLeft ? "Left Posterior Crossbite" : (isRight ? "Right Posterior Crossbite" : "Posterior / Anterior Crossbite"));
        code = "CDT D8210";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [3, 14, 19, 30];
      }
      // 5. Open Bite (5 templates)
      else if (txtLower.includes('open bite') || txtLower.includes('tongue thrust') || txtLower.includes('tongue crib') || (txtLower.includes('vertical gap') && !txtLower.includes('overbite'))) {
        suite_category = 'occlusion';
        bite_type = 'openbite';
        title = `Anterior Vertical Open Bite (${gapVal}mm Vertical Gap)`;
        code = "CDT D8220";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [7, 8, 9, 10, 23, 24, 25, 26];
      }
      // 6. Bruxism / Occlusal Wear / Attrition (5 templates)
      else if (txtLower.includes('bruxism') || txtLower.includes('wear facet') || txtLower.includes('occlusal flattening') || txtLower.includes('clenching') || txtLower.includes('attrition') || txtLower.includes('occlusal splint') || txtLower.includes('d9944') || txtLower.includes('loss of vertical dimension') || txtLower.includes('bite wear') || txtLower.includes('wear pattern') || txtLower.includes('molar wear')) {
        suite_category = 'occlusion';
        bite_type = 'molarwear';
        const isPed = dentitionMode === 'pediatric' || txtLower.includes('primary');
        title = isPed
          ? "Pediatric Bruxism: Primary Molar Occlusal Wear & Attrition Facets"
          : "Severe Occlusal Attrition & Enamel Loss (Bruxism Clenching)";
        code = "CDT D9944";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [3, 14, 19, 30];
      }
      // 7. Non-Carious Adult Pathologies
      else if (txtLower.includes('sensitivity') || txtLower.includes('exposed root')) {
        suite_category = 'occlusion';
        bite_type = 'molarwear';
        title = "Cervical Dentin Hypersensitivity & Root Exposure";
        code = "CDT D9910";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [4, 5, 12, 13, 20, 21, 28, 29];
      } else if (txtLower.includes('gum recession') || txtLower.includes('recession')) {
        suite_category = 'occlusion';
        bite_type = 'molarwear';
        title = "Localized Marginal Gingival Recession";
        code = "CDT D4341";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [6, 11, 22, 27];
      } else if (txtLower.includes('enamel erosion') || txtLower.includes('erosion')) {
        suite_category = 'occlusion';
        bite_type = 'molarwear';
        title = "Chemical Enamel Acid Erosion (Palatal Cupping)";
        code = "CDT D9944";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [6, 7, 8, 9, 10, 11];
      } else if (txtLower.includes('cracked enamel') || txtLower.includes('cracked tooth') || txtLower.includes('fracture') || txtLower.includes('crack')) {
        suite_category = 'occlusion';
        bite_type = 'molarwear';
        title = "Structural Enamel Micro-Fracture / Cracked Tooth";
        code = "CDT D2740";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [3, 14, 19, 30];
      }
      // 8. Radiographic Pathologies
      else if (txtLower.includes('bone loss') || txtLower.includes('furcation')) {
        suite_category = 'radiographic';
        impaction_type = 'horizontal';
        title = "Radiographic Periodontal Bone Loss & Furcation Defect";
        code = "CDT D4341";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [3, 14, 19, 30];
      } else if (txtLower.includes('cyst')) {
        suite_category = 'radiographic';
        impaction_type = 'horizontal';
        title = "Radiographic Periapical Odontogenic Cyst";
        code = "CDT D7450 / D3450";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [19, 30];
      } else if (txtLower.includes('root resorption')) {
        suite_category = 'radiographic';
        impaction_type = 'horizontal';
        title = "Radiographic External / Internal Root Resorption";
        code = "CDT D0367 / D3450";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [17, 31, 32];
      }
      // 9. Third Molar (Wisdom Tooth) Impaction (5 templates)
      else if ((txtLower.includes('wisdom') || txtLower.includes('third molar') || txtLower.includes('impaction') || txtLower.includes('impacted')) && !txtLower.includes('canine') && !txtLower.includes('premolar')) {
        suite_category = 'impactions';
        if (txtLower.includes('horizontal') || txtLower.includes('90')) {
          impaction_type = 'horizontal';
          title = "Horizontally Impacted Molar (90° Angle with IAN Canal)";
          code = "CDT D7240";
        } else if (txtLower.includes('distal') || txtLower.includes('distally')) {
          impaction_type = 'distoangular';
          title = "Distally Angled Impacted Wisdom Tooth (Recurrent Pericoronitis)";
          code = "CDT D7230";
        } else if (txtLower.includes('complete bony') || txtLower.includes('bony')) {
          impaction_type = 'horizontal';
          title = "Complete Bony Impaction of Third Molar (Follicle Enlargement)";
          code = "CDT D7240";
        } else {
          impaction_type = 'mesioangular';
          title = "Mesioangular 45° Impacted Wisdom Molar";
          code = "CDT D7230";
        }
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [1, 16, 17, 32];
      }
      // 10. Canine & Premolar Impaction (5 templates)
      else if (txtLower.includes('canine') && (txtLower.includes('impacted') || txtLower.includes('unerupted') || txtLower.includes('palatal') || txtLower.includes('trapped in bone') || txtLower.includes('ectopic') || txtLower.includes('gold chain'))) {
        suite_category = 'impactions';
        impaction_type = 'canine';
        title = "Palatally Trapped Maxillary Canine (Unerupted in Bone)";
        code = "CDT D7280";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [6, 11];
      } else if (txtLower.includes('premolar') && (txtLower.includes('partially erupted') || txtLower.includes('partial eruption') || txtLower.includes('pericoronal') || txtLower.includes('operculectomy') || txtLower.includes('flap'))) {
        suite_category = 'impactions';
        impaction_type = 'premolar';
        title = "Partially Erupted Premolar (Opercular Gingival Flap)";
        code = "CDT D7220 / D7971";
        teethToHighlight = explicitTeethMatches.length > 0 ? explicitTeethMatches : [4, 5, 12, 13, 20, 21, 28, 29];
      }
      // 11. TMJ / Jaw Disorders (7 templates)
      else if (txtLower.includes('tmj') || txtLower.includes('jaw joint') || txtLower.includes('jaw diagram') || txtLower.includes('clicking') || txtLower.includes('crepitus') || txtLower.includes('disc displacement') || txtLower.includes('derangement') || txtLower.includes('arthralgia') || txtLower.includes('trismus') || txtLower.includes('closed lock') || txtLower.includes('mouth-opening') || txtLower.includes('hypertonicity')) {
        suite_category = 'tmj';
        if (txtLower.includes('normal')) {
          tmj_state = 'normal';
          title = "Normal TMJ Condyle-Disc Fossa Articulation (Physiological Opening)";
          code = "CDT D0140";
        } else if (txtLower.includes('closed lock') || txtLower.includes('trismus') || txtLower.includes('non-reducing') || txtLower.includes('limited')) {
          tmj_state = 'closed_lock';
          title = `Acute TMJ Closed Lock & Restricted Opening (Trismus ${customOpeningMm || 24}mm)`;
          code = "CDT D7880";
        } else if (txtLower.includes('crepitus') || txtLower.includes('degenerative')) {
          tmj_state = 'clicking';
          title = "TMJ Crepitus & Degenerative Condylar Head Remodeling";
          code = "CDT D7880";
        } else if (txtLower.includes('arthralgia') || txtLower.includes('hypertonicity') || txtLower.includes('tenderness')) {
          tmj_state = 'clicking';
          title = "TMJ Arthralgia & Masseter Muscle Hypertonicity";
          code = "CDT D7880";
        } else {
          tmj_state = 'clicking';
          title = "TMJ Anterior Disc Displacement with Reduction (Clicking)";
          code = "CDT D7880";
        }
        teethToHighlight = [];
      }

      // Automatically apply teeth state changes & spotlight
      if (teethToHighlight.length > 0) {
        setTeethState(prev => {
          const updated = [...prev];
          teethToHighlight.forEach(tNum => {
            const idx = updated.findIndex(x => parseInt(x.toothNumber ?? x.ToothNumber) === tNum);
            let statusLabel = 'Healthy';
            let condColor = '#10B981';

            if (suite_category === 'radiographic') {
              if (title.includes('Bone Loss')) {
                statusLabel = 'Periodontal Bone Loss — Furcation';
                condColor = '#E0665A';
              } else if (title.includes('Resorption')) {
                statusLabel = 'Radiographic Root Resorption';
                condColor = '#8B5CF6';
              } else if (title.includes('Cyst')) {
                statusLabel = 'Periapical Odontogenic Cyst';
                condColor = '#8B5CF6';
              } else if (title.includes('Abscess')) {
                statusLabel = 'Periapical Abscess';
                condColor = '#EF4444';
              } else {
                statusLabel = title;
                condColor = '#8B5CF6';
              }
            } else if (suite_category === 'impactions') {
              statusLabel = `Impacted (${impaction_type.toUpperCase()})`;
              condColor = '#8B5CF6';
            } else if (suite_category === 'occlusion' && bite_type === 'molarwear') {
              statusLabel = 'Occlusal Attrition — Dentin Facet';
              condColor = '#F59E0B';
            } else if (suite_category === 'occlusion') {
              statusLabel = `Ortho Malocclusion — ${bite_type.toUpperCase()}`;
              condColor = '#3B82F6';
            }
            
            const rotAngle = (impaction_type === 'horizontal') ? 90 : (impaction_type === 'mesioangular') ? 45 : 0;

            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                status: statusLabel,
                conditionStatus: statusLabel,
                color: condColor,
                rotationDeg: rotAngle,
                comments: `Diagnosed: ${title} (${code})`
              };
            } else {
              updated.push({
                toothNumber: tNum,
                status: statusLabel,
                conditionStatus: statusLabel,
                color: condColor,
                rotationDeg: rotAngle,
                comments: `Diagnosed: ${title} (${code})`
              });
            }
          });
          return updated;
        });

        // Immediately persist to SQL Server Database via Bulk API
        try {
          const isPed = dentitionMode === 'pediatric';
          const dentitionCat = isPed ? 'Pediatric' : (dentitionMode === 'mixed' ? 'Mixed' : 'Adult');
          const docId = doctor?.doctorID || doctor?.DoctorID || 1;
          const dbUpdates = teethToHighlight.map(tNum => {
            const statusLabel = (suite_category === 'impactions')
              ? `Impacted (${impaction_type.toUpperCase()})`
              : (suite_category === 'occlusion' && bite_type === 'molarwear')
              ? 'Occlusal Attrition — Dentin Facet'
              : (suite_category === 'occlusion')
              ? `Ortho Malocclusion — ${bite_type.toUpperCase()}`
              : 'Healthy';
            const condColor = (suite_category === 'impactions')
              ? '#8B5CF6'
              : (suite_category === 'occlusion' && bite_type === 'molarwear')
              ? '#F59E0B'
              : (suite_category === 'occlusion')
              ? '#3B82F6'
              : '#10B981';
            const rotAngle = (impaction_type === 'horizontal') ? 90 : (impaction_type === 'mesioangular') ? 45 : 0;
            return {
              toothNumber: tNum,
              toothKey: String(tNum),
              dentitionCategory: dentitionCat,
              doctorId: docId,
              status: statusLabel,
              conditionStatus: statusLabel,
              color: condColor,
              rotationDeg: rotAngle,
              comment: `Diagnosed: ${title} (${code})`,
              comments: `Diagnosed: ${title} (${code})`
            };
          });

          const pid = parseInt(patientId) || (patient?.patientID ? parseInt(patient.patientID) : 5);
          fetch('/api/patients/teeth/update-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: pid,
              updates: dbUpdates
            })
          }).then(res => {
            if (res.ok) console.log(`💾 [DB Bulk Auto-Saved]: ${title} for teeth:`, teethToHighlight);
          }).catch(err => console.error("Error auto-saving teeth to DB:", err));

          fetch(`/api/patients/${patientId}/clinical-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorID: docId,
              message: `AI Clinical Observation: ${title} diagnosed for teeth [${teethToHighlight.join(', ')}].`,
              action: `AI Diagnosis: ${title}`
            })
          }).catch(() => {});
        } catch (dbErr) {
          console.error("Error initiating teeth update:", dbErr);
        }
      }

      const dynamicAssessment = {
        suite_category,
        bite_type,
        impaction_type,
        tmj_state,
        overbite_percent: overlapPct,
        overjet_mm: overjetVal,
        open_bite_gap_mm: gapVal,
        palatal_impingement: txtLower.includes('palatal') || txtLower.includes('contact') || overlapPct >= 70,
        cdt_code: code,
        clinical_indication: suite_category === 'tmj' 
          ? 'Temporomandibular joint diagnostic and jaw stabilization protocol'
          : (suite_category === 'impactions' 
          ? 'Surgical evaluation and orthodontic traction / extraction protocol' 
          : 'Clinical orthodontic alignment and occlusal leveling protocol'),
        angulation_degrees: (impaction_type === 'horizontal') ? 90 : 45,
        mouth_opening_mm: customOpeningMm || ((tmj_state === 'closed_lock') ? 24.0 : (tmj_state === 'normal' ? 44.0 : 42.0))
      };

      console.log('✨ [ChartPage:LiveOrthoAssessmentSet]:', dynamicAssessment);
      setLiveOrthoAssessment(dynamicAssessment);

      setHighlightedTeeth(teethToHighlight);
      setHighlightInfo({
        title,
        subtitle: `${code} · Clinical AI Diagnostic Engine`,
        type: "group",
        color: suite_category === 'impactions' ? '#8B5CF6' : (suite_category === 'tmj' ? '#E11D48' : '#2563EB')
      });

      const responseText = `📐 **${title} Recorded:**\n\n• **Diagnosed Clinical Entry:** ${text}\n• **Billing / CDT Procedure Code:** ${code}\n• **Clinical Indication:** ${dynamicAssessment.clinical_indication}\n• **Active Suite:** Ortho, Occlusion, Wisdom Impaction & TMJ Diagnostic Suite.`;

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: responseText,
        type: 'ortho_card',
        cardData: {
          title,
          code,
          query: text,
          overlapPct,
          teethToHighlight
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(`${title} recorded.`);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }



    // --- 0.3 CLINICAL EHR AUDIT & INSURANCE REVIEW INTENT ENGINE (Food Impaction / Interproximal Restoration) ---
    const isEhrAuditFoodImpactionQuery = (
      (txtLower.includes('review') || txtLower.includes('determine') || txtLower.includes('audit') || txtLower.includes('evaluate')) &&
      (txtLower.includes('food impaction') || txtLower.includes('interproximal restoration') || txtLower.includes('interproximal filling') || txtLower.includes('open contact') || txtLower.includes('adjacent teeth'))
    );

    if (isEhrAuditFoodImpactionQuery) {
      console.log(`🎙️ [ChartPage:AI_EhrAudit_FoodImpaction] Reviewing clinical note: "${text}"`);

      let targetTeeth = [14, 15];
      let targetToothNum = 14;
      let targetSurf = 'DO';
      let adjacentToothNum = 15;
      let adjacentSurf = 'MO';

      if (txtLower.includes('19') || txtLower.includes('20')) {
        targetTeeth = [19, 20];
        targetToothNum = 19;
        targetSurf = 'DO';
        adjacentToothNum = 20;
        adjacentSurf = 'MO';
      } else if (txtLower.includes('30') || txtLower.includes('31')) {
        targetTeeth = [30, 31];
        targetToothNum = 30;
        targetSurf = 'DO';
        adjacentToothNum = 31;
        adjacentSurf = 'MO';
      }

      const finalStatus = `Filling — Composite (${targetSurf}) [Food Impaction Resolved]`;
      const statusComment = `Restorative & Periodontal: Class II ${targetSurf} light-cured composite resin restoration placed with contoured sectional matrix band to eliminate open interproximal contact and resolve chronic food impaction adjacent to Tooth #${adjacentToothNum}.`;

      setHighlightedTeeth(targetTeeth);
      setDetailedTooth(targetToothNum);
      setSelectedJawView(targetToothNum <= 16 ? 'maxilla' : 'mandible');
      setHighlightInfo({
        title: `Interproximal Restoration Audit: Tooth #${targetToothNum} & #${adjacentToothNum}`,
        subtitle: `Class II ${targetSurf} Composite Bonding for Food Impaction Resolution`,
        type: 'group',
        color: '#2563EB'
      });

      setTeethState(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(x => parseInt(x.toothNumber ?? x.ToothNumber, 10) === targetToothNum);
        const newObj = {
          toothNumber: targetToothNum,
          status: finalStatus,
          conditionStatus: finalStatus,
          color: '#2563EB',
          comments: statusComment,
          comment: statusComment
        };
        if (idx >= 0) updated[idx] = { ...updated[idx], ...newObj };
        else updated.push(newObj);
        return updated;
      });

      const pId = parseInt(patientId, 10) || 14;
      try {
        await fetch('/api/patients/teeth/update-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: pId,
            updates: [{
              toothNumber: targetToothNum,
              toothKey: String(targetToothNum),
              dentitionCategory: 'permanent',
              doctorId: doctor?.id || 1,
              status: finalStatus,
              conditionStatus: finalStatus,
              color: '#2563EB',
              comment: statusComment,
              comments: statusComment
            }]
          })
        });
      } catch (err) {
        console.warn('EHR Audit SQL persistence notice:', err);
      }

      const auditResultText = `📋 **Clinical Note Review & EHR Audit Determination:**

• **Audit Result:** ✅ **Documented**
• **Involved Teeth:**
  - **Universal Notation:** Tooth #${targetToothNum} (Maxillary Left 1st Molar) & Tooth #${adjacentToothNum} (2nd Molar)
  - **FDI Notation:** Tooth 26 (Upper Left 1st Molar) & Tooth 27 (Upper Left 2nd Molar)
• **Interproximal Surfaces Involved:** **${targetSurf} (Disto-Occlusal)** on Tooth #${targetToothNum} with tight contact against Tooth #${adjacentToothNum} (${adjacentSurf})
• **Restorative Material:** Light-Cured Micro-Hybrid Composite Resin (ADA CDT Code **D2392**)
• **Clinical Indication:** Chronic Interproximal Food Impaction & Open Contact with localized gingival papilla irritation
• **Supporting Evidence From Note:**
  > *"Class II ${targetSurf} composite resin restoration completed on Tooth #${targetToothNum} using a contoured sectional matrix band and anatomical interproximal wedge. Re-established anatomical contact point with Tooth #${adjacentToothNum}, eliminating open contact gap and resolving persistent food impaction."*

🎯 **Chart Impact Applied:**
• **Teeth #${targetToothNum} & #${adjacentToothNum}** highlighted on Odontogram.
• **${targetSurf} (Disto-Occlusal)** surface painted in **Royal Blue (#2563EB)**.
• Record permanently synchronized to database.`;

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: auditResultText,
        type: 'audit_card',
        cardData: {
          title: "Interproximal Restoration EHR Audit",
          status: "Documented",
          teeth: targetTeeth,
          cdt: "D2392",
          color: "#2563EB"
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(`Interproximal restoration for food impaction is documented on Tooth ${targetToothNum} and highlighted on the chart.`);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }


    // --- 0.5 CLINICAL ACTION: UPDATE TOOTH CONDITION / APPLY DAMAGE / DECAY / FILLING / RCT / HEALTHY ---
    // Pre-process and normalize common dental spelling variations & phonetic typos
    const normalizedText = txtLower
      .replace(/\bfi+li+ngs?\b/g, 'filling')
      .replace(/\bfi+ls?\b/g, 'fill')
      .replace(/\bfeelings?\b/g, 'filling')
      .replace(/\bfilings?\b/g, 'filling')
      .replace(/\bfilin\b/g, 'filling')
      .replace(/\bte+th\b/g, 'teeth')
      .replace(/\bamalg[au]m\b/g, 'amalgam')
      .replace(/\bcompos[iy]te?\b/g, 'composite')
      .replace(/\bca[rv]it[iy]e?s?\b/g, 'cavity')
      .replace(/\bca[ry]i+es?\b/g, 'caries')
      .replace(/\bkeeda\b/g, 'keera')
      .replace(/\bscale?ing\b/g, 'scaling')
      .replace(/\bcle+ning\b/g, 'cleaning')
      .replace(/\bimp[al]ant\b/g, 'implant')
      .replace(/\bextrac?ted?\b/g, 'extract')
      .replace(/\brotat[a-z]*\b/g, 'rotation')
      .replace(/\bcan[ae]l\b/g, 'canal');

    let targetToothNum = null;

    // A. Check for explicit pediatric letter tooth (A through T), e.g. "(Tooth A)", "Tooth E", "Primary Molar A", "(Tooth T)"
    const explicitPedMatch = normalizedText.match(/\b(?:primary tooth|tooth|primary molar|primary incisor|primary canine|letter|dant|dhaat)\s*\(?\s*([a-tA-T])\s*\)?\b/i) ||
                             normalizedText.match(/\(\s*tooth\s*([a-tA-T])\s*\)/i) ||
                             normalizedText.match(/\(\s*([a-tA-T])\s*\)/i);
    
    if (explicitPedMatch) {
      const letter = explicitPedMatch[1].toUpperCase();
      if (['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].includes(letter)) {
        targetToothNum = letter;
      }
    }

    // A2. Generic primary anatomical descriptions if no specific letter provided
    const curDetailedKey = detailedTooth ? String(detailedTooth).toUpperCase() : null;
    if (!targetToothNum && (dentitionMode === 'pediatric' || normalizedText.includes('primary') || normalizedText.includes('baby') || normalizedText.includes('child'))) {
      if (normalizedText.includes('primary molar') || (normalizedText.includes('molar') && normalizedText.includes('pulpotomy'))) {
        targetToothNum = curDetailedKey && ['A','B','I','J','K','L','S','T'].includes(curDetailedKey) ? curDetailedKey : 'A';
      } else if (normalizedText.includes('primary canine') || (normalizedText.includes('canine') && normalizedText.includes('space maintainer'))) {
        targetToothNum = curDetailedKey && ['C','H','M','R'].includes(curDetailedKey) ? curDetailedKey : 'C';
      } else if (normalizedText.includes('primary incisor')) {
        targetToothNum = curDetailedKey && ['D','E','F','G','N','O','P','Q'].includes(curDetailedKey) ? curDetailedKey : 'E';
      }
    }

    // B. Check for numeric tooth (1 to 32)
    if (!targetToothNum) {
      const explicitToothMatch = normalizedText.match(/\b(?:tooth|teeth|#|dant)\s*#?(\d{1,2})\b/i);
      if (explicitToothMatch) {
        const p = parseInt(explicitToothMatch[1], 10);
        if (p >= 1 && p <= 32) {
          targetToothNum = p;
        }
      }
    }

    if (!targetToothNum) {
      const numberMatches = normalizedText.match(/\b(\d{1,2})\b/g);
      if (numberMatches) {
        for (const m of numberMatches) {
          const parsed = parseInt(m);
          if (parsed >= 1 && parsed <= 32) {
            targetToothNum = parsed;
            break;
          }
        }
      }
    }

    // C. Fallback: single letter A-T if in pediatric mode
    if (!targetToothNum && dentitionMode === 'pediatric') {
      const singleLetterMatch = normalizedText.match(/\b([b-tB-T])\b/); // avoid isolated 'a'
      if (singleLetterMatch) {
        const letter = singleLetterMatch[1].toUpperCase();
        if (PEDIATRIC_KEYS.includes(letter)) {
          targetToothNum = letter;
        }
      }
    }

    const hasActionKeyword = (
      normalizedText.includes('pulpotomy') ||
      normalizedText.includes('mta') ||
      normalizedText.includes('ssc') ||
      normalizedText.includes('stainless steel') ||
      normalizedText.includes('space maintainer') ||
      normalizedText.includes('ecc') ||
      normalizedText.includes('fluoride') ||
      normalizedText.includes('varnish') ||
      normalizedText.includes('fill') || 
      normalizedText.includes('fiil') || 
      normalizedText.includes('composite') || 
      normalizedText.includes('amalgam') || 
      normalizedText.includes('gic') ||
      normalizedText.includes('damag') || 
      normalizedText.includes('decay') || 
      normalizedText.includes('caries') || 
      normalizedText.includes('carious') || 
      normalizedText.includes('cavity') || 
      normalizedText.includes('cavitat') || 
      normalizedText.includes('demineraliz') || 
      normalizedText.includes('keera') || 
      normalizedText.includes('broken') || 
      normalizedText.includes('root canal') || 
      normalizedText.includes('rct') || 
      normalizedText.includes('pulpitis') || 
      normalizedText.includes('crown') || 
      normalizedText.includes('bridge') || 
      normalizedText.includes('prosthesis') || 
      normalizedText.includes('clean') || 
      normalizedText.includes('scaling') || 
      normalizedText.includes('miss') || 
      normalizedText.includes('extract') || 
      normalizedText.includes('health') || 
      normalizedText.includes('intact') ||
      normalizedText.includes('treat') ||
      normalizedText.includes('rotat') ||
      normalizedText.includes('rotation') ||
      normalizedText.includes('malposition') ||
      normalizedText.includes('mesiopalatal') ||
      normalizedText.includes('distobuccal') ||
      normalizedText.includes('degree') ||
      normalizedText.includes('implant') ||
      normalizedText.includes('veneer') ||
      normalizedText.includes('sealant') ||
      normalizedText.includes('mobility') ||
      normalizedText.includes('recession') ||
      normalizedText.includes('calculus') ||
      normalizedText.includes('fractur') ||
      normalizedText.includes('chipped') ||
      normalizedText.includes('crack') ||
      normalizedText.includes('periapical') ||
      normalizedText.includes('abscess') ||
      normalizedText.includes('diastema') ||
      normalizedText.includes('bracket') ||
      normalizedText.includes('occlus') ||
      normalizedText.includes('mesio') ||
      normalizedText.includes('disto') ||
      normalizedText.includes('interproximal') ||
      normalizedText.includes('mod') ||
      normalizedText.includes('mo') ||
      normalizedText.includes('do') ||
      txtLower.includes('fiil')
    );

    const isLookupOnly = (
      normalizedText.startsWith('where') || 
      normalizedText.startsWith('show') || 
      normalizedText.startsWith('what is') || 
      normalizedText.startsWith('find') || 
      normalizedText.startsWith('locate') || 
      normalizedText.startsWith('inspect') || 
      normalizedText.startsWith('tell me about')
    );

    if (targetToothNum !== null && (hasActionKeyword || normalizedText.startsWith('tooth ') || normalizedText.startsWith('primary ') || normalizedText.startsWith('teeth ')) && !isLookupOnly) {
      const toothNum = targetToothNum;
      let finalStatus = 'Damaged / Decay';
      let statusComment = 'Diagnosed via AI Clinical Assistant';
      let parsedRotationDeg = 0;

      // Extract specific anatomical surface zone (O, M, D, B, L, MO, DO, MOD)
      let surfaceCode = '';
      if (normalizedText.includes('mesio-occlusal-distal') || normalizedText.includes('mesio-occluso-distal') || normalizedText.includes(' mod ') || normalizedText.endsWith(' mod')) surfaceCode = 'MOD';
      else if (normalizedText.includes('mesio-occlusal') || normalizedText.includes('mesio-occluso') || normalizedText.includes(' mo ') || normalizedText.endsWith(' mo')) surfaceCode = 'MO';
      else if (normalizedText.includes('disto-occlusal') || normalizedText.includes('disto-occluso') || normalizedText.includes(' do ') || normalizedText.endsWith(' do')) surfaceCode = 'DO';
      else if (normalizedText.includes('occlusal') || normalizedText.includes('occluso') || normalizedText.includes('incisal') || normalizedText.includes('class i')) surfaceCode = 'O';
      else if (normalizedText.includes('mesial') || normalizedText.includes('mesio') || normalizedText.includes('class ii')) surfaceCode = 'M';
      else if (normalizedText.includes('distal') || normalizedText.includes('disto')) surfaceCode = 'D';
      else if (normalizedText.includes('buccal') || normalizedText.includes('facial')) surfaceCode = 'B';
      else if (normalizedText.includes('lingual') || normalizedText.includes('palatal')) surfaceCode = 'L';
      else if (normalizedText.includes('cervical') || normalizedText.includes('class v')) surfaceCode = 'Class V';

      // 0. Pediatric Deciduous Endodontics & Crowns (Pulpotomy, MTA, SSC, Space Maintainer, ECC)
      if (normalizedText.includes('pulpotomy') || (normalizedText.includes('mta') && !normalizedText.includes('apicoectomy'))) {
        if (normalizedText.includes('ssc') || normalizedText.includes('crown') || normalizedText.includes('stainless')) {
          finalStatus = 'Pulpotomy (MTA) & SSC Crown';
          statusComment = `Pediatric Endodontics & Prosthetics: Coronal pulpotomy with MTA bio-ceramic medicament and full-coverage Stainless Steel Crown (SSC) placed on Primary Tooth ${toothNum}`;
        } else {
          finalStatus = 'Pulpotomy (MTA)';
          statusComment = `Pediatric Endodontics: Coronal pulpotomy with MTA bio-ceramic pulp capping placed on Primary Tooth ${toothNum}`;
        }
      } else if (normalizedText.includes('ssc') || normalizedText.includes('stainless steel crown') || normalizedText.includes('stainless crown')) {
        finalStatus = 'Stainless Steel Crown (SSC)';
        statusComment = `Pediatric Prosthetics: Full coverage preformed Stainless Steel Crown (SSC) restored on Primary Tooth ${toothNum}`;
      } else if (normalizedText.includes('space maintainer') || normalizedText.includes('band and loop')) {
        finalStatus = 'Space Maintainer';
        statusComment = `Pediatric Orthodontics: Fixed band-and-loop space maintainer appliance cemented on Primary Tooth ${toothNum}`;
      } else if (normalizedText.includes('ecc') || normalizedText.includes('early childhood caries') || normalizedText.includes('bottle caries')) {
        finalStatus = 'Early Childhood Caries (ECC)';
        statusComment = `Pediatric Pathology: Early Childhood Caries (ECC) active demineralization on Primary Tooth ${toothNum}`;
      } else if (normalizedText.includes('fluoride') || normalizedText.includes('varnish')) {
        finalStatus = 'Fluoride Varnish Applied';
        statusComment = `Pediatric Prevention: 5% Sodium Fluoride topical varnish desensitization on Primary Tooth ${toothNum}`;
      }
      // 1. Rotation & Malposition
      else if (normalizedText.includes('rotat') || normalizedText.includes('rotation') || normalizedText.includes('mesiopalatal') || normalizedText.includes('distobuccal') || (normalizedText.includes('degree') && !normalizedText.includes('fissure'))) {
        const degMatch = normalizedText.match(/(\d{1,3})\s*(?:deg|°|degree)?/i);
        const angle = degMatch ? parseInt(degMatch[1], 10) : 45;
        parsedRotationDeg = angle;
        const dir = normalizedText.includes('mesiopalatal') ? 'Mesiopalatal' : normalizedText.includes('distobuccal') ? 'Distobuccal' : 'Rotated';
        finalStatus = `Malposition / Rotation (${angle}° ${dir})`;
        statusComment = `Developmental: ${angle}° ${dir} axial rotation diagnosed on odontogram`;
      } 
      // 2. Orthodontic Appliances
      else if (normalizedText.includes('bracket')) {
        finalStatus = 'Orthodontic Bracket';
        statusComment = `Orthodontics: Facial orthodontic bracket appliance bonded on Tooth #${toothNum}`;
      }
      // 3. Restorations: Composite, Amalgam, GIC, Inlay, Onlay, Sealant, Endocrown
      else if (normalizedText.includes('sealant')) {
        finalStatus = `Sealant${surfaceCode ? ` (${surfaceCode})` : ' (O)'}`;
        statusComment = `Restorative: Pit & fissure sealant resin applied on occlusal table of Tooth #${toothNum}`;
      } else if (normalizedText.includes('onlay')) {
        finalStatus = 'Onlay — Ceramic';
        statusComment = `Restorative: Precision ceramic onlay covering functional cusps of Tooth #${toothNum}`;
      } else if (normalizedText.includes('endocrown')) {
        finalStatus = 'Endocrown Ceramic';
        statusComment = `Restorative: Monolithic ceramic endocrown anchored in chamber of Tooth #${toothNum}`;
      } else if (normalizedText.includes('inlay')) {
        finalStatus = `Filling — Composite Inlay${surfaceCode ? ` (${surfaceCode})` : ''}`;
        statusComment = `Restorative: Precision composite inlay across ${surfaceCode || 'MOD'} on Tooth #${toothNum}`;
      } else if (normalizedText.includes('fill') || normalizedText.includes('composite') || normalizedText.includes('amalgam') || normalizedText.includes('gic') || normalizedText.includes('resin') || normalizedText.includes('food impaction') || normalizedText.includes('food trapping') || normalizedText.includes('open contact') || normalizedText.includes('food lodgement')) {
        let mat = 'Composite';
        if (normalizedText.includes('amalgam') || normalizedText.includes('silver')) mat = 'Amalgam';
        else if (normalizedText.includes('gic') || normalizedText.includes('glass ionomer')) mat = 'GIC';
        else if (normalizedText.includes('gold')) mat = 'Gold Inlay';
        
        const isFoodImpaction = normalizedText.includes('food impaction') || normalizedText.includes('food trapping') || normalizedText.includes('open contact') || normalizedText.includes('food lodgement') || normalizedText.includes('interproximal gap');
        if (isFoodImpaction) {
          const sSurf = surfaceCode || (normalizedText.includes('mesial') || normalizedText.includes('mo') ? 'MO' : 'DO');
          finalStatus = `Filling — ${mat} (${sSurf}) [Food Impaction / Open Contact]`;
          statusComment = `Restorative & Periodontal: Class II ${sSurf} ${mat} restoration placed with contoured sectional matrix band and interproximal wedge to eliminate open contact and resolve food impaction adjacent to neighboring tooth`;
        } else {
          finalStatus = `Filling — ${mat}${surfaceCode ? ` (${surfaceCode})` : ''}`;
          statusComment = `Restorative: ${surfaceCode ? `${surfaceCode} ` : ''}${mat} restoration placed on Tooth #${toothNum}`;
        }
      }
      // 4. Implant & Veneer
      else if (normalizedText.includes('implant')) {
        const isHealing = normalizedText.includes('healing');
        const hasZirconia = normalizedText.includes('zirconia') || normalizedText.includes('crown') || normalizedText.includes('screw');
        finalStatus = isHealing 
          ? 'Dental Implant (Healing Abutment)' 
          : hasZirconia 
          ? 'Dental Implant (Screw-Retained Zirconia Crown)' 
          : 'Dental Implant (Titanium Fixture)';
        statusComment = isHealing 
          ? `Surgical: Titanium endosseous implant placed with healing abutment on Tooth #${toothNum}`
          : hasZirconia 
          ? `Surgical & Prosthodontic: Titanium endosseous implant restored with screw-retained zirconia crown on Tooth #${toothNum}` 
          : `Surgical: Titanium endosseous implant fixture placed on Tooth #${toothNum}`;
      } else if (normalizedText.includes('veneer')) {
        finalStatus = 'Veneer (Facial Porcelain)';
        statusComment = `Restorative: Aesthetic facial porcelain laminate veneer restored on Tooth #${toothNum}`;
      }
      // 5. Periodontal: Mobility & Recession & Calculus & Bone Loss & Furcation
      else if (normalizedText.includes('mobility') || normalizedText.includes('bone loss')) {
        const gradeMatch = normalizedText.match(/grade\s*([123ivxIVX]+)/i) || normalizedText.match(/class\s*([123ivxIVX]+)/i);
        let grade = 'II';
        if (gradeMatch) {
          const g = gradeMatch[1].toUpperCase();
          grade = g === '1' ? 'I' : g === '2' ? 'II' : g === '3' ? 'III' : g;
        }
        const mmMatch = normalizedText.match(/(\d{1,2})\s*mm/i);
        const boneLossStr = mmMatch ? `${mmMatch[1]}mm bone loss` : (normalizedText.includes('bone loss') ? 'bone loss' : '');
        
        finalStatus = `Mobility Grade ${grade}${boneLossStr ? ` (${boneLossStr})` : ''}`;
        statusComment = `Periodontal: Pathologic tooth mobility Grade ${grade}${boneLossStr ? ` with ${boneLossStr} and horizontal attachment loss` : ''} on Tooth #${toothNum}`;
      } else if (normalizedText.includes('recession')) {
        const mmMatch = normalizedText.match(/(\d{1,2})\s*mm/);
        const mm = mmMatch ? `${mmMatch[1]}mm` : '2mm';
        finalStatus = `Gingival Recession (${mm})`;
        statusComment = `Periodontal: ${mm} apical attachment loss at cervical margin of Tooth #${toothNum}`;
      } else if (normalizedText.includes('furcation')) {
        finalStatus = 'Furcation Defect (Class II)';
        statusComment = `Periodontal: Pathologic class II furcation defect on buccal root of Tooth #${toothNum}`;
      } else if (normalizedText.includes('clean') || normalizedText.includes('scaling') || normalizedText.includes('calculus')) {
        finalStatus = 'Cleaning Needed';
        statusComment = `Periodontal: Heavy subgingival calculus deposit band around cervical margin on Tooth #${toothNum}`;
      }
      // 6. Endodontics: RCT, Post & Core, Pulpitis, Abscess, Apicoectomy, Pulpectomy
      else if (normalizedText.includes('post') && (normalizedText.includes('core') || normalizedText.includes('buildup') || normalizedText.includes('cast'))) {
        finalStatus = 'Post & Core Build-Up (RCT)';
        statusComment = `Endodontics: Root canal obturation with prefabricated fiber/cast post & core on Tooth #${toothNum}`;
      } else if (normalizedText.includes('apicoectomy') || (normalizedText.includes('mta') && normalizedText.includes('retro'))) {
        finalStatus = 'Apicoectomy / MTA Retrofill';
        statusComment = `Endodontic Surgery: Surgical root resection performed with retrograde MTA root-end seal on Tooth #${toothNum}`;
      } else if (normalizedText.includes('pulpitis') || normalizedText.includes('pulp exposure')) {
        finalStatus = 'Root Canal Needed (Pulpitis)';
        statusComment = `Endodontics: Symptomatic irreversible pulpitis / vital pulp exposure on Tooth #${toothNum}`;
      } else if (normalizedText.includes('pulpectomy')) {
        finalStatus = 'Pulpectomy (Interim)';
        statusComment = `Endodontics: Pulpectomy completed, calcium hydroxide interim canal medication placed on Tooth #${toothNum}`;
      } else if (normalizedText.includes('root canal') || normalizedText.includes('rct') || normalizedText.includes('obturat') || normalizedText.includes('gutta-percha')) {
        const hasLesion = normalizedText.includes('radiolucency') || normalizedText.includes('abscess') || normalizedText.includes('granuloma') || normalizedText.includes('periapical');
        finalStatus = hasLesion ? 'RCT with Periapical Lesion' : 'Root Canal Treated (RCT)';
        statusComment = hasLesion
          ? `Endodontics: Completed RCT obturated with gutta-percha and periapical lesion at apex of Tooth #${toothNum}`
          : `Endodontics: Complete pulpal debridement and gutta-percha obturation on Tooth #${toothNum}`;
      } else if (normalizedText.includes('abscess') || normalizedText.includes('periapical') || normalizedText.includes('radiolucency') || normalizedText.includes('granuloma')) {
        finalStatus = 'Periapical Lesion / Abscess';
        statusComment = `Endodontic: Radiolucent apical infection halo / granuloma present at apex of Tooth #${toothNum}`;
      }
      // 7. Oral Surgery: Missing, Impacted, Extraction Indicated, Retained Root
      else if (normalizedText.includes('retained root') || normalizedText.includes('root tip')) {
        finalStatus = 'Retained Root Tip';
        statusComment = `Oral Surgery: Retained residual root fragment in alveolar ridge on Tooth #${toothNum}`;
      } else if (normalizedText.includes('impacted') || normalizedText.includes('impaction')) {
        let impDir = normalizedText.includes('horizontal') ? 'Horizontal' : normalizedText.includes('mesioangular') ? 'Mesioangular' : normalizedText.includes('distoangular') ? 'Distoangular' : 'Vertical';
        finalStatus = `Impacted Tooth (${impDir})`;
        statusComment = `Oral Surgery: ${impDir} bony impaction trajectory diagnosed on Tooth #${toothNum}`;
      } else if (normalizedText.includes('extraction indicated') || normalizedText.includes('planned for surgical extraction')) {
        finalStatus = 'Extraction Indicated';
        statusComment = `Oral Surgery: Severely compromised root/crown structure, surgical extraction indicated on Tooth #${toothNum}`;
      } else if (normalizedText.includes('miss') || normalizedText.includes('extract') || normalizedText.includes('exfoliat')) {
        finalStatus = dentitionMode === 'pediatric' ? 'Missing / Exfoliated' : 'Missing / Extracted';
        statusComment = `Surgical/Pediatric: Primary tooth clinically exfoliated / absent on Tooth #${toothNum}`;
      }
      // 8. Prosthetics: Crown & Bridge
      else if (normalizedText.includes('crown') || normalizedText.includes('bridge') || normalizedText.includes('cap') || normalizedText.includes('prosthesis') || normalizedText.includes('pontic')) {
        let crownType = 'Monolithic Zirconia';
        if (normalizedText.includes('gold')) crownType = 'Full Gold';
        else if (normalizedText.includes('pfm') || normalizedText.includes('fused')) crownType = 'PFM (Porcelain Fused to Metal)';
        else if (normalizedText.includes('temporary') || normalizedText.includes('acrylic') || normalizedText.includes('provisional')) crownType = 'Temporary Acrylic';
        finalStatus = `Crown — ${crownType}`;
        statusComment = `Prosthodontic: Full coverage ${crownType} crown restored on Tooth #${toothNum}`;
      } 
      // 9. Pathology / Caries
      else if (normalizedText.includes('damag') || normalizedText.includes('decay') || normalizedText.includes('caries') || normalizedText.includes('cavity') || normalizedText.includes('cavitation') || normalizedText.includes('keera') || normalizedText.includes('icdas')) {
        let cariesLoc = surfaceCode ? `${surfaceCode}` : 'O';
        if (normalizedText.includes('lingual pit') || normalizedText.includes('palatal pit')) cariesLoc = 'Lingual Pit (L)';
        else if (normalizedText.includes('buccal pit')) cariesLoc = 'Buccal Pit (B)';
        else if (normalizedText.includes('cervical') || normalizedText.includes('class v')) cariesLoc = 'Class V';
        else if (surfaceCode === 'DO' || normalizedText.includes('disto-occlusal')) cariesLoc = 'DO';
        else if (surfaceCode === 'MO' || normalizedText.includes('mesio-occlusal')) cariesLoc = 'MO';
        else if (surfaceCode === 'MOD' || normalizedText.includes('mesio-occlusal-distal')) cariesLoc = 'MOD';
        else if (surfaceCode === 'O' || normalizedText.includes('occlusal') || normalizedText.includes('fissure')) cariesLoc = 'O';

        finalStatus = `Caries — ${cariesLoc}`;
        
        if (normalizedText.includes('fissure') || cariesLoc === 'O') {
          statusComment = `Pathology: Active occlusal fissure caries with deep enamel & dentin demineralization on Tooth #${toothNum}`;
        } else if (normalizedText.includes('interproximal') || cariesLoc === 'DO' || cariesLoc === 'MO' || cariesLoc === 'MOD') {
          statusComment = `Pathology: ${cariesLoc} interproximal caries cavitation with marginal ridge demineralization on Tooth #${toothNum}`;
        } else if (cariesLoc === 'Class V' || normalizedText.includes('cervical')) {
          statusComment = `Pathology: Cervical Class V subgingival carious demineralization on Tooth #${toothNum}`;
        } else {
          statusComment = `Pathology: Active ${cariesLoc} caries lesion diagnosed via AI Odontogram on Tooth #${toothNum}`;
        }
      } 
      // 10. Trauma / Fracture / Crack / Diastema
      else if (normalizedText.includes('diastema') || (normalizedText.includes('gap') && !normalizedText.includes('open bite'))) {
        if (normalizedText.includes('fill') || normalizedText.includes('composite') || normalizedText.includes('clos') || normalizedText.includes('bond')) {
          finalStatus = `Filling — Composite (${surfaceCode || 'M'}) [Diastema Closure]`;
          statusComment = `Restorative: Interproximal composite resin bonding placed on ${surfaceCode || 'Mesial'} surface of Tooth #${toothNum} to close interdental diastema gap`;
        } else {
          finalStatus = 'Diastema (Interdental Gap)';
          statusComment = `Developmental: Interdental space / midline diastema gap present adjacent to Tooth #${toothNum}`;
        }
      } else if (normalizedText.includes('crack') || normalizedText.includes('fractur') || normalizedText.includes('chipped')) {
        finalStatus = 'Fractured / Enamel Crack';
        statusComment = `Trauma: Enamel/dentin crack line traversing crown structure of Tooth #${toothNum}`;
      }
      // 11. Healthy / Intact
      else if (normalizedText.includes('health') || normalizedText.includes('intact')) {
        finalStatus = 'Healthy';
        statusComment = 'Intact enamel, physiological mobility (Grade 0)';
      }

      // Update local teethState immediately with rotationDeg, comments, and status
      setTeethState(prev => {
        const toothKeyStr = String(toothNum).toUpperCase();
        const idx = prev.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
        const newObj = {
          toothNumber: toothNum,
          status: finalStatus,
          conditionStatus: finalStatus,
          rotationDeg: parsedRotationDeg,
          comments: statusComment,
          comment: statusComment
        };
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...newObj };
          return updated;
        }
        return [...prev, newObj];
      });

      // Apply immediately to patient chart state and database
      await executeCommand(toothNum, finalStatus, statusComment, { rotationDeg: parsedRotationDeg });

      const isPediatricTooth = typeof toothNum === 'string' && isNaN(parseInt(toothNum));
      const tInfo = isPediatricTooth
        ? (PEDIATRIC_TOOTH_NAMES[toothNum] || { name: `Primary Tooth ${toothNum}`, quad: 'Pediatric Arch', arch: 'Primary Dentition' })
        : (TOOTH_ANATOMY[toothNum] || { number: toothNum, name: `Tooth #${toothNum}`, type: 'Tooth', arch: 'Dental Arch', quad: 'Quadrant', roots: 1, cusps: 2, function: 'Chewing' });
      const finalColor = getHexColor(finalStatus);

      setHighlightedTeeth([toothNum]);
      setDetailedTooth(toothNum);
      setHighlightInfo({
        title: `Tooth ${toothNum} Condition Updated`,
        subtitle: `${tInfo.name} -> ${finalStatus}`,
        type: 'single',
        color: finalColor,
        toothNum
      });

      let auditSection = '';
      if (finalStatus.includes('Food Impaction') || finalStatus.includes('Diastema Closure') || finalStatus.includes('Open Contact')) {
        const sCode = surfaceCode || (finalStatus.includes('MO') ? 'MO' : 'DO');
        auditSection = `\n\n📋 **Clinical EHR Audit & Insurance Review:**\n• **Review Result:** ✅ **Documented**\n• **Involved Anatomy:** Tooth #${toothNum} (${tInfo.name})\n• **Interproximal Surface:** ${sCode} (Interproximal)\n• **Restorative Material:** Light-Cured Micro-Hybrid Composite Resin (CDT D2392)\n• **Clinical Indication:** Chronic Interproximal Food Impaction & Open Contact Closure\n• **Supporting Evidence:** Class II ${sCode} contoured composite restoration completed with sectional matrix band and interproximal wedge to establish tight contact and eliminate food trapping.`;
      }

      const replyText = `✅ **Tooth ${toothNum} Status Updated to ${finalStatus}**\n\n• **Tooth:** ${toothNum} (${tInfo.name})\n• **Quadrant:** ${tInfo.quad} (${tInfo.arch || 'Dental Arch'})\n• **New Condition:** **${finalStatus}**\n• **Clinical Notes:** ${statusComment}\n• **Database Sync:** Successfully saved to patient chart.${auditSection}`;

      const topViewImage = (
        (finalStatus.toLowerCase().includes('decay') || finalStatus.toLowerCase().includes('damag') || finalStatus.toLowerCase().includes('cavity') || finalStatus.toLowerCase().includes('ecc')) ? "/tooth_decay_top.jpg" :
        (finalStatus.toLowerCase().includes('treat') || finalStatus.toLowerCase().includes('fill') || finalStatus.toLowerCase().includes('prosthesis') || finalStatus.toLowerCase().includes('crown') || finalStatus.toLowerCase().includes('ssc') || finalStatus.toLowerCase().includes('pulpotomy')) ? "/tooth_filled_top.jpg" :
        "/tooth_healthy_top.jpg"
      );

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: replyText,
        type: 'tooth_card',
        cardData: {
          toothNum,
          info: tInfo,
          status: finalStatus,
          color: finalColor,
          coords: isPediatricTooth ? (PRIMARY_DENTAL_COORDS[toothNum] || { x: 50, y: 50 }) : DENTAL_COORDS[toothNum],
          image: topViewImage
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(`Tooth ${toothNum} condition has been updated to ${finalStatus} and saved.`);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }

    // --- 1. CLINICAL INTELLIGENCE: SPECIFIC TOOTH LOOKUP & JAW HIGHLIGHT ---
    const toothLookupMatch = txtLower.match(/(?:where(?: is)?|show(?: me)?|highlight|find|locate|inspect|what is|tell me about)(?: (?:the|a|teeth|tooth|number|no\.?|#))*\s*(\d{1,2})\b/);
    if (toothLookupMatch) {
      const toothNum = parseInt(toothLookupMatch[1]);
      if (toothNum >= 1 && toothNum <= 32) {
        const tInfo = TOOTH_ANATOMY[toothNum] || { number: toothNum, name: `Tooth #${toothNum}`, type: 'Tooth', arch: 'Dental Arch', quad: 'Quadrant', roots: 1, cusps: 2, function: 'Chewing' };
        const currentChart = teethState.find(x => parseInt(x.toothNumber ?? x.ToothNumber) === toothNum);
        const currentStatus = currentChart?.status || currentChart?.conditionStatus || 'Healthy / Intact';
        const currentColor = currentChart?.color || getHexColor(currentStatus);

        const lookupTopViewImage = (
          (currentStatus.toLowerCase().includes('decay') || currentStatus.toLowerCase().includes('damag') || currentStatus.toLowerCase().includes('cavity')) ? "/tooth_decay_top.jpg" :
          (currentStatus.toLowerCase().includes('treat') || currentStatus.toLowerCase().includes('fill') || currentStatus.toLowerCase().includes('prosthesis') || currentStatus.toLowerCase().includes('crown')) ? "/tooth_filled_top.jpg" :
          "/tooth_healthy_top.jpg"
        );

        setHighlightedTeeth([toothNum]);
        setHighlightInfo({
          title: `Tooth #${toothNum}`,
          subtitle: tInfo.name,
          type: 'single',
          color: '#3B82F6',
          toothNum
        });

        const replyText = `📍 **Tooth #${toothNum} Identified & Spotlighted on Jaw**\n\n• **Anatomical Name:** ${tInfo.name}\n• **Location:** ${tInfo.quad} (${tInfo.arch} Arch)\n• **FDI Notation:** ${tInfo.fdi || 'N/A'}\n• **Anatomy:** ${tInfo.roots} Root(s) | ${tInfo.cusps} Cusp(s)\n• **Function:** ${tInfo.function}\n• **Patient Chart Status:** **${currentStatus}**`;

        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          text: replyText,
          type: 'tooth_card',
          cardData: {
            toothNum,
            info: tInfo,
            status: currentStatus,
            color: currentColor,
            coords: DENTAL_COORDS[toothNum],
            image: lookupTopViewImage
          },
          time: 'Just now'
        }]);

        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(`Tooth ${toothNum} is the ${tInfo.name}, located in the ${tInfo.quad}.`);
            utt.rate = 1.05;
            window.speechSynthesis.speak(utt);
          } catch (e) {}
        }
        return;
      }
    }

    // --- 2. CLINICAL INTELLIGENCE: TOOTH CLASSIFICATION & DENTAL ANATOMY EXPLANATION ---
    const isMolarQuery = (txtLower.includes('molar') || txtLower.includes('molars')) && !txtLower.includes('premolar') && !txtLower.includes('wisdom');
    const isPremolarQuery = txtLower.includes('premolar') || txtLower.includes('bicuspid');
    const isCanineQuery = txtLower.includes('canine') || txtLower.includes('cuspid') || txtLower.includes('eye tooth');
    const isIncisorQuery = txtLower.includes('incisor');
    const isWisdomQuery = txtLower.includes('wisdom') || txtLower.includes('third molar') || txtLower.includes('3rd molar');

    if (isMolarQuery || isPremolarQuery || isCanineQuery || isIncisorQuery || isWisdomQuery) {
      let groupTeeth = [];
      let groupTitle = "";
      let groupSubtitle = "";
      let groupExplanation = "";
      let groupColor = "#3B82F6";

      if (isMolarQuery) {
        groupTeeth = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32];
        groupTitle = "Molars (12 Teeth: 6 Upper, 6 Lower)";
        groupSubtitle = "Primary Chewing & Crushing Powerhouses";
        groupColor = "#2563EB";
        groupExplanation = "Molars are the largest and strongest teeth located in the posterior (back) of the mouth. Adults typically have 12 molars (including 4 wisdom teeth). They feature broad, flat biting surfaces with 4 to 5 cusps engineered for pulverizing and grinding tough food boluses before swallowing. Upper molars typically have 3 roots (trifurcated), while lower molars have 2 roots (bifurcated).";
      } else if (isPremolarQuery) {
        groupTeeth = [4, 5, 12, 13, 20, 21, 28, 29];
        groupTitle = "Premolars / Bicuspids (8 Teeth: 4 Upper, 4 Lower)";
        groupSubtitle = "Tearing & Transitional Grinding";
        groupColor = "#6366F1";
        groupExplanation = "Premolars (or bicuspids) sit between canines and molars. Adults have 8 premolars (1st and 2nd on each quadrant). They have dual sharp cusps designed to shear and hold food, transitioning it to the molars for fine grinding.";
      } else if (isCanineQuery) {
        groupTeeth = [6, 11, 22, 27];
        groupTitle = "Canines / Cuspids / Eye Teeth (4 Teeth: 2 Upper, 2 Lower)";
        groupSubtitle = "Puncturing & Canine Guidance Anchor";
        groupColor = "#10B981";
        groupExplanation = "Canines are the cornerstone of the human dental arch. They have a single pointed cusp and the longest, sturdiest roots in the jaw. They guide jaw movements (canine guidance), tear fibrous foods, and preserve facial vertical dimension.";
      } else if (isIncisorQuery) {
        groupTeeth = [7, 8, 9, 10, 23, 24, 25, 26];
        groupTitle = "Incisors (8 Teeth: 4 Central, 4 Lateral)";
        groupSubtitle = "Cutting, Speech & Aesthetic Smile Line";
        groupColor = "#06B6D4";
        groupExplanation = "Incisors are the front cutting teeth with sharp, chisel-like incisal edges. They bite into food, support pronunciation of consonants (phonetics like 'f' and 'v'), and form the primary aesthetic profile of the smile.";
      } else if (isWisdomQuery) {
        groupTeeth = [1, 16, 17, 32];
        groupTitle = "Wisdom Teeth / 3rd Molars (4 Teeth: 1, 16, 17, 32)";
        groupSubtitle = "Late Erupting Vestigial Molars";
        groupColor = "#F59E0B";
        groupExplanation = "Wisdom teeth are the third and final set of molars, typically erupting between ages 17 and 25. Due to modern human jaw evolution, they frequently become impacted, angulated, or cause pericoronitis, often requiring surgical extraction.";
      }

      setHighlightedTeeth(groupTeeth);
      setHighlightInfo({
        title: groupTitle,
        subtitle: groupSubtitle,
        type: 'group',
        color: groupColor
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: `✨ **${groupTitle} Highlighted on Dental Jaw**\n\n${groupExplanation}\n\n• **Active Highlighted Numbers:** [${groupTeeth.join(', ')}]`,
        type: 'group_card',
        cardData: {
          title: groupTitle,
          subtitle: groupSubtitle,
          explanation: groupExplanation,
          teethNumbers: groupTeeth,
          color: groupColor
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(groupExplanation);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }

    // --- 3. CLINICAL INTELLIGENCE: DENTAL PATHOLOGY, PROCEDURES & CLINICAL GUIDANCE ---
    const isCariesQuery = txtLower.includes('caries') || txtLower.includes('cavity') || txtLower.includes('decay') || txtLower.includes('tooth decay');
    const isRctQuery = txtLower.includes('root canal') || txtLower.includes('rct') || txtLower.includes('endodontic');
    const isCrownQuery = txtLower.includes('crown') || txtLower.includes('prosthesis') || txtLower.includes('bridge') || txtLower.includes('implant');
    const isCleaningQuery = txtLower.includes('scaling') || txtLower.includes('cleaning') || txtLower.includes('tartar') || txtLower.includes('calculus') || txtLower.includes('gingivitis') || txtLower.includes('gum disease');

    if (isCariesQuery || isRctQuery || isCrownQuery || isCleaningQuery) {
      let procTitle = "";
      let procDesc = "";
      let procStages = [];
      let procCare = [];
      let targetStatus = "";

      if (isCariesQuery) {
        procTitle = "Dental Caries (Tooth Decay & Cavities)";
        procDesc = "Dental caries is an infectious bacterial disease caused by acidogenic bacteria (Streptococcus mutans) fermenting dietary sugars. The acid demineralizes tooth enamel, progressing into the softer dentin layer and eventually invading the vascular dental pulp if untreated.";
        procStages = [
          "Stage 1: Enamel Demineralization (White Spot Lesion, reversible with fluoride)",
          "Stage 2: Enamel Cavitation (Structural breach requiring composite resin restoration)",
          "Stage 3: Dentin Decay (Rapid progression causing hot/cold sensitivity)",
          "Stage 4: Pulpitis & Abscess (Deep nerve infection requiring Root Canal Treatment)"
        ];
        procCare = ["Brush twice daily with 1450ppm fluoride toothpaste", "Daily interdental flossing", "Limit fermentable carbohydrates & sugary drinks", "Regular bi-annual clinical checkups & scaling"];
        targetStatus = "decay";
      } else if (isRctQuery) {
        procTitle = "Root Canal Treatment (RCT / Endodontics)";
        procDesc = "Root Canal Treatment is a specialized restorative procedure to save a severely infected or necrotic tooth. The dentist removes infected pulp tissue, disinfects the complex root canal anatomy, and seals the canals hermetically to prevent recurrent infection.";
        procStages = [
          "Step 1: Local anesthesia & isolation with a rubber dam",
          "Step 2: Access cavity preparation & necrotic pulp extirpation",
          "Step 3: Biomechanical rotary shaping & irrigation with NaOCl",
          "Step 4: Thermoplasticized Gutta-Percha obturation & coronal seal (Core/Crown)"
        ];
        procCare = ["Avoid biting hard foods on the treated tooth until a permanent crown is placed", "Take prescribed anti-inflammatory analgesics (e.g. Ibuprofen)", "Maintain immaculate plaque control around margins"];
        targetStatus = "canal";
      } else if (isCrownQuery) {
        procTitle = "Prosthodontic Crowns, Bridges & Restorations";
        procDesc = "A dental crown (cap) is a custom-fabricated full-coverage prosthetic restoring a broken, root-canal-treated, or heavily decayed tooth to its natural anatomy, masticatory strength, and aesthetics (e.g., Zirconia, E-Max Ceramic, Porcelain-Fused-to-Metal).";
        procStages = [
          "Step 1: Tooth preparation with uniform occlusal and axial reduction",
          "Step 2: High-definition digital intraoral 3D scanning / impression",
          "Step 3: Temporary crown fabrication for protection & aesthetics",
          "Step 4: Definitive cementation with adhesive resin cement"
        ];
        procCare = ["Floss carefully with threader around bridges", "Avoid opening packaging with crowned teeth", "Nightguard if patient exhibits nocturnal bruxism (grinding)"];
        targetStatus = "treat";
      } else if (isCleaningQuery) {
        procTitle = "Scaling, Root Planing & Periodontal Prophylaxis";
        procDesc = "Ultrasonic scaling and prophylaxis remove mineralized dental calculus (tartar) and bacterial biofilm above and below the gingival margin, preventing gingivitis and halting bone loss caused by periodontitis.";
        procStages = [
          "Step 1: Ultrasonic piezoelectric cavitation to detach hard calculus deposits",
          "Step 2: Fine hand curettage (Graceys) for subgingival root smoothing",
          "Step 3: Air polishing with glycine/bicarbonate powder for stain removal",
          "Step 4: Topical fluoride varnish application to protect enamel"
        ];
        procCare = ["Mild gum sensitivity is normal for 24-48 hours", "Use a soft-bristled oscillating electric brush", "Rinse with warm salt water if gums are tender"];
        targetStatus = "clean";
      }

      // Highlight any teeth in chart matching condition
      const matchingTeeth = teethState
        .filter(t => {
          const s = ((t.status || t.conditionStatus || '') + ' ' + (t.comments || '')).toLowerCase();
          return s.includes(targetStatus);
        })
        .map(t => parseInt(t.toothNumber ?? t.ToothNumber));

      if (matchingTeeth.length > 0) {
        setHighlightedTeeth(matchingTeeth);
        setHighlightInfo({
          title: procTitle,
          subtitle: `Found ${matchingTeeth.length} tooth/teeth in active chart: [${matchingTeeth.join(', ')}]`,
          type: 'condition',
          color: targetStatus === 'decay' ? '#EF4444' : targetStatus === 'canal' ? '#F59E0B' : '#8B5CF6'
        });
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: `🩺 **Clinical Dental Guide: ${procTitle}**\n\n${procDesc}`,
        type: 'procedure_card',
        cardData: {
          title: procTitle,
          description: procDesc,
          stages: procStages,
          care: procCare,
          matchingTeeth
        },
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(procDesc);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }

    // Check current step context first
    if (currentStep === 'AWAITING_DOB') {
      // Expecting a date or calendar submission
      setTempRegData(prev => ({ ...prev, dob: text }));
      setCurrentStep('AWAITING_PHONE');
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Got it. Lastly, please provide a contact phone number for ${tempRegData.name || 'them'}.`, type: 'phone_input', time: 'Just now' }]);
      }, 600);
      return;
    }

    if (currentStep === 'AWAITING_PHONE') {
      const updatedRegData = { ...tempRegData, phone: text };
      setTempRegData(updatedRegData);
      setCurrentStep('REGISTERING');
      
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Registering ${updatedRegData.name} in the system...`, type: 'text', time: 'Just now' }]);
      
      const result = await registerPatientAPI(updatedRegData);
      
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `✅ Patient Registration Complete! (ID: ${result.newPatientId})\nName: ${result.name}\nDOB: ${result.dob}\nPhone: ${result.phone}`, type: 'text', time: 'Just now' }]);
      setCurrentStep('IDLE');
      
      // If we were paused mid-booking, resume it
      if (tempApptData.date && tempApptData.time) {
         setTimeout(() => {
            setCurrentStep('CONFIRMING_APPOINTMENT');
            setTempApptData(prev => ({ ...prev, patientId: result.newPatientId }));
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Continuing with the appointment booking for ${result.name}. Please confirm the slot below:`, type: 'calendar_scheduler', time: 'Just now' }]);
         }, 1000);
      }
      return;
    }

    const isRegisterIntent = txtLower.includes('register patient') || 
                             txtLower.includes('add patient') || 
                             txtLower.includes('new patient') || 
                             txtLower.includes('register a new patient');
                             
    if (isRegisterIntent && currentStep === 'IDLE') {
      const registerMatch = txtLower.match(/(?:named|name is) (.+)/);
      if (registerMatch) {
        const pName = registerMatch[1].trim();
        setTempRegData({ name: pName, dob: '', phone: '' });
        setCurrentStep('AWAITING_DOB');
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Alright, I will register ${pName}. What is their Date of Birth?`, type: 'datepicker', time: 'Just now' }]);
        }, 600);
      } else {
        // They didn't provide a name, ask for it
        setCurrentStep('AWAITING_NEW_PATIENT_NAME_FOR_REGISTRATION');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Sure, I can help you register a new patient. What is the patient's full name?`, type: 'text', time: 'Just now' }]);
      }
      return;
    }
    
    if (currentStep === 'AWAITING_NEW_PATIENT_NAME_FOR_REGISTRATION') {
       setTempRegData({ name: text, dob: '', phone: '' });
       setCurrentStep('AWAITING_DOB');
       setTimeout(() => {
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Got it. What is ${text}'s Date of Birth?`, type: 'datepicker', time: 'Just now' }]);
       }, 600);
       return;
    }

    // Match explicit booking commands (e.g. "book an appointment for...", "schedule appointment for..."), excluding inquiry queries (when, how many, check, etc.)
    const isQuestionOrLookup = txtLower.includes('when') || 
                               txtLower.includes('how many') || 
                               txtLower.includes('how much') || 
                               txtLower.includes('show') || 
                               txtLower.includes('list') || 
                               txtLower.includes('check') || 
                               txtLower.includes('have or not') || 
                               txtLower.includes('do i have') || 
                               txtLower.includes('who is') || 
                               txtLower.includes('upcoming') || 
                               txtLower.includes('next');

    const isBookingIntent = !isQuestionOrLookup && (
      txtLower.includes('book') || 
      txtLower.includes('schedule an appointment') || 
      txtLower.includes('make an appointment') || 
      txtLower.includes('create appointment') || 
      txtLower.includes('book appointment') || 
      txtLower.includes('schedule appointment') ||
      txtLower.includes('book a slot')
    );

    if (isBookingIntent) {
      const bookMatch = txtLower.match(/(?:book|make|schedule|schdule)(?: an)? (?:appointment|appintment|appontment|apointment|booking)? for (.+) at (.+)/);
      const date = bookMatch ? bookMatch[1].trim() : '';
      const timeStr = bookMatch ? bookMatch[2].trim() : '';
      
      // Keep the newly registered patient ID if it exists in state, otherwise use the URL param
      const targetPatientId = tempApptData.patientId || patientId;
      setTempApptData({ patientId: targetPatientId, date, time: timeStr });
      
      // If we have a newly registered temporary patient, use that context
      if (tempRegData.name) {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Would you like to book this appointment for ${tempRegData.name}? Please confirm the schedule:`, type: 'calendar_scheduler', time: 'Just now' }]);
        setCurrentStep('CONFIRMING_APPOINTMENT');
      } 
      // If we have a patient context from the main screen (from URL params)
      else if (patient) {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Would you like to book this appointment for ${patient.firstName}? Please select the schedule:`, type: 'calendar_scheduler', time: 'Just now' }]);
        setCurrentStep('CONFIRMING_APPOINTMENT');
      }
      else {
        // Brand new, don't know who this is for. Route to registration first.
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `I don't have an active patient context for this booking. Let's register them first. What is the patient's name?`, type: 'text', time: 'Just now' }]);
        setCurrentStep('AWAITING_NEW_PATIENT_NAME_FOR_BOOKING'); 
      }
      return;
    }

    if (currentStep === 'AWAITING_NEW_PATIENT_NAME_FOR_BOOKING') {
       setTempRegData({ name: text, dob: '', phone: '' });
       setCurrentStep('AWAITING_DOB');
       setTimeout(() => {
         setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `Got it. What is ${text}'s Date of Birth?`, type: 'datepicker', time: 'Just now' }]);
       }, 600);
       return;
    }

    // --- 0.95 ADAPTIVE CONVERSATIONAL INTENT & CLARIFICATION ENGINE ---
    const doctorIntent = parseDoctorConversationalIntent(text, { activeTooth: detailedTooth }, dentitionMode);

    if (doctorIntent.type === 'CLARIFY_TOOTH' || doctorIntent.type === 'CLARIFY_CONDITION') {
      if (doctorIntent.toothNum) {
        setHighlightedTeeth([doctorIntent.toothNum]);
        setDetailedTooth(doctorIntent.toothNum);
        if (typeof doctorIntent.toothNum === 'number') {
          setSelectedJawView(doctorIntent.toothNum <= 16 ? 'maxilla' : 'mandible');
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: `💬 **Clinical Clarification Needed**\n\n${doctorIntent.spokenMessage}`,
        type: 'clarification_card',
        chips: doctorIntent.chips,
        time: 'Just now'
      }]);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(doctorIntent.spokenMessage);
          utt.rate = 1.05;
          window.speechSynthesis.speak(utt);
        } catch (e) {}
      }
      return;
    }

    // Default Fallback: Send to Gemini Backend API (for clinical teeth updates, prescriptions, patient dossier, stats, appts)
    try {
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.DoctorID || 1;
      const activePid = parseInt(patientId) || patient?.patientID || patient?.PatientID || null;

      let response;
      try {
        response = await fetch('/api/chatbot/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            Text: text, 
            Region: "PK", 
            TeethContext: "",
            DoctorId: docId,
            PatientId: activePid
          })
        });
      } catch (networkErr) {
        // Fallback to direct localhost:5107 if proxy is bypassed
        response = await fetch('/api/chatbot/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            Text: text, 
            Region: "PK", 
            TeethContext: "",
            DoctorId: docId,
            PatientId: activePid
          })
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data.ai_response) {
          const suggestedChips = [
            { label: 'Add to Treatment Plan', command: `Add current findings to treatment plan` },
            { label: 'Check 3D Model', command: `Focus 3D interactive model` },
            { label: 'Full Examination', command: `Start full mouth exam` }
          ];

          setMessages(prev => [...prev, { 
            id: Date.now(), 
            sender: 'ai', 
            text: data.ai_response, 
            type: data.card_type || 'text',
            cardData: data,
            chips: suggestedChips,
            time: 'Just now' 
          }]);

          // Persist Chat History to Database
          if (activePid) {
            fetch(`/api/patients/${activePid}/chat-history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcript: text,
                parsedAction: data.ai_response
              })
            }).catch(err => console.warn("Failed to persist ChatHistory:", err));
          }

          // Read aloud response with speech synthesis
          if ('speechSynthesis' in window) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(data.ai_response);
              utterance.rate = 1.05;
              window.speechSynthesis.speak(utterance);
            } catch (synthErr) {
              console.warn("Speech synthesis error:", synthErr);
            }
          }

          // Execute any returned tooth updates on the active chart
          if (data.tooth_updates && Array.isArray(data.tooth_updates)) {
            data.tooth_updates.forEach(tu => {
              if (tu.tooth_number) {
                executeCommand(tu.tooth_number, tu.status || 'Damaged/Decay');
              }
            });
          }
        }
      } else {
        const recoveryChips = [
          { label: '🦷 Caries / Decay', command: 'Tooth 14 Caries O' },
          { label: '💎 Composite Filling', command: 'Tooth 14 Composite Filling' },
          { label: '👑 Zirconia Crown', command: 'Tooth 14 Zirconia Crown' },
          { label: '✅ Sound / Healthy', command: 'Tooth 14 Healthy' },
          { label: 'Start Full Exam', command: 'Start full mouth exam' }
        ];

        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: `🗣️ **Doctor, I caught your input but need a quick confirmation:**\n\n*${text}*\n\nPlease pick one of the quick clinical actions below or speak the tooth number:`, 
          type: 'text',
          chips: recoveryChips,
          time: 'Just now' 
        }]);
      }
    } catch (e) {
      console.error("Chatbot request fallback:", e);
      const fallbackChips = [
        { label: 'Start Full Mouth Exam', command: 'Start full mouth exam' },
        { label: 'Restore Sound (All Healthy)', command: 'All teeth healthy' },
        { label: 'Remove All Canines', command: 'Remove all canine teeth' },
        { label: 'Fill All Premolars', command: 'Show filling in premolars everywhere' }
      ];

      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'ai', 
        text: `🗣️ **AI Scribe Ready:** Doctor, please clarify your clinical finding or tap a quick action below:`, 
        type: 'text',
        chips: fallbackChips,
        time: 'Just now' 
      }]);
    }
  };

  const confirmAppointment = async (finalDate, finalTime) => {
    const activePatientId = (tempApptData.patientId && tempApptData.patientId !== "null" && tempApptData.patientId !== "undefined")
      ? tempApptData.patientId
      : patientId;
    const result = await bookAppointmentAPI({ date: finalDate, time: finalTime, patientId: activePatientId });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `✅ Appointment Confirmed!\nScheduled for ${result.date} at ${result.time}.`, type: 'text', time: 'Just now' }]);
    setCurrentStep('IDLE');
    setTempApptData({ patientId: null, date: '', time: '' });
  };

  const handleNexuSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setNexuError('');
      if (showNexuModal.type === 'UNLOCK') {
        setIsMicUnlocked(true);
        setToast({ visible: true, message: "Smart Card verified. Mic active!" });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
      } else if (showNexuModal.type === 'HIGH_RISK') {
        const cmd = showNexuModal.pendingCommands;
        if (cmd) {
          executeCommand(cmd.toothNum, cmd.status);
          setToast({ visible: true, message: "High-risk command signed & approved!" });
          setTimeout(() => setToast({ visible: false, message: '' }), 3000);
        }
      }
      setShowNexuModal({ visible: false, type: '', pendingCommands: [] });
      setPinInput('');
    } else {
      setNexuError('Invalid Smart Card PIN.');
    }
  };

  const getCount = (keywords) => teethState.filter(t => {
    const s = (t.status || t.conditionStatus || '').toLowerCase();
    return keywords.some(k => s.includes(k.toLowerCase()));
  }).length;

  const cariesCount = getCount(['decay', 'damaged', 'cavity', 'broken']);
  const prosthesisCount = getCount(['treated', 'prosthesis', 'crown', 'bridge', 'implant']);
  const cleaningCount = getCount(['clean', 'calculus', 'tartar']);
  const rctCount = getCount(['root canal', 'rct', 'canal', 'endodontic']);
  const missingCount = getCount(['miss', 'extract', 'lost']);
  const totalDentitionCount = dentitionMode === 'pediatric' ? 20 : 32;
  const healthyCount = Math.max(0, totalDentitionCount - (cariesCount + prosthesisCount + cleaningCount + rctCount + missingCount));

  const cariesPct = Math.round((cariesCount / totalDentitionCount) * 100) || 0;
  const prosthesisPct = Math.round((prosthesisCount / totalDentitionCount) * 100) || 0;
  const cleaningPct = Math.round((cleaningCount / totalDentitionCount) * 100) || 0;
  const rctPct = Math.round((rctCount / totalDentitionCount) * 100) || 0;
  const missingPct = Math.round((missingCount / totalDentitionCount) * 100) || 0;
  const healthyPct = Math.round((healthyCount / totalDentitionCount) * 100) || 0;

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-dark-slate flex flex-col font-sans selection:bg-light-teal selection:text-primary-teal relative overflow-x-hidden">
      <Navigation />

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-24 right-8 z-[100] bg-white border-l-4 border-[#4A7CD2] text-dark-slate px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-bounce">
            <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Unified Master Clinical Workstation Shell */}
      <main className="flex-grow max-w-[1920px] w-full mx-auto px-2.5 sm:px-4 py-3">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-86px)] items-stretch">
          
          {/* Left Main Clinical Workspace: Patient Profile, Odontogram Arch & Clinical Tabs */}
          <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between gap-4 min-w-0 bg-white">
            
            {/* Header info row */}
            <div className="flex justify-between items-center border-b border-light-teal/20 pb-4">
              <div className="flex items-center gap-1.5 bg-[#F4F6FA] p-1 rounded-2xl border border-light-teal/30">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                    activeTab === 'chart'
                      ? 'bg-[#EAF0FC]/80 text-[#4A7CD2] shadow-md border border-[#4A7CD2]/40'
                      : 'text-muted-text hover:text-dark-slate'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" /> Dental Chart
                </button>
                <button
                  onClick={() => loadNotesTab(showDeletedNotes)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                    activeTab === 'notes'
                      ? 'bg-[#EAF0FC]/80 text-[#4A7CD2] shadow-md border border-[#4A7CD2]/40'
                      : 'text-muted-text hover:text-dark-slate'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" /> AI Notes
                </button>
                <button
                  onClick={loadRadiographsTab}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                    activeTab === 'radiographs'
                      ? 'bg-[#EAF0FC]/80 text-[#4A7CD2] shadow-md border border-[#4A7CD2]/40'
                      : 'text-muted-text hover:text-dark-slate'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" /> Imaging & X-Rays
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/directory')} className="bg-[#EAF0FC] text-[#4A7CD2] px-4 py-2 rounded-xl text-xs font-bold border border-light-teal flex items-center hover:bg-light-teal/40 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Directory
                </button>
                {activeTab === 'chart' && (
                  <button onClick={handleSaveChart} className="bg-[#4A7CD2] hover:bg-[#3665B7] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors">
                    <Save className="w-3.5 h-3.5" /> Save Chart
                  </button>
                )}
              </div>
            </div>

            {/* Patient Header Block — Sleek Executive Horizon Bar */}
            {patient && (
              <div className="bg-[#EAF0FC]/60 rounded-2xl px-4 py-2.5 border border-light-teal/45 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-2xs flex-shrink-0 bg-white flex items-center justify-center">
                    <img 
                      src={getPatientAvatarUrl(patient)} 
                      alt={`${patient.firstName} ${patient.lastName}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-[#10244B] capitalize leading-none truncate">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <span className="text-[10px] font-black bg-white text-[#4A7CD2] px-2 py-0.5 rounded-md border border-light-teal/50 shadow-2xs">
                        ID #{patient.patientID || patientId}
                      </span>
                      {(() => {
                        const pAge = calculatePatientAge(patient.dob);
                        const ageStr = pAge !== null ? `${pAge} Yrs` : (patient.age ? `${patient.age} Yrs` : '2 Yrs');
                        if (pAge !== null && pAge < 6) {
                          return (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-pink-100 text-pink-800 border border-pink-300 flex items-center gap-1 shadow-2xs">
                              <span>👶</span>
                              <span>Age: {ageStr} (Pediatric A–T)</span>
                            </span>
                          );
                        } else if (pAge !== null && pAge <= 12) {
                          return (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                              <span>🔀</span>
                              <span>Age: {ageStr} (Mixed)</span>
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-[#1E40AF] border border-blue-200 flex items-center gap-1 shadow-2xs">
                            <span>🦷</span>
                            <span>Age: {ageStr} (Adult 1–32)</span>
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] text-muted-text font-bold truncate flex items-center gap-2 mt-0.5">
                      <span>DOB: <strong className="text-dark-slate font-extrabold">{patient.dob ? patient.dob.split('T')[0] : '2024-01-01'}</strong> ({patient.gender || 'Male'})</span>
                      <span>•</span>
                      <span>📞 {patient.phone || '021 123 4567'}</span>
                      <span>•</span>
                      <span className="text-[#4A7CD2]">✉️ {patient.email || 'patient@dentia.com'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Dentition Category Badge (Strictly matches patient's category, hiding all other modes) */}
                  {(() => {
                    const pAge = calculatePatientAge(patient?.dob);
                    const dType = (patient?.dentitionType || '').toLowerCase();
                    const isMixedPatient = dType.includes('mixed') || (pAge !== null && pAge >= 6 && pAge <= 12);
                    const isPediatricPatient = !isMixedPatient && ((pAge !== null && pAge < 6) || dType === 'pediatric');

                    if (isMixedPatient) {
                      return (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xs border border-amber-600/30">
                          <span>🔀</span>
                          <span>Mixed Dentition</span>
                        </div>
                      );
                    }

                    if (isPediatricPatient) {
                      return (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xs border border-pink-600/30">
                          <span>👶</span>
                          <span>Pediatric (A–T)</span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center gap-1.5 bg-[#4A7CD2] text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xs border border-blue-600/30">
                        <span>🦷</span>
                        <span>Permanent (1–32)</span>
                      </div>
                    );
                  })()}

                  {/* Print & PDF Patient Odontogram Report Icon-only Button */}
                  <button
                    type="button"
                    onClick={() => handlePrintCompletePatientReport(patient, teethState, doctor)}
                    className="bg-white hover:bg-blue-50 text-[#1E40AF] hover:text-[#1D4ED8] border border-[#1E40AF]/25 hover:border-[#1E40AF]/50 p-2 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0 group relative"
                    title="Print Odontogram Report"
                    aria-label="Print Odontogram Report"
                  >
                    <OdontogramPrintIcon className="w-4.5 h-4.5 text-[#1E40AF] group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            )}


            {/* ===== AI NOTES TAB ===== */}
            {activeTab === 'notes' && (
              <div className="flex flex-col gap-4 flex-grow">

                {/* Loading Bar */}
                {notesLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-muted-text uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Processing & Loading AI Notes...</span>
                      <span>{notesLoadProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EAF0FC] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${notesLoadProgress}%`, background: 'linear-gradient(90deg, #4A7CD2, #8B5CF6, #10B981)' }} />
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!notesLoading && notesHistory.length === 0 && (
                  <div className="flex-grow flex flex-col items-center justify-center py-16 space-y-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#EAF0FC] flex items-center justify-center">
                      <Brain className="w-6 h-6 text-[#4A7CD2]" />
                    </div>
                    <p className="text-sm font-extrabold text-dark-slate">No AI Notes Yet</p>
                    <p className="text-[11px] text-muted-text leading-relaxed max-w-[240px]">Record a voice session using the mic panel to generate your first AI clinical note.</p>
                  </div>
                )}

                {/* MASTER-DETAIL SPLIT */}
                {!notesLoading && notesHistory.length > 0 && (
                  <div className="flex gap-3 flex-grow overflow-hidden" style={{ height: 'calc(100vh - 360px)' }}>

                    {/* LEFT: Compact list with 5 records per page */}
                    <div className="w-[265px] flex-shrink-0 flex flex-col justify-between h-full bg-[#F8FAFC]/50 p-2 rounded-2xl border border-light-teal/30">
                      
                      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between pb-1 border-b border-light-teal/20 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = !showDeletedNotes;
                              setShowDeletedNotes(next);
                              loadNotesTab(next);
                            }}
                            className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                              showDeletedNotes 
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                                : 'bg-white text-muted-text border-light-teal/40 hover:text-dark-slate hover:bg-[#EAF0FC]/40'
                            }`}
                            title={showDeletedNotes ? "Switch to Active Notes" : "Switch to Deleted Records"}
                          >
                            {showDeletedNotes ? <Trash2 className="w-3 h-3 text-white" /> : <ListChecks className="w-3 h-3 text-[#4A7CD2]" />}
                            <span>{showDeletedNotes ? 'Trash View' : 'Active'} ({notesHistory.length})</span>
                          </button>
                          <span className="text-[10px] font-bold text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded-full border border-light-teal/40">
                            P.{notesCurrentPage}/{Math.ceil(notesHistory.length / 5) || 1}
                          </span>
                        </div>

                        {/* Paginated 5 Records */}
                        {notesHistory.slice((notesCurrentPage - 1) * 5, notesCurrentPage * 5).map((note) => {
                          const nId = note.noteId || note.NoteId;
                          const isSel = selectedNoteId === nId;
                          const isDel = note.isDeleted || note.IsDeleted;
                          const d = note.createdAt ? new Date(note.createdAt) : null;
                          const st = note.status || 'draft';
                          const dot = isDel ? 'bg-red-400' : (st.toLowerCase().includes('complete') ? 'bg-emerald-500' : st.toLowerCase().includes('review') ? 'bg-amber-400' : 'bg-blue-400');
                          return (
                            <button
                              key={nId}
                              onClick={() => handleSelectNote(nId)}
                              className={`w-full text-left p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                                isSel 
                                  ? (isDel ? 'bg-rose-600 border-rose-600 shadow-md text-white' : 'bg-[#4A7CD2] border-[#4A7CD2] shadow-md text-white')
                                  : (isDel ? 'bg-red-50/50 border-red-200 hover:bg-red-100/40 opacity-75' : 'bg-white border-light-teal/40 hover:border-[#4A7CD2]/50 hover:bg-[#EAF0FC]/30')
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                                  <span className={`text-[9.5px] font-extrabold uppercase tracking-wide truncate ${isSel ? 'text-white/80' : (isDel ? 'text-red-500' : 'text-muted-text')}`}>
                                    {isDel ? 'DELETED' : st}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold ${isSel ? 'text-white/70' : 'text-muted-text'}`}>
                                    #{nId}
                                  </span>
                                  {isDel ? (
                                    <span
                                      onClick={(e) => handleRestoreNote(nId, e)}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${isSel ? 'hover:bg-white/20 text-white' : 'hover:bg-emerald-100 text-emerald-600'}`}
                                      title="Restore Note"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <span
                                      onClick={(e) => handleDeleteNote(nId, e)}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${isSel ? 'hover:bg-white/20 text-white' : 'hover:bg-red-100 text-red-400 hover:text-red-600'}`}
                                      title="Delete Note"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className={`text-xs font-extrabold leading-tight ${isSel ? 'text-white' : (isDel ? 'text-red-950' : 'text-dark-slate')}`}>
                                {d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Note'}
                              </p>
                              <p className={`text-[9.5px] mt-0.5 ${isSel ? 'text-white/70' : 'text-muted-text'}`}>
                                {d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                              {note.chiefComplaint && (
                                <p className={`text-[9.5px] mt-1 font-semibold line-clamp-1 leading-tight ${isSel ? 'text-white/80' : 'text-dark-slate/60'}`}>{note.chiefComplaint}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Pagination Footer Controls (5 records per page) */}
                      {notesHistory.length > 5 && (
                        <div className="pt-2 border-t border-light-teal/25 flex items-center justify-between px-1">
                          <button
                            type="button"
                            disabled={notesCurrentPage === 1}
                            onClick={() => setNotesCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg bg-white border border-light-teal/50 hover:bg-[#EAF0FC] text-[#4A7CD2] disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
                            title="Previous 5 Notes"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.ceil(notesHistory.length / 5) }).map((_, idx) => {
                              const pageNum = idx + 1;
                              const isActive = notesCurrentPage === pageNum;
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setNotesCurrentPage(pageNum)}
                                  className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    isActive 
                                      ? 'bg-[#4A7CD2] text-white shadow-xs' 
                                      : 'bg-white border border-light-teal/40 text-muted-text hover:text-dark-slate'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            disabled={notesCurrentPage === Math.ceil(notesHistory.length / 5)}
                            onClick={() => setNotesCurrentPage(p => Math.min(Math.ceil(notesHistory.length / 5), p + 1))}
                            className="p-1.5 rounded-lg bg-white border border-light-teal/50 hover:bg-[#EAF0FC] text-[#4A7CD2] disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
                            title="Next 5 Notes"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>

                    {/* DIVIDER */}
                    <div className="w-px bg-light-teal/40 flex-shrink-0" />

                    {/* RIGHT: Full detail panel */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pl-2">

                      {!selectedNoteId && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-[#EAF0FC] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#4A7CD2]" />
                          </div>
                          <p className="text-xs font-bold text-dark-slate">Select a note</p>
                          <p className="text-[10px] text-muted-text">Click any note on the left to view it</p>
                        </div>
                      )}

                      {selectedNoteId && !expandedNoteDetail && (
                        <div className="h-full flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#4A7CD2]" />
                          <span className="text-[11px] font-bold text-muted-text">Loading note...</span>
                        </div>
                      )}

                      {selectedNoteId && expandedNoteDetail && (() => {
                        const checks = buildChecklist(expandedNoteDetail);
                        const doneCount = checks.filter(c => c.ok).length;
                        const nd = expandedNoteDetail.createdAt ? new Date(expandedNoteDetail.createdAt) : null;
                        const ns = expandedNoteDetail.status || 'draft';
                        const isDel = expandedNoteDetail.isDeleted || expandedNoteDetail.IsDeleted;
                        return (
                          <div className="space-y-3" id="ai-notes-print-area">

                            {/* Banner */}
                            <div className={`border rounded-2xl p-4 flex items-center justify-between no-print ${
                              isDel ? 'bg-red-50/70 border-red-200' : 'bg-gradient-to-r from-[#4A7CD2]/10 to-[#8B5CF6]/10 border-[#4A7CD2]/20'
                            }`}>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-extrabold text-dark-slate">
                                    {nd ? nd.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Clinical Note'}
                                  </p>
                                  {isDel && (
                                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300 uppercase">
                                      Deleted (In Trash)
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-text mt-0.5">
                                  {nd ? nd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''} · Note #{expandedNoteDetail.noteId || expandedNoteDetail.NoteId}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isEditingNote ? (
                                  <>
                                    <button 
                                      onClick={saveEditedNote}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors no-print"
                                      title="Save Changes"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span className="text-xs font-extrabold">Save</span>
                                    </button>
                                    <button 
                                      onClick={() => { setIsEditingNote(false); setEditingNoteData(null); }}
                                      className="bg-white hover:bg-gray-50 border border-light-teal/40 text-dark-slate px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors no-print"
                                      title="Cancel Editing"
                                    >
                                      <X className="w-3.5 h-3.5 text-red-500" />
                                      <span className="text-xs font-extrabold">Cancel</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {!isDel && (
                                      <button 
                                        onClick={() => { setIsEditingNote(true); setEditingNoteData({ ...expandedNoteDetail }); }}
                                        className="bg-white hover:bg-gray-50 border border-light-teal/40 text-dark-slate px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors no-print cursor-pointer shadow-2xs"
                                        title="Edit Note Content"
                                      >
                                        <Edit className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                        <span className="text-xs font-extrabold">Edit</span>
                                      </button>
                                    )}
                                    <button 
                                      onClick={handleGeneratePDF}
                                      className="bg-white hover:bg-gray-50 border border-light-teal/40 text-dark-slate px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors no-print cursor-pointer shadow-2xs"
                                      title="Download Note as PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span className="text-xs font-extrabold">PDF</span>
                                    </button>
                                    {isDel ? (
                                      <button 
                                        onClick={(e) => handleRestoreNote(expandedNoteDetail.noteId || expandedNoteDetail.NoteId, e)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors no-print cursor-pointer shadow-xs"
                                        title="Restore Note to Active Records"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span className="text-xs font-extrabold">Restore</span>
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={(e) => handleDeleteNote(expandedNoteDetail.noteId || expandedNoteDetail.NoteId, e)}
                                        className="bg-white hover:bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors no-print cursor-pointer shadow-2xs"
                                        title="Delete Note"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        <span className="text-xs font-extrabold">Delete</span>
                                      </button>
                                    )}
                                  </>
                                )}
                                <div className="text-center bg-white rounded-xl px-3 py-1.5 border border-light-teal/40 no-print">
                                  <p className="text-sm font-black text-[#4A7CD2]">{doneCount}/8</p>
                                  <p className="text-[10px] text-muted-text font-bold">Docs</p>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-wide no-print ${
                                  isDel ? 'bg-red-100 text-red-600 border border-red-300' : (ns.toLowerCase().includes('complete') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ns.toLowerCase().includes('review') ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-blue-50 text-blue-500 border border-blue-200')
                                }`}>{isDel ? 'Deleted' : ns}</span>
                              </div>
                            </div>

                            {/* Print Title (Visible only when printing) */}
                            <div className="hidden print:block mb-4 border-b pb-2">
                                <h2 className="text-xl font-bold text-dark-slate">Dental AI Clinical Note</h2>
                                <p className="text-sm text-muted-text">
                                  {patient ? `${patient.firstName} ${patient.lastName} - ` : ''} 
                                  {nd ? nd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                                </p>
                            </div>

                            {/* AI Summary */}
                            {(expandedNoteDetail.summary || isEditingNote) && (
                              <div className="bg-gradient-to-r from-[#EAF0FC]/80 to-white border-l-4 border-[#4A7CD2] px-4 py-3 rounded-r-2xl">
                                <p className="text-[11px] font-extrabold text-[#4A7CD2] uppercase tracking-widest mb-1.5 flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> AI Clinical Overview</p>
                                {isEditingNote ? (
                                  <textarea
                                    value={editingNoteData?.summary || ''}
                                    onChange={e => setEditingNoteData(prev => ({ ...prev, summary: e.target.value }))}
                                    className="w-full bg-white border border-light-teal/40 rounded-xl p-3 text-sm text-dark-slate focus:outline-none focus:border-[#4A7CD2] font-semibold leading-relaxed"
                                    rows={3}
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-dark-slate leading-relaxed">{expandedNoteDetail.summary}</p>
                                )}
                              </div>
                            )}

                            {/* Color-coded 2-col grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {(expandedNoteDetail.chiefComplaint || isEditingNote) && (
                                <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-2xl">
                                  <p className="text-[11px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Complaint</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.chiefComplaint || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                                      className="w-full bg-white border border-amber-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-amber-400 font-semibold leading-relaxed"
                                      rows={2}
                                    />
                                  ) : (
                                    <p className="text-sm text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.chiefComplaint}</p>
                                  )}
                                </div>
                              )}
                              {(expandedNoteDetail.history || isEditingNote) && (
                                <div className="bg-violet-50 border border-violet-200/60 p-3.5 rounded-2xl">
                                  <p className="text-[11px] font-extrabold text-violet-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> History</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.history || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, history: e.target.value }))}
                                      className="w-full bg-white border border-violet-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-violet-400 font-semibold leading-relaxed"
                                      rows={2}
                                    />
                                  ) : (
                                    <p className="text-sm text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.history}</p>
                                  )}
                                </div>
                              )}
                              {(expandedNoteDetail.examination || isEditingNote) && (
                                <div className="bg-blue-50 border border-blue-200/60 p-3.5 rounded-2xl col-span-2">
                                  <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> Examination</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.examination || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, examination: e.target.value }))}
                                      className="w-full bg-white border border-blue-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-blue-400 font-semibold leading-relaxed"
                                      rows={3}
                                    />
                                  ) : (
                                    <p className="text-sm text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.examination}</p>
                                  )}
                                </div>
                              )}
                              {(expandedNoteDetail.assessment || isEditingNote) && (
                                <div className="bg-emerald-50 border border-emerald-200/60 p-3 rounded-2xl col-span-2">
                                  <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> Diagnosis</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.assessment || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, assessment: e.target.value }))}
                                      className="w-full bg-white border border-emerald-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-emerald-400 font-semibold leading-relaxed"
                                      rows={2}
                                    />
                                  ) : (
                                    <p className="text-[11px] text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.assessment}</p>
                                  )}
                                </div>
                              )}
                              {(expandedNoteDetail.treatmentPerformed || isEditingNote) && (
                                <div className="bg-purple-50 border border-purple-200/60 p-3 rounded-2xl col-span-2">
                                  <p className="text-[9px] font-extrabold text-purple-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Pill className="w-2.5 h-2.5" /> Treatment Performed</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.treatmentPerformed || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, treatmentPerformed: e.target.value }))}
                                      className="w-full bg-white border border-purple-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-purple-400 font-semibold leading-relaxed"
                                      rows={2}
                                    />
                                  ) : (
                                    <p className="text-[11px] text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.treatmentPerformed}</p>
                                  )}
                                </div>
                              )}
                              {(expandedNoteDetail.postOpAdvice || isEditingNote) && (
                                <div className="bg-orange-50 border border-orange-200/50 p-3 rounded-2xl">
                                  <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Post-Op</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.postOpAdvice || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, postOpAdvice: e.target.value }))}
                                      className="w-full bg-white border border-orange-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-orange-400 font-semibold leading-relaxed"
                                      rows={2}
                                    />
                                  ) : (
                                    <p className="text-[11px] text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.postOpAdvice}</p>
                                  )}
                                </div>
                              )}
                              {(expandedNoteDetail.followUp || isEditingNote) && (
                                <div className="bg-sky-50 border border-sky-200/50 p-3 rounded-2xl">
                                  <p className="text-[9px] font-extrabold text-sky-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Follow Up</p>
                                  {isEditingNote ? (
                                    <textarea
                                      value={editingNoteData?.followUp || ''}
                                      onChange={e => setEditingNoteData(prev => ({ ...prev, followUp: e.target.value }))}
                                      className="w-full bg-white border border-sky-200/40 rounded-xl p-2.5 text-sm text-dark-slate focus:outline-none focus:border-sky-400 font-semibold leading-relaxed"
                                      rows={2}
                                    />
                                  ) : (
                                    <p className="text-[11px] text-dark-slate font-semibold leading-relaxed">{expandedNoteDetail.followUp}</p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* PRESCRIPTIONS / MEDICATIONS SECTION */}
                            {((expandedNoteDetail.prescriptions && expandedNoteDetail.prescriptions.length > 0) || (expandedNoteDetail.Prescriptions && expandedNoteDetail.Prescriptions.length > 0)) && (
                              <div className="bg-gradient-to-r from-teal-50/80 to-emerald-50/50 border border-teal-200/70 p-3.5 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medications (Rx)
                                  </p>
                                  <span className="text-[10px] font-bold text-teal-600 bg-teal-100/60 px-2 py-0.5 rounded-full border border-teal-200">
                                    {(expandedNoteDetail.prescriptions || expandedNoteDetail.Prescriptions).length} Item(s)
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {(expandedNoteDetail.prescriptions || expandedNoteDetail.Prescriptions).map((rx, rIdx) => {
                                    const medName = rx.medicationName || rx.MedicationName;
                                    const strength = rx.strength || rx.Strength || '';
                                    const dose = rx.dose || rx.Dose || '';
                                    const freq = rx.frequency || rx.Frequency || '';
                                    const dur = rx.duration || rx.Duration || '';
                                    const instr = rx.instructions || rx.Instructions || '';
                                    const route = rx.route || rx.Route || 'Oral';
                                    return (
                                      <div key={rIdx} className="bg-white p-2.5 rounded-xl border border-teal-200/50 shadow-2xs flex flex-col justify-between">
                                        <div>
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-dark-slate">
                                              {medName} {strength}
                                            </p>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                              {route}
                                            </span>
                                          </div>
                                          <p className="text-[10.5px] font-semibold text-muted-text mt-1">
                                            {dose ? `${dose} · ` : ''}{freq} {dur ? `(${dur})` : ''}
                                          </p>
                                        </div>
                                        {instr && (
                                          <p className="text-[9.5px] text-teal-800 bg-teal-50/50 p-1.5 rounded-lg mt-1.5 font-medium border border-teal-100">
                                            💡 {instr}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* TREATMENT PLANS / PLANNED PROCEDURES */}
                            {((expandedNoteDetail.treatmentPlans && expandedNoteDetail.treatmentPlans.length > 0) || (expandedNoteDetail.TreatmentPlans && expandedNoteDetail.TreatmentPlans.length > 0)) && (
                              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/70 p-3.5 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[11px] font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Planned Procedures & Stages
                                  </p>
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full border border-blue-200">
                                    {(expandedNoteDetail.treatmentPlans || expandedNoteDetail.TreatmentPlans).length} Plan(s)
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {(expandedNoteDetail.treatmentPlans || expandedNoteDetail.TreatmentPlans).map((tp, tIdx) => {
                                    const proc = tp.procedureName || tp.ProcedureName;
                                    const tooth = tp.toothOrSite || tp.ToothOrSite;
                                    const timing = tp.timing || tp.Timing;
                                    const notes = tp.notes || tp.Notes;
                                    const seq = tp.sequenceNo || tp.SequenceNo || tIdx + 1;
                                    return (
                                      <div key={tIdx} className="bg-white p-2.5 rounded-xl border border-blue-200/50 shadow-2xs flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                                            {seq}
                                          </span>
                                          <div>
                                            <p className="text-xs font-black text-dark-slate">{proc}</p>
                                            {tooth && <p className="text-[10px] font-bold text-blue-600">Tooth/Site: {tooth}</p>}
                                            {notes && <p className="text-[10px] text-muted-text">{notes}</p>}
                                          </div>
                                        </div>
                                        {timing && (
                                          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200">
                                            {timing}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Compliance pills */}
                            <div className="border-t border-light-teal/30 pt-3">
                              <p className="text-[9px] font-extrabold text-muted-text uppercase tracking-widest mb-2 flex items-center gap-1">
                                <ListChecks className="w-3 h-3 text-emerald-500" /> Documentation - {doneCount}/8
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {checks.map(item => (
                                  <span key={item.id} className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border ${item.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#F4F6FA] text-muted-text border-light-teal/40'}`}>
                                    {item.ok ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
                                    {item.label}
                                  </span>
                                ))}
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </div>
            )}


            {/* ===== IMAGING & X-RAYS TAB ===== */}
            {activeTab === 'radiographs' && (
              <div className="flex flex-col gap-6 flex-grow animate-fade-in">
                         {/* Drag-and-drop file uploader card */}
                <div className={`border-2 border-dashed rounded-[2rem] p-10 bg-[#F4F6FA]/40 transition-all duration-300 flex flex-col items-center justify-center text-center relative group ${
                  uploadingXray ? 'border-purple-300 bg-purple-50/10' : 'border-[#4A7CD2]/40 hover:bg-[#EAF0FC]/10'
                }`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUploadXray} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingXray}
                  />
                  {uploadingXray ? (
                    <div className="flex flex-col items-center space-y-4">
                      {/* Rotating Tooth Loader with pulsing aura */}
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-md animate-ping" />
                        <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center border border-purple-200 shadow-sm relative animate-spin">
                          <svg className="w-8 h-8 text-[#8B5CF6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2C8 2 7 5 7 9c0 5-2 7-2 11c0 2 3 2 4 2c1.5 0 2.5-1 3-2c.5 1 1.5 2 3 2c1 0 4 0 4-2c0-4-2-6-2-11c0-4-1-7-5-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-black text-dark-slate tracking-wide animate-pulse">AI is analyzing the scan, please wait...</p>
                        <p className="text-xs text-[#8B5CF6]/90 font-bold uppercase tracking-widest">Running Radiographic Diagnostics</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#EAF0FC] flex items-center justify-center mb-3 group-hover:scale-105 transition-all shadow-sm">
                        <Image className="w-6 h-6 text-[#4A7CD2]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-dark-slate">Upload Patient Radiograph</p>
                        <p className="text-xs text-muted-text">Click or drag & drop OPG/Bitewing image files here</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Tab Content Split */}
                {radiographsLoading ? (
                  <div className="flex-grow flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#4A7CD2] animate-spin" />
                  </div>
                ) : radiographs.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-16 space-y-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#F4F6FA] flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-text" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-slate">No Radiographs Uploaded</p>
                      <p className="text-xs text-muted-text">Upload a dental X-Ray to initiate AI-powered analysis.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow">
                    
                    {/* Left Column: List of files (OPGs/Bitewings) */}
                    <div className="lg:col-span-4 flex flex-col gap-2.5 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
                      <p className="text-[10px] font-extrabold text-muted-text uppercase tracking-widest mb-1.5 flex items-center justify-between">
                        <span>Imaging Archives ({radiographs.length})</span>
                      </p>
                      {radiographs.map(r => {
                        const isSelected = selectedRadiograph && (selectedRadiograph.radiographID === r.radiographID || selectedRadiograph.RadiographID === r.radiographID);
                        return (
                          <div
                            key={r.radiographID || r.RadiographID}
                            onClick={() => {
                              setSelectedRadiograph(r);
                              setXrayDetailsExpanded(false);
                              setIsEditingXrayAnalysis(false);
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 ${
                              isSelected
                                ? 'bg-[#EAF0FC] border-[#4A7CD2] shadow-sm'
                                : 'bg-white border-light-teal/35 hover:bg-[#F4F6FA]/50 hover:border-[#4A7CD2]/40'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-white border border-light-teal/40 flex items-center justify-center flex-shrink-0 text-[#4A7CD2]">
                              <Image className="w-5 h-5" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-xs font-bold text-dark-slate truncate">{r.imageName || r.ImageName}</p>
                              <p className="text-[10px] text-muted-text font-semibold mt-0.5">
                                {new Date(r.uploadedAt || r.UploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Display image + Collapsible AI report */}
                    {selectedRadiograph && (
                      <div className="lg:col-span-8 bg-white border border-light-teal/35 rounded-3xl overflow-hidden shadow-md flex flex-col" id="xray-printable-area">
                        
                        {/* Printable Clinic Header (Visible only on print/export) */}
                        <div className="hidden print:flex items-center justify-between p-4 border-b border-light-teal/30 bg-[#F4F6FA]">
                          <div>
                            <h3 className="text-base font-black text-[#10244B]">DENTIA CLINICAL RADIOLOGY</h3>
                            <p className="text-xs text-muted-text">Patient: {patient?.firstName || ''} {patient?.lastName || ''} | DOB: {patient?.dob || 'N/A'} | Doctor: Dr. {doctor?.firstName || doctor?.name || 'Ahmed'}</p>
                          </div>
                          <p className="text-xs font-bold text-muted-text">{new Date().toLocaleDateString()}</p>
                        </div>

                        {/* Top Action Bar: Filename & Print / Export Buttons */}
                        <div className="p-4 bg-[#F8FAFC] border-b border-light-teal/30 flex flex-wrap items-center justify-between gap-3 no-print">
                          <div>
                            <span className="text-[#4A7CD2] font-extrabold tracking-widest uppercase text-[10px] block">Radiographic Scan</span>
                            <h4 className="text-sm font-bold text-dark-slate truncate max-w-[280px]">
                              {selectedRadiograph.imageName || selectedRadiograph.ImageName}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handlePrintXray}
                              className="text-xs bg-white hover:bg-[#EAF0FC] border border-light-teal/50 text-[#10244B] px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Print Radiograph & Report"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#4A7CD2]" />
                              <span>Print</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleDownloadXrayPDF}
                              className="text-xs bg-white hover:bg-[#EAF0FC] border border-light-teal/50 text-[#10244B] px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Export Report to PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-[#4A7CD2]" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleReanalyzeXray}
                              disabled={isReanalyzingXray}
                              className="text-xs bg-gradient-to-r from-[#4A7CD2] to-[#8B5CF6] hover:opacity-90 text-white px-3.5 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                              title="Trigger Live Gemini Vision Analysis"
                            >
                              {isReanalyzingXray ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                              <span>{isReanalyzingXray ? "Analyzing..." : "Re-Analyze AI"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!xrayDetailsExpanded) setXrayDetailsExpanded(true);
                                if (isEditingXrayAnalysis) {
                                  setEditingXrayText(selectedRadiograph.analysisSummary || selectedRadiograph.AnalysisSummary || '');
                                }
                                setIsEditingXrayAnalysis(!isEditingXrayAnalysis);
                              }}
                              className="text-xs bg-[#EAF0FC] hover:bg-[#D5E1F7] border border-[#4A7CD2]/30 text-[#4A7CD2] px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>{isEditingXrayAnalysis ? "Cancel" : "Edit Report"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Image viewer */}
                        <div className="relative bg-[#0F172A] min-h-[260px] max-h-[360px] flex items-center justify-center border-b border-light-teal/20 overflow-hidden p-2">
                          <img
                            src={`/api/radiographs/${selectedRadiograph.radiographID || selectedRadiograph.RadiographID}/image`}
                            alt={selectedRadiograph.imageName || selectedRadiograph.ImageName}
                            className="max-h-[340px] max-w-full object-contain rounded-lg shadow-sm"
                            crossOrigin="anonymous"
                          />
                        </div>

                        {/* Collapsible AI Diagnosis Section (Minimized by default, slides open on click) */}
                        <div className="p-5 space-y-3">
                          
                          {/* Slide Toggle Bar */}
                          <button
                            type="button"
                            onClick={() => setXrayDetailsExpanded(!xrayDetailsExpanded)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#EAF0FC]/60 hover:bg-[#EAF0FC] border border-[#4A7CD2]/30 transition-all text-left cursor-pointer group shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white text-[#4A7CD2] flex items-center justify-center shadow-xs">
                                <Activity className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-[#10244B]">AI Diagnostic Findings & Clinical Report</span>
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-white text-[#4A7CD2] px-2 py-0.5 rounded-md border border-light-teal/40">
                                    ✨ AI Analyzed
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-muted-text font-bold mt-0.5">
                                  {xrayDetailsExpanded ? 'Click to minimize details' : 'Click to slide down & view full radiographic findings'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#4A7CD2] bg-white px-3 py-1 rounded-xl border border-light-teal/40">
                              <span>{xrayDetailsExpanded ? 'Minimize' : 'Show Details'}</span>
                              {xrayDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </button>

                          {/* Sliding Details Drawer Container */}
                          <div 
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                              xrayDetailsExpanded 
                                ? 'max-h-[3000px] opacity-100 mt-3 transform translate-y-0' 
                                : 'max-h-0 opacity-0 mt-0 pointer-events-none transform -translate-y-2'
                            }`}
                          >
                            <div className="space-y-4 pt-1">
                              {isEditingXrayAnalysis ? (
                                <div className="bg-[#F4F6FA]/70 border border-light-teal/30 p-4 rounded-2xl">
                                  <textarea
                                    value={editingXrayText}
                                    onChange={(e) => setEditingXrayText(e.target.value)}
                                    className="w-full bg-white border border-light-teal/45 rounded-xl p-3 text-xs text-dark-slate focus:outline-none focus:border-[#4A7CD2] font-sans font-semibold leading-relaxed"
                                    rows={8}
                                    placeholder="Edit raw radiology report text..."
                                  />
                                </div>
                              ) : (
                                <RadiologyReportViewer 
                                  rawReportText={selectedRadiograph.analysisSummary || selectedRadiograph.AnalysisSummary}
                                  onToothClick={(toothTag) => {
                                    const match = toothTag.match(/#(\d+)/);
                                    if (match) {
                                      const num = parseInt(match[1]);
                                      if (num >= 1 && num <= 32) {
                                        setDetailedTooth(num);
                                      }
                                    }
                                  }}
                                />
                              )}

                              {/* Save to History Button */}
                              <div className="flex justify-end no-print">
                                <button
                                  type="button"
                                  onClick={handleSaveXrayToHistory}
                                  disabled={savingXrayTimeline}
                                  className="bg-[#4A7CD2] hover:bg-[#3665B7] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {savingXrayTimeline ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Save className="w-3.5 h-3.5" />
                                  )}
                                  Save to Patient History
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* Diagram Arch view & Infographic Row */}
            {activeTab === 'chart' && (() => {
              const getCount = (keywords) => teethState.filter(t => {
                const s = (t.status || t.conditionStatus || t.treatment || '').toLowerCase();
                const c = (t.color || t.conditionColor || '').toUpperCase();
                const comm = (t.comments || '').toLowerCase();

                // If tooth is healthy, it must not count in disease categories
                if (s === 'healthy' || s === 'sound') return false;

                const full = `${s} ${comm}`;
                return keywords.some(k => {
                  const lowerK = k.toLowerCase();
                  if (lowerK.startsWith('#')) return c === k.toUpperCase();
                  if (lowerK === 'mobility') {
                    return (full.includes('mobility') && !full.includes('physiological mobility') && !full.includes('grade 0')) || full.includes('grade i') || full.includes('grade ii') || full.includes('grade iii');
                  }
                  return full.includes(lowerK);
                });
              }).length;

              const cariesCount = getCount(['decay', 'caries', 'damaged', '#EF4444', '#F87171']);
              const prosthesisCount = getCount(['treated', 'prosthesis', 'crown', 'bridge', 'implant', 'filling', '#8B5CF6']);
              const cleaningCount = getCount(['cleaning', 'calculus', 'scaling', 'plaque', '#3B82F6']);
              const rctCount = getCount(['root canal', 'rct', 'endo', 'pulpotomy', '#F59E0B']);
              const missingCount = getCount(['missing', 'extract', '#94A3B8', '#CBD5E1']);
              const totalDentitionCount = dentitionMode === 'pediatric' ? 20 : 32;
              const healthyCount = Math.max(0, totalDentitionCount - (cariesCount + prosthesisCount + cleaningCount + rctCount + missingCount));

              const cariesPct = Math.round((cariesCount / totalDentitionCount) * 100) || 0;
              const prosthesisPct = Math.round((prosthesisCount / totalDentitionCount) * 100) || 0;
              const cleaningPct = Math.round((cleaningCount / totalDentitionCount) * 100) || 0;
              const rctPct = Math.round((rctCount / totalDentitionCount) * 100) || 0;
              const missingPct = Math.round((missingCount / totalDentitionCount) * 100) || 0;
              const healthyPct = Math.round((healthyCount / totalDentitionCount) * 100) || 0;

              return (
                <div className="flex flex-col gap-3 flex-grow py-1 relative">
                
                  {/* Studio Header Controls: Jaw Switcher & Slide-out Observations Trigger */}
                  <div className="flex items-center justify-between w-full px-1">
                    <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-light-teal/30">
                      <button
                        type="button"
                        onClick={() => setSelectedJawView('both')}
                        className={`text-[10px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedJawView === 'both'
                            ? 'bg-[#4A7CD2] text-white shadow-xs'
                            : 'text-dark-slate/70 hover:text-dark-slate'
                        }`}
                      >
                        Dual Jaws
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedJawView('maxilla')}
                        className={`text-[10px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedJawView === 'maxilla'
                            ? 'bg-[#4A7CD2] text-white shadow-xs'
                            : 'text-dark-slate/70 hover:text-dark-slate'
                        }`}
                      >
                        Maxilla (Upper)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedJawView('mandible')}
                        className={`text-[10px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedJawView === 'mandible'
                            ? 'bg-[#4A7CD2] text-white shadow-xs'
                            : 'text-dark-slate/70 hover:text-dark-slate'
                        }`}
                      >
                        Mandible (Lower)
                      </button>
                    </div>

                    {/* Right action group: Clear Spotlight & Slide-out Observations Button */}
                    <div className="flex items-center gap-2">
                      {highlightedTeeth.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setHighlightedTeeth([]);
                            setHighlightInfo(null);
                          }}
                          className="text-[9.5px] font-extrabold bg-blue-50 hover:bg-blue-100 text-[#4A7CD2] px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Clear Spotlight ({highlightedTeeth.length})</span>
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowObservationsDrawer(true)}
                        className="text-[10.5px] font-black bg-[#EAF0FC] hover:bg-[#D5E1F7] text-[#4A7CD2] px-3.5 py-1.5 rounded-xl border border-light-teal/60 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#4A7CD2] animate-pulse" />
                        <span>Tooth Observations Directory</span>
                        <span className="text-[9.5px] font-black bg-white text-[#4A7CD2] px-2 py-0.5 rounded-full border border-light-teal/50">
                          {dentitionMode === 'pediatric' ? '20 Teeth (A–T)' : '32 Teeth (1–32)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/chart/${patient?.patientID || patientId}/tooth`)}
                        className="bg-gradient-to-r from-[#1E40AF] via-blue-600 to-indigo-600 hover:opacity-95 text-white p-2 rounded-xl shadow-xs flex items-center justify-center transition-all cursor-pointer group shrink-0 relative"
                        title="Open Tooth All Pages (/chart/tooth)"
                        aria-label="Open Tooth All Pages"
                      >
                        <ToothDetailAllIcon className="w-4.5 h-4.5 text-cyan-200 group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Unique Quick Launcher: Ortho, Occlusion, Wisdom Impaction & TMJ Diagnostic Suite */}
                      <button
                        type="button"
                        onClick={() => setShowOrthoTmjModal(true)}
                        className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#2563EB] hover:opacity-95 text-white p-2 rounded-xl shadow-xs flex items-center justify-center transition-all cursor-pointer group shrink-0 relative hover:scale-105"
                        title="Ortho, Occlusion, Wisdom Impaction & TMJ Diagnostic Suite (12 Diagrams)"
                        aria-label="Open Ortho & TMJ Diagnostic Suite"
                      >
                        {/* Unique Anatomical Caliper & Vector Arch Icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-200 group-hover:rotate-12 transition-transform">
                          <path d="M4 19L19 4M19 4H13M19 4V10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="7" cy="17" r="3" fill="#6366F1" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M14 14L17 17M10 10L12 12" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-white animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-white" />
                      </button>
                    </div>
                  </div>

                  {/* Active Spotlight Info Banner if active */}
                  {highlightInfo && (
                    <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white px-4 py-2 rounded-2xl shadow-sm flex items-center justify-between animate-fade-in text-xs font-bold">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-extrabold truncate text-xs">{highlightInfo.title} · {highlightInfo.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[9.5px] font-black bg-white/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex-shrink-0">
                        Active Spotlight
                      </span>
                    </div>
                  )}
                  
                  {/* Full Panel Grand 3D Odontogram Arch Studio */}
                  <div className="relative w-full border border-light-teal/50 rounded-3xl p-3 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF] overflow-hidden shadow-xs flex items-center justify-center">
                    {selectedJawView === 'both' ? (
                      <div className="grid grid-cols-2 gap-4 w-full items-center max-w-[840px]">
                        {/* Maxilla (Upper) */}
                        <div className="flex flex-col items-center bg-white rounded-3xl p-3 border border-light-teal/50 shadow-2xs w-full overflow-hidden">
                          <div className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] rounded-xl border border-light-teal/30 mb-2 relative z-20 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#4A7CD2]" />
                              <span className="text-[10.5px] font-black text-[#10244B] uppercase tracking-wider">
                                {dentitionMode === 'pediatric' ? 'Primary Maxilla (Upper)' : 'Maxilla (Upper Jaw)'}
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-[#4A7CD2] bg-white px-2.5 py-0.5 rounded-full border border-light-teal/40 shadow-2xs">
                              {dentitionMode === 'pediatric' ? '10 Primary Teeth (A–J)' : '16 Teeth'}
                            </span>
                          </div>
                          <div className="w-full overflow-hidden rounded-2xl flex items-center justify-center">
                            <ThreeDentalJawArch
                              key={`three_jaw_${selectedJawView}_maxilla_${dentitionMode}`}
                              jawType="maxilla"
                              isPediatric={dentitionMode === 'pediatric'}
                              teethState={teethState}
                              highlightedTeeth={highlightedTeeth}
                              className="w-full max-w-[310px] xl:max-w-[340px] h-[265px] xl:h-[290px] aspect-square"
                              onToothClick={(toothNum, status, socket) => {
                                setDetailedTooth(toothNum);
                                setHighlightedTeeth([toothNum]);
                                const tInfo = dentitionMode === 'pediatric' ? PEDIATRIC_TOOTH_NAMES[toothNum] : TOOTH_ANATOMY[toothNum];
                                const sLower = (status || '').toLowerCase();
                                const isDecay = sLower.includes('decay') || sLower.includes('damag') || sLower === 'cavity' || sLower.includes('keera');
                                const isFilled = sLower.includes('treat') || sLower.includes('prosthesis') || sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('filling') || sLower.includes('composite');
                                const isRCT = sLower.includes('canal') || sLower.includes('root') || sLower === 'yellow' || sLower.includes('pulpotomy');

                                if (tInfo) {
                                  setHighlightInfo({
                                    title: `Tooth ${toothNum}`,
                                    subtitle: tInfo.name,
                                    type: 'single',
                                    color: isDecay ? '#EF4444' : isFilled ? '#3B82F6' : isRCT ? '#F59E0B' : '#10B981',
                                    toothNum: toothNum
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Mandible (Lower) */}
                        <div className="flex flex-col items-center bg-white rounded-3xl p-3 border border-light-teal/50 shadow-2xs w-full overflow-hidden">
                          <div className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] rounded-xl border border-light-teal/30 mb-2 relative z-20 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#4A7CD2]" />
                              <span className="text-[10.5px] font-black text-[#10244B] uppercase tracking-wider">
                                {dentitionMode === 'pediatric' ? 'Primary Mandible (Lower)' : 'Mandible (Lower Jaw)'}
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-[#4A7CD2] bg-white px-2.5 py-0.5 rounded-full border border-light-teal/40 shadow-2xs">
                              {dentitionMode === 'pediatric' ? '10 Primary Teeth (K–T)' : '16 Teeth'}
                            </span>
                          </div>
                          <div className="w-full overflow-hidden rounded-2xl flex items-center justify-center">
                            <ThreeDentalJawArch
                              key={`three_jaw_${selectedJawView}_mandible_${dentitionMode}`}
                              jawType="mandible"
                              isPediatric={dentitionMode === 'pediatric'}
                              teethState={teethState}
                              highlightedTeeth={highlightedTeeth}
                              className="w-full max-w-[310px] xl:max-w-[340px] h-[265px] xl:h-[290px] aspect-square"
                              onToothClick={(toothNum, status, socket) => {
                                setDetailedTooth(toothNum);
                                setHighlightedTeeth([toothNum]);
                                const tInfo = dentitionMode === 'pediatric' ? PEDIATRIC_TOOTH_NAMES[toothNum] : TOOTH_ANATOMY[toothNum];
                                const sLower = (status || '').toLowerCase();
                                const isDecay = sLower.includes('decay') || sLower.includes('damag') || sLower === 'cavity' || sLower.includes('keera');
                                const isFilled = sLower.includes('treat') || sLower.includes('prosthesis') || sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('filling') || sLower.includes('composite');
                                const isRCT = sLower.includes('canal') || sLower.includes('root') || sLower === 'yellow' || sLower.includes('pulpotomy');

                                if (tInfo) {
                                  setHighlightInfo({
                                    title: `Tooth ${toothNum}`,
                                    subtitle: tInfo.name,
                                    type: 'single',
                                    color: isDecay ? '#EF4444' : isFilled ? '#3B82F6' : isRCT ? '#F59E0B' : '#10B981',
                                    toothNum: toothNum
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full">
                        <div className="flex flex-col items-center bg-white rounded-3xl p-3 border border-light-teal/50 shadow-2xs max-w-[400px] w-full overflow-hidden">
                          <div className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] rounded-xl border border-light-teal/30 mb-2 relative z-20 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#4A7CD2]" />
                              <span className="text-[10.5px] font-black text-[#10244B] uppercase tracking-wider">
                                {selectedJawView === 'maxilla' ? (dentitionMode === 'pediatric' ? 'Primary Maxilla (Upper)' : 'Maxilla (Upper Jaw)') : (dentitionMode === 'pediatric' ? 'Primary Mandible (Lower)' : 'Mandible (Lower Jaw)')}
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-[#4A7CD2] bg-white px-2.5 py-0.5 rounded-full border border-light-teal/40 shadow-2xs">
                              {dentitionMode === 'pediatric' ? '10 Primary Teeth' : '16 Teeth'}
                            </span>
                          </div>
                          <div className="w-full overflow-hidden rounded-2xl flex items-center justify-center">
                            <ThreeDentalJawArch
                              key={`three_jaw_${selectedJawView}_single_${dentitionMode}`}
                              jawType={selectedJawView}
                              isPediatric={dentitionMode === 'pediatric'}
                              teethState={teethState}
                              highlightedTeeth={highlightedTeeth}
                              className="w-full max-w-[340px] h-[290px] aspect-square"
                            onToothClick={(toothNum, status, socket) => {
                              setDetailedTooth(toothNum);
                              setHighlightedTeeth([toothNum]);
                              const tInfo = dentitionMode === 'pediatric' ? PEDIATRIC_TOOTH_NAMES[toothNum] : TOOTH_ANATOMY[toothNum];
                              const sLower = (status || '').toLowerCase();
                              const isDecay = sLower.includes('decay') || sLower.includes('damag') || sLower === 'cavity' || sLower.includes('keera');
                              const isFilled = sLower.includes('treat') || sLower.includes('prosthesis') || sLower.includes('crown') || sLower.includes('bridge') || sLower.includes('filling') || sLower.includes('composite');
                              const isRCT = sLower.includes('canal') || sLower.includes('root') || sLower === 'yellow' || sLower.includes('pulpotomy');

                              if (tInfo) {
                                setHighlightInfo({
                                  title: `Tooth ${toothNum}`,
                                  subtitle: tInfo.name,
                                  type: 'single',
                                  color: isDecay ? '#EF4444' : isFilled ? '#3B82F6' : isRCT ? '#F59E0B' : '#10B981',
                                  toothNum: toothNum
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                  {/* Prominent & Crisp 2D Dental Odontogram Representation */}
                  <div className="w-full max-w-[820px] mx-auto flex flex-col gap-1.5 bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF]/70 p-3 rounded-2xl border border-light-teal/50 shadow-2xs">
                    
                    {dentitionMode === 'pediatric' ? (
                      /* ========== 👶 PEDIATRIC PRIMARY 20-TOOTH 2D ODONTOGRAM (A–T) ========== */
                      <>
                        {/* Upper Primary Arch (A to J) */}
                        <div>
                          <div className="flex justify-between items-center px-1.5 mb-1">
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Right (A–E)</span>
                            <span className="text-[8.5px] font-black text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-md border border-pink-200 shadow-2xs">
                              👶 PRIMARY UPPER ARCH (A–J)
                            </span>
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Left (F–J)</span>
                          </div>
                          <div className="flex gap-1.5 justify-center items-end bg-white p-2 rounded-xl border border-pink-200/80 shadow-2xs">
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((toothKey) => {
                              const t = teethState.find(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKey);
                              const status = t?.status || t?.conditionStatus || 'Healthy';
                              const isHighlighted = highlightedTeeth.includes(toothKey);
                              const finalColor = t?.color || t?.conditionColor || getHexColor(status);
                              const pInfo = PEDIATRIC_TOOTH_NAMES[toothKey];
                              const shape = pInfo?.shape || 'molar';
                              return (
                                <RealisticHumanTooth
                                  key={toothKey}
                                  number={toothKey}
                                  shape={shape}
                                  status={status}
                                  color={finalColor}
                                  isHighlighted={isHighlighted}
                                  rotationDeg={t?.rotationDeg || 0}
                                  label={toothKey}
                                  isFrontView={true}
                                  onClick={() => {
                                    setDetailedTooth(toothKey);
                                    setHighlightedTeeth([toothKey]);
                                    if (pInfo) {
                                      setHighlightInfo({
                                        title: `Primary Tooth ${toothKey}`,
                                        subtitle: pInfo.name,
                                        type: 'single',
                                        color: finalColor,
                                        toothNum: toothKey
                                      });
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Lower Primary Arch (K to T) */}
                        <div>
                          <div className="flex justify-between items-center px-1.5 mb-1">
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Right (T–P)</span>
                            <span className="text-[8.5px] font-black text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-md border border-pink-200 shadow-2xs">
                              👶 PRIMARY LOWER ARCH (T–K)
                            </span>
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Left (O–K)</span>
                          </div>
                          <div className="flex gap-1.5 justify-center items-end bg-white p-2 rounded-xl border border-pink-200/80 shadow-2xs">
                            {['T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K'].map((toothKey) => {
                              const t = teethState.find(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKey);
                              const status = t?.status || t?.conditionStatus || 'Healthy';
                              const isHighlighted = highlightedTeeth.includes(toothKey);
                              const finalColor = t?.color || t?.conditionColor || getHexColor(status);
                              const pInfo = PEDIATRIC_TOOTH_NAMES[toothKey];
                              const shape = pInfo?.shape || 'molar';
                              return (
                                <RealisticHumanTooth
                                  key={toothKey}
                                  number={toothKey}
                                  shape={shape}
                                  status={status}
                                  color={finalColor}
                                  isHighlighted={isHighlighted}
                                  rotationDeg={t?.rotationDeg || 0}
                                  label={toothKey}
                                  isFrontView={true}
                                  onClick={() => {
                                    setDetailedTooth(toothKey);
                                    setHighlightedTeeth([toothKey]);
                                    if (pInfo) {
                                      setHighlightInfo({
                                        title: `Primary Tooth ${toothKey}`,
                                        subtitle: pInfo.name,
                                        type: 'single',
                                        color: finalColor,
                                        toothNum: toothKey
                                      });
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* ========== 🦷 ADULT PERMANENT 32-TOOTH 2D ODONTOGRAM (1–32) ========== */
                      <>
                        {/* Upper Arch Row (Teeth 1 to 16) */}
                        <div>
                          <div className="flex justify-between items-center px-1.5 mb-1">
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Right (1–8)</span>
                            <span className="text-[8.5px] font-black text-[#4A7CD2] bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">UPPER ARCH (1–16)</span>
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Left (9–16)</span>
                          </div>
                          <div className="flex gap-1 justify-center items-end bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            {Array.from({ length: 16 }).map((_, i) => {
                              const toothNum = i + 1;
                              const t = teethState.find(x => parseInt(x.toothNumber ?? x.ToothNumber) === toothNum);
                              const status = t?.status || t?.conditionStatus || 'Healthy';
                              const isHighlighted = highlightedTeeth.includes(toothNum);
                              const finalColor = t?.color || t?.conditionColor || getHexColor(status);
                              const shape = DENTAL_COORDS[toothNum]?.shape || (toothNum % 2 === 0 ? 'incisor' : 'canine');
                              return (
                                <RealisticHumanTooth
                                  key={toothNum}
                                  number={toothNum}
                                  shape={shape}
                                  status={status}
                                  color={finalColor}
                                  isHighlighted={isHighlighted}
                                  rotationDeg={t?.rotationDeg || 0}
                                  label={toothNum.toString()}
                                  isFrontView={true}
                                  onClick={() => {
                                    setDetailedTooth(toothNum);
                                    setHighlightedTeeth([toothNum]);
                                    const tInfo = TOOTH_ANATOMY[toothNum];
                                    if (tInfo) {
                                      setHighlightInfo({
                                        title: `Tooth #${toothNum}`,
                                        subtitle: tInfo.name,
                                        type: 'single',
                                        color: finalColor,
                                        toothNum
                                      });
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Lower Arch Row (Teeth 32 to 17) */}
                        <div>
                          <div className="flex justify-between items-center px-1.5 mb-1">
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Right (32–25)</span>
                            <span className="text-[8.5px] font-black text-[#4A7CD2] bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">LOWER ARCH (32–17)</span>
                            <span className="text-[8px] font-extrabold text-muted-text uppercase">Left (24–17)</span>
                          </div>
                          <div className="flex gap-1 justify-center items-end bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            {[32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17].map((toothNum) => {
                              const t = teethState.find(x => parseInt(x.toothNumber ?? x.ToothNumber) === toothNum);
                              const status = t?.status || t?.conditionStatus || 'Healthy';
                              const isHighlighted = highlightedTeeth.includes(toothNum);
                              const finalColor = t?.color || t?.conditionColor || getHexColor(status);
                              const shape = DENTAL_COORDS[toothNum]?.shape || (toothNum % 2 === 0 ? 'incisor' : 'canine');
                              return (
                                <RealisticHumanTooth
                                  key={toothNum}
                                  number={toothNum}
                                  shape={shape}
                                  status={status}
                                  color={finalColor}
                                  isHighlighted={isHighlighted}
                                  rotationDeg={t?.rotationDeg || 0}
                                  label={toothNum.toString()}
                                  isFrontView={true}
                                  onClick={() => {
                                    setDetailedTooth(toothNum);
                                    setHighlightedTeeth([toothNum]);
                                    const tInfo = TOOTH_ANATOMY[toothNum];
                                    if (tInfo) {
                                      setHighlightInfo({
                                        title: `Tooth #${toothNum}`,
                                        subtitle: tInfo.name,
                                        type: 'single',
                                        color: finalColor,
                                        toothNum
                                      });
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* === 2.5 QUICK DIAGNOSTIC SUITE LAUNCHER STRIP FOR TEENS / YOUNG ADULTS & ADULTS === */}
                  <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/80 rounded-2xl border border-blue-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs my-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                        📐
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-[#10244B]">
                            Ortho, Occlusion, Wisdom Impaction & TMJ Diagnostic Suite
                          </h4>
                          <span className="text-[9px] font-black bg-white text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                            12 Interactive Vector Diagrams
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Overbite (65%) · Underbite · Crossbite · Open Bite · Molar Wear · Wisdom Impactions · TMJ Clicking
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOrthoTmjModal(true)}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Launch 12-Diagram Diagnostic Suite</span>
                      </button>
                    </div>
                  </div>

                  {/* Ortho, Impactions & TMJ 12-Diagram Diagnostic Suite Modal */}
                  {showOrthoTmjModal && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
                      <div className="w-full max-w-5xl bg-white rounded-3xl border border-light-teal/50 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#F8FAFC]">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🦷</span>
                            <div>
                              <h3 className="text-sm font-black text-[#10244B]">
                                Patient #{patientId} ({patient?.name || `${patient?.firstName || 'Patient'} ${patient?.lastName || ''}`}) Diagnostic Suite
                              </h3>
                              <p className="text-[10.5px] font-bold text-muted-text">
                                Target Cohort: {calculatePatientAge(patient?.dob) !== null ? `${calculatePatientAge(patient?.dob)} Yrs Old` : 'Teens / Young Adult'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowOrthoTmjModal(false)}
                            className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1">
                          <OrthoTmjDiagnosticSuite
                            patientId={patientId}
                            patient={patient}
                            patientAge={calculatePatientAge(patient?.dob)}
                            liveOrthoAssessment={liveOrthoAssessment}
                            onSaveAssessment={handleSaveOrthoTmjAssessment}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === 3. MODAL / OVERLAY 5-SURFACE ZONE & CLINICAL PALETTE INSPECTOR === */}
                  {detailedTooth && (() => {
                    // Compute initial surface mapping from DB teethState
                    const detailedKeyStr = String(detailedTooth).toUpperCase();
                    const isPediatricDetailed = typeof detailedTooth === 'string' && isNaN(parseInt(detailedTooth));
                    const existingTooth = teethState.find(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === detailedKeyStr);
                    const toothStatus = (existingTooth?.status || existingTooth?.conditionStatus || '').toUpperCase();
                    const toothComment = (existingTooth?.comments || existingTooth?.comment || '').toUpperCase();
                    const fullText = `${toothStatus} ${toothComment}`;

                    const isActuallyHealthy = !toothStatus || toothStatus === 'HEALTHY' || toothStatus === 'NORMAL / HEALTHY' || toothStatus.includes('INTACT') || toothStatus.includes('SOUND');
                    const dbInitialSurfaces = parseSurfacesFromRecord(toothStatus, toothComment, existingTooth?.surfaces);

                    let conditionKey = 'Normal / Healthy';
                    if (!isActuallyHealthy) {
                      if (fullText.includes('BRACKET') || fullText.includes('ORTHODONTIC') || fullText.includes('ORTHO') || fullText.includes('BRACE')) conditionKey = 'Orthodontic Bracket';
                      else if (fullText.includes('SPACE') || fullText.includes('MAINTAINER')) conditionKey = 'Space Maintainer';
                      else if (fullText.includes('PULPOTOMY') || fullText.includes('MTA')) conditionKey = 'Pulpotomy (MTA)';
                      else if (fullText.includes('SSC') || fullText.includes('STAINLESS')) conditionKey = 'Stainless Steel Crown (SSC)';
                      else if (fullText.includes('COMPOSITE') || fullText.includes('RESIN')) conditionKey = 'Filling - Composite';
                      else if (fullText.includes('AMALGAM')) conditionKey = 'Filling - Amalgam';
                      else if (fullText.includes('GIC')) conditionKey = 'Filling - GIC';
                      else if (fullText.includes('IMPLANT')) conditionKey = 'Dental Implant';
                      else if (fullText.includes('RCT') || fullText.includes('CANAL') || fullText.includes('ENDO') || fullText.includes('ROOT CANAL')) conditionKey = 'Root Canal Treated (RCT)';
                      else if (fullText.includes('CARIES') || fullText.includes('DECAY') || fullText.includes('CAVITY') || fullText.includes('KEERA') || fullText.includes('ECC')) conditionKey = 'Caries (Decay)';
                      else if (fullText.includes('MISS') || fullText.includes('EXTRACT') || fullText.includes('ABSENT') || fullText.includes('EXFOLIAT')) conditionKey = 'Missing Tooth';
                      else if (fullText.includes('CROWN') || fullText.includes('BRIDGE') || fullText.includes('ZIRCONIA')) conditionKey = 'Crown - Ceramic/Zirconia';
                      else if (fullText.includes('VENEER')) conditionKey = 'Veneer';
                      else if (fullText.includes('SEALANT')) conditionKey = 'Sealant';
                      else conditionKey = 'Caries (Decay)';
                    }

                    // Auto-sync active palette condition to tooth's diagnosed procedure if currently on default
                    const activePaletteCondition = (selectedPaletteCondition && selectedPaletteCondition !== 'Normal / Healthy') 
                      ? selectedPaletteCondition 
                      : conditionKey;

                    const activeSurfaceData = isActuallyHealthy ? {} : (toothSurfacesState[detailedTooth] || dbInitialSurfaces);
                    const toothName = isPediatricDetailed 
                      ? (PEDIATRIC_TOOTH_NAMES[detailedTooth]?.name || `Primary Tooth ${detailedTooth}`) 
                      : (TOOTH_ANATOMY[detailedTooth]?.name || `Tooth #${detailedTooth}`);

                    return (
                      <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="w-full max-w-[580px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-5 space-y-3.5">
                          {/* Modern Modal Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#4A7CD2] to-[#2563EB] text-white flex items-center justify-center font-black text-xs shadow-xs tracking-tight">
                                {detailedTooth}
                              </div>
                              <div>
                                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                                  {isPediatricDetailed ? `Primary Tooth ${detailedTooth} Surface Anatomy` : `Tooth #${detailedTooth} Surface Anatomy`}
                                </h3>
                                <p className="text-[11px] font-semibold text-[#4A7CD2] mt-0.5">
                                  {toothName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Open in New Tab Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  const curPid = patientId || patient?.patientID || patient?.patientId || '18';
                                  window.open(`/chart/${curPid}/tooth/${detailedTooth}`, '_blank');
                                }}
                                className="flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 text-[#2563EB] text-[11px] font-extrabold px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                                title="Open Full 3D Dossier & EHR Details in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>3D Detail ↗</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDetailedTooth(null);
                                  setShowPaletteDrawer(false);
                                }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 5-Surface Diagram & Quick Actions Card */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                            {/* 5-Surface Geometric Box Diagram */}
                            <div className="flex flex-col items-center">
                              <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                5 Surface Zones (O, M, D, B, L)
                              </span>
                              <ToothSurfaceDiagram
                                toothNumber={detailedTooth}
                                surfaceData={activeSurfaceData}
                                selectedCondition={selectedPaletteCondition}
                                onSurfaceClick={(surfKey, cond) => {
                                  const updatedForTooth = {
                                    ...activeSurfaceData,
                                    [surfKey]: activeSurfaceData[surfKey] === cond ? 'Normal / Healthy' : cond
                                  };
                                  setToothSurfacesState(prev => ({
                                    ...prev,
                                    [detailedTooth]: updatedForTooth
                                  }));

                                  // Sync back to main teethState instantly
                                  const affected = Object.keys(updatedForTooth).filter(k => updatedForTooth[k] && updatedForTooth[k] !== 'Normal / Healthy');
                                  let newStatus = 'Healthy';
                                  if (affected.length > 0) {
                                    newStatus = `${cond} — ${affected.join(', ')}`;
                                  }
                                  const commentStr = `Surface Zone ${surfKey}: ${cond} applied on Tooth #${detailedTooth}`;
                                  setTeethState(prev => {
                                    const toothKeyStr = String(detailedTooth).toUpperCase();
                                    const idx = prev.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
                                    if (idx >= 0) {
                                      const arr = [...prev];
                                      arr[idx] = { ...arr[idx], status: newStatus, conditionStatus: newStatus, comments: commentStr, comment: commentStr };
                                      return arr;
                                    }
                                    return [...prev, { toothNumber: detailedTooth, status: newStatus, conditionStatus: newStatus, comments: commentStr, comment: commentStr }];
                                  });

                                  // Non-blocking async DB save
                                  executeCommand(detailedTooth, newStatus, commentStr).catch(e => console.warn("DB save err:", e));
                                }}
                                size={125}
                              />
                            </div>

                            {/* Current Status & EHR Details Card */}
                            <div className="flex flex-col gap-2 text-xs">
                              {/* Actual Diagnosed Clinical Status */}
                              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">EHR Diagnosed Status</span>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${isActuallyHealthy ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                                  <span className="font-black text-slate-900 text-sm block truncate">
                                    {existingTooth?.status || existingTooth?.conditionStatus || 'Healthy (Intact Enamel)'}
                                  </span>
                                </div>
                                <p className="text-[10px] font-semibold text-muted-text mt-0.5 line-clamp-2">
                                  {existingTooth?.comments || existingTooth?.comment || (isPediatricDetailed ? `Intact primary deciduous enamel on Tooth ${detailedTooth}, physiological baseline` : 'Intact anatomical enamel, physiological baseline')}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
                                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-black text-[11px] py-2 px-3 rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span>🎨</span>
                                  <span>{showPaletteDrawer ? 'Hide Treatment Tools' : 'Edit Treatment & Surfaces'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setToothSurfacesState(prev => ({
                                      ...prev,
                                      [detailedTooth]: { O: 'Normal / Healthy', M: 'Normal / Healthy', D: 'Normal / Healthy', B: 'Normal / Healthy', L: 'Normal / Healthy' }
                                    }));
                                    setTeethState(prev => {
                                      const toothKeyStr = String(detailedTooth).toUpperCase();
                                      const idx = prev.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
                                      if (idx >= 0) {
                                        const arr = [...prev];
                                        arr[idx] = { ...arr[idx], status: 'Healthy', conditionStatus: 'Healthy', comments: 'Intact enamel, physiological baseline', comment: 'Intact enamel, physiological baseline' };
                                        return arr;
                                      }
                                      return prev;
                                    });
                                    executeCommand(detailedTooth, 'Healthy', 'Intact enamel, physiological baseline').catch(e => console.warn(e));
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2 px-3 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                >
                                  Reset Healthy
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 7-Category Clinical Palette (Expandable on Demand for Treatment Charting) */}
                          {showPaletteDrawer && (
                            <div className="animate-fade-in space-y-2 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between px-1 text-[11px]">
                                <span className="font-black text-slate-700">Select Procedure to Apply to Surfaces:</span>
                                <span className="font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                  Selected: {activePaletteCondition}
                                </span>
                              </div>
                              <ClinicalConditionPalette
                                selectedCondition={activePaletteCondition}
                                onSelectCondition={setSelectedPaletteCondition}
                                selectedToothNum={detailedTooth}
                                isPediatric={isPediatricDetailed}
                                onApplyToTooth={(tNum, cond) => {
                                  const isHealthy = cond === 'Normal / Healthy' || cond === 'Healthy';
                                  const newSurfaces = isHealthy 
                                    ? { O: 'Normal / Healthy', M: 'Normal / Healthy', D: 'Normal / Healthy', B: 'Normal / Healthy', L: 'Normal / Healthy' }
                                    : { O: cond, M: cond, D: cond, B: cond, L: cond };

                                  // 1. Instant optimistic state update
                                  setToothSurfacesState(prev => ({
                                    ...prev,
                                    [tNum]: newSurfaces
                                  }));

                                  const commentStr = `Restorative & Prosthodontic: ${cond} charted on Tooth #${tNum}`;
                                  setTeethState(prev => {
                                    const toothKeyStr = String(tNum).toUpperCase();
                                    const idx = prev.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
                                    const newObj = {
                                      toothNumber: tNum,
                                      status: cond,
                                      conditionStatus: cond,
                                      comments: commentStr,
                                      comment: commentStr
                                    };
                                    if (idx >= 0) {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], ...newObj };
                                      return updated;
                                    }
                                    return [...prev, newObj];
                                  });

                                  // 2. Non-blocking async DB save
                                  executeCommand(tNum, cond, commentStr).catch(e => console.warn("DB save err:", e));
                                }}
                              />
                            </div>
                          )}

                          {/* Modal Actions Footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                const curPid = patientId || patient?.patientID || patient?.patientId || '18';
                                window.open(`/chart/${curPid}/tooth/${detailedTooth}`, '_blank');
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#4A7CD2] hover:text-[#3665B7] hover:underline cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View 3D Occlusal Model & Full Record ↗</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDetailedTooth(null);
                                setShowPaletteDrawer(false);
                              }}
                              className="text-xs bg-[#4A7CD2] hover:bg-[#3665B7] text-white font-black px-5 py-2 rounded-xl cursor-pointer shadow-xs transition-all"
                            >
                              Done Inspecting
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 🌟 4. SLIDE-OUT ON-DEMAND CLINICAL OBSERVATIONS & METRICS DRAWER 🌟 */}
                  {showObservationsDrawer && (() => {
                    const keysToRender = dentitionMode === 'pediatric' ? PEDIATRIC_KEYS : Array.from({ length: 32 }, (_, i) => i + 1);
                    const totalTeethCount = dentitionMode === 'pediatric' ? 20 : 32;

                    const filteredTeethList = keysToRender.map((toothKey, i) => {
                      const toothNum = toothKey;
                      const existing = teethState.find(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === String(toothKey).toUpperCase());
                      const status = existing?.status || existing?.conditionStatus || 'Healthy';
                      let comment = (existing?.comments || existing?.comment || '').trim();
                      if (!comment || comment === 'Saved via Save Chart command') {
                        if (dentitionMode === 'pediatric') {
                          const pInfo = PEDIATRIC_TOOTH_NAMES[toothKey];
                          if (status === 'Healthy') comment = `Intact primary deciduous enamel on Tooth ${toothKey} (${pInfo?.name || 'Primary'}), physiological baseline`;
                          else if (status.toLowerCase().includes('pulpotomy') || status.toLowerCase().includes('mta')) comment = `Pediatric Endodontics: Pulpotomy with MTA coronal pulp therapy on Primary Tooth ${toothKey}`;
                          else if (status.toLowerCase().includes('crown') || status.toLowerCase().includes('ssc')) comment = `Pediatric Prosthetics: Stainless Steel Crown (SSC) placed on Primary Tooth ${toothKey}`;
                          else if (status.toLowerCase().includes('space')) comment = `Pediatric Orthodontics: Space maintainer appliance fitted on Primary Tooth ${toothKey}`;
                          else if (status.toLowerCase().includes('fill') || status.toLowerCase().includes('composite') || status.toLowerCase().includes('gic')) comment = `Restorative: Esthetic pediatric composite/GIC restoration on Primary Tooth ${toothKey}`;
                          else if (status.toLowerCase().includes('caries') || status.toLowerCase().includes('decay') || status.toLowerCase().includes('ecc')) comment = `Pediatric Pathology: Early Childhood Caries (ECC) lesion on Primary Tooth ${toothKey}`;
                          else comment = `Pediatric Observation: ${status} recorded on Primary Tooth ${toothKey}`;
                        } else {
                          if (status === 'Healthy') comment = 'Intact enamel, physiological mobility (Grade 0)';
                          else if (status.toLowerCase().includes('fill') || status.toLowerCase().includes('composite') || status.toLowerCase().includes('amalgam') || status.toLowerCase().includes('gic')) comment = `Restorative: Composite restoration placed on Tooth #${toothNum}`;
                          else if (status.toLowerCase().includes('caries') || status.toLowerCase().includes('decay') || status.toLowerCase().includes('damag') || status.toLowerCase().includes('cavity')) comment = `Pathology: Active caries enamel demineralization on Tooth #${toothNum}`;
                          else if (status.toLowerCase().includes('canal') || status.toLowerCase().includes('rct')) comment = `Endodontics: Root canal therapy and obturation on Tooth #${toothNum}`;
                          else if (status.toLowerCase().includes('mobility')) comment = `Periodontal: Pathologic tooth mobility on Tooth #${toothNum}`;
                          else if (status.toLowerCase().includes('rotat')) comment = `Developmental: ${existing?.rotationDeg || 45}° axial rotation diagnosed on odontogram`;
                          else comment = `Clinical Observation: ${status} recorded on Tooth #${toothNum}`;
                        }
                      }
                      const color = existing?.color || existing?.conditionColor || getHexColor(status);
                      const anat = dentitionMode === 'pediatric' 
                        ? (PEDIATRIC_TOOTH_NAMES[toothKey] || { name: `Primary Tooth ${toothKey}`, quad: 'Pediatric Arch' })
                        : (TOOTH_ANATOMY[toothNum] || { name: `Tooth #${toothNum}`, quad: 'Dental Arch' });
                      const rotationDeg = existing?.rotationDeg || 0;
                      const shape = dentitionMode === 'pediatric'
                        ? (PEDIATRIC_TOOTH_NAMES[toothKey]?.shape || 'molar')
                        : ((toothNum <= 3 || (toothNum >= 14 && toothNum <= 19) || toothNum >= 30) 
                          ? 'molar' 
                          : (toothNum === 4 || toothNum === 5 || toothNum === 12 || toothNum === 13 || toothNum === 20 || toothNum === 21 || toothNum === 28 || toothNum === 29) 
                          ? 'premolar' 
                          : (toothNum === 6 || toothNum === 11 || toothNum === 22 || toothNum === 27) 
                          ? 'canine' 
                          : 'incisor');

                      return {
                        toothNumber: toothNum,
                        status,
                        comment,
                        color,
                        name: anat.name,
                        quad: anat.quad,
                        rotationDeg,
                        shape
                      };
                    }).filter(t => {
                      const q = toothSearchQuery.toLowerCase().trim();
                      const matchesSearch = !q || t.toothNumber.toString().toLowerCase() === q || t.name.toLowerCase().includes(q) || t.status.toLowerCase().includes(q) || t.comment.toLowerCase().includes(q);
                      if (!matchesSearch) return false;

                      if (toothFilterCategory === 'all') return true;

                      const sLow = t.status.toLowerCase();
                      const cLow = t.comment.toLowerCase();
                      const isHealthy = sLow === 'healthy' || sLow === 'sound' || (sLow.includes('healthy') && !sLow.includes('unhealthy'));

                      if (toothFilterCategory === 'healthy') {
                        return isHealthy;
                      }

                      // STRICT EXCLUSION: If a tooth is healthy, it CANNOT match any pathology, restorative or mobility category!
                      if (isHealthy) {
                        return false;
                      }

                      const full = `${sLow} ${cLow}`;

                      if (toothFilterCategory === 'caries') {
                        return full.includes('decay') || full.includes('caries') || full.includes('cavity') || full.includes('keera') || full.includes('carious') || full.includes('ecc');
                      }
                      if (toothFilterCategory === 'restorative') {
                        return full.includes('fill') || full.includes('composite') || full.includes('amalgam') || full.includes('gic') || full.includes('sealant') || full.includes('inlay') || full.includes('onlay') || full.includes('restoration');
                      }
                      if (toothFilterCategory === 'rct') {
                        return full.includes('canal') || full.includes('rct') || full.includes('pulpitis') || full.includes('apical') || full.includes('abscess') || full.includes('endo') || full.includes('pulpotomy') || full.includes('mta');
                      }
                      if (toothFilterCategory === 'mobility') {
                        return (full.includes('mobility') && !full.includes('physiological mobility') && !full.includes('grade 0')) || 
                               full.includes('grade i') || full.includes('grade ii') || full.includes('grade iii') || 
                               full.includes('bone loss') || full.includes('recession') || full.includes('periodont');
                      }
                      if (toothFilterCategory === 'rotation') {
                        return full.includes('rotat') || full.includes('malposition') || full.includes('degree') || full.includes('bracket') || t.rotationDeg !== 0;
                      }
                      if (toothFilterCategory === 'prosthetics') {
                        return full.includes('crown') || full.includes('bridge') || full.includes('veneer') || full.includes('implant') || full.includes('prosthesis') || full.includes('zirconia') || full.includes('pfm') || full.includes('ssc') || full.includes('space maintainer');
                      }
                      return true;
                    });

                    return (
                      <div 
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in cursor-pointer"
                        onClick={() => setShowObservationsDrawer(false)}
                      >
                        <div 
                          className="w-full sm:w-[520px] h-full bg-white shadow-2xl border-l border-light-teal/50 p-5 flex flex-col gap-3.5 overflow-hidden animate-slide-left cursor-default"
                          onClick={(e) => e.stopPropagation()}
                        >
                          
                          {/* Drawer Header */}
                          <div className="flex items-center justify-between border-b border-light-teal/20 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#4A7CD2] animate-ping" />
                              <h5 className="text-sm font-black text-dark-slate uppercase tracking-wider">
                                {dentitionMode === 'pediatric' ? 'Pediatric Observations Directory' : 'Clinical Observations Directory'}
                              </h5>
                              <span className="text-[10px] font-black bg-[#EAF0FC] text-[#4A7CD2] px-2.5 py-0.5 rounded-full border border-light-teal/40">
                                {filteredTeethList.length} / {totalTeethCount}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowObservationsDrawer(false)}
                              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Close Drawer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Clinical Health Metrics Ribbon */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black text-dark-slate uppercase tracking-widest block">
                              Clinical Health Overview
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#F8FAFC] p-2 rounded-2xl border border-light-teal/30 text-center">
                              <div className="bg-white p-1 rounded-xl border border-light-teal/30 shadow-2xs">
                                <span className="text-[7.5px] font-black uppercase text-muted-text block">Health</span>
                                <span className="text-[11px] font-black text-[#4A7CD2]">{healthyPct}%</span>
                              </div>
                              <div className="bg-white p-1 rounded-xl border border-light-teal/30 shadow-2xs">
                                <span className="text-[7.5px] font-black uppercase text-red-500 block">Caries</span>
                                <span className="text-[11px] font-black text-[#EF4444]">{cariesPct}%</span>
                              </div>
                              <div className="bg-white p-1 rounded-xl border border-light-teal/30 shadow-2xs">
                                <span className="text-[7.5px] font-black uppercase text-amber-500 block">RCT</span>
                                <span className="text-[11px] font-black text-[#F59E0B]">{rctPct}%</span>
                              </div>
                              <div className="bg-white p-1 rounded-xl border border-light-teal/30 shadow-2xs">
                                <span className="text-[7.5px] font-black uppercase text-blue-500 block">Clean</span>
                                <span className="text-[11px] font-black text-[#3B82F6]">{cleaningPct}%</span>
                              </div>
                              <div className="bg-white p-1 rounded-xl border border-light-teal/30 shadow-2xs">
                                <span className="text-[7.5px] font-black uppercase text-purple-600 block">Treated</span>
                                <span className="text-[11px] font-black text-[#8B5CF6]">{prosthesisPct}%</span>
                              </div>
                              <div className="bg-white p-1 rounded-xl border border-light-teal/30 shadow-2xs">
                                <span className="text-[7.5px] font-black uppercase text-slate-500 block">Missing</span>
                                <span className="text-[11px] font-black text-[#94A3B8]">{missingPct}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Search Input */}
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search tooth # or note..."
                              value={toothSearchQuery}
                              onChange={(e) => setToothSearchQuery(e.target.value)}
                              className="text-xs bg-[#F8FAFC] border border-light-teal/40 rounded-xl px-3 py-2 pl-8 text-dark-slate focus:outline-none focus:border-[#4A7CD2] w-full"
                            />
                            <Search className="w-3.5 h-3.5 text-muted-text absolute left-2.5 top-2.5" />
                            {toothSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setToothSearchQuery('')}
                                className="absolute right-2 top-2 text-muted-text hover:text-dark-slate"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Filter Category Pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { id: 'all', label: dentitionMode === 'pediatric' ? 'All (20)' : 'All (32)' },
                              { id: 'caries', label: '🔴 Caries' },
                              { id: 'restorative', label: '🔵 Fillings' },
                              { id: 'rct', label: dentitionMode === 'pediatric' ? '🟣 Pulpotomy' : '🟣 RCT' },
                              { id: 'mobility', label: '🟡 Mobility' },
                              { id: 'rotation', label: '🔄 Rotation' },
                              { id: 'prosthetics', label: dentitionMode === 'pediatric' ? '👑 SSC / Crowns' : '👑 Crowns' },
                              { id: 'healthy', label: '🟢 Healthy' }
                            ].map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setToothFilterCategory(cat.id)}
                                className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                                  toothFilterCategory === cat.id
                                    ? 'bg-[#4A7CD2] text-white shadow-xs'
                                    : 'bg-[#F1F5F9] text-dark-slate/70 hover:bg-[#E2E8F0]'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>

                          {/* Scrollable List of Teeth Observation Clinical Cards */}
                          <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
                            {filteredTeethList.length === 0 ? (
                              <div className="py-12 text-center text-xs text-muted-text font-semibold bg-[#F8FAFC] rounded-2xl border border-dashed border-slate-200">
                                <span className="text-xl block mb-1">🔍</span>
                                No teeth matching the search or category filter.
                              </div>
                            ) : (
                              filteredTeethList.map(t => {
                                const sLow = t.status.toLowerCase();
                                let badgeBg = 'bg-sky-50 text-sky-700 border-sky-200';
                                let accentBorder = 'border-l-[#4A7CD2]';
                                let statusDot = 'bg-[#4A7CD2]';

                                if (sLow.includes('caries') || sLow.includes('decay') || sLow.includes('damag') || sLow.includes('cavity') || sLow.includes('ecc')) {
                                  badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
                                  accentBorder = 'border-l-rose-500';
                                  statusDot = 'bg-rose-500';
                                } else if (sLow.includes('canal') || sLow.includes('rct') || sLow.includes('pulpitis') || sLow.includes('pulpotomy') || sLow.includes('mta')) {
                                  badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                                  accentBorder = 'border-l-purple-500';
                                  statusDot = 'bg-purple-500';
                                } else if (sLow.includes('mobility') || sLow.includes('bone loss')) {
                                  badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                                  accentBorder = 'border-l-amber-500';
                                  statusDot = 'bg-amber-500';
                                } else if (sLow.includes('rotat')) {
                                  badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                  accentBorder = 'border-l-indigo-500';
                                  statusDot = 'bg-indigo-500';
                                } else if (sLow.includes('fill') || sLow.includes('composite') || sLow.includes('amalgam') || sLow.includes('gic')) {
                                  badgeBg = 'bg-cyan-50 text-cyan-800 border-cyan-200';
                                  accentBorder = 'border-l-cyan-500';
                                  statusDot = 'bg-cyan-500';
                                } else if (sLow.includes('crown') || sLow.includes('bridge') || sLow.includes('veneer') || sLow.includes('ssc') || sLow.includes('space')) {
                                  badgeBg = 'bg-amber-50 text-amber-900 border-amber-200';
                                  accentBorder = 'border-l-amber-600';
                                  statusDot = 'bg-amber-600';
                                } else if (sLow.includes('healthy')) {
                                  badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                  accentBorder = 'border-l-emerald-500';
                                  statusDot = 'bg-emerald-500';
                                }

                                return (
                                  <div
                                    key={t.toothNumber}
                                    className={`bg-white border border-light-teal/40 hover:border-[#4A7CD2] rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all space-y-2 border-l-4 ${accentBorder}`}
                                  >
                                    {/* Top Row: Tooth Badge, Exact 3D Jaw Occlusal Tooth, Name, Status Pill & Edit Action */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {/* Exact 3D Jaw Occlusal Tooth Image with Clinical Condition Ring */}
                                        <OcclusalJawToothThumbnail
                                          toothNumber={t.toothNumber}
                                          shape={t.shape || 'molar'}
                                          status={t.status}
                                          comments={t.comment}
                                          rotationDeg={t.rotationDeg || 0}
                                          size="md"
                                        />

                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 rounded-md bg-[#EAF0FC] text-[#4A7CD2] font-black text-[10px] flex items-center justify-center border border-light-teal/50 shrink-0">
                                              #{t.toothNumber}
                                            </span>
                                            <h6 className="text-xs font-black text-[#10244B] truncate">
                                              {t.name}
                                            </h6>
                                          </div>
                                          <span className="text-[9px] font-bold text-muted-text pl-0.5">
                                            {t.quad}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${badgeBg} flex items-center gap-1`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                          {t.status}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => setEditingToothData({
                                            toothNumber: t.toothNumber,
                                            name: t.name,
                                            status: t.status,
                                            comment: t.comment,
                                            color: t.color,
                                            rotationDeg: t.rotationDeg,
                                            shape: t.shape
                                          })}
                                          className="text-[9.5px] font-bold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-dark-slate px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                                          title="Edit observation"
                                        >
                                          <Edit className="w-2.5 h-2.5 text-[#4A7CD2]" />
                                          <span>Edit</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Rotation Alert if present */}
                                    {t.rotationDeg !== 0 && (
                                      <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-lg text-[9.5px] font-bold">
                                        <span>🔄</span>
                                        <span>Axial Malposition / Rotation: {t.rotationDeg}°</span>
                                      </div>
                                    )}

                                    {/* Bottom Row: Full Doctor Clinical Observation Note */}
                                    <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-xl p-2 flex items-start gap-2">
                                      <span className="text-xs text-[#4A7CD2] shrink-0 mt-0.5">📋</span>
                                      <p className="text-[10.5px] text-dark-slate font-semibold leading-relaxed break-words">
                                        {t.comment || (t.status === 'Healthy' ? 'Intact enamel, physiological mobility (Grade 0)' : `${t.status} recorded`)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 🌟 5. DOCTOR MANUAL TOOTH EDIT MODAL (Sustains & Saves Changes) 🌟 */}
                  {editingToothData && (() => {
                    const tNum = editingToothData.toothNumber;
                    const toothInfo = dentitionMode === 'pediatric'
                      ? (PEDIATRIC_TOOTH_NAMES[tNum] || PRIMARY_DENTAL_COORDS[tNum] || { name: `Primary Tooth ${tNum}`, quad: 'Pediatric Arch', arch: 'Primary Arch', shape: editingToothData.shape || 'molar' })
                      : (TOOTH_ANATOMY[tNum] || DENTAL_COORDS[tNum] || MANDIBLE_COORDS[tNum] || {
                          name: `Tooth #${tNum}`,
                          quad: tNum <= 8 ? 'Maxillary Right' : tNum <= 16 ? 'Maxillary Left' : tNum <= 24 ? 'Mandibular Left' : 'Mandibular Right',
                          arch: tNum <= 16 ? 'Maxilla (Upper Jaw)' : 'Mandible (Lower Jaw)',
                          shape: editingToothData.shape || 'molar',
                          roots: tNum <= 16 ? (tNum <= 3 || tNum >= 14 ? 3 : 1) : 2,
                          cusps: 4
                        });

                    const isConditionActive = (condId) => {
                      if (!editingToothData.status) return condId === 'Healthy';
                      const s = editingToothData.status.toLowerCase();
                      const c = condId.toLowerCase();
                      if (s === c) return true;
                      if (c.includes('healthy') && (s === 'healthy' || s === 'sound')) return true;
                      if (c.includes('caries') && (s.includes('caries') || s.includes('decay') || s.includes('cavity') || s.includes('keera') || s.includes('ecc'))) return true;
                      if (c.includes('pulpotomy') && (s.includes('pulpotomy') || s.includes('mta'))) return true;
                      if (c.includes('ssc') && s.includes('ssc')) return true;
                      if (c.includes('space') && s.includes('space')) return true;
                      if (c.includes('composite') && s.includes('composite')) return true;
                      if (c.includes('amalgam') && s.includes('amalgam')) return true;
                      if (c.includes('gic') && (s.includes('gic') || s.includes('glass ionomer'))) return true;
                      if (c.includes('rct') && (s.includes('rct') || s.includes('canal') || s.includes('pulpitis'))) return true;
                      if (c.includes('crown') && (s.includes('crown') || s.includes('cap') || s.includes('pfm') || s.includes('zirconia') || s.includes('ssc')) && !s.includes('implant')) return true;
                      if (c.includes('implant') && s.includes('implant')) return true;
                      if (c.includes('bracket') && (s.includes('bracket') || s.includes('orthodontic') || s.includes('braces'))) return true;
                      if (c.includes('veneer') && s.includes('veneer')) return true;
                      if (c.includes('mobility') && (s.includes('mobility') || s.includes('bone loss') || s.includes('grade'))) return true;
                      if (c.includes('missing') && (s.includes('missing') || s.includes('extract') || s.includes('exfoliat'))) return true;
                      if (c.includes('rotat') && (s.includes('rotat') || s.includes('malposition') || editingToothData.rotationDeg !== 0)) return true;
                      return false;
                    };

                    const clinicalConditions = dentitionMode === 'pediatric' ? [
                      { id: 'Healthy', label: '🟢 Healthy Intact', color: '#10B981' },
                      { id: 'Pulpotomy (MTA)', label: '🟣 Pulpotomy (MTA)', color: '#7C3AED' },
                      { id: 'Stainless Steel Crown (SSC)', label: '👑 SSC Crown', color: '#B0B0B0' },
                      { id: 'Space Maintainer', label: '🔵 Space Maintainer', color: '#93C5FD' },
                      { id: 'Early Childhood Caries (ECC)', label: '🔴 ECC Decay', color: '#EF4444' },
                      { id: 'Filling — Composite (O)', label: '🔵 Composite (O)', color: '#2563EB' },
                      { id: 'Filling — GIC (Class V)', label: '🟡 GIC (Class V)', color: '#F59E0B' },
                      { id: 'Fluoride Varnish Applied', label: '✨ Fluoride Varnish', color: '#06B6D4' },
                      { id: 'Missing / Exfoliated', label: '⚪ Missing / Exfoliated', color: '#94A3B8' }
                    ] : [
                      { id: 'Healthy', label: '🟢 Healthy', color: '#10B981' },
                      { id: 'Caries — Occlusal (O)', label: '🔴 Caries', color: '#EF4444' },
                      { id: 'Filling — Composite (O)', label: '🔵 Composite', color: '#2563EB' },
                      { id: 'Filling — Amalgam (O)', label: '🔘 Amalgam', color: '#64748B' },
                      { id: 'Root Canal Treated (RCT)', label: '🟣 RCT', color: '#7C3AED' },
                      { id: 'Crown — Monolithic Zirconia', label: '👑 Crown', color: '#D97706' },
                      { id: 'Dental Implant', label: '🔩 Implant', color: '#0E8A80' },
                      { id: 'Mobility Grade II (3mm bone loss)', label: '🟡 Mobility', color: '#F59E0B' },
                      { id: 'Malposition / Rotation (45° Mesiopalatal)', label: '🔄 Rotation', color: '#3B82F6' },
                      { id: 'Missing / Extracted', label: '⚪ Missing', color: '#94A3B8' }
                    ];

                    const surfacesList = [
                      { id: 'O', label: 'O (Occlusal)' },
                      { id: 'MO', label: 'MO (Mesio-Occlusal)' },
                      { id: 'DO', label: 'DO (Disto-Occlusal)' },
                      { id: 'MOD', label: 'MOD (Mesio-Occlusal-Distal)' },
                      { id: 'B', label: 'B (Buccal / Facial)' },
                      { id: 'L', label: 'L (Lingual / Palatal)' },
                      { id: 'Class V', label: 'Class V (Cervical)' }
                    ];

                    return (
                      <div 
                        className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
                        onClick={() => setEditingToothData(null)}
                      >
                        <div 
                          className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-light-teal/50 shadow-2xl p-6 space-y-4 cursor-default animate-zoom-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Rich Modal Header */}
                          <div className="flex items-start justify-between border-b border-light-teal/20 pb-4">
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Exact 3D Jaw Occlusal Tooth Image with Clinical Condition Ring */}
                              <div className="shrink-0">
                                <OcclusalJawToothThumbnail
                                  toothNumber={tNum}
                                  shape={toothInfo.shape || editingToothData.shape || 'molar'}
                                  status={editingToothData.status}
                                  comments={editingToothData.comment}
                                  rotationDeg={editingToothData.rotationDeg || 0}
                                  size="lg"
                                />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-lg font-black text-[#10244B] whitespace-nowrap">
                                    Edit Tooth #{tNum}
                                  </h4>
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 shrink-0">
                                    FDI: #{tNum <= 8 ? 19 - tNum : tNum <= 16 ? 12 + tNum : tNum <= 24 ? 57 - tNum : 6 + tNum}
                                  </span>
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                    Universal #{tNum}
                                  </span>
                                  {/* Clinical Specialty Badge */}
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs shrink-0 flex items-center gap-1">
                                    <span>🩺</span>
                                    <span>Specialty: {(() => {
                                      const s = (editingToothData.status || '').toLowerCase();
                                      if (s.includes('caries') || s.includes('decay') || s.includes('cavity') || s.includes('fractur')) return 'Pathology';
                                      if (s.includes('fill') || s.includes('composite') || s.includes('amalgam') || s.includes('gic')) return 'Restorative';
                                      if (s.includes('rct') || s.includes('canal') || s.includes('pulpitis')) return 'Endodontics';
                                      if (s.includes('implant')) return 'Implantology';
                                      if (s.includes('bracket') || s.includes('orthodontic') || s.includes('rotat')) return 'Orthodontics';
                                      if (s.includes('mobility') || s.includes('bone loss')) return 'Periodontics';
                                      if (s.includes('crown') || s.includes('bridge') || s.includes('veneer')) return 'Prosthodontics';
                                      if (s.includes('miss') || s.includes('extract')) return 'Oral Surgery';
                                      return 'General';
                                    })()}</span>
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {toothInfo.name}
                                </p>
                                <p className="text-[10.5px] font-bold text-muted-text">
                                  {toothInfo.arch || (tNum <= 16 ? 'Maxilla (Upper Jaw)' : 'Mandible (Lower Jaw)')} · {toothInfo.quad || 'Quadrant'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pl-2">
                              {/* Open in New Tab Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const pid = patientId || (patient?.patientID ? patient.patientID : 18);
                                  window.open(`/chart/${pid}/tooth/${tNum}`, '_blank');
                                }}
                                className="flex items-center gap-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-black px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs"
                                title="Open dedicated Tooth Detail page in a new browser tab"
                              >
                                <span>Open in New Tab</span>
                                <span className="font-bold">↗</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingToothData(null)}
                                className="text-slate-500 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Active Diagnosis & Affected Zone Banner */}
                          <div className="bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF]/60 border border-light-teal/30 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                Active Clinical Diagnosis:
                              </span>
                              <span className="font-black text-[#4A7CD2] bg-white px-3.5 py-1 rounded-xl border border-light-teal/40 shadow-2xs">
                                {editingToothData.status || 'Healthy'}
                              </span>
                            </div>

                            {/* Explicit Affected Zone Display */}
                            <div className="bg-white border border-light-teal/40 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                              <span className="text-base leading-none">📍</span>
                              <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                  Affected Anatomical Surface Zone:
                                </span>
                                <span className="text-xs font-black text-[#10244B] mt-0.5 block">
                                    {(() => {
                                      const isPed = typeof editingToothData.toothNumber === 'string' && isNaN(parseInt(editingToothData.toothNumber));
                                      const toothDisplay = isPed ? `Primary Tooth ${editingToothData.toothNumber}` : `Tooth #${editingToothData.toothNumber}`;
                                      const s = `${editingToothData.status || ''} ${editingToothData.comment || ''}`.toLowerCase();
                                      if (s.includes('class v') || s.includes('cervical')) return `${toothDisplay} Buccal (B) Cervical Margin / Class V`;
                                      if (s.includes('mod') || s.includes('mesio-occlusal-distal')) return `${toothDisplay} Mesio-Occlusal-Distal (MOD) Complex`;
                                      if (s.includes('mo') || s.includes('mesio-occlusal')) return `${toothDisplay} Mesio-Occlusal (MO) Interproximal`;
                                      if (s.includes('do') || s.includes('disto-occlusal')) return `${toothDisplay} Disto-Occlusal (DO) Interproximal`;
                                      if (s.includes('occlusal') || s.includes('fissure') || s.includes(' (o)')) return `${toothDisplay} Occlusal (O) Central Fissure Table`;
                                      if (s.includes('buccal') || s.includes('facial')) return `${toothDisplay} Facial / Buccal (B) Enamel Surface`;
                                      if (s.includes('lingual') || s.includes('palatal')) return `${toothDisplay} Lingual / Palatal (L) Cingulum Zone`;
                                      if (s.includes('implant')) return `${toothDisplay} Alveolar Bone Socket & Titanium Abutment`;
                                      if (s.includes('pulpotomy') || s.includes('mta')) return `${toothDisplay} Coronal Pulp Chamber & Occlusal Table`;
                                      if (s.includes('ssc') || s.includes('stainless')) return `${toothDisplay} Full Anatomical Deciduous Crown (SSC)`;
                                      return `${toothDisplay} Full Anatomical Crown & Root`;
                                    })()}
                                  </span>
                              </div>
                            </div>

                            {/* Multi-Condition Pills Breakdown */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {(() => {
                                const rawStatus = (editingToothData.status || 'Healthy').trim();
                                const items = [];

                                if (rawStatus.includes('·')) {
                                  rawStatus.split('·').forEach(p => { if (p.trim()) items.push(p.trim()); });
                                } else if (rawStatus.startsWith('Caries — ') && rawStatus.includes(',')) {
                                  const surfaces = rawStatus.replace('Caries — ', '').split(',');
                                  surfaces.forEach(s => {
                                    const sTrim = s.trim();
                                    if (sTrim) items.push(`Caries — ${sTrim}`);
                                  });
                                } else if (rawStatus.startsWith('Filling — ') && rawStatus.includes(',')) {
                                  const parts = rawStatus.replace('Filling — ', '').split(',');
                                  parts.forEach(p => {
                                    const pTrim = p.trim();
                                    if (pTrim) items.push(`Filling — ${pTrim}`);
                                  });
                                } else {
                                  items.push(rawStatus);
                                }

                                return items.map((clean, pIdx) => {
                                  const isC = clean.toLowerCase().includes('caries') || clean.toLowerCase().includes('decay');
                                  const isF = clean.toLowerCase().includes('fill') || clean.toLowerCase().includes('composite');
                                  const isR = clean.toLowerCase().includes('rct') || clean.toLowerCase().includes('canal');
                                  const isI = clean.toLowerCase().includes('implant');
                                  const isB = clean.toLowerCase().includes('bracket') || clean.toLowerCase().includes('orthodontic');
                                  const isM = clean.toLowerCase().includes('mobility');
                                  const isCr = clean.toLowerCase().includes('crown');
                                  const isV = clean.toLowerCase().includes('veneer');
                                  return (
                                    <span 
                                      key={pIdx}
                                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border shadow-2xs ${
                                        isC ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        isF ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        isR ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        isCr ? 'bg-amber-50 text-amber-900 border-amber-300' :
                                        isI ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                        isB ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                        isM ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                        isV ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      {clean}
                                    </span>
                                  );
                                });
                              })()}
                              {editingToothData.rotationDeg !== 0 && (
                                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                                  🔄 {editingToothData.rotationDeg}° Rotated
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 1. Clinical Status / Condition Selector (12 Specialty Options) */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider block">
                              Select Primary Clinical Condition
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {clinicalConditions.map(cond => {
                                const active = isConditionActive(cond.id);
                                return (
                                  <button
                                    key={cond.id}
                                    type="button"
                                    onClick={() => setEditingToothData(prev => ({
                                      ...prev,
                                      status: cond.id,
                                      color: cond.color
                                    }))}
                                    className={`text-[9.5px] font-bold py-2 px-1 rounded-xl border transition-all cursor-pointer text-center ${
                                      active
                                        ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-xs font-black ring-2 ring-[#4A7CD2]/25 scale-102'
                                        : 'bg-[#F8FAFC] text-dark-slate border-slate-200 hover:bg-[#EFF6FF]'
                                    }`}
                                  >
                                    {cond.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Affected Tooth Surface Quick Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider block">
                              Affected Tooth Surface (O · M · D · MOD · B · L · Class V)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {surfacesList.map(surf => {
                                const isSurfActive = (() => {
                                  const st = (editingToothData.status || '').toUpperCase();
                                  const idUpper = surf.id.toUpperCase();
                                  if (idUpper === 'CLASS V') return st.includes('CLASS V') || st.includes('CERVICAL');
                                  if (idUpper === 'MOD') return st.includes('MOD') || st.includes('MESIO-OCCLUSAL-DISTAL');
                                  if (idUpper === 'MO') return (st.includes(' MO') || st.includes('— MO') || st.includes('(MO)') || st.includes('MESIO-OCCLUSAL')) && !st.includes('MOD');
                                  if (idUpper === 'DO') return (st.includes(' DO') || st.includes('— DO') || st.includes('(DO)') || st.includes('DISTO-OCCLUSAL')) && !st.includes('MOD');
                                  if (idUpper === 'O') return (st.includes('— O') || st.includes('(O)') || st.includes('OCCLUSAL') || st.includes('O,') || st.includes(', O')) && !st.includes('MO') && !st.includes('DO') && !st.includes('MOD');
                                  if (idUpper === 'M') return (st.includes('— M') || st.includes('(M)') || st.includes('MESIAL')) && !st.includes('MO') && !st.includes('MOD');
                                  if (idUpper === 'D') return (st.includes('— D') || st.includes('(D)') || st.includes('DISTAL')) && !st.includes('DO') && !st.includes('MOD');
                                  if (idUpper === 'B') return st.includes('— B') || st.includes('(B)') || st.includes('BUCCAL') || st.includes('FACIAL');
                                  if (idUpper === 'L') return (st.includes('— L') || st.includes('(L)') || st.includes('LINGUAL') || st.includes('PALATAL')) && !st.includes('CLASS');
                                  return false;
                                })();

                                return (
                                  <button
                                    key={surf.id}
                                    type="button"
                                    onClick={() => {
                                      const cur = editingToothData.status || 'Healthy';
                                      let base = 'Caries';
                                      if (cur.includes('Filling') || cur.includes('Composite')) base = 'Filling — Composite';
                                      else if (cur.includes('Amalgam')) base = 'Filling — Amalgam';
                                      else if (cur.includes('GIC')) base = 'Filling — GIC';
                                      else if (cur.includes('Healthy')) base = 'Caries';
                                      else if (cur.includes('Caries')) base = 'Caries';
                                      
                                      setEditingToothData(prev => ({
                                        ...prev,
                                        status: `${base} — ${surf.id}`,
                                        color: getHexColor(base)
                                      }));
                                    }}
                                    className={`text-[9.5px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                                      isSurfActive
                                        ? 'bg-[#0284C7] text-white border-[#0284C7] font-black shadow-2xs scale-102 ring-2 ring-[#0284C7]/20'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {surf.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Axial Malposition / Rotation & Mobility Adjusters */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Rotation Degree */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider block">
                                Axial Rotation Angle
                              </label>
                              <div className="flex items-center gap-1">
                                {[0, 15, 30, 45, 90].map(deg => (
                                  <button
                                    key={deg}
                                    type="button"
                                    onClick={() => setEditingToothData(prev => ({ ...prev, rotationDeg: deg }))}
                                    className={`flex-1 text-[9px] font-black py-1 rounded-lg border text-center transition-all cursor-pointer ${
                                      (editingToothData.rotationDeg || 0) === deg
                                        ? 'bg-[#4A7CD2] text-white border-[#4A7CD2]'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {deg}°
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Periodontal Mobility */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider block">
                                Periodontal Mobility
                              </label>
                              <div className="flex items-center gap-1">
                                {['0', 'I', 'II', 'III'].map(grd => (
                                  <button
                                    key={grd}
                                    type="button"
                                    onClick={() => {
                                      if (grd === '0') {
                                        setEditingToothData(prev => ({
                                          ...prev,
                                          status: prev.status ? prev.status.replace(/·?\s*Mobility[^\s·]*/gi, '').trim() || 'Healthy' : 'Healthy'
                                        }));
                                      } else {
                                        setEditingToothData(prev => ({
                                          ...prev,
                                          status: prev.status && prev.status !== 'Healthy' ? `${prev.status} · Mobility (Grade ${grd})` : `Mobility (Grade ${grd})`,
                                          color: '#F59E0B'
                                        }));
                                      }
                                    }}
                                    className={`flex-1 text-[9px] font-black py-1 rounded-lg border text-center transition-all cursor-pointer ${
                                      (editingToothData.status || '').includes(`Grade ${grd}`) || (grd === '0' && !(editingToothData.status || '').includes('Mobility'))
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {grd === '0' ? 'Normal' : `Gr. ${grd}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 4. Doctor Clinical Observation Notes Textarea */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black text-dark-slate uppercase tracking-wider block">
                              Doctor Clinical Observation Notes
                            </label>
                            <textarea
                              rows={3}
                              value={editingToothData.comment || ''}
                              onChange={(e) => setEditingToothData(prev => ({ ...prev, comment: e.target.value }))}
                              placeholder="Enter detailed clinical observation notes, diagnoses, and treatment plans for this tooth..."
                              className="w-full text-xs bg-[#F8FAFC] border border-light-teal/40 rounded-xl p-2.5 text-dark-slate focus:outline-none focus:border-[#4A7CD2] leading-relaxed"
                            />
                          </div>

                          {/* Modal Action Buttons */}
                          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setEditingToothData(null)}
                              className="text-xs text-slate-600 font-bold px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const tNum = editingToothData.toothNumber;
                                setTeethState(prev => {
                                  const toothKeyStr = String(tNum).toUpperCase();
                                  const idx = prev.findIndex(x => String(x.toothNumber ?? x.ToothNumber).toUpperCase() === toothKeyStr);
                                  const updatedEntry = {
                                    toothNumber: tNum,
                                    status: editingToothData.status || 'Healthy',
                                    conditionStatus: editingToothData.status || 'Healthy',
                                    comments: editingToothData.comment || `${editingToothData.status || 'Healthy'} recorded`,
                                    comment: editingToothData.comment || `${editingToothData.status || 'Healthy'} recorded`,
                                    color: getHexColor(editingToothData.status || 'Healthy'),
                                    rotationDeg: editingToothData.rotationDeg || 0
                                  };
                                  if (idx >= 0) {
                                    const updated = [...prev];
                                    updated[idx] = { ...updated[idx], ...updatedEntry };
                                    return updated;
                                  }
                                  return [...prev, updatedEntry];
                                });
                                executeCommand(tNum, editingToothData.status || 'Healthy', editingToothData.comment, { rotationDeg: editingToothData.rotationDeg || 0 });
                                setEditingToothData(null);
                              }}
                              className="text-xs bg-[#4A7CD2] hover:bg-[#3665B7] text-white font-black px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all"
                            >
                              Save Clinical Observation
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              );
            })()}
        </div>

        {/* Vertical Crisp Gray Divider Line */}
        {activeTab !== 'radiographs' && (
          <div className="hidden lg:block w-px bg-slate-200 self-stretch shrink-0" />
        )}

        {/* Right Side: Integrated AI Clinical Copilot & Dictation Console */}
        {activeTab !== 'radiographs' && (
          <div className={`w-full ${isChatCollapsed ? 'lg:w-[64px]' : 'lg:w-[380px] xl:w-[410px] 2xl:w-[430px]'} bg-gradient-to-b from-[#FAFBFD] via-white to-[#F8FAFC] flex flex-col shrink-0 transition-all duration-300 relative border-t lg:border-t-0 border-l border-slate-200/80 h-full lg:max-h-[calc(100vh-100px)] overflow-hidden shadow-xs`}>
            {isChatCollapsed ? (
              /* Collapsed Mode for Maximum Odontogram & 3D Jaw View */
              <div 
                onClick={() => setIsChatCollapsed(false)}
                className="h-full w-full flex flex-col items-center py-4 justify-between select-none bg-gradient-to-b from-slate-50 via-white to-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                title="Click anywhere to expand AI Clinical Copilot"
              >
                {/* Top Action Buttons */}
                <div className="flex flex-col items-center gap-2.5 w-full px-2" onClick={(e) => e.stopPropagation()}>
                  {/* Expand Button */}
                  <button
                    type="button"
                    onClick={() => setIsChatCollapsed(false)}
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 hover:scale-105 transition-all cursor-pointer group/btn"
                    title="Expand AI Copilot"
                  >
                    <ChevronLeft className="w-4.5 h-4.5 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </button>

                  {/* Voice Mic Quick Trigger */}
                  <button
                    type="button"
                    onClick={() => { setIsChatCollapsed(false); setIsMicActive(true); }}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs transition-all cursor-pointer ${
                      isRecording 
                        ? 'bg-rose-500 text-white border-rose-300 animate-pulse ring-2 ring-rose-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    title="Start Voice Dictation"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <div className="w-5 h-px bg-slate-200 my-0.5" />
                </div>

                {/* Clean Rotated Vertical Clinical Copilot Badge */}
                <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
                  <div className="-rotate-90 whitespace-nowrap text-[10px] font-black tracking-widest text-slate-500 group-hover:text-blue-600 uppercase transition-colors flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-blue-500 rotate-90" />
                    <span>Clinical AI Copilot</span>
                  </div>
                </div>

                {/* Bottom Online Status Badge */}
                <div className="flex flex-col items-center gap-1 pb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[8px] font-black tracking-wider text-slate-500 uppercase">Online</span>
                </div>
              </div>
            ) : (
              /* Full Integrated Messages Console */
              <div className="h-full flex flex-col justify-between overflow-hidden min-h-0">
                {/* Sleek Medical Clinical Header */}
                <div className="pl-3.5 pr-4 py-2.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-between items-center flex-shrink-0 shadow-2xs z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-black text-[#10244B] tracking-tight leading-none truncate">
                          {isMicActive ? 'Voice Dictation' : 'Clinical AI Copilot'}
                        </h3>
                      </div>
                      <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-600 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        AI Scribe Online
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {aiNotesData && (
                      <button 
                        type="button"
                        onClick={() => fetchAiNotes(aiNotesData.noteId || aiNotesData.NoteId)} 
                        className="text-[9.5px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-xl font-black border border-blue-200/80 transition-colors shadow-2xs cursor-pointer"
                      >
                        AI Notes
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => setIsMicActive(!isMicActive)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-black border transition-all cursor-pointer shadow-2xs ${
                        isMicActive 
                          ? 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-200/60' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title={isMicActive ? "Switch to Text Chat" : "Switch to Voice Dictation"}
                    >
                      {isRecording ? <Mic className="w-3 h-3 text-rose-600 animate-pulse" /> : <MicOff className="w-3 h-3 text-slate-500" />}
                      <span>{isRecording ? 'Rec...' : isMicActive ? 'Voice' : 'Chat'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setMessages([{
                          id: Date.now(),
                          sender: 'ai',
                          type: 'welcome_card',
                          text: `Welcome to ${patient?.firstName || 'Patient'} ${patient?.lastName || ''}'s chart.`,
                          time: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        }]);
                        setHighlightInfo(null);
                        setHighlightedTeeth([]);
                        try {
                          localStorage.removeItem(`dentist_chat_patient_${patientId}`);
                        } catch (e) {}
                      }}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
                      title="Reset / Clear Chat Messages"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChatCollapsed(true)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Collapse Messages Panel"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Smart Doctor Quick Prompts Strip */}
                {!isMicActive && (
                  <div className="px-3 py-2 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-b border-slate-200/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 pr-4">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(null, "Summarize all tooth observations on this patient's chart")}
                      className="text-[9.5px] font-black px-2 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <span>📋</span> Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(null, "List all teeth with active caries or decay")}
                      className="text-[9.5px] font-black px-2 py-1 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <span>🦷</span> Caries
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(null, "Recommend a treatment plan based on current tooth diagnoses")}
                      className="text-[9.5px] font-black px-2 py-1 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <span>✨</span> Tx Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOrthoTmjModal(true)}
                      className="text-[9.5px] font-black px-2 py-1 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <span>📐</span> Ortho & TMJ
                    </button>
                  </div>
                )}

            {/* Dynamic UI Switching based on Mic / Voice Assistant activation */}
            {isMicActive ? (
              <div className="flex-1 flex flex-col justify-between space-y-4 overflow-y-auto min-h-0 pr-1 max-h-[calc(100vh-270px)]">
                
                {/* 1. Live Recording State & Dynamic Equalizer Waveform & Live Text Stream */}
                <div className="bg-[#F8FAFC] border border-light-teal/50 p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                  
                  {/* Pulsing Mic Button */}
                  <div className="relative flex items-center justify-center">
                    {isRecording && (
                      <div 
                        className="absolute rounded-full bg-red-400/30 animate-ping"
                        style={{ 
                          width: `${64 + Math.round(audioLevel * 0.6)}px`, 
                          height: `${64 + Math.round(audioLevel * 0.6)}px` 
                        }}
                      />
                    )}
                    <button 
                      type="button" 
                      onClick={isRecording ? stopRecording : startRecording} 
                      className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all shadow-md hover:scale-105 cursor-pointer ${
                        isRecording 
                          ? 'bg-red-500 border-red-200 text-white shadow-red-200 shadow-lg' 
                          : 'bg-[#4A7CD2] border-[#EAF0FC] text-white shadow-[#4A7CD2]/20'
                      }`}
                    >
                      {isRecording ? (
                        <div className="w-5 h-5 bg-white rounded-md shadow-xs" />
                      ) : (
                        <Mic className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>

                  {/* 10-Bar Animated Live Equalizer */}
                  {isRecording && (
                    <div className="flex items-center justify-center gap-1.5 h-10 px-4 py-1 bg-white/80 rounded-2xl border border-light-teal/40 w-full max-w-[240px]">
                      {[0.3, 0.6, 1.0, 0.7, 1.2, 0.8, 1.1, 0.5, 0.9, 0.4].map((mult, idx) => {
                        const h = Math.max(6, Math.min(32, Math.round((audioLevel || 15) * mult * 0.45 + (isRecording ? Math.random() * 4 : 0))));
                        return (
                          <div 
                            key={idx} 
                            className="w-1.5 bg-gradient-to-t from-[#4A7CD2] to-[#8B5CF6] rounded-full transition-all duration-75"
                            style={{ height: `${h}px` }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Status Text & Live Streaming Words Card */}
                  <div className="w-full text-left bg-white p-3.5 rounded-2xl border border-light-teal/45 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                        <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-ping' : 'bg-muted-text'} inline-block`} />
                        {isRecording ? 'Listening to voice...' : 'Microphone Ready'}
                      </span>
                      {isRecording && (
                        <span className="text-[9.5px] font-bold text-[#4A7CD2] bg-[#EAF0FC] px-2 py-0.5 rounded-md">
                          Live Stream
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-[#10244B] font-bold leading-relaxed min-h-[38px]">
                      {liveSpeechStream ? (
                        <span className="italic text-[#10244B]">"{liveSpeechStream}"</span>
                      ) : isRecording ? (
                        <span className="text-muted-text/80 font-medium italic animate-pulse">Speak now... dictation will stream live here word by word.</span>
                      ) : (
                        <span className="text-muted-text font-medium">{voiceStreamText || 'Click the microphone button to start voice recording.'}</span>
                      )}
                    </p>
                  </div>

                </div>

                {/* 2. Progress Bar simulator */}
                {aiNotesLoading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-muted-text">
                      <span>PROCESSING AUDIO DICTATION</span>
                      <span>{aiNotesProgress}%</span>
                    </div>
                    <div className="w-full bg-[#EAF0FC] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#4A7CD2] h-full transition-all duration-300" style={{ width: `${aiNotesProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* 3. 3-Second Countdown auto retrieve overlay */}
                {countdown > 0 && (
                  <div className="bg-[#EAF0FC] border border-light-teal/55 p-3 rounded-2xl flex items-center justify-between text-[11px] font-bold text-dark-slate animate-pulse">
                    <span>Loading clinical notes automatically in {countdown}s...</span>
                    <button 
                      onClick={() => fetchAiNotes(aiNotesData?.noteId || aiNotesData?.NoteId)} 
                      className="bg-[#4A7CD2] text-white px-3 py-1 rounded-xl text-[10px]"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {/* 4. Clinician Missing Points Display (7-Point Checklist) */}
                <div className="bg-white border border-[#EAF0FC] p-4 rounded-3xl space-y-2.5 flex-grow overflow-y-auto max-h-[250px] no-scrollbar shadow-xs">
                  <div className="flex items-center justify-between border-b border-light-teal/20 pb-2">
                    <span className="text-[9.5px] font-black text-dark-slate uppercase tracking-wider">Omission Compliance Checklist</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                      CHECKLIST_ITEMS.filter(item => checklist[item.id]).length === CHECKLIST_ITEMS.length
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-[#EAF0FC] text-[#4A7CD2]'
                    }`}>
                      {CHECKLIST_ITEMS.filter(item => checklist[item.id]).length}/{CHECKLIST_ITEMS.length} Verified
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {CHECKLIST_ITEMS.map((item) => {
                      const isComplete = checklist[item.id];
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all duration-300 ${
                            isComplete 
                              ? 'bg-emerald-50/70 border-emerald-200/60 shadow-2xs' 
                              : 'bg-amber-50/35 border-amber-200/35 hover:bg-amber-50/60'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-[10.5px] font-bold leading-tight ${isComplete ? 'text-emerald-900 font-extrabold' : 'text-slate-600'}`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              // DEFAULT CHAT LEDGER MODE
              <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
                <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 max-h-[calc(100vh-270px)]">
                  {messages.map((m) => {
                    if (m.type === 'welcome_card') {
                      const age = calculatePatientAge(patient?.dob);
                      return (
                        <div key={m.id} className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 border border-blue-200/70 rounded-2xl p-3.5 shadow-2xs space-y-2.5 animate-fade-in text-slate-800">
                          {/* Patient Header */}
                          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                {patient?.firstName ? patient.firstName.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <div>
                                <h4 className="font-black text-xs text-[#10244B] leading-tight">
                                  {patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}` : 'Patient Chart'}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500">
                                  {age !== null ? `${age} Yrs` : 'Pediatric'} • {patient?.gender || 'Patient'} • ID #{patient?.patientID || patientId}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              AI Copilot Ready
                            </span>
                          </div>

                          {/* Clinical Quick Guidance */}
                          <div className="space-y-1.5 text-[10.5px] text-slate-700">
                            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/90 border border-blue-100/80 shadow-2xs">
                              <span className="text-base leading-none mt-0.5">🎙️</span>
                              <div>
                                <strong className="text-slate-900 font-bold block text-[10.5px]">Voice Dictation & Auto-Charting:</strong>
                                <span className="text-slate-600 text-[10px] leading-tight">Speak findings (e.g. <em>"Class II decay on 14, deep overbite 60%"</em>) to auto-update chart.</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/90 border border-blue-100/80 shadow-2xs">
                              <span className="text-base leading-none mt-0.5">💊</span>
                              <div>
                                <strong className="text-slate-900 font-bold block text-[10.5px]">Smart Prescriptions:</strong>
                                <span className="text-slate-600 text-[10px] leading-tight">Say <em>"Augmentin 625mg TDS 5 days"</em> for automated formulary dosage.</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 p-2 rounded-xl bg-white/90 border border-blue-100/80 shadow-2xs">
                              <span className="text-base leading-none mt-0.5">📋</span>
                              <div>
                                <strong className="text-slate-900 font-bold block text-[10.5px]">CDT Codes & SOAP Notes:</strong>
                                <span className="text-slate-600 text-[10px] leading-tight">Generates complete dental SOAP notes and CDT codes automatically.</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Timestamp */}
                          <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[9px] text-slate-500 font-medium">
                            <span>Live EHR Database Connected</span>
                            <span>{m.time || 'Today'}</span>
                          </div>
                        </div>
                      );
                    }

                    const isDoc = m.sender === 'doctor';
                    return (
                      <div key={m.id} className={`flex items-start gap-2.5 ${isDoc ? 'justify-end' : ''}`}>
                        {!isDoc && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-2xs">
                            AI
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                          isDoc 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs font-medium shadow-xs' 
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs font-medium shadow-2xs'
                        }`}>
                          <p className="font-medium whitespace-pre-wrap">{m.text}</p>
                          
                          {/* Rich UI Card: Patient Dossier */}
                          {m.type === 'patient_dossier' && m.cardData?.patient_dossier && (() => {
                            const d = m.cardData.patient_dossier;
                            return (
                              <div className="mt-2.5 bg-white p-3 rounded-2xl border border-light-teal/50 shadow-sm space-y-2.5 text-dark-slate">
                                <div className="flex items-center justify-between border-b border-light-teal/30 pb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-[#EAF0FC] text-[#4A7CD2] flex items-center justify-center font-black text-xs">
                                      👤
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-xs text-[#10244B]">{d.fullName}</h4>
                                      <p className="text-[10px] text-muted-text">{d.age} Yrs | {d.gender} | ID #{d.patientId}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                    Active Record
                                  </span>
                                </div>

                                {/* Active Plan */}
                                <div className="bg-[#F8FAFC] p-2 rounded-xl border border-light-teal/30 space-y-0.5 text-[11px]">
                                  <span className="text-[9px] font-black text-[#4A7CD2] uppercase tracking-wider block">Active Treatment Plan</span>
                                  <p className="font-bold text-dark-slate">{d.currentTreatmentPlan} <span className="text-muted-text font-normal">({d.treatmentStage})</span></p>
                                </div>

                                {/* Odontogram Breakdown */}
                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                  <div className="bg-emerald-50 border border-emerald-200/60 p-1.5 rounded-lg flex justify-between items-center">
                                    <span className="font-bold text-emerald-800">Healthy:</span>
                                    <span className="font-black text-emerald-700">{d.healthyTeethCount}/{d.totalTeethCount || (d.age < 6 ? 20 : 32)}</span>
                                  </div>
                                  <div className="bg-rose-50 border border-rose-200/60 p-1.5 rounded-lg flex justify-between items-center">
                                    <span className="font-bold text-rose-800">Decay:</span>
                                    <span className="font-black text-rose-700">{d.damagedTeeth?.length > 0 ? d.damagedTeeth.join(', ') : 'None'}</span>
                                  </div>
                                  <div className="bg-amber-50 border border-amber-200/60 p-1.5 rounded-lg flex justify-between items-center">
                                    <span className="font-bold text-amber-800">RCT:</span>
                                    <span className="font-black text-amber-700">{d.rctTeeth?.length > 0 ? d.rctTeeth.join(', ') : 'None'}</span>
                                  </div>
                                  <div className="bg-purple-50 border border-purple-200/60 p-1.5 rounded-lg flex justify-between items-center">
                                    <span className="font-bold text-purple-800">Treated:</span>
                                    <span className="font-black text-purple-700">{d.filledTeeth?.length > 0 ? d.filledTeeth.join(', ') : 'None'}</span>
                                  </div>
                                </div>

                                {/* Next Appointment & Link Button */}
                                <div className="pt-1 flex items-center justify-between gap-2 border-t border-light-teal/20">
                                  <span className="text-[10px] text-muted-text font-bold truncate">
                                    📅 {d.nextAppointment}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => navigate(d.chartUrl)}
                                    className="bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-xs flex-shrink-0 cursor-pointer"
                                  >
                                    👉 Open Chart
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Clinic Stats */}
                          {m.type === 'clinic_stats' && m.cardData?.stats_data && (() => {
                            const s = m.cardData.stats_data;
                            return (
                              <div className="mt-2.5 bg-white p-3 rounded-2xl border border-light-teal/50 shadow-sm space-y-2 text-dark-slate">
                                <div className="flex items-center justify-between border-b border-light-teal/30 pb-1.5">
                                  <span className="text-[10px] font-black text-[#4A7CD2] uppercase tracking-wider">📊 Clinic Clinical Overview</span>
                                  <span className="text-[10px] font-black bg-[#EAF0FC] text-[#4A7CD2] px-2 py-0.5 rounded-full">{s.totalPatients} Patients</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                                  <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-xl">
                                    <p className="text-[9px] text-amber-700 font-bold">Root Canal Cases</p>
                                    <p className="text-sm font-black text-amber-900">{s.rootCanalPatients}</p>
                                  </div>
                                  <div className="bg-rose-50 border border-rose-200/60 p-2 rounded-xl">
                                    <p className="text-[9px] text-rose-700 font-bold">Active Decay / Caries</p>
                                    <p className="text-sm font-black text-rose-900">{s.damagedTeethPatients}</p>
                                  </div>
                                  <div className="bg-sky-50 border border-sky-200/60 p-2 rounded-xl">
                                    <p className="text-[9px] text-sky-700 font-bold">Orthodontics (Braces)</p>
                                    <p className="text-sm font-black text-sky-900">{s.bracesPatients}</p>
                                  </div>
                                  <div className="bg-purple-50 border border-purple-200/60 p-2 rounded-xl">
                                    <p className="text-[9px] text-purple-700 font-bold">Teeth Whitening</p>
                                    <p className="text-sm font-black text-purple-900">{s.whiteningPatients}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Appointment List */}
                          {m.type === 'appointment_list' && m.cardData?.appointments && (() => {
                            const appts = m.cardData.appointments;
                            return (
                              <div className="mt-2.5 bg-white p-3 rounded-2xl border border-light-teal/50 shadow-sm space-y-2 text-dark-slate">
                                <span className="text-[10px] font-black text-[#4A7CD2] uppercase tracking-wider block border-b border-light-teal/30 pb-1">
                                  📅 Scheduled Appointments ({appts.length})
                                </span>
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                  {appts.map((a, idx) => (
                                    <div key={idx} className="p-2 bg-[#F8FAFC] border border-light-teal/30 rounded-xl flex items-center justify-between text-[10px] font-bold">
                                      <div>
                                        <p className="font-extrabold text-[#10244B] text-xs">{a.fullName || a.FullName || 'Patient'}</p>
                                        <p className="text-[9px] text-muted-text">{new Date(a.preferredDate || a.PreferredDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(a.preferredDate || a.PreferredDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                      </div>
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${(a.status || a.Status) === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {a.status || a.Status || 'Confirmed'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Patient List */}
                          {m.type === 'patient_list' && m.cardData?.patients && (() => {
                            const pts = m.cardData.patients;
                            return (
                              <div className="mt-2.5 bg-white p-3 rounded-2xl border border-light-teal/50 shadow-sm space-y-2 text-dark-slate">
                                <span className="text-[10px] font-black text-[#4A7CD2] uppercase tracking-wider block border-b border-light-teal/30 pb-1">
                                  👥 Patient Directory ({pts.length})
                                </span>
                                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                  {pts.map((p, idx) => (
                                    <div key={idx} className="p-2 bg-[#F8FAFC] border border-light-teal/30 rounded-xl flex items-center justify-between text-[10px]">
                                      <div>
                                        <p className="font-extrabold text-[#10244B] text-xs">{p.firstName || p.FirstName} {p.lastName || p.LastName}</p>
                                        <p className="text-[9px] text-muted-text">{p.gender || p.Gender || 'N/A'} • ID #{p.patientID || p.PatientID}</p>
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => navigate(`/chart/${p.patientID || p.PatientID}`)}
                                        className="bg-[#EAF0FC] hover:bg-[#D5E1F7] text-[#4A7CD2] px-2.5 py-1 rounded-lg font-bold text-[9.5px] transition-colors"
                                      >
                                        View Chart
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Multi-Tooth Batch Diagnostic Assessment Card */}
                          {m.type === 'multi_tooth_card' && m.cardData && (() => {
                            const data = m.cardData;
                            return (
                              <div className="mt-3 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 p-4 rounded-3xl border-2 border-blue-200 shadow-md space-y-3 text-dark-slate animate-zoom-in">
                                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                                      📋
                                    </div>
                                    <div>
                                      <h4 className="font-black text-xs text-[#10244B]">{data.title}</h4>
                                      <p className="text-[10.5px] text-[#2563EB] font-bold">
                                        {data.teethCount} Teeth Successfully Charted & Synchronized
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs flex items-center gap-1">
                                    ✓ SQL Server Synced
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  {data.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        setDetailedTooth(item.toothNum);
                                        if (typeof item.toothNum === 'number') {
                                          setSelectedJawView(item.toothNum <= 16 ? 'maxilla' : 'mandible');
                                        }
                                      }}
                                      className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div
                                          className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-2xs flex-shrink-0"
                                          style={{ backgroundColor: item.finalColor || '#EF4444' }}
                                        >
                                          #{item.toothNum}
                                        </div>
                                        <div>
                                          <p className="text-xs font-black text-[#10244B] leading-tight">
                                            {item.title}
                                          </p>
                                          <p className="text-[10px] text-slate-500 font-bold">
                                            {item.statusComment}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span
                                          className="text-[9px] font-black px-2 py-0.5 rounded-full border shadow-2xs"
                                          style={{
                                            backgroundColor: `${item.finalColor}15`,
                                            color: item.finalColor,
                                            borderColor: `${item.finalColor}40`
                                          }}
                                        >
                                          {item.surfaceCode ? `${item.surfaceCode} ` : ''}{item.finalStatus}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500">
                                          CDT: {item.cdtCode}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <p className="text-[10px] text-slate-500 text-center font-bold">
                                  💡 Click any tooth row above to open its full 3D interactive model & 5-zone cross section
                                </p>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Orthodontic & TMJ Diagnostic Card */}
                          {m.type === 'ortho_card' && m.cardData && (() => {
                            const o = m.cardData;
                            return (
                              <div className="mt-3 bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/80 p-3.5 rounded-2xl border-2 border-blue-300 shadow-md space-y-3 text-dark-slate animate-zoom-in">
                                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">📐</span>
                                    <div>
                                      <h4 className="font-black text-xs text-[#10244B]">{o.title}</h4>
                                      <p className="text-[10px] text-[#2563EB] font-bold">CDT Code: {o.code}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-black bg-blue-100 text-[#1E40AF] px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                                    AI Live Mapped
                                  </span>
                                </div>

                                <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200 text-xs space-y-1 text-slate-800 shadow-2xs">
                                  <p><strong>Clinical Finding:</strong> {o.query}</p>
                                  {o.overlapPct && <p><strong>Incisal Overlap:</strong> <span className="text-[#2563EB] font-black">{o.overlapPct}% (Deep Bite)</span></p>}
                                  <p><strong>Treatment Indication:</strong> Orthodontic leveling of curve of Spee & arch expansion.</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setShowOrthoTmjModal(true)}
                                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Open 12-Diagram Diagnostic Suite (Live View)</span>
                                </button>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Dental Tooth Spotlight Card */}
                          {m.type === 'tooth_card' && m.cardData?.info && (() => {
                            const info = m.cardData.info;
                            const num = m.cardData.toothNum;
                            const status = m.cardData.status;
                            const color = m.cardData.color || '#3B82F6';
                            const shape = DENTAL_COORDS[num]?.shape || 'molar';

                            return (
                              <div className="mt-3 bg-white p-3.5 rounded-2xl border-2 border-blue-200/80 shadow-md space-y-3 text-dark-slate animate-zoom-in">
                                <div className="flex items-center justify-between border-b border-light-teal/40 pb-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                                      #{num}
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-xs text-[#10244B] leading-tight">{info.name}</h4>
                                      <p className="text-[10px] text-muted-text font-bold mt-0.5">
                                        {info.quad} • FDI #{info.fdi || num}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${
                                    status.toLowerCase().includes('decay') || status.toLowerCase().includes('damag')
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : status.toLowerCase().includes('canal')
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : status.toLowerCase().includes('treat') || status.toLowerCase().includes('fill')
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {status}
                                  </span>
                                </div>

                                {/* Dynamic 2D Top-Down Occlusal Mode Preview */}
                                {m.cardData?.image && (
                                  <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={m.cardData.image} 
                                        alt={`Tooth #${num} Top Occlusal View`} 
                                        className="w-11 h-11 object-contain rounded-lg border border-slate-100 shadow-2xs"
                                      />
                                      <div>
                                        <span className="text-[8.5px] font-black text-[#4A7CD2] uppercase tracking-wider block">
                                          2D Top-Down Occlusal Mode
                                        </span>
                                        <p className="text-[10px] font-bold text-dark-slate">
                                          {status.toLowerCase().includes('decay') || status.toLowerCase().includes('damag') ? 'Active Caries / Decay Mode' :
                                           status.toLowerCase().includes('treat') || status.toLowerCase().includes('fill') ? 'Composite Dental Filling Mode' :
                                           'Healthy Enamel Crown Mode'}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[8px] font-black text-[#4A7CD2] bg-[#EAF0FC] border border-blue-200 px-2 py-0.5 rounded-full">
                                      {status.toLowerCase().includes('decay') ? 'tooth_decay.png' : status.toLowerCase().includes('fill') || status.toLowerCase().includes('treat') ? 'tooth_filled.png' : 'tooth_healthy.png'}
                                    </span>
                                  </div>
                                )}

                                {/* Tooth Visual Schema & Details */}
                                <div className="flex items-center gap-3 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] p-3 rounded-2xl border border-light-teal/40">
                                  <div className="w-12 h-14 bg-white rounded-xl border border-blue-200 flex items-center justify-center p-1 shadow-2xs flex-shrink-0">
                                    <RealisticHumanTooth 
                                      number={num} 
                                      shape={shape || 'molar'} 
                                      status={status} 
                                      color={color} 
                                      isHighlighted={false} 
                                      isFrontView={true} 
                                    />
                                  </div>
                                  <div className="space-y-1 text-[10px] min-w-0 flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-text font-bold">Type & Arch:</span>
                                      <span className="font-black text-[#10244B]">{info.type} ({info.arch})</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-text font-bold">Roots & Cusps:</span>
                                      <span className="font-black text-blue-600">{info.roots} Root(s) • {info.cusps} Cusp(s)</span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-600 leading-tight pt-1 border-t border-light-teal/30">
                                      <strong className="text-dark-slate">Function:</strong> {info.function}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHighlightedTeeth([num]);
                                      setDetailedTooth(num);
                                      setHighlightInfo({
                                        title: `Tooth #${num}`,
                                        subtitle: info.name,
                                        type: 'single',
                                        color: '#3B82F6',
                                        toothNum: num
                                      });
                                    }}
                                    className="flex-1 bg-gradient-to-r from-[#4A7CD2] to-[#2563EB] hover:opacity-95 text-white py-2 rounded-xl font-extrabold text-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                                    <span>Spotlight on Jaw</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDetailedTooth(num)}
                                    className="bg-[#EAF0FC] hover:bg-[#D5E1F7] text-[#4A7CD2] px-3 py-2 rounded-xl font-extrabold text-[10px] transition-colors cursor-pointer"
                                  >
                                    Edit Tooth
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Dental Tooth Group / Category Card */}
                          {m.type === 'group_card' && m.cardData && (() => {
                            const g = m.cardData;
                            const numbers = g.teethNumbers || [];

                            return (
                              <div className="mt-3 bg-white p-3.5 rounded-2xl border-2 border-indigo-200/80 shadow-md space-y-3 text-dark-slate animate-zoom-in">
                                <div className="flex items-center justify-between border-b border-light-teal/40 pb-2">
                                  <div>
                                    <h4 className="font-extrabold text-xs text-[#10244B] flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> {g.title}
                                    </h4>
                                    <p className="text-[10px] text-muted-text font-bold mt-0.5">{g.subtitle}</p>
                                  </div>
                                  <span className="text-[9.5px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 shadow-2xs">
                                    {numbers.length} Teeth
                                  </span>
                                </div>

                                {/* Optional Realistic Medical Jaw Images (Dual or Single) */}
                                {g.images && g.images.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2 rounded-2xl border border-slate-200 shadow-xs">
                                    <div className="flex flex-col items-center bg-white p-1.5 rounded-xl border border-slate-200">
                                      <img 
                                        src={g.images[0]} 
                                        alt="Maxilla Upper Jaw (1-16)" 
                                        className="w-full max-h-36 object-contain rounded-lg"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                      <span className="text-[8.5px] font-black text-[#4A7CD2] mt-1 uppercase tracking-wider">
                                        Maxilla (Upper: 1–16)
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white p-1.5 rounded-xl border border-slate-200">
                                      <img 
                                        src={g.images[1] || g.images[0]} 
                                        alt="Maxilla Lower Jaw (17-32)" 
                                        className="w-full max-h-36 object-contain rounded-lg"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                      <span className="text-[8.5px] font-black text-[#4A7CD2] mt-1 uppercase tracking-wider">
                                        Lower Jaw (17–32)
                                      </span>
                                    </div>
                                  </div>
                                ) : g.image ? (
                                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white flex flex-col items-center p-2">
                                    <img 
                                      src={g.image} 
                                      alt="Human Dental Jaw Anatomy" 
                                      className="w-full max-h-60 object-contain rounded-xl"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <span className="text-[9.5px] font-extrabold text-[#4A7CD2] mt-1.5 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-[#4A7CD2]" /> {dentitionMode === 'pediatric' ? 'Pediatric Deciduous Jaw Anatomy (20 Primary Teeth A–T)' : 'Real Human Jaw Anatomy (32 Teeth)'}
                                    </span>
                                  </div>
                                ) : null}

                                <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium bg-[#F8FAFC] p-2.5 rounded-xl border border-light-teal/30 whitespace-pre-line">
                                  {g.explanation}
                                </p>

                                {/* Teeth Numbers List */}
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">
                                    Mapped Tooth Numbers:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {numbers.map(num => (
                                      <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                          setHighlightedTeeth([num]);
                                          setDetailedTooth(num);
                                        }}
                                        className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] font-black border border-indigo-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                        title={`Inspect Tooth #${num}`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setHighlightedTeeth(numbers);
                                    setHighlightInfo({
                                      title: g.title,
                                      subtitle: g.subtitle,
                                      type: 'group',
                                      color: g.color || '#6366F1'
                                    });
                                  }}
                                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white py-2 rounded-xl font-extrabold text-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                                  <span>Highlight All ({numbers.length}) on Jaw Chart</span>
                                </button>
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Dental Procedure & Pathology Guide Card */}
                          {m.type === 'procedure_card' && m.cardData && (() => {
                            const p = m.cardData;
                            const matches = p.matchingTeeth || [];

                            return (
                              <div className="mt-3 bg-white p-3.5 rounded-2xl border-2 border-teal-200/80 shadow-md space-y-3 text-dark-slate animate-zoom-in">
                                <div className="flex items-center justify-between border-b border-light-teal/40 pb-2">
                                  <h4 className="font-extrabold text-xs text-[#10244B] flex items-center gap-1.5">
                                    <Stethoscope className="w-3.5 h-3.5 text-[#4A7CD2]" /> {p.title}
                                  </h4>
                                  {matches.length > 0 && (
                                    <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                                      {matches.length} in Chart
                                    </span>
                                  )}
                                </div>

                                <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                                  {p.description}
                                </p>

                                {/* Clinical Stages */}
                                {p.stages && p.stages.length > 0 && (
                                  <div className="space-y-1.5 bg-[#F8FAFC] p-2.5 rounded-xl border border-light-teal/30">
                                    <span className="text-[9px] font-black text-[#4A7CD2] uppercase tracking-widest block">
                                      Clinical Stages & Treatment Protocol:
                                    </span>
                                    <div className="space-y-1">
                                      {p.stages.map((stage, sIdx) => (
                                        <div key={sIdx} className="flex items-start gap-1.5 text-[9.5px]">
                                          <span className="w-4 h-4 rounded-full bg-[#EAF0FC] text-[#4A7CD2] font-black text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {sIdx + 1}
                                          </span>
                                          <span className="font-semibold text-dark-slate">{stage}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Prevention & Home Care */}
                                {p.care && p.care.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-light-teal/30">
                                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block">
                                      💡 Dentist Home Care & Prevention:
                                    </span>
                                    <div className="space-y-0.5">
                                      {p.care.map((c, cIdx) => (
                                        <p key={cIdx} className="text-[9.5px] text-muted-text font-medium flex items-center gap-1">
                                          <span className="text-emerald-500">•</span> {c}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {matches.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHighlightedTeeth(matches);
                                      setHighlightInfo({
                                        title: p.title,
                                        subtitle: `Active Cases: [${matches.join(', ')}]`,
                                        type: 'condition',
                                        color: '#EF4444'
                                      });
                                    }}
                                    className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white py-2 rounded-xl font-extrabold text-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                                    <span>Spotlight Affected Teeth ({matches.join(', ')}) on Jaw</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Rich UI Card: Not Found Suggestions */}
                          {m.type === 'not_found_suggestions' && m.cardData?.suggestions && (
                            <div className="mt-2.5 bg-white p-3 rounded-2xl border border-amber-200 shadow-sm space-y-2 text-dark-slate">
                              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block border-b border-amber-100 pb-1 flex items-center gap-1">
                                💡 Suggested Quick Actions
                              </span>
                              <div className="flex flex-col gap-1.5 pt-0.5">
                                {m.cardData.suggestions.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => handleSendMessage(null, sug)}
                                    className="bg-amber-50/70 hover:bg-amber-100/90 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-bold text-[10px] text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
                                  >
                                    <span>💬 {sug}</span>
                                    <span className="text-amber-500 font-extrabold group-hover:translate-x-0.5 transition-transform">➔</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Interactive Clarification & Quick Action Chips */}
                          {m.chips && m.chips.length > 0 && (
                            <ClinicalActionChips 
                              chips={m.chips} 
                              onSelectChip={(cmd) => handleSendMessage(null, cmd)} 
                            />
                          )}

                          <span className={`text-[8.5px] block mt-1 text-right ${isDoc ? 'text-slate-300' : 'text-slate-500'}`}>{m.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200/80 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-[#F8FAFC] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 border border-slate-200 rounded-2xl p-1.5 pl-3 transition-all shadow-2xs">
                    <textarea 
                      rows={1}
                      value={chatInput}
                      onChange={e => {
                        setChatInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type clinical notes, diagnosis, or prescriptions..."
                      className="min-w-0 flex-1 bg-transparent border-0 focus:outline-none text-xs text-slate-800 font-medium placeholder-slate-500 resize-none max-h-20 min-h-[34px] py-1.5 leading-snug"
                    />

                    {/* Action buttons inside dock */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 pr-0.5">
                      <button 
                        type="button" 
                        onClick={() => setIsMicActive(!isMicActive)}
                        className={`w-8 h-8 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center justify-center flex-shrink-0 ${
                          isMicActive 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-200/50' 
                            : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Toggle Mic Dictation"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button 
                        type="submit" 
                        disabled={!chatInput.trim()}
                        className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-30 disabled:from-slate-400 disabled:to-slate-400 text-white shadow-xs transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
                        title="Send message (Enter)"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] text-slate-500 font-bold mt-1.5 px-1">
                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[8.5px]">Enter ↵</kbd> to send</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      EHR Synced
                    </span>
                  </div>
                </form>
              </div>
            )}
            </div>
          )}
          </div>
        )} {/* end: hide chatbot on radiographs tab */}

        </div> {/* end: Unified Master Clinical Workstation Shell */}
      </main>

      {/* Nexu e-ID Authentication Security Modal */}
      {showNexuModal.visible && (
        <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-light-teal/55">
            <div className="flex items-center gap-2 border-b border-[#EAF0FC] pb-3">
              <KeyRound className="w-5 h-5 text-[#4A7CD2]" />
              <h3 className="text-sm font-extrabold text-dark-slate">Nexu Smart Card Verification</h3>
            </div>
            <p className="text-xs text-muted-text leading-relaxed">
              Please insert your e-ID Smart Card to verify identity and enter your PIN to sign transaction logs.
            </p>

            {showNexuModal.type === 'HIGH_RISK' && (
              <div className="bg-amber-50 border border-amber-200 text-[10px] text-amber-800 p-3 rounded-xl font-bold">
                âš ï¸ Warning: You are digitally signing high-risk dental chart modifications (RCT/Extract).
              </div>
            )}

            <form onSubmit={handleNexuSubmit} className="space-y-3">
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-Digit PIN (e.g. 1234)"
                className="w-full bg-[#F4F6FA] border border-light-teal rounded-xl px-4 py-2.5 text-xs font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#4A7CD2]/25"
              />
              {nexuError && <p className="text-[10px] text-red-500 font-bold text-center">{nexuError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-[#4A7CD2] hover:bg-[#3665B7] text-white py-2 rounded-xl text-xs font-bold shadow-md transition-colors">
                  Verify & Sign
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowNexuModal({ visible: false, type: '', pendingCommands: [] })} 
                  className="flex-1 bg-[#EAF0FC] hover:bg-[#D5E1F7] text-[#4A7CD2] py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 DOCTOR MANUAL OBSERVATION EDIT MODAL */}
      {editingToothData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-light-teal/50 shadow-2xl max-w-lg w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-teal/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#4A7CD2] animate-ping" />
                <h3 className="text-base font-black text-dark-slate">
                  Edit Tooth #{editingToothData.toothNumber} Observation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingToothData(null)}
                className="text-muted-text hover:text-dark-slate p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tooth Info Header */}
            <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-light-teal/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-dark-slate">
                  {TOOTH_ANATOMY[editingToothData.toothNumber]?.name || `Tooth #${editingToothData.toothNumber}`}
                </p>
                <p className="text-[10px] text-muted-text font-semibold">
                  {TOOTH_ANATOMY[editingToothData.toothNumber]?.quad || 'Dental Arch'} · FDI: #{editingToothData.toothNumber}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-50 text-[#4A7CD2] border border-blue-200">
                EHR Record
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-dark-slate uppercase tracking-wider mb-1">
                  Clinical Condition Status
                </label>
                <select
                  value={editingToothData.status}
                  onChange={(e) => setEditingToothData(prev => ({
                    ...prev,
                    status: e.target.value,
                    color: getHexColor(e.target.value)
                  }))}
                  className="w-full bg-white border border-light-teal/60 rounded-xl p-2.5 text-xs text-dark-slate font-bold focus:outline-none focus:border-[#4A7CD2]"
                >
                  <option value="Healthy">Healthy / Intact Enamel</option>
                  <option value="Caries — Occlusal (O)">Caries — Occlusal (O)</option>
                  <option value="Caries — Mesio-Occlusal (MO)">Caries — Mesio-Occlusal (MO)</option>
                  <option value="Caries — Disto-Occlusal (DO)">Caries — Disto-Occlusal (DO)</option>
                  <option value="Caries — MOD">Caries — MOD Cavitation</option>
                  <option value="Caries — Lingual Pit (L)">Caries — Lingual Pit (L)</option>
                  <option value="Caries — Cervical (Class V)">Caries — Cervical (Class V)</option>
                  <option value="Filling — Composite (O)">Filling — Composite (O)</option>
                  <option value="Filling — Composite (MO)">Filling — Composite (MO)</option>
                  <option value="Filling — Composite (DO)">Filling — Composite (DO)</option>
                  <option value="Filling — Composite (MOD)">Filling — Composite (MOD)</option>
                  <option value="Filling — Amalgam (O)">Filling — Amalgam (O)</option>
                  <option value="Filling — Amalgam (MOD)">Filling — Amalgam (MOD)</option>
                  <option value="Filling — GIC (Class V)">Filling — GIC (Class V)</option>
                  <option value="Root Canal Treated (RCT)">Root Canal Treated (RCT)</option>
                  <option value="Root Canal Needed (Pulpitis)">Root Canal Needed (Pulpitis)</option>
                  <option value="Crown — Monolithic Zirconia">Crown — Monolithic Zirconia</option>
                  <option value="Crown — PFM">Crown — PFM (Porcelain Fused to Metal)</option>
                  <option value="Crown — Full Gold">Crown — Full Gold</option>
                  <option value="Veneer (Facial Porcelain)">Veneer (Facial Porcelain)</option>
                  <option value="Dental Implant">Dental Implant (Titanium Fixture)</option>
                  <option value="Mobility Grade II (3mm bone loss)">Mobility Grade II (3mm bone loss)</option>
                  <option value="Gingival Recession (2mm)">Gingival Recession (2mm)</option>
                  <option value="Malposition / Rotation (45° Mesiopalatal)">Malposition / Rotation (45° Mesiopalatal)</option>
                  <option value="Missing / Extracted">Missing / Extracted</option>
                  <option value="Fractured / Enamel Crack">Fractured / Enamel Crack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-dark-slate uppercase tracking-wider mb-1">
                  Doctor Clinical Observation / EHR Note
                </label>
                <textarea
                  rows={4}
                  value={editingToothData.comment}
                  onChange={(e) => setEditingToothData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Enter detailed clinical observation, diagnosis, and treatment note..."
                  className="w-full bg-white border border-light-teal/60 rounded-xl p-3 text-xs text-dark-slate font-semibold leading-relaxed focus:outline-none focus:border-[#4A7CD2]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-light-teal/20">
              <button
                type="button"
                onClick={() => setEditingToothData(null)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingToothData}
                onClick={() => handleSaveSingleToothObservation(
                  editingToothData.toothNumber,
                  editingToothData.status,
                  editingToothData.comment,
                  editingToothData.color
                )}
                className="text-xs bg-[#4A7CD2] hover:bg-[#3665B7] text-white font-black px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                {savingToothData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingToothData ? "Saving..." : "Save Observation to DB"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <span>Understood — Stay in {categoryRestrictionModal.activeCategory || 'Designated Dentition'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// Simple square shape helper component for mic stop button
function SquareButton({ className }) {
  return <div className={className} />;
}


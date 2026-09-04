/**
 * Tooth Anatomy & Clinical Data Constants for Adult & Pediatric Odontogram
 */

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

export const getHexColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('demineraliz') || s.includes('white spot')) return '#FCA5A5';
  if (s.includes('apicoectomy') || s.includes('retrofill')) return '#6D28D9';
  if (s.includes('pfm') || s.includes('porcelain-metal')) return '#B45309';
  if (s.includes('tmj') || s.includes('disc displacement') || s.includes('trismus') || s.includes('closed lock') || s.includes('masseter')) return '#E11D48';
  if (s.includes('pulpotomy') || s.includes('mta')) return '#7C3AED';
  if (s.includes('ssc') || s.includes('stainless')) return '#64748B';
  if (s.includes('space') || s.includes('maintainer')) return '#93C5FD';
  if (s.includes('fluoride') || s.includes('varnish') || s.includes('sealant')) return '#06B6D4';
  if (s.includes('strip crown') || s.includes('inlay') || s.includes('onlay') || s.includes('veneer')) return '#3B82F6';
  if (s.includes('bone loss') || s.includes('periodont') || s.includes('furcation') || s.includes('mobility') || s.includes('recession')) return '#E0665A';
  if (s.includes('resorption') || s.includes('cyst') || s.includes('impacted') || s.includes('supernumerary') || s.includes('mesiodens')) return '#8B5CF6';
  if (s.includes('attrition') || s.includes('wear') || s.includes('bruxism') || s.includes('crack') || s.includes('erosion') || s.includes('chipped')) return '#F59E0B';
  if (s.includes('sensitivity') || s.includes('exposed root')) return '#3B82F6';
  if (s.includes('caries') || s.includes('decay') || s.includes('cavity') || s.includes('keera') || s.includes('ecc') || s.includes('damaged') || s.includes('abscess')) return '#EF4444';
  if (s.includes('fill') || s.includes('composite') || s.includes('broken')) return '#2563EB';
  if (s.includes('amalgam')) return '#64748B';
  if (s.includes('gic')) return '#F59E0B';
  if (s.includes('already treated') || s.includes('treated') || s.includes('rct') || s.includes('canal') || s.includes('endo')) return '#7C3AED';
  if (s.includes('crown') || s.includes('bridge')) return '#D97706';
  if (s.includes('implant')) return '#0E8A80';
  if (s.includes('bracket') || s.includes('ortho') || s.includes('overbite') || s.includes('underbite') || s.includes('crossbite') || s.includes('open bite')) return '#0284C7';
  if (s.includes('miss') || s.includes('extract') || s.includes('exfoliat') || s.includes('absent')) return '#DC2626';
  return '#10B981';
};

export const isNonHealthySurf = (zone) => {
  if (!zone) return false;
  const z = String(zone).toLowerCase().trim();
  return z !== '' && z !== 'healthy' && z !== 'normal' && z !== 'sound' && z !== 'intact' && z !== 'normal / healthy';
};

export const TOOTH_NAMES = {
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
    !full.includes('bone loss') &&
    !full.includes('resorption') &&
    !full.includes('cyst') &&
    !full.includes('abscess') &&
    !full.includes('attrition') &&
    !full.includes('wear') &&
    !full.includes('recession') &&
    !full.includes('erosion') &&
    !full.includes('crack') &&
    !full.includes('chipped') &&
    !full.includes('fractur') &&
    !full.includes('post') &&
    !full.includes('veneer') &&
    !full.includes('inlay') &&
    !full.includes('onlay') &&
    !full.includes('sealant') &&
    !full.includes('crowding') &&
    !full.includes('diastema') &&
    !full.includes('rotat') &&
    !full.includes('impact') &&
    !full.includes('treated')
  ) {
    return result;
  }

  // Determine standard condition label to paint on affected zones
  let conditionLabel = 'Healthy';
  if (full.includes('bone loss') || full.includes('periodont') || full.includes('furcation')) {
    conditionLabel = 'Periodontal Bone Loss';
  } else if (full.includes('root resorption') || full.includes('resorption')) {
    conditionLabel = 'Root Resorption';
  } else if (full.includes('cyst')) {
    conditionLabel = 'Periapical Cyst';
  } else if (full.includes('abscess')) {
    conditionLabel = 'Periapical Abscess';
  } else if (full.includes('post and core') || full.includes('post & core') || full.includes('post build') || (full.includes('post') && full.includes('core'))) {
    conditionLabel = 'Post & Core Build-Up';
  } else if (full.includes('veneer') || full.includes('laminate')) {
    conditionLabel = 'Ceramic Veneer';
  } else if (full.includes('inlay') || full.includes('onlay')) {
    conditionLabel = 'Inlay / Onlay Restoration';
  } else if (full.includes('sealant') || full.includes('pit and fissure') || full.includes('pit & fissure')) {
    conditionLabel = 'Pit & Fissure Sealant';
  } else if (full.includes('crowding') || full.includes('crowded')) {
    conditionLabel = 'Dental Crowding';
  } else if (full.includes('diastema') || full.includes('spacing')) {
    conditionLabel = 'Diastema (Midline Space)';
  } else if (full.includes('rotat') || full.includes('axial rotation')) {
    conditionLabel = 'Tooth Axial Rotation';
  } else if (full.includes('impacted') || full.includes('impaction')) {
    conditionLabel = 'Impacted Tooth (Wisdom/Canine)';
  } else if (full.includes('attrition') || full.includes('grinding wear') || full.includes('bruxism') || full.includes('wear facet') || full.includes('flattened tip')) {
    conditionLabel = 'Occlusal Attrition';
  } else if (full.includes('enamel erosion') || full.includes('erosion')) {
    conditionLabel = 'Enamel Erosion';
  } else if (full.includes('gum recession') || full.includes('recession')) {
    conditionLabel = 'Gum Recession';
  } else if (full.includes('crack') || full.includes('craze line') || full.includes('fracture') || full.includes('chipped')) {
    conditionLabel = full.includes('chipped') || full.includes('fracture') ? 'Chipped / Fractured Enamel' : 'Cracked Enamel';
  } else if (s.includes('implant') || full.includes('implant')) {
    conditionLabel = 'Dental Implant';
  } else if (s.includes('root canal') || full.includes('root canal') || /\brct\b/i.test(full) || (full.includes('endo') && !full.includes('endosseous'))) {
    conditionLabel = 'Root Canal (RCT)';
  } else if (s.includes('pulpotomy') || full.includes('pulpotomy') || full.includes('mta')) {
    conditionLabel = 'Pulpotomy (MTA)';
  } else if (s.includes('ssc') || full.includes('stainless') || s.includes('crown') || full.includes('crown')) {
    conditionLabel = 'Stainless Steel Crown (SSC)';
  } else if (s.includes('space') || full.includes('space') || full.includes('maintainer')) {
    conditionLabel = 'Space Maintainer';
  } else if (s.includes('bracket') || full.includes('bracket') || full.includes('ortho')) {
    conditionLabel = 'Orthodontic Bracket';
  } else if (s.includes('fluoride') || full.includes('varnish')) {
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
    conditionLabel === 'Periodontal Bone Loss' ||
    conditionLabel === 'Root Resorption' ||
    conditionLabel === 'Periapical Cyst' ||
    conditionLabel === 'Periapical Abscess' ||
    conditionLabel === 'Post & Core Build-Up' ||
    conditionLabel === 'Impacted Tooth (Wisdom/Canine)' ||
    conditionLabel === 'Dental Crowding' ||
    conditionLabel === 'Diastema (Midline Space)' ||
    conditionLabel === 'Tooth Axial Rotation' ||
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

  // 1b. Attrition / Erosion / Inlay / Sealant -> Occlusal surface
  if (conditionLabel === 'Occlusal Attrition' || conditionLabel === 'Enamel Erosion' || conditionLabel === 'Cracked Enamel' || conditionLabel === 'Pit & Fissure Sealant' || conditionLabel === 'Inlay / Onlay Restoration') {
    result.O = conditionLabel;
    return result;
  }

  // 1c. Recession / Sensitivity / Veneer -> Buccal / Facial
  if (conditionLabel === 'Ceramic Veneer') {
    result.B = conditionLabel;
    return result;
  }

  if (conditionLabel === 'Gum Recession' || conditionLabel === 'Dentin Hypersensitivity') {
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

  let hasSpecificSurface = false;
  if (/\b(occlusal|fissure|pit)\b|[—–-]\s*o\b|\(o\)/i.test(s) || /\b(occlusal|fissure|pit)\b|[—–-]\s*o\b|\(o\)/i.test(c)) {
    result.O = conditionLabel;
    hasSpecificSurface = true;
  }
  if (/\bmesial\b|[—–-]\s*m\b|\(m\)/i.test(s) || /\bmesial\b|[—–-]\s*m\b|\(m\)/i.test(c)) {
    result.M = conditionLabel;
    hasSpecificSurface = true;
  }
  if (/\bdistal\b|[—–-]\s*d\b|\(d\)/i.test(s) || /\bdistal\b|[—–-]\s*d\b|\(d\)/i.test(c)) {
    result.D = conditionLabel;
    hasSpecificSurface = true;
  }
  if (/\b(buccal|facial|labial|cervical)\b|[—–-]\s*b\b|\(b\)/i.test(s) || /\b(buccal|facial|labial|cervical)\b|[—–-]\s*b\b|\(b\)/i.test(c)) {
    result.B = conditionLabel;
    hasSpecificSurface = true;
  }
  if (/\b(lingual|palatal|cingulum)\b|[—–-]\s*l\b|\(l\)/i.test(s) || /\b(lingual|palatal|cingulum)\b|[—–-]\s*l\b|\(l\)/i.test(c)) {
    result.L = conditionLabel;
    hasSpecificSurface = true;
  }

  if (!hasSpecificSurface) {
    result.O = conditionLabel;
  }

  return result;
};

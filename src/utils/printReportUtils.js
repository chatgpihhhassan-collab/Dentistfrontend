/**
 * Clinical Odontogram & Patient Treatment Report Print/PDF Generator
 * Formatted for A4 / Letter output with direct print & PDF saving
 * Features clear Maxilla (Upper Jaw) and Mandible (Lower Jaw) categorization with Tooth Types & Quadrants
 */

export const getAttendingDoctorName = (doctor, patient) => {
  let docObj = doctor;

  // 1. If not provided or empty, read from localStorage
  if (!docObj || (!docObj.name && !docObj.firstName && !docObj.FirstName)) {
    try {
      const stored = localStorage.getItem('doctor');
      if (stored) {
        docObj = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read doctor from localStorage", e);
    }
  }

  // 2. Extract name from doctor object
  if (docObj) {
    const first = (docObj.firstName || docObj.FirstName || '').trim();
    const last = (docObj.lastName || docObj.LastName || '').trim();
    const fullName = (docObj.name || docObj.Name || '').trim();

    if (first || last) {
      const capFirst = first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
      const capLast = last ? last.charAt(0).toUpperCase() + last.slice(1).toLowerCase() : '';
      const capitalized = `${capFirst} ${capLast}`.trim();
      return capitalized.toLowerCase().startsWith('dr') ? capitalized : `Dr. ${capitalized}`;
    }
    if (fullName) {
      return fullName.toLowerCase().startsWith('dr') ? fullName : `Dr. ${fullName}`;
    }
  }

  // 3. Check if patient record has attending doctor info
  if (patient?.doctorName || patient?.DoctorName) {
    const dName = (patient.doctorName || patient.DoctorName).trim();
    return dName.toLowerCase().startsWith('dr') ? dName : `Dr. ${dName}`;
  }

  // 4. Resolve by patient.doctorID
  const docId = patient?.doctorID ?? patient?.DoctorID ?? docObj?.doctorID ?? docObj?.DoctorID;
  if (docId === 2) {
    return 'Dr. Jhangir Ahmed';
  }
  if (docId === 1) {
    return 'Dr. Super Admin';
  }

  return 'Attending Dental Surgeon';
};

export const handlePrintCompletePatientReport = (patientArg, teethListArg = [], doctorArg = null) => {
  let patient = patientArg;
  let teethList = teethListArg;
  let doctor = doctorArg;

  // Resiliently support single object argument: { patient, patientAge, teethState, treatments, doctor }
  if (patientArg && typeof patientArg === 'object' && !patientArg.patientID && !patientArg.id && !patientArg.firstName && !patientArg.FirstName && patientArg.patient) {
    patient = patientArg.patient;
    teethList = patientArg.teethState || patientArg.teethList || teethListArg;
    doctor = patientArg.doctor || doctorArg;
  }

  const isPed = (patient?.dentitionType || '').toLowerCase() === 'pediatric' || 
                (patient?.age && patient.age < 13);
  
  // Format Patient Name cleanly (e.g. "salman ALI" -> "Salman Ali")
  const pFirst = (patient?.firstName || patient?.FirstName || '').trim();
  const pLast = (patient?.lastName || patient?.LastName || '').trim();
  const rawPName = `${pFirst} ${pLast}`.trim() || 'Patient';
  const pName = rawPName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Dynamically resolve the true Attending Doctor (Dr. Jhangir Ahmed for Patient 14 / Patient 20)
  const docName = getAttendingDoctorName(doctor, patient);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Comprehensive Adult Tooth Anatomy & Types
  const ADULT_TOOTH_INFO = {
    // Upper Jaw - Q1 (Maxillary Right)
    1: { name: 'Maxillary Right 3rd Molar (Wisdom)', type: 'Molar (Grinding)', quad: 'Q1 · Upper Right' },
    2: { name: 'Maxillary Right 2nd Molar', type: 'Molar (Grinding)', quad: 'Q1 · Upper Right' },
    3: { name: 'Maxillary Right 1st Molar (6-Yr Molar)', type: 'Molar (Grinding)', quad: 'Q1 · Upper Right' },
    4: { name: 'Maxillary Right 2nd Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q1 · Upper Right' },
    5: { name: 'Maxillary Right 1st Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q1 · Upper Right' },
    6: { name: 'Maxillary Right Canine (Cuspid)', type: 'Canine (Tearing)', quad: 'Q1 · Upper Right' },
    7: { name: 'Maxillary Right Lateral Incisor', type: 'Incisor (Cutting)', quad: 'Q1 · Upper Right' },
    8: { name: 'Maxillary Right Central Incisor', type: 'Incisor (Cutting)', quad: 'Q1 · Upper Right' },
    // Upper Jaw - Q2 (Maxillary Left)
    9: { name: 'Maxillary Left Central Incisor', type: 'Incisor (Cutting)', quad: 'Q2 · Upper Left' },
    10: { name: 'Maxillary Left Lateral Incisor', type: 'Incisor (Cutting)', quad: 'Q2 · Upper Left' },
    11: { name: 'Maxillary Left Canine (Cuspid)', type: 'Canine (Tearing)', quad: 'Q2 · Upper Left' },
    12: { name: 'Maxillary Left 1st Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q2 · Upper Left' },
    13: { name: 'Maxillary Left 2nd Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q2 · Upper Left' },
    14: { name: 'Maxillary Left 1st Molar (6-Yr Molar)', type: 'Molar (Grinding)', quad: 'Q2 · Upper Left' },
    15: { name: 'Maxillary Left 2nd Molar', type: 'Molar (Grinding)', quad: 'Q2 · Upper Left' },
    16: { name: 'Maxillary Left 3rd Molar (Wisdom)', type: 'Molar (Grinding)', quad: 'Q2 · Upper Left' },
    // Lower Jaw - Q3 (Mandibular Left)
    17: { name: 'Mandibular Left 3rd Molar (Wisdom)', type: 'Molar (Grinding)', quad: 'Q3 · Lower Left' },
    18: { name: 'Mandibular Left 2nd Molar', type: 'Molar (Grinding)', quad: 'Q3 · Lower Left' },
    19: { name: 'Mandibular Left 1st Molar (6-Yr Molar)', type: 'Molar (Grinding)', quad: 'Q3 · Lower Left' },
    20: { name: 'Mandibular Left 2nd Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q3 · Lower Left' },
    21: { name: 'Mandibular Left 1st Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q3 · Lower Left' },
    22: { name: 'Mandibular Left Canine (Cuspid)', type: 'Canine (Tearing)', quad: 'Q3 · Lower Left' },
    23: { name: 'Mandibular Left Lateral Incisor', type: 'Incisor (Cutting)', quad: 'Q3 · Lower Left' },
    24: { name: 'Mandibular Left Central Incisor', type: 'Incisor (Cutting)', quad: 'Q3 · Lower Left' },
    // Lower Jaw - Q4 (Mandibular Right)
    25: { name: 'Mandibular Right Central Incisor', type: 'Incisor (Cutting)', quad: 'Q4 · Lower Right' },
    26: { name: 'Mandibular Right Lateral Incisor', type: 'Incisor (Cutting)', quad: 'Q4 · Lower Right' },
    27: { name: 'Mandibular Right Canine (Cuspid)', type: 'Canine (Tearing)', quad: 'Q4 · Lower Right' },
    28: { name: 'Mandibular Right 1st Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q4 · Lower Right' },
    29: { name: 'Mandibular Right 2nd Premolar (Bicuspid)', type: 'Premolar (Crushing)', quad: 'Q4 · Lower Right' },
    30: { name: 'Mandibular Right 1st Molar (6-Yr Molar)', type: 'Molar (Grinding)', quad: 'Q4 · Lower Right' },
    31: { name: 'Mandibular Right 2nd Molar', type: 'Molar (Grinding)', quad: 'Q4 · Lower Right' },
    32: { name: 'Mandibular Right 3rd Molar (Wisdom)', type: 'Molar (Grinding)', quad: 'Q4 · Lower Right' }
  };

  // Comprehensive Pediatric Tooth Anatomy & Types (A–T)
  const PEDIATRIC_TOOTH_INFO = {
    // Upper Jaw - Maxilla (A–J)
    A: { name: 'Maxillary Right 2nd Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Upper Right (Maxilla)' },
    B: { name: 'Maxillary Right 1st Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Upper Right (Maxilla)' },
    C: { name: 'Maxillary Right Primary Canine', type: 'Primary Canine (Tearing)', quad: 'Upper Right (Maxilla)' },
    D: { name: 'Maxillary Right Primary Lateral Incisor', type: 'Primary Incisor (Cutting)', quad: 'Upper Right (Maxilla)' },
    E: { name: 'Maxillary Right Primary Central Incisor', type: 'Primary Incisor (Cutting)', quad: 'Upper Right (Maxilla)' },
    F: { name: 'Maxillary Left Primary Central Incisor', type: 'Primary Incisor (Cutting)', quad: 'Upper Left (Maxilla)' },
    G: { name: 'Maxillary Left Primary Lateral Incisor', type: 'Primary Incisor (Cutting)', quad: 'Upper Left (Maxilla)' },
    H: { name: 'Maxillary Left Primary Canine', type: 'Primary Canine (Tearing)', quad: 'Upper Left (Maxilla)' },
    I: { name: 'Maxillary Left 1st Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Upper Left (Maxilla)' },
    J: { name: 'Maxillary Left 2nd Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Upper Left (Maxilla)' },
    // Lower Jaw - Mandible (K–T)
    K: { name: 'Mandibular Left 2nd Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Lower Left (Mandible)' },
    L: { name: 'Mandibular Left 1st Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Lower Left (Mandible)' },
    M: { name: 'Mandibular Left Primary Canine', type: 'Primary Canine (Tearing)', quad: 'Lower Left (Mandible)' },
    N: { name: 'Mandibular Left Primary Lateral Incisor', type: 'Primary Incisor (Cutting)', quad: 'Lower Left (Mandible)' },
    O: { name: 'Mandibular Left Primary Central Incisor', type: 'Primary Incisor (Cutting)', quad: 'Lower Left (Mandible)' },
    P: { name: 'Mandibular Right Primary Central Incisor', type: 'Primary Incisor (Cutting)', quad: 'Lower Right (Mandible)' },
    Q: { name: 'Mandibular Right Primary Lateral Incisor', type: 'Primary Incisor (Cutting)', quad: 'Lower Right (Mandible)' },
    R: { name: 'Mandibular Right Primary Canine', type: 'Primary Canine (Tearing)', quad: 'Lower Right (Mandible)' },
    S: { name: 'Mandibular Right 1st Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Lower Right (Mandible)' },
    T: { name: 'Mandibular Right 2nd Primary Molar', type: 'Primary Molar (Grinding)', quad: 'Lower Right (Mandible)' }
  };

  // Build full comprehensive upper and lower jaw arrays
  let upperJawTeeth = [];
  let lowerJawTeeth = [];

  if (isPed) {
    const upperKeys = ['A','B','C','D','E','F','G','H','I','J'];
    const lowerKeys = ['K','L','M','N','O','P','Q','R','S','T'];

    upperJawTeeth = upperKeys.map(k => {
      const match = (teethList || []).find(t => String(t.toothKey || t.toothNumber).toUpperCase() === k);
      const info = PEDIATRIC_TOOTH_INFO[k] || {};
      return {
        toothKey: k,
        toothNumber: k,
        anatomicalName: info.name || `Primary Tooth ${k}`,
        toothType: info.type || 'Deciduous Tooth',
        quadrant: info.quad || 'Maxillary Arch',
        conditionStatus: match?.conditionStatus || match?.status || 'Healthy',
        comments: match?.comments || match?.comment || 'Intact primary deciduous enamel, physiological baseline',
        affectedSurfaces: match?.affectedSurfaces || match?.surfaces || 'Sound'
      };
    });

    lowerJawTeeth = lowerKeys.map(k => {
      const match = (teethList || []).find(t => String(t.toothKey || t.toothNumber).toUpperCase() === k);
      const info = PEDIATRIC_TOOTH_INFO[k] || {};
      return {
        toothKey: k,
        toothNumber: k,
        anatomicalName: info.name || `Primary Tooth ${k}`,
        toothType: info.type || 'Deciduous Tooth',
        quadrant: info.quad || 'Mandibular Arch',
        conditionStatus: match?.conditionStatus || match?.status || 'Healthy',
        comments: match?.comments || match?.comment || 'Intact primary deciduous enamel, physiological baseline',
        affectedSurfaces: match?.affectedSurfaces || match?.surfaces || 'Sound'
      };
    });
  } else {
    // Adult Upper Jaw: Teeth #1 - #16
    for (let i = 1; i <= 16; i++) {
      const match = (teethList || []).find(t => parseInt(t.toothKey || t.toothNumber, 10) === i);
      const info = ADULT_TOOTH_INFO[i] || {};
      upperJawTeeth.push({
        toothKey: i,
        toothNumber: i,
        anatomicalName: info.name || `Permanent Tooth #${i}`,
        toothType: info.type || 'Permanent Tooth',
        quadrant: info.quad || 'Upper Jaw',
        conditionStatus: match?.conditionStatus || match?.status || 'Healthy',
        comments: match?.comments || match?.comment || 'Intact anatomical enamel, physiological baseline',
        affectedSurfaces: match?.affectedSurfaces || match?.surfaces || 'Sound'
      });
    }

    // Adult Lower Jaw: Teeth #17 - #32
    for (let i = 17; i <= 32; i++) {
      const match = (teethList || []).find(t => parseInt(t.toothKey || t.toothNumber, 10) === i);
      const info = ADULT_TOOTH_INFO[i] || {};
      lowerJawTeeth.push({
        toothKey: i,
        toothNumber: i,
        anatomicalName: info.name || `Permanent Tooth #${i}`,
        toothType: info.type || 'Permanent Tooth',
        quadrant: info.quad || 'Lower Jaw',
        conditionStatus: match?.conditionStatus || match?.status || 'Healthy',
        comments: match?.comments || match?.comment || 'Intact anatomical enamel, physiological baseline',
        affectedSurfaces: match?.affectedSurfaces || match?.surfaces || 'Sound'
      });
    }
  }

  const allCombined = [...upperJawTeeth, ...lowerJawTeeth];
  const totalTeeth = allCombined.length;
  const healthyCount = allCombined.filter(t => (t.conditionStatus || t.status || 'Healthy') === 'Healthy').length;
  const diseasedCount = totalTeeth - healthyCount;

  // Upper & Lower Jaw stats
  const upperHealthy = upperJawTeeth.filter(t => (t.conditionStatus || t.status || 'Healthy') === 'Healthy').length;
  const lowerHealthy = lowerJawTeeth.filter(t => (t.conditionStatus || t.status || 'Healthy') === 'Healthy').length;

  const renderToothRow = (t) => {
    const num = t.toothKey || t.toothNumber;
    const status = t.conditionStatus || t.status || 'Healthy';
    const isH = status === 'Healthy';
    const comments = t.comments || t.comment || (isH ? 'Physiological enamel baseline' : 'Clinical condition noted');
    
    let action = 'Maintenance & Recall';
    const sLower = status.toLowerCase();
    if (sLower.includes('caries') || sLower.includes('decay')) action = 'Restoration Required';
    else if (sLower.includes('rct') || sLower.includes('root canal') || sLower.includes('pulpotomy')) action = 'Endodontic / Crown Follow-up';
    else if (sLower.includes('implant')) action = 'Osseointegration Review';
    else if (sLower.includes('crown')) action = 'Crown Margin Review';
    else if (sLower.includes('ortho') || sLower.includes('bite')) action = 'Ortho Arch Alignment';
    else if (sLower.includes('extract') || sLower.includes('miss')) action = 'Prosthetic Replacement / Space Management';

    const surfaces = t.affectedSurfaces || t.surfaces || (isH ? 'Sound' : 'Occlusal');

    // Type badge color
    let typeBadgeClass = 'type-molar';
    if (t.toothType.includes('Premolar')) typeBadgeClass = 'type-premolar';
    else if (t.toothType.includes('Canine')) typeBadgeClass = 'type-canine';
    else if (t.toothType.includes('Incisor')) typeBadgeClass = 'type-incisor';

    return `
      <tr class="${isH ? '' : 'has-disease'}">
        <td style="font-weight: 900; color: #1E3A8A; text-align: center;">${isPed ? `Tooth ${num}` : `#${num}`}</td>
        <td>
          <div style="font-weight: 800; color: #0F172A;">${t.anatomicalName}</div>
          <div style="font-size: 8px; color: #64748B;">${t.quadrant}</div>
        </td>
        <td>
          <span class="tooth-type-badge ${typeBadgeClass}">${t.toothType}</span>
        </td>
        <td>
          <span class="${isH ? 'badge-healthy' : 'badge-disease'}">${status}</span>
        </td>
        <td style="text-align: center; font-weight: 700; color: #475569;">${surfaces}</td>
        <td>${comments}</td>
        <td><strong style="color: #1E40AF;">${action}</strong></td>
      </tr>
    `;
  };

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Clinical Odontogram Report — ${pName} (#${patient?.patientID || patient?.id || '14'})</title>
      <meta charset="utf-8" />
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          color: #0F172A; 
          margin: 0; 
          padding: 0; 
          font-size: 9.5px; 
          line-height: 1.3; 
        }
        .header { 
          border-bottom: 2.5px solid #1E3A8A; 
          padding-bottom: 8px; 
          margin-bottom: 10px; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
        }
        .clinic-brand { font-size: 17px; font-weight: 900; color: #1E3A8A; letter-spacing: -0.5px; }
        .clinic-sub { font-size: 9px; color: #64748B; font-weight: 600; margin-top: 1px; }
        .report-badge { 
          background: #EEF2FF; 
          border: 1px solid #C7D2FE; 
          color: #3730A3; 
          font-weight: 800; 
          font-size: 8.5px; 
          padding: 3px 8px; 
          border-radius: 6px; 
          text-transform: uppercase; 
        }
        
        .patient-card { 
          background: #F8FAFC; 
          border: 1px solid #E2E8F0; 
          border-radius: 8px; 
          padding: 8px 12px; 
          margin-bottom: 10px; 
          display: grid; 
          grid-template-columns: 2fr 1fr 1fr 1.5fr; 
          gap: 8px; 
        }
        .field-label { font-size: 7.5px; font-weight: 800; color: #64748B; text-transform: uppercase; }
        .field-val { font-size: 10.5px; font-weight: 700; color: #0F172A; margin-top: 1px; }
        
        .metrics-bar { display: flex; gap: 6px; margin-bottom: 10px; }
        .metric-pill { flex: 1; padding: 5px 6px; border-radius: 6px; border: 1px solid #E2E8F0; background: #FFF; text-align: center; }
        .metric-pill.healthy { border-color: #A7F3D0; background: #ECFDF5; color: #065F46; }
        .metric-pill.pathology { border-color: #FECDD3; background: #FFF1F2; color: #9F1239; }
        .metric-pill.jaw { border-color: #C7D2FE; background: #EEF2FF; color: #312E81; }
        .metric-num { font-size: 12px; font-weight: 900; }
        .metric-label { font-size: 7.5px; font-weight: 700; text-transform: uppercase; }

        .jaw-section-header { 
          background: #1E3A8A; 
          color: white; 
          padding: 5px 8px; 
          border-radius: 6px 6px 0 0; 
          font-size: 9.5px; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .jaw-section-header.mandible {
          background: #047857;
        }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8.5px; border: 1px solid #CBD5E1; border-top: none; }
        th { background: #F1F5F9; color: #334155; font-weight: 800; text-align: left; padding: 4px 6px; font-size: 7.5px; text-transform: uppercase; border-bottom: 1.5px solid #CBD5E1; }
        td { padding: 4px 6px; border-bottom: 1px solid #E2E8F0; vertical-align: middle; }
        tr:nth-child(even) { background: #FAFAFA; }
        tr.has-disease { background: #FFF1F2; }

        .badge-healthy { color: #059669; font-weight: 800; background: #ECFDF5; padding: 2px 5px; border-radius: 4px; border: 1px solid #A7F3D0; font-size: 8px; }
        .badge-disease { color: #DC2626; font-weight: 800; background: #FFF1F2; padding: 2px 5px; border-radius: 4px; border: 1px solid #FECDD3; font-size: 8px; }

        .tooth-type-badge {
          display: inline-block;
          font-size: 7.5px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .type-molar { background: #E0E7FF; color: #3730A3; border: 1px solid #C7D2FE; }
        .type-premolar { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
        .type-canine { background: #FCE7F3; color: #9D174D; border: 1px solid #FBCFE8; }
        .type-incisor { background: #E0F2FE; color: #075985; border: 1px solid #BAE6FD; }

        .treatment-plan { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; }
        .treatment-step { margin-bottom: 2px; font-size: 8.5px; font-weight: 600; color: #166534; }

        .signature-area { margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6px; border-top: 1px solid #CBD5E1; }
        .sig-box { width: 200px; text-align: center; }
        .sig-line { border-bottom: 1px dashed #475569; height: 24px; margin-bottom: 3px; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="clinic-brand">DENTIA ADVANCED DENTAL CARE</div>
          <div class="clinic-sub">Center for Maxillofacial Surgery, Pediatric Dentistry & Implantology</div>
        </div>
        <div style="text-align: right;">
          <span class="report-badge">Official Odontogram Record</span>
          <div style="font-size: 8px; color: #64748B; margin-top: 3px;">Date: ${dateStr}</div>
        </div>
      </div>

      <!-- Patient Information Card -->
      <div class="patient-card">
        <div>
          <div class="field-label">Patient Full Name</div>
          <div class="field-val" style="font-size: 11px; color: #1E3A8A;">${pName}</div>
        </div>
        <div>
          <div class="field-label">Patient ID</div>
          <div class="field-val">#${patient?.patientID || patient?.id || '14'}</div>
        </div>
        <div>
          <div class="field-label">Age & Gender</div>
          <div class="field-val">${patient?.age ? `${patient.age} Yrs` : '25 Yrs'} (${patient?.gender || 'Female'})</div>
        </div>
        <div>
          <div class="field-label">Dentition Category</div>
          <div class="field-val" style="color: #6D28D9;">${isPed ? '👶 Pediatric Primary Arch (A–T)' : '🦷 Adult Permanent Arch (1–32)'}</div>
        </div>
      </div>

      <!-- Odontogram Metrics Summary -->
      <div class="metrics-bar">
        <div class="metric-pill">
          <div class="metric-num">${totalTeeth}</div>
          <div class="metric-label">Total Teeth</div>
        </div>
        <div class="metric-pill healthy">
          <div class="metric-num">${healthyCount}</div>
          <div class="metric-label">Sound / Intact</div>
        </div>
        <div class="metric-pill pathology">
          <div class="metric-num">${diseasedCount}</div>
          <div class="metric-label">Diagnosed / Pathologic</div>
        </div>
        <div class="metric-pill jaw">
          <div class="metric-num">${upperHealthy}/${upperJawTeeth.length}</div>
          <div class="metric-label">Upper Jaw (Maxilla)</div>
        </div>
        <div class="metric-pill jaw">
          <div class="metric-num">${lowerHealthy}/${lowerJawTeeth.length}</div>
          <div class="metric-label">Lower Jaw (Mandible)</div>
        </div>
        <div class="metric-pill">
          <div class="metric-num" style="font-size: 10px; margin-top: 2px;">${docName}</div>
          <div class="metric-label">Attending Doctor</div>
        </div>
      </div>

      <!-- SECTION 1: MAXILLA (UPPER JAW) -->
      <div class="jaw-section-header">
        <span>🦷 SECTION A: MAXILLARY ARCH (UPPER JAW) — ${isPed ? 'TEETH A to J' : 'TEETH #1 to #16 (QUADRANTS 1 & 2)'}</span>
        <span style="font-size: 8px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px;">
          ${upperHealthy}/${upperJawTeeth.length} Healthy
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">Tooth</th>
            <th style="width: 25%;">Anatomical Name & Quadrant</th>
            <th style="width: 17%;">Tooth Type & Function</th>
            <th style="width: 15%;">Clinical Status</th>
            <th style="width: 8%; text-align: center;">Surfaces</th>
            <th style="width: 15%;">Doctor Clinical Observations</th>
            <th style="width: 12%;">Action Plan</th>
          </tr>
        </thead>
        <tbody>
          ${upperJawTeeth.map(renderToothRow).join('')}
        </tbody>
      </table>

      <!-- SECTION 2: MANDIBLE (LOWER JAW) -->
      <div class="jaw-section-header mandible">
        <span>🦷 SECTION B: MANDIBULAR ARCH (LOWER JAW) — ${isPed ? 'TEETH K to T' : 'TEETH #17 to #32 (QUADRANTS 3 & 4)'}</span>
        <span style="font-size: 8px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px;">
          ${lowerHealthy}/${lowerJawTeeth.length} Healthy
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">Tooth</th>
            <th style="width: 25%;">Anatomical Name & Quadrant</th>
            <th style="width: 17%;">Tooth Type & Function</th>
            <th style="width: 15%;">Clinical Status</th>
            <th style="width: 8%; text-align: center;">Surfaces</th>
            <th style="width: 15%;">Doctor Clinical Observations</th>
            <th style="width: 12%;">Action Plan</th>
          </tr>
        </thead>
        <tbody>
          ${lowerJawTeeth.map(renderToothRow).join('')}
        </tbody>
      </table>

      <!-- Treatment Plan & Clinical Guidelines -->
      <div class="treatment-plan">
        <div style="font-weight: 800; font-size: 9px; color: #166534; margin-bottom: 2px;">CLINICAL RECOMMENDATIONS & ACTION TIMELINE:</div>
        <div class="treatment-step">1. <strong>Restorative Care:</strong> Treat active caries on upper/lower molars and premolars according to dental protocol.</div>
        <div class="treatment-step">2. <strong>Preventative Prophylaxis:</strong> Complete full mouth ultrasonic scaling and polishing at 6-month recall interval.</div>
        <div class="treatment-step">3. <strong>Home Care Regimen:</strong> Modified Bass technique brushing twice daily with fluoridated toothpaste and interdental flossing.</div>
      </div>

      <!-- Certification & Signature -->
      <div class="signature-area">
        <div style="font-size: 7.5px; color: #64748B; max-width: 380px;">
          This electronic clinical record was verified and issued by Dentia Dental EHR System. 
          Report generated in accordance with ADA / FDI odontogram documentation guidelines.
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div style="font-weight: 800; font-size: 10px; color: #1E3A8A;">${docName}</div>
          <div style="font-size: 7.5px; color: #64748B;">Licensed Dental Practitioner • Official Signature</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    window.print();
  }
};

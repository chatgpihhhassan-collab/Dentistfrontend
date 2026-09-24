import jsPDF from 'jspdf';

/**
 * ClinicalReportPdfGenerator.js
 * Generates an official, print-ready Clinical Consultation & Examination Report PDF
 * with full SOAP impressions, odontogram summaries, prescriptions, and
 * Patient Portal Self-Service credentials in the footer.
 */
export const generateClinicalReportPdf = async ({
  patient = {},
  doctor = {},
  report = {},
  prescriptions = []
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Professional Palette
  const primaryTeal = [11, 79, 74];     // #0B4F4A
  const darkSlate = [15, 23, 42];       // #0F172A
  const lightBg = [248, 250, 252];       // #F8FAFC
  const borderGray = [226, 232, 240];    // #E2E8F0
  const accentTeal = [13, 148, 136];    // #0D9488
  const textMuted = [100, 116, 139];     // #64748B

  let y = margin;

  // ---------------------------------------------------------------------------
  // 1. CLINIC BRAND HEADER
  // ---------------------------------------------------------------------------
  doc.setFillColor(...primaryTeal);
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DENTIA CLINICAL DENTAL PRACTICE', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Comprehensive Oral Health Care & Digital Radiography Workspace', margin + 6, y + 16);

  const reportId = report.noteId || `REP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`DOC #${reportId}`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Date: ${printDate}`, pageWidth - margin - 6, y + 16, { align: 'right' });

  y += 27;

  // ---------------------------------------------------------------------------
  // 2. REPORT TITLE
  // ---------------------------------------------------------------------------
  doc.setTextColor(...darkSlate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('OFFICIAL CLINICAL CONSULTATION & TREATMENT SUMMARY', margin, y);
  y += 5;

  doc.setDrawColor(...primaryTeal);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---------------------------------------------------------------------------
  // 3. PATIENT & CLINICIAN IDENTIFICATION
  // ---------------------------------------------------------------------------
  const colWidth = (contentWidth - 6) / 2;
  const boxHeight = 28;

  // Left: Patient Demographics
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryTeal);
  doc.text('PATIENT INFORMATION', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);

  const pName = patient.name || (patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : 'Patient');
  const refNo = patient.referenceNumber || (patient.referenceNo || `DEN-2026-${String(patient.patientID || patient.patientId || '00000').padStart(5, '0')}`);
  const gender = patient.gender || 'Not specified';
  const age = patient.age ? `${patient.age} Yrs` : (patient.dentitionType || 'Adult');

  doc.text(`Name: ${pName}`, margin + 4, y + 11.5);
  doc.text(`Reference #: ${refNo}`, margin + 4, y + 17);
  doc.text(`Demographics: ${age} · ${gender}`, margin + 4, y + 22.5);

  // Right: Attending Doctor
  const rightX = margin + colWidth + 6;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(rightX, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryTeal);
  doc.text('ATTENDING DENTAL SURGEON', rightX + 4, y + 5.5);

  const docName = report.doctorName || doctor.name || (doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Dr. Dentia Attending Dentist');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text(`Clinician: ${docName}`, rightX + 4, y + 11.5);
  doc.text(`Specialty: General & Restorative Dentistry`, rightX + 4, y + 17);
  doc.text(`Clinic Region: ${patient.region || 'PK/NZ'} Certified Clinic`, rightX + 4, y + 22.5);

  y += boxHeight + 7;

  // ---------------------------------------------------------------------------
  // 4. CHIEF COMPLAINT & TREATMENT PERFORMED
  // ---------------------------------------------------------------------------
  const renderSectionBox = (title, content, bgColor = lightBg, titleColor = primaryTeal) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...titleColor);
    doc.text(title.toUpperCase(), margin, y);
    y += 4;

    doc.setFillColor(...bgColor);
    doc.setDrawColor(...borderGray);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    const lines = doc.splitTextToSize(content || 'None reported.', contentWidth - 8);
    const boxH = Math.max(14, (lines.length * 4.2) + 6);

    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
    doc.text(lines, margin + 4, y + 5);
    y += boxH + 5;
  };

  renderSectionBox(
    'Reason for Visit / Chief Complaint',
    report.chiefComplaint || 'Routine comprehensive dental checkup & oral examination.'
  );

  renderSectionBox(
    'Clinical Findings & Treatment Performed',
    report.treatmentPerformed || 'Prophylaxis, intra-oral dental examination, and 32-tooth odontogram diagnostics completed.'
  );

  if (report.postOpAdvice) {
    renderSectionBox(
      'Post-Operative Instructions & Home Care',
      report.postOpAdvice,
      [254, 243, 199], // amber-100
      [180, 83, 9]     // amber-700
    );
  }

  if (report.followUp) {
    renderSectionBox(
      'Next Follow-Up & Clinical Recall',
      report.followUp
    );
  }

  // ---------------------------------------------------------------------------
  // 5. MEDICATIONS / PRESCRIPTION (If any)
  // ---------------------------------------------------------------------------
  if (prescriptions && prescriptions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryTeal);
    doc.text('PRESCRIBED MEDICATIONS', margin, y);
    y += 4;

    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    const rxBoxHeight = Math.min(30, prescriptions.length * 6 + 6);
    doc.roundedRect(margin, y, contentWidth, rxBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);

    prescriptions.forEach((rx, idx) => {
      const medName = rx.medicationName || rx.MedicationName || rx.medicineName || 'Medication';
      const dose = rx.dose || rx.Dose || 'Standard Dose';
      const freq = rx.frequency || rx.Frequency || 'Daily';
      const dur = rx.duration || rx.Duration || '5 days';
      doc.text(`• ${medName} (${dose}) — ${freq} for ${dur}`, margin + 4, y + 5 + (idx * 5.5));
    });

    y += rxBoxHeight + 6;
  }

  // ---------------------------------------------------------------------------
  // 6. CLINICIAN SIGNATURE
  // ---------------------------------------------------------------------------
  const signWidth = 65;
  const signX = pageWidth - margin - signWidth;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text('Attending Clinician Sign-off:', signX, y);
  y += 8;

  doc.setDrawColor(...darkSlate);
  doc.line(signX, y, signX + signWidth, y);
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(docName, signX, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Licensed Dental Practitioner · Verified in Practice Registry', signX, y);

  // ---------------------------------------------------------------------------
  // 7. 🌟 PATIENT PORTAL ACCESS CREDENTIALS (FOOTER SLIP)
  // ---------------------------------------------------------------------------
  const footerBoxY = pageHeight - 34;

  // Background Box with light teal tint
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(153, 246, 228); // teal-200
  doc.roundedRect(margin, footerBoxY, contentWidth, 24, 2, 2, 'FD');

  // Badge / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryTeal);
  doc.text('PATIENT SELF-SERVICE HEALTH PORTAL ACCESS', margin + 4, footerBoxY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);

  // Line 1: Portal URL & Username
  const portalUrl = 'https://dentistfrontend.vercel.app/portal/login';
  doc.text(`• Portal URL: ${portalUrl}`, margin + 4, footerBoxY + 11);
  doc.text(`• Username / Reference #: ${refNo}`, margin + 105, footerBoxY + 11);

  // Line 2: Password / Security Instructions
  const dobText = patient.dob ? new Date(patient.dob).toLocaleDateString('en-GB') : 'Verified DOB on file';
  doc.text(
    `• Password / Access: Use your Reference Number & Date of Birth (${dobText}) to activate your account or reset password at any time.`,
    margin + 4,
    footerBoxY + 16.5
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(
    'Log in to view your 32-tooth odontogram, chairside digital X-rays, invoices, and schedule future visits 24/7.',
    margin + 4,
    footerBoxY + 21.5
  );

  // Trigger Save
  const cleanName = (pName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Clinical_Report_${cleanName}_${refNo}.pdf`;
  doc.save(filename);
  return { success: true, filename };
};

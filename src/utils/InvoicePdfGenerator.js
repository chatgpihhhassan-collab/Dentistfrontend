import jsPDF from 'jspdf';

/**
 * InvoicePdfGenerator.js
 * Generates an official, certified Dental Clinic Tax Invoice & Payment Receipt PDF.
 * Includes clinic branding, itemized ADA CDT dental procedures, payments & vouchers,
 * and the standardized Patient Self-Service Health Portal Access Slip in the footer
 * with Reference Number, Password/Access Key, and Online Access URL.
 */
export const generateInvoicePdf = async ({
  patient = {},
  doctor = {},
  invoice = {},
  payments = [],
  voucherCode = null,
  clinic = {}
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
  const textMuted = [100, 116, 139];     // #64748B
  const emeraldGreen = [16, 149, 93];   // #10955D
  const amberGold = [180, 83, 9];        // #B45309

  const currency = (invoice.currency || 'NZD').toUpperCase();
  const formatCurrency = (amt) => {
    const val = Number(amt || 0);
    if (currency === 'PKR') return `Rs ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (currency === 'GBP') return `£${val.toFixed(2)}`;
    if (currency === 'EUR') return `€${val.toFixed(2)}`;
    if (currency === 'USD') return `$${val.toFixed(2)} USD`;
    return `$${val.toFixed(2)} ${currency}`;
  };

  let y = margin;

  // ---------------------------------------------------------------------------
  // 1. CLINIC BRAND HEADER
  // ---------------------------------------------------------------------------
  doc.setFillColor(...primaryTeal);
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DENTIA DENTAL HEALTHCARE & SURGERY', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Advanced Restorative, Endodontic, Implant & Pediatric Dental Clinic', margin + 6, y + 16);
  doc.text('100 Queen Street, Auckland CBD · Tel: +64 9 888 1234 · Web: https://dentistfrontend.vercel.app', margin + 6, y + 21);

  const invNum = invoice.invoiceNumber || `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`INVOICE #${invNum}`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const printDate = new Date(invoice.issueDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Issue Date: ${printDate}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  const dueDate = new Date(invoice.dueDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Due Date: ${dueDate}`, pageWidth - margin - 6, y + 20, { align: 'right' });

  y += 29;

  // ---------------------------------------------------------------------------
  // 2. DOCUMENT TITLE & STATUS BADGE
  // ---------------------------------------------------------------------------
  const isPaid = (invoice.balanceAmount <= 0) || (invoice.status === 'Paid');
  const isPendingCash = !isPaid && (invoice.status?.includes('Cash') || invoice.paymentMethod?.includes('Cash') || !!voucherCode);

  doc.setTextColor(...darkSlate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL TAX INVOICE & TREATMENT RECEIPT', margin, y);

  // Status Badge on Right
  const badgeWidth = 46;
  const badgeX = pageWidth - margin - badgeWidth;
  if (isPaid) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(...emeraldGreen);
    doc.roundedRect(badgeX, y - 5, badgeWidth, 7.5, 1.5, 1.5, 'FD');
    doc.setTextColor(...emeraldGreen);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ PAID IN FULL', badgeX + (badgeWidth / 2), y - 0.2, { align: 'center' });
  } else if (isPendingCash) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(...amberGold);
    doc.roundedRect(badgeX, y - 5, badgeWidth, 7.5, 1.5, 1.5, 'FD');
    doc.setTextColor(...amberGold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('⏱ PENDING CASH', badgeX + (badgeWidth / 2), y - 0.2, { align: 'center' });
  } else {
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(225, 29, 72);
    doc.roundedRect(badgeX, y - 5, badgeWidth, 7.5, 1.5, 1.5, 'FD');
    doc.setTextColor(225, 29, 72);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('BALANCE DUE', badgeX + (badgeWidth / 2), y - 0.2, { align: 'center' });
  }

  y += 5;
  doc.setDrawColor(...primaryTeal);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---------------------------------------------------------------------------
  // 3. PATIENT & CLINICIAN PROFILE BOXES
  // ---------------------------------------------------------------------------
  const colWidth = (contentWidth - 6) / 2;
  const boxHeight = 28;

  // Left: Patient Information
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryTeal);
  doc.text('PATIENT / BILLED TO', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);

  const pName = patient.name || (patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : 'Registered Patient');
  const refNo = patient.referenceNumber || (patient.referenceNo || `DEN-2026-${String(patient.patientID || patient.patientId || patient.id || '00000').padStart(5, '0')}`);
  const pDob = patient.dob ? new Date(patient.dob).toLocaleDateString('en-GB') : 'Verified on File';
  const pPhone = patient.phone || 'Phone on record';

  doc.setFont('helvetica', 'bold');
  doc.text(`Patient: ${pName}`, margin + 4, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reference #: ${refNo}`, margin + 4, y + 17);
  doc.text(`DOB: ${pDob} · Phone: ${pPhone}`, margin + 4, y + 22.5);

  // Right: Practice & Attending Dentist
  const rightX = margin + colWidth + 6;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(rightX, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryTeal);
  doc.text('ATTENDING CLINICIAN & FACILITY', rightX + 4, y + 5.5);

  const docName = invoice.doctorName || doctor.name || (doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Dr. Jhangir Ahmed, BDS, MDS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text(`Clinician: ${docName}`, rightX + 4, y + 11.5);
  doc.text(`Department: Restorative & Surgical Dental Care`, rightX + 4, y + 17);
  doc.text(`Tax ID: GST # 134-889-204 · License # D-4491`, rightX + 4, y + 22.5);

  y += boxHeight + 7;

  // ---------------------------------------------------------------------------
  // 4. CASH VOUCHER CALLOUT (If Pending Cash Settlement)
  // ---------------------------------------------------------------------------
  const activeVoucher = voucherCode || invoice.voucherCode;
  if (isPendingCash && activeVoucher) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(...amberGold);
    doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...amberGold);
    doc.text(`CLINIC FRONT DESK CASH VOUCHER CODE: ${activeVoucher}`, margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 53, 15);
    doc.text('Please present this voucher slip at reception desk when paying in cash. Status will update to Paid automatically.', margin + 4, y + 11.5);

    y += 19;
  }

  // ---------------------------------------------------------------------------
  // 5. ITEMIZED PROCEDURES TABLE
  // ---------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryTeal);
  doc.text('ITEMIZED DENTAL PROCEDURES & CLINICAL SERVICES', margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(...borderGray);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text('#', margin + 3, y + 4.8);
  doc.text('CODE', margin + 12, y + 4.8);
  doc.text('PROCEDURE / CONDITION DESCRIPTION', margin + 34, y + 4.8);
  doc.text('QTY', margin + 125, y + 4.8, { align: 'center' });
  doc.text('UNIT FEE', margin + 150, y + 4.8, { align: 'right' });
  doc.text('TOTAL', pageWidth - margin - 3, y + 4.8, { align: 'right' });

  y += 7;

  // Table Body Rows
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          procedureCode: 'D0150',
          description: invoice.notes || 'Comprehensive Oral Evaluation & Treatment Review',
          quantity: 1,
          unitPrice: invoice.totalAmount || 85,
          totalPrice: invoice.totalAmount || 85
        }
      ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setDrawColor(...borderGray);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    doc.setTextColor(...textMuted);
    doc.text(String(idx + 1), margin + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryTeal);
    doc.text(item.procedureCode || 'CDT', margin + 12, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkSlate);
    const descText = item.toothNumber ? `${item.description} (Tooth #${item.toothNumber})` : item.description;
    const truncatedDesc = doc.splitTextToSize(descText, 86)[0];
    doc.text(truncatedDesc, margin + 34, y + 4.5);

    doc.text(String(item.quantity || 1), margin + 125, y + 4.5, { align: 'center' });
    doc.text(formatCurrency(item.unitPrice), margin + 150, y + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.totalPrice || item.unitPrice), pageWidth - margin - 3, y + 4.5, { align: 'right' });

    y += 6.5;
  });

  y += 4;

  // ---------------------------------------------------------------------------
  // 6. TOTALS & FINANCIAL RECONCILIATION SUMMARY
  // ---------------------------------------------------------------------------
  const totalAmount = invoice.totalAmount || items.reduce((s, it) => s + (it.totalPrice || it.unitPrice || 0), 0);
  const paidAmount = isPaid ? totalAmount : (invoice.paidAmount || 0);
  const balanceDue = isPaid ? 0 : (invoice.balanceAmount ?? (totalAmount - paidAmount));

  const totalsBoxWidth = 80;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Subtotal:', totalsBoxX + 4, y + 6);
  doc.setTextColor(...darkSlate);
  doc.text(formatCurrency(totalAmount), pageWidth - margin - 4, y + 6, { align: 'right' });

  doc.setTextColor(...textMuted);
  doc.text('Paid to Date:', totalsBoxX + 4, y + 12);
  doc.setTextColor(...emeraldGreen);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(paidAmount), pageWidth - margin - 4, y + 12, { align: 'right' });

  doc.setDrawColor(...borderGray);
  doc.line(totalsBoxX + 4, y + 16, pageWidth - margin - 4, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkSlate);
  doc.text('Balance Due:', totalsBoxX + 4, y + 22.5);
  doc.setTextColor(balanceDue > 0 ? 225 : 16, balanceDue > 0 ? 29 : 149, balanceDue > 0 ? 72 : 93);
  doc.text(formatCurrency(balanceDue), pageWidth - margin - 4, y + 22.5, { align: 'right' });

  // Left Note / Terms Box
  const termsWidth = contentWidth - totalsBoxWidth - 6;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, termsWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryTeal);
  doc.text('PAYMENT TERMS & CLINICAL REMARKS', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  const noteLines = doc.splitTextToSize(
    invoice.notes || 'Payment terms: Due within 14 days of issue. In-person settlements accepted via Cash Desk or POS Card terminal. Online card checkout supported via patient self-service portal.',
    termsWidth - 8
  );
  doc.text(noteLines, margin + 4, y + 11);

  y += 34;

  // ---------------------------------------------------------------------------
  // 7. CLINICIAN & ACCOUNTS STAMP
  // ---------------------------------------------------------------------------
  const signWidth = 65;
  const signX = pageWidth - margin - signWidth;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text('Authorized Practice Signature:', signX, y);
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
  doc.text('Attending Dental Practitioner · Dentia Clinic', signX, y);

  // ---------------------------------------------------------------------------
  // 8. 🌟 CORE PATIENT PORTAL ACCESS CREDENTIALS (FOOTER SLIP)
  // ---------------------------------------------------------------------------
  const footerBoxY = pageHeight - 34;

  // Rounded Teal Box Frame
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(153, 246, 228); // teal-200
  doc.roundedRect(margin, footerBoxY, contentWidth, 24, 2, 2, 'FD');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryTeal);
  doc.text('PATIENT SELF-SERVICE HEALTH PORTAL ACCESS CREDENTIALS', margin + 4, footerBoxY + 5.5);

  // Line 1: Portal URL & Patient Reference Number
  const portalUrl = 'https://dentistfrontend.vercel.app/portal/login';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text('• Online Portal URL:', margin + 4, footerBoxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryTeal);
  doc.text(portalUrl, margin + 35, footerBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('• Patient Reference #:', margin + 110, footerBoxY + 11);
  doc.setTextColor(...primaryTeal);
  doc.text(refNo, margin + 144, footerBoxY + 11);

  // Line 2: Password / Access Key
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('• Account Password / Access Key:', margin + 4, footerBoxY + 16.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkSlate);
  doc.text(
    `Initial access password is your verified Date of Birth (${pDob}) or your chosen password. Reset anytime at portal/activate.`,
    margin + 52,
    footerBoxY + 16.5
  );

  // Line 3: Online Portal Benefits
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(
    'Visit the portal link above 24/7 to review your itemized invoice receipts, 3D tooth chart, digital X-rays, and book visits.',
    margin + 4,
    footerBoxY + 21.5
  );

  // Trigger Save
  const cleanPatientName = pName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Invoice_${cleanPatientName}_${invNum}.pdf`;
  doc.save(filename);
  return { success: true, filename };
};

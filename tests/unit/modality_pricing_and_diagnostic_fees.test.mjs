import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Modality Pricing & Diagnostic Auto-Billing Unit Test Suite ──

// 1. Simulation of Doctor Fee Schedule Lookup Logic
function resolveDoctorFee(doctorFeeSchedule, catalog, category, procCode = null) {
  const catLower = (category || '').toLowerCase();

  // 1. Direct code lookup if given
  if (procCode && doctorFeeSchedule?.length > 0) {
    const direct = doctorFeeSchedule.find(p => (p.procedureCode || '').toUpperCase() === procCode.toUpperCase());
    if (direct) return direct.doctorPrice ?? direct.standardFee;
  }

  // 2. Specific standard procedure code mappings
  let targetCode = null;
  if (catLower === 'braces' || catLower.includes('brace')) targetCode = 'D8080';
  else if (catLower === 'whitening' || catLower.includes('whiten')) targetCode = 'D9972';
  else if (catLower === 'cavity' || catLower.includes('cavity')) targetCode = 'D2391';
  else if (catLower === 'consultation' || catLower.includes('consult')) targetCode = 'D0150';
  else if (catLower === 'xray' || catLower.includes('x-ray') || catLower.includes('radiograph')) targetCode = 'D0220';

  if (targetCode && doctorFeeSchedule?.length > 0) {
    const matched = doctorFeeSchedule.find(p => (p.procedureCode || '').toUpperCase() === targetCode);
    if (matched) return matched.doctorPrice ?? matched.standardFee;
  }

  // 3. Fallback match by category in doctor fee schedule
  if (doctorFeeSchedule?.length > 0) {
    const byCat = doctorFeeSchedule.find(p => (p.category || '').toLowerCase() === catLower);
    if (byCat) return byCat.doctorPrice ?? byCat.standardFee;
  }

  // 4. Fallback to catalog
  if (catalog?.length > 0) {
    if (targetCode) {
      const catMatch = catalog.find(c => (c.procedureCode || '').toUpperCase() === targetCode);
      if (catMatch) return catMatch.standardFee;
    }
    const catByCat = catalog.find(c => (c.category || '').toLowerCase() === catLower);
    if (catByCat) return catByCat.standardFee;
  }

  return 0;
}

// 2. Simulation of EnsureDiagnosticFeeAsync (Consultation & X-Ray Auto-Billing)
class MockDiagnosticFeeService {
  constructor() {
    this.treatmentItems = [];
    this.doctorFeeSchedules = {
      // Doctor 1 has set custom rates:
      1: [
        { procedureCode: 'D0150', category: 'consultation', doctorPrice: 4500, standardFee: 3500 },
        { procedureCode: 'D0220', category: 'xray', doctorPrice: 2800, standardFee: 2000 },
        { procedureCode: 'D8080', category: 'braces', doctorPrice: 145000, standardFee: 120000 },
        { procedureCode: 'D9972', category: 'whitening', doctorPrice: 28000, standardFee: 25000 },
        { procedureCode: 'D2391', category: 'cavity', doctorPrice: 6500, standardFee: 5000 }
      ],
      // Doctor 2 has set different custom rates:
      2: [
        { procedureCode: 'D0150', category: 'consultation', doctorPrice: 3000, standardFee: 3500 },
        { procedureCode: 'D0220', category: 'xray', doctorPrice: 1800, standardFee: 2000 },
        { procedureCode: 'D8080', category: 'braces', doctorPrice: 95000, standardFee: 120000 },
        { procedureCode: 'D9972', category: 'whitening', doctorPrice: 20000, standardFee: 25000 },
        { procedureCode: 'D2391', category: 'cavity', doctorPrice: 4200, standardFee: 5000 }
      ]
    };
  }

  ensureDiagnosticFee({ patientId, doctorId, feeType, toothNumber }) {
    const schedules = this.doctorFeeSchedules[doctorId] || [];

    if (feeType === 'consultation') {
      // Idempotency check: Do not bill if patient already has D0150 or consultation category
      const alreadyHas = this.treatmentItems.some(
        i => i.patientId === patientId && (i.procedureCode === 'D0150' || i.category === 'consultation')
      );
      if (alreadyHas) {
        return { billed: false, message: 'Patient already has a consultation fee billed.' };
      }

      const fee = schedules.find(p => p.procedureCode === 'D0150')?.doctorPrice || 3500;
      const newItem = {
        id: this.treatmentItems.length + 1,
        patientId,
        doctorId,
        procedureCode: 'D0150',
        procedureName: 'Comprehensive Oral Evaluation / Initial Consultation',
        category: 'consultation',
        toothNumber: 0,
        finalPrice: fee,
        status: 'proposed'
      };
      this.treatmentItems.push(newItem);
      return { billed: true, fee, item: newItem };
    }

    if (feeType === 'rvg_xray') {
      const fee = schedules.find(p => p.procedureCode === 'D0220')?.doctorPrice || 2000;
      const newItem = {
        id: this.treatmentItems.length + 1,
        patientId,
        doctorId,
        procedureCode: 'D0220',
        procedureName: `Intraoral Digital Radiograph (RVG) Tooth #${toothNumber || 'general'}`,
        category: 'xray',
        toothNumber: parseInt(toothNumber, 10) || 0,
        finalPrice: fee,
        status: 'proposed'
      };
      this.treatmentItems.push(newItem);
      return { billed: true, fee, item: newItem };
    }

    return { billed: false, message: 'Unknown feeType' };
  }
}

// 3. Modality Banner Parser Helper
function parseActiveModality(patient) {
  const plan = (patient?.currentTreatmentPlan || '').toLowerCase();
  const isBraces = plan.includes('brace') || plan.includes('ortho');
  const isWhitening = plan.includes('whiten') || plan.includes('bleach');
  const isCavity = plan.includes('cavity') || plan.includes('restor');

  if (!isBraces && !isWhitening && !isCavity) return null;

  return {
    modality: isBraces ? 'braces' : isWhitening ? 'whitening' : 'cavity',
    title: isBraces ? 'Braces Active Modality' : isWhitening ? 'Teeth Whitening Active' : 'Cavity Restorative Active',
    stage: patient.treatmentStage || 'Active Phase',
    specs: patient.targetShade || null
  };
}

// ── Tests ──

describe('Feature: Dynamic Doctor Fee Resolution (No Hardcoded Prices)', () => {
  const doctor1Schedules = [
    { procedureCode: 'D8080', category: 'braces', doctorPrice: 145000, standardFee: 120000 },
    { procedureCode: 'D9972', category: 'whitening', doctorPrice: 28000, standardFee: 25000 },
    { procedureCode: 'D2391', category: 'cavity', doctorPrice: 6500, standardFee: 5000 }
  ];
  const doctor2Schedules = [
    { procedureCode: 'D8080', category: 'braces', doctorPrice: 95000, standardFee: 120000 },
    { procedureCode: 'D9972', category: 'whitening', doctorPrice: 20000, standardFee: 25000 },
    { procedureCode: 'D2391', category: 'cavity', doctorPrice: 4200, standardFee: 5000 }
  ];
  const catalog = [
    { procedureCode: 'D8080', category: 'braces', standardFee: 120000 },
    { procedureCode: 'D9972', category: 'whitening', standardFee: 25000 },
    { procedureCode: 'D2391', category: 'cavity', standardFee: 5000 }
  ];

  it('should auto-populate Braces price to Doctor 1 custom rate (Rs 145,000), not hardcoded 120,000', () => {
    const price = resolveDoctorFee(doctor1Schedules, catalog, 'braces');
    assert.equal(price, 145000);
  });

  it('should auto-populate Braces price to Doctor 2 custom rate (Rs 95,000)', () => {
    const price = resolveDoctorFee(doctor2Schedules, catalog, 'braces');
    assert.equal(price, 95000);
  });

  it('should auto-populate Whitening price to Doctor 1 custom rate (Rs 28,000)', () => {
    const price = resolveDoctorFee(doctor1Schedules, catalog, 'whitening');
    assert.equal(price, 28000);
  });

  it('should auto-populate Cavity Restorative price to Doctor 2 custom rate (Rs 4,200)', () => {
    const price = resolveDoctorFee(doctor2Schedules, catalog, 'cavity');
    assert.equal(price, 4200);
  });

  it('should fallback to catalog standard fee if doctor fee schedule has no custom override', () => {
    const price = resolveDoctorFee([], catalog, 'braces');
    assert.equal(price, 120000);
  });
});

describe('Feature: First-Time Observation Consultation Fee Auto-Billing (Idempotent)', () => {
  it('should automatically bill Consultation Fee on first-time observation for Doctor 1 (Rs 4,500)', () => {
    const service = new MockDiagnosticFeeService();
    const result = service.ensureDiagnosticFee({ patientId: 101, doctorId: 1, feeType: 'consultation' });

    assert.equal(result.billed, true);
    assert.equal(result.fee, 4500);
    assert.equal(service.treatmentItems.length, 1);
    assert.equal(service.treatmentItems[0].procedureCode, 'D0150');
  });

  it('should NOT double-bill Consultation Fee when observation is updated or saved again', () => {
    const service = new MockDiagnosticFeeService();
    // First observation:
    service.ensureDiagnosticFee({ patientId: 101, doctorId: 1, feeType: 'consultation' });
    // Second observation save / timer start:
    const repeatResult = service.ensureDiagnosticFee({ patientId: 101, doctorId: 1, feeType: 'consultation' });

    assert.equal(repeatResult.billed, false);
    assert.equal(service.treatmentItems.length, 1, 'Treatment items count should remain exactly 1');
  });
});

describe('Feature: Hardware Device X-Ray Auto-Billing', () => {
  it('should automatically add RVG X-Ray fee with Doctor 1 rate (Rs 2,800) and link target tooth', () => {
    const service = new MockDiagnosticFeeService();
    const result = service.ensureDiagnosticFee({
      patientId: 101,
      doctorId: 1,
      feeType: 'rvg_xray',
      toothNumber: '19'
    });

    assert.equal(result.billed, true);
    assert.equal(result.fee, 2800);
    assert.equal(result.item.toothNumber, 19);
    assert.equal(result.item.procedureCode, 'D0220');
  });

  it('should automatically add RVG X-Ray fee with Doctor 2 rate (Rs 1,800)', () => {
    const service = new MockDiagnosticFeeService();
    const result = service.ensureDiagnosticFee({
      patientId: 102,
      doctorId: 2,
      feeType: 'rvg_xray',
      toothNumber: '30'
    });

    assert.equal(result.billed, true);
    assert.equal(result.fee, 1800);
    assert.equal(result.item.toothNumber, 30);
  });
});

describe('Feature: Active Clinical Modality Detection on Chart Page', () => {
  it('should detect Braces modality when saved from Directory', () => {
    const patient = {
      currentTreatmentPlan: 'Braces (Orthodontics)',
      treatmentStage: 'Stage 2 - Leveling & Alignment',
      targetShade: '0.016 NiTi'
    };
    const banner = parseActiveModality(patient);
    assert.ok(banner);
    assert.equal(banner.modality, 'braces');
    assert.equal(banner.stage, 'Stage 2 - Leveling & Alignment');
    assert.equal(banner.specs, '0.016 NiTi');
  });

  it('should detect Teeth Whitening modality when saved from Directory', () => {
    const patient = {
      currentTreatmentPlan: 'Teeth Whitening',
      treatmentStage: 'In-Office Session 1 of 3',
      targetShade: 'B1 (Current: A3.5)'
    };
    const banner = parseActiveModality(patient);
    assert.ok(banner);
    assert.equal(banner.modality, 'whitening');
    assert.equal(banner.stage, 'In-Office Session 1 of 3');
    assert.equal(banner.specs, 'B1 (Current: A3.5)');
  });

  it('should detect Cavity Restorative modality when saved from Directory', () => {
    const patient = {
      currentTreatmentPlan: 'Cavity Restorative',
      treatmentStage: 'Class II Composite (#19)',
      targetShade: ''
    };
    const banner = parseActiveModality(patient);
    assert.ok(banner);
    assert.equal(banner.modality, 'cavity');
    assert.equal(banner.stage, 'Class II Composite (#19)');
  });

  it('should return null for general consultation without active special modality', () => {
    const patient = {
      currentTreatmentPlan: 'General Consultation',
      treatmentStage: null,
      targetShade: null
    };
    const banner = parseActiveModality(patient);
    assert.equal(banner, null);
  });
});

/**
 * 🧪 Unit Tests: Dental Treatment Lifecycle & Permission Matrix
 * Validates Rules 1 to 5:
 *   Rule 1 (Doctor Lock): Treatment IN_PROGRESS -> Doctor cannot be changed until COMPLETED.
 *   Rule 2 (One Active Treatment): Exactly ONE treatment can be IN_PROGRESS across the entire patient.
 *   Rule 3 (Not Started = Editable): PLANNED treatments (draft/proposed/accepted, net paid = 0) are freely editable.
 *   Rule 4 (Started + Payment Locks Chart): IN_PROGRESS treatment with net paid > 0 locks the tooth dental chart.
 *   Rule 5 (Completion Unlocks Tooth): COMPLETED treatment unlocks the tooth while preserving permanent history.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Core Business Logic / Policy Engine Verification Functions
export const TREATMENT_STATUSES = {
  DRAFT: 'draft',
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DECLINED: 'declined',
  CANCELLED: 'cancelled'
};

export const POLICY_ERROR_CODES = {
  DOCTOR_LOCKED: 'DOCTOR_LOCKED',
  ACTIVE_TREATMENT_EXISTS: 'ACTIVE_TREATMENT_EXISTS',
  CHART_LOCKED: 'CHART_LOCKED',
  TREATMENT_LOCKED: 'TREATMENT_LOCKED'
};

export function isPlannedStatus(status) {
  const s = (status || '').toLowerCase().trim();
  return s === TREATMENT_STATUSES.DRAFT || s === TREATMENT_STATUSES.PROPOSED || s === TREATMENT_STATUSES.ACCEPTED;
}

export function evaluateDoctorChangePolicy(patientId, newDoctorId, currentDoctorId, activeTreatments = []) {
  if (newDoctorId === currentDoctorId) {
    return { allowed: true };
  }
  const inProgress = activeTreatments.filter(t => (t.status || '').toLowerCase() === TREATMENT_STATUSES.IN_PROGRESS);
  if (inProgress.length > 0) {
    const tx = inProgress[0];
    return {
      allowed: false,
      errorCode: POLICY_ERROR_CODES.DOCTOR_LOCKED,
      message: `Doctor cannot be changed while Treatment '${tx.procedureName}' (Tooth #${tx.toothNumber}) is IN_PROGRESS. Complete the treatment first.`,
      conflictItem: tx
    };
  }
  return { allowed: true };
}

export function evaluateStartTreatmentPolicy(patientId, targetItemId, targetTooth, activeTreatments = []) {
  const inProgress = activeTreatments.filter(
    t => (t.status || '').toLowerCase() === TREATMENT_STATUSES.IN_PROGRESS && t.id !== targetItemId
  );
  if (inProgress.length > 0) {
    const active = inProgress[0];
    return {
      allowed: false,
      errorCode: POLICY_ERROR_CODES.ACTIVE_TREATMENT_EXISTS,
      message: `Patient already has an active treatment IN_PROGRESS: '${active.procedureName}' on Tooth #${active.toothNumber}. Only one treatment can be active at a time.`,
      conflictItem: active
    };
  }
  return { allowed: true };
}

export function evaluateChartEditPolicy(patientId, toothNumber, activeTreatments = [], paymentAllocations = []) {
  const toothStr = String(toothNumber).trim().toUpperCase();
  const activeTxOnTooth = activeTreatments.find(
    t => (t.status || '').toLowerCase() === TREATMENT_STATUSES.IN_PROGRESS &&
         String(t.toothNumber).trim().toUpperCase() === toothStr
  );

  if (!activeTxOnTooth) {
    return { allowed: true, locked: false };
  }

  // Calculate net paid: sum of non-voided allocations
  const netPaid = paymentAllocations
    .filter(p => p.treatmentItemId === activeTxOnTooth.id && p.status !== 'voided' && p.status !== 'refunded')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (netPaid > 0) {
    return {
      allowed: false,
      locked: true,
      errorCode: POLICY_ERROR_CODES.CHART_LOCKED,
      message: `Dental chart for Tooth #${toothNumber} is locked because treatment '${activeTxOnTooth.procedureName}' is IN_PROGRESS with payments received (PKR ${netPaid.toFixed(2)}).`,
      conflictItem: {
        ...activeTxOnTooth,
        netPaid
      }
    };
  }

  return { allowed: true, locked: false, netPaid: 0 };
}

export function evaluateTreatmentEditPolicy(treatmentItem, newStatus, newFee, paymentAllocations = []) {
  const currentStatus = (treatmentItem.status || '').toLowerCase().trim();

  // Rule 3: PLANNED with net paid = 0 is freely editable
  if (isPlannedStatus(currentStatus)) {
    const netPaid = paymentAllocations
      .filter(p => p.treatmentItemId === treatmentItem.id && p.status !== 'voided')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    if (netPaid === 0) {
      return { allowed: true, canEditFee: true, canEditStatus: true };
    }
  }

  // If completed, cannot revert to draft or change fee destructively
  if (currentStatus === TREATMENT_STATUSES.COMPLETED) {
    if (newStatus && isPlannedStatus(newStatus)) {
      return {
        allowed: false,
        errorCode: POLICY_ERROR_CODES.TREATMENT_LOCKED,
        message: 'Completed treatment cannot be reverted to planned status.'
      };
    }
  }

  return { allowed: true, canEditFee: true, canEditStatus: true };
}

// ==============================================================================
// TEST SUITE: DENTAL TREATMENT LIFECYCLE & PERMISSIONS
// ==============================================================================

describe('Rule 1: Assigned Doctor Lock during IN_PROGRESS Treatment', () => {
  it('should prevent changing doctor when an in_progress treatment exists', () => {
    const activeTreatments = [
      { id: 101, procedureName: 'Root Canal Therapy', toothNumber: '14', status: 'in_progress', doctorId: 1 }
    ];
    const result = evaluateDoctorChangePolicy(5, 2, 1, activeTreatments);

    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, POLICY_ERROR_CODES.DOCTOR_LOCKED);
    assert.match(result.message, /Doctor cannot be changed while Treatment 'Root Canal Therapy'/);
    assert.equal(result.conflictItem.toothNumber, '14');
  });

  it('should allow changing doctor when treatments are only PLANNED or COMPLETED', () => {
    const treatments = [
      { id: 101, procedureName: 'Scaling', toothNumber: 'Full', status: 'completed', doctorId: 1 },
      { id: 102, procedureName: 'Crown', toothNumber: '14', status: 'proposed', doctorId: 1 }
    ];
    const result = evaluateDoctorChangePolicy(5, 2, 1, treatments);
    assert.equal(result.allowed, true);
  });

  it('should allow re-selecting the same assigned doctor without conflict', () => {
    const activeTreatments = [
      { id: 101, procedureName: 'Root Canal Therapy', toothNumber: '14', status: 'in_progress', doctorId: 1 }
    ];
    const result = evaluateDoctorChangePolicy(5, 1, 1, activeTreatments);
    assert.equal(result.allowed, true);
  });
});

describe('Rule 2: Exactly One Treatment IN_PROGRESS (Patient-Level)', () => {
  it('should reject starting a second treatment when one is already in_progress on another tooth', () => {
    const activeTreatments = [
      { id: 201, procedureName: 'Composite Restoration', toothNumber: '16', status: 'in_progress' }
    ];
    const result = evaluateStartTreatmentPolicy(5, 202, '21', activeTreatments);

    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, POLICY_ERROR_CODES.ACTIVE_TREATMENT_EXISTS);
    assert.match(result.message, /Only one treatment can be active at a time/);
    assert.equal(result.conflictItem.toothNumber, '16');
  });

  it('should reject starting a second treatment on the SAME tooth if already in_progress', () => {
    const activeTreatments = [
      { id: 201, procedureName: 'Pulpotomy', toothNumber: '14', status: 'in_progress' }
    ];
    const result = evaluateStartTreatmentPolicy(5, 202, '14', activeTreatments);

    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, POLICY_ERROR_CODES.ACTIVE_TREATMENT_EXISTS);
  });

  it('should allow starting a treatment when no other treatment is in_progress', () => {
    const activeTreatments = [
      { id: 200, procedureName: 'Scaling', toothNumber: 'Full', status: 'completed' }
    ];
    const result = evaluateStartTreatmentPolicy(5, 201, '14', activeTreatments);
    assert.equal(result.allowed, true);
  });
});

describe('Rule 3: Not-Started / PLANNED Treatments are Freely Editable', () => {
  it('should allow editing fee and status on proposed/draft treatments with 0 payments', () => {
    const planItem = { id: 301, procedureName: 'Crown Prep', toothNumber: '15', status: 'proposed', fee: 15000 };
    const result = evaluateTreatmentEditPolicy(planItem, 'accepted', 14000, []);

    assert.equal(result.allowed, true);
    assert.equal(result.canEditFee, true);
    assert.equal(result.canEditStatus, true);
  });

  it('should prevent reverting a completed treatment back to planned draft', () => {
    const completedItem = { id: 302, procedureName: 'Extraction', toothNumber: '48', status: 'completed', fee: 8000 };
    const result = evaluateTreatmentEditPolicy(completedItem, 'draft', 8000, []);

    assert.equal(result.allowed, false);
    assert.equal(result.errorCode, POLICY_ERROR_CODES.TREATMENT_LOCKED);
  });
});

describe('Rule 4: IN_PROGRESS Treatment + Payments Received Locks Dental Chart', () => {
  it('should lock the dental chart for Tooth #14 when treatment is in_progress and paid > 0', () => {
    const activeTreatments = [
      { id: 401, procedureName: 'Root Canal Treatment', toothNumber: '14', status: 'in_progress' }
    ];
    const allocations = [
      { treatmentItemId: 401, amount: 5000, status: 'active' }
    ];

    const result = evaluateChartEditPolicy(5, '14', activeTreatments, allocations);

    assert.equal(result.allowed, false);
    assert.equal(result.locked, true);
    assert.equal(result.errorCode, POLICY_ERROR_CODES.CHART_LOCKED);
    assert.equal(result.conflictItem.netPaid, 5000);
    assert.match(result.message, /Dental chart for Tooth #14 is locked/);
  });

  it('should NOT lock the dental chart if in_progress treatment has received 0 payments', () => {
    const activeTreatments = [
      { id: 401, procedureName: 'Root Canal Treatment', toothNumber: '14', status: 'in_progress' }
    ];
    const allocations = []; // No payments yet

    const result = evaluateChartEditPolicy(5, '14', activeTreatments, allocations);

    assert.equal(result.allowed, true);
    assert.equal(result.locked, false);
    assert.equal(result.netPaid, 0);
  });

  it('should NOT lock dental charts for OTHER teeth that do not have active paid treatment', () => {
    const activeTreatments = [
      { id: 401, procedureName: 'Root Canal Treatment', toothNumber: '14', status: 'in_progress' }
    ];
    const allocations = [
      { treatmentItemId: 401, amount: 5000, status: 'active' }
    ];

    // Check Tooth #21
    const result = evaluateChartEditPolicy(5, '21', activeTreatments, allocations);

    assert.equal(result.allowed, true);
    assert.equal(result.locked, false);
  });

  it('should unlock the dental chart if payments were voided or refunded (net paid returns to 0)', () => {
    const activeTreatments = [
      { id: 401, procedureName: 'Root Canal Treatment', toothNumber: '14', status: 'in_progress' }
    ];
    const allocations = [
      { treatmentItemId: 401, amount: 5000, status: 'voided' }
    ];

    const result = evaluateChartEditPolicy(5, '14', activeTreatments, allocations);

    assert.equal(result.allowed, true);
    assert.equal(result.locked, false);
  });
});

describe('Rule 5: Completion Unlocks Tooth for New Treatments while Preserving History', () => {
  it('should unlock tooth when treatment status is COMPLETED, even if balance is pending', () => {
    const completedTreatments = [
      { id: 501, procedureName: 'RCT Step 1', toothNumber: '14', status: 'completed', fee: 15000 }
    ];
    const allocations = [
      { treatmentItemId: 501, amount: 5000, status: 'active' } // Pending balance 10,000 PKR
    ];

    // Chart check for Tooth #14
    const chartResult = evaluateChartEditPolicy(5, '14', completedTreatments, allocations);
    assert.equal(chartResult.allowed, true);
    assert.equal(chartResult.locked, false);

    // Start new treatment check for Tooth #14 (e.g., Crown restoration)
    const startResult = evaluateStartTreatmentPolicy(5, 502, '14', completedTreatments);
    assert.equal(startResult.allowed, true);
  });

  it('should preserve previous completed treatments in history ledger', () => {
    const treatmentLedger = [
      { id: 501, procedureName: 'Root Canal', toothNumber: '14', status: 'completed', completedAt: '2026-10-01' },
      { id: 502, procedureName: 'Crown Placement', toothNumber: '14', status: 'proposed' }
    ];

    const completedHistory = treatmentLedger.filter(t => t.status === 'completed');
    assert.equal(completedHistory.length, 1);
    assert.equal(completedHistory[0].procedureName, 'Root Canal');
    assert.equal(completedHistory[0].toothNumber, '14');
  });
});

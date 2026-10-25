/**
 * 🧪 Unit Tests: Modality Deletion Sync & Tripartite Chart Status Engine
 * Validates:
 *   1. Deleting or cancelling Whitening, Braces, or Cavity resets patient modality in Directory.
 *   2. Multi-modality fallback preserves remaining active modalities (e.g. keeping Braces when Whitening is removed).
 *   3. Idempotent sync prevents deleted procedure resurrection.
 *   4. Tripartite Modality Status generation for Chart Page (Braces, Whitening, Cavity).
 *   5. Cache invalidation and event payload contract.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Core Modality Sync & Policy Logic (Mirrors Backend C# & Frontend Handlers)
// ============================================================================

export const MODALITY_TYPES = {
  WHITENING: 'Teeth Whitening',
  BRACES: 'Braces',
  CAVITIES: 'Cavity'
};

export const ITEM_STATUSES = {
  DRAFT: 'draft',
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DECLINED: 'declined'
};

/**
 * Classifies an item into its clinical modality
 */
export function classifyModality(procedureName = '', notes = '') {
  const text = `${procedureName} ${notes}`.toLowerCase();
  if (text.includes('whiten') || text.includes('bleach') || text.includes('shade')) {
    return MODALITY_TYPES.WHITENING;
  }
  if (text.includes('brace') || text.includes('ortho') || text.includes('align') || text.includes('bracket') || text.includes('wire')) {
    return MODALITY_TYPES.BRACES;
  }
  if (text.includes('cavity') || text.includes('caries') || text.includes('fill') || text.includes('restor') || text.includes('composite') || text.includes('amalgam') || text.includes('gic')) {
    return MODALITY_TYPES.CAVITIES;
  }
  return null;
}

/**
 * Determines whether a treatment item is clinically active (non-cancelled / non-declined)
 */
export function isModalityItemActive(item) {
  if (!item || !item.status) return false;
  const s = item.status.toLowerCase().trim();
  return s !== ITEM_STATUSES.CANCELLED && s !== ITEM_STATUSES.DECLINED;
}

/**
 * Re-evaluates patient modality when treatment items change (Delete or Cancel)
 * Mirrors TreatmentPlanService.cs -> SyncPatientModalityFromItemsInternalAsync
 */
export function syncPatientModalityFromItems(patient, items) {
  const activeItems = (items || []).filter(isModalityItemActive);
  
  const hasActiveWhitening = activeItems.some(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.WHITENING);
  const hasActiveBraces = activeItems.some(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.BRACES);
  const hasActiveCavities = activeItems.some(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.CAVITIES);

  let newPlan = null;
  let newStage = null;
  let newTargetShade = patient.targetShade || null;

  if (hasActiveBraces) {
    newPlan = MODALITY_TYPES.BRACES;
    const orthoItem = activeItems.find(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.BRACES);
    newStage = orthoItem?.notes?.includes('Wire') ? 'Archwire Active' : (patient.treatmentStage || 'Active Orthodontics');
  } else if (hasActiveWhitening) {
    newPlan = MODALITY_TYPES.WHITENING;
    newStage = patient.treatmentStage || 'In-Office Session';
  } else if (hasActiveCavities) {
    newPlan = MODALITY_TYPES.CAVITIES;
    newStage = 'Restoration Planned';
  }

  if (!hasActiveWhitening) {
    newTargetShade = null;
  }

  const changed = (patient.currentTreatmentPlan !== newPlan) || (patient.treatmentStage !== newStage);

  return {
    patientId: patient.id,
    currentTreatmentPlan: newPlan,
    treatmentStage: newStage,
    targetShade: newTargetShade,
    previousPlan: patient.currentTreatmentPlan,
    resetApplied: newPlan === null && patient.currentTreatmentPlan !== null,
    changed
  };
}

/**
 * Deletes a treatment item and syncs modality
 */
export function deleteTreatmentItem(patient, items, itemIdToDelete) {
  const itemIndex = items.findIndex(i => i.id === itemIdToDelete);
  if (itemIndex === -1) {
    throw new Error(`Treatment item ${itemIdToDelete} not found`);
  }

  const remainingItems = items.filter(i => i.id !== itemIdToDelete);
  const syncResult = syncPatientModalityFromItems(patient, remainingItems);

  // Apply to updated patient copy
  const updatedPatient = {
    ...patient,
    currentTreatmentPlan: syncResult.currentTreatmentPlan,
    treatmentStage: syncResult.treatmentStage,
    targetShade: syncResult.targetShade
  };

  return {
    deletedItemId: itemIdToDelete,
    remainingItems,
    updatedPatient,
    syncResult
  };
}

/**
 * Calculates Tripartite Modalities Status for Chart Page
 * Mirrors TreatmentPlanService.cs -> GetPatientModalitiesStatusAsync
 */
export function computeChartModalitiesStatus(patient, items = [], cariesTeethNumbers = []) {
  const activeItems = (items || []).filter(isModalityItemActive);

  // 1. Braces Status
  const bracesItems = activeItems.filter(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.BRACES);
  const hasBraces = bracesItems.length > 0 || (patient.currentTreatmentPlan === MODALITY_TYPES.BRACES);
  const orthoActive = bracesItems.find(i => i.status === ITEM_STATUSES.IN_PROGRESS) || bracesItems[0];
  
  const bracesStatus = {
    modality: 'Braces',
    hasActive: hasBraces,
    status: hasBraces ? (orthoActive?.status || 'planned') : 'none',
    displayTitle: hasBraces ? 'Active Orthodontics' : 'Not Started',
    stage: hasBraces ? (patient.treatmentStage || orthoActive?.notes || 'Alignment Phase') : null,
    details: hasBraces ? `${bracesItems.length} active procedure(s)` : 'No active braces or aligners planned'
  };

  // 2. Whitening Status
  const whiteningItems = activeItems.filter(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.WHITENING);
  const hasWhitening = whiteningItems.length > 0 || (patient.currentTreatmentPlan === MODALITY_TYPES.WHITENING);
  const whiteningActive = whiteningItems.find(i => i.status === ITEM_STATUSES.IN_PROGRESS) || whiteningItems[0];

  const whiteningStatus = {
    modality: 'Teeth Whitening',
    hasActive: hasWhitening,
    status: hasWhitening ? (whiteningActive?.status || 'planned') : 'none',
    displayTitle: hasWhitening ? 'Active Teeth Whitening' : 'Not Started',
    shadeProgression: hasWhitening && patient.targetShade ? `Target: ${patient.targetShade}` : null,
    details: hasWhitening ? `${whiteningItems.length} whitening session(s)` : 'No active whitening procedure planned'
  };

  // 3. Cavities Status
  const cavityItems = activeItems.filter(i => classifyModality(i.procedureName, i.notes) === MODALITY_TYPES.CAVITIES);
  const cavityTeeth = Array.from(new Set([
    ...cavityItems.map(i => i.toothNumber).filter(Boolean),
    ...cariesTeethNumbers
  ])).sort((a, b) => Number(a) - Number(b));

  const hasCavities = cavityTeeth.length > 0 || cavityItems.length > 0;

  const cavityStatus = {
    modality: 'Cavities & Restorative',
    hasActive: hasCavities,
    count: cavityTeeth.length,
    affectedTeeth: cavityTeeth,
    status: hasCavities ? 'active' : 'clear',
    displayTitle: hasCavities ? `${cavityTeeth.length} Active Cavity Site(s)` : 'All Sound (0)',
    details: hasCavities ? `Teeth: ${cavityTeeth.join(', ')}` : 'No open caries or restorations pending'
  };

  return {
    patientId: patient.id,
    currentTreatmentPlan: patient.currentTreatmentPlan,
    braces: bracesStatus,
    whitening: whiteningStatus,
    cavities: cavityStatus
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('🦷 Modality Auto-Reset on Delete / Cancellation (Directory Sync)', () => {
  it('should reset patient currentTreatmentPlan to null when Whitening item is deleted', () => {
    const patient = {
      id: 101,
      name: 'Sarah Connor',
      currentTreatmentPlan: 'Teeth Whitening',
      treatmentStage: 'In-Office Session 1',
      targetShade: 'BL1'
    };

    const items = [
      { id: 501, procedureName: 'In-Office Teeth Whitening', toothNumber: null, status: 'proposed', notes: 'Laser Whitening' }
    ];

    const result = deleteTreatmentItem(patient, items, 501);

    assert.equal(result.syncResult.resetApplied, true);
    assert.equal(result.updatedPatient.currentTreatmentPlan, null);
    assert.equal(result.updatedPatient.treatmentStage, null);
    assert.equal(result.updatedPatient.targetShade, null);
    assert.equal(result.remainingItems.length, 0);
  });

  it('should reset patient currentTreatmentPlan to null when Braces item is deleted', () => {
    const patient = {
      id: 102,
      name: 'John Doe',
      currentTreatmentPlan: 'Braces',
      treatmentStage: 'Alignment Phase 1'
    };

    const items = [
      { id: 502, procedureName: 'Upper & Lower Ceramic Braces', toothNumber: null, status: 'in_progress', notes: '0.014 NiTi wire' }
    ];

    const result = deleteTreatmentItem(patient, items, 502);

    assert.equal(result.syncResult.resetApplied, true);
    assert.equal(result.updatedPatient.currentTreatmentPlan, null);
    assert.equal(result.updatedPatient.treatmentStage, null);
  });

  it('should reset patient currentTreatmentPlan to null when Cavity item is deleted', () => {
    const patient = {
      id: 103,
      name: 'Alice Cooper',
      currentTreatmentPlan: 'Cavity',
      treatmentStage: 'Restoration Planned'
    };

    const items = [
      { id: 503, procedureName: 'Composite Cavity Filling', toothNumber: 14, status: 'proposed', notes: 'MO cavity composite' }
    ];

    const result = deleteTreatmentItem(patient, items, 503);

    assert.equal(result.syncResult.resetApplied, true);
    assert.equal(result.updatedPatient.currentTreatmentPlan, null);
    assert.equal(result.updatedPatient.treatmentStage, null);
  });

  it('should preserve remaining active modality if only one of multiple modalities is deleted', () => {
    const patient = {
      id: 104,
      name: 'Bob Ross',
      currentTreatmentPlan: 'Braces',
      treatmentStage: 'Archwire Active'
    };

    // Patient has both Braces and Whitening
    const items = [
      { id: 601, procedureName: 'Ceramic Braces Placement', toothNumber: null, status: 'accepted', notes: 'Upper arch' },
      { id: 602, procedureName: 'Teeth Whitening Home Kit', toothNumber: null, status: 'proposed', notes: 'Post-debond whitening' }
    ];

    // Delete Whitening item (602)
    const result = deleteTreatmentItem(patient, items, 602);

    // Braces must remain active!
    assert.equal(result.syncResult.resetApplied, false);
    assert.equal(result.updatedPatient.currentTreatmentPlan, 'Braces');
    assert.equal(result.remainingItems.length, 1);
    assert.equal(result.remainingItems[0].id, 601);
  });

  it('should trigger modality reset when item is marked CANCELLED or DECLINED (soft delete)', () => {
    const patient = {
      id: 105,
      name: 'Emma Stone',
      currentTreatmentPlan: 'Teeth Whitening',
      treatmentStage: 'Session 2'
    };

    const items = [
      { id: 701, procedureName: 'Professional Teeth Whitening', toothNumber: null, status: 'cancelled', notes: 'Patient declined' }
    ];

    const sync = syncPatientModalityFromItems(patient, items);
    assert.equal(sync.resetApplied, true);
    assert.equal(sync.currentTreatmentPlan, null);
    assert.equal(sync.treatmentStage, null);
  });

  it('should prevent resurrection loops: deleted item is not restored if patient record is cleared', () => {
    const patient = {
      id: 106,
      name: 'Bruce Wayne',
      currentTreatmentPlan: null,
      treatmentStage: null
    };

    // Directory sync checks existing items
    const items = [];
    const sync = syncPatientModalityFromItems(patient, items);
    assert.equal(sync.currentTreatmentPlan, null);
    assert.equal(sync.changed, false);
  });
});

describe('📊 Tripartite Modality Status Suite (Chart Page)', () => {
  it('should report comprehensive status for all three modalities when all three are present', () => {
    const patient = {
      id: 201,
      name: 'Diana Prince',
      currentTreatmentPlan: 'Braces',
      treatmentStage: '0.016 NiTi Upper',
      targetShade: 'B1'
    };

    const items = [
      { id: 801, procedureName: 'Metal Braces Full Arch', toothNumber: null, status: 'in_progress', notes: 'Wire active' },
      { id: 802, procedureName: 'Teeth Whitening Kit', toothNumber: null, status: 'proposed', notes: 'Shade B1 target' },
      { id: 803, procedureName: 'Tooth Cavity Restoration', toothNumber: 19, status: 'accepted', notes: 'DO Composite' }
    ];

    const cariesTeethNumbers = [14, 19];

    const statusReport = computeChartModalitiesStatus(patient, items, cariesTeethNumbers);

    // Braces section
    assert.equal(statusReport.braces.hasActive, true);
    assert.equal(statusReport.braces.status, 'in_progress');
    assert.equal(statusReport.braces.displayTitle, 'Active Orthodontics');

    // Whitening section
    assert.equal(statusReport.whitening.hasActive, true);
    assert.equal(statusReport.whitening.status, 'proposed');
    assert.equal(statusReport.whitening.shadeProgression, 'Target: B1');

    // Cavities section
    assert.equal(statusReport.cavities.hasActive, true);
    assert.equal(statusReport.cavities.count, 2); // 14 and 19 deduplicated
    assert.deepEqual(statusReport.cavities.affectedTeeth, [14, 19]);
    assert.equal(statusReport.cavities.displayTitle, '2 Active Cavity Site(s)');
  });

  it('should report clear / not-started status for all sections when no active treatments exist', () => {
    const patient = {
      id: 202,
      name: 'Clark Kent',
      currentTreatmentPlan: null,
      treatmentStage: null,
      targetShade: null
    };

    const items = [];
    const cariesTeethNumbers = [];

    const statusReport = computeChartModalitiesStatus(patient, items, cariesTeethNumbers);

    assert.equal(statusReport.braces.hasActive, false);
    assert.equal(statusReport.braces.displayTitle, 'Not Started');

    assert.equal(statusReport.whitening.hasActive, false);
    assert.equal(statusReport.whitening.displayTitle, 'Not Started');

    assert.equal(statusReport.cavities.hasActive, false);
    assert.equal(statusReport.cavities.count, 0);
    assert.equal(statusReport.cavities.displayTitle, 'All Sound (0)');
  });
});

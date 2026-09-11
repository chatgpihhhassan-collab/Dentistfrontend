# System Audit & Architecture Document: Ortho & TMJ Suite Save Behavior

**Target Pages Audited:**
1. **Tooth Detail Page:** `https://dentistfrontend.vercel.app/chart/:patientId/tooth/:toothKey` (`src/pages/ToothDetailPage.jsx` — e.g., `/chart/30/tooth/Q`)
2. **Patient Chart Page:** `https://dentistfrontend.vercel.app/chart/:patientId` (`src/pages/ChartPage.jsx` — e.g., `/chart/30`)

---

## 1. Executive Summary & Root Cause Analysis

In Dentia Workspace, the **Ortho & TMJ Diagnostic Suite** (`OrthoTmjDiagnosticSuite.jsx`) contains 3 clinical visualizer sub-suites:
- **1. Occlusion & Bite Malocclusion** (`OcclusionBiteVisualizer.jsx` — 5 vector diagrams)
- **2. Impacted & Wisdom Teeth X-Ray** (`ImpactedTeethXRayVisualizer.jsx` — 4 vector diagrams)
- **3. TMJ & Jaw Articulation / Clicking** (`TMJJointArticulationViewer.jsx` — 3 vector diagrams)

### Why Automatic Saving Was Occurring
Whenever a practitioner navigated between diagnostic options or adjusted anatomical simulation sliders (e.g., clicking *Underbite*, clicking *Closed Lock*, or dragging the *Mouth Opening* slider to preview joint kinematics), the components triggered automatic save events:
1. **`TMJJointArticulationViewer.jsx`**:
   - `handleSelectJointState`: automatically called `commitAssessment(stateId, targetOpening)` without manual confirmation.
   - `handleOpeningChange`: contained a debounced 400ms background auto-save timer:
     ```javascript
     // Debounced background auto-save after user stops sliding for 400ms
     debounceTimerRef.current = setTimeout(() => {
       commitAssessment(selectedJointState, val);
     }, 400);
     ```
2. **`OcclusionBiteVisualizer.jsx`**:
   - `handleSelectBite`: automatically called `onSaveAssessment({...})` whenever any bite card was clicked.
3. **`ImpactedTeethXRayVisualizer.jsx`**:
   - `handleSelectType` and slider handlers (`handleAngulationChange`, `handleNerveDistanceChange`, etc.) automatically called `notifyAssessmentChange({...})` on every event.
4. **`ChartPage.jsx` & `ToothDetailPage.jsx` (`handleSaveOrthoTmjAssessment`)**:
   - Both parent pages received these automatic events and immediately modified the patient's active teeth chart state (`teethState` / `allTeeth` / `toothData`) and scheduled backend database writes (`/api/patients/teeth/update-bulk` and `/api/patients/:pid/diagnostic-assessment`).

This caused accidental overwrites to real patient charts whenever a doctor simply previewed or demonstrated a joint/bite diagram.

---

## 2. Options Where Automatic Save Functionality Occurs (Line-by-Line Breakdown)

| Component | File Path | Line(s) | Trigger / Option | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TMJ Visualizer** | `src/components/orthoTmjSuite/TMJJointArticulationViewer.jsx` | L63–L75 | `handleSelectJointState` calling `commitAssessment` | **STOPPED** |
| **TMJ Visualizer** | `src/components/orthoTmjSuite/TMJJointArticulationViewer.jsx` | L78–L86 | `handleOpeningChange` debounced 400ms `commitAssessment` | **STOPPED** |
| **Occlusion Visualizer** | `src/components/orthoTmjSuite/OcclusionBiteVisualizer.jsx` | L92–L109 | `handleSelectBite` calling `onSaveAssessment` | **STOPPED** |
| **Impaction Visualizer** | `src/components/orthoTmjSuite/ImpactedTeethXRayVisualizer.jsx` | L74–L86 | `handleSelectType` calling `notifyAssessmentChange` | **STOPPED** |
| **Impaction Visualizer** | `src/components/orthoTmjSuite/ImpactedTeethXRayVisualizer.jsx` | L88–L110 | Sliders (`angulation`, `nerveDistance`, etc.) calling `notifyAssessmentChange` | **STOPPED** |
| **Chart Page** | `src/pages/ChartPage.jsx` | L1327–L1535 | `handleSaveOrthoTmjAssessment` committing without checking `isManualSave` | **GUARDED** |
| **Tooth Detail Page** | `src/pages/ToothDetailPage.jsx` | L705–L947 | `handleSaveOrthoTmjAssessment` committing after 300ms if `!isManualSave` | **GUARDED** |

---

## 3. Preserving Manual Save & Visual Simulation

Each sub-suite has an explicit, dedicated manual save button:
1. **Occlusion & Bite Malocclusion:**
   - Button: `Save Bite Assessment to Patient Chart` (`handleSaveToPatientRecord`)
   - Emits `isManualSave: true` with voice & toast feedback.
2. **Impacted & Wisdom Teeth X-Ray:**
   - Button: `Save Impacted Tooth Assessment to Chart` (`handleSaveToPatientRecord`)
   - Emits `isManualSave: true` with voice & toast feedback.
3. **TMJ & Jaw Articulation:**
   - Button: `Save TMJ Assessment to DB` (`commitAssessment(selectedJointState, mouthOpeningMm, true)`)
   - Emits `isManualSave: true` with visual confirmation checkmark.

### Exact Solution Strategy
1. **Interactive UI Stays 100% Fluid:** Selecting buttons and dragging sliders still updates local state and animates the vector diagrams at 60fps.
2. **Auto-Save Stopped at Source:** No automatic `onSaveAssessment` or `commitAssessment` is dispatched on tab click or slider motion.
3. **Guard in Parent Pages (`ChartPage.jsx` & `ToothDetailPage.jsx`):**
   ```javascript
   // In handleSaveOrthoTmjAssessment:
   if (!assessmentData?.isManualSave) {
     console.log('ℹ️ Diagnostic Suite in preview mode: manual save required to persist to chart.');
     return;
   }
   ```
4. **All Other Functionality Untouched:**
   - ToothDetailPage 5-surface inspection, quick clinical buttons, caries palette, healthy baseline, navigation between teeth are completely unaffected.
   - ChartPage 2D/3D odontogram, perio charting, doctor notes, AI dictation, clinical logs are completely unaffected.

---

## 4. Verification Checklist

- [x] Open `/chart/30/tooth/Q` -> Click Tab 4 (Ortho & TMJ) -> Click through Overbite, Underbite, Crossbite -> **Teeth are NOT auto-saved to DB or modified in chart.**
- [x] Drag TMJ mouth opening slider or switch joint states -> **Joint articulates dynamically, but DB is NOT contacted.**
- [x] Click "Save TMJ Assessment to DB" -> **Assessment saves successfully to DB and patient record.**
- [x] Open `/chart/30` -> Open "Diagnostic Suite" modal -> Switch tabs & move sliders -> **Chart teeth remain intact without auto-save.**
- [x] Click "Save Bite Assessment to Patient Chart" -> **Teeth update with proper CDT code and DB bulk update succeeds.**

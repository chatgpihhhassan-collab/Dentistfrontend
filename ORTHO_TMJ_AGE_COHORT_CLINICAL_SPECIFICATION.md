# 🦷 Ortho & TMJ Diagnostic Suite: Clinical Age-Cohort Specification & Guidelines

**Document Version:** 1.0.0  
**Clinical Standards:** ADA (American Dental Association), AAO (American Association of Orthodontists), AAPD (American Academy of Pediatric Dentistry)  
**System Targets:** `OrthoTmjDiagnosticSuite.jsx`, `ToothDetailPage.jsx`, `ChartPage.jsx`

---

## 1. Executive Summary

This specification addresses the clinical necessity, diagnostic scope, and interface behavior of the **Ortho & TMJ Diagnostic Suite** across all patient age brackets.

### Core Question:
> **Is the Ortho & TMJ Suite tab required for every age?**

### Definitive Clinical Verdict:
**No, the Ortho & TMJ Suite is NOT required in an identical format for every age.**
- **Toddlers & Young Children (Ages 0–6 / Primary Teeth A–T):** Wisdom teeth (3rd molars #1, #16, #17, #32) and permanent canines do not exist; showing surgical wisdom impaction X-rays on a 3-year-old is clinically invalid. However, early non-nutritive habit assessment (thumb/pacifier anterior open bites, posterior crossbites) is clinically relevant.
- **Children in Mixed Dentition (Ages 7–11):** Interceptive orthodontic screening is mandated by the AAO starting at **age 7** (palatal expansion, space management). Wisdom teeth are still uncalcified or developing in crypts.
- **Teens & Young Adults (Ages 12–25):** **100% Mandatory & Prime Target Cohort.** Peak incidence of comprehensive orthodontic treatment (braces/clear aligners), wisdom teeth impactions (mesioangular, horizontal), and TMJ internal derangement (clicking).
- **Adults & Geriatric (Ages 26–65+):** **High Clinical Priority for Occlusion & TMJ.** Focus shifts to occlusal wear facets (attrition/erosion), collapsed bite from missing molars, and chronic TMD (clicking, closed lock, osteoarthritis).

---

## 2. Clinical Matrix by Age Bracket

| Age Cohort | Dentition Stage | Occlusion / Bite Scope | Impaction (Wisdom Teeth) Scope | TMJ & Joint Scope | Suite Tab Necessity & Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0 – 6 Years**<br>*(Toddler / Early Child)* | **Primary (Deciduous)<br>20 Teeth (A–T)** | **Habit Assessment:**<br>• Pacifier / thumb sucking<br>• Anterior open bite<br>• Posterior crossbite<br>• Terminal plane (flush/mesial) | **0% Inapplicable:**<br>• 3rd molar tooth buds do not calcify until ages 8–10.<br>• No permanent impactions. | **< 1% Rare:**<br>• Articular disc displacement is virtually non-existent in toddlers. | **Adaptive Mode:**<br>Label: `Ortho & Habits`<br>Title: `Pediatric Occlusion & Early Habits Suite`<br>*(Impactions tab displays pediatric informational notice)* |
| **7 – 11 Years**<br>*(Early Mixed)* | **Mixed Dentition**<br>(Exfoliating A–T, erupting permanent) | **Interceptive Ortho:**<br>• AAO Age 7 screening<br>• Rapid palatal expansion<br>• Skeletal Class II / III interception<br>• Space maintainers | **Low / Screening:**<br>• Maxillary canine palpation at age 9–10.<br>• Wisdom teeth forming in crypts. | **Low (< 5%):**<br>• Mild bruxism / clenching. | **Active Mode:**<br>Label: `Ortho & TMJ Suite`<br>Title: `Mixed Dentition Orthodontic Screening Suite` |
| **12 – 25 Years**<br>*(Teens & Young Adults)* | **Permanent Dentition<br>32 Teeth (1–32)** | **Full Orthodontics:**<br>• Fixed appliances (braces)<br>• Clear aligners<br>• Deep bite / underbite leveling | **CRITICAL (Peak Phase):**<br>• 3rd molar impactions (#1, 16, 17, 32)<br>• Mesioangular & horizontal angulation<br>• Nerve canal proximity<br>• Impacted canines (#6, 11) | **HIGH (Peak Phase):**<br>• Anterior disc displacement with reduction (clicking)<br>• Reciprocal click<br>• Stress clenching | **FULL ACTIVE SUITE (Original Baseline):**<br>Label: `Ortho & TMJ Suite`<br>Title: `Teens & Young Adults (12–25 Yrs) Diagnostic Suite`<br>*(All 12 vector diagrams active)* |
| **26 – 65+ Years**<br>*(Adults & Seniors)* | **Permanent / Restored / Edentulous** | **Adult Ortho & Wear:**<br>• Occlusal wear facets (attrition)<br>• Bite collapse / loss of VDO<br>• Pre-implant uprighting | **Moderate:**<br>• Often previously extracted.<br>• Deep bony retention or ankylosis. | **VERY HIGH (Peak TMD):**<br>• Chronic TMJ clicking<br>• Closed lock (disc without reduction)<br>• Restricted opening (<30mm)<br>• Occlusal splints / nightguards | **Active Adult Mode:**<br>Label: `Ortho & TMJ Suite`<br>Title: `Adult Occlusion, Wear & TMJ Suite (26+ Yrs)` |

---

## 3. UI/UX Architectural Implementation

### 3.1. Dynamic Banner & Cohort Intelligence (`OrthoTmjDiagnosticSuite.jsx`)
Instead of hardcoding `"Teens & Young Adults (12–25 Yrs) Diagnostic Suite"` for all patients, the suite dynamically inspects `patientAge` and `patient.dentitionMode`:

```javascript
// Dynamic Cohort Determination
const isPediatric = (patientAge !== null && patientAge < 7) || patient?.dentitionMode === 'pediatric';
const isTeenCohort = patientAge !== null && patientAge >= 7 && patientAge <= 25;
const isAdultCohort = patientAge !== null && patientAge > 25;

// Dynamic Banner Headers
// 1. Pediatric (0-6): "Pediatric Occlusion & Early Habits Suite (Ages 0–6)"
// 2. Teen/Young Adult (7-25): "Teens & Young Adults (7–25 Yrs) Diagnostic Suite"
// 3. Adult (26+): "Adult Occlusion, Wear & TMJ Diagnostic Suite (26+ Yrs)"
```

### 3.2. Pediatric Safeguard on Impactions Sub-Tab
When a clinician inspects a pediatric patient (`< 7` years / Primary `A–T`):
1. The **Occlusion** sub-tab focuses on non-nutritive sucking habits, anterior open bites, and crossbites.
2. The **Impactions** sub-tab gracefully presents an educational clinical banner:
   > ℹ️ **Pediatric Primary Dentition Notice**:  
   > *Wisdom teeth (3rd molars #1, #16, #17, #32) and permanent canines are not present in primary deciduous dentition. Permanent 3rd molar tooth buds begin calcification between ages 8–10. Canine impaction screening is recommended starting at age 9.*
   Clinicians can still toggle the diagrams if educating parents on future dental development.

### 3.3. Responsive Segmented Dock Tab Label (`ToothDetailPage.jsx`)
In the tooth detail navigation dock:
- **Pediatric Patients:** Tab is labeled **`Ortho & Habits`** with Sparkles icon.
- **Adult & Adolescent Patients:** Tab is labeled **`Ortho & TMJ Suite`**.

---

## 4. ADA & CDT Coding Correlation

| Clinical Finding | Applicable Ages | Recommended CDT Code | Procedure Description |
| :--- | :--- | :--- | :--- |
| Early Habit Sucking / Anterior Open Bite | Ages 3–8 | **D8210 / D8220** | Removable / fixed appliance therapy for habit control |
| Comprehensive Orthodontic Evaluation | Ages 7+ | **D8070 / D8080** | Comprehensive orthodontic treatment of transitional / adolescent dentition |
| Adult Orthodontic Realignment | Ages 26+ | **D8090** | Comprehensive orthodontic treatment of adult dentition |
| Impacted Wisdom Tooth Extraction (Soft Tissue) | Ages 16–25 | **D7220** | Removal of impacted tooth – soft tissue |
| Impacted Wisdom Tooth Extraction (Partial Bony) | Ages 16–25 | **D7230** | Removal of impacted tooth – partially bony |
| Impacted Wisdom Tooth Extraction (Complete Bony) | Ages 16–30 | **D7240** | Removal of impacted tooth – completely bony |
| TMJ Occlusal Guard (Bruxism / Clenching) | Ages 14+ | **D9944** | Occlusal guard – hard appliance, full arch |
| TMJ Diagnostic Joint Evaluation | All Ages | **D0140 / D7880** | Limited clinical evaluation / Occlusal orthotic appliance |

---

## 5. Summary of System Benefits

1. **Eliminates Clinician Confusion**: Doctors examining toddlers are no longer confronted with contradictory "Teens (12–25 Yrs) Wisdom Tooth" banners.
2. **Maintains Complete Clinical Utility**: Occlusal and TMJ assessments remain available for pediatric habit screening and adult TMJ/wear facet management.
3. **Age-Aware Intelligence**: Enhances Dentia's standing as a world-class, context-aware EHR clinical copilot.

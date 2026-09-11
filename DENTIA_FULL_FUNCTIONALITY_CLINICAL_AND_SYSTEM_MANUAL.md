# 🦷 DENTIA — Complete Clinical Functionality, Categories, Procedures & System Manual

---

## 📑 Table of Contents
1. [Executive Functional Overview](#1-executive-functional-overview)
2. [Dentition Systems & Anatomical Mapping](#2-dentition-systems--anatomical-mapping)
3. [Master Clinical Specialties & Categories](#3-master-clinical-specialties--categories)
4. [Dentist Actions, Clinical Procedures & CDT Codes](#4-dentist-actions-clinical-procedures--cdt-codes)
5. [Page-by-Page & Module-by-Module Functional Deep Dive](#5-page-by-page--module-by-module-functional-deep-dive)
   - [5.1 Patient Master Directory & Clinical Console (`/directory`)](#51-patient-master-directory--clinical-console-directory)
   - [5.2 Interactive Odontogram Chart Workspace (`/chart/:patientId`)](#52-interactive-odontogram-chart-workspace-chartpatientid)
   - [5.3 3D Microscopic Tooth Detail & Surface Inspector (`/chart/:patientId/tooth/:toothKey`)](#53-3d-microscopic-tooth-detail--surface-inspector-chartpatientidtoothtoothkey)
   - [5.4 Ortho, Impactions & TMJ Diagnostic Suite](#54-ortho-impactions--tmj-diagnostic-suite)
   - [5.5 Smart AI Patient Intake & Registration (`/new-patient`)](#55-smart-ai-patient-intake--registration-new-patient)
   - [5.6 Operatory Appointment Scheduling & Calendar (`/appointments` & `/book`)](#56-operatory-appointment-scheduling--calendar-appointments--book)
   - [5.7 Ambient AI Voice Clinical Scribe & SOAP Notes (`/ai-notes`)](#57-ambient-ai-voice-clinical-scribe--soap-notes-ai-notes)
   - [5.8 Radiology & High-Definition Dental X-Ray Viewer](#58-radiology--high-definition-dental-x-ray-viewer)
   - [5.9 Electronic Prescriptions & Medication Engine](#59-electronic-prescriptions--medication-engine)
   - [5.10 Official Patient Dental Odontogram PDF Report & Printing](#510-official-patient-dental-odontogram-pdf-report--printing)
   - [5.11 Practice Analytics & Public Portal (`/` & `/dashboard`)](#511-practice-analytics--public-portal--dashboard)
   - [5.12 Doctor & Staff Administration (`/admin/doctors`)](#512-doctor--staff-administration-admindoctors)
6. [Clinical Decision Support, Pharmacology & Safety Protocols](#6-clinical-decision-support-pharmacology--safety-protocols)
7. [Comprehensive Procedures & Functionality Matrix](#7-comprehensive-procedures--functionality-matrix)

---

# 1. Executive Functional Overview

**Dentia** is an enterprise-grade Dental Electronic Health Record (EHR), Practice Management System (PMS), and Clinical Decision Support Platform. Designed specifically for practicing dentists, dental hygienists, oral surgeons, orthodontists, and dental clinic managers, Dentia integrates:

* **Dual-Jaw 3D & 2D Odontogram Charting**: Real-time visualization and condition charting for both permanent adult (Teeth 1–32) and deciduous pediatric (Teeth A–T) dentitions.
* **Microscopic 5-Surface Tooth Restoration Engine**: Precise anatomical mapping across Occlusal/Incisal (O/I), Mesial (M), Distal (D), Buccal/Facial (B/F), and Lingual/Palatal (L/P) surfaces.
* **Full-Scope Clinical Specialty Suites**: Dedicated modules for Restorative, Endodontics, Periodontics, Oral Surgery, Orthodontics, Temporomandibular Joint (TMJ) disorders, Pediatric dentistry, and Cosmetic shade matching.
* **Ambient AI Dental Scribe**: Real-time voice dictation that autonomously parses operator speech, charts anatomical surfaces, populates CDT billing codes, and generates 8-section SOAP clinical consultation notes.
* **Smart Intake & Duplication Prevention**: Multi-modal patient registration with automated age calculation, dentition auto-detection, and sibling/family phone sharing exceptions.
* **Electronic Prescribing (e-Rx) & Radiography**: Complete pharmacology generator with allergy cross-referencing and high-definition X-ray inspection tools.
* **One-Click Official PDF Treatment Reports**: ADA/FDI compliant patient clinical dossiers ready for printing and insurance claims.

---

# 2. Dentition Systems & Anatomical Mapping

Dentia supports all stages of human dental development with complete anatomical precision:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DENTIA DENTITION ARCHITECTURE                                  │
├──────────────────────────────────────┬───────────────────────────────────────────────────────────┤
│ 🦷 Adult Permanent Dentition (32)    │ Universal Numbers: 1 to 32 | FDI Two-Digit: 11 to 48     │
│ 👶 Pediatric Primary Dentition (20)  │ Universal Letters: A to T  | FDI Two-Digit: 51 to 85     │
│ 🔄 Mixed Dentition Protocol (Ages 6–12)│ Co-existence of primary milk teeth & permanent successors │
└──────────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

### 1. Adult Permanent Arch (32 Teeth)
* **Maxillary Upper Arch (Teeth 1–16)**:
  * *Quadrant 1 (Upper Right)*: Tooth #1 (3rd Molar/Wisdom) to Tooth #8 (Central Incisor).
  * *Quadrant 2 (Upper Left)*: Tooth #9 (Central Incisor) to Tooth #16 (3rd Molar/Wisdom).
* **Mandibular Lower Arch (Teeth 17–32)**:
  * *Quadrant 3 (Lower Left)*: Tooth #17 (3rd Molar/Wisdom) to Tooth #24 (Central Incisor).
  * *Quadrant 4 (Lower Right)*: Tooth #25 (Central Incisor) to Tooth #32 (3rd Molar/Wisdom).

### 2. Pediatric Deciduous Arch (20 Teeth)
* **Maxillary Primary Arch (Teeth A–J)**:
  * *Primary Upper Right*: Tooth A (2nd Molar), B (1st Molar), C (Canine), D (Lateral Incisor), E (Central Incisor).
  * *Primary Upper Left*: Tooth F (Central Incisor), G (Lateral Incisor), H (Canine), I (1st Molar), J (2nd Molar).
* **Mandibular Primary Arch (Teeth K–T)**:
  * *Primary Lower Left*: Tooth K (2nd Molar), L (1st Molar), M (Canine), N (Lateral Incisor), O (Central Incisor).
  * *Primary Lower Right*: Tooth P (Central Incisor), Q (Lateral Incisor), R (Canine), S (1st Molar), T (2nd Molar).

### 3. Numbering System Toggles
* **Universal Numbering System (ADA)**: 1–32 (Adults) and A–T (Pediatric) — standard in North America.
* **FDI World Dental Federation Two-Digit System**: Quadrant prefix + Tooth digit (e.g., Tooth #3 = FDI 16; Tooth #19 = FDI 36; Tooth A = FDI 55) — international standard.
* Dentists can toggle between Universal and FDI notations instantly across the entire interface.

### 4. 5 Anatomical Surface Breakdown (MODBL)
Every tooth allows multi-surface diagnostics and restorations:
* **O / I (Occlusal / Incisal)**: Masticatory biting table of posterior molars/premolars, or cutting edge of incisors.
* **M (Mesial)**: Proximal surface oriented toward the dental arch midline.
* **D (Distal)**: Proximal surface oriented away from the dental arch midline.
* **B / F (Buccal / Facial)**: Outer surface facing the cheek or lips.
* **L / P (Lingual / Palatal)**: Inner surface facing the tongue (mandible) or hard palate (maxilla).
* **Cervical / Root Zone**: Gingival margin and radicular surface.

---

# 3. Master Clinical Specialties & Categories

Dentia categorizes all dental procedures and diagnoses into 15 specialized clinical categories:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MASTER CLINICAL SPECIALTY TAXONOMY                                 │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│ 🛠️ 1. Restorative & Operative │ ⚡ 2. Endodontics (Pulp & Root)  │ 🩺 3. Oral & Maxillofacial    │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ 🔬 4. Pathology & Caries      │ 🌿 5. Periodontics (Gums & Bone) │ 📐 6. Orthodontics & Bite     │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ 🦴 7. TMJ & Jaw Articulation  │ 👶 8. Pediatric Dentistry        │ ✨ 9. Cosmetic & Esthetic     │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ 👑 10. Prosthodontics (Crowns)│ 🔩 11. Implantology & Grafting   │ 🌙 12. Bruxism & Nightguards  │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ 🩻 13. Impactions & Wisdom    │ ❄️ 14. Hypersensitivity (NCCL)   │ 📷 15. Radiographic Findings  │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

---

# 4. Dentist Actions, Clinical Procedures & CDT Codes

Below is the complete, comprehensive catalog of actions, procedures, treatments, and billing codes that a dentist can perform in Dentia:

### 1. Restorative & Operative Procedures
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Mark Healthy / Sound** | D0140 / Baseline | `#10B981` / Ivory | Restores tooth to physiological baseline; clears pathological tags. |
| **Amalgam Restoration (1–4 Surfaces)** | D2140–D2161 | Silver Grey `#9AA5AB` | Charts posterior silver alloy restoration across selected surfaces (O, MO, DO, MOD, MODBL). |
| **Composite Resin (1–4 Surfaces)** | D2330–D2394 | Blue Border `#3B82F6` | Tooth-colored aesthetic resin restoration for anterior or posterior teeth. |
| **Glass Ionomer Cement (GIC)** | D2391-GIC | Gold Yellow `#E8D98A` | Fluoride-releasing restorative base; ideal for cervical Class V and pediatric molars. |
| **Pit & Fissure Sealant** | D1351 | Lime Green `#84CC16` | Preventative resin sealant over deep, non-cavitated fissures. |
| **Resin / Porcelain Inlay & Onlay** | D2610–D2664 | Ceramic Ivory `#0284C7` | Laboratory-fabricated indirect restorative restoration for wide cusp replacement. |
| **Composite / Porcelain Veneer** | D2960–D2962 | Cyan `#06B6D4` | Aesthetic labial veneer shell covering anterior enamel discrepancies. |
| **Post & Core Build-Up** | D2950 / D2954 | Dark Charcoal `#1E293B` | Prefabricated or cast post cemented into root canal for coronal retention. |

### 2. Endodontic Procedures
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Root Canal Therapy (Anterior)** | D3310 | Violet Purple `#7C3AED` | Complete pulpectomy, instrumentation, and warm gutta-percha obturation on incisors/canines. |
| **Root Canal Therapy (Bicuspid)** | D3320 | Violet Purple `#7C3AED` | Endodontic therapy on premolars (1–2 canals). |
| **Root Canal Therapy (Molar)** | D3330 | Violet Purple `#7C3AED` | Endodontic therapy on molars (3–4 canals, including MB2 verification). |
| **Direct / Indirect Pulp Capping** | D3110 / D3120 | Soft Violet `#C084FC` | Application of biocompatible calcium silicate (MTA / Biodentine) over vital pulp. |
| **Pulpotomy (MTA/Formocresol)** | D3220 | Deep Purple `#581C87` | Coronal pulp amputation preserving radicular vital pulp in primary or immature permanent teeth. |
| **Pulpectomy (Primary Tooth)** | D3230 / D3240 | Magenta `#9333EA` | Canal debridement filled with resorbable paste (Vitapex / ZOE) allowing permanent tooth eruption. |
| **Periapical Abscess Drainage** | D7510 | Deep Crimson `#EF4444` | Surgical or trans-canal incision and drainage of acute apical infection. |
| **Endodontic Retreatment** | D3346–D3348 | Dual Purple Halo | Removal of previous obturation material, re-instrumentation, and re-obturation. |

### 3. Oral & Maxillofacial Surgery
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Simple Routine Extraction** | D7140 | Red Diagonal Line | Non-surgical extraction of erupted tooth with forceps/elevators. |
| **Surgical Extraction (Bone Removal)** | D7210 | Red "X" Cross `#B5122E` | Surgical removal requiring mucoperiosteal flap, osteotomy, or sectioning of roots. |
| **Impacted Tooth (Soft Tissue)** | D7220 | Purple Cross `#BE123C` | Surgical removal of tooth occluded by overlying pericoronal gingival flap. |
| **Impacted Tooth (Partial Bony)** | D7230 | Deep Purple `#7C3AED` | Removal requiring surgical bone guttering (e.g. mesioangular 45° 3rd molar). |
| **Impacted Tooth (Complete Bony)** | D7240 | Violet `#5B21B6` | Horizontally trapped 90° tooth embedded completely in mandibular or maxillary bone. |
| **Surgical Exposure of Trapped Canine** | D7280 | Crimson `#DC2626` | Flap reflection, bone removal, and bonding of orthodontic gold chain for eruption traction. |
| **Operculectomy / Flap Excision** | D7971 | Rose `#F43F5E` | Surgical excision of pericoronal tissue over partially erupted molars. |
| **Frenectomy (Labial / Lingual)** | D7960 | Rose Outline | Surgical release of hypertrophic maxillary labial frenum or tongue-tie (ankyloglossia). |
| **Alveoloplasty** | D7310 | Slate `#64748B` | Surgical contouring and smoothing of alveolar bone ridges pre-prosthetics. |

### 4. Prosthodontics (Crowns, Bridges & Dentures)
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Full Ceramic / Zirconia Crown** | D2740 | Translucent Ivory `#0284C7` | High-strength monolithic zirconia or E.max crown with subgingival/supragingival margin. |
| **Porcelain-Fused-to-Metal (PFM)** | D2750 | Grey Base + White Rim | Metal core with aesthetic feldspathic porcelain veneer overlay. |
| **Full Cast Metal / Gold Crown** | D2790 | Metallic Gold `#D97706` | Full coverage high-noble gold or base metal crown for posterior clearance. |
| **Fixed Bridge Abutment & Pontic** | D6240–D6750 | Dashed Gold Line `#8A8A8A` | Multi-unit fixed partial denture replacing one or more missing teeth. |
| **Complete Maxillary / Mandibular Denture** | D5110 / D5120 | Pink Acrylic Outline | Full arch tissue-borne removable prosthetic replacement. |
| **Partial Removable Denture (Cast Metal)**| D5213 / D5214 | Cobalt Blue Clasp | Cast chromium-cobalt framework with acrylic saddles and retentive clasps. |

### 5. Dental Implantology & Bone Grafting
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Endosseous Dental Implant Fixture** | D6010 | Teal Screw `#0E8A80` | Surgical osteotomy and titanium/zirconia root implant placement. |
| **Bone Replacement Graft (Ridge Augmentation)**| D7953 | Emerald Dot Matrix | Particulate allograft/xenograft with collagen membrane placed in alveolar defect. |
| **Sinus Augmentation (Lateral / Crestal)**| D7951 / D7952 | Sky Blue Arc | Elevation of Schneiderian membrane and bone graft placement for maxillary height. |
| **Implant-Supported Custom Crown** | D6058–D6062 | Teal + Ivory Crown | Screw-retained or cement-retained crown connected to titanium implant fixture. |

### 6. Periodontal Diagnostics & Treatments
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Adult Prophylaxis (Cleaning)** | D1110 | Mint Green `#10B981` | Supragingival scaling and polish for clinically healthy gingiva. |
| **Scaling & Root Planing (SRP)** | D4341 / D4342 | Amber Orange `#F59E0B` | Deep subgingival instrumentation and calculus removal per quadrant (probing >= 4mm). |
| **Full Mouth Periodontal Debridement** | D4355 | Amber Stripe | Preliminary debridement to enable comprehensive diagnosis. |
| **Gingival Probing Depth (1–12 mm)** | Clinical Metric | Metric HUD Bar | Record 6-point probing depths per tooth (Mesiobuccal, Buccal, Distobuccal, Mesiolingual, Lingual, Distolingual). |
| **Bleeding on Probing (BOP)** | Clinical Metric | Red Flashing Dot | Diagnostic indicator of active microvascular gingival inflammation. |
| **Tooth Mobility (Grade 0, I, II, III)** | Clinical Metric | Wave Indicator | Grade 0 (Physiological), I (<1mm horizontal), II (>1mm horizontal), III (Vertical depression). |
| **Furcation Involvement (Class I–IV)** | Clinical Metric | Glickman Triangle | Infiltration of periodontal bone loss into multi-rooted molar root divisions. |

### 7. Orthodontics & Bite Malocclusion Suite
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Comprehensive Orthodontic Treatment** | D8080 | Royal Blue `#2563EB` | Full-arch fixed appliance (brackets, archwires) or clear aligner therapy. |
| **Deep Overbite Correction** | D8080 | Vector Simulation | Treatment of vertical excessive overlap (>50%); leveling of Curve of Spee. |
| **Class III Underbite Correction** | D8080 | Vector Simulation | Mandibular prognathism or maxillary retrognathia with negative overjet. |
| **Crossbite Expansion (RPE / Quad Helix)**| D8080 | Vector Simulation | Maxillary transverse discrepancy expansion (Anterior or Posterior). |
| **Anterior Open Bite Closure** | D8080 | Vector Simulation | Habit cessation (tongue thrust/thumb sucking) and vertical anterior closure. |
| **Archwire Placement & Progression** | Clinical Action | Wire Gauge Badge | Progression tracking: `0.014 NiTi`, `0.016 NiTi`, `0.016x0.022 SS`, `TMA Wire`. |
| **Orthodontic Bracket Bonding** | D8670 | Silver Bracket `#C0C0C0` | Direct bonding of ceramic or metallic brackets across dental units. |

### 8. Temporomandibular Joint (TMJ) & Craniofacial Suite
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **TMJ Comprehensive Examination** | D0140 | Diagnostic HUD | Bilateral palpation of temporalis and masseter muscles; joint noise evaluation. |
| **TMJ Clicking / Disc Displacement (DDwR)**| D7880 | Acoustic Wave Icon | Disc reduced on opening with characteristic acoustic click/pop. |
| **Closed Lock / Severe Trismus (DDwoR)** | D7880 | Amber Lock `#EF4444` | Anterior disc displacement without reduction; mouth opening restricted (<35 mm). |
| **Maxillary Occlusal Splint (Michigan Splint)**| D7880 | Teal Shield `#0F766E` | Flat-plane hard acrylic stabilization appliance for neuromuscular relaxation. |
| **Mouth Opening Measurement (MIO)** | Clinical Metric | Caliber HUD (mm) | Physiological opening caliber simulation (18mm restricted to 55mm maximum). |

### 9. Bruxism, Attrition & Nightguard Protocols
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Severe Occlusal Attrition Charting** | D9944 | Amber Wear Facet `#D97706` | Wear facets, enamel loss, and flattening of posterior cusps from nocturnal grinding. |
| **Hard Acrylic Occlusal Guard** | D9944 | Translucent Shield | Custom lab-fabricated hard splint protecting dentition against parafunctional clenching. |
| **Dual-Laminate Soft/Hard Nightguard** | D9945 | Dual Band | Soft inner comfort liner with hard outer acrylic masticatory barrier. |

### 10. Pediatric Dentistry Protocols (Primary Teeth A–T)
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Stainless Steel Crown (SSC)** | D2930 | Metallic Cap `#94A3B8` | Full preformed coronal coverage for high caries risk or pulpotomized primary molars. |
| **Pediatric Zirconia / Strip Crown** | D2934 | Aesthetic White `#FFFDF8` | Tooth-colored aesthetic crown for primary incisors. |
| **Silver Diamine Fluoride (SDF)** | D1354 | Dark Metallic Spot | 38% SDF application arresting active asymptomatic carious lesions in young children. |
| **Topical 5% NaF Fluoride Varnish** | D1206 | Light Blue Tint | Semi-annual professional varnish application for remineralization. |
| **Space Maintainer (Band & Loop)** | D1510 | Blue Loop `#2563EB` | Fixed unilateral appliance preserving space after premature primary molar extraction. |
| **Space Maintainer (Distal Shoe)** | D1516 | Blue Guide | Subgingival guide placed when primary 2nd molar is lost prior to 1st permanent molar eruption. |
| **Habit Appliance (Tongue Crib)** | D8210 | Yellow Lattice `#FDE047` | Fixed or removable palatal crib to terminate anterior tongue thrusting. |

### 11. Cosmetic Dentistry & Tooth Whitening
| Action / Procedure | CDT Code | Visual Indicator | Clinical Description & Dentist Workflow |
| :--- | :--- | :--- | :--- |
| **Professional In-Office Bleaching** | D9972 | Shade Progression | High-concentration hydrogen peroxide lamp session with gingival barrier. |
| **Custom Take-Home Whitening Trays**| D9975 | Transparent Tray | Vacuum-formed custom dental trays with carbamide peroxide gel tubes. |
| **VITA Classical Shade Mapping** | Clinical Metric | `A1` to `C4` Badges | Accurate tracking of baseline shade (e.g. `A4`, `A3.5`) and target shade (e.g. `B1`, `BL1`). |
| **Aesthetic Enamel Microabrasion** | D9970 | Polishing Disc | Hydrochloric acid and pumice paste slurry to remove superficial fluorosis stains. |

---

# 5. Page-by-Page & Module-by-Module Functional Deep Dive

---

## 5.1 Patient Master Directory & Clinical Console (`/directory`)

**URL**: `http://localhost:5173/directory`  
**Target Users**: Treating Dentists, Clinical Assistants, Clinic Director.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  PATIENT DIRECTORY & EHR CONSOLE                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Search Patients...]  [Doctor Filter: All / Dr. Jhangir]  [Region: PK / NZ]  [+ Register Patient]│
├───────────────────────────────┬──────────────────────────────────────────────────────────────────┤
│ PATIENT CARD (e.g. #30 Miraal)│ LIVE CONSULTATION MODALITY DRAWER (Auto-Collapses in 15s)        │
│ • Photo, Age, DOB, Gender     │ • [Braces Protocol] -> Stage 1 (Leveling) -> Wire: 0.014 NiTi    │
│ • Cell Number & Emergency Contact│ • [Whitening Guide] -> Pre-Shade: A3.5 -> Target: B1 (Session 2) │
│ • Critical Allergies (Penicillin)│ • [Cavity Spotter] -> Quick Tag Teeth (#3, #19, #30) -> GIC/Comp │
│ • Calculated DMFT & Health %  │ • [Save & Update Modality Plan] | [↺ Revert & Clear Plan]        │
├───────────────────────────────┴──────────────────────────────────────────────────────────────────┤
│ ACTION BUTTONS: [🦷 Full 3D Odontogram Chart] [📝 AI Notes] [📅 Book Visit] [🖨️ Print PDF Dossier]│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Features:
1. **Live Search & Instant Filtering**:
   - Filter by Patient ID, First Name, Last Name, or Phone Number with zero keystroke delay.
   - Doctor switcher allowing multi-tenant practitioner isolation or clinic-wide directory views.
2. **Dynamic Clinical Demographics & Safety Badges**:
   - Displays real-time calculated age, DOB, biological sex, contact details, and emergency contacts.
   - Prominently flashes medical alert pills (e.g., *Penicillin Allergy*, *Type II Diabetes*, *Hypertension Stage 2*).
3. **Interactive Treatment Modality Drawer**:
   - **Braces (Orthodontics)**: Track Stages 1 (Leveling), 2 (Closure), and 3 (Finishing); assign archwires (`0.014 NiTi` to `TMA Wire`).
   - **Whitening (Cosmetics)**: Compare pre-treatment VITA shade vs target aesthetic shade across Sessions 1 to 3.
   - **Cavity (Restorative)**: Rapid-fire restorative tagging for posterior molars with Composite or GIC.
   - **Smart 15-Second Inactivity Collapse**: Automatically collapses the drawer after 15s of idle time to maximize visual workspace.
   - **Single-Click Plan Reset (`↺`)**: Instantly clears the active plan and stage from the database with forensic audit logging.
4. **Live Health Overview Matrix**:
   - Dynamic progress bars calculated across all teeth: Healthy %, Caries %, RCT %, Missing %, and Crown %.

---

## 5.2 Interactive Odontogram Chart Workspace (`/chart/:patientId`)

**URL**: `http://localhost:5173/chart/30`  
**Target Users**: Practicing Dentists, Oral Surgeons, Endodontists.

### Core Features:
1. **Interactive Dual-Jaw Odontogram**:
   - Maxillary Upper Arch (Teeth 1–16) and Mandibular Lower Arch (Teeth 17–32).
   - Anatomical tooth graphics dynamically shaded in real-time based on diagnosed conditions:
     - `Healthy` (Clean White/Ivory)
     - `Caries / Decay` (Deep Red `#EF4444`)
     - `Filled / Restored` (Sky Blue `#3B82F6` or Silver `#9AA5AB`)
     - `Root Canal Treated` (Royal Purple `#7C3AED`)
     - `Crown / Bridge` (Gold Amber `#D97706`)
     - `Missing / Extracted` (Empty Alveolar Socket `#4A231A`)
     - `Dental Implant` (Teal Titanium `#0E8A80`)
2. **Dentition Mode Switcher**:
   - Seamlessly switch between **Adult Permanent** (32 Teeth), **Pediatric Deciduous** (20 Teeth A–T), and **Mixed Dentition** modes.
3. **Numbering System Switcher**:
   - Instant toggle between **Universal ADA (1–32 / A–T)** and **FDI Two-Digit (11–48 / 51–85)**.
4. **Diagnostic Suite Launcher Modal**:
   - Launches the full Ortho & TMJ Vector Diagnostic Suite without leaving the chart.
5. **Batch Save & DB Synchronization**:
   - Instant optimistic updates in UI with debounced backend persistence to `[dentist].[TeethState]` table.
6. **Per-Tooth Clinical Notes & Quick Actions**:
   - Click any tooth to view historical interventions, add clinical comments, or launch the 3D Microscopic Canvas.

---

## 5.3 3D Microscopic Tooth Detail & Surface Inspector (`/chart/:patientId/tooth/:toothKey`)

**URL**: `http://localhost:5173/chart/30/tooth/Q` or `/chart/30/tooth/14`  
**Target Users**: Restorative Dentists, Endodontists, Dental Hygienists.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     3D MICROSCOPIC TOOTH DETAIL & 5-SURFACE INSPECTOR                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [← Back to Chart]   Tooth #14: Permanent Maxillary Left First Molar (Universal 14 / FDI 26)     │
├───────────────────────────────┬──────────────────────────────────────────────────────────────────┤
│ 3D WEBGL INTERACTIVE CANVAS   │ 5-SURFACE CROSS-SECTION ANATOMY MATRIX                           │
│ • Full 360° Orbit Controls    │ • [O] Occlusal: Composite Resin (D2391)                          │
│ • Zoom & Pan Micro-Inspection │ • [M] Mesial: Class II Carious Lesion (D2392)                    │
│ • High-Gloss Shader Materials │ • [D] Distal: Intact Healthy Enamel                              │
│ • Realistic Root Morphology   │ • [B] Buccal: Cervical NCCL / GLUMA Desensitizer                 │
│ • Antagonist Contact Vector   │ • [L] Lingual/Palatal: Sound Baseline                            │
├───────────────────────────────┴──────────────────────────────────────────────────────────────────┤
│ CLINICAL TABS:                                                                                   │
│ • Tab 1: Anatomy & Cross-Section (Enamel, Dentin, Pulp Chamber, Root Canal, PDL, Bone)           │
│ • Tab 2: Clinical Palette (Restorative, Endo, Surgical, Perio, Developmental, Appliances)        │
│ • Tab 3: Periodontal Matrix (Probing 1-12mm, BOP, Mobility Grade 0-III, Furcation Class I-IV)    │
│ • Tab 4: Ortho & TMJ Diagnostic Suite (Full 12 Vector Diagrams Simulation)                       │
│ • Tab 5: Radiographs & Clinical Notes (Bitewings, Periapicals, Doctor Chronological History)     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Features:
1. **Interactive Three.js 3D WebGL Tooth Viewer**:
   - Realistic 3D mesh rendering with orbit controls, pan, zoom, dynamic lighting, and real-time shader color shifts matching diagnosed conditions.
2. **5-Surface Multi-Select Matrix**:
   - Select individual surfaces (O, M, D, B, L) or multi-surface complexes (MOD, DO, MO, MODBL) with single clicks.
   - Apply specific restorative materials (Composite, Amalgam, GIC, Inlay, Onlay) per surface.
3. **Quick Clinical Presets Bar**:
   - One-click presets: *Pit & Fissure Sealant*, *Class I Composite*, *Class II MOD Amalgam*, *Full Ceramic Crown*, *Root Canal Therapy*, *Surgical Extraction*, *Implant Placement*.
4. **Sound Baseline Button**:
   - One-click *"Intact & Sound Baseline (Mark Healthy)"* button that restores all surfaces to clean enamel and updates the patient chart.
5. **Periodontal Matrix**:
   - Record 6-point probing depths, Bleeding on Probing (BOP), tooth mobility grades (0 to III), and furcation involvement.
6. **Odontogram Arch Navigator**:
   - Seamlessly hop to adjacent teeth or switch quadrants without exiting the detail workspace.

---

## 5.4 Ortho, Impactions & TMJ Diagnostic Suite

**Available As**: Modal in `/chart/:patientId` and Tab 4 in `/chart/:patientId/tooth/:toothKey`.  
**Special Behavior**: **Interactive simulation mode with manual save safety** — browsing diagrams or moving sliders does NOT modify chart teeth or save to DB until the doctor clicks the dedicated manual save button.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│              ORTHO, OCCLUSION, WISDOM IMPACTION & TMJ DIAGNOSTIC SUITE (12 DIAGRAMS)             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [📐 1. Occlusion & Bite (5 Diagrams)] [🩻 2. Impacted Teeth (4 Diagrams)] [🦴 3. TMJ Suite (3)]    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SUB-SUITE 1: OCCLUSION & BITE MALOCCLUSION                                                       │
│ • Overbite (Deep Bite >50% overlap) (D8080)                                                      │
│ • Underbite (Class III Negative Overjet -3.5mm) (D8080)                                          │
│ • Crossbite (Posterior/Anterior Discrepancy) (D8080)                                             │
│ • Anterior Open Bite (Vertical Gap 4.0mm) (D8080)                                                │
│ • Uneven Molar Wear Facets (Severe Bruxism Attrition) (D9944)                                    │
│ → [Save Bite Assessment to Patient Chart] (Manual Save)                                          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SUB-SUITE 2: IMPACTED & WISDOM TEETH X-RAY SIMULATOR                                             │
│ • Mesioangular Wisdom Molar (45° Angulation) (D7230)                                             │
│ • Horizontally Impacted Molar (90° Trapped Under Bone) (D7240)                                   │
│ • Palatally Trapped Maxillary Canine (Surgical Exposure & Gold Chain) (D7280)                     │
│ • Partially Erupted Premolar with Operculum (D7220)                                              │
│ • Real-Time Sliders: Angulation (0–90°), Nerve Distance (0.1–5mm), Eruption Coverage (0–100%)    │
│ → [Save Impacted Tooth Assessment to Chart] (Manual Save)                                        │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SUB-SUITE 3: TEMPOROMANDIBULAR JOINT (TMJ) & JAW ARTICULATION SUITE                              │
│ • Normal TMJ Articulation (Disc seated in fossa) (D0140)                                         │
│ • TMJ Clicking / Anterior Disc Displacement with Reduction (D7880)                               │
│ • Closed Lock / Severe Trismus (Non-reducing disc displacement, restricted opening) (D7880)      │
│ • 60fps Jaw Articulation Simulation: Max Interincisal Opening Slider (18mm locked to 55mm max) │
│ • Acoustic Wave Toggle: Simulates audible joint click on opening/closing                        │
│ • Prescribed Splint: Maxillary Flat-Plane Stabilization Splint (Michigan Splint D7880)           │
│ → [Save TMJ Assessment to DB] (Manual Save)                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.5 Smart AI Patient Intake & Registration (`/new-patient`)

**URL**: `http://localhost:5173/new-patient`  
**Target Users**: Receptionists, Practice Managers, Intake Coordinators.

### Core Features:
1. **Multi-Modal Patient Registration**:
   - Manual form input, photo capture/upload (<=5MB), and voice dictation intake.
2. **AI-Powered Natural Speech Intake**:
   - Dictate or paste unstructured intake narrative (e.g. *"Register Hamza Tariq, male, born May 14 1998, phone 03001234567, presenting with severe toothache on upper right molar, penicillin allergy"*).
   - Gemini AI autonomously extracts and maps: `firstName`, `lastName`, `dob`, `gender`, `cellNumber`, `chiefComplaint`, `medicalAlerts`.
3. **Smart Duplicate Prevention Algorithm**:
   - **Sibling/Family Exception**: Allows multiple children/siblings to share a parent's cell number without blocking registration.
   - **True Person Duplicate**: Blocks duplicate entries only when First Name + Last Name + DOB collide with an existing patient.
4. **Auto-Dentition Adaptation**:
   - Automatically initializes the correct odontogram arch based on calculated DOB age:
     - **Age < 6**: Deciduous Pediatric Arch (Teeth A–T).
     - **Age 6–12**: Mixed Dentition Protocol.
     - **Age > 12**: Adult Permanent Arch (Teeth 1–32).
5. **Live Geocoding**:
   - Mapbox and OpenStreetMap auto-completion for patient residential addresses across configured clinic regions (Pakistan / New Zealand).

---

## 5.6 Operatory Appointment Scheduling & Calendar (`/appointments` & `/book`)

**URL**: `http://localhost:5173/appointments` and `http://localhost:5173/book`  
**Target Users**: Receptionists, Dentists.

### Core Features:
1. **Operatory Schedule Grid**:
   - Calendar view filtered by day, week, month, attending doctor, and operatory chair.
2. **Conflict & Collision Prevention**:
   - Hard validation preventing double-booking the same operatory chair or doctor during overlapping time slots.
3. **Appointment Status Lifecycle**:
   - Track status through clinical phases: `Pending` ➔ `Confirmed` ➔ `In-Waiting` ➔ `In-Chair` ➔ `Completed` / `Cancelled` / `No-Show`.
4. **Quick Booking from Patient Directory**:
   - Pre-fills patient ID, full name, phone number, and primary complaint directly from the directory console.
5. **Procedure Reason Categorization**:
   - Categorizes visits into Consultation, Emergency Toothache, Orthodontic Adjustment, Root Canal Therapy, Prophylaxis/Cleaning, Crown Delivery, or Surgery.

---

## 5.7 Ambient AI Voice Clinical Scribe & SOAP Notes (`/ai-notes`)

**URL**: `http://localhost:5173/ai-notes`  
**Target Users**: Practicing Dentists, Clinical Scribes.

### Core Features:
1. **Ambient Hands-Free Voice Dictation**:
   - Clinician clicks the microphone button during or after treatment and dictates natural clinical findings.
2. **8-Section Comprehensive SOAP Note Generation**:
   - **1. Subjective (Chief Complaint)**: Patient's symptoms, pain severity, duration, and medical history.
   - **2. Objective Examination**: Clinical oral findings, gingival health, and caries index.
   - **3. Odontogram Chart Sync**: Extracted tooth numbers and surfaces mapped directly to the patient's dental chart.
   - **4. Assessment & Differential Diagnosis**: ICD-10 dental diagnostic classifications.
   - **5. Procedures Performed**: Itemized treatments with corresponding ADA CDT billing codes.
   - **6. Materials & Pharmacology Used**: Restorative composites, local anesthetic dosages (e.g. *2 cartridges 2% Lidocaine with 1:100k epi*), and obturation sealers.
   - **7. Post-Operative Instructions**: Home care advice, diet restrictions, and pain management.
   - **8. Follow-Up & Next Recall**: Scheduled recall interval (e.g. *Return in 2 weeks for crown cementation*).
3. **Doctor Signature & EHR Sync**:
   - Doctor reviews generated notes, performs single-click edits, electronically signs, and permanently commits the entry to `[dentist].[ClinicalLogs]` and `[dentist].[DentalNotes]`.

---

## 5.8 Radiology & High-Definition Dental X-Ray Viewer

**Available As**: Radiographs Tab in `/chart/:patientId` and `/chart/:patientId/tooth/:toothKey`.  
**Target Users**: Dentists, Radiologists, Oral Surgeons.

### Core Features:
1. **Multi-Modality X-Ray Viewer**:
   - View Bitewing (BWX), Periapical (PA), Panoramic (OPG / Panorex), and Cephalometric radiographs.
2. **Diagnostic Image Manipulation**:
   - 10x Smooth Zoom, Pan, Contrast adjustment, Brightness enhancement, and Grayscale Inversion (for subtle bone trabeculation and apical radiolucency detection).
3. **Tooth Association & Annotation**:
   - Tag specific radiographs to tooth numbers (e.g. *Periapical radiograph of Tooth #19 showing 3mm periapical radiolucency at distal apex*).
4. **Radiology Findings Log**:
   - Record formal radiographic reports stored directly in `[dentist].[Radiographs]` table.

---

## 5.9 Electronic Prescriptions & Medication Engine

**Available As**: Prescriptions Tab in `/chart/:patientId`.  
**Target Users**: Treating Dentists, Oral Surgeons.

### Core Features:
1. **Dental Pharmacology Catalog**:
   - Pre-loaded with common dental medications:
     - *Antibiotics*: Amoxicillin 500mg, Augmentin 625mg/1g, Clindamycin 300mg (Penicillin-allergic), Azithromycin 500mg, Metronidazole 400mg.
     - *Analgesics & NSAIDs*: Ibuprofen 400mg/600mg, Paracetamol 500mg/1000mg, Ketorolac 10mg, Tramadol 50mg.
     - *Oral Rinses*: Chlorhexidine Gluconate 0.12% / 0.2%, Hydrogen Peroxide 1.5%.
2. **Dosage, Frequency & Duration Generator**:
   - Structured dosage selection: TDS (Three times daily), BD (Twice daily), QID (Four times daily), PRN (As needed for pain).
   - Duration presets: 3 Days, 5 Days, 7 Days.
3. **Allergy Safety Guardrail**:
   - Cross-references patient's `MedicalAlerts` (e.g. flashes critical warning if prescribing Amoxicillin/Augmentin to a patient with a Penicillin allergy).
4. **Printable Official Prescription Slip**:
   - Generates official clinic prescription slip with doctor name, license registration number, clinic logo, patient details, and signature line.

---

## 5.10 Official Patient Dental Odontogram PDF Report & Printing

**Available As**: Print Report Button in `/chart/:patientId` and `/chart/:patientId/tooth/:toothKey`.  
**Target Users**: Dentists, Insurance Coordinators, Patients.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CLINICAL HEADER & BRANDING (Clinic Name, Doctor, License, Date, Ref ID) │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. PATIENT DEMOGRAPHIC DOSSIER (Name, Age, DOB, Gender, Phone, Category)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. ODONTOGRAM SUMMARY & INDICES (DMFT / def, Healthy vs Diseased Count)     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. COMPLETE TOOTH-BY-TOOTH CLINICAL DOSSIER (Full 32 or 20 Tooth Table)     │
│    - Tooth # / Key (1–32 or A–T)                                            │
│    - Anatomical Name & Quadrant (Q1–Q4)                                     │
│    - Diagnosed Condition & Color Status                                     │
│    - Affected Surfaces (Occlusal, Mesial, Distal, Buccal, Lingual)         │
│    - Doctor Observations & Clinical Findings                                │
│    - Clinical Action & Treatment Performed / Planned                        │
│    - Shade, Periodontal Probing Depth & Mobility                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. PERIODONTAL & SOFT TISSUE STATUS (Probing Depths, Gingival Health)       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. COMPREHENSIVE TREATMENT PLAN & ACTION TIMELINE (Phases 1–3)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 7. LEGAL ATTESTATION & SIGNATURE (Doctor Signature, License Stamp, Date)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Features:
1. **ADA & FDI Compliant Format**:
   - Generates high-resolution multi-page PDF documents suitable for patient hand-out, legal records, or insurance claims.
2. **Complete Tooth-by-Tooth Dossier**:
   - Comprehensive table enumerating every single tooth (1–32 or A–T) with condition, surfaces, clinical notes, CDT codes, and treatment timeline.
3. **One-Click Print / PDF Export**:
   - Direct browser printing or PDF download via `html2canvas` and `jspdf`.

---

## 5.11 Practice Analytics & Public Portal (`/` & `/dashboard`)

**URL**: `http://localhost:5173/` and `http://localhost:5173/dashboard`  
**Target Users**: Clinic Owners, Front Desk Staff, Patients.

### Core Features:
1. **Executive Practice Dashboard**:
   - Real-time counters: Total Registered Patients, Today's Consultations, Active Orthodontic Patients, Pending Procedures.
2. **Public Clinic Portal**:
   - Interactive hero banner, clinic services showcase, Google review metrics (23k+ reviews), team credentials, and operatory photos.
3. **Conversational Patient Dental Chatbot**:
   - 24/7 AI-powered conversational assistant answering patient inquiries regarding toothache remedies, treatment pricing, clinic hours, and appointment bookings.

---

## 5.12 Doctor & Staff Administration (`/admin/doctors`)

**URL**: `http://localhost:5173/admin/doctors`  
**Target Users**: SuperAdmin, Clinic Medical Director.

### Core Features:
1. **Clinician Profile Provisioning**:
   - Manage doctor accounts, dental license credentials (e.g. PMC/ADA registration), and clinical specialties.
2. **Operatory & Regional Assignment**:
   - Assign doctors to specific clinic locations (Pakistan / New Zealand) and operatory chairs.
3. **Role-Based Security & Permissions**:
   - Protects confidential patient EHR data with credential verification.

---

# 6. Clinical Decision Support, Pharmacology & Safety Protocols

Dentia incorporates clinical safety guardrails to assist clinicians at the point of care:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLINICAL SAFETY GUARDRAILS                                     │
├──────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│ ⚠️ Penicillin Allergy     │ Auto-flags beta-lactam antibiotics. Recommends Clindamycin 300mg or   │
│                          │ Azithromycin 500mg.                                                   │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 🩸 Anticoagulant Therapy │ Prompts INR verification (<24h). Requires local hemostatics (Surgicel)│
│                          │ and cross-mattress sutures for simple/surgical extractions.           │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 💓 Hypertension & Cardiac│ Limits Epinephrine to cardiac maximum of 0.04mg (max 2 cartridges     │
│                          │ 1:100,000 epi). Recommends 3% Mepivacaine plain.                      │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 🍬 Diabetes (HbA1c)      │ Flags delayed healing and infection risk if HbA1c > 8.0%. Recommends  │
│                          │ morning appointments post-insulin.                                    │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ 🤰 Pregnancy Protocol    │ Flags second trimester (weeks 14–28) as safest operative window.      │
│                          │ Recommends Lidocaine 2% with double lead-apron X-ray shielding.       │
└──────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

# 7. Comprehensive Procedures & Functionality Matrix

| Clinical Procedure | Specialty Category | Supported Dentition | Surface / Arch Scope | CDT Code | Primary Action & Persistence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mark Healthy / Sound** | Restorative | Adult / Pediatric | All Surfaces | D0140 | Resets tooth to physiological sound baseline |
| **Amalgam Restoration** | Restorative | Adult / Pediatric | O, MO, DO, MOD, MODBL | D2140–D2161 | Charts silver alloy restoration |
| **Composite Restoration** | Restorative | Adult / Pediatric | O, M, D, B, L | D2330–D2394 | Charts aesthetic resin restoration |
| **Glass Ionomer (GIC)** | Restorative | Adult / Pediatric | Class V, Cervical, O | D2391-GIC | Charts fluoride-releasing cement |
| **Pit & Fissure Sealant** | Restorative | Adult / Pediatric | Occlusal Pits | D1351 | Charts preventative resin sealant |
| **Zirconia / E.max Crown**| Prosthodontics | Adult Permanent | Full Coronal | D2740 | Charts high-strength aesthetic ceramic crown |
| **Porcelain-Fused-to-Metal**| Prosthodontics | Adult Permanent | Full Coronal | D2750 | Charts PFM metal-backed aesthetic crown |
| **Stainless Steel Crown** | Pediatric | Primary (A–T) | Full Coronal | D2930 | Charts preformed pediatric metallic crown |
| **Strip / Zirconia Crown**| Pediatric | Primary (A–T) | Anterior Teeth | D2934 | Charts aesthetic pediatric white crown |
| **Root Canal Therapy (Ant)**| Endodontics | Adult Permanent | Root Canals | D3310 | Complete RCT on incisor or canine |
| **Root Canal Therapy (Prem)**| Endodontics | Adult Permanent | Root Canals | D3320 | Complete RCT on bicuspid (1–2 canals) |
| **Root Canal Therapy (Molar)**| Endodontics | Adult Permanent | Root Canals | D3330 | Complete RCT on molar (3–4 canals) |
| **Pulpotomy (MTA)** | Endodontics | Primary (A–T) | Coronal Pulp | D3220 | Coronal pulp amputation preserving root |
| **Pulpectomy (Resorbable)**| Endodontics | Primary (A–T) | Full Canals | D3230 | Resorbable paste canal obturation |
| **Direct Pulp Capping** | Endodontics | Adult / Pediatric | Exposure Point | D3110 | Biocompatible calcium silicate pulp cap |
| **Simple Extraction** | Oral Surgery | Adult / Pediatric | Full Tooth | D7140 | Non-surgical forceps/elevator extraction |
| **Surgical Extraction** | Oral Surgery | Adult / Pediatric | Full Tooth | D7210 | Extraction requiring flap & osteotomy |
| **Mesioangular Wisdom Ext.**| Oral Surgery | Third Molars | Teeth 1, 16, 17, 32 | D7230 | Partial bony wisdom extraction |
| **Horizontal Wisdom Ext.** | Oral Surgery | Third Molars | Teeth 1, 16, 17, 32 | D7240 | Complete bony 90° trapped extraction |
| **Trapped Canine Exposure** | Oral Surgery | Canines | Teeth 6, 11, C, H | D7280 | Surgical exposure with gold traction chain |
| **Dental Implant Fixture** | Implantology | Adult Permanent | Alveolar Socket | D6010 | Titanium endosseous implant placement |
| **Bone Replacement Graft** | Implantology | Adult Permanent | Alveolar Defect | D7953 | Particulate bone graft + collagen barrier |
| **Scaling & Root Planing** | Periodontics | Adult Permanent | Quadrants Q1–Q4 | D4341 | Deep subgingival debridement (pockets >=4mm) |
| **Probing Depth Charting** | Periodontics | Adult / Pediatric | 6 Points per Tooth | Clinical Metric| 1–12mm millimeter periodontal pocket HUD |
| **Bleeding on Probing (BOP)**| Periodontics | Adult / Pediatric | 6 Points per Tooth | Clinical Metric| Active gingival inflammation marker |
| **Mobility Index** | Periodontics | Adult Permanent | Full Tooth | Clinical Metric| Grades 0 to III physiological to vertical |
| **Furcation Involvement** | Periodontics | Multi-Root Molars| Furcation Division | Clinical Metric| Glickman Classes I to IV bone loss |
| **Deep Overbite Correction**| Orthodontics | Adult / Pediatric | Anterior Arches | D8080 | Vector simulation & orthodontic leveling |
| **Class III Underbite** | Orthodontics | Adult / Pediatric | Full Arches | D8080 | Negative overjet traction simulation |
| **Crossbite Expansion** | Orthodontics | Adult / Pediatric | Posterior/Anterior | D8080 | Rapid palatal expansion protocol |
| **Anterior Open Bite** | Orthodontics | Adult / Pediatric | Anterior Teeth | D8080 | Vertical anterior closure protocol |
| **Orthodontic Bracket** | Orthodontics | Adult / Pediatric | Labial Surfaces | D8670 | Direct bonded orthodontic brackets |
| **Archwire Progression** | Orthodontics | Adult / Pediatric | Archwire Slot | Clinical Metric| 0.014 NiTi to TMA wire tracking |
| **Space Maintainer** | Pediatric | Primary (A–T) | Unilateral / Bilateral | D1510 | Band & loop space preservation |
| **TMJ Clicking (DDwR)** | TMJ / Orofacial | Adult / Teens | Temporomandibular | D7880 | Dynamic joint simulation & clicking wave |
| **TMJ Closed Lock (DDwoR)**| TMJ / Orofacial | Adult / Teens | Temporomandibular | D7880 | Restricted trismus opening simulation |
| **Michigan Occlusal Splint**| TMJ / Orofacial | Adult / Teens | Maxillary Arch | D7880 | Flat-plane stabilization nightguard |
| **Severe Bruxism Attrition**| Restorative / TMJ| Adult Permanent | Occlusal Surfaces | D9944 | Occlusal wear facet attrition charting |
| **Dual-Laminate Nightguard**| Restorative / TMJ| Adult Permanent | Full Arch | D9945 | Dual soft/hard occlusal grinding guard |
| **In-Office Tooth Bleaching**| Cosmetic | Adult Permanent | Anterior Teeth | D9972 | Professional peroxide whitening sessions |
| **Take-Home Whitening Trays**| Cosmetic | Adult Permanent | Full Arches | D9975 | Custom aesthetic whitening trays |
| **VITA Classical Shade** | Cosmetic | Adult Permanent | Individual Teeth | Clinical Metric| Pre-treatment vs Target shade mapping |
| **GLUMA Desensitizer** | Hypersensitivity | Adult Permanent | Cervical Margins | D9910 | Glutaraldehyde dentinal tubule sealing |
| **Fluoride Varnish (5% NaF)**| Preventive | Pediatric / Adult | All Teeth | D1206 | Topical caries prevention varnish |
| **Silver Diamine Fluoride** | Pediatric | Primary (A–T) | Active Caries | D1354 | 38% SDF carious lesion arrest |
| **Electronic Prescription** | Pharmacology | All Patients | Systemic | e-Rx | Full dosage, frequency, and duration slip |
| **8-Section SOAP Note** | AI Clinical Scribe| All Consultations| Clinical Encounter | EHR Note | Ambient voice AI parsed clinical record |
| **Full PDF Dental Dossier** | Practice Management| All Patients | Complete Dentition | Official Dossier| Multi-page legal & insurance PDF printout |

---

*This functional manual represents the comprehensive operational catalog of the Dentia Dental Clinical EHR & Practice Management System.*

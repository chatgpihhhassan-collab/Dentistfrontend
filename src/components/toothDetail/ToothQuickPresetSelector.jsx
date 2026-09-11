import React, { useState, useEffect } from 'react';
import { Edit3, Sparkles, CheckCircle2, Layers, Tag } from 'lucide-react';
import { getHexColor } from '../../utils/toothDataConstants';

export const CLINICAL_PRESET_CATEGORIES = [
  {
    id: 'pathology',
    name: 'Pathology & Caries',
    shortName: 'Pathology',
    icon: '🔴',
    presets: [
      { id: 'Healthy', label: 'Healthy Enamel', color: '#10B981', cdt: 'D0120', icon: '🟢' },
      { id: 'Caries — O', label: 'Caries (Occlusal Fissure)', color: '#EF4444', cdt: 'D2140', icon: '🔴' },
      { id: 'Caries — MO', label: 'Caries (Mesio-Occlusal)', color: '#EF4444', cdt: 'D2150', icon: '🔴' },
      { id: 'Caries — DO', label: 'Caries (Disto-Occlusal)', color: '#EF4444', cdt: 'D2150', icon: '🔴' },
      { id: 'Caries — MOD', label: 'Caries (MOD Cavitation)', color: '#EF4444', cdt: 'D2160', icon: '🔴' },
      { id: 'Caries — Class V', label: 'Caries (Cervical / Class V)', color: '#EF4444', cdt: 'D2140', icon: '🔴' },
      { id: 'Caries — Lingual Pit (L)', label: 'Caries (Lingual Pit)', color: '#EF4444', cdt: 'D2140', icon: '🔴' },
      { id: 'Dentin Hypersensitivity', label: 'Sensitivity (No Cavity)', color: '#06B6D4', cdt: 'D9910', icon: '❄️' }
    ]
  },
  {
    id: 'restorative',
    name: 'Restorative & Operative',
    shortName: 'Restorative',
    icon: '🔵',
    presets: [
      { id: 'Filling — Composite (O)', label: 'Composite Filling', color: '#2563EB', cdt: 'D2391', icon: '🔵' },
      { id: 'Filling — Amalgam', label: 'Amalgam Restoration', color: '#64748B', cdt: 'D2140', icon: '🔘' },
      { id: 'Filling — GIC', label: 'Glass Ionomer (GIC)', color: '#0284C7', cdt: 'D2390', icon: '🧴' },
      { id: 'Pit & Fissure Sealant', label: 'Pit & Fissure Sealant', color: '#06B6D4', cdt: 'D1351', icon: '✨' },
      { id: 'Inlay / Onlay Restoration', label: 'Inlay / Onlay Cast', color: '#D97706', cdt: 'D2510', icon: '💎' },
      { id: 'Ceramic Veneer', label: 'Porcelain Veneer', color: '#8B5CF6', cdt: 'D2962', icon: '✨' }
    ]
  },
  {
    id: 'endodontics',
    name: 'Endodontics',
    shortName: 'Endodontics',
    icon: '🟣',
    presets: [
      { id: 'Root Canal (RCT)', label: 'Root Canal (RCT Endo)', color: '#7C3AED', cdt: 'D3330', icon: '🟣' },
      { id: 'Periapical Abscess', label: 'Periapical Abscess', color: '#DC2626', cdt: 'D7510', icon: '🔴' },
      { id: 'Pulpotomy (MTA)', label: 'Pulpotomy (MTA)', color: '#9333EA', cdt: 'D3220', icon: '🩸' }
    ]
  },
  {
    id: 'prosthodontics',
    name: 'Prosthodontics',
    shortName: 'Prosthodontics',
    icon: '👑',
    presets: [
      { id: 'Crown — Monolithic Zirconia', label: 'Crown (Zirconia / PFM)', color: '#D97706', cdt: 'D2740', icon: '👑' },
      { id: 'Fixed Partial Denture (Bridge)', label: 'Bridge / Pontic Unit', color: '#F59E0B', cdt: 'D6240', icon: '🌉' },
      { id: 'Removable Prosthesis (Denture)', label: 'Prosthesis / Denture', color: '#64748B', cdt: 'D5110', icon: '🦷' },
      { id: 'Post & Core Build-Up', label: 'Post & Core Foundation', color: '#475569', cdt: 'D2952', icon: '🔩' }
    ]
  },
  {
    id: 'periodontics',
    name: 'Periodontics & Surgery',
    shortName: 'Periodontics',
    icon: '⚠️',
    presets: [
      { id: 'Cleaning Needed', label: 'Cleaning & Scaling Needed', color: '#3B82F6', cdt: 'D1110', icon: '✨' },
      { id: 'Gum Recession', label: 'Gingival Recession', color: '#E0665A', cdt: 'D4341', icon: '🔴' },
      { id: 'Periodontal Bone Loss', label: 'Bone Loss (Furcation)', color: '#E0665A', cdt: 'D4341', icon: '⚠️' },
      { id: 'Pathologic Tooth Mobility', label: 'Tooth Mobility (I-III)', color: '#F43F5E', cdt: 'D4342', icon: '〰️' },
      { id: 'Dental Implant', label: 'Dental Implant Unit', color: '#0E8A80', cdt: 'D6010', icon: '🟢' },
      { id: 'Extracted / Missing', label: 'Extracted / Absent', color: '#DC2626', cdt: 'D7140', icon: '❌' }
    ]
  },
  {
    id: 'orthodontics',
    name: 'Orthodontics & Rotation',
    shortName: 'Orthodontics',
    icon: '📐',
    presets: [
      { id: 'Ortho Malocclusion', label: 'Ortho Malocclusion', color: '#3B82F6', cdt: 'D8080', icon: '📐' },
      { id: 'Diastema (Midline Space)', label: 'Diastema (Gap)', color: '#6366F1', cdt: 'D8080', icon: '↔️' },
      { id: 'Dental Crowding', label: 'Dental Arch Crowding', color: '#818CF8', cdt: 'D8080', icon: '🔀' },
      { id: 'Tooth Axial Rotation', label: 'Axial Rotation', color: '#3B82F6', cdt: 'D8080', icon: '🔄' }
    ]
  },
  {
    id: 'trauma',
    name: 'Trauma & Anomalies',
    shortName: 'Trauma',
    icon: '⚡',
    presets: [
      { id: 'Cracked Enamel', label: 'Cracked Tooth Syndrome', color: '#F59E0B', cdt: 'D2740', icon: '⚡' },
      { id: 'Chipped / Fractured Enamel', label: 'Chipped / Fractured', color: '#F97316', cdt: 'D2999', icon: '💥' },
      { id: 'Occlusal Attrition', label: 'Bruxism Attrition', color: '#F59E0B', cdt: 'D9944', icon: '🟡' },
      { id: 'Root Resorption', label: 'Root Resorption', color: '#8B5CF6', cdt: 'D3450', icon: '🟣' },
      { id: 'Impacted Tooth (Wisdom/Canine)', label: 'Impacted Tooth', color: '#7C3AED', cdt: 'D7230', icon: '🩻' },
      { id: 'Periapical Cyst', label: 'Periapical Cyst', color: '#991B1B', cdt: 'D7450', icon: '⭕' }
    ]
  }
];

export const PEDIATRIC_CLINICAL_PRESET_CATEGORIES = [
  {
    id: 'p_restorative',
    name: 'Pediatric Restorative & Crowns',
    shortName: 'Restorative',
    icon: '🛠️',
    presets: [
      { id: 'Stainless Steel Crown (SSC)', label: 'Stainless Steel Crown (SSC)', color: '#94A3B8', cdt: 'D2930', icon: '👑' },
      { id: 'Pediatric Zirconia Crown', label: 'Pediatric Strip Zirconia', color: '#38BDF8', cdt: 'D2934', icon: '✨' },
      { id: 'Filling — GIC', label: 'Glass Ionomer (GIC)', color: '#0284C7', cdt: 'D2390', icon: '🧴' },
      { id: 'Filling — Composite (O)', label: 'Compomer / Resin Filling', color: '#2563EB', cdt: 'D2391', icon: '🔵' },
      { id: 'Pit & Fissure Sealant', label: 'Pit & Fissure Sealant', color: '#84CC16', cdt: 'D1351', icon: '✨' },
      { id: 'Fluoride Varnish / SDF', label: 'Fluoride Varnish / SDF', color: '#0284C7', cdt: 'D1206', icon: '💧' }
    ]
  },
  {
    id: 'p_endodontics',
    name: 'Pediatric Endodontics',
    shortName: 'Endodontics',
    icon: '⚡',
    presets: [
      { id: 'Pulpotomy (MTA)', label: 'Pulpotomy (MTA Coronal)', color: '#7C3AED', cdt: 'D3220', icon: '🩸' },
      { id: 'Pulpectomy (Resorbable)', label: 'Pulpectomy (Resorbable ZOE)', color: '#9333EA', cdt: 'D3230', icon: '🟣' },
      { id: 'Pulp Capping', label: 'Direct / Indirect Pulp Cap', color: '#C084FC', cdt: 'D3110', icon: '🛡️' },
      { id: 'Periapical Abscess', label: 'Periapical Abscess / Fistula', color: '#DC2626', cdt: 'D7510', icon: '🔴' }
    ]
  },
  {
    id: 'p_appliance',
    name: 'Pediatric Appliances & Space',
    shortName: 'Appliance & Space',
    icon: '🦷',
    presets: [
      { id: 'Space Maintainer', label: 'Space Maintainer (Band & Loop)', color: '#2563EB', cdt: 'D1510', icon: '🔵' },
      { id: 'Distal Shoe Space Maintainer', label: 'Distal Shoe Maintainer', color: '#3B82F6', cdt: 'D1515', icon: '📐' },
      { id: 'Habit Appliance', label: 'Habit Breaker (Thumb / Tongue)', color: '#CA8A04', cdt: 'D8220', icon: '🦷' }
    ]
  },
  {
    id: 'p_pathology',
    name: 'Pediatric Pathology & Caries',
    shortName: 'Pathology',
    icon: '🔬',
    presets: [
      { id: 'Healthy', label: 'Healthy Primary Enamel', color: '#10B981', cdt: 'D0120', icon: '🟢' },
      { id: 'Early Childhood Caries (ECC)', label: 'Early Childhood Caries (ECC)', color: '#EF4444', cdt: 'D0120', icon: '🔴' },
      { id: 'Caries — O', label: 'Caries (Primary Cavity)', color: '#DC2626', cdt: 'D2140', icon: '🔴' },
      { id: 'Dentin Hypersensitivity', label: 'Enamel Demineralization', color: '#06B6D4', cdt: 'D1351', icon: '❄️' }
    ]
  },
  {
    id: 'p_surgery',
    name: 'Pediatric Surgery & Trauma',
    shortName: 'Surgery & Trauma',
    icon: '🩺',
    presets: [
      { id: 'Extracted / Missing', label: 'Extraction (Over-Retained)', color: '#DC2626', cdt: 'D7140', icon: '❌' },
      { id: 'Exfoliated / Shedding', label: 'Physiological Shedding', color: '#94A3B8', cdt: 'D0120', icon: '🦷' },
      { id: 'Chipped / Fractured Enamel', label: 'Traumatic Fracture', color: '#F97316', cdt: 'D2999', icon: '💥' },
      { id: 'Pathologic Tooth Mobility', label: 'Primary Tooth Mobility', color: '#F43F5E', cdt: 'D4342', icon: '〰️' }
    ]
  }
];

export const ALL_33_CLINICAL_PRESETS = CLINICAL_PRESET_CATEGORIES.flatMap(cat => cat.presets);
export const ALL_PEDIATRIC_PRESETS = PEDIATRIC_CLINICAL_PRESET_CATEGORIES.flatMap(cat => cat.presets);

export const PRESET_CLINICAL_DESCRIPTIONS = {
  'Healthy': {
    title: 'Healthy Intact Enamel & Sound Periodontium',
    meaning: 'Dentition is structurally intact with no detectable caries, pulpal inflammation, or periodontal pockets.',
    clinicalTip: 'Routine preventive prophylaxis and oral hygiene maintenance recommended.'
  },
  'Cleaning Needed': {
    title: 'Dental Prophylaxis & Ultrasonic Scaling Needed',
    meaning: 'Supragingival and subgingival calculus deposits, plaque biofilm, and extrinsic staining requiring comprehensive dental prophylaxis or scaling (CDT D1110 / D4346).',
    clinicalTip: 'Perform ultrasonic scaling followed by fine-grit paste polishing and subgingival chlorhexidine irrigation.'
  },
  'Caries — O': {
    title: 'Occlusal Pit & Fissure Caries (Class I)',
    meaning: 'Active demineralization restricted to the occlusal groove system without proximal involvement.',
    clinicalTip: 'Recommended: conservative resin restoration or pit and fissure sealing.'
  },
  'Caries — MO': {
    title: 'Mesio-Occlusal Caries (Class II)',
    meaning: 'Interproximal caries lesion involving the mesial contact surface and occlusal marginal ridge.',
    clinicalTip: 'Requires sectional matrix band composite (CDT D2392) or amalgam restoration.'
  },
  'Caries — DO': {
    title: 'Disto-Occlusal Caries (Class II)',
    meaning: 'Interproximal caries lesion involving the distal contact surface and occlusal marginal ridge.',
    clinicalTip: 'Requires sectional matrix band composite restoration.'
  },
  'Caries — MOD': {
    title: 'Mesio-Occlusal-Distal Multi-Surface Caries (Class II)',
    meaning: 'Extensive proximal caries involvement across both mesial and distal contact zones.',
    clinicalTip: 'Evaluate remaining cuspal thickness for full-coverage crown protection.'
  },
  'Caries — Class V': {
    title: 'Cervical / Class V Carious Demineralization',
    meaning: 'Carious or demineralized lesion along the gingival third margin of the buccal/facial cervical enamel.',
    clinicalTip: 'Gingival retraction cord and subgingival composite or Glass Ionomer (GIC) recommended.'
  },
  'Caries — Lingual Pit (L)': {
    title: 'Lingual Pit / Cingulum Developmental Caries (Class I)',
    meaning: 'Focal carious lesion in the lingual/palatal developmental pit of anterior teeth or molars.',
    clinicalTip: 'Conservative Class I composite restoration preserving sound facial enamel.'
  },
  'Dentin Hypersensitivity': {
    title: 'Dentin Hypersensitivity (Non-Carious)',
    meaning: 'Sharp, transient thermal or tactile sensitivity resulting from exposed cervical dentinal tubules without active cavitation.',
    clinicalTip: 'Apply in-office glutaraldehyde/HEMA desensitizer or fluoride varnish (CDT D9910).'
  },
  'Filling — Composite (O)': {
    title: 'Direct Resin Composite Restoration',
    meaning: 'Aesthetic, tooth-colored composite restoration placed to reconstruct coronal tooth structure.',
    clinicalTip: 'Verify occlusal contact in centric occlusion and check interproximal flossing contact.'
  },
  'Filling — Amalgam': {
    title: 'Dental Amalgam Restoration',
    meaning: 'High-strength silver amalgam alloy restoration providing durable posterior masticatory load support.',
    clinicalTip: 'Inspect cavosurface margins for marginal ditching or recurrent microleakage.'
  },
  'Filling — GIC': {
    title: 'Glass Ionomer Cement (GIC / RMGIC)',
    meaning: 'Bioactive fluoride-releasing glass ionomer restoration ideal for cervical lesions and high-caries risk sites.',
    clinicalTip: 'Enhances marginal remineralization via sustained fluoride release.'
  },
  'Pit & Fissure Sealant': {
    title: 'Pit & Fissure Sealant / Fluoride Barrier',
    meaning: 'Flowable micro-mechanical resin barrier bonded over developmental pits and fissures to prevent bacterial colonization.',
    clinicalTip: 'Indicated for deep developmental grooves and caries-susceptible pediatric/adult molars.'
  },
  'Inlay / Onlay Restoration': {
    title: 'Cast / Ceramic Inlay / Onlay Restoration',
    meaning: 'Indirect precision-milled ceramic or gold restoration rebuilding internal fissures and damaged cusps.',
    clinicalTip: 'Preserves sound tooth structure compared to full-coverage crowns.'
  },
  'Ceramic Veneer': {
    title: 'Labial Ceramic Porcelain Veneer',
    meaning: 'Thin, custom-crafted aesthetic ceramic laminate bonded to the facial surface to correct discoloration or minor diastema.',
    clinicalTip: 'Maintain conservative enamel preparation for optimal bond strength.'
  },
  'Root Canal (RCT)': {
    title: 'Endodontic Root Canal Therapy (RCT)',
    meaning: 'Complete pulpectomy, biomechanical canal instrumentation, and warm gutta-percha obturation with bioceramic sealer.',
    clinicalTip: 'Full-coronal crown coverage recommended to prevent post-endodontic cuspal fracture.'
  },
  'Periapical Abscess': {
    title: 'Acute Periapical Abscess / Suppurative Infection',
    meaning: 'Localized purulent collection at root apex secondary to necrotic pulpal infection.',
    clinicalTip: 'Requires emergency drainage, endodontic extirpation, and antibiotic support if systemic spread.'
  },
  'Pulpotomy (MTA)': {
    title: 'Vital Coronal Pulpotomy (MTA / Bioceramic)',
    meaning: 'Surgical amputation of infected coronal pulp with placement of bioactive MTA barrier over vital radicular stumps.',
    clinicalTip: 'Gold standard for preserving primary molar vitality until normal exfoliation.'
  },
  'Crown — Monolithic Zirconia': {
    title: 'Full-Coverage Crown Restoration (Monolithic Zirconia / PFM)',
    meaning: 'Full anatomical 360° crown cemented over prepared tooth abutment to restore complete masticatory load bearing.',
    clinicalTip: 'Check occlusal clearance and evaluate marginal seal with explorer.'
  },
  'Fixed Partial Denture (Bridge)': {
    title: 'Fixed Partial Denture Bridge / Pontic Unit',
    meaning: 'Fixed multi-unit prosthetic restoration anchored on prepared abutments replacing an edentulous space.',
    clinicalTip: 'Emphasize superfloss hygiene under the pontic intaglio surface.'
  },
  'Removable Prosthesis (Denture)': {
    title: 'Removable Prosthesis (Partial / Complete Denture)',
    meaning: 'Mucosa and tooth-supported removable prosthetic appliance replacing multiple missing teeth.',
    clinicalTip: 'Evaluate clasps, tissue seat, and patient adaptation.'
  },
  'Post & Core Build-Up': {
    title: 'Endodontic Post & Core Crown Foundation',
    meaning: 'Custom fiber or cast metal post cemented into canal with composite core foundation providing crown retention.',
    clinicalTip: 'Ensure a minimum 2mm circumferential ferrule effect on natural tooth structure.'
  },
  'Gum Recession': {
    title: 'Gingival Margin Recession & Root Exposure',
    meaning: 'Apical migration of the marginal gingival tissue exposing the root cementum (Miller Class I–IV).',
    clinicalTip: 'Monitor root exposure; subepithelial connective tissue graft indicated for progressive recession.'
  },
  'Periodontal Bone Loss': {
    title: 'Alveolar Bone Resorption & Furcation Involvement',
    meaning: 'Inflammatory breakdown of alveolar bone crest with probing pocket depths ≥5mm and furcation exposure.',
    clinicalTip: 'Indicated for Scaling & Root Planing (SRP D4341) and periodontal maintenance recall.'
  },
  'Pathologic Tooth Mobility': {
    title: 'Pathologic Clinical Tooth Mobility (Grade I–III)',
    meaning: 'Abnormal horizontal or vertical displacement of tooth within alveolar socket due to attachment loss or trauma.',
    clinicalTip: 'Perform occlusal adjustment; periodontal splinting indicated if masticatory discomfort.'
  },
  'Dental Implant': {
    title: 'Endosseous Titanium Dental Implant',
    meaning: 'Biocompatible titanium fixture surgically integrated into alveolar bone supporting an implant crown abutment.',
    clinicalTip: 'Monitor peri-implant bone levels and probing depths during annual recall.'
  },
  'Extracted / Missing': {
    title: 'Extracted / Congenitally Absent Tooth Unit',
    meaning: 'Tooth unit is physically missing from dental arch; alveolar ridge healed.',
    clinicalTip: 'Discuss prosthetic replacement (implant, bridge) or orthodontic space closure.'
  },
  'Ortho Malocclusion': {
    title: 'Orthodontic Malocclusion (Class II/III / Open Bite)',
    meaning: 'Anatomical arch discrepancy, deep overbite, crossbite, or vertical open bite requiring orthodontic alignment.',
    clinicalTip: 'Synchronized with Ortho & TMJ Diagnostic Suite. Leveling and bite realignment indicated.'
  },
  'Diastema (Midline Space)': {
    title: 'Interdental Spacing / Midline Diastema',
    meaning: 'Visible space or gap between adjacent teeth resulting from tooth-arch discrepancy or low labial frenum attachment.',
    clinicalTip: 'Evaluate frenum insertion; closure via direct composite bonding, ceramic veneers, or orthodontics.'
  },
  'Dental Crowding': {
    title: 'Dental Arch Crowding & Overlap',
    meaning: 'Discrepancy between tooth size and arch perimeter causing overlapping, rotated, or displaced teeth.',
    clinicalTip: 'Orthodontic expansion, interproximal reduction (IPR), or selective extraction indicated.'
  },
  'Tooth Axial Rotation': {
    title: 'Tooth Axial Malposition / Rotation',
    meaning: 'Tooth rotated along its long longitudinal axis out of normal dental arch curve.',
    clinicalTip: 'Orthodontic torque and rotational couples indicated to align contact points.'
  },
  'Cracked Enamel': {
    title: 'Cracked Tooth Syndrome (Incomplete Fracture)',
    meaning: 'Incomplete fracture plane extending through coronal enamel and dentin causing sharp pain on release of chewing pressure.',
    clinicalTip: 'Cuspal coverage crown restoration indicated to bind tooth structure and prevent split fracture.'
  },
  'Chipped / Fractured Enamel': {
    title: 'Chipped / Traumatic Incisal-Coronal Fracture',
    meaning: 'Traumatic loss of incisal enamel or cuspal fracture without pulpal exposure (Ellis Class I/II).',
    clinicalTip: 'Direct composite bevel restoration or aesthetic edge bonding indicated.'
  },
  'Occlusal Attrition': {
    title: 'Severe Bruxism / Occlusal Wear Facets',
    meaning: 'Mechanical loss of occlusal and incisal tooth substance from chronic nighttime clenching and grinding.',
    clinicalTip: 'Custom hard-acrylic nocturnal occlusal splint (nightguard CDT D9944) indicated.'
  },
  'Root Resorption': {
    title: 'Internal / External Root Resorption',
    meaning: 'Progressive osteoclastic loss of radicular root dentin and cementum.',
    clinicalTip: 'Obtain 3D CBCT imaging to evaluate resorption lacuna and periodontal ligament integrity.'
  },
  'Impacted Tooth (Wisdom/Canine)': {
    title: 'Impacted Tooth (Wisdom Molar / Palatal Canine)',
    meaning: 'Tooth prevented from complete eruption into functional position by adjacent teeth, bone, or dense soft tissue.',
    clinicalTip: 'Evaluate proximity to Inferior Alveolar Nerve (IAN) via OPG; surgical extraction (CDT D7230/D7240).'
  },
  'Periapical Cyst': {
    title: 'Periapical Radicular Cyst / Osteolytic Lesion',
    meaning: 'Epithelium-lined chronic pathological cavity at root apex associated with non-vital necrotic tooth.',
    clinicalTip: 'Root canal therapy followed by surgical enucleation / apicoectomy if lesion fails to resolve.'
  },
  'Stainless Steel Crown (SSC)': {
    title: 'Preformed Stainless Steel Crown (SSC)',
    meaning: 'Full-coronal restoration for primary molars with multi-surface caries or following pulp therapy (CDT D2930).',
    clinicalTip: 'Gold standard for pediatric longevity; naturally exfoliates with the deciduous tooth.'
  },
  'Pediatric Zirconia Crown': {
    title: 'Pediatric Aesthetic Strip / Zirconia Crown',
    meaning: 'Tooth-colored aesthetic full-coverage restoration for primary incisors or molars (CDT D2934).',
    clinicalTip: 'Biocompatible, plaque-resistant, and provides superior anterior aesthetics for pediatric patients.'
  },
  'Space Maintainer': {
    title: 'Fixed Space Maintainer (Band & Loop)',
    meaning: 'Fixed orthodontic appliance to preserve arch perimeter after premature loss of primary molar (CDT D1510).',
    clinicalTip: 'Prevents mesial drift of adjacent permanent 1st molar; check cement seal every 6 months.'
  },
  'Distal Shoe Space Maintainer': {
    title: 'Distal Shoe Intra-Alveolar Maintainer',
    meaning: 'Subgingival appliance guiding eruption of unerupted 1st permanent molar following premature loss of primary 2nd molar (CDT D1515).',
    clinicalTip: 'Radiographic verification required to confirm guide extension is positioned against mesial surface of unerupted molar.'
  },
  'Habit Appliance': {
    title: 'Pediatric Habit-Breaking Appliance',
    meaning: 'Fixed or removable palatal crib to terminate chronic non-nutritive thumb sucking or tongue thrust (CDT D8220).',
    clinicalTip: 'Intercepts development of anterior open bite and maxillary constriction.'
  },
  'Early Childhood Caries (ECC)': {
    title: 'Early Childhood Caries (ECC / Bottle Caries)',
    meaning: 'Severe, virulent demineralization of primary teeth in infants and young children under age 6.',
    clinicalTip: 'Institute immediate dietary counseling, topical fluoride varnish (CDT D1206), and SDF arrest therapy.'
  },
  'Pulpectomy (Resorbable)': {
    title: 'Pediatric Pulpectomy with Resorbable Filling',
    meaning: 'Complete root canal debridement and obturation using resorbable paste (Vitapex / ZOE) allowing physiological root resorption (CDT D3230).',
    clinicalTip: 'Contraindicated with standard gutta-percha to avoid blocking permanent tooth eruption.'
  },
  'Pulp Capping': {
    title: 'Pediatric Direct / Indirect Pulp Capping',
    meaning: 'Application of biocompatible calcium silicate / MTA medicament to preserve pulp vitality in deep primary lesions (CDT D3110).',
    clinicalTip: 'Indicated only in asymptomatic teeth with absence of radicular pathology.'
  },
  'Exfoliated / Shedding': {
    title: 'Physiological Primary Tooth Exfoliation',
    meaning: 'Natural shedding of primary tooth caused by physiological osteoclastic root resorption as succedaneous permanent tooth erupts.',
    clinicalTip: 'Record as naturally shed baseline; verify symmetrical eruption of permanent successor.'
  },
  'Fluoride Varnish / SDF': {
    title: 'Topical Fluoride Varnish & Silver Diamine Fluoride (SDF)',
    meaning: 'Non-invasive remineralization and caries arrest therapy applied topically to primary enamel and dentin (CDT D1206 / D1354).',
    clinicalTip: 'Arrests active dentinal decay and provides high-concentration fluoride reservoir.'
  }
};

export default function ToothQuickPresetSelector({
  isPediatric,
  tNum,
  tKey,
  toothData,
  handleSaveObservation,
  setActivePaletteItem
}) {
  const targetCategories = isPediatric ? PEDIATRIC_CLINICAL_PRESET_CATEGORIES : CLINICAL_PRESET_CATEGORIES;
  const allPresets = isPediatric ? ALL_PEDIATRIC_PRESETS : ALL_33_CLINICAL_PRESETS;

  const [activeCategoryId, setActiveCategoryId] = useState(isPediatric ? 'p_restorative' : 'pathology');

  useEffect(() => {
    setActiveCategoryId(isPediatric ? 'p_restorative' : 'pathology');
  }, [isPediatric]);

  // Map each condition ID to standard detection regex
  const isPresetSelected = (cid) => {
    if (!toothData) return false;
    const s = (toothData.status || '').toLowerCase();
    const c = (toothData.comments || '').toLowerCase();
    const fullText = `${s} ${c}`;

    if (cid === 'Healthy') {
      return (s === 'healthy' || s === 'sound' || s.includes('intact primary')) && 
             !fullText.includes('caries') && 
             !fullText.includes('decay') && 
             !fullText.includes('clean') && 
             !fullText.includes('scaling') && 
             !fullText.includes('calculus') && 
             !fullText.includes('tartar') && 
             !fullText.includes('rct') && 
             !fullText.includes('crown') && 
             !fullText.includes('bone loss') && 
             !fullText.includes('recession') &&
             !fullText.includes('cyst') &&
             !fullText.includes('implant') &&
             !fullText.includes('missing') &&
             !fullText.includes('extracted') &&
             !fullText.includes('space maintainer');
    }

    if (cid === 'Cleaning Needed') {
      return fullText.includes('clean') || fullText.includes('scaling') || fullText.includes('calculus') || fullText.includes('tartar') || fullText.includes('prophylaxis');
    }

    // Pediatric Specific Conditions
    if (cid === 'Space Maintainer') {
      return fullText.includes('space maintainer') || fullText.includes('band and loop') || fullText.includes('space');
    }
    if (cid === 'Stainless Steel Crown (SSC)') {
      return fullText.includes('ssc') || fullText.includes('stainless steel crown') || (fullText.includes('crown') && isPediatric && !fullText.includes('strip'));
    }
    if (cid === 'Pediatric Zirconia Crown') {
      return fullText.includes('strip crown') || (fullText.includes('zirconia') && isPediatric);
    }
    if (cid === 'Early Childhood Caries (ECC)') {
      return fullText.includes('ecc') || fullText.includes('bottle') || fullText.includes('early childhood');
    }
    if (cid === 'Pulpectomy (Resorbable)') {
      return fullText.includes('pulpectomy') || fullText.includes('vitapex');
    }
    if (cid === 'Pulp Capping') {
      return fullText.includes('pulp cap') || fullText.includes('capping');
    }
    if (cid === 'Exfoliated / Shedding') {
      return fullText.includes('exfoliat') || fullText.includes('shedding');
    }
    if (cid === 'Fluoride Varnish / SDF') {
      return fullText.includes('fluoride') || fullText.includes('sdf') || fullText.includes('varnish');
    }
    if (cid === 'Distal Shoe Space Maintainer') {
      return fullText.includes('distal shoe');
    }
    if (cid === 'Habit Appliance') {
      return fullText.includes('habit');
    }

    // Standard Conditions
    if (cid === 'Dentin Hypersensitivity') {
      return fullText.includes('sensitivity') || fullText.includes('sensitive') || fullText.includes('hypersensitivity');
    }
    if (cid === 'Filling — GIC') {
      return fullText.includes('gic') || fullText.includes('glass ionomer');
    }
    if (cid === 'Pit & Fissure Sealant') {
      return fullText.includes('sealant') || fullText.includes('varnish');
    }
    if (cid === 'Inlay / Onlay Restoration') {
      return fullText.includes('inlay') || fullText.includes('onlay');
    }
    if (cid === 'Ceramic Veneer') {
      return fullText.includes('veneer');
    }
    if (cid === 'Periapical Abscess') {
      return fullText.includes('abscess') || fullText.includes('pus') || fullText.includes('swelling');
    }
    if (cid === 'Pulpotomy (MTA)') {
      return fullText.includes('pulpotomy') || fullText.includes('mta');
    }
    if (cid === 'Fixed Partial Denture (Bridge)') {
      return fullText.includes('bridge') || fullText.includes('pontic');
    }
    if (cid === 'Removable Prosthesis (Denture)') {
      return fullText.includes('denture') || fullText.includes('partial denture');
    }
    if (cid === 'Post & Core Build-Up') {
      return fullText.includes('post and core') || fullText.includes('post & core') || fullText.includes('post build');
    }
    if (cid === 'Pathologic Tooth Mobility') {
      return fullText.includes('mobility') || fullText.includes('mobile');
    }
    if (cid === 'Diastema (Midline Space)') {
      return fullText.includes('diastema') || fullText.includes('gap') || fullText.includes('midline space');
    }
    if (cid === 'Dental Crowding') {
      return fullText.includes('crowding') || fullText.includes('crowded');
    }
    if (cid === 'Tooth Axial Rotation') {
      return fullText.includes('rotation') || fullText.includes('rotated');
    }
    if (cid === 'Chipped / Fractured Enamel') {
      return fullText.includes('chipped') || fullText.includes('fractured') || fullText.includes('ellis');
    }
    if (cid === 'Impacted Tooth (Wisdom/Canine)') {
      return fullText.includes('impacted') || fullText.includes('impaction');
    }
    if (cid === 'Periapical Cyst') {
      return fullText.includes('cyst') || fullText.includes('radicular cyst');
    }
    if (cid === 'Periodontal Bone Loss') {
      return fullText.includes('bone loss') || fullText.includes('furcation');
    }
    if (cid === 'Root Resorption') {
      return fullText.includes('resorption');
    }
    if (cid === 'Occlusal Attrition') {
      return fullText.includes('attrition') || fullText.includes('bruxism') || fullText.includes('wear facet') || fullText.includes('grinding');
    }
    if (cid === 'Gum Recession') {
      return fullText.includes('recession');
    }
    if (cid === 'Cracked Enamel') {
      return fullText.includes('crack') || fullText.includes('craze');
    }
    if (cid === 'Ortho Malocclusion') {
      return fullText.includes('ortho') || fullText.includes('malocclusion') || fullText.includes('overbite') || fullText.includes('crossbite') || fullText.includes('underbite') || fullText.includes('open bite');
    }
    if (cid === 'Crown — Monolithic Zirconia') {
      return (fullText.includes('crown') || fullText.includes('zirconia') || fullText.includes('pfm') || fullText.includes('cap') || fullText.includes('ssc')) && !fullText.includes('strip crown');
    }
    if (cid === 'Dental Implant') {
      return fullText.includes('implant');
    }
    if (cid === 'Extracted / Missing') {
      return fullText.includes('miss') || fullText.includes('extract') || fullText.includes('absent') || fullText.includes('exfoliat');
    }
    if (cid === 'Root Canal (RCT)') {
      return fullText.includes('root canal') || /\brct\b/i.test(fullText) || (fullText.includes('endo') && !fullText.includes('endosseous'));
    }
    if (cid === 'Filling — Amalgam') {
      return fullText.includes('amalgam');
    }
    if (cid === 'Filling — Composite (O)') {
      return (fullText.includes('composite') || fullText.includes('resin') || fullText.includes('filling')) && !fullText.includes('amalgam') && !fullText.includes('gic');
    }
    if (cid.includes('Caries')) {
      if (cid.includes('MOD')) return /\bmod\b|mesio-occlusal-distal/i.test(fullText);
      if (cid.includes('DO')) return (/\bdo\b(?!ctor)/i.test(fullText) && !/\bdoctor\b|\bdob\b/i.test(fullText.replace(/\bdo\b/gi, ''))) || fullText.includes('disto-occlusal');
      if (cid.includes('MO')) return (/\bmo\b/i.test(fullText) && !/\bmolar\b|\bmobility\b/i.test(fullText.replace(/\bmo\b/gi, '')) && !/\bmod\b/i.test(fullText)) || fullText.includes('mesio-occlusal');
      if (cid.includes('Class V')) return fullText.includes('class v') || fullText.includes('cervical');
      if (cid.includes('Lingual Pit')) return fullText.includes('lingual pit') || fullText.includes('palatal pit');
      if (cid.includes('O')) return (/\b(o)\b|— o\b|occlusal/i.test(fullText) && !/\bmod\b|\bdo\b|\bmo\b/i.test(fullText) && !fullText.includes('class v') && !fullText.includes('lingual pit'));
      return fullText.includes('caries') || fullText.includes('decay') || fullText.includes('cavity');
    }

    return false;
  };

  // Find the active preset
  const activePreset = allPresets.find(cond => isPresetSelected(cond.id)) || {
    id: toothData?.status || 'Healthy',
    label: toothData?.status || 'Healthy Enamel',
    color: toothData?.color || getHexColor(toothData?.status || 'Healthy'),
    cdt: 'D0120'
  };

  // Auto-switch category to match current tooth finding
  useEffect(() => {
    if (!toothData) return;
    const matchingCat = targetCategories.find(cat =>
      cat.presets.some(p => isPresetSelected(p.id))
    );
    if (matchingCat) {
      setActiveCategoryId(matchingCat.id);
    }
  }, [toothData?.status, toothData?.comments, isPediatric]);

  const activeDetail = PRESET_CLINICAL_DESCRIPTIONS[activePreset?.id] || {
    title: activePreset?.label || activePreset?.id || 'Active Clinical Observation',
    meaning: `Actively recorded clinical condition in patient electronic health record for ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}.`,
    clinicalTip: 'Documented in odontogram and synchronized across patient treatment plan.'
  };

  const handleApplyPreset = (cond) => {
    let matchingPalette = 'Healthy';
    const cid = cond.id;
    if (cid.includes('Healthy')) matchingPalette = 'Healthy';
    else if (cid.includes('Space Maintainer')) matchingPalette = 'Space Maintainer';
    else if (cid.includes('Stainless Steel') || cid.includes('SSC')) matchingPalette = 'Stainless Steel Crown (SSC)';
    else if (cid.includes('Pulpotomy')) matchingPalette = 'Pulpotomy (MTA)';
    else if (cid.includes('Pulpectomy')) matchingPalette = 'Pulpectomy (Resorbable)';
    else if (cid.includes('Early Childhood') || cid.includes('ECC')) matchingPalette = 'Caries (Decay)';
    else if (cid.includes('Ortho') || cid.includes('Diastema') || cid.includes('Crowding') || cid.includes('Rotation')) matchingPalette = 'Ortho Malocclusion';
    else if (cid.includes('Crown') || cid.includes('Bridge') || cid.includes('Post')) matchingPalette = 'Crown (Zirconia / PFM)';
    else if (cid.includes('Caries')) matchingPalette = 'Caries (Decay)';
    else if (cid.includes('Composite') || cid.includes('GIC') || cid.includes('Sealant') || cid.includes('Inlay') || cid.includes('Veneer') || cid.includes('Fluoride')) matchingPalette = 'Composite Filling';
    else if (cid.includes('Amalgam')) matchingPalette = 'Amalgam';
    else if (cid.includes('Root Canal') || cid.includes('Abscess')) matchingPalette = 'Root Canal (RCT)';
    else if (cid.includes('Implant')) matchingPalette = 'Dental Implant';
    else if (cid.includes('Extracted') || cid.includes('Missing') || cid.includes('Exfoliated')) matchingPalette = 'Extracted / Missing';

    if (setActivePaletteItem) {
      setActivePaletteItem(matchingPalette);
    }

    if (handleSaveObservation) {
      handleSaveObservation(
        cond.id,
        `Clinical diagnosis: ${cond.label} (${cond.cdt}) recorded on ${isPediatric ? `Primary Tooth ${tKey}` : `Tooth #${tNum}`}`,
        cond.color
      );
    }
  };

  const currentCategory = targetCategories.find(c => c.id === activeCategoryId) || targetCategories[0];

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 shadow-sm space-y-4 animate-fade-in">
      {/* 1. Header with Patient Dentition Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shadow-xs">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#10244B] uppercase tracking-wider flex items-center gap-2">
              Clinical Condition & Preset Selector
            </h3>
            <p className="text-[10.5px] font-bold text-muted-text mt-0.5">
              {isPediatric
                ? '21 Verified Pediatric Presets across 5 Specialties (AAPD Standard)'
                : '33 Verified Clinical Presets across 7 Specialties'}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${
          isPediatric ? 'bg-pink-50 text-rose-700 border-pink-200' : 'bg-blue-50 text-[#2563EB] border-blue-200'
        }`}>
          {isPediatric ? `👶 Pediatric Protocol (Primary Tooth ${tKey})` : `🦷 Adult Protocol (Tooth #${tNum})`}
        </span>
      </div>

      {/* 2. Specialty Categories (Clean Wrapping Pills - Zero Overlap) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#4A7CD2]" />
            <span>Select Category:</span>
          </span>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
            Active: {currentCategory.name}
          </span>
        </div>

        {/* Natural Flex-Wrap Category Pills (Never squished, Never cut off) */}
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#F8FAFC] rounded-2xl border border-slate-200">
          {targetCategories.map(cat => {
            const isCatActive = activeCategoryId === cat.id;
            const hasActivePreset = cat.presets.some(p => isPresetSelected(p.id));

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                  isCatActive
                    ? 'bg-[#10244B] text-white border-[#10244B] shadow-sm font-black ring-2 ring-blue-500/20 scale-[1.02]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-[#EFF6FF] hover:border-blue-200 hover:text-blue-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.shortName}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                  isCatActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {cat.presets.length}
                </span>
                {hasActivePreset && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Spacious 2-Column Grid for Selected Category (Zero Truncation) */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentCategory.presets.map(cond => {
            const isSelected = isPresetSelected(cond.id);
            return (
              <button
                key={cond.id}
                type="button"
                onClick={() => handleApplyPreset(cond)}
                className={`p-3 rounded-2xl text-left border transition-all duration-150 cursor-pointer relative flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#4A7CD2] text-white border-[#3B6DBE] shadow-md font-black ring-2 ring-[#4A7CD2]/40 scale-[1.01] z-10'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-[#F0F7FF] hover:border-blue-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{cond.icon || '🦷'}</span>
                  <span className={`text-xs font-bold leading-snug ${isSelected ? 'text-white font-black' : 'text-slate-900'}`}>
                    {cond.label}
                  </span>
                </div>

                <div className="shrink-0 flex items-center">
                  {isSelected ? (
                    <span className="text-[8.5px] uppercase tracking-wider font-black bg-white/25 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                      {cond.cdt}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Clinical Diagnosis Card (Bottom Summary) */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/90 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#1E40AF] text-xs">
              Protocol: {activeDetail.title || activePreset.label}
            </span>
          </div>
          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 shadow-2xs">
            CDT {activePreset.cdt || 'D0120'}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
          {activeDetail.clinicalTip}
        </p>
      </div>
    </div>
  );
}

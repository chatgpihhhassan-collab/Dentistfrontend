import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Copy, Check, Printer, Download, ExternalLink, 
  Mic, Sparkles, ArrowLeft, Layers, ShieldCheck, Activity, HelpCircle,
  FileText, CheckCircle2, ChevronRight, Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClinicalGuidePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedPrompt, setCopiedPrompt] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2500);
  };

  // Structured data directly extracted from "Verification Results - Chatbot vs Manual UI Mapping.docx"
  const restorativeAdultData = [
    { query: "Tooth 7 occlusal composite restoration shade A2", surface: "O", cdt: "D2391", status: "Filling — Composite (O)", manual: "Click O surface ➔ Select Composite Filling", category: "restorative" },
    { query: "Tooth 8 mesio-occlusal composite resin filling", surface: "MO", cdt: "D2392", status: "Filling — Composite (MO)", manual: "Select Composite Filling ➔ Surfaces M + O", category: "restorative" },
    { query: "Tooth 9 disto-occlusal composite filling with tight contact", surface: "DO", cdt: "D2392", status: "Filling — Composite (DO)", manual: "Select Composite Filling ➔ Surfaces D + O", category: "restorative" },
    { query: "Tooth 10 MOD composite restoration", surface: "MOD", cdt: "D2393", status: "Filling — Composite (MOD)", manual: "Select Composite Filling ➔ Surfaces M + O + D", category: "restorative" },
    { query: "Tooth 11 occlusal amalgam filling with intact margins", surface: "O", cdt: "D2391", status: "Filling — Amalgam (O)", manual: "Select Amalgam Restoration ➔ Surface O", category: "restorative" },
    { query: "Tooth 12 MOD amalgam restoration", surface: "MOD", cdt: "D2393", status: "Filling — Amalgam (MOD)", manual: "Select Amalgam Restoration ➔ Surfaces M + O + D", category: "restorative" },
    { query: "Tooth 13 disto-occlusal amalgam filling", surface: "DO", cdt: "D2392", status: "Filling — Amalgam (DO)", manual: "Select Amalgam Restoration ➔ Surfaces D + O", category: "restorative" },
    { query: "Tooth 14 class V cervical GIC restoration", surface: "Class V", cdt: "D2391", status: "Filling — GIC (Class V)", manual: "Select Glass Ionomer (GIC) ➔ Surface B / Class V", category: "restorative" },
    { query: "Tooth 15 lingual composite restoration", surface: "L", cdt: "D2391", status: "Filling — Composite (L)", manual: "Select Composite Filling ➔ Surface L", category: "restorative" },
    { query: "Tooth 16 preventive pit and fissure sealant applied", surface: "O", cdt: "D1351", status: "Pit & Fissure Sealant", manual: "Select Pit & Fissure Sealant ➔ Surface O", category: "restorative" }
  ];

  const endodonticData = [
    { query: "Tooth 17 completed root canal treatment obturated with gutta-percha", surface: "Crown / Roots", cdt: "D3330", status: "Root Canal Treated (RCT)", manual: "Preset: Root Canal (RCT Endo)", category: "endodontic" },
    { query: "Tooth 18 RCT with 4mm periapical radiolucency at apex", surface: "Apex", cdt: "D3330", status: "RCT with Periapical Lesion", manual: "Preset: Root Canal (RCT) + Note: 4mm lesion", category: "endodontic" },
    { query: "Tooth 19 RCT with custom cast post and core", surface: "Chamber / Root", cdt: "D2952", status: "Post & Core Build-Up (RCT)", manual: "Preset: Post & Core Build-Up", category: "endodontic" },
    { query: "Tooth 20 RCT with prefabricated fiber post and core buildup", surface: "Chamber / Root", cdt: "D2952", status: "Post & Core Build-Up (RCT)", manual: "Preset: Post & Core Build-Up", category: "endodontic" },
    { query: "Tooth 21 vital pulp exposure from traumatic fracture", surface: "Pulp", cdt: "D3221", status: "Vital Pulp Exposure / Pulpectomy", manual: "Preset: Vital Pulp Exposure / Pulpectomy", category: "endodontic" },
    { query: "Tooth 22 symptomatic irreversible pulpitis", surface: "Pulp", cdt: "D3330", status: "Symptomatic Irreversible Pulpitis", manual: "Preset: Root Canal (RCT) / Pulpitis indicator", category: "endodontic" },
    { query: "Tooth 23 pulpectomy completed, calcium hydroxide placed", surface: "Canal", cdt: "D3221", status: "Vital Pulp Exposure / Pulpectomy", manual: "Preset: Vital Pulp Exposure / Pulpectomy", category: "endodontic" },
    { query: "Tooth 24 apical periodontitis with localized percussion tenderness", surface: "Apex", cdt: "D3999", status: "Apical Periodontitis", manual: "Preset: Periapical Abscess / Lesion", category: "endodontic" },
    { query: "Tooth 25 chronic periapical granuloma at root apex", surface: "Apex", cdt: "D3999", status: "Chronic Periapical Granuloma", manual: "Preset: Periapical Abscess / Lesion", category: "endodontic" },
    { query: "Tooth 26 apicoectomy performed with retrograde MTA root-end fill", surface: "Apex / Retrograde", cdt: "D3410", status: "Apicoectomy & Retrograde MTA Fill", manual: "Preset: Apicoectomy / MTA Retrofill", category: "endodontic" }
  ];

  const prosthodonticData = [
    { query: "Tooth 27 full monolithic zirconia crown", surface: "Full Crown", cdt: "D2740", status: "Crown — Monolithic Zirconia", manual: "Preset: Crown (Full Coverage) (Zirconia)", category: "prosthodontic" },
    { query: "Tooth 28 porcelain-fused-to-metal PFM crown", surface: "Full Crown", cdt: "D2740", status: "Crown — PFM (Porcelain Fused to Metal)", manual: "Preset: Crown (Full Coverage) (PFM)", category: "prosthodontic" },
    { query: "Tooth 29 full cast gold metal crown", surface: "Full Crown", cdt: "D2740", status: "Crown — Full Cast Gold Metal", manual: "Preset: Crown (Full Coverage) (Gold)", category: "prosthodontic" },
    { query: "Tooth 30 porcelain laminate veneer on facial surface", surface: "B (Facial)", cdt: "D2962", status: "Ceramic Veneer", manual: "Preset: Porcelain Veneer", category: "prosthodontic" },
    { query: "Tooth 31 ceramic onlay covering functional cusps", surface: "Occlusal Cusps", cdt: "D2543", status: "Onlay — Ceramic", manual: "Preset: Inlay / Onlay Cast", category: "prosthodontic" },
    { query: "Tooth 32 composite inlay on MOD surfaces", surface: "MOD", cdt: "D2510", status: "Inlay — MOD", manual: "Preset: Inlay / Onlay Cast ➔ Surfaces MOD", category: "prosthodontic" },
    { query: "Tooth 1 endocrown ceramic restoration", surface: "Crown / Chamber", cdt: "D2740", status: "Endocrown Ceramic", manual: "Preset: Endocrown Ceramic", category: "prosthodontic" },
    { query: "Tooth 2 provisional temporary acrylic crown cemented", surface: "Full Crown", cdt: "D2799", status: "Crown — Provisional Acrylic", manual: "Preset: Crown — Provisional Acrylic", category: "prosthodontic" },
    { query: "Tooth 3 fractured ceramic margin on existing PFM crown", surface: "Margin", cdt: "D2740", status: "Crown — PFM (Porcelain Fused to Metal)", manual: "Preset: Crown (Full Coverage) + Margin Note", category: "prosthodontic" },
    { query: "Tooth 4 dislodged crown, recementation required", surface: "Full Crown", cdt: "D2910", status: "Crown — Dislodged (Recementation Required)", manual: "Preset: Crown — Dislodged (Recementation)", category: "prosthodontic" }
  ];

  const surgicalData = [
    { query: "Tooth 5 missing congenitally / extracted previously", surface: "Socket", cdt: "D7140", status: "Missing / Extracted", manual: "Preset: Extracted / Absent", category: "surgical" },
    { query: "Tooth 6 severely decayed, extraction indicated", surface: "Crown / Roots", cdt: "D7210", status: "Extraction Indicated", manual: "Preset: Extracted / Absent ➔ Set Indicated", category: "surgical" },
    { query: "Tooth 7 fractured root, planned for surgical extraction", surface: "Root", cdt: "D7210", status: "Extraction Indicated", manual: "Preset: Extracted / Absent ➔ Set Indicated", category: "surgical" },
    { query: "Tooth 8 replaced by dental implant with screw-retained zirconia crown", surface: "Fixture & Crown", cdt: "D6010 / D6058", status: "Dental Implant (Screw-Retained Zirconia Crown)", manual: "Preset: Dental Implant Unit", category: "surgical" },
    { query: "Tooth 9 dental implant placed, healing abutment in situ", surface: "Fixture & Abutment", cdt: "D6010 / D6058", status: "Dental Implant (Titanium Fixture)", manual: "Preset: Dental Implant Unit", category: "surgical" },
    { query: "Tooth 10 retained root tip in alveolar ridge", surface: "Ridge", cdt: "D7250", status: "Retained Root Tip", manual: "Preset: Retained Root Tip", category: "surgical" },
    { query: "Tooth 11 horizontally impacted wisdom tooth in bone", surface: "Bony Impaction", cdt: "D7230", status: "Impacted Tooth (Horizontal)", manual: "Preset: Impacted Tooth (Horizontal)", category: "surgical" },
    { query: "Tooth 12 mesioangular impacted tooth with coronal pericoronitis", surface: "Coronal / Bone", cdt: "D7230", status: "Impacted Tooth (Mesioangular)", manual: "Preset: Impacted Tooth (Mesioangular)", category: "surgical" },
    { query: "Tooth 13 distoangular impacted tooth", surface: "Bony Impaction", cdt: "D7230", status: "Impacted Tooth (Distoangular)", manual: "Preset: Impacted Tooth (Distoangular)", category: "surgical" },
    { query: "Tooth 14 vertically impacted deep in bone", surface: "Bony Impaction", cdt: "D7230", status: "Impacted Tooth (Vertical)", manual: "Preset: Impacted Tooth (Vertical)", category: "surgical" }
  ];

  const periodontalData = [
    { query: "Tooth 15 grade 1 mobility with physiologic fremitus", surface: "Socket / Fremitus", cdt: "D4342", status: "Mobility Grade I", manual: "Preset: Tooth Mobility (I-III) ➔ Grade 1", category: "periodontal" },
    { query: "Tooth 16 grade 2 mobility with 3mm bone loss", surface: "Alveolar Crest", cdt: "D4342", status: "Mobility Grade II", manual: "Preset: Tooth Mobility (I-III) ➔ Grade 2", category: "periodontal" },
    { query: "Tooth 17 grade 3 mobility with depressibility in socket", surface: "Axial Socket", cdt: "D4342", status: "Mobility Grade III", manual: "Preset: Tooth Mobility (I-III) ➔ Grade 3", category: "periodontal" },
    { query: "Tooth 18 2mm gingival recession on facial surface", surface: "B (Facial)", cdt: "D4341", status: "Gingival Recession (2mm)", manual: "Preset: Gingival Recession ➔ 2mm", category: "periodontal" },
    { query: "Tooth 19 4mm severe gingival recession with root sensitivity", surface: "B (Facial)", cdt: "D4341", status: "Gingival Recession (4mm)", manual: "Preset: Gingival Recession ➔ 4mm", category: "periodontal" },
    { query: "Tooth 20 heavy subgingival calculus band around cervical margin", surface: "Cervical", cdt: "D1110", status: "Subgingival Calculus Band", manual: "Preset: Cleaning & Scaling Needed", category: "periodontal" },
    { query: "Tooth 21 class II furcation defect on buccal root", surface: "Buccal Furcation", cdt: "D4341", status: "Furcation Defect (Class II)", manual: "Preset: Bone Loss (Furcation)", category: "periodontal" },
    { query: "Tooth 22 45 degree mesiopalatal rotation", surface: "Axial Orientation", cdt: "D8080", status: "Tooth Axial Rotation", manual: "Tooth Detail: Rotation angle slider ➔ 45°", category: "periodontal" },
    { query: "Tooth 23 orthodontic bracket bonded on facial surface", surface: "B (Facial)", cdt: "D8080", status: "Orthodontic Bracket Bonded", manual: "Tooth Detail: Orthodontic Bracket toggle", category: "periodontal" },
    { query: "Tooth 24 hairline enamel crack line without pulp involvement", surface: "Enamel", cdt: "D2740", status: "Fractured / Enamel Crack", manual: "Preset: Trauma / Enamel Crack", category: "periodontal" },
    { query: "Tooth 25 grade 1 mobility with physiologic fremitus", surface: "Socket / Fremitus", cdt: "D4342", status: "Mobility Grade I", manual: "Preset: Tooth Mobility (I-III) ➔ Grade 1", category: "periodontal" },
    { query: "Tooth 26 grade 2 mobility with 3mm bone loss", surface: "Alveolar Crest", cdt: "D4342", status: "Mobility Grade II", manual: "Preset: Tooth Mobility (I-III) ➔ Grade 2", category: "periodontal" },
    { query: "Tooth 27 grade 3 mobility with depressibility in socket", surface: "Axial Socket", cdt: "D4342", status: "Mobility Grade III", manual: "Preset: Tooth Mobility (I-III) ➔ Grade 3", category: "periodontal" },
    { query: "Tooth 28 2mm gingival recession on facial surface", surface: "B (Facial)", cdt: "D4341", status: "Gingival Recession (2mm)", manual: "Preset: Gingival Recession ➔ 2mm", category: "periodontal" },
    { query: "Tooth 29 4mm severe gingival recession with root sensitivity", surface: "B (Facial)", cdt: "D4341", status: "Gingival Recession (4mm)", manual: "Preset: Gingival Recession ➔ 4mm", category: "periodontal" },
    { query: "Tooth 30 heavy subgingival calculus band around cervical margin", surface: "Cervical", cdt: "D1110", status: "Subgingival Calculus Band", manual: "Preset: Cleaning & Scaling Needed", category: "periodontal" },
    { query: "Tooth 31 class II furcation defect on buccal root", surface: "Buccal Furcation", cdt: "D4341", status: "Furcation Defect (Class II)", manual: "Preset: Bone Loss (Furcation)", category: "periodontal" }
  ];

  const pediatricData = [
    { query: "Primary tooth A pulpotomy with MTA and SSC", surface: "Crown / Pulp", cdt: "D3220", status: "Pulpotomy (MTA) & SSC Crown", manual: "Switch to Pediatric Dentition ➔ Select Tooth A ➔ Preset: Pulpotomy (MTA)", category: "pediatric" },
    { query: "Primary tooth A mesio-occlusal composite restoration", surface: "MO", cdt: "D2392", status: "Filling — Composite (MO)", manual: "Pediatric Tooth A ➔ Select Composite Filling (M + O)", category: "pediatric" },
    { query: "Primary tooth A severe early childhood caries on buccal surface", surface: "B (Buccal)", cdt: "D0120", status: "Early Childhood Caries (ECC)", manual: "Pediatric Tooth A ➔ Preset: Early Childhood Caries (ECC)", category: "pediatric" },
    { query: "Primary tooth A stainless steel crown fitted", surface: "Full Crown", cdt: "D2930", status: "Stainless Steel Crown (SSC)", manual: "Pediatric Tooth A ➔ Preset: Stainless Steel Crown (SSC)", category: "pediatric" },
    { query: "Primary tooth A band and loop space maintainer indicated", surface: "Appliance", cdt: "D1510", status: "Space Maintainer (Band & Loop)", manual: "Pediatric Tooth A ➔ Preset: Space Maintainer (Band & Loop)", category: "pediatric" }
  ];

  const youngData = [
    // Restorative
    { query: "Tooth 1 MOD amalgam restoration", surface: "MOD", cdt: "D2393", status: "Filling — Amalgam (MOD)", manual: "Tooth #1 ➔ Amalgam ➔ Surfaces M + O + D", category: "young" },
    { query: "Tooth 2 MO composite filling", surface: "MO", cdt: "D2392", status: "Filling — Composite (MO)", manual: "Tooth #2 ➔ Composite ➔ Surfaces M + O", category: "young" },
    { query: "Tooth 3 DO composite filling", surface: "DO", cdt: "D2392", status: "Filling — Composite (DO)", manual: "Tooth #3 ➔ Composite ➔ Surfaces D + O", category: "young" },
    { query: "Tooth 4 occlusal composite filling", surface: "O", cdt: "D2391", status: "Filling — Composite (O)", manual: "Tooth #4 ➔ Composite ➔ Surface O", category: "young" },
    { query: "Tooth 5 cervical buccal amalgam restoration", surface: "Class V", cdt: "D2391", status: "Filling — Amalgam (Class V)", manual: "Tooth #5 ➔ Amalgam ➔ Surface B / Cervical", category: "young" },
    { query: "Tooth 6 MOD GIC glass ionomer restoration", surface: "MOD", cdt: "D2393", status: "Filling — GIC (MOD)", manual: "Tooth #6 ➔ GIC ➔ Surfaces M + O + D", category: "young" },
    { query: "Tooth 7 occlusal amalgam restoration", surface: "O", cdt: "D2391", status: "Filling — Amalgam (O)", manual: "Tooth #7 ➔ Amalgam ➔ Surface O", category: "young" },
    { query: "Tooth 8 cervical buccal GIC glass ionomer restoration", surface: "Class V", cdt: "D2391", status: "Filling — GIC (Class V)", manual: "Tooth #8 ➔ GIC ➔ Surface B / Cervical", category: "young" },
    { query: "Tooth 9 DO GIC glass ionomer restoration", surface: "DO", cdt: "D2392", status: "Filling — GIC (DO)", manual: "Tooth #9 ➔ GIC ➔ Surfaces D + O", category: "young" },
    { query: "Tooth 10 occlusal GIC glass ionomer restoration", surface: "O", cdt: "D2391", status: "Filling — GIC (O)", manual: "Tooth #10 ➔ GIC ➔ Surface O", category: "young" },
    { query: "Tooth 11 cervical buccal composite filling", surface: "Class V", cdt: "D2391", status: "Filling — Composite (Class V)", manual: "Tooth #11 ➔ Composite ➔ Surface B / Cervical", category: "young" },
    // Endodontic
    { query: "Tooth 12 root canal treatment with gutta percha obturation", surface: "Roots", cdt: "D3330", status: "Root Canal Treated (RCT)", manual: "Tooth #12 ➔ Preset: Root Canal (RCT)", category: "young" },
    { query: "Tooth 13 periapical abscess with radiolucent halo", surface: "Apex", cdt: "D7510", status: "Periapical Abscess", manual: "Tooth #13 ➔ Preset: Periapical Abscess", category: "young" },
    { query: "Tooth 14 vital pulp exposure on mesio-occlusal decay", surface: "MO / Pulp", cdt: "D3221", status: "Vital Pulp Exposure / Pulpectomy", manual: "Tooth #14 ➔ Preset: Vital Pulp Exposure", category: "young" },
    { query: "Tooth 15 calcified canals requiring endodontic surgery", surface: "Canals", cdt: "D3330", status: "Symptomatic Irreversible Pulpitis", manual: "Tooth #15 ➔ Preset: Root Canal Needed", category: "young" },
    // Surgical
    { query: "Tooth 16 titanium implant fixture with zirconia crown", surface: "Implant", cdt: "D6010 / D6058", status: "Dental Implant (Zirconia Crown)", manual: "Tooth #16 ➔ Preset: Dental Implant Unit", category: "young" },
    { query: "Tooth 17 indicated for surgical extraction", surface: "Tooth", cdt: "D7210", status: "Extraction Indicated", manual: "Tooth #17 ➔ Preset: Extracted / Absent (Indicated)", category: "young" },
    { query: "Tooth 18 extracted in dental history", surface: "Socket", cdt: "D7140", status: "Missing / Extracted", manual: "Tooth #18 ➔ Preset: Extracted / Absent", category: "young" },
    { query: "Tooth 19 retained root tip in alveolar crest", surface: "Crest", cdt: "D7250", status: "Retained Root Tip", manual: "Tooth #19 ➔ Preset: Retained Root Tip", category: "young" },
    // Pathology
    { query: "Tooth 20 Class V buccal cervical decay", surface: "Class V", cdt: "D2140", status: "Caries — Class V", manual: "Tooth #20 ➔ Preset: Caries (Class V)", category: "young" },
    { query: "Tooth 21 incipient enamel demineralization ICDAS 2", surface: "Enamel", cdt: "D2140", status: "Caries — Incipient (ICDAS 2)", manual: "Tooth #21 ➔ Preset: Caries (Occlusal)", category: "young" },
    { query: "Tooth 22 deep cavitated necrotic dentinal decay on occlusal", surface: "O", cdt: "D2140", status: "Caries — O (Deep Cavity)", manual: "Tooth #22 ➔ Preset: Caries (Occlusal)", category: "young" },
    { query: "Tooth 23 recurrent margin breakdown under existing restoration", surface: "Margin", cdt: "D2140", status: "Caries — Recurrent Margin Breakdown", manual: "Tooth #23 ➔ Preset: Caries (Recurrent Breakdown)", category: "young" },
    { query: "Tooth 24 mesial interproximal carious lesion", surface: "MO / M", cdt: "D2150", status: "Caries — M (Interproximal)", manual: "Tooth #24 ➔ Preset: Caries (Mesio-Occlusal)", category: "young" },
    // Periodontal
    { query: "Tooth 25 Grade 2 pathologic mobility with 6mm pocket", surface: "Socket", cdt: "D4342", status: "Mobility Grade II (6mm pocket)", manual: "Tooth #25 ➔ Set Mobility Grade II & 6mm pocket", category: "young" },
    { query: "Tooth 26 3mm gingival recession with exposed root", surface: "B (Facial)", cdt: "D4341", status: "Gingival Recession (3mm)", manual: "Tooth #26 ➔ Set Recession 3mm", category: "young" },
    { query: "Tooth 27 heavy subgingival calculus band on lingual", surface: "L", cdt: "D1110", status: "Subgingival Calculus Band", manual: "Tooth #27 ➔ Preset: Cleaning & Scaling Needed", category: "young" },
    { query: "Tooth 28 Grade 1 physiological mobility baseline", surface: "Socket", cdt: "D4342", status: "Mobility Grade I", manual: "Tooth #28 ➔ Set Mobility Grade I", category: "young" },
    { query: "Tooth 29 Grade 2 pathologic mobility with 6mm pocket", surface: "Socket", cdt: "D4342", status: "Mobility Grade II (6mm pocket)", manual: "Tooth #29 ➔ Set Mobility Grade II & 6mm pocket", category: "young" }
  ];

  const diagnosticSuitesData = [
    // Occlusion
    { suite: "Occlusion", query: "Patient presents with Angle Class II Division 1 malocclusion with 6mm overjet", target: "Occlusion Suite ➔ Deep Overbite (Angle Class II)", cdt: "D8080", visual: "Overbite slider set to 80%; anterior teeth #7-#10, #23-#26 highlighted in blue/purple", category: "suites" },
    { suite: "Occlusion", query: "Patient presents with Angle Class III underbite with anterior crossbite", target: "Occlusion Suite ➔ Class III Underbite", cdt: "D8080", visual: "Overjet slider set to -3.5mm; reverse overjet simulation activated", category: "suites" },
    { suite: "Occlusion", query: "Patient presents with Deep impinging overbite with palatal soft tissue contact", target: "Occlusion Suite ➔ Deep Overbite (Angle Class II)", cdt: "D8080", visual: "Overbite slider set to 80%; palatal contact warning rendered", category: "suites" },
    { suite: "Occlusion", query: "Patient presents with Anterior open bite secondary to tongue thrust habit", target: "Occlusion Suite ➔ Anterior Open Bite", cdt: "D8080", visual: "Vertical gap slider set to 4.5mm; tongue habit card displayed", category: "suites" },
    { suite: "Occlusion", query: "Patient presents with Right unilateral posterior crossbite on molars", target: "Occlusion Suite ➔ Posterior / Anterior Crossbite", cdt: "D8080", visual: "Molars #3, #14, #19, #30 highlighted; RPE expansion card displayed", category: "suites" },
    { suite: "Occlusion", query: "Patient presents with Edge to edge anterior incisal relationship", target: "Occlusion Suite ➔ Edge-to-Edge Anterior Incisal", cdt: "D8080", visual: "Edge-to-edge incisal alignment rendered; Class III tendency flag", category: "suites" },
    // TMJ
    { suite: "TMJ", query: "Diagnose right TMJ reciprocal clicking on opening and closing", target: "TMJ Suite ➔ Reciprocal Clicking", cdt: "D7880", visual: "Condyle translates to 35mm opening with animated 'click' wave pulse", category: "suites" },
    { suite: "TMJ", query: "Diagnose bilateral TMJ crepitus and osteoarthritis bone grinding", target: "TMJ Suite ➔ Crepitus & Osteoarthritis", cdt: "D7880", visual: "Degenerative condylar head remodeling textured with crepitus sounds", category: "suites" },
    { suite: "TMJ", query: "Diagnose acute trismus with maximum mouth opening limited to 26mm", target: "TMJ Suite ➔ Acute Trismus (<28mm)", cdt: "D7880", visual: "Jammed disc blocks forward condyle translation; 'Hard Stop' barrier shown", category: "suites" },
    { suite: "TMJ", query: "Diagnose myofascial pain dysfunction with tender masseter muscles", target: "TMJ Suite ➔ Myofascial Pain Dysfunction", cdt: "D7880", visual: "Masseter and pterygoid trigger zones highlighted in red hypertonicity", category: "suites" },
    { suite: "TMJ", query: "Diagnose left mandibular deviation upon wide jaw opening", target: "TMJ Suite ➔ Mandibular Deviation on Opening", cdt: "D7880", visual: "Mandible trajectory veers leftward during active incisal opening", category: "suites" },
    // Bruxism
    { suite: "Bruxism", query: "Record severe nocturnal tooth grinding with dentin wear facets", target: "Bruxism Suite ➔ Attrition & Wear Facets", cdt: "D9944", visual: "Teeth #3, #14, #19, #30 highlighted amber (#F59E0B) with dentin exposure", category: "suites" },
    { suite: "Bruxism", query: "Record abfraction wedge-shaped cervical defect on buccal", target: "Bruxism Suite ➔ Abfraction Wedge Cervical Defect", cdt: "D9944", visual: "Cervical biomechanical wedge defect rendered on buccal enamel", category: "suites" },
    { suite: "Bruxism", query: "Record prescribe hard acrylic occlusal nightguard splint", target: "Bruxism Suite ➔ Hard Acrylic Nightguard Splint", cdt: "D9944", visual: "Maxillary clear hard acrylic nightguard splint model overlaid on arch", category: "suites" },
    { suite: "Bruxism", query: "Record masseter muscle hypertrophy secondary to daytime clenching", target: "TMJ & Craniofacial Suite ➔ Myofascial Pain / Clenching", cdt: "D7880", visual: "Bilateral masseter bulk indicator and botox / splint therapy notes", category: "suites" },
    // Impaction
    { suite: "Impaction", query: "Evaluate horizontal impacted third molar Pell and Gregory Class II B", target: "Wisdom Impactions Suite ➔ Horizontal Impaction (90°)", cdt: "D7240", visual: "Radiograph panel renders 90° horizontal molar touching IAN nerve canal", category: "suites" },
    { suite: "Impaction", query: "Evaluate mesioangular impacted lower wisdom tooth with pericoronitis", target: "Wisdom Impactions Suite ➔ Mesioangular Impaction (45°)", cdt: "D7230", visual: "Tooth tilted 45°, impinging on distal cervical root of second molar", category: "suites" },
    { suite: "Impaction", query: "Evaluate conical supernumerary mesiodens located between central incisors", target: "Wisdom Impactions Suite ➔ Supernumerary Mesiodens", cdt: "D7280", visual: "Conical mesiodens crown rendered between roots of central incisors #8 & #9", category: "suites" },
    { suite: "Impaction", query: "Evaluate distoangular impacted upper third molar close to sinus", target: "Wisdom Impactions Suite ➔ Distoangular Impaction", cdt: "D7230", visual: "Third molar crown angled distally with roots protruding toward maxillary sinus", category: "suites" },
    // Sensitivity
    { suite: "Sensitivity", query: "Patient complains of acute cold sensitivity with exposed cervical root dentin", target: "Hypersensitivity Suite ➔ Root Dentin Desensitization", cdt: "D9910", visual: "Thermal hyperalgesia map highlighting exposed cervical dentinal tubules", category: "suites" },
    { suite: "Sensitivity", query: "Patient complains of tactile toothbrush hypersensitivity on cervical margin", target: "Hypersensitivity Suite ➔ Root Dentin Desensitization", cdt: "D9910", visual: "Mechanical toothbrush abrasion zone flagged with sensitivity score", category: "suites" },
    { suite: "Sensitivity", query: "Patient complains of apply GLUMA desensitizer varnish on exposed roots", target: "Hypersensitivity Suite ➔ GLUMA Desensitizer Varnish", cdt: "D9910", visual: "Gluma glutaraldehyde tubule seal barrier animation on cervical roots", category: "suites" },
    // Radiographic
    { suite: "Radiographic", query: "Radiographic survey shows Glickman Class II furcation radiolucency on lower first molar", target: "Radiographic Suite ➔ Class II Furcation Radiolucency", cdt: "D0272", visual: "Bifurcation radiolucent halo rendered beneath pulp chamber floor", category: "suites" },
    { suite: "Radiographic", query: "Radiographic survey shows moderate horizontal alveolar bone loss 25% on bitewings", target: "Radiographic Suite ➔ Horizontal Alveolar Bone Loss", cdt: "D0272", visual: "Alveolar crest level depressed 25% below CEJ across interdental septa", category: "suites" },
    { suite: "Radiographic", query: "Radiographic survey shows condensing osteitis radio-opacity at apex of non-vital tooth", target: "Radiographic Suite ➔ Condensing Osteitis Radio-opacity", cdt: "D0220", visual: "Dense sclerotic bone radio-opaque cloud encircling root apex", category: "suites" },
    { suite: "Radiographic", query: "Radiographic survey shows well-circumscribed periapical radiolucent cyst", target: "Radiographic Suite ➔ Periapical Radiolucent Cyst", cdt: "D0220", visual: "Circular corticated radiolucent cyst boundary highlighted at tooth apex", category: "suites" }
  ];

  // Merge all items for universal search
  const allEntries = useMemo(() => {
    return [
      ...restorativeAdultData.map(i => ({ ...i, section: 'Restorative (Adult)' })),
      ...endodonticData.map(i => ({ ...i, section: 'Endodontics' })),
      ...prosthodonticData.map(i => ({ ...i, section: 'Prosthodontics' })),
      ...surgicalData.map(i => ({ ...i, section: 'Oral Surgery' })),
      ...periodontalData.map(i => ({ ...i, section: 'Periodontics & Ortho' })),
      ...pediatricData.map(i => ({ ...i, section: 'Pediatric (Child)' })),
      ...youngData.map(i => ({ ...i, section: 'Young (Multi-Specialty)' })),
      ...diagnosticSuitesData.map(i => ({ 
        ...i, 
        surface: 'Full Suite Screen',
        status: i.target, 
        manual: i.visual, 
        section: `Diagnostic Suite: ${i.suite}` 
      }))
    ];
  }, []);

  // Filtered results
  const filteredEntries = useMemo(() => {
    return allEntries.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchCategory) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.query.toLowerCase().includes(term) ||
        (item.surface && item.surface.toLowerCase().includes(term)) ||
        (item.cdt && item.cdt.toLowerCase().includes(term)) ||
        (item.status && item.status.toLowerCase().includes(term)) ||
        (item.manual && item.manual.toLowerCase().includes(term)) ||
        item.section.toLowerCase().includes(term)
      );
    });
  }, [allEntries, activeCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Top Clinical Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/directory')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                  <span>Dentia Clinical Voice & Charting Guidelines</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified 100%
                  </span>
                </h1>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Doctor's Clinical Dictation Manual • Chatbot Prompts • 5-Surface Odontogram Mapping • CDT Reference
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/Clinical_Charting_Guidelines.docx"
              download="Clinical_Charting_Guidelines.docx"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-2xs cursor-pointer"
              title="Download original DOCX manual"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download DOCX</span>
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-2xs cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Quick Instructions Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
            <Stethoscope className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Clinical Doctor's Guidebook</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              How to Apply Charting via Voice, Chatbot, or 5-Surface UI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              This reference manual documents all 117 clinical dictations verified with the Dentia Odontogram Engine. You can either speak these phrases directly into the microphone, paste them into the AI Copilot Chatbot, or execute them manually in the 5-surface tooth editor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                <div className="flex items-center gap-2 text-xs font-black text-blue-300 mb-1">
                  <Mic className="w-3.5 h-3.5" />
                  <span>1. Voice Dictation</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Click the 🎙️ mic on the Chart Page and speak natural clinical sentences. Surfaces & CDT codes are automatically detected.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Chatbot Copilot</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Click <strong>📋 Copy</strong> on any query below, paste into the AI Chatbot drawer, and press Enter to auto-chart in 1 step.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
                <div className="flex items-center gap-2 text-xs font-black text-teal-300 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Manual 5-Surface</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Click any tooth on the odontogram to open the interactive diagram. Pick quick presets or click individual surfaces (O, M, D, B, L).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tooth number, procedure, surface (e.g. MOD, Class V), CDT code (e.g. D2391, D8080), or keyword..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500 shrink-0">
              Showing <span className="text-slate-900 font-black">{filteredEntries.length}</span> of {allEntries.length} entries
            </div>
          </div>

          {/* Specialty Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Categories (117)' },
              { id: 'restorative', label: 'Restorative' },
              { id: 'endodontic', label: 'Endodontics' },
              { id: 'prosthodontic', label: 'Prosthodontics' },
              { id: 'surgical', label: 'Oral Surgery' },
              { id: 'periodontal', label: 'Periodontics & Ortho' },
              { id: 'pediatric', label: 'Pediatric (Child)' },
              { id: 'young', label: 'Young (Multi-Specialty)' },
              { id: 'suites', label: 'Diagnostic Suites' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Mapping Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[280px]">Doctor's Dictation / Chatbot Prompt</th>
                  <th className="py-3 px-3 w-28 text-center">Surface</th>
                  <th className="py-3 px-4 min-w-[200px]">AI Copilot Result & CDT Code</th>
                  <th className="py-3 px-4 min-w-[240px]">Manual UI Action (Tooth Detail)</th>
                  <th className="py-3 px-3 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No clinical entries matching "{searchTerm}". Try a different keyword or category.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {item.query}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                          <span className="font-bold text-blue-600">{item.section}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-black border ${
                          item.surface === 'MOD' || item.surface === 'MO' || item.surface === 'DO'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : item.surface === 'Class V' || item.surface === 'L' || item.surface === 'B'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : item.surface === 'O'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.surface}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {item.status}
                        </div>
                        <div className="mt-0.5">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CDT: {item.cdt}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 leading-snug text-[11.5px]">
                        <div className="flex items-start gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{item.manual}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleCopy(item.query)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer shadow-2xs ${
                            copiedPrompt === item.query
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200'
                          }`}
                          title="Copy voice prompt to clipboard to paste into Chatbot"
                        >
                          {copiedPrompt === item.query ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 9-11: 3D Visualization & Diagnostic Simulation Guide */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                3D Diagnostic Simulation & Visual Behaviors Reference
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                When you speak or trigger diagnostic suite queries, the following interactive visual mechanisms engage automatically:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Occlusion & Orthodontics
              </span>
              <h4 className="text-xs font-black text-slate-900">Overbite, Underbite, Crossbite & Open Bite</h4>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                Speaking <em>"Angle Class II Division 1 malocclusion with 6mm overjet"</em> positions the overbite slider to 80% and spotlights teeth #7, #8, #9, #10, #23, #24, #25, #26 in royal blue/purple. Negative overjets (-3.5mm) trigger reverse underbite simulation.
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Wisdom Teeth & Impactions
              </span>
              <h4 className="text-xs font-black text-slate-900">Horizontal 90°, Mesioangular 45°, Mesiodens</h4>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                Dictating <em>"Horizontally impacted 90° third molar #17"</em> generates the bony impaction diagram with IAN canal proximity. Supernumerary mesiodens triggers central incisor bracket isolation.
              </p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                TMJ & Craniofacial Articulation
              </span>
              <h4 className="text-xs font-black text-slate-900">Reciprocal Clicking, Trismus & Closed Lock</h4>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                Saying <em>"Right TMJ reciprocal clicking on opening and closing"</em> animates acoustic wave pulses at 35mm opening. Acute trismus restricts mouth opening to 26mm with a visual hard-stop barrier.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

/**
 * Safe API Utilities & Resilience Fallbacks
 * Prevents "SyntaxError: Unexpected token '<'" when an API endpoint returns index.html (SPA fallback)
 * and catches network failure errors cleanly.
 */

export const DEFAULT_CLINIC_ORGANIZATIONS = [
    {
        organizationID: 1,
        name: "Shifa International Hospitals Ltd",
        slug: "shifa-international",
        type: "Hospital",
        address: "Pitras Bukhari Rd, H-8/4",
        city: "Islamabad",
        country: "PK",
        phone: "+92 51 8463000",
        email: "info@shifa.com.pk",
        website: "https://shifa.com.pk",
        logoUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=300",
        heroImageUrl: null,
        description: "JCI Accredited tertiary healthcare hospital featuring state-of-the-art maxillofacial surgery suites and emergency dental trauma units.",
        accreditation: "JCI Accredited",
        isActive: true,
        doctorCount: 1
    },
    {
        organizationID: 2,
        name: "Aga Khan University Hospital (AKUH)",
        slug: "akuh-karachi",
        type: "Hospital",
        address: "Stadium Rd",
        city: "Karachi",
        country: "PK",
        phone: "+92 21 111 911 911",
        email: "contact@aku.edu",
        website: "https://hospitals.aku.edu",
        logoUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300",
        heroImageUrl: null,
        description: "Premier academic medical center and quaternary referral hospital pioneering advanced orthodontic research and facial reconstructive surgery.",
        accreditation: "JCI & ISO 9001 Accredited",
        isActive: true,
        doctorCount: 1
    },
    {
        organizationID: 3,
        name: "Dentia Auckland Regional Dental Hospital",
        slug: "dentia-auckland",
        type: "Dental Clinic",
        address: "100 Queen Street",
        city: "Auckland",
        country: "NZ",
        phone: "+64 9 300 1234",
        email: "auckland@dentia.co.nz",
        website: "https://dentiaclinic.com",
        logoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        heroImageUrl: null,
        description: "Leading specialist dental facility with 12 operatory suites, computer-guided surgical implant technology, and digital smile design studios.",
        accreditation: "NZ Dental Council Accredited",
        isActive: true,
        doctorCount: 4
    },
    {
        organizationID: 4,
        name: "Starship Children’s Dental Specialist Hospital",
        slug: "starship-dental",
        type: "Hospital",
        address: "Park Road, Grafton",
        city: "Auckland",
        country: "NZ",
        phone: "+64 9 307 4949",
        email: "starship@adhb.govt.nz",
        website: "https://starship.org.nz",
        logoUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=300",
        heroImageUrl: null,
        description: "Specialized pediatric dental health center providing sedation dentistry, interceptive orthodontics, and cleft palate care.",
        accreditation: "Royal Australasian College Accredited",
        isActive: true,
        doctorCount: 1
    }
];

export const DEFAULT_CLINIC_DOCTORS = [
    {
        id: 2,
        doctorID: 2,
        username: "ahmedjh",
        firstName: "Jhangir",
        lastName: "Ahmed",
        fullName: "Dr. Jhangir Ahmed",
        region: "PK",
        title: "BDS, MDS (Oral & Maxillofacial Surgery), FICOI (USA)",
        specialization: "Senior Consultant Implantologist & Oral Surgeon",
        yearsOfExperience: 15,
        exp: "15 yrs exp",
        biography: "Distinguished Oral & Maxillofacial Surgeon and Fellow of the International Congress of Oral Implantologists (ICOI, USA). With over 15 years of dedicated surgical experience across leading tertiary teaching hospitals and private specialty clinics, he has successfully placed more than 3,500 dental implants with computer-guided surgical navigation, sinus augmentations, and full-mouth rehabilitation.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Aga Khan University Hospital (AKUH)",
                role: "Consultant Dental Surgeon",
                period: "2018 - Present",
                description: "Lead implant surgeon handling complex sinus lift elevations and guided bone regenerations."
            },
            {
                organization: "Shifa International Hospital",
                role: "Senior Dental Surgeon",
                period: "2014 - 2018",
                description: "Supervising surgical theater for advanced ridge augmentation and maxillofacial trauma."
            },
            {
                organization: "Mayo Hospital / King Edward Medical University",
                role: "Resident Surgeon",
                period: "2010 - 2014",
                description: "Completed intensive clinical residency in maxillofacial trauma and oral pathology."
            }
        ]),
        education: "BDS - King Edward Medical University (2009)\r\nMDS (Oral & Maxillofacial Surgery) - Postgraduate Institute of Dental Sciences (2014)\r\nFellowship in Advanced Implantology - International Congress of Oral Implantologists (ICOI USA, 2017)",
        certifications: "Diplomate & Fellow ICOI (USA), Digital Guided Implant Surgery Specialist, BLS/ACLS Certified",
        consultationFee: 180,
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu, Punjabi",
        rating: 4.97,
        reviewCount: 168,
        organizationID: 2,
        organizationName: "Aga Khan University Hospital (AKUH)",
        organizationLogoUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Karachi",
        hospitalDepartment: "Division of Oral & Maxillofacial Surgery"
    },
    {
        id: 3,
        doctorID: 3,
        username: "ahmedjhahmedjh",
        firstName: "Ahmed",
        lastName: "Khan",
        fullName: "Dr. Ahmed Khan",
        region: "NZ",
        title: "BDS, FCPS (Restorative Dentistry & Endodontics)",
        specialization: "Consultant Dental Surgeon & Endodontist",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
        biography: "Experienced dental surgeon specializing in microscopic root canal therapy, complex retreatment cases, and tooth-colored cosmetic restorations.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dentia Auckland Regional Dental Hospital",
                role: "Consultant Dental Surgeon",
                period: "2019 - Present",
                description: "Lead clinician for restorative dentistry and single-visit rotary endodontics."
            },
            {
                organization: "City Dental Teaching Hospital",
                role: "Registrar",
                period: "2015 - 2019",
                description: "Conducted emergency dental trauma treatment and root canal clinical trials."
            }
        ]),
        education: "BDS - University of Health Sciences (2014)\r\nFCPS Part II Trained (Restorative Dentistry & Endodontics)",
        certifications: "Rotary Endodontics Masterclass, Laser Dentistry Certification",
        consultationFee: 120,
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu",
        rating: 4.88,
        reviewCount: 64,
        organizationID: 3,
        organizationName: "Dentia Auckland Regional Dental Hospital",
        organizationLogoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Auckland",
        hospitalDepartment: "Department of Restorative & Cosmetic Dentistry"
    },
    {
        id: 4,
        doctorID: 4,
        username: "sarah@dentia.com",
        firstName: "Sarah",
        lastName: "Jenkins",
        fullName: "Dr. Sarah Jenkins",
        region: "NZ",
        title: "BDS, MSc (Orthodontics), MOrth RCSEd (UK)",
        specialization: "Specialist Orthodontist & Dentofacial Orthopedics",
        yearsOfExperience: 12,
        exp: "12 yrs exp",
        biography: "Specialist orthodontist certified in clear aligner biomechanics and interceptive jaw development therapies. Member of the Royal College of Surgeons of Edinburgh. Dr. Sarah focuses on non-extraction orthodontic alignment, TMJ stabilization, and aesthetic smile design.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Aga Khan University Hospital (AKUH)",
                role: "Consultant Orthodontist",
                period: "2017 - Present",
                description: "Director of Adult Orthodontic Clinic and digital clear aligner biomechanics."
            },
            {
                organization: "Guy’s and St Thomas’ NHS Foundation Trust, London",
                role: "Clinical Orthodontic Fellow",
                period: "2015 - 2017",
                description: "Advanced training in lingual braces and multidisciplinary orthognathic surgical planning."
            },
            {
                organization: "Armed Forces Institute of Dentistry (AFID)",
                role: "Orthodontic Resident",
                period: "2012 - 2015",
                description: "Treated complex skeletal Class II and Class III malocclusions and pediatric palate expansions."
            }
        ]),
        education: "BDS - Army Medical College (2011)\r\nMSc in Orthodontics - King’s College London (2016)\r\nMOrth - Royal College of Surgeons of Edinburgh (2017)",
        certifications: "Invisalign Diamond Apex Provider, Damon System Certified, Lingual Orthodontics Specialist (WIN & Incognito)",
        consultationFee: 160,
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu",
        rating: 4.95,
        reviewCount: 142,
        organizationID: 2,
        organizationName: "Aga Khan University Hospital (AKUH)",
        organizationLogoUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Karachi",
        hospitalDepartment: "Department of Orthodontics & Dentofacial Orthopedics"
    },
    {
        id: 5,
        doctorID: 5,
        username: "ahmedjh2",
        firstName: "Jhangir",
        lastName: "Ahmed",
        fullName: "Dr. Jhangir Ahmed",
        region: "NZ",
        title: "BDS, FCPS (Restorative Dentistry & Endodontics)",
        specialization: "Consultant Dental Surgeon & Endodontist",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
        biography: "Experienced dental surgeon specializing in microscopic root canal therapy, complex retreatment cases, and tooth-colored cosmetic restorations.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dentia Auckland Regional Dental Hospital",
                role: "Senior Dental Surgeon",
                period: "2019 - Present",
                description: "Lead clinician for restorative dentistry and single-visit rotary endodontics."
            },
            {
                organization: "City Dental Teaching Hospital",
                role: "Registrar",
                period: "2015 - 2019",
                description: "Conducted emergency dental trauma treatment and root canal clinical trials."
            }
        ]),
        education: "BDS - University of Health Sciences (2014)\r\nFCPS Part II Trained (Restorative Dentistry & Endodontics)",
        certifications: "Rotary Endodontics Masterclass, Laser Dentistry Certification",
        consultationFee: 120,
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu",
        rating: 4.88,
        reviewCount: 64,
        organizationID: 3,
        organizationName: "Dentia Auckland Regional Dental Hospital",
        organizationLogoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Auckland",
        hospitalDepartment: "Department of Restorative & Cosmetic Dentistry"
    },
    {
        id: 6,
        doctorID: 6,
        username: "doc3",
        firstName: "Jhangir",
        lastName: "Ahmed",
        fullName: "Dr. Jhangir Ahmed",
        region: "NZ",
        title: "BDS, FCPS (Restorative Dentistry & Endodontics)",
        specialization: "Consultant Dental Surgeon & Endodontist",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
        biography: "Experienced dental surgeon specializing in microscopic root canal therapy, complex retreatment cases, and tooth-colored cosmetic restorations.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dentia Auckland Regional Dental Hospital",
                role: "Senior Dental Surgeon",
                period: "2019 - Present",
                description: "Lead clinician for restorative dentistry and single-visit rotary endodontics."
            }
        ]),
        education: "BDS - University of Health Sciences (2014)",
        certifications: "Rotary Endodontics Masterclass",
        consultationFee: 120,
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu",
        rating: 4.88,
        reviewCount: 64,
        organizationID: 3,
        organizationName: "Dentia Auckland Regional Dental Hospital",
        organizationLogoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Auckland",
        hospitalDepartment: "Department of Restorative & Cosmetic Dentistry"
    },
    {
        id: 7,
        doctorID: 7,
        username: "dr_test",
        firstName: "Test",
        lastName: "Doctor",
        fullName: "Dr. Test Doctor",
        region: "NZ",
        title: "BDS, FCPS (Restorative Dentistry & Endodontics)",
        specialization: "Consultant Dental Surgeon & Endodontist",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
        biography: "Experienced dental surgeon specializing in microscopic root canal therapy, complex retreatment cases, and tooth-colored cosmetic restorations.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dentia Auckland Regional Dental Hospital",
                role: "Senior Dental Surgeon",
                period: "2019 - Present",
                description: "Lead clinician for restorative dentistry."
            }
        ]),
        education: "BDS - University of Health Sciences (2014)",
        certifications: "Rotary Endodontics Masterclass",
        consultationFee: 120,
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu",
        rating: 4.88,
        reviewCount: 64,
        organizationID: 3,
        organizationName: "Dentia Auckland Regional Dental Hospital",
        organizationLogoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Auckland",
        hospitalDepartment: "Department of Restorative & Cosmetic Dentistry"
    },
    {
        id: 8,
        doctorID: 8,
        username: "ahmedhassan",
        firstName: "Ahmed",
        lastName: "Hassan",
        fullName: "Dr. Ahmed Hassan",
        region: "NZ",
        title: "BDS, FCPS (Restorative Dentistry & Endodontics)",
        specialization: "Consultant Dental Surgeon & Endodontist",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
        biography: "Experienced dental surgeon specializing in microscopic root canal therapy, complex retreatment cases, and tooth-colored cosmetic restorations.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dentia Auckland Regional Dental Hospital",
                role: "Senior Dental Surgeon",
                period: "2019 - Present",
                description: "Lead clinician for restorative dentistry and single-visit rotary endodontics."
            }
        ]),
        education: "BDS - University of Health Sciences (2014)",
        certifications: "Rotary Endodontics Masterclass, Laser Dentistry Certification",
        consultationFee: 120,
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu",
        rating: 4.88,
        reviewCount: 64,
        organizationID: 3,
        organizationName: "Dentia Auckland Regional Dental Hospital",
        organizationLogoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Auckland",
        hospitalDepartment: "Department of Restorative & Cosmetic Dentistry"
    }
];

/**
 * Safely fetches JSON from an ordered list of endpoints.
 * Handles network failures, CORS issues, and SPA HTML responses gracefully.
 *
 * @param {string|string[]} endpoints - Array of candidate URLs to try sequentially
 * @param {RequestInit} [options] - Standard fetch options
 * @returns {Promise<{ ok: boolean, data: any, url?: string }>}
 */
export async function safeFetchJson(endpoints, options = {}) {
    const list = Array.isArray(endpoints) ? endpoints : [endpoints];
    for (const url of list) {
        if (!url || typeof url !== 'string') continue;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const fetchOptions = {
                ...options,
                signal: options.signal || controller.signal
            };

            const res = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (!res.ok) continue;

            const text = await res.text();
            if (!text || typeof text !== 'string') continue;

            const trimmed = text.trim();
            // Guard against HTML documents (e.g. <!doctype html> or <html> SPA fallbacks)
            if (trimmed.startsWith('<')) {
                continue;
            }

            try {
                const data = JSON.parse(trimmed);
                return { ok: true, data, url };
            } catch {
                // Not valid JSON string
                continue;
            }
        } catch {
            // Network connection error, CORS error, SSL revocation offline, or timeout
            continue;
        }
    }

    return { ok: false, data: null };
}

export const DEFAULT_CLINIC_PROCEDURES_BY_DOCTOR = {
    // Dr. Jhangir Ahmed (ID 2, Oral & Maxillofacial Implantology, PK / PKR)
    2: [
        {
            procedureCode: 'D6010',
            procedureName: 'Surgical Dental Implant Placement (Titanium Fixture)',
            category: 'Dental Implants',
            estimatedDuration: '60 mins',
            standardFee: 75000,
            currency: 'PKR',
            description: 'Precision surgical placement of titanium endosteal implant fixture under local anesthesia with 3D CBCT surgical guide.'
        },
        {
            procedureCode: 'D6058',
            procedureName: 'Porcelain-Fused-to-Zirconia Implant Abutment & Crown',
            category: 'Dental Implants',
            estimatedDuration: '45 mins',
            standardFee: 28000,
            currency: 'PKR',
            description: 'Custom CAD/CAM titanium or zirconia abutment and monolithic zirconia implant crown restoration.'
        },
        {
            procedureCode: 'D7953',
            procedureName: 'Bone Grafting & Socket Preservation',
            category: 'Extractions & Oral Surgery',
            estimatedDuration: '45 mins',
            standardFee: 35000,
            currency: 'PKR',
            description: 'Osteoconductive bone graft particulate and collagen resorbable membrane for alveolar ridge preservation.'
        },
        {
            procedureCode: 'D7210',
            procedureName: 'Surgical Removal of Impacted Wisdom Tooth',
            category: 'Extractions & Oral Surgery',
            estimatedDuration: '45 mins',
            standardFee: 18000,
            currency: 'PKR',
            description: 'Surgical extraction of bony impacted third molar with mucosal flap elevation, bone guttering, and sterile suture closure.'
        },
        {
            procedureCode: 'D0150',
            procedureName: 'Comprehensive Implant Consultation & 3D CBCT Review',
            category: 'Examination & Diagnosis',
            estimatedDuration: '45 mins',
            standardFee: 3500,
            currency: 'PKR',
            description: 'Full-mouth oral surgery evaluation, bone density assessment, nerve tracing, and digital treatment roadmap.'
        },
        {
            procedureCode: 'D3330',
            procedureName: 'Molar Root Canal Endodontic Therapy (3-4 Canals)',
            category: 'Root Canal Treatment',
            estimatedDuration: '60 mins',
            standardFee: 22000,
            currency: 'PKR',
            description: 'Rotary nickel-titanium canal instrumentation, apex locator electronic measurement, antibacterial irrigation, and warm gutta-percha obturation.'
        },
        {
            procedureCode: 'D2391',
            procedureName: 'Posterior Nano-Hybrid Composite Tooth Restoration',
            category: 'Fillings & Restorative Treatment',
            estimatedDuration: '30 mins',
            standardFee: 6500,
            currency: 'PKR',
            description: 'Micro-hybrid aesthetic resin restorative filling for tooth decay, cuspal fractures, or recurrent cavities.'
        },
        {
            procedureCode: 'D4341',
            procedureName: 'Periodontal Scaling & Deep Root Planing (Per Quadrant)',
            category: 'Gum / Periodontal Treatment',
            estimatedDuration: '45 mins',
            standardFee: 8500,
            currency: 'PKR',
            description: 'Ultrasonic subgingival calculus removal, bacterial biofilm eradication, and root surface smoothing.'
        },
        {
            procedureCode: 'D2740',
            procedureName: 'Full Ceramic High-Strength Zirconia Crown',
            category: 'Crowns & Bridges',
            estimatedDuration: '45 mins',
            standardFee: 24000,
            currency: 'PKR',
            description: 'Computer-milled multi-layered aesthetic zirconia crown restoring tooth anatomy, masticatory function, and shade.'
        }
    ],

    // Dr. Sarah Jenkins (ID 4, Specialist Orthodontist, AKUH)
    4: [
        {
            procedureCode: 'D8080',
            procedureName: 'Clear Aligner Comprehensive Orthodontic Plan',
            category: 'Orthodontics',
            estimatedDuration: '45 mins',
            standardFee: 140000,
            currency: 'PKR',
            description: 'Digital 3D intraoral scan, biomechanical tooth movement staging, and full series of custom transparent aligners.'
        },
        {
            procedureCode: 'D8070',
            procedureName: 'Fixed Appliance Ceramic & Metal Bracket Therapy',
            category: 'Orthodontics',
            estimatedDuration: '60 mins',
            standardFee: 95000,
            currency: 'PKR',
            description: 'Comprehensive fixed orthodontic bonding, archwire alignment, and bite correction for malocclusion.'
        },
        {
            procedureCode: 'D0340',
            procedureName: 'Diagnostic Cephalometric Analysis & Orthodontic Workup',
            category: 'Examination & Diagnosis',
            estimatedDuration: '30 mins',
            standardFee: 7500,
            currency: 'PKR',
            description: 'Lateral cephalometric tracing, facial aesthetic profile evaluation, and photographic bite documentation.'
        },
        {
            procedureCode: 'D1510',
            procedureName: 'Pediatric Space Maintainer & Pulpotomy',
            category: 'Pediatric Dentistry',
            estimatedDuration: '30 mins',
            standardFee: 12000,
            currency: 'PKR',
            description: 'Preventative space maintainer fabrication to safeguard permanent tooth eruption following premature primary tooth loss.'
        },
        {
            procedureCode: 'D1351',
            procedureName: 'Pit & Fissure Enamel Sealant (Per Tooth)',
            category: 'Preventive Dentistry',
            estimatedDuration: '20 mins',
            standardFee: 4000,
            currency: 'PKR',
            description: 'Resin seal of deep anatomical molar fissures to provide high-efficacy barrier protection against childhood decay.'
        },
        {
            procedureCode: 'D9972',
            procedureName: 'Laser Activated Teeth Whitening & Enamel Brightening',
            category: 'Cosmetic Dentistry',
            estimatedDuration: '45 mins',
            standardFee: 25000,
            currency: 'PKR',
            description: 'In-chair medical grade hydrogen peroxide photo-activation lifting stubborn intrinsic and extrinsic stains up to 8 shades.'
        },
        {
            procedureCode: 'D1110',
            procedureName: 'Full Mouth Scaling, Polishing & Fluoride Varnish',
            category: 'Preventive Dentistry',
            estimatedDuration: '30 mins',
            standardFee: 5500,
            currency: 'PKR',
            description: 'Ultrasonic plaque removal, prophylaxis paste polishing, and remineralizing fluoride varnish application.'
        },
        {
            procedureCode: 'D2330',
            procedureName: 'Anterior Aesthetic Composite Bonding / Diastema Closure',
            category: 'Fillings & Restorative Treatment',
            estimatedDuration: '45 mins',
            standardFee: 8500,
            currency: 'PKR',
            description: 'Layered cosmetic composite resin bonding to close gaps, repair incisal edge chips, and harmonize smile line.'
        }
    ],

    // Dr. Ahmed Khan / NZ Restorative Specialists (ID 3, 5, 6, 7, 8, NZ / NZD)
    default: [
        {
            procedureCode: 'D0150',
            procedureName: 'Comprehensive Oral Examination & Bitewing Radiographs',
            category: 'Examination & Diagnosis',
            estimatedDuration: '45 mins',
            standardFee: 95.00,
            currency: 'NZD',
            description: 'Detailed diagnostic oral review, periodontal pocket charting, soft tissue screen, and digital x-ray exposure.'
        },
        {
            procedureCode: 'D1110',
            procedureName: 'Periodontal Prophylaxis & Ultrasonic Hygiene Clean',
            category: 'Preventive Dentistry',
            estimatedDuration: '45 mins',
            standardFee: 140.00,
            currency: 'NZD',
            description: 'Ultrasonic scaling, air-flow stain removal, subgingival biofilm irrigation, and remineralizing treatment.'
        },
        {
            procedureCode: 'D2392',
            procedureName: 'Two-Surface Posterior Composite Tooth Restoration',
            category: 'Fillings & Restorative Treatment',
            estimatedDuration: '45 mins',
            standardFee: 220.00,
            currency: 'NZD',
            description: 'Aesthetic biomimetic resin composite restoration reproducing natural tooth anatomy, contact points, and shade.'
        },
        {
            procedureCode: 'D2740',
            procedureName: 'High-Translucency Monolithic Zirconia Crown',
            category: 'Crowns & Bridges',
            estimatedDuration: '60 mins',
            standardFee: 1250.00,
            currency: 'NZD',
            description: 'Precision digital scan and laboratory-milled ceramic crown restoring endodontically treated or broken teeth.'
        },
        {
            procedureCode: 'D3330',
            procedureName: 'Molar Root Canal Endodontic Therapy (Complete)',
            category: 'Root Canal Treatment',
            estimatedDuration: '75 mins',
            standardFee: 1100.00,
            currency: 'NZD',
            description: 'Microscopic canal debridement, chemo-mechanical disinfection, and hermetic warm vertical gutta-percha seal.'
        },
        {
            procedureCode: 'D7210',
            procedureName: 'Surgical Tooth Extraction & Atraumatic Socket Preservation',
            category: 'Extractions & Oral Surgery',
            estimatedDuration: '45 mins',
            standardFee: 320.00,
            currency: 'NZD',
            description: 'Sectional atraumatic removal of non-restorable tooth with local anesthesia and collagen plug.'
        },
        {
            procedureCode: 'D9972',
            procedureName: 'In-Chair Professional Laser Teeth Whitening',
            category: 'Cosmetic Dentistry',
            estimatedDuration: '60 mins',
            standardFee: 450.00,
            currency: 'NZD',
            description: 'Medical-grade chairside power bleaching lifting discoloration and creating a radiant, luminous smile.'
        },
        {
            procedureCode: 'D8080',
            procedureName: 'Clear Aligner Orthodontic Digital Assessment & Scan',
            category: 'Orthodontics',
            estimatedDuration: '30 mins',
            standardFee: 180.00,
            currency: 'NZD',
            description: '3D digital intraoral scan and clinical simulation previewing customized orthodontic alignment trajectory.'
        }
    ]
};

export function getDoctorProceduresFallback(doctorId, region) {
    const docId = Number(doctorId);
    if (docId === 2) return DEFAULT_CLINIC_PROCEDURES_BY_DOCTOR[2];
    if (docId === 4) return DEFAULT_CLINIC_PROCEDURES_BY_DOCTOR[4];
    if (region === 'PK') return DEFAULT_CLINIC_PROCEDURES_BY_DOCTOR[2];
    return DEFAULT_CLINIC_PROCEDURES_BY_DOCTOR.default;
}

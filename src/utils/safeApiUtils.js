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
        username: "jhangir",
        firstName: "Jhangir",
        lastName: "Ahmed",
        fullName: "Dr. Jhangir Ahmed",
        region: "PK",
        title: "Consultant Dental Surgeon & Implantologist",
        specialization: "Oral & Maxillofacial Implantology",
        yearsOfExperience: 14,
        exp: "14 yrs exp",
        biography: "Distinguished Dental Surgeon & Implantologist with over 14 years of clinical experience in advanced implant placement, bone grafting, and comprehensive oral rehabilitation across Pakistan and New Zealand.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Shifa International Hospitals Ltd",
                role: "Consultant Dental Surgeon",
                period: "2018 - Present",
                description: "Lead implant surgeon handling complex sinus lift elevations and guided bone regenerations."
            },
            {
                organization: "Pakistan Institute of Medical Sciences (PIMS)",
                role: "Senior Dental Registrar",
                period: "2014 - 2018",
                description: "Supervised resident dental surgeons in emergency maxillofacial trauma and reconstructive cases."
            },
            {
                organization: "Rawal Institute of Health Sciences",
                role: "Assistant Professor - Oral Surgery",
                period: "2012 - 2014",
                description: "Delivered clinical lectures on surgical extractions, impactions, and pre-prosthetic surgery."
            }
        ]),
        education: "BDS - Rawalpindi Medical University (2010)\r\nFCPS (Oral & Maxillofacial Surgery) - College of Physicians & Surgeons Pakistan (2015)\r\nFellowship in Advanced Dental Implantology (ICOI, USA - 2018)",
        certifications: "Diplomate International Congress of Oral Implantologists (ICOI)\r\nCertified Digital Smile Design (DSD) Expert\r\nBLS & ACLS Certified Healthcare Provider",
        consultationFee: 2500,
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
        languages: "English, Urdu, Punjabi",
        rating: 4.96,
        reviewCount: 98,
        organizationID: 1,
        organizationName: "Shifa International Hospitals Ltd",
        organizationLogoUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Islamabad",
        hospitalDepartment: "Department of Oral Surgery & Dentistry"
    },
    {
        id: 4,
        doctorID: 4,
        username: "sarah",
        firstName: "Sarah",
        lastName: "Jenkins",
        fullName: "Dr. Sarah Jenkins",
        region: "PK",
        title: "Senior Orthodontic Specialist",
        specialization: "Orthodontics & Dentofacial Orthopedics",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
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
        consultationFee: 3000,
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
        firstName: "Ahmed",
        lastName: "Hassan",
        fullName: "Dr. Ahmed Hassan",
        region: "NZ",
        title: "BDS, FCPS (Restorative Dentistry & Endodontics)",
        specialization: "Endodontics & Restorative Dentistry",
        yearsOfExperience: 9,
        exp: "9 yrs exp",
        biography: "Experienced dental surgeon specializing in microscopic root canal therapy, complex retreatment cases, and tooth-colored cosmetic restorations.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dental Associates Healthcare",
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
        id: 1,
        doctorID: 1,
        username: "sarahlee",
        firstName: "Sarah",
        lastName: "Lee",
        fullName: "Dr. Sarah J. Lee",
        region: "NZ",
        title: "BDS, NZDA Lead Dental Clinician",
        specialization: "General Dental Surgery & Aesthetics",
        yearsOfExperience: 11,
        exp: "11 yrs exp",
        biography: "Dedicated dental surgeon focusing on holistic family care, aesthetic crowns, minimally invasive cosmetic restorations, and pediatric preventative oral care.",
        organizationWorkHistory: JSON.stringify([
            {
                organization: "Dentia Auckland Regional Dental Hospital",
                role: "Principal Dental Surgeon",
                period: "2016 - Present",
                description: "Supervised primary clinical audits and outpatient restorative workflows."
            }
        ]),
        education: "BDS - University of Otago (2013)",
        certifications: "NZ Dental Association Board Certified, CAD/CAM Ceramic Restoration Specialist",
        consultationFee: 110,
        avatar: "https://images.unsplash.com/photo-1594824813627-2c938c03e670?auto=format&fit=crop&q=80&w=400",
        languages: "English",
        rating: 4.92,
        reviewCount: 88,
        organizationID: 3,
        organizationName: "Dentia Auckland Regional Dental Hospital",
        organizationLogoUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
        organizationCity: "Auckland",
        hospitalDepartment: "Department of General Dental Practice"
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

    // Dr. Ayesha Siddiqui (ID 4, Orthodontics & Pediatric, PK / PKR)
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

    // Dr. Marcus Vance / Dr. Sarah Lee (ID 3 / 1, NZ / NZD)
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

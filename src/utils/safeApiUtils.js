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

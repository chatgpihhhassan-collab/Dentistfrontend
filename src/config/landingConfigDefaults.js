/**
 * 🦷 Dentia Platform: Centralized Dynamic Landing Page Configuration & Defaults
 * Allows clinic doctors to customize all contact info, operating hours, section visibility,
 * hero slides, FAQs, and Google Reviews without code changes.
 */

export const LANDING_CONFIG_STORAGE_KEY = 'dentia_clinic_landing_config';
export const LANDING_CONFIG_UPDATE_EVENT = 'dentia_landing_config_updated';

export const DEFAULT_LANDING_CONFIG = {
  // Practice Branding & Contact Info
  clinicName: "Dentia Dental Arts",
  tagline: "Elevating Smiles",
  accentTagline: "With Expert Care.",
  subTagline: "We chart all 32 teeth digitally on your first visit, offering 100% transparent diagnostics and gentle, advanced dental treatments designed to last a lifetime.",
  phone: "+1 123 456 789",
  email: "contact@dentiaclinic.com",
  operatingHours: "Mon - Sat: 08:00 - 20:00",
  address: "Suite 400, Grand Central Medical Plaza, Downtown Dental Arts",
  googleMapsUrl: "https://maps.google.com/?q=Dentia+Dental+Hospital",
  
  // Social Media Links
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    whatsapp: "https://wa.me/1123456789"
  },

  // 12 Section Visibility Toggles (Doctor can toggle any section on or off)
  sections: {
    showTopContactBar: true,
    showHeroSection: true,
    showHeroSlider: true,
    showSocialProofRibbon: true,
    showCredentialsRibbon: true,
    showAboutSection: true,
    showServicesSection: true,
    showPricingStudio: true,
    showAiDiagnosticsCallout: true,
    showTeamSection: true,
    showFaqSection: true,
    showReviewsSection: true,
    showPreFooterCta: true,
    showFooter: true
  },

  // Social Proof & Trust Metrics
  socialProof: {
    googleRating: 5.0,
    googleReviewCountText: "23k+ Google Reviews",
    happySmilesText: "12,000+",
    yearsInPracticeText: "15+ Years",
    digitalChartingText: "100% Digital 32-Tooth Charting"
  },

  // Hero Slides
  heroSlides: [
    {
      id: "slide-1",
      img: "/images/hero_clinic.jpg",
      badge: "State-of-the-Art Care",
      title: "Experience professional and personalized dental excellence.",
      accent: "Dentia Clinical Workspace"
    },
    {
      id: "slide-2",
      img: "/images/hero_slide2.jpg",
      badge: "Empathetic Consultation",
      title: "Our lead doctors listen first, treat with care, and counsel for life.",
      accent: "Bilingual AI Charting"
    },
    {
      id: "slide-3",
      img: "/images/hero_slide3.jpg",
      badge: "Smiles Transformed",
      title: "Achieve a healthy, radiant smile with our cosmetic specialties.",
      accent: "Tailored Treatment Plans"
    }
  ],

  // Clinical Credentials Ribbon Items
  credentials: [
    {
      id: "cred-1",
      title: "Direct Insurance & Billing",
      subtitle: "All major dental insurance accepted with instant automated electronic claims",
      icon: "Shield"
    },
    {
      id: "cred-2",
      title: "Same-Day Emergency Relief",
      subtitle: "Dedicated priority slots daily for acute toothache, broken crowns & trauma",
      icon: "Clock"
    },
    {
      id: "cred-3",
      title: "Gentle & Anxiety-Free Care",
      subtitle: "Painless digital local anesthesia and tailored comfort protocols for all ages",
      icon: "Heart"
    }
  ],

  // Lead Doctor Profile (About Us Section)
  aboutDoctor: {
    badge: "About Dentia Dental Arts",
    title: "Professional and Personalized Dental Excellence",
    doctorName: "Dr. Sarah Bennett",
    doctorRole: "Lead Dental Surgeon",
    doctorBio: "At Dentia, we believe everyone deserves a healthy, confident smile. Led by Dr. Sarah Bennett and our team of credentialed specialists, we combine cutting-edge technology with compassionate, patient-first care to deliver results that last a lifetime.",
    imageUrl: "/images/about_doctor.jpg",
    smilesTransformedText: "12,000+ Smiles",
    highlights: [
      "Personalized Treatment Plans",
      "Gentle Care for Kids & Adults",
      "State-of-the-Art Technology",
      "Flexible Appointment Slots",
      "Digital Odontogram Records",
      "Digital Dental X-Rays"
    ]
  },

  // Featured Clinical Specialties Cards
  services: [
    {
      id: "srv-1",
      img: "/images/icons/tooth-1.png",
      title: "General Dentistry",
      desc: "Complete oral health care with gentle ultrasonic cleanings, digital checkups, and cavity prevention.",
      tags: "Exams • Cleanings • Fluoride"
    },
    {
      id: "srv-2",
      img: "/images/icons/tooth-2.png",
      title: "Cosmetic Dentistry",
      desc: "Enhance your smile radiance with laser whitening, ultra-thin porcelain veneers, and cosmetic bonding.",
      tags: "Laser Whitening • Veneers"
    },
    {
      id: "srv-3",
      img: "/images/icons/tooth-3.png",
      title: "Pediatric Dentistry",
      desc: "Gentle, stress-free dental experiences crafted specially for children and growing young smiles.",
      tags: "Child Friendly • Sealants"
    },
    {
      id: "srv-4",
      img: "/images/icons/tooth-4.png",
      title: "Restorative Dentistry",
      desc: "Repair damaged or missing teeth with precision digital implants, durable crowns, and aesthetic bridges.",
      tags: "Implants • Crowns • Bridges"
    }
  ],

  // Featured Standard Fees
  featuredFees: [
    { id: "fee-1", name: "Initial Exam & 32-Tooth Digital Odontogram", fee: "Included with Visit", badge: "Diagnostic" },
    { id: "fee-2", name: "Ultrasonic Scaling & Airflow Polishing", fee: "From $85", badge: "Preventive" },
    { id: "fee-3", name: "In-Office Laser Teeth Whitening", fee: "From $250", badge: "Cosmetic" },
    { id: "fee-4", name: "Digital Single Tooth Implant + Crown", fee: "From $950", badge: "Restorative" }
  ],

  // Frequently Asked Questions
  faqs: [
    {
      id: "faq-1",
      q: "How often should I visit the dentist?",
      a: "It's recommended to see your dentist every 6 months for a routine check-up and cleaning, unless advised otherwise by your specialist."
    },
    {
      id: "faq-2",
      q: "What should I do in a dental emergency?",
      a: "Call our office immediately. We offer priority same-day emergency slots for dental issues like root pain or fractured teeth."
    },
    {
      id: "faq-3",
      q: "Do you offer services for kids?",
      a: "Absolutely! We provide pediatric care using child-friendly procedures to make visits pleasant and stress-free."
    },
    {
      id: "faq-4",
      q: "Is teeth whitening safe?",
      a: "Yes, professional dental whitening is completely safe under monitoring, and delivers bright, durable results."
    }
  ],

  // Verified Patient Google Reviews (Testimonials)
  reviews: [
    {
      id: "rev-1",
      name: "Michael S.",
      rating: 5,
      dateText: "Verified Patient • Patient Since 2023",
      img: "/images/testimonial/1.webp",
      text: "I've always been nervous about dental visits, but the staff at Dentia made me feel completely comfortable. Their gentle care and attention to detail truly stand out."
    },
    {
      id: "rev-2",
      name: "Robert L.",
      rating: 5,
      dateText: "Verified Patient • Patient Since 2023",
      img: "/images/testimonial/2.webp",
      text: "My family and I have been coming here for years. The service is exceptional, and the team always goes the extra mile to make sure we're happy and well taken care of."
    },
    {
      id: "rev-3",
      name: "Jake M.",
      rating: 5,
      dateText: "Verified Patient • Patient Since 2023",
      img: "/images/testimonial/3.webp",
      text: "I came in for a whitening treatment and left with a brand new level of confidence. The results were amazing, and the staff made it such a relaxing experience."
    }
  ],

  // Call-To-Action Pre-Footer Banner
  ctaBanner: {
    badge: "Immediate Online Confirmation",
    title: "Ready for a Healthier, More Radiant Smile?",
    subtitle: "Book your comprehensive dental checkup and digital charting online in under 60 seconds. Same-day emergency appointments available.",
    buttonText: "Book Appointment Online"
  }
};

/**
 * Retrieve saved config from localStorage with fallback to default
 */
export function getStoredLandingConfig() {
  if (typeof window === 'undefined') return DEFAULT_LANDING_CONFIG;
  try {
    const raw = localStorage.getItem(LANDING_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_LANDING_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_LANDING_CONFIG,
      ...parsed,
      sections: {
        ...DEFAULT_LANDING_CONFIG.sections,
        ...(parsed.sections || {})
      },
      socialProof: {
        ...DEFAULT_LANDING_CONFIG.socialProof,
        ...(parsed.socialProof || {})
      },
      aboutDoctor: {
        ...DEFAULT_LANDING_CONFIG.aboutDoctor,
        ...(parsed.aboutDoctor || {})
      },
      socialLinks: {
        ...DEFAULT_LANDING_CONFIG.socialLinks,
        ...(parsed.socialLinks || {})
      },
      ctaBanner: {
        ...DEFAULT_LANDING_CONFIG.ctaBanner,
        ...(parsed.ctaBanner || {})
      }
    };
  } catch (err) {
    console.warn('[landingConfig] Failed to parse stored config, using defaults:', err);
    return DEFAULT_LANDING_CONFIG;
  }
}

/**
 * Save updated config to localStorage and trigger update event for live tabs
 */
export function saveStoredLandingConfig(newConfig) {
  if (typeof window === 'undefined') return;
  try {
    const merged = {
      ...DEFAULT_LANDING_CONFIG,
      ...newConfig
    };
    localStorage.setItem(LANDING_CONFIG_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(LANDING_CONFIG_UPDATE_EVENT, { detail: merged }));
    return true;
  } catch (err) {
    console.error('[landingConfig] Failed to save config to localStorage:', err);
    return false;
  }
}

/**
 * Reset config back to factory defaults
 */
export function resetLandingConfig() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LANDING_CONFIG_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(LANDING_CONFIG_UPDATE_EVENT, { detail: DEFAULT_LANDING_CONFIG }));
    return DEFAULT_LANDING_CONFIG;
  } catch (err) {
    console.error('[landingConfig] Failed to reset config:', err);
    return DEFAULT_LANDING_CONFIG;
  }
}

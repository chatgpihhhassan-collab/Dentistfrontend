import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Star, Mic, CheckCircle, Phone, Clock, Mail, ChevronRight, ChevronLeft, Users, Award, Shield, Heart } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import landingCmsService from '../services/landingCmsService';

// ── Scroll Reveal Component ─────────────────────────────────────────
function ScrollReveal({ children, delay = 0, duration = 600, transform = 'translateY(12px)' }) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 300px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Safety fallback: reveal after 300ms so content NEVER stays invisible or leaves blank space
    const timer = setTimeout(() => setIsIntersecting(true), 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isIntersecting ? 1 : 0.8,
        transform: isIntersecting ? 'none' : transform,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </div>
  );
}

// ── Dynamic Hero Slider Component ───────────────────────────────────
function DynamicHeroSlider({ slides = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white h-[500px] relative group bg-[#0A1A24]">
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              isActive ? 'opacity-100 scale-100 pointer-events-auto z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
            }`}
          >
            <img
              src={slide.img}
              alt={slide.badge || 'Dentia Clinic Care'}
              className={`object-cover w-full h-full transition-transform duration-[3800ms] ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-dark-slate/80 via-dark-slate/20 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/60 flex flex-col gap-2 z-20">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold text-primary-teal uppercase tracking-widest transition-all duration-700 delay-100 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {slide.badge}
                </span>

                <div className="flex items-center gap-1.5">
                  {slides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setCurrent(dotIdx)}
                      aria-label={`Slide ${dotIdx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === current ? 'w-6 bg-primary-teal' : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p
                className={`text-lg font-serif font-bold text-dark-slate transition-all duration-700 delay-300 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {slide.title}
              </p>
              <div
                className={`flex items-center gap-1.5 text-xs text-muted-text font-semibold transition-all duration-700 delay-500 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="w-1.5 h-1.5 bg-primary-teal rounded-full animate-pulse" />
                {slide.accent}
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-dark-slate" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-dark-slate" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Dynamic Home Page Component ────────────────────────────────
export default function LandingDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [config, setConfig] = useState(() => landingCmsService.getConfig());
  const [toastMessage, setToastMessage] = useState(location.state?.message || '');
  const [openFaq, setOpenFaq] = useState(null);
  const [clinicDoctors, setClinicDoctors] = useState([]);

  // WEB-001: Dynamic Loading of Real Clinic Doctors from /api/auth/doctors
  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/auth/doctors');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const activeDocs = data
              .filter(d => !d.isSuperAdmin && (d.firstName || d.lastName))
              .map((d, i) => ({
                img: d.avatarUrl || `/images/team/${(i % 4) + 1}.webp`,
                name: `Dr. ${(d.firstName || '') + ' ' + (d.lastName || '')}`.trim() || d.username,
                role: d.specialization || 'Clinical Dental Specialist',
                creds: d.qualifications || 'BDS, RDS • Experienced Clinician'
              }));
            if (activeDocs.length > 0) {
              setClinicDoctors(activeDocs);
            }
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    };
    fetchDoctors();
    return () => { isMounted = false; };
  }, []);

  // Subscribe to live doctor configuration updates from Studio
  useEffect(() => {
    const unsubscribe = landingCmsService.subscribe((updatedConfig) => {
      setConfig(updatedConfig);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const sec = config.sections || {};
  const cleanPhoneLink = `tel:${(config.phone || '').replace(/[^\d+]/g, '')}`;

  return (
    <div id="home" className="min-h-screen bg-warm-cream text-dark-slate font-sans selection:bg-light-teal selection:text-primary-teal relative overflow-x-hidden flex flex-col">
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 bg-primary-teal text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-fade-in-up">
          <CheckCircle className="w-6 h-6 text-white" />
          <span className="font-bold text-lg">{toastMessage}</span>
        </div>
      )}
      
      <Navigation />

      <main className="flex-grow">

        {/* ── 1. HERO SECTION ── */}
        {sec.showHeroSection && (
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-5 animate-fade-in-up">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center space-x-2 bg-light-teal px-4 py-1.5 rounded-full text-xs font-bold border border-light-teal/30 text-primary-teal">
                  <Star className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                  <span>{config.clinicName} • Clinical Excellence</span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-dark-slate leading-[1.12] tracking-tight">
                {config.tagline} <br />
                <span className="text-primary-teal font-serif font-semibold">{config.accentTagline}</span>
              </h1>

              <p className="text-base md:text-lg text-slate-700 leading-relaxed max-w-lg font-normal">
                {config.subTagline}
              </p>

              {/* Primary & Secondary CTAs - All working seamlessly */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1">
                <RouterLink 
                  to="/book" 
                  className="btn-main w-full sm:w-auto bg-primary-teal hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-primary-teal/20 hover:shadow-xl hover:scale-102 text-base text-center"
                >
                  Book Appointment
                </RouterLink>
                <RouterLink 
                  to="/treatment" 
                  className="btn-main w-full sm:w-auto bg-white border border-primary-teal/30 shadow-xs hover:bg-light-teal/20 text-primary-teal font-bold py-3.5 px-7 rounded-full transition-all text-base text-center"
                >
                  View Treatments &amp; Pricing
                </RouterLink>
              </div>

              {/* Consolidated Dynamic Social Proof Scorecard Ribbon */}
              {sec.showSocialProofRibbon && (
                <div className="pt-2">
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-accent-gold">
                        <span className="font-extrabold text-slate-900 text-sm">{config.socialProof?.googleRating || 5.0}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-current" />)}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">{config.socialProof?.googleReviewCountText || '23k+ Google Reviews'}</span>
                    </div>
                    
                    <div className="flex flex-col sm:pl-3 pt-2 sm:pt-0">
                      <span className="font-extrabold text-slate-900 text-sm">{config.socialProof?.happySmilesText || '12,000+'}</span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">Happy Smiles</span>
                    </div>

                    <div className="flex flex-col sm:pl-3 pt-2 sm:pt-0">
                      <span className="font-extrabold text-slate-900 text-sm">{config.socialProof?.yearsInPracticeText || '15+ Years'}</span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">Of Practice</span>
                    </div>

                    <div className="flex flex-col sm:pl-3 pt-2 sm:pt-0">
                      <span className="font-extrabold text-slate-900 text-sm">100% Digital</span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">32-Tooth Charting</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Hero Slider with Architectural Frame */}
            {sec.showHeroSlider && (
              <div className="relative animate-zoom-in">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary-teal/20 via-sky-200/30 to-primary-teal/10 rounded-[2.7rem] -z-10 blur-xs"></div>
                <DynamicHeroSlider slides={config.heroSlides} />
              </div>
            )}
          </section>
        )}

        {/* ── 2. HIGH-TRUST CLINICAL CREDENTIALS RIBBON ── */}
        {sec.showCredentialsRibbon && (
          <section className="bg-white/85 backdrop-blur-md py-6 border-y border-slate-200/80 shadow-xs">
            <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: <Shield className="w-5 h-5 text-primary-teal" />, 
                  label: 'Direct Insurance & Billing', 
                  sub: 'All major dental insurance accepted with instant automated electronic claims' 
                },
                { 
                  icon: <Clock className="w-5 h-5 text-primary-teal" />, 
                  label: 'Same-Day Emergency Relief', 
                  sub: 'Dedicated priority slots daily for acute toothache, broken crowns & trauma' 
                },
                { 
                  icon: <Heart className="w-5 h-5 text-primary-teal" />, 
                  label: 'Gentle & Anxiety-Free Care', 
                  sub: 'Painless digital local anesthesia and tailored comfort protocols for all ages' 
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-3.5 p-2 rounded-2xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-light-teal/50 flex items-center justify-center flex-shrink-0 border border-primary-teal/20 text-primary-teal">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-dark-slate">{item.label}</h4>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. ABOUT DOCTOR & CLINIC SECTION ── */}
        {sec.showAboutSection && (
          <section id="about" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16">
            <ScrollReveal transform="translateY(15px)">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left Column (Doctor Image with elevation) */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-teal/10 rounded-[2.5rem] -z-10 blur-xs"></div>
                  <img
                    src={config.aboutDoctor?.imageUrl || "/images/about_doctor.jpg"}
                    alt={config.aboutDoctor?.doctorName || "Lead Dental Specialist"}
                    className="rounded-[2.5rem] w-full h-[430px] object-cover shadow-xl border-4 border-white"
                  />
                  <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-3.5 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-teal/15 flex items-center justify-center text-primary-teal">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-dark-slate text-sm">{config.aboutDoctor?.smilesTransformedText || '12,000+ Smiles'}</p>
                      <p className="text-xs text-slate-500 font-medium">Transformed with care</p>
                    </div>
                  </div>
                </div>

                {/* Right Column (Dynamic Bio & Highlights) */}
                <div className="space-y-5">
                  <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">
                    {config.aboutDoctor?.badge || `About ${config.clinicName}`}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate leading-tight">
                    {config.aboutDoctor?.title || "Professional and Personalized Dental Excellence"}
                  </h2>
                  <p className="text-slate-700 leading-relaxed text-base font-normal">
                    {config.aboutDoctor?.doctorBio}
                  </p>
                  
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800 font-semibold text-sm">
                    {(config.aboutDoctor?.highlights || []).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700">
                        <CheckCircle className="w-4 h-4 text-primary-teal flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 flex items-center gap-4">
                    <RouterLink to="/about" className="btn-main inline-block bg-primary-teal hover:bg-primary-hover text-white font-bold py-3 px-7 rounded-full shadow-md text-sm transition-all">
                      Meet Our Dentists
                    </RouterLink>
                    <RouterLink to="/treatment" className="text-primary-teal hover:text-primary-hover font-bold text-sm flex items-center gap-1">
                      Explore Specialties <ChevronRight className="w-4 h-4" />
                    </RouterLink>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* ── 4. SERVICES & SPECIALTIES SECTION ── */}
        {sec.showServicesSection && (
          <section id="services" className="py-16 bg-slate-50/80 border-y border-slate-200/60">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                  <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Our Specialties</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate mt-1">Complete Care for Every Smile</h2>
                  <p className="text-slate-600 font-normal text-sm md:text-base mt-1 max-w-xl">
                    From routine preventive cleanings to advanced laser restorations, we provide tailored dental care with complete price transparency.
                  </p>
                </div>
                <RouterLink to="/treatment" className="inline-flex items-center text-primary-teal hover:text-primary-hover font-bold text-sm bg-white px-5 py-2.5 rounded-full border border-primary-teal/30 shadow-xs hover:shadow-sm transition-all whitespace-nowrap self-start md:self-end">
                  View All Procedures <ChevronRight className="w-4 h-4 ml-1" />
                </RouterLink>
              </div>

              {/* Dynamic Service Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(config.services || []).map((s, i) => (
                  <div key={s.id || i} className="card-hover bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group h-full flex flex-col justify-between">
                    <div>
                      <div className="w-13 h-13 bg-light-teal/50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-teal transition-all duration-300">
                        <img src={s.img} alt={s.title} className="w-8 h-8 object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                      </div>
                      <h3 className="text-lg font-bold text-dark-slate mb-1.5">{s.title}</h3>
                      <div className="text-[11px] font-semibold text-primary-teal bg-light-teal/40 px-2.5 py-0.5 rounded-full mb-3 inline-block">
                        {s.tags}
                      </div>
                      <p className="text-slate-600 font-normal text-sm leading-relaxed mb-5">{s.desc}</p>
                    </div>
                    <RouterLink to="/treatment" className="text-primary-teal font-bold flex items-center text-xs uppercase tracking-wider group-hover:text-primary-hover transition-colors">
                      Explore Treatments <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </RouterLink>
                  </div>
                ))}
              </div>

              {/* Dynamic Standard Fees Pricing Studio */}
              {sec.showPricingStudio && (
                <div className="mt-8 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-primary-teal uppercase tracking-wider">Fee Transparency</span>
                      <h3 className="text-lg font-bold text-dark-slate">Featured Treatments &amp; Standard Fees</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Itemized digital estimates provided before every procedure</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(config.featuredFees || []).map((t, idx) => (
                      <div key={t.id || idx} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-primary-teal uppercase tracking-wider">{t.badge}</span>
                          <h4 className="text-sm font-bold text-dark-slate mt-1 mb-2 leading-snug">{t.name}</h4>
                        </div>
                        <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Standard Fee</span>
                          <span className="text-sm font-extrabold text-dark-slate">{t.fee}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">Have dental insurance? We offer instant claims submission and flexible payment plans.</p>
                    <RouterLink to="/treatment" className="btn-main inline-flex items-center text-white bg-primary-teal hover:bg-primary-hover font-bold px-7 py-3 rounded-full shadow-md text-sm transition-all whitespace-nowrap">
                      View Complete Fee Studio <ChevronRight className="w-4 h-4 ml-1.5" />
                    </RouterLink>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 5. PRECISION AI DIAGNOSTICS CALLOUT ── */}
        {sec.showAiDiagnosticsCallout && (
          <section className="py-14 max-w-[1440px] mx-auto px-4 sm:px-6">
            <ScrollReveal transform="translateY(20px)">
              <div className="bg-dark-slate text-white rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-teal/20 rounded-full blur-3xl -mr-32 -mt-32 z-0"></div>
                <div className="relative z-10 space-y-5">
                  <div className="w-12 h-12 bg-primary-teal/20 rounded-2xl flex items-center justify-center text-primary-teal border border-primary-teal/30">
                    <Mic className="w-6 h-6" />
                  </div>
                  <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Modern Clinical Technology</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
                    Precision AI Diagnostics &amp; Digital Odontogram
                  </h2>
                  <p className="text-base text-slate-300 leading-relaxed font-normal">
                    Dentia utilizes cutting-edge AI-assisted diagnostic charting. Our lead specialists record tooth conditions, micro-cavities, and gum measurements digitally in real time, giving you 100% transparent visual dental records you can view from home.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {['Real-Time 3D Tooth Mapping', '100% Transparent Diagnostics', 'Digital Lifetime Records'].map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                        <CheckCircle className="w-3.5 h-3.5 text-primary-teal" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex items-center gap-4">
                    <RouterLink to="/treatment" className="btn-main inline-block bg-primary-teal hover:bg-primary-hover text-white font-bold py-3 px-7 rounded-full shadow-md text-sm text-center">
                      Explore Digital Care
                    </RouterLink>
                    <RouterLink to="/book" className="text-slate-300 hover:text-white font-semibold text-sm flex items-center gap-1">
                      Book First Visit <ChevronRight className="w-4 h-4" />
                    </RouterLink>
                  </div>
                </div>
                <div className="relative flex justify-center z-10">
                  <img src="/images/hero_clinic.jpg" alt="Dentia Advanced Digital Operatory" className="rounded-2xl shadow-xl max-h-[320px] w-full object-cover border border-white/10" />
                </div>
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* ── 6. SPECIALISTS TEAM SECTION ── */}
        {sec.showTeamSection && (
          <section id="team" className="py-16 bg-light-teal/10">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <ScrollReveal transform="translateY(20px)">
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                  <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Meet Our Specialists</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate">Committed to Your Healthy Smile</h2>
                  <p className="text-slate-600 text-sm md:text-base">Our experienced dental specialists are dedicated to making every visit pleasant, tailored, and gentle.</p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {(clinicDoctors.length > 0 ? clinicDoctors : [
                  { img: "/images/team/1.webp", name: "Dr. Sarah Bennett", role: "Lead Dental Surgeon", creds: "DDS, FACP • 14+ Yrs Exp" },
                  { img: "/images/team/2.webp", name: "Dr. Maya Lin", role: "Cosmetic Specialist", creds: "DMD, AACD • 10+ Yrs Exp" },
                  { img: "/images/team/3.webp", name: "Dr. Michael Reyes", role: "Pediatric Dentist", creds: "DDS, Board Cert. • 12+ Yrs Exp" },
                  { img: "/images/team/4.webp", name: "Dr. James Carter", role: "Oral Health & Hygiene", creds: "BDS, RDH • 8+ Yrs Exp" }
                ]).map((member, i) => (
                  <ScrollReveal key={i} delay={i * 60} transform="translateY(15px)">
                    <div className="group rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 bg-white border border-slate-200/80 relative h-full flex flex-col justify-between">
                      <div className="h-68 overflow-hidden relative bg-slate-100">
                        <img 
                          src={member.img} 
                          alt={member.name} 
                          className="w-full h-full object-cover object-top group-hover:scale-104 transition-transform duration-500" 
                        />
                      </div>
                      <div className="p-4 text-center flex-grow flex flex-col justify-center">
                        <h4 className="text-base font-bold text-dark-slate mb-0.5">{member.name}</h4>
                        <p className="text-xs font-semibold text-primary-teal">{member.role}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">{member.creds}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 7. FAQ ACCORDION SECTION ── */}
        {sec.showFaqSection && (
          <section className="py-16 max-w-[1440px] mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <ScrollReveal transform="translateY(20px)">
                <div className="text-center mb-10 space-y-2">
                  <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Everything You Need to Know</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate">Frequently Asked Questions</h2>
                </div>
              </ScrollReveal>

              <div className="space-y-3.5">
                {(config.faqs || []).map((faq, i) => (
                  <ScrollReveal key={faq.id || i} delay={i * 40} transform="translateY(15px)">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex justify-between items-center px-6 py-4.5 font-bold text-dark-slate text-base md:text-lg text-left hover:text-primary-teal transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <span className={`text-primary-teal text-xl font-bold transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      <div
                        style={{
                          maxHeight: openFaq === i ? '240px' : '0px',
                          transition: 'max-height 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                          overflow: 'hidden'
                        }}
                        className="transition-all duration-300"
                      >
                        <div className="px-6 pb-5 text-slate-600 leading-relaxed text-sm border-t border-slate-100 pt-3">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 8. VERIFIED GOOGLE REVIEWS & TESTIMONIALS ── */}
        {sec.showReviewsSection && (
          <section id="reviews" className="py-16 bg-slate-50 border-t border-slate-200/60">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <ScrollReveal transform="translateY(20px)">
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                  <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Verified Patient Stories</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate">
                    Trusted by Over {config.socialProof?.happySmilesText || '12,000 Families'}
                  </h2>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(config.reviews || []).map((t, i) => (
                  <ScrollReveal key={t.id || i} delay={i * 80} transform="translateY(20px)">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex text-accent-gold">
                            {[...Array(t.rating || 5)].map((_, s) => (
                              <Star key={s} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">Google Verified</span>
                        </div>
                        <p className="text-slate-600 italic mb-5 leading-relaxed text-sm font-normal">"{t.text}"</p>
                      </div>
                      <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                        <img src={t.img || "/images/testimonial/1.webp"} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h5 className="font-bold text-dark-slate text-sm">{t.name}</h5>
                          <p className="text-xs text-slate-500 font-medium">{t.dateText || 'Verified Patient'}</p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 9. PRE-FOOTER ONLINE APPOINTMENT CALLOUT ── */}
        {sec.showPreFooterCta && (
          <section className="py-20 bg-gradient-to-r from-dark-slate via-[#0D2434] to-dark-slate text-white text-center relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
              <span className="inline-flex items-center gap-2 bg-primary-teal/20 text-primary-teal px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-primary-teal/30">
                {config.ctaBanner?.badge || "Immediate Online Confirmation"}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
                {config.ctaBanner?.title || "Ready for a Healthier, More Radiant Smile?"}
              </h2>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto font-normal">
                {config.ctaBanner?.subtitle || "Book your comprehensive dental checkup and digital charting online in under 60 seconds. Same-day emergency appointments available."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <RouterLink 
                  to="/book" 
                  className="btn-main bg-primary-teal hover:bg-primary-hover text-white font-bold py-4 px-9 rounded-full transition-all shadow-xl shadow-primary-teal/30 hover:scale-102 text-lg"
                >
                  {config.ctaBanner?.buttonText || "Book Appointment Online"}
                </RouterLink>
                <a 
                  href={cleanPhoneLink} 
                  className="btn-main bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full border border-white/20 transition-all text-lg flex items-center gap-2"
                >
                  <Phone className="w-5 h-5 text-primary-teal" /> Call: {config.phone}
                </a>
              </div>
            </div>
          </section>
        )}

      </main>

      {sec.showFooter && <Footer />}
    </div>
  );
}

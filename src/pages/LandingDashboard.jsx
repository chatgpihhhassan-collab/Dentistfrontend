import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Star, Mic, CheckCircle, Phone, Clock, Mail, ChevronRight, ChevronLeft, Users, Award, Shield, Heart } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

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

// ── Hero Slides Configuration ───────────────────────────────────────
const SLIDES = [
  {
    img: '/images/hero_clinic.jpg',
    badge: 'State-of-the-Art Care',
    title: 'Experience professional and personalized dental excellence.',
    accent: 'Dentia Clinical Workspace'
  },
  {
    img: '/images/hero_slide2.jpg',
    badge: 'Empathetic Consultation',
    title: 'Our lead doctors listen first, treat with care, and counsel for life.',
    accent: 'Bilingual AI Charting'
  },
  {
    img: '/images/hero_slide3.jpg',
    badge: 'Smiles Transformed',
    title: 'Achieve a healthy, radiant smile with our cosmetic specialties.',
    accent: 'Tailored Treatment Plans'
  }
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  return (
    <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white h-[500px] relative group bg-[#0A1A24]">
      {/* Slides container */}
      {SLIDES.map((slide, idx) => {
        const isActive = idx === current;
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              isActive ? 'opacity-100 scale-100 pointer-events-auto z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
            }`}
          >
            {/* Background Image with Ken Burns effect when active */}
            <img
              src={slide.img}
              alt={slide.badge}
              className={`object-cover w-full h-full transition-transform duration-[3500ms] ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-slate/80 via-dark-slate/20 to-transparent" />

            {/* Slide Content with staggered text animations */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/60 flex flex-col gap-2 z-20">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold text-primary-teal uppercase tracking-widest transition-all duration-700 delay-100 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {slide.badge}
                </span>

                {/* Slider progress indicators integrated neatly in the header */}
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((_, dotIdx) => (
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

      {/* Navigation Arrows */}
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
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────
export default function LandingDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState(location.state?.message || '');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const faqs = [
    { q: "How often should I visit the dentist?", a: "It's recommended to see your dentist every 6 months for a routine check-up and cleaning, unless advised otherwise by your specialist." },
    { q: "What should I do in a dental emergency?", a: "Call our office immediately. We offer priority same-day emergency slots for dental issues like root pain or fractured teeth." },
    { q: "Do you offer services for kids?", a: "Absolutely! We provide pediatric care using child-friendly procedures to make visits pleasant and stress-free." },
    { q: "Is teeth whitening safe?", a: "Yes, professional dental whitening is completely safe under monitoring, and delivers bright, durable results." }
  ];

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

        {/* ── HERO SECTION ── */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-5 animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 bg-light-teal px-4 py-1.5 rounded-full text-xs font-bold border border-light-teal/30 text-primary-teal">
                <Star className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                <span>Family Dental Care &amp; Clinical Excellence</span>
              </div>
              <a
                href="https://dentistfrontend.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 text-slate-700 shadow-xs transition-all hover:text-primary-teal hover:border-primary-teal/40"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Cloud: <strong className="text-primary-teal">https://dentistfrontend.vercel.app/</strong></span>
              </a>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-dark-slate leading-[1.12] tracking-tight">
              Elevating Smiles <br />
              <span className="text-primary-teal font-serif font-semibold">With Expert Care.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-700 leading-relaxed max-w-lg font-normal">
              We chart all 32 teeth digitally on your first visit, offering 100% transparent diagnostics and gentle, advanced dental treatments designed to last a lifetime.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1">
              <RouterLink to="/book" className="btn-main w-full sm:w-auto bg-primary-teal hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-primary-teal/20 hover:shadow-xl hover:scale-102 text-base text-center">
                Book Appointment
              </RouterLink>
              <RouterLink to="/treatment" className="btn-main w-full sm:w-auto bg-white border border-primary-teal/30 shadow-xs hover:bg-light-teal/20 text-primary-teal font-bold py-3.5 px-7 rounded-full transition-all text-base text-center">
                View Treatments &amp; Pricing
              </RouterLink>
            </div>

            {/* Consolidated High-Trust Social Proof Ribbon (Replaces fragmented pills) */}
            <div className="pt-2">
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-accent-gold">
                    <span className="font-extrabold text-slate-900 text-sm">5.0</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 fill-current" />)}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">23k+ Google Reviews</span>
                </div>
                
                <div className="flex flex-col sm:pl-3 pt-2 sm:pt-0">
                  <span className="font-extrabold text-slate-900 text-sm">12,000+</span>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">Happy Smiles</span>
                </div>

                <div className="flex flex-col sm:pl-3 pt-2 sm:pt-0">
                  <span className="font-extrabold text-slate-900 text-sm">15+ Years</span>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">Of Practice</span>
                </div>

                <div className="flex flex-col sm:pl-3 pt-2 sm:pt-0">
                  <span className="font-extrabold text-slate-900 text-sm">100% Digital</span>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">32-Tooth Charting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Slider with Clean Architectural Frame */}
          <div className="relative animate-zoom-in">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary-teal/20 via-sky-200/30 to-primary-teal/10 rounded-[2.7rem] -z-10 blur-xs"></div>
            <HeroSlider />
          </div>
        </section>

        {/* ── HIGH-TRUST CLINICAL CREDENTIALS RIBBON (Light, Non-Redundant) ── */}
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

        {/* ── ABOUT US SECTION ── */}
        <section id="about" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16">
          <ScrollReveal transform="translateY(15px)">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column (Doctor Image with clean elevation) */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary-teal/10 rounded-[2.5rem] -z-10 blur-xs"></div>
                <img
                  src="/images/about_doctor.jpg"
                  alt="Lead Dental Specialist Dr. Sarah Bennett at Dentia"
                  className="rounded-[2.5rem] w-full h-[430px] object-cover shadow-xl border-4 border-white"
                />
                <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-3.5 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-teal/15 flex items-center justify-center text-primary-teal">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-dark-slate text-sm">12,000+ Smiles</p>
                    <p className="text-xs text-slate-500 font-medium">Transformed with care</p>
                  </div>
                </div>
              </div>

              {/* Right Column (Content) */}
              <div className="space-y-5">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">About Dentia Dental Arts</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate leading-tight">
                  Professional and Personalized Dental Excellence
                </h2>
                <p className="text-slate-700 leading-relaxed text-base font-normal">
                  At <span className="font-bold text-dark-slate">Dentia</span>, we believe everyone deserves a healthy, confident smile. Led by Dr. Sarah Bennett and our team of credentialed specialists, we combine cutting-edge technology with compassionate, patient-first care to deliver results that last a lifetime.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800 font-semibold text-sm">
                  {[
                    'Personalized Treatment Plans',
                    'Gentle Care for Kids & Adults',
                    'State-of-the-Art Technology',
                    'Flexible Appointment Slots',
                    'Digital Odontogram Records',
                    'Digital Dental X-Rays',
                  ].map((item, i) => (
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

        {/* ── SERVICES & TRANSPARENT PRICING SECTION ── */}
        <section id="services" className="py-16 bg-slate-50/80 border-y border-slate-200/60">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            {/* Section Header with Direct Secondary Action */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
              <div>
                <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Our Specialties</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate mt-1">Complete Care for Every Smile</h2>
                <p className="text-slate-600 font-normal text-sm md:text-base mt-1 max-w-xl">
                  From routine preventive cleanings to advanced laser restorations, we provide tailored dental care with complete price transparency.
                </p>
              </div>
              <RouterLink to="/treatment" className="inline-flex items-center text-primary-teal hover:text-primary-hover font-bold text-sm bg-white px-5 py-2.5 rounded-full border border-primary-teal/30 shadow-xs hover:shadow-sm transition-all whitespace-nowrap self-start md:self-end">
                View All 140+ Procedures <ChevronRight className="w-4 h-4 ml-1" />
              </RouterLink>
            </div>

            {/* 4 Primary Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { img: "/images/icons/tooth-1.png", title: "General Dentistry", desc: "Complete oral health care with gentle ultrasonic cleanings, digital checkups, and cavity prevention.", tags: "Exams • Cleanings • Fluoride" },
                { img: "/images/icons/tooth-2.png", title: "Cosmetic Dentistry", desc: "Enhance your smile radiance with laser whitening, ultra-thin porcelain veneers, and cosmetic bonding.", tags: "Laser Whitening • Veneers" },
                { img: "/images/icons/tooth-3.png", title: "Pediatric Dentistry", desc: "Gentle, stress-free dental experiences crafted specially for children and growing young smiles.", tags: "Child Friendly • Sealants" },
                { img: "/images/icons/tooth-4.png", title: "Restorative Dentistry", desc: "Repair damaged or missing teeth with precision digital implants, durable crowns, and aesthetic bridges.", tags: "Implants • Crowns • Bridges" }
              ].map((s, i) => (
                <div key={i} className="card-hover bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group h-full flex flex-col justify-between">
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

            {/* Transparent Pricing Teaser — Resolves Whitespace Canyon & Contextualizes Pricing */}
            <div className="mt-8 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-primary-teal uppercase tracking-wider">Fee Transparency</span>
                  <h3 className="text-lg font-bold text-dark-slate">Featured Treatments &amp; Standard Fees</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Itemized digital estimates provided before every procedure</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Initial Exam & 32-Tooth Digital Odontogram", fee: "Included with Visit", badge: "Diagnostic" },
                  { name: "Ultrasonic Scaling & Airflow Polishing", fee: "From $85", badge: "Preventive" },
                  { name: "In-Office Laser Teeth Whitening", fee: "From $250", badge: "Cosmetic" },
                  { name: "Digital Single Tooth Implant + Crown", fee: "From $950", badge: "Restorative" },
                ].map((t, idx) => (
                  <div key={idx} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between">
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
                <p className="text-xs text-slate-500">Have dental insurance? We offer instant claims submission and flexible 0% interest payment plans.</p>
                <RouterLink to="/treatment" className="btn-main inline-flex items-center text-white bg-primary-teal hover:bg-primary-hover font-bold px-7 py-3 rounded-full shadow-md text-sm transition-all whitespace-nowrap">
                  View Complete Fee Studio <ChevronRight className="w-4 h-4 ml-1.5" />
                </RouterLink>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRECISION DIGITAL DIAGNOSTICS CALLOUT ── */}
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
                {/* Distinct high-tech clinic image avoiding duplication of hero consultation photo */}
                <img src="/images/hero_clinic.jpg" alt="Dentia Advanced Digital Operatory" className="rounded-2xl shadow-xl max-h-[320px] w-full object-cover border border-white/10" />
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── MEET THE TEAM SECTION (Credible Doctor Qualifications) ── */}
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
              {[
                { img: "/images/team/1.webp", name: "Dr. Sarah Bennett", role: "Lead Dental Surgeon", creds: "DDS, FACP • 14+ Yrs Exp" },
                { img: "/images/team/2.webp", name: "Dr. Maya Lin", role: "Cosmetic Specialist", creds: "DMD, AACD • 10+ Yrs Exp" },
                { img: "/images/team/3.webp", name: "Dr. Michael Reyes", role: "Pediatric Dentist", creds: "DDS, Board Cert. • 12+ Yrs Exp" },
                { img: "/images/team/4.webp", name: "Dr. James Carter", role: "Oral Health & Hygiene", creds: "BDS, RDH • 8+ Yrs Exp" }
              ].map((member, i) => (
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

        {/* ── FAQ SECTION ── */}
        <section className="py-16 max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal transform="translateY(20px)">
              <div className="text-center mb-10 space-y-2">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Everything You Need to Know</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate">Frequently Asked Questions</h2>
              </div>
            </ScrollReveal>

            <div className="space-y-3.5">
              {faqs.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 40} transform="translateY(15px)">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex justify-between items-center px-6 py-4.5 font-bold text-dark-slate text-base md:text-lg text-left hover:text-primary-teal transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className={`text-primary-teal text-xl font-bold transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    <div
                      style={{
                        maxHeight: openFaq === i ? '200px' : '0px',
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

        {/* ── TESTIMONIALS SECTION ── */}
        <section id="reviews" className="py-16 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
            <ScrollReveal transform="translateY(20px)">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Verified Patient Stories</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-dark-slate">Trusted by Over 12,000 Families</h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { img: "/images/testimonial/1.webp", name: "Michael S.", text: "I've always been nervous about dental visits, but the staff at Dentia made me feel completely comfortable. Their gentle care and attention to detail truly stand out." },
                { img: "/images/testimonial/2.webp", name: "Robert L.", text: "My family and I have been coming here for years. The service is exceptional, and the team always goes the extra mile to make sure we're happy and well taken care of." },
                { img: "/images/testimonial/3.webp", name: "Jake M.", text: "I came in for a whitening treatment and left with a brand new level of confidence. The results were amazing, and the staff made it such a relaxing experience." }
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i * 80} transform="translateY(20px)">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex text-accent-gold">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">Google Verified</span>
                      </div>
                      <p className="text-slate-600 italic mb-5 leading-relaxed text-sm font-normal">"{t.text}"</p>
                    </div>
                    <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                      <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h5 className="font-bold text-dark-slate text-sm">{t.name}</h5>
                        <p className="text-xs text-slate-500 font-medium">Verified Patient • Patient Since 2023</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HIGH-CONVERSION PRE-FOOTER APPOINTMENT BANNER ── */}
        <section className="py-20 bg-gradient-to-r from-dark-slate via-[#0D2434] to-dark-slate text-white text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 bg-primary-teal/20 text-primary-teal px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-primary-teal/30">
              Immediate Online Confirmation
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              Ready for a Healthier, More Radiant Smile?
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto font-normal">
              Book your comprehensive dental checkup and digital charting online in under 60 seconds. Same-day emergency appointments available.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <RouterLink to="/book" className="btn-main bg-primary-teal hover:bg-primary-hover text-white font-bold py-4 px-9 rounded-full transition-all shadow-xl shadow-primary-teal/30 hover:scale-102 text-lg">
                Book Appointment Online
              </RouterLink>
              <a href="tel:+1123456789" className="btn-main bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full border border-white/20 transition-all text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-teal" /> Call: +1 123 456 789
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

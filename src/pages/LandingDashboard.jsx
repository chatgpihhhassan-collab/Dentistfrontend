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
    accent: 'Lumina Digital Workspace'
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
              <span
                className={`text-xs font-bold text-primary-teal uppercase tracking-widest transition-all duration-700 delay-100 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {slide.badge}
              </span>
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
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-105"
      >
        <ChevronLeft className="w-5 h-5 text-dark-slate" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-105"
      >
        <ChevronRight className="w-5 h-5 text-dark-slate" />
      </button>

      {/* Progress/Dot indicators */}
      <div className="absolute bottom-[110px] left-6 z-30 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (isTransitioning) return;
              setIsTransitioning(true);
              setCurrent(idx);
              setTimeout(() => setIsTransitioning(false), 800);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === current ? 'w-8 bg-primary-teal' : 'w-2 bg-white/60'
            }`}
          />
        ))}
      </div>
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
        <section className="max-w-[1800px] mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-light-teal px-5 py-2 rounded-full text-sm font-bold border border-light-teal/30 text-primary-teal">
              <Star className="w-4 h-4 fill-accent-gold text-accent-gold" />
              <span>Family Dental Care &amp; Clinic</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-dark-slate leading-[1.1] tracking-tight">
              Elevating Smiles <br />
              <span className="text-primary-teal font-serif font-semibold">With Expert Care.</span>
            </h1>
            <p className="text-lg text-slate-700 leading-relaxed max-w-lg font-normal">
              We chart all 32 teeth digitally on your first visit, offering transparent diagnostics and advanced treatments with a gentle touch.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <RouterLink to="/book" className="btn-main w-full sm:w-auto bg-primary-teal hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg shadow-primary-teal/20 hover:shadow-xl hover:scale-102 text-lg text-center">
                Book Appointment
              </RouterLink>
              <RouterLink to="/treatment" className="btn-main w-full sm:w-auto bg-white border border-primary-teal/40 shadow-sm hover:bg-light-teal/20 text-primary-teal font-bold py-4 px-8 rounded-full transition-all text-lg text-center">
                View Treatments &amp; Pricing
              </RouterLink>
            </div>
            <div className="pt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
              <span className="text-dark-slate font-bold text-lg">Google Rating 5.0</span>
              <div className="flex text-accent-gold">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
              </div>
              <span>Based on 23k Reviews</span>
            </div>
            {/* Stat Pills */}
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { icon: <Users className="w-4 h-4" />, label: '12,000+', sub: 'Happy Patients' },
                { icon: <Award className="w-4 h-4" />, label: '15 Years', sub: 'of Excellence' },
                { icon: <Shield className="w-4 h-4" />, label: '100%', sub: 'Safe Procedures' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border border-light-teal/40 rounded-2xl px-4 py-2.5 shadow-sm">
                  <span className="text-primary-teal">{stat.icon}</span>
                  <div>
                    <p className="font-extrabold text-dark-slate text-sm leading-none">{stat.label}</p>
                    <p className="text-xs text-slate-500 font-medium">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Slider with Slide Animations */}
          <div className="relative animate-zoom-in">
            <div className="absolute inset-0 bg-light-teal/60 rounded-[2.5rem] transform rotate-2 scale-102 -z-10 shadow-inner"></div>
            <HeroSlider />
          </div>
        </section>

        {/* ── HIGH-TRUST CLINICAL PROMISE STRIP ── */}
        <section className="bg-gradient-to-r from-dark-slate via-[#0E2838] to-dark-slate text-white py-8 border-y border-white/10 shadow-md">
          <div className="max-w-[1800px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Phone className="w-6 h-6" />, label: 'Emergency & Routine Appointments', value: 'Call: +1 123 456 789' },
              { icon: <Clock className="w-6 h-6" />, label: 'Flexible Practice Hours', value: 'Mon to Sat: 08:00 - 20:00' },
              { icon: <Shield className="w-6 h-6" />, label: 'Transparent Care & Direct Billing', value: 'All Major Insurance Accepted' },
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 hover:bg-white/5 rounded-2xl transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary-teal/20 flex items-center justify-center text-primary-teal flex-shrink-0 border border-primary-teal/30">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs text-primary-teal/90 font-bold uppercase tracking-wider">{item.label}</h4>
                  <p className="text-base md:text-lg font-bold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ABOUT US SECTION ── */}
        <section id="about" className="max-w-[1800px] mx-auto px-4 py-16">
          <ScrollReveal transform="translateY(15px)">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              {/* Left Column (Doctor Image with floating card) */}
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-full h-full bg-light-teal/40 rounded-[2.5rem] -z-10 rotate-2"></div>
                <img
                  src="/images/about_doctor.jpg"
                  alt="Lead Specialist at Dentia"
                  className="rounded-[2.5rem] w-full h-[420px] object-cover shadow-2xl border-4 border-white"
                />
                <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl p-4 border border-light-teal/30 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-dark-slate text-sm">12,000+ Smiles</p>
                    <p className="text-xs text-slate-500 font-medium">Transformed with care</p>
                  </div>
                </div>
              </div>

              {/* Right Column (Content) */}
              <div className="space-y-5">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-sm">About Dentia</span>
                <h2 className="text-4xl font-serif font-bold text-dark-slate leading-tight">
                  Professional and Personalized Dental Excellence
                </h2>
                <p className="text-slate-700 leading-relaxed text-base font-normal">
                  At <span className="font-bold text-dark-slate">Dentia</span>, we believe everyone deserves a healthy, confident smile. Our expert team combines cutting-edge technology with compassionate, patient-first care to deliver results that last a lifetime. From your first consultation to your final follow-up, we are by your side every step of the way.
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
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-teal flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 flex items-center gap-4">
                  <RouterLink to="/about" className="btn-main inline-block bg-primary-teal hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-full shadow-lg transition-all">
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

        {/* ── SERVICES SECTION (Eager Render, Zero Ghost Whitespace) ── */}
        <section id="services" className="py-16 bg-slate-50/80 border-y border-slate-200/60">
          <div className="max-w-[1800px] mx-auto px-4">
            <div className="mb-12 text-center max-w-2xl mx-auto space-y-3">
              <span className="text-primary-teal font-bold tracking-widest uppercase text-sm">Our Specialties</span>
              <h2 className="text-4xl font-serif font-bold text-dark-slate">Complete Care for Every Smile</h2>
              <p className="text-slate-600 font-normal">From routine preventive checkups to advanced restorations, we provide personalized dental solutions for patients of all ages.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { img: "/images/icons/tooth-1.png", title: "General Dentistry", desc: "Complete oral care for every smile with gentle cleanings, digital checkups, and prevention.", tags: "Exams • Cleanings • Fluoride" },
                { img: "/images/icons/tooth-2.png", title: "Cosmetic Dentistry", desc: "Enhance your smile's radiance with laser whitening, porcelain veneers, and cosmetic bonding.", tags: "Laser Whitening • Veneers" },
                { img: "/images/icons/tooth-3.png", title: "Pediatric Dentistry", desc: "Gentle and fun dental experiences designed specially for children and growing smiles.", tags: "Child Friendly • Sealants" },
                { img: "/images/icons/tooth-4.png", title: "Restorative Dentistry", desc: "Repair and restore missing or damaged teeth for lasting comfort, strength, and function.", tags: "Implants • Crowns • Bridges" }
              ].map((s, i) => (
                <div key={i} className="card-hover bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative group h-full flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-light-teal/50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary-teal transition-all duration-300">
                      <img src={s.img} alt={s.title} className="w-9 h-9 object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                    </div>
                    <h3 className="text-xl font-bold text-dark-slate mb-2">{s.title}</h3>
                    <div className="text-xs font-semibold text-primary-teal bg-light-teal/50 px-3 py-1 rounded-full mb-4 inline-block">
                      {s.tags}
                    </div>
                    <p className="text-slate-600 font-normal text-sm leading-relaxed mb-6">{s.desc}</p>
                  </div>
                  <RouterLink to="/treatment" className="text-primary-teal font-bold flex items-center text-sm group-hover:text-primary-hover transition-colors">
                    Explore Treatments <ChevronRight className="w-4 h-4 ml-1" />
                  </RouterLink>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <RouterLink to="/treatment" className="btn-main inline-flex items-center text-white bg-primary-teal hover:bg-primary-hover font-bold px-9 py-4 rounded-full shadow-lg shadow-primary-teal/20 hover:shadow-xl transition-all text-base">
                View All Services &amp; Pricing <ChevronRight className="w-5 h-5 ml-1" />
              </RouterLink>
            </div>
          </div>
        </section>

        {/* ── PRECISION DIGITAL DIAGNOSTICS CALLOUT ── */}
        <section className="py-16 max-w-[1800px] mx-auto px-4">
          <ScrollReveal transform="translateY(25px)">
            <div className="bg-dark-slate text-white rounded-[3rem] p-10 md:p-14 relative overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary-teal/20 rounded-full blur-3xl -mr-32 -mt-32 z-0"></div>
              <div className="relative z-10 space-y-5">
                <div className="w-14 h-14 bg-primary-teal/20 rounded-2xl flex items-center justify-center text-primary-teal border border-primary-teal/30">
                  <Mic className="w-7 h-7" />
                </div>
                <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Modern Clinical Technology</span>
                <h2 className="text-4xl font-serif font-bold leading-tight">
                  Precision AI Diagnostics &amp; Digital Odontogram
                </h2>
                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  Dentia utilizes cutting-edge AI-assisted diagnostic charting. Our lead specialists record tooth conditions, micro-cavities, and gum measurements digitally in real time, giving you 100% transparent visual dental records you can view from home.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Real-Time 3D Tooth Mapping', '100% Transparent Diagnostics', 'Digital Lifetime Records'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-200">
                      <CheckCircle className="w-4 h-4 text-primary-teal" /> {f}
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex items-center gap-4">
                  <RouterLink to="/treatment" className="btn-main inline-block bg-primary-teal hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-full shadow-md text-center">
                    Explore Digital Care
                  </RouterLink>
                  <RouterLink to="/book" className="text-slate-300 hover:text-white font-semibold text-sm flex items-center gap-1">
                    Book First Visit <ChevronRight className="w-4 h-4" />
                  </RouterLink>
                </div>
              </div>
              <div className="relative flex justify-center z-10">
                <img src="/images/hero_slide2.jpg" alt="Clinical workspace" className="rounded-2xl shadow-xl max-h-[320px] w-full object-cover border border-white/10" />
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── MEET THE TEAM SECTION (Fixed Object-Top Framing) ── */}
        <section id="team" className="py-16 bg-light-teal/10">
          <div className="max-w-[1800px] mx-auto px-4">
            <ScrollReveal transform="translateY(25px)">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-sm">Meet Our Specialists</span>
                <h2 className="text-4xl font-serif font-bold text-dark-slate">Committed to Your Healthy Smile</h2>
                <p className="text-slate-600">Our experienced dental specialists are dedicated to making every visit pleasant, tailored, and gentle.</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { img: "/images/team/1.webp", name: "Dr. Sarah Bennett", role: "Lead Dentist & Oral Surgeon" },
                { img: "/images/team/2.webp", name: "Dr. Maya Lin", role: "Cosmetic & Veneers Specialist" },
                { img: "/images/team/3.webp", name: "Dr. Michael Reyes", role: "Pediatric Dentist" },
                { img: "/images/team/4.webp", name: "Dr. James Carter", role: "Oral Health & Hygiene Lead" }
              ].map((member, i) => (
                <ScrollReveal key={i} delay={i * 80} transform="translateY(20px)">
                  <div className="group rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border border-light-teal/30 relative h-full flex flex-col justify-between">
                    <div className="h-72 overflow-hidden relative bg-slate-100">
                      <img 
                        src={member.img} 
                        alt={member.name} 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <div className="p-5 text-center flex-grow flex flex-col justify-center">
                      <h4 className="text-lg font-bold text-dark-slate mb-1">{member.name}</h4>
                      <p className="text-xs font-semibold text-primary-teal uppercase tracking-wider">{member.role}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section className="py-16 max-w-[1800px] mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal transform="translateY(25px)">
              <div className="text-center mb-12 space-y-3">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-sm">Everything You Need to Know</span>
                <h2 className="text-4xl font-serif font-bold text-dark-slate">Frequently Asked Questions</h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 40} transform="translateY(15px)">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex justify-between items-center px-6 py-5 font-bold text-dark-slate text-lg text-left hover:text-primary-teal transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span className={`text-primary-teal text-2xl transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    <div
                      style={{
                        maxHeight: openFaq === i ? '200px' : '0px',
                        transition: 'max-height 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                        overflow: 'hidden'
                      }}
                      className="transition-all duration-300"
                    >
                      <div className="px-6 pb-5 text-slate-700 leading-relaxed text-sm border-t border-slate-100 pt-4">
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
          <div className="max-w-[1800px] mx-auto px-4">
            <ScrollReveal transform="translateY(25px)">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-primary-teal font-bold tracking-widest uppercase text-sm">Verified Patient Stories</span>
                <h2 className="text-4xl font-serif font-bold text-dark-slate">Trusted by Over 12,000 Families</h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { img: "/images/testimonial/1.webp", name: "Michael S.", text: "I've always been nervous about dental visits, but the staff at Dentia made me feel completely comfortable. Their gentle care and attention to detail truly stand out." },
                { img: "/images/testimonial/2.webp", name: "Robert L.", text: "My family and I have been coming here for years. The service is exceptional, and the team always goes the extra mile to make sure we're happy and well taken care of." },
                { img: "/images/testimonial/3.webp", name: "Jake M.", text: "I came in for a whitening treatment and left with a brand new level of confidence. The results were amazing, and the staff made it such a relaxing experience." }
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i * 80} transform="translateY(20px)">
                  <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between h-full">
                    <div>
                      <div className="flex text-accent-gold mb-3">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                      </div>
                      <p className="text-slate-700 italic mb-5 leading-relaxed font-normal">"{t.text}"</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <img src={t.img} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <h5 className="font-bold text-dark-slate">{t.name}</h5>
                        <p className="text-xs text-slate-500 font-medium">Verified Patient</p>
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

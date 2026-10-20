import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { 
  Globe, 
  Save, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Phone, 
  Clock, 
  Mail, 
  MapPin, 
  Star, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  ExternalLink, 
  Check, 
  ChevronRight,
  Shield,
  Heart,
  Stethoscope,
  Users
} from 'lucide-react';
import landingCmsService from '../services/landingCmsService';
import { DEFAULT_LANDING_CONFIG } from '../config/landingConfigDefaults';

export default function ClinicWebsiteStudio() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(() => landingCmsService.getConfig());
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'contact' | 'hero' | 'reviews' | 'faq'
  const [saveToast, setSaveToast] = useState({ visible: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = landingCmsService.subscribe((newCfg) => {
      setConfig(newCfg);
    });
    return () => unsub();
  }, []);

  const showToast = (message, type = 'success') => {
    setSaveToast({ visible: true, message, type });
    setTimeout(() => {
      setSaveToast({ visible: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await landingCmsService.saveConfig(config);
      showToast('✅ Clinic website settings published successfully! Changes are live on the home page.', 'success');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all website settings back to default factory content?')) {
      landingCmsService.resetConfig();
      setConfig(DEFAULT_LANDING_CONFIG);
      showToast('Website content restored to defaults.', 'info');
    }
  };

  // Section toggle handler
  const toggleSection = (sectionKey) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: !prev.sections[sectionKey]
      }
    }));
  };

  // Add review
  const handleAddReview = () => {
    const newRev = {
      id: 'rev-' + Date.now(),
      name: 'New Verified Patient',
      rating: 5,
      dateText: 'Verified Patient • Patient Since 2026',
      img: '/images/testimonial/1.webp',
      text: 'Exceptional dental treatment, gentle care, and state-of-the-art digital technology!'
    };
    setConfig(prev => ({
      ...prev,
      reviews: [newRev, ...prev.reviews]
    }));
  };

  // Delete review
  const handleDeleteReview = (id) => {
    setConfig(prev => ({
      ...prev,
      reviews: prev.reviews.filter(r => r.id !== id)
    }));
  };

  // Add FAQ
  const handleAddFaq = () => {
    const newFaq = {
      id: 'faq-' + Date.now(),
      q: 'New Patient Question?',
      a: 'Detailed answer explaining the dental care procedure, timing, and clinical recommendations.'
    };
    setConfig(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFaq]
    }));
  };

  // Delete FAQ
  const handleDeleteFaq = (id) => {
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.filter(f => f.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-dark-slate font-sans flex flex-col">
      <Navigation />

      {/* Floating Toast Notification */}
      {saveToast.visible && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-fade-in-up ${
          saveToast.type === 'error' ? 'bg-rose-600 text-white' : saveToast.type === 'info' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {saveToast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="font-bold text-sm">{saveToast.message}</span>
        </div>
      )}

      {/* Main Studio Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-22 z-30 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-teal/15 flex items-center justify-center text-primary-teal border border-primary-teal/20 shadow-xs">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-dark-slate">Clinic Website &amp; Home Page Studio</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  Doctor CMS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage all landing page content, exclude or include sections, update cell number, timings, and Google reviews dynamically.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => window.open('/', '_blank')}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Preview live home page in new tab"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Preview Live Page</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Reset all settings to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold transition shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Publishing...' : 'Save & Publish Changes'}</span>
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="max-w-[1440px] mx-auto px-6 flex space-x-2 overflow-x-auto scrollbar-none border-t border-slate-100">
          {[
            { id: 'sections', label: '1. Section Visibility (Add/Exclude)', icon: Sliders },
            { id: 'contact', label: '2. Clinic Contact & Hours', icon: Phone },
            { id: 'hero', label: '3. Hero & About Studio', icon: Sparkles },
            { id: 'reviews', label: '4. Google Reviews & Proof', icon: Star },
            { id: 'faq', label: '5. Services, Fees & FAQs', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'border-primary-teal text-primary-teal bg-light-teal/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-teal' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Body Content */}
      <main className="flex-grow max-w-[1440px] w-full mx-auto px-6 py-8">

        {/* ── TAB 1: SECTION VISIBILITY TOGGLE MATRIX ── */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-dark-slate">Home Page Sections Visibility Matrix</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instantly exclude or include any section on the home page. Excluded sections will not appear to patients.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Toggle ON to Show • Toggle OFF to Exclude</span>
                </div>
              </div>

              {/* Toggle Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    key: 'showTopContactBar',
                    title: 'Top Contact Header Bar',
                    desc: 'Shows clinic phone, operating hours, email, and Google rating score at the top.',
                    badge: 'Header'
                  },
                  {
                    key: 'showHeroSection',
                    title: 'Main Hero Banner',
                    desc: 'Primary headline, value proposition, and CTA buttons (Book Appointment & Treatments).',
                    badge: 'Hero'
                  },
                  {
                    key: 'showHeroSlider',
                    title: 'Hero Image Slideshow',
                    desc: 'Animated 3-slide visual showcase of modern clinical operatory and patient care.',
                    badge: 'Hero Media'
                  },
                  {
                    key: 'showSocialProofRibbon',
                    title: 'Social Proof Scorecard Ribbon',
                    desc: 'Consolidated trust ribbon: 5.0 Google Rating, 12k+ Smiles, 15+ Years, 100% Digital.',
                    badge: 'Trust'
                  },
                  {
                    key: 'showCredentialsRibbon',
                    title: 'Clinical Credentials Ribbon',
                    desc: 'Direct Insurance, Same-Day Emergency slots, and Gentle Anxiety-Free care icons.',
                    badge: 'Badges'
                  },
                  {
                    key: 'showAboutSection',
                    title: 'About Doctor & Practice',
                    desc: 'Lead dental specialist biography, clinical credentials, and 6 checkmark highlights.',
                    badge: 'About'
                  },
                  {
                    key: 'showServicesSection',
                    title: 'Clinical Specialties Grid',
                    desc: 'General, Cosmetic, Pediatric, and Restorative dentistry cards with procedure tags.',
                    badge: 'Services'
                  },
                  {
                    key: 'showPricingStudio',
                    title: 'Fee Transparency & Standard Fees',
                    desc: 'Itemized standard fees table (Cleanings, Whitening, Implants) with pricing studio CTA.',
                    badge: 'Pricing'
                  },
                  {
                    key: 'showAiDiagnosticsCallout',
                    title: 'Precision AI Diagnostics Banner',
                    desc: 'Dark high-tech operatory showcase highlighting 32-tooth digital odontogram records.',
                    badge: 'AI Tech'
                  },
                  {
                    key: 'showTeamSection',
                    title: 'Specialist Doctors Team Grid',
                    desc: 'Cards showcasing your lead doctors, specializations, degrees, and years of experience.',
                    badge: 'Team'
                  },
                  {
                    key: 'showFaqSection',
                    title: 'Frequently Asked Questions (FAQ)',
                    desc: 'Expandable accordion answering common patient inquiries regarding emergencies and care.',
                    badge: 'FAQ'
                  },
                  {
                    key: 'showReviewsSection',
                    title: 'Verified Patient Google Reviews',
                    desc: 'Google Verified review cards highlighting real family experiences and 5-star ratings.',
                    badge: 'Reviews'
                  },
                  {
                    key: 'showPreFooterCta',
                    title: 'Pre-Footer Online Booking Callout',
                    desc: 'High-conversion banner with 60-second online booking and direct click-to-call link.',
                    badge: 'Conversion'
                  },
                  {
                    key: 'showFooter',
                    title: 'Footer Practice Location & Links',
                    desc: 'Comprehensive clinic address, driving directions link, phone, and accreditation badges.',
                    badge: 'Footer'
                  }
                ].map((sec) => {
                  const isVisible = Boolean(config.sections[sec.key]);
                  return (
                    <div
                      key={sec.key}
                      onClick={() => toggleSection(sec.key)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isVisible
                          ? 'bg-white border-primary-teal/40 shadow-xs hover:border-primary-teal'
                          : 'bg-slate-50/80 border-slate-200/80 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {sec.badge}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isVisible
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}>
                            {isVisible ? '● VISIBLE' : '○ EXCLUDED'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-dark-slate mb-1">{sec.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{sec.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          {isVisible ? 'Section is shown' : 'Section is hidden'}
                        </span>
                        
                        {/* Toggle Switch */}
                        <div className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                          isVisible ? 'bg-primary-teal justify-end' : 'bg-slate-300 justify-start'
                        }`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CLINIC CONTACT & OPERATING HOURS ── */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-dark-slate mb-1">Clinic Contact Information &amp; Working Hours</h2>
              <p className="text-xs text-slate-500 mb-6 pb-4 border-b border-slate-100">
                These contact details dynamically update in the Top Bar, Hero CTA, Pre-Footer Callout, and Footer on the home page.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-primary-teal" /> Clinic Name
                  </label>
                  <input
                    type="text"
                    value={config.clinicName || ''}
                    onChange={(e) => setConfig({ ...config, clinicName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:bg-white"
                    placeholder="e.g. Dentia Premier Dental Hospital"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary-teal" /> Practice Cell / Phone Number
                  </label>
                  <input
                    type="text"
                    value={config.phone || ''}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:bg-white"
                    placeholder="e.g. +92 300 1234567 or +1 123 456 789"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Used for click-to-call links (`tel:`) across the website</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary-teal" /> Operating Hours / Timings
                  </label>
                  <input
                    type="text"
                    value={config.operatingHours || ''}
                    onChange={(e) => setConfig({ ...config, operatingHours: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:bg-white"
                    placeholder="e.g. Mon - Sat: 08:00 - 20:00 (Sunday Closed)"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-primary-teal" /> Primary Clinic Email
                  </label>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:bg-white"
                    placeholder="e.g. contact@dentiaclinic.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-teal" /> Clinic Physical Address
                  </label>
                  <input
                    type="text"
                    value={config.address || ''}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:bg-white"
                    placeholder="e.g. Suite 400, Grand Central Medical Plaza, Downtown Dental Arts"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-primary-teal" /> Google Maps Pin / Directions Link
                  </label>
                  <input
                    type="text"
                    value={config.googleMapsUrl || ''}
                    onChange={(e) => setConfig({ ...config, googleMapsUrl: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal/30 focus:bg-white"
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: HERO & ABOUT STUDIO ── */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-dark-slate mb-1">Hero Messaging &amp; Slideshow Studio</h2>
              <p className="text-xs text-slate-500 mb-6 pb-4 border-b border-slate-100">
                Customize the main banner headline, value proposition, and hero visual slides.
              </p>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Main Headline Part 1</label>
                    <input
                      type="text"
                      value={config.tagline || ''}
                      onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate"
                      placeholder="e.g. Elevating Smiles"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Main Headline Part 2 (Teal Accent)</label>
                    <input
                      type="text"
                      value={config.accentTagline || ''}
                      onChange={(e) => setConfig({ ...config, accentTagline: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate"
                      placeholder="e.g. With Expert Care."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Value Proposition Subtitle</label>
                  <textarea
                    rows={2}
                    value={config.subTagline || ''}
                    onChange={(e) => setConfig({ ...config, subTagline: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-dark-slate"
                  />
                </div>
              </div>

              {/* Lead Doctor About Section Settings */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-base font-bold text-dark-slate mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-teal" /> Lead Specialist Spotlight (About Section)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Personalize the attending lead doctor featured in the About Us section.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={config.aboutDoctor?.doctorName || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        aboutDoctor: { ...config.aboutDoctor, doctorName: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Smiles Transformed Text</label>
                    <input
                      type="text"
                      value={config.aboutDoctor?.smilesTransformedText || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        aboutDoctor: { ...config.aboutDoctor, smilesTransformedText: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Biography</label>
                  <textarea
                    rows={3}
                    value={config.aboutDoctor?.doctorBio || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      aboutDoctor: { ...config.aboutDoctor, doctorBio: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: GOOGLE REVIEWS & PROOF ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-dark-slate">Google Reviews &amp; Social Proof CMS</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage your verified patient ratings and testimonial cards dynamically. No hardcoded data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddReview}
                  className="px-4 py-2 rounded-xl bg-primary-teal text-white text-xs font-bold hover:bg-primary-hover transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Patient Review
                </button>
              </div>

              {/* Social Proof Metric Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Overall Star Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={config.socialProof?.googleRating || 5.0}
                    onChange={(e) => setConfig({
                      ...config,
                      socialProof: { ...config.socialProof, googleRating: parseFloat(e.target.value) || 5.0 }
                    })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-dark-slate"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Google Reviews Count</label>
                  <input
                    type="text"
                    value={config.socialProof?.googleReviewCountText || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      socialProof: { ...config.socialProof, googleReviewCountText: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-dark-slate"
                    placeholder="e.g. 23k+ Google Reviews"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Happy Smiles Count</label>
                  <input
                    type="text"
                    value={config.socialProof?.happySmilesText || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      socialProof: { ...config.socialProof, happySmilesText: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-dark-slate"
                    placeholder="e.g. 12,000+"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Years in Practice</label>
                  <input
                    type="text"
                    value={config.socialProof?.yearsInPracticeText || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      socialProof: { ...config.socialProof, yearsInPracticeText: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-dark-slate"
                    placeholder="e.g. 15+ Years"
                  />
                </div>
              </div>

              {/* List of Verified Reviews */}
              <h3 className="text-sm font-bold text-dark-slate mb-3">Published Patient Reviews ({config.reviews?.length || 0})</h3>
              <div className="space-y-4">
                {(config.reviews || []).map((rev, index) => (
                  <div key={rev.id || index} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-dark-slate text-sm">{rev.name}</span>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {rev.dateText || 'Google Verified'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{rev.text}"</p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete this review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: SERVICES, FEES & FAQS ── */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-dark-slate">Frequently Asked Questions (FAQ) Manager</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize the questions and answers displayed in the home page FAQ accordion.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-4 py-2 rounded-xl bg-primary-teal text-white text-xs font-bold hover:bg-primary-hover transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add FAQ Item
                </button>
              </div>

              <div className="space-y-4">
                {(config.faqs || []).map((faq, idx) => (
                  <div key={faq.id || idx} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <input
                        type="text"
                        value={faq.q || ''}
                        onChange={(e) => {
                          const updated = [...config.faqs];
                          updated[idx] = { ...updated[idx], q: e.target.value };
                          setConfig({ ...config, faqs: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-dark-slate"
                        placeholder="Question title..."
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={faq.a || ''}
                      onChange={(e) => {
                        const updated = [...config.faqs];
                        updated[idx] = { ...updated[idx], a: e.target.value };
                        setConfig({ ...config, faqs: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                      placeholder="Answer text..."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

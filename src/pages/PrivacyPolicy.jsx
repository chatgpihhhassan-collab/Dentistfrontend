import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, Database, FileText, ArrowLeft, HeartPulse, UserCheck, Key, HelpCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navigation />

            {/* Hero Header */}
            <header className="bg-gradient-to-r from-[#0E3B43] to-[#14535F] text-white pt-12 pb-16 px-4">
                <div className="max-w-5xl mx-auto space-y-4 text-center">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white text-xs font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs transition-colors mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                    </Link>
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-xs border border-white/20">
                        <ShieldCheck className="w-8 h-8 text-teal-300" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">Privacy Policy</h1>
                    <p className="text-sm md:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
                        How Dentia Dental Clinic collects, safeguards, and processes your clinical electronic health records (EHR), radiographs, and personal data.
                    </p>
                    <p className="text-xs text-teal-200 font-semibold pt-2">HIPAA & GDPR Compliant Medical Data Management</p>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 -mt-8 mb-16 w-full flex-grow">
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200/80 space-y-10">

                    {/* Section 1: Commitment to Patient Privacy */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#0E3B43] flex items-center gap-2">
                            <Lock className="w-5 h-5 text-teal-600" /> 1. Commitment to Health Data Confidentiality
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            At Dentia, safeguarding your confidential medical and dental information is our highest priority. This Privacy Policy details the types of personal and protected health information (PHI) we collect, the safeguards we employ, and your rights concerning your dental health records.
                        </p>
                    </section>

                    {/* Section 2: Types of Information Collected */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#0E3B43] flex items-center gap-2">
                            <Database className="w-5 h-5 text-teal-600" /> 2. Information We Collect
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-slate-700">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                                <h3 className="font-bold text-[#0E3B43] flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-teal-600" /> Demographics & Identity
                                </h3>
                                <p className="text-slate-600">Full Name, Date of Birth, Gender, Mobile Number, Emergency Contact, and Home Address.</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                                <h3 className="font-bold text-[#0E3B43] flex items-center gap-1.5">
                                    <HeartPulse className="w-4 h-4 text-rose-600" /> Clinical & Health Records
                                </h3>
                                <p className="text-slate-600">32-tooth odontogram charts, dental caries records, periodontal indices, medical alerts, and allergies.</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                                <h3 className="font-bold text-[#0E3B43] flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-amber-600" /> Diagnostic Imaging
                                </h3>
                                <p className="text-slate-600">Digital panoramic (OPG) X-rays, bitewings, periapical radiographs, and 3D intraoral scans.</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                                <h3 className="font-bold text-[#0E3B43] flex items-center gap-1.5">
                                    <Key className="w-4 h-4 text-sky-600" /> Treatment History & Prescriptions
                                </h3>
                                <p className="text-slate-600">Electronic prescriptions, drug dosages, clinical SOAP notes, and itemized procedure invoices.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Purpose of Clinical Data Processing */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#0E3B43] flex items-center gap-2">
                            <Eye className="w-5 h-5 text-teal-600" /> 3. How We Use Your Information
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Your medical information is utilized solely for legitimate healthcare purposes:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm text-slate-600">
                            <li>Formulating personalized dental treatment plans, orthodontic tracking, and restorative care.</li>
                            <li>Sending automated appointment reminders, follow-up notifications, and emergency care advisories.</li>
                            <li>Coordinating with certified dental laboratories for custom fabrication of crowns, bridges, and aligners.</li>
                            <li>Maintaining clinical audit trails required by statutory dental healthcare licensing boards.</li>
                        </ul>
                    </section>

                    {/* Section 4: Data Security & Storage Standards */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#0E3B43] flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-600" /> 4. Data Security & Encryption Standards
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            All electronic health records are stored in encrypted Microsoft SQL Server databases with TLS 1.3 encryption in transit and AES-256 encryption at rest. Multi-factor role-based access ensures that only authorized attending dental clinicians and receptionists can access patient charts.
                        </p>
                    </section>

                    {/* Section 5: Third-Party Disclosures */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#0E3B43] flex items-center gap-2">
                            <FileText className="w-5 h-5 text-teal-600" /> 5. Non-Disclosure & Confidentiality
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Dentia does <strong>never sell, lease, or commercialize</strong> patient personal or medical information to third-party advertisers. Disclosures occur strictly when required by law or with your explicit written consent for specialized specialist referrals.
                        </p>
                    </section>

                    {/* Section 6: Patient Rights */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#0E3B43] flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-teal-600" /> 6. Your Rights Under Medical Privacy Laws
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            As a patient, you have the right to request a complete certified copy of your dental records, digital X-rays, and prescription history at any time. You may also request corrections to outdated contact or demographic information.
                        </p>
                    </section>

                    {/* Support & Contact Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="font-bold text-[#0E3B43] text-sm md:text-base flex items-center gap-1.5 justify-center md:justify-start">
                                <HelpCircle className="w-4 h-4 text-teal-600" /> Privacy Inquiries & Record Requests
                            </h3>
                            <p className="text-xs text-slate-500">Contact our data protection officer at privacy@dentiaclinic.com.</p>
                        </div>
                        <div className="flex gap-3">
                            <Link 
                                to="/terms" 
                                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#0E3B43] text-xs font-bold rounded-xl border border-slate-300 transition-colors"
                            >
                                Terms & Conditions
                            </Link>
                            <Link 
                                to="/about" 
                                className="px-4 py-2 bg-[#0E3B43] hover:bg-[#14535F] text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                About Us
                            </Link>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}

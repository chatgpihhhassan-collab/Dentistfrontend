import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, FileText, CheckCircle2, Clock, Phone, ArrowLeft, HeartPulse, Scale, AlertCircle, HelpCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function TermsAndConditions() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navigation />

            {/* Hero Header */}
            <header className="bg-gradient-to-r from-[#10244B] to-[#1A3A75] text-white pt-12 pb-16 px-4">
                <div className="max-w-5xl mx-auto space-y-4 text-center">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-1.5 text-sky-200 hover:text-white text-xs font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs transition-colors mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                    </Link>
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-xs border border-white/20">
                        <Scale className="w-8 h-8 text-sky-300" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">Terms & Conditions</h1>
                    <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Please review the terms and clinical guidelines governing dental consultations, surgical treatments, appointments, and services at Dentia Dental Clinic.
                    </p>
                    <p className="text-xs text-sky-200 font-semibold pt-2">Last Updated: August 2026</p>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 -mt-8 mb-16 w-full flex-grow">
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200/80 space-y-10">

                    {/* Section 1: Clinical Scope & Dental Services */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#10244B] flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-sky-600" /> 1. Clinical Scope & General Healthcare Agreement
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            By scheduling an appointment, registering as a patient, or receiving treatment at Dentia Clinic, you agree to comply with all clinical guidelines and protocols established by our licensed dental practitioners. All procedures—including preventive prophylaxis, restorative fillings, root canal therapy (RCT), cosmetic whitening, and orthodontics—are performed following recognized international dental standards.
                        </p>
                    </section>

                    {/* Section 2: Appointments & Cancellation Policy */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#10244B] flex items-center gap-2">
                            <Clock className="w-5 h-5 text-sky-600" /> 2. Appointment Booking & Cancellation Policy
                        </h2>
                        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-2 text-sm text-slate-700">
                            <p className="font-bold text-[#10244B]">Key Scheduling Protocols:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                                <li><strong>Arrival Time:</strong> Patients are requested to arrive 10 minutes prior to scheduled chair time for pre-procedure health checks.</li>
                                <li><strong>Cancellations:</strong> If you must reschedule or cancel your consultation, please provide at least <strong>24 hours advance notice</strong> to allow operatory reassignment.</li>
                                <li><strong>Late Arrivals:</strong> Late arrivals exceeding 15 minutes may require rescheduling to prevent delaying subsequent surgical patients.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Diagnostic Informed Consent */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#10244B] flex items-center gap-2">
                            <FileText className="w-5 h-5 text-sky-600" /> 3. Informed Clinical Consent & Diagnostic Imaging
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Prior to invasive procedures (e.g. extractions, surgical implants, endodontic treatments), a detailed explanation of treatment options, anticipated clinical outcomes, and potential risks will be provided. Necessary diagnostic aids—such as digital OPG panoramic X-rays, bitewings, and intraoral scans—are conducted only when clinically indicated for accurate diagnosis.
                        </p>
                    </section>

                    {/* Section 4: Patient Responsibilities & Medical History Disclosure */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#10244B] flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-600" /> 4. Accurate Medical & Allergy Disclosure
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Patients are strictly required to disclose accurate medical histories, including systemic conditions (cardiovascular disease, diabetes, bleeding disorders), ongoing medications, pregnancy, and drug allergies (e.g. Penicillin, Latex, Local Anesthetics). Dentia Clinic bears no liability for complications arising from undisclosed medical information.
                        </p>
                    </section>

                    {/* Section 5: Financial Policy, Fees & Insurance */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#10244B] flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 5. Treatment Estimates & Payment Terms
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            A treatment plan estimate will be presented prior to starting complex cosmetic or restorative treatments. Payment for clinical consultations, restorative procedures, and lab-fabricated prosthetics (crowns, bridges, aligners) is due at the time service is rendered or according to agreed installment plans.
                        </p>
                    </section>

                    {/* Section 6: Emergency Dental Care */}
                    <section className="space-y-3">
                        <h2 className="text-lg md:text-xl font-black text-[#10244B] flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" /> 6. Emergency Protocols & Out-of-Hours Care
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            For acute dental trauma, severe hemorrhage, or facial swelling causing respiratory distress, patients should immediately contact our emergency line or visit the nearest hospital emergency department.
                        </p>
                    </section>

                    {/* Support & Contact Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="font-bold text-[#10244B] text-sm md:text-base flex items-center gap-1.5 justify-center md:justify-start">
                                <HelpCircle className="w-4 h-4 text-sky-600" /> Have questions regarding our Terms?
                            </h3>
                            <p className="text-xs text-slate-500">Our patient care desk is available Monday through Saturday to assist you.</p>
                        </div>
                        <div className="flex gap-3">
                            <Link 
                                to="/about" 
                                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#10244B] text-xs font-bold rounded-xl border border-slate-300 transition-colors"
                            >
                                About Us
                            </Link>
                            <Link 
                                to="/privacy" 
                                className="px-4 py-2 bg-[#10244B] hover:bg-sky-900 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                Privacy Policy
                            </Link>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}

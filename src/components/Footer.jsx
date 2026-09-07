import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Clock, MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-dark-slate text-white pt-16 pb-8 border-t border-white/10 w-full mt-auto">
            <div className="max-w-[1800px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                {/* Col 1: Brand & Accreditation */}
                <div className="space-y-4">
                    <img src="/images/logo-white.webp" alt="Dentia" className="h-8 object-contain" />
                    <p className="text-slate-300 leading-relaxed text-sm">
                        Dentia provides gentle, modern dental care supported by digital diagnostics and transparent treatment plans. Dedicated to smiles that last a lifetime.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-teal bg-white/5 py-2 px-3 rounded-xl border border-white/10 w-fit">
                        <ShieldCheck className="w-4 h-4 text-primary-teal" /> ADA Certified Practice
                    </div>
                </div>

                {/* Col 2: Dental Specialties */}
                <div className="space-y-4">
                    <h4 className="font-serif font-bold text-base text-white tracking-wide">Dental Specialties</h4>
                    <ul className="space-y-2.5 text-sm text-slate-300">
                        <li><Link to="/treatment" className="hover:text-primary-teal transition-colors">General & Preventive Care</Link></li>
                        <li><Link to="/treatment" className="hover:text-primary-teal transition-colors">Cosmetic Dentistry & Veneers</Link></li>
                        <li><Link to="/treatment" className="hover:text-primary-teal transition-colors">Pediatric Dental Health</Link></li>
                        <li><Link to="/treatment" className="hover:text-primary-teal transition-colors">Dental Implants & Restorations</Link></li>
                        <li><Link to="/treatment" className="hover:text-primary-teal transition-colors">Laser Teeth Whitening</Link></li>
                    </ul>
                </div>

                {/* Col 3: Patient Care & Staff */}
                <div className="space-y-4">
                    <h4 className="font-serif font-bold text-base text-white tracking-wide">Patient Care</h4>
                    <ul className="space-y-2.5 text-sm text-slate-300">
                        <li><Link to="/book" className="hover:text-primary-teal transition-colors font-medium text-white">Book Online Consultation</Link></li>
                        <li><Link to="/treatment" className="hover:text-primary-teal transition-colors">Treatments & Fees</Link></li>
                        <li><Link to="/about" className="hover:text-primary-teal transition-colors">About Our Specialists</Link></li>
                        <li><Link to="/login" className="text-slate-400 hover:text-primary-teal transition-colors flex items-center gap-1.5">Clinician Staff Portal →</Link></li>
                    </ul>
                </div>

                {/* Col 4: Location & Contact */}
                <div className="space-y-4">
                    <h4 className="font-serif font-bold text-base text-white tracking-wide">Practice Location</h4>
                    <p className="text-sm text-slate-300 flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-primary-teal flex-shrink-0 mt-1" />
                        <span>Suite 400, Grand Central Medical Plaza, Downtown Dental Arts</span>
                    </p>
                    <p className="text-sm text-slate-300 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-primary-teal flex-shrink-0" />
                        <span>+1 123 456 789</span>
                    </p>
                    <p className="text-sm text-slate-300 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-primary-teal flex-shrink-0" />
                        <span>contact@dentiaclinic.com</span>
                    </p>
                    <p className="text-sm text-slate-300 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-primary-teal flex-shrink-0" />
                        <span>Mon - Sat: 08:00 - 20:00</span>
                    </p>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto px-6 pt-8 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
                <p>Copyright © 2026 Dentia Clinic. All rights reserved.</p>
                <div className="flex space-x-6">
                    <Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
                    <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}

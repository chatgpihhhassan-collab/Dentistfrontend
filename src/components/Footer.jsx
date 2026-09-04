import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-dark-slate text-white pt-16 pb-8 border-t border-white/10 w-full mt-auto">
            <div className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                <div className="space-y-4">
                    <img src="/images/logo-white.webp" alt="Dentia" className="h-8 object-contain" />
                    <p className="text-muted-text leading-relaxed text-sm">
                        At Dentia, we’re dedicated to providing high-quality, personalized dental care. Our skilled team uses the latest technology to ensure comfortable and efficient treatments.
                    </p>
                </div>
                <div className="space-y-4">
                    <h4 className="font-serif font-bold text-lg text-accent-gold">Quick Links</h4>
                    <ul className="space-y-2 text-sm text-muted-text">
                        <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                        <li><Link to="/treatment" className="hover:text-white transition-colors">Our Services</Link></li>
                        <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        <li><Link to="/appointments" className="hover:text-white transition-colors">Appointments</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-serif font-bold text-lg text-accent-gold">Contact Us</h4>
                    <p className="text-sm text-muted-text flex items-center"><Phone className="w-4 h-4 mr-2 text-primary-teal" /> +1 123 456 789</p>
                    <p className="text-sm text-muted-text flex items-center"><Mail className="w-4 h-4 mr-2 text-primary-teal" /> contact@dentiaclinic.com</p>
                    <p className="text-sm text-muted-text flex items-center"><Clock className="w-4 h-4 mr-2 text-primary-teal" /> Mon - Sat: 08:00 - 20:00</p>
                </div>
            </div>
            <div className="max-w-[1800px] mx-auto px-4 pt-8 border-t border-white/10 text-center text-xs text-muted-text flex flex-col md:flex-row justify-between items-center gap-4">
                <p>Copyright © 2026 - Dentia by on3step. All rights reserved.</p>
                <div className="flex space-x-4">
                    <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                    <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}

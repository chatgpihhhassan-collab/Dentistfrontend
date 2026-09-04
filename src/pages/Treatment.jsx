import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Stethoscope, Sparkles, Smile, Target, Users, Activity, ShieldCheck, HeartPulse, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Treatment() {
    const navigate = useNavigate();

    const treatments = [
        { icon: Stethoscope, title: "Checkup & Cleaning", desc: "Comprehensive dental exams, professional scaling, and polishing to maintain optimal oral health. We recommend visiting every 6 months." },
        { icon: Sparkles, title: "Teeth Whitening", desc: "Professional, safe, and highly effective in-clinic whitening treatments that can brighten your smile by several shades in just one hour." },
        { icon: Smile, title: "Braces & Aligners", desc: "Custom orthodontic solutions including traditional metal braces, ceramic options, and invisible clear aligner therapy." },
        { icon: Target, title: "Root Canal Therapy", desc: "Pain-free, single-sitting endodontic treatments using advanced rotary technology to save severely infected or damaged teeth." },
        { icon: Users, title: "Implants & Dentures", desc: "Permanent, natural-looking tooth replacements. From single titanium implants to full-mouth restorative denture solutions." },
        { icon: Activity, title: "Kids Dentistry", desc: "Gentle, fear-free pediatric care including fluoride treatments, protective sealants, and early orthodontic evaluations." },
        { icon: ShieldCheck, title: "Dental Crowns", desc: "Custom-milled ceramic and porcelain crowns that perfectly match your natural teeth, restoring strength and appearance." },
        { icon: HeartPulse, title: "Emergency Care", desc: "Immediate attention for severe toothaches, knocked-out teeth, or broken restorations. We prioritize your comfort." }
    ];

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans selection:bg-light-teal selection:text-primary-teal flex flex-col">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-6 py-16 flex-grow">
                
                <div className="text-center mb-20 space-y-4 max-w-3xl mx-auto">
                    <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Our Services</span>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-dark-slate leading-tight">
                        Dental & Oral <span className="text-primary-teal font-serif italic font-normal">Treatments.</span>
                    </h1>
                    <p className="text-muted-text font-normal leading-relaxed">
                        From routine preventative care to complex restorative surgery, we offer a complete suite of premium dental services all under one roof.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                    {treatments.map((t, i) => (
                        <div key={i} className="card-hover bg-white p-8 rounded-[2rem] border border-light-teal/40 shadow-sm relative group flex flex-col h-full cursor-default">
                            <div className="w-14 h-14 bg-light-teal/50 rounded-2xl flex items-center justify-center text-primary-teal mb-6 group-hover:bg-primary-teal group-hover:text-white transition-colors duration-300">
                                <t.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-dark-slate mb-3 group-hover:text-primary-teal transition-colors">{t.title}</h3>
                            <p className="text-muted-text font-medium text-sm leading-relaxed flex-grow">{t.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <section className="bg-dark-slate text-white rounded-[3rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden mb-12">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-teal/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 relative z-10">Not sure what you need?</h2>
                    <p className="text-muted-text text-base max-w-xl mx-auto mb-10 relative z-10 font-normal">
                        Book a comprehensive consultation today. Our specialists will chart your teeth digitally and provide a transparent, customized treatment plan.
                    </p>
                    <button onClick={() => navigate('/book')} className="btn-main inline-flex items-center space-x-2 bg-primary-teal hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-full shadow-lg relative z-10 text-lg cursor-pointer">
                        <span>Schedule a Consultation</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </section>

            </main>

            <Footer />
        </div>
    );
}

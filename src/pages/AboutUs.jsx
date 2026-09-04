import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Shield, Award, Heart, Clock, Star, Users, CheckCircle2, HeartHandshake } from 'lucide-react';

export default function AboutUs() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans selection:bg-light-teal selection:text-primary-teal relative overflow-x-hidden flex flex-col">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-6 py-16 flex-grow w-full">
                
                {/* Hero / About Banner */}
                <section className="relative min-h-[500px] rounded-[3rem] overflow-hidden mb-20 shadow-2xl border border-light-teal/50 grid grid-cols-1 lg:grid-cols-2 bg-dark-slate text-white">
                    {/* Left Dark Teal Content Box */}
                    <div className="p-12 lg:p-20 flex flex-col justify-center space-y-6 relative z-10">
                        <span className="text-accent-gold font-bold tracking-widest uppercase text-xs">Modern Dental Practice</span>
                        <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight tracking-tight">
                            Redefining the <br />Dental Experience.
                        </h1>
                        <p className="text-base text-muted-text leading-relaxed font-light max-w-md">
                            At Dentia Clinic, we combine premium clinical technology with patient-centric hospitality to ensure your diagnostic visits are clear, transparent, and completely comfortable.
                        </p>
                        <div className="pt-4 flex gap-4">
                          <RouterLink to="/book" className="btn-main bg-primary-teal hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-full shadow-lg transition-all text-center">
                            Book Appointment
                          </RouterLink>
                        </div>
                    </div>

                    {/* Right Background Image Box */}
                    <div className="relative min-h-[350px] lg:min-h-full">
                        <img 
                            src="/images/slider/1.jpg" 
                            alt="Dentia Clinic Lobby" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-dark-slate via-dark-slate/20 to-transparent mix-blend-multiply"></div>
                    </div>
                </section>

                {/* Core Philosophy Section with Two-Column Mockup */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                  <div className="space-y-6">
                    <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Our Philosophy</span>
                    <h2 className="text-4xl font-serif font-bold text-dark-slate leading-tight">
                      Professionals & Personalized Dental Excellence
                    </h2>
                    <p className="text-muted-text leading-relaxed">
                      Choosing the right dental provider matters. We combine expert clinical expertise, bilingual voice assistance, 3D anatomical modeling, and a welcoming environment to make sure every visit is tailored to your unique requirements.
                    </p>
                    <div className="border-t border-light-teal pt-6 grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h5 className="font-serif font-bold text-dark-slate text-lg">10,000+</h5>
                        <p className="text-xs font-semibold text-muted-text uppercase tracking-widest">Happy Patients</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-serif font-bold text-dark-slate text-lg">15+</h5>
                        <p className="text-xs font-semibold text-muted-text uppercase tracking-widest">Years Experience</p>
                      </div>
                    </div>
                  </div>

                  {/* Layout Image Collage ( Collage matching Dentia ) */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8 rounded-[2rem] overflow-hidden shadow-lg">
                      <img src="/images/misc/p3.webp" alt="Tooth Charting Workspace" className="w-full h-80 object-cover" />
                    </div>
                    <div className="col-span-4 rounded-[2rem] overflow-hidden shadow-lg self-end mb-8">
                      <img src="/images/misc/s3.webp" alt="Clean Dental Lab" className="w-full h-48 object-cover" />
                    </div>
                  </div>
                </section>

                {/* Values Section */}
                <section className="mb-24">
                    <div className="text-center mb-16 max-w-2xl mx-auto space-y-4">
                        <span className="text-primary-teal font-bold tracking-widest uppercase text-xs">Our Values</span>
                        <h2 className="text-4xl font-serif font-bold text-dark-slate">Core Operating Values</h2>
                        <p className="text-muted-text font-normal">We believe that clinical diagnostics should be friendly, clear, and focused entirely around your convenience.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Shield, title: "Uncompromising Safety", desc: "Highest standards of clinical sterilization and safety control." },
                            { icon: Heart, title: "Compassionate Care", desc: "Gentle dental procedures designed to alleviate patient anxiety." },
                            { icon: Award, title: "Clinical Excellence", desc: "Board-certified doctors using state-of-the-art diagnostic logs." },
                            { icon: Clock, title: "Respect for Time", desc: "Optimized patient directory workflows with minimum waiting times." }
                        ].map((v, i) => (
                            <div key={i} className="card-hover bg-white p-8 rounded-3xl border border-light-teal/40 shadow-sm relative group">
                                <div className="w-14 h-14 bg-light-teal/50 rounded-2xl flex items-center justify-center text-primary-teal mb-6 group-hover:bg-primary-teal group-hover:text-white transition-all duration-300">
                                    <v.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-dark-slate mb-3">{v.title}</h3>
                                <p className="text-muted-text font-medium text-sm leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Meet Our Specialists Banner (Dentia Style) */}
                <section className="py-20 bg-light-teal/30 rounded-[3rem] p-12 md:p-16 text-center shadow-lg relative overflow-hidden mb-12">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-teal/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <span className="text-primary-teal font-bold tracking-widest uppercase text-xs relative z-10">Dentia Specialists</span>
                    <h2 className="text-4xl font-serif font-bold text-dark-slate mt-2 mb-4 relative z-10">Meet Our Certified Dental Team</h2>
                    <p className="text-muted-text text-base max-w-xl mx-auto mb-10 relative z-10 font-normal">
                        Our clinic has board-certified endodontists, implant specialists, and pediatric professionals dedicated to comprehensive oral treatments.
                    </p>
                    <button 
                        onClick={() => navigate('/directory')}
                        className="btn-main inline-block bg-primary-teal hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-full shadow-lg relative z-10 cursor-pointer"
                    >
                        View Clinic Workspace
                    </button>
                </section>

            </main>

            <Footer />
        </div>
    );
}

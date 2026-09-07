import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Calendar, Stethoscope, Info, CalendarPlus, Phone, Clock, Mail, Star, UserCheck } from 'lucide-react';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [doctor, setDoctor] = React.useState(null);

    React.useEffect(() => {
        const stored = localStorage.getItem('doctor');
        if (stored) {
            setDoctor(JSON.parse(stored));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('doctor');
        setDoctor(null);
        navigate('/');
    };

    const getLinkClass = (isActive) => {
        const baseClasses = "flex items-center justify-center p-3 rounded-full transition-all duration-200 relative group cursor-pointer";
        return isActive 
            ? `${baseClasses} text-primary-teal font-bold bg-white shadow-md scale-105 ring-1 ring-[#4A7CD2]/25`
            : `${baseClasses} text-slate-600 hover:text-primary-teal hover:bg-white/60 hover:scale-105`;
    };

    return (
        <div className="pt-4 px-6 sticky top-0 z-50">
            {/* Top Contact Bar */}
            <div className="w-full max-w-[1800px] mx-auto px-4 mb-2 flex items-center justify-between text-xs text-muted-text font-medium">
                <div className="flex items-center space-x-6">
                    <span className="flex items-center text-slate-600"><Phone className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> +1 123 456 789</span>
                    <span className="flex items-center text-slate-600"><Clock className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> Mon - Sat: 08:00 - 20:00</span>
                    <span className="flex items-center text-slate-600 hidden md:flex"><Mail className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> contact@dentiaclinic.com</span>
                </div>
                <div className="flex items-center space-x-5">
                    <span className="flex items-center text-accent-gold font-bold">★ 5.0 <span className="text-slate-600 font-medium ml-1">(23k Google Reviews)</span></span>
                    {!doctor && (
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-slate-600 hover:text-primary-teal font-semibold transition-colors flex items-center gap-1 cursor-pointer pl-2 border-l border-slate-300"
                        >
                            Clinician Portal →
                        </button>
                    )}
                </div>
            </div>

            <header className="w-full max-w-[1800px] mx-auto bg-gradient-to-r from-white/95 via-white/85 to-[#EAF0FC]/75 backdrop-blur-2xl border border-white/90 h-20 flex items-center justify-between px-6 rounded-full shadow-lg shadow-[#0A1A24]/5 transition-all duration-300">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/images/logo-black.webp" alt="Dentia Logo" className="h-8 object-contain" />
                </div>
                
                <nav className="hidden lg:flex items-center space-x-1.5 bg-gradient-to-r from-[#EAF0FC]/80 via-white/80 to-[#EAF0FC]/95 p-1.5 rounded-full border border-[#4A7CD2]/20 shadow-inner">
                    <Link 
                        to="/" 
                        className={getLinkClass(location.pathname === '/' || location.pathname === '/dashboard')}
                        title="Home"
                    >
                        <Home className="w-5 h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Home
                        </span>
                    </Link>
                    
                    {doctor && (
                        <>
                            <Link 
                                to="/directory" 
                                className={getLinkClass(location.pathname === '/directory' || location.pathname.startsWith('/chart'))}
                                title="Patients"
                            >
                                <Users className="w-5 h-5" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Patients
                                </span>
                            </Link>
                            <Link 
                                to="/appointments" 
                                className={getLinkClass(location.pathname === '/appointments')}
                                title="Schedule"
                            >
                                <Calendar className="w-5 h-5" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Schedule
                                </span>
                            </Link>
                        </>
                    )}
                    
                    <Link 
                        to="/treatment" 
                        className={getLinkClass(location.pathname === '/treatment')}
                        title="Treatments"
                    >
                        <Stethoscope className="w-5 h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Treatments
                        </span>
                    </Link>
                    <a 
                        href="/#about" 
                        className={getLinkClass(location.hash === '#about')}
                        title="About Us"
                    >
                        <Info className="w-5 h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            About Us
                        </span>
                    </a>
                    <a 
                        href="/#team" 
                        className={getLinkClass(location.hash === '#team')}
                        title="Our Doctors"
                    >
                        <UserCheck className="w-5 h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Our Doctors
                        </span>
                    </a>
                    <a 
                        href="/#reviews" 
                        className={getLinkClass(location.hash === '#reviews')}
                        title="Reviews"
                    >
                        <Star className="w-5 h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Reviews
                        </span>
                    </a>
                </nav>

                <div className="flex items-center space-x-4">
                    {doctor ? (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-white pr-4 pl-1.5 py-1.5 rounded-full border border-light-teal shadow-sm whitespace-nowrap">
                                <div className="w-8 h-8 rounded-full bg-light-teal/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img src={`https://ui-avatars.com/api/?name=${doctor.firstName}+${doctor.lastName}&background=EAF0FC&color=4A7CD2`} alt="Doctor" />
                                </div>
                                <span className="text-sm font-bold text-dark-slate hidden sm:inline whitespace-nowrap">Dr. {doctor.lastName}</span>
                            </div>
                            <button 
                                onClick={() => navigate('/directory')}
                                className="bg-primary-teal hover:bg-primary-hover text-white font-bold py-2.5 px-5 rounded-full text-sm transition-all shadow-md cursor-pointer"
                            >
                                Workspace
                            </button>
                             <button 
                                onClick={handleLogout} 
                                className="bg-light-teal text-dark-slate hover:bg-dark-slate hover:text-white border border-light-teal-hover transition-all duration-300 py-2.5 px-4 rounded-full text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer" 
                                title="Log Out"
                             >
                                <LogOut className="w-3.5 h-3.5 text-accent-gold" />
                                <span className="hidden md:inline">Log Out</span>
                             </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => navigate('/book')}
                            className="bg-primary-teal hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-md shadow-primary-teal/20 hover:shadow-lg hover:scale-102 cursor-pointer flex items-center gap-2 text-sm"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            Book Appointment
                        </button>
                    )}
                </div>
            </header>
        </div>
    );
}

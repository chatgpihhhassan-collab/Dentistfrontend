import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Calendar, Stethoscope, Info, CalendarPlus, Phone, Clock, Mail } from 'lucide-react';

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

    const getLinkClass = (path) => {
        const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
        const baseClasses = "flex items-center justify-center p-3 rounded-full transition-all duration-300";
        return isActive 
            ? `${baseClasses} text-primary-teal font-bold bg-white shadow-md scale-105`
            : `${baseClasses} text-muted-text font-semibold hover:text-primary-teal hover:bg-white/50`;
    };

    return (
        <div className="pt-4 px-6 sticky top-0 z-50">
            {/* Top Contact Bar */}
            <div className="w-full max-w-[1800px] mx-auto px-4 mb-2 flex items-center justify-between text-xs text-muted-text font-medium">
                <div className="flex items-center space-x-6">
                    <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> +1 123 456 789</span>
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> Mon - Sat: 08:00 - 20:00</span>
                    <span className="flex items-center hidden sm:flex"><Mail className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> contact@dentiaclinic.com</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="flex items-center text-accent-gold font-bold">★ 5.0 <span className="text-muted-text font-medium ml-1">(23k Google Reviews)</span></span>
                </div>
            </div>

            <header className="w-full max-w-[1800px] mx-auto bg-gradient-to-r from-white/90 via-white/80 to-[#EAF0FC]/65 backdrop-blur-2xl border border-white/90 h-20 flex items-center justify-between px-6 rounded-full shadow-lg shadow-[#4A7CD2]/5 transition-all duration-300">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <img src="/images/logo-black.webp" alt="Dentia Logo" className="h-8 object-contain" />
                </div>
                
                <nav className="flex items-center space-x-2 bg-gradient-to-r from-[#EAF0FC]/80 via-white/70 to-[#EAF0FC]/95 p-1.5 rounded-full border border-[#4A7CD2]/25 shadow-inner overflow-x-auto scrollbar-hide">
                    <Link to="/dashboard" className={getLinkClass('/dashboard')} title="Home">
                        <Home className="w-5 h-5" />
                    </Link>
                    
                    {doctor && (
                        <>
                            <Link to="/directory" className={getLinkClass('/directory')} title="Patient Directory">
                                <Users className="w-5 h-5" />
                            </Link>
                            <Link to="/appointments" className={getLinkClass('/appointments')} title="Appointments">
                                <Calendar className="w-5 h-5" />
                            </Link>
                            <Link to="/book" className={getLinkClass('/book')} title="Book Now">
                                <CalendarPlus className="w-5 h-5" />
                            </Link>
                        </>
                    )}
                    
                    <Link to="/treatment" className={getLinkClass('/treatment')} title="Treatments">
                        <Stethoscope className="w-5 h-5" />
                    </Link>
                    <Link to="/about" className={getLinkClass('/about')} title="About Us">
                        <Info className="w-5 h-5" />
                    </Link>
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
                            onClick={() => navigate('/login')}
                            className="bg-primary-teal hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-md cursor-pointer"
                        >
                            Clinician Login
                        </button>
                    )}
                </div>
            </header>
        </div>
    );
}

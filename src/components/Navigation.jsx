import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Calendar, Stethoscope, Info, CalendarPlus, Phone, Clock, Mail, Star, UserCheck, DollarSign, Building2, Shield, MessageCircle, Globe } from 'lucide-react';
import { HardwareDeviceSyncBadge } from './HardwareDeviceSyncBadge';
import { purgeClinicianSession } from '../services/sessionSecurityService';
import landingCmsService from '../services/landingCmsService';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [doctor, setDoctor] = React.useState(() => {
        try {
            const stored = localStorage.getItem('doctor');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [config, setConfig] = React.useState(() => landingCmsService.getConfig());

    React.useEffect(() => {
        if (doctor) {
            const docId = doctor.doctorID || doctor.id;
            if (docId && !doctor.organizationName) {
                fetch(`/api/auth/doctor/${docId}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(docData => {
                        if (docData && (docData.organizationName || docData.OrganizationName)) {
                            const resolvedOrg = docData.organizationName || docData.OrganizationName;
                            const updated = {
                                ...doctor,
                                organizationID: docData.organizationID || docData.OrganizationID,
                                organizationName: resolvedOrg,
                                organizationLogoUrl: docData.organizationLogoUrl || docData.OrganizationLogoUrl,
                                organizationCity: docData.organizationCity || docData.OrganizationCity
                            };
                            localStorage.setItem('doctor', JSON.stringify(updated));
                            setDoctor(updated);
                        }
                    })
                    .catch(() => {});
            }
        }
        return landingCmsService.subscribe(setConfig);
    }, [doctor]);

    const orgName = doctor ? (
        doctor.organizationName || 
        doctor.OrganizationName || 
        (doctor.region === 'PK' ? 'Shifa International Hospitals Ltd' : 'Dentia Auckland Regional Dental Hospital')
    ) : null;

    const handleLogout = () => {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('dentia_manual_logout', 'true');
            }
        } catch {}
        purgeClinicianSession('manual_logout');
        setDoctor(null);
        navigate('/login', { replace: true });
    };

    const getLinkClass = (isActive) => {
        const baseClasses = "flex items-center justify-center p-3 rounded-full transition-all duration-200 relative group cursor-pointer";
        return isActive 
            ? `${baseClasses} text-primary-teal font-bold bg-white shadow-md scale-105 ring-1 ring-[#4A7CD2]/25`
            : `${baseClasses} text-slate-600 hover:text-primary-teal hover:bg-white/60 hover:scale-105`;
    };

    const cleanPhone = `tel:${(config.phone || '').replace(/[^\d+]/g, '')}`;
    const showTopBar = config.sections?.showTopContactBar !== false;

    return (
        <div className="pt-3 pb-2 px-4 sm:px-6 sticky top-0 z-50 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-light-teal/40 transition-all shadow-xs">
            {/* Top Contact Bar - Fully Dynamic */}
            {showTopBar && (
                <div className="w-full max-w-[1800px] mx-auto px-4 mb-2 flex items-center justify-between text-xs text-muted-text font-medium">
                    <div className="flex items-center space-x-6">
                        <a href={cleanPhone} className="flex items-center text-slate-600 hover:text-primary-teal transition-colors">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> {config.phone || '+1 123 456 789'}
                        </a>
                        <span className="flex items-center text-slate-600">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> {config.operatingHours || 'Mon - Sat: 08:00 - 20:00'}
                        </span>
                        <a href={`mailto:${config.email}`} className="flex items-center text-slate-600 hover:text-primary-teal transition-colors hidden md:flex">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> {config.email || 'contact@dentiaclinic.com'}
                        </a>
                    </div>
                    <div className="flex items-center space-x-4">
                        {doctor && orgName && (
                            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700 bg-white px-3 py-0.5 rounded-full border border-[#4A7CD2]/30 shadow-2xs">
                                <Building2 className="w-3.5 h-3.5 text-[#4A7CD2] shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital:</span>
                                <strong className="text-slate-800 font-bold max-w-[340px] truncate" title={orgName}>{orgName}</strong>
                            </div>
                        )}
                        <span className="flex items-center text-accent-gold font-bold">
                            ★ {config.socialProof?.googleRating || 5.0} <span className="text-slate-600 font-medium ml-1">({config.socialProof?.googleReviewCountText || '23k Google Reviews'})</span>
                        </span>
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
            )}

            <header className="w-full max-w-[1800px] mx-auto bg-gradient-to-r from-white/95 via-white/85 to-[#EAF0FC]/75 backdrop-blur-2xl border border-white/90 h-20 flex items-center justify-between gap-4 px-6 rounded-full shadow-lg shadow-[#0A1A24]/5 transition-all duration-300">
                {/* 🌟 Left: Brand Identity */}
                <div 
                    className="flex items-center space-x-3 cursor-pointer shrink-0" 
                    onClick={() => navigate(doctor && doctor.isSuperAdmin ? '/admin/doctors' : '/')}
                    title="Dentia Clinical Suite"
                >
                    <img src="/images/logo-black.webp" alt="Dentia Logo" className="h-8 object-contain" />
                </div>
                
                {/* 🌟 Center: Context-Aware Navigation Capsule */}
                <nav className="hidden lg:flex items-center space-x-1.5 bg-gradient-to-r from-[#EAF0FC]/80 via-white/80 to-[#EAF0FC]/95 p-1.5 rounded-full border border-[#4A7CD2]/20 shadow-inner shrink-0">
                    {/* 🛡️ SUPERADMIN NAVIGATION */}
                    {doctor && doctor.isSuperAdmin ? (
                        <>
                            <Link 
                                to="/admin/organizations" 
                                aria-current={(location.pathname === '/admin/organizations' || location.pathname === '/admin/hospitals') ? "page" : undefined}
                                aria-label="Hospital & Organization Management"
                                className={getLinkClass(location.pathname === '/admin/organizations' || location.pathname === '/admin/hospitals')}
                                title="Hospital & Organization Management (SuperAdmin)"
                            >
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-700 ml-1.5">Organizations</span>
                            </Link>
                            <Link 
                                to="/admin/doctors" 
                                aria-current={location.pathname === '/admin/doctors' ? "page" : undefined}
                                aria-label="Doctor Directory & Profiles"
                                className={getLinkClass(location.pathname === '/admin/doctors')}
                                title="Doctor Directory & Profiles (SuperAdmin)"
                            >
                                <Shield className="w-5 h-5 text-emerald-600" />
                                <span className="text-xs font-bold text-emerald-700 ml-1.5">Doctor Management</span>
                            </Link>
                        </>
                    ) : (
                        /* 🩺 CLINICAL DOCTOR & PUBLIC NAVIGATION */
                        <>
                            <Link 
                                to="/" 
                                aria-current={(location.pathname === '/' || location.pathname === '/dashboard') ? "page" : undefined}
                                aria-label="Home"
                                className={getLinkClass(location.pathname === '/' || location.pathname === '/dashboard')}
                                title="Home"
                            >
                                <Home className="w-5 h-5" />
                            </Link>
                            
                            {/* Doctor Workspace Clinical Tools */}
                            {doctor && (
                                <>
                                    <Link 
                                        to="/directory" 
                                        aria-current={(location.pathname === '/directory' || location.pathname.startsWith('/chart')) ? "page" : undefined}
                                        aria-label="Patient Directory"
                                        className={getLinkClass(location.pathname === '/directory' || location.pathname.startsWith('/chart'))}
                                        title="Patient Directory"
                                    >
                                        <Users className="w-5 h-5" />
                                    </Link>
                                    <Link 
                                        to="/appointments" 
                                        aria-current={location.pathname === '/appointments' ? "page" : undefined}
                                        aria-label="Appointments Hub"
                                        className={getLinkClass(location.pathname === '/appointments')}
                                        title="Appointments Hub"
                                    >
                                        <Calendar className="w-5 h-5" />
                                    </Link>
                                    <Link 
                                        to="/doctor/pricing" 
                                        aria-current={(location.pathname === '/doctor/pricing' || location.pathname === '/treatment-pricing') ? "page" : undefined}
                                        aria-label="Doctor Fee Schedules & Treatment Pricing"
                                        className={getLinkClass(location.pathname === '/doctor/pricing' || location.pathname === '/treatment-pricing')}
                                        title="Doctor Fee Schedules & Treatment Pricing"
                                    >
                                        <DollarSign className="w-5 h-5" />
                                    </Link>
                                    <Link 
                                        to="/clinic/website-studio" 
                                        aria-current={(location.pathname === '/clinic/website-studio' || location.pathname === '/admin/website') ? "page" : undefined}
                                        aria-label="Website & Landing Page Studio"
                                        className={getLinkClass(location.pathname === '/clinic/website-studio' || location.pathname === '/admin/website')}
                                        title="Website & Landing Page Studio (Doctor CMS)"
                                    >
                                        <Globe className="w-5 h-5 text-teal-600" />
                                    </Link>
                                    <Link 
                                        to="/admin/whatsapp" 
                                        aria-current={(location.pathname === '/admin/whatsapp' || location.pathname === '/whatsapp-manager') ? "page" : undefined}
                                        aria-label="WhatsApp Gateway & Messaging Hub"
                                        className={getLinkClass(location.pathname === '/admin/whatsapp' || location.pathname === '/whatsapp-manager')}
                                        title="WhatsApp Gateway & Messaging Hub"
                                    >
                                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                                    </Link>
                                    <Link 
                                        to="/treatment" 
                                        aria-current={location.pathname === '/treatment' ? "page" : undefined}
                                        aria-label="Treatments & Procedures"
                                        className={getLinkClass(location.pathname === '/treatment')}
                                        title="Treatments & Procedures"
                                    >
                                        <Stethoscope className="w-5 h-5" />
                                    </Link>
                                </>
                            )}
                            
                            {/* Public Marketing Links: Only visible to public website visitors */}
                            {!doctor && (
                                <>
                                    <Link 
                                        to="/treatment" 
                                        aria-current={location.pathname === '/treatment' ? "page" : undefined}
                                        aria-label="Treatments"
                                        className={getLinkClass(location.pathname === '/treatment')}
                                        title="Treatments"
                                    >
                                        <Stethoscope className="w-5 h-5" />
                                    </Link>
                                    <a 
                                        href="/#about" 
                                        aria-label="About Us"
                                        className={getLinkClass(location.hash === '#about')}
                                        title="About Us"
                                    >
                                        <Info className="w-5 h-5" />
                                    </a>
                                    <a 
                                        href="/#team" 
                                        aria-label="Our Doctors"
                                        className={getLinkClass(location.hash === '#team')}
                                        title="Our Doctors"
                                    >
                                        <UserCheck className="w-5 h-5" />
                                    </a>
                                    <a 
                                        href="/#reviews" 
                                        aria-label="Patient Reviews"
                                        className={getLinkClass(location.hash === '#reviews')}
                                        title="Patient Reviews"
                                    >
                                        <Star className="w-5 h-5" />
                                    </a>
                                </>
                            )}
                        </>
                    )}
                </nav>

                {/* 🌟 Right: Clinician Status, Profile & Quick Actions */}
                <div className="flex items-center space-x-3 shrink-0">
                    {/* Chairside Hardware Connection Badge (Doctors only) */}
                    {(!doctor || !doctor.isSuperAdmin) && (
                        <HardwareDeviceSyncBadge onOpenCapturePanel={() => {
                            console.log('🩺 [HARDWARE DIAGNOSTIC] Doctor clicked Hardware Badge action in navbar:', {
                                doctorId: doctor?.doctorID || doctor?.id,
                                doctorName: `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || 'Doctor 2',
                                currentPath: location.pathname,
                                timestamp: new Date().toISOString()
                            });
                            if (location.pathname.startsWith('/chart')) {
                                console.log('🩺 [HARDWARE DIAGNOSTIC] Dispatching dentia:voice:open-nanopix on chart page');
                                window.dispatchEvent(new CustomEvent('dentia:voice:open-nanopix'));
                                window.dispatchEvent(new CustomEvent('nanopix:open-modal'));
                            } else {
                                navigate('/directory');
                            }
                        }} />
                    )}

                    {doctor ? (
                        <div className="flex items-center space-x-2.5">
                            {/* Doctor Profile Pill with Affiliated Organization */}
                            <div className="flex items-center space-x-2.5 bg-white pr-4 pl-1.5 py-1.5 rounded-full border border-light-teal shadow-xs hover:border-[#4A7CD2]/40 transition-all whitespace-nowrap">
                                <div className="w-8 h-8 rounded-full bg-light-teal/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white shadow-2xs">
                                    <img 
                                        src={doctor.profileImageUrl || `https://ui-avatars.com/api/?name=${doctor.firstName || 'Super'}+${doctor.lastName || 'Admin'}&background=EAF0FC&color=4A7CD2`} 
                                        alt="Doctor" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col text-left leading-tight hidden sm:flex">
                                    <span className="text-xs font-bold text-dark-slate whitespace-nowrap">
                                        {doctor.isSuperAdmin 
                                            ? 'SuperAdmin' 
                                            : (() => {
                                                const rawName = (doctor.lastName || doctor.firstName || 'Doctor').trim();
                                                const capitalized = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                                                return `Dr. ${capitalized}`;
                                              })()
                                        }
                                    </span>
                                    {orgName && (
                                        <span 
                                            className="text-[10px] font-semibold text-[#4A7CD2] flex items-center gap-1 max-w-[190px] truncate" 
                                            title={`Affiliated with ${orgName}`}
                                        >
                                            <Building2 className="w-2.5 h-2.5 shrink-0 text-[#4A7CD2]" />
                                            <span className="truncate">{orgName}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate(doctor.isSuperAdmin ? '/admin/doctors' : '/directory')}
                                className="bg-primary-teal hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-full text-xs transition-all shadow-md cursor-pointer whitespace-nowrap"
                            >
                                {doctor.isSuperAdmin ? 'Admin Suite' : 'Workspace'}
                            </button>
                             <button 
                                onClick={handleLogout} 
                                aria-label="Log Out of Clinician Portal"
                                className="bg-light-teal text-dark-slate hover:bg-dark-slate hover:text-white border border-light-teal-hover transition-all duration-300 py-2.5 px-3.5 rounded-full text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer" 
                                title="Log Out"
                             >
                                <LogOut className="w-4 h-4" />
                             </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Link to="/book" className="bg-primary-teal hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-full text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                <CalendarPlus className="w-4 h-4" />
                                Book Visit
                            </Link>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}

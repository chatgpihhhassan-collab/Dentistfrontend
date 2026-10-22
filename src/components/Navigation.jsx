import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Calendar, Stethoscope, Info, CalendarPlus, Phone, Clock, Mail, Star, UserCheck, DollarSign, Building2, Shield, MessageCircle, Globe, Sliders } from 'lucide-react';
import { HardwareDeviceSyncBadge } from './HardwareDeviceSyncBadge';
import { purgeClinicianSession } from '../services/sessionSecurityService';
import landingCmsService from '../services/landingCmsService';
import { getClinicLiveStatus } from '../utils/clinicScheduleUtils';
import DoctorClinicScheduleModal from './DoctorClinicScheduleModal';
import DoctorStaffReceptionistModal from './DoctorStaffReceptionistModal';
import { hasPermission } from '../utils/permissionUtils';

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
    const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(() => new Date());

    // Continuous real-time clock ticker for minute-accurate open/closed status
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000); // Check every 30 seconds
        return () => clearInterval(timer);
    }, []);

    const isHomePage = location.pathname === '/' || location.pathname === '/dashboard';

    // Listen for doctor profile and clinic schedule updates across the app
    React.useEffect(() => {
        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setDoctor(e.detail);
            }
        };
        const handleOpenStaffModal = () => setIsStaffModalOpen(true);
        const handleOpenScheduleModal = () => setIsScheduleModalOpen(true);

        window.addEventListener('dentia:doctor-profile-updated', handleProfileUpdate);
        window.addEventListener('dentia:open-staff-modal', handleOpenStaffModal);
        window.addEventListener('dentia:open-schedule-modal', handleOpenScheduleModal);

        return () => {
            window.removeEventListener('dentia:doctor-profile-updated', handleProfileUpdate);
            window.removeEventListener('dentia:open-staff-modal', handleOpenStaffModal);
            window.removeEventListener('dentia:open-schedule-modal', handleOpenScheduleModal);
        };
    }, []);

    React.useEffect(() => {
        if (doctor) {
            const docId = doctor.doctorID || doctor.id;
            // Fetch updated profile if organization or clinic details are missing
            if (docId && (!doctor.organizationName || !doctor.phone || !doctor.clinicOperatingHours)) {
                fetch(`/api/auth/doctor/${docId}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(docData => {
                        if (docData) {
                            const updated = {
                                ...doctor,
                                organizationID: docData.organizationID || docData.OrganizationID || doctor.organizationID,
                                organizationName: docData.organizationName || docData.OrganizationName || doctor.organizationName,
                                organizationLogoUrl: docData.organizationLogoUrl || docData.OrganizationLogoUrl || doctor.organizationLogoUrl,
                                organizationCity: docData.organizationCity || docData.OrganizationCity || doctor.organizationCity,
                                phone: docData.phone || docData.Phone || doctor.phone || '+92 334 5081202',
                                email: docData.email || docData.Email || doctor.email || 'bajwa.376@gmail.com',
                                clinicName: docData.clinicName || docData.ClinicName || doctor.clinicName || 'Bajwa Dental & Oral Surgery Clinic',
                                clinicOperatingHours: docData.clinicOperatingHours || docData.ClinicOperatingHours || doctor.clinicOperatingHours || 'Mon - Sat: 03:00 - 20:00',
                                isClinicOpenManualOverride: docData.isClinicOpenManualOverride !== undefined ? docData.isClinicOpenManualOverride : doctor.isClinicOpenManualOverride
                            };
                            localStorage.setItem('doctor', JSON.stringify(updated));
                            setDoctor(updated);
                        }
                    })
                    .catch(() => {});
            }
        }
        return landingCmsService.subscribe(setConfig);
    }, [doctor?.doctorID]);

    const orgName = doctor ? (
        doctor.organizationName || 
        doctor.OrganizationName || 
        (doctor.region === 'PK' ? 'Shifa International Hospitals Ltd' : 'Dentia Auckland Regional Dental Hospital')
    ) : null;

    // Doctor-specific contact info with dynamic clinic fallback
    const displayPhone = doctor?.phone || config.phone || '+92 334 5081202';
    const displayEmail = doctor?.email || config.email || 'bajwa.376@gmail.com';
    const displaySchedule = doctor?.clinicOperatingHours || config.operatingHours || 'Mon - Sat: 03:00 - 20:00';
    const manualOverride = doctor?.isClinicOpenManualOverride;
    
    // Real-time live open/closed status calculation
    const liveStatus = getClinicLiveStatus(displaySchedule, manualOverride, currentTime);

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

    const cleanPhone = `tel:${displayPhone.replace(/[^\d+]/g, '')}`;
    const showTopBar = config.sections?.showTopContactBar !== false;

    return (
        <div className="pt-2 pb-2 px-3 sm:px-6 sticky top-0 z-50 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-light-teal/40 transition-all shadow-xs">
            {/* Top Contact & Operating Status Bar */}
            {showTopBar && (
                <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 mb-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-2 text-xs text-muted-text font-medium">
                    
                    {/* Left: Contact Info & Real-Time Open/Closed Status */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        
                        {/* Direct Phone */}
                        <a 
                            href={cleanPhone} 
                            className="flex items-center text-slate-700 hover:text-primary-teal font-semibold transition-colors group"
                            title={`Call Clinic: ${displayPhone}`}
                        >
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-primary-teal group-hover:scale-110 transition-transform" /> 
                            <span>{displayPhone}</span>
                        </a>

                        {/* Clinic Schedule & Live Status Badge */}
                        <div className="flex items-center gap-2">
                            <span className="flex items-center text-slate-700 font-semibold" title={`Weekly Schedule: ${displaySchedule}`}>
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-primary-teal" /> 
                                <span>{displaySchedule}</span>
                            </span>

                            {/* 🟢 / 🔴 Dynamic Real-Time Open / Closed Status Pill */}
                            <button
                                type="button"
                                onClick={() => doctor && setIsScheduleModalOpen(true)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shadow-2xs border whitespace-nowrap shrink-0 ${
                                    liveStatus.isOpen 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400' 
                                        : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 hover:border-rose-400'
                                } ${doctor ? 'cursor-pointer hover:scale-105 ring-1 ring-black/5' : ''}`}
                                title={doctor ? `Clinic is currently ${liveStatus.label} (${liveStatus.detail}). Click to update schedule or toggle open/closed.` : `Live Status: ${liveStatus.label} (${liveStatus.detail})`}
                            >
                                <span className="relative flex h-2 w-2">
                                    {liveStatus.isOpen && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                        liveStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}></span>
                                </span>
                                <span className="tracking-tight whitespace-nowrap">{liveStatus.label}</span>
                                <span className="hidden md:inline text-[10px] font-medium opacity-85 whitespace-nowrap">
                                    • {liveStatus.detail}
                                </span>
                                {doctor && (
                                    <span className="text-[9px] bg-white/80 px-1 py-0.2 rounded font-bold text-slate-600 border border-slate-200/80 ml-0.5 whitespace-nowrap">
                                        Edit
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Direct Email */}
                        <a 
                            href={`mailto:${displayEmail}`} 
                            className="flex items-center text-slate-700 hover:text-primary-teal font-semibold transition-colors hidden sm:flex group whitespace-nowrap shrink-0"
                            title={`Email Clinic: ${displayEmail}`}
                        >
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-primary-teal group-hover:scale-110 transition-transform shrink-0" /> 
                            <span>{displayEmail}</span>
                        </a>
                    </div>

                    {/* Right: Hospital Affiliation & Trust Proof */}
                    <div className="flex items-center space-x-3 sm:space-x-4 ml-auto">
                        {/* 🌟 Clinic Hours & Staff Management: ONLY visible on Home Page for Doctors */}
                        {isHomePage && doctor && (
                            <button
                                type="button"
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="hidden xl:inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-slate-600 bg-white hover:text-primary-teal hover:border-primary-teal/40 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition-all cursor-pointer shrink-0"
                                title="Doctor Clinic Schedule & Live Status Settings"
                            >
                                <Sliders className="w-3 h-3 text-primary-teal shrink-0" />
                                <span>Clinic Hours</span>
                            </button>
                        )}
                        {isHomePage && doctor && !doctor.isSuperAdmin && doctor.role !== 'Receptionist' && (
                            <button
                                type="button"
                                onClick={() => setIsStaffModalOpen(true)}
                                className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-[#10244B] bg-[#EAF0FC] hover:bg-[#D4E2F9] px-3 py-1 rounded-full border border-[#4A7CD2]/25 shadow-2xs transition-all cursor-pointer shrink-0"
                                title="Manage Front-Desk Staff, Passwords & Dynamic Granular Permissions"
                            >
                                <Users className="w-3.5 h-3.5 text-[#4A7CD2] shrink-0" />
                                <span>Staff & Receptionists</span>
                            </button>
                        )}
                        {doctor && orgName && (
                            <div className="hidden lg:flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-700 bg-white px-3 py-1 rounded-full border border-[#4A7CD2]/30 shadow-2xs shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-[#4A7CD2] shrink-0" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital:</span>
                                <strong className="text-slate-800 font-bold max-w-[280px] truncate" title={orgName}>{orgName}</strong>
                            </div>
                        )}
                        <span className="flex items-center text-accent-gold font-bold whitespace-nowrap shrink-0">
                            ★ {config.socialProof?.googleRating || 5.0} <span className="text-slate-600 font-medium ml-1 hidden sm:inline">({config.socialProof?.googleReviewCountText || '23k Google Reviews'})</span>
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
                            
                            {/* Doctor Workspace Clinical Tools (Granular Permissions Aware) */}
                            {doctor && (
                                <>
                                    {hasPermission(doctor, 'directory') && (
                                        <Link 
                                            to="/directory" 
                                            aria-current={(location.pathname === '/directory' || location.pathname.startsWith('/chart')) ? "page" : undefined}
                                            aria-label="Patient Directory"
                                            className={getLinkClass(location.pathname === '/directory' || location.pathname.startsWith('/chart'))}
                                            title="Patient Directory"
                                        >
                                            <Users className="w-5 h-5" />
                                        </Link>
                                    )}
                                    {hasPermission(doctor, 'appointments') && (
                                        <Link 
                                            to="/appointments" 
                                            aria-current={location.pathname === '/appointments' ? "page" : undefined}
                                            aria-label="Appointments Hub"
                                            className={getLinkClass(location.pathname === '/appointments')}
                                            title="Appointments Hub"
                                        >
                                            <Calendar className="w-5 h-5" />
                                        </Link>
                                    )}
                                    {hasPermission(doctor, 'treatmentPricing') && (
                                        <Link 
                                            to="/doctor/pricing" 
                                            aria-current={(location.pathname === '/doctor/pricing' || location.pathname === '/treatment-pricing') ? "page" : undefined}
                                            aria-label="Doctor Fee Schedules & Treatment Pricing"
                                            className={getLinkClass(location.pathname === '/doctor/pricing' || location.pathname === '/treatment-pricing')}
                                            title="Doctor Fee Schedules & Treatment Pricing"
                                        >
                                            <DollarSign className="w-5 h-5" />
                                        </Link>
                                    )}
                                    {hasPermission(doctor, 'clinicWebsiteStudio') && (
                                        <Link 
                                            to="/clinic/website-studio" 
                                            aria-current={(location.pathname === '/clinic/website-studio' || location.pathname === '/admin/website') ? "page" : undefined}
                                            aria-label="Website & Landing Page Studio"
                                            className={getLinkClass(location.pathname === '/clinic/website-studio' || location.pathname === '/admin/website')}
                                            title="Website & Landing Page Studio (Doctor CMS)"
                                        >
                                            <Globe className="w-5 h-5 text-teal-600" />
                                        </Link>
                                    )}
                                    {hasPermission(doctor, 'whatsappHub') && (
                                        <Link 
                                            to="/admin/whatsapp" 
                                            aria-current={(location.pathname === '/admin/whatsapp' || location.pathname === '/whatsapp-manager') ? "page" : undefined}
                                            aria-label="WhatsApp Gateway & Messaging Hub"
                                            className={getLinkClass(location.pathname === '/admin/whatsapp' || location.pathname === '/whatsapp-manager')}
                                            title="WhatsApp Gateway & Messaging Hub"
                                        >
                                            <MessageCircle className="w-5 h-5 text-emerald-600" />
                                        </Link>
                                    )}
                                    {hasPermission(doctor, 'treatmentCatalog') && (
                                        <Link 
                                            to="/treatment" 
                                            aria-current={location.pathname === '/treatment' ? "page" : undefined}
                                            aria-label="Treatments & Procedures"
                                            className={getLinkClass(location.pathname === '/treatment')}
                                            title="Treatments & Procedures"
                                        >
                                            <Stethoscope className="w-5 h-5" />
                                        </Link>
                                    )}
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
                    {/* Chairside Hardware Connection Badge (Clinical Dentists only) */}
                    {(!doctor || (!doctor.isSuperAdmin && doctor.role !== 'Receptionist')) && (
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
                                            : doctor.role === 'Receptionist'
                                                ? `Receptionist ${doctor.firstName || 'Staff'}`
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

            {/* Doctor Clinic Operating Schedule & Profile Management Modal */}
            {doctor && (
                <DoctorClinicScheduleModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    doctor={doctor}
                    onDoctorUpdated={(updated) => setDoctor(updated)}
                />
            )}

            {/* Doctor Front-Desk Staff & Multi-Receptionist Permission Manager Modal */}
            {doctor && !doctor.isSuperAdmin && doctor.role !== 'Receptionist' && (
                <DoctorStaffReceptionistModal
                    isOpen={isStaffModalOpen}
                    onClose={() => setIsStaffModalOpen(false)}
                    doctor={doctor}
                />
            )}
        </div>
    );
}

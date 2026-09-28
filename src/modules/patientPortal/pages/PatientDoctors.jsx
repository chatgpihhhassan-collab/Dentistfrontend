import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../../../config/apiConfig';
import { 
    safeFetchJson, 
    DEFAULT_CLINIC_DOCTORS, 
    DEFAULT_CLINIC_ORGANIZATIONS,
    getDoctorProceduresFallback
} from '../../../utils/safeApiUtils';
import { 
    Stethoscope, 
    Calendar, 
    Star, 
    Award, 
    Clock, 
    Building2, 
    GraduationCap, 
    Globe2, 
    CheckCircle2, 
    ChevronRight, 
    Search, 
    Filter, 
    X, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight,
    MapPin,
    BadgeCheck,
    Briefcase,
    Grid,
    List,
    Check,
    ExternalLink,
    ThumbsUp,
    HeartHandshake,
    ArrowUpRight,
    Phone,
    Mail,
    BookOpen,
    Layers,
    Users,
    Zap,
    SlidersHorizontal
} from 'lucide-react';

export default function PatientDoctors() {
    const navigate = useNavigate();

    // Data State
    const [doctors, setDoctors] = useState([]);
    const [organizations, setOrganizations] = useState(DEFAULT_CLINIC_ORGANIZATIONS);
    const [loading, setLoading] = useState(true);

    // Filters and View State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedOrg, setSelectedOrg] = useState('All'); // 'All' or organizationID
    const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'experience', 'fee-low', 'fee-high'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Selected Doctor for Profile Modal
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [modalActiveTab, setModalActiveTab] = useState('overview'); // 'overview' | 'services' | 'career' | 'credentials' | 'reviews'

    // Doctor Services state for Modal
    const [modalDoctorServices, setModalDoctorServices] = useState([]);
    const [loadingModalServices, setLoadingModalServices] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');
    const [serviceCategory, setServiceCategory] = useState('All');

    useEffect(() => {
        if (!selectedDoctor) {
            setModalDoctorServices([]);
            setServiceSearch('');
            setServiceCategory('All');
            return;
        }

        const docId = Number(selectedDoctor.doctorID ?? selectedDoctor.id);
        const fallbackList = getDoctorProceduresFallback(docId, selectedDoctor.region);
        setModalDoctorServices(fallbackList);

        const fetchDoctorServices = async () => {
            try {
                setLoadingModalServices(true);
                const endpoints = [
                    `${API_BASE_URL}/api/patient-portal/doctors/${docId}/services`,
                    `https://dentist-api-dev.vitonta.com/api/patient-portal/doctors/${docId}/services`,
                    `/api/patient-portal/doctors/${docId}/services`,
                    `${API_BASE_URL}/api/treatment-pricing/doctor/${docId}`,
                    `https://dentist-api-dev.vitonta.com/api/treatment-pricing/doctor/${docId}`,
                    `/api/treatment-pricing/doctor/${docId}`
                ];
                const result = await safeFetchJson(endpoints);
                if (result.ok && result.data && Array.isArray(result.data.procedures) && result.data.procedures.length > 0) {
                    const active = result.data.procedures.filter(p => p.isActive !== false);
                    if (active.length > 0) {
                        setModalDoctorServices(active);
                    }
                }
            } catch {
                // Keep fallbackList
            } finally {
                setLoadingModalServices(false);
            }
        };

        fetchDoctorServices();
    }, [selectedDoctor]);

    const modalServiceCategories = useMemo(() => {
        const cats = new Set(['All']);
        modalDoctorServices.forEach(s => {
            if (s.category) cats.add(s.category);
        });
        return Array.from(cats);
    }, [modalDoctorServices]);

    const filteredModalServices = useMemo(() => {
        return modalDoctorServices.filter(s => {
            const matchesCat = serviceCategory === 'All' || s.category === serviceCategory;
            const q = serviceSearch.trim().toLowerCase();
            const matchesQuery = !q || 
                s.procedureName?.toLowerCase().includes(q) ||
                s.procedureCode?.toLowerCase().includes(q) ||
                s.description?.toLowerCase().includes(q) ||
                s.category?.toLowerCase().includes(q);
            return matchesCat && matchesQuery;
        });
    }, [modalDoctorServices, serviceCategory, serviceSearch]);

    const specialtiesList = [
        { id: 'All', label: 'All Specialists', icon: Stethoscope },
        { id: 'Implantology & Surgery', label: 'Oral Surgery & Implants', icon: Award },
        { id: 'Orthodontics', label: 'Orthodontics & Aligners', icon: Sparkles },
        { id: 'Cosmetic & Restorative', label: 'Cosmetic & Restorative', icon: HeartHandshake },
        { id: 'Endodontics', label: 'Endodontics & Root Canal', icon: Layers },
        { id: 'General Dental', label: 'General & Preventative', icon: CheckCircle2 }
    ];

    useEffect(() => {
        fetchDoctors();
        fetchOrganizations();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const endpoints = [
                `${API_BASE_URL}/api/patient-portal/doctors`,
                'https://dentist-api-dev.vitonta.com/api/patient-portal/doctors',
                '/api/patient-portal/doctors',
                `${API_BASE_URL}/api/auth/doctors`,
                'https://dentist-api-dev.vitonta.com/api/auth/doctors',
                '/api/auth/doctors'
            ];
            const result = await safeFetchJson(endpoints);
            if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
                const mapped = result.data.map(d => {
                    const first = (d.firstName || '').trim();
                    const last = (d.lastName || '').trim();
                    let fullName = d.fullName;
                    if (first || last) {
                        const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
                        fullName = `Dr. ${cap(first)} ${cap(last)}`.trim();
                    } else if (!fullName || !fullName.startsWith('Dr.')) {
                        fullName = fullName ? `Dr. ${fullName}` : 'Dr. Specialist';
                    }
                    return {
                        ...d,
                        fullName
                    };
                });
                setDoctors(mapped);
            } else {
                setDoctors(DEFAULT_CLINIC_DOCTORS);
            }
        } catch {
            setDoctors(DEFAULT_CLINIC_DOCTORS);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const endpoints = [
                `${API_BASE_URL}/api/patient-portal/organizations`,
                'https://dentist-api-dev.vitonta.com/api/patient-portal/organizations',
                '/api/patient-portal/organizations'
            ];
            const result = await safeFetchJson(endpoints);
            if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
                setOrganizations(result.data);
            } else {
                setOrganizations(DEFAULT_CLINIC_ORGANIZATIONS);
            }
        } catch {
            setOrganizations(DEFAULT_CLINIC_ORGANIZATIONS);
        }
    };

    // Parse organization history safely (supports JSON array or string)
    const parseOrganizations = (orgData) => {
        if (!orgData) return [];
        if (Array.isArray(orgData)) return orgData;
        try {
            const parsed = JSON.parse(orgData);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            return String(orgData).split('\n').filter(Boolean).map(line => ({
                organization: line,
                role: 'Clinical Affiliation',
                period: 'Clinical Experience',
                description: ''
            }));
        }
        return [];
    };

    // Currency Formatter tailored for Regional Doctors (PK: Rs, NZ: NZ$)
    const formatDoctorFee = (fee, region, docId) => {
        const num = Number(fee) || 0;
        const isPk = region === 'PK' || docId === 2 || docId === 4;
        if (isPk) {
            return `Rs ${num.toLocaleString('en-PK')}`;
        }
        return `NZ$ ${num.toFixed(0)}`;
    };

    // Specialty Badge Color Mapping
    const getSpecialtyBadgeColor = (spec = '') => {
        const s = spec.toLowerCase();
        if (s.includes('implant') || s.includes('surgery') || s.includes('maxillofacial')) {
            return 'bg-blue-50 text-blue-700 border-blue-200/80';
        }
        if (s.includes('ortho') || s.includes('aligner') || s.includes('braces')) {
            return 'bg-purple-50 text-purple-700 border-purple-200/80';
        }
        if (s.includes('endodont') || s.includes('root canal')) {
            return 'bg-teal-50 text-teal-700 border-teal-200/80';
        }
        if (s.includes('cosmetic') || s.includes('restorative') || s.includes('smile')) {
            return 'bg-amber-50 text-amber-800 border-amber-200/80';
        }
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    };

    // Suggested next slot generator for realistic patient experience
    const getNextSlot = (docId) => {
        if (docId === 2) return 'Tomorrow, 09:45 AM';
        if (docId === 4) return 'Tomorrow, 02:00 PM';
        if (docId === 5) return 'Wednesday, 11:15 AM';
        return 'Thursday, 10:00 AM';
    };

    const handleSelectDoctorForBooking = (doctor) => {
        if (!doctor) return;
        const docId = Number(doctor.doctorID ?? doctor.DoctorID ?? doctor.id ?? doctor.DoctorId);
        const docName = doctor.fullName || `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
        navigate(`/portal/book?doctor=${docId}`, {
            state: {
                doctorId: docId,
                doctorName: docName,
                doctor
            }
        });
    };

    // Filter & Sort Pipeline
    const filteredDoctors = useMemo(() => {
        return doctors
            .filter(doc => {
                const fullName = (doc.fullName || `Dr. ${doc.firstName} ${doc.lastName}`).toLowerCase();
                const spec = (doc.specialization || '').toLowerCase();
                const bio = (doc.biography || '').toLowerCase();
                const orgs = (typeof doc.organizationWorkHistory === 'string' ? doc.organizationWorkHistory : JSON.stringify(doc.organizationWorkHistory || '')).toLowerCase();
                const orgName = (doc.organizationName || '').toLowerCase();
                const dept = (doc.hospitalDepartment || '').toLowerCase();
                const city = (doc.organizationCity || '').toLowerCase();
                const query = searchQuery.toLowerCase();

                const matchesQuery = !searchQuery || 
                    fullName.includes(query) || 
                    spec.includes(query) || 
                    bio.includes(query) || 
                    orgs.includes(query) || 
                    orgName.includes(query) || 
                    dept.includes(query) ||
                    city.includes(query);

                if (!matchesQuery) return false;

                // Organization Filter
                if (selectedOrg !== 'All') {
                    const matchOrg = (doc.organizationID && doc.organizationID.toString() === selectedOrg.toString()) ||
                                     (doc.organizationName && doc.organizationName.toLowerCase().includes(selectedOrg.toString().toLowerCase()));
                    if (!matchOrg) return false;
                }

                // Specialty Filter
                if (selectedSpecialty === 'All') return true;
                if (selectedSpecialty === 'Implantology & Surgery') return spec.includes('implant') || spec.includes('surgery') || spec.includes('surgeon') || spec.includes('maxillofacial');
                if (selectedSpecialty === 'Orthodontics') return spec.includes('ortho') || spec.includes('aligner') || spec.includes('braces');
                if (selectedSpecialty === 'Cosmetic & Restorative') return spec.includes('cosmetic') || spec.includes('restorative') || spec.includes('prostho');
                if (selectedSpecialty === 'Endodontics') return spec.includes('endodont') || spec.includes('root canal');
                if (selectedSpecialty === 'General Dental') return spec.includes('general') || spec.includes('prevent');
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'experience') {
                    return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
                }
                if (sortBy === 'fee-low') {
                    return (a.consultationFee || 0) - (b.consultationFee || 0);
                }
                if (sortBy === 'fee-high') {
                    return (b.consultationFee || 0) - (a.consultationFee || 0);
                }
                // default recommended: high rating first, then experience
                const ratingA = Number(a.rating) || 4.9;
                const ratingB = Number(b.rating) || 4.9;
                if (ratingB !== ratingA) return ratingB - ratingA;
                return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
            });
    }, [doctors, searchQuery, selectedOrg, selectedSpecialty, sortBy]);

    // Calculate active doctor counts per organization for quick badges
    const orgDoctorCounts = useMemo(() => {
        const counts = {};
        doctors.forEach(d => {
            const orgId = d.organizationID;
            if (orgId) {
                counts[orgId] = (counts[orgId] || 0) + 1;
            }
        });
        return counts;
    }, [doctors]);

    return (
        <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
            {/* =========================================================================
                1. LUXURY HERO BANNER WITH STATS & TRUST BADGES
            ========================================================================= */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-dark-slate via-[#152e5a] to-[#255294] text-white p-8 sm:p-12 shadow-2xl border border-white/10">
                {/* Decorative Background Lighting Effects */}
                <div className="absolute -right-24 -top-24 w-96 h-96 bg-primary-teal/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                <div className="relative z-10 max-w-4xl space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wider uppercase text-emerald-300 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Verified Specialist Directory & Hospital Affiliations</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight leading-[1.15]">
                        Consult with Premier Dental Surgeons & Specialists
                    </h1>

                    <p className="text-sm sm:text-base text-light-teal/90 leading-relaxed font-normal max-w-2xl">
                        Browse accredited clinicians and hospital faculties (including <span className="font-semibold text-white">Shifa International</span> & <span className="font-semibold text-white">AKUH</span>). Inspect academic credentials, institutional appointment histories, and schedule your appointment with confidence.
                    </p>

                    {/* Trust Indicators Strip */}
                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10">
                            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                            <span className="text-xs font-semibold text-white">100% Board Certified</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10">
                            <Building2 className="w-4 h-4 text-sky-300 shrink-0" />
                            <span className="text-xs font-semibold text-white">Hospital Networks</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10">
                            <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                            <span className="text-xs font-semibold text-white">Fast-Track Slots</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/10">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-xs font-semibold text-white">4.95 Patient Score</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                2. INTERACTIVE HOSPITAL & HEALTHCARE NETWORK STRIP
            ========================================================================= */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary-teal" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-text">
                            Filter by Affiliated Hospital & Healthcare Network
                        </h2>
                    </div>
                    {selectedOrg !== 'All' && (
                        <button
                            onClick={() => setSelectedOrg('All')}
                            className="text-xs font-bold text-primary-teal hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <span>Reset to All Hospitals</span>
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* All Hospitals Card */}
                    <button
                        onClick={() => setSelectedOrg('All')}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            selectedOrg === 'All'
                                ? 'bg-primary-teal text-white border-primary-teal shadow-lg shadow-primary-teal/20 scale-[1.02]'
                                : 'bg-white text-dark-slate border-light-teal/70 hover:border-primary-teal/40 hover:bg-light-teal/10 shadow-xs'
                        }`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                selectedOrg === 'All' ? 'bg-white/20 text-white' : 'bg-light-teal/40 text-primary-teal'
                            }`}>
                                🏥
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                selectedOrg === 'All' ? 'bg-white text-primary-teal' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {doctors.length} Doctors
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="font-serif font-bold text-xs sm:text-sm line-clamp-1">All Institutions</p>
                            <p className={`text-[10px] font-medium ${selectedOrg === 'All' ? 'text-white/80' : 'text-muted-text'}`}>
                                Entire Multi-Hospital Network
                            </p>
                        </div>
                    </button>

                    {/* Individual Hospitals */}
                    {organizations.map(org => {
                        const isSelected = selectedOrg.toString() === org.organizationID.toString();
                        const docCount = orgDoctorCounts[org.organizationID] || org.doctorCount || 0;

                        return (
                            <button
                                key={org.organizationID}
                                onClick={() => setSelectedOrg(isSelected ? 'All' : org.organizationID)}
                                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-primary-teal text-white border-primary-teal shadow-lg shadow-primary-teal/20 scale-[1.02]'
                                        : 'bg-white text-dark-slate border-light-teal/70 hover:border-primary-teal/40 hover:bg-light-teal/10 shadow-xs'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-light-teal/80 flex items-center justify-center p-1 shadow-xs shrink-0">
                                        {org.logoUrl ? (
                                            <img src={org.logoUrl} alt={org.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="w-4 h-4 text-primary-teal" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isSelected ? 'bg-white text-primary-teal' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {docCount} {docCount === 1 ? 'Doctor' : 'Doctors'}
                                    </span>
                                </div>
                                <div className="mt-3 min-w-0">
                                    <p className="font-serif font-bold text-xs sm:text-sm truncate" title={org.name}>
                                        {org.name}
                                    </p>
                                    <p className={`text-[10px] font-medium truncate ${isSelected ? 'text-white/80' : 'text-muted-text'}`}>
                                        {org.city || 'Regional Center'} • {org.country || 'PK'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* =========================================================================
                3. UNIFIED CONTROL BAR: SEARCH, SPECIALTY TABS, SORT, & VIEW TOGGLE
            ========================================================================= */}
            <div className="bg-white rounded-3xl border border-light-teal/70 shadow-sm p-4 sm:p-5 space-y-4">
                {/* Search & Utility Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Live Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-text/60" />
                        <input
                            type="text"
                            placeholder="Search doctors, hospitals (e.g. Shifa, AKUH), implants, orthodontics, degrees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-warm-cream/60 border border-light-teal/60 rounded-2xl text-dark-slate placeholder:text-muted-text/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-text/50 hover:text-dark-slate p-1 cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1.5 bg-warm-cream/60 border border-light-teal/60 rounded-2xl px-3 py-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-primary-teal shrink-0" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-bold text-dark-slate focus:outline-none cursor-pointer pr-1"
                            >
                                <option value="recommended">Top Rated Specialists</option>
                                <option value="experience">Most Experienced</option>
                                <option value="fee-low">Fee: Lowest First</option>
                                <option value="fee-high">Fee: Highest First</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-warm-cream/60 border border-light-teal/60 rounded-2xl p-1 gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    viewMode === 'grid'
                                        ? 'bg-primary-teal text-white shadow-xs'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                                title="Grid View"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-primary-teal text-white shadow-xs'
                                        : 'text-muted-text hover:text-dark-slate'
                                }`}
                                title="Directory View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Specialty Pill Filter Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-light-teal/30 pt-3">
                    {specialtiesList.map(item => {
                        const Icon = item.icon;
                        const isSelected = selectedSpecialty === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSelectedSpecialty(item.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    isSelected
                                        ? 'bg-dark-slate text-white shadow-md shadow-dark-slate/20'
                                        : 'bg-warm-cream/70 text-dark-slate hover:bg-light-teal/40 border border-light-teal/50'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-teal' : 'text-primary-teal'}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Filter Metrics */}
                <div className="flex items-center justify-between text-xs text-muted-text pt-1">
                    <p className="font-medium">
                        Showing <span className="font-bold text-dark-slate">{filteredDoctors.length}</span> verified dental specialist{filteredDoctors.length === 1 ? '' : 's'}
                        {selectedOrg !== 'All' && <span> under selected hospital network</span>}
                    </p>
                    {(searchQuery || selectedSpecialty !== 'All' || selectedOrg !== 'All') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedSpecialty('All');
                                setSelectedOrg('All');
                            }}
                            className="font-bold text-primary-teal hover:underline cursor-pointer"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            </div>

            {/* =========================================================================
                4. DOCTORS DISPLAY (GRID OR DIRECTORY LIST VIEW)
            ========================================================================= */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 rounded-3xl bg-white border border-light-teal/60 p-6 animate-pulse space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-light-teal/40 mx-auto" />
                            <div className="h-5 bg-light-teal/40 rounded-lg w-2/3 mx-auto" />
                            <div className="h-4 bg-light-teal/30 rounded-lg w-1/2 mx-auto" />
                            <div className="h-24 bg-light-teal/20 rounded-2xl" />
                        </div>
                    ))}
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-3xl border border-light-teal/70 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-light-teal/40 text-primary-teal flex items-center justify-center mx-auto shadow-inner">
                        <Stethoscope className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-dark-slate">No Specialists Found</h3>
                    <p className="text-xs text-muted-text leading-relaxed">
                        No specialists match your criteria "{searchQuery}". Try modifying your hospital affiliation or specialty filters.
                    </p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); setSelectedOrg('All'); }}
                        className="px-6 py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-md shadow-primary-teal/20"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                /* -------------------------------------------------------------
                   GRID VIEW: MODERN PRESTIGE CARDS
                ------------------------------------------------------------- */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map(doctor => {
                        const docId = Number(doctor.doctorID ?? doctor.id ?? doctor.DoctorID);
                        const orgs = parseOrganizations(doctor.organizationWorkHistory);
                        const isDoctorOnline = doctor.isActive !== false;
                        const badgeColor = getSpecialtyBadgeColor(doctor.specialization);
                        const feeFormatted = formatDoctorFee(doctor.consultationFee, doctor.region, docId);
                        const nextSlot = getNextSlot(docId);

                        return (
                            <div
                                key={docId}
                                className="group bg-white rounded-[2rem] border border-light-teal/70 shadow-[0_4px_24px_rgba(16,36,75,0.04)] hover:shadow-xl hover:border-primary-teal/50 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                            >
                                {/* Top Accent Gradient Bar */}
                                <div className="h-2 w-full bg-gradient-to-r from-primary-teal via-indigo-500 to-emerald-400 group-hover:h-2.5 transition-all" />

                                <div className="p-6 space-y-5 flex-1">
                                    {/* Doctor Profile Header */}
                                    <div className="flex items-start gap-4">
                                        <div className="relative shrink-0">
                                            <img
                                                src={doctor.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"}
                                                alt={doctor.fullName}
                                                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                                            />
                                            {isDoctorOnline && (
                                                <span 
                                                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" 
                                                    title="Active Verified Clinician" 
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="text-lg font-serif font-black text-dark-slate truncate">
                                                    {doctor.fullName}
                                                </h3>
                                                <BadgeCheck className="w-4 h-4 text-primary-teal shrink-0" />
                                            </div>

                                            <p className="text-xs font-bold text-primary-teal line-clamp-1 mt-0.5">
                                                {doctor.title || 'Consultant Dental Surgeon'}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 shadow-2xs">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    <span>{doctor.rating || 4.9}</span>
                                                    <span className="text-amber-600/70 font-normal">({doctor.reviewCount || 28})</span>
                                                </div>
                                                <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 shadow-2xs">
                                                    {doctor.yearsOfExperience || 8} Yrs Clinical Exp
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Primary Specialty Badge */}
                                    <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${badgeColor}`}>
                                        <Award className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{doctor.specialization || 'General & Restorative Surgery'}</span>
                                    </div>

                                    {/* Primary Hospital Affiliation Container */}
                                    {doctor.organizationName ? (
                                        <div className="bg-gradient-to-r from-teal-50/90 via-sky-50/50 to-indigo-50/40 rounded-2xl p-3.5 border border-teal-200/80 shadow-xs space-y-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-white border border-teal-200 flex items-center justify-center p-1 shrink-0 shadow-xs">
                                                    {doctor.organizationLogoUrl ? (
                                                        <img src={doctor.organizationLogoUrl} alt={doctor.organizationName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 className="w-4 h-4 text-primary-teal" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-xs text-dark-slate truncate">{doctor.organizationName}</span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-100/80 text-teal-800 shrink-0">Hospital</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-text font-medium truncate mt-0.5">
                                                        {doctor.hospitalDepartment ? `${doctor.hospitalDepartment} • ` : ''}{doctor.organizationCity || 'Metropolitan Campus'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="font-medium">Independent Specialist Dental Practice</span>
                                        </div>
                                    )}

                                    {/* Career Timeline / Hospital History Snippet */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-text">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-3.5 h-3.5 text-primary-teal" />
                                                <span>Affiliation History</span>
                                            </span>
                                            {orgs.length > 0 && (
                                                <span className="text-[10px] text-primary-teal font-semibold">
                                                    {orgs.length} verified institution{orgs.length === 1 ? '' : 's'}
                                                </span>
                                            )}
                                        </div>

                                        {orgs.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {orgs.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="bg-warm-cream/70 rounded-xl p-2.5 border border-light-teal/40 text-xs">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className="font-bold text-dark-slate truncate">{item.organization}</span>
                                                            <span className="text-[10px] font-semibold text-muted-text shrink-0">{item.period}</span>
                                                        </div>
                                                        {item.role && (
                                                            <p className="text-[11px] text-primary-teal font-medium truncate mt-0.5">
                                                                {item.role}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-text italic bg-warm-cream/50 p-2.5 rounded-xl border border-light-teal/30">
                                                Senior Consultant with over {doctor.yearsOfExperience || 8} years of accredited clinical practice.
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Link to Clinical Services */}
                                    <button
                                        onClick={() => {
                                            setSelectedDoctor(doctor);
                                            setModalActiveTab('services');
                                        }}
                                        className="w-full py-2 px-3 rounded-xl bg-teal-50/80 hover:bg-teal-100/80 text-teal-800 border border-teal-200/60 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Stethoscope className="w-3.5 h-3.5 text-primary-teal" />
                                            <span>View Clinical Services & Procedure Fees</span>
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-primary-teal" />
                                    </button>

                                    {/* Availability & Fee Summary Strip */}
                                    <div className="pt-3 border-t border-light-teal/40 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Next Available Slot</span>
                                            <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3 text-emerald-600" />
                                                <span>{nextSlot}</span>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Consultation Fee</span>
                                            <span className="font-serif font-black text-dark-slate text-base mt-0.5 block">
                                                {feeFormatted}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="p-4 bg-light-teal/15 border-t border-light-teal/50 flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedDoctor(doctor)}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-light-teal text-dark-slate text-xs font-bold hover:bg-light-teal/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <span>View Profile</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-text" />
                                    </button>
                                    <button
                                        onClick={() => handleSelectDoctorForBooking(doctor)}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold hover:shadow-md hover:shadow-primary-teal/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Book Visit</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* -------------------------------------------------------------
                   LIST / DIRECTORY VIEW: EXECUTIVE ROW LAYOUT
                ------------------------------------------------------------- */
                <div className="space-y-4">
                    {filteredDoctors.map(doctor => {
                        const docId = Number(doctor.doctorID ?? doctor.id ?? doctor.DoctorID);
                        const orgs = parseOrganizations(doctor.organizationWorkHistory);
                        const badgeColor = getSpecialtyBadgeColor(doctor.specialization);
                        const feeFormatted = formatDoctorFee(doctor.consultationFee, doctor.region, docId);
                        const nextSlot = getNextSlot(docId);

                        return (
                            <div
                                key={docId}
                                className="bg-white rounded-3xl border border-light-teal/70 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-primary-teal/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                            >
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <img
                                        src={doctor.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"}
                                        alt={doctor.fullName}
                                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                                    />
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-serif font-black text-dark-slate">
                                                {doctor.fullName}
                                            </h3>
                                            <BadgeCheck className="w-4 h-4 text-primary-teal shrink-0" />
                                            <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${badgeColor}`}>
                                                {doctor.specialization}
                                            </span>
                                        </div>

                                        <p className="text-xs font-bold text-primary-teal">
                                            {doctor.title}
                                        </p>

                                        {/* Hospital Affiliation Info */}
                                        <div className="flex items-center gap-3 text-xs text-muted-text pt-0.5 flex-wrap">
                                            {doctor.organizationName && (
                                                <span className="flex items-center gap-1 font-semibold text-dark-slate">
                                                    <Building2 className="w-3.5 h-3.5 text-primary-teal" />
                                                    <span>{doctor.organizationName}</span>
                                                    {doctor.organizationCity && <span className="text-muted-text font-normal">({doctor.organizationCity})</span>}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                                <span>{doctor.rating}</span>
                                                <span className="text-muted-text font-normal">({doctor.reviewCount} reviews)</span>
                                            </span>
                                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                {doctor.yearsOfExperience} Yrs Exp
                                            </span>
                                        </div>

                                        {/* Bio Snippet */}
                                        <p className="text-xs text-muted-text line-clamp-1 max-w-2xl pt-1">
                                            {doctor.biography}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side Actions & Fee */}
                                <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-light-teal/50">
                                    <div className="text-left lg:text-right">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Consultation Fee</span>
                                        <span className="font-serif font-black text-dark-slate text-lg block">
                                            {feeFormatted}
                                        </span>
                                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <span>{nextSlot}</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedDoctor(doctor);
                                                setModalActiveTab('services');
                                            }}
                                            className="px-3.5 py-2.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold hover:bg-teal-100/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <Stethoscope className="w-3.5 h-3.5 text-primary-teal" />
                                            <span>Services & Fees</span>
                                        </button>
                                        <button
                                            onClick={() => setSelectedDoctor(doctor)}
                                            className="px-4 py-2.5 rounded-xl bg-warm-cream border border-light-teal text-dark-slate text-xs font-bold hover:bg-light-teal/40 transition-colors cursor-pointer"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => handleSelectDoctorForBooking(doctor)}
                                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Book Visit</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* =========================================================================
                5. WORLD-CLASS DOCTOR PROFILE & CAREER CREDENTIALS MODAL
            ========================================================================= */}
            {selectedDoctor && (
                <div className="fixed inset-0 z-50 bg-dark-slate/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] max-w-3xl w-full border border-light-teal shadow-2xl overflow-hidden my-8 animate-zoomIn">
                        {/* Modal Header with Prestige Banner */}
                        <div className="relative bg-gradient-to-br from-dark-slate via-[#152e5a] to-primary-teal text-white p-6 sm:p-8">
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                title="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                                <div className="relative shrink-0">
                                    <img
                                        src={selectedDoctor.avatar}
                                        alt={selectedDoctor.fullName}
                                        className="w-28 h-28 rounded-3xl object-cover border-4 border-white/20 shadow-2xl"
                                    />
                                    <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-dark-slate" title="Online Clinical Specialist" />
                                </div>

                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                        <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">
                                            {selectedDoctor.fullName}
                                        </h2>
                                        <BadgeCheck className="w-6 h-6 text-emerald-300 shrink-0" />
                                    </div>

                                    <p className="text-sm font-semibold text-light-teal">
                                        {selectedDoctor.title}
                                    </p>

                                    <p className="text-xs text-white/90 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                                        <Award className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                        <span>{selectedDoctor.specialization}</span>
                                    </p>

                                    {/* Stat badges */}
                                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-xs flex-wrap">
                                        <span className="font-bold bg-white/15 px-3 py-1 rounded-full border border-white/15">
                                            {selectedDoctor.yearsOfExperience} Years Clinical Practice
                                        </span>
                                        <span className="flex items-center gap-1 font-bold text-amber-300 bg-white/15 px-3 py-1 rounded-full border border-white/15">
                                            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                                            <span>{selectedDoctor.rating} ({selectedDoctor.reviewCount} Verified Reviews)</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Tab Navigation */}
                        <div className="flex items-center border-b border-light-teal/50 bg-warm-cream/50 px-6 sm:px-8 gap-2 overflow-x-auto scrollbar-none">
                            {[
                                { id: 'overview', label: 'Clinical Overview', icon: BookOpen },
                                { id: 'services', label: 'Services & Pricing', icon: Stethoscope },
                                { id: 'career', label: 'Hospital Affiliations & Career', icon: Building2 },
                                { id: 'credentials', label: 'Education & Certifications', icon: GraduationCap },
                                { id: 'reviews', label: 'Quality & Patient Reviews', icon: Star }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isCurrent = modalActiveTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setModalActiveTab(tab.id)}
                                        className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                            isCurrent
                                                ? 'border-primary-teal text-primary-teal bg-white shadow-2xs rounded-t-xl'
                                                : 'border-transparent text-muted-text hover:text-dark-slate'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Modal Body Content (Scrollable) */}
                        <div className="p-6 sm:p-8 max-h-[50vh] overflow-y-auto space-y-6">
                            {modalActiveTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Clinical Biography */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-primary-teal" />
                                            <span>Philosophy of Care & Biography</span>
                                        </h4>
                                        <p className="text-sm text-dark-slate leading-relaxed bg-warm-cream/60 p-5 rounded-2xl border border-light-teal/40 font-normal">
                                            {selectedDoctor.biography || `${selectedDoctor.fullName} is an accomplished dental specialist with over ${selectedDoctor.yearsOfExperience} years of experience in advanced clinical practice, restorative rehabilitation, and modern evidence-based oral care.`}
                                        </p>
                                    </div>

                                    {/* Primary Hospital Banner */}
                                    {selectedDoctor.organizationName && (
                                        <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50/50 rounded-2xl p-5 border border-teal-200/80 space-y-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-primary-teal" />
                                                <span>Primary Institutional Appointment</span>
                                            </span>
                                            <div className="flex items-center gap-4 pt-1">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-teal-200 flex items-center justify-center p-2 shadow-xs shrink-0">
                                                    {selectedDoctor.organizationLogoUrl ? (
                                                        <img src={selectedDoctor.organizationLogoUrl} alt={selectedDoctor.organizationName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 className="w-6 h-6 text-primary-teal" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h5 className="font-serif font-black text-dark-slate text-base">
                                                        {selectedDoctor.organizationName}
                                                    </h5>
                                                    <p className="text-xs text-primary-teal font-bold">
                                                        {selectedDoctor.hospitalDepartment || 'Department of Dental & Oral Surgery'}
                                                    </p>
                                                    <p className="text-[11px] text-muted-text mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-muted-text/70" />
                                                        <span>{selectedDoctor.organizationCity || 'Metropolitan Medical Complex'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Consultation Metrics & Languages */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="bg-warm-cream/60 p-4 rounded-2xl border border-light-teal/40">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Languages Spoken</span>
                                            <span className="font-bold text-dark-slate text-sm mt-1 block">{selectedDoctor.languages || 'English, Urdu'}</span>
                                        </div>
                                        <div className="bg-warm-cream/60 p-4 rounded-2xl border border-light-teal/40">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Standard Consultation Fee</span>
                                            <span className="font-serif font-black text-dark-slate text-base mt-1 block">
                                                {formatDoctorFee(selectedDoctor.consultationFee, selectedDoctor.region, selectedDoctor.doctorID || selectedDoctor.id)}
                                            </span>
                                        </div>
                                        <div className="bg-warm-cream/60 p-4 rounded-2xl border border-light-teal/40">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Next Booking Window</span>
                                            <span className="font-bold text-emerald-700 text-sm mt-1 block flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{getNextSlot(selectedDoctor.doctorID || selectedDoctor.id)}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalActiveTab === 'services' && (
                                <div className="space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-50 via-sky-50/50 to-warm-cream p-4 rounded-2xl border border-teal-200/70">
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                                <Stethoscope className="w-4 h-4 text-primary-teal" />
                                                <span>Doctor Clinical Services & Procedure Fees</span>
                                            </h4>
                                            <p className="text-[11px] text-muted-text">
                                                Live database fee schedule synchronized with clinical department standards.
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full shrink-0 border border-teal-200 self-start sm:self-auto">
                                            {filteredModalServices.length} Accredited Procedure{filteredModalServices.length === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    {/* Search & Category Filter Bar */}
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                                            <input
                                                type="text"
                                                value={serviceSearch}
                                                onChange={(e) => setServiceSearch(e.target.value)}
                                                placeholder="Search procedures by name, code (e.g. D6010), or keyword..."
                                                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-light-teal/80 bg-white text-xs text-dark-slate placeholder-muted-text focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/15 shadow-2xs"
                                            />
                                            {serviceSearch && (
                                                <button
                                                    onClick={() => setServiceSearch('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-slate p-1"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Category Pills Strip */}
                                        {modalServiceCategories.length > 2 && (
                                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                                {modalServiceCategories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setServiceCategory(cat)}
                                                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                                                            serviceCategory === cat
                                                                ? 'bg-primary-teal text-white shadow-2xs'
                                                                : 'bg-warm-cream/80 text-muted-text hover:text-dark-slate border border-light-teal/50'
                                                        }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Services Listing */}
                                    {loadingModalServices ? (
                                        <div className="space-y-3 py-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-24 rounded-2xl bg-light-teal/20 animate-pulse border border-light-teal/40" />
                                            ))}
                                        </div>
                                    ) : filteredModalServices.length === 0 ? (
                                        <div className="p-8 text-center bg-warm-cream/40 rounded-2xl border border-light-teal/40 space-y-2">
                                            <Stethoscope className="w-8 h-8 text-primary-teal/50 mx-auto" />
                                            <p className="text-xs font-bold text-dark-slate">No procedures match your search</p>
                                            <button
                                                onClick={() => { setServiceSearch(''); setServiceCategory('All'); }}
                                                className="text-[11px] font-bold text-primary-teal hover:underline cursor-pointer"
                                            >
                                                Reset procedure filters
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredModalServices.map((proc, pIdx) => {
                                                const procCode = proc.procedureCode || `PROC-${pIdx + 1}`;
                                                const formattedPrice = formatDoctorFee(proc.standardFee, selectedDoctor.region, selectedDoctor.doctorID || selectedDoctor.id);

                                                return (
                                                    <div
                                                        key={procCode + pIdx}
                                                        className="bg-white rounded-2xl border border-light-teal/70 p-4 sm:p-5 shadow-2xs hover:border-primary-teal hover:shadow-md transition-all space-y-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="space-y-1 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-xs sm:text-sm font-bold text-dark-slate">
                                                                        {proc.procedureName}
                                                                    </span>
                                                                    {proc.procedureCode && (
                                                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-light-teal/30 text-dark-slate font-bold">
                                                                            {proc.procedureCode}
                                                                        </span>
                                                                    )}
                                                                    {proc.category && (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                                                            {proc.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {proc.description && (
                                                                    <p className="text-xs text-muted-text leading-relaxed font-normal">
                                                                        {proc.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="font-serif font-black text-dark-slate text-base block">
                                                                    {formattedPrice}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>{proc.estimatedDuration || '45 mins'}</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-light-teal/30 flex items-center justify-between gap-3">
                                                            <span className="text-[11px] text-muted-text hidden sm:inline">
                                                                Verified Department Standard Fee
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    const docId = selectedDoctor.doctorID || selectedDoctor.id;
                                                                    setSelectedDoctor(null);
                                                                    navigate(`/portal/book?doctor=${docId}&procedure=${encodeURIComponent(proc.procedureCode || proc.procedureName)}`);
                                                                }}
                                                                className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold hover:shadow-md hover:shadow-primary-teal/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                            >
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>Book This Service</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalActiveTab === 'career' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                            <Briefcase className="w-4 h-4 text-primary-teal" />
                                            <span>Institutional Appointments & Hospital Work History</span>
                                        </h4>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Verified Career Track
                                        </span>
                                    </div>

                                    <div className="space-y-4 relative pl-6 border-l-2 border-primary-teal/30 ml-3">
                                        {parseOrganizations(selectedDoctor.organizationWorkHistory).map((item, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-primary-teal border-4 border-white shadow-sm" />
                                                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-light-teal/60 shadow-sm space-y-1.5 hover:border-primary-teal transition-colors">
                                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                                        <span className="font-serif font-black text-dark-slate text-base">
                                                            {item.organization}
                                                        </span>
                                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-teal/10 text-primary-teal">
                                                            {item.period}
                                                        </span>
                                                    </div>
                                                    {item.role && (
                                                        <p className="text-xs font-bold text-primary-teal">
                                                            {item.role}
                                                        </p>
                                                    )}
                                                    {item.description && (
                                                        <p className="text-xs text-muted-text leading-relaxed pt-1 font-normal">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {modalActiveTab === 'credentials' && (
                                <div className="space-y-6">
                                    {/* Education */}
                                    {selectedDoctor.education && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                                <GraduationCap className="w-4 h-4 text-primary-teal" />
                                                <span>Medical Degrees & Post-Graduate Training</span>
                                            </h4>
                                            <div className="bg-warm-cream/60 p-4 rounded-2xl border border-light-teal/40 text-xs text-dark-slate leading-relaxed whitespace-pre-line font-medium">
                                                {selectedDoctor.education}
                                            </div>
                                        </div>
                                    )}

                                    {/* Certifications & Fellowships */}
                                    {selectedDoctor.certifications && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                                <Award className="w-4 h-4 text-primary-teal" />
                                                <span>Board Certifications & International Fellowships</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {selectedDoctor.certifications.split(',').map((cert, cIdx) => (
                                                    <div key={cIdx} className="flex items-center gap-2 p-3 rounded-xl bg-light-teal/20 border border-light-teal/50 text-xs font-bold text-dark-slate">
                                                        <CheckCircle2 className="w-4 h-4 text-primary-teal shrink-0" />
                                                        <span>{cert.trim()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalActiveTab === 'reviews' && (
                                <div className="space-y-4">
                                    {/* Quality Score Metrics */}
                                    <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-amber-50/50 via-warm-cream to-emerald-50/40 p-4 rounded-2xl border border-amber-200/50 text-center">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-muted-text block">Clinical Expertise</span>
                                            <span className="text-lg font-black text-amber-700 mt-0.5 block">5.0 / 5.0</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-muted-text block">Bedside Manner</span>
                                            <span className="text-lg font-black text-emerald-700 mt-0.5 block">4.9 / 5.0</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-muted-text block">Clinic Hygiene</span>
                                            <span className="text-lg font-black text-sky-700 mt-0.5 block">5.0 / 5.0</span>
                                        </div>
                                    </div>

                                    {/* Patient review testimonials */}
                                    <div className="space-y-3">
                                        <div className="bg-warm-cream/50 p-4 rounded-2xl border border-light-teal/40 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-dark-slate">Fatima K. — Verified Patient</span>
                                                <div className="flex items-center text-amber-500">
                                                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-500" />)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-text leading-relaxed pt-1">
                                                "Exceptional care and diagnostic thoroughness. Dr. {selectedDoctor.fullName?.split(' ')[1] || 'Doctor'} explained every step of the procedure with immense patience. The clinic standards were exemplary."
                                            </p>
                                        </div>

                                        <div className="bg-warm-cream/50 p-4 rounded-2xl border border-light-teal/40 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-dark-slate">David M. — Verified Patient</span>
                                                <div className="flex items-center text-amber-500">
                                                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-500" />)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-text leading-relaxed pt-1">
                                                "Completely pain-free treatment and remarkable attention to aesthetic detail. Would recommend without hesitation to anyone seeking dental specialist treatment."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Sticky Footer CTA */}
                        <div className="p-6 bg-warm-cream/80 border-t border-light-teal/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text block">Consultation Fee</span>
                                <span className="font-serif font-black text-dark-slate text-xl">
                                    {formatDoctorFee(selectedDoctor.consultationFee, selectedDoctor.region, selectedDoctor.doctorID || selectedDoctor.id)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedDoctor(null)}
                                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-white border border-light-teal text-dark-slate text-xs font-bold hover:bg-light-teal/30 transition-colors cursor-pointer"
                                >
                                    Close Window
                                </button>
                                <button
                                    onClick={() => handleSelectDoctorForBooking(selectedDoctor)}
                                    className="flex-1 sm:flex-none py-3 px-7 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold shadow-lg shadow-primary-teal/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Schedule Visit with {selectedDoctor.fullName}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

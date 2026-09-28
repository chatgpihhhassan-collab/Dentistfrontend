import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../config/apiConfig';
import { 
    safeFetchJson, 
    DEFAULT_CLINIC_DOCTORS, 
    DEFAULT_CLINIC_ORGANIZATIONS 
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
    Briefcase
} from 'lucide-react';

export default function PatientDoctors() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState(DEFAULT_CLINIC_DOCTORS);
    const [organizations, setOrganizations] = useState(DEFAULT_CLINIC_ORGANIZATIONS);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedOrg, setSelectedOrg] = useState('All');
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const specialtiesList = [
        'All',
        'Implantology & Surgery',
        'Orthodontics',
        'Cosmetic & Restorative',
        'Endodontics',
        'General Dental'
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
                `${API_BASE_URL}/api/auth/doctors`,
                'https://dentist-api-dev.vitonta.com/api/patient-portal/doctors',
                'https://dentist-api-dev.vitonta.com/api/auth/doctors',
                '/api/patient-portal/doctors',
                '/api/auth/doctors'
            ];
            const result = await safeFetchJson(endpoints);
            if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
                setDoctors(result.data);
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
                `${API_BASE_URL}/api/organizations`,
                'https://dentist-api-dev.vitonta.com/api/patient-portal/organizations',
                'https://dentist-api-dev.vitonta.com/api/organizations',
                '/api/patient-portal/organizations',
                '/api/organizations'
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
            // If plain text, split lines
            return orgData.split('\n').filter(Boolean).map(line => ({
                organization: line,
                role: 'Clinical Affiliation',
                period: 'Clinical Experience',
                description: ''
            }));
        }
        return [];
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

    const filteredDoctors = doctors.filter(doc => {
        const fullName = (doc.fullName || `Dr. ${doc.firstName} ${doc.lastName}`).toLowerCase();
        const spec = (doc.specialization || '').toLowerCase();
        const bio = (doc.biography || '').toLowerCase();
        const orgs = (typeof doc.organizationWorkHistory === 'string' ? doc.organizationWorkHistory : JSON.stringify(doc.organizationWorkHistory || '')).toLowerCase();
        const orgName = (doc.organizationName || '').toLowerCase();
        const dept = (doc.hospitalDepartment || '').toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesQuery = !searchQuery || 
            fullName.includes(query) || 
            spec.includes(query) || 
            bio.includes(query) || 
            orgs.includes(query) || 
            orgName.includes(query) || 
            dept.includes(query);

        if (!matchesQuery) return false;

        // Organization Filter
        if (selectedOrg !== 'All') {
            const matchOrg = (doc.organizationID && doc.organizationID.toString() === selectedOrg.toString()) ||
                             (doc.organizationName && doc.organizationName.toLowerCase() === selectedOrg.toLowerCase());
            if (!matchOrg) return false;
        }

        // Specialty Filter
        if (selectedSpecialty === 'All') return true;
        if (selectedSpecialty === 'Implantology & Surgery') return spec.includes('implant') || spec.includes('surgeon') || spec.includes('maxillofacial');
        if (selectedSpecialty === 'Orthodontics') return spec.includes('ortho') || spec.includes('aligner') || spec.includes('braces');
        if (selectedSpecialty === 'Cosmetic & Restorative') return spec.includes('cosmetic') || spec.includes('restorative') || spec.includes('prostho');
        if (selectedSpecialty === 'Endodontics') return spec.includes('endodont') || spec.includes('root canal');
        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-slate via-[#193256] to-primary-teal text-white p-8 sm:p-10 shadow-lg shadow-dark-slate/10">
                <div className="relative z-10 max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold tracking-wider uppercase text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Verified Dental Specialists & Hospitals</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight leading-tight">
                        Meet Our Doctors & Hospital Specialists
                    </h1>
                    <p className="text-sm sm:text-base text-light-teal/90 leading-relaxed font-light">
                        Review detailed practitioner career histories, hospital affiliations (e.g. Shifa International, AKUH), verified clinical experience, and patient ratings before booking your consultation.
                    </p>
                </div>

                {/* Search & Filter Bar */}
                <div className="mt-8 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-2 sm:p-3 rounded-2xl flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
                        <input
                            type="text"
                            placeholder="Search doctor, hospital, specialty (e.g. Shifa, AKUH, Implant, Ortho)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                        />
                    </div>

                    {/* Hospital / Organization Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <div className="relative min-w-[210px]">
                            <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none" />
                            <select
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-white/15 border border-white/20 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer appearance-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]"
                            >
                                <option value="All" className="text-dark-slate bg-white font-semibold">🏥 All Hospitals & Clinics</option>
                                {organizations.map(org => (
                                    <option key={org.organizationID} value={org.organizationID} className="text-dark-slate bg-white font-semibold">
                                        {org.name} ({org.city || 'Hospital'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Specialty Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        {specialtiesList.map(item => (
                            <button
                                key={item}
                                onClick={() => setSelectedSpecialty(item)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    selectedSpecialty === item
                                        ? 'bg-white text-dark-slate shadow-sm'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-primary-teal/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Doctors Grid */}
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
                <div className="bg-white rounded-3xl border border-light-teal/60 p-12 text-center max-w-md mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-light-teal/30 text-primary-teal flex items-center justify-center mx-auto">
                        <Stethoscope className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-dark-slate">No Specialists Found</h3>
                    <p className="text-xs text-muted-text">
                        No doctors match your filter criteria "{searchQuery}". Try searching for another name or specialty.
                    </p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); }}
                        className="px-5 py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold hover:bg-primary-hover transition-colors"
                    >
                        Reset Search Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map(doctor => {
                        const orgs = parseOrganizations(doctor.organizationWorkHistory);
                        const isDoctorOnline = doctor.isActive !== false;

                        return (
                            <div
                                key={doctor.id || doctor.doctorID}
                                className="group bg-white rounded-3xl border border-light-teal/60 shadow-[0_4px_20px_rgba(16,36,75,0.03)] hover:shadow-xl hover:border-primary-teal/50 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                            >
                                <div className="p-6 space-y-5">
                                    {/* Top Profile Header */}
                                    <div className="flex items-start gap-4">
                                        <div className="relative">
                                            <img
                                                src={doctor.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"}
                                                alt={doctor.fullName}
                                                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                                            />
                                            {isDoctorOnline && (
                                                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Active Practitioner" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="text-lg font-serif font-bold text-dark-slate truncate">
                                                    {doctor.fullName}
                                                </h3>
                                                <BadgeCheck className="w-4 h-4 text-primary-teal shrink-0" />
                                            </div>
                                            <p className="text-xs font-bold text-primary-teal truncate">
                                                {doctor.title || 'Consultant Dental Surgeon'}
                                            </p>
                                            <p className="text-[11px] font-medium text-muted-text mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-muted-text/70" />
                                                <span>Region: {doctor.region || 'NZ'}</span>
                                            </p>

                                            {/* Rating and Experience */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    <span>{doctor.rating || 4.9}</span>
                                                    <span className="text-amber-600/70 font-normal">({doctor.reviewCount || 28})</span>
                                                </div>
                                                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                                    {doctor.yearsOfExperience || 8} Yrs Exp
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specialization Badge */}
                                    <div className="bg-light-teal/20 rounded-2xl p-3 border border-light-teal/40">
                                        <div className="flex items-center gap-2 text-xs font-bold text-dark-slate">
                                            <Award className="w-4 h-4 text-primary-teal shrink-0" />
                                            <span className="truncate">{doctor.specialization || 'General & Restorative Surgery'}</span>
                                        </div>
                                    </div>

                                    {/* Hospital / Healthcare Organization Badge */}
                                    {doctor.organizationName ? (
                                        <div className="bg-gradient-to-r from-teal-50 to-indigo-50/50 rounded-2xl p-3 border border-teal-200/80">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-white border border-teal-200/80 flex items-center justify-center shrink-0 shadow-xs">
                                                    {doctor.organizationLogoUrl ? (
                                                        <img src={doctor.organizationLogoUrl} alt={doctor.organizationName} className="w-5 h-5 object-contain" />
                                                    ) : (
                                                        <Building2 className="w-4 h-4 text-primary-teal" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-xs text-dark-slate truncate">{doctor.organizationName}</span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 shrink-0">Hospital</span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-text font-medium truncate mt-0.5">
                                                        {doctor.hospitalDepartment ? `${doctor.hospitalDepartment} • ` : ''}{doctor.organizationCity || 'Primary Base'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>Independent Specialist Dental Practice</span>
                                        </div>
                                    )}

                                    {/* Organization / Work History Preview */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-text">
                                            <Building2 className="w-3.5 h-3.5 text-primary-teal" />
                                            <span>Hospital & Clinic Affiliations</span>
                                        </div>
                                        {orgs.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {orgs.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="bg-warm-cream/60 rounded-xl p-2.5 border border-light-teal/30 text-xs">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className="font-bold text-dark-slate truncate">{item.organization}</span>
                                                            <span className="text-[10px] font-semibold text-muted-text shrink-0">{item.period}</span>
                                                        </div>
                                                        {item.role && (
                                                            <div className="text-[11px] text-primary-teal font-medium truncate mt-0.5">
                                                                {item.role}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {orgs.length > 2 && (
                                                    <p className="text-[10px] font-semibold text-muted-text text-right">
                                                        +{orgs.length - 2} more organizational credentials
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-text italic bg-warm-cream/40 p-2.5 rounded-xl border border-light-teal/20">
                                                Senior Consultant with over {doctor.yearsOfExperience || 8} years of accredited institutional service.
                                            </div>
                                        )}
                                    </div>

                                    {/* Consultation Fee */}
                                    <div className="pt-2 flex items-center justify-between border-t border-light-teal/40 text-xs">
                                        <span className="text-muted-text font-medium">Consultation Fee</span>
                                        <span className="font-serif font-bold text-dark-slate text-base">
                                            ${doctor.consultationFee || 150}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 bg-light-teal/15 border-t border-light-teal/40 flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedDoctor(doctor)}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-light-teal text-dark-slate text-xs font-bold hover:bg-light-teal/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                        <span>View Profile</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-text" />
                                    </button>
                                    <button
                                        onClick={() => handleSelectDoctorForBooking(doctor)}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold hover:shadow-md hover:shadow-primary-teal/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Book Visit</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detailed Doctor Career & History Modal */}
            {selectedDoctor && (
                <div className="fixed inset-0 z-50 bg-dark-slate/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full border border-light-teal shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="relative bg-gradient-to-r from-dark-slate to-primary-teal text-white p-6 sm:p-8">
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-start gap-5">
                                <img
                                    src={selectedDoctor.avatar}
                                    alt={selectedDoctor.fullName}
                                    className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-lg shrink-0"
                                />
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-serif font-bold text-white">
                                            {selectedDoctor.fullName}
                                        </h2>
                                        <BadgeCheck className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-light-teal">
                                        {selectedDoctor.title}
                                    </p>
                                    <p className="text-xs text-white/80 flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5 text-emerald-300" />
                                        <span>{selectedDoctor.specialization}</span>
                                    </p>
                                    <div className="flex items-center gap-3 pt-1 text-xs">
                                        <span className="font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                                            {selectedDoctor.yearsOfExperience} Years Clinical Practice
                                        </span>
                                        <span className="flex items-center gap-1 font-bold text-amber-300">
                                            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                                            {selectedDoctor.rating} ({selectedDoctor.reviewCount} Reviews)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            {/* Clinical Biography */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-primary-teal" />
                                    <span>Professional Biography & Philosophy</span>
                                </h4>
                                <p className="text-sm text-dark-slate leading-relaxed font-normal bg-warm-cream/50 p-4 rounded-2xl border border-light-teal/30">
                                    {selectedDoctor.biography || `${selectedDoctor.fullName} is a dedicated dental specialist with over ${selectedDoctor.yearsOfExperience} years of experience in advanced clinical dentistry, patient-focused restorative care, and modern evidence-based procedures.`}
                                </p>
                            </div>

                            {/* Primary Hospital / Healthcare Organization Affiliation */}
                            {selectedDoctor.organizationName && (
                                <div className="bg-gradient-to-br from-teal-50/80 via-white to-indigo-50/40 rounded-2xl p-4 border border-teal-200/80 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-primary-teal" />
                                            <span>Current Hospital & Organization Affiliation</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                            <span>Verified Institutional Center</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 pt-1">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-teal-200 flex items-center justify-center p-2 shadow-xs shrink-0">
                                            {selectedDoctor.organizationLogoUrl ? (
                                                <img src={selectedDoctor.organizationLogoUrl} alt={selectedDoctor.organizationName} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="w-6 h-6 text-primary-teal" />
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-serif font-bold text-dark-slate text-base">
                                                {selectedDoctor.organizationName}
                                            </h5>
                                            <p className="text-xs text-primary-teal font-semibold">
                                                {selectedDoctor.hospitalDepartment || 'Department of Dental & Maxillofacial Surgery'}
                                            </p>
                                            <p className="text-[11px] text-muted-text mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-muted-text/70" />
                                                <span>{selectedDoctor.organizationCity || 'Metropolitan Hospital Campus'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Organization & Hospital Work History Timeline */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4 text-primary-teal" />
                                    <span>Career & Organization History (What Work in What Organization)</span>
                                </h4>

                                <div className="space-y-3 relative pl-4 border-l-2 border-primary-teal/30 ml-2">
                                    {parseOrganizations(selectedDoctor.organizationWorkHistory).map((item, idx) => (
                                        <div key={idx} className="relative group">
                                            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary-teal border-2 border-white shadow-sm" />
                                            <div className="bg-white p-4 rounded-2xl border border-light-teal/50 shadow-sm space-y-1 hover:border-primary-teal transition-colors">
                                                <div className="flex items-center justify-between flex-wrap gap-1">
                                                    <span className="font-bold text-dark-slate text-sm">
                                                        {item.organization}
                                                    </span>
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-light-teal/30 text-primary-teal">
                                                        {item.period}
                                                    </span>
                                                </div>
                                                {item.role && (
                                                    <div className="text-xs font-bold text-primary-teal">
                                                        {item.role}
                                                    </div>
                                                )}
                                                {item.description && (
                                                    <p className="text-xs text-muted-text leading-relaxed pt-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Education & Qualifications */}
                            {selectedDoctor.education && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4 text-primary-teal" />
                                        <span>Education & Academic Credentials</span>
                                    </h4>
                                    <div className="bg-warm-cream/40 p-4 rounded-2xl border border-light-teal/30 text-xs text-dark-slate leading-relaxed whitespace-pre-line font-medium">
                                        {selectedDoctor.education}
                                    </div>
                                </div>
                            )}

                            {/* Certifications & Fellowships */}
                            {selectedDoctor.certifications && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-primary-teal" />
                                        <span>Certifications & Specialized Fellowships</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDoctor.certifications.split(',').map((cert, cIdx) => (
                                            <span key={cIdx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-light-teal/30 border border-light-teal/60 text-xs font-bold text-dark-slate">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary-teal shrink-0" />
                                                <span>{cert.trim()}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Languages & Consultation Details */}
                            <div className="grid grid-cols-2 gap-4 bg-light-teal/15 p-4 rounded-2xl border border-light-teal/40 text-xs">
                                <div>
                                    <span className="text-muted-text font-bold uppercase tracking-wider block text-[10px]">Languages Spoken</span>
                                    <span className="font-semibold text-dark-slate mt-0.5 block">{selectedDoctor.languages || 'English, Urdu'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-text font-bold uppercase tracking-wider block text-[10px]">Consultation Fee</span>
                                    <span className="font-serif font-bold text-dark-slate text-sm mt-0.5 block">${selectedDoctor.consultationFee || 150} / Consultation</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer CTA */}
                        <div className="p-6 bg-warm-cream/60 border-t border-light-teal/40 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="px-5 py-3 rounded-xl bg-white border border-light-teal text-muted-text text-xs font-bold hover:bg-light-teal/30 transition-colors cursor-pointer"
                            >
                                Back to All Doctors
                            </button>
                            <button
                                onClick={() => handleSelectDoctorForBooking(selectedDoctor)}
                                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Select & Book Appointment with {selectedDoctor.fullName}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

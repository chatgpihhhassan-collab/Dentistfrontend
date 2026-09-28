import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { 
    Building2, 
    Plus, 
    Edit, 
    Trash2, 
    Users, 
    MapPin, 
    Globe, 
    Phone, 
    Mail, 
    Award, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle, 
    Search, 
    X, 
    ExternalLink,
    Stethoscope,
    Briefcase,
    Calendar,
    ArrowRight
} from 'lucide-react';

export default function OrganizationManagement() {
    const currentSuperAdmin = JSON.parse(localStorage.getItem('doctor') || '{}');
    const [organizations, setOrganizations] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [editingOrg, setEditingOrg] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewDoctorsOrg, setViewDoctorsOrg] = useState(null);
    const [doctorAssignTab, setDoctorAssignTab] = useState('assign'); // 'assign' | 'register'
    const [assignDoctorForm, setAssignDoctorForm] = useState({
        doctorID: '',
        roleInOrg: 'Attending Specialist',
        department: 'Department of Oral Surgery & Dentistry',
        consultationDays: 'Mon - Fri',
        isPrimary: true
    });
    const [quickNewDoc, setQuickNewDoc] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        specialization: 'General Dental Surgeon',
        title: 'BDS, RDS',
        consultationFee: 120.00,
        hospitalDepartment: 'Department of Oral Surgery & Dentistry'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newOrgForm, setNewOrgForm] = useState({
        name: '',
        slug: '',
        type: 'Hospital',
        address: '',
        city: '',
        country: 'PK',
        phone: '',
        email: '',
        website: '',
        logoUrl: '',
        description: '',
        accreditation: 'JCI Accredited',
        isActive: true,
        initialDoctorIDs: []
    });

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSuperAdmin.token || ''}`
    });

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [orgRes, docRes] = await Promise.all([
                fetch('/api/organizations', { headers: getAuthHeaders() }),
                fetch('/api/auth/doctors', { headers: getAuthHeaders() })
            ]);

            if (orgRes.ok) {
                const orgData = await orgRes.json();
                setOrganizations(orgData);
            }
            if (docRes.ok) {
                const docData = await docRes.json();
                setDoctors(docData);
            }
        } catch (err) {
            setError('Failed to connect to backend server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Create Organization with optional initial doctors
    const handleCreateOrg = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newOrgForm.name.trim()) {
            setError('Organization Name is required.');
            return;
        }

        try {
            const res = await fetch('/api/organizations', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...newOrgForm,
                    slug: newOrgForm.slug || newOrgForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    initialDoctorIDs: newOrgForm.initialDoctorIDs || []
                })
            });

            if (res.ok) {
                setSuccess(`Hospital / Organization "${newOrgForm.name}" created successfully!`);
                setIsAddModalOpen(false);
                setNewOrgForm({
                    name: '',
                    slug: '',
                    type: 'Hospital',
                    address: '',
                    city: '',
                    country: 'PK',
                    phone: '',
                    email: '',
                    website: '',
                    logoUrl: '',
                    description: '',
                    accreditation: 'JCI Accredited',
                    isActive: true,
                    initialDoctorIDs: []
                });
                fetchAllData();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to create organization.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    // Quick Register & Add Doctor directly inside this Organization
    const handleQuickCreateDoctorInOrg = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!quickNewDoc.firstName || !quickNewDoc.lastName || !quickNewDoc.username || !quickNewDoc.password) {
            setError('Please fill in required fields (First Name, Last Name, Username, Password).');
            return;
        }

        try {
            const res = await fetch('/api/auth/doctors', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...quickNewDoc,
                    organizationID: viewDoctorsOrg.organizationID,
                    hospitalDepartment: quickNewDoc.hospitalDepartment || viewDoctorsOrg.name
                })
            });

            if (res.ok) {
                setSuccess(`Dr. ${quickNewDoc.firstName} ${quickNewDoc.lastName} successfully registered and assigned to ${viewDoctorsOrg.name}!`);
                setQuickNewDoc({
                    firstName: '',
                    lastName: '',
                    username: '',
                    password: '',
                    specialization: 'General Dental Surgeon',
                    title: 'BDS, RDS',
                    consultationFee: 120.00,
                    hospitalDepartment: 'Department of Oral Surgery & Dentistry'
                });
                setDoctorAssignTab('assign');
                fetchAllData();
                const updatedOrgRes = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}`, { headers: getAuthHeaders() });
                if (updatedOrgRes.ok) {
                    const updatedOrg = await updatedOrgRes.json();
                    setViewDoctorsOrg(updatedOrg);
                }
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to register doctor.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    // Update Organization
    const handleUpdateOrg = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/organizations/${editingOrg.organizationID}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(editingOrg)
            });

            if (res.ok) {
                setSuccess(`Organization "${editingOrg.name}" updated successfully!`);
                setEditingOrg(null);
                fetchAllData();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to update organization.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    // Toggle Organization Active Status
    const handleToggleStatus = async (org) => {
        try {
            const nextStatus = !org.isActive;
            const res = await fetch(`/api/organizations/${org.organizationID}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: nextStatus })
            });
            if (res.ok) {
                setSuccess(`${org.name} is now ${nextStatus ? 'Active' : 'Inactive'}.`);
                fetchAllData();
            }
        } catch (err) {
            setError('Failed to update organization status.');
        }
    };

    // Assign Doctor to Organization
    const handleAssignDoctor = async (e) => {
        e.preventDefault();
        if (!assignDoctorForm.doctorID) {
            setError('Please select a doctor to assign.');
            return;
        }

        try {
            const res = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}/assign-doctor`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    doctorID: parseInt(assignDoctorForm.doctorID, 10),
                    roleInOrg: assignDoctorForm.roleInOrg,
                    department: assignDoctorForm.department,
                    consultationDays: assignDoctorForm.consultationDays,
                    isPrimary: assignDoctorForm.isPrimary
                })
            });

            if (res.ok) {
                setSuccess('Doctor successfully assigned to this hospital facility!');
                setAssignDoctorForm({
                    doctorID: '',
                    roleInOrg: 'Attending Specialist',
                    department: 'Department of Oral Surgery & Dentistry',
                    consultationDays: 'Mon - Fri',
                    isPrimary: true
                });
                fetchAllData();
                // refresh current view
                const updatedOrgRes = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}`, { headers: getAuthHeaders() });
                if (updatedOrgRes.ok) {
                    const updatedOrg = await updatedOrgRes.json();
                    setViewDoctorsOrg(updatedOrg);
                }
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to assign doctor.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    // Remove Doctor from Organization
    const handleRemoveDoctor = async (doctorId) => {
        try {
            const res = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}/remove-doctor/${doctorId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                setSuccess('Doctor removed from organization.');
                fetchAllData();
                const updatedOrgRes = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}`, { headers: getAuthHeaders() });
                if (updatedOrgRes.ok) {
                    const updatedOrg = await updatedOrgRes.json();
                    setViewDoctorsOrg(updatedOrg);
                }
            } else {
                setError('Failed to remove doctor from organization.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    const filteredOrgs = organizations.filter(org => {
        const matchesQuery = !searchQuery || 
            org.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (org.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (org.accreditation || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (typeFilter === 'All') return matchesQuery;
        return matchesQuery && org.type === typeFilter;
    });

    const totalFacilities = organizations.length;
    const activeFacilities = organizations.filter(o => o.isActive).length;
    const totalAffiliatedDocs = organizations.reduce((acc, o) => acc + (o.doctorCount || 0), 0);

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans pb-24 relative selection:bg-primary-teal/20 selection:text-primary-teal">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-10 space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-light-teal/60 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-teal to-primary-hover flex items-center justify-center text-white shadow-md shadow-primary-teal/25">
                            <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-serif font-bold text-dark-slate tracking-tight">Organization & Hospital Management</h1>
                                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-light-teal text-primary-teal">Superadmin Suite</span>
                            </div>
                            <p className="text-xs text-muted-text mt-1">
                                Manage hospital institutions, dental surgical centers, and associate doctors to their practicing facilities.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setError(''); setSuccess(''); setIsAddModalOpen(true); }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Organization</span>
                    </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Total Facilities</span>
                            <div className="text-2xl font-serif font-black text-dark-slate mt-1">{totalFacilities}</div>
                        </div>
                        <Building2 className="w-8 h-8 text-primary-teal/40" />
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Active Facilities</span>
                            <div className="text-2xl font-serif font-black text-emerald-600 mt-1">{activeFacilities}</div>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Doctors Associated</span>
                            <div className="text-2xl font-serif font-black text-dark-slate mt-1">{totalAffiliatedDocs}</div>
                        </div>
                        <Users className="w-8 h-8 text-amber-500/40" />
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Search & Filter Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-light-teal/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                        <input
                            type="text"
                            placeholder="Search hospitals, city, accreditation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate placeholder:text-muted-text/70 focus:outline-none focus:ring-2 focus:ring-primary-teal/30"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs font-bold text-muted-text">Type:</span>
                        {['All', 'Hospital', 'Dental Clinic', 'Academic Center', 'Surgical Institute'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    typeFilter === type
                                        ? 'bg-primary-teal text-white shadow-sm'
                                        : 'bg-light-teal/30 text-muted-text hover:bg-light-teal/50'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Organizations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {loading ? (
                        [1, 2].map(i => (
                            <div key={i} className="h-64 rounded-3xl bg-white border border-light-teal/60 p-6 animate-pulse" />
                        ))
                    ) : filteredOrgs.length === 0 ? (
                        <div className="col-span-2 bg-white rounded-3xl border border-light-teal/60 p-12 text-center text-xs text-muted-text font-medium">
                            No organizations found matching criteria.
                        </div>
                    ) : (
                        filteredOrgs.map(org => {
                            const isActive = org.isActive !== false;

                            return (
                                <div
                                    key={org.organizationID}
                                    className="bg-white rounded-3xl border border-light-teal/60 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-4">
                                        {/* Top Card Info */}
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={org.logoUrl || "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=200"}
                                                alt={org.name}
                                                className="w-16 h-16 rounded-2xl object-cover border border-light-teal/60 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-serif font-bold text-dark-slate truncate">
                                                        {org.name}
                                                    </h3>
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-light-teal/40 text-primary-teal">
                                                        {org.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-muted-text mt-0.5 flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-primary-teal" />
                                                    <span>{org.address ? `${org.address}, ` : ''}{org.city || 'Auckland'}, {org.country || 'NZ'}</span>
                                                </p>
                                                {org.accreditation && (
                                                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-2">
                                                        <Award className="w-3 h-3" />
                                                        <span>{org.accreditation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-muted-text leading-relaxed line-clamp-2">
                                            {org.description || 'Premier accredited hospital facility supporting outpatient dental clinics and inpatient maxillofacial theaters.'}
                                        </p>

                                        {/* Contact Meta */}
                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-text pt-2 border-t border-light-teal/30">
                                            {org.phone && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Phone className="w-3 h-3 text-primary-teal shrink-0" />
                                                    <span className="truncate">{org.phone}</span>
                                                </div>
                                            )}
                                            {org.email && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Mail className="w-3 h-3 text-primary-teal shrink-0" />
                                                    <span className="truncate">{org.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Doctors Currently in this Organization */}
                                        {(() => {
                                            const orgDocs = doctors.filter(d => d.organizationID === org.organizationID);
                                            return (
                                                <div className="p-3.5 rounded-2xl bg-warm-cream/60 border border-light-teal/50 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-dark-slate uppercase tracking-wider flex items-center gap-1.5">
                                                            <Stethoscope className="w-3.5 h-3.5 text-primary-teal" />
                                                            <span>Doctors in this Organization ({orgDocs.length})</span>
                                                        </span>
                                                        <button
                                                            onClick={async () => {
                                                                const res = await fetch(`/api/organizations/${org.organizationID}`, { headers: getAuthHeaders() });
                                                                if (res.ok) {
                                                                    const fullOrg = await res.json();
                                                                    setViewDoctorsOrg(fullOrg);
                                                                }
                                                            }}
                                                            className="text-[11px] font-bold text-primary-teal hover:underline flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            <span>Manage Roster</span>
                                                        </button>
                                                    </div>

                                                    {orgDocs.length > 0 ? (
                                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                            {orgDocs.slice(0, 3).map(doc => (
                                                                <div key={doc.doctorID} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-light-teal/60 text-xs shadow-2xs">
                                                                    <img
                                                                        src={doc.profileImageUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100"}
                                                                        alt={doc.firstName}
                                                                        className="w-4 h-4 rounded-full object-cover"
                                                                    />
                                                                    <span className="font-bold text-dark-slate text-[11px]">Dr. {doc.firstName} {doc.lastName}</span>
                                                                    <span className="text-[10px] text-muted-text font-normal truncate max-w-[90px]">({doc.specialization ? doc.specialization.split(' ')[0] : 'Dentist'})</span>
                                                                </div>
                                                            ))}
                                                            {orgDocs.length > 3 && (
                                                                <span className="text-[10px] font-bold text-muted-text bg-white px-2 py-1 rounded-xl border border-light-teal/40">
                                                                    +{orgDocs.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] text-muted-text/80 italic flex items-center justify-between pt-0.5">
                                                            <span>No doctors assigned to this facility yet.</span>
                                                            <button
                                                                onClick={async () => {
                                                                    const res = await fetch(`/api/organizations/${org.organizationID}`, { headers: getAuthHeaders() });
                                                                    if (res.ok) {
                                                                        const fullOrg = await res.json();
                                                                        setViewDoctorsOrg(fullOrg);
                                                                    }
                                                                }}
                                                                className="text-[11px] font-bold text-primary-teal hover:underline cursor-pointer"
                                                            >
                                                                + Add Doctor Now
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-4 border-t border-light-teal/40 flex items-center justify-between gap-2">
                                        <button
                                            onClick={async () => {
                                                const res = await fetch(`/api/organizations/${org.organizationID}`, { headers: getAuthHeaders() });
                                                if (res.ok) {
                                                    const fullOrg = await res.json();
                                                    setViewDoctorsOrg(fullOrg);
                                                }
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-light-teal/30 hover:bg-light-teal text-dark-slate text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            <Users className="w-3.5 h-3.5 text-primary-teal" />
                                            <span>Assign / View Doctors ({org.doctorCount || 0})</span>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(org)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                                }`}
                                            >
                                                {isActive ? 'Active' : 'Inactive'}
                                            </button>
                                            <button
                                                onClick={() => setEditingOrg(org)}
                                                className="p-2 rounded-xl bg-light-teal/20 hover:bg-light-teal/50 text-muted-text hover:text-dark-slate transition-colors cursor-pointer"
                                                title="Edit Hospital Details"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* MODAL: VIEW & ASSIGN DOCTORS TO THIS HOSPITAL */}
            {viewDoctorsOrg && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 border border-light-teal">
                        <div className="px-8 py-5 border-b border-light-teal/40 flex items-center justify-between bg-gradient-to-r from-light-teal/30 to-white">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-dark-slate">
                                    Practitioners at {viewDoctorsOrg.name}
                                </h3>
                                <p className="text-xs text-muted-text">
                                    Doctors currently assigned to this hospital / clinic facility.
                                </p>
                            </div>
                            <button
                                onClick={() => setViewDoctorsOrg(null)}
                                className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                            {/* Dual Tab Switch: Assign Existing vs Register New */}
                            <div className="flex border-b border-light-teal/40 bg-light-teal/15 p-1 rounded-2xl gap-1">
                                <button
                                    type="button"
                                    onClick={() => setDoctorAssignTab('assign')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        doctorAssignTab === 'assign'
                                            ? 'bg-white text-dark-slate shadow-xs'
                                            : 'text-muted-text hover:text-dark-slate'
                                    }`}
                                >
                                    Assign Existing Clinician
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDoctorAssignTab('register')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        doctorAssignTab === 'register'
                                            ? 'bg-white text-dark-slate shadow-xs'
                                            : 'text-muted-text hover:text-dark-slate'
                                    }`}
                                >
                                    + Register New Doctor in this Hospital
                                </button>
                            </div>

                            {/* TAB 1: Assign Existing Doctor Form */}
                            {doctorAssignTab === 'assign' && (
                                <form onSubmit={handleAssignDoctor} className="bg-warm-cream/50 p-4 rounded-2xl border border-light-teal/40 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-dark-slate flex items-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>Assign Existing Doctor to {viewDoctorsOrg.name}</span>
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Select Doctor *</label>
                                            <select
                                                value={assignDoctorForm.doctorID}
                                                onChange={e => setAssignDoctorForm({ ...assignDoctorForm, doctorID: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            >
                                                <option value="">-- Choose Clinician --</option>
                                                {doctors.map(d => (
                                                    <option key={d.doctorID} value={d.doctorID}>
                                                        Dr. {d.firstName} {d.lastName} ({d.specialization || 'General'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Clinical Role</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Head of Oral Surgery"
                                                value={assignDoctorForm.roleInOrg}
                                                onChange={e => setAssignDoctorForm({ ...assignDoctorForm, roleInOrg: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Hospital Department</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Division of Orthodontics"
                                                value={assignDoctorForm.department}
                                                onChange={e => setAssignDoctorForm({ ...assignDoctorForm, department: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Consultation Days</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Mon, Wed, Fri"
                                                value={assignDoctorForm.consultationDays}
                                                onChange={e => setAssignDoctorForm({ ...assignDoctorForm, consultationDays: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                                    >
                                        Confirm Doctor Assignment
                                    </button>
                                </form>
                            )}

                            {/* TAB 2: Register New Doctor Form */}
                            {doctorAssignTab === 'register' && (
                                <form onSubmit={handleQuickCreateDoctorInOrg} className="bg-light-teal/20 p-4 rounded-2xl border border-light-teal/50 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-dark-slate flex items-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>Create & Enroll New Doctor into {viewDoctorsOrg.name}</span>
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">First Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Bilal"
                                                value={quickNewDoc.firstName}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, firstName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Last Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Tariq"
                                                value={quickNewDoc.lastName}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, lastName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Username *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. dr.bilal"
                                                value={quickNewDoc.username}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, username: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Temporary Password *</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="Secure password"
                                                value={quickNewDoc.password}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, password: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Specialization</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Oral & Maxillofacial Surgeon"
                                                value={quickNewDoc.specialization}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, specialization: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Department in Hospital</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Department of Oral Surgery"
                                                value={quickNewDoc.hospitalDepartment}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, hospitalDepartment: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-teal to-primary-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                                    >
                                        Register & Add Doctor to {viewDoctorsOrg.name}
                                    </button>
                                </form>
                            )}

                            {/* Current Doctor List */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text">
                                    Currently Associated Clinicians ({viewDoctorsOrg.doctors ? viewDoctorsOrg.doctors.length : 0})
                                </h4>

                                {(!viewDoctorsOrg.doctors || viewDoctorsOrg.doctors.length === 0) ? (
                                    <div className="p-6 text-center text-xs text-muted-text bg-light-teal/10 rounded-2xl">
                                        No doctors are currently assigned to this hospital. Use the form above to add doctors.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-light-teal/30 border border-light-teal/40 rounded-2xl overflow-hidden bg-white">
                                        {viewDoctorsOrg.doctors.map(doc => (
                                            <div key={doc.doctorID} className="p-4 flex items-center justify-between hover:bg-light-teal/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={doc.profileImageUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"}
                                                        alt={doc.firstName}
                                                        className="w-10 h-10 rounded-xl object-cover border border-light-teal"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-dark-slate text-xs">
                                                            Dr. {doc.firstName} {doc.lastName}
                                                        </div>
                                                        <div className="text-[11px] text-primary-teal font-medium">
                                                            {doc.specialization || 'General Specialist'}
                                                        </div>
                                                        <div className="text-[10px] text-muted-text">
                                                            {doc.hospitalDepartment || 'Department of Oral Surgery'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveDoctor(doc.doctorID)}
                                                    className="p-1.5 text-muted-text hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove doctor from this organization"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADD NEW ORGANIZATION */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 border border-light-teal">
                        <div className="px-8 py-5 border-b border-light-teal/40 flex items-center justify-between bg-light-teal/30">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-dark-slate">Register Organization / Hospital</h3>
                                <p className="text-xs text-muted-text">Add a healthcare institution or branch clinic.</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrg} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Organization / Hospital Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Shifa International Hospitals Ltd"
                                    value={newOrgForm.name}
                                    onChange={e => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Facility Type</label>
                                    <select
                                        value={newOrgForm.type}
                                        onChange={e => setNewOrgForm({ ...newOrgForm, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    >
                                        <option value="Hospital">Tertiary Hospital</option>
                                        <option value="Dental Clinic">Specialist Dental Clinic</option>
                                        <option value="Academic Center">Academic Medical Center</option>
                                        <option value="Surgical Institute">Surgical Institute</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Accreditation</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. JCI Accredited"
                                        value={newOrgForm.accreditation}
                                        onChange={e => setNewOrgForm({ ...newOrgForm, accreditation: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">City</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Islamabad"
                                        value={newOrgForm.city}
                                        onChange={e => setNewOrgForm({ ...newOrgForm, city: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Country / Region</label>
                                    <select
                                        value={newOrgForm.country}
                                        onChange={e => setNewOrgForm({ ...newOrgForm, country: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    >
                                        <option value="NZ">New Zealand (NZ)</option>
                                        <option value="PK">Pakistan (PK)</option>
                                        <option value="US">United States (US)</option>
                                        <option value="UK">United Kingdom (UK)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Physical Street Address</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Pitras Bukhari Rd, Sector H-8/4"
                                    value={newOrgForm.address}
                                    onChange={e => setNewOrgForm({ ...newOrgForm, address: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Phone</label>
                                    <input
                                        type="text"
                                        placeholder="+92 51 8463000"
                                        value={newOrgForm.phone}
                                        onChange={e => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Official Email</label>
                                    <input
                                        type="email"
                                        placeholder="info@shifa.com.pk"
                                        value={newOrgForm.email}
                                        onChange={e => setNewOrgForm({ ...newOrgForm, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Logo / Image URL</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={newOrgForm.logoUrl}
                                    onChange={e => setNewOrgForm({ ...newOrgForm, logoUrl: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Facility Description</label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe clinical departments, surgical theaters, and hospital accreditation..."
                                    value={newOrgForm.description}
                                    onChange={e => setNewOrgForm({ ...newOrgForm, description: e.target.value })}
                                    className="w-full p-3 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            {/* Assign Initial Doctors to this Organization */}
                            <div className="space-y-2 bg-light-teal/20 p-4 rounded-2xl border border-light-teal/50">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-dark-slate uppercase flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-primary-teal" />
                                        <span>Assign Doctors to this Organization (Optional)</span>
                                    </label>
                                    <span className="text-[10px] text-primary-teal font-bold px-2 py-0.5 rounded-full bg-white border border-light-teal/50">
                                        {(newOrgForm.initialDoctorIDs || []).length} Selected
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-text">
                                    Select which doctors in your application belong to this hospital or clinic facility upon registration:
                                </p>

                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-light-teal/30 bg-white/70 p-2 rounded-xl border border-light-teal/40">
                                    {doctors.length === 0 ? (
                                        <div className="text-center py-4 text-[11px] text-muted-text">No doctors currently registered in application.</div>
                                    ) : (
                                        doctors.map(doc => {
                                            const isSelected = (newOrgForm.initialDoctorIDs || []).includes(doc.doctorID);
                                            return (
                                                <label
                                                    key={doc.doctorID}
                                                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                                                        isSelected ? 'bg-primary-teal/10 border border-primary-teal/30' : 'hover:bg-light-teal/10'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                const current = newOrgForm.initialDoctorIDs || [];
                                                                const updated = isSelected
                                                                    ? current.filter(id => id !== doc.doctorID)
                                                                    : [...current, doc.doctorID];
                                                                setNewOrgForm({ ...newOrgForm, initialDoctorIDs: updated });
                                                            }}
                                                            className="w-4 h-4 rounded text-primary-teal focus:ring-primary-teal cursor-pointer"
                                                        />
                                                        <div>
                                                            <span className="text-xs font-bold text-dark-slate block">
                                                                Dr. {doc.firstName} {doc.lastName}
                                                            </span>
                                                            <span className="text-[10px] text-muted-text">
                                                                {doc.specialization || 'General Surgeon'} • {doc.organizationName ? `Current: ${doc.organizationName}` : 'Independent'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            Will Assign
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-light-teal/40">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl bg-light-teal/30 hover:bg-light-teal text-muted-text text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                                >
                                    Save Organization
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT ORGANIZATION */}
            {editingOrg && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 border border-light-teal">
                        <div className="px-8 py-5 border-b border-light-teal/40 flex items-center justify-between bg-light-teal/30">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-dark-slate">Edit {editingOrg.name}</h3>
                                <p className="text-xs text-muted-text">Update hospital or clinic details.</p>
                            </div>
                            <button
                                onClick={() => setEditingOrg(null)}
                                className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateOrg} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Organization Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingOrg.name}
                                    onChange={e => setEditingOrg({ ...editingOrg, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Facility Type</label>
                                    <select
                                        value={editingOrg.type}
                                        onChange={e => setEditingOrg({ ...editingOrg, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    >
                                        <option value="Hospital">Tertiary Hospital</option>
                                        <option value="Dental Clinic">Specialist Dental Clinic</option>
                                        <option value="Academic Center">Academic Medical Center</option>
                                        <option value="Surgical Institute">Surgical Institute</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Accreditation</label>
                                    <input
                                        type="text"
                                        value={editingOrg.accreditation || ''}
                                        onChange={e => setEditingOrg({ ...editingOrg, accreditation: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">City</label>
                                    <input
                                        type="text"
                                        value={editingOrg.city || ''}
                                        onChange={e => setEditingOrg({ ...editingOrg, city: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Country</label>
                                    <input
                                        type="text"
                                        value={editingOrg.country || 'NZ'}
                                        onChange={e => setEditingOrg({ ...editingOrg, country: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Address</label>
                                <input
                                    type="text"
                                    value={editingOrg.address || ''}
                                    onChange={e => setEditingOrg({ ...editingOrg, address: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Logo URL</label>
                                <input
                                    type="text"
                                    value={editingOrg.logoUrl || ''}
                                    onChange={e => setEditingOrg({ ...editingOrg, logoUrl: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Description</label>
                                <textarea
                                    rows="3"
                                    value={editingOrg.description || ''}
                                    onChange={e => setEditingOrg({ ...editingOrg, description: e.target.value })}
                                    className="w-full p-3 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-light-teal/40">
                                <button
                                    type="button"
                                    onClick={() => setEditingOrg(null)}
                                    className="px-6 py-2.5 rounded-xl bg-light-teal/30 hover:bg-light-teal text-muted-text text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

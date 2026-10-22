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
    ArrowRight,
    AlertTriangle,
    Check
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
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

    // ORG-003: Accreditation defaults to empty string, NOT pre-filled JCI Accredited
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
        accreditation: '',
        isActive: true,
        initialDoctorIDs: []
    });

    // DATA-004: Auto-dismiss alerts after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (modalError) {
            const timer = setTimeout(() => setModalError(''), 6000);
            return () => clearTimeout(timer);
        }
    }, [modalError]);

    useEffect(() => {
        if (modalSuccess) {
            const timer = setTimeout(() => setModalSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [modalSuccess]);

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

        const trimmedName = newOrgForm.name.trim();
        if (!trimmedName) {
            setError('Organization Name is required.');
            return;
        }

        if (newOrgForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrgForm.email.trim())) {
            setError('Please provide a valid official email address.');
            return;
        }

        try {
            const res = await fetch('/api/organizations', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...newOrgForm,
                    name: trimmedName,
                    slug: newOrgForm.slug.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    address: (newOrgForm.address || '').trim(),
                    city: (newOrgForm.city || '').trim(),
                    phone: (newOrgForm.phone || '').trim(),
                    email: (newOrgForm.email || '').trim(),
                    accreditation: (newOrgForm.accreditation || '').trim(),
                    initialDoctorIDs: newOrgForm.initialDoctorIDs || []
                })
            });

            if (res.ok) {
                setSuccess(`Hospital / Organization "${trimmedName}" created successfully!`);
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
                    accreditation: '',
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
        setModalError('');
        setModalSuccess('');

        const firstName = quickNewDoc.firstName.trim();
        const lastName = quickNewDoc.lastName.trim();
        const username = quickNewDoc.username.trim().toLowerCase();
        const password = quickNewDoc.password;

        if (!firstName || !lastName || !username || !password) {
            setModalError('Please fill in all required fields (First Name, Last Name, Username, Password).');
            return;
        }

        // VAL-004 Username format validation
        if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
            setModalError('Username must be 3-30 characters with letters, numbers, dots, hyphens, or underscores only.');
            return;
        }

        // VAL-005 Strong Password validation
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);
        if (password.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSymbol) {
            setModalError('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.');
            return;
        }

        try {
            const res = await fetch('/api/auth/doctors', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...quickNewDoc,
                    firstName,
                    lastName,
                    username,
                    organizationID: viewDoctorsOrg.organizationID,
                    hospitalDepartment: quickNewDoc.hospitalDepartment || viewDoctorsOrg.name
                })
            });

            if (res.ok) {
                setModalSuccess(`Dr. ${firstName} ${lastName} successfully registered and assigned to ${viewDoctorsOrg.name}!`);
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
                setModalError(data.message || 'Failed to register doctor.');
            }
        } catch (err) {
            setModalError('Server connection error.');
        }
    };

    // ORG-002: Update Organization with Phone & Email fields
    const handleUpdateOrg = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const trimmedName = editingOrg.name.trim();
        if (!trimmedName) {
            setError('Organization Name is required.');
            return;
        }

        if (editingOrg.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingOrg.email.trim())) {
            setError('Please provide a valid official email address.');
            return;
        }

        try {
            const res = await fetch(`/api/organizations/${editingOrg.organizationID}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...editingOrg,
                    name: trimmedName,
                    address: (editingOrg.address || '').trim(),
                    city: (editingOrg.city || '').trim(),
                    phone: (editingOrg.phone || '').trim(),
                    email: (editingOrg.email || '').trim(),
                    accreditation: (editingOrg.accreditation || '').trim(),
                    description: (editingOrg.description || '').trim(),
                    logoUrl: (editingOrg.logoUrl || '').trim()
                })
            });

            if (res.ok) {
                setSuccess(`Organization "${trimmedName}" updated successfully!`);
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

    // DATA-004: Toggle Organization Active Status with Confirmation Dialog
    const confirmToggleStatus = (org) => {
        const nextStatus = !org.isActive;
        const actionWord = nextStatus ? 'activate' : 'deactivate';
        setConfirmDialog({
            isOpen: true,
            title: `${actionWord.toUpperCase()} Facility`,
            message: `Are you sure you want to ${actionWord} "${org.name}"? ${!nextStatus ? 'Deactivated facilities will not accept new appointments or display on the main portal.' : ''}`,
            onConfirm: () => executeToggleStatus(org, nextStatus)
        });
    };

    const executeToggleStatus = async (org, nextStatus) => {
        try {
            const res = await fetch(`/api/organizations/${org.organizationID}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: nextStatus })
            });
            if (res.ok) {
                setSuccess(`${org.name} is now ${nextStatus ? 'Active' : 'Inactive'}.`);
                fetchAllData();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to update organization status.');
            }
        } catch (err) {
            setError('Failed to update organization status.');
        }
    };

    // ORG-004: Assign Doctor to Organization with duplicate check & structured validation
    const handleAssignDoctor = async (e) => {
        e.preventDefault();
        setModalError('');
        setModalSuccess('');

        if (!assignDoctorForm.doctorID) {
            setModalError('Please select a doctor to assign.');
            return;
        }

        const selectedDocId = parseInt(assignDoctorForm.doctorID, 10);
        const existingDocs = viewDoctorsOrg.doctors || [];
        if (existingDocs.some(d => d.doctorID === selectedDocId)) {
            setModalError('This doctor is already affiliated with this healthcare facility.');
            return;
        }

        if (!assignDoctorForm.roleInOrg || !assignDoctorForm.roleInOrg.trim()) {
            setModalError('Please specify the clinician clinical role.');
            return;
        }

        if (!assignDoctorForm.consultationDays || !assignDoctorForm.consultationDays.trim()) {
            setModalError('Please specify the consultation days.');
            return;
        }

        try {
            const res = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}/assign-doctor`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    doctorID: selectedDocId,
                    roleInOrg: assignDoctorForm.roleInOrg.trim(),
                    department: (assignDoctorForm.department || '').trim(),
                    consultationDays: assignDoctorForm.consultationDays.trim(),
                    isPrimary: assignDoctorForm.isPrimary
                })
            });

            if (res.ok) {
                setModalSuccess('Doctor successfully assigned to this hospital facility!');
                setAssignDoctorForm({
                    doctorID: '',
                    roleInOrg: 'Attending Specialist',
                    department: 'Department of Oral Surgery & Dentistry',
                    consultationDays: 'Mon - Fri',
                    isPrimary: true
                });
                fetchAllData();
                const updatedOrgRes = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}`, { headers: getAuthHeaders() });
                if (updatedOrgRes.ok) {
                    const updatedOrg = await updatedOrgRes.json();
                    setViewDoctorsOrg(updatedOrg);
                }
            } else {
                const data = await res.json().catch(() => ({}));
                setModalError(data.message || 'Failed to assign doctor.');
            }
        } catch (err) {
            setModalError('Server connection error.');
        }
    };

    // DATA-004: Confirmation before removing doctor from organization
    const confirmRemoveDoctor = (doc) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Remove Doctor from Facility',
            message: `Are you sure you want to remove Dr. ${doc.firstName} ${doc.lastName} from ${viewDoctorsOrg.name}? The doctor will remain in the system as an independent clinician.`,
            onConfirm: () => executeRemoveDoctor(doc.doctorID)
        });
    };

    const executeRemoveDoctor = async (doctorId) => {
        try {
            const res = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}/remove-doctor/${doctorId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                setModalSuccess('Doctor successfully removed from organization roster.');
                fetchAllData();
                const updatedOrgRes = await fetch(`/api/organizations/${viewDoctorsOrg.organizationID}`, { headers: getAuthHeaders() });
                if (updatedOrgRes.ok) {
                    const updatedOrg = await updatedOrgRes.json();
                    setViewDoctorsOrg(updatedOrg);
                }
            } else {
                setModalError('Failed to remove doctor from organization.');
            }
        } catch (err) {
            setModalError('Server connection error.');
        }
    };

    // DATA-001 & DATA-002: Filter doctors (exclude Receptionists) and trim search queries
    const clinicalDoctors = doctors.filter(d => (d.role || '').toLowerCase() !== 'receptionist');

    const trimmedQuery = searchQuery.trim().toLowerCase();
    const filteredOrgs = organizations.filter(org => {
        const matchesQuery = !trimmedQuery || 
            (org.name || '').toLowerCase().includes(trimmedQuery) || 
            (org.city || '').toLowerCase().includes(trimmedQuery) ||
            (org.accreditation || '').toLowerCase().includes(trimmedQuery) ||
            (org.phone || '').toLowerCase().includes(trimmedQuery) ||
            (org.email || '').toLowerCase().includes(trimmedQuery);

        if (typeFilter === 'All') return matchesQuery;
        return matchesQuery && org.type === typeFilter;
    });

    const totalFacilities = organizations.length;
    const activeFacilities = organizations.filter(o => o.isActive !== false).length;
    const totalAffiliatedDocs = organizations.reduce((acc, o) => acc + (o.doctorCount || 0), 0);

    // Filter available doctors for the assignment modal (exclude already assigned & receptionists)
    const assignedDocIds = (viewDoctorsOrg?.doctors || []).map(d => d.doctorID);
    const unassignedClinicians = clinicalDoctors.filter(d => !assignedDocIds.includes(d.doctorID));

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
                                Manage hospital institutions, dental surgical centers, and associate verified doctors to practicing facilities.
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

                {/* Alerts with DATA-004 dismiss buttons */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg text-red-500 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                            <span>{success}</span>
                        </div>
                        <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
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
                                                    <span>{org.address ? `${org.address}, ` : ''}{org.city || 'Islamabad'}, {org.country || 'PK'}</span>
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

                                        {/* Doctors Currently in this Organization (DATA-001: filter receptionists) */}
                                        {(() => {
                                            const orgDocs = clinicalDoctors.filter(d => d.organizationID === org.organizationID);
                                            return (
                                                <div className="p-3.5 rounded-2xl bg-warm-cream/60 border border-light-teal/50 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-dark-slate uppercase tracking-wider flex items-center gap-1.5">
                                                            <Stethoscope className="w-3.5 h-3.5 text-primary-teal" />
                                                            <span>Doctors in this Organization ({orgDocs.length})</span>
                                                        </span>
                                                        <button
                                                            onClick={async () => {
                                                                setModalError('');
                                                                setModalSuccess('');
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
                                                            {orgDocs.slice(0, 3).map(doc => {
                                                                const cleanFirst = doc.firstName ? doc.firstName.replace(/^Dr\.?\s*/i, '') : '';
                                                                return (
                                                                    <div key={doc.doctorID} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-light-teal/60 text-xs shadow-2xs">
                                                                        <img
                                                                            src={doc.profileImageUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100"}
                                                                            alt={cleanFirst}
                                                                            className="w-4 h-4 rounded-full object-cover"
                                                                        />
                                                                        <span className="font-bold text-dark-slate text-[11px]">Dr. {cleanFirst} {doc.lastName}</span>
                                                                        <span className="text-[10px] text-muted-text font-normal truncate max-w-[90px]">({doc.specialization ? doc.specialization.split(' ')[0] : 'Dentist'})</span>
                                                                    </div>
                                                                );
                                                            })}
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
                                                                    setModalError('');
                                                                    setModalSuccess('');
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
                                                setModalError('');
                                                setModalSuccess('');
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
                                                onClick={() => confirmToggleStatus(org)}
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

            {/* CONFIRMATION DIALOG (DATA-004) */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-light-teal space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-dark-slate">{confirmDialog.title}</h3>
                        </div>
                        <p className="text-xs text-muted-text leading-relaxed">{confirmDialog.message}</p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-text hover:bg-light-teal/30 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-teal hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                        {/* Modal-specific error/success banner */}
                        {modalError && (
                            <div className="mx-8 mt-4 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-bold flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                                <button onClick={() => setModalError('')} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        {modalSuccess && (
                            <div className="mx-8 mt-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>{modalSuccess}</span>
                                </div>
                                <button onClick={() => setModalSuccess('')} className="p-1 hover:bg-emerald-100 rounded text-emerald-500 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

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
                                                disabled={unassignedClinicians.length === 0}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal disabled:opacity-60"
                                            >
                                                {unassignedClinicians.length === 0 ? (
                                                    <option value="">All registered doctors are already assigned</option>
                                                ) : (
                                                    <>
                                                        <option value="">-- Choose Clinician ({unassignedClinicians.length} available) --</option>
                                                        {unassignedClinicians.map(d => {
                                                            const cleanFirst = d.firstName ? d.firstName.replace(/^Dr\.?\s*/i, '') : '';
                                                            return (
                                                                <option key={d.doctorID} value={d.doctorID}>
                                                                    Dr. {cleanFirst} {d.lastName} ({d.specialization || 'General'})
                                                                </option>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Clinical Role</label>
                                            <input
                                                type="text"
                                                maxLength={100}
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
                                                maxLength={100}
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
                                                maxLength={100}
                                                placeholder="e.g. Mon, Wed, Fri"
                                                value={assignDoctorForm.consultationDays}
                                                onChange={e => setAssignDoctorForm({ ...assignDoctorForm, consultationDays: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                            {/* Structured Days Presets */}
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {['Mon - Fri', 'Mon - Sat', 'Mon, Wed, Fri', 'Tue, Thu, Sat', 'All Week'].map(preset => (
                                                    <button
                                                        type="button"
                                                        key={preset}
                                                        onClick={() => setAssignDoctorForm({ ...assignDoctorForm, consultationDays: preset })}
                                                        className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                                                            assignDoctorForm.consultationDays === preset
                                                                ? 'bg-primary-teal text-white'
                                                                : 'bg-light-teal/30 text-muted-text hover:bg-light-teal/60'
                                                        }`}
                                                    >
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={unassignedClinicians.length === 0}
                                        className="w-full py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                maxLength={50}
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
                                                maxLength={50}
                                                placeholder="e.g. Tariq"
                                                value={quickNewDoc.lastName}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, lastName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Username * (3-30 chars, no spaces)</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={30}
                                                placeholder="e.g. dr.bilal"
                                                value={quickNewDoc.username}
                                                onChange={e => setQuickNewDoc({ ...quickNewDoc, username: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-1 focus:ring-primary-teal font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-text uppercase">Temporary Password * (min 8 chars)</label>
                                            <input
                                                type="password"
                                                required
                                                maxLength={50}
                                                placeholder="Uppercase, lowercase, digit, symbol"
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
                                                maxLength={100}
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
                                                maxLength={100}
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
                                        {viewDoctorsOrg.doctors.map(doc => {
                                            const cleanFirst = doc.firstName ? doc.firstName.replace(/^Dr\.?\s*/i, '') : '';
                                            return (
                                                <div key={doc.doctorID} className="p-4 flex items-center justify-between hover:bg-light-teal/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={doc.profileImageUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"}
                                                            alt={cleanFirst}
                                                            className="w-10 h-10 rounded-xl object-cover border border-light-teal"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-dark-slate text-xs">
                                                                Dr. {cleanFirst} {doc.lastName}
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
                                                        onClick={() => confirmRemoveDoctor(doc)}
                                                        className="p-1.5 text-muted-text hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Remove doctor from this organization"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADD NEW ORGANIZATION (ORG-003, VAL-003) */}
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
                                    maxLength={100}
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
                                    <label className="text-xs font-bold text-muted-text uppercase">Accreditation (Optional)</label>
                                    <input
                                        type="text"
                                        maxLength={100}
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
                                        maxLength={50}
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
                                        <option value="PK">Pakistan (PK)</option>
                                        <option value="NZ">New Zealand (NZ)</option>
                                        <option value="US">United States (US)</option>
                                        <option value="UK">United Kingdom (UK)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Physical Street Address</label>
                                <input
                                    type="text"
                                    maxLength={200}
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
                                        type="tel"
                                        maxLength={50}
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
                                        maxLength={100}
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
                                    maxLength={500}
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
                                    maxLength={1000}
                                    placeholder="Describe clinical departments, surgical theaters, and hospital accreditation..."
                                    value={newOrgForm.description}
                                    onChange={e => setNewOrgForm({ ...newOrgForm, description: e.target.value })}
                                    className="w-full p-3 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            {/* Assign Initial Doctors to this Organization (DATA-001: Exclude receptionists) */}
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
                                    {clinicalDoctors.length === 0 ? (
                                        <div className="text-center py-4 text-[11px] text-muted-text">No doctors currently registered in application.</div>
                                    ) : (
                                        clinicalDoctors.map(doc => {
                                            const isSelected = (newOrgForm.initialDoctorIDs || []).includes(doc.doctorID);
                                            const cleanFirst = doc.firstName ? doc.firstName.replace(/^Dr\.?\s*/i, '') : '';
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
                                                                Dr. {cleanFirst} {doc.lastName}
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

            {/* MODAL: EDIT ORGANIZATION (ORG-002: Phone & Email fields added) */}
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
                                    maxLength={100}
                                    value={editingOrg.name || ''}
                                    onChange={e => setEditingOrg({ ...editingOrg, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Facility Type</label>
                                    <select
                                        value={editingOrg.type || 'Hospital'}
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
                                        maxLength={100}
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
                                        maxLength={50}
                                        value={editingOrg.city || ''}
                                        onChange={e => setEditingOrg({ ...editingOrg, city: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Country</label>
                                    <input
                                        type="text"
                                        maxLength={50}
                                        value={editingOrg.country || 'PK'}
                                        onChange={e => setEditingOrg({ ...editingOrg, country: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Address</label>
                                <input
                                    type="text"
                                    maxLength={200}
                                    value={editingOrg.address || ''}
                                    onChange={e => setEditingOrg({ ...editingOrg, address: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            {/* ORG-002: Phone & Email inputs added */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Phone</label>
                                    <input
                                        type="tel"
                                        maxLength={50}
                                        placeholder="+92 51 8463000"
                                        value={editingOrg.phone || ''}
                                        onChange={e => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Official Email</label>
                                    <input
                                        type="email"
                                        maxLength={100}
                                        placeholder="info@hospital.org"
                                        value={editingOrg.email || ''}
                                        onChange={e => setEditingOrg({ ...editingOrg, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Logo URL</label>
                                <input
                                    type="text"
                                    maxLength={500}
                                    value={editingOrg.logoUrl || ''}
                                    onChange={e => setEditingOrg({ ...editingOrg, logoUrl: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Description</label>
                                <textarea
                                    rows="3"
                                    maxLength={1000}
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

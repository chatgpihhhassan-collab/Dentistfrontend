import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { 
    ShieldCheck, 
    User, 
    MapPin, 
    Key, 
    Edit, 
    Save, 
    X, 
    Plus, 
    Building2, 
    Briefcase, 
    GraduationCap, 
    Award, 
    DollarSign, 
    Image as ImageIcon, 
    Trash2, 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    Users, 
    Star, 
    Clock, 
    ToggleLeft, 
    ToggleRight,
    Sparkles,
    Eye,
    ArrowRight
} from 'lucide-react';

export default function DoctorManagement() {
    const navigate = useNavigate();
    const currentSuperAdmin = JSON.parse(localStorage.getItem('doctor') || '{}');
    const [doctors, setDoctors] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
    const [passwordModalDoctor, setPasswordModalDoctor] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [orgFilter, setOrgFilter] = useState('All');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editActiveTab, setEditActiveTab] = useState('profile'); // 'profile' | 'experience' | 'organizations' | 'education'

    // Form state for creating a new doctor
    const [newDocForm, setNewDocForm] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        region: 'NZ',
        specialization: 'General Dental Surgeon',
        title: 'BDS, RDS',
        yearsOfExperience: 5,
        consultationFee: 120.00,
        languages: 'English, Urdu',
        organizationID: '',
        hospitalDepartment: 'Department of Oral Surgery & Dentistry',
        initialOrganization: '',
        initialRole: '',
        profileImageUrl: ''
    });

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSuperAdmin.token || ''}`
    });

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [docRes, orgRes] = await Promise.all([
                fetch('/api/auth/doctors', { headers: getAuthHeaders() }),
                fetch('/api/organizations', { headers: getAuthHeaders() })
            ]);

            if (docRes.ok) {
                const docData = await docRes.json();
                setDoctors(docData);
            }
            if (orgRes.ok) {
                const orgData = await orgRes.json();
                setOrganizations(orgData);
            }
        } catch (err) {
            setError('Failed to connect to backend service.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Safe JSON parser for organizations array
    const parseOrgs = (orgData) => {
        if (!orgData) return [];
        if (Array.isArray(orgData)) return orgData;
        try {
            const parsed = JSON.parse(orgData);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            return orgData.split('\n').filter(Boolean).map(line => ({
                organization: line,
                role: 'Attending Clinician',
                period: 'Current / Past',
                description: ''
            }));
        }
        return [];
    };

    // Open Edit Modal and parse organizations into editable array
    const handleStartEdit = (doc) => {
        setError('');
        setSuccess('');
        const orgArray = parseOrgs(doc.organizationWorkHistory);
        setEditingDoctor({
            ...doc,
            yearsOfExperience: doc.yearsOfExperience || 5,
            consultationFee: doc.consultationFee || 100.00,
            specialization: doc.specialization || 'General Dental Surgeon',
            title: doc.title || 'BDS, RDS',
            languages: doc.languages || 'English, Urdu',
            biography: doc.biography || '',
            education: doc.education || '',
            certifications: doc.certifications || '',
            profileImageUrl: doc.profileImageUrl || '',
            organizationID: doc.organizationID ? String(doc.organizationID) : '',
            hospitalDepartment: doc.hospitalDepartment || 'Department of Oral Surgery & Dentistry',
            isActive: doc.isActive !== false,
            organizations: orgArray.length > 0 ? orgArray : [
                { organization: '', role: '', period: '', description: '' }
            ]
        });
        setEditActiveTab('profile');
    };

    // Add empty organization row to editing doctor
    const handleAddOrganizationRow = () => {
        if (!editingDoctor) return;
        setEditingDoctor({
            ...editingDoctor,
            organizations: [
                ...editingDoctor.organizations,
                { organization: '', role: '', period: '', description: '' }
            ]
        });
    };

    // Update single organization field
    const handleOrganizationChange = (index, field, value) => {
        const updated = [...editingDoctor.organizations];
        updated[index][field] = value;
        setEditingDoctor({ ...editingDoctor, organizations: updated });
    };

    // Remove single organization row
    const handleRemoveOrganizationRow = (index) => {
        const updated = editingDoctor.organizations.filter((_, i) => i !== index);
        setEditingDoctor({ ...editingDoctor, organizations: updated });
    };

    // Save edited doctor profile
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const validOrgs = (editingDoctor.organizations || []).filter(o => o.organization.trim());
            const orgHistoryJson = JSON.stringify(validOrgs);

            const payload = {
                firstName: editingDoctor.firstName,
                lastName: editingDoctor.lastName,
                region: editingDoctor.region,
                specialization: editingDoctor.specialization,
                title: editingDoctor.title,
                yearsOfExperience: parseInt(editingDoctor.yearsOfExperience, 10) || 1,
                biography: editingDoctor.biography,
                organizationWorkHistory: orgHistoryJson,
                education: editingDoctor.education,
                certifications: editingDoctor.certifications,
                consultationFee: parseFloat(editingDoctor.consultationFee) || 100.00,
                profileImageUrl: editingDoctor.profileImageUrl,
                languages: editingDoctor.languages,
                rating: editingDoctor.rating || 4.90,
                reviewCount: editingDoctor.reviewCount || 25,
                isActive: editingDoctor.isActive !== false,
                organizationID: editingDoctor.organizationID ? parseInt(editingDoctor.organizationID, 10) : null,
                hospitalDepartment: editingDoctor.hospitalDepartment
            };

            const res = await fetch(`/api/auth/doctors/${editingDoctor.doctorID}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(`Dr. ${editingDoctor.firstName} ${editingDoctor.lastName}'s profile & hospital affiliation updated successfully!`);
                setEditingDoctor(null);
                fetchAllData();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || 'Failed to update doctor details.');
            }
        } catch (err) {
            setError('Server connection error while saving profile.');
        }
    };

    // Handle Create Doctor Submission
    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newDocForm.username || !newDocForm.password || !newDocForm.firstName || !newDocForm.lastName) {
            setError('Please fill in all required fields (Username, Password, First Name, Last Name).');
            return;
        }

        try {
            const orgList = [];
            if (newDocForm.initialOrganization.trim()) {
                orgList.push({
                    organization: newDocForm.initialOrganization.trim(),
                    role: newDocForm.initialRole.trim() || 'Attending Surgeon',
                    period: 'Present',
                    description: 'Primary clinical institution'
                });
            }

            const payload = {
                username: newDocForm.username.trim(),
                password: newDocForm.password.trim(),
                firstName: newDocForm.firstName.trim(),
                lastName: newDocForm.lastName.trim(),
                region: newDocForm.region || 'NZ',
                specialization: newDocForm.specialization,
                title: newDocForm.title,
                yearsOfExperience: parseInt(newDocForm.yearsOfExperience, 10) || 5,
                biography: `${newDocForm.title} specialized in ${newDocForm.specialization} with over ${newDocForm.yearsOfExperience} years of institutional practice.`,
                organizationWorkHistory: JSON.stringify(orgList),
                consultationFee: parseFloat(newDocForm.consultationFee) || 120.00,
                languages: newDocForm.languages,
                profileImageUrl: newDocForm.profileImageUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
                isActive: true,
                organizationID: newDocForm.organizationID ? parseInt(newDocForm.organizationID, 10) : null,
                hospitalDepartment: newDocForm.hospitalDepartment || 'Department of Oral Surgery & Dentistry'
            };

            const res = await fetch('/api/auth/doctors', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(`Doctor Dr. ${newDocForm.firstName} ${newDocForm.lastName} created successfully!`);
                setIsAddDoctorOpen(false);
                setNewDocForm({
                    username: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    region: 'NZ',
                    specialization: 'General Dental Surgeon',
                    title: 'BDS, RDS',
                    yearsOfExperience: 5,
                    consultationFee: 120.00,
                    languages: 'English, Urdu',
                    organizationID: '',
                    hospitalDepartment: 'Department of Oral Surgery & Dentistry',
                    initialOrganization: '',
                    initialRole: '',
                    profileImageUrl: ''
                });
                fetchAllData();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to create doctor profile.');
            }
        } catch (err) {
            setError('Server connection error while creating doctor.');
        }
    };

    // Toggle active status
    const handleToggleStatus = async (doctor) => {
        try {
            const nextStatus = doctor.isActive === false ? true : false;
            const res = await fetch(`/api/auth/doctors/${doctor.doctorID}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: nextStatus })
            });
            if (res.ok) {
                setSuccess(`Dr. ${doctor.firstName} ${doctor.lastName} is now ${nextStatus ? 'Active' : 'Inactive'}.`);
                fetchAllData();
            } else {
                setError('Failed to update status.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    // Password Update
    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!newPassword.trim()) {
            setError('Password cannot be empty.');
            return;
        }
        try {
            const res = await fetch(`/api/auth/doctors/${passwordModalDoctor.doctorID}/password`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ password: newPassword.trim() })
            });
            if (res.ok) {
                setSuccess(`Password for Dr. ${passwordModalDoctor.firstName} updated successfully!`);
                setPasswordModalDoctor(null);
                setNewPassword('');
            } else {
                setError('Failed to update password.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        const fullName = `${doc.firstName} ${doc.lastName} ${doc.username} ${doc.specialization || ''} ${doc.organizationName || ''}`.toLowerCase();
        const matchesQuery = !searchQuery || fullName.includes(searchQuery.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === 'Active') matchesStatus = doc.isActive !== false;
        if (statusFilter === 'Inactive') matchesStatus = doc.isActive === false;

        let matchesOrg = true;
        if (orgFilter !== 'All') {
            matchesOrg = doc.organizationID && String(doc.organizationID) === String(orgFilter);
        }

        return matchesQuery && matchesStatus && matchesOrg;
    });

    const activeCount = doctors.filter(d => d.isActive !== false && !d.isSuperAdmin).length;
    const avgExp = doctors.length > 0 
        ? Math.round(doctors.reduce((sum, d) => sum + (d.yearsOfExperience || 5), 0) / doctors.length) 
        : 0;

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans pb-24 relative selection:bg-primary-teal/20 selection:text-primary-teal">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-10 space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-light-teal/60 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-teal to-primary-hover flex items-center justify-center text-white shadow-md shadow-primary-teal/25">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-serif font-bold text-dark-slate tracking-tight">Superadmin Doctor Management</h1>
                                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-light-teal text-primary-teal">Role Protected</span>
                            </div>
                            <p className="text-xs text-muted-text mt-1">
                                Assign doctors to hospital institutions, manage experience, credentials, and organization affiliations.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin/organizations')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-light-teal text-dark-slate text-xs font-bold hover:bg-light-teal/30 transition-colors shadow-sm cursor-pointer"
                        >
                            <Building2 className="w-4 h-4 text-primary-teal" />
                            <span>Hospitals ({organizations.length})</span>
                        </button>
                        <button
                            onClick={() => { setError(''); setSuccess(''); setIsAddDoctorOpen(true); }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Doctor</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Total Clinicians</span>
                            <div className="text-2xl font-serif font-black text-dark-slate mt-1">{doctors.length}</div>
                        </div>
                        <Users className="w-8 h-8 text-primary-teal/40" />
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Active in Portal</span>
                            <div className="text-2xl font-serif font-black text-emerald-600 mt-1">{activeCount}</div>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Avg Experience</span>
                            <div className="text-2xl font-serif font-black text-dark-slate mt-1">{avgExp} Years</div>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500/40" />
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-light-teal/50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">Hospitals Enrolled</span>
                            <div className="text-2xl font-serif font-black text-primary-teal mt-1">{organizations.length}</div>
                        </div>
                        <Building2 className="w-8 h-8 text-primary-teal/40" />
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
                <div className="bg-white p-4 rounded-2xl border border-light-teal/60 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                        <input
                            type="text"
                            placeholder="Search doctors, username, hospital..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate placeholder:text-muted-text/70 focus:outline-none focus:ring-2 focus:ring-primary-teal/30"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
                        {/* Hospital Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-muted-text">Hospital:</span>
                            <select
                                value={orgFilter}
                                onChange={e => setOrgFilter(e.target.value)}
                                className="px-3 py-1.5 bg-light-teal/30 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                            >
                                <option value="All">All Hospitals</option>
                                {organizations.map(o => (
                                    <option key={o.organizationID} value={o.organizationID}>{o.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-muted-text">Status:</span>
                            {['All', 'Active', 'Inactive'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-primary-teal text-white shadow-sm'
                                            : 'bg-light-teal/30 text-muted-text hover:bg-light-teal/50'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Doctors Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-light-teal/60 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-light-teal/30 border-b border-light-teal/50">
                                <th className="py-4 px-6 font-bold text-muted-text uppercase tracking-wider text-xs">Practitioner</th>
                                <th className="py-4 px-6 font-bold text-muted-text uppercase tracking-wider text-xs">Specialty & Title</th>
                                <th className="py-4 px-6 font-bold text-muted-text uppercase tracking-wider text-xs">Hospital Affiliation</th>
                                <th className="py-4 px-6 font-bold text-muted-text uppercase tracking-wider text-xs">Experience & Fee</th>
                                <th className="py-4 px-6 font-bold text-muted-text uppercase tracking-wider text-xs">Portal Status</th>
                                <th className="py-4 px-6 font-bold text-muted-text uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-teal/30">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-xs text-muted-text">Loading doctors directory...</td>
                                </tr>
                            ) : filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-xs text-muted-text font-medium">No matching doctors found.</td>
                                </tr>
                            ) : (
                                filteredDoctors.map(doc => {
                                    const isActive = doc.isActive !== false;

                                    return (
                                        <tr key={doc.doctorID} className="hover:bg-light-teal/10 transition-colors">
                                            {/* Practitioner Name & Avatar */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={doc.profileImageUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"}
                                                        alt={doc.firstName}
                                                        className="w-11 h-11 rounded-xl object-cover border border-light-teal/60 shrink-0"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-1.5 font-bold text-dark-slate text-sm">
                                                            <span>Dr. {doc.firstName} {doc.lastName}</span>
                                                            {doc.isSuperAdmin && (
                                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">ADMIN</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-text font-mono">
                                                            @{doc.username} • {doc.region || 'NZ'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Specialty & Title */}
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-dark-slate text-xs">{doc.specialization || 'General Dental Surgeon'}</div>
                                                <div className="text-[11px] text-primary-teal font-medium mt-0.5">{doc.title || 'BDS, RDS'}</div>
                                            </td>

                                            {/* Hospital Affiliation Badge */}
                                            <td className="py-4 px-6">
                                                {doc.organizationName ? (
                                                    <div className="space-y-1">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-light-teal/30 text-dark-slate text-xs font-bold border border-light-teal/60">
                                                            <Building2 className="w-3.5 h-3.5 text-primary-teal shrink-0" />
                                                            <span className="truncate max-w-[170px]">{doc.organizationName}</span>
                                                        </div>
                                                        {doc.hospitalDepartment && (
                                                            <div className="text-[10px] text-muted-text font-medium truncate max-w-[170px]">
                                                                {doc.hospitalDepartment}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-text/60 italic">No hospital assigned</span>
                                                )}
                                            </td>

                                            {/* Experience & Fee */}
                                            <td className="py-4 px-6">
                                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                                    <Award className="w-3.5 h-3.5" />
                                                    <span>{doc.yearsOfExperience || 5} Yrs</span>
                                                </div>
                                                <div className="text-[11px] text-muted-text font-bold mt-1">
                                                    ${doc.consultationFee || 100} / visit
                                                </div>
                                            </td>

                                            {/* Portal Status */}
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => handleToggleStatus(doc)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                                            : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                                                    }`}
                                                    title="Click to toggle active status"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                                                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStartEdit(doc)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-light-teal/30 hover:bg-light-teal text-dark-slate transition-colors cursor-pointer"
                                                        title="Edit complete profile, experience & hospital affiliation"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 text-primary-teal" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setPasswordModalDoctor(doc)}
                                                        className="p-2 rounded-xl bg-light-teal/20 hover:bg-light-teal/50 text-muted-text hover:text-dark-slate transition-colors cursor-pointer"
                                                        title="Change Password"
                                                    >
                                                        <Key className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* EDIT DOCTOR PROFILE & HOSPITAL MODAL */}
            {editingDoctor && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 border border-light-teal">
                        <div className="px-8 py-5 border-b border-light-teal/40 flex items-center justify-between bg-gradient-to-r from-light-teal/30 to-white">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-dark-slate">
                                    Edit Practitioner — Dr. {editingDoctor.firstName} {editingDoctor.lastName}
                                </h3>
                                <p className="text-xs text-muted-text">
                                    Assign hospital facility, update clinical credentials, and career history.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingDoctor(null)}
                                className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-light-teal/40 px-8 bg-warm-cream/30 gap-6">
                            {[
                                { id: 'profile', label: 'Basic & Hospital Affiliation', icon: User },
                                { id: 'organizations', label: 'Career Timeline', icon: Building2 },
                                { id: 'education', label: 'Degrees & Fellowships', icon: GraduationCap }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setEditActiveTab(tab.id)}
                                    className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                                        editActiveTab === tab.id
                                            ? 'border-primary-teal text-primary-teal'
                                            : 'border-transparent text-muted-text hover:text-dark-slate'
                                    }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSaveProfile} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                            {/* TAB 1: BASIC & HOSPITAL AFFILIATION */}
                            {editActiveTab === 'profile' && (
                                <div className="space-y-4">
                                    {/* Hospital Affiliation Selector */}
                                    <div className="p-4 rounded-2xl bg-light-teal/20 border border-light-teal/60 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-primary-teal" />
                                            <span className="text-xs font-bold text-dark-slate uppercase tracking-wider">Hospital / Organization Assignment</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-muted-text uppercase">Belongs to Organization (Hospital) *</label>
                                                <select
                                                    value={editingDoctor.organizationID}
                                                    onChange={e => setEditingDoctor({ ...editingDoctor, organizationID: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 bg-white border border-light-teal/60 rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                                >
                                                    <option value="">-- No Hospital Linked --</option>
                                                    {organizations.map(org => (
                                                        <option key={org.organizationID} value={org.organizationID}>
                                                            {org.name} ({org.city || 'Central'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-muted-text uppercase">Hospital Department</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Division of Oral & Maxillofacial Surgery"
                                                    value={editingDoctor.hospitalDepartment}
                                                    onChange={e => setEditingDoctor({ ...editingDoctor, hospitalDepartment: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={editingDoctor.firstName}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, firstName: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Last Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={editingDoctor.lastName}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, lastName: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Specialization</label>
                                            <input
                                                type="text"
                                                value={editingDoctor.specialization}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Degree Credentials Title</label>
                                            <input
                                                type="text"
                                                value={editingDoctor.title}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, title: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Years Experience</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editingDoctor.yearsOfExperience}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, yearsOfExperience: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Consultation Fee ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editingDoctor.consultationFee}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, consultationFee: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Region</label>
                                            <select
                                                value={editingDoctor.region}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, region: e.target.value })}
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
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Profile Image URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            value={editingDoctor.profileImageUrl}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, profileImageUrl: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Professional Biography</label>
                                        <textarea
                                            rows="4"
                                            value={editingDoctor.biography}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, biography: e.target.value })}
                                            className="w-full p-4 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal leading-relaxed"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: ORGANIZATIONS & CAREER TIMELINE */}
                            {editActiveTab === 'organizations' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                                Career History (What Work in What Hospital)
                                            </h4>
                                            <p className="text-[11px] text-muted-text">
                                                Patients can see which organizations this doctor has served and in what role.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddOrganizationRow}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-teal text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Affiliation</span>
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {editingDoctor.organizations.map((org, index) => (
                                            <div key={index} className="p-4 rounded-2xl bg-warm-cream/60 border border-light-teal/50 space-y-3 relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOrganizationRow(index)}
                                                    className="absolute top-3 right-3 p-1.5 text-muted-text hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Hospital / Organization</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Shifa International Hospital"
                                                            value={org.organization}
                                                            onChange={e => handleOrganizationChange(index, 'organization', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Role / Clinical Designation</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Head of Oral Surgery"
                                                            value={org.role}
                                                            onChange={e => handleOrganizationChange(index, 'role', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Period / Duration</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. 2018 - Present"
                                                            value={org.period}
                                                            onChange={e => handleOrganizationChange(index, 'period', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Department / Notes</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Advanced surgical navigation"
                                                            value={org.description}
                                                            onChange={e => handleOrganizationChange(index, 'description', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: EDUCATION & CREDENTIALS */}
                            {editActiveTab === 'education' && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Education Degrees & Universities</label>
                                        <textarea
                                            rows="3"
                                            value={editingDoctor.education}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, education: e.target.value })}
                                            className="w-full p-4 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Certifications & Fellowships (Comma-separated)</label>
                                        <textarea
                                            rows="3"
                                            value={editingDoctor.certifications}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, certifications: e.target.value })}
                                            className="w-full p-4 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Languages</label>
                                        <input
                                            type="text"
                                            value={editingDoctor.languages}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, languages: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Controls */}
                            <div className="pt-4 border-t border-light-teal/40 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setEditingDoctor(null)}
                                    className="px-6 py-2.5 rounded-xl bg-light-teal/30 hover:bg-light-teal text-muted-text text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                                >
                                    Save Changes & Sync to Portal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD NEW DOCTOR MODAL */}
            {isAddDoctorOpen && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 border border-light-teal">
                        <div className="px-8 py-5 border-b border-light-teal/40 flex items-center justify-between bg-light-teal/30">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-dark-slate">Register New Doctor</h3>
                                <p className="text-xs text-muted-text">Create doctor account and assign to a healthcare organization.</p>
                            </div>
                            <button
                                onClick={() => setIsAddDoctorOpen(false)}
                                className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDoctor} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Hospital Assignment Selection */}
                            <div className="space-y-1 bg-light-teal/20 p-3 rounded-2xl border border-light-teal/50">
                                <label className="text-xs font-bold text-dark-slate uppercase flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-primary-teal" />
                                    <span>Hospital / Organization Affiliation</span>
                                </label>
                                <select
                                    value={newDocForm.organizationID}
                                    onChange={e => setNewDocForm({ ...newDocForm, organizationID: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-bold text-dark-slate focus:outline-none"
                                >
                                    <option value="">-- Choose Hospital --</option>
                                    {organizations.map(o => (
                                        <option key={o.organizationID} value={o.organizationID}>{o.name} ({o.city || 'Central'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Emily"
                                        value={newDocForm.firstName}
                                        onChange={e => setNewDocForm({ ...newDocForm, firstName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Watson"
                                        value={newDocForm.lastName}
                                        onChange={e => setNewDocForm({ ...newDocForm, lastName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Username *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. dr.emily"
                                        value={newDocForm.username}
                                        onChange={e => setNewDocForm({ ...newDocForm, username: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Initial Password *</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Temporary password"
                                        value={newDocForm.password}
                                        onChange={e => setNewDocForm({ ...newDocForm, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Specialization</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Pediatric Dentist"
                                        value={newDocForm.specialization}
                                        onChange={e => setNewDocForm({ ...newDocForm, specialization: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Years Experience</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newDocForm.yearsOfExperience}
                                        onChange={e => setNewDocForm({ ...newDocForm, yearsOfExperience: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Consultation Fee ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newDocForm.consultationFee}
                                        onChange={e => setNewDocForm({ ...newDocForm, consultationFee: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Practice Region</label>
                                    <select
                                        value={newDocForm.region}
                                        onChange={e => setNewDocForm({ ...newDocForm, region: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    >
                                        <option value="NZ">New Zealand (NZ)</option>
                                        <option value="PK">Pakistan (PK)</option>
                                        <option value="US">United States (US)</option>
                                        <option value="UK">United Kingdom (UK)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-light-teal/40">
                                <button
                                    type="button"
                                    onClick={() => setIsAddDoctorOpen(false)}
                                    className="px-6 py-2.5 rounded-xl bg-light-teal/30 hover:bg-light-teal text-muted-text text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                                >
                                    Create Doctor Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CHANGE PASSWORD MODAL */}
            {passwordModalDoctor && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-light-teal p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-serif font-bold text-dark-slate">
                                Update Password for Dr. {passwordModalDoctor.firstName}
                            </h3>
                            <button
                                onClick={() => setPasswordModalDoctor(null)}
                                className="p-1.5 text-muted-text hover:text-dark-slate rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePassword} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">New Secure Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModalDoctor(null)}
                                    className="px-4 py-2 rounded-xl bg-light-teal/30 text-muted-text text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary-teal text-white text-xs font-bold shadow-sm hover:bg-primary-hover cursor-pointer"
                                >
                                    Save Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

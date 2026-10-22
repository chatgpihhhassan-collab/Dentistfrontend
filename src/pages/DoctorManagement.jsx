import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    EyeOff,
    Lock,
    Check,
    Loader2,
    ArrowRight,
    ShieldAlert
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export default function DoctorManagement() {
    const navigate = useNavigate();
    const currentSuperAdmin = JSON.parse(localStorage.getItem('doctor') || '{}');
    const [doctors, setDoctors] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
    const [statusConfirmDoctor, setStatusConfirmDoctor] = useState(null);
    const [passwordModalDoctor, setPasswordModalDoctor] = useState(null);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordModalError, setPasswordModalError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [orgFilter, setOrgFilter] = useState('All');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editActiveTab, setEditActiveTab] = useState('profile'); // 'profile' | 'experience' | 'organizations' | 'education' | 'clinic'

    // Form state for creating a new doctor (DOC-005, VAL-005)
    const [newDocForm, setNewDocForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        region: 'PK',
        specialization: 'General Dental Surgeon',
        title: '',
        yearsOfExperience: 5,
        consultationFee: 100.00,
        languages: 'English, Urdu',
        organizationID: '',
        hospitalDepartment: '',
        initialOrganization: '',
        initialRole: '',
        profileImageUrl: '',
        phone: '',
        email: '',
        clinicName: '',
        clinicOperatingHours: '',
        isClinicOpenManualOverride: null
    });

    // Auto-dismiss alert notifications (DATA-004)
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 6000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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
                period: '2020 - Present',
                description: ''
            }));
        }
        return [];
    };

    // Helper to get start and end year from period string (VAL-010)
    const getPeriodParts = (periodStr) => {
        if (!periodStr) return { start: '2020', end: 'Present' };
        const parts = String(periodStr).split('-').map(s => s.trim());
        return {
            start: parts[0] || '2020',
            end: parts[1] || 'Present'
        };
    };

    // Open Edit Modal and parse organizations into editable array (VAL-008, DOC-005)
    const handleStartEdit = (doc) => {
        setError('');
        setSuccess('');
        const orgArray = parseOrgs(doc.organizationWorkHistory);
        setEditingDoctor({
            ...doc,
            yearsOfExperience: doc.yearsOfExperience !== undefined && doc.yearsOfExperience !== null ? doc.yearsOfExperience : 0,
            consultationFee: doc.consultationFee !== undefined && doc.consultationFee !== null ? doc.consultationFee : '',
            specialization: doc.specialization || '',
            title: doc.title || '',
            languages: doc.languages || '',
            biography: doc.biography || '',
            education: doc.education || '',
            certifications: doc.certifications || '',
            profileImageUrl: doc.profileImageUrl || '',
            organizationID: doc.organizationID ? String(doc.organizationID) : '',
            hospitalDepartment: doc.hospitalDepartment || '',
            phone: doc.phone || '',
            email: doc.email || '',
            clinicName: doc.clinicName || '',
            clinicOperatingHours: doc.clinicOperatingHours || '',
            isClinicOpenManualOverride: doc.isClinicOpenManualOverride !== undefined ? doc.isClinicOpenManualOverride : null,
            isActive: doc.isActive !== false,
            organizations: orgArray.length > 0 ? orgArray : [
                { organization: '', role: '', period: '2020 - Present', description: '' }
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
                { organization: '', role: '', period: '2020 - Present', description: '' }
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

    // Save edited doctor profile with strict validation (VAL-001, VAL-002, VAL-003, VAL-006, VAL-007, VAL-008, VAL-009, VAL-010, DOC-004)
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const cleanFirst = (editingDoctor.firstName || '').trim();
        const cleanLast = (editingDoctor.lastName || '').trim();

        if (!cleanFirst) {
            setError('First Name is required and cannot be empty or whitespace only.');
            return;
        }
        if (!cleanLast) {
            setError('Last Name is required and cannot be empty or whitespace only.');
            return;
        }
        if (cleanFirst.length > 50 || cleanLast.length > 50) {
            setError('First and Last names cannot exceed 50 characters.');
            return;
        }
        if (!/^[a-zA-Z\s.'-]{1,50}$/.test(cleanFirst) || !/^[a-zA-Z\s.'-]{1,50}$/.test(cleanLast)) {
            setError('Names can only contain letters, spaces, hyphens, dots, and apostrophes.');
            return;
        }

        if (editingDoctor.consultationFee === '' || editingDoctor.consultationFee === null || editingDoctor.consultationFee === undefined) {
            setError('Consultation fee is required. Enter 0 for free consultation.');
            return;
        }
        const feeNum = parseFloat(editingDoctor.consultationFee);
        if (isNaN(feeNum) || feeNum < 0) {
            setError('Consultation fee cannot be negative.');
            return;
        }
        if (feeNum > 10000) {
            setError('Consultation fee cannot exceed 10,000.');
            return;
        }

        const expNum = parseInt(editingDoctor.yearsOfExperience, 10);
        if (isNaN(expNum) || expNum < 0 || expNum > 70) {
            setError('Years of experience must be between 0 and 70 years.');
            return;
        }

        if (editingDoctor.profileImageUrl && editingDoctor.profileImageUrl.trim()) {
            const url = editingDoctor.profileImageUrl.trim();
            if (url.length > 500) {
                setError('Profile Image URL cannot exceed 500 characters.');
                return;
            }
            if (!/^https?:\/\//i.test(url)) {
                setError('Profile Image URL must be a valid HTTP or HTTPS address.');
                return;
            }
        }

        if (editingDoctor.phone && editingDoctor.phone.trim()) {
            const phone = editingDoctor.phone.trim();
            if (phone.length > 50) {
                setError('Phone number cannot exceed 50 characters.');
                return;
            }
            if (!/^(\+?[0-9\s\-().]{7,25})$/.test(phone)) {
                setError('Clinic phone must be a valid telephone format.');
                return;
            }
        }

        if (editingDoctor.email && editingDoctor.email.trim()) {
            const email = editingDoctor.email.trim();
            if (email.length > 100) {
                setError('Email cannot exceed 100 characters.');
                return;
            }
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                setError('Please enter a valid clinic email address.');
                return;
            }
        }

        // Validate career timeline periods (VAL-010)
        for (let i = 0; i < (editingDoctor.organizations || []).length; i++) {
            const row = editingDoctor.organizations[i];
            if (row.organization && row.organization.trim()) {
                if (row.period && row.period.trim()) {
                    const parts = row.period.split('-').map(s => s.trim());
                    if (parts.length === 2) {
                        const start = parseInt(parts[0], 10);
                        const end = parts[1].toLowerCase() === 'present' ? 9999 : parseInt(parts[1], 10);
                        if (!isNaN(start) && !isNaN(end) && end < start) {
                            setError(`Career Timeline row ${i + 1}: End year (${parts[1]}) cannot be earlier than start year (${parts[0]}).`);
                            return;
                        }
                    }
                }
            }
        }

        try {
            const validOrgs = (editingDoctor.organizations || []).filter(o => o.organization && o.organization.trim());
            const orgHistoryJson = JSON.stringify(validOrgs);

            const payload = {
                firstName: cleanFirst,
                lastName: cleanLast,
                region: editingDoctor.region,
                specialization: (editingDoctor.specialization || '').trim(),
                title: (editingDoctor.title || '').trim(),
                yearsOfExperience: expNum,
                biography: editingDoctor.biography || '',
                organizationWorkHistory: orgHistoryJson,
                education: editingDoctor.education || '',
                certifications: editingDoctor.certifications || '',
                consultationFee: feeNum,
                profileImageUrl: (editingDoctor.profileImageUrl || '').trim(),
                languages: (editingDoctor.languages || '').trim(),
                isActive: editingDoctor.isActive !== false,
                organizationID: editingDoctor.organizationID ? parseInt(editingDoctor.organizationID, 10) : null,
                hospitalDepartment: (editingDoctor.hospitalDepartment || '').trim(),
                phone: (editingDoctor.phone || '').trim(),
                email: (editingDoctor.email || '').trim(),
                clinicName: (editingDoctor.clinicName || '').trim(),
                clinicOperatingHours: (editingDoctor.clinicOperatingHours || '').trim(),
                isClinicOpenManualOverride: editingDoctor.isClinicOpenManualOverride
            };

            const res = await fetch(`/api/auth/doctors/${editingDoctor.doctorID}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(`Dr. ${cleanFirst} ${cleanLast}'s profile & details updated successfully!`);
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

    // Handle Create Doctor Submission (VAL-001, VAL-002, VAL-003, VAL-004, VAL-005, VAL-006, VAL-007)
    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const cleanFirst = (newDocForm.firstName || '').trim();
        const cleanLast = (newDocForm.lastName || '').trim();
        const cleanUsername = (newDocForm.username || '').trim();
        const cleanPassword = newDocForm.password || '';
        const cleanConfirm = newDocForm.confirmPassword || '';

        if (!cleanUsername || !cleanPassword || !cleanFirst || !cleanLast) {
            setError('Please fill in all required fields (Username, Password, First Name, Last Name).');
            return;
        }

        if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
            setError('Username must be 3-30 characters and can only contain letters, numbers, dots, dashes, and underscores (no spaces or special symbols).');
            return;
        }

        if (cleanPassword.length < 8 ||
            !/[A-Z]/.test(cleanPassword) ||
            !/[a-z]/.test(cleanPassword) ||
            !/[0-9]/.test(cleanPassword) ||
            !/[!@#$%^&*()_+\-=\[\]{};':",.<>?/\\|`~]/.test(cleanPassword)) {
            setError('Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character.');
            return;
        }

        if (cleanPassword !== cleanConfirm) {
            setError('Initial password and confirmation password do not match.');
            return;
        }

        if (cleanFirst.length > 50 || cleanLast.length > 50) {
            setError('First and Last names cannot exceed 50 characters.');
            return;
        }

        if (!/^[a-zA-Z\s.'-]{1,50}$/.test(cleanFirst) || !/^[a-zA-Z\s.'-]{1,50}$/.test(cleanLast)) {
            setError('Names can only contain letters, spaces, hyphens, and apostrophes.');
            return;
        }

        const expNum = parseInt(newDocForm.yearsOfExperience, 10);
        if (isNaN(expNum) || expNum < 0 || expNum > 70) {
            setError('Years of experience must be between 0 and 70.');
            return;
        }

        const feeNum = parseFloat(newDocForm.consultationFee);
        if (isNaN(feeNum) || feeNum < 0) {
            setError('Consultation fee cannot be negative.');
            return;
        }
        if (feeNum > 10000) {
            setError('Consultation fee cannot exceed 10,000.');
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
                username: cleanUsername,
                password: cleanPassword,
                firstName: cleanFirst,
                lastName: cleanLast,
                region: newDocForm.region || 'PK',
                specialization: (newDocForm.specialization || '').trim(),
                title: (newDocForm.title || '').trim(),
                yearsOfExperience: expNum,
                biography: `${cleanFirst} ${cleanLast} specialized in ${newDocForm.specialization || 'Dentistry'} with over ${expNum} years of clinical practice.`,
                organizationWorkHistory: JSON.stringify(orgList),
                consultationFee: feeNum,
                languages: (newDocForm.languages || '').trim(),
                profileImageUrl: (newDocForm.profileImageUrl || '').trim(),
                isActive: true,
                organizationID: newDocForm.organizationID ? parseInt(newDocForm.organizationID, 10) : null,
                hospitalDepartment: (newDocForm.hospitalDepartment || '').trim(),
                phone: (newDocForm.phone || '').trim(),
                email: (newDocForm.email || '').trim(),
                clinicName: (newDocForm.clinicName || '').trim(),
                clinicOperatingHours: (newDocForm.clinicOperatingHours || '').trim(),
                isClinicOpenManualOverride: newDocForm.isClinicOpenManualOverride
            };

            const res = await fetch('/api/auth/doctors', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(`Doctor Dr. ${cleanFirst} ${cleanLast} created successfully!`);
                setIsAddDoctorOpen(false);
                setNewDocForm({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                    region: 'PK',
                    specialization: 'General Dental Surgeon',
                    title: '',
                    yearsOfExperience: 5,
                    consultationFee: 100.00,
                    languages: 'English, Urdu',
                    organizationID: '',
                    hospitalDepartment: '',
                    initialOrganization: '',
                    initialRole: '',
                    profileImageUrl: '',
                    phone: '',
                    email: '',
                    clinicName: '',
                    clinicOperatingHours: '',
                    isClinicOpenManualOverride: null
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

    // Toggle active status with confirmation prompt (DATA-004)
    const handleToggleStatus = async (doctor) => {
        try {
            const nextStatus = doctor.isActive === false ? true : false;
            const res = await fetch(`/api/auth/doctors/${doctor.doctorID}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive: nextStatus })
            });
            if (res.ok) {
                const docName = (doctor.firstName || '') + ' ' + (doctor.lastName || '');
                setSuccess(`Dr. ${docName.trim()} is now ${nextStatus ? 'Active' : 'Inactive'}.`);
                fetchAllData();
            } else {
                setError('Failed to update status.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    // Password Modal Open Handler
    const handleOpenPasswordModal = (doc) => {
        setPasswordModalDoctor(doc);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setPasswordModalError('');
    };

    // Quick Generator: Compliant Strong Password
    const handleGenerateStrongPassword = () => {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghijkmnopqrstuvwxyz';
        const numbers = '23456789';
        const symbols = '!@#$%&*';
        
        const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
        const generated = `Dental#${rand(uppercase)}${rand(numbers)}${rand(symbols)}${rand(numbers)}${rand(lowercase)}`;
        setNewPassword(generated);
        setConfirmPassword(generated);
        setPasswordModalError('');
    };

    // Live Password Policy Validation Engine (VAL-005)
    const passwordPolicy = {
        minLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':",.<>?/\\|`~]/.test(newPassword),
        noWhitespace: !newPassword.startsWith(' ') && !newPassword.endsWith(' ') && !newPassword.includes(' '),
        matches: newPassword.length > 0 && newPassword === confirmPassword
    };

    const getStrengthScore = () => {
        let score = 0;
        if (passwordPolicy.minLength) score++;
        if (passwordPolicy.hasUpper && passwordPolicy.hasLower) score++;
        if (passwordPolicy.hasNumber) score++;
        if (passwordPolicy.hasSpecial) score++;
        if (passwordPolicy.noWhitespace) score++;
        return score; // 0 to 5
    };

    // Password Update with Old Password Verification & Strong Policy (VAL-005)
    const handleSavePassword = async (e) => {
        if (e) e.preventDefault();
        setPasswordModalError('');

        if (!newPassword) {
            setPasswordModalError('New password cannot be empty.');
            return;
        }

        if (newPassword.startsWith(' ') || newPassword.endsWith(' ')) {
            setPasswordModalError('Password cannot contain leading or trailing whitespace.');
            return;
        }

        if (!passwordPolicy.minLength) {
            setPasswordModalError('Password must be at least 8 characters long.');
            return;
        }
        if (!passwordPolicy.hasUpper || !passwordPolicy.hasLower) {
            setPasswordModalError('Password must contain both uppercase (A-Z) and lowercase (a-z) letters.');
            return;
        }
        if (!passwordPolicy.hasNumber) {
            setPasswordModalError('Password must contain at least one numeric digit (0-9).');
            return;
        }
        if (!passwordPolicy.hasSpecial) {
            setPasswordModalError('Password must contain at least one special character (!@#$%...).');
            return;
        }
        if (!passwordPolicy.matches) {
            setPasswordModalError('New password and confirmation password do not match.');
            return;
        }

        setIsSavingPassword(true);

        try {
            const endpoint = `${API_BASE_URL || ''}/api/auth/doctors/${passwordModalDoctor.doctorID}/password`;
            const payload = {
                password: newPassword
            };
            if (oldPassword && oldPassword.trim()) {
                payload.oldPassword = oldPassword.trim();
            }

            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setSuccess(`Password for Dr. ${passwordModalDoctor.firstName} ${passwordModalDoctor.lastName || ''} updated successfully!`);
                setPasswordModalDoctor(null);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordModalError('');
            } else {
                setPasswordModalError(data.message || 'Failed to update password. Current password may be incorrect.');
            }
        } catch (err) {
            setPasswordModalError('Server connection error. Please verify network connectivity.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    // Enhanced search: trimmed, includes credentials, department, region (DATA-002)
    const filteredDoctors = doctors.filter(doc => {
        const q = searchQuery.trim().toLowerCase();
        const rawFirst = (doc.firstName || '').replace(/^dr\.?\s+/i, '').trim();
        const rawLast = (doc.lastName || '').trim();
        const searchPool = `${doc.firstName || ''} ${doc.lastName || ''} ${rawFirst} ${rawLast} Dr. ${rawFirst} ${rawLast} ${doc.username || ''} ${doc.title || ''} ${doc.specialization || ''} ${doc.hospitalDepartment || ''} ${doc.region || ''} ${doc.organizationName || ''} ${doc.role || ''}`.toLowerCase();
        
        const matchesQuery = !q || searchPool.includes(q);
        
        let matchesStatus = true;
        if (statusFilter === 'Active') matchesStatus = doc.isActive !== false;
        if (statusFilter === 'Inactive') matchesStatus = doc.isActive === false;

        let matchesOrg = true;
        if (orgFilter !== 'All') {
            matchesOrg = doc.organizationID && String(doc.organizationID) === String(orgFilter);
        }

        return matchesQuery && matchesStatus && matchesOrg;
    });

    // Consistent KPI counts (DATA-003)
    const activeCount = doctors.filter(d => d.isActive !== false).length;
    const avgExp = doctors.length > 0 
        ? Math.round(doctors.reduce((sum, d) => sum + (d.yearsOfExperience || 0), 0) / doctors.length) 
        : 0;

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans pb-24 relative selection:bg-primary-teal/20 selection:text-primary-teal">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-10 space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-light-teal/60 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary-teal/10 flex items-center justify-center border border-primary-teal/20 shrink-0">
                            <ShieldCheck className="w-8 h-8 text-primary-teal" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-teal/10 text-primary-teal uppercase tracking-wider">
                                    Administrative Suite
                                </span>
                                <span className="text-xs text-muted-text font-medium">• SuperAdmin Console</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate mt-1 tracking-tight">
                                Clinician & Hospital Roster
                            </h1>
                            <p className="text-xs text-muted-text font-medium mt-0.5">
                                Manage licensed practitioners, hospital affiliations, specialized departments, and credential permissions.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setError(''); setSuccess(''); setIsAddDoctorOpen(true); }}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Doctor</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Strip (DATA-003) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                {/* Alerts with (X) Dismiss button (DATA-004) */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => setError('')}
                            className="p-1 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Dismiss error"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                            <span>{success}</span>
                        </div>
                        <button
                            onClick={() => setSuccess('')}
                            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Search & Filter Toolbar (DATA-002) */}
                <div className="bg-white p-4 rounded-2xl border border-light-teal/60 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                        <input
                            type="text"
                            placeholder="Search name, credentials, hospital, region..."
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

                {/* Doctors Table (DATA-001) */}
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
                                    const isReceptionist = String(doc.role || '').toLowerCase() === 'receptionist';
                                    const isSuperAdmin = doc.isSuperAdmin || String(doc.role || '').toLowerCase() === 'superadmin';
                                    
                                    // Strip accidental duplicate Dr. prefixes from first name (DATA-001)
                                    const rawFirst = (doc.firstName || '').replace(/^dr\.?\s+/i, '').trim();
                                    const rawLast = (doc.lastName || '').trim();
                                    
                                    let displayName = '';
                                    if (isSuperAdmin) {
                                        displayName = 'Super Admin';
                                    } else if (isReceptionist) {
                                        displayName = `Receptionist ${rawFirst} ${rawLast}`.trim();
                                    } else {
                                        displayName = rawFirst || rawLast ? `Dr. ${rawFirst} ${rawLast}`.trim() : doc.username;
                                    }

                                    // Dynamic currency symbol by region (DOC-005)
                                    const currencySymbol = doc.region === 'PK' ? 'Rs.' : (doc.region === 'UK' ? '£' : '$');

                                    return (
                                        <tr key={doc.doctorID} className="hover:bg-light-teal/10 transition-colors">
                                            {/* Practitioner Name & Avatar */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={doc.profileImageUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"}
                                                        alt={displayName}
                                                        className="w-11 h-11 rounded-xl object-cover border border-light-teal/60 shrink-0"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-1.5 font-bold text-dark-slate text-sm">
                                                            <span>{displayName}</span>
                                                            {isSuperAdmin && (
                                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">SUPER ADMIN</span>
                                                            )}
                                                            {isReceptionist && (
                                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">RECEPTIONIST</span>
                                                            )}
                                                            {!isSuperAdmin && !isReceptionist && (
                                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300">CLINICIAN</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-text font-mono">
                                                            @{doc.username} • {doc.region || 'PK'}
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
                                                    <span>{doc.yearsOfExperience || 0} Yrs</span>
                                                </div>
                                                <div className="text-[11px] text-muted-text font-bold mt-1">
                                                    {currencySymbol} {doc.consultationFee !== undefined && doc.consultationFee !== null ? doc.consultationFee : 0} / visit
                                                </div>
                                            </td>

                                            {/* Portal Status */}
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => setStatusConfirmDoctor(doc)}
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
                                                        onClick={() => handleOpenPasswordModal(doc)}
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

            {/* 🔴 CONFIRMATION MODAL FOR STATUS DEACTIVATION / ACTIVATION (DATA-004) */}
            {statusConfirmDoctor && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-light-teal animate-in zoom-in-95">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                statusConfirmDoctor.isActive !== false ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-dark-slate text-sm">
                                    {statusConfirmDoctor.isActive !== false ? 'Deactivate Doctor?' : 'Activate Doctor?'}
                                </h3>
                                <p className="text-xs text-muted-text mt-0.5">
                                    {statusConfirmDoctor.isActive !== false 
                                        ? `Are you sure you want to deactivate Dr. ${statusConfirmDoctor.firstName} ${statusConfirmDoctor.lastName}? They will be hidden from the public portal and cannot log in.`
                                        : `Activate Dr. ${statusConfirmDoctor.firstName} ${statusConfirmDoctor.lastName} to restore appointments and public directory visibility?`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-light-teal/40">
                            <button
                                onClick={() => setStatusConfirmDoctor(null)}
                                className="px-4 py-2 rounded-xl bg-light-teal/30 hover:bg-light-teal text-muted-text text-xs font-bold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const target = statusConfirmDoctor;
                                    setStatusConfirmDoctor(null);
                                    await handleToggleStatus(target);
                                }}
                                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer ${
                                    statusConfirmDoctor.isActive !== false 
                                        ? 'bg-rose-600 hover:bg-rose-700' 
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                Confirm {statusConfirmDoctor.isActive !== false ? 'Deactivation' : 'Activation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🏥 EDIT DOCTOR MODAL */}
            {editingDoctor && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 border border-light-teal">
                        {/* Pinned Header */}
                        <div className="px-8 py-5 border-b border-light-teal/40 flex items-center justify-between bg-light-teal/30">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-dark-slate">
                                    Edit Dr. {editingDoctor.firstName} {editingDoctor.lastName}
                                </h3>
                                <p className="text-xs text-muted-text">
                                    Manage credentials, hospital departments, career timeline, and clinic practice profile.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingDoctor(null)}
                                className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="px-8 pt-4 pb-2 border-b border-light-teal/30 flex flex-wrap gap-2 bg-warm-cream/40">
                            {[
                                { id: 'profile', label: 'Basic & Hospital', icon: Building2 },
                                { id: 'organizations', label: 'Career Timeline', icon: Briefcase },
                                { id: 'education', label: 'Degrees & Fellowships', icon: GraduationCap },
                                { id: 'clinic', label: 'Clinic Schedule & Timing', icon: Clock }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setEditActiveTab(tab.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                        editActiveTab === tab.id
                                            ? 'bg-primary-teal text-white shadow-xs'
                                            : 'bg-white hover:bg-light-teal/40 text-muted-text border border-light-teal/40'
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
                                    {/* Hospital Affiliation Selector (DOC-001, DOC-002) */}
                                    <div className="p-4 rounded-2xl bg-light-teal/20 border border-light-teal/60 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-primary-teal" />
                                            <span className="text-xs font-bold text-dark-slate uppercase tracking-wider">Hospital / Organization Assignment</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-muted-text uppercase">Belongs to Organization (Hospital) (Optional)</label>
                                                <select
                                                    value={editingDoctor.organizationID}
                                                    onChange={e => {
                                                        const orgId = e.target.value;
                                                        const selected = organizations.find(o => String(o.organizationID) === String(orgId));
                                                        setEditingDoctor({ 
                                                            ...editingDoctor, 
                                                            organizationID: orgId,
                                                            region: selected ? selected.country : editingDoctor.region
                                                        });
                                                    }}
                                                    className="w-full px-3.5 py-2.5 bg-white border border-light-teal/60 rounded-xl text-xs font-bold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                                >
                                                    <option value="">-- No Hospital Linked --</option>
                                                    {organizations
                                                        .filter(org => org.isActive !== false || String(org.organizationID) === String(editingDoctor.organizationID))
                                                        .map(org => (
                                                            <option key={org.organizationID} value={org.organizationID}>
                                                                {org.name} ({org.city || 'Central'}){org.isActive === false ? ' [Inactive]' : ''}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-muted-text uppercase">Hospital Department</label>
                                                <input
                                                    type="text"
                                                    maxLength={100}
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
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">First Name *</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={50}
                                                value={editingDoctor.firstName}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, firstName: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Last Name *</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={50}
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
                                                maxLength={150}
                                                value={editingDoctor.specialization}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Degree Credentials Title</label>
                                            <input
                                                type="text"
                                                maxLength={100}
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
                                                min="0"
                                                max="70"
                                                step="1"
                                                onKeyDown={e => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                                                value={editingDoctor.yearsOfExperience}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, yearsOfExperience: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-text uppercase tracking-wider">
                                                Consultation Fee ({editingDoctor.region === 'PK' ? 'Rs.' : (editingDoctor.region === 'UK' ? '£' : '$')}) *
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10000"
                                                step="0.01"
                                                onKeyDown={e => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
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
                                                <option value="PK">Pakistan (PK)</option>
                                                <option value="NZ">New Zealand (NZ)</option>
                                                <option value="US">United States (US)</option>
                                                <option value="UK">United Kingdom (UK)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Profile Image URL</label>
                                        <input
                                            type="url"
                                            maxLength={500}
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
                                            maxLength={2000}
                                            value={editingDoctor.biography}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, biography: e.target.value })}
                                            className="w-full p-4 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal leading-relaxed"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: ORGANIZATIONS & CAREER TIMELINE (VAL-010) */}
                            {editActiveTab === 'organizations' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                                Career History (Hospital Affiliations & Timeline)
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
                                                            list={`org-list-${index}`}
                                                            placeholder="e.g. Shifa International Hospital"
                                                            maxLength={150}
                                                            value={org.organization}
                                                            onChange={e => handleOrganizationChange(index, 'organization', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                        />
                                                        <datalist id={`org-list-${index}`}>
                                                            {organizations.map(o => (
                                                                <option key={o.organizationID} value={o.name} />
                                                            ))}
                                                        </datalist>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Role / Clinical Designation</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Head of Oral Surgery"
                                                            maxLength={100}
                                                            value={org.role}
                                                            onChange={e => handleOrganizationChange(index, 'role', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Period / Duration (Start - End Year)</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <select
                                                                value={getPeriodParts(org.period).start}
                                                                onChange={e => {
                                                                    const current = getPeriodParts(org.period);
                                                                    handleOrganizationChange(index, 'period', `${e.target.value} - ${current.end}`);
                                                                }}
                                                                className="w-full px-2.5 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                            >
                                                                {Array.from({ length: 47 }, (_, i) => 2026 - i).map(year => (
                                                                    <option key={year} value={year}>{year}</option>
                                                                ))}
                                                            </select>
                                                            <select
                                                                value={getPeriodParts(org.period).end}
                                                                onChange={e => {
                                                                    const current = getPeriodParts(org.period);
                                                                    handleOrganizationChange(index, 'period', `${current.start} - ${e.target.value}`);
                                                                }}
                                                                className="w-full px-2.5 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                                            >
                                                                <option value="Present">Present</option>
                                                                {Array.from({ length: 47 }, (_, i) => 2026 - i).map(year => (
                                                                    <option key={year} value={year}>{year}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-text uppercase">Department / Notes</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Advanced surgical navigation"
                                                            maxLength={500}
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
                                            maxLength={2000}
                                            value={editingDoctor.education}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, education: e.target.value })}
                                            className="w-full p-4 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Certifications & Fellowships (Comma-separated)</label>
                                        <textarea
                                            rows="3"
                                            maxLength={2000}
                                            value={editingDoctor.certifications}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, certifications: e.target.value })}
                                            className="w-full p-4 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-text uppercase tracking-wider">Languages</label>
                                        <input
                                            type="text"
                                            maxLength={200}
                                            value={editingDoctor.languages}
                                            onChange={e => setEditingDoctor({ ...editingDoctor, languages: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: CLINIC SCHEDULE & OPERATING HOURS (VAL-009) */}
                            {editActiveTab === 'clinic' && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-light-teal/20 border border-light-teal/60 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary-teal" />
                                            <span className="text-xs font-bold text-dark-slate uppercase tracking-wider">Practitioner Clinic Schedule & Contact Information</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-muted-text uppercase">Doctor / Clinic Direct Phone</label>
                                                <input
                                                    type="tel"
                                                    maxLength={50}
                                                    value={editingDoctor.phone || ''}
                                                    onChange={e => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                                                    placeholder="+92 334 5081202"
                                                    className="w-full px-3.5 py-2.5 bg-white border border-light-teal/60 rounded-xl text-xs font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-muted-text uppercase">Doctor / Clinic Email</label>
                                                <input
                                                    type="email"
                                                    maxLength={100}
                                                    value={editingDoctor.email || ''}
                                                    onChange={e => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                                                    placeholder="doctor@clinic.com"
                                                    className="w-full px-3.5 py-2.5 bg-white border border-light-teal/60 rounded-xl text-xs font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-text uppercase">Clinic / Practice Name</label>
                                            <input
                                                type="text"
                                                maxLength={150}
                                                value={editingDoctor.clinicName || ''}
                                                onChange={e => setEditingDoctor({ ...editingDoctor, clinicName: e.target.value })}
                                                placeholder="Dental & Oral Surgery Clinic"
                                                className="w-full px-3.5 py-2.5 bg-white border border-light-teal/60 rounded-xl text-xs font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-text uppercase">Weekly Operating Schedule & Timings</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1.5">
                                                <select
                                                    onChange={e => {
                                                        if (e.target.value) {
                                                            setEditingDoctor({ ...editingDoctor, clinicOperatingHours: e.target.value });
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate"
                                                >
                                                    <option value="">-- Choose Template --</option>
                                                    <option value="Mon - Fri: 09:00 - 17:00">Mon - Fri: 09:00 - 17:00</option>
                                                    <option value="Mon - Sat: 09:00 - 18:00">Mon - Sat: 09:00 - 18:00</option>
                                                    <option value="Mon - Sat: 03:00 - 20:00">Mon - Sat: 03:00 - 20:00</option>
                                                    <option value="Mon - Fri: 09:00 - 17:00, Sat: 09:00 - 14:00">Mon - Fri: 09:00 - 17:00, Sat: 09:00 - 14:00</option>
                                                    <option value="Daily: 10:00 - 20:00">Daily: 10:00 - 20:00</option>
                                                </select>
                                                <div className="col-span-2">
                                                    <input
                                                        type="text"
                                                        maxLength={150}
                                                        value={editingDoctor.clinicOperatingHours || ''}
                                                        onChange={e => setEditingDoctor({ ...editingDoctor, clinicOperatingHours: e.target.value })}
                                                        placeholder="e.g. Mon - Sat: 09:00 - 18:00"
                                                        className="w-full px-3.5 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-semibold text-dark-slate focus:outline-none focus:ring-2 focus:ring-primary-teal"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-text uppercase">Real-Time Clinic Status Override</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingDoctor({ ...editingDoctor, isClinicOpenManualOverride: null })}
                                                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                        editingDoctor.isClinicOpenManualOverride === null || editingDoctor.isClinicOpenManualOverride === undefined
                                                            ? 'bg-primary-teal/15 border-primary-teal text-primary-teal shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    ⚙️ Auto Schedule
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingDoctor({ ...editingDoctor, isClinicOpenManualOverride: true })}
                                                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                        editingDoctor.isClinicOpenManualOverride === true
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50'
                                                    }`}
                                                >
                                                    🟢 Force OPEN
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingDoctor({ ...editingDoctor, isClinicOpenManualOverride: false })}
                                                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                        editingDoctor.isClinicOpenManualOverride === false
                                                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50'
                                                    }`}
                                                >
                                                    🔴 Force CLOSED
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-between border-t border-light-teal/40">
                                <button
                                    type="button"
                                    onClick={() => setEditingDoctor(null)}
                                    className="px-6 py-2.5 rounded-xl bg-light-teal/30 hover:bg-light-teal text-muted-text text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary-teal/20 transition-all cursor-pointer flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ➕ REGISTER NEW DOCTOR MODAL (DOC-005, VAL-001, VAL-002, VAL-003, VAL-004, VAL-005) */}
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
                                    <span>Hospital / Organization Affiliation (Optional)</span>
                                </label>
                                <select
                                    value={newDocForm.organizationID}
                                    onChange={e => {
                                        const orgId = e.target.value;
                                        const selected = organizations.find(o => String(o.organizationID) === String(orgId));
                                        setNewDocForm({
                                            ...newDocForm,
                                            organizationID: orgId,
                                            region: selected ? selected.country : newDocForm.region
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-light-teal/60 rounded-xl text-xs font-bold text-dark-slate focus:outline-none"
                                >
                                    <option value="">-- Choose Hospital (Optional) --</option>
                                    {organizations
                                        .filter(o => o.isActive !== false)
                                        .map(o => (
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
                                        maxLength={50}
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
                                        maxLength={50}
                                        placeholder="e.g. Watson"
                                        value={newDocForm.lastName}
                                        onChange={e => setNewDocForm({ ...newDocForm, lastName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-text uppercase">Username *</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={30}
                                    placeholder="e.g. dr.emily (no spaces or special chars)"
                                    value={newDocForm.username}
                                    onChange={e => setNewDocForm({ ...newDocForm, username: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none font-mono"
                                />
                                <span className="text-[10px] text-muted-text">3-30 chars, letters, digits, '.', '-', '_' only.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Initial Password *</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Min 8 chars"
                                        value={newDocForm.password}
                                        onChange={e => setNewDocForm({ ...newDocForm, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Confirm Password *</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Re-enter password"
                                        value={newDocForm.confirmPassword}
                                        onChange={e => setNewDocForm({ ...newDocForm, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password Rule Checklist for New Doctor (VAL-005) */}
                            {newDocForm.password && (
                                <div className="p-3 bg-light-teal/20 rounded-xl border border-light-teal/40 space-y-1 text-left">
                                    <div className="text-[10px] font-bold uppercase text-muted-text">Password Complexity Requirements:</div>
                                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                                        <div className={`flex items-center gap-1 ${newDocForm.password.length >= 8 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                            {newDocForm.password.length >= 8 ? '✓' : '○'} 8+ Characters
                                        </div>
                                        <div className={`flex items-center gap-1 ${/[A-Z]/.test(newDocForm.password) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                            {/[A-Z]/.test(newDocForm.password) ? '✓' : '○'} Uppercase Letter
                                        </div>
                                        <div className={`flex items-center gap-1 ${/[a-z]/.test(newDocForm.password) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                            {/[a-z]/.test(newDocForm.password) ? '✓' : '○'} Lowercase Letter
                                        </div>
                                        <div className={`flex items-center gap-1 ${/[0-9]/.test(newDocForm.password) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                            {/[0-9]/.test(newDocForm.password) ? '✓' : '○'} Number (0-9)
                                        </div>
                                        <div className={`flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':",.<>?/\\|`~]/.test(newDocForm.password) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                            {/[!@#$%^&*()_+\-=\[\]{};':",.<>?/\\|`~]/.test(newDocForm.password) ? '✓' : '○'} Special Symbol
                                        </div>
                                        <div className={`flex items-center gap-1 ${newDocForm.confirmPassword && newDocForm.password === newDocForm.confirmPassword ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                            {newDocForm.confirmPassword && newDocForm.password === newDocForm.confirmPassword ? '✓' : '○'} Passwords Match
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">Specialization</label>
                                    <input
                                        type="text"
                                        maxLength={150}
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
                                        min="0"
                                        max="70"
                                        step="1"
                                        onKeyDown={e => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                                        value={newDocForm.yearsOfExperience}
                                        onChange={e => setNewDocForm({ ...newDocForm, yearsOfExperience: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-light-teal/20 border border-light-teal/60 rounded-xl text-xs font-medium text-dark-slate focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-text uppercase">
                                        Consultation Fee ({newDocForm.region === 'PK' ? 'Rs.' : (newDocForm.region === 'UK' ? '£' : '$')}) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10000"
                                        step="0.01"
                                        onKeyDown={e => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
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
                                        <option value="PK">Pakistan (PK)</option>
                                        <option value="NZ">New Zealand (NZ)</option>
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

            {/* 🔐 SECURE MULTI-FIELD PASSWORD UPDATE MODAL (REACT PORTAL) */}
            {passwordModalDoctor && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-dark-slate/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-5 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Pinned Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#1e293b] to-[#0f766e] text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner shrink-0">
                                    <Key className="w-4 h-4 text-teal-300" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold tracking-tight">
                                        Update Password for Dr. {passwordModalDoctor.firstName} {passwordModalDoctor.lastName || ''}
                                    </h3>
                                    <p className="text-[11px] text-slate-300 font-medium">
                                        Username: <span className="text-teal-300 font-mono">@{passwordModalDoctor.username}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPasswordModalDoctor(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                                title="Close modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-left">
                            {/* Error Alert Box */}
                            {passwordModalError && (
                                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-shake">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <span>{passwordModalError}</span>
                                </div>
                            )}

                            {/* 1. Current (Old) Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-slate-400" />
                                        <span>Current (Old) Password</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-medium">(Optional for SuperAdmin Override)</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        placeholder="Enter doctor's current password (if known)"
                                        value={oldPassword}
                                        onChange={e => { setOldPassword(e.target.value); setPasswordModalError(''); }}
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        title={showOldPassword ? "Hide password" : "Show password"}
                                    >
                                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* 2. New Secure Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Key className="w-3 h-3 text-teal-600" />
                                        <span>New Secure Password <span className="text-rose-500">*</span></span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateStrongPassword}
                                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                                        title="Auto-generate a strong password satisfying all criteria"
                                    >
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span>Generate Strong</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter new strong password"
                                        value={newPassword}
                                        onChange={e => { setNewPassword(e.target.value); setPasswordModalError(''); }}
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-teal/20 focus:bg-white transition-all shadow-2xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        title={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Meter Bar */}
                                {newPassword.length > 0 && (
                                    <div className="pt-1.5">
                                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                            <span className="text-slate-500 uppercase">Strength:</span>
                                            <span className={
                                                getStrengthScore() <= 2 ? 'text-rose-600' :
                                                getStrengthScore() <= 4 ? 'text-amber-600' : 'text-emerald-600'
                                            }>
                                                {getStrengthScore() <= 2 ? 'Weak' : getStrengthScore() <= 4 ? 'Moderate' : 'Very Strong'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1 h-1.5">
                                            {[1, 2, 3, 4, 5].map((step) => (
                                                <div 
                                                    key={step} 
                                                    className={`rounded-full transition-all duration-300 ${
                                                        step <= getStrengthScore() 
                                                            ? getStrengthScore() <= 2 ? 'bg-rose-500' : getStrengthScore() <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            : 'bg-slate-200'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Confirm Password Field */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                                    <span>Confirm New Password <span className="text-rose-500">*</span></span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder="Re-enter new strong password"
                                        value={confirmPassword}
                                        onChange={e => { setConfirmPassword(e.target.value); setPasswordModalError(''); }}
                                        className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-dark-slate placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-2xs ${
                                            confirmPassword && !passwordPolicy.matches 
                                                ? 'border-rose-400 focus:ring-rose-200' 
                                                : confirmPassword && passwordPolicy.matches
                                                    ? 'border-emerald-400 focus:ring-emerald-200'
                                                    : 'border-slate-200 focus:ring-primary-teal/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Live Policy Validation Rules Checklist */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    Dentia Clinical Security Policy:
                                </div>
                                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] font-medium">
                                    <div className={`flex items-center space-x-1.5 ${passwordPolicy.minLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${passwordPolicy.minLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {passwordPolicy.minLength ? '✓' : '•'}
                                        </span>
                                        <span>Min 8 characters</span>
                                    </div>
                                    <div className={`flex items-center space-x-1.5 ${passwordPolicy.hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${passwordPolicy.hasUpper ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {passwordPolicy.hasUpper ? '✓' : '•'}
                                        </span>
                                        <span>Uppercase (A-Z)</span>
                                    </div>
                                    <div className={`flex items-center space-x-1.5 ${passwordPolicy.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${passwordPolicy.hasLower ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {passwordPolicy.hasLower ? '✓' : '•'}
                                        </span>
                                        <span>Lowercase (a-z)</span>
                                    </div>
                                    <div className={`flex items-center space-x-1.5 ${passwordPolicy.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${passwordPolicy.hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {passwordPolicy.hasNumber ? '✓' : '•'}
                                        </span>
                                        <span>Numeric (0-9)</span>
                                    </div>
                                    <div className={`flex items-center space-x-1.5 ${passwordPolicy.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${passwordPolicy.hasSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {passwordPolicy.hasSpecial ? '✓' : '•'}
                                        </span>
                                        <span>Symbol (!@#$%)</span>
                                    </div>
                                    <div className={`flex items-center space-x-1.5 ${passwordPolicy.matches ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${passwordPolicy.matches ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                            {passwordPolicy.matches ? '✓' : '•'}
                                        </span>
                                        <span>Passwords match</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModalDoctor(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                    disabled={isSavingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingPassword || !passwordPolicy.minLength || !passwordPolicy.matches}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-teal to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-extrabold shadow-md shadow-primary-teal/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingPassword ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Encrypting & Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Update Doctor Password</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

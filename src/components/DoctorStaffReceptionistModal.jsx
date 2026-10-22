import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Users, 
    UserPlus, 
    Key, 
    ShieldCheck, 
    Clock, 
    Phone, 
    Mail, 
    X, 
    Check, 
    AlertCircle, 
    Sparkles, 
    ChevronDown, 
    ChevronUp, 
    ToggleLeft, 
    ToggleRight,
    Lock,
    Save,
    RotateCcw,
    Trash2,
    Calendar,
    FileText,
    Settings,
    ShieldAlert,
    Eye,
    EyeOff
} from 'lucide-react';
import { 
    DEFAULT_RECEPTIONIST_PERMISSIONS, 
    PERMISSION_DEFINITIONS, 
    PERMISSION_PRESETS 
} from '../utils/permissionUtils';
import API_BASE_URL from '../config/apiConfig';

export default function DoctorStaffReceptionistModal({ isOpen, onClose, doctor }) {
    const docId = doctor?.doctorID || doctor?.id || 1;
    const storageKey = `dentia_doctor_${docId}_receptionists`;

    const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'add'
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Editing Permissions State
    const [selectedStaffForPerms, setSelectedStaffForPerms] = useState(null);
    const [tempPerms, setTempPerms] = useState(null);

    // Reset Password Modal State
    const [resetPwStaff, setResetPwStaff] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resettingPw, setResettingPw] = useState(false);

    // New Receptionist Form State
    const [newStaff, setNewStaff] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        phone: '+92 334 5081202',
        email: '',
        shiftTiming: 'Morning Shift (09:00 AM - 02:00 PM)',
        preset: 'STANDARD'
    });
    const [creatingStaff, setCreatingStaff] = useState(false);

    // Keyboard ESC dismissal and body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedStaffForPerms) setSelectedStaffForPerms(null);
                else if (resetPwStaff) setResetPwStaff(null);
                else onClose();
            }
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, selectedStaffForPerms, resetPwStaff]);

    // Load receptionists for this doctor
    useEffect(() => {
        if (!isOpen) return;

        // Load cached staff from localStorage
        const cached = localStorage.getItem(storageKey);
        let list = [];
        if (cached) {
            try { list = JSON.parse(cached); } catch {}
        }

        // If no staff yet, provide initial seed staff
        if (!list || list.length === 0) {
            list = [
                {
                    id: 101,
                    doctorID: 101,
                    username: 'receptionist_amina',
                    firstName: 'Amina',
                    lastName: 'Bilal',
                    phone: '+92 334 5081202',
                    email: 'amina.reception@gmail.com',
                    shiftTiming: 'Morning Shift (09:00 AM - 02:00 PM)',
                    isActive: true,
                    role: 'Receptionist',
                    assignedDoctorID: docId,
                    permissions: JSON.parse(JSON.stringify(DEFAULT_RECEPTIONIST_PERMISSIONS))
                },
                {
                    id: 102,
                    doctorID: 102,
                    username: 'receptionist_zainab',
                    firstName: 'Zainab',
                    lastName: 'Tariq',
                    phone: '+92 334 5081202',
                    email: 'zainab.reception@gmail.com',
                    shiftTiming: 'Evening Shift (03:00 PM - 09:00 PM)',
                    isActive: true,
                    role: 'Receptionist',
                    assignedDoctorID: docId,
                    permissions: JSON.parse(JSON.stringify(DEFAULT_RECEPTIONIST_PERMISSIONS))
                }
            ];
            localStorage.setItem(storageKey, JSON.stringify(list));
        }

        setStaffList(list);

        // Fetch live staff from API in background
        fetchStaffFromAPI();
    }, [isOpen, docId]);

    const fetchStaffFromAPI = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/doctors/${docId}/receptionists`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setStaffList(data);
                    localStorage.setItem(storageKey, JSON.stringify(data));
                }
            }
        } catch {
            // Offline or fallback to local storage
        }
    };

    const showNotification = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSaveRoster = (updated) => {
        setStaffList(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('dentia:staff-updated', { detail: updated }));
    };

    // Toggle active status
    const handleToggleActive = (staffId) => {
        const updated = staffList.map(s => {
            if (s.id === staffId || s.doctorID === staffId) {
                const nextState = !s.isActive;
                return { ...s, isActive: nextState };
            }
            return s;
        });
        handleSaveRoster(updated);
        showNotification('Staff active status updated.');
    };

    // Open Permissions Editor
    const handleOpenPermissions = (staff) => {
        setSelectedStaffForPerms(staff);
        setTempPerms(JSON.parse(JSON.stringify(staff.permissions || DEFAULT_RECEPTIONIST_PERMISSIONS)));
    };

    // Toggle specific permission
    const handleTogglePerm = (categoryKey, permKey) => {
        if (!tempPerms) return;
        setTempPerms(prev => ({
            ...prev,
            [categoryKey]: {
                ...prev[categoryKey],
                [permKey]: !prev[categoryKey]?.[permKey]
            }
        }));
    };

    // Apply Preset
    const handleApplyPreset = (presetKey) => {
        const preset = PERMISSION_PRESETS[presetKey];
        if (preset) {
            setTempPerms(JSON.parse(JSON.stringify(preset.perms)));
            showNotification(`Applied '${preset.label}' permission preset!`);
        }
    };

    // Save Permissions
    const handleSavePermissions = async () => {
        if (!selectedStaffForPerms || !tempPerms) return;

        const updated = staffList.map(s => {
            if (s.id === selectedStaffForPerms.id || s.doctorID === selectedStaffForPerms.doctorID) {
                return { ...s, permissions: tempPerms, permissionsJson: JSON.stringify(tempPerms) };
            }
            return s;
        });

        handleSaveRoster(updated);

        // Try API sync
        try {
            const staffId = selectedStaffForPerms.doctorID || selectedStaffForPerms.id;
            await fetch(`${API_BASE_URL}/api/auth/doctors/${docId}/receptionists/${staffId}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissionsJson: JSON.stringify(tempPerms) })
            });
        } catch {}

        showNotification(`✅ Permissions for ${selectedStaffForPerms.firstName} updated successfully!`);
        setSelectedStaffForPerms(null);
    };

    // Password Policy Check
    const staffPasswordPolicy = {
        minLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword),
        matches: Boolean(newPassword && confirmPassword && newPassword === confirmPassword)
    };

    const isStaffPasswordValid = 
        staffPasswordPolicy.minLength && 
        staffPasswordPolicy.hasUpper && 
        staffPasswordPolicy.hasLower && 
        staffPasswordPolicy.hasNumber && 
        staffPasswordPolicy.hasSpecial && 
        staffPasswordPolicy.matches;

    // Handle Password Reset
    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (!newPassword) {
            showNotification('Password cannot be empty.', 'error');
            return;
        }
        if (!isStaffPasswordValid) {
            showNotification('Password must be at least 8 chars with uppercase, lowercase, number, special char and matching confirmation.', 'error');
            return;
        }

        setResettingPw(true);
        const staffId = resetPwStaff.doctorID || resetPwStaff.id;

        try {
            await fetch(`${API_BASE_URL}/api/auth/doctors/${staffId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });
        } catch {}

        showNotification(`🔑 Password for ${resetPwStaff.firstName} successfully reset to: "${newPassword}"`);
        setResettingPw(false);
        setResetPwStaff(null);
        setNewPassword('');
        setConfirmPassword('');
    };

    // Handle Create New Receptionist
    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.username || !newStaff.password || !newStaff.firstName) {
            showNotification('Please fill in Name, Username, and Password.', 'error');
            return;
        }

        setCreatingStaff(true);
        const presetPerms = PERMISSION_PRESETS[newStaff.preset]?.perms || DEFAULT_RECEPTIONIST_PERMISSIONS;

        const newEntry = {
            id: Date.now(),
            doctorID: Date.now(),
            username: newStaff.username.trim().toLowerCase(),
            firstName: newStaff.firstName.trim(),
            lastName: newStaff.lastName.trim(),
            phone: newStaff.phone.trim(),
            email: newStaff.email.trim(),
            shiftTiming: newStaff.shiftTiming,
            isActive: true,
            role: 'Receptionist',
            assignedDoctorID: docId,
            permissions: presetPerms,
            permissionsJson: JSON.stringify(presetPerms),
            createdAt: new Date().toISOString()
        };

        // Try API create
        try {
            await fetch(`${API_BASE_URL}/api/auth/doctors/${docId}/receptionists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: newEntry.username,
                    password: newStaff.password,
                    firstName: newEntry.firstName,
                    lastName: newEntry.lastName,
                    phone: newEntry.phone,
                    email: newEntry.email,
                    shiftTiming: newEntry.shiftTiming,
                    permissionsJson: newEntry.permissionsJson
                })
            });
        } catch {}

        const updated = [...staffList, newEntry];
        handleSaveRoster(updated);

        showNotification(`🎉 New receptionist "${newEntry.firstName}" registered successfully!`);
        setCreatingStaff(false);
        setActiveTab('roster');
        setNewStaff({
            firstName: '',
            lastName: '',
            username: '',
            password: '',
            phone: '+92 334 5081202',
            email: '',
            shiftTiming: 'Morning Shift (09:00 AM - 02:00 PM)',
            preset: 'STANDARD'
        });
    };

    // Delete staff
    const handleDeleteStaff = (staffId, staffName) => {
        if (!window.confirm(`Are you sure you want to remove ${staffName} from your clinic reception staff?`)) return;
        const updated = staffList.filter(s => s.id !== staffId && s.doctorID !== staffId);
        handleSaveRoster(updated);
        showNotification(`${staffName} removed from clinic staff.`);
    };

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/65 backdrop-blur-sm animate-fade-in p-3 sm:p-5">
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

            {/* Viewport centering wrapper */}
            <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
                <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden z-10 animate-in zoom-in-95 duration-200">

                    {/* 🌟 1. PINNED HEADER */}
                    <div className="px-6 py-4.5 bg-gradient-to-r from-[#10244B] via-[#162e5d] to-[#4A7CD2] text-white flex items-center justify-between shrink-0 shadow-sm">
                        <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner shrink-0">
                                <Users className="w-5 h-5 text-[#EAF0FC]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-extrabold tracking-tight">Front-Desk Staff & Receptionist Management</h3>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/15 text-[#EAF0FC] border border-white/20">
                                        Doctor Authority
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">
                                    Multiple receptionists, password resets & dynamic page/button access control
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                            title="Close modal"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Toast Notification */}
                    {toast && (
                        <div className={`px-6 py-2 text-xs font-bold flex items-center justify-between transition-all ${
                            toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-b border-rose-200' : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                        }`}>
                            <span>{toast.msg}</span>
                            <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
                        </div>
                    )}

                    {/* Subheader Segmented Tabs */}
                    <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { setActiveTab('roster'); setSelectedStaffForPerms(null); }}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                    activeTab === 'roster' 
                                        ? 'bg-white text-dark-slate shadow-xs border border-slate-200 ring-1 ring-black/5' 
                                        : 'text-slate-600 hover:text-dark-slate hover:bg-white/60'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5 text-primary-teal" />
                                <span>Staff Roster ({staffList.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => { setActiveTab('add'); setSelectedStaffForPerms(null); }}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                    activeTab === 'add' 
                                        ? 'bg-primary-teal text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-dark-slate hover:bg-white/60'
                                }`}
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>+ Register Receptionist</span>
                            </button>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                            Supervising Doctor: <strong>Dr. {doctor?.lastName || 'Ahmed'}</strong>
                        </span>
                    </div>

                    {/* 🌟 2. SCROLLABLE BODY */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-slate-700 custom-scrollbar">

                        {/* TAB 1: ROSTER VIEW */}
                        {activeTab === 'roster' && !selectedStaffForPerms && (
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                            Active Front-Desk Receptionists
                                        </h4>
                                        <p className="text-[11px] text-slate-400">
                                            Each receptionist can have distinct page, section & action permissions.
                                        </p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveTab('add')}
                                        className="text-xs font-bold text-primary-teal hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        + Add Another Receptionist
                                    </button>
                                </div>

                                {staffList.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-500">No receptionists registered under your clinic yet.</p>
                                        <button 
                                            onClick={() => setActiveTab('add')}
                                            className="mt-3 px-4 py-1.5 bg-primary-teal text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-hover cursor-pointer"
                                        >
                                            Register First Receptionist
                                        </button>
                                    </div>
                                ) : (
                                    staffList.map((staff) => (
                                        <div 
                                            key={staff.id || staff.doctorID} 
                                            className={`p-4 rounded-2xl border transition-all ${
                                                staff.isActive 
                                                    ? 'bg-white border-slate-200 hover:border-primary-teal/40 shadow-xs' 
                                                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                {/* Left: Avatar & Info */}
                                                <div className="flex items-center space-x-3.5">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                                                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="text-sm font-extrabold text-dark-slate">
                                                                {staff.firstName} {staff.lastName}
                                                            </h5>
                                                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                                                @{staff.username}
                                                            </span>
                                                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                                                staff.isActive 
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                                                                    : 'bg-slate-200 text-slate-600'
                                                            }`}>
                                                                {staff.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>

                                                        {/* Shift Timing & Contact */}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                                                            <span className="flex items-center gap-1 font-semibold text-teal-700">
                                                                <Clock className="w-3 h-3 text-teal-600" />
                                                                {staff.shiftTiming || 'General Shift'}
                                                            </span>
                                                            {staff.phone && (
                                                                <span className="flex items-center gap-1 font-medium text-slate-600">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    {staff.phone}
                                                                </span>
                                                            )}
                                                            {staff.email && (
                                                                <span className="flex items-center gap-1 font-medium text-slate-600 hidden md:flex">
                                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                                    {staff.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex items-center gap-2 self-end sm:self-center">
                                                    {/* Permissions Editor Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPermissions(staff)}
                                                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:border-primary-teal transition-all flex items-center gap-1.5 cursor-pointer"
                                                        title="Configure dynamic page & button permissions"
                                                    >
                                                        <ShieldCheck className="w-3.5 h-3.5 text-primary-teal" />
                                                        <span>Permissions</span>
                                                    </button>

                                                    {/* Reset Password Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setResetPwStaff(staff);
                                                            setNewPassword('Dental@' + Math.floor(1000 + Math.random() * 9000));
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                        title="Doctor authority to reset receptionist password"
                                                    >
                                                        <Key className="w-3.5 h-3.5 text-amber-700" />
                                                        <span>Reset PW</span>
                                                    </button>

                                                    {/* Toggle Active Switch */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActive(staff.id || staff.doctorID)}
                                                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                                            staff.isActive 
                                                                ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-200' 
                                                                : 'text-slate-400 hover:bg-slate-200 border-slate-300'
                                                        }`}
                                                        title={staff.isActive ? "Click to suspend account" : "Click to activate account"}
                                                    >
                                                        {staff.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                                                    </button>

                                                    {/* Delete Staff */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteStaff(staff.id || staff.doctorID, staff.firstName)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Delete staff member"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quick Permissions Overview Bar */}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                                <span className="text-slate-400 text-[9px] uppercase font-bold mr-1">Access:</span>
                                                <span className={`px-2 py-0.5 rounded-md ${staff.permissions?.pages?.directory ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                                    Directory
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md ${staff.permissions?.pages?.appointments ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                                    Appointments
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md ${staff.permissions?.pages?.treatmentPricing ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                                    Quotes & Pricing
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md ${staff.permissions?.pages?.whatsappHub ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                                    WhatsApp
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md ${staff.permissions?.pages?.chart ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-slate-100 text-slate-400'}`}>
                                                    3D Chart: {staff.permissions?.pages?.chart ? 'Allowed' : 'Locked'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md ${staff.permissions?.features?.canApplyDiscount ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                                    Discounts: {staff.permissions?.features?.canApplyDiscount ? 'Authorized' : 'Locked'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* TAB 1 SUB-VIEW: PERMISSIONS MATRIX EDITOR */}
                        {selectedStaffForPerms && tempPerms && (
                            <div className="space-y-4 animate-in fade-in duration-150">
                                {/* Header of Matrix */}
                                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary-teal text-white font-extrabold text-sm flex items-center justify-center">
                                            {selectedStaffForPerms.firstName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-extrabold text-dark-slate">
                                                Configuring Permissions for {selectedStaffForPerms.firstName} {selectedStaffForPerms.lastName}
                                            </h4>
                                            <p className="text-[11px] text-slate-400">
                                                Username: <strong>@{selectedStaffForPerms.username}</strong> • Shift: <strong>{selectedStaffForPerms.shiftTiming}</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStaffForPerms(null)}
                                        className="text-xs font-bold text-slate-500 hover:text-dark-slate cursor-pointer"
                                    >
                                        ← Back to Roster
                                    </button>
                                </div>

                                {/* Preset Buttons */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Permission Presets:</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {Object.entries(PERMISSION_PRESETS).map(([key, p]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleApplyPreset(key)}
                                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer shadow-2xs hover:border-primary-teal"
                                            >
                                                <p className="text-xs font-extrabold text-dark-slate">{p.label}</p>
                                                <p className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Granular Categories */}
                                {PERMISSION_DEFINITIONS.map((cat, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-dark-slate uppercase tracking-wide">
                                                {cat.category}
                                            </span>
                                            <span className="text-[10px] text-slate-400">Doctor Discretion</span>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {cat.items.map((item) => {
                                                const catKey = idx === 0 ? 'pages' : 'features';
                                                const isEnabled = Boolean(tempPerms[catKey]?.[item.key]);

                                                return (
                                                    <div key={item.key} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                                                        <div className="pr-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-xs font-bold text-dark-slate">{item.label}</p>
                                                                {item.clinical && (
                                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                                        Clinical Diagnostic
                                                                    </span>
                                                                )}
                                                                {item.danger && (
                                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                                                        High Risk
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-500">{item.desc}</p>
                                                        </div>

                                                        {/* Toggle Switch */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePerm(catKey, item.key)}
                                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                isEnabled ? 'bg-primary-teal' : 'bg-slate-200'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Pinned Save Permissions Bar */}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStaffForPerms(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSavePermissions}
                                        className="px-5 py-2 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save Permissions for {selectedStaffForPerms.firstName}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: REGISTER NEW RECEPTIONIST FORM */}
                        {activeTab === 'add' && (
                            <form onSubmit={handleCreateStaff} className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                                        Onboard a New Clinic Receptionist
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        This account will be tied to your doctor profile. You can register multiple receptionists for different shifts.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">First Name *</label>
                                        <input
                                            type="text"
                                            value={newStaff.firstName}
                                            onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                                            placeholder="e.g. Amina"
                                            required
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Last Name</label>
                                        <input
                                            type="text"
                                            value={newStaff.lastName}
                                            onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                                            placeholder="e.g. Bilal"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Login Username *</label>
                                        <input
                                            type="text"
                                            value={newStaff.username}
                                            onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                            placeholder="e.g. reception_amina"
                                            required
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Initial Password *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newStaff.password}
                                                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                                placeholder="e.g. Dental@2026"
                                                required
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewStaff({ ...newStaff, password: 'Dental@' + Math.floor(1000 + Math.random() * 9000) })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary-teal hover:underline cursor-pointer"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Assigned Shift Timing *</label>
                                        <select
                                            value={newStaff.shiftTiming}
                                            onChange={(e) => setNewStaff({ ...newStaff, shiftTiming: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        >
                                            <option value="Morning Shift (09:00 AM - 02:00 PM)">Morning Shift (09:00 AM - 02:00 PM)</option>
                                            <option value="Evening Shift (03:00 PM - 09:00 PM)">Evening Shift (03:00 PM - 09:00 PM)</option>
                                            <option value="Full Day Practice (09:00 AM - 06:00 PM)">Full Day Practice (09:00 AM - 06:00 PM)</option>
                                            <option value="Weekend Shift (Saturday & Sunday)">Weekend Shift (Saturday & Sunday)</option>
                                            <option value="Night Emergency Shift">Night Emergency Shift</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Initial Permission Preset</label>
                                        <select
                                            value={newStaff.preset}
                                            onChange={(e) => setNewStaff({ ...newStaff, preset: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        >
                                            <option value="STANDARD">Standard Front-Desk (Intake, Booking, Pricing)</option>
                                            <option value="BILLING_ONLY">Billing & Quotations Only</option>
                                            <option value="SENIOR_RECEPTIONIST">Senior Receptionist (Includes 3D Chart & Discounts)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Phone</label>
                                        <input
                                            type="text"
                                            value={newStaff.phone}
                                            onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                            placeholder="+92 334 5081202"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            value={newStaff.email}
                                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                            placeholder="reception@clinic.com"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-teal bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('roster')}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingStaff}
                                        className="px-5 py-2 rounded-xl bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>{creatingStaff ? 'Registering...' : 'Register Staff Member'}</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* 🌟 3. PINNED FOOTER */}
                    <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-between shrink-0">
                        <div className="text-[11px] text-slate-500 font-medium">
                            Authority Level: <strong className="text-teal-700">Attending Clinician / Practice Principal</strong>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 text-dark-slate text-xs font-bold transition-colors cursor-pointer"
                        >
                            Close Manager
                        </button>
                    </div>

                    {/* MODAL: RESET PASSWORD DIALOG */}
                    {resetPwStaff && (
                        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-100 space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-extrabold text-dark-slate flex items-center gap-1.5">
                                        <Key className="w-4 h-4 text-amber-600" />
                                        <span>Reset Staff Password</span>
                                    </h4>
                                    <button onClick={() => { setResetPwStaff(null); setNewPassword(''); setConfirmPassword(''); }} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Set a new secure password for <strong>{resetPwStaff.firstName} {resetPwStaff.lastName}</strong> (@{resetPwStaff.username}).
                                </p>

                                <form onSubmit={handleResetPassword} className="space-y-3">
                                    {/* New Password */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase">
                                            <span>New Password</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
                                                    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
                                                    const numbers = '23456789';
                                                    const symbols = '!@#$%&*';
                                                    const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
                                                    const pass = `Dental#${rand(uppercase)}${rand(numbers)}${rand(symbols)}${rand(numbers)}${rand(lowercase)}`;
                                                    setNewPassword(pass);
                                                    setConfirmPassword(pass);
                                                }}
                                                className="text-amber-700 hover:underline cursor-pointer flex items-center gap-0.5"
                                            >
                                                <Sparkles className="w-2.5 h-2.5" />
                                                <span>Generate Strong</span>
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min 8 chars with upper, lower, number, symbol"
                                                required
                                                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                            >
                                                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase">
                                            <span>Confirm Password</span>
                                            {confirmPassword.length > 0 && (
                                                <span className={staffPasswordPolicy.matches ? 'text-emerald-600' : 'text-rose-600'}>
                                                    {staffPasswordPolicy.matches ? '✓ Match' : '✕ No Match'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter to confirm"
                                                required
                                                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Policy Checklist */}
                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] grid grid-cols-2 gap-1 font-semibold">
                                        <span className={staffPasswordPolicy.minLength ? 'text-emerald-700' : 'text-slate-400'}>
                                            {staffPasswordPolicy.minLength ? '✓' : '•'} 8+ characters
                                        </span>
                                        <span className={staffPasswordPolicy.hasUpper ? 'text-emerald-700' : 'text-slate-400'}>
                                            {staffPasswordPolicy.hasUpper ? '✓' : '•'} Uppercase (A-Z)
                                        </span>
                                        <span className={staffPasswordPolicy.hasLower ? 'text-emerald-700' : 'text-slate-400'}>
                                            {staffPasswordPolicy.hasLower ? '✓' : '•'} Lowercase (a-z)
                                        </span>
                                        <span className={staffPasswordPolicy.hasNumber ? 'text-emerald-700' : 'text-slate-400'}>
                                            {staffPasswordPolicy.hasNumber ? '✓' : '•'} Number (0-9)
                                        </span>
                                        <span className={`col-span-2 ${staffPasswordPolicy.hasSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {staffPasswordPolicy.hasSpecial ? '✓' : '•'} Special char (!@#$%...)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setResetPwStaff(null); setNewPassword(''); setConfirmPassword(''); }}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!isStaffPasswordValid || resettingPw}
                                            className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                                                isStaffPasswordValid && !resettingPw 
                                                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {resettingPw ? 'Saving...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
}

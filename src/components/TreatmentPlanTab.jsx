import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock, CheckCircle2, Play, Check, AlertCircle,
    Sparkles, Plus, X, Trash2, RefreshCw, Banknote,
    Mic, Lock, Stethoscope, Zap, TrendingUp,
    Activity, DollarSign, Target
} from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';
import { TOOTH_NAMES } from './PatientTreatmentInvoiceTab';

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
    draft:       { label: 'Draft',       color: '#8B5CF6', bg: '#F5F3FF', border: '#C4B5FD', dot: 'pulse' },
    proposed:    { label: 'Proposed',    color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', dot: '' },
    accepted:    { label: 'Accepted',    color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD', dot: '' },
    in_progress: { label: 'In Progress', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', dot: 'ping' },
    completed:   { label: 'Completed',   color: '#6B7280', bg: '#F9FAFB', border: '#D1D5DB', dot: '' },
    declined:    { label: 'Declined',    color: '#EF4444', bg: '#FFF1F2', border: '#FECDD3', dot: '' },
    cancelled:   { label: 'Cancelled',   color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', dot: '' },
};

const CAT_COLORS = {
    restorative:  ['#FEF3C7', '#92400E', '#FDE68A'],
    ortho:        ['#EDE9FE', '#5B21B6', '#DDD6FE'],
    whitening:    ['#FEE2E2', '#991B1B', '#FECACA'],
    endo:         ['#DBEAFE', '#1E40AF', '#BFDBFE'],
    surgery:      ['#FCE7F3', '#9D174D', '#FBCFE8'],
    periodontal:  ['#D1FAE5', '#065F46', '#A7F3D0'],
    consultation: ['#F3F4F6', '#374151', '#E5E7EB'],
};
const catColor = (cat) => CAT_COLORS[(cat||'').toLowerCase()] || ['#F1F5F9', '#475569', '#CBD5E1'];

const PIPELINE = [
    { key: 'draft',       label: 'Draft' },
    { key: 'proposed',    label: 'Proposed' },
    { key: 'accepted',    label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 10,
    border: '1px solid #E2E8F0', background: '#F8FAFC',
    fontSize: 13, fontWeight: 600, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const selectStyle = { ...inputStyle };

// ─── Sub-Components ───────────────────────────────────────────────────────────
function ActionBtn({ label, icon: Icon, color, loading, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick} disabled={loading}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 9,
                background: hov ? color : `${color}18`,
                border: `1px solid ${color}40`,
                color: hov ? '#fff' : color,
                fontSize: 11, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
                boxShadow: hov ? `0 2px 8px ${color}40` : 'none',
            }}>
            {loading
                ? <RefreshCw size={11} style={{ animation: 'tp-spin 0.8s linear infinite' }} />
                : <Icon size={11} />}
            {label}
        </button>
    );
}

function IconBtn({ icon: Icon, color, title, onClick, disabled }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick} disabled={disabled} title={title}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: hov ? `${color}15` : 'transparent',
                border: `1px solid ${hov ? color + '50' : '#F1F5F9'}`,
                color: hov ? color : '#94A3B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            }}>
            <Icon size={13} />
        </button>
    );
}

function ModalOverlay({ children, onClose }) {
    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
            <div style={{
                background: '#fff', borderRadius: 20, width: '100%', maxHeight: '90vh',
                overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                animation: 'tp-scaleUp 0.2s ease',
            }}>
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ icon: Icon, title, subtitle, onClose, danger }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
            background: danger ? '#FFF1F2' : '#FAFAFA',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: danger ? '#FEE2E2' : 'linear-gradient(135deg,#EFF6FF,#F5F3FF)',
                    border: `1px solid ${danger ? '#FECACA' : '#DBEAFE'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={16} color={danger ? '#EF4444' : '#3B82F6'} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{title}</div>
                    {subtitle && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{subtitle}</div>}
                </div>
            </div>
            <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#fff', cursor: 'pointer', color: '#94A3B8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <X size={14} />
            </button>
        </div>
    );
}

function FormRow({ label, children }) {
    return (
        <div>
            <label style={{
                display: 'block', fontSize: 10, fontWeight: 700, color: '#64748B',
                marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{label}</label>
            {children}
        </div>
    );
}

function ModalFooter({ onCancel, submitLabel, loading }) {
    return (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={onCancel} style={{
                padding: '8px 18px', borderRadius: 10, background: '#F1F5F9',
                border: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
                background: loading ? '#94A3B8' : 'linear-gradient(135deg,#3B82F6,#6366F1)',
                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(99,102,241,0.3)',
            }}>
                {loading ? 'Saving…' : submitLabel}
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TreatmentPlanTab({
    patientId,
    patient,
    doctorId = 1,
    userRole = 'doctor',
    categoryFilter = null,
    onClearCategoryFilter,
    onTreatmentStatusChange,
    onNavigateToInvoices
}) {
    const [loading, setLoading] = useState(true);
    const [treatmentItems, setTreatmentItems] = useState([]);
    const [unplannedFindings, setUnplannedFindings] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [actionLoading, setActionLoading] = useState({});
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'ALL');
    const [showCatalogModal, setShowCatalogModal] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [paymentModalItem, setPaymentModalItem] = useState(null);
    const [cancelModalItem, setCancelModalItem] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [savingItem, setSavingItem] = useState(false);
    const [showFindings, setShowFindings] = useState(false);
    // Catalog form
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [catalogTooth, setCatalogTooth] = useState('0');
    const [catalogPrice, setCatalogPrice] = useState('');
    const [catalogVisits, setCatalogVisits] = useState('1');
    const [catalogNote, setCatalogNote] = useState('');
    // Custom form
    const [customName, setCustomName] = useState('');
    const [customCategory, setCustomCategory] = useState('restorative');
    const [customTooth, setCustomTooth] = useState('0');
    const [customPrice, setCustomPrice] = useState('');
    const [customVisits, setCustomVisits] = useState('1');
    const [customNote, setCustomNote] = useState('');
    // Payment form
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');

    const isDoctorOrAdmin = userRole === 'doctor' || userRole === 'admin' || userRole === 'Dentist';
    const fmtMoney = (n) => `Rs ${(Number(n) || 0).toLocaleString('en-PK')}`;

    useEffect(() => { if (categoryFilter) setSelectedCategory(categoryFilter.toUpperCase()); }, [categoryFilter]);

    // ── Data Fetching ─────────────────────────────────────────────────────────
    const fetchPlanData = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [iR, fR, cR] = await Promise.all([
                fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items?view=plan`),
                fetch(`${API_BASE_URL}/api/patients/${patientId}/findings/unplanned`),
                fetch(`${API_BASE_URL}/api/treatment-catalog`),
            ]);
            if (iR.ok) {
                const data = await iR.json();
                setTreatmentItems((Array.isArray(data) ? data : []).map(i => ({
                    ...i,
                    id: i.id || i.treatmentItemID || i.treatmentItemId,
                    treatmentItemID: i.treatmentItemID || i.id || i.treatmentItemId,
                    name: i.name || i.procedureName || 'Treatment',
                    toothNo: i.toothNo !== undefined ? i.toothNo : (i.toothNumber || 0),
                    finalPrice: i.finalPrice || i.estimatedPrice || 0,
                    estimatedPrice: i.estimatedPrice || i.finalPrice || 0,
                    paid: i.paid || 0,
                    balance: i.balance !== undefined ? i.balance : Math.max(0, (i.finalPrice || i.estimatedPrice || 0) - (i.paid || 0)),
                })));
            }
            if (fR.ok) setUnplannedFindings(await fR.json().then(d => Array.isArray(d) ? d : []));
            if (cR.ok) setCatalog(await cR.json().then(d => Array.isArray(d) ? d : []));
        } catch (err) { console.error('fetchPlanData:', err); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchPlanData(); }, [patientId]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const showToast = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    };

    const resolveId = (raw) =>
        typeof raw === 'object' && raw !== null
            ? (raw.id || raw.treatmentItemID || raw.treatmentItemId)
            : raw;

    const handleStatusTransition = async (rawId, newStatus, reason = null) => {
        const itemId = resolveId(rawId);
        if (!itemId) { showToast('error', 'Invalid procedure identifier.'); return; }
        setActionLoading(p => ({ ...p, [itemId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/treatment-items/${itemId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: doctorId || 1, userRole: userRole || 'Doctor', status: newStatus, closedReason: reason }),
            });
            if (res.ok) {
                const d = await res.json();
                showToast('success', d.message || `Status updated.`);
                await fetchPlanData();
                if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else {
                const e = await res.json().catch(() => ({}));
                showToast('error', e.message || (e.errors ? Object.values(e.errors).flat().join(', ') : '') || e.title || 'Failed.');
            }
        } catch { showToast('error', 'Network error.'); }
        finally { setActionLoading(p => ({ ...p, [itemId]: false })); }
    };

    const handleAddFromCatalog = async (e) => {
        e.preventDefault();
        const sel = catalog.find(c => String(c.id) === String(selectedCatalogId));
        if (!sel) { showToast('error', 'Select a procedure.'); return; }
        setSavingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, doctorId, catalogId: sel.id, name: sel.name, category: sel.category, toothNo: parseInt(catalogTooth, 10) || 0, source: 'manual', estimatedPrice: parseInt(catalogPrice, 10) || sel.defaultPrice, finalPrice: parseInt(catalogPrice, 10) || sel.defaultPrice, plannedVisits: parseInt(catalogVisits, 10) || sel.defaultVisits || 1, status: 'proposed', priceNote: catalogNote }),
            });
            if (res.ok) {
                showToast('success', `Added "${sel.name}"`);
                setShowCatalogModal(false); setSelectedCatalogId(''); setCatalogTooth('0'); setCatalogPrice(''); setCatalogNote('');
                await fetchPlanData(); if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else { const e = await res.json().catch(() => ({})); showToast('error', e.message || 'Failed.'); }
        } catch { showToast('error', 'Network error.'); }
        finally { setSavingItem(false); }
    };

    const handleAddCustom = async (e) => {
        e.preventDefault();
        if (!customName.trim()) { showToast('error', 'Name required.'); return; }
        setSavingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, doctorId, name: customName.trim(), category: customCategory, toothNo: parseInt(customTooth, 10) || 0, source: 'manual', estimatedPrice: parseInt(customPrice, 10) || 0, finalPrice: parseInt(customPrice, 10) || 0, plannedVisits: parseInt(customVisits, 10) || 1, status: 'proposed', priceNote: customNote }),
            });
            if (res.ok) {
                showToast('success', `Added "${customName}"`);
                setShowCustomModal(false); setCustomName(''); setCustomTooth('0'); setCustomPrice(''); setCustomNote('');
                await fetchPlanData(); if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else { const e = await res.json().catch(() => ({})); showToast('error', e.message || 'Failed.'); }
        } catch { showToast('error', 'Network error.'); }
        finally { setSavingItem(false); }
    };

    const handleAddFindingToPlan = async (finding) => {
        setActionLoading(p => ({ ...p, [`f_${finding.toothNumber}`]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/treatment-items`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, doctorId, name: finding.suggestedProcedureName, category: 'restorative', procedureCode: finding.suggestedProcedureCode, toothNo: finding.toothNumber, source: 'chart_save', sourceRef: `Finding: ${finding.conditionStatus}`, estimatedPrice: finding.estimatedPrice, finalPrice: finding.estimatedPrice, plannedVisits: 1, status: 'proposed', priceNote: finding.comments || `From chart: ${finding.conditionStatus}` }),
            });
            if (res.ok) {
                showToast('success', `Added Tooth #${finding.toothNumber} to plan.`);
                setShowFindings(false); await fetchPlanData(); if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else { const e = await res.json().catch(() => ({})); showToast('error', e.message || 'Failed.'); }
        } catch { showToast('error', 'Network error.'); }
        finally { setActionLoading(p => ({ ...p, [`f_${finding.toothNumber}`]: false })); }
    };

    const handleRecordAdvance = async (e) => {
        e.preventDefault();
        const amt = parseInt(paymentAmount, 10);
        if (!paymentModalItem || !amt || amt <= 0) { showToast('error', 'Enter a valid amount.'); return; }
        const targetId = resolveId(paymentModalItem);
        if (!targetId) { showToast('error', 'Invalid reference.'); return; }
        setSavingItem(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/payments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, amount: amt, method: paymentMethod, receivedBy: doctorId || 1, note: paymentNotes || `Advance for ${paymentModalItem.name || 'treatment'}`, allocations: [{ treatmentItemId: targetId, amount: Math.min(amt, paymentModalItem.balance || paymentModalItem.finalPrice) }] }),
            });
            if (res.ok) {
                const d = await res.json(); showToast('success', d.message || 'Payment recorded!');
                setPaymentModalItem(null); setPaymentAmount(''); setPaymentNotes('');
                await fetchPlanData(); if (onTreatmentStatusChange) onTreatmentStatusChange();
            } else { const e = await res.json().catch(() => ({})); showToast('error', e.message || (e.errors ? Object.values(e.errors).flat().join(', ') : '') || 'Payment failed.'); }
        } catch { showToast('error', 'Network error.'); }
        finally { setSavingItem(false); }
    };

    // ── Derived Data ──────────────────────────────────────────────────────────
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'ALL') return treatmentItems;
        return treatmentItems.filter(i => (i.category || '').toUpperCase() === selectedCategory);
    }, [treatmentItems, selectedCategory]);

    const totalPlanned = useMemo(() => treatmentItems.reduce((a, i) => a + (Number(i.finalPrice || i.estimatedPrice) || 0), 0), [treatmentItems]);
    const totalPaid = useMemo(() => treatmentItems.reduce((a, i) => a + (Number(i.paid) || 0), 0), [treatmentItems]);
    const totalBalance = Math.max(0, totalPlanned - totalPaid);

    const availableCats = useMemo(() => {
        const s = new Set();
        treatmentItems.forEach(i => { if (i.category) s.add(i.category.toUpperCase()); });
        return Array.from(s);
    }, [treatmentItems]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif", background: '#F8FAFC' }}>

            {/* Toast */}
            {feedback.message && (
                <div style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: feedback.type === 'success' ? '#ECFDF5' : '#FFF1F2',
                    border: `1px solid ${feedback.type === 'success' ? '#6EE7B7' : '#FECDD3'}`,
                    color: feedback.type === 'success' ? '#065F46' : '#9F1239',
                    padding: '12px 16px', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    fontSize: 13, fontWeight: 600, maxWidth: 380, animation: 'tp-slideIn 0.3s ease',
                }}>
                    {feedback.type === 'success'
                        ? <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                        : <AlertCircle size={16} style={{ color: '#E11D48', flexShrink: 0 }} />}
                    <span>{feedback.message}</span>
                    <button onClick={() => setFeedback({ type: '', message: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6 }}><X size={14} /></button>
                </div>
            )}

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #E9EFF6', background: '#fff', flexShrink: 0, flexWrap: 'wrap' }}>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={15} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>Treatment Plan</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{treatmentItems.length} procedure{treatmentItems.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                {/* KPI chips */}
                <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Planned', val: fmtMoney(totalPlanned), icon: TrendingUp, clr: '#3B82F6' },
                        { label: 'Advance', val: fmtMoney(totalPaid),    icon: Banknote,   clr: '#059669' },
                        { label: 'Balance', val: fmtMoney(totalBalance), icon: DollarSign, clr: '#F59E0B' },
                    ].map(k => (
                        <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F8FAFC', borderRadius: 9, padding: '5px 11px', border: '1px solid #EEF2FF' }}>
                            <k.icon size={12} color={k.clr} />
                            <div>
                                <div style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.label}</div>
                                <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{k.val}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {unplannedFindings.length > 0 && (
                        <button onClick={() => setShowFindings(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#EA580C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <Stethoscope size={12} />
                            Findings
                            <span style={{ background: '#EA580C', color: '#fff', borderRadius: 999, fontSize: 8.5, fontWeight: 800, padding: '1px 5px' }}>{unplannedFindings.length}</span>
                        </button>
                    )}
                    <button onClick={() => setShowCatalogModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                        <Plus size={12} />Add
                    </button>
                    <button onClick={() => setShowCustomModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #E2E8F0' }}>
                        <Zap size={12} />Custom
                    </button>
                    <button
                        onClick={async () => {
                            setActionLoading(p => ({ ...p, sync: true }));
                            try {
                                const r = await fetch(`${API_BASE_URL}/api/patients/${patientId}/sync-directory?doctorId=${doctorId}`, { method: 'POST' });
                                if (r.ok) { const d = await r.json(); showToast('success', d.message); await fetchPlanData(); if (onTreatmentStatusChange) onTreatmentStatusChange(); }
                            } catch { showToast('error', 'Sync error.'); }
                            finally { setActionLoading(p => ({ ...p, sync: false })); }
                        }}
                        disabled={actionLoading.sync} title="Sync from directory"
                        style={{ width: 32, height: 32, borderRadius: 9, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={13} style={actionLoading.sync ? { animation: 'tp-spin 0.8s linear infinite' } : {}} />
                    </button>
                </div>
            </div>

            {/* ── Category Tabs ────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 3, padding: '7px 18px', background: '#FAFBFC', borderBottom: '1px solid #EEF2F7', flexShrink: 0, overflowX: 'auto' }}>
                {['ALL', ...availableCats].map(cat => {
                    const active = selectedCategory === cat;
                    const cnt = cat === 'ALL' ? treatmentItems.length : treatmentItems.filter(i => (i.category || '').toUpperCase() === cat).length;
                    return (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 7,
                            border: active ? '1px solid #3B82F6' : '1px solid transparent',
                            background: active ? '#EFF6FF' : 'transparent',
                            color: active ? '#1D4ED8' : '#64748B',
                            fontSize: 10.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all 0.12s',
                        }}>
                            {cat}
                            <span style={{ background: active ? '#3B82F6' : '#E2E8F0', color: active ? '#fff' : '#64748B', borderRadius: 999, fontSize: 8.5, fontWeight: 800, padding: '0 5px', lineHeight: '16px' }}>{cnt}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Item List ────────────────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                        <div style={{ width: 38, height: 38, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'tp-spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Loading treatment plan…</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, minHeight: 200 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #DBEAFE' }}>
                            <Sparkles size={22} color="#6366F1" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>No procedures yet</div>
                            <div style={{ fontSize: 11.5, color: '#94A3B8', maxWidth: 240 }}>Click <strong>Add</strong> to select from catalog, or <strong>Custom</strong> for a freeform entry.</div>
                        </div>
                        <button onClick={() => setShowCatalogModal(true)} style={{ padding: '8px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                            <Plus size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />Add Procedure
                        </button>
                    </div>
                ) : filteredItems.map(item => {
                    const itemId = item.id || item.treatmentItemID || item.treatmentItemId;
                    const isBusy = !!actionLoading[itemId];
                    const toothNo = item.toothNo !== undefined ? item.toothNo : (item.toothNumber || 0);
                    const name = item.name || item.procedureName || 'Treatment';
                    const price = item.finalPrice || item.estimatedPrice || 0;
                    const paid = item.paid || 0;
                    const bal = item.balance !== undefined ? item.balance : Math.max(0, price - paid);
                    const cfg = STATUS_CFG[item.status] || STATUS_CFG.proposed;
                    const [cbg, ctxt, cbrd] = catColor(item.category);
                    const paidPct = price > 0 ? Math.min(100, Math.round((paid / price) * 100)) : 0;
                    const stIdx = PIPELINE.findIndex(p => p.key === item.status);

                    return (
                        <div key={itemId} style={{ background: '#fff', borderRadius: 13, border: '1px solid #F1F5F9', borderLeft: `3px solid ${cfg.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', transition: 'box-shadow 0.18s, transform 0.13s' }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                            {/* Payment progress bar */}
                            {price > 0 && (
                                <div style={{ height: 2, background: '#F1F5F9' }}>
                                    <div style={{ height: '100%', width: `${paidPct}%`, background: 'linear-gradient(90deg,#10B981,#34D399)', transition: 'width 0.6s ease', borderRadius: '0 2px 2px 0' }} />
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px' }}>

                                {/* Tooth badge */}
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: 7.5, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>{toothNo > 0 ? 'T' : 'All'}</span>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: cfg.color, lineHeight: 1.1 }}>{toothNo > 0 ? toothNo : '∀'}</span>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{name}</span>
                                        {item.category && <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: cbg, color: ctxt, border: `1px solid ${cbrd}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category}</span>}
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                            {cfg.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: cfg.dot === 'ping' ? 'tp-ping 1s ease-in-out infinite' : 'tp-pulse 2s ease-in-out infinite' }} />}
                                            {cfg.label}
                                        </span>
                                        {item.source === 'voice' && <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: '#F5F3FF', color: '#7C3AED' }}>AI</span>}
                                        {item.source === 'directory' && <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: '#EFF6FF', color: '#1D4ED8' }}>DIR</span>}
                                    </div>

                                    {/* Mini pipeline */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        {PIPELINE.map((step, idx) => (
                                            <div key={step.key} style={{ height: 3, width: idx === stIdx ? 18 : 12, borderRadius: 2, background: idx <= stIdx ? cfg.color : '#E2E8F0', opacity: idx <= stIdx ? 1 : 0.35, transition: 'all 0.25s' }} title={step.label} />
                                        ))}
                                        <span style={{ fontSize: 8.5, color: '#94A3B8', marginLeft: 5, fontWeight: 600 }}>
                                            {toothNo > 0 ? `T#${toothNo}` : 'Full Arch'}
                                            {item.plannedVisits > 1 && ` · ${item.plannedVisits}v`}
                                        </span>
                                    </div>

                                    {item.priceNote && <div style={{ fontSize: 9.5, color: '#94A3B8', fontStyle: 'italic', marginTop: 1 }}>"{item.priceNote}"</div>}
                                </div>

                                {/* Financials */}
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee</div>
                                        <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0F172A' }}>{fmtMoney(price)}</div>
                                    </div>
                                    {paid > 0 && <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 8.5, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
                                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669' }}>{fmtMoney(paid)}</div>
                                    </div>}
                                    {bal > 0 && <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 8.5, color: '#DC2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due</div>
                                        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#DC2626' }}>{fmtMoney(bal)}</div>
                                    </div>}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    {item.status === 'draft' && isDoctorOrAdmin && (
                                        <ActionBtn label="Confirm" icon={Check} color="#7C3AED" loading={isBusy} onClick={() => handleStatusTransition(itemId, 'proposed')} />
                                    )}
                                    {item.status === 'proposed' && (<>
                                        <ActionBtn label="Accept" icon={CheckCircle2} color="#2563EB" loading={isBusy} onClick={() => handleStatusTransition(itemId, 'accepted')} />
                                        <ActionBtn label="Pay" icon={Banknote} color="#059669" loading={isBusy} onClick={() => { setPaymentModalItem(item); setPaymentAmount(String(bal > 0 ? bal : price)); }} />
                                        <IconBtn icon={X} color="#EF4444" title="Decline" onClick={() => handleStatusTransition(itemId, 'declined', 'Patient declined')} disabled={isBusy} />
                                    </>)}
                                    {item.status === 'accepted' && (<>
                                        <ActionBtn label="Start" icon={Play} color="#2563EB" loading={isBusy} onClick={() => handleStatusTransition(itemId, 'in_progress')} />
                                        <IconBtn icon={Banknote} color="#059669" title="Add Advance" onClick={() => { setPaymentModalItem(item); setPaymentAmount(String(bal > 0 ? bal : price)); }} />
                                        <IconBtn icon={Trash2} color="#EF4444" title="Cancel" onClick={() => { setCancelModalItem(item); setCancelReason(''); }} disabled={isBusy} />
                                    </>)}
                                    {item.status === 'in_progress' && (<>
                                        <IconBtn icon={Banknote} color="#059669" title="Payment" onClick={() => { setPaymentModalItem(item); setPaymentAmount(String(bal > 0 ? bal : price)); }} />
                                        {isDoctorOrAdmin
                                            ? <ActionBtn label="Done" icon={Check} color="#059669" loading={isBusy} onClick={() => handleStatusTransition(itemId, 'completed')} />
                                            : <span style={{ fontSize: 9.5, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><Lock size={9} />Dr only</span>
                                        }
                                        <IconBtn icon={Trash2} color="#EF4444" title="Cancel" onClick={() => { setCancelModalItem(item); setCancelReason(''); }} disabled={isBusy} />
                                    </>)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─────────────────── MODALS ─────────────────────────────────────── */}

            {/* Clinical Findings */}
            {showFindings && (
                <ModalOverlay onClose={() => setShowFindings(false)}>
                    <div style={{ maxWidth: 520 }}>
                        <ModalHeader icon={Stethoscope} title="Unplanned Clinical Findings" subtitle="Add chart-detected conditions to the treatment plan" onClose={() => setShowFindings(false)} />
                        <div style={{ overflowY: 'auto', maxHeight: 360, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {unplannedFindings.map((f, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#FFFBEB', borderRadius: 11, padding: '9px 13px', border: '1px solid #FDE68A' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>T#{f.toothKey || f.toothNumber}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{f.conditionStatus}</span>
                                        </div>
                                        <div style={{ fontSize: 10.5, color: '#92400E' }}>Suggest: {f.suggestedProcedureName} · {fmtMoney(f.estimatedPrice)}</div>
                                    </div>
                                    <button onClick={() => handleAddFindingToPlan(f)} disabled={actionLoading[`f_${f.toothNumber}`]} style={{ padding: '6px 13px', borderRadius: 8, background: '#F59E0B', color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                                        {actionLoading[`f_${f.toothNumber}`] ? '…' : '+ Add'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Catalog Modal */}
            {showCatalogModal && (
                <ModalOverlay onClose={() => setShowCatalogModal(false)}>
                    <div style={{ maxWidth: 480 }}>
                        <ModalHeader icon={Sparkles} title="Add from Clinic Catalog" subtitle="Select a standard procedure" onClose={() => setShowCatalogModal(false)} />
                        <form onSubmit={handleAddFromCatalog} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <FormRow label="Procedure">
                                <select value={selectedCatalogId} onChange={e => {
                                    setSelectedCatalogId(e.target.value);
                                    const it = catalog.find(c => String(c.id) === String(e.target.value));
                                    if (it) { setCatalogPrice(it.defaultPrice || ''); setCatalogVisits(it.defaultVisits || '1'); }
                                }} required style={selectStyle}>
                                    <option value="">— Choose Procedure —</option>
                                    {catalog.map(c => <option key={c.id} value={c.id}>{c.name} ({(c.category || '').toUpperCase()}) — Rs {c.defaultPrice?.toLocaleString()}</option>)}
                                </select>
                            </FormRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <FormRow label="Tooth #">
                                    <select value={catalogTooth} onChange={e => setCatalogTooth(e.target.value)} style={selectStyle}>
                                        <option value="0">0 — Full Arch</option>
                                        {Array.from({ length: 32 }, (_, i) => i + 1).map(n => <option key={n} value={n}>#{n}{TOOTH_NAMES?.[n] ? ` — ${TOOTH_NAMES[n]}` : ''}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="Fee (Rs)">
                                    <input type="number" value={catalogPrice} onChange={e => setCatalogPrice(e.target.value)} placeholder="Auto-filled" style={inputStyle} />
                                </FormRow>
                                <FormRow label="Visits">
                                    <input type="number" value={catalogVisits} onChange={e => setCatalogVisits(e.target.value)} min="1" style={inputStyle} />
                                </FormRow>
                                <FormRow label="Note (opt)">
                                    <input type="text" value={catalogNote} onChange={e => setCatalogNote(e.target.value)} placeholder="Optional" style={inputStyle} />
                                </FormRow>
                            </div>
                            <ModalFooter onCancel={() => setShowCatalogModal(false)} submitLabel="Add to Plan" loading={savingItem} />
                        </form>
                    </div>
                </ModalOverlay>
            )}

            {/* Custom Modal */}
            {showCustomModal && (
                <ModalOverlay onClose={() => setShowCustomModal(false)}>
                    <div style={{ maxWidth: 480 }}>
                        <ModalHeader icon={Zap} title="Add Custom Procedure" subtitle="Freeform clinical entry" onClose={() => setShowCustomModal(false)} />
                        <form onSubmit={handleAddCustom} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <FormRow label="Procedure Name *">
                                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Laser Splint" required style={inputStyle} />
                            </FormRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <FormRow label="Category">
                                    <select value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={selectStyle}>
                                        {['restorative','ortho','whitening','endo','surgery','periodontal','consultation'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="Tooth #">
                                    <select value={customTooth} onChange={e => setCustomTooth(e.target.value)} style={selectStyle}>
                                        <option value="0">0 — Full Arch</option>
                                        {Array.from({ length: 32 }, (_, i) => i + 1).map(n => <option key={n} value={n}>#{n}</option>)}
                                    </select>
                                </FormRow>
                                <FormRow label="Fee (Rs)">
                                    <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="0" style={inputStyle} />
                                </FormRow>
                                <FormRow label="Visits">
                                    <input type="number" value={customVisits} onChange={e => setCustomVisits(e.target.value)} min="1" style={inputStyle} />
                                </FormRow>
                            </div>
                            <FormRow label="Note (opt)">
                                <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Clinical note" style={inputStyle} />
                            </FormRow>
                            <ModalFooter onCancel={() => setShowCustomModal(false)} submitLabel="Add Custom" loading={savingItem} />
                        </form>
                    </div>
                </ModalOverlay>
            )}

            {/* Payment Modal */}
            {paymentModalItem && (
                <ModalOverlay onClose={() => setPaymentModalItem(null)}>
                    <div style={{ maxWidth: 420 }}>
                        <ModalHeader
                            icon={Banknote} title="Record Advance Payment"
                            subtitle={`${paymentModalItem.name || 'Treatment'} · ${paymentModalItem.toothNo > 0 ? `Tooth #${paymentModalItem.toothNo}` : 'Full Arch'}`}
                            onClose={() => setPaymentModalItem(null)} />
                        <form onSubmit={handleRecordAdvance} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <div style={{ background: '#F8FAFC', borderRadius: 11, padding: '11px 13px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                                <div><div style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Procedure Fee</div><div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{fmtMoney(paymentModalItem.finalPrice || 0)}</div></div>
                                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Balance Due</div><div style={{ fontSize: 15, fontWeight: 900, color: '#DC2626' }}>{fmtMoney(paymentModalItem.balance || 0)}</div></div>
                            </div>
                            <FormRow label="Amount (Rs) *">
                                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" required style={{ ...inputStyle, fontSize: 15, fontWeight: 800 }} placeholder="Enter amount" />
                            </FormRow>
                            <FormRow label="Method">
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={selectStyle}>
                                    <option value="cash">Cash Counter</option>
                                    <option value="card">Card / POS</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="easypaisa">EasyPaisa</option>
                                    <option value="jazzcash">JazzCash</option>
                                </select>
                            </FormRow>
                            <FormRow label="Note (opt)">
                                <input type="text" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="e.g. First installment" style={inputStyle} />
                            </FormRow>
                            <ModalFooter onCancel={() => setPaymentModalItem(null)} submitLabel="Confirm Payment" loading={savingItem} />
                        </form>
                    </div>
                </ModalOverlay>
            )}

            {/* Cancel Modal */}
            {cancelModalItem && (
                <ModalOverlay onClose={() => setCancelModalItem(null)}>
                    <div style={{ maxWidth: 400 }}>
                        <ModalHeader icon={Trash2} title="Cancel Treatment" subtitle={cancelModalItem.name || cancelModalItem.procedureName || 'Treatment'} onClose={() => setCancelModalItem(null)} danger />
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <FormRow label="Cancellation Reason">
                                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Why is this being cancelled?" rows={3} style={{ ...inputStyle, resize: 'none' }} />
                            </FormRow>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setCancelModalItem(null)} style={{ padding: '8px 16px', borderRadius: 10, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Back</button>
                                <button type="button" onClick={() => {
                                    const cId = resolveId(cancelModalItem);
                                    handleStatusTransition(cId, 'cancelled', cancelReason);
                                    setCancelModalItem(null);
                                }} style={{ padding: '8px 16px', borderRadius: 10, background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                    Cancel Procedure
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Keyframe definitions */}
            <style>{`
                @keyframes tp-slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
                @keyframes tp-spin    { to { transform:rotate(360deg); } }
                @keyframes tp-scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
                @keyframes tp-ping    { 0%,100%{ transform:scale(1); opacity:1; } 50%{ transform:scale(1.5); opacity:0.4; } }
                @keyframes tp-pulse   { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
            `}</style>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, Calendar, Stethoscope, Clock, FileText, ChevronRight } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';
import ToothHealthMap from '../components/ToothHealthMap';

export default function PatientOdontogramPage() {
    const [teethState, setTeethState] = useState([]);
    const [diagnosticAssessment, setDiagnosticAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');

    useEffect(() => {
        const fetchOdontogramAndAssessment = async () => {
            setLoading(true);
            try {
                const token = patient.token;
                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Fetch Odontogram Teeth States
                try {
                    let res;
                    try {
                        res = await fetch(`${API_BASE_URL}/api/patient-portal/odontogram`, { headers });
                    } catch {
                        res = await fetch(`/api/patient-portal/odontogram`, { headers });
                    }

                    if (res && res.ok) {
                        const data = await res.json();
                        setTeethState(Array.isArray(data) ? data : []);
                    }
                } catch (e) {
                    console.error('Failed to load odontogram teeth:', e);
                }

                // 2. Fetch Doctor's Diagnostic Assessment
                try {
                    let diagRes;
                    try {
                        diagRes = await fetch(`${API_BASE_URL}/api/patient-portal/diagnostic-assessment`, { headers });
                    } catch {
                        diagRes = await fetch(`/api/patient-portal/diagnostic-assessment`, { headers });
                    }

                    if (diagRes && diagRes.ok) {
                        const diagData = await diagRes.json();
                        setDiagnosticAssessment(diagData);
                    }
                } catch (e) {
                    console.error('Failed to load diagnostic assessment:', e);
                }

            } catch (err) {
                console.error('Failed to load odontogram telemetry:', err);
                setError('Could not load real-time tooth chart.');
            } finally {
                setLoading(false);
            }
        };

        fetchOdontogramAndAssessment();
    }, []);

    // Accurate calculation directly from verified chairside teeth telemetry
    const activePathologyTeeth = teethState.filter(t => {
        const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
        return s && !s.includes('healthy') && !s.includes('sound');
    });

    const treatedCount = activePathologyTeeth.filter(t => {
        const s = (t.conditionStatus || t.ConditionStatus || '').toLowerCase();
        return s.includes('restor') || s.includes('fill') || s.includes('crown') || s.includes('veneer') || s.includes('implant') || s.includes('treated');
    }).length;

    const plannedCount = activePathologyTeeth.length - treatedCount;
    const healthyCount = Math.max(0, 32 - (treatedCount + plannedCount));

    // Tooth Icon SVG matching Dentia styling
    const ToothSvg = ({ className = "w-5 h-5" }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.5 6 2 9.5.5 3 2 4.5 4 4.5s3.5-1.5 4-4.5c.5-3.5 2-6.5 2-9.5 0-3.5-2.5-6-6-6Z" />
            <path d="M9 10c1 .5 2 .5 3 0 1 .5 2 .5 3 0" />
        </svg>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        to="/portal/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-teal hover:text-primary-hover transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-dark-slate tracking-tight">
                        32-Tooth Dental Odontogram & Anatomy
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-text mt-0.5">
                        Interactive anatomical standing of your adult dentition, restored surfaces, and monitored teeth.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/portal/book"
                        className="px-4 py-2.5 bg-primary-teal hover:bg-primary-hover text-white text-xs font-bold rounded-2xl shadow-md shadow-primary-teal/20 transition-all flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Examination</span>
                    </Link>
                </div>
            </div>

            {/* Doctor's Examination & Diagnostic Assessment Banner */}
            {diagnosticAssessment && (
                <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-900 to-primary-teal text-white shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs shrink-0">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-1">
                                    Verified Clinical Examination
                                </span>
                                <h3 className="text-lg font-serif font-bold text-white tracking-tight">
                                    Doctor's Chairside Diagnostic Findings
                                </h3>
                            </div>
                        </div>

                        {diagnosticAssessment.cdtCode && (
                            <div className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/25 text-xs font-mono font-bold tracking-wider">
                                Procedure: {diagnosticAssessment.cdtCode}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs space-y-1">
                            <p className="text-[10px] font-bold text-white/75 uppercase tracking-wider">Primary Diagnosis</p>
                            <p className="font-semibold text-white leading-relaxed">
                                {diagnosticAssessment.diagnosisSummary || 'Chairside diagnostic findings recorded.'}
                            </p>
                        </div>
                        <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs space-y-1">
                            <p className="text-[10px] font-bold text-white/75 uppercase tracking-wider">Clinical Category</p>
                            <p className="font-semibold text-white capitalize">
                                {diagnosticAssessment.suiteCategory || 'General Clinical Diagnostics'}
                            </p>
                        </div>
                        <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs space-y-1">
                            <p className="text-[10px] font-bold text-white/75 uppercase tracking-wider">Examination Date</p>
                            <p className="font-semibold text-white">
                                {new Date(diagnosticAssessment.updatedAt || diagnosticAssessment.createdAt || Date.now()).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Tooth Health Visualizer Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shadow-xs">
                            <ToothSvg className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-serif font-black text-dark-slate">
                                Interactive Dental Map for {patientName}
                            </h3>
                            <p className="text-xs text-muted-text font-mono">
                                Ref: {patient.referenceNumber || 'DEN-2026-66596'} · 32 Adult Teeth
                            </p>
                        </div>
                    </div>

                    {activePathologyTeeth.length > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{activePathologyTeeth.length} Diagnosed Teeth Found</span>
                        </span>
                    )}
                </div>

                {/* Embedded Tooth Health Map */}
                <div className="bg-warm-cream p-6 rounded-3xl border border-light-teal">
                    <ToothHealthMap teeth={teethState} />
                </div>

                {/* Summary Score Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800">Healthy & Sound Teeth</p>
                            <p className="text-xl font-serif font-black text-emerald-600">{healthyCount} / 32 Teeth</p>
                        </div>
                    </div>

                    <div className="p-4 bg-light-teal rounded-2xl border border-light-teal flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary-teal shadow-2xs shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-primary-hover">Restorations & Crowns</p>
                            <p className="text-xl font-serif font-black text-primary-teal">{treatedCount} Teeth (Treated)</p>
                        </div>
                    </div>

                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-2xs shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-800">Observation & Treatment Watchlist</p>
                            <p className="text-xl font-serif font-black text-rose-600">{plannedCount} Teeth Monitored</p>
                        </div>
                    </div>
                </div>

                {/* Itemized Table of Doctor's Diagnosed Teeth */}
                {activePathologyTeeth.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-light-teal space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-serif font-black text-dark-slate flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary-teal" />
                                <span>Itemized Doctor's Clinical Findings ({activePathologyTeeth.length} Teeth)</span>
                            </h4>
                            <span className="text-xs text-muted-text font-medium">Recorded by Attending Dental Surgeon</span>
                        </div>

                        <div className="divide-y divide-light-teal border border-light-teal rounded-2xl overflow-hidden bg-white">
                            {activePathologyTeeth.map((tooth, idx) => {
                                const tNum = tooth.toothNumber ?? tooth.ToothNumber ?? tooth.toothKey;
                                const tColor = tooth.conditionColor ?? tooth.ConditionColor ?? '#EF4444';
                                const tStatus = tooth.conditionStatus ?? tooth.ConditionStatus ?? 'Observation Needed';
                                const tComment = tooth.comments ?? tooth.Comments;

                                return (
                                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-light-teal/20 transition-colors">
                                        <div className="flex items-start gap-3.5">
                                            <div 
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-mono font-black text-xs shrink-0 shadow-2xs"
                                                style={{ backgroundColor: tColor }}
                                            >
                                                #{tNum}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-bold text-dark-slate">Tooth #{tNum}</span>
                                                    <span 
                                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                                        style={{ backgroundColor: `${tColor}15`, color: tColor }}
                                                    >
                                                        {tStatus}
                                                    </span>
                                                </div>
                                                {tComment && (
                                                    <p className="text-xs text-muted-text mt-1 font-mono">
                                                        {tComment}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="self-end sm:self-center shrink-0">
                                            <span className="px-2.5 py-1 bg-warm-cream rounded-lg text-[11px] font-bold text-dark-slate border border-light-teal">
                                                Active Protocol
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

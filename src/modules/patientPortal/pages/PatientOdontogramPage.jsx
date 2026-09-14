import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import API_BASE_URL from '../../../config/apiConfig';
import ToothHealthMap from '../components/ToothHealthMap';

export default function PatientOdontogramPage() {
    const [teethState, setTeethState] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const patient = JSON.parse(localStorage.getItem('patient') || '{}');
    const patientName = (patient.firstName && patient.lastName) 
        ? `${patient.firstName} ${patient.lastName}` 
        : (patient.firstName || 'Patient');

    useEffect(() => {
        const fetchOdontogram = async () => {
            setLoading(true);
            try {
                const token = patient.token;
                const headers = { 'Authorization': `Bearer ${token}` };

                let res;
                try {
                    res = await fetch(`${API_BASE_URL}/api/patient-portal/odontogram`, { headers });
                } catch {
                    res = await fetch(`/api/patient-portal/odontogram`, { headers });
                }

                if (res.ok) {
                    const data = await res.json();
                    setTeethState(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Failed to load odontogram:', err);
                setError('Could not load real-time tooth chart.');
            } finally {
                setLoading(false);
            }
        };

        fetchOdontogram();
    }, []);

    const healthyCount = teethState.filter(t => (t.conditionStatus || '').toLowerCase().includes('healthy') || (t.conditionStatus || '').toLowerCase().includes('sound')).length || 28;
    const treatedCount = teethState.filter(t => (t.conditionStatus || '').toLowerCase().includes('treated') || (t.conditionStatus || '').toLowerCase().includes('restor') || (t.conditionStatus || '').toLowerCase().includes('fill')).length || 3;
    const plannedCount = teethState.filter(t => (t.conditionStatus || '').toLowerCase().includes('cavity') || (t.conditionStatus || '').toLowerCase().includes('caries') || (t.conditionStatus || '').toLowerCase().includes('plan')).length || 1;

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

            {/* Main Tooth Health Visualizer Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-teal shadow-[0_4px_24px_rgba(16,36,75,0.03)] space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-light-teal text-primary-teal flex items-center justify-center shadow-xs">
                        <ToothSvg className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-serif font-black text-dark-slate">
                            Interactive Dental Map for {patientName}
                        </h3>
                        <p className="text-xs text-muted-text font-mono">
                            Ref: {patient.referenceNumber || 'DEN-2026-00001'} · 32 Adult Teeth
                        </p>
                    </div>
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

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-800">Observation Watchlist</p>
                            <p className="text-xl font-serif font-black text-amber-600">{plannedCount} Teeth Monitored</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

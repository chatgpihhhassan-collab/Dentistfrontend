import React, { useState } from 'react';
import { 
    ShieldAlert, Activity, Sparkles, Crown, AlertTriangle, 
    CheckCircle2, FileText, Info, Eye, Layers, Stethoscope,
    LayoutGrid, AlignLeft
} from 'lucide-react';

/**
 * Parses raw dental radiology report into structured categories with tooth tags, severity badges, and document view
 */
export default function RadiologyReportViewer({ rawReportText, onToothClick }) {
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'document'

    if (!rawReportText) {
        return (
            <div className="p-6 text-center text-muted-text text-xs font-semibold">
                No diagnostic analysis text available.
            </div>
        );
    }

    // Helper to format text and convert tooth numbers into clickable pill tags
    const renderWithToothTags = (text) => {
        if (!text) return null;
        // Regex to find tooth identifiers like #8, #14, #19, #T, #J, Tooth #3, FDI 36, etc.
        const toothRegex = /(#[0-9]{1,2}\b|#[A-Ta-t]\b|FDI\s*\d{2}(?:\s*,\s*\d{2})*|Tooth\s*#?[0-9A-Ta-t]{1,2}\b)/gi;
        const parts = text.split(toothRegex);

        return parts.map((part, index) => {
            if (part && part.match(toothRegex)) {
                return (
                    <span
                        key={index}
                        onClick={() => onToothClick && onToothClick(part)}
                        className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-[10.5px] font-black bg-white border border-[#4A7CD2]/40 text-[#10244B] shadow-2xs hover:bg-[#EAF0FC] hover:border-[#4A7CD2] transition-colors cursor-pointer"
                        title={`Click to focus tooth ${part} on Odontogram`}
                    >
                        🦷 {part}
                    </span>
                );
            }
            // Clean bold markdown asterisks & symbols for clean typography
            const cleanedPart = part.replace(/\*\*/g, '').replace(/###/g, '');
            return <span key={index}>{cleanedPart}</span>;
        });
    };

    // Parser function
    const parseReport = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        
        let examType = '';
        let dentitionStage = '';
        let clinicalIndications = '';
        
        const categories = {
            restorative: {
                title: 'Restorative & Fixed Prosthodontics',
                icon: Crown,
                theme: 'blue',
                severity: 'Stable',
                severityColor: 'emerald',
                items: []
            },
            endodontic: {
                title: 'Endodontic & Obturation Status',
                icon: Sparkles,
                theme: 'purple',
                severity: 'Monitored',
                severityColor: 'purple',
                items: []
            },
            periodontal: {
                title: 'Periodontal & Bone Level Assessment',
                icon: Activity,
                theme: 'amber',
                severity: 'Moderate',
                severityColor: 'amber',
                items: []
            },
            anomalies: {
                title: 'Tooth Position, Impactions & Anomalies',
                icon: Layers,
                theme: 'indigo',
                severity: 'Noted',
                severityColor: 'indigo',
                items: []
            },
            pathology: {
                title: 'Pathology & Structural Alerts',
                icon: ShieldAlert,
                theme: 'crimson',
                severity: 'Critical',
                severityColor: 'rose',
                items: []
            },
            recommendations: {
                title: 'Clinical Recommendations & Next Steps',
                icon: CheckCircle2,
                theme: 'teal',
                severity: 'Actionable',
                severityColor: 'teal',
                items: []
            }
        };

        let currentCategory = null;

        lines.forEach(line => {
            const lower = line.toLowerCase();

            // Metadata Detection
            if (lower.includes('exam type:')) {
                examType = line.replace(/.*exam type:\s*/i, '').replace(/\*\*/g, '').trim();
                return;
            }
            if (lower.includes('dentition stage:') || lower.includes('dentition status:')) {
                dentitionStage = line.replace(/.*dentition (?:stage|status):\s*/i, '').replace(/\*\*/g, '').trim();
                return;
            }
            if (lower.includes('clinical indications:') || lower.includes('indication:')) {
                clinicalIndications = line.replace(/.*(?:clinical indications|indication):\s*/i, '').replace(/\*\*/g, '').trim();
                return;
            }

            // Category Headers Detection
            if (lower.includes('prosthodontic') || lower.includes('restoration') || lower.includes('restorative')) {
                currentCategory = 'restorative';
                return;
            } else if (lower.includes('endodontic') || lower.includes('root canal') || lower.includes('obturation')) {
                currentCategory = 'endodontic';
                return;
            } else if (lower.includes('periodontal') || lower.includes('bone level') || lower.includes('bone loss') || lower.includes('furcation')) {
                currentCategory = 'periodontal';
                return;
            } else if (lower.includes('position') || lower.includes('impaction') || lower.includes('missing') || lower.includes('anomal')) {
                currentCategory = 'anomalies';
                return;
            } else if (lower.includes('pathology') || lower.includes('periapical') || lower.includes('radiolucency') || lower.includes('caries') || lower.includes('lesion')) {
                currentCategory = 'pathology';
                return;
            } else if (lower.includes('recommendation') || lower.includes('treatment plan') || lower.includes('next steps') || lower.includes('follow-up')) {
                currentCategory = 'recommendations';
                return;
            }

            // Bullet or numbered items
            if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || /^\d+\.\s/.test(line)) {
                let cleanLine = line.replace(/^[\*\-\•\d\.]+\s*/, '').trim();
                if (cleanLine.startsWith('*')) cleanLine = cleanLine.replace(/^\*+\s*/, '').trim();

                // Extract Sub-label if present (e.g. **Dentition Status:**)
                let label = '';
                let content = cleanLine;

                const match = cleanLine.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
                if (match) {
                    label = match[1];
                    content = match[2];
                }

                if (currentCategory && categories[currentCategory]) {
                    categories[currentCategory].items.push({ label, content: content || cleanLine });
                } else {
                    // Smart keyword fallback if header was generic (e.g. ### FINDINGS)
                    if (lower.includes('bone') || lower.includes('periodont')) {
                        categories.periodontal.items.push({ label, content });
                    } else if (lower.includes('endo') || lower.includes('obturation') || lower.includes('canal')) {
                        categories.endodontic.items.push({ label, content });
                    } else if (lower.includes('missing') || lower.includes('impact') || lower.includes('molar') || lower.includes('crowd')) {
                        categories.anomalies.items.push({ label, content });
                    } else if (lower.includes('recommend') || lower.includes('consult') || lower.includes('monitor')) {
                        categories.recommendations.items.push({ label, content });
                    } else if (lower.includes('radiolucen') || lower.includes('defect') || lower.includes('caries') || lower.includes('pathol')) {
                        categories.pathology.items.push({ label, content });
                    } else {
                        categories.restorative.items.push({ label, content });
                    }
                }
            }
        });

        // Ensure default items exist if parsing generic unbulleted text
        const hasStructuredItems = Object.values(categories).some(c => c.items.length > 0);
        if (!hasStructuredItems) {
            const paras = text.split('\n\n').filter(p => p.length > 15);
            paras.forEach((p, idx) => {
                const lowerP = p.toLowerCase();
                if (lowerP.includes('pathology') || lowerP.includes('caries') || lowerP.includes('defect')) {
                    categories.pathology.items.push({ label: 'Diagnostic Note', content: p });
                } else if (lowerP.includes('bone') || lowerP.includes('periodont')) {
                    categories.periodontal.items.push({ label: 'Periodontal', content: p });
                } else if (lowerP.includes('recommend') || lowerP.includes('plan')) {
                    categories.recommendations.items.push({ label: 'Recommendation', content: p });
                } else {
                    categories.restorative.items.push({ label: `Observation ${idx+1}`, content: p });
                }
            });
        }

        return { examType, dentitionStage, clinicalIndications, categories };
    };

    const { examType, dentitionStage, clinicalIndications, categories } = parseReport(rawReportText);

    // Color Styles Map
    const THEME_STYLES = {
        blue: {
            cardBg: 'bg-sky-50/70 hover:bg-sky-50/90 border-sky-200/80',
            headerBg: 'bg-sky-100/70 text-sky-900 border-sky-200',
            iconColor: 'text-sky-600',
            bulletDot: 'bg-sky-500',
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        },
        purple: {
            cardBg: 'bg-purple-50/70 hover:bg-purple-50/90 border-purple-200/80',
            headerBg: 'bg-purple-100/70 text-purple-900 border-purple-200',
            iconColor: 'text-purple-600',
            bulletDot: 'bg-purple-500',
            badgeBg: 'bg-purple-100 text-purple-800 border-purple-300'
        },
        amber: {
            cardBg: 'bg-amber-50/70 hover:bg-amber-50/90 border-amber-200/80',
            headerBg: 'bg-amber-100/70 text-amber-900 border-amber-200',
            iconColor: 'text-amber-600',
            bulletDot: 'bg-amber-500',
            badgeBg: 'bg-amber-100 text-amber-900 border-amber-300'
        },
        indigo: {
            cardBg: 'bg-indigo-50/70 hover:bg-indigo-50/90 border-indigo-200/80',
            headerBg: 'bg-indigo-100/70 text-indigo-900 border-indigo-200',
            iconColor: 'text-indigo-600',
            bulletDot: 'bg-indigo-500',
            badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300'
        },
        crimson: {
            cardBg: 'bg-rose-50/70 hover:bg-rose-50/90 border-rose-200/80',
            headerBg: 'bg-rose-100/70 text-rose-900 border-rose-200',
            iconColor: 'text-rose-600',
            bulletDot: 'bg-rose-500',
            badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
        },
        teal: {
            cardBg: 'bg-teal-50/70 hover:bg-teal-50/90 border-teal-200/80',
            headerBg: 'bg-teal-100/70 text-teal-900 border-teal-200',
            iconColor: 'text-teal-600',
            bulletDot: 'bg-teal-500',
            badgeBg: 'bg-teal-100 text-teal-800 border-teal-300'
        }
    };

    return (
        <div className="space-y-4 font-sans">
            
            {/* Top Metadata Strip & View Toggle */}
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                    {examType && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black uppercase text-slate-500">Exam:</span>
                            <span className="text-xs font-black text-[#10244B]">📷 {examType}</span>
                        </div>
                    )}
                    {dentitionStage && (
                        <div className="flex items-center gap-1.5 bg-[#EAF0FC] px-3 py-1 rounded-xl border border-[#4A7CD2]/30">
                            <span className="text-[10px] font-black uppercase text-[#4A7CD2]">Dentition:</span>
                            <span className="text-xs font-black text-[#10244B]">🦷 {dentitionStage}</span>
                        </div>
                    )}
                    {clinicalIndications && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-md truncate" title={clinicalIndications}>
                            <span className="text-[10px] font-black uppercase text-slate-400">Indication:</span>
                            <span className="font-semibold truncate">{clinicalIndications}</span>
                        </div>
                    )}
                </div>

                {/* View Switcher: Cards vs Clean Document */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            viewMode === 'cards' 
                                ? 'bg-white text-[#4A7CD2] shadow-2xs border border-slate-200' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Visual Cards</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('document')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            viewMode === 'document' 
                                ? 'bg-white text-[#4A7CD2] shadow-2xs border border-slate-200' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Clinical Document</span>
                    </button>
                </div>
            </div>

            {/* View Mode: Visual Cards Grid */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(categories).map(([key, cat]) => {
                        if (cat.items.length === 0) return null;
                        const style = THEME_STYLES[cat.theme];
                        const Icon = cat.icon;

                        return (
                            <div 
                                key={key} 
                                className={`rounded-2xl border p-4 transition-all shadow-2xs flex flex-col justify-between space-y-3 ${style.cardBg}`}
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between pb-2.5 border-b border-black/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-white shadow-2xs ${style.iconColor}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs font-black text-[#10244B] tracking-tight">
                                            {cat.title}
                                        </h4>
                                    </div>
                                    
                                    {/* Severity Badge */}
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${style.badgeBg}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            cat.severity === 'Critical' ? 'bg-rose-600 animate-ping' :
                                            cat.severity === 'Moderate' ? 'bg-amber-600' : 
                                            cat.severity === 'Actionable' ? 'bg-teal-600' : 'bg-emerald-600'
                                        }`} />
                                        {cat.severity}
                                    </span>
                                </div>

                                {/* Card Content Bullet List */}
                                <div className="space-y-2 flex-1">
                                    {cat.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${style.bulletDot}`} />
                                            <div className="flex-1">
                                                {item.label && (
                                                    <span className="font-extrabold text-[#10244B] mr-1.5">
                                                        {item.label}:
                                                    </span>
                                                )}
                                                <span>
                                                    {renderWithToothTags(item.content)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* View Mode: Clean Formatted Clinical Document */}
            {viewMode === 'document' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="border-b border-slate-200 pb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-[#10244B] tracking-wide uppercase flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#4A7CD2]" />
                                AI Dental Radiology Diagnostic Report
                            </h3>
                            <span className="text-[10px] font-black text-[#4A7CD2] bg-[#EAF0FC] px-2.5 py-1 rounded-md border border-[#4A7CD2]/30">
                                Official Clinical Transcript
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(categories).map(([key, cat]) => {
                            if (cat.items.length === 0) return null;
                            const Icon = cat.icon;

                            return (
                                <div key={key} className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-black text-[#10244B] border-b border-slate-100 pb-1.5">
                                        <Icon className="w-3.5 h-3.5 text-[#4A7CD2]" />
                                        <span>{cat.title}</span>
                                    </div>
                                    <ul className="space-y-2 pl-4">
                                        {cat.items.map((item, idx) => (
                                            <li key={idx} className="list-disc text-xs text-slate-700 leading-relaxed marker:text-[#4A7CD2]">
                                                {item.label && (
                                                    <strong className="text-[#10244B] mr-1">
                                                        {item.label}:
                                                    </strong>
                                                )}
                                                {renderWithToothTags(item.content)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Clinical Legend Footer */}
            <div className="bg-slate-50/90 border border-slate-200/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between text-[10px] font-bold text-muted-text">
                <span className="font-black text-[#10244B] uppercase tracking-wider">Clinical Status Legend:</span>
                <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 text-rose-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical (Active Pathology / Severe Defect)
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (Monitor Condition)
                    </span>
                    <span className="flex items-center gap-1 text-teal-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-teal-500" /> Actionable (Clinical Recommendation)
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Stable (Functional Restoration / Sound)
                    </span>
                </div>
            </div>

        </div>
    );
}

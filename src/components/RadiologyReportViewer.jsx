import React from 'react';
import { 
    ShieldAlert, Activity, Sparkles, Crown, AlertTriangle, 
    CheckCircle2, FileText, Info, Eye, Layers
} from 'lucide-react';

/**
 * Parses raw markdown dental radiology report into structured categories with tooth tags and severity badges
 */
export default function RadiologyReportViewer({ rawReportText, onToothClick }) {
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
        // Regex to find tooth identifiers like #8, #14, #18, #19, #22, #27, FDI 11, FDI 36, 37, Tooth #3, etc.
        const toothRegex = /(#\d{1,2}|FDI\s*\d{2}(?:\s*,\s*\d{2})*|Tooth\s*#?\d{1,2})/gi;
        const parts = text.split(toothRegex);

        return parts.map((part, index) => {
            if (part && part.match(toothRegex)) {
                return (
                    <span
                        key={index}
                        onClick={() => onToothClick && onToothClick(part)}
                        className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-[10px] font-black bg-white border border-slate-300 text-[#10244B] shadow-2xs hover:bg-[#EAF0FC] hover:border-[#4A7CD2] transition-colors cursor-pointer"
                        title={`Click to focus tooth ${part}`}
                    >
                        🦷 {part}
                    </span>
                );
            }
            // Clean bold markdown asterisks
            const cleanedPart = part.replace(/\*\*/g, '').replace(/###/g, '').trim();
            return <span key={index}>{cleanedPart} </span>;
        });
    };

    // Parser function
    const parseReport = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        
        let examType = '';
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
            pathology: {
                title: 'Pathology & Structural Alerts',
                icon: ShieldAlert,
                theme: 'crimson',
                severity: 'Critical',
                severityColor: 'rose',
                items: []
            }
        };

        let currentCategory = null;

        lines.forEach(line => {
            const lower = line.toLowerCase();

            // Check metadata
            if (lower.includes('exam type:')) {
                examType = line.replace(/.*exam type:\s*/i, '').replace(/\*\*/g, '').trim();
                return;
            }
            if (lower.includes('clinical indications:')) {
                clinicalIndications = line.replace(/.*clinical indications:\s*/i, '').replace(/\*\*/g, '').trim();
                return;
            }

            // Category Headers Detection
            if (lower.includes('prosthodontic') || lower.includes('restorative')) {
                currentCategory = 'restorative';
                return;
            } else if (lower.includes('endodontic') || lower.includes('root canal') || lower.includes('obturation')) {
                currentCategory = 'endodontic';
                return;
            } else if (lower.includes('periodontal') || lower.includes('bone loss') || lower.includes('furcation')) {
                currentCategory = 'periodontal';
                return;
            } else if (lower.includes('pathology') || lower.includes('periapical') || lower.includes('radiolucency') || lower.includes('warnings')) {
                currentCategory = 'pathology';
                return;
            }

            // Bullet items
            if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
                let cleanLine = line.replace(/^[\*\-\•]\s*/, '').trim();
                if (cleanLine.startsWith('*')) cleanLine = cleanLine.replace(/^\*+\s*/, '').trim();

                // Extract Sub-label if present (e.g. **Maxillary Right Quadrant:**)
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
                    // Default to restorative or pathology if no category active
                    if (lower.includes('bone') || lower.includes('loss')) {
                        categories.periodontal.items.push({ label, content });
                    } else if (lower.includes('radiolucency') || lower.includes('defect')) {
                        categories.pathology.items.push({ label, content });
                    } else {
                        categories.restorative.items.push({ label, content });
                    }
                }
            }
        });

        // Ensure default items exist if parsing was generic text
        const hasStructuredItems = Object.values(categories).some(c => c.items.length > 0);
        if (!hasStructuredItems) {
            // Split raw paragraphs into items
            const paras = text.split('\n\n').filter(p => p.length > 15);
            paras.forEach((p, idx) => {
                const lowerP = p.toLowerCase();
                if (lowerP.includes('pathology') || lowerP.includes('severe') || lowerP.includes('defect')) {
                    categories.pathology.items.push({ label: 'Finding', content: p });
                } else if (lowerP.includes('bone') || lowerP.includes('periodont')) {
                    categories.periodontal.items.push({ label: 'Periodontal', content: p });
                } else if (lowerP.includes('endo') || lowerP.includes('canal')) {
                    categories.endodontic.items.push({ label: 'Endodontics', content: p });
                } else {
                    categories.restorative.items.push({ label: `Observation ${idx+1}`, content: p });
                }
            });
        }

        return { examType, clinicalIndications, categories };
    };

    const { examType, clinicalIndications, categories } = parseReport(rawReportText);

    // Color Styles Map
    const THEME_STYLES = {
        blue: {
            cardBg: 'bg-sky-50/60 hover:bg-sky-50/90 border-sky-200/80',
            headerBg: 'bg-sky-100/70 text-sky-900 border-sky-200',
            iconColor: 'text-sky-600',
            bulletDot: 'bg-sky-500',
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        },
        purple: {
            cardBg: 'bg-purple-50/60 hover:bg-purple-50/90 border-purple-200/80',
            headerBg: 'bg-purple-100/70 text-purple-900 border-purple-200',
            iconColor: 'text-purple-600',
            bulletDot: 'bg-purple-500',
            badgeBg: 'bg-purple-100 text-purple-800 border-purple-300'
        },
        amber: {
            cardBg: 'bg-amber-50/60 hover:bg-amber-50/90 border-amber-200/80',
            headerBg: 'bg-amber-100/70 text-amber-900 border-amber-200',
            iconColor: 'text-amber-600',
            bulletDot: 'bg-amber-500',
            badgeBg: 'bg-amber-100 text-amber-900 border-amber-300'
        },
        crimson: {
            cardBg: 'bg-rose-50/60 hover:bg-rose-50/90 border-rose-200/80',
            headerBg: 'bg-rose-100/70 text-rose-900 border-rose-200',
            iconColor: 'text-rose-600',
            bulletDot: 'bg-rose-500',
            badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
        }
    };

    return (
        <div className="space-y-4 font-sans">
            
            {/* Top Metadata Strip */}
            {(examType || clinicalIndications) && (
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    {examType && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Exam:</span>
                            <span className="text-xs font-black text-[#10244B] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                📷 {examType}
                            </span>
                        </div>
                    )}
                    {clinicalIndications && (
                        <div className="flex items-center gap-2 max-w-xl">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Indication:</span>
                            <span className="text-xs font-bold text-slate-700 truncate" title={clinicalIndications}>
                                {clinicalIndications}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* 4 Category Visual Grid */}
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
                                        cat.severity === 'Moderate' ? 'bg-amber-600' : 'bg-emerald-600'
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
                                                <span className="font-extrabold text-[#10244B] mr-1">
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

            {/* Severity Legend Footer */}
            <div className="bg-slate-50/80 border border-slate-200/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between text-[10px] font-bold text-muted-text">
                <span className="font-black text-[#10244B] uppercase tracking-wider">Clinical Status Legend:</span>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-rose-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical (Active Pathology / Severe Bone Loss)
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (Monitor Condition)
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Stable (Functional Restoration)
                    </span>
                </div>
            </div>

        </div>
    );
}

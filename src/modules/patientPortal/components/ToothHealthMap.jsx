import React, { useState } from 'react';
import { ShieldCheck, Info, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function ToothHealthMap({ teethState, teeth }) {
    const [selectedTooth, setSelectedTooth] = useState(null);

    // Map by tooth number (support both teethState and teeth props, and normalize keys)
    const teethMap = {};
    const rawTeeth = (teethState && Array.isArray(teethState) && teethState.length > 0) 
        ? teethState 
        : (Array.isArray(teeth) ? teeth : []);
    rawTeeth.forEach(t => {
        const num = t.toothNumber ?? t.ToothNumber ?? parseInt(t.toothKey || t.ToothKey, 10);
        if (num) teethMap[num] = t;
    });

    // Universal Tooth names map for patients
    const getToothDescription = (num) => {
        if (num >= 1 && num <= 3) return `Upper Right Molar (Tooth ${num})`;
        if (num >= 4 && num <= 5) return `Upper Right Premolar (Tooth ${num})`;
        if (num === 6) return `Upper Right Canine / Eyetooth (Tooth 6)`;
        if (num >= 7 && num <= 8) return `Upper Right Incisor (Tooth ${num})`;
        if (num >= 9 && num <= 10) return `Upper Left Incisor (Tooth ${num})`;
        if (num === 11) return `Upper Left Canine / Eyetooth (Tooth 11)`;
        if (num >= 12 && num <= 13) return `Upper Left Premolar (Tooth ${num})`;
        if (num >= 14 && num <= 16) return `Upper Left Molar (Tooth ${num})`;
        if (num >= 17 && num <= 19) return `Lower Left Molar (Tooth ${num})`;
        if (num >= 20 && num <= 21) return `Lower Left Premolar (Tooth ${num})`;
        if (num === 22) return `Lower Left Canine (Tooth 22)`;
        if (num >= 23 && num <= 24) return `Lower Left Incisor (Tooth ${num})`;
        if (num >= 25 && num <= 26) return `Lower Right Incisor (Tooth ${num})`;
        if (num === 27) return `Lower Right Canine (Tooth 27)`;
        if (num >= 28 && num <= 29) return `Lower Right Premolar (Tooth ${num})`;
        if (num >= 30 && num <= 32) return `Lower Right Molar (Tooth ${num})`;
        return `Tooth ${num}`;
    };

    const getToothStatus = (num) => {
        const item = teethMap[num];
        if (!item) return { label: 'Sound & Healthy', category: 'healthy', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        
        const rawStatus = item.conditionStatus || item.ConditionStatus || '';
        const status = rawStatus.toLowerCase();
        const savedColor = item.conditionColor || item.ConditionColor;

        // 1. Explicitly Healthy / Sound
        if (status.includes('healthy') || status.includes('sound')) {
            return { 
                label: rawStatus || 'Sound & Healthy', 
                category: 'healthy',
                color: '#10B981', 
                bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            };
        }

        // 2. Restored / Treated / Fillings / Crowns / Veneers / Implants
        if (status.includes('restor') || status.includes('fill') || status.includes('crown') || status.includes('veneer') || status.includes('implant') || status.includes('bridge') || status.includes('treated')) {
            return { 
                label: rawStatus || 'Restored', 
                category: 'restored',
                color: (savedColor && savedColor !== '#10B981') ? savedColor : '#3B82F6', 
                bg: 'bg-blue-50 text-blue-700 border-blue-200' 
            };
        }

        // 3. Clinical Pathology / Impactions / Malocclusions / Decay / Observation Needed
        const resolvedColor = (savedColor && savedColor !== '#10B981') ? savedColor : '#EF4444';
        return { 
            label: rawStatus || 'Clinical Finding / Monitored', 
            category: 'attention',
            color: resolvedColor, 
            bg: 'bg-rose-50 text-rose-700 border-rose-200' 
        };
    };

    const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-light-teal space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-serif font-black text-dark-slate flex items-center gap-2">
                        <span>Interactive Dental Anatomy Status</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-light-teal text-primary-teal font-bold uppercase">
                            32 Teeth
                        </span>
                    </h3>
                    <p className="text-xs text-muted-text">Click any tooth to inspect verified chairside findings and doctor notes.</p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 text-[11px]">Healthy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600 text-[11px]">Restored</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-slate-600 text-[11px]">Attention / Diagnosed</span>
                    </div>
                </div>
            </div>

            {/* Visual Odontogram Diagram Grid */}
            <div className="p-4 sm:p-6 rounded-2xl bg-warm-cream/60 border border-light-teal/80 space-y-6">
                {/* Upper Arch */}
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest text-center">Upper Jaw (Maxilla)</p>
                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 justify-items-center">
                        {upperTeeth.map(num => {
                            const status = getToothStatus(num);
                            const isSelected = selectedTooth?.num === num;
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setSelectedTooth({ num, ...status, desc: getToothDescription(num), details: teethMap[num] })}
                                    className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'ring-2 ring-primary-teal scale-105 shadow-md bg-white' 
                                            : 'hover:scale-105 bg-white shadow-2xs'
                                    }`}
                                >
                                    <span className="text-[9px] font-mono font-bold text-muted-text">{num}</span>
                                    <div 
                                        className="w-4 h-5 rounded-md transition-colors shadow-2xs"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Arch Divider */}
                <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-dashed border-light-teal" />
                    <span className="absolute px-3 py-0.5 rounded-full bg-white text-[9px] font-bold text-muted-text tracking-wider uppercase border border-light-teal">
                        Occlusal Bite Plane
                    </span>
                </div>

                {/* Lower Arch */}
                <div className="space-y-1.5">
                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 justify-items-center">
                        {lowerTeeth.map(num => {
                            const status = getToothStatus(num);
                            const isSelected = selectedTooth?.num === num;
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setSelectedTooth({ num, ...status, desc: getToothDescription(num), details: teethMap[num] })}
                                    className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'ring-2 ring-primary-teal scale-105 shadow-md bg-white' 
                                            : 'hover:scale-105 bg-white shadow-2xs'
                                    }`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                    <div 
                                        className="w-4 h-5 rounded-md transition-colors shadow-2xs"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <span className="text-[9px] font-mono font-bold text-muted-text">{num}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest text-center pt-1">Lower Jaw (Mandible)</p>
                </div>
            </div>

            {/* Selected Tooth Detail Panel */}
            {selectedTooth ? (
                <div className="p-5 rounded-2xl bg-white border border-light-teal shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                    <div className="flex items-start gap-3.5">
                        <div 
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-mono font-black text-base shadow-sm shrink-0"
                            style={{ backgroundColor: selectedTooth.color }}
                        >
                            #{selectedTooth.num}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-dark-slate">{selectedTooth.desc}</h4>
                                <span 
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                                    style={{ 
                                        backgroundColor: `${selectedTooth.color}20`, 
                                        color: selectedTooth.color === '#10B981' ? '#059669' : selectedTooth.color 
                                    }}
                                >
                                    {selectedTooth.category === 'healthy' ? 'Sound / Normal' : selectedTooth.category === 'restored' ? 'Restored / Treated' : 'Attention / Care Needed'}
                                </span>
                            </div>
                            <p className="text-xs text-dark-slate">
                                <span className="text-muted-text font-medium">Status:</span>{' '}
                                <span className="font-bold text-dark-slate">{selectedTooth.label}</span>
                            </p>
                            {selectedTooth.details?.comments && (
                                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 font-mono mt-1">
                                    👨‍⚕️ Clinical Finding: {selectedTooth.details.comments}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedTooth(null)}
                        className="text-xs text-muted-text hover:text-dark-slate font-bold px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                    >
                        Dismiss ✕
                    </button>
                </div>
            ) : (
                <div className="p-3 rounded-xl bg-light-teal/40 text-center text-xs text-muted-text">
                    💡 Click on any numbered tooth above to see its verified clinical standing and doctor comments.
                </div>
            )}
        </div>
    );
}

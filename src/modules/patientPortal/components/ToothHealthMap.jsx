import React, { useState } from 'react';
import { ShieldCheck, Info, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function ToothHealthMap({ teethState, teeth }) {
    const [selectedTooth, setSelectedTooth] = useState(null);

    // Map by tooth number (support both teethState and teeth props)
    const teethMap = {};
    const rawTeeth = (teethState && Array.isArray(teethState) && teethState.length > 0) 
        ? teethState 
        : (Array.isArray(teeth) ? teeth : []);
    rawTeeth.forEach(t => {
        teethMap[t.toothNumber] = t;
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
        if (!item) return { label: 'Sound & Healthy', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        
        const status = (item.conditionStatus || '').toLowerCase();
        if (status.includes('decay') || status.includes('canal') || status.includes('pain') || status.includes('broken')) {
            return { label: item.conditionStatus || 'Observation Needed', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
        if (status.includes('restor') || status.includes('fill') || status.includes('crown') || status.includes('treated')) {
            return { label: item.conditionStatus || 'Restored', color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        return { label: item.conditionStatus || 'Sound & Healthy', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
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
                    <p className="text-xs text-muted-text">Click any tooth to inspect its verified clinical standing.</p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 text-[11px]">Healthy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600 text-[11px]">Restored</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-slate-600 text-[11px]">Attention / Care</span>
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
                                    className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${
                                        isSelected 
                                            ? 'ring-2 ring-primary-teal scale-105 shadow-md bg-white' 
                                            : 'hover:scale-105 bg-white shadow-2xs'
                                    }`}
                                >
                                    <span className="text-[9px] font-mono text-muted-text">{num}</span>
                                    <div 
                                        className="w-4 h-5 rounded-md transition-colors"
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
                                    className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${
                                        isSelected 
                                            ? 'ring-2 ring-primary-teal scale-105 shadow-md bg-white' 
                                            : 'hover:scale-105 bg-white shadow-2xs'
                                    }`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                    <div 
                                        className="w-4 h-5 rounded-md transition-colors"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <span className="text-[9px] font-mono text-muted-text">{num}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest text-center pt-1">Lower Jaw (Mandible)</p>
                </div>
            </div>

            {/* Selected Tooth Detail Panel */}
            {selectedTooth ? (
                <div className="p-4 rounded-2xl bg-white border border-light-teal shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-sm shadow-xs"
                            style={{ backgroundColor: selectedTooth.color }}
                        >
                            #{selectedTooth.num}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-dark-slate">{selectedTooth.desc}</h4>
                            <p className="text-xs text-muted-text">
                                Status:{' '}
                                <span className="font-bold text-dark-slate">{selectedTooth.label}</span>
                                {selectedTooth.details?.comments && ` • ${selectedTooth.details.comments}`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedTooth(null)}
                        className="text-xs text-muted-text hover:text-dark-slate font-semibold px-2 py-1 rounded-lg hover:bg-slate-100"
                    >
                        Dismiss
                    </button>
                </div>
            ) : (
                <div className="p-3 rounded-xl bg-light-teal/40 text-center text-xs text-muted-text">
                    💡 Click on any numbered tooth above to see its diagnosis and treatment details.
                </div>
            )}
        </div>
    );
}

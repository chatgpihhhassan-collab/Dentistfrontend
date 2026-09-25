import React, { useState, useEffect, useMemo } from 'react';
import { 
  CLINICAL_CONDITIONS, 
  CLINICAL_CATEGORIES,
  PEDIATRIC_CLINICAL_CONDITIONS,
  PEDIATRIC_CLINICAL_CATEGORIES
} from './ToothSurfaceDiagram';
import { Sparkles, HelpCircle, Check, ChevronDown, ChevronUp, Plus, ExternalLink } from 'lucide-react';
import { 
  getCustomProcedures, 
  subscribeToCustomProcedures, 
  formatCustomProcedureAsCondition 
} from '../services/customProceduresService';

export default function ClinicalConditionPalette({
  selectedCondition,
  onSelectCondition,
  onApplyToTooth,
  selectedToothNum = null,
  isPediatric: propIsPediatric = false,
  className = ""
}) {
  const [activeCategory, setActiveCategory] = useState('Restorative');
  const [showAIGuide, setShowAIGuide] = useState(false);
  const [customProcedures, setCustomProcedures] = useState(() => getCustomProcedures());

  useEffect(() => {
    const unsubscribe = subscribeToCustomProcedures((updated) => {
      setCustomProcedures(updated);
    });
    return unsubscribe;
  }, []);

  // Auto-detect whether selected tooth belongs to primary pediatric dentition (A–T)
  const isPediatric = propIsPediatric || (
    typeof selectedToothNum === 'string' && 
    isNaN(parseInt(selectedToothNum, 10)) && 
    ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].includes(selectedToothNum.toUpperCase())
  );

  // Format custom procedures into condition entries
  const customConditionsMap = useMemo(() => {
    const map = {};
    customProcedures.forEach(proc => {
      map[proc.procedureName] = formatCustomProcedureAsCondition(proc);
    });
    return map;
  }, [customProcedures]);

  // Adaptive palette source: Pediatric vs Adult
  const baseCategories = isPediatric ? PEDIATRIC_CLINICAL_CATEGORIES : CLINICAL_CATEGORIES;
  
  // Dynamic categories with live custom badge count
  const targetCategories = useMemo(() => {
    return baseCategories.map(cat => {
      if (cat.id === 'Custom') {
        return {
          ...cat,
          title: `Custom Clinic (${customProcedures.length})`,
          count: customProcedures.length
        };
      }
      return cat;
    });
  }, [baseCategories, customProcedures.length]);

  const targetConditions = useMemo(() => {
    const base = isPediatric ? PEDIATRIC_CLINICAL_CONDITIONS : CLINICAL_CONDITIONS;
    return {
      ...base,
      ...customConditionsMap
    };
  }, [isPediatric, customConditionsMap]);

  // Auto-switch to the category of the currently selected condition
  useEffect(() => {
    if (selectedCondition && targetConditions[selectedCondition]) {
      const cat = targetConditions[selectedCondition].category;
      if (cat && cat !== activeCategory) {
        setActiveCategory(cat);
      }
    } else if (!targetCategories.some(c => c.id === activeCategory)) {
      setActiveCategory('Restorative');
    }
  }, [selectedCondition, isPediatric, targetConditions]);

  const filteredConditions = useMemo(() => {
    if (activeCategory === 'Custom') {
      return Object.entries(customConditionsMap);
    }

    // Standard conditions for this category
    const standardMatches = Object.entries(targetConditions).filter(
      ([name, data]) => data.category === activeCategory
    );

    // Also include custom procedures whose parentCategory corresponds to this category
    const customMatches = Object.entries(customConditionsMap).filter(
      ([name, data]) => {
        const parent = (data.parentCategory || '').toLowerCase();
        const active = activeCategory.toLowerCase();
        return parent.includes(active) || (active.includes('restorative') && parent.includes('fillings'));
      }
    );

    return [...standardMatches, ...customMatches];
  }, [activeCategory, targetConditions, customConditionsMap]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-800 tracking-tight">Clinical Conditions Palette</span>
          {isPediatric ? (
            <span className="text-[10px] font-black bg-pink-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-pink-200 flex items-center gap-1 shadow-2xs">
              <span>👶</span>
              <span>Pediatric Protocol ({selectedToothNum ? `Primary Tooth ${selectedToothNum}` : 'Milk Teeth A–T'})</span>
            </span>
          ) : selectedToothNum ? (
            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
              Active: Tooth #{selectedToothNum}
            </span>
          ) : null}

          {customProcedures.length > 0 && (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hidden sm:inline-flex items-center gap-1">
              <span>✨</span>
              <span>{customProcedures.length} Custom Clinic Procedures Loaded</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAIGuide(!showAIGuide)}
          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Voice Commands</span>
          {showAIGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* AI Voice Assistant Guide Drawer */}
      {showAIGuide && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-3 text-[11px] flex flex-col gap-2 shadow-inner border border-indigo-700/50">
          <div className="flex items-center justify-between font-black text-indigo-200 text-xs">
            <span>🎙️ AI Dental Voice Assistant & Charting Guide</span>
            <span className="text-[9px] bg-indigo-500/30 px-2 py-0.5 rounded text-cyan-300">Natural Speech Recognition</span>
          </div>
          <p className="text-slate-300 text-[10.5px]">
            Clinicians can click the microphone button and dictate findings in natural speech. The AI clinical scribe automatically maps anatomical surfaces (MODBL) and procedure codes to the electronic dental chart:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-white/10 rounded-lg p-1.5 font-mono">
              <span className="text-cyan-300 font-bold">"Tooth 14 MOD caries"</span>
              <p className="text-slate-300 font-sans">→ Charts Caries across Mesial, Occlusal, and Distal surfaces</p>
            </div>
            <div className="bg-white/10 rounded-lg p-1.5 font-mono">
              <span className="text-cyan-300 font-bold">"Tooth 30 occlusal amalgam"</span>
              <p className="text-slate-300 font-sans">→ Charts Amalgam silver restoration on Occlusal zone</p>
            </div>
            <div className="bg-white/10 rounded-lg p-1.5 font-mono">
              <span className="text-cyan-300 font-bold">"Tooth 19 root canal with lesion"</span>
              <p className="text-slate-300 font-sans">→ Charts Endodontic RCT purple seal + periapical abscess</p>
            </div>
            <div className="bg-white/10 rounded-lg p-1.5 font-mono">
              <span className="text-cyan-300 font-bold">"Tooth 3 missing, 4 implant"</span>
              <p className="text-slate-300 font-sans">→ Charts Tooth 3 empty socket + Tooth 4 implant fixture</p>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Category Tabs (Clean No-Scrollbar Flex Layout) */}
      <div className="flex items-center gap-1.5 flex-wrap py-1">
        {targetCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const isCustomTab = cat.id === 'Custom';
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? isCustomTab 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs ring-2 ring-purple-500/30 scale-102'
                    : 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20 scale-102'
                  : isCustomTab
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Condition Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {filteredConditions.map(([name, data]) => {
          const isSelected = selectedCondition === name;
          const isCustom = data.isCustom;
          return (
            <button
              key={name}
              onClick={() => {
                onSelectCondition(name);
                if (selectedToothNum && onApplyToTooth) {
                  onApplyToTooth(selectedToothNum, name);
                }
              }}
              className={`flex items-start gap-2 p-2 rounded-xl border text-left transition-all relative group ${
                isSelected
                  ? isCustom
                    ? 'border-purple-500 bg-purple-50/80 shadow-xs ring-1 ring-purple-400'
                    : 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400'
                  : isCustom
                    ? 'border-purple-200/80 hover:border-purple-300 bg-purple-50/40 hover:bg-purple-50/70'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
              }`}
            >
              {/* Swatch */}
              <div
                style={{
                  backgroundColor: data.color || '#CBD5E1',
                  borderColor: data.borderColor || '#94A3B8',
                  borderWidth: data.borderWidth || 1,
                  borderStyle: data.isDashed ? 'dashed' : 'solid'
                }}
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-2xs mt-0.5"
              />

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`text-[11px] font-bold truncate ${isCustom ? 'text-purple-950 font-black' : 'text-slate-800'}`}>
                    {name}
                  </span>
                  {isCustom && (
                    <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                      Custom
                    </span>
                  )}
                </div>

                {data.description && (
                  <span className="text-[9px] text-slate-500 truncate mt-0.5">
                    {data.description}
                  </span>
                )}

                {isCustom && data.standardFee && (
                  <span className="text-[9.5px] font-extrabold text-emerald-700 mt-0.5">
                    {data.currency || 'PKR'} {Number(data.standardFee).toLocaleString()}
                  </span>
                )}
              </div>

              {isSelected && (
                <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isCustom ? 'text-purple-700' : 'text-blue-600'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick link in Custom Category to add more custom procedures */}
      {activeCategory === 'Custom' && (
        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
          <span className="text-slate-500 font-semibold">
            {customProcedures.length} custom clinic procedure(s) ready to apply to teeth.
          </span>
          <a
            href="/doctor/treatment-pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 hover:underline"
          >
            <Plus className="w-3 h-3" />
            <span>Manage in Fee Schedule Studio</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </div>
  );
}

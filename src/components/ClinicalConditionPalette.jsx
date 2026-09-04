import React, { useState, useEffect } from 'react';
import { 
  CLINICAL_CONDITIONS, 
  CLINICAL_CATEGORIES,
  PEDIATRIC_CLINICAL_CONDITIONS,
  PEDIATRIC_CLINICAL_CATEGORIES
} from './ToothSurfaceDiagram';
import { Sparkles, HelpCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';

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

  // Auto-detect whether selected tooth belongs to primary pediatric dentition (A–T)
  const isPediatric = propIsPediatric || (
    typeof selectedToothNum === 'string' && 
    isNaN(parseInt(selectedToothNum, 10)) && 
    ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].includes(selectedToothNum.toUpperCase())
  );

  // Adaptive palette source: Pediatric vs Adult
  const targetCategories = isPediatric ? PEDIATRIC_CLINICAL_CATEGORIES : CLINICAL_CATEGORIES;
  const targetConditions = isPediatric ? PEDIATRIC_CLINICAL_CONDITIONS : CLINICAL_CONDITIONS;

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
  }, [selectedCondition, isPediatric]);

  const filteredConditions = Object.entries(targetConditions).filter(
    ([name, data]) => data.category === activeCategory
  );

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
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20 scale-102'
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
          return (
            <button
              key={name}
              onClick={() => {
                onSelectCondition(name);
                if (selectedToothNum && onApplyToTooth) {
                  onApplyToTooth(selectedToothNum, name);
                }
              }}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all relative group ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400'
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
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-2xs"
              />

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-800 truncate">
                  {name}
                </span>
                {data.description && (
                  <span className="text-[9px] text-slate-500 truncate">
                    {data.description}
                  </span>
                )}
              </div>

              {isSelected && (
                <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  FileText, Activity, ShieldAlert, Sparkles, Plus, Trash2, 
  RotateCcw, Save, Check, Layers, Stethoscope, Eye, Edit3, X, HelpCircle, AlertCircle
} from 'lucide-react';
import { parseClinicalReport, serializeClinicalReport, getHumanReadableReport } from '../utils/aiRadiologyUtils';

export default function ClinicalReportEditor({
  rawReportText,
  originalAiReport,
  onSave,
  onCancel,
  isSaving = false
}) {
  // Parsing initial report into doctor-friendly structured model
  const [reportData, setReportData] = useState(() => parseClinicalReport(getHumanReadableReport(rawReportText)));
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'soap' | 'overview' | 'narrative'
  const [narrativeText, setNarrativeText] = useState(() => getHumanReadableReport(rawReportText));
  const [newToothInput, setNewToothInput] = useState('');
  const [newConditionInput, setNewConditionInput] = useState('');

  // Whenever reportData changes, sync narrativeText
  const handleStructuredChange = (updater) => {
    setReportData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const serialized = serializeClinicalReport(next);
      setNarrativeText(serialized);
      return next;
    });
  };

  // Switch to narrative mode: ensure narrativeText is serialized
  const handleTabSwitch = (tab) => {
    if (tab === 'narrative') {
      setNarrativeText(serializeClinicalReport(reportData));
    } else if (activeTab === 'narrative') {
      // Switching back to structured: parse narrativeText
      const parsed = parseClinicalReport(narrativeText);
      setReportData(parsed);
    }
    setActiveTab(tab);
  };

  // Narrative text change: keep it in sync
  const handleNarrativeChange = (val) => {
    setNarrativeText(val);
  };

  // Add new tooth finding
  const handleAddToothFinding = () => {
    if (!newToothInput.trim() && !newConditionInput.trim()) return;
    const toothNum = newToothInput.trim() || '?';
    const condition = newConditionInput.trim() || 'Clinical Observation';

    handleStructuredChange(prev => ({
      ...prev,
      toothFindings: [
        ...prev.toothFindings,
        { tooth: toothNum, description: condition, confidence: '95%' }
      ]
    }));

    setNewToothInput('');
    setNewConditionInput('');
  };

  // Remove tooth finding
  const handleRemoveToothFinding = (index) => {
    handleStructuredChange(prev => ({
      ...prev,
      toothFindings: prev.toothFindings.filter((_, i) => i !== index)
    }));
  };

  // Update tooth finding
  const handleUpdateToothFinding = (index, field, value) => {
    handleStructuredChange(prev => ({
      ...prev,
      toothFindings: prev.toothFindings.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  // Update SOAP field
  const handleSoapChange = (field, value) => {
    handleStructuredChange(prev => ({
      ...prev,
      soap: {
        ...prev.soap,
        [field]: value
      }
    }));
  };

  // Update Overview field
  const handleOverviewChange = (field, value) => {
    handleStructuredChange(prev => ({
      ...prev,
      overview: {
        ...prev.overview,
        [field]: value
      }
    }));
  };

  // Reset to original AI
  const handleResetToOriginal = () => {
    if (window.confirm("Reset all edits back to the initial AI vision analysis?")) {
      const originalClean = getHumanReadableReport(originalAiReport || rawReportText);
      const parsed = parseClinicalReport(originalClean);
      setReportData(parsed);
      setNarrativeText(originalClean);
    }
  };

  // Submit save
  const handleFinalSave = () => {
    // If doctor was editing in narrative mode, use narrativeText; otherwise serialize reportData
    const finalCleanReport = activeTab === 'narrative' 
      ? narrativeText 
      : serializeClinicalReport(reportData);
    
    if (onSave) {
      onSave(finalCleanReport);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-light-teal/50 shadow-sm overflow-hidden flex flex-col transition-all duration-300 animate-fade-in">
      
      {/* 1. EDITOR HEADER & SUB-NAVIGATION */}
      <div className="p-4 bg-gradient-to-r from-white via-[#F8FAFC] to-[#EAF0FC]/80 border-b border-light-teal/40 flex flex-col gap-3 select-none">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A7CD2] to-[#3665B7] flex items-center justify-center text-white shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-[#10244B] tracking-tight">
                  Clinical Radiographic Report Editor
                </h4>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Doctor Review Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Structured fields automatically format into clinical transcripts without raw markdown code.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Reset fields to original Gemini Vision AI output"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset AI</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition cursor-pointer shadow-2xs"
              title="Cancel editing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. SECTION TABS */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'findings', label: `🦷 Tooth Findings (${reportData.toothFindings?.length || 0})` },
            { id: 'soap', label: '🩺 SOAP Clinical Notes' },
            { id: 'overview', label: '📋 Anatomy & Modality' },
            { id: 'narrative', label: '📄 Full Narrative Text' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSwitch(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                activeTab === tab.id
                  ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ACTIVE TAB CONTENT BODY */}
      <div className="p-4 sm:p-5 bg-[#F8FAFC] min-h-[320px] flex flex-col gap-4">
        
        {/* ========================================================================= */}
        {/* TAB 1: TOOTH-BY-TOOTH FINDINGS & PATHOLOGY                                */}
        {/* ========================================================================= */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h5 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                  Tooth-by-Tooth Diagnostic Pathology
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Add, edit, or adjust specific diagnoses for individual teeth. Changes update the chart and ledger.
                </p>
              </div>

              <span className="text-[10.5px] font-bold text-[#4A7CD2] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {reportData.toothFindings?.length || 0} Teeth Charted
              </span>
            </div>

            {/* List of Tooth Finding Cards */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {reportData.toothFindings?.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  No individual tooth findings charted yet. Use the form below to add teeth observations.
                </div>
              ) : (
                reportData.toothFindings.map((finding, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 shadow-2xs flex items-center justify-between gap-3 flex-wrap transition"
                  >
                    {/* Tooth Number Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-black text-slate-500">Tooth:</span>
                      <input
                        type="text"
                        value={finding.tooth}
                        onChange={(e) => handleUpdateToothFinding(idx, 'tooth', e.target.value)}
                        className="w-14 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 font-black text-xs text-[#4A7CD2] text-center focus:outline-none focus:ring-1 focus:ring-[#4A7CD2]"
                        placeholder="#"
                      />
                    </div>

                    {/* Condition / Diagnostic Description */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={finding.description}
                        onChange={(e) => handleUpdateToothFinding(idx, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#4A7CD2] text-xs font-semibold text-slate-800 focus:outline-none transition"
                        placeholder="e.g. Impacted third molar, Periapical radiolucency, Dental caries..."
                      />
                    </div>

                    {/* Confidence / Status */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="text"
                        value={finding.confidence || '95%'}
                        onChange={(e) => handleUpdateToothFinding(idx, 'confidence', e.target.value)}
                        className="w-16 px-2 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-black text-[10.5px] text-center focus:outline-none"
                        placeholder="95%"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveToothFinding(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove this tooth finding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Finding Row */}
            <div className="p-3 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50 rounded-2xl border border-dashed border-[#4A7CD2]/40 flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-black text-[#10244B] flex items-center gap-1 shrink-0">
                <Plus className="w-3.5 h-3.5 text-[#4A7CD2]" /> Add Tooth:
              </span>
              <input
                type="text"
                value={newToothInput}
                onChange={(e) => setNewToothInput(e.target.value)}
                placeholder="Tooth # (1-32)"
                className="w-24 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4A7CD2]"
              />
              <input
                type="text"
                value={newConditionInput}
                onChange={(e) => setNewConditionInput(e.target.value)}
                placeholder="Observed Pathology / Condition (e.g. Deep Occlusal Caries)"
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4A7CD2]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddToothFinding();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddToothFinding}
                className="px-3.5 py-1.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-black shadow-xs transition cursor-pointer shrink-0"
              >
                + Add
              </button>
            </div>

            {/* Regional / General Findings */}
            {reportData.generalFindings?.length > 0 && (
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black text-[#10244B] uppercase tracking-wider">
                  Regional & Periodontal Observations
                </span>
                {reportData.generalFindings.map((g, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-slate-700 shrink-0">• {g.label}:</span>
                    <input
                      type="text"
                      value={g.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleStructuredChange(prev => ({
                          ...prev,
                          generalFindings: prev.generalFindings.map((item, i) => i === idx ? { ...item, description: val } : item)
                        }));
                      }}
                      className="flex-1 px-2 py-0.5 bg-slate-50 hover:bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMPREHENSIVE SOAP CLINICAL NOTES                                  */}
        {/* ========================================================================= */}
        {activeTab === 'soap' && (
          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                SOAP Progress & Clinical Impression
              </h5>
              <p className="text-[11px] text-slate-500 font-medium">
                Standardized medical documentation. Automatically persists to the patient clinical log timeline.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* S - Subjective */}
              <div className="p-3.5 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-blue-100 text-[#4A7CD2] flex items-center justify-center text-[11px] font-black">
                    S
                  </span>
                  <span className="text-xs font-black text-[#10244B]">Subjective (Presentation & History)</span>
                </div>
                <textarea
                  value={reportData.soap.subjective}
                  onChange={(e) => handleSoapChange('subjective', e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#4A7CD2] rounded-xl text-xs text-slate-800 font-medium leading-relaxed focus:outline-none transition"
                  placeholder="Patient chief complaint, symptoms, reason for radiographic evaluation..."
                />
              </div>

              {/* O - Objective */}
              <div className="p-3.5 bg-white rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black">
                    O
                  </span>
                  <span className="text-xs font-black text-[#10244B]">Objective (Radiographic Observations)</span>
                </div>
                <textarea
                  value={reportData.soap.objective}
                  onChange={(e) => handleSoapChange('objective', e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-800 font-medium leading-relaxed focus:outline-none transition"
                  placeholder="Radiographic findings, alveolar crest height, radiolucencies, missing teeth..."
                />
              </div>

              {/* A - Assessment */}
              <div className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-black">
                    A
                  </span>
                  <span className="text-xs font-black text-[#10244B]">Assessment (Definitive Diagnosis)</span>
                </div>
                <textarea
                  value={reportData.soap.assessment}
                  onChange={(e) => handleSoapChange('assessment', e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-xs text-slate-800 font-medium leading-relaxed focus:outline-none transition"
                  placeholder="Clinical diagnosis: Caries, chronic periodontitis, impactions, defective restorations..."
                />
              </div>

              {/* P - Plan */}
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                    P
                  </span>
                  <span className="text-xs font-black text-[#10244B]">Plan (Treatment Plan & CDT Procedures)</span>
                </div>
                <textarea
                  value={reportData.soap.plan}
                  onChange={(e) => handleSoapChange('plan', e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 font-medium leading-relaxed focus:outline-none transition"
                  placeholder="Procedures indicated: Scaling (D4341), surgical extraction (D7240), composite (D2391)..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OVERVIEW & ANATOMY                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                Radiographic Overview & Anatomy
              </h5>
              <p className="text-[11px] text-slate-500 font-medium">
                Modality type, anatomical landmarks, periodontal bone support, and crown-to-root evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                <span className="text-xs font-black text-slate-700">Scan Modality:</span>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {['Panoramic Radiograph', 'Periapical RVG', 'Bitewing Radiograph', 'Full Mouth Series (FMX)'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleOverviewChange('modality', m)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer border ${
                        reportData.overview.modality?.includes(m)
                          ? 'bg-[#4A7CD2] text-white border-[#4A7CD2] shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reportData.overview.modality}
                  onChange={(e) => handleOverviewChange('modality', e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#4A7CD2]"
                  placeholder="Custom modality description..."
                />
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                <span className="text-xs font-black text-slate-700">Crown-to-Root Ratios:</span>
                <input
                  type="text"
                  value={reportData.overview.crownToRootRatios}
                  onChange={(e) => handleOverviewChange('crownToRootRatios', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#4A7CD2]"
                  placeholder="e.g. Generally within normal limits, 1:2 ratio, periodontal compromise..."
                />
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1 md:col-span-2">
                <span className="text-xs font-black text-slate-700">Visualized Anatomical Structures:</span>
                <textarea
                  value={reportData.overview.anatomicalStructures}
                  onChange={(e) => handleOverviewChange('anatomicalStructures', e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#4A7CD2]"
                  placeholder="Maxillary sinus floors, mandibular canal, alveolar crest height, condyles..."
                />
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1 md:col-span-2">
                <span className="text-xs font-black text-slate-700">Periodontal Bone Status:</span>
                <textarea
                  value={reportData.overview.periodontalStatus}
                  onChange={(e) => handleOverviewChange('periodontalStatus', e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#4A7CD2]"
                  placeholder="Horizontal bone loss, alveolar crest blunting, furcation involvements..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FULL NARRATIVE / QUICK TEXT EDIT                                  */}
        {/* ========================================================================= */}
        {activeTab === 'narrative' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                  Full Clinical Narrative (Synchronized Transcript)
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Direct text editing mode. Any changes sync automatically with the structured fields.
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                Clean Markdown (No raw JSON)
              </span>
            </div>

            <textarea
              value={narrativeText}
              onChange={(e) => handleNarrativeChange(e.target.value)}
              rows={14}
              className="w-full p-3.5 bg-white border border-light-teal/50 rounded-2xl text-xs text-slate-800 font-sans font-medium leading-relaxed focus:outline-none focus:border-[#4A7CD2] shadow-2xs"
              placeholder="Full clinical report narrative..."
            />
          </div>
        )}

      </div>

      {/* 4. FOOTER CONTROLS & SAVE */}
      <div className="p-3.5 bg-white border-t border-light-teal/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Machine AI codes & findings preserved automatically
          </span>

          <button
            type="button"
            onClick={handleFinalSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A7CD2] hover:bg-[#3665B7] text-white text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Saving to History...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save to Patient History</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Layers, Activity, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import OcclusionBiteVisualizer from './OcclusionBiteVisualizer';
import ImpactedTeethXRayVisualizer from './ImpactedTeethXRayVisualizer';
import TMJJointArticulationViewer from './TMJJointArticulationViewer';

export default function OrthoTmjDiagnosticSuite({
  patientId,
  patient,
  patientAge,
  liveOrthoAssessment = null,
  onSaveAssessment
}) {
  const [activeSuiteTab, setActiveSuiteTab] = useState(() => liveOrthoAssessment?.suite_category || 'occlusion'); // 'occlusion', 'impactions', 'tmj'

  useEffect(() => {
    if (liveOrthoAssessment?.suite_category) {
      console.log(`🧭 [OrthoTmjDiagnosticSuite] Switching tab to "${liveOrthoAssessment.suite_category}" from live assessment`);
      setActiveSuiteTab(liveOrthoAssessment.suite_category);
    }
  }, [liveOrthoAssessment]);

  const suiteTabs = [
    { id: 'occlusion', label: '1. Occlusion & Bite Malocclusion', icon: '📐', count: '5 Diagrams' },
    { id: 'impactions', label: '2. Impacted & Wisdom Teeth X-Ray', icon: '🩻', count: '4 Diagrams' },
    { id: 'tmj', label: '3. TMJ & Jaw Articulation / Clicking', icon: '🦴', count: '3 Diagrams' }
  ];

  return (
    <div className="bg-white rounded-3xl border border-light-teal/40 p-5 sm:p-6 shadow-sm space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-light-teal/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center text-xl shadow-md shrink-0">
            🦷
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#10244B]">
                Teens & Young Adults (12–25 Yrs) Diagnostic Suite
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                Ortho • Impactions • TMJ (12 Anatomical Vector Diagrams)
              </span>
            </div>
            <p className="text-xs font-semibold text-muted-text mt-0.5">
              Comprehensive clinical evaluation dynamically updated from Assistant Voice & Chat Dictations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            Target Cohort: {patientAge !== null ? `${patientAge} Yrs Old` : 'Teens / Young Adult'}
          </span>
        </div>
      </div>

      {/* 3 Main Suite Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F8FAFC] rounded-2xl border border-light-teal/30">
        {suiteTabs.map((tab) => {
          const isSel = activeSuiteTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                console.log(`🧭 [OrthoTmjDiagnosticSuite:TabClick] Switched to tab: ${tab.id}`);
                setActiveSuiteTab(tab.id);
              }}
              className={`flex-1 min-w-[200px] flex items-center justify-between px-4 py-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                isSel
                  ? 'bg-white text-[#10244B] shadow-sm border border-slate-200 ring-2 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md ${isSel ? 'bg-blue-100 text-[#1E40AF]' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render Active Diagnostic Sub-Suite */}
      {activeSuiteTab === 'occlusion' && (
        <OcclusionBiteVisualizer
          patientId={patientId}
          liveOrthoAssessment={liveOrthoAssessment?.occlusion || liveOrthoAssessment}
          onSaveAssessment={onSaveAssessment}
        />
      )}

      {activeSuiteTab === 'impactions' && (
        <ImpactedTeethXRayVisualizer
          patientId={patientId}
          liveOrthoAssessment={liveOrthoAssessment?.impactions || liveOrthoAssessment}
          initialImpaction={liveOrthoAssessment?.impaction_type || 'mesioangular'}
          initialAngulation={liveOrthoAssessment?.angulation_degrees || 45}
          initialCanineAngulation={liveOrthoAssessment?.canine_angulation || liveOrthoAssessment?.angulation_degrees || 35}
          initialNerveDistance={liveOrthoAssessment?.nerve_distance_mm ?? 0.5}
          initialEruptionPercent={liveOrthoAssessment?.eruption_percent ?? 35}
          onSaveAssessment={onSaveAssessment}
        />
      )}

      {activeSuiteTab === 'tmj' && (
        <TMJJointArticulationViewer
          patientId={patientId}
          liveOrthoAssessment={liveOrthoAssessment?.tmj || liveOrthoAssessment}
          initialJointState={liveOrthoAssessment?.tmj_state || 'clicking'}
          initialMouthOpening={liveOrthoAssessment?.mouth_opening_mm || 42.0}
          onSaveAssessment={onSaveAssessment}
        />
      )}
    </div>
  );
}

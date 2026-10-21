import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, AlertCircle, Calendar, Layers, ShieldCheck, 
  RotateCcw, Trash2, Clock, CheckCircle2, ChevronRight, Activity, Plus,
  Sliders, ArrowRight, Gauge, FileText, CheckCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';

const ALIGNER_BRANDS = [
  'Invisalign (Align Technology)',
  'ClearCorrect (Straumann Group)',
  'Spark Clear Aligners (Ormco)',
  'AngelAlign (Angelaligner Pro)',
  'SureSmile (Dentsply Sirona)',
  'In-House 3D Printed (Direct Print / Formlabs)',
  'Other Aligner System'
];

const WEAR_SCHEDULES = [
  '7 Days / Tray (Accelerated)',
  '10 Days / Tray (Standard Recommended)',
  '14 Days / Tray (Complex Root Movements)',
  '20–22 Hours / Day Full-Time Compliance'
];

export default function ClearAlignerOrthoTab({
  patientId,
  onPlanSaved,
  initialData = null
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plansList, setPlansList] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('staging'); // 'staging' | 'attachments' | 'refinements'

  // Form State
  const [formData, setFormData] = useState({
    orthoAlignerId: null,
    alignerBrand: 'Invisalign (Align Technology)',
    totalStages: 24,
    currentStage: 1,
    attachmentsRequired: true,
    attachmentNotes: '#6, #11 gingival bevelled; #12, #21 rectangular horizontal attachments',
    iprRequired: true,
    iprDetails: 'Stage 4: 0.2mm between 22-23; Stage 6: 0.3mm between 23-24, 0.2mm between 24-25',
    wearSchedule: '10 Days / Tray (Standard Recommended)',
    refinementScanTracking: 'Initial digital intraoral scan completed. Refinement evaluation scheduled at Tray 18.',
    refinementCount: 0,
    arch: 'Dual',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: '',
    clinicalNotes: 'Class I crowded anterior malocclusion. Tracking aligner compliance with patient portal reminders.'
  });

  useEffect(() => {
    if (patientId) {
      loadAlignerPlans();
    }
  }, [patientId]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const loadAlignerPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlansList(data);
          try {
            sessionStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(data));
            localStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(data));
          } catch (e) {}
          if (!activePlanId) handleSelectPlan(data[0]);
          return;
        }
      }
    } catch (err) {
      console.warn('Network call to load aligner plans failed, falling back to local cache:', err);
    } finally {
      setLoading(false);
    }

    try {
      const cached = sessionStorage.getItem(`dentia_aligner_plans_${patientId}`) || localStorage.getItem(`dentia_aligner_plans_${patientId}`);
      if (cached) {
        const data = JSON.parse(cached);
        setPlansList(data);
        if (!activePlanId && data.length > 0) handleSelectPlan(data[0]);
      }
    } catch (e) {}
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.alignerBrand) {
      errs.alignerBrand = 'Aligner system / brand is required.';
    }
    const tot = parseInt(formData.totalStages, 10);
    const cur = parseInt(formData.currentStage, 10);
    if (isNaN(tot) || tot < 1 || tot > 200) {
      errs.totalStages = 'Total stages must be between 1 and 200.';
    }
    if (isNaN(cur) || cur < 0 || cur > (isNaN(tot) ? 200 : tot)) {
      errs.currentStage = `Current active stage must be between 0 and total stages (${tot || 1}).`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const docId = doctorData.doctorID || doctorData.DoctorID || 1;

      const payload = {
        orthoAlignerID: formData.orthoAlignerId || 0,
        patientID: parseInt(patientId),
        doctorID: docId,
        alignerBrand: formData.alignerBrand,
        totalStages: parseInt(formData.totalStages, 10),
        currentStage: parseInt(formData.currentStage, 10),
        attachmentsRequired: Boolean(formData.attachmentsRequired),
        attachmentNotes: formData.attachmentNotes?.trim() || null,
        iprRequired: Boolean(formData.iprRequired),
        iprDetails: formData.iprDetails?.trim() || null,
        wearSchedule: formData.wearSchedule,
        refinementScanTracking: formData.refinementScanTracking?.trim() || null,
        refinementCount: parseInt(formData.refinementCount, 10) || 0,
        arch: formData.arch || 'Dual',
        status: formData.status || 'Active',
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        targetCompletionDate: formData.targetCompletionDate ? new Date(formData.targetCompletionDate).toISOString() : null,
        clinicalNotes: formData.clinicalNotes?.trim() || null
      };

      const localRecord = {
        ...payload,
        orthoAlignerID: payload.orthoAlignerID || Date.now(),
        updatedAt: new Date().toISOString()
      };

      // Dual cache sync (sessionStorage + localStorage)
      try {
        const currentCached = JSON.parse(sessionStorage.getItem(`dentia_aligner_plans_${patientId}`) || localStorage.getItem(`dentia_aligner_plans_${patientId}`) || '[]');
        const filtered = currentCached.filter(p => p.orthoAlignerID !== localRecord.orthoAlignerID);
        filtered.unshift(localRecord);
        sessionStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(filtered));
        localStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(filtered));
        setPlansList(filtered);
        setActivePlanId(localRecord.orthoAlignerID);
      } catch (e) {}

      // Dispatch event for 0ms reactivity across Chart & Dossier bar
      window.dispatchEvent(new CustomEvent('dentia-specialty-updated', {
        detail: { type: 'aligner', patientId, plan: localRecord }
      }));

      // Remote POST
      let savedServerRecord = null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          savedServerRecord = result.treatment || payload;
        }
      } catch (networkErr) {
        console.warn('API error saving aligner plan, kept local record:', networkErr);
      }

      const finalRecord = savedServerRecord || localRecord;
      setToast({ show: true, message: 'Clear Aligner Treatment Plan saved and applied to chart.', type: 'success' });
      if (onPlanSaved) onPlanSaved(finalRecord);
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
    } catch (err) {
      console.error('Save error:', err);
      setToast({ show: true, message: err.message || 'Error saving aligner plan', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alignerId) => {
    if (!window.confirm('Delete this clear aligner treatment record?')) return;
    try {
      const updated = plansList.filter(p => p.orthoAlignerID !== alignerId);
      setPlansList(updated);
      sessionStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(updated));
      localStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(updated));

      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners/${alignerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setToast({ show: true, message: 'Aligner plan deleted.', type: 'success' });
      }
      if (formData.orthoAlignerId === alignerId) {
        handleResetForm();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSelectPlan = (plan) => {
    setActivePlanId(plan.orthoAlignerID);
    setFormData({
      orthoAlignerId: plan.orthoAlignerID,
      alignerBrand: plan.alignerBrand || 'Invisalign (Align Technology)',
      totalStages: plan.totalStages || 1,
      currentStage: plan.currentStage || 1,
      attachmentsRequired: plan.attachmentsRequired ?? false,
      attachmentNotes: plan.attachmentNotes || '',
      iprRequired: plan.iprRequired ?? false,
      iprDetails: plan.iprDetails || '',
      wearSchedule: plan.wearSchedule || '10 Days / Tray (Standard Recommended)',
      refinementScanTracking: plan.refinementScanTracking || '',
      refinementCount: plan.refinementCount ?? 0,
      arch: plan.arch || 'Dual',
      status: plan.status || 'Active',
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
      targetCompletionDate: plan.targetCompletionDate ? plan.targetCompletionDate.split('T')[0] : '',
      clinicalNotes: plan.clinicalNotes || ''
    });
    setErrors({});
  };

  const handleResetForm = () => {
    setActivePlanId(null);
    setFormData({
      orthoAlignerId: null,
      alignerBrand: 'Invisalign (Align Technology)',
      totalStages: 24,
      currentStage: 1,
      attachmentsRequired: false,
      attachmentNotes: '',
      iprRequired: false,
      iprDetails: '',
      wearSchedule: '10 Days / Tray (Standard Recommended)',
      refinementScanTracking: '',
      refinementCount: 0,
      arch: 'Dual',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      targetCompletionDate: '',
      clinicalNotes: ''
    });
    setErrors({});
  };

  // Safe Progress calculation
  const totalStagesNum = Math.max(1, parseInt(formData.totalStages, 10) || 1);
  const currentStageNum = Math.min(totalStagesNum, Math.max(0, parseInt(formData.currentStage, 10) || 0));
  const progressPercent = Math.min(100, Math.round((currentStageNum / totalStagesNum) * 100));
  const stagesRemaining = Math.max(0, totalStagesNum - currentStageNum);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Main Aligner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Banner with Real-Time Progress Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-slate-50 p-4 rounded-2xl border border-teal-100/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Orthodontics — Clear Aligner Treatment
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {formData.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Staging progression, composite attachment templates, IPR reduction & refinement scans.
              </p>
            </div>
          </div>

          {/* Tray Progress Visualization Card */}
          <div className="bg-white border border-teal-200/80 px-4 py-2.5 rounded-2xl shadow-2xs flex items-center gap-4 w-full sm:w-auto">
            <div className="shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                  Tray Progression
                </span>
                <span className="text-[9.5px] font-bold text-teal-700">
                  {stagesRemaining} left
                </span>
              </div>
              <p className="text-sm font-black text-teal-800">
                Tray {currentStageNum} of {totalStagesNum} <span className="text-xs text-slate-500 font-bold">({progressPercent}%)</span>
              </p>
            </div>
            <div className="w-28 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80 shrink-0">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Saved Aligner Plans Tabs (if multiple exist) */}
        {plansList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-2.5">
            <span className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">
              Saved Plans:
            </span>
            {plansList.map(plan => {
              const isSelected = activePlanId === plan.orthoAlignerID;
              return (
                <button
                  key={plan.orthoAlignerID}
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{plan.alignerBrand?.split('(')[0] || 'Aligners'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                  }`}>
                    {plan.currentStage}/{plan.totalStages} Trays
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-50 border border-dashed border-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Plan / Series
            </button>
          </div>
        )}

        {/* Ortho Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Subtab Navigator */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubTab('staging')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'staging'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>1. System & Staging</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('attachments')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'attachments'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Attachments & IPR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('refinements')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'refinements'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>3. Refinements & Status</span>
            </button>
          </div>

          {/* Subtab 1: System & Staging */}
          {activeSubTab === 'staging' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  
                  {/* Aligner System / Brand */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Aligner System / Brand *
                    </label>
                    <select
                      value={formData.alignerBrand}
                      onChange={(e) => setFormData({ ...formData, alignerBrand: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    >
                      {ALIGNER_BRANDS.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    {errors.alignerBrand && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.alignerBrand}</p>
                    )}
                  </div>

                  {/* Field A: Total Stages (Trays) */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Total Stages *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={formData.totalStages}
                        onChange={(e) => setFormData({ ...formData, totalStages: e.target.value })}
                        className="w-full pl-3 pr-11 py-2 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                        placeholder="24"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        Trays
                      </span>
                    </div>
                    {errors.totalStages && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.totalStages}</p>
                    )}
                  </div>

                  {/* Field B: Current Active Stage */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Current Stage *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={formData.totalStages || 200}
                        value={formData.currentStage}
                        onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                        className="w-full pl-3 pr-12 py-2 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                        placeholder="1"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Tray #
                      </span>
                    </div>
                    {errors.currentStage && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.currentStage}</p>
                    )}
                  </div>

                  {/* Wear Schedule */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Wear Schedule *
                    </label>
                    <select
                      value={formData.wearSchedule}
                      onChange={(e) => setFormData({ ...formData, wearSchedule: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    >
                      {WEAR_SCHEDULES.map(sched => (
                        <option key={sched} value={sched}>{sched}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Live Staging Milestone Strip */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-700">Treatment Velocity:</span>
                    <span className="font-black text-teal-800">
                      {progressPercent}% Complete
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-slate-600">
                      {stagesRemaining} Trays Remaining to Final Alignment
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">
                    Recommended Change: Every {formData.wearSchedule.includes('7') ? '7 Days' : formData.wearSchedule.includes('14') ? '14 Days' : '10 Days'}
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('attachments')}
                  className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100/80 text-teal-800 font-black text-xs rounded-xl border border-teal-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Attachments & IPR</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Subtab 2: Attachments & IPR */}
          {activeSubTab === 'attachments' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Composite Attachments Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧲</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        2. Composite Attachments
                      </h4>
                    </div>
                    {/* Segmented Button for Attachments */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, attachmentsRequired: false })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          !formData.attachmentsRequired
                            ? 'bg-white text-slate-800 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, attachmentsRequired: true })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          formData.attachmentsRequired
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Required
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Attachment Template Notes (Teeth # & Geometry)
                    </label>
                    <textarea
                      rows="2"
                      value={formData.attachmentNotes || ''}
                      onChange={(e) => setFormData({ ...formData, attachmentNotes: e.target.value })}
                      disabled={!formData.attachmentsRequired}
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none disabled:opacity-50 disabled:bg-slate-100 transition-colors"
                      placeholder="e.g. Tooth #6 & #11: 3.5mm gingival bevelled vertical. Tooth #12, #21: rectangular horizontal."
                    />
                  </div>
                </div>

                {/* IPR Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📏</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        3. Interproximal Reduction (IPR)
                      </h4>
                    </div>
                    {/* Segmented Button for IPR */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, iprRequired: false })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          !formData.iprRequired
                            ? 'bg-white text-slate-800 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, iprRequired: true })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          formData.iprRequired
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Scheduled
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      IPR Reduction Protocol (Contact, Stage & mm)
                    </label>
                    <textarea
                      rows="2"
                      value={formData.iprDetails || ''}
                      onChange={(e) => setFormData({ ...formData, iprDetails: e.target.value })}
                      disabled={!formData.iprRequired}
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none disabled:opacity-50 disabled:bg-slate-100 transition-colors"
                      placeholder="e.g. Stage 3: 0.2mm between 22-23; Stage 5: 0.3mm between 23-24."
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('staging')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⬅ Back: System & Staging</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('refinements')}
                  className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100/80 text-teal-800 font-black text-xs rounded-xl border border-teal-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Refinements & Status</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Subtab 3: Refinements & Status */}
          {activeSubTab === 'refinements' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      4. Refinement Scans & Treatment Lifecycle
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-black text-xs border border-teal-200">
                    Series #{formData.refinementCount}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Treated Arch
                    </label>
                    <select
                      value={formData.arch}
                      onChange={(e) => setFormData({ ...formData, arch: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    >
                      <option value="Dual">Dual Arch (Upper & Lower)</option>
                      <option value="Upper">Upper Arch Only</option>
                      <option value="Lower">Lower Arch Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Treatment Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Active">Active Treatment</option>
                      <option value="Refinement Needed">Refinement Scan Needed</option>
                      <option value="Retention">Retention Phase (Vivera)</option>
                      <option value="Completed">Completed</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Refinement Series #
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.refinementCount}
                      onChange={(e) => setFormData({ ...formData, refinementCount: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Refinement Scan Tracking Log (Rescan Dates, ClinCheck Approvals, Tray Delivery)
                  </label>
                  <textarea
                    rows="2"
                    value={formData.refinementScanTracking || ''}
                    onChange={(e) => setFormData({ ...formData, refinementScanTracking: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-colors"
                    placeholder="e.g. Itero digital rescan completed. ClinCheck approval #2 received for 12 refinement trays. Delivered trays 1-4."
                  />
                </div>
              </div>

              <div className="flex justify-start pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('attachments')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⬅ Back: Attachments & IPR</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              {formData.orthoAlignerId && (
                <button
                  type="button"
                  onClick={() => handleDelete(formData.orthoAlignerId)}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Plan
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : formData.orthoAlignerId ? 'Update & Apply to Chart' : 'Save & Apply to Chart'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, AlertCircle, Calendar, Layers, ShieldCheck, 
  RotateCcw, Trash2, Clock, CheckCircle2, ChevronRight, Activity, Plus
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
  onPlanSaved
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
    // 1. Aligner system/brand
    alignerBrand: 'Invisalign (Align Technology)',
    // 2. Number of aligner stages/trays
    totalStages: 24,
    currentStage: 1,
    // 3. Attachments required (Y/N + notes)
    attachmentsRequired: true,
    attachmentNotes: '#6, #11 gingival bevelled; #12, #21 rectangular horizontal attachments',
    // 4. IPR (Interproximal Reduction) required (Y/N)
    iprRequired: true,
    iprDetails: 'Stage 4: 0.2mm between 22-23; Stage 6: 0.3mm between 23-24, 0.2mm between 24-25',
    // 5. Wear schedule / refinement scan tracking
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

  const loadAlignerPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlansList(data);
          try {
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
      const cached = localStorage.getItem(`dentia_aligner_plans_${patientId}`);
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
    if (isNaN(cur) || cur < 0 || cur > tot) {
      errs.currentStage = `Current stage must be between 0 and total stages (${tot}).`;
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

      let savedRecord = null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          savedRecord = result.treatment || payload;
        }
      } catch (networkErr) {
        console.warn('API error saving aligner plan, storing locally:', networkErr);
      }

      if (!savedRecord) {
        savedRecord = {
          ...payload,
          orthoAlignerID: payload.orthoAlignerID || Date.now(),
          updatedAt: new Date().toISOString()
        };
      }

      // Update local storage mirror
      try {
        const currentCached = JSON.parse(localStorage.getItem(`dentia_aligner_plans_${patientId}`) || '[]');
        const filtered = currentCached.filter(p => p.orthoAlignerID !== savedRecord.orthoAlignerID);
        filtered.unshift(savedRecord);
        localStorage.setItem(`dentia_aligner_plans_${patientId}`, JSON.stringify(filtered));
        setPlansList(filtered);
        setActivePlanId(savedRecord.orthoAlignerID);
      } catch (e) {}

      setToast({ show: true, message: 'Clear Aligner Treatment Plan saved & applied to chart.', type: 'success' });
      if (onPlanSaved) onPlanSaved(savedRecord);
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
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
      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/ortho-aligners/${alignerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setToast({ show: true, message: 'Aligner plan deleted.', type: 'success' });
        loadAlignerPlans();
        if (formData.orthoAlignerId === alignerId) {
          handleResetForm();
        }
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

  // Progress percentage calculation
  const progressPercent = Math.min(
    100,
    Math.round(((formData.currentStage || 1) / Math.max(1, formData.totalStages || 1)) * 100)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Main Aligner Dashboard Card */}
      <div className="bg-gradient-to-br from-[#F8FAFC] via-white to-[#F0FDF4] rounded-3xl border border-light-teal/40 p-5 sm:p-6 shadow-sm space-y-6">
        
        {/* Banner with Progress Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-light-teal/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#10244B]">
                  Orthodontics — Clear Aligner Treatment
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {formData.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-text mt-0.5">
                Aligner brand, stages tracking, attachments template, interproximal reduction (IPR) & refinement scans.
              </p>
            </div>
          </div>

          {/* Tray Progress Badge */}
          <div className="bg-white border border-emerald-200 px-4 py-2 rounded-2xl shadow-xs flex items-center gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Tray Progression
              </span>
              <p className="text-sm font-black text-emerald-700">
                Tray {formData.currentStage} of {formData.totalStages} ({progressPercent}%)
              </p>
            </div>
            <div className="w-24 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Existing Plans Selector (If patient has multiple series/refinements) */}
        {plansList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Saved Aligner Plans:
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <span>{plan.alignerBrand?.split('(')[0] || 'Aligners'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {plan.currentStage}/{plan.totalStages} Trays
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-dashed border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Plan / Refinement
            </button>
          </div>
        )}

        {/* The Main Ortho Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Zero-Scroll Step Navigator */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubTab('staging')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'staging'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>1. System & Staging</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('attachments')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'attachments'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>2. Attachments & IPR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('refinements')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'refinements'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>3. Refinements & Status</span>
            </button>
          </div>

          {/* Subtab 1: System/Brand & Stage Trays & Wear Schedule */}
          {activeSubTab === 'staging' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                {/* 1. Aligner Brand */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Aligner System / Brand *
                  </label>
                  <select
                    value={formData.alignerBrand}
                    onChange={(e) => setFormData({ ...formData, alignerBrand: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {ALIGNER_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  {errors.alignerBrand && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.alignerBrand}</p>
                  )}
                </div>

                {/* 2. Number of Aligner Stages / Trays */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      Total Stages (Trays) *
                    </label>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {formData.totalStages} Stages
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={formData.totalStages}
                      onChange={(e) => setFormData({ ...formData, totalStages: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Total"
                    />
                    <input
                      type="number"
                      min="0"
                      max={formData.totalStages || 150}
                      value={formData.currentStage}
                      onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Current"
                    />
                  </div>
                  {errors.totalStages && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.totalStages}</p>
                  )}
                </div>

                {/* Wear Schedule */}
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Wear Schedule *
                  </label>
                  <select
                    value={formData.wearSchedule}
                    onChange={(e) => setFormData({ ...formData, wearSchedule: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {WEAR_SCHEDULES.map(sched => (
                      <option key={sched} value={sched}>{sched}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('attachments')}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Attachments & IPR</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* Subtab 2: Attachments Required & IPR */}
          {activeSubTab === 'attachments' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 3. Attachments Card */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🧲</span>
                      <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                        2. Attachments Required (Y/N)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, attachmentsRequired: !formData.attachmentsRequired })}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer border ${
                        formData.attachmentsRequired
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {formData.attachmentsRequired ? (
                        <>
                          <Check className="w-3 h-3" /> Attachments YES
                        </>
                      ) : (
                        'Attachments NO'
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Attachment Placement Notes (Teeth & Shapes)
                    </label>
                    <textarea
                      rows="2"
                      value={formData.attachmentNotes || ''}
                      onChange={(e) => setFormData({ ...formData, attachmentNotes: e.target.value })}
                      disabled={!formData.attachmentsRequired}
                      className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                      placeholder="e.g. Tooth #6 & #11: 3.5mm bevelled vertical. Tooth #12, #21: rectangular."
                    />
                  </div>
                </div>

                {/* 4. IPR Card */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📏</span>
                      <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                        3. IPR (Interproximal Reduction)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, iprRequired: !formData.iprRequired })}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer border ${
                        formData.iprRequired
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {formData.iprRequired ? (
                        <>
                          <Check className="w-3 h-3" /> IPR Required (YES)
                        </>
                      ) : (
                        'IPR Not Required'
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      IPR Details (Locations, Stage & Reduction in mm)
                    </label>
                    <textarea
                      rows="2"
                      value={formData.iprDetails || ''}
                      onChange={(e) => setFormData({ ...formData, iprDetails: e.target.value })}
                      disabled={!formData.iprRequired}
                      className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                      placeholder="e.g. Stage 3: 0.2mm between 22-23; Stage 5: 0.3mm between 23-24."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('staging')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⬅ Back: System & Staging</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('refinements')}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Refinements & Status</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* Subtab 3: 5. Refinement Scan Tracking & Additional Clinical Dates */}
          {activeSubTab === 'refinements' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                      4. Refinement Scan Tracking & Treatment Milestones
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      Refinements:
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                      Series #{formData.refinementCount}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Treated Arch
                    </label>
                    <select
                      value={formData.arch}
                      onChange={(e) => setFormData({ ...formData, arch: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Dual">Dual Arch (Upper & Lower)</option>
                      <option value="Upper">Upper Arch Only</option>
                      <option value="Lower">Lower Arch Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Treatment Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Refinement Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.refinementCount}
                      onChange={(e) => setFormData({ ...formData, refinementCount: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Refinement Scan Tracking Log (Rescan Dates, ClinCheck approvals, Additional Aligner Delivery)
                  </label>
                  <textarea
                    rows="2"
                    value={formData.refinementScanTracking || ''}
                    onChange={(e) => setFormData({ ...formData, refinementScanTracking: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Itero digital rescan completed on 2026-09-15. ClinCheck approval #2 received for 12 refinement trays. Delivered trays 1-4 on 2026-09-22."
                  />
                </div>
              </div>

              <div className="flex justify-start pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('attachments')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⬅ Back: Attachments & IPR</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {formData.orthoAlignerId && (
                <button
                  type="button"
                  onClick={() => handleDelete(formData.orthoAlignerId)}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Plan
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
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

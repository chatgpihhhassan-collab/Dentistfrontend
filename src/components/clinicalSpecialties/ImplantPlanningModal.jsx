import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Shield, Layers, Compass, Ruler, 
  ExternalLink, Trash2, Calendar, FileText, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';

const BONE_QUALITY_INFO = {
  D1: {
    label: 'D1 — Dense Cortical',
    description: 'Almost entirely dense cortical bone. "Oak wood" feel with extreme primary stability.',
    anatomicalTypical: 'Common in Anterior Mandible',
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-900'
  },
  D2: {
    label: 'D2 — Thick Cortical / Dense Trabecular',
    description: 'Thick layer of compact bone surrounding dense trabecular core. "White pine" feel.',
    anatomicalTypical: 'Common in Posterior Mandible & Anterior Maxilla',
    color: 'from-emerald-600 to-emerald-800',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-900'
  },
  D3: {
    label: 'D3 — Thin Cortical / Fine Trabecular',
    description: 'Thin porous cortical layer with favorable trabecular core. "Balsa wood" feel.',
    anatomicalTypical: 'Common in Anterior Maxilla & Posterior Maxilla',
    color: 'from-blue-600 to-blue-800',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900'
  },
  D4: {
    label: 'D4 — Low Density / Porous Bone',
    description: 'Very thin or absent cortical layer with low density trabecular bone. "Styrofoam" feel.',
    anatomicalTypical: 'Common in Posterior Maxilla / Tuberosity',
    color: 'from-purple-600 to-purple-800',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900'
  }
};

const IMPLANT_BRANDS = [
  'Straumann (SLActive / BLX)',
  'Nobel Biocare (Active / Replace)',
  'Zimmer Biomet (T3 / Trabecular)',
  'BioHorizons (Tapered Pro)',
  'Osstem / Hiossen (ETIII / TSIII)',
  'MegaGen (AnyRidge)',
  'Dentsply Sirona (Astra Tech)',
  'Neodent (Grand Morse)',
  'Other / In-House'
];

export default function ImplantPlanningModal({
  isOpen,
  onClose,
  patientId,
  toothNumber = 19,
  toothKey = '19',
  onPlanSaved
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plansList, setPlansList] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  // Form State with user requested clinical detail fields
  const [formData, setFormData] = useState({
    implantPlanId: null,
    toothNumber: toothNumber || 19,
    toothKey: String(toothKey || toothNumber || '19'),
    implantBrand: 'Straumann (SLActive / BLX)',
    // 1. Implant Length (numeric, mm)
    implantLength: 10.0,
    // 2. Implant Diameter (numeric, mm)
    implantDiameter: 4.3,
    // 3. Bone Quality (categorical: D1, D2, D3, D4 Lekholm & Zarb classification)
    boneQuality: 'D2',
    // 4. Bone Quantity (height/width available, grafting required Y/N, sinus lift status)
    boneHeightAvailable: 12.5,
    boneWidthAvailable: 7.0,
    graftingRequired: false,
    sinusLiftStatus: 'None',
    // 5. 3D Planning (CBCT reference/upload link, digital planning notes, guided surgery flag)
    cbctReferenceUrl: '',
    digitalPlanningNotes: '',
    guidedSurgeryFlag: true,
    planStatus: 'Planned',
    plannedDate: new Date().toISOString().split('T')[0],
    placementDate: ''
  });

  useEffect(() => {
    if (isOpen && patientId) {
      loadPatientImplantPlans();
      // Reset form to active tooth
      setFormData(prev => ({
        ...prev,
        implantPlanId: null,
        toothNumber: toothNumber || 19,
        toothKey: String(toothKey || toothNumber || '19')
      }));
      setErrors({});
    }
  }, [isOpen, patientId, toothNumber, toothKey]);

  const loadPatientImplantPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/implant-plans`);
      if (res.ok) {
        const data = await res.json();
        setPlansList(data || []);
      }
    } catch (err) {
      console.error('Failed to load implant plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errs = {};
    const len = parseFloat(formData.implantLength);
    const dia = parseFloat(formData.implantDiameter);

    if (isNaN(len) || len < 3.0 || len > 25.0) {
      errs.implantLength = 'Length must be between 3.0 mm and 25.0 mm (Standard: 6.0 – 18.0 mm).';
    }
    if (isNaN(dia) || dia < 2.0 || dia > 10.0) {
      errs.implantDiameter = 'Diameter must be between 2.0 mm and 10.0 mm (Standard: 2.5 – 7.0 mm).';
    }
    if (!['D1', 'D2', 'D3', 'D4'].includes(formData.boneQuality)) {
      errs.boneQuality = 'Bone Quality must be D1, D2, D3, or D4 (Lekholm & Zarb).';
    }
    if (formData.boneHeightAvailable !== '' && formData.boneHeightAvailable !== null) {
      const h = parseFloat(formData.boneHeightAvailable);
      if (isNaN(h) || h < 0 || h > 40) {
        errs.boneHeightAvailable = 'Bone height must be between 0.0 and 40.0 mm.';
      }
    }
    if (formData.boneWidthAvailable !== '' && formData.boneWidthAvailable !== null) {
      const w = parseFloat(formData.boneWidthAvailable);
      if (isNaN(w) || w < 0 || w > 30) {
        errs.boneWidthAvailable = 'Bone width must be between 0.0 and 30.0 mm.';
      }
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
        implantPlanID: formData.implantPlanId || 0,
        patientID: parseInt(patientId),
        doctorID: docId,
        toothNumber: parseInt(formData.toothNumber) || 19,
        toothKey: String(formData.toothKey || formData.toothNumber),
        implantBrand: formData.implantBrand,
        implantLength: parseFloat(formData.implantLength),
        implantDiameter: parseFloat(formData.implantDiameter),
        boneQuality: formData.boneQuality,
        boneHeightAvailable: formData.boneHeightAvailable !== '' ? parseFloat(formData.boneHeightAvailable) : null,
        boneWidthAvailable: formData.boneWidthAvailable !== '' ? parseFloat(formData.boneWidthAvailable) : null,
        graftingRequired: Boolean(formData.graftingRequired),
        sinusLiftStatus: formData.sinusLiftStatus || 'None',
        cbctReferenceUrl: formData.cbctReferenceUrl || null,
        digitalPlanningNotes: formData.digitalPlanningNotes || null,
        guidedSurgeryFlag: Boolean(formData.guidedSurgeryFlag),
        planStatus: formData.planStatus || 'Planned',
        plannedDate: formData.plannedDate ? new Date(formData.plannedDate).toISOString() : null,
        placementDate: formData.placementDate ? new Date(formData.placementDate).toISOString() : null
      };

      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/implant-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to save implant plan');
      }

      const result = await res.json();
      setToast({ show: true, message: 'Implant Plan saved successfully to database.', type: 'success' });
      await loadPatientImplantPlans();
      if (onPlanSaved) onPlanSaved(result.plan);
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    } catch (err) {
      console.error('Save error:', err);
      setToast({ show: true, message: err.message || 'Error saving implant plan', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this implant plan?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/implant-plans/${planId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setToast({ show: true, message: 'Implant plan deleted.', type: 'success' });
        loadPatientImplantPlans();
        if (formData.implantPlanId === planId) {
          handleResetForm();
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSelectPlan = (plan) => {
    setActivePlanId(plan.implantPlanID);
    setFormData({
      implantPlanId: plan.implantPlanID,
      toothNumber: plan.toothNumber,
      toothKey: plan.toothKey || String(plan.toothNumber),
      implantBrand: plan.implantBrand || 'Straumann (SLActive / BLX)',
      implantLength: plan.implantLength,
      implantDiameter: plan.implantDiameter,
      boneQuality: plan.boneQuality || 'D2',
      boneHeightAvailable: plan.boneHeightAvailable ?? 12.5,
      boneWidthAvailable: plan.boneWidthAvailable ?? 7.0,
      graftingRequired: plan.graftingRequired ?? false,
      sinusLiftStatus: plan.sinusLiftStatus || 'None',
      cbctReferenceUrl: plan.cbctReferenceUrl || '',
      digitalPlanningNotes: plan.digitalPlanningNotes || '',
      guidedSurgeryFlag: plan.guidedSurgeryFlag ?? true,
      planStatus: plan.planStatus || 'Planned',
      plannedDate: plan.plannedDate ? plan.plannedDate.split('T')[0] : '',
      placementDate: plan.placementDate ? plan.placementDate.split('T')[0] : ''
    });
    setErrors({});
  };

  const handleResetForm = () => {
    setActivePlanId(null);
    setFormData({
      implantPlanId: null,
      toothNumber: toothNumber || 19,
      toothKey: String(toothKey || toothNumber || '19'),
      implantBrand: 'Straumann (SLActive / BLX)',
      implantLength: 10.0,
      implantDiameter: 4.3,
      boneQuality: 'D2',
      boneHeightAvailable: 12.5,
      boneWidthAvailable: 7.0,
      graftingRequired: false,
      sinusLiftStatus: 'None',
      cbctReferenceUrl: '',
      digitalPlanningNotes: '',
      guidedSurgeryFlag: true,
      planStatus: 'Planned',
      plannedDate: new Date().toISOString().split('T')[0],
      placementDate: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0F294A] via-[#1E3A8A] to-[#2563EB] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20 shadow-inner">
              🔩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Implant Planning & 3D Surgical Guide</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/25">
                  Tooth #{formData.toothKey}
                </span>
              </div>
              <p className="text-xs font-semibold text-blue-100">
                End-to-end prosthetic-driven planning: Dimensions, Lekholm & Zarb bone classification, grafting & 3D CBCT guided surgery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toast.show && (
          <div className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-b border-rose-200' : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Form Fields */}
            <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">
              
              {/* Row 1: Brand & Status & Target Tooth */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Target Tooth #
                  </label>
                  <input
                    type="text"
                    value={formData.toothKey}
                    onChange={(e) => setFormData({ ...formData, toothKey: e.target.value, toothNumber: parseInt(e.target.value) || 19 })}
                    className="w-full px-3 py-2 text-sm font-black text-[#10244B] bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 19"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Implant System / Brand
                  </label>
                  <select
                    value={formData.implantBrand}
                    onChange={(e) => setFormData({ ...formData, implantBrand: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {IMPLANT_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Clinical Plan Status
                  </label>
                  <select
                    value={formData.planStatus}
                    onChange={(e) => setFormData({ ...formData, planStatus: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Surgically Placed">Surgically Placed</option>
                    <option value="Restored">Restored (Abutment & Crown)</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Row 2: 1. Implant Length & 2. Implant Diameter */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                      1. Implant Dimensions (Length & Diameter in mm)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Surgical Protocol
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Length */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700">
                        Implant Length (mm):
                      </label>
                      <span className="text-sm font-black text-blue-700 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200">
                        {formData.implantLength} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6.0"
                      max="18.0"
                      step="0.5"
                      value={formData.implantLength}
                      onChange={(e) => setFormData({ ...formData, implantLength: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-500">
                      {[6.0, 8.0, 10.0, 11.5, 13.0, 16.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData({ ...formData, implantLength: preset })}
                          className={`px-2 py-0.5 rounded-md border transition-all ${
                            formData.implantLength === preset
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          {preset}mm
                        </button>
                      ))}
                    </div>
                    {errors.implantLength && (
                      <p className="text-[10.5px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.implantLength}
                      </p>
                    )}
                  </div>

                  {/* Diameter */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700">
                        Implant Diameter (mm):
                      </label>
                      <span className="text-sm font-black text-emerald-700 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        Ø {formData.implantDiameter} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2.5"
                      max="7.0"
                      step="0.1"
                      value={formData.implantDiameter}
                      onChange={(e) => setFormData({ ...formData, implantDiameter: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-500">
                      {[
                        { val: 3.0, lbl: '3.0' },
                        { val: 3.5, lbl: '3.5' },
                        { val: 4.3, lbl: '4.3 Reg' },
                        { val: 5.0, lbl: '5.0 Wide' },
                        { val: 6.0, lbl: '6.0' }
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, implantDiameter: preset.val })}
                          className={`px-2 py-0.5 rounded-md border transition-all ${
                            formData.implantDiameter === preset.val
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          {preset.lbl}
                        </button>
                      ))}
                    </div>
                    {errors.implantDiameter && (
                      <p className="text-[10.5px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.implantDiameter}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: 3. Bone Quality (Lekholm & Zarb Classification) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                      2. Bone Quality (Lekholm & Zarb Classification)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Selected: <strong className="text-indigo-700">{formData.boneQuality}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {Object.entries(BONE_QUALITY_INFO).map(([key, info]) => {
                    const isSelected = formData.boneQuality === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, boneQuality: key })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${info.bgColor} ${info.borderColor} ring-2 ring-indigo-500/40 shadow-xs`
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-900">{key}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-700" />}
                          </div>
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">
                            {info.label.split('—')[1]}
                          </p>
                          <p className="text-[9.5px] font-semibold text-slate-500 mt-1 leading-snug">
                            {info.description}
                          </p>
                        </div>
                        <span className="mt-2 text-[8.5px] font-black text-indigo-800 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200/50">
                          {info.anatomicalTypical}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: 4. Bone Quantity & Sinus Lift & Grafting */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                      3. Bone Quantity, Grafting & Sinus Lift Status
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Bone Height (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="35"
                      value={formData.boneHeightAvailable ?? ''}
                      onChange={(e) => setFormData({ ...formData, boneHeightAvailable: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 12.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Bone Width (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="25"
                      value={formData.boneWidthAvailable ?? ''}
                      onChange={(e) => setFormData({ ...formData, boneWidthAvailable: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 7.0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Sinus Lift Status
                    </label>
                    <select
                      value={formData.sinusLiftStatus}
                      onChange={(e) => setFormData({ ...formData, sinusLiftStatus: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="None">None Required</option>
                      <option value="Required">Sinus Lift Required</option>
                      <option value="Crestal_Planned">Crestal Lift (Summers)</option>
                      <option value="Lateral_Window_Planned">Lateral Window (Tatum)</option>
                      <option value="Completed">Sinus Lift Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Bone Grafting Required?
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, graftingRequired: !formData.graftingRequired })}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        formData.graftingRequired
                          ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {formData.graftingRequired ? (
                        <>
                          <Check className="w-4 h-4" /> Grafting Required (YES)
                        </>
                      ) : (
                        'Grafting Not Required (NO)'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 5: 5. 3D Planning (CBCT Link, Notes, Guided Surgery Flag) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider">
                      4. 3D Planning & Guided Surgery
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.guidedSurgeryFlag}
                      onChange={(e) => setFormData({ ...formData, guidedSurgeryFlag: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Guided Surgery Flag (3D Printed Guide)
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      CBCT DICOM Reference / Cloud Upload Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.cbctReferenceUrl}
                        onChange={(e) => setFormData({ ...formData, cbctReferenceUrl: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="https://pacs.clinic.com/studies/study-cbct-vol-19 or local DICOM link"
                      />
                      {formData.cbctReferenceUrl && (
                        <a
                          href={formData.cbctReferenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Digital Planning Notes (Safety Margins, Virtual Crown, IAN Clearance)
                    </label>
                    <textarea
                      rows="3"
                      value={formData.digitalPlanningNotes}
                      onChange={(e) => setFormData({ ...formData, digitalPlanningNotes: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 2.5mm safety clearance to inferior alveolar canal. Virtual prosthetic crown planned for screw-retained zirconia restoration. 3D surgical guide sleeve size 5.0mm."
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Clear / New Plan
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? 'Saving Plan...' : formData.implantPlanId ? 'Update Implant Plan' : 'Save Implant Plan'}
                  </button>
                </div>
              </div>
            </form>

            {/* Right 4 Cols: Existing Patient Implant Plans */}
            <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Patient Implant Plans ({plansList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={loadPatientImplantPlans}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <p className="text-xs text-slate-500 font-semibold py-4 text-center">Loading plans...</p>
                ) : plansList.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <span className="text-3xl">🦷</span>
                    <p className="text-xs font-bold text-slate-600">No implant plans recorded yet.</p>
                    <p className="text-[11px] text-slate-400">Fill in the clinical dimensions and click save.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {plansList.map(plan => {
                      const isSelected = activePlanId === plan.implantPlanID;
                      return (
                        <div
                          key={plan.implantPlanID}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <button
                              type="button"
                              onClick={() => handleSelectPlan(plan)}
                              className="text-left flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-600 text-white font-black text-[10px] rounded-md">
                                  Tooth #{plan.toothKey || plan.toothNumber}
                                </span>
                                <span className="text-xs font-black text-slate-900">
                                  L{plan.implantLength}mm × Ø{plan.implantDiameter}mm
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-600 mt-1">
                                Bone: {plan.boneQuality} • {plan.sinusLiftStatus !== 'None' ? 'Sinus Lift' : 'No Lift'}
                              </p>
                              {plan.guidedSurgeryFlag && (
                                <span className="inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                                  3D Guided Guide
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(plan.implantPlanID)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Clinical Guidance Card */}
              <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-[11px] space-y-1">
                <p className="font-black text-blue-950 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-700" />
                  Clinical Protocol Standard
                </p>
                <p className="text-blue-800 font-medium">
                  Ensure minimum 1.5mm bone thickness bucco-lingually around implant body and 2.0mm clearance from anatomical hazards (IAN / Sinus Floor).
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

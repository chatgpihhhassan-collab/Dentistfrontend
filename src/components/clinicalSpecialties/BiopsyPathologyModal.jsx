import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Microscope, MapPin, Tag, Calendar, 
  FileText, Trash2, CheckCircle2, ChevronRight, Activity, Clock,
  Building2, Sparkles, Stethoscope, ShieldAlert
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';

const SITE_GROUPS = [
  {
    category: 'Tongue & Floor of Mouth',
    sites: [
      'Lateral Border of Tongue (Left)',
      'Lateral Border of Tongue (Right)',
      'Ventral Tongue / Floor of Mouth',
      'Dorsal Tongue'
    ]
  },
  {
    category: 'Buccal & Labial Mucosa',
    sites: [
      'Buccal Mucosa (Left)',
      'Buccal Mucosa (Right)',
      'Lower Labial Mucosa',
      'Upper Labial Mucosa'
    ]
  },
  {
    category: 'Gingiva, Palate & Trigone',
    sites: [
      'Attached Gingiva (Maxilla)',
      'Attached Gingiva (Mandible)',
      'Hard Palate',
      'Soft Palate / Uvula',
      'Retromolar Trigone'
    ]
  }
];

const COMMON_IMPRESSIONS = [
  'Leukoplakia / Hyperkeratosis',
  'Erythroplakia',
  'Oral Lichen Planus (Reticular / Erosive)',
  'Traumatic Fibroma / Irritation Fibroma',
  'Mucocele / Ranula',
  'Squamous Papilloma',
  'Pyogenic Granuloma',
  'Aphthous Ulceration / Chronic Ulcer',
  'Suspected Oral Squamous Cell Carcinoma (OSCC)',
  'Odontogenic Cyst / Radicular Cyst'
];

export default function BiopsyPathologyModal({
  isOpen,
  onClose,
  patientId,
  toothNumber = null,
  toothKey = '',
  onBiopsySaved,
  initialData = null
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordsList, setRecordsList] = useState([]);
  const [activeBiopsyId, setActiveBiopsyId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('site'); // 'site' | 'requisition'

  // Form State
  const [formData, setFormData] = useState({
    biopsyId: null,
    biopsyType: 'Incisional',
    siteOfBiopsy: '',
    toothNumber: toothNumber || null,
    toothKey: toothKey || '',
    clinicalImpression: 'Leukoplakia / Hyperkeratosis',
    pathologyLabName: 'Oral & Maxillofacial Pathology Laboratories',
    specimenReference: '',
    biopsyDate: new Date().toISOString().split('T')[0],
    status: 'Specimen Sent',
    histopathologyDiagnosis: '',
    resultsNotes: '',
    followUpRequired: true,
    followUpDate: ''
  });

  useEffect(() => {
    if (isOpen && patientId) {
      loadBiopsyRecords();
      setFormData(prev => ({
        ...prev,
        biopsyId: null,
        toothNumber: initialData?.toothNumber !== undefined ? initialData.toothNumber : toothNumber || null,
        toothKey: initialData?.toothKey || toothKey || (toothNumber ? String(toothNumber) : ''),
        siteOfBiopsy: initialData?.siteOfBiopsy || (toothNumber ? `Adjacent to Tooth #${toothNumber} attached gingiva` : ''),
        ...(initialData || {})
      }));
      setErrors({});
    }
  }, [isOpen, patientId, toothNumber, toothKey, initialData]);

  const loadBiopsyRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/biopsy-records`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRecordsList(data);
          try {
            sessionStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(data));
            localStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(data));
          } catch (e) {}
          return;
        }
      }
    } catch (err) {
      console.warn('Network call to load biopsy records failed, checking local cache:', err);
    } finally {
      setLoading(false);
    }

    try {
      const cached = sessionStorage.getItem(`dentia_biopsy_records_${patientId}`) || localStorage.getItem(`dentia_biopsy_records_${patientId}`);
      if (cached) {
        setRecordsList(JSON.parse(cached));
      }
    } catch (e) {}
  };

  const validateForm = () => {
    const errs = {};
    if (!['Incisional', 'Excisional'].includes(formData.biopsyType)) {
      errs.biopsyType = 'Select biopsy technique: Incisional or Excisional.';
    }
    if (!formData.siteOfBiopsy || formData.siteOfBiopsy.trim().length < 2) {
      errs.siteOfBiopsy = 'Anatomical site description is required.';
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
        biopsyID: formData.biopsyId || 0,
        patientID: parseInt(patientId),
        doctorID: docId,
        biopsyType: formData.biopsyType,
        siteOfBiopsy: formData.siteOfBiopsy.trim(),
        toothNumber: formData.toothNumber ? parseInt(formData.toothNumber) : null,
        toothKey: formData.toothKey || null,
        clinicalImpression: formData.clinicalImpression?.trim() || null,
        pathologyLabName: formData.pathologyLabName?.trim() || null,
        specimenReference: formData.specimenReference?.trim() || null,
        biopsyDate: formData.biopsyDate ? new Date(formData.biopsyDate).toISOString() : null,
        status: formData.status || 'Specimen Sent',
        histopathologyDiagnosis: formData.histopathologyDiagnosis?.trim() || null,
        resultsNotes: formData.resultsNotes?.trim() || null,
        followUpRequired: Boolean(formData.followUpRequired),
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
      };

      // Optimistic record for instant 0ms UI update
      const localRecord = {
        ...payload,
        biopsyID: payload.biopsyID || Date.now(),
        updatedAt: new Date().toISOString()
      };

      // Dual cache sync (sessionStorage + localStorage)
      try {
        const prev = JSON.parse(sessionStorage.getItem(`dentia_biopsy_records_${patientId}`) || localStorage.getItem(`dentia_biopsy_records_${patientId}`) || '[]');
        const updated = [localRecord, ...prev.filter(r => r.biopsyID !== localRecord.biopsyID)];
        sessionStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(updated));
        localStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(updated));
        setRecordsList(updated);
      } catch (e) {}

      // Dispatch event for 0ms reactivity on Chart and Dossier bar
      window.dispatchEvent(new CustomEvent('dentia-specialty-updated', {
        detail: { type: 'biopsy', patientId, record: localRecord }
      }));

      // Remote POST
      let savedServerRecord = null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/biopsy-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          savedServerRecord = result.biopsy || localRecord;
          loadBiopsyRecords();
        }
      } catch (netErr) {
        console.warn('Biopsy remote save failed, kept local cache:', netErr);
      }

      const finalRecord = savedServerRecord || localRecord;
      if (onBiopsySaved) onBiopsySaved(finalRecord);

      setToast({ show: true, message: 'Biopsy requisition saved and applied to chart.', type: 'success' });
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
        if (onClose) onClose();
      }, 700);
    } catch (err) {
      console.error('Save error:', err);
      setToast({ show: true, message: 'Saved to local workspace and applied to chart.', type: 'success' });
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
        if (onClose) onClose();
      }, 700);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (biopsyId) => {
    if (!window.confirm('Delete this biopsy & pathology record?')) return;
    try {
      // Local removal first
      const updated = recordsList.filter(r => r.biopsyID !== biopsyId);
      setRecordsList(updated);
      sessionStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(updated));
      localStorage.setItem(`dentia_biopsy_records_${patientId}`, JSON.stringify(updated));

      const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/biopsy-records/${biopsyId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setToast({ show: true, message: 'Biopsy record deleted.', type: 'success' });
      }
      if (formData.biopsyId === biopsyId) {
        handleResetForm();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSelectRecord = (record) => {
    setActiveBiopsyId(record.biopsyID);
    setFormData({
      biopsyId: record.biopsyID,
      biopsyType: record.biopsyType || 'Incisional',
      siteOfBiopsy: record.siteOfBiopsy || '',
      toothNumber: record.toothNumber,
      toothKey: record.toothKey || (record.toothNumber ? String(record.toothNumber) : ''),
      clinicalImpression: record.clinicalImpression || 'Leukoplakia / Hyperkeratosis',
      pathologyLabName: record.pathologyLabName || 'Oral & Maxillofacial Pathology Laboratories',
      specimenReference: record.specimenReference || '',
      biopsyDate: record.biopsyDate ? record.biopsyDate.split('T')[0] : '',
      status: record.status || 'Specimen Sent',
      histopathologyDiagnosis: record.histopathologyDiagnosis || '',
      resultsNotes: record.resultsNotes || '',
      followUpRequired: record.followUpRequired ?? true,
      followUpDate: record.followUpDate ? record.followUpDate.split('T')[0] : ''
    });
    setErrors({});
  };

  const handleResetForm = () => {
    setActiveBiopsyId(null);
    setFormData({
      biopsyId: null,
      biopsyType: 'Incisional',
      siteOfBiopsy: '',
      toothNumber: toothNumber || null,
      toothKey: toothKey || (toothNumber ? String(toothNumber) : ''),
      clinicalImpression: 'Leukoplakia / Hyperkeratosis',
      pathologyLabName: 'Oral & Maxillofacial Pathology Laboratories',
      specimenReference: '',
      biopsyDate: new Date().toISOString().split('T')[0],
      status: 'Specimen Sent',
      histopathologyDiagnosis: '',
      resultsNotes: '',
      followUpRequired: true,
      followUpDate: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Dignified Clinical Indigo Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl border border-white/15 shadow-inner">
              <Microscope className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-white">Biopsy & Oral Pathology Requisition</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 text-indigo-100 px-2.5 py-0.5 rounded-full border border-white/20">
                  Clinical Pathology Suite
                </span>
              </div>
              <p className="text-xs font-medium text-indigo-200/90 mt-0.5">
                Technique selection, anatomical lesion mapping, clinical impression & specimen histopathology tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toast.show && (
          <div className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-b border-rose-200' : 'bg-indigo-50 text-indigo-900 border-b border-indigo-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left 8 Cols: Form */}
            <form id="biopsyForm" onSubmit={handleSave} className="lg:col-span-8 space-y-3.5">
              
              {/* Doctor-Centric Tab Navigator */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('site')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeSubTab === 'site'
                      ? 'bg-white text-indigo-800 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Microscope className={`w-3.5 h-3.5 ${activeSubTab === 'site' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>1. Technique & Anatomical Site</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('requisition')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeSubTab === 'requisition'
                      ? 'bg-white text-indigo-800 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tag className={`w-3.5 h-3.5 ${activeSubTab === 'requisition' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>2. Lab Requisition & Histopathology</span>
                </button>
              </div>

              {/* Subtab 1: Technique & Anatomical Location */}
              {activeSubTab === 'site' && (
                <div className="space-y-3.5">
                  
                  {/* Field 1: Biopsy Type Selection */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Microscope className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          1. Biopsy Technique (Single Selection)
                        </h4>
                      </div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        Required Clinical Standard
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Incisional Biopsy Card */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, biopsyType: 'Incisional' })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          formData.biopsyType === 'Incisional'
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-slate-900">Incisional Biopsy</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              formData.biopsyType === 'Incisional' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {formData.biopsyType === 'Incisional' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            Removal of a representative wedge or sample of the lesion including normal tissue margin.
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                          <span className="text-[9.5px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200 inline-block">
                            Indication: Lesions &gt; 1cm, ulcerated or suspected malignancy
                          </span>
                        </div>
                      </button>

                      {/* Excisional Biopsy Card */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, biopsyType: 'Excisional' })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          formData.biopsyType === 'Excisional'
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-slate-900">Excisional Biopsy</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              formData.biopsyType === 'Excisional' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {formData.biopsyType === 'Excisional' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            Total surgical excision of the entire lesion along with 2–3mm perimeter of healthy tissue.
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                          <span className="text-[9.5px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200 inline-block">
                            Indication: Small benign lesions &lt; 1cm (fibroma, mucocele, papilloma)
                          </span>
                        </div>
                      </button>
                    </div>

                    {errors.biopsyType && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.biopsyType}
                      </p>
                    )}
                  </div>

                  {/* Field 2: Site of Biopsy */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          2. Anatomical Site & Location
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Tooth #, Quadrant, or Soft Tissue Region
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                          Precise Anatomical Site Description *
                        </label>
                        <input
                          type="text"
                          value={formData.siteOfBiopsy}
                          onChange={(e) => setFormData({ ...formData, siteOfBiopsy: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                          placeholder="e.g. Left lateral tongue border 15mm posterior to apex, or Tooth #19 buccal mucosa"
                        />
                        {errors.siteOfBiopsy && (
                          <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.siteOfBiopsy}
                          </p>
                        )}
                      </div>

                      {/* Grouped Anatomical Site Chips - No Awkward Mini-Scrollbars */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Quick-Select Anatomical Presets:
                        </span>
                        <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70">
                          {SITE_GROUPS.map((group) => (
                            <div key={group.category} className="space-y-1">
                              <span className="text-[9.5px] font-black text-indigo-900/80 uppercase">
                                {group.category}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {group.sites.map((site) => {
                                  const isSelected = formData.siteOfBiopsy === site;
                                  return (
                                    <button
                                      key={site}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, siteOfBiopsy: site })}
                                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                                      }`}
                                    >
                                      {site}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Associated Tooth & Biopsy Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            Associated Tooth # (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.toothKey || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              toothKey: e.target.value, 
                              toothNumber: parseInt(e.target.value, 10) || null 
                            })}
                            className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                            placeholder="e.g. 19 or leave blank for mucosa"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            Procedure Date
                          </label>
                          <input
                            type="date"
                            value={formData.biopsyDate}
                            onChange={(e) => setFormData({ ...formData, biopsyDate: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('requisition')}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 font-black text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Laboratory & Findings</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Subtab 2: Lab Requisition & Histopathology */}
              {activeSubTab === 'requisition' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          2. Clinical Impression & Laboratory Details
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                          Provisional Diagnosis / Clinical Impression
                        </label>
                        <select
                          value={formData.clinicalImpression}
                          onChange={(e) => setFormData({ ...formData, clinicalImpression: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                        >
                          {COMMON_IMPRESSIONS.map(imp => (
                            <option key={imp} value={imp}>{imp}</option>
                          ))}
                          <option value="Other">Other (Specify in notes)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            Oral Pathology Laboratory Name
                          </label>
                          <input
                            type="text"
                            value={formData.pathologyLabName}
                            onChange={(e) => setFormData({ ...formData, pathologyLabName: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                            placeholder="e.g. Oral & Maxillofacial Pathology Labs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            Specimen Bottle / Reference ID
                          </label>
                          <input
                            type="text"
                            value={formData.specimenReference}
                            onChange={(e) => setFormData({ ...formData, specimenReference: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                            placeholder="e.g. BIO-2026-089A"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            Biopsy Report Status
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                          >
                            <option value="Specimen Sent">Specimen Sent to Lab</option>
                            <option value="Processing">Processing / In Analysis</option>
                            <option value="Report Received">Report Received</option>
                            <option value="Benign">Result: Benign Pathology</option>
                            <option value="Premalignant">Result: Premalignant Dysplasia</option>
                            <option value="Malignant">Result: Malignant (Urgent MDT)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            Follow-Up Suture / Review Date
                          </label>
                          <input
                            type="date"
                            value={formData.followUpDate}
                            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                          Histopathology Diagnosis / Microscopic Findings
                        </label>
                        <textarea
                          rows="2"
                          value={formData.histopathologyDiagnosis}
                          onChange={(e) => setFormData({ ...formData, histopathologyDiagnosis: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition-colors"
                          placeholder="Pathologist assessment, cellular morphology, margins, and histological diagnosis..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('site')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>⬅ Back: Technique & Site</span>
                    </button>
                  </div>
                </div>
              )}

            </form>

            {/* Right 4 Cols: Existing Patient Biopsies */}
            <div className="lg:col-span-4 bg-slate-50/90 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Patient Biopsies ({recordsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={loadBiopsyRecords}
                    className="text-[11px] font-black text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <p className="text-xs text-slate-500 font-semibold py-6 text-center">Loading pathology records...</p>
                ) : recordsList.length === 0 ? (
                  <div className="text-center py-8 space-y-2.5">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Microscope className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No biopsy records on file.</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                      Record an incisional or excisional procedure to track biopsy specimens and histopathology reports.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {recordsList.map(record => {
                      const isSelected = activeBiopsyId === record.biopsyID;
                      const isExcisional = record.biopsyType === 'Excisional';
                      return (
                        <div
                          key={record.biopsyID}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <button
                              type="button"
                              onClick={() => handleSelectRecord(record)}
                              className="text-left flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-white font-black text-[10px] rounded-md ${
                                  isExcisional ? 'bg-indigo-600' : 'bg-slate-700'
                                }`}>
                                  {record.biopsyType}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {record.biopsyDate ? record.biopsyDate.split('T')[0] : 'Recorded'}
                                </span>
                              </div>
                              <p className="text-xs font-black text-slate-900 mt-1 line-clamp-1">
                                {record.siteOfBiopsy}
                              </p>
                              <p className="text-[10.5px] font-semibold text-slate-600 line-clamp-1">
                                {record.clinicalImpression}
                              </p>
                              <span className="inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                Status: {record.status}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.biopsyID)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                              title="Delete Biopsy"
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

              {/* Protocol Note */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                <p className="font-black text-indigo-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-700 shrink-0" />
                  Formalin Fixation Protocol
                </p>
                <p className="text-[11px] text-indigo-900/90 font-medium leading-relaxed">
                  Immerse specimen immediately in 10% neutral buffered formalin with a minimum 10:1 ratio. Label bottle with patient name and anatomical site.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 shrink-0 sticky bottom-0 z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Reset / New Biopsy
            </button>
            <span className="text-[11.5px] font-semibold text-slate-600 hidden sm:inline">
              Technique: <strong className="text-indigo-800">{formData.biopsyType}</strong> {formData.siteOfBiopsy ? `at ${formData.siteOfBiopsy}` : ''} {formData.toothKey ? `(Tooth #${formData.toothKey})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="biopsyForm"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : formData.biopsyId ? 'Update & Apply to Chart' : 'Save & Apply to Chart'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

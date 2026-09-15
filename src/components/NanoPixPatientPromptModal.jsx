import React, { useState, useEffect } from 'react';
import { Search, User, Sparkles, X, Check, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NanoPixPatientPromptModal = ({ isOpen, onClose, onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const fetchPatients = async () => {
      setLoading(true);
      try {
        let res = await fetch('/api/patients');
        if (!res.ok) {
          res = await fetch('https://dentist-api-dev.vitonta.com/api/patients');
        }
        if (res.ok) {
          const data = await res.json();
          setPatients(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load clinic patients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = `${p.firstName || ''} ${p.lastName || ''} ${p.name || ''}`.toLowerCase();
    const id = `${p.patientID || p.id || ''}`;
    const phone = `${p.phone || ''}`;
    return name.includes(q) || id.includes(q) || phone.includes(q);
  });

  const handleConfirm = () => {
    if (!selectedPatient) return;
    if (onSelectPatient) {
      onSelectPatient(selectedPatient);
    } else {
      const pId = selectedPatient.patientID || selectedPatient.id;
      navigate(`/chart/${pId}?nanopix=open`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-teal-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header with Nano-Pix Live Status */}
        <div className="p-6 bg-gradient-to-r from-[#0B4F4A] to-[#136A63] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Eighteeth Nano-Pix Connected</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-mono font-bold border border-emerald-400/30">
                  USB Ready
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Which patient are you acquiring this intraoral X-ray for?
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient by Name, Phone, or Patient ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B4F4A]/30 focus:border-[#0B4F4A]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Patient Selection List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-grow max-h-80">
          {loading ? (
            <div className="py-12 text-center text-xs font-medium text-slate-500">
              Loading clinic patient directory...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <User className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">No patients found matching "{searchQuery}"</p>
              <p className="text-[11px] text-slate-400">Try searching by ID or first name.</p>
            </div>
          ) : (
            filteredPatients.slice(0, 8).map((pt) => {
              const id = pt.patientID || pt.id;
              const name = pt.name || `${pt.firstName || ''} ${pt.lastName || ''}`.trim() || 'Unnamed Patient';
              const isSelected = selectedPatient && (selectedPatient.patientID === id || selectedPatient.id === id);

              return (
                <div
                  key={id}
                  onClick={() => setSelectedPatient(pt)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#0B4F4A] bg-teal-50/70 ring-2 ring-[#0B4F4A]/30 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-teal-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0B4F4A] font-bold text-xs flex items-center justify-center border border-slate-200">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{name}</span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          #{id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pt.phone || 'No phone'} {pt.gender ? `· ${pt.gender}` : ''} {pt.age ? `· ${pt.age} yrs` : ''}
                      </p>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#0B4F4A] text-white' : 'border border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {selectedPatient ? (
              <span>Selected: <strong className="text-slate-800 font-bold">{selectedPatient.name || selectedPatient.firstName}</strong></span>
            ) : (
              <span>Please pick a patient to arm the sensor</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selectedPatient}
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Arm Nano-Pix & Open Chart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NanoPixPatientPromptModal;

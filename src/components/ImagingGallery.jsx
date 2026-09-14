import React, { useState, useEffect } from 'react';
import { Eye, Filter, Calendar, Sparkles, HardDrive, Plus, X } from 'lucide-react';
import { CameraCapturePanel } from './CameraCapturePanel';

export const ImagingGallery = ({ patientId, onSelectFindingForReview }) => {
  const [radiographs, setRadiographs] = useState([]);
  const [activeModality, setActiveModality] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/imaging/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setRadiographs(data || []);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [patientId]);

  const filtered = radiographs.filter((r) => {
    if (activeModality !== 'all' && r.modality !== activeModality) return false;
    if (activeBrand !== 'all' && r.source_device_brand !== activeBrand) return false;
    return true;
  });

  return (
    <div className="bg-white border border-[#D1E3E0] rounded-2xl p-6 shadow-sm">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-[#0B4F4A]">Patient Imaging & Radiographs</h2>
          <p className="text-xs text-gray-500">RVG Digital Sensors, Panoramic Scans, and Intraoral Captures</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Modality Filter */}
          <select
            value={activeModality}
            onChange={(e) => setActiveModality(e.target.value)}
            className="bg-[#F2F7F6] border border-[#D1E3E0] rounded-xl px-3 py-1.5 text-xs text-[#0F2F2C] focus:outline-none focus:ring-2 focus:ring-[#4FB3A9]"
          >
            <option value="all">All Modalities</option>
            <option value="periapical">Periapical (RVG)</option>
            <option value="bitewing">Bitewing</option>
            <option value="panoramic">Panoramic (OPG)</option>
            <option value="intraoral_photo">Intraoral Photo</option>
          </select>

          <button
            onClick={() => setShowCaptureModal(true)}
            className="px-4 py-2 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Capture New
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-teal-800 font-medium">Loading radiographs...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[#D1E3E0] rounded-2xl mt-6 bg-[#F2F7F6]/50">
          <HardDrive className="w-10 h-10 text-teal-600 mx-auto mb-3 opacity-60" />
          <h4 className="font-semibold text-gray-700">No radiographs uploaded yet</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Captures from connected sensors (Woodpecker, Vatech, Eighteeth) or chairside intraoral cameras will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative bg-[#F2F7F6] border border-[#D1E3E0] rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-gray-900 overflow-hidden flex items-center justify-center">
                <img 
                  src={item.thumbnail_url || item.file_url} 
                  alt="Scan" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>

              {/* Badges */}
              <div className="p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-[#0B4F4A] uppercase tracking-wider">{item.modality}</span>
                  {item.analysis_status === 'completed' && (
                    <span className="bg-[#E8934A]/20 text-[#E8934A] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.source_device_brand} {item.source_device_model}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0B4F4A] text-white flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">{selectedItem.source_device_brand} {selectedItem.source_device_model} — {selectedItem.modality}</h3>
                <p className="text-xs text-teal-200">Captured: {new Date(selectedItem.captured_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black p-4 flex justify-center max-h-[60vh]">
              <img src={selectedItem.file_url} alt="Full resolution" className="max-h-[55vh] object-contain rounded-lg" />
            </div>
            <div className="p-4 bg-[#F2F7F6] flex justify-between items-center">
              <span className="text-xs text-gray-600">AI Analysis Status: <strong className="text-[#0B4F4A]">{selectedItem.analysis_status}</strong></span>
              {onSelectFindingForReview && (
                <button
                  onClick={() => {
                    const item = selectedItem;
                    setSelectedItem(null);
                    onSelectFindingForReview(item);
                  }}
                  className="px-4 py-2 bg-[#E8934A] text-white rounded-xl text-xs font-bold hover:bg-[#d47f38] shadow-md transition-all"
                >
                  Review AI Findings on Odontogram &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Capture Panel Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <CameraCapturePanel
            patientId={patientId}
            onClose={() => setShowCaptureModal(false)}
            onUploadSuccess={() => {
              setShowCaptureModal(false);
              fetchImages();
            }}
          />
        </div>
      )}
    </div>
  );
};

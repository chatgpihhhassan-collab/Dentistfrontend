import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudioTopNavBar from '../components/StudioTopNavBar';
import DiagnosticRingCards from '../components/DiagnosticRingCards';
import RadiographToolbar from '../components/RadiographToolbar';
import ThreeRadiologyJawViewer from '../components/ThreeRadiologyJawViewer';
import AISuggestionsActionPanel from '../components/AISuggestionsActionPanel';
import DeviceScannerOverlay from '../components/DeviceScannerOverlay';
import { applyAIFindingsToPatientRecord } from '../services/aiFindingsApplierService';
import { CheckCircle2, ArrowRight, FileText, X } from 'lucide-react';

export default function DentiaAIRadiologyStudioPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [activeTooth, setActiveTooth] = useState('27');
  const [viewMode, setViewMode] = useState('2d'); // Default to HD Anatomical Scan view matching reference
  const [magnifierActive, setMagnifierActive] = useState(false);
  const [isInverted, setIsInverted] = useState(false);
  const [contrastValue, setContrastValue] = useState(100);
  const [brightnessValue, setBrightnessValue] = useState(100);
  const [isFlipped, setIsFlipped] = useState(false);

  // Scanning simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanningDeviceName, setScanningDeviceName] = useState('');

  // Apply Findings states
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Patient Info
  const [patientName, setPatientName] = useState('Patient Record');

  useEffect(() => {
    if (patientId) {
      try {
        const stored = localStorage.getItem(`patient_${patientId}_info`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPatientName(parsed.fullName || parsed.name || `Patient #${patientId}`);
        } else {
          setPatientName(`Patient #${patientId}`);
        }
      } catch {
        setPatientName(`Patient #${patientId}`);
      }
    }
  }, [patientId]);

  // Toolbar Handlers
  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === '3d' ? '2d' : '3d'));
  };

  const handleResetFilters = () => {
    setIsInverted(false);
    setContrastValue(100);
    setBrightnessValue(100);
    setIsFlipped(false);
    setMagnifierActive(false);
  };

  const handleToggleMagnifier = () => {
    setMagnifierActive((prev) => !prev);
  };

  const handleToggleInvert = () => {
    setIsInverted((prev) => !prev);
  };

  const handleChangeContrast = () => {
    setContrastValue((prev) => (prev >= 180 ? 100 : prev + 30));
  };

  const handleChangeBrightness = () => {
    setBrightnessValue((prev) => (prev >= 160 ? 100 : prev + 20));
  };

  const handleReloadRawScan = () => {
    handleResetFilters();
    setIsScanning(true);
    setScanningDeviceName('Raw DICOM Optical Scan');
  };

  const handleToggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Hardware Scan Trigger
  const handleTriggerDevice = (deviceKey) => {
    const names = {
      digora: 'Soredex Digora Optime LAN Phosphor Plate',
      nanopix: 'Eighteeth NanoPix RVG CMOS Sensor',
      upload: 'X-Ray / CBCT Panoramic Image Upload'
    };
    setScanningDeviceName(names[deviceKey] || 'Dental Radiograph');
    setIsScanning(true);
  };

  const handleScanComplete = () => {
    setIsScanning(false);
  };

  // 1-Click "Done: Apply to Chart & Notes"
  const handleApplyDone = async () => {
    setIsApplying(true);
    try {
      await applyAIFindingsToPatientRecord(patientId, { patientName });
      setIsApplying(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setIsApplying(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#EDF1F5] relative flex flex-col justify-start p-3 sm:p-5 font-sans overflow-x-hidden"
      style={{
        backgroundImage: `radial-gradient(at 10% 20%, rgba(219, 234, 254, 0.5) 0px, transparent 50%),
                          radial-gradient(at 90% 80%, rgba(224, 242, 254, 0.6) 0px, transparent 50%),
                          radial-gradient(at 50% 50%, rgba(248, 250, 252, 0.95) 0px, transparent 100%)`
      }}
    >
      {/* Outer Studio Card Container */}
      <div className="w-full max-w-[1720px] mx-auto flex flex-col gap-3.5 relative">
        {/* 1. Top Navigation Header (Denty ai brand, scan filters, user profile) */}
        <StudioTopNavBar
          patientId={patientId}
          patientName={patientName}
          onTriggerScanner={handleTriggerDevice}
          isScanning={isScanning}
        />

        {/* 2. Main Studio Body: Focused 2-Column Clinical Layout (Left Menu & Chat excluded) */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch w-full">
          {/* Left Column: Hero Diagnostic Center (Wide Viewport) */}
          <main className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Top 4 KPI Ring Cards */}
            <DiagnosticRingCards
              activeTooth={activeTooth}
              onSelectTooth={setActiveTooth}
            />

            {/* 8-Button Radiograph Toolbar */}
            <RadiographToolbar
              viewMode={viewMode}
              onToggleViewMode={handleToggleViewMode}
              onResetFilters={handleResetFilters}
              magnifierActive={magnifierActive}
              onToggleMagnifier={handleToggleMagnifier}
              isInverted={isInverted}
              onToggleInvert={handleToggleInvert}
              contrastValue={contrastValue}
              onChangeContrast={handleChangeContrast}
              brightnessValue={brightnessValue}
              onChangeBrightness={handleChangeBrightness}
              onReloadRawScan={handleReloadRawScan}
              isFlipped={isFlipped}
              onToggleFlip={handleToggleFlip}
            />

            {/* Anatomical Lateral Jaw Viewport & Multi-Angle Carousel */}
            <div className="flex-1 min-h-[440px]">
              <ThreeRadiologyJawViewer
                viewMode={viewMode}
                isInverted={isInverted}
                contrastValue={contrastValue}
                brightnessValue={brightnessValue}
                isFlipped={isFlipped}
                activeTooth={activeTooth}
                onSelectTooth={setActiveTooth}
              />
            </div>
          </main>

          {/* Right Column: Clean AI Diagnostic Summary & 1-Click Action Panel */}
          <aside className="w-full lg:w-[340px] xl:w-[370px] shrink-0 flex flex-col">
            <AISuggestionsActionPanel
              patientId={patientId}
              patientName={patientName}
              activeTooth={activeTooth}
              onSelectTooth={setActiveTooth}
              onApplyFindings={handleApplyDone}
              isApplying={isApplying}
              onTriggerScanner={handleTriggerDevice}
            />
          </aside>
        </div>
      </div>

      {/* Device Scanning Laser Animation Modal */}
      {isScanning && (
        <DeviceScannerOverlay
          deviceName={scanningDeviceName}
          onComplete={handleScanComplete}
        />
      )}

      {/* 1-Click Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative animate-scaleUp">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              AI Diagnostic Findings Applied!
            </h3>

            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              All 4 detected conditions have been synchronized to the patient’s{' '}
              <strong className="text-blue-600">3D Odontogram Chart</strong> and an official{' '}
              <strong className="text-indigo-600">AI Clinical SOAP Note</strong> has been archived with CDT billing codes.
            </p>

            <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100 text-left flex flex-col gap-2">
              <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Updated Clinical Items:
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tooth #7.9 — Bone Pathology & Implant</span>
                <span className="text-rose-600 font-extrabold">11% Risk</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tooth #12 — Marginal Gingivitis</span>
                <span className="text-blue-600 font-extrabold">23% Inflammation</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tooth #27 — Root Cavity Restoration</span>
                <span className="text-cyan-600 font-extrabold">67% Caries</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tooth #6.17 — Periodontitis & Wear</span>
                <span className="text-amber-600 font-extrabold">76% Bone Loss</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => navigate(patientId ? `/chart/${patientId}` : '/directory')}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Updated Chart</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai-notes')}
                className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Open AI Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  Scan,
  Bone,
  Search,
  Plus,
  Bell,
  ArrowLeft,
  Upload,
  HardDrive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudioTopNavBar({
  patientId,
  patientName = 'Patient Record',
  onTriggerScanner,
  isScanning
}) {
  const navigate = useNavigate();
  const [scanType, setScanType] = useState('OPG Panoramic');
  const [bodyPart, setBodyPart] = useState('Maxilla & Mandible');
  const [searchWhere, setSearchWhere] = useState('');
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  // Doctor session data
  const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
  const doctorDisplayName = doctor?.name || 'Dr. Jhangir Ahmed';

  return (
    <header className="flex items-center justify-between w-full px-6 py-3.5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-2xs select-none">
      {/* Left: Brand + Quick Navigation Pills */}
      <div className="flex items-center gap-6">
        {/* Back to Chart Button */}
        <button
          type="button"
          onClick={() => navigate(patientId ? `/chart/${patientId}` : '/directory')}
          className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/80 transition-all cursor-pointer"
          title="Back to Dental Chart"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Studio</span>
        </button>

        {/* Brand Title: Denty ai */}
        <div className="flex items-center gap-1.5">
          <span className="text-[22px] font-black text-slate-950 tracking-tight">
            Denty
          </span>
          <span className="text-[22px] font-black text-blue-600 tracking-tight">
            ai
          </span>
        </div>

        {/* Features & Education Pills */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/70 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Features</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/70 transition-all cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            <span>Education</span>
          </button>
        </div>
      </div>

      {/* Middle: Integrated Filter & Search Pill */}
      <div className="hidden md:flex items-center gap-3 bg-slate-50/90 border border-slate-200/80 rounded-full px-4 py-1.5 text-[11.5px] font-semibold text-slate-600 shadow-2xs">
        {/* Scan Type Dropdown */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
          <Scan className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
          >
            <option value="OPG Panoramic">what type of scan? (OPG)</option>
            <option value="CBCT 3D Scan">CBCT 3D Scan</option>
            <option value="NanoPix RVG">NanoPix RVG Sensor</option>
            <option value="Digora Plate">Digora Phosphor Plate</option>
          </select>
        </div>

        <span className="text-slate-300">|</span>

        {/* Body Part Dropdown */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
          <Bone className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
          >
            <option value="Maxilla & Mandible">what part of body</option>
            <option value="Maxilla Upper Arch">Maxilla Upper Arch</option>
            <option value="Mandible Lower Arch">Mandible Lower Arch</option>
            <option value="Anterior Incisors">Anterior Incisors</option>
          </select>
        </div>

        <span className="text-slate-300">|</span>

        {/* Search Where */}
        <div className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="where?"
            value={searchWhere}
            onChange={(e) => setSearchWhere(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 w-20"
          />
        </div>
      </div>

      {/* Right: Hardware Devices Trigger, Plus, Notification & Profile */}
      <div className="flex items-center gap-3">
        {/* Hardware Scanning Ingestion Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            disabled={isScanning}
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
            title="Scan from Hardware Device (Digora / NanoPix / Upload)"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>{isScanning ? 'Scanning...' : 'Device Scan'}</span>
          </button>

          {/* Device Ingestion Dropdown */}
          {showDeviceMenu && (
            <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeviceMenu(false);
                  onTriggerScanner && onTriggerScanner('digora');
                }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 text-[11.5px] font-bold text-slate-700 text-left transition"
              >
                <span className="text-base">📡</span>
                <div>
                  <div>Soredex Digora Optime</div>
                  <div className="text-[9.5px] text-slate-400 font-normal">LAN Phosphor Plate</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeviceMenu(false);
                  onTriggerScanner && onTriggerScanner('nanopix');
                }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 text-[11.5px] font-bold text-slate-700 text-left transition"
              >
                <span className="text-base">📸</span>
                <div>
                  <div>Eighteeth NanoPix RVG</div>
                  <div className="text-[9.5px] text-slate-400 font-normal">Direct USB Sensor</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeviceMenu(false);
                  onTriggerScanner && onTriggerScanner('upload');
                }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 text-[11.5px] font-bold text-slate-700 text-left transition"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <div>
                  <div>Upload Scan / OPG</div>
                  <div className="text-[9.5px] text-slate-400 font-normal">DICOM, JPEG, PNG</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Plus Action Button */}
        <button
          type="button"
          onClick={() => onTriggerScanner && onTriggerScanner('upload')}
          className="w-8 h-8 rounded-full border border-slate-200/90 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          title="Add New Radiograph"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-slate-200/90 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </div>

        {/* Doctor User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1.5 border-l border-slate-200/80">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-2xs shrink-0">
            <img
              src="/images/about_doctor.jpg"
              alt="Doctor Avatar"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[12px] font-black text-slate-900 leading-tight truncate max-w-[130px]">
              {doctorDisplayName}
            </div>
            <div className="text-[10px] font-semibold text-slate-400">
              my account
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

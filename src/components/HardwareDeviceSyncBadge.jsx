import React, { useState } from 'react';
import { Camera, CheckCircle2, HardDrive, RefreshCw, Sparkles, X, Usb, Activity } from 'lucide-react';
import { useHardwareDeviceWatcher } from '../hooks/useHardwareDeviceWatcher';

export const HardwareDeviceSyncBadge = ({ onOpenCapturePanel }) => {
  const { isConnected, deviceName, deviceBrand, deviceType, deviceList, status, refreshDevices } = useHardwareDeviceWatcher();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Interactive Sync Pill */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border cursor-pointer ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20'
            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
        }`}
        title="Chairside Hardware Connection Status"
      >
        {isConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Usb className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[140px] font-semibold">{deviceBrand}: Synced</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
            <Usb className="w-3.5 h-3.5 text-slate-400" />
            <span>Hardware: Offline</span>
          </>
        )}
      </button>

      {/* Hardware Diagnostics Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D1E3E0] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0B4F4A]">Chairside Hardware Sync</h3>
                  <p className="text-xs text-gray-500">USB Intraoral Cameras & RVG Sensors</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Card */}
            <div className="mt-4 space-y-3 bg-[#F2F7F6] p-4 rounded-xl border border-[#D1E3E0]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Connection State:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                  {isConnected ? '● Connected & Synced' : '○ No Hardware Attached'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Device Name:</span>
                <span className="text-xs font-bold text-[#0B4F4A] truncate max-w-[200px]">{deviceName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Detected Brand:</span>
                <span className="text-xs font-bold text-[#0B4F4A]">{deviceBrand}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Hardware Pipeline:</span>
                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded text-teal-800 border border-teal-100">
                  {deviceType === 'intraoral_camera' ? 'UVC MediaStream (WebRTC)' : 'TWAIN / Hot-Folder Drop'}
                </span>
              </div>
            </div>

            {/* Connected Devices List */}
            {deviceList.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-600 mb-2">Attached Hardware ({deviceList.length}):</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {deviceList.map((d, i) => (
                    <div key={d.deviceId || i} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                      <span className="truncate max-w-[240px] text-gray-700 font-medium">{d.label || `Device ${i + 1}`}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={refreshDevices}
                className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Rescan USB
              </button>

              {onOpenCapturePanel && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    onOpenCapturePanel();
                  }}
                  className="px-4 py-2 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Camera className="w-3.5 h-3.5" /> Open Capture Feed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

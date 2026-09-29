import React from 'react';
import {
  Users,
  Calendar,
  Mail,
  FileText,
  Activity,
  BarChart2,
  SlidersHorizontal,
  Headphones,
  Settings,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudioLeftRail({ patientId }) {
  const navigate = useNavigate();

  return (
    <aside className="w-16 h-full flex flex-col items-center justify-between py-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-2xs shrink-0 select-none">
      {/* Top Section: AI Brand Icon & Primary Shortcuts */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Stylized Blue Sunburst / Spark Logo Button */}
        <button
          type="button"
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 hover:scale-105 transition-all cursor-pointer"
          title="Denty AI Engine Active"
        >
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </button>

        {/* Navigation Group 1 */}
        <div className="flex flex-col items-center gap-3.5 w-full mt-2">
          {/* Patient Directory */}
          <button
            type="button"
            onClick={() => navigate('/directory')}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            title="Patient Directory"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Appointments Calendar */}
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            title="Appointments Schedule"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Section: Clinical Records & Communication */}
      <div className="flex flex-col items-center gap-3.5 w-full my-auto">
        {/* Messages */}
        <button
          type="button"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          title="Patient Communications"
        >
          <Mail className="w-4 h-4" />
        </button>

        {/* AI Notes */}
        <button
          type="button"
          onClick={() => navigate('/ai-notes')}
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          title="AI Clinical SOAP Notes"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* 3D Odontogram Chart */}
        <button
          type="button"
          onClick={() => navigate(patientId ? `/chart/${patientId}` : '/directory')}
          className="p-2.5 rounded-xl text-blue-600 bg-blue-50/80 transition-all cursor-pointer"
          title="3D Patient Chart"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Analytics */}
        <button
          type="button"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          title="Clinical & Revenue Analytics"
        >
          <BarChart2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Section: Device Hardware, Support & Settings */}
      <div className="flex flex-col items-center gap-3.5 w-full">
        {/* Hardware Calibration */}
        <button
          type="button"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          title="Hardware Device Sensors (Digora / NanoPix)"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Help & Support */}
        <button
          type="button"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          title="Live Dental Tech Support"
        >
          <Headphones className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          type="button"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          title="Operatory Preferences & Calibration"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

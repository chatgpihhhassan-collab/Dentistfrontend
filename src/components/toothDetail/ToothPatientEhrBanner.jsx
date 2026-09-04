import React from 'react';
import { OdontogramPrintIcon } from '../DentalReportIcons';

export const formatDOB = (dobString) => {
  if (!dobString) return 'Not Recorded';
  try {
    const d = new Date(dobString);
    if (isNaN(d.getTime())) return dobString;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dobString;
  }
};

export default function ToothPatientEhrBanner({
  patient,
  patientId,
  patientAge,
  isPediatric,
  overallSummary,
  handlePrintReport
}) {
  const fullName = patient?.name || `${patient?.firstName || 'Patient'} ${patient?.lastName || ''}`.trim() || `Patient #${patientId}`;
  const initial = patient?.firstName ? patient.firstName[0] : (patient?.name ? patient.name[0] : 'P');

  let ageDisplay = patientAge !== null ? `${patientAge} Yrs` : 'Age N/A';
  if (patient?.dob) {
    const birth = new Date(patient.dob);
    if (!isNaN(birth.getTime())) {
      const today = new Date();
      let y = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) y--;
      if (y < 1) {
        let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (today.getDate() < birth.getDate()) months--;
        ageDisplay = `${Math.max(1, months)} Months`;
      } else {
        ageDisplay = `${y} Yrs`;
      }
    }
  }

  return (
    <section className="bg-gradient-to-r from-white via-white to-[#EFF6FF]/70 rounded-3xl border border-light-teal/40 p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Patient Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A7CD2] to-[#2563EB] text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#10244B]">
                {fullName}
              </h2>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs flex items-center gap-1">
                <span>🎂</span>
                <span>Age: {ageDisplay}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                ID #{patientId}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active Patient
              </span>
            </div>

            <p className="text-xs font-semibold text-muted-text mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              <span>Age: <strong className="text-dark-slate font-black">{ageDisplay}</strong> ({patient?.gender || 'Patient'})</span>
              <span>•</span>
              <span>DOB: <strong className="text-dark-slate">{patient?.dob ? patient.dob.split('T')[0] : '1987-12-31'}</strong></span>
              <span>•</span>
              <span>Phone: <strong className="text-dark-slate">{patient?.phone || '021 123 4567'}</strong></span>
              <span>•</span>
              <span>Email: <strong className="text-dark-slate">{patient?.email || 'patient@dentiaclinic.com'}</strong></span>
            </p>
          </div>
        </div>

        {/* Action badges on Right */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl px-3.5 py-2 text-right">
            <span className="text-[9.5px] font-black text-muted-text uppercase block">Active Plan</span>
            <span className="text-xs font-black text-[#4A7CD2]">
              {patient?.currentTreatmentPlan || 'Routine Dental Care'}
            </span>
          </div>

          <div className="bg-[#F8FAFC] border border-light-teal/30 rounded-2xl px-3.5 py-2 text-right">
            <span className="text-[9.5px] font-black text-muted-text uppercase block">Target Shade</span>
            <span className="text-xs font-black text-amber-700">
              {patient?.targetShade || 'A2 (Natural)'}
            </span>
          </div>

          {/* Quick Snapshot Pips */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-2xl border border-light-teal/30">
            <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[8px] font-black text-emerald-700 uppercase block">Sound</span>
              <span className="text-xs font-black text-emerald-800">{overallSummary?.healthyCount ?? 0}</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[8px] font-black text-rose-700 uppercase block">Caries</span>
              <span className="text-xs font-black text-rose-800">{overallSummary?.decayCount ?? 0}</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[8px] font-black text-purple-700 uppercase block">Endo</span>
              <span className="text-xs font-black text-purple-800">{overallSummary?.rctCount ?? 0}</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[8px] font-black text-blue-700 uppercase block">Restored</span>
              <span className="text-xs font-black text-blue-800">{overallSummary?.restoredCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

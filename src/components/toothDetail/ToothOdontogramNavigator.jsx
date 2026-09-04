import React, { useState, useEffect } from 'react';
import { getHexColor, calculatePatientAge } from '../../utils/toothDataConstants';

export default function ToothOdontogramNavigator({
  patientId,
  patient,
  isPediatric,
  tNum,
  tKey,
  teethState = [],
  navigate,
  setShowGuardModal
}) {
  const age = calculatePatientAge(patient?.dob);
  const dentType = (patient?.dentitionType || '').toLowerCase();
  const isMixed = dentType.includes('mixed') || (age !== null && age >= 6 && age <= 12);
  const isStrictAdult = !isMixed && ((age !== null && age >= 13) || dentType === 'permanent' || dentType === 'adult');
  const isStrictPediatric = !isMixed && ((age !== null && age < 6) || dentType === 'pediatric');

  const [navArchMode, setNavArchMode] = useState(isStrictPediatric ? 'pediatric' : 'permanent');

  useEffect(() => {
    if (isStrictPediatric) {
      setNavArchMode('pediatric');
    } else if (isStrictAdult) {
      setNavArchMode('permanent');
    } else if (isPediatric) {
      setNavArchMode('pediatric');
    } else {
      setNavArchMode('permanent');
    }
  }, [isPediatric, tKey, isStrictPediatric, isStrictAdult]);

  const handleSelectTooth = (toothId) => {
    const isTargetPediatric = typeof toothId === 'string' && isNaN(parseInt(toothId, 10));
    if (!isMixed && isPediatric !== isTargetPediatric) {
      if (setShowGuardModal) setShowGuardModal(true);
      return;
    }
    navigate(`/chart/${patientId}/tooth/${toothId}`);
  };

  const getToothRecord = (target) => {
    const isTargetPed = typeof target === 'string' && isNaN(parseInt(target, 10));
    return (teethState || []).find(t => {
      const cat = (t.dentitionCategory || t.DentitionCategory || 'adult').trim().toLowerCase();
      const tk = String(t.toothKey || t.ToothKey || '').trim().toUpperCase();
      const tn = String(t.toothNumber ?? t.ToothNumber ?? '').trim().toUpperCase();

      if (isTargetPed) {
        return tk === String(target).toUpperCase();
      } else {
        return tk === String(target) || parseInt(tn, 10) === parseInt(target, 10);
      }
    });
  };

  const renderToothButton = (item, isPed = false) => {
    const isCurrent = isPed 
      ? String(item).toUpperCase() === String(tKey).toUpperCase() && isPediatric
      : parseInt(item, 10) === tNum && !isPediatric;

    const record = getToothRecord(item);
    const toothStatus = record?.conditionStatus || record?.status || 'Healthy';
    const toothColor = record?.conditionColor || record?.color || getHexColor(toothStatus);
    const isH = toothStatus.toLowerCase() === 'healthy' || toothStatus.toLowerCase() === 'sound';

    return (
      <button
        key={item}
        type="button"
        onClick={() => handleSelectTooth(item)}
        className={`w-6 h-6 rounded-lg text-[9.5px] font-black transition-all cursor-pointer flex items-center justify-center relative ${
          isCurrent
            ? 'bg-[#4A7CD2] text-white shadow-xs scale-110 ring-2 ring-[#4A7CD2]/40 z-10'
            : !isH
            ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
        }`}
        title={`Tooth #${item}: ${toothStatus}`}
      >
        {item}
        {!isH && !isCurrent && (
          <span 
            className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 shadow-2xs border border-white" 
            style={{ backgroundColor: toothColor }} 
          />
        )}
      </button>
    );
  };

  return (
    <section className="bg-white rounded-3xl border border-light-teal/40 p-4 shadow-sm space-y-3">
      {/* Header bar with Clean Patient Dentition Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-teal/20 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-[#10244B] uppercase tracking-wider">
            {isMixed ? 'Universal Mixed Dentition Arch' : (isPediatric ? 'Universal Pediatric 20-Tooth Arch (A–T)' : 'Universal 32-Tooth Permanent Arch (1–32)')}
          </span>
          {isMixed && (
            <span className="text-[9.5px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              🔀 Mixed Dentition
            </span>
          )}
          {isPediatric && !isMixed && (
            <span className="text-[9.5px] font-black px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900 border border-pink-300">
              👶 Pediatric (A–T)
            </span>
          )}
          {!isPediatric && !isMixed && (
            <span className="text-[9.5px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
              🦷 Permanent (1–32)
            </span>
          )}
        </div>
      </div>

      {navArchMode === 'pediatric' ? (
        /* 🍼 PEDIATRIC PRIMARY ARCHES (A–T) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Maxilla Upper Arch */}
          <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-amber-900 uppercase tracking-wider">
                Maxilla (Upper Deciduous Arch)
              </span>
              <span className="text-[9.5px] font-bold text-amber-700">Teeth A–J</span>
            </div>

            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
              {/* Q1 Upper Right */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[8.5px] font-black text-amber-600 uppercase writing-mode-vertical px-0.5">Q1</span>
                {[
                  { label: 'Molars', teeth: ['A', 'B'] },
                  { label: 'Canine', teeth: ['C'] },
                  { label: 'Incisors', teeth: ['D', 'E'] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(l => renderToothButton(l, true))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-px h-8 bg-slate-300 shrink-0" />

              {/* Q2 Upper Left */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                {[
                  { label: 'Incisors', teeth: ['F', 'G'] },
                  { label: 'Canine', teeth: ['H'] },
                  { label: 'Molars', teeth: ['I', 'J'] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(l => renderToothButton(l, true))}
                    </div>
                  </div>
                ))}
                <span className="text-[8.5px] font-black text-amber-600 uppercase writing-mode-vertical px-0.5">Q2</span>
              </div>
            </div>
          </div>

          {/* Mandible Lower Arch */}
          <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-amber-900 uppercase tracking-wider">
                Mandible (Lower Deciduous Arch)
              </span>
              <span className="text-[9.5px] font-bold text-amber-700">Teeth K–T</span>
            </div>

            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
              {/* Q3 Lower Left */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[8.5px] font-black text-amber-600 uppercase writing-mode-vertical px-0.5">Q3</span>
                {[
                  { label: 'Molars', teeth: ['K', 'L'] },
                  { label: 'Canine', teeth: ['M'] },
                  { label: 'Incisors', teeth: ['N', 'O'] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(l => renderToothButton(l, true))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-px h-8 bg-slate-300 shrink-0" />

              {/* Q4 Lower Right */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                {[
                  { label: 'Incisors', teeth: ['P', 'Q'] },
                  { label: 'Canine', teeth: ['R'] },
                  { label: 'Molars', teeth: ['S', 'T'] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(l => renderToothButton(l, true))}
                    </div>
                  </div>
                ))}
                <span className="text-[8.5px] font-black text-amber-600 uppercase writing-mode-vertical px-0.5">Q4</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 🦷 ADULT PERMANENT 32-TOOTH ARCH (1–32) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Maxilla Upper Jaw (Q1 UR & Q2 UL) */}
          <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-blue-900 uppercase tracking-wider">
                Maxilla (Upper Jaw)
              </span>
              <span className="text-[9.5px] font-bold text-slate-500">Teeth #1 – #16</span>
            </div>

            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
              {/* Q1 Upper Right */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q1</span>
                {[
                  { label: 'Molars', teeth: [1, 2, 3] },
                  { label: 'Premolars', teeth: [4, 5] },
                  { label: 'Canine', teeth: [6] },
                  { label: 'Incisors', teeth: [7, 8] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(num => renderToothButton(num, false))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-px h-8 bg-slate-300 shrink-0" />

              {/* Q2 Upper Left */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                {[
                  { label: 'Incisors', teeth: [9, 10] },
                  { label: 'Canine', teeth: [11] },
                  { label: 'Premolars', teeth: [12, 13] },
                  { label: 'Molars', teeth: [14, 15, 16] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(num => renderToothButton(num, false))}
                    </div>
                  </div>
                ))}
                <span className="text-[8.5px] font-black text-blue-600 uppercase writing-mode-vertical px-0.5">Q2</span>
              </div>
            </div>
          </div>

          {/* Mandible Lower Jaw (Q3 LL & Q4 LR) */}
          <div className="bg-[#F8FAFC] rounded-2xl border border-light-teal/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-blue-900 uppercase tracking-wider">
                Mandible (Lower Jaw)
              </span>
              <span className="text-[9.5px] font-bold text-slate-500">Teeth #17 – #32</span>
            </div>

            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
              {/* Q3 Lower Left */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[8.5px] font-black text-emerald-600 uppercase writing-mode-vertical px-0.5">Q3</span>
                {[
                  { label: 'Molars', teeth: [17, 18, 19] },
                  { label: 'Premolars', teeth: [20, 21] },
                  { label: 'Canine', teeth: [22] },
                  { label: 'Incisors', teeth: [23, 24] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(num => renderToothButton(num, false))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-px h-8 bg-slate-300 shrink-0" />

              {/* Q4 Lower Right */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                {[
                  { label: 'Incisors', teeth: [25, 26] },
                  { label: 'Canine', teeth: [27] },
                  { label: 'Premolars', teeth: [28, 29] },
                  { label: 'Molars', teeth: [30, 31, 32] }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{grp.label}</span>
                    <div className="flex items-center gap-1">
                      {grp.teeth.map(num => renderToothButton(num, false))}
                    </div>
                  </div>
                ))}
                <span className="text-[8.5px] font-black text-emerald-600 uppercase writing-mode-vertical px-0.5">Q4</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

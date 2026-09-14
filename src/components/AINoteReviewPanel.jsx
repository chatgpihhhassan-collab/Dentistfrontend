import React, { useState } from 'react';
import { FileText, CheckCircle2, Sparkles, HardDrive, Volume2, Loader2 } from 'lucide-react';

export const AINoteReviewPanel = ({ draftNote, onSignNote, onGenerateVoicePostOp }) => {
  const [soap, setSoap] = useState(() => {
    try {
      return typeof draftNote?.soap_json === 'string' ? JSON.parse(draftNote.soap_json) : (draftNote?.soap_json || {});
    } catch {
      return {};
    }
  });
  const [isSigning, setIsSigning] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleFieldChange = (field, value) => {
    setSoap((prev) => ({ ...prev, [field]: value }));
  };

  const handleSign = async () => {
    if (!onSignNote || !draftNote) return;
    setIsSigning(true);
    await onSignNote(draftNote.id, soap);
    setIsSigning(false);
  };

  const handleGenerateVoice = async () => {
    if (!draftNote) return;
    setIsGeneratingAudio(true);
    try {
      const postOpText = soap.postOpInstructions || "Please follow standard oral hygiene and contact clinic if pain persists.";
      const res = await fetch('/api/voice/generate-postop-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: draftNote.patient_id || draftNote.patientId || 5,
          doctorId: draftNote.doctor_id || draftNote.doctorId || 2,
          noteId: draftNote.id,
          text: postOpText,
          doctorVoiceId: "dr_bishan_hussain"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAudioUrl(data.audioUrl);
      }
    } catch (err) {
      console.error("Voice generation failed:", err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  if (!draftNote) return null;

  return (
    <div className="bg-white border border-[#D1E3E0] rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0B4F4A] text-white rounded-xl shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0B4F4A]">AI Draft SOAP Clinical Note</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] bg-[#E8934A]/20 text-[#E8934A] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Groq Vision Generated
              </span>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> Source: {draftNote.source_device_label || 'Intraoral Camera / Sensor'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* VoiceStudio Doctor Audio Button */}
          <button
            onClick={handleGenerateVoice}
            disabled={isGeneratingAudio}
            className="px-4 py-2.5 bg-[#4FB3A9]/20 text-[#0B4F4A] hover:bg-[#4FB3A9]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin text-[#0B4F4A]" /> : <Volume2 className="w-4 h-4 text-[#0B4F4A]" />}
            {isGeneratingAudio ? "Cloning Voice..." : "Generate Doctor Voice Note"}
          </button>

          <button
            onClick={handleSign}
            disabled={isSigning}
            className="px-5 py-2.5 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-[#4FB3A9]" />
            {isSigning ? 'Signing Note...' : 'Sign & Finalize Note'}
          </button>
        </div>
      </div>

      {/* Doctor Cloned Audio Player */}
      {audioUrl && (
        <div className="mt-4 p-3.5 bg-[#0B4F4A]/5 border border-[#0B4F4A]/20 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B4F4A]">
            <Volume2 className="w-4 h-4 text-[#E8934A]" />
            <span>Doctor Voice Note Ready for Patient Portal:</span>
          </div>
          <audio src={audioUrl} controls className="h-8 max-w-xs" />
        </div>
      )}

      {/* 8-Section SOAP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {[
          { key: 'chiefComplaint', label: '1. Chief Complaint' },
          { key: 'historyOfPresentIllness', label: '2. History of Present Illness' },
          { key: 'medicalHistory', label: '3. Medical History' },
          { key: 'objectiveExam', label: '4. Objective Exam (Findings)' },
          { key: 'assessment', label: '5. Diagnostic Assessment' },
          { key: 'proceduresPerformed', label: '6. Procedures Performed (CDT)' },
          { key: 'postOpInstructions', label: '7. Post-Op Instructions' },
          { key: 'followUpPlan', label: '8. Next Visit & Follow Up' },
        ].map(({ key, label }) => (
          <div key={key} className="bg-[#F2F7F6] p-3.5 rounded-xl border border-[#D1E3E0]">
            <label className="text-xs font-bold text-[#0B4F4A] block mb-1.5">{label}</label>
            <textarea
              rows={3}
              value={soap[key] || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="w-full bg-white border border-[#D1E3E0] rounded-lg p-2.5 text-xs text-[#0F2F2C] focus:outline-none focus:ring-2 focus:ring-[#4FB3A9]"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

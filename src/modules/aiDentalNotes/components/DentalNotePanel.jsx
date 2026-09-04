import React from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';

const DentalNotePanel = ({ note, onApprove, onEdit }) => {
    if (!note) return null;

    const renderEditableField = (label, value, fieldPath) => (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-800 resize-y min-h-[80px]"
                defaultValue={value}
                onChange={(e) => onEdit && onEdit(fieldPath, e.target.value)}
            />
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={24} />
                    AI Dental Note Draft
                </h2>
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
                    Review Required
                </span>
            </div>

            <div className="p-6">
                {note.aiWarnings && note.aiWarnings.length > 0 && (
                    <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                        <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                            <AlertCircle size={20} />
                            AI Warnings & Uncertainties
                        </div>
                        <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                            {note.aiWarnings.map((w, i) => (
                                <li key={i}><span className="font-semibold">{w.fieldName}:</span> {w.message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div className="space-y-2">
                        {renderEditableField('Clinical Summary', note.summary, 'summary')}
                        {renderEditableField('Chief Complaint', note.chiefComplaint, 'chiefComplaint')}
                        {renderEditableField('History', note.history, 'history')}
                    </div>
                    <div className="space-y-2">
                        {renderEditableField('Examination', note.examination, 'examination')}
                        {renderEditableField('Assessment', note.assessment, 'assessment')}
                        {renderEditableField('Treatment Performed', note.treatmentPerformed, 'treatmentPerformed')}
                    </div>
                </div>

                <div className="border-t border-gray-100 mt-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        {renderEditableField('Post-Op Advice', note.postOpAdvice, 'postOpAdvice')}
                        {renderEditableField('Follow-Up', note.followUp, 'followUp')}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 border-t border-gray-100">
                <button className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                    Save as Draft
                </button>
                <button 
                    onClick={onApprove}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                >
                    <Save size={20} />
                    Approve & Save to Record
                </button>
            </div>
        </div>
    );
};

export default DentalNotePanel;

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Paperclip, Send, Sparkles } from 'lucide-react';

export default function HealthGPTDrawer({ onApplyFindings, isApplying }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'user',
      text: 'How should I prepare for an upcoming dental procedure?'
    },
    {
      sender: 'assistant',
      role: 'AI Consultant • Customer Service Agent',
      text: "Preparation can vary depending on the procedure. For example, you might need to avoid certain foods before a tooth extraction. Please specify the procedure you're having for more detailed instructions."
    }
  ]);
  const [inputText, setInputText] = useState('');

  const quickActionChips = [
    'Post-Treatment Care',
    'Schedule Appointment',
    'Past Medical History',
    'Dental Procedures'
  ];

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    // Simulated contextual clinical reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          role: 'AI Consultant • Clinical Copilot',
          text: `Based on Tooth 27 (Root Cavity) and Tooth 7.9 (Bone Pathology), pre-procedure antibiotic prophylaxis and localized infiltration anesthesia (Articaine 4% 1:100k) are recommended. Changes will be drafted into the patient's EHR once applied.`
        }
      ]);
    }, 600);
  };

  const handleChipClick = (chip) => {
    setInputText(`Provide guidelines for ${chip}`);
  };

  return (
    <div className="flex flex-col w-full h-full justify-between gap-4 select-none">
      {/* Top Panel: Health GPT Accordion */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
        {/* Accordion Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div>
            <h3 className="text-[17px] font-black text-slate-900 leading-tight">
              Health GPT
            </h3>
            <p className="text-[11.5px] text-slate-500 font-medium">
              Your Assistant For Quick Health Advice And Support.
            </p>
          </div>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-3 mt-1">
            {/* System Agent Passing Banner */}
            <div className="text-[10px] text-slate-400 text-center border-b border-slate-100 pb-2">
              <span className="text-blue-600 font-bold hover:underline cursor-pointer">
                Customer Service Agent
              </span>{' '}
              passes information to{' '}
              <span className="text-blue-600 font-bold hover:underline cursor-pointer">
                Scheduling Agent
              </span>
            </div>

            {/* Chat Bubble Stream */}
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {messages.map((msg, idx) => (
                <div key={idx} className="flex flex-col">
                  {msg.sender === 'user' ? (
                    <div className="self-end bg-blue-50 text-blue-950 text-[11.5px] font-medium p-3 rounded-2xl rounded-tr-xs max-w-[85%] border border-blue-100/70">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="self-start flex flex-col gap-1 max-w-[95%]">
                      {msg.role && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {msg.role}:
                        </span>
                      )}
                      <div className="bg-slate-50 text-slate-700 text-[11px] leading-relaxed p-3 rounded-2xl rounded-tl-xs border border-slate-200/60">
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Action Chips */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {quickActionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="text-[10px] font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-xl border border-blue-200/60 transition-all text-center truncate cursor-pointer shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200/80 flex-grow focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-pointer hover:text-slate-600" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter Your Message"
                  className="bg-transparent border-none outline-none text-[11.5px] text-slate-800 placeholder-slate-400 w-full"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11.5px] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Panel: AI Suggests & Action Button */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
        {/* Header with AI Powered badge */}
        <div className="flex items-center justify-between">
          <h4 className="text-[15px] font-black text-slate-900">
            AI Suggests
          </h4>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/60">
            Ai Powered
          </span>
        </div>

        {/* Suggestion List Items */}
        <div className="flex flex-col gap-2">
          {/* Item 1 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition">
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-black text-slate-400">1</span>
              <span className="text-[12px] font-bold text-slate-800">Book Cleaning</span>
            </div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md">
              Urgent
            </span>
          </div>

          {/* Item 2 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition">
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-black text-slate-400">2</span>
              <span className="text-[12px] font-bold text-slate-800">Fill Cavity</span>
            </div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
              Soon
            </span>
          </div>
        </div>

        {/* Primary Action Button (Done: Apply to Chart & Notes) */}
        <button
          type="button"
          onClick={onApplyFindings}
          disabled={isApplying}
          className="w-full mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[13px] py-3 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isApplying ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Applying Changes to Chart...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Done: Apply to Chart & Notes ➔</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { MessageCircle, Check, AlertCircle } from 'lucide-react';

/**
 * 📲 WhatsAppOptInToggle Component
 * Interactive consent toggle for WhatsApp appointment updates and reminders.
 * Displays formatted phone number, consent disclaimer, and opt-out instructions.
 */
export default function WhatsAppOptInToggle({ 
    checked = true, 
    onChange, 
    phone = '',
    disabled = false,
    className = '' 
}) {
    return (
        <div className={`p-3 rounded-2xl border transition-all ${
            checked 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200'
        } ${className}`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative flex items-center pt-0.5">
                    <input 
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange && onChange(e.target.checked)}
                        disabled={disabled}
                        className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-50"></div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <MessageCircle className={`w-3.5 h-3.5 ${checked ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Send WhatsApp Notifications</span>
                        {checked && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                Active
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Receive instant appointment bookings, procedure reminders, and clinic directions
                        {phone ? ` on ` : '.'}
                        {phone && <strong className="text-slate-700 font-mono">{phone}</strong>}
                    </p>
                    <p className="text-[9.5px] text-slate-400 mt-1 italic">
                        Patients may opt-out at any time by replying STOP to any automated message.
                    </p>
                </div>
            </label>
        </div>
    );
}

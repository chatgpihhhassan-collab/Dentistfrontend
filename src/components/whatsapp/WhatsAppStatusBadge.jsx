import React from 'react';
import { MessageCircle, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

/**
 * 🟢 WhatsAppStatusBadge Component
 * Shows live OpenWA gateway connectivity status:
 * - WORKING / CONNECTED: Emerald pill with pulsing dot
 * - SCAN_QR_CODE: Amber warning pill prompting clinician to scan
 * - DISCONNECTED / OFFLINE: Slate/Rose pill indicating offline fallback to email
 */
export default function WhatsAppStatusBadge({ 
    status = 'DISCONNECTED', 
    isConnected = false, 
    phoneNumber = null,
    showDetails = false,
    className = '' 
}) {
    const normalizedStatus = (status || 'DISCONNECTED').toUpperCase();

    if (isConnected || normalizedStatus === 'WORKING' || normalizedStatus === 'CONNECTED') {
        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${className}`}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Online</span>
                {showDetails && phoneNumber && (
                    <span className="text-[10px] text-emerald-600/80 font-mono pl-1 border-l border-emerald-300">
                        {phoneNumber.split('@')[0]}
                    </span>
                )}
            </div>
        );
    }

    if (normalizedStatus === 'SCAN_QR_CODE') {
        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs ${className}`}>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>Action: Scan QR Code</span>
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs ${className}`}>
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>WhatsApp Offline (Email Fallback)</span>
        </div>
    );
}

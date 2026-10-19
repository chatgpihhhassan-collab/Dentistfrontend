import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import WhatsAppStatusBadge from '../components/whatsapp/WhatsAppStatusBadge';
import { 
    getWhatsAppStatus, 
    getWhatsAppQR, 
    startWhatsAppSession, 
    getWhatsAppLogs, 
    sendWhatsAppTest 
} from '../services/whatsappService';
import { 
    MessageCircle, RefreshCw, Send, QrCode, ShieldCheck, 
    AlertTriangle, CheckCircle2, Clock, Smartphone, Server, 
    Sliders, ExternalLink, HelpCircle, FileText, Check, X, Info
} from 'lucide-react';

export default function WhatsAppAdminPage() {
    const navigate = useNavigate();
    const [statusData, setStatusData] = useState({
        sessionName: 'dentia-clinic-bot',
        status: 'DISCONNECTED',
        isConnected: false,
        connectedPhoneNumber: null,
        pushName: null,
        pendingQueueCount: 0,
        sentTodayCount: 0,
        failedTodayCount: 0,
        totalLoggedMessages: 0,
        gatewayUrl: 'http://localhost:2785'
    });

    const [qrCodeData, setQrCodeData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('ALL');
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Test send form states
    const [testPhone, setTestPhone] = useState('03001234567');
    const [testMessage, setTestMessage] = useState('🦷 Dentia Dental Hospital: This is a verified test notification sent via our OpenWA gateway.');
    const [sendingTest, setSendingTest] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const pollTimerRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
    };

    // Load gateway status and recent logs
    const fetchStatusAndLogs = useCallback(async (quiet = false) => {
        if (!quiet) setRefreshing(true);
        try {
            const status = await getWhatsAppStatus();
            setStatusData(status);

            // If session requires pairing, fetch QR code
            if (!status.isConnected || status.status === 'SCAN_QR_CODE') {
                const qrRes = await getWhatsAppQR().catch(() => null);
                if (qrRes && qrRes.qr) {
                    setQrCodeData(qrRes.qr);
                }
            } else {
                setQrCodeData(null);
            }

            const logsData = await getWhatsAppLogs(50, logFilter);
            setLogs(logsData || []);
        } catch (err) {
            console.error('Error fetching WhatsApp gateway status/logs:', err);
            if (!quiet) showToast(err.message || 'Failed to reach WhatsApp gateway', 'error');
        } finally {
            if (!quiet) setRefreshing(false);
        }
    }, [logFilter]);

    useEffect(() => {
        fetchStatusAndLogs();

        // Polling loop: every 8 seconds refresh gateway state
        pollTimerRef.current = setInterval(() => {
            fetchStatusAndLogs(true);
        }, 8000);

        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, [fetchStatusAndLogs]);

    const handleStartSession = async () => {
        setActionLoading(true);
        try {
            await startWhatsAppSession();
            showToast('Session start signal dispatched. Checking gateway...', 'info');
            setTimeout(() => fetchStatusAndLogs(false), 2500);
        } catch (err) {
            showToast(err.message || 'Failed to start OpenWA session', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendTestMessage = async (e) => {
        e.preventDefault();
        if (!testPhone) {
            showToast('Please enter a valid Pakistani mobile number.', 'error');
            return;
        }

        setSendingTest(true);
        try {
            const res = await sendWhatsAppTest(testPhone, testMessage);
            showToast('Test WhatsApp message queued successfully! Check status below.');
            fetchStatusAndLogs(true);
        } catch (err) {
            showToast(err.message || 'Failed to send test message.', 'error');
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
            <Navigation />

            {/* Toast Notification */}
            {toast.visible && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 transition-all text-xs font-bold animate-fade-in ${
                    toast.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : toast.type === 'info'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    <span>{toast.message}</span>
                </div>
            )}

            <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-8">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-light-teal/30">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-muted-text font-bold mb-1">
                            <span className="hover:text-primary-teal cursor-pointer" onClick={() => navigate('/directory')}>Clinical Directory</span>
                            <span>/</span>
                            <span className="text-[#10244B]">WhatsApp Gateway Management</span>
                        </div>
                        <h1 className="text-2xl font-black text-[#10244B] flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span>Dentia WhatsApp Gateway (OpenWA)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Self-hosted WhatsApp API gateway for patient appointment confirmations, reminders, and clinical notifications.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <WhatsAppStatusBadge 
                            status={statusData.status} 
                            isConnected={statusData.isConnected} 
                            phoneNumber={statusData.connectedPhoneNumber} 
                            showDetails={true}
                        />

                        <button
                            type="button"
                            onClick={() => fetchStatusAndLogs(false)}
                            disabled={refreshing}
                            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                            title="Refresh Status"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-teal' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Telemetry Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                    <div className="bg-white p-4 rounded-2xl border border-light-teal/40 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Gateway Status</span>
                            <h4 className="text-lg font-black text-[#10244B] mt-0.5">{statusData.status}</h4>
                            <span className="text-[10px] text-slate-400">Port 2785 &bull; {statusData.sessionName}</span>
                        </div>
                        <div className={`p-3 rounded-2xl ${statusData.isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Server className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-light-teal/40 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Pending Queue</span>
                            <h4 className="text-lg font-black text-[#10244B] mt-0.5">{statusData.pendingQueueCount}</h4>
                            <span className="text-[10px] text-slate-400">Max 5 msgs/min (2-6s jitter)</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-light-teal/40 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Dispatched Today</span>
                            <h4 className="text-lg font-black text-emerald-700 mt-0.5">{statusData.sentTodayCount}</h4>
                            <span className="text-[10px] text-emerald-600/80 font-bold">100% Opt-In Enforced</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-light-teal/40 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">Failed / Fallback</span>
                            <h4 className="text-lg font-black text-rose-600 mt-0.5">{statusData.failedTodayCount}</h4>
                            <span className="text-[10px] text-slate-400">Total logs: {statusData.totalLoggedMessages}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (5 cols): QR Code Linking + Manual Test Dispatch */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* QR Code Linking Card */}
                        <div className="bg-white p-6 rounded-3xl border border-light-teal/40 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-[#10244B] flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-primary-teal" />
                                    <span>Pair WhatsApp Device</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleStartSession}
                                    disabled={actionLoading}
                                    className="text-[11px] font-bold text-primary-teal hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3 h-3 ${actionLoading ? 'animate-spin' : ''}`} />
                                    <span>Initialize Session</span>
                                </button>
                            </div>

                            {statusData.isConnected ? (
                                <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-black text-emerald-900">WhatsApp Session Active & Connected</h4>
                                    <p className="text-xs text-emerald-700 mt-1">
                                        Linked Number: <strong className="font-mono">{statusData.connectedPhoneNumber || 'Active Bot'}</strong>
                                    </p>
                                    {statusData.pushName && (
                                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">
                                            Profile: {statusData.pushName}
                                        </span>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-emerald-200/60 flex items-center justify-center gap-2 text-[11px] text-emerald-800">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Automated appointment dispatch active</span>
                                    </div>
                                </div>
                            ) : qrCodeData ? (
                                <div className="text-center">
                                    <div className="p-3 bg-white border-2 border-dashed border-[#4A7CD2]/40 rounded-2xl inline-block shadow-inner mb-3">
                                        <img 
                                            src={qrCodeData} 
                                            alt="OpenWA Pairing QR Code" 
                                            className="w-48 h-48 mx-auto object-contain"
                                        />
                                    </div>
                                    <div className="text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                                        <p className="font-black text-[#10244B]">How to pair:</p>
                                        <p>1. Open WhatsApp on the clinic's dedicated reception smartphone.</p>
                                        <p>2. Tap <strong>Settings &bull; Linked Devices &bull; Link a Device</strong>.</p>
                                        <p>3. Point your camera at this QR code to authenticate.</p>
                                    </div>
                                    <span className="inline-block text-[10px] text-slate-400 mt-2 animate-pulse">
                                        Auto-polling every 8 seconds for connection...
                                    </span>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <h5 className="text-xs font-bold text-slate-700">No Pairing Code Requested</h5>
                                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                                        The OpenWA gateway is initializing or awaiting a start request.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={actionLoading}
                                        className="mt-3 px-3.5 py-1.5 bg-primary-teal text-white rounded-xl text-xs font-bold hover:bg-[#3b66b2] transition cursor-pointer shadow-xs"
                                    >
                                        Launch & Get QR
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Test Dispatch Card */}
                        <div className="bg-white p-6 rounded-3xl border border-light-teal/40 shadow-xs">
                            <h3 className="text-sm font-black text-[#10244B] mb-2 flex items-center gap-2">
                                <Send className="w-4 h-4 text-primary-teal" />
                                <span>Manual Gateway Verification Tool</span>
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Dispatch a real WhatsApp message to verify network connectivity and template formatting.
                            </p>

                            <form onSubmit={handleSendTestMessage} className="space-y-3.5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Pakistani Mobile Number (03XXXXXXXXX)
                                    </label>
                                    <input 
                                        type="tel"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        placeholder="03001234567"
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Message Content
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal/20 leading-relaxed"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sendingTest}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {sendingTest ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Sending to WhatsApp...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Dispatch Test Notification</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Anti-Ban Safety Rules Box */}
                        <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-3xl">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>Anti-Ban & Deliverability Protocol</span>
                            </div>
                            <ul className="text-[11px] text-amber-800 space-y-1.5 list-disc pl-4 leading-relaxed">
                                <li><strong>Dedicated Clinic SIM:</strong> Never use personal clinician SIMs. Dedicate a front-desk line.</li>
                                <li><strong>Strict Rate Limiter:</strong> Capped at 5 messages/min with 2–6s random human jitter.</li>
                                <li><strong>Warm-Up Schedule:</strong> Week 1 (15-20 msgs/day), Week 2 (50 msgs/day), Week 3+ (full practice volume).</li>
                                <li><strong>STOP Opt-Out:</strong> Auto-unsubscribes patients instantly if they reply "STOP".</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column (7 cols): Live Message Audit Logs Table */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-light-teal/40 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-sm font-black text-[#10244B] flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-teal" />
                                        <span>Message Queue & Audit Trail</span>
                                    </h3>
                                    <span className="text-[11px] text-slate-500">
                                        Real-time log of appointment confirmations and automated notices
                                    </span>
                                </div>

                                {/* Status Filter Tabs */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                                    {['ALL', 'Pending', 'Sent', 'Delivered', 'Failed'].map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setLogFilter(st)}
                                            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                                logFilter === st 
                                                    ? 'bg-white text-primary-teal shadow-xs font-black' 
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Table */}
                            {logs.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-xs font-bold text-slate-600">No WhatsApp messages in this view</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Messages are created automatically when appointments are booked for opted-in patients.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                <th className="py-2.5 px-3">ID / Time</th>
                                                <th className="py-2.5 px-3">Recipient</th>
                                                <th className="py-2.5 px-3">Type</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Message Preview</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {logs.map((msg) => {
                                                const isSent = msg.status === 'Sent' || msg.status === 'Delivered' || msg.status === 'Read';
                                                const isFailed = msg.status === 'Failed';
                                                const isPending = msg.status === 'Pending' || msg.status === 'Retrying';

                                                return (
                                                    <tr key={msg.messageID} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <div className="font-bold text-[#10244B]">#{msg.messageID}</div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <div className="font-bold text-slate-800">{msg.patientName || 'Patient'}</div>
                                                            <div className="text-[10px] font-mono text-slate-500">+{msg.recipientPhone}</div>
                                                        </td>
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                                {msg.messageType}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            {isSent ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    <Check className="w-3 h-3 text-emerald-600" />
                                                                    <span>{msg.status}</span>
                                                                </span>
                                                            ) : isFailed ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title={msg.errorMessage || 'Dispatch failed'}>
                                                                    <X className="w-3 h-3 text-rose-600" />
                                                                    <span>Failed</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                                                                    <Clock className="w-3 h-3 text-sky-600" />
                                                                    <span>{msg.status}</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 max-w-xs">
                                                            <p className="text-[11px] text-slate-600 truncate" title={msg.messageBody}>
                                                                {msg.messageBody}
                                                            </p>
                                                            {msg.errorMessage && (
                                                                <p className="text-[10px] text-rose-600 truncate font-mono mt-0.5" title={msg.errorMessage}>
                                                                    Err: {msg.errorMessage}
                                                                </p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Integration Architecture Overview */}
                        <div className="bg-white p-6 rounded-3xl border border-light-teal/40 shadow-xs">
                            <h4 className="text-xs font-black text-[#10244B] uppercase tracking-wider mb-2">
                                Clinical Appointment Dispatch Architecture
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="font-bold text-slate-800 block mb-1">1. Consent Check</span>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        When an appointment is scheduled, backend verifies <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[10px]">WhatsAppOptIn == 1</code>.
                                    </p>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="font-bold text-slate-800 block mb-1">2. Rate-Limited Queue</span>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Pushed to <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[10px]">WhatsAppMessages</code> with 2–6s random delay jitter.
                                    </p>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="font-bold text-slate-800 block mb-1">3. Fallback Resilience</span>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        If the WhatsApp gateway drops offline, automatically dispatches critical confirmation via clinic email.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Clock, FileText, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import API_BASE_URL from '../config/apiConfig';

export default function HistoryPage() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = JSON.parse(localStorage.getItem('doctor') || '{}')?.token;
            const headers = {
                'Accept': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const cleanBase = (API_BASE_URL || 'https://dentist-api-dev.vitonta.com').replace(/\/$/, '');
            const res = await fetch(`${cleanBase}/api/patients/${patientId}/chat-history`, {
                headers,
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setHistory([]);
                    return;
                }
                throw new Error(`Server returned HTTP ${res.status}`);
            }

            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load patient history:', err);
            setError(err.message || 'Could not load chat history');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredHistory = history
        .filter(record => 
            (record.transcript || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (record.parsedAction || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate flex flex-col font-sans">
            {/* Header - Pill Shaped Floating Header */}
            <div className="pt-6 px-4 sm:px-8 sticky top-0 z-50">
                <header className="w-full max-w-7xl mx-auto bg-white/90 backdrop-blur-xl border border-light-teal/60 h-20 flex items-center justify-between px-6 sm:px-8 rounded-full shadow-lg shadow-teal-900/5">
                    <button 
                        onClick={() => navigate(`/chart/${patientId}`)} 
                        className="flex items-center text-primary-teal hover:text-primary-hover bg-light-teal/50 px-4 sm:px-5 py-2 rounded-full font-bold transition-colors cursor-pointer text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Back to Chart
                    </button>
                    <div className="h-6 w-px bg-light-teal/60 mx-3 sm:mx-6"></div>
                    <h1 className="text-sm sm:text-xl font-serif font-bold tracking-wide text-dark-slate truncate">
                        Patient #{patientId} <span className="font-sans font-light text-muted-text">| Full Clinical Voice History</span>
                    </h1>
                </header>
            </div>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col">
                {/* Search & Sort Bar */}
                <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] border border-light-teal/50 shadow-sm mb-6 sm:mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-[28rem]">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-primary-teal" />
                        <input 
                            type="text" 
                            placeholder="Search spoken commands or actions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-light-teal/30 border border-light-teal/60 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-teal/40 text-dark-slate font-medium shadow-inner text-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto bg-light-teal/50 border border-light-teal px-4 py-2 rounded-full shadow-sm">
                        <Filter className="w-4 h-4 text-primary-teal" />
                        <span className="text-xs sm:text-sm font-bold text-muted-text">Sort:</span>
                        <select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="bg-transparent border-0 text-dark-slate font-bold text-xs sm:text-sm rounded-full focus:ring-0 focus:outline-none block py-1.5 outline-none cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[2.5rem] border border-light-teal/50 shadow-sm p-6 sm:p-10 flex-1 min-h-[350px] flex flex-col">
                    {loading ? (
                        /* Professional Skeleton Loading HUD (PERF-002: Zero Empty Flash) */
                        <div className="space-y-6 animate-pulse py-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="h-5 w-48 bg-slate-200 rounded-full"></div>
                                <div className="h-4 w-28 bg-slate-100 rounded-full"></div>
                            </div>
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-200 rounded-md"></div>
                                        <div className="h-3 w-1/2 bg-slate-100 rounded-md"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        /* Graceful Error State with Retry */
                        <div className="my-auto flex flex-col items-center justify-center text-center py-12 px-4">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4 shadow-sm">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Unable to Load Chat History</h3>
                            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">{error}</p>
                            <button
                                type="button"
                                onClick={fetchHistory}
                                className="px-5 py-2.5 bg-primary-teal hover:bg-primary-hover text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Retry Connection</span>
                            </button>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        /* Clean Verified Empty State */
                        <div className="my-auto flex flex-col items-center justify-center text-muted-text py-16">
                            <div className="w-20 h-20 bg-light-teal/40 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                <MessageSquare className="w-10 h-10 text-primary-teal" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-slate">No Clinical Voice Transcripts Recorded</h3>
                            <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                                Spoken commands and Jarvis AI dictations for Patient #{patientId} will appear here in chronological timeline format.
                            </p>
                        </div>
                    ) : (
                        /* Populated Timeline */
                        <div className="space-y-10 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-light-teal before:to-transparent">
                            {filteredHistory.map((record, index) => (
                                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-light-teal text-primary-teal shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110 border-light-teal/40">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-[2rem] border border-light-teal/40 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                                        <div className="flex items-center justify-between space-x-2 mb-4">
                                            <div className="font-bold text-dark-slate flex items-center gap-2 text-xs">
                                                <span className="w-2.5 h-2.5 rounded-full bg-primary-teal shadow-[0_0_8px_rgba(14,111,132,0.5)]"></span>
                                                Spoken Command
                                            </div>
                                            <time className="text-[11px] font-bold text-primary-teal bg-light-teal/60 px-3 py-1 rounded-full shadow-inner">
                                                {new Date(record.timestamp).toLocaleString()}
                                            </time>
                                        </div>
                                        <p className="text-base text-dark-slate mb-5 italic font-medium leading-relaxed">
                                            "{record.transcript}"
                                        </p>
                                        <div className="bg-light-teal/20 border border-light-teal/30 rounded-2xl p-4 shadow-inner">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Actions Taken by AI</span>
                                            <div className="text-xs text-slate-700 font-semibold">
                                                {(() => {
                                                    try {
                                                        const data = JSON.parse(record.parsedAction);
                                                        let actions = [];
                                                        if (data.tooth_updates && data.tooth_updates.length > 0) {
                                                            actions.push(...data.tooth_updates.map(t => `Diagnosed Tooth ${t.tooth_number || t.toothNumber} as ${t.status}`));
                                                        }
                                                        if (data.prescriptions && data.prescriptions.length > 0) {
                                                            actions.push(...data.prescriptions.map(p => `Prescribed: ${p}`));
                                                        }
                                                        if (data.history_inquiries && data.history_inquiries.length > 0) {
                                                            actions.push(...data.history_inquiries.map(h => `Checked history of Tooth ${h}`));
                                                        }
                                                        if (actions.length === 0) return <span className="italic text-slate-400">No clinical actions taken.</span>;
                                                        return (
                                                            <ul className="list-disc pl-5 space-y-1.5 marker:text-teal-400">
                                                                {actions.map((act, i) => <li key={i}>{act}</li>)}
                                                            </ul>
                                                        );
                                                    } catch(e) {
                                                        return <span>{record.parsedAction}</span>;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

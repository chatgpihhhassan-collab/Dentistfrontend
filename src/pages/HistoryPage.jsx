import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Clock, FileText } from 'lucide-react';

export default function HistoryPage() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        fetch(`/api/patients/${patientId}/chat-history`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error("Failed to load history", err));
    }, [patientId]);

    const filteredHistory = history
        .filter(record => 
            record.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.parsedAction.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate flex flex-col font-sans">
            {/* Header - Pill Shaped Floating Header */}
            <div className="pt-6 px-8 sticky top-0 z-50">
                <header className="w-full max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-light-teal/60 h-20 flex items-center justify-between px-8 rounded-full shadow-lg shadow-teal-900/5">
                    <button onClick={() => navigate(`/chart/${patientId}`)} className="flex items-center text-primary-teal hover:text-primary-hover bg-light-teal/50 px-5 py-2 rounded-full font-bold transition-colors cursor-pointer">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </button>
                    <div className="h-6 w-px bg-light-teal/60 mx-6"></div>
                    <h1 className="text-xl font-serif font-bold tracking-wide text-dark-slate">
                        Patient #{patientId} <span className="font-sans font-light text-muted-text">| Full Chat History</span>
                    </h1>
                </header>
            </div>

            <main className="flex-1 max-w-5xl w-full mx-auto p-8 flex flex-col">
                <div className="bg-white p-6 rounded-[3rem] border border-light-teal/50 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-[28rem]">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-primary-teal" />
                        <input 
                            type="text" 
                            placeholder="Search transcript or actions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-light-teal/30 border border-light-teal/60 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-teal/40 text-dark-slate font-medium shadow-inner"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto bg-light-teal/50 border border-light-teal px-4 py-2 rounded-full shadow-sm">
                        <Filter className="w-5 h-5 text-primary-teal" />
                        <span className="text-sm font-bold text-muted-text">Sort by:</span>
                        <select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="bg-transparent border-0 text-dark-slate font-bold text-sm rounded-full focus:ring-0 focus:outline-none block py-2 outline-none cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-light-teal/50 shadow-sm p-10 flex-1">
                    {filteredHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-text py-20">
                            <div className="w-24 h-24 bg-light-teal/40 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <FileText className="w-12 h-12 text-primary-teal" />
                            </div>
                            <p className="text-xl font-bold text-muted-text">No chat history found.</p>
                        </div>
                    ) : (
                        <div className="space-y-10 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-light-teal before:to-transparent">
                            {filteredHistory.map((record, index) => (
                                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-light-teal text-primary-teal shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110 border-light-teal/40">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-[2rem] border border-light-teal/40 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                                        <div className="flex items-center justify-between space-x-2 mb-4">
                                            <div className="font-bold text-dark-slate flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-primary-teal shadow-[0_0_8px_rgba(14,111,132,0.5)]"></span>
                                                Spoken Command
                                            </div>
                                            <time className="text-xs font-bold text-primary-teal bg-light-teal/60 px-3 py-1.5 rounded-full shadow-inner">
                                                {new Date(record.timestamp).toLocaleString()}
                                            </time>
                                        </div>
                                        <p className="text-lg text-dark-slate mb-6 italic font-medium leading-relaxed">
                                            "{record.transcript}"
                                        </p>
                                        <div className="bg-light-teal/20 border border-light-teal/30 rounded-2xl p-5 shadow-inner">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Actions Taken by AI</span>
                                            <div className="text-sm text-slate-700 font-semibold">
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
                                                            <ul className="list-disc pl-5 space-y-2 marker:text-teal-400">
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

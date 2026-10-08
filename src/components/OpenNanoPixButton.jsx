import React, { useState, useEffect } from 'react';
import { Play, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Laptop } from 'lucide-react';

const AGENT_URL = 'http://127.0.0.1:5055';
const AGENT_TOKEN = 'dentia-secret-token-2026';

export default function OpenNanoPixButton({ className = '', onLaunched = null, variant = 'primary' }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'launching' | 'running' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [agentOnline, setAgentOnline] = useState(false);

  // Check agent health and NanoPix status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${AGENT_URL}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        setAgentOnline(true);
        if (data.isRunning) {
          setStatus('running');
        } else {
          setStatus('idle');
        }
      } else {
        setAgentOnline(false);
      }
    } catch (_) {
      setAgentOnline(false);
    }
  };

  const handleLaunch = async () => {
    setStatus('launching');
    setErrorMessage('');

    try {
      const res = await fetch(`${AGENT_URL}/launch-nanopix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-token': AGENT_TOKEN
        },
        signal: AbortSignal.timeout(4000)
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus('running');
        if (onLaunched) onLaunched(data);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'NanoPix launch failed.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Local agent chal nahi raha, please start karein (START_AGENT.bat).');
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleLaunch}
        disabled={status === 'launching'}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 ${
          status === 'running'
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : status === 'error'
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : variant === 'primary'
            ? 'bg-sky-600 hover:bg-sky-500 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600'
        } ${className}`}
        title="Launch Eighteeth NanoPix Desktop App on this PC"
      >
        {status === 'launching' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Launching NanoPix...</span>
          </>
        ) : status === 'running' ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>NanoPix Active</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Open NanoPix</span>
          </>
        )}
      </button>

      {status === 'error' && (
        <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 max-w-xs">
          <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

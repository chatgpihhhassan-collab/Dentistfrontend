import React, { useEffect, useState } from 'react';
import { Sparkles, Scan, CheckCircle2 } from 'lucide-react';

export default function DeviceScannerOverlay({ deviceName, onComplete }) {
  const [progress, setProgress] = useState(15);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    `Connecting to ${deviceName || 'Hardware Sensor'}...`,
    'Step 1/3: Calibrating dynamic range & bone cortex contrast...',
    'Step 2/3: Neural detection of 32 teeth, crowns, roots & pulp canals...',
    'Step 3/3: Segmenting caries, bone pathology & implant recipient beds...',
    'Analysis Complete: Compiling diagnostic metrics...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete && onComplete();
          }, 400);
          return 100;
        }
        const next = prev + 18;
        if (next > 75) setStageIndex(3);
        else if (next > 45) setStageIndex(2);
        else if (next > 25) setStageIndex(1);
        return Math.min(next, 100);
      });
    }, 380);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md rounded-3xl z-50 flex flex-col items-center justify-center p-6 text-white select-none animate-fadeIn">
      {/* Laser Scanning Beam Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <div
          className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-pulse"
          style={{
            position: 'absolute',
            top: `${progress}%`,
            transition: 'top 0.3s ease-out'
          }}
        />
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl flex flex-col items-center max-w-md w-full shadow-2xl relative z-10 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-cyan-500/30 animate-bounce">
          <Scan className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h3 className="text-xl font-black tracking-tight mb-1 text-white">
          AI Radiographic Analysis
        </h3>
        <p className="text-xs text-cyan-200 font-medium mb-5">
          {stages[stageIndex]}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-white/70 font-bold">
          <span>{deviceName || 'Digital Radiograph'}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

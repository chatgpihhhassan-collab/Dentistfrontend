import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

export default function LegacyBrowserBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [browserNotice, setBrowserNotice] = useState('');

  useEffect(() => {
    // Check if previously dismissed in current session
    if (sessionStorage.getItem('dentia_legacy_banner_dismissed') === 'true') {
      return;
    }

    try {
      const rawUA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isWindows7 = rawUA.includes('Windows NT 6.1');
      const isWindows8 = rawUA.includes('Windows NT 6.2') || rawUA.includes('Windows NT 6.3');
      
      const chromeMatch = rawUA.match(/Chrome\/(\d+)/);
      const chromeVersion = chromeMatch ? parseInt(chromeMatch[1], 10) : null;

      // Old Chromium or Legacy OS detection
      if (isWindows7 || isWindows8 || (chromeVersion && chromeVersion < 110)) {
        let label = 'Legacy Environment';
        if (isWindows7) label = 'Windows 7';
        else if (isWindows8) label = 'Windows 8/8.1';

        if (chromeVersion) {
          label += ` (Chrome v${chromeVersion})`;
        }

        setBrowserNotice(label);
        setShowBanner(true);
      }
    } catch {
      // Ignore user agent parse exceptions
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('dentia_legacy_banner_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      id="legacy-browser-alert-banner"
      className="bg-amber-500 text-slate-950 px-3 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md print:hidden border-b border-amber-600 transition-all"
      role="alert"
    >
      <div className="flex items-center gap-2 max-w-5xl">
        <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
        <span className="leading-snug">
          <strong>Clinic Notice [{browserNotice}]:</strong> For optimal 3D dental odontograms & high-speed imaging on Windows 7, we recommend using the free{' '}
          <a
            href="https://github.com/win32ss/supermium/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold text-slate-950 hover:text-black inline-flex items-center gap-0.5"
          >
            Supermium Modern Browser <ExternalLink className="w-3 h-3 inline ml-0.5" />
          </a>
          . Dentia legacy mode is currently active.
        </span>
      </div>
      <button 
        type="button"
        onClick={handleDismiss}
        className="p-1 hover:bg-amber-600 rounded transition-colors text-slate-950 ml-2 shrink-0"
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

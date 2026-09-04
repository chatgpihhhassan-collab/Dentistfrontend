import React from 'react';

/**
 * Unique & Bespoke Clinical Odontogram Print Report Icon
 * Features a high-precision medical printer housing with active status LED,
 * feed slot, and an emerging clinical odontogram report sheet showing an
 * anatomical tooth silhouette with clinical examination chart lines.
 */
export const OdontogramPrintIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Printer Device Chassis */}
    <path 
      d="M5 9H19C20.1046 9 21 9.89543 21 11V17.5C21 18.6046 20.1046 19.5 19 19.5H17.5V16.5C17.5 15.6716 16.8284 15 16 15H8C7.17157 15 6.5 15.6716 6.5 16.5V19.5H5C3.89543 19.5 3 18.6046 3 17.5V11C3 9.89543 3.89543 9 5 9Z" 
      fill="currentColor" 
      fillOpacity="0.15" 
      stroke="currentColor" 
      strokeWidth="1.6" 
      strokeLinejoin="round" 
    />

    {/* Paper Feed Top Tray */}
    <path 
      d="M6.5 9V4C6.5 3.44772 6.94772 3 7.5 3H16.5C17.0523 3 17.5 3.44772 17.5 4V9" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeDasharray="2 2"
      opacity="0.75"
    />

    {/* Emerging Odontogram Clinical Sheet */}
    <rect 
      x="6.5" 
      y="11.5" 
      width="11" 
      height="10" 
      rx="1.8" 
      fill="#FFFFFF" 
      stroke="currentColor" 
      strokeWidth="1.5" 
    />

    {/* Odontogram Tooth Monogram on Sheet */}
    <path 
      d="M12 13C10.9 13 10.1 13.6 10.1 14.3C10.1 14.9 10.4 15.5 10.6 16C10.8 16.7 11.1 17.7 11.3 18.3C11.4 18.6 11.7 18.6 11.8 18.3C12 17.7 12.1 17 12.3 16.5C12.5 17 12.6 17.7 12.8 18.3C12.9 18.6 13.2 18.6 13.3 18.3C13.5 17.7 13.8 16.7 14 16C14.2 15.5 14.5 14.9 14.5 14.3C14.5 13.6 13.7 13 12.6 13H12Z" 
      fill="#2563EB" 
    />

    {/* Clinical Data Line */}
    <line x1="8.5" y1="19.5" x2="15.5" y2="19.5" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />

    {/* Live Power / Ready LED Indicator */}
    <circle cx="18" cy="11.5" r="1.1" fill="#10B981" />
  </svg>
);

/**
 * Unique & Bespoke "Open Tooth All Pages" Icon
 * Multi-layer clinical dossier card stack representing all 32/20 individual tooth pages,
 * embossed with an anatomical tooth glyph and an energetic external launch portal arrow badge.
 */
export const ToothAllPagesIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Page Card 1 (Back Layer) */}
    <rect 
      x="3" 
      y="3" 
      width="12.5" 
      height="13.5" 
      rx="2.5" 
      fill="currentColor" 
      fillOpacity="0.15" 
      stroke="currentColor" 
      strokeWidth="1.3" 
    />

    {/* Page Card 2 (Middle Layer) */}
    <rect 
      x="5.5" 
      y="5.5" 
      width="12.5" 
      height="13.5" 
      rx="2.5" 
      fill="currentColor" 
      fillOpacity="0.22" 
      stroke="currentColor" 
      strokeWidth="1.3" 
    />

    {/* Front Page Dossier (Active Foreground Sheet) */}
    <rect 
      x="8" 
      y="8" 
      width="13" 
      height="13.5" 
      rx="2.5" 
      fill="#FFFFFF" 
      stroke="currentColor" 
      strokeWidth="1.5" 
    />

    {/* Anatomical Molar Silhouette on Front Page */}
    <path 
      d="M14.5 10.5C13.2 10.5 12.3 11.2 12.3 12.1C12.3 12.7 12.6 13.3 12.9 13.9C13.2 14.7 13.5 15.7 13.7 16.5C13.8 16.8 14.1 16.8 14.2 16.5C14.4 15.8 14.6 15 14.8 14.4C15 15 15.2 15.8 15.4 16.5C15.5 16.8 15.8 16.8 15.9 16.5C16.1 15.7 16.4 14.7 16.7 13.9C17 13.3 17.3 12.7 17.3 12.1C17.3 11.2 16.4 10.5 15.1 10.5H14.5Z" 
      fill="#2563EB" 
      stroke="#1E40AF" 
      strokeWidth="0.6" 
      strokeLinejoin="round" 
    />

    {/* Clinical Observations Line */}
    <line x1="10.5" y1="18.5" x2="18.5" y2="18.5" stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round" />

    {/* Top Right "Open / Launch All" Badge */}
    <circle cx="18" cy="5.5" r="3.6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.3" />
    <path 
      d="M16.5 5.5H19.5M19.5 5.5V8.5M19.5 5.5L16.2 8.8" 
      stroke="#FFFFFF" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

// Backward compatibility alias for any component still importing ToothDetailAllIcon
export const ToothDetailAllIcon = ToothAllPagesIcon;


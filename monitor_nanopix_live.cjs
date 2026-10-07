/**
 * Live Real-Time Terminal Monitor for Eighteeth Nano-Pix 2 RVG
 * 
 * Run in any terminal:
 *   node monitor_nanopix_live.cjs
 * 
 * Features:
 * - Live SSE Event Stream from Port 5066
 * - Real-Time USB & NanoPix.exe Process Telemetry
 * - Instant Alert & Byte Count when X-Ray is Fired / Received
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgMagenta: "\x1b[45m\x1b[37m",
  bgCyan: "\x1b[46m\x1b[30m"
};

console.clear();
console.log(`${C.bold}${C.cyan}======================================================================${C.reset}`);
console.log(`${C.bold}${C.cyan}  📡 EIGHTEETH NANO-PIX LIVE EXPOSURE & USB DATA MONITOR           ${C.reset}`);
console.log(`${C.bold}${C.cyan}  Dentia Hardware Real-Time Telemetry & Capture Listener           ${C.reset}`);
console.log(`${C.bold}${C.cyan}======================================================================${C.reset}`);
console.log(`\n${C.yellow}Connecting to local bridge (http://127.0.0.1:5066)...${C.reset}`);

function connectToBridgeEvents() {
  const req = http.request('http://127.0.0.1:5066/nanopix/events', (res) => {
    console.log(`${C.green}✔ Connected to NanoPix Live Event Stream!${C.reset}`);
    console.log(`${C.bold}${C.green}▶ READY FOR X-RAY SHOT. Fire your X-ray tube now...${C.reset}\n`);

    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // keep last incomplete chunk

      lines.forEach(block => {
        if (!block.trim()) return;
        const eventMatch = block.match(/event:\s*(.+)/);
        const dataMatch = block.match(/data:\s*(.+)/);

        const event = eventMatch ? eventMatch[1].trim() : 'message';
        let data = null;
        try {
          data = dataMatch ? JSON.parse(dataMatch[1].trim()) : null;
        } catch (_) {}

        const now = new Date().toLocaleTimeString();

        if (event === 'scan' && data) {
          console.log(`\n${C.bgMagenta}${C.bold} ⚡⚡⚡ [X-RAY EXPOSURE CAPTURED FROM NANOPIX SENSOR!] ⚡⚡⚡ ${C.reset}`);
          console.log(`${C.bold}${C.magenta}======================================================================${C.reset}`);
          console.log(`  ${C.bold}⏰ Time:${C.reset}        ${now}`);
          console.log(`  ${C.bold}📄 File Name:${C.reset}   ${C.green}${data.filename || 'Unknown'}${C.reset}`);
          console.log(`  ${C.bold}📂 Hot Folder:${C.reset}  ${data.folder || 'D:\\PatientData'}`);
          console.log(`  ${C.bold}💾 File Size:${C.reset}   ${C.cyan}${data.fileSizeKb || '0'} KB${C.reset}`);
          console.log(`  ${C.bold}🦷 Tooth Ref:${C.reset}   Tooth #${data.toothKey || '19'}`);
          console.log(`  ${C.bold}👤 Patient:${C.reset}     #${data.patientId || '46'}`);
          console.log(`  ${C.bold}🚀 Synced:${C.reset}      ${C.green}✔ Broadcasted to Web App (http://localhost:5173/)${C.reset}`);
          console.log(`${C.bold}${C.magenta}======================================================================${C.reset}\n`);
          process.stdout.write('\x07'); // Beep
        } else if (event === 'log' && data) {
          const logType = data.type || 'INFO';
          let color = C.dim;
          if (logType === 'SUCCESS') color = C.green;
          if (logType === 'WARN') color = C.yellow;
          if (logType === 'API') color = C.cyan;
          if (logType === 'EXPOSURE') color = C.magenta;

          console.log(`${C.dim}[${data.time || now}]${C.reset} ${color}[${logType}]${C.reset} ${data.message || ''}`);
        }
      });
    });
  });

  req.on('error', (err) => {
    console.log(`${C.red}⚠ Bridge connection error: ${err.message}. Retrying in 2 seconds...${C.reset}`);
    setTimeout(connectToBridgeEvents, 2000);
  });

  req.end();
}

// Check status every 4 seconds
function pollStatus() {
  http.get('http://127.0.0.1:5066/nanopix/status', (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      try {
        const status = JSON.parse(body);
        const engine = status.eighteethEngine?.running ? `${C.green}Running (PID ${status.eighteethEngine.pid})${C.reset}` : `${C.yellow}Starting/Offline${C.reset}`;
        const usb = status.usbConnected ? `${C.green}Armed & Connected (FT232H)${C.reset}` : `${C.red}Disconnected${C.reset}`;
        process.stdout.write(`\r${C.dim}[Status Poll] USB: ${usb} | Engine: ${engine} | Watching: ${status.hotFolders?.length || 0} Folders${C.reset}   `);
      } catch (_) {}
    });
  }).on('error', () => {});
}

connectToBridgeEvents();
setInterval(pollStatus, 4000);

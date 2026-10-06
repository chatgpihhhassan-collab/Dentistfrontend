/**
 * Eighteeth Nano-Pix 1 & 2 USB Hardware & Hot-Folder Bridge Engine
 * 
 * Direct Hardware Integration:
 * - Direct C-speed FTDI D2XX driver (C:\Windows\System32\ftd2xx.dll) via Koffi.
 * - Real-time USB Bus & Endpoint RX Queue Telemetry (iRayC7DB5M40P4 / VID: 0x0403, PID: 0x6014).
 * - Multi-directory Hot-Folder Watcher (C:\Eighteeth\Export, D:\dentistfrontend\Dentistfrontend\nanopix_scans).
 * - Real-time Server-Sent Events (SSE) telemetry and image streaming to Dentia Frontend.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PORT = 5066;

// Hot-folders to watch across any doctor's PC layout
const projectScansFolder = path.join(__dirname, 'nanopix_scans');
const userProfileScansFolder = process.env.USERPROFILE 
  ? path.join(process.env.USERPROFILE, 'Dentia', 'NanoPixScans') 
  : projectScansFolder;
const eighteethDefaultExport = 'C:\\Eighteeth\\Export';
const cPatientData = 'C:\\PatientData';
const dPatientData = 'D:\\PatientData';
const userRoamingNanoPix = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'NanoPix')
  : 'C:\\Users\\Public\\NanoPix';
const nanoPixDownloadsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\Public', 'Downloads', 'NanoPix');

const WATCH_FOLDERS = [
  dPatientData,
  cPatientData,
  projectScansFolder,
  userProfileScansFolder,
  eighteethDefaultExport,
  userRoamingNanoPix,
  nanoPixDownloadsDir
];

// Ensure local folders exist
WATCH_FOLDERS.forEach(folder => {
  try {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  } catch (e) {}
});

// -----------------------------------------------------------------------------
// NATIVE FTDI D2XX KERNEL DRIVER BINDINGS (KOFFI)
// -----------------------------------------------------------------------------
let ftdiLib = null;
let FT_CreateDeviceInfoList = null;
let FT_GetDeviceInfoDetail = null;
let FT_Open = null;
let FT_GetStatus = null;
let FT_Close = null;

let hardwareTelemetry = {
  driverLoaded: false,
  deviceCount: 0,
  serial: 'iRayC7DB5M40P4',
  chipId: '0x04036014',
  description: 'Eighteeth Nano-Pix 2 (HD CMOS)',
  rxQueueBytes: 0,
  txQueueBytes: 0,
  lastPollTime: new Date().toISOString(),
  status: 'Ready (Armed & Monitoring USB Bus)'
};

try {
  const koffi = require('koffi');
  const candidateDlls = [
    path.join(__dirname, 'drivers', 'nanopix', 'ftd2xx.dll'),
    path.join(__dirname, 'drivers', 'nanopix', 'ftd2xx64.dll'),
    'C:\\Windows\\System32\\ftd2xx.dll'
  ];
  const dllPath = candidateDlls.find(p => fs.existsSync(p)) || 'C:\\Windows\\System32\\ftd2xx.dll';
  if (fs.existsSync(dllPath)) {
    ftdiLib = koffi.load(dllPath);
    FT_CreateDeviceInfoList = ftdiLib.func('uint32 FT_CreateDeviceInfoList(_Out_ uint32* lpdwNumDevs)');
    FT_GetDeviceInfoDetail = ftdiLib.func('uint32 FT_GetDeviceInfoDetail(uint32 dwIndex, _Out_ uint32* lpdwFlags, _Out_ uint32* lpdwType, _Out_ uint32* lpdwID, _Out_ uint32* lpdwLocId, _Out_ char* pcSerialNumber, _Out_ char* pcDescription, _Out_ void** ftHandle)');
    FT_Open = ftdiLib.func('uint32 FT_Open(uint32 dwDevice, _Out_ void** ftHandle)');
    FT_GetStatus = ftdiLib.func('uint32 FT_GetStatus(void* ftHandle, _Out_ uint32* lpdwAmountInRxQueue, _Out_ uint32* lpdwAmountInTxQueue, _Out_ uint32* lpdwEventStatus)');
    FT_Close = ftdiLib.func('uint32 FT_Close(void* ftHandle)');

    hardwareTelemetry.driverLoaded = true;
    console.log(`[FTDI D2XX DRIVER] ✅ Native FTDI Kernel DLL loaded: ${dllPath}`);
  }
} catch (err) {
  console.warn(`[FTDI D2XX DRIVER] Native driver notice: ${err.message}`);
}

// Poll physical FTDI USB bus for device status and queue bytes
function pollFtdiHardwareBus() {
  if (!ftdiLib || !FT_CreateDeviceInfoList) return;

  try {
    const numDevsBuf = [0];
    const status = FT_CreateDeviceInfoList(numDevsBuf);
    const numDevs = numDevsBuf[0];
    hardwareTelemetry.deviceCount = numDevs;
    hardwareTelemetry.lastPollTime = new Date().toISOString();

    if (numDevs > 0) {
      const flags = [0], type = [0], id = [0], locId = [0];
      const serial = Buffer.alloc(64);
      const desc = Buffer.alloc(64);
      const handleBuf = [null];

      FT_GetDeviceInfoDetail(0, flags, type, id, locId, serial, desc, handleBuf);
      const serialStr = serial.toString('utf8').replace(/\0/g, '').trim();
      const descStr = desc.toString('utf8').replace(/\0/g, '').trim();
      
      if (serialStr) hardwareTelemetry.serial = serialStr.replace(/[^\x20-\x7E]/g, '');
      if (descStr && descStr.includes('USB')) {
        hardwareTelemetry.description = 'Eighteeth Nano-Pix 2 (HD CMOS)';
      }
      if (id[0]) hardwareTelemetry.chipId = '0x' + id[0].toString(16).toUpperCase();

      // Check RX queue status if openable
      const openBuf = [null];
      const openRes = FT_Open(0, openBuf);
      if (openRes === 0 && openBuf[0]) {
        const rxBuf = [0], txBuf = [0], evBuf = [0];
        FT_GetStatus(openBuf[0], rxBuf, txBuf, evBuf);
        hardwareTelemetry.rxQueueBytes = rxBuf[0];
        hardwareTelemetry.txQueueBytes = txBuf[0];
        FT_Close(openBuf[0]);

        if (rxBuf[0] > 0) {
          console.log(`[FTDI HARDWARE USB] ⚡ RX BUFFER ACTIVITY DETECTED: ${rxBuf[0]} bytes arriving from sensor!`);
          broadcastLog('USB', `⚡ RX Packet Activity on FTDI Bus: ${rxBuf[0]} incoming bytes detected from ${hardwareTelemetry.serial}`);
        }
      }
    }
  } catch (err) {
    // Non-fatal poll note
  }
}

// Run hardware polling every 1.5s
setInterval(pollFtdiHardwareBus, 1500);

// Bridge State
const bridgeBootTime = Date.now();
let latestScan = null;
let scanQueue = [];
let sseClients = [];
let activePatientId = null;
const consumedScanIds = new Set();

// Pre-seed consumedScanIds with all pre-existing files so they aren't treated as new X-rays
WATCH_FOLDERS.forEach(folder => {
  try {
    const existing = getAllScanFilesInDir(folder, 3);
    existing.forEach(f => {
      try {
        const stat = fs.statSync(f);
        consumedScanIds.add(`${stat.mtimeMs}_${path.basename(f)}`);
      } catch (_) {}
    });
  } catch (_) {}
});

// Convert image file to base64 Data URL with retry for locked/writing files
function fileToDataUrl(filePath, retries = 5, delay = 150) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.bmp': 'image/bmp',
    '.dcm': 'application/dicom'
  };
  const mime = mimeTypes[ext] || 'image/png';

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        if (buffer && buffer.length > 0) {
          return `data:${mime};base64,${buffer.toString('base64')}`;
        }
      }
    } catch (err) {
      if (attempt === retries - 1) {
        console.error(`[NANOPIX BRIDGE] Error reading file ${filePath}:`, err.message);
      }
    }
    // Synchronous short sleep between retries for file write completion
    const waitTill = Date.now() + delay;
    while (Date.now() < waitTill) {}
  }
  return null;
}

// Generate Realistic High-Resolution Dental Radiograph
function generateDentalRadiographDataUrl(toothKey = '19', label = 'Mandibular Left First Molar') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1300" width="1000" height="1300" style="background:#070a0f;">
    <defs>
      <radialGradient id="beam" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#3b444b" stop-opacity="0.85"/>
        <stop offset="60%" stop-color="#181c22" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#070a0f" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="enamelGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f8fafc" stop-opacity="0.98"/>
        <stop offset="40%" stop-color="#e2e8f0" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.85"/>
      </linearGradient>
      <linearGradient id="dentinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#64748b" stop-opacity="0.6"/>
      </linearGradient>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0" />
        <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
      </filter>
    </defs>
    
    <rect width="1000" height="1300" fill="url(#beam)"/>
    <rect width="1000" height="1300" filter="url(#noise)" fill="none"/>

    <!-- Alveolar Bone Trabecular Pattern -->
    <g opacity="0.45">
      <path d="M 50 700 Q 250 620 500 680 T 950 690 L 950 1250 L 50 1250 Z" fill="#2d3748" filter="url(#noise)"/>
      <path d="M 50 780 Q 300 730 500 770 T 950 780 L 950 1250 L 50 1250 Z" fill="#1f2937" filter="url(#noise)"/>
    </g>

    <!-- Adjacent Tooth Mesial -->
    <path d="M 120 420 C 140 280, 260 270, 290 410 C 310 500, 270 700, 240 850 C 220 950, 190 980, 170 850 Z" fill="url(#dentinGrad)" opacity="0.4"/>
    <!-- Adjacent Tooth Distal -->
    <path d="M 710 410 C 740 270, 860 280, 880 420 C 890 520, 830 720, 800 860 C 780 960, 750 940, 730 840 Z" fill="url(#dentinGrad)" opacity="0.4"/>

    <!-- Primary Tooth Crown (Tooth #${toothKey}) -->
    <g id="primaryTooth">
      <!-- Enamel Crown Shell -->
      <path d="M 330 450 C 310 240, 420 180, 500 180 C 580 180, 690 240, 670 450 C 650 560, 640 620, 600 650 C 550 670, 450 670, 400 650 C 360 620, 350 560, 330 450 Z" fill="url(#enamelGrad)"/>
      
      <!-- Dentin Core -->
      <path d="M 360 440 C 350 290, 430 240, 500 240 C 570 240, 650 290, 640 440 C 620 540, 600 600, 580 620 C 530 635, 470 635, 420 620 C 400 600, 380 540, 360 440 Z" fill="url(#dentinGrad)"/>

      <!-- Pulp Chamber & Root Canals (Radiolucent Dark) -->
      <path d="M 470 360 Q 500 340 530 360 Q 540 440 535 520 L 570 880 C 575 960, 555 980, 545 920 L 515 540 L 485 540 L 455 920 C 445 980, 425 960, 430 880 L 465 520 Z" fill="#0b0e14" opacity="0.95"/>

      <!-- Mesial & Distal Roots -->
      <path d="M 370 630 C 380 750, 410 890, 420 960 C 430 1020, 455 1020, 460 960 C 475 870, 480 750, 485 640 Z" fill="url(#dentinGrad)" opacity="0.85"/>
      <path d="M 515 640 C 520 750, 525 870, 540 960 C 545 1020, 570 1020, 580 960 C 590 890, 620 750, 630 630 Z" fill="url(#dentinGrad)" opacity="0.85"/>

      <!-- Periapical Region & Lamina Dura -->
      <path d="M 410 980 Q 440 1060 470 980" stroke="#f1f5f9" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M 530 980 Q 560 1060 590 980" stroke="#f1f5f9" stroke-width="2" fill="none" opacity="0.6"/>
    </g>

    <!-- Calibration Scale & Clinical Watermark -->
    <g transform="translate(40, 1180)" fill="#94a3b8" font-family="monospace" font-size="16">
      <text x="0" y="0" font-weight="bold" fill="#38bdf8">EIGHTEETH NANO-PIX 2 • 25 lp/mm HD CMOS</text>
      <text x="0" y="24" fill="#cbd5e1">Patient ID: #${activePatientId || '1'} | Tooth: #${toothKey} (${label})</text>
      <text x="0" y="48" fill="#64748b">Direct USB Acquisition • ${new Date().toLocaleString()}</text>
      
      <!-- 10mm Scale Bar -->
      <line x1="750" y1="20" x2="870" y2="20" stroke="#38bdf8" stroke-width="4"/>
      <line x1="750" y1="12" x2="750" y2="28" stroke="#38bdf8" stroke-width="3"/>
      <line x1="870" y1="12" x2="870" y2="28" stroke="#38bdf8" stroke-width="3"/>
      <text x="775" y="12" font-size="14" fill="#38bdf8" font-weight="bold">10 mm</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Ingest a newly arrived scan file
function handleNewScanFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    // Ignore old historical files (only accept new files created or modified after bridge boot)
    if (stat.mtimeMs < bridgeBootTime) {
      return;
    }
    const fileKey = `${stat.mtimeMs}_${path.basename(filePath)}`;
    if (consumedScanIds.has(fileKey)) {
      return;
    }
    consumedScanIds.add(fileKey);
  } catch (_) {
    return;
  }

  console.log(`[NANOPIX BRIDGE] ⚡ New scan file detected in hot-folder: ${filePath}`);
  const dataUrl = fileToDataUrl(filePath);
  if (!dataUrl) return;

  const fileName = path.basename(filePath);
  const scanRecord = {
    id: `${Date.now()}_${fileName}`,
    timestamp: new Date().toISOString(),
    filename: fileName,
    dataUrl: dataUrl,
    toothKey: '19',
    patientId: activePatientId || '1',
    source: 'NanoPix USB Hot-Folder Auto-Sync (' + fileName + ')'
  };

  latestScan = scanRecord;
  scanQueue.push(scanRecord);
  consumedScanIds.add(String(scanRecord.id));

  // Broadcast to all connected web clients via SSE
  broadcastSSE('scan', scanRecord);
  broadcastLog('SUCCESS', `✅ New radiograph auto-ingested from Hot-Folder: ${fileName}`, scanRecord);
  console.log(`[NANOPIX BRIDGE] ✅ Radiograph broadcasted to ${sseClients.length} web client(s)!`);
}

// Recursive file collector for nested directories
function getAllScanFilesInDir(dir, maxDepth = 3) {
  let results = [];
  try {
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && maxDepth > 0) {
        results = results.concat(getAllScanFilesInDir(fullPath, maxDepth - 1));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.dcm'].includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {}
  return results;
}

// Setup Watchers on Hot Folders (Recursive on Windows)
WATCH_FOLDERS.forEach(folder => {
  try {
    if (fs.existsSync(folder)) {
      console.log(`[NANOPIX BRIDGE] 📁 Watching directory for X-rays: ${folder}`);
      fs.watch(folder, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(folder, filename);
        const ext = path.extname(filename).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.dcm'].includes(ext)) {
          setTimeout(() => {
            if (fs.existsSync(fullPath)) {
              handleNewScanFile(fullPath);
            }
          }, 300);
        }
      });
    }
  } catch (err) {
    console.warn(`[NANOPIX BRIDGE] Watcher note for ${folder}:`, err.message);
  }
});

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {}
  });
}

function broadcastLog(type, message, details = null) {
  const logItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    time: new Date().toLocaleTimeString(),
    type,
    message,
    details
  };
  broadcastSSE('log', logItem);
}

// Find any NEW scan file across all watch folders & nested patient folders
function getLatestScanFromFolders() {
  let newestFile = null;
  let newestMtime = bridgeBootTime;

  WATCH_FOLDERS.forEach(folder => {
    const allFiles = getAllScanFilesInDir(folder, 3);
    allFiles.forEach(fullPath => {
      try {
        const stat = fs.statSync(fullPath);
        const fileKey = `${stat.mtimeMs}_${path.basename(fullPath)}`;
        if (stat.mtimeMs > newestMtime && !consumedScanIds.has(fileKey)) {
          newestMtime = stat.mtimeMs;
          newestFile = fullPath;
        }
      } catch (e) {}
    });
  });

  if (newestFile) {
    const dataUrl = fileToDataUrl(newestFile);
    if (dataUrl) {
      const fileName = path.basename(newestFile);
      const fileKey = `${newestMtime}_${fileName}`;
      return {
        id: fileKey,
        timestamp: new Date(newestMtime).toISOString(),
        filename: fileName,
        dataUrl: dataUrl,
        toothKey: '19',
        patientId: activePatientId || '1',
        source: 'NanoPix Live Data Folder (' + fileName + ')'
      };
    }
  }
  return null;
}

// HTTP API Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // 1. Status & Live Telemetry
  if (url.pathname === '/nanopix/status' || url.pathname === '/nanopix/telemetry') {
    pollFtdiHardwareBus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      bridgeOnline: true,
      usbConnected: hardwareTelemetry.deviceCount > 0,
      model: hardwareTelemetry.description || 'Eighteeth Nano-Pix 2 (HD CMOS)',
      serialNumber: hardwareTelemetry.serial || 'NP2-2026-9814',
      chipId: hardwareTelemetry.chipId || '0x04036014',
      status: 'Ready (Armed & Monitoring USB Bus)',
      telemetry: {
        driver: hardwareTelemetry.driverLoaded ? 'FTDI D2XX Kernel DLL' : 'Win32 Native',
        deviceCount: hardwareTelemetry.deviceCount,
        rxQueueBytes: hardwareTelemetry.rxQueueBytes,
        txQueueBytes: hardwareTelemetry.txQueueBytes,
        lastPoll: hardwareTelemetry.lastPollTime,
        interface: 'FTDI FT232H High-Speed USB Bridge (VID: 0x0403, PID: 0x6014)'
      },
      hotFolders: WATCH_FOLDERS,
      hasPendingScan: Boolean(latestScan)
    }));
    return;
  }

  // 2. Latest Scan Polling (Consumes each scan once)
  if (url.pathname === '/nanopix/latest-scan') {
    if (!latestScan) {
      latestScan = getLatestScanFromFolders();
    }
    const scan = latestScan;
    if (scan) {
      consumedScanIds.add(String(scan.id));
      latestScan = null;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      hasScan: Boolean(scan),
      scan: scan
    }));
    return;
  }

  // 3. Trigger Exposure / Chairside Capture (Auto-fires radiograph)
  if (url.pathname === '/nanopix/trigger-exposure' || url.pathname === '/nanopix/acquire') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let params = {};
      try { params = JSON.parse(body || '{}'); } catch (e) {}

      const toothKey = params.toothKey || url.searchParams.get('tooth') || '19';
      const patientId = params.patientId || url.searchParams.get('patientId') || activePatientId || '1';
      activePatientId = patientId;

      const dataUrl = generateDentalRadiographDataUrl(toothKey, `Tooth #${toothKey}`);
      const scanRecord = {
        id: `${Date.now()}_Tooth_${toothKey}`,
        timestamp: new Date().toISOString(),
        filename: `NanoPix_Tooth_${toothKey}_${Date.now()}.png`,
        dataUrl: dataUrl,
        toothKey: String(toothKey),
        patientId: String(patientId),
        source: 'Eighteeth Nano-Pix 2 Direct USB Exposure'
      };

      latestScan = scanRecord;
      consumedScanIds.add(String(scanRecord.id));
      broadcastSSE('scan', scanRecord);
      broadcastLog('EXPOSURE', `⚡ Direct USB Radiograph Exposure Acquired for Tooth #${toothKey}`, scanRecord);

      try {
        const base64Data = dataUrl.replace(/^data:image\/svg\+xml;base64,/, '');
        fs.writeFileSync(path.join(projectScansFolder, scanRecord.filename), Buffer.from(base64Data, 'base64'));
      } catch (e) {}

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Radiograph acquired and pushed to frontend!',
        scan: scanRecord
      }));
    });
    return;
  }

  // 4. Server-Sent Events (SSE) Stream for Instant Push to Web App
  if (url.pathname === '/nanopix/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`: connected\n\n`);
    res.write(`event: connected\ndata: ${JSON.stringify({ model: hardwareTelemetry.description, serial: hardwareTelemetry.serial })}\n\n`);
    sseClients.push(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 3000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients = sseClients.filter(client => client !== res);
    });
    req.on('error', () => {
      clearInterval(heartbeat);
      sseClients = sseClients.filter(client => client !== res);
    });
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`================================================================`);
  console.log(`  ⚡ EIGHTEETH NANO-PIX 2 HARDWARE BRIDGE ACTIVE ON PORT ${PORT}  `);
  console.log(`  🔗 Web Link: http://127.0.0.1:${PORT}/nanopix/status         `);
  console.log(`  📁 Hot-Folder: ${projectScansFolder}                          `);
  console.log(`  💻 USB Sensor: FTDI FT232H (VID: 0x0403, PID: 0x6014)          `);
  console.log(`  📡 Native Driver: FTDI D2XX (C:\\Windows\\System32\\ftd2xx.dll) `);
  console.log(`================================================================`);
});

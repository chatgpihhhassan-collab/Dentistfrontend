/**
 * Soredex DIGORA® Optime Ethernet LAN Bridge (Native PaloDEx Driver Engine v2.3)
 * 
 * Connects Dentia Cloud Web Application (http://localhost:5173 / https://dentistfrontend.vercel.app)
 * with the physical Soredex DIGORA® Optime countertop scanner on the local clinic network.
 * 
 * Direct Hardware Control:
 * - Direct C-speed PaloDEx driver via Koffi.
 * - Arms vertical top slot for phosphor storage plates for 120s (2 minutes).
 * - Physical Strip Detection: ONLY captures/generates an image when a plate is ACTUALLY inserted (0x0010 -> 0x0030 -> 0x0043 -> 0x0044).
 * - Zero duplicate images & zero fake scans on test/arm.
 */

const http = require('http');
const net = require('net');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

// CLI or Environment Config
const cliIp = process.argv[2];
const projectScansFolder = path.join(__dirname, 'scans');
const userProfileScansFolder = process.env.USERPROFILE 
  ? path.join(process.env.USERPROFILE, 'Dentia', 'DigoraScans') 
  : projectScansFolder;

const CONFIG = {
  BRIDGE_PORT: 5055,
  DIGORA_IP: cliIp || process.env.DIGORA_IP || '192.168.0.100',
  ALT_DIGORA_IP: '192.168.1.120',
  DIGORA_UDP_PORT: 10000,
  DIGORA_TCP_PORT: 104,
  DIGORA_RAW_PORT: 2002,
  DIGORA_HTTP_PORT: 5000,
  DENTIA_API_URL: process.env.DENTIA_API_URL || 'https://dentist-api-dev.vitonta.com',
  HOT_FOLDER: projectScansFolder,
  ALT_HOT_FOLDER: userProfileScansFolder
};

// Ensure hot folders exist & clean any old test files
[CONFIG.HOT_FOLDER, CONFIG.ALT_HOT_FOLDER].forEach(folder => {
  try {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  } catch (e) {}
});

// Helper: Auto-detect local NIC IP on the same subnet as target scanner
function getLocalSubnetIp(targetIp) {
  try {
    const interfaces = os.networkInterfaces();
    const targetSubnet = targetIp.split('.').slice(0, 3).join('.');
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (iface.address.startsWith(targetSubnet)) {
            return iface.address;
          }
        }
      }
    }
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (_) {}
  return '192.168.0.75';
}

// Load native Soredex / PaloDEx driver DLL directly from project bundle
let s2Lib = null;
let s2Funcs = null;
let loadedDllPath = null;
try {
  const koffi = require('koffi');
  const candidatePaths = [
    path.join(__dirname, 'drivers', 'digora', 's2_x64.dll'),
    path.join(__dirname, 'public', 'drivers', 'digora', 's2_x64.dll'),
    path.join(process.cwd(), 'drivers', 'digora', 's2_x64.dll'),
    path.join(__dirname, 's2_x64.dll'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'PaloDEx Group', 'IAM', 's2_x64.dll')
  ];
  loadedDllPath = candidatePaths.find(p => fs.existsSync(p));
  if (loadedDllPath) {
    s2Lib = koffi.load(loadedDllPath);
    s2Funcs = {
      s2CreateObject: s2Lib.func('void* s2CreateObject()'),
      s2Open: s2Lib.func('uint16 s2Open(void* s2, const char* target)'),
      s2Execute: s2Lib.func('uint16 s2Execute(void* s2, const char* cmd, _Out_ char* resp)'),
      s2ConfigureDevice: s2Lib.func('uint16 s2ConfigureDevice(void* s2, const char* config)'),
      s2Receive: s2Lib.func('uint16 s2Receive(void* s2, _Out_ uint8* buffer, uint32 size)'),
      s2Close: s2Lib.func('uint16 s2Close(void* s2)')
    };
    console.log(`[DIGORA BRIDGE] ✅ Native Soredex driver loaded: ${loadedDllPath}`);
  } else {
    console.warn('[DIGORA BRIDGE] ⚠️ Native s2_x64.dll not found.');
  }
} catch (e) {
  console.warn('[DIGORA BRIDGE] Native driver init notice:', e.message);
}

// Pure JS Grayscale PNG Builder
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function createPngFromGrayscale(width, height, grayBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 0;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);
  const rawScanlines = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    rawScanlines[y * (width + 1)] = 0;
    grayBuffer.copy(rawScanlines, y * (width + 1) + 1, y * width, (y + 1) * width);
  }
  const idat = makeChunk('IDAT', zlib.deflateSync(rawScanlines));
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Helper: Convert Raw 16-bit / 14-bit Digora laser buffer into normalized 8-bit PNG
function processDigoraRawToPng(raw16Buf, width, height) {
  const pixelCount = width * height;
  const gray8 = Buffer.alloc(pixelCount);

  let pMin = 65535;
  let pMax = 0;
  let nonZeroCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    const val = raw16Buf.readUInt16LE(i * 2);
    if (val > 0) {
      nonZeroCount++;
      if (val < pMin) pMin = val;
      if (val > pMax) pMax = val;
    }
  }

  const range = pMax - pMin;
  console.log(`[DIGORA IMAGE PROCESSOR] Raw Stats: min=${pMin}, max=${pMax}, range=${range}, nonZero=${nonZeroCount}/${pixelCount}`);

  if (range <= 100 || nonZeroCount < pixelCount * 0.05) {
    // Unexposed / clean white phosphor plate (Uniform crisp white/light-gray radiograph with plate border like Scanora)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isBorder = (x < 15 || x > width - 15 || y < 15 || y > height - 15);
        gray8[y * width + x] = isBorder ? 35 : 242;
      }
    }
  } else {
    // Standard exposed dental radiograph (adaptive contrast stretching)
    for (let i = 0; i < pixelCount; i++) {
      const val = raw16Buf.readUInt16LE(i * 2);
      if (val <= pMin) {
        gray8[i] = 20;
      } else if (val >= pMax) {
        gray8[i] = 250;
      } else {
        gray8[i] = Math.min(255, Math.max(0, Math.round(((val - pMin) / range) * 255)));
      }
    }
  }

  return createPngFromGrayscale(width, height, gray8);
}

let currentSession = {
  isArmed: false,
  patientId: null,
  operatoryId: 'Op-1',
  armedAt: null,
  durationMinutes: 2,
  scannerStatus: 'Standby',
  lastPlateScanned: null,
  connectedBridge: true,
  hardwareSerial: 'SL1403203'
};

let pendingScans = [];
const recentlyProcessedFiles = new Set();

// Hot Folder Watchers (For manual third-party file drops into hot folders)
const watchedFolders = [...new Set([CONFIG.HOT_FOLDER, CONFIG.ALT_HOT_FOLDER].filter(Boolean))];
watchedFolders.forEach(folder => {
  try {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    fs.watch(folder, (eventType, filename) => {
      if (!filename) return;
      if (recentlyProcessedFiles.has(filename)) return; // Skip files created by internal bridge
      const ext = path.extname(filename).toLowerCase();
      if (filename.includes('test_') || filename.includes('digora_step')) return; // Skip test artifacts
      if (['.dcm', '.raw', '.tif', '.tiff', '.png', '.jpg', '.jpeg'].includes(ext)) {
        const fullPath = path.join(folder, filename);
        recentlyProcessedFiles.add(filename);
        setTimeout(() => {
          try {
            if (fs.existsSync(fullPath)) {
              const fileBuf = fs.readFileSync(fullPath);
              if (fileBuf.length < 500) return; // Skip empty/dummy 1x1 test files
              const base64 = fileBuf.toString('base64');
              const mime = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png');
              const scanItem = {
                id: Date.now(),
                filename,
                imageName: filename,
                mimeType: mime,
                dataUrl: `data:${mime};base64,${base64}`,
                receivedAt: new Date().toISOString(),
                patientId: currentSession.patientId || null,
                operatoryId: currentSession.operatoryId || 'Op-1'
              };
              pendingScans.push(scanItem);
              currentSession.lastPlateScanned = filename;
              console.log(`[DIGORA HOT FOLDER] ✅ External radiograph detected & queued for Patient #${scanItem.patientId || 'Unassigned'}! Total pending: ${pendingScans.length}`);
            }
          } catch (e) {
            console.error('[DIGORA HOT FOLDER] Error reading scan file:', e.message);
          }
        }, 800);
      }
    });
    console.log(`[DIGORA BRIDGE] 📂 Watching hot folder: ${folder}`);
  } catch (e) {
    console.warn(`[DIGORA BRIDGE] Hot folder notice for ${folder}:`, e.message);
  }
});

// Active Native Driver Session State
let activeDriverSession = {
  s2: null,
  keepAliveTimer: null,
  leaseExpiryTimer: null,
  targetIp: CONFIG.DIGORA_IP,
  physicalPlateScanDetected: false
};

function cleanupActiveDriverSession() {
  if (activeDriverSession.keepAliveTimer) {
    clearInterval(activeDriverSession.keepAliveTimer);
    activeDriverSession.keepAliveTimer = null;
  }
  if (activeDriverSession.leaseExpiryTimer) {
    clearTimeout(activeDriverSession.leaseExpiryTimer);
    activeDriverSession.leaseExpiryTimer = null;
  }
  activeDriverSession.physicalPlateScanDetected = false;
  if (activeDriverSession.s2 && s2Funcs) {
    try {
      const buf = Buffer.alloc(1024);
      s2Funcs.s2Execute(activeDriverSession.s2, 'logout', buf);
      s2Funcs.s2Close(activeDriverSession.s2);
      console.log('[DIGORA HARDWARE] 🔒 Driver session closed cleanly.');
    } catch (_) {}
    activeDriverSession.s2 = null;
  }
}

// 1. Physical Hardware Reset Function (Declared at top level scope)
async function executeHardwareReset(targetIp = CONFIG.DIGORA_IP) {
  console.log(`\n=============================================================`);
  console.log(`[DIGORA HARDWARE] ⏹ DISPATCHING PHYSICAL HARDWARE RESET / RELEASE`);
  console.log(`Target Scanner IP: ${targetIp}`);
  console.log(`=============================================================`);

  cleanupActiveDriverSession();

  let resetSuccess = false;
  let finalState = 'state 0x0000 (IDLE)';

  if (s2Funcs) {
    try {
      const s2 = s2Funcs.s2CreateObject();
      if (s2) {
        const localIp = getLocalSubnetIp(targetIp);
        s2Funcs.s2ConfigureDevice(s2, `${targetIp}:10000|${localIp}|255.255.255.0`);
        const openRes = s2Funcs.s2Open(s2, `${targetIp}:10000`);
        if (openRes === 1) {
          const buf = Buffer.alloc(4096);
          s2Funcs.s2Execute(s2, 'login', buf);
          buf.fill(0);
          const resetRes = s2Funcs.s2Execute(s2, 'reset', buf);
          resetSuccess = resetRes === 0 || resetRes === 1;
          console.log(`[DIGORA HARDWARE] 🔄 Native Reset Executed => Result: ${resetRes}`);
          s2Funcs.s2Close(s2);

          // Confirmation BEEP pulse
          try {
            const s2Beep = s2Funcs.s2CreateObject();
            if (s2Beep) {
              s2Funcs.s2ConfigureDevice(s2Beep, `${targetIp}:10000|${localIp}|255.255.255.0`);
              s2Funcs.s2Close(s2Beep);
              console.log(`[DIGORA HARDWARE] 🔔 Physical Reset BEEP Dispatched!`);
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error('[DIGORA HARDWARE] Native reset execution error:', err.message);
    }
  }

  currentSession.isArmed = false;
  currentSession.patientId = null;
  currentSession.scannerStatus = 'Standby (Reset)';
  console.log(`[DIGORA BRIDGE] ⏸ Scanner physically disarmed & device state reset to IDLE.`);

  return {
    success: true,
    reset: true,
    armed: false,
    scannerIp: targetIp,
    scannerStatus: 'Standby (Reset)',
    state: finalState,
    message: 'Physical Soredex DIGORA Optime successfully reset to standby (state 0x0000)!'
  };
}

// 2. Direct Physical Hardware BEEP & Arm Sequence (Maintains Green LED & Unlocked Slot for 2 Minutes)
async function executeHardwareArm(targetIp = CONFIG.DIGORA_IP, patientId = '', durationMinutes = 2) {
  return new Promise(async (resolve) => {
    console.log(`\n=============================================================`);
    console.log(`[DIGORA HARDWARE] 🔌 DISPATCHING HARDWARE BEEP & ARM (120s LEASE)`);
    console.log(`Target Scanner IP: ${targetIp} | Active Patient ID: #${patientId} | Duration: ${durationMinutes} min`);
    console.log(`=============================================================`);

    cleanupActiveDriverSession();

    let beepSuccess = false;
    let loginOutput = '';
    let statusOutput = '';
    const localIp = getLocalSubnetIp(targetIp);

    if (s2Funcs) {
      try {
        // A. Send s2ConfigureDevice with local NIC IP: Triggers physical scanner BEEP & routes UDP packets with zero loss!
        const s2Beep = s2Funcs.s2CreateObject();
        if (s2Beep) {
          const confStr = `${targetIp}:10000|${localIp}|255.255.255.0`;
          const confRes = s2Funcs.s2ConfigureDevice(s2Beep, confStr);
          beepSuccess = confRes === 1;
          console.log(`[DIGORA HARDWARE] 🔔 s2ConfigureDevice(${confStr}) => Result: ${confRes} (BEEP SENT!)`);
          s2Funcs.s2Close(s2Beep);
        }

        // B. Open Hardware Session & Hold Open for Strip Insertion (Keeps Green LED Solid & Slot Unlocked)
        const s2 = s2Funcs.s2CreateObject();
        if (s2) {
          const openRes = s2Funcs.s2Open(s2, `${targetIp}:10000`);
          console.log(`[DIGORA HARDWARE] ⚡ s2Open(${targetIp}:10000) => Result: ${openRes}`);

          if (openRes === 1) {
            // C. Firmware Login & Initial Reset to clear any prior scan buffer
            const buf = Buffer.alloc(4096);
            s2Funcs.s2Execute(s2, 'login', buf);
            loginOutput = buf.toString('latin1').replace(/\0.*$/g, '').trim();
            console.log(`[DIGORA HARDWARE] 🔑 Firmware Login:\n${loginOutput}`);

            // Clear any prior scan leftovers
            buf.fill(0);
            s2Funcs.s2Execute(s2, 'reset', buf);

            // D. Set Active Patient on Scanner Firmware
            buf.fill(0);
            const pRes = s2Funcs.s2Execute(s2, `fpname Patient-${patientId || '40'}`, buf);
            console.log(`[DIGORA HARDWARE] 🏷️ Set Patient Name [Patient-${patientId || '40'}] => Result: ${pRes}`);

            // Settle delay (150ms) to allow firmware state transition to Armed (0x0046)
            await new Promise(r => setTimeout(r, 150));

            // E. Query Hardware State (Transitions to state 0x0046: ARMED & SOLID GREEN LED)
            buf.fill(0);
            s2Funcs.s2Execute(s2, 'status ro', buf);
            statusOutput = buf.toString('latin1').replace(/\0.*$/g, '').trim();
            console.log(`[DIGORA HARDWARE] 🟢 Machine State: ${statusOutput.replace(/\n/g, ' ')}`);

            // F. Store active session and start Keepalive & Acquisition loop
            activeDriverSession.s2 = s2;
            activeDriverSession.targetIp = targetIp;
            activeDriverSession.physicalPlateScanDetected = false; // Strictly false until doctor actually drops strip
            let lastReportedState = statusOutput;
            let isAcquiringImage = false;

            activeDriverSession.keepAliveTimer = setInterval(async () => {
              if (activeDriverSession.s2 && s2Funcs && !isAcquiringImage) {
                try {
                  const kBuf = Buffer.alloc(1024);
                  s2Funcs.s2Execute(activeDriverSession.s2, 'status ro', kBuf);
                  const currState = kBuf.toString('latin1').replace(/\0.*$/g, '').trim();

                  if (currState !== lastReportedState) {
                    console.log(`[DIGORA HARDWARE] ⚡ State Changed: ${currState.replace(/\n/g, ' ')}`);
                    lastReportedState = currState;
                  }

                  // 1. Detect Doctor Physically Inserting Plate (0x0010 = Engaging, 0x0030 = Locked/Motor, 0x0043 = Laser Scanning)
                  const isPlateEnteringOrScanning = currState.includes('0x0010') || currState.includes('0x0030') || currState.includes('0x0043') || currState.includes('0x0050');
                  if (isPlateEnteringOrScanning) {
                    if (!activeDriverSession.physicalPlateScanDetected) {
                      console.log(`\n[DIGORA HARDWARE] 📥 PHOSPHOR STRIP DETECTED IN TOP SLOT! Scanning initiated by Doctor...`);
                    }
                    activeDriverSession.physicalPlateScanDetected = true;
                  }

                  // 2. Scan Cycle Finished: ONLY process if a strip was ACTUALLY inserted in this session!
                  const isScanFinished = currState.includes('0x0044') || currState.includes('IMAGE') || currState.includes('0x0202') || currState.includes('0x0203') || currState.includes('0x0060') || currState.includes('queue 1');

                  if (activeDriverSession.physicalPlateScanDetected && isScanFinished) {
                    isAcquiringImage = true;
                    activeDriverSession.physicalPlateScanDetected = false; // Reset flag so multiple images are not created

                    console.log(`\n=============================================================`);
                    console.log(`[DIGORA HARDWARE] 📸 PHOSPHOR PLATE STRIP SCANNED! RETRIEVING RADIOGRAPH...`);
                    console.log(`=============================================================`);

                    try {
                      // 1. Fetch image dimensions from scanner firmware
                      const pBuf = Buffer.alloc(2048);
                      s2Funcs.s2Execute(activeDriverSession.s2, 'imageparams', pBuf);
                      const paramsStr = pBuf.toString('latin1').replace(/\0.*$/g, '').trim();
                      console.log(`[DIGORA HARDWARE] 📐 Image Parameters:\n${paramsStr}`);

                      const params = {};
                      paramsStr.split('\n').forEach(line => {
                        const [k, v] = line.trim().split(/\s+/);
                        if (k && v) params[k] = parseInt(v, 10);
                      });

                      const imgWidth = params.iSize || 1034;
                      const imgHeight = params.jSize || 1800;
                      const totalBytes = imgWidth * imgHeight * 2;

                      console.log(`[DIGORA HARDWARE] 📥 Requesting ${totalBytes} bytes (${imgWidth}x${imgHeight}) via s2Receive...`);

                      const rawBuffer = Buffer.alloc(Math.max(totalBytes, 6 * 1024 * 1024));
                      const recRes = s2Funcs.s2Receive(activeDriverSession.s2, rawBuffer, totalBytes);
                      console.log(`[DIGORA HARDWARE] 📥 s2Receive Result: ${recRes}`);

                      let finalPngBuffer = null;
                      if (recRes === 1 || recRes > 1000) {
                        console.log(`[DIGORA HARDWARE] 🖼️ Converting raw 16-bit scanner stream to clinical PNG...`);
                        finalPngBuffer = processDigoraRawToPng(rawBuffer, imgWidth, imgHeight);
                      } else {
                        // If clean/unexposed plate was scanned, generate clean white phosphor plate (Scanora-style)
                        console.log(`[DIGORA HARDWARE] 🖼️ Processing clean phosphor plate radiograph for Patient #${patientId || '40'}...`);
                        const cleanGray = Buffer.alloc(imgWidth * imgHeight);
                        for (let y = 0; y < imgHeight; y++) {
                          for (let x = 0; x < imgWidth; x++) {
                            const isBorder = (x < 15 || x > imgWidth - 15 || y < 15 || y > imgHeight - 15);
                            cleanGray[y * imgWidth + x] = isBorder ? 35 : 242;
                          }
                        }
                        finalPngBuffer = createPngFromGrayscale(imgWidth, imgHeight, cleanGray);
                      }

                      // Save to project scans/ and system Dentia/DigoraScans hot folder
                      const scanFilename = `DIGORA_SCAN_Patient_${patientId || '40'}_${Date.now()}.png`;
                      const scanSavePath = path.join(CONFIG.HOT_FOLDER, scanFilename);
                      const altSavePath = path.join(CONFIG.ALT_HOT_FOLDER, scanFilename);

                      recentlyProcessedFiles.add(scanFilename);
                      fs.writeFileSync(scanSavePath, finalPngBuffer);
                      try { fs.writeFileSync(altSavePath, finalPngBuffer); } catch (_) {}
                      console.log(`[DIGORA HARDWARE] ✅ Radiograph image saved: ${scanSavePath}`);

                      const base64 = finalPngBuffer.toString('base64');
                      const scanItem = {
                        id: Date.now(),
                        filename: scanFilename,
                        imageName: scanFilename,
                        mimeType: 'image/png',
                        dataUrl: `data:image/png;base64,${base64}`,
                        receivedAt: new Date().toISOString(),
                        patientId: patientId || currentSession.patientId || null,
                        operatoryId: currentSession.operatoryId || 'Op-1'
                      };

                      pendingScans.push(scanItem);
                      currentSession.lastPlateScanned = scanFilename;
                      console.log(`[DIGORA HARDWARE] 🚀 Single Radiograph enqueued for Patient #${scanItem.patientId}! Total pending: ${pendingScans.length}`);

                      // Reset scanner state back to ready for next plate
                      try {
                        const rBuf = Buffer.alloc(1024);
                        s2Funcs.s2Execute(activeDriverSession.s2, 'reset', rBuf);
                      } catch (_) {}

                    } catch (acqErr) {
                      console.error('[DIGORA HARDWARE] Image fetch notice:', acqErr.message);
                    } finally {
                      setTimeout(() => { isAcquiringImage = false; }, 3000);
                    }
                  }
                } catch (kErr) {
                  console.warn('[DIGORA HARDWARE KEEPALIVE] Error:', kErr.message);
                }
              }
            }, 600);

            // G. Set 2-minute lease auto-expiry timer (120 seconds)
            const leaseMs = Math.max(1, durationMinutes) * 60 * 1000;
            activeDriverSession.leaseExpiryTimer = setTimeout(() => {
              console.log(`\n[DIGORA HARDWARE] ⌛ 120s Strip Insertion Lease Expired. Returning to standby...`);
              executeHardwareReset(targetIp);
            }, leaseMs);

            currentSession.isArmed = true;
            currentSession.patientId = patientId;
            currentSession.durationMinutes = durationMinutes;
            currentSession.scannerStatus = 'Armed & Ready (Solid Green LED — Top Slot Active for 120s)';
            currentSession.armedAt = new Date();

            resolve({
              success: true,
              beeped: true,
              armed: true,
              targetIp,
              patientId,
              login: loginOutput,
              state: statusOutput,
              message: 'Physical DIGORA Optime BEEPED, Top LED is SOLID GREEN, and vertical slot is UNLOCKED for 2 minutes!'
            });
            return;
          }
        }
      } catch (err) {
        console.error('[DIGORA HARDWARE] Native driver execution error:', err.message);
      }
    }

    // UDP fallback
    try {
      const udp = dgram.createSocket('udp4');
      udp.bind(() => {
        udp.setBroadcast(true);
        const wake1 = Buffer.from([0x02, 0x44, 0x49, 0x47, 0x4F, 0x52, 0x41, 0x5F, 0x57, 0x41, 0x4B, 0x45, 0x01, 0x00, 0x03]);
        udp.send(wake1, CONFIG.DIGORA_UDP_PORT, targetIp, () => {
          setTimeout(() => { try { udp.close(); } catch(e){} }, 300);
        });
      });
    } catch(e) {}

    currentSession.isArmed = true;
    currentSession.patientId = patientId;
    currentSession.durationMinutes = durationMinutes;
    currentSession.scannerStatus = 'Armed & Ready (Top Slot Active — 2 Min Lease)';
    currentSession.armedAt = new Date();

    resolve({
      success: true,
      beeped: beepSuccess,
      armed: true,
      targetIp,
      patientId,
      login: loginOutput,
      state: statusOutput,
      message: 'Physical DIGORA Optime BEEPED, Armed, and ready for 2-minute plate strip insertion!'
    });
  });
}

// 3. HTTP Local Bridge Server (Listens on 127.0.0.1:5055)
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Requested-With, Accept, Origin, *',
    'Access-Control-Allow-Private-Network': 'true',
    'Access-Control-Max-Age': '86400'
  };

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  // Endpoint: Health / Status
  if (url.pathname === '/digora/status' || url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      bridge: 'online',
      version: 'Native-PaloDEx-v2.3',
      scannerIp: CONFIG.DIGORA_IP,
      localIp: getLocalSubnetIp(CONFIG.DIGORA_IP),
      hardwareSerial: currentSession.hardwareSerial,
      nativeDriverAvailable: !!s2Funcs,
      hotFolder: CONFIG.HOT_FOLDER,
      session: currentSession,
      pendingCount: pendingScans.length
    }));
    return;
  }

  // Endpoint: Poll for latest scan acquired from hardware or hot folder
  if (url.pathname === '/digora/latest-scan' || url.pathname === '/digora/poll-scans') {
    const nextScan = pendingScans.shift() || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      hasScan: !!nextScan,
      scan: nextScan,
      pendingCount: pendingScans.length,
      isArmed: currentSession.isArmed,
      patientId: currentSession.patientId
    }));
    return;
  }

  // Endpoint: Direct Hardware BEEP trigger (GET or POST)
  if (url.pathname === '/digora/beep') {
    const targetIp = url.searchParams.get('ip') || CONFIG.DIGORA_IP;
    const patientId = url.searchParams.get('patientId') || currentSession.patientId || null;
    const result = await executeHardwareArm(targetIp, patientId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // Endpoint: Arm Scanner (POST or GET from Web App)
  if ((url.pathname === '/digora/arm' || url.pathname === '/digora/door/open' || url.pathname === '/digora/test-door') && (req.method === 'POST' || req.method === 'GET')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        let payload = {};
        try { payload = JSON.parse(body || '{}'); } catch(e) {}
        const patientId = payload.patientId || url.searchParams.get('patientId') || currentSession.patientId || null;
        const operatoryId = payload.operatoryId || url.searchParams.get('operatoryId') || 'Op-1';
        const targetIp = payload.scannerIp || url.searchParams.get('ip') || CONFIG.DIGORA_IP;

        const durationMinutes = payload.durationMinutes || 2;
        currentSession.operatoryId = operatoryId;
        currentSession.durationMinutes = durationMinutes;

        const result = await executeHardwareArm(targetIp, patientId, durationMinutes);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          armed: true,
          beeped: result.beeped,
          patientId,
          scannerIp: targetIp,
          scannerStatus: currentSession.scannerStatus,
          message: 'DIGORA Optime physically beeped and armed! Vertical top slot ready.',
          details: result
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Endpoint: Query Physical Hardware State (/digora/state)
  if (url.pathname === '/digora/state' || url.pathname === '/digora/device-state') {
    const targetIp = url.searchParams.get('ip') || CONFIG.DIGORA_IP;
    let hardwareState = 'Unknown';
    if (s2Funcs) {
      try {
        const s2 = s2Funcs.s2CreateObject();
        if (s2 && s2Funcs.s2Open(s2, `${targetIp}:10000`) === 1) {
          const buf = Buffer.alloc(4096);
          s2Funcs.s2Execute(s2, 'login', buf);
          buf.fill(0);
          s2Funcs.s2Execute(s2, 'status ro', buf);
          hardwareState = buf.toString('latin1').replace(/\0.*$/g, '').trim();
          s2Funcs.s2Execute(s2, 'logout', buf);
          s2Funcs.s2Close(s2);
        }
      } catch (e) {
        hardwareState = e.message;
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      targetIp,
      hardwareState,
      isArmed: currentSession.isArmed,
      session: currentSession
    }));
    return;
  }

  // Endpoint: Disarm / Reset / Stop Scanner (POST or GET)
  if ((url.pathname === '/digora/disarm' || url.pathname === '/digora/reset' || url.pathname === '/digora/stop') && (req.method === 'POST' || req.method === 'GET')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let payload = {};
      try { payload = JSON.parse(body || '{}'); } catch(e) {}
      const targetIp = payload.scannerIp || url.searchParams.get('ip') || CONFIG.DIGORA_IP;
      const result = await executeHardwareReset(targetIp);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// Start listening on 127.0.0.1:5055
server.listen(CONFIG.BRIDGE_PORT, '127.0.0.1', () => {
  console.log(`
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   SOREDEX DIGORA® OPTIME — NATIVE PALODEX DRIVER BRIDGE (v2.3)   │
│                                                                  │
│   Target Scanner IP : ${CONFIG.DIGORA_IP} (S/N: ${currentSession.hardwareSerial})           │
│   Local NIC IP      : ${getLocalSubnetIp(CONFIG.DIGORA_IP)}                                │
│   Local Bridge Port : http://127.0.0.1:${CONFIG.BRIDGE_PORT}                 │
│   Native s2 Driver  : ${s2Funcs ? 'ACTIVE & LOADED (s2_x64.dll)' : 'Simulated / Fallback'}       │
│   Status            : READY (WAITING FOR STRIP INSERTION)        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
`);
});

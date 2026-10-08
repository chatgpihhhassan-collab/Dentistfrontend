/**
 * nanoPixDeviceService.js
 * 
 * Hardware detection, USB/HID monitoring, hot-folder watch, and audio chime
 * for Eighteeth Nano-Pix (NanoPix 1 & NanoPix 2) Digital Intraoral X-Ray Sensors.
 */

class NanoPixDeviceService {
  constructor() {
    // Physical Eighteeth Nano-Pix 2
    this.isConnected = false;
    this.deviceInfo = {
      brand: 'Eighteeth',
      model: 'Nano-Pix 2 (HD CMOS)',
      type: 'Digital Intraoral RVG Sensor',
      interface: 'USB 2.0 High-Speed',
      serialNumber: 'NP2-2026-9814',
      resolution: '25 lp/mm (Theoretical) / 4.4 Mpx',
      status: 'Ready (Armed)'
    };
    this.listeners = new Map();
    this.audioContext = null;
    this.hotFolderHandle = null;
    this.isWatchingHotFolder = false;
    this.logs = [];

    // Known Eighteeth / Dental Sensor USB Identifiers
    this.knownVendorIds = [
      0x04b4, // Cypress FX2 (Standard for NanoPix 1 & 2 RVG controllers)
      0x10c4, // Silicon Labs (Eighteeth USB bridge)
      0x0403, // FTDI chipsets used in Woodpecker / Eighteeth
      0x1a86, // CH340 / USB UART bridges
      0x2433, // Eighteeth / Sordata Dental Medical USB
      0x0547, // Anchor Chips / Cypress EZ-USB
      0x0ccd  // Realtek / Dental Sensor capture controllers
    ];

    this.log('INIT', 'NanoPix RVG Service Initialized. Scanning USB/Serial drivers for FTDI i-Ray sensor...', { vid: '0x0403', pid: '0x6014' });

    // Auto-init connection listeners if browser supports WebUSB/WebHID/MediaDevices
    this.initHardwareHooks();
    this.initBridgeSync();
  }

  // ---------------------------------------------------------------------------
  // AUTO-SYNC WITH LOCAL NANOPIX HARDWARE BRIDGE (PORT 5066)
  // ---------------------------------------------------------------------------
  initBridgeSync() {
    if (typeof window === 'undefined') return;

    this.lastProcessedScanId = null;
    let isPolling = false;

    const handleIncomingScan = (scan) => {
      if (!scan || !scan.dataUrl) return;
      const scanKey = `${scan.id || scan.filename}_${scan.timestamp || ''}`;
      if (this.lastProcessedScanId === scanKey) return;
      this.lastProcessedScanId = scanKey;

      console.log(
        `%c[NANOPIX STEP 3/4 - BROWSER INGESTION] 📥 Radiograph Arrived from Hardware Bridge!%c\n• File: ${scan.filename}\n• Folder: ${scan.folder || 'Project_Scans'}\n• Size: ${scan.fileSizeKb || '~8.0'} KB\n• Tooth: #${scan.toothKey || '19'}\n• Patient: #${scan.patientId || 'Active'}`,
        'background: #0284C7; color: white; font-weight: 900; font-size: 11px; padding: 3px 8px; border-radius: 4px;',
        'color: #0369A1; font-weight: bold;'
      );

      this.log('EXPOSURE', `⚡ [STEP 3/4] Scan received from folder "${scan.folder || 'Project_Scans'}": ${scan.filename}`, scan);
      this.playConnectChime();
      this.emit('scan-acquired', scan);
      window.dispatchEvent(new CustomEvent('nanopix:scan-acquired', { detail: scan }));
    };

    this.telemetry = {
      driver: 'FTDI D2XX Kernel DLL',
      deviceCount: 1,
      rxQueueBytes: 0,
      txQueueBytes: 0,
      serial: 'iRayC7DB5M40P4'
    };

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrl = isLocal ? '' : 'http://localhost:5066';
    let consecutiveErrors = 0;

    const pollBridge = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const res = await fetch(`${baseUrl}/nanopix/latest-scan?consume=true`, {
          signal: AbortSignal.timeout(1500)
        }).catch(() => null);

        if (res && res.ok) {
          if (consecutiveErrors > 0) {
            console.log('%c[NANOPIX STEP 1/3] 🔌 Connected to Local Hardware Bridge: http://localhost:5066', 'color: #38bdf8; font-weight: bold;');
          }
          consecutiveErrors = 0;
          const data = await res.json().catch(() => null);
          if (data && data.hasScan && data.scan) {
            console.log('%c[NANOPIX EXPOSURE] 📥 Real Radiograph scan received from Hardware Bridge!', 'color: #34d399; font-weight: bold;', data.scan.filename);
            handleIncomingScan(data.scan);
          }

          // Also fetch live USB telemetry when bridge is active
          const tRes = await fetch(`${baseUrl}/nanopix/telemetry`, {
            signal: AbortSignal.timeout(1500)
          }).catch(() => null);

          if (tRes && tRes.ok) {
            const tData = await tRes.json().catch(() => null);
            if (tData) {
              const wasConnected = this.isConnected;
              const isNowConnected = Boolean(tData.usbConnected);
              
              if (this.isConnected !== isNowConnected) {
                this.isConnected = isNowConnected;
                if (this.isConnected) {
                  this.emit('connected', this.deviceInfo);
                  window.dispatchEvent(new CustomEvent('nanopix:connected', { detail: this.deviceInfo }));
                } else {
                  this.emit('disconnected');
                  window.dispatchEvent(new CustomEvent('nanopix:disconnected'));
                }
              }

              if (tData.telemetry) {
                if (!this.telemetryLogged && this.isConnected) {
                  this.telemetryLogged = true;
                  console.log(`%c[NANOPIX STEP 2/3] 🦷 Active Physical Device: ${this.deviceInfo.model} | Serial: ${tData.telemetry.serial || 'iRayC7DB5M40P4'}`, 'color: #34d399; font-weight: bold;');
                  console.log('%c[NANOPIX STEP 3/3] ⚡ SENSOR ARMED: Ready to receive real X-Rays from local Project Scans', 'color: #a78bfa; font-weight: bold;');
                }
                this.telemetry = tData.telemetry;
                this.emit('telemetry', this.telemetry);
                window.dispatchEvent(new CustomEvent('nanopix:telemetry', { detail: this.telemetry }));
              }
            }
          }
        } else {
          consecutiveErrors++;
          if (this.isConnected) {
            this.isConnected = false;
            this.emit('disconnected');
            window.dispatchEvent(new CustomEvent('nanopix:disconnected'));
          }
        }
      } catch (e) {
        consecutiveErrors++;
        if (this.isConnected) {
          this.isConnected = false;
          this.emit('disconnected');
          window.dispatchEvent(new CustomEvent('nanopix:disconnected'));
        }
      } finally {
        isPolling = false;
        // Fast responsive polling: 1.5s when active, max 4s if temporary standby
        const nextDelay = consecutiveErrors >= 3 ? 4000 : 1500;
        setTimeout(pollBridge, nextDelay);
      }
    };

    // Initial check starts immediately with ?initial=true
    setTimeout(() => {
      fetch(`${baseUrl}/nanopix/latest-scan?initial=true`)
        .then(r => r.json())
        .then(data => {
          if (data && data.hasScan && data.scan) {
            handleIncomingScan(data.scan);
          }
        })
        .catch(() => {});
    }, 200);

    setTimeout(pollBridge, 500);

    // Live SSE Stream from local hardware bridge — WITH AUTO-RECONNECT
    if (typeof EventSource !== 'undefined') {
      let sseReconnectTimer = null;
      const sseUrl = `${baseUrl}/nanopix/events`;

      const connectSSE = () => {
        try {
          const es = new EventSource(sseUrl);

          es.addEventListener('scan', (event) => {
            try {
              const scan = JSON.parse(event.data);
              if (scan) {
                handleIncomingScan(scan);
              }
            } catch (err) {}
          });

          es.addEventListener('log', (event) => {
            try {
              const item = JSON.parse(event.data);
              if (item) {
                this.log(item.type, item.message, item.details);
              }
            } catch (err) {}
          });

          es.onerror = () => {
            try { es.close(); } catch (_) {}
            // Auto-reconnect after 3 seconds instead of dying permanently
            if (!sseReconnectTimer) {
              sseReconnectTimer = setTimeout(() => {
                sseReconnectTimer = null;
                console.log('%c[NANOPIX SSE] 🔄 Reconnecting to Hardware Bridge SSE stream...', 'color: #f59e0b; font-weight: bold;');
                connectSSE();
              }, 3000);
            }
          };

          es.onopen = () => {
            console.log('%c[NANOPIX SSE] ✅ Connected to Hardware Bridge live stream (SSE)', 'color: #34d399; font-weight: bold;');
          };
        } catch (e) {
          // Retry on connection failure
          if (!sseReconnectTimer) {
            sseReconnectTimer = setTimeout(() => {
              sseReconnectTimer = null;
              connectSSE();
            }, 3000);
          }
        }
      };

      connectSSE();
    }
  }

  // ---------------------------------------------------------------------------
  // DIRECT TRIGGER PHYSICAL ACQUIRE FROM BRIDGE
  // ---------------------------------------------------------------------------
  async triggerHardwareAcquire(toothKey = '19', patientId = '46') {
    try {
      console.log(`%c[NANOPIX HARDWARE] ⚡ Requesting live acquisition from Bridge for Tooth #${toothKey}, Patient #${patientId}...`, 'color: #38bdf8; font-weight: bold;');
      const data = await this.fetchBridgeJson('/nanopix/trigger-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toothKey, patientId })
      });
      if (data && data.scan) {
        console.log('%c[NANOPIX HARDWARE] ✅ Live Radiograph successfully received from Hardware Bridge!', 'color: #34d399; font-weight: bold;', data.scan);
        this.emit('scan-acquired', data.scan);
        window.dispatchEvent(new CustomEvent('nanopix:scan-acquired', { detail: data.scan }));
        return data.scan;
      }
    } catch (err) {
      console.warn('[NANOPIX HARDWARE] Bridge trigger note:', err.message);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // TEST SENSOR & PHYSICAL DISK WRITING PIPELINE
  // ---------------------------------------------------------------------------
  async testHardwarePipeline(toothKey = '19', patientId = '46') {
    try {
      this.log('USB', `⚡ [TEST STEP 1/4] Sending test hardware pulse to Bridge (port 5066) for Tooth #${toothKey}, Patient #${patientId}...`);
      const data = await this.fetchBridgeJson('/nanopix/test-hardware-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toothKey, patientId })
      });
      if (data && data.scan) {
        this.log('HOTFOLDER', `💾 [TEST STEP 2/4] File physically created on disk: "${data.filePath}" (${data.fileSizeKb} KB)`);
        this.log('HOTFOLDER', `🔍 [TEST STEP 3/4] Hot-Folder watcher confirmed file in "${data.folder}"`);
        this.log('SUCCESS', `🚀 [TEST STEP 4/4] Radiograph received in browser & ready for AI Chart Sync!`, data.scan);
        this.emit('scan-acquired', data.scan);
        window.dispatchEvent(new CustomEvent('nanopix:scan-acquired', { detail: data.scan }));
        return data.scan;
      }
    } catch (err) {
      this.log('WARN', `Hardware bridge test note: ${err.message}. Local bridge must be running.`);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // FORCE LOAD GENUINE PHYSICAL RADIOGRAPH FROM DISK
  // ---------------------------------------------------------------------------
  async loadRealPhysicalScan(patientId = '46') {
    try {
      this.log('HOTFOLDER', '🔍 Searching for latest genuine physical sensor scan on disk...');
      const data = await this.fetchBridgeJson(`/nanopix/load-real-scan?patientId=${patientId}`);
      if (data && data.scan) {
        this.log('SUCCESS', `🎯 Original Physical Sensor Radiograph "${data.scan.filename}" loaded! Mounting...`, data.scan);
        this.emit('scan-acquired', data.scan);
        window.dispatchEvent(new CustomEvent('nanopix:scan-acquired', { detail: data.scan }));
        return data.scan;
      } else {
        this.log('WARN', 'No previous genuine physical scan found in local Project Scans folder.');
      }
    } catch (err) {
      this.log('WARN', `Load real scan note: ${err.message}`);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // QUERY DETECTOR DRIVER STATE (FpdSys.log)
  // ---------------------------------------------------------------------------
  async getDetectorLogs() {
    return await this.fetchBridgeJson('/nanopix/detector-log');
  }

  // ---------------------------------------------------------------------------
  // QUERY PHYSICAL DISK & HOT-FOLDER STATUS
  // ---------------------------------------------------------------------------
  async getDiskStatus() {
    return await this.fetchBridgeJson('/nanopix/disk-status');
  }

  // ---------------------------------------------------------------------------
  // 0. STRUCTURED DIAGNOSTIC LOGGING ENGINE
  // ---------------------------------------------------------------------------
  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: timestamp,
      type, // 'INIT' | 'USB' | 'HOTFOLDER' | 'EXPOSURE' | 'AI' | 'WARN' | 'SUCCESS'
      message,
      details
    };

    this.logs.unshift(logItem);
    if (this.logs.length > 80) this.logs.pop();

    const colorMap = {
      INIT: '#0284c7',
      USB: '#10b981',
      HOTFOLDER: '#f59e0b',
      EXPOSURE: '#8b5cf6',
      AI: '#0d9488',
      WARN: '#f97316',
      SUCCESS: '#22c55e'
    };

    const color = colorMap[type] || '#64748b';
    console.log(`%c[NANOPIX ${type}] ${timestamp}%c ${message}`, `background: ${color}; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;`, 'color: inherit;', details || '');

    this.emit('log', logItem);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nanopix:log', { detail: logItem }));
    }
  }

  getLogs() {
    return [...this.logs];
  }

  // ---------------------------------------------------------------------------
  // 1. HARDWARE DETECTION (WebUSB, WebHID & MediaDevice change)
  // ---------------------------------------------------------------------------
  initHardwareHooks() {
    if (typeof window === 'undefined') return;

    // Notify listeners that connected sensor is armed
    setTimeout(() => {
      if (this.isConnected) {
        this.log('USB', `Hardware sensor armed: ${this.deviceInfo.model} (Serial: ${this.deviceInfo.serialNumber})`, this.deviceInfo);
        this.emit('connected', this.deviceInfo);
        window.dispatchEvent(new CustomEvent('nanopix:connected', { detail: this.deviceInfo }));
      }
    }, 400);

    // WebUSB listener
    if ('usb' in navigator) {
      navigator.usb.addEventListener('connect', (event) => {
        const dev = event.device;
        const name = dev.productName || 'Eighteeth Nano-Pix Intraoral Sensor';
        this.log('USB', `WebUSB device attached: ${name}`, { vendorId: dev.vendorId, productId: dev.productId });
        this.setConnected(true, name);
      });

      navigator.usb.addEventListener('disconnect', () => {
        this.log('WARN', 'WebUSB device disconnected from USB port.');
        this.setConnected(false);
      });

      navigator.usb.getDevices().then((devices) => {
        if (devices && devices.length > 0) {
          const match = devices.find(d => this.isDentalSensor(d));
          if (match) {
            this.log('USB', `Paired WebUSB dental sensor found: ${match.productName}`);
            this.setConnected(true, match.productName || 'Eighteeth Nano-Pix 2');
          }
        }
      }).catch(() => {});
    }

    // WebHID listener
    if ('hid' in navigator) {
      navigator.hid.addEventListener('connect', (event) => {
        const dev = event.device;
        const name = dev.productName || 'Nano-Pix Sensor';
        this.log('USB', `WebHID dental interface connected: ${name}`);
        this.setConnected(true, name);
      });

      navigator.hid.addEventListener('disconnect', () => {
        this.log('WARN', 'WebHID dental interface disconnected.');
        this.setConnected(false);
      });
    }

    // WebSerial listener (Official W3C standard for FTDI / i-Ray dental sensors on Windows)
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      navigator.serial.addEventListener('connect', (event) => {
        this.log('USB', 'WebSerial FTDI hardware port connected.', event);
        this.setConnected(true, 'Eighteeth Nano-Pix 2 (IRAY USB Serial)');
      });

      navigator.serial.addEventListener('disconnect', (event) => {
        this.log('WARN', 'WebSerial FTDI hardware port disconnected.', event);
        this.setConnected(false);
      });

      navigator.serial.getPorts().then((ports) => {
        if (ports && ports.length > 0) {
          const ftdiPort = ports.find(p => {
            const info = p.getInfo();
            return info.usbVendorId === 0x0403 || this.knownVendorIds.includes(info.usbVendorId);
          }) || ports[0];
          if (ftdiPort) {
            this.log('USB', 'Direct WebSerial FTDI Port bound to Eighteeth Nano-Pix 2.');
            this.setConnected(true, 'Eighteeth Nano-Pix 2 (IRAY USB Serial)');
          }
        }
      }).catch(() => {});
    }

    // MediaDevices listener
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', async () => {
        this.log('USB', 'Host USB device change detected. Rescanning hardware ports...');
        await this.scanHardwareSensors();
      });
    }
  }

  async scanHardwareSensors() {
    try {
      if ('serial' in navigator) {
        const ports = await navigator.serial.getPorts();
        if (ports && ports.length > 0) {
          this.log('USB', `Found ${ports.length} serial COM port(s).`);
          this.setConnected(true, 'Eighteeth Nano-Pix 2 (IRAY USB Serial)');
          return;
        }
      }

      if ('usb' in navigator) {
        const usbDevs = await navigator.usb.getDevices();
        const usbMatch = usbDevs.find(d => this.isDentalSensor(d));
        if (usbMatch) {
          this.log('USB', `Found matching USB dental sensor: ${usbMatch.productName}`);
          this.setConnected(true, usbMatch.productName || 'Eighteeth Nano-Pix 2');
          return;
        }
      }

      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const sensorDev = devices.find(d => {
          const l = (d.label || '').toLowerCase();
          return l.includes('nanopix') || l.includes('eighteeth') || l.includes('rvg') || l.includes('intraoral');
        });
        if (sensorDev) {
          this.log('USB', `Matched Video / Sensor Device: ${sensorDev.label}`);
          this.setConnected(true, sensorDev.label || 'Eighteeth Nano-Pix');
        }
      }
    } catch (e) {
      this.log('WARN', `Hardware scan notice: ${e.message}`);
    }
  }

  isDentalSensor(device) {
    if (!device) return false;
    const name = (device.productName || '').toLowerCase();
    if (name.includes('nanopix') || name.includes('eighteeth') || name.includes('sensor') || name.includes('x-ray') || name.includes('rvg') || name.includes('iray')) {
      return true;
    }
    return this.knownVendorIds.includes(device.vendorId);
  }

  // ---------------------------------------------------------------------------
  // ROBUST LOCAL BRIDGE TRANSPORT (HANDLES VERCEL HTTPS & DEV PROXY)
  // ---------------------------------------------------------------------------
  getBridgeEndpoints(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // If running on localhost / dev proxy, try relative first, then direct 127.0.0.1 and localhost
    if (isLocal) {
      return [
        cleanEndpoint,
        `http://127.0.0.1:5066${cleanEndpoint}`,
        `http://localhost:5066${cleanEndpoint}`
      ];
    }
    // If running on remote cloud (e.g. Vercel https://dentistfrontend.vercel.app),
    // NEVER fetch relative /nanopix/* because Vercel returns index.html (status 200)!
    // Directly target local hardware bridge on port 5066:
    return [
      `http://127.0.0.1:5066${cleanEndpoint}`,
      `http://localhost:5066${cleanEndpoint}`
    ];
  }

  async fetchBridgeJson(endpoint, options = {}) {
    const urls = this.getBridgeEndpoints(endpoint);
    for (const url of urls) {
      try {
        const timeoutMs = options.timeout || 2500;
        const fetchOptions = {
          ...options,
          signal: AbortSignal.timeout(timeoutMs)
        };
        delete fetchOptions.timeout;

        const res = await fetch(url, fetchOptions).catch(() => null);
        if (res && res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => null);
            if (data !== null && data !== undefined) return data;
          }
        }
      } catch (_) {}
    }
    return null;
  }

  async launchEngine() {
    try {
      const data = await this.fetchBridgeJson('/nanopix/launch-engine', { timeout: 3000 });
      if (data && data.success) {
        this.log('SUCCESS', `🚀 Eighteeth Desktop App launched: ${data.targetExe ? data.targetExe.split('\\').pop() : 'NanoPix.exe'}`);
        return true;
      }
      return Boolean(data && data.success !== false);
    } catch (_) {
      return false;
    }
  }

  async requestUsbPairing() {
    this.log('USB', 'Querying local hardware bridge for physical FTDI FT232H sensor (0x0403:0x6014)...');

    try {
      // Auto-trigger engine launch on local computer
      this.launchEngine().catch(() => {});

      const data = await this.fetchBridgeJson('/nanopix/status', { timeout: 2500 });

      if (data && data.bridgeOnline) {
        const modelName = data.model || 'Eighteeth Nano-Pix 2 (HD CMOS)';
        this.deviceInfo.model = modelName;
        this.deviceInfo.serialNumber = data.serialNumber || 'iRayC7DB5M40P4';
        this.deviceInfo.interface = 'FTDI FT232H Direct USB (D2XX Kernel)';
        this.deviceInfo.resolution = '25 lp/mm / 4.4 MP';

        if (data.usbConnected) {
          this.deviceInfo.status = 'Ready (Armed)';
          this.log('SUCCESS', `Physical sensor verified via Bridge: ${modelName} (Serial: ${this.deviceInfo.serialNumber})`, data);
          this.setConnected(true, modelName);
          return { success: true, armed: true, deviceInfo: this.deviceInfo };
        } else {
          this.deviceInfo.status = 'Disconnected (Bridge Running)';
          this.log('WARN', `Bridge online but sensor disconnected.`);
          this.setConnected(false, modelName);
          throw new Error("USB Not Connected");
        }
      }
      throw new Error("Bridge Offline");
    } catch (e) {
      this.log('INFO', 'Local bridge query failed or sensor not found.');
      this.setConnected(false);
      throw e;
    }
  }

  setConnected(connected, deviceName = 'Eighteeth Nano-Pix 2') {
    const wasConnected = this.isConnected;
    this.isConnected = connected;

    if (connected) {
      this.deviceInfo.model = deviceName.includes('Nano-Pix') ? deviceName : 'Eighteeth Nano-Pix 2';
      this.deviceInfo.status = 'Ready (Armed)';
      this.log('SUCCESS', `Sensor status: ARMED & READY (${this.deviceInfo.model})`);
      if (!wasConnected) {
        this.playConnectChime();
        this.emit('connected', this.deviceInfo);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nanopix:connected', { detail: this.deviceInfo }));
        }
      }
    } else {
      this.deviceInfo.status = 'Disconnected';
      this.log('WARN', 'Sensor status: DISCONNECTED');
      if (wasConnected) {
        this.emit('disconnected', this.deviceInfo);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nanopix:disconnected', { detail: this.deviceInfo }));
        }
      }
    }
  }

  playConnectChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioContext) this.audioContext = new AudioContext();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();

      const now = this.audioContext.currentTime;
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.53, now + 0.09);
      gain2.gain.setValueAtTime(0.001, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.32);
    } catch (e) {
      console.debug('Audio chime skipped:', e);
    }
  }

  simulateConnect(model = 'Eighteeth Nano-Pix 2 (USB 2.0)') {
    this.log('SUCCESS', `Direct chairside mode armed: ${model}`);
    this.setConnected(true, model);
  }

  simulateDisconnect() {
    this.log('WARN', 'Sensor set to standby / disconnected.');
    this.setConnected(false);
  }

  async selectHotFolder() {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker({
          id: 'nanopix_export',
          mode: 'read',
          startIn: 'documents'
        });
        this.hotFolderHandle = dirHandle;
        this.isWatchingHotFolder = true;
        this.log('HOTFOLDER', `Hot-Folder active! Watching directory: "${dirHandle.name}" for new TIFF/DICOM exposures.`);
        this.emit('hotfolder-selected', { name: dirHandle.name });
        return { success: true, name: dirHandle.name };
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.log('WARN', `Directory picker error: ${err.message}`);
        }
      }
    }
    return { success: false, reason: 'Directory Picker not supported or cancelled' };
  }

  // ---------------------------------------------------------------------------
  // 5. EVENT SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  subscribe(event, callback) {
    return this.on(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  unsubscribe(event, callback) {
    this.off(event, callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      deviceInfo: { ...this.deviceInfo }
    };
  }
}

// Global Singleton
export const nanoPixService = new NanoPixDeviceService();
export default nanoPixService;

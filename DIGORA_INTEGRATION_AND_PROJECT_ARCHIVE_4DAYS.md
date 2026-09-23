# 📋 Soredex DIGORA® Optime Integration & 4-Day Development Master Archive
**Project:** Dentia Dental Cloud Platform (`Dentistfrontend`)  
**Hardware Target:** Soredex DIGORA® Optime Intraoral Phosphor Storage Plate (PSP) Scanner  
**Document Creation Date:** September 23, 2026  
**Archive Scope:** Complete technical record of all implementations, hardware bindings, protocol fixes, network configurations, state machines, and UX architecture developed over the past 4 days.

---

## 📑 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Physical Hardware Specifications & Network Topology](#2-physical-hardware-specifications--network-topology)
3. [Native C++ Driver Engine (`s2_x64.dll`) & Koffi C-FFI Bindings](#3-native-c-driver-engine-s2_x64dll--koffi-c-ffi-bindings)
4. [Hardware State Machine & LED Diagnostics](#4-hardware-state-machine--led-diagnostics)
5. [Key Problems Diagnosed & Permanent Solutions](#5-key-problems-diagnosed--permanent-solutions)
   - [A. Orange/Amber LED vs. Solid Green LED (`0x0202` ➔ `0x0046`)](#a-orangeamber-led-vs-solid-green-led-0x0202--0x0046)
   - [B. Modal Window Auto-Closing Prematurely](#b-modal-window-auto-closing-prematurely)
   - [C. Phosphor Strip Ejection & Drop Tray Solenoid Mechanism](#c-phosphor-strip-ejection--drop-tray-solenoid-mechanism)
   - [D. Prevention of Ghost / Fake Scans During Arming](#d-prevention-of-ghost--fake-scans-during-arming)
6. [Core System Components & File Inventory](#6-core-system-components--file-inventory)
7. [Automated Verification & Diagnostics Suite](#7-automated-verification--diagnostics-suite)
8. [Clinical Chairside Workflow Guide for Clinicians](#8-clinical-chairside-workflow-guide-for-clinicians)
9. [Safeguards & Future Maintenance Rules](#9-safeguards--future-maintenance-rules)

---

## 1. Executive Summary & Purpose
This document serves as an immutable master record of the complete Soredex DIGORA® Optime Ethernet integration built into the Dentia web platform. It ensures that future feature additions, refactorings, or updates will not break, regress, or misconfigure the physical scanner hardware, network routing, or chairside clinician experience.

---

## 2. Physical Hardware Specifications & Network Topology

### Hardware Specifications
- **Manufacturer / Model:** Soredex / PaloDEx Group — DIGORA® Optime Countertop Intraoral PSP Scanner
- **Serial Number:** `SL1403203`
- **Firmware Software Version:** `1.04`
- **Firmware Core Version:** `26`
- **Optical Resolution:** 14-bit / 17 lp/mm (Scan dimensions: ~1800 x 3076 pixels, 11 MB raw laser stream)
- **Supported Plate Sizes:** Size 0 (Pediatric), Size 1 (Anterior), Size 2 (Adult Posterior / Bitewing), Size 3 (Long Bitewing)

### Network Architecture
- **Scanner Static IP:** `192.168.0.100`
- **Dedicated Clinic NIC IP (Ethernet Adapter):** `192.168.0.75`
- **Subnet Mask:** `255.255.255.0` (Target Subnet: `192.168.0.x`)
- **Primary UDP Port:** `10000` (PaloDEx Native Driver Command & UDP Data Streaming)
- **Optional DICOM Port:** `104` (DICOM Storage SCP)
- **Raw Motor Port:** `2002`
- **Local Bridge Daemon Port:** `http://127.0.0.1:5055`
- **Web App Frontend:** `http://localhost:5173`
- **Cloud DEV API:** `https://dentist-api-dev.vitonta.com`

```
┌─────────────────────────────────────────────────────────────┐
│                       CLINIC LAN                            │
│                                                             │
│  [Soredex DIGORA® Optime]  <── Ethernet Cable ──>  [NIC]   │
│       IP: 192.168.0.100                                     │
│       UDP Port: 10000                                       │
│                                           IP: 192.168.0.75  │
│                                                    │        │
│                                                    ▼        │
│                             [Local Bridge: digora_lan_bridge]
│                             - s2_x64.dll C-FFI (Koffi)      │
│                             - Zero-loss UDP streaming       │
│                             - Port: 5055                    │
│                                                    │        │
│                                                    ▼        │
│                             [Dentia React Frontend]         │
│                             - useDigoraHardwareSync hook    │
│                             - DigoraScannerModal.jsx        │
│                             - SignalR Live Auto-Mount       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Native C++ Driver Engine (`s2_x64.dll`) & Koffi C-FFI Bindings

The bridge communicates with the physical DIGORA Optime via direct C-FFI calls into `s2_x64.dll` bundled at `drivers/digora/s2_x64.dll` using Koffi:

```javascript
const koffi = require('koffi');
const s2Lib = koffi.load('drivers/digora/s2_x64.dll');

const s2Funcs = {
  s2CreateObject: s2Lib.func('void* s2CreateObject()'),
  s2ConfigureDevice: s2Lib.func('uint16 s2ConfigureDevice(void* s2, const char* config)'),
  s2Open: s2Lib.func('uint16 s2Open(void* s2, const char* target)'),
  s2Execute: s2Lib.func('uint16 s2Execute(void* s2, const char* cmd, _Out_ char* resp)'),
  s2Receive: s2Lib.func('uint16 s2Receive(void* s2, _Out_ uint8* buffer, uint32 size)'),
  s2Close: s2Lib.func('uint16 s2Close(void* s2)')
};
```

### Essential Driver Command Flow:
1. `s2ConfigureDevice(s2, "192.168.0.100:10000|192.168.0.75|255.255.255.0")` — Triggers acoustic BEEP pulse and sets up zero-loss UDP return route to the local Ethernet NIC.
2. `s2Open(s2, "192.168.0.100:10000")` — Connects to scanner firmware.
3. `s2Execute(s2, "login", buf)` — Returns firmware version and serial number.
4. `s2Execute(s2, "fpname Patient-<id>", buf)` — Arms the top slot and illuminates the **Solid Green LED**.
5. `s2Execute(s2, "status ro", buf)` — Non-intrusive status polling loop every 800ms.
6. `s2Execute(s2, "imageparams", buf)` — Returns scanned plate pixel dimensions (`iSize`, `jSize`).
7. `s2Receive(s2, rawBuffer, totalBytes)` — Streams 16-bit raw pixel data into memory.
8. `s2Execute(s2, "status", buf)` — Firmware buffer acknowledgment, triggering the bottom solenoid to eject the erased phosphor plate into the drop tray.
9. `s2Execute(s2, "logout", buf)` & `s2Close(s2)` — Clean driver session shutdown.

---

## 4. Hardware State Machine & LED Diagnostics

| State Code | Meaning / Hardware Status | LED Indication | Solenoid / Mechanism Status |
| :--- | :--- | :--- | :--- |
| `state 0x0000` | IDLE / Standby | LED Off | Slot closed / Motor stationary |
| `state 0x0202` | Residual image buffer in firmware memory | **Solid Amber / Orange** | Waiting for host to read/drain buffer |
| `state 0x0046` | **ARMED & READY** (Active 120s lease) | **Solid Green** | Vertical slot unlocked; ready for plate |
| `state 0x0010` | Plate entering slot | Solid Green | Optic sensor engaged |
| `state 0x0030` | Motor pulling plate | Solid Green | Roller active; plate moving to laser |
| `state 0x0043` | Laser scanning in progress | Solid Green | 14-bit laser read (17 lp/mm) |
| `state 0x0044` / `IMAGE` | UV Erasure & image ready | Solid Green / Blinking | UV lamp erases latent X-ray data |
| `0x0060` / `status ACK` | **Plate Release / Ejection** | Solid Green | **Bottom solenoid triggers; plate drops to tray** |

---

## 5. Key Problems Diagnosed & Permanent Solutions

### A. Orange/Amber LED vs. Solid Green LED (`0x0202` ➔ `0x0046`)
- **Root Cause:** When an image buffer from a prior scan remained unread in scanner memory, the DIGORA Optime stayed in `state 0x0202` (Orange light). Additionally, if `s2ConfigureDevice` selected a non-Ethernet adapter (e.g. Wi-Fi `192.168.100.133`), the arming handshake failed to lock.
- **Solution:** 
  1. Priority NIC detection: strictly selects `192.168.0.75` on the `192.168.0.x` subnet.
  2. Auto-Drain: On arming, if the machine is in `0x0202`, the bridge automatically calls `s2Receive` to drain the buffer and immediately executes `fpname Patient-${id}` to turn the top LED **Solid Green (`0x0046`)**.

### B. Modal Window Auto-Closing Prematurely
- **Root Cause:** Backdrop click handler in `DigoraScannerModal.jsx` was catching edge clicks and firing `onClose()`. Furthermore, clicking the status pill in the filmstrip was calling `disarmScanner()`.
- **Solution:**
  1. Removed backdrop click auto-close; modal stays open for the full 120-second lease unless the user explicitly clicks the `X` button, `Stop & Close`, or `Close`.
  2. Clicking the filmstrip status pill opens/focuses the modal instead of disarming.

### C. Phosphor Strip Ejection & Drop Tray Solenoid Mechanism
- **Root Cause:** The scanner holds the plate in the internal chassis until the driver acknowledges complete buffer transfer via `s2Receive` and sends the post-scan handshake. When UDP packets were lost on wrong subnets, `s2Receive` timed out, leaving the plate stuck inside.
- **Solution:**
  1. Configured direct `192.168.0.75` UDP routing for 0% packet loss.
  2. Added immediate `status` command execution after `s2Receive`, which fires the bottom solenoid and drops the erased, clean plate into the smoked drop collection tray.

### D. Prevention of Ghost / Fake Scans During Arming
- **Root Cause:** Tests and idle arming leases previously generated dummy canvas drawings if no plate was inserted.
- **Solution:**
  1. Introduced `physicalPlateScanDetected` flag in the bridge state machine.
  2. Image conversion ONLY triggers when optical sensors detect the plate sequence (`0x0010` ➔ `0x0030` ➔ `0x0043` ➔ `0x0044`). Zero fake images are generated when the scanner is simply armed or idling.

---

## 6. Core System Components & File Inventory

| File Path | Description & Role |
| :--- | :--- |
| `digora_lan_bridge.cjs` | Primary Node.js native bridge daemon (Port 5055). Manages `s2_x64.dll`, zero-loss UDP streaming, state polling, and raw-to-PNG processing. |
| `public/digora_lan_bridge.cjs` | Web-accessible copy for clinic download and deployment. |
| `src/hooks/useDigoraHardwareSync.js` | React hook for real-time chairside sync, 120s countdown lease, bridge polling, and SignalR WebSocket auto-mounting. |
| `src/components/DigoraScannerModal.jsx` | Chairside hardware console modal with live lease timer, plate size selector, physical hardware diagram, and manual ingest fallback. |
| `src/components/ChartRadiographFilmstrip.jsx` | Patient chart filmstrip with "▶ Play DIGORA (2m)" arming button, live countdown badge, and radiograph carousel. |
| `src/pages/ChartPage.jsx` | Main patient chart page integrating radiograph filmstrip, AI diagnosis viewer, and DIGORA modal portal. |
| `drivers/digora/s2_x64.dll` | Official PaloDEx / Soredex native C++ 64-bit driver DLL. |
| `verify_all_steps.cjs` | 16-step automated test suite validating the entire hardware and software stack. |
| `VERIFY_ALL_DIGORA_STEPS.bat` | One-click Windows batch verification launcher. |
| `TEST_DIGORA_DEVICE.bat` | Standalone diagnostic batch tool with pure Windows sockets for offline clinic testing. |

---

## 7. Automated Verification & Diagnostics Suite

Run the full verification suite anytime to confirm all 16 integration checks pass:

```bash
node verify_all_steps.cjs
```
*(Or double-click `VERIFY_ALL_DIGORA_STEPS.bat` in Windows Explorer)*

### Expected Output:
```
======================================================================
 [STEP 1/8] NETWORK INTERFACES & SUBNET ROUTE DETECTION
   PASSED ✔  Network Subnet Routing (Target: 192.168.0.100) — Local Subnet 192.168.0.x detected
   PASSED ✔  ICMP Ping to Physical Scanner (192.168.0.100) — Ping Response in 1ms

 [STEP 2/8] HARDWARE COMMUNICATION PROTOCOL & PORT PROBING
   PASSED ✔  PaloDEx Native Hardware Port 10000 (UDP Wake & Control) — Primary Channel
   PASSED ✔  Optional DICOM SCP Port 104 / Raw Port 2002 — PaloDEx Native Mode Active

 [STEP 3/8] NATIVE SOREDEX DRIVER DLL & KOFFI C-FFI BINDINGS
   PASSED ✔  Native Soredex Driver (s2_x64.dll) — Loaded
   PASSED ✔  C-FFI Fast Export Bindings — 5/5 functions linked

 [STEP 4/8] LOCAL DIGORA HARDWARE BRIDGE SERVICE (PORT 5055)
   PASSED ✔  Bridge Daemon HTTP Server (http://127.0.0.1:5055) — Active (Native-PaloDEx-v2.4)
   PASSED ✔  Scanner Binding Configuration — Target IP: 192.168.0.100 | S/N: SL1403203

 [STEP 5/8] PHYSICAL SCANNER BEEP PULSE & FIRMWARE LOGIN
   PASSED ✔  Acoustic BEEP Pulse (s2ConfigureDevice) — Device acknowledged pulse
   PASSED ✔  Scanner Firmware Identification — Software 1.04 | Core 26 | S/N SL1403203

 [STEP 6/8] 2-MINUTE PLATE STRIP ARMING LEASE (120S WINDOW)
   PASSED ✔  2-Minute Arming Protocol Lease (120s) — Status: Armed & Ready (Solid Green LED)
   PASSED ✔  Patient Lock on Hardware Firmware — Registered on Optime chip

 [STEP 7/8] HOT FOLDER REAL-TIME WATCHER & IMAGE INGESTION
   PASSED ✔  Hot Folder Watcher (scans/) — Detected file
   PASSED ✔  Base64 Radiograph Ingestion Pipeline — Data URL generated

 [STEP 8/8] WEB APP FRONTEND & STANDBY RESET
   PASSED ✔  Dentia Web Application (http://localhost:5173) — HTTP 200 OK
   PASSED ✔  Clean Hardware Reset & Standby Transition — Device returned to state 0x0000 (IDLE)
======================================================================
 TOTAL: 16/16 Checks Passed (0 Failed) — 100% OPERATIONAL
```

---

## 8. Clinical Chairside Workflow Guide for Clinicians

1. **Open Patient Chart:** Navigate to `http://localhost:5173` and open the desired patient's chart.
2. **Arm DIGORA Scanner:** Click the **`▶ Play DIGORA (2m)`** button in the Radiograph Filmstrip or inside the DIGORA console modal.
3. **Verify Physical Machine:**
   - The scanner emits a distinct **BEEP tone**.
   - The top circular LED illuminates **Solid Green**.
   - The vertical top slot is unlocked and ready for **120 seconds (2 minutes)**.
4. **Insert Phosphor Plate Strip:** Drop the exposed intraoral phosphor plate into the vertical top slot.
5. **Automatic Processing:**
   - The scanner pulls the plate down, scans with the 14-bit laser, and activates the UV lamp for erasure.
   - The bottom solenoid triggers and **ejects the clean, erased plate into the drop collection tray**.
6. **Instant Cloud Auto-Mount:** The high-resolution radiograph immediately displays on screen and auto-mounts to the active patient chart with AI tooth diagnostic spotlighting.

---

## 9. Safeguards & Future Maintenance Rules

> [!IMPORTANT]
> **Rules for Future Developers & Agents:**
> 1. **Never call `s2Execute(s2, 'reset')` during arming.** Calling `reset` logs out the driver session and turns off the Green LED. Only call `reset` during explicit disarm or upon 120s lease timeout.
> 2. **Always bind `s2ConfigureDevice` with the matching local subnet IP (`192.168.0.75`).** Do not route UDP scanner traffic over secondary Wi-Fi interfaces.
> 3. **Never auto-generate dummy canvas teeth on arming.** Real radiographs must only be created when `physicalPlateScanDetected` is true or a real image file is uploaded.
> 4. **Keep `DigoraScannerModal.jsx` backdrop click disabled** to prevent accidental dismissal during chairside plate handling.
> 5. **Always sync changes** between `digora_lan_bridge.cjs` and `public/digora_lan_bridge.cjs`.

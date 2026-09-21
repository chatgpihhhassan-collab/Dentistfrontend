import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../config/apiConfig';

const LOG_HEADER = "background: #10244B; color: #60A5FA; font-weight: 900; font-size: 11px; padding: 3px 8px; border-radius: 4px;";
const LOG_STEP = "background: #EAF0FC; color: #10244B; font-weight: 700; padding: 2px 6px; border-radius: 4px;";
const LOG_SUCCESS = "background: #059669; color: #FFFFFF; font-weight: 800; padding: 2px 6px; border-radius: 4px;";
const LOG_EVENT = "background: #7C3AED; color: #FFFFFF; font-weight: 800; padding: 2px 6px; border-radius: 4px;";
const LOG_WARN = "background: #D97706; color: #FFFFFF; font-weight: 700; padding: 2px 6px; border-radius: 4px;";

/**
 * useDigoraHardwareSync
 * Real-time chairside synchronization hook for Soredex DIGORA® Optime Ethernet intraoral scanner.
 * 
 * Features:
 * - 100% Zero-Client footprint (no local software, drivers, or browser extensions).
 * - Live Chairside Arming: Automatically binds the operatory DIGORA Optime to the active patient.
 * - Real-Time Ingest Notification: Emitted by DentistAPI SignalR hub when the scanner completes a plate.
 * - Auto-loads fresh radiograph and AI diagnostics into the active patient chart.
 * - Full console log auditing on every step for developer and clinician verification.
 */
export function useDigoraHardwareSync({
  patientId,
  operatoryId = 'Op-1',
  onRadiographAcquired,
  autoArm = true
}) {
  const [connectionState, setConnectionState] = useState('Disconnected');
  const [isArmed, setIsArmed] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [lastAcquiredScan, setLastAcquiredScan] = useState(null);
  const [unassignedScans, setUnassignedScans] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hardwareError, setHardwareError] = useState(null);

  const hubConnectionRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const cleanBaseUrl = (API_BASE_URL || 'https://dentist-api-dev.vitonta.com').replace(/\/$/, '');

  // 1. Arm Scanner API Call
  const armScanner = useCallback(async (targetOp = operatoryId, durationMinutes = 10) => {
    if (!patientId) {
      console.warn('%c[SOREDEX DIGORA]%c Cannot arm scanner: No active Patient ID provided.', LOG_WARN, '');
      return;
    }

    console.log(
      `%c[SOREDEX DIGORA] STEP 5/8: Arming Scanner%c Sending arm request for Patient #${patientId} in Operatory [${targetOp}] (${durationMinutes} min lease)...`,
      LOG_STEP,
      'color: #10244B; font-weight: 600;'
    );

    try {
      setHardwareError(null);
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/arm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatoryId: targetOp,
          patientId: Number(patientId),
          scannerId: 'DIGORA_OPTIME_01',
          durationMinutes
        })
      });

      if (res.ok) {
        const data = await res.json();
        const remaining = Math.round(data.remainingSeconds || durationMinutes * 60);
        setIsArmed(true);
        setRemainingSeconds(remaining);
        console.log(
          `%c[SOREDEX DIGORA] STEP 6/8: Scanner Armed Successfully!%c Operatory [${targetOp}] locked to Patient #${patientId} for ${Math.round(remaining / 60)} min. Machine is READY for phosphor plate drop.`,
          LOG_SUCCESS,
          'color: #059669; font-weight: 700;'
        );
      } else {
        const errText = await res.text();
        console.warn(`%c[SOREDEX DIGORA] Arming Response Warning:%c HTTP ${res.status}: ${errText}`, LOG_WARN, '');
      }
    } catch (err) {
      console.warn(`%c[SOREDEX DIGORA] Failed to reach arming endpoint:%c ${err.message}`, LOG_WARN, '');
      setHardwareError('Failed to arm DIGORA Optime scanner.');
    }
  }, [cleanBaseUrl, operatoryId, patientId]);

  // 2. Disarm Scanner API Call
  const disarmScanner = useCallback(async (targetOp = operatoryId) => {
    console.log(`%c[SOREDEX DIGORA] Disarming Scanner%c for Operatory [${targetOp}]...`, LOG_STEP, '');
    try {
      await fetch(`${cleanBaseUrl}/api/hardware/digora/disarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatoryId: targetOp })
      });
      setIsArmed(false);
      setRemainingSeconds(0);
      console.log(`%c[SOREDEX DIGORA] Scanner Disarmed%c Operatory [${targetOp}] is now in idle standby mode.`, LOG_SUCCESS, '');
    } catch (err) {
      console.warn('[SOREDEX DIGORA] Failed to disarm scanner:', err);
    }
  }, [cleanBaseUrl, operatoryId]);

  // 3. Fetch Unassigned Scans
  const fetchUnassignedScans = useCallback(async () => {
    try {
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/unassigned`);
      if (res.ok) {
        const list = await res.json();
        setUnassignedScans(list);
        if (list.length > 0) {
          console.log(`%c[SOREDEX DIGORA] Unassigned Scans Queue:%c ${list.length} scan(s) waiting in clinic drawer.`, LOG_STEP, '');
        }
      }
    } catch (err) {
      console.warn('[SOREDEX DIGORA] Failed to fetch unassigned scans:', err);
    }
  }, [cleanBaseUrl]);

  // 4. Assign an Unassigned Scan to Active Patient
  const assignScan = useCallback(async (unassignedId) => {
    if (!patientId || !unassignedId) return;
    console.log(`%c[SOREDEX DIGORA] Assigning Scan%c Attaching unassigned scan #${unassignedId} to Patient #${patientId}...`, LOG_STEP, '');
    try {
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unassignedId, patientId: Number(patientId) })
      });
      if (res.ok) {
        console.log(`%c[SOREDEX DIGORA] Scan Assigned Successfully!%c Attached to Patient #${patientId}.`, LOG_SUCCESS, '');
        await fetchUnassignedScans();
      }
    } catch (err) {
      console.error('[SOREDEX DIGORA] Failed to assign scan:', err);
    }
  }, [cleanBaseUrl, fetchUnassignedScans, patientId]);

  // 5. Trigger Hardware Simulation (Useful for clinic demo/testing without physical plate)
  const simulateScan = useCallback(async () => {
    if (!patientId) return;
    console.log(
      `%c[SOREDEX DIGORA] ⚡ Triggering Simulated Scan%c Simulating intraoral plate feed for Patient #${patientId} in [${operatoryId}]...`,
      LOG_EVENT,
      'color: #7C3AED; font-weight: bold;'
    );
    try {
      setIsSimulating(true);
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/simulate?operatoryId=${encodeURIComponent(operatoryId)}&patientId=${patientId}`, {
        method: 'POST'
      });
      const data = await res.json();
      console.log(`%c[SOREDEX DIGORA] Simulation Ingest Result:%c`, LOG_SUCCESS, '', data);
      return data;
    } catch (err) {
      console.error('[SOREDEX DIGORA] Simulation error:', err);
    } finally {
      setTimeout(() => setIsSimulating(false), 800);
    }
  }, [cleanBaseUrl, operatoryId, patientId]);

  // 6. Countdown Timer Effect
  useEffect(() => {
    if (isArmed && remainingSeconds > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            console.log('%c[SOREDEX DIGORA] Active Arming Lease Expired.%c Scanner reset to idle.', LOG_WARN, '');
            setIsArmed(false);
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isArmed, remainingSeconds]);

  // 7. SignalR WebSocket Connection & Event Lifecycle
  useEffect(() => {
    if (!patientId) return;

    let isSubscribed = true;
    const hubUrl = `${cleanBaseUrl}/hubs/imaging`;

    console.log(
      `%c[SOREDEX DIGORA] STEP 1/8: Initializing Chairside Sync%c Target: Patient #${patientId} | Operatory: [${operatoryId}] | Hub: ${hubUrl}`,
      LOG_HEADER,
      'color: #10244B; font-weight: 700;'
    );

    console.log(
      `%c[SOREDEX DIGORA] STEP 2/8: Connecting to SignalR WebSocket Hub%c Initiating connection to ${hubUrl}...`,
      LOG_STEP,
      'color: #10244B;'
    );

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 1500, 3000, 7000, 15000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hubConnectionRef.current = connection;

    connection
      .start()
      .then(() => {
        if (!isSubscribed) return;
        setConnectionState('Connected');
        console.log(
          `%c[SOREDEX DIGORA] STEP 3/8: SignalR Connected Successfully!%c State: ${connection.state} | ID: ${connection.connectionId || 'active'}`,
          LOG_SUCCESS,
          'color: #059669; font-weight: 700;'
        );

        // Join Patient SignalR room
        console.log(
          `%c[SOREDEX DIGORA] STEP 4/8: Joining Active Patient Room%c -> room [patient_${patientId}]`,
          LOG_STEP,
          'color: #10244B;'
        );
        connection.invoke('JoinPatientSession', String(patientId))
          .then(() => {
            console.log(`%c[SOREDEX DIGORA] Room Joined:%c Successfully subscribed to real-time events for Patient #${patientId}.`, LOG_SUCCESS, '');
          })
          .catch((err) => console.error('[SOREDEX DIGORA] Error joining patient room:', err));

        // Auto-arm scanner if configured
        if (autoArm) {
          armScanner(operatoryId);
        }

        // Fetch initial unassigned scans
        fetchUnassignedScans();

        console.log(
          `%c[SOREDEX DIGORA] STEP 7/8: Ethernet Real-Time Listener Active%c 📡 Listening for 'RadiographAcquired' scans from Soredex DIGORA Optime...`,
          LOG_STEP,
          'color: #059669; font-weight: bold;'
        );
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn(`%c[SOREDEX DIGORA] SignalR Connection Notice (Fallback Active):%c ${err.message}`, LOG_WARN, '');
        setConnectionState('Error');
      });

    // Handle Incoming Fresh Radiograph from Soredex DIGORA Optime
    connection.on('RadiographAcquired', (scanData) => {
      if (!isSubscribed) return;

      console.log(
        `%c[SOREDEX DIGORA] STEP 8/8: 📥 RADIOGRAPH ACQUIRED FROM SOREDEX DIGORA OPTIME!%c Processing scan payload...`,
        LOG_EVENT,
        'color: #7C3AED; font-weight: bold;'
      );

      const targetPid = Number(scanData.PatientID || scanData.patientId);
      const activePid = Number(patientId);

      console.table({
        "Radiograph ID": scanData.RadiographID || scanData.radiographID || scanData.id,
        "Target Patient ID": targetPid,
        "Active Patient ID": activePid,
        "Image Name": scanData.ImageName || scanData.imageName,
        "Source Device": scanData.Source || "Soredex DIGORA Optime Ethernet",
        "Operatory": scanData.OperatoryId || operatoryId,
        "Mime Type": scanData.MimeType || scanData.mimeType || 'image/png',
        "Timestamp": scanData.UploadedAt || scanData.uploadedAt || new Date().toISOString(),
        "Matches Active Patient": targetPid === activePid ? "✅ YES (Auto-Mounting)" : "❌ NO"
      });

      // Verify this belongs to current patient
      if (targetPid === activePid) {
        setLastAcquiredScan(scanData);

        // Subtle audio feedback
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch (e) {}

        if (onRadiographAcquired) {
          console.log(`%c[SOREDEX DIGORA] Dispatching to Chart Handler...%c Auto-mounting radiograph onto patient #${patientId} screen`, LOG_SUCCESS, '');
          onRadiographAcquired(scanData);
        }
      }
    });

    // Handle Scanner Armed Event Broadcast
    connection.on('ScannerArmed', (data) => {
      if (!isSubscribed) return;
      if (data.operatoryId === operatoryId && Number(data.patientId) === Number(patientId)) {
        console.log(`%c[SOREDEX DIGORA] Received 'ScannerArmed' Broadcast%c Operatory: ${data.operatoryId}, Remaining: ${data.remainingSeconds}s`, LOG_SUCCESS, '');
        setIsArmed(true);
        setRemainingSeconds(Math.round(data.remainingSeconds || 600));
      }
    });

    // Handle Scanner Disarmed Event Broadcast
    connection.on('ScannerDisarmed', (data) => {
      if (!isSubscribed) return;
      if (data.operatoryId === operatoryId) {
        console.log(`%c[SOREDEX DIGORA] Received 'ScannerDisarmed' Broadcast%c Operatory: ${data.operatoryId}`, LOG_WARN, '');
        setIsArmed(false);
        setRemainingSeconds(0);
      }
    });

    // Handle Unassigned Scans Event Broadcast
    connection.on('UnassignedScanAvailable', (info) => {
      if (!isSubscribed) return;
      console.log(`%c[SOREDEX DIGORA] 🔔 Received 'UnassignedScanAvailable' Event%c Scan #${info.unassignedId || ''} captured without active chart.`, LOG_EVENT, '');
      fetchUnassignedScans();
    });

    // Connection lifecycle logging
    connection.onreconnecting((err) => {
      console.warn(`%c[SOREDEX DIGORA] Connection Reconnecting...%c ${err ? err.message : ''}`, LOG_WARN, '');
      setConnectionState('Reconnecting');
    });

    connection.onreconnected((connectionId) => {
      console.log(`%c[SOREDEX DIGORA] Reconnected Successfully!%c New ID: ${connectionId}`, LOG_SUCCESS, '');
      setConnectionState('Connected');
      connection.invoke('JoinPatientSession', String(patientId)).catch(console.error);
    });

    connection.onclose((err) => {
      console.warn(`%c[SOREDEX DIGORA] Connection Closed:%c ${err ? err.message : 'Clean disconnect'}`, LOG_WARN, '');
      setConnectionState('Disconnected');
    });

    return () => {
      isSubscribed = false;
      if (connection) {
        console.log(`%c[SOREDEX DIGORA] Cleaning up session%c Leaving room patient_${patientId}`, LOG_STEP, '');
        connection.invoke('LeavePatientSession', String(patientId)).catch(() => {});
        connection.stop().catch(() => {});
      }
    };
  }, [autoArm, cleanBaseUrl, fetchUnassignedScans, operatoryId, onRadiographAcquired, patientId, armScanner]);

  const formattedRemainingTime = remainingSeconds > 0 
    ? `${Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
    : '00:00';

  return {
    connectionState,
    isArmed,
    remainingSeconds,
    formattedRemainingTime,
    lastAcquiredScan,
    unassignedScans,
    unassignedCount: unassignedScans.length,
    isSimulating,
    hardwareError,
    armScanner,
    disarmScanner,
    simulateScan,
    fetchUnassignedScans,
    assignScan
  };
}

export default useDigoraHardwareSync;

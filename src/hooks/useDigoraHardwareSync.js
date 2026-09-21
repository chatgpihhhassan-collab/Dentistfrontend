import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * useDigoraHardwareSync
 * Real-time chairside synchronization hook for Soredex DIGORA® Optime Ethernet intraoral scanner.
 * 
 * Features:
 * - 100% Zero-Client footprint (no local software, drivers, or browser extensions).
 * - Live Chairside Arming: Automatically binds the operatory DIGORA Optime to the active patient.
 * - Real-Time Ingest Notification: Emitted by DentistAPI SignalR hub when the scanner completes a plate.
 * - Auto-loads fresh radiograph and AI diagnostics into the active patient chart.
 * - Safety net handling for unassigned scans.
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
    if (!patientId) return;
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
        setIsArmed(true);
        setRemainingSeconds(Math.round(data.remainingSeconds || durationMinutes * 60));
      }
    } catch (err) {
      console.warn('[DIGORA SYNC] Failed to arm scanner:', err);
      setHardwareError('Failed to arm DIGORA Optime scanner.');
    }
  }, [cleanBaseUrl, operatoryId, patientId]);

  // 2. Disarm Scanner API Call
  const disarmScanner = useCallback(async (targetOp = operatoryId) => {
    try {
      await fetch(`${cleanBaseUrl}/api/hardware/digora/disarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatoryId: targetOp })
      });
      setIsArmed(false);
      setRemainingSeconds(0);
    } catch (err) {
      console.warn('[DIGORA SYNC] Failed to disarm scanner:', err);
    }
  }, [cleanBaseUrl, operatoryId]);

  // 3. Fetch Unassigned Scans
  const fetchUnassignedScans = useCallback(async () => {
    try {
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/unassigned`);
      if (res.ok) {
        const list = await res.json();
        setUnassignedScans(list);
      }
    } catch (err) {
      console.warn('[DIGORA SYNC] Failed to fetch unassigned scans:', err);
    }
  }, [cleanBaseUrl]);

  // 4. Assign an Unassigned Scan to Active Patient
  const assignScan = useCallback(async (unassignedId) => {
    if (!patientId || !unassignedId) return;
    try {
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unassignedId, patientId: Number(patientId) })
      });
      if (res.ok) {
        await fetchUnassignedScans();
      }
    } catch (err) {
      console.error('[DIGORA SYNC] Failed to assign scan:', err);
    }
  }, [cleanBaseUrl, fetchUnassignedScans, patientId]);

  // 5. Trigger Hardware Simulation (Useful for clinic demo/testing without physical plate)
  const simulateScan = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsSimulating(true);
      const res = await fetch(`${cleanBaseUrl}/api/hardware/digora/simulate?operatoryId=${encodeURIComponent(operatoryId)}&patientId=${patientId}`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      console.error('[DIGORA SYNC] Simulation error:', err);
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

  // 7. SignalR WebSocket Connection
  useEffect(() => {
    if (!patientId) return;

    let isSubscribed = true;
    const hubUrl = `${cleanBaseUrl}/hubs/imaging`;

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
        console.log(`[DIGORA SYNC] SignalR Connected to ${hubUrl}. Joining room patient_${patientId}`);

        // Join Patient SignalR room
        connection.invoke('JoinPatientSession', String(patientId)).catch(console.error);

        // Auto-arm scanner if configured
        if (autoArm) {
          armScanner(operatoryId);
        }

        // Fetch initial unassigned scans
        fetchUnassignedScans();
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn('[DIGORA SYNC] SignalR Connection Failed (will retry):', err.message);
        setConnectionState('Error');
      });

    // Handle Incoming Fresh Radiograph
    connection.on('RadiographAcquired', (scanData) => {
      if (!isSubscribed) return;
      console.log('✨ [DIGORA SYNC] Fresh Radiograph Acquired:', scanData);

      // Verify this belongs to current patient
      if (Number(scanData.PatientID || scanData.patientId) === Number(patientId)) {
        setLastAcquiredScan(scanData);

        // Subtle audio feedback if browser allows
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch (e) {}

        if (onRadiographAcquired) {
          onRadiographAcquired(scanData);
        }
      }
    });

    // Handle Scanner Armed Event
    connection.on('ScannerArmed', (data) => {
      if (!isSubscribed) return;
      if (data.operatoryId === operatoryId && Number(data.patientId) === Number(patientId)) {
        setIsArmed(true);
        setRemainingSeconds(Math.round(data.remainingSeconds || 600));
      }
    });

    // Handle Scanner Disarmed Event
    connection.on('ScannerDisarmed', (data) => {
      if (!isSubscribed) return;
      if (data.operatoryId === operatoryId) {
        setIsArmed(false);
        setRemainingSeconds(0);
      }
    });

    // Handle Unassigned Scans Event
    connection.on('UnassignedScanAvailable', () => {
      if (!isSubscribed) return;
      fetchUnassignedScans();
    });

    // Connection lifecycle
    connection.onreconnecting(() => setConnectionState('Reconnecting'));
    connection.onreconnected(() => {
      setConnectionState('Connected');
      connection.invoke('JoinPatientSession', String(patientId)).catch(console.error);
    });
    connection.onclose(() => setConnectionState('Disconnected'));

    return () => {
      isSubscribed = false;
      if (connection) {
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

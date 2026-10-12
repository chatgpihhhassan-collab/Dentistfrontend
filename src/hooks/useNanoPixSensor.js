import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Production-ready React hook for direct WebSocket integration with the Eighteeth NanoPix C# Local Bridge.
 * Connects to ws://127.0.0.1:5050/ws with exponential backoff, real-time telemetry, and AED capture handling.
 */
export function useNanoPixSensor({
  patientId = null,
  toothKey = null,
  doctorId = null,
  autoConnect = true,
  onCapture = null
} = {}) {
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('OFFLINE'); // OFFLINE, DISCONNECTED, READY, ARMED, CAPTURING
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSerial, setDeviceSerial] = useState('');
  const [isArmed, setIsArmed] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState(null);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const backoffDelayRef = useRef(1000);
  const isMountedRef = useRef(true);

  // Synthesize pleasant clinical audio chime using Web Audio API
  const playCaptureChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Two-tone medical confirmation chime (880Hz -> 1320Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.4);
    } catch (_) {}
  }, []);

  // Primary WebSocket connection handler
  const connectWebSocket = useCallback(() => {
    if (!isMountedRef.current) return;
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Try standard endpoint ws://127.0.0.1:5050/ws
    const wsUrl = 'ws://127.0.0.1:5050/ws';
    let ws;

    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      scheduleReconnect();
      return;
    }

    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      console.log('%c[NANOPIX WS] ✅ Connected to Local C# Bridge (ws://127.0.0.1:5050)', 'color: #10b981; font-weight: bold;');
      setBridgeOnline(true);
      setError(null);
      backoffDelayRef.current = 1000; // Reset backoff on successful connect

      // Fetch recent logs from bridge REST endpoint
      fetch('http://127.0.0.1:5050/api/logs')
        .then(r => r.json())
        .then(d => {
          if (d && Array.isArray(d.logs)) {
            setLogs(d.logs.map(l => ({
              id: l.Id || Date.now(),
              time: l.Timestamp,
              type: l.Level || 'INFO',
              category: l.Category || 'SYSTEM',
              message: l.Message,
              details: l.Details
            })).reverse());
          }
        })
        .catch(() => {});
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        handleBridgeMessage(data);
      } catch (err) {
        console.warn('[NANOPIX WS] Non-JSON message received:', event.data);
      }
    };

    ws.onerror = () => {
      // Quiet failover; onclose will schedule reconnection
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      setBridgeOnline(false);
      setDeviceConnected(false);
      setDeviceStatus('OFFLINE');
      setIsArmed(false);
      scheduleReconnect();
    };
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const delay = backoffDelayRef.current;
    backoffDelayRef.current = Math.min(delay * 1.5, 8000); // Exponential backoff capped at 8s

    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  }, [connectWebSocket]);

  // Handle incoming typed WebSocket events from FpdSysBridgeService
  const handleBridgeMessage = useCallback((msg) => {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'DEVICE_STATUS': {
        setDeviceConnected(Boolean(msg.connected));
        if (msg.model) setDeviceModel(msg.model);
        if (msg.serial) setDeviceSerial(msg.serial);
        setDeviceStatus(msg.state || (msg.connected ? 'READY' : 'DISCONNECTED'));
        setIsArmed(Boolean(msg.isArmed));

        // Dispatch window event for other components in app
        if (msg.connected) {
          window.dispatchEvent(new CustomEvent('nanopix:connected', { detail: msg }));
        } else {
          window.dispatchEvent(new CustomEvent('nanopix:disconnected', { detail: msg }));
        }
        break;
      }

      case 'ARM_STATUS': {
        setIsArmed(Boolean(msg.armed));
        setDeviceStatus(msg.armed ? 'ARMED' : (deviceConnected ? 'READY' : 'DISCONNECTED'));
        break;
      }

      case 'EXPOSURE_DETECTED': {
        setDeviceStatus('CAPTURING');
        break;
      }

      case 'XRAY_CAPTURED': {
        console.log(
          '%c[FRONTEND RECEIVE - useNanoPixSensor.js] ⚡ Radiograph Received via WebSocket (ws://127.0.0.1:5050/ws)!',
          'background: #0284c7; color: white; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;',
          {
            patientId: msg.patientId || patientId,
            toothKey: msg.toothKey || toothKey,
            resolution: `${msg.width || 1300}x${msg.height || 1800}`,
            sensorSN: msg.sensorSN || deviceSerial,
            previewBase64Length: msg.previewBase64 ? msg.previewBase64.length : 0,
            encryptedPayloadLength: msg.encryptedPayload ? msg.encryptedPayload.length : 0,
            timestamp: msg.capturedAt || new Date().toISOString()
          }
        );

        playCaptureChime();
        setDeviceStatus('READY');
        setIsArmed(false);

        const capturedData = {
          previewBase64: msg.previewBase64,
          dataUrl: msg.previewBase64, // Normalized for components expecting dataUrl
          imageUrl: msg.previewBase64,
          encryptedPayload: msg.encryptedPayload,
          iv: msg.iv,
          tag: msg.tag,
          width: msg.width || 1300,
          height: msg.height || 1800,
          resolution: `${msg.width || 1300}x${msg.height || 1800}`,
          sensorSN: msg.sensorSN || deviceSerial,
          patientId: msg.patientId || patientId,
          toothKey: msg.toothKey || toothKey,
          doctorId: msg.doctorId || doctorId,
          capturedAt: msg.capturedAt || new Date().toISOString()
        };

        setLastCapturedImage(capturedData);
        setCaptureHistory((prev) => [capturedData, ...prev]);

        // Trigger callback
        if (typeof onCapture === 'function') {
          onCapture(capturedData);
        }

        // Global event dispatch for clinical tabs and chart
        console.log('%c[FRONTEND EVENT DISPATCH - useNanoPixSensor.js] 📡 Dispatching "nanopix:scan-acquired" event to ChartPage & Modal...', 'color: #0284c7; font-weight: bold;', capturedData);
        window.dispatchEvent(new CustomEvent('nanopix:scan-acquired', { detail: capturedData }));
        break;
      }

      case 'LOG': {
        if (msg.log) {
          setLogs((prev) => [
            {
              id: msg.log.Id || Date.now(),
              time: msg.log.Timestamp,
              type: msg.log.Level || 'INFO',
              category: msg.log.Category || 'SYSTEM',
              message: msg.log.Message,
              details: msg.log.Details
            },
            ...prev.slice(0, 150)
          ]);
        }
        break;
      }

      case 'ERROR': {
        console.warn('[FRONTEND RECEIVE - useNanoPixSensor.js] ❌ Bridge Error Message:', msg.message);
        setError(msg.message || 'An error occurred in hardware bridge.');
        break;
      }

      default:
        break;
    }
  }, [deviceConnected, deviceSerial, patientId, toothKey, doctorId, onCapture, playCaptureChime]);

  // Command: Arm sensor for active patient
  const armSensor = useCallback((targetPatientId = patientId, targetToothKey = toothKey, targetDoctorId = doctorId) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Dental Bridge is offline. Please ensure the local service is running on port 5050.');
      return false;
    }

    if (!targetPatientId || !targetToothKey) {
      setError('Patient ID and Tooth Key are required to arm the sensor. (No mock defaults allowed)');
      return false;
    }

    try {
      const armCommand = {
        command: 'ARM',
        patientId: Number(targetPatientId),
        toothKey: String(targetToothKey),
        doctorId: targetDoctorId ? Number(targetDoctorId) : null
      };
      console.log('%c[FRONTEND SEND - useNanoPixSensor.js] 📤 Sending ARM Command to DentalBridge (ws://127.0.0.1:5050/ws):', 'background: #7c3aed; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;', armCommand);
      socketRef.current.send(JSON.stringify(armCommand));
      setIsArmed(true);
      setDeviceStatus('ARMED');
      return true;
    } catch (err) {
      setError(`Failed to send arm command: ${err.message}`);
      return false;
    }
  }, [patientId, toothKey, doctorId]);

  // Command: Abort active arming
  const abortArming = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    try {
      console.log('%c[FRONTEND SEND - useNanoPixSensor.js] 📤 Sending ABORT Command to DentalBridge (ws://127.0.0.1:5050/ws)...', 'background: #f59e0b; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;');
      socketRef.current.send(JSON.stringify({ command: 'ABORT' }));
      setIsArmed(false);
      setDeviceStatus(deviceConnected ? 'READY' : 'DISCONNECTED');
    } catch (_) {}
  }, [deviceConnected]);

  // Command: Check hardware diagnostic status
  const checkDiagnostic = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    try {
      console.log('%c[FRONTEND SEND - useNanoPixSensor.js] 📤 Sending DIAGNOSTIC Ping to DentalBridge...', 'background: #6366f1; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;');
      socketRef.current.send(JSON.stringify({ command: 'DIAGNOSTIC' }));
    } catch (_) {}
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    fetch('http://127.0.0.1:5050/api/logs/clear', { method: 'POST' }).catch(() => {});
  }, []);

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    if (autoConnect) {
      connectWebSocket();
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [autoConnect, connectWebSocket]);

  return {
    bridgeOnline,
    deviceConnected,
    deviceStatus,
    deviceModel,
    deviceSerial,
    isArmed,
    lastCapturedImage,
    captureHistory,
    logs,
    clearLogs,
    error,
    armSensor,
    abortArming,
    checkDiagnostic,
    reconnect: connectWebSocket
  };
}

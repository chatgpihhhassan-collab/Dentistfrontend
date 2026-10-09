import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Production-ready React hook for direct WebSocket integration with the Eighteeth NanoPix C# Local Bridge.
 * Connects to ws://127.0.0.1:5050/ws with exponential backoff, real-time telemetry, and AED capture handling.
 */
export function useNanoPixSensor({
  patientId = null,
  toothKey = '19',
  doctorId = null,
  autoConnect = true,
  onCapture = null
} = {}) {
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('OFFLINE'); // OFFLINE, DISCONNECTED, READY, ARMED, CAPTURING
  const [deviceModel, setDeviceModel] = useState('Eighteeth NanoPix 1.5/2');
  const [deviceSerial, setDeviceSerial] = useState('iRayC7DB5M40P4');
  const [isArmed, setIsArmed] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState(null);
  const [captureHistory, setCaptureHistory] = useState([]);
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
        playCaptureChime();
        setDeviceStatus('READY');
        setIsArmed(false);

        const capturedData = {
          previewBase64: msg.previewBase64,
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
        window.dispatchEvent(new CustomEvent('nanopix:scan-acquired', { detail: capturedData }));
        break;
      }

      case 'ERROR': {
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

    try {
      socketRef.current.send(JSON.stringify({
        command: 'ARM',
        patientId: Number(targetPatientId) || 46,
        toothKey: String(targetToothKey || '19'),
        doctorId: targetDoctorId ? Number(targetDoctorId) : null
      }));
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
      socketRef.current.send(JSON.stringify({ command: 'ABORT' }));
      setIsArmed(false);
      setDeviceStatus(deviceConnected ? 'READY' : 'DISCONNECTED');
    } catch (_) {}
  }, [deviceConnected]);

  // Command: Check hardware diagnostic status
  const checkDiagnostic = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    try {
      socketRef.current.send(JSON.stringify({ command: 'DIAGNOSTIC' }));
    } catch (_) {}
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
    error,
    armSensor,
    abortArming,
    checkDiagnostic,
    reconnect: connectWebSocket
  };
}

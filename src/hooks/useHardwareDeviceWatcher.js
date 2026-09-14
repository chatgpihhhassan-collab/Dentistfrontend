import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that monitors physical USB / UVC / Sensor device connections in real-time.
 * Automatically triggers when a clinician plugs/unplugs an intraoral camera or X-ray device into their laptop.
 */
export const useHardwareDeviceWatcher = () => {
  const [deviceState, setDeviceState] = useState({
    isConnected: false,
    deviceName: 'No Chairside Device',
    deviceBrand: 'None',
    deviceType: 'none', // 'intraoral_camera' | 'rvg_sensor' | 'webcam' | 'none'
    deviceList: [],
    status: 'idle', // 'idle' | 'ready' | 'syncing'
    lastSyncTime: null,
  });

  const scanDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');

      if (videoInputs.length === 0) {
        setDeviceState((prev) => ({
          ...prev,
          isConnected: false,
          deviceName: 'No Video Devices Found',
          deviceBrand: 'None',
          deviceType: 'none',
          deviceList: [],
          status: 'idle',
        }));
        return;
      }

      // 1. Detect Clinical Intraoral Devices
      let detectedBrand = 'Generic';
      let detectedType = 'webcam';
      let bestDevice = videoInputs[0];

      for (const dev of videoInputs) {
        const label = (dev.label || '').toLowerCase();
        if (label.includes('apple dental')) {
          detectedBrand = 'Apple Dental';
          detectedType = 'intraoral_camera';
          bestDevice = dev;
          break;
        } else if (label.includes('coxo')) {
          detectedBrand = 'Coxo';
          detectedType = 'intraoral_camera';
          bestDevice = dev;
          break;
        } else if (label.includes('magenta')) {
          detectedBrand = 'Magenta';
          detectedType = 'intraoral_camera';
          bestDevice = dev;
          break;
        } else if (label.includes('intraoral') || label.includes('dental') || label.includes('mouth')) {
          detectedBrand = 'Intraoral HD';
          detectedType = 'intraoral_camera';
          bestDevice = dev;
          break;
        } else if (label.includes('uvc') || label.includes('camera') || label.includes('usb')) {
          detectedBrand = 'UVC Chairside';
          detectedType = 'intraoral_camera';
          bestDevice = dev;
        }
      }

      const displayName = bestDevice.label || `USB Video Device (${bestDevice.deviceId.slice(0, 6)})`;

      console.log(`[HARDWARE SYNC LOG] Chairside Device Detected: ${detectedBrand} - ${displayName}`);

      setDeviceState({
        isConnected: true,
        deviceName: displayName,
        deviceBrand: detectedBrand,
        deviceType: detectedType,
        deviceList: videoInputs,
        status: 'ready',
        lastSyncTime: new Date(),
      });
    } catch (err) {
      console.warn('[HARDWARE SYNC ERROR] Device enumeration notice:', err.message);
    }
  }, []);

  useEffect(() => {
    // Initial scan on mount
    scanDevices();

    // Listen to real-time USB plug/unplug events
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      const handleDeviceChange = () => {
        console.log('[HARDWARE SYNC EVENT] USB Device Plug/Unplug event detected on laptop!');
        scanDevices();
      };

      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [scanDevices]);

  return { ...deviceState, refreshDevices: scanDevices };
};

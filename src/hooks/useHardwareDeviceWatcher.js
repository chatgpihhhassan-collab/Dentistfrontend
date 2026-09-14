import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that monitors physical USB / UVC / Dental Sensor connections in real-time.
 * Accurately distinguishes between built-in laptop webcams and external chairside USB cameras/sensors.
 */
export const useHardwareDeviceWatcher = () => {
  const [deviceState, setDeviceState] = useState({
    isConnected: false,
    deviceName: 'No Dental USB Attached',
    deviceBrand: 'None',
    deviceType: 'none', // 'intraoral_camera' | 'rvg_sensor' | 'built_in_webcam' | 'none'
    deviceList: [],
    hasBuiltInCamera: false,
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
        setDeviceState({
          isConnected: false,
          deviceName: 'No Video Devices Found',
          deviceBrand: 'None',
          deviceType: 'none',
          deviceList: [],
          hasBuiltInCamera: false,
          status: 'idle',
          lastSyncTime: new Date(),
        });
        return;
      }

      // Keywords identifying built-in / integrated laptop webcams
      const builtInKeywords = [
        'integrated',
        'internal',
        'built-in',
        'facetime',
        'front',
        'truevision',
        'realtek',
        'bisoncam',
        'chicony',
        'sunplus',
        'easycamera',
      ];

      // Explicit dental hardware signatures
      const dentalSignatures = [
        { key: 'apple dental', brand: 'Apple Dental', type: 'intraoral_camera' },
        { key: 'coxo', brand: 'Coxo', type: 'intraoral_camera' },
        { key: 'magenta', brand: 'Magenta', type: 'intraoral_camera' },
        { key: 'intraoral', brand: 'Intraoral HD', type: 'intraoral_camera' },
        { key: 'dental', brand: 'Dental Cam', type: 'intraoral_camera' },
        { key: 'mouth', brand: 'Oral Vision', type: 'intraoral_camera' },
        { key: 'endoscope', brand: 'Endoscope Pro', type: 'intraoral_camera' },
        { key: 'rvg', brand: 'RVG Sensor', type: 'rvg_sensor' },
        { key: 'sensor', brand: 'Digital Sensor', type: 'rvg_sensor' },
        { key: 'carestream', brand: 'Carestream CS', type: 'intraoral_camera' },
        { key: 'dentsply', brand: 'Dentsply Sirona', type: 'intraoral_camera' },
        { key: 'acteon', brand: 'Acteon SOPRO', type: 'intraoral_camera' },
        { key: 'woodpecker', brand: 'Woodpecker', type: 'intraoral_camera' },
      ];

      let externalDentalDevice = null;
      let detectedBrand = 'Generic USB';
      let detectedType = 'intraoral_camera';
      let builtInCount = 0;

      for (const dev of videoInputs) {
        const label = (dev.label || '').toLowerCase();

        // 1. Check for known dental brand signatures
        const matchedSig = dentalSignatures.find((sig) => label.includes(sig.key));
        if (matchedSig) {
          externalDentalDevice = dev;
          detectedBrand = matchedSig.brand;
          detectedType = matchedSig.type;
          break;
        }

        // 2. Check if it's an internal built-in camera
        const isBuiltIn = builtInKeywords.some((k) => label.includes(k));
        if (isBuiltIn) {
          builtInCount++;
        }
      }

      // If no explicit dental label matched, check if an external 2nd/3rd USB camera is attached
      if (!externalDentalDevice && videoInputs.length > 1) {
        // Find the device that is NOT the primary built-in camera
        const secondary = videoInputs.find((d) => {
          const l = (d.label || '').toLowerCase();
          return !builtInKeywords.some((k) => l.includes(k));
        }) || videoInputs[videoInputs.length - 1];

        externalDentalDevice = secondary;
        detectedBrand = 'USB Dental/UVC';
        detectedType = 'intraoral_camera';
      }

      // If we found a real external chairside camera:
      if (externalDentalDevice) {
        const displayName = externalDentalDevice.label || `External USB Device (${externalDentalDevice.deviceId.slice(0, 6)})`;
        console.log(`[HARDWARE SYNC LOG] Dedicated Chairside Device Connected: ${detectedBrand} - ${displayName}`);

        setDeviceState({
          isConnected: true,
          deviceName: displayName,
          deviceBrand: detectedBrand,
          deviceType: detectedType,
          deviceList: videoInputs,
          hasBuiltInCamera: videoInputs.length > 1 || builtInCount > 0,
          status: 'ready',
          lastSyncTime: new Date(),
        });
      } else {
        // Only laptop's built-in webcam is present (or no camera permission granted yet with 1 device)
        const primaryDev = videoInputs[0];
        const primaryLabel = primaryDev.label || 'Laptop Built-in Webcam';

        console.log(`[HARDWARE SYNC LOG] Standby: Built-in laptop webcam detected (${primaryLabel}). No external dental USB attached.`);

        setDeviceState({
          isConnected: false, // NOT connected to a chairside dental device
          deviceName: primaryLabel,
          deviceBrand: 'Built-in Webcam (Standby)',
          deviceType: 'built_in_webcam',
          deviceList: videoInputs,
          hasBuiltInCamera: true,
          status: 'idle',
          lastSyncTime: new Date(),
        });
      }
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

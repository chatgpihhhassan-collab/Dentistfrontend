import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, RefreshCw, AlertCircle, Sparkles, X, StopCircle } from 'lucide-react';

export const CameraCapturePanel = ({ patientId, toothKey = null, onUploadSuccess, onClose }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({ brand: 'UVC Camera', model: 'Intraoral' });
  const [stream, setStream] = useState(null);
  const [mode, setMode] = useState('photo'); // 'photo' | 'video'
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // 1. Scan & Smart Brand Autodetection
  useEffect(() => {
    async function initDevices() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);

        if (videoDevs.length > 0) {
          const clinicalDev = videoDevs.find((d) => {
            const label = d.label.toLowerCase();
            return (
              label.includes('apple dental') ||
              label.includes('coxo') ||
              label.includes('magenta') ||
              label.includes('intraoral') ||
              label.includes('uvc camera')
            );
          });

          const chosen = clinicalDev || videoDevs[0];
          setSelectedDeviceId(chosen.deviceId);
          parseDeviceBrandModel(chosen.label);
        } else {
          setErrorMsg('No video capture devices or intraoral cameras detected.');
        }
      } catch (err) {
        setErrorMsg('Camera permission denied or device inaccessible.');
      }
    }
    initDevices();
  }, []);

  const parseDeviceBrandModel = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('apple dental')) setDeviceInfo({ brand: 'Apple Dental', model: 'HD Intraoral' });
    else if (l.includes('coxo')) setDeviceInfo({ brand: 'Coxo', model: 'C-Smart UVC' });
    else if (l.includes('magenta')) setDeviceInfo({ brand: 'Magenta', model: 'MD-960U' });
    else setDeviceInfo({ brand: 'Generic UVC', model: label || 'Intraoral Camera' });
  };

  // 2. Start Video Stream
  useEffect(() => {
    if (!selectedDeviceId) return;

    let currentStream = null;
    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((s) => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        setErrorMsg(null);
      })
      .catch((err) => {
        setErrorMsg('Failed to open camera stream: ' + err.message);
      });

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId]);

  // 3. Capture Photo Frame
  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedDataUrl(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.95);
  };

  // 4. Record Video Clip (Max 20s)
  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setCapturedBlob(blob);
      setCapturedDataUrl(URL.createObjectURL(blob));
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    };

    recorder.start();
    setIsRecording(true);
    setRecordTimer(0);

    timerIntervalRef.current = setInterval(() => {
      setRecordTimer((prev) => {
        if (prev >= 20) {
          recorder.stop();
          return 20;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // 5. Confirm & Upload
  const handleUpload = async () => {
    if (!capturedBlob) return;
    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('File', capturedBlob, mode === 'photo' ? 'capture.jpg' : 'capture.webm');
    formData.append('PatientId', patientId);
    if (toothKey) formData.append('ToothKey', toothKey);
    formData.append('Modality', mode === 'photo' ? 'intraoral_photo' : 'intraoral_video');
    formData.append('SourceDeviceType', 'intraoral_camera');
    formData.append('SourceDeviceBrand', deviceInfo.brand);
    formData.append('SourceDeviceModel', deviceInfo.model);
    formData.append('AutoAnalyze', 'true');

    try {
      const res = await fetch('/api/imaging/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload returned status ${res.status}`);
      const data = await res.json();
      setIsUploading(false);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      setIsUploading(false);
      setErrorMsg('Failed to upload image to AI pipeline: ' + err.message);
    }
  };

  return (
    <div className="bg-[#F2F7F6] border border-[#D1E3E0] rounded-2xl p-6 shadow-xl max-w-2xl mx-auto text-[#0F2F2C]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D1E3E0]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0B4F4A] text-white rounded-xl shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#0B4F4A]">Chairside Intraoral Capture</h3>
            <p className="text-xs text-teal-700">Auto-detected: <span className="font-semibold">{deviceInfo.brand} {deviceInfo.model}</span></p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Device Selector */}
      <div className="mt-4 flex gap-3">
        <select
          value={selectedDeviceId}
          onChange={(e) => {
            setSelectedDeviceId(e.target.value);
            const dev = devices.find((d) => d.deviceId === e.target.value);
            if (dev) parseDeviceBrandModel(dev.label);
          }}
          className="flex-1 bg-white border border-[#D1E3E0] rounded-xl px-3 py-2 text-xs text-[#0F2F2C] focus:outline-none focus:ring-2 focus:ring-[#4FB3A9]"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera (${d.deviceId.slice(0, 8)})`}
            </option>
          ))}
        </select>

        <div className="flex bg-white rounded-xl border border-[#D1E3E0] p-1">
          <button
            onClick={() => { setMode('photo'); setCapturedBlob(null); setCapturedDataUrl(null); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${mode === 'photo' ? 'bg-[#0B4F4A] text-white shadow-sm' : 'text-gray-600'}`}
          >
            Photo
          </button>
          <button
            onClick={() => { setMode('video'); setCapturedBlob(null); setCapturedDataUrl(null); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${mode === 'video' ? 'bg-[#0B4F4A] text-white shadow-sm' : 'text-gray-600'}`}
          >
            Video
          </button>
        </div>
      </div>

      {/* Camera Live View / Preview Box */}
      <div className="mt-4 relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
        {errorMsg ? (
          <div className="p-6 text-center text-red-300">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        ) : capturedDataUrl ? (
          mode === 'photo' ? (
            <img src={capturedDataUrl} alt="Captured preview" className="w-full h-full object-contain" />
          ) : (
            <video src={capturedDataUrl} controls className="w-full h-full object-contain" />
          )
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white"></span> REC {recordTimer}s / 20s
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Actions */}
      <div className="mt-5 flex items-center justify-between">
        {capturedBlob ? (
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => { setCapturedBlob(null); setCapturedDataUrl(null); }}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-white text-gray-700 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 py-2.5 bg-[#0B4F4A] hover:bg-[#083c38] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#E8934A]" />}
              {isUploading ? 'Analyzing with Groq...' : 'Confirm & Run AI Analysis'}
            </button>
          </div>
        ) : mode === 'photo' ? (
          <button
            onClick={takePhoto}
            className="w-full py-3 bg-[#0B4F4A] hover:bg-[#083c38] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-xs"
          >
            <Camera className="w-4 h-4" /> Snap Photo
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-xs ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0B4F4A] hover:bg-[#083c38]'
            }`}
          >
            {isRecording ? <StopCircle className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start 20s Clip'}
          </button>
        )}
      </div>
    </div>
  );
};

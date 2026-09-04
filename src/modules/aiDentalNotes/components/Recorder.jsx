import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, StopCircle, Mic, Loader2 } from 'lucide-react';

const Recorder = ({ onRecordingComplete, onTranscriptChange }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        // Initialize Web Speech API for fallback demo purposes
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript + ' ';
                }
                setTranscript(currentTranscript);
                if (onTranscriptChange) onTranscriptChange(currentTranscript);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startRecording = () => {
        setIsRecording(true);
        setTimer(0);
        setTranscript('');
        
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch(e) {
                console.error("Speech recognition error:", e);
            }
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        // Pass the transcript (or audio blob) back to parent
        if (onRecordingComplete) {
            onRecordingComplete(transcript);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-blue-50 text-blue-500'}`}>
                <Mic size={32} />
            </div>
            
            <div className="text-3xl font-mono font-light text-gray-700">
                {formatTime(timer)}
            </div>
            
            <div className="flex gap-4">
                {!isRecording ? (
                    <button 
                        onClick={startRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <PlayCircle size={20} />
                        Start Recording
                    </button>
                ) : (
                    <button 
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm"
                    >
                        <StopCircle size={20} />
                        Stop & Process
                    </button>
                )}
            </div>

            {transcript && (
                <div className="w-full mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">
                    <div className="font-semibold text-gray-500 mb-2 text-xs uppercase tracking-wider">Live Transcript</div>
                    <p className="italic">{transcript}</p>
                </div>
            )}
        </div>
    );
};

export default Recorder;

/**
 * AI Clinical Voice Assistant Utility
 * Provides spoken voice guidance to doctors when validation errors or incorrect entries occur.
 */

class AIVoiceAssistant {
    constructor() {
        this.enabled = true;
        try {
            const stored = localStorage.getItem('dentia_ai_voice_enabled');
            if (stored !== null) {
                this.enabled = stored === 'true';
            }
        } catch (e) {
            this.enabled = true;
        }
        this.speaking = false;
        this.currentText = '';
        this.listeners = new Set();
    }

    isSupported() {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }

    isEnabled() {
        return this.enabled;
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    toggleMute() {
        return this.toggle();
    }

    cancel() {
        this.stop();
    }

    setEnabled(val) {
        this.enabled = Boolean(val);
        if (!this.enabled) {
            this.stop();
        }
        try {
            localStorage.setItem('dentia_ai_voice_enabled', String(this.enabled));
        } catch (e) {}
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        // Call immediately with current state
        listener({
            enabled: this.enabled,
            speaking: this.speaking,
            currentText: this.currentText
        });
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        const state = {
            enabled: this.enabled,
            speaking: this.speaking,
            currentText: this.currentText
        };
        this.listeners.forEach(fn => {
            try {
                fn(state);
            } catch (e) {
                console.error('[AIVoiceAssistant] Listener error:', e);
            }
        });
    }

    stop() {
        if (!this.isSupported()) return;
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}
        this.speaking = false;
        this.currentText = '';
        this.notifyListeners();
    }

    /**
     * Play subtle clinical chime via Web Audio API (Zero external assets needed)
     */
    playChime(type = 'wake') {
        if (typeof window === 'undefined') return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            gain.connect(ctx.destination);
            osc.connect(gain);

            const now = ctx.currentTime;
            if (type === 'wake') {
                // Rising two-tone pleasant chime (523Hz C5 -> 659Hz E5)
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'sleep') {
                // Descending gentle tone (659Hz E5 -> 440Hz A4)
                osc.frequency.setValueAtTime(659.25, now);
                osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.15);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'success') {
                // Subtle bright triple-tone confirmation
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880.0, now + 0.08); // A5
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
            }
        } catch (e) {
            // Audio context silently ignored if blocked by autoplay policies
        }
    }

    /**
     * Speak text using Web Speech Synthesis API with dedicated Lady/Female Voice Persona
     */
    speak(text, { rate = 1.02, pitch = 1.08 } = {}) {
        if (!this.isSupported() || !this.enabled || !text) return;

        try {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;

            // Pick a clean, professional, natural female/lady voice
            const voices = window.speechSynthesis.getVoices() || [];
            
            // Priority list of premium female voices across Windows, Mac, Chrome & Edge
            const femaleKeywords = [
                'jenny', 'zira', 'samantha', 'karen', 'victoria', 
                'female', 'woman', 'heera', 'neerja', 'aria', 'google uk english female'
            ];

            let preferredVoice = voices.find(v => {
                const nameLower = v.name.toLowerCase();
                return v.lang.startsWith('en') && femaleKeywords.some(kw => nameLower.includes(kw));
            });

            // Fallback to any natural or English voice if specific female named voice not found
            if (!preferredVoice) {
                preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
            }
            if (!preferredVoice) {
                preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            }

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            this.speaking = true;
            this.currentText = text;
            this.notifyListeners();

            // Watchdog: In case Chrome SpeechSynthesis pauses or misses onend
            const maxDurationMs = Math.max(3000, Math.min(15000, text.length * 80));
            if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
            this.watchdogTimer = setTimeout(() => {
                if (this.speaking) {
                    console.log('[AIVoiceAssistant] Speech watchdog auto-cleared speaking lock');
                    this.speaking = false;
                    this.currentText = '';
                    this.notifyListeners();
                }
            }, maxDurationMs);

            utterance.onend = () => {
                if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
                this.speaking = false;
                this.currentText = '';
                this.notifyListeners();
            };

            utterance.onerror = (e) => {
                if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
                if (e.error !== 'canceled' && e.error !== 'interrupted') {
                    console.warn('[AIVoiceAssistant] Utterance error:', e);
                }
                this.speaking = false;
                this.currentText = '';
                this.notifyListeners();
            };

            window.speechSynthesis.speak(utterance);
        } catch (err) {
            if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
            console.warn('[AIVoiceAssistant] Speech error:', err);
            this.speaking = false;
            this.currentText = '';
            this.notifyListeners();
        }
    }

    /**
     * Alert the doctor when wrong entry or validation error occurs
     */
    speakDoctorError(fieldLabel, reason) {
        let msg = '';
        if (fieldLabel && reason) {
            msg = `Doctor, please check the ${fieldLabel}. ${reason}`;
        } else if (reason) {
            msg = `Doctor, ${reason}`;
        } else {
            msg = `Doctor, please check the required fields. Some entries are incomplete or invalid.`;
        }
        this.speak(msg);
        return msg;
    }

    /**
     * Announce success confirmation to the doctor
     */
    speakDoctorSuccess(message) {
        let msg = '';
        if (message) {
            msg = message.startsWith('Doctor') ? message : `Doctor, ${message}`;
        } else {
            msg = `Doctor, action completed successfully.`;
        }
        this.speak(msg);
        return msg;
    }
}

export const aiVoice = new AIVoiceAssistant();
export default aiVoice;

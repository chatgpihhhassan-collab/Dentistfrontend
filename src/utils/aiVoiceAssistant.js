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
     * Speak text using Web Speech Synthesis API
     */
    speak(text, { rate = 1.0, pitch = 1.05 } = {}) {
        if (!this.isSupported() || !this.enabled || !text) return;

        try {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;

            // Pick a clean, professional natural English voice if available
            const voices = window.speechSynthesis.getVoices() || [];
            const preferredVoice = voices.find(v => 
                v.lang.startsWith('en') && (
                    v.name.includes('Google') || 
                    v.name.includes('Natural') || 
                    v.name.includes('Zira') || 
                    v.name.includes('Samantha') || 
                    v.name.includes('Karen') || 
                    v.name.includes('Jenny')
                )
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            this.speaking = true;
            this.currentText = text;
            this.notifyListeners();

            utterance.onend = () => {
                this.speaking = false;
                this.currentText = '';
                this.notifyListeners();
            };

            utterance.onerror = (e) => {
                // Ignore cancel errors
                if (e.error !== 'canceled' && e.error !== 'interrupted') {
                    console.warn('[AIVoiceAssistant] Utterance error:', e);
                }
                this.speaking = false;
                this.currentText = '';
                this.notifyListeners();
            };

            window.speechSynthesis.speak(utterance);
        } catch (err) {
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
}

export const aiVoice = new AIVoiceAssistant();
export default aiVoice;

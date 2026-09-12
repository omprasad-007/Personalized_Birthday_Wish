/**
 * SoundEngine - Pure Web Audio API Synthesizer & SFX Engine
 * Zero external audio file dependencies - 100% reliable offline & online.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.masterVolume = 0.6;
        this.musicGain = null;
        this.sfxGain = null;
        this.melodyTimeout = null;
        this.currentNoteIndex = 0;
        this.isMelodyLooping = false;
        
        // Notes frequency table in Hz
        this.notes = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77, 'C6': 1046.50
        };

        // Happy Birthday Melodic Sequence [note, duration in seconds, pause] - Fast & Upbeat
        this.birthdayMelody = [
            // Phrase 1: "Happy Birthday to you"
            ['G4', 0.20, 0.02], ['G4', 0.18, 0.03], ['A4', 0.36, 0.04], ['G4', 0.36, 0.04], ['C5', 0.38, 0.04], ['B4', 0.65, 0.12],
            // Phrase 2: "Happy Birthday to you"
            ['G4', 0.20, 0.02], ['G4', 0.18, 0.03], ['A4', 0.36, 0.04], ['G4', 0.36, 0.04], ['D5', 0.38, 0.04], ['C5', 0.65, 0.12],
            // Phrase 3: "Happy Birthday dear friend"
            ['G4', 0.20, 0.02], ['G4', 0.18, 0.03], ['G5', 0.42, 0.04], ['E5', 0.36, 0.04], ['C5', 0.36, 0.04], ['B4', 0.36, 0.04], ['A4', 0.68, 0.14],
            // Phrase 4: "Happy Birthday to you!"
            ['F5', 0.20, 0.02], ['F5', 0.18, 0.03], ['E5', 0.40, 0.04], ['C5', 0.36, 0.04], ['D5', 0.38, 0.04], ['C5', 0.85, 0.22]
        ];
        this.wasPlayingBeforeLeave = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    startMusic() {
        this.init();
        if (this.isMelodyLooping) return;
        this.isMelodyLooping = true;
        this.isPlaying = true;
        this.playMelodyStep(this.currentNoteIndex || 0);
    }

    stopMusic() {
        this.isMelodyLooping = false;
        this.isPlaying = false;
        this.wasPlayingBeforeLeave = false;
        if (this.melodyTimeout) {
            clearTimeout(this.melodyTimeout);
            this.melodyTimeout = null;
        }
        if (this.ctx && this.ctx.state === 'running') {
            try {
                this.ctx.suspend();
            } catch(e) {}
        }
    }

    pauseMusic() {
        if (this.isPlaying || this.isMelodyLooping) {
            this.wasPlayingBeforeLeave = true;
            this.isMelodyLooping = false;
            this.isPlaying = false;
            if (this.melodyTimeout) {
                clearTimeout(this.melodyTimeout);
                this.melodyTimeout = null;
            }
            if (this.ctx && this.ctx.state === 'running') {
                try {
                    this.ctx.suspend();
                } catch(e) {}
            }
        }
    }

    resumeMusic() {
        if (this.wasPlayingBeforeLeave && !this.isMuted) {
            this.wasPlayingBeforeLeave = false;
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.startMusic();
        }
    }

    playMelodyStep(index) {
        if (!this.isMelodyLooping || !this.ctx) return;
        
        this.currentNoteIndex = index;
        const step = this.birthdayMelody[index];
        const note = step[0];
        const duration = step[1];
        const pause = step[2];
        const freq = this.notes[note];

        this.playChimeNote(freq, duration);

        const nextIndex = (index + 1) % this.birthdayMelody.length;
        const totalDelay = (duration + pause) * 1000;

        this.melodyTimeout = setTimeout(() => {
            this.playMelodyStep(nextIndex);
        }, totalDelay);
    }

    playChimeNote(freq, duration) {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;

        // Warm Celesta / Music Box synth voice
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, t); // Octave overtone

        // Soft bell envelope
        noteGain.gain.setValueAtTime(0.001, t);
        noteGain.gain.linearRampToValueAtTime(0.35, t + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(this.musicGain);

        osc.start(t);
        osc2.start(t);
        osc.stop(t + duration);
        osc2.stop(t + duration);
    }

    // SFX: Confetti Cannon Pop
    playPop() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.13);
    }

    // SFX: Sparkle / Star Chime
    playSparkle() {
        this.init();
        if (this.isMuted) return;
        const notes = [this.notes['C5'], this.notes['E5'], this.notes['G5'], this.notes['C6']];
        notes.forEach((freq, idx) => {
            const t = this.ctx.currentTime + (idx * 0.06);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.36);
        });
    }

    // SFX: Candle Blow Whoosh + Extinguish
    playBlow() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        // Noise buffer for realistic air breath
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter for breathy sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.5);
        filter.Q.setValueAtTime(2.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.45, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.51);

        // Extinguish sparkle chime
        setTimeout(() => this.playSparkle(), 300);
    }

    // SFX: Envelope Wax Break & Open
    playEnvelopeOpen() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.26);

        setTimeout(() => this.playSparkle(), 150);
    }

    // SFX: Grand Celebration Fanfare
    playCelebrationFanfare() {
        this.init();
        if (this.isMuted) return;
        const chords = [
            [this.notes['C5'], this.notes['E5'], this.notes['G5']],
            [this.notes['F4'], this.notes['A4'], this.notes['C5']],
            [this.notes['G4'], this.notes['B4'], this.notes['D5']],
            [this.notes['C5'], this.notes['E5'], this.notes['G5'], this.notes['C6']]
        ];

        chords.forEach((chord, step) => {
            const t = this.ctx.currentTime + (step * 0.22);
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.001, t);
                gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(t);
                osc.stop(t + 0.56);
            });
        });
    }

    // SFX: Balloon Pop
    playBalloonPop() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.1);
    }
}

window.soundEngine = new SoundEngine();

// Auto-stop and pause background audio whenever the user leaves the tab or browser window
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (window.soundEngine) window.soundEngine.pauseMusic();
    } else {
        if (window.soundEngine) window.soundEngine.resumeMusic();
    }
});

// Stop audio completely when navigating away, refreshing, or closing the browser/tab
window.addEventListener('pagehide', () => {
    if (window.soundEngine) window.soundEngine.stopMusic();
});

window.addEventListener('beforeunload', () => {
    if (window.soundEngine) window.soundEngine.stopMusic();
});

// Mobile & Mac Safari User-Gesture Audio Unlock
const unlockWebAudioOnUserGesture = () => {
    if (window.soundEngine) {
        if (!window.soundEngine.ctx) {
            window.soundEngine.init();
        } else if (window.soundEngine.ctx.state === 'suspended') {
            window.soundEngine.ctx.resume();
        }
    }
    ['click', 'touchstart', 'touchend', 'pointerdown'].forEach(ev => {
        document.removeEventListener(ev, unlockWebAudioOnUserGesture);
    });
};

['click', 'touchstart', 'touchend', 'pointerdown'].forEach(ev => {
    document.addEventListener(ev, unlockWebAudioOnUserGesture, { passive: true, once: true });
});


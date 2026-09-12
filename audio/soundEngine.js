/**
 * SoundEngine - Premium Web Audio API Synthesizer & Music Arranger
 * Pure Web Audio API - Zero external audio file dependencies.
 * Features:
 * - Precise hardware-clock lookahead audio scheduling (zero jitter / drift)
 * - Rich dual-layer Celesta/Music Box melody + gentle acoustic harmony chords
 * - 3/4 Waltz Happy Birthday arrangement with natural musical timing
 * - Anti-clipping master dynamics limiter
 * - Mobile & Safari gesture auto-unlock and seamless looping
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.masterVolume = 0.55;
        
        // Gains and nodes
        this.masterGain = null;
        this.musicGain = null;
        this.harmonyGain = null;
        this.sfxGain = null;
        this.compressor = null;

        // Scheduler state
        this.schedulerInterval = null;
        this.currentStep = 0;
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.25; // Schedule 250ms in advance
        this.lookaheadIntervalMs = 50;  // Run scheduler loop every 50ms
        this.tempoBPM = 108;            // Sweet, joyful tempo (~0.55s per quarter note beat)
        this.beatDuration = 60 / this.tempoBPM;
        this.wasPlayingBeforeLeave = false;

        // Frequencies table (Hz)
        this.notes = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
            'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98
        };

        // Standard Happy Birthday Song Sequence in C Major (3/4 time signature)
        // Each entry: [melodyNote, durationInBeats, stepAdvanceBeats, optionalChordNotes]
        this.score = [
            // Phrase 1: "Happy Birthday to you"
            ['G4', 0.70, 0.75, ['C3', 'G3']],          // Hap-
            ['G4', 0.25, 0.25, null],                  // py
            ['A4', 0.90, 1.00, ['C3', 'E4', 'G4']],    // Birth-
            ['G4', 0.90, 1.00, null],                  // day
            ['C5', 0.90, 1.00, ['C3', 'G3', 'C4']],    // to
            ['B4', 1.80, 2.00, ['G3', 'D4', 'G4']],    // you

            // Phrase 2: "Happy Birthday to you"
            ['G4', 0.70, 0.75, ['G3', 'D4']],          // Hap-
            ['G4', 0.25, 0.25, null],                  // py
            ['A4', 0.90, 1.00, ['G3', 'D4', 'B4']],    // Birth-
            ['G4', 0.90, 1.00, null],                  // day
            ['D5', 0.90, 1.00, ['G3', 'B4', 'D5']],    // to
            ['C5', 1.80, 2.00, ['C3', 'E4', 'G4']],    // you

            // Phrase 3: "Happy Birthday dear friend"
            ['G4', 0.70, 0.75, ['C3', 'G3']],          // Hap-
            ['G4', 0.25, 0.25, null],                  // py
            ['G5', 0.90, 1.00, ['C3', 'E4', 'G4']],    // Birth-
            ['E5', 0.90, 1.00, null],                  // day
            ['C5', 0.90, 1.00, ['F3', 'A3', 'C4']],    // dear
            ['B4', 0.90, 1.00, ['F3', 'A3', 'D4']],    // [Friend]
            ['A4', 1.80, 2.00, ['F3', 'C4', 'F4']],    // [Name]

            // Phrase 4: "Happy Birthday to you!"
            ['F5', 0.70, 0.75, ['F3', 'A3']],          // Hap-
            ['F5', 0.25, 0.25, null],                  // py
            ['E5', 0.90, 1.00, ['C3', 'G3', 'E4']],    // Birth-
            ['C5', 0.90, 1.00, null],                  // day
            ['D5', 0.90, 1.00, ['G3', 'D4', 'B4']],    // to
            ['C5', 2.40, 2.80, ['C3', 'G3', 'C4', 'E4']] // you! ✨
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();

            // Dynamics compressor for warm, master-grade sound without distortion
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);
            this.compressor.connect(this.ctx.destination);

            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.compressor);

            // Melody Gain
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            // Harmony Chords Gain
            this.harmonyGain = this.ctx.createGain();
            this.harmonyGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
            this.harmonyGain.connect(this.masterGain);

            // SFX Gain
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            const target = this.isMuted ? 0.0001 : this.masterVolume;
            this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
        }
        if (!this.isMuted && !this.isPlaying) {
            this.startMusic();
        }
        this.updateAudioHUDState();
        return this.isMuted;
    }

    updateAudioHUDState() {
        const audioToggle = document.getElementById('audio-toggle');
        const audioStatusText = document.getElementById('audio-status-text');
        if (audioToggle) {
            audioToggle.classList.toggle('muted', this.isMuted || !this.isPlaying);
        }
        if (audioStatusText) {
            audioStatusText.textContent = (this.isMuted || !this.isPlaying) ? 'Music OFF' : 'Music ON';
        }
    }

    startMusic() {
        this.init();
        if (this.isMuted) {
            this.isMuted = false;
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
            }
        }
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.08;

        // Launch lookahead scheduler loop
        if (this.schedulerInterval) clearInterval(this.schedulerInterval);
        this.schedulerInterval = setInterval(() => this.scheduleEvents(), this.lookaheadIntervalMs);
        this.updateAudioHUDState();
    }

    scheduleEvents() {
        if (!this.isPlaying || !this.ctx) return;

        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            const stepData = this.score[this.currentStep];
            const noteName = stepData[0];
            const durationBeats = stepData[1];
            const advanceBeats = stepData[2];
            const chordNotes = stepData[3];

            const noteDurationSec = durationBeats * this.beatDuration;
            const advanceSec = advanceBeats * this.beatDuration;

            // Play Lead Celesta Note
            if (noteName && this.notes[noteName]) {
                this.playCelestaNote(this.notes[noteName], this.nextNoteTime, noteDurationSec);
            }

            // Play Soft Harmony Chord if present
            if (chordNotes && Array.isArray(chordNotes)) {
                chordNotes.forEach((cNote) => {
                    if (this.notes[cNote]) {
                        this.playWarmPadNote(this.notes[cNote], this.nextNoteTime, noteDurationSec * 1.25);
                    }
                });
            }

            this.nextNoteTime += advanceSec;
            this.currentStep++;

            // Loop smoothly back to beginning with pleasant breathing room
            if (this.currentStep >= this.score.length) {
                this.currentStep = 0;
                this.nextNoteTime += 0.8; // 800ms natural rest between repetitions
            }
        }
    }

    playCelestaNote(freq, startTime, duration) {
        if (!this.ctx || !this.musicGain) return;

        // Voice 1: Pure fundamental
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, startTime);

        // Voice 2: Warm body with slight detune chorus
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.002, startTime);

        // Voice 3: Sparkling crystal chime overtone (2x octave chime)
        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 2, startTime);

        // Warm smoothing lowpass filter (removes any harsh digital bite)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, startTime);
        filter.Q.setValueAtTime(1.0, startTime);

        // Note Envelope
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.38, startTime + 0.018); // Soft attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Natural decay

        // Sparkle gain
        const sparkleGain = this.ctx.createGain();
        sparkleGain.gain.setValueAtTime(0.12, startTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(0.22, duration * 0.6));

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(sparkleGain);
        sparkleGain.connect(gainNode);

        gainNode.connect(filter);
        filter.connect(this.musicGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc3.start(startTime);

        const stopTime = startTime + duration + 0.05;
        osc1.stop(stopTime);
        osc2.stop(stopTime);
        osc3.stop(stopTime);
    }

    playWarmPadNote(freq, startTime, duration) {
        if (!this.ctx || !this.harmonyGain) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.harmonyGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    }

    stopMusic() {
        this.isPlaying = false;
        this.wasPlayingBeforeLeave = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        if (this.ctx && this.ctx.state === 'running') {
            try {
                this.ctx.suspend();
            } catch(e) {}
        }
        this.updateAudioHUDState();
    }

    pauseMusic() {
        if (this.isPlaying) {
            this.wasPlayingBeforeLeave = true;
            this.isPlaying = false;
            if (this.schedulerInterval) {
                clearInterval(this.schedulerInterval);
                this.schedulerInterval = null;
            }
            if (this.ctx && this.ctx.state === 'running') {
                try {
                    this.ctx.suspend();
                } catch(e) {}
            }
            this.updateAudioHUDState();
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

    // =========================================================================
    // SOUND EFFECTS (SFX)
    // =========================================================================

    // SFX: Confetti Cannon Pop
    playPop() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.14);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    // SFX: Celestial Sparkle / Star Chime
    playSparkle() {
        this.init();
        if (this.isMuted) return;
        const chimeNotes = [this.notes['C5'], this.notes['E5'], this.notes['G5'], this.notes['B5'], this.notes['C6']];
        chimeNotes.forEach((freq, idx) => {
            const t = this.ctx.currentTime + (idx * 0.05);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.42);
        });
    }

    // SFX: Candle Blow Whoosh + Extinguish
    playBlow() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.45);
        filter.Q.setValueAtTime(2.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.42, t + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.46);

        setTimeout(() => this.playSparkle(), 250);
    }

    // SFX: Envelope Wax Break & Open
    playEnvelopeOpen() {
        this.init();
        if (this.isMuted) return;
        const t = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.22;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.23);

        setTimeout(() => this.playSparkle(), 120);
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
            const t = this.ctx.currentTime + (step * 0.20);
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.001, t);
                gain.gain.linearRampToValueAtTime(0.22, t + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(t);
                osc.stop(t + 0.52);
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
        osc.frequency.setValueAtTime(540, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

        gain.gain.setValueAtTime(0.55, t);
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

// Mobile & Safari User-Gesture Audio Unlock and Auto-Start
const autoUnlockAndStartMusicOnGesture = () => {
    if (window.soundEngine) {
        if (!window.soundEngine.ctx) {
            window.soundEngine.init();
        } else if (window.soundEngine.ctx.state === 'suspended') {
            window.soundEngine.ctx.resume();
        }
        if (!window.soundEngine.isPlaying && !window.soundEngine.isMuted) {
            window.soundEngine.startMusic();
        }
    }
};

['click', 'touchstart', 'touchend', 'pointerdown'].forEach(ev => {
    document.addEventListener(ev, autoUnlockAndStartMusicOnGesture, { passive: true, once: true });
});

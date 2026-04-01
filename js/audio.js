// Procedural audio via Web Audio API — no audio files needed

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        this.ambientNodes = [];
        this.musicNodes = [];
        this.muted = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.35;
            this.masterGain.connect(this.ctx.destination);

            // Create a shared reverb via delay
            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.value = 0.15;
            this.reverbDelay = this.ctx.createDelay(0.5);
            this.reverbDelay.delayTime.value = 0.12;
            this.reverbFilter = this.ctx.createBiquadFilter();
            this.reverbFilter.type = 'lowpass';
            this.reverbFilter.frequency.value = 2000;
            this.reverbGain.connect(this.reverbDelay);
            this.reverbDelay.connect(this.reverbFilter);
            this.reverbFilter.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ── SFX ──

    slash() {
        if (!this.initialized) return;
        // Crisp metallic slash
        this._noise(0.06, 1200, 300, 0.12);
        this._sine(0.04, 600, 150, 0.06);
        this._square(0.02, 800, 400, 0.03);
    }

    hit() {
        if (!this.initialized) return;
        // Heavy impact thump + crunch
        this._sine(0.08, 60, 30, 0.25);
        this._sine(0.05, 120, 50, 0.15);
        this._noise(0.06, 800, 100, 0.12);
        this._noise(0.03, 2000, 500, 0.06);
    }

    dash() {
        if (!this.initialized) return;
        // Whooshing rush with rising tone
        this._sineSwoop(0.12, 150, 900, 0.08);
        this._noise(0.15, 3000, 800, 0.06);
        this._square(0.06, 200, 600, 0.03);
    }

    jump() {
        if (!this.initialized) return;
        // Quick ascending blip
        this._sineSwoop(0.05, 250, 550, 0.07);
        this._square(0.03, 300, 500, 0.02);
    }

    land() {
        if (!this.initialized) return;
        // Weighty thud
        this._sine(0.06, 80, 40, 0.12);
        this._noise(0.04, 300, 80, 0.06);
    }

    wallSlide() {
        if (!this.initialized) return;
        // Scraping grind
        this._noise(0.08, 1500, 400, 0.025);
    }

    deflect() {
        if (!this.initialized) return;
        // Metallic ring — detuned pair creates beat frequency
        this._sine(0.25, 440, 420, 0.1);
        this._sine(0.25, 443, 423, 0.1);
        this._sine(0.15, 880, 860, 0.05);
        this._noise(0.03, 3000, 1000, 0.08);
    }

    enemyDeath() {
        if (!this.initialized) return;
        // Descending splatter
        this._sineSwoop(0.2, 400, 40, 0.1);
        this._noise(0.12, 800, 80, 0.08);
        this._square(0.08, 200, 50, 0.04);
    }

    playerHurt() {
        if (!this.initialized) return;
        // Dissonant stab
        this._sine(0.25, 200, 185, 0.12);
        this._sine(0.25, 213, 198, 0.12);
        this._sine(0.15, 300, 280, 0.06);
        this._noise(0.06, 500, 100, 0.1);
    }

    playerDeath() {
        if (!this.initialized) return;
        // Long descending wail
        this._sineSwoop(0.5, 500, 25, 0.15);
        this._sine(0.6, 80, 30, 0.1);
        this._noise(0.3, 400, 50, 0.06);
    }

    timeSlowStart() {
        if (!this.initialized) return;
        // Deep warping drop
        this._sineSwoop(0.3, 250, 50, 0.08);
        this._sine(0.4, 55, 40, 0.06);
    }

    timeSlowEnd() {
        if (!this.initialized) return;
        this._sineSwoop(0.15, 60, 200, 0.06);
    }

    pickup() {
        if (!this.initialized) return;
        // Sparkly ascending arpeggio
        const t = this.ctx.currentTime;
        this._sineAt(t, 0.12, 440, 0.08);
        this._sineAt(t + 0.08, 0.12, 554, 0.08);
        this._sineAt(t + 0.16, 0.15, 659, 0.1);
        this._sineAt(t + 0.24, 0.2, 880, 0.06);
    }

    save() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        this._sineAt(t, 0.3, 330, 0.06);
        this._sineAt(t + 0.15, 0.3, 440, 0.06);
        this._sineAt(t + 0.3, 0.4, 550, 0.05);
    }

    bossDeath() {
        if (!this.initialized) return;
        this._sineSwoop(0.8, 600, 20, 0.2);
        this._noise(0.5, 1200, 40, 0.1);
        this._sine(0.6, 55, 30, 0.15);
        setTimeout(() => {
            if (!this.initialized) return;
            this._sineSwoop(0.4, 800, 1600, 0.08);
            this._sineSwoop(0.4, 600, 1200, 0.06);
        }, 600);
    }

    // ── Ambient Drones ──

    startAmbient(roomId) {
        if (!this.initialized) return;
        this.stopAmbient();

        const roomConfigs = {
            'room-01': { freq: 55, type: 'sine', filterFreq: 180, noiseVol: 0.008 },
            'room-02': { freq: 62, type: 'sine', filterFreq: 200, noiseVol: 0.010 },
            'room-03': { freq: 50, type: 'sine', filterFreq: 160, noiseVol: 0.012 },
            'room-04': { freq: 65, type: 'triangle', filterFreq: 220, noiseVol: 0.008 },
            'room-05': { freq: 58, type: 'sine', filterFreq: 240, noiseVol: 0.010 },
            'room-06': { freq: 70, type: 'sawtooth', filterFreq: 150, noiseVol: 0.015 },
            'room-07': { freq: 75, type: 'sine', filterFreq: 300, noiseVol: 0.006 },
            'room-08': { freq: 48, type: 'sine', filterFreq: 140, noiseVol: 0.015 },
            'room-09': { freq: 82, type: 'triangle', filterFreq: 260, noiseVol: 0.005 },
            'room-10': { freq: 60, type: 'sine', filterFreq: 200, noiseVol: 0.006 },
        };

        const cfg = roomConfigs[roomId] || roomConfigs['room-01'];

        // Base drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = cfg.type;
        osc.frequency.value = cfg.freq;
        filter.type = 'lowpass';
        filter.frequency.value = cfg.filterFreq;
        filter.Q.value = 2;
        gain.gain.value = 0.025;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        this.ambientNodes.push({ osc, gain, filter });

        // Sub-harmonic
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.value = cfg.freq / 2;
        subGain.gain.value = 0.015;
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start();
        this.ambientNodes.push({ osc: sub, gain: subGain, filter: subGain });

        // Filtered noise atmosphere
        this._startAmbientNoise(cfg.noiseVol);
    }

    _startAmbientNoise(vol) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() - 0.5) * 2;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 120;

        const gain = this.ctx.createGain();
        gain.gain.value = vol;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();

        this.ambientNodes.push({ osc: source, gain, filter });
    }

    stopAmbient() {
        for (const node of this.ambientNodes) {
            try {
                if (node.interval) clearInterval(node.interval);
                node.osc.stop();
                node.osc.disconnect();
                node.gain.disconnect();
                if (node.filter && node.filter !== node.gain) node.filter.disconnect();
            } catch (e) {}
        }
        this.ambientNodes = [];
    }

    // ── Cyberpunk Music Track ──
    // Procedural dark synth loop — pulsing bass, arpeggiated leads, rhythmic drums

    startMusic() {
        if (!this.initialized) return;
        this.stopMusic();

        const bpm = 128;
        const stepTime = 60 / bpm / 4; // 16th note duration

        // ── Bass Synth ──
        // Pulsing sub bass with sidechain-style envelope
        const bassNotes = [55, 55, 55, 55, 65, 65, 55, 55, 49, 49, 55, 55, 55, 55, 49, 49];
        let bassStep = 0;

        const bassOsc = this.ctx.createOscillator();
        const bassOsc2 = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();

        bassOsc.type = 'sawtooth';
        bassOsc2.type = 'square';
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 4;
        bassGain.gain.value = 0;

        bassOsc.connect(bassFilter);
        bassOsc2.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start();
        bassOsc2.start();

        const bassInterval = setInterval(() => {
            if (!this.ctx) return;
            const note = bassNotes[bassStep % bassNotes.length];
            const t = this.ctx.currentTime;
            bassOsc.frequency.setValueAtTime(note, t);
            bassOsc2.frequency.setValueAtTime(note * 1.002, t); // slight detune
            // Sidechain pump envelope
            bassGain.gain.cancelScheduledValues(t);
            bassGain.gain.setValueAtTime(0.07, t);
            bassGain.gain.exponentialRampToValueAtTime(0.04, t + stepTime * 2);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 3.5);
            bassStep++;
            // Filter modulation
            if (bassStep % 16 < 8) {
                bassFilter.frequency.setValueAtTime(180 + (bassStep % 4) * 30, t);
            } else {
                bassFilter.frequency.setValueAtTime(120, t);
            }
        }, stepTime * 4 * 1000); // every beat

        this.musicNodes.push(
            { osc: bassOsc, gain: bassGain, filter: bassFilter, interval: bassInterval },
            { osc: bassOsc2, gain: bassGain, filter: bassFilter }
        );

        // ── Arpeggio Lead ──
        // Dark minor arpeggio pattern
        const arpNotes = [220, 262, 330, 392, 330, 262, 196, 262,
                          220, 294, 349, 440, 349, 294, 220, 262];
        let arpStep = 0;

        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        const arpFilter = this.ctx.createBiquadFilter();

        arpOsc.type = 'square';
        arpFilter.type = 'lowpass';
        arpFilter.frequency.value = 1200;
        arpFilter.Q.value = 3;
        arpGain.gain.value = 0;

        arpOsc.connect(arpFilter);
        arpFilter.connect(arpGain);
        arpGain.connect(this.masterGain);
        // Also send to reverb
        arpGain.connect(this.reverbGain);
        arpOsc.start();

        const arpInterval = setInterval(() => {
            if (!this.ctx) return;
            const note = arpNotes[arpStep % arpNotes.length];
            const t = this.ctx.currentTime;
            arpOsc.frequency.setValueAtTime(note, t);
            arpGain.gain.cancelScheduledValues(t);
            arpGain.gain.setValueAtTime(0.03, t);
            arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 0.9);
            arpStep++;
            // Filter sweep every 2 bars
            arpFilter.frequency.setValueAtTime(800 + Math.sin(arpStep * 0.2) * 600, t);
        }, stepTime * 1000);

        this.musicNodes.push(
            { osc: arpOsc, gain: arpGain, filter: arpFilter, interval: arpInterval }
        );

        // ── Kick Drum ──
        const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0];
        let kickStep = 0;

        const kickInterval = setInterval(() => {
            if (!this.ctx) return;
            if (kickPattern[kickStep % kickPattern.length]) {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(t);
                osc.stop(t + 0.1);
            }
            kickStep++;
        }, stepTime * 1000);

        this.musicNodes.push(
            { osc: { stop() {}, disconnect() {} }, gain: { disconnect() {} }, filter: { disconnect() {} }, interval: kickInterval }
        );

        // ── Hi-hat ──
        const hatPattern = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1];
        let hatStep = 0;

        const hatInterval = setInterval(() => {
            if (!this.ctx) return;
            if (hatPattern[hatStep % hatPattern.length]) {
                this._noise(0.04, 8000, 4000, 0.025);
            }
            hatStep++;
        }, stepTime * 1000);

        this.musicNodes.push(
            { osc: { stop() {}, disconnect() {} }, gain: { disconnect() {} }, filter: { disconnect() {} }, interval: hatInterval }
        );

        // ── Snare (on beats 2 and 4) ──
        let snareStep = 0;
        const snareInterval = setInterval(() => {
            if (!this.ctx) return;
            if (snareStep % 2 === 1) {
                this._noise(0.07, 3000, 500, 0.06);
                this._sine(0.04, 200, 80, 0.05);
            }
            snareStep++;
        }, stepTime * 4 * 1000);

        this.musicNodes.push(
            { osc: { stop() {}, disconnect() {} }, gain: { disconnect() {} }, filter: { disconnect() {} }, interval: snareInterval }
        );

        // ── Pad (long filtered chords) ──
        const padFreqs = [110, 131, 165]; // Am chord
        for (const freq of padFreqs) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            filter.type = 'lowpass';
            filter.frequency.value = 300;
            filter.Q.value = 1;
            gain.gain.value = 0.012;
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            gain.connect(this.reverbGain);
            osc.start();
            this.musicNodes.push({ osc, gain, filter });
        }
    }

    stopMusic() {
        for (const node of this.musicNodes) {
            try {
                if (node.interval) clearInterval(node.interval);
                node.osc.stop();
                node.osc.disconnect();
                node.gain.disconnect();
                if (node.filter && node.filter !== node.gain) node.filter.disconnect();
            } catch (e) {}
        }
        this.musicNodes = [];
    }

    // ── Boss Music ──
    // Intense version of the cyberpunk track

    startBossMusic() {
        if (!this.initialized) return;
        this.stopAmbient();
        this.stopMusic();

        const bpm = 140;
        const stepTime = 60 / bpm / 4;

        // Aggressive bass
        const bassNotes = [55, 55, 73, 55, 49, 49, 65, 55];
        let bassStep = 0;

        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();
        bassOsc.type = 'sawtooth';
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 250;
        bassFilter.Q.value = 6;
        bassGain.gain.value = 0;
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start();

        const bassInterval = setInterval(() => {
            if (!this.ctx) return;
            const note = bassNotes[bassStep % bassNotes.length];
            const t = this.ctx.currentTime;
            bassOsc.frequency.setValueAtTime(note, t);
            bassGain.gain.cancelScheduledValues(t);
            bassGain.gain.setValueAtTime(0.09, t);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 3);
            bassStep++;
        }, stepTime * 2 * 1000);

        this.musicNodes.push({ osc: bassOsc, gain: bassGain, filter: bassFilter, interval: bassInterval });

        // Fast arpeggio
        const arpNotes = [220, 330, 440, 554, 440, 330, 220, 165];
        let arpStep = 0;
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        const arpFilter = this.ctx.createBiquadFilter();
        arpOsc.type = 'square';
        arpFilter.type = 'lowpass';
        arpFilter.frequency.value = 1500;
        arpGain.gain.value = 0;
        arpOsc.connect(arpFilter);
        arpFilter.connect(arpGain);
        arpGain.connect(this.masterGain);
        arpOsc.start();

        const arpInterval = setInterval(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            arpOsc.frequency.setValueAtTime(arpNotes[arpStep % arpNotes.length], t);
            arpGain.gain.cancelScheduledValues(t);
            arpGain.gain.setValueAtTime(0.035, t);
            arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 0.8);
            arpStep++;
        }, stepTime * 1000);

        this.musicNodes.push({ osc: arpOsc, gain: arpGain, filter: arpFilter, interval: arpInterval });

        // Aggressive kick
        const kickInterval = setInterval(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.08);
        }, stepTime * 2 * 1000);

        this.musicNodes.push({ osc: { stop() {}, disconnect() {} }, gain: { disconnect() {} }, filter: { disconnect() {} }, interval: kickInterval });

        // Fast hats
        let hatStep = 0;
        const hatInterval = setInterval(() => {
            if (!this.ctx) return;
            this._noise(0.03, 9000, 5000, hatStep % 2 === 0 ? 0.03 : 0.015);
            hatStep++;
        }, stepTime * 1000);

        this.musicNodes.push({ osc: { stop() {}, disconnect() {} }, gain: { disconnect() {} }, filter: { disconnect() {} }, interval: hatInterval });
    }

    // ── Primitives ──

    _sine(duration, startFreq, endFreq, volume) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    _sineAt(time, duration, freq, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration + 0.01);
    }

    _sineSwoop(duration, startFreq, endFreq, volume) {
        this._sine(duration, startFreq, endFreq, volume);
    }

    _square(duration, startFreq, endFreq, volume) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    _noise(duration, filterFreq, filterEnd, volume) {
        const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() - 0.5) * 2;
        }

        const t = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(filterFreq, t);
        filter.frequency.linearRampToValueAtTime(filterEnd, t + duration);
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start(t);
    }

    // ── Cleanup ──
    destroy() {
        this.stopAmbient();
        this.stopMusic();
        if (this.ctx) {
            this.ctx.close();
        }
    }
}

// Procedural audio via Web Audio API — no audio files needed

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        this.ambientNodes = [];
        this.muted = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
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
        this._noise(0.05, 800, 200, 0.15);
        this._sine(0.03, 400, 200, 0.08);
    }

    hit() {
        if (!this.initialized) return;
        this._sine(0.06, 80, 60, 0.2);
        this._noise(0.04, 600, 100, 0.1);
    }

    dash() {
        if (!this.initialized) return;
        this._sineSwoop(0.1, 200, 800, 0.1);
        this._noise(0.08, 2000, 500, 0.05);
    }

    jump() {
        if (!this.initialized) return;
        this._sineSwoop(0.04, 300, 600, 0.08);
    }

    land() {
        if (!this.initialized) return;
        this._sine(0.04, 100, 80, 0.1);
        this._noise(0.03, 400, 100, 0.05);
    }

    wallSlide() {
        if (!this.initialized) return;
        this._noise(0.1, 1000, 300, 0.03);
    }

    deflect() {
        if (!this.initialized) return;
        // Metallic clang: detuned sines
        this._sine(0.2, 400, 380, 0.12);
        this._sine(0.2, 403, 383, 0.12);
        this._sine(0.1, 800, 790, 0.06);
    }

    enemyDeath() {
        if (!this.initialized) return;
        this._sineSwoop(0.15, 300, 50, 0.12);
        this._noise(0.1, 600, 100, 0.08);
    }

    playerHurt() {
        if (!this.initialized) return;
        // Dissonant chord
        this._sine(0.3, 200, 190, 0.1);
        this._sine(0.3, 213, 203, 0.1); // minor 2nd
        this._noise(0.05, 400, 100, 0.08);
    }

    playerDeath() {
        if (!this.initialized) return;
        this._sineSwoop(0.4, 400, 30, 0.15);
        this._sine(0.5, 100, 80, 0.1);
    }

    timeSlowStart() {
        if (!this.initialized) return;
        this._sineSwoop(0.3, 200, 60, 0.08);
    }

    pickup() {
        if (!this.initialized) return;
        this._sineSwoop(0.15, 400, 800, 0.1);
        this._sineSwoop(0.15, 600, 1200, 0.06);
    }

    bossDeath() {
        if (!this.initialized) return;
        this._sineSwoop(0.6, 500, 30, 0.2);
        this._noise(0.4, 1000, 50, 0.1);
        setTimeout(() => {
            this._sineSwoop(0.3, 800, 1200, 0.1);
        }, 500);
    }

    // ── Ambient ──

    startAmbient(roomId) {
        if (!this.initialized) return;
        this.stopAmbient();

        // Base drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Room-specific tuning
        const roomFreqs = {
            'room-01': 55,
            'room-02': 62,
            'room-03': 50,
            'room-04': 65,
            'room-05': 58,
            'room-06': 70,
            'room-07': 75,
            'room-08': 48,
            'room-09': 82,
            'room-10': 60,
        };

        osc.type = 'sine';
        osc.frequency.value = roomFreqs[roomId] || 55;

        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 2;

        gain.gain.value = 0.02;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();

        this.ambientNodes.push({ osc, gain, filter });

        // Second layer: filtered noise
        this._startAmbientNoise(0.01);
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
        filter.frequency.value = 150;

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
                node.osc.stop();
                node.osc.disconnect();
                node.gain.disconnect();
                node.filter.disconnect();
            } catch (e) {}
        }
        this.ambientNodes = [];
    }

    // ── Boss Music ──

    startBossMusic() {
        if (!this.initialized) return;
        this.stopAmbient();

        // Simple arpeggio pattern
        const notes = [110, 131, 165, 196, 165, 131];
        let noteIdx = 0;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.value = notes[0];
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.value = 0.04;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();

        // Step through notes
        const interval = setInterval(() => {
            noteIdx = (noteIdx + 1) % notes.length;
            osc.frequency.setValueAtTime(notes[noteIdx], this.ctx.currentTime);
        }, 200);

        this.ambientNodes.push({ osc, gain, filter, interval });

        // Bass
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = 55;
        bassGain.gain.value = 0.06;
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start();
        this.ambientNodes.push({ osc: bassOsc, gain: bassGain, filter: bassGain });

        // Drum-like noise hits
        this._startBossDrums();
    }

    _startBossDrums() {
        const interval = setInterval(() => {
            this._noise(0.05, 200, 50, 0.06);
        }, 400);
        this.ambientNodes.push({ osc: { stop() {}, disconnect() {} }, gain: { disconnect() {} }, filter: { disconnect() {} }, interval });
    }

    // ── Primitives ──

    _sine(duration, startFreq, endFreq, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _sineSwoop(duration, startFreq, endFreq, volume) {
        this._sine(duration, startFreq, endFreq, volume);
    }

    _noise(duration, filterFreq, filterEnd, volume) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() - 0.5) * 2;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(filterEnd, this.ctx.currentTime + duration);
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }

    // ── Cleanup ──
    destroy() {
        this.stopAmbient();
        if (this.ctx) {
            this.ctx.close();
        }
    }
}

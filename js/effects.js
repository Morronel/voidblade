import { GAME_WIDTH, GAME_HEIGHT, TIME_SLOW_FACTOR, PLAYER_TIME_SLOW_FACTOR } from './config.js';

export class Effects {
    constructor(camera) {
        this.camera = camera;

        // Screen flash
        this.flashColor = null;
        this.flashTimer = 0;

        // Hit slow-mo (automatic, brief)
        this.hitSlowTimer = 0;
        this.hitSlowFactor = 0.6;

        // Player-triggered time slow
        this.timeSlowActive = false;
        this.scanlineOffset = 0;

        // Chromatic aberration
        this.chromaticTimer = 0;
        this.chromaticIntensity = 0;

        // Screen zoom pulse
        this.zoomPulse = 0;

        // Death invert
        this.invertTimer = 0;

        // Room transition
        this.transitionTimer = 0;
        this.transitionDir = 'none'; // 'in' or 'out'
        this.transitionDuration = 15;

        // Room name display
        this.roomName = '';
        this.roomNameTimer = 0;
    }

    // Camera shake (convenience)
    shakeCamera(intensity) {
        if (this.camera) this.camera.shake(intensity);
    }

    // Screen flash
    flash(color, duration) {
        this.flashColor = color;
        this.flashTimer = duration;
    }

    // Brief slow-mo on hit
    hitSlowMo(frames) {
        this.hitSlowTimer = Math.max(this.hitSlowTimer, frames);
    }

    // Chromatic aberration burst
    chromatic(intensity, duration) {
        this.chromaticIntensity = intensity;
        this.chromaticTimer = duration;
    }

    // Zoom pulse (for dash start)
    triggerZoomPulse() {
        this.zoomPulse = 4;
    }

    // Death screen invert
    triggerInvert() {
        this.invertTimer = 3;
    }

    // Room transition
    startTransition(callback) {
        this.transitionTimer = this.transitionDuration;
        this.transitionDir = 'out';
        this.transitionCallback = callback;
    }

    // Show room name
    showRoomName(name) {
        this.roomName = name;
        this.roomNameTimer = 120; // 2 seconds at 60fps
    }

    // Get current time factor (1.0 = normal)
    getTimeFactor() {
        if (this.hitSlowTimer > 0) return this.hitSlowFactor;
        if (this.timeSlowActive) return TIME_SLOW_FACTOR;
        return 1.0;
    }

    getPlayerTimeFactor() {
        if (this.hitSlowTimer > 0) return this.hitSlowFactor;
        if (this.timeSlowActive) return PLAYER_TIME_SLOW_FACTOR;
        return 1.0;
    }

    update() {
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.hitSlowTimer > 0) this.hitSlowTimer--;
        if (this.chromaticTimer > 0) {
            this.chromaticTimer--;
            if (this.chromaticTimer <= 0) this.chromaticIntensity = 0;
        }
        if (this.zoomPulse > 0) this.zoomPulse -= 0.5;
        if (this.invertTimer > 0) this.invertTimer--;
        if (this.roomNameTimer > 0) this.roomNameTimer--;

        // Room transition
        if (this.transitionTimer > 0) {
            this.transitionTimer--;
            if (this.transitionDir === 'out' && this.transitionTimer <= 0) {
                if (this.transitionCallback) {
                    this.transitionCallback();
                    this.transitionCallback = null;
                }
                this.transitionDir = 'in';
                this.transitionTimer = this.transitionDuration;
            }
        }

        this.scanlineOffset += 0.5;
    }

    draw(ctx) {
        // Screen flash
        if (this.flashTimer > 0) {
            ctx.globalAlpha = this.flashTimer / 10;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.globalAlpha = 1;
        }

        // Time slow visual
        if (this.timeSlowActive) {
            // Desaturation overlay
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#000022';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.globalAlpha = 1;

            // Scanlines
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            for (let y = Math.floor(this.scanlineOffset) % 4; y < GAME_HEIGHT; y += 4) {
                ctx.fillRect(0, y, GAME_WIDTH, 1);
            }

            // Vignette
            const grd = ctx.createRadialGradient(
                GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.3,
                GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.7
            );
            grd.addColorStop(0, 'rgba(0,0,0,0)');
            grd.addColorStop(1, 'rgba(0,0,20,0.4)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // Screen invert
        if (this.invertTimer > 0) {
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Room transition (fade)
        if (this.transitionTimer > 0) {
            let alpha;
            if (this.transitionDir === 'out') {
                alpha = 1 - (this.transitionTimer / this.transitionDuration);
            } else {
                alpha = this.transitionTimer / this.transitionDuration;
            }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.globalAlpha = 1;
        }

        // Room name
        if (this.roomNameTimer > 0) {
            let alpha = 1;
            if (this.roomNameTimer > 100) {
                alpha = (120 - this.roomNameTimer) / 20; // fade in
            } else if (this.roomNameTimer < 30) {
                alpha = this.roomNameTimer / 30; // fade out
            }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.roomName, GAME_WIDTH / 2, GAME_HEIGHT - 20);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    }
}

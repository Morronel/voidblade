import { GAME_WIDTH, GAME_HEIGHT, CAMERA_LERP, SHAKE_DECAY } from './config.js';
import { lerp } from './utils.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.viewWidth = GAME_WIDTH;
        this.viewHeight = GAME_HEIGHT;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.roomWidth = 0;
        this.roomHeight = 0;
        this.transitioning = false;
    }

    setRoomBounds(pixelWidth, pixelHeight) {
        this.roomWidth = pixelWidth;
        this.roomHeight = pixelHeight;
    }

    follow(targetX, targetY, snap = false) {
        const tx = targetX - this.viewWidth / 2;
        const ty = targetY - this.viewHeight / 2;

        if (snap) {
            this.x = tx;
            this.y = ty;
        } else {
            this.x = lerp(this.x, tx, CAMERA_LERP);
            this.y = lerp(this.y, ty, CAMERA_LERP);
        }

        // Clamp to room bounds
        this.x = Math.max(0, Math.min(this.x, this.roomWidth - this.viewWidth));
        this.y = Math.max(0, Math.min(this.y, this.roomHeight - this.viewHeight));

        // If room is smaller than viewport, center it
        if (this.roomWidth < this.viewWidth) {
            this.x = (this.roomWidth - this.viewWidth) / 2;
        }
        if (this.roomHeight < this.viewHeight) {
            this.y = (this.roomHeight - this.viewHeight) / 2;
        }
    }

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    update() {
        if (this.shakeIntensity > 0.5) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity *= SHAKE_DECAY;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
        }
    }

    // Apply camera transform to context
    applyTransform(ctx) {
        ctx.translate(
            -Math.round(this.x + this.shakeX),
            -Math.round(this.y + this.shakeY)
        );
    }

    // Reset transform
    resetTransform(ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Get render position (for UI that doesn't move with camera)
    get renderX() { return Math.round(this.x + this.shakeX); }
    get renderY() { return Math.round(this.y + this.shakeY); }
}

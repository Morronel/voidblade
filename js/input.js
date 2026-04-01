import { KEYS, JUMP_BUFFER_FRAMES, COYOTE_FRAMES } from './config.js';

class InputManager {
    constructor() {
        this.keys = {};          // Live state, modified by async events
        this.thisFrame = {};     // Snapshot of keys at start of this frame
        this.prevFrame = {};     // Snapshot from previous frame
        this.buffers = {};
        this.coyoteTimer = 0;
        this.onGround = false;

        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.keys[e.code] = false;
        });

        // Prevent context menu
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    update() {
        // Double-buffer: snapshot live keys for this frame
        this.prevFrame = this.thisFrame;
        this.thisFrame = { ...this.keys };

        // Decrement buffers
        for (const action in this.buffers) {
            if (this.buffers[action] > 0) this.buffers[action]--;
        }

        // Set buffers on fresh press
        for (const action in KEYS) {
            if (this.justPressed(action)) {
                this.buffers[action] = JUMP_BUFFER_FRAMES;
            }
        }

        // Coyote time
        if (this.onGround) {
            this.coyoteTimer = COYOTE_FRAMES;
        } else {
            if (this.coyoteTimer > 0) this.coyoteTimer--;
        }
    }

    isDown(action) {
        const binds = KEYS[action];
        if (!binds) return false;
        for (const key of binds) {
            if (this.thisFrame[key]) return true;
        }
        return false;
    }

    justPressed(action) {
        const binds = KEYS[action];
        if (!binds) return false;
        for (const key of binds) {
            if (this.thisFrame[key] && !this.prevFrame[key]) return true;
        }
        return false;
    }

    // Buffered press — returns true if pressed within buffer window, then consumes
    buffered(action) {
        if (this.buffers[action] > 0) {
            this.buffers[action] = 0;
            return true;
        }
        return false;
    }

    // Check if jump is valid (buffered press + coyote time)
    canJump() {
        return this.buffers['jump'] > 0 && this.coyoteTimer > 0;
    }

    consumeJump() {
        this.buffers['jump'] = 0;
        this.coyoteTimer = 0;
    }

    setOnGround(val) {
        this.onGround = val;
    }

    // Get horizontal input direction
    hdir() {
        let d = 0;
        if (this.isDown('left')) d -= 1;
        if (this.isDown('right')) d += 1;
        return d;
    }

    // Get vertical input direction
    vdir() {
        let d = 0;
        if (this.isDown('up')) d -= 1;
        if (this.isDown('down')) d += 1;
        return d;
    }
}

export const input = new InputManager();

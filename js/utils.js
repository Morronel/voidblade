// ── Math Helpers ──

export function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function approach(current, target, step) {
    if (current < target) return Math.min(current + step, target);
    if (current > target) return Math.max(current - step, target);
    return target;
}

export function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}

export function randRange(min, max) {
    return min + Math.random() * (max - min);
}

export function randInt(min, max) {
    return Math.floor(randRange(min, max + 1));
}

export function randSign() {
    return Math.random() < 0.5 ? -1 : 1;
}

// ── AABB Collision ──

export function aabbOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

export function aabbCenter(box) {
    return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

// ── Easing ──

export function easeOutQuad(t) {
    return t * (2 - t);
}

export function easeInQuad(t) {
    return t * t;
}

export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ── Object Pool ──

export class ObjectPool {
    constructor(factory, reset, initialSize = 50) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        this.active = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    get() {
        let obj = this.pool.pop() || this.factory();
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const idx = this.active.indexOf(obj);
        if (idx !== -1) {
            this.active.splice(idx, 1);
            this.reset(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            const obj = this.active.pop();
            this.reset(obj);
            this.pool.push(obj);
        }
    }

    update(dt) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const obj = this.active[i];
            if (obj.update(dt) === false || obj.dead) {
                this.active.splice(i, 1);
                this.reset(obj);
                this.pool.push(obj);
            }
        }
    }

    draw(ctx) {
        for (const obj of this.active) {
            obj.draw(ctx);
        }
    }

    get count() {
        return this.active.length;
    }
}

// ── Direction Helpers ──

export function dirFromInput(input) {
    let dx = 0, dy = 0;
    if (input.isDown('left')) dx -= 1;
    if (input.isDown('right')) dx += 1;
    if (input.isDown('up')) dy -= 1;
    if (input.isDown('down')) dy += 1;
    return { dx, dy };
}

export function normalize(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { dx: 0, dy: 0 };
    return { dx: dx / len, dy: dy / len };
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

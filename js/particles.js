import { ObjectPool, randRange, randSign } from './utils.js';

// ── Single Particle ──
function createParticle() {
    return {
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0,
        size: 1, color: '#fff',
        gravity: 0, friction: 1,
        shrink: true, fadeOut: true,
        dead: false,
        update(dt) {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            if (this.life <= 0) this.dead = true;
            return !this.dead;
        },
        draw(ctx) {
            const t = this.life / this.maxLife;
            const alpha = this.fadeOut ? t : 1;
            const s = this.shrink ? this.size * t : this.size;
            if (s < 0.2 || alpha < 0.01) return;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(
                Math.round(this.x - s / 2),
                Math.round(this.y - s / 2),
                Math.ceil(s),
                Math.ceil(s)
            );
            ctx.globalAlpha = 1;
        }
    };
}

function resetParticle(p) {
    p.dead = false;
    p.life = 0;
    p.maxLife = 0;
}

// ── Particle System ──
export class ParticleSystem {
    constructor() {
        this.pool = new ObjectPool(createParticle, resetParticle, 200);
    }

    emit(config) {
        const p = this.pool.get();
        p.x = config.x || 0;
        p.y = config.y || 0;
        p.vx = config.vx || 0;
        p.vy = config.vy || 0;
        p.life = config.life || 20;
        p.maxLife = p.life;
        p.size = config.size || 2;
        p.color = config.color || '#fff';
        p.gravity = config.gravity || 0;
        p.friction = config.friction || 1;
        p.shrink = config.shrink !== undefined ? config.shrink : true;
        p.fadeOut = config.fadeOut !== undefined ? config.fadeOut : true;
        p.dead = false;
        return p;
    }

    update(dt) {
        this.pool.update(dt);
    }

    draw(ctx) {
        this.pool.draw(ctx);
    }

    clear() {
        this.pool.releaseAll();
    }

    get count() {
        return this.pool.count;
    }

    // ── Preset Emitters ──

    landingDust(x, y, color = '#aaaaaa') {
        for (let i = 0; i < 6; i++) {
            this.emit({
                x: x + randRange(-4, 4),
                y: y,
                vx: randRange(-1.5, 1.5),
                vy: randRange(-1.5, -0.3),
                life: randRange(8, 15),
                size: randRange(1.5, 3),
                color,
                gravity: 0.05,
                friction: 0.95,
            });
        }
    }

    runDust(x, y, facing, color = '#888888') {
        this.emit({
            x: x,
            y: y,
            vx: -facing * randRange(0.3, 0.8),
            vy: randRange(-0.5, -0.1),
            life: randRange(6, 10),
            size: randRange(1, 2),
            color,
            gravity: 0.02,
            friction: 0.96,
        });
    }

    slashSparks(x, y, dir, color = '#ffffff') {
        for (let i = 0; i < 5; i++) {
            this.emit({
                x: x + randRange(-2, 2),
                y: y + randRange(-2, 2),
                vx: dir * randRange(1, 3) + randRange(-0.5, 0.5),
                vy: randRange(-2, 1),
                life: randRange(5, 10),
                size: randRange(1, 2.5),
                color,
                gravity: 0.1,
                friction: 0.92,
            });
        }
    }

    enemyDeath(x, y, color = '#ff2060') {
        for (let i = 0; i < 25; i++) {
            const angle = randRange(0, Math.PI * 2);
            const speed = randRange(1, 4);
            this.emit({
                x: x + randRange(-3, 3),
                y: y + randRange(-3, 3),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randRange(15, 30),
                size: randRange(1.5, 3.5),
                color,
                gravity: 0.08,
                friction: 0.96,
            });
        }
    }

    hitBurst(x, y, dirX, color = '#cc1144') {
        for (let i = 0; i < 8; i++) {
            this.emit({
                x,
                y: y + randRange(-4, 4),
                vx: dirX * randRange(1, 3),
                vy: randRange(-2, 2),
                life: randRange(6, 12),
                size: randRange(1, 2.5),
                color,
                gravity: 0.08,
                friction: 0.94,
            });
        }
    }

    dashTrail(x, y, color = '#00fff5') {
        for (let i = 0; i < 2; i++) {
            this.emit({
                x: x + randRange(-3, 3),
                y: y + randRange(-5, 5),
                vx: randRange(-0.3, 0.3),
                vy: randRange(-0.3, 0.3),
                life: randRange(6, 12),
                size: randRange(1, 3),
                color,
                gravity: 0,
                friction: 0.98,
                shrink: true,
            });
        }
    }

    wallSlideSparks(x, y, color = '#ff8833') {
        this.emit({
            x: x + randRange(-1, 1),
            y,
            vx: randRange(-0.5, 0.5),
            vy: randRange(-1.5, -0.5),
            life: randRange(5, 10),
            size: randRange(1, 2),
            color,
            gravity: 0.1,
            friction: 0.9,
        });
    }

    ambientMotes(x, y, width, height, color = '#00fff533', count = 1) {
        for (let i = 0; i < count; i++) {
            this.emit({
                x: x + randRange(0, width),
                y: y + randRange(0, height),
                vx: randRange(-0.1, 0.1),
                vy: randRange(-0.2, -0.05),
                life: randRange(60, 120),
                size: randRange(0.5, 1.5),
                color,
                gravity: -0.002,
                friction: 0.999,
                shrink: false,
            });
        }
    }

    playerDeathBurst(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = randRange(0, Math.PI * 2);
            const speed = randRange(1.5, 5);
            this.emit({
                x: x + randRange(-3, 3),
                y: y + randRange(-5, 5),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randRange(15, 35),
                size: randRange(1.5, 4),
                color: i % 3 === 0 ? '#00fff5' : '#1a1a2e',
                gravity: 0.1,
                friction: 0.95,
            });
        }
    }
}

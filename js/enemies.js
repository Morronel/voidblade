import { TILE_SIZE, KNOCKBACK_FORCE } from './config.js';
import { sign } from './utils.js';
import { moveAndCollide, applyGravity, checkGround, checkWall } from './physics.js';

export class Enemy {
    constructor(x, y, config) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.vx = 0;
        this.vy = 0;
        this.width = config.width || 12;
        this.height = config.height || 12;
        this.hp = config.hp || 1;
        this.maxHp = this.hp;
        this.contactDamage = config.contactDamage || 1;
        this.color = config.color || '#cc3333';
        this.type = config.type || 'crawler';

        this.dead = false;
        this.invincibleTimer = 0;
        this.hurtTimer = 0;
        this.facing = config.facing || 1;
        this.onGround = false;
        this.state = 'idle';
        this.stateTimer = 0;
        this.dropThrough = false;

        // Shield
        this.hasShield = config.hasShield || false;
        this.shieldFacing = this.facing;

        // AI
        this.aggroRange = config.aggroRange || 128;
        this.patrolSpeed = config.patrolSpeed || 0.5;
        this.chaseSpeed = config.chaseSpeed || 1;

        // Custom update/draw
        this._updateFn = config.update || null;
        this._drawFn = config.draw || null;
        this._initFn = config.init || null;

        // Flags
        this.isStationary = config.isStationary || false;
        this.affectedByGravity = config.affectedByGravity !== false;
        this.canFallOff = config.canFallOff || false;

        // Custom data
        this.data = config.data || {};

        if (this._initFn) this._initFn(this);
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    getCenterX() { return this.x + this.width / 2; }
    getCenterY() { return this.y + this.height / 2; }

    isShieldFacing(player) {
        if (!this.hasShield) return false;
        const dir = sign(player.getCenterX() - this.getCenterX());
        return dir === this.shieldFacing || dir === this.facing;
    }

    takeDamage(amount, knockDir, particles) {
        if (this.dead || this.invincibleTimer > 0) return;

        this.hp -= amount;
        this.hurtTimer = 10;
        this.invincibleTimer = 8;

        // Knockback
        this.vx = knockDir * KNOCKBACK_FORCE;
        this.vy = -2;

        if (this.hp <= 0) {
            this.dead = true;
            if (particles) {
                particles.enemyDeath(this.getCenterX(), this.getCenterY(), this.color);
            }
        } else {
            if (particles) {
                particles.hitBurst(this.getCenterX(), this.getCenterY(), knockDir, this.color);
            }
        }
    }

    update(tilemap, player, projectiles, particles) {
        if (this.dead) return;

        this.stateTimer++;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.hurtTimer > 0) this.hurtTimer--;

        // Custom update
        if (this._updateFn) {
            this._updateFn(this, tilemap, player, projectiles, particles);
        }

        // Gravity
        if (this.affectedByGravity) {
            applyGravity(this);
        }

        // Knockback friction
        if (this.hurtTimer > 0) {
            this.vx *= 0.85;
        }

        // Movement + collision
        if (!this.isStationary) {
            const col = moveAndCollide(this, tilemap);
            this.onGround = col.bottom;

            // Wall collision → turn around
            if (col.left || col.right) {
                this.facing *= -1;
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;

        // Hurt flash
        if (this.hurtTimer > 0 && this.hurtTimer % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
            return;
        }

        if (this._drawFn) {
            this._drawFn(this, ctx);
        } else {
            // Default draw
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
        }
    }
}

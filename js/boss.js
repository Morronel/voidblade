import { TILE_SIZE, KNOCKBACK_FORCE } from './config.js';
import { sign, distance, randRange } from './utils.js';
import { moveAndCollide, applyGravity, checkGround } from './physics.js';
import { drawHealthBar, drawTelegraph } from './animation.js';

// ── Cathedral Guardian ──
// Phase 1: Ground slams, 3-hit combo, summons crawlers
// Phase 2 (50% HP): Faster, charge attack, projectile rain
export class CathedralGuardian {
    constructor(x, y) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.vx = 0;
        this.vy = 0;
        this.width = 20;
        this.height = 24;
        this.hp = 15;
        this.maxHp = 15;
        this.contactDamage = 2;
        this.dead = false;
        this.invincibleTimer = 0;
        this.hurtTimer = 0;
        this.facing = -1;
        this.onGround = false;
        this.dropThrough = false;

        this.color = '#aa6633';
        this.type = 'boss';
        this.hasShield = false;

        // State
        this.state = 'idle';
        this.stateTimer = 0;
        this.phase = 1;
        this.activated = false;

        // Attack data
        this.attackType = null; // 'slam', 'combo', 'charge', 'rain'
        this.comboHit = 0;
        this.telegraphTimer = 0;
        this.cooldown = 60;

        // Slam hitbox
        this.attackHitbox = null;

        // Summoned crawlers tracking
        this.summonCount = 0;
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    getCenterX() { return this.x + this.width / 2; }
    getCenterY() { return this.y + this.height / 2; }

    isShieldFacing() { return false; }

    activate() {
        this.activated = true;
        this.state = 'idle';
        this.stateTimer = 0;
    }

    takeDamage(amount, knockDir, particles) {
        if (this.dead || this.invincibleTimer > 0) return;

        this.hp -= amount;
        this.hurtTimer = 8;
        this.invincibleTimer = 15;

        // Slight knockback
        this.vx = knockDir * 2;

        if (particles) {
            particles.hitBurst(this.getCenterX(), this.getCenterY(), knockDir, this.color);
        }

        // Phase transition
        if (this.hp <= this.maxHp / 2 && this.phase === 1) {
            this.phase = 2;
            this.state = 'phaseTransition';
            this.stateTimer = 0;
        }

        if (this.hp <= 0) {
            this.dead = true;
            if (particles) {
                particles.enemyDeath(this.getCenterX(), this.getCenterY(), '#c8a832');
                particles.enemyDeath(this.getCenterX(), this.getCenterY(), this.color);
            }
        }
    }

    update(tilemap, player, projectiles, particles) {
        if (this.dead) return;
        if (!this.activated) {
            // Activate when player is close
            if (distance(this.getCenterX(), this.getCenterY(), player.getCenterX(), player.getCenterY()) < 120) {
                this.activate();
            }
            return;
        }

        this.stateTimer++;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.hurtTimer > 0) {
            this.hurtTimer--;
            this.vx *= 0.85;
        }

        this.facing = sign(player.getCenterX() - this.getCenterX()) || this.facing;

        applyGravity(this);

        switch (this.state) {
            case 'idle':
                this._updateIdle(player, projectiles, particles);
                break;
            case 'telegraph':
                this._updateTelegraph(player, projectiles, particles);
                break;
            case 'slam':
                this._updateSlam(player, particles);
                break;
            case 'combo':
                this._updateCombo(player, particles);
                break;
            case 'charge':
                this._updateCharge(player, particles);
                break;
            case 'rain':
                this._updateRain(player, projectiles, particles);
                break;
            case 'phaseTransition':
                this._updatePhaseTransition(particles);
                break;
        }

        const col = moveAndCollide(this, tilemap);
        this.onGround = col.bottom;
    }

    _updateIdle(player, projectiles, particles) {
        this.vx = approach(this.vx, 0, 0.3);
        this.cooldown--;
        this.attackHitbox = null;

        if (this.cooldown <= 0) {
            // Choose attack
            const dist = distance(this.getCenterX(), this.getCenterY(), player.getCenterX(), player.getCenterY());
            const roll = Math.random();

            if (this.phase === 2 && roll < 0.25) {
                this.attackType = 'charge';
            } else if (this.phase === 2 && roll < 0.45 && this.summonCount < 2) {
                this.attackType = 'rain';
            } else if (dist < 60) {
                this.attackType = roll < 0.5 ? 'slam' : 'combo';
            } else {
                this.attackType = 'slam';
            }

            this.state = 'telegraph';
            this.telegraphTimer = this.phase === 1 ? 60 : 40;
            this.stateTimer = 0;
        }
    }

    _updateTelegraph(player) {
        this.vx = 0;
        this.telegraphTimer--;

        if (this.telegraphTimer <= 0) {
            this.state = this.attackType;
            this.stateTimer = 0;
            this.comboHit = 0;
        }
    }

    _updateSlam(player, particles) {
        if (this.stateTimer === 1) {
            // Jump up
            this.vy = -8;
            this.vx = this.facing * 2;
        }

        if (this.stateTimer > 10 && this.onGround) {
            // Ground slam
            this.attackHitbox = {
                x: this.x - 20,
                y: this.y + this.height - 8,
                w: this.width + 40,
                h: 12
            };

            if (particles) {
                particles.landingDust(this.getCenterX(), this.y + this.height);
                particles.landingDust(this.getCenterX() - 15, this.y + this.height);
                particles.landingDust(this.getCenterX() + 15, this.y + this.height);
            }

            this.state = 'idle';
            this.cooldown = this.phase === 1 ? 50 : 30;
        }

        if (this.stateTimer > 60) {
            this.state = 'idle';
            this.cooldown = 30;
        }
    }

    _updateCombo(player, particles) {
        const hitFrames = [5, 20, 35];
        const speed = this.phase === 1 ? 3 : 4.5;

        if (this.stateTimer < 40) {
            this.vx = this.facing * speed;

            for (const frame of hitFrames) {
                if (this.stateTimer === frame) {
                    this.attackHitbox = {
                        x: this.facing === 1 ? this.x + this.width : this.x - 18,
                        y: this.y,
                        w: 18,
                        h: this.height
                    };
                    this.comboHit++;

                    if (particles) {
                        particles.slashSparks(
                            this.getCenterX() + this.facing * 15,
                            this.getCenterY(),
                            this.facing, '#ff8844'
                        );
                    }
                }
            }
        } else {
            this.attackHitbox = null;
            this.vx *= 0.8;
            if (this.stateTimer > 50) {
                this.state = 'idle';
                this.cooldown = this.phase === 1 ? 60 : 35;
            }
        }
    }

    _updateCharge(player, particles) {
        if (this.stateTimer < 5) {
            this.vx = -this.facing * 1; // brief pullback
        } else if (this.stateTimer < 25) {
            this.vx = this.facing * 8;
            this.attackHitbox = {
                x: this.x - 2,
                y: this.y,
                w: this.width + 4,
                h: this.height
            };
            if (particles && this.stateTimer % 2 === 0) {
                particles.dashTrail(this.getCenterX(), this.getCenterY(), '#ff4444');
            }
        } else {
            this.vx *= 0.8;
            this.attackHitbox = null;
            if (this.stateTimer > 40) {
                this.state = 'idle';
                this.cooldown = 40;
            }
        }
    }

    _updateRain(player, projectiles, particles) {
        if (this.stateTimer % 8 === 0 && this.stateTimer < 50 && projectiles) {
            const px = player.getCenterX() + randRange(-40, 40);
            projectiles.push({
                x: px,
                y: this.y - 80,
                vx: 0,
                vy: 2.5,
                width: 4,
                height: 4,
                color: '#ff6633',
                hostile: true,
                deflected: false,
                damage: 1,
                life: 120,
            });
        }

        // Summon crawlers in phase 2
        if (this.stateTimer === 25 && this.summonCount < 2) {
            this.summonCount++;
            // Signal to spawn crawler (handled externally)
        }

        this.vx = 0;
        if (this.stateTimer > 60) {
            this.state = 'idle';
            this.cooldown = 50;
        }
    }

    _updatePhaseTransition(particles) {
        this.vx = 0;
        if (this.stateTimer === 1 && particles) {
            particles.enemyDeath(this.getCenterX(), this.getCenterY(), '#ff4444');
        }
        if (this.stateTimer > 60) {
            this.state = 'idle';
            this.cooldown = 30;
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

        const x = Math.round(this.x);
        const y = Math.round(this.y);

        // Telegraph warning
        if (this.state === 'telegraph') {
            const progress = this.stateTimer / this.telegraphTimer;
            ctx.fillStyle = `rgba(255,32,96,${0.2 + Math.sin(progress * 20) * 0.15})`;
            ctx.fillRect(x - 5, y - 5, this.width + 10, this.height + 10);
        }

        // Body
        const bodyColor = this.phase === 2 ? '#cc4422' : this.color;
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + 2, y + 4, this.width - 4, this.height - 4);

        // Head
        ctx.fillStyle = '#553322';
        ctx.fillRect(x + 3, y - 2, this.width - 6, 8);

        // Eyes (glow more in phase 2)
        const eyeColor = this.phase === 2 ? '#ff2222' : '#ff6644';
        ctx.fillStyle = eyeColor;
        const eyeX = this.facing === 1 ? x + this.width - 8 : x + 3;
        ctx.fillRect(eyeX, y, 4, 3);
        // Eye glow
        ctx.fillStyle = eyeColor + '44';
        ctx.beginPath();
        ctx.arc(eyeX + 2, y + 1.5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = '#444433';
        ctx.fillRect(x - 2, y + 6, 5, 8);
        ctx.fillRect(x + this.width - 3, y + 6, 5, 8);

        // Attack hitbox visualization (subtle)
        if (this.attackHitbox) {
            ctx.fillStyle = 'rgba(255,100,50,0.15)';
            ctx.fillRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.w, this.attackHitbox.h);
        }

        // Health bar
        drawHealthBar(ctx, x - 5, y - 8, this.width + 10, 3, this.hp / this.maxHp, this.phase === 2 ? '#ff2222' : '#ff6644');
    }
}

function approach(current, target, step) {
    if (current < target) return Math.min(current + step, target);
    if (current > target) return Math.max(current - step, target);
    return target;
}

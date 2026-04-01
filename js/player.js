import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_MAX_HP, COLORS, INVINCIBILITY_FRAMES, FOCUS_MAX } from './config.js';
import { input } from './input.js';
import { moveAndCollide, applyGravity, checkGround, checkWall } from './physics.js';
import { createStates } from './player-states.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.facing = 1; // 1=right, -1=left

        // HP
        this.hp = PLAYER_MAX_HP;
        this.maxHp = PLAYER_MAX_HP;
        this.invincibleTimer = 0;
        this.dead = false;

        // State machine
        this.states = createStates();
        this.currentState = 'idle';
        this.stateTimer = 0;
        this.prevState = 'idle';

        // Ground/wall
        this.onGround = false;
        this.onWallLeft = false;
        this.onWallRight = false;
        this.wasOnGround = false;
        this.dropThrough = false;

        // Combat
        this.attacking = false;
        this.attackDir = 'forward'; // forward, up, down
        this.comboCount = 0;
        this.attackTimer = 0;
        this.attackHitbox = null;
        this.hasHitThisSwing = false;

        // Dash
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.canDash = true;

        // Abilities (unlockable)
        this.hasDash = true; // start with for testing; gate later
        this.hasWallJump = true;
        this.hasTimeSlow = true;
        this.hasDoubleJump = false;
        this.doubleJumpUsed = false;

        // Focus (time slow meter)
        this.focus = FOCUS_MAX;
        this.timeSlow = false;

        // Visual
        this.cloakPoints = [
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 },
            { x: 0, y: 0, vx: 0, vy: 0 },
        ];
        this.drawFlash = 0;

        // Afterimages for dash
        this.afterimages = [];

        // Enter initial state
        this.states[this.currentState].enter(this);
    }

    setState(name) {
        if (name === this.currentState) return;
        if (this.states[this.currentState].exit) {
            this.states[this.currentState].exit(this);
        }
        this.prevState = this.currentState;
        this.currentState = name;
        this.stateTimer = 0;
        this.states[this.currentState].enter(this);
    }

    update(tilemap, particles, effects, combat, enemies) {
        this.stateTimer++;

        // Invincibility
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        // Dash cooldown
        if (this.dashCooldown > 0) this.dashCooldown--;

        // Drop through platforms
        this.dropThrough = input.isDown('down') && input.justPressed('jump');

        // Wall checks
        this.onWallLeft = checkWall(this, tilemap, 'left');
        this.onWallRight = checkWall(this, tilemap, 'right');

        // Update current state
        this.states[this.currentState].update(this, tilemap, particles, effects, combat, enemies);

        // Apply movement and collision
        const col = moveAndCollide(this, tilemap);

        // Ground check
        this.wasOnGround = this.onGround;
        this.onGround = col.bottom || checkGround(this, tilemap);
        input.setOnGround(this.onGround);

        // Reset double jump on landing
        if (this.onGround && !this.wasOnGround) {
            this.doubleJumpUsed = false;
            this.canDash = true;
            // Landing dust
            if (particles && Math.abs(this.vy) < 1) {
                particles.landingDust(this.x + this.width / 2, this.y + this.height);
            }
        }

        // Just landed with speed — bigger dust
        if (this.onGround && !this.wasOnGround && this.prevVy > 3) {
            if (particles) {
                particles.landingDust(this.x + this.width / 2, this.y + this.height);
            }
        }

        this.prevVy = this.vy;

        // Update facing from input (except during wall-jump lockout or dash)
        if (this.currentState !== 'dash' && this.currentState !== 'wallJump') {
            const hdir = input.hdir();
            if (hdir !== 0) this.facing = hdir;
        }

        // Update cloak physics
        this._updateCloak();

        // Update afterimages
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            this.afterimages[i].life--;
            if (this.afterimages[i].life <= 0) {
                this.afterimages.splice(i, 1);
            }
        }

        // Focus regen when not using time slow
        if (!this.timeSlow && this.focus < FOCUS_MAX) {
            this.focus = Math.min(FOCUS_MAX, this.focus + 0.3);
        }
    }

    takeDamage(amount, knockbackDir, particles, effects, camera) {
        if (this.invincibleTimer > 0 || this.dead) return false;
        if (this.currentState === 'dash') return false; // i-frames during dash

        this.hp -= amount;
        this.invincibleTimer = INVINCIBILITY_FRAMES;
        this.drawFlash = 10;

        // Knockback
        this.vx = knockbackDir * 4;
        this.vy = -3;

        if (particles) particles.hitBurst(this.x + this.width / 2, this.y + this.height / 2, -knockbackDir);
        if (effects) effects.flash('#ff2060', 6);
        if (camera) camera.shake(4);

        if (this.hp <= 0) {
            this.dead = true;
            this.setState('death');
        } else {
            this.setState('hurt');
        }
        return true;
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    getCenterX() { return this.x + this.width / 2; }
    getCenterY() { return this.y + this.height / 2; }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = this.maxHp;
        this.dead = false;
        this.invincibleTimer = 0;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.comboCount = 0;
        this.attacking = false;
        this.focus = FOCUS_MAX;
        this.timeSlow = false;
        this.doubleJumpUsed = false;
        this.canDash = true;
        this.afterimages = [];
        this.setState('idle');
    }

    _updateCloak() {
        const anchorX = this.x + this.width / 2 - this.facing * 3;
        const anchorY = this.y + this.height * 0.4;

        for (let i = 0; i < this.cloakPoints.length; i++) {
            const cp = this.cloakPoints[i];
            const targetX = anchorX - this.facing * (4 + i * 3);
            const targetY = anchorY + i * 4;

            cp.vx += (targetX - cp.x) * 0.15;
            cp.vy += (targetY - cp.y) * 0.1;
            cp.vx += -this.vx * 0.3; // react to movement
            cp.vy += 0.1; // gravity

            cp.vx *= 0.8;
            cp.vy *= 0.8;

            cp.x += cp.vx;
            cp.y += cp.vy;
        }
    }

    draw(ctx) {
        const cx = Math.round(this.x);
        const cy = Math.round(this.y);

        // Afterimages
        for (const img of this.afterimages) {
            const a = img.life / img.maxLife * 0.4;
            ctx.globalAlpha = a;
            ctx.fillStyle = COLORS.dashTrail;
            ctx.fillRect(img.x, img.y, this.width, this.height);
            ctx.globalAlpha = 1;
        }

        // Invincibility blink
        if (this.invincibleTimer > 0 && this.invincibleTimer % 4 < 2) return;

        // Flash on hit
        if (this.drawFlash > 0) {
            this.drawFlash--;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx, cy, this.width, this.height);
            return;
        }

        // Death state — don't draw
        if (this.dead && this.currentState === 'death' && this.stateTimer > 5) return;

        // Cloak
        ctx.fillStyle = COLORS.playerCloak;
        ctx.beginPath();
        ctx.moveTo(cx + this.width / 2, cy + this.height * 0.3);
        for (const cp of this.cloakPoints) {
            ctx.lineTo(Math.round(cp.x), Math.round(cp.y));
        }
        ctx.lineTo(cx + this.width / 2 - this.facing * 2, cy + this.height);
        ctx.closePath();
        ctx.fill();

        // Cloak edge glow
        ctx.strokeStyle = COLORS.cloakGlow + '44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + this.width / 2, cy + this.height * 0.3);
        for (const cp of this.cloakPoints) {
            ctx.lineTo(Math.round(cp.x), Math.round(cp.y));
        }
        ctx.stroke();

        // Body
        ctx.fillStyle = COLORS.playerBody;
        ctx.fillRect(cx + 1, cy + 2, this.width - 2, this.height - 4);

        // Head (larger, Hollow Knight style)
        ctx.fillStyle = COLORS.playerBody;
        ctx.fillRect(cx, cy - 2, this.width, 8);

        // Visor/eye
        const visorX = this.facing === 1 ? cx + 5 : cx + 2;
        ctx.fillStyle = COLORS.playerVisor;
        ctx.fillRect(visorX, cy, 3, 2);

        // Subtle glow around player
        ctx.fillStyle = COLORS.playerVisor + '0a';
        ctx.beginPath();
        ctx.arc(cx + this.width / 2, cy + this.height / 2, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawAttackArc(ctx) {
        if (!this.attacking || this.attackTimer <= 0) return;

        const progress = 1 - (this.attackTimer / 10);
        const cx = this.getCenterX();
        const cy = this.getCenterY();
        const range = 20;

        ctx.strokeStyle = COLORS.slash;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1 - progress;

        ctx.beginPath();
        if (this.attackDir === 'up') {
            const startAngle = -Math.PI * 0.8 + progress * 0.5;
            ctx.arc(cx, cy - 4, range, startAngle, startAngle + Math.PI * 0.6);
        } else if (this.attackDir === 'down') {
            const startAngle = Math.PI * 0.2 + progress * 0.5;
            ctx.arc(cx, cy + 4, range, startAngle, startAngle + Math.PI * 0.6);
        } else {
            const baseAngle = this.facing === 1 ? -Math.PI * 0.4 : Math.PI * 0.6;
            const sweep = this.facing * (Math.PI * 0.6);
            ctx.arc(cx + this.facing * 4, cy, range, baseAngle + progress * 0.3, baseAngle + sweep + progress * 0.3);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

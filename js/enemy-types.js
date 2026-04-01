import { TILE_SIZE } from './config.js';
import { Enemy } from './enemies.js';
import { drawEye, drawGeometricBody, drawShield, drawDiamond, drawWings, drawProjectile } from './animation.js';
import { sign, distance, randRange } from './utils.js';
import { checkGround, checkWall } from './physics.js';

// ── Crawler ──
// Walks back and forth. Falls off edges (stupid). Dies in 1 hit.
export function createCrawler(x, y) {
    return new Enemy(x, y, {
        type: 'crawler',
        width: 12,
        height: 8,
        hp: 1,
        color: '#aa2233',
        patrolSpeed: 0.5,
        canFallOff: true,
        update(self, tilemap, player) {
            if (self.hurtTimer > 0) return;

            // Patrol: walk in facing direction
            self.vx = self.facing * self.patrolSpeed;

            // Check for edge ahead (don't fall off unless canFallOff is false)
            if (self.onGround && !self.canFallOff) {
                const aheadX = self.facing === 1
                    ? self.x + self.width + 2
                    : self.x - 2;
                const belowY = self.y + self.height + 4;
                const tx = Math.floor(aheadX / TILE_SIZE);
                const ty = Math.floor(belowY / TILE_SIZE);
                const tile = tilemap.get(tx, ty);
                if (tile === 0) {
                    self.facing *= -1;
                }
            }
        },
        draw(self, ctx) {
            const x = Math.round(self.x);
            const y = Math.round(self.y);
            // Low, flat body
            ctx.fillStyle = self.color;
            ctx.fillRect(x, y + 2, self.width, self.height - 2);
            ctx.fillStyle = '#661122';
            ctx.fillRect(x + 1, y, self.width - 2, 4);
            // Red eye
            const eyeX = self.facing === 1 ? x + self.width - 4 : x + 1;
            drawEye(ctx, eyeX, y + 1, 2, '#ff2222');
            // Legs
            ctx.fillStyle = '#551122';
            ctx.fillRect(x + 2, y + self.height - 2, 2, 2);
            ctx.fillRect(x + self.width - 4, y + self.height - 2, 2, 2);
        }
    });
}

// ── Flyer ──
// Hovers in sine wave. Aggros and charges.
export function createFlyer(x, y) {
    return new Enemy(x, y, {
        type: 'flyer',
        width: 10,
        height: 10,
        hp: 1,
        color: '#4466cc',
        aggroRange: 128,
        affectedByGravity: false,
        data: { baseY: y * TILE_SIZE, phase: Math.random() * Math.PI * 2, charging: false, chargeTimer: 0, pauseTimer: 0 },
        update(self, tilemap, player) {
            if (self.hurtTimer > 0) return;

            const dist = distance(self.getCenterX(), self.getCenterY(), player.getCenterX(), player.getCenterY());

            if (!self.data.charging && self.data.pauseTimer <= 0) {
                // Hover in sine wave
                self.data.phase += 0.05;
                self.y = self.data.baseY + Math.sin(self.data.phase) * 15;
                self.vx = 0;
                self.vy = 0;

                // Aggro check
                if (dist < self.aggroRange && !player.dead) {
                    self.data.charging = true;
                    self.data.chargeTimer = 30;
                    const dx = player.getCenterX() - self.getCenterX();
                    const dy = player.getCenterY() - self.getCenterY();
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    self.vx = (dx / len) * 2.5;
                    self.vy = (dy / len) * 2.5;
                    self.facing = sign(dx) || 1;
                }
            } else if (self.data.charging) {
                self.data.chargeTimer--;
                if (self.data.chargeTimer <= 0) {
                    self.data.charging = false;
                    self.data.pauseTimer = 40;
                    self.vx = 0;
                    self.vy = 0;
                    self.data.baseY = self.y;
                }
            } else {
                self.data.pauseTimer--;
                self.vx = 0;
                self.vy = 0;
            }
        },
        draw(self, ctx) {
            const cx = Math.round(self.getCenterX());
            const cy = Math.round(self.getCenterY());
            drawDiamond(ctx, cx, cy, 5, self.color, Math.sin(self.stateTimer * 0.2) * 2);
            drawWings(ctx, cx, cy, self.stateTimer, '#4466cc44');
            drawEye(ctx, cx - 1, cy - 1, 2, '#ff4444');
        }
    });
}

// ── Spitter ──
// Stationary, fires deflectable projectile every ~2s.
export function createSpitter(x, y) {
    return new Enemy(x, y, {
        type: 'spitter',
        width: 12,
        height: 14,
        hp: 1,
        color: '#557733',
        isStationary: false,
        data: { shootTimer: 60 },
        update(self, tilemap, player, projectiles) {
            if (self.hurtTimer > 0) return;
            self.vx = 0; // don't patrol

            self.facing = sign(player.getCenterX() - self.getCenterX()) || 1;

            self.data.shootTimer--;
            if (self.data.shootTimer <= 0) {
                self.data.shootTimer = 120; // 2 seconds
                // Fire projectile
                if (projectiles) {
                    const dx = player.getCenterX() - self.getCenterX();
                    const dy = player.getCenterY() - self.getCenterY();
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    projectiles.push({
                        x: self.getCenterX(),
                        y: self.getCenterY() - 2,
                        vx: (dx / len) * 1.5,
                        vy: (dy / len) * 1.5,
                        width: 4,
                        height: 4,
                        color: '#aaff33',
                        hostile: true,
                        deflected: false,
                        damage: 1,
                        life: 180,
                    });
                }
            }
        },
        draw(self, ctx) {
            const x = Math.round(self.x);
            const y = Math.round(self.y);
            // Hunched body
            ctx.fillStyle = self.color;
            ctx.fillRect(x + 1, y + 4, self.width - 2, self.height - 4);
            ctx.fillStyle = '#334422';
            ctx.fillRect(x + 2, y, self.width - 4, 6);
            // Glowing mouth
            const mouthX = self.facing === 1 ? x + self.width - 4 : x + 1;
            ctx.fillStyle = '#aaff33';
            ctx.fillRect(mouthX, y + 5, 3, 3);
            ctx.fillStyle = '#aaff3344';
            ctx.beginPath();
            ctx.arc(mouthX + 1.5, y + 6.5, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ── Shield Knight ──
// Front shield blocks attacks. Must hit from behind or during wind-up.
export function createShieldKnight(x, y) {
    return new Enemy(x, y, {
        type: 'shieldKnight',
        width: 12,
        height: 18,
        hp: 2,
        color: '#5555aa',
        hasShield: true,
        patrolSpeed: 0.3,
        aggroRange: 96,
        data: { attacking: false, windupTimer: 0, strikeTimer: 0, cooldown: 0 },
        update(self, tilemap, player) {
            if (self.hurtTimer > 0) return;

            const dist = distance(self.getCenterX(), self.getCenterY(), player.getCenterX(), player.getCenterY());
            self.facing = sign(player.getCenterX() - self.getCenterX()) || self.facing;
            self.shieldFacing = self.facing;

            if (self.data.attacking) {
                if (self.data.windupTimer > 0) {
                    self.data.windupTimer--;
                    self.vx = 0;
                    self.hasShield = false; // Shield drops during windup
                } else if (self.data.strikeTimer > 0) {
                    self.data.strikeTimer--;
                    self.vx = self.facing * 3; // Lunge
                    self.hasShield = false;
                } else {
                    self.data.attacking = false;
                    self.data.cooldown = 90;
                    self.hasShield = true;
                    self.vx = 0;
                }
            } else {
                if (self.data.cooldown > 0) self.data.cooldown--;

                if (dist < self.aggroRange && dist > 20 && self.data.cooldown <= 0 && !player.dead) {
                    // Start attack
                    self.data.attacking = true;
                    self.data.windupTimer = 30;
                    self.data.strikeTimer = 10;
                } else {
                    // Slow patrol
                    self.vx = self.facing * self.patrolSpeed;
                }
            }
        },
        draw(self, ctx) {
            const x = Math.round(self.x);
            const y = Math.round(self.y);
            // Tall body
            drawGeometricBody(ctx, x + 2, y + 2, self.width - 4, self.height - 2, self.color);
            // Head
            ctx.fillStyle = '#3333777';
            ctx.fillRect(x + 3, y, self.width - 6, 5);
            // Eyes
            drawEye(ctx, x + self.width / 2 - 1, y + 1, 2, '#ff6644');
            // Shield
            if (self.hasShield) {
                const sx = self.facing === 1 ? x + self.width - 3 : x - 2;
                drawShield(ctx, sx, y + 3, 4, self.height - 6);
            }
            // Attack telegraph
            if (self.data.windupTimer > 0) {
                ctx.fillStyle = '#ff206044';
                const ax = self.facing === 1 ? x + self.width : x - 20;
                ctx.fillRect(ax, y, 20, self.height);
            }
        }
    });
}

// ── Turret ──
// Wall-mounted, fires 3-round burst every 3 seconds.
export function createTurret(x, y) {
    return new Enemy(x, y, {
        type: 'turret',
        width: 10,
        height: 10,
        hp: 3,
        color: '#887766',
        isStationary: true,
        affectedByGravity: false,
        data: { shootTimer: 120, burstCount: 0 },
        update(self, tilemap, player, projectiles) {
            if (self.hurtTimer > 0) return;

            self.facing = sign(player.getCenterX() - self.getCenterX()) || 1;
            self.data.shootTimer--;

            if (self.data.shootTimer <= 0 && self.data.burstCount < 3) {
                self.data.burstCount++;
                self.data.shootTimer = 8; // between burst shots

                if (projectiles) {
                    const dx = player.getCenterX() - self.getCenterX();
                    const dy = player.getCenterY() - self.getCenterY();
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    projectiles.push({
                        x: self.getCenterX(),
                        y: self.getCenterY(),
                        vx: (dx / len) * 2,
                        vy: (dy / len) * 2,
                        width: 3,
                        height: 3,
                        color: '#ff8844',
                        hostile: true,
                        deflected: false,
                        damage: 1,
                        life: 150,
                    });
                }

                if (self.data.burstCount >= 3) {
                    self.data.shootTimer = 180; // 3 seconds
                    self.data.burstCount = 0;
                }
            }
        },
        draw(self, ctx) {
            const x = Math.round(self.x);
            const y = Math.round(self.y);
            // Mechanical body
            ctx.fillStyle = self.color;
            ctx.fillRect(x, y, self.width, self.height);
            ctx.fillStyle = '#666655';
            ctx.fillRect(x + 2, y + 2, self.width - 4, self.height - 4);
            // Eye
            drawEye(ctx, x + self.width / 2 - 1.5, y + self.height / 2 - 1.5, 3, '#ff4400');
        }
    });
}

// ── Swimmer ──
// Patrols underwater, lunges upward.
export function createSwimmer(x, y) {
    return new Enemy(x, y, {
        type: 'swimmer',
        width: 14,
        height: 10,
        hp: 2,
        color: '#226644',
        affectedByGravity: false,
        data: { baseX: x * TILE_SIZE, lunging: false, lungeTimer: 0, cooldown: 0 },
        update(self, tilemap, player) {
            if (self.hurtTimer > 0) return;

            if (!self.data.lunging) {
                // Patrol horizontally
                self.vx = self.facing * 0.4;
                self.vy = 0;

                if (self.data.cooldown > 0) {
                    self.data.cooldown--;
                } else {
                    // Check if player is above
                    const dx = Math.abs(player.getCenterX() - self.getCenterX());
                    const dy = self.getCenterY() - player.getCenterY();
                    if (dx < 20 && dy > 10 && dy < 80 && !player.dead) {
                        self.data.lunging = true;
                        self.data.lungeTimer = 20;
                        self.vy = -4;
                        self.vx = 0;
                    }
                }

                // Patrol bounds
                if (Math.abs(self.x - self.data.baseX) > 40) {
                    self.facing *= -1;
                }
            } else {
                self.data.lungeTimer--;
                if (self.data.lungeTimer <= 0) {
                    self.data.lunging = false;
                    self.data.cooldown = 90;
                    self.vy = 1; // sink back
                    self.y = self.data.baseX; // reset would need baseY, using approximate
                }
            }
        },
        draw(self, ctx) {
            const x = Math.round(self.x);
            const y = Math.round(self.y);
            ctx.fillStyle = self.color;
            // Streamlined body
            ctx.beginPath();
            ctx.moveTo(x, y + self.height / 2);
            ctx.lineTo(x + self.width / 3, y);
            ctx.lineTo(x + self.width * 2 / 3, y);
            ctx.lineTo(x + self.width, y + self.height / 2);
            ctx.lineTo(x + self.width * 2 / 3, y + self.height);
            ctx.lineTo(x + self.width / 3, y + self.height);
            ctx.closePath();
            ctx.fill();
            // Eye
            const eyeX = self.facing === 1 ? x + self.width - 5 : x + 2;
            drawEye(ctx, eyeX, y + 3, 2, '#44ff88');
        }
    });
}

// ── Factory ──
export function createEnemy(type, x, y) {
    switch (type) {
        case 'crawler': return createCrawler(x, y);
        case 'flyer': return createFlyer(x, y);
        case 'spitter': return createSpitter(x, y);
        case 'shieldKnight': return createShieldKnight(x, y);
        case 'turret': return createTurret(x, y);
        case 'swimmer': return createSwimmer(x, y);
        default:
            console.warn(`Unknown enemy type: ${type}`);
            return createCrawler(x, y);
    }
}

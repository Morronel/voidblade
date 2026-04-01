import {
    RUN_SPEED, RUN_ACCEL, RUN_DECEL, AIR_ACCEL, AIR_DECEL,
    JUMP_FORCE, JUMP_CUT_MULTIPLIER, GRAVITY, MAX_FALL_SPEED,
    DASH_SPEED, DASH_DURATION, DASH_COOLDOWN,
    WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y, WALL_JUMP_LOCKOUT,
    ATTACK_DURATION, ATTACK_RANGE, COMBO_WINDOW, POGO_BOUNCE_FORCE,
    INVINCIBILITY_FRAMES, KNOCKBACK_FORCE,
    TIME_SLOW_FACTOR, PLAYER_TIME_SLOW_FACTOR, FOCUS_DRAIN_RATE, FOCUS_MAX,
} from './config.js';
import { approach, sign, dirFromInput, normalize } from './utils.js';
import { input } from './input.js';
import { applyGravity } from './physics.js';

function applyHorizontalMovement(player, accel, decel, maxSpeed) {
    const dir = input.hdir();
    if (dir !== 0) {
        player.vx = approach(player.vx, dir * maxSpeed, accel);
    } else {
        player.vx = approach(player.vx, 0, decel);
    }
}

function checkJump(player) {
    if (input.canJump()) {
        input.consumeJump();
        player.vy = JUMP_FORCE;
        player.onGround = false;
        player.setState('jump');
        return true;
    }
    // Double jump
    if (player.hasDoubleJump && !player.doubleJumpUsed && input.buffered('jump')) {
        player.doubleJumpUsed = true;
        player.vy = JUMP_FORCE * 0.9;
        player.setState('jump');
        return true;
    }
    return false;
}

function checkDash(player, particles) {
    if (!player.hasDash) return false;
    if (input.justPressed('dash') && player.canDash && player.dashCooldown <= 0) {
        const { dx, dy } = dirFromInput(input);
        if (dx === 0 && dy === 0) {
            player.dashDirX = player.facing;
            player.dashDirY = 0;
        } else {
            const n = normalize(dx, dy);
            player.dashDirX = n.dx;
            player.dashDirY = n.dy;
        }
        player.setState('dash');
        return true;
    }
    return false;
}

function checkAttack(player) {
    if (input.justPressed('attack')) {
        if (input.isDown('up')) {
            player.attackDir = 'up';
        } else if (input.isDown('down') && !player.onGround) {
            player.attackDir = 'down';
        } else {
            player.attackDir = 'forward';
        }
        player.setState('attack');
        return true;
    }
    return false;
}

function checkWallSlide(player) {
    if (!player.hasWallJump) return false;
    if (!player.onGround && player.vy > 0) {
        const dir = input.hdir();
        if (dir === -1 && player.onWallLeft) {
            player.facing = 1; // face away from wall
            player.setState('wallSlide');
            return true;
        }
        if (dir === 1 && player.onWallRight) {
            player.facing = -1;
            player.setState('wallSlide');
            return true;
        }
    }
    return false;
}

export function createStates() {
    return {
        // ── IDLE ──
        idle: {
            enter(p) {
                p.vx = 0;
            },
            update(p, tilemap, particles) {
                applyGravity(p);
                applyHorizontalMovement(p, RUN_ACCEL, RUN_DECEL, RUN_SPEED);

                if (checkAttack(p)) return;
                if (checkDash(p, particles)) return;
                if (checkJump(p)) return;

                if (!p.onGround) {
                    p.setState('fall');
                    return;
                }
                if (Math.abs(p.vx) > 0.5) {
                    p.setState('run');
                }
            },
            exit() {}
        },

        // ── RUN ──
        run: {
            enter() {},
            update(p, tilemap, particles) {
                applyGravity(p);
                applyHorizontalMovement(p, RUN_ACCEL, RUN_DECEL, RUN_SPEED);

                // Run dust
                if (particles && p.stateTimer % 4 === 0) {
                    particles.runDust(
                        p.x + p.width / 2,
                        p.y + p.height,
                        p.facing
                    );
                }

                if (checkAttack(p)) return;
                if (checkDash(p, particles)) return;
                if (checkJump(p)) return;

                if (!p.onGround) {
                    p.setState('fall');
                    return;
                }
                if (Math.abs(p.vx) < 0.3) {
                    p.setState('idle');
                }
            },
            exit() {}
        },

        // ── JUMP ──
        jump: {
            enter(p) {},
            update(p, tilemap, particles) {
                applyGravity(p);
                applyHorizontalMovement(p, AIR_ACCEL, AIR_DECEL, RUN_SPEED);

                // Variable jump height — release early for short hop
                if (!input.isDown('jump') && p.vy < 0) {
                    p.vy *= JUMP_CUT_MULTIPLIER;
                    p.setState('fall');
                    return;
                }

                if (checkAttack(p)) return;
                if (checkDash(p, particles)) return;
                if (checkWallSlide(p)) return;

                if (p.vy >= 0) {
                    p.setState('fall');
                }
            },
            exit() {}
        },

        // ── FALL ──
        fall: {
            enter() {},
            update(p, tilemap, particles) {
                applyGravity(p);
                applyHorizontalMovement(p, AIR_ACCEL, AIR_DECEL, RUN_SPEED);

                if (checkAttack(p)) return;
                if (checkDash(p, particles)) return;
                if (checkJump(p)) return; // coyote + double jump
                if (checkWallSlide(p)) return;

                if (p.onGround) {
                    if (particles) {
                        particles.landingDust(p.x + p.width / 2, p.y + p.height);
                    }
                    p.setState(Math.abs(p.vx) > 0.5 ? 'run' : 'idle');
                }
            },
            exit() {}
        },

        // ── DASH ──
        dash: {
            enter(p) {
                p.dashTimer = DASH_DURATION;
                p.dashCooldown = DASH_COOLDOWN;
                p.canDash = false;
                p.vy = 0;
                p.vx = 0;
                p.attacking = false; // cancel attack
            },
            update(p, tilemap, particles, effects) {
                p.dashTimer--;
                p.vx = p.dashDirX * DASH_SPEED;
                p.vy = p.dashDirY * DASH_SPEED;

                // Afterimage
                if (p.dashTimer % 2 === 0) {
                    p.afterimages.push({
                        x: p.x, y: p.y,
                        life: 8, maxLife: 8
                    });
                }

                // Dash particles
                if (particles) {
                    particles.dashTrail(p.getCenterX(), p.getCenterY());
                }

                // Dash-slash: attack during dash
                if (input.justPressed('attack')) {
                    p.attackDir = 'forward';
                    p.setState('attack');
                    return;
                }

                if (p.dashTimer <= 0) {
                    p.vx *= 0.3;
                    p.vy *= 0.3;
                    p.setState(p.onGround ? 'idle' : 'fall');
                }
            },
            exit(p) {
                // Recharge dash on ground
                if (p.onGround) p.canDash = true;
            }
        },

        // ── WALL SLIDE ──
        wallSlide: {
            enter(p) {
                p.vy = 0;
            },
            update(p, tilemap, particles) {
                p.vy = WALL_SLIDE_SPEED;

                // Wall slide sparks
                if (particles && p.stateTimer % 3 === 0) {
                    const wx = p.onWallLeft ? p.x : p.x + p.width;
                    particles.wallSlideSparks(wx, p.y + p.height * 0.5);
                }

                // Wall jump
                if (input.buffered('jump')) {
                    p.setState('wallJump');
                    return;
                }

                if (checkDash(p, particles)) return;

                // Release wall
                const holdingWall = (input.hdir() === -1 && p.onWallLeft) ||
                                    (input.hdir() === 1 && p.onWallRight);
                if (!holdingWall || p.onGround) {
                    p.setState(p.onGround ? 'idle' : 'fall');
                }
            },
            exit() {}
        },

        // ── WALL JUMP ──
        wallJump: {
            enter(p) {
                // Jump away from wall
                const wallDir = p.onWallLeft ? -1 : 1;
                p.vx = -wallDir * WALL_JUMP_FORCE_X;
                p.vy = WALL_JUMP_FORCE_Y;
                p.facing = -wallDir;
            },
            update(p, tilemap, particles) {
                applyGravity(p);

                // Lockout period — no air control
                if (p.stateTimer < WALL_JUMP_LOCKOUT) {
                    // No horizontal input allowed
                } else {
                    applyHorizontalMovement(p, AIR_ACCEL, AIR_DECEL, RUN_SPEED);
                }

                if (checkAttack(p)) return;
                if (checkDash(p, particles)) return;
                if (checkWallSlide(p)) return;

                if (p.vy >= 0) {
                    p.setState('fall');
                }
                if (p.onGround) {
                    p.setState('idle');
                }
            },
            exit() {}
        },

        // ── ATTACK ──
        attack: {
            enter(p) {
                p.attacking = true;
                p.attackTimer = ATTACK_DURATION;
                p.hasHitThisSwing = false;

                // Determine hitbox based on direction
                const cx = p.getCenterX();
                const cy = p.getCenterY();
                const range = ATTACK_RANGE;

                if (p.attackDir === 'up') {
                    p.attackHitbox = {
                        x: cx - range / 2,
                        y: cy - range - 4,
                        w: range,
                        h: range
                    };
                } else if (p.attackDir === 'down') {
                    p.attackHitbox = {
                        x: cx - range / 2,
                        y: cy + 4,
                        w: range,
                        h: range
                    };
                } else {
                    p.attackHitbox = {
                        x: p.facing === 1 ? cx : cx - range,
                        y: cy - range / 3,
                        w: range,
                        h: range * 0.7
                    };
                }

                // Slight movement boost during slash
                if (p.attackDir === 'forward') {
                    p.vx += p.facing * 1.5;
                }

                // Combo tracking
                if (p.comboCount < 3) {
                    p.comboCount++;
                } else {
                    p.comboCount = 1;
                }
            },
            update(p, tilemap, particles, effects, combat, enemies) {
                applyGravity(p);

                // Slow down slightly during attack
                p.vx *= 0.9;

                // Air movement still allowed (reduced)
                if (!p.onGround) {
                    const dir = input.hdir();
                    if (dir !== 0) p.vx = approach(p.vx, dir * RUN_SPEED * 0.5, AIR_ACCEL * 0.5);
                }

                p.attackTimer--;

                // Check combat hits
                if (combat && !p.hasHitThisSwing && p.attackHitbox) {
                    combat.checkPlayerAttack(p, enemies, particles, effects);
                }

                if (p.attackTimer <= 0) {
                    p.attacking = false;
                    p.attackHitbox = null;

                    // Check for buffered combo
                    if (input.buffered('attack') && p.comboCount < 3) {
                        if (input.isDown('up')) p.attackDir = 'up';
                        else if (input.isDown('down') && !p.onGround) p.attackDir = 'down';
                        else p.attackDir = 'forward';
                        p.setState('attack');
                        return;
                    }

                    p.comboCount = 0;
                    if (p.onGround) {
                        p.setState(Math.abs(p.vx) > 0.5 ? 'run' : 'idle');
                    } else {
                        p.setState('fall');
                    }
                }
            },
            exit(p) {
                p.attacking = false;
                p.attackHitbox = null;
            }
        },

        // ── HURT ──
        hurt: {
            enter(p) {
                p.attacking = false;
                p.attackHitbox = null;
            },
            update(p) {
                applyGravity(p);
                p.vx *= 0.85; // friction during knockback

                if (p.stateTimer > 15) {
                    if (p.onGround) {
                        p.setState('idle');
                    } else {
                        p.setState('fall');
                    }
                }
            },
            exit() {}
        },

        // ── DEATH ──
        death: {
            enter(p) {
                p.vx = 0;
                p.vy = 0;
                p.attacking = false;
                p.attackHitbox = null;
            },
            update(p, tilemap, particles) {
                // Dissolve particles on first frame
                if (p.stateTimer === 1 && particles) {
                    particles.playerDeathBurst(p.getCenterX(), p.getCenterY());
                }
                // Room resets handled by main.js checking p.dead + stateTimer
            },
            exit() {}
        },
    };
}

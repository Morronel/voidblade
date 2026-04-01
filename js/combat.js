import { HITSTOP_FRAMES, KNOCKBACK_FORCE, POGO_BOUNCE_FORCE, ATTACK_RANGE } from './config.js';
import { aabbOverlap, sign } from './utils.js';

export class CombatSystem {
    constructor() {
        this.hitstopTimer = 0;
        this.hitstopEntities = []; // entities frozen during hitstop
    }

    get inHitstop() {
        return this.hitstopTimer > 0;
    }

    update() {
        if (this.hitstopTimer > 0) {
            this.hitstopTimer--;
            if (this.hitstopTimer <= 0) {
                this.hitstopEntities = [];
            }
        }
    }

    triggerHitstop(entities) {
        this.hitstopTimer = HITSTOP_FRAMES;
        this.hitstopEntities = entities || [];
    }

    isEntityFrozen(entity) {
        return this.hitstopTimer > 0 && this.hitstopEntities.includes(entity);
    }

    // Check if player's attack hitbox hits any enemies
    checkPlayerAttack(player, enemies, particles, effects) {
        if (!player.attackHitbox || player.hasHitThisSwing) return;
        if (!enemies) return;

        for (const enemy of enemies) {
            if (enemy.dead || enemy.invincibleTimer > 0) continue;

            const enemyBox = enemy.getHitbox();
            if (!aabbOverlap(player.attackHitbox, enemyBox)) continue;

            // Check shield
            if (enemy.hasShield && enemy.isShieldFacing(player)) {
                // Deflected by shield
                if (particles) {
                    particles.slashSparks(
                        enemyBox.x + enemyBox.w / 2,
                        enemyBox.y + enemyBox.h / 2,
                        -player.facing,
                        '#ffdd44'
                    );
                }
                player.vx = -player.facing * 3; // pushback
                player.hasHitThisSwing = true;
                this.triggerHitstop([player]);
                return;
            }

            // Hit!
            const knockDir = sign(enemy.getCenterX() - player.getCenterX()) || player.facing;
            enemy.takeDamage(1, knockDir, particles);

            player.hasHitThisSwing = true;

            // Hitstop
            this.triggerHitstop([player, enemy]);

            // Screenshake
            if (effects) effects.shakeCamera(3);

            // Hit slow-mo
            if (effects) effects.hitSlowMo(8);

            // Sparks at hit point
            if (particles) {
                particles.slashSparks(
                    enemyBox.x + enemyBox.w / 2,
                    enemyBox.y + enemyBox.h / 2,
                    knockDir
                );
            }

            // Pogo bounce if down-attacking
            if (player.attackDir === 'down') {
                player.vy = POGO_BOUNCE_FORCE;
            }

            break; // one hit per swing
        }
    }

    // Check enemy projectile vs player deflect
    checkDeflect(player, projectile) {
        if (!player.attacking || !player.attackHitbox) return false;
        const projBox = { x: projectile.x, y: projectile.y, w: projectile.width, h: projectile.height };
        return aabbOverlap(player.attackHitbox, projBox);
    }

    // Check enemy hitboxes vs player
    checkEnemyContact(player, enemies, particles, effects, camera) {
        if (player.invincibleTimer > 0 || player.dead) return;
        if (player.currentState === 'dash') return; // i-frames

        for (const enemy of enemies) {
            if (enemy.dead) continue;

            const playerBox = player.getHitbox();
            const enemyBox = enemy.getHitbox();

            if (aabbOverlap(playerBox, enemyBox)) {
                const knockDir = sign(player.getCenterX() - enemy.getCenterX()) || 1;
                player.takeDamage(enemy.contactDamage || 1, knockDir, particles, effects, camera);
                return;
            }
        }
    }

    // Check projectiles vs player
    checkProjectiles(player, projectiles, particles, effects, camera) {
        if (player.invincibleTimer > 0 || player.dead) return;
        if (player.currentState === 'dash') return;

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            if (!proj.hostile) continue;

            const projBox = { x: proj.x, y: proj.y, w: proj.width || 4, h: proj.height || 4 };
            const playerBox = player.getHitbox();

            // Check deflect first
            if (this.checkDeflect(player, proj)) {
                // Deflect!
                proj.vx *= -1.5;
                proj.vy *= -0.5;
                proj.hostile = false;
                proj.deflected = true;

                if (particles) {
                    particles.slashSparks(proj.x, proj.y, sign(proj.vx), '#ffdd44');
                }
                this.triggerHitstop([player]);
                if (effects) effects.shakeCamera(2);
                continue;
            }

            if (aabbOverlap(playerBox, projBox)) {
                const knockDir = sign(player.getCenterX() - proj.x) || 1;
                player.takeDamage(proj.damage || 1, knockDir, particles, effects, camera);
                projectiles.splice(i, 1);
                return;
            }
        }
    }
}

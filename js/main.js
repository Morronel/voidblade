import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, FOCUS_DRAIN_RATE, FOCUS_MAX, COLORS, ROOM_COLORS } from './config.js';
import { input } from './input.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { ParticleSystem } from './particles.js';
import { Effects } from './effects.js';
import { CombatSystem } from './combat.js';
import { RoomManager } from './room-manager.js';
import { HUD } from './hud.js';
import { AudioManager } from './audio.js';
import { CathedralGuardian } from './boss.js';

// ── Canvas Setup ──
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
ctx.imageSmoothingEnabled = false;

// ── Game State ──
const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, DEAD: 3 };
let gameState = STATE.MENU;
let menuTimer = 0;

// ── Systems ──
const camera = new Camera();
const particles = new ParticleSystem();
const effects = new Effects(camera);
const combat = new CombatSystem();
const roomManager = new RoomManager();
const hud = new HUD();
const audio = new AudioManager();

// ── Boss ──
let boss = null;

// ── Player ──
let player = new Player(48, 200);

// ── Death/restart ──
let deathTimer = 0;
let currentSpawn = { x: 48, y: 200 };

// ── Ambient particle timer ──
let ambientTimer = 0;

// ── Save Data ──
let saveData = loadSave();

// ── Init ──
function init() {
    // Apply save data abilities
    if (saveData.abilities) {
        player.hasDash = saveData.abilities.dash !== undefined ? saveData.abilities.dash : true;
        player.hasWallJump = saveData.abilities.wallJump !== undefined ? saveData.abilities.wallJump : true;
        player.hasTimeSlow = saveData.abilities.timeSlow !== undefined ? saveData.abilities.timeSlow : true;
        player.hasDoubleJump = saveData.abilities.doubleJump || false;
    }

    // Load starting room
    const startRoom = saveData.room || 'room-01';
    roomManager.loadRoom(startRoom, effects);
    camera.setRoomBounds(roomManager.tilemap.pixelWidth, roomManager.tilemap.pixelHeight);

    const spawn = roomManager.getPlayerSpawn();
    player.reset(spawn.x, spawn.y);
    currentSpawn = { ...spawn };
    camera.follow(player.getCenterX(), player.getCenterY(), true);

    gameState = STATE.MENU;
    menuTimer = 0;
}

// ── Game Loop ──
const TICK_RATE = 1 / 60;
let accumulator = 0;
let lastTime = 0;

function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap to prevent spiral
    lastTime = timestamp;
    accumulator += dt;

    while (accumulator >= TICK_RATE) {
        update();
        accumulator -= TICK_RATE;
    }

    render();
    requestAnimationFrame(loop);
}

// ── Update ──
function update() {
    input.update();

    switch (gameState) {
        case STATE.MENU:
            menuTimer++;
            if (input.justPressed('jump') || input.justPressed('attack')) {
                gameState = STATE.PLAYING;
                effects.showRoomName(roomManager.currentRoom?.name || '');
                audio.init();
                audio.resume();
                audio.startAmbient(roomManager.currentRoomId);
            }
            break;

        case STATE.PLAYING:
            updatePlaying();
            break;

        case STATE.PAUSED:
            if (input.justPressed('pause')) {
                gameState = STATE.PLAYING;
            }
            break;

        case STATE.DEAD:
            deathTimer++;
            particles.update();
            if (deathTimer > 30) {
                // Reset room
                roomManager.loadRoom(roomManager.currentRoomId, null);
                camera.setRoomBounds(roomManager.tilemap.pixelWidth, roomManager.tilemap.pixelHeight);
                player.reset(currentSpawn.x, currentSpawn.y);
                camera.follow(player.getCenterX(), player.getCenterY(), true);
                particles.clear();
                gameState = STATE.PLAYING;
            }
            break;
    }
}

function updatePlaying() {
    // Pause
    if (input.justPressed('pause')) {
        gameState = STATE.PAUSED;
        return;
    }

    // Time slow
    const timeFactor = effects.getTimeFactor();
    const playerTimeFactor = effects.getPlayerTimeFactor();

    // Player time slow input
    if (player.hasTimeSlow && input.isDown('timeSlow') && player.focus > 0) {
        player.timeSlow = true;
        effects.timeSlowActive = true;
        player.focus -= FOCUS_DRAIN_RATE * (1 / 60);
        if (player.focus <= 0) {
            player.focus = 0;
            player.timeSlow = false;
            effects.timeSlowActive = false;
        }
    } else {
        player.timeSlow = false;
        effects.timeSlowActive = false;
    }

    // Combat system
    combat.update();

    // Skip updates during hitstop for frozen entities
    if (!combat.isEntityFrozen(player)) {
        player.update(roomManager.tilemap, particles, effects, combat, roomManager.enemies);
    }

    // Enemies
    for (const enemy of roomManager.enemies) {
        if (!combat.isEntityFrozen(enemy) && !enemy.dead) {
            enemy.update(roomManager.tilemap, player, roomManager.projectiles, particles);
        }
    }

    // Projectiles
    roomManager.updateProjectiles();

    // Combat checks
    combat.checkEnemyContact(player, roomManager.enemies, particles, effects, camera);
    combat.checkProjectiles(player, roomManager.projectiles, particles, effects, camera);

    // Camera
    camera.follow(player.getCenterX(), player.getCenterY());
    camera.update();

    // Effects
    effects.update();

    // Particles
    particles.update();

    // Ambient particles
    ambientTimer++;
    if (ambientTimer % 30 === 0) {
        const colors = ROOM_COLORS[roomManager.currentRoomId];
        particles.ambientMotes(
            camera.x, camera.y,
            GAME_WIDTH, GAME_HEIGHT,
            (colors?.accent || '#00fff5') + '22'
        );
    }

    // Door check
    const door = roomManager.checkDoors(player);
    if (door && effects.transitionTimer <= 0) {
        roomManager.transition(door, player, camera, effects, () => {
            currentSpawn = { x: player.x, y: player.y };
            boss = null;
            // Check if new room is boss room
            if (roomManager.currentRoom?.bossRoom && roomManager.currentRoom.bossSpawn) {
                const bs = roomManager.currentRoom.bossSpawn;
                boss = new CathedralGuardian(bs.x, bs.y);
                audio.startBossMusic();
            } else {
                audio.startAmbient(roomManager.currentRoomId);
            }
        });
    }

    // Death check
    if (player.dead && player.stateTimer > 20) {
        effects.triggerInvert();
        gameState = STATE.DEAD;
        deathTimer = 0;
    }

    // Boss update
    if (boss && !boss.dead) {
        if (!combat.isEntityFrozen(boss)) {
            boss.update(roomManager.tilemap, player, roomManager.projectiles, particles);
        }
        // Boss contact damage
        if (!player.dead && player.invincibleTimer <= 0 && player.currentState !== 'dash') {
            const bh = boss.getHitbox();
            const ph = player.getHitbox();
            if (bh.x < ph.x + ph.w && bh.x + bh.w > ph.x && bh.y < ph.y + ph.h && bh.y + bh.h > ph.y) {
                const kd = player.getCenterX() > boss.getCenterX() ? 1 : -1;
                player.takeDamage(boss.contactDamage, kd, particles, effects, camera);
                audio.playerHurt();
            }
        }
        // Boss attack hitbox vs player
        if (boss.attackHitbox && !player.dead && player.invincibleTimer <= 0 && player.currentState !== 'dash') {
            const ah = boss.attackHitbox;
            const ph = player.getHitbox();
            if (ah.x < ph.x + ph.w && ah.x + ah.w > ph.x && ah.y < ph.y + ph.h && ah.y + ah.h > ph.y) {
                const kd = player.getCenterX() > boss.getCenterX() ? 1 : -1;
                player.takeDamage(boss.contactDamage, kd, particles, effects, camera);
                audio.playerHurt();
                boss.attackHitbox = null;
            }
        }
        // Player attacks boss
        if (player.attacking && player.attackHitbox && !player.hasHitThisSwing) {
            const ah = player.attackHitbox;
            const bh = boss.getHitbox();
            if (ah.x < bh.x + bh.w && ah.x + ah.w > bh.x && ah.y < bh.y + bh.h && ah.y + ah.h > bh.y) {
                const kd = boss.getCenterX() > player.getCenterX() ? 1 : -1;
                boss.takeDamage(1, kd, particles);
                player.hasHitThisSwing = true;
                combat.triggerHitstop([player, boss]);
                effects.shakeCamera(3);
                effects.hitSlowMo(8);
                audio.hit();
                if (boss.dead) {
                    audio.bossDeath();
                    player.hasDoubleJump = true;
                    effects.flash('#c8a832', 20);
                    camera.shake(8);
                }
            }
        }
    }

    // Bench save check
    if (roomManager.checkBench(player) && input.isDown('down') && player.onGround) {
        save();
        currentSpawn = { x: player.x, y: player.y };
        player.hp = player.maxHp;
        effects.flash('#00fff5', 8);
    }

    // Upgrade pickup check
    const room = roomManager.currentRoom;
    if (room && room.hasUpgrade && room.upgradePos) {
        const dx = Math.abs(player.getCenterX() - room.upgradePos.x);
        const dy = Math.abs(player.getCenterY() - room.upgradePos.y);
        if (dx < 20 && dy < 20) {
            if (room.hasUpgrade === 'timeSlow' && !player.hasTimeSlow) {
                player.hasTimeSlow = true;
                audio.pickup();
                effects.flash('#ccaaff', 15);
                room.hasUpgrade = null;
            } else if (room.hasUpgrade === 'healthUp') {
                player.maxHp++;
                player.hp = player.maxHp;
                audio.pickup();
                effects.flash('#33ff99', 15);
                room.hasUpgrade = null;
            }
        }
    }

    // Breakable wall check (attack them)
    if (player.attacking && player.attackHitbox) {
        checkBreakableWalls(player);
    }
}

function checkBreakableWalls(player) {
    const hb = player.attackHitbox;
    const ts = TILE_SIZE;
    const startTx = Math.floor(hb.x / ts);
    const endTx = Math.floor((hb.x + hb.w) / ts);
    const startTy = Math.floor(hb.y / ts);
    const endTy = Math.floor((hb.y + hb.h) / ts);

    for (let ty = startTy; ty <= endTy; ty++) {
        for (let tx = startTx; tx <= endTx; tx++) {
            if (roomManager.tilemap.get(tx, ty) === 3) { // BREAKABLE
                roomManager.tilemap.set(tx, ty, 0);
                particles.enemyDeath(tx * ts + ts / 2, ty * ts + ts / 2, '#666666');
                camera.shake(2);
            }
        }
    }
}

// ── Render ──
function render() {
    // Clear
    const bgColor = ROOM_COLORS[roomManager.currentRoomId]?.bg || COLORS.bg;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    switch (gameState) {
        case STATE.MENU:
            renderMenu();
            break;
        case STATE.PLAYING:
        case STATE.DEAD:
            renderGame();
            break;
        case STATE.PAUSED:
            renderGame();
            renderPause();
            break;
    }
}

function renderGame() {
    ctx.save();
    camera.applyTransform(ctx);

    // Tilemap
    roomManager.tilemap.draw(ctx, camera);

    // Projectiles
    roomManager.drawProjectiles(ctx);

    // Enemies
    for (const enemy of roomManager.enemies) {
        enemy.draw(ctx);
    }

    // Boss
    if (boss) boss.draw(ctx);

    // Upgrade pickups
    const rm = roomManager.currentRoom;
    if (rm && rm.hasUpgrade && rm.upgradePos) {
        const ux = rm.upgradePos.x;
        const uy = rm.upgradePos.y + Math.sin(Date.now() * 0.003) * 3;
        ctx.fillStyle = rm.hasUpgrade === 'timeSlow' ? '#8844ff' : '#33ff99';
        ctx.beginPath();
        ctx.arc(ux, uy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = (rm.hasUpgrade === 'timeSlow' ? '#8844ff' : '#33ff99') + '33';
        ctx.beginPath();
        ctx.arc(ux, uy, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player
    player.draw(ctx);
    player.drawAttackArc(ctx);

    // Particles (world space)
    particles.draw(ctx);

    ctx.restore();
    camera.resetTransform(ctx);

    // HUD (screen space)
    hud.draw(ctx, player);

    // Effects (screen space)
    effects.draw(ctx);
}

function renderMenu() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    const pulse = Math.sin(menuTimer * 0.05) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.playerVisor;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOIDBLADE', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    ctx.globalAlpha = 1;

    // Subtitle
    ctx.fillStyle = '#666666';
    ctx.font = '6px monospace';
    ctx.fillText('A fractured automaton awakens...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5);

    // Prompt
    if (menuTimer % 60 < 40) {
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Press JUMP or ATTACK to begin', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    }

    // Controls hint
    ctx.fillStyle = '#444444';
    ctx.font = '5px monospace';
    ctx.fillText('ARROWS/WASD: Move  |  Z/SPACE: Jump  |  X/J: Attack', GAME_WIDTH / 2, GAME_HEIGHT - 30);
    ctx.fillText('C/SHIFT: Dash  |  V/K: Time Slow  |  ESC: Pause', GAME_WIDTH / 2, GAME_HEIGHT - 20);
    ctx.textAlign = 'left';
}

function renderPause() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ctx.fillStyle = '#888888';
    ctx.font = '6px monospace';
    ctx.fillText('Press ESC to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15);
    ctx.textAlign = 'left';
}

// ── Save/Load ──
function loadSave() {
    try {
        const data = localStorage.getItem('voidblade_save');
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
}

function save() {
    const data = {
        room: roomManager.currentRoomId,
        abilities: {
            dash: player.hasDash,
            wallJump: player.hasWallJump,
            timeSlow: player.hasTimeSlow,
            doubleJump: player.hasDoubleJump,
        },
        hp: player.hp,
    };
    try {
        localStorage.setItem('voidblade_save', JSON.stringify(data));
    } catch (e) {
        // Silently fail
    }
}

// ── Start ──
init();
requestAnimationFrame(loop);

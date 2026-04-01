// ── Display ──
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 16;

// ── Physics ──
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 10;
export const JUMP_FORCE = -10.5;
export const JUMP_CUT_MULTIPLIER = 0.4;
export const COYOTE_FRAMES = 7;
export const JUMP_BUFFER_FRAMES = 6;
export const APEX_GRAVITY_MULTIPLIER = 0.5;
export const APEX_THRESHOLD = 2.0;

// ── Movement ──
export const RUN_SPEED = 3.5;
export const RUN_ACCEL = 1.2;
export const RUN_DECEL = 1.8;
export const AIR_ACCEL = 0.8;
export const AIR_DECEL = 0.4;

// ── Dash ──
export const DASH_SPEED = 15;
export const DASH_DURATION = 8;
export const DASH_COOLDOWN = 36;

// ── Wall ──
export const WALL_SLIDE_SPEED = 1.5;
export const WALL_JUMP_FORCE_X = 6;
export const WALL_JUMP_FORCE_Y = -10;
export const WALL_JUMP_LOCKOUT = 6;

// ── Combat ──
export const ATTACK_DURATION = 10;
export const HITSTOP_FRAMES = 4;
export const KNOCKBACK_FORCE = 5;
export const INVINCIBILITY_FRAMES = 40;
export const POGO_BOUNCE_FORCE = -8.5;
export const PLAYER_MAX_HP = 5;
export const ATTACK_RANGE = 24; // 1.5 tiles
export const COMBO_WINDOW = 20; // frames to chain next attack

// ── Time Slow ──
export const TIME_SLOW_FACTOR = 0.3;
export const PLAYER_TIME_SLOW_FACTOR = 0.7;
export const FOCUS_DRAIN_RATE = 1.5;
export const FOCUS_MAX = 100;

// ── Camera ──
export const CAMERA_LERP = 0.1;
export const SHAKE_DECAY = 0.85;

// ── Player Size ──
export const PLAYER_WIDTH = 10;
export const PLAYER_HEIGHT = 14;

// ── Colors ──
export const COLORS = {
    bg: '#0a0a12',
    playerBody: '#1a1a2e',
    playerVisor: '#00fff5',
    playerCloak: '#2d1b69',
    cloakGlow: '#00fff5',
    slash: '#ffffff',
    dashTrail: '#00fff5',
    danger: '#ff2060',
    blood: '#cc1144',
    spark: '#ffdd44',
    wallSpark: '#ff8833',
    ambient: '#00fff533',
};

// ── Room Colors ──
export const ROOM_COLORS = {
    'room-01': { accent: '#00fff5', bg: '#0d0d1a', tile: '#2a2a3a' },
    'room-02': { accent: '#c8a832', bg: '#0a1014', tile: '#1e3030' },
    'room-03': { accent: '#ff8833', bg: '#0a0a18', tile: '#1a1a40' },
    'room-04': { accent: '#ffffff', bg: '#100a1a', tile: '#2d1b69' },
    'room-05': { accent: '#c8a832', bg: '#0a0a18', tile: '#1a1a40' },
    'room-06': { accent: '#ff3333', bg: '#121008', tile: '#3a2a1a' },
    'room-07': { accent: '#c8a832', bg: '#0a1020', tile: '#1a2a4a' },
    'room-08': { accent: '#aacc22', bg: '#040a08', tile: '#1a2a1a' },
    'room-09': { accent: '#ccaaff', bg: '#100a14', tile: '#2a1a3a' },
    'room-10': { accent: '#33ff99', bg: '#040a08', tile: '#1a3a1a' },
};

// ── Keybinds ──
export const KEYS = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    jump: ['KeyZ', 'Space'],
    attack: ['KeyX', 'KeyJ'],
    dash: ['KeyC', 'ShiftLeft', 'ShiftRight'],
    timeSlow: ['KeyV', 'KeyK'],
    pause: ['Escape', 'KeyP'],
};

// ── Tiles ──
export const TILE = {
    AIR: 0,
    SOLID: 1,
    PLATFORM: 2,
    BREAKABLE: 3,
    WATER: 4,
    SPIKE: 5,
    DOOR_RIGHT: 6,
    DOOR_LEFT: 7,
    DOOR_UP: 8,
    DOOR_DOWN: 9,
    SAVE: 10,
    CRUMBLE: 11,
    STEAM: 12,
};

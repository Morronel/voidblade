import { GRAVITY, MAX_FALL_SPEED, TILE_SIZE, APEX_GRAVITY_MULTIPLIER, APEX_THRESHOLD, TILE } from './config.js';

// ── Collision Result ──
export function createCollisionResult() {
    return { left: false, right: false, top: false, bottom: false };
}

// ── Apply Gravity ──
export function applyGravity(entity, timeFactor = 1) {
    let grav = GRAVITY;
    // Floaty apex
    if (Math.abs(entity.vy) < APEX_THRESHOLD) {
        grav *= APEX_GRAVITY_MULTIPLIER;
    }
    entity.vy += grav * timeFactor;
    if (entity.vy > MAX_FALL_SPEED) entity.vy = MAX_FALL_SPEED;
}

// ── Tile Collision Helpers ──
function isSolidTile(tile) {
    return tile === TILE.SOLID || tile === TILE.BREAKABLE || tile === TILE.CRUMBLE;
}

function isSolidAt(tilemap, tx, ty) {
    const tile = tilemap.get(tx, ty);
    return isSolidTile(tile);
}

function isPlatformAt(tilemap, tx, ty) {
    return tilemap.get(tx, ty) === TILE.PLATFORM;
}

// ── Move and Collide ──
// Moves entity, resolves collisions against tilemap
// Returns collision flags { left, right, top, bottom }
export function moveAndCollide(entity, tilemap) {
    const result = createCollisionResult();

    // Move X
    entity.x += entity.vx;
    resolveX(entity, tilemap, result);

    // Move Y
    entity.y += entity.vy;
    resolveY(entity, tilemap, result);

    return result;
}

function resolveX(entity, tilemap, result) {
    const left = Math.floor(entity.x / TILE_SIZE);
    const right = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
    const top = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (!isSolidAt(tilemap, tx, ty)) continue;

            const tileLeft = tx * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;

            if (entity.vx > 0) {
                // Moving right, push left
                if (entity.x + entity.width > tileLeft && entity.x < tileLeft) {
                    entity.x = tileLeft - entity.width;
                    entity.vx = 0;
                    result.right = true;
                }
            } else if (entity.vx < 0) {
                // Moving left, push right
                if (entity.x < tileRight && entity.x + entity.width > tileRight) {
                    entity.x = tileRight;
                    entity.vx = 0;
                    result.left = true;
                }
            }
        }
    }
}

function resolveY(entity, tilemap, result) {
    const left = Math.floor(entity.x / TILE_SIZE);
    const right = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
    const top = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            const tile = tilemap.get(tx, ty);
            const tileTop = ty * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;

            const isSolid = isSolidTile(tile);
            const isPlatform = tile === TILE.PLATFORM;

            if (entity.vy > 0) {
                // Falling — check solid or platform
                if (isSolid || isPlatform) {
                    // For platforms, only collide if feet were above platform top
                    if (isPlatform) {
                        const prevBottom = entity.y + entity.height - entity.vy;
                        if (prevBottom > tileTop + 2) continue; // was already inside/below
                        if (entity.dropThrough) continue;
                    }
                    if (entity.y + entity.height > tileTop && entity.y < tileTop) {
                        entity.y = tileTop - entity.height;
                        entity.vy = 0;
                        result.bottom = true;
                    }
                }
            } else if (entity.vy < 0 && isSolid) {
                // Rising — only solid tiles
                if (entity.y < tileBottom && entity.y + entity.height > tileBottom) {
                    entity.y = tileBottom;
                    entity.vy = 0;
                    result.top = true;
                }
            }
        }
    }
}

// ── Wall Check ──
// Check if entity is touching a wall on the given side
export function checkWall(entity, tilemap, side) {
    const checkX = side === 'left'
        ? entity.x - 1
        : entity.x + entity.width + 1;
    const top = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);
    const tx = Math.floor(checkX / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        if (isSolidAt(tilemap, tx, ty)) return true;
    }
    return false;
}

// ── Ground Check ──
export function checkGround(entity, tilemap) {
    const checkY = entity.y + entity.height + 1;
    const left = Math.floor(entity.x / TILE_SIZE);
    const right = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
    const ty = Math.floor(checkY / TILE_SIZE);

    for (let tx = left; tx <= right; tx++) {
        const tile = tilemap.get(tx, ty);
        if (isSolidTile(tile)) return true;
        if (tile === TILE.PLATFORM && !entity.dropThrough) return true;
    }
    return false;
}

// ── Spike Check ──
export function checkSpikes(entity, tilemap) {
    const left = Math.floor(entity.x / TILE_SIZE);
    const right = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
    const top = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (tilemap.get(tx, ty) === TILE.SPIKE) return true;
        }
    }
    return false;
}

// ── Water Check ──
export function checkWater(entity, tilemap) {
    const cx = Math.floor((entity.x + entity.width / 2) / TILE_SIZE);
    const cy = Math.floor((entity.y + entity.height / 2) / TILE_SIZE);
    return tilemap.get(cx, cy) === TILE.WATER;
}

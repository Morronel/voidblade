import { TILE_SIZE, TILE, GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { getRoom } from './rooms/room-data.js';
import { TileMap } from './tilemap.js';
import { createEnemy } from './enemy-types.js';

export class RoomManager {
    constructor() {
        this.currentRoomId = null;
        this.currentRoom = null;
        this.tilemap = null;
        this.enemies = [];
        this.projectiles = [];
    }

    loadRoom(roomId, effects) {
        const data = getRoom(roomId);
        if (!data) return false;

        this.currentRoomId = roomId;
        this.currentRoom = data;
        this.tilemap = new TileMap(data);
        this.enemies = [];
        this.projectiles = [];

        // Spawn enemies
        if (data.spawns) {
            for (const spawn of data.spawns) {
                this.enemies.push(createEnemy(spawn.type, spawn.x, spawn.y));
            }
        }

        // Show room name
        if (effects && data.name) {
            effects.showRoomName(data.name);
        }

        return true;
    }

    getPlayerSpawn(fromDoor) {
        if (!this.currentRoom) return { x: 48, y: 200 };

        if (fromDoor) {
            // Find the door entry point
            const doors = this.currentRoom.doors || [];
            for (const door of doors) {
                if (door.side === fromDoor.spawnSide ||
                    (fromDoor.target === this.currentRoomId)) {
                    return this._getDoorSpawnPosition(door);
                }
            }
        }

        return this.currentRoom.playerStart || { x: 48, y: 200 };
    }

    _getDoorSpawnPosition(door) {
        const room = this.currentRoom;
        switch (door.side) {
            case 'left':
                return { x: TILE_SIZE * 2, y: door.y * TILE_SIZE };
            case 'right':
                return { x: (room.width - 3) * TILE_SIZE, y: door.y * TILE_SIZE };
            case 'top':
                return { x: door.x * TILE_SIZE, y: TILE_SIZE * 2 };
            case 'bottom':
                return { x: door.x * TILE_SIZE, y: (room.height - 3) * TILE_SIZE };
            default:
                return this.currentRoom.playerStart;
        }
    }

    // Check if player is at a door
    checkDoors(player) {
        if (!this.currentRoom || !this.currentRoom.doors) return null;

        const px = Math.floor(player.getCenterX() / TILE_SIZE);
        const py = Math.floor(player.getCenterY() / TILE_SIZE);

        for (const door of this.currentRoom.doors) {
            // Check tile-based doors
            let match = false;
            switch (door.side) {
                case 'right':
                    match = px >= this.currentRoom.width - 2 &&
                            Math.abs(py - door.y) <= 1;
                    break;
                case 'left':
                    match = px <= 1 && Math.abs(py - door.y) <= 1;
                    break;
                case 'top':
                    match = py <= 1 && Math.abs(px - door.x) <= 1;
                    break;
                case 'bottom':
                    match = py >= this.currentRoom.height - 2 &&
                            Math.abs(px - door.x) <= 1;
                    break;
            }

            if (match) {
                return door;
            }
        }
        return null;
    }

    // Check if player is at a save bench
    checkBench(player) {
        if (!this.currentRoom || !this.currentRoom.bench) return false;
        const bench = this.currentRoom.bench;
        const dx = Math.abs(player.x - bench.x);
        const dy = Math.abs(player.y - bench.y);
        return dx < TILE_SIZE * 2 && dy < TILE_SIZE * 2;
    }

    // Transition to a new room
    transition(doorData, player, camera, effects, callback) {
        const targetRoom = doorData.target;
        const spawnSide = this._getOppositeSide(doorData.side);

        effects.startTransition(() => {
            this.loadRoom(targetRoom, effects);
            camera.setRoomBounds(this.tilemap.pixelWidth, this.tilemap.pixelHeight);

            // Find spawn from opposite side
            const spawn = this._findSpawnFromSide(spawnSide);
            player.x = spawn.x;
            player.y = spawn.y;
            player.vx = 0;
            player.vy = 0;
            camera.follow(player.getCenterX(), player.getCenterY(), true);

            if (callback) callback();
        });
    }

    _getOppositeSide(side) {
        switch (side) {
            case 'left': return 'right';
            case 'right': return 'left';
            case 'top': return 'bottom';
            case 'bottom': return 'top';
            default: return 'left';
        }
    }

    _findSpawnFromSide(side) {
        const room = this.currentRoom;
        if (!room) return { x: 48, y: 200 };

        // Look for a door on the spawn side
        if (room.doors) {
            for (const door of room.doors) {
                if (door.side === side) {
                    return this._getDoorSpawnPosition(door);
                }
            }
        }

        // Fallback positions
        switch (side) {
            case 'left':
                return { x: TILE_SIZE * 2, y: (room.height - 4) * TILE_SIZE };
            case 'right':
                return { x: (room.width - 3) * TILE_SIZE, y: (room.height - 4) * TILE_SIZE };
            case 'top':
                return { x: room.width / 2 * TILE_SIZE, y: TILE_SIZE * 2 };
            case 'bottom':
                return { x: room.width / 2 * TILE_SIZE, y: (room.height - 3) * TILE_SIZE };
            default:
                return room.playerStart || { x: 48, y: 200 };
        }
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            // Remove if expired or out of bounds
            if (p.life <= 0 || p.x < -50 || p.x > this.tilemap.pixelWidth + 50 ||
                p.y < -50 || p.y > this.tilemap.pixelHeight + 50) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    drawProjectiles(ctx) {
        for (const p of this.projectiles) {
            ctx.fillStyle = p.color || '#ff4444';
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.width || 4, p.height || 4);
            // Glow
            ctx.fillStyle = (p.color || '#ff4444') + '44';
            ctx.beginPath();
            ctx.arc(p.x + (p.width || 4) / 2, p.y + (p.height || 4) / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

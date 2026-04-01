import { TILE_SIZE, TILE, ROOM_COLORS } from './config.js';

export class TileMap {
    constructor(roomData) {
        this.width = roomData.width;
        this.height = roomData.height;
        this.tiles = roomData.tiles;
        this.roomId = roomData.id || 'room-01';
        this.colors = ROOM_COLORS[this.roomId] || ROOM_COLORS['room-01'];
    }

    get(tx, ty) {
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return TILE.SOLID;
        return this.tiles[ty][tx];
    }

    set(tx, ty, val) {
        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
            this.tiles[ty][tx] = val;
        }
    }

    // Pixel dimensions
    get pixelWidth() { return this.width * TILE_SIZE; }
    get pixelHeight() { return this.height * TILE_SIZE; }

    draw(ctx, camera) {
        const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
        const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
        const endX = Math.min(this.width, Math.ceil((camera.x + camera.viewWidth) / TILE_SIZE) + 1);
        const endY = Math.min(this.height, Math.ceil((camera.y + camera.viewHeight) / TILE_SIZE) + 1);

        for (let ty = startY; ty < endY; ty++) {
            for (let tx = startX; tx < endX; tx++) {
                const tile = this.tiles[ty][tx];
                if (tile === TILE.AIR) continue;

                const x = tx * TILE_SIZE - camera.x;
                const y = ty * TILE_SIZE - camera.y;

                this._drawTile(ctx, tile, x, y, tx, ty);
            }
        }
    }

    _drawTile(ctx, tile, x, y, tx, ty) {
        const s = TILE_SIZE;

        switch (tile) {
            case TILE.SOLID:
                ctx.fillStyle = this.colors.tile;
                ctx.fillRect(x, y, s, s);
                // Edge highlight
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(x, y, s, 1);
                ctx.fillRect(x, y, 1, s);
                // Subtle noise texture
                if ((tx + ty) % 3 === 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.fillRect(x + 3, y + 3, 2, 2);
                }
                if ((tx * 7 + ty * 13) % 5 === 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.03)';
                    ctx.fillRect(x + 8, y + 6, 3, 1);
                }
                break;

            case TILE.PLATFORM:
                ctx.fillStyle = this.colors.tile;
                ctx.fillRect(x, y, s, 4);
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(x, y, s, 1);
                break;

            case TILE.BREAKABLE:
                ctx.fillStyle = this.colors.tile;
                ctx.fillRect(x, y, s, s);
                // Crack pattern
                ctx.strokeStyle = this.colors.accent + '44';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 3, y + 2);
                ctx.lineTo(x + 8, y + 7);
                ctx.lineTo(x + 13, y + 5);
                ctx.moveTo(x + 6, y + 9);
                ctx.lineTo(x + 10, y + 14);
                ctx.stroke();
                break;

            case TILE.WATER:
                ctx.fillStyle = '#0a2a4a88';
                ctx.fillRect(x, y, s, s);
                // Wavy top edge
                const wave = Math.sin((tx * 0.8) + Date.now() * 0.003) * 2;
                ctx.fillStyle = '#2288aa44';
                ctx.fillRect(x, y + wave, s, 2);
                break;

            case TILE.SPIKE:
                ctx.fillStyle = '#ff2060';
                ctx.beginPath();
                ctx.moveTo(x + s / 2, y + 2);
                ctx.lineTo(x + s - 2, y + s);
                ctx.lineTo(x + 2, y + s);
                ctx.closePath();
                ctx.fill();
                break;

            case TILE.SAVE:
                ctx.fillStyle = this.colors.tile;
                ctx.fillRect(x, y, s, s);
                // Bench glow
                ctx.fillStyle = this.colors.accent + '33';
                ctx.fillRect(x + 2, y + 8, s - 4, 4);
                ctx.fillStyle = this.colors.accent;
                ctx.fillRect(x + 4, y + 9, s - 8, 2);
                break;

            case TILE.CRUMBLE:
                ctx.fillStyle = this.colors.tile;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x, y, s, s);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.setLineDash([2, 2]);
                ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
                ctx.setLineDash([]);
                break;

            case TILE.STEAM:
                ctx.fillStyle = this.colors.tile;
                ctx.fillRect(x, y, s, s);
                ctx.fillStyle = '#ff883344';
                ctx.fillRect(x, y, s, s);
                break;

            // Door tiles — render as openings
            case TILE.DOOR_RIGHT:
            case TILE.DOOR_LEFT:
            case TILE.DOOR_UP:
            case TILE.DOOR_DOWN:
                ctx.fillStyle = '#000000';
                ctx.fillRect(x, y, s, s);
                // Subtle glow at door edge
                ctx.fillStyle = this.colors.accent + '22';
                ctx.fillRect(x, y, s, s);
                break;
        }
    }
}

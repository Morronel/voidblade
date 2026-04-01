import { TILE } from '../config.js';

const _ = TILE.AIR;
const S = TILE.SOLID;
const P = TILE.PLATFORM;
const K = TILE.SPIKE;
const DB = TILE.DOOR_DOWN;
const DU = TILE.DOOR_UP;

// Clockwork Ascent — 30×30
// Vertical room. Rising hazard (spikes at bottom). Tight platforming upward.
export function createRoom() {
    return {
        id: 'room-06',
        name: 'Clockwork Ascent',
        width: 30,
        height: 30,
        tiles: (() => {
            const grid = [];
            for (let y = 0; y < 30; y++) {
                const row = [];
                for (let x = 0; x < 30; x++) {
                    // Door tiles take priority over borders
                    if (y === 29 && x === 15) {
                        row.push(DB);
                    } else if (y === 0 && x === 15) {
                        row.push(DU);
                    }
                    // Borders
                    else if (x === 0 || x === 29 || y === 0 || y === 29) {
                        row.push(S);
                    }
                    // Bottom spikes
                    else if (y >= 27 && y < 29) {
                        row.push(K);
                    }
                    else {
                        row.push(_);
                    }
                }
                grid.push(row);
            }
            // Add platforms for climbing
            for (let x = 3; x < 8; x++) grid[25][x] = P;
            for (let x = 12; x < 17; x++) grid[25][x] = P;
            for (let x = 20; x < 26; x++) grid[22][x] = P;
            for (let x = 5; x < 10; x++) grid[22][x] = P;
            for (let x = 12; x < 18; x++) grid[19][x] = P;
            for (let x = 3; x < 7; x++) grid[16][x] = P;
            for (let x = 22; x < 27; x++) grid[16][x] = P;
            for (let x = 10; x < 15; x++) grid[13][x] = P;
            for (let x = 16; x < 20; x++) grid[13][x] = P;
            for (let x = 4; x < 9; x++) grid[10][x] = P;
            for (let x = 21; x < 26; x++) grid[10][x] = P;
            for (let x = 12; x < 18; x++) grid[7][x] = P;
            for (let x = 5; x < 10; x++) grid[4][x] = P;
            for (let x = 20; x < 25; x++) grid[4][x] = P;
            // Top landing
            for (let x = 12; x < 18; x++) grid[2][x] = S;

            // Wall sections for wall-jumping
            grid[20][1] = S; grid[21][1] = S;
            grid[14][28] = S; grid[15][28] = S;
            grid[8][1] = S; grid[9][1] = S;
            grid[5][28] = S; grid[6][28] = S;

            return grid;
        })(),
        spawns: [
            { type: 'flyer', x: 15, y: 15 },
            { type: 'turret', x: 1, y: 12 },
            { type: 'turret', x: 28, y: 8 },
        ],
        doors: [
            { side: 'bottom', x: 15, y: 29, target: 'room-05', spawnSide: 'top' },
            { side: 'top', x: 15, y: 0, target: 'room-07', spawnSide: 'bottom' },
        ],
        playerStart: { x: 4 * 16, y: 24 * 16 },
        accent: '#ff3333',
    };
}

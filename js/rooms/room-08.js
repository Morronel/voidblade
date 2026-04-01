import { TILE } from '../config.js';

const _ = TILE.AIR;
const S = TILE.SOLID;
const P = TILE.PLATFORM;
const W = TILE.WATER;
const DL = TILE.DOOR_LEFT;

// Flooded Crypt — 45×17
// Lower area from hub. Partially submerged. Water = slow movement zone.
export function createRoom() {
    return {
        id: 'room-08',
        name: 'Flooded Crypt',
        width: 45,
        height: 17,
        tiles: [
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [DL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,S,S,_,_,_,_,_,_,_,_,_,_,_,S,S,_,_,_,_,_,_,S,S,_,_,_,_,_,_,_,_,S,S,_,_,_,_,_,_,S],
            [S,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,S],
            [S,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,S],
            [S,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,S],
            [S,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,S],
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
        ],
        spawns: [
            { type: 'swimmer', x: 10, y: 12 },
            { type: 'swimmer', x: 25, y: 13 },
            { type: 'swimmer', x: 38, y: 12 },
            { type: 'crawler', x: 15, y: 9 },
            { type: 'crawler', x: 35, y: 9 },
        ],
        doors: [
            { side: 'left', x: 0, y: 9, target: 'room-05', spawnSide: 'right' },
        ],
        playerStart: { x: 2 * 16, y: 9 * 16 },
        accent: '#aacc22',
    };
}

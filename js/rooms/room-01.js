import { TILE } from '../config.js';

const _ = TILE.AIR;
const S = TILE.SOLID;
const P = TILE.PLATFORM;
const B = TILE.BREAKABLE;
const K = TILE.SPIKE;
const V = TILE.SAVE;
const DR = TILE.DOOR_RIGHT;
const DU = TILE.DOOR_UP;

// Awakening Chamber — 30×17
// Starting room. Tutorial space. Flat ground, platforms, one breakable wall.
export function createRoom() {
    return {
        id: 'room-01',
        name: 'Awakening Chamber',
        width: 30,
        height: 17,
        tiles: [
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,DU,S],
            [S,_,_,_,_,_,P,P,P,P,_,_,_,_,_,_,_,_,_,P,P,P,P,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,V,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,S],
            [S,S,S,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S,S,S,S,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
        ],
        spawns: [
            { type: 'crawler', x: 15, y: 14 },
        ],
        doors: [
            { side: 'top', x: 28, y: 8, target: 'room-02', spawnSide: 'bottom' },
        ],
        playerStart: { x: 3 * 16, y: 11 * 16 },
        bench: { x: 3 * 16, y: 12 * 16 },
        accent: '#00fff5',
    };
}

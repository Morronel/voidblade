import { TILE } from '../config.js';

const _ = TILE.AIR;
const S = TILE.SOLID;
const P = TILE.PLATFORM;
const DR = TILE.DOOR_RIGHT;

// Forgotten Alcove — 20×15
// Small hidden room. Light puzzle. Reward: Time Slow ability.
export function createRoom() {
    return {
        id: 'room-09',
        name: 'Forgotten Alcove',
        width: 20,
        height: 15,
        tiles: [
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,P,P,_,_,_,_,P,P,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,DR,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,S],
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
            [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
        ],
        spawns: [],
        doors: [
            { side: 'right', x: 18, y: 9, target: 'room-05', spawnSide: 'left' },
        ],
        playerStart: { x: 17 * 16, y: 12 * 16 },
        accent: '#ccaaff',
        hasUpgrade: 'timeSlow',
        upgradePos: { x: 10 * 16, y: 5 * 16 },
    };
}

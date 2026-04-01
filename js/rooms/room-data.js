import { createRoom as createRoom01 } from './room-01.js';
import { createRoom as createRoom02 } from './room-02.js';
import { createRoom as createRoom03 } from './room-03.js';
import { createRoom as createRoom04 } from './room-04.js';
import { createRoom as createRoom05 } from './room-05.js';
import { createRoom as createRoom06 } from './room-06.js';
import { createRoom as createRoom07 } from './room-07.js';
import { createRoom as createRoom08 } from './room-08.js';
import { createRoom as createRoom09 } from './room-09.js';
import { createRoom as createRoom10 } from './room-10.js';

// Room registry — maps room ID to factory function
const roomFactories = {
    'room-01': createRoom01,
    'room-02': createRoom02,
    'room-03': createRoom03,
    'room-04': createRoom04,
    'room-05': createRoom05,
    'room-06': createRoom06,
    'room-07': createRoom07,
    'room-08': createRoom08,
    'room-09': createRoom09,
    'room-10': createRoom10,
};

export function getRoom(id) {
    const factory = roomFactories[id];
    if (!factory) {
        console.warn(`Room not found: ${id}`);
        return null;
    }
    return factory();
}

export function getRoomList() {
    return Object.keys(roomFactories);
}

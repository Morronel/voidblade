# VOIDBLADE

A browser-based 2D action-platformer fusing Hollow Knight's atmospheric exploration with Katana Zero's precise, lethal combat and time-manipulation mechanics.

**Play it:** Open `index.html` in any modern browser. No build step, no server, no dependencies.

## Controls

| Action | Keys |
|--------|------|
| Move | Arrow Keys / WASD |
| Jump | Z / Space |
| Attack | X / J |
| Dash | C / Shift |
| Time Slow | V / K |
| Pause | Escape / P |

**Tips:**
- Hold jump for higher arc, tap for short hop
- Dash grants invincibility frames — dash through danger
- Attack downward in mid-air to pogo-bounce off enemies
- Time slow lets you thread through projectiles (drains focus meter)
- Attack incoming projectiles to deflect them back
- Save at glowing benches by holding Down

## The World

10 interconnected rooms form a metroidvania-style map:

```
         [Belltower Peak - BOSS]
                  |
           [Clockwork Ascent]
                  |
[Forgotten Alcove]--[The Nave]--[Flooded Crypt]
                       |
             [Collapsed Gallery]--[Secret Garden]
                       |
              [Pipe Organ Depths]
                       |
             [Vestibule of Echoes]
                       |
             [Awakening Chamber - START]
```

## Abilities

Unlocked through exploration:
- **Dash** — Available from start. 8-frame burst with i-frames
- **Wall Slide / Wall Jump** — Available from start. Slide down walls, jump off them
- **Time Slow** — Found in the Forgotten Alcove. Slows the world to 30%
- **Double Jump** — Reward for defeating the Cathedral Guardian boss

## Enemies

| Enemy | HP | Behavior |
|-------|----|----------|
| Crawler | 1 | Patrols ground, turns at walls |
| Flyer | 1 | Hovers in sine wave, charges when close |
| Spitter | 1 | Stationary, fires deflectable projectiles |
| Shield Knight | 2 | Front shield blocks attacks — hit from behind or during wind-up |
| Turret | 3 | Wall-mounted, fires 3-round bursts |
| Swimmer | 2 | Underwater patrol, lunges upward at player |
| **Cathedral Guardian** | 15 | Mini-boss with 2 phases |

## Tech

- **Rendering:** 480×270 canvas, CSS-scaled with `image-rendering: pixelated`
- **Art:** Fully procedural — all visuals drawn with Canvas 2D API calls
- **Audio:** Procedural via Web Audio API — oscillators, noise, filters
- **Physics:** Custom AABB collision with separate X/Y resolution
- **Architecture:** ES modules, 30 files, all under 500 lines

## Project Structure

```
index.html                  Entry point
css/style.css               Canvas styling
js/
  main.js                   Game loop, state machine, init
  config.js                 All constants and tuning values
  input.js                  Keyboard input with buffering
  player.js                 Player entity and rendering
  player-states.js          FSM: idle, run, jump, dash, attack, etc.
  physics.js                Gravity, AABB collision resolution
  tilemap.js                Tile rendering and collision queries
  camera.js                 Smooth follow, screen shake
  combat.js                 Hit detection, hitstop, deflect
  enemies.js                Enemy base class
  enemy-types.js            All enemy type definitions
  boss.js                   Cathedral Guardian mini-boss
  particles.js              Particle system with object pooling
  effects.js                Screen flash, time-slow visuals, transitions
  animation.js              Procedural drawing helpers
  room-manager.js           Room loading and transitions
  hud.js                    Health, focus meter, ability icons
  audio.js                  Web Audio procedural SFX and ambient
  utils.js                  Math helpers, easing, object pool
  rooms/
    room-data.js            Room registry
    room-01.js – room-10.js Individual room definitions
```

## License

Apache 2.0

# Egg Wars

Egg Wars is a playful 2-D battlefield game drawn in a loose black-line sketch style. Blue and red armies march, roll, fly, hover, and crash across randomly generated terrain while lobbing projectile eggs through the air. Eggs arc under gravity, splat on the ground, burst into smaller projectiles, and gradually turn the battlefield into breakfast chaos.

The game can be played as a Python/Pygame version or as a browser-based web version.

## Game Objective

Lead the blue team through as many stages as possible. Each round ends when one side is wiped out or when the timer expires. If time runs out, the side with the stronger remaining army wins.

Winning stages earns gold. Gold can be spent during battle to buy more blue units. The red team is the enemy and spawns automatically.

## Basic Controls

- Click blue unit buttons at the top-left of the screen to buy reinforcements.
- Press and hold a unit button to repeatedly buy that unit while you have enough gold.
- Click the battlefield when `YOLK DROP READY` is active to drop a special egg attack.
- Click the end-game screen to continue to the next stage or try again.
- Press `R` to restart.
- Press `Esc` to quit or pause, depending on version.

## Unit Buttons

- `C` = castle
- `B` = bomber
- `H` = helicopter
- `A` = airplane
- `T` = tank
- `M` = motorcycle
- `S` = soldier
- `D` = drone

## Units

- **Soldiers** are cheap ground troops. They take one hit and have shorter range than tanks.
- **Motorcycles** move quickly and carry a gunner. They also have shorter range than tanks.
- **Tanks** are tougher ground vehicles that can take multiple hits and fire arcing egg projectiles.
- **Castles** are stationary towers with catapults and high hit points.
- **Airplanes** fly across the upper battlefield and drop bombs when they can target enemies.
- **Bombers** are larger, slower aircraft with stronger burst projectiles.
- **Helicopters** hover over enemy ground units and drop projectiles from above.
- **Drones** launch from ground level, climb into the air, hover over targets, then dive kamikaze-style into enemies.

## Progression

Enemy units become stronger as stages increase, and the round timer grows longer at higher stages. Special blue units unlock as you advance:

- Stage 2: **Mega Knight**
- Stage 4: **Fire Wizard**
- Stage 6: **Yolk Bomber**

Fast full-destruction victories earn bonus gold.

## Style and Features

Egg Wars uses simple line-art visuals, randomly generated terrain, moving clouds, retro sound effects, egg splatter residue, wreckage debris, speech bubbles, and configurable color schemes. Settings can be edited in `js/config.js`.

## Running the Game

Open `index.html` in a browser. No build step or server is needed. You can also serve the folder:

```bash
python3 -m http.server 8001
```

Then visit `http://127.0.0.1:8001/`.

## Code Layout

- `js/config.js` - canvas, colors and tunable settings
- `js/util.js` - small math/color helpers
- `js/audio.js` - sound effects
- `js/terrain.js` - terrain generation
- `js/draw.js` - shared drawing helpers
- `js/units.js` - unit classes
- `js/projectiles.js` - eggs and splats
- `js/game.js` - the `Game` class (rules, battle loop, HUD)
- `js/main.js` - startup, input and the frame loop
- `tools/smoke-test.js` - headless check: `NODE_PATH=$(npm root -g) node tools/smoke-test.js`

See `ROADMAP.md`, `DESIGN.md` and `CHANGELOG.md` for the improvement plan.

## Credits

EGG WARS © copyright 2026. Created by Michael K. Davis, MD.

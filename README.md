# Egg Wars

Egg Wars is a playful 2-D battlefield game drawn in a loose black-line sketch style. Blue and red armies march, roll, fly, hover, and crash across randomly generated terrain while lobbing projectile eggs through the air. Eggs arc under gravity, splat on the ground, burst into smaller projectiles, and gradually turn the battlefield into breakfast chaos.

The game can be played as a Python/Pygame version or as a browser-based web version.

## Game Objective

Lead the blue team through as many stages as possible. Each round ends when one side is wiped out or when the timer expires. If time runs out, the side with the stronger remaining army wins.

Winning stages earns gold. Gold can be spent during battle to buy more blue units. The red team is the enemy and spawns automatically.

## Basic Controls

- Click a unit card in the shop bar (top left) or press `1`-`8` to buy reinforcements.
- Press and hold a unit card to keep buying while you have enough gold.
- Click the battlefield when `YOLK DROP READY` is active to drop a special egg attack.
- Click the end-game screen to continue to the next stage or try again.
- Press `R` to restart the current stage.
- Press `Esc` or `P` to pause (resume, restart, settings, title screen).
- Press `M` to mute or unmute.
- Press `W` for an Airstrike (level 7) and `E` for a Shell Shield (level 12), or tap their buttons at the bottom of the screen.
- Press `Q` (or tap the chips above the Yolk Drop button) to choose which egg the Yolk Drop uses, once you unlock more than one.
- Settings (title screen or pause menu): master, effects and music volume, mute, color scheme, speech bubbles, screen shake, and New Game (erases saved progress).
- Progress (stage, gold, unlocks, wins/losses) is saved automatically in the browser.

## Unit Shop

The shop bar at the top left shows every unit with its price. Tap a card (or press its number
key) to buy one; hold to keep buying. Locked units show the level they unlock at.

1 soldier, 2 tank, 3 motorcycle, 4 drone, 5 airplane, 6 helicopter, 7 bomber, 8 castle,
9 Egg Medic, 0 Mortar Hen, - Rooster Rider (a second shop row appears as these unlock).

## Units

- **Soldiers** are cheap ground troops. They take one hit and have shorter range than tanks.
- **Motorcycles** move quickly and carry a gunner. They also have shorter range than tanks.
- **Tanks** are tougher ground vehicles that can take multiple hits and fire arcing egg projectiles.
- **Castles** are stationary towers with catapults and high hit points.
- **Airplanes** fly across the upper battlefield and drop bombs when they can target enemies.
- **Bombers** are larger, slower aircraft with stronger burst projectiles.
- **Helicopters** hover over enemy ground units and drop projectiles from above.
- **Egg Medics** (level 6) don't fight; they heal the most hurt ally nearby.
- **Mortar Hens** (level 11) are slow but lob bursting eggs across the whole field.
- **Rooster Riders** (level 16) charge in fast and peck enemies up close.
- **Drones** launch from ground level, climb into the air, hover over targets, then dive kamikaze-style into enemies.

## Progression

Enemy armies grow slowly and smoothly with each stage (a logarithmic curve, see `DESIGN.md`), and the round timer grows a little longer too. You earn XP every round (more for wins and kills) and level up. New units, special units and
features unlock by player level, and the HUD always shows what comes next. Some highlights:

- Level 2: **Airplane** and the **Armory** (permanent upgrades bought with Golden Eggs)
- Level 3: **Mega Knight**
- Level 5: **Helicopter** and **Fire Wizard**
- Level 8: **Bomber** and **Yolk Bomber**
- Level 10: buy extra **Castles**

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
- `js/save.js` - versioned localStorage save with migrations
- `js/progression.js` - difficulty, XP, level and reward formulas (see DESIGN.md)
- `js/audio.js` - procedural Web Audio sound effects with buses and a voice limiter
- `js/music.js` - procedural step-sequencer music with an intensity layer
- `js/biomes.js` - Meadow, Desert, Snowfield, Volcano and Kitchen Counter settings
- `js/terrain.js` - terrain generation
- `js/background.js` - pre-rendered parallax mountains, hills, trees and sun
- `js/sky.js` - time-of-day sky tint, stars and moon
- `js/weather.js` - rain, snow, wind (pushes eggs) and the wind sock
- `js/effects.js` - pooled particles, screen shake and hit flashes
- `js/draw.js` - shared drawing helpers
- `js/units.js` - unit classes
- `js/eggtypes.js` - data-driven egg types (Classic, Cluster, ...)
- `js/projectiles.js` - eggs and splats
- `js/menus.js` - title, pause and settings screens
- `js/hud.js` - battle HUD: unit shop bar, stage/time panel, enemy roster, Yolk Drop ring
- `js/results.js` - animated end-of-round results screen
- `js/armory.js` - permanent Golden Egg upgrades and the Armory screen
- `js/abilities.js` - Airstrike and Shell Shield abilities with cooldowns
- `js/hazards.js` - neutral biome hazards (quicksand, ice, lava vents, hot pans)
- `js/unlocks.js` - level-based unlock table and enemy roster gating
- `js/personalities.js` - enemy army templates (Rusher, Turtle, Artillery, Air Force)
- `js/tutorial.js` - guided first battle and one-time tips
- `js/game.js` - the `Game` class (rules, battle loop, HUD)
- `js/main.js` - startup, input and the frame loop
- `tools/smoke-test.js` - headless check: `NODE_PATH=$(npm root -g) node tools/smoke-test.js`
- `tools/balance-sim.js` - checks player power keeps up with difficulty: `node tools/balance-sim.js`

See `ROADMAP.md`, `DESIGN.md` and `CHANGELOG.md` for the improvement plan.

## Credits

EGG WARS © copyright 2026. Created by Michael K. Davis, MD.

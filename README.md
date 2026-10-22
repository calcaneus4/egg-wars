# Egg Wars

Egg Wars is a playful 2-D battlefield game drawn in a loose black-line sketch style. Blue and red armies march, roll, fly, hover, and crash across randomly generated terrain while lobbing projectile eggs through the air. Eggs arc under gravity, splat on the ground, burst into smaller projectiles, and gradually turn the battlefield into breakfast chaos.

This repository contains the browser version. Open `index.html` to play.

## Game Objective

Lead the blue team through as many stages as possible. Each round ends when one side is wiped out or when the timer expires. If time runs out, the side with the stronger remaining army wins.

Every round, won or lost, earns gold, XP and often Golden Eggs. Gold buys reinforcements during battle. Golden Eggs buy permanent upgrades in the Armory. The red team is the enemy and spawns automatically. Its army changes personality from stage to stage, and every 5th stage brings a boss.

From stage 3 the red army calls in **reinforcement waves** during the round, so a lead is never safe. From stage 4 on, battles can be interrupted by an occasional **surprise event**: an earthquake, a tornado, a tsunami full of rubber ducks, a chicken stampede, a UFO abduction, butting goats, a bee swarm, a frog plague, slime monsters, Sasquatch, panicky tourists, ghosts, a giant snake, a rock monster, alien jellyfish, a killer robot, a cat stampede, a bacon monster, a giant bird that steals troopers, chicken pox, a hiccup outbreak, a mole invasion, a dinosaur stampede, a lost rideshare driver, a pizza delivery or giggle fits. Events are rare (at most one per stage), always announced a moment before they hit, and treat both armies the same.

## Basic Controls

- Click a unit card in the shop bar (top left) or press its key (`1`-`6`) to buy reinforcements. Each stage offers its own kit of up to 6 units and 3 Yolk Drop eggs, picked at random from what you have unlocked (new unlocks always show up first).
- Press and hold a unit card to keep buying while you have enough gold.
- Click the battlefield when `YOLK DROP READY` is active to drop a special egg attack.
- On the results screen, click (or press Enter) to skip the tally, then choose Next Stage / Try Again or the Armory.
- Press `R` to restart the current stage.
- Press `Esc` or `P` to pause (resume, restart, settings, title screen).
- Press `M` to mute or unmute.
- Press `W` and `E` (or tap their buttons at the bottom of the screen) to use your two equipped **powers**. Pick which powers sit in those slots on the Powers screen (title or pause menu): Reinforcements, Airstrike, Golden Goose, Rooster Rally, Shell Shield, Scarecrow, Time Freeze, Big Chill, Healing Rain and Mega Yolk (your next Yolk Drop is giant).
- Press `Q` (or tap the chips above the Yolk Drop button) to choose which egg the Yolk Drop uses, once you unlock more than one.
- Settings (title screen or pause menu): master, effects and music volume, mute, color scheme, speech bubbles, screen shake, and New Game (erases saved progress).
- Progress (level, XP, gold, Golden Eggs, Armory, unlocks, achievements and stats) is saved automatically in the browser.
- The title screen also has the World Map (replay cleared stages for practice), Trophies (achievements) and Stats.

## Unit Shop

The shop bar at the top left shows every unit with its price. Tap a card (or press its number
key) to buy one; hold to keep buying. Locked units show the level they unlock at.

Soldiers and tanks are always on offer; the other four cards are this stage's picks from your
unlocked units (until you have six, the next unit to unlock is shown as a locked card). Against
an Air Force there is always an anti-air unit in the kit once you have one.

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
- **Catapult Wagons** (level 6) hang back and fling huge bursting eggs across the field.
- **Monster Trucks** (level 11) are frying pans on monster wheels: infantry can't stop them, and they drive right over it.
- **Chick Balloons** (level 13) float over the enemy and drop chick paratroopers.
- **Rolling-Pin Rollers** (level 8) shove the enemy's light troops back as they advance.
- **Hover Coops** (level 12) skim over hazards, mud and goo.
- **Pogo Tanks** (level 15) boing over the front line and stomp down among the enemy.
- **Pigeon Flocks** (level 17) swoop down on enemy troops and climb back up.
- **Dino Riders** (level 19) are little T-rexes that chomp enemies up close for 2 hits.
- **Drones** launch from ground level, climb into the air, hover over targets, then dive kamikaze-style into enemies.

## Progression

- **Levels and XP:** you earn XP every round, more for wins and kills, and level up. Something new unlocks every few levels: aircraft, special units (Mega Knight, Fire Wizard, Yolk Bomber), new egg types (Cluster, Bouncer, Frost, Sticky, Popcorn, Smoke, Boomer, Zapper, Magnet, Seeker, Bubble, Sleepy, Hot Sauce), powers (Reinforcements, Airstrike, Golden Goose, Rooster Rally, Shell Shield, Scarecrow, Time Freeze, Big Chill, Healing Rain, Mega Yolk) and new units (Egg Medic, Catapult Wagon, Rolling-Pin Roller, Monster Truck, Hover Coop, Pogo Tank, Pigeon Flock, Dino Rider, Mortar Hen, Chick Balloon, Rooster Rider). The HUD always shows what comes next.
- **Armory:** six permanent upgrade tracks, bought with Golden Eggs.
- **Difficulty:** it rises slowly on a logarithmic curve. Your upgrades are designed to keep you ahead of it (see `DESIGN.md`). After two losses in a row a **Rally** boost helps you out.
- **Biomes:** they change every 5 stages: Meadow, Desert Dunes, Snowfield, Volcano, Kitchen Counter, Soggy Swamp, Candy Mountains, Spooky Graveyard, Sunny Beach, Steamy Jungle, Moon Base and Prehistoric Valley. Each has its own terrain, weather and hazards.
- **Weather:** clear, rain, snow and wind, plus fog (short sight lines), thunderstorms (telegraphed lightning), sandstorms (aircraft can't aim), blizzards (slower troops), night meteor showers, pollen storms (sneezes spoil aim), hail (dings aircraft), heat waves (swollen eggs), rainbows (faster firing underneath) and gusty gales (the wind keeps flipping) in later stages.
- **Enemies:** six army personalities (Balanced, Rushers, Turtle Shell, Artillery, Air Force and the occasional Mad Science army with freezing and shocking eggs) and ten bosses (Giant Rooster Mech, Omelet Fortress, Scrambler Zeppelin, Mother Hen Queen, Sink Kraken, Pancake Golem, Toaster Titan, Waffle Iron Warlord, Blender Beast and Dino Mama).
- **Extras:** bonus goals, 28 achievements (some unlock colour schemes), boss battles and a lifetime stats page.

## Style and Features

Egg Wars keeps its hand-drawn line-art look, now with:
- solid parallax backgrounds, day/dusk/night/dawn skies, and seven kinds of weather
- surprise events with tornadoes, waves, hens, UFOs and the odd stranded rubber duck
- particle explosions, egg splats with drips, screen shake and hit flashes
- an illustrated HUD and an animated results screen
- procedural sound effects and music

Tunable settings are in `js/config.js`.

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
- `js/weather.js` - rain, snow, wind (pushes eggs), fog, thunderstorms, hail, heat waves and the wind sock
- `js/effects.js` - pooled particles, screen shake and hit flashes
- `js/draw.js` - shared drawing helpers
- `js/units.js` - unit classes
- `js/vehicles.js` - Catapult Wagon, Monster Truck, Chick Balloon, Rolling-Pin Roller, Hover Coop, Pogo Tank, Pigeon Flock and Dino Rider
- `js/eggtypes.js` - data-driven egg types (Classic, Cluster, Frost, Smoke, Zapper, ...) plus smoke clouds, ice and chain lightning
- `js/projectiles.js` - eggs and splats
- `js/bosses.js` - boss battles every 5th stage (eight bosses)
- `js/menus.js` - title, pause and settings screens
- `js/worldmap.js` - world map, stage select and practice replays
- `js/hud.js` - battle HUD: unit shop bar, stage/time panel, enemy roster, Yolk Drop ring
- `js/results.js` - animated end-of-round results screen
- `js/stats.js` - lifetime statistics page
- `js/armory.js` - permanent Golden Egg upgrades and the Armory screen
- `js/abilities.js` - the five powers, the W/E loadout and the Powers screen
- `js/hazards.js` - neutral biome hazards (quicksand, ice, lava vents, hot pans)
- `js/director.js` - Variety Director: decides each stage's surprise event and limits debuts
- `js/events.js` - surprise events (earthquake, tornado, tsunami, stampede, UFO)
- `js/critters.js` - critter events (goats, bee swarm, frog plague, slime monsters)
- `js/monsters.js` - monster events (Sasquatch, tourists, ghosts, giant snake, rock monster)
- `js/oddities.js` - oddity events (alien jellyfish, killer robot, cat stampede, bacon monster)
- `js/afflictions.js` - affliction events (giant bird, chicken pox, hiccups, moles)
- `js/detours.js` - detour events (dinosaur stampede, lost rideshare driver, pizza delivery, giggle fits)
- `js/reinforcements.js` - enemy reinforcement waves during a round
- `js/kit.js` - the per-stage kit: which 6 units and 3 eggs are on offer
- `js/objectives.js` - per-stage bonus goals
- `js/achievements.js` - 28 achievements, toasts, gallery and bonus colour schemes
- `js/unlocks.js` - level-based unlock table and enemy roster gating
- `js/personalities.js` - enemy army templates (Rusher, Turtle, Artillery, Air Force, Mad Science)
- `js/tutorial.js` - guided first battle and one-time tips
- `js/game.js` - the `Game` class (rules, battle loop, HUD)
- `js/main.js` - startup, input and the frame loop
- `tools/smoke-test.js` - headless check: `NODE_PATH=$(npm root -g) node tools/smoke-test.js`
- `tools/balance-sim.js` - checks player power keeps up with difficulty: `node tools/balance-sim.js`
- `tools/winrate-sim.js` - plays real battles headlessly and reports idle/active win rates per stage

See `ROADMAP.md`, `DESIGN.md` and `CHANGELOG.md` for the improvement plan.

## Credits

EGG WARS © copyright 2026. Created by Michael K. Davis, MD.

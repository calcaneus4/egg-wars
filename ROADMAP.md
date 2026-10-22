# Egg Wars Roadmap

Prioritized checklist. Work top to bottom: foundations first, then the content that builds on them.
Each item is one loop iteration and must leave the game playable. See `DESIGN.md` for the
progression and difficulty model that every item must respect.

> Repo note: this repository contains only the browser version, at the repo root
> (`index.html`, `game.js`, `styles.css`, `assets/`). There is no `egg_wars/` (Python) or
> `web_egg_wars/` folder, so all work targets the root browser version. The game must keep
> running by opening `index.html` directly (`file://`), so code is split into classic
> `<script>` files (ES modules are blocked on `file://`), with no build step and no network.

## 1. Foundations

- [x] **Module split** - split `game.js` into `js/` files (config, util, audio, terrain, units, projectiles, game, ui, main) loaded by plain `<script>` tags; no behaviour change. Add `tools/smoke-test.js` (headless Chromium via Playwright: loads the page, runs a few seconds, fails on console errors).
- [x] **Save system** - versioned `localStorage` save (`eggwars.save.v1`) with defaults, migration hook, corruption fallback, try/catch around storage, autosave after every round. Persist gold, stage, unlocks, wins/losses.
- [x] **Player level & XP** - XP from wins, losses and kills; level curve from DESIGN.md; XP bar in HUD; level-up banner.
- [x] **Smooth difficulty curve** - replace the linear per-stage enemy HP/fire scaling with the logarithmic `D(n)` model; enemy armies built from a point budget instead of fixed maximums.
- [x] **Comeback assist** - loss-streak tracking; after 2+ losses in a row grant the "Rally" assist (bonus gold, extra starting unit, smaller enemy budget) per DESIGN.md. Cleared on a win; never affects winning players.
- [x] **Scene system & menus** - title screen, pause menu (Esc / P), settings screen (volume, mute, color scheme, speech bubbles, screen shake), all saved.
- [x] **Armory upgrade tree** - permanent upgrades bought with Golden Eggs (HP, fire rate, egg damage, starting gold, yolk-drop cooldown, unit cost discount) with costs/effects from DESIGN.md.
- [x] **Unlock schedule** - level-based unlock table (something new every 1-3 levels); "Next unlock at level N" teaser on HUD and results screen; existing stage unlocks (Mega Knight, Fire Wizard, Yolk Bomber) migrated.
- [x] **Tutorial & tips** - short guided first battle (buy a unit, use Yolk Drop, win) with skippable prompts; contextual tips the first time each mechanic appears.

## 2. Graphics

- [x] **Effects engine** - pooled particle system (smoke, debris, yolk spray, sparks), screen shake (setting-aware), white hit flashes on damaged units.
- [x] **Parallax backgrounds** - 3 layers of sketchy hills/mountains and a sun/moon drawn with jittered "hand-drawn" lines, scrolling gently.
- [x] **Terrain art** - filled ground with cross-hatching, grass tufts, pebbles and an outline that wobbles like ink.
- [x] **Unit art polish** - flat team fills under the line art, little flags, recoil on firing, idle bobbing, damage cracks, health pips replaced by small bars.
- [x] **Egg trails & splats** - motion trails, splats that fade over time, yolk drips, egg shells that tumble on impact.
- [x] **HUD redesign** - unit shop bar with drawn icons, prices and hotkeys (1-8), ability buttons with cooldown rings, XP bar, stage/time panel.
- [x] **Results screen** - animated tally of gold / XP / Golden Eggs, level-up fanfare, unlock reveal card.
- [x] **Time of day** - dawn / day / dusk / night palettes per stage with lerped sky tint and stars at night.
- [x] **Weather** - rain, snow and wind; wind gently pushes eggs and is shown by a wind sock.

## 3. Sound

- [x] **Procedural SFX engine** - Web Audio synth for all effects with random pitch/timbre variation, voice limiting and master/SFX/music buses; WAV files kept as optional layers.
- [x] **Procedural music** - small step-sequencer playing per-biome loops, with an intensity layer that rises when armies clash and calm/victory/defeat stingers.
- [x] **Volume & mute** - separate master/SFX/music sliders in settings, `M` to mute, saved in the profile.

## 4. Depth & Options

- [x] **Egg type framework + Cluster egg** - egg types defined by data (damage, burst, gravity, on-impact); player chooses the Yolk Drop egg; Cluster egg splits mid-air.
- [x] **Bouncing & Sticky eggs** - bouncing eggs hop along terrain; sticky eggs glue targets (slow) for a few seconds.
- [x] **Explosive egg & craters** - area damage plus terrain deformation that changes unit paths.
- [x] **Abilities bar** - three cooldown abilities (Yolk Drop, Omelet Airstrike, Shell Shield) unlocked by level, upgradeable in the Armory.
- [x] **New player units** - Egg Medic (heals nearby), Mortar Hen (long-range lob), Rooster Rider (fast melee charge); each unlocked by level.
- [x] **Enemy personalities** - Rusher, Turtle, Air Force and Artillery army templates rotated by stage, each with readable tells.
- [x] **Homing egg** - slow seeker egg for anti-air, unlocked mid-game.
- [x] **Biomes** - Meadow, Desert, Snowfield, Volcano, Kitchen Counter; each with terrain generator settings, palette and decorations; rotate every few stages.
- [x] **Hazards** - lava vents (Volcano), ice that makes ground units slide (Snowfield), quicksand (Desert), hot-pan geysers (Kitchen).
- [x] **Boss battles** - every 5th stage: Giant Rooster Mech, Omelet Fortress, Scrambler Zeppelin; health bar, phases, big rewards; scaled with the same `D(n)`.
- [x] **Optional objectives** - 1-2 bonus goals per stage (win under X s, lose no tanks, 3 Yolk Drop kills) paying extra Golden Eggs.
- [x] **Achievements** - ~20 achievements with toasts and a gallery page; some grant cosmetic color schemes.
- [x] **World map / stage select** - biome path showing cleared stages, bosses and next unlock; replay any cleared stage for practice rewards.
- [x] **Stats page** - lifetime kills, eggs thrown, favourite unit, best wipeout time.

## 5. Final

- [x] **Final review pass** - bugs, balance simulation against DESIGN.md, performance (object pooling, draw cost), polish; full CHANGELOG summary.

---

# Phase 2: Depth & Surprises

Second loop. Keep the hand-drawn side view and the core flow (buy units, drop yolk, abilities).
Add depth through weather, events, egg types, vehicles, powers and bosses. A **Variety Director**
(DESIGN.md section 12) keeps each stage readable. It allows at most one surprise event and at
most one brand-new thing per stage, and the rolls are random but seeded by stage.

## 6. Framework

- [x] **Variety Director + Earthquake** - `js/director.js` rolls each stage's extras (event chance and timing, debut limits). `js/events.js` adds a random-event framework (warning banner, then the event), and the first event is the Earthquake: the screen rumbles, ground units stagger, eggs on the ground pop and the terrain shifts a little.

## 7. Surprise events (both armies affected equally)

- [x] **Tornado** - a twister wanders across the field, lifts light units and eggs, and spins them around before dropping them.
- [x] **Tsunami** - a cartoon wave (with rubber ducks) rolls in from one edge, pushes ground units back and washes away splats and goo.
- [x] **Chicken Stampede** - a flock of panicking farm hens runs across, knocking soldiers over and shouting "BAWK!".
- [x] **UFO Abduction** - a flying saucer beams up one unit from each army and drops back a confused cow.

## 8. Weather

- [x] **Fog** - drifting fog banks limit vision: units fire only at targets within a shorter range.
- [x] **Thunderstorm** - rain plus lightning strikes: a flicker warns first, then the strike damages whatever stands there.
- [x] **Hail & Heat wave** - hail lightly damages aircraft; heat waves make the air shimmer and swell eggs up (easier to hit with).

## 9. Egg types (Yolk Drop options)

- [x] **Frost egg** - freezes hit units in an ice block for a few seconds.
- [x] **Zapper egg** - lightning chains from the hit unit to 3 nearby enemies.
- [x] **Smoke egg** - a thick cloud where units can't aim (they fire wild).

## 10. Vehicles

- [x] **Catapult Wagon** - slow siege cart that lobs huge eggs from far back.
- [x] **Chick Balloon** - hot-air balloon that drifts over and drops chick paratroopers.
- [x] **Frying-Pan Monster Truck** - armoured bruiser that crushes infantry it drives over.

## 11. Powers

- [x] **Power loadout** - a pre-battle picker. Choose 2 powers for the W/E slots from everything unlocked.
- [x] **Rooster Rally power** - for 6 s the whole army moves and fires 40% faster.
- [x] **Reinforcements power** - a coop drops in 4 soldiers right at your castle.
- [x] **Big Chill power** - freezes every enemy for 2.5 s.

## 12. Bosses

- [x] **Mother Hen Queen** - giant hen that lays enemy chicks and flaps wind gusts that push eggs back.
- [x] **Sink Kraken** - tentacles burst from the ground under units, then it shows its head to be hit.

## 13. Integration & polish

- [x] **Enemy use of new content** - personalities field the new vehicles; a new "Mad Science" personality throws frost and zapper eggs.
- [x] **Unlocks, achievements & tips for Phase 2** - extended unlock table, new achievements and first-time tips.
- [x] **Final review II** - balance sim with all new content, stress test, performance, docs and a CHANGELOG summary.

---

# Phase 3: Challenge, Focus & More Surprises

Third loop. Starting point (`tools/winrate-sim.js`, a player with the progression from
balance-sim): idle wins about 80% of the time, active play (Yolk Drops and powers) about 98%,
and rounds last about 40 s. Goals:
- **Difficulty:** occasional losses. Target roughly 45-65% idle and 75-90% active, with every
  stage beatable (Rally after 2 losses).
- **Round length:** rounds about 50% longer.
- **Screen:** fewer choices on screen at once, picked at random per stage.
- **Surprises:** more humour.
- **Performance:** no added lag. Measure frame time after each item.

## 14. Challenge

- [x] **Longer rounds** - round time ×1.5 (timer, boss bonus and tiebreaks still work); winrate-sim tool committed.
- [x] **Enemy reinforcements** - the red army calls in small reinforcement waves during the round (banner, units march in from the right), paid from an extra budget that scales with D(n).
- [x] **Tougher enemies & tuning** - enemy HP and budget tuned with winrate-sim to the target; Rally and boss stages rechecked so no stage is a wall.

## 15. Focus (less on screen)

- [x] **Stage kit: units** - each stage offers at most 6 unit cards (soldier and tank plus 4 seeded-random picks from your unlocked units), in a single shop row with keys 1-6.
- [x] **Stage kit: eggs** - each stage offers at most 3 Yolk Drop eggs (Classic plus 2 random unlocked ones).

## 16. Surprise events

- [x] **Goats** - a herd of goats wanders in and headbutts troops of both armies (knock-back, no damage), sometimes eating a splat.
- [x] **Bee Swarm** - a buzzing swarm chases the nearest units and stings them (1 hit), then flies off.
- [x] **Frog Plague** - frogs rain down and hop around; ground units trip over them (slowed), eggs bounce off.
- [x] **Slime Monsters** - green slimes ooze out of the ground and attack whoever is nearest; either army can splat them.

## 17. New content (each stage still shows only a few things)

- [x] **Biome: Swamp** - murky water and reeds, mud-pit hazard (very slow), fireflies at dusk.
- [x] **Biome: Candy Mountains** - candy-striped hills, gumdrops, a syrup-geyser hazard.
- [x] **Weather: Sandstorm** - drifting dust lowers aircraft accuracy and wind pushes eggs hard.
- [x] **Egg: Popcorn** - pops into a shower of kernels on landing.
- [x] **Vehicle: Rolling-Pin Roller** - a slow roller that shoves light enemy units back as it advances and bonks the one in front (terrain flattening dropped: redrawing the ground every frame would cost frame time).
- [x] **Power: Scarecrow Decoy** - a scarecrow draws all enemy fire for 6 s.
- [x] **Boss: Pancake Golem** - a stack of pancakes; every third of its HP a pancake slides off and fights on its own.

## 18. Final

- [x] **Final review III** - winrate check, 60-stage stress test, frame-time check, docs and a CHANGELOG summary.

---

# Phase 4: Monsters, Mysteries & More

Fourth loop. Keep the look, the controls and the calm screen: at most 6 unit cards, 3 egg chips,
2 power slots and one event at a time. Every new item must keep the frame cost flat (checked in
the final review). New content arrives through the kit, the Variety Director and the boss
rotation, so a single stage never shows much at once.

## 19. Surprise events (one per stage at most; neutral; at most 1 hit per unit)

- [x] **Sasquatch** - a big hairy fellow strolls across, picks up a random trooper, sniffs it, and sets it down somewhere else.
- [x] **Panicky Tourists** - a tour bus parks mid-field; tourists run about snapping photos, and their camera flashes make troops stop and pose ("Cheese!").
- [x] **Ghosts** - (night-leaning) ghosts drift through the field; spooked troops turn tail and run back for a moment.
- [x] **Giant Snake** - a huge snake slithers along the ground, bumping troops into the air as it passes.
- [x] **Rock Monster** - a rock golem rises from the ground and stomps the nearest troops; either army can crumble it with eggs.

## 20. New content (each arrives through the kit, Director or rotation)

- [x] **Weather: Meteor Shower** - night only: small meteors streak down with a warning glow.
- [x] **Weather: Blizzard** - snowfield: heavy snow, whiteout edges, ground units 15% slower.
- [x] **Biome: Spooky Graveyard** - tombstones, dead trees, fog; restless graves pop out skeleton hands that hold troops for a moment.
- [x] **Biome: Sunny Beach** - sand and surf, palm trees, sandcastles; tide pools slow units; tourists favour it.
- [x] **Egg: Magnet** - pulls nearby enemies together toward the impact point (sets up other eggs).
- [x] **Vehicle: Hover Coop** - fast hovercraft that ignores hazards, mud and goo, firing quick eggs.
- [x] **Power: Golden Goose** - a goose waddles out and lays gold coins (+gold over 8 s).
- [x] **Boss: Toaster Titan** - a giant toaster that pops flaming toast; enraged, it fires toast volleys.
- [x] **Calm HUD pass** - enemy roster capped at 8 icons, shorter tips, and stacked banners never overlap.

## 21. Final

- [x] **Final review IV** - winrate check, stress test, frame time, docs and a CHANGELOG summary.

---

# Phase 5: Robots, Jellyfish & Bacon

Fifth loop. Same rules as Phase 4: calm screen (6 cards, 3 eggs, 2 powers, one event per
stage), neutral events, and a flat frame cost checked in the final review.

## 22. Surprise events

- [x] **Alien Jellyfish** - glowing jellyfish float down from a portal; a touch zaps a unit (1 hit) and leaves it buzzing.
- [x] **Killer Robot** - a clanky robot marches in from one side, scanning, and fires a laser at the nearest units of both armies; either army's eggs can short it out.
- [x] **Cat Stampede** - a flood of cats chases a red laser dot across the field, knocking troops aside and batting eggs out of the air.
- [x] **Bacon Monster** - a sizzling bacon creature rises out of a giant pan, flops onto troops and leaves greasy puddles that make units slide.

## 23. New content (each arrives through the kit, Director or rotation)

- [x] **Biome: Moon Base** - grey craters and Earth in the sky; low gravity makes every egg float further.
- [x] **Weather: Pollen Storm** - drifting pollen clouds; ground units sneeze and miss shots now and then.
- [x] **Egg: Bubble** - traps the first enemies it touches in floating bubbles for a few seconds.
- [x] **Vehicle: Pogo Tank** - a tank on a giant spring that bounces over the front line and lands among the enemy.
- [x] **Power: Time Freeze** - every enemy egg in the air freezes for 4 s, then drops straight down (your own eggs keep flying).
- [x] **Boss: Waffle Iron Warlord** - a giant waffle iron that clamps the field ahead of it shut, then flings waffles.

## 24. Final

- [x] **Final review V** - winrate check, stress test, frame time, docs and a CHANGELOG summary.

---

# Phase 6: Plagues, Pests & Blenders

Sixth loop. Same rules: calm screen (6 cards, 3 eggs, 2 powers, one event per stage), neutral
events (at most 1 hit per unit), and a flat frame cost checked in the final review.

## 25. Surprise events

- [x] **Giant Bird** - a huge bird swoops down, snatches one trooper from each army and flies off with them.
- [x] **Chicken Pox** - a spotty itch spreads from unit to unit on contact; itchy units move and fire at half speed until it wears off (no damage).
- [x] **Hiccup Outbreak** - troops on both sides get the hiccups: they hop at random and every hiccup sends a shot wild.
- [x] **Mole Invasion** - moles pop out of molehills all over the field; troops trip in the holes and moles steal splats.

## 26. New content (each arrives through the kit, Director or rotation)

- [x] **Weather: Rainbow** - after a shower, a rainbow arcs over the middle of the field; units under it fire 25% faster (both armies).
- [x] **Biome: Jungle** - vines and giant leaves; creeping vines hazard briefly tangles ground units.
- [x] **Egg: Sleepy** - puts enemies in the splash to sleep (Zzz) for 4 s, or until something hits them.
- [x] **Vehicle: Pigeon Flock** - three pigeons fly over the enemy and dive-bomb ground troops.
- [x] **Power: Mega Yolk** - your next Yolk Drop is giant: triple burst, and the cooldown resets.
- [x] **Boss: Blender Beast** - a giant blender whose vortex sucks ground troops toward it, then spits them out.

## 27. Final

- [x] **Final review VI** - winrate check, stress test, frame time, docs and a CHANGELOG summary.

---

# Phase 7: Dinosaurs & Detours

Seventh loop. Same rules: calm screen (6 cards, 3 eggs, 2 powers, one event per stage), neutral
events (at most 1 hit per unit), and a flat frame cost checked in the final review.

## 28. Surprise events

- [x] **Dinosaur Stampede** - a herd of dinosaurs thunders across the field; anyone in the way is bowled over.
- [x] **Lost Uber Driver** - a little car wanders the field honking, picks up one confused trooper and drops them off at the wrong end.
- [x] **Pizza Delivery** - a delivery scooter drops pizza boxes; nearby troops stop to eat a slice (and heal 1).
- [x] **Giggle Fits** - a contagious case of the giggles: laughing units stop to hold their sides for a moment.

## 29. New content (each arrives through the kit, Director or rotation)

- [x] **Weather: Gusty Gale** - the wind keeps flipping direction every few seconds.
- [x] **Biome: Prehistoric Valley** - ferns and volcanoes in the distance, with bubbling tar pits that slow troops.
- [x] **Egg: Hot Sauce** - enemies in the splash panic and run backwards for a moment without firing.
- [x] **Vehicle: Dino Rider** - a small T-rex with a rider that chomps enemies up close.
- [x] **Power: Healing Rain** - a warm shower heals every unit in your army.
- [x] **Boss: Dino Mama** - a giant T-rex that roars troops back and sweeps its tail.

## 30. Final

- [x] **Final review VII** - winrate check, stress test, frame time, docs and a CHANGELOG summary.

---

# Phase 8: Little Green Men

Eighth loop. Same rules: calm screen (6 cards, 3 eggs, 2 powers, one event per stage), neutral
events (at most 1 hit per unit), and a flat frame cost checked in the final review.

## 31. Surprise events

- [x] **Alien Landing** - a flying saucer lands mid-field and little green aliens zap troops on both sides before beaming back up.
- [x] **Mystery Green Army** - a squad of green soldiers nobody ordered marches in and lobs eggs at everyone; any egg splash knocks them out.
- [x] **Egg Storm** - eggs rain down from the sky all over the field (at most one hit per unit).
- [x] **Hungry Squirrel** - a giant squirrel scampers along snatching eggs out of the air.

## 32. New content (each arrives through the kit, Director or rotation)

- [x] **Weather: Aurora** - night lights dazzle pilots: aircraft fly and fire more slowly.
- [x] **Biome: Alien Planet** - purple soil, crystal spires, two moons, lighter gravity and warp pads that teleport troops.
- [x] **Egg: Shrink** - enemies in the splash shrink for a while: tiny, slow and firing at half rate.
- [x] **Vehicle: Saucer** - a little flying saucer whose tractor beam lifts an enemy trooper and drops it.
- [x] **Power: Haystack Wall** - a wall of hay bales pops up in front of your army and soaks up enemy eggs for 6 s.
- [x] **Boss: Alien Mothership** - a huge saucer that beams up troops and rains down ray blasts.

## 33. Final

- [x] **Final review VIII** - winrate check, stress test, frame time, docs and a CHANGELOG summary.

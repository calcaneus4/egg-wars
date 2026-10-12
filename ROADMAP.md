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

- [ ] **Tornado** - a twister wanders across the field, lifts light units and eggs, and spins them around before dropping them.
- [ ] **Tsunami** - a cartoon wave (with rubber ducks) rolls in from one edge, pushes ground units back and washes away splats and goo.
- [ ] **Chicken Stampede** - a flock of panicking farm hens runs across, knocking soldiers over and shouting "BAWK!".
- [ ] **UFO Abduction** - a flying saucer beams up one unit from each army and drops back a confused cow.

## 8. Weather

- [ ] **Fog** - drifting fog banks limit vision: units fire only at targets within a shorter range.
- [ ] **Thunderstorm** - rain plus lightning strikes: a flicker warns first, then the strike damages whatever stands there.
- [ ] **Hail & Heat wave** - hail lightly damages aircraft. Heat waves make the air shimmer and give eggs extra splash.

## 9. Egg types (Yolk Drop options)

- [ ] **Frost egg** - freezes hit units in an ice block for a few seconds.
- [ ] **Zapper egg** - lightning chains from the hit unit to 3 nearby enemies.
- [ ] **Smoke egg** - a thick cloud where units can't aim (they fire wild).

## 10. Vehicles

- [ ] **Catapult Wagon** - slow siege cart that lobs huge eggs from far back.
- [ ] **Chick Balloon** - hot-air balloon that drifts over and drops chick paratroopers.
- [ ] **Frying-Pan Monster Truck** - armoured bruiser that crushes infantry it drives over.

## 11. Powers

- [ ] **Power loadout** - a pre-battle picker. Choose 2 powers for the W/E slots from everything unlocked.
- [ ] **Rooster Rally power** - for 6 s the whole army moves and fires 40% faster.
- [ ] **Reinforcements power** - a coop drops in 4 soldiers right at your castle.
- [ ] **Big Chill power** - freezes every enemy for 2.5 s.

## 12. Bosses

- [ ] **Mother Hen Queen** - giant hen that lays enemy chicks and flaps wind gusts that push eggs back.
- [ ] **Sink Kraken** - tentacles burst from the ground under units, then it shows its head to be hit.

## 13. Integration & polish

- [ ] **Enemy use of new content** - personalities field the new vehicles; a new "Mad Science" personality throws frost and zapper eggs.
- [ ] **Unlocks, achievements & tips for Phase 2** - extended unlock table, new achievements and first-time tips.
- [ ] **Final review II** - balance sim with all new content, stress test, performance, docs and a CHANGELOG summary.

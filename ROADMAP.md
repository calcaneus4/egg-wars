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
- [ ] **Homing egg** - slow seeker egg for anti-air, unlocked mid-game.
- [ ] **Biomes** - Meadow, Desert, Snowfield, Volcano, Kitchen Counter; each with terrain generator settings, palette and decorations; rotate every few stages.
- [ ] **Hazards** - lava vents (Volcano), ice that makes ground units slide (Snowfield), quicksand (Desert), hot-pan geysers (Kitchen).
- [ ] **Boss battles** - every 5th stage: Giant Rooster Mech, Omelet Fortress, Scrambler Zeppelin; health bar, phases, big rewards; scaled with the same `D(n)`.
- [ ] **Optional objectives** - 1-2 bonus goals per stage (win under X s, lose no tanks, 3 Yolk Drop kills) paying extra Golden Eggs.
- [ ] **Achievements** - ~20 achievements with toasts and a gallery page; some grant cosmetic color schemes.
- [ ] **World map / stage select** - biome path showing cleared stages, bosses and next unlock; replay any cleared stage for practice rewards.
- [ ] **Stats page** - lifetime kills, eggs thrown, favourite unit, best wipeout time.

## 5. Final

- [ ] **Final review pass** - bugs, balance simulation against DESIGN.md, performance (object pooling, draw cost), polish; full CHANGELOG summary.

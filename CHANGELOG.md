# Changelog

## Summary

Egg Wars began as one 2,000-line `game.js` with a fixed army, linear difficulty and no saving.
It is now a modular browser game (32 scripts under `js/`, still no build step) with the
following, all in the original hand-drawn side-view style:

- **Progression:**
  - A versioned save with migrations.
  - Player levels and XP.
  - Golden Eggs and a 6-track, 20-level Armory.
  - A level-by-level unlock schedule with something new every 1-3 levels.
  - 20 achievements, some of which unlock colour schemes.
  - Per-stage bonus goals.
  - A World Map with practice replays.
  - A lifetime stats page.
- **Fair difficulty** (see `DESIGN.md`):
  - A logarithmic difficulty curve, with enemy armies bought from a points budget.
  - Enemy personalities and boss stages that cost the same budget.
  - The Rally comeback boost after losing streaks.
  - Rewards for losing.
  - A balance simulator (`tools/balance-sim.js`) and auto-battle playtests confirming that player power stays ahead of difficulty.
- **Onboarding:** a guided first battle, one-time tips, and readable banners for enemies, bosses, biomes and hazards.
- **Content:**
  - Units: 3 new units (Medic, Mortar Hen, Rooster Rider).
  - Egg types: 5 new ones (Cluster, Bouncer, Sticky, Boomer with terrain craters, Seeker).
  - Abilities: 2 (Airstrike, Shell Shield).
  - Enemies: 4 enemy personalities and 3 bosses with enraged phases.
  - Biomes: 5, each with neutral hazards.
  - Weather: rain, snow and wind that pushes eggs.
- **Graphics:**
  - Parallax backgrounds and time of day.
  - Hatched terrain art and unit fills, flags, cracks and health bars.
  - Pooled particle effects, screen shake and hit flashes.
  - Egg trails, drips and shells.
  - An illustrated HUD, an animated results screen, and title, pause and settings menus.
- **Sound:**
  - Procedural Web Audio effects with variation and voice limiting.
  - Procedural music whose intensity follows the battle.
  - Master, effects and music sliders, plus mute.
- **Tooling:**
  - A headless smoke test (`tools/smoke-test.js`).
  - The balance simulator.

## Entries

- Planning: added ROADMAP.md (prioritized feature checklist) and DESIGN.md (progression, difficulty and reward formulas).
- Code: split `game.js` into `js/` scripts (config, util, audio, terrain, draw, units, projectiles, game, main) and added a headless smoke test (`tools/smoke-test.js`).
- Progression: versioned localStorage save (stage, gold, unlocks, wins/losses) with migrations, corrupt-data fallback and autosave; `Shift+N` starts a new game.
- Progression: player level and XP (wins, losses and kills all count), Golden Eggs currency earned from wins, level-ups and loss streaks, XP bar in the HUD, level-up banner and XP/GE lines on the results screen.
- Balance: logarithmic difficulty curve D(n) drives enemy HP, fire rate, army point budget and round time; enemy armies are bought from a budget; survivor gold bonus rescaled (~76 gold per stage-1 wipeout instead of ~400); losses pay 10 + stage gold; added `tools/balance-sim.js`.
- Balance: "Rally" comeback assist after 2+ losses in a row (bonus gold, free tank, smaller enemy army, shields at 3+ losses); ends on the next win and never reduces win rewards.
- UI: title screen (Play/Continue with profile summary), pause menu (Esc/P), settings screen (volume, mute, color scheme, speech bubbles, screen shake, New Game) saved in the profile; `M` mutes.
- Progression: Armory with six 20-level Golden Egg upgrade tracks (Thick Shells, Rapid Lobbing, Hard-Boiled Eggs, War Chest, Quick Yolk, Bulk Orders), opening at level 2, reachable from the title and results screens.
- Progression: level-based unlock schedule (units, specials, Armory) with "next unlock" teaser on HUD and results screen, locked unit buttons, budget-built player army from unlocked types, and enemy unit types phased in by stage.
- Onboarding: skippable 3-step guided first battle (with starter gold and a pointer), one-time contextual tips (unlocks, Rally, Armory, low time), replayable from Settings.
- Graphics: pooled particle effects (smoke, sparks, yolk droplets, debris, shock rings), muzzle flashes, tank recoil, flashing hit feedback and setting-aware screen shake on big hits and explosions.
- Graphics: three-layer parallax background (snow-capped mountains, hatched hills, tree line) pre-rendered per stage with a hand-inked double stroke, a sketchy rotating sun, and solid ground under the terrain line.
- Graphics: pre-rendered terrain art with surface hatching, deep cross-hatching, pebbles, grass tufts and a double-inked outline (cached per stage, ~1 ms to rebuild).
- Graphics: unit art polish - translucent team fills, helmets, cockpit windows, waving flags on tanks and castles, castle brickwork, spinning helicopter rotors, damage cracks and small health bars (replacing tally-mark HP).
- Graphics: team-tinted egg motion trails, spinning filled eggs (burst eggs banded in yolk), irregular splats with running drips and yolk highlights that fade after ~9 s, and tumbling eggshell halves on impact.
- UI: new battle HUD - illustrated unit shop cards with prices, counts and 1-8 hotkeys, stage/gold/timer panel with draining clock and army-strength bar, enemy roster with icons, XP bar, and a Yolk Drop button with cooldown ring; aircraft fly below the HUD.
- UI: animated results screen - VICTORY/DEFEAT stamp, gold/XP/Golden Egg rows that count up, filling XP bar, LEVEL UP stamp with confetti, flip-in unlock cards, next-unlock teaser, tip, and Next Stage / Armory buttons (click or Enter skips the animation).
- Graphics: time of day - stages cycle day, day, dusk, night, dawn (stages 1-2 always day) with gradient sky tints, twinkling stars, a cratered moon at night, a light ground wash, and a gentle drift toward the next phase during each round.
- Graphics/Gameplay: weather per stage (clear, rain, snow, windy; stages 1-2 clear) with rain streaks and splashes, drifting snow, blowing leaves, a mid-field wind sock, a HUD weather readout, and gusting wind that pushes every egg in flight equally for both armies.
- Sound: procedural Web Audio SFX engine - every effect synthesised from oscillators and filtered noise with random pitch/length variation, per-sound retrigger gaps, a 28-voice cap, master/SFX/music buses, new UI sounds (coin, click, deny, tick, level-up, unlock); original WAV jingles kept as an optional layer.
- Sound: procedural background music - lookahead step sequencer with bass, chord pads, a per-stage seeded melody and drums; moods follow time of day (plus a calm title theme); an intensity layer adds lead, snare and hats as eggs fly; music fades out under victory/defeat stings.
- Sound: separate Master / Effects / Music volume sliders (with live previews) in Settings, saved in the profile; M toggles mute anywhere and the HUD shows a MUTED badge.
- Depth: data-driven egg type framework (damage, burst, mid-air split, visuals) and the Cluster egg (level 4) - a Yolk Drop option that splits into 6 eggs mid-air; choose the Yolk Drop egg with Q or the HUD chips (saved).
- Depth: Bouncer egg (level 7, hops toward the enemy bursting on each of 3 bounces) and Sticky egg (level 10, gooey burst that glues hit units so they move and fire at 35% speed for 3 s, with goo shown on them); both selectable Yolk Drop eggs.
- Depth: Boomer (explosive) egg at level 14 - fizzing fuse, area blast (2 hits near the centre, 1 at the edge), big explosion and shake, and craters dug into the terrain that units then drive through; terrain art and wreckage update to the new ground. Tips moved above the Yolk Drop chips.
- Depth: abilities bar - Airstrike (W, level 7: a bomber sweeps the enemy half dropping 9 bursting eggs, 22 s) and Shell Shield (E, level 12: one-hit shields for the whole army, 32 s) with cooldown rings; Quick Yolk now shortens all cooldowns.
- Depth: three new units - Egg Medic (level 6, heals the most hurt ally nearby), Mortar Hen (level 11, slow long-range bursting lobs) and Rooster Rider (level 16, fast melee cavalry) - with hand-drawn art, a second shop row (keys 9, 0, -), threat points so enemies field them at later stages, and roster icons.
- Depth: enemy personalities - Rusher, Turtle Shell, Artillery and Air Force armies rotate with Balanced after stage 2, each with its own unit mix and movement/stat tweaks paid for by a smaller budget, announced by a stage-start banner with a counter-tip and labelled under the enemy roster.
- Depth: Seeker (homing) egg at level 18 - a Yolk Drop releases 4 finned seeker eggs that ignore gravity for 4.5 s and steer toward the nearest enemy, aircraft first, leaving smoke trails; ability buttons moved right to fit all egg chips.
- Content: five biomes rotating every 5 stages - Meadow, Desert Dunes (sand tint, stipple, cacti), Snowfield (snow caps, pines), Volcano (dark rock, glowing cracks, boulders) and Kitchen Counter (flat tiled counter, jars and bottles) - each with its own terrain shape, weather table, HUD label and first-visit tip.
- Depth: biome hazards placed mirror-symmetric mid-field and neutral to both armies - Desert quicksand (slows ground units), Snowfield ice (speeds them up), Volcano lava vents and Kitchen hot pans (warn with bubbles, then erupt for 1 hit) - each with art, effects and a first-time tip.
- Content: boss battles every 5th stage - Giant Rooster Mech, Omelet Fortress and Scrambler Zeppelin - with hand-drawn art, a boss health bar, an enraged second phase with special moves, intro banner, and +40 gold / +3 Golden Egg rewards; the boss takes 40% of the normal budget so difficulty stays smooth.
- Depth: optional bonus goals - 1-2 seeded goals per stage (speed win, no tank losses, no purchases, survivors, Yolk Drop kills, destroy the castle) shown with live check/cross marks, paying +1-2 Golden Eggs (some even on a loss); egg kills are now attributed to their source. Seeded RNG now mixes its seed so neighbouring stages differ properly.
- Progression: 20 achievements (wins, levels, stages, bosses, kills, Yolk Drop kills, purchases, Armory, goals, biomes, comebacks, blitz, flawless, night wins) with slide-in toasts, +1 Golden Egg each, a gallery on the title screen, lifetime stat tracking, and three unlockable colour schemes (Breakfast, Golden, Midnight).
- Progression: World Map - a winding 25-stage path through the five biome bands with cleared/current/locked nodes, boss crowns and stage previews (biome, time of day, enemy or boss); cleared stages replay as practice for half gold/XP without moving progress. Title screen reorganised (World Map, Armory + Trophies row).
- Progression: Battle Record stats page (title > STATS) - battles, win rate, stage, level, bosses, goals, time in battle, kills, Yolk Drop kills, eggs thrown, purchases, favourite unit with icon, fastest win and wipeout, gold and Golden Eggs earned.
- Final review: 60-stage headless stress run with every feature (no errors); HUD icons cached and egg trails batched (draw ~22 ms -> ~16 ms in software rendering, HUD 2.3 -> 0.4 ms); particle pool trimmed; boss stages rebalanced after win-rate sims (+12 s, boss counts half HP at timeout, softer Mech/Fortress volleys); title shows all hotkeys; README and DESIGN refreshed with playtest results.
- Polish: screen shake is now saved for big moments (tank, castle and boss kills, explosive eggs, boss stomps); small hits no longer shake, and a 1.2 s cooldown stops back-to-back shakes. About 4x less shaking in a typical battle.
- Graphics: parallax hill layers are now solid, so nearer hills cover the mountains behind them; the dusk/night sky tint is drawn over them and stars only show above the far ridge.
- Events: Variety Director (`js/director.js`) plans each stage's extras: from stage 4 a seeded 12-45% chance of one surprise event (halved on boss stages), never the same event twice in a row, and at most one never-seen thing per stage. Event framework (`js/events.js`) with warning banner and first event, the **Earthquake**: the ground rumbles and shifts in four jolts, ground units stumble, splats pop off and someone asks "Who ordered this?".
- Events: **Tornado** (stage 5+) - a sketchy twister wanders across the field, scooping up to 6 light units at a time, spinning them around ("Wheee!") and flinging them aside (1 hit on landing). Tanks, castles and bosses hold their ground; eggs get sucked up and aircraft are buffeted. Units off the ground can't move, fire or block.
- Events: **Tsunami** (stage 6+) - a cartoon wave with a curling crest and a flotilla of rubber ducks rolls across the field from a random side. It carries ground units along (up to a set distance, tanks half as far), bobs them on the water, puts out sticky goo, drowns eggs flying into it, washes away splats and wreckage, damps lava vents and leaves a couple of rubber ducks stranded on the battlefield. In the Kitchen it's the sink overflowing. Event speech is now rate-limited so bubbles stay readable.

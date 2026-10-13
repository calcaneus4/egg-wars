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

## Phase 2 summary

The second loop added depth and surprises without changing the core flow (buy units, drop
yolk, use powers) or the hand-drawn side view:
- **Variety Director:** at most one surprise event per stage (from stage 4, 12-45% chance), at
  most one never-seen thing per stage, and no back-to-back repeats.
- **5 surprise events:** Earthquake, Tornado, Tsunami (with rubber ducks), Chicken Stampede and
  UFO Abduction (it leaves a cow).
- **4 new weathers:** fog, thunderstorm, hail and heat wave, joining the biome tables in
  later stages.
- **3 new eggs:** Frost, Smoke and Zapper.
- **3 new vehicles:** Catapult Wagon, Monster Truck and Chick Balloon.
- **Powers:** 3 new powers (Reinforcements, Rooster Rally, Big Chill) and a W/E loadout with
  its own screen.
- **2 new bosses:** Mother Hen Queen and Sink Kraken, plus a randomized boss rotation.
- **Enemies:** the Mad Science army, and enemies now field the new vehicles.
- **Achievements:** 8 more (28 in all) and the Ocean colour scheme.
- **Fixes:** the Turtle army never appeared (now fixed); explosion screen shake is rarer;
  parallax layers are solid.
- **Final review:** a 60-stage stress run with a forced event every stage, random eggs, powers
  and purchases had 0 errors. Frame cost is about 15 ms in software rendering (unchanged),
  and fog drawing was optimized.

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
- Events: **Chicken Stampede** (stage 4+) - 14-19 panicking farm hens sprint across the field squawking, gobbling up splats and bowling over soldiers and bikes from both armies (they tip over and lie still for a second or so).
- Events: **UFO Abduction** (stage 8+, needs 3+ units per side) - a flying saucer beams up one matching trooper from each army (a soldier if possible; no kill credit, no wreckage), then drops a cow, which says "MOO." and stays on the field. The saucer ends the event itself once it has flown off.
- Weather: four new weather types join the biome tables from their DESIGN.md stages, each with a first-time tip and a HUD label.
  - **Fog** (stage 6+): drifting fog banks; ground units only see enemies within 40% of the field.
  - **Thunderstorm** (stage 9+): heavy rain, a darker sky and lightning every 5-9 s. The ground flickers with a "!" ring for 1.3 s before a bolt hits for 1 damage around the strike point. Comes with a thunder sound.
  - **Hail** (stage 12+): bouncing hailstones; every aircraft takes a hit every 5-9 s.
  - **Heat wave** (stage 12+): shimmering air and eggs swell up 35%, making them easier to hit with.
- Eggs: three new Yolk Drop eggs, unlocked at levels 9, 13 and 15 and drawn with their own markings.
  - **Frost** (lv 9): an icy splash freezes every enemy near the impact for 2.5 s, plus frost shards. Frozen units sit in an ice block and can't move or fire; bosses freeze for a third as long.
  - **Smoke** (lv 13): a smoke cloud lasts 7 s, and anyone firing from inside it shoots wildly.
  - **Zapper** (lv 15): chain lightning jumps from the impact through up to 4 enemies for 1 hit each.
- HUD: ability buttons moved right, and the egg chips get compact once there are more than 6, so the bottom bar stays tidy.
- Vehicles (`js/vehicles.js`): three new buyable units with shop cards (keys `=`, `[`, `]`), icons, threat points and caps.
  - **Catapult Wagon** (lv 6, $35): a slow siege cart that stops once enemies are within half the field and flings huge 6-burst eggs with a swinging arm.
  - **Monster Truck** (lv 11, $30): a frying pan on monster wheels. Infantry can't block it; it drives over them for 2 hits and rams vehicles and castles.
  - **Chick Balloon** (lv 13, $40): a hot-air balloon that drifts over the enemy's ground troops and drops up to 4 one-hit chick paratroopers, which float down on little parachutes.
  - Heavy vehicles are too heavy for the tornado.
- Powers: abilities are now **powers** with a two-slot **loadout** (W/E).
  - The new **Powers** screen (title and pause menus) lists every power with its cooldown; tap W or E to equip one, and picking a power already in the other slot swaps them. Empty slots fill themselves as powers unlock, the save keeps your picks, and the HUD previews the next power to unlock.
  - **Reinforcements** (lv 4): 4 soldiers parachute in beside your castle.
  - **Rooster Rally** (lv 10): "COCK-A-DOODLE-DOO!" - the whole army moves and fires 40% faster for 6 s.
  - **Big Chill** (lv 17): a blizzard flash freezes every enemy for 2.5 s (bosses for a third as long).
- Bosses: two new bosses.
  - **Mother Hen Queen** (first at stage 20): a crowned hen on her nest. She alternates between laying eggs that hatch into chick soldiers (at most 8 alive) and lobbing eggs. When enraged she flaps up a gust that blows the player's eggs back and shoves nearby troops.
  - **Sink Kraken** (first at stage 25, the kitchen): lurks in a puddle and slams tentacles up under your troops after a flickering crack warning. Most hits splash off while it's under, so strike when it surfaces ("BLUB BLUB!") and sprays ink eggs.
  - The first five boss stages meet each boss once; after that the boss is a seeded random pick that never repeats back-to-back. The world map shows the right boss names.
- Enemies: the new vehicles join enemy armies once their stage allows (Catapult Wagon from stage 11, Monster Truck from 21, Chick Balloon from 25), weighted by personality: Artillery loves catapults, Rushers trucks, Air Force balloons.
- Enemies: new **Mad Science** personality (stage 14+, a seeded 20% chance on a non-boss stage, never twice in a row). Its army mixes infantry, medics, mortars and catapults, and 30% of its eggs are frost shards (1.5 s freeze) or zap shards (lightning jumps to one more unit).
- Fix: the Turtle personality never appeared, because its slot in the rotation always landed on a boss stage; the rotation now skips boss stages. The enemy roster lists the types actually on the field first, so new unit types always show.
- Achievements: 8 new achievements (28 in all). Monster Hunter also unlocks the new **Ocean** colour scheme.
  - Expect the Unexpected: live through 10 surprise events.
  - Seen It All: see all 5 kinds of surprise event.
  - Weatherman: fight in all 7 kinds of bad weather.
  - Monster Hunter: defeat every kind of boss.
  - Cold Snap: freeze 50 enemies.
  - Monster Jam: flatten 25 enemies with Monster Trucks.
  - Chick Magnet: drop 20 chick paratroopers.
  - Power Player: use powers 50 times.
- Achievements: the gallery switched to 5 columns so all 28 fit.
- Tips: the Phase 2 unlocks already show NEW tips. A new tip points to the Powers screen once you have more powers than slots.
- Final review II:
  - The 60-stage stress test (every event, random eggs, powers and purchases) had no errors.
  - Profiling showed the software-renderer frame cost is still ~15 ms; the rare spikes were batched canvas flushes. Fog now draws a cached sprite instead of 14 gradients per frame.
  - README, DESIGN.md (Phase 2 numbers) and the changelog summary are up to date.
- Fix: Monster Trucks (both armies) were invisible. Their speed read a setting that doesn't exist (`motorcycleSpeed`), so their position became NaN on the first frame. The enemy roster still counted them, and they could never be destroyed, which could stall a battle until the timer ran out. Trucks now use 60% of top motorcycle speed.
- Phase 3 plan: ROADMAP section 14-18 and DESIGN.md section 13 (win-rate targets).
- Tools: `tools/winrate-sim.js` plays real headless battles with a player whose level and Armory follow the balance-sim progression, and reports idle and active win rates per stage. Phase 2 baseline: ~80% idle, ~98% active.
- Balance: rounds are 50% longer (base 57 s instead of 38 s, +15 s per difficulty point instead of 10; bosses +18 s instead of 12). Lightning War now asks for a win under 25 s.
- Challenge: **enemy reinforcements** (`js/reinforcements.js`). From stage 3 the red army calls in 1-3 waves per round (more in later stages) with a horn and a "RED REINFORCEMENTS! +N" banner. Each wave is about 20% of the enemy budget, smaller in early stages, on boss stages and during Rally.
- Challenge: enemy HP gets a +15% toughness bonus that ramps in over stages 4-10. The Turtle army has less extra HP (+5%) but moves faster, so it fights instead of winning by timeout.
- Measured with winrate-sim (10 runs per stage): idle wins dropped from ~80% to ~33%, while active play (Yolk Drops and powers) still wins ~98%. Passive play now loses, attentive play wins. The no-wall check is now "Armory alone within 10% of the enemy".
- Focus: **stage kits** (`js/kit.js`). Each stage now offers one row of at most 6 unit cards (keys 1-6): soldier and tank, plus 4 seeded-random picks from your unlocked units. It also offers at most 3 Yolk Drop eggs: Classic plus 2 picks. Fresh unlocks always appear first, until you have 6 units the next unlock shows as a locked teaser card, and an Air Force stage always offers anti-air when you have it. Replays offer the same kit.
- Events (`js/critters.js`), four new surprise events picked by the Variety Director:
  - **Goats** (stage 5+): 3-5 goats wander in, pick a target, lower their heads and charge, butting troops of either army backwards and knocking them over (no damage). They munch on splats too.
  - **Bee Swarm** (stage 7+): a buzzing swarm chases the nearest unit of either army, stinging each victim once.
  - **Frog Plague** (stage 6+): frogs rain from the sky and hop about. Ground troops trip over them, and falling eggs bounce off them.
  - **Slime Monsters** (stage 9+): 2-3 wobbling slimes ooze out of the ground, slime whoever is closest (1 hit, then sticky), and can be splatted by either army's eggs.
- Fix: with no powers unlocked, both power slots previewed the same power; now only the first empty slot shows the preview.
- Biomes: two new lands join the cycle after the Kitchen (now 7 biomes, 35 stages per lap).
  - **Soggy Swamp**: murky green ground with puddles, reeds and cattails, droopy willows in the background, frequent fog and rain, and **mud pits** that slow ground units to 30%.
  - **Candy Mountains**: candy-striped pink hills with sprinkles, an icing edge and gumdrops, lollipops and candy canes in the background, and **syrup geysers** that glue troops in place for 2.5 s (no damage).
- Events: events can favour biomes. Frogs are 4x as likely in the swamp, slimes in the swamp and candy lands, and goats and bees in the meadow.
- Weather: **Sandstorm** (stage 8+, mostly in the desert, a little in the volcano): near-maximum wind pushes every egg hard, the air goes dusty brown with sand streaks, and aircraft get up to ±90 px of extra aim error when bombing or shooting.
- Eggs: **Popcorn** (lv 11): after landing it pops three times, 0.45 s apart, each pop spraying 5 small kernels. Kernels leave no splats, to keep the field (and the frame rate) clean. Weatherman now asks for every kind of bad weather.

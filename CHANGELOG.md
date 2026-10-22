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

## Phase 6 summary

The sixth loop:
- **4 affliction events:** Giant Bird (steals a trooper from each army), Chicken Pox, Hiccup
  Outbreak and Mole Invasion (22 events in all, still at most one per stage).
- **Steamy Jungle biome** (stages 46-50) with creeping vines. 11 biomes.
- **Rainbow** weather (faster firing underneath, for both armies).
- **Sleepy egg, Pigeon Flock and Mega Yolk power.** All arrive through the same 6-card /
  3-egg / 2-power kit, so the screen stays calm. The Powers screen fits all 9 powers.
- **Blender Beast boss:** 9 bosses in the rotation.
- **Balance:** the Toaster Titan was the hardest boss (about 60% active wins) and now fires 2
  slices per volley instead of 3.

## Phase 5 summary

The fifth loop:
- **4 oddity events:** Alien Jellyfish, Killer Robot, Cat Stampede and Bacon Monster (18 events
  in all, still at most one per stage).
- **Moon Base biome** with 60% gravity: aim stays accurate because gravity is set per biome and
  every aim formula reads it. 10 biomes.
- **Pollen Storm** weather (sneezes spoil aim).
- **Bubble egg, Pogo Tank and Time Freeze power.** All arrive through the same 6-card / 3-egg /
  2-power kit, so the screen stays calm.
- **Waffle Iron Warlord boss:** 8 bosses in the rotation.

## Phase 4 summary

The fourth loop added more surprises and content while keeping the screen calm and the frame
rate flat:
- **5 monster events:** Sasquatch, Panicky Tourists, Ghosts (night- and graveyard-leaning),
  Giant Snake and Rock Monster. That makes 14 events, still at most one per stage, weighted
  toward the biomes where they fit.
- **Weather:** Meteor Shower (night only) and Blizzard (snowfield).
- **2 biomes:** Spooky Graveyard (restless graves) and Sunny Beach (tide pools). There are now
  9 biomes, 45 stages per lap.
- **Magnet egg, Hover Coop vehicle and Golden Goose power.** Each arrives through the 6-card /
  3-egg / 2-power kit, so nothing new crowds the screen.
- **Toaster Titan boss**, tuned with winrate-sim (0/10 idle, 10/10 active).
- **Calm HUD:** the enemy roster is capped at 8 icons, and only one centre banner shows at a
  time.

## Phase 3 summary

The third loop made the game harder, calmer on screen, and sillier:
- **Challenge:**
  - Rounds are 50% longer.
  - The enemy calls in 1-3 reinforcement waves per round.
  - Enemy HP has a +15% toughness bonus, ramped in over stages 4-10.
  - `tools/winrate-sim.js`: idle wins fell from ~80% to ~35%, while active play still wins ~95%.
    Doing nothing now loses, and attentive play wins.
  - The no-wall check allows the Armory alone to be at most 10% weaker than the enemy.
- **Focus:** each stage offers one row of at most 6 unit cards (keys 1-6) and at most 3 Yolk Drop
  eggs, picked at random from your unlocks.
- **New events:** goats, bee swarm, frog plague and slime monsters (9 events in all), weighted
  towards the biomes where they belong.
- **New content:**
  - 2 biomes: Soggy Swamp and Candy Mountains.
  - Sandstorm weather.
  - Popcorn egg.
  - Rolling-Pin Roller vehicle.
  - Scarecrow decoy power.
  - Pancake Golem boss.
- **Fixes:** invisible Monster Trucks (NaN speed); both power slots previewing the same power.

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
- Vehicles: **Rolling-Pin Roller** (lv 8, $32). A giant rolling pin pushed by a chef: light enemy ground units can't stop it, so it shoves the front line back as it advances and bonks whoever is in front. Tanks, vehicles, castles and bosses still block it. It is heavy (tornado-proof), and Balanced and Turtle armies field it too.
- Powers: **Scarecrow** (lv 14, 30 s cooldown). A scarecrow pops up just ahead of your front line, and for 6 s every ranged enemy (not melee, rams, medics or bosses) aims at it instead of your troops.
- Bosses: **Pancake Golem** (first at stage 30, then in the random rotation). A walking stack of three pancakes with a butter pat, syrup drips and googly eyes. It lobs sticky syrup eggs and sprays a six-shot "SYRUP STORM!" fan when enraged. At each third of HP lost a pancake slides off the stack and rolls into battle as a melee minion ("Get them, flapjack!"). In winrate-sim it matches the Kraken: 4/10 idle, 10/10 active.
- Final review III:
  - The 60-stage stress test (forced events, all weather, random eggs, powers and purchases) had no errors.
  - Software-rendered frame time is ~16-17 ms, the same as before Phase 3; critter events add ≤1 ms.
  - Final winrate-sim (10 runs at each of 10 stages): idle 38%, active 97%, rounds average ~60 s (was ~40 s). No stage below 9/10 active.
- Events (`js/monsters.js`), five new surprise events (14 in all), each weighted toward the biomes where they fit:
  - **Sasquatch** (stage 6+, mostly snow): strolls across, picks up a trooper, sniffs it ("He smells like pine cones!") and sets it down somewhere else.
  - **Panicky Tourists** (stage 5+): a TOURS bus parks mid-field and tourists in loud shirts run around snapping photos. Every camera flash makes nearby troops stop and pose ("Cheese!").
  - **Ghosts** (stage 8+, far likelier at night and in graveyards): four sheets drift through the battle. Spooked infantry back away for a moment, and tanks just shiver.
  - **Giant Snake** (stage 10+): a long green snake slithers across with a flicking tongue, bumping light troops into the air (1 hit on landing). Heavies only wobble.
  - **Rock Monster** (stage 12+, mostly volcano): a boulder golem rises and stomps the nearest troops (1 hit each, at most once). Eggs from either army crumble it.
- Director: events can be likelier at dusk and night (`nightWeight`).
- Weather: **Meteor Shower** (stage 10+, night stages only, any biome). Every 4-7 s a glowing ring marks a spot, a fiery meteor streaks in over 1.4 s, and it hits ground units in the ring once (aircraft and bosses are spared).
- Weather: **Blizzard** (stage 11+, Snowfield): sideways snow, white-out creeping in from both edges, and every ground unit moves and fires 15% slower.
- Biomes: two more lands after Candy Mountains (9 biomes, 45 stages per lap).
  - **Spooky Graveyard**: purple-grey ground, leaning tombstones and crosses, crooked dead trees, and lots of fog. **Restless graves** erupt every 6-9 s, and skeleton hands hold anyone on them for 1.6 s (no damage). Ghosts are 4x likelier here.
  - **Sunny Beach**: golden sand with shells and starfish, a foamy wet-sand line and palm trees. **Tide pools** slow ground units to 55%. Tourists are 3x likelier here.
- Eggs: **Magnet** (lv 16). A horseshoe magnet plants itself in the ground where the egg lands, even after hitting a plane, and for 2.5 s drags light enemy ground troops within reach into one clump. That sets up a Boomer, Cluster or Zapper. Tanks, heavies and bosses resist it.
- Vehicles: **Hover Coop** (lv 12, $24). A chicken coop on an air cushion: fast and fragile (3 HP), pecking out quick short-range eggs. It floats straight over hazards, mud pits, tide pools, syrup and sticky goo without slowing down. Rushers love them.
- Powers: **Golden Goose** (lv 9, 35 s cooldown). A goose waddles out of your castle and lays a gold coin every second for 8 s ($5 + $1 per 5 stages each, with floating "+$" numbers): the first power that helps your economy instead of fighting. The Powers screen rows are a little shorter so all 7 powers fit.
- Bosses: **Toaster Titan** (first at stage 35, then in the rotation). A chrome toaster on stubby legs with a power-cord tail, an angry face and a lever that slams down. It pops smoking slices of burnt toast (bursting on impact) at the 3 nearest troops every 2 s, and when enraged fires a seven-slice "DING! TOAST'S UP!" volley. winrate-sim: 0/10 idle, 10/10 active.
- HUD: calm-screen pass.
  - The enemy roster shows at most 8 unit types (two rows of four), listing the types on the field first.
  - The reinforcement banner moved to the centre, below the boss bar, so it can't collide with achievement toasts on the right.
  - Only one centre banner shows at a time: the reinforcement banner waits, with its timer paused, while the opening, Rally or event banner is up.
- Final review IV:
  - The 60-stage stress test (forced events of all 14 kinds, all weather, random eggs, powers and purchases) had no errors.
  - Frame time is flat (~17 ms software-rendered). Every monster event is within 1.5 ms of a quiet frame.
  - Blizzard was 3.5 ms heavier, so it now draws its flakes in one path, uses 160 flakes instead of 240, and draws only the cached white-out edge strips instead of a full-screen wash; it is now ~1.5 ms heavier.
  - winrate-sim (10 runs at each of 7 stages): idle 37%, active 96%, Toaster Titan included.
- Events (`js/oddities.js`), four new surprise events (18 in all):
  - **Alien Jellyfish** (stage 9+, likelier at night): a purple portal opens in the sky, and six glowing jellyfish drift down and bob along the field. A touch zaps a unit once (1 hit) and leaves it buzzing.
  - **Killer Robot** (stage 11+): a clanky robot with a scanning red eye patrols the middle of the field, lasering the nearest unit of either army every 1.6 s (each unit at most once). Eggs from either army short it out.
  - **Cat Stampede** (stage 5+, likelier in the kitchen): fourteen cats chase a red laser dot across the field, bowling over infantry and bikes and swatting low eggs back into the air.
  - **Bacon Monster** (stage 8+, likelier in the kitchen and volcano): a wavy, googly-eyed bacon strip rises from a giant frying pan, flops onto troops (1 hit each, at most once) and leaves grease puddles where troops skid along 80% faster.
- Biomes: **Moon Base** (stages 46-50, then every 50 stages). Grey cratered ground, domes and radio masts in the background, the Earth hanging in the sky, no clouds and no weather apart from night meteor showers. Gravity is 60%, so every egg, bomb and bit of debris flies in high, floaty arcs. Gravity is now set per biome, and every aiming formula reads it, so aim stays accurate. 10 biomes, 50 stages per lap.
- Weather: **Pollen Storm** (stage 7+, meadow, swamp and candy lands). Yellow pollen drifts everywhere, and about one ground-unit shot in five goes wild with a sneeze ("ACHOO!"), for both armies alike.
- Eggs: **Bubble** (lv 19). Traps up to 4 light enemy ground troops near the impact in floating soap bubbles for 3.5 s (out of the fight). When the bubbles pop they drop to the ground and take a bump (1 hit). Tanks, heavies and bosses are too big for a bubble.
- Vehicles: **Pogo Tank** (lv 15, $30). A little tank on a giant spring. Every 4-6 s it boings up to 150 px toward the nearest enemy ground unit and lands with a stomp ring (1 hit to enemies underneath), firing small bursting eggs in between. It is heavy (tornado-proof), and Balanced enemy armies field it too.
- Powers: **Time Freeze** (lv 20, 34 s cooldown). For 4 s every enemy egg already in the air (and any fired meanwhile) hangs frozen with a blue ring and a "TIME FREEZE" countdown, then drops almost straight down where it hung. Your own eggs keep flying. The Powers screen rows are a little shorter so all 8 powers fit.
- Bosses: **Waffle Iron Warlord** (first at stage 40, then in the rotation). A hulking waffle iron with glowing eyes that flings waffles. Every 5 s it marks the nearest troops with a flickering waffle grid and slams a giant lid down 1.3 s later (1 hit plus a stagger); enraged, it marks two spots ("CRISPY TIME!"). winrate-sim: 1/10 idle, 8/10 active. 8 bosses in the rotation.
- Final review V:
  - The 60-stage stress test (forced events of all 18 kinds, all weather, random eggs, powers and purchases) had no errors.
  - Frame time is flat: every new event and the pollen storm are within ~2 ms of a quiet frame.
  - winrate-sim (10 runs at each of 7 stages): idle 29%, active 84%.
  - The Waffle Iron Warlord now slams every 6 s instead of 5 (8/12 active).
- Events (`js/afflictions.js`), four new surprise events (22 in all):
  - **Giant Bird** (stage 7+, needs 3+ units per side): a huge hook-beaked bird swoops down with its shadow sweeping the ground, snatches one light trooper from each army in its talons ("Put me DOWN!") and carries them off the map. No kill credit, no wreckage.
  - **Chicken Pox** (stage 6+): a patient zero in each army, and the spots spread on contact (up to 14 units). Itchy units are covered in red spots and move and fire at half speed for 6 s. No damage.
  - **Hiccup Outbreak** (stage 5+): about 45% of ground troops on both sides get the hiccups. Every 1-2 s each one jumps with a "hic!" and its next shot goes wild.
  - **Mole Invasion** (stage 4+, mostly meadows): eight molehills appear and moles pop up and down; troops passing the holes trip, and moles snack on splats.
- Weather: **Rainbow** (stage 6+, meadow, beach, candy and jungle). A seven-band rainbow fades in over the middle of the field, and units standing under it (the middle 40%) fire 25% faster, for both armies. It only speeds up firing, not movement.
- Biomes: **Steamy Jungle** (stages 46-50; the Moon Base moves to 51-55). Dark green soil with roots and fallen leaves, tall trees with big drooping leaves, lots of rain and storms, and **creeping vines** that whip up every 6-9 s and tangle anyone standing on them for 1.2 s. Bees are 3x likelier here. 11 biomes, 55 stages per lap.
- Eggs: **Sleepy** (lv 8). A lullaby splash puts every enemy within reach to sleep for 4 s, with a drifting purple "z z z". Sleepers don't move or fire, but any hit wakes them. Bosses don't nap.
- Vehicles: **Pigeon Flock** (lv 17, $20). Three scruffy pigeons with team-coloured neck rings flying as one air unit (6 HP). When an enemy ground unit is up ahead, they swoop straight down at it for 1 hit and climb back up. Air Force armies love them.
- Powers: **Mega Yolk** (lv 21, 30 s cooldown). Your Yolk Drop is ready at once, and the next drop is a giant egg ("MEGA YOLK DROP" on the HUD) with three times the burst (at least 24 shards, shared across multi-egg types), a big blast and a screen shake. The Powers screen rows are a little shorter so all 9 powers fit above BACK.
- Bosses: **Blender Beast** (first at stage 45, then in the rotation). A giant countertop blender on stubby legs with fruit chunks swirling in a pink smoothie, which lobs bursting smoothie blobs. Every 10 s (7 s enraged) it hits PULSE: a vortex sweeps across the field, the 3 nearest light troops (4 enraged) are sucked up into the jar ("It's got me!"), whizzed round and spat back toward their own side (1 hit when they land), and everyone else in reach gets tugged forward. Tanks and castles hold their ground. winrate-sim: 2/12 idle, 12/12 active. 9 bosses in the rotation.
- Final review VI:
  - The 60-stage stress test (forced events of all 22 kinds, all weather, random eggs, powers and purchases) had no errors. Update time averages 0.25 ms.
  - Frame time is flat: the new events, rainbow, jungle and Blender vortex all draw in 15-18 ms, about the same as a quiet frame (software rendering).
  - winrate-sim (10 runs at each of 7 stages, 6-50): active 90%. The Toaster Titan was the outlier (7/12 active at stage 35) and now fires 2 slices per volley instead of 3 (10/12 at stage 35, 12/12 at stage 50).
- Events (`js/detours.js`), four new surprise events (26 in all):
  - **Dinosaur Stampede** (stage 9+, mostly the Prehistoric Valley, jungle and desert): a herd of 5-7 triceratops thunders across the field with the screen thudding. Light troops get tossed (1 hit when they land); tanks are shoved aside and rattled.
  - **Lost Rideshare Driver** (stage 6+, needs 3+ units per side): a little car honks its way onto the field, picks up one trooper from each army ("Are you... Kevin?"), drives them back to their own castle and drops them off ("This isn't my stop!"). No damage.
  - **Pizza Delivery** (stage 5+, mostly the kitchen): a scooter drops five pizza boxes along the field. Troops passing a box stop for a slice and heal 1 (two slices per box).
  - **Giggle Fits** (stage 7+, mostly candy): a patient zero in each army, and the giggles spread on contact. Every couple of seconds a giggling unit shakes with laughter ("HA HA!") and stops moving and firing for about a second.
- Weather: **Gusty Gale** (stage 8+, meadow, snow, beach and the Prehistoric Valley). A strong wind that swings round every 6 s with a howl; leaves and the wind sock show which way it's blowing, and every egg in flight is pushed the same way for both armies.
- Biomes: **Prehistoric Valley** (stages 56-60, after the Moon Base). Reddish-brown soil with buried fossils, fern clumps and smoking volcanoes in the distance, and **tar pits** that slow ground units to 35%. Dinosaur stampedes are 3x likelier here. 12 biomes, 60 stages per lap.
- Eggs: **Hot Sauce** (lv 12). A fiery red splash: every enemy ground unit nearby panics ("HOT HOT HOT!"), runs back the way it came with flames dancing over its head and doesn't fire for 2.5 s. Bosses shrug it off.

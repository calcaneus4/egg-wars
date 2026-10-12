# Changelog

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

# Changelog

- Planning: added ROADMAP.md (prioritized feature checklist) and DESIGN.md (progression, difficulty and reward formulas).
- Code: split `game.js` into `js/` scripts (config, util, audio, terrain, draw, units, projectiles, game, main) and added a headless smoke test (`tools/smoke-test.js`).
- Progression: versioned localStorage save (stage, gold, unlocks, wins/losses) with migrations, corrupt-data fallback and autosave; `Shift+N` starts a new game.
- Progression: player level and XP (wins, losses and kills all count), Golden Eggs currency earned from wins, level-ups and loss streaks, XP bar in the HUD, level-up banner and XP/GE lines on the results screen.
- Balance: logarithmic difficulty curve D(n) drives enemy HP, fire rate, army point budget and round time; enemy armies are bought from a budget; survivor gold bonus rescaled (~76 gold per stage-1 wipeout instead of ~400); losses pay 10 + stage gold; added `tools/balance-sim.js`.
- Balance: "Rally" comeback assist after 2+ losses in a row (bonus gold, free tank, smaller enemy army, shields at 3+ losses); ends on the next win and never reduces win rewards.
- UI: title screen (Play/Continue with profile summary), pause menu (Esc/P), settings screen (volume, mute, color scheme, speech bubbles, screen shake, New Game) saved in the profile; `M` mutes.

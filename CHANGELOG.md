# Changelog

- Planning: added ROADMAP.md (prioritized feature checklist) and DESIGN.md (progression, difficulty and reward formulas).
- Code: split `game.js` into `js/` scripts (config, util, audio, terrain, draw, units, projectiles, game, main) and added a headless smoke test (`tools/smoke-test.js`).
- Progression: versioned localStorage save (stage, gold, unlocks, wins/losses) with migrations, corrupt-data fallback and autosave; `Shift+N` starts a new game.
- Progression: player level and XP (wins, losses and kills all count), Golden Eggs currency earned from wins, level-ups and loss streaks, XP bar in the HUD, level-up banner and XP/GE lines on the results screen.
- Balance: logarithmic difficulty curve D(n) drives enemy HP, fire rate, army point budget and round time; enemy armies are bought from a budget; survivor gold bonus rescaled (~76 gold per stage-1 wipeout instead of ~400); losses pay 10 + stage gold; added `tools/balance-sim.js`.

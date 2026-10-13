// Balance simulation for DESIGN.md: compares enemy power E(n) with player Armory power P.
// Loads the real config/progression scripts so the numbers always match the game.
// Usage: node tools/balance-sim.js
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const fakeCanvas = { width: 1200, height: 680, getContext: () => ({}) };
const context = vm.createContext({ document: { getElementById: () => fakeCanvas }, Math, console });
for (const file of ["config.js", "util.js", "progression.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8"), context, { filename: file });
}
const { Progression, settings } = vm.runInContext("({ Progression, settings })", context);

const MIN_ARMORY_RATIO = 0.9;

// A player who wins every stage and spends half of their Golden Eggs on the three combat tracks.
const AVG_KILLS = 8;
let xp = 0;
let level = 1;
let goldenEggs = 0;
const reached = {};
for (let n = 1; n <= 200; n++) {
  xp += Progression.roundXp(n, true) + AVG_KILLS;
  while (xp >= Progression.xpToNext(level)) {
    xp -= Progression.xpToNext(level);
    level++;
    goldenEggs += Progression.goldenEggsPerLevel;
  }
  goldenEggs += Progression.winGoldenEggs(n);
  reached[n + 1] = { level, goldenEggs };
}

function combatPower(geBudget) {
  const k = [0, 0, 0];
  for (let i = 0; ; i++) {
    const track = i % 3;
    const cost = 1 + k[track];
    if (k.every((v) => v >= 20)) break;
    if (k[track] >= 20) continue;
    if (geBudget < cost) break;
    geBudget -= cost;
    k[track]++;
  }
  return { k, P: (1 + 0.08 * k[0]) * (1 + 0.05 * k[1]) * (1 + 0.04 * k[2]) };
}

console.log("stage  D(n)  h(n)  f(n)  b(n)  E(n)  budget  T(n)  level  GE   levels    P     P/E");
let ok = true;
for (const n of [1, 2, 3, 5, 10, 20, 30, 50, 100, 200]) {
  const D = Progression.difficulty(n);
  const h = Progression.enemyHpScale(n);
  const f = Progression.enemyFireScale(n);
  const b = Progression.enemyBudget(n) / settings.enemyBaseBudget;
  const E = h * f * b;
  const T = settings.roundBaseSeconds + settings.roundSecondsPerDifficulty * (D - 1);
  const r = reached[n] || { level: 1, goldenEggs: 0 };
  const { k, P } = combatPower(r.goldenEggs / 2);
  // Phase 3: the Armory alone keeps within 10% of the enemy; Yolk Drops, powers and buying
  // units close the gap (DESIGN.md section 13).
  if (n >= 3 && P < E * MIN_ARMORY_RATIO) ok = false;
  console.log([n, D, h, f, b, E].map((v, i) => (i ? v.toFixed(2) : String(v)).padStart(i ? 5 : 5)).join(" ") +
    "  " + Progression.enemyBudget(n).toFixed(0).padStart(5) + "  " + T.toFixed(0).padStart(4) +
    "  " + String(r.level).padStart(5) + " " + String(r.goldenEggs).padStart(4) + "  " + k.join("/").padEnd(8) +
    " " + P.toFixed(2) + "  " + (P / E).toFixed(2));
}
console.log(ok ? `OK: P >= ${MIN_ARMORY_RATIO} E(n) from stage 3 on` : `WARNING: P < ${MIN_ARMORY_RATIO} E(n) somewhere from stage 3 on`);
process.exit(ok ? 0 : 1);

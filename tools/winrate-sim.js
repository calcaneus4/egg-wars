// Win-rate simulation: plays real battles headlessly (Playwright + Chromium) with a player whose
// level and Armory match the progression modelled in tools/balance-sim.js, and reports how often
// the player wins at each stage.
//   idle   - the player does nothing at all (no buys, no Yolk Drops, no powers)
//   active - the player drops a yolk on the enemy whenever it's ready and fires both powers
// Usage: NODE_PATH=$(npm root -g) node tools/winrate-sim.js [runs=8] [stage,stage,...]
"use strict";

const path = require("path");
const { chromium } = require("playwright");

// Level and Armory (hp/rate/dmg) a winning player has on reaching each stage (balance-sim.js).
const PROFILE = {
  3: [2, 1, 1, 1], 6: [3, 2, 2, 1], 10: [5, 3, 3, 2], 14: [6, 4, 3, 3], 18: [8, 4, 4, 4],
  22: [9, 5, 4, 4], 25: [10, 5, 5, 4], 30: [11, 6, 6, 5], 37: [13, 7, 7, 6], 45: [15, 8, 8, 7], 50: [16, 9, 8, 8],
};

const runs = Number(process.argv[2]) || 8;
const stages = process.argv[3] ? process.argv[3].split(",").map(Number) : Object.keys(PROFILE).map(Number);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  console.log("stage  boss      idle  active  avg time (idle)");
  for (const st of stages) {
    const near = Object.keys(PROFILE).map(Number).reduce((a, b) => (Math.abs(b - st) < Math.abs(a - st) ? b : a));
    const r = await page.evaluate(([st, prof, runs]) => {
      SaveManager.save = () => {};
      const play = (active) => {
        const p = game.profile;
        SaveManager.data.flags.tutorialDone = true;
        Tutorial.step = -1;
        p.level = prof[0];
        p.armory = { hp: prof[1], rate: prof[2], dmg: prof[3], chest: 0, yolk: 0, bulk: 0 };
        p.lossStreak = 0;
        p.powers = [];
        game.gold = 0;
        game.stage = st;
        game.scene = "battle";
        game.startStage();
        game.gold = 0;
        let t = 0;
        while (!game.winner && t < 300) {
          game.update(1 / 30);
          t += 1 / 30;
          if (active && game.powerUpCooldown <= 0) {
            const red = game.living(LEFT).filter((u) => !(u instanceof Airplane));
            if (red.length) game.dropPowerUp(red.reduce((a, u) => a + u.x, 0) / red.length);
          }
          if (active) [0, 1].forEach((i) => Abilities.useSlot(game, i));
        }
        return { won: game.winner && game.winner.startsWith("BLUE"), t };
      };
      const out = { idle: 0, active: 0, time: 0, boss: game.bossStage ? Bosses.kindForStage(st) : "" };
      for (let i = 0; i < runs; i++) {
        const a = play(false);
        out.idle += a.won ? 1 : 0;
        out.time += a.t / runs;
        out.active += play(true).won ? 1 : 0;
      }
      out.boss = Bosses.isBossStage(st) ? Bosses.kindForStage(st) : "";
      return out;
    }, [st, PROFILE[near], runs]);
    console.log(`${String(st).padStart(5)}  ${r.boss.padEnd(8)}  ${String(r.idle).padStart(2)}/${runs}  ${String(r.active).padStart(3)}/${runs}  ${r.time.toFixed(0).padStart(5)}s`);
  }
  if (errors.length) console.log("page errors:", errors.slice(0, 3));
  await browser.close();
})();

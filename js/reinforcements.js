"use strict";

// Enemy reinforcements (DESIGN.md section 13): during the round the red army calls in a few small
// waves, bought from an extra budget so a long round keeps pressure on. Waves start at stage 3,
// grow in number with the stage, are halved on boss stages and shrink with Rally like the main
// army. A banner announces each wave as it marches in from the right.

const WAVE_SHARE = 0.2;
const WAVE_BANNER_SECONDS = 2.6;

const Reinforcements = {
  waveCount(stage) {
    if (stage < 3) return 0;
    if (stage < 8) return 1;
    if (stage < 15) return 2;
    return 3;
  },

  plan(game) {
    const count = this.waveCount(game.stage);
    game.waves = [];
    game.waveBanner = 0;
    for (let i = 0; i < count; i++) {
      const k = (i + 1) / (count + 1);
      game.waves.push({ at: game.roundLimit * (0.15 + 0.5 * k) + rand(-3, 3), done: false });
    }
  },

  update(game, dt) {
    game.waveBanner = Math.max(0, (game.waveBanner || 0) - dt);
    for (const w of game.waves || []) {
      if (w.done || game.roundTime < w.at) continue;
      w.done = true;
      this.spawnWave(game);
    }
  },

  spawnWave(game) {
    const p = game.personality;
    // Early waves are smaller while the player is still learning.
    const share = WAVE_SHARE * clamp((game.stage - 1) / 6, 0.5, 1);
    let budget = Progression.enemyBudget(game.stage) * share * Progression.rallyBudgetScale(game.rally || 0) * p.budgetScale;
    if (game.bossStage) budget *= 0.5;
    const weights = Personalities.weightsFor(p, game.stage);
    // Caps count what is still alive, so waves top the army up rather than flooding it.
    const caps = game.enemyCaps();
    for (const u of game.living(LEFT)) {
      const type = unitType(u);
      if (caps[type] !== undefined) caps[type] = Math.max(0, caps[type] - 1);
    }
    caps.castle = 0;
    caps.soldier = Math.max(caps.soldier, 3);
    const counts = Progression.buildArmy(budget, weights, caps);
    const before = game.units.length;
    for (const [type, count] of Object.entries(counts)) game.addMany(LEFT, type, count);
    const fresh = game.units.slice(before);
    if (!fresh.length) return;
    const hpScale = Progression.enemyHpScale(game.stage);
    const fireScale = Progression.enemyFireScale(game.stage);
    for (const u of fresh) {
      u.hp = Math.max(1, Math.ceil(u.hp * hpScale));
      u.fireRate *= fireScale;
      // Ground troops march in from just behind the right edge.
      if (!(u instanceof Airplane)) u.x = W - s(50) - rand(0, s(70));
      Effects.smoke(u.x, u.y, 2);
    }
    Personalities.apply(p, fresh);
    game.waveBanner = WAVE_BANNER_SECONDS;
    game.waveSize = fresh.length;
    audio.play("horn");
  },

  drawBanner(game) {
    if (!(game.waveBanner > 0) || game.winner || game.scene !== "battle") return;
    const text = `RED REINFORCEMENTS! +${game.waveSize}`;
    ctx.save();
    ctx.globalAlpha = Math.min(1, game.waveBanner / 0.4);
    ctx.font = "bold 20px Courier New";
    const w = ctx.measureText(text).width + 28;
    const x = W - w - 14;
    const y = 124;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, 32);
    ctx.strokeRect(x, y, w, 32);
    ctx.fillStyle = RED;
    ctx.fillText(text, x + 14, y + 23);
    ctx.restore();
  },
};

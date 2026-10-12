"use strict";

// Animated end-of-round results screen: rewards count up one after another, the XP bar fills,
// a level-up stamp pops with confetti, and new unlocks flip in as cards.

const RESULTS_ROW_START = 0.6;
const RESULTS_ROW_GAP = 0.45;
const RESULTS_COUNT_TIME = 0.55;

const Results = {
  confetti: [],
  buttons: [],

  start(game) {
    game.endTimer = 0;
    this.confetti = [];
    this.buttons = [];
    this.levelPopped = false;
  },

  rows(game) {
    const r = game.roundRewards || { xp: 0, kills: 0, goldenEggs: 0 };
    const rows = [{ label: "GOLD", value: game.lastGoldReward, prefix: "$", note: game.lastGoldBonus ? `incl. wipeout +${game.lastGoldBonus}` : "" }];
    rows.push({ label: "XP", value: r.xp, prefix: "+", note: `${r.kills} kills` });
    const goals = game.objectives || [];
    const done = goals.filter((o) => o.complete).length;
    if (r.goldenEggs) rows.push({ label: "GOLDEN EGGS", value: r.goldenEggs, prefix: "+", note: goals.length ? `goals ${done}/${goals.length}` : "", egg: true });
    return rows;
  },

  // Time at which the reward rows, XP bar and level-up have all finished animating.
  levelTime(game) {
    return RESULTS_ROW_START + this.rows(game).length * RESULTS_ROW_GAP + RESULTS_COUNT_TIME + 0.4;
  },

  doneTime(game) {
    return this.levelTime(game) + (game.newUnlocks.length ? 0.9 : 0.2);
  },

  skip(game) {
    game.endTimer = Math.max(game.endTimer, this.doneTime(game) + 0.5);
  },

  update(game, dt) {
    const before = game.endTimer;
    game.endTimer += dt;
    const r = game.roundRewards;
    const lt = this.levelTime(game);
    if (r && r.levelsGained && before < lt && game.endTimer >= lt) this.burst();
    this.rows(game).forEach((row, i) => {
      const start = RESULTS_ROW_START + i * RESULTS_ROW_GAP;
      if (before < start + RESULTS_COUNT_TIME && game.endTimer >= start && row.value > 0) audio.play("tick");
    });
    if (game.newUnlocks.length && before < lt + 0.3 && game.endTimer >= lt + 0.3) audio.play("unlock");
    for (const c of this.confetti) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 260 * dt;
      c.vx *= 1 - dt * 0.8;
      c.a += c.spin * dt;
    }
    this.confetti = this.confetti.filter((c) => c.y < H + 20);
  },

  burst() {
    audio.play("levelup");
    const colors = [YOLK, BLUE, RED, WHITE];
    for (let i = 0; i < 90; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const v = rand(180, 460);
      this.confetti.push({ x: W / 2 + rand(-60, 60), y: 210, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: rand(0, 6), spin: rand(-10, 10), color: choice(colors), size: rand(4, 8) });
    }
  },

  // Click handling. Returns "armory", "continue" or null (click swallowed by fast-forward).
  click(game, x, y) {
    if (game.endTimer < this.doneTime(game)) {
      this.skip(game);
      return null;
    }
    const hit = this.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (hit) return hit.action;
    return "continue";
  },

  draw(game) {
    const t = game.endTimer;
    const won = game.resultMode === "won";
    ctx.save();
    ctx.fillStyle = rgbaFromHex(PAPER, Math.min(0.92, t * 3));
    ctx.fillRect(0, 0, W, H);

    // Title stamp.
    const pop = t < 0.35 ? 1.6 - (t / 0.35) * 0.6 : 1;
    ctx.save();
    ctx.translate(W / 2, 92);
    ctx.scale(pop, pop);
    ctx.rotate(won ? -0.02 : 0.02);
    ctx.fillStyle = won ? BLUE : RED;
    ctx.font = "bold 50px Courier New";
    const title = (game.practice ? "PRACTICE " : "") + (won ? "VICTORY!" : "DEFEAT");
    ctx.fillText(title, -ctx.measureText(title).width / 2, 0);
    ctx.restore();
    ctx.fillStyle = LINE;
    ctx.font = "bold 20px Courier New";
    const shownStage = won ? game.stage - 1 : game.stage;
    centerText(`${game.winner}  -  STAGE ${shownStage}${game.endGameTitle ? `  -  ${game.endGameTitle}` : ""}`, 128);

    // Reward rows count up one after another.
    const rows = this.rows(game);
    const boxW = 460;
    const bx = (W - boxW) / 2;
    let y = 160;
    rows.forEach((row, i) => {
      const start = RESULTS_ROW_START + i * RESULTS_ROW_GAP;
      if (t < start) return;
      const k = clamp((t - start) / RESULTS_COUNT_TIME, 0, 1);
      const shown = Math.round(row.value * (1 - Math.pow(1 - k, 3)));
      ctx.globalAlpha = Math.min(1, (t - start) * 5);
      ctx.fillStyle = LINE;
      ctx.font = "bold 22px Courier New";
      ctx.fillText(row.label, bx, y + 26);
      if (row.egg) game.drawGoldenEggIcon(bx + ctx.measureText(row.label).width + 18, y + 18, 8);
      ctx.fillStyle = LINE;
      ctx.font = "bold 26px Courier New";
      const value = `${row.prefix}${shown}`;
      ctx.fillText(value, bx + boxW - ctx.measureText(value).width, y + 26);
      if (row.note) {
        ctx.font = "bold 14px Courier New";
        ctx.fillText(row.note, bx + 190, y + 24);
      }
      line(bx, y + 36, bx + boxW, y + 36, rgbaFromHex(LINE, 0.25), 1);
      y += 44;
    });
    ctx.globalAlpha = 1;

    // XP bar fills after the rows.
    const lt = this.levelTime(game);
    const barT = clamp((t - (lt - 0.4)) / 0.4, 0, 1);
    const p = game.profile;
    const need = Progression.xpToNext(p.level);
    const frac = (p.xp / need) * barT;
    const barY = 160 + 3 * 44 + 6;
    ctx.fillStyle = LINE;
    ctx.font = "bold 16px Courier New";
    ctx.fillText(`LV ${p.level}`, bx, barY + 13);
    ctx.fillStyle = rgbaFromHex(YOLK, 0.85);
    ctx.fillRect(bx + 70, barY + 2, (boxW - 160) * frac, 13);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 70, barY + 2, boxW - 160, 13);
    ctx.fillStyle = LINE;
    const xpText = `${Math.round(p.xp * barT)}/${need}`;
    ctx.fillText(xpText, bx + boxW - ctx.measureText(xpText).width, barY + 13);

    // Level-up stamp.
    const r = game.roundRewards;
    if (r && r.levelsGained && t >= lt) {
      const lk = clamp((t - lt) / 0.25, 0, 1);
      ctx.save();
      ctx.translate(W / 2 + 410, 200);
      ctx.rotate(0.18);
      ctx.scale(2 - lk, 2 - lk);
      ctx.globalAlpha = lk;
      ctx.strokeStyle = YOLK;
      ctx.fillStyle = rgbaFromHex(YOLK, 0.2);
      ctx.lineWidth = 4;
      ctx.fillRect(-92, -34, 184, 68);
      ctx.strokeRect(-92, -34, 184, 68);
      ctx.fillStyle = LINE;
      ctx.font = "bold 26px Courier New";
      const lu = "LEVEL UP!";
      ctx.fillText(lu, -ctx.measureText(lu).width / 2, -4);
      ctx.font = "bold 18px Courier New";
      const lv = `LV ${p.level}  +${r.levelsGained * Progression.goldenEggsPerLevel} GE`;
      ctx.fillText(lv, -ctx.measureText(lv).width / 2, 22);
      ctx.restore();
    }

    // Unlock cards flip in.
    let cardsBottom = barY + 30;
    if (game.newUnlocks.length && t >= lt + 0.3) {
      const cards = game.newUnlocks.slice(0, 4);
      const cw = 200;
      const gap = 16;
      const total = cards.length * cw + (cards.length - 1) * gap;
      cards.forEach((u, i) => {
        const ck = clamp((t - lt - 0.3 - i * 0.15) / 0.3, 0, 1);
        if (ck <= 0) return;
        const cx = (W - total) / 2 + i * (cw + gap);
        const cy = barY + 36;
        ctx.save();
        ctx.translate(cx + cw / 2, cy);
        ctx.scale(ck, 1);
        ctx.fillStyle = PAPER;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 3;
        ctx.fillRect(-cw / 2, 0, cw, 96);
        ctx.strokeRect(-cw / 2, 0, cw, 96);
        ctx.fillStyle = YOLK;
        ctx.fillRect(-cw / 2, 0, cw, 20);
        ctx.strokeRect(-cw / 2, 0, cw, 20);
        ctx.fillStyle = LINE;
        ctx.font = "bold 13px Courier New";
        ctx.fillText("UNLOCKED", -cw / 2 + 8, 15);
        if (u.kind === "unit") drawUnitIcon(u.type, -cw / 2 + 30, 52, 38, BLUE);
        else if (u.kind === "special") drawUnitIcon("tank", -cw / 2 + 30, 52, 38, YOLK);
        else drawEggIcon(-cw / 2 + 30, 52, 14);
        ctx.fillStyle = LINE;
        ctx.font = "bold 16px Courier New";
        ctx.fillText(u.name, -cw / 2 + 58, 46);
        ctx.font = "bold 11px Courier New";
        game.wrapText(u.desc, cw - 66).slice(0, 3).forEach((ln, li) => ctx.fillText(ln, -cw / 2 + 58, 62 + li * 13));
        ctx.restore();
      });
      cardsBottom = barY + 36 + 104;
    }

    // Footer: next unlock, totals, tip and buttons (after the animation).
    this.buttons = [];
    if (t >= this.doneTime(game)) {
      let fy = Math.max(cardsBottom + 10, 420);
      ctx.fillStyle = LINE;
      ctx.font = "bold 16px Courier New";
      const teaser = Unlocks.nextText(p);
      if (teaser) centerText(teaser, fy);
      centerText(`TOTAL WINS  BLUE ${game.score.blue}   RED ${game.score.red}`, fy + 24);
      const tip = game.selectedGameplayHint ? `TIP: ${game.selectedGameplayHint}` : "";
      if (tip) {
        ctx.font = "bold 14px Courier New";
        centerText(tip, fy + 48);
      }
      const by = Math.min(H - 70, fy + 66);
      const main = { x: W / 2 - (Armory.isOpen(p) ? 290 : 140), y: by, w: 280, h: 48, label: won ? "NEXT STAGE" : "TRY AGAIN", action: "continue", hot: true };
      this.buttons.push(main);
      if (Armory.isOpen(p)) this.buttons.push({ x: W / 2 + 10, y: by, w: 280, h: 48, label: `ARMORY (${p.goldenEggs} GE)`, action: "armory", hot: false });
      this.buttons.forEach((b) => Menus.drawButton(b, b.hot));
    } else {
      ctx.fillStyle = rgbaFromHex(LINE, 0.5);
      ctx.font = "bold 14px Courier New";
      centerText("click to skip", H - 28);
    }

    // Confetti on top.
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.a);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }
    ctx.restore();
  },
};

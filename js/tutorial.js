"use strict";

// Guided first battle and one-time contextual tips (DESIGN.md section 10).
// Progress lives in SaveManager.data.flags: tutorialDone, tutorialGold, tips: { id: true }.

const TUTORIAL_STEPS = [
  {
    id: "buy",
    text: "Tap a unit button (top left) to send reinforcements.",
    waitFor: "bought",
    target: (game) => {
      const b = game.buttons.find((r) => r.type === "soldier");
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : { x: 150, y: 46 };
    },
  },
  {
    id: "yolk",
    text: "Tap the battlefield to drop a Yolk Bomb on the red army.",
    waitFor: "yolk",
    target: () => ({ x: W * 0.72, y: H * 0.62 }),
  },
  {
    id: "win",
    text: "Destroy the red army! If time runs out, the stronger army wins.",
    waitFor: null,
    target: null,
  },
];

const TUTORIAL_STEP_SECONDS = 8;
const TUTORIAL_FIRST_GOLD = 25;
const TIP_SECONDS = 5;

const Tutorial = {
  step: -1,
  stepTimer: 0,
  skipRect: null,
  tipQueue: [],
  tip: null,
  tipTimer: 0,

  flags() {
    const flags = SaveManager.data.flags;
    if (!flags.tips || typeof flags.tips !== "object") flags.tips = {};
    return flags;
  },

  active() {
    return this.step >= 0;
  },

  onStageStart(game) {
    const flags = this.flags();
    this.tip = null;
    this.tipTimer = 0;
    if (!flags.tutorialDone) {
      this.step = 0;
      this.stepTimer = 0;
      if (!flags.tutorialGold) {
        // Enough gold for a few soldiers so the first step can be done right away.
        flags.tutorialGold = true;
        game.gold += TUTORIAL_FIRST_GOLD;
        game.saveProfile();
      }
      return;
    }
    this.step = -1;
    this.queueStageTips(game);
  },

  queueStageTips(game) {
    const p = game.profile;
    for (const entry of UNLOCKS) {
      if (entry.level > 1 && Unlocks.isUnlocked(p, entry)) this.queueTip(`unlock:${entry.name}`, `NEW: ${entry.name} - ${entry.desc}.`);
    }
    if (game.rally) this.queueTip("rally", "Rally! Losing streaks give your army a boost until your next win.");
    if (Armory.isOpen(p) && p.goldenEggs > 0) this.queueTip("armory", "Spend Golden Eggs in the Armory (title or results screen) for permanent upgrades.");
  },

  queueTip(id, text) {
    const flags = this.flags();
    if (flags.tips[id] || this.tipQueue.some((t) => t.id === id) || (this.tip && this.tip.id === id)) return;
    this.tipQueue.push({ id, text });
  },

  notify(event) {
    if (!this.active()) return;
    const step = TUTORIAL_STEPS[this.step];
    if (step && step.waitFor === event) this.advance();
  },

  advance() {
    this.step++;
    this.stepTimer = 0;
    if (this.step >= TUTORIAL_STEPS.length) this.finish();
  },

  finish() {
    this.step = -1;
    this.flags().tutorialDone = true;
    SaveManager.save();
  },

  replay() {
    const flags = this.flags();
    flags.tutorialDone = false;
    flags.tips = {};
    SaveManager.save();
  },

  update(game, dt) {
    if (game.scene !== "battle") return;
    if (this.active()) {
      this.stepTimer += dt;
      if (this.stepTimer >= TUTORIAL_STEP_SECONDS) this.advance();
      return;
    }
    if (!game.winner && game.roundLimit - game.roundTime < 10) this.queueTip("lowtime", "Time's almost up! When the timer ends, the stronger army wins.");
    if (this.tip) {
      this.tipTimer -= dt;
      if (this.tipTimer <= 0) this.tip = null;
    }
    if (!this.tip && this.tipQueue.length && !game.winner) {
      this.tip = this.tipQueue.shift();
      this.tipTimer = TIP_SECONDS;
      this.flags().tips[this.tip.id] = true;
      SaveManager.save();
    }
  },

  hit(x, y) {
    const r = this.skipRect;
    if (!this.active() || !r || x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) return false;
    this.finish();
    return true;
  },

  draw(game) {
    this.skipRect = null;
    if (game.scene !== "battle" || game.winner) return;
    if (this.active()) this.drawStep(game);
    else if (this.tip) this.drawTip();
  },

  drawStep(game) {
    const step = TUTORIAL_STEPS[this.step];
    const boxW = 760;
    const boxH = 78;
    const x = (W - boxW) / 2;
    const y = 232;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeRect(x, y, boxW, boxH);
    ctx.fillStyle = LINE;
    ctx.font = "bold 15px Courier New";
    ctx.fillText(`TUTORIAL ${this.step + 1}/${TUTORIAL_STEPS.length}`, x + 14, y + 22);
    ctx.font = "bold 20px Courier New";
    ctx.fillText(step.text, x + 14, y + 54);
    // Progress bar for the auto-advance timer.
    ctx.fillStyle = rgbaFromHex(YOLK, 0.8);
    ctx.fillRect(x, y + boxH - 5, boxW * Math.min(1, this.stepTimer / TUTORIAL_STEP_SECONDS), 5);
    // Skip button.
    this.skipRect = { x: x + boxW - 92, y: y + 6, w: 84, h: 24 };
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.skipRect.x, this.skipRect.y, this.skipRect.w, this.skipRect.h);
    ctx.fillStyle = LINE;
    ctx.font = "bold 14px Courier New";
    ctx.fillText("SKIP", this.skipRect.x + 26, this.skipRect.y + 17);
    // Pulsing pointer at the thing to tap.
    if (step.target) {
      const t = step.target(game);
      ctx.strokeStyle = YOLK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 26 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(clamp(t.x, x + 20, x + boxW - 20), t.y < y ? y : y + boxH);
      ctx.lineTo(t.x, t.y + (t.y < y ? 30 : -30));
      ctx.stroke();
    }
    ctx.restore();
  },

  drawTip() {
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.tipTimer / 0.5, (TIP_SECONDS - this.tipTimer) / 0.3 + 0.2);
    ctx.font = "bold 18px Courier New";
    const text = `TIP: ${this.tip.text}`;
    const w = Math.min(W - 40, ctx.measureText(text).width + 28);
    const x = (W - w) / 2;
    const y = H - 84;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, 34);
    ctx.strokeRect(x, y, w, 34);
    ctx.fillStyle = LINE;
    ctx.fillText(text, x + 14, y + 23);
    ctx.restore();
  },
};

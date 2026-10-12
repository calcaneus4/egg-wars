"use strict";

// Achievements: checked after every round and on purchases. Each pays 1 Golden Egg; a few also
// unlock a bonus colour scheme. Unlocked ids live in SaveManager.data.flags.achievements.

const ACHIEVEMENTS = [
  { id: "firstWin", name: "First Crack", desc: "Win your first battle.", test: (s) => s.wins >= 1 },
  { id: "wins10", name: "Getting Cracking", desc: "Win 10 battles.", test: (s) => s.wins >= 10 },
  { id: "wins50", name: "Egg-sperienced", desc: "Win 50 battles.", test: (s) => s.wins >= 50, scheme: "breakfast" },
  { id: "level5", name: "Fresh Recruit", desc: "Reach level 5.", test: (s, p) => p.level >= 5 },
  { id: "level10", name: "Sergeant Sunny", desc: "Reach level 10.", test: (s, p) => p.level >= 10 },
  { id: "level20", name: "General Yolk", desc: "Reach level 20.", test: (s, p) => p.level >= 20 },
  { id: "stage10", name: "Into the Dunes", desc: "Reach stage 10.", test: (s, p) => p.stage >= 10 },
  { id: "stage25", name: "Kitchen Raider", desc: "Reach stage 25.", test: (s, p) => p.stage >= 25 },
  { id: "boss1", name: "Boss Beater", desc: "Defeat a boss.", test: (s) => s.bossesBeaten >= 1 },
  { id: "boss5", name: "Boss Hunter", desc: "Defeat 5 bosses.", test: (s) => s.bossesBeaten >= 5, scheme: "golden" },
  { id: "kills500", name: "Splat Master", desc: "Destroy 500 enemy units.", test: (s) => s.kills >= 500 },
  { id: "yolk25", name: "Yolk Rain", desc: "Destroy 25 enemies with Yolk Drops.", test: (s) => s.yolkKills >= 25 },
  { id: "buy50", name: "Shopaholic", desc: "Buy 50 reinforcements.", test: (s) => s.unitsBought >= 50 },
  { id: "armory10", name: "Fully Armed", desc: "Buy 10 Armory upgrades.", test: (s, p) => Object.values(p.armory).reduce((a, b) => a + b, 0) >= 10 },
  { id: "goals10", name: "Goal Getter", desc: "Complete 10 bonus goals.", test: (s) => s.goalsCompleted >= 10 },
  { id: "tourist", name: "Tourist", desc: "Fight in all five biomes.", test: (s, p, f) => (f.biomes || []).length >= 5 },
  { id: "comeback", name: "Never Give Up", desc: "Win right after losing twice in a row.", test: (s) => s.comebacks >= 1 },
  { id: "blitz", name: "Lightning War", desc: "Win a battle in under 20 seconds.", test: (s) => s.bestWinTime > 0 && s.bestWinTime <= 20 },
  { id: "flawless", name: "Not a Scratch", desc: "Win without losing a single unit.", test: (s) => s.flawlessWins >= 1 },
  { id: "nightOwl", name: "Night Owl", desc: "Win 5 night battles.", test: (s) => s.nightWins >= 5, scheme: "midnight" },
];

// Bonus colour schemes unlocked by achievements (the five originals are always available).
const BONUS_SCHEMES = {
  breakfast: { line: "#3a2414", paper: "#fff4dc", pale: "#f6dcae", blueTeam: "#2f6fd0", redTeam: "#d2452b", yolk: "#f7b21a", eggWhite: "#fffdf4" },
  golden: { line: "#3b2a05", paper: "#fff3c4", pale: "#f2d98a", blueTeam: "#1f5fbf", redTeam: "#b8322a", yolk: "#e0a100", eggWhite: "#fffbe6" },
  midnight: { line: "#dfe6ff", paper: "#10142e", pale: "#252b52", blueTeam: "#6fb0ff", redTeam: "#ff6f7a", yolk: "#ffd25a", eggWhite: "#f4f6ff" },
};

const ACHIEVEMENT_TOAST_SECONDS = 3.5;

const Achievements = {
  toasts: [],

  unlocked() {
    const flags = SaveManager.data.flags;
    if (!flags.achievements || typeof flags.achievements !== "object") flags.achievements = {};
    return flags.achievements;
  },

  isUnlocked(id) {
    return !!this.unlocked()[id];
  },

  count() {
    return ACHIEVEMENTS.filter((a) => this.isUnlocked(a.id)).length;
  },

  // Bonus schemes are registered with the settings once their achievement is unlocked.
  registerSchemes() {
    for (const a of ACHIEVEMENTS) {
      if (a.scheme && this.isUnlocked(a.id)) settings.colorSchemes[a.scheme] = BONUS_SCHEMES[a.scheme];
    }
  },

  check(game) {
    const data = SaveManager.data;
    const got = this.unlocked();
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (got[a.id] || !a.test(data.stats, data.profile, data.flags)) continue;
      got[a.id] = true;
      data.profile.goldenEggs += 1;
      this.toasts.push({ a, timer: ACHIEVEMENT_TOAST_SECONDS });
      changed = true;
    }
    if (changed) {
      this.registerSchemes();
      if (game) game.profile = data.profile;
      SaveManager.save();
      audio.play("unlock");
    }
  },

  update(dt) {
    if (!this.toasts.length) return;
    this.toasts[0].timer -= dt;
    if (this.toasts[0].timer <= 0) this.toasts.shift();
  },

  drawToast() {
    const toast = this.toasts[0];
    if (!toast) return;
    const t = toast.timer;
    const slide = Math.min(1, (ACHIEVEMENT_TOAST_SECONDS - t) * 4, t * 3);
    const w = 330;
    const h = 56;
    const x = W - (w + 12) * slide;
    const y = 140;
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = YOLK;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    drawEggIcon(x + 26, y + h / 2, 14);
    ctx.fillStyle = LINE;
    ctx.font = "bold 12px Courier New";
    ctx.fillText(`ACHIEVEMENT  +1 GE${toast.a.scheme ? "  +NEW COLORS" : ""}`, x + 48, y + 18);
    ctx.font = "bold 17px Courier New";
    ctx.fillText(toast.a.name, x + 48, y + 38);
    ctx.font = "11px Courier New";
    ctx.fillText(toast.a.desc, x + 48, y + 51);
    ctx.restore();
  },

  // Gallery scene, drawn by Menus when game.scene === "achievements".
  drawGallery(game) {
    Menus.veil(0.94);
    ctx.fillStyle = LINE;
    ctx.font = "bold 40px Courier New";
    centerText("ACHIEVEMENTS", 70);
    ctx.font = "bold 18px Courier New";
    centerText(`${this.count()} / ${ACHIEVEMENTS.length} unlocked`, 98);
    const cols = 4;
    const cw = 268;
    const ch = 84;
    const gx = (W - cols * cw - (cols - 1) * 10) / 2;
    ACHIEVEMENTS.forEach((a, i) => {
      const x = gx + (i % cols) * (cw + 10);
      const y = 112 + Math.floor(i / cols) * (ch + 6);
      const got = this.isUnlocked(a.id);
      ctx.save();
      ctx.globalAlpha = got ? 1 : 0.45;
      ctx.fillStyle = got ? rgbaFromHex(YOLK, 0.25) : PAPER;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = got ? 2.5 : 1.5;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeRect(x, y, cw, ch);
      if (got) drawEggIcon(x + 22, y + 26, 12);
      else {
        ctx.strokeStyle = LINE;
        ctx.strokeRect(x + 14, y + 22, 16, 13);
        ctx.beginPath();
        ctx.arc(x + 22, y + 22, 5, Math.PI, 0);
        ctx.stroke();
      }
      ctx.fillStyle = LINE;
      ctx.font = "bold 15px Courier New";
      ctx.fillText(a.name, x + 42, y + 26);
      ctx.font = "12px Courier New";
      game.wrapText(a.desc, cw - 52).slice(0, 2).forEach((ln, li) => ctx.fillText(ln, x + 42, y + 46 + li * 15));
      if (a.scheme) {
        ctx.font = "bold 11px Courier New";
        ctx.fillText(`Reward: ${a.scheme} colors`, x + 42, y + ch - 10);
      }
      ctx.restore();
    });
    Menus.button("BACK", W / 2, H - 62, 260, () => { game.scene = "title"; }).hot = true;
  },
};

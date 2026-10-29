"use strict";

// Scene menus drawn on the canvas: title, pause and settings.
// The Game owns `scene` ("title" | "battle" | "paused" | "settings"); this module draws and handles
// clicks for every scene except "battle".

const SPEECH_LEVELS = [
  { label: "OFF", value: 0 },
  { label: "LOW", value: 0.05 },
  { label: "NORMAL", value: 0.1 },
  { label: "CHATTY", value: 0.25 },
];

const SETTINGS_DEFAULTS = {
  volume: 100,
  sfxVolume: 100,
  musicVolume: 60,
  muted: false,
  colorScheme: "sunset",
  speech: 2,
  screenShake: true,
};

// Pushes saved player settings into the live `settings` object and color globals.
function applyPlayerSettings() {
  const prefs = SaveManager.data.settings;
  Achievements.registerSchemes();
  for (const [key, value] of Object.entries(SETTINGS_DEFAULTS)) {
    if (!(key in prefs)) prefs[key] = value;
  }
  for (const key of ["volume", "sfxVolume", "musicVolume"]) prefs[key] = clamp(Math.round(Number(prefs[key]) || 0), 0, 100);
  prefs.speech = clamp(Math.round(Number(prefs.speech) || 0), 0, SPEECH_LEVELS.length - 1);
  if (!settings.colorSchemes[prefs.colorScheme]) prefs.colorScheme = SETTINGS_DEFAULTS.colorScheme;
  settings.soundVolume = prefs.muted ? 0 : (prefs.volume / 100) * 3;
  settings.sfxVolume = prefs.sfxVolume / 100;
  settings.musicVolume = prefs.musicVolume / 100;
  settings.useSampleJingles = true;
  audio.applyVolumes();
  settings.muted = !!prefs.muted;
  settings.colorScheme = prefs.colorScheme;
  settings.speechBubbleFrequency = SPEECH_LEVELS[prefs.speech].value;
  settings.screenShake = !!prefs.screenShake;
  applyColorScheme();
}

const Menus = {
  buttons: [],
  confirmNewGame: false,
  returnScene: "title",
  armoryReturn: "title",
  powersReturn: "title",

  openPowers(game, from) {
    this.powersReturn = from;
    game.scene = "powers";
  },

  openArmory(game, from) {
    this.armoryReturn = from;
    game.scene = "armory";
  },

  button(label, cx, y, w, action, h = 46) {
    const rect = { x: cx - w / 2, y, w, h, label, action };
    this.buttons.push(rect);
    return rect;
  },

  drawButton(rect, hot = false) {
    ctx.save();
    if (rect.disabled) ctx.globalAlpha = 0.45;
    ctx.fillStyle = hot ? rgbaFromHex(YOLK, 0.9) : PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = LINE;
    ctx.font = "bold 22px Courier New";
    const tw = ctx.measureText(rect.label).width;
    ctx.fillText(rect.label, rect.x + (rect.w - tw) / 2, rect.y + rect.h / 2 + 7);
    ctx.restore();
  },

  veil(alpha = 0.82) {
    ctx.fillStyle = rgbaFromHex(PAPER, alpha);
    ctx.fillRect(0, 0, W, H);
  },

  draw(game) {
    this.buttons = [];
    if (game.scene === "title") this.drawTitle(game);
    if (game.scene === "paused") this.drawPause(game);
    if (game.scene === "settings") this.drawSettings(game);
    if (game.scene === "armory") drawArmoryScreen(game);
    if (game.scene === "achievements") Achievements.drawGallery(game);
    if (game.scene === "map") WorldMap.draw(game);
    if (game.scene === "stats") Stats.draw(game);
    if (game.scene === "powers") Abilities.drawScreen(game);
    this.buttons.forEach((b) => this.drawButton(b, b.hot));
  },

  drawTitle(game) {
    this.veil(0.7);
    const bob = Math.sin(performance.now() * 0.003) * 4;
    ctx.fillStyle = LINE;
    ctx.font = "bold 84px Courier New";
    centerText("EGG WARS", 190 + bob);
    ctx.font = "bold 20px Courier New";
    centerText("A breakfast battlefield", 228);
    drawEggIcon(W / 2 - 250, 160 + bob, 22);
    drawEggIcon(W / 2 + 250, 160 - bob, 22);
    ctx.fillStyle = LINE;
    const p = game.profile;
    const fresh = p.stage <= 1 && p.level <= 1 && game.score.blue + game.score.red === 0;
    const play = this.button(fresh ? "PLAY" : `CONTINUE - STAGE ${p.stage}`, W / 2, 280, 380, () => game.startBattle());
    play.hot = true;
    this.button("WORLD MAP", W / 2 - 97, 340, 186, () => WorldMap.open(game));
    const powersOpen = ABILITIES.some((a) => Abilities.unlocked(p, a));
    const powers = this.button(powersOpen ? "POWERS" : `POWERS (LV${ABILITIES[0].level})`, W / 2 + 97, 340, 186, () => this.openPowers(game, "title"));
    powers.disabled = !powersOpen;
    const armory = this.button(Armory.isOpen(p) ? "ARMORY" : `ARMORY (LV${ARMORY_UNLOCK_LEVEL})`, W / 2 - 97, 400, 186, () => this.openArmory(game, "title"));
    armory.disabled = !Armory.isOpen(p);
    this.button(`TROPHIES ${Achievements.count()}/${ACHIEVEMENTS.length}`, W / 2 + 97, 400, 186, () => { game.scene = "achievements"; });
    this.button("STATS", W / 2 - 97, 460, 186, () => { game.scene = "stats"; });
    this.button("SETTINGS", W / 2 + 97, 460, 186, () => this.openSettings(game, "title"));
    if (!fresh) {
      ctx.font = "bold 18px Courier New";
      ctx.fillStyle = LINE;
      centerText(`LV ${p.level}   GOLD $${p.gold}   GOLDEN EGGS ${p.goldenEggs}   WINS ${game.score.blue}`, 536);
    }
    ctx.font = "bold 16px Courier New";
    centerText("Tap unit buttons to send troops. Tap the battlefield to drop yolk bombs.", 580);
    centerText("1-9 buy units   Q egg type   W/E powers   Esc pause   M mute   R restart", 604);
    ctx.font = "bold 14px Courier New";
    const credit = "EGG WARS (c) 2026. Created by Michael K. Davis, MD.";
    ctx.fillText(credit, W - ctx.measureText(credit).width - 18, H - 18);
  },

  drawPause(game) {
    this.veil();
    ctx.fillStyle = LINE;
    ctx.font = "bold 54px Courier New";
    centerText("PAUSED", 200);
    this.button("RESUME", W / 2, 250, 340, () => { game.scene = "battle"; }).hot = true;
    this.button("RESTART STAGE", W / 2, 310, 340, () => { game.scene = "battle"; game.restart(); });
    this.button("SETTINGS", W / 2, 370, 340, () => this.openSettings(game, "paused"));
    const powers = this.button("POWERS", W / 2, 430, 340, () => this.openPowers(game, "paused"));
    powers.disabled = !ABILITIES.some((a) => Abilities.unlocked(game.profile, a));
    this.button("TITLE SCREEN", W / 2, 490, 340, () => { game.endPractice(); game.startStage(); game.scene = "title"; });
  },

  openSettings(game, from) {
    this.returnScene = from;
    this.confirmNewGame = false;
    game.scene = "settings";
  },

  drawSettings(game) {
    this.veil(0.9);
    const prefs = SaveManager.data.settings;
    ctx.fillStyle = LINE;
    ctx.font = "bold 46px Courier New";
    centerText("SETTINGS", 96);
    const rowX = W / 2 - 300;
    const valueX = W / 2 + 120;
    let y = 120;
    const row = (label, value, onMinus, onPlus, level = null) => {
      ctx.fillStyle = LINE;
      ctx.font = "bold 24px Courier New";
      ctx.fillText(label, rowX, y + 31);
      if (level !== null) {
        // Slider bar between the arrows.
        const bx = valueX - 105;
        const bw = 210;
        ctx.fillStyle = rgbaFromHex(YOLK, prefs.muted ? 0.3 : 0.85);
        ctx.fillRect(bx, y + 14, bw * level, 18);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, y + 14, bw, 18);
      }
      ctx.fillStyle = LINE;
      ctx.font = "bold 20px Courier New";
      const tw = ctx.measureText(value).width;
      ctx.fillText(value, valueX - tw / 2, y + 30);
      if (onMinus) this.button("<", valueX - 140, y, 46, onMinus);
      this.button(">", valueX + 140, y, 46, onPlus);
      y += 50;
    };
    const update = () => {
      applyPlayerSettings();
      SaveManager.save();
    };
    const volumeRow = (label, key, preview) => {
      const step = (d) => {
        prefs[key] = clamp(prefs[key] + d, 0, 100);
        update();
        if (preview) audio.play(preview);
      };
      row(label, `${prefs[key]}%`, () => step(-10), () => step(10), prefs[key] / 100);
    };
    volumeRow("Master volume", "volume", "coin");
    volumeRow("Effects", "sfxVolume", "egg_splat");
    volumeRow("Music", "musicVolume", null);
    row("Sound (M)", prefs.muted ? "MUTED" : "ON", null, () => { prefs.muted = !prefs.muted; update(); });
    const schemes = Object.keys(settings.colorSchemes);
    const cycle = (dir) => {
      const i = schemes.indexOf(prefs.colorScheme);
      prefs.colorScheme = schemes[(i + dir + schemes.length) % schemes.length];
      update();
    };
    row("Colors", prefs.colorScheme.toUpperCase(), () => cycle(-1), () => cycle(1));
    row("Speech bubbles", SPEECH_LEVELS[prefs.speech].label,
      () => { prefs.speech = Math.max(0, prefs.speech - 1); update(); },
      () => { prefs.speech = Math.min(SPEECH_LEVELS.length - 1, prefs.speech + 1); update(); });
    row("Screen shake", prefs.screenShake ? "ON" : "OFF", null, () => { prefs.screenShake = !prefs.screenShake; update(); });
    const tutorialDone = !!SaveManager.data.flags.tutorialDone;
    row("Tutorial & tips", tutorialDone ? "DONE" : "ON", null, () => { if (tutorialDone) Tutorial.replay(); else Tutorial.finish(); });
    const reset = this.button(this.confirmNewGame ? "CLICK AGAIN TO ERASE SAVE" : "NEW GAME (ERASE SAVE)", W / 2, y + 14, 420, () => {
      if (!this.confirmNewGame) {
        this.confirmNewGame = true;
        return;
      }
      this.confirmNewGame = false;
      game.newGame();
      game.scene = "title";
    });
    if (this.confirmNewGame) reset.hot = true;
    this.button("BACK", W / 2, y + 80, 260, () => { game.scene = this.returnScene; }).hot = true;
  },

  click(game, x, y) {
    if (game.scene === "map" && WorldMap.click(game, x, y)) return;
    const hit = this.buttons.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (!hit) return;
    if (hit.disabled) {
      audio.play("deny");
      return;
    }
    audio.play("click");
    if (hit.label !== "CLICK AGAIN TO ERASE SAVE" && !hit.label.startsWith("NEW GAME")) this.confirmNewGame = false;
    hit.action();
  },
};

function drawEggIcon(x, y, r) {
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = YOLK;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

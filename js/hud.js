"use strict";

// Battle HUD: unit shop bar (top left), stage/time/gold panel (top centre), enemy roster
// (top right), XP bar and next-unlock teaser, and the Yolk Drop ability ring (bottom left).

const SHOP_ORDER = ["soldier", "tank", "motorcycle", "drone", "airplane", "helicopter", "bomber", "castle"];
const SHOP_CARD = { x: 12, y: 8, w: 58, h: 60, gap: 6 };

// Tiny line-art glyph for each unit type, centred on (x, y) and roughly `size` wide.
function drawUnitIcon(type, x, y, size, color) {
  const k = size / 40;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.fillStyle = rgbaFromHex(color, 0.3);
  ctx.lineWidth = 2.4 / Math.max(0.6, k);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const path = (pts, close = true) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    if (close) ctx.closePath();
  };
  const ring = (cx, cy, r, fill = false) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (fill) ctx.fill();
    ctx.stroke();
  };
  if (type === "soldier") {
    ring(0, -11, 5, true);
    path([[0, -6], [0, 6]], false); ctx.stroke();
    path([[0, -1], [11, -4]], false); ctx.stroke();
    path([[0, 6], [-6, 16]], false); ctx.stroke();
    path([[0, 6], [6, 16]], false); ctx.stroke();
  } else if (type === "tank") {
    path([[-17, 2], [17, 2], [19, 10], [-19, 10]]); ctx.fill(); ctx.stroke();
    path([[-8, 2], [-4, -6], [8, -6], [10, 2]]); ctx.fill(); ctx.stroke();
    path([[6, -3], [20, -9]], false); ctx.stroke();
    [-11, 0, 11].forEach((wx) => ring(wx, 13, 4));
  } else if (type === "motorcycle") {
    ring(-11, 10, 6);
    ring(11, 10, 6);
    path([[-11, 10], [0, 0], [11, 10]], false); ctx.stroke();
    path([[0, 0], [0, -10]], false); ctx.stroke();
    ring(0, -14, 4, true);
  } else if (type === "drone") {
    ctx.beginPath(); ctx.ellipse(0, 6, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    path([[0, 0], [0, -8]], false); ctx.stroke();
    path([[-12, -14], [12, -2]], false); ctx.stroke();
    path([[-12, -2], [12, -14]], false); ctx.stroke();
  } else if (type === "airplane" || type === "bomber") {
    const L = type === "bomber" ? 1.2 : 1;
    path([[18 * L, 0], [-6, -6], [-17 * L, 1], [-6, 6]]); ctx.fill(); ctx.stroke();
    path([[2, 0], [-8, 13], [9, 3]]); ctx.stroke();
    path([[-17 * L, 1], [-21 * L, -8]], false); ctx.stroke();
    if (type === "bomber") [[-4, 9], [4, 9]].forEach(([bx, by]) => ring(bx, by, 2.5, true));
  } else if (type === "helicopter") {
    ctx.beginPath(); ctx.ellipse(0, 3, 14, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    path([[0, -4], [0, -10]], false); ctx.stroke();
    path([[-20, -10], [20, -10]], false); ctx.stroke();
    path([[-12, 2], [-24, -2]], false); ctx.stroke();
    path([[-12, 14], [12, 14]], false); ctx.stroke();
  } else if (type === "castle") {
    path([[-12, 16], [-12, -12], [-7, -12], [-7, -7], [-2, -7], [-2, -12], [3, -12], [3, -7], [8, -7], [8, -12], [12, -12], [12, 16]]);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 16, 5, Math.PI, 0); ctx.stroke();
  }
  ctx.restore();
}

const Hud = {
  draw(game) {
    game.buttons = [];
    this.drawShop(game);
    this.drawCenterPanel(game);
    this.drawEnemyRoster(game);
    this.drawAbility(game);
    this.drawMuteBadge();
  },

  count(game, side, type) {
    let n = 0;
    for (const u of game.units) if (u.side === side && !u.dead && unitType(u) === type) n++;
    return n;
  },

  drawShop(game) {
    const p = game.profile;
    SHOP_ORDER.forEach((type, i) => {
      const x = SHOP_CARD.x + i * (SHOP_CARD.w + SHOP_CARD.gap);
      const y = SHOP_CARD.y;
      const { w, h } = SHOP_CARD;
      const locked = !Unlocks.unitUnlocked(p, type);
      const cost = Armory.unitCost(p, type);
      const affordable = !locked && game.gold >= cost;
      const rect = { x, y, w, h, side: RIGHT, type, locked };
      game.buttons.push(rect);
      ctx.save();
      if (locked) ctx.globalAlpha = 0.38;
      ctx.fillStyle = PAPER;
      ctx.fillRect(x, y, w, h);
      if (affordable) {
        ctx.fillStyle = rgbaFromHex(BLUE, 0.12);
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeStyle = LINE;
      ctx.lineWidth = affordable ? 2.5 : 1.5;
      ctx.strokeRect(x, y, w, h);
      drawUnitIcon(type, x + w / 2, y + 26, 34, BLUE);
      ctx.fillStyle = LINE;
      ctx.font = "bold 12px Courier New";
      ctx.fillText(String(i + 1), x + 4, y + 12);
      const count = this.count(game, RIGHT, type);
      if (count) {
        const t = String(count);
        ctx.fillText(t, x + w - 4 - ctx.measureText(t).width, y + 12);
      }
      ctx.font = "bold 13px Courier New";
      const label = locked ? `LV${Unlocks.unitUnlockLevel(type)}` : `$${cost}`;
      ctx.fillText(label, x + (w - ctx.measureText(label).width) / 2, y + h - 5);
      ctx.restore();
    });
  },

  drawCenterPanel(game) {
    const timeLeft = Math.max(0, Math.ceil(game.roundLimit - game.roundTime));
    const x = 540;
    const w = 280;
    const y = 8;
    ctx.save();
    ctx.fillStyle = rgbaFromHex(PAPER, 0.85);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, 60);
    ctx.strokeRect(x, y, w, 60);
    ctx.fillStyle = LINE;
    ctx.font = "bold 18px Courier New";
    ctx.fillText(`STAGE ${game.stage}`, x + 10, y + 24);
    ctx.fillText(`$${game.gold}`, x + 10, y + 50);
    // Timer: big number with a draining ring.
    const cx = x + w - 34;
    const cy = y + 30;
    const frac = clamp(1 - game.roundTime / game.roundLimit, 0, 1);
    ctx.lineWidth = 4;
    ctx.strokeStyle = rgbaFromHex(LINE, 0.15);
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = timeLeft <= 10 ? RED : LINE;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    ctx.fillStyle = timeLeft <= 10 ? RED : LINE;
    ctx.font = "bold 18px Courier New";
    const tt = String(timeLeft);
    ctx.fillText(tt, cx - ctx.measureText(tt).width / 2, cy + 6);
    // Army strength comparison bar.
    const blue = game.armyScore(game.living(RIGHT));
    const red = game.armyScore(game.living(LEFT));
    const share = blue + red > 0 ? blue / (blue + red) : 0.5;
    const bx = x + 110;
    const bw = 100;
    ctx.fillStyle = RED;
    ctx.fillRect(bx, y + 40, bw, 10);
    ctx.fillStyle = BLUE;
    ctx.fillRect(bx, y + 40, bw * share, 10);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, y + 40, bw, 10);
    ctx.fillStyle = LINE;
    ctx.font = "bold 11px Courier New";
    ctx.fillText("ARMY", bx, y + 34);
    ctx.restore();
    game.drawXpBar(W / 2 - 210, 78, 420);
    ctx.fillStyle = LINE;
    ctx.font = "bold 13px Courier New";
    ctx.fillText(Weather.label(), W / 2 + 222, 91);
    const teaser = Unlocks.nextText(game.profile);
    if (teaser && !game.winner) {
      ctx.font = "bold 14px Courier New";
      ctx.fillStyle = LINE;
      centerText(teaser, 112);
    }
  },

  drawMuteBadge() {
    if (!settings.muted) return;
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.fillRect(W - 128, 72, 116, 22);
    ctx.strokeRect(W - 128, 72, 116, 22);
    ctx.fillStyle = LINE;
    ctx.font = "bold 13px Courier New";
    ctx.fillText("MUTED  (M)", W - 116, 88);
    ctx.restore();
  },

  drawEnemyRoster(game) {
    const types = SHOP_ORDER;
    const cell = 40;
    const x0 = W - 12 - (types.length / 2) * cell * 2;
    ctx.save();
    ctx.fillStyle = LINE;
    ctx.font = "bold 12px Courier New";
    types.forEach((type, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = x0 + col * cell * 2;
      const y = 10 + row * 30;
      const n = this.count(game, LEFT, type);
      ctx.globalAlpha = n ? 1 : 0.3;
      drawUnitIcon(type, x + 14, y + 12, 24, RED);
      ctx.fillStyle = LINE;
      ctx.font = "bold 15px Courier New";
      ctx.fillText(`x${n}`, x + 30, y + 18);
    });
    ctx.restore();
  },

  drawAbility(game) {
    const x = 46;
    const y = H - 46;
    const r = 28;
    const cooldown = Armory.yolkCooldown(game.profile);
    const ready = game.powerUpCooldown <= 0;
    const frac = ready ? 1 : 1 - game.powerUpCooldown / cooldown;
    ctx.save();
    const pulse = ready ? 1 + Math.sin(performance.now() * 0.006) * 0.06 : 1;
    ctx.fillStyle = ready ? rgbaFromHex(YOLK, 0.85) : PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!ready) {
      ctx.strokeStyle = YOLK;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
    }
    // Yolk icon.
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = YOLK;
    ctx.beginPath();
    ctx.arc(x, y + 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = LINE;
    ctx.font = "bold 15px Courier New";
    const kind = EggTypes.selected(game.profile);
    const name = kind.id === "normal" ? "YOLK DROP" : `${kind.name.toUpperCase()} DROP`;
    const label = ready ? `${name} READY - tap the battlefield` : `${name} ${game.powerUpCooldown.toFixed(1)}s`;
    ctx.fillText(label, x + r + 12, y + 5);
    ctx.restore();
    this.drawEggPicker(game, x + r + 12, y - 34);
  },

  eggButtons: [],

  // Small chips to choose the Yolk Drop egg (only shown once more than one type is unlocked).
  drawEggPicker(game, x, y) {
    this.eggButtons = [];
    const types = EggTypes.unlockedYolkDrops(game.profile);
    if (types.length < 2) return;
    const selected = EggTypes.selected(game.profile);
    ctx.save();
    ctx.font = "bold 12px Courier New";
    types.forEach((type) => {
      const w = ctx.measureText(type.name).width + 16;
      const rect = { x, y, w, h: 20, id: type.id };
      this.eggButtons.push(rect);
      ctx.fillStyle = type === selected ? rgbaFromHex(YOLK, 0.85) : PAPER;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = type === selected ? 2 : 1;
      ctx.fillRect(x, y, w, 20);
      ctx.strokeRect(x, y, w, 20);
      ctx.fillStyle = LINE;
      ctx.fillText(type.name, x + 8, y + 14);
      x += w + 6;
    });
    ctx.fillText("Q", x + 2, y + 14);
    ctx.restore();
  },

  eggButtonAt(x, y) {
    return this.eggButtons.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  },
};

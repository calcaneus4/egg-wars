"use strict";

// Time of day. Each stage has a phase (day, dusk, night, dawn); during a round the sky drifts a
// little toward the next phase. The sky is a translucent gradient over the paper colour, so it
// works with every colour scheme, plus stars and a moon at night.

const SKY_PHASES = {
  day: { top: [140, 200, 255, 0.0], bottom: [255, 240, 200, 0.0], stars: 0, moon: false, shade: 0 },
  dusk: { top: [90, 60, 150, 0.32], bottom: [255, 140, 60, 0.36], stars: 0.25, moon: false, shade: 0.04 },
  night: { top: [15, 20, 60, 0.62], bottom: [60, 50, 110, 0.42], stars: 1, moon: true, shade: 0.1 },
  dawn: { top: [120, 150, 220, 0.25], bottom: [255, 170, 150, 0.32], stars: 0.15, moon: false, shade: 0.02 },
};

// Stages 1-2 are always daytime so new players learn in clear light; then the cycle rotates.
const SKY_CYCLE = ["day", "day", "dusk", "night", "dawn"];
const SKY_ROUND_DRIFT = 0.35;

const Sky = {
  stars: [],
  seed: 0,

  phaseForStage(stage) {
    return SKY_CYCLE[(Math.max(1, stage) - 1) % SKY_CYCLE.length];
  },

  regenerate(stage) {
    this.phase = this.phaseForStage(stage);
    this.next = this.phaseForStage(stage + 1);
    const random = seededRandom(stage * 7919 + 13);
    this.stars = [];
    for (let i = 0; i < 70; i++) this.stars.push({ x: random() * W, y: random() * H * 0.5, r: 0.6 + random() * 1.6, tw: random() * 6 });
  },

  // Blended phase values for this moment of the round.
  current(game) {
    const a = SKY_PHASES[this.phase || "day"];
    const b = SKY_PHASES[this.next || "day"];
    const k = game.scene === "battle" && game.roundLimit ? clamp(game.roundTime / game.roundLimit, 0, 1) * SKY_ROUND_DRIFT : 0;
    const mix = (x, y) => x + (y - x) * k;
    const mixColor = (c1, c2) => c1.map((v, i) => mix(v, c2[i]));
    return {
      top: mixColor(a.top, b.top),
      bottom: mixColor(a.bottom, b.bottom),
      stars: mix(a.stars, b.stars),
      moon: k < 0.5 ? a.moon : b.moon,
      shade: mix(a.shade, b.shade),
    };
  },

  rgba(c) {
    return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;
  },

  // Drawn over the solid parallax hills (so they take on the dusk/night light), before the sun or
  // moon. Stars are only drawn in open sky above the farthest ridge.
  drawSky(game) {
    const s = this.current(game);
    this.now = s;
    if (s.top[3] > 0.01 || s.bottom[3] > 0.01) {
      const grad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      grad.addColorStop(0, this.rgba(s.top));
      grad.addColorStop(1, this.rgba(s.bottom));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
    if (s.stars > 0.02) {
      const t = performance.now() * 0.001;
      ctx.save();
      ctx.fillStyle = "#fffbe8";
      for (const star of this.stars) {
        if (star.y > game.background.skylineAt(star.x) - 4) continue;
        ctx.globalAlpha = s.stars * (0.55 + 0.45 * Math.sin(t * 1.7 + star.tw));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  },

  // A light wash over the ground layers (drawn before units so they stay crisp).
  drawShade() {
    const s = this.now;
    if (!s || s.shade <= 0.005) return;
    ctx.fillStyle = `rgba(20,25,70,${s.shade.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  },

  isNight() {
    return !!(this.now && this.now.moon);
  },
};

function drawMoon(x, y, t) {
  ctx.save();
  ctx.fillStyle = "#fffbe8";
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Craters, drawn like little yolks.
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  [[-10, -8, 6], [9, 4, 4], [-4, 12, 3]].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  // Soft glow ring.
  ctx.globalAlpha = 0.25 + 0.05 * Math.sin(t);
  ctx.strokeStyle = "#fffbe8";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

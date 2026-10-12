"use strict";

// Weather per stage: clear, rain, snow or windy. Wind gently pushes every egg in flight (both
// armies equally) and is shown by a wind sock in the middle of the battlefield.

const WEATHER_TYPES = [
  { id: "clear", weight: 5 },
  { id: "rain", weight: 2 },
  { id: "snow", weight: 1.5 },
  { id: "windy", weight: 1.5 },
];
// Horizontal egg acceleration (px/s^2) at full wind strength.
const WIND_ACCEL = 38;

const Weather = {
  type: "clear",
  wind: 0,
  drops: [],
  gust: 0,

  regenerate(stage) {
    const random = seededRandom(stage * 104729 + 7);
    if (stage <= 2) {
      this.type = "clear";
    } else {
      const total = WEATHER_TYPES.reduce((sum, w) => sum + w.weight, 0);
      let roll = random() * total;
      this.type = WEATHER_TYPES.find((w) => (roll -= w.weight) <= 0).id;
    }
    const dir = random() < 0.5 ? -1 : 1;
    const strength = this.type === "windy" ? 0.7 + random() * 0.3 : this.type === "clear" ? random() * 0.15 : 0.15 + random() * 0.3;
    this.baseWind = dir * strength;
    this.wind = this.baseWind;
    this.gust = 0;
    this.drops = [];
    const count = this.type === "rain" ? 160 : this.type === "snow" ? 110 : this.type === "windy" ? 18 : 0;
    for (let i = 0; i < count; i++) this.drops.push(this.newDrop(true));
  },

  newDrop(anywhere) {
    return {
      x: rand(-40, W + 40),
      y: anywhere ? rand(0, H) : rand(-40, -5),
      v: this.type === "rain" ? rand(520, 700) : this.type === "snow" ? rand(30, 60) : rand(0, 10),
      sway: rand(0, Math.PI * 2),
      size: rand(0.7, 1.4),
    };
  },

  // Horizontal acceleration applied to eggs.
  eggAccel() {
    return this.wind * WIND_ACCEL;
  },

  update(dt, terrain) {
    this.gust += dt;
    this.wind = this.baseWind * (1 + 0.25 * Math.sin(this.gust * 0.7));
    const windPx = this.wind * 120;
    for (const d of this.drops) {
      if (this.type === "rain") {
        d.x += windPx * 1.4 * dt;
        d.y += d.v * dt;
      } else if (this.type === "snow") {
        d.sway += dt * 1.5;
        d.x += (windPx * 0.8 + Math.sin(d.sway) * 18) * dt;
        d.y += d.v * dt;
      } else {
        // Windy: little leaves and dust streaks blowing across.
        d.x += windPx * 2.2 * dt;
        d.y += Math.sin(d.sway += dt * 3) * 20 * dt;
      }
      const ground = terrain ? terrain.yAt(clamp(d.x, 0, W)) : H;
      if (d.y > ground || d.x < -60 || d.x > W + 60) {
        if (this.type === "rain" && d.y > ground && Math.random() < 0.15) Effects.spawn("drop", d.x, ground, rand(-20, 20), rand(-60, -20), 0.2, 1.2, WHITE);
        Object.assign(d, this.newDrop(this.type !== "windy"));
        if (this.type === "windy") {
          d.x = this.wind > 0 ? -30 : W + 30;
          d.y = rand(H * 0.3, H * 0.85);
        }
      }
    }
  },

  draw() {
    if (!this.drops.length) return;
    ctx.save();
    if (this.type === "rain") {
      ctx.strokeStyle = rgbaFromHex(LINE, 0.3);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      const slant = this.wind * 120 * 1.4 * 0.025;
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - slant, d.y - 14 * d.size);
      }
      ctx.stroke();
    } else if (this.type === "snow") {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = rgbaFromHex(LINE, 0.35);
      ctx.lineWidth = 0.8;
      for (const d of this.drops) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.2 * d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = rgbaFromHex(LINE, 0.45);
      ctx.lineWidth = 1.5;
      for (const d of this.drops) {
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 4 * d.size, 2 * d.size, d.sway, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(d.x - Math.sign(this.wind) * 10, d.y);
        ctx.lineTo(d.x - Math.sign(this.wind) * 30, d.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  // Wind sock on a pole planted in the middle of the battlefield.
  drawWindSock(terrain) {
    const x = W / 2;
    const ground = terrain.yAt(x);
    const top = ground - 46;
    const w = this.wind;
    const t = performance.now() * 0.008;
    line(x, ground, x, top, LINE, 2);
    const len = 10 + Math.abs(w) * 26;
    const droop = (1 - Math.min(1, Math.abs(w) * 1.2)) * 14;
    const dir = w >= 0 ? 1 : -1;
    const flap = Math.sin(t) * 2 * Math.abs(w);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top - 5);
    ctx.lineTo(x + dir * len, top - 2 + droop + flap);
    ctx.lineTo(x + dir * len, top + 3 + droop + flap);
    ctx.lineTo(x, top + 6);
    ctx.closePath();
    ctx.fillStyle = RED;
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Stripes.
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2;
    for (let k = 1; k <= 2; k++) {
      const sx = x + dir * len * (k / 3);
      const sy = top - 5 + (droop + flap + 3) * (k / 3);
      ctx.beginPath();
      ctx.moveTo(sx, sy + 1);
      ctx.lineTo(sx, sy + 10 - k * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  },

  label() {
    const arrow = this.wind >= 0 ? ">" : "<";
    const strength = Math.abs(this.wind);
    const level = strength < 0.2 ? "calm" : strength < 0.55 ? "breeze" : "strong wind";
    return `${this.type === "clear" ? "" : this.type.toUpperCase() + "  "}${level} ${strength >= 0.2 ? arrow.repeat(strength < 0.55 ? 1 : 2) : ""}`.trim();
  },
};

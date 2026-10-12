"use strict";

const EGG_TRAIL_LENGTH = 7;
const SPLAT_HOLD_SECONDS = 9;
const SPLAT_FADE_SECONDS = 6;

class Egg {
  constructor(x, y, vx, vy, side, burst = 0) {
    Object.assign(this, { x, y, vx, vy, side, burst });
    this.radius = s(8);
    this.trail = [];
    this.spin = rand(-6, 6);
    this.angle = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.trail.push(this.x, this.y);
    if (this.trail.length > EGG_TRAIL_LENGTH * 2) this.trail.splice(0, 2);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += GRAVITY * dt;
    this.angle += this.spin * dt;
  }

  draw() {
    // Fading motion trail, tinted by team.
    const n = this.trail.length / 2;
    if (n > 1) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = teamColor(this.side);
      for (let i = 1; i < n; i++) {
        ctx.globalAlpha = (i / n) * 0.35;
        ctx.lineWidth = 1 + (i / n) * this.radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(this.trail[(i - 1) * 2], this.trail[(i - 1) * 2 + 1]);
        ctx.lineTo(this.trail[i * 2], this.trail[i * 2 + 1]);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (this.burst) {
      // Burst eggs carry a yolk-colored band so they read as "special".
      ctx.strokeStyle = YOLK;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 0.95, this.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Splat {
  constructor(x, y, slope, size = 1) {
    Object.assign(this, { x, y, slope, size });
    this.age = 0;
    // Irregular egg-white outline.
    this.blob = [];
    const lobes = 9;
    for (let i = 0; i < lobes; i++) this.blob.push(rand(0.75, 1.2));
    this.yolkX = rand(-4, 6);
    this.drips = [];
    const dripCount = Math.floor(rand(1, 4));
    for (let i = 0; i < dripCount; i++) this.drips.push({ x: rand(-14, 14), len: rand(4, 11), speed: rand(4, 10) });
  }

  update(dt) {
    this.age += dt;
  }

  get faded() {
    return this.age > SPLAT_HOLD_SECONDS + SPLAT_FADE_SECONDS;
  }

  draw() {
    const fade = 1 - clamp((this.age - SPLAT_HOLD_SECONDS) / SPLAT_FADE_SECONDS, 0, 1);
    if (fade <= 0) return;
    const k = this.size;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.slope);
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    // Drips run down over the first second.
    for (const d of this.drips) {
      const len = Math.min(d.len, this.age * d.speed * 2) * k;
      if (len <= 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(s(d.x) * k - 2, -s(1));
      ctx.lineTo(s(d.x) * k - 1.5, s(len));
      ctx.arc(s(d.x) * k, s(len), 1.8, Math.PI, 0, true);
      ctx.lineTo(s(d.x) * k + 2, -s(1));
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    const n = this.blob.length;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.blob[i % n];
      const px = Math.cos(a) * s(18) * r * k;
      const py = -s(3) + Math.sin(a) * s(6) * r * k;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = YOLK;
    ctx.beginPath();
    ctx.arc(s(this.yolkX) * k, -s(5), s(6) * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Highlight on the yolk.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(s(this.yolkX - 2) * k, -s(7) * k, s(1.6) * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

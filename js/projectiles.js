"use strict";

const EGG_TRAIL_LENGTH = 7;
const SPLAT_HOLD_SECONDS = 9;
const SPLAT_FADE_SECONDS = 6;

class Egg {
  constructor(x, y, vx, vy, side, burst = 0, kind = "normal") {
    Object.assign(this, { x, y, vx, vy, side, burst });
    this.kind = EggTypes.get(kind);
    this.source = null;
    this.burst += this.kind.burst;
    this.age = 0;
    this.bouncesLeft = this.kind.bounces || 0;
    this.radius = s(this.kind.split ? 10 : 8) * Weather.eggScale() * (this.kind.radiusScale || 1);
    this.trail = [];
    this.spin = rand(-6, 6);
    this.angle = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.age += dt;
    this.trail.push(this.x, this.y);
    if (this.trail.length > EGG_TRAIL_LENGTH * 2) this.trail.splice(0, 2);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (!this.noGravity) {
      this.vy += GRAVITY * dt;
      this.vx += Weather.eggAccel() * dt;
    }
    this.angle += this.spin * dt;
  }

  draw() {
    // Motion trail, tinted by team: one tapered stroke instead of a stroke per segment.
    const n = this.trail.length / 2;
    if (n > 1) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = teamColor(this.side);
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = this.radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(this.trail[0], this.trail[1]);
      for (let i = 1; i < n; i++) ctx.lineTo(this.trail[i * 2], this.trail[i * 2 + 1]);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.noGravity ? Math.atan2(this.vy, this.vx) : this.angle);
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (this.kind.band === "homing") {
      // Little fins and an eye.
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.moveTo(-this.radius, -this.radius * 0.2);
      ctx.lineTo(-this.radius * 1.6, -this.radius * 0.7);
      ctx.lineTo(-this.radius * 1.3, 0);
      ctx.lineTo(-this.radius * 1.6, this.radius * 0.7);
      ctx.lineTo(-this.radius, this.radius * 0.2);
      ctx.fill();
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(this.radius * 0.35, -this.radius * 0.1, this.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind.band === "explosive") {
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 0.9, this.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fuse spark on top.
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 1.2);
      ctx.lineTo(this.radius * 0.3, -this.radius * 1.7);
      ctx.stroke();
      ctx.fillStyle = Math.floor(this.age * 20) % 2 ? YOLK : RED;
      ctx.beginPath();
      ctx.arc(this.radius * 0.3, -this.radius * 1.75, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind.band === "sleepy") {
      // A little crescent moon and a star.
      ctx.fillStyle = "#b9a0e6";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(this.radius * 0.25, -this.radius * 0.15, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind.band === "waffle") {
      ctx.fillStyle = "#e3a948";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#a8743a";
      ctx.lineWidth = 1.2;
      for (const k of [-0.4, 0, 0.4]) {
        ctx.beginPath();
        ctx.moveTo(k * this.radius, -this.radius * 0.9);
        ctx.lineTo(k * this.radius, this.radius * 0.9);
        ctx.moveTo(-this.radius * 0.9, k * this.radius);
        ctx.lineTo(this.radius * 0.9, k * this.radius);
        ctx.stroke();
      }
    } else if (this.kind.band === "bubble") {
      ctx.strokeStyle = "#7cc4f0";
      ctx.lineWidth = 1.5;
      for (const [bx, by, br] of [[-0.35, 0.2, 0.3], [0.3, -0.15, 0.35], [0, 0.45, 0.2]]) {
        ctx.beginPath();
        ctx.arc(bx * this.radius, by * this.radius, br * this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (this.kind.band === "toast") {
      // A slice of burnt toast instead of an egg.
      ctx.fillStyle = "#c98a3a";
      ctx.beginPath();
      ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#7a4a1a";
      ctx.fillRect(-this.radius * 0.6, -this.radius * 0.6, this.radius * 1.2, this.radius * 1.2);
      if (Math.random() < 0.3) Effects.spawn("smoke", this.x, this.y, 0, -20, 0.4, 3, LINE);
    } else if (this.kind.band === "magnet") {
      ctx.strokeStyle = "#d33";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -this.radius * 0.1, this.radius * 0.5, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = "#999";
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.5, -this.radius * 0.1);
      ctx.lineTo(-this.radius * 0.5, this.radius * 0.35);
      ctx.moveTo(this.radius * 0.5, -this.radius * 0.1);
      ctx.lineTo(this.radius * 0.5, this.radius * 0.35);
      ctx.stroke();
    } else if (this.kind.band === "popcorn") {
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(-this.radius * 0.8, -this.radius * 0.2, this.radius * 1.6, this.radius * 0.9);
      ctx.fillStyle = WHITE;
      for (const kx of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.arc(kx * this.radius, -this.radius * 0.35, this.radius * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this.kind.band === "kernel") {
      ctx.fillStyle = "#fff6d6";
      for (const [kx, ky] of [[-0.4, 0], [0.35, -0.2], [0, 0.4]]) {
        ctx.beginPath();
        ctx.arc(kx * this.radius, ky * this.radius, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this.kind.band === "frost") {
      ctx.fillStyle = "#8fd0f5";
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 0.75, this.radius * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1.2;
      for (let a = 0; a < 3; a++) {
        const c = Math.cos((a * Math.PI) / 3) * this.radius * 0.6;
        const d = Math.sin((a * Math.PI) / 3) * this.radius * 0.6;
        ctx.beginPath();
        ctx.moveTo(-c, -d);
        ctx.lineTo(c, d);
        ctx.stroke();
      }
    } else if (this.kind.band === "smoke") {
      ctx.fillStyle = "#9a978f";
      ctx.beginPath();
      ctx.arc(-this.radius * 0.3, this.radius * 0.2, this.radius * 0.35, 0, Math.PI * 2);
      ctx.arc(this.radius * 0.25, -this.radius * 0.1, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind.band === "zapper") {
      ctx.strokeStyle = YOLK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.2, -this.radius * 0.9);
      ctx.lineTo(this.radius * 0.3, -this.radius * 0.1);
      ctx.lineTo(-this.radius * 0.3, this.radius * 0.1);
      ctx.lineTo(this.radius * 0.2, this.radius * 0.9);
      ctx.stroke();
    } else if (this.kind.band === "sticky") {
      ctx.fillStyle = "rgba(120,190,60,0.85)";
      ctx.beginPath();
      ctx.ellipse(0, this.radius * 0.35, this.radius * 0.9, this.radius * 0.55, 0, 0, Math.PI);
      ctx.fill();
    } else if (this.kind.band === "bouncing") {
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 1.5;
      for (const k of [-0.4, 0, 0.4]) {
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.8, this.radius * k);
        ctx.lineTo(this.radius * 0.8, this.radius * k);
        ctx.stroke();
      }
    } else if (this.kind.band === "cluster") {
      // Cluster eggs show the little eggs packed inside.
      ctx.fillStyle = YOLK;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * this.radius * 0.45, (i % 2 ? -1 : 1) * this.radius * 0.25, this.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.burst) {
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

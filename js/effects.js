"use strict";

// Visual effects: pooled particles, screen shake and hit flashes.
// Particles are plain objects reused from a fixed pool, so a busy battle doesn't churn memory.

const PARTICLE_POOL_SIZE = 450;
// Screen shake is saved for big moments: small hits are ignored, and after a shake there is a
// short cooldown during which only the largest events (explosive eggs, boss stomps) can shake again.
const SHAKE_MIN = 4;
const SHAKE_BIG = 9;
const SHAKE_COOLDOWN = 1.2;

const Effects = {
  pool: [],
  live: 0,
  shakeAmount: 0,
  shakeX: 0,
  shakeY: 0,
  shakeCooldown: 0,

  init() {
    this.pool = [];
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) this.pool.push({ alive: false });
    this.live = 0;
    this.shakeAmount = 0;
    this.shakeCooldown = 0;
  },

  clear() {
    for (const p of this.pool) p.alive = false;
    this.live = 0;
    this.shakeAmount = 0;
    this.shakeCooldown = 0;
  },

  spawn(kind, x, y, vx, vy, life, size, color) {
    // Reuse a dead particle; when the pool is full, overwrite the oldest-looking one (lowest life left).
    let slot = null;
    let weakest = null;
    for (const p of this.pool) {
      if (!p.alive) {
        slot = p;
        break;
      }
      if (!weakest || p.life < weakest.life) weakest = p;
    }
    if (!slot) slot = weakest;
    else this.live++;
    slot.alive = true;
    slot.kind = kind;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.life = life;
    slot.maxLife = life;
    slot.size = size;
    slot.color = color;
    slot.angle = rand(0, Math.PI * 2);
    slot.spin = rand(-8, 8);
    return slot;
  },

  // ---- Emitters -------------------------------------------------------------------------

  smoke(x, y, count = 4, scale = 1) {
    for (let i = 0; i < count; i++) {
      this.spawn("smoke", x + rand(-8, 8) * scale, y + rand(-6, 4) * scale, rand(-14, 14), rand(-38, -16), rand(0.7, 1.3), rand(5, 10) * scale, LINE);
    }
  },

  muzzle(x, y, dir) {
    this.spawn("smoke", x, y, dir * rand(20, 40), rand(-20, -6), rand(0.25, 0.45), rand(3, 5), LINE);
    this.spawn("spark", x, y, dir * rand(80, 140), rand(-30, 10), 0.12, 6, YOLK);
  },

  sparks(x, y, count = 5, color = YOLK) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(90, 220);
      this.spawn("spark", x, y, Math.cos(a) * v, Math.sin(a) * v - 40, rand(0.15, 0.3), rand(5, 9), color);
    }
  },

  yolk(x, y, count = 6, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = rand(Math.PI * 1.1, Math.PI * 1.9);
      const v = rand(60, 170) * power;
      this.spawn("drop", x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.45, 0.8), rand(2, 4.5), i % 3 === 0 ? WHITE : YOLK);
    }
  },

  debris(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.spawn("debris", x + rand(-10, 10), y + rand(-10, 4), rand(-120, 120), rand(-220, -80), rand(0.8, 1.4), rand(6, 14), color);
    }
  },

  // Two or three eggshell halves that tumble away from an impact.
  shells(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      this.spawn("shell", x, y, rand(-90, 90), rand(-160, -60), rand(0.9, 1.4), rand(3.5, 5), WHITE);
    }
  },

  explosion(x, y, scale = 1, color = LINE) {
    this.spawn("ring", x, y, 0, 0, 0.35, 10 * scale, YOLK);
    this.sparks(x, y, Math.round(6 * scale));
    this.smoke(x, y, Math.round(5 * scale), scale);
    this.debris(x, y, Math.round(4 * scale), color);
  },

  shake(amount) {
    if (!settings.screenShake || amount < SHAKE_MIN) return;
    if (this.shakeCooldown > 0 && amount < SHAKE_BIG) return;
    this.shakeAmount = Math.min(14, Math.max(this.shakeAmount, amount));
    this.shakeCooldown = SHAKE_COOLDOWN;
  },

  // ---- Update & draw --------------------------------------------------------------------

  update(dt, terrain) {
    this.shakeAmount = Math.max(0, this.shakeAmount - dt * 30);
    this.shakeCooldown = Math.max(0, this.shakeCooldown - dt);
    const a = this.shakeAmount;
    this.shakeX = a ? rand(-a, a) : 0;
    this.shakeY = a ? rand(-a, a) : 0;
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        this.live--;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "smoke") {
        p.vx *= 1 - dt * 1.5;
        p.vy *= 1 - dt * 0.8;
        p.size += dt * 9;
      } else if (p.kind === "debris" || p.kind === "drop" || p.kind === "shell") {
        p.vy += GRAVITY * dt;
        p.angle += p.spin * dt;
        if (terrain && p.y >= terrain.yAt(p.x)) {
          p.y = terrain.yAt(p.x);
          p.vx *= 0.3;
          p.vy = p.kind === "drop" ? 0 : -p.vy * 0.25;
          p.spin *= 0.5;
        }
      } else if (p.kind === "ring") {
        p.size += dt * 140;
      }
    }
  },

  draw() {
    ctx.save();
    for (const p of this.pool) {
      if (!p.alive) continue;
      const t = p.life / p.maxLife;
      if (p.kind === "smoke") {
        ctx.globalAlpha = 0.35 * t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "spark") {
        ctx.globalAlpha = Math.min(1, t * 1.5);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        const len = p.size / Math.max(1, Math.hypot(p.vx, p.vy));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len);
        ctx.stroke();
      } else if (p.kind === "drop") {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === "debris") {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        const dx = Math.cos(p.angle) * p.size * 0.5;
        const dy = Math.sin(p.angle) * p.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - dx, p.y - dy);
        ctx.lineTo(p.x + dx, p.y + dy);
        ctx.stroke();
      } else if (p.kind === "shell") {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI);
        ctx.lineTo(-p.size * 0.5, -p.size * 0.25);
        ctx.lineTo(0, p.size * 0.1);
        ctx.lineTo(p.size * 0.5, -p.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (p.kind === "ring") {
        ctx.globalAlpha = t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
};

Effects.init();

// Hit flash: units draw in a contrasting color for a moment after taking a hit.
let flashColorOverride = null;

function withHitFlash(unit, drawFn) {
  if (!(unit.hitFlash > 0)) {
    drawFn();
    return;
  }
  flashColorOverride = Math.floor(unit.hitFlash * 30) % 2 === 0 ? LINE : YOLK;
  try {
    drawFn();
  } finally {
    flashColorOverride = null;
  }
}
